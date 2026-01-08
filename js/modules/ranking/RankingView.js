/**
 * RankingView.js
 * Premium Matte Dark AI-Enhanced Ranking View for SomosPadel
 */
(function () {
    class RankingView {
        constructor() {
            this.currentView = 'americanas'; // americanas | entrenos
            this.currentCategory = 'todas'; // todas | male | female | mixed
            this.playersData = [];
        }

        render(players) {
            this.playersData = players;
            const container = document.getElementById('content-area');
            if (!container) return;

            // Fetch Data for Header Widgets
            const topPlayer = window.RankingController ? window.RankingController.getTopPlayer() : (players.length > 0 ? players[0] : null);
            const skills = window.PlayerController ? window.PlayerController.getCalculatedSkills() : { power: 50, control: 50, net: 50, defense: 50 };

            container.innerHTML = `
                <div class="ranking-global-wrapper fade-in" style="background: #121212; min-height: 100vh; font-family: 'Outfit', sans-serif; color: #e1e1e1; padding-bottom: 50px;">
                    
                    <!-- 1. MATTE HEADER: MVP & SKILLS -->
                    <div style="padding: 24px 20px 30px; background: #121212;">
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                            <h1 style="font-weight: 900; font-size: 1.8rem; margin: 0; letter-spacing: -1px; color: white;">RANKING <span style="color: #00E36D;">PRO</span></h1>
                            <div style="background: rgba(0,227,109,0.1); color: #00E36D; padding: 6px 14px; border-radius: 12px; font-size: 0.7rem; font-weight: 950; border: 1px solid rgba(0,227,109,0.1); letter-spacing: 1px;">MODO MATE</div>
                        </div>

                        <!-- A. GLOBAL MVP SPOTLIGHT (MATTE) -->
                        ${topPlayer ? `
                        <div style="
                            background: #1c1c1e;
                            border: 1px solid rgba(255,255,255,0.05);
                            border-radius: 24px;
                            padding: 24px;
                            position: relative;
                            overflow: hidden;
                            margin-bottom: 25px;
                            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
                        ">
                            <div style="position: absolute; top: -10px; right: -10px; font-size: 6rem; color: rgba(255,255,255,0.02); transform: rotate(15deg);">🏆</div>
                            <div style="display: flex; align-items: center; gap: 18px; position: relative; z-index: 2;">
                                <!-- MVP PHOTO (STRICT) -->
                                ${topPlayer.photo_url ? `
                                    <div style="
                                        width: 75px; 
                                        height: 75px; 
                                        border-radius: 20px; 
                                        border: 2px solid #00E36D; 
                                        background: url('${topPlayer.photo_url}') center/cover; 
                                    "></div>
                                ` : `
                                    <div style="
                                        width: 75px; 
                                        height: 75px; 
                                        border-radius: 20px; 
                                        border: 2px solid #333; 
                                        background: #2c2c2e;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        color: #666;
                                        font-weight: 950;
                                        font-size: 1.8rem;
                                    ">${topPlayer.name.substring(0, 1).toUpperCase()}</div>
                                `}
                                <div>
                                    <div style="color: #00E36D; font-size: 0.7rem; font-weight: 950; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 4px;">MVP DE LA SEMANA</div>
                                    <div style="color: white; font-weight: 950; font-size: 1.5rem; letter-spacing: -0.5px; line-height: 1.1;">${topPlayer.name}</div>
                                    <div style="color: #999; font-size: 0.8rem; font-weight: 800; margin-top: 6px;">
                                        <span style="color: #00E36D; font-weight: 950;">${topPlayer.stats.americanas.points}</span> PUNTOS • NIVEL ${topPlayer.level.toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        </div>
                        ` : ''}

                        <!-- B. MY SKILL RADAR (MATTE) -->
                        <div style="
                            background: #1c1c1e;
                            border: 1px solid rgba(255,255,255,0.05);
                            border-radius: 24px;
                            padding: 24px;
                        ">
                            <div style="font-size: 0.75rem; color: #00E36D; font-weight: 950; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 20px;">MI RENDIMIENTO IA</div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px 30px;">
                                <div>
                                    <div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: #888; margin-bottom: 10px; font-weight: 900; letter-spacing: 1px;">
                                        <span>POTENCIA</span>
                                        <span style="color:#00E36D;">${skills.power}%</span>
                                    </div>
                                    <div style="height: 6px; background: #2c2c2e; border-radius: 100px; overflow: hidden;">
                                        <div style="width: ${skills.power}%; height: 100%; background: #00E36D;"></div>
                                    </div>
                                </div>
                                <div>
                                    <div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: #888; margin-bottom: 10px; font-weight: 900; letter-spacing: 1px;">
                                        <span>CONTROL</span>
                                        <span style="color:#00c4ff;">${skills.control}%</span>
                                    </div>
                                    <div style="height: 6px; background: #2c2c2e; border-radius: 100px; overflow: hidden;">
                                        <div style="width: ${skills.control}%; height: 100%; background: #00c4ff;"></div>
                                    </div>
                                </div>
                                <div>
                                    <div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: #888; margin-bottom: 10px; font-weight: 900; letter-spacing: 1px;">
                                        <span>RED</span>
                                        <span style="color:#00E36D;">${skills.net}%</span>
                                    </div>
                                    <div style="height: 6px; background: #2c2c2e; border-radius: 100px; overflow: hidden;">
                                        <div style="width: ${skills.net}%; height: 100%; background: #00E36D;"></div>
                                    </div>
                                </div>
                                <div>
                                    <div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: #888; margin-bottom: 10px; font-weight: 900; letter-spacing: 1px;">
                                        <span>DEFENSA</span>
                                        <span style="color:#00c4ff;">${skills.defense}%</span>
                                    </div>
                                    <div style="height: 6px; background: #2c2c2e; border-radius: 100px; overflow: hidden;">
                                        <div style="width: ${skills.defense}%; height: 100%; background: #00c4ff;"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Main Navigation Tabs (MATTE) -->
                    <div style="margin-top: -24px; display: flex; justify-content: center; padding: 0 20px; position: relative; z-index: 10;">
                        <div style="background: #1c1c1e; padding: 6px; border-radius: 100px; display: flex; box-shadow: 0 10px 30px rgba(0,0,0,0.3); width: 100%; max-width: 400px; border: 1px solid rgba(255,255,255,0.05);">
                            <button onclick="window.RankingView.switchView('americanas')" id="tab-americanas" 
                                style="flex: 1; padding: 14px; border-radius: 100px; border: none; font-weight: 950; transition: all 0.3s; cursor: pointer; background: ${this.currentView === 'americanas' ? '#00E36D' : 'transparent'}; color: ${this.currentView === 'americanas' ? 'black' : '#666'}; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 1px;">
                                AMERICANAS
                            </button>
                            <button onclick="window.RankingView.switchView('entrenos')" id="tab-entrenos" 
                                style="flex: 1; padding: 14px; border-radius: 100px; border: none; font-weight: 950; transition: all 0.3s; cursor: pointer; background: ${this.currentView === 'entrenos' ? '#00E36D' : 'transparent'}; color: ${this.currentView === 'entrenos' ? 'black' : '#666'}; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 1px;">
                                ENTRENOS
                            </button>
                        </div>
                    </div>

                    <!-- Category Filters (MATTE) -->
                    <div style="display: flex; gap: 12px; justify-content: center; padding: 40px 20px 20px; overflow-x: auto; scrollbar-width: none;">
                        ${['todas', 'male', 'female', 'mixed'].map(cat => `
                            <button onclick="window.RankingView.filterByCategory('${cat}')" 
                                class="filter-btn-${cat}"
                                style="white-space: nowrap; padding: 12px 24px; border-radius: 12px; border: 1px solid ${this.currentCategory === cat ? '#00E36D' : 'rgba(255,255,255,0.05)'}; background: ${this.currentCategory === cat ? '#00E36D' : '#1c1c1e'}; color: ${this.currentCategory === cat ? 'black' : '#999'}; font-weight: 950; font-size: 0.75rem; transition: all 0.2s; text-transform: uppercase; letter-spacing: 0.5px;">
                                ${cat === 'todas' ? 'TODAS' : (cat === 'male' ? 'MASC.' : (cat === 'female' ? 'FEM.' : 'MIXTA'))}
                            </button>
                        `).join('')}
                    </div>

                    <!-- Player List Container -->
                    <div id="ranking-list-body" style="padding: 0 20px 100px;">
                        ${this.renderRankingList()}
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
            this.render(this.playersData);
        }

        renderRankingList() {
            console.log(`🔍 [RankingView] Rendering List | View: ${this.currentView} | Category: ${this.currentCategory}`);

            // Filter players who have played in the current view
            let filtered = this.playersData.filter(p => {
                const s = p.stats[this.currentView];
                if (!s || s.played === 0) return false;

                // If a specific category is selected, check if they played in it
                if (this.currentCategory !== 'todas') {
                    const hasCat = s.categories && s.categories[this.currentCategory] && s.categories[this.currentCategory].played > 0;
                    return hasCat;
                }
                return true;
            });

            console.log(`📊 [RankingView] Players after filter: ${filtered.length}`);

            // Sort logic: Points -> Level
            filtered.sort((a, b) => {
                const sA = a.stats[this.currentView];
                const sB = b.stats[this.currentView];

                const pA = this.currentCategory === 'todas' ? sA.points : (sA.categories[this.currentCategory]?.points || 0);
                const pB = this.currentCategory === 'todas' ? sB.points : (sB.categories[this.currentCategory]?.points || 0);

                if (pB !== pA) return pB - pA;
                return b.level - a.level;
            });

            if (filtered.length === 0) {
                return `
                    <div style="text-align: center; padding: 60px 40px; background: #1c1c1e; border-radius: 24px; border: 1.5px dashed rgba(255,255,255,0.05); color: #444; margin-top: 10px;">
                         <div style="margin-bottom: 25px; opacity: 0.3;">
                            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#333" />
                            </svg>
                        </div>
                        <h4 style="margin: 0; color: white; font-weight: 950; font-size: 1.1rem; letter-spacing: -0.2px;">Sin actividad registrada</h4>
                        <p style="font-size: 0.85rem; margin-top: 8px; color: #555; font-weight: 700;">No hay datos para esta vista todavía.</p>
                    </div>
                `;
            }

            return `
                <div style="background: #1c1c1e; border-radius: 24px; overflow: hidden; border: 1px solid rgba(255,255,255,0.03);">
                    ${filtered.map((p, i) => this.renderPlayerRow(p, i)).join('')}
                </div>
            `;
        }

        renderPlayerRow(player, index) {
            const s = player.stats[this.currentView];
            const pStats = this.currentCategory === 'todas' ? s : (s.categories[this.currentCategory] || { points: 0, played: 0, won: 0 });

            const isTop3 = index < 3;
            const rankLabel = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : (index + 1);
            const winRate = pStats.played > 0 ? Math.round((pStats.won / pStats.played) * 100) : 0;
            const rankColor = isTop3 ? '#00E36D' : '#444';

            return `
                <div style="display: flex; align-items: center; padding: 22px 18px; border-bottom: 1px solid rgba(255,255,255,0.03); position: relative; gap: 18px;">
                    <!-- Position -->
                    <div style="width: 35px; display: flex; justify-content: center; font-weight: 950; font-size: ${isTop3 ? '1.5rem' : '1rem'}; color: ${rankColor};">
                        ${rankLabel}
                    </div>

                    <!-- Avatar (Matte) -->
                    <div style="
                        width: 55px; 
                        height: 55px; 
                        min-width: 55px; 
                        background: #2c2c2e; 
                        border-radius: 18px; 
                        display: flex; 
                        align-items: center; 
                        justify-content: center; 
                        border: 2px solid ${isTop3 ? '#00E36D' : '#333'}; 
                        overflow: hidden; 
                    ">
                        ${player.photo_url ?
                    `<div style="width:100%; height:100%; background: url('${player.photo_url}') center/cover;"></div>` :
                    `<span style="font-weight: 950; font-size: 1.1rem; color: #666;">${player.name.substring(0, 2).toUpperCase()}</span>`
                }
                    </div>

                    <!-- Player Info -->
                    <div style="flex: 1;">
                        <div style="font-weight: 900; color: white; font-size: 1.05rem; line-height: 1.2; letter-spacing: -0.2px;">${player.name}</div>
                        <div style="display: flex; gap: 10px; align-items: center; margin-top: 6px;">
                            <span style="font-size: 0.65rem; background: rgba(255,255,255,0.03); color: #888; padding: 4px 10px; border-radius: 6px; font-weight: 950; letter-spacing: 0.5px; border: 1px solid rgba(255,255,255,0.03);">NIVEL ${player.level.toFixed(2)}</span>
                            <span style="font-size: 0.65rem; color: #444; font-weight: 900; text-transform: uppercase;">${pStats.played}P / ${winRate}% WR</span>
                        </div>
                    </div>

                    <!-- Points Section -->
                    <div style="text-align: right; min-width: 75px;">
                        <div style="font-weight: 950; font-size: 1.5rem; color: white; letter-spacing: -0.5px; line-height: 1;">${pStats.points} <span style="font-size: 0.7rem; color: #00E36D; font-weight: 950; vertical-align: middle; margin-left: 2px;">PTS</span></div>
                        <div style="font-size: 0.6rem; color: #444; font-weight: 950; text-transform: uppercase; margin-top: 5px;">
                            ${pStats.won}V - ${pStats.played - pStats.won}D
                        </div>
                    </div>
                </div>
            `;
        }
    }

    window.RankingView = new RankingView();
    console.log("🏆 Premium RankingView Initialized (Matte Skin)");
})();
