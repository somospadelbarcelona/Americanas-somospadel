/**
 * TeamView.js - Club Teams Premium Interface
 */
(function () {
    class TeamView {
        constructor() {
            this.container = null;
            this.activeCategory = 'Todos';
        }

        render(teams) {
            this.container = document.getElementById('content-area');
            if (!this.container) return;

            const filteredTeams = this.activeCategory === 'Todos'
                ? teams
                : teams.filter(t => t.category === this.activeCategory);

            // Calculate Overall Stats
            const totalTeams = teams.length;
            const nextMatchesCount = teams.filter(t => t.nextMatch).length;

            this.container.innerHTML = `
                <div class="teams-view-container animate-fade-in" style="padding: 24px; padding-bottom: 120px; background: #000;">
                    <!-- 💎 EXECUTIVE HEADER -->
                    <div style="margin-bottom: 35px; background: linear-gradient(90deg, rgba(204,255,0,0.1) 0%, transparent 100%); padding: 30px 20px; border-radius: 24px; border-left: 5px solid var(--brand-neon);">
                        <h1 style="color: white; font-weight: 950; font-size: 2.4rem; margin: 0; letter-spacing: -1.5px; text-transform: uppercase; line-height: 0.9;">
                            EQUIPOS <br><span style="color:var(--brand-neon);">SOMOSPADEL</span>
                        </h1>
                        <div style="display: flex; gap: 20px; margin-top: 20px;">
                            <div style="background: rgba(255,255,255,0.05); padding: 10px 15px; border-radius: 12px;">
                                <div style="font-size: 0.55rem; color: #888; font-weight: 900;">CLUB TEAMS</div>
                                <div style="font-size: 1.2rem; color: white; font-weight: 950;">${totalTeams}</div>
                            </div>
                            <div style="background: rgba(0,210,255,0.1); padding: 10px 15px; border-radius: 12px; border: 1px solid rgba(0,210,255,0.2);">
                                <div style="font-size: 0.55rem; color: #00d2ff; font-weight: 900;">PRÓX. JORNADAS</div>
                                <div style="font-size: 1.2rem; color: white; font-weight: 950;">${nextMatchesCount}</div>
                            </div>
                        </div>
                    </div>

                    <!-- 🌀 MODERN FILTERS -->
                    <div style="display: flex; gap: 12px; margin-bottom: 30px; overflow-x: auto; padding: 5px; scrollbar-width: none; -ms-overflow-style: none;">
                        <style>.teams-view-container div::-webkit-scrollbar { display: none; }</style>
                        ${['Todos', 'Masculina', 'Femenina', 'Mixta'].map(cat => `
                            <button onclick="window.TeamController.setCategory('${cat}')" 
                                    style="padding: 12px 24px; border-radius: 16px; border: 1px solid ${this.activeCategory === cat ? 'var(--brand-neon)' : 'rgba(255,255,255,0.1)'}; 
                                           font-weight: 900; font-size: 0.8rem; cursor: pointer; white-space: nowrap;
                                           background: ${this.activeCategory === cat ? 'var(--brand-neon)' : 'rgba(255,255,255,0.03)'};
                                           color: ${this.activeCategory === cat ? 'black' : 'white'};
                                           box-shadow: ${this.activeCategory === cat ? '0 8px 20px rgba(204,255,0,0.2)' : 'none'};
                                           transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
                                ${cat.toUpperCase()}
                            </button>
                        `).join('')}
                    </div>

                    <!-- 🚀 MASTER TEAMS GRID -->
                    <div style="display: grid; gap: 30px;">
                        ${filteredTeams.length > 0 ? filteredTeams.map(team => this.renderTeamCard(team)).join('') : `
                            <div style="padding: 100px 40px; text-align: center; background: rgba(255,255,255,0.02); border-radius: 32px; border: 1px dashed rgba(255,255,255,0.1);">
                                <i class="fas fa-users-slash" style="font-size: 4rem; color: rgba(255,255,255,0.1); margin-bottom: 25px;"></i>
                                <p style="color: #666; font-weight: 800; font-size: 1.1rem;">Aún no hay equipos en esta división...</p>
                            </div>
                        `}
                    </div>
                </div>
            `;
        }

        renderTeamCard(team) {
            const next = team.nextMatch;
            const standings = team.groupStandings || [];

            return `
                <div class="team-card glass-card-enterprise" 
                     id="team-${team.id}"
                     style="background: linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%); 
                            border: 1px solid rgba(255,255,255,0.1); border-radius: 32px; padding: 25px; transition: all 0.4s ease; position: relative; overflow: hidden;">
                    
                    <!-- TOP BADGE -->
                    <div style="position: absolute; top: 0; right: 0; background: var(--brand-neon); color: black; padding: 6px 20px; border-bottom-left-radius: 20px; font-weight: 950; font-size: 0.6rem; letter-spacing: 1px;">
                        ${team.division}
                    </div>

                    <!-- PRIMARY INFO -->
                    <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 25px;">
                        <div style="width: 80px; height: 80px; border-radius: 24px; background: white; padding: 10px; display: flex; align-items: center; justify-content: center; box-shadow: 0 15px 35px rgba(0,0,0,0.3); flex-shrink: 0;">
                            <img src="${team.logo}" style="width: 100%; height: 100%; object-fit: contain;">
                        </div>
                        <div style="flex: 1;">
                            <h3 style="color: white; margin: 0; font-size: 1.4rem; font-weight: 950; line-height: 1.1;">${team.name}</h3>
                            <div style="display: flex; align-items: center; gap: 10px; margin-top: 8px;">
                                <span style="font-size: 0.7rem; color: #888; font-weight: 700; background: rgba(255,255,255,0.05); padding: 3px 10px; border-radius: 8px;">
                                    <i class="fas fa-user-shield" style="color: var(--brand-neon); margin-right: 5px;"></i> ${team.captain}
                                </span>
                                <span style="font-size: 0.7rem; color: var(--brand-neon); font-weight: 900; background: rgba(204,255,0,0.1); padding: 3px 10px; border-radius: 8px;">
                                    GRUPO ${team.group.split(' ').pop()}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- NEXT MATCH PANEL (PRO) -->
                    ${next ? `
                    <div style="background: rgba(0,210,255,0.08); border: 1px solid rgba(0,210,255,0.2); border-radius: 20px; padding: 18px; margin-bottom: 25px; display: flex; align-items: center; gap: 15px;">
                        <div style="width: 45px; height: 45px; border-radius: 12px; background: #00d2ff; color: white; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0;">
                            <i class="far fa-calendar-alt"></i>
                        </div>
                        <div style="flex: 1;">
                            <div style="font-size: 0.55rem; color: #00d2ff; font-weight: 950; text-transform: uppercase; letter-spacing: 1px;">PRÓXIMO PARTIDO</div>
                            <div style="font-size: 0.9rem; color: white; font-weight: 800; margin-top: 2px;">vs ${next.opponent}</div>
                            <div style="font-size: 0.7rem; color: rgba(255,255,255,0.5); font-weight: 700; margin-top: 2px;">
                                ${next.date} • ${next.time} • <span style="color: #ccc;">${next.venue}</span>
                            </div>
                        </div>
                        <i class="fas fa-chevron-right" style="color: rgba(255,255,255,0.2);"></i>
                    </div>
                    ` : ''}

                    <!-- STANDINGS MINI-TABLE -->
                    <div style="background: rgba(0,0,0,0.2); border-radius: 20px; padding: 15px; border: 1px solid rgba(255,255,255,0.03);">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding: 0 5px;">
                            <span style="font-size: 0.6rem; font-weight: 900; color: #555; text-transform: uppercase;">POSICIONES GRUPO</span>
                            <span style="font-size: 0.6rem; font-weight: 900; color: var(--brand-neon); cursor: pointer;" onclick="window.open('${team.link}', '_blank')">VER LIGA <i class="fas fa-external-link-alt"></i></span>
                        </div>
                        ${standings.slice(0, 4).map((s, idx) => `
                            <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 10px; border-radius: 10px; margin-bottom: 4px; background: ${s.isCurrent ? 'rgba(204,255,0,0.1)' : 'transparent'};">
                                <div style="display: flex; align-items: center; gap: 12px;">
                                    <span style="font-size: 0.8rem; font-weight: 950; color: ${idx === 0 ? 'gold' : s.isCurrent ? 'var(--brand-neon)' : '#444'};">${s.pos}</span>
                                    <span style="font-size: 0.8rem; font-weight: 700; color: ${s.isCurrent ? 'white' : 'rgba(255,255,255,0.5)'}; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${s.team}</span>
                                </div>
                                <span style="font-size: 0.75rem; font-weight: 900; color: ${s.isCurrent ? 'white' : '#666'};">${s.pts} pts</span>
                            </div>
                        `).join('')}
                    </div>

                    <!-- FOOTER ACTION -->
                    <button onclick="window.TeamController.showTeamDetail('${team.id}')" 
                            style="width: 100%; margin-top: 20px; background: rgba(255,255,255,0.05); color: white; border: 1px solid rgba(255,255,255,0.1); padding: 14px; border-radius: 16px; font-weight: 800; font-size: 0.8rem; cursor: pointer; transition: 0.3s;"
                            onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'">
                        ESTADÍSTICAS Y PLANTILLA
                    </button>
                </div>
            `;
        }

        showTeamDetailLoading(teamId) {
            // To be implemented in next step if user requests
        }
    }

    window.TeamView = new TeamView();
})();
