/**
 * admin-dashboard.js
 * Vista principal del Panel de Administración con estética Enterprise.
 */

window.AdminViews = window.AdminViews || {};

window.AdminViews.dashboard_home = async function () {
    const content = document.getElementById('content-area');
    if (!content) return;

    // Actualizar título de la página
    const pageTitle = document.getElementById('page-title');
    if (pageTitle) pageTitle.textContent = 'PANEL PRINCIPAL - SOMOSPADEL BCN';

    // Template inicial con esqueleto de carga elegante
    content.innerHTML = `
        <div class="dashboard-grid">
            <!-- Header Stats -->
            <div class="stats-row">
                <div class="glass-card-enterprise stat-card">
                    <div class="stat-icon"><i class="fas fa-users"></i></div>
                    <div class="stat-data">
                        <span class="stat-label">Jugadores Totales</span>
                        <h2 id="dash-total-players">--</h2>
                    </div>
                </div>
                <div class="glass-card-enterprise stat-card">
                    <div class="stat-icon neon"><i class="fas fa-trophy"></i></div>
                    <div class="stat-data">
                        <span class="stat-label">Americanas Activas</span>
                        <h2 id="dash-active-americanas">--</h2>
                    </div>
                </div>
                <div class="glass-card-enterprise stat-card">
                    <div class="stat-icon blue"><i class="fas fa-calendar-alt"></i></div>
                    <div class="stat-data">
                        <span class="stat-label">Entrenos hoy</span>
                        <h2 id="dash-today-entrenos">--</h2>
                    </div>
                </div>

            </div>

            <!-- Main Content Row -->
            <div class="dashboard-main-row">
                <!-- Data Visualization Concept -->
                <div class="glass-card-enterprise main-chart-card">
                    <div class="card-header">
                        <h3><i class="fas fa-chart-line"></i> Actividad Semanal</h3>
                        <div class="card-actions">
                            <span class="badge-pro">Live Analytics</span>
                        </div>
                    </div>
                    <div class="chart-placeholder">
                        <div class="mock-chart">
                            ${[40, 70, 45, 90, 65, 85, 100].map((h, i) => `
                                <div class="chart-bar" style="height: ${h}%; animation-delay: ${i * 0.1}s"></div>
                            `).join('')}
                        </div>
                        <div class="chart-labels">
                            <span>L</span><span>M</span><span>X</span><span>J</span><span>V</span><span>S</span><span>D</span>
                        </div>
                    </div>
                </div>

                <!-- Recent Activity / Upcoming Events -->
                <div class="glass-card-enterprise list-card">
                    <div class="card-header">
                        <h3><i class="fas fa-bolt"></i> Próximos Eventos</h3>
                    </div>
                    <div id="dash-upcoming-events" class="event-list">
                        <div class="loading-mini">Cargando telemetría...</div>
                    </div>
                </div>
            </div>
        </div>

        <style>
            .dashboard-grid {
                display: flex;
                flex-direction: column;
                gap: 2rem;
                animation: fadeIn 0.5s ease-out;
            }

            .stats-row {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                gap: 1.5rem;
            }

            .stat-card {
                display: flex;
                align-items: center;
                gap: 1.5rem;
                padding: 1.5rem;
            }

            .stat-icon {
                width: 50px;
                height: 50px;
                border-radius: 12px;
                background: rgba(255,255,255,0.05);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.5rem;
                color: #8b8d98;
                border: 1px solid rgba(255,255,255,0.1);
            }

            .stat-icon.neon { color: var(--neon-primary); border-color: rgba(204,255,0,0.2); }
            .stat-icon.blue { color: #00d4ff; border-color: rgba(0,212,255,0.2); }
            .stat-icon.gold { color: #ffcc00; border-color: rgba(255,204,0,0.2); }

            .stat-data .stat-label {
                font-size: 0.75rem;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: var(--text-muted);
                font-weight: 700;
            }

            .stat-data h2 {
                margin: 0;
                font-size: 1.8rem;
                font-weight: 800;
                color: var(--text-main);
            }

            .dashboard-main-row {
                display: grid;
                grid-template-columns: 2fr 1fr;
                gap: 1.5rem;
            }

            @media (max-width: 1024px) {
                .dashboard-main-row { grid-template-columns: 1fr; }
            }

            .card-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1.5rem;
            }

            .card-header h3 {
                margin: 0;
                font-size: 1rem;
                font-weight: 700;
                letter-spacing: 0.5px;
            }

            .badge-pro {
                font-size: 0.6rem;
                font-weight: 800;
                background: rgba(204,255,0,0.1);
                color: var(--neon-primary);
                padding: 4px 8px;
                border-radius: 4px;
                text-transform: uppercase;
            }

            /* Mock Chart Styling */
            .chart-placeholder {
                height: 200px;
                display: flex;
                flex-direction: column;
                justify-content: flex-end;
            }

            .mock-chart {
                height: 150px;
                display: flex;
                align-items: flex-end;
                justify-content: space-between;
                padding: 0 1rem;
                gap: 10px;
            }

            .chart-bar {
                flex: 1;
                background: linear-gradient(to top, var(--neon-primary), transparent);
                opacity: 0.3;
                border-radius: 4px 4px 0 0;
                transition: opacity 0.3s;
                animation: barGrow 1s ease-out forwards;
                transform: scaleY(0);
                transform-origin: bottom;
            }

            .chart-bar:hover { opacity: 0.8; }

            .chart-labels {
                display: flex;
                justify-content: space-between;
                padding: 10px 1rem 0;
                color: var(--text-muted);
                font-size: 0.7rem;
                font-weight: 700;
            }

            .event-list {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .event-item {
                padding: 12px;
                background: rgba(255,255,255,0.02);
                border-radius: 10px;
                border-left: 3px solid #333;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .event-info .event-name {
                font-size: 0.9rem;
                font-weight: 700;
                display: block;
            }

            .event-info .event-time {
                font-size: 0.75rem;
                color: var(--text-muted);
            }

            @keyframes barGrow { to { transform: scaleY(1); } }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        </style>
    `;

    // Cargar datos reales de Firebase
    try {
        if (!window.db) return;

        // 1. Total Jugadores
        const playersSnap = await window.db.collection('players').get();
        document.getElementById('dash-total-players').textContent = playersSnap.size;

        // 2. Americanas Activas
        const americanasSnap = await window.db.collection('americanas')
            .where('status', '==', 'active').get();
        document.getElementById('dash-active-americanas').textContent = americanasSnap.size;

        // 3. Entrenos hoy
        const todayStr = new Date().toISOString().split('T')[0];
        const entrenosSnap = await window.db.collection('entrenos')
            .where('date', '==', todayStr).get();
        document.getElementById('dash-today-entrenos').textContent = entrenosSnap.size;

        // 4. Lista de Próximos Eventos
        const eventsList = document.getElementById('dash-upcoming-events');
        const upcomingSnap = await window.db.collection('americanas')
            .orderBy('createdAt', 'desc').limit(5).get();

        if (upcomingSnap.empty) {
            eventsList.innerHTML = '<div style="color:#555; font-size:0.8rem;">No hay eventos programados.</div>';
        } else {
            eventsList.innerHTML = '';
            upcomingSnap.forEach(doc => {
                const data = doc.data();
                const div = document.createElement('div');
                div.className = 'event-item';
                div.style.borderLeftColor = data.status === 'active' ? 'var(--neon-primary)' : '#555';
                div.innerHTML = `
                    <div class="event-info">
                        <span class="event-name">${data.name || 'Sin nombre'}</span>
                        <span class="event-time">${data.date || 'Sin fecha'} - ${data.time || ''}</span>
                    </div>
                    <span class="badge-pro" style="background:transparent; border:1px solid rgba(255,255,255,0.1); color:#888;">
                        ${(data.players || []).length} JUGS
                    </span>
                `;
                eventsList.appendChild(div);
            });
        }

    } catch (err) {
        console.error("Error cargando Dashboard Stats:", err);
    }
};
