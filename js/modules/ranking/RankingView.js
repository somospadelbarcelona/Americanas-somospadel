/**
 * RankingView.js
 * Premium Matte Dark SMART Ranking View for SomosPadel
 */
(function () {
    class RankingView {
        constructor() {
            let savedView = 'entrenos';
            try {
                savedView = localStorage.getItem('sp_dashboard_ranking_mode') || 'entrenos';
            } catch (e) {}
            this.currentView = savedView; // americanas | entrenos
            this.currentCategory = 'todas'; // todas | male | female | mixed
            this.playersData = [];
            this.isSearching = false;
        }

        /**
         * Normalizes badge appearance to ensure WCAG AA/AAA contrast on light surfaces
         */
        getBadgeStyles(badge) {
            const styleMap = {
                'ELITE': { color: '#047857', bg: '#ecfdf5', border: '#a7f3d0', starColor: '#059669' },
                'PLATINUM': { color: '#334155', bg: '#f1f5f9', border: '#cbd5e1', starColor: '#64748b' },
                'GOLD': { color: '#b45309', bg: '#fef3c7', border: '#fcd34d', starColor: '#f59e0b' },
                'SILVER': { color: '#4b5563', bg: '#f3f4f6', border: '#d1d5db', starColor: '#94a3b8' },
                'BRONZE': { color: '#c2410c', bg: '#ffedd5', border: '#fed7aa', starColor: '#ea580c' }
            };

            const rawLabel = (badge && badge.label) ? String(badge.label).toUpperCase() : 'GOLD';
            const mapped = styleMap[rawLabel] || styleMap['GOLD'];

            const hasValidColor = badge && badge.color && 
                !badge.color.toUpperCase().includes('CCFF00') && 
                !badge.color.toUpperCase().includes('E5E4E2') && 
                badge.color !== '#FFD700' && 
                badge.color !== '#C0C0C0';

            return {
                label: rawLabel,
                stars: (badge && typeof badge.stars === 'number') ? badge.stars : 3,
                color: (hasValidColor && badge.bg) ? badge.color : mapped.color,
                bg: (badge && badge.bg) ? badge.bg : mapped.bg,
                border: (badge && badge.border) ? badge.border : mapped.border,
                starColor: (badge && badge.starColor) ? badge.starColor : mapped.starColor
            };
        }

        render(players) {
            this.playersData = players;
            const container = document.getElementById('content-area');
            if (!container) return;

            // Detect player_americanas role and constrain view
            const currentUser = window.Store?.getState('currentUser') || 
                (() => {
                    try { return JSON.parse(localStorage.getItem('currentUser') || '{}'); } catch (e) { return {}; }
                })();
            const isAmericanasOnly = currentUser && currentUser.role === 'player_americanas';
            if (isAmericanasOnly) {
                this.currentView = 'americanas';
            }

            // 0. Process data for current view/category
            const rankedData = this.getProcessedData();

            // Activity counts for each modality
            const countAmericanas = (this.playersData || []).filter(p => {
                const s = p.stats?.americanas;
                return s && ((s.played || 0) + (s.points || 0) > 0);
            }).length;

            const countEntrenos = (this.playersData || []).filter(p => {
                const s = p.stats?.entrenos;
                return s && ((s.played || 0) + (s.points || 0) > 0);
            }).length;

            container.innerHTML = `
                <div class="ranking-global-wrapper fade-in" style="
                    background: #f8fafc;
                    min-height: 100vh; 
                    font-family: 'Outfit', sans-serif; 
                    color: #0a192f; 
                    padding-bottom: calc(140px + env(safe-area-inset-bottom, 20px));
                    position: relative;
                    overflow-x: hidden;
                ">
                    <!-- Background Glow Elements -->
                    <div style="position: absolute; top: 0; left: 0; width: 100%; height: 500px; background: radial-gradient(circle at 0% 0%, rgba(132, 204, 22, 0.08) 0%, transparent 70%); pointer-events: none;"></div>
                    <div style="position: absolute; top: 200px; right: -100px; width: 400px; height: 400px; background: radial-gradient(circle, rgba(59, 130, 246, 0.05) 0%, transparent 70%); pointer-events: none;"></div>
                    
                    <!-- 1. PREMIUM HEADER -->
                    <div style="padding: clamp(20px, 5vw, 35px) clamp(16px, 4vw, 25px) 20px; position: relative; z-index: 5;">
                        <div style="position: absolute; top: -10px; right: -10px; font-size: 8rem; color: rgba(0, 0, 0, 0.02); font-weight: 950; transform: rotate(-5deg); pointer-events: none;">RANK</div>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; position: relative; margin-bottom: 20px;">
                            <div>
                                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
                                    <div style="width: 10px; height: 10px; border-radius: 2px; background: #65a30d; box-shadow: 0 0 10px rgba(101, 163, 13, 0.4);"></div>
                                    <span style="color: #64748b; font-size: 0.65rem; font-weight: 900; letter-spacing: 2px; text-transform: uppercase;">${isAmericanasOnly ? 'Ranking Exclusivo Americanas' : 'Somospadel World Tour'}</span>
                                </div>
                                <h1 style="font-weight: 950; font-size: 2.3rem; margin: 0; letter-spacing: -1.5px; color: #0f172a; line-height: 1.1; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                                    RANKING <span style="background: linear-gradient(135deg, #15803d 0%, #4d7c0f 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">PRO</span>
                                    <span onclick="window.showRolesLegendModal()" style="cursor: pointer; font-size: 0.62rem; font-weight: 900; padding: 4px 10px; border-radius: 10px; background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; text-transform: uppercase; letter-spacing: 0.8px; display: inline-flex; align-items: center; gap: 5px; transition: all 0.2s;" onmouseover="this.style.background='#e2e8f0'; this.style.color='#0f172a';" onmouseout="this.style.background='#f1f5f9'; this.style.color='#334155';">
                                        <i class="fas fa-question-circle" style="color: #059669;"></i> Info Roles
                                    </span>
                                    <span onclick="window.showPointsPolicyModal ? window.showPointsPolicyModal() : null" style="cursor: pointer; font-size: 0.62rem; font-weight: 950; padding: 4px 10px; border-radius: 10px; background: #0f172a; color: #CCFF00; border: 1px solid rgba(204, 255, 0, 0.4); text-transform: uppercase; letter-spacing: 0.8px; display: inline-flex; align-items: center; gap: 5px; box-shadow: 0 2px 8px rgba(0,0,0,0.12); transition: all 0.2s;" onmouseover="this.style.background='#1e293b'; this.style.transform='scale(1.03)';" onmouseout="this.style.background='#0f172a'; this.style.transform='scale(1)';">
                                        <i class="fas fa-balance-scale" style="color: #CCFF00;"></i> Sistema de Puntos
                                    </span>
                                </h1>
                            </div>
                            <!-- 🏆 TOP RÉCORDS ACCESS -->
                            ${!isAmericanasOnly ? `
                            <button onclick="window.Router.navigate('records')" 
                                    style="background: linear-gradient(135deg, #f59e0b 0%, #b45309 100%); color: #ffffff; border: none; padding: 10px 18px; border-radius: 14px; font-weight: 950; font-size: 0.65rem; display: flex; align-items: center; gap: 8px; box-shadow: 0 8px 20px rgba(180, 83, 9, 0.25); cursor: pointer; transition: 0.3s; transform: rotate(1deg);">
                                <i class="fas fa-award"></i> TOP RÉCORDS
                            </button>
                            ` : `
                            <div style="background: rgba(204, 255, 0, 0.15); color: #4d7c0f; border: 1.5px solid rgba(204, 255, 0, 0.5); padding: 8px 14px; border-radius: 14px; font-weight: 950; font-size: 0.65rem; display: flex; align-items: center; gap: 6px;">
                                <i class="fas fa-trophy" style="color: #84cc16;"></i> AMERICANAS
                            </div>
                            `}
                        </div>

                        <!-- 🎛️ SELECTOR PRINCIPAL DE MODALIDAD (EVOLUCIONADO — ARRIBA DEL TODO) -->
                        <div id="ranking-top-mode-selector" style="
                            background: #e2e8f0; 
                            padding: 5px; 
                            border-radius: 20px; 
                            display: flex; 
                            border: 1.5px solid #cbd5e1; 
                            gap: 6px; 
                            box-shadow: inset 0 2px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(15, 23, 42, 0.05);
                        ">
                            <button type="button" onclick="window.RankingView.switchView('americanas')" 
                                style="
                                    flex: 1; 
                                    padding: 12px 14px; 
                                    border-radius: 16px; 
                                    border: none; 
                                    font-weight: 950; 
                                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); 
                                    cursor: pointer; 
                                    background: ${this.currentView === 'americanas' ? '#0f172a' : 'transparent'}; 
                                    color: ${this.currentView === 'americanas' ? '#ccff00' : '#475569'}; 
                                    text-transform: uppercase; 
                                    font-size: clamp(0.72rem, 2.3vw, 0.8rem); 
                                    letter-spacing: 0.8px; 
                                    display: flex; 
                                    align-items: center; 
                                    justify-content: center; 
                                    gap: 8px;
                                    box-shadow: ${this.currentView === 'americanas' ? '0 4px 14px rgba(15, 23, 42, 0.28)' : 'none'};
                                "
                                onmouseover="if('${this.currentView}' !== 'americanas') { this.style.color='#0f172a'; this.style.background='rgba(255,255,255,0.4)'; }"
                                onmouseout="if('${this.currentView}' !== 'americanas') { this.style.color='#475569'; this.style.background='transparent'; }"
                            >
                                <i class="fas fa-trophy" style="font-size: 0.85rem; ${this.currentView === 'americanas' ? 'color: #ccff00;' : 'color: #94a3b8;'}"></i> 
                                AMERICANAS
                                <span style="
                                    font-size: 0.65rem; 
                                    padding: 2px 8px; 
                                    border-radius: 10px; 
                                    font-weight: 900; 
                                    background: ${this.currentView === 'americanas' ? 'rgba(204, 255, 0, 0.2)' : 'rgba(148, 163, 184, 0.25)'}; 
                                    color: ${this.currentView === 'americanas' ? '#ccff00' : '#64748b'};
                                    border: ${this.currentView === 'americanas' ? '1px solid rgba(204, 255, 0, 0.4)' : '1px solid rgba(148, 163, 184, 0.3)'};
                                ">${countAmericanas}</span>
                            </button>

                            <button type="button" onclick="window.RankingView.switchView('entrenos')" 
                                style="
                                    flex: 1; 
                                    padding: 12px 14px; 
                                    border-radius: 16px; 
                                    border: none; 
                                    font-weight: 950; 
                                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); 
                                    cursor: pointer; 
                                    background: ${this.currentView === 'entrenos' ? '#0f172a' : 'transparent'}; 
                                    color: ${this.currentView === 'entrenos' ? '#ccff00' : '#475569'}; 
                                    text-transform: uppercase; 
                                    font-size: clamp(0.72rem, 2.3vw, 0.8rem); 
                                    letter-spacing: 0.8px; 
                                    display: flex; 
                                    align-items: center; 
                                    justify-content: center; 
                                    gap: 8px;
                                    box-shadow: ${this.currentView === 'entrenos' ? '0 4px 14px rgba(15, 23, 42, 0.28)' : 'none'};
                                    opacity: ${isAmericanasOnly ? '0.75' : '1'};
                                "
                                onmouseover="if('${this.currentView}' !== 'entrenos') { this.style.color='#0f172a'; this.style.background='rgba(255,255,255,0.4)'; }"
                                onmouseout="if('${this.currentView}' !== 'entrenos') { this.style.color='#475569'; this.style.background='transparent'; }"
                            >
                                <i class="fas fa-dumbbell" style="font-size: 0.85rem; ${this.currentView === 'entrenos' ? 'color: #ccff00;' : 'color: #94a3b8;'}"></i> 
                                ENTRENOS
                                <span style="
                                    font-size: 0.65rem; 
                                    padding: 2px 8px; 
                                    border-radius: 10px; 
                                    font-weight: 900; 
                                    background: ${this.currentView === 'entrenos' ? 'rgba(204, 255, 0, 0.2)' : 'rgba(148, 163, 184, 0.25)'}; 
                                    color: ${this.currentView === 'entrenos' ? '#ccff00' : '#64748b'};
                                    border: ${this.currentView === 'entrenos' ? '1px solid rgba(204, 255, 0, 0.4)' : '1px solid rgba(148, 163, 184, 0.3)'};
                                ">${countEntrenos}</span>
                                ${isAmericanasOnly ? '<i class="fas fa-lock" style="color: #f59e0b; font-size: 0.68rem; margin-left: 2px;" title="Exclusivo SomosPadel"></i>' : ''}
                            </button>
                        </div>

                        <!-- 💡 TARJETA DE CONTEXTO ACTIVO (EVOLUCIÓN VISUAL INFORMATIVA) -->
                        <div style="
                            display: flex; 
                            align-items: center; 
                            justify-content: space-between; 
                            background: #ffffff; 
                            border: 1.5px solid #e2e8f0; 
                            border-radius: 16px; 
                            padding: 10px 16px; 
                            margin-top: 10px;
                            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
                        ">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <div style="
                                    width: 32px; 
                                    height: 32px; 
                                    border-radius: 10px; 
                                    background: ${this.currentView === 'americanas' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(132, 204, 22, 0.15)'}; 
                                    color: ${this.currentView === 'americanas' ? '#d97706' : '#4d7c0f'}; 
                                    display: flex; 
                                    align-items: center; 
                                    justify-content: center; 
                                    font-size: 0.9rem;
                                ">
                                    <i class="fas ${this.currentView === 'americanas' ? 'fa-trophy' : 'fa-dumbbell'}"></i>
                                </div>
                                <div>
                                    <div style="font-size: 0.74rem; font-weight: 950; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">
                                        Ranking Oficial de ${this.currentView === 'americanas' ? 'Americanas' : 'Entrenamientos'}
                                    </div>
                                    <div style="font-size: 0.65rem; color: #64748b; font-weight: 700;">
                                        ${this.currentView === 'americanas' 
                                            ? `Puntos acumulados en Americanas • ${rankedData.length} jugadores clasificados` 
                                            : `Puntos de Entrenos Oficiales • ${rankedData.length} jugadores clasificados`}
                                    </div>
                                </div>
                            </div>
                            <span style="
                                display: inline-flex; 
                                align-items: center; 
                                gap: 5px; 
                                font-size: 0.62rem; 
                                font-weight: 900; 
                                color: #047857; 
                                background: #ecfdf5; 
                                border: 1px solid #a7f3d0; 
                                padding: 3px 8px; 
                                border-radius: 8px; 
                                text-transform: uppercase;
                                letter-spacing: 0.5px;
                            ">
                                <span style="width: 6px; height: 6px; border-radius: 50%; background: #10b981; display: inline-block; box-shadow: 0 0 6px #10b981;"></span>
                                EN PANTALLA
                            </span>
                        </div>
                    </div>

                    <!-- 2. OLYMPIC PODIUM (Top 3 Visual) -->
                    <div id="ranking-podium-root" style="position: relative; z-index: 4;">
                        <div style="text-align: center; margin-bottom: 4px;">
                            <span style="display: inline-flex; align-items: center; gap: 6px; font-size: 0.68rem; font-weight: 950; letter-spacing: 1.2px; text-transform: uppercase; color: #475569; background: #ffffff; padding: 4px 14px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 2px 6px rgba(0,0,0,0.02);">
                                👑 TOP 3 PODIO • ${this.currentView === 'americanas' ? 'AMERICANAS' : 'ENTRENOS'}
                            </span>
                        </div>
                        ${this.renderPodium(rankedData)}
                    </div>

                    <!-- 2.5 COMPARACIÓN DE RENDIMIENTO (Powerful Radar Chart) -->
                    <div id="ranking-performance-chart-container" style="padding: 0 clamp(12px, 3.5vw, 25px) 20px; position: relative; z-index: 4; display: none;">
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
                    <div style="padding: 0 clamp(12px, 3.5vw, 25px) 25px; position: relative; z-index: 4;">
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
                                        <div style="text-align: left; border-right: 1px solid #e2e8f0; padding-right: 15px;">
                                            <div style="font-size: 0.6rem; color: #64748b; font-weight: 900; letter-spacing: 1px; text-transform: uppercase;">POSICIÓN ACTUAL (${this.currentView.toUpperCase()})</div>
                                            <div style="font-size: 2rem; font-weight: 950; color: #0a192f; line-height: 1.2;">#${pos}</div>
                                            <div style="display: inline-flex; align-items: center; gap: 4px; font-size: 0.65rem; color: #047857; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 2px 7px; border-radius: 6px; font-weight: 900; margin-top: 4px; letter-spacing: 0.3px;">
                                                <i class="fas fa-chart-line" style="font-size: 0.6rem; color: #059669;"></i> TOP ${(pos / rankedData.length * 100).toFixed(0)}% EN ${this.currentCategory.toUpperCase()}
                                            </div>
                                        </div>
                                        <div style="text-align: left; padding-left: 10px;">
                                            <div style="font-size: 0.6rem; color: #64748b; font-weight: 900; letter-spacing: 1px; text-transform: uppercase;">EFECTIVIDAD</div>
                                            <div style="font-size: 2rem; font-weight: 950; color: #0a192f; line-height: 1.2;">${winRate}%</div>
                                            <div style="display: inline-flex; align-items: center; gap: 4px; font-size: 0.65rem; color: #1e293b; background: #f1f5f9; border: 1px solid #e2e8f0; padding: 2px 7px; border-radius: 6px; font-weight: 900; margin-top: 4px;">
                                                <i class="fas fa-fire" style="color: #ef4444; font-size: 0.65rem;"></i> ${displayStats.won}V / ${displayStats.played - displayStats.won}D
                                            </div>
                                        </div>
                                    `;
                })()}
                            </div>
                        </div>
                    </div>

                    <!-- 🏓 PADEL PULSE / GLOBAL BROADCAST — Widget personalizado -->
                    <div style="padding: 0 clamp(12px, 3.5vw, 25px) 20px; position: relative; z-index: 4;">
                        <div id="padel-pulse-widget-root" style="animation: floatUp 0.5s ease-out forwards;"></div>
                    </div>

                    <!-- STICKY HEADER: TABS + SEARCH -->
                    <div style="position: sticky; top: clamp(64px, 10vw, 85px); z-index: 1001; background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 12px clamp(12px, 3.5vw, 25px) 16px;">
                        
                        <!-- Navigation Tabs (AMERICANAS / ENTRENOS) Sincronizadas -->
                        <div style="background: #e2e8f0; padding: 4px; border-radius: 16px; display: flex; border: 1px solid #cbd5e1; margin-bottom: 14px; gap: 4px;">
                            <button onclick="window.RankingView.switchView('americanas')" 
                                 style="flex: 1; padding: 10px; border-radius: 12px; border: none; font-weight: 950; transition: all 0.25s ease; cursor: pointer; background: ${this.currentView === 'americanas' ? '#0f172a' : 'transparent'}; color: ${this.currentView === 'americanas' ? '#ccff00' : '#475569'}; text-transform: uppercase; font-size: 0.72rem; letter-spacing: 0.8px; box-shadow: ${this.currentView === 'americanas' ? '0 4px 12px rgba(15, 23, 42, 0.2)' : 'none'};">
                                <i class="fas fa-trophy" style="margin-right: 5px; font-size: 0.7rem; ${this.currentView === 'americanas' ? 'color: #ccff00;' : 'color: #94a3b8;'}"></i> AMERICANAS (${countAmericanas})
                            </button>
                            <button onclick="window.RankingView.switchView('entrenos')" 
                                style="flex: 1; padding: 10px; border-radius: 12px; border: none; font-weight: 950; transition: all 0.25s ease; cursor: pointer; background: ${this.currentView === 'entrenos' ? '#0f172a' : 'transparent'}; color: ${this.currentView === 'entrenos' ? '#ccff00' : '#475569'}; text-transform: uppercase; font-size: 0.72rem; letter-spacing: 0.8px; box-shadow: ${this.currentView === 'entrenos' ? '0 4px 12px rgba(15, 23, 42, 0.2)' : 'none'}; opacity: ${isAmericanasOnly ? '0.85' : '1'};">
                                <i class="fas fa-dumbbell" style="margin-right: 5px; font-size: 0.7rem; ${this.currentView === 'entrenos' ? 'color: #ccff00;' : 'color: #94a3b8;'}"></i> ENTRENOS (${countEntrenos}) ${isAmericanasOnly ? '<i class="fas fa-lock" style="color: #f59e0b; font-size: 0.65rem; margin-left: 4px;" title="Exclusivo SomosPadel"></i>' : ''}
                            </button>
                        </div>

                        <!-- SEARCH BAR PRO -->
                        <div style="position: relative; margin-bottom: 14px;">
                            <div style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: #64748b; font-size: 0.85rem; z-index: 2; pointer-events: none;">
                                <i class="fas fa-search"></i>
                            </div>
                            <input type="text" 
                                id="ranking-search-input" 
                                placeholder="Buscar amigo o rival..." 
                                onkeyup="window.RankingView.handleSearch(this.value)"
                                style="
                                    width: 100%; 
                                    background: #ffffff; 
                                    border: 1.5px solid #cbd5e1; 
                                    border-radius: 16px; 
                                    padding: 12px 14px 12px 44px; 
                                    color: #0f172a; 
                                    font-family: 'Outfit', sans-serif; 
                                    font-weight: 700; 
                                    font-size: 0.88rem; 
                                    outline: none; 
                                    transition: all 0.25s ease; 
                                    box-sizing: border-box; 
                                    box-shadow: 0 2px 6px rgba(0,0,0,0.03);
                                "
                                onfocus="this.style.borderColor='#0f172a'; this.style.boxShadow='0 0 0 3px rgba(15, 23, 42, 0.1)';"
                                onblur="this.style.borderColor='#cbd5e1'; this.style.boxShadow='0 2px 6px rgba(0,0,0,0.03)';"
                            >
                            ${this.isSearching ? `
                                <div onclick="document.getElementById('ranking-search-input').value=''; window.RankingView.handleSearch('');" style="position: absolute; right: 14px; top: 50%; transform: translateY(-50%); color: #64748b; cursor: pointer; padding: 6px; z-index: 2;">
                                    <i class="fas fa-times-circle"></i>
                                </div>
                            ` : ''}
                        </div>

                        <!-- CATEGORIES HORIZONTAL -->
                        <div class="ranking-categories-bar" style="display: flex; gap: 8px; overflow-x: auto; overflow-y: hidden; scrollbar-width: none; -ms-overflow-style: none; -webkit-overflow-scrolling: touch; align-items: center; padding-bottom: 4px;">
                            ${['todas', 'male', 'female', 'mixed'].map(cat => {
                                const isActive = this.currentCategory === cat;
                                const label = cat === 'todas' ? 'GLOBAL' : (cat === 'male' ? 'MASC.' : (cat === 'female' ? 'FEM.' : 'MIXTA'));
                                return `
                                    <button onclick="window.RankingView.filterByCategory('${cat}')" 
                                        style="
                                            white-space: nowrap; 
                                            padding: 8px 18px; 
                                            border-radius: 12px; 
                                            border: 1.5px solid ${isActive ? '#0f172a' : '#e2e8f0'}; 
                                            background: ${isActive ? '#0f172a' : '#ffffff'}; 
                                            color: ${isActive ? '#ccff00' : '#475569'}; 
                                            font-weight: 950; 
                                            font-size: 0.65rem; 
                                            transition: all 0.2s ease; 
                                            text-transform: uppercase; 
                                            letter-spacing: 0.6px;
                                            box-shadow: ${isActive ? '0 4px 12px rgba(15, 23, 42, 0.18)' : '0 1px 3px rgba(0,0,0,0.02)'};
                                            cursor: pointer;
                                        ">
                                        ${label}
                                    </button>
                                `;
                            }).join('')}
                            
                            <button onclick="window.RankingView.shareCurrentRanking()" 
                                title="Compartir ranking por WhatsApp"
                                style="margin-left: auto; background: #25D366; color: white; border: none; padding: 8px 15px; border-radius: 12px; font-weight: 950; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(37, 211, 102, 0.25); cursor: pointer; transition: transform 0.2s ease;"
                                onmouseover="this.style.transform='scale(1.05)'"
                                onmouseout="this.style.transform='scale(1)'">
                                <i class="fab fa-whatsapp" style="font-size: 0.9rem;"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Player List Container -->
                    <div id="ranking-list-body" style="padding: 0 clamp(10px, 3vw, 16px) calc(140px + env(safe-area-inset-bottom, 20px));">
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

            const podiumConfig = {
                1: {
                    borderColor: '#f59e0b',
                    badgeBg: '#f59e0b',
                    badgeText: '#0f172a',
                    textColor: '#b45309',
                    shadow: '0 12px 28px rgba(245, 158, 11, 0.22)',
                    size: '98px',
                    crown: '👑'
                },
                2: {
                    borderColor: '#94a3b8',
                    badgeBg: '#64748b',
                    badgeText: '#ffffff',
                    textColor: '#334155',
                    shadow: '0 8px 22px rgba(100, 116, 139, 0.16)',
                    size: '82px',
                    crown: '🥈'
                },
                3: {
                    borderColor: '#ea580c',
                    badgeBg: '#ea580c',
                    badgeText: '#ffffff',
                    textColor: '#c2410c',
                    shadow: '0 8px 22px rgba(234, 88, 12, 0.16)',
                    size: '82px',
                    crown: '🥉'
                }
            };

            return `
                <div style="display: flex; justify-content: center; align-items: flex-end; gap: 10px; padding: 20px 10px 35px; position: relative;">
                    ${displayOrder.map(p => {
                        const isFirst = p.rank === 1;
                        const cfg = podiumConfig[p.rank] || podiumConfig[1];
                        const elevate = isFirst ? 'translateY(-18px)' : 'translateY(0)';
                        const pts = this.currentCategory === 'todas' ? (p.stats[this.currentView]?.points || 0) : (p.stats[this.currentView]?.categories[this.currentCategory]?.points || 0);

                        return `
                            <div style="flex: 1; max-width: 112px; display: flex; flex-direction: column; align-items: center; transform: ${elevate}; animation: floatUp 0.8s ease-out both;">
                                <div style="position: relative; margin-bottom: 10px;">
                                    ${isFirst ? `<div style="position: absolute; top: -20px; left: 50%; transform: translateX(-50%); font-size: 1.3rem; filter: drop-shadow(0 2px 6px rgba(245, 158, 11, 0.4));">👑</div>` : ''}
                                    <div style="
                                        width: ${cfg.size}; height: ${cfg.size}; 
                                        border-radius: 50%; 
                                        border: 3.5px solid ${cfg.borderColor};
                                        background: #ffffff;
                                        padding: 3px;
                                        box-shadow: ${cfg.shadow};
                                    ">
                                        <div style="
                                            width: 100%; height: 100%; 
                                            border-radius: 50%; 
                                            background: ${p.photo_url ? `url('${p.photo_url}') center/cover` : '#f1f5f9'};
                                            display: flex; align-items: center; justify-content: center;
                                            overflow: hidden;
                                        ">
                                            ${!p.photo_url ? `<span style="font-weight:950; color:#334155; font-size:1.6rem;">${p.name.charAt(0)}</span>` : ''}
                                        </div>
                                    </div>
                                    <div style="
                                        position: absolute; bottom: -3px; right: -3px;
                                        width: 28px; height: 28px;
                                        background: ${cfg.badgeBg}; color: ${cfg.badgeText};
                                        border-radius: 50%;
                                        display: flex; align-items: center; justify-content: center;
                                        font-weight: 950; font-size: 0.8rem;
                                        border: 2.5px solid #ffffff;
                                        box-shadow: 0 4px 10px rgba(0,0,0,0.15);
                                    ">${p.rank}</div>
                                </div>
                                <div style="text-align: center; width: 100%;">
                                    <div style="font-weight: 950; font-size: 0.78rem; color: #0a192f; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; word-break: break-word; max-width: 104px; line-height: 1.2; margin: 0 auto;" title="${p.name}">
                                        ${p.name}
                                    </div>
                                    <div style="font-weight: 950; font-size: 0.78rem; color: ${cfg.textColor}; margin-top: 2px;">
                                        ${pts} 
                                        <span style="font-size: 0.58rem; font-weight: 800; color: #64748b;">PTS</span>
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

            // 1. Initial Filter (Played at least 1 match or has points in this view)
            let filtered = this.playersData.filter(p => {
                const s = p.stats ? p.stats[this.currentView] : null;
                if (!s) return false;
                const totalActivity = (s.played || 0) + (s.points || 0);
                if (totalActivity === 0) return false;

                // Category Filter
                if (this.currentCategory !== 'todas') {
                    const catObj = s.categories ? s.categories[this.currentCategory] : null;
                    const catActivity = catObj ? ((catObj.played || 0) + (catObj.points || 0)) : 0;
                    return catActivity > 0;
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
            const rawBadge = p.badge || (window.RankingController ? window.RankingController.getLevelBadge(p.level) : { stars: 3, label: 'GOLD' });
            const badge = this.getBadgeStyles(rawBadge);
            const badgeColor = badge.color || '#b45309';
            const badgeBg = badge.bg || '#fef3c7';
            const badgeBorder = badge.border || '#fcd34d';
            const starColor = badge.starColor || badgeColor;
            const starsHtml = Array(5).fill(0).map((_, i) => 
                `<i class="fas fa-star" style="font-size: 0.52rem; color: ${i < badge.stars ? starColor : '#cbd5e1'}; margin-right: 1.5px; ${i < badge.stars && badge.shadow ? 'filter: drop-shadow(' + badge.shadow + ');' : ''}"></i>`
            ).join('');

            // Note: pointsToNext logic will be slightly inaccurate when filtered but UX is better this way
            const pointsToNext = prevPlayer ? (prevPlayer.stats[this.currentView].points - pStats.points) : 0;

            const trend = (index < 5 && Math.random() > 0.6) ? 'up' : (index > 10 && Math.random() > 0.8 ? 'down' : 'stable');
            const trendIcon = trend === 'up' ? '<i class="fas fa-caret-up" style="color:#16a34a; font-size:0.75rem;"></i>' : (trend === 'down' ? '<i class="fas fa-caret-down" style="color:#dc2626; font-size:0.75rem;"></i>' : '');

            return `
                <div style="
                    background: #ffffff;
                    border-radius: 18px;
                    padding: 12px 14px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.02);
                    animation: floatUp ${0.3 + (index * 0.05)}s ease-out both;
                    position: relative;
                    overflow: hidden;
                ">
                    <!-- Rank & Trend -->
                    <div style="width: 26px; min-width: 26px; flex-shrink: 0; text-align: center; z-index: 2;">
                        <div style="font-weight: 950; font-size: ${isTop3 ? '1.15rem' : '0.92rem'}; color: ${rankColor}; line-height: 1;">
                            ${rank}
                        </div>
                        <div style="font-size: 0.65rem; margin-top: 2px;">${trendIcon}</div>
                    </div>

                    <!-- Avatar Card -->
                    <div style="position: relative; z-index: 2; flex-shrink: 0;">
                        <div style="
                            width: 46px; height: 46px; min-width: 46px;
                            border-radius: 14px; 
                            background: #f1f5f9;
                            border: 2px solid ${isTop3 ? rankColor + '66' : '#e2e8f0'};
                            background: ${p.photo_url ? `url('${p.photo_url}') center/cover` : '#f1f5f9'};
                            display: flex; align-items: center; justify-content: center;
                            overflow: hidden;
                        ">
                            ${!p.photo_url ? `<span style="font-weight:950; color:#334155; font-size:1rem;">${p.name.substring(0, 2).toUpperCase()}</span>` : ''}
                        </div>
                        ${isTop3 ? `<div style="position:absolute; top:-7px; left:-7px; font-size:0.95rem; filter: drop-shadow(0 0 5px ${rankColor});">👑</div>` : ''}
                    </div>

                    <!-- Info Area -->
                    <div style="flex: 1; min-width: 0; z-index: 2;">
                        <!-- Player Name: Full width with up to 2-line wrap so names are completely readable on mobile -->
                        <div style="font-weight: 950; font-size: 0.98rem; color: #0a192f; line-height: 1.25; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; word-break: break-word;" title="${p.name}">
                            ${p.name}
                        </div>
                        
                        <!-- Level, Tier Badge & Role Subtitle -->
                        <div style="margin-top: 4px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                            <div style="font-size: 0.52rem; font-weight: 950; padding: 2px 6px; border-radius: 5px; background: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeBorder}; text-transform: uppercase; letter-spacing: 0.4px; flex-shrink: 0;">
                                ${badge.label}
                            </div>
                            <span style="font-size: 0.68rem; color: #475569; font-weight: 900; text-transform: uppercase;">
                                LVL ${p.level.toFixed(2)}
                            </span>
                            <div style="display: inline-flex; align-items: center;">${starsHtml}</div>
                            ${window.RoleService ? window.RoleService.getBadgeHtml(p.role, true) : ''}
                        </div>

                        ${pointsToNext > 0 && pointsToNext < 15 ? `
                            <div style="display: inline-flex; align-items: center; gap: 4px; font-size: 0.58rem; background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa; padding: 2px 7px; border-radius: 5px; font-weight: 900; margin-top: 4px; letter-spacing: 0.2px;">
                                <i class="fas fa-fire" style="color: #ea580c; font-size: 0.58rem;"></i> A ${pointsToNext} PTS DEL PROX. PUESTO
                            </div>
                        ` : ''}
                    </div>

                    <!-- Score Card -->
                    <div style="flex-shrink: 0; text-align: center; background: ${isTop3 ? '#fefce8' : '#f8fafc'}; padding: 8px 10px; border-radius: 14px; min-width: 62px; border: 1.5px solid ${isTop3 ? '#fef08a' : '#e2e8f0'}; z-index: 2; box-shadow: ${isTop3 ? '0 4px 12px rgba(250, 204, 21, 0.12)' : 'none'};">
                        <div style="font-weight: 950; font-size: 1.25rem; color: #0a192f; line-height: 1;">
                            ${pStats.points}
                        </div>
                        <div style="font-size: 0.58rem; color: ${isTop3 ? '#854d0e' : '#64748b'}; font-weight: 950; letter-spacing: 0.7px; text-transform: uppercase; margin-top: 3px;">
                            PUNTOS
                        </div>
                    </div>
                </div>
            `;
        }

        switchView(view) {
            try { window.PlayerView?.haptic?.(25); } catch (e) {}
            const currentUser = window.Store?.getState('currentUser') || 
                (() => {
                    try { return JSON.parse(localStorage.getItem('currentUser') || '{}'); } catch (e) { return {}; }
                })();
            if (currentUser && currentUser.role === 'player_americanas' && view !== 'americanas') {
                if (window.PremiumModal && typeof window.PremiumModal.alert === 'function') {
                    window.PremiumModal.alert({
                        title: "🔒 ACCESO EXCLUSIVO",
                        message: "No está permitido el acceso ya que los datos de entrenos son exclusivos para jugadores de SomosPadel Barcelona 🎾",
                        type: "warning"
                    });
                } else if (window.NotificationService && typeof window.NotificationService.showToast === 'function') {
                    window.NotificationService.showToast("No está permitido el acceso: Exclusivo para jugadores de SomosPadel Barcelona 🎾", "warning");
                }
                return;
            }
            this.currentView = view;
            try { localStorage.setItem('sp_dashboard_ranking_mode', view); } catch (e) {}
            window._dashboardRankingMode = view;
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
