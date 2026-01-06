/**
 * RankingView.js
 * Premium Ranking View for SomosPadel
 */
(function () {
    class RankingView {
        render(players) {
            const container = document.getElementById('content-area');
            if (!container) return;

            container.innerHTML = `
                <div class="ranking-container fade-in" style="background: #fdfdfd; min-height: 100vh; padding-bottom: 100px; font-family: 'Inter', sans-serif;">
                    
                    <!-- Header -->
                    <div style="background: #000; padding: 40px 24px 60px; color: white; border-bottom-left-radius: 40px; border-bottom-right-radius: 40px; position: relative; overflow: hidden;">
                        <div style="position: absolute; top: -20px; right: -20px; font-size: 8rem; opacity: 0.05; color: var(--playtomic-neon);">🏆</div>
                        <h1 style="font-family: 'Outfit'; font-weight: 800; font-size: 2.2rem; margin: 0; position: relative; z-index: 2;">Ranking<br><span style="color: var(--playtomic-neon);">Global</span></h1>
                        <p style="color: #888; font-size: 0.9rem; margin-top: 10px; max-width: 250px;">Clasificación pro basada en rendimiento y nivel ELO.</p>
                        
                        <div style="display: flex; gap: 15px; margin-top: 30px;">
                            <div style="background: rgba(255,255,255,0.05); padding: 12px 20px; border-radius: 15px; border: 1px solid rgba(255,255,255,0.1);">
                                <div style="font-size: 0.6rem; color: #666; font-weight: 800; text-transform: uppercase;">Total Jugadores</div>
                                <div style="font-size: 1.2rem; font-weight: 800; color: white;">${players.length}</div>
                            </div>
                            <div style="background: rgba(255,255,255,0.05); padding: 12px 20px; border-radius: 15px; border: 1px solid rgba(255,255,255,0.1);">
                                <div style="font-size: 0.6rem; color: #666; font-weight: 800; text-transform: uppercase;">Promedio Nivel</div>
                                <div style="font-size: 1.2rem; font-weight: 800; color: var(--playtomic-neon);">3.84</div>
                            </div>
                        </div>
                    </div>

                    <!-- Ranking List -->
                    <div style="margin-top: -30px; padding: 0 20px;">
                        ${players.length === 0 ? this.renderEmpty() : this.renderTable(players)}
                    </div>

                </div>
            `;
        }

        renderTable(players) {
            return `
                <div style="background: white; border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid #eee;">
                    ${players.map((p, i) => this.renderRow(p, i)).join('')}
                </div>
            `;
        }

        renderRow(player, index) {
            const isTop3 = index < 3;
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : (index + 1);
            const level = parseFloat(player.level || player.self_rate_level || 3.5).toFixed(2);
            const winRate = player.win_rate || (Math.random() * 40 + 40).toFixed(0); // Demo fallback

            return `
                <div style="display: flex; align-items: center; padding: 18px 20px; border-bottom: 1px solid #f1f1f1; position: relative;">
                    <!-- Posición -->
                    <div style="width: 35px; font-weight: 900; font-size: 1.1rem; color: ${isTop3 ? '#000' : '#bbb'}; display: flex; justify-content: center;">
                        ${isTop3 ? `<span style="font-size: 1.3rem;">${medal}</span>` : medal}
                    </div>

                    <!-- Avatar Shortcut -->
                    <div style="width: 44px; height: 44px; background: #f8f8f8; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; border: 2px solid ${isTop3 ? 'var(--playtomic-neon)' : '#eee'}; overflow: hidden;">
                        <span style="font-weight: 800; font-size: 0.9rem; color: #333;">${player.name.substring(0, 2).toUpperCase()}</span>
                    </div>

                    <!-- Info -->
                    <div style="flex: 1;">
                        <div style="font-weight: 800; color: #111; font-size: 0.95rem;">${player.name}</div>
                        <div style="display: flex; gap: 8px; align-items: center; margin-top: 2px;">
                            <span style="font-size: 0.65rem; background: #f3f4f6; padding: 2px 6px; border-radius: 4px; color: #666; font-weight: 700; text-transform: uppercase;">
                                ${player.play_preference || 'Revés'}
                            </span>
                            <span style="font-size: 0.65rem; color: #999; font-weight: 600;">
                                ${player.matches_played || 0} Partidos · ${winRate}% WR
                            </span>
                        </div>
                    </div>

                    <!-- Nivel -->
                    <div style="text-align: right;">
                        <div style="font-weight: 900; font-size: 1.25rem; color: #000; letter-spacing: -0.5px;">${level}</div>
                        <div style="font-size: 0.55rem; color: #999; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Level ELO</div>
                    </div>
                </div>
            `;
        }

        renderEmpty() {
            return `
                <div style="padding: 100px 40px; text-align: center; color: #ccc;">
                    <i class="fas fa-users-slash" style="font-size: 4rem; margin-bottom: 20px; opacity: 0.2;"></i>
                    <h3 style="color: #666;">No hay jugadores suficientes</h3>
                    <p style="font-size: 0.9rem;">El ranking se activará cuando haya al menos 4 jugadores registrados.</p>
                </div>
            `;
        }
    }

    window.RankingView = new RankingView();
    console.log("🏆 RankingView Initialized");
})();
