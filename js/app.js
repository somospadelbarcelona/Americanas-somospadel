/**
 * app.js (Global Version)
 * Entry Point de la aplicación compatible con file://
 */
(function () {
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
            if (!menuContainer) return;

            try {
                if (!window.FirebaseDB) return;
                const menuItems = await window.FirebaseDB.menu.getAll();

                if (menuItems.length === 0) {
                    menuContainer.innerHTML = '<div style="padding:20px; color:#888;">No hay botones configurados</div>';
                    return;
                }

                menuContainer.innerHTML = menuItems.filter(item => item.active).map(item => `
                    <div class="drawer-item" onclick="window.Router.navigate('${item.action}'); document.getElementById('side-drawer-container').classList.remove('open'); document.getElementById('side-drawer-menu').classList.remove('open');">
                        <i class="${item.icon}"></i>
                        <span>${item.title.toUpperCase()}</span>
                    </div>
                `).join('');

            } catch (err) {
                console.error("Error loading side menu:", err);
                menuContainer.innerHTML = '<div style="padding:20px; color:#ff4d4d;">Error al cargar menú</div>';
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
