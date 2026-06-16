console.log("🔥 [v99] Initializing Firebase...");

// GLOBAL ERROR DIAGNOSTIC
window.onerror = function (msg, url, line, col, error) {
    if (msg.toLowerCase().includes('script error') && line === 0) {
        console.warn("⚠️ Suppressed CORS/Script Error:", msg);
        return false; // Let it propagate to console
    }

    const errorDetail = error ? error.stack : 'No stack trace';
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
    if (window.PremiumModal) {
        window.PremiumModal.alert({
            title: "🔴 ERROR ASÍNCRONO",
            message: event.reason,
            type: 'danger'
        });
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

        // Enable offline persistence (Premium UX: Works in subways/low signal)
        // Debe ser llamado INMEDIATAMENTE después de crear la instancia db y ANTES de cualquier consulta.
        try {
            db.enablePersistence({ synchronizeTabs: true })
                .then(() => {
                    console.log("📦 Firestore persistence enabled");
                })
                .catch((err) => {
                    console.warn("⚠️ Firestore persistence failed to enable (expected under file:// protocol):", err.message);
                });
        } catch (e) {
            console.warn("⚠️ Sync error enabling Firestore persistence:", e);
        }

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

        // Verify Firestore connection immediately
        db.collection('players').limit(1).get()
            .then(snapshot => {
                console.log(`✅ Conexión Firestore OK, ${snapshot.size} documentos en 'players'`);
            })
            .catch(err => {
                console.error('❌ Error al conectar con Firestore al iniciar:', err);
                const isPermissionError = err.code === 'permission-denied' || 
                                           (err.message && err.message.toLowerCase().includes('permission-denied')) ||
                                           (err.message && err.message.toLowerCase().includes('missing or insufficient permissions'));
                
                if (isPermissionError) {
                    console.log("ℹ️ Firestore connection requires authentication (normal behavior before login).");
                } else if (window.PremiumModal) {
                    window.PremiumModal.alert({
                        title: "🔴 FIREBASE CONN ERROR",
                        message: err.message || 'Error de conexión a Firestore',
                        type: 'danger'
                    });
                }
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

const FirebaseDB = {
    // Players Collection
    players: {
        async getAll(force = false) {
            if (!db) throw new Error("Firebase DB not initialized yet");

            const fetchFn = async () => {
                const snapshot = await db.collection('players').get();
                return snapshot.docs.map(doc => {
                    const data = doc.data();
                    return { ...data, id: doc.id, uid: data.uid || doc.id };
                });
            };

            // Turbo Cache: Instant load with SWR (unless forced)
            if (window.CacheService && !force) {
                return await window.CacheService.swr('players', 'all', fetchFn, null, 1000 * 60 * 15); // Revalidate every 15 mins
            }
            const fresh = await fetchFn();
            if (window.CacheService) window.CacheService.set('players', 'all', fresh);
            return fresh;
        },

        async getById(id) {
            const doc = await db.collection('players').doc(id).get();
            if (!doc.exists) return null;
            return { id: doc.id, ...doc.data() };
        },

        async getByPhone(phone) {
            if (!phone) return null;
            const cleanPhone = String(phone).trim();
            let snapshot = await db.collection('players')
                .where('phone', '==', cleanPhone)
                .limit(1)
                .get();

            // Fallback: If not found and it's a number, try querying as type Number
            if (snapshot.empty && !isNaN(cleanPhone) && cleanPhone !== '') {
                snapshot = await db.collection('players')
                    .where('phone', '==', Number(cleanPhone))
                    .limit(1)
                    .get();
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

            const doc = await docRef.get();
            return { ...doc.data(), id: doc.id };
        },

        async update(id, data) {
            const cleanId = (id || "").toString().trim();
            if (!cleanId) throw new Error("ID de jugador no válido para actualizar");

            try {
                await db.collection('players').doc(cleanId).update(data);
                // Invalidate Cache
                if (window.CacheService) window.CacheService.remove('players', 'all');

                const doc = await db.collection('players').doc(cleanId).get();
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
            } catch (err) {
                console.error("Error direct deleting:", err);
                throw new Error(`Error de Firebase: ${err.message}`);
            }
        },

        async cleanupFictional() {
            const snapshot = await db.collection('players').get();
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
                const snapshot = await db.collection('americanas')
                    .orderBy('date', 'desc')
                    .get();
                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            };

            if (window.CacheService) {
                return await window.CacheService.swr('americanas', 'all', fetchFn);
            }
            return await fetchFn();
        },

        async getById(id) {
            const doc = await db.collection('americanas').doc(id).get();
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

            const doc = await docRef.get();
            return { id: doc.id, ...doc.data() };
        },

        async update(id, data) {
            await db.collection('americanas').doc(id).update(data);
            // Invalidate cache
            if (window.CacheService) window.CacheService.remove('americanas', 'all');

            const doc = await db.collection('americanas').doc(id).get();
            return { id: doc.id, ...doc.data() };
        },

        async addPlayer(americanaId, playerId) {
            await db.collection('americanas').doc(americanaId).update({
                players: firebase.firestore.FieldValue.arrayUnion(playerId)
            });
            if (window.CacheService) window.CacheService.remove('americanas', 'all');
        },

        async removePlayer(americanaId, playerId) {
            await db.collection('americanas').doc(americanaId).update({
                players: firebase.firestore.FieldValue.arrayRemove(playerId)
            });
            if (window.CacheService) window.CacheService.remove('americanas', 'all');
        },

        async delete(id) {
            console.log(`🗑️ [Telemetry] Purging Americana data: ${id}`);
            const batch = db.batch();

            // Delete the event itself
            batch.delete(db.collection('americanas').doc(id));

            // Scan and delete associated matches to avoid orphan data noise
            const matchesSnap = await db.collection('matches').where('americana_id', '==', id).get();
            matchesSnap.forEach(doc => batch.delete(doc.ref));

            await batch.commit();
            console.log(`✅ [Telemetry] Cleanup successful. ${matchesSnap.size} matches purged.`);

            if (window.CacheService) window.CacheService.remove('americanas', 'all');
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
                const snapshot = await db.collection('matches').get();
                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            };

            if (window.CacheService) {
                return await window.CacheService.swr('matches', 'all', fetchFn);
            }
            return await fetchFn();
        },
        async getByAmericana(americanaId) {
            const snapshot = await db.collection('matches')
                .where('americana_id', '==', americanaId)
                .get();
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
                    db.collection(coll).where('team_a_ids', 'array-contains', playerId).get(),
                    db.collection(coll).where('team_b_ids', 'array-contains', playerId).get()
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
                        db.collection(coll).where('players', 'array-contains', playerId).get(),
                        db.collection(coll).where('player1', '==', playerId).get()
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
            const doc = await docRef.get();
            return { id: doc.id, ...doc.data() };
        },

        async update(id, data) {
            await db.collection('matches').doc(id).update(data);
            const doc = await db.collection('matches').doc(id).get();
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
                const snapshot = await db.collection('entrenos').orderBy('date', 'desc').get();
                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            };

            if (window.CacheService) {
                return await window.CacheService.swr('entrenos', 'all', fetchFn);
            }
            return await fetchFn();
        },
        async getById(id) {
            const doc = await db.collection('entrenos').doc(id).get();
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

            const doc = await docRef.get();
            return { id: doc.id, ...doc.data() };
        },
        async update(id, data) {
            await db.collection('entrenos').doc(id).update(data);
            if (window.CacheService) window.CacheService.remove('entrenos', 'all');
            const doc = await db.collection('entrenos').doc(id).get();
            return { id: doc.id, ...doc.data() };
        },
        async delete(id) {
            console.log(`🗑️ [Telemetry] Purging Entreno data: ${id}`);
            const batch = db.batch();

            // Delete the event itself
            batch.delete(db.collection('entrenos').doc(id));

            // Purge matches
            const matchesSnap = await db.collection('entrenos_matches').where('americana_id', '==', id).get();
            matchesSnap.forEach(doc => batch.delete(doc.ref));

            await batch.commit();
            console.log(`✅ [Telemetry] Cleanup successful. ${matchesSnap.size} matches purged.`);

            if (window.CacheService) window.CacheService.remove('entrenos', 'all');
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

    // Entrenos Matches
    entrenos_matches: {
        async getAll() {
            const snapshot = await db.collection('entrenos_matches').get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        },
        async getByPlayer(playerId) {
            const [snapshotA, snapshotB] = await Promise.all([
                db.collection('entrenos_matches').where('team_a_ids', 'array-contains', playerId).get(),
                db.collection('entrenos_matches').where('team_b_ids', 'array-contains', playerId).get()
            ]);
            const matchesA = snapshotA.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const matchesB = snapshotB.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return [...matchesA, ...matchesB];
        },
        async getByAmericana(entrenoId) {
            const snapshot = await db.collection('entrenos_matches').where('americana_id', '==', entrenoId).get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => (a.round || 0) - (b.round || 0));
        },
        async create(data) {
            const docRef = await db.collection('entrenos_matches').add({
                ...data,
                created_at: firebase.firestore.FieldValue.serverTimestamp()
            });
            const doc = await docRef.get();
            return { id: doc.id, ...doc.data() };
        },
        async update(id, data) {
            await db.collection('entrenos_matches').doc(id).update(data);
            const doc = await db.collection('entrenos_matches').doc(id).get();
            return { id: doc.id, ...doc.data() };
        },
        async delete(id) {
            await db.collection('entrenos_matches').doc(id).delete();
        }
    },

    // Menu Collection
    menu: {
        async getAll() {
            const snapshot = await db.collection('menu_items').orderBy('order', 'asc').get();
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
    const usersToSeed = [
        {
            name: "Alejandro Coscolín",
            phone: "649219350",
            data: {
                password: "5560e325f24fa78679bd0d8257060381fca964ed2ce6ab0d3c9664165295f6b0", // Hashed password (NOA21)
                status: "active",
                role: "super_admin",
                level: 3.0,
                self_rate_level: 3.0
            }
        }
    ];

    console.log("🌱 Checking and Cleaning Users data...");

    for (const user of usersToSeed) {
        try {
            // FIND ALL INSTANCES OF THIS PHONE (DUPLICATE PROTECTION)
            const snapshot = await db.collection('players').where('phone', '==', user.phone).get();

            if (snapshot.empty) {
                console.log(`✨ Creating master user: ${user.name}...`);
                await FirebaseDB.players.create({
                    name: user.name,
                    phone: user.phone,
                    ...user.data
                });
            } else if (snapshot.docs.length >= 1) {
                // MERGE & CLEANUP DUPLICATES
                console.log(`🧹 Found ${snapshot.docs.length} instances for ${user.phone}. Cleaning up...`);

                let masterDoc = snapshot.docs[0];
                let maxMatches = 0;
                let maxLevel = 7.0;

                // Identify best attributes from all duplicates
                snapshot.docs.forEach(doc => {
                    const d = doc.data();
                    if ((d.matches_played || 0) > maxMatches) maxMatches = d.matches_played;
                    if ((d.level || 0) > maxLevel) maxLevel = d.level;
                    // If one is already super_admin, prefer that as master doc if possible
                    if (d.role === 'super_admin') masterDoc = doc;
                });

                // Update the Master Document
                console.log(`🔧 Enforcing Master credentials on doc: ${masterDoc.id}`);
                const updatePayload = {
                    name: "Alejandro Coscolín",
                    role: "super_admin",
                    phone: user.phone,
                    status: "active",
                    password: user.data.password
                };

                // Si el nivel está en 4.2 o no existe, lo ponemos a 3.0 una última vez
                const currentLevel = masterDoc.data().level;
                if (!currentLevel || currentLevel === 4.2) {
                    updatePayload.level = 3.0;
                    updatePayload.self_rate_level = 3.0;
                }

                // Solo añadir matches_played si es mayor al actual durante la limpieza
                if (maxMatches > (masterDoc.data().matches_played || 0)) {
                    updatePayload.matches_played = maxMatches;
                }

                await db.collection('players').doc(masterDoc.id).update(updatePayload);

                // --- NEW: INICIALIZAR HISTORIAL DE NIVEL (Para visualización) ---
                try {
                    const historySnap = await db.collection('level_history').where('userId', '==', masterDoc.id).limit(1).get();
                    if (historySnap.empty && window.LevelAdjustmentService) {
                        console.log("🧪 Seeding Level History for Alejandro (6 matches simulation)...");
                        await LevelAdjustmentService.simulateHistoryForUser(masterDoc.id, 3.0, 6);
                    }
                } catch (e) {
                    console.error("Error seeding level history:", e);
                }

                // Delete all other duplicates
                for (const doc of snapshot.docs) {
                    if (doc.id !== masterDoc.id) {
                        console.log(`🗑️ Deleting duplicate doc: ${doc.id}`);
                        await doc.ref.delete();
                    }
                }
                console.log(`✅ Cleanup complete for ${user.phone}. Only 1 Super Admin account remains.`);
            }
        } catch (error) {
            console.error(`❌ Error seeding/cleaning user ${user.name}:`, error);
        }
    }
}

// Auto-seed to ensure admin account is always ready
seedInitialUsers().then(() => {
    console.log("🚀 Firebase ready & Seeded!");
});

console.log("🔥 Firebase Init Module Fully Loaded & Executed");