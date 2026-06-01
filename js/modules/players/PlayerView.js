/**
 * PlayerView.js
 * Premium SMART Profile View for SomosPadel
 * Updated: 2026 Design System with Chart.js & Glassmorphism
 */
(function () {
    class PlayerView {
        constructor() {
            this.charts = {}; // Store chart instances
        }

        haptic(ms = 30) {
            if (window.navigator && window.navigator.vibrate) {
                window.navigator.vibrate(ms);
            }
        }

        render() {
            const container = document.getElementById('content-area');
            const user = window.Store.getState('currentUser');
            const data = window.Store.getState('playerStats') || {
                stats: { matches: 0, won: 0, lost: 0, points: 0, winRate: 0, gamesWon: 0, gamesLost: 0, events: 0 },
                recentMatches: [],
                badges: [],
                levelHistory: [],
                aiInsights: null,
                h2h: []
            };

            if (!container) return;
            if (!user) {
                container.innerHTML = `<div style="padding:100px; text-align:center; color:white;">
                    <i class="fas fa-spinner fa-spin"></i><br>Cargando sesión...
                </div>`;
                return;
            }

            container.innerHTML = `
                <div class="player-profile-wrapper fade-in" style="background: #f8fafc; min-height: 100vh; padding-bottom: 200px; font-family: 'Outfit', sans-serif; color: #0a192f;">
                    
                    <!-- Profile Header: Dynamic & Aesthetic -->
                    <div style="background: #ffffff; padding: 60px 24px 40px; border-bottom: 1px solid #e2e8f0; position: relative; overflow: hidden;">
                        <!-- Animated background elements -->
                        <div style="position: absolute; top: -100px; left: -100px; width: 300px; height: 300px; background: radial-gradient(circle, rgba(204,255,0,0.1) 0%, transparent 70%); animation: pulse 8s infinite;"></div>
                        <div style="position: absolute; bottom: -50px; right: -50px; width: 250px; height: 250px; background: radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%); animation: pulse 6s infinite reverse;"></div>
                         <style>
                            @keyframes pulse { 0% { transform: scale(1); opacity: 0.1; } 50% { transform: scale(1.2); opacity: 0.2; } 100% { transform: scale(1); opacity: 0.1; } }
                        </style>

                        <div style="display: flex; flex-direction: column; align-items: center; text-align: center; position: relative; z-index: 2;">
                            
                            <!-- Avatar Section: EXECUTIVE STYLE -->
                            <div style="position: relative; margin-bottom: 30px; display: flex; justify-content: center;">
                                <div style="
                                    width: 140px; 
                                    height: 140px; 
                                    border-radius: 44px; 
                                    background: linear-gradient(135deg, #CCFF00 0%, #00E36D 100%); 
                                    padding: 4px; 
                                    position: relative; 
                                    box-shadow: 0 0 50px rgba(204, 255, 0, 0.2);
                                ">
                                    <div style="
                                        width: 100%; 
                                        height: 100%; 
                                        border-radius: 40px; 
                                        background: url('${user.photo_url || user.photoURL || 'img/logo_somospadel.png'}') center/cover; 
                                        border: 4px solid #ffffff;
                                        position: relative;
                                        overflow: hidden;
                                        background-color: #f1f5f9;
                                    ">
                                        ${!(user.photo_url || user.photoURL) ? `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:#CCFF00; font-size:3rem; font-weight:900;">${user.name.substring(0, 1).toUpperCase()}</div>` : ''}
                                    </div>
                                    
                                    <!-- Verified Icon -->
                                    <div style="position: absolute; top: -8px; right: -8px; background: #CCFF00; color: #000; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1rem; border: 4px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                                        <i class="fas fa-check"></i>
                                    </div>

                                    <!-- Camera Icon -->
                                    <div onclick="window.PlayerView.showUpdatePhotoPrompt()" style="position: absolute; bottom: -8px; right: -8px; background: white; width: 36px; height: 36px; border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(0,0,0,0.1); cursor: pointer; border: 4px solid #ffffff;">
                                        <i class="fas fa-camera" style="color: #000; font-size: 1rem;"></i>
                                    </div>
                                </div>
                            </div>
                            
                            <h2 style="font-weight: 950; font-size: 2.4rem; margin: 0; text-transform: uppercase; letter-spacing: -1.5px; color: #0a192f; line-height: 0.9;">${user.name}</h2>
                            
                            <div style="display: flex; flex-direction: column; align-items: center; gap: 8px; margin-top: 15px;">
                                ${(() => {
                    const badge = window.RankingController?.getLevelBadge(user.level || 3.5) || { stars: 3, label: 'GOLD', color: '#FFD700', shadow: 'none' };
                    const starsHtml = Array(5).fill(0).map((_, i) => 
                        `<i class="fas fa-star" style="font-size: 0.9rem; color: ${i < badge.stars ? badge.color : 'rgba(255,255,255,0.1)'}; margin-right: 2px; ${i < badge.stars ? 'text-shadow: 0 0 10px ' + badge.color : ''}"></i>`
                    ).join('');
                    return `
                                        <div style="font-size: 0.85rem; font-weight: 950; padding: 6px 20px; border-radius: 20px; background: ${badge.color}22; color: ${badge.color}; border: 1px solid ${badge.color}44; text-transform: uppercase; letter-spacing: 2px; box-shadow: ${badge.shadow};">
                                            RANGO ${badge.label}
                                        </div>
                                        <div style="display: flex; gap: 4px;">${starsHtml}</div>
                                        <span style="color: #475569; font-size: 0.8rem; font-weight: 950; letter-spacing: 1px; text-transform: uppercase; margin-top: 4px;">NIVEL ${parseFloat(user.level || 3.5).toFixed(2)}</span>
                                    `;
                })()}
                            </div>

                            <!-- PROGRESS TO NEXT STAR (Enhanced) -->
                            <div style="margin-top: 25px; width: 100%; max-width: 320px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 24px; padding: 20px; position: relative; overflow: hidden;">
                                ${(() => {
                                    const currentLvl = parseFloat(user.level || 3.5);
                                    const nextThreshold = (Math.floor(currentLvl * 2) + 1) / 2;
                                    const prevThreshold = nextThreshold - 0.5;
                                    const diff = (nextThreshold - currentLvl).toFixed(2);
                                    const progress = data.nextLevelProgress || 0;
                                    const nextBadge = window.RankingController?.getLevelBadge(nextThreshold) || { label: 'PRO' };
                                    
                                    return `
                                        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 12px;">
                                            <div style="text-align: left;">
                                                <div style="color: #64748b; font-size: 0.55rem; font-weight: 950; text-transform: uppercase; letter-spacing: 1.5px;">PROYECTO DE ASCENSO</div>
                                                <div style="color: #0a192f; font-weight: 900; font-size: 0.85rem; margin-top: 2px;">RANGO ${nextBadge.label}</div>
                                            </div>
                                            <div style="text-align: right;">
                                                <div style="color: #72a800; font-weight: 950; font-size: 1.2rem; line-height: 1;">-${diff}</div>
                                                <div style="color: #475569; font-size: 0.55rem; font-weight: 900; text-transform: uppercase;">PARA SUBIR</div>
                                            </div>
                                        </div>
                                        <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.05); border-radius: 10px; position: relative; overflow: hidden;">
                                            <div style="position: absolute; top: 0; left: 0; height: 100%; width: ${progress}%; background: linear-gradient(90deg, #CCFF00, #00E36D); box-shadow: 0 0 10px rgba(204,255,0,0.3); border-radius: 10px; transition: width 1s;"></div>
                                        </div>
                                        <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 0.55rem; font-weight: 900; color: #444;">
                                            <span>LVL ${prevThreshold.toFixed(1)}</span>
                                            <span style="color: #64748b; letter-spacing: 0.5px;">${Math.round(progress)}% COMPLETADO</span>
                                            <span>LVL ${nextThreshold.toFixed(1)}</span>
                                        </div>
                                    `;
                                })()}
                            </div>

                            <!-- FORM GUIDE: THE RACHA -->
                            <div style="margin-top: 20px; display: flex; gap: 8px; align-items: center;">
                                <span style="font-size: 0.65rem; font-weight: 950; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-right: 5px;">RACHA:</span>
                                ${data.formGuide ? data.formGuide.map(res => `
                                    <div style="
                                        width: 24px; 
                                        height: 24px; 
                                        border-radius: 8px; 
                                        background: ${res === 'W' ? 'rgba(204,255,0,0.1)' : (res === 'L' ? 'rgba(239,68,68,0.1)' : 'rgba(148,163,184,0.1)')}; 
                                        color: ${res === 'W' ? '#CCFF00' : (res === 'L' ? '#ef4444' : '#94a3b8')}; 
                                        display: flex; 
                                        align-items: center; 
                                        justify-content: center; 
                                        font-size: 0.75rem; 
                                        font-weight: 950; 
                                        border: 1px solid ${res === 'W' ? 'rgba(204,255,0,0.2)' : (res === 'L' ? 'rgba(239,68,68,0.2)' : 'rgba(148,163,184,0.2)')};
                                        box-shadow: ${res === 'W' ? '0 0 10px rgba(204,255,0,0.1)' : 'none'};
                                    ">${res}</div>
                                `).join('') : '<span style="color:#444; font-size:0.6rem;">SIN PARTIDOS</span>'}
                            </div>
                            
                            <div style="margin-top: 18px; display: flex; justify-content: center; align-items: center; min-height: 38px; gap: 8px;">
                                ${window.RoleService ? window.RoleService.getBadgeHtml(user.role) : `
                                    <div style="background: linear-gradient(90deg, #CCFF00, #00E36D); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 950; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 2px; display: flex; align-items: center; gap: 8px;">
                                        <i class="fas fa-crown"></i> EXECUTIVE PLAYER
                                    </div>
                                `}
                                <i class="fas fa-question-circle" onclick="window.showRolesLegendModal()" style="cursor: pointer; color: #64748b; font-size: 0.95rem; transition: color 0.2s;" onmouseover="this.style.color='#CCFF00'" onmouseout="this.style.color='#64748b'" title="Ver leyenda de roles oficiales"></i>
                            </div>

                            <!-- ACTION BUTTONS -->
                            <div style="display:flex; gap:10px; margin-top: 25px;">
                                <button onclick="window.PlayerView.haptic(50); window.PlayerView.shareProfileCard()" class="haptic-feedback" style="background: rgba(204,255,0,0.05); border: 1px solid #CCFF00; color: #CCFF00; padding: 12px 20px; border-radius: 16px; font-weight: 800; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                                    <i class="fas fa-share-alt"></i> COMPARTIR
                                </button>
                                <button onclick="window.PlayerView.haptic(30); window.PlayerView.showUpdatePasswordPrompt()" class="haptic-feedback" style="background: #ffffff; border: 1px solid #e2e8f0; color: #0a192f; padding: 12px 20px; border-radius: 16px; font-weight: 800; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; cursor: pointer;">
                                    <i class="fas fa-cog"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div style="padding: 24px;">
                        
                        <!-- DASHBOARD HERO INTEGRATION -->
                        <div id="profile-hero-root" style="margin-bottom: 25px;"></div>

                        <!-- ⚡ POWER LEVEL STATUS CARD -->
                        <div id="profile-power-level-root" style="margin-bottom: 25px;"></div>

                        <!-- 🌐 TECH HUB CARD -->
                        <div id="profile-tech-hub-root" style="margin-bottom: 25px;"></div>

                        <!-- STATS GRID & CHARTS -->
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px;">
                            
                            <!-- Win Rate Card (Donut) -->
                            <div class="glass-card" style="padding: 20px; text-align:center; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                                <div style="position:relative; width: 80px; height: 80px; margin-bottom: 10px;">
                                    <canvas id="profileWinRateChart"></canvas>
                                    <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); font-weight:900; font-size:1.2rem; color: #0a192f;">
                                        ${data.stats.winRate}%
                                    </div>
                                </div>
                                <div style="color: #64748b; font-size: 0.65rem; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">VICTORIAS</div>
                            </div>

                            <!-- Total Matches (Big Number) -->
                            <div class="glass-card" style="padding: 20px; display:flex; flex-direction:column; justify-content:center; align-items:center;">
                                <div style="font-size: 2.5rem; font-weight: 950; color: #0a192f;">${data.stats.matches || 0}</div>
                                <div style="color: #64748b; font-size: 0.65rem; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">PARTIDOS</div>
                                <div style="margin-top:5px; font-size:0.7rem; color:#CCFF00; font-weight:900;">${data.stats.won || 0} Victorias</div>
                            </div>

                        </div>

                        <!-- PERFORMANCE HISTORY (Line Chart) -->
                        <div style="margin-bottom: 25px; background: #ffffff; border-radius: 32px; padding: 25px; border: 1px solid #e2e8f0; position:relative; overflow:hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.02);">
                            <div style="position: absolute; top:0; left:0; width:100%; height:100%; background: radial-gradient(circle at 100% 0%, rgba(204,255,0,0.05), transparent 50%); pointer-events:none;"></div>
                            
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px;">
                                <h3 style="margin: 0; font-size: 0.8rem; font-weight: 950; letter-spacing: 1px; color: #0a192f; text-transform: uppercase; display: flex; align-items: center; gap: 10px;">
                                    <i class="fas fa-chart-area" style="color: #CCFF00;"></i> Progresión de Nivel
                                </h3>
                                <div style="font-size: 0.65rem; font-weight: 900; color: #CCFF00; background: rgba(204,255,0,0.1); padding: 4px 10px; border-radius: 10px; border: 1px solid rgba(204,255,0,0.2);">
                                    DECIMAL SYNC
                                </div>
                            </div>
                            <div style="height: 180px; width: 100%;">
                                <canvas id="profileLevelChart"></canvas>
                            </div>
                        </div>

                        <!-- ATTRIBUTE RADAR (Spider Chart) -->
                        <div style="margin-bottom: 25px; background: #ffffff; border-radius: 32px; padding: 25px; border: 1px solid #e2e8f0; box-shadow: 0 10px 30px rgba(0,0,0,0.02);">
                            <h3 style="margin: 0 0 20px; font-size: 0.8rem; font-weight: 950; letter-spacing: 1px; color: #0a192f; text-transform: uppercase; display: flex; align-items: center; gap: 10px;">
                                <i class="fas fa-microchip" style="color: #3b82f6;"></i> Análisis de Atributos
                            </h3>
                            <div style="width: 100%; max-width: 280px; margin: 0 auto 20px;">
                                <canvas id="profileRadarChart"></canvas>
                            </div>
                            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                                <div style="background:rgba(255,255,255,0.05); padding:10px; border-radius:12px; text-align:center; border:1px solid rgba(255,255,255,0.05);">
                                    <div style="color:#888; font-size:0.6rem; font-weight:800; text-transform:uppercase;">ATAQUE</div>
                                    <div style="color:#ef4444; font-weight:900; font-size:1.1rem;">${this.getSkillVal(user, 'atk')}</div>
                                </div>
                                <div style="background:rgba(255,255,255,0.05); padding:10px; border-radius:12px; text-align:center; border:1px solid rgba(255,255,255,0.05);">
                                    <div style="color:#888; font-size:0.6rem; font-weight:800; text-transform:uppercase;">DEFENSA</div>
                                    <div style="color:#3b82f6; font-weight:900; font-size:1.1rem;">${this.getSkillVal(user, 'def')}</div>
                                </div>
                            </div>
                        </div>                        <!-- TACTICAL COACH: High-Tech Card (Point 5 Glass) -->
                        <div class="crystal-card" style="margin-bottom: 25px; background: #ffffff; padding: 25px; border: 1px solid #e2e8f0; box-shadow: 0 10px 30px rgba(0,0,0,0.02);">
                            <div style="position: absolute; right: -15px; top: -15px; font-size: 6rem; opacity: 0.05; color: #CCFF00; pointer-events: none;"><i class="fas fa-strategy"></i></div>
                            
                            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
                                <div style="display: flex; align-items: center; gap: 12px;">
                                    <div style="width: 36px; height: 36px; background: #CCFF00; color: #000; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1rem; box-shadow: 0 0 15px rgba(204, 255, 0, 0.3);">
                                        <i class="fas fa-clipboard-check"></i>
                                    </div>
                                    <span style="font-weight: 950; font-size: 0.85rem; letter-spacing: 1px; color: #0a192f; text-transform: uppercase;">Informe Técnico</span>
                                </div>
                                <span style="font-size: 0.65rem; background: rgba(204, 204, 0, 0.15); color: #CCFF00; padding: 5px 12px; border-radius: 20px; font-weight: 950; border: 1px solid rgba(204,255,0,0.3); letter-spacing: 0.5px;">
                                    ${data.smartInsights?.badge || 'PROCESANDO'}
                                </span>
                            </div>

                            <p style="font-size: 1.1rem; line-height: 1.5; font-weight: 700; color: #0a192f; margin: 0 0 15px; letter-spacing: -0.2px;">
                                "${data.smartInsights?.summary || 'Sigue jugando para recibir consejos tácticos personalizados.'}"
                            </p>
                            
                            <div class="glass-card" style="padding: 18px; border-radius: 20px;">
                                <div style="font-size: 0.65rem; color: #CCFF00; font-weight: 950; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                                    <i class="fas fa-bullseye"></i> CONSEJO TÁCTICO:
                                </div>
                                <p style="font-size: 0.9rem; color: #eee; line-height: 1.6; margin: 0; font-weight: 500;">
                                    ${data.smartInsights?.advice || 'Mantén la intensidad desde el primer punto.'}
                                </p>
                            </div>
                        </div>

                         <!-- RIVALRY & AFFINITY SECTION -->
                         <div style="display: grid; grid-template-columns: 1fr; gap: 20px; margin-bottom: 30px;">
                            ${data.h2h?.nemesis && data.h2h.nemesis.losses > 0 ? `
                            <div style="border: 1px solid rgba(239,68,68,0.3); background: linear-gradient(135deg, rgba(239,68,68,0.1) 0%, rgba(9,9,11,0.5) 100%); border-radius: 32px; padding: 25px; position: relative; overflow: hidden; display: flex; align-items: center; gap: 20px;">
                                <div style="width: 60px; height: 60px; border-radius: 20px; background: rgba(239,68,68,0.2); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: #ef4444; border: 1px solid rgba(239,68,68,0.3);">
                                    <i class="fas fa-skull-crossbones"></i>
                                </div>
                                <div style="flex: 1;">
                                    <div style="color: #ef4444; font-size: 0.65rem; font-weight: 950; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 4px;">TU NÉMESIS 💀</div>
                                    <div style="font-size: 1.4rem; font-weight: 950; color: #0a192f; line-height: 1.1;">${data.h2h.nemesis.name}</div>
                                    <div style="display: flex; gap: 15px; margin-top: 8px;">
                                        <div style="font-size: 0.75rem; color: #64748b; font-weight: 700;">H2H: <b style="color:#ef4444">${data.h2h.nemesis.losses} DERROTAS</b></div>
                                        <div style="font-size: 0.75rem; color: #64748b; font-weight: 700;">PARTIDOS: <b style="color:#fff">${data.h2h.nemesis.matches}</b></div>
                                    </div>
                                </div>
                            </div>` : ''}

                            ${data.h2h?.soulmate && data.h2h.soulmate.matches > 0 ? `
                            <div style="border: 1px solid rgba(236,72,153,0.3); background: linear-gradient(135deg, rgba(236,72,153,0.1) 0%, rgba(9,9,11,0.5) 100%); border-radius: 32px; padding: 25px; position: relative; overflow: hidden; display: flex; align-items: center; gap: 20px;">
                                <div style="width: 60px; height: 60px; border-radius: 20px; background: rgba(236,72,153,0.2); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: #ec4899; border: 1px solid rgba(236,72,153,0.3);">
                                    <i class="fas fa-heart"></i>
                                </div>
                                <div style="flex: 1;">
                                    <div style="color: #ec4899; font-size: 0.65rem; font-weight: 950; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 4px;">ALMA GEMELA ❤️</div>
                                    <div style="font-size: 1.4rem; font-weight: 950; color: #0a192f; line-height: 1.1;">${data.h2h.soulmate.name}</div>
                                    <div style="display: flex; gap: 15px; margin-top: 8px;">
                                        <div style="font-size: 0.75rem; color: #64748b; font-weight: 700;">VICTORIAS: <b style="color:#ec4899">${data.h2h.soulmate.wins} VICTORIAS</b></div>
                                        <div style="font-size: 0.75rem; color: #64748b; font-weight: 700;">PARTIDOS: <b style="color:#fff">${data.h2h.soulmate.matches}</b></div>
                                    </div>
                                </div>
                            </div>` : ''}
                        </div>

                        <!-- RECENT MATCHES -->
                        <div style="margin-bottom: 40px;">
                             <h3 style="margin: 0 0 15px; font-size: 0.8rem; font-weight: 950; letter-spacing: 1px; color: #0a192f; text-transform: uppercase; display: flex; align-items: center; gap: 10px;">
                                <i class="fas fa-history" style="color: #94a3b8;"></i> Historial Reciente
                            </h3>
                            <div style="display: grid; gap: 10px;">
                                ${data.recentMatches.length > 0 ? data.recentMatches.slice(0, 5).map(m => `
                                    <div style="background: rgba(255,255,255,0.02); padding: 16px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center;">
                                        <div>
                                            <div style="font-weight: 800; font-size: 0.85rem; color: #0a192f;">${m.eventName}</div>
                                            <div style="font-size: 0.7rem; color: #666; font-weight: 600;">${m.date}</div>
                                        </div>
                                        <div style="text-align:right;">
                                            <div style="background: ${m.result === 'W' ? 'rgba(204,255,0,0.1)' : 'rgba(239,68,68,0.1)'}; color: ${m.result === 'W' ? '#CCFF00' : '#ef4444'}; padding: 4px 12px; border-radius: 12px; font-weight: 900; font-size: 0.75rem; border: 1px solid ${m.result === 'W' ? 'rgba(204,255,0,0.3)' : 'rgba(239,68,68,0.3)'};">
                                                ${m.result === 'W' ? 'VICTORIA' : 'DERROTA'}
                                            </div>
                                            <div style="font-size: 0.75rem; color: #0a192f; margin-top: 4px; font-weight:800;">
                                                ${m.score}
                                            </div>
                                        </div>
                                    </div>
                                `).join('') : '<div style="color:#666; text-align:center; padding:20px;">Sin partidos recientes</div>'}
                            </div>
                        </div>

                        <div id="profile-activity-root"></div>

                    </div>
                </div>
                <input type="file" id="profile-photo-input" accept="image/*" style="display: none;" onchange="window.PlayerView.handlePhotoSelection(this)">
            `;

            // Initialize Widgets & Charts
            setTimeout(() => {
                this.initCharts(data, user);
                // Hero Card & Partner Synergy (if available via Window)
                const context = data.context || { status: 'EMPTY' };
                if (window.HeroCard) document.getElementById('profile-hero-root').innerHTML = window.HeroCard.render(context);
                
                // Render Power Level Card
                const pLevelRoot = document.getElementById('profile-power-level-root');
                if (pLevelRoot && user && window.PowerLevelCard) {
                    pLevelRoot.innerHTML = window.PowerLevelCard.render(user);
                }

                // Render Tech Hub Card
                const techHubRoot = document.getElementById('profile-tech-hub-root');
                if (techHubRoot) {
                    techHubRoot.innerHTML = this.renderTechHub();
                }

                if (window.DashboardView && window.DashboardView.renderActivityFeed) window.DashboardView.renderActivityFeed('profile-activity-root');
            }, 100);
        }

        getSkillVal(user, type) {
            const l = parseFloat(user.level || 3.5);
            const base = l * 15; // 3.5 * 15 = 52
            let val = 50;
            if (type === 'atk') val = base + 20;
            if (type === 'def') val = base + 15;
            if (type === 'fis') val = base + 10;
            if (type === 'tec') val = base + 18;
            return Math.min(99, Math.round(val));
        }

        renderTechHub() {
            return `
                <div class="noticias-banner-premium" style="
                    background: rgba(15, 23, 42, 0.8); 
                    backdrop-filter: blur(20px);
                    border-radius: 24px;
                    padding: 18px !important;
                    color: #fff; 
                    position: relative; 
                    overflow: hidden; 
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(255,255,255,0.05);
                    border: 1px solid rgba(204, 255, 0, 0.15);
                    transition: all 0.4s ease;
                ">
                    <!-- Hexagon Background Pattern -->
                    <div style="position: absolute; right: -30px; top: -30px; font-size: 8rem; color: #CCFF00; opacity: 0.05; transform: rotate(-10deg); pointer-events: none;">
                        <i class="fas fa-layer-group"></i>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; position: relative; z-index: 2;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="width: 10px; height: 10px; background: #00E36D; border-radius: 50%; box-shadow: 0 0 10px #00E36D;"></div>
                            <span style="font-size: 0.8rem; font-weight: 950; letter-spacing: 2px; color: #00E36D; text-transform: uppercase;">TECH HUB</span>
                        </div>
                        <div style="background: rgba(255,255,255,0.05); padding: 4px 12px; border-radius: 20px; font-size: 0.65rem; font-weight: 800; color: rgba(255,255,255,0.5); border: 1px solid rgba(255,255,255,0.1);">v4.0.5</div>
                    </div>
                    
                    <h3 style="font-family: 'Outfit', sans-serif; font-weight: 900; font-size: 1.3rem; margin: 0 0 12px 0; color: #fff; letter-spacing: -0.5px;">Ecosistema <span style="color: #CCFF00;">SomosPadel</span></h3>
                    <p style="font-size: 0.85rem; color: #94a3b8; line-height: 1.6; margin: 0 0 25px 0; font-weight: 500;">
                        Accede a herramientas de alto rendimiento diseñadas por y para jugadores de competición.
                    </p>
                    
                    <!-- Main Actions Grid -->
                     <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; position: relative; z-index: 2;">
                         <!-- TV LIVE -->
                         <div onclick="window.Router.navigate('live')" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); padding: 18px; border-radius: 20px; display: flex; flex-direction: column; gap: 10px; cursor: pointer; transition: 0.3s; position: relative; overflow: hidden;" onmouseover="this.style.background='rgba(255,255,255,0.08)'; this.style.borderColor='#CCFF00'; this.style.boxShadow='0 0 20px rgba(204,255,0,0.2)';" onmouseout="this.style.background='rgba(255,255,255,0.03)'; this.style.borderColor='rgba(255,255,255,0.1)'; this.style.boxShadow='none';">
                            <div style="position: absolute; top: -10px; right: -10px; width: 40px; height: 40px; background: rgba(204,255,0,0.1); border-radius: 50%; filter: blur(15px); animation: auraPulse 2s infinite;"></div>
                            <i class="fas fa-satellite-dish" style="color: #CCFF00; font-size: 1.4rem; filter: drop-shadow(0 0 5px #CCFF00);"></i>
                            <div>
                                <div style="font-weight: 950; font-size: 0.8rem;">CENTER COURT</div>
                                <div style="font-size: 0.6rem; color: #64748b; font-weight: 700;">LIVE STREAMING</div>
                            </div>
                        </div>
                        <!-- CHAT SOS -->
                        <div onclick="window.Router.navigate('live')" style="background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.2); padding: 18px; border-radius: 20px; display: flex; flex-direction: column; gap: 10px; cursor: pointer; transition: 0.3s; position: relative; overflow: hidden;" onmouseover="this.style.background='rgba(239, 68, 68, 0.1)'; this.style.borderColor='#ef4444'; this.style.boxShadow='0 0 25px rgba(239,68,68,0.3)';" onmouseout="this.style.background='rgba(239, 68, 68, 0.05)'; this.style.borderColor='rgba(239, 68, 68, 0.2)'; this.style.boxShadow='none';">
                            <div style="position: absolute; top: -10px; right: -10px; width: 40px; height: 40px; background: rgba(239,68,68,0.2); border-radius: 50%; filter: blur(15px); animation: auraPulse 2s infinite linear;"></div>
                            <i class="fas fa-comment-medical" style="color: #ef4444; font-size: 1.4rem; animation: pulseSOS 2s infinite; filter: drop-shadow(0 0 8px #ef4444);"></i>
                            <div>
                                <div style="font-weight: 950; font-size: 0.8rem; color: #ef4444;">CHAT TÁCTICO</div>
                                <div style="font-size: 0.6rem; color: #64748b; font-weight: 700;">BOTÓN SOS ACTIVADO</div>
                            </div>
                        </div>
                     </div>

                     <style>
                         @keyframes auraPulse {
                             0% { transform: scale(1); opacity: 0.3; }
                             50% { transform: scale(1.5); opacity: 0.1; }
                             100% { transform: scale(1); opacity: 0.3; }
                         }
                     </style>

                     <style>
                         @keyframes pulseSOS {
                             0% { opacity: 1; }
                             50% { opacity: 0.5; }
                             100% { opacity: 1; }
                         }
                     </style>

                     <!-- Secondary Actions -->
                     <div style="display: flex; gap: 10px; margin-bottom: 25px;">
                         <button onclick="window.CaptainView.open()" style="flex: 2; background: #CCFF00; color: #000; border: none; padding: 15px; border-radius: 16px; font-weight: 950; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; box-shadow: 0 10px 20px rgba(204, 255, 0, 0.2);">
                             <i class="fas fa-robot"></i> CAPITÁN VIRTUAL
                         </button>
                         <button onclick="window.DashboardView ? window.DashboardView.showChatInfo() : null" style="flex: 1; background: rgba(255,255,255,0.05); color: #fff; border: 1px solid rgba(255,255,255,0.1); padding: 15px; border-radius: 16px; font-weight: 800; font-size: 0.8rem; cursor: pointer;">
                             GUÍA
                         </button>
                     </div>
                     
                     <!-- TECHNOLOGY FOOTER -->
                     <div onclick="window.open('presentation.html', '_blank')" style="background: linear-gradient(90deg, rgba(204, 255, 0, 0.05), transparent); border: 1px solid rgba(204, 255, 0, 0.1); border-radius: 20px; padding: 15px; cursor: pointer; transition: 0.3s; display: flex; justify-content: space-between; align-items: center;" onmouseover="this.style.background='rgba(204, 255, 0, 0.1)'; this.style.borderColor='rgba(204, 255, 0, 0.3)';" onmouseout="this.style.background='rgba(204, 255, 0, 0.05)'; this.style.borderColor='rgba(204, 255, 0, 0.1)';">
                         <div style="display: flex; align-items: center; gap: 12px;">
                             <div style="width: 38px; height: 38px; background: rgba(0,0,0,0.3); border-radius: 12px; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(204, 255, 0, 0.2);">
                                 <i class="fas fa-microchip" style="color: #CCFF00;"></i>
                             </div>
                             <div style="display: flex; flex-direction: column;">
                                 <span style="font-weight: 900; font-size: 0.75rem; letter-spacing: 0.5px;">CORE TECHNOLOGY</span>
                                 <span style="font-size: 0.65rem; color: #64748b; font-weight: 700;">Powered by Somospadel BCN</span>
                             </div>
                         </div>
                         <i class="fas fa-chevron-right" style="color: #CCFF00; font-size: 0.8rem;"></i>
                     </div>
                </div>
            `;
        }

        initCharts(data, user) {
            // Destroy previous instances
            Object.values(this.charts).forEach(c => c && c.destroy && c.destroy());

            // 1. Win Rate Donut
            const ctxWin = document.getElementById('profileWinRateChart')?.getContext('2d');
            if (ctxWin) {
                // Determine color based on winrate
                const wr = data.stats.winRate || 0;
                const color = wr > 60 ? '#CCFF00' : (wr > 40 ? '#3b82f6' : '#94a3b8');

                this.charts.win = new Chart(ctxWin, {
                    type: 'doughnut',
                    data: {
                        labels: ['Victorias', 'Derrotas'],
                        datasets: [{
                            data: [data.stats.won || 0, (data.stats.matches - data.stats.won) || 1],
                            backgroundColor: [color, 'rgba(255,255,255,0.05)'],
                            borderWidth: 0,
                            cutout: '85%'
                        }]
                    },
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } } }
                });
            }

            // 2. Level History (Line Chart)
            const ctxLvl = document.getElementById('profileLevelChart')?.getContext('2d');
            if (ctxLvl) {
                const history = data.levelHistory || [];
                const gradient = ctxLvl.createLinearGradient(0, 0, 0, 200);
                gradient.addColorStop(0, 'rgba(204, 255, 0, 0.4)');
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

                this.charts.level = new Chart(ctxLvl, {
                    type: 'line',
                    data: {
                        labels: history.map(h => (h.date || '').substring(0, 5)), 
                        datasets: [{
                            label: 'Nivel',
                            data: history.map(h => parseFloat(h.level).toFixed(2)),
                            borderColor: '#CCFF00',
                            backgroundColor: gradient,
                            fill: true,
                            tension: 0.5,
                            pointRadius: 6,
                            pointHoverRadius: 8,
                            pointBackgroundColor: '#ffffff',
                            pointBorderColor: '#CCFF00',
                            pointBorderWidth: 3,
                            borderWidth: 4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { 
                            legend: { display: false },
                            tooltip: {
                                backgroundColor: '#18181b',
                                titleFont: { family: 'Outfit', size: 12 },
                                bodyFont: { family: 'Outfit', size: 14, weight: 'bold' },
                                padding: 12,
                                borderColor: 'rgba(255,255,255,0.1)',
                                borderWidth: 1
                            }
                        },
                        scales: {
                            x: { 
                                grid: { display: false },
                                ticks: { color: '#64748b', font: { family: 'Outfit', size: 9, weight: '800' } }
                            },
                            y: { 
                                grid: { color: 'rgba(255,255,255,0.03)' },
                                ticks: { color: '#64748b', font: { family: 'Outfit', size: 10, weight: '900' } }
                            }
                        }
                    }
                });
            }

            // 3. Radar Chart (Attributes)
            const ctxRadar = document.getElementById('profileRadarChart')?.getContext('2d');
            if (ctxRadar) {
                this.charts.radar = new Chart(ctxRadar, {
                    type: 'radar',
                    data: {
                        labels: ['ATAQUE', 'DEFENSA', 'TÉCNICA', 'FÍSICO', 'MENTAL'],
                        datasets: [{
                            label: 'Atributos',
                            data: [
                                this.getSkillVal(user, 'atk'),
                                this.getSkillVal(user, 'def'),
                                this.getSkillVal(user, 'tec'),
                                this.getSkillVal(user, 'fis'),
                                this.getSkillVal(user, 'tec') + 5
                            ],
                            backgroundColor: 'rgba(59, 130, 246, 0.2)', // Blue tint
                            borderColor: '#3b82f6',
                            borderWidth: 2,
                            pointBackgroundColor: '#3b82f6',
                            pointBorderColor: '#fff',
                            pointRadius: 3
                        }]
                    },
                    options: {
                        scales: {
                            r: {
                                angleLines: { color: 'rgba(255,255,255,0.1)' },
                                grid: { color: 'rgba(255,255,255,0.05)' },
                                pointLabels: { color: '#94a3b8', font: { size: 10, family: 'Outfit', weight: '700' } },
                                ticks: { display: false, maxTicksLimit: 5 },
                                min: 0, max: 100
                            }
                        },
                        plugins: { legend: { display: false } }
                    }
                });
            }
        }

        showUpdatePhotoPrompt() { document.getElementById('profile-photo-input').click(); }

        async handlePhotoSelection(input) {
            if (!input.files || !input.files[0]) return;
            const file = input.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = 400; canvas.height = 400;
                    const ctx = canvas.getContext('2d');
                    // Crop center
                    const minDim = Math.min(img.width, img.height);
                    const startX = (img.width - minDim) / 2;
                    const startY = (img.height - minDim) / 2;
                    ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, 400, 400);
                    const base64 = canvas.toDataURL('image/jpeg', 0.8);
                    window.PlayerController.updatePhoto(base64).then(res => {
                        if (res.success) this.render();
                    });
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }

        async shareProfileCard() {
            this.haptic(40);
            const user = window.Store?.getState('currentUser');
            if (!user) return;
            if (!window.MatchStoryCard) { alert('Cargando...'); return; }

            const uid = String(user.uid || user.id);

            try {
                // Strategy: query entrenos where this player participated
                // Look for most recent event (try both by looking at matches)
                let lastEventId = null;
                let lastEventType = 'entreno';

                // First try: query entrenos_matches directly for this player's recent match
                const recentMatchSnap = await window.db.collection('entrenos_matches').get().catch(() => null);

                if (recentMatchSnap && !recentMatchSnap.empty) {
                    // Find any match this player played in
                    const myDocs = recentMatchSnap.docs.filter(d => {
                        const data = d.data();
                        const a = (data.team_a_ids || []).map(String);
                        const b = (data.team_b_ids || []).map(String);
                        return a.includes(uid) || b.includes(uid);
                    });

                    if (myDocs.length > 0) {
                        // Get the most recent event by round (highest round = most recent)
                        myDocs.sort((a, b) => parseInt(b.data().round || 0) - parseInt(a.data().round || 0));
                        lastEventId = myDocs[0].data().americana_id;
                        lastEventType = 'entreno';
                    }
                }

                // Second try: check americanas matches
                if (!lastEventId) {
                    const americanaMatchSnap = await window.db.collection('matches').get().catch(() => null);
                    if (americanaMatchSnap && !americanaMatchSnap.empty) {
                        const myDocs = americanaMatchSnap.docs.filter(d => {
                            const data = d.data();
                            const a = (data.team_a_ids || []).map(String);
                            const b = (data.team_b_ids || []).map(String);
                            return a.includes(uid) || b.includes(uid);
                        });
                        if (myDocs.length > 0) {
                            myDocs.sort((a, b) => parseInt(b.data().round || 0) - parseInt(a.data().round || 0));
                            lastEventId = myDocs[0].data().americana_id;
                            lastEventType = 'americana';
                        }
                    }
                }

                if (lastEventId) {
                    await window.MatchStoryCard.openFromEvent(uid, lastEventId, lastEventType);
                } else {
                    // Fallback: show profile card with general stats from Store
                    const data = window.Store.getState('playerStats') || {};
                    const stats = data.stats || {};
                    const formGuide = data.formGuide || [];
                    const winStreak = formGuide.filter(r => r === 'W').length;

                    await window.MatchStoryCard.open({
                        playerName: user.name,
                        eventName: 'SomosPadel BCN',
                        eventDate: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long' }),
                        wins: stats.won || 0,
                        losses: stats.lost || 0,
                        gamesWon: stats.gamesWon || 0,
                        winStreak: winStreak,
                        playerLevel: user.level || null,
                        totalPoints: stats.points || 0,
                        trajectory: [],
                        matchScores: formGuide.slice(-6).map(r => ({ score: r === 'W' ? 'V' : 'D', win: r === 'W' }))
                    });
                }
            } catch (err) {
                console.error('Story Card Error:', err);
                window.MatchStoryCard?.open({ playerName: user.name, eventName: 'SomosPadel BCN' });
            }
        }

        showUpdatePasswordPrompt() {
            const pass = prompt("Nueva contraseña:");
            if (pass) window.PlayerController.updatePassword(pass);
        }
    }

    window.PlayerView = new PlayerView();
    console.log("🏆 Premium PlayerView (Chart Edition) Initialized");
})();
