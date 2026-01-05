/**
 * ControlTowerView.js
 * The dedicated view for managing the live Americana.
 * Replicates the "Official Tournament" screen.
 */
(function () {
    class ControlTowerView {
        constructor() {
            this.activeTab = 'results'; // 'results' or 'standings'

            // Check for store connectivity
            if (window.Store) {
                window.Store.subscribe('dashboardData', (data) => {
                    const currentRoute = window.Router ? window.Router.currentRoute : null;
                    if (currentRoute === 'live') {
                        this.render(data);
                    }
                });
            }
        }

        switchTab(tab) {
            this.activeTab = tab;
            // Trigger re-render with current state
            const data = window.Store.getState('dashboardData');
            this.render(data);
        }

        render(data) {
            const container = document.getElementById('content-area');
            if (!container) return;

            const roundData = data?.currentRound || {
                number: '-',
                totalRounds: '-',
                status: 'LOADING',
                timeLeft: '--:--',
                matches: []
            };

            const matchesPlayed = roundData.matches.filter(m => m.isFinished).length;
            const matchesInPlay = roundData.matches.filter(m => !m.isFinished).length;

            container.innerHTML = `
                <div class="tournament-layout fade-in">
                    
                    <!-- 1. TOP NAV BAR (Black) -->
                    <div class="tour-nav-bar">
                        <div class="tour-brand">
                            <div class="brand-circle"></div>
                            <div class="brand-text">
                                <span style="color:var(--playtomic-neon)">SOMOS</span>PADEL<br>
                                <span style="font-size:0.6rem; color:#888;">TORNEO OFICIAL</span>
                            </div>
                        </div>
                        
                        <div class="tour-menu">
                            <button class="tour-menu-item ${this.activeTab === 'standings' ? 'active' : ''}" onclick="window.ControlTowerView.switchTab('standings')">CLASIFICACIÓN</button>
                            <button class="tour-menu-item ${this.activeTab === 'results' ? 'active' : ''}" onclick="window.ControlTowerView.switchTab('results')">PARTIDOS</button>
                            <button class="tour-menu-item ${this.activeTab === 'schedule' ? 'active' : ''}" onclick="window.ControlTowerView.switchTab('schedule')">PROGRAMACIÓN</button>
                            <button class="tour-menu-item">ESTADÍSTICAS</button>
                            <button class="tour-menu-item">ADMIN</button>
                        </div>

                        <div class="tour-stats-row">
                            <div class="tour-stat-badge">🏆 <span>${matchesPlayed} JUGADOS</span></div>
                            <div class="tour-stat-badge live">🟢 <span>${matchesInPlay} EN JUEGO</span></div>
                            <div class="tour-user-stat">👥 41 ONLINE</div>
                            
                            <button onclick="TowerActions.reset()" style="background:none; border:none; color:#555; cursor:pointer;" title="Reset Total">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>

                    <!-- 2. CONTENT AREA (SWITCHABLE) -->
                    ${this.renderActiveContent(data, roundData)}

                    <!-- 4. BOTTOM TICKER -->
                    <div class="tour-bottom-ticker">
                        <div class="ticker-label">⚡ ÚLTIMA HORA</div>
                        <div class="ticker-scroller">
                            <span>RESULTADOS EN VIVO: Pista 1 (6-4) • Pista 2 (En juego) • Pista 3 (2-6) • Pista 4 (5-5) • Pista 5 (Finalizado) • </span>
                        </div>
                    </div>

                </div>
            `;
        }

        renderActiveContent(data, roundData) {
            switch (this.activeTab) {
                case 'standings': return this.renderStandingsView();
                case 'schedule': return this.renderScheduleView(); // New Tab
                case 'results': default: return this.renderResultsView(roundData, data?.roundsSchedule);
            }
        }

        renderScheduleView() {
            // Mock Data: "Todas las americanas organizadas por mi"
            // Organized by Day, showing Time inside.
            const scheduleData = [
                {
                    day: "LUNES 05", events: [
                        { time: "18:00", title: "Americana Iniciación", signed: 12, max: 20 },
                        { time: "19:30", title: "Americana Mixta Media", signed: 24, max: 24, status: 'FULL' },
                        { time: "21:00", title: "Torneo Nocturno", signed: 8, max: 16 }
                    ]
                },
                {
                    day: "MARTES 06", events: [
                        { time: "10:00", title: "Mañanas Padeleras", signed: 16, max: 16, status: 'FULL' },
                        { time: "19:00", title: "Rey de la Pista", signed: 10, max: 20 }
                    ]
                },
                {
                    day: "MIÉRCOLES 07", events: [
                        { time: "18:00", title: "Americana Femenina", signed: 14, max: 24 },
                        { time: "20:00", title: "Americana PRO", signed: 4, max: 12 }
                    ]
                },
                { day: "JUEVES 08", events: [] },
                {
                    day: "VIERNES 09", events: [
                        { time: "19:00", title: "Viernes Social", signed: 20, max: 30 }
                    ]
                }
            ];

            return `
                <div class="schedule-container fade-in" style="padding: 30px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:30px;">
                        <h2 style="color:white; font-family:'Outfit'; margin:0;">📅 MI CALENDARIO DE AMERICANAS</h2>
                        <button class="btn-tour-control" style="background:var(--playtomic-neon); color:black;">+ NUEVA AMERICANA</button>
                    </div>

                    <div class="schedule-grid" style="display: flex; flex-direction: column; gap: 2px;">
                        ${scheduleData.map(day => `
                            <!-- DAY ROW -->
                            <div class="schedule-row" style="display:flex; gap:20px; background:#1a1a1a; padding:15px; border-radius:8px; align-items:flex-start;">
                                <!-- Day Column -->
                                <div class="day-label" style="min-width:120px; padding-top:10px;">
                                    <div style="color:var(--playtomic-neon); font-family:'Outfit'; font-weight:800; font-size:1.2rem;">${day.day.split(' ')[0]}</div>
                                    <div style="color:white; font-size:2rem; font-weight:800; line-height:1;">${day.day.split(' ')[1]}</div>
                                </div>
                                
                                <!-- Events Column -->
                                <div class="events-list" style="flex:1; display:flex; gap:15px; flex-wrap:wrap;">
                                    ${day.events.length === 0 ? '<div style="color:#444; padding:10px; font-style:italic;">Sin eventos programados</div>' : ''}
                                    ${day.events.map(ev => `
                                        <div class="sched-card" style="background:#252525; padding:15px; border-radius:10px; min-width:200px; border-left:4px solid ${ev.status === 'FULL' ? '#ef4444' : 'var(--playtomic-blue)'}; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
                                            <div style="background:#000; color:white; display:inline-block; padding:2px 8px; border-radius:4px; font-size:0.8rem; font-weight:700; margin-bottom:8px;">
                                                ⏰ ${ev.time}
                                            </div>
                                            <div style="color:white; font-weight:700; font-size:1rem; margin-bottom:4px;">${ev.title}</div>
                                            <div style="color:#888; font-size:0.8rem;">
                                                👥 ${ev.signed} / ${ev.max} Inscritos
                                                ${ev.status === 'FULL' ? '<span style="color:#ef4444; font-weight:bold; margin-left:5px;">(COMPLETO)</span>' : ''}
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        renderResultsView(roundData, allRounds) {
            // Helper to render tabs if schedule exists
            const tabs = allRounds ? this.renderRoundTabs(allRounds, roundData.number) : '';

            return `
                <!-- FILTER BAR (Keep existing) -->
                <div class="tour-filter-bar">
                   ${tabs} <!-- Insert Tabs Here -->
                   
                   <div style="flex:1;"></div> <!-- Spacer -->
                   
                   <!-- Only show Start/Gen buttons if NO matches exist yet -->
                   ${roundData.matches.length === 0 ? `
                        <div style="display:flex; gap:10px;">
                            <button class="btn-tour-control" onclick="TowerActions.start(6)">GENERAR 6 PISTAS</button>
                            <button class="btn-tour-control" onclick="TowerActions.start(10)">GENERAR 10 PISTAS</button>
                        </div>
                   ` : ''}
                   
                   <button class="btn-tour-control" onclick="Router.navigate('dashboard')">SALIR</button>
                </div>

                <!-- MATCH GRID -->
                <div class="tour-grid-container">
                    ${roundData.matches.length ? '' : '<div style="color:#666; width:100%; text-align:center; padding:50px;">Selecciona "Generar" para iniciar el torneo.</div>'}
                    ${
                // Sort by Court Number
                roundData.matches
                    .sort((a, b) => a.court - b.court)
                    .map(match => this.renderTournamentCard(match))
                    .join('')
                }
                </div>
            `;
        }

        renderRoundTabs(rounds, currentNum) {
            return `
                <div class="round-tabs-container">
                    ${rounds.map(r => `
                        <button class="round-tab ${r.number === currentNum ? 'active' : ''}" onclick="TowerActions.goToRound(${r.number})">
                            ${r.number}º PARTIDO
                        </button>
                    `).join('')}
                </div>
            `;
        }

        renderStandingsView() {
            // Mock Data for Visuals
            const mockStandings = [
                { pos: 1, name: "Yoana / Andrea", pts: 45, diff: 12 },
                { pos: 2, name: "Sandra / Yolanda", pts: 42, diff: 8 },
                { pos: 3, name: "Gemma / Mayte", pts: 38, diff: 5 },
                { pos: 4, name: "Cristina / Olga", pts: 35, diff: -2 },
                { pos: 5, name: "Marta / Joan", pts: 30, diff: -5 },
                { pos: 6, name: "Laura / Noelia", pts: 28, diff: -8 },
            ];

            return `
                <div class="standings-container fade-in" style="padding: 20px;">
                     <h2 style="color:white; font-family:'Outfit'; margin-bottom:20px;">Clasificación General</h2>
                     <table class="tour-table">
                        <thead>
                            <tr>
                                <th>POS</th>
                                <th>EQUIPO / JUGADORAS</th>
                                <th>PUNTOS</th>
                                <th>DIF</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${mockStandings.map(row => `
                                <tr>
                                    <td><div class="pos-badge ${row.pos <= 3 ? 'top' : ''}">${row.pos}</div></td>
                                    <td class="team-cell">${row.name}</td>
                                    <td class="pts-cell">${row.pts}</td>
                                    <td>${row.diff}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                     </table>
                </div>
            `;
        }

        renderTournamentCard(match) {
            const colorClass = `border-${(match.court % 4) + 1}`;

            // Minimalist Status Indicator
            const statusText = match.isFinished ?
                '<span style="color:#4ADE80; font-weight:bold;">FINALIZADO</span>' :
                '<span style="color:#666;">PROGRAMADO</span>';

            return `
                <div class="tour-match-card ${colorClass}" ondblclick="TowerActions.toggleStatus(${match.court})" title="Doble click para cambiar estado">
                    <div class="tour-card-header">
                        <span class="cat-label">${match.category || '4ª FEMENINA'} • G.A</span>
                        <div style="display:flex; gap:10px; align-items:center;">
                            <span class="court-label">PISTA ${match.court}</span>
                            ${statusText} 
                        </div>
                    </div>
                    
                    <div class="tour-card-body" style="padding-bottom:15px;">
                        <!-- TEAM A -->
                        <div class="tour-team-row">
                            <span class="tour-team-name">${match.teamA}</span>
                            <div class="tour-score-box">
                                <span class="score-num">${match.scoreA || 0}</span>
                                <div class="score-buttons">
                                    <button onclick="event.stopPropagation(); TowerActions.updateScore(${match.court}, 'A', 1)">+</button>
                                    <button onclick="event.stopPropagation(); TowerActions.updateScore(${match.court}, 'A', -1)">-</button>
                                </div>
                            </div>
                        </div>

                        <!-- TEAM B -->
                        <div class="tour-team-row">
                            <span class="tour-team-name">${match.teamB}</span>
                            <div class="tour-score-box">
                                <span class="score-num">${match.scoreB || 0}</span>
                                <div class="score-buttons">
                                    <button onclick="event.stopPropagation(); TowerActions.updateScore(${match.court}, 'B', 1)">+</button>
                                    <button onclick="event.stopPropagation(); TowerActions.updateScore(${match.court}, 'B', -1)">-</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <!-- Footer Removed as per request -->
                </div>
            `;
        }
    }

    window.ControlTowerView = new ControlTowerView();
    console.log("🗼 ControlTowerView (Tournament Mode) Loaded");
})();
