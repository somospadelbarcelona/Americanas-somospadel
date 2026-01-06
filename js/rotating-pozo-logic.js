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

        // Mapear jugadores para acceso rápido
        // Aseguramos que tengan current_court (si es la primera ronda, se asignará más tarde o vendrá de la creación)
        const playerMap = {};
        players.forEach(p => {
            playerMap[p.id] = { ...p, won: false };
        });

        // Procesar partidos finalizados
        matches.forEach(m => {
            if (m.status === 'finished') {
                const sA = parseInt(m.score_a || 0);
                const sB = parseInt(m.score_b || 0);
                const teamA = m.team_a_ids || [];
                const teamB = m.team_b_ids || [];
                const court = parseInt(m.court);

                if (sA > sB) {
                    teamA.forEach(id => { if (playerMap[id]) playerMap[id].won = true; });
                    teamB.forEach(id => { if (playerMap[id]) playerMap[id].won = false; });
                } else if (sB > sA) {
                    teamB.forEach(id => { if (playerMap[id]) playerMap[id].won = true; });
                    teamA.forEach(id => { if (playerMap[id]) playerMap[id].won = false; });
                } else {
                    // Empate: En Pozo tradicional, a veces se decide por ranking previo. 
                    // Aquí daremos prioridad a Team A por simplicidad o aleatorio
                    teamA.forEach(id => { if (playerMap[id]) playerMap[id].won = true; });
                }
            }
        });

        // Aplicar movimiento de pistas
        const updatedPlayers = Object.values(playerMap).map(p => {
            let nextCourt = parseInt(p.current_court || 1);

            if (p.won) {
                // Ganador sube (si no está en pista 1)
                if (nextCourt > 1) nextCourt--;
            } else {
                // Perdedor baja (si no está en la última)
                if (nextCourt < maxCourts) nextCourt++;
            }

            return { ...p, current_court: nextCourt };
        });

        return updatedPlayers;
    },

    /**
     * Genera los partidos de la siguiente ronda mezclando jugadores según la regla:
     * "Ganadores de abajo + Perdedores de arriba"
     */
    generateRound(players, roundNumber, maxCourts) {
        console.log(`🌀 Generando Ronda ${roundNumber} con Rotación Pozo...`);

        const matches = [];

        // Agrupar jugadores por su nueva pista
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

            // Lógica de Mezcla Solicitada: 
            // Para maximizar la rotación, intentamos emparejar a uno que sube con uno que baja.
            // Identificamos quién viene de dónde (si tenemos esa info guardada o por azar)
            // Como no guardamos la pista exacta de procedencia en cada objeto jugador post-vaciado, 
            // usamos un barajado guiado:

            const shuffled = [...pInCourt].sort(() => 0.5 - Math.random());

            // Emparejamos [0,2] vs [1,3] para asegurar que si el array venía ordenado por procedencia (que lo está en el map inicial), 
            // se mezclen bien.
            matches.push({
                round: roundNumber,
                court: c,
                team_a_ids: [shuffled[0].id, shuffled[2].id],
                team_b_ids: [shuffled[1].id, shuffled[3].id],
                team_a_names: [shuffled[0].name, shuffled[2].name],
                team_b_names: [shuffled[1].name, shuffled[3].name],
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
