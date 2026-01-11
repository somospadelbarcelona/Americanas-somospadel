/**
 * AuthService.js (Global Version)
 * Perfectly restored with standard ID handling
 */
(function () {
    const auth = window.firebase ? firebase.auth() : null;

    class AuthService {
        constructor() {
            this.init();
        }

        init() {
            if (auth) {
                auth.onAuthStateChanged(user => {
                    console.log("Firebase Auth State Changed:", user ? user.uid : "No user");
                    if (user) {
                        this.handleAuthStateChange(user);
                    } else {
                        window.Store.setState('currentUser', null);
                    }
                });
            }
        }

        async handleAuthStateChange(user) {
            const phone = user.email ? user.email.split('@')[0] : '';
            let playerData = null;
            try {
                playerData = await window.FirebaseDB.players.getByPhone(phone);
            } catch (e) {
                console.error("Error fetching player data on auth state change", e);
            }

            const finalUser = {
                id: user.uid,
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                ...playerData
            };
            window.Store.setState('currentUser', finalUser);
        }

        async login(email, password) {
            try {
                if (!auth) throw new Error("Firebase Auth not initialized");

                const userCredential = await auth.signInWithEmailAndPassword(email, password);
                const user = userCredential.user;

                const phone = user.email ? user.email.split('@')[0] : '';
                const playerData = await window.FirebaseDB.players.getByPhone(phone);

                if (playerData && playerData.status === 'pending') {
                    await auth.signOut(); // Force signout
                    throw new Error("⏳ TU CUENTA ESTÁ PENDIENTE DE VALIDACIÓN POR UN ADMINISTRADOR.");
                }

                const finalUser = {
                    id: user.uid,
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    ...playerData
                };

                window.Store.setState('currentUser', finalUser);
                return { success: true, user: finalUser };
            } catch (error) {
                console.warn("⚠️ Firebase Login failed, trying Local Fallback...", error.code);

                // Re-throw pending validation error immediately
                if (error.message.includes("PENDIENTE")) {
                    return { success: false, error: error.message };
                }

                // === LOCAL AUTHENTICATION FALLBACK ===
                // Try to authenticate against Firestore directly
                try {
                    const phone = email.includes('@') ? email.split('@')[0] : email;
                    const playerData = await window.FirebaseDB.players.getByPhone(phone);

                    if (!playerData) {
                        throw new Error("Usuario no encontrado");
                    }

                    // Check password
                    if (playerData.password !== password) {
                        throw new Error("Contraseña incorrecta");
                    }

                    // Check if account is pending
                    if (playerData.status === 'pending') {
                        throw new Error("⏳ TU CUENTA ESTÁ PENDIENTE DE VALIDACIÓN POR UN ADMINISTRADOR.");
                    }

                    // Check if account is blocked
                    if (playerData.status === 'blocked') {
                        throw new Error("🚫 TU CUENTA HA SIDO BLOQUEADA. Contacta con el administrador.");
                    }

                    // Success - create mock user session
                    const mockUser = {
                        id: playerData.id,
                        uid: playerData.id,
                        email: phone + '@somospadel.com',
                        ...playerData,
                        displayName: playerData.name,
                        localAuth: true // Flag to indicate local authentication
                    };

                    window.Store.setState('currentUser', mockUser);
                    console.log("✅ LOCAL AUTH SUCCESS:", mockUser.name);
                    return { success: true, user: mockUser };

                } catch (localError) {
                    console.error("Local auth also failed:", localError);
                    return { success: false, error: localError.message || "Credenciales incorrectas" };
                }
            }
        }

        async register(email, password, additionalData) {
            try {
                if (!auth) throw new Error("Firebase Auth not initialized");

                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;

                if (additionalData && additionalData.name) {
                    await user.updateProfile({ displayName: additionalData.name });
                }

                const phone = email.split('@')[0];
                const newPlayer = await window.FirebaseDB.players.create({
                    ...additionalData,
                    phone: phone,
                    uid: user.uid,
                    status: 'pending' // VALIDATION REQUIRED
                });

                // DO NOT AUTO LOGIN - RETURN SUCCESS BUT PENDING
                await auth.signOut();

                return { success: true, pendingValidation: true };
            } catch (error) {
                console.warn("⚠️ Firebase Register failed, using Local Simulation...", error.code);

                const phone = email.split('@')[0];
                const newPlayer = await window.FirebaseDB.players.create({
                    ...additionalData,
                    phone: phone,
                    status: 'pending' // VALIDATION REQUIRED
                });

                return { success: true, pendingValidation: true };
            }
        }

        async logout() {
            try {
                if (auth) await auth.signOut();
                window.Store.setState('currentUser', null);
                return { success: true };
            } catch (error) {
                return { success: false, error: error.message };
            }
        }
    }

    window.AuthService = new AuthService();
    console.log("🛡️ AuthService Global Loaded (Restored)");
})();
