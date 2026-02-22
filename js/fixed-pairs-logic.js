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
        console.log(`🎾 Generando ronda ${roundNumber} con sistema Pozo...`);

        // Ordenar parejas por pista actual
        const sortedPairs = [...pairs].sort((a, b) => a.current_court - b.current_court);

        const matches = [];

        // Emparejar: las 2 primeras parejas juegan en pista 1, las siguientes 2 en pista 2, etc.
        for (let i = 0; i < sortedPairs.length; i += 2) {
            if (i + 1 < sortedPairs.length) {
                const pairA = sortedPairs[i];
                const pairB = sortedPairs[i + 1];

                matches.push({
                    round: roundNumber,
                    court: pairA.current_court,
                    pair_a_id: pairA.id,
                    pair_b_id: pairB.id,
                    team_a_ids: [pairA.player1_id, pairA.player2_id],
                    team_b_ids: [pairB.player1_id, pairB.player2_id],
                    team_a_names: [pairA.player1_name, pairA.player2_name],
                    team_b_names: [pairB.player1_name, pairB.player2_name],
                    teamA: pairA.pair_name, // Redundant field for UI
                    teamB: pairB.pair_name, // Redundant field for UI
                    status: 'scheduled',
                    score_a: 0,
                    score_b: 0
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

        // Procesar resultados de la última ronda
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

        // --- CONSOLIDAR PISTAS ---
        // Pueden haber conflictos (2 parejas con misma pista tras movimiento).
        // Ordenamos por pista actual, y luego reasignamos de forma que 
        // el ganador quede en la pista correcta respetando su movimiento.

        // Paso 1: Ordenar por pista actual (primero ganadores, empates después)
        pairs.sort((a, b) => {
            if (a.current_court !== b.current_court) return a.current_court - b.current_court;
            // En la misma pista, el ganador va primero (se queda arriba)
            if (a.won_last_match && !b.won_last_match) return -1;
            if (!a.won_last_match && b.won_last_match) return 1;
            return (b.games_won || 0) - (a.games_won || 0);
        });

        // Paso 2: Reasignar pistas de 2 en 2 respetando el orden ganador→arriba
        pairs.forEach((p, index) => {
            p.current_court = Math.floor(index / 2) + 1;
        });

        console.log(`✅ Pistas actualizadas:`, pairs.map(p => `${p.pair_name} → Pista ${p.current_court}`).join(', '));

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
