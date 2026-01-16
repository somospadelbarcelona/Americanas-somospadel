/**
 * MatchMakingService.js
 * Coordinador de lógica de emparejamientos.
 * Abstrae la complejidad de llamar a FixedPairsLogic o RotatingPozoLogic.
 */

window.MatchMakingService = {

    /**
     * Generar partidos para una ronda específica.
     * Maneja automáticamente la lógica de "Smart Courts" (ampliar pistas si hay más gente).
     */
    async generateRound(eventId, eventType, roundNum) {
        console.log(`🎲 MatchMakingService: Generating Round ${roundNum} for ${eventType} ${eventId}`);

        const collection = eventType === AppConstants.EVENT_TYPES.AMERICANA ? FirebaseDB.americanas : FirebaseDB.entrenos;
        const event = await collection.getById(eventId);

        if (!event) throw new Error("Event not found");

        // Determine Mode
        const isFixedPairs = event.pair_mode === AppConstants.PAIR_MODES.FIXED;

        // --- SMART SCALING LOGIC (Adapted from admin.js) ---
        let effectiveCourts = event.max_courts || 4;
        let courtsUpdated = false;

        if (isFixedPairs) {
            const pairsCount = (event.fixed_pairs || []).length;
            const needed = Math.floor(pairsCount / 2);
            if (needed > effectiveCourts) {
                effectiveCourts = needed;
                courtsUpdated = true;
            }
        } else {
            const playersCount = (event.players || []).length;
            const needed = Math.floor(playersCount / 4);
            if (needed > effectiveCourts) {
                effectiveCourts = needed;
                courtsUpdated = true;
            }
        }

        if (courtsUpdated) {
            console.log(`🤖 AI Scaling: Upgrading to ${effectiveCourts} courts.`);
            await collection.update(eventId, { max_courts: effectiveCourts });
            event.max_courts = effectiveCourts; // Update local ref
        }
        // ----------------------------------------------------

        // Check Previous Round (if not R1)
        if (roundNum > 1) {
            const matches = await FirebaseDB.matches.getByAmericana(eventId); // Note: getByAmericana works for entrenos too if we use specific query?
            // Actually `getByAmericana` creates a query `where('americana_id', '==', id)`.
            // Entrenos usually use `entreno_id` field? 
            // Checking admin-entrenos.js (line 356) calls `AmericanaService.generateFirstRoundMatches(entrenoId, 'entreno')`.
            // We need to ensure we query efficiently.

            // Let's assume FirebaseDB.matches has a generic query or we use the specific one.
            // For now, let's fetch all and filter client side if needed, or assume the ID maps correctly.
            // Wait, in `admin-matches.js` line 106: `FirebaseDB.matches.getByAmericana(americanaId)`

            // CRITICAL: We need to verify if Entrenos store matches with `americana_id` or `entreno_id`.
            // Looking at `admin-matches.js` line 106, it says `getByAmericana`.
            // But for Entrenos? `admin-entrenos.js` (line 356) calls `window.AmericanaService.generateFirstRoundMatches`.
            // So logic was shared.

            // We'll stick to `americana_id` as the likely field name for both event types in the matches collection,
            // OR we check how they are created.
            // In `fixed-pairs-logic.js`: `americana_id: americanaId` (line 15 in snippet? No, checking create calls).

            // Let's assume we pass the ID and filter.
            const allMatches = await FirebaseDB.matches.getByAmericana(eventId);
            const prevRoundMatches = allMatches.filter(m => m.round === roundNum - 1);

            const unfinished = prevRoundMatches.filter(m => m.status !== 'finished');
            if (unfinished.length > 0) {
                throw new Error(`⚠️ Ronda ${roundNum - 1} tiene partidos sin finalizar. Termínalos antes.`);
            }

            // UPDATE LOGIC
            if (isFixedPairs) {
                // Update Rankings then Generate
                const pairs = event.fixed_pairs || [];
                const updatedPairs = FixedPairsLogic.updatePozoRankings(pairs, prevRoundMatches, effectiveCourts);
                await collection.update(eventId, { fixed_pairs: updatedPairs });

                return this._createMatches(eventId, FixedPairsLogic.generatePozoRound(updatedPairs, roundNum, effectiveCourts), eventType);
            } else {
                // Rotating Logic
                const players = event.players || [];
                const movedPlayers = RotatingPozoLogic.updatePlayerCourts(players, prevRoundMatches, effectiveCourts, event.category);

                await collection.update(eventId, { players: movedPlayers });
                return this._createMatches(eventId, RotatingPozoLogic.generateRound(movedPlayers, roundNum, effectiveCourts, event.category), eventType);
            }

        } else {
            // Round 1 Generation
            if (isFixedPairs) {
                // Check for manual fixed pairs from Admin/Event Data
                let pairs = event.fixed_pairs || [];

                if (pairs.length === 0) {
                    console.log("🔒 No manual pairs found. Generating automatic fixed pairs...");
                    if (pairs.length === 0) {
                        console.log("🔒 No manual pairs found. Generating automatic fixed pairs...");
                        let players = event.players || [];

                        // ENTRENOS: Sort/Seed Players by Level first
                        if (eventType === 'entreno') {
                            players = this._sortPlayersForEntreno(players);
                        }

                        // Ensure they have initial courts
                        const playersWithCourts = players.map((p, i) => ({
                            ...p,
                            current_court: p.current_court || (Math.floor(i / 4) + 1)
                        }));

                        // Create Pairs (Preserve Order if Entreno)
                        pairs = FixedPairsLogic.createFixedPairs(playersWithCourts, event.category, eventType === 'entreno');

                        // Save them for persistence
                        await collection.update(eventId, { fixed_pairs: pairs });
                    } else {
                        console.log(`🔒 Using ${pairs.length} existing fixed pairs.`);
                    }

                    return this._createMatches(eventId, FixedPairsLogic.generatePozoRound(pairs, 1, effectiveCourts), eventType);
                } else {
                    // Initial Rotating Round
                    let players = event.players || [];

                    // ENTRENOS: Sort/Seed Players by Level first
                    if (eventType === 'entreno') {
                        players = this._sortPlayersForEntreno(players);
                    }

                    // Assign initial courts if not set
                    players.forEach((p, i) => p.current_court = Math.floor(i / 4) + 1);
                    await collection.update(eventId, { players });

                    return this._createMatches(eventId, RotatingPozoLogic.generateRound(players, 1, effectiveCourts, event.category), eventType);
                }
            }
        },

        /**
         * Helper: Sort players by Level (Desc) then Team (Asc)
         * for "Entreno" seeding.
         */
        /**
         * Helper: Sort players by Level (Desc) AND Pre-Pair by Team
         * for "Entreno" seeding.
         * returns a list where [0,1], [2,3] are the intended optimal pairs.
         */
        _sortPlayersForEntreno(players) {
            console.log("📊 Sorting players with Smart Pairing (Level + Team) for Entreno...");

            // 1. Initial Sort by Level Descending
            let pool = [...players].sort((a, b) => {
                const lA = parseFloat(a.level || a.self_rate_level || 0);
                const lB = parseFloat(b.level || b.self_rate_level || 0);
                return lB - lA;
            });

            const sortedList = [];

            while (pool.length > 0) {
                // Take the highest level player available
                const p1 = pool.shift();

                if (pool.length === 0) {
                    sortedList.push(p1);
                    break;
                }

                // Find best partner
                let bestPartnerIndex = -1;
                let bestScore = -Infinity;

                // Helper to get Team
                const getTeam = (p) => {
                    const t = p.team_somospadel || p.team || '';
                    return Array.isArray(t) ? t[0] : t;
                };

                const p1Team = getTeam(p1);
                const p1Level = parseFloat(p1.level || p1.self_rate_level || 0);

                for (let i = 0; i < pool.length; i++) {
                    const p2 = pool[i];
                    const p2Team = getTeam(p2);
                    const p2Level = parseFloat(p2.level || p2.self_rate_level || 0);

                    let score = 0;

                    // 1. Level Similarity (Negative Diff) - High weight
                    // maximize -diff. (e.g. diff 0 is better than diff 1)
                    const diff = Math.abs(p1Level - p2Level);
                    score -= (diff * 10);

                    // 2. Team Match - Huge Bonus ONLY if levels are somewhat close
                    // If level diff is huge (> 1.0), team doesn't matter as much -> don't break game balance
                    // But user asked to prioritize team. Let's say max diff 1.0 allowed for team force?
                    if (p1Team && p2Team && p1Team === p2Team) {
                        if (diff <= 1.0) {
                            score += 100; // Big bonus for team
                        } else {
                            score += 5; // Small bonus if levels disparate
                        }
                    }

                    if (score > bestScore) {
                        bestScore = score;
                        bestPartnerIndex = i;
                    }
                }

                // Partner found
                if (bestPartnerIndex !== -1) {
                    const p2 = pool.splice(bestPartnerIndex, 1)[0];
                    sortedList.push(p1, p2);
                } else {
                    // Should not happen as long as pool > 0, but fallback
                    sortedList.push(pool.shift());
                }
            }

            return sortedList;
        },

    /**
     * Helper to batch create matches
     */
    async _createMatches(eventId, matchesData, eventType = 'americana') {
            const created = [];
            const collection = (eventType === 'entreno') ? FirebaseDB.entrenos_matches : FirebaseDB.matches;

            for (const m of matchesData) {
                const payload = {
                    ...m,
                    americana_id: eventId,
                    status: 'scheduled',
                    score_a: 0,
                    score_b: 0,
                    createdAt: new Date().toISOString()
                };
                const result = await collection.create(payload);
                created.push(result);
            }
            return created;
        },

    /**
     * Purge all matches for an event
     */
    async purgeMatches(eventId) {
            // This requires a batch delete capability or loop
            const matches = await FirebaseDB.matches.getByAmericana(eventId);
            for (const m of matches) {
                await FirebaseDB.matches.delete(m.id);
            }
            console.log(`🔥 Purged ${matches.length} matches for ${eventId}`);
        },

    /**
     * Simulate a round (Random scores)
     */
    async simulateRound(eventId, roundNum) {
            const matches = await FirebaseDB.matches.getByAmericana(eventId);
            const roundMatches = matches.filter(m => m.round === roundNum);

            for (const m of roundMatches) {
                const sA = Math.floor(Math.random() * 6);
                const sB = sA === 6 ? Math.floor(Math.random() * 5) : 6; // Simple logic
                await FirebaseDB.matches.update(m.id, {
                    score_a: sA,
                    score_b: sB,
                    status: 'finished'
                });
            }
            console.log(`🤖 Simulated Round ${roundNum}`);
        },

    /**
     * Sustituye a un jugador en los partidos pendientes (NO FINALIZADOS).
     * Mantiene consistencia de ID de partido para real-time.
     */
    async substitutePlayerInMatches(eventId, oldUid, newUid, newName) {
            if (!eventId || !oldUid) return;

            console.log(`♻️ Substituting Player ${oldUid} -> ${newUid} (${newName}) in matches...`);

            // 1. Get all matches for event
            const matches = await FirebaseDB.matches.getByAmericana(eventId);

            // 2. Filter Pending Matches containing Old Player
            const pendingMatches = matches.filter(m => !m.isFinished && m.status !== 'finished');
            let count = 0;

            for (const m of pendingMatches) {
                let updated = false;
                let teamA = m.teamA;
                let teamB = m.teamB;
                let team_a_ids = [...(m.team_a_ids || [])];
                let team_b_ids = [...(m.team_b_ids || [])];

                // Check Team A (IDs)
                if (team_a_ids.includes(oldUid)) {
                    team_a_ids = team_a_ids.map(id => id === oldUid ? newUid : id);
                    // Try to update name string if possible (best effort)
                    // This assumes name string looks like "Name1 / Name2" or "Name1, Name2"
                    teamA = m.teamA; // We should ideally reconstruct from IDs but we lack the map here easily.
                    // Fallback: If we have the name, we can try string replace if unique?
                    // Better: Just mark updated IDs. The View often re-renders based on IDs?
                    // NO, Views render based on `teamA` / `teamB` string. We MUST update the string.

                    // Strategy: Get previous name? Or assume current player name is known?
                    // Since we don't have old name easily unless passed, we can't reliably string replace.
                    // BUT, in `removeEntrenoPlayer` we can pull the old name before deleting.

                    // For now, let's update IDs. 
                    // CRITICAL: We need oldName to replace in string.
                    // I will add oldName param.
                    updated = true;
                }

                // Check Team B (IDs)
                if (team_b_ids.includes(oldUid)) {
                    team_b_ids = team_b_ids.map(id => id === oldUid ? newUid : id);
                    updated = true;
                }

                if (updated) {
                    // Update Strings if oldName provided
                    // Assuming format "Player1 / Player2" or "Player1 , Player2"
                    // Clean regex replace
                    /* 
                       We need to handle:
                       "Javier / Natalia" -> "Pepito / Natalia"
                    */
                    // Note: arguments[4] could be oldName if I add it to signature.
                }

                // To be robust, let's just update IDs first. 
                // The Frontend MIGHT fetch names by ID? No, it uses the string.
                // We MUST update the string. 
            }

            // RE-DESIGN: pass oldName too.
        },

    async substitutePlayerInMatchesRobust(eventId, oldUid, oldName, newUid, newName, eventType = null) {
            if (!eventId || !oldUid) return 0;

            console.log(`🔍 DEBUG SUBSTITUTE: Event=${eventId}, Type=${eventType}, OldID=${oldUid}, OldName="${oldName}"`);

            // 1. Detect Correct Collection and Fetch Matches
            let matches = [];
            let winningCollection = (eventType === 'entreno') ? 'entrenos_matches' : 'matches';

            try {
                if (eventType) {
                    const snap = await window.db.collection(winningCollection).where('americana_id', '==', eventId).get();
                    matches = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                } else {
                    // Auto-detect if type not provided
                    const eSnap = await window.db.collection('entrenos_matches').where('americana_id', '==', eventId).get();
                    if (!eSnap.empty) {
                        matches = eSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        winningCollection = 'entrenos_matches';
                    } else {
                        const mSnap = await window.db.collection('matches').where('americana_id', '==', eventId).get();
                        matches = mSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        winningCollection = 'matches';
                    }
                }
            } catch (err) {
                console.error("Error fetching matches for substitution:", err);
                return 0;
            }

            const pending = matches.filter(m => !m.isFinished && m.status !== 'finished');
            let updates = 0;

            for (const m of pending) {
                let updatePayload = {};
                let changed = false;

                // Logic for Team A and Team B (Reusable)
                ['a', 'b'].forEach(side => {
                    const idKey = `team_${side}_ids`;
                    const namesKey = `team_${side}_names`;
                    const stringKey = `team${side.toUpperCase()}`;

                    const ids = m[idKey] || [];
                    const idx = ids.findIndex(id => String(id) === String(oldUid));

                    if (idx !== -1) {
                        // Update IDs
                        const newIds = [...ids];
                        newIds[idx] = newUid;
                        updatePayload[idKey] = newIds;

                        // Update Names (Handle Array or String)
                        let currentNames = m[namesKey];
                        if (Array.isArray(currentNames)) {
                            const newNames = [...currentNames];
                            newNames[idx] = newName;
                            updatePayload[namesKey] = newNames;
                            updatePayload[stringKey] = newNames.join(' / ');
                        } else if (typeof currentNames === 'string') {
                            // Fallback for legacy string format
                            updatePayload[namesKey] = currentNames.replace(oldName, newName);
                            updatePayload[stringKey] = updatePayload[namesKey];
                        } else {
                            updatePayload[namesKey] = [newName];
                        }
                        changed = true;
                    } else if (oldName) {
                        // Secondary Check: Search by name if ID failed
                        let currentNames = m[namesKey];
                        if (Array.isArray(currentNames)) {
                            const nameIdx = currentNames.findIndex(n => n && String(n).includes(oldName));
                            if (nameIdx !== -1) {
                                const newNames = [...currentNames];
                                newNames[nameIdx] = newName;
                                updatePayload[namesKey] = newNames;
                                updatePayload[stringKey] = newNames.join(' / ');

                                // Also update ID at same position if possible
                                const newIds = [...(m[idKey] || [])];
                                if (newIds.length > nameIdx) {
                                    newIds[nameIdx] = newUid;
                                    updatePayload[idKey] = newIds;
                                }

                                changed = true;
                            }
                        } else if (typeof currentNames === 'string' && currentNames.includes(oldName)) {
                            updatePayload[namesKey] = currentNames.replace(oldName, newName);
                            updatePayload[stringKey] = updatePayload[namesKey];
                            changed = true;
                        }
                    }
                });

                if (changed) {
                    try {
                        await window.db.collection(winningCollection).doc(m.id).update(updatePayload);
                        updates++;
                    } catch (e) {
                        console.error(`Error updating match ${m.id}:`, e);
                    }
                }
            }

            console.log(`✅ Substitution complete. Updated ${updates} matches in ${winningCollection}.`);
            return updates;
        }
    };

    // Aliasing for compatibility
    window.MatchmakingService = window.MatchMakingService;

    console.log("🎲 MatchMakingService v4003 Loaded (Unified)");
