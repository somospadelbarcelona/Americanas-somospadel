/**
 * ControlTowerView.js
 * The dedicated view for managing the live Americana.
 * Replicates the "Official Tournament" screen.
 */
(function () {
    class ControlTowerView {
        constructor() {
            this.activeTab = 'results'; // 'results', 'standings', 'schedule'
            this.selectedRound = 1;
            this.allMatches = [];
            this.currentAmericanaId = null;
            this.unsubscribeMatches = null;
        }

        async load(americanaId) {
            this.currentAmericanaId = americanaId;
            this.selectedRound = 1;

            // Show loading
            this.render({ status: 'LOADING' });

            // Unsubscribe previous
            if (this.unsubscribeMatches) this.unsubscribeMatches();

            // Real-time listener for matches
            this.unsubscribeMatches = window.db.collection('matches')
                .where('americana_id', '==', americanaId)
                .onSnapshot(snapshot => {
                    this.allMatches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    this.recalc();
                }, err => {
                    console.error("Error watching matches:", err);
                    alert("Error cargando partidos");
                });
        }

        async loadLatest() {
            this.render({ status: 'LOADING' });
            try {
                const snap = await window.db.collection('americanas')
                    .orderBy('date', 'desc')
                    .limit(5)
                    .get();

                const events = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                // Prefer 'live', then 'finished'
                const target = events.find(e => e.status === 'live') || events.find(e => e.status === 'finished');

                if (target) {
                    this.load(target.id);
                } else {
                    const container = document.getElementById('content-area');
                    if (container) {
                        container.innerHTML = `
                            <div style="padding: 50px 20px; text-align: center; color: #888;">
                                <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.2;"></i>
                                <h3>SIN TORNEOS ACTIVOS</h3>
                                <p>No hay ninguna Americana en juego actualmente.</p>
                                <button class="btn-primary-pro" onclick="Router.navigate('americanas')" style="margin-top: 20px;">VER CALENDARIO</button>
                            </div>
                        `;
                    }
                }
            } catch (e) {
                console.error("Error loading latest:", e);
            }
        }

        recalc() {
            // Filter matches for current round
            const currentRoundMatches = this.allMatches.filter(m => m.round === this.selectedRound);

            // Transform to view model
            const roundData = {
                number: this.selectedRound,
                matches: currentRoundMatches.map(m => {
                    const namesA = Array.isArray(m.team_a_names) ? m.team_a_names.join(' / ') : (m.team_a_names || 'Equipo A');
                    const namesB = Array.isArray(m.team_b_names) ? m.team_b_names.join(' / ') : (m.team_b_names || 'Equipo B');

                    return {
                        court: m.court,
                        teamA: namesA,
                        teamB: namesB,
                        scoreA: m.score_a,
                        scoreB: m.score_b,
                        isFinished: m.status === 'finished',
                        isLive: m.status === 'live',
                        category: 'NIVEL ' + (m.level_avg || '3.5'),
                        ...m
                    };
                }).sort((a, b) => a.court - b.court) // Default Sort by Court
            };

            const roundsSchedule = [1, 2, 3, 4, 5, 6].map(r => ({ number: r }));

            this.render({
                currentRound: roundData,
                roundsSchedule: roundsSchedule
            });
        }

        switchTab(tab) {
            this.activeTab = tab;
            this.recalc(); // Re-render
        }

        render(data) {
            const container = document.getElementById('content-area');
            if (!container) return;

            const roundData = data?.currentRound || { matches: [] };
            const matchesPlayed = this.allMatches.filter(m => m.status === 'finished').length;
            const matchesInPlay = this.allMatches.filter(m => m.status === 'live').length;

            container.innerHTML = `
                <div class="tournament-layout fade-in">
                    
                    <!-- 1. TOP NAV BAR (Black) -->
                    <div class="tour-nav-bar">
                        <div class="tour-brand">
                            <img src="img/logo_neon.png" alt="Logo" style="height: 40px; margin-right: 10px;">
                            <!-- NEWS TICKER -->
                            <div style="flex:1; overflow:hidden; white-space:nowrap; position:relative; height: 40px; display:flex; align-items:center; margin-left:10px; mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);">
                                <div style="display:inline-block; animation: headerTicker 20s linear infinite; font-family:'Outfit'; font-weight:600; font-size:1rem; color:white;">
                                    🏆 PRÓXIMA AMERICANA: Viernes 20:00h (3 Plazas)  •  🎾  Clínica de Remante: Sábado 10:00h  •  🥇  Ranking Actualizado  •  📢  Oferta: 2x1 en Grips
                                </div>
                            </div>
                        </div>
                        
                        <div class="tour-menu">
                            <button class="tour-menu-item ${this.activeTab === 'standings' ? 'active' : ''}" onclick="window.ControlTowerView.switchTab('standings')">CLASIFICACIÓN</button>
                            <button class="tour-menu-item ${this.activeTab === 'summary' ? 'active' : ''}" onclick="window.ControlTowerView.switchTab('summary')">RESUMEN</button>
                            <button class="tour-menu-item ${this.activeTab === 'results' ? 'active' : ''}" onclick="window.ControlTowerView.switchTab('results')">PARTIDOS</button>
                            <button class="tour-menu-item ${this.activeTab === 'schedule' ? 'active' : ''}" onclick="window.ControlTowerView.switchTab('schedule')">PROGRAMACIÓN</button>
                        </div>

                        <div class="tour-stats-row">
                            <div class="tour-stat-badge">🏆 <span>${matchesPlayed} JUGADOS</span></div>
                            <div class="tour-stat-badge live">🟢 <span>${matchesInPlay} EN JUEGO</span></div>
                        </div>
                    </div>

                    <!-- 2. CONTENT AREA (SWITCHABLE) -->
                    ${this.renderActiveContent(data, roundData)}

                    <!-- 4. BOTTOM TICKER -->
                    <div class="tour-bottom-ticker">
                        <div class="ticker-label">⚡ ÚLTIMA HORA</div>
                        <div class="ticker-scroller">
                            <span>Sincronizado en tiempo real con la Central de Datos...</span>
                        </div>
                    </div>

                </div>
            `;
        }

        renderActiveContent(data, roundData) {
            if (data.status === 'LOADING') return '<div class="loader" style="margin:50px auto;"></div>';

            switch (this.activeTab) {
                case 'standings': return this.renderStandingsView();
                case 'summary': return this.renderSummaryView();
                case 'schedule': return this.renderScheduleView();
                case 'results': default: return this.renderResultsView(roundData, data?.roundsSchedule);
            }
        }

        renderSummaryView() {
            const finishedMatches = this.allMatches.filter(m => m.status === 'finished');

            if (finishedMatches.length === 0) {
                return `
                    <div style="padding: 50px 20px; text-align: center; color: #888;">
                        <i class="fas fa-chart-pie" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.2;"></i>
                        <h3>DATOS EN PROCESO</h3>
                        <p>El resumen aparecerá cuando finalicen los primeros partidos.</p>
                    </div>
                `;
            }

            // --- Calculation (Light Version) ---
            const players = {};
            let totalGames = 0;
            let highIntensity = 0;

            finishedMatches.forEach(m => {
                const names = [...(m.team_a_names || []), ...(m.team_b_names || [])];
                const sA = parseInt(m.score_a || 0);
                const sB = parseInt(m.score_b || 0);
                totalGames += (sA + sB);
                if (Math.abs(sA - sB) <= 1) highIntensity++;

                (m.team_a_names || []).forEach(n => {
                    if (!players[n]) players[n] = { name: n, games: 0, wins: 0, matches: 0, pointsAgainst: 0 };
                    players[n].games += sA; players[n].matches++;
                    players[n].pointsAgainst += sB;
                    if (sA > sB) players[n].wins++;
                });
                (m.team_b_names || []).forEach(n => {
                    if (!players[n]) players[n] = { name: n, games: 0, wins: 0, matches: 0, pointsAgainst: 0 };
                    players[n].games += sB; players[n].matches++;
                    players[n].pointsAgainst += sA;
                    if (sB > sA) players[n].wins++;
                });
            });

            const sorted = Object.values(players).sort((a, b) => b.games - a.games || b.wins - a.wins);
            const mvp = sorted[0];
            const intensity = Math.round((highIntensity / finishedMatches.length) * 100);

            return `
                <div class="summary-public fade-in" style="padding: 20px; color: white; display: flex; flex-direction: column; gap: 20px;">
                    
                    <!-- MVP HERO -->
                    <div style="background: linear-gradient(135deg, rgba(204,255,0,0.1) 0%, rgba(0,0,0,0.4) 100%); padding: 25px; border-radius: 20px; border: 1px solid var(--playtomic-neon); display: flex; align-items: center; gap: 20px; position: relative; overflow: hidden;">
                        <div style="font-size: 3rem;">👑</div>
                        <div>
                            <div style="color: var(--playtomic-neon); font-size: 0.7rem; font-weight: 800; letter-spacing: 2px;">MVP DE LA JORNADA</div>
                            <div style="font-size: 1.5rem; font-weight: 900; margin: 4px 0;">${mvp.name}</div>
                            <div style="font-size: 0.8rem; color: #aaa;">${mvp.games} juegos anotados en ${mvp.matches} partidos</div>
                        </div>
                        <div style="position: absolute; right: -10px; bottom: -10px; font-size: 5rem; opacity: 0.05;">🏆</div>
                    </div>

                    <!-- MINICARDS -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div style="background: rgba(255,255,255,0.03); border-radius: 15px; padding: 15px; text-align: center; border: 1px solid rgba(255,255,255,0.05);">
                            <div style="font-size: 0.6rem; color: #888; font-weight: 800;">CALIDAD JUEGO</div>
                            <div style="font-size: 1.2rem; font-weight: 900; color: var(--playtomic-neon); margin: 5px 0;">${intensity}%</div>
                            <div style="font-size: 0.6rem; color: #555;">Partidos al límite</div>
                        </div>
                        <div style="background: rgba(255,255,255,0.03); border-radius: 15px; padding: 15px; text-align: center; border: 1px solid rgba(255,255,255,0.05);">
                            <div style="font-size: 0.6rem; color: #888; font-weight: 800;">MURO DEFENSIVO</div>
                            <div style="font-size: 0.9rem; font-weight: 800; color: #3b82f6; margin: 5px 0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                                ${Object.values(players).sort((a, b) => a.pointsAgainst - b.pointsAgainst)[0].name.split(' ')[0]}
                            </div>
                            <div style="font-size: 0.6rem; color: #555;">Menos juegos encajados</div>
                        </div>
                    </div>

                    <!-- TOP RANKING TABLE -->
                    <div style="background: rgba(255,255,255,0.02); border-radius: 20px; overflow: hidden; border: 1px solid rgba(255,255,255,0.05);">
                        <div style="padding: 15px 20px; background: rgba(255,255,255,0.03); font-weight: 800; font-size: 0.8rem; color: var(--playtomic-neon);">
                             🔥 TOP RANKING ACTUAL
                        </div>
                        <div style="padding: 10px 0;">
                            ${sorted.slice(0, 8).map((p, i) => `
                                <div style="display: flex; align-items: center; padding: 10px 20px; border-bottom: 1px solid rgba(255,255,255,0.02);">
                                    <div style="width: 30px; font-weight: 900; color: ${i < 3 ? 'var(--playtomic-neon)' : '#555'};">
                                        ${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                                    </div>
                                    <div style="flex: 1; font-weight: 600; font-size: 0.9rem;">${p.name}</div>
                                    <div style="text-align: right;">
                                        <div style="font-weight: 900; color: white;">${p.games} <span style="font-size: 0.6rem; color: #666; font-weight: 400;">PTS</span></div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        <div style="padding: 15px; text-align: center; background: rgba(0,0,0,0.2); font-size: 0.7rem; color: #666;">
                            * Actualizado en tiempo real por el sistema SomosPadel
                        </div>
                    </div>

                </div>
            `;
        }

        renderScheduleView() {
            // Static Schedule for valid demo
            return `
                <div class="schedule-container fade-in" style="padding: 30px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:30px;">
                        <h2 style="color:white; font-family:'Outfit'; margin:0;">📅 CALENDARIO DE AMERICANAS</h2>
                    </div>
                    <div style="color:#888; text-align:center; padding:20px;">
                        Funcionalidad de calendario completa próximamente.
                    </div>
                </div>
            `;
        }

        renderResultsView(roundData, allRounds) {
            const tabs = this.renderRoundTabs(allRounds, roundData.number);

            return `
                <!-- FILTER BAR -->
                <div class="tour-filter-bar">
                   ${tabs}
                   <div style="flex:1;"></div>
                   <button class="btn-tour-control" onclick="window.EventsController.setTab('events')">SALIR</button>
                </div>

                <!-- MATCH GRID -->
                <div class="tour-grid-container">
                    ${roundData.matches.length ? '' : '<div style="color:#666; width:100%; text-align:center; padding:50px;">Esperando lanzamiento de ronda...</div>'}
                    ${roundData.matches.map(match => this.renderTournamentCard(match)).join('')}
                </div>
            `;
        }

        renderRoundTabs(rounds, currentNum) {
            return `
                <div class="round-tabs-container">
                    ${rounds.map(r => `
                        <button class="round-tab ${r.number === currentNum ? 'active' : ''}" onclick="window.TowerActions.goToRound(${r.number})">
                            ${r.number}º PARTIDO
                        </button>
                    `).join('')}
                </div>
            `;
        }

        renderStandingsView() {
            // TODO: Calculate Real Standings from matches
            return `
                <div class="standings-container fade-in" style="padding: 20px;">
                     <h2 style="color:white; font-family:'Outfit'; margin-bottom:20px;">Clasificación General</h2>
                     <p style="color:#888;">La clasificación se actualizará automáticamente al finalizar los partidos.</p>
                </div>
            `;
        }

        renderTournamentCard(match) {
            const colorClass = `border-${(match.court % 4) + 1}`;
            const statusText = match.isFinished ?
                '<span style="color:#4ADE80; font-weight:bold;">FINALIZADO</span>' :
                (match.isLive ? '<span style="color:var(--playtomic-neon); font-weight:bold;">EN JUEGO</span>' : '<span style="color:#666;">PROGRAMADO</span>');

            return `
                <div class="tour-match-card ${colorClass}">
                    <div class="tour-card-header">
                        <span class="cat-label">NIVEL 3.5 • G.A</span>
                        <div style="display:flex; gap:10px; align-items:center;">
                            <span class="court-label">PISTA ${match.court}</span>
                            ${statusText} 
                        </div>
                    </div>
                    
                    <div class="tour-card-body" style="padding-bottom:15px;">
                        <div class="tour-team-row">
                            <span class="tour-team-name">${match.teamA}</span>
                            <div class="tour-score-box">
                                <span class="score-num">${match.scoreA || 0}</span>
                            </div>
                        </div>
                        <div class="tour-team-row">
                            <span class="tour-team-name">${match.teamB}</span>
                            <div class="tour-score-box">
                                <span class="score-num">${match.scoreB || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    window.ControlTowerView = new ControlTowerView();

    // Global Actions for HTML handlers
    window.TowerActions = {
        goToRound: (n) => {
            window.ControlTowerView.selectedRound = n;
            window.ControlTowerView.recalc();
        }
    };

    console.log("🗼 ControlTowerView (Real-Time) Loaded");
})();
