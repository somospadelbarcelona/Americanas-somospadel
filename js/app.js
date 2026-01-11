/**
 * app.js (Global Version)
 * Entry Point de la aplicación compatible con file://
 */
(function () {
    window.calculateMatchTime = (startTime, roundNum) => {
        if (!startTime) return "00:00";
        try {
            const [hours, minutes] = startTime.split(':').map(Number);
            const date = new Date();
            date.setHours(hours, minutes + (roundNum - 1) * 20, 0, 0);
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

            try {
                if (!window.FirebaseDB) return;
                const menuItems = await window.FirebaseDB.menu.getAll();
                const activeItems = menuItems.filter(item => item.active).sort((a, b) => a.order - b.order);

                // A. Render Side Menu (Hamburger)
                if (menuContainer) {
                    // Static menu items (always visible)
                    const staticMenuHTML = `
                        <div class="drawer-item" onclick="window.location.href='admin.html'">
                            <i class="fas fa-user-shield"></i>
                            <span>ADMIN</span>
                        </div>
                        <div class="drawer-item" onclick="window.Router.navigate('americanas'); document.getElementById('side-drawer-container').classList.remove('open'); document.getElementById('side-drawer-menu').classList.remove('open');">
                            <i class="fas fa-calendar-check"></i>
                            <span>AMERICANAS DISPONIBLES</span>
                        </div>
                        <div class="drawer-item" onclick="window.Router.navigate('stats'); document.getElementById('side-drawer-container').classList.remove('open'); document.getElementById('side-drawer-menu').classList.remove('open');">
                            <i class="fas fa-chart-bar"></i>
                            <span>MIS RESULTADOS</span>
                        </div>
                        <div class="drawer-item" onclick="alert('📱 SOMOS PADEL BCN\\n\\nVersión: 2.0 PRO\\n\\nPlataforma de gestión de Americanas y Entrenos de Pádel.\\n\\n© 2026 Somos Padel Barcelona'); document.getElementById('side-drawer-container').classList.remove('open'); document.getElementById('side-drawer-menu').classList.remove('open');">
                            <i class="fas fa-info-circle"></i>
                            <span>INFO SOBRE LA APP</span>
                        </div>
                    `;

                    // Dynamic menu items from Firebase
                    let dynamicMenuHTML = '';
                    if (activeItems.length === 0) {
                        dynamicMenuHTML = '';
                    } else {
                        dynamicMenuHTML = activeItems.map(item => `
                            <div class="drawer-item" onclick="window.Router.navigate('${item.action}'); document.getElementById('side-drawer-container').classList.remove('open'); document.getElementById('side-drawer-menu').classList.remove('open');">
                                <i class="${item.icon}"></i>
                                <span>${item.title.toUpperCase()}</span>
                            </div>
                        `).join('');
                    }

                    // Combine static + dynamic
                    menuContainer.innerHTML = staticMenuHTML + dynamicMenuHTML;
                }

                // B. Render Bottom Dock (Index Navigation)
                if (dockContainer) {
                    if (activeItems.length > 0) {
                        // Apply 'nav-dock' class if missing
                        dockContainer.innerHTML = `
                            <nav class="nav-dock">
                                ${activeItems.map(item => `
                                    <button class="p-nav-item" data-view="${item.action}" onclick="window.Router.navigate('${item.action}')">
                                        <div class="nav-icon-box"><i class="${item.icon}"></i></div>
                                        <span>${item.title}</span>
                                    </button>
                                `).join('')}
                            </nav>
                        `;
                        // Re-trigger visual active state update from Router
                        if (window.Router) window.Router.updateNavUI(window.Router.currentRoute);
                    }
                }

            } catch (err) {
                console.error("Error loading navigation:", err);
            }
        }

        handleGuest() {
            const authModal = document.getElementById('auth-modal');
            if (authModal) authModal.classList.remove('hidden');

            const appShell = document.getElementById('app-shell');
            if (appShell) appShell.classList.add('hidden');
        }

        setupNavigation() {
            // Navigation handled by Router.js
            console.log("⚓ Global Navigation System is active");
        }
    }

    // Init App when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => window.AppInstance = new App());
    } else {
        window.AppInstance = new App();
    }
})();
