console.log("🔥 [v99] Initializing Firebase...");

// GLOBAL ERROR DIAGNOSTIC
window.onerror = function (msg, url, line, col, error) {
    const errorDetail = error ? error.stack : 'No stack trace';
    const lowerDetail = (String(msg) + ' ' + String(errorDetail)).toLowerCase();

    if (lowerDetail.includes('script error') && line === 0) {
        console.warn("⚠️ Suppressed CORS/Script Error:", msg);
        return false; // Let it propagate to console
    }

    // Suprimir errores benignos de aserción interna de Firestore / IndexedDB
    if (
        lowerDetail.includes('internal assertion failed') ||
        lowerDetail.includes('unexpected state') ||
        lowerDetail.includes('assertion failed')
    ) {
        console.warn("⚠️ [onerror] Error interno de aserción Firestore/IndexedDB interceptado y suprimido:", msg);
        try {
            window.indexedDB?.deleteDatabase?.('firestore/[DEFAULT]/americanas-somospadel/main');
            window.indexedDB?.deleteDatabase?.('firestore/[DEFAULT]');
        } catch (_) {}
        return true; // Prevents default handling and error dialogs
    }

    if (!url) url = 'Script Inline/Desconocido';

    console.error("Critical Error Catch:", msg, url, line, col, error);
    if (window.PremiumModal) {
        window.PremiumModal.alert({
            title: "🔴 ERROR DETECTADO",
            message: `<strong>Mensaje:</strong> ${msg}<br><strong>Archivo:</strong> ${url}<br><strong>Línea:</strong> ${line}<br><strong>Detalles:</strong> ${errorDetail.substring(0, 50)}...`,
            type: 'danger'
        });
    } else {
        console.error("Critical Error Catch:", msg, url, line, col, error);
    }
    return false;
};

window.addEventListener('unhandledrejection', function (event) {
    const reason = event.reason;
    const msg = (reason && (reason.message || (typeof reason === 'string' ? reason : reason.toString()))) || '';
    const name = (reason && reason.name) || '';
    const stack = (reason && reason.stack) || '';
    const lowerMsg = (msg + ' ' + name + ' ' + stack + ' ' + String(reason)).toLowerCase();

    // 1. Manejo específico y recuperación ante aserciones internas de Firestore/IndexedDB
    if (
        lowerMsg.includes('internal assertion failed') ||
        lowerMsg.includes('unexpected state') ||
        lowerMsg.includes('assertion failed')
    ) {
        console.warn("⚠️ [unhandledrejection] Error interno de aserción Firestore/IndexedDB interceptado y auto-recuperado.");
        if (typeof event.preventDefault === 'function') event.preventDefault();

        // Purgar de forma segura la base de datos IndexedDB local de Firestore si existe
        try {
            window.indexedDB?.deleteDatabase?.('firestore/[DEFAULT]/americanas-somospadel/main');
            window.indexedDB?.deleteDatabase?.('firestore/[DEFAULT]');
        } catch (_) {}

        // No mostrar en ningún caso el modal por este error benigno de sincronización local
        return;
    }

    // 2. Silenciar errores benignos propios del ciclo de vida móvil, suspensión de pestañas en iOS Safari, cuotas de almacenamiento o cancelaciones de usuario
    if (
        lowerMsg.includes('the client has already been terminated') ||
        lowerMsg.includes('failed-precondition') ||
        lowerMsg.includes('aborterror') ||
        lowerMsg.includes('the request was aborted') ||
        lowerMsg.includes('resizeobserver loop') ||
        lowerMsg.includes('networkerror') ||
        lowerMsg.includes('failed to fetch') ||
        lowerMsg.includes('load failed') ||
        lowerMsg.includes('quota') ||
        lowerMsg.includes('quotaexceedederror') ||
        lowerMsg.includes('setitem') ||
        lowerMsg.includes('storage') ||
        lowerMsg.includes('exceeded the quota')
    ) {
        console.warn("⚠️ [unhandledrejection] Error benigno o de storage/red suprimido:", msg);
        if (typeof event.preventDefault === 'function') event.preventDefault();

        // Limpieza de emergencia de localStorage si se agota la cuota
        if (lowerMsg.includes('quota') || lowerMsg.includes('setitem') || lowerMsg.includes('storage')) {
            try {
                for (let i = localStorage.length - 1; i >= 0; i--) {
                    const key = localStorage.key(i);
                    if (key && (key.startsWith('firestore_') || (key.startsWith('sp_') && !key.includes('currentUser') && !key.includes('admin')))) {
                        localStorage.removeItem(key);
                    }
                }
                console.log("🧹 [LocalStorage] Liberada cuota eliminando claves temporales de Firestore/Cache.");
            } catch (e) { }
        }
        return;
    }

    if (window.PremiumModal) {
        window.PremiumModal.alert({
            title: "🔴 ERROR ASÍNCRONO",
            message: event.reason,
            type: 'danger'
        });
    }
});

// Helper seguro para consultas Firestore con auto-recuperación ante aserciones corruptas de IndexedDB
async function safeFirestoreGet(ref, options) {
    if (!ref) throw new Error("safeFirestoreGet: ref no válida");
    try {
        return options ? await ref.get(options) : await ref.get();
    } catch (err) {
        const msg = (err && (err.message || String(err))) || '';
        const lowerMsg = msg.toLowerCase();
        if (
            lowerMsg.includes('internal assertion failed') ||
            lowerMsg.includes('unexpected state') ||
            lowerMsg.includes('assertion failed')
        ) {
            console.warn("⚠️ [safeFirestoreGet] Assertion failure en caché local detectado. Purgando IndexedDB y reintentando con { source: 'server' }...", msg);
            try {
                window.indexedDB?.deleteDatabase?.('firestore/[DEFAULT]/americanas-somospadel/main');
                window.indexedDB?.deleteDatabase?.('firestore/[DEFAULT]');
            } catch (_) {}
            return await ref.get({ source: 'server' });
        }
        throw err;
    }
}
window.safeFirestoreGet = safeFirestoreGet;

// Proactive startup cleanup of stale Firestore target entries in LocalStorage to prevent QuotaExceededError
try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('firestore_targets_') || key.startsWith('firestore_mutations_') || key.startsWith('firestore_clients_'))) {
            localStorage.removeItem(key);
        }
    }
} catch (e) { }

// Auto-recuperación de Firestore si la pestaña vuelve del segundo plano (ej: tras abrir WhatsApp)
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        if (window.db) {
            try {
                if (typeof window.db.enableNetwork === 'function') {
                    window.db.enableNetwork().catch(err => {
                        console.warn("⚠️ [FirebaseInit] enableNetwork al volver del segundo plano:", err?.message || err);
                    });
                }
            } catch (e) {
                // Ignore
            }
        }
    }
});

// Initialize Firebase
let db, auth;

if (typeof window.FIREBASE_CONFIG === 'undefined') {
    console.error("❌ Firebase config not found! Please create firebase-config.js from the template.");
    // Do not alert immediately to avoid blocking UI on load, just log
} else {
    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(window.FIREBASE_CONFIG);
            console.log("✅ Firebase initialized successfully");
        }
        db = firebase.firestore();

        // Enable multi-tab offline persistence with automatic fallback to memory
        // Debe ser llamado INMEDIATAMENTE después de crear la instancia db y ANTES de cualquier consulta.
        const initPersistencePromise = (typeof db.enableMultiTabIndexedDbPersistence === 'function')
            ? db.enableMultiTabIndexedDbPersistence()
            : db.enablePersistence({ synchronizeTabs: true });

        initPersistencePromise
            .then(() => {
                console.log("📦 Firestore multi-tab persistence enabled successfully.");
                return safeFirestoreGet(db.collection('players').limit(1));
            })
            .then(snapshot => {
                if (snapshot) console.log(`✅ Conexión Firestore OK, ${snapshot.size} documentos en 'players'`);
            })
            .catch(err => {
                const code = err.code || '';
                const msg = (err.message || String(err)).toLowerCase();
                console.warn("⚠️ Firestore persistence fallback:", code, err.message);

                if (msg.includes('internal assertion failed') || msg.includes('unexpected state') || msg.includes('assertion failed')) {
                    console.warn("🚨 [FirebaseInit] Cache corrupta en IndexedDB detectada en inicio. Purgando base de datos local...");
                    try {
                        window.indexedDB?.deleteDatabase?.('firestore/[DEFAULT]/americanas-somospadel/main');
                        window.indexedDB?.deleteDatabase?.('firestore/[DEFAULT]');
                    } catch (_) {}
                }

                // Verify connection even if persistence falls back to memory
                return safeFirestoreGet(db.collection('players').limit(1))
                    .then(snapshot => {
                        if (snapshot) console.log(`✅ Conexión Firestore OK (fallback en memoria), ${snapshot.size} documentos en 'players'`);
                    })
                    .catch(connErr => {
                        const isPermissionError = connErr.code === 'permission-denied' ||
                            (connErr.message && connErr.message.toLowerCase().includes('permission-denied')) ||
                            (connErr.message && connErr.message.toLowerCase().includes('missing or insufficient permissions'));
                        if (isPermissionError) {
                            console.log("ℹ️ Firestore connection requires authentication (normal behavior before login).");
                        } else {
                            console.warn('⚠️ Nota de conexión con Firestore al iniciar:', connErr.message || connErr);
                        }
                    });
            });

        auth = firebase.auth();

        // Forzar persistencia local en Firebase Auth
        auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
            .then(() => {
                console.log("🔒 [FirebaseInit] Persistencia de Auth establecida en LOCAL");
            })
            .catch(err => {
                console.error("❌ [FirebaseInit] Error al establecer la persistencia de Auth:", err);
            });

        // Export to window for global access across scripts
        window.db = db;
        window.auth = auth;
        window.FirebaseFirestore = firebase.firestore; // ADDED: Global access to FieldPath, etc.

        // Listen for auth state changes and expose globally
        firebase.auth().onAuthStateChanged(user => {
            // Evitar sobreescribir con null si hay una sesión local activa
            const currentStoreUser = window.Store ? window.Store.getState('currentUser') : null;
            if (user || !(currentStoreUser && currentStoreUser.localAuth)) {
                window.currentUser = user;
            }
            console.log('🔐 Auth state changed:', user ? `uid=${user.uid}` : 'no user');
        });
        try {
            if (firebase.messaging.isSupported()) {
                messaging = firebase.messaging();
                window.messaging = messaging;
                console.log("📨 Firebase Messaging Initialized");
            } else {
                console.log("📴 Firebase Messaging not supported in this browser");
            }
        } catch (e) { console.warn("Messaging init error", e); }
    } catch (error) {
        console.error("❌ Firebase initialization error:", error);
        if (window.PremiumModal) {
            window.PremiumModal.alert({
                title: "🔴 FIREBASE ERROR",
                message: error.message,
                type: 'danger'
            });
        }
    }
}
if (typeof window.FIREBASE_CONFIG === 'undefined') {
    if (window.PremiumModal) {
        window.PremiumModal.alert({
            title: "🔴 CONFIG ERROR",
            message: "firebase-config.js no cargado",
            type: 'danger'
        });
    }
}
if (typeof firebase === 'undefined') {
    if (window.PremiumModal) {
        window.PremiumModal.alert({
            title: "🔴 NETWORK ERROR",
            message: "Firebase SDK no cargado. Revisa tu internet.",
            type: 'danger'
        });
    }
}


// ============================================
// FIRESTORE HELPERS
// ============================================

async function _updatePlayersSyncToken() {
    if (!db) return;
    try {
        await db.collection('metadata').doc('players').set({
            last_updated: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log("🔄 [Sync Token] Server sync token updated successfully.");
    } catch (err) {
        console.warn("⚠️ [Sync Token] Failed to update server sync token:", err);
    }
}

const FirebaseDB = {
    // Players Collection
    players: {
        async getAll(force = false) {
            if (!db) throw new Error("Firebase DB not initialized yet");

            const fetchFn = async () => {
                try {
                    const snapshot = await safeFirestoreGet(db.collection('players'));
                    return snapshot.docs.map(doc => {
                        const data = doc.data();
                        return { ...data, id: doc.id, uid: data.uid || doc.id };
                    });
                } catch (err) {
                    console.warn("⚠️ [fetchFn] Firestore server fetch failed, attempting offline cache fallback:", err.message);
                    try {
                        const cacheSnapshot = await db.collection('players').get({ source: 'cache' });
                        if (cacheSnapshot && !cacheSnapshot.empty) {
                            console.log("🛡️ [fetchFn] Retrieved", cacheSnapshot.size, "players from Firestore offline cache.");
                            return cacheSnapshot.docs.map(doc => {
                                const data = doc.data();
                                return { ...data, id: doc.id, uid: data.uid || doc.id };
                            });
                        }
                    } catch (cacheErr) {
                        console.warn("⚠️ [fetchFn] Firestore offline cache not available:", cacheErr.message);
                    }
                    throw err;
                }
            };

            // === CONDITIONAL SYNC TOKEN CACHE VALIDATION ===
            if (window.CacheService && !force) {
                try {
                    // 1. Obtener el Sync Token más reciente del servidor (1 sola lectura ligera)
                    const serverMeta = await safeFirestoreGet(db.collection('metadata').doc('players'));
                    if (serverMeta.exists) {
                        const serverTime = serverMeta.data().last_updated?.toDate?.()?.getTime() || 0;
                        const localTime = parseInt(localStorage.getItem('players_sync_token') || '0');

                        // 2. Si coinciden y tenemos caché local, servimos de IndexedDB de inmediato
                        if (serverTime > 0 && localTime === serverTime) {
                            const cached = await window.CacheService.get('players', 'all');
                            if (cached && Array.isArray(cached) && cached.length > 0) {
                                console.log("⚡ [Sync Token] Cache HIT. Serving players from IndexedDB. ServerTime:", serverTime);
                                return cached;
                            }
                        }
                        
                        // 3. Si difieren o no hay caché, descargamos de red y actualizamos tokens
                        console.log("🔄 [Sync Token] Cache MISS/Stale. Fetching players from Firestore...", { localTime, serverTime });
                        const fresh = await fetchFn();
                        await window.CacheService.set('players', 'all', fresh);
                        localStorage.setItem('players_sync_token', serverTime.toString());
                        return fresh;
                    }
                } catch (cacheErr) {
                    console.warn("⚠️ [Sync Token] Fallback to standard SWR cache due to error:", cacheErr);
                }
                
                // Fallback standard SWR cache if metadata collection fails or is empty
                return await window.CacheService.swr('players', 'all', fetchFn, null, 1000 * 60 * 15);
            }

            try {
                const fresh = await fetchFn();
                if (window.CacheService) window.CacheService.set('players', 'all', fresh);
                return fresh;
            } catch (networkErr) {
                console.warn("⚠️ [players.getAll] Network fetch failed, checking local caches:", networkErr.message);
                if (window.CacheService) {
                    const cached = await window.CacheService.get('players', 'all');
                    if (cached && Array.isArray(cached) && cached.length > 0) {
                        console.log("🛡️ [players.getAll] Recovered", cached.length, "players from IndexedDB CacheService.");
                        return cached;
                    }
                }
                if (window.allUsersCache && Array.isArray(window.allUsersCache) && window.allUsersCache.length > 0) {
                    console.log("🛡️ [players.getAll] Recovered players from memory cache.");
                    return window.allUsersCache;
                }
                throw networkErr;
            }
        },

        async getById(id) {
            const doc = await safeFirestoreGet(db.collection('players').doc(id));
            if (!doc.exists) return null;
            return { id: doc.id, ...doc.data() };
        },

        async getByPhone(phone) {
            if (!phone) return null;
            const cleanPhone = String(phone).trim();
            let snapshot;
            try {
                snapshot = await safeFirestoreGet(
                    db.collection('players')
                        .where('phone', '==', cleanPhone)
                        .limit(1)
                );
            } catch (err) {
                console.warn("⚠️ [getByPhone] Fallo al buscar jugador por teléfono:", err);
                throw err;
            }

            // Fallback: If not found and it's a number, try querying as type Number
            if (snapshot.empty && !isNaN(cleanPhone) && cleanPhone !== '') {
                try {
                    snapshot = await safeFirestoreGet(
                        db.collection('players')
                            .where('phone', '==', Number(cleanPhone))
                            .limit(1)
                    );
                } catch (err) {
                    console.warn("⚠️ [getByPhone] Fallo al buscar por teléfono numérico:", err);
                    throw err;
                }
            }

            if (snapshot.empty) return null;
            const doc = snapshot.docs[0];
            return { id: doc.id, ...doc.data() };
        },

        async create(data) {
            // Professional Validation
            const name = (data.name || "").trim();
            const phone = (data.phone || "").toString().replace(/\D/g, '');

            if (name.split(' ').length < 2 && data.role !== 'admin') {
                throw new Error("Por favor, introduce nombre y apellidos para un perfil profesional.");
            }
            if (phone.length !== 9 && data.phone !== 'NOA') {
                throw new Error("El teléfono debe tener 9 dígitos.");
            }

            const payload = {
                ...data,
                name: name,
                phone: phone === 'NOA' ? 'NOA' : phone,
                created_at: firebase.firestore.FieldValue.serverTimestamp()
            };

            let docRef;
            if (data.id) {
                await db.collection('players').doc(data.id).set(payload);
                docRef = db.collection('players').doc(data.id);
            } else {
                docRef = await db.collection('players').add(payload);
            }

            // Invalidate Cache
            if (window.CacheService) window.CacheService.remove('players', 'all');
            await _updatePlayersSyncToken();

            const doc = await safeFirestoreGet(docRef);
            return { ...doc.data(), id: doc.id };
        },

        async update(id, data) {
            const cleanId = (id || "").toString().trim();
            if (!cleanId) throw new Error("ID de jugador no válido para actualizar");

            try {
                await db.collection('players').doc(cleanId).update(data);
                // Invalidate Cache
                if (window.CacheService) window.CacheService.remove('players', 'all');
                await _updatePlayersSyncToken();

                const doc = await safeFirestoreGet(db.collection('players').doc(cleanId));
                return { id: doc.id, ...doc.data() };
            } catch (err) {
                console.error("Error in FirebaseDB.players.update:", err);
                if (err.message.includes("permission-denied")) {
                    throw new Error("No tienes permisos de escritura en la base de datos Firestore.");
                }
                throw err;
            }
        },

        async delete(id) {
            const cleanId = (id || "").toString().trim();
            if (!cleanId) throw new Error("ID de jugador no especificado");

            const docRef = db.collection('players').doc(cleanId);
            try {
                await docRef.delete();
                // Invalidate Cache
                if (window.CacheService) window.CacheService.remove('players', 'all');
                await _updatePlayersSyncToken();
            } catch (err) {
                console.error("Error direct deleting:", err);
                throw new Error(`Error de Firebase: ${err.message}`);
            }
        },

        async cleanupFictional() {
            const snapshot = await safeFirestoreGet(db.collection('players'));
            let deletedCount = 0;
            for (const doc of snapshot.docs) {
                const data = doc.data();
                if ((data.name || "").toLowerCase().includes('test')) {
                    await doc.ref.delete();
                    deletedCount++;
                }
            }
            if (deletedCount > 0 && window.CacheService) window.CacheService.remove('players', 'all');
            return deletedCount;
        }
    },

    // ============================================
    // SECURITY HELPERS
    // ============================================
    security: {
        async hashPassword(password) {
            if (!password) return "";
            const msgUint8 = new TextEncoder().encode(password);
            const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        }
    },

    // Americanas Collection
    americanas: {
        async getAll() {
            const fetchFn = async () => {
                const snapshot = await safeFirestoreGet(
                    db.collection('americanas').orderBy('date', 'desc')
                );
                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            };

            if (window.CacheService) {
                return await window.CacheService.swr('americanas', 'all', fetchFn);
            }
            return await fetchFn();
        },

        async getById(id) {
            const doc = await safeFirestoreGet(db.collection('americanas').doc(id));
            if (!doc.exists) return null;
            return { id: doc.id, ...doc.data() };
        },

        async create(data) {
            const docRef = await db.collection('americanas').add({
                name: data.name || "Nueva Americana",
                date: data.date || new Date().toISOString().split('T')[0],
                time: data.time || "10:00",
                duration: data.duration || "2h",
                max_courts: data.max_courts || 4,
                category: data.category || 'open',
                image_url: data.image_url || 'img/default-americana.jpg',
                status: data.status || 'open',
                players: data.players || [],
                pair_mode: data.pair_mode || 'rotating',
                registeredPlayers: data.registeredPlayers || data.players || [],
                ...data,
                created_at: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Invalidate cache
            if (window.CacheService) window.CacheService.remove('americanas', 'all');
            if (window.clearDatabaseCache) window.clearDatabaseCache('americanas');
            window.dispatchEvent(new CustomEvent('eventModified', { detail: { type: 'americana', id: docRef.id } }));

            const doc = await safeFirestoreGet(docRef);
            return { id: doc.id, ...doc.data() };
        },

        async update(id, data) {
            await db.collection('americanas').doc(id).update(data);
            // Invalidate cache
            if (window.CacheService) window.CacheService.remove('americanas', 'all');
            if (window.clearDatabaseCache) window.clearDatabaseCache('americanas');
            window.dispatchEvent(new CustomEvent('eventModified', { detail: { type: 'americana', id } }));

            const doc = await safeFirestoreGet(db.collection('americanas').doc(id));
            return { id: doc.id, ...doc.data() };
        },

        async addPlayer(americanaId, playerId) {
            await db.collection('americanas').doc(americanaId).update({
                players: firebase.firestore.FieldValue.arrayUnion(playerId)
            });
            if (window.CacheService) window.CacheService.remove('americanas', 'all');
            if (window.clearDatabaseCache) window.clearDatabaseCache('americanas');
            window.dispatchEvent(new CustomEvent('eventModified', { detail: { type: 'americana', id: americanaId } }));
        },

        async removePlayer(americanaId, playerId) {
            await db.collection('americanas').doc(americanaId).update({
                players: firebase.firestore.FieldValue.arrayRemove(playerId)
            });
            if (window.CacheService) window.CacheService.remove('americanas', 'all');
            if (window.clearDatabaseCache) window.clearDatabaseCache('americanas');
            window.dispatchEvent(new CustomEvent('eventModified', { detail: { type: 'americana', id: americanaId } }));
        },

        async delete(id) {
            console.log(`🗑️ [Telemetry] Purging Americana data: ${id}`);
            const batch = db.batch();

            // Delete the event itself
            batch.delete(db.collection('americanas').doc(id));

            // Scan and delete associated matches to avoid orphan data noise
            const matchesSnap = await safeFirestoreGet(db.collection('matches').where('americana_id', '==', id));
            matchesSnap.forEach(doc => batch.delete(doc.ref));

            await batch.commit();
            console.log(`✅ [Telemetry] Cleanup successful. ${matchesSnap.size} matches purged.`);

            if (window.CacheService) window.CacheService.remove('americanas', 'all');
            if (window.clearDatabaseCache) window.clearDatabaseCache('americanas');
            window.dispatchEvent(new CustomEvent('eventModified', { detail: { type: 'americana', id } }));
        },

        // ========== WAITLIST MANAGEMENT ==========
        async addToWaitlist(eventId, player) {
            const event = await this.getById(eventId);
            const waitlist = event.waitlist || [];

            // Evitar duplicados
            if (waitlist.some(p => p.uid === player.uid)) {
                throw new Error("Ya estás en la lista de reserva");
            }

            // Verificar que no esté ya inscrito
            const players = event.players || [];
            if (players.some(p => (typeof p === 'string' ? p : p.uid) === player.uid)) {
                throw new Error("Ya estás inscrito en este evento");
            }

            waitlist.push({
                uid: player.uid,
                name: player.name,
                joinedAt: new Date().toISOString()
            });

            await this.update(eventId, { waitlist });
        },

        async removeFromWaitlist(eventId, playerId) {
            const event = await this.getById(eventId);
            const waitlist = (event.waitlist || []).filter(p => p.uid !== playerId);
            await this.update(eventId, { waitlist });
        },

        async promoteFromWaitlist(eventId) {
            const event = await this.getById(eventId);
            const waitlist = event.waitlist || [];

            if (waitlist.length === 0) return null;

            const promoted = waitlist.shift(); // Primero de la lista (FIFO)
            const players = event.players || [];

            // Añadir a players
            players.push({
                uid: promoted.uid,
                name: promoted.name,
                id: promoted.uid
            });

            await this.update(eventId, {
                players,
                waitlist,
                registeredPlayers: players // Sync
            });

            return promoted;
        }
    },

    // Matches Collection
    matches: {
        async getAll() {
            const fetchFn = async () => {
                const snapshot = await safeFirestoreGet(db.collection('matches'));
                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            };

            if (window.CacheService) {
                return await window.CacheService.swr('matches', 'all', fetchFn);
            }
            return await fetchFn();
        },
        async getByAmericana(americanaId) {
            const snapshot = await safeFirestoreGet(
                db.collection('matches').where('americana_id', '==', americanaId)
            );
            return snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .sort((a, b) => (a.round || 0) - (b.round || 0));
        },

        async getByPlayer(playerId) {
            const collections = ['matches', 'entrenos_matches'];
            console.log(`📡 [Telemetry] Initiating deep scan for player: ${playerId}`);

            try {
                // Optimized Query Array
                const fetchPromises = collections.flatMap(coll => [
                    safeFirestoreGet(db.collection(coll).where('team_a_ids', 'array-contains', playerId)),
                    safeFirestoreGet(db.collection(coll).where('team_b_ids', 'array-contains', playerId))
                ]);

                const snapshots = await Promise.all(fetchPromises);
                const matchesMap = new Map();

                snapshots.forEach((snap, index) => {
                    const collectionName = collections[Math.floor(index / 2)];
                    snap.docs.forEach(doc => {
                        if (!matchesMap.has(doc.id)) {
                            matchesMap.set(doc.id, {
                                id: doc.id,
                                collection: collectionName,
                                ...doc.data()
                            });
                        }
                    });
                });

                // FALLBACK for legacy data (names or direct match)
                if (matchesMap.size === 0) {
                    console.warn("⚠️ [Telemetry] Standard range scan returned 0. Deploying legacy sonar...");
                    // Simplified exhaustive scan for better battery/data performance
                    const legacyPromises = collections.flatMap(coll => [
                        safeFirestoreGet(db.collection(coll).where('players', 'array-contains', playerId)),
                        safeFirestoreGet(db.collection(coll).where('player1', '==', playerId))
                    ]);
                    const legacySnaps = await Promise.all(legacyPromises);
                    legacySnaps.forEach(snap => snap.docs.forEach(doc => {
                        if (!matchesMap.has(doc.id)) matchesMap.set(doc.id, { id: doc.id, ...doc.data() });
                    }));
                }

                const results = Array.from(matchesMap.values()).sort((a, b) => {
                    const getVal = (d) => d.date || d.created_at?.toDate?.() || d.timestamp || 0;
                    return new Date(getVal(b)) - new Date(getVal(a));
                });

                console.log(`✅ [Telemetry] Signal locked: ${results.length} matches found.`);
                return results;
            } catch (err) {
                console.error("🛑 [Telemetry ERROR] Critical failure in match sonar:", err);
                throw err;
            }
        },

        async create(data) {
            const docRef = await db.collection('matches').add({
                ...data,
                created_at: firebase.firestore.FieldValue.serverTimestamp()
            });
            const doc = await safeFirestoreGet(docRef);
            return { id: doc.id, ...doc.data() };
        },

        async update(id, data) {
            await db.collection('matches').doc(id).update(data);
            const doc = await safeFirestoreGet(db.collection('matches').doc(id));
            return { id: doc.id, ...doc.data() };
        },

        async delete(id) {
            await db.collection('matches').doc(id).delete();
        }
    },

    // Entrenos Collection
    entrenos: {
        async getAll() {
            const fetchFn = async () => {
                const snapshot = await safeFirestoreGet(db.collection('entrenos').orderBy('date', 'desc'));
                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            };

            if (window.CacheService) {
                return await window.CacheService.swr('entrenos', 'all', fetchFn);
            }
            return await fetchFn();
        },
        async getById(id) {
            const doc = await safeFirestoreGet(db.collection('entrenos').doc(id));
            return doc.exists ? { id: doc.id, ...doc.data() } : null;
        },
        async create(data) {
            const docRef = await db.collection('entrenos').add({
                name: data.name || "Nuevo Entreno",
                date: data.date || new Date().toISOString().split('T')[0],
                status: data.status || 'open',
                ...data,
                created_at: firebase.firestore.FieldValue.serverTimestamp()
            });

            if (window.CacheService) window.CacheService.remove('entrenos', 'all');
            if (window.clearDatabaseCache) window.clearDatabaseCache('entrenos');
            window.dispatchEvent(new CustomEvent('eventModified', { detail: { type: 'entreno', id: docRef.id } }));

            const doc = await safeFirestoreGet(docRef);
            return { id: doc.id, ...doc.data() };
        },
        async update(id, data) {
            await db.collection('entrenos').doc(id).update(data);
            if (window.CacheService) window.CacheService.remove('entrenos', 'all');
            if (window.clearDatabaseCache) window.clearDatabaseCache('entrenos');
            window.dispatchEvent(new CustomEvent('eventModified', { detail: { type: 'entreno', id } }));
            const doc = await safeFirestoreGet(db.collection('entrenos').doc(id));
            return { id: doc.id, ...doc.data() };
        },
        async delete(id) {
            console.log(`🗑️ [Telemetry] Purging Entreno data: ${id}`);
            const batch = db.batch();

            // Delete the event itself
            batch.delete(db.collection('entrenos').doc(id));

            // Purge matches
            const matchesSnap = await safeFirestoreGet(db.collection('entrenos_matches').where('americana_id', '==', id));
            matchesSnap.forEach(doc => batch.delete(doc.ref));

            await batch.commit();
            console.log(`✅ [Telemetry] Cleanup successful. ${matchesSnap.size} matches purged.`);

            if (window.CacheService) window.CacheService.remove('entrenos', 'all');
            if (window.clearDatabaseCache) window.clearDatabaseCache('entrenos');
            window.dispatchEvent(new CustomEvent('eventModified', { detail: { type: 'entreno', id } }));
        },

        // ========== WAITLIST MANAGEMENT ==========
        async addToWaitlist(eventId, player) {
            const event = await this.getById(eventId);
            const waitlist = event.waitlist || [];

            // Evitar duplicados
            if (waitlist.some(p => p.uid === player.uid)) {
                throw new Error("Ya estás en la lista de reserva");
            }

            // Verificar que no esté ya inscrito
            const players = event.players || [];
            if (players.some(p => (typeof p === 'string' ? p : p.uid) === player.uid)) {
                throw new Error("Ya estás inscrito en este evento");
            }

            waitlist.push({
                uid: player.uid,
                name: player.name,
                joinedAt: new Date().toISOString()
            });

            await this.update(eventId, { waitlist });
            if (window.clearDatabaseCache) window.clearDatabaseCache('entrenos');
            window.dispatchEvent(new CustomEvent('eventModified', { detail: { type: 'entreno', id: eventId } }));
        },

        async removeFromWaitlist(eventId, playerId) {
            const event = await this.getById(eventId);
            const waitlist = (event.waitlist || []).filter(p => p.uid !== playerId);
            await this.update(eventId, { waitlist });
            if (window.clearDatabaseCache) window.clearDatabaseCache('entrenos');
            window.dispatchEvent(new CustomEvent('eventModified', { detail: { type: 'entreno', id: eventId } }));
        },

        async promoteFromWaitlist(eventId) {
            const event = await this.getById(eventId);
            const waitlist = event.waitlist || [];

            if (waitlist.length === 0) return null;

            const promoted = waitlist.shift(); // Primero de la lista (FIFO)
            const players = event.players || [];

            // Añadir a players
            players.push({
                uid: promoted.uid,
                name: promoted.name,
                id: promoted.uid
            });

            await this.update(eventId, {
                players,
                waitlist,
                registeredPlayers: players // Sync
            });
            if (window.clearDatabaseCache) window.clearDatabaseCache('entrenos');
            window.dispatchEvent(new CustomEvent('eventModified', { detail: { type: 'entreno', id: eventId } }));

            return promoted;
        }
    },

    // Entrenos Matches
    entrenos_matches: {
        async getAll() {
            const snapshot = await safeFirestoreGet(db.collection('entrenos_matches'));
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        },
        async getByPlayer(playerId) {
            const [snapshotA, snapshotB] = await Promise.all([
                safeFirestoreGet(db.collection('entrenos_matches').where('team_a_ids', 'array-contains', playerId)),
                safeFirestoreGet(db.collection('entrenos_matches').where('team_b_ids', 'array-contains', playerId))
            ]);
            const matchesA = snapshotA.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const matchesB = snapshotB.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return [...matchesA, ...matchesB];
        },
        async getByAmericana(entrenoId) {
            const snapshot = await safeFirestoreGet(
                db.collection('entrenos_matches').where('americana_id', '==', entrenoId)
            );
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => (a.round || 0) - (b.round || 0));
        },
        async create(data) {
            const docRef = await db.collection('entrenos_matches').add({
                ...data,
                created_at: firebase.firestore.FieldValue.serverTimestamp()
            });
            const doc = await safeFirestoreGet(docRef);
            return { id: doc.id, ...doc.data() };
        },
        async update(id, data) {
            await db.collection('entrenos_matches').doc(id).update(data);
            const doc = await safeFirestoreGet(db.collection('entrenos_matches').doc(id));
            return { id: doc.id, ...doc.data() };
        },
        async delete(id) {
            await db.collection('entrenos_matches').doc(id).delete();
        }
    },

    // Menu Collection
    menu: {
        async getAll() {
            const snapshot = await safeFirestoreGet(db.collection('menu_items').orderBy('order', 'asc'));
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        },
        async create(data) {
            const docRef = await db.collection('menu_items').add({
                ...data,
                order: parseInt(data.order || 10),
                active: data.active === 'true' || data.active === true
            });
            return { id: docRef.id, ...data };
        },
        async update(id, data) {
            const updateData = { ...data };
            if (updateData.order) updateData.order = parseInt(updateData.order);
            if (updateData.active) updateData.active = (updateData.active === 'true' || updateData.active === true);
            await db.collection('menu_items').doc(id).update(updateData);
        },
        async delete(id) {
            await db.collection('menu_items').doc(id).delete();
        }
    }
};

// Make accessible globally
window.FirebaseDB = FirebaseDB;

// ============================================
// SEED ADMIN USER (Run once on first load)
// ============================================

// ============================================
// SEED INITIAL USERS (Admin & Test Users)
// ============================================

async function seedInitialUsers() {
    // Modo seguro: función deshabilitada en producción para evitar sobreescritura no autorizada de credenciales
    console.log("ℹ️ [Security] seedInitialUsers se encuentra desactivado en producción.");
}

// Exponer de forma restringida si fuera necesario para mantenimiento
window._seedInitialUsers = seedInitialUsers;

console.log("🔥 Firebase Init Module Fully Loaded & Executed");