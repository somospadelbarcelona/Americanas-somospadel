/**
 * ControlTowerReport.js
 * Sub-module for high-end performance reports in ControlTowerView.
 * Focuses on Padel Intelligence, realistic metrics, and Premium UX.
 */
(function () {
    class ControlTowerReport {
        static render(matches, eventDoc) {
            const finishedMatches = matches.filter(m => m.status === 'finished');
            if (finishedMatches.length === 0) {
                return `
                <div style="padding:100px 20px; text-align:center; background: #fff; min-height:80vh; border-radius: 30px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                    <div style="width: 80px; height: 80px; background: #f8fafc; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 25px;">
                        <i class="fas fa-brain" style="font-size:2rem; color: #cbd5e1; animation: pulse 2s infinite;"></i>
                    </div>
                    <h3 style="color:#1e293b; font-weight:950; letter-spacing: -0.5px; font-size: 1.4rem; margin-bottom: 10px;">PROCESANDO BIG DATA</h3>
                    <p style="font-size:0.9rem; color: #64748b; max-width: 260px; line-height: 1.6;">El motor de inteligencia necesita partidos finalizados para generar tu informe de rendimiento.</p>
                </div>`;
            }

            // 1. ADVANCED PADEL INTELLIGENCE CALCULATIONS
            const stats = {};
            let totalGamesInEvent = 0;

            finishedMatches.forEach((m, idx) => {
                const namesA = Array.isArray(m.team_a_names) ? m.team_a_names : [m.team_a_names];
                const namesB = Array.isArray(m.team_b_names) ? m.team_b_names : [m.team_b_names];
                const sA = parseInt(m.score_a || 0);
                const sB = parseInt(m.score_b || 0);
                const diff = Math.abs(sA - sB);
                totalGamesInEvent += (sA + sB);

                [...namesA, ...namesB].forEach(name => {
                    if (!stats[name]) {
                        stats[name] = {
                            name, wins: 0, matches: 0, games: 0, oppGames: 0,
                            clutchPoints: 0, // Points in tight matches
                            staminaTrend: [], // Games won per round to detect fatigue
                            lateGamePerformance: 0
                        };
                    }
                });

                const isClutchMatch = diff <= 2;

                namesA.forEach(n => {
                    stats[n].matches++; stats[n].games += sA; stats[n].oppGames += sB;
                    if (sA > sB) {
                        stats[n].wins++;
                        if (isClutchMatch) stats[n].clutchPoints += 25;
                    }
                    stats[n].staminaTrend.push(sA);
                });
                namesB.forEach(n => {
                    stats[n].matches++; stats[n].games += sB; stats[n].oppGames += sA;
                    if (sB > sA) {
                        stats[n].wins++;
                        if (isClutchMatch) stats[n].clutchPoints += 25;
                    }
                    stats[n].staminaTrend.push(sB);
                });
            });

            // 2. DATA SUBJECT SELECTION
            const user = window.Store ? window.Store.getState('currentUser') : null;
            const myName = user?.name || "";
            const subjectName = Object.keys(stats).find(k => k.toLowerCase().includes(myName.toLowerCase())) || Object.keys(stats).sort((a, b) => stats[b].wins - stats[a].wins)[0];
            const subject = stats[subjectName];

            // 3. REALISTIC METRIC WEIGHTING (0-100)
            const firstRounds = subject.staminaTrend.slice(0, 2).reduce((a, b) => a + b, 0) / 2 || 1;
            const lastRounds = subject.staminaTrend.slice(-2).reduce((a, b) => a + b, 0) / 2 || 1;
            const staminaRatio = (lastRounds / firstRounds) * 100;

            const mean = subject.games / subject.matches;
            const variance = subject.staminaTrend.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / subject.matches;
            const regularityScore = Math.max(0, 100 - (Math.sqrt(variance) * 20));

            const metrics = {
                ATAQUE: Math.min(98, 30 + (subject.games / (subject.matches || 1) * 10)),
                DEFENSA: Math.min(96, 20 + (100 - ((subject.oppGames / (subject.matches || 1)) / 6 * 100))),
                IMPACTO: Math.min(95, (subject.games / (totalGamesInEvent / (finishedMatches.length * 4) || 1)) * 1.5),
                CLUTCH: Math.min(99, 15 + subject.clutchPoints + (subject.wins * 5)),
                STAMINA: Math.min(100, staminaRatio),
                REGULARIDAD: Math.min(94, regularityScore)
            };

            // AI Insight Logic
            let aiInsight = "Has mostrado una regularidad técnica sólida durante toda la jornada. Buen trabajo táctico.";
            if (metrics.STAMINA < 65) aiInsight = "CAÍDA DE RENDIMIENTO: Tus juegos ganados han bajado un " + Math.round(100 - metrics.STAMINA) + "% en las rondas finales. Ojo con el desgaste físico.";
            if (metrics.REGULARIDAD > 85) aiInsight = "MÁQUINA DE PRECISIÓN: Tu desviación por ronda es mínima. Eres un jugador extremadamente fiable para cualquier pareja.";
            if (metrics.CLUTCH > 80) aiInsight = "NIVEL COMPETITIVO ELITE: Has resuelto los partidos críticos con maestría. Mentalidad inquebrantable.";

            this._initCharts(metrics);

            return `
                <div class="fade-in" style="background: #f8fafc; min-height: 100vh; padding-bottom: 120px; font-family: 'Outfit';">
                    <!-- CLEAN WHITE HEADER -->
                    <div style="background: white; padding: 40px 20px 30px; border-bottom: 1px solid #f1f5f9;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                            <div>
                                <h1 style="font-size: 1.6rem; font-weight: 950; color: #0f172a; margin: 0; letter-spacing: -1px;">PADEL INTELLIGENCE</h1>
                                <div style="display: flex; align-items: center; gap: 6px; margin-top: 4px;">
                                    <div style="width: 6px; height: 6px; background: #ff9500; border-radius: 50%;"></div>
                                    <span style="font-size: 0.65rem; color: #64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px;">ANÁLISIS DE RENDIMIENTO REAL</span>
                                </div>
                            </div>
                            <div style="background: #f1f5f9; padding: 10px; border-radius: 12px;">
                                <i class="fas fa-microchip" style="color: #0f172a; font-size: 1.2rem;"></i>
                            </div>
                        </div>

                        <!-- HIGHLIGHT CARD (PLAYER Focus) -->
                        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 28px; padding: 25px; color: white; position: relative; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.1);">
                             <div style="position: absolute; right: -10px; top: -10px; font-size: 5rem; color: #ff9500; opacity: 0.1; transform: rotate(-10deg);"><i class="fas fa-brain"></i></div>
                             <div style="position: relative; z-index: 2;">
                                <div style="font-size: 0.6rem; color: #ff9500; font-weight: 950; letter-spacing: 2px; margin-bottom: 5px;">PLAYER IDENTITY</div>
                                <h2 style="font-size: 1.4rem; font-weight: 950; margin: 0 0 15px 0; letter-spacing: -0.5px;">${subject.name.toUpperCase()}</h2>
                                <div style="background: rgba(255,255,255,0.05); border-radius: 16px; padding: 15px; border-left: 3px solid #ff9500;">
                                    <p style="font-size: 0.8rem; color: #cbd5e1; line-height: 1.5; margin: 0; font-style: italic;">
                                        "${aiInsight}"
                                    </p>
                                </div>
                             </div>
                        </div>
                    </div>

                    <!-- ANALYTICS GRID -->
                    <div style="padding: 25px 20px;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                            
                            <!-- RADAR CHART (CENTRAL DNA) -->
                            <div style="grid-column: span 2; background: white; border-radius: 35px; padding: 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); border: 1px solid #f1f5f9;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                                    <h3 style="font-size: 0.75rem; font-weight: 950; color: #0f172a; letter-spacing: 1px;">HUELLA TÁCTICA</h3>
                                    <span style="font-size: 0.6rem; color: #ff9500; font-weight: 900; background: #fff7ed; padding: 4px 10px; border-radius: 8px; border: 1px solid #ffedd5;">SYNC AI</span>
                                </div>
                                <canvas id="iaRadarChart" style="max-height: 300px; width: 100%;"></canvas>
                            </div>

                             <!-- KEY METRIC CARDS -->
                            <div style="background: white; border-radius: 28px; padding: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); border: 1px solid #f1f5f9; text-align: center;">
                                <div style="font-size: 0.55rem; color: #94a3b8; font-weight: 950; letter-spacing: 1.5px; margin-bottom: 12px;">ÍNDICE DE IMPACTO</div>
                                <div style="font-size: 1.8rem; font-weight: 950; color: #0f172a;">${(metrics.IMPACTO / 10).toFixed(1)}</div>
                                <div style="width: 40px; height: 3px; background: #ff9500; margin: 10px auto; border-radius: 10px;"></div>
                                <div style="font-size: 0.6rem; color: #64748b; font-weight: 700;">PESO REAL EN EL EVENTO</div>
                            </div>

                            <div style="background: white; border-radius: 28px; padding: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); border: 1px solid #f1f5f9; text-align: center;">
                                <div style="font-size: 0.55rem; color: #94a3b8; font-weight: 950; letter-spacing: 1.5px; margin-bottom: 12px;">RATIO DE DOMINIO</div>
                                <div style="font-size: 1.8rem; font-weight: 950; color: #ff9500;">${Math.round((subject.games / (subject.games + subject.oppGames || 1)) * 100)}%</div>
                                <div style="width: 40px; height: 3px; background: #0f172a; margin: 10px auto; border-radius: 10px;"></div>
                                <div style="font-size: 0.6rem; color: #64748b; font-weight: 700;">EFECTIVIDAD EN PISTA</div>
                            </div>

                            <!-- BIG DATA INSIGHT (EVENT WIDE) -->
                            <div style="grid-column: span 2; background: #fff; border-radius: 30px; padding: 25px; border: 1px dashed #cbd5e1;">
                                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 15px;">
                                    <i class="fas fa-chart-line" style="color: #64748b;"></i>
                                    <h3 style="font-size: 0.7rem; font-weight: 950; color: #64748b; letter-spacing: 1px; margin: 0;">GLOBAL EVENT DATA</h3>
                                </div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                                    <div>
                                        <div style="font-size: 0.6rem; color: #94a3b8; font-weight: 800;">JUEGOS TOTALES</div>
                                        <div style="font-size: 1.1rem; font-weight: 950; color: #0f172a;">${totalGamesInEvent} juegos</div>
                                    </div>
                                    <div>
                                        <div style="font-size: 0.6rem; color: #94a3b8; font-weight: 800;">IMPACT SCORE</div>
                                        <div style="font-size: 1.1rem; font-weight: 950; color: #0f172a;">${(totalGamesInEvent / finishedMatches.length).toFixed(1)} <span style="font-size: 0.6rem;">G/P</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`;
        }

        static _initCharts(metrics) {
            setTimeout(() => {
                const ctx = document.getElementById('iaRadarChart')?.getContext('2d');
                if (ctx && typeof Chart !== 'undefined') {
                    new Chart(ctx, {
                        type: 'radar',
                        data: {
                            labels: ['ATAQUE', 'DEFENSA', 'IMPACTO', 'CLUTCH', 'STAMINA', 'REGULARIDAD'],
                            datasets: [{
                                data: [metrics.ATAQUE, metrics.DEFENSA, metrics.IMPACTO, metrics.CLUTCH, metrics.STAMINA, metrics.REGULARIDAD],
                                backgroundColor: 'rgba(255, 149, 0, 0.2)',
                                borderColor: '#ff9500',
                                borderWidth: 3,
                                pointBackgroundColor: '#ff9500',
                                pointBorderColor: '#fff',
                                pointRadius: 4,
                                fill: true
                            }]
                        },
                        options: {
                            layout: { padding: 5 },
                            scales: {
                                r: {
                                    angleLines: { color: 'rgba(0,0,0,0.05)' },
                                    grid: { color: 'rgba(0,0,0,0.05)' },
                                    pointLabels: {
                                        font: { family: 'Outfit', size: 10, weight: '850' },
                                        color: '#64748b'
                                    },
                                    ticks: { display: false, stepSize: 20 },
                                    suggestedMin: 0,
                                    suggestedMax: 100
                                }
                            },
                            plugins: {
                                legend: { display: false },
                                tooltip: { enabled: true }
                            },
                            animation: { duration: 1200, easing: 'easeOutQuart' }
                        }
                    });
                }
            }, 300);
        }
    }
    window.ControlTowerReport = ControlTowerReport;
})();
