/**
 * LevelService.js
 * MOTOR UNIFICADO Y CANÓNICO DE NIVELES SOMOSPÁDEL (SomosPadel TrueSkill / ELO Pro)
 * 
 * Unifica LevelService y LevelAdjustmentService en una única implementación sólida.
 * Expone tanto window.LevelService como window.LevelAdjustmentService con retrocompatibilidad 100%.
 */

(function () {
    class CanonicalLevelService {
        constructor() {
            this.MIN_LEVEL = 1.00;
            this.MAX_LEVEL = 7.00;
            this.DEFAULT_LEVEL = 3.50;

            // Configuración canónica oficial SomosPadel 2026
            this.CONFIG = {
                BASE_GAIN: 0.035,       // Variación base por victoria/derrota (3.5 centésimas)
                MAX_ADJUST: 0.060,      // Techo máximo estricto por partido (6 centésimas)
                MIN_ADJUST: 0.015,      // Suelo mínimo garantizado por partido (1.5 centésimas)
                LEVEL_K_FACTOR: 0.030   // Coeficiente ELO para disparidad de nivel
            };

            console.log("📈 [CanonicalLevelService] Motor Unificado ELO Pro / TrueSkill cargado (Norma Oficial 2026).");
        }

        /**
         * Calcula el delta de nivel según la Norma Oficial SomosPadel 2026:
         * 1. Base fija equilibrada: ±0.035 (3.5 centésimas)
         * 2. Factor de tanteo de juegos: Margen entre -0.0125 (0-6) y +0.0125 (6-0)
         * 3. Factor de dificultad ELO simétrico: Hasta ±0.015 según diferencia de nivel de parejas
         * 4. Factor de volatilidad/experiencia: Boost inicial para novatos (x1.30) y estabilidad para veteranos (x0.85)
         * 5. Techo y suelo inviolables: Mínimo ±0.015, Máximo estricto ±0.060 por partido
         *
         * @param {boolean} didWin
         * @param {number} myScore
         * @param {number} rivalScore
         * @param {number} myTeamAvg
         * @param {number} rivalTeamAvg
         * @param {number} matchCount
         * @returns {number} delta redondeado a 3 decimales
         */
        calculateDelta(didWin, myScore, rivalScore, myTeamAvg, rivalTeamAvg, matchCount = 10) {
            const totalGames = myScore + rivalScore;

            // 1. FACTOR BASE Y MARGEN DE JUEGOS (50%)
            // Victoria base: +0.035 | Derrota base: -0.035
            const baseDelta = didWin ? this.CONFIG.BASE_GAIN : -this.CONFIG.BASE_GAIN;
            let scoreMarginDelta = 0;

            if (totalGames > 0) {
                const ratio = myScore / totalGames; // De 0.0 (paliza en contra 0-6) a 1.0 (paliza a favor 6-0)
                // (ratio - 0.5) oscila entre -0.5 y +0.5. Con multiplicador 0.025, rango = [-0.0125, +0.0125]
                scoreMarginDelta = (ratio - 0.5) * 0.025;
            }

            const perfDelta = baseDelta + scoreMarginDelta;

            // 2. FACTOR DE DIFICULTAD ELO PAREJAS (TrueSkill simétrico) (50%)
            // levelDiff > 0: El rival es de mayor nivel (reto más difícil)
            // levelDiff < 0: El rival es de menor nivel (partido asequible)
            const levelDiff = (rivalTeamAvg || this.DEFAULT_LEVEL) - (myTeamAvg || this.DEFAULT_LEVEL);
            
            // diffDelta varía de -0.015 a +0.015 proporcionalmente a la diferencia
            // Si rival es superior (diff > 0): diffDelta es positivo (premia victoria, amortigua derrota)
            // Si rival es inferior (diff < 0): diffDelta es negativo (modera victoria, penaliza derrota)
            const diffDelta = Math.max(-0.015, Math.min(0.015, levelDiff * this.CONFIG.LEVEL_K_FACTOR));

            let rawDelta = perfDelta + diffDelta;

            // 3. FACTOR DE VOLATILIDAD / EXPERIENCIA (K dinámico)
            // Jugadores nuevos (< 5 partidos) calibran con agilidad controlada (x1.30).
            // Jugadores consolidados (> 35 partidos) tienen máxima estabilidad (x0.85).
            let volatility = 1.0;
            if (matchCount < 5) {
                volatility = 1.30;
            } else if (matchCount < 15) {
                volatility = 1.15;
            } else if (matchCount > 35) {
                volatility = 0.85;
            }

            let finalDelta = rawDelta * volatility;

            // 4. TOPES DE SEGURIDAD ESTRICTOS POR NORMA SOMOSPÁDEL 2026:
            // Todo partido suma/resta al menos MIN_ADJUST (0.015) y nunca más de MAX_ADJUST (0.060)
            const sign = finalDelta >= 0 ? 1 : -1;
            const absDelta = Math.min(this.CONFIG.MAX_ADJUST, Math.max(this.CONFIG.MIN_ADJUST, Math.abs(finalDelta)));
            finalDelta = sign * absDelta;

            return Math.round(finalDelta * 1000) / 1000;
        }

        /**
         * Helper interno para extraer IDs limpios de ambos equipos
         */
        _extractTeamIds(match) {
            let teamA = match.team_a_ids || [];
            let teamB = match.team_b_ids || [];

            if (teamA.length === 0 && match.player1) {
                teamA = [match.player1.id || match.player1, match.player2.id || match.player2];
            }
            if (teamB.length === 0 && match.player3) {
                teamB = [match.player3.id || match.player3, match.player4.id || match.player4];
            }

            const clean = (arr) => arr
                .map(p => (typeof p === 'object' && p ? p.id : p))
                .filter(id => id && typeof id === 'string' && id !== 'vacante_id' && !id.includes('guest'));

            return {
                teamA: clean(teamA),
                teamB: clean(teamB)
            };
        }

        /**
         * Extrae los tanteos numéricos del partido
         */
        _extractScores(match) {
            let scoreA = 0;
            let scoreB = 0;

            if (match.score_a !== undefined && match.score_b !== undefined) {
                scoreA = parseInt(match.score_a || 0, 10);
                scoreB = parseInt(match.score_b || 0, 10);
            } else if (match.result && match.result.set1) {
                scoreA = parseInt(match.result.set1.a || 0, 10);
                scoreB = parseInt(match.result.set1.b || 0, 10);
            } else if (typeof match.score === 'string' && match.score.includes('-')) {
                const parts = match.score.split('-');
                scoreA = parseInt(parts[0] || 0, 10);
                scoreB = parseInt(parts[1] || 0, 10);
            }

            return { scoreA, scoreB };
        }

        /**
         * Procesa el resultado de un partido finalizado.
         * Método canónico compatible con LevelService.processMatchResult y LevelAdjustmentService.processMatchResults.
         */
        async processMatchResult(match, type = 'americana') {
            if (!match) return;
            const matchStatus = match.status;
            if (matchStatus !== 'finished' && (!match.result || (!match.result.set1 && !match.score))) {
                return;
            }

            const matchType = (type === 'entreno' || match._type === 'entreno' || match.americana_id === 'entreno') ? 'entreno' : 'match';
            const collectionName = matchType === 'entreno' ? 'entrenos_matches' : 'matches';

            const { teamA, teamB } = this._extractTeamIds(match);
            const { scoreA, scoreB } = this._extractScores(match);

            if (teamA.length === 0 || teamB.length === 0) {
                console.warn(`⚠️ [CanonicalLevelService] Partido ${match.id} no tiene suficientes jugadores válidos.`);
                return;
            }

            if (scoreA === scoreB) {
                console.log(`ℹ️ [CanonicalLevelService] Empate ${scoreA}-${scoreB} en partido ${match.id}, sin ajuste de nivel.`);
                return;
            }

            console.log(`⚖️ [CanonicalLevelService] Calculando ELO para partido ${match.id} (${scoreA}-${scoreB})`);

            // Cargar datos actuales de los jugadores involucrados
            const allIds = [...teamA, ...teamB];
            const playersData = {};
            const playerDocs = await Promise.all(
                allIds.map(id => window.db.collection('players').doc(id).get())
            );

            playerDocs.forEach(doc => {
                if (doc.exists) {
                    playersData[doc.id] = { id: doc.id, ...doc.data() };
                }
            });

            const getLvl = (id) => {
                const p = playersData[id];
                if (!p) return this.DEFAULT_LEVEL;
                return parseFloat(p.level || p.self_rate_level || this.DEFAULT_LEVEL);
            };

            const avgLevelA = teamA.reduce((acc, id) => acc + getLvl(id), 0) / (teamA.length || 1);
            const avgLevelB = teamB.reduce((acc, id) => acc + getLvl(id), 0) / (teamB.length || 1);

            const wonA = scoreA > scoreB;
            const now = new Date();
            const dateStr = now.toISOString();

            const batch = window.db.batch();

            // Guardar cálculo de deltas por equipo para tarjetas / feed
            let reprDeltaA = 0;
            let reprDeltaB = 0;

            const applyTeamAdjustments = (uids, didWin, myScore, rivalScore, myTeamAvg, rivalTeamAvg, isTeamA) => {
                uids.forEach(uid => {
                    const p = playersData[uid];
                    if (!p) return;

                    const matchCount = (p.total_matches || p.matches_played || (p.wins || 0) + (p.losses || 0)) || 0;
                    const delta = this.calculateDelta(didWin, myScore, rivalScore, myTeamAvg, rivalTeamAvg, matchCount);

                    if (isTeamA) reprDeltaA = delta;
                    else reprDeltaB = delta;

                    const oldLevel = parseFloat(p.level || p.self_rate_level || this.DEFAULT_LEVEL);
                    let newLevel = Math.max(this.MIN_LEVEL, Math.min(this.MAX_LEVEL, oldLevel + delta));
                    newLevel = Math.round(newLevel * 100) / 100;

                    const wins = (p.wins || 0) + (didWin ? 1 : 0);
                    const losses = (p.losses || 0) + (didWin ? 0 : 1);
                    const totalMatches = wins + losses;
                    let streak = p.streak || 0;
                    if (didWin) {
                        streak = streak >= 0 ? streak + 1 : 1;
                    } else {
                        streak = 0;
                    }

                    // 1. Actualizar perfil de jugador
                    const pRef = window.db.collection('players').doc(uid);
                    batch.update(pRef, {
                        level: newLevel,
                        self_rate_level: newLevel,
                        last_level_change: delta,
                        lastLevelUpdate: dateStr,
                        wins: wins,
                        losses: losses,
                        total_matches: totalMatches,
                        streak: streak,
                        last_active: window.firebase ? window.firebase.firestore.FieldValue.serverTimestamp() : dateStr
                    });

                    // 2. Registrar en level_history
                    const hRef = window.db.collection('level_history').doc();
                    const histData = {
                        userId: uid,
                        matchId: match.id || null,
                        oldLevel: oldLevel,
                        level: newLevel,
                        delta: delta,
                        date: dateStr,
                        matchType: matchType,
                        round: parseInt(match.round || match.ronda || 0, 10) || null,
                        reason: 'match_result'
                    };
                    if (window.firebase && window.firebase.firestore && window.firebase.firestore.Timestamp) {
                        histData.timestamp = window.firebase.firestore.Timestamp.fromDate(now);
                    } else if (window.firebase && window.firebase.firestore && window.firebase.firestore.FieldValue) {
                        histData.timestamp = window.firebase.firestore.FieldValue.serverTimestamp();
                    }
                    batch.set(hRef, histData);

                    // 3. Sincronizar estado en Store local si es el usuario en sesión
                    if (window.Store) {
                        const cur = window.Store.getState('currentUser');
                        if (cur && (cur.uid === uid || cur.id === uid)) {
                            window.Store.setState('currentUser', {
                                ...cur,
                                level: newLevel,
                                self_rate_level: newLevel,
                                wins: wins,
                                losses: losses,
                                total_matches: totalMatches,
                                streak: streak
                            });
                        }
                    }
                });
            };

            applyTeamAdjustments(teamA, wonA, scoreA, scoreB, avgLevelA, avgLevelB, true);
            applyTeamAdjustments(teamB, !wonA, scoreB, scoreA, avgLevelB, avgLevelA, false);

            // Guardar deltas calculados en el documento del partido para vistas y tarjetas
            if (match.id) {
                const matchRef = window.db.collection(collectionName).doc(match.id);
                batch.update(matchRef, {
                    delta_a: reprDeltaA,
                    delta_b: reprDeltaB,
                    processed_at: dateStr
                });
            }

            await batch.commit();
            console.log(`✅ [CanonicalLevelService] Ajustes guardados para partido ${match.id}: ΔA=${reprDeltaA}, ΔB=${reprDeltaB}`);

            // Toast de notificación visual si está disponible
            if (window.NotificationService && window.NotificationService.showInAppToast) {
                const winDelta = wonA ? reprDeltaA : reprDeltaB;
                window.NotificationService.showInAppToast(
                    '🏆 NIVEL ACTUALIZADO',
                    `Ganadores: +${Math.abs(winDelta).toFixed(3)} | Perdedores: -${Math.abs(winDelta).toFixed(3)}`
                );
            }
        }

        /**
         * Alias para retrocompatibilidad con llamadas a processMatchResults (en plural)
         */
        async processMatchResults(match) {
            return this.processMatchResult(match, match._type || 'americana');
        }

        /**
         * Reversión segura (Rollback) de los ajustes producidos por un partido
         * cuando un administrador lo reabre o lo elimina.
         */
        async rollbackMatchResults(matchId) {
            if (!matchId) return;
            console.log(`🧹 [CanonicalLevelService] Iniciando rollback para partido ${matchId}...`);

            try {
                const historySnap = await window.db.collection('level_history')
                    .where('matchId', '==', matchId)
                    .get();

                if (historySnap.empty) {
                    console.log(`ℹ️ [CanonicalLevelService] No hay registros en level_history para el partido ${matchId}.`);
                    return;
                }

                const batch = window.db.batch();
                const nowStr = new Date().toISOString();

                for (const doc of historySnap.docs) {
                    const hData = doc.data();
                    const uid = hData.userId;
                    const delta = parseFloat(hData.delta || 0);
                    const isWin = delta > 0;

                    const playerDoc = await window.db.collection('players').doc(uid).get();
                    if (playerDoc.exists) {
                        const pData = playerDoc.data();
                        const currentLvl = parseFloat(pData.level || this.DEFAULT_LEVEL);
                        let rolledLvl = currentLvl - delta;
                        rolledLvl = Math.max(this.MIN_LEVEL, Math.min(this.MAX_LEVEL, Math.round(rolledLvl * 100) / 100));

                        const wins = Math.max(0, (pData.wins || 0) - (isWin ? 1 : 0));
                        const losses = Math.max(0, (pData.losses || 0) - (isWin ? 0 : 1));
                        const total = wins + losses;

                        batch.update(window.db.collection('players').doc(uid), {
                            level: rolledLvl,
                            self_rate_level: rolledLvl,
                            wins: wins,
                            losses: losses,
                            total_matches: total,
                            lastLevelUpdate: nowStr
                        });
                    }

                    // Eliminar la entrada del historial
                    batch.delete(doc.ref);
                }

                await batch.commit();
                console.log(`✅ [CanonicalLevelService] Rollback completado con éxito para ${historySnap.size} jugadores.`);

                if (window.NotificationService && window.NotificationService.showInAppToast) {
                    window.NotificationService.showInAppToast('🧹 AJUSTE REVERTIDO', 'Niveles y estadísticas devueltos a su estado anterior.');
                }
            } catch (err) {
                console.error("❌ [CanonicalLevelService] Error en rollbackMatchResults:", err);
                throw err;
            }
        }

        /**
         * Proceso Maestro de Recálculo Global (recalculateAllLevels):
         * 1. Carga todos los jugadores y todos los partidos finalizados ('matches' y 'entrenos_matches').
         * 2. Ordena estrictamente los partidos por fecha cronológica.
         * 3. Reinicia los niveles de todos los jugadores a su nivel base (self_rate_level o fallback 1.5 - 4.0).
         * 4. Limpia la colección `level_history`.
         * 5. Reejecuta la evolución partido a partido, recalculando deltas, rachas y victorias/derrotas.
         * 6. Guarda en Firestore usando batches de seguridad (< 450 ops).
         *
         * @param {Object} options
         * @param {boolean} options.silent - Si es true, no muestra diálogos modales automáticos.
         * @param {Function} options.onProgress - Callback con { step, current, total, message }.
         */
        async recalculateAllLevels(options = {}) {
            const isSilent = typeof options === 'boolean' ? options : (options.silent || false);
            const onProgress = typeof options === 'object' && options.onProgress ? options.onProgress : null;

            if (!isSilent) {
                const confirmed = await window.PremiumModal.confirm({
                    title: "⚡ RECÁLCULO MAESTRO DE NIVELES",
                    message: "Este proceso reanalizará el <b>100% del historial de partidos</b> cronológicamente con el algoritmo oficial SomosPadel Pro.<br><br>" +
                             "• Reconstruirá el gráfico de evolución en <code>level_history</code>.<br>" +
                             "• Sincronizará victorias, derrotas, rachas y nivel actual de cada jugador.<br><br>" +
                             "¿Deseas continuar?",
                    confirmText: "INICIAR RECÁLCULO",
                    confirmColor: "#ccff00",
                    type: 'warning'
                });
                if (!confirmed) return false;
            }

            console.log("🚀 [CanonicalLevelService] Iniciando Recálculo Maestro Completo...");

            const report = (step, current, total, message) => {
                console.log(`[Recalc ${step}] ${current}/${total} - ${message}`);
                if (onProgress) {
                    try { onProgress({ step, current, total, message }); } catch (e) {}
                }
            };

            try {
                // 1. OBTENER JUGADORES
                report('Cargando datos', 1, 4, 'Recuperando perfiles de jugadores...');
                const playersSnap = await window.db.collection('players').get();
                const playersMap = {};

                playersSnap.forEach(doc => {
                    const data = doc.data();
                    let baseLvl = parseFloat(data.self_rate_level || data.initial_level || data.level || this.DEFAULT_LEVEL);
                    if (isNaN(baseLvl) || baseLvl < this.MIN_LEVEL) baseLvl = 3.00;
                    if (baseLvl > this.MAX_LEVEL) baseLvl = this.MAX_LEVEL;
                    baseLvl = Math.round(baseLvl * 100) / 100;

                    playersMap[doc.id] = {
                        id: doc.id,
                        name: data.name || 'Jugador',
                        baseLevel: baseLvl,
                        currentLevel: baseLvl,
                        wins: 0,
                        losses: 0,
                        streak: 0,
                        totalMatches: 0,
                        gamesWon: 0,
                        lastUpdate: null
                    };
                });

                // 2. OBTENER Y ORDENAR PARTIDOS
                report('Cargando partidos', 2, 4, 'Leyendo partidos de americanas y entrenos...');
                const [matchesSnap, entrenosSnap] = await Promise.all([
                    window.db.collection('matches').get(),
                    window.db.collection('entrenos_matches') ? window.db.collection('entrenos_matches').get() : Promise.resolve({ docs: [] })
                ]);

                const parseTime = (m) => {
                    const val = m.date || m.createdAt || m.created_at || m.timestamp;
                    if (!val) return 0;
                    if (val.toDate) return val.toDate().getTime();
                    const d = new Date(val);
                    return isNaN(d.getTime()) ? 0 : d.getTime();
                };

                const allMatches = [];
                const extractValidMatch = (doc, mType) => {
                    const data = doc.data();
                    const isFin = data.status === 'finished' || (data.result && (data.result.set1 || data.score));
                    if (!isFin) return;
                    allMatches.push({
                        ...data,
                        id: doc.id,
                        _type: mType,
                        _sortTime: parseTime(data)
                    });
                };

                matchesSnap.forEach(d => extractValidMatch(d, 'match'));
                entrenosSnap.forEach(d => extractValidMatch(d, 'entreno'));

                // Ordenación cronológica estricta: tiempo -> ronda -> orden -> id
                const getMatchSortKey = (m) => {
                    const time = m._sortTime || 0;
                    const round = parseInt(m.round || m.ronda || 0, 10);
                    const matchNum = parseInt(m.match_number || m.order || 0, 10);
                    return { time, round, matchNum, id: m.id || '' };
                };

                allMatches.sort((a, b) => {
                    const ka = getMatchSortKey(a);
                    const kb = getMatchSortKey(b);
                    if (ka.time !== kb.time) return ka.time - kb.time;
                    if (ka.round !== kb.round) return ka.round - kb.round;
                    if (ka.matchNum !== kb.matchNum) return ka.matchNum - kb.matchNum;
                    return ka.id.localeCompare(kb.id);
                });
                console.log(`📊 [CanonicalLevelService] ${allMatches.length} partidos ordenados listos para reproducir.`);

                // 3. LIMPIEZA DE LEVEL_HISTORY EXISTENTE (EN LOTES DE 450)
                report('Limpieza', 3, 4, 'Vaciando historial antiguo para regeneración limpia...');
                const historySnap = await window.db.collection('level_history').get();
                let delBatch = window.db.batch();
                let delCount = 0;

                for (const doc of historySnap.docs) {
                    delBatch.delete(doc.ref);
                    delCount++;
                    if (delCount >= 450) {
                        await delBatch.commit();
                        delBatch = window.db.batch();
                        delCount = 0;
                    }
                }
                if (delCount > 0) await delBatch.commit();

                // 4. REPLAY CRONOLÓGICO Y CONSTRUCCIÓN DE HISTORIAL
                report('Procesando ELO', 0, allMatches.length, 'Calculando evolución partido a partido...');
                let saveBatch = window.db.batch();
                let opCount = 0;
                let matchIndex = 0;

                for (const match of allMatches) {
                    matchIndex++;
                    const { teamA, teamB } = this._extractTeamIds(match);
                    const { scoreA, scoreB } = this._extractScores(match);

                    if (teamA.length === 0 || teamB.length === 0 || scoreA === scoreB) {
                        continue;
                    }

                    const wonA = scoreA > scoreB;

                    const getPLevel = (uid) => {
                        return playersMap[uid] ? playersMap[uid].currentLevel : this.DEFAULT_LEVEL;
                    };

                    const avgLevelA = teamA.reduce((sum, id) => sum + getPLevel(id), 0) / (teamA.length || 1);
                    const avgLevelB = teamB.reduce((sum, id) => sum + getPLevel(id), 0) / (teamB.length || 1);

                    const matchDateObj = match._sortTime ? new Date(match._sortTime) : new Date();
                    const matchRound = parseInt(match.round || match.ronda || 0, 10);
                    // Añadir desplazamiento por ronda (segundos) para garantizar secuencia estricta en partidos del mismo torneo
                    const effectiveTime = matchDateObj.getTime() + (matchRound * 1000) + matchIndex;
                    const effectiveDate = new Date(effectiveTime);
                    const dateIso = effectiveDate.toISOString();

                    const processTeamReplay = (uids, didWin, myScore, rivalScore, myAvg, rivalAvg) => {
                        uids.forEach(uid => {
                            const p = playersMap[uid];
                            if (!p) return;

                            const delta = this.calculateDelta(didWin, myScore, rivalScore, myAvg, rivalAvg, p.totalMatches);
                            const oldLvl = p.currentLevel;
                            let newLvl = Math.max(this.MIN_LEVEL, Math.min(this.MAX_LEVEL, oldLvl + delta));
                            newLvl = Math.round(newLvl * 100) / 100;

                            p.currentLevel = newLvl;
                            p.totalMatches++;
                            p.gamesWon += myScore;
                            p.lastUpdate = dateIso;

                            if (didWin) {
                                p.wins++;
                                p.streak = p.streak >= 0 ? p.streak + 1 : 1;
                            } else {
                                p.losses++;
                                p.streak = 0;
                            }

                            // Crear entrada cronológica en level_history con fecha y timestamp Firestore
                            const hRef = window.db.collection('level_history').doc();
                            const histEntry = {
                                userId: uid,
                                matchId: match.id,
                                oldLevel: oldLvl,
                                level: newLvl,
                                delta: delta,
                                date: dateIso,
                                matchType: match._type,
                                round: matchRound || null,
                                reason: 'recalculation'
                            };
                            if (window.firebase && window.firebase.firestore && window.firebase.firestore.Timestamp) {
                                histEntry.timestamp = window.firebase.firestore.Timestamp.fromDate(effectiveDate);
                            }
                            saveBatch.set(hRef, histEntry);
                            opCount++;
                        });
                    };

                    processTeamReplay(teamA, wonA, scoreA, scoreB, avgLevelA, avgLevelB);
                    processTeamReplay(teamB, !wonA, scoreB, scoreA, avgLevelB, avgLevelA);

                    if (opCount >= 420) {
                        await saveBatch.commit();
                        saveBatch = window.db.batch();
                        opCount = 0;
                    }

                    if (matchIndex % 50 === 0) {
                        report('Procesando ELO', matchIndex, allMatches.length, `Procesados ${matchIndex} de ${allMatches.length} partidos...`);
                    }
                }

                if (opCount > 0) {
                    await saveBatch.commit();
                    saveBatch = window.db.batch();
                    opCount = 0;
                }

                // 5. GUARDAR NIVELES FINALES Y ESTADÍSTICAS EN 'PLAYERS'
                report('Guardando perfiles', 0, Object.keys(playersMap).length, 'Actualizando niveles consolidados en perfiles...');
                let playerIndex = 0;
                const totalPlayers = Object.keys(playersMap).length;

                for (const pid in playersMap) {
                    playerIndex++;
                    const p = playersMap[pid];
                    const pRef = window.db.collection('players').doc(pid);

                    const winRate = p.totalMatches > 0 ? Math.round((p.wins / p.totalMatches) * 100) : 0;

                    saveBatch.update(pRef, {
                        level: p.currentLevel,
                        wins: p.wins,
                        losses: p.losses,
                        streak: p.streak,
                        total_matches: p.totalMatches,
                        matches_played: p.totalMatches,
                        games_won: p.gamesWon,
                        win_rate: winRate,
                        lastLevelUpdate: p.lastUpdate || new Date().toISOString(),
                        last_recalc: new Date().toISOString()
                    });
                    opCount++;

                    if (opCount >= 450) {
                        await saveBatch.commit();
                        saveBatch = window.db.batch();
                        opCount = 0;
                    }
                }

                if (opCount > 0) {
                    await saveBatch.commit();
                }

                report('Completado', totalPlayers, totalPlayers, '¡Recálculo maestro finalizado!');
                console.log(`✅ [CanonicalLevelService] Recálculo maestro completado: ${allMatches.length} partidos, ${totalPlayers} jugadores.`);

                if (!isSilent) {
                    await window.PremiumModal.alert({
                        title: "✅ RECÁLCULO COMPLETADO",
                        message: `Se ha reconstruido el historial cronológico con éxito.<br><br>` +
                                 `• <b>Partidos procesados:</b> ${allMatches.length}<br>` +
                                 `• <b>Jugadores actualizados:</b> ${totalPlayers}`,
                        type: 'success'
                    });
                    window.location.reload();
                }

                return true;
            } catch (err) {
                console.error("❌ [CanonicalLevelService] Error crítico en recálculo maestro:", err);
                if (!isSilent && window.PremiumModal) {
                    window.PremiumModal.alert({
                        title: "❌ ERROR EN RECÁLCULO",
                        message: "Ocurrió un error durante el recálculo: " + err.message,
                        type: 'error'
                    });
                }
                return false;
            }
        }
    }

    // Instancia única compartida
    const instance = new CanonicalLevelService();

    // Exportación canónica global y retrocompatibilidad total
    window.LevelService = instance;
    window.LevelAdjustmentService = instance;

    console.log("🌟 [LevelService] Engine canónico registrado globalmente en window.LevelService y window.LevelAdjustmentService");
})();
