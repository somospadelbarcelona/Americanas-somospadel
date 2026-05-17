/**
 * ControlTowerStats.js
 * Sub-module for rendering statistics and summaries in ControlTowerView.
 */
(function () {
    class ControlTowerStats {
        static render(matches, eventDoc) {
            let finishedMatches = matches.filter(m => m.status === 'finished');

            if (finishedMatches.length === 0 && matches.length > 0 && eventDoc?.status === 'finished') {
                finishedMatches = matches.filter(m => (parseInt(m.score_a || 0) + parseInt(m.score_b || 0)) > 0);
            }

            if (finishedMatches.length === 0) {
                return `
                    <div style="padding: 100px 20px; text-align: center; color: #999;">
                        <i class="fas fa-chart-pie" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.2;"></i>
                        <h3>Sin Datos de Partidos</h3>
                        <p>No se han encontrado partidos finalizados para generar estadísticas.</p>
                    </div>`;
            }

            const isEntreno = eventDoc?.isEntreno;
            const isFija = eventDoc?.is_fija || (eventDoc?.pair_mode || '').toLowerCase().includes('fix') || (eventDoc?.name || '').toUpperCase().includes('FIJA');
            const ranking = window.StandingsService.calculate(matches, isEntreno ? 'entreno' : 'americana', isFija, eventDoc?.players || []);
            window.ControlTowerStats.lastRankingData = ranking;

            // Find Top Scorer (Goles a favor)
            const topScorer = [...ranking].sort((a, b) => b.points - a.points)[0];
            // Find Best Defense (Menos goles en contra)
            const bestDefense = [...ranking].sort((a, b) => {
                const gc_a = a.played * 12 - a.points; // Aproximación si no rastreamos gc_
                const gc_b = b.played * 12 - b.points;
                return gc_a - gc_b;
            })[0];

            return `
                <div class="summary-container fade-in" style="padding: 24px; background: white; min-height: 80vh; padding-bottom: 120px;">
                    <!-- HERO STATS -->
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 15px;">
                        <button onclick="window.ControlTowerView.switchTab('results')" style="background: #f1f5f9; border: 1px solid #e2e8f0; color: #64748b; padding: 8px 16px; border-radius: 12px; font-weight: 800; font-size: 0.75rem; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                            <i class="fas fa-arrow-left"></i> VOLVER
                        </button>
                        <button onclick="window.ControlTowerStats.shareStats(window.ControlTowerStats.lastRankingData, window.ControlTowerView?.currentAmericanaDoc)" 
                                style="background: #72a800; color: white; border: none; padding: 8px 16px; border-radius: 12px; font-size: 0.75rem; font-weight: 900; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 15px rgba(114,168,0,0.2);">
                            <i class="fas fa-bolt"></i> COMPARTIR STATS
                        </button>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px;">
                        <div style="background: #f8fafc; padding: 20px; border-radius: 24px; text-align: center; border: 1px solid #e2e8f0;">
                            <div style="color: #64748b; font-size: 0.65rem; font-weight: 950; text-transform: uppercase; margin-bottom: 10px; letter-spacing: 1px;">Top Juegos</div>
                            <div style="font-size: 1.8rem; font-weight: 950; color: #0a192f;">${topScorer?.points || 0}</div>
                            <div style="color: #72a800; font-size: 0.7rem; font-weight: 950;">${topScorer?.name || '-'}</div>
                        </div>
                        <div style="background: #f8fafc; padding: 20px; border-radius: 24px; text-align: center; border: 1px solid #e2e8f0;">
                            <div style="color: #64748b; font-size: 0.65rem; font-weight: 950; text-transform: uppercase; margin-bottom: 10px; letter-spacing: 1px;">Victorias</div>
                            <div style="font-size: 1.8rem; font-weight: 950; color: #0a192f;">${topScorer?.won || 0}</div>
                            <div style="color: #72a800; font-size: 0.7rem; font-weight: 950;">${topScorer?.name || '-'}</div>
                        </div>
                    </div>

                    <!-- PERFORMANCE GRID -->
                    <h3 style="color: #0a192f; font-weight: 950; font-size: 1.1rem; margin-bottom: 20px; text-transform: uppercase;">Eficiencia Individual</h3>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        ${ranking.slice(0, 32).map((p, i) => {
                const winRate = Math.round((p.won / (p.played || 1)) * 100);
                return `
                                <div style="display: flex; align-items: center; gap: 15px; padding: 16px; background: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
                                    <div style="width: 30px; font-weight: 950; color: #cbd5e1;">${i + 1}</div>
                                    <div style="flex: 1;">
                                        <div style="font-weight: 950; color: #0a192f; font-size: 0.9rem; letter-spacing: -0.5px;">${p.name.toUpperCase()}</div>
                                        <div style="width: 100%; height: 8px; background: #f1f5f9; border-radius: 10px; margin-top: 8px; overflow: hidden; border: 1px solid #e2e8f0;">
                                            <div style="width: ${winRate}%; height: 100%; background: ${winRate >= 60 ? '#72a800' : (winRate >= 40 ? '#f59e0b' : '#ef4444')}; border-radius: 10px;"></div>
                                        </div>
                                    </div>
                                    <div style="text-align: right; min-width: 50px;">
                                        <div style="font-weight: 950; color: #0a192f; font-size: 1.1rem; letter-spacing: -1px;">${winRate}%</div>
                                        <div style="font-size: 0.55rem; color: #64748b; font-weight: 950; text-transform: uppercase;">WINS</div>
                                    </div>
                                </div>`;
            }).join('')}
                    </div>
                </div>
            `;
        }

        static async shareStats(rankingData, eventDoc) {
            try {
                const eventName = eventDoc?.name || 'Entreno / Americana';
                const eventDate = eventDoc?.date || 'Hoy';
                const isFixedPairs = (eventDoc?.pair_mode || '').toLowerCase().includes('fix') || (eventName).toUpperCase().includes('FIJA');

                let shareText = `📊 ESTADÍSTICAS: ${eventName}\n📅 ${eventDate}\n\n`;

                const topScorer = [...rankingData].sort((a, b) => b.points - a.points)[0];
                const topWins = [...rankingData].sort((a, b) => b.won - a.won)[0];

                shareText += `🎯 Top Juegos: ${topScorer?.points || 0} (${topScorer?.name || '-'}) \n`;
                if (!isFixedPairs) {
                    shareText += `👑 Más Victorias: ${topWins?.won || 0} (${topWins?.name || '-'}) \n\n`;
                    shareText += `🔥 TOP EFICIENCIA:\n`;
                    rankingData.slice(0, 5).forEach((p, i) => {
                        const winRate = Math.round((p.won / (p.played || 1)) * 100);
                        shareText += `${i + 1}. ${p.name} — ${winRate}% WR\n`;
                    });
                } else {
                    shareText += `👑 Mejores Parejas:\n`;
                    const medals = ['🥇', '🥈', '🥉'];
                    rankingData.slice(0, 3).forEach((p, i) => {
                        shareText += `${medals[i]} ${p.name} — ${p.won} V\n`;
                    });
                }

                shareText += `\n🎾 ¡Sigue todos los resultados en SomosPadel!`;

                if (navigator.share) {
                    await navigator.share({ title: `Estadísticas ${eventName}`, text: shareText });
                } else {
                    await navigator.clipboard.writeText(shareText);
                    window.PremiumModal.alert({ title: '✅ COPIADO', message: 'Estadísticas copiadas al portapapeles.' });
                }
            } catch (err) {
                console.error("Error sharing stats:", err);
            }
        }
    }
    window.ControlTowerStats = ControlTowerStats;
})();
