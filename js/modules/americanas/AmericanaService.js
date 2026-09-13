/**
 * AmericanaService.js (Global Version)
 */
(function () {
    window.AmericanaServiceClass = class AmericanaService {
        constructor() {
            // Centralized loading via AppInit guarantees dependencies are ready.
            this.db = this._getCollectionService('americana');
        }

        validateGender(category, userGender) {
            const cat = (category || 'open').toLowerCase();
            const g = (userGender || '').toLowerCase();
            const isChico = g === 'm' || g === 'chico' || g === 'male';
            const isChica = g === 'f' || g === 'chica' || g === 'female';

            if (cat === 'masculina' && !isChico) {
                throw new Error("⛔ Categoría MASCULINA: Solo permitida para chicos.");
            }
            if (cat === 'femenina' && !isChica) {
                throw new Error("⛔ Categoría FEMENINA: Solo permitida para chicas.");
            }
            if (cat === 'mixta' && !isChico && !isChica) {
                throw new Error("⛔ Categoría MIXTA: Debes definir tu género en el perfil.");
            }
            return true;
        }

        /**
         * Normaliza fechas de DD/MM/YYYY a YYYY-MM-DD para comparaciones/sorting
         */
        _normalizeDate(d) {
            if (!d) return '9999-99-99';
            if (d.includes('/')) {
                const parts = d.split('/');
                if (parts[2]?.length === 4) { // DD/MM/YYYY
                    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                }
            }
            return d; // Asumimos YYYY-MM-DD
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
                const today = new Date().toISOString().split('T')[0];
                return all
                    .filter(a => a.status !== 'finished' && (this._normalizeDate(a.date) >= today || a.status === 'live'))
                    .sort((a, b) => {
                        const dateA = this._normalizeDate(a.date);
                        const dateB = this._normalizeDate(b.date);
                        return new Date(dateA + 'T' + (a.time || '00:00')) - new Date(dateB + 'T' + (b.time || '00:00'));
                    });
            } catch (error) {
                console.error("Error fetching active americanas:", error);
                return [];
            }
        }

        /**
         * Enuelve una promesa con un tiempo límite de expiración (timeout)
         */
        _withTimeout(promise, ms, defaultValue = []) {
            let timeoutId;
            const timeoutPromise = new Promise((resolve) => {
                timeoutId = setTimeout(() => {
                    console.warn(`⏳ [AmericanaService] Promesa expirada tras ${ms}ms. Usando valor por defecto.`);
                    resolve(defaultValue);
                }, ms);
            });
            return Promise.race([
                promise.then(val => {
                    clearTimeout(timeoutId);
                    return val;
                }),
                timeoutPromise
            ]);
        }

        /**
         * Unified method to fetch both Americanas and Entrenos for Dashboard
         */
        async getAllActiveEvents() {
            try {
                const results = await this._withTimeout(
                    Promise.all([
                        this._getCollectionService('americana')?.getAll() || [],
                        this._getCollectionService('entreno')?.getAll() || []
                    ]),
                    4000,
                    [[], []]
                );

                const [ams, ents] = results;

                const all = [
                    ...ams.map(e => {
                        const title = (e.name || e.title || e.eventName || '').toLowerCase();
                        const format = (e.format || e.mode || '').toLowerCase();
                        const isEnt = e.type === 'entreno' || title.includes('entreno') || title.includes('pozo') || title.includes('clase') || format.includes('entreno') || format.includes('pozo');
                        return { ...e, type: isEnt ? 'entreno' : (e.type || 'americana') };
                    }),
                    ...ents.map(e => ({ ...e, type: 'entreno' }))
                ];

                const today = new Date().toISOString().split('T')[0];

                return all
                    .filter(e => e.status !== 'finished' && (this._normalizeDate(e.date) >= today || e.status === 'live'))
                    .sort((a, b) => {
                        const dateA = this._normalizeDate(a.date);
                        const dateB = this._normalizeDate(b.date);
                        return new Date(dateA + 'T' + (a.time || '00:00')) - new Date(dateB + 'T' + (b.time || '00:00'));
                    });
            } catch (error) {
                console.error("Error fetching all active events:", error);
                return [];
            }
        }

        async addPlayer(americanaId, user, type = 'americana', partnerName = null, partnerId = null) {
            const logId = `[QUICK-JOIN-${americanaId.substring(0,5)}]`;
            console.log(`⚡ ${logId} Iniciando inscripción ultra-rápida...`);

            try {
                if (!user) return { success: false, error: "Sesión expirada. Recarga la página." };

                const db = window.db;
                const collectionName = (type === 'entreno') ? 'entrenos' : 'americanas';
                const eventRef = db.collection(collectionName).doc(americanaId);

                // 1. LECTURA RÁPIDA (Pre-validación)
                const doc = await eventRef.get();
                if (!doc.exists) throw new Error("Evento no encontrado.");

                const event = doc.data();
                const players = event.players || [];
                const userUid = user.uid || user.id;

                // Verificar si ya está dentro
                if (players.find(p => p.uid === userUid || p.id === userUid)) {
                    return { success: true, alreadyIn: true }; // Ya estaba, éxito silencioso
                }

                // Verificar capacidad (permitimos un margen de 1-2 por seguridad de concurrencia)
                const maxPlayers = (parseInt(event.max_courts) || 4) * 4;
                if (players.length >= maxPlayers + 2) {
                    throw new Error("El evento se ha llenado hace unos instantes.");
                }

                this.validateGender(event.category, user.gender);

                // 2. PREPARAR DATOS
                const newPlayerData = {
                    id: userUid, uid: userUid,
                    name: (user.name || 'Jugador').toUpperCase(),
                    level: user.level || '3.5',
                    team_somospadel: user.team_somospadel || [],
                    gender: (user.gender === 'F' || user.gender === 'chica') ? 'chica' : 'chico',
                    joinedAt: new Date().toISOString()
                };

                const updates = {
                    players: firebase.firestore.FieldValue.arrayUnion(newPlayerData),
                    registeredPlayers: firebase.firestore.FieldValue.arrayUnion(newPlayerData),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp() // 🚀 FORZAR NOTIFICACIÓN
                };

                // 3. GESTIÓN DE PAREJA (Si aplica)
                if (partnerName) {
                    const partnerData = {
                        id: partnerId || `guest_${Date.now()}`, uid: partnerId || null,
                        name: partnerName.toUpperCase(), level: '3.5', gender: '?',
                        joinedAt: new Date().toISOString(),
                        partner_name: newPlayerData.name, partner_id: newPlayerData.id
                    };
                    newPlayerData.partner_name = partnerName;
                    if (partnerId) newPlayerData.partner_id = partnerId;
                    
                    updates.players = firebase.firestore.FieldValue.arrayUnion(newPlayerData, partnerData);
                    updates.registeredPlayers = firebase.firestore.FieldValue.arrayUnion(newPlayerData, partnerData);
                }

                // 4. ESCRITURA ATÓMICA DE ARRAY (Soporta alta concurrencia)
                await eventRef.update(updates);
                console.log(`✅ ${logId} Inscripción completada con éxito.`);

                // 5. TAREAS DE FONDO (Sin esperar a que terminen)
                if (window.NotificationService) {
                    window.NotificationService.sendNotificationToUser(userUid, "Inscripción OK", `Te has apuntado a ${event.name || type}.`, { url: 'live', eventId: americanaId }).catch(() => {});
                }

                return { success: true };

            } catch (err) {
                console.error(`${logId} Error en inscripción rápida:`, err);
                return { success: false, error: err.message || "Error de red. Intenta de nuevo." };
            }
        }

        notifyAdminOfRegistration(evt, user) {
            const adminPhone = "34649219350";
            const msg = `🎾 *NUEVA INSCRIPCIÓN* %0A%0A👤 Jugador: ${user.name} %0A🏆 Evento: ${evt.name} %0A📅 Fecha: ${evt.date} ${evt.time}`;
            console.log("🔔 Notifying Admin via WA Link generation...");
            const waLink = `https://wa.me/${adminPhone}?text=${msg}`;
        }

        async removePlayer(americanaId, userId, type = 'americana') {
            const logId = `[QUICK-LEAVE-${americanaId.substring(0,5)}]`;
            console.log(`⚡ ${logId} Tramitando baja rápida...`);

            try {
                const db = window.db;
                const collectionName = (type === 'entreno') ? 'entrenos' : 'americanas';
                const eventRef = db.collection(collectionName).doc(americanaId);

                // 1. Obtener datos actuales (1 lectura)
                const doc = await eventRef.get();
                if (!doc.exists) return { success: false, error: "Evento no encontrado" };

                const event = doc.data();
                const players = event.players || [];
                
                // Buscar exactamente qué objetos borrar (Firestore necesita el objeto exacto para arrayRemove)
                const itemsToRemove = players.filter(p => p && (p.uid === userId || p.id === userId));

                if (itemsToRemove.length === 0) {
                    return { success: true, message: "Ya no estabas en la lista." };
                }

                // 2. Ejecutar borrado atómico (Sin transacción para evitar 429)
                await eventRef.update({
                    players: firebase.firestore.FieldValue.arrayRemove(...itemsToRemove),
                    registeredPlayers: firebase.firestore.FieldValue.arrayRemove(...itemsToRemove),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp() // 🚀 FORZAR NOTIFICACIÓN
                });

                console.log(`✅ ${logId} Baja completada.`);

                // 3. Tareas de fondo (Waitlist / Notificaciones)
                setTimeout(() => {
                    this.triggerNextInWaitlist(americanaId, type).catch(() => {});
                    if (window.NotificationService) {
                        window.NotificationService.sendNotificationToUser(userId, "Baja Confirmada", `Te has dado de baja.`, { url: 'americanas' }).catch(() => {});
                    }
                }, 1000);

                return { success: true };
            } catch (err) {
                console.error(`${logId} Error en baja:`, err);
                return { success: false, error: "Error al tramitar la baja. Reintenta." };
            }
        }

        async triggerNextInWaitlist(eventId, type) {
            try {
                const service = this._getCollectionService(type);
                const event = await service.getById(eventId);
                const waitlist = event.waitlist || [];
                if (waitlist.length === 0 || event.waitlist_pending_user) return;

                const nextUser = waitlist[0];
                await service.update(eventId, {
                    waitlist_pending_user: nextUser,
                    waitlist_notified_at: new Date().toISOString(),
                    waitlist: waitlist.slice(1)
                });

                if (window.NotificationService) {
                    window.NotificationService.sendNotificationToUser(nextUser.uid, "¡PLAZA LIBRE! 🎾", `Tienes 10 MINUTOS para confirmar tu plaza en ${event.name}.`, { url: 'live', eventId, action: 'confirm_waitlist' });
                }
            } catch (err) { console.error("Waitlist Trigger Error:", err); }
        }

        async addToWaitlist(eventId, user, type = 'americana') {
            try {
                const db = window.db;
                const collectionName = (type === 'entreno') ? 'entrenos' : 'americanas';
                const eventRef = db.collection(collectionName).doc(eventId);

                return await db.runTransaction(async (transaction) => {
                    const doc = await transaction.get(eventRef);
                    if (!doc.exists) throw new Error("Evento no encontrado");
                    const event = doc.data();
                    const waitlist = event.waitlist || [];
                    const currentUid = user.uid || user.id;

                    if (waitlist.find(p => (p.uid || p.id) === currentUid)) throw new Error("Ya estás en lista de espera.");

                    this.validateGender(event.category, user.gender);

                    waitlist.push({
                        uid: currentUid, id: currentUid,
                        name: (user.name || 'Jugador').toUpperCase(),
                        gender: user.gender || 'M',
                        joinedAt: new Date().toISOString()
                    });
                    transaction.update(eventRef, { waitlist });
                    return { success: true };
                });
            } catch (err) { return { success: false, error: err.message }; }
        }

        async leaveWaitlist(eventId, userId, type = 'americana') {
            try {
                const db = window.db;
                const collectionName = (type === 'entreno') ? 'entrenos' : 'americanas';
                const eventRef = db.collection(collectionName).doc(eventId);

                return await db.runTransaction(async (transaction) => {
                    const doc = await transaction.get(eventRef);
                    if (!doc.exists) throw new Error("Evento no encontrado");
                    const event = doc.data();
                    const currentWaitlist = event.waitlist || [];
                    const newWaitlist = currentWaitlist.filter(p => (p.uid || p.id) !== userId);
                    transaction.update(eventRef, { waitlist: newWaitlist });
                    return { success: true };
                });
            } catch (err) { return { success: false, error: err.message }; }
        }

        async confirmWaitlist(eventId, userId, type = 'americana') {
            try {
                const service = this._getCollectionService(type);
                const event = await service.getById(eventId);
                if (!event.waitlist_pending_user || event.waitlist_pending_user.uid !== userId) throw new Error("Expirado.");
                await this.addPlayer(eventId, event.waitlist_pending_user, type);
                await service.update(eventId, { waitlist_pending_user: null, waitlist_notified_at: null });
                return { success: true };
            } catch (err) { return { success: false, error: err.message }; }
        }

        async processWaitlistTimeouts() {
            const all = await this.getAllActiveEvents();
            const now = new Date();
            for (const evt of all) {
                if (evt.waitlist_pending_user && evt.waitlist_notified_at) {
                    if ((now - new Date(evt.waitlist_notified_at)) / 60000 >= 10) {
                        const service = this._getCollectionService(evt.type);
                        await service.update(evt.id, { waitlist_pending_user: null, waitlist_notified_at: null });
                        await this.triggerNextInWaitlist(evt.id, evt.type);
                    }
                }
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

                // CHECK AND CLEANUP NEXT ROUND (Fix for Ghost Results)
                const nextRound = currentRound + 1;

                // Aggressively delete any partial/ghost matches for this round before regenerating
                console.log(`🧹 [AmericanaService] Pruning R${nextRound} before generation to prevent ghost scores...`);
                await this.deleteRound(eventId, nextRound, type);

                console.log(`🤖 [AmericanaService] Delegating Next Round generation to MatchMakingService for ${type} ${eventId}`);
                return await window.MatchMakingService.generateRound(eventId, type, nextRound);
            } catch (err) {
                console.error("❌ Error generating next round:", err);
                throw err; // RETHROW to let Controller handle it
            }
        }
    };
    // Ready to be initialized by AppInit
    console.log("📦 [AmericanaServiceClass] Clase de Servicio de Americanas registrada.");
})();
