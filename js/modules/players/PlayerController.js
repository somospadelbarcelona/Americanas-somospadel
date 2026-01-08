/**
 * PlayerController.js
 * Enhanced with Big Data analytics and account management logic
 */
(function () {
    class PlayerController {
        constructor() {
            this.db = window.FirebaseDB;
            this.state = {
                stats: { matches: 0, won: 0, lost: 0, points: 0, winRate: 0 },
                recentMatches: []
            };
        }

        async init() {
            const user = window.Store.getState('currentUser');
            if (!user) {
                console.warn("[PlayerController] No user found in Store");
                return;
            }

            console.log("[PlayerController] Initializing Profile for:", user.name);
            const userId = user.id || user.uid;
            if (!userId) {
                console.error("[PlayerController] User object has no ID or UID", user);
                return;
            }
            await this.fetchPlayerData(userId);
        }

        async fetchPlayerData(userId) {
            try {
                // 1. Fetch all finished events and player data
                const [allEvents, userDoc] = await Promise.all([
                    this.db.americanas.getAll(),
                    this.db.players.getById(userId)
                ]);

                const finishedEvents = allEvents.filter(a => a.status === 'finished');
                let matchesList = [];
                let stats = { matches: 0, won: 0, lost: 0, points: 0, winRate: 0, gamesWon: 0, gamesLost: 0 };

                // 2. Process each event to find user matches
                for (const event of finishedEvents) {
                    const eventMatches = await this.db.matches.getByAmericana(event.id);
                    eventMatches.forEach(m => {
                        if (!m.isFinished) return;

                        const isTeamA = (m.team_a_ids || []).includes(userId);
                        const isTeamB = (m.team_b_ids || []).includes(userId);

                        if (isTeamA || isTeamB) {
                            stats.matches++;
                            const scoreA = parseInt(m.scoreA || 0);
                            const scoreB = parseInt(m.scoreB || 0);

                            // Detailed games tracking
                            if (isTeamA) {
                                stats.gamesWon += scoreA;
                                stats.gamesLost += scoreB;
                            } else {
                                stats.gamesWon += scoreB;
                                stats.gamesLost += scoreA;
                            }

                            const iWon = (isTeamA && scoreA > scoreB) || (isTeamB && scoreB > scoreA);
                            const isTie = scoreA === scoreB;

                            if (iWon) { stats.won++; stats.points += 3; }
                            else if (isTie) { stats.points += 1; }
                            else { stats.lost++; }

                            // Format match for history
                            matchesList.push({
                                id: m.id,
                                date: event.date,
                                eventName: event.name,
                                score: `${scoreA} - ${scoreB}`,
                                result: iWon ? 'W' : (isTie ? 'D' : 'L'),
                                color: iWon ? '#22c55e' : (isTie ? '#94a3b8' : '#ef4444')
                            });
                        }
                    });
                }

                // Sort matches by date descending
                matchesList.sort((a, b) => new Date(b.date) - new Date(a.date));
                stats.winRate = stats.matches > 0 ? Math.round((stats.won / stats.matches) * 100) : 0;

                this.state = {
                    stats,
                    recentMatches: matchesList.slice(0, 5),
                    fullData: userDoc,
                    aiInsights: this.generateAIInsights(matchesList, stats)
                };

                window.Store.setState('playerStats', this.state);
                if (window.PlayerView) window.PlayerView.render();

            } catch (error) {
                console.error("Error fetching player profile data:", error);
            }
        }

        generateAIInsights(matches, stats) {
            if (matches.length === 0) return null;

            // 1. Detect Streaks
            let streak = 0;
            for (let i = 0; i < matches.length; i++) {
                if (matches[i].result === 'W') streak++;
                else break;
            }

            // 2. Identify Patterns
            const winRate = stats.winRate;
            let summary = "";
            let badge = "";

            if (streak >= 3) {
                summary = `¡Estás en racha! Has ganado tus últimos ${streak} partidos. Tu nivel de confianza está por las nubes.`;
                badge = "EN RACHA 🔥";
            } else if (winRate > 60) {
                summary = "Eres un jugador dominante. Tu ratio de victorias indica que eres el motor de tus parejas en la pista.";
                badge = "DOMINANTE 👑";
            } else if (winRate > 40) {
                summary = "Eres un jugador equilibrado y fiable. Mantienes la consistencia en partidos de alta presión.";
                badge = "EQUILIBRADO ⚖️";
            } else {
                summary = "Estás en fase de aprendizaje constante. Sigue sumando partidos para ajustar tu táctica y subir el WR.";
                badge = "EN PROGRESO 💪";
            }

            // 3. Key Insights
            const insights = [];
            if (streak > 1) insights.push({ icon: '🔥', text: `Racha actual: ${streak} victorias` });
            if (stats.points > 20) insights.push({ icon: '🏆', text: "Veterano del circuito SomosPadel" });

            return {
                summary,
                badge,
                insights
            };
        }

        async updatePhoto(photoUrl) {
            const user = window.Store.getState('currentUser');
            try {
                await this.db.players.update(user.id, { photo_url: photoUrl });
                // Update local state
                const newUser = { ...user, photo_url: photoUrl };
                window.Store.setState('currentUser', newUser);
                await this.init();
                return { success: true };
            } catch (error) {
                return { success: false, error: error.message };
            }
        }

        async updatePassword(newPassword) {
            const user = window.Store.getState('currentUser');
            try {
                // Security check would go here in a real app (re-auth)
                await this.db.players.update(user.id, { password: newPassword });
                return { success: true };
            } catch (error) {
                return { success: false, error: error.message };
            }
        }

        /**
         * Derives skill attributes based on level and performance
         */
        getCalculatedSkills() {
            const user = window.Store.getState('currentUser');
            const stats = this.state.stats;
            const level = parseFloat(user ? (user.level || 3.5) : 3.5);
            const winRate = stats.winRate || 0;

            // Simple heuristic mapping
            // Higher level = better base skills
            // High win rate = boost specifically to Control and Defense
            return {
                power: Math.min(99, Math.round(level * 12 + (winRate / 10))),
                control: Math.min(99, Math.round(level * 10 + (winRate / 5))),
                net: Math.min(99, Math.round(level * 11 + (winRate / 8))),
                defense: Math.min(99, Math.round(level * 9 + (winRate / 4)))
            };
        }
    }

    window.PlayerController = new PlayerController();
    console.log("📱 PlayerController v2 (Big Data) Loaded");
})();
