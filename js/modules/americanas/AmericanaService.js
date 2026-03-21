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
            console.log(`🚀 [AmericanaService] addPlayer (Atomic): id=${americanaId}, type=${type}`, { partnerName });

            try {
                if (!user) {
                    console.error("❌ [AmericanaService] CRITICAL: user is undefined");
                    return { success: false, error: "Identificación de usuario fallida. Recarga la página." };
                }

                const db = window.db;
                const collectionName = (type === 'entreno') ? 'entrenos' : 'americanas';
                const eventRef = db.collection(collectionName).doc(americanaId);

                // 1. Pre-fetch partner if needed (outside transaction)
                let partnerDataDB = null;
                if (partnerName && partnerId) {
                    try {
                        const pDoc = await db.collection('players').doc(partnerId).get();
                        if (pDoc.exists) partnerDataDB = pDoc.data();
                    } catch (e) { console.error("Error pre-fetching partner:", e); }
                }

                // 2. Atomic Transaction
                const result = await db.runTransaction(async (transaction) => {
                    const doc = await transaction.get(eventRef);
                    if (!doc.exists) throw new Error("Evento no encontrado (" + type + ")");

                    const event = doc.data() || {};
                    const players = event.players || [];
                    const regPlayers = event.registeredPlayers || [];
                    const userUid = user.uid || user.id;

                    if (!userUid) throw new Error("Tu perfil de usuario está incompleto (falta UID).");

                    const exists = (players.find(p => p && (p.uid === userUid || p.id === userUid))) ||
                        (regPlayers.find(p => p && (p.uid === userUid || p.id === userUid)));

                    if (exists) throw new Error("Ya estás inscrito en este evento.");

                    const maxPlayers = (parseInt(event.max_courts) || 4) * 4;
                    const capacity = maxPlayers - players.length;
                    const wantsTwo = !!partnerName;

                    if (wantsTwo && capacity < 2) {
                        throw new Error(`Solo queda 1 plaza disponible. No puedes apuntar a una pareja.`);
                    } else if (capacity < 1) {
                        throw new Error(`No quedan plazas disponibles.`);
                    }

                    // VALIDACIÓN DE GÉNERO
                    this.validateGender(event.category, user.gender);

                    const userGender = user.gender || 'M';
                    const normalizedGender = (userGender === 'M' || userGender === 'chico') ? 'chico' :
                        (userGender === 'F' || userGender === 'chica') ? 'chica' : '?';

                    const newPlayerData = {
                        id: userUid,
                        uid: userUid,
                        name: (user.name || user.displayName || user.email || 'Jugador').toUpperCase(),
                        level: user.level || user.self_rate_level || '3.5',
                        team_somospadel: user.team_somospadel || user.team || [],
                        gender: normalizedGender,
                        side_preference: user.side_preference || 'INDIFF',
                        play_style: user.play_style || 'ESTRATEGIA',
                        joinedAt: new Date().toISOString()
                    };

                    if (partnerName) {
                        newPlayerData.partner_name = partnerName;
                        if (partnerId) newPlayerData.partner_id = partnerId;
                    }

                    const updatedPlayers = [...players, newPlayerData];

                    // Process Partner (if wantsTwo)
                    if (wantsTwo) {
                        let partnerData = null;
                        if (partnerId && partnerDataDB) {
                            partnerData = {
                                id: partnerId,
                                uid: partnerId,
                                name: partnerDataDB.name || partnerName,
                                level: partnerDataDB.level || partnerDataDB.self_rate_level || '3.5',
                                team_somospadel: partnerDataDB.team_somospadel || partnerDataDB.team || [],
                                gender: (partnerDataDB.gender === 'F' || partnerDataDB.gender === 'chica') ? 'chica' : 'chico',
                                side_preference: partnerDataDB.side_preference || 'INDIFF',
                                play_style: partnerDataDB.play_style || 'ESTRATEGIA',
                                joinedAt: new Date().toISOString(),
                                partner_name: newPlayerData.name,
                                partner_id: newPlayerData.id
                            };
                        } else {
                            partnerData = {
                                id: partnerId || `guest_${Date.now()}`,
                                uid: partnerId || null,
                                name: partnerName,
                                level: '3.5',
                                gender: '?',
                                joinedAt: new Date().toISOString(),
                                partner_name: newPlayerData.name,
                                partner_id: newPlayerData.id
                            };
                        }

                        const partnerExists = updatedPlayers.find(p => p && (p.id === partnerData.id || (p.uid && p.uid === partnerData.uid)));
                        if (!partnerExists) {
                            updatedPlayers.push(partnerData);
                        }
                    }

                    transaction.update(eventRef, {
                        players: updatedPlayers,
                        registeredPlayers: updatedPlayers
                    });

                    return { success: true, event: event, players: updatedPlayers };
                });

                if (result.success) {
                    const event = result.event;
                    const players = result.players;
                    const userUid = user.uid || user.id;

                    // --- AUTO-FILL VACANCIES IN MATCHES ---
                    if (window.MatchMakingService && event) {
                        try {
                            const matchColl = (type === 'entreno') ? 'entrenos_matches' : 'matches';
                            const hasMatches = await window.db.collection(matchColl).where('americana_id', '==', americanaId).limit(1).get();

                            if (!hasMatches.empty) {
                                const userName = user.name || user.displayName || 'Jugador';
                                console.log(`🔍 [Service] Joined active event. Checking for vacancies...`);
                                await window.MatchMakingService.substitutePlayerInMatchesRobust(americanaId, 'VACANT', '🔴 VACANTE', userUid, userName, type);
                                await window.MatchMakingService.substitutePlayerInMatchesRobust(americanaId, 'VACANT', 'VACANTE', userUid, userName, type);
                            }
                        } catch (e) {
                            console.error("[AmericanaService] Error in MatchMaking Auto-Fill (non-fatal):", e);
                        }
                    }

                    // --- NOTIFICATIONS ---
                    if (window.NotificationService && event && user) {
                        const evtName = event.name || type.toUpperCase();
                        const userName = user.name || user.displayName || 'Jugador';
                        const evtLink = { url: 'live', eventId: americanaId };

                        window.NotificationService.sendNotificationToUser(userUid, "Inscripción Confirmada", `Te has apuntado a ${evtName}. ¡A darlo todo!`, evtLink);

                        const others = players.filter(p => p && (p.uid || p.id) && (p.uid || p.id) !== userUid);
                        if (others.length < 50) {
                            others.forEach(p => {
                                window.NotificationService.sendNotificationToUser(p.uid || p.id, "Nuevo Jugador", `${userName} se ha unido a ${evtName}`, evtLink).catch(()=>{});
                            });
                        }
                    }

                    return { success: true };
                }
            } catch (err) {
                console.error("Error in addPlayer (Transaction):", err);
                return { success: false, error: err.message };
            }
        }

        notifyAdminOfRegistration(evt, user) {
            const adminPhone = "34649219350";
            const msg = `🎾 *NUEVA INSCRIPCIÓN* %0A%0A👤 Jugador: ${user.name} %0A🏆 Evento: ${evt.name} %0A📅 Fecha: ${evt.date} ${evt.time}`;
            console.log("🔔 Notifying Admin via WA Link generation...");
            const waLink = `https://wa.me/${adminPhone}?text=${msg}`;
        }

        async removePlayer(americanaId, userId, type = 'americana') {
            try {
                const db = window.db;
                const collectionName = (type === 'entreno') ? 'entrenos' : 'americanas';
                const eventRef = db.collection(collectionName).doc(americanaId);

                let eventData = null;

                const result = await db.runTransaction(async (transaction) => {
                    const doc = await transaction.get(eventRef);
                    if (!doc.exists) throw new Error("Evento no encontrado");

                    const event = doc.data();
                    eventData = event;
                    const currentPlayers = event.players || event.registeredPlayers || [];
                    const newPlayers = currentPlayers.filter(p => (p.uid || p.id) !== userId);

                    const updates = {
                        registeredPlayers: newPlayers,
                        players: newPlayers
                    };

                    const maxPlayers = (event.max_courts || 4) * 4;
                    if (event.status === 'live' && newPlayers.length < maxPlayers) {
                        updates.status = 'open';
                    }

                    transaction.update(eventRef, updates);
                    return { success: true, wasLive: (event.status === 'live' && newPlayers.length < maxPlayers) };
                });

                if (result.success) {
                    if (result.wasLive) {
                        await this.purgeMatches(americanaId, type);
                    }

                    const maxPlayers = (eventData.max_courts || 4) * 4;
                    const currentPlayersCount = (eventData.players || []).length;
                    
                    if (currentPlayersCount < maxPlayers) {
                         await this.triggerNextInWaitlist(americanaId, type);
                    }

                    if (window.NotificationService) {
                        const evtName = eventData.name || type.toUpperCase();
                        window.NotificationService.sendNotificationToUser(userId, "Baja Confirmada", `Te has dado de baja de ${evtName}.`, { url: 'americanas' });
                    }
                }

                return { success: true };
            } catch (err) {
                console.error(`Error in removePlayer (${type}):`, err);
                return { success: false, error: err.message };
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
