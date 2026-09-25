/**
 * AmericanaService.js (Global Version)
 */
(function () {
    window.AmericanaServiceClass = class AmericanaService {
        constructor() {
            // Centralized loading via AppInit guarantees dependencies are ready.
            this.db = this._getCollectionService('americana');
            this._cachedActiveEvents = null;
            this._lastEventsCacheTime = 0;
            this._eventsCacheTTL = 60000; // 60s TTL (45-60s)
            this._activeEventsPendingPromise = null;

            // Invalida la memoria caché cuando se produce una modificación global
            if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
                window.addEventListener('eventModified', () => {
                    this.invalidateActiveEventsCache();
                });
            }
        }

        /**
         * Invalida la memoria caché local de eventos activos
         */
        invalidateActiveEventsCache() {
            this._cachedActiveEvents = null;
            this._lastEventsCacheTime = 0;
        }

        invalidateCache() {
            this.invalidateActiveEventsCache();
        }

        validateGender(category, userGender, eventName = '') {
            const rawCat = (category || '').toLowerCase().trim();
            const rawName = (eventName || '').toLowerCase().trim();
            const g = (userGender || '').toLowerCase().trim();

            const isChico = ['m', 'chico', 'male', 'masculino', 'hombre', 'boy'].includes(g);
            const isChica = ['f', 'chica', 'female', 'femenina', 'femenino', 'mujer', 'girl'].includes(g);

            // Determinar tipo de categoría normalizada
            let catType = 'open';
            if (
                ['female', 'femenina', 'femenino', 'chicas', 'mujeres'].includes(rawCat) ||
                rawCat.includes('fem') ||
                rawName.includes('femenin') ||
                rawName.includes('chicas')
            ) {
                catType = 'female';
            } else if (
                ['mixed', 'mixto', 'mixta'].includes(rawCat) ||
                rawCat.includes('mix') ||
                rawName.includes('mixt')
            ) {
                catType = 'mixed';
            } else if (
                ['male', 'masculino', 'masculina', 'chicos', 'hombres'].includes(rawCat) ||
                rawCat.includes('masc') ||
                rawName.includes('masculin') ||
                rawName.includes('chicos')
            ) {
                catType = 'male';
            } else if (rawCat === 'open' || rawName.includes('open')) {
                catType = 'open';
            } else if (rawCat) {
                // Por defecto masculino si viene indicada categoría estándar
                catType = 'male';
            }

            // Regla: Chico solo Masculino o Mixto. Chica solo Femenino o Mixto.
            if (catType === 'male' && !isChico) {
                if (isChica) {
                    throw new Error("⛔ Categoría MASCULINA: Este evento es exclusivo para chicos. Como chica, puedes apuntarte a eventos Femeninos o Mixtos.");
                } else {
                    throw new Error("⛔ Debes definir tu género (chico/chica) en tu perfil para apuntarte a este evento masculino.");
                }
            }

            if (catType === 'female' && !isChica) {
                if (isChico) {
                    throw new Error("⛔ Categoría FEMENINA: Este evento es exclusivo para chicas. Como chico, puedes apuntarte a eventos Masculinos o Mixtos.");
                } else {
                    throw new Error("⛔ Debes definir tu género (chico/chica) en tu perfil para apuntarte a este evento femenino.");
                }
            }

            if (catType === 'mixed' && !isChico && !isChica) {
                throw new Error("⛔ Categoría MIXTA: Debes definir tu género en el perfil antes de inscribirte.");
            }

            return true;
        }

        /**
         * Normaliza fechas de DD/MM/YYYY a YYYY-MM-DD para comparaciones/sorting
         */
        _normalizeDate(d) {
            if (window.EventService && typeof window.EventService.normalizeDate === 'function') {
                return window.EventService.normalizeDate(d);
            }
            if (!d) return '9999-99-99';
            if (d.includes('/')) {
                const parts = d.split('/').map(p => p.trim());
                if (parts.length >= 2) {
                    const day = parts[0].padStart(2, '0');
                    const month = parts[1].padStart(2, '0');
                    const year = parts[2] ? (parts[2].length === 2 ? '20' + parts[2] : parts[2]) : String(new Date().getFullYear());
                    return `${year}-${month}-${day}`;
                }
            }
            return d;
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

        async getActiveAmericanas(options = {}) {
            try {
                // Reutiliza getAllActiveEvents para beneficiarse de la caché en memoria y la optimización de Firestore
                const allActive = await this.getAllActiveEvents(options);
                if (Array.isArray(allActive)) {
                    return allActive.filter(e => e.type === 'americana');
                }
                if (!this.db) return [];
                const all = await this.db.getAll({ forceRefresh: false });
                const isFinished = (e) => window.EventService ? window.EventService.isEventFinished(e) : (e.status === 'finished');
                return (all || [])
                    .filter(a => !isFinished(a))
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
         * Consulta optimizada y acotada de eventos recientes/activos evitando escaneo masivo histórico.
         * Aprovecha CacheService y aplica límites e índices inteligentes en Firestore.
         */
        async _fetchRecentCollectionDocs(firestore, collectionName, limitCount = 40, forceRefresh = false) {
            const cacheKey = `recent_${collectionName}_${limitCount}`;

            // 1. Aprovechar CacheService / IndexedDB si está disponible
            if (!forceRefresh && window.CacheService && typeof window.CacheService.get === 'function') {
                try {
                    const cached = await window.CacheService.get('database', cacheKey);
                    if (Array.isArray(cached) && cached.length > 0) {
                        return cached;
                    }
                } catch (_) {}
            }

            let docs = [];

            // 2. Consulta acotada directa a Firestore
            if (firestore && typeof firestore.collection === 'function') {
                const colRef = firestore.collection(collectionName);
                let snap = null;

                // 2.1 Ordenar por fecha descendente acotado a los últimos 30-40 eventos
                try {
                    snap = await colRef.orderBy('date', 'desc').limit(limitCount).get();
                } catch (orderErr) {
                    console.warn(`⚠️ [AmericanaService] Fallo consulta orderBy('date') para ${collectionName}:`, orderErr?.message || orderErr);
                }

                // 2.2 Si orderBy falló (p.ej. falta de índice o formato), intentar filtrar por estados activos
                if (!snap) {
                    try {
                        const activeStatuses = ['open', 'draft', 'in_progress', 'active', 'en_curso', 'live', 'ready', 'scheduled'];
                        snap = await colRef.where('status', 'in', activeStatuses).limit(limitCount).get();
                    } catch (statusErr) {
                        console.warn(`⚠️ [AmericanaService] Fallo consulta por status para ${collectionName}:`, statusErr?.message || statusErr);
                    }
                }

                // 2.3 Fallback plano con limit para jamás descargar la historia completa del club
                if (!snap) {
                    try {
                        snap = await colRef.limit(limitCount).get();
                    } catch (limitErr) {
                        console.warn(`⚠️ [AmericanaService] Fallo consulta limit para ${collectionName}:`, limitErr?.message || limitErr);
                    }
                }

                if (snap?.docs) {
                    docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                }
            }

            // 3. Fallback a CollectionService / DatabaseService si firestore directo no devolvió datos
            if (!docs.length) {
                try {
                    const svcType = collectionName === 'entrenos' ? 'entreno' : 'americana';
                    const colSvc = this._getCollectionService(svcType);
                    if (colSvc && typeof colSvc.getAll === 'function') {
                        const allDocs = await this._withTimeout(
                            colSvc.getAll({ forceRefresh: false }),
                            3000,
                            []
                        );
                        if (Array.isArray(allDocs)) {
                            docs = allDocs.slice(0, limitCount);
                        }
                    }
                } catch (svcErr) {
                    console.warn(`⚠️ [AmericanaService] Fallo fallback servicio para ${collectionName}:`, svcErr);
                }
            }

            // 4. Guardar en CacheService para acelerar sucesivas consultas
            if (docs.length > 0 && window.CacheService && typeof window.CacheService.set === 'function') {
                try {
                    window.CacheService.set('database', cacheKey, docs, 60000).catch(() => {});
                } catch (_) {}
            }

            return docs;
        }

        /**
         * Unified method to fetch both Americanas and Entrenos for Dashboard.
         * Incorpora caché en memoria (TTL 60s), deduplicación de peticiones en vuelo,
         * y consultas acotadas a Firestore para evitar descargas masivas históricas.
         * @param {Object|boolean} [options={}] - Opciones de consulta ({ forceRefresh, limit }) o boolean forceRefresh
         * @returns {Promise<Array>} Array de eventos activos ordenados cronológicamente
         */
        async getAllActiveEvents(options = {}) {
            const isOptionsObj = options && typeof options === 'object';
            const forceRefresh = options === true || !!(isOptionsObj && options.forceRefresh);
            const queryLimit = (isOptionsObj && typeof options.limit === 'number' && options.limit > 0) ? options.limit : 40;

            const now = Date.now();

            // 1. ⚡ Retorno inmediato si la caché en memoria sigue viva (0ms de latencia)
            if (!forceRefresh && this._cachedActiveEvents && (now - this._lastEventsCacheTime < this._eventsCacheTTL)) {
                return [...this._cachedActiveEvents];
            }

            // 2. 🛡️ Deduplicación de peticiones en vuelo (evita consultas simultáneas idénticas en arranque)
            if (!forceRefresh && this._activeEventsPendingPromise) {
                return await this._activeEventsPendingPromise;
            }

            this._activeEventsPendingPromise = (async () => {
                try {
                    let ams = [];
                    let ents = [];

                    // 1. Prioridad: Si EventsController ya tiene cargados entrenos y americanas en memoria en tiempo real
                    const isBgReady = !!window.EventsController?.state?.bgInitialized;
                    if (window.EventsController?.state) {
                        if (Array.isArray(window.EventsController.state.americanas) && window.EventsController.state.americanas.length > 0) {
                            ams = [...window.EventsController.state.americanas];
                        }
                        if (Array.isArray(window.EventsController.state.entrenos) && window.EventsController.state.entrenos.length > 0) {
                            ents = [...window.EventsController.state.entrenos];
                        }
                    }

                    // 2. Si alguna colección falta o está vacía y no está lista en tiempo real, consultar Firestore de forma acotada
                    if (!isBgReady && (!ams.length || !ents.length)) {
                        try {
                            const firestore = window.db || (window.firebase && typeof window.firebase.firestore === 'function' ? window.firebase.firestore() : null);
                            const [fetchedAms, fetchedEnts] = await Promise.all([
                                (!ams.length) ? this._fetchRecentCollectionDocs(firestore, 'americanas', queryLimit, forceRefresh) : Promise.resolve(ams),
                                (!ents.length) ? this._fetchRecentCollectionDocs(firestore, 'entrenos', queryLimit, forceRefresh) : Promise.resolve(ents)
                            ]);
                            if (!ams.length && fetchedAms) ams = fetchedAms;
                            if (!ents.length && fetchedEnts) ents = fetchedEnts;
                        } catch (dbErr) {
                            console.warn("⚠️ [AmericanaService] Fallo consulta acotada Firestore:", dbErr);
                        }
                    }

                    // 3. Fallback a CollectionService si todavía faltan datos
                    if (!ams.length || !ents.length) {
                        const fetchAms = !ams.length ? (this._getCollectionService('americana')?.getAll({ forceRefresh: false }) || []) : Promise.resolve(ams);
                        const fetchEnts = !ents.length ? (this._getCollectionService('entreno')?.getAll({ forceRefresh: false }) || []) : Promise.resolve(ents);

                        const results = await this._withTimeout(
                            Promise.all([fetchAms, fetchEnts]),
                            4000,
                            [ams, ents]
                        );
                        if (!ams.length && Array.isArray(results[0])) ams = results[0].slice(0, queryLimit);
                        if (!ents.length && Array.isArray(results[1])) ents = results[1].slice(0, queryLimit);
                    }

                    const all = [
                        ...ams.map(e => {
                            const title = (e.name || e.title || e.eventName || '').toLowerCase();
                            const format = (e.format || e.mode || '').toLowerCase();
                            const isEnt = e.type === 'entreno' || title.includes('entreno') || title.includes('pozo') || title.includes('clase') || format.includes('entreno') || format.includes('pozo');
                            return { ...e, type: isEnt ? 'entreno' : (e.type || 'americana') };
                        }),
                        ...ents.map(e => ({ ...e, type: 'entreno' }))
                    ];

                    const isFinished = (e) => {
                        if (!e) return true;
                        const st = (e.status || '').toLowerCase().trim();
                        if (['finished', 'finalizado', 'completed', 'cancelled'].includes(st)) return true;
                        if (window.EventService && typeof window.EventService.isEventFinished === 'function') {
                            return window.EventService.isEventFinished(e);
                        }
                        return false;
                    };

                    const activeEvents = all
                        .filter(e => !isFinished(e))
                        .sort((a, b) => {
                            const dateA = this._normalizeDate(a.date);
                            const dateB = this._normalizeDate(b.date);
                            return new Date(dateA + 'T' + (a.time || '00:00')) - new Date(dateB + 'T' + (b.time || '00:00'));
                        });

                    // Guardar en la caché local en memoria con timestamp
                    this._cachedActiveEvents = activeEvents;
                    this._lastEventsCacheTime = Date.now();

                    return activeEvents;
                } catch (error) {
                    console.error("Error fetching all active events:", error);
                    if (this._cachedActiveEvents && this._cachedActiveEvents.length > 0) {
                        return [...this._cachedActiveEvents];
                    }
                    return [];
                }
            })();

            try {
                const results = await this._activeEventsPendingPromise;
                return [...results];
            } finally {
                this._activeEventsPendingPromise = null;
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

                this.validateGender(event.category, user.gender, event.name);

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
                this.invalidateActiveEventsCache();
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
                this.invalidateActiveEventsCache();

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

                const res = await db.runTransaction(async (transaction) => {
                    const doc = await transaction.get(eventRef);
                    if (!doc.exists) throw new Error("Evento no encontrado");
                    const event = doc.data();
                    const waitlist = event.waitlist || [];
                    const currentUid = user.uid || user.id;

                    if (waitlist.find(p => (p.uid || p.id) === currentUid)) throw new Error("Ya estás en lista de espera.");

                    this.validateGender(event.category, user.gender, event.name);

                    waitlist.push({
                        uid: currentUid, id: currentUid,
                        name: (user.name || 'Jugador').toUpperCase(),
                        gender: user.gender || 'M',
                        joinedAt: new Date().toISOString()
                    });
                    transaction.update(eventRef, { waitlist });
                    return { success: true };
                });
                if (res?.success) this.invalidateActiveEventsCache();
                return res;
            } catch (err) { return { success: false, error: err.message }; }
        }

        async leaveWaitlist(eventId, userId, type = 'americana') {
            try {
                const db = window.db;
                const collectionName = (type === 'entreno') ? 'entrenos' : 'americanas';
                const eventRef = db.collection(collectionName).doc(eventId);

                const res = await db.runTransaction(async (transaction) => {
                    const doc = await transaction.get(eventRef);
                    if (!doc.exists) throw new Error("Evento no encontrado");
                    const event = doc.data();
                    const currentWaitlist = event.waitlist || [];
                    const newWaitlist = currentWaitlist.filter(p => (p.uid || p.id) !== userId);
                    transaction.update(eventRef, { waitlist: newWaitlist });
                    return { success: true };
                });
                if (res?.success) this.invalidateActiveEventsCache();
                return res;
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
            const result = await this.db.create({
                ...data,
                status: 'draft',
                registeredPlayers: []
            });
            this.invalidateActiveEventsCache();
            return result;
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
