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
                'finished_americanas': () => this.handleControllerTab('EventsController', 'finished_americanas'),
                'agenda_americanas': () => this.handleControllerTab('EventsController', 'agenda_americanas'),
                'help_americanas': () => this.handleControllerTab('EventsController', 'help_americanas'),
                'finished': () => this.handleControllerTab('EventsController', 'finished'),
                'profile': () => this.executeControllerInit('PlayerController', 'profile'),
                'live': () => this.executeControllerInit('ControlTowerView', 'live', (c) => c.handleLiveRoute()),
                'live-entreno': () => this.executeControllerInit('EntrenoLiveView', 'live-entreno', (c) => c.handleRoute()),
                'ranking': () => this.executeControllerInit('RankingController', 'ranking'),
                'equipos': () => this.executeControllerInit('TeamController', 'equipos'),
                'teams': () => this.executeControllerInit('TeamController', 'teams'),
                'tournaments': () => this.executeControllerInit('TournamentController', 'tournaments'),
                'agenda': () => this.handleControllerTab('EventsController', 'agenda'),
                'results': () => this.handleControllerTab('EventsController', 'results'),
                'entrenos': () => this.handleControllerTab('EventsController', 'entrenos'),
                'partidas_abiertas': () => this.handleControllerTab('EventsController', 'entrenos'),
                'records': () => this.executeControllerInit('RecordsController', 'records')
            };

            // Determinar la ruta inicial desde el hash de la URL o parámetros de consulta (Deep Linking)
            const urlParams = new URLSearchParams(window.location.search);
            const isRsvpAction = urlParams.get('action') === 'rsvp' || (window.location.hash && window.location.hash.includes('rsvp'));
            const initialHash = window.location.hash.replace('#', '');
            let targetRoute = this.routes[initialHash] ? initialHash : 'dashboard';

            if (isRsvpAction) {
                targetRoute = 'equipos';
            }

            this.currentRoute = null; // No bloquear la primera navegación

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

            // Auto-cargar la ruta inicial en cuanto el DOM esté disponible
            const launchInitialRoute = () => {
                this.navigate(targetRoute, false, true);

                if (isRsvpAction) {
                    const checkRsvp = (retries = 0) => {
                        if (window.TeamController && typeof window.TeamController.checkUrlForRsvp === 'function') {
                            window.TeamController.checkUrlForRsvp();
                        } else if (retries < 20) {
                            setTimeout(() => checkRsvp(retries + 1), 150);
                        }
                    };
                    setTimeout(checkRsvp, 100);
                }
            };

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', launchInitialRoute);
            } else {
                setTimeout(launchInitialRoute, 0);
            }
        }

        init() {
            this.initGlobalExceptionHandler();
            console.log("🛣️ Enterprise Router System v2.0 Initialized");
        }

        executeControllerInit(controllerName, route, customAction = null, retries = 0) {
            const controller = window[controllerName];
            if (controller) {
                try {
                    if (typeof customAction === 'function') {
                        customAction(controller);
                    } else if (typeof controller.init === 'function') {
                        controller.init();
                    }
                } catch (err) {
                    console.error(`[Router] Error ejecutando ${controllerName}:`, err);
                    this.renderError(route, err);
                }
            } else if (retries < 80) {
                if (retries === 4) {
                    const content = document.getElementById('content-area');
                    if (content && !content.querySelector('.loader')) {
                        content.innerHTML = '<div class="loader-container" style="display:flex; justify-content:center; align-items:center; height:50vh;"><div class="loader"></div></div>';
                    }
                }
                setTimeout(() => this.executeControllerInit(controllerName, route, customAction, retries + 1), 50);
            } else {
                console.error(`❌ [Router] Controlador ${controllerName} no encontrado tras varios intentos`);
                this.renderError(route, new Error(`El módulo ${route} tardó demasiado en responder.`));
            }
        }

        handleControllerTab(controllerName, tabName, retries = 0) {
            const controller = window[controllerName];
            if (controller) {
                try {
                    if (controller.state && typeof controller.state === 'object') {
                        controller.state.activeTab = tabName;
                    }
                    if (!controller.state?.viewInitialized && typeof controller.init === 'function') {
                        controller.init();
                    } else if (typeof controller.setTab === 'function') {
                        controller.setTab(tabName);
                    } else if (typeof controller.render === 'function') {
                        controller.render();
                    }
                } catch (err) {
                    console.error(`[Router] Error en handleControllerTab (${controllerName}, ${tabName}):`, err);
                    this.renderError(tabName, err);
                }
            } else if (retries < 80) {
                if (retries === 4) {
                    const content = document.getElementById('content-area');
                    if (content && !content.querySelector('.loader')) {
                        content.innerHTML = '<div class="loader-container" style="display:flex; justify-content:center; align-items:center; height:50vh;"><div class="loader"></div></div>';
                    }
                }
                setTimeout(() => this.handleControllerTab(controllerName, tabName, retries + 1), 50);
            } else {
                console.error(`❌ [Router] Controlador ${controllerName} no listo para pestaña ${tabName}`);
                this.renderError(tabName, new Error(`El módulo de ${tabName} tardó demasiado en cargar.`));
            }
        }

        navigate(route, isBack = false, force = false) {
            const content = document.getElementById('content-area');
            const needsRender = !content || 
                content.querySelector('.match-promo-card') !== null || 
                (route === 'dashboard' && !content.querySelector('.dashboard-v2-container'));

            if (this.currentRoute === route && !isBack && !force && !needsRender) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }

            console.log(`[Router] Transitioning: ${this.currentRoute} -> ${route} (force: ${force})`);

            // === MEMORY & RESOURCE CLEANUP ===
            this.cleanupPreviousRoute(route);

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
                const search = window.location.search || '';
                const hasRsvpParam = search.includes('action=rsvp');
                const targetHash = `#${route}`;
                const fullUrl = hasRsvpParam ? `${search}${targetHash}` : targetHash;
                window.history.pushState({ route }, '', fullUrl);
            }

            // Global scroll to top on nav
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        cleanupPreviousRoute(newRoute) {
            if (this.currentRoute && this.currentRoute === newRoute) return;

            const controllersToCleanup = [
                { name: 'DashboardView', routes: ['dashboard'] },
                { name: 'DashboardController', routes: ['dashboard'] },
                { name: 'EventsController', routes: ['events', 'americanas', 'finished_americanas', 'agenda_americanas', 'help_americanas', 'finished', 'agenda', 'results', 'entrenos', 'partidas_abiertas'] },
                { name: 'ControlTowerView', routes: ['live'] },
                { name: 'TVView', routes: ['tv'] },
                { name: 'PlayerController', routes: ['profile'] },
                { name: 'RecordsController', routes: ['records'] },
                { name: 'RankingController', routes: ['ranking'] },
                { name: 'TeamController', routes: ['teams', 'equipos'] },
                { name: 'TournamentController', routes: ['tournaments'] }
            ];

            controllersToCleanup.forEach(ctrl => {
                if (ctrl.routes.includes(this.currentRoute) && !ctrl.routes.includes(newRoute)) {
                    // Mantener el servicio de fondo de EventsController activo para transiciones instantáneas
                    if (ctrl.name === 'EventsController') {
                        const instance = window.EventsController;
                        if (instance && typeof instance.stopAutoRefreshPolling === 'function') {
                            instance.stopAutoRefreshPolling();
                        }
                        return;
                    }

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
                const navRoute = btn.id.replace('nav-', '');
                let effectiveRoute = route;
                if (['events', 'americanas', 'finished_americanas', 'agenda_americanas', 'help_americanas'].includes(route)) {
                    effectiveRoute = 'americanas';
                } else if (['entrenos', 'agenda', 'help', 'finished', 'partidas_abiertas'].includes(route)) {
                    effectiveRoute = 'entrenos';
                } else if (['equipos', 'teams'].includes(route)) {
                    effectiveRoute = 'teams';
                }
                const isActive = navRoute === effectiveRoute;
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
                if (attempts >= 50) { // 50 intentos * 100ms = 5 segundos
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
