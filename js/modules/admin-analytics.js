/**
 * admin-analytics.js
 * Specialized Dashboard for Smart Analytics (Performance, Trends, and Insights).
 */
(function () {
    window.AdminViews = window.AdminViews || {};

    window.AdminViews.analytics = async function () {
        const content = document.getElementById('content-area');
        content.innerHTML = '<div class="loader"></div>';

        try {
            // 1. Fetch Necessary Data
            const players = await window.FirebaseDB.players.getAll();

            // Get last 30 days of matches for recent performance
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const matchesSnap = await window.db.collection('matches')
                .where('createdAt', '>=', thirtyDaysAgo.toISOString())
                .get();

            const entrenosSnap = await window.db.collection('entrenos_matches')
                .where('createdAt', '>=', thirtyDaysAgo.toISOString())
                .get();

            const allRecentMatches = [
                ...matchesSnap.docs.map(doc => doc.data()),
                ...entrenosSnap.docs.map(doc => doc.data())
            ].filter(m => m.status === 'finished');

            // 2. Process Insights
            const insights = processSmartInsights(players, allRecentMatches);

            // 3. Render View
            renderAnalyticsView(content, insights);

            // 4. Render Charts
            renderAnalyticsCharts(insights);

        } catch (e) {
            console.error("Analytics Error:", e);
            content.innerHTML = `<div class="error-box">Error al cargar analíticas: ${e.message}</div>`;
        }
    };

    function processSmartInsights(players, matches) {
        const stats = {};

        matches.forEach(m => {
            const process = (ids, score, oppScore) => {
                if (!ids) return;
                ids.forEach(id => {
                    if (!stats[id]) stats[id] = { pj: 0, wins: 0, games: 0, points: 0 };
                    stats[id].pj++;
                    stats[id].games += score;
                    if (score > oppScore) stats[id].wins++;
                });
            };
            process(m.team_a_ids, m.score_a, m.score_b);
            process(m.team_b_ids, m.score_b, m.score_a);
        });

        // Revelación (Highest Level Increase - Mocked for demo if history not deep enough)
        // In real app, we'd query level_history deltas.
        const revelationPlayers = [...players]
            .filter(p => p.matches_played > 5)
            .sort((a, b) => (b.last_level_change || 0) - (a.last_level_change || 0))
            .slice(0, 3);

        // Win Streaks
        const topPerformers = Object.entries(stats)
            .map(([id, s]) => {
                const p = players.find(x => x.id === id);
                return {
                    name: p ? p.name : 'Desconocido',
                    winRate: Math.round((s.wins / s.pj) * 100),
                    pj: s.pj,
                    level: p ? (p.level || p.self_rate_level) : 0
                };
            })
            .filter(x => x.pj >= 4)
            .sort((a, b) => b.winRate - a.winRate)
            .slice(0, 5);

        // --- AI ENGINE SIMULATION ---
        const activeCount = players.filter(p => p.status === 'active').length;
        const matchesCount = matches.length;
        const avgWins = topPerformers.length > 0 ? (topPerformers[0].winRate) : 50;

        let aiText = `Tras analizar los últimos ${matchesCount} partidos y la actividad de ${activeCount} jugadores, el sistema detecta una tendencia positiva en la competitividad. `;

        if (revelationPlayers.length > 0) {
            aiText += `Destaca especialmente el crecimiento de **${revelationPlayers[0].name}**, quien ha subido un ${((revelationPlayers[0].last_level_change || 0) * 100).toFixed(1)}% de nivel recientemente. `;
        }

        if (avgWins > 70) {
            aiText += `Se recomienda revisar el matchmaking manual, ya que algunos jugadores muestran una tasa de victoria superior al 70%, sugiriendo una posible subestimación de su nivel actual. `;
        } else {
            aiText += `El equilibrio del sistema es óptimo, con la mayoría de los jugadores en el rango de nivel 3.5-4.0. `;
        }

        aiText += `Recuerda: Un sistema saludable tiene una tasa de victoria media cercana al 50%.`;

        return {
            revelationPlayers,
            topPerformers,
            totalMatches: matches.length,
            activePlayers: activeCount,
            aiText
        };
    }

    function renderAnalyticsView(container, insights) {
        container.innerHTML = `
            <div class="dashboard-header-pro" style="margin-bottom: 2rem;">
                <h1 style="color: white; font-size: 2.2rem; font-weight: 900; margin-bottom: 0.5rem;">
                    <i class="fas fa-microchip" style="color: #00d4ff; margin-right: 15px;"></i> SMART ANALYTICS
                </h1>
                <p style="color: rgba(255,255,255,0.5); font-weight: 600; letter-spacing: 1px;">INTELIGENCIA DE DATOS Y RENDIMIENTO PRO</p>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
                <!-- KPIs -->
                <div class="glass-card-enterprise" style="padding: 1.5rem; border-left: 4px solid #00d4ff;">
                    <div style="font-size: 0.75rem; color: #64748b; font-weight: 800; text-transform: uppercase; margin-bottom: 5px;">Partidos (30d)</div>
                    <div style="font-size: 2rem; color: white; font-weight: 950;">${insights.totalMatches}</div>
                </div>
                <div class="glass-card-enterprise" style="padding: 1.5rem; border-left: 4px solid #ccff00;">
                    <div style="font-size: 0.75rem; color: #64748b; font-weight: 800; text-transform: uppercase; margin-bottom: 5px;">Jugadores Activos</div>
                    <div style="font-size: 2rem; color: white; font-weight: 950;">${insights.activePlayers}</div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 2rem;">
                <!-- Ranking Rendimiento -->
                <div class="glass-card-enterprise" style="padding: 2rem;">
                    <h3 style="color: white; margin-bottom: 2rem; font-size: 1.2rem; display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-award" style="color: #ccff00;"></i> TOP RENDIMIENTO (Victoria %)
                    </h3>
                    <div style="display: flex; flex-direction: column; gap: 1rem;">
                        ${insights.topPerformers.map((p, i) => `
                            <div style="display: flex; align-items: center; gap: 15px; background: rgba(255,255,255,0.03); padding: 15px; border-radius: 16px;">
                                <div style="font-size: 1.2rem; font-weight: 900; color: #00d4ff; width: 30px;">#${i + 1}</div>
                                <div style="flex: 1;">
                                    <div style="font-weight: 800; color: white;">${p.name}</div>
                                    <div style="font-size: 0.75rem; color: #64748b;">Nivel ${parseFloat(p.level).toFixed(2)}</div>
                                </div>
                                <div style="text-align: right;">
                                    <div style="font-size: 1.3rem; font-weight: 950; color: #ccff00;">${p.winRate}%</div>
                                    <div style="font-size: 0.65rem; color: #64748b; font-weight: 700;">${p.pj} PARTIDOS</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Revelaciones -->
                <div class="glass-card-enterprise" style="padding: 2rem;">
                    <h3 style="color: white; margin-bottom: 2rem; font-size: 1.2rem; display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-fire" style="color: #ff3b30;"></i> REVELACIONES (+Δ)
                    </h3>
                    <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                        ${insights.revelationPlayers.map(p => `
                            <div style="text-align: center;">
                                <div style="width: 60px; height: 60px; border-radius: 50%; background: #ff3b3020; border: 2px solid #ff3b3040; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">🚀</div>
                                <div style="font-weight: 900; color: white;">${p.name}</div>
                                <div style="color: #00ff88; font-weight: 900; font-size: 0.9rem;">+${(p.last_level_change || 0).toFixed(3)} PTOS</div>
                            </div>
                        `).join('') || '<p style="color: #444; text-align: center;">Buscando nuevas promesas...</p>'}
                    </div>
                </div>
            </div>

            <div class="glass-card-enterprise" style="margin-top: 2rem; padding: 2.5rem; border-color: rgba(0, 212, 255, 0.4); position: relative; overflow: hidden;">
                <div style="position: absolute; top: -20px; right: -20px; font-size: 8rem; opacity: 0.03; color: #00d4ff;">
                    <i class="fas fa-robot"></i>
                </div>
                <h3 style="color: #00d4ff; margin-bottom: 1rem; font-size: 1.3rem; display: flex; align-items: center; gap: 12px; font-weight: 900;">
                    <i class="fas fa-brain"></i> MENDEZ SYSTEM AI INSIGHT
                </h3>
                <div style="background: rgba(0, 212, 255, 0.05); border-radius: 16px; padding: 20px; border: 1px dashed rgba(0, 212, 255, 0.2);">
                    <p style="color: white; line-height: 1.8; font-family: 'Outfit'; font-size: 1rem; font-weight: 500;">
                        ${insights.aiText}
                    </p>
                </div>
            </div>

            <div class="glass-card-enterprise" style="margin-top: 2rem; padding: 2rem;">
                <h3 style="color: white; margin-bottom: 1.5rem; font-size: 1.2rem;">Distribución de Niveles</h3>
                <div style="height: 300px; position: relative;">
                    <canvas id="level-dist-chart"></canvas>
                </div>
            </div>
        `;
    }

    function renderAnalyticsCharts(insights) {
        // Mocked level distribution for demo
        const ctx = document.getElementById('level-dist-chart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['< 3.0', '3.0 - 3.5', '3.5 - 4.0', '4.0 - 4.5', '4.5+'],
                datasets: [{
                    label: 'Nº Jugadores',
                    data: [12, 45, 38, 15, 6],
                    backgroundColor: '#00d4ff',
                    borderRadius: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
                    x: { grid: { display: false } }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

})();
