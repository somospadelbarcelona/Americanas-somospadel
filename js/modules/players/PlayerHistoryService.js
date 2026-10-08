/**
 * PlayerHistoryService.js
 * Servicio de extracción y análisis de partidos históricos y estadísticas de un jugador.
 * Compatible con Americanas y Entrenos en SomosPadel.
 */

(function () {
    'use strict';

    const _cache = new Map();
    const CACHE_TTL_MS = 30000; // 30 segundos

    window.PlayerHistoryService = {
        /**
         * Obtiene los últimos partidos disputados por un jugador y calcula sus estadísticas
         * @param {string} playerId
         * @param {number} limit
         * @returns {Promise<{matches: Array, stats: Object}>}
         */
        async getPlayerRecentMatches(playerId, limit = 10) {
            if (!playerId) {
                return { matches: [], stats: this._getEmptyStats() };
            }

            const cacheKey = `${playerId}_${limit}`;
            const cached = _cache.get(cacheKey);
            if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
                return cached.data;
            }

            try {
                let rawMatches = [];

                // 1. Intentar obtener a través de FirebaseDB.matches.getByPlayer
                if (window.FirebaseDB && window.FirebaseDB.matches && typeof window.FirebaseDB.matches.getByPlayer === 'function') {
                    try {
                        rawMatches = await window.FirebaseDB.matches.getByPlayer(playerId);
                    } catch (fbErr) {
                        console.warn("⚠️ [PlayerHistoryService] Fallo en FirebaseDB.matches.getByPlayer:", fbErr);
                    }
                }

                // 2. Fallback de consulta directa a Firestore si no devolvió partidos
                if ((!rawMatches || rawMatches.length === 0) && window.db) {
                    try {
                        const collections = ['matches', 'entrenos_matches'];
                        const matchMap = new Map();

                        for (const coll of collections) {
                            try {
                                const [snapA, snapB] = await Promise.all([
                                    window.db.collection(coll).where('team_a_ids', 'array-contains', playerId).limit(limit).get(),
                                    window.db.collection(coll).where('team_b_ids', 'array-contains', playerId).limit(limit).get()
                                ]);

                                snapA.docs.forEach(doc => {
                                    if (!matchMap.has(doc.id)) matchMap.set(doc.id, { id: doc.id, collection: coll, ...doc.data() });
                                });
                                snapB.docs.forEach(doc => {
                                    if (!matchMap.has(doc.id)) matchMap.set(doc.id, { id: doc.id, collection: coll, ...doc.data() });
                                });
                            } catch (e) {
                                console.warn(`⚠️ Error consultando ${coll}:`, e);
                            }
                        }

                        rawMatches = Array.from(matchMap.values());
                    } catch (directErr) {
                        console.warn("⚠️ [PlayerHistoryService] Fallo en consulta directa Firestore:", directErr);
                    }
                }

                // 3. Fallback a partidos en memoria si el usuario actual coincide
                if ((!rawMatches || rawMatches.length === 0) && window.Store) {
                    const currentUser = window.Store.getState('currentUser');
                    const currentId = currentUser?.id || currentUser?.uid;
                    if (currentId === playerId) {
                        const playerStats = window.Store.getState('playerStats');
                        if (playerStats && Array.isArray(playerStats.recentMatches) && playerStats.recentMatches.length > 0) {
                            rawMatches = playerStats.recentMatches;
                        }
                    }
                }

                // Ordenar por fecha descendente
                rawMatches.sort((a, b) => {
                    const getVal = (d) => d.date || d.created_at?.toDate?.() || d.createdAt || d.timestamp || 0;
                    return new Date(getVal(b)) - new Date(getVal(a));
                });

                // Tomar los N partidos solicitados
                const sliced = rawMatches.slice(0, limit);

                // 4. Normalizar partidos
                const normalizedMatches = sliced.map(m => this._normalizeMatch(m, playerId));

                // 5. Calcular estadísticas acumuladas
                const stats = this._calculateStats(normalizedMatches);

                const result = { matches: normalizedMatches, stats };
                _cache.set(cacheKey, { timestamp: Date.now(), data: result });
                return result;

            } catch (err) {
                console.error("❌ [PlayerHistoryService] Error obteniendo partidos del jugador:", err);
                return { matches: [], stats: this._getEmptyStats() };
            }
        },

        /**
         * Normaliza un partido individual para extraer nombres, marcador y resultado
         */
        _normalizeMatch(m, playerId) {
            const teamAIds = Array.isArray(m.team_a_ids) ? m.team_a_ids.map(String) : [];
            const teamBIds = Array.isArray(m.team_b_ids) ? m.team_b_ids.map(String) : [];
            const teamANames = Array.isArray(m.team_a_names) ? m.team_a_names : [];
            const teamBNames = Array.isArray(m.team_b_names) ? m.team_b_names : [];

            const isTeamA = teamAIds.includes(String(playerId));
            const isTeamB = teamBIds.includes(String(playerId));

            let myTeamNames = isTeamA ? teamANames : (isTeamB ? teamBNames : teamANames);
            let rivalTeamNames = isTeamA ? teamBNames : (isTeamB ? teamANames : teamBNames);

            let myScore = parseInt(isTeamA ? (m.score_a || 0) : (isTeamB ? (m.score_b || 0) : (m.score_a || 0)));
            let rivalScore = parseInt(isTeamA ? (m.score_b || 0) : (isTeamB ? (m.score_a || 0) : (m.score_b || 0)));

            // Identificar compañero y rivales
            let partnerName = 'Sin pareja';
            const myTeamIds = isTeamA ? teamAIds : (isTeamB ? teamBIds : []);
            if (myTeamNames.length > 1) {
                const myIndex = myTeamIds.indexOf(String(playerId));
                if (myIndex !== -1) {
                    const partnerIndex = myIndex === 0 ? 1 : 0;
                    partnerName = myTeamNames[partnerIndex] || myTeamNames[0];
                } else {
                    partnerName = myTeamNames[1] || myTeamNames[0];
                }
            } else if (myTeamNames.length === 1) {
                partnerName = myTeamNames[0];
            }

            const rivalNamesStr = rivalTeamNames.length > 0 ? rivalTeamNames.join(' / ') : 'Rivales';

            // Determinar resultado
            let result = 'pending';
            let resultLabel = 'EN JUEGO';
            let resultColor = '#64748b';
            let isWin = false;

            const isFinished = m.status === 'finished' || m.status === 'completed' || (myScore > 0 || rivalScore > 0);

            if (isFinished) {
                if (myScore > rivalScore) {
                    result = 'won';
                    resultLabel = 'VICTORIA';
                    resultColor = '#10b981'; // Verde esmeralda
                    isWin = true;
                } else if (myScore < rivalScore) {
                    result = 'lost';
                    resultLabel = 'DERROTA';
                    resultColor = '#ef4444'; // Rojo carmesí
                    isWin = false;
                } else {
                    result = 'tied';
                    resultLabel = 'EMPATE';
                    resultColor = '#f59e0b'; // Ámbar
                }
            } else {
                result = 'pending';
                resultLabel = 'PROGRAMADO';
                resultColor = '#94a3b8';
            }

            // Formato de fecha
            let dateStr = 'Reciente';
            const rawDate = m.date || m.created_at?.toDate?.() || m.createdAt || m.timestamp;
            if (rawDate) {
                try {
                    const d = new Date(rawDate);
                    dateStr = d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
                } catch (e) {}
            }

            return {
                id: m.id || `match_${Math.random()}`,
                court: m.court || 1,
                round: m.round || 1,
                myScore,
                rivalScore,
                scoreDisplay: `${myScore} - ${rivalScore}`,
                result,
                resultLabel,
                resultColor,
                isWin,
                partnerName,
                rivalNamesStr,
                eventName: m.eventName || m.americana_name || (m.collection === 'entrenos_matches' ? 'Entreno' : 'Torneo Americana'),
                eventType: m.collection === 'entrenos_matches' || m.type === 'entreno' ? 'Entreno' : 'Americana',
                dateStr
            };
        },

        /**
         * Calcula estadísticas agregadas a partir de la lista de partidos normalizados
         */
        _calculateStats(matches) {
            const finishedMatches = matches.filter(m => m.result === 'won' || m.result === 'lost' || m.result === 'tied');
            const total = finishedMatches.length;
            const wins = finishedMatches.filter(m => m.result === 'won').length;
            const losses = finishedMatches.filter(m => m.result === 'lost').length;
            const ties = finishedMatches.filter(m => m.result === 'tied').length;
            const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

            let gamesWon = 0;
            let gamesLost = 0;
            finishedMatches.forEach(m => {
                gamesWon += m.myScore;
                gamesLost += m.rivalScore;
            });

            // Calcular racha actual
            let streakCount = 0;
            let streakType = null;
            if (finishedMatches.length > 0) {
                streakType = finishedMatches[0].result;
                for (const m of finishedMatches) {
                    if (m.result === streakType) {
                        streakCount++;
                    } else {
                        break;
                    }
                }
            }

            let streakText = '—';
            let streakColor = '#94a3b8';
            if (streakType === 'won') {
                streakText = `🔥 ${streakCount}V`;
                streakColor = '#10b981';
            } else if (streakType === 'lost') {
                streakText = `❄️ ${streakCount}D`;
                streakColor = '#ef4444';
            } else if (streakType === 'tied') {
                streakText = `⚪ ${streakCount}E`;
            }

            return {
                totalMatches: total,
                wins,
                losses,
                ties,
                winRate,
                gamesWon,
                gamesLost,
                gamesDiff: gamesWon - gamesLost,
                streakText,
                streakColor,
                streakCount,
                streakType
            };
        },

        _getEmptyStats() {
            return {
                totalMatches: 0,
                wins: 0,
                losses: 0,
                ties: 0,
                winRate: 0,
                gamesWon: 0,
                gamesLost: 0,
                gamesDiff: 0,
                streakText: '—',
                streakColor: '#94a3b8',
                streakCount: 0,
                streakType: null
            };
        }
    };

    console.log("🚀 PlayerHistoryService cargado");
})();
