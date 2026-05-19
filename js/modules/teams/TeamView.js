/**
 * TeamView.js - Club Teams Premium Redesign (Broadcast Light Aesthetic)
 * Reestructuración Maestra e interactividad avanzada dentro de cada tarjeta.
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

            // Filtrar los equipos por categoría activa
            const filteredTeams = this.activeCategory === 'Todos'
                ? teams
                : teams.filter(t => t.category === this.activeCategory);

            // 📊 CÁLCULO DE ESTADÍSTICAS GLOBALES DEL CLUB
            const allTeams = teams || [];
            const totalTeamsCount = allTeams.length;
            const totalPlayersCount = allTeams.reduce((acc, t) => acc + (t.roster ? t.roster.length : 0), 0);
            const totalWins = allTeams.reduce((acc, t) => acc + (t.stats ? t.stats.pg : 0), 0);
            const totalPointsCount = allTeams.reduce((acc, t) => acc + (t.points || 0), 0);

            this.container.innerHTML = `
                <div class="teams-view-container animate-fade-in" style="padding: 24px; padding-bottom: 120px; background: #f8fafc; font-family: 'Outfit', sans-serif;">
                    
                    <!-- 💎 EXECUTIVE HEADER -->
                    <div style="margin-bottom: 30px; background: #ffffff; padding: 25px 20px; border-radius: 28px; border: 1px solid #e2e8f0; position: relative; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.02);">
                        <!-- Accent line -->
                        <div style="position:absolute; top:0; left:0; width:100%; height:6px; background: linear-gradient(90deg, #70e000, #38b000); border-radius: 28px 28px 0 0;"></div>
                        <div style="position: absolute; top: -30px; right: -30px; width: 140px; height: 140px; background: radial-gradient(circle, rgba(112,224,0,0.08) 0%, transparent 70%); border-radius: 50%;"></div>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 2;">
                            <div>
                                <span style="font-size: 0.65rem; color: #38b000; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase;">LLIGA GUINOTPRUNERA</span>
                                <h1 style="color: #0f172a; font-weight: 950; font-size: 2.2rem; margin: 3px 0 0; letter-spacing: -1px; text-transform: uppercase; line-height: 0.9;">
                                    EQUIPOS <br><span style="color:#38b000;">SOMOS PÁDEL</span>
                                </h1>
                            </div>
                            <img src="img/logo_somospadel.png" style="width: 60px; height: 60px; object-fit: contain; flex-shrink: 0; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.05));">
                        </div>

                        <!-- 📊 METRICS ROW -->
                        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 25px; position: relative; z-index: 2;">
                            <div style="background: #f8fafc; padding: 12px 6px; border-radius: 16px; border: 1px solid #edf2f7; text-align: center;">
                                <div style="font-size: 0.5rem; color: #64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">Equipos</div>
                                <div style="font-size: 1.3rem; color: #0f172a; font-weight: 950;">${totalTeamsCount}</div>
                            </div>
                            <div style="background: #f8fafc; padding: 12px 6px; border-radius: 16px; border: 1px solid #edf2f7; text-align: center;">
                                <div style="font-size: 0.5rem; color: #64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">Plantilla</div>
                                <div style="font-size: 1.3rem; color: #0f172a; font-weight: 950;">${totalPlayersCount}</div>
                            </div>
                            <div style="background: #f8fafc; padding: 12px 6px; border-radius: 16px; border: 1px solid #edf2f7; text-align: center;">
                                <div style="font-size: 0.5rem; color: #38b000; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">Victorias</div>
                                <div style="font-size: 1.3rem; color: #38b000; font-weight: 950;">${totalWins}</div>
                            </div>
                            <div style="background: #f8fafc; padding: 12px 6px; border-radius: 16px; border: 1px solid #edf2f7; text-align: center;">
                                <div style="font-size: 0.5rem; color: #64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">Pts Club</div>
                                <div style="font-size: 1.3rem; color: #0f172a; font-weight: 950;">${totalPointsCount}</div>
                            </div>
                        </div>
                    </div>

                    <!-- 🎛️ CATEGORY PILL FILTERS -->
                    <div style="display: flex; gap: 8px; margin-bottom: 25px; overflow-x: auto; padding: 4px; scrollbar-width: none; -ms-overflow-style: none;">
                        <style>.teams-view-container div::-webkit-scrollbar { display: none; }</style>
                        ${['Todos', 'Masculina', 'Femenina', 'Mixta'].map(cat => `
                            <button onclick="window.TeamController.setCategory('${cat}')" 
                                    style="padding: 10px 20px; border-radius: 16px;
                                           border: 1.5px solid ${this.activeCategory === cat ? '#38b000' : '#e2e8f0'}; 
                                           font-weight: 900; font-size: 0.75rem; cursor: pointer; white-space: nowrap;
                                           background: ${this.activeCategory === cat ? '#38b000' : '#ffffff'};
                                           color: ${this.activeCategory === cat ? '#ffffff' : '#64748b'};
                                           box-shadow: ${this.activeCategory === cat ? '0 6px 15px rgba(56,176,0,0.15)' : '0 2px 6px rgba(0,0,0,0.02)'};
                                           transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);">
                                ${cat.toUpperCase()}
                            </button>
                        `).join('')}
                    </div>

                    <!-- 🚀 MASTER TEAMS GRID -->
                    <div style="display: grid; gap: 20px;">
                        ${filteredTeams.length > 0 ? filteredTeams.map(team => this.renderTeamCard(team)).join('') : `
                            <div style="padding: 80px 40px; text-align: center; background: #ffffff; border-radius: 28px; border: 1px dashed #e2e8f0; box-shadow: 0 4px 15px rgba(0,0,0,0.01);">
                                <i class="fas fa-users-slash" style="font-size: 3rem; color: #cbd5e1; margin-bottom: 15px;"></i>
                                <p style="color: #64748b; font-weight: 800; font-size: 1rem; margin: 0;">Aún no hay equipos activos en esta sección.</p>
                            </div>
                        `}
                    </div>
                </div>
            `;
        }

        renderTeamCard(team) {
            const next = team.nextMatch;
            const standings = team.groupStandings || [];
            
            // Si el roster o standings vienen vacíos de forma corrupta, creamos un fallback elegante
            const hasRoster = team.roster && team.roster.length > 0;
            const hasStandings = standings && standings.length > 0;
            const hasSchedule = team.schedule && team.schedule.length > 0;

            const winCount = team.stats ? team.stats.pg : 0;
            const pjCount = team.stats ? team.stats.pj : 0;
            const ppCount = team.stats ? team.stats.pp : 0;

            const cleanCap = (team.name.includes('3MB') || team.name.includes('3M B')) ? 'Miguel Ángel Méndez' : 
                             (team.name.includes('3MA') || team.name.includes('3M A')) ? 'Abraham Rosell' : 
                             (team.captain && !team.captain.includes('Pendiente') ? team.captain : 'Capitán por definir');

            // Nombre de la división sanitizado para quitar saltos de línea molestos
            const cleanDiv = team.division.replace(/\n/g, ' ').replace(/\s+/g, ' ');

            return `
                <div class="team-card" 
                     id="team-${team.id}"
                     onclick="window.TeamView.toggleCard('${team.id}')"
                     style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 28px; padding: 18px; 
                            transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1); position: relative; overflow: hidden; 
                            cursor: pointer; box-shadow: 0 4px 18px rgba(0,0,0,0.015);">
                    
                    <!-- Top Ribbon Badge -->
                    <div style="position: absolute; top: 0; right: 0; background: #38b000; color: #fff; padding: 5px 18px; border-bottom-left-radius: 16px; font-weight: 900; font-size: 0.6rem; letter-spacing: 0.5px; text-transform: uppercase;">
                        ${cleanDiv}
                    </div>

                    <!-- 1. HEADER (ALWAYS VISIBLE) -->
                    <div style="display: flex; align-items: center; gap: 14px;">
                        <!-- Logo Sphere -->
                        <div style="width: 52px; height: 52px; border-radius: 16px; background: #f8fafc; border: 1px solid #edf2f7; padding: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; position: relative;">
                            <img src="${team.logo || 'img/logo_somospadel.png'}" style="width: 100%; height: 100%; object-fit: contain;">
                            ${team.ranking ? `
                                <div style="position: absolute; -top: 4px; -left: 4px; background: #0f172a; color: #fff; width: 18px; height: 18px; border-radius: 50%; font-size: 0.55rem; font-weight: 900; display: flex; align-items: center; justify-content: center; border: 1.5px solid #fff; bottom: -4px; right: -4px;">
                                    #${team.ranking}
                                </div>
                            ` : ''}
                        </div>

                        <!-- Core Team Info -->
                        <div style="flex: 1; min-width: 0;">
                            <h3 style="color: #0f172a; margin: 0; font-size: 1.15rem; font-weight: 950; letter-spacing: -0.5px; line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-right: 60px;">
                                ${team.name}
                            </h3>
                            <div style="display: flex; align-items: center; gap: 6px; margin-top: 4px; flex-wrap: wrap;">
                                <span style="font-size: 0.65rem; color: #64748b; font-weight: 800; background: #f1f5f9; padding: 2px 8px; border-radius: 6px; display: flex; align-items: center; gap: 4px;">
                                    <i class="far fa-user" style="font-size: 0.55rem; color: #94a3b8;"></i> ${cleanCap}
                                </span>
                                <span style="font-size: 0.6rem; color: #38b000; font-weight: 900; background: rgba(56,176,0,0.08); padding: 2px 8px; border-radius: 6px; text-transform: uppercase;">
                                    Grupo ${team.group.split(' ').pop()}
                                </span>
                                <span style="font-size: 0.6rem; color: #475569; font-weight: 800; background: #f8fafc; padding: 2px 6px; border-radius: 6px; border: 1px solid #edf2f7;">
                                    W:${winCount} L:${ppCount}
                                </span>
                            </div>
                        </div>

                        <!-- Interactive Indicator -->
                        <div id="chevron-${team.id}" style="color: #cbd5e1; transition: transform 0.3s ease; width: 32px; height: 32px; border-radius: 50%; background: #f8fafc; border: 1px solid #edf2f7; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                            <i class="fas fa-chevron-down" style="font-size: 0.75rem;"></i>
                        </div>
                    </div>

                    <!-- 2. HIGH-DENSITY INTERACTIVE TABS CONTAINER (EXPANDABLE) -->
                    <div id="content-${team.id}" style="max-height: 0; opacity: 0; overflow: hidden; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);">
                        <div style="padding-top: 20px;" onclick="event.stopPropagation();">
                            
                            <!-- 🎛️ HIGH-DENSITY MINI TABS BUTTONS -->
                            <div style="display: flex; background: #f1f5f9; padding: 3px; border-radius: 12px; border: 1px solid #edf2f7; margin-bottom: 15px;">
                                <button id="btn-${team.id}-class" onclick="window.TeamView.switchCardTab('${team.id}', 'class')" 
                                        style="flex: 1; padding: 8px 4px; border-radius: 9px; background: #0f172a; color: #ffffff; border: none; font-weight: 900; font-size: 0.6rem; cursor: pointer; transition: all 0.2s;">
                                    🏆 TABLA
                                </button>
                                <button id="btn-${team.id}-sched" onclick="window.TeamView.switchCardTab('${team.id}', 'sched')" 
                                        style="flex: 1; padding: 8px 4px; border-radius: 9px; background: transparent; color: #64748b; border: none; font-weight: 800; font-size: 0.6rem; cursor: pointer; transition: all 0.2s;">
                                    📅 PARTIDOS
                                </button>
                                <button id="btn-${team.id}-rost" onclick="window.TeamView.switchCardTab('${team.id}', 'rost')" 
                                        style="flex: 1; padding: 8px 4px; border-radius: 9px; background: transparent; color: #64748b; border: none; font-weight: 800; font-size: 0.6rem; cursor: pointer; transition: all 0.2s;">
                                    👥 SQUAD
                                </button>
                            </div>

                            <!-- 📦 TAB CONTENT: STANDINGS / CLASIFICACIÓN -->
                            <div id="pane-${team.id}-class" style="display: block; animation: tabFadeIn 0.3s ease-out;">
                                ${hasStandings ? `
                                <div style="background: #ffffff; border: 1px solid #edf2f7; border-radius: 16px; padding: 10px; overflow-x: auto;">
                                    <table style="width: 100%; border-collapse: separate; border-spacing: 0 4px; font-size: 0.75rem;">
                                        <thead>
                                            <tr style="color: #64748b; font-weight: 900; text-transform: uppercase; font-size: 0.6rem; text-align: center;">
                                                <th style="padding: 6px; text-align: left;">Equipo</th>
                                                <th style="padding: 6px; color: #38b000;">Pts</th>
                                                <th style="padding: 6px;">PJ</th>
                                                <th style="padding: 6px;">PG</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${standings.map((s, idx) => `
                                                <tr style="background: ${s.isCurrent ? 'rgba(56,176,0,0.06)' : 'transparent'}; border-left: ${s.isCurrent ? '3px solid #38b000' : 'none'};">
                                                    <td style="padding: 6px 8px; text-align: left; font-weight: ${s.isCurrent ? '900' : '700'}; color: ${s.isCurrent ? '#0f172a' : '#475569'}; border-radius: 8px 0 0 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 130px;">
                                                        <span style="color: ${idx === 0 ? '#eab308' : s.isCurrent ? '#38b000' : '#cbd5e1'}; font-weight: 950; margin-right: 4px;">${s.pos}</span>
                                                        ${s.team}
                                                    </td>
                                                    <td style="padding: 6px; font-weight: 950; color: ${s.isCurrent ? '#38b000' : '#0f172a'}; text-align: center;">${s.pts}</td>
                                                    <td style="padding: 6px; color: #94a3b8; text-align: center;">${s.pj}</td>
                                                    <td style="padding: 6px; color: #94a3b8; text-align: center;">${s.pg}</td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                                ` : `
                                <div style="padding: 30px; text-align: center; color: #94a3b8; font-size: 0.75rem;">
                                    <i class="fas fa-exclamation-circle" style="font-size: 1.5rem; margin-bottom: 8px; color: #cbd5e1;"></i>
                                    <p style="margin: 0; font-weight: 700;">No hay clasificación disponible. ¡Ejecuta y sincroniza el bot!</p>
                                </div>
                                `}
                            </div>

                            <!-- 📦 TAB CONTENT: SCHEDULE / PARTIDOS -->
                            <div id="pane-${team.id}-sched" style="display: none; animation: tabFadeIn 0.3s ease-out;">
                                ${hasSchedule ? `
                                <div style="max-height: 250px; overflow-y: auto; padding-right: 2px;">
                                    ${team.schedule.map(m => {
                                        const score1 = parseInt(m.score.split('-')[0]) || 0;
                                        const score2 = parseInt(m.score.split('-')[1]) || 0;
                                        const isWin = m.score && m.status === 'completed' && ((m.isHome && score1 > score2) || (!m.isHome && score2 > score1));
                                        const isLoss = m.score && m.status === 'completed' && ((m.isHome && score1 < score2) || (!m.isHome && score2 < score1));
                                        const isLive = m.status === 'live' || m.status === 'in_progress' || m.status === 'playing';
                                        
                                        const badgeBg = isLive ? 'rgba(112, 224, 0, 0.15)' : (m.status !== 'completed' ? '#edf2f7' : (isWin ? 'rgba(56,176,0,0.1)' : (isLoss ? 'rgba(239,68,68,0.1)' : '#edf2f7')));
                                        const badgeText = isLive ? '#38b000' : (m.status !== 'completed' ? '#64748b' : (isWin ? '#38b000' : (isLoss ? '#ef4444' : '#64748b')));

                                        return `
                                            <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: #f8fafc; border-radius: 16px; border: 1px solid #edf2f7; margin-bottom: 6px;">
                                                <div style="min-width: 0; flex: 1;">
                                                    <div style="font-size: 0.75rem; font-weight: 900; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                                        J${m.j}: vs ${m.opponent}
                                                    </div>
                                                    <div style="font-size: 0.6rem; color: #94a3b8; font-weight: 700; margin-top: 1px;">
                                                        ${m.date} • ${m.venue}
                                                    </div>
                                                </div>
                                                <span style="font-size: 0.65rem; font-weight: 950; background: ${badgeBg}; color: ${badgeText}; padding: 4px 10px; border-radius: 10px; flex-shrink: 0; margin-left: 10px; letter-spacing: 0.5px; display: flex; align-items: center; gap: 4px;">
                                                    ${isLive ? `<span style="display:inline-block; width:6px; height:6px; background:#38b000; border-radius:50%; animation: pulseGlow 1.5s infinite;"></span> ${m.score.toUpperCase()}` : (m.status === 'completed' ? m.score : 'PENDIENTE')}
                                                </span>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                                ` : `
                                <div style="padding: 30px; text-align: center; color: #94a3b8; font-size: 0.75rem;">
                                    <i class="fas fa-calendar-times" style="font-size: 1.5rem; margin-bottom: 8px; color: #cbd5e1;"></i>
                                    <p style="margin: 0; font-weight: 700;">No hay partidos programados en este momento.</p>
                                </div>
                                `}
                            </div>

                            <!-- 📦 TAB CONTENT: ROSTER / PLANTILLA -->
                            <div id="pane-${team.id}-rost" style="display: none; animation: tabFadeIn 0.3s ease-out;">
                                ${hasRoster ? `
                                <div style="max-height: 250px; overflow-y: auto; padding-right: 2px;">
                                    ${team.roster.map((player, pidx) => `
                                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #f8fafc; border-radius: 12px; margin-bottom: 6px; border: 1px solid #edf2f7;">
                                            <div style="display: flex; align-items: center; gap: 8px; min-width: 0;">
                                                <span style="font-size: 0.65rem; color: #cbd5e1; font-weight: 900; width: 14px; text-align: center;">${pidx + 1}</span>
                                                <span style="font-size: 0.75rem; color: #334155; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${player.name}</span>
                                            </div>
                                            <span style="font-size: 0.65rem; color: #38b000; font-weight: 900; background: rgba(56,176,0,0.06); padding: 2px 8px; border-radius: 6px; flex-shrink: 0;">
                                                ${player.pts} pts
                                            </span>
                                        </div>
                                    `).join('')}
                                </div>
                                ` : `
                                <div style="padding: 30px; text-align: center; color: #94a3b8; font-size: 0.75rem;">
                                    <i class="fas fa-user-slash" style="font-size: 1.5rem; margin-bottom: 8px; color: #cbd5e1;"></i>
                                    <p style="margin: 0; font-weight: 700;">Roster vacío. Esperando a que el bot finalice.</p>
                                </div>
                                `}
                            </div>

                            <!-- 📲 FOOTER ACTION ROW -->
                            <div style="display: flex; gap: 8px; margin-top: 15px;">
                                <button onclick="window.open('https://wa.me/?text=${encodeURIComponent(`🏆 Clasificación de ${team.name}:\n` + standings.slice(0, 3).map(s => `${s.pos}. ${s.team} - ${s.pts} pts`).join('\n'))}', '_blank')" 
                                        style="flex: 1; background: #25D366; color: white; border: none; padding: 12px; border-radius: 16px; font-weight: 900; font-size: 0.7rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 4px 12px rgba(37,211,102,0.15); transition: 0.2s;">
                                    <i class="fab fa-whatsapp" style="font-size: 0.85rem;"></i> COMPARTIR TABLA
                                </button>
                                <button onclick="window.open('${team.link}', '_blank')" 
                                        style="background: #0f172a; color: white; border: none; padding: 12px 16px; border-radius: 16px; font-weight: 900; font-size: 0.7rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: 0.2s;">
                                    WEB OFICIAL <i class="fas fa-external-link-alt" style="font-size: 0.6rem; color:#38b000;"></i>
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
                
                <style>
                    @keyframes tabFadeIn {
                        from { opacity: 0; transform: translateY(4px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes pulseGlow {
                        0% { opacity: 0.3; }
                        50% { opacity: 1; }
                        100% { opacity: 0.3; }
                    }
                </style>
            `;
        }

        switchCardTab(teamId, tabName) {
            const panes = ['class', 'sched', 'rost'];
            
            // Ocultar todos los paneles de esta tarjeta y reiniciar estilos de botones
            panes.forEach(pane => {
                const paneEl = document.getElementById(`pane-${teamId}-${pane}`);
                const btnEl = document.getElementById(`btn-${teamId}-${pane}`);
                if (paneEl) paneEl.style.display = 'none';
                if (btnEl) {
                    btnEl.style.background = 'transparent';
                    btnEl.style.color = '#64748b';
                    btnEl.style.fontWeight = '800';
                }
            });

            // Mostrar y colorear el seleccionado
            const activePane = document.getElementById(`pane-${teamId}-${tabName}`);
            const activeBtn = document.getElementById(`btn-${teamId}-${tabName}`);
            
            if (activePane) activePane.style.display = 'block';
            if (activeBtn) {
                activeBtn.style.background = '#0f172a';
                activeBtn.style.color = '#ffffff';
                activeBtn.style.fontWeight = '900';
            }

            // Haptic
            if (window.navigator.vibrate) window.navigator.vibrate(8);
        }

        toggleCard(teamId) {
            const content = document.getElementById(`content-${teamId}`);
            const chevron = document.getElementById(`chevron-${teamId}`);
            const card = document.getElementById(`team-${teamId}`);
            
            if (!content) return;

            if (content.style.maxHeight === '0px' || !content.style.maxHeight) {
                // Expandir
                content.style.maxHeight = '650px';
                content.style.opacity = '1';
                if (chevron) {
                    chevron.style.transform = 'rotate(180deg)';
                    chevron.style.color = '#38b000';
                }
                card.style.borderColor = 'rgba(56, 176, 0, 0.25)';
                card.style.boxShadow = '0 10px 25px rgba(56,176,0,0.03)';
                if (window.PlayerView?.haptic) window.PlayerView.haptic(15);
            } else {
                // Colapsar
                content.style.maxHeight = '0px';
                content.style.opacity = '0';
                if (chevron) {
                    chevron.style.transform = 'rotate(0deg)';
                    chevron.style.color = '#cbd5e1';
                }
                card.style.borderColor = '#e2e8f0';
                card.style.boxShadow = '0 4px 18px rgba(0,0,0,0.015)';
            }
        }
    }

    window.TeamView = new TeamView();
})();
