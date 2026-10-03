/**
 * BaseTournamentMode.js
 * Clase base abstracta para todas las modalidades del TournamentEngine.
 * Proporciona hooks del ciclo de vida de generación, validación combinatoria
 * y reconstrucción fiel del historial histórico del torneo.
 *
 * Compatible con Node.js y navegadores.
 */

(function () {
    'use strict';

    let FeasibilityModule;
    if (typeof require !== 'undefined') {
        try {
            FeasibilityModule = require('../FeasibilityValidator');
        } catch (e) { }
    }

    const FeasibilityValidator = FeasibilityModule?.FeasibilityValidator ||
        (typeof window !== 'undefined' ? window.FeasibilityValidator : null);

    class BaseTournamentMode {
        constructor(id, name, description) {
            this.id = id;
            this.name = name;
            this.description = description;
        }

        getId() {
            return this.id;
        }

        getName() {
            return this.name;
        }

        getDescription() {
            return this.description;
        }

        /**
         * Validación combinatoria previa específica de la modalidad.
         */
        validateFeasibility(config = {}) {
            if (FeasibilityValidator) {
                return FeasibilityValidator.validate({ ...config, mode: this.id });
            }
            return { valid: true, errors: [], warnings: [], metrics: {} };
        }

        /**
         * Configura o afina las restricciones y pesos para esta modalidad.
         */
        configureConstraints(constraints, config = {}) {
            // Override en subclases
        }

        /**
         * Reconstruye el historial acumulado de parejas, rivales, pistas y descansos
         * a partir de la lista de partidos de rondas previas.
         */
        buildHistory(allMatches = [], players = [], currentRoundNum = 1) {
            const partnerHistory = {};
            const opponentHistory = {};
            const courtHistory = {};
            const byeHistory = {};
            const matchCount = {};

            players.forEach(p => {
                const pid = String(p.id || p.uid);
                partnerHistory[pid] = [];
                opponentHistory[pid] = [];
                courtHistory[pid] = [];
                byeHistory[pid] = 0;
                matchCount[pid] = 0;
            });

            // Ordenar partidos por ronda ascendente
            const sortedMatches = [...allMatches].sort((a, b) => (parseInt(a.round) || 1) - (parseInt(b.round) || 1));
            const playedInRound = {}; // roundNum -> Set of playerIds

            sortedMatches.forEach(m => {
                const r = parseInt(m.round) || 1;
                if (r >= currentRoundNum) return; // Solo rondas previas

                if (!playedInRound[r]) playedInRound[r] = new Set();

                const c = parseInt(m.court) || 1;
                const teamA = (m.team_a_ids || []).map(String);
                const teamB = (m.team_b_ids || []).map(String);

                // Team A internal partners
                if (teamA.length === 2) {
                    const [p0, p1] = teamA;
                    partnerHistory[p0] = [p1, ...(partnerHistory[p0] || [])];
                    partnerHistory[p1] = [p0, ...(partnerHistory[p1] || [])];
                }

                // Team B internal partners
                if (teamB.length === 2) {
                    const [p0, p1] = teamB;
                    partnerHistory[p0] = [p1, ...(partnerHistory[p0] || [])];
                    partnerHistory[p1] = [p0, ...(partnerHistory[p1] || [])];
                }

                // Opponents
                teamA.forEach(aId => {
                    teamB.forEach(bId => {
                        opponentHistory[aId] = [bId, ...(opponentHistory[aId] || [])];
                        opponentHistory[bId] = [aId, ...(opponentHistory[bId] || [])];
                    });
                });

                // Courts and played
                [...teamA, ...teamB].forEach(pid => {
                    courtHistory[pid] = [c, ...(courtHistory[pid] || [])];
                    matchCount[pid] = (matchCount[pid] || 0) + 1;
                    playedInRound[r].add(pid);
                });
            });

            // Determinar descansos (Byes) por ronda previa
            const lastRoundNum = currentRoundNum - 1;
            const lastRoundByes = [];

            for (let r = 1; r <= lastRoundNum; r++) {
                const activeInR = playedInRound[r] || new Set();
                players.forEach(p => {
                    const pid = String(p.id || p.uid);
                    if (!activeInR.has(pid)) {
                        byeHistory[pid] = (byeHistory[pid] || 0) + 1;
                        if (r === lastRoundNum) {
                            lastRoundByes.push(p);
                        }
                    }
                });
            }

            return {
                partnerHistory,
                opponentHistory,
                courtHistory,
                byeHistory,
                lastRoundByes,
                matchCount
            };
        }

        /**
         * Método central de generación de ronda (debe ser implementado por subclases).
         */
        generateRound(context) {
            throw new Error(`generateRound() debe ser implementado por la modalidad '${this.id}'.`);
        }
    }

    // Exportación universal
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { BaseTournamentMode };
    }
    if (typeof window !== 'undefined') {
        window.BaseTournamentMode = BaseTournamentMode;
    }
})();
