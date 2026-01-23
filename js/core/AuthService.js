/**
 * AuthService.js (Global Version)
 * Perfectly restored with standard ID handling
 */
(function () {
    const auth = window.firebase ? firebase.auth() : null;
    const db = window.firebase ? firebase.firestore() : null;

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

        async hashPassword(password) {
            const msgUint8 = new TextEncoder().encode(password);
            const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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
                if (error.message && error.message.includes("PENDIENTE")) {
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

                    // SECURITY: Check password (Hashed or Legacy)
                    const inputHash = await this.hashPassword(password);
                    let isValid = false;
                    let needsMigration = false;

                    if (playerData.password === inputHash) {
                        isValid = true;
                    } else if (playerData.password === password) {
                        // LEGACY PLAIN TEXT MATCH
                        isValid = true;
                        needsMigration = true;
                    }

                    if (!isValid) {
                        throw new Error("Contraseña incorrecta");
                    }

                    // AUTO-MIGRATE TO HASHED PASSWORD
                    if (needsMigration) {
                        console.log("🔐 Migrating legacy password for:", phone);
                        await window.FirebaseDB.players.update(playerData.id, {
                            password: inputHash
                        });
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
                const phone = email.split('@')[0];

                // 1. Mandatory check for existing user in Firestore
                const snapshot = await db.collection('players').where('phone', '==', phone).get();
                if (!snapshot.empty) {
                    throw new Error("Ya existe una cuenta con este teléfono. Por favor, inicia sesión o contacta con soporte.");
                }

                const hashedPassword = await this.hashPassword(password);

                if (!auth) throw new Error("Firebase Auth no inicializado");

                // 2. Create in Firebase Auth
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;

                if (additionalData && additionalData.name) {
                    await user.updateProfile({ displayName: additionalData.name });
                }

                // 3. Create in Firestore
                await window.FirebaseDB.players.create({
                    ...additionalData,
                    phone: phone,
                    uid: user.uid,
                    password: hashedPassword, // Store hashed
                    status: 'pending' // VALIDATION REQUIRED
                });

                // DO NOT AUTO LOGIN - RETURN SUCCESS BUT PENDING
                await auth.signOut();

                return { success: true, pendingValidation: true };
            } catch (error) {
                console.warn("⚠️ Register failed:", error.message);

                // Propagate clear errors to UI
                if (error.code === 'auth/email-already-in-use') {
                    return { success: false, error: "Este teléfono ya está registrado en el sistema de autenticación." };
                }

                return { success: false, error: error.message || "Error desconocido en el registro" };
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

    // Setup login form listener
    document.addEventListener('DOMContentLoaded', () => {
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const phone = formData.get('phone');
                const password = formData.get('password');

                console.log('🔐 Attempting login for:', phone);

                const result = await window.AuthService.login(phone, password);
                if (result.success) {
                    console.log('✅ Login successful');
                    const modal = document.getElementById('auth-modal');
                    if (modal) modal.classList.add('hidden');
                } else {
                    console.error('❌ Login failed:', result.error);
                    alert('Error al iniciar sesión: ' + result.error);
                }
            });
        }
    });
})();
