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
                displayName: 'Alejandro (Dev)',
                role: 'admin'
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
                return { success: true, user: userCredential.user };
            } catch (error) {
                console.warn("⚠️ Firebase Login failed, trying Local Fallback...", error.code);

                // FALLBACK: MODO LOCAL / EMERGENCIA
                // Si falla Firebase (por CORS en file:// o config), validamos localmente al Admin
                // Usuario: 649219350 (convertido a email: 649219350@somospadel.com)
                // Pass: JARABA

                const adminUser = "649219350@somospadel.com";
                const adminPass = "JARABA";
                const noaUser = "NOA@somospadel.com";
                const noaPass = "NOA21";

                if ((email === adminUser && password === adminPass) ||
                    (email === noaUser && password === noaPass)) {

                    console.log("✅ LOCAL ADMIN LOGIN SUCCESS (Bypassing Firebase)");

                    // Crear usuario falso compatible con Firebase User Object
                    const mockUser = {
                        uid: email === adminUser ? "local-admin-alex" : "local-admin-noa",
                        email: email,
                        displayName: email === adminUser ? "Alex Coscolin (Local)" : "NOA (Local)",
                        role: 'admin' // Custom fields won't persist in firebase auth object naturally without claims, 
                        // but our Store handles it.
                    };

                    // Forzar estado en Store
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
                return { success: true, user: user };
            } catch (error) {
                console.warn("⚠️ Firebase Register failed, using Local Simulation...", error.code);

                // Allow registration in "Demo Mode" if backend is restricted
                if (error.code === 'auth/configuration-not-found' || error.code === 'auth/network-request-failed' || error.code === 'auth/operation-not-supported-in-this-environment') {
                    const mockUser = {
                        uid: 'local-user-' + Date.now(),
                        email: email,
                        displayName: additionalData ? additionalData.name : 'Usuario Local',
                        role: 'player'
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
