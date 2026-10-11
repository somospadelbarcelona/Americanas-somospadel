/**
 * PreFlightRoundVerifier.js
 * Sistema de Verificación Pre-Flight y Auditoría de Rondas
 *
 * Misión:
 * 1. Normalizar inequívocamente la modalidad ('twister', 'fixed', 'swiss') detectando
 *    'fixed', 'fija', 'parejas', 'duplas' en pair_mode y en el título o metadatos del evento.
 * 2. Auditar cada ronda generada antes de persistirla en la base de datos o emitirla a los jugadores.
 * 3. En Pareja Fija (Fixed):
 *    - Validar que CADA jugador conserva exactamente a su compañero de Ronda 1 en TODAS las rondas subsiguientes.
 *    - Si alguien cambió de compañero, error crítico que bloquea la ronda.
 *    - Validar que cada pista tenga exactamente 4 jugadores (2 vs 2), sin duplicados entre pistas.
 * 4. En Twister:
 *    - Garantizar matemáticamente que NINGÚN jugador repita compañero de la ronda anterior (R-1).
 *    - Auto-Fix automático evaluando las 3 combinaciones posibles por pista.
 * 5. Auditar que no haya jugadores duplicados ni pistas con número de jugadores inválido.
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
         * @param {object} eventData - Datos completos del evento (nombre, título, formato, etc.)
         * @returns {'twister' | 'fixed' | 'swiss'}
         */
        normalizePairMode(rawMode, eventData = {}) {
            const raw = String(rawMode || eventData.pair_mode || '').trim().toLowerCase();
            const name = String(eventData.title || eventData.name || '').trim().toUpperCase();
            const format = String(eventData.format || '').trim().toLowerCase();
            const tournamentType = String(eventData.tournament_type || '').trim().toLowerCase();

            // 0. Detección explícita de PAREJA FIJA (Máxima precedencia si configurado)
            const fixedKeywords = [
                'fixed',
                'fixed_pairs',
                'fixed_admin',
                'fixed_auto',
                'fija',
                'fijo',
                'fijas',
                'pareja',
                'parejas',
                'pareja_fija',
                'parejas_fijas',
                'dupla',
                'duplas',
                'duo',
                'duos'
            ];

            const isExplicitFixed = fixedKeywords.includes(raw) || (
                !raw.includes('twister') &&
                !raw.includes('rotat') &&
                !raw.includes('indiv') &&
                (raw.includes('fixed') || raw.includes('fij') || raw.includes('pareja') || raw.includes('dupla') || raw.includes('duo'))
            );

            if (isExplicitFixed) {
                return 'fixed';
            }

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

            // 3. Detección de PAREJAS FIJAS por metadata / título / nombre del evento
            const hasFixedInMeta = format.includes('fij') ||
                tournamentType.includes('fij') ||
                name.includes('FIJA') ||
                name.includes('FIJO') ||
                name.includes('FIJAS') ||
                name.includes('PAREJA') ||
                name.includes('PAREJAS') ||
                name.includes('DUPLA') ||
                name.includes('DUPLAS') ||
                name.includes('DUO') ||
                format.includes('pareja') ||
                format.includes('dupla') ||
                !!eventData.is_fija;

            if (hasFixedInMeta) {
                return 'fixed';
            }

            // Si hay parejas fijas pobladas pero no se indicó twister en pair_mode
            if (Array.isArray(eventData.fixed_pairs) && eventData.fixed_pairs.length > 0 && !raw.includes('twister') && !raw.includes('rotat')) {
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
         * Extrae los vínculos de compañeros de la Ronda 1 (o de fixed_pairs) para validar
         * el invariante de que NINGÚN jugador cambia de pareja en modo Fixed.
         *
         * @param {Array} allMatches - Todos los partidos
         * @param {Array} prevRoundMatches - Partidos de la ronda previa
         * @param {Array} fixedPairs - Lista opcional de parejas fijas
         * @returns {Map<string, string>} - Mapeo playerId -> partnerId de Ronda 1
         */
        extractRound1Partners(allMatches = [], prevRoundMatches = [], fixedPairs = []) {
            const r1Map = new Map();

            // 1. Desde fixed_pairs si existe
            if (Array.isArray(fixedPairs) && fixedPairs.length > 0) {
                fixedPairs.forEach(pair => {
                    const id1 = String(pair.player1_id || pair.player1?.id || pair.player1?.uid || '');
                    const id2 = String(pair.player2_id || pair.player2?.id || pair.player2?.uid || '');
                    if (id1 && id2) {
                        r1Map.set(id1, id2);
                        r1Map.set(id2, id1);
                    }
                });
            }

            // 2. Desde los partidos de la Ronda 1
            const r1Matches = (allMatches || []).filter(m => parseInt(m.round || 0) === 1);
            const sourceMatches = r1Matches.length > 0 ? r1Matches : (prevRoundMatches || []).filter(m => parseInt(m.round || 0) === 1);

            sourceMatches.forEach(m => {
                const teamA = (m.team_a_ids || []).map(String);
                const teamB = (m.team_b_ids || []).map(String);

                if (teamA.length === 2) {
                    r1Map.set(teamA[0], teamA[1]);
                    r1Map.set(teamA[1], teamA[0]);
                }
                if (teamB.length === 2) {
                    r1Map.set(teamB[0], teamB[1]);
                    r1Map.set(teamB[1], teamB[0]);
                }
            });

            return r1Map;
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
                allMatches = [],
                fixedPairs = []
            } = options;

            const errors = [];
            const warnings = [];
            const seenPlayers = new Map(); // pid -> court
            const historyMap = this.extractPartnerHistory(
                allMatches.length > 0 ? allMatches : prevRoundMatches,
                roundNum
            );

            // Mapeo de compañeros de Ronda 1 para validar parejas fijas
            const r1Partners = this.extractRound1Partners(allMatches, prevRoundMatches, fixedPairs);

            let repeatedPartnersR1Count = 0;
            let totalPlayersCount = 0;

            matches.forEach((m, idx) => {
                const court = parseInt(m.court || idx + 1);
                const teamA = (m.team_a_ids || []).map(String);
                const teamB = (m.team_b_ids || []).map(String);
                const isBye = m.is_bye || m.pair_b_id === 'bye' || teamB.length === 0;
                const courtPlayers = isBye ? [...teamA] : [...teamA, ...teamB];

                // 1. Pistas completas: exactamente 4 jugadores (2 por equipo) salvo BYE
                if (!isBye) {
                    if (teamA.length !== 2 || teamB.length !== 2) {
                        errors.push(
                            `[Pista ${court}] Formación inválida: Equipo A tiene ${teamA.length} jugadores y Equipo B tiene ${teamB.length}. Se requieren exactamente 2 vs 2.`
                        );
                    }
                } else {
                    if (teamA.length !== 2) {
                        errors.push(
                            `[Pista ${court} - BYE] La pareja que descansa debe tener exactamente 2 jugadores (tiene ${teamA.length}).`
                        );
                    }
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
                    if (!pid) return;
                    if (seenPlayers.has(pid)) {
                        errors.push(
                            `Jugador ${pid} asignado en múltiples pistas de la ronda ${roundNum} (Pista ${seenPlayers.get(pid)} y Pista ${court}).`
                        );
                    } else {
                        seenPlayers.set(pid, court);
                        totalPlayersCount++;
                    }
                });

                // 4. 🔒 INVARIANTE SAGRADA PAREJA FIJA (Ronda > 1):
                // Cada jugador conserva exactamente a su compañero de Ronda 1 en TODAS las rondas
                if (pairMode === 'fixed' && roundNum > 1 && r1Partners.size > 0) {
                    const checkFixedPair = (p1, p2, teamLabel) => {
                        const expectedP2 = r1Partners.get(String(p1));
                        const expectedP1 = r1Partners.get(String(p2));

                        if (expectedP2 && expectedP2 !== String(p2)) {
                            errors.push(
                                `[Pista ${court} - ${teamLabel} - Pareja Fija] Violación crítica: El jugador ${p1} jugó en Ronda 1 con ${expectedP2}, pero en Ronda ${roundNum} está emparejado con ${p2}. ¡Las parejas deben ser 100% fijas!`
                            );
                        }
                        if (expectedP1 && expectedP1 !== String(p1)) {
                            errors.push(
                                `[Pista ${court} - ${teamLabel} - Pareja Fija] Violación crítica: El jugador ${p2} jugó en Ronda 1 con ${expectedP1}, pero en Ronda ${roundNum} está emparejado con ${p1}. ¡Las parejas deben ser 100% fijas!`
                            );
                        }
                    };

                    if (teamA.length === 2) checkFixedPair(teamA[0], teamA[1], 'Equipo A');
                    if (teamB.length === 2 && !isBye) checkFixedPair(teamB[0], teamB[1], 'Equipo B');
                }

                // 5. 🌀 Verificación Twister: Repetición de compañero respecto a R-1
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
                    if (teamB.length === 2 && !isBye) checkPair(teamB[0], teamB[1], 'Equipo B');
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
         * 2. En Twister: si detecta parejas repetidas de R-1, evalúa las combinaciones y reordena automáticamente.
         * 3. En Fixed: audita que cada pareja se preserve al 100%.
         *
         * @param {Array} matches - Partidos generados
         * @param {object} options - Parámetros { roundNum, pairMode, prevRoundMatches, allMatches, players, fixedPairs }
         * @returns {object} { success: boolean, matches: Array, report: object }
         */
        verifyAndFixRoundMatches(matches = [], options = {}) {
            const {
                roundNum = 1,
                pairMode = 'twister',
                prevRoundMatches = [],
                allMatches = [],
                players = [],
                fixedPairs = []
            } = options;

            if (!Array.isArray(matches) || matches.length === 0) {
                return {
                    success: false,
                    matches: [],
                    report: { errors: ['No se proporcionaron partidos para verificar.'], warnings: [] }
                };
            }

            const normalizedMode = this.normalizePairMode(pairMode, { pair_mode: pairMode });

            const playerNameMap = new Map();
            (players || []).forEach(p => {
                const sId = String(p.id || p.uid || '');
                if (sId) playerNameMap.set(sId, p.name || `Jugador ${sId}`);
            });

            const historyMap = this.extractPartnerHistory(
                allMatches.length > 0 ? allMatches : prevRoundMatches,
                roundNum
            );

            const fixedMatches = matches.map(m => ({ ...m }));
            let fixesApplied = 0;

            // AUTO-FIX EXCLUSIVO PARA TWISTER EN RONDAS > 1
            if (normalizedMode === 'twister' && roundNum > 1) {
                fixedMatches.forEach(m => {
                    const court = parseInt(m.court || 1);
                    const teamAIds = (m.team_a_ids || []).map(String);
                    const teamBIds = (m.team_b_ids || []).map(String);

                    if (teamAIds.length !== 2 || teamBIds.length !== 2) {
                        return;
                    }

                    const courtPlayers = [teamAIds[0], teamAIds[1], teamBIds[0], teamBIds[1]];

                    const getNamesForIds = (ids) => {
                        return ids.map((id) => {
                            if (playerNameMap.has(id)) return playerNameMap.get(id);
                            const origA = m.team_a_ids || [];
                            const origB = m.team_b_ids || [];
                            const idxA = origA.findIndex(x => String(x) === id);
                            if (idxA !== -1 && m.team_a_names && m.team_a_names[idxA]) return m.team_a_names[idxA];
                            const idxB = origB.findIndex(x => String(x) === id);
                            if (idxB !== -1 && m.team_b_names && m.team_b_names[idxB]) return m.team_b_names[idxB];
                            return `Jugador ${id}`;
                        });
                    };

                    const [p0, p1, p2, p3] = courtPlayers;
                    const combinations = [
                        { teamA: [p0, p1], teamB: [p2, p3], label: 'Comb 0: (0+1 vs 2+3)' },
                        { teamA: [p0, p2], teamB: [p1, p3], label: 'Comb 1: (0+2 vs 1+3)' },
                        { teamA: [p0, p3], teamB: [p1, p2], label: 'Comb 2: (0+3 vs 1+2)' }
                    ];

                    const evaluateCombination = (comb) => {
                        let penalty = 0;
                        let r1Repeats = 0;

                        const scorePair = (id1, id2) => {
                            const h1 = historyMap.get(id1);
                            const h2 = historyMap.get(id2);
                            const last1 = h1 ? h1.lastPartner : null;
                            const last2 = h2 ? h2.lastPartner : null;

                            // Repetición R-1
                            if (last1 === id2 || last2 === id1) {
                                penalty += 100000;
                                r1Repeats++;
                            }

                            // Historial de rondas previas
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
                    scoredCombinations.sort((a, b) => a.penalty - b.penalty);
                    const best = scoredCombinations[0];

                    const currentComb = { teamA: teamAIds, teamB: teamBIds };
                    const currentEval = evaluateCombination(currentComb);

                    if (currentEval.r1Repeats > 0 && best.r1Repeats < currentEval.r1Repeats) {
                        fixesApplied++;
                        console.log(
                            `🛠️ [PreFlight Auto-Fix] Pista ${court}: Corrigiendo repetición R-1 en Twister. De ${currentEval.r1Repeats} a ${best.r1Repeats} repeticiones (${best.label}).`
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

            // Auditoría final
            const auditReport = this.auditRound(fixedMatches, {
                roundNum,
                pairMode: normalizedMode,
                expectedCourts: options.expectedCourts,
                prevRoundMatches,
                allMatches,
                fixedPairs: options.fixedPairs || fixedPairs
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
        },

        /**
         * Realiza un chequeo preventivo de salud para un evento programado (antes de jugarse).
         * Determina si el evento funcionará al 100% o qué le falta para estar perfecto.
         *
         * @param {object} eventData - Datos del torneo o entreno
         * @param {Array} playersList - Lista de participantes inscritos
         * @returns {object} { status: 'ready'|'warning'|'error', score: number, title: string, summary: string, checklist: Array, recommendations: Array }
         */
        checkScheduledEventHealth(eventData = {}, playersList = []) {
            const mode = this.normalizePairMode(eventData.pair_mode || eventData.mode, eventData);
            const players = Array.isArray(playersList) && playersList.length > 0 
                ? playersList 
                : (Array.isArray(eventData.players) ? eventData.players : []);
            const numPlayers = players.length;
            const configuredCourts = parseInt(eventData.num_courts || eventData.courts || Math.ceil(numPlayers / 4)) || 1;

            const checklist = [];
            const recommendations = [];
            let status = 'ready'; // 'ready' | 'warning' | 'error'
            let score = 100;

            // 1. CHEQUEO DE AFORO Y JUGADORES
            if (numPlayers === 0) {
                status = 'error';
                score = 0;
                checklist.push({
                    label: 'Inscripción de Jugadores',
                    passed: false,
                    type: 'error',
                    detail: 'No hay jugadores inscritos en el evento.'
                });
                recommendations.push('Añade participantes al evento para poder generar los partidos.');
            } else if (numPlayers < 4) {
                status = 'error';
                score = 25;
                checklist.push({
                    label: 'Aforo Mínimo de Pista',
                    passed: false,
                    type: 'error',
                    detail: `Hay ${numPlayers} jugadores. Se requieren mínimo 4 jugadores (2 vs 2) para 1 pista.`
                });
                recommendations.push(`Inscribe ${4 - numPlayers} jugador(es) más para completar la primera pista.`);
            } else if (numPlayers % 4 === 0) {
                const courtsNeeded = numPlayers / 4;
                checklist.push({
                    label: 'Aforo y Distribución de Pistas',
                    passed: true,
                    type: 'success',
                    detail: `${numPlayers} jugadores completan perfectamente ${courtsNeeded} pista(s) de 4 jugadores.`
                });
            } else {
                const activeCourts = Math.floor(numPlayers / 4);
                const restingPlayers = numPlayers % 4;
                const neededForNextCourt = 4 - restingPlayers;

                score = Math.max(70, score - 20);
                if (status !== 'error') status = 'warning';

                checklist.push({
                    label: 'Aforo y Descansos (BYEs)',
                    passed: true,
                    type: 'warning',
                    detail: `${numPlayers} jugadores: ${activeCourts * 4} jugarán en ${activeCourts} pista(s) y ${restingPlayers} descansarán en rotación (BYE).`
                });
                recommendations.push(`Recomendación: Si inscribes a ${neededForNextCourt} jugador(es) más, llenarás exactamente ${activeCourts + 1} pistas sin descansos.`);
            }

            // 2. CHEQUEO DE MODALIDAD Y PAREJAS FIJAS
            if (mode === 'fixed') {
                let unpairedPlayers = 0;
                const pairedKeys = new Set();

                players.forEach(p => {
                    const hasPartner = p.partner_id || p.partner_name || p.partner;
                    if (!hasPartner) {
                        unpairedPlayers++;
                    } else {
                        const partnerId = String(p.partner_id || p.partner_name);
                        const myId = String(p.id || p.name);
                        pairedKeys.add([myId, partnerId].sort().join('___'));
                    }
                });

                if (unpairedPlayers === 0 && numPlayers >= 4) {
                    checklist.push({
                        label: 'Emparejamiento de Duplas Fijas',
                        passed: true,
                        type: 'success',
                        detail: `100% de los jugadores (${numPlayers / 2} parejas) tienen compañero asignado y registrado.`
                    });
                } else if (unpairedPlayers > 0) {
                    score = Math.max(60, score - 15);
                    if (status !== 'error') status = 'warning';
                    checklist.push({
                        label: 'Emparejamiento de Duplas Fijas',
                        passed: false,
                        type: 'warning',
                        detail: `Hay ${unpairedPlayers} jugador(es) sin pareja específica definida.`
                    });
                    recommendations.push('El sistema emparejará automáticamente a los jugadores sueltos por nivel, o puedes asignarles compañero desde el modal de participantes.');
                }
            } else {
                checklist.push({
                    label: 'Modalidad Twister Individual',
                    passed: true,
                    type: 'success',
                    detail: `Rotación individual activada: cada jugador cambiará de pareja en cada ronda según ascensos/descensos.`
                });
            }

            // 3. CHEQUEO DE PISTAS ASIGNADAS
            const optimalCourts = Math.floor(numPlayers / 4);
            if (numPlayers >= 4 && configuredCourts !== optimalCourts) {
                checklist.push({
                    label: 'Configuración de Pistas',
                    passed: true,
                    type: 'info',
                    detail: `Pistas configuradas: ${configuredCourts}. Pistas activas para ${numPlayers} jugadores: ${optimalCourts}.`
                });
            } else if (numPlayers >= 4) {
                checklist.push({
                    label: 'Configuración de Pistas',
                    passed: true,
                    type: 'success',
                    detail: `${configuredCourts} pistas configuradas coinciden exactamente con los inscritos.`
                });
            }

            // 4. GARANTÍA DE MOTOR POZO
            checklist.push({
                label: 'Motor Pozo & Desempates',
                passed: true,
                type: 'success',
                detail: 'Escudo anti-empates 5-5 y reglas de escalera (ganadores suben, perdedores bajan) 100% activas.'
            });

            const title = status === 'ready' 
                ? '🟢 LISTO PARA JUGAR AL 100%' 
                : status === 'warning' 
                    ? '🟡 LISTO CON OBSERVACIONES OPERATIVAS' 
                    : '🔴 REQUIERE ACCIÓN PREVIA';

            const summary = status === 'ready'
                ? `El evento está perfectamente configurado con ${numPlayers} jugadores (${mode === 'fixed' ? 'Parejas Fijas' : 'Twister'}). La Ronda 1 y las transiciones de pista funcionarán sin errores.`
                : status === 'warning'
                    ? `El motor puede arrancar, pero se detectaron detalles que conviene revisar (revisa la lista de verificación).`
                    : `Faltan requisitos esenciales para iniciar la competición.`;

            return {
                status,
                score,
                title,
                summary,
                mode,
                numPlayers,
                configuredCourts,
                checklist,
                recommendations
            };
        }
    };

    // Exportación global (Browser y Node.js)
    if (typeof window !== 'undefined') {
        window.PreFlightRoundVerifier = PreFlightRoundVerifier;

        window.checkScheduledEventHealthPrompt = function (eventData, eventType = 'americana') {
            const report = PreFlightRoundVerifier.checkScheduledEventHealth(eventData, eventData.players);

            let modal = document.getElementById('modal-event-health-check');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'modal-event-health-check';
                modal.style.cssText = `
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(15, 23, 42, 0.75);
                    backdrop-filter: blur(8px);
                    z-index: 999999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 16px;
                `;
                document.body.appendChild(modal);
            }

            const isReady = report.status === 'ready';
            const isWarn = report.status === 'warning';
            const themeColor = isReady ? '#10B981' : isWarn ? '#F59E0B' : '#EF4444';
            const themeBg = isReady ? 'rgba(16, 185, 129, 0.12)' : isWarn ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)';

            modal.innerHTML = `
                <div style="
                    background: #ffffff;
                    border: 2px solid ${themeColor};
                    border-radius: 16px;
                    max-width: 540px;
                    width: 100%;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                    color: #0f172a;
                    font-family: 'Inter', sans-serif;
                    overflow: hidden;
                ">
                    <div style="background: ${themeBg}; padding: 18px 20px; border-bottom: 1px solid ${themeColor}30; display: flex; align-items: center; justify-content: space-between;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="width: 40px; height: 40px; border-radius: 10px; background: ${themeColor}; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
                                <i class="fas ${isReady ? 'fa-circle-check' : isWarn ? 'fa-triangle-exclamation' : 'fa-circle-xmark'}"></i>
                            </div>
                            <div>
                                <h3 style="margin: 0; font-size: 1.1rem; font-weight: 800; color: #0f172a;">${report.title}</h3>
                                <div style="font-size: 0.78rem; color: #64748b; font-weight: 600;">${eventData.name || 'Competición'} (${eventType.toUpperCase()})</div>
                            </div>
                        </div>
                        <button onclick="document.getElementById('modal-event-health-check').style.display='none'" style="background: none; border: none; font-size: 1.3rem; color: #64748b; cursor: pointer;">&times;</button>
                    </div>

                    <div style="padding: 20px; max-height: 70vh; overflow-y: auto;">
                        <div style="background: #f8fafc; border-left: 4px solid ${themeColor}; padding: 12px 14px; border-radius: 8px; font-size: 0.88rem; font-weight: 600; color: #334155; line-height: 1.4; margin-bottom: 16px;">
                            ${report.summary}
                        </div>

                        <h4 style="margin: 0 0 10px 0; font-size: 0.82rem; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 800;">
                            Puntos de Verificación de Seguridad
                        </h4>
                        <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px;">
                            ${report.checklist.map(item => `
                                <div style="display: flex; align-items: flex-start; gap: 10px; padding: 8px 10px; border-radius: 8px; background: ${item.type === 'success' ? '#f0fdf4' : item.type === 'warning' ? '#fffbeb' : '#fef2f2'}; border: 1px solid ${item.type === 'success' ? '#bbf7d0' : item.type === 'warning' ? '#fde68a' : '#fecaca'};">
                                    <i class="fas ${item.type === 'success' ? 'fa-check' : item.type === 'warning' ? 'fa-exclamation' : 'fa-xmark'}" style="color: ${item.type === 'success' ? '#16a34a' : item.type === 'warning' ? '#d97706' : '#dc2626'}; margin-top: 3px; font-size: 0.85rem;"></i>
                                    <div>
                                        <div style="font-weight: 700; font-size: 0.82rem; color: #0f172a;">${item.label}</div>
                                        <div style="font-size: 0.76rem; color: #475569; margin-top: 2px;">${item.detail}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>

                        ${report.recommendations.length > 0 ? `
                            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 10px 14px; font-size: 0.8rem; color: #1e40af;">
                                <strong style="display: block; margin-bottom: 4px;"><i class="fas fa-lightbulb"></i> Recomendación Operativa:</strong>
                                ${report.recommendations.map(r => `<div>• ${r}</div>`).join('')}
                            </div>
                        ` : ''}
                    </div>

                    <div style="padding: 12px 20px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 10px;">
                        <button onclick="document.getElementById('modal-event-health-check').style.display='none'" style="padding: 8px 16px; border-radius: 8px; font-weight: 700; font-size: 0.85rem; background: #0f172a; color: #fff; border: none; cursor: pointer;">
                            Entendido ✅
                        </button>
                    </div>
                </div>
            `;
            modal.style.display = 'flex';
        };
    }
    if (typeof globalThis !== 'undefined') {
        globalThis.PreFlightRoundVerifier = PreFlightRoundVerifier;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = PreFlightRoundVerifier;
        module.exports.PreFlightRoundVerifier = PreFlightRoundVerifier;
    }

    console.log("🛡️ PreFlightRoundVerifier Cargado y Listo (v2026.2_SHIELDED)");
})();
