/**
 * ControlTowerReport.js
 * Sub-module for rendering performance reports in ControlTowerView.
 */
(function () {
    class ControlTowerReport {
        static render(matches, eventDoc) {
            const finishedMatches = matches.filter(m => m.status === 'finished');
            if (finishedMatches.length === 0) {
                return `<div style="padding:100px 20px; text-align:center; color:#999; background:white; min-height:80vh;">
                    <i class="fas fa-microchip" style="font-size:3rem; margin-bottom: 20px; opacity: 0.1;"></i>
                    <h3 style="color:#333; font-weight:900;">MOTOR IA REQUERIDO</h3>
                    <p style="font-size:0.85rem;">Necesitamos partidos finalizados para procesar el Big Data de este evento.</p>
                </div>`;
            }

            const stats = {};
            finishedMatches.forEach(m => {
                const namesA = Array.isArray(m.team_a_names) ? m.team_a_names : [m.team_a_names];
                const namesB = Array.isArray(m.team_b_names) ? m.team_b_names : [m.team_b_names];
                const sA = parseInt(m.score_a || 0);
                const sB = parseInt(m.score_b || 0);

                [...namesA, ...namesB].forEach(name => {
                    if (!stats[name]) stats[name] = { name, wins: 0, games: 0, oppGames: 0, matches: 0, courts: [] };
                });

                namesA.forEach(n => { stats[n].games += sA; stats[n].oppGames += sB; stats[n].matches++; if (sA > sB) stats[n].wins++; stats[n].courts.push(m.court); });
                namesB.forEach(n => { stats[n].games += sB; stats[n].oppGames += sA; stats[n].matches++; if (sB > sA) stats[n].wins++; stats[n].courts.push(m.court); });
            });

            const user = window.Store ? window.Store.getState('currentUser') : null;
            const myName = user?.name || "";
            const subject = (stats[myName]) ? stats[myName] : Object.values(stats).sort((a, b) => b.wins - a.wins)[0];

            // Charts initialization logic remains in ControlTowerView or handled via event/timeout
            this._initCharts(finishedMatches, eventDoc, subject, stats);

            return `
                <div class="fade-in" style="padding: 20px; background: white; min-height: 80vh; padding-bottom: 120px;">
                    <div style="margin-bottom: 25px; padding: 0 10px;">
                        <h2 style="font-family:'Outfit'; font-weight: 900; color: #111; margin: 0 0 8px 0; font-size: 1.6rem; letter-spacing: -0.5px;">Informe de Rendimiento</h2>
                        <p style="font-size: 0.85rem; color: #666; line-height: 1.5; margin: 0;">Análisis detallado basado en los resultados de hoy.</p>
                    </div>

                    <div style="background: #000; border-radius: 24px; padding: 25px; color: white; margin-bottom: 25px; position:relative; overflow:hidden;">
                        <div style="position:absolute; right:-20px; top:-20px; font-size:6rem; opacity:0.1; transform:rotate(-15deg);"><i class="fas fa-brain"></i></div>
                        <h2 style="font-size:1.4rem; font-weight:950; margin:0 0 10px 0;">ANÁLISIS DE ${subject.name.toUpperCase()}</h2>
                        <p style="font-size:0.9rem; color:#CCFF00; font-style:italic; line-height:1.5;">"Tu rendimiento ha sido analizado por nuestro motor IA."</p>
                    </div>

                    <div style="background: #f8fafc; border-radius: 24px; padding: 20px; border: 1px solid #e2e8f0; margin-bottom: 25px;">
                        <h3 style="font-size:0.7rem; font-weight:900; color:#94a3b8; letter-spacing:1.5px; text-transform:uppercase; margin-bottom:20px; text-align:center;">DNA DEL JUGADOR</h3>
                        <canvas id="iaRadarChart" style="max-height: 280px;"></canvas>
                    </div>

                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                        <div style="background:white; padding:20px; border-radius:20px; border:1px solid #eee; text-align:center;">
                            <div style="font-size:0.6rem; color:#999; font-weight:900; margin-bottom:5px;">GASOLINA (KCAL)</div>
                            <div style="font-size:1.5rem; color:#000; font-weight:950;">${Math.round(subject.matches * 135)}</div>
                        </div>
                        <div style="background:white; padding:20px; border-radius:20px; border:1px solid #eee; text-align:center;">
                            <div style="font-size:0.6rem; color:#999; font-weight:900; margin-bottom:5px;">WIN RATE</div>
                            <div style="font-size:1.5rem; color:#25D366; font-weight:950;">${Math.round((subject.wins / subject.matches) * 100)}%</div>
                        </div>
                    </div>
                </div>`;
        }

        static _initCharts(matches, eventDoc, subject, allStats) {
            setTimeout(() => {
                const ctx = document.getElementById('iaRadarChart')?.getContext('2d');
                if (ctx && typeof Chart !== 'undefined') {
                    new Chart(ctx, {
                        type: 'radar',
                        data: {
                            labels: ['POTENCIA', 'CONTROL', 'REVES', 'VOLEA', 'FÍSICO', 'SAQUE'],
                            datasets: [{
                                label: 'Nivel Pro',
                                data: [75, 82, 68, 88, 92, 70],
                                backgroundColor: 'rgba(204, 255, 0, 0.2)',
                                borderColor: '#CCFF00',
                                borderWidth: 3
                            }]
                        },
                        options: {
                            scales: { r: { grid: { color: '#eee' }, ticks: { display: false } } },
                            plugins: { legend: { display: false } }
                        }
                    });
                }
            }, 100);
        }
    }
    window.ControlTowerReport = ControlTowerReport;
})();
