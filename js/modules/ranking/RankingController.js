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
            if (content) {
                content.innerHTML = '<div class="loader-container" style="display:flex; justify-content:center; align-items:center; height:60vh;"><div class="loader"></div></div>';
            }
            // Perform calculation and then render
            const players = await this.calculateSilently();
            if (window.RankingView) {
                window.RankingView.render(players);
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

                const [americanaMatchesArr, entrenoMatchesArr] = await Promise.all([
                    Promise.all(americanaIds.map(id => this.db.matches.getByAmericana(id))),
                    Promise.all(entrenoIds.map(id => this.db.entrenos_matches.getByAmericana(id)))
                ]);

                // Flatten match arrays
                const allAmeMatches = americanaMatchesArr.flat().filter(m => m.status === 'finished');
                const allEntMatches = entrenoMatchesArr.flat().filter(m => m.status === 'finished');

                // === AI OPTIMIZATION: USE CENTRALIZED SERVICE (AUDIT FIX) ===
                const ameStats = window.StandingsService.calculate(allAmeMatches, 'americana');
                const entStats = window.StandingsService.calculate(allEntMatches, 'entreno');

                // 3. Merge Stats into Player Profile
                const playersList = players.map(p => {
                    const ame = ameStats.find(s => s.uid === p.id) || {};
                    const ent = entStats.find(s => s.uid === p.id) || {};

                    return {
                        id: p.id,
                        name: p.name,
                        level: parseFloat(p.level || p.self_rate_level || 3.5),
                        gender: p.gender || 'chico',
                        photo_url: p.photo_url || null,
                        stats: {
                            americanas: {
                                points: ame.leaguePoints || 0, // Using 3-1-0 points
                                played: ame.played || 0,
                                won: ame.won || 0,
                                lost: ame.lost || 0,
                                gamesWon: ame.points || 0,
                                gamesLost: ame.gamesLost || 0,
                                court1Count: ame.court1Count || 0
                            },
                            entrenos: {
                                points: ent.leaguePoints || 0,
                                played: ent.played || 0,
                                won: ent.won || 0,
                                lost: ent.lost || 0,
                                gamesWon: ent.points || 0,
                                gamesLost: ent.gamesLost || 0,
                                court1Count: ent.court1Count || 0
                            }
                        }
                    };
                });

                // Store global ranking for other modules
                this.rankedPlayers = [...playersList].sort((a, b) => b.stats.americanas.points - a.stats.americanas.points);

                console.log("✅ [RankingController] Calculation optimized using StandingsService.");
                return playersList;

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
