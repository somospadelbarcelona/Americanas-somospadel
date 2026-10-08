/**
 * TournamentSolver.js
 * Solucionador CSP (Constraint Satisfaction Problem) con Backtracking, Poda (Forward Checking / MRV)
 * y Branch & Bound para la generación matemáticamente óptima de rondas de pádel.
 *
 * Compatible con Node.js y navegadores.
 */

(function () {
    'use strict';

    let ConstraintsModule;
    let LoggerModule;

    if (typeof require !== 'undefined') {
        try {
            ConstraintsModule = require('./TournamentConstraints');
            LoggerModule = require('./DecisionLogger');
        } catch (e) { }
    }

    const TournamentConstraints = ConstraintsModule?.TournamentConstraints ||
        (typeof window !== 'undefined' ? window.TournamentConstraints : null);
    const DecisionLogger = LoggerModule?.DecisionLogger ||
        (typeof window !== 'undefined' ? window.DecisionLogger : null);

    class TournamentSolver {
        constructor(options = {}) {
            this.constraints = options.constraints || new TournamentConstraints();
            this.logger = options.logger || new DecisionLogger({ level: 3 });
        }

        // ==========================================
        // 1. SELECCIÓN DE DESCANSOS (BYES)
        // ==========================================

        /**
         * Selecciona matemáticamente los B jugadores que deben descansar en esta ronda.
         * Minimiza la varianza de descansos y garantiza que nadie descanse 2 veces consecutivas
         * si matemáticamente es evitable.
         *
         * @param {Array<object>} allPlayers 
         * @param {number} byesCount 
         * @param {object} history 
         * @returns {{ activePlayers: Array<object>, restingPlayers: Array<object> }}
         */
        selectByes(allPlayers, byesCount, history = {}) {
            if (byesCount <= 0 || allPlayers.length <= byesCount) {
                return { activePlayers: [...allPlayers], restingPlayers: [] };
            }

            const byeHistory = history.byeHistory || {};
            const lastRoundByes = new Set((history.lastRoundByes || []).map(p => String(p.id || p.uid || p)));
            const matchCount = history.matchCount || {};

            this.logger.logDecision('BYE_SELECTION_START', {
                totalPlayers: allPlayers.length,
                byesCount,
                lastRoundByes: Array.from(lastRoundByes)
            });

            // Puntuación de elegibilidad para descansar: menor score = mayor prioridad para descansar
            const scoredCandidates = allPlayers.map(p => {
                const pid = String(p.id || p.uid);
                const restsSoFar = byeHistory[pid] || 0;
                const restedLastRound = lastRoundByes.has(pid);
                const matches = matchCount[pid] || 0;

                // Penalización enorme si descansó en la ronda previa (evitar descanso consecutivo)
                let score = restsSoFar * 1000 + (restedLastRound ? 500000 : 0) - (matches * 10);

                return { player: p, score, restsSoFar, restedLastRound };
            });

            // Ordenar de menor a mayor score: quienes menos han descansado y no descansaron en R-1 van primero
            scoredCandidates.sort((a, b) => a.score - b.score);

            const restingPlayers = scoredCandidates.slice(0, byesCount).map(c => c.player);
            const restingIds = new Set(restingPlayers.map(p => String(p.id || p.uid)));
            const activePlayers = allPlayers.filter(p => !restingIds.has(String(p.id || p.uid)));

            this.logger.logDecision('BYE_SELECTION_COMPLETE', {
                resting: restingPlayers.map(p => ({ id: p.id || p.uid, name: p.name })),
                activeCount: activePlayers.length
            });

            return { activePlayers, restingPlayers };
        }

        // ==========================================
        // 2. RESOLUCIÓN DE PISTAS BLOQUEADAS (POZO / REY DE LA PISTA)
        // ==========================================

        /**
         * Resuelve partidos en modos donde los 4 jugadores ya están determinados para cada pista
         * (ej. ascensos/descensos en Pozo o King of the Court o Entreno por Niveles).
         */
        solveCourtLocked(playersByCourt, history = {}, options = {}) {
            const matches = [];
            const roundNum = options.roundNum || 1;

            const courtKeys = Object.keys(playersByCourt).map(Number).sort((a, b) => a - b);

            for (const courtNum of courtKeys) {
                const courtPlayers = playersByCourt[courtNum];
                if (!courtPlayers || courtPlayers.length < 4) {
                    continue;
                }

                const [p0, p1, p2, p3] = courtPlayers;
                const configurations = [
                    { teamA: [p0, p1], teamB: [p2, p3] },
                    { teamA: [p0, p2], teamB: [p1, p3] },
                    { teamA: [p0, p3], teamB: [p1, p2] }
                ];

                let bestConfig = null;
                let bestScore = -Infinity;

                for (let i = 0; i < configurations.length; i++) {
                    const cfg = configurations[i];

                    // Evaluación de partido
                    const evalResult = this.constraints.evaluateMatch(
                        cfg.teamA,
                        cfg.teamB,
                        courtNum,
                        history,
                        options
                    );

                    this.logger.logScore(`Pista ${courtNum} Conf ${i + 1}`, evalResult.score, evalResult.breakdown);

                    if (evalResult.score === -Infinity) {
                        this.logger.logPrune(`Hard constraint violada en Pista ${courtNum}`, {
                            court: courtNum,
                            configIndex: i,
                            breakdown: evalResult.breakdown
                        });
                        continue;
                    }

                    if (evalResult.score > bestScore) {
                        bestScore = evalResult.score;
                        bestConfig = cfg;
                    }
                }

                // Si todas las configuraciones violan hard constraints (ej. saturación total):
                if (!bestConfig) {
                    this.logger.logViolation('ALL_LOCKED_CONFIGS_VIOLATE_HARD', { courtNum }, 100000);
                    // Relajamos temporalmente hardNoRepeatPartner para salvar la ronda
                    const relaxedOptions = { ...options, hardNoRepeatPartner: false };
                    let fallbackScore = -Infinity;
                    for (const cfg of configurations) {
                        const res = this.constraints.evaluateMatch(cfg.teamA, cfg.teamB, courtNum, history, relaxedOptions);
                        if (res.score > fallbackScore || !bestConfig) {
                            fallbackScore = res.score;
                            bestConfig = cfg;
                        }
                    }
                }

                if (!bestConfig && configurations.length > 0) {
                    bestConfig = configurations[0];
                }

                matches.push({
                    round: roundNum,
                    court: courtNum,
                    team_a_ids: bestConfig.teamA.map(p => String(p.id || p.uid)),
                    team_b_ids: bestConfig.teamB.map(p => String(p.id || p.uid)),
                    team_a_names: bestConfig.teamA.map(p => p.name || `P_${p.id}`),
                    team_b_names: bestConfig.teamB.map(p => p.name || `P_${p.id}`),
                    team_a_players: bestConfig.teamA,
                    team_b_players: bestConfig.teamB,
                    status: 'scheduled',
                    score_a: 0,
                    score_b: 0
                });
            }

            return matches;
        }

        // ==========================================
        // 3. RESOLUCIÓN GENERAL CSP (AMERICANA CLÁSICA / MIXTA / MEXICANA)
        // ==========================================

        /**
         * Resuelve el emparejamiento global óptimo para un conjunto de jugadores activos
         * utilizando CSP con Backtracking, MRV y Branch & Bound.
         *
         * @param {Array<object>} activePlayers - Exactamente 4 * courtsCount jugadores
         * @param {number} courtsCount 
         * @param {object} history 
         * @param {object} options 
         * @returns {Array<object>} matches generados
         */
        solveGlobal(activePlayers, courtsCount, history = {}, options = {}) {
            const isMixed = !!options.isMixed;
            const hardNoRepeat = options.hardNoRepeatPartner !== false;
            const roundNum = options.roundNum || 1;

            this.logger.logDecision('CSP_GLOBAL_START', {
                activeCount: activePlayers.length,
                courtsCount,
                isMixed,
                hardNoRepeat,
                roundNum
            });

            if (isMixed) {
                return this._solveMixedGlobal(activePlayers, courtsCount, history, options);
            }

            return this._solveOpenGlobal(activePlayers, courtsCount, history, options);
        }

        /**
         * Resuelve CSP para Americana Abierta / Clásica / Mexicana / Entrenos
         */
        _solveOpenGlobal(activePlayers, courtsCount, history, options) {
            const roundNum = options.roundNum || 1;
            const targetPairsCount = courtsCount * 2;

            // 1. Obtener pares candidatos compatibles
            // Formulación de Grafo: V = Jugadores activos, E = Pares compatibles
            // Cada arista (u, v) tiene un costo de penalización.
            const n = activePlayers.length;
            const players = [...activePlayers];

            // Ordenamiento MRV: Priorizar jugadores con más historial de parejas acumulado (más constreñidos)
            const partnerHistory = history.partnerHistory || {};
            players.sort((a, b) => {
                const lenA = (partnerHistory[String(a.id || a.uid)] || []).length;
                const lenB = (partnerHistory[String(b.id || b.uid)] || []).length;
                return lenB - lenA;
            });

            // Backtracking Branch & Bound para formar parejas óptimas
            let bestPairsSet = null;
            let minTotalPairPenalty = Infinity;

            const findPairs = (remainingPlayers, currentPairs, currentPenalty) => {
                if (currentPenalty >= minTotalPairPenalty) {
                    this.logger.logPrune('BRANCH_BOUND_PAIR_PENALTY_EXCEEDED', { currentPenalty, minTotalPairPenalty });
                    return;
                }

                if (remainingPlayers.length === 0) {
                    if (currentPairs.length === targetPairsCount) {
                        if (currentPenalty < minTotalPairPenalty) {
                            minTotalPairPenalty = currentPenalty;
                            bestPairsSet = [...currentPairs];
                            this.logger.logDecision('NEW_BEST_PAIR_SET_FOUND', { penalty: currentPenalty });
                        }
                    }
                    return;
                }

                // MRV: Tomar el primer jugador disponible (el más constreñido)
                const p1 = remainingPlayers[0];
                const rest = remainingPlayers.slice(1);

                // Candidatos para ser pareja de p1
                const candidates = [];
                for (let i = 0; i < rest.length; i++) {
                    const p2 = rest[i];
                    const p1Id = String(p1.id || p1.uid);
                    const p2Id = String(p2.id || p2.uid);

                    const penalty = this.constraints.getPairPenalty(p1, p2, history, options);
                    if (penalty !== Infinity) {
                        candidates.push({ partner: p2, index: i, penalty });
                    }
                }

                // Si no hay candidatos por hard constraint, podar rama
                if (candidates.length === 0) {
                    this.logger.logPrune('NO_COMPATIBLE_PARTNERS_LEFT', { player: p1.id || p1.uid });
                    return;
                }

                // Ordenar candidatos por menor penalización (Greedy First)
                candidates.sort((a, b) => a.penalty - b.penalty);

                for (const cand of candidates) {
                    const nextRemaining = rest.filter((_, idx) => idx !== cand.index);
                    currentPairs.push({ p1, p2: cand.partner, penalty: cand.penalty });

                    findPairs(nextRemaining, currentPairs, currentPenalty + cand.penalty);

                    currentPairs.pop();
                }
            };

            // Ejecutar búsqueda estricta
            findPairs(players, [], 0);

            // Si falla la búsqueda estricta (ej. saturación matemática en rondas avanzadas):
            if (!bestPairsSet) {
                this.logger.logViolation('CSP_STRICT_PAIRS_FAILED_RELAXING', {}, 50000);
                const relaxedOptions = { ...options, hardNoRepeatPartner: false };
                minTotalPairPenalty = Infinity;

                // Segunda pasada con penalizaciones suaves
                const findPairsRelaxed = (remainingPlayers, currentPairs, currentPenalty) => {
                    if (currentPenalty >= minTotalPairPenalty) return;
                    if (remainingPlayers.length === 0) {
                        if (currentPairs.length === targetPairsCount && currentPenalty < minTotalPairPenalty) {
                            minTotalPairPenalty = currentPenalty;
                            bestPairsSet = [...currentPairs];
                        }
                        return;
                    }
                    const p1 = remainingPlayers[0];
                    const rest = remainingPlayers.slice(1);
                    const candidates = rest.map((p2, idx) => ({
                        partner: p2,
                        index: idx,
                        penalty: this.constraints.getPairPenalty(p1, p2, history, relaxedOptions)
                    }));
                    candidates.sort((a, b) => a.penalty - b.penalty);

                    for (const cand of candidates) {
                        const nextRemaining = rest.filter((_, idx) => idx !== cand.index);
                        currentPairs.push({ p1, p2: cand.partner, penalty: cand.penalty });
                        findPairsRelaxed(nextRemaining, currentPairs, currentPenalty + cand.penalty);
                        currentPairs.pop();
                    }
                };

                findPairsRelaxed(players, [], 0);
            }

            // Fallback absoluto de seguridad por si acaso
            if (!bestPairsSet) {
                bestPairsSet = [];
                for (let i = 0; i < players.length; i += 2) {
                    bestPairsSet.push({ p1: players[i], p2: players[i + 1], penalty: 0 });
                }
            }

            // 2. Asignar parejas a partidos y pistas
            return this._matchPairsToCourts(bestPairsSet, courtsCount, history, options);
        }

        /**
         * Resuelve CSP para Americana Mixta (Bipartite Matching entre Hombres y Mujeres)
         */
        _solveMixedGlobal(activePlayers, courtsCount, history, options) {
            const roundNum = options.roundNum || 1;
            const targetPairsCount = courtsCount * 2;

            const getGender = (p) => {
                const g = String(p.gender || p.sex || '').trim().toLowerCase();
                if (g.startsWith('m') || g === 'hombre' || g === 'masculino' || g === 'chico') return 'M';
                if (g.startsWith('f') || g === 'mujer' || g === 'femenino' || g === 'chica') return 'F';
                return 'UNKNOWN';
            };

            const men = activePlayers.filter(p => getGender(p) === 'M');
            const women = activePlayers.filter(p => getGender(p) === 'F');

            // Si por algún motivo no hay metadatos claros de género en la mitad, tratar genéricamente
            if (men.length < targetPairsCount || women.length < targetPairsCount) {
                this.logger.logViolation('MIXED_GENDER_DATA_IMBALANCE', { men: men.length, women: women.length }, 1000);
                return this._solveOpenGlobal(activePlayers, courtsCount, history, options);
            }

            const activeMen = men.slice(0, targetPairsCount);
            const activeWomen = women.slice(0, targetPairsCount);

            // Bipartite Matching: Cada hombre se empareja con una mujer
            let bestPairsSet = null;
            let minPenalty = Infinity;

            const solveBipartite = (manIndex, remainingWomen, currentPairs, currentPenalty) => {
                if (currentPenalty >= minPenalty) return;

                if (manIndex === activeMen.length) {
                    if (currentPenalty < minPenalty) {
                        minPenalty = currentPenalty;
                        bestPairsSet = [...currentPairs];
                    }
                    return;
                }

                const man = activeMen[manIndex];
                const manId = String(man.id || man.uid);

                const candidates = [];
                for (let i = 0; i < remainingWomen.length; i++) {
                    const woman = remainingWomen[i];
                    const womanId = String(woman.id || woman.uid);
                    const pen = this.constraints.getPartnerPenalty(manId, womanId, history, options.hardNoRepeatPartner);
                    if (pen !== Infinity) {
                        candidates.push({ woman, index: i, penalty: pen });
                    }
                }

                if (candidates.length === 0) return;
                candidates.sort((a, b) => a.penalty - b.penalty);

                for (const cand of candidates) {
                    const nextWomen = remainingWomen.filter((_, idx) => idx !== cand.index);
                    currentPairs.push({ p1: man, p2: cand.woman, penalty: cand.penalty });
                    solveBipartite(manIndex + 1, nextWomen, currentPairs, currentPenalty + cand.penalty);
                    currentPairs.pop();
                }
            };

            solveBipartite(0, activeWomen, [], 0);

            // Fallback con relajación de repetición si hubo saturación
            if (!bestPairsSet) {
                minPenalty = Infinity;
                const solveBipartiteRelaxed = (manIndex, remainingWomen, currentPairs, currentPenalty) => {
                    if (currentPenalty >= minPenalty) return;
                    if (manIndex === activeMen.length) {
                        if (currentPenalty < minPenalty) {
                            minPenalty = currentPenalty;
                            bestPairsSet = [...currentPairs];
                        }
                        return;
                    }
                    const man = activeMen[manIndex];
                    const manId = String(man.id || man.uid);
                    const candidates = remainingWomen.map((woman, idx) => ({
                        woman,
                        index: idx,
                        penalty: this.constraints.getPartnerPenalty(manId, String(woman.id || woman.uid), history, false)
                    }));
                    candidates.sort((a, b) => a.penalty - b.penalty);
                    for (const cand of candidates) {
                        const nextWomen = remainingWomen.filter((_, idx) => idx !== cand.index);
                        currentPairs.push({ p1: man, p2: cand.woman, penalty: cand.penalty });
                        solveBipartiteRelaxed(manIndex + 1, nextWomen, currentPairs, currentPenalty + cand.penalty);
                        currentPairs.pop();
                    }
                };
                solveBipartiteRelaxed(0, activeWomen, [], 0);
            }

            if (!bestPairsSet) {
                bestPairsSet = activeMen.map((m, idx) => ({ p1: m, p2: activeWomen[idx], penalty: 0 }));
            }

            return this._matchPairsToCourts(bestPairsSet, courtsCount, history, options);
        }

        /**
         * Asigna un conjunto de 2*C parejas a C pistas, optimizando rivales, pistas y nivel.
         */
        _matchPairsToCourts(pairsSet, courtsCount, history, options) {
            const roundNum = options.roundNum || 1;
            const matches = [];
            const remainingPairs = [...pairsSet];

            // Ordenar pistas 1 a courtsCount
            for (let c = 1; c <= courtsCount; c++) {
                if (remainingPairs.length < 2) break;

                // Seleccionar la mejor combinación de 2 parejas para la pista c
                let bestMatch = null;
                let bestMatchScore = -Infinity;
                let bestPairIndices = [0, 1];

                for (let i = 0; i < remainingPairs.length; i++) {
                    for (let j = i + 1; j < remainingPairs.length; j++) {
                        const pairA = remainingPairs[i];
                        const pairB = remainingPairs[j];

                        const teamA = [pairA.p1, pairA.p2];
                        const teamB = [pairB.p1, pairB.p2];

                        const evalRes = this.constraints.evaluateMatch(teamA, teamB, c, history, options);

                        if (evalRes.score > bestMatchScore) {
                            bestMatchScore = evalRes.score;
                            bestMatch = { teamA, teamB, court: c };
                            bestPairIndices = [i, j];
                        }
                    }
                }

                // Extraer las dos parejas seleccionadas
                const [idx1, idx2] = bestPairIndices.sort((a, b) => b - a);
                remainingPairs.splice(idx1, 1);
                remainingPairs.splice(idx2, 1);

                matches.push({
                    round: roundNum,
                    court: c,
                    team_a_ids: bestMatch.teamA.map(p => String(p.id || p.uid)),
                    team_b_ids: bestMatch.teamB.map(p => String(p.id || p.uid)),
                    team_a_names: bestMatch.teamA.map(p => p.name || `P_${p.id}`),
                    team_b_names: bestMatch.teamB.map(p => p.name || `P_${p.id}`),
                    team_a_players: bestMatch.teamA,
                    team_b_players: bestMatch.teamB,
                    status: 'scheduled',
                    score_a: 0,
                    score_b: 0
                });
            }

            return matches;
        }
    }

    // Exportación universal
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { TournamentSolver };
    }
    if (typeof window !== 'undefined') {
        window.TournamentSolver = TournamentSolver;
    }
})();
