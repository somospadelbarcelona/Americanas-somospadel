// Admin Dashboard Logic

const AdminAuth = {
    token: localStorage.getItem('adminToken'),
    user: JSON.parse(localStorage.getItem('adminUser') || 'null'),

    init() {
        if (this.user && this.user.role === 'admin') {
            document.getElementById('admin-auth-modal').classList.add('hidden');
            loadAdminView('users');
        } else {
            document.getElementById('admin-auth-modal').classList.remove('hidden');
        }
    },

    async login(phone, password) {
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, password })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || 'Error de acceso');
            }

            const user = await response.json();
            if (user.role !== 'admin') {
                throw new Error('ACCESO DENEGADO: No tienes privilegios de administrador.');
            }

            this.user = user;
            localStorage.setItem('adminUser', JSON.stringify(user));
            document.getElementById('admin-auth-modal').classList.add('hidden');
            loadAdminView('users');

        } catch (e) {
            document.getElementById('admin-login-error').textContent = e.message;
        }
    },

    logout() {
        this.user = null;
        localStorage.removeItem('adminUser');
        location.reload();
    }
};

// --- Views ---

async function loadAdminView(view) {
    const content = document.getElementById('content-area');
    const title = document.getElementById('page-title');

    // Update Sidebar Active State
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    // Simple active match based on onclick attribute text content for now or index
    // For simplicity, we just render content.

    if (view === 'users') {
        title.textContent = 'Base de Datos de Jugadores';
        content.innerHTML = '<div class="loader"></div>';

        try {
            const res = await fetch('/api/users');
            const users = await res.json();

            const rows = users.map(u => {
                const isPending = u.status === 'pending';
                return `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); background: ${isPending ? 'rgba(255, 165, 0, 0.05)' : 'transparent'};">
                    <td style="padding: 1rem;">
                        <div style="font-weight: 600; color: white;">${u.name}</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted);">ID: ${u.id}</div>
                    </td>
                    <td style="padding: 1rem; color: var(--primary); font-family: monospace;">${u.phone}</td>
                    <td style="padding: 1rem;">
                        <span style="background: #333; padding: 2px 6px; border-radius: 4px; font-size: 0.8rem;">${u.self_rate_level || 'N/A'}</span>
                    </td>
                    <td style="padding: 1rem;">
                         <span style="color: ${u.status === 'active' ? 'var(--success)' : 'var(--warning)'}; font-size: 0.8rem; text-transform: uppercase; font-weight: 700;">
                            ${u.status || 'active'}
                        </span>
                    </td>
                     <td style="padding: 1rem;">
                        ${isPending ?
                        `<button class="btn-primary" style="padding: 0.3rem 0.6rem; font-size: 0.75rem;" onclick="approveUser(${u.id})">✅ Validar</button>` :
                        `<div style="font-size: 0.8rem;">${u.matches_played} PJ</div>`
                    }
                    </td>
                </tr>
            `}).join('');

            content.innerHTML = `
                <div class="glass-panel">
                    <div style="margin-bottom: 1rem; display: flex; justify-content: space-between;">
                        <h3>Base de Datos</h3>
                        <button class="btn-secondary" onclick="loadAdminView('users')">🔄 Refrescar</button>
                    </div>
                    <table style="width: 100%; border-collapse: collapse; text-align: left;">
                        <thead>
                            <tr style="color: var(--text-muted); font-size: 0.8rem; text-transform: uppercase;">
                                <th style="padding: 1rem;">Jugador</th>
                                <th style="padding: 1rem;">Teléfono</th>
                                <th style="padding: 1rem;">Nivel</th>
                                <th style="padding: 1rem;">Estado</th>
                                <th style="padding: 1rem;">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            `;

            // Add global approver function
            window.approveUser = async (id) => {
                if (!confirm("¿Validar acceso para este usuario?")) return;
                try {
                    await fetch(`/api/users/${id}/approve`, { method: 'PUT' });
                    loadAdminView('users'); // Reload
                } catch (e) {
                    alert("Error: " + e.message);
                }
            };

        } catch (e) {
            content.innerHTML = `<div class="error">Error cargando usuarios: ${e.message}</div>`;
        }
    } else if (view === 'matches') {
        title.textContent = 'Control de Partidos en Vivo';

        // Fetch Americanas to select
        try {
            const res = await fetch('/api/americanas');
            const americanas = await res.json();
            const activeAmericana = americanas.find(a => a.status === 'open' || a.status === 'in_progress') || americanas[0];

            if (!activeAmericana) {
                content.innerHTML = `<div class="glass-panel text-center"><p>No hay eventos creados.</p></div>`;
                return;
            }

            // Function to render matches for selected Americana
            window.renderMatchesForAmericana = async (id) => {
                const matchesRes = await fetch(`/api/matches?americana_id=${id}`);
                const matches = await matchesRes.json();

                const container = document.getElementById('matches-container');
                if (matches.length === 0) {
                    container.innerHTML = `
                        <div style="text-align: center; padding: 2rem;">
                            <p style="color: var(--text-muted); margin-bottom: 1rem;">No hay partidos generados para este evento.</p>
                            <button class="btn-primary" onclick="generateMatches(${id})">⚡ Generar 1ª Ronda</button>
                        </div>
                     `;
                } else {
                    container.innerHTML = matches.map(m => `
                        <div class="glass-panel" style="margin-bottom: 1rem; display: flex; align-items: center; justify-content: space-between; padding: 1rem;">
                            <div style="flex: 1; text-align: right; padding-right: 1rem;">
                                <div style="font-weight: 700;">${m.team_a_names}</div>
                            </div>
                            <div style="display: flex; gap: 0.5rem; align-items: center;">
                                <input type="number" id="scoreA-${m.id}" value="${m.score_a}" style="width: 50px; text-align: center; background: #333; border: 1px solid #444; color: white; padding: 0.5rem; border-radius: 4px;">
                                <span style="font-weight: 800; color: var(--text-muted);">-</span>
                                <input type="number" id="scoreB-${m.id}" value="${m.score_b}" style="width: 50px; text-align: center; background: #333; border: 1px solid #444; color: white; padding: 0.5rem; border-radius: 4px;">
                            </div>
                            <div style="flex: 1; text-align: left; padding-left: 1rem;">
                                <div style="font-weight: 700;">${m.team_b_names}</div>
                            </div>
                            <div style="width: 150px; text-align: right;">
                                <select id="status-${m.id}" style="background: #222; color: #fff; border: none; padding: 0.3rem; border-radius: 4px; margin-right: 0.5rem;">
                                    <option value="scheduled" ${m.status === 'scheduled' ? 'selected' : ''}>⏳ Prog.</option>
                                    <option value="live" ${m.status === 'live' ? 'selected' : ''}>🔴 En Vivo</option>
                                    <option value="finished" ${m.status === 'finished' ? 'selected' : ''}>✅ Fin</option>
                                </select>
                                <button class="btn-secondary" style="font-size: 0.8rem; padding: 0.3rem 0.6rem;" onclick="saveMatch(${m.id}, ${id})">💾</button>
                            </div>
                        </div>
                    `).join('');
                }
            };

            window.generateMatches = async (id) => {
                if (!confirm("¿Generar partidos de prueba?")) return;
                await fetch(`/api/matches/generate/${id}`, { method: 'POST' });
                renderMatchesForAmericana(id);
            };

            window.saveMatch = async (matchId, americanaId) => {
                const scoreA = document.getElementById(`scoreA-${matchId}`).value;
                const scoreB = document.getElementById(`scoreB-${matchId}`).value;
                const status = document.getElementById(`status-${matchId}`).value;

                // Mock sending everything needed for update
                const data = {
                    americana_id: americanaId, // needed for validation logic if any
                    round: 1, // needed
                    court: 1, // needed
                    team_a_names: "x", // ignored by backend update logic but needed by schema
                    team_b_names: "x",
                    score_a: parseInt(scoreA),
                    score_b: parseInt(scoreB),
                    status: status
                };

                await fetch(`/api/matches/${matchId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                alert("Partido actualizado"); // Simple feedback
            };

            content.innerHTML = `
                <div style="margin-bottom: 2rem;">
                    <label style="color: var(--text-muted); margin-right: 1rem;">Selecciona Evento:</label>
                    <select id="americana-select" onchange="renderMatchesForAmericana(this.value)" style="background: #222; color: white; border: 1px solid #444; padding: 0.5rem; border-radius: 4px;">
                        ${americanas.map(a => `<option value="${a.id}" ${a.id === activeAmericana.id ? 'selected' : ''}>${a.name} (${a.date})</option>`).join('')}
                    </select>
                </div>
                <div id="matches-container">
                    <div class="loader"></div>
                </div>
            `;

            // Initial render
            renderMatchesForAmericana(activeAmericana.id);

        } catch (e) {
            content.innerHTML = `<div class="error">Error: ${e.message}</div>`;
        }

    } else {
        title.textContent = 'Configuración';
        content.innerHTML = `
            <div class="glass-panel">
                <h3>Configuración del Sistema</h3>
                <p>Versión 1.0.0 PRO</p>
            </div>
        `;
    }
}

// --- Init ---
document.getElementById('admin-login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    AdminAuth.login(fd.get('phone'), fd.get('password'));
});

// Start
AdminAuth.init();
