/**
 * LevelService.js
 * Manages dynamic level adjustments (décimas) based on match performance.
 * Premium SomosPadel ELO-like system.
 * v2.0 - PRO SMART ALGORITHM (60% Performance / 40% Difficulty)
 */
(function () {
    class LevelService {
        constructor() {
            this.db = window.FirebaseDB;
            console.log("📈 LevelService v2.0 Initialized");
        }

        /**
         * Unified method to process level changes after a match.
         * Based on PRO SMART ALGORITHM: 60% Performance + 40% Difficulty.
         * Adjustment range: 0.01 - 0.03 per match (Total ~0.15 per session).
         */
        async processMatchResult(match, type = 'americana') {
            if (!match || match.status !== 'finished') return;

            console.log(`⚖️ [LevelService] Pro-Level calculation starting for match:`, match.id);

            const scoreA = parseInt(match.score_a || 0);
            const scoreB = parseInt(match.score_b || 0);

            if (scoreA === scoreB && scoreA === 0) return;

            // --- ROBUST ID EXTRACTION (Legacy Fallback) ---
            let teamA = match.team_a_ids || [];
            let teamB = match.team_b_ids || [];

            if (teamA.length === 0 && match.player1) {
                teamA = [match.player1.id || match.player1, match.player2.id || match.player2].filter(x => x && typeof x === 'string');
                teamB = [match.player3.id || match.player3, match.player4.id || match.player4].filter(x => x && typeof x === 'string');
            }

            // Get player levels for difficulty calculation
            const allPlayerIds = [...teamA, ...teamB].filter(id => id && id !== 'vacante_id' && !id.includes('guest'));
            if (allPlayerIds.length === 0) return;

            const playersSnapshot = await window.db.collection('players')
                .where(window.FirebaseFirestore.FieldPath.documentId(), 'in', allPlayerIds)
                .get();

            const levelMap = {};
            playersSnapshot.forEach(doc => levelMap[doc.id] = parseFloat(doc.data().level || doc.data().self_rate_level || 3.5));

            const getAvgLevel = (ids) => {
                const levels = ids.map(id => levelMap[id] || 3.5);
                return levels.reduce((a, b) => a + b, 0) / (levels.length || 1);
            };

            const avgLevelA = getAvgLevel(teamA);
            const avgLevelB = getAvgLevel(teamB);

            // Calculate Adjustments per Team
            const processTeam = async (uids, myScore, myRivalScore, myTeamAvg, rivalTeamAvg) => {
                const didWin = myScore > myRivalScore;
                const totalGames = myScore + myRivalScore;

                // 1. PERFORMANCE (60%) - Base 0.030 (Increased from 0.012 for more visibility)
                let perfDelta = didWin ? 0.030 : -0.030;
                if (totalGames > 0) {
                    const gamesRatio = myScore / totalGames;
                    // extra margin boost/penalty (up to +/- 0.01)
                    const marginMultiplier = (gamesRatio - 0.5) * 0.02;
                    perfDelta += marginMultiplier;
                }

                // 2. DIFFICULTY (40%) - Base 0.015
                let diffDelta = 0;
                const levelDiff = rivalTeamAvg - myTeamAvg; // rivals - me

                if (didWin) {
                    // Win against stronger: big bonus
                    if (levelDiff > 0) diffDelta = levelDiff * 0.05; // Increased K-factor
                    else diffDelta = 0.005;
                } else {
                    // Loss against weaker: big penalty
                    if (levelDiff < 0) diffDelta = levelDiff * 0.05;
                    else diffDelta = -0.005;
                }

                const totalDelta = perfDelta + diffDelta;

                const updates = uids.map(uid => {
                    if (uid && uid !== 'vacante_id' && !uid.includes('guest')) return this.updatePlayerLevel(uid, totalDelta);
                    return Promise.resolve();
                });
                await Promise.all(updates);
            };

            try {
                await Promise.all([
                    processTeam(teamA, scoreA, scoreB, avgLevelA, avgLevelB),
                    processTeam(teamB, scoreB, scoreA, avgLevelB, avgLevelA)
                ]);

                // 💾 SAVE DELTAS TO MATCH DOCUMENT (For Share Cards)
                const deltaA = (await this._calculateDelta(scoreA, scoreB, avgLevelA, avgLevelB));
                const deltaB = (await this._calculateDelta(scoreB, scoreA, avgLevelB, avgLevelA));

                const matchRef = window.db.collection(type === 'entreno' ? 'entrenos_matches' : 'matches').doc(match.id);
                await matchRef.update({
                    delta_a: deltaA,
                    delta_b: deltaB,
                    processed_at: new Date().toISOString()
                });

                console.log(`✅ [LevelService] Smart Pro adjustment applied: A(${deltaA}) B(${deltaB})`);
            } catch (error) {
                console.error("❌ [LevelService] Error in advanced calculation:", error);
            }
        }

        async _calculateDelta(myScore, rivalScore, myTeamAvg, rivalTeamAvg) {
            const didWin = myScore > rivalScore;
            const totalGames = myScore + rivalScore;
            let perfDelta = didWin ? 0.030 : -0.030;
            if (totalGames > 0) perfDelta += ((myScore / totalGames) - 0.5) * 0.02;

            let diffDelta = 0;
            const levelDiff = rivalTeamAvg - myTeamAvg;
            if (didWin) diffDelta = levelDiff > 0 ? (levelDiff * 0.05) : 0.005;
            else diffDelta = levelDiff < 0 ? (levelDiff * 0.05) : -0.005;

            return Math.round((perfDelta + diffDelta) * 1000) / 1000;
        }

        /**
         * Updates a single player's level with a delta.
         * Ensures level stays within 0.0 - 7.5 range.
         */
        async updatePlayerLevel(userId, delta) {
            try {
                const playerRef = window.db.collection('players').doc(userId);

                await window.db.runTransaction(async (transaction) => {
                    const doc = await transaction.get(playerRef);
                    if (!doc.exists) return;

                    const data = doc.data();
                    const currentLevel = parseFloat(data.level || data.self_rate_level || 3.5);
                    let newLevel = currentLevel + delta;

                    newLevel = Math.max(0.0, Math.min(7.5, newLevel));
                    newLevel = Math.round(newLevel * 100) / 100; // 2 decimals for display

                    console.log(`📈 [LevelService] Updating player ${userId}: ${currentLevel.toFixed(3)} -> ${newLevel.toFixed(3)} (Δ: ${delta.toFixed(3)})`);

                    if (newLevel !== currentLevel) {
                        transaction.update(playerRef, {
                            level: newLevel,
                            self_rate_level: newLevel,
                            last_level_change: delta,
                            last_active: window.firebase.firestore.FieldValue.serverTimestamp()
                        });

                        // 📈 SAVE TO HISTORY FOR CHARTING
                        const historyRef = window.db.collection('level_history').doc();
                        transaction.set(historyRef, {
                            userId: userId,
                            level: newLevel,
                            delta: Math.round(delta * 1000) / 1000,
                            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                            date: new Date().toISOString()
                        });

                        console.log(`👤 [LevelService] ${data.name}: ${currentLevel} -> ${newLevel} (${delta.toFixed(3)})`);

                        // Update local store if this is the current user
                        if (window.Store) {
                            const currentUser = window.Store.getState('currentUser');
                            if (currentUser && (currentUser.uid === userId || currentUser.id === userId)) {
                                window.Store.setState('currentUser', {
                                    ...currentUser,
                                    level: newLevel,
                                    self_rate_level: newLevel
                                });
                            }
                        }
                    }
                });
            } catch (error) {
                console.error(`[LevelService] Failed to update player ${userId}:`, error);
            }
        }

        /**
         * Recalculates all player levels from their entire match history.
         * Using PRO SMART ALGORITHM (60% Performance / 40% Difficulty).
         */
        async recalculateAllLevels() {
            console.log("🚀 [LevelService] Starting Global PRO Recalculation...");
            try {
                const players = await window.FirebaseDB.players.getAll();
                const matchesSnap = await window.db.collection('matches').get();
                const entrenosMatchesSnap = await window.db.collection('entrenos_matches').get();

                let allMatches = [
                    ...matchesSnap.docs.map(d => ({ id: d.id, ...d.data() })),
                    ...entrenosMatchesSnap.docs.map(d => ({ id: d.id, ...d.data() }))
                ].filter(m => m.status === 'finished');

                // Sort by date to "replay" the level evolution correctly
                allMatches.sort((a, b) => {
                    const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
                    const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
                    return dateA - dateB;
                });

                console.log(`📊 Replaying ${allMatches.length} matches for ${players.length} players...`);

                const playerLevels = {};
                players.forEach(p => {
                    playerLevels[p.id] = parseFloat(p.self_rate_level || 3.5);
                });

                allMatches.forEach(m => {
                    const scoreA = parseInt(m.score_a || 0);
                    const scoreB = parseInt(m.score_b || 0);
                    if (scoreA === scoreB && scoreA === 0) return;

                    const teamA = m.team_a_ids || [];
                    const teamB = m.team_b_ids || [];

                    const getAvg = (ids) => {
                        const lvs = ids.map(id => playerLevels[id] || 3.5);
                        return lvs.reduce((a, b) => a + b, 0) / (lvs.length || 1);
                    };

                    const avgA = getAvg(teamA);
                    const avgB = getAvg(teamB);

                    const processTeamLocal = (uids, myS, riS, myAvg, riAvg) => {
                        const win = myS > riS;
                        const total = myS + riS;

                        // Performance (60%)
                        let pDelta = win ? 0.030 : -0.030;
                        if (total > 0) pDelta += ((myS / total) - 0.5) * 0.02;

                        // Difficulty (40%)
                        let dDelta = 0;
                        const diff = riAvg - myAvg;
                        if (win) dDelta = diff > 0 ? (diff * 0.05) : 0.005;
                        else dDelta = diff < 0 ? (diff * 0.05) : -0.005;

                        const totalDelta = pDelta + dDelta;
                        uids.forEach(id => {
                            if (playerLevels[id] !== undefined) {
                                let nl = playerLevels[id] + totalDelta;
                                playerLevels[id] = Math.max(0, Math.min(7.5, nl));
                            }
                        });
                    };

                    processTeamLocal(teamA, scoreA, scoreB, avgA, avgB);
                    processTeamLocal(teamB, scoreB, scoreA, avgB, avgA);
                });

                // Batch update Firestore with final calculated levels
                console.log("💾 Saving recalculated levels to database...");
                let batch = window.db.batch();
                let batchCount = 0;
                let totalUpdated = 0;

                for (const pid in playerLevels) {
                    const roundedLevel = Math.round(playerLevels[pid] * 100) / 100;
                    batch.update(window.db.collection('players').doc(pid), {
                        level: roundedLevel,
                        last_recalc: new Date().toISOString()
                    });

                    batchCount++;
                    totalUpdated++;

                    if (batchCount >= 450) {
                        await batch.commit();
                        batch = window.db.batch();
                        batchCount = 0;
                        console.log(`... saved ${totalUpdated} players`);
                    }
                }

                if (batchCount > 0) await batch.commit();

                alert(`✅ Recálculo completado: ${allMatches.length} partidos procesados para ${totalUpdated} jugadores.`);
                console.log(`✅ [LevelService] Global recalculation complete. ${totalUpdated} players updated.`);
                return true;
            } catch (error) {
                console.error("❌ [LevelService] Recalculation failed:", error);
                alert("Error en el recálculo. Revisa la consola.");
                return false;
            }
        }
    }

    window.LevelService = new LevelService();
})();
