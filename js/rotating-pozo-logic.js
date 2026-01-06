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
     * @returns {Array} - Jugadores con current_court actualizado
     */
    updatePlayerCourts(players, matches, maxCourts) {
        console.log("📈 Calculando Ascensos y Descensos Individuales...");

        // 1. Identificar jugadores y su estado actual
        const playerMap = {};

        // Separa jugadores con pista asignada y nuevos (sin pista o pista 0)
        let playersWithCourt = [];
        let newPlayers = [];

        players.forEach(p => {
            // Normalizar pista
            let c = parseInt(p.current_court || 0);

            // Si tiene pista válida (1 a maxCourts), lo guardamos. Si no, es nuevo o sobra.
            if (c > 0 && c <= maxCourts) {
                playersWithCourt.push({ ...p, current_court: c, won: false });
            } else {
                newPlayers.push({ ...p, current_court: 0, won: false });
            }
        });

        // Mapear para actualizar resultados
        playersWithCourt.forEach(p => playerMap[p.id] = p);

        // 2. Procesar Ascensos y Descensos NORMALES (solo para los que jugaron)
        if (matches && matches.length > 0) {
            matches.forEach(m => {
                if (m.status === 'finished') {
                    const sA = parseInt(m.score_a || 0);
                    const sB = parseInt(m.score_b || 0);
                    const teamA = m.team_a_ids || [];
                    const teamB = m.team_b_ids || [];

                    if (sA > sB) {
                        teamA.forEach(id => { if (playerMap[id]) playerMap[id].won = true; });
                    } else if (sB > sA) {
                        teamB.forEach(id => { if (playerMap[id]) playerMap[id].won = true; });
                    } else {
                        // Empate: Beneficio de la duda a Team A
                        teamA.forEach(id => { if (playerMap[id]) playerMap[id].won = true; });
                    }
                }
            });

            // Aplicar lógica: Ganador sube (resta 1), Perdedor baja (suma 1)
            playersWithCourt.forEach(p => {
                if (p.won) {
                    if (p.current_court > 1) p.current_court--;
                } else {
                    if (p.current_court < maxCourts) p.current_court++;
                }
            });
        }

        // 3. REORGANIZACIÓN Y RELLENO (Smart Filling)
        // El objetivo es llenar las pistas desde la 1 hasta maxCourts con 4 jugadores cada una.
        // Los nuevos jugadores entran en las pistas finales o donde haya hueco.

        /* 
           Estrategia:
           a. Agrupar por pista deseada (post-ascenso/descenso).
           b. Aplanar la lista ordenada por pista (1, 1, 1, 1, 2, 2, 2, 2).
           c. Insertar a los nuevos jugadores al final (como si vinieran de pista "maxCourts + 1").
           d. Redistribuir rigurosamente: primeros 4 -> Pista 1, siguientes 4 -> Pista 2, etc.
        */

        let allActivePlayers = [...playersWithCourt, ...newPlayers];

        // Ordenar:
        // 1. Por pista actual (ascendente)
        // 2. Los que ganaron antes que los que perdieron (si coinciden en pista, aunque el re-indexing soluciona esto)
        allActivePlayers.sort((a, b) => {
            const courtA = a.current_court || 999; // Nuevos van al final
            const courtB = b.current_court || 999;
            return courtA - courtB;
        });

        // Reasignar pistas estrictamente de 4 en 4
        // Esto asegura que si se añadió una pista 6, se llenará.
        const updatedPlayers = allActivePlayers.map((p, index) => {
            const newCourt = Math.floor(index / 4) + 1;

            // Si nos pasamos de maxCourts, se quedan en "Banquillo" (o en la última pista si se decide sobrecargar, pero mejor cortar)
            // Aquí permitimos que tengan número de pista alto, el generador decidirá si los usa o no.
            // O mejor: limitamos al maxCourts para que no se generen pistas fantasma visualmente.
            // PERO el usuario quiere usar la pista nueva. Así que el newCourt es válido.

            return {
                ...p,
                current_court: newCourt
            };
        });

        console.log("✅ Distribución final de pistas:", updatedPlayers.map(p => `${p.name}: P${p.current_court}`));

        return updatedPlayers;
    },

    /**
     * Genera los partidos de la siguiente ronda mezclando jugadores según la regla:
     * "Ganadores de abajo + Perdedores de arriba"
     */
    generateRound(players, roundNumber, maxCourts, category = 'open') {
        console.log(`🌀 Generando Ronda ${roundNumber} (${category}) con Rotación Pozo...`);

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
                // En modo mixto, esperamos 2 hombres y 2 mujeres por pista
                const males = pInCourt.filter(p => p.gender === 'chico').sort(() => 0.5 - Math.random());
                const females = pInCourt.filter(p => p.gender === 'chica').sort(() => 0.5 - Math.random());

                if (males.length >= 2 && females.length >= 2) {
                    // Equipo A: M1 + F1, Equipo B: M2 + F2 (o cruzado según ronda para rotar)
                    // Para rotar pareja, usamos el número de ronda
                    if (roundNumber % 2 === 0) {
                        teamA = [males[0], females[1]];
                        teamB = [males[1], females[0]];
                    } else {
                        teamA = [males[0], females[0]];
                        teamB = [males[1], females[1]];
                    }
                } else {
                    // Fallback si la pista no está balanceada
                    const shuffled = [...pInCourt].sort(() => 0.5 - Math.random());
                    teamA = [shuffled[0], shuffled[2]];
                    teamB = [shuffled[1], shuffled[3]];
                }
            } else {
                // Modo Normal / Masculino / Femenino (Barajado estándar)
                const shuffled = [...pInCourt].sort(() => 0.5 - Math.random());
                teamA = [shuffled[0], shuffled[2]];
                teamB = [shuffled[1], shuffled[3]];
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
    }
};

window.RotatingPozoLogic = RotatingPozoLogic;
console.log("🌀 RotatingPozoLogic Cargado");
