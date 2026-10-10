/**
 * 🔒 FIXED PAIRS LOGIC - Sistema Pozo (Parejas Fijas)
 * Lógica para manejar parejas fijas que juegan todo el torneo juntas
 * y suben o bajan de pista según resultados (Sistema Pozo).
 *
 * Reglas Sagradas:
 * 1. La dupla se mantiene 100% FIJA a lo largo de todas las rondas.
 * 2. Dinámica Pozo:
 *    - Pareja ganadora sube junta a la pista superior (P1 es la máxima, ganador P1 se mantiene en P1).
 *    - Pareja perdedora baja junta a la pista inferior (PN es la más baja, perdedor PN se mantiene en PN).
 *    - Cruces siguiente ronda:
 *      * Pista 1: Ganador P1 vs Ganador P2.
 *      * Pista k: Perdedor P(k-1) vs Ganador P(k+1).
 *      * Pista N: Perdedor P(N-1) vs Perdedor PN.
 * 3. Emparejamiento inicial (Ronda 1):
 *    - Prioridad 1: Parejas explícitas por partner_id o partner_name (insensible a mayúsculas/tildes).
 *    - Prioridad 2: En categoría mixta, duplas chico + chica equilibradas por nivel.
 * 4. Desempate automático en empates (e.g. 5-5):
 *    - Por balance de juegos previos (games_won - games_lost) o sorteo determinista.
 * 5. Si hay número impar de parejas: rotación equitativa del descanso (BYE), sin descansos consecutivos.
 */

(function () {
    'use strict';

    const normalizePartnerString = (str) => String(str || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

    /**
     * Extrae de forma blindada las parejas explícitas solicitadas al apuntarse
     * (por partner_id o por partner_name insensible a mayúsculas/espacios/tildes).
     */
    function extractExplicitPairs(players) {
        const available = players.map(p => ({
            ...p,
            _uid: String(p.id || p.uid || ''),
            _name: String(p.name || '').trim(),
            _normName: normalizePartnerString(p.name),
            _partnerId: p.partner_id ? String(p.partner_id).trim() : '',
            _partnerName: p.partner_name ? normalizePartnerString(p.partner_name) : (p.partner ? normalizePartnerString(p.partner) : ''),
            _gender: String(p.gender || 'chico').toLowerCase().trim(),
            _level: parseFloat(p.level || p.self_rate_level || 3.5),
            _teams: Array.isArray(p.team_somospadel) ? p.team_somospadel : (p.team_somospadel ? [p.team_somospadel] : (Array.isArray(p.team) ? p.team : (p.team ? [p.team] : [])))
        }));

        const explicitPairs = [];
        let pairCount = 0;

        for (let i = 0; i < available.length; i++) {
            const p1 = available[i];
            if (!p1) continue;

            let partnerIdx = -1;

            // 1. Coincidencia por partner_id
            if (p1._partnerId) {
                partnerIdx = available.findIndex((x, idx) => idx !== i && x && (x._uid === p1._partnerId || String(x.id) === p1._partnerId));
            }

            // 2. Coincidencia por partner_name si no hubo ID
            if (partnerIdx === -1 && p1._partnerName) {
                partnerIdx = available.findIndex((x, idx) => {
                    if (idx === i || !x) return false;
                    if (x._normName === p1._partnerName) return true;
                    if (p1._partnerName.length >= 3 && x._normName.includes(p1._partnerName)) return true;
                    if (x._normName.length >= 3 && p1._partnerName.includes(x._normName)) return true;
                    return false;
                });
            }

            // 3. Coincidencia inversa: otro jugador declaró a p1
            if (partnerIdx === -1) {
                partnerIdx = available.findIndex((x, idx) => {
                    if (idx === i || !x) return false;
                    if (x._partnerId && (x._partnerId === p1._uid || x._partnerId === String(p1.id))) return true;
                    if (x._partnerName && (x._partnerName === p1._normName || (x._partnerName.length >= 3 && p1._normName.includes(x._partnerName)))) return true;
                    return false;
                });
            }

            if (partnerIdx !== -1) {
                const p2 = available[partnerIdx];
                const pair = {
                    id: `pair_explicit_${Date.now()}_${pairCount++}`,
                    player1_id: p1._uid || p1.id,
                    player2_id: p2._uid || p2.id,
                    player1_name: p1.name,
                    player2_name: p2.name,
                    pair_name: `${p1.name} / ${p2.name}`,
                    wins: 0,
                    losses: 0,
                    games_won: 0,
                    games_lost: 0,
                    current_court: 1,
                    initial_court: 1,
                    is_explicit: true,
                    _avgLevel: (p1._level + p2._level) / 2
                };
                explicitPairs.push(pair);

                // Eliminar ambos de available de mayor a menor índice
                const high = Math.max(i, partnerIdx);
                const low = Math.min(i, partnerIdx);
                available.splice(high, 1);
                available.splice(low, 1);
                i--;
            }
        }

        return { explicitPairs, remainingPlayers: available };
    }

    const FixedPairsLogic = {

        /**
         * Crear parejas fijas al inicio del torneo o entreno
         * @param {Array} players - Lista de jugadores
         * @param {String} category - Categoría ('open', 'mixed', 'male', 'female')
         * @param {Boolean} preserveOrder - Si se preserva orden por nivel (ej. entrenos)
         * @returns {Array} - Parejas fijas con pista inicial asignada
         */
        createFixedPairs(players, category = 'open', preserveOrder = false) {
            console.log(`🔒 Creando parejas fijas para ${players.length} jugadores (Modo: ${category}, Ordenado: ${preserveOrder})...`);

            const isMixed = category === 'mixed' || category === 'mixto' || category === 'mixta' || String(category || '').toLowerCase().includes('mixt');

            // 1. Extraer parejas explícitas primero (Prioridad Absoluta)
            const { explicitPairs, remainingPlayers } = extractExplicitPairs(players);
            const pairs = [...explicitPairs];
            let pairCount = explicitPairs.length;

            const isFemale = p => ['chica', 'mujer', 'f', 'female'].includes(p._gender);

            if (isMixed) {
                // Prioridad 2: En categoría mixta, duplas chico + chica equilibradas por nivel
                const females = remainingPlayers.filter(isFemale).sort((a, b) => b._level - a._level);
                const males = remainingPlayers.filter(p => !isFemale(p)).sort((a, b) => b._level - a._level);

                while (females.length > 0 && males.length > 0) {
                    const f = females.shift();
                    // Buscar el chico más cercano en nivel para equilibrar
                    let bestIdx = 0;
                    let minDiff = Infinity;
                    males.forEach((m, idx) => {
                        const diff = Math.abs(f._level - m._level);
                        if (diff < minDiff) {
                            minDiff = diff;
                            bestIdx = idx;
                        }
                    });
                    const m = males.splice(bestIdx, 1)[0];

                    pairs.push({
                        id: `pair_mixed_${Date.now()}_${pairCount++}`,
                        player1_id: f._uid || f.id,
                        player2_id: m._uid || m.id,
                        player1_name: f.name,
                        player2_name: m.name,
                        pair_name: `${f.name} / ${m.name}`,
                        wins: 0,
                        losses: 0,
                        games_won: 0,
                        games_lost: 0,
                        current_court: 1,
                        initial_court: 1,
                        is_explicit: false,
                        _avgLevel: (f._level + m._level) / 2
                    });
                }

                // Si sobran jugadores del mismo género, emparejar entre ellos
                const leftovers = [...females, ...males].sort((a, b) => b._level - a._level);
                for (let i = 0; i < leftovers.length; i += 2) {
                    if (i + 1 < leftovers.length) {
                        const p1 = leftovers[i];
                        const p2 = leftovers[i + 1];
                        pairs.push({
                            id: `pair_auto_${Date.now()}_${pairCount++}`,
                            player1_id: p1._uid || p1.id,
                            player2_id: p2._uid || p2.id,
                            player1_name: p1.name,
                            player2_name: p2.name,
                            pair_name: `${p1.name} / ${p2.name}`,
                            wins: 0,
                            losses: 0,
                            games_won: 0,
                            games_lost: 0,
                            current_court: 1,
                            initial_court: 1,
                            is_explicit: false,
                            _avgLevel: (p1._level + p2._level) / 2
                        });
                    }
                }
            } else {
                // Categoría Open / Masculina / Femenina
                let pool = [...remainingPlayers];
                if (preserveOrder) {
                    // Mantener orden estricto de nivel (Entrenos por nivel)
                    pool.sort((a, b) => b._level - a._level);
                } else {
                    // Ordenar por nivel para emparejar jugadores de nivel similar
                    pool.sort((a, b) => b._level - a._level);
                }

                for (let i = 0; i < pool.length; i += 2) {
                    if (i + 1 < pool.length) {
                        const p1 = pool[i];
                        const p2 = pool[i + 1];
                        pairs.push({
                            id: `pair_auto_${Date.now()}_${pairCount++}`,
                            player1_id: p1._uid || p1.id,
                            player2_id: p2._uid || p2.id,
                            player1_name: p1.name,
                            player2_name: p2.name,
                            pair_name: `${p1.name} / ${p2.name}`,
                            wins: 0,
                            losses: 0,
                            games_won: 0,
                            games_lost: 0,
                            current_court: 1,
                            initial_court: 1,
                            is_explicit: false,
                            _avgLevel: (p1._level + p2._level) / 2
                        });
                    }
                }
            }

            // Ordenar parejas por nivel medio para asignación de pistas iniciales
            pairs.sort((a, b) => b._avgLevel - a._avgLevel);

            // Asignar pistas iniciales (2 parejas por pista)
            pairs.forEach((p, idx) => {
                p.current_court = Math.floor(idx / 2) + 1;
                p.initial_court = p.current_court;
            });

            console.log(`✅ ${pairs.length} parejas fijas creadas (${explicitPairs.length} explícitas, ${pairs.length - explicitPairs.length} automáticas).`);
            return pairs;
        },

        /**
         * 🤖 Smart Auto-Pairing para Parejas Fijas
         * Respeta parejas explícitas, afinidad de club y balance de nivel y género.
         */
        createSmartFixedPairs(players, category = 'open') {
            console.log(`🤖 Iniciando Smart Auto-Pairing para ${players.length} jugadores (Categoría: ${category})...`);

            const isMixed = category === 'mixed' || category === 'mixto' || category === 'mixta' || String(category || '').toLowerCase().includes('mixt');

            // 1. Extraer parejas explícitas (Prioridad Absoluta)
            const { explicitPairs, remainingPlayers } = extractExplicitPairs(players);
            const pairs = [...explicitPairs];
            let pairCount = explicitPairs.length;

            const isFemale = p => ['chica', 'mujer', 'f', 'female'].includes(p._gender);

            const findBestMatch = (player, others, forceOppositeGender = false) => {
                let bestScore = -Infinity;
                let bestIndex = -1;

                others.forEach((candidate, idx) => {
                    let score = 0;

                    // 1. Filtro Género
                    if (forceOppositeGender) {
                        if (player._gender === candidate._gender) return;
                        score += 100;
                    }

                    // 2. Afinidad de Equipo de Club
                    const commonTeams = (player._teams || []).filter(t => (candidate._teams || []).includes(t));
                    if (commonTeams.length > 0) {
                        score += 200;
                    }

                    // 3. Equilibrio de Nivel
                    const levelDiff = Math.abs(player._level - candidate._level);
                    if (levelDiff === 0) score += 50;
                    else if (levelDiff <= 0.25) score += 40;
                    else if (levelDiff <= 0.5) score += 20;
                    else score -= levelDiff * 25;

                    if (score > bestScore) {
                        bestScore = score;
                        bestIndex = idx;
                    }
                });

                return bestIndex;
            };

            const available = [...remainingPlayers];

            if (isMixed) {
                // En mixto, emparejar chicas con chicos
                while (available.length >= 2) {
                    const femaleIdx = available.findIndex(isFemale);
                    if (femaleIdx === -1) break; // Ya no hay chicas
                    const f = available.splice(femaleIdx, 1)[0];

                    const matchIdx = findBestMatch(f, available, true);
                    if (matchIdx !== -1) {
                        const m = available.splice(matchIdx, 1)[0];
                        pairs.push({
                            id: `pair_smart_mixed_${Date.now()}_${pairCount++}`,
                            player1_id: f._uid || f.id,
                            player2_id: m._uid || m.id,
                            player1_name: f.name,
                            player2_name: m.name,
                            pair_name: `${f.name} / ${m.name}`,
                            wins: 0,
                            losses: 0,
                            games_won: 0,
                            games_lost: 0,
                            current_court: 1,
                            initial_court: 1,
                            is_smart: true,
                            _avgLevel: (f._level + m._level) / 2
                        });
                    } else {
                        // No queda chico disponible
                        available.unshift(f);
                        break;
                    }
                }
            }

            // Emparejar los restantes disponibles
            while (available.length >= 2) {
                const player = available.shift();
                const matchIdx = findBestMatch(player, available, false);
                const partner = matchIdx !== -1 ? available.splice(matchIdx, 1)[0] : available.shift();

                pairs.push({
                    id: `pair_smart_${Date.now()}_${pairCount++}`,
                    player1_id: player._uid || player.id,
                    player2_id: partner._uid || partner.id,
                    player1_name: player.name,
                    player2_name: partner.name,
                    pair_name: `${player.name} / ${partner.name}`,
                    wins: 0,
                    losses: 0,
                    games_won: 0,
                    games_lost: 0,
                    current_court: 1,
                    initial_court: 1,
                    is_smart: true,
                    _avgLevel: (player._level + partner._level) / 2
                });
            }

            // Ordenar parejas por nivel medio para asignación de pistas
            pairs.sort((a, b) => b._avgLevel - a._avgLevel);

            pairs.forEach((p, idx) => {
                p.current_court = Math.floor(idx / 2) + 1;
                p.initial_court = p.current_court;
            });

            console.log(`✅ Smart Auto-Pairing finalizado: ${pairs.length} parejas creadas (${explicitPairs.length} explícitas).`);
            return pairs;
        },

        /**
         * Generar ronda con sistema Pozo (parejas fijas)
         * Asigna slots directamente por current_court de cada pareja.
         *
         * @param {Array} pairs - Parejas fijas
         * @param {Number} roundNumber - Número de ronda
         * @param {Number} maxCourts - Número máximo de pistas
         * @returns {Array} - Partidos generados
         */
        generatePozoRound(pairs, roundNumber, maxCourts) {
            console.log(`🔒 Generando Ronda ${roundNumber} Pozo Parejas Fijas (${pairs.length} parejas, ${maxCourts} pistas)...`);

            // Asegurar que todas las parejas tienen current_court válido
            pairs.forEach((p, idx) => {
                if (!p.current_court || p.current_court < 1) {
                    p.current_court = Math.floor(idx / 2) + 1;
                }
            });

            const matches = [];

            // Agrupar parejas por current_court
            const courtPairsMap = new Map();
            for (let c = 1; c <= maxCourts; c++) {
                courtPairsMap.set(c, []);
            }

            pairs.forEach(p => {
                const c = p.current_court;
                if (!courtPairsMap.has(c)) {
                    courtPairsMap.set(c, []);
                }
                courtPairsMap.get(c).push(p);
            });

            // Generar partidos para las pistas activas (1 a maxCourts)
            for (let c = 1; c <= maxCourts; c++) {
                const list = courtPairsMap.get(c) || [];

                if (list.length >= 2) {
                    const pairA = list[0];
                    const pairB = list[1];
                    matches.push({
                        round: roundNumber,
                        court: c,
                        pair_a_id: pairA.id,
                        pair_b_id: pairB.id,
                        team_a_ids: [pairA.player1_id, pairA.player2_id],
                        team_b_ids: [pairB.player1_id, pairB.player2_id],
                        team_a_names: [pairA.player1_name, pairA.player2_name],
                        team_b_names: [pairB.player1_name, pairB.player2_name],
                        teamA: pairA.pair_name,
                        teamB: pairB.pair_name,
                        status: 'scheduled',
                        score_a: 0,
                        score_b: 0
                    });
                } else if (list.length === 1) {
                    // Pareja solitaria en pista activa (BYE / Descanso)
                    const pairA = list[0];
                    matches.push({
                        round: roundNumber,
                        court: c,
                        pair_a_id: pairA.id,
                        pair_b_id: 'bye',
                        team_a_ids: [pairA.player1_id, pairA.player2_id],
                        team_b_ids: [],
                        team_a_names: [pairA.player1_name, pairA.player2_name],
                        team_b_names: ['BYE', ''],
                        teamA: pairA.pair_name,
                        teamB: 'BYE (Descansa)',
                        status: 'finished',
                        score_a: 6,
                        score_b: 0,
                        is_bye: true
                    });
                }
            }

            // Manejar parejas asignadas a pistas superiores a maxCourts (BYE)
            for (const [c, list] of courtPairsMap.entries()) {
                if (c > maxCourts) {
                    list.forEach(pairA => {
                        matches.push({
                            round: roundNumber,
                            court: c,
                            pair_a_id: pairA.id,
                            pair_b_id: 'bye',
                            team_a_ids: [pairA.player1_id, pairA.player2_id],
                            team_b_ids: [],
                            team_a_names: [pairA.player1_name, pairA.player2_name],
                            team_b_names: ['BYE', ''],
                            teamA: pairA.pair_name,
                            teamB: 'BYE (Descansa)',
                            status: 'finished',
                            score_a: 6,
                            score_b: 0,
                            is_bye: true
                        });
                    });
                }
            }

            console.log(`✅ ${matches.length} partidos generados para ronda ${roundNumber}`);
            return matches;
        },

        /**
         * Actualizar rankings de parejas después de una ronda (Lógica Pozo Parejas Fijas).
         *
         * Dinámica Pozo:
         * - Si la pareja gana: sube junta a la pista superior (P1 se queda en P1).
         * - Si la pareja pierde: baja junta a la pista inferior (PN se queda en PN).
         * - Cruces de siguiente ronda:
         *   * Pista 1: Ganador de P1 vs Ganador de P2.
         *   * Pista k: Perdedor de P(k-1) vs Ganador de P(k+1).
         *   * Pista N: Perdedor de P(N-1) vs Perdedor de PN.
         * - Empates a juegos (e.g. 5-5): desempate automático limpio por balance de juegos o sorteo determinista.
         * - Número impar de parejas (BYE): rotación equitativa, la pareja que descansó entra a jugar y rota otra sin repetir descanso consecutivo.
         *
         * @param {Array} pairs - Parejas actuales
         * @param {Array} lastRoundMatches - Partidos de la última ronda
         * @param {Number} maxCourts - Número máximo de pistas
         * @returns {Array} - Parejas actualizadas con su nueva current_court
         */
        updatePozoRankings(pairs, lastRoundMatches, maxCourts) {
            console.log(`📊 Actualizando rankings Pozo (Parejas Fijas)...`);

            const pairMap = {};
            pairs.forEach(p => {
                pairMap[p.id] = p;
                p.won_last_match = false;
            });

            const _env = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : {});
            _env._processedCourtsInRanking = new Set();

            const finishedMatches = (lastRoundMatches || []).filter(m => m.status === 'finished');

            // 1. Procesar resultados de los partidos finalizados
            const courtResultsMap = new Map();
            let lastRoundNumber = 1;

            finishedMatches.forEach(match => {
                const courtNum = parseInt(match.court || 0);
                lastRoundNumber = parseInt(match.round || lastRoundNumber);
                const dedupKey = `R${match.round}_C${courtNum}`;
                if (_env._processedCourtsInRanking?.has(dedupKey)) {
                    return;
                }
                _env._processedCourtsInRanking.add(dedupKey);

                const teamAIds = Array.isArray(match.team_a_ids) ? match.team_a_ids.map(String) : [];
                const teamBIds = Array.isArray(match.team_b_ids) ? match.team_b_ids.map(String) : [];

                let pairA = pairMap[match.pair_a_id] || pairs.find(p => teamAIds.includes(String(p.player1_id)) || teamAIds.includes(String(p.player2_id)));
                let pairB = pairMap[match.pair_b_id] || pairs.find(p => teamBIds.includes(String(p.player1_id)) || teamBIds.includes(String(p.player2_id)));

                // Manejo de BYE
                if (match.pair_b_id === 'bye' || match.is_bye) {
                    if (pairA) {
                        pairA.games_won = (pairA.games_won || 0) + 6;
                        pairA.games_lost = (pairA.games_lost || 0) + 0;
                        pairA.wins = (pairA.wins || 0) + 1;
                        pairA.won_last_match = true;
                        pairA.last_played_round = match.round;
                        pairA.last_bye_round = match.round;
                        pairA.byes_count = (pairA.byes_count || 0) + 1;
                        console.log(`🎁 [BYE] Victoria por descanso otorgada a ${pairA.pair_name || pairA.id}`);
                    }
                    return;
                }

                if (!pairA || !pairB) {
                    console.warn(`⚠️ Pareja no encontrada en match ${match.id} (Ronda ${match.round})`);
                    return;
                }

                const scoreA = parseInt(match.score_a || 0);
                const scoreB = parseInt(match.score_b || 0);

                pairA.games_won = (pairA.games_won || 0) + scoreA;
                pairA.games_lost = (pairA.games_lost || 0) + scoreB;
                pairB.games_won = (pairB.games_won || 0) + scoreB;
                pairB.games_lost = (pairB.games_lost || 0) + scoreA;

                // Determinar Ganador y Perdedor con DESEMPATE AUTOMÁTICO LIMPIO
                let winner, loser;
                const w = String(match.winner || '').toLowerCase().trim();
                if (w === 'team_a' || w === 'a' || w === 'teama' || w === '1') {
                    winner = pairA; loser = pairB;
                } else if (w === 'team_b' || w === 'b' || w === 'teamb' || w === '2') {
                    winner = pairB; loser = pairA;
                } else if (scoreA > scoreB) {
                    winner = pairA; loser = pairB;
                } else if (scoreB > scoreA) {
                    winner = pairB; loser = pairA;
                } else {
                    // EMPATE A JUEGOS (e.g. 5-5):
                    // Criterio 1: Balance acumulado de juegos previos (games_won - games_lost)
                    const diffA = (pairA.games_won || 0) - (pairA.games_lost || 0);
                    const diffB = (pairB.games_won || 0) - (pairB.games_lost || 0);
                    if (diffA !== diffB) {
                        winner = diffA > diffB ? pairA : pairB;
                        loser = diffA > diffB ? pairB : pairA;
                    } else if ((pairA.wins || 0) !== (pairB.wins || 0)) {
                        // Criterio 2: Total de victorias
                        winner = (pairA.wins || 0) > (pairB.wins || 0) ? pairA : pairB;
                        loser = (pairA.wins || 0) > (pairB.wins || 0) ? pairB : pairA;
                    } else {
                        // Criterio 3: Sorteo determinista por ID de pareja
                        const cmp = String(pairA.id).localeCompare(String(pairB.id));
                        winner = cmp <= 0 ? pairA : pairB;
                        loser = cmp <= 0 ? pairB : pairA;
                    }
                    console.log(`⚖️ [Desempate Fijo] Empate ${scoreA}-${scoreB} en Pista ${courtNum} resuelto a favor de ${winner.pair_name}`);
                }

                winner.wins = (winner.wins || 0) + 1;
                winner.won_last_match = true;
                loser.losses = (loser.losses || 0) + 1;
                loser.won_last_match = false;

                pairA.last_played_round = match.round;
                pairB.last_played_round = match.round;

                courtResultsMap.set(courtNum, { court: courtNum, winner, loser });
            });

            // 2. Si se disputaron partidos normales, reconstruir las pistas según la escalera canónica Pozo
            if (courtResultsMap.size > 0) {
                const totalCourts = Math.max(maxCourts, ...Array.from(courtResultsMap.keys()));
                const courtSlots = new Map();
                for (let c = 1; c <= totalCourts; c++) courtSlots.set(c, []);

                // Identificar si alguna pareja tuvo descanso en la ronda anterior
                const activePairsInMatches = new Set();
                courtResultsMap.forEach(r => {
                    if (r.winner) activePairsInMatches.add(r.winner.id);
                    if (r.loser) activePairsInMatches.add(r.loser.id);
                });

                const previouslyRestingPairs = pairs.filter(p => !activePairsInMatches.has(p.id));

                if (totalCourts === 1) {
                    const r1 = courtResultsMap.get(1);
                    if (r1) {
                        courtSlots.get(1).push(r1.winner);
                        courtSlots.get(1).push(r1.loser);
                    }
                } else {
                    // Pista 1: Ganador P1 vs Ganador P2
                    const r1 = courtResultsMap.get(1);
                    const r2 = courtResultsMap.get(2);
                    if (r1?.winner) courtSlots.get(1).push(r1.winner);
                    if (r2?.winner) courtSlots.get(1).push(r2.winner);

                    // Pistas intermedias (2 a totalCourts - 1): Perdedor P(k-1) vs Ganador P(k+1)
                    for (let k = 2; k < totalCourts; k++) {
                        const rPrev = courtResultsMap.get(k - 1);
                        const rNext = courtResultsMap.get(k + 1);
                        if (rPrev?.loser) courtSlots.get(k).push(rPrev.loser);
                        if (rNext?.winner) courtSlots.get(k).push(rNext.winner);
                    }

                    // Pista N (última pista):
                    const rPenult = courtResultsMap.get(totalCourts - 1);
                    const rLast = courtResultsMap.get(totalCourts);
                    const loserPenult = rPenult?.loser;
                    const loserLast = rLast?.loser;

                    if (previouslyRestingPairs.length > 0) {
                        // --- GESTIÓN DE DESCANSO ROTATIVO (BYE) ---
                        // La pareja que descansó vuelve a entrar obligatoriamente en la última pista
                        const returningPair = previouslyRestingPairs[0];

                        // De los dos perdedores de abajo, seleccionamos al que descansará en la siguiente ronda
                        // Criterio: el que tenga menos descansos acumulados y NO haya descansado en la ronda anterior
                        const candidates = [loserLast, loserPenult].filter(Boolean);
                        candidates.sort((a, b) => {
                            const byesA = a.byes_count || 0;
                            const byesB = b.byes_count || 0;
                            if (byesA !== byesB) return byesA - byesB;
                            return (a.games_won || 0) - (b.games_won || 0);
                        });

                        const pairToRest = candidates[0];
                        const pairToPlay = candidates[1];

                        if (pairToPlay) courtSlots.get(totalCourts).push(pairToPlay);
                        courtSlots.get(totalCourts).push(returningPair);

                        // La pareja que descansa pasa a pista totalCourts + 1 (BYE)
                        if (pairToRest) {
                            pairToRest.current_court = totalCourts + 1;
                        }
                    } else {
                        // Sin descansos: Perdedor P(N-1) vs Perdedor PN
                        if (loserPenult) courtSlots.get(totalCourts).push(loserPenult);
                        if (loserLast) courtSlots.get(totalCourts).push(loserLast);
                    }
                }

                // Asignar current_court según la posición final
                for (let c = 1; c <= totalCourts; c++) {
                    const list = courtSlots.get(c) || [];
                    list.forEach(p => {
                        if (p) p.current_court = c;
                    });
                }

                // Asegurar que cualquier pareja huérfana tenga pista
                pairs.forEach(p => {
                    if (!p.current_court || p.current_court < 1) {
                        p.current_court = totalCourts;
                    }
                });

                console.log(`✅ Pistas Pozo actualizadas:`, pairs.map(p => `${p.pair_name || p.id} → Pista ${p.current_court}`).join(', '));
            } else {
                // Si no hubo partidos finalizados, mantener orden estable
                pairs.sort((a, b) => a.current_court - b.current_court || (b.wins || 0) - (a.wins || 0));
                pairs.forEach((p, index) => { p.current_court = Math.floor(index / 2) + 1; });
            }

            return [...pairs].sort((a, b) => a.current_court - b.current_court);
        },

        /**
         * Calcular clasificación para parejas fijas
         */
        calculateStandings(pairs) {
            const sorted = [...pairs].sort((a, b) => {
                if ((b.wins || 0) !== (a.wins || 0)) return (b.wins || 0) - (a.wins || 0);
                const diffA = (a.games_won || 0) - (a.games_lost || 0);
                const diffB = (b.games_won || 0) - (b.games_lost || 0);
                if (diffB !== diffA) return diffB - diffA;
                return (b.games_won || 0) - (a.games_won || 0);
            });

            return sorted.map((p, index) => ({
                position: index + 1,
                name: p.pair_name,
                court: p.current_court,
                games: p.games_won || 0,
                won: p.wins || 0,
                lost: p.losses || 0,
                played: (p.wins || 0) + (p.losses || 0),
                trend: p.current_court < (p.initial_court || 1) ? '↑' :
                    p.current_court > (p.initial_court || 1) ? '↓' : '='
            }));
        }
    };

    // Exportación global (Browser y Node.js)
    if (typeof window !== 'undefined') {
        window.FixedPairsLogic = FixedPairsLogic;
    }
    if (typeof globalThis !== 'undefined') {
        globalThis.FixedPairsLogic = FixedPairsLogic;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { FixedPairsLogic };
    }
    console.log("🔒 FixedPairsLogic cargado");

})();
