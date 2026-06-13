/**
 * RankingView.js
 * Premium Matte Dark SMART Ranking View for SomosPadel
 */
(function () {
    class RankingView {
        constructor() {
            this.currentView = 'entrenos'; // americanas | entrenos
            this.currentCategory = 'todas'; // todas | male | female | mixed
            this.playersData = [];
            this.isSearching = false;
        }

        render(players) {
            this.playersData = players;
            const container = document.getElementById('content-area');
            if (!container) return;

            // 0. Process data for current view/category
            const rankedData = this.getProcessedData();

            container.innerHTML = `
                <div class="ranking-global-wrapper fade-in" style="
                    background: #f8fafc;
                    min-height: 100vh; 
                    font-family: 'Outfit', sans-serif; 
                    color: #0a192f; 
                    padding-bottom: 100px;
                    position: relative;
                    overflow-x: hidden;
                ">
                    <!-- Background Glow Elements -->
                    <div style="position: absolute; top: 0; left: 0; width: 100%; height: 500px; background: radial-gradient(circle at 0% 0%, rgba(132, 204, 22, 0.08) 0%, transparent 70%); pointer-events: none;"></div>
                    <div style="position: absolute; top: 200px; right: -100px; width: 400px; height: 400px; background: radial-gradient(circle, rgba(59, 130, 246, 0.05) 0%, transparent 70%); pointer-events: none;"></div>
                    
                    <!-- 1. PREMIUM HEADER -->
                    <div style="padding: 40px 25px 20px; position: relative; z-index: 5;">
                        <div style="position: absolute; top: -10px; right: -10px; font-size: 8rem; color: rgba(255, 255, 255, 0.02); font-weight: 950; transform: rotate(-5deg); pointer-events: none;">RANK</div>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; position: relative;">
                            <div>
                                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
                                    <div style="width: 10px; height: 10px; border-radius: 2px; background: #84cc16; box-shadow: 0 0 15px #84cc16;"></div>
                                    <span style="color: #64748b; font-size: 0.65rem; font-weight: 900; letter-spacing: 2px; text-transform: uppercase;">Somospadel World Tour</span>
                                </div>
                                <h1 style="font-weight: 950; font-size: 2.5rem; margin: 0; letter-spacing: -1.5px; color: #0a192f; line-height: 1.1; display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                                    RANKING <span style="background: linear-gradient(90deg, #CCFF00, #84cc16); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">PRO</span>
                                    <span onclick="window.showRolesLegendModal()" style="cursor: pointer; font-size: 0.6rem; font-weight: 950; padding: 4px 10px; border-radius: 10px; background: rgba(100, 116, 139, 0.08); color: #475569; border: 1px solid rgba(100, 116, 139, 0.15); text-transform: uppercase; letter-spacing: 1px; display: inline-flex; align-items: center; gap: 4px; transition: all 0.2s;" onmouseover="this.style.background='rgba(204,255,0,0.1)'; this.style.borderColor='rgba(204,255,0,0.3)'; this.style.color='#72a800';" onmouseout="this.style.background='rgba(100, 116, 139, 0.08)'; this.style.borderColor='rgba(100, 116, 139, 0.15)'; this.style.color='#475569';">
                                        <i class="fas fa-question-circle"></i> Info Roles
                                    </span>
                                </h1>
                            </div>
                            <!-- 🏆 TOP RÉCORDS ACCESS -->
                            <button onclick="window.Router.navigate('records')" 
                                    style="background: linear-gradient(135deg, #FFD700 0%, #B8860B 100%); color: black; border: none; padding: 10px 18px; border-radius: 14px; font-weight: 950; font-size: 0.65rem; display: flex; align-items: center; gap: 8px; box-shadow: 0 10px 20px rgba(255, 215, 0, 0.2); cursor: pointer; transition: 0.3s; transform: rotate(1deg);">
                                <i class="fas fa-award"></i> TOP RÉCORDS
                            </button>
                        </div>
                    </div>

                    <!-- 2. OLYMPIC PODIUM (Top 3 Visual) -->
                    <div id="ranking-podium-root" style="position: relative; z-index: 4;">
                        ${this.renderPodium(rankedData)}
                    </div>

                    <!-- 2.5 COMPARACIÓN DE RENDIMIENTO (Powerful Radar Chart) -->
                    <div id="ranking-performance-chart-container" style="padding: 0 25px 20px; position: relative; z-index: 4; display: none;">
                        <div style="
                            background: #ffffff;
                            border: 1px solid #e2e8f0;
                            border-radius: 32px;
                            padding: 24px;
                            box-shadow: 0 10px 30px rgba(0,0,0,0.02);
                        ">
                            <div style="font-weight:950; font-size:0.75rem; color:#0a192f; letter-spacing:1px; text-transform:uppercase; margin-bottom:15px; display:flex; align-items:center; gap:8px;">
                                <i class="fas fa-chart-pie" style="color: #84cc16; font-size: 1.15rem;"></i>
                                PREDICCIÓN & MÉTRICAS COMPARATIVAS
                            </div>
                            
                            <div style="position: relative; height: 260px; width: 100%; display: flex; justify-content: center; align-items: center;">
                                <canvas id="ranking-performance-radar-chart"></canvas>
                            </div>
                            
                            <div style="margin-top: 15px; display: flex; justify-content: center; gap: 15px; flex-wrap: wrap;">
                                <div style="display: flex; align-items: center; gap: 6px; font-size: 0.65rem; font-weight: 800; color: #475569;">
                                    <span style="width: 12px; height: 12px; background: #84cc16; border-radius: 3px; display: inline-block;"></span>
                                    TÚ (JUGADOR PRO)
                                </div>
                                <div style="display: flex; align-items: center; gap: 6px; font-size: 0.65rem; font-weight: 800; color: #475569;">
                                    <span style="width: 12px; height: 12px; background: #FFD700; border-radius: 3px; display: inline-block;"></span>
                                    LÍDER RANKING (MVP)
                                </div>
                                <div style="display: flex; align-items: center; gap: 6px; font-size: 0.65rem; font-weight: 800; color: #475569;">
                                    <span style="width: 12px; height: 12px; background: #3b82f6; border-radius: 3px; display: inline-block;"></span>
                                    PROMEDIO CLUB
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 3. MI RENDIMIENTO (High-Tech Card) -->
                    <div style="padding: 0 25px 30px; position: relative; z-index: 4;">
                        <div style="
                            background: #ffffff;
                            border: 1px solid #e2e8f0;
                            border-radius: 32px;
                            padding: 24px;
                            box-shadow: 0 10px 30px rgba(0,0,0,0.02);
                        ">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                                ${(() => {
                    const currentUser = window.Store?.getState('currentUser');
                    if (!currentUser) return '<div style="grid-column:1/-1; text-align:center; font-size:0.8rem; color:#64748b; font-weight:700;">Inicia sesión para ver tu posición</div>';

                    const userStats = rankedData.find(p => p.id === currentUser.uid || p.id === currentUser.id);
                    if (!userStats) return '<div style="grid-column:1/-1; text-align:center; font-size:0.8rem; color:#64748b; font-weight:700;">Participa para aparecer en el ranking de esta categoría</div>';

                    const s = userStats.stats[this.currentView] || { played: 0, won: 0, points: 0 };
                    const displayStats = this.currentCategory === 'todas' ? s : (s.categories[this.currentCategory] || { points: 0, played: 0, won: 0 });

                    const winRate = displayStats.played > 0 ? Math.round((displayStats.won / displayStats.played) * 100) : 0;
                    const pos = userStats.rank;

                    return `
                                        <div style="text-align: left; border-right: 1px solid rgba(255,255,255,0.05); padding-right: 15px;">
                                            <div style="font-size: 0.6rem; color: #64748b; font-weight: 900; letter-spacing: 1px; text-transform: uppercase;">POSICIÓN ACTUAL</div>
                                            <div style="font-size: 2rem; font-weight: 950; color: #0a192f; line-height: 1.2;">#${pos}</div>
                                            <div style="font-size: 0.7rem; color: #CCFF00; font-weight: 800;">TOP ${(pos / rankedData.length * 100).toFixed(0)}% EN ${this.currentCategory.toUpperCase()}</div>
                                        </div>
                                        <div style="text-align: left; padding-left: 5px;">
                                            <div style="font-size: 0.6rem; color: #64748b; font-weight: 900; letter-spacing: 1px; text-transform: uppercase;">EFECTIVIDAD</div>
                                            <div style="font-size: 2rem; font-weight: 950; color: #0a192f; line-height: 1.2;">${winRate}%</div>
                                            <div style="font-size: 0.7rem; color: #64748b; font-weight: 800;"><i class="fas fa-fire" style="color:#ef4444;"></i> ${displayStats.won}W / ${displayStats.played - displayStats.won}L</div>
                                        </div>
                                    `;
                })()}
                            </div>
                        </div>
                    </div>

                    <!-- 🏓 PADEL PULSE / GLOBAL BROADCAST — Widget personalizado -->
                    <div style="padding: 0 25px 20px; position: relative; z-index: 4;">
                        <div id="padel-pulse-widget-root" style="animation: floatUp 0.5s ease-out forwards;"></div>
                    </div>

                    <!-- STICKY HEADER: TABS + SEARCH -->
                    <div style="position: sticky; top: 154px; z-index: 1001; background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 15px 25px 20px;">
                        
                        <!-- Navigation Tabs -->
                        <div style="background: #f1f5f9; padding: 5px; border-radius: 20px; display: flex; border: 1px solid #e2e8f0; margin-bottom: 15px;">
                            <button onclick="window.RankingView.switchView('americanas')" 
                                style="flex: 1; padding: 12px; border-radius: 16px; border: none; font-weight: 950; transition: 0.3s; cursor: pointer; background: ${this.currentView === 'americanas' ? '#CCFF00' : 'transparent'}; color: ${this.currentView === 'americanas' ? 'black' : '#64748b'}; text-transform: uppercase; font-size: 0.7rem; letter-spacing: 1px;">
                                AMERICANAS
                            </button>
                            <button onclick="window.RankingView.switchView('entrenos')" 
                                style="flex: 1; padding: 12px; border-radius: 16px; border: none; font-weight: 950; transition: 0.3s; cursor: pointer; background: ${this.currentView === 'entrenos' ? '#CCFF00' : 'transparent'}; color: ${this.currentView === 'entrenos' ? 'black' : '#64748b'}; text-transform: uppercase; font-size: 0.7rem; letter-spacing: 1px;">
                                ENTRENOS
                            </button>
                        </div>

                        <!-- SEARCH BAR PREMIUM INVERTED -->
                        <div style="position: relative; margin-bottom: 15px;">
                            <div style="position: absolute; left: 18px; top: 50%; transform: translateY(-50%); color: #000; font-size: 0.9rem; z-index: 2;">
                                <i class="fas fa-search"></i>
                            </div>
                            <input type="text" 
                                id="ranking-search-input" 
                                placeholder="Buscar amigo o rival..." 
                                onkeyup="window.RankingView.handleSearch(this.value)"
                                style="
                                    width: 100%; 
                                    background: #CCFF00; 
                                    border: 2px solid #CCFF00; 
                                    border-radius: 18px; 
                                    padding: 14px 14px 14px 50px; 
                                    color: #000; 
                                    font-family: 'Outfit'; 
                                    font-weight: 800; 
                                    font-size: 0.95rem; 
                                    outline: none; 
                                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                                    box-sizing: border-box;
                                    box-shadow: 0 10px 30px rgba(204, 255, 0, 0.2);
                                "
                                onfocus="this.style.boxShadow='0 0 40px rgba(204,255,0,0.4)';"
                                onblur="this.style.boxShadow='0 10px 30px rgba(204, 255, 0, 0.2)';"
                            >
                            ${this.isSearching ? `
                                <div onclick="document.getElementById('ranking-search-input').value=''; window.RankingView.handleSearch('');" style="position: absolute; right: 15px; top: 50%; transform: translateY(-50%); color: #000; cursor: pointer; padding: 5px; opacity: 0.6; z-index: 2;">
                                    <i class="fas fa-times-circle"></i>
                                </div>
                            ` : ''}
                        </div>

                        <!-- CATEGORIES HORIZONTAL -->
                        <div style="display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; align-items: center; padding-bottom: 5px;">
                            ${['todas', 'male', 'female', 'mixed'].map(cat => `
                                <button onclick="window.RankingView.filterByCategory('${cat}')" 
                                    style="white-space: nowrap; padding: 8px 18px; border-radius: 12px; border: 1px solid ${this.currentCategory === cat ? '#CCFF00' : 'rgba(255,255,255,0.08)'}; background: ${this.currentCategory === cat ? 'rgba(204,255,0,0.1)' : 'transparent'}; color: ${this.currentCategory === cat ? '#CCFF00' : '#64748b'}; font-weight: 950; font-size: 0.6rem; transition: all 0.2s; text-transform: uppercase; letter-spacing: 0.5px;">
                                    ${cat === 'todas' ? 'GLOBAL' : (cat === 'male' ? 'MASC.' : (cat === 'female' ? 'FEM.' : 'MIXTA'))}
                                </button>
                            `).join('')}
                            
                            <button onclick="window.RankingView.shareCurrentRanking()" 
                                style="margin-left: auto; background: #25D366; color: white; border: none; padding: 8px 15px; border-radius: 12px; font-weight: 950; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(37, 211, 102, 0.2);">
                                <i class="fab fa-whatsapp" style="font-size: 0.8rem;"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Player List Container -->
                    <div id="ranking-list-body" style="padding: 0 20px 100px;">
                        ${this.renderRankingList('')}
                    </div>
                </div>
            `;

            // Initialize the powerful radar chart comparing user vs MVP vs average
            this.initPerformanceChart(rankedData);

            // Initialize PadelPulse / Global Broadcast widget
            try {
                if (window.PadelPulse) {
                    window.PadelPulse.render('padel-pulse-widget-root');
                }
            } catch (e) {
                console.error("Error rendering PadelPulse in RankingView:", e);
            }
        }

        initPerformanceChart(rankedData) {
            const chartContainer = document.getElementById('ranking-performance-chart-container');
            const canvas = document.getElementById('ranking-performance-radar-chart');
            if (!chartContainer || !canvas || !rankedData || rankedData.length === 0) return;

            const currentUser = window.Store?.getState('currentUser');
            if (!currentUser) {
                chartContainer.style.display = 'none';
                return;
            }

            const myData = rankedData.find(p => p.id === currentUser.uid || p.id === currentUser.id);
            if (!myData) {
                chartContainer.style.display = 'none';
                return;
            }

            const mvpData = rankedData[0]; // The top player
            
            // Calculate averages of all active players in rankedData
            let totalLevel = 0;
            let totalPoints = 0;
            let totalPlayed = 0;
            let totalWins = 0;
            let totalWinRate = 0;
            
            rankedData.forEach(p => {
                const s = p.stats[this.currentView] || { played: 0, won: 0, points: 0 };
                const displayStats = this.currentCategory === 'todas' ? s : (s.categories[this.currentCategory] || { points: 0, played: 0, won: 0 });
                
                totalLevel += parseFloat(p.level || 3.5);
                totalPoints += (displayStats.points || 0);
                totalPlayed += (displayStats.played || 0);
                totalWins += (displayStats.won || 0);
                totalWinRate += (displayStats.played > 0 ? (displayStats.won / displayStats.played) * 100 : 0);
            });

            const count = rankedData.length;
            const avgLevel = totalLevel / count;
            const avgPoints = totalPoints / count;
            const avgPlayed = totalPlayed / count;
            const avgWins = totalWins / count;
            const avgWinRate = totalWinRate / count;

            // Get current user stats
            const sMy = myData.stats[this.currentView] || { played: 0, won: 0, points: 0 };
            const myDisplay = this.currentCategory === 'todas' ? sMy : (sMy.categories[this.currentCategory] || { points: 0, played: 0, won: 0 });
            const myLevel = parseFloat(myData.level || 3.5);
            const myPoints = myDisplay.points || 0;
            const myPlayed = myDisplay.played || 0;
            const myWins = myDisplay.won || 0;
            const myWinRate = myDisplay.played > 0 ? (myDisplay.won / myDisplay.played) * 100 : 0;

            // Get MVP stats
            const sMvp = mvpData.stats[this.currentView] || { played: 0, won: 0, points: 0 };
            const mvpDisplay = this.currentCategory === 'todas' ? sMvp : (sMvp.categories[this.currentCategory] || { points: 0, played: 0, won: 0 });
            const mvpLevel = parseFloat(mvpData.level || 3.5);
            const mvpPoints = mvpDisplay.points || 0;
            const mvpPlayed = mvpDisplay.played || 0;
            const mvpWins = mvpDisplay.won || 0;
            const mvpWinRate = mvpDisplay.played > 0 ? (mvpDisplay.won / mvpDisplay.played) * 100 : 0;

            // Normalize stats between 0 and 100 for comparison
            // Normalize level: 2.0 to 6.0 maps to 0-100
            const normalizeLvl = (lvl) => Math.min(100, Math.max(0, ((lvl - 2.0) / 4.0) * 100));
            
            // Normalize points: 0 to max points in category maps to 0-100
            const maxPoints = Math.max(1, mvpPoints, ...rankedData.map(p => {
                const s = p.stats[this.currentView] || { points: 0 };
                return this.currentCategory === 'todas' ? s.points : (s.categories[this.currentCategory]?.points || 0);
            }));
            const normalizePts = (pts) => (pts / maxPoints) * 100;
            
            // Normalize played: 0 to max played maps to 0-100
            const maxPlayed = Math.max(1, mvpPlayed, ...rankedData.map(p => {
                const s = p.stats[this.currentView] || { played: 0 };
                return this.currentCategory === 'todas' ? s.played : (s.categories[this.currentCategory]?.played || 0);
            }));
            const normalizePlayed = (pld) => (pld / maxPlayed) * 100;
            
            // Normalize wins: 0 to max wins maps to 0-100
            const maxWins = Math.max(1, mvpWins, ...rankedData.map(p => {
                const s = p.stats[this.currentView] || { won: 0 };
                return this.currentCategory === 'todas' ? s.won : (s.categories[this.currentCategory]?.won || 0);
            }));
            const normalizeWins = (wns) => (wns / maxWins) * 100;

            // Datasets
            const myNorm = [normalizeLvl(myLevel), myWinRate, normalizePts(myPoints), normalizeWins(myWins), normalizePlayed(myPlayed)];
            const mvpNorm = [normalizeLvl(mvpLevel), mvpWinRate, normalizePts(mvpPoints), normalizeWins(mvpWins), normalizePlayed(mvpPlayed)];
            const avgNorm = [normalizeLvl(avgLevel), avgWinRate, normalizePts(avgPoints), normalizeWins(avgWins), normalizePlayed(avgPlayed)];

            // Show container
            chartContainer.style.display = 'block';

            // Wait for Chart.js to load fully if it's deferred
            let retries = 0;
            const initChartInstance = () => {
                if (typeof Chart === 'undefined') {
                    retries++;
                    if (retries > 20) {
                        console.warn("⚠️ [RankingView] Chart.js could not be loaded. Showing fallback UI.");
                        canvas.parentNode.innerHTML = `<div style="color: #64748b; font-size: 0.7rem; font-weight: 700; height: 260px; display: flex; align-items: center; justify-content: center; padding: 20px; text-align: center;">Gráfico de rendimiento no disponible (sin conexión)</div>`;
                        return;
                    }
                    setTimeout(initChartInstance, 100);
                    return;
                }

                // Destroy old instance if exists to avoid hover glitches
                if (this.radarChartInstance) {
                    this.radarChartInstance.destroy();
                }

                const ctx = canvas.getContext('2d');
                this.radarChartInstance = new Chart(ctx, {
                    type: 'radar',
                    data: {
                        labels: ['Nivel de Juego', 'Efectividad %', 'Puntos Ranking', 'Victorias', 'Partidos Jugados'],
                        datasets: [
                            {
                                label: 'Tú',
                                data: myNorm,
                                backgroundColor: 'rgba(132, 204, 22, 0.2)',
                                borderColor: '#84cc16',
                                borderWidth: 3,
                                pointBackgroundColor: '#84cc16',
                                pointBorderColor: '#fff',
                                pointHoverBackgroundColor: '#fff',
                                pointHoverBorderColor: '#84cc16',
                                pointRadius: 4
                            },
                            {
                                label: 'Líder (MVP)',
                                data: mvpNorm,
                                backgroundColor: 'rgba(255, 215, 0, 0.08)',
                                borderColor: '#FFD700',
                                borderWidth: 2,
                                borderDash: [2, 2],
                                pointBackgroundColor: '#FFD700',
                                pointBorderColor: '#fff',
                                pointHoverBackgroundColor: '#fff',
                                pointHoverBorderColor: '#FFD700',
                                pointRadius: 3
                            },
                            {
                                label: 'Promedio Club',
                                data: avgNorm,
                                backgroundColor: 'rgba(59, 130, 246, 0.05)',
                                borderColor: '#3b82f6',
                                borderWidth: 1.5,
                                borderDash: [5, 5],
                                pointBackgroundColor: '#3b82f6',
                                pointBorderColor: '#fff',
                                pointHoverBackgroundColor: '#fff',
                                pointHoverBorderColor: '#3b82f6',
                                pointRadius: 3
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        const datasetLabel = context.dataset.label;
                                        const idx = context.dataIndex;
                                        
                                        // Show real value instead of normalized
                                        let realVal = '';
                                        if (datasetLabel === 'Tú') {
                                            if (idx === 0) realVal = myLevel.toFixed(2);
                                            else if (idx === 1) realVal = `${myWinRate.toFixed(0)}%`;
                                            else if (idx === 2) realVal = `${myPoints} pts`;
                                            else if (idx === 3) realVal = `${myWins} victorias`;
                                            else if (idx === 4) realVal = `${myPlayed} jugados`;
                                        } else if (datasetLabel === 'Líder (MVP)') {
                                            if (idx === 0) realVal = mvpLevel.toFixed(2);
                                            else if (idx === 1) realVal = `${mvpWinRate.toFixed(0)}%`;
                                            else if (idx === 2) realVal = `${mvpPoints} pts`;
                                            else if (idx === 3) realVal = `${mvpWins} victorias`;
                                            else if (idx === 4) realVal = `${mvpPlayed} jugados`;
                                        } else {
                                            if (idx === 0) realVal = avgLevel.toFixed(2);
                                            else if (idx === 1) realVal = `${avgWinRate.toFixed(0)}%`;
                                            else if (idx === 2) realVal = `${avgPoints.toFixed(1)} pts`;
                                            else if (idx === 3) realVal = `${avgWins.toFixed(1)} victorias`;
                                            else if (idx === 4) realVal = `${avgPlayed.toFixed(1)} jugados`;
                                        }
                                        return `${datasetLabel}: ${realVal}`;
                                    }
                                }
                            }
                        },
                        scales: {
                            r: {
                                angleLines: {
                                    color: 'rgba(0, 0, 0, 0.05)'
                                },
                                grid: {
                                    color: 'rgba(0, 0, 0, 0.05)'
                                },
                                pointLabels: {
                                    color: '#475569',
                                    font: {
                                        family: 'Outfit',
                                        size: 9,
                                        weight: '900'
                                    }
                                },
                                ticks: {
                                    display: false,
                                    maxTicksLimit: 5
                                },
                                min: 0,
                                max: 100
                            }
                        }
                    }
                });
            };

            // Iniciar la carga dinámica de Chart.js en demanda
            if (window.loadExternalScript) {
                window.loadExternalScript('https://cdn.jsdelivr.net/npm/chart.js', 'Chart')
                    .then(() => initChartInstance())
                    .catch(err => console.error("❌ Error al cargar Chart.js dinámicamente:", err));
            } else {
                initChartInstance();
            }
        }

        renderPodium(players) {
            const top3 = (players || []).slice(0, 3);
            if (top3.length === 0) return '';

            // Layout Order: 2nd, 1st, 3rd
            const displayOrder = [];
            if (top3[1]) displayOrder.push({ ...top3[1], rank: 2 });
            if (top3[0]) displayOrder.push({ ...top3[0], rank: 1 });
            if (top3[2]) displayOrder.push({ ...top3[2], rank: 3 });

            return `
                <div style="display: flex; justify-content: center; align-items: flex-end; gap: 8px; padding: 20px 10px 40px; position: relative;">
                    ${displayOrder.map(p => {
                const isFirst = p.rank === 1;
                const size = isFirst ? '100px' : '82px';
                const color = p.rank === 1 ? '#FFD700' : (p.rank === 2 ? '#E5E7EB' : '#CD7F32');
                const elevate = isFirst ? 'translateY(-20px)' : 'translateY(0)';

                return `
                            <div style="flex: 1; max-width: 110px; display: flex; flex-direction: column; align-items: center; transform: ${elevate}; animation: floatUp 0.8s ease-out both;">
                                <div style="position: relative; margin-bottom: 12px;">
                                    <div style="
                                        width: ${size}; height: ${size}; 
                                        border-radius: 50%; 
                                        border: 3px solid ${color};
                                        background: #ffffff;
                                        padding: 4px;
                                        box-shadow: 0 10px 25px rgba(0,0,0,0.05);
                                    ">
                                        <div style="
                                            width: 100%; height: 100%; 
                                            border-radius: 50%; 
                                            background: ${p.photo_url ? `url('${p.photo_url}') center/cover` : '#f1f5f9'};
                                            display: flex; align-items: center; justify-content: center;
                                            overflow: hidden;
                                        ">
                                            ${!p.photo_url ? `<span style="font-weight:950; color:#444; font-size:1.8rem;">${p.name.charAt(0)}</span>` : ''}
                                        </div>
                                    </div>
                                    <div style="
                                        position: absolute; bottom: -2px; right: -2px;
                                        width: 28px; height: 28px;
                                        background: ${color}; color: #000;
                                        border-radius: 50%;
                                        display: flex; align-items: center; justify-content: center;
                                        font-weight: 950; font-size: 0.8rem;
                                        border: 3px solid #ffffff;
                                        box-shadow: 0 4px 10px rgba(0,0,0,0.5);
                                    ">${p.rank}</div>
                                </div>
                                <div style="text-align: center;">
                                    <div style="font-weight: 950; font-size: 0.75rem; color: #0a192f; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 95px;" title="${p.name}">
                                        ${p.name}
                                    </div>
                                    <div style="font-weight: 950; font-size: 0.75rem; color: ${color}; opacity: 0.9;">
                                        ${this.currentCategory === 'todas' ? (p.stats[this.currentView]?.points || 0) : (p.stats[this.currentView]?.categories[this.currentCategory]?.points || 0)} 
                                        <span style="font-size: 0.55rem; font-weight: 700;">PTS</span>
                                    </div>
                                </div>
                            </div>
                        `;
            }).join('')}
                </div>
            `;
        }

        /**
         * Unified Helper to filter, sort and rank players for the current context
         */
        getProcessedData() {
            if (!this.playersData) return [];

            // 1. Initial Filter (Played at least 1 match in this view)
            let filtered = this.playersData.filter(p => {
                const s = p.stats[this.currentView];
                if (!s || s.played === 0) return false;

                // Category Filter
                if (this.currentCategory !== 'todas') {
                    const hasCat = s.categories && s.categories[this.currentCategory] && s.categories[this.currentCategory].played > 0;
                    return hasCat;
                }
                return true;
            });

            // 2. Sort by current context points
            filtered.sort((a, b) => {
                const sA = a.stats[this.currentView];
                const sB = b.stats[this.currentView];

                const pA = this.currentCategory === 'todas' ? sA.points : (sA.categories[this.currentCategory]?.points || 0);
                const pB = this.currentCategory === 'todas' ? sB.points : (sB.categories[this.currentCategory]?.points || 0);

                if (pB !== pA) return pB - pA;
                return (b.level || 0) - (a.level || 0); // Level as tie-breaker
            });

            // 3. Map with Rank
            return filtered.map((p, i) => ({ ...p, rank: i + 1 }));
        }

        renderRankingList(searchQuery = '') {
            const rankedData = this.getProcessedData();
            const isSearching = searchQuery && searchQuery.length >= 2;

            let finalDisplayList = rankedData;
            if (isSearching) {
                finalDisplayList = rankedData.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
            }

            if (finalDisplayList.length === 0) {
                return `
                    <div style="text-align: center; padding: 60px 25px; background: rgba(255,255,255,0.02); border-radius: 32px; color: #444; border: 1px dashed rgba(255,255,255,0.05);">
                         <i class="fas fa-trophy" style="font-size: 3rem; color: #222; margin-bottom: 20px;"></i>
                        <h4 style="margin: 0; color: #666; font-weight: 950;">${isSearching ? 'Sin resultados' : 'Sin líderes aún'}</h4>
                        <p style="font-size: 0.8rem; margin-top: 8px; font-weight: 700;">${isSearching ? 'Prueba con otro nombre' : 'Participa en eventos para aparecer aquí.'}</p>
                    </div>
                `;
            }

            return `
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    ${finalDisplayList.map((p, i) => this.renderPlayerRow(p, p.rank, finalDisplayList[i - 1])).join('')}
                </div>
            `;
        }

        renderPlayerRow(p, rank, prevPlayer) {
            const s = p.stats[this.currentView];
            const pStats = this.currentCategory === 'todas' ? s : (s.categories[this.currentCategory] || { points: 0, played: 0, won: 0 });

            const isTop3 = rank <= 3;
            const rankColor = rank === 1 ? '#FFD700' : (rank === 2 ? '#C0C0C0' : (rank === 3 ? '#CD7F32' : '#64748b'));
            const index = rank - 1;

            // Gamification Badge
            const badge = p.badge || { stars: 3, label: 'GOLD', color: '#FFD700', shadow: 'none' };
            const starsHtml = Array(5).fill(0).map((_, i) => 
                `<i class="fas fa-star" style="font-size: 0.55rem; color: ${i < badge.stars ? badge.color : 'rgba(255,255,255,0.05)'}; margin-right: 1px; ${i < badge.stars ? 'text-shadow:' + badge.shadow : ''}"></i>`
            ).join('');

            // Note: pointsToNext logic will be slightly inaccurate when filtered but UX is better this way
            const pointsToNext = prevPlayer ? (prevPlayer.stats[this.currentView].points - pStats.points) : 0;

            const trend = (index < 5 && Math.random() > 0.6) ? 'up' : (index > 10 && Math.random() > 0.8 ? 'down' : 'stable');
            const trendIcon = trend === 'up' ? '<i class="fas fa-caret-up" style="color:#84cc16;"></i>' : (trend === 'down' ? '<i class="fas fa-caret-down" style="color:#ef4444;"></i>' : '');

            return `
                <div style="
                    background: #ffffff;
                    border-radius: 20px;
                    padding: 14px 16px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.02);
                    animation: floatUp ${0.3 + (index * 0.05)}s ease-out both;
                    position: relative;
                    overflow: hidden;
                ">
                    <!-- Rank & Trend -->
                    <div style="width: 35px; text-align: center; z-index: 2;">
                        <div style="font-weight: 950; font-size: ${isTop3 ? '1.2rem' : '0.9rem'}; color: ${rankColor}; line-height: 1;">
                            ${rank}
                        </div>
                        <div style="font-size: 0.7rem; margin-top: 2px;">${trendIcon}</div>
                    </div>

                    <!-- Avatar Card -->
                    <div style="position: relative; z-index: 2;">
                        <div style="
                            width: 52px; height: 52px; 
                            border-radius: 16px; 
                            background: #f1f5f9;
                            border: 2px solid ${isTop3 ? rankColor + '44' : 'rgba(255,255,255,0.05)'};
                            background: ${p.photo_url ? `url('${p.photo_url}') center/cover` : '#f1f5f9'};
                            display: flex; align-items: center; justify-content: center;
                            overflow: hidden;
                        ">
                            ${!p.photo_url ? `<span style="font-weight:950; color:#333; font-size:1.1rem;">${p.name.substring(0, 2).toUpperCase()}</span>` : ''}
                        </div>
                        ${isTop3 ? `<div style="position:absolute; top:-8px; left:-8px; font-size:1rem; filter: drop-shadow(0 0 5px ${rankColor});">👑</div>` : ''}
                    </div>

                    <!-- Info Area -->
                    <div style="flex: 1; min-width: 0; z-index: 2;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div style="font-weight: 950; font-size: 1.1rem; color: #0a192f; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                ${p.name}
                            </div>
                            <div style="font-size: 0.5rem; font-weight: 950; padding: 1px 6px; border-radius: 4px; background: ${badge.color}22; color: ${badge.color}; border: 1px solid ${badge.color}44; text-transform: uppercase; letter-spacing: 0.5px;">
                                ${badge.label}
                            </div>
                        </div>
                        
                        <div style="margin-top: 6px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                            <div style="display: flex;">${starsHtml}</div>
                            <span style="font-size: 0.7rem; color: #475569; font-weight: 900; text-transform: uppercase;">
                                LVL ${p.level.toFixed(2)}
                            </span>
                            ${window.RoleService ? window.RoleService.getBadgeHtml(p.role, true) : ''}
                        </div>

                        ${pointsToNext > 0 && pointsToNext < 15 ? `
                            <div style="font-size: 0.55rem; color: #CCFF00; font-weight: 900; margin-top: 4px; letter-spacing: 0.3px;">
                                <i class="fas fa-fire"></i> A ${pointsToNext} PTS DEL PROX. PUESTO
                            </div>
                        ` : ''}
                    </div>

                    <!-- Score Card -->
                    <div style="text-align: right; background: ${isTop3 ? 'rgba(204, 255, 0, 0.15)' : '#f8fafc'}; padding: 10px 16px; border-radius: 12px; min-width: 80px; border: 1px solid ${isTop3 ? '#72a80044' : '#e2e8f0'}; z-index: 2;">
                        <div style="font-weight: 950; font-size: 1.35rem; color: #0a192f; line-height: 1;">
                            ${pStats.points}
                        </div>
                        <div style="font-size: 0.6rem; color: #72a800; font-weight: 950; letter-spacing: 0.5px; text-transform: uppercase; margin-top: 4px;">
                            PUNTOS
                        </div>
                    </div>
                </div>
            `;
        }

        switchView(view) {
            this.currentView = view;
            this.render(this.playersData);
        }

        filterByCategory(cat) {
            this.currentCategory = cat;
            const searchInput = document.getElementById('ranking-search-input');
            const query = searchInput ? searchInput.value : '';
            this.render(this.playersData);
            if (searchInput && query) searchInput.value = query; // Keep query alive
        }

        handleSearch(query) {
            const listContainer = document.getElementById('ranking-list-body');
            const podiumRow = document.getElementById('ranking-podium-root');
            this.isSearching = query.length >= 2;

            if (this.isSearching) {
                if (podiumRow) podiumRow.style.display = 'none';
                if (listContainer) listContainer.innerHTML = this.renderRankingList(query);
            } else {
                if (podiumRow) podiumRow.style.display = 'block';
                if (listContainer) listContainer.innerHTML = this.renderRankingList('');
            }
        }

        shareCurrentRanking() {
            if (!this.playersData || this.playersData.length === 0) return;

            // 1. Filter and Sort
            let filtered = this.playersData.filter(p => {
                const s = p.stats[this.currentView];
                if (!s || s.played === 0) return false;
                if (this.currentCategory !== 'todas') {
                    const hasCat = s.categories && s.categories[this.currentCategory] && s.categories[this.currentCategory].played > 0;
                    if (!hasCat) return false;
                }
                return true;
            });

            filtered.sort((a, b) => {
                const sA = a.stats[this.currentView];
                const sB = b.stats[this.currentView];
                const pA = this.currentCategory === 'todas' ? sA.points : (sA.categories[this.currentCategory]?.points || 0);
                const pB = this.currentCategory === 'todas' ? sB.points : (sB.categories[this.currentCategory]?.points || 0);
                if (pB !== pA) return pB - pA;
                return (b.level || 0) - (a.level || 0);
            });

            // 2. Map to share format
            const shareTitle = this.currentCategory === 'todas' ? 'GLOBAL' : (this.currentCategory === 'male' ? 'MASC.' : (this.currentCategory === 'female' ? 'FEM.' : 'MIXTA'));
            const sharePlayers = filtered.map(p => ({
                name: p.name,
                points: this.currentCategory === 'todas' ? p.stats[this.currentView].points : p.stats[this.currentView].categories[this.currentCategory].points,
                level: p.level
            }));

            // 3. Trigger WhatsApp
            if (window.WhatsAppService) {
                window.WhatsAppService.shareRanking(shareTitle, sharePlayers, this.currentView);
            }
        }

        renderRecentActivity() {
            const activities = this.getRecentActivities();

            if (activities.length === 0) {
                return `
                    <div style="text-align: center; padding: 20px; color: #444;">
                        <i class="fas fa-inbox" style="font-size: 2rem; opacity: 0.1; margin-bottom: 10px; display: block;"></i>
                        <div style="font-size: 0.85rem; font-weight: 600;">Sin actividad reciente</div>
                    </div>
                `;
            }

            return activities.slice(0, 5).map(activity => `
                <div style="
                    display: flex;
                    align-items: start;
                    gap: 12px;
                    padding: 14px;
                    background: rgba(255,255,255,0.02);
                    border-radius: 16px;
                    border-left: 3px solid ${activity.color};
                    transition: all 0.2s;
                    cursor: pointer;
                    margin-bottom: 8px;
                " onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='rgba(255,255,255,0.02)'">
                    <div style="font-size: 1.2rem;">${activity.icon}</div>
                    <div style="flex: 1;">
                        <div style="font-size: 0.8rem; font-weight: 700; color: #fff; line-height: 1.3;">
                            ${activity.title}
                        </div>
                        <div style="font-size: 0.65rem; color: #64748b; margin-top: 4px; font-weight: 600;">
                            ${activity.time}
                        </div>
                    </div>
                </div>
            `).join('');
        }

        getRecentActivities() {
            const activities = [];
            const now = new Date();

            // Añadir actividades de ejemplo (TODO: obtener desde Firebase en tiempo real)
            const sampleActivities = [
                {
                    icon: '🎾',
                    title: 'Nuevo jugador se unió a AMERICANA MIXTA',
                    time: 'hace 15 min',
                    color: '#84cc16',
                    timestamp: now.getTime() - 900000
                },
                {
                    icon: '✅',
                    title: 'Partido finalizado en MASCULINA',
                    time: 'hace 1h',
                    color: '#0ea5e9',
                    timestamp: now.getTime() - 3600000
                },
                {
                    icon: '🆕',
                    title: 'Nueva americana FEMENINA creada',
                    time: 'hace 3h',
                    color: '#a855f7',
                    timestamp: now.getTime() - 10800000
                },
                {
                    icon: '📈',
                    title: 'Cambio en el TOP 3 del ranking',
                    time: 'hace 5h',
                    color: '#f59e0b',
                    timestamp: now.getTime() - 18000000
                },
                {
                    icon: '⏰',
                    title: 'ENTRENO MIXTO comienza pronto',
                    time: 'en 2h',
                    color: '#ec4899',
                    timestamp: now.getTime() + 7200000
                }
            ];

            return sampleActivities.sort((a, b) => b.timestamp - a.timestamp);
        }
    }

    window.RankingView = new RankingView();
    console.log("🏆 Elite Dark Premium RankingView Initialized");
})();
