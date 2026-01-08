// Admin Dashboard Logic
console.log("🚀 Admin JS Loading...");


window.AdminAuth = {
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

    async init() {
        console.log("🛠️ AdminAuth Init START");
        try {
            const modal = document.getElementById('admin-auth-modal');

            // 1. Check Active Session
            const isAdmin = this.user && (this.user.role === 'admin' || this.user.role === 'admin_player');

            if (isAdmin) {
                console.log("💎 Active Admin Session:", this.user.name);
                if (modal) {
                    modal.classList.add('hidden');
                    modal.style.display = 'none';
                }
                loadAdminView('users');
            } else {
                // 2. Check "Remember Me" Credentials
                const savedPhone = localStorage.getItem('admin_remember_phone');
                const savedPass = localStorage.getItem('admin_remember_pass');

                if (savedPhone && savedPass) {
                    console.log("⚡ Auto-Login via Remember Me...");
                    await this.login(savedPhone, atob(savedPass), true); // Pass true to skip alert
                } else {
                    console.log("🔒 Waiting for manual login...");
                    // No default auto-login for safety unless specifically saved
                }
            }
        } catch (e) {
            console.error("❌ AdminAuth Init Error:", e);
        }
    },

    async login(phoneInput, password, isAuto = false) {
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

            // 1. EMERGENCY MASTER OVERRIDE - SOLO ALEX
            const cleanPhone = rawPhone.replace(/\D/g, '');
            const isAlex = (cleanPhone.endsWith("649219350") || cleanPhone === "649219350") && rawPass === "JARABA";

            if (isAlex) {
                if (!isAuto) alert(`🎖️ ACCESO MAESTRO ADMIN: Alejandro Coscolín`);

                const masterUser = {
                    id: "god-master-649219350",
                    name: "Alejandro Coscolín",
                    role: "admin_player",
                    phone: "649219350",
                    status: "active"
                };

                this.setUser(masterUser);

                // Handle "Remember Me"
                const rememberCheckbox = document.getElementById('remember-me');
                if (rememberCheckbox && rememberCheckbox.checked) {
                    localStorage.setItem('admin_remember_phone', rawPhone);
                    localStorage.setItem('admin_remember_pass', btoa(rawPass)); // Simple encoding
                }
                return;
            }

            // 2. REGULAR DB LOGIN
            const user = await FirebaseDB.players.getByPhone(cleanPhone);

            if (!user) throw new Error("⚠️ EL TELÉFONO NO ESTÁ REGISTRADO.");
            if (user.password !== password && user.password !== rawPass) throw new Error("❌ CONTRASEÑA INCORRECTA.");

            const hasPrivileges = user.role === 'admin' || user.role === 'admin_player';
            if (!hasPrivileges) throw new Error("🚫 ACCESO DENEGADO: NO ERES ADMINISTRADOR.");

            this.setUser(user);
            console.log("✅ Admin access granted via DB");

            // Handle "Remember Me"
            const rememberCheckbox = document.getElementById('remember-me');
            if (rememberCheckbox && rememberCheckbox.checked) {
                localStorage.setItem('admin_remember_phone', cleanPhone);
                localStorage.setItem('admin_remember_pass', btoa(rawPass));
            }

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

    // 🚨 AGGRESSIVE DATA WIPE - KEEP ONLY MAIN ADMIN
    async wipeMockData() {
        console.warn("🧹 INICIANDO LIMPIEZA AGRESIVA DE BASE DE DATOS...");
        try {
            const users = await FirebaseDB.players.getAll();
            console.log(`📊 Total usuarios encontrados: ${users.length}`);

            let deleted = 0;
            let protected = 0;

            for (const u of users) {
                // SOLO proteger al usuario principal: 649219350
                if (u.phone === '649219350') {
                    console.log(`✅ PROTEGIDO: ${u.name} (${u.phone})`);
                    protected++;
                    continue;
                }

                // Eliminar TODO lo demás
                console.log(`🗑️ ELIMINANDO: ${u.name} (${u.phone || u.id})`);
                await FirebaseDB.players.delete(u.id);
                deleted++;
            }

            console.log(`✅ LIMPIEZA COMPLETADA: ${deleted} eliminados, ${protected} protegidos`);
        } catch (e) {
            console.error("❌ Error en limpieza automática:", e);
        }
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

    // Wait for DB if not ready
    if (!window.db) {
        console.log("⏳ Waiting for Firebase DB...");
        let retries = 0;
        while (!window.db && retries < 20) {
            await new Promise(r => setTimeout(r, 200));
            retries++;
        }
    }

    // Update Sidebar Active State
    document.querySelectorAll('.nav-item-pro').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-view') === view);
    });

    try {
        if (view === 'users') {
            if (titleEl) titleEl.textContent = 'BBDD JUGADORES';
            content.innerHTML = '<div class="loader"></div>';

            // FETCH REAL DATA (Simulator data needs to be seen)
            const users = await FirebaseDB.players.getAll();

            const rows = users.map(u => {
                const isPending = u.status === 'pending';
                return `
                <tr class="pro-table-row" style="background: ${isPending ? 'rgba(255,165,0,0.05)' : 'transparent'}">
                    <td>
                        <div class="pro-player-cell">
                            <div class="pro-avatar" style="background: ${u.role === 'admin_player' ? 'var(--primary-glow)' : ''}">${u.name.charAt(0)}</div>
                            <div>
                                <div style="display:flex; align-items:center; gap:8px;">
                                    <div style="font-weight: 700; color: var(--text);">${u.name}</div>
                                    ${u.membership === 'somospadel_bcn' ? '<span style="font-size:0.6rem; background: var(--primary); color:black; padding: 2px 5px; border-radius:4px; font-weight:700;">COMUNIDAD BCN</span>' : ''}
                                </div>
                                <div style="font-size: 0.7rem; font-weight: 500; color: ${u.role === 'admin_player' ? 'var(--primary)' : 'var(--text-muted)'};">
                                    ${u.role === 'admin_player' ? '🎖️ ADMIN + JUGADOR' : (u.role || 'player').toUpperCase()}
                                </div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div style="display:flex; align-items:center; gap:0.8rem;">
                             <span style="color: var(--primary); font-family: 'Outfit'; font-weight: 600;">${u.phone}</span>
                             <button onclick="openWhatsAppActions('${u.phone}', '${u.name}')" title="Abrir Chat de WhatsApp" style="cursor:pointer; background: rgba(37, 211, 102, 0.1); color: #25D366; border: 1px solid #25D366; padding: 6px 12px; border-radius: 8px; font-weight: 700; display: flex; align-items: center; gap: 6px; font-size: 0.75rem; transition: all 0.2s;">
                                <span style="font-size: 1rem;">💬</span> CHAT
                             </button>
                        </div>
                    </td>
                    <td>
                        <span class="pro-category-badge" style="background: var(--surface-hover);">${u.level || u.self_rate_level || '3.5'}</span>
                    </td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span class="pro-category-badge" style="background: ${u.gender === 'chica' ? 'rgba(236, 72, 153, 0.1)' : 'rgba(59, 130, 246, 0.1)'}; color: ${u.gender === 'chica' ? '#ec4899' : '#3b82f6'}; border: 1px solid ${u.gender === 'chica' ? '#ec4899' : '#3b82f6'}; font-weight: 800; padding: 4px 10px; border-radius: 6px; font-size: 0.7rem;">
                                ${u.gender === 'chica' ? '👧 CHICA' : '👦 CHICO'}
                            </span>
                        </div>
                    </td>
                    <td>
                         <span class="pro-category-badge" style="background: ${u.status === 'active' ? 'var(--primary)' : 'transparent'}; color: ${u.status === 'active' ? 'black' : 'var(--warning)'}; border-color: ${u.status === 'active' ? 'var(--primary)' : 'var(--warning)'}; font-weight: 800;">
                            ${(u.status === 'active' ? 'ACTIVO' : (u.status || 'PENDIENTE')).toUpperCase()}
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
                    <div style="padding: 1.5rem 2rem; display: flex; justify-content: space-between; align-items: center; border-bottom: var(--border-pro); flex-wrap: wrap; gap: 1rem;">
                        <h3 style="margin:0;">GOBERNANZA DE JUGADORES <span style="color:var(--text-muted); font-size: 0.8rem; margin-left: 10px;">TOTAL: ${users.length}</span></h3>
                        <div style="display:flex; gap: 0.8rem; flex-wrap: wrap;">
                            <button class="btn-outline-pro" style="padding: 0.5rem 1rem; border-color: #107c10; color: #107c10; background: rgba(16, 124, 16, 0.05);" onclick="exportToExcel()">
                                📗 EXPORTAR EXCEL
                            </button>
                            <input type="text" id="global-search" placeholder="Buscar globalmente..." class="pro-input" style="width: 200px; padding: 0.5rem 1rem;" onkeyup="multiFilterUsers()">
                            <button class="btn-primary-pro" style="padding: 0.5rem 1.5rem;" onclick="openCreateUserModal()">+ REGISTRAR</button>
                        </div>
                    </div>
                    <div class="filters-row" style="padding: 1rem 2rem; background: rgba(255,255,255,0.02); display: grid; grid-template-columns: 2fr 1.5fr 1fr 1fr 1fr 1fr; gap: 1rem; border-bottom: var(--border-pro);">
                        <input type="text" id="filter-name" placeholder="Filtrar nombre..." class="pro-input-micro" onkeyup="multiFilterUsers()">
                        <input type="text" id="filter-phone" placeholder="Filtrar teléfono..." class="pro-input-micro" onkeyup="multiFilterUsers()">
                        <input type="text" id="filter-level" placeholder="Nivel..." class="pro-input-micro" onkeyup="multiFilterUsers()">
                        <select id="filter-gender" class="pro-input-micro" onchange="multiFilterUsers()">
                            <option value="">Género (Todos)</option>
                            <option value="chico">CHICO</option>
                            <option value="chica">CHICA</option>
                        </select>
                        <select id="filter-status" class="pro-input-micro" onchange="multiFilterUsers()">
                            <option value="">Estado (Todos)</option>
                            <option value="active">ACTIVO</option>
                            <option value="pending">PENDIENTE</option>
                            <option value="blocked">BLOQUEADO</option>
                        </select>
                        <button class="btn-micro" onclick="resetFilters()" style="background: rgba(255,255,255,0.1);">Limpiar</button>
                    </div>
                    <table class="pro-table">
                        <thead>
                            <tr>
                                <th>IDENTIDAD</th>
                                <th>CONTACTO</th>
                                <th>NIVEL TÉCNICO</th>
                                <th>GÉNERO</th>
                                <th>ESTADO CUENTA</th>
                                <th style="text-align:right;">ACCIONES DE CONTROL</th>
                            </tr>
                        </thead>
                        <tbody id="users-tbody">${rows}</tbody>
                    </table>
                    <div class="pro-table-footer">SISTEMA INTEGRADO DE BASE DE DATOS v2.0 PRO</div>
                </div>`;

            window.allUsersCache = users;
            window.filteredUsers = [...users];

            window.renderUserRows = (data) => {
                const tbody = document.getElementById('users-tbody');
                if (!tbody) return;
                tbody.innerHTML = data.map(u => {
                    const isPending = u.status === 'pending';
                    return `
                    <tr class="pro-table-row" style="background: ${isPending ? 'rgba(255,165,0,0.05)' : 'transparent'}">
                        <td>
                            <div class="pro-player-cell">
                                <div class="pro-avatar" style="background: ${u.role === 'admin_player' ? 'var(--primary-glow)' : ''}">${u.name.charAt(0)}</div>
                                <div>
                                    <div style="display:flex; align-items:center; gap:8px;">
                                        <div style="font-weight: 700; color: var(--text);">${u.name}</div>
                                        ${u.membership === 'somospadel_bcn' ? '<span style="font-size:0.6rem; background: var(--primary); color:black; padding: 2px 5px; border-radius:4px; font-weight:700;">COMUNIDAD BCN</span>' : ''}
                                    </div>
                                    <div style="font-size: 0.7rem; font-weight: 500; color: ${u.role === 'admin_player' ? 'var(--primary)' : 'var(--text-muted)'};">
                                        ${u.role === 'admin_player' ? '🎖️ ADMIN + JUGADOR' : (u.role || 'player').toUpperCase()}
                                    </div>
                                </div>
                            </div>
                        </td>
                        <td>
                            <div style="display:flex; align-items:center; gap:0.8rem;">
                                 <span style="color: var(--primary); font-family: 'Outfit'; font-weight: 600;">${u.phone}</span>
                                 <button onclick="openWhatsAppActions('${u.phone}', '${u.name}')" title="Abrir Chat de WhatsApp" style="cursor:pointer; background: rgba(37, 211, 102, 0.1); color: #25D366; border: 1px solid #25D366; padding: 6px 12px; border-radius: 8px; font-weight: 700; display: flex; align-items: center; gap: 6px; font-size: 0.75rem; transition: all 0.2s;">
                                    <span style="font-size: 1rem;">💬</span> CHAT
                                 </button>
                            </div>
                        </td>
                        <td>
                            <span class="pro-category-badge" style="background: var(--surface-hover);">${u.level || u.self_rate_level || '3.5'}</span>
                        </td>
                        <td>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span class="pro-category-badge" style="background: ${u.gender === 'chica' ? 'rgba(236, 72, 153, 0.1)' : 'rgba(59, 130, 246, 0.1)'}; color: ${u.gender === 'chica' ? '#ec4899' : '#3b82f6'}; border: 1px solid ${u.gender === 'chica' ? '#ec4899' : '#3b82f6'}; font-weight: 800; padding: 4px 10px; border-radius: 6px; font-size: 0.7rem;">
                                    ${u.gender === 'chica' ? '👧 CHICA' : '👦 CHICO'}
                                </span>
                            </div>
                        </td>
                        <td>
                             <span class="pro-category-badge" style="background: ${u.status === 'active' ? 'var(--primary)' : 'transparent'}; color: ${u.status === 'active' ? 'black' : 'var(--warning)'}; border-color: ${u.status === 'active' ? 'var(--primary)' : 'var(--warning)'}; font-weight: 800;">
                                ${(u.status === 'active' ? 'ACTIVO' : (u.status || 'PENDIENTE')).toUpperCase()}
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
            };

            window.multiFilterUsers = () => {
                const search = document.getElementById('global-search').value.toLowerCase();
                const fName = document.getElementById('filter-name').value.toLowerCase();
                const fPhone = document.getElementById('filter-phone').value.toLowerCase();
                const fLevel = document.getElementById('filter-level').value.toLowerCase();
                const fGender = document.getElementById('filter-gender').value;
                const fStatus = document.getElementById('filter-status').value;

                window.filteredUsers = window.allUsersCache.filter(u => {
                    const matchesGlobal = !search ||
                        u.name.toLowerCase().includes(search) ||
                        u.phone.includes(search);

                    const matchesName = !fName || u.name.toLowerCase().includes(fName);
                    const matchesPhone = !fPhone || u.phone.includes(fPhone);
                    const matchesLevel = !fLevel || (u.level || u.self_rate_level || '3.5').toString().includes(fLevel);
                    const matchesGender = !fGender || u.gender === fGender;
                    const matchesStatus = !fStatus || u.status === fStatus;

                    return matchesGlobal && matchesName && matchesPhone && matchesLevel && matchesGender && matchesStatus;
                });

                window.renderUserRows(window.filteredUsers);
                // Update total count display
                const totalEl = document.querySelector('h3 span');
                if (totalEl) totalEl.textContent = `TOTAL: ${window.filteredUsers.length}`;
            };

            window.resetFilters = () => {
                document.getElementById('global-search').value = "";
                document.getElementById('filter-name').value = "";
                document.getElementById('filter-phone').value = "";
                document.getElementById('filter-level').value = "";
                document.getElementById('filter-gender').value = "";
                document.getElementById('filter-status').value = "";
                window.multiFilterUsers();
            };

            window.exportToExcel = () => {
                if (typeof XLSX === 'undefined') {
                    alert('Error: Librería de exportación no cargada. Por favor, recarga la página.');
                    return;
                }

                // Prepare data for Excel
                const data = window.filteredUsers.map(u => ({
                    'NOMBRE': u.name,
                    'TELÉFONO': u.phone,
                    'NIVEL': u.level || u.self_rate_level || '3.5',
                    'GÉNERO': u.gender === 'chica' ? 'FEMENINO' : 'MASCULINO',
                    'ESTADO': (u.status || 'pending').toUpperCase(),
                    'MEMBRESÍA': u.membership === 'somospadel_bcn' ? 'COMUNIDAD' : 'EXTERNO',
                    'ROL': (u.role || 'player').toUpperCase(),
                    'PARTIDOS JUGADOS': u.matches_played || 0
                }));

                const ws = XLSX.utils.json_to_sheet(data);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Jugadores");

                // Auto-size columns (basic implementation)
                const colWidths = [
                    { wch: 30 }, // Nombre
                    { wch: 15 }, // Teléfono
                    { wch: 10 }, // Nivel
                    { wch: 12 }, // Género
                    { wch: 12 }, // Estado
                    { wch: 15 }, // Membresía
                    { wch: 15 }, // Rol
                    { wch: 18 }  // Partidos
                ];
                ws['!cols'] = colWidths;

                XLSX.writeFile(wb, `Jugadores_Somospadel_${new Date().toISOString().split('T')[0]}.xlsx`);
            };

            window.approveUser = async (id) => {
                if (!confirm("¿Validar acceso para este usuario?")) return;
                try {
                    await FirebaseDB.players.update(id, { status: 'active' });
                    alert("Usuario validado correctamente");
                    loadAdminView('users');
                } catch (e) { alert("Error: " + e.message); }
            };

        } else if (view === 'menu_mgmt') {
            if (titleEl) titleEl.textContent = 'Gestor de Menú Lateral (App)';
            content.innerHTML = '<div class="loader"></div>';

            const menuItems = await FirebaseDB.menu.getAll();

            content.innerHTML = `
                <div class="glass-card-enterprise">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem;">
                         <h3>BOTONES DEL MENÚ LATERAL</h3>
                         <button class="btn-primary-pro" onclick="openMenuModal()">+ NUEVO BOTÓN</button>
                    </div>

                    <div style="background:rgba(255,255,255,0.05); border-radius:12px; overflow:hidden;">
                        ${menuItems.length === 0 ? '<div style="padding:2rem; text-align:center; color:#888;">No hay botones configurados. Crea el primero.</div>' : ''}
                        
                        ${menuItems.map(item => `
                            <div style="display:flex; align-items:center; justify-content:space-between; padding:15px; border-bottom:1px solid rgba(255,255,255,0.1);">
                                <div style="display:flex; align-items:center; gap:15px;">
                                    <div style="width:40px; height:40px; background:rgba(0,0,0,0.3); border-radius:8px; display:flex; align-items:center; justify-content:center; color:var(--brand-neon);">
                                        <i class="${item.icon}" style="font-size:1.2rem;"></i>
                                    </div>
                                    <div>
                                        <div style="font-weight:700; color:white; font-size:1.1rem;">${item.title}</div>
                                        <div style="font-size:0.8rem; color:#888;">Ruta: /${item.action} | Orden: ${item.order}</div>
                                    </div>
                                </div>
                                <div style="display:flex; align-items:center; gap:10px;">
                                    <span style="padding:4px 8px; border-radius:4px; font-size:0.7rem; font-weight:700; background:${item.active ? 'var(--primary)' : '#333'}; color:${item.active ? 'black' : '#888'};">
                                        ${item.active ? 'VISIBLE' : 'OCULTO'}
                                    </span>
                                    <button class="btn-outline-pro" onclick='openMenuModal(${JSON.stringify(item).replace(/'/g, "&#39;")})'>EDITAR</button>
                                    <button class="btn-micro" style="background:rgba(239,68,68,0.2); color:#ef4444;" onclick="deleteMenuItem('${item.id}')">🗑️</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
             `;

            // Menu Helpers
            window.openMenuModal = (item = null) => {
                const modal = document.getElementById('admin-menu-modal');
                const form = document.getElementById('admin-menu-form');
                form.reset();
                if (item) {
                    form.querySelector('[name=id]').value = item.id;
                    form.querySelector('[name=title]').value = item.title;
                    form.querySelector('[name=icon]').value = item.icon;
                    form.querySelector('[name=action]').value = item.action;
                    form.querySelector('[name=order]').value = item.order;
                    form.querySelector('[name=active]').value = item.active.toString();
                } else {
                    form.querySelector('[name=id]').value = '';
                }
                modal.classList.remove('hidden');
            };

            window.deleteMenuItem = async (id) => {
                if (!confirm('¿Borrar este botón del menú?')) return;
                await FirebaseDB.menu.delete(id);
                loadAdminView('menu_mgmt');
            };

            // Form Handler (One-time bind check logic needed or just re-bind safely)
            const form = document.getElementById('admin-menu-form');
            // Improve: Remove old listeners by cloning or checking attribute
            const newForm = form.cloneNode(true);
            form.parentNode.replaceChild(newForm, form);

            newForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const fd = new FormData(e.target);
                const data = Object.fromEntries(fd.entries());
                const id = data.id;
                delete data.id;

                try {
                    if (id) await FirebaseDB.menu.update(id, data);
                    else await FirebaseDB.menu.create(data);
                    document.getElementById('admin-menu-modal').classList.add('hidden');
                    loadAdminView('menu_mgmt');
                } catch (err) { alert(err.message); }
            });

        } else if (view === 'americanas_mgmt') {
            if (titleEl) titleEl.textContent = 'Centro de Planificación de Torneos';
            content.innerHTML = '<div class="loader"></div>';

            const americanas = await FirebaseDB.americanas.getAll();
            const listHtml = americanas.map(a => `
                <div class="glass-card-enterprise" style="margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; border-left: 4px solid var(--primary); background: linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%);">
                    <div style="display: flex; gap: 1.5rem; align-items: center; flex: 1;">
                        <div class="americana-preview-img" style="width: 90px; height: 90px; border-radius: 16px; background: url('${a.image_url || 'img/logo_somospadel.png'}') center/cover; border: 2px solid rgba(204,255,0,0.2); box-shadow: 0 4px 15px rgba(0,0,0,0.1);"></div>
                        <div class="americana-info-pro" style="flex: 1;">
                            <div style="font-weight: 900; font-size: 1.5rem; color: #FFFFFF; margin-bottom: 0.5rem; text-shadow: 0 2px 4px rgba(0,0,0,0.3); letter-spacing: 0.5px; line-height: 1.2;">${a.name.toUpperCase()}</div>
                            <div style="display: flex; gap: 1.5rem; font-size: 0.85rem; color: var(--text-muted); flex-wrap: wrap; margin-top: 0.5rem;">
                                <span style="display: flex; align-items: center; gap: 6px;">📅 <span style="color: #FFFFFF; font-weight: 600;">${a.date}</span></span>
                                <span style="display: flex; align-items: center; gap: 6px;">🕒 <span style="color: #FFFFFF; font-weight: 600;">${a.time || '18:30'}</span></span>
                                <span style="display: flex; align-items: center; gap: 6px;">🎾 <span style="color: #FFFFFF; font-weight: 600;">${a.max_courts || 4} Pistas</span></span>
                                <span style="display: flex; align-items: center; gap: 6px;">👥 <span style="color: var(--primary); font-weight: 700;">${a.players?.length || 0} Inscritos</span></span>
                            </div>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                         <!-- Category Badge -->
                        <span class="pro-category-badge" style="background: var(--primary); color: black; font-weight: 800; padding: 6px 14px; display: flex; align-items: center; gap: 6px; font-size: 0.75rem;">
                            ${a.category === 'female' ? '🚺' : (a.category === 'male' ? '🚹' : (a.category === 'mixed' ? '👫' : '🎾'))}
                            ${(a.category === 'open' ? 'TODOS' : (a.category === 'male' ? 'MASCULINA' : (a.category === 'female' ? 'FEMENINA' : (a.category === 'mixed' ? 'MIXTA' : 'TODOS')))).toUpperCase()}
                        </span>

                        <!-- Pair Mode Badge (New) -->
                        <span class="pro-category-badge" style="background: rgba(255, 255, 255, 0.1); color: white; font-weight: 700; padding: 6px 14px; border: 1px solid rgba(255,255,255,0.2); display: flex; align-items: center; gap: 6px; font-size: 0.75rem;">
                             ${a.pair_mode === 'fixed' ? '🔒' : '🔄'}
                             ${a.pair_mode === 'fixed' ? 'FIJA' : 'TWISTER'}
                        </span>
                        
                        <!-- PRICE SUMMARY -->
                        <span class="pro-category-badge" style="background: transparent; color: #aaa; border: 1px solid #444; font-size: 0.65rem;">
                             ${a.price_members || 12}€ / ${a.price_external || 14}€
                        </span>

                        <!-- Status Badge (New) -->
                        <span class="pro-category-badge" style="background: ${a.status === 'live' ? 'rgba(255, 45, 85, 0.1)' : (a.status === 'finished' ? 'rgba(136, 136, 136, 0.1)' : 'rgba(0, 227, 109, 0.1)')}; color: ${a.status === 'live' ? '#FF2D55' : (a.status === 'finished' ? '#888' : '#00E36D')}; border: 1px solid ${a.status === 'live' ? '#FF2D55' : (a.status === 'finished' ? '#444' : '#00E36D')}; font-size: 0.65rem; font-weight: 800; padding: 6px 14px; min-width: 90px; text-align: center;">
                             ${(a.status === 'open' ? 'ABIERTA' : (a.status === 'live' ? 'EN JUEGO' : (a.status === 'finished' ? 'FINALIZADA' : (a.status || 'ABIERTA')))).toUpperCase()}
                        </span>

                        <button class="btn-outline-pro" style="border-radius: 12px; padding: 10px 16px; display: flex; align-items: center; gap: 8px; border-color: var(--primary); color: var(--primary); font-weight: 700; font-size: 0.8rem;" 
                                onclick='openEditAmericanaModal(${JSON.stringify(a).replace(/'/g, "&#39;")})' title="Editar Evento">✏️ EDITAR</button>
                        <button class="btn-secondary" style="border-radius: 12px; padding: 10px 16px; display: flex; align-items: center; gap: 8px; border-color: var(--danger-dim); color: var(--danger); font-weight: 700; font-size: 0.8rem;" 
                                onclick="deleteAmericana('${a.id}')" title="Eliminar Permanente">🗑️ BORRAR</button>
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
                                    <option value="open">TODOS</option>
                                    <option value="male">MASCULINA</option>
                                    <option value="female">FEMENINA</option>
                                    <option value="mixed">MIXTA</option>
                                </select>
                            </div>
                            
                            <!-- NUEVO: Modo de Parejas -->
                            <div class="form-group">
                                <label style="display: flex; align-items: center; gap: 8px;">
                                    <span>🎯 MODO DE PAREJAS</span>
                                    <span style="font-size: 0.65rem; color: #888; font-weight: 400;">(Importante)</span>
                                </label>
                                <select name="pair_mode" class="pro-input" style="font-weight: 700;">
                                    <option value="fixed">🔒 PAREJA FIJA (Pozo - Suben/Bajan Juntos)</option>
                                    <option value="rotating">🔄 TWISTER (Americana Tradicional)</option>
                                </select>
                                <div style="margin-top: 8px; padding: 10px; background: rgba(204,255,0,0.05); border-radius: 6px; border: 1px solid rgba(204,255,0,0.1);">
                                    <div style="font-size: 0.7rem; color: #888; line-height: 1.5;">
                                        <strong style="color: var(--primary);">Fijas:</strong> Misma pareja todo el torneo, suben/bajan pistas según resultados<br>
                                        <strong style="color: var(--primary);">Rotativas:</strong> Cambias de compañero cada ronda
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label>PLANTILLA VISUAL (IMAGEN)</label>
                                <select name="image_url" class="pro-input">
                                    <option value="img/ball-mixta.png">PELOTA SOMOSPADEL (AMARILLO)</option>
                                    <option value="img/ball-masculina.png">PELOTA SOMOSPADEL (VERDE)</option>
                                    <option value="img/ball-femenina.png">PELOTA SOMOSPADEL (ROSA)</option>
                                    <option value="img/americana-pro.png">SALA PRO (NEÓN AMARILLO)</option>
                                    <option value="img/americana-night.png">NIGHT SESSION (AZUL/PÚRPURA)</option>
                                    <option value="img/americana-mixed.png">MIXED VIBES (NARANJA/ROJO)</option>
                                    <option value="img/logo_somospadel.png">LOGOTIPO CLUB</option>
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
                            <!-- PRECIOS -->
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                                <div class="form-group">
                                    <label>PRECIO SOCIOS (€)</label>
                                    <input type="number" name="price_members" value="12" class="pro-input">
                                </div>
                                <div class="form-group">
                                    <label>PRECIO EXTERNOS (€)</label>
                                    <input type="number" name="price_external" value="14" class="pro-input">
                                </div>
                            </div>
                            <button type="submit" class="btn-primary-pro" style="width: 100%; margin-top: 1rem; padding: 1.2rem;">LANZAR EVENTO ELITE 🚀</button>
                        </form>
                    </div>
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

            // Synchronization Logic for Create Form
            const createForm = document.getElementById('create-americana-form');
            if (createForm) {
                const catSelect = createForm.querySelector('[name=category]');
                const imgSelect = createForm.querySelector('[name=image_url]');

                catSelect.addEventListener('change', () => {
                    const cat = catSelect.value;
                    if (cat === 'male') imgSelect.value = 'img/ball-masculina.png';
                    else if (cat === 'female') imgSelect.value = 'img/ball-femenina.png';
                    else imgSelect.value = 'img/ball-mixta.png';

                    // Auto-fill Name if empty
                    const nameInput = createForm.querySelector('[name=name]');
                    if (!nameInput.value || nameInput.value.startsWith('AMERICANA')) {
                        const catLabel = cat === 'male' ? 'MASCULINA' : (cat === 'female' ? 'FEMENINA' : (cat === 'mixed' ? 'MIXTA' : 'TODOS'));
                        nameInput.value = `AMERICANA ${catLabel}`;
                    }
                });

                // Trigger once to set defaults
                catSelect.dispatchEvent(new Event('change'));
            }

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

            window.openEditAmericanaModal = async (americana) => {
                const modal = document.getElementById('admin-americana-modal');
                const form = document.getElementById('edit-americana-form');
                if (!modal || !form) return;

                // 1. Fill Form
                form.querySelector('[name=id]').value = americana.id;
                form.querySelector('[name=name]').value = americana.name;
                form.querySelector('[name=date]').value = americana.date;
                form.querySelector('[name=time]').value = americana.time || '18:30';
                form.querySelector('[name=category]').value = americana.category || 'open';
                form.querySelector('[name=max_courts]').value = americana.max_courts || 4;
                form.querySelector('[name=duration]').value = americana.duration || '2h';
                form.querySelector('[name=status]').value = americana.status || 'open';
                form.querySelector('[name=price_members]').value = americana.price_members || 12;
                form.querySelector('[name=price_external]').value = americana.price_external || 14;
                const imgUrl = americana.image_url || '';
                const imgInput = form.querySelector('[name=image_url]');
                const imgPreview = document.getElementById('img-preview');

                imgInput.value = imgUrl;

                // Set initial preview
                if (imgUrl) {
                    imgPreview.src = imgUrl;
                    imgPreview.style.display = 'block';
                } else {
                    imgPreview.style.display = 'none';
                }

                // Real-time preview update
                imgInput.oninput = function () {
                    const url = this.value;
                    if (url) {
                        imgPreview.src = url;
                        imgPreview.style.display = 'block';
                    } else {
                        imgPreview.style.display = 'none';
                    }
                };

                // Helper for quick select buttons
                window.selectImage = (url) => {
                    imgInput.value = url;
                    if (imgInput.oninput) imgInput.oninput();
                };

                // Auto-sync category change in Edit Modal
                const catSelectEdit = form.querySelector('[name=category]');
                catSelectEdit.onchange = () => {
                    const cat = catSelectEdit.value;
                    let url = 'img/ball-mixta.png';
                    if (cat === 'male') url = 'img/ball-masculina.png';
                    else if (cat === 'female') url = 'img/ball-femenina.png';

                    window.selectImage(url);
                };

                modal.classList.remove('hidden');
                modal.style.display = 'flex';

                // 2. Load Participants Section
                await loadParticipantsUI(americana.id);
            };

            // --- Participant Management Logic ---
            async function loadParticipantsUI(americanaId) {
                const listContainer = document.getElementById('participants-list');
                const select = document.getElementById('add-player-select');
                const addBtn = document.getElementById('btn-add-player');

                listContainer.innerHTML = '<div class="loader-mini"></div>';

                try {
                    // Fetch latest data
                    const [americana, allUsers] = await Promise.all([
                        FirebaseDB.americanas.getById(americanaId),
                        FirebaseDB.players.getAll()
                    ]);

                    // Normalize players list (handle legacy)
                    const participants = americana.players || americana.registeredPlayers || [];

                    // A. Populate Select (exclude already joined + filter by category)
                    const joinedIds = new Set(participants.map(p => p.id || p.uid));
                    const maxPlayers = (americana.max_courts || 0) * 4;
                    const isFull = participants.length >= maxPlayers;

                    // Gender filtering logic
                    let filteredUsers = allUsers.filter(u => !joinedIds.has(u.id));

                    if (americana.category === 'male') {
                        filteredUsers = filteredUsers.filter(u => u.gender === 'chico');
                    } else if (americana.category === 'female') {
                        filteredUsers = filteredUsers.filter(u => u.gender === 'chica');
                    } else if (americana.category === 'mixed' || americana.category === 'open') {
                        // Tanto MIXTO como OPEN admiten ambos géneros (chico o chica)
                        filteredUsers = filteredUsers.filter(u => u.gender === 'chico' || u.gender === 'chica');
                    }

                    const spotsText = isFull ?
                        '<span style="color:var(--danger); font-weight:800;">🚫 AMERICANA LLENA</span>' :
                        `<span style="color:var(--primary); font-weight:800;">👥 PLAZAS: ${participants.length}/${maxPlayers}</span>`;

                    const labelEl = document.querySelector('label[for="add-player-select"]');
                    if (labelEl) labelEl.innerHTML = `SELECCIONAR JUGADOR (${americana.category.toUpperCase()}) ${spotsText}`;

                    select.innerHTML = `<option value="">${isFull ? '--- EVENTO LLENO ---' : 'Seleccionar Jugador...'}</option>` +
                        filteredUsers
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map(u => `<option value="${u.id}">${u.name} (${u.level || '?'}) [${u.gender || '?'}]</option>`)
                            .join('');

                    select.disabled = isFull;

                    // B. Setup Add Button
                    addBtn.onclick = () => {
                        // Admin override: allow adding players beyond capacity to trigger auto-scaling logic later
                        // if (isFull) { ... } -> Removed restriction
                        addPlayerToAmericana(americanaId, select.value);
                    };

                    // C. Render List
                    if (participants.length === 0) {
                        listContainer.innerHTML = '<div style="text-align:center; color:#666; padding:15px; font-style:italic;">Sin participantes inscritos</div>';
                    } else {
                        // NEW: Gender Summary
                        const maleCount = participants.filter(p => p.gender === 'chico').length;
                        const femaleCount = participants.filter(p => p.gender === 'chica').length;
                        const summaryHtml = `
                            <div style="display:flex; gap:10px; margin-bottom:15px; background:rgba(0,0,0,0.2); padding:10px; border-radius:8px; border:1px solid rgba(255,255,255,0.05);">
                                <div style="flex:1; text-align:center;">
                                    <div style="font-size:0.6rem; color:#888; font-weight:800;">HOMBRES</div>
                                    <div style="font-size:1.1rem; font-weight:900; color:#3b82f6;">${maleCount}</div>
                                </div>
                                <div style="flex:1; text-align:center; border-left:1px solid rgba(255,255,255,0.1);">
                                    <div style="font-size:0.6rem; color:#888; font-weight:800;">MUJERES</div>
                                    <div style="font-size:1.1rem; font-weight:900; color:#ec4899;">${femaleCount}</div>
                                </div>
                                ${americana.category === 'mixed' ? `
                                <div style="flex:1; text-align:center; border-left:1px solid rgba(255,255,255,0.1);">
                                    <div style="font-size:0.6rem; color:#888; font-weight:800;">ESTADO</div>
                                    <div style="font-size:0.8rem; font-weight:900; color:${maleCount === femaleCount ? '#25d366' : '#fbbf24'}; margin-top:3px;">
                                        ${maleCount === femaleCount ? 'EQUILIBRADO' : 'DESCOMPENSADO'}
                                    </div>
                                </div>` : ''}
                            </div>
                        `;

                        // Pass index 'i' to ensure unique identification even for corrupt data
                        listContainer.innerHTML = summaryHtml + participants.map((p, i) => {
                            // Find full user details if available, else use stored info
                            const userDetails = allUsers.find(u => u.id === (p.id || p.uid)) || p;
                            const pId = p.id || p.uid || 'no-id';
                            // Prioritize: Live User Data > Snapshot Name > 'Desconocido'
                            let pName = userDetails.name || p.name || 'Desconocido';
                            const pLevel = userDetails.level || p.level || '?';

                            // If name is unknown, show ID to help identify ghost
                            if (pName === 'Desconocido') {
                                pName = `<span style="font-family:monospace; color:#ef4444;">ID: ${pId.substring(0, 8)}...</span>`;
                            }

                            return `
                                <div style="display:flex; justify-content:space-between; align-items:center; background: rgba(255,255,255,0.05); padding: 8px 12px; margin-bottom: 5px; border-radius: 6px;">
                                    <div style="display:flex; align-items:center; gap:10px;">
                                        <div style="width:24px; height:24px; background:var(--primary); color:black; border-radius:50%; font-size:0.7rem; font-weight:700; display:flex; align-items:center; justify-content:center;">
                                            ${pName.toString().charAt(0) === '<' ? '?' : pName.charAt(0)}
                                        </div>
                                        <div>
                                            <div style="font-weight:600; font-size:0.9rem; color:white;" title="ID: ${pId}">${pName}</div>
                                            <div style="font-size:0.7rem; color:#888;">Nivel ${pLevel}</div>
                                        </div>
                                    </div>
                                    <!-- Use index for 1-click removal reliability -->
                                    <button onclick="removePlayerFromAmericana('${americanaId}', ${i})" 
                                            style="background:transparent; border:none; color:var(--danger); cursor:pointer; font-size:1.1rem; opacity:0.8; transition:opacity 0.2s;"
                                            onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.8" title="Eliminar (1-click)">
                                        &times;
                                    </button>
                                </div>
                            `;
                        }).join('');
                    }

                } catch (e) {
                    console.error("Error loading participants:", e);
                    listContainer.innerHTML = `<div style="color:red; text-align:center;">Error al cargar: ${e.message}</div>`;
                }
            }

            window.addPlayerToAmericana = async (americanaId, userId) => {
                if (!userId) return;
                try {
                    const btn = document.getElementById('btn-add-player');
                    btn.disabled = true;
                    btn.textContent = "...";

                    const [americana, user] = await Promise.all([
                        FirebaseDB.americanas.getById(americanaId),
                        FirebaseDB.players.getById(userId)
                    ]);

                    const players = americana.players || americana.registeredPlayers || [];
                    const maxPlayers = (americana.max_courts || 0) * 4;

                    if (players.length >= maxPlayers) {
                        throw new Error("La Americana ya alcanzó el límite de " + maxPlayers + " jugadores.");
                    }

                    // Enforce gender check in backend-style logic
                    if (americana.category === 'male' && user.gender !== 'chico') throw new Error("Solo se permiten hombres en esta categoría.");
                    if (americana.category === 'female' && user.gender !== 'chica') throw new Error("Solo se permiten mujeres en esta categoría.");
                    if ((americana.category === 'mixed' || americana.category === 'open') && (user.gender !== 'chico' && user.gender !== 'chica')) {
                        throw new Error("El jugador debe tener un género válido (chico o chica) para participar.");
                    }

                    // Add new player object
                    players.push({
                        id: user.id,
                        uid: user.id, // Compatibility
                        name: user.name,
                        level: user.level || user.self_rate_level || 'N/A',
                        gender: user.gender || '?',
                        joinedAt: new Date().toISOString(),
                        current_court: Math.floor(players.length / 4) + 1
                    });

                    const now = new Date();
                    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

                    const updateData = {
                        players: players,
                        registeredPlayers: players
                    };

                    // AUTO-OPEN: If it was finished but has spots and is in the future
                    if (players.length < maxPlayers && americana.date >= todayStr && (americana.status === 'finished' || !americana.status)) {
                        updateData.status = 'open';
                    }

                    await FirebaseDB.americanas.update(americanaId, updateData);

                    // Refresh UI
                    await loadParticipantsUI(americanaId);
                    btn.disabled = false;
                    btn.textContent = "AÑADIR";
                    showToast("Jugador añadido con éxito", "success");

                    // Removed: loadAdminView('americanas_mgmt'); 
                    // We stay in the modal to allow more edits.

                } catch (e) {
                    alert("Error añadiendo jugador: " + e.message);
                    document.getElementById('btn-add-player').disabled = false;
                }
            };

            window.removePlayerFromAmericana = async (americanaId, playerIndex) => {
                // NO CONFIRMATION - IMPLIED 1-CLICK ACTION
                try {
                    const americana = await FirebaseDB.americanas.getById(americanaId);
                    let players = americana.players || americana.registeredPlayers || [];

                    // Remove by INDEX to handle 'no-id' or duplicate entries correctly
                    if (playerIndex >= 0 && playerIndex < players.length) {
                        players.splice(playerIndex, 1);
                    } else {
                        throw new Error("Índice de jugador no válido");
                    }

                    const now = new Date();
                    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                    const maxPlayers = (americana.max_courts || 0) * 4;

                    const updateData = {
                        players: players,
                        registeredPlayers: players
                    };

                    // AUTO-OPEN: If it was finished but now has spots and is in the future
                    if (players.length < maxPlayers && americana.date >= todayStr && (americana.status === 'finished' || !americana.status)) {
                        console.log("♻️ Espacio libre detectado en fecha futura. Reabriendo Americana...");
                        updateData.status = 'open';
                    }

                    await FirebaseDB.americanas.update(americanaId, updateData);

                    await loadParticipantsUI(americanaId);
                    showToast("Jugador eliminado con éxito", "success");

                    // Removed: loadAdminView('americanas_mgmt');
                    // This avoids closing the modal or jarring state changes.

                } catch (e) {
                    alert("Error eliminando: " + e.message);
                }
            };

        } else if (view === 'simulator_empty') {
            if (titleEl) titleEl.textContent = 'Generador de Cuadros (Sin Resultados)';
            content.innerHTML = `
                <div class="glass-card-enterprise" style="max-width: 800px; margin: 0 auto; text-align: center; padding: 3rem;">
                    <div style="font-size: 4rem; margin-bottom: 2rem;">📝</div>
                    <h2 style="color: var(--primary); margin-bottom: 1rem;">PREPARAR AMERICANA</h2>
                    <p style="color: var(--text-muted); margin-bottom: 2.5rem;">Esta herramienta selecciona jugadores reales al azar, crea el evento y genera los cruces de las 6 rondas, pero deja los <strong>MARCADORES A 0</strong> y el estado <strong>PENDIENTE</strong>, listo para empezar a jugar.</p>
                    
                    <div style="margin-bottom: 2rem; background: rgba(255,255,255,0.03); padding: 2rem; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05);">
                        <label style="color: var(--primary); font-weight: 800; display: block; margin-bottom: 1rem; letter-spacing: 1px;">⚙️ CONFIGURACIÓN DE ESCENARIO</label>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            <div style="flex: 1;">
                                <label style="font-size: 0.7rem; color: var(--text-muted); display: block; margin-bottom: 5px;">NÚMERO DE PISTAS</label>
                                <select id="sim-courts-empty" class="pro-input" style="width: 100%; text-align: center;">
                                    <option value="2">2 Pistas (8 Jugadores)</option>
                                    <option value="3" selected>3 Pistas (12 Jugadores)</option>
                                    <option value="4">4 Pistas (16 Jugadores)</option>
                                    <option value="5">5 Pistas (20 Jugadores)</option>
                                    <option value="6">6 Pistas (24 Jugadores)</option>
                                    <option value="7">7 Pistas (28 Jugadores)</option>
                                    <option value="8">8 Pistas (32 Jugadores)</option>
                                    <option value="9">9 Pistas (36 Jugadores)</option>
                                    <option value="10">10 Pistas (40 Jugadores)</option>
                                </select>
                            </div>
                            <div style="flex: 1;">
                                <label style="font-size: 0.7rem; color: var(--text-muted); display: block; margin-bottom: 5px;">🎾 CATEGORÍA</label>
                                <select id="sim-category-empty" class="pro-input" style="width: 100%; text-align: center;">
                                    <option value="open">TODOS (Cualquiera)</option>
                                    <option value="male">MASCULINA (Solo chicos)</option>
                                    <option value="female">FEMENINA (Solo chicas)</option>
                                    <option value="mixed">MIXTA (Chico + Chica)</option>
                                </select>
                            </div>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr; margin-top: 15px;">
                            <div style="flex: 1;">
                                <label style="font-size: 0.7rem; color: var(--text-muted); display: block; margin-bottom: 5px;">🎯 MODO DE PAREJAS</label>
                                <select id="sim-pair-mode-empty" class="pro-input" style="width: 100%; text-align: center; font-weight: 700;">
                                    <option value="fixed">🔒 FIJA (Pozo)</option>
                                    <option value="rotating">🔄 TWISTER</option>
                                </select>
                            </div>
                        </div>
                        
                         <!-- PRICES SIMULATOR -->
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
                            <div>
                                <label style="font-size: 0.7rem; color: var(--text-muted); display: block; margin-bottom: 5px;">PRECIO SOCIO (€)</label>
                                <input type="number" id="sim-price-mem-empty" value="12" class="pro-input" style="text-align: center;">
                            </div>
                            <div>
                                <label style="font-size: 0.7rem; color: var(--text-muted); display: block; margin-bottom: 5px;">PRECIO EXTERNO (€)</label>
                                <input type="number" id="sim-price-ext-empty" value="14" class="pro-input" style="text-align: center;">
                            </div>
                        </div>
                    </div>

                    <button class="btn-primary-pro" id="btn-run-simulation-empty" style="padding: 1.5rem 3rem; font-size: 1.1rem;">📝 GENERAR CUADROS Y EMPEZAR</button>
                    <div id="sim-status-empty" style="margin-top: 2rem; font-family: 'Courier New', monospace; font-size: 0.8rem; color: var(--primary); text-align: left; display: none; background: rgba(0,0,0,0.8); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--primary-dim);"></div>
                </div>`;
            document.getElementById('btn-run-simulation-empty').addEventListener('click', () => {
                // Capture explicit prices
                const pMem = document.getElementById('sim-price-mem-empty').value;
                const pExt = document.getElementById('sim-price-ext-empty').value;
                // We pass them as extra config to the simulator
                AdminSimulator.runEmptyCycle({ price_members: pMem, price_external: pExt });
            });

        } else if (view === 'simulator_random') {
            if (titleEl) titleEl.textContent = 'Motor de Simulación (Real Random)';
            content.innerHTML = `
                <div class="glass-card-enterprise" style="max-width: 800px; margin: 0 auto; text-align: center; padding: 3rem;">
                    <div style="font-size: 4rem; margin-bottom: 2rem;">🎲</div>
                    <h2 style="color: var(--primary); margin-bottom: 1rem;">SIMULADOR AL AZAR</h2>
                    <p style="color: var(--text-muted); margin-bottom: 2.5rem;">Crea un evento usando <strong>JUGADORES REALES EXISTENTES</strong> seleccionados aleatoriamente de la base de datos. Se inscribirán, jugarán 6 rondas simuladas y puntuarán.</p>
                    
                    <div style="margin-bottom: 2rem; background: rgba(255,255,255,0.03); padding: 2rem; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05);">
                        <label style="color: var(--primary); font-weight: 800; display: block; margin-bottom: 1rem; letter-spacing: 1px;">⚙️ CONFIGURACIÓN DE ESCENARIO</label>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            <div style="flex: 1;">
                                <label style="font-size: 0.7rem; color: var(--text-muted); display: block; margin-bottom: 5px;">NÚMERO DE PISTAS</label>
                                <select id="sim-courts-random" class="pro-input" style="width: 100%; text-align: center;">
                                    <option value="2">2 Pistas (8 Jugadores)</option>
                                    <option value="3" selected>3 Pistas (12 Jugadores)</option>
                                    <option value="4">4 Pistas (16 Jugadores)</option>
                                    <option value="5">5 Pistas (20 Jugadores)</option>
                                    <option value="6">6 Pistas (24 Jugadores)</option>
                                    <option value="7">7 Pistas (28 Jugadores)</option>
                                    <option value="8">8 Pistas (32 Jugadores)</option>
                                    <option value="9">9 Pistas (36 Jugadores)</option>
                                    <option value="10">10 Pistas (40 Jugadores)</option>
                                </select>
                            </div>
                            <div style="flex: 1;">
                                <label style="font-size: 0.7rem; color: var(--text-muted); display: block; margin-bottom: 5px;">🎾 CATEGORÍA</label>
                                <select id="sim-category-random" class="pro-input" style="width: 100%; text-align: center;">
                                    <option value="open">TODOS (Cualquiera)</option>
                                    <option value="male">MASCULINA (Solo chicos)</option>
                                    <option value="female">FEMENINA (Solo chicas)</option>
                                    <option value="mixed">MIXTA (Chico + Chica)</option>
                                </select>
                            </div>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr; margin-top: 15px;">
                            <div style="flex: 1;">
                                <label style="font-size: 0.7rem; color: var(--text-muted); display: block; margin-bottom: 5px;">🎯 MODO DE PAREJAS</label>
                                <select id="sim-pair-mode-random" class="pro-input" style="width: 100%; text-align: center; font-weight: 700;">
                                    <option value="fixed">🔒 FIJA (Pozo)</option>
                                    <option value="rotating">🔄 TWISTER</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <button class="btn-primary-pro" id="btn-run-simulation-random" style="padding: 1.5rem 3rem; font-size: 1.1rem; border-color: #25D366; color: #25D366;">🎲 LANZAR SIMULACIÓN REAL</button>
                    <div id="sim-status-random" style="margin-top: 2rem; font-family: 'Courier New', monospace; font-size: 0.8rem; color: var(--primary); text-align: left; display: none; background: rgba(0,0,0,0.8); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--primary-dim);"></div>
                </div>`;
            document.getElementById('btn-run-simulation-random').addEventListener('click', () => AdminSimulator.runRandomCycle());

        } else if (view === 'matches') {
            if (titleEl) titleEl.textContent = 'Centro de Resultados - 6 Rondas';

            const americanas = await FirebaseDB.americanas.getAll();
            const activeAmericana = americanas.find(a => a.status === 'in_progress' || a.status === 'open') || americanas[0];

            if (!activeAmericana) {
                content.innerHTML = `<div class="glass-card-enterprise text-center" style="padding: 4rem;"><p>No hay americanas activas.</p></div>`;
                return;
            }

            content.innerHTML = `
                <div class="dashboard-header-pro" style="margin-bottom: 2rem; background: linear-gradient(135deg, #0a0a0a 0%, #000 100%); padding: 2.5rem; border-radius: 24px; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2.5rem; flex-wrap: wrap; gap: 20px;">
                        <div style="display: flex; align-items: center; gap: 1.5rem;">
                            <div style="width: 70px; height: 70px; background: rgba(204,255,0,0.15); border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 2.2rem; border: 1px solid rgba(204,255,0,0.3); box-shadow: 0 0 20px rgba(204,255,0,0.1);">🏆</div>
                            <div>
                                <h1 style="margin:0; color: white; font-size: 2.4rem; font-weight: 950; letter-spacing: -1.5px; line-height: 1;">${activeAmericana.name}</h1>
                                <div style="color: var(--primary); font-weight: 800; font-size: 0.85rem; letter-spacing: 3px; text-transform: uppercase; margin-top: 8px; opacity: 0.9;">MÓDULO DE CONTROL DE RESULTADOS</div>
                            </div>
                        </div>
                        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                            <button class="btn-outline-pro" onclick="resetRoundScores('${activeAmericana.id}', window.currentAdminRound)" style="border-color: #ff4d4d; color: #ff4d4d; font-weight: 800; padding: 0.9rem 1.8rem; border-radius: 12px; font-size: 0.85rem;">🚨 REINICIAR PARTIDO</button>
                            <button class="btn-primary-pro" onclick="simulateRoundScores('${activeAmericana.id}', window.currentAdminRound)" style="background: #25D366; color: black; border-color: #25D366; font-weight: 800; padding: 0.9rem 1.8rem; border-radius: 12px; font-size: 0.85rem;">🎲 SIMULAR PARTIDO</button>
                            <button class="btn-primary-pro" onclick="simulateAllAmericanaMatches('${activeAmericana.id}')" style="background: var(--primary); color: black; border-color: var(--primary); font-weight: 800; padding: 0.9rem 1.8rem; border-radius: 12px; font-size: 0.85rem;">🎮 SIMULAR TORNEO COMPLETO</button>
                        </div>
                    </div>

                    <div id="filter-bar" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; background: rgba(255,255,255,0.03); padding: 1.8rem; border-radius: 20px; border: 1px solid rgba(255,255,255,0.08);">
                        <div style="display: flex; flex-direction: column; gap: 10px; flex: 2;">
                            <label style="color: rgba(255,255,255,0.5); font-size: 0.75rem; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase;">Buscador de Evento:</label>
                            <select id="americana-select" onchange="loadSpecificAmericana(this.value)" class="pro-input" style="width: 100%; height: 60px !important; font-size: 1.1rem !important; font-weight: 800 !important; background: #ffffff !important; color: #000000 !important; border-radius: 14px; border: 3px solid var(--primary-muted) !important; padding: 0 15px !important; cursor: pointer;">
                                ${americanas && americanas.length ? americanas.map(a => `<option value="${a.id}" ${a.id === activeAmericana.id ? 'selected' : ''}>${a.name ? a.name.toUpperCase() : 'SIN NOMBRE'} — ${a.date || 'Sin fecha'}</option>`).join('') : '<option>No hay eventos disponibles</option>'}
                            </select>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 10px; flex: 2;">
                            <label style="color: rgba(255,255,255,0.5); font-size: 0.75rem; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase;">Buscador Rápido Jugador:</label>
                            <input type="text" placeholder="Escribe nombre para destacar..." class="pro-input" style="height: 60px !important; border-radius: 14px; background: #ffffff !important; color: #000000 !important; border: 3px solid var(--primary-muted) !important; padding: 0 15px !important; font-weight: 700 !important; font-size: 1.1rem !important;" onkeyup="highlightPlayer(this.value)">
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 10px; flex: 1; max-width: 150px;">
                            <label style="color: rgba(255,255,255,0.5); font-size: 0.75rem; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase;">Nº Pistas:</label>
                            <div style="display: flex; gap: 5px;">
                                <input type="number" id="quick-max-courts" value="${activeAmericana.max_courts || 0}" min="1" max="20" class="pro-input" style="width: 100%; height: 60px !important; text-align: center; font-size: 1.4rem !important; font-weight: 800 !important; background: #ffffff !important; color: #000000 !important; border-radius: 14px; border: 3px solid var(--primary-muted) !important;">
                                <button class="btn-primary-pro" onclick="updateMaxCourtsQuick('${activeAmericana.id}')" style="height: 60px; min-width: 60px; padding: 0; display: flex; align-items: center; justify-content: center; border-radius: 14px; font-size: 1.5rem;" title="Guardar Pistas">💾</button>
                            </div>
                        </div>
                    </div>

                    <div style="display: flex; gap: 1rem; margin-top: 2rem; overflow-x: auto; padding-bottom: 8px; scrollbar-width: thin;">
                        ${[1, 2, 3, 4, 5, 6].map(r => `<button class="btn-round-tab" id="btn-round-${r}" onclick="renderMatchesForAmericana('${activeAmericana.id}', ${r})" style="flex: 1; min-width: 150px; height: 55px; font-weight: 900; font-size: 0.95rem; border-radius: 14px; cursor: pointer; transition: all 0.3s ease; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); color: #888;">PARTIDO ${r}</button>`).join('')}
                        <button class="btn-round-tab" id="btn-round-summary" onclick="renderAmericanaSummary('${activeAmericana.id}')" style="flex: 1.3; min-width: 180px; height: 55px; font-weight: 900; background: var(--secondary); border: none; border-radius: 14px; color: white; display: flex; align-items: center; justify-content: center; gap: 8px;">📊 INFORME FINAL</button>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 2.5fr 1.2fr; gap: 2.5rem;">
                    <div id="matches-container"><div class="loader"></div></div>
                    
                    <div class="glass-card-enterprise" style="height: fit-content; padding: 2rem; background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.05); border-radius: 20px;">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 1rem;">
                             <h3 style="margin:0; color:white; font-size: 1.1rem; font-weight: 900; letter-spacing: 1px;">📊 CLASIFICACIÓN</h3>
                             <span style="font-size:0.7rem; color: var(--primary); font-weight: 800; background: rgba(204,255,0,0.1); padding: 4px 10px; border-radius: 20px;">EN VIVO</span>
                        </div>
                        <div id="standings-container" style="max-height: 800px; overflow-y: auto; padding-right: 5px;">
                            <!-- Standings inserted here -->
                        </div>
                    </div>
                </div>`;

            window.currentAdminRound = 1;

            window.renderMatchesForAmericana = async (americanaId, roundNum = window.currentAdminRound, sort = false) => {
                window.currentAdminRound = roundNum;
                document.querySelectorAll('.btn-round-tab').forEach(btn => btn.classList.remove('active'));
                document.getElementById(`btn-round-${roundNum}`)?.classList.add('active');

                const container = document.getElementById('matches-container');
                const standingsBox = document.getElementById('standings-container')?.parentElement;
                const filterBar = document.getElementById('filter-bar');

                if (standingsBox) standingsBox.style.display = 'block';
                if (filterBar) filterBar.style.display = 'flex';
                if (container) {
                    container.style.gridColumn = 'auto';
                    container.innerHTML = '<div class="loader"></div>';
                }

                try {
                    const matches = await FirebaseDB.matches.getByAmericana(americanaId);

                    // Fetch Americana to check pair_mode
                    // Fetch Americana to check pair_mode
                    let americana = await FirebaseDB.americanas.getById(americanaId);
                    const isFixedPairs = americana.pair_mode === 'fixed';
                    let fixedPairs = americana.fixed_pairs || [];

                    // --- AUTO-DETECT & SYNC LOOSE PLAYERS (FIX FOR MISSING COURTS) ---
                    // --- AUTO-DETECT & SYNC LOOSE PLAYERS (FIX FOR MISSING COURTS) ---
                    if (isFixedPairs && americana.players && americana.players.length > (fixedPairs.length * 2)) {
                        // ... (Existing Logic for Adding Players) ...
                        console.log("🕵️ Detectados jugadores nuevos sin pareja. Sincronizando...");

                        const allPlayers = americana.players;
                        const pairedIds = new Set();
                        fixedPairs.forEach(p => { pairedIds.add(p.player1_id); pairedIds.add(p.player2_id); });

                        const loosePlayers = allPlayers.filter(p => !pairedIds.has(p.id));

                        if (loosePlayers.length >= 2) {
                            const newPairs = FixedPairsLogic.createFixedPairs(loosePlayers, americana.category);

                            // Asignar pistas al final
                            const maxCurrentCourt = fixedPairs.length > 0 ? Math.max(...fixedPairs.map(p => p.current_court)) : 0;
                            newPairs.forEach((p, i) => {
                                p.current_court = maxCurrentCourt + Math.floor(i / 2) + 1;
                                p.initial_court = p.current_court;
                            });

                            // Merge & Save Pairs
                            const updatedFixedPairs = [...fixedPairs, ...newPairs];
                            await FirebaseDB.americanas.update(americanaId, { fixed_pairs: updatedFixedPairs });

                            // Update Local Vars
                            fixedPairs = updatedFixedPairs;
                            americana.fixed_pairs = fixedPairs;

                            // Check & Update Max Courts
                            const neededCourts = Math.ceil(fixedPairs.length / 2); // 2 pairs per court
                            if (neededCourts > (americana.max_courts || 0)) {
                                await FirebaseDB.americanas.update(americanaId, { max_courts: neededCourts });
                                americana.max_courts = neededCourts;
                            }

                            // --- GENERATE MISSING MATCHES FOR CURRENT ROUND ---
                            const currentRoundMatches = matches.filter(m => m.round === roundNum);
                            const pairedInRoundIds = new Set();
                            currentRoundMatches.forEach(m => {
                                pairedInRoundIds.add(m.pair_a_id);
                                pairedInRoundIds.add(m.pair_b_id);
                            });

                            const pairsNeedingMatch = newPairs.filter(p => !pairedInRoundIds.has(p.id));

                            if (pairsNeedingMatch.length >= 2) {
                                console.log(`🎾 Generando partidos extra para Ronda ${roundNum} con ${pairsNeedingMatch.length} parejas nuevas...`);
                                const extraMatches = [];
                                pairsNeedingMatch.sort((a, b) => a.current_court - b.current_court);

                                for (let i = 0; i < pairsNeedingMatch.length; i += 2) {
                                    if (i + 1 < pairsNeedingMatch.length) {
                                        const pA = pairsNeedingMatch[i];
                                        const pB = pairsNeedingMatch[i + 1];

                                        const matchData = {
                                            americana_id: americanaId,
                                            round: roundNum,
                                            court: pA.current_court,
                                            pair_a_id: pA.id,
                                            pair_b_id: pB.id,
                                            team_a_ids: [pA.player1_id, pA.player2_id],
                                            team_b_ids: [pB.player1_id, pB.player2_id],
                                            team_a_names: pA.pair_name,
                                            team_b_names: pB.pair_name,
                                            status: 'scheduled',
                                            score_a: 0,
                                            score_b: 0
                                        };

                                        const newMatch = await FirebaseDB.matches.create(matchData);
                                        matches.push({ ...matchData, id: newMatch.id });
                                        extraMatches.push(matchData);
                                    }
                                }
                                if (extraMatches.length > 0) AdminAuth.localToast(`Se han añadido ${extraMatches.length} partidos nuevos.`, 'success');
                            }
                        }
                    }
                    // --- AUTO-DETECT REMOVED PLAYERS (CLEANUP) ---
                    else if (isFixedPairs && americana.players && (fixedPairs.length * 2) > americana.players.length) {
                        console.log("🕵️ Detectados jugadores eliminados. Limpiando parejas...");

                        const currentPlayersObj = {};
                        americana.players.forEach(p => currentPlayersObj[p.id] = true);

                        // Filter pairs where both players still exist
                        const validPairs = fixedPairs.filter(p =>
                            currentPlayersObj[p.player1_id] && currentPlayersObj[p.player2_id]
                        );

                        if (validPairs.length < fixedPairs.length) {
                            // 2. Sort by current merit (current_court asc)
                            validPairs.sort((a, b) => a.current_court - b.current_court);

                            // 3. Strict Re-assignment of Courts (1, 1, 2, 2, 3, 3...)
                            validPairs.forEach((p, i) => {
                                p.current_court = Math.floor(i / 2) + 1;
                            });

                            // Update DB with re-ordered pairs
                            await FirebaseDB.americanas.update(americanaId, { fixed_pairs: validPairs });
                            fixedPairs = validPairs;
                            americana.fixed_pairs = fixedPairs;

                            // 4. Update Max Courts
                            const neededCourts = Math.max(1, Math.ceil(validPairs.length / 2));
                            if (neededCourts !== americana.max_courts) {
                                await FirebaseDB.americanas.update(americanaId, { max_courts: neededCourts });
                                americana.max_courts = neededCourts;
                            }

                            // 5. NUKE & REGENERATE SCHEDULED MATCHES
                            // This ensures perfectly ordered courts (1, 2, 3) without gaps.

                            const scheduledMatches = matches.filter(m => m.round === roundNum && m.status === 'scheduled');
                            console.log(`🗑️ Eliminando ${scheduledMatches.length} partidos pendientes para regenerar...`);

                            // Delete from DB
                            await Promise.all(scheduledMatches.map(m => FirebaseDB.matches.delete(m.id)));

                            // Remove from local array
                            const scheduledIds = new Set(scheduledMatches.map(m => m.id));
                            for (let i = matches.length - 1; i >= 0; i--) {
                                if (scheduledIds.has(matches[i].id)) matches.splice(i, 1);
                            }

                            // Generate FRESH matches with new court assignments
                            const newMatchesData = FixedPairsLogic.generatePozoRound(validPairs, roundNum, neededCourts);

                            // Save & Add to local
                            for (const mData of newMatchesData) {
                                mData.americana_id = americanaId; // Ensure ID is linked
                                const saved = await FirebaseDB.matches.create(mData);
                                matches.push({ ...mData, id: saved.id });
                            }

                            AdminAuth.localToast(`♻️ Pistas reorganizadas y partidos regenerados (${neededCourts} pistas).`, 'success');
                        }
                    }

                    // --- STANDINGS CALCULATION (Live) ---
                    let standingsHtml = '';

                    if (isFixedPairs && fixedPairs.length > 0) {
                        // PAREJAS FIJAS - Mostrar con pista y tendencia
                        console.log('🔒 Modo Parejas Fijas detectado');

                        // Actualizar estadísticas de parejas basadas en partidos
                        const pairStats = {};
                        fixedPairs.forEach(pair => {
                            pairStats[pair.id] = {
                                ...pair,
                                games_won: 0,
                                games_lost: 0,
                                wins: 0,
                                losses: 0,
                                played: 0
                            };
                        });

                        matches.forEach(m => {
                            if (m.status === 'finished' && m.pair_a_id && m.pair_b_id) {
                                const pairA = pairStats[m.pair_a_id];
                                const pairB = pairStats[m.pair_b_id];

                                if (pairA && pairB) {
                                    const sA = parseInt(m.score_a || 0);
                                    const sB = parseInt(m.score_b || 0);

                                    pairA.games_won += sA;
                                    pairA.games_lost += sB;
                                    pairB.games_won += sB;
                                    pairB.games_lost += sA;
                                    pairA.played++;
                                    pairB.played++;

                                    if (sA > sB) {
                                        pairA.wins++;
                                        pairB.losses++;
                                    } else if (sB > sA) {
                                        pairB.wins++;
                                        pairA.losses++;
                                    }
                                }
                            }
                        });

                        const ranking = Object.values(pairStats).sort((a, b) =>
                            b.games_won - a.games_won || b.wins - a.wins || a.games_lost - b.games_lost
                        );

                        const maxGames = ranking.length > 0 ? Math.max(...ranking.map(r => r.games_won)) : 1;

                        standingsHtml = ranking.map((r, i) => {
                            const positionColors = {
                                0: { bg: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', icon: '🥇', glow: '0 0 20px rgba(255,215,0,0.4)' },
                                1: { bg: 'linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 100%)', icon: '🥈', glow: '0 0 15px rgba(192,192,192,0.3)' },
                                2: { bg: 'linear-gradient(135deg, #CD7F32 0%, #B8860B 100%)', icon: '🥉', glow: '0 0 15px rgba(205,127,50,0.3)' }
                            };

                            const isPodium = i < 3;
                            const style = positionColors[i] || { bg: 'rgba(255,255,255,0.03)', icon: '', glow: 'none' };
                            const barWidth = maxGames > 0 ? (r.games_won / maxGames) * 100 : 0;

                            // Calcular tendencia
                            const currentCourt = r.current_court || r.initial_court || 1;
                            const initialCourt = r.initial_court || currentCourt;
                            let trend = '=';
                            let trendColor = '#888';
                            let trendText = 'Mantiene';

                            if (currentCourt < initialCourt) {
                                trend = '↑';
                                trendColor = '#25D366';
                                trendText = 'Subiendo';
                            } else if (currentCourt > initialCourt) {
                                trend = '↓';
                                trendColor = '#ef4444';
                                trendText = 'Bajando';
                            }

                            // Color de pista (pista 1 = mejor)
                            const courtColors = ['#FFD700', '#C0C0C0', '#CD7F32', '#4A90E2', '#9B59B6', '#E74C3C', '#95A5A6', '#34495E'];
                            const courtColor = courtColors[currentCourt - 1] || '#666';

                            return `
                            <div style="
                                position: relative;
                                margin-bottom: ${isPodium ? '12px' : '6px'};
                                padding: ${isPodium ? '14px 12px' : '10px 12px'};
                                background: ${isPodium ? style.bg : 'rgba(255,255,255,0.02)'};
                                border-radius: ${isPodium ? '12px' : '8px'};
                                border: ${isPodium ? '2px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.05)'};
                                box-shadow: ${style.glow};
                                transition: all 0.3s ease;
                                overflow: hidden;
                            " onmouseover="this.style.transform='translateX(4px)'; this.style.boxShadow='${style.glow}, 0 4px 12px rgba(0,0,0,0.3)';" onmouseout="this.style.transform='translateX(0)'; this.style.boxShadow='${style.glow}';">
                                <div style="position: absolute; left: 0; top: 0; height: 100%; width: ${barWidth}%; background: ${isPodium ? 'rgba(255,255,255,0.15)' : 'var(--primary-dim)'}; transition: width 0.5s ease; z-index: 0;"></div>
                                <div style="position: relative; z-index: 1; display: flex; align-items: center; justify-content: space-between;">
                                    <div style="display: flex; align-items: center; gap: 10px; flex: 1; overflow: hidden;">
                                        <div style="min-width: ${isPodium ? '36px' : '28px'}; height: ${isPodium ? '36px' : '28px'}; display: flex; align-items: center; justify-content: center; background: ${isPodium ? 'rgba(0,0,0,0.3)' : 'rgba(204,255,0,0.1)'}; border-radius: 50%; font-weight: 900; font-size: ${isPodium ? '1.1rem' : '0.85rem'}; color: ${isPodium ? '#000' : 'var(--primary)'}; border: 2px solid ${isPodium ? 'rgba(0,0,0,0.2)' : 'rgba(204,255,0,0.2)'};">
                                            ${style.icon || `#${i + 1}`}
                                        </div>
                                        <div style="flex: 1; overflow: hidden;">
                                            <div style="display: flex; align-items: center; gap: 8px;">
                                                <div style="font-weight: ${isPodium ? '800' : '600'}; font-size: ${isPodium ? '0.9rem' : '0.8rem'}; color: ${isPodium ? '#000' : '#FFF'}; text-shadow: ${isPodium ? 'none' : '0 1px 2px rgba(0,0,0,0.5)'}; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 2px; line-height: 1.1;" title="${r.pair_name}">${r.pair_name}</div>
                                                <div style="display: flex; align-items: center; gap: 4px; font-size: 0.7rem; background: rgba(0,0,0,0.3); padding: 2px 8px; border-radius: 12px; border: 1px solid ${courtColor};">
                                                    <span style="color: ${courtColor}; font-weight: 800;">🎾 P${currentCourt}</span>
                                                    <span style="color: ${trendColor}; font-size: 0.9rem; font-weight: 900;" title="${trendText}">${trend}</span>
                                                </div>
                                            </div>
                                            <div style="font-size: 0.7rem; color: ${isPodium ? 'rgba(0,0,0,0.6)' : '#888'}; margin-top: 2px;">${r.played} partidos • ${r.wins}V-${r.losses}D</div>
                                        </div>
                                    </div>
                                    <div style="display: flex; gap: 12px; align-items: center;">
                                        <div style="text-align: center; min-width: 50px;">
                                            <div style="font-size: ${isPodium ? '1.4rem' : '1.1rem'}; font-weight: 900; color: ${isPodium ? '#000' : 'var(--primary)'}; line-height: 1;">${r.games_won}</div>
                                            <div style="font-size: 0.65rem; color: ${isPodium ? 'rgba(0,0,0,0.5)' : '#666'}; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Juegos</div>
                                        </div>
                                        <div style="text-align: center; min-width: 45px;">
                                            <div style="font-size: ${isPodium ? '1.2rem' : '0.95rem'}; font-weight: 800; color: ${isPodium ? 'rgba(0,0,0,0.7)' : '#25D366'}; line-height: 1;">${r.wins}</div>
                                            <div style="font-size: 0.65rem; color: ${isPodium ? 'rgba(0,0,0,0.5)' : '#666'}; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Vict.</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            `;
                        }).join('');

                    } else {
                        // PAREJAS ROTATIVAS - Clasificación tradicional
                        console.log('🔄 Modo Parejas Rotativas detectado');

                        const stats = {};
                        matches.forEach(m => {
                            if (m.status === 'finished') {
                                const tA = Array.isArray(m.team_a_names) ? m.team_a_names.join(' / ') : (m.team_a_names || 'Equipo A');
                                const tB = Array.isArray(m.team_b_names) ? m.team_b_names.join(' / ') : (m.team_b_names || 'Equipo B');
                                const sA = parseInt(m.score_a || 0);
                                const sB = parseInt(m.score_b || 0);

                                if (!stats[tA]) stats[tA] = { name: tA, played: 0, won: 0, games: 0 };
                                if (!stats[tB]) stats[tB] = { name: tB, played: 0, won: 0, games: 0 };

                                stats[tA].played++;
                                stats[tB].played++;
                                stats[tA].games += sA;
                                stats[tB].games += sB;

                                if (sA > sB) stats[tA].won++;
                                else if (sB > sA) stats[tB].won++;
                            }
                        });

                        const ranking = Object.values(stats).sort((a, b) => b.games - a.games || b.won - a.won);
                        const maxGames = ranking.length > 0 ? Math.max(...ranking.map(r => r.games)) : 1;

                        standingsHtml = ranking.map((r, i) => {
                            const positionColors = {
                                0: { bg: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', icon: '🥇', glow: '0 0 20px rgba(255,215,0,0.4)' },
                                1: { bg: 'linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 100%)', icon: '🥈', glow: '0 0 15px rgba(192,192,192,0.3)' },
                                2: { bg: 'linear-gradient(135deg, #CD7F32 0%, #B8860B 100%)', icon: '🥉', glow: '0 0 15px rgba(205,127,50,0.3)' }
                            };

                            const isPodium = i < 3;
                            const style = positionColors[i] || { bg: 'rgba(255,255,255,0.03)', icon: '', glow: 'none' };
                            const barWidth = maxGames > 0 ? (r.games / maxGames) * 100 : 0;

                            return `
                            <div style="position: relative; margin-bottom: ${isPodium ? '12px' : '6px'}; padding: ${isPodium ? '14px 12px' : '10px 12px'}; background: ${isPodium ? style.bg : 'rgba(255,255,255,0.02)'}; border-radius: ${isPodium ? '12px' : '8px'}; border: ${isPodium ? '2px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.05)'}; box-shadow: ${style.glow}; transition: all 0.3s ease; overflow: hidden;" onmouseover="this.style.transform='translateX(4px)'; this.style.boxShadow='${style.glow}, 0 4px 12px rgba(0,0,0,0.3)';" onmouseout="this.style.transform='translateX(0)'; this.style.boxShadow='${style.glow}';">
                                <div style="position: absolute; left: 0; top: 0; height: 100%; width: ${barWidth}%; background: ${isPodium ? 'rgba(255,255,255,0.15)' : 'var(--primary-dim)'}; transition: width 0.5s ease; z-index: 0;"></div>
                                <div style="position: relative; z-index: 1; display: flex; align-items: center; justify-content: space-between;">
                                    <div style="display: flex; align-items: center; gap: 10px; flex: 1; overflow: hidden;">
                                        <div style="min-width: ${isPodium ? '36px' : '28px'}; height: ${isPodium ? '36px' : '28px'}; display: flex; align-items: center; justify-content: center; background: ${isPodium ? 'rgba(0,0,0,0.3)' : 'rgba(204,255,0,0.1)'}; border-radius: 50%; font-weight: 900; font-size: ${isPodium ? '1.1rem' : '0.85rem'}; color: ${isPodium ? '#000' : 'var(--primary)'}; border: 2px solid ${isPodium ? 'rgba(0,0,0,0.2)' : 'rgba(204,255,0,0.2)'};">${style.icon || `#${i + 1}`}</div>
                                        <div style="flex: 1; overflow: hidden;">
                                            <div style="font-weight: ${isPodium ? '800' : '600'}; font-size: ${isPodium ? '0.9rem' : '0.8rem'}; color: ${isPodium ? '#000' : '#FFF'}; text-shadow: ${isPodium ? 'none' : '0 1px 2px rgba(0,0,0,0.5)'}; line-height: 1.1;" title="${r.name}">${r.name}</div>
                                            <div style="font-size: 0.7rem; color: ${isPodium ? 'rgba(0,0,0,0.6)' : '#888'}; margin-top: 2px;">${r.played} partidos jugados</div>
                                        </div>
                                    </div>
                                    <div style="display: flex; gap: 12px; align-items: center;">
                                        <div style="text-align: center; min-width: 50px;">
                                            <div style="font-size: ${isPodium ? '1.4rem' : '1.1rem'}; font-weight: 900; color: ${isPodium ? '#000' : 'var(--primary)'}; line-height: 1;">${r.games}</div>
                                            <div style="font-size: 0.65rem; color: ${isPodium ? 'rgba(0,0,0,0.5)' : '#666'}; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Juegos</div>
                                        </div>
                                        <div style="text-align: center; min-width: 45px;">
                                            <div style="font-size: ${isPodium ? '1.2rem' : '0.95rem'}; font-weight: 800; color: ${isPodium ? 'rgba(0,0,0,0.7)' : '#25D366'}; line-height: 1;">${r.won}</div>
                                            <div style="font-size: 0.65rem; color: ${isPodium ? 'rgba(0,0,0,0.5)' : '#666'}; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Vict.</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            `;
                        }).join('');
                    }

                    const stContainer = document.getElementById('standings-container');
                    if (stContainer) {
                        if (standingsHtml) {
                            const modeLabel = isFixedPairs ? '🔒 PAREJAS FIJAS (Sistema Pozo)' : '🔄 PAREJAS ROTATIVAS';
                            const modeDesc = isFixedPairs ?
                                'Parejas permanentes que suben/bajan de pista según resultados' :
                                'Clasificación actualizada en tiempo real basada en juegos ganados y victorias';

                            stContainer.innerHTML = `
                                <div style="margin-bottom: 15px; padding: 12px; background: rgba(204,255,0,0.05); border-radius: 8px; border: 1px solid rgba(204,255,0,0.2);">
                                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                                        <span style="font-size: 1.2rem;">🏆</span>
                                        <span style="font-weight: 800; color: var(--primary); font-size: 0.85rem; letter-spacing: 1px;">RANKING EN VIVO</span>
                                    </div>
                                    <div style="font-size: 0.7rem; color: var(--primary); font-weight: 600; margin-bottom: 4px;">${modeLabel}</div>
                                    <div style="font-size: 0.7rem; color: #888; line-height: 1.4;">${modeDesc}</div>
                                </div>
                                ${standingsHtml}
                            `;
                        } else {
                            stContainer.innerHTML = `
                                <div style="text-align: center; padding: 40px 20px; color: #666;">
                                    <div style="font-size: 3rem; margin-bottom: 10px; opacity: 0.3;">🎾</div>
                                    <div style="font-size: 0.9rem; font-weight: 600;">Sin datos aún</div>
                                    <div style="font-size: 0.75rem; margin-top: 5px;">Completa partidos para ver la clasificación</div>
                                </div>
                            `;
                        }
                    }

                    let roundMatches = matches.filter(m => m.round === roundNum);
                    roundMatches.sort((a, b) => a.court - b.court);

                    if (roundMatches.length === 0) {
                        container.innerHTML = `<div class="glass-card-enterprise" style="text-align: center; padding: 4rem;"><h3>PARTIDO ${roundNum} SIN PARTIDOS</h3><button class="btn-primary-pro" onclick="generateMatches('${americanaId}', ${roundNum})">GENERAR PARTIDO ${roundNum}</button></div>`;
                    } else {
                        container.innerHTML = `<div class="court-grid-pro">${roundMatches.map(m => {
                            // Map status to Spanish labels
                            const statusLabels = {
                                'scheduled': 'PENDIENTE',
                                'live': 'EN JUEGO',
                                'finished': 'FINALIZADO'
                            };
                            const statusLabel = statusLabels[m.status] || 'PENDIENTE';

                            return `
                            <div class="court-card-pro ${m.status}" id="match-${m.id}" data-current-status="${m.status}">
                                <div class="court-header">
                                    <span class="court-label" style="cursor: pointer; border-bottom: 1px dashed rgba(255,255,255,0.3);" onclick="editMatchCourt('${m.id}', ${m.court}, '${americanaId}')" title="Click para cambiar pista">🏆 PISTA ${m.court} ✎</span>
                                    <button class="status-badge ${m.status}" onclick="toggleMatchStatus('${m.id}', '${m.status}', '${americanaId}')" style="border:none; cursor:pointer; padding: 6px 12px; min-width: 90px; text-align:center;" title="Click para avanzar estado">
                                        ${statusLabel}
                                    </button>
                                </div>
                                <div class="match-teams">
                                    <div class="team-row">
                                        <span class="team-names">
                                            ${Array.isArray(m.team_a_names) ?
                                    m.team_a_names.map((n, i) => `<span style="cursor:pointer; border-bottom:1px dotted #888;" onclick="editPlayerInMatch('${m.id}', 'team_a', ${i}, '${americanaId}')" onmouseover="this.style.color='var(--primary)'" onmouseout="this.style.color=''">${n}</span>`).join(' <span style="color:#666">/</span> ')
                                    : (m.team_a_names || 'Equipo A')
                                }
                                        </span>
                                        <div class="score-input-group">
                                            <input type="number" id="scoreA-${m.id}" value="${m.score_a || 0}" class="pro-score-input" min="0" max="99" onkeypress="if(event.key==='Enter') saveMatchData('${m.id}', '${americanaId}')">
                                        </div>
                                    </div>
                                    <div class="team-row">
                                        <span class="team-names">
                                            ${Array.isArray(m.team_b_names) ?
                                    m.team_b_names.map((n, i) => `<span style="cursor:pointer; border-bottom:1px dotted #888;" onclick="editPlayerInMatch('${m.id}', 'team_b', ${i}, '${americanaId}')" onmouseover="this.style.color='var(--primary)'" onmouseout="this.style.color=''">${n}</span>`).join(' <span style="color:#666">/</span> ')
                                    : (m.team_b_names || 'Equipo B')
                                }
                                        </span>
                                        <div class="score-input-group">
                                            <input type="number" id="scoreB-${m.id}" value="${m.score_b || 0}" class="pro-score-input" min="0" max="99" onkeypress="if(event.key==='Enter') saveMatchData('${m.id}', '${americanaId}')">
                                        </div>
                                    </div>
                                </div>
                                <div class="court-footer">
                                    <div style="flex:1; font-size:0.7rem; color:#666; font-style:italic;">
                                        ${m.status === 'live' ? 'En Juego...' : m.status === 'finished' ? 'Finalizado' : 'Pendiente'}
                                    </div>
                                    <button class="save-btn" onclick="saveMatchData('${m.id}', '${americanaId}')" title="Guardar Resultado">💾</button>
                                </div>
                            </div>`;
                        }).join('')}</div>`;
                    }
                } catch (e) { container.innerHTML = `Error: ${e.message}`; }
            };
            renderMatchesForAmericana(activeAmericana.id, 1);

            // New Helper: Edit Player Name
            window.editPlayerInMatch = async (matchId, team, index, americanaId) => {
                event.stopPropagation(); // Avoid triggering card click if any

                const match = await FirebaseDB.matches.getById(matchId);
                const currentName = match[team + '_names'][index];

                const newName = prompt("Editar nombre del jugador:", currentName);
                if (newName && newName !== currentName) {
                    try {
                        // 1. Update Match
                        match[team + '_names'][index] = newName;
                        await FirebaseDB.matches.update(matchId, { [team + '_names']: match[team + '_names'] });

                        // 2. Update Fixed Pair (so it sticks)
                        const americana = await FirebaseDB.americanas.getById(americanaId);
                        if (americana && americana.fixed_pairs) {
                            const pairId = team === 'team_a' ? match.pair_a_id : match.pair_b_id;
                            const pairIndex = americana.fixed_pairs.findIndex(p => p.id === pairId);

                            if (pairIndex !== -1) {
                                const pair = americana.fixed_pairs[pairIndex];
                                if (index === 0) pair.player1_name = newName;
                                else pair.player2_name = newName;

                                pair.pair_name = `${pair.player1_name} / ${pair.player2_name}`;

                                await FirebaseDB.americanas.update(americanaId, { fixed_pairs: americana.fixed_pairs });
                            }
                        }

                        AdminAuth.localToast('Nombre actualizado correctamente', 'success');
                        renderMatchesForAmericana(americanaId, window.currentAdminRound);
                    } catch (e) {
                        console.error(e);
                        alert("Error actualizando nombre");
                    }
                }
            };

            // New Helper Update
            window.editMatchCourt = async (matchId, currentCourt, americanaId) => {
                const newVal = prompt("Introduce el nuevo número de pista:", currentCourt);
                const parsed = parseInt(newVal);
                if (parsed && parsed > 0 && parsed !== currentCourt) {
                    try {
                        await FirebaseDB.matches.update(matchId, { court: parsed });
                        AdminAuth.localToast(`Pista cambiada a ${parsed}`, 'success');
                        window.renderMatchesForAmericana(americanaId, window.currentAdminRound);
                    } catch (e) { console.error(e); }
                }
            };

            window.toggleMatchStatus = async (matchId, currentStatus, americanaId) => {
                const statusCycle = {
                    'scheduled': 'live',
                    'live': 'finished',
                    'finished': 'scheduled' // Allow loop for corrections
                };
                const nextStatus = statusCycle[currentStatus] || 'scheduled';

                try {
                    await FirebaseDB.matches.update(matchId, { status: nextStatus });

                    // If finishing, maybe sync rankings?
                    if (nextStatus === 'finished') await syncRankings(americanaId);

                    // Refresh using the global state variable which is safe
                    const round = window.currentAdminRound || 1;
                    renderMatchesForAmericana(americanaId, round);
                } catch (e) { alert("Error: " + e.message); }
            };

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
    const modal = document.getElementById('admin-user-modal');
    const form = document.getElementById('admin-user-form');
    const title = document.getElementById('modal-title');

    if (title) title.textContent = "Nuevo Jugador";
    if (form) {
        form.reset();
        const idField = form.querySelector('[name=id]');
        const membershipField = form.querySelector('[name=membership]');
        if (idField) idField.value = "";
        if (membershipField) membershipField.value = "externo";
    }

    if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        console.log('✅ Modal de registro abierto');
    } else {
        console.error('❌ Modal no encontrado');
    }
};

window.openEditUserModal = (user) => {
    const modal = document.getElementById('admin-user-modal');
    const form = document.getElementById('admin-user-form');
    const title = document.getElementById('modal-title');

    if (title) title.textContent = "Editar Jugador";
    if (form) {
        const idField = form.querySelector('[name=id]');
        const nameField = form.querySelector('[name=name]');
        const phoneField = form.querySelector('[name=phone]');
        const roleField = form.querySelector('[name=role]');
        const statusField = form.querySelector('[name=status]');
        const levelField = form.querySelector('[name=level]');
        const genderField = form.querySelector('[name=gender]');
        const membershipField = form.querySelector('[name=membership]');
        const matchesField = form.querySelector('[name=matches_played]');
        const passwordField = form.querySelector('[name=password]');

        if (idField) idField.value = user.id || "";
        if (nameField) nameField.value = user.name || "";
        if (phoneField) phoneField.value = user.phone || "";
        if (roleField) roleField.value = user.role || "player";
        if (statusField) statusField.value = user.status || "active";
        if (levelField) levelField.value = user.level || user.self_rate_level || 3.5;
        if (genderField) genderField.value = user.gender || "chico";
        if (membershipField) membershipField.value = user.membership || "externo";
        if (matchesField) matchesField.value = user.matches_played || 0;
        if (passwordField) passwordField.value = user.password || "";
    }

    if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        console.log('✅ Modal de edición abierto para:', user.name);
    } else {
        console.error('❌ Modal no encontrado');
    }
};

window.closeAdminModal = () => {
    const modal = document.getElementById('admin-user-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
    const form = document.getElementById('admin-user-form');
    if (form) form.reset();
};

window.closeAmericanaModal = () => {
    const modal = document.getElementById('admin-americana-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
};

window.deleteUser = async (id) => {
    if (!confirm("⚠️ ¿Estás seguro de ELIMINAR este usuario permanentemente?")) {
        return;
    }
    try {
        await FirebaseDB.players.delete(id);
        console.log('✅ Usuario eliminado:', id);
        loadAdminView('users');
    } catch (e) {
        console.error('❌ Error eliminando usuario:', e);
        alert('Error al eliminar: ' + e.message);
    }
};

// generateMatches is now handled by the Pozo logic at the end of the file

window.updateMatchScore = (matchId, team, delta) => {
    const el = document.getElementById(`score${team.toUpperCase()}-${matchId}`);
    let val = Math.max(0, parseInt(el.textContent) + delta);
    el.textContent = val;
};

window.updateMatchStatus = (matchId, status) => {
    const card = document.getElementById(`match-${matchId}`);
    if (card) card.className = `court-card-pro ${status}`;
};

// Function to refresh ONLY the standings panel (real-time update)
async function refreshStandingsOnly(americanaId) {
    try {
        const matches = await FirebaseDB.matches.getByAmericana(americanaId);

        // Calculate standings
        const stats = {};
        matches.forEach(m => {
            if (m.status === 'finished') {
                const tA = Array.isArray(m.team_a_names) ? m.team_a_names.join(' / ') : (m.team_a_names || 'Equipo A');
                const tB = Array.isArray(m.team_b_names) ? m.team_b_names.join(' / ') : (m.team_b_names || 'Equipo B');
                const sA = parseInt(m.score_a || 0);
                const sB = parseInt(m.score_b || 0);

                if (!stats[tA]) stats[tA] = { name: tA, played: 0, won: 0, games: 0 };
                if (!stats[tB]) stats[tB] = { name: tB, played: 0, won: 0, games: 0 };

                stats[tA].played++;
                stats[tB].played++;
                stats[tA].games += sA;
                stats[tB].games += sB;

                if (sA > sB) stats[tA].won++;
                else if (sB > sA) stats[tB].won++;
            }
        });

        const ranking = Object.values(stats).sort((a, b) => b.games - a.games || b.won - a.won);
        const maxGames = ranking.length > 0 ? Math.max(...ranking.map(r => r.games)) : 1;

        const standingsHtml = ranking.map((r, i) => {
            const positionColors = {
                0: { bg: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', icon: '🥇', glow: '0 0 20px rgba(255,215,0,0.4)' },
                1: { bg: 'linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 100%)', icon: '🥈', glow: '0 0 15px rgba(192,192,192,0.3)' },
                2: { bg: 'linear-gradient(135deg, #CD7F32 0%, #B8860B 100%)', icon: '🥉', glow: '0 0 15px rgba(205,127,50,0.3)' }
            };

            const isPodium = i < 3;
            const style = positionColors[i] || { bg: 'rgba(255,255,255,0.03)', icon: '', glow: 'none' };
            const barWidth = maxGames > 0 ? (r.games / maxGames) * 100 : 0;

            return `
            <div style="
                position: relative;
                margin-bottom: ${isPodium ? '12px' : '6px'};
                padding: ${isPodium ? '14px 12px' : '10px 12px'};
                background: ${isPodium ? style.bg : 'rgba(255,255,255,0.02)'};
                border-radius: ${isPodium ? '12px' : '8px'};
                border: ${isPodium ? '2px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.05)'};
                box-shadow: ${style.glow};
                transition: all 0.3s ease;
                overflow: hidden;
            " onmouseover="this.style.transform='translateX(4px)'; this.style.boxShadow='${style.glow}, 0 4px 12px rgba(0,0,0,0.3)';" onmouseout="this.style.transform='translateX(0)'; this.style.boxShadow='${style.glow}';">
                <div style="position: absolute; left: 0; top: 0; height: 100%; width: ${barWidth}%; background: ${isPodium ? 'rgba(255,255,255,0.15)' : 'var(--primary-dim)'}; transition: width 0.5s ease; z-index: 0;"></div>
                <div style="position: relative; z-index: 1; display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 10px; flex: 1; overflow: hidden;">
                        <div style="min-width: ${isPodium ? '36px' : '28px'}; height: ${isPodium ? '36px' : '28px'}; display: flex; align-items: center; justify-content: center; background: ${isPodium ? 'rgba(0,0,0,0.3)' : 'rgba(204,255,0,0.1)'}; border-radius: 50%; font-weight: 900; font-size: ${isPodium ? '1.1rem' : '0.85rem'}; color: ${isPodium ? '#000' : 'var(--primary)'}; border: 2px solid ${isPodium ? 'rgba(0,0,0,0.2)' : 'rgba(204,255,0,0.2)'};">
                            ${style.icon || `#${i + 1}`}
                        </div>
                        <div style="flex: 1; overflow: hidden;">
                            <div style="font-weight: ${isPodium ? '800' : '600'}; font-size: ${isPodium ? '0.9rem' : '0.8rem'}; color: ${isPodium ? '#000' : '#FFF'}; text-shadow: ${isPodium ? 'none' : '0 1px 2px rgba(0,0,0,0.5)'};" title="${r.name}">${r.name}</div>
                            <div style="font-size: 0.7rem; color: ${isPodium ? 'rgba(0,0,0,0.6)' : '#888'}; margin-top: 2px;">${r.played} partidos jugados</div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 12px; align-items: center;">
                        <div style="text-align: center; min-width: 50px;">
                            <div style="font-size: ${isPodium ? '1.4rem' : '1.1rem'}; font-weight: 900; color: ${isPodium ? '#000' : 'var(--primary)'}; line-height: 1;">${r.games}</div>
                            <div style="font-size: 0.65rem; color: ${isPodium ? 'rgba(0,0,0,0.5)' : '#666'}; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Juegos</div>
                        </div>
                        <div style="text-align: center; min-width: 45px;">
                            <div style="font-size: ${isPodium ? '1.2rem' : '0.95rem'}; font-weight: 800; color: ${isPodium ? 'rgba(0,0,0,0.7)' : '#25D366'}; line-height: 1;">${r.won}</div>
                            <div style="font-size: 0.65rem; color: ${isPodium ? 'rgba(0,0,0,0.5)' : '#666'}; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Vict.</div>
                        </div>
                    </div>
                </div>
            </div>
            `;
        }).join('');

        const stContainer = document.getElementById('standings-container');
        if (stContainer) {
            if (standingsHtml) {
                stContainer.innerHTML = `
                    <div style="margin-bottom: 15px; padding: 12px; background: rgba(204,255,0,0.05); border-radius: 8px; border: 1px solid rgba(204,255,0,0.2);">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                            <span style="font-size: 1.2rem;">🏆</span>
                            <span style="font-weight: 800; color: var(--primary); font-size: 0.85rem; letter-spacing: 1px;">RANKING EN VIVO</span>
                        </div>
                        <div style="font-size: 0.7rem; color: #888; line-height: 1.4;">
                            Clasificación actualizada en tiempo real basada en juegos ganados y victorias
                        </div>
                    </div>
                    ${standingsHtml}
                `;
            }
        }
    } catch (e) {
        console.error('Error refreshing standings:', e);
    }
}


window.saveMatchData = async (matchId, americanaId) => {
    try {
        const scoreA = parseInt(document.getElementById(`scoreA-${matchId}`).value) || 0;
        const scoreB = parseInt(document.getElementById(`scoreB-${matchId}`).value) || 0;

        // Update scores in database
        await FirebaseDB.matches.update(matchId, { score_a: scoreA, score_b: scoreB });

        // Visual Feedback
        const saveBtn = document.querySelector(`#match-${matchId} .save-btn`);
        if (saveBtn) {
            const original = saveBtn.innerHTML;
            saveBtn.innerHTML = "✅";
            setTimeout(() => saveBtn.innerHTML = original, 1000);
        }

        // ALWAYS refresh standings in real-time (not just when finished)
        // This ensures the ranking updates immediately when you change scores
        await refreshStandingsOnly(americanaId);

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

// ... (syncRankings implementation)

window.openWhatsAppActions = (phone, name) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const firstName = name.split(' ')[0];

    // Create a simple modal for selection
    const modalHtml = `
        <div id="wa-modal-overlay" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:9999; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(5px);">
            <div style="background:#1a1a1a; padding:2rem; border-radius:16px; width:90%; max-width:400px; border:1px solid #333; box-shadow:0 10px 40px rgba(0,0,0,0.5);">
                <div style="text-align:center; margin-bottom:1.5rem;">
                    <span style="font-size:3rem;">💬</span>
                    <h3 style="color:#25D366; margin:0.5rem 0;">Contactar con ${firstName}</h3>
                    <p style="color:#888; font-size:0.9rem;">Selecciona una plantilla de mensaje rápido:</p>
                </div>
                
                <div style="display:grid; gap:10px;">
                    <button class="wa-action-btn" onclick="sendWA('${cleanPhone}', '')" style="background:#333; border:1px solid #444; color:white; padding:12px; border-radius:8px; cursor:pointer; text-align:left; display:flex; align-items:center; gap:10px; transition:0.2s;">
                        <span>👋</span> Chat Directo (Vacío)
                    </button>
                    <button class="wa-action-btn" onclick="sendWA('${cleanPhone}', 'Hola ${firstName}! Bienvenido a la app de americanas de Somospadel BCN 🎾🙌')" style="background:#333; border:1px solid #444; color:white; padding:12px; border-radius:8px; cursor:pointer; text-align:left; display:flex; align-items:center; gap:10px; transition:0.2s;">
                        <span>🎉</span> Bienvenida
                    </button>
                    <button class="wa-action-btn" onclick="sendWA('${cleanPhone}', 'Hola ${firstName}, te escribo para reconfirmar tu asistencia a la americana. ¿Todo ok?')" style="background:#333; border:1px solid #444; color:white; padding:12px; border-radius:8px; cursor:pointer; text-align:left; display:flex; align-items:center; gap:10px; transition:0.2s;">
                        <span>📅</span> Confirmar Asistencia
                    </button>
                    <button class="wa-action-btn" onclick="sendWA('${cleanPhone}', 'Hola ${firstName}, recuerda pasar por recepción del club para abonar la americana. ¡Gracias!')" style="background:#333; border:1px solid #444; color:white; padding:12px; border-radius:8px; cursor:pointer; text-align:left; display:flex; align-items:center; gap:10px; transition:0.2s;">
                        <span>💸</span> Recordatorio Pago
                    </button>
                    <button class="wa-action-btn" onclick="sendWA('${cleanPhone}', 'Hola ${firstName}! Te informo que el partido se ha cancelado por lluvia 🌧️. Te avisaremos para la nueva fecha.')" style="background:#333; border:1px solid #444; color:white; padding:12px; border-radius:8px; cursor:pointer; text-align:left; display:flex; align-items:center; gap:10px; transition:0.2s;">
                        <span>🌧️</span> Cancelación Lluvia
                    </button>
                </div>

                <button onclick="document.getElementById('wa-modal-overlay').remove()" style="width:100%; margin-top:20px; padding:10px; background:transparent; border:none; color:#666; cursor:pointer; text-decoration:underline;">Cancelar</button>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // CSS for hover effect
    const style = document.createElement('style');
    style.innerHTML = `.wa-action-btn:hover { background: #25D366 !important; color: black !important; border-color: #25D366 !important; transform: translateX(5px); }`;
    document.head.appendChild(style);

    window.sendWA = (ph, text) => {
        const url = `https://wa.me/${ph}?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
        document.getElementById('wa-modal-overlay').remove();
    };
};


// --- POZO LOGIC GENERATOR ---
window.generateNextRound = async (americanaId, nextRound) => {
    // 1. Get Americana and matches
    const [americana, matches] = await Promise.all([
        FirebaseDB.americanas.getById(americanaId),
        FirebaseDB.matches.getByAmericana(americanaId)
    ]);

    const isFixedPairs = americana.pair_mode === 'fixed';
    const prevRoundMatches = matches.filter(m => m.round === nextRound - 1);

    if (prevRoundMatches.length === 0) {
        alert("Error CRÍTICO: No existe la ronda anterior (" + (nextRound - 1) + "). No se puede calcular el ascenso/descenso.");
        return;
    }

    // Validate all finished
    const unfinished = prevRoundMatches.filter(m => m.status !== 'finished');
    if (unfinished.length > 0) {
        alert(`❌ ¡ATENCIÓN! Hay ${unfinished.length} partidos de la ronda anterior sin finalizar. \nMárcalos como FINALIZADO antes de generar la siguiente.`);
        return;
    }

    if (confirm(`🏆 GENERAR PARTIDO ${nextRound} (${isFixedPairs ? 'SISTEMA POZO' : 'EQUIPOS ROTATIVOS'})\n\n¿Proceder?`)) {
        const container = document.getElementById('matches-container');
        if (container) container.innerHTML = '<div class="loader"></div>';

        try {
            // --- SMART COURTS: AUTO-SCALING ---
            // Si hay más jugadores/parejas de los que caben en las pistas configuradas, ampliar automáticamente.
            let effectiveCourts = americana.max_courts || 4;
            let courtsUpdated = false;

            if (isFixedPairs) {
                const pairsCount = (americana.fixed_pairs || []).length;
                const needed = Math.floor(pairsCount / 2);
                if (needed > effectiveCourts) {
                    effectiveCourts = needed;
                    courtsUpdated = true;
                }
            } else {
                const playersCount = (americana.players || []).length;
                const needed = Math.floor(playersCount / 4);
                if (needed > effectiveCourts) {
                    effectiveCourts = needed;
                    courtsUpdated = true;
                }
            }

            if (courtsUpdated) {
                console.log(`🤖 AI: Ampliando capacidad a ${effectiveCourts} pistas.`);
                await FirebaseDB.americanas.update(americanaId, { max_courts: effectiveCourts });
                americana.max_courts = effectiveCourts; // Update local reference
                AdminAuth.localToast(`🤖 IA: Torneo ampliado a ${effectiveCourts} pistas automáticamente.`, 'success');
            }
            // -----------------------------------

            if (isFixedPairs) {
                // LÓGICA POZO (PAREJAS FIJAS)
                // 0. AUTO-PAIR SYNC: Si hay jugadores sueltos (nuevos) que no están en parejas, emparejarlos.
                let pairs = americana.fixed_pairs || [];
                const allPlayers = americana.players || [];

                // IDs de jugadores ya en parejas
                const pairedPlayerIds = new Set();
                pairs.forEach(p => {
                    pairedPlayerIds.add(p.player1_id);
                    pairedPlayerIds.add(p.player2_id);
                });

                // Encontrar jugadores sin pareja
                const loosePlayers = allPlayers.filter(p => !pairedPlayerIds.has(p.id));

                if (loosePlayers.length >= 2) {
                    console.log(`🔒 Auto-Emparejando ${loosePlayers.length} jugadores nuevos...`);
                    // Crear parejas para los nuevos
                    const newPairs = FixedPairsLogic.createFixedPairs(loosePlayers, americana.category);

                    // Asignarles pista inicial alta (final de la cola)
                    const maxCurrentCourt = pairs.length > 0 ? Math.max(...pairs.map(p => p.current_court)) : 0;
                    newPairs.forEach((p, i) => {
                        p.current_court = maxCurrentCourt + Math.floor(i / 2) + 1;
                    });

                    pairs = [...pairs, ...newPairs];
                    // Guardar actualización de parejas inmediatamente
                    await FirebaseDB.americanas.update(americanaId, { fixed_pairs: pairs });
                    americana.fixed_pairs = pairs; // Update local ref

                    // Recalcular pistas totales necesarias tras añadir parejas
                    const needed = Math.floor(pairs.length / 2);
                    if (needed > (americana.max_courts || 0)) {
                        effectiveCourts = needed;
                        await FirebaseDB.americanas.update(americanaId, { max_courts: effectiveCourts });
                        americana.max_courts = effectiveCourts;
                    }
                }

                if (pairs.length === 0) throw new Error("No hay parejas fijas configuradas para esta Americana.");

                // Actualizar rankings basados en la ronda anterior
                const updatedPairs = FixedPairsLogic.updatePozoRankings(pairs, prevRoundMatches, americana.max_courts || 4);

                // Guardar parejas actualizadas
                await FirebaseDB.americanas.update(americanaId, { fixed_pairs: updatedPairs });

                // Generar nuevos partidos
                const newMatches = FixedPairsLogic.generatePozoRound(updatedPairs, nextRound, americana.max_courts || 4);

                for (const m of newMatches) {
                    await FirebaseDB.matches.create({
                        ...m,
                        americana_id: americanaId,
                        status: 'scheduled',
                        score_a: 0,
                        score_b: 0
                    });
                }
            } else {
                // LÓGICA ROTATIVA (AMERICANA INDIVIDUAL / POZO INDIVIDUAL)
                // 1. Obtener jugadores registrados de esta Americana
                const currentPlayerData = americana.players || [];

                // 2. Aplicar lógica Pozo para mover jugadores de pista según resultados previos
                const movedPlayers = RotatingPozoLogic.updatePlayerCourts(currentPlayerData, prevRoundMatches, americana.max_courts || 4);

                // 3. Guardar las nuevas posiciones en la Americana
                await FirebaseDB.americanas.update(americanaId, { players: movedPlayers });

                // 4. Generar la siguiente ronda con rotación de parejas
                const newMatches = RotatingPozoLogic.generateRound(movedPlayers, nextRound, americana.max_courts || 4);

                for (const m of newMatches) {
                    await FirebaseDB.matches.create({
                        ...m,
                        americana_id: americanaId,
                        status: 'scheduled',
                        score_a: 0,
                        score_b: 0
                    });
                }
            }

            setTimeout(() => {
                if (window.renderMatchesForAmericana) window.renderMatchesForAmericana(americanaId, nextRound);
            }, 500);

        } catch (e) {
            console.error(e);
            alert("Error: " + e.message);
        }
    }
};

// --- NEW CONTROL HELPERS (Requested by USER) ---

window.updateMaxCourtsQuick = async (id) => {
    const el = document.getElementById('quick-max-courts');
    if (!el) return;

    const val = parseInt(el.value);
    if (val > 0) {
        try {
            await FirebaseDB.americanas.update(id, { max_courts: val });
            AdminAuth.localToast(`✅ Pistas actualizadas a ${val}.`, 'success');
            // Recargar vista para refrescar todo
            loadSpecificAmericana(id);
        } catch (e) {
            console.error(e);
            AdminAuth.localToast('Error actualizando pistas', 'error');
        }
    } else {
        AdminAuth.localToast('El número de pistas debe ser mayor a 0', 'warning');
    }
};

window.loadSpecificAmericana = async (id) => {
    if (!id) return;
    try {
        const newAmericana = await FirebaseDB.americanas.getById(id);
        if (newAmericana) {
            // Update global/state if needed, though loadAdminView usually handles it if we pass the ID
            // Since loadAdminView might rely on closure variables, better to reload the 'matches' view with this specific ID if possible,
            // OR update the closure variable if we can access it.
            // Assuming loadAdminView is adaptable or we can reset state.

            // Let's try to reload the full 'matches' view context
            // We can hack this by calling the render path directly if loadAdminView doesn't support params nicely

            // Actually, best way:
            window.activeAmericanaId = id; // Store globally if widely used
            // Force reload of that specific section

            // If loadAdminView('matches') uses the dropdown value, it might just work if we update the selection.
            // But we want to FORCE it.

            // Let's reuse the logic inside loadAdminView for 'matches'
            window.currentAdminRound = 1;

            // Re-render the whole view with the new object
            // To do this properly without duplicating code, we ensure loadAdminView('matches') picks up this new ID.
            // It seems loadAdminView('matches') gets the ID from the clicked button usually.

            // We will basically overwrite the "activeAmericana" in the scope? No, can't.
            // We will call renderMatchesForAmericana directly updates the GRID, making it look like it switched.
            // AND update the header info manually?

            // ALTERNATIVE: Simulating a full refresh of the matches section using internal logic:

            // 1. Update the dropdown to match just in case
            const select = document.getElementById('americana-select');
            if (select) select.value = id;

            // 2. Render Matches
            renderMatchesForAmericana(id, 1);

            // 3. Update Title/Header (if any specific header exists outside grid)
            // (The header might be static or part of the view we can't easily reach without a full reload)

            // 4. Update URL or STATE if we were using a router (we aren't really).

            // BIG FIX: Call loadAdminView('matches', id) if we modify loadAdminView to accept ID.
            // But since I can't see loadAdminView definition fully, I'll rely on global state.

            // Let's try calling renderMatchesForAmericana, AND update the simulator buttons or other context reliant on ID.

            // Actually, looking at the code, `activeAmericana` is defined inside `loadAdminView`.
            // We need to re-execute `loadAdminView` with the new ID.
            // BUT `loadAdminView` is triggered by a click usually.

            // Let's modify `loadAdminView` to accept an optional `forcedId`.
            // Wait, I can't modify `loadAdminView` easily without seeing it all.

            // PROPOSAL: Simply update the grid. The user wants to SEE the content.
            // The dropdown ALREADY calls this function.
            // `loadSpecificAmericana` was added by me.

            window.currentAdminRound = 1;
            await window.renderMatchesForAmericana(id, 1);

            // Also need to update the "Simulate" buttons which use `${activeAmericana.id}` in their onclick!
            // This is tricky. The HTML was generated with the OLD ID hardcoded.
            // We MUST regenerate the control panel HTML.

            // Solution: Re-render the "Results Center" HTML block completely.
            // Since we can't easily call the internal render logic of loadAdminView, I'll try to update the buttons attributes.

            document.querySelectorAll('button[onclick*="simulateRoundScores"]').forEach(b => {
                b.setAttribute('onclick', `simulateRoundScores('${id}', window.currentAdminRound)`);
            });
            document.querySelectorAll('button[onclick*="simulateAllAmericanaMatches"]').forEach(b => {
                b.setAttribute('onclick', `simulateAllAmericanaMatches('${id}')`);
            });
            document.querySelectorAll('button[onclick*="resetRoundScores"]').forEach(b => {
                b.setAttribute('onclick', `resetRoundScores('${id}', window.currentAdminRound)`);
            });
            document.querySelectorAll('button.btn-round-tab').forEach((b, idx) => {
                // idx 0 is round 1
                if (b.id !== 'btn-round-summary') {
                    const r = parseInt(b.innerText.replace('PARTIDO ', ''));
                    b.setAttribute('onclick', `renderMatchesForAmericana('${id}', ${r})`);
                }
            });
            document.getElementById('btn-round-summary')?.setAttribute('onclick', `renderAmericanaSummary('${id}')`);

        }
    } catch (e) { console.error(e); }
};

window.highlightPlayer = (name) => {
    const query = name.toLowerCase();
    document.querySelectorAll('.court-card-pro').forEach(card => {
        const hasMatch = card.innerText.toLowerCase().includes(query);
        card.style.opacity = query && !hasMatch ? '0.2' : '1';
        card.style.transform = query && hasMatch ? 'scale(1.05)' : 'scale(1)';
        card.style.boxShadow = query && hasMatch ? '0 0 30px var(--primary-glow)' : '';
        card.style.zIndex = query && hasMatch ? '10' : '1';
    });
};

window.resetRoundScores = async (americanaId, roundNum) => {
    if (!confirm(`¿Estás SEGURO de querer poner todos los marcadores del PARTIDO ${roundNum} a 0? Esta acción no se puede deshacer.`)) return;
    try {
        const matches = await FirebaseDB.matches.getByAmericana(americanaId);
        const roundMatches = matches.filter(m => m.round === roundNum);

        for (const m of roundMatches) {
            await FirebaseDB.matches.update(m.id, {
                score_a: 0,
                score_b: 0,
                status: 'scheduled'
            });
        }
        showToast(`Partido ${roundNum} reiniciado correctamente`, 'success');
        renderMatchesForAmericana(americanaId, roundNum);
    } catch (e) { alert(e.message); }
};

window.simulateRoundScores = async (americanaId, roundNum) => {
    if (!confirm(`¿Quieres simular resultados aleatorios para el PARTIDO ${roundNum}?`)) return;
    try {
        const matches = await FirebaseDB.matches.getByAmericana(americanaId);
        const roundMatches = matches.filter(m => m.round === roundNum);

        for (const m of roundMatches) {
            const sA = Math.floor(Math.random() * 5) + 2; // 2 to 6
            const sB = sA === 6 ? Math.floor(Math.random() * 6) : (Math.random() > 0.5 ? sA + 1 : sA - 1);

            await FirebaseDB.matches.update(m.id, {
                score_a: Math.max(sA, sB),
                score_b: Math.min(sA, sB),
                status: 'finished'
            });
        }

        // Sync rankings if anything finished
        await syncRankings(americanaId);

        showToast(`Simulación de Partido ${roundNum} completada`, 'success');
        renderMatchesForAmericana(americanaId, roundNum);
    } catch (e) { alert(e.message); }
};

window.simulateAllAmericanaMatches = async (americanaId) => {
    if (!confirm("⚠️ SIMULACIÓN TOTAL: ¿Quieres simular automáticamente TODAS las rondas del torneo?")) return;

    try {
        const americana = await FirebaseDB.americanas.getById(americanaId);

        for (let r = 1; r <= 6; r++) {
            console.log(`🤖 Simulando Ronda ${r}...`);
            let matches = await FirebaseDB.matches.getByAmericana(americanaId);
            let roundMatches = matches.filter(m => m.round === r);

            // Si la ronda no existe, intentamos generarla (excepto si es R1 y no hay nada)
            if (roundMatches.length === 0) {
                if (r > 1) {
                    const prevRoundMatches = matches.filter(m => m.round === r - 1);
                    if (prevRoundMatches.length > 0) {
                        // Verificamos que la anterior esté terminada
                        const unfinished = prevRoundMatches.filter(m => m.status !== 'finished');
                        if (unfinished.length === 0) {
                            // Generar siguiente ronda programáticamente
                            const isFixedPairs = americana.pair_mode === 'fixed';

                            // --- AUTO-SCALE FOR SIMULATION ---
                            let effectiveCourts = americana.max_courts || 4;
                            if (isFixedPairs) {
                                const needed = Math.floor((americana.fixed_pairs || []).length / 2);
                                if (needed > effectiveCourts) { effectiveCourts = needed; americana.max_courts = needed; await FirebaseDB.americanas.update(americanaId, { max_courts: needed }); }
                            } else {
                                const needed = Math.floor((americana.players || []).length / 4);
                                if (needed > effectiveCourts) { effectiveCourts = needed; americana.max_courts = needed; await FirebaseDB.americanas.update(americanaId, { max_courts: needed }); }
                            }
                            // ---------------------------------

                            if (isFixedPairs) {
                                const updatedPairs = FixedPairsLogic.updatePozoRankings(americana.fixed_pairs || [], prevRoundMatches, effectiveCourts);
                                await FirebaseDB.americanas.update(americanaId, { fixed_pairs: updatedPairs });
                                const newMatches = FixedPairsLogic.generatePozoRound(updatedPairs, r, effectiveCourts);
                                for (const m of newMatches) {
                                    await FirebaseDB.matches.create({ ...m, americana_id: americanaId, status: 'scheduled', score_a: 0, score_b: 0 });
                                }
                            } else {
                                const movedPlayers = RotatingPozoLogic.updatePlayerCourts(americana.players || [], prevRoundMatches, effectiveCourts);
                                await FirebaseDB.americanas.update(americanaId, { players: movedPlayers });
                                const newMatches = RotatingPozoLogic.generateRound(movedPlayers, r, effectiveCourts);
                                for (const m of newMatches) {
                                    await FirebaseDB.matches.create({ ...m, americana_id: americanaId, status: 'scheduled', score_a: 0, score_b: 0 });
                                }
                            }
                            // Recargar matches
                            matches = await FirebaseDB.matches.getByAmericana(americanaId);
                            roundMatches = matches.filter(m => m.round === r);
                        }
                    }
                }
            }

            // Simular scores para esta ronda
            if (roundMatches.length > 0) {
                for (const m of roundMatches) {
                    if (m.status !== 'finished') {
                        const sA = Math.floor(Math.random() * 5) + 2;
                        const sB = sA === 6 ? Math.floor(Math.random() * 6) : (Math.random() > 0.5 ? sA + 1 : sA - 1);
                        await FirebaseDB.matches.update(m.id, {
                            score_a: Math.max(sA, sB),
                            score_b: Math.min(sA, sB),
                            status: 'finished'
                        });
                    }
                }
                // Sincronizar rankings tras cada ronda
                await syncRankings(americanaId);
            }
        }

        showToast("🚀 Torneo completo simulado con éxito", "success");
        renderMatchesForAmericana(americanaId, 6); // Ir a la última ronda
    } catch (e) {
        console.error(e);
        alert("Error en simulación total: " + e.message);
    }
};

// Map old function name to new one for compatibility with existing buttons
window.generateMatches = window.generateNextRound;

document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 Admin DOM Ready - Initializing...");

    // Global Toast Redirection for Admin Panel Compatibility
    window.showToast = (msg, type) => AdminAuth.localToast(msg, type);

    // --- MOBILE MENU LOGIC (New) ---
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    const sidebar = document.querySelector('.sidebar-pro');

    if (mobileToggle && sidebar) {
        mobileToggle.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent immediate close
            sidebar.classList.toggle('active');
        });

        // Close sidebar when clicking any nav item
        document.querySelectorAll('.nav-item-pro').forEach(item => {
            item.addEventListener('click', () => {
                if (window.innerWidth <= 768) sidebar.classList.remove('active');
            });
        });

        // Close sidebar when clicking outside
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 &&
                sidebar.classList.contains('active') &&
                !sidebar.contains(e.target) &&
                e.target !== mobileToggle) {
                sidebar.classList.remove('active');
            }
        });
    }

    // Login Form Listener
    document.getElementById('admin-login-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        console.log("📞 Admin Login Clicked");
        AdminAuth.login(fd.get('phone'), fd.get('password'));
    });

    // User Edit Form Listener
    document.getElementById('admin-user-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const id = fd.get('id');
        const data = {
            name: fd.get('name'),
            phone: fd.get('phone'),
            role: fd.get('role'),
            status: fd.get('status'),
            level: parseFloat(fd.get('level')),
            gender: fd.get('gender') || 'chico',
            membership: fd.get('membership') || 'externo',
            matches_played: parseInt(fd.get('matches_played')) || 0,
            password: fd.get('password') || undefined
        };

        if (!data.password) delete data.password;

        try {
            if (id) {
                await FirebaseDB.players.update(id, data);
            } else {
                await FirebaseDB.players.create(data);
            }
            closeAdminModal();
            loadAdminView('users');
        } catch (err) {
            alert(err.message);
        }
    });

    // Americana Edit Form Listener
    document.getElementById('edit-americana-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const id = fd.get('id');
        if (!id) return;
        const data = {
            name: fd.get('name'),
            date: fd.get('date'),
            time: fd.get('time'),
            category: fd.get('category'),
            max_courts: parseInt(fd.get('max_courts')) || 4,
            duration: fd.get('duration') || '2h',
            status: fd.get('status') || 'open',
            price_members: parseInt(fd.get('price_members')) || 12,
            price_external: parseInt(fd.get('price_external')) || 14,
            image_url: fd.get('image_url') || 'img/americana-pro.png'
        };
        try {
            await FirebaseDB.americanas.update(id, data);
            closeAmericanaModal();
            loadAdminView('americanas_mgmt');
        } catch (err) {
            alert(err.message);
        }
    });

    // Initialize Auth
    AdminAuth.init();
});

// --- AMERICANA ANALYTICS & EXCEL EXPORT ---

window.renderAmericanaSummary = async (americanaId) => {
    document.querySelectorAll('.btn-round-tab').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-round-summary`)?.classList.add('active');

    const container = document.getElementById('matches-container');
    const standingsBox = document.getElementById('standings-container').parentElement;
    const filterBar = document.getElementById('filter-bar');

    if (standingsBox) standingsBox.style.display = 'none';
    if (filterBar) filterBar.style.display = 'none';
    if (container) {
        container.style.gridColumn = 'span 2';
        container.innerHTML = '<div class="loader"></div>';
    }

    try {
        const [americana, matches] = await Promise.all([
            FirebaseDB.americanas.getById(americanaId),
            FirebaseDB.matches.getByAmericana(americanaId)
        ]);

        const finishedMatches = matches.filter(m => m.status === 'finished');
        if (finishedMatches.length === 0) {
            container.innerHTML = `
                <div class="glass-card-enterprise text-center" style="padding: 5rem;">
                    <div style="font-size: 4rem; opacity: 0.3; margin-bottom: 2rem;">📊</div>
                    <h2 style="color: var(--primary);">DATOS INSUFICIENTES</h2>
                    <p style="color: var(--text-muted);">Finaliza al menos un partido para ver el resumen ejecutivo.</p>
                </div>`;
            return;
        }

        // --- Stats Calculation ---
        const players = {};
        const roundStats = {}; // Total games per round
        let totalGames = 0;
        let highIntensityMatches = 0; // Score diff <= 1

        finishedMatches.forEach(m => {
            const namesA = Array.isArray(m.team_a_names) ? m.team_a_names : [m.team_a_names];
            const namesB = Array.isArray(m.team_b_names) ? m.team_b_names : [m.team_b_names];
            const sA = parseInt(m.score_a || 0);
            const sB = parseInt(m.score_b || 0);

            totalGames += (sA + sB);
            if (Math.abs(sA - sB) <= 1) highIntensityMatches++;

            if (!roundStats[m.round]) roundStats[m.round] = 0;
            roundStats[m.round] += (sA + sB);

            [...namesA, ...namesB].forEach(name => {
                if (!players[name]) players[name] = { name, games: 0, wins: 0, matches: 0, losses: 0, pointsScored: 0, pointsAgainst: 0 };
            });

            namesA.forEach(n => {
                players[n].games += sA; players[n].matches++;
                players[n].pointsScored += sA; players[n].pointsAgainst += sB;
                if (sA > sB) players[n].wins++; else players[n].losses++;
            });
            namesB.forEach(n => {
                players[n].games += sB; players[n].matches++;
                players[n].pointsScored += sB; players[n].pointsAgainst += sA;
                if (sB > sA) players[n].wins++; else players[n].losses++;
            });
        });

        const sortedPlayers = Object.values(players).sort((a, b) => b.games - a.games || b.wins - a.wins);
        const mvp = sortedPlayers[0];
        const top5 = sortedPlayers.slice(0, 5);
        const intensityPercent = Math.round((highIntensityMatches / finishedMatches.length) * 100);

        // --- Calculate Advanced Highlights ---
        const courtGames = {};
        let bestBlowout = { diff: 0, match: null };
        finishedMatches.forEach(m => {
            const diff = Math.abs(parseInt(m.score_a) - parseInt(m.score_b));
            if (!courtGames[m.court]) courtGames[m.court] = 0;
            courtGames[m.court] += (parseInt(m.score_a) + parseInt(m.score_b));
            if (diff > bestBlowout.diff) bestBlowout = { diff, match: m };
        });
        const busiestCourt = Object.keys(courtGames).reduce((a, b) => courtGames[a] > courtGames[b] ? a : b);
        const qualityStars = intensityPercent > 80 ? '⭐⭐⭐⭐⭐' : intensityPercent > 50 ? '⭐⭐⭐⭐' : '⭐⭐⭐';

        // --- Render UI ---
        container.innerHTML = `
            <div class="summary-dashboard animate-fade-in" style="display: flex; flex-direction: column; gap: 2.5rem; padding-bottom: 3rem;">
                
                <!-- AI INSIGHT HEADER -->
                <div style="display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid rgba(255,255,255,0.05); padding-bottom: 1.5rem;">
                    <div>
                        <div style="color: var(--primary); font-size: 0.7rem; font-weight: 800; letter-spacing: 4px; margin-bottom: 8px;">EXECUTIVE SUMMARY</div>
                        <h1 style="color: white; font-weight: 900; font-size: 2.5rem; margin: 0; text-transform: uppercase;">${americana.name}</h1>
                    </div>
                    <div style="display: flex; gap: 1rem;">
                        <button class="btn-outline-pro" onclick="copySummaryToWhatsApp('${americanaId}')" style="padding: 0.8rem 1.5rem; border-color: #25D366; color: #25D366;">📲 CLAN WHATSAPP</button>
                        <button class="btn-outline-pro" onclick="window.print()" style="padding: 0.8rem 1.5rem;">🖨️ REPORTE PDF</button>
                        <button class="btn-primary-pro" onclick="exportToExcel('${americanaId}')" style="background: #1D6F42; color: white; padding: 0.8rem 2rem;">📥 EXCEL</button>
                    </div>
                </div>

                <!-- TOP ANALYTICS GRID -->
                <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 1.5rem;">
                    
                    <!-- MVP Card -->
                    <div class="glass-card-enterprise" style="background: linear-gradient(135deg, rgba(204,255,0,0.15) 0%, rgba(0,0,0,0.4) 100%); border: 2px solid var(--primary); padding: 2rem; position: relative; overflow: hidden; display: flex; align-items: center; gap: 2rem;">
                         <div style="position: absolute; right: -20px; top: -20px; font-size: 8rem; opacity: 0.1;">🏆</div>
                         <div style="width: 100px; height: 100px; background: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 3rem; box-shadow: 0 0 30px var(--primary-glow);">👑</div>
                         <div>
                            <div style="font-size: 0.8rem; font-weight: 800; color: var(--primary); letter-spacing: 2px;">REY DE LA PISTA (MVP)</div>
                            <div style="font-size: 2rem; font-weight: 900; color: white; margin: 5px 0;">${mvp.name}</div>
                            <div style="display: flex; gap: 1rem; margin-top: 10px;">
                                <span style="background: rgba(0,0,0,0.3); padding: 5px 12px; border-radius: 20px; font-size: 0.75rem; color: #ccff00;">🔥 ${mvp.games} JUEGOS</span>
                                <span style="background: rgba(0,0,0,0.3); padding: 5px 12px; border-radius: 20px; font-size: 0.75rem; color: #25D366;">✅ ${mvp.wins} VICTORIAS</span>
                            </div>
                         </div>
                    </div>

                    <!-- Intensity Meter -->
                    <div class="glass-card-enterprise" style="text-align: center; padding: 2rem; display: flex; flex-direction: column; justify-content: center;">
                        <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 800; margin-bottom: 1rem;">INTENSIDAD MEDIA</div>
                        <div style="position: relative; height: 80px; width: 80px; margin: 0 auto;">
                            <svg viewBox="0 0 36 36" style="transform: rotate(-90deg);">
                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="3" />
                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--primary)" stroke-width="3" stroke-dasharray="${intensityPercent}, 100" />
                            </svg>
                            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 1.2rem; font-weight: 900;">${intensityPercent}%</div>
                        </div>
                        <div style="font-size: 0.6rem; color: #888; margin-top: 10px;">PARTIDOS AJUSTADOS</div>
                    </div>

                    <!-- Quick Stats -->
                    <div class="glass-card-enterprise" style="padding: 1.5rem; display: flex; flex-direction: column; gap: 10px; justify-content: center;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 0.7rem; color: #888;">Total Juegos:</span>
                            <span style="font-weight: 900; color: var(--primary);">${totalGames}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 0.7rem; color: #888;">Partidos:</span>
                            <span style="font-weight: 900; color: white;">${finishedMatches.length}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 0.7rem; color: #888;">Ratio Juegos:</span>
                            <span style="font-weight: 900; color: var(--secondary);">${(totalGames / finishedMatches.length).toFixed(1)}</span>
                        </div>
                    </div>
                </div>

                <!-- HIGHLIGHTS & INSIGHTS -->
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem;">
                    <div class="glass-card-enterprise" style="padding: 1.5rem; border-left: 4px solid var(--secondary);">
                        <div style="font-size: 0.7rem; color: var(--text-muted); margin-bottom: 8px;">PISTA MÁS ACTIVA</div>
                        <div style="font-size: 1.2rem; font-weight: 900; color: white;">Pista ${busiestCourt}</div>
                        <div style="font-size: 0.7rem; color: var(--secondary); margin-top: 4px;">${courtGames[busiestCourt]} Juegos totales</div>
                    </div>
                    <div class="glass-card-enterprise" style="padding: 1.5rem; border-left: 4px solid var(--primary);">
                        <div style="font-size: 0.7rem; color: var(--text-muted); margin-bottom: 8px;">CALIDAD DEL TORNEO</div>
                        <div style="font-size: 1.2rem; font-weight: 900; color: white;">${qualityStars}</div>
                        <div style="font-size: 0.7rem; color: var(--primary); margin-top: 4px;">Nivel de paridad: ${intensityPercent}%</div>
                    </div>
                    <div class="glass-card-enterprise" style="padding: 1.5rem; border-left: 4px solid var(--danger);">
                        <div style="font-size: 0.7rem; color: var(--text-muted); margin-bottom: 8px;">MEJOR GOLEADA</div>
                        <div style="font-size: 0.9rem; font-weight: 800; color: white; line-height: 1.2;">${bestBlowout.match ? (Array.isArray(bestBlowout.match.team_a_names) ? bestBlowout.match.team_a_names[0] : bestBlowout.match.team_a_names) : 'N/A'}</div>
                        <div style="font-size: 0.7rem; color: var(--danger); margin-top: 4px;">Diferencia de ${bestBlowout.diff} juegos</div>
                    </div>
                </div>

                <!-- GRAPHS SECTION -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                    <div class="glass-card-enterprise" style="padding: 2.5rem;">
                        <h3 style="color: white; margin-bottom: 2rem; font-weight: 900; letter-spacing: 1px; font-size: 0.9rem;">📈 EVOLUCIÓN DE PUNTUACIÓN POR RONDA</h3>
                        <canvas id="roundEvolutionChart" style="max-height: 250px;"></canvas>
                    </div>
                    <div class="glass-card-enterprise" style="padding: 2.5rem;">
                        <h3 style="color: white; margin-bottom: 2rem; font-weight: 900; letter-spacing: 1px; font-size: 0.9rem;">🔥 RENDIMIENTO TOP 5 PLAYERS</h3>
                        <canvas id="topPlayersChart" style="max-height: 250px;"></canvas>
                    </div>
                </div>

                <!-- NEW: ACHIEVEMENT BADGES & LEVEL SUGGESTIONS -->
                <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 2rem;">
                    
                    <!-- SPECIAL ACHIEVEMENTS -->
                    <div class="glass-card-enterprise" style="padding: 2rem;">
                        <h3 style="color: white; margin-bottom: 1.5rem; font-weight: 900; font-size: 0.9rem; letter-spacing: 1px;">🏅 LOGROS DEL TORNEO</h3>
                        <div style="display: flex; flex-direction: column; gap: 15px;">
                            ${sortedPlayers.find(p => p.losses === 0 && p.matches > 2) ? `
                                <div style="display: flex; align-items: center; gap: 12px; background: rgba(204,255,0,0.05); padding: 12px; border-radius: 12px; border: 1px solid rgba(204,255,0,0.2);">
                                    <div style="font-size: 1.5rem;">💎</div>
                                    <div>
                                        <div style="font-weight: 800; font-size: 0.8rem; color: var(--primary);">INVICTUS</div>
                                        <div style="font-size: 0.7rem; color: #888;">${sortedPlayers.find(p => p.losses === 0).name} (0 derrotas)</div>
                                    </div>
                                </div>
                            ` : ''}
                            ${sortedPlayers.find(p => p.games > (totalGames / Object.keys(players).length) * 1.5) ? `
                                <div style="display: flex; align-items: center; gap: 12px; background: rgba(59,130,246,0.05); padding: 12px; border-radius: 12px; border: 1px solid rgba(59,130,246,0.2);">
                                    <div style="font-size: 1.5rem;">🏹</div>
                                    <div>
                                        <div style="font-weight: 800; font-size: 0.8rem; color: var(--secondary);">FRANCOTIRADOR</div>
                                        <div style="font-size: 0.7rem; color: #888;">${sortedPlayers.find(p => p.games > (totalGames / Object.keys(players).length) * 1.5).name} (+50% media)</div>
                                    </div>
                                </div>
                            ` : ''}
                            <div style="display: flex; align-items: center; gap: 12px; background: rgba(255,77,77,0.05); padding: 12px; border-radius: 12px; border: 1px solid rgba(255,77,77,0.2);">
                                <div style="font-size: 1.5rem;">🛡️</div>
                                <div>
                                    <div style="font-weight: 800; font-size: 0.8rem; color: #FF4D4D;">MURO DEFENSIVO</div>
                                    <div style="font-size: 0.7rem; color: #888;">${Object.values(players).sort((a, b) => a.pointsAgainst - b.pointsAgainst)[0].name} (Menos puntos encajados)</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- AI LEVEL RECOMMENDATIONS -->
                    <div class="glass-card-enterprise" style="padding: 2rem; border-top: 4px solid var(--primary);">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem;">
                            <div>
                                <h3 style="color: white; margin: 0; font-weight: 900; font-size: 0.9rem; letter-spacing: 1px;">🧠 IA: RECOMENDACIÓN DE AJUSTE DE NIVELES</h3>
                                <p style="font-size: 0.65rem; color: #888; margin-top: 4px;">Basado en el performance hoy vs el resto del grupo</p>
                            </div>
                            <span style="background: var(--primary); color: black; font-size: 0.6rem; font-weight: 900; padding: 2px 8px; border-radius: 4px;">AUTOMÁTICO</span>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                            <div>
                                <div style="font-size: 0.7rem; font-weight: 800; color: #25D366; margin-bottom: 15px;">PROXIMO ASCENSO (Sube +0.05/0.10)</div>
                                ${sortedPlayers.slice(0, 3).map(p => `
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 0.75rem;">
                                        <span style="color: white; font-weight: 600;">${p.name.split(' / ')[0]}</span>
                                        <span style="color: #25D366; font-weight: 900;">↑ ${((p.wins / p.matches) * 0.1).toFixed(2)}pt</span>
                                    </div>
                                `).join('')}
                            </div>
                            <div>
                                <div style="font-size: 0.7rem; font-weight: 800; color: #FF4D4D; margin-bottom: 15px;">AJUSTE TÉCNICO (Baja -0.05)</div>
                                ${sortedPlayers.slice(-3).map(p => `
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 0.75rem;">
                                        <span style="color: #888;">${p.name.split(' / ')[0]}</span>
                                        <span style="color: #FF4D4D; font-weight: 900;">↓ 0.05pt</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- FULL TABLE -->
                <div class="glass-card-enterprise" style="padding: 0; overflow: hidden; border: 1px solid rgba(255,255,255,0.05);">
                    <div style="padding: 2rem; background: rgba(255,255,255,0.02); display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="margin:0; font-weight: 900; font-size: 1rem;">AUDITORÍA DE RESULTADOS COMPLETA</h3>
                        <div style="font-size: 0.7rem; color: #888;">${Object.keys(players).length} JUGADORES REGISTRADOS</div>
                    </div>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: rgba(0,0,0,0.3); border-bottom: 2px solid rgba(255,255,255,0.05);">
                                <th style="padding: 1.2rem; text-align: left; font-size: 0.75rem; color: var(--primary); text-transform: uppercase;">Posición</th>
                                <th style="padding: 1.2rem; text-align: left; font-size: 0.75rem; color: var(--primary); text-transform: uppercase;">Jugador</th>
                                <th style="padding: 1.2rem; text-align: center; font-size: 0.75rem; color: var(--primary); text-transform: uppercase;">PJ</th>
                                <th style="padding: 1.2rem; text-align: center; font-size: 0.75rem; color: #25D366; text-transform: uppercase;">Vict.</th>
                                <th style="padding: 1.2rem; text-align: center; font-size: 0.75rem; color: #FF4D4D; text-transform: uppercase;">Derr.</th>
                                <th style="padding: 1.2rem; text-align: center; font-size: 0.75rem; color: white; text-transform: uppercase;">Juegos</th>
                                <th style="padding: 1.2rem; text-align: right; font-size: 0.75rem; color: var(--secondary); text-transform: uppercase;">Rendimiento %</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sortedPlayers.map((p, i) => `
                                <tr style="border-bottom: 1px solid rgba(255,255,255,0.03); transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
                                    <td style="padding: 1rem 1.2rem; font-weight: 800; color: ${i < 3 ? 'var(--primary)' : '#666'};">
                                        ${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                                    </td>
                                    <td style="padding: 1rem 1.2rem; font-weight: 700; color: white;">${p.name}</td>
                                    <td style="padding: 1rem 1.2rem; text-align: center;">${p.matches}</td>
                                    <td style="padding: 1rem 1.2rem; text-align: center; color: #25D366; font-weight: 800;">${p.wins}</td>
                                    <td style="padding: 1rem 1.2rem; text-align: center; color: #FF4D4D;">${p.losses}</td>
                                    <td style="padding: 1rem 1.2rem; text-align: center; font-weight: 900; background: rgba(204,255,0,0.05); color: var(--primary);">${p.games}</td>
                                    <td style="padding: 1rem 1.2rem; text-align: right;">
                                        <div style="display: flex; align-items: center; justify-content: flex-end; gap: 10px;">
                                            <div style="background: rgba(255,255,255,0.05); height: 8px; border-radius: 4px; width: 80px; overflow: hidden;">
                                                <div style="background: ${p.wins >= p.losses ? 'var(--success)' : 'var(--danger)'}; height: 100%; border-radius: 4px; width: ${(p.wins / p.matches * 100).toFixed(0)}%;"></div>
                                            </div>
                                            <span style="font-size: 0.8rem; font-weight: 800; min-width: 40px;">${(p.wins / p.matches * 100).toFixed(0)}%</span>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        // --- Initialize Charts ---
        setTimeout(() => {
            // 1. Performance Bar Chart
            const ctx1 = document.getElementById('topPlayersChart')?.getContext('2d');
            if (ctx1) {
                new Chart(ctx1, {
                    type: 'bar',
                    data: {
                        labels: top5.map(p => p.name.split(' / ')[0]),
                        datasets: [{
                            label: 'Juegos',
                            data: top5.map(p => p.games),
                            backgroundColor: 'rgba(204, 255, 0, 0.4)',
                            borderColor: '#ccff00',
                            borderWidth: 2,
                            borderRadius: 10,
                            barThickness: 30
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#888' } },
                            x: { grid: { display: false }, ticks: { color: '#888' } }
                        }
                    }
                });
            }

            // 2. Evolution Line Chart
            const ctx2 = document.getElementById('roundEvolutionChart')?.getContext('2d');
            if (ctx2) {
                const rounds = Object.keys(roundStats).sort();
                new Chart(ctx2, {
                    type: 'line',
                    data: {
                        labels: rounds.map(r => `R${r}`),
                        datasets: [{
                            label: 'Games x Round',
                            data: rounds.map(r => roundStats[r]),
                            borderColor: '#3b82f6',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            fill: true,
                            tension: 0.4,
                            pointBackgroundColor: '#3b82f6',
                            pointRadius: 6,
                            borderWidth: 4
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#888' } },
                            x: { grid: { display: false }, ticks: { color: '#888' } }
                        }
                    }
                });
            }
        }, 120);

    } catch (e) {
        console.error("Summary Error:", e);
        container.innerHTML = `<div class="error">Error: ${e.message}</div>`;
    }
};

window.exportToExcel = async (americanaId) => {
    try {
        const [americana, matches] = await Promise.all([
            FirebaseDB.americanas.getById(americanaId),
            FirebaseDB.matches.getByAmericana(americanaId)
        ]);

        // 1. Prepare Match Data
        const matchData = matches.map(m => ({
            Ronda: m.round,
            Pista: m.court,
            'Equipo A': m.team_a_names,
            'Equipo B': m.team_b_names,
            'Resultado A': m.score_a,
            'Resultado B': m.score_b,
            Estado: m.status === 'finished' ? 'FINALIZADO' : m.status === 'live' ? 'EN JUEGO' : 'PENDIENTE'
        }));

        // 2. Prepare Standings Data
        const stats = {};
        matches.filter(m => m.status === 'finished').forEach(m => {
            const namesA = Array.isArray(m.team_a_names) ? m.team_a_names : [m.team_a_names];
            const namesB = Array.isArray(m.team_b_names) ? m.team_b_names : [m.team_b_names];
            const sA = parseInt(m.score_a || 0);
            const sB = parseInt(m.score_b || 0);

            [...namesA, ...namesB].forEach(name => {
                if (!stats[name]) stats[name] = { Jugador: name, Partidos: 0, Victorias: 0, Juegos: 0 };
                stats[name].Partidos++;
            });
            namesA.forEach(n => { stats[n].Juegos += sA; if (sA > sB) stats[n].Victorias++; });
            namesB.forEach(n => { stats[n].Juegos += sB; if (sB > sA) stats[n].Victorias++; });
        });

        const standingsData = Object.values(stats).sort((a, b) => b.Juegos - a.Juegos);

        // 3. Create Workbook
        const wb = XLSX.utils.book_new();
        const wsMatches = XLSX.utils.json_to_sheet(matchData);
        const wsStandings = XLSX.utils.json_to_sheet(standingsData);

        XLSX.utils.book_append_sheet(wb, wsMatches, "Partidos");
        XLSX.utils.book_append_sheet(wb, wsStandings, "Clasificación");

        // 4. Download
        const fileName = `${americana.name.replace(/\s+/g, '_')}_Resumen.xlsx`;
        XLSX.writeFile(wb, fileName);

        AdminAuth.localToast("Excel generado correctamente", "success");
    } catch (e) {
        console.error("Export Error:", e);
        alert("Error exportando a Excel: " + e.message);
    }
};

window.copySummaryToWhatsApp = async (americanaId) => {
    try {
        const [americana, matches] = await Promise.all([
            FirebaseDB.americanas.getById(americanaId),
            FirebaseDB.matches.getByAmericana(americanaId)
        ]);

        const players = {};
        matches.filter(m => m.status === 'finished').forEach(m => {
            const names = [...(Array.isArray(m.team_a_names) ? m.team_a_names : [m.team_a_names]), ...(Array.isArray(m.team_b_names) ? m.team_b_names : [m.team_b_names])];
            const sA = parseInt(m.score_a); const sB = parseInt(m.score_b);
            names.forEach(n => { if (!players[n]) players[n] = { name: n, games: 0, wins: 0 }; });
            (Array.isArray(m.team_a_names) ? m.team_a_names : [m.team_a_names]).forEach(n => { players[n].games += sA; if (sA > sB) players[n].wins++; });
            (Array.isArray(m.team_b_names) ? m.team_b_names : [m.team_b_names]).forEach(n => { players[n].games += sB; if (sB > sA) players[n].wins++; });
        });

        const ranking = Object.values(players).sort((a, b) => b.games - a.games).slice(0, 10);

        let text = `🏆 *RESUMEN TORNEO: ${americana.name.toUpperCase()}* 🏆\n\n`;
        text += `📅 Fecha: ${americana.date}\n`;
        text += `🎾 Partidos disputados: ${matches.filter(m => m.status === 'finished').length}\n\n`;
        text += `🔥 *TOP 10 RANKING FINAL:*\n`;

        ranking.forEach((p, i) => {
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🔹';
            text += `${medal} *${p.name}*: ${p.games} juegos (${p.wins} vict.)\n`;
        });

        text += `\n✨ _¡Gracias a todos por participar en SomosPadel BCN!_ ✨`;

        await navigator.clipboard.writeText(text);
        AdminAuth.localToast("¡Resumen copiado para WhatsApp! ✅", "success");
    } catch (e) {
        alert("Error al copiar: " + e.message);
    }
};
// --- Event Listeners & Init ---
document.addEventListener('DOMContentLoaded', () => {
    // Force global init check with safety
    if (window.AdminAuth && typeof window.AdminAuth.init === 'function') {
        window.AdminAuth.init();
    } else {
        console.error("⚠️ CRITICAL: AdminAuth or AdminAuth.init not found.");
        // Try to recover or warn
        setTimeout(() => {
            if (window.AdminAuth) window.AdminAuth.init();
        }, 500);
    }


    // Login Form Handler
    const loginForm = document.getElementById('admin-login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                if (!window.AdminAuth) throw new Error("AdminAuth is undefined");

                const fd = new FormData(e.target);
                const phone = fd.get('phone');
                const pass = fd.get('password');
                const remember = fd.get('remember'); // Get checkbox status

                await window.AdminAuth.login(phone, pass);

                // Extra safety for saving checkbox state if login succeeds (login func handles it too, but just in case)
                if (remember) {
                    localStorage.setItem('admin_remember_check', 'true');
                }

            } catch (err) {
                console.error("Login Handler Error:", err);
                alert("Error Inesperado en Login: " + (err.message || err));
            }
        });
    }

    // Modal Closers
    window.closeAdminModal = () => {
        document.getElementById('admin-user-modal').classList.add('hidden');
    };
    window.closeAmericanaModal = () => {
        document.getElementById('admin-americana-modal').classList.add('hidden');
        document.getElementById('admin-americana-modal').style.display = 'none';
    };
});