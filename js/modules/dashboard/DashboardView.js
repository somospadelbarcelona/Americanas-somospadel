/**
 * DashboardView.js (Mobile Home Hub)
 * "Engineering Grade" Premium Dashboard
 */
(function () {
    class DashboardView {
        constructor() {
            // Subscribe to store
            if (window.Store) {
                window.Store.subscribe('dashboardData', (data) => {
                    if (window.Router && window.Router.currentRoute === 'dashboard') {
                        this.render(data);
                    }
                });
            }
        }

        render(data) {
            const container = document.getElementById('content-area');
            if (!container) return;

            // Mock Data if not present
            const userName = "Alejandro"; // Should come from Auth
            const userLevel = "4.45";
            const nextMatch = { date: "HOY", time: "19:30", title: "Americana Mixta", loc: "Indoor Gavà" };

            // Check Live Status
            const isLive = data?.currentRound?.status === 'PLAYING';

            container.innerHTML = `
                <div class="dashboard-mobile fade-in">
                    
                    <!-- 1. HEADER -->
                    <div class="dash-header">
                        <div class="dash-welcome">Buenas tardes,</div>
                        <div class="dash-user-name">${userName}</div>
                    </div>

                    <!-- 2. STATS WIDGET (Main Hero) -->
                    <div class="stat-widget-container" onclick="Router.navigate('stats')">
                        <div class="stat-header">
                            <div>
                                <div style="font-size:0.8rem; color:#aaa; margin-bottom:4px;">TU NIVEL PLAYTOMIC</div>
                                <div style="font-size:2.5rem; font-weight:800; line-height:1;">${userLevel}</div>
                            </div>
                            <div class="level-circle">
                                <span>${userLevel}</span>
                            </div>
                        </div>
                        <div class="stat-grid-mini">
                            <div class="mini-stat">
                                <h4>Partidos</h4>
                                <p>12</p>
                            </div>
                            <div class="mini-stat">
                                <h4>Victorias</h4>
                                <p style="color:var(--playtomic-neon)">8</p>
                            </div>
                            <div class="mini-stat">
                                <h4>Efectividad</h4>
                                <p>66%</p>
                            </div>
                        </div>
                    </div>

                    <!-- 3. ACTIVE LIVE TOURNAMENT (Conditional) -->
                    <div class="promo-banner" onclick="Router.navigate('live')" style="margin: 0 20px 20px 20px; cursor:pointer; display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <div style="font-size:0.8rem; font-weight:700; color:var(--playtomic-neon); margin-bottom:4px;">
                                <span class="pulsing-dot" style="background:var(--playtomic-neon)"></span> EN JUEGO AHORA
                            </div>
                            <div style="font-size:1.2rem; font-weight:800;">Americana en Curso</div>
                            <div style="font-size:0.8rem; opacity:0.8;">Pulsa para gestionar</div>
                        </div>
                        <i class="fas fa-chevron-right"></i>
                    </div>

                    <!-- 4. GRID MENU (The 6 Requested Tabs) -->
                    <div class="dash-menu-grid">
                        
                        <!-- MI PERFIL -->
                        <div class="menu-card" onclick="Router.navigate('profile')">
                            <div class="icon-box"><i class="far fa-user"></i></div>
                            <div class="menu-title">Mi Perfil</div>
                        </div>

                        <!-- AMERICANAS -->
                        <div class="menu-card highlight" onclick="Router.navigate('americanas')">
                            <div class="icon-box"><i class="fas fa-trophy"></i></div>
                            <div class="menu-title">Americanas</div>
                        </div>

                        <!-- RESULTADOS (Links to Live or History) -->
                        <div class="menu-card" onclick="Router.navigate('live')">
                            <div class="icon-box"><i class="fas fa-clipboard-list"></i></div>
                            <div class="menu-title">Resultados</div>
                        </div>

                        <!-- RANKING -->
                        <div class="menu-card" onclick="Router.navigate('ranking')">
                            <div class="icon-box"><i class="fas fa-medal"></i></div>
                            <div class="menu-title">Ranking</div>
                        </div>

                        <!-- ESTADISTICAS -->
                        <div class="menu-card" onclick="Router.navigate('stats')">
                            <div class="icon-box"><i class="fas fa-chart-bar"></i></div>
                            <div class="menu-title">Estadísticas</div>
                        </div>

                        <!-- AGENDA -->
                        <div class="menu-card" onclick="Router.navigate('agenda')">
                            <div class="icon-box"><i class="far fa-calendar-alt"></i></div>
                            <div class="menu-title">Agenda</div>
                        </div>

                    </div>
                </div>
            `;
        }
    }

    window.DashboardView = new DashboardView();
    console.log("📱 Mobile Dashboard Loaded");
})();
