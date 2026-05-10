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

            // 📊 CALCULATE AGGREGATED CLUB STATS (GLOBAL - NOT FILTERED)
            const allTeams = window.ClubTeamsData || [];
            const totalTeamsCount = allTeams.length;
            const totalPlayersCount = allTeams.reduce((acc, t) => acc + (t.roster ? t.roster.length : 0), 0);
            const totalWins = allTeams.reduce((acc, t) => acc + (t.stats ? t.stats.pg : 0), 0);
            const totalPointsCount = allTeams.reduce((acc, t) => acc + (t.points || 0), 0);

            this.container.innerHTML = `
                <div class="teams-view-container animate-fade-in" style="padding: 24px; padding-bottom: 120px; background: #000;">
                    <!-- 💎 EXECUTIVE HEADER -->
                    <div style="margin-bottom: 35px; background: linear-gradient(135deg, rgba(204,255,0,0.08) 0%, rgba(0,0,0,0) 100%); padding: 40px 20px; border-radius: 32px; border-left: 6px solid var(--brand-neon); position: relative; overflow: hidden;">
                        <div style="position: absolute; top: -20px; right: -20px; width: 150px; height: 150px; background: radial-gradient(circle, rgba(204,255,0,0.1) 0%, transparent 70%);"></div>
                        
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 15px; position: relative; z-index: 2;">
                            <h1 style="color: white; font-weight: 950; font-size: 2.6rem; margin: 0; letter-spacing: -1.5px; text-transform: uppercase; line-height: 0.85;">
                                EQUIPOS <br><span style="color:var(--brand-neon); text-shadow: 0 0 15px rgba(204,255,0,0.4);">SOMOS PÁDEL</span>
                            </h1>
                            <img src="img/logo_somospadel.png" style="width: 65px; height: 65px; object-fit: contain; filter: drop-shadow(0 10px 20px rgba(204,255,0,0.3)); flex-shrink: 0;">
                        </div>

                        <!-- 🚀 4 WOW BUTTONS CENTERED -->
                        <div style="display: flex; justify-content: center; gap: 12px; margin-top: 35px; flex-wrap: wrap; position: relative; z-index: 2;">
                            <!-- Nº EQUIPOS (Lima) -->
                            <div style="flex: 1; min-width: 75px; background: rgba(204,255,0,0.05); padding: 12px 10px; border-radius: 20px; border: 1px solid rgba(204,255,0,0.2); text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.2), inset 0 0 10px rgba(204,255,0,0.05);">
                                <div style="font-size: 0.5rem; color: #ccff00; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Nº EQUIPOS</div>
                                <div style="font-size: 1.4rem; color: white; font-weight: 950; line-height: 1;">${totalTeamsCount}</div>
                            </div>
                            
                            <!-- PLANTILLA (Oro) -->
                            <div style="flex: 1; min-width: 75px; background: rgba(255,184,0,0.05); padding: 12px 10px; border-radius: 20px; border: 1px solid rgba(255,184,0,0.2); text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
                                <div style="font-size: 0.5rem; color: #ffb800; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">PLANTILLA</div>
                                <div style="font-size: 1.4rem; color: white; font-weight: 950; line-height: 1;">${totalPlayersCount}</div>
                            </div>

                            <!-- VICTORIAS (Verde Esmeralda) -->
                            <div style="flex: 1; min-width: 75px; background: rgba(0,255,136,0.05); padding: 12px 10px; border-radius: 20px; border: 1px solid rgba(0,255,136,0.2); text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
                                <div style="font-size: 0.5rem; color: #00ff88; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">VICTORIAS</div>
                                <div style="font-size: 1.4rem; color: white; font-weight: 950; line-height: 1;">${totalWins}</div>
                            </div>

                            <!-- PUNTOS CLUB (Cian) -->
                            <div style="flex: 1; min-width: 75px; background: rgba(0,210,255,0.05); padding: 12px 10px; border-radius: 20px; border: 1px solid rgba(0,210,255,0.2); text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
                                <div style="font-size: 0.5rem; color: #00d2ff; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">PUNTOS CLUB</div>
                                <div style="font-size: 1.4rem; color: white; font-weight: 950; line-height: 1;">${totalPointsCount}</div>
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
                     onclick="window.TeamView.toggleCard('${team.id}')"
                     style="background: linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%); 
                            border: 1px solid rgba(255,255,255,0.1); border-radius: 32px; padding: 20px; transition: all 0.4s ease; 
                            position: relative; overflow: hidden; cursor: pointer; margin-bottom: 20px;">
                    
                    <!-- TOP BADGE -->
                    <div style="position: absolute; top: 0; right: 0; background: var(--brand-neon); color: black; padding: 6px 20px; border-bottom-left-radius: 20px; font-weight: 950; font-size: 0.6rem; letter-spacing: 1px;">
                        ${team.division}
                    </div>

                    <!-- PRIMARY INFO (HEADER ALWAYS VISIBLE) -->
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <div style="width: 60px; height: 60px; border-radius: 18px; background: white; padding: 8px; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 25px rgba(0,0,0,0.3); flex-shrink: 0; position: relative; overflow: hidden;">
                            <img src="${team.logo}" style="width: 100%; height: 100%; object-fit: contain;" 
                                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                            <div style="display:none; width:100%; height:100%; align-items:center; justify-content:center; color:#0f172a; font-size:1.5rem;">
                                <i class="fas fa-table-tennis"></i>
                            </div>
                        </div>
                        <div style="flex: 1;">
                            <h3 style="color: white; margin: 0; font-size: 1.1rem; font-weight: 950; line-height: 1.1;">${team.name}</h3>
                            <div style="display: flex; align-items: center; gap: 8px; margin-top: 5px;">
                                <span style="font-size: 0.6rem; color: #ccc; font-weight: 700; background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 6px;">
                                    ${((team.name.includes('3MB') || team.name.includes('3M B'))) ? 'Miguel Ángel Méndez Ruiz' : 
                                      ((team.name.includes('3MA') || team.name.includes('3M A'))) ? 'Abraham Rosell' : 
                                      ((team.captain && !team.captain.includes('Pendiente')) ? team.captain : (team.roster && team.roster.length > 0 ? team.roster[0].name : 'Capitán por definir'))}
                                </span>
                                <span style="font-size: 0.6rem; color: #72a800; font-weight: 900; background: rgba(114,168,0,0.1); padding: 2px 8px; border-radius: 6px;">
                                    GRUPO ${team.group.split(' ').pop()}
                                </span>
                            </div>
                        </div>
                        <div id="chevron-${team.id}" style="color: rgba(255,255,255,0.2); transition: transform 0.4s ease;">
                            <i class="fas fa-chevron-down"></i>
                        </div>
                    </div>

                    <!-- 📉 COLLAPSIBLE CONTENT (HIDDEN BY DEFAULT) -->
                    <div id="content-${team.id}" style="max-height: 0; opacity: 0; overflow: hidden; transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);">
                        <div style="padding-top: 25px;">
                            <!-- NEXT MATCH PANEL -->
                            ${next ? `
                            <div style="background: rgba(0,210,255,0.08); border: 1px solid rgba(0,210,255,0.2); border-radius: 20px; padding: 18px; margin-bottom: 20px; display: flex; align-items: center; gap: 15px;">
                                <div style="width: 40px; height: 40px; border-radius: 12px; background: #00d2ff; color: white; display: flex; align-items: center; justify-content: center; font-size: 1rem; flex-shrink: 0;">
                                    <i class="far fa-calendar-alt"></i>
                                </div>
                                <div style="flex: 1;">
                                    <div style="font-size: 0.5rem; color: #00d2ff; font-weight: 950; text-transform: uppercase;">PRÓXIMO PARTIDO</div>
                                    <div style="font-size: 0.85rem; color: white; font-weight: 800;">vs ${next.opponent}</div>
                                    <div style="font-size: 0.65rem; color: rgba(255,255,255,0.5); font-weight: 700;">
                                        ${next.date} • ${next.time}h
                                    </div>
                                </div>
                            </div>
                            ` : ''}

                            <!-- STANDINGS MINI-TABLE -->
                            <div style="background: #ffffff; border-radius: 20px; padding: 15px; border: 1px solid #e2e8f0;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding: 0 5px;">
                                    <span style="font-size: 0.55rem; font-weight: 950; color: #94a3b8; text-transform: uppercase;">POSICIONES GRUPO</span>
                                    <span style="font-size: 0.55rem; font-weight: 900; color: #72a800; cursor: pointer;" onclick="event.stopPropagation(); window.open('${team.link}', '_blank')">VER LIGA <i class="fas fa-external-link-alt"></i></span>
                                </div>
                                ${(() => {
                                    const top4 = standings.slice(0, 4);
                                    const currentInTop4 = top4.some(s => s.isCurrent);
                                    let displayStandings = top4;

                                    if (!currentInTop4) {
                                        const currentTeam = standings.find(s => s.isCurrent);
                                        if (currentTeam) {
                                            displayStandings = [...standings.slice(0, 3), currentTeam];
                                        }
                                    }

                                    return displayStandings.map((s, idx) => `
                                        <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 10px; border-radius: 10px; margin-bottom: 4px; background: ${s.isCurrent ? 'rgba(114,168,0,0.05)' : 'transparent'}; border-left: ${s.isCurrent ? '3px solid #72a800' : 'none'};">
                                            <div style="display: flex; align-items: center; gap: 10px;">
                                                <span style="font-size: 0.75rem; font-weight: 950; color: ${idx === 0 ? '#eab308' : s.isCurrent ? '#72a800' : '#cbd5e1'}; width: 15px;">${s.pos}</span>
                                                <span style="font-size: 0.75rem; font-weight: 700; color: ${s.isCurrent ? '#0f172a' : '#475569'}; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; ${s.isCurrent ? 'text-decoration: underline; font-weight: 950;' : ''}">${s.team}</span>
                                            </div>
                                            <span style="font-size: 0.7rem; font-weight: 900; color: ${s.isCurrent ? '#0f172a' : '#94a3b8'};">${s.pts} pts</span>
                                        </div>
                                    `).join('');
                                })()}
                            </div>

                            <!-- FOOTER ACTION -->
                            <button onclick="event.stopPropagation(); window.TeamController.showTeamDetail('${team.id}')" 
                                    style="width: 100%; margin-top: 20px; background: var(--brand-neon); color: black; border: none; padding: 14px; border-radius: 16px; font-weight: 900; font-size: 0.75rem; cursor: pointer; transition: 0.3s; box-shadow: 0 10px 20px rgba(204,204,0,0.2);">
                                VER ESTADÍSTICAS Y PLANTILLA COMPLETA
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        toggleCard(teamId) {
            const content = document.getElementById(`content-${teamId}`);
            const chevron = document.getElementById(`chevron-${teamId}`);
            const card = document.getElementById(`team-${teamId}`);
            
            if (!content) return;

            if (content.style.maxHeight === '0px' || !content.style.maxHeight) {
                content.style.maxHeight = '600px';
                content.style.opacity = '1';
                if (chevron) {
                    chevron.style.transform = 'rotate(180deg)';
                    chevron.style.color = 'var(--brand-neon)';
                }
                card.style.borderColor = 'rgba(204,255,0,0.3)';
                card.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)';
                if (window.PlayerView?.haptic) window.PlayerView.haptic(20);
            } else {
                content.style.maxHeight = '0px';
                content.style.opacity = '0';
                if (chevron) {
                    chevron.style.transform = 'rotate(0deg)';
                    chevron.style.color = 'rgba(255,255,255,0.2)';
                }
                card.style.borderColor = 'rgba(255,255,255,0.1)';
                card.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)';
            }
        }
    }

    window.TeamView = new TeamView();
})();
