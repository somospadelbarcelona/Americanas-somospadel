/**
 * app.js (Global Version)
 * Entry Point de la aplicación compatible con file://
 */
(function () {
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
        }

        handleAuthorized() {
            const user = window.Store.getState('currentUser');

            // UPDATE GLOBAL HEADER
            this.updateGlobalHeader(user);

            if (user && user.uid && window.db) {
                window.db.collection('players').doc(user.uid).update({
                    lastLogin: new Date().toISOString()
                }).catch(e => console.warn("⏳ [App] Error actualizando lastLogin:", e));
            }

            const authModal = document.getElementById('auth-modal');
            if (authModal) authModal.classList.add('hidden');

            const appShell = document.getElementById('app-shell');
            if (appShell) appShell.classList.remove('hidden');

            // NEW: Load Side Menu from DB
            this.loadSideMenu();

            // Force initial render of the current route (Dashboard)
            if (window.Router) {
                window.Router.navigate(window.Router.currentRoute || 'dashboard');
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
                            <div style="font-weight: 900; color: white; letter-spacing: 1.5px; font-size: 1.2rem; font-family: 'Outfit';">SOMOS<span style="color: #CCFF00;">PADEL</span></div>
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

                        <div class="drawer-item" onclick="window.smartNavigate('records', null)">
                            <i class="fas fa-award" style="color: #FF2D55; text-shadow: 0 0 10px rgba(255,45,85,0.3);"></i>
                            <span style="font-weight: 700;">RÉCORDS</span>
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
                            <button class="p-nav-item" data-view="dashboard" onclick="window.Router.navigate('dashboard')">
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
            if (authModal) authModal.classList.remove('hidden');

            const appShell = document.getElementById('app-shell');
            if (appShell) appShell.classList.add('hidden');
        }

        updateGlobalHeader(user) {
            const headerName = document.getElementById('header-user-name');
            const headerAvatar = document.getElementById('header-user-avatar');
            const headerLevel = document.getElementById('header-user-level');
            const headerStreak = document.getElementById('header-user-streak');
            const headerRank = document.getElementById('header-user-rank');

            if (headerName) {
                // Prioritize user.name from DB, then displayName from Auth, then placeholder
                const rawName = user ? (user.name || user.displayName || "Jugador") : "Invitado";
                const roleIcon = user?.role === 'super_admin' ? ' 👑' : '';
                headerName.innerHTML = `${rawName.split(' ')[0].toUpperCase()}${roleIcon}`;
            }

            if (headerLevel) {
                const level = user ? (user.level || 3.5).toFixed(2) : "--";
                headerLevel.innerText = level;
            }

            if (headerStreak) {
                const streak = user ? (user.streak || 0) : 0;
                headerStreak.innerText = `🔥 ${streak}`;
            }

            if (headerRank) {
                const rank = user ? (user.ranking_pos || '--') : '--';
                headerRank.innerText = `🏆 #${rank}`;
            }

            if (headerAvatar) {
                if (user && user.photoURL) {
                    headerAvatar.innerHTML = `<img src="${user.photoURL}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
                } else {
                    const rawName = user ? (user.name || user.displayName || "J") : "I";
                    const initials = rawName.substring(0, 2).toUpperCase();
                    headerAvatar.innerHTML = initials;
                }
            }
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
