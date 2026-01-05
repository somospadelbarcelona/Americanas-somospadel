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

            // Force initial render of the current route (Dashboard)
            if (window.Router) {
                // If we are already on dashboard, force render. 
                // If not, generic navigate using currentRoute (mock persistence)
                window.Router.navigate(window.Router.currentRoute || 'dashboard');
            }

            // Force Dashboard render if available (Mock logic for now as we transition)
            if (window.DashboardController) {
                window.DashboardController.init();
            }
        }

        handleGuest() {
            const authModal = document.getElementById('auth-modal');
            if (authModal) authModal.classList.remove('hidden');

            const appShell = document.getElementById('app-shell');
            if (appShell) appShell.classList.add('hidden');
        }

        setupNavigation() {
            document.addEventListener('click', (e) => {
                const link = e.target.closest('[data-link]');
                if (link) {
                    e.preventDefault();
                    const route = link.dataset.link;
                    console.log("Navigating to:", route);
                    // Simple Router Logic
                    if (route === 'profile' && window.PlayerView) {
                        window.PlayerView.render();
                    }
                }
            });
        }
    }

    // Init App when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => window.AppInstance = new App());
    } else {
        window.AppInstance = new App();
    }
})();
