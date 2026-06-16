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
            // Revalidar la sesión de fondo al iniciar
            setTimeout(() => {
                this.revalidateSession();
            }, 1000);

            if (auth) {
                auth.onAuthStateChanged(user => {
                    console.log("Firebase Auth State Changed:", user ? user.uid : "No user");

                    // Safety: Check if Store is alive before calling setState
                    if (window.Store && window.Store.setState) {
                        if (user) {
                            this.handleAuthStateChange(user);
                        } else {
                            // No cerrar sesión si hay un usuario logueado por vía local fallback
                            const current = window.Store.getState('currentUser');
                            if (current && current.localAuth) {
                                console.log("🔒 Keeping local auth session active, ignoring Firebase Auth null state.");
                            } else {
                                window.Store.setState('currentUser', null);
                            }
                        }
                    } else {
                        console.warn("⚠️ window.Store not ready during Auth session change.");
                        // Retry once after a small delay
                        setTimeout(() => {
                            if (window.Store && window.Store.setState) {
                                if (user) {
                                    this.handleAuthStateChange(user);
                                } else {
                                    const current = window.Store.getState('currentUser');
                                    if (current && current.localAuth) {
                                        console.log("🔒 Keeping local auth session active, ignoring Firebase Auth null state (retry).");
                                    } else {
                                        window.Store.setState('currentUser', null);
                                    }
                                }
                            }
                        }, 500);
                    }
                });
            }
        }

        async _fetchPlayerProfile(uid, emailOrPhone) {
            let playerData = null;
            try {
                // 1. Intentar buscar el documento por ID (si coincide con el UID de Auth)
                if (uid) {
                    playerData = await window.FirebaseDB.players.getById(uid);
                }
                
                // 2. Si no se encuentra, buscar por el campo 'uid' en la colección
                if (!playerData && uid && db) {
                    const snapshot = await db.collection('players').where('uid', '==', uid).limit(1).get();
                    if (!snapshot.empty) {
                        const doc = snapshot.docs[0];
                        playerData = { id: doc.id, ...doc.data() };
                    }
                }

                // 3. Fallback: buscar por el teléfono/email
                if (!playerData && emailOrPhone) {
                    let phone = emailOrPhone;
                    if (emailOrPhone.includes('@')) {
                        phone = emailOrPhone.split('@')[0];
                    }
                    playerData = await window.FirebaseDB.players.getByPhone(phone);
                }
            } catch (e) {
                console.error("Error fetching player profile helper:", e);
            }
            return playerData;
        }

        async revalidateSession() {
            if (!window.Store) return;
            const current = window.Store.getState('currentUser');
            if (!current) return;

            console.log("🔄 [AuthService] Revalidando sesión activa en segundo plano...");
            try {
                const uid = current.uid || current.id;
                const emailOrPhone = current.phone || current.email;
                const playerData = await this._fetchPlayerProfile(uid, emailOrPhone);

                if (!playerData) {
                    console.warn("⚠️ Usuario no encontrado en base de datos. Cerrando sesión...");
                    this.logout();
                    return;
                }

                if (playerData.status === 'blocked' || playerData.status === 'pending') {
                    console.warn(`⚠️ Usuario con estado '${playerData.status}'. Cerrando sesión...`);
                    this.logout();
                    if (window.PremiumModal) {
                        window.PremiumModal.alert({
                            title: "🔒 SESIÓN EXPIRADA",
                            message: playerData.status === 'blocked' 
                                ? "Tu cuenta ha sido bloqueada." 
                                : "Tu cuenta está pendiente de validación por un administrador.",
                            type: 'warning'
                        });
                    }
                    return;
                }

                // Si todo está bien, actualizamos el Store con los datos más recientes de la BD
                const updatedUser = {
                    ...current,
                    ...playerData
                };
                window.Store.setState('currentUser', updatedUser);
                console.log("✅ [AuthService] Sesión revalidada y actualizada con éxito.");

            } catch (e) {
                console.error("❌ Error al revalidar sesión (posiblemente offline):", e);
            }
        }

        async hashPassword(password) {
            const msgUint8 = new TextEncoder().encode(password);
            const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        }

        async handleAuthStateChange(user) {
            let playerData = null;
            try {
                // UNIFICATION MAGIC: Find the REAL player profile using UID or phone
                playerData = await this._fetchPlayerProfile(user.uid, user.email);
            } catch (e) {
                console.error("Error fetching player data on auth state change", e);
            }

            // Create base user object
            const finalUser = {
                id: user.uid, // Default to Auth UID
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                ...playerData // Overwrite with DB data (name, role, level, etc.)
            };

            // ID MERGING STRATEGY
            // If the DB document ID is different from Auth UID, we need to track BOTH.
            finalUser.mergedIds = [user.uid];
            if (playerData && playerData.id && playerData.id !== user.uid) {
                console.log(`🔗 Identity Merge: Auth(${user.uid}) + Player(${playerData.id})`);
                finalUser.mergedIds.push(playerData.id);
                // Vital: Make the primary ID the Player ID for data consistency if it exists
                finalUser.id = playerData.id;
            }

            window.Store.setState('currentUser', finalUser);
        }

        async login(email, password) {
            try {
                if (!auth) throw new Error("Firebase Auth not initialized");

                const userCredential = await auth.signInWithEmailAndPassword(email, password);
                const user = userCredential.user;

                const playerData = await this._fetchPlayerProfile(user.uid, user.email || email);

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
                // Safety: Update store
                if (window.Store && window.Store.setState) {
                    window.Store.setState('currentUser', finalUser);
                }
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

                    // Safety: Update store
                    if (window.Store && window.Store.setState) {
                        window.Store.setState('currentUser', mockUser);
                    }
                    console.log("✅ LOCAL AUTH SUCCESS:", mockUser.name);
                    return { success: true, user: mockUser };

                } catch (localError) {
                    console.error("Local auth also failed:", localError);
                    return { success: false, error: localError.message || "Credenciales incorrectas" };
                }
            }
        }

        async register(email, password, additionalData) {
            const phone = email.split('@')[0];
            try {
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
                console.warn("⚠️ Firebase Auth Register failed:", error.code, error.message);

                // === LOCAL REGISTRATION FALLBACK ===
                // Si Firebase Auth no está configurado (CONFIGURATION_NOT_FOUND) o falla,
                // creamos el usuario directamente en Firestore como fallback.
                const fatalErrors = ['auth/configuration-not-found', 'auth/operation-not-allowed', 'CONFIGURATION_NOT_FOUND'];
                const errStr = typeof error === 'string' ? error : JSON.stringify(error);
                const isConfigError = fatalErrors.some(e => errStr.includes(e) || (error.code && error.code === e));

                if (isConfigError || error.code === 400) {
                    console.log("🛠️ Intentando REGISTRO LOCAL (Solo Firestore)...");
                    try {
                        const localUid = 'local_' + phone + '_' + Date.now();
                        const hashedPassword = await this.hashPassword(password);

                        const userData = {
                            ...additionalData,
                            phone: phone,
                            uid: localUid,
                            id: localUid,
                            password: hashedPassword,
                            status: 'pending', // ⏳ PENDIENTE DE VALIDACIÓN MANUAL
                            authMethod: 'local_fallback',
                            createdAt: new Date().toISOString()
                        };

                        await window.FirebaseDB.players.create(userData);

                        console.log("✅ Usuario registrado (Pendiente de validación)");
                        return { success: true, pendingValidation: true };

                    } catch (dbError) {
                        console.error("Registro Local Falló:", dbError);
                        return { success: false, error: "Error de registro (Local): " + dbError.message };
                    }
                }

                // Propagar errores claros a la UI
                if (error.code === 'auth/email-already-in-use') {
                    return { success: false, error: "Este teléfono ya está registrado." };
                }

                return { success: false, error: error.message || "Error desconocido en el registro" };
            }
        }


        async logout() {
            try {
                if (auth) await auth.signOut();
                // Safety: Update store
                if (window.Store && window.Store.setState) {
                    window.Store.setState('currentUser', null);
                }
                return { success: true };
            } catch (error) {
                return { success: false, error: error.message };
            }
        }
    }

    window.AuthService = new AuthService();
    console.log("🛡️ AuthService Global Loaded (v10.1 - Fixed Phone Scope)");

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
                    window.PremiumModal.alert({
                        title: "❌ ERROR DE ACCESO",
                        message: result.error,
                        type: 'error'
                    });
                }
            });
        }
    });
})();
