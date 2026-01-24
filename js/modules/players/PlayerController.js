/**
 * PlayerController.js
 * Enhanced with Big Data analytics and account management logic
 */
(function () {
    class PlayerController {
        constructor() {
            this.db = window.FirebaseDB;
            this.state = {
                stats: { matches: 0, won: 0, lost: 0, points: 0, winRate: 0, gamesWon: 0, gamesLost: 0 },
                recentMatches: [],
                levelHistory: [],
                communityAvg: 3.5
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

            // Real-time listener for personal matches to update stats instantly
            if (this.unsubMatches) this.unsubMatches();
            if (this.unsubEntrenos) this.unsubEntrenos();

            const updateStats = async () => {
                await this.fetchPlayerData(userId);
            };

            this.unsubMatches = window.db.collection('matches')
                .where('team_a_ids', 'array-contains', userId)
                .onSnapshot(updateStats);
            this.unsubMatchesB = window.db.collection('matches')
                .where('team_b_ids', 'array-contains', userId)
                .onSnapshot(updateStats);

            this.unsubEntrenos = window.db.collection('entrenos_matches')
                .where('team_a_ids', 'array-contains', userId)
                .onSnapshot(updateStats);
            this.unsubEntrenosB = window.db.collection('entrenos_matches')
                .where('team_b_ids', 'array-contains', userId)
                .onSnapshot(updateStats);

            await this.fetchPlayerData(userId);
        }

        _parseDate(date) {
            if (!date || date === '---') return null;

            // Handle Firestore Timestamps
            if (date.toDate && typeof date.toDate === 'function') {
                return date.toDate();
            }

            // Handle ISO strings or other date strings
            if (typeof date === 'string') {
                try {
                    if (date.includes('/')) {
                        const [d, m, y] = date.split('/');
                        return new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T00:00:00`);
                    }
                    const d = new Date(date);
                    return isNaN(d.getTime()) ? null : d;
                } catch (e) { return null; }
            }

            // Handle number (timestamps) or already Date objects
            const d = new Date(date);
            return isNaN(d.getTime()) ? null : d;
        }

        async fetchPlayerData(userId) {
            try {
                // 1. Fetch player data and ALL personal matches
                const [userDoc, personalMatches] = await Promise.all([
                    this.db.players.getById(userId),
                    this.db.matches.getByPlayer(userId)
                ]);

                let stats = { matches: 0, won: 0, lost: 0, points: 0, winRate: 0, gamesWon: 0, gamesLost: 0 };
                let matchesList = [];

                // 2. Process each match
                personalMatches.forEach(m => {
                    // Inclusion rule: must be finished OR have a score (for live updates)
                    const sA = parseInt(m.score_a || 0);
                    const sB = parseInt(m.score_b || 0);
                    const isFinished = m.status === 'finished' || (sA + sB > 0);

                    if (!isFinished) return;

                    const isTeamA = (m.team_a_ids || []).includes(userId);
                    const isTeamB = (m.team_b_ids || []).includes(userId);

                    if (isTeamA || isTeamB) {
                        stats.matches++;

                        // Detailed games tracking
                        if (isTeamA) {
                            stats.gamesWon += sA;
                            stats.gamesLost += sB;
                        } else {
                            stats.gamesWon += sB;
                            stats.gamesLost += sA;
                        }

                        const iWon = (isTeamA && sA > sB) || (isTeamB && sB > sA);
                        const isTie = sA === sB;

                        if (iWon) { stats.won++; stats.points += 3; }
                        else if (isTie) { stats.points += 1; }
                        else { stats.lost++; }

                        // Format match for history
                        const matchDate = this._parseDate(m.date || m.createdAt || m.created_at);
                        const dateStr = matchDate ? matchDate.toISOString() : '---';

                        matchesList.push({
                            id: m.id,
                            date: dateStr,
                            eventName: m.americana_name || m.event_name || (m.collection === 'entrenos_matches' ? 'Entreno' : 'Americana'),
                            score: `${sA} - ${sB}`,
                            result: iWon ? 'W' : (isTie ? 'D' : 'L'),
                            color: iWon ? '#22c55e' : (isTie ? '#94a3b8' : '#ef4444')
                        });
                    }
                });

                // Sort matches by date descending
                matchesList.sort((a, b) => {
                    const dateA = this._parseDate(a.date) || new Date(0);
                    const dateB = this._parseDate(b.date) || new Date(0);
                    return dateB - dateA;
                });
                stats.winRate = stats.matches > 0 ? Math.round((stats.won / stats.matches) * 100) : 0;

                // 3. Level History (Wrapped in try/catch to avoid non-indexed query crash)
                let levelHistory = [];
                try {
                    const historySnap = await window.db.collection('level_history')
                        .where('userId', '==', userId)
                        .orderBy('date', 'desc')
                        .limit(10)
                        .get();

                    levelHistory = historySnap.docs.map(doc => ({
                        level: doc.data().level,
                        date: doc.data().date
                    })).reverse();
                } catch (e) {
                    console.warn("[PlayerController] History index missing or query failed:", e);
                }

                // 4. Community Insights & Name Mapping
                let communityAvg = 3.5;
                const nameMap = {};
                try {
                    const allPlayersSnap = await window.db.collection('players').get();
                    let totalLevel = 0;
                    allPlayersSnap.docs.forEach(doc => {
                        const pdata = doc.data();
                        totalLevel += parseFloat(pdata.level || 3.5);
                        nameMap[doc.id] = pdata.name || 'Jugador';
                    });
                    communityAvg = parseFloat((totalLevel / (allPlayersSnap.docs.length || 1)).toFixed(2));
                } catch (e) { console.warn("[PlayerController] Error calculating community avg:", e); }

                // If empty history, seed with current level
                if (levelHistory.length === 0 && userDoc) {
                    const currentLvl = parseFloat(userDoc.level || 3.5);
                    levelHistory = [{ level: currentLvl, date: new Date().toISOString() }];
                }

                // 5. Reliability Calculation (Semáforo de Nivel)
                let reliabilityStatus = 'RED'; // Default: Provisional
                const today = new Date();
                const lastMatch = matchesList.length > 0 ? this._parseDate(matchesList[0].date) : null;

                if (stats.matches >= 5) {
                    if (lastMatch) {
                        const diffTime = Math.abs(today - lastMatch);
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                        if (diffDays <= 15) {
                            reliabilityStatus = 'GREEN'; // Fiable (Activo reciente + experiencia)
                        } else if (diffDays <= 30) {
                            reliabilityStatus = 'YELLOW'; // Oxidado? (Inactivo 2-4 semanas)
                        } else {
                            reliabilityStatus = 'ORANGE'; // Inactivo (> 1 mes)
                        }
                    } else {
                        reliabilityStatus = 'RED'; // No hay fecha válida, error o muy antiguo
                    }
                } else if (stats.matches >= 1) {
                    reliabilityStatus = 'YELLOW'; // Pocos partidos (1-4), nivel no consolidado
                } else {
                    reliabilityStatus = 'RED'; // Sin partidos (Nivel teórico)
                }

                this.state = {
                    stats,
                    recentMatches: matchesList.slice(0, 5),
                    levelHistory: levelHistory,
                    communityAvg: communityAvg,
                    fullData: userDoc,
                    reliability: reliabilityStatus, // Expose reliability
                    aiInsights: this.generateAIInsights(matchesList, stats),
                    badges: this.calculateBadges(matchesList, stats),
                    h2h: this.calculateTopRivals(matchesList, userId, nameMap)
                };

                window.Store.setState('playerStats', this.state);
                console.log("[PlayerController] Data updated, rendering view...");
                if (window.PlayerView) window.PlayerView.render();

            } catch (error) {
                console.error("Critical Error in fetchPlayerData:", error);
                // Try to render even with partial data to avoid black screen
                if (window.PlayerView) window.PlayerView.render();
            }
        }

        calculateBadges(matches, stats) {
            const badges = [];

            // 1. Rey de la Pista (5 victorias seguidas)
            let currentStreak = 0;
            let maxStreak = 0;
            [...matches].reverse().forEach(m => {
                if (m.result === 'W') {
                    currentStreak++;
                    if (currentStreak > maxStreak) maxStreak = currentStreak;
                } else {
                    currentStreak = 0;
                }
            });
            if (maxStreak >= 5) badges.push({ id: 'king', title: 'Rey de la Pista', icon: '👑', desc: '5+ Victorias consecutivas', color: '#FFD700' });

            // 2. Madrugador (Inscrito en 3 entrenos de mañana - < 12:00)
            // Nota: Esta lógica asume que el nombre del evento o un campo 'time' indica la hora.
            // Por ahora usaremos una simulación basada en el volumen de partidos si no hay hora exacta.
            if (stats.matches >= 10) badges.push({ id: 'early', title: 'Madrugador', icon: '☀️', desc: 'Fiel a los entrenos matinales', color: '#FF9800' });

            // 3. Muro de Berlín (Menos juegos recibidos - Promedio < 3 por partido en las últimas 5)
            if (matches.length >= 5) {
                const recent = matches.slice(0, 5);
                const avgLost = recent.reduce((acc, m) => {
                    const games = m.score ? parseInt(m.score.split('-')[1]) : 0;
                    return acc + games;
                }, 0) / 5;
                if (avgLost <= 3) badges.push({ id: 'wall', title: 'Muro de Berlín', icon: '🧱', desc: 'Defensa impenetrable', color: '#94a3b8' });
            }

            // 4. Veterano (20+ partidos)
            if (stats.matches >= 20) badges.push({ id: 'veteran', title: 'Leyenda SP', icon: '🎖️', desc: 'Más de 20 batallas oficiales', color: '#CCFF00' });

            return badges;
        }

        calculateTopRivals(matches, userId, nameMap = {}) {
            const rivals = {};
            matches.forEach(m => {
                // Determine rivals (players in the OTHER team)
                const isTeamA = m.team_a_ids && m.team_a_ids.includes(userId);
                const opponentIds = isTeamA ? m.team_b_ids : m.team_a_ids;
                const result = m.result; // 'W', 'L', 'D'

                if (opponentIds) {
                    opponentIds.forEach(rid => {
                        if (!rivals[rid]) rivals[rid] = { id: rid, name: nameMap[rid] || 'Jugador', matches: 0, wins: 0 };
                        rivals[rid].matches++;
                        if (result === 'W') rivals[rid].wins++;
                    });
                }
            });

            // Convert to array and sort by matches played
            return Object.values(rivals)
                .sort((a, b) => b.matches - a.matches)
                .slice(0, 3); // Top 3 Rivals
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
            const stats = this.state.stats || { matches: 0, won: 0, lost: 0, points: 0, winRate: 0, gamesWon: 0, gamesLost: 0 };
            const level = parseFloat(user ? (user.level || 3.5) : 3.5);

            const totalGames = (stats.gamesWon || 0) + (stats.gamesLost || 0);
            const gamesEfficacy = totalGames > 0 ? Math.round((stats.gamesWon / totalGames) * 100) : 0;
            const pointsNormalized = Math.min(100, (stats.points || 0) * 2); // 50 pts = 100%
            const levelProgress = Math.min(100, Math.round((level / 7.5) * 100)); // Level 7.5 = 100%

            return {
                winRate: stats.winRate || 0,
                gamesRatio: gamesEfficacy,
                points: pointsNormalized,
                level: levelProgress
            };
        }
    }

    window.PlayerController = new PlayerController();
    console.log("📱 PlayerController v2 (Big Data) Loaded");
})();
