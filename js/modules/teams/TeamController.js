/**
 * TeamController.js - Orchestrates Teams Data and View
 */
(function () {
    class TeamController {
        constructor() {
            this.teams = [];
        }

        init() {
            console.log("👥 [TeamController] Initializing...");
            this.teams = window.ClubTeamsData || [];
            this.render();
        }

        setCategory(category) {
            if (window.PlayerView?.haptic) window.PlayerView.haptic(20);
            window.TeamView.activeCategory = category;
            this.render();
        }

        render() {
            if (window.TeamView) {
                window.TeamView.render(this.teams);
            }
        }

        async showTeamDetail(teamId) {
            const team = this.teams.find(t => t.id === teamId);
            if (!team) return;

            if (window.PlayerView?.haptic) window.PlayerView.haptic(20);

            // Open original Summapadel link in a controlled way or show modal
            window.PremiumModal.alert({
                title: team.name,
                message: `
                    <div style="text-align: left; padding: 5px;">
                        <div style="display:flex; justify-content: space-between; margin-bottom: 20px; background: rgba(255,255,255,0.04); padding: 15px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05);">
                            <div>
                                <div style="font-size: 0.55rem; color: #888; font-weight: 900; text-transform: uppercase;">Puntos</div>
                                <div style="font-size: 1.6rem; font-weight: 950; color: var(--brand-neon);">${team.points}</div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 0.55rem; color: #888; font-weight: 900; text-transform: uppercase;">Partidos</div>
                                <div style="font-size: 1.6rem; font-weight: 950; color: white;">${team.stats.pj}</div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-size: 0.55rem; color: #888; font-weight: 900; text-transform: uppercase;">W / L</div>
                                <div style="font-size: 1.6rem; font-weight: 950; color: white;">${team.stats.pg} <span style="color:rgba(255,255,255,0.2)">/</span> ${team.stats.pp}</div>
                            </div>
                        </div>

                        <!-- 🎛️ MODAL TABS -->
                        <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                            <button onclick="document.getElementById('tab-roster').style.display='block'; document.getElementById('tab-jornadas').style.display='none'; this.style.opacity='1'; this.nextElementSibling.style.opacity='0.5';" 
                                    style="flex: 1; padding: 12px; border-radius: 12px; background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); font-weight: 900; font-size: 0.75rem; cursor: pointer; opacity: 1; transition: 0.3s;">
                                <i class="fas fa-users"></i> PLANTILLA
                            </button>
                            <button onclick="document.getElementById('tab-roster').style.display='none'; document.getElementById('tab-jornadas').style.display='block'; this.style.opacity='1'; this.previousElementSibling.style.opacity='0.5';" 
                                    style="flex: 1; padding: 12px; border-radius: 12px; background: rgba(0,210,255,0.1); color: #00d2ff; border: 1px solid rgba(0,210,255,0.3); font-weight: 900; font-size: 0.75rem; cursor: pointer; opacity: 0.5; transition: 0.3s;">
                                <i class="fas fa-calendar-alt"></i> JORNADAS
                            </button>
                        </div>

                        <!-- 👥 ROSTER SECTION -->
                        <div id="tab-roster" style="display: block; margin-bottom: 25px;">
                            <div style="max-height: 250px; overflow-y: auto; padding-right: 5px; scrollbar-width: thin;">
                                ${team.roster && team.roster.length > 0 ? team.roster.map(player => `
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.03);">
                                        <span style="font-size: 0.8rem; color: rgba(255,255,255,0.8); font-weight: 700;">${player.name}</span>
                                        <span style="font-size: 0.7rem; color: var(--brand-neon); font-weight: 900; background: rgba(204,255,0,0.05); padding: 2px 10px; border-radius: 6px;">${player.pts} pts</span>
                                    </div>
                                `).join('') : '<p style="color:#666; text-align:center;">No hay plantilla disponible</p>'}
                            </div>
                        </div>

                        <!-- 📅 JORNADAS SECTION -->
                        <div id="tab-jornadas" style="display: none; margin-bottom: 25px;">
                            <div style="max-height: 250px; overflow-y: auto; padding-right: 5px; scrollbar-width: thin;">
                                ${team.schedule && team.schedule.length > 0 ? team.schedule.map(m => `
                                    <div style="display: flex; align-items: center; gap: 15px; padding: 12px; margin-bottom: 8px; background: rgba(255,255,255,0.03); border-radius: 12px; border: 1px solid rgba(255,255,255,0.02);">
                                        <div style="width: 45px; text-align: center; border-right: 1px solid rgba(255,255,255,0.1); padding-right: 10px; flex-shrink:0;">
                                            <div style="font-size: 0.7rem; color: #00d2ff; font-weight: 950;">J${m.j}</div>
                                            <div style="font-size: 0.6rem; color: #888; font-weight: 700;">${m.date.split(' ')[0]}</div>
                                        </div>
                                        <div style="flex: 1;">
                                            <div style="font-size: 0.8rem; color: white; font-weight: 800; margin-bottom: 3px;">${m.opponent}</div>
                                            <div style="font-size: 0.65rem; color: rgba(255,255,255,0.4); font-weight: 600;">
                                                <i class="fas ${m.isHome ? 'fa-home' : 'fa-plane'}"></i> ${m.isHome ? 'LOCAL' : 'VISITANTE'} • ${m.time}h
                                            </div>
                                        </div>
                                    </div>
                                `).join('') : '<p style="color:#666; text-align:center;">No hay jornadas programadas</p>'}
                            </div>
                        </div>

                        <button onclick="window.open('${team.link}', '_blank')" 
                                style="width: 100%; padding: 18px; background: linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%); color: white; border: none; border-radius: 16px; font-weight: 950; cursor: pointer; font-size: 0.85rem; box-shadow: 0 10px 20px rgba(0,210,255,0.2);">
                            <i class="fas fa-external-link-alt" style="margin-right: 8px;"></i> FICHA COMPLETA SUMMAPADEL
                        </button>
                    </div>
                `,
                type: 'info'
            });
        }
    }

    window.TeamController = new TeamController();
})();
