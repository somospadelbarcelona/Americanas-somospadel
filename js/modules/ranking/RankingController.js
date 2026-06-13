/**
 * RankingController.js
 * Enhanced calculation logic for Global Ranking
 */
(function () {
    class RankingController {
        constructor() {
            // Defensive check: FirebaseDB might not be loaded yet
            this.db = window.FirebaseDB || null;
            this.rawDb = window.db || null;
            this.rankings = {
                americanas: {}, // { category: [players] }
                entrenos: {}
            };

            // Cache properties for silent calculations to optimize Firestore read overhead
            this._cachedRanking = null;
            this._lastCacheTime = 0;

            // If FirebaseDB is not ready, wait for it
            if (!this.db) {
                console.warn("⚠️ [RankingController] FirebaseDB not ready yet, will retry on init()");
            }
        }

        /**
         * Get Level Range Template
         * Maps numeric level to Star Rating and Category Name
         */
        getLevelBadge(level) {
            const l = parseFloat(level || 3.5);
            if (l >= 4.5) return { stars: 5, label: 'ELITE', color: '#CCFF00', shadow: '0 0 15px #CCFF00' };
            if (l >= 4.0) return { stars: 4, label: 'PLATINUM', color: '#E5E4E2', shadow: '0 0 10px rgba(255,255,255,0.5)' };
            if (l >= 3.5) return { stars: 3, label: 'GOLD', color: '#FFD700', shadow: '0 0 10px rgba(255,215,0,0.5)' };
            if (l >= 3.0) return { stars: 2, label: 'SILVER', color: '#C0C0C0', shadow: 'none' };
            return { stars: 1, label: 'BRONZE', color: '#CD7F32', shadow: 'none' };
        }

        /**
         * Standard entry point for the "Ranking" tab.
         * Shows the loader and renders the full list.
         */
        async init() {
            const content = document.getElementById('content-area');
            if (!content) {
                console.error("❌ [RankingController] #content-area not found!");
                return;
            }

            // Pattern: Stale-While-Revalidate
            const render = (players) => {
                try {
                    if (window.RankingView) {
                        window.RankingView.render(players || []);
                    } else {
                        throw new Error("RankingView not found");
                    }
                } catch (e) {
                    console.error("❌ [RankingController] Render failed:", e);
                    content.innerHTML = `<div style="padding:40px; text-align:center; color:white;">
                        <h3>⚠️ Error de Visualización</h3>
                        <p>${e.message}</p>
                    </div>`;
                }
            };

            try {
                // 1. Try to load from cache first for instant UI
                const cachedRanking = await window.CacheService.get('general', 'global_ranking');
                if (cachedRanking && Array.isArray(cachedRanking)) {
                    console.log("⚡ [Ranking] Instant load from IndexedDB.");
                    render(cachedRanking);
                } else {
                    content.innerHTML = '<div class="loader-container" style="display:flex; justify-content:center; align-items:center; height:60vh;"><div class="loader"></div></div>';
                }

                // 2. Background Revalidation
                const freshRanking = await this.calculateSilently();

                // 3. Update UI
                // Always render fresh data to ensure we are not stuck with old/empty cache
                console.log("🔄 [Ranking] Updating UI with fresh data.");
                render(freshRanking);

                if (freshRanking && freshRanking.length > 0) {
                    await window.CacheService.set('general', 'global_ranking', freshRanking);
                }
            } catch (error) {
                console.error("❌ [RankingController] Critical error in init:", error);
                content.innerHTML = `<div style="padding:40px; text-align:center; color:white;">
                    <i class="fas fa-exclamation-triangle" style="font-size:3rem; color:#CCFF00; margin-bottom:20px;"></i>
                    <h2 style="font-weight:900;">ERROR AL CARGAR RANKING</h2>
                    <p style="color:#888;">${error.message}</p>
                    <button onclick="window.Router.navigate('dashboard')" style="background:#CCFF00; color:black; border:none; padding:12px 24px; border-radius:12px; font-weight:900; margin-top:20px; cursor:pointer;">VOLVER AL INICIO</button>
                </div>`;
            }
        }

        /**
         * Enuelve una promesa con un tiempo límite de expiración (timeout)
         */
        _withTimeout(promise, ms, defaultValue = []) {
            let timeoutId;
            const timeoutPromise = new Promise((resolve) => {
                timeoutId = setTimeout(() => {
                    console.warn(`⏳ [RankingController] Promesa expirada tras ${ms}ms. Usando valor por defecto.`);
                    resolve(defaultValue);
                }, ms);
            });
            return Promise.race([
                promise.then(val => {
                    clearTimeout(timeoutId);
                    return val;
                }),
                timeoutPromise
            ]);
        }

        /**
         * Data-only entry point for the Dashboard.
         * Calcs rankings without touching the #content-area DOM.
         */
        async calculateSilently() {
            console.log("📊 [RankingController] Silent calculation starting...");

            const now = Date.now();
            if (this._cachedRanking && (now - this._lastCacheTime < 600000)) {
                console.log("⚡ [RankingController] Returning recently cached ranking data (saving Firestore queries)");
                return this._cachedRanking;
            }

            // Fallback: si no tenemos la caché en memoria pero sí en IndexedDB, podemos usarla temporalmente
            if (!this._cachedRanking && window.CacheService) {
                try {
                    const localRanking = await window.CacheService.get('general', 'global_ranking');
                    if (localRanking && Array.isArray(localRanking) && localRanking.length > 0) {
                        console.log("💾 [RankingController] Loaded backup ranking from IndexedDB.");
                        this._cachedRanking = localRanking;
                    }
                } catch (err) {
                    console.warn("Error reading IndexedDB backup ranking:", err);
                }
            }

            // Check if FirebaseDB is available
            if ((!this.db || !this.rawDb) && window.FirebaseDB) {
                console.log("🔄 [RankingController] FirebaseDB now available, updating reference");
                this.db = window.FirebaseDB;
                this.rawDb = window.db;
            }

            if (!this.db || !this.rawDb) {
                console.error("❌ [RankingController] Firebase references not available!");
                return [];
            }

            try {
                // 1. Fetch All Data
                console.log("📡 [RankingController] Fetching players, americanas, and entrenos...");
                const [players, allAmericanas, allEntrenos] = await this._withTimeout(
                    Promise.all([
                        this.db.players.getAll() || [],
                        this.db.americanas.getAll() || [],
                        this.db.entrenos.getAll() || []
                    ]),
                    4000,
                    [[], [], []]
                );

                console.log(`✅ [RankingController] Loaded: ${players.length} players, ${allAmericanas.length} americanas, ${allEntrenos.length} entrenos`);

                const allEvents = [
                    ...allAmericanas.map(e => ({ ...e, type: 'americana' })),
                    ...allEntrenos.map(e => ({ ...e, type: 'entreno' }))
                ];

                const validEvents = allEvents.filter(a => {
                    const status = (a.status || "").toLowerCase();
                    // Include 'open' and 'live' so rankings/stats can start showing data even before finishing
                    const isValid = status === 'finished' || status === 'live' || status === 'in_progress' || status === 'open';
                    return isValid;
                });
                console.log(`🎯 [RankingController] Found ${validEvents.length} valid events (from ${allEvents.length} total)`);

                // Initialize stats for each player
                const playerStats = {};
                players.forEach(p => {
                    playerStats[p.id] = {
                        id: p.id,
                        name: p.name,
                        level: parseFloat(p.level || p.self_rate_level || 3.5),
                        gender: p.gender || 'chico',
                        photo_url: p.photo_url || null,
                        stats: {
                            americanas: { points: 0, played: 0, won: 0, lost: 0, gamesWon: 0, gamesLost: 0, court1Count: 0, categories: {} },
                            entrenos: { points: 0, played: 0, won: 0, lost: 0, gamesWon: 0, gamesLost: 0, court1Count: 0, categories: {} }
                        }
                    };
                });

                // 2. Fetch all matches for all unique events
                const americanaIds = allAmericanas.map(e => e.id);
                const entrenoIds = allEntrenos.map(e => e.id);

                console.log(`📡 [Ranking] Batch-fetching matches for ${americanaIds.length} americanas and ${entrenoIds.length} entrenos...`);

                // HELPER: Batch fetcher to avoid many small requests
                const fetchMatchesInBatches = async (collection, ids) => {
                    const BATCH_SIZE = 10; // Firestore 'in' limit (Reduced from 30 to fix FirebaseError)
                    let allResults = [];
                    if (!ids || ids.length === 0) return [];

                    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
                        const batch = ids.slice(i, i + BATCH_SIZE);
                        console.log(`📡 [Ranking] Fetching ${collection} batch ${i / BATCH_SIZE + 1}...`);
                        const snap = await this.rawDb.collection(collection)
                            .where('americana_id', 'in', batch)
                            .get();
                        allResults = allResults.concat(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                    }
                    return allResults;
                };

                const [allAmeMatchesRaw, allEntMatchesRaw] = await this._withTimeout(
                    Promise.all([
                        fetchMatchesInBatches('matches', americanaIds),
                        fetchMatchesInBatches('entrenos_matches', entrenoIds)
                    ]),
                    5000,
                    [[], []]
                );

                console.log(`📦 [RankingController] Raw matches: ${allAmeMatchesRaw.length} americana matches, ${allEntMatchesRaw.length} entreno matches`);

                // Filter valid matches: status finished OR matches with a recorded score
                const matchFilter = m => m.status === 'finished' || (parseInt(m.score_a || 0) + parseInt(m.score_b || 0)) > 0;
                const allAmeMatches = allAmeMatchesRaw.filter(matchFilter);
                const allEntMatches = allEntMatchesRaw.filter(matchFilter);

                console.log(`✅ [Ranking] Processed ${allAmeMatches.length + allEntMatches.length} valid matches (${allAmeMatches.length} americana + ${allEntMatches.length} entreno) from batch fetch.`);

                // 3. Process matches into categorized player stats
                const playerStatsMap = {};
                const eventMap = new Map(validEvents.map(e => [e.id, e]));

                const processMatchPool = (matches, viewKey) => {
                    matches.forEach(m => {
                        const evt = eventMap.get(m.americana_id);
                        if (!evt) return;

                        const rawCat = (evt.category || 'male').toLowerCase();
                        let cat = 'male';
                        if (rawCat.includes('fem')) cat = 'female';
                        else if (rawCat.includes('mix')) cat = 'mixed';
                        else if (rawCat === 'male' || rawCat.includes('masc')) cat = 'male';
                        else if (rawCat === 'open' || rawCat === 'todas') cat = 'male'; // Fallback or handle differently

                        const teamA = m.team_a_ids || [];
                        const teamB = m.team_b_ids || [];
                        const sA = parseInt(m.score_a || 0);
                        const sB = parseInt(m.score_b || 0);

                        const updateStats = (id, scoreSelf, scoreOther, isWon, isC1, court, round) => {
                            if (!playerStatsMap[id]) {
                                playerStatsMap[id] = {
                                    id, stats: {
                                        americanas: { points: 0, played: 0, won: 0, lost: 0, gamesWon: 0, gamesLost: 0, court1Count: 0, lastMatchCourt: 99, lastMatchRound: 0, categories: {} },
                                        entrenos: { points: 0, played: 0, won: 0, lost: 0, gamesWon: 0, gamesLost: 0, court1Count: 0, lastMatchCourt: 99, lastMatchRound: 0, categories: {} }
                                    }
                                };
                            }
                            const s = playerStatsMap[id].stats[viewKey];

                            // 1. Update Global View Stats
                            const isNewer = round >= (s.lastMatchRound || 0);
                            s.played++;
                            s.gamesWon += scoreSelf;
                            s.gamesLost += scoreOther;
                            if (isWon) { s.won++; s.points += 3; } else { s.lost++; }
                            if (isC1) s.court1Count++;
                            if (isNewer) {
                                s.lastMatchRound = round;
                                s.lastMatchCourt = parseInt(court || 99);
                            }

                            // 2. Update Category Stats
                            if (!s.categories[cat]) {
                                s.categories[cat] = { points: 0, played: 0, won: 0, lost: 0, gamesWon: 0, gamesLost: 0, court1Count: 0, lastMatchCourt: 99, lastMatchRound: 0 };
                            }
                            const cs = s.categories[cat];
                            cs.played++;
                            cs.gamesWon += scoreSelf;
                            cs.gamesLost += scoreOther;
                            if (isWon) { cs.won++; cs.points += 3; } else { cs.lost++; }
                            if (isC1) cs.court1Count++;
                            if (isNewer) {
                                cs.lastMatchRound = round;
                                cs.lastMatchCourt = parseInt(court || 99);
                            }
                        };

                        const isWonA = sA > sB;
                        const isWonB = sB > sA;
                        const isC1 = parseInt(m.court || 99) === 1;
                        const court = m.court || 99;
                        const round = m.round || 0;

                        teamA.forEach(id => updateStats(id, sA, sB, isWonA, isC1, court, round));
                        teamB.forEach(id => updateStats(id, sB, sA, isWonB, isC1, court, round));
                    });
                };

                processMatchPool(allAmeMatches, 'americanas');
                processMatchPool(allEntMatches, 'entrenos');

                // 4. Merge Stats into Player Profile
                this.rankedPlayers = players.map(p => {
                    const ps = playerStatsMap[p.id] || { stats: { americanas: { points: 0, played: 0, won: 0, lost: 0, gamesWon: 0, gamesLost: 0, court1Count: 0, categories: {} }, entrenos: { points: 0, played: 0, won: 0, lost: 0, gamesWon: 0, gamesLost: 0, court1Count: 0, categories: {} } } };

                    return {
                        id: p.id,
                        name: p.name,
                        level: parseFloat(p.level || p.self_rate_level || 3.5),
                        gender: p.gender || 'chico',
                        photo_url: p.photo_url || null,
                        stats: ps.stats,
                        badge: this.getLevelBadge(p.level || p.self_rate_level || 3.5)
                    };
                })
                    .sort((a, b) => {
                        const ptsA = (a.stats.americanas.points || 0) + (a.stats.entrenos.points || 0);
                        const ptsB = (b.stats.americanas.points || 0) + (b.stats.entrenos.points || 0);
                        if (ptsB !== ptsA) return ptsB - ptsA;

                        const winsA = (a.stats.americanas.won || 0) + (a.stats.entrenos.won || 0);
                        const winsB = (b.stats.americanas.won || 0) + (b.stats.entrenos.won || 0);
                        if (winsB !== winsA) return winsB - winsA;

                        const c1A = (a.stats.americanas.court1Count || 0) + (a.stats.entrenos.court1Count || 0);
                        const c1B = (b.stats.americanas.court1Count || 0) + (b.stats.entrenos.court1Count || 0);
                        if (c1B !== c1A) return c1B - c1A;

                        // Last match position (Final Court) - Lower is better
                        const lastCourtA = a.stats.entrenos.lastMatchCourt || 99;
                        const lastCourtB = b.stats.entrenos.lastMatchCourt || 99;
                        if (lastCourtA !== lastCourtB) return lastCourtA - lastCourtB;

                        const gamesA = (a.stats.americanas.gamesWon || 0) + (a.stats.entrenos.gamesWon || 0);
                        const gamesB = (b.stats.americanas.gamesWon || 0) + (b.stats.entrenos.gamesWon || 0);
                        return gamesB - gamesA;
                    });

                // Filter players with at least 1 match played
                const playersWithMatches = this.rankedPlayers.filter(p => {
                    const totalPlayed = (p.stats.americanas.played || 0) + (p.stats.entrenos.played || 0);
                    return totalPlayed > 0;
                });

                console.log(`✅ [RankingController] Ranking complete: ${playersWithMatches.length} players with matches (from ${this.rankedPlayers.length} total players)`);
                if (playersWithMatches.length > 0) {
                    console.log(`🏆 [RankingController] Top player: ${playersWithMatches[0]?.name} with ${(playersWithMatches[0]?.stats.americanas.points || 0) + (playersWithMatches[0]?.stats.entrenos.points || 0)} points`);
                } else {
                    console.warn(`⚠️ [RankingController] No players with match history found!`);
                }

                // Cache the successfully calculated ranking if not empty
                if (this.rankedPlayers && this.rankedPlayers.length > 0) {
                    this._cachedRanking = this.rankedPlayers;
                    this._lastCacheTime = Date.now();
                }

                return this.rankedPlayers;

            } catch (error) {
                console.error("❌ [RankingController] Error loading ranking:", error);
                return [];
            }
        }

        /**
         * Returns the current MVP (Top 1) from the latest calculated ranking
         */
        getTopPlayer() {
            return this.rankedPlayers && this.rankedPlayers.length > 0 ? this.rankedPlayers[0] : null;
        }
    }

    window.RankingControllerClass = RankingController;
    console.log("📊 RankingController Module Loaded (Class definition)");
})();
