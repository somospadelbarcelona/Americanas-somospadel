/**
 * Router.js - Enterprise Grade Routing System v2.0
 * Manages view transitions, deep linking, and navigation states.
 */
(function () {
    class Router {
        constructor() {
            this.routes = {
                'dashboard': () => this.renderDashboard(),
                'americanas': () => this.handleControllerTab('EventsController', 'events'),
                'events': () => this.handleControllerTab('EventsController', 'events'),
                'profile': () => window.PlayerController?.init(),
                'live': () => window.ControlTowerView?.handleLiveRoute(),
                'live-entreno': () => window.EntrenoLiveView?.handleRoute(),
                'ranking': () => window.RankingController?.init(),
                'equipos': () => window.TeamController?.init(),
                'teams': () => window.TeamController?.init(),
                'tournaments': () => window.TournamentController?.init(),
                'agenda': () => this.handleControllerTab('EventsController', 'agenda'),
                'results': () => this.handleControllerTab('EventsController', 'results'),
                'entrenos': () => this.handleControllerTab('EventsController', 'entrenos'),
                'partidas_abiertas': () => this.handleControllerTab('EventsController', 'open_matches'),
                'records': () => {
                    console.log("🛣️ [Router] Executing records route...");
                    if (window.RecordsController) {
                        window.RecordsController.init();
                    } else {
                        console.error("❌ [Router] RecordsController not found in window!");
                        // Emergency render if controller missing
                        const content = document.getElementById('content-area');
                        if (content) content.innerHTML = '<div style="padding:100px; color:white; text-align:center;">Error: Controller no listo. Reintenta en 1s...</div>';
                        setTimeout(() => window.Router.navigate('records'), 1500);
                    }
                }
            };

            // Determinar la ruta inicial desde el hash de la URL (Deep Linking)
            const initialHash = window.location.hash.replace('#', '');
            this.currentRoute = this.routes[initialHash] ? initialHash : 'dashboard';

            // Handle browser navigation
            window.onpopstate = (event) => {
                if (event.state && event.state.route) {
                    this.navigate(event.state.route, true);
                } else {
                    const currentHash = window.location.hash.replace('#', '');
                    const targetRoute = this.routes[currentHash] ? currentHash : 'dashboard';
                    this.navigate(targetRoute, true);
                }
            };

            this.init();
        }

        init() {
            this.initGlobalExceptionHandler();
            console.log("🛣️ Enterprise Router System v2.0 Initialized");
        }

        handleControllerTab(controllerName, tabName) {
            const controller = window[controllerName];
            if (controller) {
                if (typeof controller.init === 'function') controller.init();
                if (typeof controller.setTab === 'function') controller.setTab(tabName);
            }
        }

        navigate(route, isBack = false) {
            if (this.currentRoute === route && !isBack) return;

            console.log(`[Router] Transitioning: ${this.currentRoute} -> ${route}`);

            // === MEMORY & RESOURCE CLEANUP ===
            this.cleanupPreviousRoute();

            this.currentRoute = route;

            // Update UI State
            this.updateNavUI(route);

            // Execute View Logic
            const viewAction = this.routes[route];
            if (viewAction) {
                try {
                    viewAction();
                } catch (error) {
                    console.error(`[Router] Error executing route ${route}:`, error);
                    this.renderError(route, error);
                }
            } else {
                this.renderPlaceholder(route);
            }

            // History Management
            if (!isBack) {
                window.history.pushState({ route }, '', `#${route}`);
            }

            // Global scroll to top on nav
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        cleanupPreviousRoute() {
            const controllersToCleanup = [
                { name: 'DashboardView', routes: ['dashboard'] },
                { name: 'DashboardController', routes: ['dashboard'] },
                { name: 'EventsController', routes: ['events', 'americanas', 'results', 'agenda', 'entrenos', 'partidas_abiertas', 'open_matches'] },
                { name: 'ControlTowerView', routes: ['live'] },
                { name: 'TVView', routes: ['tv'] },
                { name: 'PlayerController', routes: ['profile'] },
                { name: 'RecordsController', routes: ['records'] },
                { name: 'RankingController', routes: ['ranking'] },
                { name: 'OpenMatchesController', routes: ['partidas_abiertas'] },
                { name: 'TeamController', routes: ['teams', 'equipos'] }
            ];

            controllersToCleanup.forEach(ctrl => {
                if (ctrl.routes.includes(this.currentRoute)) {
                    const instance = window[ctrl.name];
                    if (instance && typeof instance.destroy === 'function') {
                        console.log(`[Router] Cleaning up ${ctrl.name}`);
                        instance.destroy();
                    }
                }
            });
        }

        updateNavUI(route) {
            // 1. Bottom Nav Dock (New System)
            let activeColor = 'rgba(204, 255, 0, 0.15)'; // color por defecto (lime)
            
            document.querySelectorAll('.nav-item').forEach(btn => {
                // Determine if this nav-item corresponds to the current route
                // We check if the ID contains the route name or if it's a direct match
                const navRoute = btn.id.replace('nav-', '');
                const isActive = navRoute === route;
                btn.classList.toggle('active', isActive);

                if (isActive) {
                    if (window.navigator.vibrate) {
                        window.navigator.vibrate(10);
                    }
                    
                    // Obtener el color propio del elemento activo para el glow general de la barra
                    const style = getComputedStyle(btn);
                    const itemColorRgb = style.getPropertyValue('--item-color-rgb').trim();
                    if (itemColorRgb) {
                        activeColor = `rgba(${itemColorRgb}, 0.25)`;
                    }
                }
            });

            // Aplicar el color de resplandor dinámico a la barra
            const navBar = document.querySelector('.bottom-nav-bar');
            if (navBar) {
                navBar.style.setProperty('--nav-glow-color', activeColor);
            }

            // Mostrar el HUD flotante con mensajes motivacionales del Asistente
            if (typeof window.showNavHudMessage === 'function') {
                window.showNavHudMessage(route);
            }

            // 2. Legacy Bottom Nav Dock (Support for other views if any)
            document.querySelectorAll('.p-nav-item').forEach(btn => {
                const isActive = btn.dataset.view === route;
                btn.classList.toggle('active', isActive);
            });

            // 3. Top Header Tabs (Smart selection)
            document.querySelectorAll('.header-tab').forEach(tab => {
                const onclickAttr = tab.getAttribute('onclick') || '';
                const match = onclickAttr.match(/'([^']+)'/);
                const view = match ? match[1] : null;
                const isActive = view === route;

                tab.classList.toggle('active', isActive);

                // Styles are now handled via CSS classes to keep JS clean
                // .header-tab.active { font-weight: 900; color: #000; border-bottom: 3px solid #FF9800; }
            });
        }

        renderDashboard(attempts = 0) {
            if (window.DashboardView && window.Store) {
                const data = window.Store.getState('dashboardData');
                window.DashboardView.render(data || { activeCourts: 0 });
            } else {
                if (attempts >= 30) { // 30 intentos * 100ms = 3 segundos
                    console.error("❌ [Router Failsafe] DashboardView o Store no cargaron a tiempo. Abortando reintentos.");
                    this.renderError('dashboard', new Error("No se pudo cargar la vista de inicio a tiempo. Por favor, comprueba tu conexión o recarga la página."));
                    return;
                }
                // Retry with timeout
                setTimeout(() => this.renderDashboard(attempts + 1), 100);
            }
        }

        renderError(route, error) {
            const content = document.getElementById('content-area');
            if (!content) return;
            content.innerHTML = `
                <div class="error-view fade-in">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h2>Error en la Ruta</h2>
                    <p>No pudimos cargar <strong>${route}</strong>.</p>
                    <pre>${error.message}</pre>
                    <button onclick="Router.navigate('dashboard')" class="btn-primary-pro">VOLVER AL PANEL</button>
                </div>
            `;
        }

        renderPlaceholder(name) {
            const content = document.getElementById('content-area');
            if (!content) return;

            content.innerHTML = `
                <div class="placeholder-view fade-in">
                    <div class="icon-circle">
                        <i class="fas fa-rocket"></i>
                    </div>
                    <h2>Sección en Desarrollo</h2>
                    <p>Estamos optimizando <strong>${name}</strong>.</p>
                    <button onclick="Router.navigate('dashboard')" class="btn-primary-pro">VOLVER AL INICIO</button>
                </div>
            `;
        }

        initGlobalExceptionHandler() {
            window.addEventListener('error', (event) => {
                console.error("[CIBER-AUDIT] Captured potential runtime threat or bug:", event.error);
                // In production, we would log this to a secure server.
            });

            window.addEventListener('unhandledrejection', (event) => {
                console.warn("[CIBER-AUDIT] Unhandled Promise Rejection:", event.reason);
            });
        }
    }

    window.Router = new Router();
})();
