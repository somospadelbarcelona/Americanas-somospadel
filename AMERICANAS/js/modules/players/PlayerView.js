/**
 * PlayerView.js
 * Premium AI-Enhanced Profile View for SomosPadel
 */
(function () {
    class PlayerView {
        render() {
            const container = document.getElementById('content-area');
            const user = window.Store.getState('currentUser');
            const data = window.Store.getState('playerStats') || { stats: { matches: 0, won: 0, lost: 0, points: 0, winRate: 0 }, recentMatches: [] };

            if (!container || !user) return;

            container.innerHTML = `
                <div class="player-profile-wrapper fade-in" style="background: #f8faff; min-height: 100vh; padding-bottom: 120px; font-family: 'Outfit', sans-serif;">
                    
                    <!-- Profile Header -->
                    <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 40px 24px 80px; color: white; border-bottom-left-radius: 40px; border-bottom-right-radius: 40px; position: relative; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                        <div style="position: absolute; top: -20px; right: -20px; font-size: 8rem; opacity: 0.05; color: white;">👤</div>
                        
                        <div style="display: flex; align-items: center; gap: 20px; position: relative; z-index: 2;">
                            <div style="position: relative;">
                                <div id="profile-avatar-display" style="width: 85px; height: 85px; border-radius: 25px; background: #3b82f6; border: 3px solid #CCFF00; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 800; overflow: hidden; box-shadow: 0 8px 20px rgba(204, 255, 0, 0.2);">
                                    ${user.photo_url ? `<img src="${user.photo_url}" style="width:100%; height:100%; object-fit:cover;">` : user.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div onclick="window.PlayerView.showUpdatePhotoPrompt()" style="position: absolute; bottom: -5px; right: -5px; background: #CCFF00; color: black; width: 30px; height: 30px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; cursor: pointer; border: 3px solid #0f172a;">
                                    <i class="fas fa-camera"></i>
                                </div>
                            </div>
                            
                            <div>
                                <h2 style="font-weight: 800; font-size: 1.6rem; margin: 0;">${user.name}</h2>
                                <div style="display: flex; gap: 8px; align-items: center; margin-top: 5px;">
                                    <span style="background: rgba(255,255,255,0.1); padding: 4px 10px; border-radius: 10px; font-size: 0.7rem; font-weight: 700; color: #CCFF00;">NIVEL ${parseFloat(user.level || 3.5).toFixed(2)}</span>
                                    <span style="color: rgba(255,255,255,0.6); font-size: 0.7rem; font-weight: 600;">SOCIO #${user.id.substring(0, 5).toUpperCase()}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Level Progress Bar -->
                        <div style="margin-top: 25px; position: relative; z-index: 2;">
                            <div style="display: flex; justify-content: space-between; font-size: 0.65rem; color: rgba(255,255,255,0.5); font-weight: 700; margin-bottom: 8px; text-transform: uppercase;">
                                <span>Progreso de Nivel</span>
                                <span>Próximo: ${(parseFloat(user.level || 3.5) + 0.25).toFixed(2)}</span>
                            </div>
                            <div style="height: 6px; background: rgba(255,255,255,0.1); border-radius: 10px; overflow: hidden;">
                                <div style="width: 65%; height: 100%; background: #CCFF00; box-shadow: 0 0 10px #CCFF00;"></div>
                            </div>
                        </div>
                    </div>

                    <!-- General Statistics Section -->
                    <div style="padding: 30px 20px 0;">
                        <h3 style="font-weight: 800; font-size: 1.1rem; color: #1e293b; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
                            <span style="color: #3b82f6;">🏆</span> ESTADÍSTICAS TEMPORADA
                        </h3>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            <!-- Games Stats -->
                            <div style="background: white; padding: 20px; border-radius: 24px; box-shadow: 0 8px 25px rgba(0,0,0,0.03); border: 1px solid #eee; display: flex; flex-direction: column; align-items: center; text-align: center;">
                                <div style="width: 40px; height: 40px; background: #eef2ff; color: #6366f1; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; font-size: 1.2rem;">
                                    <i class="fas fa-table-tennis"></i>
                                </div>
                                <div style="font-size: 1.5rem; font-weight: 900; color: #1e293b;">${data.stats.gamesWon}</div>
                                <div style="font-size: 0.65rem; color: #94a3b8; font-weight: 800; text-transform: uppercase; margin-top: 4px;">Juegos Ganados</div>
                            </div>

                            <!-- Win Rate Stats -->
                            <div style="background: white; padding: 20px; border-radius: 24px; box-shadow: 0 8px 25px rgba(0,0,0,0.03); border: 1px solid #eee; display: flex; flex-direction: column; align-items: center; text-align: center;">
                                <div style="width: 40px; height: 40px; background: #ecfdf5; color: #10b981; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; font-size: 1.2rem;">
                                    <i class="fas fa-percentage"></i>
                                </div>
                                <div style="font-size: 1.5rem; font-weight: 900; color: #1e293b;">${data.stats.winRate}%</div>
                                <div style="font-size: 0.65rem; color: #94a3b8; font-weight: 800; text-transform: uppercase; margin-top: 4px;">Eficacia (WR)</div>
                            </div>

                            <!-- Points Stats -->
                            <div style="background: white; padding: 20px; border-radius: 24px; box-shadow: 0 8px 25px rgba(0,0,0,0.03); border: 1px solid #eee; display: flex; flex-direction: column; align-items: center; text-align: center;">
                                <div style="width: 40px; height: 40px; background: #fffbeb; color: #f59e0b; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; font-size: 1.2rem;">
                                    <i class="fas fa-star"></i>
                                </div>
                                <div style="font-size: 1.5rem; font-weight: 900; color: #1e293b;">${data.stats.points}</div>
                                <div style="font-size: 0.65rem; color: #94a3b8; font-weight: 800; text-transform: uppercase; margin-top: 4px;">Puntos Totales</div>
                            </div>

                            <!-- Played Stats -->
                            <div style="background: white; padding: 20px; border-radius: 24px; box-shadow: 0 8px 25px rgba(0,0,0,0.03); border: 1px solid #eee; display: flex; flex-direction: column; align-items: center; text-align: center;">
                                <div style="width: 40px; height: 40px; background: #fff1f2; color: #f43f5e; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; font-size: 1.2rem;">
                                    <i class="fas fa-calendar-alt"></i>
                                </div>
                                <div style="font-size: 1.5rem; font-weight: 900; color: #1e293b;">${data.stats.matches}</div>
                                <div style="font-size: 0.65rem; color: #94a3b8; font-weight: 800; text-transform: uppercase; margin-top: 4px;">Partidos</div>
                            </div>
                        </div>
                    </div>

                    <!-- AI Statistics & Match Summary -->
                    ${data.aiInsights ? `
                    <div style="padding: 30px 20px 0;">
                        <h3 style="font-weight: 800; font-size: 1.1rem; color: #1e293b; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
                            <span style="color: #8b5cf6;">🤖</span> RESUMEN POR IA
                        </h3>
                        
                        <div style="background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); padding: 25px; border-radius: 30px; color: white; position: relative; overflow: hidden; box-shadow: 0 15px 35px rgba(99, 102, 241, 0.2);">
                            <div style="position: absolute; top: -10px; right: -10px; font-size: 5rem; opacity: 0.1;"><i class="fas fa-brain"></i></div>
                            
                            <div style="display: inline-block; background: rgba(255,255,255,0.2); padding: 5px 12px; border-radius: 10px; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; margin-bottom: 15px; border: 1px solid rgba(255,255,255,0.3);">
                                ${data.aiInsights.badge}
                            </div>
                            
                            <p style="font-size: 0.95rem; line-height: 1.5; font-weight: 600; margin: 0; position: relative; z-index: 2;">
                                "${data.aiInsights.summary}"
                            </p>
                            
                            <div style="margin-top: 20px; display: flex; flex-wrap: wrap; gap: 10px; position: relative; z-index: 2;">
                                ${data.aiInsights.insights.map(ins => `
                                    <div style="background: rgba(255,255,255,0.1); padding: 8px 15px; border-radius: 12px; font-size: 0.75rem; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                                        <span>${ins.icon}</span>
                                        <span>${ins.text}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                    ` : ''}

                    <!-- Performance Trends -->
                    <div style="padding: 30px 20px 0;">
                        <h3 style="font-weight: 800; font-size: 1.1rem; color: #1e293b; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
                            <span style="color: #3b82f6;">📊</span> ÚLTIMOS PARTIDOS
                        </h3>
                        
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            ${data.recentMatches.length === 0 ? `
                                <div style="background: white; border-radius: 20px; padding: 30px; text-align: center; border: 1px dashed #cbd5e1; color: #94a3b8;">
                                    <i class="fas fa-ghost" style="font-size: 2rem; margin-bottom: 10px; opacity: 0.5;"></i>
                                    <p style="font-size: 0.85rem; font-weight: 600;">Aún no has disputado partidos oficiales</p>
                                </div>
                            ` : data.recentMatches.map(m => `
                                <div style="background: white; padding: 15px 20px; border-radius: 20px; border: 1px solid #eee; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 4px 15px rgba(0,0,0,0.02);">
                                    <div>
                                        <div style="font-weight: 800; font-size: 0.9rem; color: #1e293b;">${m.eventName}</div>
                                        <div style="color: #94a3b8; font-size: 0.7rem; font-weight: 600; margin-top: 2px;">${new Date(m.date).toLocaleDateString()} · ${m.score}</div>
                                    </div>
                                    <div style="background: ${m.color}15; color: ${m.color}; width: 35px; height: 35px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 0.9rem; border: 1px solid ${m.color}30;">
                                        ${m.result}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- NORMATIVA Y INFO (New Section) -->
                    <div style="padding: 40px 20px 0;">
                        <h3 style="font-weight: 800; font-size: 1.1rem; color: #1e293b; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
                            <span style="color: #007AFF;">⚖️</span> NORMATIVA Y REGLAS
                        </h3>
                        
                        <div style="display: grid; gap: 15px;">
                            <!-- Ranking -->
                            <div style="background: white; padding: 20px; border-radius: 20px; border: 1px solid #eee; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
                                <div style="font-weight: 800; margin-bottom: 10px; color: #1e293b; font-size: 0.9rem; display: flex; align-items: center; gap: 8px;">
                                    <i class="fas fa-trophy" style="color: #FFD700;"></i> Sistema de Ranking
                                </div>
                                <p style="font-size: 0.75rem; color: #64748b; line-height: 1.5; margin: 0;">
                                    Cada juego ganado en tus Americanas suma <b>1 punto</b> directo a tu perfil. El MVP se decide por la suma total de puntos tras 6 rondas.
                                </p>
                            </div>

                            <!-- Levels -->
                            <div style="background: white; padding: 20px; border-radius: 20px; border: 1px solid #eee; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
                                <div style="font-weight: 800; margin-bottom: 10px; color: #1e293b; font-size: 0.9rem; display: flex; align-items: center; gap: 8px;">
                                    <i class="fas fa-chart-line" style="color: #10b981;"></i> Evolución de Nivel
                                </div>
                                <p style="font-size: 0.75rem; color: #64748b; line-height: 1.5; margin: 0;">
                                    Tu nivel sube o baja por <b>décimas</b> según ganes o pierdas partidos. El algoritmo tiene en cuenta el nivel de tus oponentes para un ajuste justo.
                                </p>
                            </div>

                            <!-- Comportamiento -->
                            <div style="background: white; padding: 20px; border-radius: 20px; border: 1px solid #eee; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
                                <div style="font-weight: 800; margin-bottom: 10px; color: #1e293b; font-size: 0.9rem; display: flex; align-items: center; gap: 8px;">
                                    <i class="fas fa-handshake" style="color: #3b82f6;"></i> Fair Play
                                </div>
                                <p style="font-size: 0.75rem; color: #64748b; line-height: 1.5; margin: 0;">
                                    Somos una comunidad. Respeta a compañeros y rivales. Los resultados son gestionados por los <b>administradores</b> para garantizar la transparencia.
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- General Settings -->
                    <div style="padding: 30px 20px 0;">
                        <h3 style="font-weight: 800; font-size: 1.1rem; color: #1e293b; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
                            <span style="color: #f59e0b;">⚙️</span> CONFIGURACIÓN
                        </h3>
                        
                        <div style="background: white; border-radius: 24px; border: 1px solid #eee; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
                            <div onclick="window.PlayerView.showUpdatePasswordPrompt()" style="display: flex; align-items: center; padding: 20px; border-bottom: 1px solid #f1f5f9; cursor: pointer;">
                                <div style="width: 40px; height: 40px; background: #fff7ed; color: #f59e0b; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1rem;">
                                    <i class="fas fa-key"></i>
                                </div>
                                <div style="flex: 1; margin-left: 15px;">
                                    <div style="font-weight: 800; font-size: 0.9rem; color: #1e293b;">Cambiar Contraseña</div>
                                    <div style="font-size: 0.75rem; color: #94a3b8; font-weight: 500;">Protege tu acceso pro</div>
                                </div>
                                <i class="fas fa-chevron-right" style="color: #cbd5e1; font-size: 0.8rem;"></i>
                            </div>

                            <div onclick="window.AuthService.logout()" style="display: flex; align-items: center; padding: 20px; cursor: pointer;">
                                <div style="width: 40px; height: 40px; background: #fef2f2; color: #ef4444; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1rem;">
                                    <i class="fas fa-sign-out-alt"></i>
                                </div>
                                <div style="flex: 1; margin-left: 15px;">
                                    <div style="font-weight: 800; font-size: 0.9rem; color: #ef4444;">Cerrar Sesión</div>
                                    <div style="font-size: 0.75rem; color: #94a3b8; font-weight: 500;">Hasta pronto campeon!</div>
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
                // Show loading state
                const avatar = document.getElementById('profile-avatar-display');
                if (avatar) avatar.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

                // 1. Convert to Base64 and Compress
                const optimizedBase64 = await this.compressImage(file);

                // 2. Update via Controller
                const res = await window.PlayerController.updatePhoto(optimizedBase64);

                if (res.success) {
                    console.log("Photo updated successfully");
                } else {
                    alert("Error al subir la foto: " + res.error);
                }
            } catch (error) {
                console.error("Error processing photo:", error);
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
                        const MAX_WIDTH = 400;
                        const MAX_HEIGHT = 400;
                        let width = img.width;
                        let height = img.height;

                        if (width > height) {
                            if (width > MAX_WIDTH) {
                                height *= MAX_WIDTH / width;
                                width = MAX_WIDTH;
                            }
                        } else {
                            if (height > MAX_HEIGHT) {
                                width *= MAX_HEIGHT / height;
                                height = MAX_HEIGHT;
                            }
                        }

                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);

                        // Output quality 0.7 for good balance size/quality
                        resolve(canvas.toDataURL('image/jpeg', 0.7));
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
                if (res.success) {
                    alert("Contraseña actualizada correctamente 🔐");
                } else {
                    alert("Error: " + res.error);
                }
            } else if (pass) {
                alert("La contraseña debe tener al menos 6 caracteres.");
            }
        }
    }

    window.PlayerView = new PlayerView();
    console.log("🏆 Premium PlayerView Initialized");
})();
