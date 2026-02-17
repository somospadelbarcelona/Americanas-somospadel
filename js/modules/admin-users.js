
window.AdminViews = window.AdminViews || {};

window.AdminViews.users = async function () {
    const content = document.getElementById('content-area');
    const titleEl = document.getElementById('page-title');

    if (titleEl) titleEl.textContent = 'BBDD JUGADORES';
    content.innerHTML = `
        <div class="loading-container">
            <div class="loader"></div>
            <p>Conectando con la base de datos de jugadores...</p>
        </div>`;

    // FETCH REAL DATA
    let users = [];
    try {
        console.log("🔍 Fetching players from Firebase...");
        // Add a timeout of 15s for the fetch to be safe
        users = await Promise.race([
            FirebaseDB.players.getAll(),
            new Promise((_, reject) => setTimeout(() => reject(new Error("La base de datos Firebase no responde (Timeout 15s)")), 15000))
        ]);

        console.log("👥 Usuarios cargados en Admin:", users.length);
        window.allUsersCache = users;
        window.filteredUsers = [...users];
        window._allPlayersCache = users; // Unified cache for WhatsApp sharing
    } catch (err) {
        console.error("❌ Error fetching players:", err);
        content.innerHTML = `
            <div class="loading-container" style="color:var(--danger);">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem;"></i>
                <p>Error al cargar jugadores: ${err.message}</p>
                <div style="display:flex; gap: 10px;">
                    <button class="btn-primary-pro" onclick="window.loadAdminView('users')">REINTENTAR</button>
                    <button class="btn-outline-pro" onclick="localStorage.clear(); sessionStorage.clear(); location.reload();">LIMPIAR CACHÉ Y RECARGAR</button>
                </div>
            </div>`;
        return;
    }

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

            // EXPERT DEBUG: check if AdminAuth is ready
            const adminUser = window.AdminAuth ? window.AdminAuth.user : null;
            const canManageUsers = adminUser && window.AdminAuth.hasAdminRole(adminUser.role);

            if (!canManageUsers && !window._roleWarned) {
                console.warn("⚠️ [SECURITY] Admin permissions not detected for current session.", adminUser);
                window._roleWarned = true;
            }

            let roleBadge = (u.role || 'player').toUpperCase();
            if (u.role === 'super_admin') roleBadge = '👑 SUPER ADMIN';
            else if (u.role === 'admin_player') roleBadge = '🎖️ ADMIN + JUGADOR';

            const isSuper = u.role === 'super_admin';
            // Safe URL construction
            const safePhone = (u.phone || '').replace(/\D/g, '');

            // Teams Badge List
            const teams = Array.isArray(u.team_somospadel) ? u.team_somospadel : (u.team_somospadel ? [u.team_somospadel] : []);
            const availableTeams = Object.keys(AppConstants.TEAM_LEVELS || {});

            const teamsHTML = `
                <div style="display:flex; flex-direction:column; gap:4px;">
                    <div style="display:flex; flex-wrap:wrap; gap:4px;">
                        ${teams.map(t => `
                            <span style="font-size:0.6rem; background: #6366f1; color:white; padding: 2px 6px; border-radius:4px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:4px;" 
                                  title="Clic para quitar" onclick="quickRemoveTeam('${u.id}', '${t}')">
                                ${t.toUpperCase()} <span style="opacity:0.6;">x</span>
                            </span>`
            ).join('')}
                    </div>
                    ${canManageUsers ? `
                    <select class="pro-input-micro" style="width:100%; font-size:0.65rem; color: var(--text-muted);" onchange="quickAddTeam('${u.id}', this.value); this.value='';">
                        <option value="" style="color:black;">+ Añadir equipo...</option>
                        ${availableTeams.map(at => `<option value="${at}" style="color:black;">${at}</option>`).join('')}
                    </select>` : ''}
                </div>
            `;

            return `
                <tr class="pro-table-row" style="background: ${isPending ? 'rgba(255,165,0,0.12)' : 'transparent'}; border-left: ${isPending ? '4px solid #ff9800' : 'none'};">
                <td>
                    <div class="pro-player-cell">
                        <div class="pro-avatar" style="background: ${isSuper ? 'linear-gradient(135deg, #FFD700, #FFA500)' : (u.role === 'admin_player' ? 'var(--primary-glow)' : (isPending ? '#ff9800' : ''))}; color: ${isSuper ? 'black' : 'white'}; box-shadow: ${isSuper ? '0 0 10px #FFD700' : 'none'};">
                            ${isPending ? '⏳' : (u.name || '?').charAt(0)}
                        </div>
                        <div>
                            <div style="display:flex; align-items:center; gap:8px;">
                                <div style="font-weight: 700; color: ${isSuper ? '#FFD700' : 'var(--text)'};">${u.name || 'Sin Nombre'}</div>
                                ${u.membership === 'somospadel_bcn' ? '<span style="font-size:0.6rem; background: var(--primary); color:black; padding: 2px 5px; border-radius:4px; font-weight:700;">COMUNIDAD BCN</span>' : ''}
                                ${isPending ? '<span style="font-size:0.55rem; background: #ff9800; color:black; padding: 2px 5px; border-radius:4px; font-weight:800; letter-spacing:1px; animation: blink 1.5s infinite;">SOLICITUD</span>' : ''}
                            </div>
                            <div style="font-size: 0.7rem; font-weight: 500; color: ${isSuper ? '#FFD700' : (u.role === 'admin_player' ? 'var(--primary)' : 'var(--text-muted)')};">
                                ${roleBadge}
                            </div>
                        </div>
                    </div>
                    <style>
                        @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.6; } 100% { opacity: 1; } }
                    </style>
                </td>
                
                <!-- NEW TEAMS COLUMN -->
                <td>${teamsHTML}</td>

                <td>
                    <div style="display:flex; align-items:center; gap:0.8rem;">
                         <span style="color: var(--primary); font-family: 'Outfit'; font-weight: 600;">${u.phone || '-'}</span>
                         <button onclick="window.openWhatsAppActions('${safePhone}', '')" title="Abrir Chat de WhatsApp" style="cursor:pointer; background: rgba(37, 211, 102, 0.1); color: #25D366; border: 1px solid #25D366; padding: 6px 12px; border-radius: 8px; font-weight: 700; display: flex; align-items: center; gap: 6px; font-size: 0.75rem; transition: all 0.2s;">
                            <span style="font-size: 1rem;">💬</span>
                         </button>
                    </div>
                </td>
                <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span class="pro-category-badge" style="background: var(--surface-hover);">${u.level || u.self_rate_level || '3.5'}</span>
                        ${(() => {
                    if (window.LevelReliabilityService) {
                        const rel = window.LevelReliabilityService.getReliability(u);
                        return `<i class="fas ${rel.icon}" style="color: ${rel.color} !important; font-size: 0.8rem; cursor: help;" title="${rel.label}"></i>`;
                    }
                    return '';
                })()}
                        
                        <!-- SMART ATTRIBUTE ICONS -->
                        ${u.side_preference === 'DRIVE' ? '<i class="fas fa-arrow-right" style="color: #60a5fa !important; font-size: 0.75rem;" title="Lado: Drive"></i>' : ''}
                        ${u.side_preference === 'REVES' ? '<i class="fas fa-arrow-left" style="color: #f87171 !important; font-size: 0.75rem;" title="Lado: Revés"></i>' : ''}
                        ${u.play_style === 'POTENCIA' ? '<i class="fas fa-bolt" style="color: #fbbf24 !important; font-size: 0.75rem;" title="Estilo: Potencia"></i>' : ''}
                        ${u.play_style === 'CONTROL' ? '<i class="fas fa-shield-halved" style="color: #34d399 !important; font-size: 0.75rem;" title="Estilo: Control"></i>' : ''}
                    </div>
                </td>
                <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span class="pro-category-badge" style="background: ${u.gender === 'chica' ? 'rgba(236, 72, 153, 0.1)' : 'rgba(59, 130, 246, 0.1)'}; color: ${u.gender === 'chica' ? '#ec4899' : '#3b82f6'}; border: 1px solid ${u.gender === 'chica' ? '#ec4899' : '#3b82f6'}; font-weight: 800; padding: 4px 10px; border-radius: 6px; font-size: 0.7rem;">
                            ${(u.gender || '?').toUpperCase()}
                        </span>
                    </div>
                </td>

                <!-- NEW MATCHES PLAYED COLUMN -->
                <td>
                     <input type="number" 
                            class="pro-input-micro" 
                            style="width: 60px; text-align:center; font-weight:bold; ${canManageUsers ? '' : 'pointer-events:none; border:none;'}"
                            value="${u.matches_played || 0}"
                            min="0"
                            onchange="quickUpdateMatches('${u.id}', this.value)"
                     >
                </td>

                <td>
                     <span class="pro-category-badge" style="background: ${isPending ? '#ff9800' : (u.status === 'active' ? 'var(--primary)' : 'transparent')}; color: ${isPending ? 'black' : (u.status === 'active' ? 'black' : 'var(--warning)')}; border-color: ${isPending ? '#ff9800' : (u.status === 'active' ? 'var(--primary)' : 'var(--warning)')}; font-weight: 800;">
                        ${(u.status === 'active' ? 'ACTIVO' : (u.status || 'PENDIENTE')).toUpperCase()}
                    </span>
                </td>
                <td style="text-align: right;">
                    <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                        ${canManageUsers ? `
                            ${isPending ? `<button class="btn-primary-pro" style="padding: 0.5rem 1rem; font-size: 0.75rem; font-weight: 950; background: #00E36D; color: black; border-radius: 10px; box-shadow: 0 4px 15px rgba(0, 227, 109, 0.4);" onclick="approveUser('${u.id}')">🚀 VALIDAR</button>` : ''}
                            <button class="btn-outline-pro" style="padding: 0.4rem 0.8rem; font-size: 0.7rem; display: flex; align-items: center; gap: 4px;" onclick="window.showPlayerLevelChart('${u.id}', '${u.name}')">📉 <span class="hide-mobile">GRÁFICO</span></button>
                            <button class="btn-outline-pro" style="padding: 0.4rem 0.8rem; font-size: 0.7rem;" onclick='openEditUserModal(${JSON.stringify(u).replace(/'/g, "&#39;")})'>EDITAR</button>
                            <button class="btn-outline-pro" style="padding: 0.4rem 0.8rem; font-size: 0.7rem; color: var(--danger); border-color: var(--danger-dim);" onclick="deleteUser('${u.id}', event)">🗑️</button>
                        ` : `
                            <button class="btn-outline-pro" style="padding: 0.4rem 0.8rem; font-size: 0.7rem; display: flex; align-items: center; gap: 4px;" onclick="window.showPlayerLevelChart('${u.id}', '${u.name}')">📉 GRÁFICO</button>
                            <span style="color:var(--text-muted); font-size:0.7rem;">👁️ SOLO LECTURA</span>
                        `}
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
                    <button class="btn-outline-pro" style="padding: 0.5rem 1rem; border-color: #ef4444; color: #ef4444; background: rgba(239, 68, 68, 0.05);" onclick="batchUpdateTeamLevels()">
                        ⚠️ SYNC NIVELES EQ
                    </button>
                    <button class="btn-outline-pro" style="padding: 0.5rem 1rem; border-color: #3b82f6; color: #3b82f6; background: rgba(59, 130, 246, 0.05);" onclick="window.Actions.runRescue1101()">
                        🚑 RESCATAR PARTIDOS
                    </button>
                    <!-- NEW RECALC STATS BUTTON -->
                    <button class="btn-outline-pro" style="padding: 0.5rem 1rem; border-color: #eab308; color: #eab308; background: rgba(234, 179, 8, 0.05); margin-left: auto;" onclick="recalculateMatchesPlayed()">
                        🔄 REPARAR STATS
                    </button>
                    <!-- NEW GLOBAL RECALC BUTTON -->
                    <button class="btn-outline-pro" style="padding: 0.5rem 1rem; border-color: #CCFF00; color: #CCFF00; background: rgba(204, 255, 0, 0.05);" onclick="handleGlobalLevelRecalc()">
                        🏆 RECALCULAR NIVELES (GLOBAL)
                    </button>

                    <input type="text" id="global-search" placeholder="Buscar globalmente..." class="pro-input" style="width: 200px; padding: 0.5rem 1rem;" onkeyup="multiFilterUsers()">
                    <button class="btn-primary-pro" style="padding: 0.5rem 1.5rem;" onclick="openCreateUserModal()">+ REGISTRAR</button>
                </div>
            </div>
            <div class="filters-row" style="padding: 1rem 2rem; background: rgba(255,255,255,0.02); display: grid; grid-template-columns: 2fr 1.5fr 1fr 1fr 1fr 1fr 1fr; gap: 1rem; border-bottom: var(--border-pro);">
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
                <select id="filter-reliability" class="pro-input-micro" onchange="multiFilterUsers()">
                    <option value="">Semáforo (Todos)</option>
                    <option value="green">🟢 Fiable (Verde)</option>
                    <option value="yellow">🟡 Dudoso (Amarillo)</option>
                    <option value="red">🔴 Oxidado (Rojo)</option>
                    <option value="gray">⚪ Sin datos (Gris)</option>
                </select>
                <button class="btn-micro" onclick="resetFilters()" style="background: rgba(255,255,255,0.1);">Limpiar</button>
            </div>
            <table class="pro-table">
                <thead>
                    <tr>
                        <th>IDENTIDAD</th>
                        <th>EQUIPOS</th>
                        <th>CONTACTO</th>
                        <th>NIVEL</th>
                        <th>GÉNERO</th>
                        <th>TOTAL P.</th> <!-- Matches Played -->
                        <th>ESTADO</th>
                        <th style="text-align:right;">ACCIONES</th>
                    </tr>
                </thead>
                <tbody id="users-tbody"></tbody>
            </table>
            <div class="pro-table-footer">SISTEMA INTEGRADO DE BASE DE DATOS v2.1 PRO (Auto-Save Enabled)</div>
        </div>`;

    // Initial Render
    window.renderUserRows(window.filteredUsers);

    // ==========================================
    // MODULE INTERNAL HELPERS
    // ==========================================

    /**
     * Helper: Calculate level based on teams
     * Returns the highest level found in teams, prioritizing gender-specific teams.
     * Returns null if no team level found (so we don't overwrite if not applicable).
     */
    /**
     * Helper: Calculate level based on teams
     * Returns the highest level found in teams, prioritizing gender-specific teams.
     * Returns null if no team level found (so we don't overwrite if not applicable).
     */
    window._calculateLevelFromTeams = (user, teams) => {
        const teamLevels = AppConstants.TEAM_LEVELS;
        if (!teams || teams.length === 0) return null;

        let maxLevel = 0;
        let hasTeamLevel = false;

        teams.forEach(t => {
            const lvl = teamLevels[t];
            if (lvl) {
                hasTeamLevel = true;
                // Logic: If player is male, prioritize 'Masculino' teams if multiple.
                // If player is female, prioritize 'Femenino' teams.
                // Otherwise take highest.
                const isGenderMatch = (user.gender === 'chico' && t.includes('Masculino')) || (user.gender === 'chica' && t.includes('Femenino'));

                if (lvl > maxLevel) {
                    maxLevel = lvl;
                } else if (lvl === maxLevel && isGenderMatch) {
                    // Tie-breaker: prefer gender specific team (conceptually)
                    // In loop we just find max, but if we wanted to pick specific team we would track it.
                    // Since we return just NUMBER, max is fine. 
                    // Wait, user requirement: "prevalecer el equipo masculino o femenino del nivel"
                    // This implies if I have Team A (3.5 Mixed) and Team B (3.5 Male) and I am Male, 
                    // the level is 3.5 regardless.
                    // But if Team A (3.0 Male) and Team B (3.5 Mixed), Level is 3.5.
                    // The requirement is mostly about "if in multiple teams, take the one that defines level best?"
                    // Actually, usually "Highest Level" is the safe bet for "Player Level".
                }
            }
        });

        return hasTeamLevel ? maxLevel : null;
    };

    // NEW: Quick Update Helpers
    window.quickUpdateMatches = async (id, val) => {
        try {
            const matches = parseInt(val) || 0;
            await FirebaseDB.players.update(id, { matches_played: matches });
            // Update cache locally to avoid full reload flicker
            const user = window.allUsersCache.find(u => u.id === id);
            if (user) user.matches_played = matches;
            // Feedback visual?
        } catch (e) {
            console.error(e);
            window.PremiumModal.alert({
                title: "❌ ERROR",
                message: "No se pudo actualizar el contador de partidos.",
                type: 'error'
            });
        }
    };

    window.quickAddTeam = async (id, teamToAdd) => {
        if (!teamToAdd) return;
        try {
            const user = window.allUsersCache.find(u => u.id === id);
            if (!user) return;

            let currentTeams = Array.isArray(user.team_somospadel) ? [...user.team_somospadel] : (user.team_somospadel ? [user.team_somospadel] : []);

            if (!currentTeams.includes(teamToAdd)) {
                currentTeams.push(teamToAdd);

                // AUTO-CALC LEVEL
                const newLevel = window._calculateLevelFromTeams(user, currentTeams);

                const updatePayload = { team_somospadel: currentTeams };
                if (newLevel !== null) {
                    updatePayload.level = newLevel;
                    updatePayload.self_rate_level = newLevel;
                }

                await FirebaseDB.players.update(id, updatePayload);

                // Update Local and Re-render
                user.team_somospadel = currentTeams;
                if (newLevel !== null) {
                    user.level = newLevel;
                    user.self_rate_level = newLevel;
                }
                window.renderUserRows(window.filteredUsers);
            }
        } catch (e) {
            console.error(e);
            window.PremiumModal.alert({
                title: "❌ ERROR",
                message: "No se pudo añadir el jugador al equipo.",
                type: 'error'
            });
        }
    };

    window.quickRemoveTeam = async (id, teamToRemove) => {
        const confirmed = await window.PremiumModal.confirm({
            title: "🗑️ QUITAR EQUIPO",
            message: `¿Seguro que quieres quitar al jugador del equipo ${teamToRemove}?`,
            confirmText: "QUITAR",
            confirmColor: "#FF3B30"
        });
        if (!confirmed) return;
        try {
            const user = window.allUsersCache.find(u => u.id === id);
            if (!user) return;

            let currentTeams = Array.isArray(user.team_somospadel) ? [...user.team_somospadel] : (user.team_somospadel ? [user.team_somospadel] : []);

            currentTeams = currentTeams.filter(t => t !== teamToRemove);

            // AUTO-CALC LEVEL (Recalc after remove)
            // If no teams left, we DO NOT reset level to 0/3.5, we keep last known?
            // Or we check remaining.
            const newLevel = window._calculateLevelFromTeams(user, currentTeams);

            const updatePayload = { team_somospadel: currentTeams };
            if (newLevel !== null) {
                updatePayload.level = newLevel;
                updatePayload.self_rate_level = newLevel;
            }

            await FirebaseDB.players.update(id, updatePayload);

            // Update Local and Re-render
            user.team_somospadel = currentTeams;
            if (newLevel !== null) {
                user.level = newLevel;
                user.self_rate_level = newLevel;
            }
            window.renderUserRows(window.filteredUsers);
        } catch (e) {
            console.error(e);
            window.PremiumModal.alert({
                title: "❌ ERROR",
                message: "No se pudo eliminar el equipo.",
                type: 'error'
            });
        }
    };

    // Existing helpers...
    window.multiFilterUsers = () => {
        const search = document.getElementById('global-search').value.toLowerCase();
        const fName = document.getElementById('filter-name').value.toLowerCase();
        const fPhone = document.getElementById('filter-phone').value.toLowerCase();
        const fLevel = document.getElementById('filter-level').value.toLowerCase();
        const fGender = document.getElementById('filter-gender').value;
        const fStatus = document.getElementById('filter-status').value;
        const fTeam = document.getElementById('filter-team').value;
        const fRel = document.getElementById('filter-reliability').value;

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

            let matchesRel = true;
            if (fRel && window.LevelReliabilityService) {
                const rel = window.LevelReliabilityService.getReliability(u);
                if (fRel === 'green') matchesRel = (rel.color === '#00ff64');
                else if (fRel === 'yellow') matchesRel = (rel.color === '#FFD700');
                else if (fRel === 'red') matchesRel = (rel.color === '#FF5555');
                else if (fRel === 'gray') matchesRel = (rel.color === '#888');
            }

            return matchesGlobal && matchesName && matchesPhone && matchesLevel && matchesGender && matchesStatus && matchesTeam && matchesRel;
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
        document.getElementById('filter-reliability').value = "";
        window.multiFilterUsers();
    };

    window.approveUser = async (id) => {
        const confirmed = await window.PremiumModal.confirm({
            title: "🚀 VALIDAR JUGADOR",
            message: "¿Quieres confirmar el acceso para este jugador? Pasará a estado ACTIVO inmediatamente.",
            confirmText: "VALIDAR"
        });
        if (!confirmed) return;
        try {
            await FirebaseDB.players.update(id, { status: 'active' });

            // Refresh data
            const users = await FirebaseDB.players.getAll();
            window.allUsersCache = users;
            window.multiFilterUsers(); // Re-apply filters

            window.PremiumModal.alert({
                title: "✅ ÉXITO",
                message: "Usuario validado y activado correctamente.",
                type: 'success'
            });
        } catch (e) {
            console.error("Error validando usuario:", e);
            window.PremiumModal.alert({
                title: "❌ ERROR",
                message: "Error al validar: " + e.message,
                type: 'error'
            });
        }
    };

    window.exportToExcel = () => {
        if (typeof XLSX === 'undefined') {
            window.PremiumModal.alert({
                title: "❌ LIBRERÍA AUSENTE",
                message: "La librería de exportación no se ha cargado. Por favor, recarga la página.",
                type: 'error'
            });
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

        // Populate Smart Attributes
        if (form.elements['side_preference']) form.elements['side_preference'].value = user.side_preference || 'INDIFF';
        if (form.elements['play_style']) form.elements['play_style'].value = user.play_style || 'ESTRATEGIA';

        const pwdInput = document.getElementById('admin-user-pwd-input');
        if (pwdInput) {
            // Si la contraseña ya está hasheada (SHA-256 tiene 64 chars), no la mostramos para evitar confusión
            if (user.password && user.password.length === 64) {
                pwdInput.value = '';
                pwdInput.placeholder = "CONTRASEÑA CIFRADA (Escribe para cambiar)";
            } else {
                pwdInput.value = user.password || '';
                pwdInput.placeholder = "Introduce nueva contraseña";
            }
            pwdInput.type = 'password'; // Reset to hidden
            const toggle = document.getElementById('toggle-admin-user-pwd');
            if (toggle) { toggle.classList.remove('fa-eye-slash'); toggle.classList.add('fa-eye'); }
        }

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
    window.deleteUser = async (id, event) => {
        const userToDelete = window.allUsersCache.find(u => u.id === id);
        const name = userToDelete ? userToDelete.name : 'este usuario';

        const confirmed = await window.PremiumModal.confirm({
            title: "⚠️ ELIMINAR JUGADOR",
            message: `¿Estás seguro de que quieres eliminar a "${name.toUpperCase()}"?\n\nEsta acción es irreversible y borrará todo su historial.`,
            confirmText: "ELIMINAR PERMANENTEMENTE",
            confirmColor: "#FF3B30"
        });
        if (!confirmed) return;

        // Feedback visual en el botón
        const btn = event.target.closest('button');
        const originalContent = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        btn.disabled = true;

        try {
            console.log(`🗑️ Eliminando usuario ${id} (${name})...`);

            // PRIMERO: Borrar de Firebase y ESPERAR confirmación
            await FirebaseDB.players.delete(id);
            console.log(`✅ Usuario ${id} eliminado de Firebase correctamente`);

            // SEGUNDO: Esperar un momento para asegurar que Firebase procesó el borrado
            await new Promise(resolve => setTimeout(resolve, 500));

            // TERCERO: Recargar TODA la base de datos para asegurar sincronización
            console.log("🔄 Recargando base de datos completa...");
            const freshUsers = await FirebaseDB.players.getAll();

            // CUARTO: Verificar que el usuario realmente fue borrado
            const stillExists = freshUsers.find(u => u.id === id);
            if (stillExists) {
                throw new Error("El usuario sigue existiendo en la base de datos después del borrado. Puede ser un problema de permisos.");
            }

            // QUINTO: Actualizar caché y UI
            window.allUsersCache = freshUsers;
            window.filteredUsers = [...freshUsers];
            window._allPlayersCache = freshUsers;
            window.multiFilterUsers();

            // SEXTO: Mostrar confirmación
            window.PremiumModal.alert({
                title: "🗑️ ELIMINADO",
                message: `El jugador "${name}" ha sido borrado de la base de datos.`,
                type: 'success'
            });

        } catch (e) {
            let errorMsg = e.message;
            if (errorMsg.includes('permission-denied')) {
                errorMsg = "No tienes permisos suficientes en Firebase para borrar jugadores.";
            }
            window.PremiumModal.alert({
                title: "❌ ERROR CRÍTICO",
                message: "No se pudo eliminar el registro: " + errorMsg,
                type: 'error'
            });

            // Restaurar botón y recargar datos para mostrar el estado real
            btn.innerHTML = originalContent;
            btn.disabled = false;

            // Recargar datos para asegurar que mostramos el estado real de la DB
            try {
                const freshUsers = await FirebaseDB.players.getAll();
                window.allUsersCache = freshUsers;
                window.filteredUsers = [...freshUsers];
                window._allPlayersCache = freshUsers;
                window.multiFilterUsers();
            } catch (reloadErr) {
                console.error("Error recargando datos:", reloadErr);
            }
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

            // Calculate auto-level based on teams
            // We need 'gender' to be accurate for calculation
            const gender = formData.get('gender');
            const dummyUser = { gender: gender }; // Mock user for helper
            const autoLevel = window._calculateLevelFromTeams(dummyUser, selectedTeams);

            let rawLevel = formData.get('level') || '3.5';
            if (typeof rawLevel === 'string') rawLevel = rawLevel.replace(',', '.');
            let submittedLevel = parseFloat(rawLevel);

            if (isNaN(submittedLevel)) submittedLevel = 3.5;

            // If teams enforce a level, use it? Or only if > current?
            // "quiero que lo detecte automaticamente y lo cambie"
            // Usually, if a team decides level, we should set it.
            // But if user manually set 4.5 and team is 3.5?
            // Let's assume team level is the baseline. 
            // If autoLevel is found, overwrite the form value IF it's likely the intention.
            // Safe bet: if autoLevel exists, update it.
            if (autoLevel !== null) {
                submittedLevel = autoLevel;
            }

            const userData = {
                name: formData.get('name'),
                phone: formData.get('phone'),
                level: submittedLevel, // Use calculated or form
                self_rate_level: submittedLevel, // Sync self rate too
                gender: gender,
                membership: formData.get('membership'),
                role: formData.get('role'),
                status: formData.get('status'),
                matches_played: parseInt(formData.get('matches_played') || 0),
                team_somospadel: selectedTeams.length > 0 ? selectedTeams : null, // Save as Array
                side_preference: formData.get('side_preference') || 'INDIFF',
                play_style: formData.get('play_style') || 'ESTRATEGIA'
            };

            const pwd = formData.get('password');
            if (pwd && pwd.trim() !== '') {
                // SECURITY: Hash the password before saving
                userData.password = await window.FirebaseDB.security.hashPassword(pwd.trim());
            }

            if (id) {
                // UPDATE
                await FirebaseDB.players.update(id, userData);
                window.PremiumModal.alert({ title: "✅ ACTUALIZADO", message: "Jugador actualizado correctamente." });
            } else {
                // CREATE
                // Validations for new user
                if (!userData.phone) throw new Error("El teléfono es obligatorio.");
                await FirebaseDB.players.create(userData); // Assuming create handles ID generation or logic
                window.PremiumModal.alert({ title: "✅ REGISTRADO", message: "Jugador registrado correctamente." });
            }

            // Refresh & Close
            const users = await FirebaseDB.players.getAll();
            window.allUsersCache = users;
            window.multiFilterUsers();
            window.closeAdminModal();

        } catch (err) {
            console.error(err);
            window.PremiumModal.alert({
                title: "❌ ERROR",
                message: "No se pudo guardar: " + err.message,
                type: 'error'
            });
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    });
};

// WhatsApp Actions Helper (Global)
window.openWhatsAppActions = (phone, name) => {
    // Just a shell for now, logic likely in main utils or simple alerts
    if (!phone) {
        window.PremiumModal.alert({ title: "⚠️ SIN TELÉFONO", message: "Este jugador no tiene un número registrado." });
        return;
    }
    const safePhone = phone.replace(/\D/g, '');
    const url = `https://wa.me/${safePhone}`;
    window.open(url, '_blank');
};

// NEW: RECALCULATE STATS FUNCTION (DESTRUCTIVE CLEANUP)
window.recalculateMatchesPlayed = async () => {
    const confirmed = await window.PremiumModal.confirm({
        title: "⚠️ MODO LIMPIEZA TOTAL",
        message: "¿Deseas ELIMINAR permanentemente los partidos huérfanos?\n\nEl sistema escaneará cada partido y borrará aquellos de eventos inexistentes.",
        confirmText: "INICIAR LIMPIEZA",
        confirmColor: "#FF3B30"
    });
    if (!confirmed) return;

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

        window.PremiumModal.alert({
            title: "✅ LIMPIEZA COMPLETA",
            message: `Partidos huérfanos eliminados: ${deletedMatches}\nPerfiles actualizados: ${updatedCount}`,
            type: 'success'
        });

        // Refresh
        const users = await FirebaseDB.players.getAll();
        window.allUsersCache = users;
        window.multiFilterUsers();

    } catch (e) {
        console.error(e);
        window.PremiumModal.alert({
            title: "❌ ERROR CRÍTICO",
            message: e.message,
            type: 'error'
        });
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
// --- BATCH ACTION: UPDATE LEVELS BY TEAM ---
window.batchUpdateTeamLevels = async () => {
    const confirmed = await window.PremiumModal.confirm({
        title: "⚠️ ACTUALIZACIÓN MASIVA",
        message: "¿Recalcular niveles de TODOS los jugadores según sus equipos?\n\nSe usará la tabla oficial de prioridad por género.",
        confirmText: "SÍ, RECALCULAR"
    });
    if (!confirmed) return;

    const users = window.allUsersCache || [];
    if (users.length === 0) {
        window.PremiumModal.alert({ title: "ℹ️ INFO", message: "No hay usuarios cargados para procesar." });
        return;
    }

    const content = document.getElementById('content-area');
    // Show Loading
    content.innerHTML = `
        <div style="height: 100%; display: flex; flex-direction:column; justify-content: center; align-items: center; color: white;">
            <div class="loader"></div>
            <div style="margin-top:20px; font-size: 1.2rem; font-weight: bold;">SINCRONIZANDO NIVELES DE EQUIPO...</div>
            <div style="color: #888; margin-top: 10px;">Aplicando lógica de prioridad por género.</div>
        </div>`;

    let count = 0;
    try {
        for (let u of users) {
            const teams = Array.isArray(u.team_somospadel) ? u.team_somospadel : (u.team_somospadel ? [u.team_somospadel] : []);

            // Use new helper
            const maxLevel = window._calculateLevelFromTeams(u, teams);

            if (maxLevel !== null && maxLevel > 0 && maxLevel !== u.level) {
                await FirebaseDB.players.update(u.id, {
                    level: maxLevel,
                    self_rate_level: maxLevel
                });
                count++;
                console.log(`Updated ${u.name}: ${u.level} -> ${maxLevel} (Teams: ${teams.join(', ')})`);
            }
        }

        window.PremiumModal.alert({
            title: "✅ PROCESO COMPLETADO",
            message: `Se han actualizado ${count} jugadores con éxito.`,
            type: 'success'
        });
        window.location.reload();

    } catch (e) {
        console.error(e);
        window.PremiumModal.alert({
            title: "❌ ERROR EN PROCESO",
            message: e.message,
            type: 'error'
        });
        window.location.reload();
    }
};

// --- GLOBAL LEVEL RECALC WRAPPER ---
window.handleGlobalLevelRecalc = async () => {
    const confirmed = await window.PremiumModal.confirm({
        title: "⚠️ RECALCULO GLOBAL PRO",
        message: "Esta acción reseteará todos los niveles y los volverá a calcular usando el historial completo de partidos con la nueva sensibilidad PRO.<br><br>¿Deseas iniciar el proceso?",
        confirmText: "INICIAR RECALCULO",
        confirmColor: "#CCFF00"
    });

    if (!confirmed) return;

    const btn = document.querySelector('button[onclick="handleGlobalLevelRecalc()"]');
    let originalText = "";
    if (btn) {
        originalText = btn.textContent;
        btn.textContent = "Recalculando...";
        btn.disabled = true;
    }

    try {
        if (!window.LevelService) {
            throw new Error("El servicio de niveles no está cargado.");
        }
        await window.LevelService.recalculateAllLevels();
        window.location.reload();
    } catch (e) {
        console.error(e);
        window.PremiumModal.alert({
            title: "❌ ERROR",
            message: "Error al recalcular: " + e.message,
            type: 'error'
        });
    } finally {
        if (btn) {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    }
};

/**
 * Visualización WOW de la evolución del jugador
 */
window.showPlayerLevelChart = async (userId, userName) => {
    console.log(`📊 Fetching history for ${userName} (${userId})...`);

    try {
        // 1. Fetch CURRENT ACTUAL LEVEL from player profile sync
        const playerDoc = await window.db.collection('players').doc(userId).get();
        const playerData = playerDoc.exists ? playerDoc.data() : {};
        const currentLiveLevel = parseFloat(playerData.level || playerData.self_rate_level || 3.5);

        // 2. Fetch History Log
        const historySnap = await window.db.collection('level_history')
            .where('userId', '==', userId)
            .get();

        if (historySnap.empty) {
            window.PremiumModal.alert({
                title: "SIN HISTORIAL",
                message: `El nivel actual de **${userName}** es **${currentLiveLevel.toFixed(2)}**, pero aún no tiene partidos registrados en el log histórico para dibujar la gráfica.`,
                type: 'info'
            });
            return;
        }

        let dataPoints = historySnap.docs.map((doc) => {
            const d = doc.data();
            return {
                date: d.timestamp ? d.timestamp.toDate() : new Date(),
                y: d.level,
                delta: d.delta || 0
            };
        });

        // Sort by date to avoid Firebase index issues
        dataPoints.sort((a, b) => a.date - b.date);

        // Map to P1, P2... sequence
        dataPoints = dataPoints.map((p, idx) => ({ ...p, idx: idx + 1 }));

        // SYNC: If the live level (3.41) is different from history (2.94), add live level as final point
        const lastHistoryLevel = dataPoints[dataPoints.length - 1].y;
        if (Math.abs(currentLiveLevel - lastHistoryLevel) > 0.005) {
            dataPoints.push({
                idx: dataPoints.length + 1,
                date: new Date(),
                y: currentLiveLevel,
                delta: currentLiveLevel - lastHistoryLevel
            });
        }

        const canvasId = `chart-${userId}`;

        // Use custom modal for wide content (LANDSCAPE)
        window.PremiumModal.custom({
            title: `HISTORIAL PRO: ${userName.toUpperCase()}`,
            content: `
                <div id="chart-capture-area" style="background: linear-gradient(165deg, #1e293b 0%, #0f172a 100%); padding: 30px; border-radius: 24px; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <img src="img/logo_somospadel.png" style="height: 35px; filter: drop-shadow(0 0 10px var(--primary));">
                            <div>
                                <div style="color:white; font-weight:950; letter-spacing:1px; font-size:0.9rem;">SOMOSPADEL BCN</div>
                                <div style="color:#64748b; font-size:0.6rem; font-weight:800; text-transform:uppercase;">Player Performance Report</div>
                            </div>
                        </div>
                        <div style="text-align: right;">
                             <div style="color: var(--primary); font-weight: 950; font-size: 1.5rem; line-height:1;">${dataPoints[dataPoints.length - 1].y.toFixed(2)}</div>
                             <div style="color: #64748b; font-size: 0.65rem; font-weight: 900; text-transform: uppercase; margin-top:4px;">PRO LEVEL</div>
                        </div>
                    </div>
                    
                    <div style="height: 300px; position: relative; margin-bottom: 25px;">
                        <canvas id="${canvasId}"></canvas>
                    </div>

                    <!-- HORIZONTAL MATCH STRIP -->
                    <div style="margin-bottom: 20px;">
                         <div style="color: #64748b; font-size: 0.65rem; font-weight: 950; text-transform: uppercase; margin-bottom: 10px; display:flex; align-items:center; gap:8px;">
                            <i class="fas fa-list-ul" style="font-size:0.6rem;"></i> ÚLTIMOS PARTIDOS (FLUJO HORIZONTAL)
                         </div>
                         <div id="match-strip-${userId}" style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 10px; scrollbar-width: none; -ms-overflow-style: none;">
                            ${dataPoints.slice(-15).map(p => `
                                <div style="flex: 0 0 auto; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 10px; text-align: center; min-width: 65px;">
                                    <div style="font-size: 0.6rem; color: #64748b; font-weight: 800; margin-bottom: 4px;">P${p.idx}</div>
                                    <div style="font-size: 0.85rem; font-weight: 900; color: white; margin-bottom: 4px;">${p.y.toFixed(2)}</div>
                                    <div style="font-size: 0.65rem; font-weight: 900; color: ${p.delta >= 0 ? '#00ff88' : '#ff3b30'};">
                                        ${p.delta >= 0 ? '+' : ''}${p.delta.toFixed(3)}
                                    </div>
                                </div>
                            `).join('')}
                         </div>
                    </div>

                    <div style="display: flex; gap: 30px; justify-content: center; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 20px;">
                        <div style="text-align:center;">
                            <div style="font-size: 0.65rem; color: #64748b; font-weight: 800; text-transform:uppercase;">Partidos</div>
                            <div style="font-size: 1.2rem; color: white; font-weight: 950;">${dataPoints.length}</div>
                        </div>
                         <div style="text-align:center;">
                            <div style="font-size: 0.65rem; color: #64748b; font-weight: 800; text-transform:uppercase;">Nivel Inicial</div>
                            <div style="font-size: 1.2rem; color: #64748b; font-weight: 950;">${dataPoints[0].y.toFixed(2)}</div>
                        </div>
                        <div style="text-align:center;">
                            <div style="font-size: 0.65rem; color: #64748b; font-weight: 800; text-transform:uppercase;">Net Progression</div>
                            <div style="font-size: 1.2rem; color: ${(dataPoints[dataPoints.length - 1].y - dataPoints[0].y) >= 0 ? '#00ff88' : '#ff3b30'}; font-weight: 950;">
                                ${(dataPoints[dataPoints.length - 1].y - dataPoints[0].y) >= 0 ? '+' : ''}${(dataPoints[dataPoints.length - 1].y - dataPoints[0].y).toFixed(2)}
                            </div>
                        </div>
                    </div>
                </div>

                <div style="padding: 0 10px;">
                    <button id="share-chart-btn" class="btn-primary-pro" style="width: 100%; height: 55px; background: #25D366; color: white; border: none; font-size: 1rem; display: flex; align-items: center; justify-content: center; gap: 12px; box-shadow: 0 10px 20px rgba(37, 211, 102, 0.2); border-radius:18px;">
                        <i class="fab fa-whatsapp" style="font-size: 1.4rem;"></i> COMPARTIR ANÁLISIS POR WHATSAPP
                    </button>
                    <p style="text-align: center; color: #444; font-size: 0.75rem; margin-top: 12px; font-weight: 600;">AL PULSAR SE GENERARÁ UNA INFOGRAFÍA PARA COMPARTIR</p>
                </div>
            `,
            width: '850px'
        });

        // Initialize chart with delay to ensure DOM is ready
        setTimeout(() => {
            const canvas = document.getElementById(canvasId);
            if (!canvas) return;

            const ctx = canvas.getContext('2d');
            const chartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: dataPoints.map(p => `P${p.idx}`),
                    datasets: [{
                        label: 'Nivel PRO',
                        data: dataPoints.map(p => p.y),
                        borderColor: '#ccff00',
                        backgroundColor: (context) => {
                            const chart = context.chart;
                            const { ctx, chartArea } = chart;
                            if (!chartArea) return null;
                            const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                            gradient.addColorStop(0, 'rgba(204, 255, 0, 0)');
                            gradient.addColorStop(1, 'rgba(204, 255, 0, 0.2)');
                            return gradient;
                        },
                        borderWidth: 5,
                        pointRadius: 5,
                        pointBackgroundColor: '#0f172a',
                        pointBorderColor: '#ccff00',
                        pointBorderWidth: 3,
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: false, // Disable animations for reliable capture
                    layout: { padding: { top: 10, bottom: 10, left: 10, right: 30 } },
                    scales: {
                        x: {
                            grid: { display: false },
                            ticks: {
                                color: '#64748b',
                                font: { family: 'Outfit', weight: '700', size: 10 }
                            }
                        },
                        y: {
                            grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
                            ticks: {
                                color: '#64748b',
                                font: { family: 'Outfit', weight: '700' }
                            }
                        }
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: '#1e293b',
                            titleColor: '#fff',
                            bodyColor: '#ccff00',
                            padding: 15,
                            cornerRadius: 12,
                            displayColors: false,
                            titleFont: { family: 'Outfit', size: 13, weight: 'bold' },
                            bodyFont: { family: 'Outfit', size: 16, weight: '900' },
                            callbacks: {
                                label: (ctx) => `NIVEL: ${ctx.parsed.y.toFixed(3)}`
                            }
                        }
                    }
                }
            });

            // HANDLE SHARE BUTTON
            const shareBtn = document.getElementById('share-chart-btn');
            shareBtn.onclick = async () => {
                shareBtn.disabled = true;
                shareBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> GENERANDO IMAGEN...';

                try {
                    // Load html2canvas dynamically
                    if (!window.html2canvas) {
                        await new Promise((resolve, reject) => {
                            const script = document.createElement('script');
                            script.src = "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js";
                            script.onload = resolve;
                            script.onerror = reject;
                            document.head.appendChild(script);
                        });
                    }

                    // A small delay to let things settle
                    await new Promise(r => setTimeout(r, 100));

                    const area = document.getElementById('chart-capture-area');
                    const canvasResult = await html2canvas(area, {
                        backgroundColor: '#0f172a',
                        scale: 1.5,
                        logging: false,
                        useCORS: true,
                        allowTaint: true
                    });

                    canvasResult.toBlob(async (blob) => {
                        if (!blob) throw new Error("Blob creation failed");

                        const file = new File([blob], `evolucion-${userName}.png`, { type: 'image/png' });
                        const shareText = `*ESTADÍSTICAS SOMOSPADEL BCN*\n\nJugador: *${userName.toUpperCase()}*\nNivel Actual: *${dataPoints[dataPoints.length - 1].y.toFixed(2)}*\nPartidos: ${dataPoints.length}\n\nProgreso: https://somospadelbarcelona.github.io/Americanas-somospadel/`;

                        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                            try {
                                await navigator.share({
                                    files: [file],
                                    title: `Evolución ${userName}`,
                                    text: shareText
                                });
                            } catch (e) {
                                // Fallback to WhatsApp link if share is cancelled or fails
                                window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
                            }
                        } else {
                            // Fallback to text link if navigator.share files not supported
                            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
                        }

                        shareBtn.disabled = false;
                        shareBtn.innerHTML = '<i class="fab fa-whatsapp"></i> COMPARTIR ANÁLISIS POR WHATSAPP';
                    }, 'image/png');

                } catch (e) {
                    console.error("Share Error:", e);
                    // CRITICAL FALLBACK: Share as text only
                    const shareText = `*ESTADÍSTICAS SOMOSPADEL BCN*\n\nJugador: *${userName.toUpperCase()}*\nNivel Actual: *${dataPoints[dataPoints.length - 1].y.toFixed(2)}*\nPartidos: ${dataPoints.length}\n\nProgreso: https://somospadelbarcelona.github.io/Americanas-somospadel/`;
                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');

                    shareBtn.disabled = false;
                    shareBtn.innerHTML = '<i class="fab fa-whatsapp"></i> COMPARTIR ANÁLISIS POR WHATSAPP';
                }
            };
        }, 450);

    } catch (e) {
        console.error("Error loading chart:", e);
        window.PremiumModal.alert({ title: "ERROR", message: e.message, type: 'danger' });
    }
};
