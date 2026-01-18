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
    alert("🔴 ERROR DETECTADO\n" +
        "Mensaje: " + msg + "\n" +
        "Archivo: " + url + "\n" +
        "Línea: " + line + "\n" +
        "Detalles: " + errorDetail.substring(0, 100));
    return false;
};

window.addEventListener('unhandledrejection', function (event) {
    alert("🔴 ERROR ASÍNCRONO:\n" + event.reason);
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

        // Enable offline persistence
        db.enablePersistence()
            .catch((err) => {
                if (err.code == 'failed-precondition') {
                    console.warn("⚠️ Multiple tabs open, persistence can only be enabled in one tab at a time.");
                } else if (err.code == 'unimplemented') {
                    console.warn("⚠️ The current browser doesn't support persistence.");
                }
            });

        console.log("📦 Firestore persistence enabled");
    } catch (error) {
        console.error("❌ Firebase initialization error:", error);
        alert("🔴 FIREBASE ERROR: " + error.message);
    }
}
if (typeof window.FIREBASE_CONFIG === 'undefined') {
    alert("🔴 CONFIG ERROR: firebase-config.js no cargado");
}
if (typeof firebase === 'undefined') {
    alert("🔴 NETWORK ERROR: Firebase SDK no cargado. Revisa tu internet.");
}


// ============================================
// FIRESTORE HELPERS
// ============================================

const FirebaseDB = {
    // Players Collection
    players: {
        async getAll() {
            const snapshot = await db.collection('players').get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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

            const docRef = await db.collection('players').add({
                ...data,
                name: name,
                phone: phone === 'NOA' ? 'NOA' : phone,
                created_at: firebase.firestore.FieldValue.serverTimestamp()
            });
            const doc = await docRef.get();
            return { id: doc.id, ...doc.data() };
        },

        async update(id, data) {
            await db.collection('players').doc(id).update(data);
            const doc = await db.collection('players').doc(id).get();
            return { id: doc.id, ...doc.data() };
        },

        async delete(id) {
            await db.collection('players').doc(id).delete();
        },

        async cleanupFictional() {
            console.log("🧹 Inicia limpieza de base de datos profesional...");
            const snapshot = await db.collection('players').get();
            let deletedCount = 0;

            for (const doc of snapshot.docs) {
                const data = doc.data();
                const name = (data.name || "").toLowerCase();
                const phone = (data.phone || "").toString();

                // Rules for "fictional" data
                const isTest = name.includes('test') || name.includes('ficticio') || name.includes('prueba');
                const isInvalidPhone = phone.length < 9 && phone !== 'NOA';

                if (isTest || isInvalidPhone) {
                    console.log(`🗑️ Eliminando usuario no profesional: ${data.name} (${phone})`);
                    await doc.ref.delete();
                    deletedCount++;
                }
            }
            console.log(`✅ Limpieza completada. ${deletedCount} registros eliminados.`);
            return deletedCount;
        }
    },

    // Americanas Collection
    americanas: {
        async getAll() {
            const snapshot = await db.collection('americanas')
                .orderBy('date', 'desc')
                .get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
            const doc = await docRef.get();
            return { id: doc.id, ...doc.data() };
        },

        async update(id, data) {
            await db.collection('americanas').doc(id).update(data);
            const doc = await db.collection('americanas').doc(id).get();
            return { id: doc.id, ...doc.data() };
        },

        async addPlayer(americanaId, playerId) {
            await db.collection('americanas').doc(americanaId).update({
                players: firebase.firestore.FieldValue.arrayUnion(playerId)
            });
        },

        async removePlayer(americanaId, playerId) {
            await db.collection('americanas').doc(americanaId).update({
                players: firebase.firestore.FieldValue.arrayRemove(playerId)
            });
        },

        async delete(id) {
            await db.collection('americanas').doc(id).delete();
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
            const fetchPromises = collections.flatMap(coll => [
                db.collection(coll).where('team_a_ids', 'array-contains', playerId).get(),
                db.collection(coll).where('team_b_ids', 'array-contains', playerId).get()
            ]);

            const snapshots = await Promise.all(fetchPromises);
            const matches = [];

            snapshots.forEach((snap, index) => {
                const collectionName = collections[Math.floor(index / 2)];
                snap.docs.forEach(doc => {
                    matches.push({
                        id: doc.id,
                        collection: collectionName,
                        ...doc.data()
                    });
                });
            });

            // Sort by creation time DESC
            return matches.sort((a, b) => {
                const dateA = a.timestamp || a.createdAt || 0;
                const dateB = b.timestamp || b.createdAt || 0;
                return new Date(dateB) - new Date(dateA);
            });
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
                password: "JARABA",
                role: "admin_player",
                membership: "somospadel_bcn",
                status: "active",
                level: 7.0,
                self_rate_level: 7.0,
                play_preference: "indifferent",
                category_preference: "mixed",
                matches_played: 1,
                win_rate: 0
            }
        }
    ];

    console.log("🌱 Checking initial users data...");

    for (const user of usersToSeed) {
        try {
            const existingUser = await FirebaseDB.players.getByPhone(user.phone);
            if (!existingUser) {
                console.log(`✨ Creating user: ${user.name}...`);
                await FirebaseDB.players.create({
                    name: user.name,
                    phone: user.phone,
                    ...user.data
                });
                console.log(`✅ User created: ${user.name} / ${user.phone}`);
            } else {
                // Keep name fixed to Alejandro Coscolín if it's the master phone
                if (user.phone === "649219350" && existingUser.name !== "Alejandro Coscolín") {
                    console.log(`🔧 Enforcing Master name to Alejandro Coscolín...`);
                    await FirebaseDB.players.update(existingUser.id, { name: "Alejandro Coscolín", role: "admin_player" });
                }
            }
        } catch (error) {
            console.error(`❌ Error seeding user ${user.name}:`, error);
        }
    }
}

// Auto-seed to ensure admin account is always ready
seedInitialUsers().then(() => {
    console.log("🚀 Firebase ready & Seeded!");
});

console.log("🔥 Firebase Init Module Loaded");