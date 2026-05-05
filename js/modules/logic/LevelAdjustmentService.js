/**
 * LevelAdjustmentService.js
 * Sistema Inteligente de Ajuste de Nivel (ELO-Style)
 * Calcula y escala el nivel del jugador basándose en resultados reales.
 */

(function () {
    const LevelAdjustmentService = {

        // Configuración de sensibilidad (AUMENTADA v3 - MÁS DINÁMICO)
        CONFIG: {
            BASE_GAIN: 0.05,     // (Antes 0.010) Ganancia estándar mucho más visible
            MAX_ADJUST: 0.10,    // (Antes 0.025) Máximo por partido
            MIN_ADJUST: 0.02,    // (Antes 0.005) Mínimo garantizado
            LEVEL_K_FACTOR: 0.05 // (Antes 0.01) Mayor impacto al ganar a gente superior
        },

        /**
         * Ajusta el nivel de todos los participantes de un partido al finalizarlo
         */
        async processMatchResults(match) {
            console.log(`⚖️ LevelAdjustmentService: Procesando partido ${match.id}`);

            const sA = parseInt(match.score_a || 0);
            const sB = parseInt(match.score_b || 0);

            // 0. Robust ID Extraction
            let teamA_ids = match.team_a_ids || [];
            let teamB_ids = match.team_b_ids || [];

            if (teamA_ids.length === 0 && match.player1) {
                // Fallback Legacy
                teamA_ids = [match.player1.id || match.player1, match.player2.id || match.player2].filter(x => x);
                teamB_ids = [match.player3.id || match.player3, match.player4.id || match.player4].filter(x => x);
            }

            if (teamA_ids.length === 0 && teamB_ids.length === 0) {
                console.warn("⚠️ No se encontraron IDs de jugadores para ajustar nivel.");
                return;
            }

            if (sA === sB) return; // Empates

            // 1. Obtener niveles actuales
            const allIds = [...teamA_ids, ...teamB_ids];
            const playersData = await this._getPlayersData(allIds);

            const getLvl = (id) => playersData[id]?.level || playersData[id]?.self_rate_level || 3.5;

            const avgLevelA = this._calculateAvg(teamA_ids.map(id => getLvl(id)));
            const avgLevelB = this._calculateAvg(teamB_ids.map(id => getLvl(id)));

            // 2. Calcular ajustes
            const diffGames = Math.abs(sA - sB);
            const wonA = sA > sB;

            const adjustA = this._calculateDelta(wonA, avgLevelA, avgLevelB, diffGames);
            const adjustB = this._calculateDelta(!wonA, avgLevelB, avgLevelA, diffGames);

            console.log(`📈 Deltas: A(${adjustA > 0 ? '+' : ''}${adjustA.toFixed(3)}) | B(${adjustB > 0 ? '+' : ''}${adjustB.toFixed(3)})`);

            // 3. Aplicar DB
            const batch = window.db.batch();
            const now = new Date().toISOString();

            // Store names for toast
            let namesA = [], namesB = [];

            for (const id of teamA_ids) {
                if (playersData[id]) namesA.push(playersData[id].name);
                await this._applyAdjustment(id, playersData[id], adjustA, now, batch, match.id);
            }
            for (const id of teamB_ids) {
                if (playersData[id]) namesB.push(playersData[id].name);
                await this._applyAdjustment(id, playersData[id], adjustB, now, batch, match.id);
            }

            await batch.commit();
            console.log("✅ Niveles actualizados.");

            // 4. Feedback Visual
            if (window.NotificationService) {
                const deltaWin = wonA ? adjustA : adjustB;
                window.NotificationService.showInAppToast(`🏆 NIVEL ACTUALIZADO`, `Ganadores: +${deltaWin.toFixed(3)} | Perdedores: -${deltaWin.toFixed(3)}`);
            }
        },

        /**
         * Realiza un Rollback de los ajustes de nivel para un partido específico
         */
        async rollbackMatchResults(matchId) {
            console.log(`🧹 LevelAdjustmentService: Revirtiendo ajustes del partido ${matchId}`);

            try {
                // 1. Buscar entradas en level_history asociadas a este matchId
                const historySnap = await window.db.collection('level_history')
                    .where('matchId', '==', matchId)
                    .get();

                if (historySnap.empty) {
                    console.log("ℹ️ No se encontraron registros históricos para revertir.");
                    return;
                }

                const batch = window.db.batch();
                const now = new Date().toISOString();

                // 2. Para cada registro, revertir en el jugador
                for (const doc of historySnap.docs) {
                    const entry = doc.data();
                    const uid = entry.userId;
                    const delta = entry.delta || 0;
                    const isWin = delta > 0;

                    // Obtener datos actuales del jugador
                    const playerDoc = await window.db.collection('players').doc(uid).get();
                    if (playerDoc.exists) {
                        const pData = playerDoc.data();

                        // Calculamos reversión lenta pero segura
                        const currentLvl = parseFloat(pData.level || 3.5);
                        const rolledLvl = parseFloat((currentLvl - delta).toFixed(2));

                        const wins = Math.max(0, (pData.wins || 0) - (isWin ? 1 : 0));
                        const losses = Math.max(0, (pData.losses || 0) - (isWin ? 0 : 1));

                        // No podemos revertir el streak fácilmente sin saber el historial completo,
                        // pero podemos ponerlo a 0 si era una victoria o dejarlo si era derrota (aproximación).
                        // El Recalcular lo arreglará todo al final si es necesario.

                        batch.update(window.db.collection('players').doc(uid), {
                            level: rolledLvl,
                            wins: wins,
                            losses: losses,
                            total_matches: wins + losses,
                            lastLevelUpdate: now
                        });
                    }

                    // 3. Borrar la entrada del historial
                    batch.delete(doc.ref);
                }

                await batch.commit();
                console.log(`✅ Rollback completado para ${historySnap.size} registros.`);

                if (window.NotificationService) {
                    window.NotificationService.showInAppToast(`🧹 AJUSTE REVERTIDO`, `Se han desecho los cambios de nivel del partido reabierto.`);
                }
            } catch (e) {
                console.error("❌ Error en rollbackMatchResults:", e);
                throw e;
            }
        },

        _calculateDelta(isWinner, myAvg, oppAvg, diffGames) {
            const levelDiff = oppAvg - myAvg; // Positivo si el rival es mejor
            let delta = this.CONFIG.BASE_GAIN;

            // 1. Bonus por dificultad (Diferencial de ELO)
            delta += (levelDiff * this.CONFIG.LEVEL_K_FACTOR);

            // 2. Bonus por marcador (Cada juego de diferencia suma 0.005 al ajuste)
            // Esto cumple con: "si ganas/pierdes por más juegos, que suba (la magnitud) algo más"
            delta += (Math.abs(diffGames || 0) * 0.005);

            // 3. Asegurar límites (Rango solicitado: 0.05 - 0.10)
            delta = Math.max(this.CONFIG.MIN_ADJUST, Math.min(this.CONFIG.MAX_ADJUST, delta));

            // Si gana suma, si pierde resta (manteniendo sistema competitivo)
            return isWinner ? delta : -delta;
        },

        async _applyAdjustment(uid, currentData, delta, date, batch, matchId) {
            if (!uid || !currentData) return;

            const oldLevel = parseFloat(currentData.level || 3.5);
            const newLevel = parseFloat((oldLevel + delta).toFixed(2));
            const isWin = delta > 0;

            // Stats Update logic
            const wins = (currentData.wins || 0) + (isWin ? 1 : 0);
            const losses = (currentData.losses || 0) + (isWin ? 0 : 1);
            let streak = currentData.streak || 0;
            if (isWin) {
                streak = streak >= 0 ? streak + 1 : 1;
            } else {
                streak = 0; // Streak breaks on loss
            }

            const playerRef = window.db.collection('players').doc(uid);
            batch.update(playerRef, {
                level: newLevel,
                lastLevelUpdate: date,
                wins: wins,
                losses: losses,
                streak: streak,
                total_matches: wins + losses
            });

            // Registrar en historial
            const historyRef = window.db.collection('level_history').doc();
            batch.set(historyRef, {
                userId: uid,
                oldLevel: oldLevel,
                level: newLevel,
                delta: parseFloat(delta.toFixed(3)),
                date: date,
                matchId: matchId,
                reason: 'match_result'
            });
        },

        async _getPlayersData(ids) {
            const data = {};
            const promises = ids.map(id => window.db.collection('players').doc(id).get());
            const snaps = await Promise.all(promises);
            snaps.forEach(snap => {
                if (snap.exists) data[snap.id] = snap.data();
            });
            return data;
        },

        _calculateAvg(levels) {
            if (levels.length === 0) return 3.5;
            return levels.reduce((a, b) => a + b, 0) / levels.length;
        },

        /**
         * Simulación retrospectiva para Alejandro
         */
        async simulateHistoryForUser(uid, startLevel, matchCount) {
            console.log("🧪 Simulando historial para:", uid);
            const batch = window.db.batch();
            let currentLvl = startLevel;
            const now = new Date();

            for (let i = 1; i <= matchCount; i++) {
                const date = new Date(now.getTime() - (matchCount - i) * 86400000).toISOString();
                const delta = (Math.random() * 0.05) + 0.05; // Simular tendencia al alza (ganancia constante en seed)
                const oldLvl = currentLvl;
                currentLvl = parseFloat((currentLvl + delta).toFixed(2));

                const historyRef = window.db.collection('level_history').doc();
                batch.set(historyRef, {
                    userId: uid,
                    oldLevel: oldLvl,
                    level: currentLvl,
                    delta: delta,
                    date: date,
                    reason: 'seed_init'
                });
            }

            // Actualizar nivel final
            batch.update(window.db.collection('players').doc(uid), { level: currentLvl });
            await batch.commit();
            console.log("✅ Historial simulado.");
        },

        /**
         * RECALCULAR TODOS LOS NIVELES (Mantenimiento)
         * Procesa todos los partidos finalizados desde el principio de los tiempos.
         */
        async recalculateAllLevels() {
            const confirmed = await window.PremiumModal.confirm({
                title: "⚠️ RECALCULO GLOBAL",
                message: "Esto reseteará los niveles de todos los jugadores basándose en su historial de partidos y re-generará el historial de niveles.<br><br>¿Deseas continuar?",
                confirmText: "INICIAR RECALCULO",
                type: 'danger'
            });

            if (!confirmed) return;

            console.log("🚀 Iniciando Recálculo Global de Niveles...");

            try {
                // 1. Obtener todos los jugadores
                const playersSnap = await window.db.collection('players').get();
                const players = {};
                playersSnap.forEach(doc => {
                    const data = doc.data();
                    players[doc.id] = {
                        ...data,
                        id: doc.id,
                        level: parseFloat(data.self_rate_level || 3.50),
                        wins: 0,
                        losses: 0,
                        streak: 0
                    };
                });

                // 2. Obtener TODOS los partidos finalizados
                const [matchesSnap, entrenoMatchesSnap] = await Promise.all([
                    window.db.collection('matches').where('status', '==', 'finished').get(),
                    window.db.collection('entrenos_matches').where('status', '==', 'finished').get()
                ]);

                const allMatches = [
                    ...matchesSnap.docs.map(d => ({ ...d.data(), id: d.id, _type: 'match' })),
                    ...entrenoMatchesSnap.docs.map(d => ({ ...d.data(), id: d.id, _type: 'entreno' }))
                ];

                const parseDate = (d) => {
                    if (!d) return 0;
                    if (d.toDate) return d.toDate().getTime();
                    return new Date(d).getTime();
                };

                // Orden cronológico estricto
                allMatches.sort((a, b) => parseDate(a.date || a.createdAt) - parseDate(b.date || b.createdAt));

                console.log(`📊 Procesando ${allMatches.length} partidos para ${playersSnap.size} jugadores...`);

                // 3. Limpiar historial previo (BATCH de 500)
                const histSnap = await window.db.collection('level_history').get();
                console.log(`🧹 Borrando ${histSnap.size} registros de historial...`);

                let deleteBatch = window.db.batch();
                let delCount = 0;
                for (const doc of histSnap.docs) {
                    deleteBatch.delete(doc.ref);
                    delCount++;
                    if (delCount >= 450) {
                        await deleteBatch.commit();
                        deleteBatch = window.db.batch();
                        delCount = 0;
                    }
                }
                if (delCount > 0) await deleteBatch.commit();

                // 4. Procesar y guardar Historial + Niveles
                let opBatch = window.db.batch();
                let opCount = 0;

                for (const match of allMatches) {
                    const sA = parseInt(match.score_a || 0);
                    const sB = parseInt(match.score_b || 0);
                    const teamA_ids = match.team_a_ids || [];
                    const teamB_ids = match.team_b_ids || [];

                    if (sA === sB) continue;

                    const avgLevelA = teamA_ids.reduce((sum, id) => sum + (players[id]?.level || 3.5), 0) / (teamA_ids.length || 1);
                    const avgLevelB = teamB_ids.reduce((sum, id) => sum + (players[id]?.level || 3.5), 0) / (teamB_ids.length || 1);

                    const wonA = sA > sB;
                    const diffGames = Math.abs(sA - sB);

                    // Calculamos el ajuste real usando el diferencial de juegos
                    const adjustA = this._calculateDelta(wonA, avgLevelA, avgLevelB, diffGames);
                    const adjustB = this._calculateDelta(!wonA, avgLevelB, avgLevelA, diffGames);

                    const dateStr = new Date(parseDate(match.date || match.createdAt)).toISOString();

                    const applyToPlayer = (id, delta) => {
                        if (!players[id]) return;
                        const oldLvl = players[id].level;
                        players[id].level = parseFloat((oldLvl + delta).toFixed(2));
                        players[id].lastUpdate = dateStr;

                        // Sync Stats
                        const isWin = delta > 0;
                        if (isWin) {
                            players[id].wins++;
                            players[id].streak++;
                        } else {
                            players[id].losses++;
                            players[id].streak = 0;
                        }

                        const hRef = window.db.collection('level_history').doc();
                        opBatch.set(hRef, {
                            userId: id,
                            oldLevel: oldLvl,
                            level: players[id].level,
                            delta: parseFloat(delta.toFixed(3)),
                            date: dateStr,
                            matchId: match.id,
                            reason: 'recalculation'
                        });
                        opCount++;
                    };

                    for (const id of teamA_ids) applyToPlayer(id, adjustA);
                    for (const id of teamB_ids) applyToPlayer(id, adjustB);

                    if (opCount >= 400) {
                        await opBatch.commit();
                        opBatch = window.db.batch();
                        opCount = 0;
                    }
                }

                // Finalmente guardar niveles finales en 'players'
                console.log("💾 Guardando niveles finales actualizados...");
                for (const id in players) {
                    const pRef = window.db.collection('players').doc(id);
                    opBatch.update(pRef, {
                        level: players[id].level,
                        lastLevelUpdate: players[id].lastUpdate || new Date().toISOString(),
                        wins: players[id].wins,
                        losses: players[id].losses,
                        streak: players[id].streak,
                        total_matches: players[id].wins + players[id].losses
                    });
                    opCount++;
                    if (opCount >= 450) {
                        await opBatch.commit();
                        opBatch = window.db.batch();
                        opCount = 0;
                    }
                }
                if (opCount > 0) await opBatch.commit();

                await window.PremiumModal.alert({
                    title: "ÉXITO",
                    message: "Recálculo global completado con éxito. El sistema ha sido actualizado.",
                    type: 'success'
                });
                location.reload();
            } catch (e) {
                console.error("Error crítico en recálculo:", e);
                window.PremiumModal.alert({
                    title: "ERROR CRÍTICO",
                    message: "Error en el recálculo: " + e.message,
                    type: 'danger'
                });
            }
        }
    };

    window.LevelAdjustmentService = LevelAdjustmentService;
    console.log("⚖️ LevelAdjustmentService Cargado.");
})();
