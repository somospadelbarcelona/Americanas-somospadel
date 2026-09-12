/**
 * app.js (Global Version)
 * Entry Point de la aplicación compatible con file://
 */
(function () {
    // 🚀 Cargador dinámico de scripts externos para optimización de rendimiento (Lazy Loading)
    window.loadExternalScript = (url, globalName) => {
        return new Promise((resolve, reject) => {
            if (globalName && window[globalName]) {
                resolve(window[globalName]);
                return;
            }
            // Comprobar si ya existe la etiqueta script
            const existingScript = document.querySelector(`script[src="${url}"]`);
            if (existingScript) {
                // Si ya existe pero aún no se ha cargado en window, esperamos a su disponibilidad
                const checkInterval = setInterval(() => {
                    if (window[globalName]) {
                        clearInterval(checkInterval);
                        resolve(window[globalName]);
                    }
                }, 50);
                // Timeout de seguridad de 10s
                setTimeout(() => {
                    clearInterval(checkInterval);
                    if (window[globalName]) {
                        resolve(window[globalName]);
                    } else {
                        reject(new Error(`Timeout esperando a la carga del script existente: ${url}`));
                    }
                }, 10000);
                return;
            }

            const script = document.createElement('script');
            script.src = url;
            script.defer = true;
            script.onload = () => {
                console.log(`📦 [LazyLoader] Script cargado con éxito: ${url}`);
                resolve(window[globalName]);
            };
            script.onerror = (err) => {
                console.error(`❌ [LazyLoader] Error al cargar script: ${url}`, err);
                reject(new Error(`Error cargando el script: ${url}`));
            };
            document.head.appendChild(script);
        });
    };

    /**
     * Calcula la hora exacta de un partido basándose en:
     * - startTime: hora de inicio del evento (ej: "10:00")
     * - roundNum: número de ronda (1-6)
     * - matchDuration: duración de cada partido en minutos (default: 20)
     * 
     * Cada ronda empieza cuando termina la anterior (20 min por defecto)
     */
    window.calculateMatchTime = (startTime, roundNum, matchDuration = 20) => {
        if (!startTime) return "00:00";
        try {
            const [hours, minutes] = startTime.split(':').map(Number);
            const date = new Date();
            // Ronda 1 = hora inicio, Ronda 2 = +20min, Ronda 3 = +40min, etc.
            const totalMinutesOffset = (roundNum - 1) * matchDuration;
            date.setHours(hours, minutes + totalMinutesOffset, 0, 0);
            return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
        } catch (e) {
            console.error("Error calculating match time:", e);
            return startTime;
        }
    };

    class App {
        constructor() {
            console.log("🚀 Somos Padel PRO - Initializing (Global Mode)...");
            this.init();
        }

        init() {
            // 1. Verificar Auth
            if (window.Store) {
                window.Store.subscribe('currentUser', (user) => {
                    if (user) {
                        console.log("✅ User Logged In:", user.email);
                        this.handleAuthorized();
                    } else {
                        console.log("🔒 User Guest/Logged Out");
                        this.handleGuest();
                    }
                });
            } else {
                console.error("❌ Critical: Window.Store not found");
            }

            // 2. Setup Navigation
            this.setupNavigation();

            // 3. Resiliencia al recuperar foco (Desbloqueo de pantalla a pie de pista)
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') {
                    console.log("📱 [App] Pestaña recuperada (visibilitychange). Verificando sesión...");
                    const user = window.Store ? window.Store.getState('currentUser') : null;
                    if (user) {
                        this.handleAuthorized();
                        // Revalidar silenciosamente en background si existe el servicio
                        if (window.AuthService && typeof window.AuthService.revalidateSession === 'function') {
                            window.AuthService.revalidateSession();
                        }
                    } else {
                        this.handleGuest();
                    }
                }
            });
        }

        handleAuthorized() {
            const user = window.Store.getState('currentUser');

            // UPDATE GLOBAL HEADER
            this.updateGlobalHeader(user);

            if (user && user.uid && window.db) {
                // Evitar duplicar logs en la misma sesión/pestaña del navegador
                if (!sessionStorage.getItem('somospadel_session_logged')) {
                    sessionStorage.setItem('somospadel_session_logged', 'true');
                    
                    const telemetryData = {
                        userId: user.uid,
                        userName: user.name || user.displayName || "Jugador Pro",
                        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                        device: /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
                        language: navigator.language || 'es',
                        appVersion: 'v9.1-Premium'
                    };

                    // Guardar log en la colección raíz de Firestore para análisis global de DAU/MAU
                    window.db.collection('access_logs').add(telemetryData)
                        .then(() => console.log(`📡 [TELEMETRÍA] Acceso registrado con éxito para: ${telemetryData.userName}`))
                        .catch(e => console.warn("⏳ [App] Telemetría omitida por red lenta o bloqueador:", e));

                    // Actualizar el perfil del jugador con contadores en tiempo real
                    window.db.collection('players').doc(user.uid).update({
                        lastLogin: new Date().toISOString(),
                        lastActive: firebase.firestore.FieldValue.serverTimestamp(),
                        sessionCount: firebase.firestore.FieldValue.increment(1)
                    }).catch(e => console.warn("⏳ [App] Error actualizando actividad en base de datos:", e));
                } else {
                    // Si ya se registró en esta sesión, solo actualizamos el timestamp de último login activo
                    window.db.collection('players').doc(user.uid).update({
                        lastLogin: new Date().toISOString()
                    }).catch(e => console.warn("⏳ [App] Error actualizando timestamp activo:", e));
                }
            }

            const authModal = document.getElementById('auth-modal');
            if (authModal) {
                authModal.classList.add('hidden');
                authModal.style.setProperty('display', 'none', 'important');
            }

            const appShell = document.getElementById('app-shell');
            if (appShell) appShell.classList.remove('hidden');

            // NEW: Load Side Menu from DB
            this.loadSideMenu();

            // Force initial render of the current route (Dashboard)
            if (window.Router) {
                window.Router.navigate(window.Router.currentRoute || 'dashboard', false, true);
            }

            if (window.DashboardController) {
                window.DashboardController.init();
            }
        }

        async loadSideMenu() {
            const menuContainer = document.getElementById('dynamic-menu-items');
            const dockContainer = document.querySelector('.nav-dock-container');

            if (!menuContainer && !dockContainer) return;

            // --- DEFINICIÓN DE FUNCIONES GLOBALES DE NAVEGACIÓN ---
            // Es vital definirlas en window para que los onclick del HTML inyectado las encuentren.
            window.closeDrawer = () => {
                const drawer = document.getElementById('side-drawer-container');
                const menu = document.getElementById('side-drawer-menu');
                if (drawer) drawer.classList.remove('open');
                if (menu) menu.classList.remove('open');
            };

            window.smartNavigate = (route, tab) => {
                console.log(`🧭 SmartNavigate: ${route} -> tab: ${tab}`);

                // 1. Navegar a la ruta base
                if (window.Router) window.Router.navigate(route);

                // 2. Controlar pestañas específicas (ej: Resultados en Americanas)
                if (route === 'americanas' && tab) {
                    // Esperamos un momento a que el controlador y la vista carguen
                    setTimeout(() => {
                        if (window.EventsController && typeof window.EventsController.setTab === 'function') {
                            console.log(`🔄 SmartNavigate: Forzando pestaña ${tab}`);
                            window.EventsController.setTab(tab);
                        } else {
                            console.warn("⚠️ EventsController no listo para setTab");
                        }
                    }, 200);
                }

                window.closeDrawer();
            };

            try {
                const currentUser = window.Store.getState('currentUser');
                const isAdmin = currentUser && ['super_admin', 'superadmin', 'admin', 'admin_player', 'captain'].includes((currentUser.role || '').toLowerCase());

                // A. Render Side Menu (Hamburger) - STATIC
                if (menuContainer) {
                    // NEW MENU STRUCTURE (COLORFUL EDITION)
                    menuContainer.innerHTML = `
                        <!-- BRANDING HEADER -->
                        <div class="drawer-brand">
                            <img src="img/logo_somospadel.png" style="width: 70px; height: auto; margin-bottom: 12px; filter: drop-shadow(0 0 12px rgba(204,255,0,0.5));">
                            <div style="font-weight: 900; color: #0a192f; letter-spacing: 1.5px; font-size: 1.2rem; font-family: 'Outfit';">SOMOS<span style="color: #CCFF00;">PADEL</span></div>
                            <div style="font-size: 0.65rem; color: #666; font-weight: 800; letter-spacing: 3px; margin-top: 2px;">BARCELONA</div>
                        </div>

                        <!-- 1. EXPLORACIÓN -->
                        <div class="drawer-section-header">EXPLORAR</div>
                        
                        <div class="drawer-item" onclick="window.smartNavigate('dashboard', null)">
                            <i class="fas fa-th-large" style="color: #00E36D; text-shadow: 0 0 10px rgba(0,227,109,0.3);"></i>
                            <span style="font-weight: 800;">INICIO</span>
                        </div>

                        <div class="drawer-item" onclick="window.smartNavigate('entrenos', null)">
                            <i class="fas fa-calendar-check" style="color: #CCFF00; text-shadow: 0 0 10px rgba(204,255,0,0.3);"></i>
                            <span style="font-weight: 800;">ENTRENOS</span>
                        </div>

                        <!-- 2. COMPETICIÓN -->
                        <div class="drawer-section-header">COMPETICIÓN</div>

                        <div class="drawer-item" onclick="window.smartNavigate('ranking', null)">
                            <i class="fas fa-trophy" style="color: #FFD700; text-shadow: 0 0 10px rgba(255,215,0,0.3);"></i>
                            <span style="font-weight: 700;">RANKING</span>
                        </div>

                        <div class="drawer-item" onclick="window.smartNavigate('partidas_abiertas', null)">
                            <i class="fab fa-whatsapp" style="color: #25d366; text-shadow: 0 0 10px rgba(37,211,102,0.3);"></i>
                            <span style="font-weight: 700;">PARTIDAS ABIERTAS</span>
                        </div>

                        <div class="drawer-item" onclick="window.smartNavigate('records', null)">
                            <i class="fas fa-award" style="color: #FF2D55; text-shadow: 0 0 10px rgba(255,45,85,0.3);"></i>
                            <span style="font-weight: 700;">RÉCORDS</span>
                        </div>

                        <div class="drawer-item" onclick="window.smartNavigate('teams', null)">
                            <i class="fas fa-users" style="color: #72a800; text-shadow: 0 0 10px rgba(114,168,0,0.3);"></i>
                            <span style="font-weight: 700;">EQUIPOS</span>
                        </div>

                        <div class="drawer-item" onclick="window.smartNavigate('profile', null)">
                            <i class="fas fa-user-astronaut" style="color: #3b82f6; text-shadow: 0 0 10px rgba(59,130,246,0.3);"></i>
                            <span style="font-weight: 700;">MI PERFIL</span>
                        </div>

                        <!-- 3. SISTEMAS -->
                        ${isAdmin ? `
                        <div class="drawer-section-header">SISTEMA</div>
                        <div class="drawer-item" onclick="window.location.href='admin.html'" style="background: rgba(255,255,255,0.02); margin-top: 10px;">
                            <i class="fas fa-user-shield" style="color: #94a3b8;"></i>
                            <span style="font-size: 0.8rem; font-weight: 600; opacity: 0.7;">PANEL ADMIN</span>
                        </div>
                        ` : ''}
                    `;
                }

                // B. Render Bottom Dock (Index Navigation)
                if (dockContainer) {
                    dockContainer.innerHTML = `
                        <nav class="nav-dock">
                            <button class="p-nav-item" data-view="dashboard" onclick="window.Router.navigate('dashboard', false, true)">
                                <div class="nav-icon-box"><i class="fas fa-home"></i></div>
                                <span>INICIO</span>
                            </button>
                            <button class="p-nav-item" data-view="americanas" onclick="window.Router.navigate('americanas')">
                                <div class="nav-icon-box"><i class="fas fa-trophy"></i></div>
                                <span>AMERICANAS</span>
                            </button>
                            <button class="p-nav-item" data-view="ranking" onclick="window.Router.navigate('ranking')">
                                <div class="nav-icon-box"><i class="fas fa-chart-line"></i></div>
                                <span>RANKING</span>
                            </button>
                            <button class="p-nav-item" data-view="profile" onclick="window.Router.navigate('profile')">
                                <div class="nav-icon-box"><i class="fas fa-user"></i></div>
                                <span>MI PERFIL</span>
                            </button>
                        </nav>
                    `;
                    // Re-trigger visual active state update from Router
                    if (window.Router) window.Router.updateNavUI(window.Router.currentRoute);
                }

            } catch (err) {
                console.error("Error loading navigation:", err);
            }
        }

        handleGuest() {
            this.updateGlobalHeader(null);
            const authModal = document.getElementById('auth-modal');
            if (authModal) {
                authModal.classList.remove('hidden');
                authModal.style.setProperty('display', 'flex', 'important');
            }

            const appShell = document.getElementById('app-shell');
            if (appShell) appShell.classList.add('hidden');
        }

        updateGlobalHeader(user) {
            const headerName = document.getElementById('header-user-name');
            const headerAvatar = document.getElementById('header-user-avatar');
            const headerAvatarMenu = document.getElementById('header-user-avatar-menu');
            const headerLevel = document.getElementById('header-user-level');
            const headerStreak = document.getElementById('header-user-streak');
            const headerRank = document.getElementById('header-user-rank');
            const headerMatches = document.getElementById('header-user-matches');
            const headerWinRate = document.getElementById('header-user-winrate');

            const stats = window.Store ? window.Store.getState('playerStats') : null;

            if (headerName) {
                const rawName = user ? (user.name || user.displayName || "Jugador") : "Invitado";
                const roleIcon = user?.role === 'super_admin' ? ' 👑' : '';
                headerName.innerHTML = `${rawName.split(' ')[0].toUpperCase()}${roleIcon}`;
            }

            const level = user ? parseFloat(user.level || 3.5).toFixed(2) : "--";
            if (headerLevel) headerLevel.innerText = level;
            
            const headerLevelMenu = document.getElementById('header-user-level-menu');
            if (headerLevelMenu) headerLevelMenu.innerText = `LVL ${level}`;

            if (headerStreak) {
                const streak = user ? (user.streak || 0) : 0;
                headerStreak.innerText = `🔥 ${streak}`;
            }

            if (headerRank) {
                const rank = user ? (user.ranking_pos || '--') : '--';
                headerRank.innerText = `🏆 #${rank}`;
            }

            if (headerMatches) {
                const matches = user ? (user.matches_played || (stats?.stats?.matches) || 0) : 0;
                headerMatches.innerText = matches;
            }

            if (headerWinRate) {
                const wr = stats?.stats?.winRate || (user?.win_rate) || "--";
                headerWinRate.innerText = wr !== "--" ? `${wr}%` : "--";
            }

            const updateAvatar = (el) => {
                if (!el) return;
                if (user && (user.photo_url || user.photoURL)) {
                    el.innerHTML = `<img src="${user.photo_url || user.photoURL}" style="width:100%; height:100%; border-radius:inherit; object-fit:cover;">`;
                } else {
                    const rawName = user ? (user.name || user.displayName || "J") : "I";
                    const initials = rawName.substring(0, 2).toUpperCase();
                    el.innerHTML = initials;
                }
            };

            updateAvatar(headerAvatar);
            updateAvatar(headerAvatarMenu);
        }

        setupNavigation() {
            // Navigation handled by Router.js
            console.log("⚓ Global Navigation System is active");
        }
    }

    // Init App when DOM is ready
    // Sync with AppInit Controller
    document.addEventListener('AppReady', () => {
        console.log("🎾 [App] AppReady signal received. Launching Core App...");
        window.AppInstance = new App();
    });
})();
