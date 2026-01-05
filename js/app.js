console.log("Sistema de Gestión Americanas - Loaded");

// --- 💉 UTILS ---
window.showToast = (message, type = 'info', title = 'Notificación') => {
    const container = document.querySelector('.toast-container') || (() => {
        const c = document.createElement('div');
        c.className = 'toast-container';
        document.body.appendChild(c);
        return c;
    })();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
        success: '✅',
        error: '❌',
        info: 'ℹ️',
        'live-score': '🎾'
    };

    toast.innerHTML = `
        <div class="toast-icon">${icons[type] || '🔔'}</div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-msg">${message}</div>
        </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(120%)';
        setTimeout(() => toast.remove(), 500);
    }, 5000);
};

// --- 🔕 NOTIFICATION SYSTEM ---
const Notifications = {
    items: [
        { id: 1, title: '¡Bienvenido Pro!', desc: 'Tu cuenta ha sido activada. Explora las próximas Americanas.', icon: '🎾', time: 'hace 5 min', unread: true },
        { id: 2, title: 'Pista Confirmada', desc: 'Se ha asignado la Pista 2 para la Americana del Viernes.', icon: '🏢', time: 'hace 1 hora', unread: true },
        { id: 3, title: 'Nivel Actualizado', desc: '¡Felicidades! Tu nivel ha subido a 3.75 tras tu última victoria.', icon: '📈', time: 'ayer', unread: false }
    ],

    init() {
        this.render();
        this.updateBadge();

        // Close drawer clicking outside
        document.addEventListener('click', (e) => {
            const drawer = document.getElementById('notification-drawer');
            const bell = document.querySelector('.notif-bell');
            if (drawer && !drawer.contains(e.target) && !bell.contains(e.target)) {
                drawer.classList.add('hidden');
            }
        });
    },

    toggle() {
        const drawer = document.getElementById('notification-drawer');
        if (drawer) drawer.classList.toggle('hidden');
    },

    render() {
        const container = document.getElementById('notif-list-container');
        if (!container) return;

        if (this.items.length === 0) {
            container.innerHTML = '<div class="notif-placeholder">No tienes notificaciones nuevas</div>';
            return;
        }

        container.innerHTML = this.items.map(n => `
            <div class="notif-item ${n.unread ? 'unread' : ''}" onclick="Notifications.markAsRead(${n.id})">
                <div class="notif-icon" style="background: var(--pt-blue-light);">${n.icon}</div>
                <div class="notif-content">
                    <div class="notif-title">${n.title}</div>
                    <div class="notif-desc">${n.desc}</div>
                    <div class="notif-time">${n.time}</div>
                </div>
            </div>
        `).join('');
    },

    updateBadge() {
        const count = this.items.filter(n => n.unread).length;
        const badge = document.getElementById('unread-count');
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    },

    markAsRead(id) {
        const item = this.items.find(n => n.id === id);
        if (item) {
            item.unread = false;
            this.render();
            this.updateBadge();
        }
    },

    markAllRead() {
        this.items.forEach(n => n.unread = false);
        this.render();
        this.updateBadge();
    },

    goToAll() {
        showToast("Cargando historial completo de actividad...", "info");
        this.toggle();
    }
};

// --- 🧠 APPU STORE (Centralized State) ---
const AppStore = {
    user: null,
    activeView: 'americanas',
    data: {
        players: [],
        americanas: [],
        matches: []
    },

    async init() {
        const stored = localStorage.getItem('currentUser');
        if (stored) {
            try {
                this.user = JSON.parse(stored);
                console.log("👤 User loaded from storage:", this.user.name);
            } catch (e) {
                console.error("❌ Storage Error:", e);
                localStorage.removeItem('currentUser');
            }
        }
        await Auth.check();
    },

    setUser(user) {
        this.user = user;
        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
        } else {
            localStorage.removeItem('currentUser');
        }
        Auth.check(); // Trigger visual updates
    }
};

// --- 🌐 ROUTER (Navigation Brain) ---
const Router = {
    async navigate(view) {
        console.log(`🚀 Navigating to: ${view}`);
        AppStore.activeView = view;

        // UI Update - Enterprise Selectors
        const navItems = document.querySelectorAll('.nav-item-pro');
        navItems.forEach(nav => {
            nav.classList.toggle('active', nav.getAttribute('data-view') === view);
        });

        const pageTitle = document.getElementById('page-title');
        const contentArea = document.getElementById('content-area');

        if (!contentArea) return;
        contentArea.innerHTML = '<div class="loader"></div>';

        // Update Header Title based on view
        if (pageTitle) {
            const titles = {
                'dashboard': 'PLAY HUB',
                'americanas': 'CATÁLOGO DE EVENTOS',
                'community': 'COMUNIDAD ACTIVA',
                'tournament-live': 'CENTRO DE RETRANSMISIÓN',
                'rankings': 'RANKING & PERFIL',
                'admin': 'PANEL DE CONTROL'
            };
            pageTitle.textContent = titles[view] || 'PLAYTOMIC';
        }

        // --- NEW: MOBILE NAV ACTIVE STATE ---
        const mobileNavItems = document.querySelectorAll('.mobile-nav-item');
        mobileNavItems.forEach(item => {
            const onclick = item.getAttribute('onclick') || "";
            item.classList.toggle('active', onclick.includes(`'${view}'`));
        });

        try {
            switch (view) {
                case 'dashboard': await renderDashboardView(); break;
                case 'americanas': await renderAmericanasView(); break;
                case 'community': await renderCommunityView(); break;
                case 'tournament-live': renderLiveView(); break;
                case 'rankings': await renderRankingsView(); break;
                case 'admin': await renderAdminView(); break;
                default: await renderDashboardView();
            }
        } catch (e) {
            console.error(`❌ Load Error [${view}]:`, e);
            contentArea.innerHTML = `<div style="padding:2rem; text-align:center; color:var(--danger)"><h3>Error de Sistema</h3><p>${e.message}</p></div>`;
        }
    }
};

// --- 🔐 AUTH SERVICE ---
const Auth = {
    async check() {
        const modal = document.getElementById('auth-modal');
        const shell = document.querySelector('.app-shell');
        const user = AppStore.user;

        if (!user) {
            document.body.style.overflow = 'hidden';
            if (modal) modal.classList.remove('hidden');
            if (shell) shell.style.display = 'none';
        } else if (user.status === 'pending') {
            showToast("Tu cuenta requiere activación corporativa.", "info");
            if (modal) modal.classList.remove('hidden');
            if (shell) shell.style.display = 'none';
        } else {
            document.body.style.overflow = 'auto';
            if (modal) modal.classList.add('hidden');
            if (shell) shell.style.display = 'flex';
            this.updateHeaderUI(user);
        }
    },

    bypassLogin() {
        const noa = {
            id: "admin-noa",
            name: "NOA (BYPASS)",
            phone: "NOA",
            role: "admin",
            status: "active"
        };
        alert("🚨 ACTIVANDO BYPASS DE EMERGENCIA - NOA");
        AppStore.setUser(noa);
        Router.navigate('dashboard');
    },

    async login(phoneInput, password) {
        try {
            const rawPhone = (phoneInput || "").toString().trim().toUpperCase();
            const rawPass = (password || "").toString().trim().toUpperCase();

            console.log(`🔑 Login Attempt: [${rawPhone}]`);

            // 1. EMERGENCY MASTER OVERRIDES (BEFORE ANY DB CALL)
            const isAlex = (rawPhone.endsWith("649219350") || rawPhone === "649219350") && rawPass === "JARABA";
            const isNoa = rawPhone === "NOA" && rawPass === "NOA21";

            if (isAlex || isNoa) {
                alert(`🔓 ACCESO MAESTRO DETECTADO: ${isNoa ? 'NOA' : 'ALEX'}`);
                const adminUser = {
                    id: isNoa ? "admin-noa" : "admin-master",
                    name: isNoa ? "NOA (ADMIN)" : "ALEX (ADMIN)",
                    phone: isNoa ? "NOA" : "649219350",
                    role: "admin",
                    status: "active"
                };
                AppStore.setUser(adminUser);
                Router.navigate('dashboard');
                return true;
            }

            // 2. REGULAR DB LOGIN
            const cleanPhone = rawPhone.replace(/\D/g, '');
            const dbUser = await FirebaseDB.players.getByPhone(cleanPhone);

            if (!dbUser) throw new Error("Usuario no encontrado.");
            if (dbUser.password !== password) throw new Error("Contraseña incorrecta.");
            if (dbUser.status !== 'active') throw new Error("Tu cuenta aún no ha sido activada.");

            AppStore.setUser(dbUser);
            showToast(`¡Hola de nuevo, ${dbUser.name}!`, "success");
            Router.navigate('americanas');
            return true;
        } catch (e) {
            showToast(e.message, "error");
            throw e;
        }
    },

    async register(formData) {
        try {
            const phone = formData.get('phone').replace(/\s+/g, '').replace(/-/g, '');
            const existing = await FirebaseDB.players.getByPhone(phone);
            if (existing) throw new Error("Este teléfono ya está registrado.");

            const newUser = await FirebaseDB.players.create({
                name: formData.get('name'),
                phone: phone,
                password: formData.get('password'),
                gender: formData.get('gender'),
                self_rate_level: formData.get('self_rate_level'),
                play_preference: formData.get('play_preference') || 'indifferent',
                category_preference: formData.get('category_preference') || 'mixed',
                role: 'player',
                status: 'pending',
                matches_played: 0,
                win_rate: 0
            });

            showToast("Registro con éxito. Espera a ser activado.", "success");
            toggleAuthMode('login');
            return newUser;
        } catch (e) {
            showToast(e.message, "error");
            throw e;
        }
    },

    updateHeaderUI(user) {
        const adminTab = document.getElementById('nav-admin');
        if (adminTab) adminTab.style.display = user.role === 'admin' ? 'flex' : 'none';

        const headerName = document.getElementById('header-username');
        if (headerName) headerName.textContent = user.name.toUpperCase();
    },

    logout() {
        AppStore.setUser(null);
        location.reload();
    }
};

// --- UI Utilities ---
// (We use window.showToast defined at the top)

// Sidebar Profile Update (Run on load)
const userProfile = document.querySelector('.user-profile');
if (userProfile) {
    userProfile.innerHTML = `
        <div class="avatar">U</div>
        <div class="user-info">
            <div class="name">Usuario</div>
            <div class="role">Invitado</div>
        </div>
        <button onclick="Auth.logout()" style="background:none; border:none; color: var(--danger); cursor:pointer; font-size: 1.2rem; margin-left: auto;">
            🛑
        </button>
    `;
}

function getSkeletonRows(count = 5) {
    return Array(count).fill(0).map(() => `
        <div class="skeleton skeleton-row"></div>
    `).join('');
}

// --- 🏗️ INITIALIZATION HANDLED AT BOTTOM OF FILE ---

// --- 🛠️ ADMIN ACTIONS ---
window.approveUser = async (id) => {
    try {
        await FirebaseDB.players.update(id, { status: 'active' });
        showToast("Usuario aprobado correctamente", "success");
        Router.navigate('admin');
    } catch (e) { showToast(e.message, "error"); }
};

window.rejectUser = async (id) => {
    if (!confirm("¿Seguro que quieres rechazar este usuario?")) return;
    try {
        await FirebaseDB.players.delete(id);
        showToast("Usuario rechazado", "info");
        Router.navigate('admin');
    } catch (e) { showToast(e.message, "error"); }
};

async function renderAdminView() {
    const allPlayers = await fetchPlayers();
    const activeUsers = allPlayers.filter(p => p.status === 'active' && p.role !== 'admin');
    const pendingUsers = allPlayers.filter(p => p.status === 'pending');

    const usersList = activeUsers.map(p => `
    <tr style="border-bottom: 1px solid var(--border-color);">
        <td style="padding: 1rem;">
            <div style="font-weight: 600; color: var(--text);">${p.name}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">${p.phone}</div>
        </td>
        <td style="padding: 1rem;"><span style="color: white; font-family: monospace;">${p.password || '⛔ N/A'}</span></td>
        <td style="padding: 1rem;">
            <span style="background: var(--surface-hover); padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;">${(p.role || 'player').toUpperCase()}</span>
        </td>
        <td style="padding: 1rem;">
            <span style="background: var(--success-dim); color: var(--success); padding: 4px 8px; border-radius: 4px; font-size: 0.75rem;">✓ ACTIVO</span>
        </td>
        <td style="padding: 1rem;">
                <button class="btn-secondary" style="color: var(--danger); border-color: var(--danger); font-size: 0.75rem;" onclick="blockUser('${p.id}')">Bloquear</button>
        </td>
    </tr>
`).join('');

    const pendingSection = pendingUsers.length > 0 ? `
    <div class="glass-panel" style="margin-top: 2rem; border: 1px solid var(--warning);">
        <h3 style="margin-bottom: 1rem; color: var(--warning);">⏳ Usuarios Pendientes (${pendingUsers.length})</h3>
        <table style="width: 100%; border-collapse: collapse; text-align: left;">
            <thead>
                <tr style="border-bottom: 1px solid var(--border-color); color: var(--text-muted); font-size: 0.8rem;">
                    <th style="padding: 1rem;">Usuario</th>
                    <th style="padding: 1rem;">Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${pendingUsers.map(p => `
                    <tr>
                        <td style="padding:1rem;"><b>${p.name}</b><br>${p.phone}</td>
                        <td style="padding:1rem;">
                            <button class="btn-primary" style="font-size:0.75rem;" onclick="approveUser('${p.id}')">Aprobar</button>
                            <button class="btn-secondary" style="font-size:0.75rem; color:var(--danger);" onclick="rejectUser('${p.id}')">Eliminar</button>
                        </td>
                    </tr>`).join('')}
            </tbody>
        </table>
    </div>` : '';

    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = `
    <h2 style="margin-bottom:2rem;">⚙️ PANEL CONTROL</h2>
    <div class="glass-panel">
        <h3 style="margin-bottom:1rem;">JUGADORES ACTIVOS</h3>
        <table style="width:100%; border-collapse:collapse;">
            <thead>
                <tr style="font-size:0.8rem; color:var(--text-muted);">
                    <th>USUARIO</th><th>CLAVE</th><th>ROL</th><th>ESTADO</th><th>ACCIONES</th>
                </tr>
            </thead>
            <tbody>${usersList}</tbody>
        </table>
    </div>
    ${pendingSection}
`;
}

// Global Helpers
window.toggleAuthMode = (mode) => {
    document.getElementById('login-form').classList.toggle('hidden', mode !== 'login');
    document.getElementById('register-form').classList.toggle('hidden', mode !== 'register');
};


// Global for access if needed, but preferably scoped.
// Moving these inside loadView or keeping global is fine if consistent.
const pageTitle = document.getElementById('page-title');
const contentArea = document.getElementById('content-area');

// Enterprise Live Hub (Broadcast Center)
// Enterprise Live Hub (Broadcast Center)
async function renderLiveView() {
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = `
        <div class="live-hub-layout">
            <div class="live-sidebar" id="live-match-list">
                <div class="sidebar-header-live">PARTIDOS ACTIVOS</div>
                <div class="loader-mini" style="margin: 2rem auto; display: block;"></div>
            </div>
            <div class="broadcast-main" id="live-broadcast-area">
                <div class="glass-card-enterprise" style="height: 100%; display: flex; align-items: center; justify-content: center; text-align: center;">
                    <div>
                        <h2 style="color: var(--primary); margin-bottom: 1rem;">SELECCIONA UN PARTIDO</h2>
                        <p style="color: var(--text-muted);">Elige un partido de la lista para ver la retransmisión en vivo.</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Listen to matches in real-time
    const unsubscribe = db.collection('matches')
        .where('status', '==', 'live')
        .onSnapshot(snapshot => {
            const matches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            updateLiveMatchList(matches);
        });

    // Cleanup listener when navigating away
    const originalNavigate = Router.navigate;
    Router.navigate = async (view) => {
        unsubscribe();
        Router.navigate = originalNavigate;
        return await Router.navigate(view);
    };
}

function updateLiveMatchList(matches) {
    const list = document.getElementById('live-match-list');
    if (!list) return;

    if (matches.length === 0) {
        list.innerHTML = `
            <div class="sidebar-header-live">PARTIDOS ACTIVOS</div>
            <div style="padding: 2rem; text-align: center; color: var(--text-muted); font-size: 0.8rem;">
                No hay partidos en curso actualmente.
            </div>
        `;
        return;
    }

    list.innerHTML = `
        <div class="sidebar-header-live">PARTIDOS ACTIVOS</div>
        ${matches.map((m, i) => `
            <div class="live-match-selector ${i === 0 ? 'active' : ''}" onclick="selectLiveMatch('${m.id}')" id="live-sel-${m.id}">
                <div class="status-dot pulse"></div>
                <div class="match-info">
                    <div class="title">PISTA ${m.court}</div>
                    <div class="sub">${m.team_a_names} vs ${m.team_b_names}</div>
                </div>
            </div>
        `).join('')}
    `;

    if (matches.length > 0 && !window.selectedLiveMatchId) {
        selectLiveMatch(matches[0].id);
    }
}

window.selectLiveMatch = async (matchId) => {
    window.selectedLiveMatchId = matchId;

    // Highlight selector
    document.querySelectorAll('.live-match-selector').forEach(el => el.classList.remove('active'));
    document.getElementById(`live-sel-${matchId}`)?.classList.add('active');

    const area = document.getElementById('live-broadcast-area');
    if (!area) return;

    // Fetch match details
    const doc = await db.collection('matches').doc(matchId).get();
    const m = { id: doc.id, ...doc.data() };

    area.innerHTML = `
        <div class="glass-card-enterprise broadcast-screen" style="background: #000; border: 2px solid var(--primary-glow); position: relative; overflow: hidden; height: 320px; box-shadow: 0 0 30px rgba(204, 255, 0, 0.1);">
            <div class="broadcast-header" style="position: absolute; top: 20px; left: 20px; right: 20px;">
                <div class="live-tag" style="background: linear-gradient(90deg, #ff0000, #ff4444); color: white; padding: 4px 12px; border-radius: 4px; font-weight: 900; font-size: 0.7rem; display: inline-flex; align-items: center; gap: 6px;">
                    <span style="width: 8px; height: 8px; background: white; border-radius: 50%; animation: pulse-opacity 1s infinite;"></span> EN DIRECTO • PISTA ${m.court}
                </div>
                <div style="float: right; color: rgba(255,255,255,0.4); font-size: 0.6rem; font-weight: 800; text-transform: uppercase;">
                    SIGNAL: 4K HIGH DEPTH • LATENCY: 8ms
                </div>
            </div>

            <div class="scoreboard-pro" style="position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%); width: 90%; background: rgba(0,0,0,0.85); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; display: flex; align-items: center; padding: 1.5rem;">
                <div class="team team-a" style="flex: 1; display: flex; align-items: center; gap: 1rem;">
                    <div style="width: 44px; height: 44px; background: white; color: black; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 1.2rem;">${m.team_a_names.charAt(0)}</div>
                    <div class="team-names" style="font-weight: 800; font-size: 1.1rem; color: white;">${m.team_a_names.split(' / ')[0]}<br><span style="font-size: 0.7rem; opacity: 0.5;">${m.team_a_names.split(' / ')[1] || ''}</span></div>
                    <div style="margin-left: auto; font-size: 2.2rem; font-weight: 900; color: var(--primary);">${m.score_a}</div>
                </div>

                <div class="score-center" style="padding: 0 2rem; border-left: 1px solid rgba(255,255,255,0.1); border-right: 1px solid rgba(255,255,255,0.1); display: flex; flex-direction: column; align-items: center; gap: 4px;">
                    <div style="font-size: 0.6rem; color: #64748b; font-weight: 900; letter-spacing: 2px;">VS</div>
                    <div style="font-size: 0.5rem; color: var(--primary); font-weight: 800; background: rgba(204,255,0,0.1); padding: 2px 8px; border-radius: 10px;">PRO LEAGUE</div>
                </div>

                <div class="team team-b" style="flex: 1; display: flex; align-items: center; gap: 1rem; flex-direction: row-reverse; text-align: right;">
                    <div style="width: 44px; height: 44px; background: rgba(255,255,255,0.1); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 1.2rem;">${m.team_b_names.charAt(0)}</div>
                    <div class="team-names" style="font-weight: 800; font-size: 1.1rem; color: white;">${m.team_b_names.split(' / ')[0]}<br><span style="font-size: 0.7rem; opacity: 0.5;">${m.team_b_names.split(' / ')[1] || ''}</span></div>
                    <div style="margin-right: auto; font-size: 2.2rem; font-weight: 900; color: white;">${m.score_b}</div>
                </div>
            </div>
            
            <!-- Scanline effect -->
            <div style="position: absolute; top:0; left:0; right:0; bottom:0; padding: 1.5rem; pointer-events: none; background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06)); background-size: 100% 2px, 3px 100%;"></div>
        </div>

        <div class="live-stats-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 1.5rem;">
            <div class="glass-card-enterprise" style="background: white; border: 1px solid #e2e8f0; padding: 1.5rem;">
                <h3 style="margin: 0 0 1rem 0; color: #1e293b; font-size: 0.8rem; letter-spacing: 1px;">ESTADÍSTICAS EN TIEMPO REAL</h3>
                <div class="pro-stat-bars">
                    <div class="bar-row" style="margin-bottom: 0.8rem;">
                        <div style="display: flex; justify-content: space-between; font-size: 0.7rem; font-weight: 800; color: #64748b; margin-bottom: 4px;">
                            <span>EFECTIVIDAD TEAM A</span>
                            <span>${Math.round((m.score_a / (m.score_a + m.score_b || 1)) * 100)}%</span>
                        </div>
                        <div style="height: 6px; background: #f1f5f9; border-radius: 3px;"><div style="width: ${(m.score_a / (m.score_a + m.score_b || 1)) * 100}%; height: 100%; background: #2563eb; border-radius: 3px;"></div></div>
                    </div>
                    <div class="bar-row">
                        <div style="display: flex; justify-content: space-between; font-size: 0.7rem; font-weight: 800; color: #64748b; margin-bottom: 4px;">
                            <span>EFECTIVIDAD TEAM B</span>
                            <span>${Math.round((m.score_b / (m.score_a + m.score_b || 1)) * 100)}%</span>
                        </div>
                        <div style="height: 6px; background: #f1f5f9; border-radius: 3px;"><div style="width: ${(m.score_b / (m.score_a + m.score_b || 1)) * 100}%; height: 100%; background: #94a3b8; border-radius: 3px;"></div></div>
                    </div>
                </div>
            </div>
            <div class="glass-card-enterprise" style="background: white; border: 1px solid #e2e8f0; padding: 1.5rem;">
                <h3 style="margin: 0 0 1rem 0; color: #1e293b; font-size: 0.8rem; letter-spacing: 1px;">DIAGNOSTICO DE PARTIDO</h3>
                <div class="live-log" style="font-size: 0.75rem; color: #64748b; font-weight: 500;">
                    <div style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;"><span style="color: #2563eb; font-weight: 800;">[INFO]</span> Alta intensidad detectada en red.</div>
                    <div style="padding: 8px 0;"><span style="color: #2563eb; font-weight: 800;">[IA]</span> Probabilidad de victoria cambiante.</div>
                </div>
            </div>
        </div>
    `;
};


// Enterprise Dashboard (Main Control Hub)
async function renderDashboardView() {
    const contentArea = document.getElementById('content-area');

    contentArea.innerHTML = `
        <div class="pt-dashboard" style="display: flex; flex-direction: column; gap: 1.5rem;">
            <!-- Section: No te olvides -->
            <div class="pt-section" style="padding: 1rem 0;">
            <!-- Live Notifications Ticker -->
            <div class="pt-live-ticker">
                <div class="pt-live-dot"></div>
                <div class="pt-ticker-content" id="live-news-ticker">Sintonizando últimas noticias del club...</div>
            </div>

            <!-- High Impact Hero Card (Featured Event) -->
            <div id="pt-hero-container">
                <div class="pt-hero-card">
                    <div class="pt-hero-badge">DESTACADO</div>
                    <div style="font-size: 1.4rem; font-weight: 900; margin-bottom: 0.5rem; line-height: 1.2;">SIM 4 PISTAS - 12:43</div>
                    <p style="font-size: 0.85rem; opacity: 0.9; margin-bottom: 1.5rem;">Viernes, 10 Enero • 18:30h @ Somos Padel Barcelona</p>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: 800; font-size: 1.1rem; color: var(--pt-neon);">15€ / pers</span>
                        <button class="btn-primary" style="background: var(--pt-neon); color: var(--pt-blue-deep); padding: 8px 16px; border-radius: 20px; border:none; font-weight: 800; font-size: 0.75rem; box-shadow: 0 4px 10px var(--pt-neon-glow);">ME APUNTO</button>
                    </div>
                    <div style="position: absolute; right: -10px; bottom: 0; font-size: 6rem; opacity: 0.15; transform: rotate(-15deg);">🎾</div>
                </div>
            </div>

            <div id="my-next-match-container"></div>

            <!-- Hub Grid (Circular Icons) -->
            <div class="pt-hub-grid">
                <div class="pt-hub-item" onclick="Router.navigate('americanas')">
                    <button class="pt-circle-btn">🎾</button>
                    <span class="pt-hub-label">Reservar pista</span>
                </div>
                <div class="pt-hub-item">
                    <button class="pt-circle-btn" style="background: #ccff00;">🎓</button>
                    <span class="pt-hub-label">Aprender</span>
                </div>
                <div class="pt-hub-item">
                    <button class="pt-circle-btn" style="background: #ccff00;">🏆</button>
                    <span class="pt-hub-label">Competir</span>
                </div>
                <div class="pt-hub-item" onclick="Router.navigate('americanas')">
                    <button class="pt-circle-btn" style="background: #ccff00;">🔍</button>
                    <span class="pt-hub-label">Buscar partido</span>
                </div>
            </div>

            <!-- Featured Banner (Playtomic Wrapped Style) -->
            <div class="pt-banner" style="background: linear-gradient(90deg, #2563EB, #3b82f6); border-radius: 16px; padding: 1.5rem; color: white; position: relative; overflow: hidden;">
                <h2 style="font-size: 1.5rem; margin-bottom: 0.5rem; color: white;">Playtomic Wrapped 2025</h2>
                <p style="font-size: 0.9rem; opacity: 0.9; margin-bottom: 1rem;">Revive tus momentos en la pista</p>
                <button style="background: white; color: #2563EB; border: none; padding: 0.6rem 1.2rem; border-radius: 20px; font-weight: 800; font-size: 0.8rem;">Descúbrelo ahora</button>
                <div style="position: absolute; right: -20px; bottom: -20px; font-size: 6rem; opacity: 0.2;">🎾</div>
            </div>

            <!-- User Status / Stats -->
            <div class="dashboard-grid-enterprise" style="margin-top: 1rem; border:none; display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div class="glass-card-enterprise highlight-pro" style="background: white; border: 1px solid #e2e8f0; text-align: center; padding: 1.5rem;">
                    <h3 style="margin-bottom: 0.5rem; color: #64748b;">PARTIDAS</h3>
                    <div class="stat-value-pro" style="font-size: 2.5rem; color: #2563EB;">${AppStore.user?.matches_played || '0'}</div>
                    <span style="font-size: 0.7rem; color: #64748b; font-weight: 800;">EN SOMOSPADEL</span>
                </div>

                <div class="glass-card-enterprise" style="background: white; border: 1px solid #e2e8f0; text-align: center; padding: 1.5rem;">
                    <h3 style="margin-bottom: 0.5rem; color: #64748b;">WIN RATE</h3>
                    <div class="stat-value-pro" style="font-size: 2.5rem; color: #2563EB;">${AppStore.user?.win_rate || '0'}%</div>
                    <span style="font-size: 0.7rem; color: #64748b; font-weight: 800;">SEASON 2026</span>
                </div>
            </div>

            <!-- Section: Próximas Americanas -->
            <div class="pt-section">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h3 style="color: #1e293b; font-size: 1.2rem; font-weight: 800; margin: 0; border:none; text-transform: none; letter-spacing: normal;">Próximas Americanas</h3>
                    <button onclick="Router.navigate('americanas')" style="background: none; border: none; color: #2563EB; font-weight: 700; font-size: 0.9rem;">Ver todas</button>
                </div>
                <div id="visual-planning-container" style="display: flex; flex-direction: column; gap: 1rem;">
                    <div class="loader"></div>
                </div>
            </div>
        </div>
    `;

    // Initialize logic
    renderPlanningWidget('all');
    checkAndRenderMyMatch();
    initLiveNewsTicker();

    // Add pulse to notification icon
    const bellIcon = document.querySelector('.top-actions i');
    if (bellIcon) bellIcon.parentElement.classList.add('pt-notification-pulse');
}

function initLiveNewsTicker() {
    const ticker = document.getElementById('live-news-ticker');
    if (!ticker) return;

    const news = [
        "🏆 Nuevo ranking actualizado: Carlos (Sim) lidera con 4.33",
        "🎾 Americanas del fin de semana con un 90% de ocupación",
        "🔥 ¡Nuevos jugadores registrados hoy en la comunidad!",
        "🚀 Tu nivel ha evolucionado un +0.12 tras el último partido",
        "🏢 Pistas 1 y 2 reservadas para la Americana Pro de las 18:30"
    ];

    let i = 0;
    setInterval(() => {
        ticker.style.opacity = 0;
        setTimeout(() => {
            ticker.textContent = news[i];
            ticker.style.opacity = 1;
            i = (i + 1) % news.length;
        }, 500);
    }, 4000);
}

async function checkAndRenderMyMatch() {
    const container = document.getElementById('my-next-match-container');
    if (!container || !AppStore.user) return;

    try {
        const matches = await FirebaseDB.matches.getByAmericana('any'); // This is a bit heavy, in prod we'd filter by user in query
        // For now, let's get matches from all active americanas
        const americanas = await FirebaseDB.americanas.getAll();
        const activeIds = americanas.filter(a => a.status === 'in_progress').map(a => a.id);

        let myMatch = null;
        for (const aid of activeIds) {
            const mList = await FirebaseDB.matches.getByAmericana(aid);
            myMatch = mList.find(m => m.status === 'live' && (m.team_a_ids?.includes(AppStore.user.id) || m.team_b_ids?.includes(AppStore.user.id)));
            if (myMatch) break;
        }

        if (myMatch) {
            container.innerHTML = `
            <div class="glass-card-enterprise" style="background: var(--pt-blue); border: none; padding: 1.2rem; display: flex; align-items: center; gap: 1rem; color: white; margin-bottom: 1.5rem; position: relative; overflow: hidden;">
                <div style="position: absolute; top:0; right:0; padding: 5px 12px; background: rgba(255,255,255,0.2); font-size: 0.6rem; font-weight: 800;">EN JUEGO</div>
                <div style="font-size: 2rem;">🎾</div>
                <div style="flex: 1;">
                    <div style="font-weight: 800; font-size: 1.1rem;">Tu partido en Pista ${myMatch.court}</div>
                    <div style="font-size: 0.8rem; opacity: 0.9;">Marcador: ${myMatch.score_a} - ${myMatch.score_b}</div>
                </div>
                <button class="btn-primary" style="background: white; color: var(--pt-blue); border: none; font-size: 0.75rem; padding: 8px 16px;" onclick="Router.navigate('tournament-live')">VER LIVE</button>
            </div>
            `;
        } else {
            container.innerHTML = '';
        }
    } catch (e) { console.error(e); }
}

function initDashboardCharts() {
    const ctx = document.getElementById('levelsChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Iniciación', 'Intermedio', 'Avanzado', 'Pro'],
            datasets: [{
                data: [15, 45, 30, 10],
                backgroundColor: ['#3b82f6', '#ccff00', '#f59e0b', '#ef4444'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            cutout: '70%',
            plugins: {
                legend: { display: false }
            },
            maintainAspectRatio: false
        }
    });
}

async function renderPlanningWidget(filter = 'all') {
    const container = document.getElementById('visual-planning-container');
    if (!container) return;

    try {
        const [allAmericanas, allPlayers] = await Promise.all([
            FirebaseDB.americanas.getAll(),
            FirebaseDB.players.getAll()
        ]);

        let filtered = allAmericanas;
        if (filter === 'mine') {
            filtered = allAmericanas.filter(a => a.players?.includes(AppStore.user?.id));
        } else {
            filtered = allAmericanas.filter(a => a.status === 'open' || a.status === 'in_progress');
        }

        const upcoming = filtered.sort((a, b) => new Date(a.date) - new Date(b.date));

        if (upcoming.length === 0) {
            container.innerHTML = `<p style="padding:2rem; text-align:center; color:#64748b;">${filter === 'mine' ? 'No tienes competiciones activas.' : 'No hay eventos programados.'}</p>`;
            return;
        }

        // HERO SECTION (Update the top hero container with the most imminent one)
        const heroContainer = document.getElementById('pt-hero-container');
        if (heroContainer && upcoming.length > 0 && filter === 'all') {
            const h = upcoming[0];
            const joinedCount = h.players?.length || 0;
            const maxPlayers = h.max_courts * 4 || 16;
            const dateStr = new Date(h.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' });
            const isFull = joinedCount >= maxPlayers;

            heroContainer.innerHTML = `
            <div class="pt-hero-card" onclick="renderEventDetails('${h.id}')" style="cursor:pointer; background: var(--gradient-navy); border: 2px solid var(--sp-neon-muted); position: relative; overflow: hidden;">
                <div class="pt-hero-badge" style="background: var(--sp-neon); color: var(--sp-navy); font-weight: 900;">${isFull ? '🔥 AGOTADO' : '✨ PRÓXIMO EVENTO'}</div>
                <div style="font-size: 1.6rem; font-weight: 900; margin-bottom: 0.5rem; color: white; line-height: 1.1;">${h.name.toUpperCase()}</div>
                <p style="font-size: 0.9rem; color: var(--sp-neon); font-weight: 700; margin-bottom: 1.5rem; opacity: 0.9;">${dateStr} • ${h.time || '18:30'}h @ Somos Padel</p>
                
                <div style="display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 2;">
                    <div style="background: rgba(255,255,255,0.05); padding: 8px 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
                        <span style="font-weight: 800; font-size: 1.2rem; color: white;">${h.price || 15}€</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="font-size: 0.8rem; font-weight: 800; color: white;">👤 ${joinedCount}/${maxPlayers}</span>
                        <button class="btn-primary" style="background: var(--sp-neon); color: var(--sp-navy); padding: 10px 20px; border-radius: 30px; border:none; font-weight: 900; font-size: 0.8rem; box-shadow: 0 0 20px var(--sp-neon-glow);">${isFull ? 'VER DETALLES' : 'ME APUNTO'}</button>
                    </div>
                </div>
                
                <!-- Decorative background icon -->
                <div style="position: absolute; right: -20px; bottom: -20px; font-size: 8rem; opacity: 0.1; transform: rotate(-15deg); color: var(--sp-neon);">🎾</div>
            </div>
            `;
        }

        const otherEvents = (filter === 'all' && upcoming.length > 1) ? upcoming.slice(1) : upcoming;

        container.innerHTML = otherEvents.map(a => {
            const joinedCount = a.players?.length || 0;
            const maxPlayers = a.max_courts * 4 || 16;
            const price = a.price || 15;
            const dateStr = new Date(a.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' });
            const isFull = joinedCount >= maxPlayers;

            return `
            <div class="pt-event-card" onclick="renderEventDetails('${a.id}')" style="cursor:pointer; padding: 1.2rem; border-left: 6px solid ${isFull ? '#ef4444' : 'var(--sp-neon)'}; background: white; border-radius: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                <div class="pt-event-header" style="display: flex; gap: 1rem; align-items: center;">
                    <div class="pt-event-img" style="width: 50px; height: 50px; background: ${isFull ? '#fee2e2' : 'var(--sp-neon-muted)'}; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
                        ${isFull ? '🔥' : '🎾'}
                    </div>
                    <div class="pt-event-info" style="flex: 1;">
                        <div class="pt-event-meta" style="font-size: 0.7rem; color: var(--sp-text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">${dateStr} • ${a.time || '18:30'}h</div>
                        <div class="pt-event-title" style="font-size: 1.1rem; font-weight: 900; color: var(--sp-navy); display: flex; align-items: center; gap: 8px;">
                            ${a.name.toUpperCase()}
                            ${isFull ? '<span style="background: #ef4444; color: white; font-size: 0.6rem; padding: 2px 8px; border-radius: 20px;">LLENO</span>' : ''}
                        </div>
                    </div>
                    <div style="text-align: right;">
                         <div style="font-size: 1.2rem; font-weight: 900; color: var(--sp-navy);">${price}€</div>
                    </div>
                </div>
                
                <div style="margin-top: 1rem; display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 6px; font-size: 0.75rem; color: var(--sp-text-muted); font-weight: 600;">
                        <span style="font-size: 0.9rem;">📍</span> Somos Padel Barcelona
                    </div>
                    <div style="font-size: 0.8rem; font-weight: 800; color: ${isFull ? '#ef4444' : 'var(--sp-navy)'}; background: ${isFull ? '#fee2e2' : '#f1f5f9'}; padding: 4px 10px; border-radius: 12px;">
                        👤 ${joinedCount}/${maxPlayers}
                    </div>
                </div>
            </div>
            `;
        }).join('');

    } catch (e) {
        console.error("Planning Widget Error:", e);
        container.innerHTML = `<div class="error">Error cargando planificación.</div>`;
    }
}

async function handleAmericanaJoin(id, isJoined) {
    if (!AppStore.user) {
        showToast("Inicia sesión para apuntarte", "error");
        return;
    }

    const btn = document.getElementById(`btn-join-${id}`);
    if (btn) {
        btn.innerHTML = '<span class="loader-mini"></span>';
        btn.disabled = true;
    }

    try {
        if (isJoined) {
            await FirebaseDB.americanas.removePlayer(id, AppStore.user.id);
            showToast("Ya no estás apuntado a la americana", "info");
        } else {
            // 1. Double check capacity before joining
            const a = await FirebaseDB.americanas.getById(id);
            const joinedCount = a.players?.length || 0;
            const maxPlayers = a.max_courts ? a.max_courts * 4 : (a.maxPairs ? a.maxPairs * 2 : 16);

            if (joinedCount >= maxPlayers) {
                throw new Error("Lo sentimos, esta americana se ha llenado justo ahora. ⛔");
            }

            await FirebaseDB.americanas.addPlayer(id, AppStore.user.id);
            showToast("¡Te has apuntado con éxito! 🚀", "success");

            // 2. WhatsApp Messaging (Free Deep Link)
            sendConfirmationWhatsApp(a);
        }
        await renderPlanningWidget();
        await renderEventDetails(id); // Refresh current view
    } catch (e) {
        showToast(e.message, "error");
        if (btn) {
            btn.innerHTML = isJoined ? 'BORRARME ❌' : 'APUNTARME - 0€';
            btn.disabled = false;
        }
    }
}

function sendConfirmationWhatsApp(americana) {
    const user = AppStore.user;
    if (!user || !user.phone) return;

    const message = `🎾 ¡Hola! Soy el sistema de Americanas Padel PRO.\n\n✅ Confirmamos tu inscripción:\n🏆 *${americana.name}*\n📅 ${new Date(americana.date).toLocaleDateString()}\n⏰ ${americana.time || '18:30'}h\n\n📍 Somos Padel Barcelona\n\n¡Nos vemos en la pista! 🎾🚀`;
    const encodedMsg = encodeURIComponent(message);
    const waUrl = `https://wa.me/${user.phone.replace(/\D/g, '')}?text=${encodedMsg}`;

    // Open in a new tab after a short delay so toast is visible
    setTimeout(() => {
        if (confirm("¿Quieres recibir el recordatorio por WhatsApp?")) {
            window.open(waUrl, '_blank');
        }
    }, 1500);
}

async function renderActivityFeed() {
    const feed = document.getElementById('activity-feed-content');
    if (!feed) return;

    const activities = [
        { type: 'match', icon: '🎾', text: 'Nueva Americana abierta: Viernes Pro', time: '10m' },
        { type: 'result', icon: '🏆', text: 'Galan / Lebron ganaron 6-2', time: '25m' },
        { type: 'user', icon: '👤', text: 'Carlos se ha unido al ranking', time: '1h' },
        { type: 'live', icon: '🔴', text: 'Marcador actualizado en Pista 2', time: 'Justo ahora' }
    ];

    feed.innerHTML = activities.map(a => `
        <div class="activity-item" style="display: flex; align-items: flex-start; gap: 0.8rem;">
            <div style="font-size: 1rem; filter: drop-shadow(0 0 5px var(--primary-glow));">${a.icon}</div>
            <div>
                <div style="font-size: 0.85rem; margin-bottom: 2px; color: var(--text);">${a.text}</div>
                <div style="font-size: 0.65rem; color: var(--text-muted); font-weight: 700;">${a.time.toUpperCase()}</div>
            </div>
        </div>
        `).join('');
}



// Enterprise Rankings (Season Standings) - Playtomic Style
async function renderRankingsView() {
    const players = await fetchPlayers();
    const sortedPlayers = players.sort((a, b) => {
        if (b.win_rate !== a.win_rate) return b.win_rate - a.win_rate;
        return b.matches_played - a.matches_played;
    });

    const contentArea = document.getElementById('content-area');

    // PERSONAL SECTION (If logged in)
    let myStatsHtml = '';
    if (AppStore.user) {
        const me = players.find(p => p.id === AppStore.user.id) || AppStore.user;
        const level = parseFloat(me.self_rate_level || me.level || 3.5);
        const nextTarget = Math.ceil(level * 2) / 2; // Next 0.5 step
        const progress = ((level - (nextTarget - 0.5)) / 0.5) * 100;

        myStatsHtml = `
        <div class="glass-card-enterprise" style="background: white; margin-bottom: 2rem; padding: 1.5rem; border-left: 6px solid var(--sp-navy); border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h3 style="margin: 0; color: var(--sp-navy); font-size: 0.75rem; font-weight: 800; letter-spacing: 1px;">MI PROGRESO DE NIVEL</h3>
                <span class="pt-level-badge" style="font-size: 0.9rem; padding: 6px 14px; border-radius: 20px; background: var(--sp-navy); color: var(--sp-neon); font-weight: 900; border: 2px solid var(--sp-neon);">Lvl ${level.toFixed(2)}</span>
            </div>
            
            <div style="display: flex; align-items: flex-end; gap: 10px; margin-bottom: 1.2rem;">
                <div style="font-size: 2.5rem; font-weight: 900; color: var(--sp-navy); line-height: 1;">${level.toFixed(2)}</div>
                <div style="font-size: 0.8rem; color: var(--sp-text-muted); font-weight: 800; padding-bottom: 6px; text-transform: uppercase;">Top Player</div>
            </div>

            <div style="height: 12px; background: #f1f5f9; border-radius: 10px; overflow: hidden; position: relative; border: 1px solid var(--sp-border);">
                <div style="width: ${progress}%; height: 100%; background: var(--gradient-sp); border-radius: 10px; box-shadow: 0 0 15px var(--sp-neon-glow);"></div>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 0.8rem; font-size: 0.7rem; font-weight: 800; color: var(--sp-text-muted);">
                <span>${(nextTarget - 0.5).toFixed(1)}</span>
                <span style="color: var(--sp-navy);">OBJETIVO: ${nextTarget.toFixed(1)} 🚀</span>
            </div>
        </div>
        `;
    }

    contentArea.innerHTML = `
        <div class="pt-view-header pt-mb-0">
            <h2 style="font-size: 1.2rem; margin-bottom: 1rem;">Ranking Global</h2>
            <div class="pt-filters-row">
                <div class="pt-filter-chip active">Todos</div>
                <div class="pt-filter-chip">Masculino</div>
                <div class="pt-filter-chip">Femenino</div>
                <div class="pt-filter-chip">Nivel</div>
            </div>
        </div>

        <div style="padding: 1.5rem 1.5rem 0 1.5rem;">
            ${myStatsHtml}
        </div>

        <div class="pt-ranking-list">
            ${sortedPlayers.map((p, index) => {
        const isSelf = p.id === AppStore.user?.id;
        return `
                <div class="pt-ranking-item" style="${isSelf ? 'background: #eff6ff; border-left: 4px solid #2563eb' : ''}">
                    <div class="pt-rank-number">${index + 1}</div>
                    <div class="pt-rank-avatar">${p.name.charAt(0)}</div>
                    <div class="pt-rank-info">
                        <div class="pt-rank-name">${p.name} ${isSelf ? '(Tú)' : ''}</div>
                        <div class="pt-rank-sub">Nivel ${p.self_rate_level || p.level || '3.5'} • ${p.matches_played} partidos</div>
                    </div>
                    <div class="pt-rank-val">
                        <div class="pt-rank-score">${p.win_rate}%</div>
                        <div style="font-size: 0.65rem; font-weight: 800; color: #64748b;">WIN RATE</div>
                    </div>
                </div>
                `;
    }).join('')}
        </div>
    `;
}

async function renderCommunityView() {
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = `
        <div class="pt-view-header">
            <h2 style="font-size: 1.2rem; margin-bottom: 1rem;">Comunidad</h2>
            <div class="pt-tab-container" style="margin-bottom: 0;">
                <div class="pt-tab active">Actividad</div>
                <div class="pt-tab" onclick="showToast('Próximamente', 'info')">Grupos</div>
                <div class="pt-tab" onclick="showToast('Próximamente', 'info')">Amigos</div>
            </div>
        </div>

        <div style="padding: 1rem;">
            <div class="pt-search-bar">
                <span>🔍</span>
                <input type="text" placeholder="Buscar en la comunidad...">
            </div>

            <div id="activity-feed-container" style="margin-top: 1rem;">
                <!-- Activity / Chat Feed -->
                <div id="activity-feed-content" style="display: flex; flex-direction: column; gap: 1rem;">
                    <div class="loader"></div>
                </div>
            </div>
        </div>

        <!-- Float Chat Input (Playtomic style) -->
        <div style="position: fixed; bottom: 85px; left: 1.5rem; right: 1.5rem; background: white; padding: 0.8rem 1rem; border-radius: 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 10px; border: 1px solid var(--pt-border); z-index: 100;">
            <input type="text" id="community-chat-input" placeholder="Di algo a la comunidad..." style="flex: 1; border: none; background: transparent; font-size: 0.9rem; outline: none; color: var(--pt-text);">
            <button onclick="postToCommunity()" style="background: var(--pt-blue); color: white; border: none; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; transform: rotate(45deg);">✈️</button>
        </div>
    `;

    renderActivityFeed();
}

async function renderActivityFeed() {
    const container = document.getElementById('activity-feed-content');
    if (!container) return;

    try {
        // Fetch recent messages or activity
        const snapshot = await db.collection('community').orderBy('timestamp', 'desc').limit(20).get();
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (items.length === 0) {
            container.innerHTML = `<div style="text-align:center; padding: 4rem; color: #94a3b8;">¡Sé el primero en saludar! 👋</div>`;
            return;
        }

        container.innerHTML = items.map(msg => {
            const isMe = msg.user_id === AppStore.user?.id;
            const timeStr = msg.timestamp ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Ahora';

            return `
            <div style="display: flex; gap: 12px; align-items: flex-start; ${isMe ? 'flex-direction: row-reverse;' : ''}">
                <div class="pt-rank-avatar" style="width: 36px; height: 36px; font-size: 0.9rem; flex-shrink: 0; background: ${isMe ? 'var(--pt-blue)' : 'var(--pt-blue-light)'}; color: ${isMe ? 'white' : 'var(--pt-blue)'};">
                    ${msg.user_name?.charAt(0) || '?'}
                </div>
                <div style="max-width: 75%;">
                    <div style="display: flex; gap: 8px; align-items: baseline; margin-bottom: 2px; ${isMe ? 'flex-direction: row-reverse;' : ''}">
                        <span style="font-size: 0.75rem; font-weight: 800; color: #1e293b;">${msg.user_name}</span>
                        <span style="font-size: 0.6rem; color: #94a3b8;">${timeStr}</span>
                    </div>
                    <div style="background: ${isMe ? 'var(--pt-blue)' : 'white'}; color: ${isMe ? 'white' : '#1e293b'}; padding: 0.8rem 1rem; border-radius: 18px; border-top-${isMe ? 'right' : 'left'}-radius: 2px; font-size: 0.9rem; border: 1px solid ${isMe ? 'var(--pt-blue)' : 'var(--pt-border)'}; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
                        ${msg.text}
                    </div>
                </div>
            </div>
            `;
        }).join('') + '<div style="height: 100px;"></div>'; // Extra space for input

    } catch (e) {
        console.error("Feed Error:", e);
        container.innerHTML = `<div class="error">Error cargando feed.</div>`;
    }
}

window.postToCommunity = async () => {
    const input = document.getElementById('community-chat-input');
    const text = input.value.trim();
    if (!text || !AppStore.user) return;

    try {
        await db.collection('community').add({
            text: text,
            user_id: AppStore.user.id,
            user_name: AppStore.user.name,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        input.value = '';
        renderActivityFeed();
    } catch (e) {
        showToast("Error al enviar mensaje", "error");
    }
};


// Main View for "Programación"

async function renderAmericanasView() {
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = `
        <div class="pt-view-header">
            <h2 style="font-size: 1.2rem; margin-bottom: 1rem;">Competiciones</h2>
            <div class="pt-tab-container">
                <div class="pt-tab active" id="tab-available" onclick="switchAmericanasTab('all')">Disponible</div>
                <div class="pt-tab" id="tab-mine" onclick="switchAmericanasTab('mine')">Tus competiciones</div>
            </div>
            <div class="pt-filters-row">
                <div class="pt-filter-chip active">Todo</div>
                <div class="pt-filter-chip">Hoy</div>
                <div class="pt-filter-chip">Mañana</div>
                <div class="pt-filter-chip">Mixto</div>
                <div class="pt-filter-chip">Masculino</div>
            </div>
        </div>
        <div style="padding: 1.5rem;">
            <div id="visual-planning-container" style="display: flex; flex-direction: column; gap: 1rem;">
                <div class="loader"></div>
            </div>
        </div>
    `;

    renderPlanningWidget('all');
}

window.switchAmericanasTab = (tab) => {
    document.getElementById('tab-available').classList.toggle('active', tab === 'all');
    document.getElementById('tab-mine').classList.toggle('active', tab === 'mine');
    renderPlanningWidget(tab);
};

async function renderEventDetails(id) {
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = '<div class="loader"></div>';

    try {
        const [a, allPlayers] = await Promise.all([
            FirebaseDB.americanas.getById(id),
            FirebaseDB.players.getAll()
        ]);

        if (!a) throw new Error("Evento no encontrado");

        const joinedCount = a.players?.length || 0;
        const maxPlayers = a.max_courts * 4 || 16;
        const isJoined = a.players?.includes(AppStore.user?.id);
        const dateStr = new Date(a.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' });

        contentArea.innerHTML = `
            <div class="pt-details-view" style="padding-bottom: 120px;">
                <div class="pt-details-header" style="background: white; border-bottom: 1px solid var(--sp-border); padding: 2.5rem 1.5rem;">
                    <div style="color: var(--sp-navy); font-weight: 800; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 0.5rem; opacity: 0.6;">${dateStr} • ${a.time || '18:30'}h</div>
                    <h1 style="font-size: 2rem; font-weight: 900; margin-bottom: 0.5rem; color: var(--sp-navy); letter-spacing: -1px;">${a.name.toUpperCase()}</h1>
                    <div style="color: var(--sp-text-muted); font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 6px;">
                        <span style="color: var(--sp-neon); filter: drop-shadow(0 0 5px var(--sp-neon-glow));">📍</span> Somos Padel Barcelona
                    </div>

                    <div class="pt-action-circles" style="margin-top: 2.5rem;">
                        <div class="pt-action-circle">
                            <button class="pt-circle-btn-solid" style="background: var(--sp-navy); color: var(--sp-neon); border: 2px solid var(--sp-neon);">${a.price || 15}€</button>
                            <span style="font-size: 0.7rem; font-weight: 800; color: var(--sp-navy);">PRECIO</span>
                        </div>
                        <div class="pt-action-circle">
                            <button class="pt-circle-btn-outline" style="border: 2px solid var(--sp-border); color: var(--sp-navy);"><i class="fas fa-share-alt"></i></button>
                            <span style="font-size: 0.7rem; font-weight: 800; color: var(--sp-navy);">COMPARTIR</span>
                        </div>
                        <div class="pt-action-circle">
                            <button class="pt-circle-btn-outline" style="border: 2px solid var(--sp-border); color: var(--sp-navy);"><i class="fas fa-comment-dots"></i></button>
                            <span style="font-size: 0.7rem; font-weight: 800; color: var(--sp-navy);">CHAT</span>
                        </div>
                    </div>
                </div>

                <div class="pt-players-section" style="background: #f8fafc; border-radius: 32px 32px 0 0; margin-top: -32px; padding-top: 2.5rem;">
                    <div class="pt-section-title" style="padding: 0 1.5rem;">
                        <h3 style="font-weight: 900; color: var(--sp-navy); border:none; text-transform:none; font-size: 1.2rem;">JUGADORES <span style="color: var(--sp-neon); background: var(--sp-navy); padding: 2px 10px; border-radius: 12px; font-size: 0.9rem; margin-left: 8px;">${joinedCount}/${maxPlayers}</span></h3>
                        <a href="#" style="color: var(--sp-navy); font-weight: 800; font-size: 0.8rem; text-decoration: none; opacity: 0.6;">VER LIGA</a>
                    </div>

                    <div class="pt-avatar-list" style="padding: 1.5rem; gap: 1.2rem;">
                        ${(a.players || []).map(pid => {
            const p = allPlayers.find(u => u.id === pid);
            if (!p) return '';
            return `
                            <div class="pt-player-avatar-card">
                                <div class="pt-avatar-circle" style="width: 64px; height: 64px; border: 3px solid white; box-shadow: 0 8px 15px rgba(0,0,0,0.1);">
                                    <div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; background: var(--gradient-navy); color: var(--sp-neon); font-weight:900; font-size:1.4rem;">
                                        ${p.name.charAt(0)}
                                    </div>
                                </div>
                                <div class="pt-level-badge" style="background: var(--sp-neon); color: var(--sp-navy); font-weight: 900; border: 2px solid white; margin-top: -12px; padding: 2px 8px;">${p.self_rate_level || p.level || '3.5'}</div>
                                <span style="font-size: 0.75rem; font-weight: 800; color: var(--sp-navy); margin-top: 4px;">${p.name.split(' ')[0]}</span>
                            </div>
                            `;
        }).join('')}
                    </div>

                    <div style="margin: 2rem 1.5rem; border-top: 2px solid var(--sp-border); padding-top: 2rem;">
                        <h3 style="font-weight: 900; color: var(--sp-navy); margin-bottom: 1rem; border:none; text-transform:none; font-size: 1.1rem;">INFO DEL EVENTO</h3>
                        <div style="font-size: 0.95rem; color: var(--sp-text-muted); line-height: 1.8; font-weight: 600;">
                            <div style="display: flex; gap: 10px; margin-bottom: 0.5rem;"><span>🎾</span> Inscripción individual o doble</div>
                            <div style="display: flex; gap: 10px; margin-bottom: 0.5rem;"><span>📊</span> Nivel Open: 2.0 - 5.5</div>
                            <div style="display: flex; gap: 10px; margin-bottom: 1rem;"><span>✨</span> Formato Americano (Rey de Pista)</div>
                            <p style="background: var(--sp-neon-muted); padding: 1rem; border-radius: 16px; border-left: 4px solid var(--sp-neon); color: var(--sp-navy);">¡Únete a la mejor comunidad de pádel de Barcelona!</p>
                        </div>
                    </div>
                </div>

                <div class="pt-sticky-footer" style="padding: 1.5rem;">
                    <button id="btn-join-${a.id}" class="pt-btn-primary" 
                        ${!isJoined && joinedCount >= maxPlayers ? 'disabled style="background: #cbd5e1; color: #64748b; border: none; cursor: not-allowed; box-shadow: none;"' : 'style="background: var(--gradient-navy); color: var(--sp-neon); border: 2px solid var(--sp-neon); transform: none; box-shadow: 0 15px 35px var(--sp-neon-glow);"'}
                        onclick="handleAmericanaJoin('${a.id}', ${isJoined})">
                        ${isJoined ? 'CANCELAR INSCRIPCIÓN ❌' : (joinedCount >= maxPlayers ? 'CUPO COMPLETO ⛔' : 'APUNTARME AHORA 🎾')}
                    </button>
                </div>
            </div>
        `;

    } catch (e) {
        console.error(e);
        contentArea.innerHTML = `<div style="padding:2rem;">Error: ${e.message}</div>`;
    }
}

// --- New Grid Renderer (Style "SomosPadel") ---
async function renderAmericanaGrid(americanaId) {
    const container = document.getElementById('grid-container');
    if (!container) return;

    container.innerHTML = '<div class="loader"></div>';

    try {
        const matches = await FirebaseDB.matches.getByAmericana(americanaId);
        if (matches.length === 0) {
            container.innerHTML = '<div style="padding:2rem; text-align:center;">No hay partidos generados aún.</div>';
            return;
        }

        // 1. Determine Dimensions
        const rounds = [...new Set(matches.map(m => m.round))].sort((a, b) => a - b);
        const maxCourt = Math.max(...matches.map(m => m.court));

        // 2. Build Grid HTML
        let gridHTML = `
    <div class="schedule-container">
            <div class="schedule-grid" style="grid-template-columns: 80px repeat(${maxCourt}, minmax(180px, 1fr));">
                <!-- Header Row -->
                <div class="grid-header">HORA</div>
                ${Array.from({ length: maxCourt }, (_, i) => `<div class="grid-header">PISTA ${i + 1}</div>`).join('')}

                <!-- Rows -->
                ${rounds.map(round => {
            // Mock Time: Start at 18:00 + 20 mins per round
            const baseTime = new Date();
            baseTime.setHours(18, 0, 0);
            baseTime.setMinutes(baseTime.getMinutes() + (round - 1) * 20);
            const timeStr = baseTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            let rowHTML = `<div class="round-header">R${round}<br><span style="font-size:0.7rem">${timeStr}</span></div>`;

            for (let c = 1; c <= maxCourt; c++) {
                const match = matches.find(m => m.round === round && m.court === c);
                if (match) {
                    const statusClass = match.status; // scheduled, live, finished
                    const statusLabel = match.status === 'live' ? 'EN JUEGO' : (match.status === 'finished' ? 'FINALIZADO' : 'PENDIENTE');

                    rowHTML += `
                                    <div class="match-card-program">
                                        <div class="match-card-header ${statusClass}">
                                            <span>${statusLabel}</span>
                                            <span>M${match.id}</span>
                                        </div>
                                        <div class="match-players">
                                            <div style="border-bottom: 1px solid #eee; padding-bottom: 4px; margin-bottom: 4px;">
                                                ${match.team_a_names.replace(' / ', '<br>')}
                                            </div>
                                            <div>
                                                ${match.team_b_names.replace(' / ', '<br>')}
                                            </div>
                                        </div>
                                        <div class="match-score-footer">
                                            ${match.status === 'scheduled'
                            ? '<span style="color:#999">- vs -</span>'
                            : `<span class="score-badge">${match.score_a} - ${match.score_b}</span>`
                        }
                                        </div>
                                    </div>
                                `;
                }
            }
            return rowHTML;
        }).join('')}
            </div>
    </div>`;
        container.innerHTML = gridHTML;
    } catch (e) {
        container.innerHTML = `<div class="error-box">Error: ${e.message}</div>`;
    }
}



// --- 🛠️ DATA HELPERS ---
async function fetchAmericanas() { return await FirebaseDB.americanas.getAll(); }
async function fetchPlayers() { return await FirebaseDB.players.getAll(); }

// Global Join Function
window.joinAmericana = async (eventId) => {
    if (!AppStore.user) return showToast("Inicia sesión para apuntarte.", "info");
    if (!confirm("¿Inscribirte en este torneo?")) return;

    try {
        await FirebaseDB.americanas.addPlayer(eventId, AppStore.user.id);
        showToast("¡Te has apuntado con éxito!", "success");
        Router.navigate('americanas');
    } catch (e) { showToast(e.message, "error"); }
};

async function updateTicker() {
    try {
        const americanas = await fetchAmericanas();
        const active = americanas.find(a => a.status === 'in_progress');
        if (!active) {
            document.getElementById('ticker-track-content').textContent = "BIENVENIDOS A LA TEMPORADA 2026 /// PRÓXIMO TORNEO ESTE SÁBADO /// INSCRIPCIONES ABIERTAS";
            return;
        }

        const matches = await FirebaseDB.matches.getByAmericana(active.id);
        const finished = matches.filter(m => m.status === 'finished').sort((a, b) => b.round - a.round).slice(0, 5);

        if (finished.length > 0) {
            const text = finished.map(m => `RESULTADO PISTA ${m.court}: ${m.team_a_names.split(' / ')[0]}... ${m.score_a} - ${m.score_b} ${m.team_b_names.split(' / ')[0]}... /// `).join('');
            document.getElementById('ticker-track-content').textContent = text + "  SIGUE JUGANDO /// ";
        } else {
            document.getElementById('ticker-track-content').textContent = "TORNEO EN JUEGO /// RESULTADOS EN BREVE /// MUCHA SUERTE A TODOS";
        }
    } catch (e) { console.log(e); }
}

async function checkAndRenderMyMatch() {
    try {
        const americanas = await fetchAmericanas();
        // Check for ANY open/in_progress americana
        const activeAmericana = americanas.find(a => a.status === 'in_progress' || a.status === 'open');

        if (activeAmericana) {
            // Render the Grid for this Americana
            renderAmericanaGrid(activeAmericana.id);
        } else {
            const grid = document.getElementById('grid-container');
            if (grid) grid.innerHTML = `<p style="text-align:center; color: var(--text-muted);">No hay torneo activo para mostrar parrilla.</p>`;
        }

        if (!activeAmericana) return;

        const matches = await FirebaseDB.matches.getByAmericana(activeAmericana.id);

        // Find my active match
        const myMatch = matches.find(m =>
            (m.status === 'scheduled' || m.status === 'live') &&
            ((m.team_a_ids && m.team_a_ids.includes(AppStore.user.id)) ||
                (m.team_b_ids && m.team_b_ids.includes(AppStore.user.id)))
        );

        if (myMatch) {
            const container = document.getElementById('my-next-match-container');
            if (!container) return;

            const isTeamA = myMatch.team_a_ids.includes(AppStore.user.id);
            // Safe access to names
            const teamANames = (myMatch.team_a_names || "A1 / A2").split(' / ');
            const teamBNames = (myMatch.team_b_names || "B1 / B2").split(' / ');

            const partnerName = isTeamA ?
                teamANames.find(n => !n.includes(AppStore.user.name)) :
                teamBNames.find(n => !n.includes(AppStore.user.name));

            const opponents = isTeamA ? (myMatch.team_b_names || "Rivales") : (myMatch.team_a_names || "Rivales");

            container.innerHTML = `
                <div class="glass-panel" style="background: linear-gradient(135deg, rgba(37,99,235,0.1), rgba(204,255,0,0.1)); border: 1px solid var(--primary); animation: slideUp 0.5s ease-out;">
                    <div style="display:flex; flex-direction: column; gap: 1rem;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <h3 style="color: var(--primary); margin:0;">🎾 ¡TIENES PARTIDO!</h3>
                             <span class="status-indicator" style="background: var(--primary); color: black;">Ronda ${myMatch.round}</span>
                        </div>
                        
                        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
                            <div style="flex: 1;">
                                <div style="font-size: 0.9rem; color: var(--text-muted); text-transform: uppercase;">Tu Pista</div>
                                <div style="font-size: 2.5rem; font-weight: 800; line-height: 1;">${myMatch.court}</div>
                            </div>
                            
                            <div style="flex: 2; border-left: 1px solid var(--border-color); padding-left: 1rem;">
                                <div style="font-size: 0.9rem; color: var(--text-muted);">Tu Compañero</div>
                                <div style="font-size: 1.4rem; font-weight: 700;">${partnerName || 'Compañero'}</div>
                            </div>

                            <div style="flex: 2; border-left: 1px solid var(--border-color); padding-left: 1rem;">
                                <div style="font-size: 0.9rem; color: var(--text-muted);">Tus Rivales</div>
                                <div style="font-size: 1.1rem; color: var(--text);">${opponents}</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    } catch (e) {
        console.error("Error checking matches:", e);
    }
}

// --- API Helpers (Firebase Version) ---
console.log("🔥 Using Firebase for data persistence");

async function createAmericana(data) {
    try {
        const newAmericana = await FirebaseDB.americanas.create(data);
        return newAmericana;
    } catch (error) {
        console.error("Error creating americana:", error);
        throw error;
    }
}

async function updateAmericana(updatedAmericana) {
    try {
        await FirebaseDB.americanas.update(updatedAmericana.id, updatedAmericana);
    } catch (error) {
        console.error("Error updating americana:", error);
        throw error;
    }
}

async function createPlayer(data) {
    try {
        const newPlayer = await FirebaseDB.players.create({
            ...data,
            matches_played: 0,
            win_rate: 0,
            status: 'active',
            role: 'player'
        });
        return newPlayer;
    } catch (error) {
        console.error("Error creating player:", error);
        throw error;
    }
}

// --- Logic: Inscription (Firebase Version) ---
async function inscribirJugador(americanaId, playerId) {
    try {
        const americana = await FirebaseDB.americanas.getById(americanaId);
        if (!americana) throw new Error("Americana no encontrada");

        const players = americana.players || [];

        // Check duplication
        if (players.includes(playerId)) {
            throw new Error("El jugador ya está inscrito");
        }

        // Check capacity (maxPairs * 2 players)
        const maxPlayers = americana.maxPairs * 2;
        if (players.length >= maxPlayers) {
            throw new Error("Americana completa");
        }

        // Add player using Firebase arrayUnion
        await FirebaseDB.americanas.addPlayer(americanaId, playerId);

        const updatedAmericana = await FirebaseDB.americanas.getById(americanaId);
        return updatedAmericana;
    } catch (error) {
        console.error("Error inscribing player:", error);
        throw error;
    }
}

// --- Views ---



async function renderPlayersView() {
    // ... (Existing Players View kept same mostly, just ensuring reliability)
    const players = await fetchPlayers();

    // ... (Use same skeleton logic as before for consistency)
    // Simplified for brevity in this replacement chunk, restoring core logic:

    const listHtml = players.length ? players.map(p => `
        <tr style="border-bottom: 1px solid var(--border-color);">
            <td style="padding: 1rem;">
                <div style="display:flex; align-items:center; gap:0.5rem;">
                    <div style="width:32px; height:32px; background: var(--secondary); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:0.8rem; color: white;">${p.name.charAt(0)}</div>
                    <div style="font-weight: 600;">${p.name}</div>
                </div>
            </td>
            <td style="padding: 1rem;">${p.level}</td>
            <td style="padding: 1rem;">${p.matches_played}</td>
            <td style="padding: 1rem;">${p.win_rate}%</td>
            <td style="padding: 1rem;">
                <button style="background: transparent; border: none; cursor: pointer; color: var(--text-muted);">EDIT</button>
            </td>
        </tr>
    `).join('') : `<tr><td colspan="5" style="padding:2rem; text-align:center; color:var(--text-muted);">Sin jugadores.</td></tr>`;

    contentArea.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <h3>Directorio de Jugadores</h3>
            <button class="btn-primary" onclick="openModal('player-modal')">+ Nuevo Jugador</button>
        </div>
        <div class="glass-panel">
            <table style="width: 100%; border-collapse: collapse; text-align: left;">
                <thead>
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--text-muted);">
                        <th style="padding: 1rem;">Nombre</th>
                        <th style="padding: 1rem;">Nivel</th>
                        <th style="padding: 1rem;">Partidos</th>
                        <th style="padding: 1rem;">Win %</th>
                        <th style="padding: 1rem;">Acciones</th>
                    </tr>
                </thead>
                <tbody>${listHtml}</tbody>
            </table>
        </div>
    `;
}

// ... (renderLiveView and renderRankingsView logic remains as implemented in previous turn) ...



// --- Modal & Form Logic ---

window.openModal = function (modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('hidden');
}

window.closeModal = function () {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
}

document.querySelectorAll('.close-modal-btn').forEach(btn => {
    btn.addEventListener('click', closeModal);
});

// Inscription Modal Logic
window.currentInscriptionAmericanaId = null;

window.openInscriptionModal = async function (americanaId) {
    window.currentInscriptionAmericanaId = americanaId;

    // Create Modal on the fly if it doesn't exist
    let modal = document.getElementById('inscription-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'inscription-modal';
        modal.className = 'modal-overlay hidden';
        modal.innerHTML = `
            <div class="modal-content glass-panel" style="max-width: 400px;">
                <div class="modal-header">
                    <h2>📝 Inscribir Jugador</h2>
                    <button class="close-modal-btn" onclick="closeModal()">&times;</button>
                </div>
                <form id="inscription-form">
                    <div class="form-group">
                        <label>Seleccionar Jugador</label>
                        <select id="inscription-player-select" required style="width: 100%; padding: 1rem; background: var(--surface-hover); color: var(--text); border: 1px solid var(--border-color); border-radius: 8px;">
                            <option value="">Cargando jugadores...</option>
                        </select>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn-secondary" onclick="closeModal()">Cancelar</button>
                        <button type="submit" class="btn-primary">Confirmar Inscripción</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        modal.querySelector('#inscription-form').addEventListener('submit', handleInscriptionSubmit);
    }

    // Populate Players
    const players = await fetchPlayers();
    const select = modal.querySelector('#inscription-player-select');
    select.innerHTML = players.map(p => `<option value="${p.id}">${p.name} (${p.level})</option>`).join('');

    modal.classList.remove('hidden');
}

async function handleInscriptionSubmit(e) {
    e.preventDefault();
    const select = document.getElementById('inscription-player-select');
    const playerId = parseInt(select.value);

    if (!playerId || !window.currentInscriptionAmericanaId) return;

    try {
        await inscribirJugador(window.currentInscriptionAmericanaId, playerId);
        showToast('Jugador inscrito correctamente', 'success');
        closeModal();
        renderAmericanasView(); // Refresh list to update counts
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// Handle Americana Form
document.getElementById('create-americana-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
        name: formData.get('name'),
        date: formData.get('date'),
        category: formData.get('category'),
        maxPairs: parseInt(formData.get('maxPairs'))
    };

    try {
        const newAmericana = await createAmericana(data);
        closeModal();
        if (newAmericana) {
            showToast('Americana creada con éxito', 'success');
            renderAmericanasView();
        }
        e.target.reset();
    } catch (err) {
        showToast('Error al crear americana', 'error');
    }
});

// Handle Player Form
document.addEventListener('submit', async (e) => {
    if (e.target.id === 'create-player-form') {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            name: formData.get('name'),
            level: formData.get('level'),
            email: formData.get('email'),
            phone: formData.get('phone')
        };
        try {
            await createPlayer(data);
            closeModal();
            showToast('Jugador añadido correctamente', 'success');
            renderPlayersView();
            e.target.reset();
        } catch (err) {
            showToast('Error al guardar jugador', 'error');
        }
    }
});

// --- Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
    console.log("🚀 Americanas Padel PRO Systems - Online");

    // Initialize Notification System
    Notifications.init();

    // 1. Initialize Navigation
    const navButtons = document.querySelectorAll('.nav-item-pro');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.getAttribute('data-view');
            Router.navigate(view);
        });
    });

    // 2. Global Event Listeners (Forms etc)
    document.addEventListener('submit', async (e) => {
        if (e.target.id === 'login-form') {
            e.preventDefault();
            const fd = new FormData(e.target);
            await Auth.login(fd.get('phone'), fd.get('password'));
        }
        if (e.target.id === 'register-form') {
            e.preventDefault();
            await Auth.register(new FormData(e.target));
        }
    });

    // 3. Load User Session
    await AppStore.init();

    // 4. Initial View
    if (AppStore.user) {
        Router.navigate('dashboard');
        renderActivityFeed();
    } else {
        // Auth service handles showing login if needed
    }

    // 5. Visual Components
    initPerformanceChart();
});

function initPerformanceChart() {
    const ctx = document.getElementById('performanceChart');
    if (!ctx) return;

    // Use Chart.js with custom brand styles
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
            datasets: [{
                label: 'Puntos Ganados',
                data: [12, 19, 15, 25, 22, 30],
                borderColor: '#ccff00',
                backgroundColor: 'rgba(204, 255, 0, 0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 4,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: '#ccff00',
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#0f172a',
                    titleFont: { family: 'Outfit', size: 14 },
                    bodyFont: { family: 'Inter', size: 13 },
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: false
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8', font: { family: 'Inter', size: 11 } }
                },
                y: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#94a3b8', font: { family: 'Inter', size: 11 } }
                }
            }
        }
    });
}
// --- HAMBURGER MENU LOGIC ---
document.addEventListener("DOMContentLoaded", () => {
    const menuToggle = document.getElementById('mobile-menu-toggle');
    const sidebar = document.querySelector('.sidebar-pro');

    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('open');
            sidebar.classList.toggle('active'); // Supporting both naming conventions in CSS
            menuToggle.classList.toggle('active');
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if ((sidebar.classList.contains('open') || sidebar.classList.contains('active')) &&
                !sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                sidebar.classList.remove('open', 'active');
                menuToggle.classList.remove('active');
            }
        });

        // Close menu when navigating
        sidebar.querySelectorAll('button, a').forEach(btn => {
            btn.addEventListener('click', () => {
                sidebar.classList.remove('open', 'active');
                menuToggle.classList.remove('active');
            });
        });
    }
});
