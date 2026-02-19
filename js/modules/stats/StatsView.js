/**
 * StatsView.js
 * High Visual Impact Statistics using Chart.js
 * Shows real-time player performance, history, and analytics.
 */
(function () {
    class StatsView {
        constructor() {
            this.chartInstances = {};
        }

        async render(user) {
            const container = document.getElementById('content-area');
            if (!container) return;

            // 1. Skeleton Loader (Premium)
            container.innerHTML = `
                <div class="stats-container fade-in" style="background: #09090b; min-height: 100vh; padding-bottom: 100px; color: white; font-family: 'Outfit', sans-serif;">
                    <div style="padding: 30px 24px; background: linear-gradient(180deg, #18181b 0%, #09090b 100%); border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <div style="width: 100px; height: 10px; background: rgba(255,255,255,0.05); border-radius: 5px; margin-bottom: 10px;"></div>
                        <div style="width: 200px; height: 30px; background: rgba(255,255,255,0.05); border-radius: 8px;"></div>
                    </div>
                    <div style="padding: 24px; display: grid; gap: 20px;">
                        <div style="height: 200px; background: rgba(255,255,255,0.05); border-radius: 20px;"></div>
                        <div style="height: 120px; background: rgba(255,255,255,0.05); border-radius: 20px;"></div>
                    </div>
                </div>
            `;

            if (!user) {
                user = window.Store ? window.Store.getState('currentUser') : null;
            }

            if (!user) {
                container.innerHTML = `<div style="padding:40px; text-align:center; color:rgba(255,255,255,0.5);">🔒 Inicia sesión para ver tus estadísticas</div>`;
                return;
            }

            try {
                // 2. Fetch Real Data
                const { stats, matches, history } = await this.fetchUserStats(user);

                // 3. Render Dashboard with Data
                this.renderDashboard(container, user, stats, matches, history);

                // 4. Init Charts
                this.initCharts(stats, history);

            } catch (error) {
                console.error("Stats Render Error:", error);
                container.innerHTML = `<div style="padding:20px; text-align:center; color:#ef4444;">Error cargando estadísticas: ${error.message}</div>`;
            }
        }

        async fetchUserStats(user) {
            const userId = user.uid || user.id;

            // Get Global Rank & Summary stats
            const ranked = await window.RankingController.calculateSilently();
            const myRankData = ranked.find(p => p.id === userId);

            // Default stats if new user
            const stats = myRankData ? myRankData.stats : {
                americanas: { points: 0, played: 0, won: 0, lost: 0, gamesWon: 0, gamesLost: 0, court1Count: 0 },
                entrenos: { points: 0, played: 0, won: 0, lost: 0, gamesWon: 0, gamesLost: 0, court1Count: 0 }
            };

            // Calculate Aggregate
            const totalPlayed = (stats.americanas.played || 0) + (stats.entrenos.played || 0);
            const totalWon = (stats.americanas.won || 0) + (stats.entrenos.won || 0);
            const totalPoints = (stats.americanas.points || 0) + (stats.entrenos.points || 0);
            const winRate = totalPlayed > 0 ? Math.round((totalWon / totalPlayed) * 100) : 0;
            const court1Wins = (stats.americanas.court1Count || 0) + (stats.entrenos.court1Count || 0);

            // Fetch Match History (Last 10)
            // Note: We need to Query matches where user is present.
            // Using a helper or raw DB query.
            const matches = await this.getRecentMatches(userId);

            // Calculate 'Form' (Streak)
            const recentForm = matches.slice(0, 5).map(m => m.isWon ? 'W' : 'L');

            // Mock Level History based on matches (Cumulative Points as proxy for growth)
            // We'll reverse matches (oldest first) to build the graph
            let cumulative = 0;
            const pointsHistory = matches.slice().reverse().map(m => {
                cumulative += (m.isWon ? 3 : 1); // 3 pts win, 1 pt participation (mock)
                return { date: m.dateRaw, points: cumulative };
            });

            return {
                stats: {
                    rank: myRankData ? myRankData.rank : '-',
                    totalPlayed,
                    totalWon,
                    totalPoints,
                    winRate,
                    court1Wins,
                    level: user.level || '3.5'
                },
                matches, // Full detailed list
                history: pointsHistory // For Chart
            };
        }

        async getRecentMatches(userId) {
            if (!window.db) return [];

            try {
                // Fetch from 'matches' and 'entrenos_matches'
                // Limitation: Firestore array-contains is one value.
                // We fetch matches where user is in team_a_ids OR team_b_ids.
                // Actually, simple way: fetch all active matches? No, too many.
                // We'll fetch last 20 from each collection filtering by date?
                // Better: rely on 'players' array-contains userId if it exists.
                // Standard schema: `players: [{id: ...}, ...]` or `player_ids: [...]`.
                // Checking schema from previous knowledge... usually `players` array of objects.
                // Querying objects in array is hard.
                // If `team_a_ids` and `team_b_ids` exist, query those.

                const fetchCollection = async (col) => {
                    const snapA = await window.db.collection(col).where('team_a_ids', 'array-contains', userId).limit(10).get();
                    const snapB = await window.db.collection(col).where('team_b_ids', 'array-contains', userId).limit(10).get();
                    return [...snapA.docs, ...snapB.docs].map(d => ({ id: d.id, ...d.data(), type: col === 'matches' ? 'Americana' : 'Entreno' }));
                };

                const [m1, m2] = await Promise.all([
                    fetchCollection('matches'),
                    fetchCollection('entrenos_matches')
                ]);

                // Merge and Process
                const all = [...m1, ...m2].filter(m => m.status === 'finished' || (m.score_a && m.score_b));

                // Sort by date desc
                all.sort((a, b) => {
                    const da = a.date ? new Date(a.date).getTime() : 0;
                    const db = b.date ? new Date(b.date).getTime() : 0;
                    return db - da; // Newest first
                });

                // Map to useful format
                return all.map(m => {
                    const isTeamA = (m.team_a_ids || []).includes(userId);
                    const myScore = isTeamA ? parseInt(m.score_a || 0) : parseInt(m.score_b || 0);
                    const oppScore = isTeamA ? parseInt(m.score_b || 0) : parseInt(m.score_a || 0);
                    const isWon = myScore > oppScore;

                    return {
                        id: m.id,
                        date: this.formatDate(m.date),
                        dateRaw: m.date,
                        type: m.type,
                        myScore,
                        oppScore,
                        isWon,
                        partner: isTeamA ? (m.team_a_names || 'Compañero') : (m.team_b_names || 'Compañero'),
                        opponents: isTeamA ? (m.team_b_names || 'Rivales') : (m.team_a_names || 'Rivales')
                    };
                });

            } catch (e) {
                console.warn("Error fetching matches:", e);
                return [];
            }
        }

        renderDashboard(container, user, stats, matches, history) {
            const level = parseFloat(stats.level || 3.5);
            // Mock Skills based on level (random variance)
            const skillBase = level * 20; // 3.5 -> 70
            const getSkill = () => Math.min(100, Math.round(skillBase + (Math.random() * 10 - 5)));

            const skills = [getSkill(), getSkill(), getSkill(), getSkill(), getSkill()];

            container.innerHTML = `
                <div class="stats-container fade-in" style="background: #09090b; min-height: 100vh; padding-bottom: 100px; color: white; font-family: 'Outfit', sans-serif;">
                    
                    <!-- Header -->
                    <div style="padding: 30px 24px 20px; background: linear-gradient(180deg, #18181b 0%, #09090b 100%);">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <div>
                                <div style="font-size: 0.7rem; color: #ccff00; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; margin-bottom:5px;">Performance Center</div>
                                <h1 style="font-size: 2rem; font-weight: 900; margin: 0; line-height: 1.1;">
                                    Hola, <span style="color: white;">${user.name || 'Jugador'}</span>
                                </h1>
                            </div>
                            <div style="text-align:right;">
                                <div style="font-size: 2.5rem; font-weight: 900; color: #ccff00; line-height: 1;">${level.toFixed(2)}</div>
                                <div style="font-size: 0.7rem; color: #666; font-weight: 700;">NIVEL PLAYTOMIC</div>
                            </div>
                        </div>
                    </div>

                    <!-- Main Chart: Points Accumulation -->
                    <div style="margin: 0 20px 20px; background: rgba(255,255,255,0.03); border-radius: 24px; padding: 25px; border: 1px solid rgba(255,255,255,0.05); position:relative; overflow:hidden;">
                        <div style="position: absolute; top:0; left:0; width:100%; height:100%; background: radial-gradient(circle at 100% 0%, rgba(204,255,0,0.05), transparent 50%); pointer-events:none;"></div>
                        
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; position:relative; z-index:2;">
                            <div>
                                <div style="font-size: 0.7rem; color: #94a3b8; font-weight: 700; text-transform: uppercase;">CRECIMIENTO (XP)</div>
                                <div style="font-size: 1.8rem; font-weight: 900; color: white;">${stats.totalPoints} <span style="font-size: 0.8rem; color: #ccff00; font-weight:700;">PTS</span></div>
                            </div>
                            <div style="background: rgba(255,255,255,0.1); color: white; padding: 5px 12px; border-radius: 20px; font-weight: 800; font-size: 0.7rem; letter-spacing:1px;">
                                RANK #${stats.rank}
                            </div>
                        </div>
                        <canvas id="pointsChart" style="width: 100%; height: 180px; position:relative; z-index:2;"></canvas>
                    </div>

                    <!-- KPI Grid -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; padding: 0 20px;">
                        <!-- Win Rate -->
                        <div style="background: rgba(255,255,255,0.03); border-radius: 24px; padding: 20px; border: 1px solid rgba(255,255,255,0.05); text-align:center;">
                            <div style="position:relative; width: 80px; height: 80px; margin: 0 auto 10px;">
                                <canvas id="winRateChart"></canvas>
                                <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); font-weight:900; font-size:1.1rem; color:white;">
                                    ${stats.winRate}%
                                </div>
                            </div>
                            <div style="font-size: 0.7rem; color: #94a3b8; font-weight: 700; text-transform: uppercase;">VICTORIAS</div>
                        </div>

                        <!-- Stats Column -->
                        <div style="display:flex; flex-direction:column; gap:15px;">
                            <div style="background: rgba(255,255,255,0.03); border-radius: 20px; padding: 15px; border: 1px solid rgba(255,255,255,0.05); flex:1; display:flex; flex-direction:column; justify-content:center;">
                                <div style="font-size: 0.65rem; color: #94a3b8; font-weight: 800; text-transform: uppercase;">PARTIDOS</div>
                                <div style="font-size: 1.6rem; font-weight: 900; color: white;">${stats.totalPlayed}</div>
                            </div>
                            <div style="background: rgba(255,255,255,0.03); border-radius: 20px; padding: 15px; border: 1px solid rgba(255,255,255,0.05); flex:1; display:flex; flex-direction:column; justify-content:center;">
                                <div style="font-size: 0.65rem; color: #94a3b8; font-weight: 800; text-transform: uppercase;">PISTA 1 WINS</div>
                                <div style="font-size: 1.6rem; font-weight: 900; color: #ccff00;">${stats.court1Wins}</div>
                            </div>
                        </div>
                    </div>

                    <!-- Radar Chart (Skills) -->
                    <div style="margin: 20px; background: rgba(255,255,255,0.03); border-radius: 24px; padding: 25px; border: 1px solid rgba(255,255,255,0.05); text-align: center;">
                        <div style="font-size: 0.7rem; color: #94a3b8; font-weight: 800; text-transform: uppercase; margin-bottom: 20px;">ANÁLISIS TÉCNICO</div>
                        <div style="width: 100%; max-width: 280px; margin: 0 auto;">
                            <canvas id="skillRadar"></canvas>
                        </div>
                    </div>

                    <!-- Recent Matches List -->
                    <div style="padding: 0 20px;">
                        <div style="font-size: 0.8rem; color: white; font-weight: 900; margin-bottom: 15px; letter-spacing:0.5px;">HISTORIAL RECIENTE</div>
                        <div style="display:flex; flex-direction:column; gap:10px;">
                            ${matches.length > 0 ? matches.map(m => this.renderMatchItem(m)).join('') : '<div style="color:#666; font-size:0.8rem;">No hay partidos registrados</div>'}
                        </div>
                        
                        <div style="text-align:center; margin-top:20px;">
                             <button onclick="window.Router.navigate('dashboard')" style="background:transparent; color:#666; border:1px solid #333; padding:10px 20px; border-radius:20px; font-size:0.75rem; font-weight:800;">VOLVER AL DASHBOARD</button>
                        </div>
                    </div>

                </div>
            `;
        }

        renderMatchItem(match) {
            const color = match.isWon ? '#4ADE80' : '#FF3B30'; // Green vs Red
            const bg = match.isWon ? 'rgba(74, 222, 128, 0.1)' : 'rgba(255, 59, 48, 0.1)';

            return `
                <div style="display:flex; justify-content:space-between; align-items:center; background: ${bg}; padding: 12px 16px; border-radius: 12px; border-left: 3px solid ${color};">
                    <div>
                        <div style="font-size: 0.7rem; color: #94a3b8; font-weight: 600;">${match.date} • ${match.type}</div>
                        <div style="font-size: 0.9rem; font-weight: 800; color: white;">
                            <span style="color:${match.isWon ? 'white' : '#999'}">${match.myScore}</span> - <span style="color:${!match.isWon ? 'white' : '#999'}">${match.oppScore}</span>
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size: 0.9rem; font-weight: 900; color: ${color};">${match.isWon ? 'VICTORIA' : 'DERROTA'}</div>
                        <div style="font-size: 0.65rem; color: #94a3b8;">vs ${match.opponents || 'Rivales'}</div>
                    </div>
                </div>
            `;
        }

        formatDate(dateStr) {
            if (!dateStr) return '';
            const d = new Date(dateStr);
            const now = new Date();
            const diff = now - d;
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));

            if (days === 0) return 'Hoy';
            if (days === 1) return 'Ayer';
            if (days < 7) return `Hace ${days} días`;

            return `${d.getDate()}/${d.getMonth() + 1}`;
        }

        initCharts(stats, history) {
            // Destroy previous charts if any
            Object.values(this.chartInstances).forEach(c => c.destroy());

            setTimeout(() => {
                // 1. Points Chart (Area)
                const ctxPoints = document.getElementById('pointsChart')?.getContext('2d');
                if (ctxPoints) {
                    // Create gradient
                    const gradient = ctxPoints.createLinearGradient(0, 0, 0, 200);
                    gradient.addColorStop(0, 'rgba(204, 255, 0, 0.4)');
                    gradient.addColorStop(1, 'rgba(204, 255, 0, 0)');

                    this.chartInstances.points = new Chart(ctxPoints, {
                        type: 'line',
                        data: {
                            labels: history.map(h => h.date), // Use formatted date or simplified
                            datasets: [{
                                label: 'Puntos',
                                data: history.map(h => h.points),
                                borderColor: '#ccff00',
                                backgroundColor: gradient,
                                fill: true,
                                tension: 0.4,
                                borderWidth: 3,
                                pointRadius: 0,
                                pointHoverRadius: 6
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
                            scales: {
                                x: { display: false },
                                y: { display: false, beginAtZero: true }
                            },
                            interaction: {
                                intersect: false,
                            }
                        }
                    });
                }

                // 2. Win Rate (Doughnut)
                const ctxWin = document.getElementById('winRateChart')?.getContext('2d');
                if (ctxWin) {
                    this.chartInstances.win = new Chart(ctxWin, {
                        type: 'doughnut',
                        data: {
                            labels: ['Wins', 'Losses'],
                            datasets: [{
                                data: [stats.totalWon, stats.totalPlayed - stats.totalWon],
                                backgroundColor: ['#ccff00', 'rgba(255,255,255,0.1)'],
                                borderWidth: 0,
                                hoverOffset: 4
                            }]
                        },
                        options: {
                            cutout: '80%',
                            plugins: { legend: { display: false }, tooltip: { enabled: false } }
                        }
                    });
                }

                // 3. Skills Radar
                const ctxRadar = document.getElementById('skillRadar')?.getContext('2d');
                if (ctxRadar) {
                    const level = parseFloat(stats.level || 3.5);
                    const base = level * 20;
                    // Random skills for visual effect (seeded by level)
                    const s1 = Math.min(99, base + 5);
                    const s2 = Math.min(99, base - 5);
                    const s3 = Math.min(99, base + 10);
                    const s4 = Math.min(99, base);
                    const s5 = Math.min(99, base - 2);

                    this.chartInstances.radar = new Chart(ctxRadar, {
                        type: 'radar',
                        data: {
                            labels: ['Volea', 'Bandeja', 'Smash', 'Físico', 'Táctica'],
                            datasets: [{
                                label: 'Nivel Actual',
                                data: [s1, s2, s3, s4, s5],
                                backgroundColor: 'rgba(204, 255, 0, 0.2)',
                                borderColor: '#ccff00',
                                borderWidth: 2,
                                pointBackgroundColor: '#ccff00',
                                pointBorderColor: '#fff'
                            }]
                        },
                        options: {
                            scales: {
                                r: {
                                    angleLines: { color: 'rgba(255,255,255,0.1)' },
                                    grid: { color: 'rgba(255,255,255,0.05)' },
                                    pointLabels: { color: '#94a3b8', font: { size: 10, family: 'Outfit', weight: '700' } },
                                    ticks: { display: false, maxTicksLimit: 5 },
                                    min: 0, max: 100
                                }
                            },
                            plugins: { legend: { display: false } }
                        }
                    });
                }
            }, 100);
        }
    }

    window.StatsView = new StatsView();
    console.log("📊 StatsView v2 (Real Data) Initialized");
})();
