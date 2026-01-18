/**
 * CaptainService.js
 * The brain behind "Capitán SomosPadel".
 * Analyzes player history to provide heuristic insights.
 */
(function () {
    class CaptainService {
        constructor() {
            this.heuristics = [
                this.analyzeActivity,
                this.analyzeStreak,
                this.analyzePartners,
                this.analyzeRivals
            ];
        }

        /**
         * Main entry point to get insights for a user.
         * @param {Object} user - The current user object.
         * @param {Array} matchHistory - Array of past matches.
         * @param {Object} eventDoc - Optional: Specific event to analyze (for post-event analysis)
         * @returns {Array} List of insight objects { type, message, level }
         */
        analyze(user, matchHistory, eventDoc = null) {
            if (!user || !matchHistory || matchHistory.length === 0) {
                const name = user && user.name ? user.name.split(' ')[0].toUpperCase() : 'JUGADOR';
                return [{
                    type: 'welcome',
                    level: 'info',
                    icon: '👋',
                    title: `¡BIENVENIDO, ${name}!`,
                    message: 'Soy tu Capitán. Juega unos cuantos partidos para que pueda analizar tu estilo.'
                }];
            }

            const insights = [];
            const finishedMatches = matchHistory.filter(m => m.status === 'finished' || m.isFinished);

            // 0. EVENT-SPECIFIC ANALYSIS (if provided)
            if (eventDoc) {
                const eventInsights = this.analyzeEventPerformance(user, finishedMatches, eventDoc);
                insights.push(...eventInsights);
            } else {
                // 1. CAREER SUMMARY (Always first for general analysis)
                insights.push(this.getCareerSummary(user, finishedMatches));

                // Run all heuristics
                this.heuristics.forEach(h => {
                    const result = h.call(this, user, finishedMatches);
                    if (result) insights.push(result);
                });
            }

            // Fallback if no specific insights found
            if (insights.length === 0) {
                insights.push({
                    type: 'generic',
                    level: 'info',
                    icon: '🎾',
                    title: 'Todo en orden',
                    message: 'Sigue jugando para desbloquear más estadísticas avanzadas.'
                });
            }

            return insights;
        }

        getCareerSummary(user, matches) {
            let wins = 0;
            let totalGames = 0;

            matches.forEach(m => {
                if (this._didUserWin(user, m)) wins++;
                const sA = parseInt(m.score_a || 0);
                const sB = parseInt(m.score_b || 0);
                totalGames += (sA + sB);
            });

            const winRate = matches.length > 0 ? Math.round((wins / matches.length) * 100) : 0;

            return {
                type: 'summary',
                level: 'info',
                icon: '📊',
                title: 'TU EXPEDIENTE X',
                message: `
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:5px;">
                        <div style="background:rgba(255,255,255,0.05); padding:8px; border-radius:8px; text-align:center;">
                            <div style="font-size:1.2rem; font-weight:900; color:#fff;">${matches.length}</div>
                            <div style="font-size:0.55rem; color:#888;">PARTIDOS</div>
                        </div>
                        <div style="background:rgba(255,255,255,0.05); padding:8px; border-radius:8px; text-align:center;">
                            <div style="font-size:1.2rem; font-weight:900; color:${winRate >= 50 ? '#4ade80' : '#f87171'};">${winRate}%</div>
                            <div style="font-size:0.55rem; color:#888;">WIN RATE</div>
                        </div>
                    </div>
                `
            };
        }

        /**
         * Analiza el rendimiento del usuario en un evento específico (Entreno)
         * @param {Object} user - Usuario actual
         * @param {Array} allMatches - Historial completo de partidos del usuario
         * @param {Object} eventDoc - Documento del evento a analizar
         * @returns {Array} Insights específicos del evento
         */
        analyzeEventPerformance(user, allMatches, eventDoc) {
            const insights = [];
            const name = user.name ? user.name.split(' ')[0].toUpperCase() : 'JUGADOR';

            // 1. FILTRADO ULTRA-ESTRICTO: ÚNICAMENTE partidos donde el usuario entró a pista
            const searchName = user.name.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

            const eventMatches = allMatches.filter(m => {
                const isCorrectEvent = m.event_id === eventDoc.id || m.americana_id === eventDoc.id;
                if (!isCorrectEvent) return false;

                const teamA_IDs = m.team_a_ids || [];
                const teamB_IDs = m.team_b_ids || [];

                const checkInTeam = (names) => {
                    if (!names) return false;
                    const combined = (Array.isArray(names) ? names.join(' ') : String(names)).toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    const tokens = user.name.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(' ').filter(t => t.length > 2);
                    return tokens.every(t => combined.includes(t));
                };

                const inA = teamA_IDs.includes(user.uid) || checkInTeam(m.team_a_names);
                const inB = teamB_IDs.includes(user.uid) || checkInTeam(m.team_b_names);

                return (inA || inB);
            });

            if (eventMatches.length === 0) {
                return [{
                    type: 'event_summary',
                    level: 'info',
                    icon: '🎾',
                    title: `EVENTO FINALIZADO`,
                    message: `¡Hola ${name}! He analizado el evento pero no he encontrado partidos donde participaras directamente.`
                }];
            }

            // 2. FILTRADO DE UNICIDAD POR RONDA
            const matchesByRound = {};
            eventMatches.forEach(m => {
                const r = m.round || Math.random(); // Si no hay ronda, tratar como único o azar
                if (!matchesByRound[r]) {
                    matchesByRound[r] = m;
                } else {
                    // Prioridad a partidos con UID real
                    const hasUID = (m.team_a_ids || []).includes(user.uid) || (m.team_b_ids || []).includes(user.uid);
                    if (hasUID) matchesByRound[r] = m;
                }
            });

            let uniqueMatches = Object.values(matchesByRound).sort((a, b) => (a.round || 0) - (b.round || 0));

            // Límite de seguridad: Nadie juega 24 partidos en un entreno. 
            // Si el sistema detecta locuras, limitamos a las 6 u 8 rondas estándar.
            if (uniqueMatches.length > 9) {
                uniqueMatches = uniqueMatches.slice(0, 8);
            }

            // 1. RESUMEN DEL EVENTO
            let wins = 0;
            let totalPoints = 0;
            let totalPointsAgainst = 0;
            const partners = new Set();
            const roundsArr = new Set();

            uniqueMatches.forEach(m => {
                const won = this._didUserWin(user, m);
                if (won) wins++;

                const sA = parseInt(m.score_a || 0);
                const sB = parseInt(m.score_b || 0);

                const teamA = m.team_a_ids || [];
                const namesA = m.team_a_names || [];
                const name = user.name || "";
                const isTeamA = teamA.includes(user.uid) || (Array.isArray(namesA) ? namesA.some(n => n && n.includes(name)) : (typeof namesA === 'string' && namesA.includes(name)));

                totalPoints += isTeamA ? sA : sB;
                totalPointsAgainst += isTeamA ? sB : sA;

                const partner = this._getPartner(user, m);
                if (partner) partners.add(partner);
                if (m.round) roundsArr.add(m.round);
            });

            const matchCount = uniqueMatches.length;
            const winRate = matchCount > 0 ? Math.round((wins / matchCount) * 100) : 0;
            const avgPointsFor = matchCount > 0 ? (totalPoints / matchCount).toFixed(1) : "0.0";
            const avgPointsAgainst = matchCount > 0 ? (totalPointsAgainst / matchCount).toFixed(1) : "0.0";

            // Determinar nivel de rendimiento
            let performanceIcon = '📊';
            let performanceTitle = 'RENDIMIENTO SÓLIDO';
            let performanceLevel = 'info';
            let performanceMessage = `Has jugado <b>${matchCount} partidos</b> en ${roundsArr.size} rondas.`;

            if (winRate >= 75) {
                performanceIcon = '🏆';
                performanceTitle = '¡ACTUACIÓN ESTELAR!';
                performanceLevel = 'success';
                performanceMessage = `<b>${wins}/${matchCount} victorias</b> (${winRate}%). Dominaste la pista hoy, ${name}.`;
            } else if (winRate >= 50) {
                performanceIcon = '💪';
                performanceTitle = 'RENDIMIENTO COMPETITIVO';
                performanceLevel = 'info';
                performanceMessage = `<b>${wins}/${matchCount} victorias</b> (${winRate}%). Balance positivo, sigue así.`;
            } else if (winRate >= 25) {
                performanceIcon = '⚡';
                performanceTitle = 'DÍA DE APRENDIZAJE';
                performanceLevel = 'warning';
                performanceMessage = `<b>${wins}/${matchCount} victorias</b> (${winRate}%). Todos tenemos días difíciles. Analiza y vuelve más fuerte.`;
            } else {
                performanceIcon = '🎯';
                performanceTitle = 'DESAFÍO ACEPTADO';
                performanceLevel = 'warning';
                performanceMessage = `<b>${wins}/${matchCount} victorias</b> (${winRate}%). Hoy fue duro, pero cada derrota es una lección.`;
            }

            insights.push({
                type: 'event_summary',
                level: performanceLevel,
                icon: performanceIcon,
                title: performanceTitle,
                message: `
                    ${performanceMessage}
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:10px;">
                        <div style="background:rgba(255,255,255,0.05); padding:8px; border-radius:8px; text-align:center;">
                            <div style="font-size:1.1rem; font-weight:900; color:#4ade80;">${avgPointsFor}</div>
                            <div style="font-size:0.55rem; color:#888;">PUNTOS A FAVOR</div>
                        </div>
                        <div style="background:rgba(255,255,255,0.05); padding:8px; border-radius:8px; text-align:center;">
                            <div style="font-size:1.1rem; font-weight:900; color:#f87171;">${avgPointsAgainst}</div>
                            <div style="font-size:0.55rem; color:#888;">PUNTOS EN CONTRA</div>
                        </div>
                    </div>
                `
            });

            // 2. MEJOR PAREJA DEL DÍA
            const partnerStats = {};
            eventMatches.forEach(m => {
                const partner = this._getPartner(user, m);
                if (partner) {
                    if (!partnerStats[partner]) partnerStats[partner] = { played: 0, won: 0 };
                    partnerStats[partner].played++;
                    if (this._didUserWin(user, m)) partnerStats[partner].won++;
                }
            });

            let bestPartner = null;
            let bestPartnerRate = 0;
            Object.keys(partnerStats).forEach(p => {
                const rate = partnerStats[p].won / partnerStats[p].played;
                if (rate > bestPartnerRate || (rate === bestPartnerRate && partnerStats[p].played > (partnerStats[bestPartner]?.played || 0))) {
                    bestPartnerRate = rate;
                    bestPartner = p;
                }
            });

            if (bestPartner && partnerStats[bestPartner].played >= 2) {
                const record = `${partnerStats[bestPartner].won}-${partnerStats[bestPartner].played - partnerStats[bestPartner].won}`;
                insights.push({
                    type: 'best_partner',
                    level: 'info',
                    icon: '🤝',
                    title: 'MEJOR PAREJA HOY',
                    message: `Con <b>${bestPartner}</b> hicisteis un gran equipo.<br>Récord: <span style="color:#CCFF00; font-weight:800;">${record}</span> (${Math.round(bestPartnerRate * 100)}%).`
                });
            }

            // 3. EVOLUCIÓN ENTRE RONDAS (si hay múltiples rondas)
            if (rounds.size >= 3) {
                const roundPerformance = {};
                eventMatches.forEach(m => {
                    const round = m.round || 1;
                    if (!roundPerformance[round]) roundPerformance[round] = { wins: 0, total: 0 };
                    roundPerformance[round].total++;
                    if (this._didUserWin(user, m)) roundPerformance[round].wins++;
                });

                const sortedRounds = Object.keys(roundPerformance).sort((a, b) => parseInt(a) - parseInt(b));
                const firstHalf = sortedRounds.slice(0, Math.ceil(sortedRounds.length / 2));
                const secondHalf = sortedRounds.slice(Math.ceil(sortedRounds.length / 2));

                const firstHalfWinRate = firstHalf.reduce((sum, r) => sum + roundPerformance[r].wins, 0) / firstHalf.reduce((sum, r) => sum + roundPerformance[r].total, 0);
                const secondHalfWinRate = secondHalf.reduce((sum, r) => sum + roundPerformance[r].wins, 0) / secondHalf.reduce((sum, r) => sum + roundPerformance[r].total, 0);

                if (secondHalfWinRate > firstHalfWinRate + 0.2) {
                    insights.push({
                        type: 'evolution',
                        level: 'success',
                        icon: '📈',
                        title: 'CURVA ASCENDENTE',
                        message: `Mejoraste notablemente en la segunda mitad del entreno. <b>Excelente capacidad de adaptación.</b>`
                    });
                } else if (firstHalfWinRate > secondHalfWinRate + 0.2) {
                    insights.push({
                        type: 'evolution',
                        level: 'warning',
                        icon: '📉',
                        title: 'BAJÓN DE ENERGÍA',
                        message: `Empezaste fuerte pero bajaste el ritmo. Trabaja la resistencia física y mental.`
                    });
                }
            }

            // 4. RECOMENDACIÓN PERSONALIZADA
            const recommendation = this._getEventRecommendation(winRate, avgPointsFor, avgPointsAgainst, eventMatches.length);
            if (recommendation) insights.push(recommendation);

            return insights;
        }

        /**
         * Guarda el análisis en Firestore para historial
         */
        async saveAnalysis(userId, eventDoc, insights) {
            if (!userId || !eventDoc || !insights) return;

            try {
                await window.db.collection('players').doc(userId).collection('captain_reports').add({
                    eventId: eventDoc.id,
                    eventName: eventDoc.name,
                    eventType: eventDoc.type || 'entreno',
                    eventDate: eventDoc.date,
                    insights: insights,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    createdAt: new Date().toISOString()
                });
                console.log("✅ [Captain] Analysis saved to history");
            } catch (e) {
                console.error("❌ [Captain] Failed to save analysis:", e);
            }
        }

        /**
         * Obtiene el historial de análisis del usuario
         */
        async getAnalysisHistory(userId, limit = 10) {
            if (!userId) return [];

            try {
                const snap = await window.db.collection('players').doc(userId)
                    .collection('captain_reports')
                    .orderBy('timestamp', 'desc')
                    .limit(limit)
                    .get();

                return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (e) {
                console.error("❌ [Captain] Failed to load history:", e);
                return [];
            }
        }

        /**
         * Genera una recomendación personalizada basada en el rendimiento
         */
        _getEventRecommendation(winRate, avgFor, avgAgainst, matchCount) {
            if (winRate >= 70) {
                return {
                    type: 'recommendation',
                    level: 'success',
                    icon: '🎯',
                    title: 'PRÓXIMO NIVEL',
                    message: 'Tu nivel está subiendo. Considera jugar en pistas más competitivas o buscar rivales más fuertes.'
                };
            } else if (winRate < 40 && avgAgainst > avgFor + 2) {
                return {
                    type: 'recommendation',
                    level: 'info',
                    icon: '🛡️',
                    title: 'ENFÓCATE EN DEFENSA',
                    message: 'Estás encajando muchos puntos. Trabaja tu posicionamiento defensivo y anticipación.'
                };
            } else if (winRate < 40 && avgFor < 5) {
                return {
                    type: 'recommendation',
                    level: 'info',
                    icon: '⚔️',
                    title: 'MEJORA TU ATAQUE',
                    message: 'Te cuesta generar puntos. Practica remates y busca ser más agresivo en la red.'
                };
            } else if (matchCount >= 8) {
                return {
                    type: 'recommendation',
                    level: 'info',
                    icon: '💪',
                    title: 'RESISTENCIA PROBADA',
                    message: `${matchCount} partidos es mucho volumen. Asegúrate de recuperar bien antes del próximo entreno.`
                };
            }
            return null;
        }

        // --- HEURISTICS ---

        analyzeActivity(user, matches) {
            if (matches.length === 0) return null;

            // Sort by date desc
            const sorted = [...matches].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
            const lastMatch = sorted[0];
            const daysSince = (new Date() - new Date(lastMatch.date || Date.now())) / (1000 * 60 * 60 * 24);

            if (daysSince > 14) {
                return {
                    type: 'activity',
                    level: 'warning',
                    icon: '⏰',
                    title: 'ALERTA DE ÓXIDO',
                    message: `Hace <b>${Math.floor(daysSince)} días</b> que no pisas pista. Cuidado, el nivel baja rápido.`
                };
            }
            return null;
        }

        analyzeStreak(user, matches) {
            // Calculate current streak
            let streak = 0;
            // Assuming matches are roughly ordered or we sort them
            const sorted = [...matches].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

            for (let m of sorted) {
                const won = this._didUserWin(user, m);
                if (won) streak++;
                else break;
            }

            if (streak >= 3) {
                return {
                    type: 'streak',
                    level: 'success',
                    icon: '🔥',
                    title: 'RACHA "ON FIRE"',
                    message: `¡Llevas <b>${streak} victorias seguidas</b>! El algoritmo predice que eres el rival a batir ahora mismo.`
                };
            }
            return null;
        }

        analyzePartners(user, matches) {
            // Find best partner (min 3 games together)
            const partnerships = {};

            matches.forEach(m => {
                const partner = this._getPartner(user, m);
                if (partner) {
                    if (!partnerships[partner]) partnerships[partner] = { played: 0, won: 0 };
                    partnerships[partner].played++;
                    if (this._didUserWin(user, m)) partnerships[partner].won++;
                }
            });

            let bestPartner = null;
            let bestRate = 0;
            let bestRecord = "";

            Object.keys(partnerships).forEach(p => {
                const stats = partnerships[p];
                if (stats.played >= 3) {
                    const rate = stats.won / stats.played;
                    if (rate >= 0.70 && rate > bestRate) {
                        bestRate = rate;
                        bestPartner = p;
                        bestRecord = `${stats.won}-${stats.played - stats.won}`;
                    }
                }
            });

            if (bestPartner) {
                return {
                    type: 'partner',
                    level: 'info',
                    icon: '🤝',
                    title: 'QUÍMICA PERFECTA',
                    message: `Con <b>${bestPartner}</b> sois casi invencibles. <br>Récord: <span style="color:#CCFF00; font-weight:800;">${bestRecord}</span> (${Math.round(bestRate * 100)}% de efectividad).`
                };
            }
            return null;
        }

        analyzeRivals(user, matches) {
            // Find worst enemy (min 3 games against)
            const rivalries = {};

            matches.forEach(m => {
                const rivals = this._getRivals(user, m); // Returns array
                const won = this._didUserWin(user, m);
                rivals.forEach(r => {
                    if (!rivalries[r]) rivalries[r] = { played: 0, lost: 0 };
                    rivalries[r].played++;
                    if (!won) rivalries[r].lost++;
                });
            });

            let nemesis = null;
            let worstRate = 0; // high loss rate
            let nemesisRecord = "";

            Object.keys(rivalries).forEach(r => {
                const stats = rivalries[r];
                if (stats.played >= 3) {
                    const lossRate = stats.lost / stats.played;
                    if (lossRate >= 0.70 && lossRate > worstRate) {
                        worstRate = lossRate;
                        nemesis = r;
                        nemesisRecord = `${stats.played - stats.lost}-${stats.lost}`;
                    }
                }
            });

            if (nemesis) {
                return {
                    type: 'rival',
                    level: 'warning',
                    icon: '💀',
                    title: 'TU BESTIA NEGRA',
                    message: `<b>${nemesis}</b> te tiene comida la moral. <br>Balance contra él/ella: <span style="color:#ef4444; font-weight:800;">${nemesisRecord}</span>.`
                };
            }
            return null;
        }

        // --- HELPERS ---

        _didUserWin(user, match) {
            const searchName = user.name.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const teamA = match.team_a_ids || [];
            const teamB = match.team_b_ids || [];

            const check = (names) => {
                if (!names) return false;
                const combined = (Array.isArray(names) ? names.join('|') : String(names)).toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                return combined.includes(searchName);
            };

            const inA = (user.uid && teamA.includes(user.uid)) || check(match.team_a_names);
            const inB = (user.uid && teamB.includes(user.uid)) || check(match.team_b_names);

            const sA = parseInt(match.score_a || 0);
            const sB = parseInt(match.score_b || 0);

            if (inA) return sA > sB;
            if (inB) return sB > sA;
            return false;
        }

        _getPartner(user, match) {
            const teamA = match.team_a_names || [];
            const teamB = match.team_b_names || [];
            const name = user.name || "";

            const check = (list) => {
                if (Array.isArray(list)) return list.some(n => n && n.includes(name));
                return typeof list === 'string' && list.includes(name);
            };

            const findOther = (list) => {
                if (Array.isArray(list)) return list.find(n => n && !n.includes(name));
                if (typeof list === 'string') return list.replace(name, '').replace('/', '').trim();
                return null;
            };

            if (check(teamA)) return findOther(teamA);
            if (check(teamB)) return findOther(teamB);
            return null;
        }

        _getRivals(user, match) {
            const teamA = match.team_a_names || [];
            const teamB = match.team_b_names || [];
            const name = user.name || "";

            const check = (list) => {
                if (Array.isArray(list)) return list.some(n => n && n.includes(name));
                return typeof list === 'string' && list.includes(name);
            };

            if (check(teamA)) return Array.isArray(teamB) ? teamB : [teamB];
            return Array.isArray(teamA) ? teamA : [teamA];
        }

    }

    window.CaptainService = new CaptainService();
})();
