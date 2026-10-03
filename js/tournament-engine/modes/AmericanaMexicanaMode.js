/**
 * AmericanaMexicanaMode.js
 * Modalidad Americana Mexicana (Sistema Suizo / Dinámico por Puntuación).
 * Agrupa a los jugadores en pistas según su clasificación y puntos acumulados en rondas previas,
 * pero rotando parejas dentro de cada pista para evitar que repitan compañeros.
 */

(function () {
    'use strict';

    let BaseModule;
    if (typeof require !== 'undefined') {
        try {
            BaseModule = require('./BaseTournamentMode');
        } catch (e) { }
    }

    const BaseTournamentMode = BaseModule?.BaseTournamentMode ||
        (typeof window !== 'undefined' ? window.BaseTournamentMode : null);

    class AmericanaMexicanaMode extends BaseTournamentMode {
        constructor() {
            super(
                'mexicana',
                'Americana Mexicana',
                'Agrupación por puntos acumulados (Suizo) con rotación matemática de parejas por pista.'
            );
        }

        generateRound(context) {
            const {
                players,
                courts,
                roundNum = 1,
                matchesHistory = [],
                solver,
                logger,
                constraints,
                options = {}
            } = context;

            logger.logDecision('AMERICANA_MEXICANA_START_ROUND', { roundNum, totalPlayers: players.length, courts });

            const history = this.buildHistory(matchesHistory, players, roundNum);
            const effectiveCourts = Math.min(courts, Math.floor(players.length / 4));
            const activePlayersNeeded = effectiveCourts * 4;
            const byesCount = players.length - activePlayersNeeded;

            // 1. Byes si aplican
            const { activePlayers, restingPlayers } = solver.selectByes(players, byesCount, history);

            // 2. Si es Ronda 1, usamos CSP global o nivel
            if (roundNum === 1) {
                // Ordenar por nivel inicial si existe
                activePlayers.sort((a, b) => (parseFloat(b.level || 3) - parseFloat(a.level || 3)));
                const playersByCourt = {};
                for (let c = 1; c <= effectiveCourts; c++) {
                    const startIdx = (c - 1) * 4;
                    playersByCourt[c] = activePlayers.slice(startIdx, startIdx + 4);
                }
                const matches = solver.solveCourtLocked(playersByCourt, history, { roundNum, ...options });
                return this._finalizeRound(players, matches, restingPlayers);
            }

            // 3. Rondas 2+: Calcular clasificación acumulada
            const stats = {};
            activePlayers.forEach(p => {
                const pid = String(p.id || p.uid);
                stats[pid] = { pointsWon: 0, pointsLost: 0, diff: 0, wins: 0 };
            });

            matchesHistory.forEach(m => {
                if (m.status !== 'finished') return;
                const sA = parseInt(m.score_a || 0);
                const sB = parseInt(m.score_b || 0);
                const teamA = (m.team_a_ids || []).map(String);
                const teamB = (m.team_b_ids || []).map(String);

                teamA.forEach(pid => {
                    if (stats[pid]) {
                        stats[pid].pointsWon += sA;
                        stats[pid].pointsLost += sB;
                        stats[pid].diff += (sA - sB);
                        if (sA > sB) stats[pid].wins++;
                    }
                });

                teamB.forEach(pid => {
                    if (stats[pid]) {
                        stats[pid].pointsWon += sB;
                        stats[pid].pointsLost += sA;
                        stats[pid].diff += (sB - sA);
                        if (sB > sA) stats[pid].wins++;
                    }
                });
            });

            // Ordenar jugadores activos por: 1) Juegos ganados, 2) Diferencia de juegos, 3) Nivel
            activePlayers.sort((a, b) => {
                const sA = stats[String(a.id || a.uid)] || { pointsWon: 0, diff: 0 };
                const sB = stats[String(b.id || b.uid)] || { pointsWon: 0, diff: 0 };
                if (sB.pointsWon !== sA.pointsWon) return sB.pointsWon - sA.pointsWon;
                if (sB.diff !== sA.diff) return sB.diff - sA.diff;
                return (parseFloat(b.level || 3.0) - parseFloat(a.level || 3.0));
            });

            // Asignar los mejores 4 a Pista 1, siguientes 4 a Pista 2, etc.
            const playersByCourt = {};
            for (let c = 1; c <= effectiveCourts; c++) {
                const startIdx = (c - 1) * 4;
                playersByCourt[c] = activePlayers.slice(startIdx, startIdx + 4);
            }

            // Resolver emparejamiento dentro de cada pista con CSP para no repetir compañero
            const matches = solver.solveCourtLocked(playersByCourt, history, {
                roundNum,
                hardNoRepeatPartner: false, // En pistas bloqueadas por clasificación, se usa soft penalty
                ...options
            });

            return this._finalizeRound(players, matches, restingPlayers);
        }

        _finalizeRound(allPlayers, matches, restingPlayers) {
            const courtMap = {};
            matches.forEach(m => {
                const c = parseInt(m.court);
                [...(m.team_a_ids || []), ...(m.team_b_ids || [])].forEach(pid => {
                    courtMap[String(pid)] = c;
                });
            });

            const updatedPlayers = allPlayers.map(p => {
                const pid = String(p.id || p.uid);
                return {
                    ...p,
                    current_court: courtMap[pid] !== undefined ? courtMap[pid] : null,
                    is_resting: restingPlayers.some(rp => String(rp.id || rp.uid) === pid)
                };
            });

            return {
                matches,
                restingPlayers,
                updatedPlayers
            };
        }
    }

    // Exportación universal
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { AmericanaMexicanaMode };
    }
    if (typeof window !== 'undefined') {
        window.AmericanaMexicanaMode = AmericanaMexicanaMode;
    }
})();
