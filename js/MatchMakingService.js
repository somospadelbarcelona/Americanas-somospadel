/**
 * MatchMakingService.js
 * Coordinador de lógica de emparejamientos.
 * Abstrae la complejidad de llamar a FixedPairsLogic o RotatingPozoLogic.
 * v5003 - ROOT DEBUG
 */

console.log("🎲 LOADING MATCHMAKING SERVICE v5003 (ROOT)...");

(function () {
    try {
        const MatchMakingService = {

            /**
             * Generar partidos para una ronda específica.
             * Maneja automáticamente la lógica de "Smart Courts" (ampliar pistas si hay más gente).
             */
            async generateRound(eventId, eventType, roundNum, force = false, randomize = false) {
                console.log(`🎲 MatchMakingService: Generating Round ${roundNum} for ${eventType} ${eventId}`);

                // Ensure dependencies exist
                if (typeof window.FirebaseDB === 'undefined') {
                    console.error("❌ FirebaseDB MISSING in MatchMakingService!");
                    throw new Error("FirebaseDB not loaded");
                }

                // Get AppConstants safely
                const APP_CONSTANTS = window.AppConstants || { EVENT_TYPES: { AMERICANA: 'americana' }, PAIR_MODES: { FIXED: 'fixed' } };

                const collection = eventType === APP_CONSTANTS.EVENT_TYPES.AMERICANA ? FirebaseDB.americanas : FirebaseDB.entrenos;
                const event = await collection.getById(eventId);

                if (!event) throw new Error("Event not found");

                // Determine Mode
                let isFixedPairs = (event.pair_mode === APP_CONSTANTS.PAIR_MODES.FIXED) ||
                    (event.fixed_pairs && event.fixed_pairs.length > 0);

                // HEURISTIC: Force Fixed Pairs if name contains "FIJA" or "FIJO" (Case Insensitive)
                if (!isFixedPairs && event.name && (event.name.toUpperCase().includes('FIJA') || event.name.toUpperCase().includes('FIJO'))) {
                    console.log(`🔒 Heuristic: Detected "FIJA/FIJO" in name "${event.name}". Forcing FIXED PAIRS mode.`);
                    isFixedPairs = true;
                }

                // --- SMART SCALING LOGIC ---
                let effectiveCourts = event.max_courts || 4;
                let courtsUpdated = false;

                if (isFixedPairs) {
                    const pairsCount = (event.fixed_pairs || []).length;
                    const needed = Math.ceil(pairsCount / 2);
                    if (needed !== effectiveCourts && needed > 0) {
                        effectiveCourts = needed;
                        courtsUpdated = true;
                    }
                } else {
                    const playersCount = (event.players || []).length;
                    const needed = Math.ceil(playersCount / 4);
                    if (needed !== effectiveCourts && needed > 0) {
                        effectiveCourts = needed;
                        courtsUpdated = true;
                    }
                }

                if (courtsUpdated) {
                    console.log(`🤖 AI Scaling: Upgrading to ${effectiveCourts} courts.`);
                    await collection.update(eventId, { max_courts: effectiveCourts });
                    event.max_courts = effectiveCourts; // Update local ref
                }

                // --- GENERATION LOGIC ---

                // Check Previous Round (if not R1)
                if (roundNum > 1) {
                    // FIX: Use correct collection to fetch previous matches
                    const matchesCollection = (eventType === 'entreno') ? FirebaseDB.entrenos_matches : FirebaseDB.matches;
                    const matches = await matchesCollection.getByAmericana(eventId);

                    const prevRoundMatches = matches.filter(m => parseInt(m.round) === (roundNum - 1));

                    const unfinished = prevRoundMatches.filter(m => m.status !== 'finished');
                    if (unfinished.length > 0 && !force) {
                        console.warn(`⚠️ BLOCKED: R${roundNum - 1} has ${unfinished.length} unfinished matches.`);
                        throw new Error(`⚠️ Ronda ${roundNum - 1} tiene partidos sin finalizar. Termínalos antes.`);
                    } else if (unfinished.length > 0 && force) {
                        console.log(`⏩ FORCED: Proceeding even if R${roundNum - 1} has unfinished matches.`);
                    } else {
                        console.log(`✅ Previous round R${roundNum - 1} is fully finished. Proceeding...`);
                    }

                    // UPDATE LOGIC
                    if (isFixedPairs) {
                        // Update Rankings then Generate
                        const pairs = event.fixed_pairs || [];
                        if (!window.FixedPairsLogic) throw new Error("FixedPairsLogic not loaded");

                        const updatedPairs = FixedPairsLogic.updatePozoRankings(pairs, prevRoundMatches, effectiveCourts);
                        await collection.update(eventId, { fixed_pairs: updatedPairs });

                        return this._createMatches(eventId, FixedPairsLogic.generatePozoRound(updatedPairs, roundNum, effectiveCourts), eventType);
                    } else {
                        // Rotating Logic
                        const players = event.players || [];
                        let movedPlayers;
                        console.log(`🔄 Generating Rotating Round ${roundNum} for ${eventType}...`);

                        if (!window.RotatingPozoLogic) throw new Error("RotatingPozoLogic not loaded");

                        if (eventType === 'entreno') {
                            // Entreno R2+: Use Standard Pozo Movement
                            console.log("🏃‍♂️ Using Entreno Pozo Movement...");
                            movedPlayers = RotatingPozoLogic.updatePlayerCourts(players, prevRoundMatches, effectiveCourts, 'open');
                        } else {
                            // Americana/Pozo
                            console.log("🎾 Using Americana Pozo Movement...");
                            movedPlayers = RotatingPozoLogic.updatePlayerCourts(players, prevRoundMatches, effectiveCourts, event.category);
                        }
                        await collection.update(eventId, { players: movedPlayers });
                        console.log("✅ Player courts updated.");

                        const genCategory = eventType === 'entreno' ? 'entreno' : event.category;
                        const newMatches = RotatingPozoLogic.generateRound(movedPlayers, roundNum, effectiveCourts, genCategory);

                        console.log(`✨ Generated ${newMatches.length} new matches.`);
                        return this._createMatches(eventId, newMatches, eventType);
                    }

                } else {
                    // Round 1 Generation
                    if (isFixedPairs) {
                        if (!window.FixedPairsLogic) throw new Error("FixedPairsLogic not loaded");

                        let pairs = event.fixed_pairs || [];

                        if (randomize && pairs.length > 0) {
                            console.log("🎲 Randomize requested: Clearing existing fixed pairs to force new random couples!");
                            pairs = [];
                        }

                        if (pairs.length === 0) {
                            console.log("🔒 No manual pairs found. Generating automatic fixed pairs...");
                            let players = event.players || [];

                            if (eventType === 'entreno') {
                                players = this._sortPlayersForEntreno(players, randomize);
                            } else if (randomize) {
                                console.log("🎲 Randomizing pairs (forcing shuffle)...");
                                for (let i = players.length - 1; i > 0; i--) {
                                    const j = Math.floor(Math.random() * (i + 1));
                                    [players[i], players[j]] = [players[j], players[i]];
                                }
                            }

                            // Ensure they have initial courts — ALWAYS recalculate from position
                            // (never reuse stale current_court from previous rounds)
                            const playersWithCourts = players.map((p, i) => ({
                                ...p,
                                current_court: Math.floor(i / 4) + 1,
                                last_partner: null  // Clear last_partner so SmartPairs doesn't repeat
                            }));

                            pairs = FixedPairsLogic.createFixedPairs(playersWithCourts, event.category, eventType === 'entreno');
                            await collection.update(eventId, { fixed_pairs: pairs });
                        } else {
                            console.log(`🔒 Using ${pairs.length} existing fixed pairs.`);
                        }

                        // ✅ RESET: Restore initial courts before Round 1
                        // Without this, pairs retain courts from previous rounds
                        pairs = pairs.map((p, i) => ({
                            ...p,
                            current_court: p.initial_court || (Math.floor(i / 2) + 1),
                            wins: 0,
                            losses: 0,
                            games_won: 0,
                            games_lost: 0,
                            won_last_match: false
                        }));
                        await collection.update(eventId, { fixed_pairs: pairs });

                        return this._createMatches(eventId, FixedPairsLogic.generatePozoRound(pairs, 1, effectiveCourts), eventType);
                    } else {
                        // Initial Rotating Round
                        if (!window.RotatingPozoLogic) throw new Error("RotatingPozoLogic not loaded");

                        let players = event.players || [];

                        if (eventType === 'entreno') {
                            players = this._sortPlayersForEntreno(players, randomize);
                        } else if (randomize) {
                            console.log("🎲 Randomizing players (forcing shuffle)...");
                            for (let i = players.length - 1; i > 0; i--) {
                                const j = Math.floor(Math.random() * (i + 1));
                                [players[i], players[j]] = [players[j], players[i]];
                            }
                        }

                        // ALWAYS recalculate courts from scratch (never reuse stale values)
                        players.forEach((p, i) => {
                            p.current_court = Math.floor(i / 4) + 1;
                            if (randomize) p.last_partner = null; // Clear last_partner so SmartPairs generates fresh
                        });
                        await collection.update(eventId, { players });

                        // FIX: For entrenos, always use 'entreno' category so _createEntrenoPairs is used
                        const genCat = eventType === 'entreno' ? 'entreno' : event.category;
                        return this._createMatches(eventId, RotatingPozoLogic.generateRound(players, 1, effectiveCourts, genCat), eventType);
                    }
                }
            },

            /**
             * Helper: Sort players by Level (Desc) AND Pre-Pair by Team
             * for "Entreno" seeding.
             */
            _sortPlayersForEntreno(players, randomize = false) {
                console.log("📊 Sorting players with Smart Pairing (Level + Team) for Entreno... Randomize:", randomize);

                // 1. Initial Sort by Level Descending
                let pool = [...players];
                
                if (randomize) {
                    // Small shuffle first so players with exact same level swap positions
                    for (let i = pool.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [pool[i], pool[j]] = [pool[j], pool[i]];
                    }
                }

                pool.sort((a, b) => {
                    // Jitter level when randomizing to swap players on same court boundaries (+/- 0.07)
                    const jitterA = randomize ? (Math.random() * 0.15 - 0.075) : 0;
                    const jitterB = randomize ? (Math.random() * 0.15 - 0.075) : 0;
                    const lA = parseFloat(a.level || a.self_rate_level || 0) + jitterA;
                    const lB = parseFloat(b.level || b.self_rate_level || 0) + jitterB;
                    return lB - lA;
                });

                const sortedList = [];

                while (pool.length > 0) {
                    // Pick the highest level player available
                    const p1 = pool.shift();

                    if (pool.length === 0) {
                        sortedList.push(p1);
                        break;
                    }

                    // Find best partner
                    let bestPartnerIndex = -1;

                    const getTeam = (p) => {
                        const t = p.team_somospadel || p.team || ''; 
                        return Array.isArray(t) ? t[0] : t;
                    };

                    const p1Team = getTeam(p1);
                    const p1Level = parseFloat(p1.level || p1.self_rate_level || 0);

                    // 1. Priority 1: SAME TEAM (within 0.65 level diff max)
                    let teamCandidates = [];
                    if (p1Team) {
                        for (let i = 0; i < pool.length; i++) {
                            if (getTeam(pool[i]) === p1Team) {
                                const p2Level = parseFloat(pool[i].level || pool[i].self_rate_level || 0);
                                if (Math.abs(p1Level - p2Level) <= 0.65) {
                                    teamCandidates.push(i);
                                }
                            }
                        }
                    }

                    // RANDOMIZATION TWEAK: When randomize=true, we don't ALWAYS pick the teammate if we want variety.
                    if (teamCandidates.length > 0) {
                        const forceTeam = !randomize || Math.random() > 0.35;
                        if (forceTeam) {
                            bestPartnerIndex = randomize ? teamCandidates[Math.floor(Math.random() * teamCandidates.length)] : teamCandidates[0];
                            console.log(`🎲 [Matchmaking] Teammate selected (Chance: ${forceTeam}).`);
                        } else {
                            console.log("🎲 [Matchmaking] Randomly skipping teammate to increase variety.");
                        }
                    }

                    // 2. Priority 2: CLOSEST LEVEL (within 0.4 diff)
                    if (bestPartnerIndex === -1) {
                        let levelCandidates = [];
                        for (let i = 0; i < pool.length; i++) {
                            const p2Level = parseFloat(pool[i].level || pool[i].self_rate_level || 0);
                            if (Math.abs(p1Level - p2Level) <= 0.4) {
                                levelCandidates.push(i);
                            }
                        }
                        if (levelCandidates.length > 0) {
                            bestPartnerIndex = randomize ? levelCandidates[Math.floor(Math.random() * levelCandidates.length)] : levelCandidates[0];
                        }
                    }

                    // 3. Priority 3: BEST REMAINING (Closest level)
                    if (bestPartnerIndex === -1 && pool.length > 0) {
                        if (randomize) {
                            // Pick from top 4 closest to introduce variety
                            const lookahead = Math.min(4, pool.length);
                            bestPartnerIndex = Math.floor(Math.random() * lookahead);
                        } else {
                            bestPartnerIndex = 0;
                        }
                    }

                    if (bestPartnerIndex !== -1) {
                        const p2 = pool.splice(bestPartnerIndex, 1)[0];
                        sortedList.push(p1, p2);
                        console.log(`🤝 Paired ${p1.name} (${p1.level}) w/ ${p2.name} (${p2.level})`);
                    } else {
                        sortedList.push(pool.shift());
                    }
                }

                // Final verify: Sort the PAIRS by their combined level to ensure Court 1 gets the best pairs
                const pairs = [];
                for (let i = 0; i < sortedList.length; i += 2) {
                    if (i + 1 < sortedList.length) {
                        pairs.push([sortedList[i], sortedList[i + 1]]);
                    } else {
                        pairs.push([sortedList[i]]); // Straggler
                    }
                }

                pairs.sort((pairA, pairB) => {
                    const levA = (parseFloat(pairA[0].level || 0) + parseFloat(pairA[1]?.level || 0)) / pairA.length;
                    const levB = (parseFloat(pairB[0].level || 0) + parseFloat(pairB[1]?.level || 0)) / pairB.length;
                    return levB - levA; // Descending
                });

                return pairs.flat();
            },


            async _createMatches(eventId, matchesData, eventType = 'americana') {
                const created = [];
                const colName = (eventType === 'entreno') ? 'entrenos_matches' : 'matches';
                const dbCol = window.db.collection(colName);

                // --- DUPLICATE PROTECTION ---
                // Fetch existing matches for this round to avoid double creation
                const roundNum = matchesData.length > 0 ? parseInt(matchesData[0].round) : 0;
                const existingSnap = await dbCol.where('americana_id', '==', eventId).where('round', '==', roundNum).get();
                const existingCourts = new Set(existingSnap.docs.map(doc => parseInt(doc.data().court)));

                // 🛡️ OPTIMIZATION: Use WriteBatch to prevent 429 errors when generating many courts
                const batch = window.db.batch();
                let batchCount = 0;

                for (const m of matchesData) {
                    const court = parseInt(m.court);
                    if (existingCourts.has(court)) {
                        console.warn(`⚠️ Skipping duplicate creation for Round ${roundNum} Pista ${court}`);
                        continue;
                    }

                    const payload = {
                        ...m,
                        americana_id: eventId,
                        round: roundNum,
                        status: 'scheduled',
                        score_a: 0,
                        score_b: 0,
                        createdAt: new Date().toISOString()
                    };
                    
                    const newDocRef = dbCol.doc();
                    batch.set(newDocRef, payload);
                    created.push({ id: newDocRef.id, ...payload });
                    batchCount++;
                }

                if (batchCount > 0) {
                    await batch.commit();
                    console.log(`✅ [BATCH] Created ${batchCount} matches safely without hitting rate limits.`);
                }
                
                return created;
            },

            /**
             * Clean up duplicated matches in a round
             */
            async sanitizeRound(eventId, eventType, round) {
                const colName = (eventType === 'entreno') ? 'entrenos_matches' : 'matches';
                const dbCol = window.db.collection(colName);
                const snap = await dbCol.where('americana_id', '==', eventId).where('round', '==', parseInt(round)).get();
                
                const matches = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                const courtMap = {};
                let deleted = 0;

                // 🛡️ OPTIMIZATION: Use WriteBatch to prevent 429 limits during cleanup
                const batch = window.db.batch();

                for (const m of matches) {
                    const court = parseInt(m.court);
                    if (!courtMap[court]) {
                        courtMap[court] = m;
                    } else {
                        // Conflict! Keep the finished one or the first one
                        const existing = courtMap[court];
                        let toDelete;
                        if (m.status === 'finished' && existing.status !== 'finished') {
                            toDelete = existing.id;
                            courtMap[court] = m;
                        } else {
                            toDelete = m.id;
                        }
                        batch.delete(dbCol.doc(toDelete));
                        deleted++;
                    }
                }
                
                if (deleted > 0) {
                    await batch.commit();
                    console.log(`🧹 [BATCH] Sanitized and deleted ${deleted} duplicate matches safely.`);
                }
                
                return { deleted };
            },

            /**
             * Delete all rounds after a specific point (Re-generation tool)
             */
            async purgeSubsequentRounds(eventId, roundNum, eventType) {
                const colName = (eventType === 'entreno') ? 'entrenos_matches' : 'matches';
                const dbCol = window.db.collection(colName);
                const snap = await dbCol.where('americana_id', '==', eventId).get();
                
                const batch = window.db.batch();
                let count = 0;
                snap.docs.forEach(doc => {
                    const data = doc.data();
                    if (parseInt(data.round) > parseInt(roundNum)) {
                        batch.delete(doc.ref);
                        count++;
                    }
                });

                if (count > 0) await batch.commit();
                console.log(`🧹 Purged ${count} matches from rounds > ${roundNum}`);
                return count;
            },

            /**
             * Simulate a round (Random scores)
             */
            async simulateRound(eventId, roundNum, eventType = 'americana') {
                console.warn("⚠️ [MatchMakingService root] SIMULATION DISABLED BY ADMIN POLICY. No results generated.");
                return;
            },

            /**
            * Robust Player Substitution
            */
            async substitutePlayerInMatchesRobust(eventId, oldUid, oldName, newUid, newName, eventType = null) {
                if (!eventId || !oldUid) return 0;

                console.log(`🔍 DEBUG SUBSTITUTE: Event=${eventId}, Type=${eventType}, OldID=${oldUid}, OldName="${oldName}"`);

                let matches = [];
                let winningCollection = (eventType === 'entreno') ? 'entrenos_matches' : 'matches';

                try {
                    if (eventType) {
                        const snap = await window.db.collection(winningCollection).where('americana_id', '==', eventId).get();
                        matches = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    } else {
                        // Auto-detect
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
                let updatesCount = 0;

                // 🛡️ [OPTIMIZATION] Use WriteBatch to prevent 429 errors
                const batch = window.db.batch();
                let batchHasData = false;

                for (const m of pending) {
                    let updatePayload = {};
                    let changed = false;

                    ['a', 'b'].forEach(side => {
                        const idKey = `team_${side}_ids`;
                        const namesKey = `team_${side}_names`;
                        const stringKey = `team${side.toUpperCase()}`;

                        const ids = m[idKey] || [];
                        const idx = ids.findIndex(id => String(id) === String(oldUid));

                        if (idx !== -1) {
                            const newIds = [...ids];
                            newIds[idx] = newUid;
                            updatePayload[idKey] = newIds;

                            let currentNames = m[namesKey];
                            if (Array.isArray(currentNames)) {
                                const newNames = [...currentNames];
                                newNames[idx] = newName;
                                updatePayload[namesKey] = newNames;
                                updatePayload[stringKey] = newNames.join(' / ');
                            } else if (typeof currentNames === 'string') {
                                updatePayload[namesKey] = currentNames.replace(oldName, newName);
                                updatePayload[stringKey] = updatePayload[namesKey];
                            } else {
                                updatePayload[namesKey] = [newName];
                            }
                            changed = true;
                        }
                    });

                    if (changed) {
                        const ref = window.db.collection(winningCollection).doc(m.id);
                        batch.update(ref, updatePayload);
                        updatesCount++;
                        batchHasData = true;
                    }
                }

                if (batchHasData) {
                    try {
                        await batch.commit();
                        console.log(`✅ Batch commit success: Updated ${updatesCount} matches.`);
                    } catch (e) {
                        console.error(`❌ Batch commit failed:`, e);
                        return 0;
                    }
                }

                console.log(`✅ Substitution complete. Updated ${updatesCount} matches in ${winningCollection}.`);
                return updatesCount;
            }
        };

        // EXPORT GLOBALLY
        window.MatchMakingService = MatchMakingService;
        window.MatchmakingService = MatchMakingService; // Alias

        console.log("✅ MatchMakingService EXPORTED SUCCESSFULLY!");

    } catch (err) {
        console.error("❌ CRITICAL ERROR LOADING MATCHMAKING SERVICE:", err);
        // Fallback or Alert?
        window.MatchMakingServiceError = err;
    }
})();
