/**
 * EntrenoLibreMode.js
 * Modalidad de Entrenamiento Libre.
 * Sesión flexible que garantiza reparto equitativo de descansos y minutos de pista,
 * con restricciones relajadas para máxima versatilidad del entrenador.
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

    class EntrenoLibreMode extends BaseTournamentMode {
        constructor() {
            super(
                'entreno_libre',
                'Entrenamiento Libre',
                'Formato flexible enfocado en reparto equitativo de tiempo en pista y descansos.'
            );
        }

        configureConstraints(constraints, config = {}) {
            // Restricciones suaves
            constraints.setWeight('partnerRepeatImmediate', 50000);
            constraints.setWeight('opponentRepeatImmediate', 2000);
            constraints.setWeight('courtRepeat', 100);
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

            logger.logDecision('ENTRENO_LIBRE_START_ROUND', { roundNum, totalPlayers: players.length, courts });

            const history = this.buildHistory(matchesHistory, players, roundNum);
            const effectiveCourts = Math.min(courts, Math.floor(players.length / 4));
            const activePlayersNeeded = effectiveCourts * 4;
            const byesCount = players.length - activePlayersNeeded;

            const { activePlayers, restingPlayers } = solver.selectByes(players, byesCount, history);

            const solveOptions = {
                roundNum,
                isMixed: false,
                isEntreno: true,
                hardNoRepeatPartner: false, // Suave en modo libre
                ...options
            };

            const matches = solver.solveGlobal(activePlayers, effectiveCourts, history, solveOptions);

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
        module.exports = { EntrenoLibreMode };
    }
    if (typeof window !== 'undefined') {
        window.EntrenoLibreMode = EntrenoLibreMode;
    }
})();
