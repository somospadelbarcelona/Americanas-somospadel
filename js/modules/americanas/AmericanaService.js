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

                // --- AUTO-FILL VACANCIES IN MATCHES (Global Fix) ---
                // If the event has active matches with VACANT spots, fill them immediately.
                if (window.MatchMakingService) {
                    const matchColl = (type === 'entreno') ? 'entrenos_matches' : 'matches';
                    const hasMatches = await window.db.collection(matchColl).where('americana_id', '==', americanaId).limit(1).get();

                    if (!hasMatches.empty) {
                        console.log(`🔍 [Service] New player ${user.name} joined active event. Checking for vacancies...`);
                        // Try standard variants of VACANT
                        await window.MatchMakingService.substitutePlayerInMatchesRobust(americanaId, 'VACANT', '🔴 VACANTE', user.uid, user.name);
                        await window.MatchMakingService.substitutePlayerInMatchesRobust(americanaId, 'VACANT', 'VACANTE', user.uid, user.name);
                        await window.MatchMakingService.substitutePlayerInMatchesRobust(americanaId, 'VACANT', 'VACANT', user.uid, user.name);
                    }
                }

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

        /**
         * Delete a specific round (used for regenerating logic)
         */
        async deleteRound(eventId, round, type = 'americana') {
            try {
                const collectionName = (type === 'entreno') ? 'entrenos_matches' : 'matches';
                const snapshot = await window.db.collection(collectionName)
                    .where('americana_id', '==', eventId)
                    .where('round', '==', parseInt(round))
                    .get();

                if (snapshot.empty) return 0;

                const batch = window.db.batch();
                snapshot.docs.forEach(doc => {
                    batch.delete(doc.ref);
                });

                await batch.commit();
                console.log(`[AmericanaService] Deleted Round ${round} (${snapshot.size} matches)`);
                return snapshot.size;
            } catch (err) {
                console.error("Error deleting round:", err);
                throw err;
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
                if (!window.MatchMakingService) throw new Error("MatchMakingService not loaded");
                console.log(`🎲 [AmericanaService] Delegating R1 generation to MatchMakingService for ${type} ${eventId}`);
                return await window.MatchMakingService.generateRound(eventId, type, 1);
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
                if (!window.MatchMakingService) throw new Error("MatchMakingService not loaded");
                console.log(`🤖 [AmericanaService] Delegating Next Round generation to MatchMakingService for ${type} ${eventId}`);
                return await window.MatchMakingService.generateRound(eventId, type, currentRound + 1);
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
