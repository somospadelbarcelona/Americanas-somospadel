console.log("🔥 Initializing Firebase...");

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
        auth = firebase.auth();

        // Export to window for global access across scripts
        window.db = db;
        window.auth = auth;
        window.FirebaseFirestore = firebase.firestore; // ADDED: Global access to FieldPath, etc.

        // Initialize Messaging
        let messaging;
        try {
            if (firebase.messaging.isSupported()) {
                messaging = firebase.messaging();
                window.messaging = messaging;
                console.log("📨 Firebase Messaging Initialized");
            } else {
                console.log("📴 Firebase Messaging not supported in this browser");
            }
        } catch (e) { console.warn("Messaging init error", e); }

        // Enable offline persistence (Premium UX: Works in subways/low signal)
        db.enablePersistence({ synchronizeTabs: true })
            .then(() => {
                console.log("📦 Firestore persistence enabled");
            })
            .catch((err) => {
                if (err.code == 'failed-precondition') {
                    console.warn("⚠️ Multiple tabs open, persistence limited.");
                } else if (err.code == 'unimplemented') {
                    console.warn("⚠️ Current browser doesn't support persistence.");
                }
            });
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
        async getAll() {
            if (!db) throw new Error("Firebase DB not initialized yet");

            const fetchFn = async () => {
                const snapshot = await db.collection('players').get();
                return snapshot.docs.map(doc => {
                    const data = doc.data();
                    return { ...data, id: doc.id, uid: doc.uid || data.uid || doc.id };
                });
            };

            // Turbo Cache: Instant load with SWR
            if (window.CacheService) {
                return await window.CacheService.swr('players', 'all', fetchFn);
            }
            return await fetchFn();
        },

        async getById(id) {
            const doc = await db.collection('players').doc(id).get();
            if (!doc.exists) return null;
            return { id: doc.id, ...doc.data() };
        },

        async getByPhone(phone) {
            const snapshot = await db.collection('players')
                .where('phone', '==', phone)
                .limit(1)
                .get();

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
            await db.collection('americanas').doc(id).delete();
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
            // Queries exhaustivas (Moderna + Legacy)
            // Nota: Firestore limita el nº de queries paralelas, pero esto es necesario para consistencia total sin reindexar todo.
            const fetchPromises = collections.flatMap(coll => [
                // Modern Arrays
                db.collection(coll).where('team_a_ids', 'array-contains', playerId).get(),
                db.collection(coll).where('team_b_ids', 'array-contains', playerId).get(),
                // Legacy Fields (Direct ID Match)
                db.collection(coll).where('player1', '==', playerId).get(),
                db.collection(coll).where('player2', '==', playerId).get(),
                db.collection(coll).where('player3', '==', playerId).get(),
                db.collection(coll).where('player4', '==', playerId).get(),
                // Ultra Legacy (Players Array)
                db.collection(coll).where('players', 'array-contains', playerId).get()
            ]);

            const snapshots = await Promise.all(fetchPromises);
            const matchesMap = new Map(); // Use Map to deduplicate by ID efficiently

            snapshots.forEach((snap, index) => {
                // Determine collection based on index stride (7 queries per collection)
                const collectionName = collections[Math.floor(index / 7)];
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

            // FALLBACK 2: Búsqueda dentro de documentos de 'entrenos' (Si los resultados están embebidos)
            if (matchesMap.size === 0) {
                console.log("⚠️ [Matches] Trying EMBEDDED SEARCH in 'entrenos' collection...");
                const entrenosSnap = await db.collection('entrenos').orderBy('date', 'desc').limit(20).get();

                entrenosSnap.docs.forEach(doc => {
                    const evt = doc.data();
                    // STRICT CHECK: Skip cancelled events
                    if (evt.status === 'cancelled' || evt.cancelled === true) return;

                    // Check common fields where matches might be hidden
                    const embeddedMatches = evt.matches || evt.results || evt.games || [];

                    if (Array.isArray(embeddedMatches)) {
                        embeddedMatches.forEach((em, idx) => {
                            // Skip if match itself is marked cancelled
                            if (em.status === 'cancelled') return;

                            // Check if user is in this embedded match
                            const strM = JSON.stringify(em).toLowerCase();
                            const targetId = String(playerId).toLowerCase();

                            if (strM.includes(targetId)) {
                                // Construct a virtual match ID
                                const virtualId = `${doc.id}_m_${idx}`;
                                if (!matchesMap.has(virtualId)) {
                                    matchesMap.set(virtualId, {
                                        id: virtualId,
                                        collection: 'entrenos_embedded',
                                        americana_name: evt.name, // Parent event name
                                        date: evt.date, // Parent event date
                                        status: evt.status, // Link parent status
                                        ...em
                                    });
                                }
                            }
                        });
                    }
                });
            }

            // Convert Map to Array and Sort by Date Descending
            // Descarga los últimos 200 partidos y busca manualmente (por si hay problemas de índices/tipos)
            if (matchesMap.size === 0) {
                console.log("⚠️ [Matches] Standard query empty. Trying EXHAUSTIVE SEARCH (Last 200)...");
                const blindFetch = collections.flatMap(coll =>
                    db.collection(coll).orderBy('created_at', 'desc').limit(200).get()
                );

                const blindSnaps = await Promise.all(blindFetch);

                blindSnaps.forEach((snap, index) => {
                    const collectionName = collections[Math.floor(index)]; // Simple 1-to-1 mapping here since blindFetch is 1 per coll
                    if (!collectionName) return;

                    snap.docs.forEach(doc => {
                        const m = doc.data();

                        // STRICT CHECK: Skip cancelled matches
                        if (m.status === 'cancelled' || m.cancelled === true) return;

                        const docId = doc.id;
                        if (matchesMap.has(docId)) return;

                        // Check EVERY field for the ID
                        const strData = JSON.stringify(m).toLowerCase();
                        const targetId = String(playerId).toLowerCase();

                        // ID check inside stringified data (Brute force but finds nested objects)
                        // Also check Name if possible? (Simpler to let PlayerController handle name)
                        // Just check ID here carefully
                        if (strData.includes(targetId)) {
                            matchesMap.set(docId, { id: docId, collection: collectionName, ...m });
                        }
                    });
                });
            }

            // Convert Map to Array and Sort by Date Descending
            const results = Array.from(matchesMap.values()).sort((a, b) => {
                const getVal = (d) => d.date || d.createdAt || d.timestamp || 0;
                const dateA = new Date(getVal(a));
                const dateB = new Date(getVal(b));
                return dateB - dateA;
            });

            console.log(`✅ [Matches] Total found for ${playerId}: ${results.length}`);
            return results;
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
            const snapshot = await db.collection('entrenos').orderBy('date', 'desc').get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
            const doc = await docRef.get();
            return { id: doc.id, ...doc.data() };
        },
        async update(id, data) {
            await db.collection('entrenos').doc(id).update(data);
            const doc = await db.collection('entrenos').doc(id).get();
            return { id: doc.id, ...doc.data() };
        },
        async delete(id) {
            await db.collection('entrenos').doc(id).delete();
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