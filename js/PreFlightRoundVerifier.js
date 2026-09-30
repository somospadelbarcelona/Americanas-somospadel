/**
 * PreFlightRoundVerifier.js
 * Sistema de Verificación Pre-Flight y Auditoría de Rondas
 *
 * Misión:
 * 1. Normalizar inequívocamente la modalidad ('twister', 'fixed', 'swiss').
 * 2. Auditar cada ronda generada antes de persistirla en la base de datos o emitirla a los jugadores.
 * 3. En Twister: Garantizar matemáticamente que NINGÚN jugador repita compañero de la ronda anterior (R-1).
 *    Si detecta una repetición evitable entre los 4 jugadores de una pista, evalúa las 3 permutaciones posibles
 *    y aplica el reordenamiento óptimo automáticamente (Auto-Fix).
 * 4. Auditar que no haya jugadores duplicados ni pistas incompletas (!= 4 jugadores).
 *
 * Compatible con Browser (window.PreFlightRoundVerifier) y Node.js (module.exports).
 */

(function () {
    'use strict';

    const PreFlightRoundVerifier = {

        /**
         * Normaliza de forma universal y a prueba de balas el modo de juego.
         * Devuelve estrictamente: 'twister' | 'fixed' | 'swiss'
         *
         * @param {string} rawMode - Modo directo recibido (ej: event.pair_mode)
         * @param {object} eventData - Datos completos del evento (nombre, formato, etc.)
         * @returns {'twister' | 'fixed' | 'swiss'}
         */
        normalizePairMode(rawMode, eventData = {}) {
            const raw = String(rawMode || eventData.pair_mode || '').trim().toLowerCase();
            const name = String(eventData.name || '').trim().toUpperCase();
            const format = String(eventData.format || '').trim().toLowerCase();
            const tournamentType = String(eventData.tournament_type || '').trim().toLowerCase();

            // 1. Detección estricta de SUIZO
            if (
                raw === 'swiss' ||
                raw === 'suizo' ||
                raw === 'suiza' ||
                raw === 'sistema_suizo' ||
                format.includes('suiz') ||
                tournamentType.includes('suiz') ||
                name.includes('SUIZ') ||
                !!eventData.isSwiss
            ) {
                return 'swiss';
            }

            // 2. Detección estricta de TWISTER / INDIVIDUAL / ROTATIVO
            // Si el usuario configuró 'twister' o 'rotating', esto tiene MÁXIMA PRECEDENCIA
            // e invalida cualquier residuo que exista en fixed_pairs.
            if (
                raw === 'twister' ||
                raw === 'rotating' ||
                raw === 'rotativo' ||
                raw === 'rotativa' ||
                raw === 'individual' ||
                raw === 'pozo_individual' ||
                format.includes('twister') ||
                format.includes('rotat') ||
                format.includes('individual') ||
                tournamentType.includes('twister') ||
                tournamentType.includes('rotat') ||
                tournamentType.includes('individual') ||
                name.includes('TWISTER') ||
                name.includes('ROTAT')
            ) {
                return 'twister';
            }

            // 3. Detección de PAREJAS FIJAS
            // Solo si NO es Twister ni Suizo, y explícitamente se configuró fija o el nombre es fija
            const isExplicitFixed = [
                'fixed',
                'fixed_pairs',
                'fixed_admin',
                'fixed_auto',
                'fija',
                'fijo',
                'pareja_fija',
                'parejas_fijas'
            ].includes(raw);

            const hasFixedInMeta = format.includes('fij') ||
                tournamentType.includes('fij') ||
                name.includes('FIJA') ||
                name.includes('PAREJAS FIJAS') ||
                name.includes('PAREJA FIJA') ||
                !!eventData.is_fija;

            if (isExplicitFixed || hasFixedInMeta) {
                return 'fixed';
            }

            // Si hay parejas fijas pobladas pero NO hubo mención alguna de Twister en pair_mode
            if (Array.isArray(eventData.fixed_pairs) && eventData.fixed_pairs.length > 0 && !raw) {
                return 'fixed';
            }

            // Por defecto en Americanas y Entrenos de pozo: 'twister'
            return 'twister';
        },

        /**
         * Extrae de los partidos anteriores un mapa completo del historial de compañeros de cada jugador.
         *
         * @param {Array} matches - Partidos finalizados o jugados de rondas anteriores
         * @param {number} targetRound - Ronda que se va a disputar
         * @returns {Map<string, { lastPartner: string|null, partnerHistory: string[], roundPartners: Map<number, string> }>}
         */
        extractPartnerHistory(matches = [], targetRound = 2) {
            const historyMap = new Map();

            const ensurePlayerEntry = (pid) => {
                const sId = String(pid);
                if (!historyMap.has(sId)) {
                    historyMap.set(sId, {
                        lastPartner: null,
                        partnerHistory: [],
                        roundPartners: new Map()
                    });
                }
                return historyMap.get(sId);
            };

            // Filtrar partidos previos al targetRound y ordenarlos por ronda ascendente
            const pastMatches = (matches || [])
                .filter(m => {
                    const r = parseInt(m.round || 0);
                    return r > 0 && r < targetRound;
                })
                .sort((a, b) => parseInt(a.round || 0) - parseInt(b.round || 0));

            pastMatches.forEach(m => {
                const round = parseInt(m.round || 0);
                const teamA = (m.team_a_ids || []).map(String);
                const teamB = (m.team_b_ids || []).map(String);

                // Pareja A
                if (teamA.length === 2) {
                    const [p1, p2] = teamA;
                    const e1 = ensurePlayerEntry(p1);
                    const e2 = ensurePlayerEntry(p2);

                    e1.roundPartners.set(round, p2);
                    e2.roundPartners.set(round, p1);

                    // Reconstruir historial ordenado (más reciente al principio)
                    e1.partnerHistory.unshift(p2);
                    e2.partnerHistory.unshift(p1);

                    if (round === targetRound - 1) {
                        e1.lastPartner = p2;
                        e2.lastPartner = p1;
                    }
                }

                // Pareja B
                if (teamB.length === 2) {
                    const [p3, p4] = teamB;
                    const e3 = ensurePlayerEntry(p3);
                    const e4 = ensurePlayerEntry(p4);

                    e3.roundPartners.set(round, p4);
                    e4.roundPartners.set(round, p3);

                    e3.partnerHistory.unshift(p4);
                    e4.partnerHistory.unshift(p3);

                    if (round === targetRound - 1) {
                        e3.lastPartner = p4;
                        e4.lastPartner = p3;
                    }
                }
            });

            return historyMap;
        },

        /**
         * Audita un conjunto de partidos propuestos para una ronda.
         *
         * @param {Array} matches - Partidos propuestos
         * @param {object} options - Opciones de auditoría
         * @returns {object} { isValid: boolean, errors: string[], warnings: string[], metrics: object }
         */
        auditRound(matches = [], options = {}) {
            const {
                roundNum = 1,
                pairMode = 'twister',
                expectedCourts = null,
                prevRoundMatches = [],
                allMatches = []
            } = options;

            const errors = [];
            const warnings = [];
            const seenPlayers = new Map(); // pid -> court
            const historyMap = this.extractPartnerHistory(
                allMatches.length > 0 ? allMatches : prevRoundMatches,
                roundNum
            );

            let repeatedPartnersR1Count = 0;
            let totalPlayersCount = 0;

            matches.forEach((m, idx) => {
                const court = parseInt(m.court || idx + 1);
                const teamA = (m.team_a_ids || []).map(String);
                const teamB = (m.team_b_ids || []).map(String);
                const courtPlayers = [...teamA, ...teamB];

                // 1. Pistas completas: exactamente 4 jugadores (2 por equipo)
                if (teamA.length !== 2 || teamB.length !== 2) {
                    errors.push(
                        `[Pista ${court}] Formación inválida: Equipo A tiene ${teamA.length} jugadores y Equipo B tiene ${teamB.length}. Se requieren exactamente 2 vs 2.`
                    );
                }

                // 2. Jugadores duplicados en la pista
                const courtSet = new Set(courtPlayers);
                if (courtSet.size !== courtPlayers.length) {
                    errors.push(
                        `[Pista ${court}] Jugador duplicado dentro de la misma pista: ${courtPlayers.join(', ')}`
                    );
                }

                // 3. Jugador duplicado en diferentes pistas de la misma ronda
                courtPlayers.forEach(pid => {
                    if (seenPlayers.has(pid)) {
                        errors.push(
                            `Jugador ${pid} asignado en múltiples pistas de la ronda ${roundNum} (Pista ${seenPlayers.get(pid)} y Pista ${court}).`
                        );
                    } else {
                        seenPlayers.set(pid, court);
                        totalPlayersCount++;
                    }
                });

                // 4. Verificación Twister: Repetición de compañero respecto a R-1
                if (pairMode === 'twister' && roundNum > 1) {
                    const checkPair = (p1, p2, teamLabel) => {
                        const h1 = historyMap.get(String(p1));
                        const h2 = historyMap.get(String(p2));
                        const last1 = h1 ? h1.lastPartner : null;
                        const last2 = h2 ? h2.lastPartner : null;

                        if (last1 && last1 === String(p2)) {
                            repeatedPartnersR1Count++;
                            warnings.push(
                                `[Pista ${court} - ${teamLabel}] Repetición de pareja R-1: ${p1} y ${p2} ya jugaron juntos en la ronda anterior.`
                            );
                        } else if (last2 && last2 === String(p1)) {
                            repeatedPartnersR1Count++;
                            warnings.push(
                                `[Pista ${court} - ${teamLabel}] Repetición de pareja R-1: ${p2} y ${p1} ya jugaron juntos en la ronda anterior.`
                            );
                        }
                    };

                    if (teamA.length === 2) checkPair(teamA[0], teamA[1], 'Equipo A');
                    if (teamB.length === 2) checkPair(teamB[0], teamB[1], 'Equipo B');
                }
            });

            if (expectedCourts && matches.length !== expectedCourts) {
                warnings.push(
                    `Se esperaban ${expectedCourts} pistas pero se generaron ${matches.length} partidos.`
                );
            }

            const isValid = errors.length === 0;

            return {
                isValid,
                errors,
                warnings,
                metrics: {
                    roundNum,
                    pairMode,
                    totalMatches: matches.length,
                    totalPlayers: totalPlayersCount,
                    repeatedPartnersR1Count
                }
            };
        },

        /**
         * SISTEMA DE VERIFICACIÓN PRE-FLIGHT CON AUTO-FIX
         *
         * Antes de persistir o emitir la ronda:
         * 1. Audita los partidos propuestos.
         * 2. Si detecta parejas repetidas en Twister, evalúa las 3 combinaciones de los 4 jugadores
         *    de cada pista:
         *      C0: [P0, P1] vs [P2, P3]
         *      C1: [P0, P2] vs [P1, P3]
         *      C2: [P0, P3] vs [P1, P2]
         *    Y selecciona la combinación que GARANTICE CERO repeticiones con la ronda anterior (R-1).
         * 3. Retorna la lista de partidos corregida e inmaculada.
         *
         * @param {Array} matches - Partidos generados
         * @param {object} options - Parámetros { roundNum, pairMode, prevRoundMatches, allMatches, players }
         * @returns {object} { success: boolean, matches: Array, report: object }
         */
        verifyAndFixRoundMatches(matches = [], options = {}) {
            const {
                roundNum = 1,
                pairMode = 'twister',
                prevRoundMatches = [],
                allMatches = [],
                players = []
            } = options;

            if (!Array.isArray(matches) || matches.length === 0) {
                return {
                    success: false,
                    matches: [],
                    report: { errors: ['No se proporcionaron partidos para verificar.'], warnings: [] }
                };
            }

            const normalizedMode = this.normalizePairMode(pairMode, { pair_mode: pairMode });

            // Crear mapa de búsqueda de nombres de jugadores para reconstruir nombres correctamente
            const playerNameMap = new Map();
            (players || []).forEach(p => {
                const sId = String(p.id || p.uid || '');
                if (sId) playerNameMap.set(sId, p.name || `Jugador ${sId}`);
            });

            // Mapa de historial
            const historyMap = this.extractPartnerHistory(
                allMatches.length > 0 ? allMatches : prevRoundMatches,
                roundNum
            );

            // Clonar partidos para corregir sin mutar referencias externas directamente
            const fixedMatches = matches.map(m => ({ ...m }));

            let fixesApplied = 0;

            // AUTO-FIX PARA TWISTER EN RONDAS > 1
            if (normalizedMode === 'twister' && roundNum > 1) {
                fixedMatches.forEach(m => {
                    const court = parseInt(m.court || 1);
                    const teamAIds = (m.team_a_ids || []).map(String);
                    const teamBIds = (m.team_b_ids || []).map(String);

                    if (teamAIds.length !== 2 || teamBIds.length !== 2) {
                        return; // Dejar que el auditor reporte el error de tamaño
                    }

                    const courtPlayers = [teamAIds[0], teamAIds[1], teamBIds[0], teamBIds[1]];

                    // Función para obtener nombres de jugadores
                    const getNamesForIds = (ids) => {
                        return ids.map((id, i) => {
                            if (playerNameMap.has(id)) return playerNameMap.get(id);
                            // Buscar en team_a_names / team_b_names si ya venían en el match
                            const origA = m.team_a_ids || [];
                            const origB = m.team_b_ids || [];
                            const idxA = origA.findIndex(x => String(x) === id);
                            if (idxA !== -1 && m.team_a_names && m.team_a_names[idxA]) return m.team_a_names[idxA];
                            const idxB = origB.findIndex(x => String(x) === id);
                            if (idxB !== -1 && m.team_b_names && m.team_b_names[idxB]) return m.team_b_names[idxB];
                            return `Jugador ${id}`;
                        });
                    };

                    // Las 3 posibles combinaciones de 2 vs 2 para 4 jugadores:
                    // P0, P1, P2, P3
                    const [p0, p1, p2, p3] = courtPlayers;
                    const combinations = [
                        { teamA: [p0, p1], teamB: [p2, p3], label: 'Comb 0: (0+1 vs 2+3)' },
                        { teamA: [p0, p2], teamB: [p1, p3], label: 'Comb 1: (0+2 vs 1+3)' },
                        { teamA: [p0, p3], teamB: [p1, p2], label: 'Comb 2: (0+3 vs 1+2)' }
                    ];

                    // Función que calcula la penalización de una combinación
                    const evaluateCombination = (comb) => {
                        let penalty = 0;
                        let r1Repeats = 0;

                        const scorePair = (id1, id2) => {
                            const h1 = historyMap.get(id1);
                            const h2 = historyMap.get(id2);
                            const last1 = h1 ? h1.lastPartner : null;
                            const last2 = h2 ? h2.lastPartner : null;

                            // 1. REPETICIÓN R-1 (INMEDIATAMENTE ANTERIOR) -> PENALIZACIÓN MÁXIMA
                            if (last1 === id2 || last2 === id1) {
                                penalty += 100000;
                                r1Repeats++;
                            }

                            // 2. Historial de rondas anteriores
                            if (h1 && Array.isArray(h1.partnerHistory)) {
                                const idx = h1.partnerHistory.indexOf(id2);
                                if (idx === 1) penalty += 500; // R-2
                                else if (idx === 2) penalty += 200; // R-3
                                else if (idx > 2) penalty += 50; // R-4+
                            }
                        };

                        scorePair(comb.teamA[0], comb.teamA[1]);
                        scorePair(comb.teamB[0], comb.teamB[1]);

                        return { ...comb, penalty, r1Repeats };
                    };

                    const scoredCombinations = combinations.map(evaluateCombination);

                    // Ordenar de menor a mayor penalización
                    scoredCombinations.sort((a, b) => a.penalty - b.penalty);

                    const best = scoredCombinations[0];

                    // Comprobar la formación actual
                    const currentComb = { teamA: teamAIds, teamB: teamBIds };
                    const currentEval = evaluateCombination(currentComb);

                    // Si la combinación actual tiene repetición de R-1 y existe una mejor
                    if (currentEval.r1Repeats > 0 && best.r1Repeats < currentEval.r1Repeats) {
                        fixesApplied++;
                        console.log(
                            `🛠️ [PreFlight Auto-Fix] Pista ${court}: Corrigiendo repetición R-1 en Twister. De ${currentEval.r1Repeats} repeticiones a ${best.r1Repeats} repeticiones (${best.label}).`
                        );

                        const namesA = getNamesForIds(best.teamA);
                        const namesB = getNamesForIds(best.teamB);

                        m.team_a_ids = best.teamA;
                        m.team_b_ids = best.teamB;
                        m.team_a_names = namesA;
                        m.team_b_names = namesB;
                        m.teamA = namesA.join(' / ');
                        m.teamB = namesB.join(' / ');
                    }
                });
            }

            this.lastFixApplied = fixesApplied > 0;
            this.lastFixCount = fixesApplied;

            // Auditoría final tras Auto-Fix
            const auditReport = this.auditRound(fixedMatches, {
                roundNum,
                pairMode: normalizedMode,
                expectedCourts: options.expectedCourts,
                prevRoundMatches,
                allMatches
            });

            if (!auditReport.isValid) {
                console.error(
                    `❌ [PreFlight Verifier] Falló la validación pre-flight de la Ronda ${roundNum}:`,
                    auditReport.errors
                );
                return {
                    success: false,
                    matches: fixedMatches,
                    fixesApplied,
                    report: auditReport
                };
            }

            console.log(
                `✅ [PreFlight Verifier] Ronda ${roundNum} auditada y validada con ÉXITO (${normalizedMode.toUpperCase()}). Partidos: ${fixedMatches.length}, Repeticiones R-1: ${auditReport.metrics.repeatedPartnersR1Count}, Correcciones: ${fixesApplied}.`
            );

            return {
                success: true,
                matches: fixedMatches,
                fixesApplied,
                report: auditReport
            };
        },

        verifyAndShieldRound(matches = [], options = {}) {
            return this.verifyAndFixRoundMatches(matches, options);
        }
    };

    // Exportación global (Browser y Node.js)
    if (typeof window !== 'undefined') {
        window.PreFlightRoundVerifier = PreFlightRoundVerifier;
    }
    if (typeof globalThis !== 'undefined') {
        globalThis.PreFlightRoundVerifier = PreFlightRoundVerifier;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { PreFlightRoundVerifier };
    }

    console.log("🛡️ PreFlightRoundVerifier Cargado y Listo (v2026.1)");
})();
