/**
 * TwisterInvariantGuard.js
 * 
 * Guardián de Invariantes Matemáticas para el Modo Twister (y ascensos/descensos).
 * Funciona de forma isomórfica (Node.js y Navegador).
 * 
 * REGLAS SAGRADAS DE TWISTER:
 * 1. Ganadores suben de pista (P_c -> P_{c-1}) y se separan de pareja.
 * 2. Perdedores bajan de pista (P_c -> P_{c+1}) y se separan de pareja.
 * 3. Ganadores de Pista 1 se quedan en Pista 1 y se separan de pareja entre sí.
 * 4. Perdedores de Pista K se quedan en Pista K y se separan de pareja entre sí.
 * 5. Universalidad: No depende de género ni de casos específicos (válido para K pistas).
 * 6. Sin empates silenciosos: Un partido sin ganador claro bloquea la generación.
 */

(function () {
    'use strict';

    const TwisterInvariantGuard = {

        /**
         * Extrae IDs de jugadores de cualquier estructura de partido
         */
        extractPlayerIds(teamIds, teamPlayers, p1, p2) {
            if (Array.isArray(teamIds) && teamIds.length > 0) {
                return teamIds.map(id => String(id && typeof id === 'object' ? (id.id || id.uid) : id)).filter(Boolean);
            }
            if (Array.isArray(teamPlayers) && teamPlayers.length > 0) {
                return teamPlayers.map(p => String(p && typeof p === 'object' ? (p.id || p.uid) : p)).filter(Boolean);
            }
            const res = [];
            if (p1) res.push(String(typeof p1 === 'object' ? (p1.id || p1.uid) : p1));
            if (p2) res.push(String(typeof p2 === 'object' ? (p2.id || p2.uid) : p2));
            return res;
        },

        /**
         * Determina el ganador estricto de un partido.
         * Lanza error descriptivo si el partido está empatado o no tiene ganador claro.
         */
        getStrictMatchWinner(match, courtNum, roundNum) {
            const teamAIds = this.extractPlayerIds(
                match.team_a_ids || match.teamA_ids,
                match.team_a_players || match.teamAPlayers,
                match.player_a1_id || match.player1_id,
                match.player_a2_id || match.player2_id
            );
            const teamBIds = this.extractPlayerIds(
                match.team_b_ids || match.teamB_ids,
                match.team_b_players || match.teamBPlayers,
                match.player_b1_id || match.player3_id,
                match.player_b2_id || match.player4_id
            );

            const scoreA = parseInt(match.score_a ?? match.games_a ?? match.scoreA ?? match.gamesA ?? 0);
            const scoreB = parseInt(match.score_b ?? match.games_b ?? match.scoreB ?? match.gamesB ?? 0);

            const winnerField = String(match.winner || '').toLowerCase().trim();

            let teamAWon = null;
            if (winnerField === 'team_a' || winnerField === 'a' || winnerField === 'teama' || winnerField === '1') {
                teamAWon = true;
            } else if (winnerField === 'team_b' || winnerField === 'b' || winnerField === 'teamb' || winnerField === '2') {
                teamAWon = false;
            } else if (scoreA > scoreB) {
                teamAWon = true;
            } else if (scoreB > scoreA) {
                teamAWon = false;
            }

            if (teamAWon === null) {
                const rText = roundNum ? ` de la Ronda ${roundNum}` : '';
                const cText = courtNum ? `Pista ${courtNum}` : 'Pista desconocida';
                throw new Error(
                    `La ${cText}${rText} no tiene un ganador válido (marcador ${scoreA}-${scoreB}). Por favor introduce o corrige el resultado antes de generar la siguiente ronda.`
                );
            }

            return {
                court: parseInt(courtNum || match.court || 1),
                teamAIds,
                teamBIds,
                winners: teamAWon ? teamAIds : teamBIds,
                losers: teamAWon ? teamBIds : teamAIds,
                scoreA,
                scoreB
            };
        },

        /**
         * Valida de manera independiente que una ronda propuesta cumple rigurosamente
         * todos los invariantes matemáticos de Twister respecto a la ronda anterior.
         * 
         * @param {Array} prevRoundMatches - Partidos de la ronda R-1
         * @param {Array} newMatches - Partidos propuestos para la ronda R
         * @param {number} numCourts - Número de pistas
         * @param {Object} [options] - Opciones adicionales (ej. mapa de nombres)
         * @returns {{ valid: boolean, errors: string[] }}
         */
        validate(prevRoundMatches, newMatches, numCourts, options = {}) {
            const errors = [];

            if (!Array.isArray(prevRoundMatches) || prevRoundMatches.length === 0) {
                return { valid: true, errors: [] }; // Ronda 1 o sin historial previo
            }

            if (!Array.isArray(newMatches) || newMatches.length === 0) {
                return { valid: false, errors: ['No se generaron partidos para validar.'] };
            }

            const effectiveCourts = parseInt(numCourts || newMatches.length);
            const prevRoundNum = prevRoundMatches[0]?.round;
            const newRoundNum = newMatches[0]?.round;

            // 1. Extraer resultados estrictos de la ronda previa por pista
            const prevCourtResults = new Map();
            const prevPartnerMap = new Map(); // id -> compañero en R-1
            const playerPrevMovement = new Map(); // id -> { court, won, expectedNextCourt }

            for (let c = 1; c <= effectiveCourts; c++) {
                const match = prevRoundMatches.find(m => parseInt(m.court || m.courtNum || 0) === c);
                if (!match) {
                    errors.push(`Falta el partido de la Pista ${c} en la Ronda ${prevRoundNum || 'anterior'}.`);
                    continue;
                }

                let courtResult;
                try {
                    courtResult = this.getStrictMatchWinner(match, c, prevRoundNum);
                } catch (e) {
                    errors.push(e.message);
                    continue;
                }

                prevCourtResults.set(c, courtResult);

                // Mapear parejas previas
                if (courtResult.teamAIds.length >= 2) {
                    prevPartnerMap.set(courtResult.teamAIds[0], courtResult.teamAIds[1]);
                    prevPartnerMap.set(courtResult.teamAIds[1], courtResult.teamAIds[0]);
                }
                if (courtResult.teamBIds.length >= 2) {
                    prevPartnerMap.set(courtResult.teamBIds[0], courtResult.teamBIds[1]);
                    prevPartnerMap.set(courtResult.teamBIds[1], courtResult.teamBIds[0]);
                }

                // Calcular pista esperada según Reglas Sagradas
                // Ganador P1 -> P1
                // Ganador P(c>1) -> P(c-1)
                // Perdedor P(c<K) -> P(c+1)
                // Perdedor P(K) -> P(K)
                courtResult.winners.forEach(pid => {
                    const expectedCourt = (c === 1) ? 1 : (c - 1);
                    playerPrevMovement.set(pid, { court: c, won: true, expectedCourt });
                });

                courtResult.losers.forEach(pid => {
                    const expectedCourt = (c === effectiveCourts) ? effectiveCourts : (c + 1);
                    playerPrevMovement.set(pid, { court: c, won: false, expectedCourt });
                });
            }

            // Si ya hay errores en los partidos previos (ej. empates), abortar inmediatamente
            if (errors.length > 0) {
                return { valid: false, errors };
            }

            // 2. Validar cada partido nuevo propuesto
            const assignedPlayerIds = new Set();

            for (const match of newMatches) {
                const c = parseInt(match.court || 0);
                const teamA = this.extractPlayerIds(
                    match.team_a_ids || match.teamA_ids,
                    match.team_a_players || match.teamAPlayers,
                    match.player_a1_id || match.player1_id,
                    match.player_a2_id || match.player2_id
                );
                const teamB = this.extractPlayerIds(
                    match.team_b_ids || match.teamB_ids,
                    match.team_b_players || match.teamBPlayers,
                    match.player_b1_id || match.player3_id,
                    match.player_b2_id || match.player4_id
                );

                const courtPlayers = [...teamA, ...teamB];

                // Check 2.1: Cuatro jugadores por pista
                if (courtPlayers.length !== 4) {
                    errors.push(`Pista ${c}: Debe tener exactamente 4 jugadores, pero tiene ${courtPlayers.length}.`);
                }

                // Check 2.2: Duplicados
                for (const pid of courtPlayers) {
                    if (assignedPlayerIds.has(pid)) {
                        errors.push(`Pista ${c}: El jugador ${pid} está duplicado en la misma ronda.`);
                    }
                    assignedPlayerIds.add(pid);
                }

                // Check 2.3: Invariante de pista (Ascensos/Descensos correctos)
                for (const pid of courtPlayers) {
                    const prevInfo = playerPrevMovement.get(pid);
                    if (prevInfo) {
                        if (prevInfo.expectedCourt !== c) {
                            const status = prevInfo.won ? 'ganó' : 'perdió';
                            errors.push(
                                `Pista ${c}: El jugador con ID '${pid}' ${status} en Pista ${prevInfo.court} (R${prevRoundNum}) y debía estar en Pista ${prevInfo.expectedCourt}, pero fue asignado a Pista ${c}.`
                            );
                        }
                    }
                }

                // Check 2.4: Invariante de separación de pareja (Regla Sagrada: "y se cambian de pareja")
                // En Team A:
                if (teamA.length >= 2) {
                    const p1 = teamA[0];
                    const p2 = teamA[1];
                    if (prevPartnerMap.get(p1) === p2) {
                        errors.push(
                            `Pista ${c}: Los jugadores '${p1}' y '${p2}' jugaron juntos en la ronda anterior y repiten como pareja en el Equipo A.`
                        );
                    }
                }

                // En Team B:
                if (teamB.length >= 2) {
                    const p1 = teamB[0];
                    const p2 = teamB[1];
                    if (prevPartnerMap.get(p1) === p2) {
                        errors.push(
                            `Pista ${c}: Los jugadores '${p1}' y '${p2}' jugaron juntos en la ronda anterior y repiten como pareja en el Equipo B.`
                        );
                    }
                }
            }

            // Check 2.5: Verificación de composición exacta de pista si no hay descansos (BYEs)
            // Cuando totalPlayers === 4 * effectiveCourts:
            if (assignedPlayerIds.size === effectiveCourts * 4) {
                for (let c = 1; c <= effectiveCourts; c++) {
                    let expectedIds = [];
                    if (effectiveCourts === 1) {
                        const r1 = prevCourtResults.get(1);
                        expectedIds = [...(r1?.winners || []), ...(r1?.losers || [])];
                    } else if (c === 1) {
                        const r1 = prevCourtResults.get(1);
                        const r2 = prevCourtResults.get(2);
                        expectedIds = [...(r1?.winners || []), ...(r2?.winners || [])];
                    } else if (c === effectiveCourts) {
                        const rPenult = prevCourtResults.get(effectiveCourts - 1);
                        const rLast = prevCourtResults.get(effectiveCourts);
                        expectedIds = [...(rPenult?.losers || []), ...(rLast?.losers || [])];
                    } else {
                        const rAbove = prevCourtResults.get(c - 1);
                        const rBelow = prevCourtResults.get(c + 1);
                        expectedIds = [...(rAbove?.losers || []), ...(rBelow?.winners || [])];
                    }

                    const match = newMatches.find(m => parseInt(m.court || 0) === c);
                    if (match) {
                        const actualIds = this.extractPlayerIds(
                            match.team_a_ids || match.teamA_ids,
                            match.team_a_players || match.teamAPlayers,
                            match.player_a1_id || match.player1_id,
                            match.player_a2_id || match.player2_id
                        ).concat(
                            this.extractPlayerIds(
                                match.team_b_ids || match.teamB_ids,
                                match.team_b_players || match.teamBPlayers,
                                match.player_b1_id || match.player3_id,
                                match.player_b2_id || match.player4_id
                            )
                        );

                        const expectedSet = new Set(expectedIds);
                        for (const eid of actualIds) {
                            if (!expectedSet.has(eid)) {
                                errors.push(`Pista ${c}: El jugador '${eid}' no pertenece a la pista ${c} según el cálculo teórico de ascensos/descensos.`);
                            }
                        }
                    }
                }
            }

            return {
                valid: errors.length === 0,
                errors: [...new Set(errors)] // Eliminar posibles duplicados
            };
        }
    };

    // Exportación isomórfica (Node.js y Navegador)
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = TwisterInvariantGuard;
        module.exports.TwisterInvariantGuard = TwisterInvariantGuard;
        module.exports.default = TwisterInvariantGuard;
    }

    if (typeof window !== 'undefined') {
        window.TwisterInvariantGuard = TwisterInvariantGuard;
    }

    if (typeof globalThis !== 'undefined') {
        globalThis.TwisterInvariantGuard = TwisterInvariantGuard;
    }

})();
