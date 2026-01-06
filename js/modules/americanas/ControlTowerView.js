/**
 * ControlTowerView.js
 * The dedicated view for managing the live Americana.
 * Replicates the "Official Tournament" screen with Playtomic premium aesthetics.
 */
(function () {
    class ControlTowerView {
        constructor() {
            this.mainSection = 'playing'; // 'playing', 'history', 'help'
            this.activeTab = 'results'; // 'results', 'standings', 'summary'
            this.selectedRound = 1;
            this.allMatches = [];
            this.currentAmericanaId = null;
            this.currentAmericanaDoc = null;
            this.userHistory = [];
            this.unsubscribeMatches = null;
        }

        async load(americanaId) {
            this.currentAmericanaId = americanaId;
            this.selectedRound = 1;

            // Show loading
            this.render({ status: 'LOADING' });

            try {
                // Get doc for metadata
                const doc = await window.db.collection('americanas').doc(americanaId).get();
                this.currentAmericanaDoc = { id: doc.id, ...doc.data() };

                // UX Improvement: Check status explicitly
                if (this.currentAmericanaDoc.status === 'finished') {
                    this.activeTab = 'summary'; // Go straight to report
                } else {
                    this.activeTab = 'results';
                }
            } catch (e) {
                console.error("Error loading americana doc:", e);
            }

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
                });
        }

        async loadHistory() {
            const user = window.Store ? window.Store.getState('currentUser') : null;
            if (!user) return;

            try {
                const snap = await window.db.collection('americanas')
                    .where('players', 'array-contains', user.uid)
                    .orderBy('date', 'desc')
                    .get();
                this.userHistory = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                this.recalc();
            } catch (e) {
                console.error("History fail:", e);
                // Also try registeredPlayers as fallback
                try {
                    const snap2 = await window.db.collection('americanas')
                        .where('registeredPlayers', 'array-contains', user.uid)
                        .get();
                    this.userHistory = snap2.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    this.recalc();
                } catch (e2) { }
            }
        }

        async loadLatest() {
            this.render({ status: 'LOADING' });
            try {
                const user = window.Store ? window.Store.getState('currentUser') : null;
                const snap = await window.db.collection('americanas')
                    .orderBy('date', 'desc')
                    .limit(10)
                    .get();

                const events = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // Priority: User's, Live, Finished, Latest
                const myAmericana = user ? events.find(e =>
                    (e.players && e.players.includes(user.uid)) ||
                    (e.registeredPlayers && e.registeredPlayers.includes(user.uid))
                ) : null;

                const target = myAmericana ||
                    events.find(e => e.status === 'live') ||
                    events.find(e => e.status === 'finished') ||
                    events[0];

                if (target) {
                    this.load(target.id);
                } else {
                    this.renderEmptyState();
                }
            } catch (e) {
                console.error("Error loading latest:", e);
                this.renderEmptyState();
            }
        }

        renderEmptyState() {
            const container = document.getElementById('content-area');
            if (container) {
                container.innerHTML = `
                    <div style="padding: 80px 40px; text-align: center; color: #888; background: white; min-height: 80vh;">
                        <div style="width: 80px; height: 80px; background: #f8f8f8; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; border: 1px solid #eee;">
                            <i class="fas fa-trophy" style="font-size: 2.5rem; color: #ddd;"></i>
                        </div>
                        <h3 style="color: #111; font-weight: 800; font-family: 'Outfit';">SIN RESULTADOS</h3>
                        <p style="font-size: 0.95rem; line-height: 1.5; margin-top: 10px;">
                            No hay Americanas activas para mostrar en este momento.
                        </p>
                    </div>
                `;
            }
        }

        recalc() {
            const currentRoundMatches = this.allMatches.filter(m => m.round === this.selectedRound);
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
                        level_avg: m.level_avg || '3.5',
                        ...m
                    };
                }).sort((a, b) => a.court - b.court)
            };

            const roundsSchedule = [1, 2, 3, 4, 5, 6].map(r => ({ number: r }));

            this.render({
                currentRound: roundData,
                roundsSchedule: roundsSchedule
            });
        }

        switchTab(tab) {
            this.activeTab = tab;
            this.recalc();
        }

        switchSection(section) {
            this.mainSection = section;
            if (section === 'history') this.loadHistory();
            this.recalc();
        }

        render(data) {
            const container = document.getElementById('content-area');
            if (!container) return;

            const user = window.Store ? window.Store.getState('currentUser') : null;
            const isPlayingHere = this.currentAmericanaDoc && user && (
                (this.currentAmericanaDoc.players || []).includes(user.uid) ||
                (this.currentAmericanaDoc.registeredPlayers || []).includes(user.uid)
            );

            container.innerHTML = `
                <div class="tournament-layout fade-in" style="background: #F8F9FA;">
                    
                    <!-- NEW SUBMENU STRUCTURE -->
                    <div style="background: #000; padding: 10px; display: flex; justify-content: center; gap: 4px; border-bottom: 2px solid var(--playtomic-neon);">
                        <button onclick="window.ControlTowerView.switchSection('playing')" style="flex:1; border:none; background: ${this.mainSection === 'playing' ? 'var(--playtomic-neon)' : '#222'}; color: ${this.mainSection === 'playing' ? 'black' : 'white'}; padding: 14px 6px; border-radius: 8px; font-weight: 800; font-size: 0.65rem; transition: 0.3s; text-transform: uppercase;">Americanas en Juego</button>
                        <button onclick="window.ControlTowerView.switchSection('history')" style="flex:1; border:none; background: ${this.mainSection === 'history' ? 'var(--playtomic-neon)' : '#222'}; color: ${this.mainSection === 'history' ? 'black' : 'white'}; padding: 14px 6px; border-radius: 8px; font-weight: 800; font-size: 0.65rem; transition: 0.3s; text-transform: uppercase;">Mis Americanas</button>
                        <button onclick="window.ControlTowerView.switchSection('help')" style="flex:1; border:none; background: ${this.mainSection === 'help' ? 'var(--playtomic-neon)' : '#222'}; color: ${this.mainSection === 'help' ? 'black' : 'white'}; padding: 14px 6px; border-radius: 8px; font-weight: 800; font-size: 0.65rem; transition: 0.3s; text-transform: uppercase;">Ayuda</button>
                    </div>

                    ${this.renderMainArea(data, isPlayingHere)}

                    <!-- BOTTOM TICKER -->
                    <div class="tour-bottom-ticker" style="background: #000; border-top: 1px solid #1a1a1a;">
                        <div class="ticker-label">⚡ LIVE</div>
                        <div class="ticker-scroller">
                            <span>Sincronizado con SomosPadel Server • ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>
                </div>
            `;
        }

        renderMainArea(data, isPlayingHere) {
            if (this.mainSection === 'help') return this.renderHelpContent();
            if (this.mainSection === 'history') return this.renderHistoryContent();

            // DEFAULT: PLAYING AREA
            const roundData = data?.currentRound || { matches: [] };
            const amName = this.currentAmericanaDoc ? this.currentAmericanaDoc.name : "Americana Activa";

            return `
                <div class="tour-header-context" style="background: #000; padding: 25px 20px; text-align: center; border-bottom: 0px solid #1a1a1a;">
                    ${isPlayingHere ? `
                        <div style="background: rgba(204,255,0,0.1); border: 1px solid var(--playtomic-neon); color: var(--playtomic-neon); display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 0.6rem; font-weight: 900; margin-bottom: 12px; letter-spacing: 0.5px;">
                           ESTÁS PARTICIPANDO ✅
                        </div>
                    ` : ''}
                    
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
                        <img src="${this.currentAmericanaDoc?.image_url || 'img/logo_somospadel.png'}" 
                             style="width: 60px; height: 60px; border-radius: 50%; border: 2px solid var(--playtomic-neon); box-shadow: 0 0 15px rgba(204,255,0,0.3);"
                             onerror="this.src='img/logo_somospadel.png'">
                        <h1 style="color: white; margin: 0; font-family: 'Outfit'; font-weight: 900; font-size: 1.3rem; letter-spacing: -0.5px;">${amName.toUpperCase()}</h1>
                    </div>
                    
                    <div style="color: #888; font-size: 0.75rem; margin-top: 6px; font-weight: 700;">${this.currentAmericanaDoc?.date || ''} • ${(this.currentAmericanaDoc?.category === 'male' ? 'MASCULINA' :
                    this.currentAmericanaDoc?.category === 'female' ? 'FEMENINA' :
                        this.currentAmericanaDoc?.category === 'mixed' ? 'MIXTA' :
                            this.currentAmericanaDoc?.category === 'open' ? 'TODOS' : 'PRO')
                }</div>
                </div>

                <div class="tour-sub-nav" style="background: #fff; padding: 12px; display: flex; gap: 10px; border-bottom: 1px solid #eee; position: sticky; top: 0; z-index: 100;">
                    <button class="tour-menu-item ${this.activeTab === 'results' ? 'active' : ''}" style="flex:1" onclick="window.ControlTowerView.switchTab('results')">PARTIDOS</button>
                    <button class="tour-menu-item ${this.activeTab === 'standings' ? 'active' : ''}" style="flex:1" onclick="window.ControlTowerView.switchTab('standings')">POSICIONES</button>
                    <button class="tour-menu-item ${this.activeTab === 'summary' ? 'active' : ''}" style="flex:1" onclick="window.ControlTowerView.switchTab('summary')">ESTADÍSTICAS</button>
                </div>

                ${this.renderActiveContent(data, roundData)}
            `;
        }

        renderActiveContent(data, roundData) {
            if (data?.status === 'LOADING') return '<div class="loader" style="margin:80px auto;"></div>';

            switch (this.activeTab) {
                case 'standings': return this.renderStandingsView();
                case 'summary': return this.renderSummaryView();
                default:
                case 'results': return this.renderResultsView(roundData, data?.roundsSchedule || []);
            }
        }

        renderResultsView(roundData, allRounds) {
            const tabs = this.renderRoundTabs(allRounds, roundData.number);
            return `
                <div class="tour-filter-bar" style="background:#F8F9FA; padding: 12px; overflow-x: auto;">
                   ${tabs}
                </div>
                <div class="tour-grid-container" style="padding: 16px; display: grid; gap: 16px; padding-bottom: 100px;">
                    ${roundData.matches.length ? '' : '<div style="color:#999; width:100%; text-align:center; padding:60px; font-weight:700;">Selecciona una ronda válida...</div>'}
                    ${roundData.matches.map(match => this.renderTournamentCard(match)).join('')}
                </div>
            `;
        }

        renderRoundTabs(rounds, currentNum) {
            return `
                <div class="round-tabs-container" style="display:flex; gap:8px;">
                    ${rounds.map(r => `
                        <button class="round-tab ${r.number === parseInt(currentNum) ? 'active' : ''}" 
                                onclick="window.TowerActions.goToRound(${r.number})"
                                style="background: ${r.number === parseInt(currentNum) ? 'var(--playtomic-neon)' : 'white'}; 
                                       color: ${r.number === parseInt(currentNum) ? 'black' : '#666'}; 
                                       border: 1px solid ${r.number === parseInt(currentNum) ? 'var(--playtomic-neon)' : '#ddd'};
                                       padding: 8px 16px; border-radius: 8px; font-weight: 800;">
                            ${r.number}º
                        </button>
                    `).join('')}
                </div>
            `;
        }

        renderStandingsView() {
            const stats = {};
            this.allMatches.forEach(m => {
                if (m.status === 'finished') {
                    const namesA = Array.isArray(m.team_a_names) ? m.team_a_names : [m.team_a_names];
                    const namesB = Array.isArray(m.team_b_names) ? m.team_b_names : [m.team_b_names];
                    const sA = parseInt(m.score_a || 0);
                    const sB = parseInt(m.score_b || 0);

                    [...namesA, ...namesB].forEach(name => {
                        if (!name) return;
                        if (!stats[name]) stats[name] = { name, points: 0, wins: 0, matches: 0 };
                        stats[name].matches++;
                    });

                    namesA.forEach(name => { if (name) { stats[name].points += sA; if (sA > sB) stats[name].wins++; } });
                    namesB.forEach(name => { if (name) { stats[name].points += sB; if (sB > sA) stats[name].wins++; } });
                }
            });

            const ranking = Object.values(stats).sort((a, b) => b.points - a.points || b.wins - a.wins);

            return `
                <div class="standings-container fade-in" style="padding: 24px; background: white; min-height: 80vh; padding-bottom: 100px;">
                    <div style="background: #fff; border: 1px solid #eeeff2; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
                        <div style="padding: 18px; background: #fafafa; font-size: 0.65rem; font-weight: 800; color: #999; display: flex; border-bottom: 1px solid #f0f0f0; letter-spacing: 1px;">
                            <div style="width: 45px;">POS</div>
                            <div style="flex: 1;">JUGADOR</div>
                            <div style="width: 50px; text-align: center;">V</div>
                            <div style="width: 50px; text-align: center;">PTS</div>
                        </div>
                        ${ranking.length === 0 ? `
                             <div style="padding: 60px 20px; text-align: center; color: #ccc;">No hay datos aún.</div>
                        ` : ranking.map((p, i) => {
                // Highlight logic
                let rowStyle = 'background: white;';
                let posContent = i + 1;

                if (i === 0) { // WINNER
                    rowStyle = 'background: linear-gradient(90deg, rgba(255,215,0,0.15), rgba(255,255,255,0)); border-left: 5px solid #FFD700;';
                    posContent = '🏆';
                } else if (i === 1) { // FINALIST
                    rowStyle = 'background: linear-gradient(90deg, rgba(192,192,192,0.15), rgba(255,255,255,0)); border-left: 5px solid #C0C0C0;';
                    posContent = '🥈';
                } else if (i === 2) {
                    posContent = '🥉';
                }

                return `
                            <div style="padding: 16px 18px; display: flex; align-items: center; border-bottom: 1px solid #f9f9f9; ${rowStyle}">
                                <div style="width: 45px; font-weight: 900; font-size: 1.1rem; color: ${i < 3 ? '#000' : '#bbb'};">
                                    ${posContent}
                                </div>
                                <div style="flex: 1; font-weight: ${i < 2 ? '900' : '700'}; color: #111; font-size: 0.9rem;">${p.name}</div>
                                <div style="width: 50px; text-align: center; font-weight: 700; color: #25D366;">${p.wins}</div>
                                <div style="width: 50px; text-align: center; font-weight: 900; color: #000; font-size: 1.1rem;">${p.points}</div>
                            </div>
                        `;
            }).join('')}
                    </div>
                </div>
            `;
        }

        renderSummaryView() {
            const finishedMatches = this.allMatches.filter(m => m.status === 'finished');
            if (finishedMatches.length === 0) {
                return '<div style="padding: 100px 20px; text-align: center; color: #999;">Calculando estadísticas...</div>';
            }

            // --- Stats Calculation (Same as Admin) ---
            const players = {};
            const roundStats = {};
            let totalGames = 0;
            let highIntensityMatches = 0;

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

            // --- Advanced Highlights ---
            const courtGames = {};
            let bestBlowout = { diff: 0, match: null };
            finishedMatches.forEach(m => {
                const diff = Math.abs(parseInt(m.score_a) - parseInt(m.score_b));
                if (!courtGames[m.court]) courtGames[m.court] = 0;
                courtGames[m.court] += (parseInt(m.score_a) + parseInt(m.score_b));
                if (diff > bestBlowout.diff) bestBlowout = { diff, match: m };
            });
            const busiestCourtKey = Object.keys(courtGames).reduce((a, b) => courtGames[a] > courtGames[b] ? a : b, 1);
            const qualityStars = intensityPercent > 80 ? '⭐⭐⭐⭐⭐' : intensityPercent > 50 ? '⭐⭐⭐⭐' : '⭐⭐⭐';

            // --- RENDER UI (Adapted for Mobile) ---
            const html = `
                <div class="summary-dashboard animate-fade-in" style="display: flex; flex-direction: column; gap: 1.5rem; padding: 20px; padding-bottom: 120px; background: #f0f2f5;">
                    
                    <!-- MVP Card -->
                    <div style="background: linear-gradient(135deg, #000 0%, #1a1a1a 100%); border-radius: 20px; padding: 25px; position: relative; overflow: hidden; color: white; border: 1px solid #333; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
                         <div style="position: absolute; right: -10px; top: -10px; font-size: 6rem; opacity: 0.1;">🏆</div>
                         <div style="display:flex; align-items:center; gap: 20px;">
                             <div style="width: 70px; height: 70px; background: var(--playtomic-neon); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; color: black; font-weight:900;">1</div>
                             <div>
                                <div style="font-size: 0.7rem; font-weight: 800; color: var(--playtomic-neon); letter-spacing: 2px;">MVP TORNEO</div>
                                <div style="font-size: 1.5rem; font-weight: 900; color: white; margin: 2px 0;">${mvp.name}</div>
                                <div style="font-size: 0.8rem; color: #aaa;">${mvp.games} Puntos Totales</div>
                             </div>
                         </div>
                    </div>

                    <!-- Quick Stats Grid -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div style="background: white; padding: 15px; border-radius: 16px; text-align: center; border: 1px solid #eee;">
                            <div style="font-size: 0.65rem; color: #888; font-weight:800;">INTENSIDAD</div>
                            <div style="font-size: 1.5rem; font-weight: 900; color: #111;">${intensityPercent}%</div>
                            <div style="font-size: 0.7rem; color: #0055ff;">Partidos Reñidos</div>
                        </div>
                        <div style="background: white; padding: 15px; border-radius: 16px; text-align: center; border: 1px solid #eee;">
                            <div style="font-size: 0.65rem; color: #888; font-weight:800;">TOTAL JUEGOS</div>
                            <div style="font-size: 1.5rem; font-weight: 900; color: #111;">${totalGames}</div>
                            <div style="font-size: 0.7rem; color: #009900;">Media: ${(totalGames / Math.max(1, finishedMatches.length)).toFixed(1)}/p</div>
                        </div>
                    </div>

                    <!-- CHARTS SECTION -->
                    <div style="background: white; border-radius: 20px; padding: 20px; border: 1px solid #eee;">
                        <h3 style="margin:0 0 20px 0; font-weight: 900; font-size: 0.9rem; color: #111;">TOP 5 PLAYERS</h3>
                        <canvas id="publicTopPlayersChart" style="max-height: 200px; width:100%;"></canvas>
                    </div>

                    <div style="background: white; border-radius: 20px; padding: 20px; border: 1px solid #eee;">
                        <h3 style="margin:0 0 20px 0; font-weight: 900; font-size: 0.9rem; color: #111;">RITMO DEL TORNEO (Juegos x Ronda)</h3>
                        <canvas id="publicRoundEvolutionChart" style="max-height: 200px; width:100%;"></canvas>
                    </div>

                    <!-- Highlights List -->
                    <div style="background: white; border-radius: 20px; padding: 0; overflow: hidden; border: 1px solid #eee;">
                        <div style="padding: 15px; border-bottom: 1px solid #eee; font-weight: 900; font-size: 0.9rem;">Datos Curiosos</div>
                        
                        <div style="padding: 15px; border-bottom: 1px solid #f5f5f5; display: flex; align-items:center; gap: 15px;">
                            <div style="font-size: 1.5rem;">🔥</div>
                            <div>
                                <div style="font-weight: 800; font-size: 0.8rem;">PISTA EN LLAMAS</div>
                                <div style="font-size: 0.75rem; color: #666;">La Pista ${busiestCourtKey} ha visto más juegos (${courtGames[busiestCourtKey]})</div>
                            </div>
                        </div>

                        <div style="padding: 15px; display: flex; align-items:center; gap: 15px;">
                             <div style="font-size: 1.5rem;">🥊</div>
                            <div>
                                <div style="font-weight: 800; font-size: 0.8rem;">MAYOR PALIZA</div>
                                <div style="font-size: 0.75rem; color: #666;">Diferencia de ${bestBlowout.diff} juegos en un solo partido</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Initialize Charts Async
            setTimeout(() => {
                const ctx1 = document.getElementById('publicTopPlayersChart')?.getContext('2d');
                if (ctx1) {
                    new Chart(ctx1, {
                        type: 'bar',
                        data: {
                            labels: top5.map(p => p.name.split(' ')[0]),
                            datasets: [{
                                label: 'Puntos',
                                data: top5.map(p => p.games),
                                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                                borderRadius: 6
                            }]
                        },
                        options: { responsive: true, plugins: { legend: { display: false } } }
                    });
                }

                const ctx2 = document.getElementById('publicRoundEvolutionChart')?.getContext('2d');
                if (ctx2) {
                    const rounds = Object.keys(roundStats).sort();
                    new Chart(ctx2, {
                        type: 'line',
                        data: {
                            labels: rounds.map(r => `R${r}`),
                            datasets: [{
                                label: 'Juegos Totales',
                                data: rounds.map(r => roundStats[r]),
                                borderColor: '#ccff00',
                                backgroundColor: 'rgba(204,255,0,0.1)',
                                fill: true,
                                tension: 0.4,
                                pointRadius: 4
                            }]
                        },
                        options: { responsive: true, plugins: { legend: { display: false } } }
                    });
                }
            }, 200);

            return html;
        }

        renderTournamentCard(match) {
            const colorClass = `border-${(match.court % 4) + 1}`;
            const statusText = match.isFinished ?
                '<span style="color:#25D366; font-weight:800;">FINALIZADO</span>' :
                (match.isLive ? '<span style="color:var(--playtomic-neon); font-weight:800; animation: blink 1.5s infinite;">EN JUEGO</span>' : '<span style="color:#BBB;">ESPERANDO</span>');

            const sA = parseInt(match.scoreA || 0);
            const sB = parseInt(match.scoreB || 0);

            // --- 1. Calcular Horario del Partido ---
            // Base: Americana Start Time. Cada ronda +20 min.
            let timeLabel = "00:00";
            if (this.currentAmericanaDoc && this.currentAmericanaDoc.time) {
                const [h, m] = this.currentAmericanaDoc.time.split(':').map(Number);
                const roundOffset = (match.round - 1) * 20;
                const date = new Date();
                date.setHours(h, m + roundOffset);
                timeLabel = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }

            // --- 2. Estilos WOW para Ganadores ---
            // Fondo Neon, Texto Negro, Padding, Border Radius
            const winnerStyle = "background: var(--playtomic-neon); color: black !important; padding: 6px 10px; border-radius: 8px; font-weight: 900 !important; box-shadow: 0 0 10px rgba(204,255,0,0.4); text-decoration: none;";
            const normalStyle = "color: #111; font-weight: 800; padding: 6px 0;";

            const styleA = (match.isFinished && sA > sB) ? winnerStyle : normalStyle;
            const styleB = (match.isFinished && sB > sA) ? winnerStyle : normalStyle;

            return `
                <div class="tour-match-card ${colorClass}" style="background:white; border-radius:20px; border: 1px solid #eeeff2; overflow:hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.02);">
                    <div style="padding: 12px 18px; background: #fafafa; border-bottom: 1px solid #f0f0f0; display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size: 0.6rem; font-weight: 900; color: #999; letter-spacing: 0.5px;">PISTA ${match.court} • 🕒 ${timeLabel}</span>
                        <div style="font-size: 0.65rem;">${statusText}</div>
                    </div>
                    <div style="padding: 18px;">
                        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 12px;">
                            <div style="font-size: 0.95rem; flex:1; transition: all 0.3s; margin-right: 10px; ${styleA}">${match.teamA}</div>
                            <div style="background: ${match.isFinished && sA > sB ? 'var(--playtomic-neon)' : '#f0f0f0'}; color: ${match.isFinished && sA > sB ? 'black' : 'black'}; width: 35px; height: 35px; border-radius: 10px; display:flex; align-items:center; justify-content:center; font-weight: 900; font-size: 1.2rem; box-shadow: ${match.isFinished && sA > sB ? '0 0 10px rgba(204,255,0,0.5)' : 'none'};">${match.scoreA || 0}</div>
                        </div>
                        <div style="height:1px; background:#f5f5f5; margin-bottom:12px;"></div>
                        <div style="display:flex; align-items:center; justify-content:space-between;">
                            <div style="font-size: 0.95rem; flex:1; transition: all 0.3s; margin-right: 10px; ${styleB}">${match.teamB}</div>
                            <div style="background: ${match.isFinished && sB > sA ? 'var(--playtomic-neon)' : '#f0f0f0'}; color: ${match.isFinished && sB > sA ? 'black' : 'black'}; width: 35px; height: 35px; border-radius: 10px; display:flex; align-items:center; justify-content:center; font-weight: 900; font-size: 1.2rem; box-shadow: ${match.isFinished && sB > sA ? '0 0 10px rgba(204,255,0,0.5)' : 'none'};">${match.scoreB || 0}</div>
                        </div>
                    </div>
                </div>
            `;
        }

        renderHistoryContent() {
            let totalTours = this.userHistory.length;
            let totalGames = totalTours * 25; // Placeholder
            return `
                <div class="fade-in" style="padding: 24px; min-height: 80vh; background: white;">
                    <div style="background: #000; border-radius: 20px; padding: 25px; margin-bottom: 25px; color: white; display: flex; justify-content: space-around; text-align: center; border: 1px solid var(--playtomic-neon);">
                        <div>
                            <div style="color: var(--playtomic-neon); font-size: 1.5rem; font-weight: 900;">${totalTours}</div>
                            <div style="font-size: 0.6rem; font-weight: 800; opacity: 0.6;">EVENTOS</div>
                        </div>
                        <div style="width: 1px; background: #333;"></div>
                        <div>
                            <div style="color: white; font-size: 1.5rem; font-weight: 900;">${totalGames}</div>
                            <div style="font-size: 0.6rem; font-weight: 800; opacity: 0.6;">JUEGOS</div>
                        </div>
                    </div>
                    <h3 style="font-family:'Outfit'; font-weight: 900; color: #111; margin-bottom: 20px;">Estadísticas Históricas</h3>
                    <div style="display: grid; gap: 12px; padding-bottom: 100px;">
                        ${this.userHistory.length === 0 ? '<p style="color:#ccc; text-align:center;">No hay historial aún.</p>' :
                    this.userHistory.map(h => `
                            <div class="tour-match-card" style="padding: 18px; border: 1px solid #eee; border-radius: 16px;" onclick="window.ControlTowerView.load('${h.id}'); window.ControlTowerView.switchSection('playing');">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <div>
                                        <div style="font-weight: 900; font-size: 0.95rem;">${h.name}</div>
                                        <div style="font-size: 0.7rem; color: #888;">${h.date} • ${(h.category === 'male' ? 'MASCULINA' :
                            h.category === 'female' ? 'FEMENINA' :
                                h.category === 'mixed' ? 'MIXTA' :
                                    h.category === 'open' ? 'TODOS' : 'PRO')
                        }</div>
                                    </div>
                                    <div style="color: var(--playtomic-neon); font-size: 0.8rem; font-weight: 900;">DETALLES ></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        renderHelpContent() {
            return `
                <div class="fade-in" style="padding: 30px; min-height: 80vh; background: white; padding-bottom: 100px;">
                    <h2 style="font-family:'Outfit'; font-weight: 900; color: #111; margin-bottom: 30px;">Centro de Ayuda</h2>
                    <div style="display: grid; gap: 20px;">
                        <div style="background: #f9f9f9; padding: 25px; border-radius: 20px; border: 1px solid #eee;">
                            <div style="font-weight: 900; margin-bottom: 10px; color: #0055ff; font-size: 1.1rem;">📑 Reglas del Ranking</div>
                            <p style="font-size: 0.85rem; color: #555; line-height: 1.6;">Cada juego ganado suma 1 punto. Tras 6 partidos, el jugador con más puntos totales es coronado MVP.</p>
                        </div>
                        <div style="background: #f9f9f9; padding: 25px; border-radius: 20px; border: 1px solid #eee;">
                            <div style="font-weight: 900; margin-bottom: 10px; color: #0055ff; font-size: 1.1rem;">📈 Niveles Dinámicos</div>
                            <p style="font-size: 0.85rem; color: #555; line-height: 1.6;">Nuestro sistema IA evalúa tu nivel cada partido. Si ganas con autoridad contra rivales fuertes, tu nivel subirá automáticamente.</p>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    window.ControlTowerView = new ControlTowerView();
    window.TowerActions = {
        goToRound: (n) => {
            window.ControlTowerView.selectedRound = n;
            window.ControlTowerView.recalc();
        }
    };
    console.log("🗼 ControlTowerView (Pro) Initialized");
})();
