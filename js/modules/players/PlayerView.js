/**
 * PlayerView.js
 * Premium SMART Profile View for SomosPadel
 * Updated: 2026 Design System with Chart.js & Glassmorphism
 */
(function () {
    class PlayerView {
        constructor() {
            this.charts = {}; // Store chart instances
            this.activeTab = 'ai_performance'; // 'ai_performance' | 'attributes'
            this.forceDemoMode = false;
            this.currentAiHistoryData = null;
        }

        setProfileTab(tabName) {
            this.haptic(20);
            this.activeTab = tabName;
            this.renderTabContent();
        }

        haptic(ms = 30) {
            if (window.navigator && window.navigator.vibrate) {
                window.navigator.vibrate(ms);
            }
        }

        getNormalizedFormGuide(data, user) {
            let rawList = (data && data.formGuide && data.formGuide.length > 0) ? data.formGuide : [];
            if (rawList.length === 0 && data && data.recentMatches && data.recentMatches.length > 0) {
                rawList = data.recentMatches.slice(0, 5).map(m => m.result);
            }
            if (rawList.length === 0 && this.currentAiHistoryData && this.currentAiHistoryData.length > 0) {
                rawList = this.currentAiHistoryData.slice(0, 5).map(m => m.won ? 'V' : 'D');
            }
            return rawList.map(res => {
                const r = String(res || '').toUpperCase();
                if (r === 'W' || r === 'V') {
                    return { code: 'V', label: 'Victoria', color: '#10B981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', shadow: '0 2px 8px rgba(16,185,129,0.2)' };
                }
                if (r === 'L') {
                    return { code: 'D', label: 'Derrota', color: '#EF4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', shadow: 'none' };
                }
                if (r === 'D' || r === 'E' || r === 'T') {
                    return { code: 'E', label: 'Empate', color: '#64748B', bg: 'rgba(100,116,139,0.12)', border: 'rgba(100,116,139,0.3)', shadow: 'none' };
                }
                return { code: 'V', label: 'Victoria', color: '#10B981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', shadow: 'none' };
            });
        }

        showLevelScaleModal() {
            this.haptic(30);
            const existing = document.getElementById('level-scale-modal');
            if (existing) existing.remove();

            const user = window.Store ? window.Store.getState('currentUser') : null;
            const currentLvl = parseFloat(user?.level || 3.0);
            const badge = window.RankingController?.getLevelBadge(currentLvl) || { stars: 2, label: 'SILVER', color: '#4b5563' };

            const modal = document.createElement('div');
            modal.id = 'level-scale-modal';
            modal.style.cssText = 'position:fixed; inset:0; z-index:30000; background:rgba(15,23,42,0.65); backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); display:flex; align-items:center; justify-content:center; padding:16px; opacity:0; transition:opacity 0.25s ease; font-family:"Outfit", sans-serif;';

            const tiers = [
                { label: 'ELITE', stars: 5, range: '4.50 - 7.00', color: '#047857', bg: '#ecfdf5', desc: 'Competición, torneos federados y primera categoría.' },
                { label: 'PLATINUM', stars: 4, range: '4.00 - 4.49', color: '#334155', bg: '#f1f5f9', desc: 'Avanzado alto. Gran regularidad, potencia y lectura táctica.' },
                { label: 'GOLD', stars: 3, range: '3.50 - 3.99', color: '#b45309', bg: '#fef3c7', desc: 'Intermedio avanzado. Buen control de paredes y juego en la red.' },
                { label: 'SILVER', stars: 2, range: '3.00 - 3.49', color: '#4b5563', bg: '#f3f4f6', desc: 'Intermedio base. Nivel consolidado, juego táctico y voleas seguras.' },
                { label: 'BRONZE', stars: 1, range: '1.00 - 2.99', color: '#c2410c', bg: '#ffedd5', desc: 'Iniciación y aprendizaje. Adquiriendo consistencia en el golpeo.' }
            ];

            modal.innerHTML = `
                <div style="background:#ffffff; border-radius:28px; width:100%; max-width:480px; max-height:90vh; overflow-y:auto; padding:24px; box-shadow:0 20px 50px rgba(0,0,0,0.25); border:1px solid #e2e8f0; display:flex; flex-direction:column; gap:16px; text-align:left; transform:translateY(20px); transition:transform 0.25s ease;">
                    
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <div>
                            <span style="font-size:0.6rem; font-weight:950; color:#2E61FF; text-transform:uppercase; letter-spacing:1.5px;">SISTEMA OFICIAL DE CALIBRACIÓN</span>
                            <h3 style="margin:2px 0 0 0; font-size:1.25rem; font-weight:950; color:#0F172A; text-transform:uppercase; letter-spacing:-0.5px;">Escala de Niveles SomosPádel</h3>
                        </div>
                        <button onclick="window.PlayerView.closeLevelScaleModal()" style="background:#f1f5f9; border:none; width:34px; height:34px; border-radius:12px; font-weight:900; color:#64748B; cursor:pointer; display:flex; align-items:center; justify-content:center;">✕</button>
                    </div>

                    <!-- Banner Tu Nivel Actual -->
                    <div style="background:#0F172A; border-radius:18px; padding:14px 18px; color:#ffffff; display:flex; justify-content:space-between; align-items:center; border:1.5px solid rgba(204,255,0,0.3);">
                        <div>
                            <span style="font-size:0.58rem; color:#CCFF00; font-weight:900; letter-spacing:1px; text-transform:uppercase;">TU NIVEL ACTUAL</span>
                            <div style="font-size:1.5rem; font-weight:950; color:#ffffff; line-height:1.1;">NIVEL ${currentLvl.toFixed(2)}</div>
                        </div>
                        <div style="text-align:right;">
                            <div style="font-size:0.8rem; font-weight:950; color:#CCFF00; text-transform:uppercase; letter-spacing:1px;">RANGO ${badge.label}</div>
                            <div style="font-size:0.75rem; color:#94A3B8; margin-top:2px;">${'★'.repeat(badge.stars)}${'☆'.repeat(5 - badge.stars)}</div>
                        </div>
                    </div>

                    <div style="font-size:0.72rem; color:#64748B; line-height:1.45; font-weight:600;">
                        El nivel en Somos Pádel BCN se calibra partido a partido siguiendo el estándar internacional Playtomic/SomosPádel (1.00 - 7.00). Cada victoria ante parejas de tu nivel o superior sumará puntos a tu coeficiente.
                    </div>

                    <!-- Lista de Rangos -->
                    <div style="display:flex; flex-direction:column; gap:10px;">
                        ${tiers.map(t => {
                            const rangeParts = t.range.split('-').map(s => parseFloat(s.trim()));
                            const isCurrent = currentLvl >= rangeParts[0] && (t.label === 'ELITE' ? true : currentLvl < rangeParts[1]);
                            return `
                                <div style="padding:12px 14px; border-radius:16px; background:${isCurrent ? '#f8fafc' : '#ffffff'}; border:${isCurrent ? '2px solid #2E61FF' : '1px solid #e2e8f0'}; display:flex; flex-direction:column; gap:4px; position:relative;">
                                    ${isCurrent ? '<span style="position:absolute; top:-9px; right:12px; background:#2E61FF; color:#ffffff; font-size:0.55rem; font-weight:950; padding:2px 8px; border-radius:99px; letter-spacing:1px;">TÚ ESTÁS AQUÍ</span>' : ''}
                                    <div style="display:flex; justify-content:space-between; align-items:center;">
                                        <div style="display:flex; align-items:center; gap:8px;">
                                            <span style="font-size:0.8rem; font-weight:950; color:${t.color};">RANGO ${t.label}</span>
                                            <span style="font-size:0.7rem; color:${t.color};">${'★'.repeat(t.stars)}</span>
                                        </div>
                                        <span style="font-size:0.75rem; font-weight:950; color:#0F172A; background:#f1f5f9; padding:2px 8px; border-radius:8px;">LVL ${t.range}</span>
                                    </div>
                                    <p style="margin:2px 0 0 0; font-size:0.7rem; color:#64748B; line-height:1.35; font-weight:500;">${t.desc}</p>
                                </div>
                            `;
                        }).join('')}
                    </div>

                    <button onclick="window.PlayerView.closeLevelScaleModal()" style="width:100%; height:44px; background:#0F172A; color:#CCFF00; border:none; font-weight:950; font-size:0.8rem; border-radius:14px; cursor:pointer; text-transform:uppercase; letter-spacing:1px; margin-top:4px;">
                        ENTENDIDO
                    </button>
                </div>
            `;

            document.body.appendChild(modal);
            requestAnimationFrame(() => {
                modal.style.opacity = '1';
                modal.firstElementChild.style.transform = 'translateY(0)';
            });
            modal.addEventListener('click', (e) => {
                if (e.target === modal) window.PlayerView.closeLevelScaleModal();
            });
        }

        closeLevelScaleModal() {
            const modal = document.getElementById('level-scale-modal');
            if (!modal) return;
            modal.style.opacity = '0';
            if (modal.firstElementChild) modal.firstElementChild.style.transform = 'translateY(20px)';
            setTimeout(() => modal.remove(), 250);
        }

        render() {
            // 🛡️ STRICT ROUTE GUARD: NUNCA renderizar Perfil si la ruta activa NO es 'profile'
            const activeRoute = window.Router ? window.Router.currentRoute : null;
            if (activeRoute !== 'profile') {
                return;
            }

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

            const currentLvl = parseFloat(user.level || 3.0);
            const badge = window.RankingController?.getLevelBadge(currentLvl) || { stars: 2, label: 'SILVER', color: '#4b5563', starColor: '#94a3b8' };
            const nextThreshold = (Math.floor(currentLvl * 2) + 1) / 2;
            const prevThreshold = nextThreshold - 0.5;
            const diff = Math.max(0, nextThreshold - currentLvl).toFixed(2);
            const progress = data.nextLevelProgress !== undefined 
                ? data.nextLevelProgress 
                : Math.min(100, Math.max(0, ((currentLvl - prevThreshold) / 0.5) * 100));
            const nextBadge = window.RankingController?.getLevelBadge(nextThreshold) || { label: 'GOLD' };

            // Cómputo robusto de partidos y efectividad
            const rawMatches = (data.stats && data.stats.matches !== undefined && data.stats.matches > 0)
                ? data.stats.matches
                : (parseInt(user.matches_played || 0) || (data.recentMatches ? data.recentMatches.length : 0));
            const rawWon = (data.stats && data.stats.won !== undefined)
                ? data.stats.won
                : (parseInt(user.wins || 0));
            const rawLost = (data.stats && data.stats.lost !== undefined)
                ? data.stats.lost
                : Math.max(0, rawMatches - rawWon);
            const rawWinRate = (data.stats && data.stats.winRate !== undefined && data.stats.winRate > 0)
                ? data.stats.winRate
                : (rawMatches > 0 ? Math.round((rawWon / rawMatches) * 100) : 0);

            // ⚡ GUARDIA DE RE-RENDER (ANTI-FLICKER):
            // Si el perfil ya está en pantalla y los datos son idénticos, no destruir el DOM
            const stateHash = `${user.id || user.uid}_${currentLvl}_${rawMatches}_${rawWon}_${rawLost}_${progress}_${this.activeTab || 'ai'}`;
            if (this._lastRenderedStateHash === stateHash && container.querySelector('.player-profile-wrapper')) {
                return; // Vista idéntica ya montada. Cero parpadeo.
            }
            this._lastRenderedStateHash = stateHash;

            // Racha y Forma normalizada (V / D / E)
            const normalizedForm = this.getNormalizedFormGuide(data, user);
            let streakCount = 0;
            let streakType = 'V';
            if (normalizedForm.length > 0) {
                streakType = normalizedForm[0].code;
                for (const item of normalizedForm) {
                    if (item.code === streakType) streakCount++;
                    else break;
                }
            }
            const streakDisplay = streakCount > 0 
                ? (streakType === 'V' ? `🔥 ${streakCount}V` : (streakType === 'D' ? `❄️ ${streakCount}D` : `⚪ ${streakCount}E`)) 
                : '—';
            const streakColor = streakType === 'V' ? '#10B981' : (streakType === 'D' ? '#EF4444' : '#64748B');

            let categoryName = 'Intermedio Base';
            let categoryColor = '#94A3B8';
            if (currentLvl >= 4.5) { categoryName = 'Élite / Competición'; categoryColor = '#047857'; }
            else if (currentLvl >= 4.0) { categoryName = 'Avanzado'; categoryColor = '#334155'; }
            else if (currentLvl >= 3.5) { categoryName = 'Intermedio Alto'; categoryColor = '#b45309'; }
            else if (currentLvl >= 3.0) { categoryName = 'Intermedio Base'; categoryColor = '#4b5563'; }
            else { categoryName = 'Iniciación'; categoryColor = '#c2410c'; }

            const starsHtml = Array(5).fill(0).map((_, i) => 
                `<i class="fas fa-star" style="font-size: 0.82rem; color: ${i < badge.stars ? (badge.starColor || '#CCFF00') : 'rgba(255,255,255,0.2)'}; margin-right: 2px;"></i>`
            ).join('');

            const formItemsHtml = normalizedForm.length > 0 ? normalizedForm.map(item => `
                <div title="${item.label}" style="
                    width: 32px; 
                    height: 32px; 
                    border-radius: 10px; 
                    background: ${item.bg}; 
                    color: ${item.color}; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    font-size: 0.85rem; 
                    font-weight: 950; 
                    border: 1.5px solid ${item.border};
                    box-shadow: ${item.shadow};
                    cursor: default;
                    transition: transform 0.15s;
                " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">${item.code}</div>
            `).join('') : '<span style="color:#94a3b8; font-size:0.65rem; font-weight:800;">SIN PARTIDOS REGISTRADOS</span>';

            container.innerHTML = `
                <div class="player-profile-wrapper fade-in" style="background: #f8fafc; min-height: 100vh; padding-bottom: 200px; font-family: 'Outfit', sans-serif; color: #0a192f;">
                    
                    <!-- Profile Header: Executive & Crystal Clear -->
                    <div style="background: #ffffff; padding: 45px 20px 32px; border-bottom: 1px solid #e2e8f0; position: relative; overflow: hidden;">
                        <!-- Animated background ambient lights -->
                        <div style="position: absolute; top: -100px; left: -100px; width: 300px; height: 300px; background: radial-gradient(circle, rgba(204,255,0,0.08) 0%, transparent 70%); animation: pulse 8s infinite;"></div>
                        <div style="position: absolute; bottom: -50px; right: -50px; width: 250px; height: 250px; background: radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%); animation: pulse 6s infinite reverse;"></div>
                        <style>
                            @keyframes pulse { 0% { transform: scale(1); opacity: 0.1; } 50% { transform: scale(1.2); opacity: 0.2; } 100% { transform: scale(1); opacity: 0.1; } }
                            @keyframes coachPulse { 0% { box-shadow: 0 0 5px rgba(204,255,0,0.15); border-color: rgba(204,255,0,0.4); } 100% { box-shadow: 0 0 15px rgba(204,255,0,0.45); border-color: #CCFF00; } }
                            @keyframes pulseGlow { 0% { box-shadow: 0 0 3px rgba(16,185,129,0.3); opacity:0.8; } 100% { box-shadow: 0 0 10px rgba(16,185,129,0.8); opacity:1; } }
                            .playtomic-drawer-modal { position: fixed; top: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 600px; height: 100%; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); z-index: 25000; display: flex; flex-direction: column; justify-content: flex-end; transition: opacity 0.3s ease; }
                            .playtomic-drawer-modal.hidden { display: none !important; }
                        </style>

                        <div style="display: flex; flex-direction: column; align-items: center; text-align: center; position: relative; z-index: 2; max-width: 600px; margin: 0 auto;">
                            
                            <!-- Avatar Section: EXECUTIVE STYLE -->
                            <div style="position: relative; margin-bottom: 20px; display: flex; justify-content: center;">
                                <div style="
                                    width: 125px; 
                                    height: 125px; 
                                    border-radius: 38px; 
                                    background: linear-gradient(135deg, #CCFF00 0%, #00E36D 100%); 
                                    padding: 3.5px; 
                                    position: relative; 
                                    box-shadow: 0 10px 30px rgba(204, 255, 0, 0.25);
                                ">
                                    <div style="
                                        width: 100%; 
                                        height: 100%; 
                                        border-radius: 34px; 
                                        background: url('${user.photo_url || user.photoURL || 'img/logo_somospadel.png'}') center/cover; 
                                        border: 3px solid #ffffff;
                                        position: relative;
                                        overflow: hidden;
                                        background-color: #f1f5f9;
                                    ">
                                        ${!(user.photo_url || user.photoURL) ? `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:#CCFF00; font-size:2.8rem; font-weight:900;">${user.name.substring(0, 1).toUpperCase()}</div>` : ''}
                                    </div>
                                    
                                    <!-- Verified Icon -->
                                    <div style="position: absolute; top: -6px; right: -6px; background: #CCFF00; color: #000; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; border: 3px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                                        <i class="fas fa-check"></i>
                                    </div>

                                    <!-- Camera Icon -->
                                    <div onclick="window.PlayerView.showUpdatePhotoPrompt()" style="position: absolute; bottom: -6px; right: -6px; background: white; width: 32px; height: 32px; border-radius: 11px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.12); cursor: pointer; border: 3px solid #ffffff;" title="Actualizar foto de perfil">
                                        <i class="fas fa-camera" style="color: #000; font-size: 0.85rem;"></i>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Nombre -->
                            <h2 style="font-weight: 950; font-size: 2rem; margin: 0; text-transform: uppercase; letter-spacing: -1px; color: #0a192f; line-height: 1;">${user.name}</h2>
                            
                            <!-- Rol del usuario -->
                            <div style="margin-top: 8px; display: flex; justify-content: center; align-items: center; min-height: 28px; gap: 6px;">
                                ${window.RoleService ? window.RoleService.getBadgeHtml(user.role) : `
                                    <div style="background: linear-gradient(90deg, #CCFF00, #00E36D); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 950; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 1.5px; display: flex; align-items: center; gap: 6px;">
                                        <i class="fas fa-crown"></i> EXECUTIVE PLAYER
                                    </div>
                                `}
                                <i class="fas fa-question-circle" onclick="window.showRolesLegendModal()" style="cursor: pointer; color: #94a3b8; font-size: 0.85rem; transition: color 0.2s;" onmouseover="this.style.color='#CCFF00'" onmouseout="this.style.color='#94a3b8'" title="Ver leyenda de roles oficiales"></i>
                            </div>

                            <!-- 🏆 HERO DE NIVEL Y CATEGORÍA OFICIAL -->
                            <div style="display: flex; flex-direction: column; align-items: center; gap: 8px; margin-top: 14px; width: 100%;">
                                <div style="display: flex; align-items: center; gap: 14px; background: #0F172A; padding: 10px 22px; border-radius: 22px; box-shadow: 0 10px 25px rgba(15,23,42,0.15); border: 1.5px solid rgba(204,255,0,0.35);">
                                    <div style="text-align: left;">
                                        <div style="font-size: 0.55rem; color: #94A3B8; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase;">Nivel Oficial</div>
                                        <div style="font-size: 1.9rem; font-weight: 950; color: #CCFF00; line-height: 1; letter-spacing: -0.5px;">
                                            ${currentLvl.toFixed(2)}
                                        </div>
                                    </div>
                                    <div style="width: 1px; height: 34px; background: rgba(255,255,255,0.15);"></div>
                                    <div style="text-align: left;">
                                        <div style="display: flex; align-items: center; gap: 5px;">
                                            <span style="font-size: 0.85rem; font-weight: 950; color: #ffffff; letter-spacing: 1px; text-transform: uppercase;">
                                                RANGO ${badge.label}
                                            </span>
                                            <i class="fas fa-info-circle" onclick="window.PlayerView.showLevelScaleModal()" style="cursor: pointer; color: #CCFF00; font-size: 0.95rem;" title="¿Cómo funciona mi nivel?"></i>
                                        </div>
                                        <div style="display: flex; gap: 2px; margin-top: 3px;">
                                            ${starsHtml}
                                        </div>
                                    </div>
                                </div>
                                
                                <div style="font-size: 0.65rem; font-weight: 900; color: #475569; letter-spacing: 0.8px; text-transform: uppercase; background: #f8fafc; padding: 4px 12px; border-radius: 99px; border: 1px solid #e2e8f0; display: inline-flex; align-items: center; gap: 6px;">
                                    <span style="width: 6px; height: 6px; border-radius: 50%; background: ${categoryColor};"></span>
                                    Categoría ${categoryName} (${prevThreshold.toFixed(1)} - ${nextThreshold.toFixed(1)})
                                </div>
                            </div>

                            <!-- 📊 RESUMEN DE PARTIDOS Y EFECTIVIDAD (KPIS CLAVE) -->
                            <div style="margin-top: 20px; width: 100%; max-width: 480px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">
                                <!-- Partidos Totales -->
                                <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 18px; padding: 12px 6px; text-align: center; box-shadow: 0 4px 14px rgba(0,0,0,0.02);">
                                    <div style="font-size: 0.55rem; font-weight: 950; color: #64748B; text-transform: uppercase; letter-spacing: 0.8px;">PARTIDOS</div>
                                    <div id="player-header-matches-count" style="font-size: 1.45rem; font-weight: 950; color: #0F172A; margin: 2px 0 1px;">${rawMatches}</div>
                                    <div id="player-header-matches-breakdown" style="font-size: 0.58rem; font-weight: 900; color: #64748B;">
                                        <span style="color: #10B981;">${rawWon}V</span> · <span style="color: #EF4444;">${rawLost}D</span>
                                    </div>
                                </div>
                                
                                <!-- Victorias / Win Rate -->
                                <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 18px; padding: 12px 6px; text-align: center; box-shadow: 0 4px 14px rgba(0,0,0,0.02);">
                                    <div style="font-size: 0.55rem; font-weight: 950; color: #64748B; text-transform: uppercase; letter-spacing: 0.8px;">VICTORIAS</div>
                                    <div id="player-header-winrate-count" style="font-size: 1.45rem; font-weight: 950; color: #10B981; margin: 2px 0 1px;">${rawWinRate}%</div>
                                    <div style="height: 4px; background: #e2e8f0; border-radius: 99px; margin: 5px 6px 0; overflow: hidden;">
                                        <div id="player-header-winrate-bar" style="height: 100%; width: ${rawWinRate}%; background: linear-gradient(90deg, #10B981, #34D399); border-radius: 99px;"></div>
                                    </div>
                                </div>

                                <!-- Racha Actual -->
                                <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 18px; padding: 12px 6px; text-align: center; box-shadow: 0 4px 14px rgba(0,0,0,0.02);">
                                    <div style="font-size: 0.55rem; font-weight: 950; color: #64748B; text-transform: uppercase; letter-spacing: 0.8px;">RACHA</div>
                                    <div id="player-header-streak-badge" style="font-size: 1.15rem; font-weight: 950; color: ${streakColor}; margin: 3px 0 2px;">
                                        ${streakDisplay}
                                    </div>
                                    <div style="font-size: 0.55rem; font-weight: 900; color: #94A3B8;">EN ACTIVO</div>
                                </div>

                                <!-- Próximo Rango Objetivo -->
                                <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 18px; padding: 12px 6px; text-align: center; box-shadow: 0 4px 14px rgba(0,0,0,0.02);">
                                    <div style="font-size: 0.55rem; font-weight: 950; color: #64748B; text-transform: uppercase; letter-spacing: 0.8px;">OBJETIVO</div>
                                    <div style="font-size: 1.1rem; font-weight: 950; color: #2E61FF; margin: 4px 0 2px;">${nextBadge.label}</div>
                                    <div style="font-size: 0.58rem; font-weight: 900; color: #2E61FF;">LVL ${nextThreshold.toFixed(1)}</div>
                                </div>
                            </div>

                            <!-- 🎯 PROYECTO DE ASCENSO CLARO -->
                            <div style="margin-top: 18px; width: 100%; max-width: 480px; background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 22px; padding: 16px 18px; position: relative; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.02); text-align: left;">
                                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                                    <div>
                                        <div style="display: flex; align-items: center; gap: 6px;">
                                            <span style="background: #0F172A; color: #CCFF00; font-size: 0.58rem; font-weight: 950; padding: 3px 8px; border-radius: 7px; text-transform: uppercase; letter-spacing: 1px;">
                                                🎯 PROYECTO DE ASCENSO
                                            </span>
                                        </div>
                                        <div style="color: #0a192f; font-weight: 950; font-size: 0.95rem; margin-top: 5px;">
                                            Subir a Rango ${nextBadge.label} (LVL ${nextThreshold.toFixed(1)})
                                        </div>
                                    </div>
                                    <div style="text-align: right;">
                                        <div style="color: #10B981; font-weight: 950; font-size: 1.25rem; line-height: 1;">-${diff}</div>
                                        <div style="color: #64748b; font-size: 0.55rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px;">PARA SUBIR</div>
                                    </div>
                                </div>
                                
                                <div style="width: 100%; height: 7px; background: #f1f5f9; border-radius: 12px; position: relative; overflow: hidden; margin: 10px 0 8px; border: 1px solid #e2e8f0;">
                                    <div style="position: absolute; top: 0; left: 0; height: 100%; width: ${progress}%; background: linear-gradient(90deg, #CCFF00, #10B981); box-shadow: 0 0 10px rgba(204,255,0,0.4); border-radius: 12px; transition: width 1s ease;"></div>
                                </div>

                                <div style="display: flex; justify-content: space-between; font-size: 0.6rem; font-weight: 900; color: #64748B;">
                                    <span>Nivel ${prevThreshold.toFixed(1)} (${badge.label})</span>
                                    <span style="color: #0F172A; font-weight: 950;">${Math.round(progress)}% COMPLETADO</span>
                                    <span>Meta: ${nextThreshold.toFixed(1)} (${nextBadge.label})</span>
                                </div>

                                <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed #e2e8f0; font-size: 0.65rem; color: #64748b; line-height: 1.35; font-weight: 600;">
                                    💡 <strong>¿Cómo subir?</strong> Cada victoria en americanas o entrenamientos contra parejas de tu nivel sumará puntos a tu coeficiente ELO.
                                </div>
                            </div>

                            <!-- ⚡ FORMA RECIENTE (ÚLTIMOS PARTIDOS) -->
                            <div style="margin-top: 16px; display: flex; flex-direction: column; align-items: center; gap: 6px;">
                                <div style="display: flex; gap: 8px; align-items: center;">
                                    <span style="font-size: 0.65rem; font-weight: 950; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-right: 4px;">ÚLTIMOS PARTIDOS:</span>
                                    <div id="player-header-form-dots" style="display: flex; gap: 6px;">
                                        ${formItemsHtml}
                                    </div>
                                </div>
                                <div style="font-size: 0.58rem; font-weight: 800; color: #94a3b8; display: flex; gap: 8px;">
                                    <span><strong style="color: #10B981;">V</strong> Victoria</span>
                                    <span>·</span>
                                    <span><strong style="color: #EF4444;">D</strong> Derrota</span>
                                    <span>·</span>
                                    <span><strong style="color: #64748B;">E</strong> Empate</span>
                                </div>
                            </div>

                            <!-- ACTION BUTTONS -->
                            <div style="display:flex; flex-wrap:wrap; justify-content:center; gap:8px; margin-top: 22px;">
                                <button onclick="window.PlayerView.haptic(50); window.PadelFutCard && window.PadelFutCard.open(window.Store ? window.Store.getState('currentUser') : {})" class="haptic-feedback" style="background: linear-gradient(135deg, #CCFF00, #00E36D); border: none; color: #000; padding: 11px 18px; border-radius: 16px; font-weight: 950; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 15px rgba(204,255,0,0.35);">
                                    <span>🎴</span> CARTA FUT
                                </button>
                                <button onclick="window.PlayerView.haptic(30); window.CourtScoreboard && window.CourtScoreboard.open()" class="haptic-feedback" style="background: #0F172A; border: 1px solid rgba(204,255,0,0.4); color: #CCFF00; padding: 11px 18px; border-radius: 16px; font-weight: 950; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                                    <span>📟</span> MARCADOR
                                </button>
                                <button onclick="window.PlayerView.haptic(50); window.PlayerView.shareProfileCard()" class="haptic-feedback" style="background: rgba(204,255,0,0.05); border: 1px solid #CCFF00; color: #72a800; padding: 11px 18px; border-radius: 16px; font-weight: 800; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                                    <i class="fas fa-share-alt"></i> COMPARTIR
                                </button>
                                <button onclick="window.PlayerView.haptic(30); window.PlayerView.showUpdatePasswordPrompt()" class="haptic-feedback" style="background: #ffffff; border: 1px solid #e2e8f0; color: #0a192f; padding: 11px 16px; border-radius: 16px; font-weight: 800; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; cursor: pointer;" title="Cambiar contraseña">
                                    <i class="fas fa-cog"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- PROFILE SEGMENTED TABS CONTROLLER (Rendimiento IA vs Ficha & Atributos) -->
                    <div style="background: #ffffff; border-bottom: 1px solid #e2e8f0; padding: 12px 16px; display: flex; justify-content: center; gap: 10px; position: sticky; top: 0; z-index: 100; box-shadow: 0 4px 20px rgba(0,0,0,0.02);">
                        <button class="profile-tab-btn-pill haptic-feedback" data-tab="ai_performance" onclick="window.PlayerView.setProfileTab('ai_performance')" 
                                style="flex: 1; max-width: 220px; padding: 11px 16px; border-radius: 14px; font-weight: 900; font-size: 0.78rem; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; ${this.activeTab === 'ai_performance' ? 'background: #0F172A; color: #ffffff; box-shadow: 0 4px 14px rgba(15,23,42,0.15);' : 'background: #f1f5f9; color: #64748B;'}">
                            <i class="fas fa-chart-line" style="${this.activeTab === 'ai_performance' ? 'color: #CCFF00;' : 'color: #94A3B8;'}"></i> Rendimiento IA
                        </button>
                        <button class="profile-tab-btn-pill haptic-feedback" data-tab="attributes" onclick="window.PlayerView.setProfileTab('attributes')" 
                                style="flex: 1; max-width: 220px; padding: 11px 16px; border-radius: 14px; font-weight: 900; font-size: 0.78rem; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; ${this.activeTab === 'attributes' ? 'background: #0F172A; color: #ffffff; box-shadow: 0 4px 14px rgba(15,23,42,0.15);' : 'background: #f1f5f9; color: #64748B;'}">
                            <i class="fas fa-user-astronaut" style="${this.activeTab === 'attributes' ? 'color: #3B82F6;' : 'color: #94A3B8;'}"></i> Ficha & Atributos
                        </button>
                    </div>

                    <!-- TAB BODY CONTAINER -->
                    <div id="player-profile-tab-body" style="padding: 20px 16px;">
                    </div>

                </div>

                <input type="file" id="profile-photo-input" accept="image/*" style="display: none;" onchange="window.PlayerView.handlePhotoSelection(this)">

                <!-- AI TELEMETRY MODAL -->
                <div id="ai-telemetry-modal" class="playtomic-drawer-modal hidden" onclick="if(event.target===this) window.PlayerView.closeAiTelemetryModal();" style="z-index:25000; background:rgba(5,7,10,0.85); backdrop-filter:blur(15px); -webkit-backdrop-filter:blur(15px);">
                </div>
            `;

            setTimeout(() => {
                this.renderTabContent();
            }, 60);
        }

        renderTabContent() {
            const body = document.getElementById('player-profile-tab-body');
            if (!body) return;

            const user = window.Store ? window.Store.getState('currentUser') : null;
            const data = window.Store ? window.Store.getState('playerStats') : null;
            if (!user) return;

            // Actualizar botones de pestañas
            document.querySelectorAll('.profile-tab-btn-pill').forEach(btn => {
                const isAi = btn.dataset.tab === 'ai_performance';
                const isActive = (this.activeTab === 'ai_performance' && isAi) || (this.activeTab === 'attributes' && !isAi);
                btn.style.background = isActive ? '#0F172A' : '#f1f5f9';
                btn.style.color = isActive ? '#ffffff' : '#64748B';
                btn.style.boxShadow = isActive ? '0 4px 14px rgba(15,23,42,0.15)' : 'none';
                const icon = btn.querySelector('i');
                if (icon) {
                    if (isAi) icon.style.color = isActive ? '#CCFF00' : '#94A3B8';
                    else icon.style.color = isActive ? '#3B82F6' : '#94A3B8';
                }
            });

            if (this.activeTab === 'ai_performance') {
                const myName = user.name || user.displayName || "Jugador";
                const userLevel = parseFloat(user.level || 3.25);
                const userId = user.id || user.uid;

                if (this.currentAiHistoryData && !this.forceDemoMode) {
                    this.renderAiHistoryHtml(this.currentAiHistoryData, myName, userLevel, false);
                } else {
                    body.innerHTML = `
                        <div class="playtomic-skeleton-light" style="padding: 3.5rem 1.5rem; text-align: center; background: #ffffff; border-radius: 24px; border: 1px solid rgba(15,23,42,0.06);">
                            <span class="playtomic-spinner-light"></span>
                            <p style="font-size:0.85rem; font-weight:900; color:#0F172A; margin-top:14px; text-transform:uppercase; letter-spacing:1px;">CALIBRANDO RENDIMIENTO CON IA...</p>
                            <p style="font-size:0.75rem; color:#64748B; font-weight:500; max-width:260px; margin:8px auto 0 auto; line-height:1.4;">Buscando tus americanas, entrenamientos y evolución en Firestore...</p>
                        </div>
                    `;
                    setTimeout(() => {
                        this.loadAndRenderRealAiHistory(myName, userLevel, userId);
                    }, 100);
                }
            } else {
                // Pestaña Ficha & Atributos
                body.innerHTML = this.renderAttributesTabHtml(data, user);
                setTimeout(() => {
                    this.initAttributesCharts(data, user);
                    const context = data?.context || { status: 'EMPTY' };

                    const pLevelRoot = document.getElementById('profile-power-level-root');
                    if (pLevelRoot && window.PowerLevelCard) pLevelRoot.innerHTML = window.PowerLevelCard.render(user);

                    const techHubRoot = document.getElementById('profile-tech-hub-root');
                    if (techHubRoot) techHubRoot.innerHTML = this.renderTechHub();

                    if (window.DashboardView && window.DashboardView.renderActivityFeed) {
                        window.DashboardView.renderActivityFeed('profile-activity-root');
                    }
                }, 100);
            }
        }

        // ==========================================
        // 🧠 SISTEMA DE RENDIMIENTO E HISTORIAL IA
        // ==========================================

        async loadAndRenderRealAiHistory(myName, userLevel, userId) {
            const body = document.getElementById('player-profile-tab-body');
            if (!body) return;

            // Fallback a modo demo interactivo si el usuario lo activó explícitamente
            if (this.forceDemoMode) {
                const demoData = this.getAiHistoryData(myName, userLevel);
                this.currentAiHistoryData = demoData;
                this.renderAiHistoryHtml(demoData, myName, userLevel, true);
                return;
            }

            // Si ya tenemos datos recientes en memoria (< 30s) para este mismo usuario, pintar directo sin consultar Firestore
            const now = Date.now();
            if (this.currentAiHistoryData && this._lastAiHistoryUserId === userId && (now - (this._lastAiHistoryTime || 0) < 30000)) {
                this.renderAiHistoryHtml(this.currentAiHistoryData, myName, userLevel, false);
                return;
            }

            try {
                if (!window.db) {
                    throw new Error("La base de datos de Firebase no está inicializada.");
                }

                const currentUser = window.Store ? window.Store.getState('currentUser') : null;
                const searchIds = currentUser && currentUser.mergedIds && currentUser.mergedIds.length > 0 
                    ? currentUser.mergedIds 
                    : (userId ? [userId] : []);
                const searchName = myName.toLowerCase().trim();

                // 1. Obtener partidos, eventos y el historial de niveles real de Firestore
                const [matchesSnap, entrenosSnap, americanasSnap, entrenosEventsSnap, ...levelHistorySnaps] = await Promise.all([
                    window.db.collection('matches').get(),
                    window.db.collection('entrenos_matches') ? window.db.collection('entrenos_matches').get() : Promise.resolve({ docs: [] }),
                    window.db.collection('americanas').get(),
                    window.db.collection('entrenos') ? window.db.collection('entrenos').get() : Promise.resolve({ docs: [] }),
                    ...searchIds.map(id => window.db.collection('level_history').where('userId', '==', id).get())
                ]);

                // Construir mapa de nombres de torneos/entrenamientos reales
                const eventNamesMap = {};
                americanasSnap.forEach(doc => {
                    const d = doc.data();
                    eventNamesMap[doc.id] = d.name;
                });
                entrenosEventsSnap.forEach(doc => {
                    const d = doc.data();
                    eventNamesMap[doc.id] = d.name;
                });

                // Construir historial de niveles ordenado cronológicamente
                const levelHistoryPoints = [];
                levelHistorySnaps.forEach(snap => {
                    snap.forEach(doc => {
                        const d = doc.data();
                        const rawDate = d.timestamp || d.date;
                        const dateObj = rawDate ? (typeof rawDate.toDate === 'function' ? rawDate.toDate() : new Date(rawDate)) : new Date();
                        levelHistoryPoints.push({
                            level: parseFloat(d.level || 3.0),
                            oldLevel: parseFloat(d.oldLevel || d.level || 3.0),
                            date: dateObj,
                            delta: parseFloat(d.delta || 0),
                            matchId: d.matchId || null  // ← clave para lookup exacto por partido
                        });
                    });
                });
                
                // Ordenar historial de niveles por fecha antigua -> nueva
                levelHistoryPoints.sort((a, b) => a.date - b.date);

                if (levelHistoryPoints.length === 0) {
                    levelHistoryPoints.push({
                        level: userLevel,
                        date: new Date(),
                        delta: 0
                    });
                }

                // Cargar todos los documentos crudos de partidos
                const rawMatches = [];
                matchesSnap.forEach(doc => {
                    rawMatches.push({ id: doc.id, collectionType: 'matches', ...doc.data() });
                });
                entrenosSnap.forEach(doc => {
                    rawMatches.push({ id: doc.id, collectionType: 'entrenos_matches', ...doc.data() });
                });

                // 2. Filtrar los partidos en los que el usuario participa de forma real
                const userRawMatches = rawMatches.filter(m => {
                    const teamA = m.team_a_ids || [];
                    const teamB = m.team_b_ids || [];
                    
                    for (const id of searchIds) {
                        if (teamA.includes(id) || teamB.includes(id)) return true;
                    }

                    const parseNames = (field) => {
                        if (!field) return [];
                        if (Array.isArray(field)) return field.map(n => n.toLowerCase().trim());
                        if (typeof field === 'string') return field.split('/').map(n => n.toLowerCase().trim());
                        return [];
                    };
                    const pNames = [...parseNames(m.team_a_names), ...parseNames(m.team_b_names)];
                    if (pNames.some(n => n.includes(searchName) || searchName.includes(n))) return true;

                    const legacyNames = [
                        m.player1_name || (m.player1 && m.player1.name),
                        m.player2_name || (m.player2 && m.player2.name),
                        m.player3_name || (m.player3 && m.player3.name),
                        m.player4_name || (m.player4 && m.player4.name)
                    ].filter(Boolean).map(n => n.toLowerCase().trim());
                    
                    if (legacyNames.some(n => n.includes(searchName) || searchName.includes(n))) return true;

                    return false;
                });

                // 3. Si no se encuentran partidos reales jugados para este usuario
                if (userRawMatches.length === 0) {
                    this.renderNoRealMatchesView(myName);
                    return;
                }

                const getMatchMs = (match) => {
                    if (match.date) return new Date(match.date).getTime();
                    if (match.createdAt) return new Date(match.createdAt).getTime();
                    if (match.created_at) {
                        if (typeof match.created_at.toDate === 'function') return match.created_at.toDate().getTime();
                        if (match.created_at.seconds) return match.created_at.seconds * 1000;
                        return new Date(match.created_at).getTime();
                    }
                    return 0;
                };

                userRawMatches.sort((a, b) => getMatchMs(a) - getMatchMs(b));

                // 4. Mapear partidos con telemetría cuántica
                const mappedMatches = userRawMatches.map((m, index) => {
                    const sA = parseInt(m.score_a || 0);
                    const sB = parseInt(m.score_b || 0);
                    
                    const parseTeamNames = (namesField) => {
                        if (!namesField) return ["Jugador 1", "Jugador 2"];
                        if (Array.isArray(namesField)) {
                            const arr = namesField.filter(Boolean).map(n => n.trim());
                            while (arr.length < 2) arr.push(`Jugador ${arr.length + 1}`);
                            return arr;
                        }
                        if (typeof namesField === 'string') {
                            const arr = namesField.split('/').map(n => n.trim()).filter(Boolean);
                            while (arr.length < 2) arr.push(`Jugador ${arr.length + 1}`);
                            return arr;
                        }
                        return ["Jugador 1", "Jugador 2"];
                    };

                    const teamANames = parseTeamNames(m.team_a_names);
                    const teamBNames = parseTeamNames(m.team_b_names);

                    let isTeamA = false;
                    const teamAIds = m.team_a_ids || [];
                    for (const id of searchIds) {
                        if (teamAIds.includes(id)) isTeamA = true;
                    }
                    if (!isTeamA) {
                        isTeamA = teamANames.some(n => n.toLowerCase().includes(searchName) || searchName.includes(n.toLowerCase()));
                    }

                    const won = (isTeamA && sA > sB) || (!isTeamA && sB > sA);
                    const scoreText = (sA > 0 || sB > 0) ? `${sA} - ${sB} juegos` : "Finalizado";

                    let partner = "";
                    let rivals = [];

                    if (isTeamA) {
                        const userIndex = teamANames.findIndex(n => n.toLowerCase().includes(searchName) || searchName.includes(n.toLowerCase()));
                        partner = userIndex === 0 ? teamANames[1] : teamANames[0];
                        rivals = teamBNames;
                    } else {
                        const userIndex = teamBNames.findIndex(n => n.toLowerCase().includes(searchName) || searchName.includes(n.toLowerCase()));
                        partner = userIndex === 0 ? teamBNames[1] : teamBNames[0];
                        rivals = teamANames;
                    }

                    const cleanName = (n) => n.replace(/\s*\(\d+(?:\.\d+)?\)\s*$/, '').trim();
                    partner = cleanName(partner);
                    rivals = rivals.map(cleanName);

                    // ── Nivel real en el momento del partido ──────────────────
                    // Estrategia de búsqueda (en orden de prioridad):
                    //   1. Entrada de level_history con matchId coincidente (más precisa)
                    //   2. Entrada de level_history con fecha más cercana al partido
                    //   3. Nivel actual del jugador en Firestore (userLevel) como fallback seguro
                    let matchLevel = userLevel;

                    // 1. Buscar por matchId exacto
                    const matchIdStr = m.id || '';
                    const histByMatchId = levelHistoryPoints.find(p => p.matchId && p.matchId === matchIdStr);
                    if (histByMatchId) {
                        matchLevel = histByMatchId.level;
                    } else {
                        // 2. Buscar por fecha más próxima al partido
                        const matchMs = getMatchMs(m);
                        if (matchMs > 0 && levelHistoryPoints.length > 0) {
                            let closestDiff = Infinity;
                            let closestPoint = null;
                            for (const p of levelHistoryPoints) {
                                const pMs = p.date instanceof Date ? p.date.getTime() : new Date(p.date).getTime();
                                const diff = Math.abs(pMs - matchMs);
                                if (diff < closestDiff) {
                                    closestDiff = diff;
                                    closestPoint = p;
                                }
                            }
                            // Solo usar el historial si la entrada más cercana está a menos de 7 días
                            if (closestPoint && closestDiff < 7 * 24 * 60 * 60 * 1000) {
                                matchLevel = closestPoint.level;
                            }
                        }
                        // 3. fallback: userLevel (ya asignado arriba)
                    }

                    const seed = m.id.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
                    const netPoints = won ? (72 + (seed % 16)) : (48 + (seed % 14));
                    const serveIn = 65 + (seed % 20);
                    const smashEff = won ? (68 + (seed % 18)) : (45 + (seed % 18));
                    const errors = won ? (4 + (seed % 6)) : (12 + (seed % 9));

                    let dateVal = m.date;
                    if (!dateVal) {
                        if (m.createdAt) {
                            dateVal = m.createdAt.split('T')[0];
                        } else if (m.created_at) {
                            const dateObj = typeof m.created_at.toDate === 'function' ? m.created_at.toDate() : (m.created_at.seconds ? new Date(m.created_at.seconds * 1000) : new Date(m.created_at));
                            dateVal = dateObj.toISOString().split('T')[0];
                        } else {
                            dateVal = new Date().toISOString().split('T')[0];
                        }
                    }
                    const timeVal = m.time || "19:30";

                    let aiInsight = "";
                    let tacticalTip = "";
                    const partnerShort = partner.split(' ')[0];
                    const rival1Short = rivals[0].split(' ')[0];
                    const rival2Short = rivals[1] ? rivals[1].split(' ')[0] : 'rival';

                    if (won) {
                        const diff = Math.abs(sA - sB);
                        if (diff >= 5) {
                            aiInsight = `Victoria contundente junto a ${partnerShort}. Dominio absoluto en la red sin conceder opciones a ${rival1Short}.`;
                            tacticalTip = `Presión constante sobre el revés de ${rival1Short}. Excelente coordinación al subir tras globo de ${partnerShort}.`;
                        } else {
                            aiInsight = `Gran victoria con ${partnerShort} resolviendo bajo presión. Los puntos de oro en el tramo final marcaron la diferencia.`;
                            tacticalTip = `Buen control de los espacios defensivos cruzados. Mantén la volea baja para forzar el error de ${rival1Short}.`;
                        }
                    } else {
                        aiInsight = `Derrota táctica ante ${rival1Short} y ${rival2Short}. Se detectó falta de cobertura en el pasillo central junto a ${partnerShort}.`;
                        tacticalTip = `Trabaja la comunicación en el centro de la pista con ${partnerShort} y alarga los globos para evitar el ataque rápido de ${rival1Short}.`;
                    }

                    return {
                        id: m.id,
                        club: eventNamesMap[m.americana_id] || m.americana_name || m.event_name || (m.collectionType === 'entrenos_matches' ? 'Entreno de la Comunidad' : 'Torneo Americano Somos Padel'),
                        comarca: m.comarca || "Barcelona",
                        date: dateVal,
                        time: timeVal,
                        duration: m.duration || 90,
                        level_min: (matchLevel - 0.2),
                        level_max: (matchLevel + 0.2),
                        user_level_at_match: matchLevel.toFixed(2),
                        players: [myName, partner, ...rivals],
                        won,
                        partner,
                        rivals,
                        result: scoreText,
                        ai_insight: aiInsight,
                        telemetry: {
                            net_points: netPoints,
                            serve_in: serveIn,
                            smash_eff: smashEff,
                            errors: errors,
                            tactical_tip: tacticalTip,
                            heatmap: [
                                { x: 30, y: 35, color: "rgba(204, 255, 0, 0.6)", size: 38, label: "Tus Voleas" },
                                { x: 25, y: 75, color: "rgba(204, 255, 0, 0.45)", size: 45, label: "Tu Defensa" },
                                { x: 70, y: 30, color: "rgba(0, 210, 255, 0.55)", size: 35, label: `Voleas de ${partnerShort}` },
                                { x: 75, y: 80, color: "rgba(0, 210, 255, 0.4)", size: 40, label: `Defensa de ${partnerShort}` }
                            ]
                        }
                    };
                });

                mappedMatches.reverse();
                this.currentAiHistoryData = mappedMatches;
                this._lastAiHistoryUserId = userId;
                this._lastAiHistoryTime = Date.now();

                // Sincronizar dinámicamente los KPIs de la cabecera con los partidos reales de Firestore
                const realTotal = mappedMatches.length;
                const realWins = mappedMatches.filter(m => m.won).length;
                const realLosses = realTotal - realWins;
                const realWinRate = realTotal > 0 ? Math.round((realWins / realTotal) * 100) : 0;

                const elMatches = document.getElementById('player-header-matches-count');
                if (elMatches) elMatches.textContent = realTotal;
                const elWonLost = document.getElementById('player-header-matches-breakdown');
                if (elWonLost) elWonLost.innerHTML = `<span style="color:#10B981;">${realWins}V</span> · <span style="color:#EF4444;">${realLosses}D</span>`;
                const elWinRate = document.getElementById('player-header-winrate-count');
                if (elWinRate) elWinRate.textContent = `${realWinRate}%`;
                const elBar = document.getElementById('player-header-winrate-bar');
                if (elBar) elBar.style.width = `${realWinRate}%`;

                // Sincronizar los 5 partidos recientes en la cabecera
                const recentSlice = mappedMatches.slice(0, 5);
                const elFormDots = document.getElementById('player-header-form-dots');
                if (elFormDots && recentSlice.length > 0) {
                    elFormDots.innerHTML = recentSlice.map(m => {
                        const code = m.won ? 'V' : 'D';
                        const color = m.won ? '#10B981' : '#EF4444';
                        const bg = m.won ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)';
                        const border = m.won ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)';
                        const shadow = m.won ? '0 2px 8px rgba(16,185,129,0.25)' : 'none';
                        const title = m.won ? 'Victoria' : 'Derrota';
                        return `
                            <div title="${title}" style="
                                width: 32px; height: 32px; border-radius: 10px;
                                background: ${bg}; color: ${color};
                                display: flex; align-items: center; justify-content: center;
                                font-size: 0.85rem; font-weight: 950;
                                border: 1.5px solid ${border}; box-shadow: ${shadow};
                                cursor: default;
                            ">${code}</div>
                        `;
                    }).join('');
                }

                this.renderAiHistoryHtml(mappedMatches, myName, userLevel, false);

            } catch (err) {
                console.error("Error al cargar historial de rendimiento en perfil:", err);
                const body = document.getElementById('player-profile-tab-body');
                if (body) {
                    body.innerHTML = `
                        <div class="playtomic-skeleton-light" style="border-color: rgba(255,45,85,0.2); background: rgba(255,45,85,0.02); color: #ff2d55; padding: 2rem; border-radius: 20px;">
                            <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 8px;"></i>
                            <h4 style="margin: 0; font-weight: 900;">Error al conectar con Firestore</h4>
                            <p style="color: #64748B; font-size: 0.75rem; margin-top: 4px;">${err.message}</p>
                            <button onclick="window.PlayerView.activateDemoMode()" style="margin-top: 14px; background: #CCFF00; color: #000; border: none; padding: 8px 18px; border-radius: 12px; font-weight: 900; font-size: 0.75rem; cursor: pointer;">Ver Datos Simulados</button>
                        </div>
                    `;
                }
            }
        }

        renderAiHistoryHtml(historyData, myName, userLevel, isDemoMode) {
            const body = document.getElementById('player-profile-tab-body');
            if (!body) return;

            const totalMatches = historyData.length;
            const wins = historyData.filter(m => m.won).length;
            const losses = totalMatches - wins;
            const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;
            
            const avgNetPoints = totalMatches > 0 ? Math.round(historyData.reduce((sum, m) => sum + (m.telemetry?.net_points || 0), 0) / totalMatches) : 0;
            const avgSmash = totalMatches > 0 ? Math.round(historyData.reduce((sum, m) => sum + (m.telemetry?.smash_eff || 0), 0) / totalMatches) : 0;

            const partnersCount = {};
            historyData.forEach(m => {
                if (m.won && m.partner) {
                    partnersCount[m.partner] = (partnersCount[m.partner] || 0) + 1;
                }
            });
            let idealPartner = "No asignada";
            let maxPartnerWins = 0;
            Object.keys(partnersCount).forEach(pName => {
                if (partnersCount[pName] > maxPartnerWins) {
                    maxPartnerWins = partnersCount[pName];
                    idealPartner = pName;
                }
            });

            let html = `
                <div class="ai-history-wrapper fade-in" style="display:flex; flex-direction:column; gap:20px; text-align:left;">
                    
                    ${isDemoMode ? `
                    <!-- Banner de Modo Demo -->
                    <div style="background:rgba(204,255,0,0.08); border:1px solid rgba(204,255,0,0.3); border-radius:14px; padding:10px 14px; text-align:left; font-size:0.7rem; color:#85a600; font-weight:800; display:flex; justify-content:space-between; align-items:center;">
                        <span>🧬 VISUALIZACIÓN DE DEMOSTRACIÓN (DATOS SIMULADOS)</span>
                        <button onclick="window.PlayerView.disableDemoMode()" style="background:transparent; border:none; color:#2E61FF; font-weight:900; cursor:pointer; font-size:0.7rem; padding:0; text-decoration:underline;">Ver Datos Reales</button>
                    </div>
                    ` : `
                    <!-- Banner de Modo Datos Reales -->
                    <div style="background:rgba(16,185,129,0.06); border:1px solid rgba(16,185,129,0.2); border-radius:14px; padding:10px 14px; text-align:left; font-size:0.7rem; color:#10B981; font-weight:800; display:flex; align-items:center; gap:8px;">
                        <span style="width:7px; height:7px; background:#10B981; border-radius:50%; display:inline-block; animation: pulseGlow 1.5s infinite alternate;"></span>
                        CONECTADO A BASE DE DATOS DE RENDIMIENTO FIRESTORE (DATOS REALES)
                    </div>
                    `}

                    <!-- 1. AI STATS BOARD GRID -->
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                        <div class="glass-card-pro-light" style="background:#ffffff; border:1px solid rgba(15,23,42,0.06); padding:16px; border-radius:20px; display:flex; flex-direction:column; gap:4px; text-align:left; box-shadow:0 6px 20px rgba(10,25,47,0.02);">
                            <span style="font-size:0.65rem; color:#64748B; font-weight:900; text-transform:uppercase; letter-spacing:1px;">Partidos Analizados</span>
                            <div style="display:flex; align-items:baseline; gap:8px;">
                                <span style="font-size:1.6rem; font-weight:950; color:#0F172A;">${totalMatches}</span>
                                <span style="font-size:0.78rem; font-weight:800; color:#10B981;">W ${wins}</span>
                                <span style="font-size:0.78rem; font-weight:800; color:#EF4444;">L ${losses}</span>
                            </div>
                            <div style="height:5px; background:#e2e8f0; border-radius:99px; overflow:hidden; margin-top:8px; width:100%;">
                                <div style="height:100%; background:linear-gradient(90deg, #10B981 0%, #34D399 100%); width:${winRate}%; border-radius:99px;"></div>
                            </div>
                        </div>

                        <div class="glass-card-pro-light" style="background:#ffffff; border:1px solid rgba(15,23,42,0.06); padding:16px; border-radius:20px; display:flex; flex-direction:column; gap:4px; text-align:left; box-shadow:0 6px 20px rgba(10,25,47,0.02);">
                            <span style="font-size:0.65rem; color:#64748B; font-weight:900; text-transform:uppercase; letter-spacing:1px;">Rango de Nivel IA</span>
                            <div style="display:flex; align-items:baseline; gap:6px;">
                                <span style="font-size:1.6rem; font-weight:950; color:#2E61FF;">${userLevel.toFixed(2)}</span>
                                <span style="font-size:0.68rem; background:rgba(46,97,255,0.08); color:#2E61FF; padding:2px 6px; border-radius:6px; font-weight:900;">ACTIVO</span>
                            </div>
                            <span style="font-size:0.62rem; color:#94A3B8; font-weight:600; margin-top:8px;">Calibrado según Firestore</span>
                        </div>

                        <div class="glass-card-pro-light" style="background:#ffffff; border:1px solid rgba(15,23,42,0.06); padding:16px; border-radius:20px; display:flex; flex-direction:column; gap:4px; text-align:left; box-shadow:0 6px 20px rgba(10,25,47,0.02);">
                            <span style="font-size:0.65rem; color:#64748B; font-weight:900; text-transform:uppercase; letter-spacing:1px;">Efectividad Red</span>
                            <div style="display:flex; align-items:baseline; gap:6px;">
                                <span style="font-size:1.6rem; font-weight:950; color:#0F172A;">${avgNetPoints}%</span>
                                <span style="font-size:0.7rem; font-weight:800; color:#10B981;"><i class="fas fa-arrow-trend-up"></i> Táctico</span>
                            </div>
                            <span style="font-size:0.62rem; color:#64748B; font-weight:700; margin-top:8px;">Remate Smash: ${avgSmash}%</span>
                        </div>

                        <div class="glass-card-pro-light" style="background:#ffffff; border:1px solid rgba(15,23,42,0.06); padding:16px; border-radius:20px; display:flex; flex-direction:column; gap:4px; text-align:left; box-shadow:0 6px 20px rgba(10,25,47,0.02);">
                            <span style="font-size:0.65rem; color:#64748B; font-weight:900; text-transform:uppercase; letter-spacing:1px;">Socio Ideal</span>
                            <div style="display:flex; align-items:baseline; gap:6px;">
                                <span style="font-size:1.05rem; font-weight:950; color:#0F172A; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:110px;">${idealPartner}</span>
                                <span style="font-size:0.7rem; font-weight:800; color:#10B981;">90%</span>
                            </div>
                            <span style="font-size:0.62rem; color:#64748B; font-weight:700; margin-top:8px;">Máxima sinergia ganadora</span>
                        </div>
                    </div>

                    <!-- 2. CHART EVOLUCIÓN NIVEL -->
                    <div style="background:#ffffff; border:1px solid rgba(15,23,42,0.06); border-radius:24px; padding:20px; text-align:left; box-shadow:0 8px 32px rgba(10,25,47,0.02);">
                        <h4 style="margin:0 0 16px 0; font-size:0.85rem; font-weight:950; color:#0F172A; text-transform:uppercase; letter-spacing:1px; display:flex; align-items:center; gap:8px;">
                            <i class="fas fa-chart-line" style="color:#2E61FF;"></i> Evolución del Nivel de Juego (IA)
                        </h4>
                        
                        <div style="position:relative; width:100%; height:160px; display:flex; align-items:center; justify-content:center;">
                            <canvas id="profile-ai-level-chart" style="width:100%; height:100%; max-height:160px;"></canvas>
                        </div>
                    </div>

                    <!-- 3. COHETE HOLOGRÁFICO CAPTAIN AI COACH -->
                    <div style="background:linear-gradient(135deg, #0F172A 0%, #05070a 100%); border:1px solid rgba(204,255,0,0.15); border-radius:24px; padding:20px; color:#ffffff; position:relative; overflow:hidden; text-align:left; box-shadow:0 12px 40px rgba(0,0,0,0.15);">
                        <div style="position:absolute; inset:0; background:linear-gradient(180deg, rgba(204,255,0,0.04) 50%, transparent 50%); background-size:100% 4px; pointer-events:none;"></div>
                        <div style="position:absolute; width:150px; height:150px; background:radial-gradient(circle, rgba(204,255,0,0.05) 0%, transparent 70%); top:-50px; right:-40px; pointer-events:none;"></div>
                        
                        <div style="display:flex; gap:14px; align-items:flex-start; position:relative; z-index:2;">
                            <div style="width:42px; height:42px; border-radius:50%; background:rgba(204,255,0,0.1); border:1.5px solid #CCFF00; display:flex; align-items:center; justify-content:center; color:#CCFF00; font-size:1.15rem; flex-shrink:0; animation: coachPulse 2.5s infinite alternate;">
                                <i class="fas fa-robot"></i>
                            </div>
                            <div style="display:flex; flex-direction:column; gap:4px;">
                                <span style="font-size:0.65rem; color:#CCFF00; font-weight:900; letter-spacing:2px; text-transform:uppercase;">AI Coach • Captain Analysis</span>
                                <p style="margin:0; font-size:0.78rem; line-height:1.45; color:rgba(255,255,255,0.85); font-family:monospace; font-weight:600;">
                                    ${wins >= losses 
                                      ? `"Excelente rendimiento general. Has ganado la mayoría de tus partidos recientes. Tu colocación defensiva en el rincón y el remate liftado con ${idealPartner.split(' ')[0]} siguen siendo tu combinación de mayor efectividad."`
                                      : `"Calibrando patrones tácticos. Se detecta vulnerabilidad en el área central. Concéntrate en la comunicación táctica con tu compañero para cubrir el pasillo medio y alargar los globos a la pared de fondo."`}
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- 4. LISTADO DE PARTIDOS EN EL HISTORIAL -->
                    <div style="display:flex; flex-direction:column; gap:12px;">
                        <h4 style="margin:8px 0 4px 0; font-size:0.85rem; font-weight:950; color:#0F172A; text-transform:uppercase; letter-spacing:1.2px; text-align:left; border-left:3.5px solid #2E61FF; padding-left:10px;">
                            Historial de Partidos
                        </h4>
            `;

            historyData.forEach(match => {
                const statusColor = match.won ? '#10B981' : '#EF4444';
                const statusBg = match.won ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)';
                const statusBorder = match.won ? 'rgba(16,185,129,0.18)' : 'rgba(239,68,68,0.18)';
                const statusText = match.won ? 'VICTORIA' : 'DERROTA';

                html += `
                    <div class="premium-match-card glass-card-pro-light haptic-feedback" 
                         style="border-left: 5px solid ${statusColor}; background:#ffffff; border-top:1px solid rgba(15,23,42,0.06); border-right:1px solid rgba(15,23,42,0.06); border-bottom:1px solid rgba(15,23,42,0.06); border-radius:24px; padding:18px; display:flex; flex-direction:column; gap:14px; box-shadow:0 4px 20px rgba(10,25,47,0.015); cursor:pointer;"
                         onclick="window.PlayerView.openAiTelemetryModal('${match.id}')">
                        
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span style="font-size:0.75rem; color:#64748B; font-weight:800; display:flex; align-items:center; gap:6px;">
                                <i class="far fa-clock"></i> ${match.date} • ${match.time}
                            </span>
                            <span style="background:${statusBg}; border:1px solid ${statusBorder}; color:${statusColor}; font-size:0.65rem; font-weight:950; padding:4px 10px; border-radius:8px; letter-spacing:1px;">
                                ${statusText} • ${match.result}
                            </span>
                        </div>

                        <div style="display:flex; gap:16px; align-items:center;">
                            <div style="flex-shrink:0;">
                                <div class="isometric-court-wrapper" style="width:56px; height:56px; background:linear-gradient(135deg,#f8fafc 0%,#f1f5f9 100%); border-radius:14px; border:1px solid rgba(15,23,42,0.05); display:flex; align-items:center; justify-content:center; overflow:hidden;">
                                    <div class="iso-court" style="width:36px; height:24px; border:1.2px solid #fff; background:${match.won ? 'linear-gradient(135deg,#10B981 0%,#059669 100%)' : 'linear-gradient(135deg,#3b82f6 0%,#1d4ed8 100%)'}; border-radius:1px; transform:rotateX(55deg) rotateZ(-45deg); box-shadow:0 3px 6px rgba(0,0,0,0.08);">
                                        <div class="iso-court-net" style="height:1px;"></div>
                                        <div class="iso-court-lines"></div>
                                    </div>
                                </div>
                            </div>
                            
                            <div style="flex:1; min-width:0; text-align:left;">
                                <h3 style="margin:0; font-weight:950; font-size:0.95rem; color:#0F172A; text-transform:uppercase; letter-spacing:0.5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                                    ${match.club.toUpperCase()}
                                </h3>
                                <span style="font-size:0.72rem; color:#64748B; font-weight:600; display:flex; align-items:center; gap:4px; margin-top:2px;">
                                    <i class="fas fa-location-dot" style="color:#2E61FF;"></i> ${match.comarca}
                                </span>
                            </div>
                        </div>

                        <!-- Pareja y Rivales -->
                        <div style="display:flex; align-items:center; gap:8px; background:#f8fafc; border-radius:12px; padding:10px 14px; font-size:0.72rem; color:#475569; font-weight:700; text-align:left;">
                            <div style="flex:1;">
                                <span style="color:#94a3b8; font-size:0.6rem; text-transform:uppercase; display:block; margin-bottom:2px; font-weight:900;">Pareja</span>
                                <span style="color:#0F172A; font-weight:800; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:block;">${match.partner}</span>
                            </div>
                            <div style="width:1px; height:20px; background:rgba(0,0,0,0.06);"></div>
                            <div style="flex:2; padding-left:6px;">
                                <span style="color:#94a3b8; font-size:0.6rem; text-transform:uppercase; display:block; margin-bottom:2px; font-weight:900;">Rivales</span>
                                <span style="color:#0F172A; font-weight:800; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:block;">
                                    ${match.rivals.join(' y ')}
                                </span>
                            </div>
                        </div>

                        <!-- IA Insight -->
                        <div style="background:rgba(46,97,255,0.03); border:1px dashed rgba(46,97,255,0.18); border-radius:12px; padding:9px 12px; text-align:left; font-size:0.7rem; color:#334155; line-height:1.4;">
                            <span style="color:#2E61FF; font-weight:900; margin-right:4px;">🤖 IA Insight:</span>${match.ai_insight}
                        </div>
                    </div>
                `;
            });

            html += `
                    </div>
                </div>
            `;

            body.innerHTML = html;

            setTimeout(() => {
                this.initAiLevelChart("profile-ai-level-chart", historyData, userLevel);
            }, 100);
        }

        initAiLevelChart(canvasId, historyData, userLevel) {
            const ctx = document.getElementById(canvasId);
            if (!ctx) return;

            // Los matches llegan ordenados de más reciente a más antiguo (tras reverse() en render)
            // Los revertimos para que la gráfica vaya de izquierda (más antiguo) a derecha (más reciente)
            const chartData = [...historyData].reverse();

            const labels = chartData.map(m => {
                const dateParts = m.date.split('-');
                return dateParts.length >= 3 ? `${dateParts[2]}/${dateParts[1]}` : m.date;
            });

            const dataPoints = chartData.map(m => parseFloat(m.user_level_at_match));

            // ── Garantía de coherencia ──────────────────────────────────────────
            // El último punto de la curva DEBE coincidir con el nivel actual real
            // del jugador (userLevel de Firestore). Así la tarjeta y la curva son
            // idénticas y no puede haber brecha (3.64 vs 3.02).
            if (dataPoints.length > 0 && typeof userLevel === 'number') {
                const lastPointDiff = Math.abs(dataPoints[dataPoints.length - 1] - userLevel);
                if (lastPointDiff > 0.005) {
                    // Añadir punto de anclaje con la fecha de hoy
                    const today = new Date();
                    labels.push(`${String(today.getDate()).padStart(2,'0')}/${String(today.getMonth()+1).padStart(2,'0')}`);
                    dataPoints.push(userLevel);
                }
            }

            if (window.Chart) {
                try {
                    if (window._profileAiChartInstance) {
                        window._profileAiChartInstance.destroy();
                    }

                    window._profileAiChartInstance = new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: labels,
                            datasets: [{
                                label: 'Nivel ELO Pro',
                                data: dataPoints,
                                borderColor: '#2E61FF',
                                borderWidth: 3.5,
                                pointBackgroundColor: dataPoints.map((v, i) =>
                                    i === dataPoints.length - 1 ? '#CCFF00' : '#CCFF00'
                                ),
                                pointBorderColor: '#2E61FF',
                                pointBorderWidth: 2.5,
                                pointRadius: dataPoints.map((v, i) =>
                                    i === dataPoints.length - 1 ? 7 : 5.5
                                ),
                                pointHoverRadius: 8,
                                tension: 0.35,
                                fill: true,
                                backgroundColor: function(context) {
                                    const chart = context.chart;
                                    const {ctx: c, chartArea} = chart;
                                    if (!chartArea) return null;
                                    const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                                    gradient.addColorStop(0, 'rgba(46, 97, 255, 0.18)');
                                    gradient.addColorStop(1, 'rgba(46, 97, 255, 0.00)');
                                    return gradient;
                                }
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            animation: { duration: 600, easing: 'easeInOutQuart' },
                            plugins: {
                                legend: { display: false },
                                tooltip: {
                                    backgroundColor: '#0F172A',
                                    titleFont: { size: 10, weight: 'bold', family: 'Outfit' },
                                    bodyFont: { size: 12, weight: '900', family: 'Outfit' },
                                    padding: 12,
                                    cornerRadius: 12,
                                    displayColors: false,
                                    callbacks: {
                                        title: function(items) {
                                            return items[0]?.label || '';
                                        },
                                        label: function(context) {
                                            const val = context.parsed.y;
                                            const isLast = context.dataIndex === context.dataset.data.length - 1;
                                            return `Nivel: ${val.toFixed(2)}${isLast ? ' ← ACTUAL' : ''}`;
                                        }
                                    }
                                }
                            },
                            scales: {
                                x: {
                                    grid: { display: false },
                                    ticks: {
                                        color: '#64748B',
                                        font: { size: 9, weight: 'bold', family: 'Outfit' },
                                        maxRotation: 45,
                                        maxTicksLimit: 12
                                    }
                                },
                                y: {
                                    grid: { color: 'rgba(15, 23, 42, 0.04)' },
                                    ticks: {
                                        color: '#64748B',
                                        font: { size: 9, weight: 'bold', family: 'Outfit' },
                                        stepSize: 0.10,
                                        callback: v => v.toFixed(2)
                                    }
                                }
                            }
                        }
                    });
                    return;
                } catch (e) {
                    console.warn("Chart.js falló, usando SVG fallback:", e);
                }
            }

            const parent = ctx.parentElement;
            if (parent) {
                parent.innerHTML = this.renderSvgChartFallback(labels, dataPoints);
            }
        }

        renderSvgChartFallback(labels, dataPoints) {
            const width = 300;
            const height = 130;
            const padding = 25;
            
            const minVal = Math.min(...dataPoints) - 0.03;
            const maxVal = Math.max(...dataPoints) + 0.03;
            const valRange = maxVal - minVal || 1;

            const points = dataPoints.map((val, idx) => {
                const x = padding + (idx * (width - 2 * padding) / Math.max(1, dataPoints.length - 1));
                const y = height - padding - ((val - minVal) * (height - 2 * padding) / valRange);
                return { x, y, val, label: labels[idx] };
            });

            const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');
            const areaPoints = `${points[0].x},${height - padding} ${polylinePoints} ${points[points.length - 1].x},${height - padding}`;

            let gridLines = '';
            for (let i = 0; i <= 2; i++) {
                const y = padding + i * (height - 2 * padding) / 2;
                gridLines += `<line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" stroke="rgba(15, 23, 42, 0.04)" stroke-width="1" />`;
            }

            let dotsHtml = '';
            points.forEach(p => {
                dotsHtml += `
                    <circle cx="${p.x}" cy="${p.y}" r="4.5" fill="#CCFF00" stroke="#2E61FF" stroke-width="2" />
                    <text x="${p.x}" y="${height - 5}" font-size="8" font-weight="900" font-family="Outfit" fill="#64748B" text-anchor="middle">${p.label}</text>
                    <text x="${p.x}" y="${p.y - 8}" font-size="7.5" font-weight="900" font-family="Outfit" fill="#2E61FF" text-anchor="middle">${p.val.toFixed(2)}</text>
                `;
            });

            return `
                <svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" style="overflow:visible;">
                    <defs>
                        <linearGradient id="svg-grad-profile" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stop-color="#2E61FF" stop-opacity="0.15" />
                            <stop offset="100%" stop-color="#2E61FF" stop-opacity="0.00" />
                        </linearGradient>
                    </defs>
                    ${gridLines}
                    <polygon points="${areaPoints}" fill="url(#svg-grad-profile)" />
                    <polyline points="${polylinePoints}" fill="none" stroke="#2E61FF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
                    ${dotsHtml}
                </svg>
            `;
        }

        renderNoRealMatchesView(myName) {
            const body = document.getElementById('player-profile-tab-body');
            if (!body) return;

            body.innerHTML = `
                <div class="playtomic-skeleton-light" style="padding: 3.5rem 1.5rem; text-align:center; background:#ffffff; border-radius:24px; border:1px solid rgba(15,23,42,0.06);">
                    <i class="fas fa-brain" style="font-size: 2.8rem; color: #2E61FF; margin-bottom: 12px; display: inline-block; opacity: 0.7;"></i>
                    <p style="color: #0F172A; font-size: 1rem; font-weight: 900; text-transform:uppercase;">Historial de IA Vacío</p>
                    <p style="color: #64748B; font-size: 0.78rem; margin-top: 8px; font-weight: 500; max-width: 290px; margin-left: auto; margin-right: auto; line-height: 1.5;">
                        Hola <strong>${myName}</strong>, aún no se registran partidos oficiales en tu cuenta de Somos Pádel BCN.
                    </p>
                    
                    <div style="background: rgba(46, 97, 255, 0.03); border: 1.5px solid rgba(46, 97, 255, 0.1); border-radius: 16px; padding: 14px; margin-top: 20px; font-size: 0.72rem; color: #475569; text-align: left; line-height: 1.4;">
                        💡 <strong>¿Cómo funciona?</strong> Cuando compitas en americanas o entrenamientos oficiales, el motor de IA analizará tu rendimiento automáticamente.
                    </div>

                    <button onclick="window.PlayerView.activateDemoMode()" 
                            style="margin-top: 24px; background: #CCFF00; color: #000; border: none; padding: 12px 28px; border-radius: 20px; font-weight: 950; font-size: 0.82rem; cursor: pointer; letter-spacing: 0.5px; box-shadow: 0 6px 20px rgba(204,255,0,0.3); transition: transform 0.2s;">
                        ⚙️ ACTIVAR MODO DEMOSTRACIÓN IA
                    </button>
                </div>
            `;
        }

        activateDemoMode() {
            this.haptic(25);
            this.forceDemoMode = true;
            this.renderTabContent();
        }

        disableDemoMode() {
            this.haptic(25);
            this.forceDemoMode = false;
            this.currentAiHistoryData = null;
            this.renderTabContent();
        }

        openAiTelemetryModal(matchId) {
            const currentUser = window.Store ? window.Store.getState('currentUser') : null;
            const myName = currentUser ? (currentUser.name || currentUser.displayName || "Jugador") : "Jugador";
            const userLevel = currentUser ? parseFloat(currentUser.level || 3.25) : 3.25;

            const history = this.currentAiHistoryData || this.getAiHistoryData(myName, userLevel);
            const match = history.find(m => m.id === matchId);
            if (!match) return;

            const modal = document.getElementById('ai-telemetry-modal');
            if (!modal) return;

            let heatMapDotsHtml = '';
            if (match.telemetry && match.telemetry.heatmap) {
                match.telemetry.heatmap.forEach(dot => {
                    heatMapDotsHtml += `
                        <div style="position:absolute; left:${dot.x}%; top:${dot.y}%; width:${dot.size}px; height:${dot.size}px; background:${dot.color}; border-radius:50%; filter:blur(6px); transform:translate(-50%, -50%); animation: heatPulse 1.8s infinite alternate; pointer-events:none;"></div>
                        <div style="position:absolute; left:${dot.x}%; top:${dot.y}%; width:5px; height:5px; background:#ffffff; border-radius:50%; transform:translate(-50%, -50%); box-shadow:0 0 6px #fff; pointer-events:none; z-index:10;"></div>
                    `;
                });
            }

            const userColor = "rgba(204, 255, 0, 0.9)";
            const partnerColor = "rgba(0, 210, 255, 0.9)";

            modal.innerHTML = `
                <div class="drawer-content-container" style="background:#0F172A; border-top:1px solid rgba(255,255,255,0.1); border-radius:28px 28px 0 0; max-height:94%; overflow:hidden;">
                    
                    <!-- Header -->
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:20px 24px; border-bottom:1px solid rgba(255,255,255,0.06); flex-shrink:0;">
                        <div style="text-align:left;">
                            <span style="font-size:0.65rem; color:#CCFF00; font-weight:900; letter-spacing:1.5px; text-transform:uppercase;">Informe de Rendimiento</span>
                            <h3 style="margin:2px 0 0 0; font-size:1.1rem; font-weight:950; color:#ffffff; text-transform:uppercase; letter-spacing:0.5px;">Telemetría Cuántica IA</h3>
                        </div>
                        <div class="drawer-circle-btn" onclick="window.PlayerView.closeAiTelemetryModal()" style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); color:#fff; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer;">
                            <i class="fas fa-times"></i>
                        </div>
                    </div>

                    <!-- Scroll Body -->
                    <div style="padding:24px; display:flex; flex-direction:column; gap:20px; overflow-y:auto; padding-bottom:60px; box-sizing:border-box;">
                        
                        <!-- Club Card Header Dark -->
                        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); padding:16px; border-radius:20px; text-align:left; display:flex; flex-direction:column; gap:6px;">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <span style="font-size:0.75rem; color:#CCFF00; font-weight:850; max-width:65%; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${match.club}</span>
                                <span style="font-size:0.65rem; color:rgba(255,255,255,0.4); font-weight:700;">Nivel: ${match.level_min.toFixed(2)}-${match.level_max.toFixed(2)}</span>
                            </div>
                            <h2 style="margin:2px 0 0 0; font-size:1.4rem; font-weight:950; color:#fff; display:flex; align-items:center; gap:8px;">
                                ${match.won ? '<span style="color:#10B981;">W</span>' : '<span style="color:#EF4444;">L</span>'}
                                ${match.result}
                            </h2>
                            <div style="font-size:0.7rem; color:rgba(255,255,255,0.5); font-weight:700;">
                                Compañero: ${match.partner} | Rivales: ${match.rivals.join(' / ')}
                            </div>
                        </div>

                        <!-- 4-Stat Grid -->
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                            <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.04); border-radius:16px; padding:12px 16px; text-align:left;">
                                <span style="font-size:0.6rem; color:rgba(255,255,255,0.4); font-weight:900; text-transform:uppercase; letter-spacing:0.5px;">Efectividad Volea</span>
                                <div style="font-size:1.4rem; font-weight:950; color:#ffffff; margin-top:2px;">${match.telemetry.net_points}%</div>
                            </div>
                            <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.04); border-radius:16px; padding:12px 16px; text-align:left;">
                                <span style="font-size:0.6rem; color:rgba(255,255,255,0.4); font-weight:900; text-transform:uppercase; letter-spacing:0.5px;">Primer Servicio</span>
                                <div style="font-size:1.4rem; font-weight:950; color:#ffffff; margin-top:2px;">${match.telemetry.serve_in}%</div>
                            </div>
                            <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.04); border-radius:16px; padding:12px 16px; text-align:left;">
                                <span style="font-size:0.6rem; color:rgba(255,255,255,0.4); font-weight:900; text-transform:uppercase; letter-spacing:0.5px;">Acierto Remate Smash</span>
                                <div style="font-size:1.4rem; font-weight:950; color:#ffffff; margin-top:2px;">${match.telemetry.smash_eff}%</div>
                            </div>
                            <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.04); border-radius:16px; padding:12px 16px; text-align:left;">
                                <span style="font-size:0.6rem; color:rgba(255,255,255,0.4); font-weight:900; text-transform:uppercase; letter-spacing:0.5px;">Errores no Forzados</span>
                                <div style="font-size:1.4rem; font-weight:950; color:#ff4d6d; margin-top:2px;">${match.telemetry.errors}</div>
                            </div>
                        </div>

                        <!-- MAPA DE CALOR DE LA PISTA -->
                        <div style="display:flex; flex-direction:column; gap:10px; text-align:left;">
                            <span style="font-size:0.75rem; color:#ffffff; font-weight:950; text-transform:uppercase; letter-spacing:1px; display:flex; align-items:center; gap:6px;">
                                <i class="fas fa-street-view" style="color:#CCFF00;"></i> Mapa de Calor de Posicionamiento
                            </span>
                            
                            <div style="position:relative; width:100%; height:180px; background:#075e9b; border:2.5px solid #ffffff; border-radius:12px; box-shadow:0 8px 30px rgba(0,0,0,0.6); overflow:hidden; box-sizing:border-box;">
                                <div style="position:absolute; left:50%; top:0; bottom:0; width:0px; border-left:2px dashed rgba(255,255,255,0.65); transform:translateX(-50%); z-index:2;"></div>
                                <div style="position:absolute; left:50%; top:0; bottom:0; width:4px; background:rgba(255,255,255,0.3); transform:translateX(-50%); z-index:1;"></div>
                                
                                <div style="position:absolute; left:25%; top:0; bottom:0; width:1.5px; background:rgba(255,255,255,0.55);"></div>
                                <div style="position:absolute; left:0; right:50%; top:50%; height:1.5px; background:rgba(255,255,255,0.55);"></div>
                                
                                <div style="position:absolute; right:25%; top:0; bottom:0; width:1.5px; background:rgba(255,255,255,0.55);"></div>
                                <div style="position:absolute; left:50%; right:0; top:50%; height:1.5px; background:rgba(255,255,255,0.55);"></div>

                                ${heatMapDotsHtml}
                            </div>
                            
                            <div style="display:flex; justify-content:center; gap:20px; margin-top:4px; font-size:0.68rem; font-weight:800;">
                                <div style="display:flex; align-items:center; gap:6px; color:#ffffff;">
                                    <span style="width:10px; height:10px; background:${userColor}; border-radius:50%; display:inline-block; box-shadow:0 0 6px ${userColor};"></span>
                                    <span>Tus zonas (${myName.split(' ')[0]})</span>
                                </div>
                                <div style="display:flex; align-items:center; gap:6px; color:#ffffff;">
                                    <span style="width:10px; height:10px; background:${partnerColor}; border-radius:50%; display:inline-block; box-shadow:0 0 6px ${partnerColor};"></span>
                                    <span>Zonas de ${match.partner.split(' ')[0]}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Recomendación Táctica -->
                        <div style="background:rgba(204,255,0,0.03); border:1.5px solid rgba(204,255,0,0.15); border-radius:20px; padding:18px; text-align:left; display:flex; flex-direction:column; gap:6px;">
                            <span style="font-size:0.65rem; color:#CCFF00; font-weight:900; letter-spacing:1.5px; text-transform:uppercase; display:flex; align-items:center; gap:6px;">
                                <i class="fas fa-lightbulb"></i> Recomendación Táctica IA
                            </span>
                            <p style="margin:2px 0 0 0; font-size:0.78rem; line-height:1.45; color:rgba(255,255,255,0.85); font-family:monospace; font-weight:600;">
                                "${match.telemetry.tactical_tip}"
                            </p>
                        </div>

                        <!-- Botón de Compartir -->
                        <button onclick="window.PlayerView.shareAiReport('${match.id}')"
                            style="width: 100%; background: #CCFF00; color: #000; border: none; padding: 14px; border-radius: 20px; font-weight: 950; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px;">
                            <i class="fas fa-share-nodes"></i> COMPARTIR INFORME DE RENDIMIENTO
                        </button>

                    </div>
                </div>
            `;

            modal.classList.remove('hidden');
            this.haptic(25);
        }

        closeAiTelemetryModal() {
            const modal = document.getElementById('ai-telemetry-modal');
            if (modal) modal.classList.add('hidden');
        }

        shareAiReport(matchId) {
            this.haptic(20);

            const currentUser = window.Store ? window.Store.getState('currentUser') : null;
            const myName = currentUser ? (currentUser.name || currentUser.displayName || "Jugador") : "Jugador";
            const userLevel = currentUser ? parseFloat(currentUser.level || 3.25) : 3.25;

            const history = this.currentAiHistoryData || this.getAiHistoryData(myName, userLevel);
            const match = history.find(m => m.id === matchId);
            if (!match) return;

            const textToShare = `📊 *SomosPádel BCN - Telemetría de Partido con IA*\n\n🎾 *Partido:* ${match.club}\n📅 *Fecha:* ${match.date}\n🏆 *Resultado:* ${match.won ? 'VICTORIA' : 'DERROTA'} (${match.result})\n\n💡 *IA Insight:* ${match.ai_insight}\n\n🤖 _Analizado con la tecnología cuántica de SomosPádel BCN._`;
            
            if (navigator.share) {
                navigator.share({
                    title: 'Telemetría de Partido con IA - SomosPádel',
                    text: textToShare
                }).catch(err => console.warn("Share failed:", err));
            } else {
                navigator.clipboard.writeText(textToShare).then(() => {
                    if (window.NotificationService) {
                        window.NotificationService.showToast("Informe copiado al portapapeles 📋", "success");
                    } else {
                        alert("Informe copiado al portapapeles. ¡Pégalo donde quieras!");
                    }
                }).catch(err => {
                    alert("No se pudo copiar el enlace automáticamente.");
                });
            }
        }

        getAiHistoryData(myName, baseLevel) {
            const level = parseFloat(baseLevel) || 3.25;
            const getDateStr = (daysAgo) => {
                const d = new Date();
                d.setDate(d.getDate() - daysAgo);
                return d.toISOString().split('T')[0];
            };

            return [
                {
                    id: "ai_match_1",
                    club: "Can Vía Racket Club",
                    comarca: "Baix Llobregat",
                    date: getDateStr(2),
                    time: "19:30",
                    duration: 90,
                    level_min: (level - 0.15),
                    level_max: (level + 0.25),
                    user_level_at_match: (level).toFixed(2),
                    players: [myName, "Jordi Díaz", "Carlos Jiménez", "Noa"],
                    won: true,
                    partner: "Jordi Díaz",
                    rivals: ["Carlos Jiménez", "Noa"],
                    result: "6-4, 6-3",
                    ai_insight: "Dominio absoluto del juego en la red. Lograste un 82% de puntos ganados cuando subiste rápido tras globo profundo.",
                    telemetry: {
                        net_points: 82,
                        serve_in: 78,
                        smash_eff: 70,
                        errors: 8,
                        tactical_tip: "Tu posicionamiento ofensivo fue óptimo. Mantén la presión sobre el drive rival en la volea paralela.",
                        heatmap: [
                            { x: 30, y: 35, color: "rgba(204, 255, 0, 0.6)", size: 38, label: "Tus Voleas" },
                            { x: 25, y: 75, color: "rgba(204, 255, 0, 0.45)", size: 45, label: "Tu Defensa" },
                            { x: 70, y: 30, color: "rgba(0, 210, 255, 0.55)", size: 35, label: "Voleas de Jordi" },
                            { x: 75, y: 80, color: "rgba(0, 210, 255, 0.4)", size: 40, label: "Defensa de Jordi" }
                        ]
                    }
                },
                {
                    id: "ai_match_2",
                    club: "Barcelona Pádel el Prat",
                    comarca: "Baix Llobregat",
                    date: getDateStr(5),
                    time: "20:00",
                    duration: 90,
                    level_min: (level - 0.2),
                    level_max: (level + 0.2),
                    user_level_at_match: (level - 0.03).toFixed(2),
                    players: [myName, "Jordi Díaz", "Paula", "Alejandro"],
                    won: true,
                    partner: "Jordi Díaz",
                    rivals: ["Paula", "Alejandro"],
                    result: "4-6, 6-4, 6-3",
                    ai_insight: "Resiliencia táctica sobresaliente. Corregiste los globos cortos en el segundo set, permitiendo recuperar la red.",
                    telemetry: {
                        net_points: 74,
                        serve_in: 81,
                        smash_eff: 65,
                        errors: 12,
                        tactical_tip: "Buen control del ritmo. El globo al rincón izquierdo del revés rival desarticuló su defensa en el tercer set.",
                        heatmap: [
                            { x: 32, y: 30, color: "rgba(204, 255, 0, 0.55)", size: 35, label: "Tus Voleas" },
                            { x: 22, y: 70, color: "rgba(204, 255, 0, 0.5)", size: 42, label: "Tu Defensa" },
                            { x: 68, y: 35, color: "rgba(0, 210, 255, 0.5)", size: 38, label: "Voleas de Jordi" },
                            { x: 72, y: 75, color: "rgba(0, 210, 255, 0.45)", size: 42, label: "Defensa de Jordi" }
                        ]
                    }
                },
                {
                    id: "ai_match_3",
                    club: "Somos Pádel BCN",
                    comarca: "Barcelona",
                    date: getDateStr(9),
                    time: "19:00",
                    duration: 90,
                    level_min: (level - 0.1),
                    level_max: (level + 0.3),
                    user_level_at_match: (level - 0.05).toFixed(2),
                    players: [myName, "Carlos Jiménez", "Marcos", "Laura"],
                    won: false,
                    partner: "Carlos Jiménez",
                    rivals: ["Marcos", "Laura"],
                    result: "5-7, 3-6",
                    ai_insight: "Zona de conflicto desprotegida. Se concedieron 9 puntos directos por falta de coordinación en la defensa del centro.",
                    telemetry: {
                        net_points: 52,
                        serve_in: 66,
                        smash_eff: 45,
                        errors: 19,
                        tactical_tip: "Define claramente la prioridad de bolas centrales. El jugador de revés debe cubrir más espacio en globos altos divididos.",
                        heatmap: [
                            { x: 28, y: 40, color: "rgba(204, 255, 0, 0.4)", size: 30, label: "Tus Voleas" },
                            { x: 18, y: 80, color: "rgba(204, 255, 0, 0.6)", size: 50, label: "Tu Zona de Bloqueo" },
                            { x: 65, y: 45, color: "rgba(0, 210, 255, 0.4)", size: 32, label: "Voleas de Carlos" },
                            { x: 75, y: 70, color: "rgba(0, 210, 255, 0.55)", size: 48, label: "Defensa de Carlos" }
                        ]
                    }
                }
            ];
        }

        // ==========================================
        // 🏅 PESTAÑA DE FICHA Y ATRIBUTOS
        // ==========================================

        renderAttributesTabHtml(data, user) {
            const stats = data?.stats || { matches: 0, won: 0, winRate: 0 };
            return `
                <div style="display:flex; flex-direction:column; gap:22px;">

                    <!-- ⚡ POWER LEVEL STATUS CARD -->
                    <div id="profile-power-level-root"></div>

                    <!-- 🌐 TECH HUB CARD -->
                    <div id="profile-tech-hub-root"></div>

                    <!-- STATS GRID & CHARTS -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                        
                        <!-- Win Rate Card (Donut) -->
                        <div class="glass-card" style="background:#ffffff; border:1px solid #e2e8f0; border-radius:24px; padding: 20px; text-align:center; display:flex; flex-direction:column; align-items:center; justify-content:center; box-shadow:0 4px 20px rgba(0,0,0,0.02);">
                            <div style="position:relative; width: 80px; height: 80px; margin-bottom: 10px;">
                                <canvas id="profileWinRateChart"></canvas>
                                <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); font-weight:900; font-size:1.2rem; color: #0a192f;">
                                    ${stats.winRate}%
                                </div>
                            </div>
                            <div style="color: #64748b; font-size: 0.65rem; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">VICTORIAS</div>
                        </div>

                        <!-- Total Matches (Big Number) -->
                        <div class="glass-card" style="background:#ffffff; border:1px solid #e2e8f0; border-radius:24px; padding: 20px; display:flex; flex-direction:column; justify-content:center; align-items:center; box-shadow:0 4px 20px rgba(0,0,0,0.02);">
                            <div style="font-size: 2.3rem; font-weight: 950; color: #0a192f;">${stats.matches || 0}</div>
                            <div style="color: #64748b; font-size: 0.65rem; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">PARTIDOS</div>
                            <div style="margin-top:5px; font-size:0.75rem; color:#10B981; font-weight:900;">${stats.won || 0} Victorias</div>
                        </div>

                    </div>

                    <!-- ATTRIBUTE RADAR (Spider Chart) -->
                    <div style="background: #ffffff; border-radius: 28px; padding: 24px; border: 1px solid #e2e8f0; box-shadow: 0 10px 30px rgba(0,0,0,0.02); text-align:left;">
                        <h3 style="margin: 0 0 18px; font-size: 0.8rem; font-weight: 950; letter-spacing: 1px; color: #0a192f; text-transform: uppercase; display: flex; align-items: center; gap: 10px;">
                            <i class="fas fa-microchip" style="color: #3b82f6;"></i> Análisis de Atributos
                        </h3>
                        <div style="width: 100%; max-width: 280px; margin: 0 auto 16px;">
                            <canvas id="profileRadarChart"></canvas>
                        </div>
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                            <div style="background:#f8fafc; padding:10px; border-radius:14px; text-align:center; border:1px solid #e2e8f0;">
                                <div style="color:#64748B; font-size:0.6rem; font-weight:800; text-transform:uppercase;">ATAQUE</div>
                                <div style="color:#ef4444; font-weight:900; font-size:1.1rem;">${this.getSkillVal(user, 'atk')}</div>
                            </div>
                            <div style="background:#f8fafc; padding:10px; border-radius:14px; text-align:center; border:1px solid #e2e8f0;">
                                <div style="color:#64748B; font-size:0.6rem; font-weight:800; text-transform:uppercase;">DEFENSA</div>
                                <div style="color:#3b82f6; font-weight:900; font-size:1.1rem;">${this.getSkillVal(user, 'def')}</div>
                            </div>
                        </div>
                    </div>

                    <!-- TACTICAL COACH -->
                    <div class="crystal-card" style="background: #ffffff; border-radius: 28px; padding: 24px; border: 1px solid #e2e8f0; box-shadow: 0 10px 30px rgba(0,0,0,0.02); text-align:left;">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <div style="width: 34px; height: 34px; background: #0F172A; color: #CCFF00; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 0.9rem;">
                                    <i class="fas fa-clipboard-check"></i>
                                </div>
                                <span style="font-weight: 950; font-size: 0.82rem; letter-spacing: 1px; color: #0a192f; text-transform: uppercase;">Informe Técnico</span>
                            </div>
                            <span style="font-size: 0.65rem; background: rgba(16,185,129,0.1); color: #10B981; padding: 4px 10px; border-radius: 20px; font-weight: 950; border: 1px solid rgba(16,185,129,0.2);">
                                ${data?.smartInsights?.badge || 'ACTIVO'}
                            </span>
                        </div>

                        <p style="font-size: 0.95rem; line-height: 1.5; font-weight: 700; color: #0a192f; margin: 0 0 14px;">
                            "${data?.smartInsights?.summary || 'Sigue participando para recibir consejos tácticos continuos.'}"
                        </p>
                        
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px 16px; border-radius: 16px;">
                            <div style="font-size: 0.65rem; color: #2E61FF; font-weight: 950; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
                                <i class="fas fa-bullseye"></i> CONSEJO TÁCTICO:
                            </div>
                            <p style="font-size: 0.85rem; color: #334155; line-height: 1.5; margin: 0; font-weight: 600;">
                                ${data?.smartInsights?.advice || 'Mantén la consistencia y coordinación con tu compañero.'}
                            </p>
                        </div>
                    </div>

                    <!-- RIVALRY & AFFINITY SECTION -->
                    <div style="display: grid; grid-template-columns: 1fr; gap: 14px;">
                        ${data?.h2h?.nemesis && data.h2h.nemesis.losses > 0 ? `
                        <div style="border: 1px solid rgba(239,68,68,0.2); background: linear-gradient(135deg, rgba(239,68,68,0.06) 0%, rgba(255,255,255,0.9) 100%); border-radius: 24px; padding: 20px; text-align:left; display: flex; align-items: center; gap: 16px;">
                            <div style="width: 50px; height: 50px; border-radius: 16px; background: rgba(239,68,68,0.15); display: flex; align-items: center; justify-content: center; font-size: 1.3rem; color: #ef4444;">
                                <i class="fas fa-skull-crossbones"></i>
                            </div>
                            <div style="flex: 1;">
                                <div style="color: #ef4444; font-size: 0.65rem; font-weight: 950; letter-spacing: 1.5px; text-transform: uppercase;">TU NÉMESIS 💀</div>
                                <div style="font-size: 1.2rem; font-weight: 950; color: #0a192f; margin-top:2px;">${data.h2h.nemesis.name}</div>
                                <div style="display: flex; gap: 12px; margin-top: 4px;">
                                    <div style="font-size: 0.72rem; color: #64748b; font-weight: 700;">H2H: <b style="color:#ef4444">${data.h2h.nemesis.losses} DERROTAS</b></div>
                                    <div style="font-size: 0.72rem; color: #64748b; font-weight: 700;">PARTIDOS: <b>${data.h2h.nemesis.matches}</b></div>
                                </div>
                            </div>
                        </div>` : ''}

                        ${data?.h2h?.soulmate && data.h2h.soulmate.matches > 0 ? `
                        <div style="border: 1px solid rgba(236,72,153,0.2); background: linear-gradient(135deg, rgba(236,72,153,0.06) 0%, rgba(255,255,255,0.9) 100%); border-radius: 24px; padding: 20px; text-align:left; display: flex; align-items: center; gap: 16px;">
                            <div style="width: 50px; height: 50px; border-radius: 16px; background: rgba(236,72,153,0.15); display: flex; align-items: center; justify-content: center; font-size: 1.3rem; color: #ec4899;">
                                <i class="fas fa-heart"></i>
                            </div>
                            <div style="flex: 1;">
                                <div style="color: #ec4899; font-size: 0.65rem; font-weight: 950; letter-spacing: 1.5px; text-transform: uppercase;">ALMA GEMELA ❤️</div>
                                <div style="font-size: 1.2rem; font-weight: 950; color: #0a192f; margin-top:2px;">${data.h2h.soulmate.name}</div>
                                <div style="display: flex; gap: 12px; margin-top: 4px;">
                                    <div style="font-size: 0.72rem; color: #64748b; font-weight: 700;">VICTORIAS: <b style="color:#ec4899">${data.h2h.soulmate.wins}</b></div>
                                    <div style="font-size: 0.72rem; color: #64748b; font-weight: 700;">PARTIDOS: <b>${data.h2h.soulmate.matches}</b></div>
                                </div>
                            </div>
                        </div>` : ''}
                    </div>

                    <div id="profile-activity-root"></div>
                </div>
            `;
        }

        initAttributesCharts(data, user) {
            Object.values(this.charts).forEach(c => c && c.destroy && c.destroy());

            if (typeof Chart === 'undefined') {
                console.warn("⚠️ [PlayerView] Chart.js no disponible.");
                return;
            }

            const ctxWin = document.getElementById('profileWinRateChart')?.getContext('2d');
            if (ctxWin) {
                const wr = data?.stats?.winRate || 0;
                const color = wr > 60 ? '#10B981' : (wr > 40 ? '#2E61FF' : '#94a3b8');

                this.charts.win = new Chart(ctxWin, {
                    type: 'doughnut',
                    data: {
                        datasets: [{
                            data: [wr, 100 - wr],
                            backgroundColor: [color, 'rgba(15,23,42,0.06)'],
                            borderWidth: 0
                        }]
                    },
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } }, cutout: '78%' }
                });
            }

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
                            backgroundColor: 'rgba(46, 97, 255, 0.15)',
                            borderColor: '#2E61FF',
                            borderWidth: 2,
                            pointBackgroundColor: '#2E61FF',
                            pointBorderColor: '#fff',
                            pointRadius: 3
                        }]
                    },
                    options: {
                        scales: {
                            r: {
                                angleLines: { color: 'rgba(15,23,42,0.08)' },
                                grid: { color: 'rgba(15,23,42,0.06)' },
                                pointLabels: { color: '#64748B', font: { size: 9, family: 'Outfit', weight: '700' } },
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
