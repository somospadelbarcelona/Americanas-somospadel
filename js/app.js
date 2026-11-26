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
                window.Store.subscribe('playerStats', (stats) => {
                    const curUser = window.Store ? window.Store.getState('currentUser') : null;
                    this.updateGlobalHeader(curUser);
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
            if (!user) return;

            // UPDATE GLOBAL HEADER
            this.updateGlobalHeader(user);

            // Telemetría de acceso enriquecida (DAU/MAU, procedencia, geolocalización)
            this.recordAccessTelemetry(user);

            const authModal = document.getElementById('auth-modal');
            if (authModal) {
                authModal.classList.add('hidden');
                authModal.style.setProperty('display', 'none', 'important');
            }

            const appShell = document.getElementById('app-shell');
            if (appShell) appShell.classList.remove('hidden');

            // NEW: Load Side Menu from DB (solo una vez)
            if (!this._sideMenuLoaded) {
                this._sideMenuLoaded = true;
                this.loadSideMenu();
            }

            // Sincronizar estadísticas reales del jugador en segundo plano (con debounce de 30s)
            const uid = user?.id || user?.uid;
            const now = Date.now();
            if (uid && (!this._lastFetchedPlayerDataUid || this._lastFetchedPlayerDataUid !== uid || (now - (this._lastFetchedPlayerDataTime || 0) > 30000))) {
                this._lastFetchedPlayerDataUid = uid;
                this._lastFetchedPlayerDataTime = now;
                try {
                    if (window.PlayerController && typeof window.PlayerController.fetchPlayerData === 'function') {
                        window.PlayerController.fetchPlayerData(uid).catch(e => console.warn("Player data preload:", e));
                    }
                } catch (e) {
                    console.warn("PlayerController fetch silent err:", e);
                }
            }

            // Solo navegar a la ruta inicial si el Router no tiene una ruta activa ya renderizada
            if (window.Router && !window.Router.currentRoute) {
                const initialHash = window.location.hash.replace('#', '') || 'dashboard';
                window.Router.navigate(initialHash, false, false);
            }
        }

        async loadSideMenu() {
            // --- DEFINICIÓN DE FUNCIONES GLOBALES DE NAVEGACIÓN ---
            window.openDrawer = () => {
                window.PlayerView?.haptic?.(20);
                window._closeUserDropdown?.();
                const drawer = document.getElementById('side-drawer-container');
                const menu = document.getElementById('side-drawer-menu');
                if (drawer) drawer.classList.add('open');
                if (menu) menu.classList.add('open');
                if (window.AppInstance && typeof window.AppInstance.loadSideMenu === 'function') {
                    window.AppInstance.loadSideMenu();
                }
            };

            window.closeDrawer = () => {
                window.PlayerView?.haptic?.(10);
                const drawer = document.getElementById('side-drawer-container');
                const menu = document.getElementById('side-drawer-menu');
                if (drawer) drawer.classList.remove('open');
                if (menu) menu.classList.remove('open');
            };

            window.refreshSideMenu = () => {
                if (window.AppInstance && typeof window.AppInstance.loadSideMenu === 'function') {
                    window.AppInstance.loadSideMenu();
                }
            };

            window.smartNavigate = (route, tab) => {
                window.PlayerView?.haptic?.(15);
                console.log(`🧭 SmartNavigate: ${route} -> tab: ${tab}`);

                const targetRoute = (route === 'teams') ? 'equipos' : route;
                const finalRoute = (targetRoute === 'home' || targetRoute === 'community') ? 'comunidad' : targetRoute;

                // Si navegamos a perfil con pestaña específica, preconfigurar PlayerView
                if (finalRoute === 'profile' && tab && window.PlayerView) {
                    window.PlayerView.activeTab = tab;
                    window.PlayerView.activeSubnavTab = tab;
                }

                // 1. Navegar a la ruta base
                if (window.Router) {
                    if (finalRoute === 'dashboard') {
                        window.Router.navigate('dashboard', false, true);
                    } else {
                        window.Router.navigate(finalRoute);
                    }
                }

                // 2. Controlar pestañas específicas (ej: Resultados en Americanas, Perfil, etc.)
                if (tab) {
                    const applyTab = () => {
                        if (targetRoute === 'profile') {
                            if (window.PlayerView && typeof window.PlayerView.setProfileTab === 'function') {
                                console.log(`🔄 SmartNavigate: Forzando pestaña profile ${tab}`);
                                window.PlayerView.setProfileTab(tab);
                            }
                            const body = document.getElementById('player-profile-tab-body') || document.querySelector('.profile-tab-btn-pill');
                            if (body) {
                                try { body.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) {}
                            }
                        } else if (window.EventsController && typeof window.EventsController.setTab === 'function') {
                            console.log(`🔄 SmartNavigate: Forzando pestaña ${tab}`);
                            window.EventsController.setTab(tab);
                        } else {
                            console.warn("⚠️ Controller no listo para setTab");
                        }
                    };

                    setTimeout(applyTab, 200);
                    if (window.Router?.currentRoute === 'profile') {
                        applyTab();
                    }
                }

                window.closeDrawer();
            };

            window.openCommunityChat = () => {
                window.closeDrawer();
                window.PlayerView?.haptic?.(15);
                if (window.ChatView && typeof window.ChatView.toggle === 'function') {
                    window.ChatView.toggle();
                } else if (window.ChatView && typeof window.ChatView.init === 'function') {
                    window.ChatView.init('general_community', 'Comunidad SomosPadel');
                } else {
                    if (window.Router) window.Router.navigate('americanas');
                }
            };

            window.openClubWhatsApp = () => {
                window.closeDrawer();
                window.PlayerView?.haptic?.(15);
                window.open('https://wa.me/34649219350?text=Hola%20SomosPadel%20BCN!%20Tengo%20una%20consulta%20sobre%20las%20americanas%20y%20partidas.', '_blank');
            };

            window.openClubInstagram = () => {
                window.closeDrawer?.();
                window.PlayerView?.haptic?.(15);
                if (window.SocialChannelsService) {
                    window.SocialChannelsService.openInstagram();
                } else {
                    window.open('https://www.instagram.com/somospadelbarcelona_/?hl=es', '_blank');
                }
            };

            window.openClubFacebook = () => {
                window.closeDrawer?.();
                window.PlayerView?.haptic?.(15);
                if (window.SocialChannelsService) {
                    window.SocialChannelsService.openFacebook();
                } else {
                    window.open('https://www.facebook.com/?locale=es_ES', '_blank');
                }
            };

            window.showAmericanasRulesModal = function() {
                window.closeDrawer?.();
                window.PlayerView?.haptic?.(20);
                
                let modal = document.getElementById('sp-rules-modal');
                if (!modal) {
                    modal = document.createElement('div');
                    modal.id = 'sp-rules-modal';
                    modal.className = 'sp-rules-modal-overlay';
                    modal.innerHTML = `
                        <div class="sp-rules-modal-box" style="background:#ffffff; border:1px solid #e2e8f0; box-shadow:0 25px 70px rgba(0,0,0,0.18);">
                            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px; border-bottom:1px solid #f1f5f9; padding-bottom:12px;">
                                <div>
                                    <div style="display:flex; align-items:center; gap:8px;">
                                        <span style="font-size:1.4rem;">📜</span>
                                        <h3 style="margin:0; font-size:1.15rem; font-weight:900; color:#0f172a;">Formato & Normativa</h3>
                                    </div>
                                    <div style="font-size:0.65rem; color:#65a30d; font-weight:800; letter-spacing:1px; margin-top:3px;">AMERICANAS SOMOSPADEL BCN</div>
                                </div>
                                <button onclick="document.getElementById('sp-rules-modal').style.display='none'" style="background:#f1f5f9; border:1px solid #e2e8f0; color:#0f172a; width:34px; height:34px; border-radius:12px; cursor:pointer; display:flex; align-items:center; justify-content:center;">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>

                            <div style="display:flex; flex-direction:column; gap:11px; font-size:0.82rem; color:#334155; line-height:1.45;">
                                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:14px; padding:12px;">
                                    <div style="font-weight:900; color:#4d7c0f; margin-bottom:4px; display:flex; align-items:center; gap:8px;">
                                        <i class="fas fa-stopwatch"></i> 1. Duración & Rondas
                                    </div>
                                    <div>Rondas dinámicas continuas de 16 a 20 minutos (o tanteo pactado a 32 puntos). Al sonar el aviso acústico, se concluye el punto en disputa.</div>
                                </div>

                                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:14px; padding:12px;">
                                    <div style="font-weight:900; color:#0284c7; margin-bottom:4px; display:flex; align-items:center; gap:8px;">
                                        <i class="fas fa-shuffle"></i> 2. Rotación de Pistas y Parejas
                                    </div>
                                    <div>Ascensos y descensos automáticos para equilibrar niveles en cada ronda y garantizar partidas reñidas.</div>
                                </div>

                                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:14px; padding:12px;">
                                    <div style="font-weight:900; color:#b45309; margin-bottom:4px; display:flex; align-items:center; gap:8px;">
                                        <i class="fas fa-calculator"></i> 3. Puntuación Individual
                                    </div>
                                    <div>Cada jugador suma sus juegos ganados. El diferencial de juegos totales (+/-) define el podio de la americana.</div>
                                </div>

                                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:14px; padding:12px;">
                                    <div style="font-weight:900; color:#15803d; margin-bottom:4px; display:flex; align-items:center; gap:8px;">
                                        <i class="fas fa-mobile-screen-button"></i> 4. Marcadores en Directo
                                    </div>
                                    <div>Sube el resultado de tu pista en la App al terminar cada ronda para actualizar el ranking en tiempo real.</div>
                                </div>

                                <div style="background:#f7fee7; border:1px solid #d9f99d; border-radius:14px; padding:12px; text-align:center;">
                                    <span style="font-weight:900; color:#4d7c0f; font-size:0.85rem;">🤝 Fair Play & Tercer Tiempo</span>
                                    <div style="font-size:0.75rem; color:#475569; margin-top:3px;">La deportividad, el respeto y la convivencia son el ADN de SomosPadel BCN.</div>
                                </div>
                            </div>

                            <button onclick="document.getElementById('sp-rules-modal').style.display='none'" style="margin-top:16px; width:100%; background:#CCFF00; color:#0f172a; border:1px solid #bbf400; padding:13px; border-radius:14px; font-weight:900; font-size:0.85rem; cursor:pointer; box-shadow:0 4px 15px rgba(204,255,0,0.3); transition:all 0.2s;">
                                ¡ENTENDIDO, A JUGAR! 🎾
                            </button>
                        </div>
                    `;
                    document.body.appendChild(modal);
                    modal.addEventListener('click', function(e) {
                        if (e.target === modal) modal.style.display = 'none';
                    });
                } else {
                    modal.style.display = 'flex';
                }
            };

            window.showGameModesModal = function(initialTab = 'pareja') {
                window.closeDrawer?.();
                window.PlayerView?.haptic?.(20);

                let modal = document.getElementById('sp-game-modes-modal');
                if (!modal) {
                    modal = document.createElement('div');
                    modal.id = 'sp-game-modes-modal';
                    modal.style.cssText = `
                        position: fixed; inset: 0; z-index: 9999999;
                        background: rgba(15, 23, 42, 0.65); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
                        display: flex; align-items: center; justify-content: center;
                        padding: 14px; box-sizing: border-box; font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
                        animation: spModesFadeIn 0.22s ease-out;
                    `;

                    modal.innerHTML = `
                        <style>
                            @keyframes spModesFadeIn { from { opacity: 0; } to { opacity: 1; } }
                            @keyframes spModesSlideUp { from { transform: translateY(20px) scale(0.98); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }

                            .sp-modes-modal-box {
                                background: #ffffff;
                                color: #0f172a;
                                border: 1px solid #e2e8f0;
                                border-radius: 24px;
                                width: 100%;
                                max-width: 680px;
                                height: 92vh;
                                max-height: 850px;
                                display: flex;
                                flex-direction: column;
                                overflow: hidden;
                                box-shadow: 0 24px 64px rgba(15, 23, 42, 0.28), 0 4px 16px rgba(15, 23, 42, 0.08);
                                animation: spModesSlideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1);
                                box-sizing: border-box;
                            }
                            @media (max-width: 480px) {
                                .sp-modes-modal-box {
                                    height: 94vh;
                                    max-height: 94vh;
                                    border-radius: 20px;
                                }
                            }

                            /* Header */
                            .sp-modes-header {
                                padding: 16px 20px 14px;
                                background: #ffffff;
                                border-bottom: 1px solid #e2e8f0;
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                                gap: 12px;
                                flex-shrink: 0;
                            }
                            .sp-modes-close-btn {
                                background: #f1f5f9;
                                border: 1px solid #e2e8f0;
                                color: #0f172a;
                                width: 36px;
                                height: 36px;
                                border-radius: 12px;
                                cursor: pointer;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-size: 0.95rem;
                                transition: all 0.18s ease;
                                flex-shrink: 0;
                            }
                            .sp-modes-close-btn:hover {
                                background: #0f172a;
                                border-color: #0f172a;
                                color: #ffffff;
                                transform: scale(1.05);
                            }

                            /* Tabs bar */
                            .sp-modes-tabs-bar {
                                padding: 10px 16px;
                                background: #f8fafc;
                                border-bottom: 1px solid #e2e8f0;
                                display: grid;
                                grid-template-columns: repeat(4, 1fr);
                                gap: 7px;
                                flex-shrink: 0;
                            }
                            @media (max-width: 520px) {
                                .sp-modes-tabs-bar {
                                    grid-template-columns: repeat(2, 1fr);
                                    padding: 10px 12px;
                                    gap: 6px;
                                }
                            }

                            .sp-modes-tab-btn {
                                min-width: 0;
                                padding: 9px 8px;
                                border-radius: 12px;
                                border: 1.5px solid #e2e8f0;
                                font-size: 0.74rem;
                                font-weight: 800;
                                cursor: pointer;
                                transition: all 0.18s ease;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                gap: 6px;
                                color: #334155;
                                background: #ffffff;
                                white-space: nowrap;
                                letter-spacing: 0.2px;
                            }
                            .sp-modes-tab-btn:hover {
                                border-color: #cbd5e1;
                                background: #f1f5f9;
                                color: #0f172a;
                            }
                            .sp-modes-tab-btn.active-pareja {
                                background: #e0f2fe;
                                border-color: #0284c7;
                                color: #0369a1;
                                box-shadow: 0 3px 10px rgba(2, 132, 199, 0.16);
                            }
                            .sp-modes-tab-btn.active-twister {
                                background: #fce7f3;
                                border-color: #db2777;
                                color: #be185d;
                                box-shadow: 0 3px 10px rgba(219, 39, 119, 0.16);
                            }
                            .sp-modes-tab-btn.active-suizo {
                                background: #fee2e2;
                                border-color: #dc2626;
                                color: #b91c1c;
                                box-shadow: 0 3px 10px rgba(220, 38, 38, 0.16);
                            }
                            .sp-modes-tab-btn.active-comparativa {
                                background: #0f172a;
                                border-color: #0f172a;
                                color: #CCFF00;
                                box-shadow: 0 3px 10px rgba(15, 23, 42, 0.2);
                            }

                            /* Cuerpo scrollable */
                            .sp-modes-scroll-body {
                                flex: 1 1 auto;
                                min-height: 0;
                                overflow-y: auto;
                                padding: 16px 18px 28px;
                                background: #ffffff;
                                display: flex;
                                flex-direction: column;
                                gap: 14px;
                                -webkit-overflow-scrolling: touch;
                            }
                            .sp-modes-scroll-body::-webkit-scrollbar { width: 6px; }
                            .sp-modes-scroll-body::-webkit-scrollbar-track { background: #f8fafc; }
                            .sp-modes-scroll-body::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                            .sp-modes-scroll-body::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

                            /* Hero banner por modo */
                            .sp-mode-hero {
                                border-radius: 18px;
                                padding: 15px 16px;
                                display: flex;
                                align-items: center;
                                justify-content: space-between;
                                flex-wrap: wrap;
                                gap: 10px;
                            }
                            .sp-mode-hero-icon {
                                width: 46px;
                                height: 46px;
                                border-radius: 14px;
                                background: #ffffff;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-size: 1.4rem;
                                flex-shrink: 0;
                                box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
                            }
                            .sp-mode-pill {
                                font-size: 0.66rem;
                                font-weight: 850;
                                padding: 5px 11px;
                                border-radius: 999px;
                                text-transform: uppercase;
                                letter-spacing: 0.5px;
                                white-space: nowrap;
                            }

                            /* Tarjetas de paso */
                            .sp-step-card {
                                background: #ffffff;
                                border: 1px solid #e2e8f0;
                                border-radius: 16px;
                                padding: 14px 15px;
                                display: flex;
                                gap: 13px;
                                align-items: flex-start;
                                box-shadow: 0 2px 6px rgba(15, 23, 42, 0.03);
                                transition: border-color 0.18s ease, box-shadow 0.18s ease;
                            }
                            .sp-step-card:hover {
                                border-color: #cbd5e1;
                                box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
                            }
                            .sp-step-icon {
                                width: 38px;
                                height: 38px;
                                border-radius: 11px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-size: 0.98rem;
                                flex-shrink: 0;
                            }
                            .sp-step-title {
                                font-weight: 850;
                                color: #0f172a;
                                font-size: 0.92rem;
                                margin-bottom: 4px;
                                line-height: 1.3;
                            }
                            .sp-step-desc {
                                color: #1e293b;
                                font-size: 0.83rem;
                                line-height: 1.55;
                            }
                            .sp-hl-lime {
                                background: #ecfccb;
                                color: #0f172a;
                                font-weight: 800;
                                padding: 1px 6px;
                                border-radius: 6px;
                            }

                            /* Tabla comparativa responsive */
                            .sp-comp-wrap {
                                background: #ffffff;
                                border: 1px solid #e2e8f0;
                                border-radius: 18px;
                                overflow: hidden;
                                width: 100%;
                                box-sizing: border-box;
                                box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
                            }
                            .sp-comp-table {
                                width: 100%;
                                border-collapse: collapse;
                                font-size: 0.77rem;
                                text-align: left;
                                table-layout: fixed;
                            }
                            .sp-comp-table thead tr {
                                background: #f8fafc;
                                border-bottom: 1.5px solid #e2e8f0;
                            }
                            .sp-comp-table th, .sp-comp-table td {
                                padding: 11px 10px;
                                vertical-align: middle;
                                word-wrap: break-word;
                                overflow-wrap: break-word;
                            }
                            .sp-comp-table tbody tr {
                                border-bottom: 1px solid #f1f5f9;
                            }
                            .sp-comp-table tbody tr:last-child {
                                border-bottom: none;
                            }
                            .sp-comp-table tbody tr:nth-child(even) {
                                background: #fafbfc;
                            }
                            @media (max-width: 540px) {
                                .sp-comp-table th, .sp-comp-table td {
                                    padding: 9px 6px;
                                    font-size: 0.69rem;
                                }
                            }

                            /* Footer */
                            .sp-modes-footer {
                                padding: 12px 16px;
                                background: #f8fafc;
                                border-top: 1px solid #e2e8f0;
                                display: flex;
                                flex-wrap: wrap;
                                gap: 8px;
                                justify-content: space-between;
                                align-items: center;
                                flex-shrink: 0;
                            }
                            .sp-footer-sec-group {
                                display: flex;
                                gap: 8px;
                                flex: 1 1 240px;
                            }
                            .sp-footer-sec-btn {
                                flex: 1;
                                background: #ffffff;
                                border: 1.5px solid #cbd5e1;
                                color: #0f172a;
                                padding: 10px 10px;
                                border-radius: 12px;
                                font-weight: 800;
                                font-size: 0.75rem;
                                cursor: pointer;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                gap: 6px;
                                transition: all 0.18s ease;
                                white-space: nowrap;
                            }
                            .sp-footer-sec-btn:hover {
                                background: #f1f5f9;
                                border-color: #0f172a;
                                transform: translateY(-1px);
                            }
                            .sp-footer-primary-btn {
                                background: #CCFF00;
                                color: #000000;
                                border: 1.5px solid #0f172a;
                                padding: 10px 22px;
                                border-radius: 12px;
                                font-weight: 900;
                                font-size: 0.8rem;
                                cursor: pointer;
                                box-shadow: 0 4px 12px rgba(15, 23, 42, 0.12);
                                transition: all 0.18s ease;
                                flex-shrink: 0;
                                text-align: center;
                                white-space: nowrap;
                            }
                            .sp-footer-primary-btn:hover {
                                background: #beee00;
                                transform: translateY(-1px);
                                box-shadow: 0 6px 16px rgba(15, 23, 42, 0.18);
                            }
                            @media (max-width: 520px) {
                                .sp-footer-primary-btn {
                                    width: 100%;
                                }
                            }
                        </style>
                        <div class="sp-modes-modal-box">

                            <!-- Header -->
                            <div class="sp-modes-header">
                                <div style="display: flex; align-items: center; gap: 12px; min-width: 0;">
                                    <div style="width: 42px; height: 42px; border-radius: 13px; background: #CCFF00; border: 1.5px solid #0f172a; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; box-shadow: 0 3px 10px rgba(15, 23, 42, 0.1); flex-shrink: 0;">
                                        🎮
                                    </div>
                                    <div style="min-width: 0;">
                                        <div style="font-size: 0.64rem; font-weight: 850; color: #475569; letter-spacing: 1px; text-transform: uppercase;">SOMOSPADEL BARCELONA • GUÍA OFICIAL</div>
                                        <h2 style="margin: 1px 0 0; font-size: 1.25rem; font-weight: 900; color: #0f172a; letter-spacing: -0.3px;">Modos de Juego</h2>
                                    </div>
                                </div>
                                <button id="sp-modes-close-x" class="sp-modes-close-btn" aria-label="Cerrar">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>

                            <!-- Selector de pestañas -->
                            <div class="sp-modes-tabs-bar">
                                <button id="sp-tab-pareja" class="sp-modes-tab-btn active-pareja" onclick="window._switchGameModeTab('pareja')">
                                    <span style="font-size: 0.95rem;">👥</span>
                                    <span>PAREJA FIJA</span>
                                </button>
                                <button id="sp-tab-twister" class="sp-modes-tab-btn" onclick="window._switchGameModeTab('twister')">
                                    <span style="font-size: 0.95rem;">🌪️</span>
                                    <span>TWISTER</span>
                                </button>
                                <button id="sp-tab-suizo" class="sp-modes-tab-btn" onclick="window._switchGameModeTab('suizo')">
                                    <span style="display:inline-flex; align-items:center; justify-content:center; width:17px; height:17px; background:#dc2626; color:#ffffff; border-radius:4px; font-weight:950; font-size:0.75rem; line-height:1;">✚</span>
                                    <span>SUIZO</span>
                                </button>
                                <button id="sp-tab-comparativa" class="sp-modes-tab-btn" onclick="window._switchGameModeTab('comparativa')">
                                    <span style="font-size: 0.95rem;">⚖️</span>
                                    <span>COMPARATIVA</span>
                                </button>
                            </div>

                            <!-- Cuerpo Scrollable -->
                            <div id="sp-modes-scroll-body" class="sp-modes-scroll-body">

                                <!-- CONTENIDO 1: PAREJA FIJA -->
                                <div id="sp-mode-view-pareja" style="display: flex; flex-direction: column; gap: 12px;">
                                    <!-- Badge Cabecera -->
                                    <div class="sp-mode-hero" style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 1.5px solid #7dd3fc;">
                                        <div style="display: flex; align-items: center; gap: 12px;">
                                            <div class="sp-mode-hero-icon" style="border: 1.5px solid #0284c7;">
                                                👥
                                            </div>
                                            <div>
                                                <div style="color: #0369a1; font-size: 0.68rem; font-weight: 850; letter-spacing: 0.8px; text-transform: uppercase;">MODO 1: EN TÁNDEM</div>
                                                <div style="color: #0f172a; font-size: 1.18rem; font-weight: 900;">Pareja Fija</div>
                                            </div>
                                        </div>
                                        <span class="sp-mode-pill" style="background: #ffffff; color: #0369a1; border: 1px solid #7dd3fc;">COMPETICIÓN & LIGA</span>
                                    </div>

                                    <!-- Puntos clave Pareja Fija -->
                                    <div style="display: flex; flex-direction: column; gap: 10px;">
                                        <div class="sp-step-card">
                                            <div class="sp-step-icon" style="background: #e0f2fe; color: #0284c7; border: 1px solid #bae6fd;">
                                                <i class="fas fa-handshake"></i>
                                            </div>
                                            <div>
                                                <div class="sp-step-title">1. Explicación & Inscripción</div>
                                                <div class="sp-step-desc">Juegas con tu <strong style="color:#0369a1;">compañero asignado o elegido</strong> durante todo el evento / torneo. Te inscribes en pareja cerrada o Alex te asigna una pareja de tu nivel exacto.</div>
                                            </div>
                                        </div>

                                        <div class="sp-step-card">
                                            <div class="sp-step-icon" style="background: #ecfccb; color: #3f6212; border: 1px solid #bef264;">
                                                <i class="fas fa-arrows-up-down"></i>
                                            </div>
                                            <div>
                                                <div class="sp-step-title">2. Rotación & Dinámica de Pistas</div>
                                                <div class="sp-step-desc">El tándem nunca se separa: <span class="sp-hl-lime">Subís juntos de pista</span> si ganáis vuestro partido; <strong style="color: #dc2626;">bajáis juntos de pista</strong> si perdéis. Se compite por alcanzar y sostener la Pista 1 (Corona).</div>
                                            </div>
                                        </div>

                                        <div class="sp-step-card">
                                            <div class="sp-step-icon" style="background: #fef3c7; color: #b45309; border: 1px solid #fde68a;">
                                                <i class="fas fa-calculator"></i>
                                            </div>
                                            <div>
                                                <div class="sp-step-title">3. Puntuación & Ranking</div>
                                                <div class="sp-step-desc">Los juegos ganados y perdidos computan en <strong style="color:#b45309;">tándem</strong> y suman para el podio de la americana y vuestro ranking/ELO oficial de SomosPadel.</div>
                                            </div>
                                        </div>

                                        <div class="sp-step-card" style="background: #f0f9ff; border: 1.5px solid #bae6fd;">
                                            <div class="sp-step-icon" style="background: #0284c7; color: #ffffff;">
                                                <i class="fas fa-bullseye"></i>
                                            </div>
                                            <div>
                                                <div class="sp-step-title" style="color: #0369a1;">4. Estrategia & Enfoque</div>
                                                <div class="sp-step-desc">Máxima sincronía táctica, compenetración, roles claros (drive y revés definidos) y preparación directa para torneos de competición, ligas federadas o torneos oficiales.</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- CONTENIDO 2: TWISTER INDIVIDUAL -->
                                <div id="sp-mode-view-twister" style="display: none; flex-direction: column; gap: 12px;">
                                    <!-- Badge Cabecera -->
                                    <div class="sp-mode-hero" style="background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%); border: 1.5px solid #f9a8d4;">
                                        <div style="display: flex; align-items: center; gap: 12px;">
                                            <div class="sp-mode-hero-icon" style="border: 1.5px solid #db2777;">
                                                🌪️
                                            </div>
                                            <div>
                                                <div style="color: #be185d; font-size: 0.68rem; font-weight: 850; letter-spacing: 0.8px; text-transform: uppercase;">MODO 2: ROTACIÓN TOTAL</div>
                                                <div style="color: #0f172a; font-size: 1.18rem; font-weight: 900;">Twister Individual</div>
                                            </div>
                                        </div>
                                        <span class="sp-mode-pill" style="background: #ffffff; color: #be185d; border: 1px solid #f9a8d4;">SOCIAL & DINÁMICO</span>
                                    </div>

                                    <!-- Puntos clave Twister Individual -->
                                    <div style="display: flex; flex-direction: column; gap: 10px;">
                                        <div class="sp-step-card">
                                            <div class="sp-step-icon" style="background: #fce7f3; color: #db2777; border: 1px solid #fbcfe8;">
                                                <i class="fas fa-user-check"></i>
                                            </div>
                                            <div>
                                                <div class="sp-step-title">1. Explicación & Inscripción</div>
                                                <div class="sp-step-desc">Inscripción individual: <strong style="color:#be185d;">puedes apuntarte solo</strong> sin necesidad de pareja previa. La plataforma equilibra los grupos y las pistas.</div>
                                            </div>
                                        </div>

                                        <div class="sp-step-card">
                                            <div class="sp-step-icon" style="background: #ecfccb; color: #3f6212; border: 1px solid #bef264;">
                                                <i class="fas fa-shuffle"></i>
                                            </div>
                                            <div>
                                                <div class="sp-step-title">2. Rotación & Dinámica de Pistas</div>
                                                <div class="sp-step-desc">En cada ronda juegas con un compañero diferente. Si ganas tu partido, <span class="sp-hl-lime">TÚ subes de pista y cambias de pareja</span>; si pierdes, <strong style="color: #dc2626;">TÚ bajas de pista y cambias de pareja</strong>. ¡Nadie se queda estancado!</div>
                                            </div>
                                        </div>

                                        <div class="sp-step-card">
                                            <div class="sp-step-icon" style="background: #e0f2fe; color: #0284c7; border: 1px solid #bae6fd;">
                                                <i class="fas fa-medal"></i>
                                            </div>
                                            <div>
                                                <div class="sp-step-title">3. Puntuación & Ranking</div>
                                                <div class="sp-step-desc">Cada jugador <strong style="color:#0369a1;">suma sus propios juegos</strong> en cada pista. Al final del torneo, el podio individual se define por el <span class="sp-hl-lime">total de juegos y diferencial personal (+/-)</span>.</div>
                                            </div>
                                        </div>

                                        <div class="sp-step-card" style="background: #fdf2f8; border: 1.5px solid #fbcfe8;">
                                            <div class="sp-step-icon" style="background: #db2777; color: #ffffff;">
                                                <i class="fas fa-bolt"></i>
                                            </div>
                                            <div>
                                                <div class="sp-step-title" style="color: #be185d;">4. Estrategia & Enfoque</div>
                                                <div class="sp-step-desc">Gran adaptabilidad táctica, versatilidad para desenvolverte tanto en el drive como en el revés, y dinamismo social continuo conociendo a múltiples jugadores del club en una misma tarde.</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- CONTENIDO 3: SUIZO (AMERICANA / ENTRENO SUIZO) -->
                                <div id="sp-mode-view-suizo" style="display: none; flex-direction: column; gap: 12px;">
                                    <!-- Badge Cabecera -->
                                    <div class="sp-mode-hero" style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border: 1.5px solid #fca5a5;">
                                        <div style="display: flex; align-items: center; gap: 12px;">
                                            <div class="sp-mode-hero-icon" style="border: 1.5px solid #dc2626;">
                                                <span style="display:inline-flex; align-items:center; justify-content:center; width:26px; height:26px; background:#dc2626; color:#ffffff; border-radius:7px; font-weight:950; font-size:1.05rem; line-height:1;">✚</span>
                                            </div>
                                            <div>
                                                <div style="color: #b91c1c; font-size: 0.68rem; font-weight: 850; letter-spacing: 0.8px; text-transform: uppercase;">MODO 3: RANKING & EQUILIBRIO PRO</div>
                                                <div style="color: #0f172a; font-size: 1.18rem; font-weight: 900;">Americana / Entreno Suizo</div>
                                            </div>
                                        </div>
                                        <span class="sp-mode-pill" style="background: #ffffff; color: #b91c1c; border: 1px solid #fca5a5;">6 RONDAS • 2 HORAS</span>
                                    </div>

                                    <!-- Puntos clave Suizo -->
                                    <div style="display: flex; flex-direction: column; gap: 10px;">
                                        <div class="sp-step-card">
                                            <div class="sp-step-icon" style="background: #fee2e2; color: #dc2626; border: 1px solid #fecaca;">
                                                <i class="fas fa-stopwatch"></i>
                                            </div>
                                            <div>
                                                <div class="sp-step-title">1. Duración & 6 Rondas Express (2h)</div>
                                                <div class="sp-step-desc">Duración total de <strong style="color: #b91c1c;">2 horas</strong> (habitualmente 3 pistas, 12 jugadores o proporcional). Se disputan <span class="sp-hl-lime">6 rondas express</span> de juego efectivo para ir perfecto de tiempos. En cuanto suena el silbato de Alex, se acaba el punto en juego de inmediato.</div>
                                            </div>
                                        </div>

                                        <div class="sp-step-card">
                                            <div class="sp-step-icon" style="background: #e0f2fe; color: #0284c7; border: 1px solid #bae6fd;">
                                                <i class="fas fa-calculator"></i>
                                            </div>
                                            <div>
                                                <div class="sp-step-title">2. Puntuación Individual (Juegos Ganados = Puntos)</div>
                                                <div class="sp-step-desc">Formato individual (cambias de pareja en cada ronda). Se contabilizan los <strong style="color: #0369a1;">juegos totales que consigas en tu partido</strong> como tus puntos personales (ej: si quedas 6-3, tú y tu compañero sumáis 6 puntos cada uno en la tabla; los rivales suman 3).</div>
                                            </div>
                                        </div>

                                        <div class="sp-step-card">
                                            <div class="sp-step-icon" style="background: #ecfccb; color: #3f6212; border: 1px solid #bef264;">
                                                <i class="fas fa-layer-group"></i>
                                            </div>
                                            <div>
                                                <div class="sp-step-title">3. Sistema Suizo: Reagrupación por Pistas</div>
                                                <div class="sp-step-desc">Tras cada ronda se actualiza la tabla con la puntuación acumulada:<br>
                                                    • <strong style="color: #3f6212;">Pista 1 (Top):</strong> Los 4 clasificados más altos suben a Pista 1.<br>
                                                    • <strong style="color: #0369a1;">Pista 2 (Medios):</strong> Los 4 siguientes van a Pista 2.<br>
                                                    • <strong style="color: #b91c1c;">Pista 3 (Bajos):</strong> Los 4 restantes van a Pista 3.
                                                </div>
                                            </div>
                                        </div>

                                        <div class="sp-step-card">
                                            <div class="sp-step-icon" style="background: #f3e8ff; color: #7e22ce; border: 1px solid #e9d5ff;">
                                                <i class="fas fa-people-arrows"></i>
                                            </div>
                                            <div>
                                                <div class="sp-step-title">4. Compañeros Equilibrados sin Repetición</div>
                                                <div class="sp-step-desc">En cada pista se cruzan las parejas para que los partidos sean ultra equilibrados y <strong style="color:#7e22ce;">no se repite compañero si es posible</strong> según el historial previo.</div>
                                            </div>
                                        </div>

                                        <div class="sp-step-card" style="background: #fef2f2; border: 1.5px solid #fecaca;">
                                            <div class="sp-step-icon" style="background: #dc2626; color: #ffffff;">
                                                <i class="fas fa-trophy"></i>
                                            </div>
                                            <div>
                                                <div class="sp-step-title" style="color: #b91c1c;">5. Campeón del Torneo</div>
                                                <div class="sp-step-desc">Al finalizar las 6 rondas, el jugador que tenga <span class="sp-hl-lime">más juegos sumados en la tabla general</span> se proclama Campeón oficial del Torneo.</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- CONTENIDO 4: COMPARATIVA RÁPIDA -->
                                <div id="sp-mode-view-comparativa" style="display: none; flex-direction: column; gap: 12px;">

                                    <!-- TABLA COMPARATIVA FLUIDA -->
                                    <div class="sp-comp-wrap">
                                        <table class="sp-comp-table">
                                            <colgroup>
                                                <col style="width: 27%;">
                                                <col style="width: 24%;">
                                                <col style="width: 24%;">
                                                <col style="width: 25%;">
                                            </colgroup>
                                            <thead>
                                                <tr>
                                                    <th style="color: #475569; font-weight: 850; font-size: 0.7rem; text-transform: uppercase;">Criterio</th>
                                                    <th style="color: #0369a1; font-weight: 900; font-size: 0.7rem; text-transform: uppercase;">👥 Fija</th>
                                                    <th style="color: #be185d; font-weight: 900; font-size: 0.7rem; text-transform: uppercase;">🌪️ Twister</th>
                                                    <th style="color: #b91c1c; font-weight: 900; font-size: 0.7rem; text-transform: uppercase;"><span style="display:inline-flex; align-items:center; justify-content:center; width:13px; height:13px; background:#dc2626; color:#ffffff; border-radius:3px; font-weight:950; font-size:0.58rem; line-height:1; vertical-align:middle; margin-right:2px;">✚</span> Suizo</th>
                                                </tr>
                                            </thead>
                                            <tbody style="color: #1e293b; line-height: 1.4;">
                                                <tr>
                                                    <td style="font-weight: 850; color: #0f172a;">¿Pareja previa?</td>
                                                    <td style="color: #334155;">Sí (fija)</td>
                                                    <td style="color: #3f6212; font-weight: 800;">No, individual</td>
                                                    <td style="color: #3f6212; font-weight: 800;">No, individual</td>
                                                </tr>
                                                <tr>
                                                    <td style="font-weight: 850; color: #0f172a;">Compañero</td>
                                                    <td style="color: #334155;">El mismo</td>
                                                    <td style="color: #be185d; font-weight: 800;">Cambia cada ronda</td>
                                                    <td style="color: #b91c1c; font-weight: 800;">Cambia (sin repetir)</td>
                                                </tr>
                                                <tr>
                                                    <td style="font-weight: 850; color: #0f172a;">Dinámica Pistas</td>
                                                    <td style="color: #334155;">Tándem (+1/-1)</td>
                                                    <td style="color: #3f6212; font-weight: 800;">Individual (+1/-1)</td>
                                                    <td style="color: #b91c1c; font-weight: 800;">Top / Med / Baj</td>
                                                </tr>
                                                <tr>
                                                    <td style="font-weight: 850; color: #0f172a;">Puntuación</td>
                                                    <td style="color: #334155;">Por parejas</td>
                                                    <td style="color: #0369a1; font-weight: 800;">Individual (+/- dif)</td>
                                                    <td style="color: #3f6212; font-weight: 800;">Juegos ganados</td>
                                                </tr>
                                                <tr>
                                                    <td style="font-weight: 850; color: #0f172a;">Rondas & Duración</td>
                                                    <td style="color: #334155;">Rondas std (2h)</td>
                                                    <td style="color: #334155;">Rondas std (2h)</td>
                                                    <td style="color: #b91c1c; font-weight: 800;">6 rondas expr. (2h)</td>
                                                </tr>
                                                <tr>
                                                    <td style="font-weight: 850; color: #0f172a;">Campeón / Podio</td>
                                                    <td style="color: #334155;">Dupla en Pista 1</td>
                                                    <td style="color: #0369a1; font-weight: 800;">Mayor balance (+/-)</td>
                                                    <td style="color: #0f172a; font-weight: 900;"><span class="sp-hl-lime">Más juegos totales</span></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    <!-- Consejo y resumen -->
                                    <div style="background: #f7fee7; border: 1.5px solid #bef264; border-radius: 16px; padding: 14px 16px; text-align: center; margin-bottom: 4px;">
                                        <div style="color: #0f172a; font-weight: 900; font-size: 0.85rem; margin-bottom: 4px;">💡 Consejo SomosPadel BCN</div>
                                        <div style="color: #1e293b; font-size: 0.78rem; line-height: 1.5;">Tres modalidades oficiales adaptadas a ti: <strong>Pareja Fija</strong> para compenetración y ligas, <strong>Twister</strong> para networking y rotación continua, y <strong>Suizo</strong> para competición express de máxima igualdad deportiva.</div>
                                    </div>
                                </div>
                            </div>

                            <!-- Footer con botones de acción -->
                            <div class="sp-modes-footer">
                                <div class="sp-footer-sec-group">
                                    <button class="sp-footer-sec-btn" onclick="document.getElementById('sp-game-modes-modal').style.display='none'; window.smartNavigate ? window.smartNavigate('americanas') : (window.location.hash='#americanas')">
                                        <i class="fas fa-trophy" style="color: #ca8a04;"></i> VER AMERICANAS
                                    </button>
                                    <button class="sp-footer-sec-btn" onclick="document.getElementById('sp-game-modes-modal').style.display='none'; window.smartNavigate ? window.smartNavigate('entrenos') : (window.location.hash='#entrenos')">
                                        <i class="fas fa-dumbbell" style="color: #0284c7;"></i> VER ENTRENOS
                                    </button>
                                </div>
                                <button class="sp-footer-primary-btn" onclick="document.getElementById('sp-game-modes-modal').style.display='none'">
                                    ¡ENTENDIDO! 🎾
                                </button>
                            </div>

                        </div>
                    `;

                    document.body.appendChild(modal);

                    // Función para cambiar pestañas
                    window._switchGameModeTab = function(tab) {
                        const tabPareja = document.getElementById('sp-tab-pareja');
                        const tabTwister = document.getElementById('sp-tab-twister');
                        const tabSuizo = document.getElementById('sp-tab-suizo');
                        const tabComp = document.getElementById('sp-tab-comparativa');

                        const viewPareja = document.getElementById('sp-mode-view-pareja');
                        const viewTwister = document.getElementById('sp-mode-view-twister');
                        const viewSuizo = document.getElementById('sp-mode-view-suizo');
                        const viewComp = document.getElementById('sp-mode-view-comparativa');
                        const scrollBody = document.getElementById('sp-modes-scroll-body');

                        if (!viewPareja || !viewTwister || !viewComp) return;

                        if (tabPareja) tabPareja.className = 'sp-modes-tab-btn';
                        if (tabTwister) tabTwister.className = 'sp-modes-tab-btn';
                        if (tabSuizo) tabSuizo.className = 'sp-modes-tab-btn';
                        if (tabComp) tabComp.className = 'sp-modes-tab-btn';

                        viewPareja.style.display = 'none';
                        viewTwister.style.display = 'none';
                        if (viewSuizo) viewSuizo.style.display = 'none';
                        viewComp.style.display = 'none';

                        if (tab === 'twister') {
                            if (tabTwister) tabTwister.classList.add('active-twister');
                            viewTwister.style.display = 'flex';
                        } else if (tab === 'suizo' || tab === 'swiss') {
                            if (tabSuizo) tabSuizo.classList.add('active-suizo');
                            if (viewSuizo) viewSuizo.style.display = 'flex';
                        } else if (tab === 'comparativa') {
                            if (tabComp) tabComp.classList.add('active-comparativa');
                            viewComp.style.display = 'flex';
                        } else {
                            if (tabPareja) tabPareja.classList.add('active-pareja');
                            viewPareja.style.display = 'flex';
                        }

                        if (scrollBody) scrollBody.scrollTop = 0;
                    };

                    const closeBtn = document.getElementById('sp-modes-close-x');
                    if (closeBtn) {
                        closeBtn.onclick = () => { modal.style.display = 'none'; };
                    }

                    modal.addEventListener('click', function(e) {
                        if (e.target === modal) modal.style.display = 'none';
                    });

                    document.addEventListener('keydown', function(e) {
                        if (e.key === 'Escape' && modal.style.display === 'flex') {
                            modal.style.display = 'none';
                        }
                    });
                } else {
                    modal.style.display = 'flex';
                }

                if (window._switchGameModeTab) {
                    const cleanTab = (initialTab || '').toLowerCase();
                    if (cleanTab.includes('suiz') || cleanTab.includes('swiss')) {
                        window._switchGameModeTab('suizo');
                    } else if (cleanTab.includes('twister') || cleanTab.includes('entreno') || cleanTab === 'individual') {
                        window._switchGameModeTab('twister');
                    } else if (cleanTab.includes('comp') || cleanTab === 'versus') {
                        window._switchGameModeTab('comparativa');
                    } else {
                        window._switchGameModeTab('pareja');
                    }
                }
            };

            window.openGameModesModal = window.showGameModesModal;

            // Cerrar con Escape
            if (!window._sideDrawerKeyHandler) {
                window._sideDrawerKeyHandler = true;
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') window.closeDrawer?.();
                });
            }

            const menuContainer = document.getElementById('dynamic-menu-items');
            const dockContainer = document.querySelector('.nav-dock-container');

            try {
                let currentUser = window.Store ? window.Store.getState('currentUser') : null;
                if (!currentUser) {
                    try {
                        const cached = localStorage.getItem('currentUser') || localStorage.getItem('adminUser');
                        if (cached) currentUser = JSON.parse(cached);
                    } catch (e) {}
                }
                const stats = window.Store ? window.Store.getState('playerStats') : null;
                const roleLower = (currentUser?.role || '').toLowerCase().trim();
                const isSuperAdmin = ['super_admin', 'superadmin'].includes(roleLower);
                const isAdmin = ['super_admin', 'superadmin', 'admin', 'admin_player'].includes(roleLower);
                const isCaptain = ['captain', 'capitan', 'capitanes'].includes(roleLower);
                const isStaffOrCaptain = isAdmin || isCaptain;
                const isCampaignActive = window.SeasonCampaignService ? window.SeasonCampaignService.isCampaignActiveSync() : false;

                // A. Render Side Menu (SomosPadel Drawer Pro v3 — claro, accesible y fácil de interpretar)
                if (menuContainer) {
                    const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
                    const rawName = currentUser ? (currentUser.name || currentUser.displayName || "Jugador Pro") : "Invitado";
                    const safeName = esc(rawName);
                    const level = currentUser ? parseFloat(currentUser.level || 3.5).toFixed(2) : "3.50";
                    const streak = currentUser ? (currentUser.streak || 0) : 0;
                    const matches = (stats?.stats?.matches !== undefined && stats?.stats?.matches !== null && Number(stats?.stats?.matches) > 0)
                        ? stats.stats.matches
                        : (currentUser ? (currentUser.matches_played ?? currentUser.total_matches ?? 0) : 0);
                    const photoUrl = currentUser ? (currentUser.photo_url || currentUser.photoURL) : null;
                    const initials = esc(rawName.substring(0, 2).toUpperCase());

                    let roleBadge = 'JUGADOR';
                    if (isSuperAdmin) roleBadge = '👑 SUPERADMIN';
                    else if (roleLower === 'admin_player') roleBadge = '🎖️ ADMIN + JUGADOR';
                    else if (isAdmin) roleBadge = '⚡ ADMINISTRADOR';
                    else if (isCaptain) roleBadge = '🛡️ CAPITÁN';

                    const avatarContent = photoUrl
                        ? `<img src="${esc(photoUrl)}" alt="" onerror="this.parentElement.textContent='${initials}'">`
                        : initials;

                    // Ruta activa → resalta la opción en la que está el jugador
                    const currentRoute = String(window.Router?.currentRoute || '').toLowerCase();
                    const routeAlias = { teams: 'equipos', home: 'comunidad', community: 'comunidad' };
                    const isActive = (route) => !!route && (routeAlias[route] || route) === currentRoute;

                    // Arquitectura y certificación QA del Drawer (7 Secciones del Club):
                    // SECCIÓN 1: MI ACTIVIDAD (#00E36D)
                    // SECCIÓN 2: COMPETICIÓN (#FFD700)
                    // SECCIÓN 3: RANKING & PUNTOS (#fb923c)
                    // SECCIÓN 4: PISTA & REGLAS (#38bdf8)
                    // SECCIÓN 5: COMUNIDAD & SOCIAL (#22d3ee)
                    // SECCIÓN 6: MI PERFIL (#c084fc)
                    // SECCIÓN 7: GESTIÓN & CAPITANES
                    // Elementos con IDs exactos: id="drawer-notif-bell-icon" y id="drawer-notif-badge"

                    const badgeHtml = (b) => {
                        if (!b) return '';
                        const idAttr = b.id ? (b.id === 'drawer-notif-badge' ? ' id="drawer-notif-badge"' : ` id="${b.id}"`) : '';
                        const hiddenAttr = b.hidden ? ' style="display:none;"' : '';
                        const dot = b.live ? '<span class="sdx-live-dot" aria-hidden="true"></span>' : '';
                        return `<span class="sdx-badge sdx-badge--${b.tone || 'neutral'}"${idAttr}${hiddenAttr}>${dot}${b.text || ''}</span>`;
                    };

                    const rowHtml = (it) => {
                        const active = isActive(it.route);
                        const iconIdAttr = it.iconId ? (it.iconId === 'drawer-notif-bell-icon' ? ' id="drawer-notif-bell-icon"' : ` id="${it.iconId}"`) : '';
                        return `
                            <button type="button" class="sdx-row${active ? ' is-active' : ''}" style="--ic:${it.color};" onclick="${it.action}"${active ? ' aria-current="page"' : ''}>
                                <span class="sdx-row-icon" aria-hidden="true"><i class="${it.icon}"${iconIdAttr}></i></span>
                                <span class="sdx-row-text">
                                    <span class="sdx-row-title">${it.title}</span>
                                    <span class="sdx-row-desc">${it.desc}</span>
                                </span>
                                ${badgeHtml(it.badge)}
                                <i class="fas fa-chevron-right sdx-row-chevron" aria-hidden="true"></i>
                            </button>`;
                    };

                    const sectionHtml = (s) => `
                        <section class="sdx-section" style="--acc:${s.color};" aria-labelledby="sdx-h-${s.id}">
                            <header class="sdx-section-head">
                                <span class="sdx-section-icon" aria-hidden="true"><i class="${s.icon}"></i></span>
                                <div class="sdx-section-head-text">
                                    <h3 class="sdx-section-title" id="sdx-h-${s.id}">${s.title}</h3>
                                    <p class="sdx-section-hint">${s.hint}</p>
                                </div>
                            </header>
                            <div class="sdx-group">${s.items.map(rowHtml).join('')}</div>
                        </section>`;

                    // Accesos rápidos (lo que más usa el jugador, a un toque)
                    const quickTiles = [
                        { label: 'Inicio', icon: 'fas fa-house', color: '#00E36D', route: 'dashboard', action: "window.smartNavigate('dashboard', null)" },
                        { label: 'Americanas', icon: 'fas fa-trophy', color: '#FFD700', route: 'americanas', action: "window.smartNavigate('americanas', null)", live: true },
                        { label: 'Ranking', icon: 'fas fa-ranking-star', color: '#fb923c', route: 'ranking', action: "window.smartNavigate('ranking', null)" },
                        { label: 'Chat', icon: 'fas fa-comments', color: '#22d3ee', route: null, action: "window.openCommunityChat()" }
                    ];
                    const quickHtml = quickTiles.map((q) => {
                        const active = isActive(q.route);
                        return `
                            <button type="button" class="sdx-tile${active ? ' is-active' : ''}" style="--ic:${q.color};" onclick="${q.action}"${active ? ' aria-current="page"' : ''}>
                                <span class="sdx-tile-icon" aria-hidden="true"><i class="${q.icon}"></i>${q.live ? '<span class="sdx-live-dot sdx-tile-live"></span>' : ''}</span>
                                <span class="sdx-tile-label">${q.label}</span>
                            </button>`;
                    }).join('');

                    // Secciones agrupadas por intención del jugador
                    const sections = [
                        {
                            id: 'jugar', title: 'Jugar', hint: 'Apúntate, entrena y compite', color: '#CCFF00', icon: 'fas fa-table-tennis-paddle-ball',
                            items: [
                                { title: 'Americanas en vivo', desc: 'Pistas y juego en directo', icon: 'fas fa-trophy', color: '#FFD700', route: 'americanas', action: "window.smartNavigate('americanas', null)", badge: { text: 'LIVE', tone: 'live', live: true } },
                                { title: 'Inscripciones', desc: 'Reserva tu plaza de temporada', icon: 'fas fa-pen-to-square', color: '#34d399', route: 'inscriptions', action: "window.smartNavigate('inscriptions', null)", badge: isCampaignActive ? { text: 'ABIERTA', tone: 'success' } : null },
                                { title: 'Entrenos & Clínics', desc: 'Mejora con entrenadores', icon: 'fas fa-dumbbell', color: '#fb7185', route: 'entrenos', action: "window.smartNavigate('entrenos', null)" },
                                { title: 'Torneos oficiales', desc: 'Cuadros y eliminatorias', icon: 'fas fa-sitemap', color: '#f472b6', route: 'tournaments', action: "window.smartNavigate('tournaments', null)" },
                                { title: 'Mis partidos', desc: 'Tu agenda: horarios y pistas', icon: 'fas fa-calendar-days', color: '#00D2FF', route: 'agenda', action: "window.smartNavigate('agenda', null)" }
                            ]
                        },
                        {
                            id: 'progreso', title: 'Mi progreso', hint: 'Cómo vas y dónde estás', color: '#00D2FF', icon: 'fas fa-chart-line',
                            items: [
                                { title: 'Mis estadísticas', desc: 'Victorias, juegos y nivel', icon: 'fas fa-chart-simple', color: '#CCFF00', route: 'results', action: "window.smartNavigate('results', null)" },
                                { title: 'Ranking del club', desc: 'Tu posición frente al resto', icon: 'fas fa-ranking-star', color: '#fb923c', route: 'ranking', action: "window.smartNavigate('ranking', null)" },
                                { title: 'Historial & resultados', desc: 'Americanas ya finalizadas', icon: 'fas fa-flag-checkered', color: '#94a3b8', route: 'finished_americanas', action: "window.smartNavigate('finished_americanas', null)" },
                                { title: 'Hall of Fame', desc: 'Récords de temporada', icon: 'fas fa-award', color: '#f59e0b', route: 'records', action: "window.smartNavigate('records', null)", badge: { text: 'TOP', tone: 'gold' } },
                                { title: 'Logros & Misiones', desc: 'Retos y niveles', icon: 'fas fa-medal', color: '#fbbf24', route: null, action: "window.smartNavigate('profile', 'achievements')" }
                            ]
                        },
                        {
                            id: 'club', title: 'Club & comunidad', hint: 'Tu gente, tu equipo y tus avisos', color: '#ff8c00', icon: 'fas fa-people-group',
                            items: [
                                { title: 'Notificaciones', desc: 'Avisos de partidos y club', icon: 'fas fa-bell', iconId: 'drawer-notif-bell-icon', color: '#ef4444', route: null, action: "window.closeDrawer(); window.PlayerView?.haptic?.(15); window.NotificationUi && window.NotificationUi.open();", badge: { id: 'drawer-notif-badge', tone: 'danger', hidden: true } },
                                { title: 'Chat del club', desc: 'Comunidad y quedadas', icon: 'fas fa-comments', color: '#22d3ee', route: null, action: "window.openCommunityChat()", badge: { text: 'LIVE', tone: 'live', live: true } },
                                { title: 'Inicio comunidad', desc: 'Novedades y actividad', icon: 'fas fa-newspaper', color: '#ff8c00', route: 'comunidad', action: "window.smartNavigate('comunidad', null)" },
                                { title: 'Equipos del club', desc: 'Plantillas, capitanes y ligas', icon: 'fas fa-users', color: '#60a5fa', route: 'teams', action: "window.smartNavigate('teams', null)" },
                                { title: 'Mi equipo', desc: 'Convocatorias y compañeros', icon: 'fas fa-shield-halved', color: '#CCFF00', route: 'my_team', action: "window.smartNavigate('my_team', null)" },
                                { title: 'Tienda SomosPadel', desc: 'Material y ventajas de club', icon: 'fas fa-store', color: '#10B981', route: 'tienda', action: "window.smartNavigate('tienda', null)", badge: { text: 'ONLINE', tone: 'success' } }
                            ]
                        },
                        {
                            id: 'perfil', title: 'Mi perfil', hint: 'Tu ficha de jugador', color: '#c084fc', icon: 'fas fa-user',
                            items: [
                                { title: 'Perfil de jugador', desc: 'Datos, foto y nivel', icon: 'fas fa-id-badge', color: '#c084fc', route: 'profile', action: "window.smartNavigate('profile', null)" },
                                { title: 'Ficha & Atributos', desc: 'Tus fortalezas en pista', icon: 'fas fa-user-astronaut', color: '#3b82f6', route: null, action: "window.smartNavigate('profile', 'attributes')" },
                                { title: 'Carta de Jugador FUT', desc: 'Compártela en stories', icon: 'fas fa-id-card', color: '#fbbf24', route: null, action: "window.closeDrawer(); window.PadelFutCard && window.PadelFutCard.open()", badge: { text: '9:16', tone: 'pink' } }
                            ]
                        },
                        {
                            id: 'ayuda', title: 'Ayuda & reglas', hint: '¿Dudas? Aquí está todo explicado', color: '#38bdf8', icon: 'fas fa-circle-question',
                            items: [
                                { title: 'Normativa de juego', desc: 'Cómo funciona una americana', icon: 'fas fa-book-open', color: '#c084fc', route: null, action: "window.showAmericanasRulesModal()" },
                                { title: 'Modos de juego', desc: 'Pareja fija, Twister, Suizo…', icon: 'fas fa-gamepad', color: '#CCFF00', route: null, action: "window.closeDrawer(); window.showGameModesModal ? window.showGameModesModal() : null" },
                                { title: 'Sistema de puntos', desc: 'Cómo se suman puntos al ranking', icon: 'fas fa-scale-balanced', color: '#a3e635', route: null, action: "window.closeDrawer(); window.showPointsPolicyModal ? window.showPointsPolicyModal() : null" },
                                { title: 'Marcador de pista', desc: 'Lleva el tanteo desde el móvil', icon: 'fas fa-calculator', color: '#38bdf8', route: null, action: "window.closeDrawer(); window.CourtScoreboard && window.CourtScoreboard.open()" },
                                { title: 'Clima & estado de pistas', desc: '¿Se puede jugar hoy?', icon: 'fas fa-cloud-sun', color: '#0ea5e9', route: 'clima', action: "window.smartNavigate('clima', null)" }
                            ]
                        }
                    ];

                    const staffLabel = isSuperAdmin ? 'SUPER ADMIN' : (isCaptain ? 'CAPITÁN' : 'ADMIN');

                    menuContainer.innerHTML = `
                        <!-- TOP BAR FIJA -->
                        <div class="drawer-top-bar sdx-topbar">
                            <button type="button" class="sdx-brand" onclick="window.smartNavigate('dashboard', null)" aria-label="Ir al inicio de SomosPadel">
                                <img src="img/logo_somospadel.png" alt="" class="sdx-brand-logo">
                                <span class="sdx-brand-text">
                                    <span class="sdx-brand-title">SOMOSPADEL</span>
                                    <span class="sdx-brand-sub">BARCELONA PRO</span>
                                </span>
                            </button>
                            <button type="button" class="sdx-icon-btn" aria-label="Cerrar menú" title="Cerrar menú" onclick="window.closeDrawer()">
                                <i class="fas fa-xmark" aria-hidden="true"></i>
                            </button>
                        </div>

                        <!-- CONTENIDO SCROLLABLE -->
                        <nav class="drawer-scroll-body sdx-body" aria-label="Menú principal">
                            ${currentUser ? `
                            <!-- TARJETA DEL JUGADOR -->
                            <div class="sdx-player">
                                <button type="button" class="sdx-player-top" onclick="window.smartNavigate('profile', null)" aria-label="Ver mi perfil: ${safeName}">
                                    <span class="sdx-avatar-wrap">
                                        <span class="sdx-avatar">${avatarContent}</span>
                                    </span>
                                    <span class="sdx-player-meta">
                                        <span class="sdx-player-name">${safeName}</span>
                                        <span class="sdx-player-role">${roleBadge}</span>
                                    </span>
                                    <span class="sdx-player-cta" title="Ver mi perfil"><i class="fas fa-chevron-right" aria-hidden="true"></i></span>
                                </button>
                                <div class="sdx-stats" role="list">
                                    <div class="sdx-stat" role="listitem" style="--ic:#CCFF00;">
                                        <span class="sdx-stat-val"><i class="fas fa-signal" aria-hidden="true"></i> ${level}</span>
                                        <span class="sdx-stat-lbl">Nivel</span>
                                    </div>
                                    <div class="sdx-stat" role="listitem" style="--ic:#fb923c;">
                                        <span class="sdx-stat-val"><i class="fas fa-fire" aria-hidden="true"></i> ${streak}</span>
                                        <span class="sdx-stat-lbl">Racha</span>
                                    </div>
                                    <div class="sdx-stat" role="listitem" style="--ic:#38bdf8;">
                                        <span class="sdx-stat-val"><i class="fas fa-table-tennis-paddle-ball" aria-hidden="true"></i> ${matches}</span>
                                        <span class="sdx-stat-lbl">Partidos</span>
                                    </div>
                                </div>
                            </div>
                            ` : `
                            <!-- TARJETA INVITADO -->
                            <div class="sdx-player sdx-guest">
                                <div class="sdx-guest-head">
                                    <span class="sdx-guest-icon" aria-hidden="true"><i class="fas fa-user"></i></span>
                                    <span>
                                        <span class="sdx-guest-title">Bienvenido a SomosPadel</span>
                                        <span class="sdx-guest-sub">Inicia sesión para apuntarte y guardar tus resultados</span>
                                    </span>
                                </div>
                                <button type="button" class="sdx-btn sdx-btn--primary" onclick="window.closeDrawer(); const m = document.getElementById('auth-modal'); if(m){ m.classList.remove('hidden'); m.style.setProperty('display','flex','important'); }">
                                    <i class="fas fa-arrow-right-to-bracket" aria-hidden="true"></i> Iniciar sesión / Registro
                                </button>
                            </div>
                            `}

                            <!-- ACCESOS RÁPIDOS -->
                            <div class="sdx-quick" aria-label="Accesos rápidos">${quickHtml}</div>

                            ${sections.map(sectionHtml).join('')}

                            <!-- SÍGUENOS -->
                            <section class="sdx-section" style="--acc:#25d366;" aria-labelledby="sdx-h-social">
                                <header class="sdx-section-head">
                                    <span class="sdx-section-icon" aria-hidden="true"><i class="fas fa-share-nodes"></i></span>
                                    <div class="sdx-section-head-text">
                                        <h3 class="sdx-section-title" id="sdx-h-social">Contacto & redes</h3>
                                        <p class="sdx-section-hint">Escríbenos o síguenos</p>
                                    </div>
                                </header>
                                <div class="sdx-social">
                                    <button type="button" class="sdx-social-btn" style="--ic:#25d366;" onclick="window.openClubWhatsApp()"><i class="fab fa-whatsapp" aria-hidden="true"></i><span>WhatsApp</span></button>
                                    <button type="button" class="sdx-social-btn" style="--ic:#e1306c;" onclick="window.openClubInstagram()"><i class="fab fa-instagram" aria-hidden="true"></i><span>Instagram</span></button>
                                    <button type="button" class="sdx-social-btn" style="--ic:#1877f2;" onclick="window.openClubFacebook()"><i class="fab fa-facebook-f" aria-hidden="true"></i><span>Facebook</span></button>
                                </div>
                            </section>

                            ${isStaffOrCaptain ? `
                            <!-- ZONA STAFF (solo admins y capitanes) -->
                            <section class="sdx-staff" aria-labelledby="sdx-h-staff">
                                <div class="sdx-staff-head">
                                    <h3 id="sdx-h-staff"><i class="fas fa-shield-halved" aria-hidden="true"></i> Zona staff</h3>
                                    <span class="sdx-badge sdx-badge--gold">${staffLabel}</span>
                                </div>
                                <p class="sdx-staff-desc">Actas, torneos, equipos y gestión del club.</p>
                                <button type="button" class="sdx-btn sdx-btn--gold" onclick="window.closeDrawer(); window.location.href='admin.html'">
                                    <i class="fas fa-user-shield" aria-hidden="true"></i> Panel de control
                                </button>
                                ${isAdmin ? `
                                <button type="button" class="sdx-btn sdx-btn--ghost" onclick="window.closeDrawer(); window.location.href='organizacion.html'">
                                    <i class="fas fa-chart-pie" aria-hidden="true"></i> Organización SomosPadel BCN (ERP)
                                </button>` : ''}
                            </section>
                            ` : ''}

                            <!-- FOOTER: SESIÓN Y VERSIÓN -->
                            <div class="sdx-footer">
                                <button type="button" class="sdx-btn sdx-btn--ghost" onclick="window.forceUpdateApp ? window.forceUpdateApp() : window.location.reload(true)">
                                    <i class="fas fa-rotate" aria-hidden="true"></i> Actualizar app
                                </button>
                                ${currentUser ? `
                                <button type="button" class="sdx-btn sdx-btn--danger" onclick="window.closeDrawer(); window.AuthController && window.AuthController.handleLogout ? window.AuthController.handleLogout() : null;">
                                    <i class="fas fa-power-off" aria-hidden="true"></i> Cerrar sesión
                                </button>
                                ` : ''}
                                ${!isStaffOrCaptain ? `
                                <button type="button" class="sdx-link" onclick="window.closeDrawer(); window.location.href='admin-login.html'">
                                    <i class="fas fa-key" aria-hidden="true"></i> Acceso staff & capitanes
                                </button>` : ''}
                                <div class="sdx-version">
                                    <span class="sdx-online" aria-hidden="true"></span>
                                    <span>SomosPadel v3.0 • Barcelona</span>
                                </div>
                            </div>
                        </nav>
                    `;

                    // Sincronizar badge de notificaciones en el drawer recién renderizado
                    if (window.NotificationUi && typeof window.NotificationUi.updateBadge === 'function') {
                        window.NotificationUi.updateBadge();
                    }
                }

                // B. Render Bottom Dock (Index Navigation) - Solo si aún no existe en el DOM
                if (dockContainer) {
                    if (!dockContainer.querySelector('.nav-dock')) {
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
                    }
                    // Re-trigger visual active state update from Router
                    if (window.Router) window.Router.updateNavUI(window.Router.currentRoute);
                }

            } catch (err) {
                console.error("Error loading navigation:", err);
            }
        }

        handleGuest() {
            this.updateGlobalHeader(null);
            this.loadSideMenu();

            // Telemetría de acceso para visitante / invitado
            this.recordAccessTelemetry(null);

            const authModal = document.getElementById('auth-modal');
            if (authModal) {
                authModal.classList.remove('hidden');
                authModal.style.setProperty('display', 'flex', 'important');
            }

            const appShell = document.getElementById('app-shell');
            if (appShell) appShell.classList.add('hidden');
        }

        /**
         * Telemetría avanzada de red, geolocalización, adquisición y auditoría de accesos.
         * Registra tanto usuarios autenticados como visitantes con control de 30 min de ventana.
         */
        async recordAccessTelemetry(user = null) {
            try {
                // Esperar a que Firestore DB esté disponible con timeout
                if (!window.db) {
                    let retries = 0;
                    while (!window.db && retries < 20) {
                        await new Promise(r => setTimeout(r, 100));
                        retries++;
                    }
                }
                if (!window.db || typeof firebase === 'undefined' || !firebase.firestore) return;

                const isAuth = !!(user && user.uid);
                
                // Visitor ID persistente para invitados/visitantes
                let visitorId = localStorage.getItem('somospadel_visitor_id');
                if (!visitorId) {
                    visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
                    localStorage.setItem('somospadel_visitor_id', visitorId);
                }

                const currentEntityId = isAuth ? user.uid : visitorId;

                // Control de spam: ventana de 30 minutos o por sesión de pestaña
                const now = Date.now();
                const lastSessionTime = parseInt(localStorage.getItem('somospadel_last_session_time') || '0', 10);
                const lastSessionEntity = localStorage.getItem('somospadel_last_session_entity') || '';
                const hasSessionMark = sessionStorage.getItem('somospadel_session_logged') === 'true';

                const isWithin30Min = (now - lastSessionTime) < (30 * 60 * 1000);
                const isSameEntity = (lastSessionEntity === currentEntityId);

                // Si ya se registró en esta sesión y no ha expirado la ventana de 30m para la misma entidad
                if (hasSessionMark && isSameEntity && isWithin30Min) {
                    if (isAuth) {
                        window.db.collection('players').doc(user.uid).update({
                            lastLogin: new Date().toISOString()
                        }).catch(() => {});
                    }
                    return;
                }

                // Fijar marcas de sesión activas
                sessionStorage.setItem('somospadel_session_logged', 'true');
                localStorage.setItem('somospadel_last_session_time', now.toString());
                localStorage.setItem('somospadel_last_session_entity', currentEntityId);

                // 1. Detección Geográfica segura con fallback y timeout de 1200ms
                let geo = { city: 'Barcelona', region: 'Catalunya', country: 'España', countryCode: 'ES' };
                try {
                    const cachedGeo = sessionStorage.getItem('somospadel_geo_cache');
                    if (cachedGeo) {
                        geo = JSON.parse(cachedGeo);
                    } else {
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 1200);
                        const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
                        clearTimeout(timeoutId);
                        if (res.ok) {
                            const data = await res.json();
                            if (data && (data.city || data.country_name)) {
                                geo = {
                                    city: data.city || 'Barcelona',
                                    region: data.region || 'Catalunya',
                                    country: data.country_name || 'España',
                                    countryCode: data.country_code || 'ES'
                                };
                                sessionStorage.setItem('somospadel_geo_cache', JSON.stringify(geo));
                            }
                        }
                    }
                } catch (geoErr) {
                    // Fallback silencioso y seguro
                }

                // 2. Detección de Dispositivo, Sistema Operativo y Navegador
                const ua = navigator.userAgent || '';
                const isMob = /Mobi|Android|iPhone|iPad|iPod/i.test(ua);
                
                let os = 'Desconocido';
                if (/iPhone/i.test(ua)) os = 'iOS (iPhone)';
                else if (/iPad/i.test(ua)) os = 'iOS (iPad)';
                else if (/Android/i.test(ua)) os = 'Android';
                else if (/Windows NT 10/i.test(ua) || /Windows NT 11/i.test(ua)) os = 'Windows 10/11';
                else if (/Windows NT/i.test(ua)) os = 'Windows PC';
                else if (/Macintosh|Mac OS X/i.test(ua)) os = 'Mac OS';
                else if (/Linux/i.test(ua)) os = 'Linux';

                let browser = 'Web Browser';
                if (/Instagram/i.test(ua)) browser = 'Instagram WebView';
                else if (/WhatsApp/i.test(ua)) browser = 'WhatsApp WebView';
                else if (/Edg\//i.test(ua)) browser = 'Microsoft Edge';
                else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) browser = 'Google Chrome';
                else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = 'Apple Safari';
                else if (/Firefox\//i.test(ua)) browser = 'Mozilla Firefox';
                else if (/SamsungBrowser/i.test(ua)) browser = 'Samsung Internet';

                // 3. Detección de Canal de Procedencia (Origin / Referrer)
                const ref = (document.referrer || '').toLowerCase();
                const urlParams = new URLSearchParams(window.location.search);
                const utmSource = (urlParams.get('utm_source') || '').toLowerCase();
                const utmMedium = (urlParams.get('utm_medium') || '').toLowerCase();

                let origin = 'Directo / App';
                if ((window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone) {
                    origin = 'PWA Instalada';
                } else if (utmSource.includes('whatsapp') || utmMedium.includes('whatsapp') || ref.includes('whatsapp') || ref.includes('wa.me')) {
                    origin = 'WhatsApp';
                } else if (utmSource.includes('instagram') || ref.includes('instagram.com') || browser.includes('Instagram')) {
                    origin = 'Instagram';
                } else if (utmSource.includes('google') || ref.includes('google.')) {
                    origin = 'Google Search';
                } else if (utmSource.includes('facebook') || ref.includes('facebook.com')) {
                    origin = 'Facebook';
                } else if (ref && !ref.includes(window.location.hostname)) {
                    try {
                        origin = new URL(ref).hostname.replace(/^www\./, '');
                    } catch (e) {
                        origin = 'Enlace Externo';
                    }
                }

                // 4. Obtener estadísticas / nivel si están disponibles
                const playerStats = window.Store ? window.Store.getState('playerStats') : null;
                const level = user?.level || user?.self_rate_level || playerStats?.level || null;
                const phone = user?.phone || user?.phoneNumber || '';

                // 5. Estructura de documento de telemetría completa
                const telemetryData = {
                    userId: currentEntityId,
                    userName: isAuth ? (user.name || user.displayName || "Jugador Pro") : "Visitante Anónimo",
                    userPhone: phone,
                    role: isAuth ? (user.role || 'player') : 'guest',
                    level: level,
                    isRegistered: isAuth,
                    device: isMob ? 'Mobile' : 'Desktop',
                    os: os,
                    browser: browser,
                    origin: origin,
                    city: geo.city,
                    region: geo.region,
                    country: geo.country,
                    countryCode: geo.countryCode,
                    language: navigator.language || 'es',
                    appVersion: 'v9.1-Premium',
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                };

                // Guardar en colección Firestore 'access_logs'
                window.db.collection('access_logs').add(telemetryData)
                    .then(() => console.log(`📡 [TELEMETRÍA] Acceso registrado (${telemetryData.role}): ${telemetryData.userName} [${telemetryData.city} | ${telemetryData.origin}]`))
                    .catch(e => console.warn("⏳ [App] Telemetría omitida por red lenta o bloqueador:", e));

                // Si es usuario autenticado, actualizar perfil en tiempo real
                if (isAuth) {
                    window.db.collection('players').doc(user.uid).update({
                        lastLogin: new Date().toISOString(),
                        lastActive: firebase.firestore.FieldValue.serverTimestamp(),
                        sessionCount: firebase.firestore.FieldValue.increment(1)
                    }).catch(() => {});
                }
            } catch (err) {
                console.warn("⏳ [App] Telemetría omitida o error seguro:", err);
            }
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
            const roleBadge = document.querySelector('.user-dropdown-role-badge');

            const stats = window.Store ? window.Store.getState('playerStats') : null;

            if (headerName) {
                const rawName = user ? (user.name || user.displayName || "Jugador") : "Invitado";
                const roleIcon = user?.role === 'super_admin' ? ' 👑' : '';
                const parts = rawName.trim().split(/\s+/);
                const display = parts.length > 1 ? `${parts[0]} ${parts[1]}` : parts[0];
                headerName.innerHTML = `${display.toUpperCase()}${roleIcon}`;
                headerName.title = rawName;
            }

            if (roleBadge) {
                if (!user) {
                    roleBadge.innerText = 'INVITADO';
                } else if (user.role === 'super_admin') {
                    roleBadge.innerText = 'SUPER ADMIN';
                } else if (user.role === 'admin') {
                    roleBadge.innerText = 'ADMINISTRADOR';
                } else {
                    roleBadge.innerText = 'EXECUTIVE PLAYER';
                }
            }

            const parsedLevel = (user && user.level !== undefined && user.level !== null && user.level !== '') 
                ? parseFloat(user.level) 
                : 3.5;
            const safeLevel = Number.isFinite(parsedLevel) ? parsedLevel : 3.5;
            const level = user ? safeLevel.toFixed(2) : "--";
            if (headerLevel) headerLevel.innerText = level;
            
            const headerLevelMenu = document.getElementById('header-user-level-menu');
            if (headerLevelMenu) headerLevelMenu.innerText = `LVL ${level}`;

            // Barra de Progreso de Nivel Dinámica (Gamificación de Nivel de Pádel)
            const levelProgressBar = document.getElementById('header-level-progress-bar');
            const levelProgressCurrent = document.getElementById('header-level-progress-current');
            const levelProgressNext = document.getElementById('header-level-progress-next');

            if (levelProgressBar) {
                if (!user) {
                    levelProgressBar.style.width = '0%';
                    if (levelProgressCurrent) levelProgressCurrent.innerText = 'Nivel --';
                    if (levelProgressNext) levelProgressNext.innerText = 'Siguiente: --';
                } else {
                    const currentLevel = safeLevel;
                    const prevMilestone = Math.floor(currentLevel * 2) / 2;
                    const nextMilestone = (Math.floor(currentLevel * 2) + 1) / 2;
                    const range = nextMilestone - prevMilestone;
                    const rawPercent = (Number.isFinite(range) && range > 0) ? ((currentLevel - prevMilestone) / range) * 100 : 0;
                    const percent = Math.min(100, Math.max(6, Math.round(Number.isFinite(rawPercent) ? rawPercent : 0)));

                    levelProgressBar.style.width = `${percent}%`;
                    if (levelProgressCurrent) levelProgressCurrent.innerText = `Nivel ${currentLevel.toFixed(2)}`;
                    if (levelProgressNext) levelProgressNext.innerText = `Siguiente: ${nextMilestone.toFixed(2)}`;
                }
            }

            if (headerStreak) {
                const streak = user ? (user.streak || 0) : 0;
                headerStreak.innerText = `🔥 ${streak}`;
            }

            if (headerRank) {
                const rank = user?.ranking_pos;
                headerRank.innerText = (rank && rank !== '--') ? `🏆 #${rank}` : '🏆 --';
            }

            if (headerMatches) {
                const matches = (stats?.stats?.matches !== undefined && stats?.stats?.matches !== null && Number(stats?.stats?.matches) > 0)
                    ? stats.stats.matches
                    : (user ? (user.matches_played ?? user.total_matches ?? 0) : 0);
                headerMatches.innerText = `🎾 ${matches}`;
            }

            if (headerWinRate) {
                const wr = (stats?.stats?.winRate !== undefined && stats?.stats?.winRate !== null)
                    ? stats.stats.winRate
                    : ((user?.win_rate !== undefined && user?.win_rate !== null) ? user.win_rate : "--");
                headerWinRate.innerText = (wr !== "--" && wr !== undefined) ? `${wr}%` : "--";
            }

            const updateAvatar = (el) => {
                if (!el) return;
                const rawName = user ? (user.name || user.displayName || "J") : "I";
                const initials = rawName.trim().substring(0, 2).toUpperCase();
                if (user && (user.photo_url || user.photoURL)) {
                    const photo = user.photo_url || user.photoURL;
                    el.innerHTML = `<img src="${photo}" alt="${rawName}" onerror="this.parentElement.innerHTML='${initials}'" style="width:100%; height:100%; border-radius:inherit; object-fit:cover;">`;
                } else {
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
    // Blindaje: si algún script inline creó un AppInstance "placeholder" (objeto plano),
    // lo sustituimos por la App real para que el menú lateral y el header funcionen.
    const launchApp = () => {
        if (!(window.AppInstance instanceof App)) window.AppInstance = new App();
    };
    if (window.AppInit && window.AppInit.initialized) {
        console.log("🎾 [App] AppInit already initialized. Launching Core App immediately...");
        launchApp();
    } else {
        document.addEventListener('AppReady', () => {
            console.log("🎾 [App] AppReady signal received. Launching Core App...");
            launchApp();
        });
    }
})();
