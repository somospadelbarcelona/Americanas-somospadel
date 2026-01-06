render() {
    this.container = document.getElementById('content-area');
    if (!this.container) return;

    const user = window.Store ? window.Store.getState('currentUser') : null;
    if (!user) {
        this.renderEmptyState();
        return;
    }

    // Fallback for missing stats
    const stats = {
        matches: user.matches_played || 0,
        wins: Math.round((user.win_rate || 0) * (user.matches_played || 0) / 100),
        level: user.level || user.self_rate_level || '3.50',
        points: user.total_score || 0
    };

    this.container.innerHTML = `
                <div class="profile-container fade-in" style="background: #f8f9fa; min-height: 80vh; padding-bottom: 100px;">
                    
                    <!-- Top Profile Card -->
                    <div style="background: var(--playtomic-blue); padding: 40px 20px; text-align: center; border-bottom-left-radius: 30px; border-bottom-right-radius: 30px; position: relative; overflow: hidden;">
                        <div style="position: absolute; top: -50px; left: -50px; width: 150px; height: 150px; background: var(--playtomic-neon); border-radius: 50%; opacity: 0.1;"></div>
                        
                        <div style="width: 90px; height: 90px; background: white; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; font-weight: 800; color: var(--playtomic-blue); border: 4px solid rgba(255,255,255,0.2);">
                            ${user.name.charAt(0)}
                        </div>
                        <h2 style="color: white; font-weight: 800; margin: 0; font-size: 1.5rem;">${user.name}</h2>
                        <p style="color: #999; font-size: 0.8rem; margin-top: 5px; letter-spacing: 1px;">Socio SomosPadel BCN</p>
                        
                        <div style="margin-top: 25px; display: flex; justify-content: center; gap: 40px;">
                            <div>
                                <div style="color: var(--playtomic-neon); font-size: 1.5rem; font-weight: 900;">${stats.matches}</div>
                                <div style="color: #888; font-size: 0.6rem; text-transform: uppercase; font-weight: 700;">Partidos</div>
                            </div>
                            <div>
                                <div style="color: white; font-size: 1.5rem; font-weight: 900;">${stats.level}</div>
                                <div style="color: #888; font-size: 0.6rem; text-transform: uppercase; font-weight: 700;">Nivel</div>
                            </div>
                            <div>
                                <div style="color: var(--playtomic-neon); font-size: 1.5rem; font-weight: 900;">${stats.points}</div>
                                <div style="color: #888; font-size: 0.6rem; text-transform: uppercase; font-weight: 700;">Puntos</div>
                            </div>
                        </div>
                    </div>

                    <!-- Action Grid -->
                    <div style="padding: 25px 20px;">
                        <h3 style="font-size: 0.9rem; font-weight: 800; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 20px;">Preferencias de Juego</h3>
                        
                        <div style="background: white; border-radius: 20px; padding: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); border: 1px solid #eee;">
                            <div style="display: flex; align-items: center; padding: 15px; border-bottom: 1px solid #f5f5f5;">
                                <div style="width: 35px; color: #555;"><i class="fas fa-hand-paper"></i></div>
                                <div style="flex: 1; font-weight: 600; font-size: 0.9rem;">Mano Hábil</div>
                                <div style="color: #888; font-size: 0.8rem;">Diestro</div>
                            </div>
                            <div style="display: flex; align-items: center; padding: 15px; border-bottom: 1px solid #f5f5f5;">
                                <div style="width: 35px; color: #555;"><i class="fas fa-arrows-alt-h"></i></div>
                                <div style="flex: 1; font-weight: 600; font-size: 0.9rem;">Lado Preferido</div>
                                <div style="color: #888; font-size: 0.8rem;">${user.play_preference || 'Indiferente'}</div>
                            </div>
                            <div style="display: flex; align-items: center; padding: 15px;">
                                <div style="width: 35px; color: #555;"><i class="fas fa-shield-alt"></i></div>
                                <div style="flex: 1; font-weight: 600; font-size: 0.9rem;">Categoría</div>
                                <div style="color: #888; font-size: 0.8rem;">${user.category_preference || 'Mixto'}</div>
                            </div>
                        </div>

                        <h3 style="font-size: 0.9rem; font-weight: 800; color: #888; text-transform: uppercase; letter-spacing: 1px; margin: 30px 0 20px;">Cuenta y Privacidad</h3>
                        
                        <div style="background: white; border-radius: 20px; padding: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); border: 1px solid #eee;">
                            <div style="display: flex; align-items: center; padding: 15px; border-bottom: 1px solid #f5f5f5; cursor: pointer;">
                                <div style="width: 35px; color: #3b82f6;"><i class="fas fa-cog"></i></div>
                                <div style="flex: 1; font-weight: 600; font-size: 0.9rem;">Configuración</div>
                                <i class="fas fa-chevron-right" style="color: #ccc; font-size: 0.8rem;"></i>
                            </div>
                            <div style="display: flex; align-items: center; padding: 15px; border-bottom: 1px solid #f5f5f5; cursor: pointer;">
                                <div style="width: 35px; color: #10b981;"><i class="fas fa-wallet"></i></div>
                                <div style="flex: 1; font-weight: 600; font-size: 0.9rem;">Mis Pagos</div>
                                <i class="fas fa-chevron-right" style="color: #ccc; font-size: 0.8rem;"></i>
                            </div>
                            <div onclick="window.AuthService.logout()" style="display: flex; align-items: center; padding: 15px; cursor: pointer;">
                                <div style="width: 35px; color: #ef4444;"><i class="fas fa-sign-out-alt"></i></div>
                                <div style="flex: 1; font-weight: 600; font-size: 0.9rem; color: #ef4444;">Cerrar Sesión</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
}

renderEmptyState() {
    this.container.innerHTML = `
                <div style="text-align:center; padding: 5rem 2rem;">
                    <div style="width: 100px; height: 100px; background: #eee; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 30px;">
                        <i class="fas fa-user-slash" style="font-size: 3rem; color: #ccc;"></i>
                    </div>
                    <h2 style="font-weight: 800; margin-bottom: 10px;">Acceso Restringido</h2>
                    <p style="color: #888; font-size: 0.9rem; margin-bottom: 30px;">Inicia sesión para ver tu perfil de jugador y estadísticas.</p>
                    <button class="btn-primary-pro" onclick="window.location.reload()" style="width: 100%;">IR AL LOGIN</button>
                </div>
            `;
}
    }

window.PlayerView = new PlayerView();
console.log("📱 PlayerView Hub Loaded");
}) ();
