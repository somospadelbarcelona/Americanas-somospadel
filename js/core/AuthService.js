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
                if (uid && window.FirebaseDB?.players?.getById) {
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

                // 3. Fallback: buscar por identificador (teléfono, variantes de prefijo, email o nombre)
                if (!playerData && emailOrPhone) {
                    let searchKey = emailOrPhone;
                    if (emailOrPhone.includes('@') && emailOrPhone.endsWith('@somospadel.com')) {
                        searchKey = emailOrPhone.split('@')[0];
                    }
                    if (window.FirebaseDB?.players) {
                        if (typeof window.FirebaseDB.players.getByIdentifier === 'function') {
                            playerData = await window.FirebaseDB.players.getByIdentifier(searchKey);
                        } else if (typeof window.FirebaseDB.players.getByPhone === 'function') {
                            playerData = await window.FirebaseDB.players.getByPhone(searchKey);
                        }
                    }
                }
            } catch (e) {
                console.warn("⚠️ [AuthService] Advertencia al recuperar perfil:", e?.message);
            }
            return playerData;
        }

        async revalidateSession() {
            if (!window.Store) return;
            const current = window.Store.getState('currentUser');
            if (!current) return;

            console.log("🔄 [AuthService] Verificando sesión activa en segundo plano...");
            try {
                const uid = current.uid || current.id;
                const emailOrPhone = current.phone || current.email || current.displayName || current.name;
                const playerData = await this._fetchPlayerProfile(uid, emailOrPhone);

                // SEGURIDAD CRÍTICA: Si no se recupera el perfil por fallo de red temporal o timeout,
                // NUNCA cerrar la sesión local para evitar expulsar a jugadores durante las partidas.
                if (!playerData) {
                    console.log("ℹ️ [AuthService] Perfil remoto no accesible temporalmente (red lenta/offline). Manteniendo sesión local activa.");
                    return;
                }

                if (playerData.status === 'blocked' || playerData.status === 'pending') {
                    console.warn(`⚠️ Usuario con estado '${playerData.status}'. Cerrando sesión...`);
                    this.logout();
                    if (window.PremiumModal) {
                        window.PremiumModal.alert({
                            title: "🔒 SESIÓN EXPIRADA",
                            message: playerData.status === 'blocked' 
                                ? "Tu cuenta ha sido bloqueada por la administración." 
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
                console.log("✅ [AuthService] Sesión revalidada y sincronizada.");

            } catch (e) {
                console.warn("ℹ️ [AuthService] Error al revalidar sesión (red inestable). Manteniendo sesión:", e?.message);
            }
        }

        async hashPassword(password) {
            const msgUint8 = new TextEncoder().encode(password);
            const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        }

        async handleAuthStateChange(user) {
            const cachedUser = (window.Store && window.Store.getState('currentUser')) || {};
            let playerData = null;
            try {
                // UNIFICATION MAGIC: Find the REAL player profile using UID or phone
                playerData = await this._fetchPlayerProfile(user.uid, user.email);
            } catch (e) {
                console.error("Error fetching player data on auth state change", e);
            }

            // Create base user object, preserving cached fields
            const finalUser = {
                ...cachedUser,
                id: user.uid, // Default to Auth UID
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || cachedUser.displayName,
                ...(playerData || {})
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

            // Evitar disparar setState si la información de sesión no ha cambiado
            if (cachedUser && cachedUser.id === finalUser.id && cachedUser.role === finalUser.role && cachedUser.name === finalUser.name && cachedUser.level === finalUser.level) {
                console.log("⚡ [AuthService] Datos de sesión idénticos al cache local. Omitiendo re-render.");
                return;
            }

            window.Store.setState('currentUser', finalUser);
        }

        async login(emailOrPhone, password) {
            if (!emailOrPhone || !password) {
                return { success: false, error: "Introduce usuario y contraseña" };
            }

            const rawInput = (emailOrPhone || '').toString().trim();
            const cleanPass = (password || '').toString().trim();
            if (!rawInput || !cleanPass) {
                return { success: false, error: "Introduce usuario y contraseña válidos" };
            }

            // Normalización inteligente del identificador (teléfono, email o alias)
            const digitsOnly = rawInput.replace(/\D/g, '');
            let canonicalPhone = digitsOnly;
            if (digitsOnly.length === 11 && digitsOnly.startsWith('34')) {
                canonicalPhone = digitsOnly.substring(2);
            } else if (digitsOnly.length > 11 && digitsOnly.startsWith('0034')) {
                canonicalPhone = digitsOnly.substring(4);
            }

            // Determinar email canónico para Firebase Auth
            let authEmail = rawInput.toLowerCase();
            if (!authEmail.includes('@')) {
                authEmail = (canonicalPhone || digitsOnly || rawInput.toLowerCase().replace(/\s+/g, '')) + '@somospadel.com';
            }

            try {
                if (!auth) throw new Error("Firebase Auth not initialized");

                // Timeout de seguridad resiliente en Firebase Auth (5.5s para conexiones móviles en pistas)
                const authTimeout = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("auth/timeout")), 5500)
                );
                const userCredential = await Promise.race([
                    auth.signInWithEmailAndPassword(authEmail, cleanPass),
                    authTimeout
                ]);
                const user = userCredential.user;

                const playerData = await this._fetchPlayerProfile(user.uid, user.email || authEmail);

                if (playerData && playerData.status === 'pending') {
                    await auth.signOut().catch(() => {});
                    throw new Error("⏳ TU CUENTA ESTÁ PENDIENTE DE VALIDACIÓN POR UN ADMINISTRADOR.");
                }
                if (playerData && playerData.status === 'blocked') {
                    await auth.signOut().catch(() => {});
                    throw new Error("🚫 TU CUENTA HA SIDO BLOQUEADA. Contacta con el administrador.");
                }

                const finalUser = {
                    id: user.uid,
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    ...playerData
                };

                if (window.Store && window.Store.setState) {
                    window.Store.setState('currentUser', finalUser);
                }
                if (typeof document !== 'undefined' && document.documentElement) {
                    document.documentElement.classList.add('has-session');
                }
                return { success: true, user: finalUser };

            } catch (error) {
                console.warn("⚠️ Firebase Login no directo, ejecutando Local Fallback Resiliente...", error.code || error.message);

                // Re-lanzar error de validación pendiente o bloqueo inmediatamente
                if (error.message && (error.message.includes("PENDIENTE") || error.message.includes("BLOQUEADA"))) {
                    return { success: false, error: error.message };
                }

                // === LOCAL AUTHENTICATION FALLBACK ULTRA-RESILIENTE ===
                try {
                    // Buscar perfil de jugador en Firestore mediante getByIdentifier o getByPhone
                    let playerData = null;
                    if (window.FirebaseDB?.players) {
                        if (typeof window.FirebaseDB.players.getByIdentifier === 'function') {
                            playerData = await window.FirebaseDB.players.getByIdentifier(rawInput);
                        }
                        if (!playerData && canonicalPhone) {
                            playerData = await window.FirebaseDB.players.getByPhone(canonicalPhone);
                        }
                        if (!playerData && digitsOnly && digitsOnly !== canonicalPhone) {
                            playerData = await window.FirebaseDB.players.getByPhone(digitsOnly);
                        }
                    }

                    if (!playerData) {
                        throw new Error("Usuario no encontrado. Revisa tu número de teléfono o solicita registro.");
                    }

                    // Check if account is pending o blocked
                    if (playerData.status === 'pending') {
                        throw new Error("⏳ TU CUENTA ESTÁ PENDIENTE DE VALIDACIÓN POR UN ADMINISTRADOR.");
                    }
                    if (playerData.status === 'blocked') {
                        throw new Error("🚫 TU CUENTA HA SIDO BLOQUEADA. Contacta con el administrador.");
                    }

                    // SEGURIDAD: Comprobación flexible de contraseña
                    const upperPass = cleanPass.toUpperCase();
                    const lowerPass = cleanPass.toLowerCase();

                    const inputHash = await this.hashPassword(cleanPass);
                    const inputHashUpper = await this.hashPassword(upperPass);
                    const inputHashLower = await this.hashPassword(lowerPass);

                    let isValid = false;
                    let needsMigration = false;
                    let isFirstTimePasswordSetup = false;

                    if (playerData.password) {
                        const dbPass = String(playerData.password).trim();
                        if (
                            dbPass === inputHash ||
                            dbPass === inputHashUpper ||
                            dbPass === inputHashLower
                        ) {
                            isValid = true;
                        } else if (
                            dbPass === cleanPass ||
                            dbPass === upperPass ||
                            dbPass === lowerPass ||
                            dbPass.toLowerCase() === lowerPass
                        ) {
                            // Match en texto plano (legado)
                            isValid = true;
                            needsMigration = true;
                        }
                    } else {
                        // Jugador sin contraseña registrada en BBDD (importado de Excel o creado sin clave por admin)
                        // Permitir acceso con su propio teléfono, últimos 4 dígitos, clave de bienvenida, o cualquier clave de >= 4 caracteres
                        const pDigits = String(playerData.phone || '').replace(/\D/g, '');
                        const last4 = pDigits.length >= 4 ? pDigits.slice(-4) : '';
                        const commonDefaultKeys = [pDigits, last4, '123456', '1234', 'somospadel', 'padel', 'somos'];

                        if (commonDefaultKeys.includes(cleanPass.toLowerCase()) || cleanPass.length >= 4) {
                            isValid = true;
                            isFirstTimePasswordSetup = true;
                        }
                    }

                    if (!isValid) {
                        throw new Error("Contraseña incorrecta. Si es tu primera vez, puedes usar tu teléfono como clave.");
                    }

                    // Auto-migración y blindaje de contraseña cifrada en background
                    if ((needsMigration || isFirstTimePasswordSetup) && playerData.id && window.FirebaseDB?.players?.update) {
                        console.log("🔐 Blindando y guardando contraseña cifrada para:", playerData.id);
                        window.FirebaseDB.players.update(playerData.id, {
                            password: inputHashUpper
                        }).catch(e => console.warn("Password setup diferido:", e?.message));
                    }

                    // Construir objeto de sesión unificado
                    const sessionPhone = canonicalPhone || digitsOnly || playerData.phone || rawInput;
                    const mockUser = {
                        id: playerData.id,
                        uid: playerData.id,
                        email: playerData.email || (sessionPhone + '@somospadel.com'),
                        ...playerData,
                        displayName: playerData.name || 'Jugador SomosPádel',
                        localAuth: true
                    };

                    // Elevación a Firebase Auth si está disponible
                    if (window.firebase && typeof window.firebase.functions === 'function' && auth) {
                        try {
                            const createTokenFn = window.firebase.functions().httpsCallable('createAuthTokenForPlayer');
                            const tokenRes = await createTokenFn({ playerId: playerData.id });
                            if (tokenRes?.data?.customToken) {
                                const userCred = await auth.signInWithCustomToken(tokenRes.data.customToken);
                                console.log("🔐 [AuthService] Sesión elevada con éxito a Firebase Auth oficial:", userCred.user.uid);
                                mockUser.localAuth = false;
                                mockUser.uid = userCred.user.uid;
                            }
                        } catch (tokenErr) {
                            console.warn("ℹ️ [AuthService] Operando en modo de sesión local de alta disponibilidad:", tokenErr?.message);
                        }
                    }

                    if (window.Store && window.Store.setState) {
                        window.Store.setState('currentUser', mockUser);
                    }
                    if (typeof document !== 'undefined' && document.documentElement) {
                        document.documentElement.classList.add('has-session');
                    }
                    console.log("✅ ACCESO LOCAL CONCEDIDO:", mockUser.name || mockUser.id);
                    return { success: true, user: mockUser };

                } catch (localError) {
                    console.error("Local auth fallo:", localError);
                    if (localError.message && localError.message.includes('INTERNAL ASSERTION FAILED')) {
                        console.warn("🚨 [AuthService] Firestore assertion detectado. Purgando caché de IndexedDB...");
                        try {
                            if (window.indexedDB?.deleteDatabase) {
                                window.indexedDB.deleteDatabase('firestore/[DEFAULT]/americanas-somospadel/main');
                            }
                        } catch (_) {}
                        return { 
                            success: false, 
                            error: "Conexión reiniciada con éxito. Por favor, pulsa 'ENTRAR' de nuevo." 
                        };
                    }
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

})();
