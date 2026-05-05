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

        // Initialize/Reset deduplication guard for this ranking cycle
        window._processedCourtsInRanking = new Set();

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
                    // --- 🛡️ DEDUPLICATION GUARD ---
                    const courtNum = parseInt(m.court || 0);
                    const dedupKey = `R${m.round}_C${courtNum}`;
                    if (window._processedCourtsInRanking?.has(dedupKey)) {
                        console.warn(`🛑 Skipping duplicate result for ${dedupKey} to prevent player jump glitches.`);
                        return;
                    }
                    window._processedCourtsInRanking.add(dedupKey);

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

                            // TRACK LAST PARTNER (For Twister Logic)
                            // If I am in Team A, my partner is the other guy in Team A.
                            const myTeam = teamA.includes(String(id)) ? teamA : teamB;
                            const partnerId = myTeam.find(pid => String(pid) !== String(id));
                            if (partnerId) {
                                playerMap[pKey].last_partner = partnerId;
                            }
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
            const males = allPlayers.filter(p => p.gender === 'chico').sort((a, b) => a.current_court - b.current_court || String(a.id || a.uid || "").localeCompare(String(b.id || b.uid || "")));
            const females = allPlayers.filter(p => p.gender === 'chica').sort((a, b) => a.current_court - b.current_court || String(a.id || a.uid || "").localeCompare(String(b.id || b.uid || "")));

            males.forEach((p, i) => { p.current_court = Math.floor(i / 2) + 1; });
            females.forEach((p, i) => { p.current_court = Math.floor(i / 2) + 1; });

            return [...males, ...females];
        } else {
            // 💡 [STABILITY FIX] Sort by:
            // 1. current_court (primary)
            // 2. whether they won (secondary - winners of the same court should stay together in the list)
            // 3. name/id (tertiary - deterministic fallback)
            allPlayers.sort((a, b) => {
                const cA = parseInt(a.current_court || maxCourts);
                const cB = parseInt(b.current_court || maxCourts);
                if (cA !== cB) return cA - cB;
                if (a.won !== b.won) return a.won ? -1 : 1;
                return String(a.name || "").localeCompare(String(b.name || ""));
            });

            console.log("🏃 [Movement Audit] Re-calculating final court assignments:");
            allPlayers.forEach((p, i) => { 
                const oldCourt = p.current_court;
                p.current_court = Math.floor(i / 4) + 1; 
                if (oldCourt !== p.current_court) {
                    console.log(`   - ${p.name}: Pista ${oldCourt} -> Pista ${p.current_court} (${p.won ? 'Gano' : 'Perdio'})`);
                } else {
                    console.log(`   - ${p.name}: Se mantiene en Pista ${p.current_court}`);
                }
            });
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
            return levelB - levelA || String(a.id || a.uid || "").localeCompare(String(b.id || b.uid || ""));
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
                    const rotationPattern = roundNumber % 2;
                    if (rotationPattern === 1) {
                        teamA = [males[0], females[0]];
                        teamB = [males[1], females[1]];
                    } else {
                        teamA = [males[0], females[1]];
                        teamB = [males[1], females[0]];
                    }
                } else {
                    console.warn(`⚠️ Pista ${c} no tiene balance de género correcto para MIXTO`);
                    teamA = this._createRotatingPairs(pInCourt, roundNumber, 0);
                    teamB = this._createRotatingPairs(pInCourt, roundNumber, 1);
                }
            } else if (category === 'entreno') {
                // LOGICA ESPECIFICA ENTRENO: Priorizar rivalidad de compañeros de equipo
                const entrenoPairs = this._createEntrenoPairs(pInCourt);
                teamA = entrenoPairs.teamA;
                teamB = entrenoPairs.teamB;
            } else {
                // MODO TWISTER / NORMAL / AMERICANAS
                // El usuario pide explícitamente "cambiar de pareja al cambiar de pista".
                // Usamos _createSmartPairs para garantizar que NO se repitan parejas inmediatas.
                const smartPairs = this._createSmartPairs(pInCourt);
                teamA = smartPairs.teamA;
                teamB = smartPairs.teamB;
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
     */
    _createRotatingPairs(players, roundNumber, teamIndex) {
        if (players.length < 4) {
            return players.slice(0, 2);
        }

        const sortedPlayers = [...players].sort((a, b) => String(a.id || a.uid || "").localeCompare(String(b.id || b.uid || "")));
        const [P0, P1, P2, P3] = sortedPlayers;

        const rotationCycle = (roundNumber - 1) % 3;
        let teamA, teamB;

        switch (rotationCycle) {
            case 0:
                teamA = [P0, P1];
                teamB = [P2, P3];
                break;
            case 1:
                teamA = [P0, P2];
                teamB = [P1, P3];
                break;
            case 2:
                teamA = [P0, P3];
                teamB = [P1, P2];
                break;
        }

        return teamIndex === 0 ? teamA : teamB;
    },

    /**
     * Creates pairs for Entreno trying to maximize teammate HEAD-TO-HEAD rivalries.
     * Scores every possible combination and picks the best one.
     * Also penalizes repeating the same partner from last round.
     */
    _createEntrenoPairs(players) {
        if (players.length < 4) return { teamA: players.slice(0, 2), teamB: players.slice(2, 4) };

        const p = players;
        const options = [
            { teamA: [p[0], p[1]], teamB: [p[2], p[3]], id: 0 },
            { teamA: [p[0], p[2]], teamB: [p[1], p[3]], id: 1 },
            { teamA: [p[0], p[3]], teamB: [p[1], p[2]], id: 2 }
        ];

        let bestOption = null;
        let maxScore = -Infinity;
        let tiedOptions = [];

        options.forEach(opt => {
            let score = 0;
            const teamA1 = opt.teamA[0].team || opt.teamA[0].team_somospadel;
            const teamA2 = opt.teamA[1].team || opt.teamA[1].team_somospadel;
            const teamB1 = opt.teamB[0].team || opt.teamB[0].team_somospadel;
            const teamB2 = opt.teamB[1].team || opt.teamB[1].team_somospadel;

            const checkRival = (t1, t2) => (t1 && t2 && t1 === t2) ? 1 : 0;
            score += checkRival(teamA1, teamB1);
            score += checkRival(teamA1, teamB2);
            score += checkRival(teamA2, teamB1);
            score += checkRival(teamA2, teamB2);

            if (teamA1 && teamA2 && teamA1 === teamA2) score -= 2;
            if (teamB1 && teamB2 && teamB1 === teamB2) score -= 2;

            // 🛡️ CRITICAL: Penalize repeating last_partner (Absolute priority over rivalry)
            const penalizeRepeat = (player, partner) => {
                if (player.last_partner && String(player.last_partner) === String(partner.id)) return -500; // Massively prohibitive
                return 0;
            };
            score += penalizeRepeat(opt.teamA[0], opt.teamA[1]);
            score += penalizeRepeat(opt.teamA[1], opt.teamA[0]);
            score += penalizeRepeat(opt.teamB[0], opt.teamB[1]);
            score += penalizeRepeat(opt.teamB[1], opt.teamB[0]);

            if (score > maxScore) {
                maxScore = score;
                bestOption = opt;
                tiedOptions = [opt];
            } else if (score === maxScore) {
                tiedOptions.push(opt);
            }
        });

        // Pick randomly among tied options for maximum variety
        if (tiedOptions.length > 1) {
            bestOption = tiedOptions[Math.floor(Math.random() * tiedOptions.length)];
            console.log(`🎲 Picked from ${tiedOptions.length} tied options (Score ${maxScore})`);
        }

        console.log(`⚔️ Entreno Matchup Selected:`, bestOption);
        return bestOption || options[1];
    },

    /**
     * Create Smart Pairs ensuring NO repetition of last_partner
     */
    _createSmartPairs(players) {
        if (players.length < 4) return { teamA: players.slice(0, 2), teamB: players.slice(2, 4) };

        const p = players;
        const options = [
            { teamA: [p[0], p[1]], teamB: [p[2], p[3]] },
            { teamA: [p[0], p[2]], teamB: [p[1], p[3]] },
            { teamA: [p[0], p[3]], teamB: [p[1], p[2]] }
        ];

        // Filter out options where ANY pair repeated (null last_partner = no block)
        const validOptions = options.filter(opt => {
            if (opt.teamA[0].last_partner && String(opt.teamA[0].last_partner) === String(opt.teamA[1].id)) return false;
            if (opt.teamB[0].last_partner && String(opt.teamB[0].last_partner) === String(opt.teamB[1].id)) return false;
            return true;
        });

        if (validOptions.length > 0) {
            // Pick a random valid option
            return validOptions[Math.floor(Math.random() * validOptions.length)];
        } else {
            console.warn("⚠️ No perfect separation possible. Forcing best available.");
            return options[0]; // Fallback to first option (at least it's deterministic)
        }
    }

};

if (typeof window !== 'undefined') {
    window.RotatingPozoLogic = RotatingPozoLogic;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RotatingPozoLogic };
}
console.log("🌀 RotatingPozoLogic Cargado");
