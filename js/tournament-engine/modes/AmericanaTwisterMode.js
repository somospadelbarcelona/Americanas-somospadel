/**
 * AmericanaTwisterMode.js
 * Modalidad Americana Twister pura.
 *
 * REGLAS SAGRADAS DE TWISTER:
 * 1. Si ganan, suben de pista y se cambian de pareja.
 * 2. Si pierden, bajan de pista y se cambian de pareja.
 * 3. Si están en la pista más alta (P1) y ganan, se quedan en P1 y se cambian de pareja entre sí.
 * 4. Si están en la pista más baja (PK) y pierden, se quedan en PK y se cambian de pareja entre sí.
 * 5. NO IMPORTA EL GÉNERO EN TWISTER: pueden jugar dos chicos juntos, dos chicas juntas o mixto,
 *    NUNCA separar por género ni forzar parejas chico-chica en Twister.
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

    class AmericanaTwisterMode extends BaseTournamentMode {
        constructor() {
            super(
                'twister',
                'Americana Twister',
                'Dinámica universal de ascensos y descensos individuales: ganadores suben y rotan, perdedores bajan y rotan, sin restricción de género.'
            );
        }

        configureConstraints(constraints, config = {}) {
            // En Twister, no repetir el compañero anterior es mandatorio e inquebrantable
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

            logger.logDecision('TWISTER_START_ROUND', { roundNum, totalPlayers: players.length, courts });

            const effectiveCourts = Math.min(courts, Math.floor(players.length / 4));
            const activePlayersNeeded = effectiveCourts * 4;
            const byesCount = players.length - activePlayersNeeded;

            const history = this.buildHistory(matchesHistory, players, roundNum);

            // 1. Gestión de descansos
            const { activePlayers, restingPlayers } = solver.selectByes(players, byesCount, history);

            // Registro universal y exhaustivo de jugadores (por id, uid, _id, nombre y nombre normalizado)
            const normalizeKey = str => String(str || '')
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .trim();

            const playerRegistry = new Map();
            const registerPlayer = (p) => {
                if (!p) return;
                if (p.id) playerRegistry.set(String(p.id), p);
                if (p.uid) playerRegistry.set(String(p.uid), p);
                if (p._id) playerRegistry.set(String(p._id), p);
                if (p.name) {
                    playerRegistry.set(String(p.name).trim(), p);
                    playerRegistry.set(normalizeKey(p.name), p);
                }
            };

            players.forEach(p => registerPlayer(p));
            activePlayers.forEach(p => registerPlayer(p));

            const resolvePlayer = (idOrObjOrName) => {
                if (!idOrObjOrName) return null;
                if (typeof idOrObjOrName === 'object') {
                    const idCandidate = idOrObjOrName.id || idOrObjOrName.uid || idOrObjOrName._id;
                    if (idCandidate && playerRegistry.has(String(idCandidate))) {
                        return playerRegistry.get(String(idCandidate));
                    }
                    if (idOrObjOrName.name) {
                        const nameKey = normalizeKey(idOrObjOrName.name);
                        if (playerRegistry.has(nameKey)) return playerRegistry.get(nameKey);
                        if (playerRegistry.has(String(idOrObjOrName.name).trim())) return playerRegistry.get(String(idOrObjOrName.name).trim());
                    }
                }
                const key = String(idOrObjOrName).trim();
                if (playerRegistry.has(key)) return playerRegistry.get(key);
                const norm = normalizeKey(key);
                if (playerRegistry.has(norm)) return playerRegistry.get(norm);

                return activePlayers.find(p =>
                    String(p.id) === key ||
                    String(p.uid) === key ||
                    String(p._id) === key ||
                    normalizeKey(p.name) === norm
                ) || players.find(p =>
                    String(p.id) === key ||
                    String(p.uid) === key ||
                    String(p._id) === key ||
                    normalizeKey(p.name) === norm
                ) || null;
            };

            if (roundNum === 1) {
                // --- RONDA 1: Asignación inicial por nivel o pista preasignada ---
                const sorted = [...activePlayers].sort((a, b) => {
                    const cA = a.current_court || 999;
                    const cB = b.current_court || 999;
                    if (cA !== cB) return cA - cB;
                    return (parseFloat(b.level || 3.0) - parseFloat(a.level || 3.0));
                });

                const playersByCourt = {};
                for (let c = 1; c <= effectiveCourts; c++) {
                    const startIdx = (c - 1) * 4;
                    playersByCourt[c] = sorted.slice(startIdx, startIdx + 4);
                }

                // Resolver emparejamientos en R1 forzando isMixed: false
                const matches = solver.solveCourtLocked(playersByCourt, history, {
                    ...options,
                    roundNum,
                    hardNoRepeatPartner: false,
                    isMixed: false
                });

                return this._finalizeRound(players, matches, restingPlayers);
            }

            // --- RONDA 2+: Reglas Universales de Ascensos y Descensos Twister ---
            const prevRound = roundNum - 1;
            const prevMatches = matchesHistory.filter(m => parseInt(m.round) === prevRound);

            // Extracción robusta de ganadores y perdedores por pista de la ronda anterior
            const courtResults = this._extractPreviousRoundCourtResults(prevMatches, effectiveCourts, resolvePlayer);

            logger.logDecision('TWISTER_PREV_COURT_RESULTS', {
                prevRound,
                courtResults: courtResults.map(cr => ({
                    court: cr.court,
                    winners: cr.winners.map(p => p.name || p.id),
                    losers: cr.losers.map(p => p.name || p.id)
                }))
            });

            // Asignar los dos pares entrantes a cada pista según las 4 Reglas Sagradas
            const matches = [];

            for (let c = 1; c <= effectiveCourts; c++) {
                let pairA = []; // Procedencia 1
                let pairB = []; // Procedencia 2

                if (effectiveCourts === 1) {
                    // Si solo hay 1 pista: ganadores se quedan y perdedores se quedan
                    pairA = courtResults[0].winners;
                    pairB = courtResults[0].losers;
                } else if (c === 1) {
                    // Pista 1 (Pista más alta):
                    // Regla 3: Ganadores de P1 se quedan en P1 (2 jugadores)
                    // Regla 1: Ganadores de P2 suben a P1 (2 jugadores)
                    pairA = courtResults[0].winners;
                    pairB = courtResults[1].winners;
                } else if (c === effectiveCourts) {
                    // Pista K (Pista más baja):
                    // Regla 2: Perdedores de P(K-1) bajan a P(K) (2 jugadores)
                    // Regla 4: Perdedores de P(K) se quedan en P(K) (2 jugadores)
                    pairA = courtResults[effectiveCourts - 2].losers;
                    pairB = courtResults[effectiveCourts - 1].losers;
                } else {
                    // Pista C intermedia (1 < C < K):
                    // Regla 2: Perdedores de P(C-1) bajan a P(C) (2 jugadores)
                    // Regla 1: Ganadores de P(C+1) suben a P(C) (2 jugadores)
                    pairA = courtResults[c - 2].losers;
                    pairB = courtResults[c].winners;
                }

                // Manejo de contingencia si algún jugador entró del descanso o faltan datos
                const courtFourPlayers = this._ensureCourtFourPlayers(pairA, pairB, c, activePlayers, matches);
                const actualPairA = courtFourPlayers.pairA;
                const actualPairB = courtFourPlayers.pairB;

                // Formación obligatoria de parejas:
                // Los 2 jugadores que vienen de ser compañeros (actualPairA[0] y actualPairA[1],
                // así como actualPairB[0] y actualPairB[1]) DEBEN SEPARARSE.
                // Uno va al Equipo A y otro al Equipo B.
                const match = this._createSmartSeparatedMatch(
                    actualPairA,
                    actualPairB,
                    c,
                    roundNum,
                    history,
                    constraints,
                    options
                );

                matches.push(match);
            }

            return this._finalizeRound(players, matches, restingPlayers);
        }

        /**
         * Extrae de forma robusta los ganadores y perdedores de cada pista de la ronda previa
         * soportando todas las variantes de estructura de datos posibles.
         */
        _extractPreviousRoundCourtResults(prevMatches, totalCourts, resolvePlayer) {
            const results = [];

            // Helper para obtener IDs de jugadores de cualquier formato
            const getTeamIds = (teamIds, teamPlayers, p1, p2) => {
                if (Array.isArray(teamIds) && teamIds.length > 0) {
                    return teamIds.map(id => String(id && typeof id === 'object' ? (id.id || id.uid || id._id || id.name) : id)).filter(Boolean);
                }
                if (Array.isArray(teamPlayers) && teamPlayers.length > 0) {
                    return teamPlayers.map(p => String(p && typeof p === 'object' ? (p.id || p.uid || p._id || p.name) : p)).filter(Boolean);
                }
                const res = [];
                if (p1) res.push(String(typeof p1 === 'object' ? (p1.id || p1.uid || p1.name) : p1));
                if (p2) res.push(String(typeof p2 === 'object' ? (p2.id || p2.uid || p2.name) : p2));
                return res.filter(Boolean);
            };

            for (let c = 1; c <= totalCourts; c++) {
                const match = prevMatches.find(m => parseInt(m.court || m.courtNum || m.court_number || 0) === c);

                if (!match) {
                    throw new Error(`Falta el partido de la Pista ${c} de la ronda anterior. Introduce todos los resultados antes de continuar.`);
                }

                const teamAIds = getTeamIds(
                    match.team_a_ids || match.teamA_ids,
                    match.team_a_players || match.teamAPlayers,
                    match.player_a1_id || match.player1_id,
                    match.player_a2_id || match.player2_id
                );

                const teamBIds = getTeamIds(
                    match.team_b_ids || match.teamB_ids,
                    match.team_b_players || match.teamBPlayers,
                    match.player_b1_id || match.player3_id,
                    match.player_b2_id || match.player4_id
                );

                const scoreA = parseInt(match.score_a ?? match.games_a ?? match.scoreA ?? match.gamesA ?? 0);
                const scoreB = parseInt(match.score_b ?? match.games_b ?? match.scoreB ?? match.gamesB ?? 0);

                let teamAWon = null;
                const w = String(match.winner || '').toLowerCase().trim();
                if (w === 'team_a' || w === 'a' || w === 'teama' || w === '1') {
                    teamAWon = true;
                } else if (w === 'team_b' || w === 'b' || w === 'teamb' || w === '2') {
                    teamAWon = false;
                } else if (scoreA > scoreB) {
                    teamAWon = true;
                } else if (scoreB > scoreA) {
                    teamAWon = false;
                }

                if (teamAWon === null) {
                    const r = match.round ? ` de la Ronda ${match.round}` : '';
                    throw new Error(`La Pista ${c}${r} no tiene un ganador válido (marcador ${scoreA}-${scoreB}). Por favor introduce o corrige el resultado antes de generar la siguiente ronda.`);
                }

                const winningIds = teamAWon ? teamAIds : teamBIds;
                const losingIds = teamAWon ? teamBIds : teamAIds;

                const winners = winningIds.map(id => resolvePlayer(id));
                const losers = losingIds.map(id => resolvePlayer(id));

                const unresolvedW = winners.findIndex(p => !p);
                if (unresolvedW !== -1) {
                    throw new Error(`En la Pista ${c} de la ronda anterior no se pudo identificar al jugador ganador '${winningIds[unresolvedW]}'.`);
                }
                const unresolvedL = losers.findIndex(p => !p);
                if (unresolvedL !== -1) {
                    throw new Error(`En la Pista ${c} de la ronda anterior no se pudo identificar al jugador perdedor '${losingIds[unresolvedL]}'.`);
                }

                if (winners.length !== 2) {
                    throw new Error(`La Pista ${c} de la ronda anterior debe tener exactamente 2 ganadores (tiene ${winners.length}).`);
                }
                if (losers.length !== 2) {
                    throw new Error(`La Pista ${c} de la ronda anterior debe tener exactamente 2 perdedores (tiene ${losers.length}).`);
                }

                results.push({
                    court: c,
                    winners,
                    losers
                });
            }

            return results;
        }

        /**
         * Asegura exactamente 4 jugadores en la pista distribuidos en dos pares entrantes de 2 jugadores,
         * manejando si hubo descansos (BYEs) o jugadores sin datos previos.
         */
        _ensureCourtFourPlayers(pairA, pairB, courtNum, activePlayers, existingMatches) {
            const activeIdsSet = new Set(activePlayers.map(p => String(p.id || p.uid)));
            const alreadyAssignedIds = new Set();
            existingMatches.forEach(m => {
                [...(m.team_a_ids || []), ...(m.team_b_ids || [])].forEach(id => alreadyAssignedIds.add(String(id)));
            });

            // Solo jugadores que están activos (NO descansando) y aún no asignados en otra pista
            let cleanA = pairA.filter(p => p && activeIdsSet.has(String(p.id || p.uid)) && !alreadyAssignedIds.has(String(p.id || p.uid)));
            let cleanB = pairB.filter(p => p && activeIdsSet.has(String(p.id || p.uid)) && !alreadyAssignedIds.has(String(p.id || p.uid)));

            // Si ambos pares entrantes tienen exactamente 2 jugadores únicos, no tocar nada
            if (cleanA.length === 2 && cleanB.length === 2) {
                return { pairA: cleanA, pairB: cleanB };
            }

            const currentAssigned = new Set([...cleanA, ...cleanB].map(p => String(p.id || p.uid)));
            const unassigned = activePlayers.filter(p =>
                !alreadyAssignedIds.has(String(p.id || p.uid)) &&
                !currentAssigned.has(String(p.id || p.uid))
            );

            // Rellenar pairA si le faltan jugadores (ej. por descansos)
            while (cleanA.length < 2 && unassigned.length > 0) {
                cleanA.push(unassigned.shift());
            }

            // Rellenar pairB si le faltan jugadores (ej. por descansos)
            while (cleanB.length < 2 && unassigned.length > 0) {
                cleanB.push(unassigned.shift());
            }

            return { pairA: cleanA.slice(0, 2), pairB: cleanB.slice(0, 2) };
        }

        /**
         * Crea el partido para la pista garantizando que los 2 jugadores que vienen de ser compañeros
         * SE SEPAREN OBLIGATORIAMENTE (uno al Equipo A y otro al Equipo B).
         * Evalúa las 2 opciones válidas según el historial acumulado del torneo para desempatar,
         * forzando SIEMPRE isMixed: false.
         */
        _createSmartSeparatedMatch(pairA, pairB, courtNum, roundNum, history, constraints, options = {}) {
            const pA0 = pairA[0] || { id: `C${courtNum}_A0`, name: `Pista ${courtNum} A0` };
            const pA1 = pairA[1] || { id: `C${courtNum}_A1`, name: `Pista ${courtNum} A1` };
            const pB0 = pairB[0] || { id: `C${courtNum}_B0`, name: `Pista ${courtNum} B0` };
            const pB1 = pairB[1] || { id: `C${courtNum}_B1`, name: `Pista ${courtNum} B1` };

            // Las únicas dos configuraciones válidas que separan a pA0 de pA1 Y a pB0 de pB1:
            // Opción 1: (pA0 + pB0) vs (pA1 + pB1)
            const cfg1 = {
                teamA: [pA0, pB0],
                teamB: [pA1, pB1]
            };

            // Opción 2: (pA0 + pB1) vs (pA1 + pB0)
            const cfg2 = {
                teamA: [pA0, pB1],
                teamB: [pA1, pB0]
            };

            // Evaluar ambas configuraciones con constraints (isMixed SIEMPRE false en Twister)
            const evalOpts = {
                ...options,
                roundNum,
                hardNoRepeatPartner: false,
                isMixed: false
            };

            let score1 = 0;
            let score2 = 0;

            if (constraints && typeof constraints.evaluateMatch === 'function') {
                const res1 = constraints.evaluateMatch(cfg1.teamA, cfg1.teamB, courtNum, history, evalOpts);
                const res2 = constraints.evaluateMatch(cfg2.teamA, cfg2.teamB, courtNum, history, evalOpts);
                score1 = res1.score !== undefined ? res1.score : 0;
                score2 = res2.score !== undefined ? res2.score : 0;
            }

            // Elegir la opción con mejor puntuación (menor repetición de rondas anteriores o mejor balance)
            const chosen = (score1 >= score2) ? cfg1 : cfg2;

            const teamAIds = chosen.teamA.map(p => String(p.id || p.uid));
            const teamBIds = chosen.teamB.map(p => String(p.id || p.uid));
            const teamANames = chosen.teamA.map(p => p.name || `P_${p.id || p.uid}`);
            const teamBNames = chosen.teamB.map(p => p.name || `P_${p.id || p.uid}`);

            return {
                round: roundNum,
                court: courtNum,
                team_a_ids: teamAIds,
                team_b_ids: teamBIds,
                team_a_names: teamANames,
                team_b_names: teamBNames,
                team_a_players: chosen.teamA,
                team_b_players: chosen.teamB,
                teamA: teamANames.join(' / '),
                teamB: teamBNames.join(' / '),
                status: 'scheduled',
                score_a: 0,
                score_b: 0
            };
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
                const court = courtMap[pid] !== undefined ? courtMap[pid] : null;

                // Actualizar last_partner y partner_history si jugó en esta ronda
                let lastPartner = p.last_partner;
                let partnerHistory = Array.isArray(p.partner_history)
                    ? [...p.partner_history]
                    : (lastPartner ? [String(lastPartner)] : []);

                const myMatch = matches.find(m =>
                    (m.team_a_ids || []).includes(pid) || (m.team_b_ids || []).includes(pid)
                );

                if (myMatch) {
                    const team = (myMatch.team_a_ids || []).includes(pid)
                        ? myMatch.team_a_ids
                        : myMatch.team_b_ids;
                    const partnerId = team.find(id => String(id) !== pid);
                    if (partnerId) {
                        lastPartner = String(partnerId);
                        partnerHistory = [lastPartner, ...partnerHistory.filter(id => String(id) !== lastPartner)];
                    }
                }

                return {
                    ...p,
                    current_court: court,
                    last_partner: lastPartner,
                    partner_history: partnerHistory,
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
        module.exports = { AmericanaTwisterMode };
    }
    if (typeof window !== 'undefined') {
        window.AmericanaTwisterMode = AmericanaTwisterMode;
    }
})();
