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
                                <button onclick="
                                    if (window.db && window.db.clearPersistence) {
                                        const btn = this;
                                        btn.innerHTML = '<i class=\\'fas fa-spinner fa-spin\\'></i> Limpiando...';
                                        window.db.clearPersistence().then(() => {
                                            window.location.reload(true);
                                        }).catch(err => {
                                            console.error('Error clearing persistence:', err);
                                            window.location.reload(true);
                                        });
                                    } else {
                                        window.location.reload(true);
                                    }
                                " style="margin-top: 12px; background: linear-gradient(135deg, #0f172a 0%, #334155 100%); color: white; border: none; padding: 8px 14px; border-radius: 12px; font-size: 0.7rem; font-weight: 900; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 10px rgba(15,23,42,0.15); transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 6px 15px rgba(15,23,42,0.2)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 10px rgba(15,23,42,0.15)';">
                                    <i class="fas fa-sync-alt"></i> SINCRONIZAR DATOS
                                </button>
                            </div>
                            <img src="img/logo_somospadel.png" style="width: 60px; height: 60px; object-fit: contain; flex-shrink: 0; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.05));">
                        </div>
                        
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
                const pendingMatches = sortedMatches.filter(m => m.status === 'pending' || m.status === 'scheduled');
                
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
                                <button onclick="window.open('https://wa.me/?text=${encodeURIComponent(`🏆 Clasificación de ${team.name}:\n` + standings.slice(0, 3).map(s => `${s.pos}. ${s.team} - ${s.pts} pts`).join('\n'))}', '_blank')" 
                                        style="flex: 1; background: #25D366; color: white; border: none; padding: 12px; border-radius: 16px; font-weight: 900; font-size: 0.7rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 4px 12px rgba(37,211,102,0.15); transition: 0.2s;">
                                    <i class="fab fa-whatsapp" style="font-size: 0.85rem;"></i> COMPARTIR TABLA
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
                                    (team.name.includes('4MA') || team.name.includes('4M A') || team.name === 'SOMOS PÁDEL BCN 4M') ? 'alejandro coscolin' : '';

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
    }

    window.TeamView = new TeamView();
})();
