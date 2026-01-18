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
            async generateRound(eventId, eventType, roundNum) {
                console.log(`🎲 MatchMakingService: Generating Round ${roundNum} for ${eventType} ${eventId}`);

                // Ensure dependencies exist
                if (typeof window.FirebaseDB === 'undefined') throw new Error("FirebaseDB not loaded");

                // Get AppConstants safely
                const APP_CONSTANTS = window.AppConstants || { EVENT_TYPES: { AMERICANA: 'americana' }, PAIR_MODES: { FIXED: 'fixed' } };

                const collection = eventType === APP_CONSTANTS.EVENT_TYPES.AMERICANA ? FirebaseDB.americanas : FirebaseDB.entrenos;
                const event = await collection.getById(eventId);

                if (!event) throw new Error("Event not found");

                // Determine Mode
                const isFixedPairs = event.pair_mode === APP_CONSTANTS.PAIR_MODES.FIXED;

                // --- SMART SCALING LOGIC ---
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

                // --- GENERATION LOGIC ---

                // Check Previous Round (if not R1)
                if (roundNum > 1) {
                    // FIX: Use correct collection to fetch previous matches
                    const matchesCollection = (eventType === 'entreno') ? FirebaseDB.entrenos_matches : FirebaseDB.matches;
                    const matches = await matchesCollection.getByAmericana(eventId);

                    const prevRoundMatches = matches.filter(m => parseInt(m.round) === (roundNum - 1));

                    const unfinished = prevRoundMatches.filter(m => m.status !== 'finished');
                    if (unfinished.length > 0) {
                        throw new Error(`⚠️ Ronda ${roundNum - 1} tiene partidos sin finalizar. Termínalos antes.`);
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

                        if (!window.RotatingPozoLogic) throw new Error("RotatingPozoLogic not loaded");

                        if (eventType === 'entreno') {
                            // Entreno R2+: Use Standard Pozo Movement
                            movedPlayers = RotatingPozoLogic.updatePlayerCourts(players, prevRoundMatches, effectiveCourts, 'open');
                        } else {
                            // Americana/Pozo
                            movedPlayers = RotatingPozoLogic.updatePlayerCourts(players, prevRoundMatches, effectiveCourts, event.category);
                        }
                        await collection.update(eventId, { players: movedPlayers });

                        const genCategory = eventType === 'entreno' ? 'entreno' : event.category;
                        return this._createMatches(eventId, RotatingPozoLogic.generateRound(movedPlayers, roundNum, effectiveCourts, genCategory), eventType);
                    }

                } else {
                    // Round 1 Generation
                    if (isFixedPairs) {
                        if (!window.FixedPairsLogic) throw new Error("FixedPairsLogic not loaded");

                        let pairs = event.fixed_pairs || [];

                        if (pairs.length === 0) {
                            console.log("🔒 No manual pairs found. Generating automatic fixed pairs...");
                            let players = event.players || [];

                            if (eventType === 'entreno') {
                                players = this._sortPlayersForEntreno(players);
                            }

                            // Ensure they have initial courts
                            const playersWithCourts = players.map((p, i) => ({
                                ...p,
                                current_court: p.current_court || (Math.floor(i / 4) + 1)
                            }));

                            pairs = FixedPairsLogic.createFixedPairs(playersWithCourts, event.category, eventType === 'entreno');
                            await collection.update(eventId, { fixed_pairs: pairs });
                        } else {
                            console.log(`🔒 Using ${pairs.length} existing fixed pairs.`);
                        }

                        return this._createMatches(eventId, FixedPairsLogic.generatePozoRound(pairs, 1, effectiveCourts), eventType);
                    } else {
                        // Initial Rotating Round
                        if (!window.RotatingPozoLogic) throw new Error("RotatingPozoLogic not loaded");

                        let players = event.players || [];

                        if (eventType === 'entreno') {
                            players = this._sortPlayersForEntreno(players);
                        }

                        players.forEach((p, i) => p.current_court = Math.floor(i / 4) + 1);
                        await collection.update(eventId, { players });

                        return this._createMatches(eventId, RotatingPozoLogic.generateRound(players, 1, effectiveCourts, event.category), eventType);
                    }
                }
            },

            /**
             * Helper: Sort players by Level (Desc) AND Pre-Pair by Team
             * for "Entreno" seeding.
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
                    const p1 = pool.shift();
                    if (pool.length === 0) {
                        sortedList.push(p1);
                        break;
                    }

                    // Find best partner
                    let bestPartnerIndex = -1;
                    let bestScore = -Infinity;

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
                        const diff = Math.abs(p1Level - p2Level);
                        score -= (diff * 10);

                        if (p1Team && p2Team && p1Team === p2Team) {
                            if (diff <= 1.0) score += 100;
                            else score += 5;
                        }

                        if (score > bestScore) {
                            bestScore = score;
                            bestPartnerIndex = i;
                        }
                    }

                    if (bestPartnerIndex !== -1) {
                        const p2 = pool.splice(bestPartnerIndex, 1)[0];
                        sortedList.push(p1, p2);
                    } else {
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
                // Check if FirebaseDB.entrenos_matches exists
                let collection = (eventType === 'entreno') ? window.FirebaseDB?.entrenos_matches : window.FirebaseDB?.matches;

                if (!collection) {
                    const colName = (eventType === 'entreno') ? 'entrenos_matches' : 'matches';
                    console.log(`⚠️ MatchMakingService: Wrapper for ${colName} missing. Using raw DB.`);
                    collection = {
                        create: async (data) => {
                            const ref = await window.db.collection(colName).add(data);
                            return { id: ref.id, ...data };
                        }
                    };
                }

                for (const m of matchesData) {
                    const payload = {
                        ...m,
                        americana_id: eventId,
                        round: parseInt(m.round),
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
             * Simulate a round (Random scores)
             */
            async simulateRound(eventId, roundNum, eventType = 'americana') {
                const matchesCollection = (eventType === 'entreno') ? FirebaseDB.entrenos_matches : FirebaseDB.matches;
                const matches = await matchesCollection.getByAmericana(eventId);
                const roundMatches = matches.filter(m => parseInt(m.round) === roundNum);

                for (const m of roundMatches) {
                    const sA = Math.floor(Math.random() * 6);
                    const sB = sA === 6 ? Math.floor(Math.random() * 5) : 6;
                    await matchesCollection.update(m.id, {
                        score_a: sA,
                        score_b: sB,
                        status: 'finished'
                    });
                }
                console.log(`🤖 Simulated Round ${roundNum} for collection ${eventType} (ROOT)`);
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
                        try {
                            await window.db.collection(winningCollection).doc(m.id).update(updatePayload);
                            updatesCount++;
                        } catch (e) {
                            console.error(`Error updating match ${m.id}:`, e);
                        }
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
