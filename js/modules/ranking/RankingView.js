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
        }

        render(players) {
            this.playersData = players;
            const container = document.getElementById('content-area');
            if (!container) return;

            container.innerHTML = `
                <div class="ranking-global-wrapper fade-in" style="
                    background: #000;
                    min-height: 100vh; 
                    font-family: 'Outfit', sans-serif; 
                    color: white; 
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
                                <h1 style="font-weight: 950; font-size: 2.5rem; margin: 0; letter-spacing: -1.5px; color: #fff; line-height: 1.1;">
                                    RANKING <span style="background: linear-gradient(90deg, #CCFF00, #84cc16); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">PRO</span>
                                </h1>
                            </div>
                        </div>
                    </div>

                    <!-- 2. OLYMPIC PODIUM (Top 3 Visual) -->
                    <div id="ranking-podium-root" style="position: relative; z-index: 4;">
                        ${this.renderPodium(players)}
                    </div>

                    <!-- 3. MI RENDIMIENTO (High-Tech Card) -->
                    <div style="padding: 0 25px 30px; position: relative; z-index: 4;">
                        <div style="
                            background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
                            backdrop-filter: blur(20px);
                            border: 1px solid rgba(255, 255, 255, 0.08);
                            border-radius: 32px;
                            padding: 24px;
                            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
                        ">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                                ${(() => {
                    const currentUser = window.Store?.getState('currentUser');
                    if (!currentUser) return '<div style="grid-column:1/-1; text-align:center; font-size:0.8rem; color:#64748b; font-weight:700;">Inicia sesión para ver tu posición</div>';

                    const userStats = players.find(p => p.id === currentUser.uid || p.id === currentUser.id);
                    if (!userStats) return '<div style="grid-column:1/-1; text-align:center; font-size:0.8rem; color:#64748b; font-weight:700;">Sin datos en el ranking actual</div>';

                    const s = userStats.stats[this.currentView] || { played: 0, won: 0, points: 0 };
                    const winRate = s.played > 0 ? Math.round((s.won / s.played) * 100) : 0;
                    const pos = players.findIndex(p => p.id === userStats.id) + 1;

                    return `
                                        <div style="text-align: left; border-right: 1px solid rgba(255,255,255,0.05); padding-right: 15px;">
                                            <div style="font-size: 0.6rem; color: #64748b; font-weight: 900; letter-spacing: 1px; text-transform: uppercase;">POSICIÓN ACTUAL</div>
                                            <div style="font-size: 2rem; font-weight: 950; color: #fff; line-height: 1.2;">#${pos}</div>
                                            <div style="font-size: 0.7rem; color: #CCFF00; font-weight: 800;">TOP ${(pos / players.length * 100).toFixed(0)}% GLOBAL</div>
                                        </div>
                                        <div style="text-align: left; padding-left: 5px;">
                                            <div style="font-size: 0.6rem; color: #64748b; font-weight: 900; letter-spacing: 1px; text-transform: uppercase;">EFECTIVIDAD</div>
                                            <div style="font-size: 2rem; font-weight: 950; color: #fff; line-height: 1.2;">${winRate}%</div>
                                            <div style="font-size: 0.7rem; color: #64748b; font-weight: 800;"><i class="fas fa-fire" style="color:#ef4444;"></i> ${s.won}W / ${s.played - s.won}L</div>
                                        </div>
                                    `;
                })()}
                            </div>
                        </div>
                    </div>

                    <!-- Main Navigation Tabs -->
                    <div style="display: flex; justify-content: center; padding: 0 25px; position: sticky; top: 15px; z-index: 100;">
                        <div style="background: rgba(20, 20, 20, 0.85); backdrop-filter: blur(15px); padding: 6px; border-radius: 24px; display: flex; box-shadow: 0 15px 35px rgba(0,0,0,0.5); width: 100%; border: 1px solid rgba(255,255,255,0.1);">
                            <button onclick="window.RankingView.switchView('americanas')" id="tab-americanas" 
                                style="flex: 1; padding: 14px; border-radius: 18px; border: none; font-weight: 950; transition: all 0.3s; cursor: pointer; background: ${this.currentView === 'americanas' ? '#CCFF00' : 'transparent'}; color: ${this.currentView === 'americanas' ? 'black' : '#666'}; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 1px;">
                                AMERICANAS
                            </button>
                            <button onclick="window.RankingView.switchView('entrenos')" id="tab-entrenos" 
                                style="flex: 1; padding: 14px; border-radius: 18px; border: none; font-weight: 950; transition: all 0.3s; cursor: pointer; background: ${this.currentView === 'entrenos' ? '#CCFF00' : 'transparent'}; color: ${this.currentView === 'entrenos' ? 'black' : '#666'}; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 1px;">
                                ENTRENOS
                            </button>
                        </div>
                    </div>

                    <!-- Category Filters -->
                    <div style="display: flex; gap: 8px; justify-content: flex-start; padding: 25px 25px 15px; overflow-x: auto; scrollbar-width: none; align-items: center; position: relative; z-index: 4;">
                        ${['todas', 'male', 'female', 'mixed'].map(cat => `
                            <button onclick="window.RankingView.filterByCategory('${cat}')" 
                                style="white-space: nowrap; padding: 10px 20px; border-radius: 14px; border: 1px solid ${this.currentCategory === cat ? '#CCFF00' : 'rgba(255,255,255,0.05)'}; background: ${this.currentCategory === cat ? '#CCFF00' : 'rgba(255,255,255,0.03)'}; color: ${this.currentCategory === cat ? 'black' : '#64748b'}; font-weight: 950; font-size: 0.65rem; transition: all 0.2s; text-transform: uppercase;">
                                ${cat === 'todas' ? 'GLOBAL' : (cat === 'male' ? 'MASC.' : (cat === 'female' ? 'FEM.' : 'MIXTA'))}
                            </button>
                        `).join('')}
                        
                        <button onclick="window.RankingView.shareCurrentRanking()" 
                            style="margin-left: auto; background: #25D366; color: white; border: none; padding: 10px 18px; border-radius: 14px; font-weight: 950; font-size: 0.65rem; display: flex; align-items: center; gap: 8px; box-shadow: 0 5px 20px rgba(37, 211, 102, 0.2);">
                            <i class="fab fa-whatsapp" style="font-size: 0.9rem;"></i>
                        </button>
                    </div>

                    <!-- Player List Container -->
                    <div id="ranking-list-body" style="padding: 0 20px 100px;">
                        ${this.renderRankingList()}
                    </div>
                </div>
            `;
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
                                        background: #111;
                                        padding: 4px;
                                        box-shadow: 0 15px 30px rgba(0,0,0,0.5), 0 0 20px ${color}22;
                                    ">
                                        <div style="
                                            width: 100%; height: 100%; 
                                            border-radius: 50%; 
                                            background: ${p.photo_url ? `url('${p.photo_url}') center/cover` : '#1a1a1a'};
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
                                        border: 3px solid #000;
                                        box-shadow: 0 4px 10px rgba(0,0,0,0.5);
                                    ">${p.rank}</div>
                                </div>
                                <div style="text-align: center;">
                                    <div style="font-weight: 950; font-size: 0.75rem; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 95px;" title="${p.name}">
                                        ${p.name}
                                    </div>
                                    <div style="font-weight: 950; font-size: 0.75rem; color: ${color}; opacity: 0.9;">${(p.stats[this.currentView]?.points || 0)} <span style="font-size: 0.55rem; font-weight: 700;">PTS</span></div>
                                </div>
                            </div>
                        `;
            }).join('')}
                </div>
            `;
        }

        renderRankingList() {
            let filtered = this.playersData.filter(p => {
                const s = p.stats[this.currentView];
                if (!s || s.played === 0) return false;
                if (this.currentCategory !== 'todas') {
                    // Check if player has played in this specific category (gender/type)
                    // This data needs to be robustly stored in player.stats[view].categories
                    const hasCat = s.categories && s.categories[this.currentCategory] && s.categories[this.currentCategory].played > 0;
                    if (!hasCat) return false;
                }
                return true;
            });

            // Sorting Logic (Centralized)
            filtered.sort((a, b) => {
                const sA = a.stats[this.currentView];
                const sB = b.stats[this.currentView];
                const pA = this.currentCategory === 'todas' ? sA.points : (sA.categories[this.currentCategory]?.points || 0);
                const pB = this.currentCategory === 'todas' ? sB.points : (sB.categories[this.currentCategory]?.points || 0);
                if (pB !== pA) return pB - pA;
                return (b.level || 0) - (a.level || 0);
            });

            if (filtered.length === 0) {
                return `
                    <div style="text-align: center; padding: 60px 25px; background: rgba(255,255,255,0.02); border-radius: 32px; color: #444; border: 1px dashed rgba(255,255,255,0.05);">
                         <i class="fas fa-trophy" style="font-size: 3rem; color: #222; margin-bottom: 20px;"></i>
                        <h4 style="margin: 0; color: #666; font-weight: 950;">Sin líderes aún</h4>
                        <p style="font-size: 0.8rem; margin-top: 8px; font-weight: 700;">Participa en eventos para aparecer aquí.</p>
                    </div>
                `;
            }

            // Slice out the first 3 if we are in "todas" category to avoid redundancy with podium
            // Actually, keep them but style them differently
            return `
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    ${filtered.map((p, i) => this.renderPlayerRow(p, i, filtered[i - 1])).join('')}
                </div>
            `;
        }

        renderPlayerRow(p, index, prevPlayer) {
            const s = p.stats[this.currentView];
            const pStats = this.currentCategory === 'todas' ? s : (s.categories[this.currentCategory] || { points: 0, played: 0, won: 0 });

            const isTop3 = index < 3;
            const rankColor = index === 0 ? '#FFD700' : (index === 1 ? '#C0C0C0' : (index === 2 ? '#CD7F32' : '#64748b'));
            const pointsToNext = prevPlayer ? (prevPlayer.stats[this.currentView].points - pStats.points) : 0;

            // Trend (Simulated for UX/UI demo - can be bound to real delta in next update)
            const trend = (index < 5 && Math.random() > 0.6) ? 'up' : (index > 10 && Math.random() > 0.8 ? 'down' : 'stable');
            const trendIcon = trend === 'up' ? '<i class="fas fa-caret-up" style="color:#84cc16;"></i>' : (trend === 'down' ? '<i class="fas fa-caret-down" style="color:#ef4444;"></i>' : '');

            return `
                <div style="
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: 20px;
                    padding: 14px 16px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    border: 1px solid rgba(255, 255, 255, 0.04);
                    animation: floatUp ${0.3 + (index * 0.05)}s ease-out both;
                ">
                    <!-- Rank & Trend -->
                    <div style="width: 35px; text-align: center;">
                        <div style="font-weight: 950; font-size: ${isTop3 ? '1.2rem' : '0.9rem'}; color: ${rankColor}; line-height: 1;">
                            ${index + 1}
                        </div>
                        <div style="font-size: 0.7rem; margin-top: 2px;">${trendIcon}</div>
                    </div>

                    <!-- Avatar Card -->
                    <div style="position: relative;">
                        <div style="
                            width: 52px; height: 52px; 
                            border-radius: 16px; 
                            background: #111;
                            border: 2px solid ${isTop3 ? rankColor + '44' : 'rgba(255,255,255,0.05)'};
                            background: ${p.photo_url ? `url('${p.photo_url}') center/cover` : '#1a1a1a'};
                            display: flex; align-items: center; justify-content: center;
                            overflow: hidden;
                        ">
                            ${!p.photo_url ? `<span style="font-weight:950; color:#333; font-size:1.1rem;">${p.name.substring(0, 2).toUpperCase()}</span>` : ''}
                        </div>
                        ${isTop3 ? `<div style="position:absolute; top:-8px; left:-8px; font-size:1rem; filter: drop-shadow(0 0 5px ${rankColor});">👑</div>` : ''}
                    </div>

                    <!-- Info Area -->
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-weight: 950; font-size: 0.95rem; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                            ${p.name}
                        </div>
                        <div style="display: flex; align-items: center; gap: 6px; margin-top: 4px;">
                            <span style="font-size: 0.55rem; font-weight: 900; background: rgba(255,255,255,0.05); color: #84cc16; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">
                                LVL ${p.level.toFixed(2)}
                            </span>
                            <span style="font-size: 0.6rem; color: #64748b; font-weight: 800; text-transform: uppercase;">
                                ${pStats.played} PART. • ${(pStats.won / pStats.played * 100 || 0).toFixed(0)}% WR
                            </span>
                        </div>
                        ${pointsToNext > 0 && pointsToNext < 15 ? `
                            <div style="font-size: 0.55rem; color: #84cc16; font-weight: 900; margin-top: 4px; letter-spacing: 0.3px;">
                                <i class="fas fa-fire"></i> A ${pointsToNext} PTS DEL PROX. RANGO
                            </div>
                        ` : ''}
                    </div>

                    <!-- Score Card -->
                    <div style="text-align: right; background: ${isTop3 ? 'rgba(204, 255, 0, 0.08)' : 'rgba(255,255,255,0.02)'}; padding: 8px 14px; border-radius: 12px; min-width: 70px; border: 1px solid ${isTop3 ? 'rgba(204,255,0,0.1)' : 'transparent'};">
                        <div style="font-weight: 950; font-size: 1.2rem; color: #fff; line-height: 1;">
                            ${pStats.points}
                        </div>
                        <div style="font-size: 0.55rem; color: #84cc16; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase; margin-top: 4px; opacity: 0.8;">
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
            this.render(this.playersData);
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
