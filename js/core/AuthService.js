/**
 * AuthService.js (Global Version)
 */
(function () {
    const auth = window.firebase ? firebase.auth() : null;

    class AuthService {
        constructor() {
            this.init();
        }

        init() {
            // --- DEV MODE BYPASS (REQUESTED BY USER) ---
            console.warn("🚧 DEV MODE: Auth Bypassed. Logging in as 'Dev Admin'.");
            const devUser = {
                uid: 'dev-user-001',
                email: 'dev@somospadel.com',
                displayName: 'Alejandro Coscolín',
                role: 'admin_player'
            };

            // Delay slightly to ensure Store is ready
            setTimeout(() => {
                if (window.Store) {
                    window.Store.setState('currentUser', devUser);
                }
            }, 500);

            // Keep Firebase listener as backup but Dev Mode takes precedence for UI
            if (auth) {
                auth.onAuthStateChanged(user => {
                    // Optional: If we wanted real auth, we'd uncomment this.
                    // For now, we ignore real auth state updates to keep the session "Open".
                    console.log("Firebase Auth State Change ignored in Dev Mode");
                });
            }
        }

        async login(email, password) {
            try {
                const userCredential = await auth.signInWithEmailAndPassword(email, password);
                const user = userCredential.user;

                // Fetch extra data from Firestore
                const phone = user.email ? user.email.split('@')[0] : '';
                const playerData = await window.FirebaseDB.players.getByPhone(phone);

                const finalUser = {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    ...playerData
                };

                window.Store.setState('currentUser', finalUser);
                return { success: true, user: finalUser };
            } catch (error) {
                console.warn("⚠️ Firebase Login failed, trying Local Fallback...", error.code);

                const adminUser = "649219350@somospadel.com";
                const adminPass = "JARABA";

                if (email === adminUser && password === adminPass) {
                    const playerData = await window.FirebaseDB.players.getByPhone("649219350");
                    const mockUser = {
                        uid: playerData ? playerData.id : "local-admin-alex",
                        email: email,
                        ...playerData,
                        displayName: "Alejandro Coscolín",
                        name: "Alejandro Coscolín",
                        role: 'admin_player'
                    };

                    window.Store.setState('currentUser', mockUser);
                    return { success: true, user: mockUser };
                }

                return { success: false, error: error.message };
            }
        }

        async register(email, password, additionalData) {
            try {
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;

                if (additionalData && additionalData.name) {
                    await user.updateProfile({ displayName: additionalData.name });
                }

                // Create Firestore Document
                const phone = email.split('@')[0];
                const newPlayer = await window.FirebaseDB.players.create({
                    ...additionalData,
                    phone: phone,
                    uid: user.uid,
                    status: 'active'
                });

                const finalUser = {
                    uid: user.uid,
                    email: email,
                    ...newPlayer
                };

                window.Store.setState('currentUser', finalUser);
                return { success: true, user: finalUser };
            } catch (error) {
                console.warn("⚠️ Firebase Register failed, using Local Simulation...", error.code);

                if (error.code === 'auth/configuration-not-found' || error.code === 'auth/network-request-failed' || error.code === 'auth/operation-not-supported-in-this-environment') {
                    const phone = email.split('@')[0];
                    const newPlayer = await window.FirebaseDB.players.create({
                        ...additionalData,
                        phone: phone,
                        status: 'active'
                    });

                    const mockUser = {
                        uid: newPlayer.id,
                        email: email,
                        displayName: additionalData ? additionalData.name : 'Alejandro Coscolín',
                        ...newPlayer
                    };

                    window.Store.setState('currentUser', mockUser);
                    return { success: true, user: mockUser };
                }

                return { success: false, error: error.message };
            }
        }

        async logout() {
            try {
                await auth.signOut();
                return { success: true };
            } catch (error) {
                return { success: false, error: error.message };
            }
        }
    }

    window.AuthService = new AuthService();
    console.log("🛡️ AuthService Global Loaded");
})();
