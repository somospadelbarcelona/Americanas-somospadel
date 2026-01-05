// Admin Dashboard Logic

document.addEventListener('DOMContentLoaded', () => {
    // Global Toast Redirection for Admin Panel Compatibility
    window.showToast = (msg, type) => AdminAuth.localToast(msg, type);
});

const AdminAuth = {
    token: localStorage.getItem('adminToken'),
    user: (() => {
        try {
            // Unify with app.js key
            const session = localStorage.getItem('adminUser') || localStorage.getItem('currentUser');
            return JSON.parse(session || 'null');
        } catch (e) {
            console.error("❌ Error parsing session:", e);
            return null;
        }
    })(),

    // TOTAL BYPASS FOR EMERGENCY
    bypassLogin() {
        const noa = {
            id: "god-master-noa",
            name: "NOA (MASTER BYPASS)",
            role: "admin",
            phone: "NOA",
            status: "active"
        };
        alert("🚨 ACTIVANDO BYPASS DE EMERGENCIA - NOA");
        this.setUser(noa);
    },

    init() {
        console.log("🛠️ AdminAuth Init...");
        // Check for existing session
        if (this.user && this.user.role === 'admin') {
            console.log("💎 Sesión Admin Detectada:", this.user.name);
            const modal = document.getElementById('admin-auth-modal');
            if (modal) {
                modal.classList.add('hidden');
                modal.style.display = 'none';
            }
            loadAdminView('users');
        } else {
            console.log("🔒 Access Required");
            // Clear any non-admin or broken session
            localStorage.removeItem('adminUser');
            const modal = document.getElementById('admin-auth-modal');
            if (modal) {
                modal.classList.remove('hidden');
                modal.style.display = 'flex';
            }
        }
    },

    async login(phoneInput, password) {
        const loginBtn = document.getElementById('admin-login-btn');
        const errorEl = document.getElementById('admin-login-error');

        try {
            const rawPhone = (phoneInput || "").toString().trim().toUpperCase();
            const rawPass = (password || "").toString().trim().toUpperCase();

            console.log(`[ADMIN - AUTH] Attempt: ${rawPhone}`);

            if (errorEl) {
                errorEl.textContent = "";
                errorEl.style.display = 'none';
            }

            if (!phoneInput || !password) {
                throw new Error("⚠️ POR FAVOR, RELLENA TODOS LOS CAMPOS.");
            }

            if (loginBtn) {
                loginBtn.disabled = true;
                loginBtn.innerHTML = '<span class="loader-mini"></span> AUTENTICANDO...';
            }

            // 1. EMERGENCY MASTER OVERRIDES
            const isAlex = (rawPhone.endsWith("649219350") || rawPhone === "649219350") && rawPass === "JARABA";
            const isNoa = rawPhone === "NOA" && rawPass === "NOA21";

            if (isAlex || isNoa) {
                alert(`🎖️ ACCESO MAESTRO ADMIN: ${isNoa ? 'NOA' : 'ALEX'}`);

                const masterUser = {
                    id: isNoa ? "god-master-noa" : "god-master-649219350",
                    name: isNoa ? "NOA (MASTER PRO)" : "ALEX (MASTER PRO)",
                    role: "admin",
                    phone: isNoa ? "NOA" : "649219350",
                    status: "active"
                };

                this.setUser(masterUser);
                return;
            }

            // 2. REGULAR DB LOGIN
            const cleanPhone = rawPhone.replace(/\D/g, '');
            const user = await FirebaseDB.players.getByPhone(cleanPhone);

            if (!user) throw new Error("⚠️ EL TELÉFONO NO ESTÁ REGISTRADO.");
            if (user.password !== password) throw new Error("❌ CONTRASEÑA INCORRECTA.");
            if (user.role !== 'admin') throw new Error("🚫 ACCESO DENEGADO: NO ERES ADMINISTRADOR.");

            this.setUser(user);
            console.log("✅ Admin access granted via DB");

        } catch (e) {
            console.error("Auth Fail:", e);
            if (errorEl) {
                errorEl.innerHTML = `<div style="background: rgba(239, 68, 68, 0.1); padding: 1rem; border-radius: 8px; border: 1px solid #ef4444; color: #ef4444; font-weight: 800; font-size: 0.8rem;">${e.message}</div>`;
                errorEl.style.display = 'block';
            }
        } finally {
            if (loginBtn) {
                loginBtn.disabled = false;
                loginBtn.innerHTML = 'ENTRAR AL PANEL PRO 🚀';
            }
        }
    },

    setUser(user) {
        console.log("✅ Setting Admin User:", user.name);
        this.user = user;
        localStorage.setItem('adminUser', JSON.stringify(user));

        const modal = document.getElementById('admin-auth-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }

        // Update Admin Profile Widget
        const nameEl = document.getElementById('admin-name');
        const avatarEl = document.getElementById('admin-avatar');
        if (nameEl) nameEl.textContent = user.name;
        if (avatarEl) avatarEl.textContent = user.name.charAt(0);

        // Immediate view load
        loadAdminView('users');
    },

    logout() {
        this.user = null;
        localStorage.removeItem('adminUser');
        location.reload();
    },

    // UI Helper for admin panel
    localToast(msg, type) {
        console.log(`[ADMIN TOAST]: ${msg}`);
        if (msg.includes("JARABA")) return; // Skip if already alerted
        alert(msg);
    }
};

// --- Views ---

async function loadAdminView(view) {
    const content = document.getElementById('content-area');
    const titleEl = document.getElementById('page-title');

    // Update Sidebar Active State
    document.querySelectorAll('.nav-item-pro').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-view') === view);
    });

    try {
        if (view === 'users') {
            if (titleEl) titleEl.textContent = 'Gobernanza de Usuarios';
            content.innerHTML = '<div class="loader"></div>';

            const users = await FirebaseDB.players.getAll();
            const rows = users.map(u => {
                const isPending = u.status === 'pending';
                return `
                <tr class="pro-table-row" style="background: ${isPending ? 'rgba(255,165,0,0.05)' : 'transparent'}">
                    <td>
                        <div class="pro-player-cell">
                            <div class="pro-avatar">${u.name.charAt(0)}</div>
                            <div>
                                <div style="font-weight: 700; color: var(--text);">${u.name}</div>
                                <div style="font-size: 0.75rem; color: var(--text-muted);">${(u.role || 'player').toUpperCase()}</div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div style="display:flex; align-items:center; gap:0.8rem;">
                             <span style="color: var(--primary); font-family: 'Outfit'; font-weight: 600;">${u.phone}</span>
                             <a href="https://wa.me/${u.phone.replace(/\D/g, '')}" target="_blank" class="badge-pro" style="text-decoration:none; background: #25D366; color:white;">WHATSAPP</a>
                        </div>
                    </td>
                    <td>
                        <span class="pro-category-badge" style="background: var(--surface-hover);">${u.level || u.self_rate_level || '3.5'}</span>
                    </td>
                    <td>
                         <span class="pro-category-badge" style="color: ${u.status === 'active' ? 'var(--primary)' : 'var(--warning)'}; border-color: ${u.status === 'active' ? 'var(--primary-glow)' : 'var(--warning)'}">
                            ${(u.status || 'active').toUpperCase()}
                        </span>
                    </td>
                    <td style="text-align: right;">
                        <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                            ${isPending ? `<button class="btn-primary-pro" style="padding: 0.4rem 0.8rem; font-size: 0.7rem;" onclick="approveUser('${u.id}')">VALIDAR</button>` : ''}
                            <button class="btn-outline-pro" style="padding: 0.4rem 0.8rem; font-size: 0.7rem;" onclick='openEditUserModal(${JSON.stringify(u).replace(/'/g, "&#39;")})'>EDITAR</button>
                            <button class="btn-outline-pro" style="padding: 0.4rem 0.8rem; font-size: 0.7rem; color: var(--danger); border-color: var(--danger-dim);" onclick="deleteUser('${u.id}')">ELIMINAR</button>
                        </div>
                    </td>
                </tr>`;
            }).join('');

            content.innerHTML = `
                <div class="glass-card-enterprise" style="padding: 0; overflow: hidden;">
                    <div style="padding: 1.5rem 2rem; display: flex; justify-content: space-between; align-items: center; border-bottom: var(--border-pro);">
                        <h3 style="margin:0;">GOBERNANZA DE JUGADORES <span style="color:var(--text-muted); font-size: 0.8rem; margin-left: 10px;">TOTAL: ${users.length}</span></h3>
                        <div style="display:flex; gap: 1rem;">
                            <input type="text" placeholder="Buscar jugador..." class="pro-input" style="width: 250px; padding: 0.5rem 1rem;" onkeyup="filterUsers(this.value)">
                            <button class="btn-primary-pro" style="padding: 0.5rem 1.5rem;" onclick="openCreateUserModal()">+ REGISTRAR</button>
                        </div>
                    </div>
                    <table class="pro-table">
                        <thead>
                            <tr>
                                <th>IDENTIDAD</th>
                                <th>CONTACTO</th>
                                <th>NIVEL TÉCNICO</th>
                                <th>ESTADO CUENTA</th>
                                <th style="text-align:right;">ACCIONES DE CONTROL</th>
                            </tr>
                        </thead>
                        <tbody id="users-tbody">${rows}</tbody>
                    </table>
                    <div class="pro-table-footer">SISTEMA INTEGRADO DE BASE DE DATOS v2.0 PRO</div>
                </div>`;

            window.allUsersCache = users;

            window.approveUser = async (id) => {
                if (!confirm("¿Validar acceso para este usuario?")) return;
                try {
                    await FirebaseDB.players.update(id, { status: 'active' });
                    alert("Usuario validado correctamente");
                    loadAdminView('users');
                } catch (e) { alert("Error: " + e.message); }
            };

        } else if (view === 'americanas_mgmt') {
            if (titleEl) titleEl.textContent = 'Centro de Planificación de Torneos';
            content.innerHTML = '<div class="loader"></div>';

            const americanas = await FirebaseDB.americanas.getAll();
            const listHtml = americanas.map(a => `
                <div class="glass-card-enterprise" style="margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-left: 4px solid var(--primary);">
                    <div style="display: flex; gap: 1.5rem; align-items: center;">
                        <div class="americana-preview-img" style="width: 80px; height: 80px; border-radius: 12px; background: url('${a.image_url || 'img/logo.png'}') center/cover; border: 1px solid rgba(255,255,255,0.1);"></div>
                        <div class="americana-info-pro">
                            <div style="font-weight: 800; font-size: 1.2rem; color: var(--primary); margin-bottom: 0.3rem;">${a.name.toUpperCase()}</div>
                            <div style="display: flex; gap: 1.2rem; font-size: 0.8rem; color: var(--text-muted); flex-wrap: wrap;">
                                <span>📅 <span style="color:var(--text)">${a.date}</span></span>
                                <span>🕒 <span style="color:var(--text)">${a.time || '18:30'}</span></span>
                                <span>🎾 <span style="color:var(--text)">${a.max_courts || 4} Pistas</span></span>
                                <span>👥 <span style="color:var(--primary); font-weight: 700;">${a.players?.length || 0} Inscritos</span></span>
                            </div>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <span class="pro-category-badge" style="background: var(--surface-hover); color: white;">${(a.category || 'OPEN').toUpperCase()}</span>
                        <button class="btn-secondary" style="border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-color: var(--danger-dim); color: var(--danger);" 
                                onclick="deleteAmericana('${a.id}')" title="Eliminar Permanente">🗑️</button>
                    </div>
                </div>`).join('');

            content.innerHTML = `
                <div class="dashboard-grid-enterprise" style="grid-template-columns: 400px 1fr; gap: 2.5rem;">
                    <div class="glass-card-enterprise" style="background: var(--grad-dark); height: fit-content; padding: 2rem;">
                        <h3 style="margin-bottom: 2rem; color: var(--primary); display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 1.5rem;">✨</span> CONFIGURAR AMERICANAS
                        </h3>
                        <form id="create-americana-form" class="pro-form">
                            <div class="form-group">
                                <label>NOMBRE DEL EVENTO</label>
                                <input type="text" name="name" placeholder="Ej: VIERNES PRO LEAGUE" class="pro-input" required>
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                                <div class="form-group">
                                    <label>FECHA</label>
                                    <input type="date" name="date" class="pro-input" required>
                                </div>
                                <div class="form-group">
                                    <label>HORA</label>
                                    <input type="time" name="time" value="18:30" class="pro-input" required>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>CATEGORÍA DEL TORNEO</label>
                                <select name="category" class="pro-input">
                                    <option value="open">OPEN (TODOS)</option>
                                    <option value="male">MASCULINO</option>
                                    <option value="female">FEMENINO</option>
                                    <option value="mixed">MIXTO</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>PLANTILLA VISUAL (IMAGEN)</label>
                                <select name="image_url" class="pro-input">
                                    <option value="img/americana-pro.png">SALA PRO (NEÓN AMARILLO)</option>
                                    <option value="img/americana-night.png">NIGHT SESSION (AZUL/PÚRPURA)</option>
                                    <option value="img/americana-mixed.png">MIXED VIBES (NARANJA/ROJO)</option>
                                    <option value="img/logo.png">LOGOTIPO CLUB</option>
                                </select>
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                                <div class="form-group">
                                    <label>DURACIÓN</label>
                                    <input type="text" name="duration" value="2h" class="pro-input">
                                </div>
                                <div class="form-group">
                                    <label>MAX. PISTAS</label>
                                    <input type="number" name="max_courts" value="4" class="pro-input">
                                </div>
                            </div>
                            <button type="submit" class="btn-primary-pro" style="width: 100%; margin-top: 1rem; padding: 1.2rem;">LANZAR EVENTO ELITE 🚀</button>
                        </form>
                    </div>
                    <div class="planning-area">
                        <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                            <h3 style="margin:0; letter-spacing: 2px; font-size: 0.85rem; color: var(--text-muted); font-weight: 800;">EVENTOS EN EL RADAR</h3>
                            <button class="btn-outline-pro" style="padding: 0.6rem 1.2rem; font-size: 0.75rem;" onclick="loadAdminView('americanas_mgmt')">REFRESCAR SISTEMA</button>
                        </div>
                        <div class="americana-scroll-list" style="max-height: 75vh; overflow-y: auto; padding-right: 15px;">
                            ${listHtml || '<div class="glass-card-enterprise" style="text-align:center; padding: 4rem; color: var(--text-muted);">No hay eventos operativos. Comienza creando uno.</div>'}
                        </div>
                    </div>
                </div>`;

            document.getElementById('create-americana-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const fd = new FormData(e.target);
                const data = Object.fromEntries(fd.entries());
                try {
                    await FirebaseDB.americanas.create(data);
                    alert("Americana programada con éxito");
                    loadAdminView('americanas_mgmt');
                } catch (err) { alert(err.message); }
            });

            window.deleteAmericana = async (id) => {
                if (!confirm("¿Eliminar este evento?")) return;
                try {
                    await FirebaseDB.americanas.delete(id);
                    loadAdminView('americanas_mgmt');
                } catch (e) { alert(e.message); }
            };

        } else if (view === 'simulator') {
            if (titleEl) titleEl.textContent = 'Motor de Simulación Maestro';
            content.innerHTML = `
                <div class="glass-card-enterprise" style="max-width: 800px; margin: 0 auto; text-align: center; padding: 3rem;">
                    <div style="font-size: 4rem; margin-bottom: 2rem;">🎮</div>
                    <h2 style="color: var(--primary); margin-bottom: 1rem;">SIMULADOR DE AMERICANAS</h2>
                    <p style="color: var(--text-muted); margin-bottom: 2.5rem;">Crea un evento de prueba completo: genera jugadores mock, inscribe a todos, genera 6 rondas de juego con IA y simula resultados realistas.</p>
                    
                    <div style="margin-bottom: 2rem; background: rgba(255,255,255,0.03); padding: 2rem; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05);">
                        <label style="color: var(--primary); font-weight: 800; display: block; margin-bottom: 1rem; letter-spacing: 1px;">⚙️ CONFIGURACIÓN DE ESCENARIO</label>
                        <div style="display: flex; align-items: center; justify-content: center; gap: 20px;">
                            <div style="flex: 1;">
                                <label style="font-size: 0.7rem; color: var(--text-muted); display: block; margin-bottom: 5px;">NÚMERO DE PISTAS</label>
                                <select id="sim-courts" class="pro-input" style="width: 100%; text-align: center;">
                                    <option value="2">2 Pistas (8 Jugadores)</option>
                                    <option value="3" selected>3 Pistas (12 Jugadores)</option>
                                    <option value="4">4 Pistas (16 Jugadores)</option>
                                    <option value="5">5 Pistas (20 Jugadores)</option>
                                    <option value="6">6 Pistas (24 Jugadores)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <button class="btn-primary-pro" id="btn-run-simulation" style="padding: 1.5rem 3rem; font-size: 1.1rem;">🚀 LANZAR SIMULACIÓN COMPLETA</button>
                    <div id="sim-status" style="margin-top: 2rem; font-family: 'Courier New', monospace; font-size: 0.8rem; color: var(--primary); text-align: left; display: none; background: rgba(0,0,0,0.3); padding: 1.5rem; border-radius: 12px;"></div>
                </div>`;
            document.getElementById('btn-run-simulation').addEventListener('click', () => AdminSimulator.runFullCycle());
            document.getElementById('btn-run-simulation').addEventListener('click', () => AdminSimulator.runFullCycle());

        } else if (view === 'matches') {
            if (titleEl) titleEl.textContent = 'Centro de Resultados - 6 Rondas';

            const americanas = await FirebaseDB.americanas.getAll();
            const activeAmericana = americanas.find(a => a.status === 'in_progress' || a.status === 'open') || americanas[0];

            if (!activeAmericana) {
                content.innerHTML = `<div class="glass-card-enterprise text-center" style="padding: 4rem;"><p>No hay americanas activas.</p></div>`;
                return;
            }

            content.innerHTML = `
                <div class="dashboard-header-pro" style="margin-bottom: 2rem;">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <span style="font-size: 2rem;">🏆</span>
                        <div>
                            <h2 style="margin:0; color: var(--primary);">${activeAmericana.name}</h2>
                        </div>
                    </div>
                    <div style="display: flex; gap: 0.5rem;" id="round-selector">
                        ${[1, 2, 3, 4, 5, 6].map(r => `<button class="btn-round-tab" id="btn-round-${r}" onclick="renderMatchesForAmericana('${activeAmericana.id}', ${r})">R${r}</button>`).join('')}
                    </div>
                </div>
                <div style="margin-bottom: 2rem; display: flex; align-items: center; gap: 1.5rem; background: var(--grad-dark); padding: 1.5rem; border-radius: 12px; border: var(--border-pro);">
                    <label style="color: var(--text-muted); font-size: 0.7rem; font-weight: 800;">CONTROL OPERATIVO:</label>
                    <select id="americana-select" onchange="renderMatchesForAmericana(this.value)" class="pro-input" style="width: 350px;">
                        ${americanas.map(a => `<option value="${a.id}" ${a.id === activeAmericana.id ? 'selected' : ''}>${a.name.toUpperCase()} (${a.date})</option>`).join('')}
                    </select>
                </div>
                <div id="matches-container"><div class="loader"></div></div>`;

            window.renderMatchesForAmericana = async (americanaId, roundNum = 1) => {
                document.querySelectorAll('.btn-round-tab').forEach(btn => btn.classList.remove('active'));
                document.getElementById(`btn-round-${roundNum}`)?.classList.add('active');
                const container = document.getElementById('matches-container');
                if (!container) return;
                container.innerHTML = '<div class="loader"></div>';
                try {
                    const matches = await FirebaseDB.matches.getByAmericana(americanaId);
                    const roundMatches = matches.filter(m => m.round === roundNum);
                    if (roundMatches.length === 0) {
                        container.innerHTML = `<div class="glass-card-enterprise" style="text-align: center; padding: 4rem;"><h3>RONDA ${roundNum} SIN PARTIDOS</h3><button class="btn-primary-pro" onclick="generateMatches('${americanaId}', ${roundNum})">GENERAR RONDA ${roundNum}</button></div>`;
                    } else {
                        container.innerHTML = `<div class="court-grid-pro">${roundMatches.map(m => `
                            <div class="court-card-pro ${m.status}" id="match-${m.id}">
                                <div class="court-header"><span class="court-label">PISTA ${m.court}</span><span class="status-badge ${m.status}">${(m.status || 'ESPERA').toUpperCase()}</span></div>
                                <div class="match-teams">
                                    <div class="team-row"><span class="team-names">${m.team_a_names}</span><div class="score-input-group"><button onclick="updateMatchScore('${m.id}', 'a', -1, '${americanaId}')">-</button><span class="score-val" id="scoreA-${m.id}">${m.score_a || 0}</span><button onclick="updateMatchScore('${m.id}', 'a', 1, '${americanaId}')">+</button></div></div>
                                    <div class="team-row"><span class="team-names">${m.team_b_names}</span><div class="score-input-group"><button onclick="updateMatchScore('${m.id}', 'b', -1, '${americanaId}')">-</button><span class="score-val" id="scoreB-${m.id}">${m.score_b || 0}</span><button onclick="updateMatchScore('${m.id}', 'b', 1, '${americanaId}')">+</button></div></div>
                                </div>
                                <div class="court-footer"><select onchange="updateMatchStatus('${m.id}', this.value, '${americanaId}')" class="mini-select"><option value="scheduled" ${m.status === 'scheduled' ? 'selected' : ''}>PROGRAMADO</option><option value="live" ${m.status === 'live' ? 'selected' : ''}>EN JUEGO</option><option value="finished" ${m.status === 'finished' ? 'selected' : ''}>FINALIZADO</option></select><button class="save-btn" onclick="saveMatchData('${m.id}', '${americanaId}')">GUARDAR</button></div>
                            </div>`).join('')}</div>`;
                    }
                } catch (e) { container.innerHTML = `Error: ${e.message}`; }
            };
            renderMatchesForAmericana(activeAmericana.id, 1);

        } else {
            titleEl.textContent = 'Configuración';
            content.innerHTML = `<div class="glass-card-enterprise"><h3>CONFIGURACIÓN DEL SISTEMA</h3><button class="btn-outline-pro" onclick="AdminAuth.logout()">CERRAR SESIÓN SEGURA</button></div>`;
        }
    } catch (e) {
        console.error("View Load Error:", e);
        content.innerHTML = `<div class="error">Error: ${e.message}</div>`;
    }
}

// --- CRUD & Helpers ---
window.filterUsers = (query) => {
    const term = query.toLowerCase();
    document.querySelectorAll('.pro-table-row').forEach(row => {
        row.style.display = row.innerText.toLowerCase().includes(term) ? '' : 'none';
    });
};

window.openCreateUserModal = () => {
    document.getElementById('modal-title').textContent = "Nuevo Jugador";
    document.getElementById('admin-user-form').reset();
    document.querySelector('[name=id]').value = "";
    document.getElementById('admin-user-modal').style.display = 'flex';
};

window.openEditUserModal = (user) => {
    document.getElementById('modal-title').textContent = "Editar Jugador";
    const form = document.getElementById('admin-user-form');
    form.querySelector('[name=id]').value = user.id;
    form.querySelector('[name=name]').value = user.name;
    form.querySelector('[name=phone]').value = user.phone;
    form.querySelector('[name=role]').value = user.role;
    form.querySelector('[name=status]').value = user.status;
    form.querySelector('[name=level]').value = user.level || user.self_rate_level || 3.5;
    form.querySelector('[name=matches_played]').value = user.matches_played || 0;
    form.querySelector('[name=password]').value = user.password || '';
    document.getElementById('admin-user-modal').style.display = 'flex';
};

window.closeAdminModal = () => { document.getElementById('admin-user-modal').style.display = 'none'; };

window.deleteUser = async (id) => {
    if (confirm("⚠️ ¿ELIMINAR este usuario?")) {
        try { await FirebaseDB.players.delete(id); loadAdminView('users'); } catch (e) { alert(e.message); }
    }
};

window.generateMatches = async (americanaId, roundNum = 1) => {
    try {
        const [americana, players, allMatches] = await Promise.all([
            FirebaseDB.americanas.getById(americanaId),
            FirebaseDB.players.getAll(),
            FirebaseDB.matches.getByAmericana(americanaId)
        ]);
        const result = AmericanaLogic.generateRound(players, allMatches, americana.max_courts || 4);
        for (const m of result) {
            m.americana_id = americanaId; m.round = roundNum;
            await FirebaseDB.matches.create(m);
        }
        renderMatchesForAmericana(americanaId, roundNum);
    } catch (e) { alert("Error IA: " + e.message); }
};

window.updateMatchScore = (matchId, team, delta) => {
    const el = document.getElementById(`score${team.toUpperCase()}-${matchId}`);
    let val = Math.max(0, parseInt(el.textContent) + delta);
    el.textContent = val;
};

window.updateMatchStatus = (matchId, status) => {
    const card = document.getElementById(`match-${matchId}`);
    if (card) card.className = `court-card-pro ${status}`;
};

window.saveMatchData = async (matchId, americanaId) => {
    try {
        const scoreA = parseInt(document.getElementById(`scoreA-${matchId}`).textContent);
        const scoreB = parseInt(document.getElementById(`scoreB-${matchId}`).textContent);
        const status = document.querySelector(`#match-${matchId} select`).value;
        await FirebaseDB.matches.update(matchId, { score_a: scoreA, score_b: scoreB, status: status });
        alert("Guardado");
        if (status === 'finished') await syncRankings(americanaId);
        renderMatchesForAmericana(americanaId, parseInt(document.querySelector('.btn-round-tab.active')?.textContent.replace('R', '') || 1));
    } catch (e) { alert(e.message); }
};

async function syncRankings(americanaId) {
    console.log("📈 Synchronizing Rankings with Level Evolution...");
    try {
        const [matches, players] = await Promise.all([
            FirebaseDB.matches.getByAmericana(americanaId),
            FirebaseDB.players.getAll()
        ]);

        const finished = matches.filter(m => m.status === 'finished');
        if (finished.length === 0) return;

        // Clone current state as base for evolution
        const stats = {};
        players.forEach(p => {
            const currentLevel = parseFloat(p.self_rate_level || p.level || 3.5);
            stats[p.id] = {
                score: 0,
                wins: 0,
                matches: 0,
                level: currentLevel,
                levelHistory: [currentLevel]
            };
        });

        // 🏆 EVOLUTION ENGINE (Elo-inspired for Padel)
        // Sort matches by time/round to evolve levels chronologically
        const sortedMatches = finished.sort((a, b) => (a.round || 0) - (b.round || 0));

        sortedMatches.forEach(m => {
            const teamAIds = m.team_a_ids || [];
            const teamBIds = m.team_b_ids || [];
            const sA = m.score_a || 0;
            const sB = m.score_b || 0;

            if (teamAIds.length < 2 || teamBIds.length < 2) return;

            // Get average levels for teams
            const levA = (stats[teamAIds[0]]?.level + stats[teamAIds[1]]?.level) / 2;
            const levB = (stats[teamBIds[0]]?.level + stats[teamBIds[1]]?.level) / 2;

            // K-Factor: Sensitivity of level changes (0.05 is fairly standard for Padel stability)
            const K = 0.05;

            // Probability of Team A winning (Logistic function)
            const expectedA = 1 / (1 + Math.pow(10, (levB - levA) / 1.0));

            // Actual outcome (1 for win, 0.5 for draw, 0 for loss)
            let actualA = 0.5;
            if (sA > sB) actualA = 1;
            else if (sB > sA) actualA = 0;

            // Level Shift
            const shift = K * (actualA - expectedA);

            // Update Players
            teamAIds.forEach(pid => {
                if (!stats[pid]) return;
                stats[pid].level = Math.max(0, Math.min(7, stats[pid].level + shift));
                stats[pid].score += sA;
                stats[pid].matches++;
                if (sA > sB) stats[pid].wins++;
            });

            teamBIds.forEach(pid => {
                if (!stats[pid]) return;
                stats[pid].level = Math.max(0, Math.min(7, stats[pid].level - shift)); // Team B outcome is opposite
                stats[pid].score += sB;
                stats[pid].matches++;
                if (sB > sA) stats[pid].wins++;
            });
        });

        // Push Updates to Firebase
        for (const pid in stats) {
            if (stats[pid].matches > 0) {
                const s = stats[pid];
                await FirebaseDB.players.update(pid, {
                    matches_played: s.matches,
                    win_rate: ((s.wins / s.matches) * 100).toFixed(1),
                    total_score: s.score,
                    self_rate_level: s.level.toFixed(2), // Evolution!
                    level: s.level.toFixed(2)
                });
            }
        }
        console.log("✅ Level Sync Complete");
    } catch (e) { console.error("❌ Sync Error:", e); }
}

const AdminSimulator = {
    async runFullCycle() {
        const status = document.getElementById('sim-status');
        const courtSelect = document.getElementById('sim-courts');
        const numCourts = parseInt(courtSelect?.value || 3);
        const numPlayers = numCourts * 4;

        if (status) {
            status.style.display = 'block';
            status.innerHTML = '🤖 <b>INICIANDO TURBO-SIMULACIÓN</b><br>';
            status.innerHTML += `> Configurando escenario: ${numCourts} Pistas / ${numPlayers} Jugadores...<br>`;
        }

        try {
            // 1. Create Americana
            const americanaData = {
                name: 'SIM ' + numCourts + ' PISTAS - ' + new Date().getHours() + ':' + new Date().getMinutes(),
                date: new Date().toISOString().split('T')[0],
                status: 'in_progress',
                players: [],
                max_courts: numCourts,
                category: 'mixed',
                image_url: 'img/americana-pro.png'
            };

            const newAmericana = await FirebaseDB.americanas.create(americanaData);
            const americanaId = newAmericana.id;

            if (status) status.innerHTML += `> Torneo creado con ID real: ${americanaId}<br>`;

            // 2. Generate Players
            const mockPlayers = [];
            const baseNames = ["Carlos", "Elena", "Marc", "Lucía", "Jordi", "Marta", "David", "Sonia", "Pablo", "Laura", "Quim", "Anna", "Victor", "Silvia", "Robert", "Monica", "Xavi", "Paula", "Oscar", "Cristina", "Biel", "Laia", "Pau", "Nerea"];

            if (status) status.innerHTML += `> Generando pool de ${numPlayers} jugadores Pro-Mock...<br>`;

            for (let i = 0; i < numPlayers; i++) {
                const baseLevel = (3.0 + Math.random() * 1.5).toFixed(2);
                const pId = 'mock_' + i + '_' + Date.now();
                const p = {
                    id: pId,
                    name: (baseNames[i] || 'Jugador') + ' (Sim)',
                    phone: '900000' + (100 + i),
                    level: baseLevel,
                    self_rate_level: baseLevel,
                    status: 'active',
                    role: 'player',
                    matches_played: 0,
                    win_rate: 0
                };
                mockPlayers.push(p);
                // Use global db
                await window.db.collection('players').doc(pId).set(p);
            }

            // 3. Register Players to Americana
            await FirebaseDB.americanas.update(americanaId, { players: mockPlayers.map(p => p.id) });
            if (status) status.innerHTML += '> <b>Inscripción masiva completada.</b><br>';

            // 4. Generate Rounds and Matches
            let allM = [];
            for (let r = 1; r <= 6; r++) {
                if (status) status.innerHTML += `> Generando Ronda ${r} con IA... `;

                const round = AmericanaLogic.generateRound(mockPlayers, allM, numCourts);

                for (const m of round) {
                    const sA = 5 + Math.floor(Math.random() * 7); // 5 to 11
                    const sB = 5 + Math.floor(Math.random() * 7); // 5 to 11

                    const mData = {
                        ...m,
                        americana_id: americanaId,
                        round: r,
                        status: 'finished',
                        score_a: sA,
                        score_b: sB
                    };
                    await FirebaseDB.matches.create(mData);
                    allM.push(mData);
                }
                if (status) status.innerHTML += '✅<br>';
            }

            // 5. Final Sync
            if (status) status.innerHTML += '> <b>Sincronizando evolución técnica...</b><br>';
            await syncRankings(americanaId);

            if (status) {
                status.innerHTML += '<br>🏁 <b>SIMULACIÓN COMPLETADA CON ÉXITO</b><br>';
                status.innerHTML += '> Niveles actualizados en DB Real-Time.<br>';
            }

            setTimeout(() => loadAdminView('matches'), 2500);
        } catch (e) {
            console.error(e);
            if (status) status.innerHTML += `<br>❌ <b>ERROR CRÍTICO:</b> ${e.message}`;
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('admin-login-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        AdminAuth.login(fd.get('phone'), fd.get('password'));
    });
    document.getElementById('admin-user-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const id = fd.get('id');
        const data = { name: fd.get('name'), phone: fd.get('phone'), role: fd.get('role'), status: fd.get('status'), level: parseFloat(fd.get('level')) };
        try {
            if (id) await FirebaseDB.players.update(id, data);
            else await FirebaseDB.players.create(data);
            closeAdminModal(); loadAdminView('users');
        } catch (err) { alert(err.message); }
    });
    AdminAuth.init();
});
