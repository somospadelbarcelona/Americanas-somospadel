console.log("🔥 Initializing Firebase...");

// GLOBAL ERROR DIAGNOSTIC
window.onerror = function (msg, url, line, col, error) {
    const errorDetail = error ? error.stack : 'No stack trace';
    console.error("Critical Error Catch:", msg, url, line, col, error);
    alert("🔴 ERROR DETECTADO\n" +
        "Mensaje: " + msg + "\n" +
        "Archivo: " + (url || 'Script Externo/CORS') + "\n" +
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
    }
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
            const docRef = await db.collection('players').add({
                ...data,
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
                status: 'open',
                players: [],
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
        }
    },

    // Matches Collection
    matches: {
        async getByAmericana(americanaId) {
            const snapshot = await db.collection('matches')
                .where('americana_id', '==', americanaId)
                .get();
            // Sort in client to avoid requiring a composite index
            return snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .sort((a, b) => (a.round || 0) - (b.round || 0));
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
            name: "Alex Coscolin",
            phone: "649219350",
            data: {
                password: "JARABA",
                role: "admin",
                status: "active",
                level: "PRO",
                self_rate_level: "PRO",
                play_preference: "indifferent",
                category_preference: "mixed",
                matches_played: 0,
                win_rate: 0
            }
        },
        {
            name: "Sergio Test",
            phone: "649219351",
            data: {
                password: "SERGIO21",
                role: "player",
                status: "active",
                level: "INTERMEDIATE",
                self_rate_level: "INTERMEDIATE",
                play_preference: "competitive",
                category_preference: "male",
                matches_played: 0,
                win_rate: 0
            }
        },
        {
            name: "NOA",
            phone: "NOA",
            data: {
                password: "NOA21",
                role: "admin",
                status: "active",
                level: "PRO",
                self_rate_level: "PRO",
                play_preference: "indifferent",
                category_preference: "mixed",
                matches_played: 0,
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
                // AUTO-FIX: If admin has the old placeholder name "JARABA", update it to "Alex Coscolin"
                if (user.phone === "649219350" && existingUser.name === "JARABA") {
                    console.log(`🔧 Updating Admin name from JARABA to ${user.name}...`);
                    await FirebaseDB.players.update(existingUser.id, { name: user.name });
                    console.log("✅ Admin name updated successfully");
                } else {
                    console.log(`👌 User already exists: ${user.name}`);
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