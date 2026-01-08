/**
 * Router.js - Enterprise Grade Routing System
 * Manages view transitions, deep linking, and navigation states.
 */
(function () {
    class Router {
        constructor() {
            this.currentRoute = 'dashboard';
            this.routes = {
                'dashboard': () => this.renderDashboard(),
                'americanas': () => { window.EventsController?.init(); window.EventsController?.setTab('events'); },
                'events': () => { window.EventsController?.init(); window.EventsController?.setTab('events'); },
                'profile': () => window.PlayerView?.render(),
                'live': () => window.ControlTowerView?.handleLiveRoute(),
                'ranking': () => { window.EventsController?.init(); window.EventsController?.setTab('finished'); },
                'agenda': () => { window.EventsController?.init(); window.EventsController?.setTab('agenda'); },
                'results': () => { window.EventsController?.init(); window.EventsController?.setTab('results'); }
            };

            // Handle browser navigation
            window.onpopstate = (event) => {
                if (event.state && event.state.route) {
                    this.navigate(event.state.route, true);
                }
            };
        }

        navigate(route, isBack = false) {
            console.log(`[Router] Navigating to: ${route}`);
            this.currentRoute = route;

            // Update UI State
            this.updateNavUI(route);

            // Execute View Logic
            const viewAction = this.routes[route];
            if (viewAction) {
                viewAction();
            } else {
                this.renderPlaceholder(route);
            }

            // History Management
            if (!isBack) {
                window.history.pushState({ route }, '', `#${route}`);
            }

            // Global scroll to top on nav
            window.scrollTo(0, 0);
        }

        updateNavUI(route) {
            document.querySelectorAll('.p-nav-item').forEach(btn => {
                const isTarget = btn.dataset.view === route;
                btn.classList.toggle('active', isTarget);

                // Haptic feedback simulation
                if (isTarget && window.navigator.vibrate) {
                    window.navigator.vibrate(10);
                }
            });
        }

        renderDashboard() {
            if (window.DashboardView && window.Store) {
                const data = window.Store.getState('dashboardData');
                window.DashboardView.render(data || { activeCourts: 0 });
            }
        }

        renderPlaceholder(name) {
            const content = document.getElementById('content-area');
            if (!content) return;

            content.innerHTML = `
                <div class="fade-in" style='padding:60px 24px; text-align:center;'>
                    <div style="width: 80px; height: 80px; background: rgba(0,0,0,0.03); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
                        <i class="fas fa-tools" style="font-size:2rem; color:#ccc;"></i>
                    </div>
                    <h2 style="font-weight: 800; font-family: 'Outfit';">Sección en Optimización</h2>
                    <p style="color: #666; font-size: 0.95rem; line-height: 1.5; margin-top: 10px;">
                        Nuestra IA está preparando la vista de <strong>${name}</strong> para ofrecerte la mejor experiencia.
                    </p>
                    <button onclick="Router.navigate('dashboard')" class="btn-primary-pro" style="margin-top:30px; width: 100%; max-width: 250px;">
                        VOLVER AL INICIO
                    </button>
                </div>
            `;
        }

        // Global Error Handler Integration
        initGlobalExceptionHandler() {
            window.onerror = (message, source, lineno, colno, error) => {
                console.error("[Global Error]", { message, source, lineno });
                // Future: Send to Firebase for Big Data analysis
                return false;
            };
        }
    }

    window.Router = new Router();
    window.Router.initGlobalExceptionHandler();
    console.log("🛣️ Enterprise Router System Initialized");
})();
