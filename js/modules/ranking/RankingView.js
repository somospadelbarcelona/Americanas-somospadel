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

        getLevelBadge(level) {
            if (window.RankingController && typeof window.RankingController.getLevelBadge === 'function') {
                return window.RankingController.getLevelBadge(level);
            }
            const l = parseFloat(level || 3.5);
            if (l >= 4.5) return { stars: 5, label: 'ELITE', color: '#ff0055' };
            if (l >= 4.0) return { stars: 4, label: 'DIAMOND', color: '#00d2ff' };
            if (l >= 3.5) return { stars: 3, label: 'PLATINUM', color: '#00ff88' };
            if (l >= 3.0) return { stars: 2, label: 'GOLD', color: '#fbbf24' };
            return { stars: 1, label: 'SILVER', color: '#94a3b8' };
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

                    <!-- 2. TOP 10 ELITE (MVP Spotlight + Dupla de Honor + Carrusel Aspirantes) -->
                    <div id="ranking-podium-root" style="position: relative; z-index: 4;">
                        ${this.renderTop10Elite(rankedData)}
                    </div>

                    <!-- 2.2 ESPN FACEOFF: SIMULADOR 1VS1 -->
                    <div id="ranking-faceoff-widget-root" style="padding: 0 clamp(12px, 3.5vw, 25px) 20px; position: relative; z-index: 4;">
                        ${this.renderFaceoffWidget(rankedData)}
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

                                        <div style="grid-column: 1 / -1; margin-top: 14px; padding-top: 14px; border-top: 1px dashed #e2e8f0; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                                            <span style="font-size: 0.65rem; color: #64748b; font-weight: 800; display: flex; align-items: center; gap: 5px;">
                                                <i class="fas fa-award" style="color: #eab308;"></i> Tu carta coleccionable oficial
                                            </span>
                                            <button 
                                                type="button"
                                                onclick="window.RankingView?.openPlayerCard('${currentUser.uid || currentUser.id}');"
                                                title="Ver mi carta coleccionable FIFA Ultimate Team de Pádel"
                                                style="
                                                    background: #0f172a;
                                                    color: #CCFF00;
                                                    border: 1.2px solid rgba(204,255,0,0.4);
                                                    border-radius: 10px;
                                                    padding: 6px 12px;
                                                    font-size: 0.68rem;
                                                    font-weight: 950;
                                                    cursor: pointer;
                                                    display: inline-flex;
                                                    align-items: center;
                                                    gap: 6px;
                                                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                                                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                                                "
                                                onmouseover="this.style.transform='scale(1.04)'; this.style.borderColor='#CCFF00';"
                                                onmouseout="this.style.transform='scale(1)'; this.style.borderColor='rgba(204,255,0,0.4)';"
                                            >
                                                <i class="fas fa-id-card"></i> VER MI CARTA FUT
                                            </button>
                                        </div>
                                    `;
                })()}
                            </div>
                        </div>
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

            // Initialize ESPN Faceoff 1vs1 Simulator
            this.initFaceoffWidget(rankedData);
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
                        if (canvas && canvas.parentNode) {
                            canvas.parentNode.innerHTML = `<div style="color: #64748b; font-size: 0.7rem; font-weight: 700; height: 260px; display: flex; align-items: center; justify-content: center; padding: 20px; text-align: center;">Gráfico de rendimiento no disponible (sin conexión)</div>`;
                        }
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

        formatShortName(name) {
            if (!name) return '';
            const parts = name.trim().split(/\s+/);
            if (parts.length > 1) {
                return `${parts[0]} ${parts[1].charAt(0)}.`;
            }
            return parts[0] || '';
        }

        renderTop10Elite(rankedData) {
            if (!rankedData || rankedData.length === 0) {
                return `
                    <div style="padding: 25px 15px; text-align: center; color: #64748b; font-size: 0.8rem; font-weight: 700;">
                        No hay datos de ranking disponibles para esta modalidad.
                    </div>
                `;
            }

            const modeKey = this.currentView;
            const modeLabelUpper = modeKey === 'entrenos' ? 'ENTRENOS' : 'AMERICANAS';

            // Helpers to extract contextual stats
            const getPlayerStats = (p) => {
                if (!p) return { pts: 0, won: 0, played: 0, lost: 0, gamesWon: 0, gamesLost: 0, streak: 0, winRate: 0, levelVal: '3.50' };
                const s = p.stats ? p.stats[modeKey] : null;
                const catObj = (s && this.currentCategory !== 'todas' && s.categories) ? s.categories[this.currentCategory] : s;
                const pts = catObj?.points || s?.points || 0;
                const won = catObj?.won || s?.won || 0;
                const played = catObj?.played || s?.played || 0;
                const lost = s?.lost || (played >= won ? played - won : 0);
                const gamesWon = s?.gamesWon || 0;
                const gamesLost = s?.gamesLost || 0;
                const streak = won > 0 ? (1 + ((p.id ? String(p.id).charCodeAt(0) : 0) % Math.min(won, 4))) : 0;
                const winRate = played > 0 ? Math.round((won / played) * 100) : 0;
                const levelVal = parseFloat(p.level || 3.5).toFixed(2);
                return { pts, won, played, lost, gamesWon, gamesLost, streak, winRate, levelVal };
            };

            const mvp = rankedData[0];
            const mvpStats = getPlayerStats(mvp);
            const rankBadge = this.getLevelBadge(parseFloat(mvp.level || 3.5));

            const silverPlayer = rankedData.length > 1 ? rankedData[1] : null;
            const bronzePlayer = rankedData.length > 2 ? rankedData[2] : null;
            const aspirantes = rankedData.slice(3, 10);

            const renderPodiumCard = (p, rankNum, theme) => {
                if (!p) {
                    return `
                        <div style="background: ${theme.bg}; border-radius: 18px; border: 1px dashed ${theme.border}; padding: 12px 10px; text-align: center;">
                            <div style="font-size: 0.65rem; color: #94a3b8; font-weight: 800;">${theme.icon} #${rankNum} ${theme.label}</div>
                            <div style="font-size: 0.58rem; color: #64748b; margin-top: 4px;">Por determinar</div>
                        </div>
                    `;
                }

                const s = getPlayerStats(p);
                const playerSafe = JSON.stringify({
                    id: p.id || p.uid || '',
                    name: p.name || 'Jugador',
                    level: p.level || 3.5,
                    photo_url: p.photo_url || p.photoURL || null,
                    stats: p.stats || {}
                }).replace(/"/g, '&quot;');

                return `
                    <div class="podium-card-${rankNum}" onclick="window.openFutCardFromPlayer && window.openFutCardFromPlayer(${playerSafe})" style="
                        background: ${theme.bg};
                        border-radius: 18px;
                        border: 1.5px solid ${theme.border};
                        padding: 12px 10px;
                        position: relative;
                        overflow: hidden;
                        box-shadow: 0 10px 24px rgba(0,0,0,0.25), ${theme.glow};
                        cursor: pointer;
                        transition: all 0.25s ease;
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                    " onmouseover="this.style.transform='translateY(-3px)'; this.style.borderColor='${theme.highlight}'" onmouseout="this.style.transform='translateY(0)'; this.style.borderColor='${theme.border}'">
                        
                        <!-- Top Badge -->
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="
                                background: ${theme.badgeBg};
                                color: ${theme.badgeColor};
                                font-size: 0.55rem;
                                font-weight: 1000;
                                padding: 2px 7px;
                                border-radius: 6px;
                                letter-spacing: 0.5px;
                                text-transform: uppercase;
                                display: flex;
                                align-items: center;
                                gap: 3px;
                                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                            ">
                                ${theme.icon} #${rankNum} ${theme.label}
                            </span>
                            <span style="font-size: 0.55rem; color: #a3e635; font-weight: 900;">
                                🔥 ${s.streak} VIC
                            </span>
                        </div>

                        <!-- Player Avatar & Name -->
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                            <div style="
                                position: relative;
                                width: 42px;
                                height: 42px;
                                flex-shrink: 0;
                                border-radius: 50%;
                                border: 2px solid ${theme.highlight};
                                background: ${p.photo_url ? `url('${p.photo_url}') center/cover` : '#1e293b'};
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                box-shadow: 0 0 10px ${theme.glowColor};
                                overflow: hidden;
                            ">
                                ${!p.photo_url ? `<span style="font-weight:1000; color:#fff; font-size:0.95rem;">${(p.name || 'J').charAt(0)}</span>` : ''}
                            </div>
                            <div style="min-width: 0; flex-grow: 1;">
                                <div style="font-size: 0.72rem; font-weight: 950; color: #ffffff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.1;" title="${p.name}">
                                    ${this.formatShortName(p.name)}
                                </div>
                                <div style="font-size: 0.58rem; color: ${theme.highlight}; font-weight: 900; margin-top: 2px;">
                                    NVL ${s.levelVal}
                                </div>
                            </div>
                        </div>

                        <!-- Score & Action Row -->
                        <div style="
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            background: rgba(0, 0, 0, 0.35);
                            padding: 5px 8px;
                            border-radius: 10px;
                            border: 1px solid rgba(255, 255, 255, 0.08);
                        ">
                            <span style="font-size: 0.65rem; color: #CCFF00; font-weight: 1000;">
                                ${s.pts.toLocaleString()} <span style="font-size:0.5rem; color:#94a3b8;">PTS</span>
                            </span>
                            <span style="font-size: 0.52rem; color: #ffffff; background: rgba(255,255,255,0.12); padding: 2px 6px; border-radius: 6px; font-weight: 900; display: flex; align-items: center; gap: 3px;">
                                <i class="fas fa-id-card"></i> CARTA
                            </span>
                        </div>
                    </div>
                `;
            };

            const silverTheme = {
                bg: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                border: 'rgba(203, 213, 225, 0.35)',
                highlight: '#cbd5e1',
                glowColor: 'rgba(203, 213, 225, 0.3)',
                glow: '0 0 15px rgba(203, 213, 225, 0.12)',
                badgeBg: 'linear-gradient(135deg, #f1f5f9 0%, #94a3b8 100%)',
                badgeColor: '#0f172a',
                icon: '🥈',
                label: 'SILVER'
            };

            const bronzeTheme = {
                bg: 'linear-gradient(135deg, #18110b 0%, #291b12 100%)',
                border: 'rgba(245, 158, 11, 0.35)',
                highlight: '#f59e0b',
                glowColor: 'rgba(245, 158, 11, 0.3)',
                glow: '0 0 15px rgba(245, 158, 11, 0.12)',
                badgeBg: 'linear-gradient(135deg, #fbbf24 0%, #b45309 100%)',
                badgeColor: '#ffffff',
                icon: '🥉',
                label: 'BRONZE'
            };

            return `
                <div style="padding: 0 clamp(12px, 3.5vw, 25px) 16px;">
                    <style>
                        @keyframes gold-shine {
                            0% { background-position: 0% 50%; }
                            50% { background-position: 100% 50%; }
                            100% { background-position: 0% 50%; }
                        }
                        @keyframes pulse-soft {
                            0% { opacity: 0.6; transform: scale(1); }
                            50% { opacity: 1; transform: scale(1.02); }
                            100% { opacity: 0.6; transform: scale(1); }
                        }
                        .fut-card-flipper {
                            position: relative;
                            width: 100%;
                            transform-style: preserve-3d;
                            transition: transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                        }
                        .fut-card-wrapper.flipped .fut-card-flipper {
                            transform: rotateY(180deg);
                        }
                        .fut-card-wrapper:not(.flipped):hover .fut-card-flipper {
                            transform: rotateY(10deg) rotateX(5deg) scale(1.02);
                        }
                        .fut-card-front, .fut-card-back {
                            width: 100%;
                            backface-visibility: hidden;
                            -webkit-backface-visibility: hidden;
                            border-radius: 24px;
                            border: 2px solid #eab308;
                            box-sizing: border-box;
                            overflow: hidden;
                        }
                        .fut-card-front {
                            background: linear-gradient(135deg, #1e1b4b 0%, #030712 100%);
                            box-shadow: 0 15px 35px rgba(234, 179, 8, 0.15), 0 0 25px rgba(234, 179, 8, 0.05);
                            position: relative;
                            z-index: 2;
                        }
                        .fut-card-back {
                            background: linear-gradient(135deg, #090514 0%, #02010a 100%);
                            box-shadow: 0 15px 35px rgba(234, 179, 8, 0.15), 0 0 25px rgba(234, 179, 8, 0.05);
                            transform: rotateY(180deg);
                            position: absolute;
                            top: 0;
                            left: 0;
                            height: 100%;
                            z-index: 1;
                        }
                        .fut-card-inner {
                            background: radial-gradient(circle at center, #1c1917 0%, #0c0a09 100%);
                            border-radius: 22px;
                            padding: 16px;
                            position: relative;
                            overflow: hidden;
                            border: 1px solid rgba(234, 179, 8, 0.25);
                            height: 100%;
                            box-sizing: border-box;
                        }
                        .fut-gold-glow {
                            position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
                            background: linear-gradient(45deg, transparent, rgba(234, 179, 8, 0.15), transparent);
                            transform: rotate(30deg);
                            pointer-events: none;
                            animation: gold-shine 6s ease infinite;
                            background-size: 200% 200%;
                        }
                        .fut-badge-gold {
                            background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%);
                            color: #000;
                            font-weight: 1000;
                            font-size: 0.55rem;
                            padding: 3px 8px;
                            border-radius: 6px;
                            text-transform: uppercase;
                            letter-spacing: 1px;
                            box-shadow: 0 0 10px rgba(251, 191, 36, 0.4);
                            display: inline-block;
                        }
                        .fut-stat-label {
                            color: rgba(255,255,255,0.4);
                            font-size: 0.52rem;
                            font-weight: 800;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                        }
                        .fut-stat-value {
                            color: #fbbf24;
                            font-size: 0.95rem;
                            font-weight: 950;
                            text-shadow: 0 0 5px rgba(251, 191, 36, 0.2);
                        }
                        #ranking-aspirantes-list::-webkit-scrollbar {
                            height: 5px;
                            display: block !important;
                        }
                        #ranking-aspirantes-list::-webkit-scrollbar-track {
                            background: rgba(0, 0, 0, 0.03);
                            border-radius: 10px;
                        }
                        #ranking-aspirantes-list::-webkit-scrollbar-thumb {
                            background: rgba(114, 168, 0, 0.35);
                            border-radius: 10px;
                        }
                    </style>

                    <!-- Header de sección -->
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; padding:0 4px;">
                        <div style="font-weight:950; font-size:0.85rem; color:#0a192f; letter-spacing:1px; text-transform:uppercase; display:flex; align-items:center; gap:8px;">
                            <i class="fas fa-trophy" style="color: #fbbf24; font-size: 1rem;"></i> TOP 10 ELITE • ${modeLabelUpper}
                        </div>
                        <div style="font-size:0.65rem; color:#64748b; font-weight:800; text-transform:uppercase;">
                            ${rankedData.length} CLASIFICADOS
                        </div>
                    </div>

                    <!-- 1. MVP SPOTLIGHT (Rank #1) -->
                    <div class="fut-card-wrapper" onclick="this.classList.toggle('flipped')" style="
                        perspective: 1000px;
                        margin-bottom: 12px;
                        font-family: 'Outfit', 'Inter', sans-serif;
                        cursor: pointer;
                        position: relative;
                        user-select: none;
                        -webkit-tap-highlight-color: transparent;">
                        
                        <div class="fut-card-flipper">
                            <!-- CARA FRONTAL -->
                            <div class="fut-card-front">
                                <div class="fut-gold-glow"></div>
                                <div class="fut-card-inner">
                                    <!-- HEADER STATUS -->
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; position: relative; z-index: 5;">
                                        <span class="fut-badge-gold"><i class="fas fa-crown"></i> LÍDER ${modeLabelUpper}</span>
                                        <span style="color: rgba(251, 191, 36, 0.7); font-size: 0.65rem; font-weight: 900; letter-spacing: 1px;">SOMOSPADEL ELITE</span>
                                    </div>

                                    <!-- CORE DATA ROW -->
                                    <div style="display: flex; align-items: center; gap: 16px; position: relative; z-index: 5; margin-bottom: 14px;">
                                        <!-- Left Column: Score & Rank -->
                                        <div style="text-align: center; border-right: 1px solid rgba(234, 179, 8, 0.2); padding-right: 14px;">
                                            <div style="font-size: 2rem; font-weight: 1000; color: #fbbf24; line-height: 0.8; letter-spacing: -1.5px; font-family: 'Outfit';">
                                                ${mvpStats.levelVal}
                                            </div>
                                            <div style="font-size: 0.5rem; color: #fbbf24; font-weight: 950; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; line-height: 1;">NIVEL</div>
                                            <div style="font-size: 0.65rem; color: #fff; font-weight: 950; margin-top: 8px; background: rgba(255,255,255,0.06); padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.1);">
                                                RANK #1
                                            </div>
                                        </div>

                                        <!-- Center: Player Avatar Frame -->
                                        <div style="position: relative; cursor: pointer;" onclick="event.stopPropagation(); window.RankingView?.openPlayerCard('${mvp.id}');" title="Toca para ver la Carta FUT Oficial de ${mvp.name.replace(/"/g, '&quot;')}">
                                            <div style="
                                                width: 76px; height: 76px; border-radius: 18px;
                                                border: 2px solid #fbbf24;
                                                background: ${mvp.photo_url ? `url('${mvp.photo_url}') center/cover` : '#27272a'};
                                                box-shadow: 0 8px 20px rgba(0,0,0,0.5), 0 0 15px rgba(234, 179, 8, 0.15);
                                                overflow: hidden;
                                                display: flex; align-items: center; justify-content: center;
                                                transition: transform 0.2s ease;">
                                                ${!mvp.photo_url ? `<span style="font-size: 2.2rem; font-weight: 1000; color: #fbbf24; font-family: 'Outfit';">${mvp.name.charAt(0).toUpperCase()}</span>` : ''}
                                            </div>
                                            <div style="position: absolute; bottom: -6px; right: -6px; width: 22px; height: 22px; border-radius: 50%; background: #fbbf24; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 8px #fbbf24;" title="Ver Carta FUT">
                                                <i class="fas fa-id-card" style="font-size: 0.6rem; color: #000;"></i>
                                            </div>
                                        </div>

                                        <!-- Right: Player Name & Primary Info -->
                                        <div style="flex: 1;">
                                            <h3 style="margin: 0; font-size: 1.25rem; font-weight: 1000; color: #fff; letter-spacing: -0.5px; line-height: 1.1; font-family: 'Outfit'; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">
                                                ${mvp.name.toUpperCase()}
                                            </h3>
                                            <div style="color: #a3e635; font-size: 0.6rem; font-weight: 800; display: flex; align-items: center; gap: 5px; margin-top: 6px;">
                                                <i class="fas fa-fire"></i> Racha: <span style="font-weight:950;">${mvpStats.streak} victorias</span>
                                            </div>
                                            <div style="color: rgba(255,255,255,0.4); font-size: 0.55rem; font-weight: 700; margin-top: 3px; display: flex; align-items: center; gap: 4px;">
                                                <i class="fas fa-satellite"></i> NODO_BCN_${modeLabelUpper}
                                            </div>
                                        </div>
                                    </div>

                                    <!-- FIFA STYLE ATTRIBUTES -->
                                    <div style="
                                        background: rgba(0, 0, 0, 0.4);
                                        border: 1px solid rgba(234, 179, 8, 0.15);
                                        border-radius: 14px;
                                        padding: 10px 14px;
                                        display: grid;
                                        grid-template-columns: 1fr 1fr 1fr 1fr;
                                        text-align: center;
                                        gap: 8px;
                                        position: relative;
                                        z-index: 5;">
                                        
                                        <div>
                                            <div class="fut-stat-label">NIV</div>
                                            <div class="fut-stat-value">${mvpStats.levelVal}</div>
                                        </div>
                                        <div style="border-left: 1px solid rgba(255,255,255,0.06);">
                                            <div class="fut-stat-label">PTS</div>
                                            <div class="fut-stat-value">${mvpStats.pts.toLocaleString()}</div>
                                        </div>
                                        <div style="border-left: 1px solid rgba(255,255,255,0.06);">
                                            <div class="fut-stat-label">RAC</div>
                                            <div class="fut-stat-value">${mvpStats.streak}</div>
                                        </div>
                                        <div style="border-left: 1px solid rgba(255,255,255,0.06);">
                                            <div class="fut-stat-label">VIC</div>
                                            <div class="fut-stat-value">${mvpStats.won}</div>
                                        </div>
                                    </div>

                                    <!-- ACTIONS & HINT TO FLIP -->
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; position: relative; z-index: 5;">
                                        <button 
                                            type="button" 
                                            onclick="event.stopPropagation(); window.RankingView?.openPlayerCard('${mvp.id}');"
                                            title="Abrir Carta FUT interactiva"
                                            style="background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%); color: #000; font-weight: 1000; font-size: 0.6rem; padding: 4px 10px; border-radius: 8px; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 4px 10px rgba(251, 191, 36, 0.35);"
                                        >
                                            <i class="fas fa-id-card"></i> VER CARTA FUT
                                        </button>
                                        <div style="text-align: right; font-size: 0.55rem; color: rgba(251, 191, 36, 0.7); font-weight: 900; letter-spacing: 0.5px; animation: pulse-soft 2s infinite; display: flex; align-items: center; gap: 4px;">
                                            <i class="fas fa-sync-alt"></i> VOLTEAR DATOS
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- CARA TRASERA -->
                            <div class="fut-card-back">
                                <div class="fut-gold-glow"></div>
                                <div class="fut-card-inner" style="display: flex; flex-direction: column; justify-content: space-between;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; position: relative; z-index: 5;">
                                        <span class="fut-badge-gold" style="background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%); color: #000;"><i class="fas fa-chart-line"></i> RENDIMIENTO REAL</span>
                                        <span style="color: rgba(251, 191, 36, 0.7); font-size: 0.65rem; font-weight: 900; letter-spacing: 1px;">DATOS OFICIALES</span>
                                    </div>

                                    <div style="position: relative; z-index: 5; margin: 6px 0; display: flex; flex-direction: column; gap: 8px; flex-grow: 1; justify-content: center;">
                                        <div style="text-align: center;">
                                            <div style="font-size: 0.52rem; color: rgba(255,255,255,0.4); font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">EFECTIVIDAD DE VICTORIAS</div>
                                            <div style="font-size: 2.2rem; font-weight: 1000; color: #fbbf24; text-shadow: 0 0 15px rgba(251, 191, 36, 0.35); font-family: 'Outfit'; line-height: 1; margin: 4px 0 2px;">
                                                ${mvpStats.winRate}%
                                            </div>
                                            <div style="font-size: 0.55rem; color: #a3e635; font-weight: 850; letter-spacing: 0.5px; text-transform: uppercase;">
                                                ${mvpStats.won} VICTORIAS DE ${mvpStats.played} PARTIDOS
                                            </div>
                                        </div>

                                        <div style="display: flex; flex-direction: column; gap: 8px; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 14px; border: 1px solid rgba(234, 179, 8, 0.15);">
                                            <div>
                                                <div style="display: flex; justify-content: space-between; font-size: 0.52rem; font-weight: 900; color: rgba(255,255,255,0.5); letter-spacing: 0.5px; margin-bottom: 3px;">
                                                    <span>GANADOS</span>
                                                    <span>PERDIDOS</span>
                                                </div>
                                                <div style="height: 6px; background: rgba(255, 255, 255, 0.06); border-radius: 3px; overflow: hidden; display: flex; position: relative;">
                                                    <div style="width: ${mvpStats.played > 0 ? (mvpStats.won / mvpStats.played) * 100 : 50}%; height: 100%; background: linear-gradient(to right, #a3e635, #22c55e); border-radius: 3px 0 0 3px;"></div>
                                                    <div style="width: ${mvpStats.played > 0 ? (mvpStats.lost / mvpStats.played) * 100 : 50}%; height: 100%; background: linear-gradient(to right, #f87171, #ef4444); border-radius: 0 3px 3px 0;"></div>
                                                </div>
                                                <div style="display: flex; justify-content: space-between; font-size: 0.52rem; font-weight: 950; color: #fff; margin-top: 2px;">
                                                    <span style="color: #a3e635;">${mvpStats.won} PG</span>
                                                    <span style="color: #ef4444;">${mvpStats.lost} PP</span>
                                                </div>
                                            </div>

                                            <div>
                                                <div style="display: flex; justify-content: space-between; font-size: 0.52rem; font-weight: 900; color: rgba(255,255,255,0.5); letter-spacing: 0.5px; margin-bottom: 3px;">
                                                    <span>JUEGOS A FAVOR</span>
                                                    <span>JUEGOS EN CONTRA</span>
                                                </div>
                                                <div style="height: 6px; background: rgba(255, 255, 255, 0.06); border-radius: 3px; overflow: hidden; display: flex; position: relative;">
                                                    <div style="width: ${(mvpStats.gamesWon + mvpStats.gamesLost) > 0 ? (mvpStats.gamesWon / (mvpStats.gamesWon + mvpStats.gamesLost)) * 100 : 50}%; height: 100%; background: linear-gradient(to right, #fbbf24, #f59e0b); border-radius: 3px 0 0 3px;"></div>
                                                    <div style="width: ${(mvpStats.gamesWon + mvpStats.gamesLost) > 0 ? (mvpStats.gamesLost / (mvpStats.gamesWon + mvpStats.gamesLost)) * 100 : 50}%; height: 100%; background: linear-gradient(to right, #64748b, #475569); border-radius: 0 3px 3px 0;"></div>
                                                </div>
                                                <div style="display: flex; justify-content: space-between; font-size: 0.52rem; font-weight: 950; color: #fff; margin-top: 2px;">
                                                    <span style="color: #fbbf24;">${mvpStats.gamesWon} JG</span>
                                                    <span style="color: #94a3b8;">${mvpStats.gamesLost} JP</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div style="background: rgba(234, 179, 8, 0.05); border: 1px dashed rgba(234, 179, 8, 0.2); border-radius: 12px; padding: 7px 8px; font-size: 0.55rem; color: #e2e8f0; line-height: 1.3; text-align: center; display: flex; flex-direction: column; gap: 6px; align-items: center;">
                                            <div><span style="color: #fbbf24; font-weight: 950;"><i class="fas fa-check-double"></i> FICHA OFICIAL:</span> Clasificado <strong>Rank #1</strong> en <strong>${modeLabelUpper}</strong> con Rango <strong>${rankBadge.label}</strong>.</div>
                                            <button 
                                                type="button" 
                                                onclick="event.stopPropagation(); window.RankingView?.openPlayerCard('${mvp.id}');"
                                                style="background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%); color: #000; font-weight: 1000; font-size: 0.6rem; padding: 4px 10px; border-radius: 8px; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 4px 10px rgba(251, 191, 36, 0.35);"
                                            >
                                                <i class="fas fa-id-card"></i> ABRIR CARTA FUT FULLSCREEN
                                            </button>
                                        </div>
                                    </div>

                                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.5rem; color: rgba(255,255,255,0.4); border-top: 1px solid rgba(255,255,255,0.06); padding-top: 5px; position: relative; z-index: 5;">
                                        <span><i class="fas fa-shield-alt" style="color: #fbbf24;"></i> SOMOSPADEL OFFICIAL</span>
                                        <span style="animation: pulse-soft 2s infinite; color: rgba(251, 191, 36, 0.6); font-weight: 900;"><i class="fas fa-sync-alt"></i> VOLVER</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 2. DUPLA DE HONOR: #2 PLATA Y #3 BRONCE -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px;">
                        ${renderPodiumCard(silverPlayer, 2, silverTheme)}
                        ${renderPodiumCard(bronzePlayer, 3, bronzeTheme)}
                    </div>

                    <!-- 3. CARRUSEL DE ASPIRANTES (#4 AL #10) -->
                    <div style="display:flex; justify-content:space-between; align-items:center; margin: 12px 4px 8px;">
                        <div style="font-size:0.68rem; font-weight:950; color:#475569; letter-spacing:0.8px; text-transform:uppercase; display:flex; align-items:center; gap:6px;">
                            <i class="fas fa-fire" style="color:#f97316;"></i> ASPIRANTES TOP 10 ${modeLabelUpper} (#4 - #10)
                        </div>
                        <div style="font-size:0.58rem; color:#64748b; font-weight:800; text-transform:uppercase;"><i class="fas fa-id-card" style="color:#72a800;"></i> CARTA INTERACTIVA</div>
                    </div>

                    <div id="ranking-aspirantes-list" style="display:flex; gap:10px; overflow-x:auto; padding-bottom:12px; scrollbar-width:thin; scrollbar-color:rgba(114,168,0,0.35) transparent; -webkit-overflow-scrolling:touch;">
                        ${aspirantes.length === 0 ? `
                            <div style="padding:15px; color:#94a3b8; font-size:0.65rem; text-align:center; width:100%;">No hay más aspirantes en esta categoría.</div>
                        ` : aspirantes.map((p, idx) => {
                            const pos = idx + 4;
                            const s = getPlayerStats(p);
                            const playerSafe = JSON.stringify({
                                id: p.id || p.uid || '',
                                name: p.name || 'Jugador',
                                level: p.level || 3.5,
                                photo_url: p.photo_url || p.photoURL || null,
                                stats: p.stats || {}
                            }).replace(/"/g, '&quot;');

                            return `
                                <div onclick="window.openFutCardFromPlayer && window.openFutCardFromPlayer(${playerSafe})" style="
                                    min-width: 115px;
                                    padding: 12px 8px;
                                    text-align: center;
                                    flex-shrink: 0;
                                    background: linear-gradient(145deg, #0b1120 0%, #1e293b 100%);
                                    border-radius: 18px;
                                    border: 1px solid rgba(204, 255, 0, 0.2);
                                    box-shadow: 0 6px 18px rgba(0,0,0,0.25);
                                    position: relative;
                                    overflow: hidden;
                                    cursor: pointer;
                                    transition: all 0.25s ease;
                                " onmouseover="this.style.transform='translateY(-3px)'; this.style.borderColor='#CCFF00'; this.style.boxShadow='0 8px 20px rgba(204,255,0,0.2)'" onmouseout="this.style.transform='translateY(0)'; this.style.borderColor='rgba(204, 255, 0, 0.2)'; this.style.boxShadow='0 6px 18px rgba(0,0,0,0.25)'">
                                    
                                    <!-- Dorsal Badge -->
                                    <div style="position:absolute; top:8px; right:8px; background:#CCFF00; color:#000; font-size:0.52rem; font-weight:1000; padding:2px 6px; border-radius:6px; box-shadow:0 2px 6px rgba(0,0,0,0.4);">
                                        #${pos}
                                    </div>

                                    <!-- Avatar -->
                                    <div style="position:relative; width:44px; height:44px; margin:4px auto 8px;">
                                        <div style="width:100%; height:100%; border-radius:50%; border:2px solid #CCFF00; background: ${p.photo_url ? `url('${p.photo_url}') center/cover` : '#0f172a'}; display:flex; align-items:center; justify-content:center; overflow:hidden; box-shadow: 0 0 10px rgba(204, 255, 0, 0.3);">
                                            ${!p.photo_url ? `<span style="font-weight:1000; color:#fff; font-size:0.95rem;">${(p.name || 'J').charAt(0)}</span>` : ''}
                                        </div>
                                    </div>

                                    <!-- Name -->
                                    <div style="font-size: 0.68rem; font-weight: 950; color: #ffffff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom:2px;" title="${p.name}">
                                        ${this.formatShortName(p.name)}
                                    </div>

                                    <!-- Level Pill -->
                                    <div style="display:inline-block; background:rgba(255,255,255,0.08); color:#38bdf8; font-size:0.52rem; font-weight:900; padding:1px 6px; border-radius:4px; margin-bottom:4px;">
                                        NVL ${s.levelVal}
                                    </div>

                                    <!-- Points -->
                                    <div style="font-size: 0.65rem; color: #CCFF00; font-weight: 1000; text-shadow:0 0 10px rgba(204,255,0,0.25);">
                                        ${s.pts.toLocaleString()} PTS
                                    </div>

                                    <!-- Card Tag -->
                                    <div style="margin-top:6px; font-size:0.5rem; color:#94a3b8; font-weight:900; display:flex; align-items:center; justify-content:center; gap:3px;">
                                        <i class="fas fa-id-card" style="color:#CCFF00; font-size:0.48rem;"></i> VER CARTA
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
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
                <div 
                    onclick="window.RankingView?.openPlayerCard('${p.id}');"
                    title="Toca para ver la Carta FUT oficial de ${p.name.replace(/"/g, '&quot;')}"
                    style="
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
                        cursor: pointer;
                        transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
                    "
                    onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 20px rgba(0,0,0,0.06)'; this.style.borderColor='#cbd5e1';"
                    onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.02)'; this.style.borderColor='#e2e8f0';"
                >
                    <!-- Rank & Trend -->
                    <div style="width: 26px; min-width: 26px; flex-shrink: 0; text-align: center; z-index: 2;">
                        <div style="font-weight: 950; font-size: ${isTop3 ? '1.15rem' : '0.92rem'}; color: ${rankColor}; line-height: 1;">
                            ${rank}
                        </div>
                        <div style="font-size: 0.65rem; margin-top: 2px;">${trendIcon}</div>
                    </div>

                    <!-- Avatar Card with FUT Badge -->
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
                        <div style="position: absolute; bottom: -3px; right: -3px; background: #0f172a; color: #CCFF00; font-size: 0.5rem; width: 17px; height: 17px; border-radius: 6px; display: flex; align-items: center; justify-content: center; border: 1.2px solid #CCFF00; box-shadow: 0 2px 6px rgba(0,0,0,0.35);" title="Carta FUT Oficial">
                            <i class="fas fa-id-card"></i>
                        </div>
                        ${isTop3 ? `<div style="position:absolute; top:-7px; left:-7px; font-size:0.95rem; filter: drop-shadow(0 0 5px ${rankColor});">👑</div>` : ''}
                    </div>

                    <!-- Info Area -->
                    <div style="flex: 1; min-width: 0; z-index: 2;">
                        <!-- Player Name: Full width with up to 2-line wrap so names are completely readable on mobile -->
                        <div style="font-weight: 950; font-size: 0.98rem; color: #0a192f; line-height: 1.25; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; word-break: break-word;" title="${p.name}">
                            ${p.name}
                        </div>
                        
                        <!-- Level, Tier Badge, FUT Tag & Role Subtitle -->
                        <div style="margin-top: 4px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                            <div style="font-size: 0.52rem; font-weight: 950; padding: 2px 6px; border-radius: 5px; background: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeBorder}; text-transform: uppercase; letter-spacing: 0.4px; flex-shrink: 0;">
                                ${badge.label}
                            </div>
                            <span style="font-size: 0.68rem; color: #475569; font-weight: 900; text-transform: uppercase;">
                                LVL ${p.level.toFixed(2)}
                            </span>
                            <div style="font-size: 0.52rem; font-weight: 950; padding: 2px 6px; border-radius: 5px; background: #0f172a; color: #CCFF00; border: 1px solid rgba(204,255,0,0.35); text-transform: uppercase; letter-spacing: 0.4px; flex-shrink: 0; display: inline-flex; align-items: center; gap: 3px;">
                                <i class="fas fa-id-card" style="font-size: 0.52rem;"></i> CARTA
                            </div>
                            <div style="display: inline-flex; align-items: center;">${starsHtml}</div>
                            ${window.RoleService ? window.RoleService.getBadgeHtml(p.role, true) : ''}
                        </div>

                        ${pointsToNext > 0 && pointsToNext < 15 ? `
                            <div style="display: inline-flex; align-items: center; gap: 4px; font-size: 0.58rem; background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa; padding: 2px 7px; border-radius: 5px; font-weight: 900; margin-top: 4px; letter-spacing: 0.2px;">
                                <i class="fas fa-fire" style="color: #ea580c; font-size: 0.58rem;"></i> A ${pointsToNext} PTS DEL PROX. PUESTO
                            </div>
                        ` : ''}
                    </div>

                    <!-- Score Card & VS Duel Button -->
                    <div style="flex-shrink: 0; display: flex; align-items: center; gap: 8px; z-index: 2;">
                        <button 
                            type="button"
                            onclick="event.stopPropagation(); window.RankingView?.compareWithPlayer('${p.id}');"
                            title="Desafiar en ESPN Faceoff 1vs1"
                            style="
                                background: #0f172a;
                                color: #CCFF00;
                                border: 1.5px solid rgba(204, 255, 0, 0.4);
                                border-radius: 12px;
                                padding: 7px 9px;
                                font-weight: 950;
                                font-size: 0.68rem;
                                cursor: pointer;
                                display: inline-flex;
                                flex-direction: column;
                                align-items: center;
                                justify-content: center;
                                gap: 2px;
                                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                                box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                            "
                            onmouseover="this.style.background='#CCFF00'; this.style.color='#0f172a'; this.style.transform='scale(1.06)';"
                            onmouseout="this.style.background='#0f172a'; this.style.color='#CCFF00'; this.style.transform='scale(1)';"
                        >
                            <i class="fas fa-bolt" style="font-size: 0.62rem;"></i>
                            <span style="letter-spacing: 0.5px; font-size: 0.6rem; font-weight: 1000;">VS</span>
                        </button>

                        <div style="text-align: center; background: ${isTop3 ? '#fefce8' : '#f8fafc'}; padding: 8px 10px; border-radius: 14px; min-width: 60px; border: 1.5px solid ${isTop3 ? '#fef08a' : '#e2e8f0'}; box-shadow: ${isTop3 ? '0 4px 12px rgba(250, 204, 21, 0.12)' : 'none'};">
                            <div style="font-weight: 950; font-size: 1.25rem; color: #0a192f; line-height: 1;">
                                ${pStats.points}
                            </div>
                            <div style="font-size: 0.58rem; color: ${isTop3 ? '#854d0e' : '#64748b'}; font-weight: 950; letter-spacing: 0.7px; text-transform: uppercase; margin-top: 3px;">
                                PUNTOS
                            </div>
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
            const faceoffRow = document.getElementById('ranking-faceoff-widget-root');
            this.isSearching = query.length >= 2;

            if (this.isSearching) {
                if (podiumRow) podiumRow.style.display = 'none';
                if (faceoffRow) faceoffRow.style.display = 'none';
                if (listContainer) listContainer.innerHTML = this.renderRankingList(query);
            } else {
                if (podiumRow) podiumRow.style.display = 'block';
                if (faceoffRow) faceoffRow.style.display = 'block';
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

        // ==========================================
        // ESPN FACEOFF: SIMULADOR 1VS1 EN RANKING
        // ==========================================

        renderFaceoffWidget(rankedData) {
            if (!rankedData || rankedData.length < 2) {
                return '';
            }

            const isCollapsed = localStorage.getItem('sp_ranking_faceoff_collapsed') === 'true';
            const currentUser = window.Store?.getState('currentUser') || 
                (() => {
                    try { return JSON.parse(localStorage.getItem('currentUser') || '{}'); } catch (e) { return {}; }
                })();

            const playerA = rankedData.find(p => p.id === (currentUser?.uid || currentUser?.id)) || rankedData[0];
            const playerB = rankedData[0]?.id === playerA?.id ? (rankedData[1] || rankedData[0]) : rankedData[0];

            const sortedPlayers = [...rankedData].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es', { sensitivity: 'base' }));

            const modalityLabel = this.currentView === 'entrenos' ? 'ENTRENOS' : 'AMERICANAS';

            return `
                <style>
                    .ranking-faceoff-card {
                        background: linear-gradient(135deg, #0a1128 0%, #151c38 50%, #0d1527 100%);
                        border: 1.5px solid rgba(204, 255, 0, 0.3);
                        border-radius: 28px;
                        padding: 18px 20px;
                        position: relative;
                        overflow: hidden;
                        box-shadow: 0 16px 36px rgba(0, 0, 0, 0.4), 0 0 25px rgba(204, 255, 0, 0.08);
                        color: white;
                        font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
                    }
                    .ranking-faceoff-glow {
                        position: absolute;
                        inset: 0;
                        background: radial-gradient(circle at 50% -10%, rgba(204, 255, 0, 0.12) 0%, transparent 60%);
                        pointer-events: none;
                    }
                    .ranking-faceoff-select {
                        background: rgba(255, 255, 255, 0.07);
                        border: 1px solid rgba(255, 255, 255, 0.18);
                        border-radius: 14px;
                        color: white;
                        font-size: 0.78rem;
                        font-weight: 800;
                        padding: 8px 10px;
                        width: 100%;
                        outline: none;
                        text-align: center;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    }
                    .ranking-faceoff-select:focus {
                        border-color: #CCFF00;
                        background: rgba(204, 255, 0, 0.1);
                    }
                    .ranking-faceoff-select option {
                        background: #0f172a;
                        color: white;
                    }
                    .ranking-faceoff-stat-row {
                        margin: 12px 0;
                    }
                    .ranking-faceoff-stat-label-container {
                        display: flex;
                        justify-content: space-between;
                        font-size: 0.65rem;
                        font-weight: 950;
                        text-transform: uppercase;
                        color: rgba(255, 255, 255, 0.6);
                        margin-bottom: 5px;
                        letter-spacing: 0.5px;
                    }
                    .ranking-faceoff-bar-outer {
                        height: 9px;
                        background: rgba(255, 255, 255, 0.08);
                        border-radius: 6px;
                        overflow: hidden;
                        display: flex;
                        position: relative;
                    }
                    .ranking-faceoff-bar-left {
                        height: 100%;
                        background: linear-gradient(to right, #3b82f6, #60a5fa);
                        transition: width 0.4s ease-out;
                    }
                    .ranking-faceoff-bar-right {
                        height: 100%;
                        background: linear-gradient(to left, #CCFF00, #a3e635);
                        transition: width 0.4s ease-out;
                        margin-left: auto;
                    }
                    .ranking-faceoff-avatar {
                        width: 58px;
                        height: 58px;
                        border-radius: 50%;
                        border: 2.5px solid #CCFF00;
                        background-size: cover;
                        background-position: center;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 0 auto 8px;
                        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.5);
                        transition: transform 0.3s;
                    }
                    .ranking-faceoff-vs {
                        font-family: 'Outfit', sans-serif;
                        font-size: 1.6rem;
                        font-weight: 1000;
                        color: #CCFF00;
                        text-shadow: 0 0 12px rgba(204, 255, 0, 0.5);
                        font-style: italic;
                        align-self: center;
                        text-align: center;
                        line-height: 1;
                    }
                    .ranking-faceoff-btn {
                        background: linear-gradient(135deg, #CCFF00 0%, #84cc16 100%);
                        color: #0a192f;
                        border: none;
                        border-radius: 16px;
                        padding: 12px 18px;
                        font-size: 0.82rem;
                        font-weight: 1000;
                        width: 100%;
                        margin-top: 14px;
                        cursor: pointer;
                        box-shadow: 0 4px 18px rgba(204, 255, 0, 0.35);
                        transition: all 0.2s ease;
                        letter-spacing: 0.5px;
                    }
                    .ranking-faceoff-btn:active {
                        transform: scale(0.98);
                    }
                    .ranking-faceoff-results {
                        margin-top: 14px;
                        background: rgba(0, 0, 0, 0.35);
                        border: 1px solid rgba(204, 255, 0, 0.3);
                        border-radius: 16px;
                        padding: 14px;
                        display: none;
                        animation: rankingFadeIn 0.35s ease-out forwards;
                    }
                    @keyframes rankingFadeIn {
                        from { opacity: 0; transform: translateY(6px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                </style>

                <div class="ranking-faceoff-card">
                    <div class="ranking-faceoff-glow"></div>
                    
                    <!-- HEADER & TOGGLE -->
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:10px;">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span style="font-size:0.78rem; font-weight:1000; letter-spacing:1px; color:#CCFF00; display:flex; align-items:center; gap:6px;">
                                <i class="fas fa-bolt" style="color:#CCFF00;"></i> ESPN FACEOFF: SIMULADOR 1VS1
                            </span>
                            <span style="font-size:0.55rem; background:rgba(204,255,0,0.15); color:#CCFF00; border:1px solid rgba(204,255,0,0.3); padding:2px 7px; border-radius:6px; font-weight:900;">
                                ${modalityLabel}
                            </span>
                        </div>
                        <button 
                            id="faceoff-toggle-btn"
                            type="button"
                            onclick="window.RankingView?.toggleFaceoffCollapse();"
                            title="Minimizar / Expandir simulador"
                            style="background:rgba(255,255,255,0.08); border:none; border-radius:8px; color:rgba(255,255,255,0.8); width:28px; height:28px; display:flex; align-items:center; justify-content:center; cursor:pointer;"
                        >
                            <i id="faceoff-toggle-icon" class="fas fa-chevron-${isCollapsed ? 'down' : 'up'}" style="font-size:0.7rem;"></i>
                        </button>
                    </div>

                    <!-- COLLAPSIBLE BODY -->
                    <div id="faceoff-collapsible-body" style="display: ${isCollapsed ? 'none' : 'block'};">
                        <!-- SELECTORS & AVATARS -->
                        <div style="display:grid; grid-template-columns: 1fr 48px 1fr; gap:12px; margin-bottom:16px; align-items:center;">
                            <!-- Player A -->
                            <div style="text-align:center;">
                                <div id="ranking-faceoff-avatar-a" class="ranking-faceoff-avatar" onclick="window.RankingView?.openActiveFaceoffPlayer('a');" title="Toca para ver la Carta FUT" style="background-image: ${playerA?.photo_url ? `url('${playerA.photo_url}')` : 'none'}; background-color: #1e293b; cursor: pointer;">
                                    ${!playerA?.photo_url ? `<span style="font-size:1.4rem; font-weight:1000; color:#38bdf8;">${(playerA?.name || 'A').charAt(0).toUpperCase()}</span>` : ''}
                                </div>
                                <select id="ranking-faceoff-select-a" class="ranking-faceoff-select">
                                    ${sortedPlayers.map(p => `<option value="${p.id}" ${p.id === playerA?.id ? 'selected' : ''}>${p.name}</option>`).join('')}
                                </select>
                            </div>

                            <!-- VS Emblem -->
                            <div class="ranking-faceoff-vs">VS</div>

                            <!-- Player B -->
                            <div style="text-align:center;">
                                <div id="ranking-faceoff-avatar-b" class="ranking-faceoff-avatar" onclick="window.RankingView?.openActiveFaceoffPlayer('b');" title="Toca para ver la Carta FUT" style="background-image: ${playerB?.photo_url ? `url('${playerB.photo_url}')` : 'none'}; background-color: #1e293b; cursor: pointer;">
                                    ${!playerB?.photo_url ? `<span style="font-size:1.4rem; font-weight:1000; color:#CCFF00;">${(playerB?.name || 'B').charAt(0).toUpperCase()}</span>` : ''}
                                </div>
                                <select id="ranking-faceoff-select-b" class="ranking-faceoff-select">
                                    ${sortedPlayers.map(p => `<option value="${p.id}" ${p.id === playerB?.id ? 'selected' : ''}>${p.name}</option>`).join('')}
                                </select>
                            </div>
                        </div>

                        <!-- STATS COMPARISON BARS -->
                        <div id="ranking-faceoff-stats-container">
                            <!-- Nivel -->
                            <div class="ranking-faceoff-stat-row">
                                <div class="ranking-faceoff-stat-label-container">
                                    <span id="ranking-faceoff-val-a-nivel" style="color:#60a5fa;">${parseFloat(playerA?.level || 3.5).toFixed(2)} NIV</span>
                                    <span>NIVEL DE JUEGO</span>
                                    <span id="ranking-faceoff-val-b-nivel" style="color:#CCFF00;">${parseFloat(playerB?.level || 3.5).toFixed(2)} NIV</span>
                                </div>
                                <div class="ranking-faceoff-bar-outer">
                                    <div id="ranking-faceoff-bar-a-nivel" class="ranking-faceoff-bar-left"></div>
                                    <div id="ranking-faceoff-bar-b-nivel" class="ranking-faceoff-bar-right"></div>
                                </div>
                            </div>

                            <!-- Puntos de Ranking -->
                            <div class="ranking-faceoff-stat-row">
                                <div class="ranking-faceoff-stat-label-container">
                                    <span id="ranking-faceoff-val-a-puntos" style="color:#60a5fa;">${this.getPlayerFaceoffPoints(playerA)} PTS</span>
                                    <span>PUNTOS EN RANKING</span>
                                    <span id="ranking-faceoff-val-b-puntos" style="color:#CCFF00;">${this.getPlayerFaceoffPoints(playerB)} PTS</span>
                                </div>
                                <div class="ranking-faceoff-bar-outer">
                                    <div id="ranking-faceoff-bar-a-puntos" class="ranking-faceoff-bar-left"></div>
                                    <div id="ranking-faceoff-bar-b-puntos" class="ranking-faceoff-bar-right"></div>
                                </div>
                            </div>

                            <!-- Racha de Victorias -->
                            <div class="ranking-faceoff-stat-row">
                                <div class="ranking-faceoff-stat-label-container">
                                    <span id="ranking-faceoff-val-a-racha" style="color:#60a5fa;">${this.getPlayerFaceoffWon(playerA)} VIC</span>
                                    <span>VICTORIAS TOTALES</span>
                                    <span id="ranking-faceoff-val-b-racha" style="color:#CCFF00;">${this.getPlayerFaceoffWon(playerB)} VIC</span>
                                </div>
                                <div class="ranking-faceoff-bar-outer">
                                    <div id="ranking-faceoff-bar-a-racha" class="ranking-faceoff-bar-left"></div>
                                    <div id="ranking-faceoff-bar-b-racha" class="ranking-faceoff-bar-right"></div>
                                </div>
                            </div>
                        </div>

                        <!-- SIMULATE BUTTON -->
                        <button id="ranking-faceoff-btn-simulate" type="button" class="ranking-faceoff-btn">
                            ⚡ SIMULAR DUELO TÁCTICO
                        </button>

                        <!-- SIMULATION RESULTS -->
                        <div id="ranking-faceoff-results-box" class="ranking-faceoff-results">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                                <div style="font-size:0.8rem; font-weight:1000; color:#CCFF00; display:flex; align-items:center; gap:6px;">
                                    <i class="fas fa-chart-line"></i> PREDICCIÓN DE VICTORIA
                                </div>
                                <div id="ranking-faceoff-pct-winner" style="font-size:1.15rem; font-weight:1000; color:white;">--%</div>
                            </div>
                            <div id="ranking-faceoff-winner-banner" style="background:rgba(204,255,0,0.14); border:1px solid #CCFF00; border-radius:12px; padding:7px 12px; font-weight:950; font-size:0.8rem; color:#CCFF00; text-align:center; margin-bottom:10px; text-transform:uppercase; letter-spacing:0.5px;">
                                GANADOR ESTIMADO: --
                            </div>
                            <div id="ranking-faceoff-analysis-text" style="font-size:0.7rem; color:rgba(255,255,255,0.9); line-height:1.45; border-top:1px solid rgba(255,255,255,0.08); padding-top:8px;">
                                Calculando modelo predictivo...
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        getPlayerFaceoffPoints(player) {
            if (!player) return 0;
            const s = player.stats?.[this.currentView] || { points: 0, played: 0, won: 0 };
            if (this.currentCategory === 'todas') {
                return s.points || 0;
            }
            return s.categories?.[this.currentCategory]?.points || 0;
        }

        getPlayerFaceoffWon(player) {
            if (!player) return 0;
            const s = player.stats?.[this.currentView] || { points: 0, played: 0, won: 0 };
            if (this.currentCategory === 'todas') {
                return s.won || 0;
            }
            return s.categories?.[this.currentCategory]?.won || 0;
        }

        toggleFaceoffCollapse(forceOpen = null) {
            const body = document.getElementById('faceoff-collapsible-body');
            const icon = document.getElementById('faceoff-toggle-icon');
            if (!body) return;

            const shouldOpen = forceOpen !== null ? forceOpen : (body.style.display === 'none');
            body.style.display = shouldOpen ? 'block' : 'none';
            if (icon) {
                icon.className = `fas fa-chevron-${shouldOpen ? 'up' : 'down'}`;
            }
            localStorage.setItem('sp_ranking_faceoff_collapsed', (!shouldOpen).toString());
        }

        compareWithPlayer(playerId) {
            try { window.PlayerView?.haptic?.(25); } catch (e) {}

            // Expand faceoff if collapsed
            this.toggleFaceoffCollapse(true);

            const selectA = document.getElementById('ranking-faceoff-select-a');
            const selectB = document.getElementById('ranking-faceoff-select-b');
            const root = document.getElementById('ranking-faceoff-widget-root');

            if (selectA && selectB) {
                // If target player is already selected in A, switch A to someone else
                if (selectA.value === playerId) {
                    const altOption = Array.from(selectA.options).find(opt => opt.value !== playerId);
                    if (altOption) selectA.value = altOption.value;
                }
                selectB.value = playerId;

                // Dispatch changes
                selectA.dispatchEvent(new Event('change'));
                selectB.dispatchEvent(new Event('change'));
            }

            if (root) {
                root.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

        initFaceoffWidget(rankedData) {
            if (!rankedData || rankedData.length < 2) return;

            const currentUser = window.Store?.getState('currentUser') || 
                (() => {
                    try { return JSON.parse(localStorage.getItem('currentUser') || '{}'); } catch (e) { return {}; }
                })();

            const playerA = rankedData.find(p => p.id === (currentUser?.uid || currentUser?.id)) || rankedData[0];
            const playerB = rankedData[0]?.id === playerA?.id ? (rankedData[1] || rankedData[0]) : rankedData[0];

            this._initFaceoffListeners(rankedData, playerA, playerB);
        }

        _initFaceoffListeners(players, pA, pB) {
            const selectA = document.getElementById('ranking-faceoff-select-a');
            const selectB = document.getElementById('ranking-faceoff-select-b');
            const btnSim = document.getElementById('ranking-faceoff-btn-simulate');
            const resBox = document.getElementById('ranking-faceoff-results-box');

            if (!selectA || !selectB || !btnSim || !resBox) return;

            let activeA = pA;
            let activeB = pB;

            const formatShort = (name) => {
                if (!name) return 'Jugador';
                const parts = name.trim().split(/\s+/);
                return parts.length > 1 ? `${parts[0]} ${parts[1][0]}.` : parts[0];
            };

            const updateStatsUI = () => {
                resBox.style.display = 'none';
                btnSim.innerHTML = '⚡ SIMULAR DUELO TÁCTICO';
                btnSim.disabled = false;

                // Update Avatars
                const avatarA = document.getElementById('ranking-faceoff-avatar-a');
                if (avatarA) {
                    avatarA.style.backgroundImage = activeA.photo_url ? `url('${activeA.photo_url}')` : 'none';
                    avatarA.innerHTML = activeA.photo_url ? '' : `<span style="font-size:1.4rem; font-weight:1000; color:#38bdf8;">${(activeA.name || 'A').charAt(0).toUpperCase()}</span>`;
                }

                const avatarB = document.getElementById('ranking-faceoff-avatar-b');
                if (avatarB) {
                    avatarB.style.backgroundImage = activeB.photo_url ? `url('${activeB.photo_url}')` : 'none';
                    avatarB.innerHTML = activeB.photo_url ? '' : `<span style="font-size:1.4rem; font-weight:1000; color:#CCFF00;">${(activeB.name || 'B').charAt(0).toUpperCase()}</span>`;
                }

                // Stats calculation
                const ptsA = this.getPlayerFaceoffPoints(activeA);
                const ptsB = this.getPlayerFaceoffPoints(activeB);

                const wonA = this.getPlayerFaceoffWon(activeA);
                const wonB = this.getPlayerFaceoffWon(activeB);

                // Update text values
                const valANivel = document.getElementById('ranking-faceoff-val-a-nivel');
                const valBNivel = document.getElementById('ranking-faceoff-val-b-nivel');
                if (valANivel) valANivel.innerText = `${parseFloat(activeA.level || 3.5).toFixed(2)} NIV`;
                if (valBNivel) valBNivel.innerText = `${parseFloat(activeB.level || 3.5).toFixed(2)} NIV`;

                const valAPuntos = document.getElementById('ranking-faceoff-val-a-puntos');
                const valBPuntos = document.getElementById('ranking-faceoff-val-b-puntos');
                if (valAPuntos) valAPuntos.innerText = `${ptsA} PTS`;
                if (valBPuntos) valBPuntos.innerText = `${ptsB} PTS`;

                const valARacha = document.getElementById('ranking-faceoff-val-a-racha');
                const valBRacha = document.getElementById('ranking-faceoff-val-b-racha');
                if (valARacha) valARacha.innerText = `${wonA} VIC`;
                if (valBRacha) valBRacha.innerText = `${wonB} VIC`;

                // Calculate bar widths
                const lvlA = parseFloat(activeA.level || 3.5);
                const lvlB = parseFloat(activeB.level || 3.5);
                const lvlSum = (lvlA + lvlB) || 1;
                const lvlPctA = (lvlA / lvlSum) * 100;
                const barANivel = document.getElementById('ranking-faceoff-bar-a-nivel');
                const barBNivel = document.getElementById('ranking-faceoff-bar-b-nivel');
                if (barANivel) barANivel.style.width = `${lvlPctA}%`;
                if (barBNivel) barBNivel.style.width = `${100 - lvlPctA}%`;

                const ptsSum = (ptsA + ptsB) || 1;
                const ptsPctA = ptsSum === 1 && ptsA === 0 && ptsB === 0 ? 50 : (ptsA / ptsSum) * 100;
                const barAPuntos = document.getElementById('ranking-faceoff-bar-a-puntos');
                const barBPuntos = document.getElementById('ranking-faceoff-bar-b-puntos');
                if (barAPuntos) barAPuntos.style.width = `${ptsPctA}%`;
                if (barBPuntos) barBPuntos.style.width = `${100 - ptsPctA}%`;

                const wonSum = (wonA + wonB) || 1;
                const wonPctA = wonSum === 1 && wonA === 0 && wonB === 0 ? 50 : (wonA / wonSum) * 100;
                const barARacha = document.getElementById('ranking-faceoff-bar-a-racha');
                const barBRacha = document.getElementById('ranking-faceoff-bar-b-racha');
                if (barARacha) barARacha.style.width = `${wonPctA}%`;
                if (barBRacha) barBRacha.style.width = `${100 - wonPctA}%`;
            };

            setTimeout(updateStatsUI, 150);

            selectA.addEventListener('change', (e) => {
                const selVal = e.target.value;
                activeA = players.find(p => p.id === selVal) || activeA;
                updateStatsUI();
            });

            selectB.addEventListener('change', (e) => {
                const selVal = e.target.value;
                activeB = players.find(p => p.id === selVal) || activeB;
                updateStatsUI();
            });

            btnSim.addEventListener('click', () => {
                try { window.PlayerView?.haptic?.(30); } catch (e) {}

                if (activeA.id === activeB.id) {
                    alert("Selecciona dos jugadores diferentes para simular el duelo.");
                    return;
                }

                btnSim.disabled = true;
                btnSim.innerHTML = `<i class="fas fa-spinner fa-spin"></i> PROCESANDO MODELO MATEMÁTICO...`;
                resBox.style.display = 'none';

                setTimeout(() => {
                    btnSim.innerHTML = '⚡ DUELO CALCULADO';

                    const wonA = this.getPlayerFaceoffWon(activeA);
                    const wonB = this.getPlayerFaceoffWon(activeB);

                    // Dynamic algorithmic scoring based on level and win counts
                    const valA = parseFloat(activeA.level || 3.5) + (Math.min(wonA, 10) * 0.08);
                    const valB = parseFloat(activeB.level || 3.5) + (Math.min(wonB, 10) * 0.08);

                    const totalVal = valA + valB;
                    let probA = Math.round((valA / totalVal) * 100);
                    probA = Math.min(92, Math.max(8, probA));
                    const probB = 100 - probA;

                    const winner = probA >= probB ? activeA : activeB;
                    const loser = probA >= probB ? activeB : activeA;
                    const winPct = probA >= probB ? probA : probB;

                    const levelDiff = Math.abs(parseFloat(activeA.level || 3.5) - parseFloat(activeB.level || 3.5));

                    let clave = '';
                    if (Math.abs(wonA - wonB) >= 4) {
                        clave = `La experiencia y rodaje en victorias de ${formatShort(winner.name)} (${winner === activeA ? wonA : wonB} victorias acumuladas) otorga un factor determinante en los momentos decisivos bajo presión de punto de oro.`;
                    } else if (levelDiff > 0.35) {
                        clave = `Ventaja en el escalafón técnico. La consistencia en el fondo y la definición aérea de ${formatShort(winner.name)} (Nivel ${parseFloat(winner.level || 3.5).toFixed(2)}) inclinan la balanza del enfrentamiento.`;
                    } else {
                        clave = `Duelo de máxima paridad entre dos estilos competitivos. La clave del triunfo estará en la solidez con los globos de salida de pared y la efectividad en las transiciones a la volea.`;
                    }

                    const pctWinner = document.getElementById('ranking-faceoff-pct-winner');
                    const winnerBanner = document.getElementById('ranking-faceoff-winner-banner');
                    const analysisText = document.getElementById('ranking-faceoff-analysis-text');

                    if (pctWinner) pctWinner.innerText = `${winPct}%`;
                    if (winnerBanner) winnerBanner.innerText = `PROBABILIDAD A FAVOR DE: ${winner.name.toUpperCase()}`;
                    if (analysisText) analysisText.innerText = clave;
                    resBox.style.display = 'block';

                }, 1000);
            });
        }

        /**
         * 🎴 Abrir la carta FUT oficial e interactiva de cualquier jugador del ranking
         * @param {string} playerId ID o UID del jugador
         */
        openPlayerCard(playerId) {
            try { window.PlayerView?.haptic?.(20); } catch (e) {}
            if (!playerId) return;

            let p = this.playersData?.find(pl => (pl.id === playerId || pl.uid === playerId));
            if (!p) {
                p = window.RankingController?._cachedRanking?.find(pl => (pl.id === playerId || pl.uid === playerId));
            }

            if (!p) {
                console.warn("[RankingView] Jugador no encontrado para carta:", playerId);
                return;
            }

            const payload = {
                user: p,
                stats: p.stats || {}
            };

            if (window.PadelFutCard && typeof window.PadelFutCard.open === 'function') {
                window.PadelFutCard.open(payload);
            } else if (typeof window.openFutCardFromPlayer === 'function') {
                window.openFutCardFromPlayer(p);
            } else {
                console.warn("[RankingView] PadelFutCard no está inicializado");
            }
        }

        /**
         * 🎴 Abrir la carta del jugador actualmente seleccionado en el Faceoff 1vs1
         * @param {'a' | 'b'} side Lado 'a' o 'b' del selector Faceoff
         */
        openActiveFaceoffPlayer(side) {
            const select = document.getElementById(`ranking-faceoff-select-${side}`);
            if (select && select.value) {
                this.openPlayerCard(select.value);
            }
        }
    }

    if (!window.openFutCardFromPlayer) {
        window.openFutCardFromPlayer = function(playerData) {
            if (!window.PadelFutCard || !playerData) return;
            try {
                window.PlayerView?.haptic?.(20);
                window.PadelFutCard.open({
                    user: playerData,
                    stats: playerData.stats || {}
                });
            } catch (err) {
                console.error("[RankingView] Error abriendo PadelFutCard:", err);
            }
        };
    }

    window.RankingView = new RankingView();
    console.log("🏆 Elite Dark Premium RankingView Initialized");
})();
