/**
 * AmericanaClasicaMode.js
 * Modalidad Americana Clásica (Twister / Rotativa Individual).
 * Maximiza la variedad de compañeros y rivales en cada ronda,
 * garantizando equidad matemática absoluta en descansos y asignación de pistas.
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

    class AmericanaClasicaMode extends BaseTournamentMode {
        constructor() {
            super(
                'clasica',
                'Americana Clásica',
                'Rotación individual pura optimizando variedad de compañeros y rivales.'
            );
        }

        configureConstraints(constraints, config = {}) {
            // En Americana Clásica, no repetir pareja es la máxima prioridad
            constraints.setWeight('partnerRepeatImmediate', 1000000);
            constraints.setWeight('partnerRepeatDepth2', 50000);
            constraints.setWeight('opponentRepeatImmediate', 5000);
            constraints.setWeight('byeConsecutive', 200000);
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

            logger.logDecision('AMERICANA_CLASICA_START_ROUND', { roundNum, totalPlayers: players.length, courts });

            const history = this.buildHistory(matchesHistory, players, roundNum);
            const effectiveCourts = Math.min(courts, Math.floor(players.length / 4));
            const activePlayersNeeded = effectiveCourts * 4;
            const byesCount = players.length - activePlayersNeeded;

            // 1. Selección de descansos (Byes)
            const { activePlayers, restingPlayers } = solver.selectByes(players, byesCount, history);

            // 2. CSP Global Matching
            const solveOptions = {
                roundNum,
                isMixed: false,
                hardNoRepeatPartner: options.hardNoRepeatPartner !== undefined ? options.hardNoRepeatPartner : true,
                ...options
            };

            const matches = solver.solveGlobal(activePlayers, effectiveCourts, history, solveOptions);

            // 3. Actualizar pista actual en los jugadores
            const courtMap = {};
            matches.forEach(m => {
                const c = parseInt(m.court);
                [...(m.team_a_ids || []), ...(m.team_b_ids || [])].forEach(pid => {
                    courtMap[String(pid)] = c;
                });
            });

            const updatedPlayers = players.map(p => {
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
        module.exports = { AmericanaClasicaMode };
    }
    if (typeof window !== 'undefined') {
        window.AmericanaClasicaMode = AmericanaClasicaMode;
    }
})();
