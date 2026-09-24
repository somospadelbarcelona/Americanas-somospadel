/**
 * admin.js
 * Core Admin Logic: Authentication, Navigation, and Bootstrapping.
 * Stripped of specific view logic (delegated to modules).
 */

console.log("🚀 Admin JS Loading...");

// --- GLOBAL HELPERS ---
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
        const [h, m] = startTime.split(':').map(Number);
        const date = new Date();
        date.setHours(h, m, 0, 0);
        // Ronda 1 = hora inicio, Ronda 2 = +20min, Ronda 3 = +40min, etc.
        const totalMinutesOffset = (roundNum - 1) * matchDuration;
        date.setMinutes(date.getMinutes() + totalMinutesOffset);
        return date.getHours().toString().padStart(2, '0') + ":" +
            date.getMinutes().toString().padStart(2, '0');
    } catch (e) { return startTime; }
};

// --- AUTHENTICATION ---
window.AdminAuth = {
    token: localStorage.getItem('adminToken'),
    user: (() => {
        try {
            const s = localStorage.getItem('adminUser') || localStorage.getItem('currentUser');
            return JSON.parse(s || 'null');
        } catch (e) { return null; }
    })(),

    hasAdminRole(role) {
        if (!role) return false;
        const r = role.toString().toLowerCase().trim();
        return ['super_admin', 'superadmin', 'admin', 'admin_player', 'captain', 'capitan', 'capitanes', 'organizador', 'organizadores', 'organizer', 'organizers'].includes(r);
    },

    applyRoleRestrictions() {
        if (!this.user) return;
        const role = (this.user.role || '').toString().toLowerCase().trim();
        const isOrganizer = ['organizer', 'organizador', 'organizadores', 'organizers'].includes(role);

        if (isOrganizer) {
            console.log("🏛️ [AdminAuth] Modo Organizador Club activo. Ocultando pestañas no autorizadas...");
            
            const sidebar = document.getElementById('admin-sidebar');
            if (sidebar) {
                // Ocultar todos los submenús excepto el de Americanas
                const wrappers = sidebar.querySelectorAll('.submenu-wrapper');
                wrappers.forEach(w => {
                    const hasAmericana = w.querySelector('.nav-group-americana') || w.querySelector('[data-view^="americanas"]');
                    if (!hasAmericana) {
                        w.style.setProperty('display', 'none', 'important');
                    } else {
                        w.style.setProperty('display', 'flex', 'important');
                        w.classList.add('expanded');
                        const content = w.querySelector('.submenu-content');
                        if (content) {
                            content.style.setProperty('display', 'flex', 'important');
                            content.style.maxHeight = '600px';
                            content.style.opacity = '1';
                            content.style.pointerEvents = 'auto';
                        }
                    }
                });

                // Ocultar botones individuales de navegación que no sean Americanas
                const topButtons = sidebar.querySelectorAll('.nav-menu > button.nav-item-pro');
                topButtons.forEach(btn => {
                    const view = btn.getAttribute('data-view') || '';
                    if (!view.includes('americana') && !view.includes('matches')) {
                        btn.style.setProperty('display', 'none', 'important');
                    }
                });
            }

            // Adaptar la insignia de rol en el perfil
            const roleEl = document.querySelector('.admin-profile-pro .role');
            if (roleEl) {
                roleEl.innerHTML = 'ORGANIZADOR / CLUB 🏛️';
                roleEl.style.color = '#0ea5e9';
                roleEl.style.fontWeight = '900';
            }
        }

        // 🛡️ Ocultar consola de emergencia excepto para Superadmin
        const isSuperAdmin = ['super_admin', 'superadmin'].includes(role);
        const emergencyBtn = document.getElementById('emergency-console-trigger-btn');
        if (emergencyBtn) {
            emergencyBtn.style.setProperty('display', isSuperAdmin ? 'block' : 'none', 'important');
        }
    },

    async init() {
        console.log("🛠️ AdminAuth Init");
        const modal = document.getElementById('admin-auth-modal');
        const isAdmin = this.user && this.hasAdminRole(this.user.role);

        if (isAdmin) {
            console.log("💎 Active Session:", this.user.name);
            if (modal) {
                modal.style.display = 'none';
                modal.classList.add('hidden');
            }
            this.updateProfileUI();
            this.applyRoleRestrictions();

            // 🔐 FIX: Siempre establecer sesión Firebase Auth ANTES de cargar cualquier vista
            // Sin esto, Firestore devuelve permission-denied porque request.auth == null
            try {
                console.log("🔐 [AdminAuth.init] Re-estableciendo sesión Firebase Auth (anonymous)...");
                const currentFirebaseUser = firebase.auth().currentUser;
                
                if (!currentFirebaseUser) {
                    // No hay sesión Firebase activa - necesitamos crear una
                    const creds = await firebase.auth().signInAnonymously();
                    const uid = creds.user.uid;
                    console.log("✅ [AdminAuth.init] Sesión anónima establecida. UID:", uid);
                    
                    // Elevar privilegios en Firestore para que las reglas reconozcan al admin
                    if (window.db) {
                        try {
                            await window.db.collection('players').doc(uid).set({
                                id: uid,
                                uid: uid,
                                name: `[Session] ${this.user.name}`,
                                role: this.user.role,
                                status: 'active',
                                isSessionAdmin: true,
                                createdAt: new Date().toISOString()
                            }, { merge: true });
                            console.log("🛡️ [AdminAuth.init] Privilegios elevados OK para sesión restaurada.");
                        } catch (elevErr) {
                            console.warn("⚠️ [AdminAuth.init] Elevación falló (puede que ya exista):", elevErr.message);
                        }
                    }
                } else {
                    console.log("✅ [AdminAuth.init] Sesión Firebase ya activa. UID:", currentFirebaseUser.uid);
                }
            } catch (authErr) {
                console.error("🛑 [AdminAuth.init] Firebase Auth falló:", authErr.message);
                // Continuamos igualmente - puede que las reglas de Firestore permitan el acceso
            }

            // Cargar la vista inicial: respetar hash de URL, última vista guardada o 'users' por defecto
            const hashView = window.location.hash ? window.location.hash.replace('#', '').split('?')[0].trim() : null;
            const savedView = sessionStorage.getItem('admin_last_view');
            const targetInitialView = hashView || savedView || 'users';

            setTimeout(() => {
                if (!window._currentAdminView && window.loadAdminView) {
                    window.loadAdminView(targetInitialView);
                }

                // --- BATSEÑAL 2.0 (Proactive Agent) ---
                if (window.BatSignalAgent) {
                    window.BatSignalAgent.init();
                }

                // --- AUTOBLOG CRON PASIVO ---
                setTimeout(() => {
                    if (window.AutoBlogEngine && typeof window.AutoBlogEngine.checkAndGeneratePassive === 'function') {
                        window.AutoBlogEngine.checkAndGeneratePassive();
                    }
                }, 1500);
            }, 300);
        } else {
            console.log("🔒 No active session. Waiting for PIN...");
            if (localStorage.getItem('admin_remember_pin')) {
                await this.login(localStorage.getItem('admin_remember_pin'), true);
            }
        }
    },

    async login(pin, isAuto = false) {
        const ACCESS_CODES = {
            '212121': { role: 'super_admin', name: 'Super Admin' },
            '501501': { role: 'admin', name: 'Admin' },
            '262524': { role: 'captain', name: 'Capitán' },
            '808808': { role: 'organizer', name: 'Organizador Club' }
        };

        try {
            if (!isAuto) await new Promise(r => setTimeout(r, 600));

            if (ACCESS_CODES[pin]) {
                const sessionData = ACCESS_CODES[pin];
                const user = { ...sessionData, status: 'active', lastLogin: new Date().toISOString() };

                // NEW: Ensure Firebase Auth baseline even for PIN login
                if (window.firebase && firebase.auth) {
                    try {
                        console.log("🔐 [Mission Control] Authenticating Infrastructure (Anonymous)...");
                        const creds = await firebase.auth().signInAnonymously();
                        const uid = creds.user.uid;
                        console.log("✅ [Telemetry] Infrastructure link established. Session UID:", uid);

                        // ELEVATION OF PRIVILEGES: Register this session UID as an Admin in the DB
                        // This allows firestore.rules to recognize this session as authorized.
                        if (window.db) {
                            console.log(`🛡️ [Mission Control] Elevating privileges for ${sessionData.name}...`);
                            try {
                                await window.db.collection('players').doc(uid).set({
                                    id: uid,
                                    uid: uid,
                                    name: `[Session] ${sessionData.name}`,
                                    role: sessionData.role,
                                    status: 'active',
                                    isSessionAdmin: true,
                                    createdAt: new Date().toISOString()
                                });
                                console.log(`🚀 [Mission Control] Session elevated to ${sessionData.role.toUpperCase()} successfully.`);
                            } catch (elevErr) {
                                console.warn("⚠️ Local elevation failed (it might already have it or rules blocked it):", elevErr.message);
                            }
                        }
                    } catch (authErr) {
                        console.error("🛑 [CRITICAL] Firebase Infra Auth failed:", authErr);
                        if (window.PremiumModal) {
                            window.PremiumModal.alert({
                                title: "⚠️ FALLO DE TELEMETRÍA",
                                message: "El enlace con Firebase falló o los permisos están bloqueados. No podrás realizar cambios en la base de datos.",
                                type: 'warning'
                            });
                        }
                    }
                }

                this.setUser(user);
                if (!isAuto && window.PremiumModal) {
                    window.PremiumModal.alert({ title: "✅ ACCESO CONCEDIDO", message: `Bienvenido, ${user.name}.`, type: 'success' });
                }
            } else {
                throw new Error("CÓDIGO DE ACCESO INCORRECTO");
            }
        } catch (e) {
            if (window.PremiumModal) {
                window.PremiumModal.alert({ title: "❌ ERROR", message: e.message, type: 'error' });
            } else {
                alert(e.message);
            }
        }
    },

    setUser(user) {
        this.user = user;
        localStorage.setItem('adminUser', JSON.stringify(user));
        document.getElementById('admin-auth-modal').style.display = 'none';
        this.updateProfileUI();
        this.applyRoleRestrictions();
        const role = (user.role || '').toString().toLowerCase().trim();
        const isOrganizer = ['organizer', 'organizador', 'organizadores', 'organizers'].includes(role);
        const hashView = window.location.hash ? window.location.hash.replace('#', '').split('?')[0].trim() : null;
        const targetView = hashView || sessionStorage.getItem('admin_last_view') || (isOrganizer ? 'americanas_mgmt' : 'users');
        window.loadAdminView(targetView);
    },

    logout() {
        localStorage.removeItem('adminUser');
        location.reload();
    },

    updateProfileUI() {
        if (!this.user) return;
        const nameEl = document.getElementById('admin-name');
        const avEl = document.getElementById('admin-avatar');
        if (nameEl) nameEl.textContent = this.user.name;
        if (avEl) avEl.textContent = this.user.name.charAt(0);

        // Add Force Refresh button to top bar if not exists
        const topActions = document.querySelector('.top-actions');
        if (topActions && !document.getElementById('force-refresh-btn')) {
            const btn = document.createElement('button');
            btn.id = 'force-refresh-btn';
            btn.className = 'btn-micro';
            btn.style.cssText = 'background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #888; padding: 5px 10px; border-radius: 6px; font-size: 0.65rem;';
            btn.innerHTML = '<i class="fas fa-sync-alt"></i> FORCE REFRESH';
            btn.onclick = () => {
                if (confirm("¿Forzar recarga completa? Se limpiará la caché.")) {
                    window.location.reload(true);
                    if ('serviceWorker' in navigator) {
                        navigator.serviceWorker.getRegistrations().then(regs => {
                            for (let reg of regs) reg.unregister();
                            window.location.href = window.location.href + '?v=' + Date.now();
                        });
                    }
                }
            };
            topActions.prepend(btn);
        }
    }
};

// --- NAVIGATION ROUTER ---
window._currentAdminNavId = 0;
window._currentAdminView = null;

window.loadAdminView = async function (rawViewName) {
    const role = (window.AdminAuth?.user?.role || '').toString().toLowerCase().trim();
    const isOrganizer = ['organizer', 'organizador', 'organizadores', 'organizers'].includes(role);

    let viewName = String(rawViewName || (isOrganizer ? 'americanas_mgmt' : 'users')).split('?')[0].trim();

    // 🔒 RESTRICCIÓN ESTRICTA DE ACCESO PARA ORGANIZADORES:
    // Solo pueden ver y gestionar Americanas y Resultados de americanas
    if (isOrganizer) {
        const allowedViews = ['americanas_mgmt', 'americanas_create', 'matches', 'simulator_empty', 'events'];
        if (!allowedViews.includes(viewName)) {
            console.warn(`🔒 [Seguridad Organizador] Acceso restringido a "${viewName}". Redirigiendo a americanas_mgmt.`);
            viewName = 'americanas_mgmt';
        }
    }

    window._currentAdminView = viewName;
    const navId = ++window._currentAdminNavId;
    console.log(`🧭 [Navigation #${navId}] Navigate to:`, viewName);

    sessionStorage.setItem('admin_last_view', viewName);
    try {
        if (window.location.hash !== '#' + viewName) {
            history.replaceState(null, '', '#' + viewName);
        }
    } catch (e) {}

    // Sidebar Active State
    document.querySelectorAll('.nav-item-pro, .submenu-item').forEach(el => el.classList.remove('active'));
    document.querySelector(`.nav-item-pro[data-view="${viewName}"], .submenu-item[data-view="${viewName}"]`)?.classList.add('active');

    // Close Mobile Menu
    document.getElementById('admin-sidebar')?.classList.remove('open');
    document.getElementById('sidebar-overlay')?.classList.remove('active');

    // Re-apply role restrictions to keep sidebar locked
    if (window.AdminAuth && typeof window.AdminAuth.applyRoleRestrictions === 'function') {
        window.AdminAuth.applyRoleRestrictions();
    }

    const content = document.getElementById('content-area');
    if (content) content.innerHTML = '<div class="loader"></div>';

    // ROUTING TABLE
    try {
        if (viewName === 'users' && window.AdminViews.users) {
            await window.AdminViews.users();
        }
        else if (viewName === 'season_campaign') {
            if (window.AdminViews && window.AdminViews.season_campaign) {
                await window.AdminViews.season_campaign();
            } else {
                throw new Error("Season Campaign Admin Module not loaded");
            }
        }
        else if ((viewName === 'americanas_mgmt' || viewName === 'events') && window.AdminViews.americanas_mgmt) {
            await window.AdminViews.americanas_mgmt();
        }
        else if (viewName === 'americanas_create' && window.AdminViews && window.AdminViews.americanas_create) {
            await window.AdminViews.americanas_create();
        }

        else if (viewName === 'network_pulse') {
            if (window.NetworkPulseView) window.NetworkPulseView.render();
            else console.error("NetworkPulseView not loaded");
        }
        else if (viewName === 'entrenos_mgmt' && window.AdminViews && window.AdminViews.entrenos_mgmt) {
            await window.AdminViews.entrenos_mgmt();
        }
        else if (viewName === 'entrenos_create' && window.AdminViews && window.AdminViews.entrenos_create) {
            await window.AdminViews.entrenos_create();
        }
        else if (viewName === 'open_matches_mgmt' && window.AdminViews && window.AdminViews.open_matches_mgmt) {
            await window.AdminViews.open_matches_mgmt();
        }
        else if (viewName === 'open_matches_create' && window.AdminViews && window.AdminViews.open_matches_create) {
            await window.AdminViews.open_matches_create();
        }
        else if (viewName === 'open_matches_results' && window.AdminViews && window.AdminViews.open_matches_results) {
            await window.AdminViews.open_matches_results();
        }
        else if (viewName === 'matches') {
            if (window.loadResultsView) await window.loadResultsView('americana');
            else throw new Error("Results Module not loaded");
        }
        else if (viewName === 'entrenos_results') {
            if (window.loadResultsView) await window.loadResultsView('entreno');
            else throw new Error("Results Module not loaded");
        }
        else if (viewName === 'analytics') {
            if (window.AdminViews.analytics) await window.AdminViews.analytics();
            else throw new Error("Analytics Module not loaded");
        }
        else if (viewName === 'blog_posts') {
            if (window.AdminViews.blog_posts) await window.AdminViews.blog_posts();
            else throw new Error("Blog Module not loaded");
        }
        else if (viewName === 'database_health') {
            if (window.AdminViews.database_health) await window.AdminViews.database_health();
            else throw new Error("Health Module not loaded");
        }
        else if (viewName === 'system_telemetry') {
            if (window.AdminViews && window.AdminViews.system_telemetry) {
                await window.AdminViews.system_telemetry();
            } else if (window.toggleDiagnosticPanel) {
                window.toggleDiagnosticPanel();
            } else {
                throw new Error("Telemetry Module not loaded");
            }
        }
        else if (viewName === 'tournaments_mgmt') {
            if (window.AdminTournaments) window.AdminTournaments.init();
            else throw new Error("Tournaments Module not loaded");
        }
        else if (viewName === 'notifications_manager') {
            if (window.AdminViews && window.AdminViews.notifications_manager) {
                await window.AdminViews.notifications_manager();
            } else {
                throw new Error("Notifications Manager Module not loaded");
            }
        }
        else {
            // Fallback for Simulator or others not yet refactored logic
            if (window.AdminViews && window.AdminViews[viewName]) {
                await window.AdminViews[viewName]();
            } else {
                content.innerHTML = `<div style="padding:2rem; text-align:center;">🚧 Módulo ${viewName} en construcción o no encontrado.</div>`;
            }
        }
    } catch (e) {
        if (navId !== window._currentAdminNavId) {
            console.warn(`⚠️ [Navigation #${navId}] Ignored error from previous view "${viewName}" because active view is #${window._currentAdminNavId}`);
            return;
        }
        console.error("View Load Error:", e);
        if (content) content.innerHTML = `<div class="error-box">Error UI: ${e.message}</div>`;
    }
};


// --- INITIALIZATION ---
// Sync with AppInit Controller
document.addEventListener('AppReady', () => {
    console.log("💎 [Admin] AppReady signal received. Launching Auth...");
    window.AdminAuth.init();
});
