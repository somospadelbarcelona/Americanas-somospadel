/**
 * PartnerSynergyService.js
 * 🔗 RADAR DE SINERGIAS - Smart Partner Matching
 * Analiza compatibilidad, química y estadísticas para sugerir las mejores parejas
 */

(function () {
    'use strict';

    class PartnerSynergyService {
        constructor() {
            this.db = window.db;
            this.cache = new Map();
            this.cacheExpiry = 5 * 60 * 1000; // 5 minutos
        }

        /**
         * Calcula la sinergia entre dos jugadores
         * @param {string} playerId1 - ID del primer jugador
         * @param {string} playerId2 - ID del segundo jugador
         * @returns {Promise<Object>} Objeto con score de sinergia y detalles
         */
        async calculateSynergy(playerId1, playerId2) {
            try {
                const cacheKey = `${playerId1}_${playerId2}`;
                const cached = this.cache.get(cacheKey);

                if (cached && (Date.now() - cached.timestamp < this.cacheExpiry)) {
                    return cached.data;
                }

                const [player1, player2, sharedMatches] = await Promise.all([
                    this.getPlayerData(playerId1),
                    this.getPlayerData(playerId2),
                    this.getSharedMatches(playerId1, playerId2)
                ]);

                if (!player1 || !player2) {
                    return null;
                }

                // Calcular diferentes aspectos de sinergia
                const levelCompatibility = this.calculateLevelCompatibility(player1, player2);
                const playChemistry = this.calculatePlayChemistry(sharedMatches);
                const styleCompatibility = this.calculateStyleCompatibility(player1, player2);
                const activityAlignment = this.calculateActivityAlignment(player1, player2);

                // Score total ponderado
                const totalScore = (
                    levelCompatibility.score * 0.25 +
                    playChemistry.score * 0.35 +
                    styleCompatibility.score * 0.25 +
                    activityAlignment.score * 0.15
                );

                const result = {
                    playerId1,
                    playerId2,
                    player1Name: player1.name,
                    player2Name: player2.name,
                    totalScore: Math.round(totalScore * 100) / 100,
                    rating: this.getRating(totalScore),
                    levelCompatibility,
                    playChemistry,
                    styleCompatibility,
                    activityAlignment,
                    sharedMatches: sharedMatches.length,
                    recommendation: this.getRecommendation(totalScore, sharedMatches.length)
                };

                // Guardar en caché
                this.cache.set(cacheKey, {
                    data: result,
                    timestamp: Date.now()
                });

                return result;
            } catch (error) {
                console.error('Error calculating synergy:', error);
                return null;
            }
        }

        /**
         * Obtiene las mejores parejas para un jugador
         * @param {string} playerId - ID del jugador
         * @param {number} limit - Número máximo de sugerencias
         * @returns {Promise<Array>} Array de sugerencias ordenadas por score
         */
        async getBestPartnersFor(playerId, limit = 5) {
            try {
                const allPlayers = await this.getAllActivePlayers();
                const currentPlayer = allPlayers.find(p => p.uid === playerId || p.id === playerId);

                if (!currentPlayer) {
                    return [];
                }

                const synergies = [];

                for (const player of allPlayers) {
                    const pid = player.uid || player.id;
                    if (pid === playerId) continue;

                    const synergy = await this.calculateSynergy(playerId, pid);
                    if (synergy && synergy.totalScore > 0) {
                        synergies.push({
                            ...synergy,
                            player: player
                        });
                    }
                }

                // Ordenar por score total
                synergies.sort((a, b) => b.totalScore - a.totalScore);

                return synergies.slice(0, limit);
            } catch (error) {
                console.error('Error getting best partners:', error);
                return [];
            }
        }

        /**
         * Calcula compatibilidad de nivel
         */
        calculateLevelCompatibility(player1, player2) {
            const level1 = parseFloat(player1.level || player1.self_rate_level || 3.5);
            const level2 = parseFloat(player2.level || player2.self_rate_level || 3.5);
            const difference = Math.abs(level1 - level2);

            let score = 100;
            let label = 'PERFECTO';
            let color = '#22c55e';

            if (difference <= 0.3) {
                score = 100;
                label = 'PERFECTO';
                color = '#22c55e';
            } else if (difference <= 0.6) {
                score = 85;
                label = 'EXCELENTE';
                color = '#84cc16';
            } else if (difference <= 1.0) {
                score = 70;
                label = 'BUENO';
                color = '#eab308';
            } else if (difference <= 1.5) {
                score = 50;
                label = 'ACEPTABLE';
                color = '#f97316';
            } else {
                score = 30;
                label = 'DESBALANCEADO';
                color = '#ef4444';
            }

            return {
                score,
                label,
                color,
                level1,
                level2,
                difference: Math.round(difference * 10) / 10
            };
        }

        /**
         * Calcula química de juego basada en partidos compartidos
         */
        calculatePlayChemistry(sharedMatches) {
            if (sharedMatches.length === 0) {
                return {
                    score: 50, // Score neutro si no hay historial
                    label: 'SIN HISTORIAL',
                    color: '#94a3b8',
                    wins: 0,
                    losses: 0,
                    winRate: 0,
                    matchesPlayed: 0
                };
            }

            const wins = sharedMatches.filter(m => m.won).length;
            const losses = sharedMatches.length - wins;
            const winRate = (wins / sharedMatches.length) * 100;

            let score = 50 + (winRate * 0.5); // Base 50 + hasta 50 por win rate
            let label = 'REGULAR';
            let color = '#eab308';

            if (winRate >= 70) {
                label = 'QUÍMICA EXPLOSIVA';
                color = '#22c55e';
            } else if (winRate >= 55) {
                label = 'BUENA QUÍMICA';
                color = '#84cc16';
            } else if (winRate >= 45) {
                label = 'QUÍMICA EQUILIBRADA';
                color = '#eab308';
            } else if (winRate >= 30) {
                label = 'QUÍMICA BAJA';
                color = '#f97316';
            } else {
                label = 'SIN QUÍMICA';
                color = '#ef4444';
            }

            return {
                score,
                label,
                color,
                wins,
                losses,
                winRate: Math.round(winRate),
                matchesPlayed: sharedMatches.length
            };
        }

        /**
         * Calcula compatibilidad de estilo de juego
         */
        calculateStyleCompatibility(player1, player2) {
            const pref1 = player1.play_preference || 'indifferent';
            const pref2 = player2.play_preference || 'indifferent';

            let score = 100;
            let label = 'COMPLEMENTARIOS';
            let color = '#22c55e';

            // Caso ideal: uno drive, otro revés
            if ((pref1 === 'drive' && pref2 === 'reves') || (pref1 === 'reves' && pref2 === 'drive')) {
                score = 100;
                label = 'COMPLEMENTARIOS PERFECTOS';
                color = '#22c55e';
            }
            // Ambos indiferentes
            else if (pref1 === 'indifferent' && pref2 === 'indifferent') {
                score = 90;
                label = 'FLEXIBLES';
                color = '#84cc16';
            }
            // Uno indiferente
            else if (pref1 === 'indifferent' || pref2 === 'indifferent') {
                score = 85;
                label = 'ADAPTABLES';
                color = '#84cc16';
            }
            // Mismo lado (conflicto)
            else if (pref1 === pref2) {
                score = 60;
                label = 'MISMO LADO';
                color = '#f97316';
            }

            return {
                score,
                label,
                color,
                preference1: pref1,
                preference2: pref2
            };
        }

        /**
         * Calcula alineación de actividad (frecuencia de juego similar)
         */
        calculateActivityAlignment(player1, player2) {
            const matches1 = player1.stats?.total_matches || 0;
            const matches2 = player2.stats?.total_matches || 0;

            const avgMatches = (matches1 + matches2) / 2;
            const difference = Math.abs(matches1 - matches2);
            const diffPercentage = avgMatches > 0 ? (difference / avgMatches) * 100 : 0;

            let score = 100;
            let label = 'MUY ACTIVOS';
            let color = '#22c55e';

            if (diffPercentage <= 20) {
                score = 100;
                label = 'ACTIVIDAD SIMILAR';
                color = '#22c55e';
            } else if (diffPercentage <= 40) {
                score = 80;
                label = 'ACTIVIDAD COMPATIBLE';
                color = '#84cc16';
            } else if (diffPercentage <= 60) {
                score = 60;
                label = 'ACTIVIDAD DIFERENTE';
                color = '#eab308';
            } else {
                score = 40;
                label = 'ACTIVIDAD MUY DIFERENTE';
                color = '#f97316';
            }

            return {
                score,
                label,
                color,
                matches1,
                matches2
            };
        }

        /**
         * Obtiene rating textual basado en score total
         */
        getRating(score) {
            if (score >= 90) return { label: '⭐⭐⭐⭐⭐ PAREJA IDEAL', color: '#22c55e' };
            if (score >= 80) return { label: '⭐⭐⭐⭐ EXCELENTE PAREJA', color: '#84cc16' };
            if (score >= 70) return { label: '⭐⭐⭐ BUENA PAREJA', color: '#eab308' };
            if (score >= 60) return { label: '⭐⭐ PAREJA ACEPTABLE', color: '#f97316' };
            return { label: '⭐ PAREJA POCO COMPATIBLE', color: '#ef4444' };
        }

        /**
         * Genera recomendación personalizada
         */
        getRecommendation(score, sharedMatches) {
            if (score >= 90 && sharedMatches >= 5) {
                return '¡Tu mejor pareja! Habéis demostrado una química excepcional juntos.';
            } else if (score >= 90) {
                return '¡Pareja ideal por nivel y estilo! Deberíais jugar juntos pronto.';
            } else if (score >= 80 && sharedMatches >= 3) {
                return 'Excelente dupla con buen historial. ¡Seguid así!';
            } else if (score >= 80) {
                return 'Gran compatibilidad. Probad a jugar juntos.';
            } else if (score >= 70) {
                return 'Buena pareja potencial. Podría funcionar muy bien.';
            } else if (score >= 60) {
                return 'Pareja aceptable, aunque hay mejores opciones disponibles.';
            } else {
                return 'Compatibilidad baja. Considera otras opciones.';
            }
        }

        /**
         * Obtiene partidos compartidos entre dos jugadores
         */
        async getSharedMatches(playerId1, playerId2) {
            try {
                if (!this.db) return [];

                const matchesRef = this.db.collection('matches');
                const snapshot = await matchesRef.get();

                const sharedMatches = [];

                snapshot.forEach(doc => {
                    const match = { id: doc.id, ...doc.data() };

                    // Verificar si ambos jugadores están en el mismo equipo
                    const team1 = match.team1 || [];
                    const team2 = match.team2 || [];

                    const inTeam1 = team1.some(p => (p.uid || p.id || p) === playerId1) &&
                        team1.some(p => (p.uid || p.id || p) === playerId2);
                    const inTeam2 = team2.some(p => (p.uid || p.id || p) === playerId1) &&
                        team2.some(p => (p.uid || p.id || p) === playerId2);

                    if (inTeam1 || inTeam2) {
                        const won = inTeam1 ? (match.winner === 'team1') : (match.winner === 'team2');
                        sharedMatches.push({
                            matchId: match.id,
                            date: match.date || match.created_at,
                            won,
                            score: match.score
                        });
                    }
                });

                return sharedMatches;
            } catch (error) {
                console.error('Error getting shared matches:', error);
                return [];
            }
        }

        /**
         * Obtiene datos de un jugador
         */
        async getPlayerData(playerId) {
            try {
                if (!this.db) return null;

                const playerDoc = await this.db.collection('users').doc(playerId).get();
                if (!playerDoc.exists) return null;

                return { id: playerDoc.id, ...playerDoc.data() };
            } catch (error) {
                console.error('Error getting player data:', error);
                return null;
            }
        }

        /**
         * Obtiene todos los jugadores activos
         */
        async getAllActivePlayers() {
            try {
                if (!this.db) return [];

                const snapshot = await this.db.collection('users').get();
                const players = [];

                snapshot.forEach(doc => {
                    const player = { id: doc.id, uid: doc.id, ...doc.data() };
                    // Filtrar jugadores con al menos 1 partido o nivel definido
                    if ((player.stats?.total_matches || 0) > 0 || player.level || player.self_rate_level) {
                        players.push(player);
                    }
                });

                return players;
            } catch (error) {
                console.error('Error getting active players:', error);
                return [];
            }
        }

        /**
         * Limpia la caché
         */
        clearCache() {
            this.cache.clear();
        }
    }

    // Exportar globalmente
    window.PartnerSynergyService = new PartnerSynergyService();
    console.log('🔗 Partner Synergy Service loaded');
})();
