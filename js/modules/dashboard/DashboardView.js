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

        getGreeting() {
            const hour = new Date().getHours();
            if (hour < 12) return 'Buenos días';
            if (hour < 18) return 'Buenas tardes';
            return 'Buenas noches';
        }

        render(data) {
            const container = document.getElementById('content-area');
            if (!container) return;

            // REAL DATA from Store
            const user = window.Store ? window.Store.getState('currentUser') : null;
            const userName = user ? (user.name || user.displayName || "Jugador") : "Jugador";
            const userLevel = user ? (user.level || user.self_rate_level || '3.5') : '3.5';

            // Check Live Status
            const isLive = data?.currentRound?.status === 'PLAYING';

            container.innerHTML = `
                <div class="dashboard-mobile fade-in" style="background: #f5f5f5; min-height: 100vh; padding-bottom: 100px; font-family: 'Outfit', sans-serif;">
                    
                    <!-- 1. HEADER (AS IN IMAGE) -->
                    <div class="dash-header" style="background: #000; display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 2px solid var(--playtomic-neon);">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <img src="img/logo_somospadel.png" alt="Logo" style="height: 40px; filter: drop-shadow(0 0 5px var(--playtomic-neon)); border-radius: 50%;">
                            <div style="line-height: 1.1;">
                                <div style="font-family:'Outfit'; font-weight:800; font-size:1.1rem; color: white;">SOMOS<span style="color:var(--playtomic-neon);">PADEL</span></div>
                                <div style="font-family:'Inter'; font-weight:600; font-size:0.65rem; color:#888; letter-spacing:1px; text-transform: uppercase;">AMERICANAS</div>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <div style="text-align: right; line-height: 1.2;">
                                <div style="font-size: 0.6rem; color: #888; font-weight: 700; text-transform: uppercase;">${this.getGreeting()},</div>
                                <div style="font-size: 1rem; color: white; font-weight: 800;">${userName}</div>
                            </div>
                            <div onclick="window.AuthService?.logout()" style="width: 36px; height: 36px; background: rgba(255,255,255,0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #ef4444; cursor: pointer;">
                                <i class="fas fa-sign-out-alt"></i>
                            </div>
                        </div>
                    </div>

                    <!-- 2. STATS COMPACT (DARK AS IN IMAGE) -->
                    <div style="margin: 20px; background: linear-gradient(135deg, #0a0a0a 0%, #151515 100%); padding: 25px; border-radius: 24px; box-shadow: 0 12px 30px rgba(0,0,0,0.15); color: white;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                            <div>
                                <div style="font-size: 0.7rem; color: #888; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px;">TU NIVEL</div>
                                <div style="font-size: 3.2rem; font-weight: 900; line-height: 1; letter-spacing: -1.5px;">${userLevel}</div>
                            </div>
                            <div style="width: 60px; height: 60px; border: 2px solid var(--playtomic-neon); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 15px rgba(204,255,0,0.2);">
                                <span style="font-weight: 900; font-size: 1.2rem;">${userLevel}</span>
                            </div>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1.2fr; gap: 15px; margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 15px;">
                            <div>
                                <div style="font-size: 0.55rem; color: #555; font-weight: 800; text-transform: uppercase; margin-bottom: 3px;">PARTIDOS</div>
                                <div style="font-size: 1.1rem; font-weight: 800;">${user?.matches_played || 0}</div>
                            </div>
                            <div>
                                <div style="font-size: 0.55rem; color: #555; font-weight: 800; text-transform: uppercase; margin-bottom: 3px;">VICTORIAS</div>
                                <div style="font-size: 1.1rem; font-weight: 800; color: var(--playtomic-neon);">${user?.wins || 0}</div>
                            </div>
                            <div>
                                <div style="font-size: 0.55rem; color: #555; font-weight: 800; text-transform: uppercase; margin-bottom: 3px;">EFECTIVIDAD</div>
                                <div style="font-size: 1.1rem; font-weight: 800;">${user?.win_rate || '-'}%</div>
                            </div>
                        </div>
                    </div>

                    <!-- 3. MAIN MENU (LIGHT GRID AS IN IMAGE) -->
                    <div style="padding: 0 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        
                        <!-- MI PERFIL -->
                        <div onclick="Router.navigate('profile')" style="background: white; padding: 25px 15px; border-radius: 16px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                            <div style="background: #f8f8f8; color: #333; width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
                                <i class="far fa-user"></i>
                            </div>
                            <div style="font-size: 0.85rem; font-weight: 800; color: #111;">Mi Perfil</div>
                        </div>

                        <!-- JUGAR TORNEO (HIGHLIGHTED) -->
                        <div onclick="Router.navigate('americanas')" id="jugar-torneo-card" style="background: white; padding: 25px 15px; border-radius: 16px; border: 2px solid var(--playtomic-neon); display: flex; flex-direction: column; align-items: center; text-align: center; gap: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                            <div style="background: var(--playtomic-neon); color: black; width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; box-shadow: 0 4px 10px rgba(204,255,0,0.3);">
                                <i class="fas fa-plus"></i>
                            </div>
                            <div style="font-size: 0.9rem; font-weight: 900; color: #000; margin-top: 4px;">JUGAR TORNEO</div>
                            <div id="tournament-status-label" style="font-size: 0.65rem; color: #666; font-weight: 600;">Cargando...</div>
                        </div>

                        <!-- RESULTADOS -->
                        <div onclick="Router.navigate('live')" style="background: white; padding: 25px 15px; border-radius: 16px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                            <div style="background: #f8f8f8; color: #333; width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
                                <i class="fas fa-clipboard-list"></i>
                            </div>
                            <div style="font-size: 0.85rem; font-weight: 800; color: #111;">Resultados</div>
                        </div>


                        <!-- RANKING -->
                        <div onclick="Router.navigate('ranking')" style="background: white; padding: 25px 15px; border-radius: 16px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                            <div style="background: #f8f8f8; color: #333; width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
                                <i class="fas fa-medal"></i>
                            </div>
                            <div style="font-size: 0.85rem; font-weight: 800; color: #111;">Ranking</div>
                        </div>

                        <!-- ESTADISTICAS -->
                        <div onclick="Router.navigate('stats')" style="background: white; padding: 25px 15px; border-radius: 16px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                            <div style="background: #f8f8f8; color: #333; width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
                                <i class="fas fa-chart-bar"></i>
                            </div>
                            <div style="font-size: 0.85rem; font-weight: 800; color: #111;">Estadísticas</div>
                        </div>

                        <!-- AGENDA -->
                        <div onclick="Router.navigate('agenda')" style="background: white; padding: 25px 15px; border-radius: 16px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                            <div style="background: #f8f8f8; color: #333; width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
                                <i class="far fa-calendar-alt"></i>
                            </div>
                            <div style="font-size: 0.85rem; font-weight: 800; color: #111;">Agenda</div>
                        </div>

                    </div>
                </div>
            `;

            // Sync with active Americanas
            this.syncTournamentStatus();
        }

        async syncTournamentStatus() {
            const label = document.getElementById('tournament-status-label');
            if (!label) return;

            try {
                if (window.AmericanaService) {
                    const active = await window.AmericanaService.getActiveAmericanas();
                    const openEvent = active.find(a => (a.status === 'open' || a.status === 'pending') && !a.is_finished);

                    if (openEvent) {
                        const players = openEvent.players || openEvent.registeredPlayers || [];
                        const max = (openEvent.max_courts || 0) * 4;
                        const remaining = max - players.length;

                        if (remaining > 0 && remaining <= 4) {
                            label.innerHTML = `<span style="color:#ef4444; font-weight:900;">🔥 ¡SOLO QUEDAN ${remaining} PLAZAS!</span>`;
                        } else if (remaining <= 0) {
                            label.textContent = "Evento Completo";
                            label.style.color = "#888";
                        } else {
                            label.textContent = "Inscripciones Abiertas";
                            label.style.color = "#25D366";
                        }
                    } else {
                        label.textContent = "Próximamente";
                        label.style.color = "#888";
                    }
                }
            } catch (e) {
                label.textContent = "Inscripciones Abiertas"; // Fallback to avoid error look
            }
        }
    }

    window.DashboardView = new DashboardView();
    console.log("📱 Mobile Dashboard Loaded");
})();
