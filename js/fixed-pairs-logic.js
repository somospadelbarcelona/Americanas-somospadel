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
    createFixedPairs(players, category = 'open') {
        console.log(`🔒 Creando parejas fijas para ${players.length} jugadores (Modo: ${category})...`);

        let shuffled;
        if (category === 'mixed') {
            // Si es mixto, asumimos que vienen alternados M, F, M, F...
            // No barajamos para no romper las parejas chico-chica preparadas
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
                    player1_id: shuffled[i].id,
                    player2_id: shuffled[i + 1].id,
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
                    team_a_names: pairA.pair_name,
                    team_b_names: pairB.pair_name,
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
        console.log(`📊 Actualizando rankings Pozo...`);

        // Crear un mapa para acceso rápido
        const pairMap = {};
        pairs.forEach(p => pairMap[p.id] = p);

        // Procesar resultados
        lastRoundMatches.forEach(match => {
            if (match.status === 'finished') {
                const pairA = pairMap[match.pair_a_id];
                const pairB = pairMap[match.pair_b_id];

                if (!pairA || !pairB) {
                    console.warn(`⚠️ Pareja no encontrada en match ${match.id}`);
                    return;
                }

                const scoreA = parseInt(match.score_a || 0);
                const scoreB = parseInt(match.score_b || 0);

                // Actualizar estadísticas
                pairA.games_won += scoreA;
                pairA.games_lost += scoreB;
                pairB.games_won += scoreB;
                pairB.games_lost += scoreA;

                // Determinar ganador y aplicar lógica Pozo
                if (scoreA > scoreB) {
                    // Pareja A gana
                    pairA.wins++;
                    pairB.losses++;

                    // Pareja A sube (si no está en 1)
                    if (pairA.current_court > 1) pairA.current_court--;

                    // Pareja B baja (si no está en max)
                    pairB.current_court++;

                } else if (scoreB > scoreA) {
                    pairB.wins++;
                    pairA.losses++;

                    if (pairB.current_court > 1) pairB.current_court--;
                    pairA.current_court++;
                }

                // Mark them as having played this round to avoid double processing if needed
                pairA.last_played_round = match.round;
                pairB.last_played_round = match.round;
            }
        });

        // --- STRICT COURT REASSIGNMENT (Smart Filling) ---
        // Al igual que en Rotating, necesitamos asegurar que las pistas se llenan de 1 a maxCourts.

        // 1. Ordenar por pista deseada (post-partido)
        pairs.sort((a, b) => {
            const courtA = a.current_court || 999;
            const courtB = b.current_court || 999;
            return courtA - courtB;
        });

        // 2. Reasignar estrictamente: 2 parejas por pista
        pairs.forEach((p, index) => {
            const newCourt = Math.floor(index / 2) + 1;
            // Solo actualizamos si está dentro del rango válido
            p.current_court = newCourt;
        });

        // -------------------------------------------------

        // Ordenar parejas por juegos ganados (para clasificación)
        const sortedPairs = pairs.sort((a, b) => {
            // Primero por juegos ganados
            if (b.games_won !== a.games_won) return b.games_won - a.games_won;
            // Luego por victorias
            if (b.wins !== a.wins) return b.wins - a.wins;
            // Finalmente por juegos perdidos (menos es mejor)
            return a.games_lost - b.games_lost;
        });

        console.log(`✅ Rankings actualizados`);
        return sortedPairs;
    },

    /**
     * Calcular clasificación para parejas fijas
     * @param {Array} pairs - Parejas
     * @returns {Array} - Clasificación ordenada
     */
    calculateStandings(pairs) {
        return pairs.map((p, index) => ({
            position: index + 1,
            name: p.pair_name,
            court: p.current_court,
            games: p.games_won,
            won: p.wins,
            lost: p.losses,
            played: p.wins + p.losses,
            // Indicador de tendencia (comparar con pista inicial)
            trend: p.current_court < p.initial_court ? '↑' :
                p.current_court > p.initial_court ? '↓' : '='
        }));
    }
};

// Exportar globalmente
window.FixedPairsLogic = FixedPairsLogic;
console.log("🔒 FixedPairsLogic cargado");
