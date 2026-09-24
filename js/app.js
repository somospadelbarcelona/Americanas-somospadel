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

                // 1. Navegar a la ruta base
                if (window.Router) {
                    if (targetRoute === 'dashboard') {
                        window.Router.navigate('dashboard', false, true);
                    } else {
                        window.Router.navigate(targetRoute);
                    }
                }

                // 2. Controlar pestañas específicas (ej: Resultados en Americanas)
                if (tab) {
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

            window.showAmericanasRulesModal = function() {
                window.closeDrawer?.();
                window.PlayerView?.haptic?.(20);
                
                let modal = document.getElementById('sp-rules-modal');
                if (!modal) {
                    modal = document.createElement('div');
                    modal.id = 'sp-rules-modal';
                    modal.className = 'sp-rules-modal-overlay';
                    modal.innerHTML = `
                        <div class="sp-rules-modal-box">
                            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:12px;">
                                <div>
                                    <div style="display:flex; align-items:center; gap:8px;">
                                        <span style="font-size:1.4rem;">📜</span>
                                        <h3 style="margin:0; font-size:1.15rem; font-weight:900; color:#ffffff;">Formato & Normativa</h3>
                                    </div>
                                    <div style="font-size:0.65rem; color:#CCFF00; font-weight:800; letter-spacing:1px; margin-top:3px;">AMERICANAS SOMOSPADEL BCN</div>
                                </div>
                                <button onclick="document.getElementById('sp-rules-modal').style.display='none'" style="background:rgba(255,255,255,0.08); border:none; color:#ffffff; width:34px; height:34px; border-radius:12px; cursor:pointer; display:flex; align-items:center; justify-content:center;">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>

                            <div style="display:flex; flex-direction:column; gap:11px; font-size:0.82rem; color:#cbd5e1; line-height:1.45;">
                                <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:14px; padding:12px;">
                                    <div style="font-weight:900; color:#CCFF00; margin-bottom:4px; display:flex; align-items:center; gap:8px;">
                                        <i class="fas fa-stopwatch"></i> 1. Duración & Rondas
                                    </div>
                                    <div>Rondas dinámicas continuas de 16 a 20 minutos (o tanteo pactado a 32 puntos). Al sonar el aviso acústico, se concluye el punto en disputa.</div>
                                </div>

                                <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:14px; padding:12px;">
                                    <div style="font-weight:900; color:#00D2FF; margin-bottom:4px; display:flex; align-items:center; gap:8px;">
                                        <i class="fas fa-shuffle"></i> 2. Rotación de Pistas y Parejas
                                    </div>
                                    <div>Ascensos y descensos automáticos para equilibrar niveles en cada ronda y garantizar partidas reñidas.</div>
                                </div>

                                <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:14px; padding:12px;">
                                    <div style="font-weight:900; color:#fbbf24; margin-bottom:4px; display:flex; align-items:center; gap:8px;">
                                        <i class="fas fa-calculator"></i> 3. Puntuación Individual
                                    </div>
                                    <div>Cada jugador suma sus juegos ganados. El diferencial de juegos totales (+/-) define el podio de la americana.</div>
                                </div>

                                <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:14px; padding:12px;">
                                    <div style="font-weight:900; color:#10b981; margin-bottom:4px; display:flex; align-items:center; gap:8px;">
                                        <i class="fas fa-mobile-screen-button"></i> 4. Marcadores en Directo
                                    </div>
                                    <div>Sube el resultado de tu pista en la App al terminar cada ronda para actualizar el ranking en tiempo real.</div>
                                </div>

                                <div style="background:rgba(204,255,0,0.06); border:1px solid rgba(204,255,0,0.25); border-radius:14px; padding:12px; text-align:center;">
                                    <span style="font-weight:900; color:#CCFF00; font-size:0.85rem;">🤝 Fair Play & Tercer Tiempo</span>
                                    <div style="font-size:0.75rem; color:#94a3b8; margin-top:3px;">La deportividad, el respeto y la convivencia son el ADN de SomosPadel BCN.</div>
                                </div>
                            </div>

                            <button onclick="document.getElementById('sp-rules-modal').style.display='none'" style="margin-top:16px; width:100%; background:#CCFF00; color:#000000; border:none; padding:13px; border-radius:14px; font-weight:900; font-size:0.85rem; cursor:pointer; box-shadow:0 4px 15px rgba(204,255,0,0.3); transition:all 0.2s;">
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
                        background: rgba(3, 7, 18, 0.88); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
                        display: flex; align-items: center; justify-content: center;
                        padding: 16px; box-sizing: border-box; font-family: 'Outfit', -apple-system, sans-serif;
                        animation: spModesFadeIn 0.25s ease-out;
                    `;

                    modal.innerHTML = `
                        <style>
                            @keyframes spModesFadeIn { from { opacity: 0; } to { opacity: 1; } }
                            @keyframes spModesSlideUp { from { transform: translateY(22px) scale(0.97); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
                            
                            .sp-modes-modal-box {
                                background: linear-gradient(150deg, #0f172a 0%, #030712 100%);
                                border: 1.5px solid rgba(204, 255, 0, 0.35);
                                border-radius: 24px;
                                width: 100%;
                                max-width: 660px;
                                height: 92vh;
                                max-height: 840px;
                                display: flex;
                                flex-direction: column;
                                overflow: hidden;
                                box-shadow: 0 25px 60px rgba(0,0,0,0.85), 0 0 35px rgba(204,255,0,0.15);
                                animation: spModesSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                                box-sizing: border-box;
                            }
                            @media (max-width: 480px) {
                                .sp-modes-modal-box {
                                    max-height: 94vh;
                                    border-radius: 20px;
                                }
                            }

                            .sp-modes-tabs-bar {
                                padding: 8px 12px;
                                background: rgba(0,0,0,0.4);
                                border-bottom: 1px solid rgba(255,255,255,0.08);
                                display: grid;
                                grid-template-columns: repeat(4, 1fr);
                                gap: 6px;
                                flex-shrink: 0;
                            }
                            @media (max-width: 480px) {
                                .sp-modes-tabs-bar {
                                    display: flex;
                                    overflow-x: auto;
                                    scrollbar-width: none;
                                    -ms-overflow-style: none;
                                    padding: 8px 10px;
                                    gap: 5px;
                                }
                                .sp-modes-tabs-bar::-webkit-scrollbar {
                                    display: none;
                                }
                            }

                            .sp-modes-tab-btn {
                                flex: 1 1 0;
                                min-width: 0;
                                padding: 8px 4px;
                                border-radius: 12px;
                                border: 1.5px solid transparent;
                                font-size: 0.72rem;
                                font-weight: 850;
                                cursor: pointer;
                                transition: all 0.2s ease;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                gap: 5px;
                                color: #94a3b8;
                                background: rgba(255, 255, 255, 0.04);
                                white-space: nowrap;
                                text-overflow: ellipsis;
                            }
                            @media (max-width: 480px) {
                                .sp-modes-tab-btn {
                                    flex: 1 0 auto;
                                    min-width: 82px;
                                    padding: 8px 10px;
                                    font-size: 0.7rem;
                                }
                            }
                            .sp-modes-tab-btn.active-pareja {
                                background: rgba(56, 189, 248, 0.15);
                                border-color: #38bdf8;
                                color: #38bdf8;
                                box-shadow: 0 4px 16px rgba(56, 189, 248, 0.25);
                            }
                            .sp-modes-tab-btn.active-twister {
                                background: rgba(236, 72, 153, 0.15);
                                border-color: #ec4899;
                                color: #ec4899;
                                box-shadow: 0 4px 16px rgba(236, 72, 153, 0.25);
                            }
                            .sp-modes-tab-btn.active-suizo {
                                background: rgba(239, 68, 68, 0.15);
                                border-color: #ef4444;
                                color: #ef4444;
                                box-shadow: 0 4px 16px rgba(239, 68, 68, 0.25);
                            }
                            .sp-modes-tab-btn.active-comparativa {
                                background: rgba(204, 255, 0, 0.15);
                                border-color: #CCFF00;
                                color: #CCFF00;
                                box-shadow: 0 4px 16px rgba(204, 255, 0, 0.25);
                            }

                            .sp-modes-scroll-body {
                                flex: 1 1 auto;
                                min-height: 0;
                                overflow-y: auto;
                                padding: 16px 16px 36px;
                                display: flex;
                                flex-direction: column;
                                gap: 14px;
                                -webkit-overflow-scrolling: touch;
                            }
                            .sp-modes-scroll-body::-webkit-scrollbar { width: 6px; }
                            .sp-modes-scroll-body::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
                            .sp-modes-scroll-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 10px; }

                            /* Tabla comparativa responsive */
                            .sp-comp-table {
                                width: 100%;
                                border-collapse: separate;
                                border-spacing: 0;
                                font-size: 0.74rem;
                                text-align: left;
                                table-layout: fixed;
                            }
                            .sp-comp-table th, .sp-comp-table td {
                                padding: 10px 8px;
                                vertical-align: middle;
                                word-wrap: break-word;
                                overflow-wrap: break-word;
                            }
                            @media (max-width: 540px) {
                                .sp-comp-table th, .sp-comp-table td {
                                    padding: 8px 4px;
                                    font-size: 0.67rem;
                                }
                            }

                            .sp-modes-footer {
                                padding: 12px 16px;
                                background: rgba(0,0,0,0.65);
                                border-top: 1px solid rgba(255,255,255,0.08);
                                display: flex;
                                flex-wrap: wrap;
                                gap: 8px;
                                justify-content: space-between;
                                align-items: center;
                                flex-shrink: 0;
                            }
                        </style>
                        <div class="sp-modes-modal-box">
                            
                            <!-- Header -->
                            <div style="padding: 16px 20px 12px; background: rgba(255,255,255,0.02); border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;">
                                <div style="display: flex; align-items: center; gap: 12px;">
                                    <div style="width: 40px; height: 40px; border-radius: 13px; background: linear-gradient(135deg, rgba(204, 255, 0, 0.2), rgba(56, 189, 248, 0.2)); border: 1.5px solid #CCFF00; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; box-shadow: 0 0 16px rgba(204, 255, 0, 0.3); flex-shrink: 0;">
                                        🎮
                                    </div>
                                    <div>
                                        <div style="font-size: 0.62rem; font-weight: 900; color: #CCFF00; letter-spacing: 1.2px; text-transform: uppercase;">SOMOSPADEL BARCELONA • GUÍA OFICIAL</div>
                                        <h2 style="margin: 0; font-size: 1.2rem; font-weight: 950; color: #ffffff; letter-spacing: -0.3px;">Modos de Juego</h2>
                                    </div>
                                </div>
                                <button id="sp-modes-close-x" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); color: #ffffff; width: 34px; height: 34px; border-radius: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.2)'; this.style.transform='scale(1.08)';" onmouseout="this.style.background='rgba(255,255,255,0.08)'; this.style.transform='scale(1)';">
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
                            <div class="sp-modes-scroll-body">
                                
                                <!-- CONTENIDO 1: PAREJA FIJA -->
                                <div id="sp-mode-view-pareja" style="display: flex; flex-direction: column; gap: 14px;">
                                    <!-- Badge Cabecera -->
                                    <div style="background: linear-gradient(135deg, rgba(56, 189, 248, 0.15) 0%, rgba(15, 23, 42, 0.6) 100%); border: 1.5px solid rgba(56, 189, 248, 0.4); border-radius: 18px; padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; gap: 10px;">
                                        <div style="display: flex; align-items: center; gap: 12px;">
                                            <div style="width: 44px; height: 44px; border-radius: 14px; background: rgba(56, 189, 248, 0.2); border: 1px solid #38bdf8; display: flex; align-items: center; justify-content: center; font-size: 1.4rem;">
                                                👥
                                            </div>
                                            <div>
                                                <div style="color: #38bdf8; font-size: 0.68rem; font-weight: 900; letter-spacing: 0.8px; text-transform: uppercase;">MODO 1: EN TÁNDEM</div>
                                                <div style="color: #ffffff; font-size: 1.15rem; font-weight: 950;">Pareja Fija</div>
                                            </div>
                                        </div>
                                        <span style="background: rgba(56, 189, 248, 0.2); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.4); font-size: 0.64rem; font-weight: 900; padding: 4px 10px; border-radius: 20px; text-transform: uppercase;">COMPETICIÓN & LIGA</span>
                                    </div>

                                    <!-- Puntos clave Pareja Fija -->
                                    <div style="display: flex; flex-direction: column; gap: 10px;">
                                        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 14px; display: flex; gap: 12px; align-items: flex-start;">
                                            <div style="width: 34px; height: 34px; border-radius: 10px; background: rgba(56, 189, 248, 0.15); color: #38bdf8; display: flex; align-items: center; justify-content: center; font-size: 0.95rem; flex-shrink: 0; border: 1px solid rgba(56,189,248,0.3);">
                                                <i class="fas fa-handshake"></i>
                                            </div>
                                            <div>
                                                <div style="font-weight: 900; color: #ffffff; font-size: 0.88rem; margin-bottom: 3px;">1. Explicación & Inscripción</div>
                                                <div style="color: #cbd5e1; font-size: 0.8rem; line-height: 1.5;">Juegas con tu <strong style="color:#38bdf8;">compañero asignado o elegido</strong> durante todo el evento / torneo. Te inscribes en pareja cerrada o Alex te asigna una pareja de tu nivel exacto.</div>
                                            </div>
                                        </div>

                                        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 14px; display: flex; gap: 12px; align-items: flex-start;">
                                            <div style="width: 34px; height: 34px; border-radius: 10px; background: rgba(204, 255, 0, 0.15); color: #CCFF00; display: flex; align-items: center; justify-content: center; font-size: 0.95rem; flex-shrink: 0; border: 1px solid rgba(204,255,0,0.3);">
                                                <i class="fas fa-arrows-up-down"></i>
                                            </div>
                                            <div>
                                                <div style="font-weight: 900; color: #ffffff; font-size: 0.88rem; margin-bottom: 3px;">2. Rotación & Dinámica de Pistas</div>
                                                <div style="color: #cbd5e1; font-size: 0.8rem; line-height: 1.5;">El tándem nunca se separa: <strong style="color: #CCFF00;">Subís juntos de pista</strong> si ganáis vuestro partido; <strong style="color: #f87171;">bajáis juntos de pista</strong> si perdéis. Se compite por alcanzar y sostener la Pista 1 (Corona).</div>
                                            </div>
                                        </div>

                                        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 14px; display: flex; gap: 12px; align-items: flex-start;">
                                            <div style="width: 34px; height: 34px; border-radius: 10px; background: rgba(251, 191, 36, 0.15); color: #fbbf24; display: flex; align-items: center; justify-content: center; font-size: 0.95rem; flex-shrink: 0; border: 1px solid rgba(251,191,36,0.3);">
                                                <i class="fas fa-calculator"></i>
                                            </div>
                                            <div>
                                                <div style="font-weight: 900; color: #ffffff; font-size: 0.88rem; margin-bottom: 3px;">3. Puntuación & Ranking</div>
                                                <div style="color: #cbd5e1; font-size: 0.8rem; line-height: 1.5;">Los juegos ganados y perdidos computan en <strong style="color:#fbbf24;">tándem</strong> y suman para el podio de la americana y vuestro ranking/ELO oficial de SomosPadel.</div>
                                            </div>
                                        </div>

                                        <div style="background: rgba(56, 189, 248, 0.05); border: 1.5px solid rgba(56, 189, 248, 0.25); border-radius: 16px; padding: 14px; display: flex; gap: 12px; align-items: flex-start;">
                                            <div style="width: 34px; height: 34px; border-radius: 10px; background: rgba(56, 189, 248, 0.2); color: #38bdf8; display: flex; align-items: center; justify-content: center; font-size: 0.95rem; flex-shrink: 0;">
                                                <i class="fas fa-bullseye"></i>
                                            </div>
                                            <div>
                                                <div style="font-weight: 900; color: #38bdf8; font-size: 0.88rem; margin-bottom: 3px;">4. Estrategia & Enfoque</div>
                                                <div style="color: #e2e8f0; font-size: 0.8rem; line-height: 1.5;">Máxima sincronía táctica, compenetración, roles claros (drive y revés definidos) y preparación directa para torneos de competición, ligas federadas o torneos oficiales.</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- CONTENIDO 2: TWISTER INDIVIDUAL -->
                                <div id="sp-mode-view-twister" style="display: none; flex-direction: column; gap: 14px;">
                                    <!-- Badge Cabecera -->
                                    <div style="background: linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, rgba(15, 23, 42, 0.6) 100%); border: 1.5px solid rgba(236, 72, 153, 0.4); border-radius: 18px; padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; gap: 10px;">
                                        <div style="display: flex; align-items: center; gap: 12px;">
                                            <div style="width: 44px; height: 44px; border-radius: 14px; background: rgba(236, 72, 153, 0.2); border: 1px solid #ec4899; display: flex; align-items: center; justify-content: center; font-size: 1.4rem;">
                                                🌪️
                                            </div>
                                            <div>
                                                <div style="color: #ec4899; font-size: 0.68rem; font-weight: 900; letter-spacing: 0.8px; text-transform: uppercase;">MODO 2: ROTACIÓN TOTAL</div>
                                                <div style="color: #ffffff; font-size: 1.15rem; font-weight: 950;">Twister Individual</div>
                                            </div>
                                        </div>
                                        <span style="background: rgba(236, 72, 153, 0.2); color: #ec4899; border: 1px solid rgba(236, 72, 153, 0.4); font-size: 0.64rem; font-weight: 900; padding: 4px 10px; border-radius: 20px; text-transform: uppercase;">SOCIAL & DINÁMICO</span>
                                    </div>

                                    <!-- Puntos clave Twister Individual -->
                                    <div style="display: flex; flex-direction: column; gap: 10px;">
                                        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 14px; display: flex; gap: 12px; align-items: flex-start;">
                                            <div style="width: 34px; height: 34px; border-radius: 10px; background: rgba(236, 72, 153, 0.15); color: #ec4899; display: flex; align-items: center; justify-content: center; font-size: 0.95rem; flex-shrink: 0; border: 1px solid rgba(236,72,153,0.3);">
                                                <i class="fas fa-user-check"></i>
                                            </div>
                                            <div>
                                                <div style="font-weight: 900; color: #ffffff; font-size: 0.88rem; margin-bottom: 3px;">1. Explicación & Inscripción</div>
                                                <div style="color: #cbd5e1; font-size: 0.8rem; line-height: 1.5;">Inscripción individual: <strong style="color:#ec4899;">puedes apuntarte solo</strong> sin necesidad de pareja previa. La plataforma equilibra los grupos y las pistas.</div>
                                            </div>
                                        </div>

                                        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 14px; display: flex; gap: 12px; align-items: flex-start;">
                                            <div style="width: 34px; height: 34px; border-radius: 10px; background: rgba(204, 255, 0, 0.15); color: #CCFF00; display: flex; align-items: center; justify-content: center; font-size: 0.95rem; flex-shrink: 0; border: 1px solid rgba(204,255,0,0.3);">
                                                <i class="fas fa-shuffle"></i>
                                            </div>
                                            <div>
                                                <div style="font-weight: 900; color: #ffffff; font-size: 0.88rem; margin-bottom: 3px;">2. Rotación & Dinámica de Pistas</div>
                                                <div style="color: #cbd5e1; font-size: 0.8rem; line-height: 1.5;">En cada ronda juegas con un compañero diferente. Si ganas tu partido, <strong style="color: #CCFF00;">TÚ subes de pista y cambias de pareja</strong>; si pierdes, <strong style="color: #f87171;">TÚ bajas de pista y cambias de pareja</strong>. ¡Nadie se queda estancado!</div>
                                            </div>
                                        </div>

                                        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 14px; display: flex; gap: 12px; align-items: flex-start;">
                                            <div style="width: 34px; height: 34px; border-radius: 10px; background: rgba(56, 189, 248, 0.15); color: #38bdf8; display: flex; align-items: center; justify-content: center; font-size: 0.95rem; flex-shrink: 0; border: 1px solid rgba(56,189,248,0.3);">
                                                <i class="fas fa-medal"></i>
                                            </div>
                                            <div>
                                                <div style="font-weight: 900; color: #ffffff; font-size: 0.88rem; margin-bottom: 3px;">3. Puntuación & Ranking</div>
                                                <div style="color: #cbd5e1; font-size: 0.8rem; line-height: 1.5;">Cada jugador <strong style="color:#38bdf8;">suma sus propios juegos</strong> en cada pista. Al final del torneo, el podio individual se define por el <strong style="color:#CCFF00;">total de juegos y diferencial personal (+/-)</strong>.</div>
                                            </div>
                                        </div>

                                        <div style="background: rgba(236, 72, 153, 0.05); border: 1.5px solid rgba(236, 72, 153, 0.25); border-radius: 16px; padding: 14px; display: flex; gap: 12px; align-items: flex-start;">
                                            <div style="width: 34px; height: 34px; border-radius: 10px; background: rgba(236, 72, 153, 0.2); color: #ec4899; display: flex; align-items: center; justify-content: center; font-size: 0.95rem; flex-shrink: 0;">
                                                <i class="fas fa-bolt"></i>
                                            </div>
                                            <div>
                                                <div style="font-weight: 900; color: #ec4899; font-size: 0.88rem; margin-bottom: 3px;">4. Estrategia & Enfoque</div>
                                                <div style="color: #e2e8f0; font-size: 0.8rem; line-height: 1.5;">Gran adaptabilidad táctica, versatilidad para desenvolverte tanto en el drive como en el revés, y dinamismo social continuo conociendo a múltiples jugadores del club en una misma tarde.</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- CONTENIDO 3: SUIZO (AMERICANA / ENTRENO SUIZO) -->
                                <div id="sp-mode-view-suizo" style="display: none; flex-direction: column; gap: 14px;">
                                    <!-- Badge Cabecera -->
                                    <div style="background: linear-gradient(135deg, rgba(239, 68, 68, 0.18) 0%, rgba(15, 23, 42, 0.75) 100%); border: 1.5px solid rgba(239, 68, 68, 0.45); border-radius: 18px; padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; gap: 10px;">
                                        <div style="display: flex; align-items: center; gap: 12px;">
                                            <div style="width: 44px; height: 44px; border-radius: 14px; background: rgba(239, 68, 68, 0.2); border: 1.5px solid #ef4444; display: flex; align-items: center; justify-content: center; font-size: 1.4rem;">
                                                <span style="display:inline-flex; align-items:center; justify-content:center; width:26px; height:26px; background:#dc2626; color:#ffffff; border-radius:7px; font-weight:950; font-size:1.1rem; line-height:1; box-shadow:0 2px 8px rgba(220,38,38,0.4);">✚</span>
                                            </div>
                                            <div>
                                                <div style="color: #ef4444; font-size: 0.68rem; font-weight: 900; letter-spacing: 0.8px; text-transform: uppercase;">MODO 3: RANKING & EQUILIBRIO PRO</div>
                                                <div style="color: #ffffff; font-size: 1.15rem; font-weight: 950;">Americana / Entreno Suizo</div>
                                            </div>
                                        </div>
                                        <span style="background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); font-size: 0.64rem; font-weight: 900; padding: 4px 10px; border-radius: 20px; text-transform: uppercase;">6 RONDAS • 2 HORAS</span>
                                    </div>

                                    <!-- Puntos clave Suizo -->
                                    <div style="display: flex; flex-direction: column; gap: 10px;">
                                        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 14px; display: flex; gap: 12px; align-items: flex-start;">
                                            <div style="width: 34px; height: 34px; border-radius: 10px; background: rgba(239, 68, 68, 0.15); color: #ef4444; display: flex; align-items: center; justify-content: center; font-size: 0.95rem; flex-shrink: 0; border: 1px solid rgba(239,68,68,0.3);">
                                                <i class="fas fa-stopwatch"></i>
                                            </div>
                                            <div>
                                                <div style="font-weight: 900; color: #ffffff; font-size: 0.88rem; margin-bottom: 3px;">1. Duración & 6 Rondas Express (2h)</div>
                                                <div style="color: #cbd5e1; font-size: 0.8rem; line-height: 1.5;">Duración total de <strong style="color: #ef4444;">2 horas</strong> (habitualmente 3 pistas, 12 jugadores o proporcional). Se disputan <strong style="color: #CCFF00;">6 rondas express</strong> de juego efectivo para ir perfecto de tiempos. En cuanto suena el silbato de Alex, se acaba el punto en juego de inmediato.</div>
                                            </div>
                                        </div>

                                        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 14px; display: flex; gap: 12px; align-items: flex-start;">
                                            <div style="width: 34px; height: 34px; border-radius: 10px; background: rgba(56, 189, 248, 0.15); color: #38bdf8; display: flex; align-items: center; justify-content: center; font-size: 0.95rem; flex-shrink: 0; border: 1px solid rgba(56,189,248,0.3);">
                                                <i class="fas fa-calculator"></i>
                                            </div>
                                            <div>
                                                <div style="font-weight: 900; color: #ffffff; font-size: 0.88rem; margin-bottom: 3px;">2. Puntuación Individual (Juegos Ganados = Puntos)</div>
                                                <div style="color: #cbd5e1; font-size: 0.8rem; line-height: 1.5;">Formato individual (cambias de pareja en cada ronda). Se contabilizan los <strong style="color: #38bdf8;">juegos totales que consigas en tu partido</strong> como tus puntos personales (ej: si quedas 6-3, tú y tu compañero sumáis 6 puntos cada uno en la tabla; los rivales suman 3).</div>
                                            </div>
                                        </div>

                                        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 14px; display: flex; gap: 12px; align-items: flex-start;">
                                            <div style="width: 34px; height: 34px; border-radius: 10px; background: rgba(204, 255, 0, 0.15); color: #CCFF00; display: flex; align-items: center; justify-content: center; font-size: 0.95rem; flex-shrink: 0; border: 1px solid rgba(204,255,0,0.3);">
                                                <i class="fas fa-layer-group"></i>
                                            </div>
                                            <div>
                                                <div style="font-weight: 900; color: #ffffff; font-size: 0.88rem; margin-bottom: 3px;">3. Sistema Suizo: Reagrupación por Pistas</div>
                                                <div style="color: #cbd5e1; font-size: 0.8rem; line-height: 1.5;">Tras cada ronda se actualiza la tabla con la puntuación acumulada:<br>
                                                    • <strong style="color: #CCFF00;">Pista 1 (Top):</strong> Los 4 clasificados más altos suben a Pista 1.<br>
                                                    • <strong style="color: #38bdf8;">Pista 2 (Medios):</strong> Los 4 siguientes van a Pista 2.<br>
                                                    • <strong style="color: #f87171;">Pista 3 (Bajos):</strong> Los 4 restantes van a Pista 3.
                                                </div>
                                            </div>
                                        </div>

                                        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 14px; display: flex; gap: 12px; align-items: flex-start;">
                                            <div style="width: 34px; height: 34px; border-radius: 10px; background: rgba(168, 85, 247, 0.15); color: #c084fc; display: flex; align-items: center; justify-content: center; font-size: 0.95rem; flex-shrink: 0; border: 1px solid rgba(168,85,247,0.3);">
                                                <i class="fas fa-people-arrows"></i>
                                            </div>
                                            <div>
                                                <div style="font-weight: 900; color: #ffffff; font-size: 0.88rem; margin-bottom: 3px;">4. Compañeros Equilibrados sin Repetición</div>
                                                <div style="color: #cbd5e1; font-size: 0.8rem; line-height: 1.5;">En cada pista se cruzan las parejas para que los partidos sean ultra equilibrados y <strong style="color:#c084fc;">no se repite compañero si es posible</strong> según el historial previo.</div>
                                            </div>
                                        </div>

                                        <div style="background: rgba(239, 68, 68, 0.05); border: 1.5px solid rgba(239, 68, 68, 0.3); border-radius: 16px; padding: 14px; display: flex; gap: 12px; align-items: flex-start;">
                                            <div style="width: 34px; height: 34px; border-radius: 10px; background: rgba(239, 68, 68, 0.2); color: #ef4444; display: flex; align-items: center; justify-content: center; font-size: 0.95rem; flex-shrink: 0;">
                                                <i class="fas fa-trophy"></i>
                                            </div>
                                            <div>
                                                <div style="font-weight: 900; color: #ef4444; font-size: 0.88rem; margin-bottom: 3px;">5. Campeón del Torneo</div>
                                                <div style="color: #e2e8f0; font-size: 0.8rem; line-height: 1.5;">Al finalizar las 6 rondas, el jugador que tenga <strong style="color: #CCFF00;">más juegos sumados en la tabla general</strong> se proclama Campeón oficial del Torneo.</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- CONTENIDO 4: COMPARATIVA RÁPIDA -->
                                <div id="sp-mode-view-comparativa" style="display: none; flex-direction: column; gap: 12px;">
                                    
                                    <!-- TABLA COMPARATIVA FLUIDA (RESPONSIVE EN MÓVIL, TABLET Y PC) -->
                                    <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 10px 8px; overflow: hidden; width: 100%; box-sizing: border-box;">
                                        <table class="sp-comp-table">
                                            <colgroup>
                                                <col style="width: 27%;">
                                                <col style="width: 24%;">
                                                <col style="width: 24%;">
                                                <col style="width: 25%;">
                                            </colgroup>
                                            <thead>
                                                <tr style="border-bottom: 1.5px solid rgba(255,255,255,0.12);">
                                                    <th style="color: #94a3b8; font-weight: 850; font-size: 0.68rem; text-transform: uppercase;">Criterio</th>
                                                    <th style="color: #38bdf8; font-weight: 900; font-size: 0.68rem; text-transform: uppercase;">👥 Fija</th>
                                                    <th style="color: #ec4899; font-weight: 900; font-size: 0.68rem; text-transform: uppercase;">🌪️ Twister</th>
                                                    <th style="color: #ef4444; font-weight: 900; font-size: 0.68rem; text-transform: uppercase;"><span style="display:inline-flex; align-items:center; justify-content:center; width:13px; height:13px; background:#dc2626; color:#ffffff; border-radius:3px; font-weight:950; font-size:0.58rem; line-height:1; vertical-align:middle; margin-right:2px;">✚</span> Suizo</th>
                                                </tr>
                                            </thead>
                                            <tbody style="color: #cbd5e1; line-height: 1.35;">
                                                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                                                    <td style="font-weight: 850; color: #ffffff;">¿Pareja previa?</td>
                                                    <td style="color: #94a3b8;">Sí (fija)</td>
                                                    <td style="color: #CCFF00; font-weight: 850;">No, individual</td>
                                                    <td style="color: #CCFF00; font-weight: 850;">No, individual</td>
                                                </tr>
                                                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                                                    <td style="font-weight: 850; color: #ffffff;">Compañero</td>
                                                    <td style="color: #94a3b8;">El mismo</td>
                                                    <td style="color: #ec4899; font-weight: 850;">Cambia cada ronda</td>
                                                    <td style="color: #ef4444; font-weight: 850;">Cambia (sin repetir)</td>
                                                </tr>
                                                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                                                    <td style="font-weight: 850; color: #ffffff;">Dinámica Pistas</td>
                                                    <td style="color: #94a3b8;">Tándem (+1/-1)</td>
                                                    <td style="color: #CCFF00; font-weight: 850;">Individual (+1/-1)</td>
                                                    <td style="color: #ef4444; font-weight: 850;">Top / Med / Baj</td>
                                                </tr>
                                                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                                                    <td style="font-weight: 850; color: #ffffff;">Puntuación</td>
                                                    <td style="color: #94a3b8;">Por parejas</td>
                                                    <td style="color: #38bdf8; font-weight: 850;">Individual (+/- dif)</td>
                                                    <td style="color: #CCFF00; font-weight: 850;">Juegos ganados</td>
                                                </tr>
                                                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                                                    <td style="font-weight: 850; color: #ffffff;">Rondas & Duración</td>
                                                    <td style="color: #94a3b8;">Rondas std (2h)</td>
                                                    <td style="color: #94a3b8;">Rondas std (2h)</td>
                                                    <td style="color: #ef4444; font-weight: 850;">6 rondas expr. (2h)</td>
                                                </tr>
                                                <tr>
                                                    <td style="font-weight: 850; color: #ffffff;">Campeón / Podio</td>
                                                    <td style="color: #94a3b8;">Dupla en Pista 1</td>
                                                    <td style="color: #38bdf8; font-weight: 850;">Mayor balance (+/-)</td>
                                                    <td style="color: #CCFF00; font-weight: 900;">Más juegos totales</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    <!-- Consejo y resumen -->
                                    <div style="background: rgba(204,255,0,0.06); border: 1px solid rgba(204,255,0,0.25); border-radius: 16px; padding: 12px 14px; text-align: center; margin-bottom: 8px;">
                                        <div style="color: #CCFF00; font-weight: 900; font-size: 0.8rem; margin-bottom: 3px;">💡 Consejo SomosPadel BCN</div>
                                        <div style="color: #cbd5e1; font-size: 0.72rem; line-height: 1.4;">Tres modalidades oficiales adaptadas a ti: <strong>Pareja Fija</strong> para compenetración y ligas, <strong>Twister</strong> para networking y rotación continua, y <strong>Suizo</strong> para competición express de máxima igualdad deportiva.</div>
                                    </div>
                                </div>
                            </div>

                            <!-- Footer con botones de acción -->
                            <div class="sp-modes-footer">
                                <div style="display: flex; gap: 8px; flex: 1 1 220px; width: 100%;">
                                    <button onclick="document.getElementById('sp-game-modes-modal').style.display='none'; window.smartNavigate ? window.smartNavigate('americanas') : (window.location.hash='#americanas')" 
                                            style="flex: 1; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); color: #ffffff; padding: 10px 8px; border-radius: 12px; font-weight: 850; font-size: 0.74rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.2s;"
                                            onmouseover="this.style.background='rgba(255,255,255,0.12)'; this.style.borderColor='#CCFF00';"
                                            onmouseout="this.style.background='rgba(255,255,255,0.06)'; this.style.borderColor='rgba(255,255,255,0.15)';">
                                        <i class="fas fa-trophy" style="color: #CCFF00;"></i> VER AMERICANAS
                                    </button>
                                    <button onclick="document.getElementById('sp-game-modes-modal').style.display='none'; window.smartNavigate ? window.smartNavigate('entrenos') : (window.location.hash='#entrenos')" 
                                            style="flex: 1; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); color: #ffffff; padding: 10px 8px; border-radius: 12px; font-weight: 850; font-size: 0.74rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.2s;"
                                            onmouseover="this.style.background='rgba(255,255,255,0.12)'; this.style.borderColor='#38bdf8';"
                                            onmouseout="this.style.background='rgba(255,255,255,0.06)'; this.style.borderColor='rgba(255,255,255,0.15)';">
                                        <i class="fas fa-dumbbell" style="color: #38bdf8;"></i> VER ENTRENOS
                                    </button>
                                </div>
                                <button onclick="document.getElementById('sp-game-modes-modal').style.display='none'" 
                                        style="background: #CCFF00; color: #000000; border: none; padding: 11px 22px; border-radius: 12px; font-weight: 950; font-size: 0.78rem; cursor: pointer; box-shadow: 0 4px 15px rgba(204,255,0,0.3); transition: all 0.2s; flex-shrink: 0; width: 100%; max-width: 160px; text-align: center;"
                                        onmouseover="this.style.transform='scale(1.04)';"
                                        onmouseout="this.style.transform='scale(1)';">
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
                    };

                    const closeBtn = document.getElementById('sp-modes-close-x');
                    if (closeBtn) {
                        closeBtn.onclick = () => { modal.style.display = 'none'; };
                    }

                    modal.addEventListener('click', function(e) {
                        if (e.target === modal) modal.style.display = 'none';
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

                // A. Render Side Menu (Cyber-Padel Pro)
                if (menuContainer) {
                    const rawName = currentUser ? (currentUser.name || currentUser.displayName || "Jugador Pro") : "Invitado";
                    const level = currentUser ? parseFloat(currentUser.level || 3.5).toFixed(2) : "3.50";
                    const streak = currentUser ? (currentUser.streak || 0) : 0;
                    const matches = (stats?.stats?.matches !== undefined && stats?.stats?.matches !== null && Number(stats?.stats?.matches) > 0)
                        ? stats.stats.matches
                        : (currentUser ? (currentUser.matches_played ?? currentUser.total_matches ?? 0) : 0);
                    const photoUrl = currentUser ? (currentUser.photo_url || currentUser.photoURL) : null;
                    const initials = rawName.substring(0, 2).toUpperCase();

                    let roleBadge = 'JUGADOR PRO';
                    if (isSuperAdmin) roleBadge = '👑 SUPERADMIN';
                    else if (roleLower === 'admin_player') roleBadge = '🎖️ ADMIN + JUGADOR';
                    else if (isAdmin) roleBadge = '⚡ ADMINISTRADOR';
                    else if (isCaptain) roleBadge = '🛡️ CAPITÁN';

                    const avatarContent = photoUrl
                        ? `<img src="${photoUrl}" alt="${rawName}" onerror="this.parentElement.innerHTML='${initials}'">`
                        : initials;

                    menuContainer.innerHTML = `
                        <!-- TOP BAR FIJA -->
                        <div class="drawer-top-bar">
                            <div class="drawer-top-brand" onclick="window.smartNavigate('dashboard', null)" style="cursor: pointer; min-width: 0; flex: 1; overflow: hidden;">
                                <img src="img/logo_somospadel.png" alt="SomosPadel"
                                     style="height: 34px; width: 34px; border-radius: 10px; object-fit: cover; flex-shrink: 0; border: 1.5px solid rgba(204,255,0,0.3); box-shadow: 0 0 8px rgba(204,255,0,0.2);">
                                <div class="drawer-top-brand-text" style="min-width: 0; overflow: hidden;">
                                    <div class="drawer-top-brand-title" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">SOMOSPADEL</div>
                                    <div class="drawer-top-brand-badge" style="white-space: nowrap;">BARCELONA PRO</div>
                                </div>
                            </div>
                            <div class="drawer-top-actions" style="flex-shrink: 0; margin-left: 8px;">
                                <div class="drawer-top-btn" title="Actualizar App" onclick="window.forceUpdateApp ? window.forceUpdateApp() : window.location.reload(true)">
                                    <i class="fas fa-rotate"></i>
                                </div>
                                <div class="drawer-top-btn" title="Cerrar Menú" onclick="window.closeDrawer()">
                                    <i class="fas fa-times"></i>
                                </div>
                            </div>
                        </div>

                        <!-- CONTENIDO SCROLLABLE -->
                        <div class="drawer-scroll-body">
                            <!-- HEADER DEL JUGADOR COMPACTO -->
                            ${currentUser ? `
                            <div class="drawer-player-card" style="flex-shrink: 0 !important; min-height: auto !important; height: auto !important; overflow: visible !important;">
                                <div class="drawer-player-top" onclick="window.smartNavigate('profile', null)" style="cursor: pointer;">
                                    <div class="drawer-avatar-wrap">
                                        <div class="drawer-avatar">${avatarContent}</div>
                                        <div class="drawer-avatar-badge">${level} ⭐</div>
                                    </div>
                                    <div class="drawer-player-meta">
                                        <div class="drawer-player-name" title="${rawName}">${rawName}</div>
                                        <div class="drawer-player-role">${roleBadge}</div>
                                    </div>
                                    <i class="fas fa-chevron-right" style="color: #64748b; font-size: 0.72rem; margin-left: auto;"></i>
                                </div>
                                <div class="drawer-player-stats">
                                    <div class="drawer-stat-item">
                                        <span class="drawer-stat-val" style="color: #CCFF00;">${level}</span>
                                        <span class="drawer-stat-lbl">Nivel</span>
                                    </div>
                                    <div class="drawer-stat-item">
                                        <span class="drawer-stat-val" style="color: #fb923c;">🔥 ${streak}</span>
                                        <span class="drawer-stat-lbl">Racha</span>
                                    </div>
                                    <div class="drawer-stat-item">
                                        <span class="drawer-stat-val" style="color: #38bdf8;">${matches}</span>
                                        <span class="drawer-stat-lbl">Partidos</span>
                                    </div>
                                </div>
                            </div>
                            ` : `
                            <div class="drawer-player-card drawer-guest-card" style="flex-shrink: 0 !important; min-height: 105px !important; height: auto !important; overflow: visible !important; padding: 14px 12px !important;">
                                <div class="drawer-guest-header" style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px; overflow: visible;">
                                    <div style="width: 36px; height: 36px; border-radius: 10px; background: rgba(204, 255, 0, 0.15); border: 1.5px solid #CCFF00; color: #CCFF00; display: flex; align-items: center; justify-content: center; font-size: 1rem; flex-shrink: 0; box-shadow: 0 0 10px rgba(204,255,0,0.25);">
                                        <i class="fas fa-user"></i>
                                    </div>
                                    <div style="flex: 1; min-width: 0; overflow: visible;">
                                        <div style="font-weight: 900; color: #ffffff; font-size: 0.9rem; line-height: 1.25;">Bienvenido a SomosPadel</div>
                                        <div style="font-size: 0.68rem; color: #94a3b8; line-height: 1.25; margin-top: 2px;">Inicia sesión para guardar tus americanas</div>
                                    </div>
                                </div>
                                <button class="drawer-action-btn drawer-guest-btn" style="background: #CCFF00 !important; color: #000000 !important; font-weight: 900 !important; min-height: 38px !important; border-radius: 10px !important; font-size: 0.76rem !important; display: flex !important; align-items: center !important; justify-content: center !important; gap: 8px !important; width: 100% !important; border: none !important; cursor: pointer !important; box-shadow: 0 4px 12px rgba(204,255,0,0.3) !important;" onclick="window.closeDrawer(); const m = document.getElementById('auth-modal'); if(m){ m.classList.remove('hidden'); m.style.setProperty('display','flex','important'); }">
                                    <i class="fas fa-arrow-right-to-bracket"></i> INICIAR SESIÓN / REGISTRO
                                </button>
                            </div>
                            `}

                            <!-- SECCIÓN 1: INICIO -->
                            <div class="drawer-section">
                                <div class="drawer-section-title"><span class="dot" style="background:#00E36D;"></span> INICIO</div>
                                <div class="drawer-group-box">
                                    <div class="drawer-nav-row" onclick="window.smartNavigate('dashboard', null)">
                                        <div class="drawer-row-icon" style="background: rgba(0, 227, 109, 0.15); color: #00E36D; border: 1px solid rgba(0, 227, 109, 0.3);">
                                            <i class="fas fa-house"></i>
                                        </div>
                                        <span class="drawer-row-title" style="color: #ffffff !important; font-weight: 800; font-size: 0.88rem; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">Dashboard</span>
                                        <i class="fas fa-chevron-right drawer-row-chevron"></i>
                                    </div>

                                    <div class="drawer-nav-row" onclick="window.smartNavigate('agenda', null)">
                                        <div class="drawer-row-icon" style="background: rgba(0, 210, 255, 0.15); color: #00D2FF; border: 1px solid rgba(0, 210, 255, 0.3);">
                                            <i class="fas fa-calendar-alt"></i>
                                        </div>
                                        <span class="drawer-row-title" style="color: #ffffff !important; font-weight: 800; font-size: 0.88rem; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">Mis Partidos / Agenda</span>
                                        <span class="drawer-row-badge" style="background: rgba(0, 210, 255, 0.2); color: #00D2FF; border: 1px solid rgba(0, 210, 255, 0.3);">ACTIVOS</span>
                                        <i class="fas fa-chevron-right drawer-row-chevron"></i>
                                    </div>

                                    <div class="drawer-nav-row" onclick="window.smartNavigate('results', null)">
                                        <div class="drawer-row-icon" style="background: rgba(204, 255, 0, 0.15); color: #CCFF00; border: 1px solid rgba(204, 255, 0, 0.3);">
                                            <i class="fas fa-chart-line"></i>
                                        </div>
                                        <span class="drawer-row-title" style="color: #ffffff !important; font-weight: 800; font-size: 0.88rem; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">Mis Resultados & Stats</span>
                                        <i class="fas fa-chevron-right drawer-row-chevron"></i>
                                    </div>

                                    <div class="drawer-nav-row" onclick="window.closeDrawer(); window.PlayerView?.haptic?.(15); window.NotificationUi && window.NotificationUi.open();">
                                        <div class="drawer-row-icon" style="background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3);">
                                            <i class="fas fa-bell" id="drawer-notif-bell-icon"></i>
                                        </div>
                                        <span class="drawer-row-title" style="color: #ffffff !important; font-weight: 800; font-size: 0.88rem; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">Notificaciones</span>
                                        <span id="drawer-notif-badge" class="drawer-row-badge" style="display: none; background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.4); font-weight: 900;">0</span>
                                        <i class="fas fa-chevron-right drawer-row-chevron"></i>
                                    </div>
                                </div>
                            </div>

                            <!-- SECCIÓN 2: AMERICANAS (EventsController) -->
                            <div class="drawer-section">
                                <div class="drawer-section-title"><span class="dot" style="background:#FFD700;"></span> AMERICANAS</div>
                                <div class="drawer-group-box">
                                    <div class="drawer-nav-row" onclick="window.smartNavigate('americanas', null)">
                                        <div class="drawer-row-icon" style="background: rgba(255, 215, 0, 0.15); color: #FFD700; border: 1px solid rgba(255, 215, 0, 0.3);">
                                            <i class="fas fa-trophy"></i>
                                        </div>
                                        <span class="drawer-row-title" style="color: #ffffff !important; font-weight: 800; font-size: 0.88rem; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">Americanas en Directo</span>
                                        <span class="drawer-row-badge" style="background: rgba(255, 215, 0, 0.2); color: #FFD700; border: 1px solid rgba(255, 215, 0, 0.3);">TOP</span>
                                        <i class="fas fa-chevron-right drawer-row-chevron"></i>
                                    </div>

                                    <div class="drawer-nav-row" onclick="window.smartNavigate('finished_americanas', null)">
                                        <div class="drawer-row-icon" style="background: rgba(100, 116, 139, 0.15); color: #94a3b8; border: 1px solid rgba(100, 116, 139, 0.3);">
                                            <i class="fas fa-flag-checkered"></i>
                                        </div>
                                        <span class="drawer-row-title" style="color: #ffffff !important; font-weight: 800; font-size: 0.88rem; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">Historial & Finalizadas</span>
                                        <i class="fas fa-chevron-right drawer-row-chevron"></i>
                                    </div>

                                    <div class="drawer-nav-row" onclick="window.smartNavigate('tournaments', null)">
                                        <div class="drawer-row-icon" style="background: rgba(236, 72, 153, 0.15); color: #f472b6; border: 1px solid rgba(236, 72, 153, 0.3);">
                                            <i class="fas fa-sitemap"></i>
                                        </div>
                                        <span class="drawer-row-title" style="color: #ffffff !important; font-weight: 800; font-size: 0.88rem; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">Torneos</span>
                                        <i class="fas fa-chevron-right drawer-row-chevron"></i>
                                    </div>

                                    <div class="drawer-nav-row" onclick="window.closeDrawer(); window.CourtScoreboard && window.CourtScoreboard.open()">
                                        <div class="drawer-row-icon" style="background: rgba(204, 255, 0, 0.15); color: #CCFF00; border: 1px solid rgba(204, 255, 0, 0.3);">
                                            <i class="fas fa-calculator"></i>
                                        </div>
                                        <span class="drawer-row-title" style="color: #ffffff !important; font-weight: 800; font-size: 0.88rem; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">Marcador de Pista</span>
                                        <span class="drawer-row-badge" style="background: rgba(204, 255, 0, 0.2); color: #CCFF00; border: 1px solid rgba(204, 255, 0, 0.4);">LIVE</span>
                                        <i class="fas fa-chevron-right drawer-row-chevron"></i>
                                    </div>

                                    <div class="drawer-nav-row" onclick="window.smartNavigate('clima', null)">
                                        <div class="drawer-row-icon" style="background: rgba(14, 165, 233, 0.15); color: #38bdf8; border: 1px solid rgba(14, 165, 233, 0.3);">
                                            <i class="fas fa-cloud-sun"></i>
                                        </div>
                                        <span class="drawer-row-title" style="color: #ffffff !important; font-weight: 800; font-size: 0.88rem; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">Clima & Radar de Pistas</span>
                                        <span class="drawer-row-badge" style="background: rgba(14, 165, 233, 0.2); color: #38bdf8; border: 1px solid rgba(14, 165, 233, 0.4);">RADAR</span>
                                        <i class="fas fa-chevron-right drawer-row-chevron"></i>
                                    </div>

                                    <div class="drawer-nav-row" onclick="window.showAmericanasRulesModal()">
                                        <div class="drawer-row-icon" style="background: rgba(168, 85, 247, 0.15); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.3);">
                                            <i class="fas fa-book-open"></i>
                                        </div>
                                        <span class="drawer-row-title" style="color: #ffffff !important; font-weight: 800; font-size: 0.88rem; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">Normativa de Americanas</span>
                                        <i class="fas fa-chevron-right drawer-row-chevron"></i>
                                    </div>
                                </div>
                            </div>

                            <!-- SECCIÓN 3: RANKING -->
                            <div class="drawer-section">
                                <div class="drawer-section-title"><span class="dot" style="background:#fb923c;"></span> RANKING</div>
                                <div class="drawer-group-box">
                                    <div class="drawer-nav-row" onclick="window.smartNavigate('ranking', null)">
                                        <div class="drawer-row-icon" style="background: rgba(249, 115, 22, 0.15); color: #fb923c; border: 1px solid rgba(249, 115, 22, 0.3);">
                                            <i class="fas fa-ranking-star"></i>
                                        </div>
                                        <span class="drawer-row-title" style="color: #ffffff !important; font-weight: 800; font-size: 0.88rem; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">Ranking del Club</span>
                                        <i class="fas fa-chevron-right drawer-row-chevron"></i>
                                    </div>

                                    <div class="drawer-nav-row" onclick="window.smartNavigate('records', null)">
                                        <div class="drawer-row-icon" style="background: rgba(236, 72, 153, 0.15); color: #f472b6; border: 1px solid rgba(236, 72, 153, 0.3);">
                                            <i class="fas fa-award"></i>
                                        </div>
                                        <span class="drawer-row-title" style="color: #ffffff !important; font-weight: 800; font-size: 0.88rem; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">Récords & Hall of Fame</span>
                                        <i class="fas fa-chevron-right drawer-row-chevron"></i>
                                    </div>

                                    <div class="drawer-nav-row" onclick="window.closeDrawer(); window.showPointsPolicyModal ? window.showPointsPolicyModal() : null">
                                        <div class="drawer-row-icon" style="background: rgba(204, 255, 0, 0.18); color: #CCFF00; border: 1px solid rgba(204, 255, 0, 0.4);">
                                            <i class="fas fa-balance-scale"></i>
                                        </div>
                                        <span class="drawer-row-title" style="color: #ffffff !important; font-weight: 800; font-size: 0.88rem; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">Sistema de Puntos</span>
                                        <span class="drawer-row-badge" style="background: rgba(204, 255, 0, 0.2); color: #CCFF00; border: 1px solid rgba(204, 255, 0, 0.35);">BAREMO</span>
                                        <i class="fas fa-chevron-right drawer-row-chevron"></i>
                                    </div>
                                </div>
                            </div>

                            <!-- SECCIÓN 4: MI PERFIL -->
                            <div class="drawer-section">
                                <div class="drawer-section-title"><span class="dot" style="background:#c084fc;"></span> MI PERFIL</div>
                                <div class="drawer-group-box">
                                    <div class="drawer-nav-row" onclick="window.smartNavigate('profile', null)">
                                        <div class="drawer-row-icon" style="background: rgba(168, 85, 247, 0.15); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.3);">
                                            <i class="fas fa-user-astronaut"></i>
                                        </div>
                                        <span class="drawer-row-title" style="color: #ffffff !important; font-weight: 800; font-size: 0.88rem; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">Mi Perfil Deportivo</span>
                                        <i class="fas fa-chevron-right drawer-row-chevron"></i>
                                    </div>

                                    <div class="drawer-nav-row" onclick="window.closeDrawer(); window.PadelFutCard && window.PadelFutCard.open()">
                                        <div class="drawer-row-icon" style="background: rgba(251, 191, 36, 0.15); color: #fbbf24; border: 1px solid rgba(251, 191, 36, 0.3);">
                                            <i class="fas fa-id-card"></i>
                                        </div>
                                        <span class="drawer-row-title" style="color: #ffffff !important; font-weight: 800; font-size: 0.88rem; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">Mi Carta FUT & Stories</span>
                                        <span class="drawer-row-badge" style="background: rgba(251, 191, 36, 0.2); color: #fbbf24; border: 1px solid rgba(251, 191, 36, 0.4);">PRO</span>
                                        <i class="fas fa-chevron-right drawer-row-chevron"></i>
                                    </div>
                                </div>
                            </div>

                            <!-- SECCIÓN 5: COMUNIDAD (aparte, hub propio del router) -->
                            <div class="drawer-section">
                                <div class="drawer-section-title" style="color: #22d3ee; border-color: rgba(6,182,212,0.35);"><span class="dot" style="background:#22d3ee; box-shadow: 0 0 6px #22d3ee;"></span> COMUNIDAD</div>
                                <div class="drawer-group-box" style="border-color: rgba(6,182,212,0.25); background: rgba(6,182,212,0.05);">
                                    <div class="drawer-nav-row" onclick="window.smartNavigate('teams', null)">
                                        <div class="drawer-row-icon" style="background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3);">
                                            <i class="fas fa-shield-halved"></i>
                                        </div>
                                        <span class="drawer-row-title" style="color: #ffffff !important; font-weight: 800; font-size: 0.88rem; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">Equipos SomosPadel</span>
                                        <i class="fas fa-chevron-right drawer-row-chevron"></i>
                                    </div>

                                    <div class="drawer-nav-row" onclick="window.smartNavigate('entrenos', null)">
                                        <div class="drawer-row-icon" style="background: rgba(204, 255, 0, 0.15); color: #CCFF00; border: 1px solid rgba(204, 255, 0, 0.3);">
                                            <i class="fas fa-dumbbell"></i>
                                        </div>
                                        <span class="drawer-row-title" style="color: #ffffff !important; font-weight: 800; font-size: 0.88rem; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">Entrenamientos & Partidas</span>
                                        <i class="fas fa-chevron-right drawer-row-chevron"></i>
                                    </div>

                                    <div class="drawer-nav-row" onclick="window.smartNavigate('inscriptions', null)">
                                        <div class="drawer-row-icon" style="background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3);">
                                            <i class="fas fa-clipboard-list"></i>
                                        </div>
                                        <span class="drawer-row-title" style="color: #ffffff !important; font-weight: 800; font-size: 0.88rem; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">Inscripciones & Temporada</span>
                                        <i class="fas fa-chevron-right drawer-row-chevron"></i>
                                    </div>

                                    <div class="drawer-nav-row" onclick="window.closeDrawer(); window.showGameModesModal()">
                                        <div class="drawer-row-icon" style="background: rgba(204, 255, 0, 0.15); color: #CCFF00; border: 1px solid rgba(204, 255, 0, 0.3);">
                                            <i class="fas fa-gamepad"></i>
                                        </div>
                                        <span class="drawer-row-title" style="color: #ffffff !important; font-weight: 800; font-size: 0.88rem; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">Modos de Juego</span>
                                        <span class="drawer-row-badge" style="background: rgba(204, 255, 0, 0.2); color: #CCFF00; border: 1px solid rgba(204, 255, 0, 0.35);">GUÍA</span>
                                        <i class="fas fa-chevron-right drawer-row-chevron"></i>
                                    </div>

                                    <div class="drawer-nav-row" onclick="window.openCommunityChat()">
                                        <div class="drawer-row-icon" style="background: rgba(6, 182, 212, 0.15); color: #22d3ee; border: 1px solid rgba(6, 182, 212, 0.3);">
                                            <i class="fas fa-comments"></i>
                                        </div>
                                        <span class="drawer-row-title" style="color: #ffffff !important; font-weight: 800; font-size: 0.88rem; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">Chat & Convivencia</span>
                                        <i class="fas fa-chevron-right drawer-row-chevron"></i>
                                    </div>

                                    <div class="drawer-nav-row" onclick="window.openClubWhatsApp()">
                                        <div class="drawer-row-icon" style="background: rgba(37, 211, 102, 0.15); color: #25d366; border: 1px solid rgba(37, 211, 102, 0.3);">
                                            <i class="fab fa-whatsapp"></i>
                                        </div>
                                        <span class="drawer-row-title" style="color: #ffffff !important; font-weight: 800; font-size: 0.88rem; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">WhatsApp Oficial SomosPadel</span>
                                        <i class="fas fa-chevron-right drawer-row-chevron"></i>
                                    </div>
                                </div>
                            </div>

                            <!-- SECCIÓN 6: GESTIÓN & CAPITANES (ALEX Y CAPITANES) -->
                            <div class="drawer-admin-box">
                                <div class="drawer-admin-header">
                                    <div style="font-weight: 900; font-size: 0.82rem; color: #fbbf24; display: flex; align-items: center; gap: 8px;">
                                        <i class="fas fa-shield-halved"></i> GESTIÓN & CAPITANES
                                    </div>
                                    <span class="drawer-admin-badge">${isStaffOrCaptain ? (isSuperAdmin ? 'SUPER ADMIN' : (isCaptain ? 'CAPITÁN' : 'ADMIN')) : 'STAFF'}</span>
                                </div>
                                <div style="font-size: 0.72rem; color: #cbd5e1; margin-bottom: 10px; line-height: 1.4;">
                                    Espacio para Alex y capitanes: actas, torneos y gestión.
                                </div>
                                
                                ${isStaffOrCaptain ? `
                                <button class="drawer-action-btn" style="background: #fbbf24; color: #000; font-weight: 900; margin-bottom: 8px; box-shadow: 0 4px 12px rgba(251, 191, 36, 0.25);" onclick="window.closeDrawer(); window.location.href='admin.html'">
                                    <i class="fas fa-user-shield"></i> ENTRAR AL PANEL DE CONTROL
                                </button>
                                ` : ''}

                                <button class="drawer-action-btn" style="background: rgba(255, 255, 255, 0.06); color: #ffffff; border: 1px solid rgba(251, 191, 36, 0.35);" onclick="window.closeDrawer(); window.location.href='admin-login.html'">
                                    <i class="fas fa-key" style="color: #fbbf24;"></i> ACCESO STAFF & CAPITANES (PIN)
                                </button>
                            </div>

                            <!-- SECCIÓN 5: FOOTER DE SESIÓN Y VERSIÓN -->
                            <div class="drawer-footer-card">
                                <button class="drawer-action-btn drawer-btn-refresh" onclick="window.forceUpdateApp ? window.forceUpdateApp() : window.location.reload(true)">
                                    <i class="fas fa-rotate"></i> Actualizar App / Limpiar Caché
                                </button>

                                ${currentUser ? `
                                <button class="drawer-action-btn drawer-btn-logout" onclick="window.closeDrawer(); window.AuthController && window.AuthController.handleLogout ? window.AuthController.handleLogout() : null;">
                                    <i class="fas fa-power-off"></i> Cerrar Sesión
                                </button>
                                ` : ''}

                                <div class="drawer-version-row">
                                    <span class="drawer-online-ping"></span>
                                    <span>SomosPadel v2.9 • Barcelona</span>
                                </div>
                            </div>
                        </div>
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
    if (window.AppInit && window.AppInit.initialized) {
        console.log("🎾 [App] AppInit already initialized. Launching Core App immediately...");
        if (!window.AppInstance) window.AppInstance = new App();
    } else {
        document.addEventListener('AppReady', () => {
            console.log("🎾 [App] AppReady signal received. Launching Core App...");
            if (!window.AppInstance) window.AppInstance = new App();
        });
    }
})();
