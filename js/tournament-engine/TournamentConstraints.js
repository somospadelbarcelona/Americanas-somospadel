/**
 * TournamentConstraints.js
 * Restricciones universales e independientes con funciones de evaluación matemática y penalizaciones.
 *
 * Cada restricción es una función pura que calcula una penalización (costo >= 0)
 * o verifica cumplimiento estricto (Hard Constraint).
 *
 * Compatible con Node.js y navegadores.
 */

(function () {
    'use strict';

    const DEFAULT_WEIGHTS = {
        partnerRepeatImmediate: 1000000, // Ronda R-1
        partnerRepeatDepth2: 50000,      // Ronda R-2
        partnerRepeatDepth3: 10000,      // Ronda R-3
        partnerRepeatOlder: 2000,        // Repetición en rondas anteriores
        opponentRepeatImmediate: 5000,   // Enfrentar al mismo rival de la ronda anterior
        opponentRepeatOlder: 500,        // Enfrentar al mismo rival en rondas previas
        byeConsecutive: 100000,          // Descansar dos rondas seguidas
        byeVariance: 10000,              // Desviación en número total de descansos
        courtRepeat: 300,                // Repetir la misma pista consecutivamente
        courtVariance: 150,              // Desequilibrio global de pistas
        levelDifference: 200,            // Desequilibrio de nivel medio entre parejas
        teammateAsPartnerPenalty: 1000,  // En entreno: penalizar compañeros del mismo club como pareja
        teammateAsRivalReward: 500       // En entreno: premiar compañeros del mismo club enfrentándose
    };

    class TournamentConstraints {
        constructor(customWeights = {}) {
            this.weights = { ...DEFAULT_WEIGHTS, ...customWeights };
        }

        setWeight(name, value) {
            this.weights[name] = value;
        }

        getWeights() {
            return { ...this.weights };
        }

        // ==========================================
        // 1. RESTRICCIONES DE PAREJA (PARTNER)
        // ==========================================

        /**
         * Comprueba si una pareja viola la restricción estricta de no repetir compañero.
         * @param {string|number} p1Id 
         * @param {string|number} p2Id 
         * @param {object} history - { partnerHistory: { [playerId]: [pIdR_1, pIdR_2, ...] } }
         * @param {number} maxDepth - Profundidad de rondas a chequear (Infinity para todo el torneo)
         * @returns {boolean} true si se repite (violación)
         */
        isPartnerRepeated(p1Id, p2Id, history = {}, maxDepth = Infinity) {
            const id1 = String(p1Id);
            const id2 = String(p2Id);
            if (!history.partnerHistory) return false;

            const h1 = history.partnerHistory[id1] || [];
            const checkList = maxDepth === Infinity ? h1 : h1.slice(0, maxDepth);
            return checkList.some(pid => String(pid) === id2);
        }

        /**
         * Calcula penalización por repetición de pareja.
         */
        getPartnerPenalty(p1Id, p2Id, history = {}, hardForbidden = false) {
            const id1 = String(p1Id);
            const id2 = String(p2Id);
            if (!history.partnerHistory) return 0;

            const h1 = (history.partnerHistory[id1] || []).map(String);
            const index = h1.indexOf(id2);

            if (index === -1) return 0;

            if (hardForbidden) {
                return Infinity; // Hard constraint: prohibido terminantemente
            }

            if (index === 0) return this.weights.partnerRepeatImmediate;
            if (index === 1) return this.weights.partnerRepeatDepth2;
            if (index === 2) return this.weights.partnerRepeatDepth3;

            return this.weights.partnerRepeatOlder * (1 + (h1.length - index));
        }

        /**
         * Helper para comprobar si 2 jugadores comparten club o equipo.
         */
        shareClubTeam(player1, player2) {
            if (!player1 || !player2) return false;
            const t1 = player1.team || player1.team_somospadel;
            const t2 = player2.team || player2.team_somospadel;
            if (!t1 || !t2) return false;
            const a1 = Array.isArray(t1) ? t1 : [t1];
            const a2 = Array.isArray(t2) ? t2 : [t2];
            return a1.some(it => it && a2.includes(it));
        }

        /**
         * Calcula la penalización combinada de formar pareja entre p1 y p2,
         * considerando historial y afinidad de club en entreno.
         */
        getPairPenalty(p1, p2, history = {}, options = {}) {
            const p1Id = String(p1.id || p1.uid);
            const p2Id = String(p2.id || p2.uid);
            let penalty = this.getPartnerPenalty(p1Id, p2Id, history, options.hardNoRepeatPartner);
            if (penalty === Infinity) return Infinity;

            if (options.isEntreno && this.shareClubTeam(p1, p2)) {
                penalty += this.weights.teammateAsPartnerPenalty;
            }

            return penalty;
        }

        // ==========================================
        // 2. RESTRICCIONES DE RIVALES (OPPONENTS)
        // ==========================================

        /**
         * Calcula penalización por repetir rivales.
         * @param {Array<string>} teamAIds 
         * @param {Array<string>} teamBIds 
         * @param {object} history 
         */
        getOpponentPenalty(teamAIds, teamBIds, history = {}) {
            if (!history.opponentHistory) return 0;
            let penalty = 0;

            teamAIds.forEach(aId => {
                const oppHistory = (history.opponentHistory[String(aId)] || []).map(String);
                teamBIds.forEach(bId => {
                    const strB = String(bId);
                    const idx = oppHistory.indexOf(strB);
                    if (idx !== -1) {
                        if (idx < 2) {
                            penalty += this.weights.opponentRepeatImmediate;
                        } else {
                            penalty += this.weights.opponentRepeatOlder;
                        }
                    }
                });
            });

            return penalty;
        }

        // ==========================================
        // 3. RESTRICCIONES DE DESCANSOS (BYES)
        // ==========================================

        /**
         * Evalúa la idoneidad de un grupo de jugadores para descansar en la ronda actual.
         * Minimiza la varianza total de descansos y penaliza fuertemente descansos consecutivos.
         * @param {Array<object>} restingPlayers 
         * @param {object} history - { byeHistory: { [playerId]: count }, lastRoundByes: Set/Array }
         * @param {number} totalRoundsExpected
         */
        getByePenalty(restingPlayers, history = {}, totalRoundsExpected = 1) {
            let penalty = 0;
            const byeHistory = history.byeHistory || {};
            const lastRoundByes = new Set((history.lastRoundByes || []).map(String));

            // Obtener media actual de descansos
            const allCounts = Object.values(byeHistory);
            const avgByes = allCounts.length > 0 ? (allCounts.reduce((a, b) => a + b, 0) / allCounts.length) : 0;

            restingPlayers.forEach(p => {
                const pid = String(p.id || p.uid);
                const count = byeHistory[pid] || 0;

                // Penalización exponencial por descansar consecutivamente
                if (lastRoundByes.has(pid)) {
                    penalty += this.weights.byeConsecutive;
                }

                // Penalizar si este jugador ya lleva más descansos que la media
                if (count > avgByes) {
                    penalty += (count - avgByes) * this.weights.byeVariance;
                }
            });

            return penalty;
        }

        // ==========================================
        // 4. EQUILIBRIO DE PISTAS (COURTS)
        // ==========================================

        /**
         * Penalización por jugar repetidamente en la misma pista o desequilibrio.
         * @param {Array<string>} playerIds 
         * @param {number} courtNumber 
         * @param {object} history - { courtHistory: { [playerId]: [courtR_1, courtR_2, ...] } }
         */
        getCourtPenalty(playerIds, courtNumber, history = {}) {
            if (!history.courtHistory) return 0;
            let penalty = 0;

            playerIds.forEach(pid => {
                const cHistory = history.courtHistory[String(pid)] || [];
                if (cHistory.length > 0 && cHistory[0] === courtNumber) {
                    penalty += this.weights.courtRepeat;
                }
                const timesInThisCourt = cHistory.filter(c => c === courtNumber).length;
                if (timesInThisCourt > 1) {
                    penalty += timesInThisCourt * this.weights.courtVariance;
                }
            });

            return penalty;
        }

        // ==========================================
        // 5. EQUILIBRIO DE NIVEL (LEVEL BALANCE)
        // ==========================================

        /**
         * Calcula el desequilibrio de nivel en un partido.
         * @param {Array<object>} teamAPlayers 
         * @param {Array<object>} teamBPlayers 
         */
        getLevelPenalty(teamAPlayers, teamBPlayers) {
            const getAvg = (arr) => {
                if (!arr || arr.length === 0) return 3.0;
                const sum = arr.reduce((acc, p) => acc + (parseFloat(p.level || p.self_rate_level) || 3.0), 0);
                return sum / arr.length;
            };

            const avgA = getAvg(teamAPlayers);
            const avgB = getAvg(teamBPlayers);
            const diff = Math.abs(avgA - avgB);

            return diff * this.weights.levelDifference;
        }

        // ==========================================
        // 6. GÉNERO (AMERICANA MIXTA)
        // ==========================================

        /**
         * Verifica si una pareja cumple la regla mixta (exactamente 1 hombre + 1 mujer).
         * @param {object} p1 
         * @param {object} p2 
         * @returns {boolean}
         */
        isValidMixedPair(p1, p2) {
            const getGender = (p) => {
                const g = String(p.gender || p.sex || '').trim().toLowerCase();
                if (g.startsWith('m') || g === 'hombre' || g === 'masculino' || g === 'chico') return 'M';
                if (g.startsWith('f') || g === 'mujer' || g === 'femenino' || g === 'chica') return 'F';
                return 'UNKNOWN';
            };

            const g1 = getGender(p1);
            const g2 = getGender(p2);

            if (g1 === 'UNKNOWN' || g2 === 'UNKNOWN') return true; // Permisivo si no hay metadatos
            return (g1 === 'M' && g2 === 'F') || (g1 === 'F' && g2 === 'M');
        }

        // ==========================================
        // 7. ENTRENOS / EQUIPOS DE CLUB
        // ==========================================

        /**
         * Evalúa afinidades/rivalidades de compañeros de club en modo entreno.
         */
        getEntrenoAffinityPenalty(teamA, teamB) {
            const shareClub = (p1, p2) => {
                if (!p1 || !p2) return false;
                const t1 = p1.team || p1.team_somospadel;
                const t2 = p2.team || p2.team_somospadel;
                if (!t1 || !t2) return false;
                const a1 = Array.isArray(t1) ? t1 : [t1];
                const a2 = Array.isArray(t2) ? t2 : [t2];
                return a1.some(it => it && a2.includes(it));
            };

            let penalty = 0;

            // Penalizar si son pareja en el mismo equipo (queremos que jueguen contra gente distinta o se enfrenten)
            if (teamA.length >= 2 && shareClub(teamA[0], teamA[1])) {
                penalty += this.weights.teammateAsPartnerPenalty;
            }
            if (teamB.length >= 2 && shareClub(teamB[0], teamB[1])) {
                penalty += this.weights.teammateAsPartnerPenalty;
            }

            // Premiar si se enfrentan cara a cara como rivales
            teamA.forEach(pa => {
                teamB.forEach(pb => {
                    if (shareClub(pa, pb)) {
                        penalty -= this.weights.teammateAsRivalReward;
                    }
                });
            });

            return penalty;
        }

        // ==========================================
        // 8. EVALUACIÓN INTEGRAL DE PARTIDO
        // ==========================================

        /**
         * Evalúa un partido candidato completo y devuelve su puntuación total.
         * Menor penalización = Mayor Score = Mejor calidad matemática.
         */
        evaluateMatch(teamA, teamB, courtNumber, history = {}, options = {}) {
            let totalPenalty = 0;
            const breakdown = {};

            const teamAIds = teamA.map(p => String(p.id || p.uid));
            const teamBIds = teamB.map(p => String(p.id || p.uid));

            // 1. Parejas (Team A y Team B)
            if (teamA.length === 2) {
                const pA = this.getPartnerPenalty(teamAIds[0], teamAIds[1], history, options.hardNoRepeatPartner);
                if (pA === Infinity) return { score: -Infinity, penalty: Infinity, breakdown: { partnerHardViolated: true } };
                breakdown.partnerA = pA;
                totalPenalty += pA;
            }

            if (teamB.length === 2) {
                const pB = this.getPartnerPenalty(teamBIds[0], teamBIds[1], history, options.hardNoRepeatPartner);
                if (pB === Infinity) return { score: -Infinity, penalty: Infinity, breakdown: { partnerHardViolated: true } };
                breakdown.partnerB = pB;
                totalPenalty += pB;
            }

            // 2. Género en mixtas
            if (options.isMixed) {
                if (teamA.length === 2 && !this.isValidMixedPair(teamA[0], teamA[1])) {
                    return { score: -Infinity, penalty: Infinity, breakdown: { mixedInvalidA: true } };
                }
                if (teamB.length === 2 && !this.isValidMixedPair(teamB[0], teamB[1])) {
                    return { score: -Infinity, penalty: Infinity, breakdown: { mixedInvalidB: true } };
                }
            }

            // 3. Rivales
            const oppPenalty = this.getOpponentPenalty(teamAIds, teamBIds, history);
            breakdown.opponents = oppPenalty;
            totalPenalty += oppPenalty;

            // 4. Pista
            if (courtNumber !== undefined && courtNumber !== null) {
                const courtPenalty = this.getCourtPenalty([...teamAIds, ...teamBIds], courtNumber, history);
                breakdown.court = courtPenalty;
                totalPenalty += courtPenalty;
            }

            // 5. Nivel
            const lvlPenalty = this.getLevelPenalty(teamA, teamB);
            breakdown.level = lvlPenalty;
            totalPenalty += lvlPenalty;

            // 6. Entreno afinidad
            if (options.isEntreno) {
                const entrenoPenalty = this.getEntrenoAffinityPenalty(teamA, teamB);
                breakdown.entrenoAffinity = entrenoPenalty;
                totalPenalty += entrenoPenalty;
            }

            const score = -totalPenalty;
            return { score, penalty: totalPenalty, breakdown };
        }
    }

    // Exportación universal
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { TournamentConstraints, DEFAULT_WEIGHTS };
    }
    if (typeof window !== 'undefined') {
        window.TournamentConstraints = TournamentConstraints;
        window.DEFAULT_TOURNAMENT_WEIGHTS = DEFAULT_WEIGHTS;
    }
})();
