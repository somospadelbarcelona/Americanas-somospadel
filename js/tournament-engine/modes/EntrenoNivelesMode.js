/**
 * EntrenoNivelesMode.js
 * Modalidad de Entrenamiento por Niveles.
 * Segmenta a los jugadores por franjas homogéneas de nivel de juego en cada pista,
 * asegurando la máxima igualdad y competitividad, mientras rota parejas internamente
 * para evitar repeticiones.
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

    class EntrenoNivelesMode extends BaseTournamentMode {
        constructor() {
            super(
                'entreno_niveles',
                'Entrenamiento por Niveles',
                'Agrupación estricta por nivel en cada pista con rotación de parejas para máxima competitividad.'
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

            logger.logDecision('ENTRENO_NIVELES_START_ROUND', { roundNum, totalPlayers: players.length, courts });

            const history = this.buildHistory(matchesHistory, players, roundNum);
            const effectiveCourts = Math.min(courts, Math.floor(players.length / 4));
            const activePlayersNeeded = effectiveCourts * 4;
            const byesCount = players.length - activePlayersNeeded;

            const { activePlayers, restingPlayers } = solver.selectByes(players, byesCount, history);

            // Ordenar jugadores estrictamente por nivel (mayor a menor)
            activePlayers.sort((a, b) => {
                const lvlA = parseFloat(a.level || a.self_rate_level || 3.0);
                const lvlB = parseFloat(b.level || b.self_rate_level || 3.0);
                return lvlB - lvlA;
            });

            // Agrupar en pistas por nivel
            const playersByCourt = {};
            for (let c = 1; c <= effectiveCourts; c++) {
                const startIdx = (c - 1) * 4;
                playersByCourt[c] = activePlayers.slice(startIdx, startIdx + 4);
            }

            // Resolver emparejamiento dentro de cada pista homogénea
            const matches = solver.solveCourtLocked(playersByCourt, history, {
                roundNum,
                isEntreno: true,
                hardNoRepeatPartner: false,
                ...options
            });

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
        module.exports = { EntrenoNivelesMode };
    }
    if (typeof window !== 'undefined') {
        window.EntrenoNivelesMode = EntrenoNivelesMode;
    }
})();
