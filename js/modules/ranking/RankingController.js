/**
 * RankingController.js
 * Enhanced calculation logic for Global Ranking
 */
(function () {
    class RankingController {
        constructor() {
            this.db = window.FirebaseDB;
            this.rankings = {
                americanas: {}, // { category: [players] }
                entrenos: {}
            };
        }

        /**
         * Standard entry point for the "Ranking" tab.
         * Shows the loader and renders the full list.
         */
        async init() {
            const content = document.getElementById('content-area');

            // Pattern: Stale-While-Revalidate
            const render = (players) => {
                if (window.RankingView) window.RankingView.render(players);
            };

            // 1. Try to load from cache first for instant UI
            const cachedRanking = await window.CacheService.get('general', 'global_ranking');
            if (cachedRanking) {
                console.log("⚡ [Ranking] Instant load from IndexedDB.");
                render(cachedRanking);
            } else {
                if (content) {
                    content.innerHTML = '<div class="loader-container" style="display:flex; justify-content:center; align-items:center; height:60vh;"><div class="loader"></div></div>';
                }
            }

            // 2. Background Revalidation
            const freshRanking = await this.calculateSilently();

            // 3. Update UI if changed
            if (JSON.stringify(cachedRanking) !== JSON.stringify(freshRanking)) {
                console.log("🔄 [Ranking] Cache updated with fresh data.");
                render(freshRanking);
                await window.CacheService.set('general', 'global_ranking', freshRanking);
            }
        }

        /**
         * Data-only entry point for the Dashboard.
         * Calcs rankings without touching the #content-area DOM.
         */
        async calculateSilently() {
            console.log("📊 [RankingController] Silent calculation starting...");
            try {
                // 1. Fetch All Data
                const [players, allAmericanas, allEntrenos] = await Promise.all([
                    this.db.players.getAll(),
                    this.db.americanas.getAll(),
                    this.db.entrenos.getAll()
                ]);

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
                console.log(`🎯 [RankingController] Found ${validEvents.length} events to process.`);

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
                    const BATCH_SIZE = 30; // Firestore 'in' limit
                    let allResults = [];
                    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
                        const batch = ids.slice(i, i + BATCH_SIZE);
                        const snap = await window.db.collection(collection)
                            .where('americana_id', 'in', batch)
                            .get();
                        allResults = allResults.concat(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                    }
                    return allResults;
                };

                const [allAmeMatchesRaw, allEntMatchesRaw] = await Promise.all([
                    fetchMatchesInBatches('matches', americanaIds),
                    fetchMatchesInBatches('entrenos_matches', entrenoIds)
                ]);

                // Filter valid matches: status finished OR matches with a recorded score
                const matchFilter = m => m.status === 'finished' || (parseInt(m.score_a || 0) + parseInt(m.score_b || 0)) > 0;
                const allAmeMatches = allAmeMatchesRaw.filter(matchFilter);
                const allEntMatches = allEntMatchesRaw.filter(matchFilter);

                console.log(`✅ [Ranking] Processed ${allAmeMatches.length + allEntMatches.length} matches from batch fetch.`);

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
                const playersList = players.map(p => {
                    const ps = playerStatsMap[p.id] || { stats: { americanas: { points: 0, played: 0, won: 0, lost: 0, gamesWon: 0, gamesLost: 0, court1Count: 0, categories: {} }, entrenos: { points: 0, played: 0, won: 0, lost: 0, gamesWon: 0, gamesLost: 0, court1Count: 0, categories: {} } } };

                    return {
                        id: p.id,
                        name: p.name,
                        level: parseFloat(p.level || p.self_rate_level || 3.5),
                        gender: p.gender || 'chico',
                        photo_url: p.photo_url || null,
                        stats: ps.stats
                    };
                });

                // Store global ranking for other modules
                // UNIFIED TIE-BREAKING LOGIC (Consistent with Pozo/Entrenos rules)
                this.rankedPlayers = [...playersList].sort((a, b) => {
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

                console.log("✅ [RankingController] Sorted with POZO Tie-Breaking. Top:", this.rankedPlayers[0]?.name);
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

    window.RankingController = new RankingController();
    console.log("🎮 RankingController v2 Initialized");
})();
