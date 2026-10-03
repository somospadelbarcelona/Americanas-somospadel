/**
 * EntrenoRotacionesMode.js
 * Modalidad de Entrenamiento por Rotaciones Tácticas.
 * Enfocado en sesiones de entrenamiento de club:
 * 1. Prioriza que compañeros del mismo equipo de club se enfrenten cara a cara (Head-to-Head rivalries).
 * 2. Rota compañeros en cada ronda para probar combinaciones dinámicas.
 * 3. Garantiza equilibrio perfecto de minutos de pista y descansos.
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

    class EntrenoRotacionesMode extends BaseTournamentMode {
        constructor() {
            super(
                'entreno_rotaciones',
                'Entrenamiento por Rotaciones',
                'Sesión táctica con alta rotación y fomento de enfrentamientos entre miembros del mismo equipo.'
            );
        }

        configureConstraints(constraints, config = {}) {
            constraints.setWeight('partnerRepeatImmediate', 1000000);
            constraints.setWeight('teammateAsRivalReward', 1000);
            constraints.setWeight('teammateAsPartnerPenalty', 2000);
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

            logger.logDecision('ENTRENO_ROTACIONES_START_ROUND', { roundNum, totalPlayers: players.length, courts });

            const history = this.buildHistory(matchesHistory, players, roundNum);
            const effectiveCourts = Math.min(courts, Math.floor(players.length / 4));
            const activePlayersNeeded = effectiveCourts * 4;
            const byesCount = players.length - activePlayersNeeded;

            const { activePlayers, restingPlayers } = solver.selectByes(players, byesCount, history);

            const solveOptions = {
                roundNum,
                isMixed: false,
                isEntreno: true,
                hardNoRepeatPartner: options.hardNoRepeatPartner !== undefined ? options.hardNoRepeatPartner : true,
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
        module.exports = { EntrenoRotacionesMode };
    }
    if (typeof window !== 'undefined') {
        window.EntrenoRotacionesMode = EntrenoRotacionesMode;
    }
})();
