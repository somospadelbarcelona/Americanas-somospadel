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
            const key = String(p.id || p.uid || "");
            playerMap[key] = {
                ...p,
                id: key,
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
                        const pKey = Object.keys(playerMap).find(k => 
                            String(k) === String(id) || 
                            String(playerMap[k]?.uid || "") === String(id) || 
                            String(playerMap[k]?.id || "") === String(id)
                        );
                        if (pKey && playerMap[pKey]) {
                            const pObj = playerMap[pKey];
                            pObj.played = true;
                            pObj.won = winners.includes(String(id));

                            // 🛡️ CRITICAL FIX: El punto de partida de la pista es SIEMPRE la pista
                            // donde el jugador acaba de disputar este partido (m.court),
                            // NUNCA un estado desincronizado o desfasado de rondas anteriores.
                            if (courtNum > 0) {
                                pObj.current_court = courtNum;
                            }

                            // TRACK LAST PARTNER (For Twister Logic)
                            // If I am in Team A, my partner is the other guy in Team A.
                            const myTeam = teamA.includes(String(id)) ? teamA : teamB;
                            const partnerId = myTeam.find(pid => String(pid) !== String(id));
                            if (partnerId) {
                                // Get history before overwriting last_partner
                                const currentHistory = pObj.partner_history || (pObj.last_partner ? [pObj.last_partner] : []);
                                pObj.last_partner = partnerId;
                                
                                // Guardar historial de compañeros de todo el torneo (sin duplicados inmediatos)
                                const newHistory = [partnerId, ...currentHistory.filter(hid => String(hid) !== String(partnerId))];
                                pObj.partner_history = newHistory;
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

        // Helper comparison logic for Pozo stability with BYE rotation
        const comparePlayers = (a, b) => {
            const cA = parseInt(a.current_court || maxCourts);
            const cB = parseInt(b.current_court || maxCourts);
            if (cA !== cB) return cA - cB;
            
            // Prioritize rested players (played === false) over played players
            if (a.played !== b.played) {
                return a.played ? 1 : -1; // false (rested) comes first
            }
            
            // Prioritize winners (won === true) over losers (won === false)
            if (a.won !== b.won) {
                return a.won ? -1 : 1; // true (winner) comes first
            }
            
            return String(a.name || "").localeCompare(String(b.name || ""));
        };

        if (category === 'mixed') {
            const males = allPlayers.filter(p => p.gender === 'chico').sort(comparePlayers);
            const females = allPlayers.filter(p => p.gender === 'chica').sort(comparePlayers);

            males.forEach((p, i) => { p.current_court = Math.floor(i / 2) + 1; });
            females.forEach((p, i) => { p.current_court = Math.floor(i / 2) + 1; });

            return [...males, ...females];
        } else {
            allPlayers.sort(comparePlayers);

            console.log("🏃 [Movement Audit] Re-calculating final court assignments:");
            allPlayers.forEach((p, i) => { 
                const oldCourt = p.current_court;
                p.current_court = Math.floor(i / 4) + 1; 
                if (oldCourt !== p.current_court) {
                    console.log(`   - ${p.name}: Pista ${oldCourt} -> Pista ${p.current_court} (${p.played ? (p.won ? 'Gano' : 'Perdio') : 'Resto'})`);
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
     * Also penalizes repeating the same partner from the tournament.
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

        // Helper para comprobar si 2 jugadores comparten equipo de club (soporta arrays de equipos)
        const shareClubTeam = (player1, player2) => {
            if (!player1 || !player2) return false;
            const t1 = player1.team || player1.team_somospadel;
            const t2 = player2.team || player2.team_somospadel;
            if (!t1 || !t2) return false;
            const arr1 = Array.isArray(t1) ? t1 : [t1];
            const arr2 = Array.isArray(t2) ? t2 : [t2];
            return arr1.some(item1 => item1 && arr2.includes(item1));
        };

        options.forEach(opt => {
            let score = 0;

            // Fomentar rivalidades directas entre compañeros de club (enfrentarlos)
            if (shareClubTeam(opt.teamA[0], opt.teamB[0])) score += 1;
            if (shareClubTeam(opt.teamA[0], opt.teamB[1])) score += 1;
            if (shareClubTeam(opt.teamA[1], opt.teamB[0])) score += 1;
            if (shareClubTeam(opt.teamA[1], opt.teamB[1])) score += 1;

            // Desincentivar poner compañeros del mismo club en la misma pareja si pueden enfrentarse
            if (shareClubTeam(opt.teamA[0], opt.teamA[1])) score -= 2;
            if (shareClubTeam(opt.teamB[0], opt.teamB[1])) score -= 2;

            // 🛡️ CRITICAL: Penalizar severamente repetir pareja en base al historial del torneo
            const getPartnerPenalty = (player, partner) => {
                const history = player.partner_history || (player.last_partner ? [player.last_partner] : []);
                const partnerIdStr = String(partner.id || partner.uid || "");
                
                // Repitió en el partido inmediatamente anterior (depth 1) -> PROHIBICIÓN ABSOLUTA (-10000)
                if (history[0] && String(history[0]) === partnerIdStr) {
                    return -10000;
                }
                // Repitió hace 2 partidos (depth 2) -> Penalización muy alta (-1000)
                if (history[1] && String(history[1]) === partnerIdStr) {
                    return -1000;
                }
                // Repitió hace 3 partidos (depth 3) -> Penalización moderada (-500)
                if (history[2] && String(history[2]) === partnerIdStr) {
                    return -500;
                }
                // Repitió hace 4 o más partidos en el torneo -> Penalización menor (-200)
                if (history.slice(3).some(hid => String(hid) === partnerIdStr)) {
                    return -200;
                }
                return 0;
            };

            score += getPartnerPenalty(opt.teamA[0], opt.teamA[1]);
            score += getPartnerPenalty(opt.teamA[1], opt.teamA[0]);
            score += getPartnerPenalty(opt.teamB[0], opt.teamB[1]);
            score += getPartnerPenalty(opt.teamB[1], opt.teamB[0]);

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
     * Create Smart Pairs ensuring NO repetition of partners in the last 2 rounds,
     * falling back to 1 round, and finally falling back to any available option if blocked.
     */
    _createSmartPairs(players) {
        if (players.length < 4) return { teamA: players.slice(0, 2), teamB: players.slice(2, 4) };

        const p = players;
        const options = [
            { teamA: [p[0], p[1]], teamB: [p[2], p[3]] },
            { teamA: [p[0], p[2]], teamB: [p[1], p[3]] },
            { teamA: [p[0], p[3]], teamB: [p[1], p[2]] }
        ];

        // Función auxiliar para verificar si dos jugadores han sido compañeros en el rango dado de historial
        const areRecentPartners = (p1, p2, depth) => {
            const h1 = p1.partner_history || (p1.last_partner ? [p1.last_partner] : []);
            const h2 = p2.partner_history || (p2.last_partner ? [p2.last_partner] : []);
            
            // Comprobar hasta depth elementos
            const slice1 = h1.slice(0, depth);
            const slice2 = h2.slice(0, depth);

            const p1Key = String(p1.id || p1.uid || "");
            const p2Key = String(p2.id || p2.uid || "");

            if (slice1.some(id => String(id) === p2Key)) return true;
            if (slice2.some(id => String(id) === p1Key)) return true;
            return false;
        };

        // Nivel 2: Comprobar historial de las últimas 2 rondas (depth = 2)
        let validOptions = options.filter(opt => {
            if (areRecentPartners(opt.teamA[0], opt.teamA[1], 2)) return false;
            if (areRecentPartners(opt.teamB[0], opt.teamB[1], 2)) return false;
            return true;
        });

        if (validOptions.length > 0) {
            console.log(`🤖 Smart Matchmaking: Found ${validOptions.length} options with NO repeated partners in last 2 rounds.`);
            return validOptions[Math.floor(Math.random() * validOptions.length)];
        }

        // Nivel 1: Comprobar historial de la última ronda (depth = 1)
        console.warn("⚠️ Blocked for 2 rounds history. Falling back to 1 round history check...");
        validOptions = options.filter(opt => {
            if (areRecentPartners(opt.teamA[0], opt.teamA[1], 1)) return false;
            if (areRecentPartners(opt.teamB[0], opt.teamB[1], 1)) return false;
            return true;
        });

        if (validOptions.length > 0) {
            console.log(`🤖 Smart Matchmaking Fallback (1 round): Found ${validOptions.length} options.`);
            return validOptions[Math.floor(Math.random() * validOptions.length)];
        }

        // Nivel 0: Permitir cualquier emparejamiento (elegir el que menos repeticiones tenga sumadas)
        console.warn("⚠️ No perfect separation possible. Forcing best available option.");
        
        // Calculamos una penalización para cada opción
        const scoredOptions = options.map(opt => {
            let penalty = 0;
            // Si son compañeros del partido anterior, penaliza 10
            if (areRecentPartners(opt.teamA[0], opt.teamA[1], 1)) penalty += 10;
            if (areRecentPartners(opt.teamB[0], opt.teamB[1], 1)) penalty += 10;
            // Si son compañeros de hace 2 partidos, penaliza 2
            if (areRecentPartners(opt.teamA[0], opt.teamA[1], 2) && !areRecentPartners(opt.teamA[0], opt.teamA[1], 1)) penalty += 2;
            if (areRecentPartners(opt.teamB[0], opt.teamB[1], 2) && !areRecentPartners(opt.teamB[0], opt.teamB[1], 1)) penalty += 2;
            return { option: opt, penalty };
        });

        // Ordenar por menor penalización
        scoredOptions.sort((a, b) => a.penalty - b.penalty);
        
        // Filtrar las que tienen la misma mínima penalización y elegir una al azar
        const minPenalty = scoredOptions[0].penalty;
        const bestScored = scoredOptions.filter(o => o.penalty === minPenalty);
        
        return bestScored[Math.floor(Math.random() * bestScored.length)].option;
    }

};

if (typeof window !== 'undefined') {
    window.RotatingPozoLogic = RotatingPozoLogic;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RotatingPozoLogic };
}
console.log("🌀 RotatingPozoLogic Cargado");
