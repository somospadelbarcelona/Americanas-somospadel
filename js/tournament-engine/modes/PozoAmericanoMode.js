/**
 * PozoAmericanoMode.js
 * Modalidad Pozo Americano (Escalera tradicional con rotación individual).
 * Ganadores suben de pista (excepto Pista 1), perdedores bajan de pista (excepto última pista).
 * En la pista resultante, los 4 jugadores rotan de compañero garantizando no repetir pareja
 * de la ronda inmediatamente anterior.
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

    class PozoAmericanoMode extends BaseTournamentMode {
        constructor() {
            super(
                'pozo',
                'Pozo Americano',
                'Dinámica clásica de subidas y bajadas por pista con reordenamiento inteligente de parejas.'
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

            logger.logDecision('POZO_AMERICANO_START_ROUND', { roundNum, totalPlayers: players.length, courts });

            const effectiveCourts = Math.min(courts, Math.floor(players.length / 4));
            const activePlayersNeeded = effectiveCourts * 4;
            const byesCount = players.length - activePlayersNeeded;

            const history = this.buildHistory(matchesHistory, players, roundNum);
            const { activePlayers, restingPlayers } = solver.selectByes(players, byesCount, history);

            const getGender = (p) => {
                const g = String(p.gender || p.sex || '').trim().toLowerCase();
                if (g.startsWith('m') || g === 'hombre' || g === 'masculino' || g === 'chico') return 'M';
                if (g.startsWith('f') || g === 'mujer' || g === 'femenino' || g === 'chica') return 'F';
                return 'UNKNOWN';
            };

            const isMixed = !!(options.isMixed || options.category === 'mixed' || options.category === 'mixto');
            const men = isMixed ? activePlayers.filter(p => getGender(p) === 'M') : [];
            const women = isMixed ? activePlayers.filter(p => getGender(p) === 'F') : [];

            let playersByCourt = {};

            if (roundNum === 1) {
                if (isMixed) {
                    const sortedMen = [...men].sort((a, b) => (parseFloat(b.level || 3.0) - parseFloat(a.level || 3.0)));
                    const sortedWomen = [...women].sort((a, b) => (parseFloat(b.level || 3.0) - parseFloat(a.level || 3.0)));

                    for (let c = 1; c <= effectiveCourts; c++) {
                        const startIdx = (c - 1) * 2;
                        const courtMen = sortedMen.slice(startIdx, startIdx + 2);
                        const courtWomen = sortedWomen.slice(startIdx, startIdx + 2);
                        playersByCourt[c] = [...courtMen, ...courtWomen];
                    }
                } else {
                    // Ronda 1: orden por nivel o asignación previa
                    const sorted = [...activePlayers].sort((a, b) => {
                        const cA = a.current_court || 999;
                        const cB = b.current_court || 999;
                        if (cA !== cB) return cA - cB;
                        return (parseFloat(b.level || 3.0) - parseFloat(a.level || 3.0));
                    });

                    for (let c = 1; c <= effectiveCourts; c++) {
                        const startIdx = (c - 1) * 4;
                        playersByCourt[c] = sorted.slice(startIdx, startIdx + 4);
                    }
                }
            } else {
                // Ronda 2+: Subidas y Bajadas Pozo
                const prevRound = roundNum - 1;
                const prevMatches = matchesHistory.filter(m => parseInt(m.round) === prevRound);

                const playerMap = {};
                activePlayers.forEach(p => {
                    playerMap[String(p.id || p.uid)] = {
                        ...p,
                        currentCourt: parseInt(p.current_court || effectiveCourts),
                        won: false,
                        playedPrev: false
                    };
                });

                prevMatches.forEach(m => {
                    const c = parseInt(m.court);
                    const sA = parseInt(m.score_a || 0);
                    const sB = parseInt(m.score_b || 0);
                    const teamA = (m.team_a_ids || []).map(String);
                    const teamB = (m.team_b_ids || []).map(String);

                    let teamAWon = null;
                    const w = String(m.winner || '').toLowerCase().trim();
                    if (w === 'team_a' || w === 'a' || w === 'teama' || w === '1') {
                        teamAWon = true;
                    } else if (w === 'team_b' || w === 'b' || w === 'teamb' || w === '2') {
                        teamAWon = false;
                    } else if (sA > sB) {
                        teamAWon = true;
                    } else if (sB > sA) {
                        teamAWon = false;
                    }

                    if (teamAWon === null) {
                        const r = m.round ? ` de la Ronda ${m.round}` : '';
                        throw new Error(`La Pista ${c}${r} no tiene un ganador válido (marcador ${sA}-${sB}). Por favor introduce o corrige el resultado antes de generar la siguiente ronda.`);
                    }

                    const winners = teamAWon ? teamA : teamB;

                    [...teamA, ...teamB].forEach(pid => {
                        if (playerMap[pid]) {
                            playerMap[pid].playedPrev = true;
                            playerMap[pid].currentCourt = c;
                            playerMap[pid].won = winners.includes(pid);
                        }
                    });
                });

                const courtBuckets = {};
                for (let c = 1; c <= effectiveCourts; c++) courtBuckets[c] = [];

                Object.values(playerMap).forEach(p => {
                    let nextCourt = p.currentCourt;
                    if (p.playedPrev) {
                        if (p.won) {
                            nextCourt = Math.max(1, p.currentCourt - 1);
                        } else {
                            nextCourt = Math.min(effectiveCourts, p.currentCourt + 1);
                        }
                    }
                    if (!courtBuckets[nextCourt]) courtBuckets[nextCourt] = [];
                    courtBuckets[nextCourt].push(p);
                });

                // Equilibrar cubos a exactamente 4 jugadores por pista
                playersByCourt = this._balanceBuckets(courtBuckets, effectiveCourts, isMixed);
            }

            // Resolver emparejamientos en cada pista con CSP evitando compañeros recientes
            const matches = solver.solveCourtLocked(playersByCourt, history, {
                roundNum,
                hardNoRepeatPartner: false,
                isMixed: !!isMixed,
                ...options
            });

            return this._finalizeRound(players, matches, restingPlayers);
        }

        _balanceBuckets(buckets, effectiveCourts, isMixed = false) {
            if (isMixed) {
                const getGender = (p) => {
                    const g = String(p.gender || p.sex || '').trim().toLowerCase();
                    if (g.startsWith('m') || g === 'hombre' || g === 'masculino' || g === 'chico') return 'M';
                    if (g.startsWith('f') || g === 'mujer' || g === 'femenino' || g === 'chica') return 'F';
                    return 'UNKNOWN';
                };
                const allMen = [];
                const allWomen = [];
                for (let c = 1; c <= effectiveCourts; c++) {
                    (buckets[c] || []).forEach(p => {
                        if (getGender(p) === 'M') allMen.push(p);
                        else allWomen.push(p);
                    });
                }
                const balanced = {};
                for (let c = 1; c <= effectiveCourts; c++) {
                    const mStart = (c - 1) * 2;
                    const wStart = (c - 1) * 2;
                    balanced[c] = [
                        ...allMen.slice(mStart, mStart + 2),
                        ...allWomen.slice(wStart, wStart + 2)
                    ];
                }
                return balanced;
            }

            const allAssigned = [];
            for (let c = 1; c <= effectiveCourts; c++) {
                allAssigned.push(...(buckets[c] || []));
            }

            const balanced = {};
            for (let c = 1; c <= effectiveCourts; c++) {
                const startIdx = (c - 1) * 4;
                balanced[c] = allAssigned.slice(startIdx, startIdx + 4);
            }
            return balanced;
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
        module.exports = { PozoAmericanoMode };
    }
    if (typeof window !== 'undefined') {
        window.PozoAmericanoMode = PozoAmericanoMode;
    }
})();
