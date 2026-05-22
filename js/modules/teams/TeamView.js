/**
 * TeamView.js - Club Teams Premium Redesign (Broadcast Light Aesthetic)
 * Reestructuración Maestra e interactividad avanzada dentro de cada tarjeta.
 */
(function () {
    class TeamView {
        constructor() {
            this.container = null;
            this.activeCategory = 'Todos';
            this.searchQuery = '';
            this.lastTeams = [];
            this.chartsData = {}; // Para guardar la evolución de puntos
        }

        getMatchResult(match) {
            if (!match) return { valid: false };
            
            // Si no está completado, no es un resultado válido para las estadísticas de victoria/derrota
            if (match.status !== 'completed') {
                return { valid: false };
            }
            
            const scoreStr = match.score;
            if (!scoreStr || typeof scoreStr !== 'string') {
                return { valid: false };
            }
            
            const parts = scoreStr.split('-');
            if (parts.length !== 2) {
                return { valid: false };
            }
            
            const score1 = parseInt(parts[0].trim(), 10);
            const score2 = parseInt(parts[1].trim(), 10);
            
            if (isNaN(score1) || isNaN(score2)) {
                return { valid: false };
            }
            
            const isWin = score1 > score2;
            const isLoss = score1 < score2;
            
            return {
                valid: true,
                score1,
                score2,
                isWin,
                isLoss
            };
        }

        toggleFavorite(teamId) {
            const currentFav = localStorage.getItem('favTeam_somospadel');
            if (currentFav === teamId) {
                localStorage.removeItem('favTeam_somospadel'); // desmarcar
            } else {
                localStorage.setItem('favTeam_somospadel', teamId);
            }
            if (window.navigator.vibrate) window.navigator.vibrate(20);
            this.render(this.lastTeams); // Re-render para reordenar
        }

        render(teams) {
            this.lastTeams = teams || [];
            this.container = document.getElementById('content-area');
            if (!this.container) return;

            // Filtrar los equipos por categoría activa
            let filteredTeams = this.activeCategory === 'Todos'
                ? teams
                : teams.filter(t => t.category === this.activeCategory);

            const favId = localStorage.getItem('favTeam_somospadel');
            filteredTeams.sort((a, b) => {
                if (a.id === favId) return -1;
                if (b.id === favId) return 1;
                return 0;
            });

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
                                <h1 style="color: #0f172a; font-weight: 950; font-size: 2.2rem; margin: 3px 0 0; letter-spacing: -1px; text-transform: uppercase; line-height: 1.05;">
                                    EQUIPOS <br><span style="color:#38b000;">SOMOS PÁDEL</span>
                                </h1>
                                <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px;">
                                    <button onclick="
                                        if (window.db && window.db.clearPersistence) {
                                            const btn = this;
                                            btn.innerHTML = '<i class=\'fas fa-spinner fa-spin\'></i> Limpiando...';
                                            window.db.clearPersistence().then(() => {
                                                window.location.reload(true);
                                            }).catch(err => {
                                                console.error('Error clearing persistence:', err);
                                                window.location.reload(true);
                                            });
                                        } else {
                                            window.location.reload(true);
                                        }
                                    " style="background: linear-gradient(135deg, #0f172a 0%, #334155 100%); color: white; border: none; padding: 8px 14px; border-radius: 12px; font-size: 0.7rem; font-weight: 900; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 10px rgba(15,23,42,0.15); transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 6px 15px rgba(15,23,42,0.2)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 10px rgba(15,23,42,0.15)';">
                                        <i class="fas fa-sync-alt"></i> SINCRONIZAR DATOS
                                    </button>
                                    <button onclick="window.TeamView.openNextMatchesSummaryModal()" style="background: linear-gradient(135deg, #38b000 0%, #70e000 100%); color: white; border: none; padding: 8px 14px; border-radius: 12px; font-size: 0.7rem; font-weight: 900; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 10px rgba(56,176,0,0.15); transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 6px 15px rgba(56,176,0,0.2)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 10px rgba(56,176,0,0.15)';">
                                        <i class="fas fa-share-alt"></i> RESUMEN SIG. JORNADA
                                    </button>
                                </div>
                            </div>
                            <img src="img/logo_somospadel.png" style="width: 60px; height: 60px; object-fit: contain; flex-shrink: 0; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.05));">
                        </div>         </div>
                        
                        <!-- 📊 METRICS ROW -->
                        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 25px; position: relative; z-index: 2;">
                            <div style="background: #f8fafc; padding: 12px 6px; border-radius: 16px; border: 1px solid #edf2f7; text-align: center;">
                                <div style="font-size: 0.5rem; color: #64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">Equipos</div>
                                <div id="metric-teams-count" style="font-size: 1.3rem; color: #0f172a; font-weight: 950;">${totalTeamsCount}</div>
                            </div>
                            <div style="background: #f8fafc; padding: 12px 6px; border-radius: 16px; border: 1px solid #edf2f7; text-align: center;">
                                <div style="font-size: 0.5rem; color: #64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">Jugadores</div>
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
                    </div>

                    <!-- 🔍 SEARCH BAR -->
                    <div style="position: relative; margin-bottom: 20px; display: flex; align-items: center;">
                        <i class="fas fa-search" style="position: absolute; left: 16px; color: #94a3b8; font-size: 0.95rem;"></i>
                        <input type="text" 
                               id="team-search-input" 
                               value="${this.searchQuery || ''}" 
                               oninput="window.TeamController.handleSearch(this.value)" 
                               placeholder="Buscar equipo o jugador (ej: Alejandro)..." 
                               style="width: 100%; padding: 14px 16px 14px 44px; border-radius: 18px; 
                                      border: 1.5px solid #e2e8f0; font-family: 'Outfit', sans-serif; 
                                      font-size: 0.85rem; font-weight: 700; color: #0f172a; 
                                      background: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.015); 
                                      outline: none; transition: all 0.25s ease;">
                        <button id="clear-search-btn" 
                                onclick="window.TeamController.clearSearch()" 
                                style="position: absolute; right: 16px; background: none; border: none; 
                                       color: #cbd5e1; cursor: pointer; display: ${this.searchQuery ? 'block' : 'none'}; 
                                       padding: 4px; font-size: 0.9rem; transition: color 0.2s;"
                                class="clear-btn-hover">
                            <i class="fas fa-times-circle"></i>
                        </button>
                    </div>

                    <!-- 🎛️ CATEGORY PILL FILTERS -->
                    <div style="display: flex; gap: 8px; margin-bottom: 25px; overflow-x: auto; padding: 4px; scrollbar-width: none; -ms-overflow-style: none;">
                        <style>
                            .teams-view-container div::-webkit-scrollbar { display: none; }
                            .team-card:hover {
                                transform: translateY(-5px);
                                border-color: rgba(56, 176, 0, 0.45) !important;
                                box-shadow: 0 12px 30px rgba(56, 176, 0, 0.08) !important;
                            }
                            .clear-btn-hover:hover {
                                color: #ef4444 !important;
                            }
                        </style>
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
                    <div id="teams-list-grid" style="display: grid; gap: 20px;">
                        ${filteredTeams.length > 0 ? filteredTeams.map(team => this.renderTeamCard(team)).join('') : ''}
                        
                        <!-- Mensaje de no resultados (Buscador) -->
                        <div id="no-results-message" style="display: none; padding: 60px 20px; text-align: center; background: #ffffff; border-radius: 28px; border: 1px dashed #e2e8f0; box-shadow: 0 4px 15px rgba(0,0,0,0.01);">
                            <i class="fas fa-search-minus" style="font-size: 2.5rem; color: #cbd5e1; margin-bottom: 15px;"></i>
                            <p style="color: #0f172a; font-weight: 900; font-size: 1rem; margin: 0 0 4px;">No se encontraron resultados</p>
                            <p style="color: #64748b; font-weight: 700; font-size: 0.8rem; margin: 0;">Prueba a buscar otro equipo o jugador del equipo.</p>
                        </div>

                        ${filteredTeams.length === 0 ? `
                            <div style="padding: 80px 40px; text-align: center; background: #ffffff; border-radius: 28px; border: 1px dashed #e2e8f0; box-shadow: 0 4px 15px rgba(0,0,0,0.01);">
                                <i class="fas fa-users-slash" style="font-size: 3rem; color: #cbd5e1; margin-bottom: 15px;"></i>
                                <p style="color: #64748b; font-weight: 800; font-size: 1rem; margin: 0;">Aún no hay equipos activos en esta sección.</p>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;

            if (this.searchQuery) {
                this.filterDOM();
            }
        }

        renderTeamCard(team) {
            const next = team.nextMatch;
            const standings = team.groupStandings || [];
            const favId = localStorage.getItem('favTeam_somospadel');
            const isFav = team.id === favId;
            const officialLink = (team.link && team.link.startsWith('http') && team.link !== 'about:blank') ? team.link : 'https://summapadel.com/event/151';
            
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
                             
            const cleanCapLower = cleanCap.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

            let maxPts = 0;
            if (hasRoster) {
                maxPts = Math.max(...team.roster.map(p => parseInt(p.pts) || 0));
            }

            // Nombre de la división sanitizado para quitar saltos de línea molestos
            const cleanDiv = team.division.replace(/\n/g, ' ').replace(/\s+/g, ' ');

            // --- Advanced Stats Calculation (Opción B) ---
            let winRate = 0;
            let homeWins = 0, homePlayed = 0;
            let awayWins = 0, awayPlayed = 0;
            let streak = [];
            let chartLabels = ['J0'];
            let chartPoints = [0];
            let accPoints = 0;
            let pendingMatchInfo = null;
            
            if (hasSchedule) {
                const sortedMatches = [...team.schedule].sort((a, b) => parseInt(a.j) - parseInt(b.j));
                const completedMatches = sortedMatches.filter(m => m.status === 'completed' && m.score);
                const pendingMatches = sortedMatches.filter(m => m.status === 'pending' || m.status === 'scheduled' || m.status === 'upcoming');
                
                if (pendingMatches.length > 0) {
                    pendingMatchInfo = pendingMatches[0];
                }
                
                completedMatches.forEach(m => {
                    const res = this.getMatchResult(m);
                    if (!res.valid) return;
                    
                    accPoints += res.score1;
                    chartLabels.push('J' + m.j);
                    chartPoints.push(accPoints);
                    
                    if (m.isHome) {
                        homePlayed++;
                        if (res.isWin) homeWins++;
                    } else {
                        awayPlayed++;
                        if (res.isWin) awayWins++;
                    }
                    
                    streak.push(res.isWin ? 'W' : 'L');
                });
                
                const totalPlayed = homePlayed + awayPlayed;
                if (totalPlayed > 0) {
                    winRate = Math.round(((homeWins + awayWins) / totalPlayed) * 100);
                }
                
                if (streak.length > 5) {
                    streak = streak.slice(-5);
                }
            }
            
            this.chartsData[team.id] = { labels: chartLabels, data: chartPoints };
            
            const homeWinRate = homePlayed > 0 ? Math.round((homeWins/homePlayed)*100) : 0;
            const awayWinRate = awayPlayed > 0 ? Math.round((awayWins/awayPlayed)*100) : 0;
            const sf = team.stats ? team.stats.sf : 0;
            const sc = team.stats ? team.stats.sc : 0;
            const setDiff = sf - sc;
            const setDiffColor = setDiff > 0 ? '#38b000' : (setDiff < 0 ? '#ef4444' : '#64748b');

            return `
                <div class="team-card" 
                     id="team-${team.id}"
                     onclick="window.TeamView.toggleCard('${team.id}')"
                     style="background: #ffffff; border: ${isFav ? '2px solid #eab308' : '1px solid #e2e8f0'}; border-radius: 28px; padding: 18px; 
                            transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1); position: relative; overflow: hidden; 
                            cursor: pointer; box-shadow: ${isFav ? '0 10px 30px rgba(234,179,8,0.15)' : '0 4px 18px rgba(0,0,0,0.015)'};">
                    
                    <!-- Top Ribbon Badge -->
                    <div style="position: absolute; top: 0; right: 0; background: #38b000; color: #fff; padding: 5px 18px; border-bottom-left-radius: 16px; font-weight: 900; font-size: 0.6rem; letter-spacing: 0.5px; text-transform: uppercase;">
                        ${cleanDiv}
                    </div>

                    <!-- Favorite Button -->
                    <div onclick="event.stopPropagation(); window.TeamView.toggleFavorite('${team.id}')" style="position: absolute; top: 8px; left: 8px; z-index: 10; color: ${isFav ? '#eab308' : '#cbd5e1'}; font-size: 1.2rem; cursor: pointer; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1)); transition: transform 0.2s;">
                        <i class="fas fa-star"></i>
                    </div>

                    <!-- 1. HEADER (ALWAYS VISIBLE) -->
                    <div style="display: flex; align-items: center; gap: 14px; margin-top: 10px;">
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
                                    G:${winCount} P:${ppCount}
                                </span>
                            </div>
                        </div>

                        <!-- Interactive Indicator -->
                        <div id="chevron-${team.id}" style="color: #cbd5e1; transition: transform 0.3s ease; width: 32px; height: 32px; border-radius: 50%; background: #f8fafc; border: 1px solid #edf2f7; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                            <i class="fas fa-chevron-down" style="font-size: 0.75rem;"></i>
                        </div>
                    </div>

                    ${pendingMatchInfo ? `
                    <!-- 🚨 MATCH DAY HYPE -->
                    <div style="margin-top: 15px; padding: 10px 15px; background: linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,41,59,0.98)); border-radius: 16px; border-left: 4px solid #38b000; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                        <div>
                            <div style="font-size: 0.55rem; color: #94a3b8; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Próximo Reto • J${pendingMatchInfo.j}</div>
                            <div style="font-size: 0.85rem; color: #ffffff; font-weight: 900; margin-top: 2px;">vs ${pendingMatchInfo.opponent}</div>
                            <div style="font-size: 0.65rem; color: #cbd5e1; font-weight: 600; margin-top: 2px;"><i class="far fa-calendar-alt" style="color: #38b000;"></i> ${pendingMatchInfo.date} • ${pendingMatchInfo.venue}</div>
                        </div>
                        <i class="fas fa-fire-alt" style="color: #f59e0b; font-size: 1.5rem; opacity: 0.8; animation: pulseGlow 2s infinite;"></i>
                    </div>
                    ` : ''}

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
                                    👥 JUGADORES
                                </button>
                                <button id="btn-${team.id}-stats" onclick="window.TeamView.switchCardTab('${team.id}', 'stats')" 
                                        style="flex: 1; padding: 8px 4px; border-radius: 9px; background: transparent; color: #64748b; border: none; font-weight: 800; font-size: 0.6rem; cursor: pointer; transition: all 0.2s;">
                                    📊 STATS
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
                                        const res = this.getMatchResult(m);
                                        const isLive = m.status === 'live' || m.status === 'in_progress' || m.status === 'playing';
                                        
                                        const isCompleted = res.valid;
                                        const isWin = isCompleted && res.isWin;
                                        const isLoss = isCompleted && res.isLoss;
                                        
                                        const badgeBg = isLive ? 'rgba(112, 224, 0, 0.15)' : (!isCompleted ? '#edf2f7' : (isWin ? 'rgba(56,176,0,0.1)' : (isLoss ? 'rgba(239,68,68,0.1)' : '#edf2f7')));
                                        const badgeText = isLive ? '#38b000' : (!isCompleted ? '#64748b' : (isWin ? '#38b000' : (isLoss ? '#ef4444' : '#64748b')));

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
                                <div style="display: flex; flex-direction: column; gap: 8px; max-height: 280px; overflow-y: auto; padding-right: 4px; padding-bottom: 10px;">
                                    ${team.roster.map((player) => {
                                        const pNameLower = (player.name || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                                        const isCap = pNameLower.includes(cleanCapLower) && cleanCapLower.length > 3;
                                        const isMVP = (parseInt(player.pts) === maxPts) && maxPts > 0;
                                        const initial = player.name ? player.name.charAt(0).toUpperCase() : '?';
                                        // Randomish color based on name length
                                        const bgColors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];
                                        const bg = bgColors[(player.name || '').length % bgColors.length];

                                        return `
                                        <div style="background: #f8fafc; border: 1px solid #edf2f7; border-radius: 14px; padding: 10px 14px; display: flex; align-items: center; justify-content: space-between; position: relative;">
                                            <div style="display: flex; align-items: center; gap: 12px; min-width: 0; flex: 1;">
                                                <!-- Avatar -->
                                                <div style="width: 38px; height: 38px; border-radius: 50%; background: ${bg}; color: white; display: flex; align-items: center; justify-content: center; font-size: 1rem; font-weight: 900; box-shadow: 0 3px 8px rgba(0,0,0,0.08); position: relative; flex-shrink: 0;">
                                                    ${initial}
                                                    ${isCap ? `<div style="position:absolute; bottom:-1px; right:-1px; background:#0f172a; border: 1.5px solid #fff; color:#fff; font-size:0.5rem; font-weight:900; width:15px; height:15px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow: 0 1px 3px rgba(0,0,0,0.15);" title="Capitán">C</div>` : ''}
                                                </div>
                                                <!-- Nombre & Badges -->
                                                <div style="min-width: 0; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                                                    <span style="font-size: 0.85rem; color: #0f172a; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 170px;">
                                                        ${player.name}
                                                    </span>
                                                    ${isMVP ? `<span style="background:#eab308; color:#fff; font-size:0.55rem; font-weight:900; padding:2px 6px; border-radius:6px; box-shadow:0 1px 4px rgba(234,179,8,0.25); display: inline-flex; align-items: center; gap: 2px;"><i class="fas fa-fire" style="font-size: 0.5rem;"></i> MVP</span>` : ''}
                                                </div>
                                            </div>
                                            <!-- Puntos -->
                                            <div style="background: rgba(56,176,0,0.08); color: #38b000; font-size: 0.7rem; font-weight: 900; padding: 4px 10px; border-radius: 8px; white-space: nowrap; margin-left: 8px; flex-shrink: 0;">
                                                ${player.pts} PTS
                                            </div>
                                        </div>
                                        `;
                                    }).join('')}
                                </div>
                                ` : `
                                <div style="padding: 30px; text-align: center; color: #94a3b8; font-size: 0.75rem;">
                                    <i class="fas fa-user-slash" style="font-size: 1.5rem; margin-bottom: 8px; color: #cbd5e1;"></i>
                                    <p style="margin: 0; font-weight: 700;">Roster vacío. Esperando a que el bot finalice.</p>
                                </div>
                                `}
                            </div>

                            <!-- 📦 TAB CONTENT: STATS / ESTADÍSTICAS -->
                            <div id="pane-${team.id}-stats" style="display: none; animation: tabFadeIn 0.3s ease-out;">
                                <div style="display: flex; flex-direction: column; gap: 12px; padding: 4px;">
                                    
                                    <!-- Evolution Chart -->
                                    <div style="background: #ffffff; border: 1px solid #edf2f7; border-radius: 16px; padding: 12px; position: relative; box-shadow: 0 4px 15px rgba(0,0,0,0.02);">
                                        <div style="font-size: 0.65rem; color: #64748b; font-weight: 800; text-transform: uppercase; margin-bottom: 10px;">Evolución de Puntos</div>
                                        <div style="height: 100px; width: 100%;">
                                            <canvas id="chart-${team.id}"></canvas>
                                        </div>
                                    </div>

                                    <!-- Win Rate & Sets -->
                                    <div style="display: flex; gap: 10px;">
                                        <div style="flex: 1; background: #f8fafc; border: 1px solid #edf2f7; border-radius: 16px; padding: 15px; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; overflow: hidden;">
                                            <div style="font-size: 0.65rem; color: #64748b; font-weight: 800; text-transform: uppercase; margin-bottom: 5px;">Win Rate</div>
                                            <div style="font-size: 1.8rem; font-weight: 950; color: #0f172a; line-height: 1;">${winRate}%</div>
                                            <div style="position: absolute; bottom: 0; left: 0; height: 4px; background: ${winRate >= 50 ? '#38b000' : '#ef4444'}; width: ${winRate}%;"></div>
                                        </div>
                                        <div style="flex: 1; background: #f8fafc; border: 1px solid #edf2f7; border-radius: 16px; padding: 15px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                                            <div style="font-size: 0.65rem; color: #64748b; font-weight: 800; text-transform: uppercase; margin-bottom: 5px;">Dif. Parejas</div>
                                            <div style="font-size: 1.8rem; font-weight: 950; color: ${setDiffColor}; line-height: 1;">${setDiff > 0 ? '+'+setDiff : setDiff}</div>
                                        </div>
                                    </div>

                                    <!-- Home / Away Performance -->
                                    <div style="background: #f8fafc; border: 1px solid #edf2f7; border-radius: 16px; padding: 15px;">
                                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                            <span style="font-size: 0.7rem; font-weight: 800; color: #0f172a;"><i class="fas fa-home" style="color: #64748b; margin-right: 4px;"></i>Local</span>
                                            <span style="font-size: 0.75rem; font-weight: 900; color: #38b000;">${homeWinRate}% <span style="font-size: 0.6rem; color: #94a3b8; font-weight: 700;">(${homeWins}V - ${homePlayed - homeWins}D)</span></span>
                                        </div>
                                        <div style="width: 100%; background: #e2e8f0; height: 6px; border-radius: 3px; margin-bottom: 15px; overflow: hidden;">
                                            <div style="width: ${homeWinRate}%; background: #38b000; height: 100%; border-radius: 3px;"></div>
                                        </div>

                                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                            <span style="font-size: 0.7rem; font-weight: 800; color: #0f172a;"><i class="fas fa-bus" style="color: #64748b; margin-right: 4px;"></i>Visitante</span>
                                            <span style="font-size: 0.75rem; font-weight: 900; color: ${awayWinRate >= 50 ? '#38b000' : '#ef4444'};">${awayWinRate}% <span style="font-size: 0.6rem; color: #94a3b8; font-weight: 700;">(${awayWins}V - ${awayPlayed - awayWins}D)</span></span>
                                        </div>
                                        <div style="width: 100%; background: #e2e8f0; height: 6px; border-radius: 3px; overflow: hidden;">
                                            <div style="width: ${awayWinRate}%; background: ${awayWinRate >= 50 ? '#38b000' : '#ef4444'}; height: 100%; border-radius: 3px;"></div>
                                        </div>
                                    </div>

                                    <!-- Form / Streak -->
                                    <div style="background: #f8fafc; border: 1px solid #edf2f7; border-radius: 16px; padding: 12px 15px; display: flex; justify-content: space-between; align-items: center;">
                                        <span style="font-size: 0.7rem; font-weight: 800; color: #64748b; text-transform: uppercase;">Forma (Últimos 5)</span>
                                        <div style="display: flex; gap: 4px;">
                                            ${streak.length > 0 ? streak.map(res => `
                                                <div style="width: 20px; height: 20px; border-radius: 50%; background: ${res === 'W' ? '#38b000' : '#ef4444'}; color: white; font-size: 0.5rem; font-weight: 900; display: flex; align-items: center; justify-content: center;">
                                                    ${res === 'W' ? 'V' : 'D'}
                                                </div>
                                            `).join('') : '<span style="font-size: 0.7rem; color: #94a3b8; font-weight: 700;">Sin datos</span>'}
                                        </div>
                                    </div>

                                </div>
                            </div>

                            <!-- 📲 FOOTER ACTION ROW -->
                            <div style="display: flex; gap: 8px; margin-top: 15px;">
                                <button id="share-btn-${team.id}" onclick="window.TeamView.openShareModal('${team.id}', 'class')" 
                                        style="flex: 1; background: #25D366; color: white; border: none; padding: 12px; border-radius: 16px; font-weight: 900; font-size: 0.75rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 4px 12px rgba(37,211,102,0.15); transition: all 0.2s ease;">
                                    <i class="fab fa-whatsapp" style="font-size: 0.9rem;"></i> COMPARTIR TABLA
                                </button>
                                <a href="${officialLink}" target="_blank" onclick="event.stopPropagation();" 
                                   style="background: #0f172a; color: white; border: none; padding: 12px 16px; border-radius: 16px; font-weight: 900; font-size: 0.7rem; text-decoration: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: 0.2s;">
                                    WEB OFICIAL <i class="fas fa-external-link-alt" style="font-size: 0.6rem; color:#38b000;"></i>
                                </a>
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
            const panes = ['class', 'sched', 'rost', 'stats'];
            
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

            // Actualizar dinámicamente el botón de compartir inferior
            const shareBtn = document.getElementById(`share-btn-${teamId}`);
            if (shareBtn) {
                let label = 'COMPARTIR TABLA';
                if (tabName === 'class') label = 'COMPARTIR TABLA';
                else if (tabName === 'sched') label = 'COMPARTIR PARTIDOS';
                else if (tabName === 'rost') label = 'COMPARTIR SQUAD';
                else if (tabName === 'stats') label = 'COMPARTIR ESTADÍSTICAS';
                
                shareBtn.innerHTML = `<i class="fab fa-whatsapp" style="font-size: 0.9rem;"></i> ${label}`;
                shareBtn.setAttribute('onclick', `window.TeamView.openShareModal('${teamId}', '${tabName}')`);
            }

            // Chart Rendering
            if (tabName === 'stats') {
                const ctx = document.getElementById(`chart-${teamId}`);
                if (ctx && !ctx.dataset.rendered && window.Chart) {
                    ctx.dataset.rendered = 'true';
                    const chartData = this.chartsData[teamId];
                    if (chartData && chartData.labels.length > 1) {
                        new Chart(ctx, {
                            type: 'line',
                            data: {
                                labels: chartData.labels,
                                datasets: [{
                                    label: 'Puntos Totales',
                                    data: chartData.data,
                                    borderColor: '#38b000',
                                    backgroundColor: 'rgba(56, 176, 0, 0.1)',
                                    borderWidth: 3,
                                    pointBackgroundColor: '#ffffff',
                                    pointBorderColor: '#38b000',
                                    pointBorderWidth: 2,
                                    pointRadius: 4,
                                    pointHoverRadius: 6,
                                    tension: 0.3,
                                    fill: true
                                }]
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: {
                                    y: { 
                                        beginAtZero: true, 
                                        ticks: { 
                                            stepSize: 1, 
                                            precision: 0,
                                            font: { size: 10, family: 'Outfit' } 
                                        }, 
                                        grid: { borderDash: [4, 4] } 
                                    },
                                    x: { ticks: { font: { size: 10, family: 'Outfit' } }, grid: { display: false } }
                                },
                                animation: { duration: 800, easing: 'easeOutQuart' }
                            }
                        });
                    }
                }
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

        filterDOM() {
            const query = (this.searchQuery || '').trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            
            // Mostrar/ocultar el botón de limpiar
            const clearBtn = document.getElementById('clear-search-btn');
            if (clearBtn) {
                clearBtn.style.display = query ? 'block' : 'none';
            }

            // Filtrar las tarjetas en el DOM
            const grid = document.getElementById('teams-list-grid');
            if (!grid) return;

            const cards = grid.getElementsByClassName('team-card');
            let visibleCount = 0;

            // Obtener los equipos correspondientes a la categoría activa actual
            const filteredTeams = this.activeCategory === 'Todos'
                ? this.lastTeams
                : this.lastTeams.filter(t => t.category === this.activeCategory);

            for (let card of cards) {
                const idAttr = card.id; // 'team-' + teamId
                if (!idAttr) continue;
                const teamId = idAttr.replace('team-', '');
                const team = filteredTeams.find(t => t.id === teamId);

                if (!team) {
                    // No pertenece a la categoría activa actual o no se encuentra
                    card.style.display = 'none';
                    continue;
                }

                // Criterio de búsqueda: nombre de equipo, capitán, subcapitán, o jugadores del roster
                const teamName = (team.name || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                const captain = (team.captain || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                
                // Mapear capitanes y subcapitanes personalizados por si acaso
                const cleanCap = (team.name.includes('3MB') || team.name.includes('3M B')) ? 'miguel angel mendez' : 
                                 (team.name.includes('3MA') || team.name.includes('3M A')) ? 'abraham rosell' : captain;
                
                const cleanSubcap = (team.name.includes('3MB') || team.name.includes('3M B')) ? 'alex cuadra cabezas' : 
                                    (team.name.includes('3MA') || team.name.includes('3M A')) ? 'miquel munoz' : 
                                    (team.name.includes('4MA') || team.name.includes('4M A') || team.name === 'SOMOS PÁDEL BCN 4M') ? 'alejandro coscolin' : 
                                    (team.name.includes('4FA') || team.name === 'SOMOS PÁDEL BCN 4FA') ? 'nadia flora costa' : '';

                // Comprobar si alguno de los jugadores del roster coincide
                const matchesRoster = team.roster && team.roster.some(player => {
                    const playerName = (player.name || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    return playerName.includes(query);
                });

                const matchesSearch = teamName.includes(query) || 
                                      cleanCap.includes(query) || 
                                      cleanSubcap.includes(query) || 
                                      matchesRoster;

                if (matchesSearch) {
                    card.style.display = 'block';
                    visibleCount++;
                } else {
                    card.style.display = 'none';
                }
            }

            // Mostrar/ocultar el mensaje de "no resultados"
            const noResultsMsg = document.getElementById('no-results-message');
            if (noResultsMsg) {
                if (visibleCount === 0 && filteredTeams.length > 0) {
                    noResultsMsg.style.display = 'block';
                } else {
                    noResultsMsg.style.display = 'none';
                }
            }

            // Actualizar la métrica de cantidad de equipos en tiempo real
            const metricTeamsCount = document.getElementById('metric-teams-count');
            if (metricTeamsCount) {
                metricTeamsCount.innerText = visibleCount;
            }
        }

        // ==================================================
        // 💎 PREMIUM NEXT MATCHES SUMMARY MODAL ("WOW" SYSTEM)
        // ==================================================

        /**
         * Genera el HTML del cromo de resumen de la próxima jornada (1080x1920).
         * Se usa tanto para la previsualización como para la captura con html2canvas.
         */
        getNextMatchesSummaryStoryHTML(teams, isForCapture = false) {
            const now = new Date();
            const dateStr = now.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });

            // Recopilar el próximo partido de cada equipo
            const teamMatches = teams.map(team => {
                let nextMatch = null;
                if (team.schedule && team.schedule.length > 0) {
                    const sortedMatches = [...team.schedule].sort((a, b) => parseInt(a.j) - parseInt(b.j));
                    const pendingMatches = sortedMatches.filter(m => m.status === 'pending' || m.status === 'scheduled' || m.status === 'upcoming');
                    if (pendingMatches.length > 0) {
                        nextMatch = pendingMatches[0];
                    }
                }
                return { team, nextMatch };
            });

            const cardStyle = isForCapture ? 'width: 1080px; height: 1920px;' : 'width: 100%; height: 100%;';

            // Construir las filas de cada equipo
            const teamRows = teamMatches.map((tm) => {
                const { team, nextMatch } = tm;
                const teamShortName = team.name.replace('SOMOS PÁDEL BCN ', '').replace('SOMOS PÁDEL ', '');

                if (nextMatch) {
                    const isHome = nextMatch.isHome;
                    const homeAwayBg = isHome ? 'rgba(204,255,0,0.12)' : 'rgba(96,165,250,0.12)';
                    const homeAwayColor = isHome ? '#CCFF00' : '#60a5fa';
                    const homeAwayText = isHome ? '🏠 LOCAL' : '✈️ VISIT.';
                    return `
                        <div style="background: linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%); border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; padding: 28px 32px; display: flex; flex-direction: column; gap: 10px; position: relative; overflow: hidden;">
                            <div style="position: absolute; top: 0; left: 0; width: 5px; height: 100%; background: linear-gradient(180deg, #CCFF00, #38b000); border-radius: 5px 0 0 5px;"></div>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div style="font-size: 30px; font-weight: 950; color: #CCFF00; text-transform: uppercase; letter-spacing: 0.5px;">${teamShortName}</div>
                                <div style="background: ${homeAwayBg}; color: ${homeAwayColor}; padding: 7px 18px; border-radius: 30px; font-size: 20px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">${homeAwayText}</div>
                            </div>
                            <div style="font-size: 34px; font-weight: 800; color: white; margin: 4px 0 2px;">vs ${nextMatch.opponent}</div>
                            <div style="display: flex; gap: 24px; align-items: center; flex-wrap: wrap;">
                                <div style="display: flex; align-items: center; gap: 10px; color: #94a3b8; font-size: 26px; font-weight: 700;"><span style="color: #CCFF00;">📅</span> ${nextMatch.date}${nextMatch.time ? ' • ' + nextMatch.time : ''}</div>
                                <div style="display: flex; align-items: center; gap: 10px; color: #94a3b8; font-size: 26px; font-weight: 700;"><span style="color: #CCFF00;">📍</span> ${nextMatch.venue}</div>
                            </div>
                            <div style="color: #64748b; font-size: 22px; font-weight: 700;">Jornada ${nextMatch.j} • ${team.group || team.division}</div>
                        </div>
                    `;
                } else {
                    return `
                        <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 24px; padding: 24px 32px; display: flex; align-items: center; gap: 16px; opacity: 0.5;">
                            <div style="font-size: 30px; font-weight: 950; color: #64748b; text-transform: uppercase;">${teamShortName}</div>
                            <div style="color: #475569; font-size: 26px; font-weight: 700;">— Sin partidos pendientes</div>
                        </div>
                    `;
                }
            }).join('');

            return `
                <div style="${cardStyle} background: linear-gradient(180deg, #07070a 0%, #0a1014 25%, #080d12 75%, #07070a 100%); font-family: 'Outfit', sans-serif; display: flex; flex-direction: column; position: relative; overflow: hidden; box-sizing: border-box; padding: 60px 50px;">
                    <!-- Background glow effects -->
                    <div style="position: absolute; top: -120px; right: -80px; width: 450px; height: 450px; background: radial-gradient(circle, rgba(204,255,0,0.07), transparent 70%); pointer-events: none;"></div>
                    <div style="position: absolute; bottom: -120px; left: -80px; width: 400px; height: 400px; background: radial-gradient(circle, rgba(56,176,0,0.05), transparent 70%); pointer-events: none;"></div>
                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 600px; height: 600px; background: radial-gradient(circle, rgba(204,255,0,0.02), transparent 60%); pointer-events: none;"></div>

                    <!-- Header -->
                    <div style="text-align: center; margin-bottom: 36px; flex-shrink: 0;">
                        <div style="font-size: 22px; font-weight: 900; color: #475569; letter-spacing: 5px; text-transform: uppercase; margin-bottom: 16px;">LLIGA GUINOTPRUNERA 2025-2026</div>
                        <div style="display: inline-block; background: linear-gradient(135deg, #CCFF00 0%, #38b000 100%); padding: 16px 50px; border-radius: 50px; margin-bottom: 20px; box-shadow: 0 8px 30px rgba(204,255,0,0.2);">
                            <span style="font-size: 38px; font-weight: 950; color: #000; text-transform: uppercase; letter-spacing: 3px;">⚡ PRÓXIMA JORNADA ⚡</span>
                        </div>
                        <div style="font-size: 48px; font-weight: 950; color: white; text-transform: uppercase; letter-spacing: -0.5px; line-height: 1.15;">EQUIPOS <span style="background: linear-gradient(135deg, #CCFF00, #38b000); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">SOMOS PÁDEL BCN</span></div>
                        <div style="width: 100px; height: 4px; background: linear-gradient(90deg, #CCFF00, #38b000); margin: 22px auto 0; border-radius: 4px;"></div>
                    </div>

                    <!-- Team cards -->
                    <div style="display: flex; flex-direction: column; gap: 16px; flex: 1; justify-content: center;">
                        ${teamRows}
                    </div>

                    <!-- Footer -->
                    <div style="text-align: center; margin-top: 36px; padding-top: 28px; border-top: 1px solid rgba(255,255,255,0.06); flex-shrink: 0;">
                        <div style="font-size: 28px; font-weight: 800; color: #94a3b8;">🎾 ¡Vamos equipo! Apoya a nuestros jugadores 💪🔥</div>
                        <div style="font-size: 20px; color: #475569; font-weight: 700; margin-top: 12px;">${dateStr} • somospadel.es</div>
                    </div>
                </div>
            `;
        }

        /**
         * Retorna la URL oficial de producción para compartir.
         */
        getCleanShareUrl() {
            return 'https://somospadelbarcelona.github.io/Americanas-somospadel/';
        }

        /**
         * Genera el texto formateado para WhatsApp con los datos reales de la próxima jornada.
         */
        getSummaryWhatsAppText(teams) {
            let text = `🏆 *PRÓXIMA JORNADA – SOMOS PÁDEL BCN* 🏆\n`;
            text += `🔥 _¡El espectáculo de la Lliga Guinotprunera no se detiene!_ 🔥\n\n`;
            text += `🎾 Apoya a nuestros equipos y no te pierdas ningún partidazo de esta jornada. ¡A darlo todo en la pista! 💪💥\n\n`;
            text += `───────────────────\n`;
            text += `⚔️ *NUESTROS ENFRENTAMIENTOS* ⚔️\n`;
            text += `───────────────────\n\n`;

            teams.forEach(team => {
                const teamShortName = team.name.replace('SOMOS PÁDEL BCN ', '').replace('SOMOS PÁDEL ', '').toUpperCase();
                
                let nextMatch = null;
                if (team.schedule && team.schedule.length > 0) {
                    const sortedMatches = [...team.schedule].sort((a, b) => parseInt(a.j) - parseInt(b.j));
                    const pendingMatches = sortedMatches.filter(m => m.status === 'pending' || m.status === 'scheduled' || m.status === 'upcoming');
                    if (pendingMatches.length > 0) {
                        nextMatch = pendingMatches[0];
                    }
                }

                if (nextMatch) {
                    const homeAwayIcon = nextMatch.isHome ? '🏠' : '✈️';
                    const homeAwayLabel = nextMatch.isHome ? 'LOCAL' : 'VISITANTE';
                    
                    text += `🟢 *${teamShortName}* (Jornada ${nextMatch.j})\n`;
                    text += `   🆚 *${nextMatch.opponent}*\n`;
                    text += `   📅 ${nextMatch.date} ${nextMatch.time ? '• ⏰ ' + nextMatch.time : ''}\n`;
                    text += `   📍 Club: _${nextMatch.venue}_\n`;
                    text += `   ${homeAwayIcon} _Jugamos como ${homeAwayLabel}_\n\n`;
                } else {
                    text += `⚪ *${teamShortName}*\n`;
                    text += `   🏁 _Sin partidos programados esta jornada_\n\n`;
                }
            });

            text += `───────────────────\n`;
            text += `📢 *¡SÍGUENOS Y COMPARTE!* 📢\n`;
            text += `───────────────────\n`;
            text += `📸 Instagram: *@somospadelbarcelona_* ❤️🎾\n\n`;
            text += `🌐 Marcadores y clasificaciones en tiempo real:\n`;
            
            const appUrl = this.getCleanShareUrl();
            text += `📲 Haz click aquí: ${appUrl}#teams 🚀🔥`;
            
            return text;
        }

        openNextMatchesSummaryModal() {
            const teams = this.lastTeams || [];
            if (teams.length === 0) {
                alert("No hay equipos cargados.");
                return;
            }

            // Haptic
            if (window.navigator.vibrate) window.navigator.vibrate(25);

            // Generar el texto del resumen con datos reales
            const whatsAppText = this.getSummaryWhatsAppText(teams);

            // Create overlay
            const overlay = document.createElement('div');
            overlay.id = 'next-matches-summary-overlay';
            overlay.style.cssText = `
                position: fixed; inset: 0; background: rgba(8, 8, 12, 0.85); z-index: 120000;
                display: flex; align-items: center; justify-content: center;
                font-family: 'Outfit', sans-serif; backdrop-filter: blur(25px);
                -webkit-backdrop-filter: blur(25px); opacity: 0; transition: opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1);
                padding: 15px; box-sizing: border-box; overflow-y: auto;
            `;

            overlay.innerHTML = `
                <style>
                    #summary-modal-container {
                        background: rgba(13, 13, 17, 0.95);
                        border: 1.5px solid rgba(204, 255, 0, 0.25);
                        border-radius: 32px;
                        width: 100%;
                        max-width: 920px;
                        display: flex;
                        flex-direction: column;
                        gap: 20px;
                        padding: 28px;
                        box-sizing: border-box;
                        position: relative;
                        box-shadow: 0 35px 80px rgba(0,0,0,0.8);
                        transform: scale(0.9);
                        transition: transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                        max-height: 92vh;
                        overflow-y: auto;
                        backdrop-filter: blur(15px);
                        -webkit-backdrop-filter: blur(15px);
                    }

                    #summary-inner-grid {
                        display: grid;
                        grid-template-columns: 1.2fr 1fr;
                        gap: 30px;
                        align-items: center;
                    }

                    #summary-preview-column {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        background: #060608;
                        border: 1.5px dashed rgba(255,255,255,0.08);
                        border-radius: 24px;
                        padding: 24px;
                        position: relative;
                        overflow: hidden;
                        min-height: 520px;
                        box-shadow: inset 0 4px 20px rgba(0,0,0,0.6);
                    }

                    .summary-textarea {
                        width: 100%;
                        height: 150px;
                        background: rgba(255,255,255,0.03);
                        border: 1px solid rgba(255,255,255,0.1);
                        border-radius: 16px;
                        color: #cbd5e1;
                        padding: 12px 15px;
                        font-family: 'Outfit', monospace, sans-serif;
                        font-size: 0.75rem;
                        line-height: 1.45;
                        resize: none;
                        outline: none;
                        transition: border-color 0.25s;
                    }
                    .summary-textarea:focus {
                        border-color: #CCFF00;
                    }

                    @media (max-width: 992px) {
                        #summary-modal-container {
                            padding: 20px !important;
                            border-radius: 24px !important;
                            max-height: 95vh !important;
                            gap: 15px !important;
                        }
                        #summary-inner-grid {
                            grid-template-columns: 1fr !important;
                            gap: 18px !important;
                        }
                        #summary-preview-column {
                            min-height: auto !important;
                            padding: 15px 10px !important;
                            order: 2;
                        }
                        #summary-controls-column {
                            order: 1;
                        }
                        #summary-helper-text {
                            font-size: 0.6rem !important;
                            padding: 6px 12px !important;
                            position: relative !important;
                            bottom: auto !important;
                            margin-top: 10px !important;
                        }
                    }
                </style>

                <div id="summary-modal-container">
                    <!-- Glow effect -->
                    <div style="position: absolute; top: -50px; right: -50px; width: 150px; height: 150px; background: #CCFF00; filter: blur(80px); opacity: 0.12; pointer-events: none;"></div>

                    <!-- Close button -->
                    <button onclick="window.TeamView.closeNextMatchesSummaryModal()" style="position: absolute; top: 20px; right: 20px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: #cbd5e1; font-size: 1.1rem; width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; z-index: 10;" onmouseover="this.style.background='rgba(239, 68, 68, 0.2)'; this.style.color='white';" onmouseout="this.style.background='rgba(255,255,255,0.06)'; this.style.color='#cbd5e1';">
                        <i class="fas fa-times"></i>
                    </button>

                    <!-- Header -->
                    <div style="text-align: left; padding-right: 50px;">
                        <span style="font-size: 0.7rem; color: #CCFF00; font-weight: 900; letter-spacing: 2px; text-transform: uppercase;">PREMIUM SOCIAL SHARING</span>
                        <h2 style="color: white; font-weight: 950; font-size: 1.5rem; margin: 4px 0 0; text-transform: uppercase; letter-spacing: -0.5px;">
                            RESUMEN DE LA <span style="color: #38b000;">PRÓXIMA JORNADA</span>
                        </h2>
                    </div>

                    <!-- Inner grid layout: preview + controls -->
                    <div id="summary-inner-grid">

                        <!-- COLUMN 1: LIVE PREVIEW OF THE CROMO -->
                        <div id="summary-preview-column">
                            <div id="summary-preview-sizer" style="position: relative; overflow: visible; display: flex; align-items: center; justify-content: center; transition: all 0.25s ease;">
                                <div id="summary-preview-scale-wrapper" style="position: absolute; transform-origin: top left; width: 1080px; height: 1920px; display: flex; align-items: center; justify-content: center; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.6); background: #07070a;">
                                    <div id="summary-preview-content" style="width: 100%; height: 100%;"></div>
                                </div>
                            </div>
                            <div id="summary-helper-text" style="position: absolute; bottom: 12px; background: rgba(0,0,0,0.85); border: 1px solid rgba(255,255,255,0.1); padding: 8px 16px; border-radius: 30px; font-size: 0.65rem; color: rgba(255,255,255,0.85); font-weight: 800; pointer-events: none; display: flex; align-items: center; gap: 6px; z-index: 10;">
                                <i class="fas fa-info-circle" style="color: #CCFF00;"></i> CARTELERA ALTA RESOLUCIÓN (9:16)
                            </div>
                        </div>

                        <!-- COLUMN 2: CONTROLS & ACTIONS -->
                        <div style="display: flex; flex-direction: column; gap: 16px;" id="summary-controls-column">

                            <!-- Tip -->
                            <div style="background: rgba(204,255,0,0.04); border: 1px solid rgba(204,255,0,0.12); border-radius: 16px; padding: 12px 15px; display: flex; align-items: center; gap: 10px; font-size: 0.75rem; color: #cbd5e1; font-weight: 700; line-height: 1.35;">
                                <i class="fas fa-lightbulb" style="color: #CCFF00; font-size: 1.1rem; flex-shrink: 0;"></i>
                                <span><strong>Tip Premium:</strong> Descarga la cartelera en alta calidad y compártela en tus redes sociales o pégala en WhatsApp.</span>
                            </div>

                            <!-- WhatsApp Text Box -->
                            <div style="display: flex; flex-direction: column; gap: 6px;">
                                <span style="font-size: 0.65rem; color: #64748b; font-weight: 900; letter-spacing: 1px; text-transform: uppercase;">TEXTO PARA WHATSAPP</span>
                                <textarea id="summary-text-box" class="summary-textarea" readonly>${whatsAppText}</textarea>
                            </div>

                            <!-- Actions Group -->
                            <div style="display: flex; flex-direction: column; gap: 10px;">
                                <span style="font-size: 0.65rem; color: #64748b; font-weight: 900; letter-spacing: 1px; text-transform: uppercase;">ACCIONES DE COMPARTIR</span>

                                <!-- WhatsApp share -->
                                <button onclick="window.open('https://api.whatsapp.com/send?text=' + encodeURIComponent(document.getElementById('summary-text-box').value), '_blank')" style="background: #25D366; color: white; border: none; padding: 16px; border-radius: 16px; font-weight: 950; font-size: 0.9rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; box-shadow: 0 10px 25px rgba(37,211,102,0.25); text-transform: uppercase; transition: all 0.2s ease;" onmouseover="this.style.transform='translateY(-2px)';" onmouseout="this.style.transform='none';">
                                    <i class="fab fa-whatsapp" style="font-size: 1.25rem;"></i> ENVIAR TEXTO A WHATSAPP
                                </button>

                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                    <!-- Copy image to clipboard -->
                                    <button id="summary-copy-img-btn" onclick="window.TeamView.copySummaryImageToClipboard('summary-copy-img-btn')" style="background: #0f172a; color: white; border: 1.5px solid rgba(255,255,255,0.15); padding: 16px; border-radius: 16px; font-weight: 900; font-size: 0.75rem; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; transition: all 0.2s;" onmouseover="this.style.borderColor='#CCFF00'; this.style.background='rgba(255,255,255,0.02)';" onmouseout="this.style.borderColor='rgba(255,255,255,0.15)'; this.style.background='#0f172a';">
                                        <i class="far fa-clipboard" style="font-size: 1.2rem; color: #CCFF00;"></i>
                                        <span>COPIAR IMAGEN</span>
                                    </button>

                                    <!-- Download image -->
                                    <button id="summary-dl-btn" onclick="window.TeamView.downloadSummaryImage('summary-dl-btn')" style="background: #CCFF00; color: #000000; border: none; padding: 16px; border-radius: 16px; font-weight: 950; font-size: 0.75rem; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 6px 15px rgba(204,255,0,0.2); transition: all 0.2s;" onmouseover="this.style.transform='translateY(-2px)';" onmouseout="this.style.transform='none';">
                                        <i class="fas fa-download" style="font-size: 1.1rem;"></i>
                                        <span>DESCARGAR FOTO</span>
                                    </button>
                                </div>

                                <!-- Copy text -->
                                <button id="summary-copy-txt-btn" onclick="window.TeamView.copySummaryToClipboard()" style="background: transparent; color: #cbd5e1; border: 1.5px solid rgba(255,255,255,0.1); padding: 12px; border-radius: 16px; font-weight: 900; font-size: 0.7rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s;" onmouseover="this.style.borderColor='rgba(255,255,255,0.25)';" onmouseout="this.style.borderColor='rgba(255,255,255,0.1)';">
                                    <i class="far fa-copy" style="color: #94a3b8;"></i> COPIAR TEXTO
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            // Render the preview cromo inside the preview column
            const previewContent = document.getElementById('summary-preview-content');
            if (previewContent) {
                previewContent.innerHTML = this.getNextMatchesSummaryStoryHTML(teams, false);
            }

            // Adjust CSS responsively to scale the card
            this.adjustSummaryPreviewScale();
            this._boundAdjustSummaryScale = () => this.adjustSummaryPreviewScale();
            window.addEventListener('resize', this._boundAdjustSummaryScale);

            // Trigger animations
            setTimeout(() => {
                overlay.style.opacity = '1';
                const container = document.getElementById('summary-modal-container');
                if (container) container.style.transform = 'scale(1)';
            }, 50);
        }

        /**
         * Calcula y aplica la escala del cromo de resumen dentro de la columna de previsualización.
         */
        adjustSummaryPreviewScale() {
            const previewColumn = document.getElementById('summary-preview-column');
            const scaleWrapper = document.getElementById('summary-preview-scale-wrapper');
            const sizer = document.getElementById('summary-preview-sizer');
            if (!previewColumn || !scaleWrapper) return;

            const padding = 24;
            const containerWidth = previewColumn.clientWidth - padding;

            const isMobile = window.innerWidth <= 992;
            const maxAvailableHeight = isMobile ? Math.min(window.innerHeight * 0.42, 380) : Math.min(window.innerHeight * 0.62, 600);

            const cardWidth = 1080;
            const cardHeight = 1920;

            const scaleX = containerWidth / cardWidth;
            const scaleY = maxAvailableHeight / cardHeight;
            let scale = Math.min(scaleX, scaleY);

            const maxScale = isMobile ? 0.22 : 0.32;
            const finalScale = Math.min(scale, maxScale);

            scaleWrapper.style.transform = `scale(${finalScale})`;

            if (sizer) {
                sizer.style.width = `${cardWidth * finalScale}px`;
                sizer.style.height = `${cardHeight * finalScale}px`;
            }
        }

        closeNextMatchesSummaryModal() {
            const overlay = document.getElementById('next-matches-summary-overlay');
            if (overlay) {
                if (this._boundAdjustSummaryScale) {
                    window.removeEventListener('resize', this._boundAdjustSummaryScale);
                }
                overlay.style.opacity = '0';
                const container = document.getElementById('summary-modal-container');
                if (container) container.style.transform = 'scale(0.9)';
                setTimeout(() => overlay.remove(), 350);
            }
        }

        async copySummaryToClipboard() {
            const btn = document.getElementById('summary-copy-txt-btn');
            const textBox = document.getElementById('summary-text-box');
            if (!textBox) return;

            if (btn) {
                btn.disabled = true;
                btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> COPIANDO...`;
            }

            try {
                await navigator.clipboard.writeText(textBox.value);
                if (btn) {
                    btn.innerHTML = `<i class="fas fa-check"></i> ¡TEXTO COPIADO!`;
                    btn.style.borderColor = '#38b000';
                    btn.style.color = '#CCFF00';
                    setTimeout(() => {
                        btn.disabled = false;
                        btn.style.borderColor = 'rgba(255,255,255,0.1)';
                        btn.style.color = '#cbd5e1';
                        btn.innerHTML = `<i class="far fa-copy" style="color: #94a3b8;"></i> COPIAR TEXTO`;
                    }, 2500);
                }
            } catch (err) {
                console.error("Error copying text:", err);
                alert("No se pudo copiar el texto automáticamente.");
                if (btn) {
                    btn.disabled = false;
                    btn.style.borderColor = 'rgba(255,255,255,0.1)';
                    btn.style.color = '#cbd5e1';
                    btn.innerHTML = `<i class="far fa-copy" style="color: #94a3b8;"></i> COPIAR TEXTO`;
                }
            }
        }

        /**
         * Descarga la cartelera de la próxima jornada como imagen PNG en alta calidad.
         */
        async downloadSummaryImage(btnId) {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> GENERANDO...`;
            }

            const teams = this.lastTeams || [];

            try {
                // Render a full 1080x1920 container off-screen for capture
                const container = document.createElement('div');
                container.style.cssText = "position: fixed; top: -9999px; left: -9999px; width: 1080px; height: 1920px; overflow: hidden; z-index: -9999;";
                container.innerHTML = this.getNextMatchesSummaryStoryHTML(teams, true);
                document.body.appendChild(container);

                await new Promise(resolve => setTimeout(resolve, 500));

                const canvas = await html2canvas(container, {
                    scale: 2,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#07070a',
                    logging: false
                });

                document.body.removeChild(container);

                const dataUrl = canvas.toDataURL('image/png', 1.0);
                const link = document.createElement('a');
                link.download = `SomosPadel_ProximaJornada_${new Date().toISOString().slice(0,10)}.png`;
                link.href = dataUrl;
                link.click();

                if (btn) {
                    btn.innerHTML = `<i class="fas fa-check"></i> ¡GUARDADA!`;
                    btn.style.background = '#38b000';
                    btn.style.color = '#fff';
                    setTimeout(() => {
                        btn.disabled = false;
                        btn.style.background = '#CCFF00';
                        btn.style.color = '#000000';
                        btn.innerHTML = `<i class="fas fa-download"></i> DESCARGAR FOTO`;
                    }, 2500);
                }
            } catch (err) {
                console.error("Error downloading summary image:", err);
                alert("Error al generar la imagen. Por favor, reintenta.");
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = `<i class="fas fa-exclamation-triangle"></i> REINTENTAR`;
                }
            }
        }

        /**
         * Copia la cartelera de la próxima jornada al portapapeles como imagen.
         */
        async copySummaryImageToClipboard(btnId) {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> PREPARANDO...`;
            }

            const teams = this.lastTeams || [];

            try {
                const container = document.createElement('div');
                container.style.cssText = "position: fixed; top: -9999px; left: -9999px; width: 1080px; height: 1920px; overflow: hidden; z-index: -9999;";
                container.innerHTML = this.getNextMatchesSummaryStoryHTML(teams, true);
                document.body.appendChild(container);

                await new Promise(resolve => setTimeout(resolve, 500));

                const canvas = await html2canvas(container, {
                    scale: 1.5,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#07070a',
                    logging: false
                });

                document.body.removeChild(container);

                canvas.toBlob(async (blob) => {
                    if (!blob) {
                        throw new Error("No se pudo crear el blob de la imagen.");
                    }
                    try {
                        const item = new ClipboardItem({ "image/png": blob });
                        await navigator.clipboard.write([item]);

                        if (btn) {
                            btn.innerHTML = `<i class="fas fa-check"></i> ¡IMAGEN COPIADA!`;
                            btn.style.borderColor = '#38b000';
                            btn.style.color = '#CCFF00';
                            setTimeout(() => {
                                btn.disabled = false;
                                btn.style.borderColor = 'rgba(255,255,255,0.15)';
                                btn.style.color = 'white';
                                btn.innerHTML = `<i class="far fa-clipboard" style="font-size: 1.2rem; color: #CCFF00;"></i><span>COPIAR IMAGEN</span>`;
                            }, 2500);
                        }
                    } catch (clipErr) {
                        console.warn("Restricciones del portapapeles, activando fallback de descarga:", clipErr);
                        this.downloadSummaryImage(btnId);
                    }
                }, 'image/png');

            } catch (err) {
                console.error("Error copying summary image:", err);
                alert("Restricción del navegador. Se procederá a la descarga.");
                this.downloadSummaryImage(btnId);
            }
        }

        // ==========================================
        // 💎 PREMIUM TEAM SHARE MODAL ("WOW" SYSTEM)
        // ==========================================

        openShareModal(teamId, initialTab = 'class') {
            const team = this.lastTeams.find(t => t.id === teamId);
            if (!team) {
                alert("No se encontraron los datos del equipo.");
                return;
            }

            // Inicializar filtro de jornadas para el cromo de calendario
            this.shareScheduleFilter = 'smart';

            // Haptic
            if (window.navigator.vibrate) window.navigator.vibrate(25);

            // Create overlay
            const overlay = document.createElement('div');
            overlay.id = 'team-share-overlay';
            overlay.className = 'animate-fade-in';
            overlay.style.cssText = `
                position: fixed; inset: 0; background: rgba(8, 8, 12, 0.85); z-index: 120000;
                display: flex; align-items: center; justify-content: center;
                font-family: 'Outfit', sans-serif; backdrop-filter: blur(25px);
                -webkit-backdrop-filter: blur(25px); opacity: 0; transition: opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1);
                padding: 15px; box-sizing: border-box; overflow-y: auto;
            `;

            overlay.innerHTML = `
                <style>
                    #team-share-container {
                        background: rgba(13, 13, 17, 0.95); 
                        border: 1.5px solid rgba(204, 255, 0, 0.25); 
                        border-radius: 32px; 
                        width: 100%; 
                        max-width: 920px; 
                        display: flex;
                        flex-direction: column;
                        gap: 20px; 
                        padding: 28px; 
                        box-sizing: border-box; 
                        position: relative; 
                        box-shadow: 0 35px 80px rgba(0,0,0,0.8); 
                        transform: scale(0.9); 
                        transition: transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                        max-height: 92vh;
                        overflow-y: auto;
                        backdrop-filter: blur(15px);
                        -webkit-backdrop-filter: blur(15px);
                    }
                    
                    #share-inner-grid {
                        display: grid; 
                        grid-template-columns: 1.2fr 1fr; 
                        gap: 30px; 
                        align-items: center;
                    }

                    #preview-column {
                        display: flex; 
                        flex-direction: column; 
                        align-items: center; 
                        justify-content: center; 
                        background: #060608; 
                        border: 1.5px dashed rgba(255,255,255,0.08); 
                        border-radius: 24px; 
                        padding: 24px; 
                        position: relative; 
                        overflow: hidden; 
                        min-height: 520px; 
                        box-shadow: inset 0 4px 20px rgba(0,0,0,0.6);
                    }

                    @media (max-width: 992px) {
                        #team-share-container {
                            padding: 20px !important;
                            border-radius: 24px !important;
                            max-height: 95vh !important;
                            gap: 15px !important;
                        }
                        #share-inner-grid {
                            grid-template-columns: 1fr !important;
                            gap: 18px !important;
                        }
                        #preview-column {
                            min-height: auto !important;
                            padding: 15px 10px !important;
                            order: 2; /* Cromo abajo para mejor lectura y selector arriba */
                        }
                        #controls-column {
                            order: 1; /* Selector y botones arriba */
                        }
                        #modal-helper-text {
                            font-size: 0.6rem !important;
                            padding: 6px 12px !important;
                            position: relative !important;
                            bottom: auto !important;
                            margin-top: 10px !important;
                        }
                    }
                </style>

                <div id="team-share-container">
                    <!-- Glow effect -->
                    <div style="position: absolute; top: -50px; right: -50px; width: 150px; height: 150px; background: #CCFF00; filter: blur(80px); opacity: 0.12; pointer-events: none;"></div>
                    
                    <!-- Close button -->
                    <button onclick="window.TeamView.closeShareModal()" style="position: absolute; top: 20px; right: 20px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: #cbd5e1; font-size: 1.1rem; width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; z-index: 10;" onmouseover="this.style.background='rgba(239, 68, 68, 0.2)'; this.style.color='white';" onmouseout="this.style.background='rgba(255,255,255,0.06)'; this.style.color='#cbd5e1';">
                        <i class="fas fa-times"></i>
                    </button>

                    <!-- Header -->
                    <div style="text-align: left; padding-right: 50px;">
                        <span style="font-size: 0.7rem; color: #CCFF00; font-weight: 900; letter-spacing: 2px; text-transform: uppercase;">PRO SOCIAL GENERATOR</span>
                        <h2 style="color: white; font-weight: 950; font-size: 1.5rem; margin: 4px 0 0; text-transform: uppercase; letter-spacing: -0.5px;">
                            COMPARTE TU EQUIPO <span style="color: #38b000;">EN WHATSAPP</span>
                        </h2>
                    </div>

                    <!-- Inner grid layout for preview + controls -->
                    <div id="share-inner-grid">
                        
                        <!-- COLUMN 1: LIVE INTERACTIVE PREVIEW -->
                        <div id="preview-column">
                            
                            <!-- Container Sizer que define el espacio real ocupado por el cromo escalado -->
                            <div id="preview-container-sizer" style="position: relative; overflow: visible; display: flex; align-items: center; justify-content: center; transition: all 0.25s ease;">
                                
                                <!-- Scale Wrapper inside Sizer -->
                                <div id="preview-scale-wrapper" style="position: absolute; transform-origin: top left; width: 1080px; height: 1920px; display: flex; align-items: center; justify-content: center; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.6); background: #07070a;">
                                    <!-- HTML content will be rendered here -->
                                    <div id="preview-card-content" style="width: 100%; height: 100%;"></div>
                                </div>
                                
                            </div>
                            
                            <!-- Floating helper -->
                            <div id="modal-helper-text" style="position: absolute; bottom: 12px; background: rgba(0,0,0,0.85); border: 1px solid rgba(255,255,255,0.1); padding: 8px 16px; border-radius: 30px; font-size: 0.65rem; color: rgba(255,255,255,0.85); font-weight: 800; pointer-events: none; display: flex; align-items: center; gap: 6px; z-index: 10;">
                                <i class="fas fa-info-circle" style="color: #CCFF00;"></i> PREVISUALIZACIÓN DE ALTA RESOLUCIÓN (9:16)
                            </div>
                        </div>

                        <!-- COLUMN 2: TAB SELECTOR & ACTIONS -->
                        <div style="display: flex; flex-direction: column; gap: 18px;" id="controls-column">
                            
                            <!-- Mini Selector Tab -->
                            <div style="display: flex; flex-direction: column; gap: 6px;">
                                <span style="font-size: 0.65rem; color: #64748b; font-weight: 900; letter-spacing: 1px; text-transform: uppercase;">1. SELECCIONA EL DISEÑO DE CROMO</span>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); padding: 5px; border-radius: 16px;">
                                    <button id="modal-tab-class" onclick="window.TeamView.renderSharePreview('${teamId}', 'class')" style="padding: 12px 6px; border-radius: 12px; border: none; font-weight: 900; font-size: 0.65rem; cursor: pointer; transition: all 0.25s; text-transform: uppercase;">
                                        🏆 TABLA
                                    </button>
                                    <button id="modal-tab-sched" onclick="window.TeamView.renderSharePreview('${teamId}', 'sched')" style="padding: 12px 6px; border-radius: 12px; border: none; font-weight: 900; font-size: 0.65rem; cursor: pointer; transition: all 0.25s; text-transform: uppercase;">
                                        📅 PARTIDOS
                                    </button>
                                    <button id="modal-tab-rost" onclick="window.TeamView.renderSharePreview('${teamId}', 'rost')" style="padding: 12px 6px; border-radius: 12px; border: none; font-weight: 900; font-size: 0.65rem; cursor: pointer; transition: all 0.25s; text-transform: uppercase;">
                                        👥 SQUAD
                                    </button>
                                    <button id="modal-tab-stats" onclick="window.TeamView.renderSharePreview('${teamId}', 'stats')" style="padding: 12px 6px; border-radius: 12px; border: none; font-weight: 900; font-size: 0.65rem; cursor: pointer; transition: all 0.25s; text-transform: uppercase;">
                                        📊 STATS
                                    </button>
                                </div>
                            </div>

                            <!-- Selector de Rango de Jornadas (Solo para Partidos) -->
                            <div id="modal-sched-range-container" style="display: none; flex-direction: column; gap: 6px; margin-top: 5px;">
                                <span style="font-size: 0.65rem; color: #64748b; font-weight: 900; letter-spacing: 1px; text-transform: uppercase;">JORNADAS A MOSTRAR</span>
                                <div id="modal-sched-range-buttons" style="display: flex; flex-wrap: wrap; gap: 6px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); padding: 8px; border-radius: 16px; justify-content: center;">
                                    <!-- Botones generados dinámicamente -->
                                </div>
                            </div>

                            <!-- Capture Hint for mobile -->
                            <div style="background: rgba(204,255,0,0.04); border: 1px solid rgba(204,255,0,0.12); border-radius: 16px; padding: 12px 15px; display: flex; align-items: center; gap: 10px; font-size: 0.75rem; color: #cbd5e1; font-weight: 700; line-height: 1.35;">
                                <i class="fas fa-lightbulb" style="color: #CCFF00; font-size: 1.1rem; flex-shrink: 0;"></i>
                                <span><strong>Tip Premium:</strong> Puedes copiar el cromo al portapapeles y pegarlo directamente en tu chat de WhatsApp. ¡Visual y sin esfuerzo!</span>
                            </div>

                            <!-- Actions Group -->
                            <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 5px;">
                                <span style="font-size: 0.65rem; color: #64748b; font-weight: 900; letter-spacing: 1px; text-transform: uppercase;">2. ACCIONES DE COMPARTIR</span>
                                
                                <!-- WhatsApp share -->
                                <button onclick="window.open(window.TeamView.getWhatsAppShareText('${teamId}', window.TeamView.activeShareTab), '_blank')" style="background: #25D366; color: white; border: none; padding: 18px; border-radius: 16px; font-weight: 950; font-size: 0.9rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; box-shadow: 0 10px 25px rgba(37,211,102,0.25); text-transform: uppercase; transition: all 0.2s ease;" onmouseover="this.style.transform='translateY(-2px)';" onmouseout="this.style.transform='none';">
                                    <i class="fab fa-whatsapp" style="font-size: 1.25rem;"></i> ENVIAR A WHATSAPP
                                </button>
                                
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                    <!-- Copy to clipboard -->
                                    <button id="modal-copy-btn" onclick="window.TeamView.copyShareImageToClipboard('${teamId}', window.TeamView.activeShareTab, 'modal-copy-btn')" style="background: #0f172a; color: white; border: 1.5px solid rgba(255,255,255,0.15); padding: 16px; border-radius: 16px; font-weight: 900; font-size: 0.75rem; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; transition: all 0.2s;" onmouseover="this.style.borderColor='#CCFF00'; this.style.background='rgba(255,255,255,0.02)';" onmouseout="this.style.borderColor='rgba(255,255,255,0.15)'; this.style.background='#0f172a';">
                                        <i class="far fa-clipboard" style="font-size: 1.2rem; color: #CCFF00;"></i>
                                        <span>COPIAR IMAGEN</span>
                                    </button>
                                    
                                    <!-- Download image -->
                                    <button id="modal-dl-btn" onclick="window.TeamView.downloadShareImage('${teamId}', window.TeamView.activeShareTab, 'modal-dl-btn')" style="background: #CCFF00; color: #000000; border: none; padding: 16px; border-radius: 16px; font-weight: 950; font-size: 0.75rem; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 6px 15px rgba(204,255,0,0.2); transition: all 0.2s;" onmouseover="this.style.transform='translateY(-2px)';" onmouseout="this.style.transform='none';">
                                        <i class="fas fa-download" style="font-size: 1.1rem;"></i>
                                        <span>DESCARGAR FOTO</span>
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);
            
            // Adjust CSS responsively to scale the card
            this.adjustPreviewScale();
            window.addEventListener('resize', this.adjustPreviewScale);

            // Trigger animations
            setTimeout(() => {
                overlay.style.opacity = '1';
                const container = document.getElementById('team-share-container');
                if (container) container.style.transform = 'scale(1)';
            }, 50);

            // Render first preview
            this.renderSharePreview(teamId, initialTab);
        }

        closeShareModal() {
            const overlay = document.getElementById('team-share-overlay');
            if (overlay) {
                window.removeEventListener('resize', this.adjustPreviewScale);
                overlay.style.opacity = '0';
                const container = document.getElementById('team-share-container');
                if (container) container.style.transform = 'scale(0.9)';
                setTimeout(() => overlay.remove(), 350);
            }
        }

        adjustPreviewScale() {
            const previewColumn = document.getElementById('preview-column');
            const scaleWrapper = document.getElementById('preview-scale-wrapper');
            const sizer = document.getElementById('preview-container-sizer');
            if (!previewColumn || !scaleWrapper) return;

            const padding = 24;
            const containerWidth = previewColumn.clientWidth - padding;
            
            // Calculamos un alto máximo adaptativo para que el cromo quepa en pantalla de forma nítida
            const isMobile = window.innerWidth <= 992;
            const maxAvailableHeight = isMobile ? Math.min(window.innerHeight * 0.42, 380) : Math.min(window.innerHeight * 0.62, 600);
            
            const cardWidth = 1080;
            const cardHeight = 1920;

            const scaleX = containerWidth / cardWidth;
            const scaleY = maxAvailableHeight / cardHeight;
            let scale = Math.min(scaleX, scaleY);

            // Limitación de escalas máximas para asegurar una visualización pulida
            const maxScale = isMobile ? 0.22 : 0.32;
            const finalScale = Math.min(scale, maxScale);

            // Aplicamos la escala al cromo usando transform-origin: top left
            scaleWrapper.style.transform = `scale(${finalScale})`;
            
            // Establecemos el tamaño del sizer para que el contenedor reserve el espacio exacto
            if (sizer) {
                sizer.style.width = `${cardWidth * finalScale}px`;
                sizer.style.height = `${cardHeight * finalScale}px`;
            }
        }

        renderSharePreview(teamId, tabName) {
            this.activeShareTab = tabName;
            const team = this.lastTeams.find(t => t.id === teamId);
            if (!team) return;

            // Highlight active button inside the selector
            const tabs = ['class', 'sched', 'rost', 'stats'];
            tabs.forEach(tab => {
                const btn = document.getElementById(`modal-tab-${tab}`);
                if (btn) {
                    if (tab === tabName) {
                        btn.style.background = '#CCFF00';
                        btn.style.color = '#000';
                    } else {
                        btn.style.background = 'transparent';
                        btn.style.color = '#94a3b8';
                    }
                }
            });

            // Dynamic schedule range selector rendering
            const rangeContainer = document.getElementById('modal-sched-range-container');
            if (rangeContainer) {
                if (tabName === 'sched') {
                    rangeContainer.style.display = 'flex';
                    const buttonsArea = document.getElementById('modal-sched-range-buttons');
                    if (buttonsArea) {
                        const schedule = team.schedule || [];
                        const totalMatches = schedule.length;
                        const blockSize = 5;
                        const currentFilter = this.shareScheduleFilter || 'smart';
                        let buttonsHTML = `
                            <button onclick="window.TeamView.changeScheduleFilter('${teamId}', 'smart')" style="padding: 8px 12px; border-radius: 10px; border: 1px solid ${currentFilter === 'smart' ? '#CCFF00' : 'rgba(255,255,255,0.1)'}; font-weight: 900; font-size: 0.65rem; cursor: pointer; transition: all 0.2s; text-transform: uppercase; background: ${currentFilter === 'smart' ? '#CCFF00' : 'transparent'}; color: ${currentFilter === 'smart' ? '#000' : '#cbd5e1'}; flex-shrink: 0; min-width: 90px;">
                                🔥 ACTUALIDAD
                            </button>
                        `;
                        
                        for (let i = 0; i < totalMatches; i += blockSize) {
                            const start = i + 1;
                            const end = Math.min(i + blockSize, totalMatches);
                            const filterVal = `${start}-${end}`;
                            const isActive = currentFilter === filterVal;
                            buttonsHTML += `
                                <button onclick="window.TeamView.changeScheduleFilter('${teamId}', '${filterVal}')" style="padding: 8px 12px; border-radius: 10px; border: 1px solid ${isActive ? '#CCFF00' : 'rgba(255,255,255,0.1)'}; font-weight: 900; font-size: 0.65rem; cursor: pointer; transition: all 0.2s; text-transform: uppercase; background: ${isActive ? '#CCFF00' : 'transparent'}; color: ${isActive ? '#000' : '#cbd5e1'}; flex-shrink: 0;">
                                    J${start}-${end}
                                </button>
                            `;
                        }
                        buttonsArea.innerHTML = buttonsHTML;
                    }
                } else {
                    rangeContainer.style.display = 'none';
                }
            }

            // Set content
            const contentArea = document.getElementById('preview-card-content');
            if (contentArea) {
                contentArea.innerHTML = this.getShareTemplateHTML(team, tabName, false);
            }

            // Haptic feedback
            if (window.navigator.vibrate) window.navigator.vibrate(8);
        }

        changeScheduleFilter(teamId, filterVal) {
            this.shareScheduleFilter = filterVal;
            if (window.navigator.vibrate) window.navigator.vibrate(8);
            this.renderSharePreview(teamId, 'sched');
        }

        getShareTemplateHTML(team, tabName, isForCapture = false) {
            const dateStr = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
            const standings = team.groupStandings || [];
            const schedule = team.schedule || [];
            const roster = team.roster || [];
            
            // Captain sanitization
            const cleanCap = (team.name.includes('3MB') || team.name.includes('3M B')) ? 'Miguel Ángel Méndez' : 
                             (team.name.includes('3MA') || team.name.includes('3M A')) ? 'Abraham Rosell' : 
                             (team.captain && !team.captain.includes('Pendiente') ? team.captain : 'Capitán por definir');
            const cleanCapLower = cleanCap.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

            let maxPts = 0;
            if (roster.length > 0) {
                maxPts = Math.max(...roster.map(p => parseInt(p.pts) || 0));
            }

            // Advanced stats calculations
            let winRate = 0;
            let winCount = team.stats ? team.stats.pg : 0;
            let pjCount = team.stats ? team.stats.pj : 0;
            let streak = [];
            
            if (schedule.length > 0) {
                const sortedMatches = [...schedule].sort((a, b) => parseInt(a.j) - parseInt(b.j));
                const completedMatches = sortedMatches.filter(m => m.status === 'completed' && m.score);
                
                let matchesWon = 0;
                completedMatches.forEach(m => {
                    const res = this.getMatchResult(m);
                    if (!res.valid) return;
                    if (res.isWin) matchesWon++;
                    streak.push(res.isWin ? 'W' : 'L');
                });
                
                const totalPlayed = completedMatches.length;
                if (totalPlayed > 0) {
                    winRate = Math.round((matchesWon / totalPlayed) * 100);
                }
                if (streak.length > 5) streak = streak.slice(-5);
            }

            const sf = team.stats ? team.stats.sf : 0;
            const sc = team.stats ? team.stats.sc : 0;
            const setDiff = sf - sc;

            const scaleStyle = isForCapture ? '' : 'width: 100%; height: 100%;';

            // Return corresponding premium template HTML
            if (tabName === 'class') {
                return `
                    <div class="insta-story-card" style="${scaleStyle} width: 1080px; height: 1920px; background: linear-gradient(135deg, #07070a 0%, #121216 100%); font-family: 'Outfit', sans-serif; position: relative; color: white; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: space-between; padding: 110px 70px; box-sizing: border-box;">
                        <!-- Glows -->
                        <div style="position: absolute; top: -100px; left: -100px; width: 650px; height: 650px; background: #CCFF00; filter: blur(200px); opacity: 0.16; border-radius: 50%;"></div>
                        <div style="position: absolute; bottom: -100px; right: -100px; width: 650px; height: 650px; background: #38b000; filter: blur(200px); opacity: 0.16; border-radius: 50%;"></div>
                        <div style="position: absolute; inset: 0; background-image: repeating-linear-gradient(45deg, rgba(255,255,255,0.015) 0, rgba(255,255,255,0.015) 1px, transparent 0, transparent 50%); background-size: 25px 25px; opacity: 0.4;"></div>

                        <!-- Header -->
                        <div style="text-align: center; z-index: 10; width: 100%;">
                            <img src="${team.logo || 'img/logo_somospadel.png'}" style="width: 140px; height: 140px; object-fit: contain; margin-bottom: 25px; filter: drop-shadow(0 10px 25px rgba(0,0,0,0.6));" crossorigin="anonymous">
                            <div style="font-size: 1.3rem; font-weight: 900; color: #CCFF00; letter-spacing: 6px; text-transform: uppercase;">LLIGA GUINOTPRUNERA</div>
                            <h1 style="font-size: 3.5rem; font-weight: 950; margin: 10px 0; text-transform: uppercase; letter-spacing: -1.5px; line-height: 1.05;">
                                CLASIFICACIÓN<br><span style="color: #38b000;">GRUPO ${team.group.split(' ').pop().toUpperCase()}</span>
                            </h1>
                        </div>

                        <!-- Main stand card -->
                        <div style="width: 100%; background: rgba(255, 255, 255, 0.02); border: 2px solid rgba(255, 255, 255, 0.07); border-radius: 35px; padding: 40px 30px; box-sizing: border-box; backdrop-filter: blur(20px); z-index: 10; box-shadow: 0 25px 50px rgba(0,0,0,0.4);">
                            <table style="width: 100%; border-collapse: separate; border-spacing: 0 16px;">
                                <thead>
                                    <tr style="color: rgba(255,255,255,0.4); font-size: 1.05rem; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; text-align: center;">
                                        <th style="padding: 10px; text-align: left;">POS & EQUIPO</th>
                                        <th style="padding: 10px;">PTS</th>
                                        <th style="padding: 10px;">PJ</th>
                                        <th style="padding: 10px;">PG</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${standings.slice(0, 6).map((s, idx) => {
                                        const isSp = s.isCurrent;
                                        const rowBg = isSp ? 'linear-gradient(90deg, rgba(204,255,0,0.14) 0%, rgba(204,255,0,0.02) 100%)' : 'rgba(255,255,255,0.01)';
                                        const rowBorder = isSp ? '2px solid #CCFF00' : '1px solid rgba(255,255,255,0.04)';
                                        return `
                                            <tr style="background: ${rowBg}; border-radius: 18px;">
                                                <td style="padding: 18px 25px; font-weight: 900; font-size: 1.5rem; border-top-left-radius: 18px; border-bottom-left-radius: 18px; border: ${rowBorder}; border-right: none; display: flex; align-items: center; gap: 15px; color: ${isSp ? '#CCFF00' : 'white'};">
                                                    <span style="font-size: 1.8rem; font-weight: 950; color: ${idx === 0 ? '#eab308' : (idx === 1 ? '#cbd5e1' : (idx === 2 ? '#CD7F32' : 'rgba(255,255,255,0.3)'))};">#${s.pos}</span>
                                                    <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 440px;">
                                                        ${s.team.toUpperCase()} ${isSp ? '👑' : ''}
                                                    </span>
                                                </td>
                                                <td style="padding: 18px 10px; font-size: 1.7rem; font-weight: 950; text-align: center; color: ${isSp ? '#CCFF00' : 'white'}; border-top: ${rowBorder}; border-bottom: ${rowBorder};">${s.pts}</td>
                                                <td style="padding: 18px 10px; font-size: 1.5rem; font-weight: 800; text-align: center; color: rgba(255,255,255,0.5); border-top: ${rowBorder}; border-bottom: ${rowBorder};">${s.pj}</td>
                                                <td style="padding: 18px 25px; font-size: 1.5rem; font-weight: 900; text-align: center; color: #38b000; border-top-right-radius: 18px; border-bottom-right-radius: 18px; border: ${rowBorder}; border-left: none;">${s.pg}</td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>

                        <!-- Footer -->
                        <div style="text-align: center; z-index: 10; width: 100%;">
                            <div style="font-size: 1.7rem; font-weight: 900; letter-spacing: 5px; color: white;">SOMOS PÁDEL BCN</div>
                            <div style="font-size: 1.1rem; color: rgba(255,255,255,0.4); margin-top: 10px; text-transform: uppercase; letter-spacing: 2px;">APP OFICIAL • ${dateStr}</div>
                            <div style="margin-top: 30px; display: inline-flex; align-items: center; gap: 15px; background: #CCFF00; color: black; padding: 14px 35px; border-radius: 50px; font-weight: 900; font-size: 1.25rem; box-shadow: 0 8px 20px rgba(204,255,0,0.25);">
                                <i class="fab fa-instagram" style="font-size: 1.5rem;"></i> @somospadelbarcelona_
                            </div>
                        </div>
                    </div>
                `;
            }

            if (tabName === 'sched') {
                const sortedSchedule = [...schedule].sort((a, b) => parseInt(a.j) - parseInt(b.j));
                
                // Aplicar filtro de rango de jornadas (máximo 5 partidos)
                let filteredMatches = [];
                const filter = this.shareScheduleFilter || 'smart';
                if (filter === 'smart') {
                    let targetIndex = sortedSchedule.findIndex(m => m.status !== 'completed');
                    if (targetIndex === -1) {
                        targetIndex = sortedSchedule.length - 1;
                    }
                    let start = Math.max(0, targetIndex - 2);
                    let end = Math.min(sortedSchedule.length, start + 5);
                    if (end - start < 5 && start > 0) {
                        start = Math.max(0, end - 5);
                    }
                    filteredMatches = sortedSchedule.slice(start, end);
                } else {
                    const range = filter.split('-');
                    if (range.length === 2) {
                        const startIdx = parseInt(range[0]) - 1;
                        const endIdx = parseInt(range[1]);
                        filteredMatches = sortedSchedule.slice(startIdx, endIdx);
                    } else {
                        filteredMatches = sortedSchedule.slice(0, 5);
                    }
                }

                const totalMatches = filteredMatches.length;
                
                // Si hay más de 5 partidos, compactamos dinámicamente los estilos para evitar desbordar el cromo
                const isCompact = totalMatches > 5;
                const gap = isCompact ? '12px' : '24px';
                const cardPadding = isCompact ? '12px 22px' : '22px 30px';
                const cardGap = isCompact ? '2px' : '6px';
                const jnSize = isCompact ? '0.85rem' : '1.05rem';
                const opSize = isCompact ? '1.25rem' : '1.7rem';
                const infoSize = isCompact ? '0.9rem' : '1.15rem';
                const resSize = isCompact ? '1.15rem' : '1.6rem';
                const resPadding = isCompact ? '8px 16px' : '12px 24px';
                const resMinWidth = isCompact ? '120px' : '170px';
                const listMargin = isCompact ? '15px 0' : '30px 0';

                return `
                    <div class="insta-story-card" style="${scaleStyle} width: 1080px; height: 1920px; background: linear-gradient(135deg, #050508 0%, #121216 100%); font-family: 'Outfit', sans-serif; position: relative; color: white; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: space-between; padding: 110px 70px; box-sizing: border-box;">
                        <!-- Glows -->
                        <div style="position: absolute; top: -100px; right: -100px; width: 650px; height: 650px; background: #38b000; filter: blur(200px); opacity: 0.16; border-radius: 50%;"></div>
                        <div style="position: absolute; bottom: -100px; left: -100px; width: 650px; height: 650px; background: #00d2ff; filter: blur(200px); opacity: 0.15; border-radius: 50%;"></div>
                        <div style="position: absolute; inset: 0; background-image: repeating-linear-gradient(45deg, rgba(255,255,255,0.015) 0, rgba(255,255,255,0.015) 1px, transparent 0, transparent 50%); background-size: 25px 25px; opacity: 0.3;"></div>

                        <!-- Header -->
                        <div style="text-align: center; z-index: 10; width: 100%;">
                            <img src="${team.logo || 'img/logo_somospadel.png'}" style="width: 140px; height: 140px; object-fit: contain; margin-bottom: 25px; filter: drop-shadow(0 10px 25px rgba(0,0,0,0.6));" crossorigin="anonymous">
                            <div style="font-size: 1.3rem; font-weight: 900; color: #CCFF00; letter-spacing: 6px; text-transform: uppercase;">CALENDARIO & RESULTADOS ${filter === 'smart' ? '• ACTUALIDAD' : `• J${filter}`}</div>
                            <h1 style="font-size: 3.2rem; font-weight: 950; margin: 10px 0; text-transform: uppercase; letter-spacing: -1px; line-height: 1.05; max-width: 900px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: inline-block;">
                                ${team.name.toUpperCase()}
                            </h1>
                        </div>

                        <!-- Main Matches List -->
                        <div style="width: 100%; display: flex; flex-direction: column; gap: ${gap}; z-index: 10; margin: ${listMargin};">
                            ${filteredMatches.map(m => {
                                const res = this.getMatchResult(m);
                                const isCompleted = res.valid;
                                const isWin = isCompleted && res.isWin;
                                const isLive = m.status === 'live' || m.status === 'playing';

                                const cardBg = isLive ? 'rgba(56,176,0,0.1)' : 'rgba(255, 255, 255, 0.02)';
                                const cardBorder = isLive ? '2px solid #38b000' : '1px solid rgba(255, 255, 255, 0.06)';
                                const labelBg = isLive ? '#38b000' : (!isCompleted ? 'rgba(255,255,255,0.06)' : (isWin ? 'rgba(56,176,0,0.15)' : 'rgba(239,68,68,0.15)'));
                                const labelColor = isLive ? 'black' : (!isCompleted ? '#cbd5e1' : (isWin ? '#CCFF00' : '#ef4444'));
                                const statusText = isLive ? 'EN JUEGO' : (isCompleted ? m.score : 'PENDIENTE');

                                return `
                                    <div style="background: ${cardBg}; border: ${cardBorder}; border-radius: 26px; padding: ${cardPadding}; display: flex; justify-content: space-between; align-items: center; backdrop-filter: blur(15px); box-shadow: 0 10px 30px rgba(0,0,0,0.15);">
                                        <div style="display: flex; flex-direction: column; gap: ${cardGap}; min-width: 0; flex: 1;">
                                            <span style="font-size: ${jnSize}; color: #CCFF00; font-weight: 900; letter-spacing: 2px; text-transform: uppercase;">JORNADA ${m.j}</span>
                                            <span style="font-size: ${opSize}; font-weight: 900; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-right: 15px;">
                                                vs ${m.opponent.toUpperCase()}
                                            </span>
                                            <div style="display: flex; align-items: center; gap: 10px; font-size: ${infoSize}; color: rgba(255,255,255,0.5); font-weight: 700;">
                                                <i class="far fa-calendar-alt" style="color: #38b000;"></i>
                                                <span>${m.date} • ${m.venue.toUpperCase()}</span>
                                            </div>
                                        </div>
                                        <div style="font-size: ${resSize}; font-weight: 950; background: ${labelBg}; color: ${labelColor}; padding: ${resPadding}; border-radius: 18px; border: 1px solid rgba(255,255,255,0.05); min-width: ${resMinWidth}; text-align: center; letter-spacing: 0.5px; flex-shrink: 0;">
                                            ${statusText}
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>

                        <!-- Footer -->
                        <div style="text-align: center; z-index: 10; width: 100%;">
                            <div style="font-size: 1.7rem; font-weight: 900; letter-spacing: 5px; color: white;">SOMOS PÁDEL BCN</div>
                            <div style="font-size: 1.1rem; color: rgba(255,255,255,0.4); margin-top: 10px; text-transform: uppercase; letter-spacing: 2px;">APP OFICIAL • LIGA DE PÁDEL</div>
                            <div style="margin-top: 30px; display: inline-flex; align-items: center; gap: 15px; background: #CCFF00; color: black; padding: 14px 35px; border-radius: 50px; font-weight: 900; font-size: 1.25rem; box-shadow: 0 8px 20px rgba(204,255,0,0.25);">
                                <i class="fab fa-instagram" style="font-size: 1.5rem;"></i> @somospadelbarcelona_
                            </div>
                        </div>
                    </div>
                `;
            }

            if (tabName === 'rost') {
                return `
                    <div class="insta-story-card" style="${scaleStyle} width: 1080px; height: 1920px; background: linear-gradient(135deg, #06060a 0%, #121217 100%); font-family: 'Outfit', sans-serif; position: relative; color: white; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: space-between; padding: 110px 70px; box-sizing: border-box;">
                        <!-- Glows -->
                        <div style="position: absolute; top: -100px; left: -100px; width: 680px; height: 680px; background: #CCFF00; filter: blur(220px); opacity: 0.16; border-radius: 50%;"></div>
                        <div style="position: absolute; bottom: -100px; right: -100px; width: 680px; height: 680px; background: #8b5cf6; filter: blur(220px); opacity: 0.14; border-radius: 50%;"></div>
                        <div style="position: absolute; inset: 0; background-image: repeating-linear-gradient(45deg, rgba(255,255,255,0.015) 0, rgba(255,255,255,0.015) 1px, transparent 0, transparent 50%); background-size: 25px 25px; opacity: 0.3;"></div>

                        <!-- Header -->
                        <div style="text-align: center; z-index: 10; width: 100%;">
                            <img src="${team.logo || 'img/logo_somospadel.png'}" style="width: 140px; height: 140px; object-fit: contain; margin-bottom: 25px; filter: drop-shadow(0 10px 25px rgba(0,0,0,0.6));" crossorigin="anonymous">
                            <div style="font-size: 1.3rem; font-weight: 900; color: #CCFF00; letter-spacing: 6px; text-transform: uppercase;">PLANTILLA OFICIAL • ROSTER</div>
                            <h1 style="font-size: 3.2rem; font-weight: 950; margin: 10px 0; text-transform: uppercase; letter-spacing: -1px; line-height: 1.05; max-width: 900px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: inline-block;">
                                ${team.name.toUpperCase()}
                            </h1>
                        </div>

                        <!-- Roster Renders -->
                        <div style="width: 100%; display: flex; flex-direction: column; gap: 20px; z-index: 10; margin: 30px 0; max-height: 900px; overflow: hidden;">
                            ${roster.map((player, idx) => {
                                const pNameLower = (player.name || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                                const isCap = pNameLower.includes(cleanCapLower) && cleanCapLower.length > 3;
                                const isMVP = (parseInt(player.pts) === maxPts) && maxPts > 0;
                                const initial = player.name ? player.name.charAt(0).toUpperCase() : '?';
                                const bgColors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];
                                const avatarBg = bgColors[player.name.length % bgColors.length];

                                return `
                                    <div style="background: rgba(255, 255, 255, 0.02); border: 1.5px solid rgba(255, 255, 255, 0.05); border-radius: 25px; padding: 18px 25px; display: flex; align-items: center; justify-content: space-between; backdrop-filter: blur(15px); box-shadow: 0 10px 25px rgba(0,0,0,0.15);">
                                        <div style="display: flex; align-items: center; gap: 20px; min-width: 0; flex: 1;">
                                            <!-- Avatar -->
                                            <div style="width: 70px; height: 70px; border-radius: 50%; background: ${avatarBg}; color: white; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 900; box-shadow: 0 5px 12px rgba(0,0,0,0.25); position: relative; flex-shrink: 0;">
                                                ${initial}
                                                ${isCap ? `
                                                    <div style="position: absolute; bottom: -2px; right: -2px; background: #0f172a; border: 1.5px solid #fff; color: #fff; font-size: 0.8rem; font-weight: 950; width: 25px; height: 25px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.3);" title="Capitán">C</div>
                                                ` : ''}
                                            </div>
                                            <div style="display: flex; flex-direction: column; gap: 4px; min-width: 0; flex: 1;">
                                                <span style="font-size: 1.65rem; font-weight: 900; letter-spacing: -0.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${player.name.toUpperCase()}</span>
                                                <div style="display: flex; gap: 8px;">
                                                    ${isCap ? `<span style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); color: #fff; font-size: 0.8rem; font-weight: 900; padding: 2px 10px; border-radius: 6px; letter-spacing: 0.5px;">CAPITÁN</span>` : ''}
                                                    ${isMVP ? `<span style="background: linear-gradient(135deg, #eab308 0%, #f59e0b 100%); color: white; font-size: 0.8rem; font-weight: 900; padding: 2px 10px; border-radius: 6px; box-shadow: 0 2px 6px rgba(234,179,8,0.35); display: inline-flex; align-items: center; gap: 3px;"><i class="fas fa-crown"></i> MVP</span>` : ''}
                                                </div>
                                            </div>
                                        </div>
                                        <div style="background: rgba(56, 176, 0, 0.1); border: 1px solid rgba(56, 176, 0, 0.25); color: #CCFF00; font-size: 1.45rem; font-weight: 950; padding: 10px 22px; border-radius: 16px; letter-spacing: 0.5px; flex-shrink: 0; margin-left: 10px;">
                                            ${player.pts} <span style="font-size: 1rem; color: rgba(255,255,255,0.5);">PTS</span>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>

                        <!-- Footer -->
                        <div style="text-align: center; z-index: 10; width: 100%;">
                            <div style="font-size: 1.7rem; font-weight: 900; letter-spacing: 5px; color: white;">SOMOS PÁDEL BCN</div>
                            <div style="font-size: 1.1rem; color: rgba(255,255,255,0.4); margin-top: 10px; text-transform: uppercase; letter-spacing: 2px;">APP OFICIAL • ROSTER COMPLETO</div>
                            <div style="margin-top: 30px; display: inline-flex; align-items: center; gap: 15px; background: #CCFF00; color: black; padding: 14px 35px; border-radius: 50px; font-weight: 900; font-size: 1.25rem; box-shadow: 0 8px 20px rgba(204,255,0,0.25);">
                                <i class="fab fa-instagram" style="font-size: 1.5rem;"></i> @somospadelbarcelona_
                            </div>
                        </div>
                    </div>
                `;
            }

            if (tabName === 'stats') {
                return `
                    <div class="insta-story-card" style="${scaleStyle} width: 1080px; height: 1920px; background: linear-gradient(135deg, #07070a 0%, #121217 100%); font-family: 'Outfit', sans-serif; position: relative; color: white; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: space-between; padding: 110px 70px; box-sizing: border-box;">
                        <!-- Glows -->
                        <div style="position: absolute; top: -100px; right: -100px; width: 680px; height: 680px; background: #38b000; filter: blur(220px); opacity: 0.18; border-radius: 50%;"></div>
                        <div style="position: absolute; bottom: -100px; left: -100px; width: 680px; height: 680px; background: #CCFF00; filter: blur(220px); opacity: 0.16; border-radius: 50%;"></div>
                        <div style="position: absolute; inset: 0; background-image: repeating-linear-gradient(45deg, rgba(255,255,255,0.015) 0, rgba(255,255,255,0.015) 1px, transparent 0, transparent 50%); background-size: 25px 25px; opacity: 0.3;"></div>

                        <!-- Header -->
                        <div style="text-align: center; z-index: 10; width: 100%;">
                            <img src="${team.logo || 'img/logo_somospadel.png'}" style="width: 140px; height: 140px; object-fit: contain; margin-bottom: 25px; filter: drop-shadow(0 10px 25px rgba(0,0,0,0.6));" crossorigin="anonymous">
                            <div style="font-size: 1.3rem; font-weight: 900; color: #CCFF00; letter-spacing: 6px; text-transform: uppercase;">ESTADÍSTICAS & RENDIMIENTO</div>
                            <h1 style="font-size: 3.2rem; font-weight: 950; margin: 10px 0; text-transform: uppercase; letter-spacing: -1px; line-height: 1.05; max-width: 900px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: inline-block;">
                                ${team.name.toUpperCase()}
                            </h1>
                        </div>

                        <!-- Main KPIs Content -->
                        <div style="width: 100%; display: flex; flex-direction: column; gap: 35px; z-index: 10; margin: 30px 0;">
                            
                            <!-- Win Rate big visual -->
                            <div style="background: rgba(255,255,255,0.02); border: 2px solid rgba(56,176,0,0.3); border-radius: 35px; padding: 45px; text-align: center; backdrop-filter: blur(20px); box-shadow: 0 15px 35px rgba(0,0,0,0.25);">
                                <div style="font-size: 1.3rem; color: rgba(255,255,255,0.5); font-weight: 800; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 15px;">PORCENTAJE DE VICTORIAS</div>
                                <div style="font-size: 7rem; font-weight: 950; color: #CCFF00; line-height: 1; margin-bottom: 25px;">${winRate}%</div>
                                
                                <!-- Neon progress bar -->
                                <div style="width: 100%; background: rgba(255,255,255,0.05); height: 20px; border-radius: 10px; overflow: hidden; border: 1px solid rgba(255,255,255,0.04); padding: 2px; box-sizing: border-box;">
                                    <div style="width: ${winRate}%; background: linear-gradient(90deg, #38b000 0%, #CCFF00 100%); height: 100%; border-radius: 8px; box-shadow: 0 0 12px rgba(204,255,0,0.4);"></div>
                                </div>
                            </div>

                            <!-- Dual columns Sub-KPIs -->
                            <div style="display: flex; gap: 24px;">
                                <!-- PJ / PG -->
                                <div style="flex: 1; background: rgba(255,255,255,0.02); border: 1.5px solid rgba(255,255,255,0.05); border-radius: 28px; padding: 25px; display: flex; flex-direction: column; align-items: center; justify-content: center; backdrop-filter: blur(15px);">
                                    <span style="font-size: 1rem; color: rgba(255,255,255,0.4); font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px;">PARTIDOS J/G</span>
                                    <span style="font-size: 3.2rem; font-weight: 950; color: white;">${pjCount}<span style="font-size: 2rem; color: #38b000; font-weight: 900;"> / ${winCount}</span></span>
                                </div>
                                
                                <!-- Sets Diff -->
                                <div style="flex: 1; background: rgba(255,255,255,0.02); border: 1.5px solid rgba(255,255,255,0.05); border-radius: 28px; padding: 25px; display: flex; flex-direction: column; align-items: center; justify-content: center; backdrop-filter: blur(15px);">
                                    <span style="font-size: 1rem; color: rgba(255,255,255,0.4); font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px;">DIF. SETS</span>
                                    <span style="font-size: 3.2rem; font-weight: 950; color: ${setDiff >= 0 ? '#CCFF00' : '#ef4444'};">${setDiff > 0 ? '+' + setDiff : setDiff}</span>
                                </div>
                            </div>

                            <!-- Streak Row -->
                            <div style="background: rgba(255,255,255,0.02); border: 1.5px solid rgba(255,255,255,0.05); border-radius: 28px; padding: 25px 35px; display: flex; justify-content: space-between; align-items: center; backdrop-filter: blur(15px);">
                                <span style="font-size: 1.25rem; font-weight: 900; color: white; letter-spacing: 1px; text-transform: uppercase;">FORMA (ÚLT. 5)</span>
                                <div style="display: flex; gap: 12px;">
                                    ${streak.length > 0 ? streak.map(res => `
                                        <div style="width: 46px; height: 46px; border-radius: 50%; background: ${res === 'W' ? '#38b000' : '#ef4444'}; color: white; font-size: 1.35rem; font-weight: 950; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px ${res === 'W' ? 'rgba(56,176,0,0.3)' : 'rgba(239,68,68,0.3)'};">
                                            ${res === 'W' ? 'V' : 'D'}
                                        </div>
                                    `).join('') : '<span style="font-size: 1.2rem; color: rgba(255,255,255,0.3); font-weight: 800;">SIN REGISTROS</span>'}
                                </div>
                            </div>
                        </div>

                        <!-- Footer -->
                        <div style="text-align: center; z-index: 10; width: 100%;">
                            <div style="font-size: 1.7rem; font-weight: 900; letter-spacing: 5px; color: white;">SOMOS PÁDEL BCN</div>
                            <div style="font-size: 1.1rem; color: rgba(255,255,255,0.4); margin-top: 10px; text-transform: uppercase; letter-spacing: 2px;">APP OFICIAL • EVOLUCIÓN PREMIUM</div>
                            <div style="margin-top: 30px; display: inline-flex; align-items: center; gap: 15px; background: #CCFF00; color: black; padding: 14px 35px; border-radius: 50px; font-weight: 900; font-size: 1.25rem; box-shadow: 0 8px 20px rgba(204,255,0,0.25);">
                                <i class="fab fa-instagram" style="font-size: 1.5rem;"></i> @somospadelbarcelona_
                            </div>
                        </div>
                    </div>
                `;
            }

            return `<div>Diseño no encontrado</div>`;
        }

        getWhatsAppShareText(teamId, tabName) {
            const team = this.lastTeams.find(t => t.id === teamId);
            if (!team) return '';

            // Obtenemos la URL dinámica de la propia aplicación de forma limpia
            const appUrl = this.getCleanShareUrl();

            const standings = team.groupStandings || [];
            const schedule = team.schedule || [];
            const roster = team.roster || [];
            const winCount = team.stats ? team.stats.pg : 0;
            const pjCount = team.stats ? team.stats.pj : 0;
            const sf = team.stats ? team.stats.sf : 0;
            const sc = team.stats ? team.stats.sc : 0;
            const setDiff = sf - sc;

            let text = '';

            if (tabName === 'class') {
                text = `🏆 *CLASIFICACIÓN OFICIAL - ${team.name.toUpperCase()}* 🏆\n\n`;
                text += `¡Estamos compitiendo a tope en la Lliga Guinotprunera! 🎾🔥\n\n`;
                text += `Así está la tabla en el *Grupo ${team.group.split(' ').pop().toUpperCase()}*:\n`;
                
                standings.slice(0, 4).forEach(s => {
                    const icon = s.isCurrent ? '👑' : (s.pos === '1' ? '🥇' : '🔹');
                    text += `${icon} *#${s.pos}* ${s.team} - *${s.pts} pts* (PJ:${s.pj} G:${s.pg})\n`;
                });
                
                text += `\n📲 Haz click aquí para ver todos nuestros partidos, plantillas y estadísticas en tiempo real: *${appUrl}#teams* 🚀🎾`;
            } else if (tabName === 'sched') {
                const filter = this.shareScheduleFilter || 'smart';
                const filterLabel = filter === 'smart' ? 'ACTUALIDAD' : `JORNADAS ${filter}`;
                text = `📅 *PARTIDOS Y RESULTADOS (${filterLabel}) - ${team.name.toUpperCase()}* 📅\n\n`;
                text += `¡El ritmo de la lliga no se detiene! Así van nuestras jornadas:\n\n`;
                
                const sortedSchedule = [...schedule].sort((a, b) => parseInt(a.j) - parseInt(b.j));
                
                // Aplicar el mismo filtro para el texto de WhatsApp
                let filteredMatches = [];
                if (filter === 'smart') {
                    let targetIndex = sortedSchedule.findIndex(m => m.status !== 'completed');
                    if (targetIndex === -1) {
                        targetIndex = sortedSchedule.length - 1;
                    }
                    let start = Math.max(0, targetIndex - 2);
                    let end = Math.min(sortedSchedule.length, start + 5);
                    if (end - start < 5 && start > 0) {
                        start = Math.max(0, end - 5);
                    }
                    filteredMatches = sortedSchedule.slice(start, end);
                } else {
                    const range = filter.split('-');
                    if (range.length === 2) {
                        const startIdx = parseInt(range[0]) - 1;
                        const endIdx = parseInt(range[1]);
                        filteredMatches = sortedSchedule.slice(startIdx, endIdx);
                    } else {
                        filteredMatches = sortedSchedule.slice(0, 5);
                    }
                }
                
                filteredMatches.forEach(m => {
                    const isCompleted = m.status === 'completed' && m.score;
                    const resStr = isCompleted ? `👉 *${m.score}*` : '⏳ _Pendiente_';
                    text += `🔸 *J${m.j}:* vs ${m.opponent}\n    ${m.date} | ${resStr}\n`;
                });
                
                text += `\n📲 Haz click aquí para ver el calendario completo en tiempo real: *${appUrl}#teams* 🎾🔥`;
            } else if (tabName === 'rost') {
                text = `👥 *PLANTILLA OFICIAL (SQUAD) - ${team.name.toUpperCase()}* 👥\n\n`;
                text += `¡Presentamos al equipo de guerreros que defiende los colores del club! 🎾💪\n\n`;
                
                roster.forEach(p => {
                    text += `👤 *${p.name.toUpperCase()}* - ${p.pts} pts\n`;
                });
                
                text += `\n📲 Haz click aquí para ver el roster oficial y clasificaciones en tiempo real: *${appUrl}#teams* 🔥📈`;
            } else if (tabName === 'stats') {
                let winRate = 0;
                let streakStr = 'Sin datos';
                if (schedule.length > 0) {
                    const completed = schedule.filter(m => m.status === 'completed' && m.score);
                    let matchesWon = 0;
                    let streak = [];
                    completed.forEach(m => {
                        const res = this.getMatchResult(m);
                        if (res.valid && res.isWin) matchesWon++;
                        if (res.valid) streak.push(res.isWin ? 'V' : 'D');
                    });
                    if (completed.length > 0) winRate = Math.round((matchesWon / completed.length) * 100);
                    if (streak.length > 0) streakStr = streak.slice(-5).join(' - ');
                }

                text = `📊 *INFORME DE RENDIMIENTO - ${team.name.toUpperCase()}* 📊\n\n`;
                text += `¡Analizamos las estadísticas oficiales del equipo! Ligas Guinotprunera 📈🎾\n\n`;
                text += `📈 *Efectividad (Win Rate):* ${winRate}%\n`;
                text += `🎾 *Partidos Jugados / Ganados:* ${pjCount} / ${winCount}\n`;
                text += `🏆 *Diferencia de sets:* ${setDiff >= 0 ? '+' : ''}${setDiff}\n`;
                text += `🔥 *Última racha (Forma):* [ ${streakStr} ]\n\n`;
                text += `📲 Haz click aquí para ver las métricas de rendimiento en tiempo real: *${appUrl}#teams* 🚀💪`;
            }

            return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
        }

        async downloadShareImage(teamId, tabName, btnId) {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> GENERANDO...`;
            }

            const team = this.lastTeams.find(t => t.id === teamId);
            if (!team) return;

            try {
                // Render fully in a hidden container to scale 1080x1920
                const container = document.createElement('div');
                container.style.cssText = "position: fixed; top: -9999px; left: -9999px; width: 1080px; height: 1920px; overflow: hidden; z-index: -9999;";
                container.innerHTML = this.getShareTemplateHTML(team, tabName, true);
                document.body.appendChild(container);

                // Delay to allow rendering
                await new Promise(resolve => setTimeout(resolve, 400));

                const canvas = await html2canvas(container, {
                    scale: 2, // High resolution
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#07070a',
                    logging: false
                });

                document.body.removeChild(container);

                const dataUrl = canvas.toDataURL('image/png', 1.0);
                
                // Triggers direct download
                const link = document.createElement('a');
                link.download = `SomosPadel_${team.name.replace(/\s+/g, '_')}_${tabName}_${new Date().toISOString().slice(0,10)}.png`;
                link.href = dataUrl;
                link.click();

                if (btn) {
                    btn.innerHTML = `<i class="fas fa-check"></i> FOTO GUARDADA`;
                    btn.style.background = '#38b000';
                    btn.style.color = '#fff';
                    setTimeout(() => {
                        btn.disabled = false;
                        btn.style.background = '#CCFF00';
                        btn.style.color = '#000000';
                        btn.innerHTML = `<i class="fas fa-download"></i> DESCARGAR FOTO`;
                    }, 2500);
                }
            } catch (err) {
                console.error("Error downloading share image:", err);
                alert("Error al generar la imagen. Por favor, reintenta.");
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = `<i class="fas fa-exclamation-triangle"></i> REINTENTAR`;
                }
            }
        }

        async copyShareImageToClipboard(teamId, tabName, btnId) {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> PREPARANDO...`;
            }

            const team = this.lastTeams.find(t => t.id === teamId);
            if (!team) return;

            try {
                // Render fully in a hidden container to scale 1080x1920
                const container = document.createElement('div');
                container.style.cssText = "position: fixed; top: -9999px; left: -9999px; width: 1080px; height: 1920px; overflow: hidden; z-index: -9999;";
                container.innerHTML = this.getShareTemplateHTML(team, tabName, true);
                document.body.appendChild(container);

                // Delay to allow rendering
                await new Promise(resolve => setTimeout(resolve, 400));

                const canvas = await html2canvas(container, {
                    scale: 1.5, // Well optimized resolution for copying
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#07070a',
                    logging: false
                });

                document.body.removeChild(container);

                canvas.toBlob(async (blob) => {
                    if (!blob) {
                        throw new Error("No se pudo crear el blob de la imagen.");
                    }
                    try {
                        const item = new ClipboardItem({ "image/png": blob });
                        await navigator.clipboard.write([item]);
                        
                        if (btn) {
                            btn.innerHTML = `<i class="fas fa-check"></i> ¡IMAGEN COPIADA!`;
                            btn.style.borderColor = '#38b000';
                            btn.style.color = '#CCFF00';
                            setTimeout(() => {
                                btn.disabled = false;
                                btn.style.borderColor = 'rgba(255,255,255,0.15)';
                                btn.style.color = 'white';
                                btn.innerHTML = `<i class="far fa-clipboard"></i> COPIAR IMAGEN`;
                            }, 2500);
                        }
                    } catch (clipErr) {
                        console.warn("Restricciones del Portapapeles del navegador, activando fallback de descarga:", clipErr);
                        // Safe download fallback if browser prevents direct copying
                        this.downloadShareImage(teamId, tabName, btnId);
                    }
                }, 'image/png');

            } catch (err) {
                console.error("Error copying share image:", err);
                alert("Restricción del navegador. Se procederá a la descarga del cromo.");
                this.downloadShareImage(teamId, tabName, btnId);
            }
        }
    }

    window.TeamView = new TeamView();
})();
