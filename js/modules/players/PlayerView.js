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

            if (!container || !user) return;

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
                                <span style="background: rgba(255,255,255,0.05); color: #888; padding: 4px 14px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; border: 1px solid #333;">ID: ${user.id.substring(0, 5).toUpperCase()}</span>
                            </div>
                            
                            ${user.role === 'admin_player' || user.role === 'admin' ? `
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
                                
                                <!-- New Skills Radar Concept -->
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
                                    <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 15px; border: 1px solid rgba(255,255,255,0.05); text-align: center;">
                                        <div style="font-size: 0.6rem; color: #888; text-transform: uppercase; font-weight: 800; margin-bottom: 5px;">Potencial</div>
                                        <div style="height: 4px; background: #222; border-radius: 2px; overflow: hidden; margin-top: 5px;">
                                            <div style="width: ${Math.min(100, Math.round((user.level / 7) * 100)) || 50}%; height: 100%; background: #CCFF00; box-shadow: 0 0 10px #CCFF00;"></div>
                                        </div>
                                    </div>
                                    <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 15px; border: 1px solid rgba(255,255,255,0.05); text-align: center;">
                                        <div style="font-size: 0.6rem; color: #888; text-transform: uppercase; font-weight: 800; margin-bottom: 5px;">Confianza</div>
                                        <div style="height: 4px; background: #222; border-radius: 2px; overflow: hidden; margin-top: 5px;">
                                            <div style="width: ${data.stats.winRate || 50}%; height: 100%; background: #38bdf8; box-shadow: 0 0 10px #38bdf8;"></div>
                                        </div>
                                    </div>
                                </div>

                                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                                    ${data.aiInsights.insights.map(ins => `
                                        <div style="background: rgba(255,255,255,0.05); padding: 8px 14px; border-radius: 12px; font-size: 0.7rem; font-weight: 800; display: flex; align-items: center; gap: 6px; border: 1px solid rgba(255,255,255,0.1);">
                                            <span>${ins.icon}</span> <span>${ins.text}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}

                        <!-- Performance Stats: 2x2 Grid with Glow -->
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 40px;">
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
                            <div style="background: linear-gradient(135deg, #111, #0a0a0a); padding: 22px; border-radius: 24px; border: 1px solid #222; text-align: left; position: relative; overflow: hidden;">
                                <div style="color: #64748b; font-size: 0.65rem; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Juegos Ganados</div>
                                <div style="font-size: 2.2rem; font-weight: 950; color: #fff;">${data.stats.gamesWon}</div>
                                <i class="fas fa-trophy" style="position: absolute; right: -5px; bottom: -5px; font-size: 2.5rem; opacity: 0.05; color: #fff;"></i>
                            </div>
                            <div style="background: linear-gradient(135deg, #111, #0a0a0a); padding: 22px; border-radius: 24px; border: 1px solid #222; text-align: left; position: relative; overflow: hidden;">
                                <div style="color: #64748b; font-size: 0.65rem; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Puntos Acumulados</div>
                                <div style="font-size: 2.2rem; font-weight: 950; color: #CCFF00;">${data.stats.points}</div>
                                <i class="fas fa-star" style="position: absolute; right: -5px; bottom: -5px; font-size: 2.5rem; opacity: 0.05; color: #CCFF00;"></i>
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

                        <!-- SOMOSPADEL RULES PRO -->
                        <div style="margin-bottom: 20px;">
                            <h3 style="margin: 0 0 20px; font-size: 1rem; font-weight: 950; letter-spacing: 1px; color: #CCFF00; text-transform: uppercase; display: flex; align-items: center; gap: 10px;"><i class="fas fa-shield-alt"></i> Normativa Elite</h3>
                            <div style="display: grid; gap: 12px;">
                                <div style="background: #0a0a0a; padding: 20px; border-radius: 24px; border: 1px solid #1a1a1a; display: flex; align-items: flex-start; gap: 15px;">
                                    <div style="width: 36px; height: 36px; background: rgba(255,215,0,0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #FFD700; flex-shrink: 0;"><i class="fas fa-star"></i></div>
                                    <div>
                                        <div style="font-weight: 900; color: #fff; margin-bottom: 4px; font-size: 0.85rem;">Sistema de Puntuación MVP</div>
                                        <p style="font-size: 0.72rem; color: #666; line-height: 1.6; margin: 0;">Cada juego ganado en pista equivale a 1 punto para tu ranking personal. Maximizas tu puntuación aunque pierdas el set.</p>
                                    </div>
                                </div>
                                <div style="background: #0a0a0a; padding: 20px; border-radius: 24px; border: 1px solid #1a1a1a; display: flex; align-items: flex-start; gap: 15px;">
                                    <div style="width: 36px; height: 36px; background: rgba(59,130,246,0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #3b82f6; flex-shrink: 0;"><i class="fas fa-microchip"></i></div>
                                    <div>
                                        <div style="font-weight: 900; color: #fff; margin-bottom: 4px; font-size: 0.85rem;">Algoritmo de Nivel Pro</div>
                                        <p style="font-size: 0.72rem; color: #666; line-height: 1.6; margin: 0;">Tu nivel se ajusta por décimas basándose en el Win Rate y la dificultad de los rivales enfrentados en cada jornada.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                                    <p style="font-size: 0.75rem; color: #888; line-height: 1.5; margin: 0;">Tu nivel se ajusta dinámicamente tras cada partido oficial para garantizar grupos equilibrados.</p>
                                </div>
                            </div>
                        </div>

                        <!-- SETTINGS & AUTH -->
                        <div style="background: #111; border-radius: 24px; border: 1px solid #222; overflow: hidden;">
                            <div onclick="window.PlayerView.showUpdatePasswordPrompt()" style="display: flex; align-items: center; padding: 20px; border-bottom: 1px solid #222; cursor: pointer;">
                                <div style="width: 44px; height: 44px; background: rgba(59,130,246,0.1); color: #3b82f6; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem;"><i class="fas fa-key"></i></div>
                                <div style="flex: 1; margin-left: 15px;">
                                    <div style="font-weight: 900; font-size: 0.95rem;">Contraseña Segura</div>
                                    <div style="font-size: 0.7rem; color: #666; font-weight: 700;">ACTUALIZAR CREDENCIALES</div>
                                </div>
                                <i class="fas fa-chevron-right" style="color: #444; font-size: 0.8rem;"></i>
                            </div>
                            <div onclick="window.AuthService.logout()" style="display: flex; align-items: center; padding: 20px; cursor: pointer;">
                                <div style="width: 44px; height: 44px; background: rgba(255,59,48,0.1); color: #FF3B30; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem;"><i class="fas fa-power-off"></i></div>
                                <div style="flex: 1; margin-left: 15px;">
                                    <div style="font-weight: 900; font-size: 0.95rem; color: #FF3B30;">Cerrar Sesión</div>
                                    <div style="font-size: 0.7rem; color: #666; font-weight: 700;">SALIR DE LA APLICACIÓN</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <input type="file" id="profile-photo-input" accept="image/*" style="display: none;" onchange="window.PlayerView.handlePhotoSelection(this)">
            `;
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
