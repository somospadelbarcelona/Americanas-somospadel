/**
 * 🎾 ROTATING PAREJAS LOGIC - Sistema Pozo (Individual)
 * Lógica para manejar jugadores individuales que suben y bajan de pista
 * y rotan de pareja según el sistema "Pozo".
 */

const RotatingPozoLogic = {

    /**
     * Actualiza la pista actual de cada jugador según el resultado de sus partidos
     * @param {Array} players - Lista de jugadores de la americana (con id, name, etc.)
     * @param {Array} matches - Partidos de la ronda anterior
     * @param {Number} maxCourts - Número máximo de pistas
     * @param {String} category - Categoría de la americana (open, male, female, mixed)
     * @returns {Array} - Jugadores con current_court actualizado
     */
    updatePlayerCourts(players, matches, maxCourts, category = 'open') {
        console.log(`📈 Calculando Ascensos/Descensos individuales (${category})...`);

        // 1. Identificar jugadores y su estado actual
        const playerMap = {};
        players.forEach(p => {
            playerMap[p.id] = {
                ...p,
                current_court: parseInt(p.current_court || maxCourts), // Por defecto abajo si no tiene pista
                won: false,
                played: false
            };
        });

        // 2. Procesar Resultados de Partidos
        if (matches && matches.length > 0) {
            matches.forEach(m => {
                if (m.status === 'finished') {
                    const sA = parseInt(m.score_a || 0);
                    const sB = parseInt(m.score_b || 0);
                    const teamA = (m.team_a_ids || []).map(String);
                    const teamB = (m.team_b_ids || []).map(String);

                    const winners = (sA > sB) ? teamA : ((sB > sA) ? teamB : teamA); // Draw favors A

                    [...teamA, ...teamB].forEach(id => {
                        // Find key that matches loosely
                        const pKey = Object.keys(playerMap).find(k => String(k) === String(id));
                        if (pKey && playerMap[pKey]) {
                            playerMap[pKey].played = true;
                            playerMap[pKey].won = winners.includes(String(id));
                        }
                    });
                }
            });
        }

        // 3. Aplicar Movimiento Teórico (+1 / -1)
        Object.values(playerMap).forEach(p => {
            if (p.played) {
                if (p.won) {
                    if (p.current_court > 1) p.current_court--;
                } else {
                    if (p.current_court < maxCourts) p.current_court++;
                }
            }
        });

        // 4. ESTABILIZACIÓN: Re-empaquetado inteligente para evitar huecos sin saltar pistas
        let allPlayers = Object.values(playerMap);

        if (category === 'mixed') {
            const males = allPlayers.filter(p => p.gender === 'chico').sort((a, b) => a.current_court - b.current_court || a.id.localeCompare(b.id));
            const females = allPlayers.filter(p => p.gender === 'chica').sort((a, b) => a.current_court - b.current_court || a.id.localeCompare(b.id));

            males.forEach((p, i) => { p.current_court = Math.floor(i / 2) + 1; });
            females.forEach((p, i) => { p.current_court = Math.floor(i / 2) + 1; });

            return [...males, ...females];
        } else {
            allPlayers.sort((a, b) => a.current_court - b.current_court || a.id.localeCompare(b.id));
            allPlayers.forEach((p, i) => { p.current_court = Math.floor(i / 4) + 1; });
            return allPlayers;
        }
    },

    /**
     * Logic for ENTRENO: Sort strictly by Level (Higher Level -> Lower Court Number)
     */
    updateEntrenoCourts(players, maxCourts) {
        console.log("📈 Calculando Pistas ENTRENO (Por Nivel)...");

        // 1. Sort by Level (Desc), then by ID
        const sorted = [...players].sort((a, b) => {
            const levelA = parseFloat(a.level || 0);
            const levelB = parseFloat(b.level || 0);
            return levelB - levelA || a.id.localeCompare(b.id);
        });

        // 2. Assign Courts based on sorted position
        // Court 1: Index 0-3, Court 2: Index 4-7, etc.
        sorted.forEach((p, i) => {
            p.current_court = Math.floor(i / 4) + 1;
        });

        return sorted;
    },

    /**
     * Genera los partidos de la siguiente ronda con ROTACIÓN DE PAREJAS
     * En modo TWISTER, los jugadores SIEMPRE cambian de pareja entre rondas
     * Ganadores suben de pista, perdedores bajan
     */
    generateRound(players, roundNumber, maxCourts, category = 'open') {
        console.log(`🌀 Generando Ronda ${roundNumber} (${category}) con Rotación TWISTER...`);

        const matches = [];

        // Agrupar jugadores por su pista actual
        const courts = {};
        for (let i = 1; i <= maxCourts; i++) courts[i] = [];

        players.forEach(p => {
            const c = p.current_court || 1;
            if (courts[c]) courts[c].push(p);
        });

        // Generar partidos para cada pista
        for (let c = 1; c <= maxCourts; c++) {
            const pInCourt = courts[c];

            if (pInCourt.length < 4) {
                console.warn(`⚠️ Pista ${c} tiene solo ${pInCourt.length} jugadores.`);
                continue;
            }

            let teamA, teamB;

            if (category === 'mixed') {
                // MODO MIXTO: 2 hombres + 2 mujeres por pista
                // Rotación garantizada: los hombres y mujeres se emparejan de forma diferente cada ronda
                const males = pInCourt.filter(p => p.gender === 'chico');
                const females = pInCourt.filter(p => p.gender === 'chica');

                if (males.length >= 2 && females.length >= 2) {
                    // Patrón de rotación para MIXTO (asegura que las parejas cambien):
                    // Ronda 1: (M1+F1) vs (M2+F2)
                    // Ronda 2: (M1+F2) vs (M2+F1)
                    // Ronda 3: (M1+F1) vs (M2+F2) [repite ciclo]

                    const rotationPattern = roundNumber % 2;

                    if (rotationPattern === 1) {
                        // Patrón 1: Parejas directas
                        teamA = [males[0], females[0]];
                        teamB = [males[1], females[1]];
                    } else {
                        // Patrón 2: Parejas cruzadas
                        teamA = [males[0], females[1]];
                        teamB = [males[1], females[0]];
                    }
                } else {
                    // Fallback si la pista no está balanceada (no debería pasar en mixto bien configurado)
                    console.warn(`⚠️ Pista ${c} no tiene balance de género correcto para MIXTO`);
                    teamA = this._createRotatingPairs(pInCourt, roundNumber, 0);
                    teamB = this._createRotatingPairs(pInCourt, roundNumber, 1);
                }
            } else {
                // MODO TWISTER / ENTRENO / NORMAL / AMERICANAS
                // El usuario pide explícitamente "cambiar de pareja al cambiar de pista".
                // Usamos la rotación determinística _createRotatingPairs que asegura:
                // R1: (P0,P1) v (P2,P3)
                // R2: (P0,P2) v (P1,P3)
                // R3: (P0,P3) v (P1,P2)
                // Al combinar esto con el movimiento vertical (subir/bajar de pista),
                // es matemáticamente improbable repetir pareja en 6 rondas.
                teamA = this._createRotatingPairs(pInCourt, roundNumber, 0);
                teamB = this._createRotatingPairs(pInCourt, roundNumber, 1);
            }

            matches.push({
                round: roundNumber,
                court: c,
                team_a_ids: teamA.map(p => p.id),
                team_b_ids: teamB.map(p => p.id),
                team_a_names: teamA.map(p => p.name),
                team_b_names: teamB.map(p => p.name),
                status: 'scheduled',
                score_a: 0,
                score_b: 0
            });
        }

        return matches;
    },

    /**
     * Crea parejas rotativas usando un patrón determinístico
     * Asegura que los jugadores cambien de pareja entre rondas
     * 
     * Patrón de rotación para 4 jugadores (P0, P1, P2, P3):
     * Ronda 1: TeamA=(P0,P1) TeamB=(P2,P3)
     * Ronda 2: TeamA=(P0,P2) TeamB=(P1,P3)
     * Ronda 3: TeamA=(P0,P3) TeamB=(P1,P2)
     * Ronda 4: TeamA=(P0,P1) TeamB=(P2,P3) [ciclo se repite]
     * 
     * @param {Array} players - 4 jugadores en la pista
     * @param {Number} roundNumber - Número de ronda actual
     * @param {Number} teamIndex - 0 para Team A, 1 para Team B
     * @returns {Array} - Pareja de 2 jugadores
     */
    _createRotatingPairs(players, roundNumber, teamIndex) {
        if (players.length < 4) {
            console.error('No hay suficientes jugadores para crear parejas');
            return players.slice(0, 2);
        }

        // Ordenar jugadores por ID para tener un orden consistente
        const sortedPlayers = [...players].sort((a, b) => {
            if (a.id < b.id) return -1;
            if (a.id > b.id) return 1;
            return 0;
        });

        const [P0, P1, P2, P3] = sortedPlayers;

        // Patrón de rotación basado en el número de ronda
        const rotationCycle = (roundNumber - 1) % 3; // 0, 1, 2

        let teamA, teamB;

        switch (rotationCycle) {
            case 0:
                // Ronda 1, 4, 7, ... : (P0+P1) vs (P2+P3)
                teamA = [P0, P1];
                teamB = [P2, P3];
                break;
            case 1:
                // Ronda 2, 5, 8, ... : (P0+P2) vs (P1+P3)
                teamA = [P0, P2];
                teamB = [P1, P3];
                break;
            case 2:
                // Ronda 3, 6, 9, ... : (P0+P3) vs (P1+P2)
                teamA = [P0, P3];
                teamB = [P1, P2];
                break;
        }

        return teamIndex === 0 ? teamA : teamB;
    },

    /**
     * Creates pairs for Entreno trying to make Teammates play AGAINST each other.
     * Logic:
     * 1. Generate all 3 valid matchups for 4 players.
     *    Option 1: (P0,P1) vs (P2,P3)
     *    Option 2: (P0,P2) vs (P1,P3)
     *    Option 3: (P0,P3) vs (P1,P2)
     * 2. Score each option: +1 for every HEAD-TO-HEAD teammate clash.
     *    (e.g., if P0 and P2 are Team A, Option 2 puts them together -> bad? 
     *     Wait, user said "que juegen CONTRA compañeros". So being on opposite teams is GOOD.)
     *    Score = (Team(A1)==Team(B1)?1:0) + (Team(A1)==Team(B2)?1:0) + ...
     *    Actually, simpler: Maximize Count(Opponents are Teammates).
     * 3. Pick best score.
     */
    _createEntrenoPairs(players) {
        if (players.length < 4) return { teamA: players.slice(0, 2), teamB: players.slice(2, 4) };

        const p = players;

        // The 3 Possible Matchups (Pairs)
        const options = [
            { teamA: [p[0], p[1]], teamB: [p[2], p[3]] }, // 0+1 vs 2+3
            { teamA: [p[0], p[2]], teamB: [p[1], p[3]] }, // 0+2 vs 1+3
            { teamA: [p[0], p[3]], teamB: [p[1], p[2]] }  // 0+3 vs 1+2
        ];

        // Helper to count teammate clashes (Opposites)
        const countRivalries = (tA, tB) => {
            let score = 0;
            const teamsA = tA.map(pl => pl.team || 'NoneA');
            const teamsB = tB.map(pl => pl.team || 'NoneB');

            // Just check if any member of A shares team with any member of B
            // Actually, we want MAX rivalry.
            // If P1.team == P3.team, that is a rivalry.
            teamsA.forEach(teamNameA => {
                if (teamNameA === 'NoneA') return;
                if (teamsB.includes(teamNameA)) score++;
            });
            return score;
        };

        // Evaluate
        let bestOption = options[0];
        let maxScore = -1;

        options.forEach(opt => {
            const score = countRivalries(opt.teamA, opt.teamB);
            if (score > maxScore) {
                maxScore = score;
                bestOption = opt;
            }
        });

        // Debug Log
        // console.log("Entreno Pairing Logic: Best Score", maxScore);

        return bestOption;
    }
};

if (typeof window !== 'undefined') {
    window.RotatingPozoLogic = RotatingPozoLogic;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RotatingPozoLogic };
}
console.log("🌀 RotatingPozoLogic Cargado");
