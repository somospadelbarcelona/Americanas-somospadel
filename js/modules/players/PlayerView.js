/**
 * PlayerView.js
 * Premium AI-Enhanced Profile View for SomosPadel
 * Updated: 2024 Design System with Glassmorphism and Advanced UX
 */
(function () {
    class PlayerView {
        render() {
            const container = document.getElementById('content-area');
            const user = window.Store.getState('currentUser');
            const data = window.Store.getState('playerStats') || {
                stats: { matches: 0, won: 0, lost: 0, points: 0, winRate: 0, gamesWon: 0 },
                recentMatches: []
            };

            if (!container) return;
            if (!user) {
                container.innerHTML = `<div style="padding:100px; text-align:center; color:white;">
                    <i class="fas fa-spinner fa-spin"></i><br>Cargando sesión...
                </div>`;
                return;
            }

            container.innerHTML = `
                <div class="player-profile-wrapper fade-in" style="background: #000; min-height: 100vh; padding-bottom: 120px; font-family: 'Outfit', sans-serif; color: white;">
                    
                    <!-- Profile Header: Dynamic & Aesthetic -->
                    <div style="background: linear-gradient(180deg, #111 0%, #000 100%); padding: 60px 24px 40px; border-bottom: 1px solid #222; position: relative; overflow: hidden;">
                        <!-- Animated background elements -->
                        <div style="position: absolute; top: -100px; left: -100px; width: 300px; height: 300px; background: radial-gradient(circle, rgba(204,255,0,0.05) 0%, transparent 70%);"></div>
                        <div style="position: absolute; bottom: -50px; right: -50px; width: 250px; height: 250px; background: radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%);"></div>
                        
                        <div style="display: flex; flex-direction: column; align-items: center; text-align: center; position: relative; z-index: 2;">
                            <!-- Avatar with Neon Glow -->
                            <div style="position: relative; margin-bottom: 20px;">
                                <div id="profile-avatar-display" style="width: 110px; height: 110px; border-radius: 35px; background: #222; border: 2px solid #CCFF00; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; font-weight: 950; overflow: hidden; box-shadow: 0 0 30px rgba(204, 255, 0, 0.2);">
                                    ${user.photo_url ? `<img src="${user.photo_url}" style="width:100%; height:100%; object-fit:cover;">` : user.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div onclick="window.PlayerView.showUpdatePhotoPrompt()" style="position: absolute; bottom: -2px; right: -2px; background: #CCFF00; color: black; width: 34px; height: 34px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; cursor: pointer; border: 3px solid #000; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
                                    <i class="fas fa-camera"></i>
                                </div>
                            </div>
                            
                            <h2 style="font-weight: 950; font-size: 1.8rem; margin: 0; text-transform: uppercase; letter-spacing: -0.5px;">${user.name}</h2>
                            <div style="display: flex; gap: 10px; align-items: center; margin-top: 10px;">
                                <span style="background: #CCFF00; color: #000; padding: 4px 14px; border-radius: 20px; font-size: 0.75rem; font-weight: 950;">NIVEL ${parseFloat(user.level || 3.5).toFixed(2)}</span>
                                <span style="background: rgba(255,255,255,0.05); color: #888; padding: 4px 14px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; border: 1px solid #333;">ID: ${(user.id || user.uid || 'PRO').substring(0, 5).toUpperCase()}</span>
                            </div>
                            
                            ${user.role === 'admin_player' || user.role === 'admin' || user.role === 'super_admin' ? `
                                <div style="margin-top: 15px; background: linear-gradient(90deg, #FFD700, #FFA500); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 950; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 2px;">
                                    <i class="fas fa-crown"></i> EXECUTIVE ADMIN
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    <div style="padding: 30px 20px;">
                        <!-- PLAYER ANALYSIS: High-Tech Look -->
                        ${data.aiInsights ? `
                            <div style="margin-bottom: 40px; background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%); border: 1px solid rgba(255,255,255,0.1); border-radius: 30px; padding: 25px; position: relative; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                                <div style="position: absolute; top: -10px; right: -10px; font-size: 6rem; opacity: 0.05; color: #CCFF00; pointer-events: none;"><i class="fas fa-user-shield"></i></div>
                                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px;">
                                    <div style="display: flex; align-items: center; gap: 10px;">
                                        <div style="width: 32px; height: 32px; background: #CCFF00; color: #000; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 0.9rem;"><i class="fas fa-fingerprint"></i></div>
                                        <span style="font-weight: 900; font-size: 0.85rem; letter-spacing: 1px; color: #CCFF00; text-transform: uppercase;">Análisis de Jugador Somospadel</span>
                                    </div>
                                    <span style="font-size: 0.6rem; background: rgba(204,255,0,0.1); color: #CCFF00; padding: 3px 10px; border-radius: 20px; font-weight: 900; border: 1px solid rgba(204,255,0,0.2);">${data.aiInsights.badge || 'PRO'}</span>
                                </div>
                                <p style="font-size: 1.05rem; line-height: 1.6; font-weight: 600; color: #fff; margin: 0 0 20px; font-style: italic;">
                                    "${data.aiInsights.summary}"
                                </p>
                                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                                    ${data.aiInsights.insights.map(ins => `
                                        <div style="background: rgba(255,255,255,0.05); padding: 8px 14px; border-radius: 12px; font-size: 0.7rem; font-weight: 800; display: flex; align-items: center; gap: 6px; border: 1px solid rgba(255,255,255,0.1);">
                                            <span>${ins.icon}</span> <span>${ins.text}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}

                        <!-- PROGRESS & COMMUNITY ANALYSIS -->
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 30px;">
                            <div style="background: rgba(255,255,255,0.03); padding: 18px; border-radius: 24px; border: 1px solid rgba(255,255,255,0.05); text-align: center;">
                                <div style="font-size: 0.65rem; color: #888; text-transform: uppercase; font-weight: 800; margin-bottom: 8px; letter-spacing: 0.5px;">Vs Media Comunidad</div>
                                <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                                    <div style="font-size: 1.4rem; font-weight: 950; color: #CCFF00;">${parseFloat(user.level || 3.5).toFixed(2)}</div>
                                    <div style="width: 1px; height: 15px; background: rgba(255,255,255,0.1);"></div>
                                    <div style="font-size: 1.1rem; font-weight: 700; color: #666;">${parseFloat(data.communityAvg || 3.5).toFixed(2)}</div>
                                </div>
                                <div style="font-size: 0.6rem; color: ${parseFloat(user.level || 3.5) >= parseFloat(data.communityAvg || 3.5) ? '#CCFF00' : '#888'}; margin-top: 8px; font-weight: 900; letter-spacing: 0.5px;">
                                    ${parseFloat(user.level || 3.5) >= parseFloat(data.communityAvg || 3.5) ? 'NIVEL TOP 🔥' : 'SIGUE SUMANDO 💪'}
                                </div>
                            </div>
                            <div style="background: rgba(255,255,255,0.03); padding: 18px; border-radius: 24px; border: 1px solid rgba(255,255,255,0.05); text-align: center;">
                                <div style="font-size: 0.65rem; color: #888; text-transform: uppercase; font-weight: 800; margin-bottom: 8px; letter-spacing: 0.5px;">Nivel de Confianza</div>
                                <div style="height: 5px; background: #222; border-radius: 2px; overflow: hidden; margin: 12px 0 8px;">
                                    <div style="width: ${data.stats.winRate || 50}%; height: 100%; background: #38bdf8; box-shadow: 0 0 10px #38bdf8;"></div>
                                </div>
                                <div style="font-size: 1rem; color: #38bdf8; font-weight: 950;">${data.stats.winRate || 0}% <span style="font-size: 0.6rem; opacity: 0.6;">WR</span></div>
                            </div>
                        </div>

                         <!-- Performance Stats: 2x2 Grid with Glow -->
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px;">
                            <div style="background: linear-gradient(135deg, #111, #0a0a0a); padding: 22px; border-radius: 24px; border: 1px solid #222; text-align: left; position: relative; overflow: hidden;">
                                <div style="color: #64748b; font-size: 0.65rem; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Partidos Totales</div>
                                <div style="font-size: 2.2rem; font-weight: 950; color: #fff;">${data.stats.matches}</div>
                                <i class="fas fa-baseball-ball" style="position: absolute; right: -5px; bottom: -5px; font-size: 2.5rem; opacity: 0.05; color: #fff;"></i>
                            </div>
                            <div style="background: linear-gradient(135deg, #111, #0a0a0a); padding: 22px; border-radius: 24px; border: 1px solid #222; text-align: left; position: relative; overflow: hidden;">
                                <div style="color: #64748b; font-size: 0.65rem; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Ratio Victoria</div>
                                <div style="font-size: 2.2rem; font-weight: 950; color: #CCFF00;">${data.stats.winRate}%</div>
                                <i class="fas fa-chart-pie" style="position: absolute; right: -5px; bottom: -5px; font-size: 2.5rem; opacity: 0.05; color: #CCFF00;"></i>
                            </div>
                        </div>

                        <!-- BADGES SECTION: NEW -->
                        <div style="margin-bottom: 40px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                                <h3 style="margin: 0; font-size: 1rem; font-weight: 950; letter-spacing: 1px; color: #fff; text-transform: uppercase; display: flex; align-items: center; gap: 10px;">
                                    <i class="fas fa-medal" style="color: #CCFF00;"></i> MIS LOGROS
                                </h3>
                                <div style="font-size: 0.6rem; color: #888; font-weight: 800;">${(data.badges || []).length} DESBLOQUEADOS</div>
                            </div>
                            <div style="display: flex; gap: 12px; overflow-x: auto; padding-bottom: 10px; scrollbar-width: none;">
                                ${(data.badges && data.badges.length > 0) ? data.badges.map(b => `
                                    <div style="min-width: 140px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 22px; padding: 20px; text-align: center; border-bottom: 3px solid ${b.color};">
                                        <div style="font-size: 2rem; margin-bottom: 10px;">${b.icon}</div>
                                        <div style="font-weight: 950; font-size: 0.75rem; color: #fff; text-transform: uppercase; margin-bottom: 4px;">${b.title}</div>
                                        <div style="font-size: 0.6rem; color: #666; font-weight: 700;">${b.desc}</div>
                                    </div>
                                `).join('') : `
                                    <div style="width: 100%; border: 1px dashed #333; padding: 20px; border-radius: 22px; text-align: center; color: #555; font-size: 0.75rem; font-weight: 800;">
                                        Sigue jugando para desbloquear insignias
                                    </div>
                                `}
                            </div>
                        </div>

                        <!-- LEVEL EVOLUTION GRAPH: NEW -->
                        <div style="margin-bottom: 40px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 30px; padding: 25px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                                <h3 style="margin: 0; font-size: 0.9rem; font-weight: 950; letter-spacing: 1px; color: #fff; text-transform: uppercase; display: flex; align-items: center; gap: 10px;">
                                    <i class="fas fa-chart-line" style="color: #CCFF00;"></i> EVOLUCIÓN DE NIVEL
                                </h3>
                                <div style="font-size: 0.6rem; color: #888; font-weight: 800;">ÚLTIMAS 10 JORNADAS</div>
                            </div>
                            <div style="height: 180px; width: 100%; position: relative;">
                                <canvas id="levelEvolutionChart"></canvas>
                            </div>
                        </div>

                        <!-- ANÁLISIS SMART DE JUEGO: BIG DATA INSIGHTS -->
                        <div style="margin-bottom: 40px; background: rgba(204,255,0,0.03); border: 1px solid rgba(204,255,0,0.1); border-radius: 30px; padding: 25px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                                <h3 style="margin: 0; font-size: 0.9rem; font-weight: 950; letter-spacing: 1px; color: #fff; text-transform: uppercase; display: flex; align-items: center; gap: 10px;">
                                    <i class="fas fa-brain" style="color: #CCFF00;"></i> ANÁLISIS SMART DE JUEGO
                                </h3>
                                <div style="font-size: 0.6rem; color: #CCFF00; font-weight: 900; background: rgba(204,255,0,0.1); padding: 4px 10px; border-radius: 10px; border: 1px solid rgba(204,255,0,0.2);">IA ANALYTICS</div>
                            </div>

                            <div style="display: grid; gap: 20px;">
                                <!-- Metric 1: Impacto -->
                                ${(() => {
                    const impact = Math.min(98, 40 + (data.stats.points / (data.stats.matches || 1) * 6));
                    const regularity = Math.min(95, 20 + (data.stats.winRate || 50) + (Math.min(data.stats.matches || 0, 20)));
                    const totalGames = (data.stats.gamesWon || 0) + (data.stats.gamesLost || 0);
                    const dominance = totalGames > 0 ? Math.round((data.stats.gamesWon / totalGames) * 100) : 50;

                    return `
                                    <div>
                                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                            <span style="font-size: 0.75rem; color: #fff; font-weight: 800;">EFECTIVIDAD REAL</span>
                                            <span style="font-size: 0.75rem; color: #CCFF00; font-weight: 950;">${Math.round(impact)}%</span>
                                        </div>
                                        <div style="height: 10px; background: rgba(255,255,255,0.05); border-radius: 5px; overflow: hidden;">
                                            <div style="width: ${impact}%; height: 100%; background: linear-gradient(90deg, #CCFF00, #9fcc00); box-shadow: 0 0 15px rgba(204,255,0,0.4);"></div>
                                        </div>
                                        <p style="font-size: 0.65rem; color: #64748b; margin-top: 6px;">Peso real de tu juego en los puntos clave de cada partido.</p>
                                    </div>

                                    <div>
                                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                            <span style="font-size: 0.75rem; color: #fff; font-weight: 800;">CONSISTENCIA</span>
                                            <span style="font-size: 0.75rem; color: #3b82f6; font-weight: 950;">${Math.round(regularity)}%</span>
                                        </div>
                                        <div style="height: 10px; background: rgba(255,255,255,0.05); border-radius: 5px; overflow: hidden;">
                                            <div style="width: ${regularity}%; height: 100%; background: linear-gradient(90deg, #3b82f6, #2dd4bf); box-shadow: 0 0 15px rgba(59,130,246,0.4);"></div>
                                        </div>
                                        <p style="font-size: 0.65rem; color: #64748b; margin-top: 6px;">Capacidad de mantener tu nivel en todas las rondas.</p>
                                    </div>

                                    <div>
                                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                            <span style="font-size: 0.75rem; color: #fff; font-weight: 800;">RATIO DE DOMINIO</span>
                                            <span style="font-size: 0.75rem; color: #f59e0b; font-weight: 950;">${dominance}%</span>
                                        </div>
                                        <div style="height: 10px; background: rgba(255,255,255,0.05); border-radius: 5px; overflow: hidden;">
                                            <div style="width: ${dominance}%; height: 100%; background: linear-gradient(90deg, #f59e0b, #ef4444); box-shadow: 0 0 15px rgba(245,158,11,0.4);"></div>
                                        </div>
                                        <p style="font-size: 0.65rem; color: #64748b; margin-top: 6px;">Efectividad directa en pista (Juegos Ganados vs Perdidos).</p>
                                    </div>
                                    `;
                })()}
                            </div>
                        </div>

                        <!-- Recent Matches Scroll -->
                        <div style="margin-bottom: 40px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding: 0 5px;">
                                <h3 style="margin: 0; font-size: 1.1rem; font-weight: 950; letter-spacing: 1px; color: #fff; text-transform: uppercase; display: flex; align-items: center; gap: 10px;"><i class="fas fa-bolt" style="color: #CCFF00;"></i> Historial Reciente</h3>
                                <span style="font-size: 0.65rem; color: #666; font-weight: 900; background: rgba(255,255,255,0.05); padding: 4px 12px; border-radius: 20px;">TOP 5</span>
                            </div>
                            
                            <div style="display: flex; flex-direction: column; gap: 12px;">
                                ${data.recentMatches.length === 0 ? `
                                    <div style="border: 1px dashed #333; padding: 40px; border-radius: 24px; text-align: center; color: #555; background: rgba(255,255,255,0.01);">
                                        <i class="fas fa-history" style="font-size: 1.8rem; margin-bottom: 12px; opacity: 0.3;"></i>
                                        <p style="font-size: 0.85rem; font-weight: 800; margin: 0;">Aún no has disputado partidos oficiales</p>
                                    </div>
                                ` : data.recentMatches.slice(0, 5).map(m => {
                    const dateStr = (() => {
                        if (!m.date) return '---';
                        if (typeof m.date === 'string' && m.date.includes('/')) return m.date;
                        try {
                            const d = new Date(m.date);
                            if (isNaN(d.getTime())) return '---';
                            return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
                        } catch (e) { return '---'; }
                    })();

                    return `
                                    <div style="background: linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%); padding: 18px 22px; border-radius: 22px; border: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: space-between; position: relative; overflow: hidden;">
                                        <div style="position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: ${m.result === 'W' ? '#CCFF00' : (m.result === 'D' ? '#94a3b8' : '#ef4444')}; opacity: 0.8;"></div>
                                        <div style="flex: 1;">
                                            <div style="font-weight: 900; font-size: 0.95rem; color: #fff; letter-spacing: -0.3px;">${m.eventName.toUpperCase()}</div>
                                            <div style="color: #666; font-size: 0.72rem; font-weight: 800; margin-top: 5px; display: flex; align-items: center; gap: 8px;">
                                                <span style="background: rgba(255,255,255,0.05); padding: 2px 8px; border-radius: 6px;">${dateStr}</span>
                                                <span style="color: #fff; font-weight: 950; font-size: 0.8rem;">${m.score}</span>
                                            </div>
                                        </div>
                                        <div style="background: ${m.result === 'W' ? 'rgba(204,255,0,0.1)' : (m.result === 'D' ? 'rgba(148,163,184,0.1)' : 'rgba(239,68,68,0.1)')}; color: ${m.result === 'W' ? '#CCFF00' : (m.result === 'D' ? '#94a3b8' : '#ef4444')}; width: 44px; height: 44px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-weight: 950; font-size: 1.1rem; border: 1px solid ${m.result === 'W' ? 'rgba(204,255,0,0.2)' : 'rgba(239,68,68,0.2)'}; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
                                            ${m.result}
                                        </div>
                                    </div>
                                    `;
                }).join('')}
                            </div>
                        </div>

                        <!-- HEAD TO HEAD SECTION: NEW -->
                        <div style="margin-bottom: 40px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding: 0 5px;">
                                <h3 style="margin: 0; font-size: 1rem; font-weight: 950; letter-spacing: 1px; color: #fff; text-transform: uppercase; display: flex; align-items: center; gap: 10px;">
                                    <i class="fas fa-handshake" style="color: #CCFF00;"></i> CARA A CARA (H2H)
                                </h3>
                                <span style="font-size: 0.65rem; color: #666; font-weight: 900;">TOP RIVALES</span>
                            </div>
                            
                            <div style="display: grid; gap: 10px;">
                                ${(data.h2h && data.h2h.length > 0) ? data.h2h.map(rival => `
                                    <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 20px; padding: 15px 20px; display: flex; align-items: center; justify-content: space-between;">
                                        <div style="display: flex; align-items: center; gap: 12px;">
                                            <div style="width: 35px; height: 35px; background: #222; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 0.8rem; border: 1px solid #333;">
                                                ${rival.name.substring(0, 1)}
                                            </div>
                                            <div>
                                                <div style="font-weight: 900; font-size: 0.85rem; color: #fff;">Vs ${rival.name}</div>
                                                <div style="font-size: 0.65rem; color: #666; font-weight: 800;">${rival.matches} PARTIDOS DISPUTADOS</div>
                                            </div>
                                        </div>
                                        <div style="text-align: right;">
                                            <div style="font-size: 0.9rem; font-weight: 950; color: #CCFF00;">${rival.wins}W - ${rival.matches - rival.wins}L</div>
                                            <div style="font-size: 0.6rem; color: #444; font-weight: 800;">DOMINANCIA: ${Math.round((rival.wins / rival.matches) * 100)}%</div>
                                        </div>
                                    </div>
                                `).join('') : `
                                    <div style="border: 1px dashed #333; padding: 30px; border-radius: 20px; text-align: center; color: #555; background: rgba(255,255,255,0.01);">
                                        <p style="font-size: 0.75rem; font-weight: 800; margin: 0;">Juega contra otros para ver tu H2H</p>
                                    </div>
                                `}
                            </div>
                        </div>

                        <!-- SOMOSPADEL RULES PRO: REINVENTED -->
                        <div style="margin-bottom: 40px;">
                            <div style="background: linear-gradient(90deg, #CCFF00, #9fcc00); height: 2px; width: 40px; margin-bottom: 20px;"></div>
                            <h3 style="margin: 0 0 25px; font-size: 1.2rem; font-weight: 950; letter-spacing: -0.5px; color: #fff; text-transform: uppercase; display: flex; align-items: center; gap: 12px;">
                                <i class="fas fa-shield-virus" style="color: #CCFF00; font-size: 1.4rem;"></i> Normativa <span style="color: #CCFF00;">Elite</span>
                            </h3>

                            <div style="display: grid; gap: 15px;">
                                <!-- MVP SYSTEM CARD -->
                                <div style="background: rgba(255,255,255,0.03); padding: 25px; border-radius: 28px; border: 1px solid rgba(255,255,255,0.08); position: relative; overflow: hidden; transition: all 0.3s ease;">
                                    <div style="position: absolute; right: -15px; top: -15px; font-size: 5rem; opacity: 0.03; color: #fff;"><i class="fas fa-star"></i></div>
                                    <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 12px;">
                                        <div style="width: 40px; height: 40px; background: rgba(204,255,0,0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #CCFF00; font-size: 1.1rem; border: 1px solid rgba(204,255,0,0.2);">
                                            <i class="fas fa-star"></i>
                                        </div>
                                        <span style="font-weight: 900; font-size: 0.95rem; color: #fff; text-transform: uppercase;">Sistema de Puntuación MVP</span>
                                    </div>
                                    <p style="font-size: 0.8rem; color: #aaa; line-height: 1.6; margin: 0; font-weight: 500;">
                                        Cada victoria en el circuito equivale a <b style="color: #fff;">3 puntos</b> y cada empate a <b style="color: #fff;">1 punto</b> para tu ranking. En SomosPadel, cada batalla cuenta para escalar posiciones.
                                    </p>
                                </div>

                                <!-- ALGORITHM DETAILED BREAKDOWN -->
                                <div style="background: linear-gradient(135deg, rgba(204,255,0,0.05) 0%, rgba(0,0,0,0) 100%); padding: 25px; border-radius: 28px; border: 1px solid rgba(204,255,0,0.2); position: relative; overflow: hidden;">
                                    <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                                        <div style="width: 40px; height: 40px; background: #CCFF00; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #000; font-size: 1.1rem; box-shadow: 0 0 15px rgba(204,255,0,0.3);">
                                            <i class="fas fa-microchip"></i>
                                        </div>
                                        <span style="font-weight: 900; font-size: 0.95rem; color: #fff; text-transform: uppercase;">Algoritmo Inteligente de Nivel</span>
                                    </div>

                                    <div style="background: rgba(0,0,0,0.3); border-radius: 20px; padding: 18px; margin-bottom: 15px;">
                                        <div style="font-size: 0.75rem; color: #CCFF00; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; display: flex; justify-content: space-between;">
                                            <span>¿Cómo sube o baja mi nivel?</span>
                                            <span>DIÁNAMICO</span>
                                        </div>
                                        <p style="font-size: 0.8rem; color: #ddd; line-height: 1.6; margin: 0 0 15px;">
                                            Tu nivel no es estático. Se ajusta por <b style="color: #fff;">milésimas (0.005 - 0.010)</b> tras cada jornada oficial basándose en:
                                        </p>
                                        
                                        <!-- Ponderación visual -->
                                        <div style="display: flex; flex-direction: column; gap: 10px;">
                                            <div style="display: flex; align-items: center; gap: 10px;">
                                                <div style="flex: 1; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;">
                                                    <div style="width: 60%; height: 100%; background: #CCFF00;"></div>
                                                </div>
                                                <span style="font-size: 0.65rem; font-weight: 900; color: #fff; width: 100px;">60% PERFORMANCE</span>
                                            </div>
                                            <div style="display: flex; align-items: center; gap: 10px;">
                                                <div style="flex: 1; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;">
                                                    <div style="width: 40%; height: 100%; background: #3b82f6;"></div>
                                                </div>
                                                <span style="font-size: 0.65rem; font-weight: 900; color: #fff; width: 100px;">40% DIFICULTAD</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                        <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 15px; border: 1px solid rgba(255,255,255,0.05);">
                                            <div style="font-size: 0.65rem; color: #22c55e; font-weight: 900; margin-bottom: 5px;"><i class="fas fa-arrow-up"></i> SUBES DÉCIMAS</div>
                                            <div style="font-size: 0.6rem; color: #888; line-height: 1.4;">Victorias contra rivales de nivel superior o Win Rate > 65%.</div>
                                        </div>
                                        <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 15px; border: 1px solid rgba(255,255,255,0.05);">
                                            <div style="font-size: 0.65rem; color: #ef4444; font-weight: 900; margin-bottom: 5px;"><i class="fas fa-arrow-down"></i> BAJAS DÉCIMAS</div>
                                            <div style="font-size: 0.6rem; color: #888; line-height: 1.4;">Derrotas contra niveles inferiores o rendimiento inconsistente.</div>
                                        </div>
                                    </div>

                                    <div style="margin-top: 20px; padding: 12px; background: rgba(204,255,0,0.1); border-radius: 15px; border: 1px dashed rgba(204,255,0,0.3); font-size: 0.7rem; color: #CCFF00; font-weight: 700; text-align: center;">
                                        <i class="fas fa-info-circle"></i> Ajuste automático para garantizar grupos equilibrados.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                        <!-- SETTINGS & AUTH: Glass Edition -->
                        <div style="background: rgba(255,255,255,0.03); border-radius: 28px; border: 1px solid rgba(255,255,255,0.08); overflow: hidden; margin-top: 20px;">
                            <div onclick="window.PlayerView.showUpdatePasswordPrompt()" style="display: flex; align-items: center; padding: 22px; border-bottom: 1px solid rgba(255,255,255,0.05); cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
                                <div style="width: 44px; height: 44px; background: rgba(59,130,246,0.1); color: #3b82f6; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; border: 1px solid rgba(59,130,246,0.2);"><i class="fas fa-key"></i></div>
                                <div style="flex: 1; margin-left: 18px;">
                                    <div style="font-weight: 900; font-size: 0.95rem; color: #fff;">Contraseña Segura</div>
                                    <div style="font-size: 0.7rem; color: #666; font-weight: 800; letter-spacing: 0.5px;">ACTUALIZAR CREDENCIALES</div>
                                </div>
                                <i class="fas fa-chevron-right" style="color: #444; font-size: 0.8rem;"></i>
                            </div>
                            <div onclick="window.AuthService.logout()" style="display: flex; align-items: center; padding: 22px; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,59,48,0.05)'" onmouseout="this.style.background='transparent'">
                                <div style="width: 44px; height: 44px; background: rgba(255,59,48,0.1); color: #FF3B30; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; border: 1px solid rgba(255,59,48,0.2);"><i class="fas fa-power-off"></i></div>
                                <div style="flex: 1; margin-left: 18px;">
                                    <div style="font-weight: 900; font-size: 0.95rem; color: #FF3B30;">Cerrar Sesión</div>
                                    <div style="font-size: 0.7rem; color: #666; font-weight: 800; letter-spacing: 0.5px;">SALIR DE LA APLICACIÓN</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <input type="file" id="profile-photo-input" accept="image/*" style="display: none;" onchange="window.PlayerView.handlePhotoSelection(this)">
            `;

            // 🔥 INITIALIZE CHART AFTER RENDER
            this.initLevelChart(data.levelHistory || []);
        }

        initLevelChart(history) {
            // Use setTimeout to ensure DOM is ready
            setTimeout(() => {
                const canvas = document.getElementById('levelEvolutionChart');
                if (!canvas || !window.Chart) return;

                // Prepare data: last 10 points
                const dataPoints = history.slice(-10);
                const levels = dataPoints.map(h => h.level);
                const labels = dataPoints.map((h, i) => `J${i + 1}`);

                // Simple adaptive Y axis
                const minLevel = levels.length > 0 ? Math.max(0, Math.min(...levels) - 0.2) : 3.0;
                const maxLevel = levels.length > 0 ? Math.min(7.5, Math.max(...levels) + 0.2) : 4.0;

                new Chart(canvas, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Nivel',
                            data: levels,
                            borderColor: '#CCFF00',
                            backgroundColor: 'rgba(204, 255, 0, 0.1)',
                            borderWidth: 3,
                            pointBackgroundColor: '#CCFF00',
                            pointBorderColor: '#000',
                            pointBorderWidth: 2,
                            pointRadius: 4,
                            tension: 0.4,
                            fill: true
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                backgroundColor: '#111',
                                titleColor: '#888',
                                bodyColor: '#fff',
                                padding: 10,
                                displayColors: false,
                                callbacks: {
                                    label: (context) => ` Nivel: ${context.parsed.y.toFixed(2)}`
                                }
                            }
                        },
                        scales: {
                            x: {
                                grid: { display: false },
                                ticks: { color: '#666', font: { size: 10 } }
                            },
                            y: {
                                min: minLevel,
                                max: maxLevel,
                                grid: { color: 'rgba(255,255,255,0.05)' },
                                ticks: {
                                    color: '#666',
                                    font: { size: 10 },
                                    callback: (value) => value.toFixed(1)
                                }
                            }
                        }
                    }
                });
            }, 50);
        }

        async handlePhotoSelection(input) {
            if (!input.files || !input.files[0]) return;
            const file = input.files[0];
            try {
                const avatar = document.getElementById('profile-avatar-display');
                if (avatar) avatar.innerHTML = '<i class="fas fa-spinner fa-spin" style="color:#CCFF00;"></i>';
                const optimizedBase64 = await this.compressImage(file);
                const res = await window.PlayerController.updatePhoto(optimizedBase64);
                if (!res.success) alert("Error: " + res.error);
            } catch (error) {
                console.error("Photo Selection Error:", error);
                alert("Error al procesar la imagen.");
            }
        }

        compressImage(file) {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const size = 400;
                        canvas.width = size;
                        canvas.height = size;
                        const ctx = canvas.getContext('2d');

                        // Square crop
                        const minDim = Math.min(img.width, img.height);
                        const startX = (img.width - minDim) / 2;
                        const startY = (img.height - minDim) / 2;
                        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);

                        resolve(canvas.toDataURL('image/jpeg', 0.8));
                    };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            });
        }

        showUpdatePhotoPrompt() {
            document.getElementById('profile-photo-input').click();
        }

        async showUpdatePasswordPrompt() {
            const pass = prompt("Introduce tu nueva contraseña:");
            if (pass && pass.length >= 6) {
                const res = await window.PlayerController.updatePassword(pass);
                if (res.success) alert("Contraseña actualizada correctamente 🔐");
                else alert("Error: " + res.error);
            } else if (pass) alert("Mínimo 6 caracteres.");
        }
    }

    window.PlayerView = new PlayerView();
    console.log("🏆 Premium PlayerView v2 (Dark Mode Elite) Initialized");
})();
