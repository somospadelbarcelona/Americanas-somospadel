/**
 * JornadasView.js - Global Match Calendar for Club Teams
 */
(function () {
    class JornadasView {
        constructor() {
            this.container = null;
        }

        render(teams) {
            this.container = document.getElementById('content-area');
            if (!this.container) return;

            // Collect all matches from all teams
            let allMatches = [];
            teams.forEach(team => {
                if (team.schedule) {
                    team.schedule.forEach(match => {
                        allMatches.push({ ...match, teamName: team.name, teamLogo: team.logo });
                    });
                }
            });

            // Sort by Date (Simplified since we have strings like '09 May')
            // For now, we'll group by Team to make it cleaner.

            this.container.innerHTML = `
                <div class="jornadas-view-container animate-fade-in" style="padding: 24px; padding-bottom: 120px; background: #000;">
                    <!-- 💎 EXECUTIVE HEADER -->
                    <div style="margin-bottom: 35px; border-left: 5px solid #00d2ff; padding-left: 20px;">
                        <h1 style="color: white; font-weight: 950; font-size: 2.2rem; margin: 0; letter-spacing: -1px; text-transform: uppercase;">
                            CALENDARIO <br><span style="color:#00d2ff;">JORNADAS</span>
                        </h1>
                        <p style="color: rgba(255,255,255,0.6); font-size: 0.95rem; font-weight: 600; margin-top: 5px;">
                            Temporada Lliga 2026
                        </p>
                    </div>

                    <!-- JORNADAS LIST -->
                    <div style="display: grid; gap: 20px;">
                        ${teams.map(team => this.renderTeamJornadas(team)).join('')}
                    </div>
                </div>
            `;
        }

        renderTeamJornadas(team) {
            if (!team.schedule || team.schedule.length === 0) return '';

            return `
                <div class="glass-card-enterprise" style="padding: 20px; border-radius: 24px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);">
                    <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
                        <img src="${team.logo}" style="width: 30px; height: 30px; object-fit: contain;">
                        <h3 style="color: white; margin: 0; font-size: 1rem; font-weight: 900;">${team.name}</h3>
                    </div>
                    
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        ${team.schedule.map(m => `
                            <div style="display: flex; align-items: center; gap: 15px; padding: 12px; background: rgba(255,255,255,0.03); border-radius: 12px; border: 1px solid rgba(255,255,255,0.02);">
                                <div style="width: 45px; text-align: center; border-right: 1px solid rgba(255,255,255,0.1); padding-right: 10px;">
                                    <div style="font-size: 0.7rem; color: #00d2ff; font-weight: 950;">J${m.j}</div>
                                    <div style="font-size: 0.6rem; color: #888; font-weight: 700;">${m.date.split(' ')[0]}</div>
                                </div>
                                <div style="flex: 1;">
                                    <div style="font-size: 0.8rem; color: white; font-weight: 800;">${m.opponent}</div>
                                    <div style="font-size: 0.65rem; color: rgba(255,255,255,0.4); font-weight: 600;">
                                        ${m.isHome ? 'LOCAL' : 'VISITANTE'} • ${m.venue} • ${m.time}h
                                    </div>
                                </div>
                                ${m.status === 'finished' ? `<div style="font-weight: 950; color: var(--brand-neon); font-size: 0.8rem;">FINAL</div>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    }

    window.JornadasView = new JornadasView();
})();
