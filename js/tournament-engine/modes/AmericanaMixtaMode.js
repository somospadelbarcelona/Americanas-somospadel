/**
 * AmericanaMixtaMode.js
 * Modalidad Americana Mixta.
 * Garantiza estrictamente que cada pareja esté compuesta por 1 hombre y 1 mujer.
 * Resuelve emparejamientos mediante Bipartite Matching CSP optimizando la rotación
 * para que ningún hombre ni mujer repita pareja.
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

    class AmericanaMixtaMode extends BaseTournamentMode {
        constructor() {
            super(
                'mixta',
                'Americana Mixta',
                'Parejas mixtas obligatorias (1 chico + 1 chica) con rotación combinatoria óptima.'
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

            logger.logDecision('AMERICANA_MIXTA_START_ROUND', { roundNum, totalPlayers: players.length, courts });

            const getGender = (p) => {
                const g = String(p.gender || p.sex || '').trim().toLowerCase();
                if (g.startsWith('m') || g === 'hombre' || g === 'masculino' || g === 'chico') return 'M';
                if (g.startsWith('f') || g === 'mujer' || g === 'femenino' || g === 'chica') return 'F';
                return 'UNKNOWN';
            };

            const men = players.filter(p => getGender(p) === 'M');
            const women = players.filter(p => getGender(p) === 'F');

            // Calcular pistas máximas mixtas posibles
            const maxCourtsMixed = Math.min(courts, Math.floor(men.length / 2), Math.floor(women.length / 2));
            if (maxCourtsMixed < 1) {
                throw new Error(`Americana Mixta no puede disputarse: No hay suficientes hombres (${men.length}) o mujeres (${women.length}) para formar al menos 1 pista (2H + 2M).`);
            }

            const effectiveCourts = maxCourtsMixed;
            const targetActivePerGender = effectiveCourts * 2;

            const history = this.buildHistory(matchesHistory, players, roundNum);

            // Seleccionar descansos balanceados por género
            const menByesCount = men.length - targetActivePerGender;
            const womenByesCount = women.length - targetActivePerGender;

            const { activePlayers: activeMen, restingPlayers: restingMen } = solver.selectByes(men, menByesCount, history);
            const { activePlayers: activeWomen, restingPlayers: restingWomen } = solver.selectByes(women, womenByesCount, history);

            const activePlayers = [...activeMen, ...activeWomen];
            const restingPlayers = [...restingMen, ...restingWomen];

            // Resolver con Bipartite CSP Solver
            const solveOptions = {
                roundNum,
                isMixed: true,
                hardNoRepeatPartner: options.hardNoRepeatPartner !== undefined ? options.hardNoRepeatPartner : true,
                ...options
            };

            const matches = solver.solveGlobal(activePlayers, effectiveCourts, history, solveOptions);

            // Mapear pistas resultantes
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
        module.exports = { AmericanaMixtaMode };
    }
    if (typeof window !== 'undefined') {
        window.AmericanaMixtaMode = AmericanaMixtaMode;
    }
})();
