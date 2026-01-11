/**
 * AmericanaService.js (Global Version)
 */
(function () {
    class AmericanaService {
        constructor() {
            // Initial assignment
            this.db = this._getCollectionService('americana');

            // Re-check periodically if not initialised
            if (!this.db) {
                let attempts = 0;
                const interval = setInterval(() => {
                    this.db = this._getCollectionService('americana');
                    if (this.db || attempts++ > 10) clearInterval(interval);
                }, 200);
            }
        }

        /**
         * Helper to get the correct collection service (Admin vs Public)
         */
        _getCollectionService(type) {
            if (typeof window.createService === 'function') {
                return (type === 'entreno') ? window.createService('entrenos') : window.createService('americanas');
            } else if (window.FirebaseDB) {
                return (type === 'entreno') ? window.FirebaseDB.entrenos : window.FirebaseDB.americanas;
            }
            return null;
        }

        async getActiveAmericanas() {
            try {
                if (!this.db) return [];
                const all = await this.db.getAll();
                return all
                    .filter(a => a.status !== 'finished')
                    .sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));
            } catch (error) {
                console.error("Error fetching active americanas:", error);
                return [];
            }
        }

        /**
         * Unified method to fetch both Americanas and Entrenos for Dashboard
         */
        async getAllActiveEvents() {
            try {
                const results = await Promise.all([
                    this._getCollectionService('americana')?.getAll() || [],
                    this._getCollectionService('entreno')?.getAll() || []
                ]);

                const [ams, ents] = results;

                const all = [
                    ...ams.map(e => ({ ...e, type: 'americana' })),
                    ...ents.map(e => ({ ...e, type: 'entreno' }))
                ];

                const todayStr = new Date().toISOString().split('T')[0];

                return all
                    .filter(e => e.status !== 'finished' && e.date >= todayStr)
                    .sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));
            } catch (error) {
                console.error("Error fetching all active events:", error);
                return [];
            }
        }

        async addPlayer(americanaId, user, type = 'americana') {
            try {
                // Determine which collection service to use
                const service = this._getCollectionService(type);
                if (!service) throw new Error("Servicio de base de datos no disponible");

                const event = await service.getById(americanaId);
                if (!event) throw new Error("Evento no encontrado (" + type + ")");

                // Check BOTH arrays for legacy/current compatibility
                const players = event.players || [];
                const regPlayers = event.registeredPlayers || [];

                // Unified check for existing UID
                const exists = (players.find(p => p.uid === user.uid || p.id === user.uid)) ||
                    (regPlayers.find(p => p.uid === user.uid || p.id === user.uid));

                if (exists) {
                    throw new Error("Ya estás inscrito en este evento.");
                }

                // GENDER CHECK
                const userGender = user.gender || 'M';
                const cat = event.category || 'open';

                if (cat === 'male' && userGender !== 'M' && userGender !== 'chico') {
                    throw new Error("Este evento es exclusivo para categoría MASCULINA.");
                }
                if (cat === 'female' && userGender !== 'F' && userGender !== 'chica') {
                    throw new Error("Este evento es exclusivo para categoría FEMENINA.");
                }

                const normalizedGender = (userGender === 'M' || userGender === 'chico') ? 'chico' :
                    (userGender === 'F' || userGender === 'chica') ? 'chica' : '?';

                const newPlayerData = {
                    id: user.uid,
                    uid: user.uid,
                    name: user.name || user.displayName || user.email || 'Jugador',
                    level: user.level || user.self_rate_level || '3.5',
                    gender: normalizedGender,
                    joinedAt: new Date().toISOString()
                };

                players.push(newPlayerData);

                // USE THE CORRECT SERVICE (Americanas or Entrenos)
                await service.update(americanaId, {
                    players: players,
                    registeredPlayers: players // Sync both
                });

                // --- NOTIFICATIONS (DISABLED BY REQUEST) ---
                // this.notifyAdminOfRegistration(event, user);

                return { success: true };
            } catch (err) {
                return { success: false, error: err.message };
            }
        }

        notifyAdminOfRegistration(evt, user) {
            // "cuando el jugador se apunta a la americana necesito que automaticamente me llege un mensaje de confirmación al admin"
            const adminPhone = "34649219350"; // Based on admin.js master user
            const msg = `🎾 *NUEVA INSCRIPCIÓN* %0A%0A👤 Jugador: ${user.name} %0A🏆 Evento: ${evt.name} %0A📅 Fecha: ${evt.date} ${evt.time}`;

            // "y al jugaror que le llege tambien una notificacion de que se ha apuntado por whats app"
            // To automate this from client side without user clicking is hard, but we can open one for the ADMIN to see.
            // Ideally, the user sees a "Success" screen with a button "RECIBIR CONFIRMACIÓN" to chat with self or bot.

            // For now, we attempt to open the Admin notification in background or new tab if allowed, 
            // OR allow the user to send it.
            // Since the user asked for "automatic", and we are client-side:
            console.log("🔔 Notifying Admin via WA Link generation...");

            // We can't auto-send. We can only prep result.
            // Let's rely on the Admin Panel 'CHAT' buttons for manual follow up if needed, 
            // BUT here we can try `window.open` if context allows, though it might be blocked.

            const waLink = `https://wa.me/${adminPhone}?text=${msg}`;

            // Hack: Trigger a tiny popup or just console log if we can't force it.
            // A clearer UX is alerting the user "Inscripción Correcta. Avisando al admin..."
            // const win = window.open(waLink, '_blank');
        }

        async removePlayer(americanaId, userId, type = 'americana') {
            try {
                const service = this._getCollectionService(type);
                if (!service) throw new Error("Servicio de base de datos no disponible");

                const event = await service.getById(americanaId);
                if (!event) throw new Error("Evento no encontrado");

                // Check both legacy and current fields
                const currentPlayers = event.players || event.registeredPlayers || [];
                const newPlayers = currentPlayers.filter(p => {
                    const id = (typeof p === 'string') ? p : (p.uid || p.id);
                    return id !== userId;
                });

                const updates = {
                    registeredPlayers: newPlayers,
                    players: newPlayers // Sync both strictly
                };

                // STATUS REVERSION LOGIC: If dropping below required players, revert to 'open'
                const maxCourts = event.max_courts || 4;
                const minPlayers = maxCourts * 4;

                if (event.status === 'live' && newPlayers.length < minPlayers) {
                    updates.status = 'open';
                    console.log(`[AmericanaService] Event ${americanaId} (${type}) reverted to OPEN. Purging matches...`);

                    // Purge matches if reverting to open to avoid stale results
                    await this.purgeMatches(americanaId, type);
                }

                await service.update(americanaId, updates);
                return { success: true };
            } catch (err) {
                console.error(`Error in removePlayer (${type}):`, err);
                return { success: false, error: err.message };
            }
        }

        /**
         * Purge matches for an event when it reverts to OPEN status.
         */
        async purgeMatches(eventId, type = 'americana') {
            try {
                const collectionName = (type === 'entreno') ? 'entrenos_matches' : 'matches';
                const snapshot = await window.db.collection(collectionName)
                    .where('americana_id', '==', eventId)
                    .get();

                if (snapshot.empty) return;

                const batch = window.db.batch();
                snapshot.docs.forEach(doc => {
                    batch.delete(doc.ref);
                });

                await batch.commit();
                console.log(`[AmericanaService] Purged ${snapshot.size} matches from ${collectionName}`);
            } catch (err) {
                console.error("Error purging matches:", err);
            }
        }

        async createAmericana(data) {
            if (!data.name || !data.date) throw new Error("Invalid Americana Data");
            return await this.db.create({
                ...data,
                status: 'draft',
                registeredPlayers: []
            });
        }

        /**
         * Automatically generates matches for the first round of an event
         */
        async generateFirstRoundMatches(eventId, type = 'americana') {
            try {
                console.log(`🎲 [AmericanaService] Automating Round 1 for ${type.toUpperCase()} ${eventId}`);

                const service = this._getCollectionService(type);
                if (!service) throw new Error("No database service available");

                const event = await service.getById(eventId);
                if (!event) return;

                const players = event.players || event.registeredPlayers || [];
                const maxCourts = event.max_courts || 4;
                const pairMode = event.pair_mode || 'rotating';
                const category = event.category || 'open';
                const matchCollection = (type === 'entreno') ? 'entrenos_matches' : 'matches';

                // 1. Check if matches already exist (safety)
                const existing = await window.db.collection(matchCollection)
                    .where('americana_id', '==', eventId)
                    .get();

                if (!existing.empty) {
                    console.log(`⚠️ matches already exist for ${eventId}, skipping auto-generation`);
                    return;
                }

                // 2. Prepare Match data
                let matches = [];

                // NEW: Ensure players have an initial court if they joined via public UI
                // We distribute them sequentially (4 per court)
                const playersWithCourts = players.map((p, i) => ({
                    ...p,
                    current_court: p.current_court || (Math.floor(i / 4) + 1)
                }));

                if (pairMode === 'fixed') {
                    // Logic depends on FixedPairsLogic (loaded in index.html now)
                    if (window.FixedPairsLogic) {
                        let pairs = [];

                        // 1. Check for manual fixed pairs from Admin
                        if (event.fixed_pairs && event.fixed_pairs.length > 0) {
                            console.log(`🔒 Using ${event.fixed_pairs.length} manually defined pairs`);

                            // Convert Admin format to Logic format
                            pairs = event.fixed_pairs.map((p, i) => ({
                                id: `pair_manual_${eventId}_${i}`,
                                player1_id: p.player1.id || p.player1.uid,
                                player2_id: p.player2.id || p.player2.uid,
                                player1_name: p.player1.name,
                                player2_name: p.player2.name,
                                pair_name: `${p.player1.name} / ${p.player2.name}`,
                                wins: 0,
                                losses: 0,
                                games_won: 0,
                                games_lost: 0,
                                // Assign 2 pairs per court: 0,1->Court 1; 2,3->Court 2
                                current_court: Math.floor(i / 2) + 1,
                                initial_court: Math.floor(i / 2) + 1
                            }));

                            // If there are leftover players not in manual pairs, we currently ignore them or they are left out.
                            // Ideally we would randomly pair the remainder, but for this iteration manual means manual.

                        } else {
                            // 2. Fallback to automatic generation
                            pairs = window.FixedPairsLogic.createFixedPairs(playersWithCourts, category);
                        }

                        // Save fixed pairs for persistence (needed by future rounds)
                        await service.update(eventId, { fixed_pairs: pairs });
                        matches = window.FixedPairsLogic.generatePozoRound(pairs, 1, maxCourts);
                    } else {
                        throw new Error("FixedPairsLogic not loaded");
                    }
                } else {
                    // Twister / Rotating
                    if (window.RotatingPozoLogic) {
                        matches = window.RotatingPozoLogic.generateRound(playersWithCourts, 1, maxCourts, category);
                    } else {
                        throw new Error("RotatingPozoLogic not loaded");
                    }
                }

                // 3. Batch write matches
                if (matches.length > 0) {
                    const batch = window.db.batch();
                    matches.forEach(m => {
                        const newMatchRef = window.db.collection(matchCollection).doc();
                        batch.set(newMatchRef, {
                            ...m,
                            americana_id: eventId,
                            status: 'scheduled',
                            score_a: 0,
                            score_b: 0,
                            createdAt: new Date().toISOString()
                        });
                    });

                    // Also update players in the event doc to persist their assigned courts
                    batch.update(window.db.collection(type === 'entreno' ? 'entrenos' : 'americanas').doc(eventId), {
                        players: playersWithCourts,
                        registeredPlayers: playersWithCourts
                    });

                    await batch.commit();
                    console.log(`✅ [AmericanaService] Automatically generated ${matches.length} matches for R1 and assigned initial courts.`);
                }

            } catch (err) {
                console.error("Error in generateFirstRoundMatches:", err);
            }
        }

        /**
         * Automatically generates matches for the NEXT round (R > 1)
         * Supports both ENTRENOS and AMERICANAS
         */
        async generateNextRound(eventId, currentRound, type = 'entreno') {
            try {
                console.log(`🤖 [AmericanaService] Checking Auto-Generation for ${type.toUpperCase()} - Round ${currentRound + 1}...`);

                const nextRound = currentRound + 1;

                const service = this._getCollectionService(type);
                if (!service) throw new Error("No database service available");

                const matchesColl = (type === 'entreno') ? 'entrenos_matches' : 'matches';

                const event = await service.getById(eventId);
                // nextRound already declared above

                if (!event) return;
                if (nextRound > (event.rounds || 6)) {
                    console.log("🏁 Event Reached Max Rounds!");
                    return;
                }

                // 1. Validate ALL matches of current round are finished
                console.log(`🔍 [AmericanaService] Checking Round ${currentRound} for Event ${eventId} (Type: ${type})...`);

                const matchesSnapshot = await window.db.collection(matchesColl)
                    .where('americana_id', '==', eventId)
                    .where('round', '==', currentRound)
                    .get();

                const currentRoundMatches = matchesSnapshot.docs.map(d => d.data());
                const finishedMatches = currentRoundMatches.filter(m => m.status === 'finished');

                console.log(`📊 [AmericanaService] Status: ${finishedMatches.length}/${currentRoundMatches.length} finished.`);
                currentRoundMatches.forEach(m => console.log(`   - Match ${m.id}: ${m.status} (Score: ${m.score_a}-${m.score_b})`));

                const allFinished = currentRoundMatches.length > 0 && currentRoundMatches.every(m => m.status === 'finished');

                if (!allFinished) {
                    console.log(`⏳ [AmericanaService] Round ${currentRound} incomplete. Waiting.`);
                    return;
                }

                // 2. Check if Next Round already exists (prevent double generation)
                console.log(`🔍 [AmericanaService] Checking if Round ${nextRound} exists...`);
                const nextRoundCheck = await window.db.collection(matchesColl)
                    .where('americana_id', '==', eventId)
                    .where('round', '==', nextRound)
                    .get();

                if (!nextRoundCheck.empty) {
                    console.log(`⚠️ [AmericanaService] Round ${nextRound} already exists. Aborting.`);
                    return;
                }

                console.log(`🚀 [AmericanaService] All systems go. Generating Round ${nextRound}...`);

                // 3. Logic Selection (Twister vs Fixed)
                const pairMode = event.pair_mode || 'rotating';
                const maxCourts = event.max_courts || 4;
                const category = event.category || 'open';
                let matches = [];

                // Polyfill for Service (Support Admin & Public) - ALREADY DECLARED ABOVE
                // let service;
                // if (window.createService) {
                //     service = (type === 'entreno') ? window.createService('entrenos') : this.db;
                // } else if (window.FirebaseDB) {
                //     service = (type === 'entreno') ? window.FirebaseDB.entrenos : window.FirebaseDB.americanas;
                // }

                // if (!service) {
                //     console.error("❌ [AmericanaService] No database service available (createService or FirebaseDB missing).");
                //     return;
                // }

                if (pairMode === 'fixed') {
                    // --- POZO / FIJO ---
                    if (!window.FixedPairsLogic) throw new Error("FixedPairsLogic Missing");

                    // a. Update Rankings based on results
                    const currentPairs = event.fixed_pairs || [];
                    console.log("Updating Fixed Rankings...", currentPairs);
                    // NOTE: updatePozoRankings logic should be generic enough, assumes score_a/score_b exist
                    const updatedPairs = window.FixedPairsLogic.updatePozoRankings(currentPairs, currentRoundMatches, maxCourts);

                    // b. Save updated rankings to Event
                    await service.update(eventId, { fixed_pairs: updatedPairs });

                    // c. Generate Next Round
                    matches = window.FixedPairsLogic.generatePozoRound(updatedPairs, nextRound, maxCourts);

                } else {
                    // --- TWISTER / ROTATING ---
                    if (!window.RotatingPozoLogic) throw new Error("RotatingPozoLogic Missing");

                    // a. Update Individual Court Positions
                    const currentPlayers = event.players || [];
                    console.log("Updating Twister Courts...", currentPlayers.length);
                    // NOTE: updatePlayerCourts logic should be generic enough
                    const updatedPlayers = window.RotatingPozoLogic.updatePlayerCourts(currentPlayers, currentRoundMatches, maxCourts);

                    // b. Save updated player states to Event
                    await service.update(eventId, {
                        players: updatedPlayers,
                        registeredPlayers: updatedPlayers // Sync both
                    });

                    // c. Generate Next Round
                    matches = window.RotatingPozoLogic.generateRound(updatedPlayers, nextRound, maxCourts, category);
                }

                // 4. Batch Write New Matches
                if (matches.length > 0) {
                    const batch = window.db.batch();
                    matches.forEach(m => {
                        const newRef = window.db.collection(matchesColl).doc();
                        batch.set(newRef, {
                            ...m,
                            americana_id: eventId,
                            status: 'scheduled',
                            score_a: 0,
                            score_b: 0,
                            createdAt: new Date().toISOString()
                        });
                    });
                    await batch.commit();
                    console.log(`✅ [AmericanaService] Round ${nextRound} Generated Successfully (${matches.length} matches)`);

                    // Optional: Notification toast if UI library available
                    if (window.showToast) window.showToast(`Ronda ${nextRound} Generada!`, 'success');
                }

            } catch (err) {
                console.error("❌ Error generating next round:", err);
            }
        }
    }

    // Initialize immediately if possible, otherwise retry
    if (window.db && (window.createService || window.FirebaseDB)) {
        window.AmericanaService = new AmericanaService();
        console.log("🏆 AmericanaService Global Loaded & Ready");
    } else {
        // Retry with longer timeout for file:// protocol
        let attempts = 0;
        const maxAttempts = 50; // 10 seconds total
        const checkInterval = setInterval(() => {
            attempts++;
            if (window.db && (window.createService || window.FirebaseDB)) {
                window.AmericanaService = new AmericanaService();
                console.log("🏆 AmericanaService Global Loaded & Ready (attempt " + attempts + ")");
                clearInterval(checkInterval);
            } else if (attempts >= maxAttempts) {
                console.error("❌ AmericanaService failed to initialize after", maxAttempts, "attempts");
                console.error("Make sure Firebase is properly configured and loaded");
                clearInterval(checkInterval);
            }
        }, 200);
    }
})();
