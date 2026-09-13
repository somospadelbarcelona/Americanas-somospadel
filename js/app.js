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
                window.Store.subscribe('playerStats', () => {
                    this.loadSideMenu();
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
                    const matches = currentUser ? (currentUser.matches_played || (stats?.stats?.matches) || 0) : 0;
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
                            <div class="drawer-top-brand" onclick="window.smartNavigate('dashboard', null)" style="cursor: pointer;">
                                <img src="img/logo_somospadel.png" alt="SomosPadel">
                                <div class="drawer-top-brand-text">
                                    <div class="drawer-top-brand-title">SOMOSPADEL</div>
                                    <div class="drawer-top-brand-badge">BARCELONA PRO</div>
                                </div>
                            </div>
                            <div class="drawer-top-actions">
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

                            <!-- SECCIÓN 1: MI PÁDEL & PRINCIPAL -->
                            <div class="drawer-section">
                                <div class="drawer-section-title"><span class="dot"></span> MI PÁDEL & PRINCIPAL</div>
                                <div class="drawer-group-box">
                                    <div class="drawer-nav-row" onclick="window.smartNavigate('dashboard', null)">
                                        <div class="drawer-row-icon" style="background: rgba(0, 227, 109, 0.15); color: #00E36D; border: 1px solid rgba(0, 227, 109, 0.3);">
                                            <i class="fas fa-house"></i>
                                        </div>
                                        <span class="drawer-row-title" style="color: #ffffff !important; font-weight: 800; font-size: 0.88rem; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">Inicio / Dashboard</span>
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

                                    <div class="drawer-nav-row" onclick="window.smartNavigate('profile', null)">
                                        <div class="drawer-row-icon" style="background: rgba(168, 85, 247, 0.15); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.3);">
                                            <i class="fas fa-user-astronaut"></i>
                                        </div>
                                        <span class="drawer-row-title" style="color: #ffffff !important; font-weight: 800; font-size: 0.88rem; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">Mi Perfil Deportivo</span>
                                        <i class="fas fa-chevron-right drawer-row-chevron"></i>
                                    </div>

                                    <div class="drawer-nav-row" onclick="window.smartNavigate('teams', null)">
                                        <div class="drawer-row-icon" style="background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3);">
                                            <i class="fas fa-shield-halved"></i>
                                        </div>
                                        <span class="drawer-row-title" style="color: #ffffff !important; font-weight: 800; font-size: 0.88rem; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">Equipos SomosPadel</span>
                                        <i class="fas fa-chevron-right drawer-row-chevron"></i>
                                    </div>
                                </div>
                            </div>

                            <!-- SECCIÓN 2: COMPETIR & ENTRENAR -->
                            <div class="drawer-section">
                                <div class="drawer-section-title"><span class="dot"></span> COMPETIR & ENTRENAR</div>
                                <div class="drawer-group-box">
                                    <div class="drawer-nav-row" onclick="window.smartNavigate('americanas', null)">
                                        <div class="drawer-row-icon" style="background: rgba(255, 215, 0, 0.15); color: #FFD700; border: 1px solid rgba(255, 215, 0, 0.3);">
                                            <i class="fas fa-trophy"></i>
                                        </div>
                                        <span class="drawer-row-title" style="color: #ffffff !important; font-weight: 800; font-size: 0.88rem; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">Americanas & Torneos</span>
                                        <span class="drawer-row-badge" style="background: rgba(255, 215, 0, 0.2); color: #FFD700; border: 1px solid rgba(255, 215, 0, 0.3);">TOP</span>
                                        <i class="fas fa-chevron-right drawer-row-chevron"></i>
                                    </div>

                                    <div class="drawer-nav-row" onclick="window.smartNavigate('entrenos', null)">
                                        <div class="drawer-row-icon" style="background: rgba(204, 255, 0, 0.15); color: #CCFF00; border: 1px solid rgba(204, 255, 0, 0.3);">
                                            <i class="fas fa-dumbbell"></i>
                                        </div>
                                        <span class="drawer-row-title" style="color: #ffffff !important; font-weight: 800; font-size: 0.88rem; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">Entrenamientos</span>
                                        <i class="fas fa-chevron-right drawer-row-chevron"></i>
                                    </div>

                                    <div class="drawer-nav-row" onclick="window.smartNavigate('partidas_abiertas', null)">
                                        <div class="drawer-row-icon" style="background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3);">
                                            <i class="fas fa-table-tennis-paddle-ball"></i>
                                        </div>
                                        <span class="drawer-row-title" style="color: #ffffff !important; font-weight: 800; font-size: 0.88rem; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">Partidas Abiertas</span>
                                        <span class="drawer-row-badge" style="background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3);">PISTAS</span>
                                        <i class="fas fa-chevron-right drawer-row-chevron"></i>
                                    </div>

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
                                </div>
                            </div>

                            <!-- SECCIÓN 3: CLUB & COMUNIDAD -->
                            <div class="drawer-section">
                                <div class="drawer-section-title"><span class="dot"></span> CLUB & COMUNIDAD</div>
                                <div class="drawer-group-box">
                                    <div class="drawer-nav-row" onclick="window.showAmericanasRulesModal()">
                                        <div class="drawer-row-icon" style="background: rgba(168, 85, 247, 0.15); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.3);">
                                            <i class="fas fa-book-open"></i>
                                        </div>
                                        <span class="drawer-row-title" style="color: #ffffff !important; font-weight: 800; font-size: 0.88rem; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">Normativa de Americanas</span>
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

                            <!-- SECCIÓN 4: GESTIÓN & CAPITANES (ALEX Y CAPITANES) -->
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
            this.loadSideMenu();
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
                const matches = user ? (user.matches_played || (stats?.stats?.matches) || 0) : 0;
                headerMatches.innerText = `🎾 ${matches}`;
            }

            if (headerWinRate) {
                const wr = stats?.stats?.winRate || (user?.win_rate) || "--";
                headerWinRate.innerText = wr !== "--" ? `${wr}%` : "--";
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
