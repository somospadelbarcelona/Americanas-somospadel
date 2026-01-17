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

                // 2. Process each valid event
                for (const event of validEvents) {
                    const eventType = event.type === 'entreno' ? 'entrenos' : 'americanas';
                    const matchCollection = event.type === 'entreno' ? this.db.entrenos_matches : this.db.matches;

                    let categoryRaw = (event.category || 'open').toLowerCase();
                    let categoryFinal = 'open';

                    // Normalize categories
                    if (categoryRaw === 'female' || categoryRaw === 'femenina') categoryFinal = 'female';
                    else if (categoryRaw === 'male' || categoryRaw === 'masculina') categoryFinal = 'male';
                    else if (categoryRaw === 'mixed' || categoryRaw === 'mixta') categoryFinal = 'mixed';
                    else categoryFinal = 'open';

                    console.log(`🏟️ [RankingController] Processing ${eventType}: "${event.name}" | Final Category: ${categoryFinal}`);

                    // Fetch matches for this event (using corrected service)
                    const matches = await matchCollection.getByAmericana(event.id);

                    matches.forEach(m => {
                        if (m.status !== 'finished') return;

                        const teamA = m.team_a_ids || [];
                        const teamB = m.team_b_ids || [];
                        const scoreA = parseInt(m.score_a || 0);
                        const scoreB = parseInt(m.score_b || 0);

                        // Helper to update player stats
                        const updatePlayer = (playerId, win, tie, gamesW, gamesL, court) => {
                            const p = playerStats[playerId];
                            if (!p) return;

                            const s = p.stats[eventType];
                            s.played++;
                            if (win) { s.won++; s.points += 3; }
                            else if (tie) { s.points += 1; }
                            else { s.lost++; }

                            s.gamesWon += gamesW;
                            s.gamesLost += gamesL;
                            if (parseInt(court) === 1) s.court1Count++;

                            // Category specific stats (Crucial for UI filters)
                            if (!s.categories[categoryFinal]) s.categories[categoryFinal] = { points: 0, played: 0, won: 0, lost: 0, court1Count: 0 };
                            const catUpdate = s.categories[categoryFinal];
                            catUpdate.played++;
                            if (win) { catUpdate.won++; catUpdate.points += 3; }
                            else if (tie) { catUpdate.points += 1; }
                            else { catUpdate.lost++; }
                            if (parseInt(court) === 1) catUpdate.court1Count = (catUpdate.court1Count || 0) + 1;
                        };

                        const isTie = scoreA === scoreB;
                        const aWin = scoreA > scoreB;

                        teamA.forEach(id => updatePlayer(id, aWin, isTie, scoreA, scoreB, m.court));
                        teamB.forEach(id => updatePlayer(id, !aWin, isTie, scoreB, scoreA, m.court));
                    });
                }

                const playersList = Object.values(playerStats);
                // Store global ranking for other modules
                this.rankedPlayers = [...playersList].sort((a, b) => b.stats.americanas.points - a.stats.americanas.points);

                console.log("✅ [RankingController] Silent calculation complete.");
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
