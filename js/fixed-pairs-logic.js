/**
 * 🔒 FIXED PAIRS LOGIC - Sistema Pozo
 * Lógica para manejar parejas fijas que suben y bajan juntas según resultados
 */

const FixedPairsLogic = {

    /**
     * Crear parejas fijas al inicio del torneo
     * @param {Array} players - Lista de jugadores
     * @returns {Array} - Lista de parejas fijas
     */
    createFixedPairs(players, category = 'open', preserveOrder = false) {
        console.log(`🔒 Creando parejas fijas para ${players.length} jugadores (Modo: ${category}, Ordenado: ${preserveOrder})...`);

        let shuffled;
        if (category === 'mixed' || preserveOrder) {
            // Si es mixto o se pide preservar orden (Entrenos por nivel)
            // No barajamos
            shuffled = [...players];
        } else {
            // Mezclar jugadores aleatoriamente
            shuffled = [...players].sort(() => 0.5 - Math.random());
        }

        const pairs = [];

        // Emparejar de 2 en 2
        for (let i = 0; i < shuffled.length; i += 2) {
            if (i + 1 < shuffled.length) {
                const pair = {
                    id: `pair_${Date.now()}_${i / 2}`,
                    player1_id: shuffled[i].id || shuffled[i].uid,
                    player2_id: shuffled[i + 1].id || shuffled[i + 1].uid,
                    player1_name: shuffled[i].name,
                    player2_name: shuffled[i + 1].name,
                    pair_name: `${shuffled[i].name} / ${shuffled[i + 1].name}`,
                    wins: 0,
                    losses: 0,
                    games_won: 0,
                    games_lost: 0,
                    current_court: Math.floor(i / 4) + 1, // Asignar pista inicial (1, 1, 2, 2, 3, 3, etc.)
                    initial_court: Math.floor(i / 4) + 1
                };
                pairs.push(pair);
            }
        }

        console.log(`✅ ${pairs.length} parejas creadas`);
        return pairs;
    },

    /**
     * 🤖 Lógica de Emparejamiento Inteligente (Smart Auto-Pairing)
     * Empareja a los jugadores según su equipo Somospadel, afinidad de nivel y género.
     * Prioriza parejas que ya se eligieron al apuntarse (partner_id).
     */
    createSmartFixedPairs(players, category = 'open') {
        console.log(`🤖 Iniciando Smart Auto-Pairing para ${players.length} jugadores...`);

        const available = [...players];
        const pairs = [];
        let pairCount = 0;

        // Limpiar géneros (normalizar) e IDs
        available.forEach(p => {
            p._uid = String(p.id || p.uid || '');
            p._gender = (p.gender || 'chico').toLowerCase();
            p._level = parseFloat(p.level || p.self_rate_level || 3.5);
            p._teams = Array.isArray(p.team_somospadel) ? p.team_somospadel : (p.team_somospadel ? [p.team_somospadel] : []);
        });

        // --- PASO 0: PAREJAS EXPLÍCITAS (partner_id) ---
        // Buscamos jugadores que ya eligieron pareja al apuntarse
        for (let i = 0; i < available.length; i++) {
            const p = available[i];
            if (p.partner_id) {
                const partnerTargetId = String(p.partner_id);
                const partnerIdx = available.findIndex((x, idx) => idx !== i && x._uid === partnerTargetId);

                if (partnerIdx !== -1) {
                    const partner = available[partnerIdx];

                    const pair = {
                        id: `pair_explicit_${Date.now()}_${pairCount++}`,
                        player1_id: p._uid,
                        player2_id: partner._uid,
                        player1_name: p.name,
                        player2_name: partner.name,
                        pair_name: `${p.name} / ${partner.name}`,
                        wins: 0,
                        losses: 0,
                        games_won: 0,
                        games_lost: 0,
                        current_court: 1,
                        initial_court: 1,
                        is_explicit: true
                    };
                    pairs.push(pair);

                    // Eliminar de disponibles (orden inverso para no romper índices)
                    const high = Math.max(i, partnerIdx);
                    const low = Math.min(i, partnerIdx);
                    available.splice(high, 1);
                    available.splice(low, 1);
                    i--; // Ajustar índice principal
                }
            }
        }

        const findBestMatch = (player, others) => {
            let bestScore = -1;
            let bestIndex = -1;

            others.forEach((candidate, idx) => {
                let score = 0;

                // 1. GÉNERO (Filtro Crítico para MIXTO)
                if (category === 'mixed') {
                    // En mixto buscamos chico + chica
                    if (player._gender !== candidate._gender) score += 100;
                    else score -= 50; // Penalizar mismo género en mixto
                }

                // 2. EQUIPO (Afinidad Máxima)
                const commonTeams = player._teams.filter(t => candidate._teams.includes(t));
                if (commonTeams.length > 0) {
                    score += 200; // Prioridad absoluta: juegan en el mismo equipo
                }

                // 3. NIVEL (Equilibrio)
                const levelDiff = Math.abs(player._level - candidate._level);
                if (levelDiff === 0) score += 50;
                else if (levelDiff <= 0.25) score += 40;
                else if (levelDiff <= 0.5) score += 20;
                else score -= levelDiff * 25; // Penalizar diferencias de nivel

                if (score > bestScore) {
                    bestScore = score;
                    bestIndex = idx;
                }
            });

            return bestIndex;
        };

        // Algoritmo Greedy para emparejar el resto
        while (available.length >= 2) {
            const player = available.shift();
            const matchIdx = findBestMatch(player, available);

            if (matchIdx !== -1) {
                const partner = available.splice(matchIdx, 1)[0];

                const pair = {
                    id: `pair_auto_${Date.now()}_${pairCount++}`,
                    player1_id: player._uid,
                    player2_id: partner._uid,
                    player1_name: player.name,
                    player2_name: partner.name,
                    pair_name: `${player.name} / ${partner.name}`,
                    wins: 0,
                    losses: 0,
                    games_won: 0,
                    games_lost: 0,
                    current_court: 1,
                    initial_court: 1,
                    is_auto: true
                };
                pairs.push(pair);
            }
        }

        // Ordenar las parejas finales por nivel medio para asignar pistas iniciales
        pairs.forEach(p => {
            const p1 = players.find(x => String(x.id || x.uid) === p.player1_id);
            const p2 = players.find(x => String(x.id || x.uid) === p.player2_id);
            p._avgLevel = (((p1 ? parseFloat(p1.level || p1.self_rate_level || 3.5) : 3.5) + (p2 ? parseFloat(p2.level || p2.self_rate_level || 3.5) : 3.5)) / 2);
        });

        pairs.sort((a, b) => b._avgLevel - a._avgLevel);

        // Asignar pistas
        pairs.forEach((p, i) => {
            p.current_court = Math.floor(i / 2) + 1;
            p.initial_court = p.current_court;
        });

        console.log(`✅ Smart Auto-Pairing finalizado: ${pairs.length} parejas creadas.`);
        return pairs;
    },

    /**
     * Generar ronda con sistema Pozo (parejas fijas)
     * @param {Array} pairs - Parejas fijas
     * @param {Number} roundNumber - Número de ronda
     * @param {Number} maxCourts - Número máximo de pistas
     * @returns {Array} - Partidos generados
     */
    generatePozoRound(pairs, roundNumber, maxCourts) {


        // Separate explicit and non‑explicit pairs
        const explicitPairs = pairs.filter(p => p.is_explicit);
        const nonExplicit = pairs.filter(p => !p.is_explicit);

        // Prepare slot array: two slots per court
        const totalSlots = maxCourts * 2;
        const slots = new Array(totalSlots).fill(null);

        // Helper to place a pair into its court slots, preserving existing court if possible
        const placeInCourt = (pair) => {
            const court = pair.current_court || pair.initial_court || 1;
            const baseIdx = (court - 1) * 2;
            if (!slots[baseIdx]) {
                slots[baseIdx] = pair;
            } else if (!slots[baseIdx + 1]) {
                slots[baseIdx + 1] = pair;
            } else {
                // Court already full; fallback to first free slot later
                // No action here
            }
        };

        // First, place explicit pairs (they keep their courts)
        explicitPairs.forEach(placeInCourt);

        // Fill remaining empty slots with non‑explicit pairs sequentially
        let nextIdx = 0;
        nonExplicit.forEach(p => {
            while (nextIdx < totalSlots && slots[nextIdx]) nextIdx++;
            if (nextIdx < totalSlots) {
                const courtNum = Math.floor(nextIdx / 2) + 1;
                p.current_court = courtNum;
                slots[nextIdx] = p;
                nextIdx++;
            }
        });

        // Build matches from slots (pairs of two per court)
        const matches = [];
        for (let i = 0; i < totalSlots; i += 2) {
            const pairA = slots[i];
            const pairB = slots[i + 1];
            const courtNum = Math.floor(i / 2) + 1;
            if (pairA && pairB) {
                matches.push({
                    round: roundNumber,
                    court: courtNum,
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
            } else if (pairA && !pairB) {
                // Bye for lone pair
                matches.push({
                    round: roundNumber,
                    court: courtNum,
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

        console.log(`✅ ${matches.length} partidos generados para ronda ${roundNumber}`);
        return matches;
    },


    /**
 * Actualizar rankings de parejas después de una ronda (lógica Pozo)
 * @param {Array} pairs - Parejas actuales
 * @param {Array} lastRoundMatches - Partidos de la última ronda
 * @param {Number} maxCourts - Número máximo de pistas
 * @returns {Array} - Parejas actualizadas
 */
    updatePozoRankings(pairs, lastRoundMatches, maxCourts) {
        console.log(`📊 Actualizando rankings Pozo (Parejas Fijas)...`);

        // Crear un mapa para acceso rápido
        const pairMap = {};
        pairs.forEach(p => {
            pairMap[p.id] = p;
            // Marcar como no jugado en esta ronda
            p.won_last_match = false;
        });

        // Initialize/Reset deduplication guard for this ranking cycle
        window._processedCourtsInRanking = new Set();

        // Identify explicit pairs (manual or partner-defined)
        const explicitPairs = pairs.filter(p => p.is_explicit);


        // Procesar resultados de la última ronda (solo sobre pares no explícitos)
        lastRoundMatches.forEach(match => {
            if (match.status === 'finished') {
                const teamAIds = Array.isArray(match.team_a_ids) ? match.team_a_ids.map(String) : [];
                const teamBIds = Array.isArray(match.team_b_ids) ? match.team_b_ids.map(String) : [];

                // Fallback: search pairs containing players if IDs missing (Robustness)
                let pairA = pairMap[match.pair_a_id];
                let pairB = pairMap[match.pair_b_id];

                if (!pairA) {
                    // Try finding by player composition
                    pairA = pairs.find(p => teamAIds.includes(String(p.player1_id)) || teamAIds.includes(String(p.player2_id)));
                }
                if (!pairB) {
                    pairB = pairs.find(p => teamBIds.includes(String(p.player1_id)) || teamBIds.includes(String(p.player2_id)));
                }

                if (!pairA || !pairB) {
                    console.warn(`⚠️ Pareja no encontrada en match ${match.id} (Ronda ${match.round})`);
                    return;
                }

                // --- 🛡️ DEDUPLICATION GUARD ---
                // If we already processed this court in this round, ignore extra copies
                const courtNum = parseInt(match.court || 0);
                const dedupKey = `R${match.round}_C${courtNum}`;
                if (window._processedCourtsInRanking?.has(dedupKey)) {
                    console.warn(`🛑 Skipping duplicate result for ${dedupKey} to prevent jump glitches.`);
                    return;
                }
                window._processedCourtsInRanking = window._processedCourtsInRanking || new Set();
                window._processedCourtsInRanking.add(dedupKey);

                const scoreA = parseInt(match.score_a || 0);
                const scoreB = parseInt(match.score_b || 0);

                // Actualizar estadísticas generales
                pairA.games_won = (pairA.games_won || 0) + scoreA;
                pairA.games_lost = (pairA.games_lost || 0) + scoreB;
                pairB.games_won = (pairB.games_won || 0) + scoreB;
                pairB.games_lost = (pairB.games_lost || 0) + scoreA;

                // Determinar ganador y perdedor
                let winner, loser;
                if (scoreA > scoreB) {
                    winner = pairA;
                    loser = pairB;
                    pairA.wins = (pairA.wins || 0) + 1;
                    pairB.losses = (pairB.losses || 0) + 1;
                } else if (scoreB > scoreA) {
                    winner = pairB;
                    loser = pairA;
                    pairB.wins = (pairB.wins || 0) + 1;
                    pairA.losses = (pairA.losses || 0) + 1;
                } else {
                    // EMPATE / TIE
                    pairA.won_last_match = true; // Neutral
                    pairB.won_last_match = true;
                }

                // Aplicar lógica POZO: Ganador sube, Perdedor baja
                if (winner && loser) {
                    winner.won_last_match = true;
                    loser.won_last_match = false;

                    // GANADOR: Sube de pista (número menor) si no está en pista 1
                    if (winner.current_court > 1) {
                        winner.current_court--;
                    }

                    // PERDEDOR: Baja de pista (número mayor)
                    if (loser.current_court < maxCourts) {
                        loser.current_court++;
                    }
                }

                // Marcar como jugado en esta ronda
                pairA.last_played_round = match.round;
                pairB.last_played_round = match.round;
            }
        });

        // --- CONSOLIDAR PISTAS: Lógica Pozo Correcta ---
        // Preserve explicit pairs courts after ranking update
        explicitPairs.forEach(p => {
            // Ensure explicit pairs keep their original court
            p.current_court = p.current_court || p.initial_court || 1;
        });

        // For non-explicit pairs, continue with existing logic
        // Rebuild court assignments based on match results
        const matchesByCourtSorted = [...lastRoundMatches]
            .filter(m => m.status === 'finished')
            .sort((a, b) => parseInt(a.court) - parseInt(b.court));

        if (matchesByCourtSorted.length > 0) {
            // Rebuild court assignments top-down based on Pozo bracket
            // For each court c (1..N):
            //   winner of court c → target court c-1 (minimum 1)
            //   loser of court c → target court c+1 (maximum maxCourts)
            // Then: next round Court 1 has [winner of c1, winner of c2]
            //        Court 2 has [loser of c1, winner of c3], etc.

            // Step 1: Build winner/loser arrays sorted by original court
            const courtResults = matchesByCourtSorted.map(match => {
                const teamAIds = Array.isArray(match.team_a_ids) ? match.team_a_ids.map(String) : [];
                const teamBIds = Array.isArray(match.team_b_ids) ? match.team_b_ids.map(String) : [];

                let pairA = pairMap[match.pair_a_id];
                let pairB = pairMap[match.pair_b_id];
                if (!pairA) pairA = pairs.find(p => teamAIds.includes(String(p.player1_id)) || teamAIds.includes(String(p.player2_id)));
                if (!pairB) pairB = pairs.find(p => teamBIds.includes(String(p.player1_id)) || teamBIds.includes(String(p.player2_id)));

                if (!pairA || !pairB) return null;

                const scoreA = parseInt(match.score_a || 0);
                const scoreB = parseInt(match.score_b || 0);
                const winner = scoreA >= scoreB ? pairA : pairB;
                const loser = scoreA >= scoreB ? pairB : pairA;
                return { court: parseInt(match.court), winner, loser };
            }).filter(Boolean);

            // Step 2: Assign courts for next round using the standard Pozo bracket:
            //   Sort order for Court N next round:
            //     - winners climb, losers fall
            //     - Court k will have: winner from court k PLUS loser from court k-1
            //     - (for k=1: only the winner of court 1 stays, joined by winner of court 2)
            //     - (for k=maxCourts: loser of court maxCourts stays, joined by loser of court maxCourts-1)

            // Build the ordered list for next round:
            //   [winner_c1, winner_c2, loser_c1, winner_c3, loser_c2, winner_c4, loser_c3, loser_c4-1..., loser_cN]
            // Simpler canonical form: interleave winners (descending court) and losers (ascending court)
            // winners sorted ascending by court (best court first), losers sorted ascending by court
            const winners = courtResults.map(r => r.winner);   // winner of court 1, 2, 3...
            const losers  = courtResults.map(r => r.loser);    // loser of court 1, 2, 3...

            // Next round bracket order (canonical Pozo):
            // Pos 0,1 → Court 1: [winner_c1,  winner_c2]  ← the two best pairs
            // Pos 2,3 → Court 2: [loser_c1, winner_c3]
            // Pos 4,5 → Court 3: [loser_c2, loser_c3]
            // General pattern for N courts:
            //   Court k (1-indexed) contains: winner[k-1] and loser[k-2] (if they exist)
            // Build sequence: winners[0], winners[1], losers[0], winners[2], losers[1], winners[3], losers[2]...
            // = interleave: for each court position k, take winners[k] then losers[k-1]
            const nextRoundOrder = [];
            for (let k = 0; k < maxCourts; k++) {
                if (winners[k]) nextRoundOrder.push(winners[k]);
                if (losers[k - 1] !== undefined && losers[k - 1] !== null) nextRoundOrder.push(losers[k - 1]);
            }
            // Add last loser if not already in
            const lastLoser = losers[losers.length - 1];
            if (lastLoser && !nextRoundOrder.includes(lastLoser)) {
                nextRoundOrder.push(lastLoser);
            }

            // Assign courts: every 2 pairs share a court
            nextRoundOrder.forEach((pair, index) => {
                if (pair) pair.current_court = Math.floor(index / 2) + 1;
            });

            // Assign any pairs that didn't play (BYE) to the last court
            pairs.forEach(p => {
                if (!nextRoundOrder.includes(p)) {
                    p.current_court = maxCourts;
                }
            });

            console.log(`✅ Pistas Pozo actualizadas:`, pairs.map(p => `${p.pair_name || p.id} → Pista ${p.current_court}`).join(', '));
        } else {
            // Fallback: stable sort if no finished matches
            pairs.sort((a, b) => a.current_court - b.current_court || (b.wins || 0) - (a.wins || 0));
            pairs.forEach((p, index) => { p.current_court = Math.floor(index / 2) + 1; });
        }

        // Devolver ordenado por pista (para que generatePozoRound empareje correctamente)
        return [...pairs].sort((a, b) => a.current_court - b.current_court);
    },

    /**
     * Calcular clasificación para parejas fijas
     */
    calculateStandings(pairs) {
        return pairs.map((p, index) => ({
            position: index + 1,
            name: p.pair_name,
            court: p.current_court,
            games: p.games_won,
            won: p.wins,
            lost: p.losses,
            played: (p.wins || 0) + (p.losses || 0),
            trend: p.current_court < (p.initial_court || 1) ? '↑' :
                p.current_court > (p.initial_court || 1) ? '↓' : '='
        }));
    }
};

// Exportar globalmente
window.FixedPairsLogic = FixedPairsLogic;
console.log("🔒 FixedPairsLogic cargado");
