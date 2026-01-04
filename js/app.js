console.log("Sistema de Gestión Americanas - Loaded");

// --- Auth Service & State (Firebase Version) ---
const Auth = {
    user: null,

    init() {
        // Load user from storage
        const stored = localStorage.getItem('currentUser');
        if (stored) {
            this.user = JSON.parse(stored);
        }
        this.check();
    },

    check() {
        const modal = document.getElementById('auth-modal');
        // Strict check: Must have user AND not be pending (unless admin)
        if (!this.user || (this.user.status === 'pending' && this.user.role !== 'admin')) {
            // Block access
            document.body.style.overflow = 'hidden';
            if (modal) modal.classList.remove('hidden');

            // If we have a user but they are pending, show a message
            if (this.user && this.user.status === 'pending') {
                showToast("Tu cuenta está pendiente de validación.", "info");
                this.logout(); // Clear the invalid state
            }
        } else {
            // Allow access
            document.body.style.overflow = 'auto';
            if (modal) modal.classList.add('hidden');
            updateUIForUser(this.user);
        }
    },

    async login(phone, password) {
        try {
            console.log(`🔐 Attempting login: ${phone}`);

            // Query Firestore for user by phone
            const user = await FirebaseDB.players.getByPhone(phone);

            if (!user) {
                throw new Error("Usuario no encontrado. Verifica tu número de teléfono.");
            }

            // Simple password check (en producción deberías usar hash)
            if (user.password !== password) {
                throw new Error("Contraseña incorrecta. Inténtalo de nuevo.");
            }

            // Check if user is active
            if (user.status !== 'active') {
                throw new Error("Tu cuenta está pendiente de validación por un administrador.");
            }

            console.log("✅ Login successful");
            this.setUser(user);
            return true;
        } catch (e) {
            console.error("❌ Login error:", e);
            throw e;
        }
    },

    async register(data) {
        try {
            console.log(`📝 Attempting registration: ${data.phone}`);

            // Check if phone already exists
            const existing = await FirebaseDB.players.getByPhone(data.phone);
            if (existing) {
                throw new Error("Este número de teléfono ya está registrado.");
            }

            // Determine role and status
            const role = data.phone === "649219350" ? "admin" : "player";
            const status = role === "admin" ? "active" : "pending";

            // Create new user in Firestore
            const newUser = await FirebaseDB.players.create({
                name: data.name,
                phone: data.phone,
                password: data.password, // En producción, hashear esto
                role: role,
                status: status,
                level: data.self_rate_level,
                self_rate_level: data.self_rate_level,
                play_preference: data.play_preference,
                category_preference: data.category_preference,
                matches_played: 0,
                win_rate: 0
            });

            console.log("✅ Registration successful");
            return newUser;
        } catch (e) {
            console.error("❌ Registration error:", e);
            throw e;
        }
    },

    setUser(user) {
        this.user = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.check();
        showToast(`Bienvenido, ${user.name}`);
        renderDashboardView();
    },

    logout() {
        this.user = null;
        localStorage.removeItem('currentUser');
        location.reload();
    }
};

function updateUIForUser(user) {
    // Hide/Show Admin Tabs
    const adminTab = document.querySelector('.nav-item[data-view="admin"]');
    if (adminTab) {
        adminTab.style.display = user.role === 'admin' ? 'flex' : 'none';
    }

    // Update Profile Section
    const profileName = document.querySelector('.user-info .name');
    const profileRole = document.querySelector('.user-info .role');
    const avatar = document.querySelector('.avatar');

    if (profileName) profileName.textContent = user.name;
    if (profileRole) profileRole.textContent = user.role === 'admin' ? 'ORGANIZADOR' : 'JUGADOR';
    if (avatar) avatar.textContent = user.name.substring(0, 2).toUpperCase();
}

// Global Toggle for Login forms
window.toggleAuthMode = function (mode) {
    document.getElementById('login-form').classList.toggle('hidden', mode !== 'login');
    document.getElementById('register-form').classList.toggle('hidden', mode !== 'register');
}

// --- UI Utilities ---
// --- UI Utilities ---
function showToast(message, type = 'info') {
    const container = document.querySelector('.toast-container') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
        <span>${message}</span>
    `;
    container.appendChild(toast);

    // Remove after 3s
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function createToastContainer() {
    const el = document.createElement('div');
    el.className = 'toast-container';
    document.body.appendChild(el);
    return el;
}

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

// DOM Elements & Init
document.addEventListener('DOMContentLoaded', () => {
    Auth.init(); // <--- START AUTH CHECK

    // Listeners for Login/Register
    document.getElementById('login-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        try {
            await Auth.login(fd.get('phone'), fd.get('password'));
        } catch (err) {
            showToast(err.message, 'error');
        }
    });

    // Register Handler
    document.getElementById('register-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        try {
            await Auth.register({
                name: formData.get('name'),
                phone: formData.get('phone'),
                password: formData.get('password'),
                self_rate_level: formData.get('self_rate_level'),
                play_preference: formData.get('play_preference'),
                category_preference: formData.get('category_preference')
            });

            // Manual success handling since we don't auto-login anymore
            showToast("Registro completado. Tu cuenta debe ser validada por un administrador.", "success");
            toggleAuthMode('login'); // Switch back to login form
            e.target.reset();

        } catch (err) {
            showToast(err.message, 'error');
        }
    });

    // Navigation Logic
    const navItems = document.querySelectorAll('.nav-item');
    const pageTitle = document.getElementById('page-title');
    const contentArea = document.getElementById('content-area');

    if (navItems.length === 0) console.error("Nav Items not found!");

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            // UI Update
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // View Update
            const view = item.getAttribute('data-view');
            loadView(view);
        });
    });

    // Initial Load
    loadView('dashboard');
});

// Global for access if needed, but preferably scoped.
// Moving these inside loadView or keeping global is fine if consistent.
const pageTitle = document.getElementById('page-title');
const contentArea = document.getElementById('content-area');

async function loadView(viewName) {
    console.log(`Loading view: ${viewName}`);

    const titles = {
        'dashboard': 'Dashboard General',
        'americanas': 'Gestión de Americanas',
        'live': 'Monitor en Vivo',
        'players': 'Directorio de Jugadores',
        'rankings': 'Clasificaciones Globales'
    };
    pageTitle.textContent = titles[viewName] || 'Dashboard';

    if (viewName === 'americanas') {
        await renderAmericanasView();
    } else if (viewName === 'tournament-live') {
        renderTournamentLiveView();
    } else if (viewName === 'players') {
        await renderPlayersView();
    } else if (viewName === 'dashboard') {
        renderDashboardView();
    } else if (viewName === 'admin') {
        // Admin Dashboard & User Management (Firebase Version)
        let usersList = '';
        let pendingUsersList = '';

        try {
            const allPlayers = await fetchPlayers();

            // Separate active and pending users
            const activeUsers = allPlayers.filter(p => p.status === 'active' && p.role !== 'admin');
            const pendingUsers = allPlayers.filter(p => p.status === 'pending');

            // Active users table
            usersList = activeUsers.map(p => `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 1rem;">
                        <div style="font-weight: 600; color: white;">${p.name}</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted);">${p.phone}</div>
                    </td>
                    <td style="padding: 1rem;"><span style="color: var(--primary); font-family: monospace;">•••••</span></td>
                    <td style="padding: 1rem;">
                        <span style="background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;">${(p.role || 'player').toUpperCase()}</span>
                    </td>
                    <td style="padding: 1rem;">
                        <span style="background: rgba(16, 185, 129, 0.2); color: #10b981; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem;">✓ ACTIVO</span>
                    </td>
                    <td style="padding: 1rem;">
                         <button class="btn-secondary" style="color: var(--danger); border-color: var(--danger); font-size: 0.75rem;" onclick="blockUser('${p.id}')">Bloquear</button>
                    </td>
                </tr>
             `).join('');

            // Pending users section
            if (pendingUsers.length > 0) {
                pendingUsersList = `
                    <div class="glass-panel" style="margin-top: 2rem; border: 1px solid rgba(255, 165, 0, 0.3);">
                        <h3 style="margin-bottom: 1rem; color: orange;">⏳ Usuarios Pendientes de Aprobación (${pendingUsers.length})</h3>
                        <table style="width: 100%; border-collapse: collapse; text-align: left;">
                            <thead>
                                <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--text-muted); text-transform: uppercase; font-size: 0.8rem;">
                                    <th style="padding: 1rem;">Usuario</th>
                                    <th style="padding: 1rem;">Nivel</th>
                                    <th style="padding: 1rem;">Preferencias</th>
                                    <th style="padding: 1rem;">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${pendingUsers.map(p => `
                                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); background: rgba(255, 165, 0, 0.05);">
                                        <td style="padding: 1rem;">
                                            <div style="font-weight: 600; color: white;">${p.name}</div>
                                            <div style="font-size: 0.8rem; color: var(--text-muted);">${p.phone}</div>
                                        </td>
                                        <td style="padding: 1rem;">
                                            <span style="background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;">${p.self_rate_level || p.level}</span>
                                        </td>
                                        <td style="padding: 1rem; font-size: 0.85rem;">
                                            <div>${p.play_preference || 'N/A'}</div>
                                            <div style="color: var(--text-muted);">${p.category_preference || 'N/A'}</div>
                                        </td>
                                        <td style="padding: 1rem;">
                                            <button class="btn-primary" style="font-size: 0.75rem; padding: 0.5rem 1rem;" onclick="approveUser('${p.id}')">✓ Aprobar</button>
                                            <button class="btn-secondary" style="font-size: 0.75rem; padding: 0.5rem 1rem; margin-left: 0.5rem; color: var(--danger); border-color: var(--danger);" onclick="rejectUser('${p.id}')">✗ Rechazar</button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            }
        } catch (e) {
            console.error("Error loading users", e);
            usersList = '<tr><td colspan="5" style="padding: 2rem; text-align: center; color: var(--danger);">Error al cargar usuarios</td></tr>';
        }

        contentArea.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                <h2 style="color: var(--primary);">⚙️ Panel de Administración</h2>
                <div class="skeleton" style="width: 40px; height: 40px; border-radius: 50%;"></div>
            </div>

            <div class="glass-panel">
                <h3 style="margin-bottom: 1rem;">👥 Usuarios Activos</h3>
                <table style="width: 100%; border-collapse: collapse; text-align: left;">
                    <thead>
                        <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--text-muted); text-transform: uppercase; font-size: 0.8rem;">
                            <th style="padding: 1rem;">Usuario</th>
                            <th style="padding: 1rem;">Password</th>
                            <th style="padding: 1rem;">Rol</th>
                            <th style="padding: 1rem;">Estado</th>
                            <th style="padding: 1rem;">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        <!-- Admin Row -->
                        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); background: rgba(204, 255, 0, 0.05);">
                             <td style="padding: 1rem;">
                                <div style="font-weight: 800; color: var(--primary);">ADMINISTRADOR</div>
                                <div style="font-size: 0.8rem; color: var(--text-muted);">649219350</div>
                            </td>
                            <td style="padding: 1rem;">******</td>
                            <td style="padding: 1rem;"><span style="background: var(--primary); color: black; padding: 2px 8px; border-radius: 4px; font-weight: 800; font-size: 0.8rem;">GOD MODE</span></td>
                            <td style="padding: 1rem;"><span style="background: rgba(16, 185, 129, 0.2); color: #10b981; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem;">✓ ACTIVO</span></td>
                            <td style="padding: 1rem;">-</td>
                        </tr>
                        ${usersList}
                    </tbody>
                </table>
            </div>

            ${pendingUsersList}
        `;
    } else {
        renderDashboardView();
    }
}

function renderLiveView() {
    contentArea.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <div>
                <h3>🔴 Pista Central - En Vivo</h3>
                <p style="color: var(--danger); font-size: 0.8rem; font-weight: 600;">LIVE BROADCAST</p>
            </div>
            <div class="status-indicator">
                <span class="dot online" style="animation: pulse 1s infinite;"></span> Transmitiendo
            </div>
        </div>

        <div class="dashboard-grid" style="grid-template-columns: 2fr 1fr;">
            <!-- Scoreboard -->
            <div class="glass-panel" style="background: linear-gradient(145deg, rgba(20,20,25,0.9), rgba(10,10,15,0.95)); padding: 2rem; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 400px; position: relative; overflow: hidden;">
                <!-- Decor Background -->
                <div style="position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(212,175,55,0.1) 0%, transparent 50%); pointer-events: none;"></div>
                
                <div style="display: flex; width: 100%; justify-content: space-between; align-items: center; margin-bottom: 3rem; position: relative; z-index: 2;">
                    <!-- Team A -->
                    <div style="text-align: center; flex: 1;">
                        <div style="width: 80px; height: 80px; background: #3b82f6; border-radius: 50%; margin: 0 auto 1rem; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; border: 4px solid rgba(59,130,246,0.3);">AG</div>
                        <h2 style="font-size: 1.5rem; font-weight: 800; margin-bottom: 0.5rem;">GALÁN</h2>
                        <span style="background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;">VIV 1</span>
                    </div>

                    <!-- VS / Score -->
                    <div style="text-align: center; padding: 0 2rem;">
                        <div style="font-size: 4rem; font-weight: 800; font-family: 'Outfit', sans-serif; letter-spacing: -2px; color: white;">
                            <span style="color: var(--primary);">4</span> - <span>2</span>
                        </div>
                        <div style="color: var(--text-muted); font-size: 0.9rem; letter-spacing: 2px; text-transform: uppercase; margin-top: 0.5rem;">SET 1</div>
                    </div>

                    <!-- Team B -->
                    <div style="text-align: center; flex: 1;">
                        <div style="width: 80px; height: 80px; background: #ef4444; border-radius: 50%; margin: 0 auto 1rem; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; border: 4px solid rgba(239,68,68,0.3);">LC</div>
                        <h2 style="font-size: 1.5rem; font-weight: 800; margin-bottom: 0.5rem;">CHINGOTTO</h2>
                        <span style="background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;">VIV 2</span>
                    </div>
                </div>

                <div style="width: 100%; height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent); margin-bottom: 2rem;"></div>

                <div style="display: flex; gap: 2rem; justify-content: center;">
                    <button class="btn-primary" style="min-width: 120px;">Punto A</button>
                    <button class="btn-secondary" style="min-width: 120px;">Punto B</button>
                </div>
            </div>

            <!-- Match Stats / Feed -->
            <div style="display: flex; flex-direction: column; gap: 1rem;">
                <div class="glass-panel" style="padding: 1.5rem; flex: 1;">
                    <h4 style="color: var(--text-muted); margin-bottom: 1rem; text-transform: uppercase; font-size: 0.8rem;">Estadísticas en Vivo</h4>
                    <div style="display: flex; flex-direction: column; gap: 1rem;">
                        <div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.3rem; font-size: 0.9rem;">
                                <span>Puntos de Oro</span>
                                <span>2 - 1</span>
                            </div>
                            <div style="height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden;">
                                <div style="width: 66%; height: 100%; background: var(--primary);"></div>
                            </div>
                        </div>
                        <div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.3rem; font-size: 0.9rem;">
                                <span>Errores No Forzados</span>
                                <span>5 - 8</span>
                            </div>
                            <div style="height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden;">
                                <div style="width: 40%; height: 100%; background: var(--danger);"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="glass-panel" style="padding: 1.5rem; flex: 1;">
                    <h4 style="color: var(--text-muted); margin-bottom: 1rem; text-transform: uppercase; font-size: 0.8rem;">Comentarios</h4>
                    <div style="font-size: 0.9rem; color: var(--text-muted); display: flex; flex-direction: column; gap: 0.8rem;">
                        <p><span style="color: var(--primary);">14:32</span> Break point para Galán.</p>
                        <p><span style="color: white;">14:30</span> Chingotto salva la bola imposible!</p>
                        <p><span style="color: white;">14:28</span> Inicio del partido.</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function renderRankingsView() {
    const players = await fetchPlayers();

    // Calculate Rank Logic (Mock sorting if not really calculated)
    const sortedPlayers = players.sort((a, b) => {
        // Sort by win_rate desc, then matches_played desc
        if (b.win_rate !== a.win_rate) return b.win_rate - a.win_rate;
        return b.matches_played - a.matches_played;
    });

    const listHtml = sortedPlayers.length ? sortedPlayers.map((p, index) => {
        let rankBadge = `<span style="font-weight: 800; color: var(--text-muted); width: 24px; display: inline-block;">${index + 1}</span>`;
        let rowStyle = "";

        if (index === 0) {
            rankBadge = `<span style="font-size: 1.2rem;">🥇</span>`;
            rowStyle = "background: linear-gradient(90deg, rgba(212, 175, 55, 0.1), transparent);";
        } else if (index === 1) {
            rankBadge = `<span style="font-size: 1.2rem;">🥈</span>`;
        } else if (index === 2) {
            rankBadge = `<span style="font-size: 1.2rem;">🥉</span>`;
        }

        return `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); ${rowStyle}">
            <td style="padding: 1rem; text-align: center;">${rankBadge}</td>
            <td style="padding: 1rem;">
                <div style="display:flex; align-items:center; gap:0.5rem;">
                     <div style="width:32px; height:32px; background: rgba(255,255,255,0.1); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:0.8rem;">${p.name.charAt(0)}</div>
                    <div style="font-weight: 600;">${p.name}</div>
                </div>
            </td>
            <td style="padding: 1rem;">
                <span style="background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;">${p.level}</span>
            </td>
            <td style="padding: 1rem; font-family: 'Outfit'; font-weight: 600;">${p.matches_played}</td>
            <td style="padding: 1rem; color: ${p.win_rate >= 50 ? 'var(--success)' : 'var(--danger)'}; font-weight: 700;">${p.win_rate}%</td>
        </tr>
    `}).join('') : `<tr><td colspan="5" class="text-center p-4">Sin datos</td></tr>`;

    contentArea.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <h3>Ranking Global - Temporada 2026</h3>
            <button class="btn-secondary" onclick="renderRankingsView()">🔄 Actualizar</button>
        </div>

        <div class="dashboard-grid" style="grid-template-columns: 1fr 3fr; align-items: start;">
            <!-- Top Player Card -->
            <div class="stat-card" style="text-align: center; border: 1px solid var(--primary); box-shadow: 0 0 30px -10px rgba(212, 175, 55, 0.3);">
                <div style="font-size: 4rem; margin-bottom: 1rem;">👑</div>
                <h3 style="color: var(--primary); margin-bottom: 0.5rem;">NÚMERO #1</h3>
                <div style="font-size: 1.5rem; font-weight: 800; color: white; margin-bottom: 0.5rem;">${sortedPlayers[0]?.name || '--'}</div>
                <p style="color: var(--text-muted); font-size: 0.9rem;">${sortedPlayers[0]?.win_rate || 0}% Victorias</p>
            </div>

            <!-- Table -->
            <div class="glass-panel">
                <table style="width: 100%; border-collapse: collapse; text-align: left;">
                    <thead>
                        <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--text-muted);">
                            <th style="padding: 1rem; width: 60px; text-align: center;">#</th>
                            <th style="padding: 1rem;">Jugador</th>
                            <th style="padding: 1rem;">Nivel</th>
                            <th style="padding: 1rem;">Partidos</th>
                            <th style="padding: 1rem;">Win Rate</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${listHtml}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderDashboardView() {
    contentArea.innerHTML = `
        <div class="dashboard-grid">
            <div class="stat-card">
                <h3>Partidos Hoy</h3>
                <p class="stat-value">0</p>
                <p class="stat-trend neutral">No hay eventos</p>
            </div>
            <div class="stat-card">
                <h3>Jugadores Activos</h3>
                <p class="stat-value" id="total-players-count">--</p>
                <p class="stat-trend positive">Base de datos conectada</p>
            </div>
            <div class="stat-card">
                <h3>Pistas Ocupadas</h3>
                <p class="stat-value">0/10</p>
                <p class="stat-trend neutral">Disponibilidad total</p>
            </div>
        </div>
        <div class="glass-panel">
            <h3>🔥 Actividad Reciente</h3>
            <p style="color: var(--text-muted); padding: 1rem 0;">Sistema iniciado correctamente.</p>
        </div>
    `;
    // Fetch generic stats if needed
    fetchPlayers().then(players => {
        const countEl = document.getElementById('total-players-count');
        if (countEl) countEl.textContent = players.length;
    });
}

// --- API Helpers (Firebase Version) ---
console.log("🔥 Using Firebase for data persistence");

async function fetchAmericanas() {
    try {
        const americanas = await FirebaseDB.americanas.getAll();
        return americanas;
    } catch (error) {
        console.error("Error fetching americanas:", error);
        return [];
    }
}

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

async function fetchPlayers() {
    try {
        const players = await FirebaseDB.players.getAll();
        return players;
    } catch (error) {
        console.error("Error fetching players:", error);
        return [];
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

async function renderAmericanasView() {
    // Show Skeleton
    contentArea.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <h3>Gestión de Americanas</h3>
            <div class="skeleton" style="width: 150px; height: 40px; border-radius: 99px;"></div>
        </div>
        <div class="glass-panel">
            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                ${getSkeletonRows(5)}
            </div>
        </div>
    `;

    const americanas = await fetchAmericanas();

    const listHtml = americanas.length ? americanas.map(a => {
        const registeredCount = a.players ? a.players.length : 0;
        const totalSpots = a.maxPairs * 2;
        const progress = (registeredCount / totalSpots) * 100;
        const isFull = registeredCount >= totalSpots;

        return `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
            <td style="padding: 1rem;">
                <div style="font-weight: 600;">${a.name}</div>
                <div style="font-size: 0.8rem; color: var(--text-muted);">${a.category.toUpperCase()} • ${a.maxPairs} parejas</div>
            </td>
            <td style="padding: 1rem;">${new Date(a.date).toLocaleDateString()}</td>
            <td style="padding: 1rem; width: 250px;">
                <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 4px;">
                    <span>${registeredCount} / ${totalSpots} Jugadores</span>
                    <span style="color: ${isFull ? 'var(--danger)' : 'var(--success)'};">${isFull ? 'COMPLETO' : 'Plazas Libres'}</span>
                </div>
                <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;">
                    <div style="width: ${progress}%; height: 100%; background: ${isFull ? 'var(--danger)' : 'var(--primary)'};"></div>
                </div>
            </td>
            <td style="padding: 1rem;"><span style="background: rgba(16, 185, 129, 0.2); color: #10b981; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;">${a.status}</span></td>
            <td style="padding: 1rem;">
                ${!isFull ?
                `<button class="btn-secondary" style="padding: 0.4rem 1rem; font-size: 0.75rem;" onclick="openInscriptionModal(${a.id})">📝 Inscribir</button>` :
                `<span style="font-size: 0.8rem; color: var(--text-muted);">Cerrado</span>`
            }
            </td>
        </tr>
    `}).join('') : `
        <tr>
            <td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                No hay americanas creadas. Crea una para empezar.
            </td>
        </tr>
    `;

    contentArea.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <h3>Gestión de Americanas</h3>
            <div style="display: flex; gap: 0.5rem;">
                <button class="btn-primary" onclick="openModal('americana-modal')">+ Nueva Americana</button>
            </div>
        </div>
        
        <div class="glass-panel">
            <table style="width: 100%; border-collapse: collapse; text-align: left;">
                <thead>
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--text-muted);">
                        <th style="padding: 1rem;">Evento</th>
                        <th style="padding: 1rem;">Fecha</th>
                        <th style="padding: 1rem;">Ocupación</th>
                        <th style="padding: 1rem;">Estado</th>
                        <th style="padding: 1rem;">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${listHtml}
                </tbody>
            </table>
        </div>
    `;
}

async function renderPlayersView() {
    // ... (Existing Players View kept same mostly, just ensuring reliability)
    const players = await fetchPlayers();

    // ... (Use same skeleton logic as before for consistency)
    // Simplified for brevity in this replacement chunk, restoring core logic:

    const listHtml = players.length ? players.map(p => `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
            <td style="padding: 1rem;">
                <div style="display:flex; align-items:center; gap:0.5rem;">
                    <div style="width:32px; height:32px; background: #3b82f6; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:0.8rem;">${p.name.charAt(0)}</div>
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

async function renderDashboardView() {
    const americanas = await fetchAmericanas();
    const players = await fetchPlayers();

    // Stats Calculation
    const today = new Date().toISOString().split('T')[0];
    const todaysEvent = americanas.find(a => a.date === today);
    const matchesToday = todaysEvent ? (todaysEvent.maxPairs * 4) : 0; // Approx matches estimate

    // Court Calculation (10 Fixed Courts)
    const TOTAL_COURTS = 10;
    // Assume 4 players per court (Double).
    // Count total active players in "Open" Americanas
    const activeAmericanas = americanas.filter(a => a.status === 'open' || a.status === 'in_progress');
    let totalRegisteredInActive = 0;
    activeAmericanas.forEach(a => {
        totalRegisteredInActive += (a.players ? a.players.length : 0);
    });

    const courtsOccupied = Math.ceil(totalRegisteredInActive / 4);
    const courtsDisplay = courtsOccupied > TOTAL_COURTS ? TOTAL_COURTS : courtsOccupied;
    const availabilityColor = courtsDisplay >= TOTAL_COURTS ? 'var(--danger)' : 'var(--success)';
    const availabilityText = courtsDisplay >= TOTAL_COURTS ? 'Completo' : 'Pistas Libres';

    contentArea.innerHTML = `
        <div class="dashboard-grid">
            <div class="stat-card">
                <h3>Eventos Activos</h3>
                <p class="stat-value">${activeAmericanas.length}</p>
                <p class="stat-trend neutral">${totalRegisteredInActive} jugadores inscritos</p>
            </div>
            <div class="stat-card">
                <h3>Base de Jugadores</h3>
                <p class="stat-value" id="total-players-count">${players.length}</p>
                <p class="stat-trend positive">Comunidad Padel PRO</p>
            </div>
            <div class="stat-card">
                <h3>Ocupación de Pistas (Max 10)</h3>
                <p class="stat-value" style="color: ${availabilityColor};">${courtsDisplay}/10</p>
                <p class="stat-trend" style="color: ${availabilityColor};">${availabilityText}</p>
            </div>
        </div>
        <div class="glass-panel" style="padding: 2rem;">
            <h3>🔥 Estado del Club</h3>
            ${activeAmericanas.length > 0 ? `
                <div style="margin-top: 1rem;">
                    ${activeAmericanas.map(a => `
                        <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 12px; margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <span style="font-weight: 600;">${a.name}</span>
                                <span style="color: var(--text-muted); font-size: 0.9rem; margin-left: 0.5rem;">${a.players ? a.players.length : 0} Jugadores</span>
                            </div>
                            <button class="btn-secondary" style="font-size: 0.8rem; padding: 0.3rem 0.8rem;" onclick="loadView('americanas')">Gestionar</button>
                        </div>
                    `).join('')}
                </div>
            ` : `<p style="color: var(--text-muted); padding: 1rem 0;">No hay americanas activas en este momento.</p>`}
        </div>
    `;
}

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
                        <select id="inscription-player-select" required style="width: 100%; padding: 1rem; background: rgba(0,0,0,0.3); color: white; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px;">
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

// --- Admin Functions (Global) ---
window.approveUser = async function (userId) {
    try {
        await FirebaseDB.players.update(userId, { status: 'active' });
        showToast('Usuario aprobado correctamente', 'success');
        loadView('admin'); // Refresh admin view
    } catch (error) {
        console.error("Error approving user:", error);
        showToast('Error al aprobar usuario', 'error');
    }
};

window.rejectUser = async function (userId) {
    if (!confirm('¿Estás seguro de que quieres rechazar este usuario? Se eliminará permanentemente.')) return;

    try {
        await FirebaseDB.players.delete(userId);
        showToast('Usuario rechazado y eliminado', 'success');
        loadView('admin'); // Refresh admin view
    } catch (error) {
        console.error("Error rejecting user:", error);
        showToast('Error al rechazar usuario', 'error');
    }
};

window.blockUser = async function (userId) {
    if (!confirm('¿Estás seguro de que quieres bloquear este usuario?')) return;

    try {
        await FirebaseDB.players.update(userId, { status: 'blocked' });
        showToast('Usuario bloqueado', 'success');
        loadView('admin'); // Refresh admin view
    } catch (error) {
        console.error("Error blocking user:", error);
        showToast('Error al bloquear usuario', 'error');
    }
};

// Initialize - Event Listeners already set up at top.
console.log("App Initialized");

