
window.AdminViews = window.AdminViews || {};

window.AdminViews.users = async function () {
    const content = document.getElementById('content-area');
    const titleEl = document.getElementById('page-title');

    if (titleEl) titleEl.textContent = 'BBDD JUGADORES';
    content.innerHTML = '<div class="loader"></div>';

    // FETCH REAL DATA
    // Aseguramos que cargamos TODOS, sin paginación si es posible
    const users = await FirebaseDB.players.getAll();

    console.log("👥 Usuarios cargados en Admin:", users.length);

    // Cache initialization
    window.allUsersCache = users;
    window.filteredUsers = [...users];

    // Setup Render Function
    window.renderUserRows = (data) => {
        const tbody = document.getElementById('users-tbody');
        if (!tbody) return;

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 2rem;">No se encontraron jugadores.</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(u => {
            const isPending = u.status === 'pending';
            const canManageUsers = AdminAuth.user && AdminAuth.hasAdminRole(AdminAuth.user.role);

            let roleBadge = (u.role || 'player').toUpperCase();
            if (u.role === 'super_admin') roleBadge = '👑 SUPER ADMIN';
            else if (u.role === 'admin_player') roleBadge = '🎖️ ADMIN + JUGADOR';

            const isSuper = u.role === 'super_admin';
            // Safe URL construction
            const safePhone = (u.phone || '').replace(/\D/g, '');

            return `
                <tr class="pro-table-row" style="background: ${isPending ? 'rgba(255,165,0,0.05)' : 'transparent'}">
                <td>
                    <div class="pro-player-cell">
                        <div class="pro-avatar" style="background: ${isSuper ? 'linear-gradient(135deg, #FFD700, #FFA500)' : (u.role === 'admin_player' ? 'var(--primary-glow)' : '')}; color: ${isSuper ? 'black' : 'white'}; box-shadow: ${isSuper ? '0 0 10px #FFD700' : 'none'};">${(u.name || '?').charAt(0)}</div>
                        <div>
                            <div style="display:flex; align-items:center; gap:8px;">
                                <div style="font-weight: 700; color: ${isSuper ? '#FFD700' : 'var(--text)'};">${u.name || 'Sin Nombre'}</div>
                                ${u.membership === 'somospadel_bcn' ? '<span style="font-size:0.6rem; background: var(--primary); color:black; padding: 2px 5px; border-radius:4px; font-weight:700;">COMUNIDAD BCN</span>' : ''}
                                ${u.team_somospadel ? (Array.isArray(u.team_somospadel)
                    ? u.team_somospadel.map(t => `<span style="font-size:0.6rem; background: #6366f1; color:white; padding: 2px 5px; border-radius:4px; font-weight:700;">${t.toUpperCase()}</span>`).join(' ')
                    : `<span style="font-size:0.6rem; background: #6366f1; color:white; padding: 2px 5px; border-radius:4px; font-weight:700;">${u.team_somospadel.toUpperCase()}</span>`
                ) : ''}
                            </div>
                            <div style="font-size: 0.7rem; font-weight: 500; color: ${isSuper ? '#FFD700' : (u.role === 'admin_player' ? 'var(--primary)' : 'var(--text-muted)')};">
                                ${roleBadge}
                            </div>
                        </div>
                    </div>
                </td>
                <td>
                    <div style="display:flex; align-items:center; gap:0.8rem;">
                         <span style="color: var(--primary); font-family: 'Outfit'; font-weight: 600;">${u.phone || '-'}</span>
                         <button onclick="window.openWhatsAppActions('${safePhone}', '')" title="Abrir Chat de WhatsApp" style="cursor:pointer; background: rgba(37, 211, 102, 0.1); color: #25D366; border: 1px solid #25D366; padding: 6px 12px; border-radius: 8px; font-weight: 700; display: flex; align-items: center; gap: 6px; font-size: 0.75rem; transition: all 0.2s;">
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
                            ${(u.gender || '?').toUpperCase()}
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
                        ${canManageUsers ? `
                            ${isPending ? `<button class="btn-primary-pro" style="padding: 0.4rem 0.8rem; font-size: 0.7rem;" onclick="approveUser('${u.id}')">VALIDAR</button>` : ''}
                            <button class="btn-outline-pro" style="padding: 0.4rem 0.8rem; font-size: 0.7rem;" onclick='openEditUserModal(${JSON.stringify(u).replace(/'/g, "&#39;")})'>EDITAR</button>
                            <button class="btn-outline-pro" style="padding: 0.4rem 0.8rem; font-size: 0.7rem; color: var(--danger); border-color: var(--danger-dim);" onclick="deleteUser('${u.id}')">ELIMINAR</button>
                        ` : '<span style="color:var(--text-muted); font-size:0.7rem;">👁️ SOLO LECTURA</span>'}
                    </div>
                </td>
            </tr > `;
        }).join('');
    };

    content.innerHTML = `
        <div class="glass-card-enterprise" style="padding: 0; overflow: hidden;">
            <div style="padding: 1.5rem 2rem; display: flex; justify-content: space-between; align-items: center; border-bottom: var(--border-pro); flex-wrap: wrap; gap: 1rem;">
                <h3 style="margin:0;">GOBERNANZA DE JUGADORES <span style="color:var(--text-muted); font-size: 0.8rem; margin-left: 10px;">TOTAL: ${users.length}</span></h3>
                <div style="display:flex; gap: 0.8rem; flex-wrap: wrap;">
                    <button class="btn-outline-pro" style="padding: 0.5rem 1rem; border-color: #107c10; color: #107c10; background: rgba(16, 124, 16, 0.05);" onclick="exportToExcel()">
                        📗 EXPORTAR EXCEL
                    </button>
                    <!-- NEW RESET BUTTON -->
                    <button class="btn-outline-pro" style="padding: 0.5rem 1rem; border-color: #ef4444; color: #ef4444; background: rgba(239, 68, 68, 0.05);" onclick="batchResetLevels()">
                        ⚠️ RESET NIVEL 3
                    </button>
                    <!-- NEW RECALC STATS BUTTON -->
                    <button class="btn-outline-pro" style="padding: 0.5rem 1rem; border-color: #eab308; color: #eab308; background: rgba(234, 179, 8, 0.05); margin-left: auto;" onclick="recalculateMatchesPlayed()">
                        🔄 REPARAR STATS
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
                <select id="filter-team" class="pro-input-micro" onchange="multiFilterUsers()">
                    <option value="">Equipo (Todos)</option>
                    <option value="3º Masculino A">3º Masculino A</option>
                    <option value="3º Masculino B">3º Masculino B</option>
                    <option value="4º Masculino">4º Masculino</option>
                    <option value="4º Femenino">4º Femenino</option>
                    <option value="4º Mixto A">4º Mixto A</option>
                    <option value="4º Mixto B">4º Mixto B</option>
                    <option value="3º Mixto">3º Mixto</option>
                    <option value="2º Femenino">2º Femenino</option>
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
                <tbody id="users-tbody"></tbody>
            </table>
            <div class="pro-table-footer">SISTEMA INTEGRADO DE BASE DE DATOS v2.0 PRO</div>
        </div>`;

    // Initial Render
    window.renderUserRows(window.filteredUsers);

    // ==========================================
    // MODULE INTERNAL HELPERS
    // ==========================================

    window.multiFilterUsers = () => {
        const search = document.getElementById('global-search').value.toLowerCase();
        const fName = document.getElementById('filter-name').value.toLowerCase();
        const fPhone = document.getElementById('filter-phone').value.toLowerCase();
        const fLevel = document.getElementById('filter-level').value.toLowerCase();
        const fGender = document.getElementById('filter-gender').value;
        const fStatus = document.getElementById('filter-status').value;
        const fTeam = document.getElementById('filter-team').value;

        window.filteredUsers = window.allUsersCache.filter(u => {
            const matchesGlobal = !search ||
                (u.name || '').toLowerCase().includes(search) ||
                (u.phone || '').includes(search);

            const matchesName = !fName || (u.name || '').toLowerCase().includes(fName);
            const matchesPhone = !fPhone || (u.phone || '').includes(fPhone);
            const matchesLevel = !fLevel || (u.level || u.self_rate_level || '3.5').toString().includes(fLevel);
            const matchesGender = !fGender || u.gender === fGender;
            const matchesStatus = !fStatus || u.status === fStatus;
            const matchesTeam = !fTeam || (Array.isArray(u.team_somospadel) ? u.team_somospadel.includes(fTeam) : u.team_somospadel === fTeam);

            return matchesGlobal && matchesName && matchesPhone && matchesLevel && matchesGender && matchesStatus && matchesTeam;
        });

        window.renderUserRows(window.filteredUsers);
        // Update total count display
        const totalEl = document.querySelector('h3 span');
        if (totalEl) totalEl.textContent = `TOTAL: ${window.filteredUsers.length} `;
    };

    window.resetFilters = () => {
        document.getElementById('global-search').value = "";
        document.getElementById('filter-name').value = "";
        document.getElementById('filter-phone').value = "";
        document.getElementById('filter-level').value = "";
        document.getElementById('filter-gender').value = "";
        document.getElementById('filter-gender').value = "";
        document.getElementById('filter-status').value = "";
        document.getElementById('filter-team').value = "";
        window.multiFilterUsers();
    };

    window.approveUser = async (id) => {
        if (!confirm("¿Confirmar acceso para este jugador? Pasará a estado ACTIVO.")) return;
        try {
            await FirebaseDB.players.update(id, { status: 'active' });

            // Refresh data
            const users = await FirebaseDB.players.getAll();
            window.allUsersCache = users;
            window.multiFilterUsers(); // Re-apply filters

            alert("✅ Usuario validado correctamente");
        } catch (e) {
            console.error("Error validando usuario:", e);
            alert("❌ Error al validar: " + e.message);
        }
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

    // Also attach to window generally for html events
    window.multiFilterUsers = multiFilterUsers;
    window.resetFilters = resetFilters;
    window.approveUser = approveUser;
    window.exportToExcel = exportToExcel;

    // ==========================================
    // MODULE: USER MODALS LOGIC
    // ==========================================

    window.openCreateUserModal = () => {
        const form = document.getElementById('admin-user-form');
        form.reset();
        form.elements['id'].value = ''; // Clear ID for new creation
        document.getElementById('modal-title').textContent = "Registrar Nuevo Jugador";

        document.getElementById('admin-user-modal').classList.remove('hidden');
    };

    window.openEditUserModal = (user) => {
        const form = document.getElementById('admin-user-form');
        form.reset();

        // Populate fields
        form.elements['id'].value = user.id;
        form.elements['name'].value = user.name || '';
        form.elements['phone'].value = user.phone || '';
        form.elements['level'].value = user.level || user.self_rate_level || 3.5;
        form.elements['gender'].value = user.gender || 'chico';
        form.elements['membership'].value = user.membership || 'externo';
        form.elements['role'].value = user.role || 'player';
        form.elements['status'].value = user.status || 'active';
        form.elements['matches_played'].value = user.matches_played || 0;

        // Populate Team Checkboxes
        // Limpiar todos primero
        const checkboxes = form.querySelectorAll('input[name="teams_somospadel_check"]');
        checkboxes.forEach(cb => cb.checked = false);

        if (user.team_somospadel) {
            if (Array.isArray(user.team_somospadel)) {
                user.team_somospadel.forEach(team => {
                    const cb = Array.from(checkboxes).find(c => c.value === team);
                    if (cb) cb.checked = true;
                });
            } else {
                // Legacy string support
                const cb = Array.from(checkboxes).find(c => c.value === user.team_somospadel);
                if (cb) cb.checked = true;
            }
        }

        document.getElementById('modal-title').textContent = `Editar: ${user.name}`;
        document.getElementById('admin-user-modal').classList.remove('hidden');
    };

    window.closeAdminModal = () => {
        document.getElementById('admin-user-modal').classList.add('hidden');
    };

    // NEW: DELETE USER FUNCTION
    window.deleteUser = async (id) => {
        if (!confirm("⚠️ ¿Estás seguro de que quieres ELIMINAR este usuario?\n\nEsta acción no se puede deshacer.")) return;

        try {
            await FirebaseDB.players.delete(id);
            alert("✅ Usuario eliminado correctamente.");

            // Refresh data
            const users = await FirebaseDB.players.getAll();
            window.allUsersCache = users;
            window.multiFilterUsers();
        } catch (e) {
            console.error(e);
            alert("❌ Error al eliminar usuario: " + e.message);
        }
    };

    // FORM SUBMIT HANDLER
    const userForm = document.getElementById('admin-user-form');
    // Remove previous listener if exists (to avoid duplicates on reload)
    const newForm = userForm.cloneNode(true);
    userForm.parentNode.replaceChild(newForm, userForm);

    newForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = newForm.querySelector('button[type="submit"]');
        const originalText = btn.textContent;
        btn.textContent = "Guardando...";
        btn.disabled = true;

        try {
            const formData = new FormData(newForm);
            const id = formData.get('id');

            // Get Checked Teams
            const selectedTeams = [];
            newForm.querySelectorAll('input[name="teams_somospadel_check"]:checked').forEach(cb => {
                selectedTeams.push(cb.value);
            });

            const userData = {
                name: formData.get('name'),
                phone: formData.get('phone'),
                level: parseFloat(formData.get('level')),
                gender: formData.get('gender'),
                membership: formData.get('membership'),
                role: formData.get('role'),
                status: formData.get('status'),
                matches_played: parseInt(formData.get('matches_played') || 0),
                team_somospadel: selectedTeams.length > 0 ? selectedTeams : null // Save as Array
            };

            const pwd = formData.get('password');
            if (pwd && pwd.trim() !== '') {
                userData.password = pwd.trim(); // Only send if changed
                // Note: Password update logic might need backend support or special handling
            }

            if (id) {
                // UPDATE
                await FirebaseDB.players.update(id, userData);
                alert("✅ Jugador actualizado correctamente.");
            } else {
                // CREATE
                // Validations for new user
                if (!userData.phone) throw new Error("El teléfono es obligatorio.");
                await FirebaseDB.players.create(userData); // Assuming create handles ID generation or logic
                alert("✅ Jugador registrado correctamente.");
            }

            // Refresh & Close
            const users = await FirebaseDB.players.getAll();
            window.allUsersCache = users;
            window.multiFilterUsers();
            window.closeAdminModal();

        } catch (err) {
            console.error(err);
            alert("❌ Error al guardar: " + err.message);
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    });
};

// WhatsApp Actions Helper (Global)
window.openWhatsAppActions = (phone, name) => {
    // Just a shell for now, logic likely in main utils or simple alerts
    if (!phone) return alert("Sin teléfono");
    const safePhone = phone.replace(/\D/g, '');
    const url = `https://wa.me/${safePhone}`;
    window.open(url, '_blank');
};

// NEW: RECALCULATE STATS FUNCTION (DESTRUCTIVE CLEANUP)
window.recalculateMatchesPlayed = async () => {
    if (!confirm("⚠️ MODO LIMPIEZA TOTAL: ¿Deseas ELIMINAR permanentemente los partidos huérfanos de la base de datos?\n\nEl sistema escaneará cada partido. Si pertenece a un evento que ya no existe, el partido será BORRADO físicamente. Luego se recalcularán las estadísticas.")) return;

    const btn = document.querySelector('button[onclick="recalculateMatchesPlayed()"]');
    let originalText = "";
    if (btn) {
        originalText = btn.textContent;
        btn.textContent = "Limpiando DB...";
        btn.disabled = true;
        btn.style.backgroundColor = 'red';
        btn.style.color = 'white';
    }

    try {
        console.log("🧹 Iniciando LIMPIEZA DEEP CLEAN...");

        const players = await FirebaseDB.players.getAll();
        const statsMap = {};
        players.forEach(p => {
            statsMap[p.id] = { matches_played: 0, wins: 0, games_won: 0, total_points: 0 };
        });

        // 1. Fetch Active Events
        console.log("🔍 Identificando eventos activos...");
        const activeAmericanas = await FirebaseDB.americanas.getAll();
        const activeEntrenos = await FirebaseDB.entrenos.getAll();
        const validIds = new Set([
            ...activeAmericanas.map(a => a.id),
            ...activeEntrenos.map(e => e.id)
        ]);

        let deletedMatches = 0;
        let processedMatches = 0;

        // Helper Processor
        const processCollection = async (collectionName) => {
            const snapshot = await db.collection(collectionName).get();
            let batch = db.batch();
            let batchCount = 0;
            const MAX_BATCH = 450;

            for (const doc of snapshot.docs) {
                const m = doc.data();

                // CHECK INTEGRITY
                const parentId = m.americana_id;

                // If orphan -> DELETE
                if (parentId && !validIds.has(parentId)) {
                    batch.delete(doc.ref);
                    deletedMatches++;
                    batchCount++;
                } else if (!m.status || m.status === 'deleted') {
                    // Skip or Delete explicitly deleted
                    if (m.status === 'deleted') {
                        // batch.delete(doc.ref); // Optional clean deleted flags
                    }
                } else {
                    // VALID MATCH -> Process Stats
                    const isFinished = (m.status === 'finished') || (m.result && (m.result.set1 || m.score));
                    if (isFinished) {
                        calculateMatchStats(m, statsMap);
                        processedMatches++;
                    }
                }

                // Commit batch if full
                if (batchCount >= MAX_BATCH) {
                    await batch.commit();
                    batch = db.batch();
                    batchCount = 0;
                }
            }
            if (batchCount > 0) await batch.commit();
        };

        // Logic split to reuse
        const calculateMatchStats = (m, statsMap) => {
            let teamA = [], teamB = [];
            if (m.player1) teamA.push((m.player1.id || m.player1));
            if (m.player2) teamA.push((m.player2.id || m.player2));
            if (m.player3) teamB.push((m.player3.id || m.player3));
            if (m.player4) teamB.push((m.player4.id || m.player4));

            if (m.team_a_ids && m.team_a_ids.length > 0) teamA = m.team_a_ids;
            if (m.team_b_ids && m.team_b_ids.length > 0) teamB = m.team_b_ids;

            let scoreA = 0, scoreB = 0;
            if (m.result && m.result.set1) {
                scoreA = parseInt(m.result.set1.a || 0); scoreB = parseInt(m.result.set1.b || 0);
            } else if (typeof m.score === 'string' && m.score.includes('-')) {
                const p = m.score.split('-'); scoreA = parseInt(p[0]); scoreB = parseInt(p[1]);
            }

            [...teamA, ...teamB].forEach(pid => {
                const id = (typeof pid === 'object' && pid.id) ? pid.id : pid;
                if (statsMap[id]) {
                    statsMap[id].matches_played++;
                    if (teamA.some(p => (p.id || p) === id)) statsMap[id].games_won += scoreA;
                    if (teamB.some(p => (p.id || p) === id)) statsMap[id].games_won += scoreB;
                }
            });

            if (scoreA > scoreB) teamA.forEach(pid => { if (statsMap[(pid.id || pid)]) statsMap[(pid.id || pid)].wins++; });
            else if (scoreB > scoreA) teamB.forEach(pid => { if (statsMap[(pid.id || pid)]) statsMap[(pid.id || pid)].wins++; });
        };

        // EXECUTE
        await processCollection('matches');
        await processCollection('entrenos_matches');

        console.log(`🗑️ Eliminados ${deletedMatches} partidos huérfanos.`);
        console.log(`📊 Procesados ${processedMatches} partidos reales.`);

        // UPDATE PLAYERS
        let updatedCount = 0;
        const updates = [];
        for (const pid in statsMap) {
            const c = statsMap[pid];
            const player = players.find(p => p.id === pid);
            if (!player) continue;

            const winRate = c.matches_played > 0 ? Math.round((c.wins / c.matches_played) * 100) : 0;
            const newData = { matches_played: c.matches_played, wins: c.wins, games_won: c.games_won, win_rate: winRate };

            const current = {
                matches_played: player.matches_played || 0,
                wins: player.wins || 0,
                games_won: player.games_won || 0,
                win_rate: player.win_rate || 0
            };

            if (JSON.stringify(newData) !== JSON.stringify(current)) {
                updates.push(FirebaseDB.players.update(pid, newData));
                updatedCount++;
            }
        }
        await Promise.all(updates);

        alert(`✅ LIMPIEZA COMPLETA.\n\n- Partidos huérfanos ELIMINADOS: ${deletedMatches}\n- Perfiles actualizados: ${updatedCount}`);

        // Refresh
        const users = await FirebaseDB.players.getAll();
        window.allUsersCache = users;
        window.multiFilterUsers();

    } catch (e) {
        console.error(e);
        alert("❌ Error crítico: " + e.message);
    } finally {
        if (btn) {
            btn.textContent = originalText;
            btn.disabled = false;
            btn.style.backgroundColor = '';
            btn.style.color = '';
        }
    }
};

// --- BATCH ACTION: RESET LEVELS ---
window.batchResetLevels = async () => {
    if (!confirm("⚠️ ATENCIÓN: Esta acción pondrá el NIVEL 3.0 a TODOS los jugadores de la base de datos actual.\n\n¿Estás seguro de que quieres continuar?")) return;
    const confirmation = prompt("⚠️ PELIGRO ⚠️\nEsto es irreversible.\nEscribe 'RESET' para confirmar:");

    if (confirmation !== 'RESET') return alert("Operación cancelada.");

    const users = window.allUsersCache || [];
    if (users.length === 0) return alert("No hay usuarios cargados.");

    const content = document.getElementById('content-area');
    const originalHTML = content.innerHTML;
    // Show Loading
    content.innerHTML = `
        <div style="height: 100%; display: flex; flex-direction:column; justify-content: center; align-items: center; color: white;">
            <div class="loader"></div>
            <div style="margin-top:20px; font-size: 1.2rem; font-weight: bold;">ACTUALIZANDO NIVELES MASIVAMENTE...</div>
            <div style="color: #888; margin-top: 10px;">Por favor, no cierres la página.</div>
        </div>`;

    let count = 0;
    try {
        // Ejecutamos en serie para no saturar si es firebase simulado, o en paralelo limitado
        for (let u of users) {
            // Forzamos update a nivel 3
            // Nota: En un entorno real esto debería ser una llamada batch al servidor, 
            // pero aquí iteramos en cliente.
            if (u.level != 3) {
                await FirebaseDB.players.update(u.id, { level: 3, self_rate_level: 3 });
                count++;
            }
        }

        alert(`✅ Proceso completado.\nSe han actualizado ${count} jugadores al Nivel 3.\n\n(Total revisados: ${users.length})`);

        // Recargar vista
        window.location.reload(); // Recarga completa para asegurar limpieza

    } catch (e) {
        console.error(e);
        alert("❌ Error durante el proceso masivo: " + e.message);
        window.location.reload();
    }
};
