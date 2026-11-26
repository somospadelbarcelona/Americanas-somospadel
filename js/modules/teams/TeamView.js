/**
 * TeamView.js - Revolución Mobile-First (Broadcast Athletic Pro)
 * Hub Radar del Club + Carrusel Matchday + Top Jugadores Liga + Ficha Full-Screen con Swipe.
 */
(function () {
    class TeamView {
        constructor() {
            this.container = null;
            this.activeCategory = 'Todos';
            this.activeHubMode = 'teams'; // 'teams' | 'players'
            this.searchQuery = '';
            this.searchOpen = false;
            this.lastTeams = [];
            this.chartsData = {};
            this.activeMyTeamIndex = 0;

            // Estado de la Ficha Full-Screen
            this.activeSheetTeamId = null;
            this.activeSheetTab = 'resumen'; // 'resumen' | 'class' | 'sched' | 'rost' | 'stats'
            this.activeSchedFilter = 'all'; // 'all' | 'pending' | 'completed'
            this.rosterSearchQuery = '';
            this.activeChartInstance = null;
            this._touchStartX = 0;
            this._touchStartY = 0;
        }

        // ==================================================
        // 🧠 HELPERS DE DATOS Y ESTADÍSTICAS (BUGS CORREGIDOS)
        // ==================================================

        getMatchVenue(match) {
            if (!match) return 'Club por definir';
            const raw = match.location || match.venue || '';
            const clean = String(raw).replace(/\s+\.$/, '').trim();
            return clean || 'Club por definir';
        }

        getMatchResult(match) {
            if (!match || match.status !== 'completed') {
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

            const isHome = match.isHome !== false;
            let teamScore = isHome ? score1 : score2;
            let oppScore = isHome ? score2 : score1;

            let isWin;
            let isLoss;
            const resFlag = String(match.result || '').toUpperCase().trim();
            if (resFlag === 'W' || resFlag === 'V') {
                isWin = true;
                isLoss = false;
                if (teamScore < oppScore) {
                    const tmp = teamScore;
                    teamScore = oppScore;
                    oppScore = tmp;
                }
            } else if (resFlag === 'L' || resFlag === 'D') {
                isWin = false;
                isLoss = true;
                if (teamScore > oppScore) {
                    const tmp = teamScore;
                    teamScore = oppScore;
                    oppScore = tmp;
                }
            } else {
                isWin = teamScore > oppScore;
                isLoss = teamScore < oppScore;
            }

            return {
                valid: true,
                score1,
                score2,
                teamScore,
                oppScore,
                isWin,
                isLoss,
                displayScore: `${teamScore} - ${oppScore}`
            };
        }

        getShortTeamName(name) {
            if (!name) return 'Equipo';
            return String(name).replace(/SOMOS\s+P[AÁ]DEL\s*(BCN)?/i, '').trim() || name;
        }

        getCategoryStyle(category) {
            const c = String(category || '').toLowerCase();
            if (c.includes('masc')) {
                return { accent: '#0284c7', bg: 'rgba(2, 132, 199, 0.12)', text: '#0369a1', label: 'Masculina' };
            }
            if (c.includes('fem')) {
                return { accent: '#db2777', bg: 'rgba(219, 39, 119, 0.12)', text: '#be185d', label: 'Femenina' };
            }
            if (c.includes('mixt')) {
                return { accent: '#9333ea', bg: 'rgba(147, 51, 234, 0.12)', text: '#7e22ce', label: 'Mixta' };
            }
            return { accent: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', text: '#047857', label: category || 'Club' };
        }

        computeTeamMetrics(team) {
            const schedule = Array.isArray(team.schedule) ? team.schedule : [];
            const standings = Array.isArray(team.groupStandings) ? team.groupStandings : [];
            const sortedMatches = [...schedule].sort((a, b) => (parseInt(a.j, 10) || 0) - (parseInt(b.j, 10) || 0));

            const completedMatches = sortedMatches.filter(m => m.status === 'completed' && m.score);
            const pendingMatches = sortedMatches.filter(m =>
                (m.status === 'pending' || m.status === 'scheduled' || m.status === 'upcoming') &&
                m.opponent && !String(m.opponent).toUpperCase().includes('BYE')
            );

            let homeWins = 0, homePlayed = 0;
            let awayWins = 0, awayPlayed = 0;
            const streak = [];
            const chartLabels = ['J0'];
            const chartPoints = [0];
            let accPoints = 0;
            const breakdown = { w30: 0, w21: 0, l12: 0, l03: 0 };

            completedMatches.forEach(m => {
                const res = this.getMatchResult(m);
                if (!res.valid) return;

                accPoints += res.teamScore;
                chartLabels.push('J' + m.j);
                chartPoints.push(accPoints);

                if (m.isHome !== false) {
                    homePlayed++;
                    if (res.isWin) homeWins++;
                } else {
                    awayPlayed++;
                    if (res.isWin) awayWins++;
                }

                streak.push(res.isWin ? 'W' : 'L');

                if (res.teamScore >= 3 && res.oppScore === 0) breakdown.w30++;
                else if (res.isWin) breakdown.w21++;
                else if (res.teamScore >= 1) breakdown.l12++;
                else breakdown.l03++;
            });

            const totalPlayed = (team.stats && team.stats.pj) ? team.stats.pj : (homePlayed + awayPlayed);
            const totalWins = (team.stats && team.stats.pg !== undefined) ? team.stats.pg : (homeWins + awayWins);
            const totalLosses = (team.stats && team.stats.pp !== undefined) ? team.stats.pp : Math.max(0, totalPlayed - totalWins);
            const winRate = totalPlayed > 0 ? Math.round((totalWins / totalPlayed) * 100) : 0;

            const homeWinRate = homePlayed > 0 ? Math.round((homeWins / homePlayed) * 100) : 0;
            const awayWinRate = awayPlayed > 0 ? Math.round((awayWins / awayPlayed) * 100) : 0;

            const pts = team.points || 0;
            const leaderPts = standings.length > 0 ? (parseInt(standings[0].pts, 10) || 0) : pts;
            const secondPts = standings.length > 1 ? (parseInt(standings[1].pts, 10) || 0) : pts;
            const rank = parseInt(team.ranking || team.pos, 10) || 0;
            const totalGroupTeams = standings.length || 8;
            const diffToLeader = rank === 1 ? (pts - secondPts) : (pts - leaderPts);
            const avgPts = totalPlayed > 0 ? (pts / totalPlayed).toFixed(1) : '0.0';

            let zone = 'mid';
            if (rank > 0 && rank <= 2) zone = 'top';
            else if (rank > 0 && totalGroupTeams >= 5 && rank >= totalGroupTeams - 1) zone = 'low';

            this.chartsData[team.id] = { labels: chartLabels, data: chartPoints };

            return {
                winRate,
                totalPlayed,
                totalWins,
                totalLosses,
                homeWins,
                homePlayed,
                homeWinRate,
                awayWins,
                awayPlayed,
                awayWinRate,
                streak: streak.slice(-5),
                breakdown,
                pendingMatch: pendingMatches[0] || null,
                remainingMatches: pendingMatches.length,
                leaderPts,
                diffToLeader,
                totalGroupTeams,
                rank,
                zone,
                avgPts
            };
        }

        detectUserHeroTeam(teams) {
            if (!teams || teams.length === 0) return null;
            const favId = localStorage.getItem('favTeam_somospadel');
            if (favId) {
                const favTeam = teams.find(t => t.id === favId);
                if (favTeam) return { team: favTeam, reason: 'fav' };
            }

            // Intentar detectar por usuario logueado
            let authUser = null;
            try {
                if (window.Store && typeof window.Store.getState === 'function') authUser = window.Store.getState('currentUser');
                if (!authUser && window.currentUser) authUser = window.currentUser;
                if (!authUser) {
                    const raw = localStorage.getItem('currentUser');
                    if (raw) authUser = JSON.parse(raw);
                }
            } catch (e) {}

            const rawName = String(authUser?.name || authUser?.displayName || '').trim();
            if (rawName.length >= 3) {
                const norm = rawName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                const parts = norm.split(/\s+/).filter(Boolean);
                const found = teams.find(t => (t.roster || []).some(p => {
                    const pn = String(p.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                    return pn === norm || (parts.length >= 2 && pn.includes(parts[0]) && pn.includes(parts[1]));
                }));
                if (found) return { team: found, reason: 'roster' };
            }
            return null;
        }

        // ==================================================
        // ⚡ ACCIONES Y CONTROLES DEL HUB
        // ==================================================

        toggleFavorite(teamId) {
            const currentFav = localStorage.getItem('favTeam_somospadel');
            if (currentFav === teamId) {
                localStorage.removeItem('favTeam_somospadel');
            } else {
                localStorage.setItem('favTeam_somospadel', teamId);
            }
            if (window.navigator.vibrate) window.navigator.vibrate(20);
            this.render(this.lastTeams);
            if (this.activeSheetTeamId === teamId) {
                this.renderTeamSheet(teamId, this.activeSheetTab);
            }
        }

        syncData(btn) {
            if (btn) {
                btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Limpiando...`;
                btn.disabled = true;
            }
            if (window.db && window.db.clearPersistence) {
                window.db.clearPersistence()
                    .then(() => window.location.reload(true))
                    .catch(() => window.location.reload(true));
            } else {
                window.location.reload(true);
            }
        }

        setCategory(category) {
            this.activeCategory = category;
            if (window.PlayerView?.haptic) window.PlayerView.haptic(15);
            if (window.TeamController && window.TeamController.teams && window.TeamController.teams.length > 0) {
                window.TeamController.render();
            } else {
                this.render(this.lastTeams);
            }
        }

        setHubMode(mode) {
            this.activeHubMode = mode;
            if (window.PlayerView?.haptic) window.PlayerView.haptic(15);
            this.render(this.lastTeams);
        }

        toggleSearchBar() {
            this.searchOpen = !this.searchOpen;
            if (window.PlayerView?.haptic) window.PlayerView.haptic(10);
            const wrap = document.getElementById('tp-search-wrap');
            const btn = document.getElementById('tp-search-toggle-btn');
            if (wrap) wrap.classList.toggle('open', this.searchOpen);
            if (btn) btn.classList.toggle('active', this.searchOpen);
            if (this.searchOpen) {
                const input = document.getElementById('team-search-input');
                if (input) setTimeout(() => input.focus(), 80);
            } else if (this.searchQuery) {
                this.clearSearch();
            }
        }

        handleSearch(query) {
            this.searchQuery = query;
            this.filterDOM();
        }

        clearSearch() {
            const input = document.getElementById('team-search-input');
            if (input) input.value = '';
            this.searchQuery = '';
            this.filterDOM();
            if (window.TeamController) {
                window.TeamController.searchQuery = '';
            }
        }

        // Compatibilidad con llamadas antiguas
        scrollCategories() {}
        updateCategoryScrollButtons() {}
        initCategoryScroll() {}
        scrollToActiveCategory() {}

        focusTeam(teamId) {
            this.openTeamSheet(teamId, 'resumen');
        }

        toggleCard(teamId) {
            this.openTeamSheet(teamId, 'resumen');
        }

        focusPlayer(teamId, playerName) {
            if (window.PlayerView?.haptic) window.PlayerView.haptic(15);
            this.openTeamSheet(teamId, 'rost', playerName);
        }

        switchCardTab(teamId, tabName) {
            if (this.activeSheetTeamId === teamId) {
                this.switchSheetTab(tabName);
            } else {
                this.openTeamSheet(teamId, tabName);
            }
        }

        openMapsForVenue(venue) {
            const q = encodeURIComponent(venue || 'Padel Barcelona');
            window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank', 'noopener');
        }

        // ==================================================
        // 🎨 RENDER PRINCIPAL: RADAR DEL CLUB (MOBILE-FIRST)
        // ==================================================

        render(teams) {
            if (teams && teams.length > 0) {
                this.lastTeams = teams;
            } else if (!this.lastTeams) {
                this.lastTeams = [];
            }

            const allTeams = this.lastTeams;
            this.container = document.getElementById('content-area');
            if (!this.container) return;

            // Filtrar por categoría
            let filteredTeams = this.activeCategory === 'Todos'
                ? [...allTeams]
                : allTeams.filter(t => t.category === this.activeCategory);

            const favId = localStorage.getItem('favTeam_somospadel');
            filteredTeams.sort((a, b) => {
                if (a.id === favId) return -1;
                if (b.id === favId) return 1;
                return (parseInt(a.ranking || a.pos, 10) || 99) - (parseInt(b.ranking || b.pos, 10) || 99);
            });

            // KPIs globales reales del club
            const totalTeamsCount = allTeams.length;
            let clubPlayed = 0;
            let clubWins = 0;
            let top2Count = 0;
            let totalPointsCount = 0;
            const upcomingMatches = [];

            allTeams.forEach(t => {
                const m = this.computeTeamMetrics(t);
                clubPlayed += m.totalPlayed;
                clubWins += m.totalWins;
                totalPointsCount += (t.points || 0);
                if (m.rank > 0 && m.rank <= 2) top2Count++;
                if (m.pendingMatch) {
                    upcomingMatches.push({ team: t, match: m.pendingMatch, metrics: m });
                }
            });

            const clubWinRate = clubPlayed > 0 ? Math.round((clubWins / clubPlayed) * 100) : 0;

            // Conteos categorías
            const countTodos = allTeams.length;
            const countMasc = allTeams.filter(t => (t.category || '').toLowerCase().includes('masc')).length;
            const countFem = allTeams.filter(t => (t.category || '').toLowerCase().includes('fem')).length;
            const countMixt = allTeams.filter(t => (t.category || '').toLowerCase().includes('mixt')).length;

            const categoryFilters = [
                { key: 'Todos', label: `Todos (${countTodos})` },
                { key: 'Masculina', label: `Masc (${countMasc})` },
                { key: 'Femenina', label: `Fem (${countFem})` },
                { key: 'Mixta', label: `Mixta (${countMixt})` }
            ];

            const heroInfo = this.detectUserHeroTeam(allTeams);

            this.container.innerHTML = `
                <div class="tp-hub animate-fade-in">

                    <!-- 🏆 CLUB HERO & KPIs DE LIGA -->
                    <div class="tp-club-hero">
                        <div class="tp-club-hero-top">
                            <div class="tp-club-brand">
                                <img src="img/logo_somospadel.png" alt="SomosPádel" class="tp-club-logo"
                                     onerror="this.onerror=null; this.src='img/official_ball_logo.png';">
                                <div style="min-width:0;">
                                    <div class="tp-league-pill">
                                        <span class="tp-league-dot"></span>
                                        <span>Lliga GuinotPrunera • 2026</span>
                                    </div>
                                    <h1 class="tp-club-title">Equipos del Club</h1>
                                </div>
                            </div>
                            <button type="button" class="tp-jornada-cta" onclick="window.TeamView.openNextMatchesSummaryModal()">
                                <i class="fas fa-bolt"></i> Jornada
                            </button>
                        </div>

                        <div class="tp-kpi-grid">
                            <div class="tp-kpi-box">
                                <div class="tp-kpi-val" id="header-teams-count">${totalTeamsCount}</div>
                                <div class="tp-kpi-lbl">Equipos</div>
                            </div>
                            <div class="tp-kpi-box">
                                <div class="tp-kpi-val accent-amber">${top2Count}</div>
                                <div class="tp-kpi-lbl">En Top 2</div>
                            </div>
                            <div class="tp-kpi-box">
                                <div class="tp-kpi-val accent-emerald">${clubWinRate}%</div>
                                <div class="tp-kpi-lbl">Victorias</div>
                            </div>
                            <div class="tp-kpi-box">
                                <div class="tp-kpi-val accent-lime">${totalPointsCount}</div>
                                <div class="tp-kpi-lbl">Pts Club</div>
                            </div>
                        </div>
                    </div>

                    ${heroInfo ? this.renderHeroFavoriteBanner(heroInfo.team, heroInfo.reason) : ''}

                    ${upcomingMatches.length > 0 ? `
                    <!-- 🔥 CARRUSEL HORIZONTAL PRÓXIMA JORNADA -->
                    <div class="tp-section-head">
                        <span class="tp-section-title"><i class="fas fa-fire" style="color:#f97316;"></i> Próximos Partidos (${upcomingMatches.length})</span>
                        <button type="button" class="tp-section-link" onclick="window.TeamView.openNextMatchesSummaryModal()">Ver Cartel HD →</button>
                    </div>
                    <div class="tp-matchday-strip">
                        ${upcomingMatches.map(({ team, match }) => {
                            const isHome = match.isHome !== false;
                            const venue = this.getMatchVenue(match);
                            return `
                                <div class="tp-md-card ${isHome ? 'home' : 'away'}" onclick="window.TeamView.openTeamSheet('${team.id}', 'resumen')">
                                    <div class="tp-md-top">
                                        <span class="tp-md-team">${this.getShortTeamName(team.name)} • J${match.j}</span>
                                        <span class="tp-loc-pill ${isHome ? 'home' : 'away'}">${isHome ? '🏠 Casa' : '✈️ Fuera'}</span>
                                    </div>
                                    <div class="tp-md-opp">vs ${match.opponent}</div>
                                    <div class="tp-md-meta">
                                        <span><i class="far fa-calendar"></i> ${match.date || 'TBD'} • ${match.time || ''}</span>
                                    </div>
                                    <div class="tp-md-meta" style="color:#475569;">
                                        <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"><i class="fas fa-map-marker-alt" style="color:${isHome ? '#10b981' : '#3b82f6'};"></i> ${venue}</span>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    ` : ''}

                    <!-- 🎛️ BARRA STICKY COMPACTA: MODO + CATEGORÍAS + LUPA -->
                    <div class="tp-controls-sticky">
                        <div class="tp-mode-row">
                            <div class="tp-segmented">
                                <button type="button" class="tp-seg-btn ${this.activeHubMode === 'teams' ? 'active' : ''}" onclick="window.TeamView.setHubMode('teams')">
                                    <i class="fas fa-shield-alt"></i> Equipos (${filteredTeams.length})
                                </button>
                                <button type="button" class="tp-seg-btn ${this.activeHubMode === 'players' ? 'active' : ''}" onclick="window.TeamView.setHubMode('players')">
                                    <i class="fas fa-medal"></i> Top Jugadores
                                </button>
                            </div>
                            <button type="button" id="tp-search-toggle-btn" class="tp-search-toggle ${this.searchOpen || this.searchQuery ? 'active' : ''}" onclick="window.TeamView.toggleSearchBar()" aria-label="Buscar">
                                <i class="fas fa-search"></i>
                            </button>
                        </div>

                        <div id="tp-search-wrap" class="tp-search-wrap ${this.searchOpen || this.searchQuery ? 'open' : ''}">
                            <i class="fas fa-search" style="position:absolute;left:13px;top:50%;transform:translateY(-50%);color:#94a3b8;font-size:0.85rem;pointer-events:none;"></i>
                            <input type="text"
                                   id="team-search-input"
                                   class="tp-search-input"
                                   value="${this.searchQuery || ''}"
                                   oninput="window.TeamView.handleSearch(this.value)"
                                   placeholder="${this.activeHubMode === 'players' ? 'Buscar jugador de liga...' : 'Buscar equipo o jugador (ej: 3MA, Alex, Rosell)...'}">
                            <button id="clear-search-btn"
                                    type="button"
                                    onclick="window.TeamView.clearSearch()"
                                    style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;color:#94a3b8;cursor:pointer;display:${this.searchQuery ? 'block' : 'none'};padding:6px;">
                                <i class="fas fa-times-circle"></i>
                            </button>
                        </div>

                        <div class="tp-cat-strip">
                            ${categoryFilters.map(f => `
                                <button type="button"
                                        class="tp-cat-chip ${this.activeCategory === f.key ? 'active' : ''}"
                                        onclick="window.TeamController ? window.TeamController.setCategory('${f.key}') : window.TeamView.setCategory('${f.key}')">
                                    ${f.label}
                                </button>
                            `).join('')}
                        </div>
                    </div>

                    <!-- 👥 RESULTADOS RÁPIDOS DE JUGADORES EN BÚSQUEDA -->
                    <div id="team-search-results-panel" style="display:none;margin-bottom:12px;"></div>

                    <!-- 🚀 CONTENIDO PRINCIPAL: EQUIPOS O TOP JUGADORES -->
                    ${this.activeHubMode === 'teams' ? `
                        <div id="teams-list-grid" class="tp-teams-grid">
                            ${filteredTeams.map(team => this.renderTeamCard(team)).join('')}
                        </div>
                    ` : this.renderClubPlayersLeaderboard(filteredTeams)}

                    <div id="no-results-message" style="display:none;padding:42px 20px;text-align:center;background:#ffffff;border-radius:20px;border:1px dashed #cbd5e1;margin-top:10px;">
                        <i class="fas fa-search-minus" style="font-size:2rem;color:#cbd5e1;margin-bottom:10px;"></i>
                        <p style="color:#0f172a;font-weight:900;font-size:0.95rem;margin:0 0 4px;">Sin resultados</p>
                        <p style="color:#64748b;font-weight:700;font-size:0.78rem;margin:0;">Prueba con otro equipo o nombre de jugador.</p>
                    </div>
                </div>
            `;

            if (this.searchQuery) {
                this.filterDOM();
            }

            if (window.Router && typeof window.Router.attachCommunitySubmenu === 'function') {
                window.Router.attachCommunitySubmenu('teams');
            }
        }

        renderHeroFavoriteBanner(team, reason) {
            const m = this.computeTeamMetrics(team);
            const nextJ = m.pendingMatch ? m.pendingMatch.j : '1';
            return `
                <div class="tp-myteam-banner">
                    <div class="tp-myteam-top">
                        <div style="min-width:0;">
                            <span class="tp-myteam-badge">
                                <i class="fas ${reason === 'fav' ? 'fa-star' : 'fa-user-check'}"></i>
                                ${reason === 'fav' ? 'Tu Equipo Favorito' : 'Tu Equipo Detectado'}
                            </span>
                            <div style="font-size:1.05rem;font-weight:950;color:#0f172a;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                                ${team.name}
                            </div>
                            <div style="font-size:0.72rem;color:#475569;font-weight:750;">
                                Pos #${m.rank || '-'} • ${team.points || 0} pts • ${m.totalWins}V-${m.totalLosses}D (${m.winRate}%)
                            </div>
                        </div>
                        <div class="tp-streak-dots">
                            ${m.streak.map(r => `<span class="tp-dot ${r === 'W' ? 'w' : 'l'}">${r === 'W' ? 'V' : 'D'}</span>`).join('')}
                        </div>
                    </div>
                    <div class="tp-myteam-actions">
                        <button type="button" class="tp-btn-rsvp" onclick="window.TeamController.openPlayerRsvpModal('${team.id}', '${nextJ}')">
                            <i class="fas fa-check-circle"></i> Confirmar J${nextJ}
                        </button>
                        <button type="button" class="tp-btn-outline" onclick="window.TeamView.openTeamSheet('${team.id}', 'resumen')">
                            Ver Ficha →
                        </button>
                    </div>
                </div>
            `;
        }

        renderTeamCard(team) {
            const favId = localStorage.getItem('favTeam_somospadel');
            const isFav = team.id === favId;
            const m = this.computeTeamMetrics(team);
            const catStyle = this.getCategoryStyle(team.category);
            const cleanCap = window.getTeamCaptain ? window.getTeamCaptain(team) : (team.captain || 'Por definir');
            const shortName = this.getShortTeamName(team.name);
            const posClass = m.rank === 1 ? 'pos-1' : (m.rank === 2 ? 'pos-2' : (m.rank === 3 ? 'pos-3' : ''));

            let nextText = `Temporada: ${m.totalWins}V - ${m.totalLosses}D`;
            if (m.pendingMatch) {
                nextText = `${m.pendingMatch.isHome !== false ? '🏠' : '✈️'} J${m.pendingMatch.j} vs ${m.pendingMatch.opponent}`;
            }

            return `
                <div class="tp-team-card team-card ${isFav ? 'is-fav' : ''}"
                     id="team-${team.id}"
                     data-team-id="${team.id}"
                     onclick="window.TeamView.openTeamSheet('${team.id}', 'resumen')">
                    <div class="tp-zone-bar zone-${m.zone}"></div>

                    <div class="tp-card-main">
                        <div class="tp-rank-badge ${posClass}">
                            <span class="tp-rank-num">#${m.rank || '-'}</span>
                            <span class="tp-rank-sub">POS</span>
                        </div>

                        <div class="tp-card-info">
                            <div class="tp-card-title-row">
                                <h3 class="tp-card-name">${shortName}</h3>
                                <span class="tp-cat-tag" style="background:${catStyle.bg};color:${catStyle.text};">${catStyle.label}</span>
                            </div>
                            <div class="tp-card-sub">
                                ${(team.division || '').replace(/\n/g, ' ')} • <i class="fas fa-crown" style="color:#f59e0b;font-size:0.65rem;"></i> ${cleanCap}
                            </div>
                        </div>

                        <div class="tp-card-pts">
                            <div class="tp-pts-big">${team.points || 0}<span style="font-size:0.65rem;color:#64748b;font-weight:800;"> pts</span></div>
                            <div class="tp-pts-sub">${m.totalWins}V-${m.totalLosses}D • ${m.winRate}%</div>
                        </div>
                    </div>

                    <div class="tp-card-foot">
                        <div class="tp-streak-dots" title="Últimos 5 partidos">
                            ${m.streak.length > 0
                                ? m.streak.map(r => `<span class="tp-dot ${r === 'W' ? 'w' : 'l'}">${r === 'W' ? 'V' : 'D'}</span>`).join('')
                                : '<span class="tp-dot empty">-</span>'}
                        </div>

                        <div class="tp-next-mini">${nextText}</div>

                        <button type="button"
                                class="tp-fav-btn ${isFav ? 'active' : ''}"
                                onclick="event.stopPropagation(); window.TeamView.toggleFavorite('${team.id}')"
                                aria-label="Favorito">
                            <i class="fas fa-star"></i>
                        </button>
                    </div>
                </div>
            `;
        }

        renderClubPlayersLeaderboard(teams) {
            const playerMap = new Map();
            teams.forEach(t => {
                const shortT = this.getShortTeamName(t.name);
                (t.roster || []).forEach(p => {
                    const name = String(p.name || '').trim();
                    if (!name) return;
                    const key = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                    const pts = parseFloat(p.pts) || 0;
                    if (!playerMap.has(key)) {
                        playerMap.set(key, {
                            name,
                            pts,
                            teams: [{ id: t.id, shortName: shortT, category: t.category }]
                        });
                    } else {
                        const existing = playerMap.get(key);
                        existing.pts = Math.max(existing.pts, pts);
                        if (!existing.teams.some(x => x.id === t.id)) {
                            existing.teams.push({ id: t.id, shortName: shortT, category: t.category });
                        }
                    }
                });
            });

            const list = Array.from(playerMap.values()).sort((a, b) => b.pts - a.pts || a.name.localeCompare(b.name, 'es'));
            const bgColors = ['#0284c7', '#7c3aed', '#db2777', '#d97706', '#059669', '#4f46e5'];

            return `
                <div id="tp-players-leaderboard" class="tp-players-list">
                    ${list.map((p, idx) => {
                        const rank = idx + 1;
                        const rCls = rank === 1 ? 'top1' : (rank === 2 ? 'top2' : (rank === 3 ? 'top3' : ''));
                        const initial = p.name.charAt(0).toUpperCase();
                        const bg = bgColors[p.name.length % bgColors.length];
                        const primaryTeamId = p.teams[0].id;
                        const safeName = p.name.replace(/'/g, "\\'");
                        return `
                            <div class="tp-player-card tp-leaderboard-row"
                                 data-search-name="${p.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}"
                                 onclick="window.TeamView.focusPlayer('${primaryTeamId}', '${safeName}')">
                                <div class="tp-player-rank ${rCls}">#${rank}</div>
                                <div class="tp-avatar" style="background:${bg};">${initial}</div>
                                <div style="flex:1;min-width:0;">
                                    <div style="font-size:0.9rem;font-weight:900;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.name}</div>
                                    <div class="tp-player-badges">
                                        ${p.teams.map(tm => `<span class="tp-team-pill">${tm.shortName}</span>`).join('')}
                                    </div>
                                </div>
                                <div class="tp-pts-pill">${Math.round(p.pts)} pts</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }

        // ==================================================
        // 📱 FICHA FULL-SCREEN DE EQUIPO (ESTILO FOTMOB / SOFASCORE)
        // ==================================================

        openTeamSheet(teamId, initialTab = 'resumen', highlightPlayer = null) {
            const team = this.lastTeams.find(t => t.id === teamId) || (window.ClubTeamsData || []).find(t => t.id === teamId);
            if (!team) return;

            this.activeSheetTeamId = team.id;
            this.activeSheetTab = initialTab || 'resumen';
            this.activeSchedFilter = 'all';
            this.rosterSearchQuery = '';

            if (window.PlayerView?.haptic) window.PlayerView.haptic(15);
            this.renderTeamSheet(team.id, this.activeSheetTab, highlightPlayer);
        }

        closeTeamSheet() {
            const existing = document.getElementById('team-hub-sheet');
            if (existing) existing.remove();
            if (this.activeChartInstance) {
                try { this.activeChartInstance.destroy(); } catch (e) {}
                this.activeChartInstance = null;
            }
            this.activeSheetTeamId = null;
            document.body.style.overflow = '';
            if (window.PlayerView?.haptic) window.PlayerView.haptic(10);
        }

        navigateSheetTeam(delta) {
            const list = this.activeCategory === 'Todos'
                ? this.lastTeams
                : this.lastTeams.filter(t => t.category === this.activeCategory);
            if (!list || list.length <= 1) return;

            const idx = list.findIndex(t => t.id === this.activeSheetTeamId);
            const nextIdx = (idx + delta + list.length) % list.length;
            this.openTeamSheet(list[nextIdx].id, this.activeSheetTab);
        }

        switchSheetTab(tabName) {
            this.activeSheetTab = tabName;
            if (window.PlayerView?.haptic) window.PlayerView.haptic(10);
            this.renderTeamSheet(this.activeSheetTeamId, tabName);
        }

        setSheetSchedFilter(filter) {
            this.activeSchedFilter = filter;
            this.renderTeamSheet(this.activeSheetTeamId, 'sched');
        }

        filterSheetRoster(val) {
            this.rosterSearchQuery = val || '';
            const norm = this.rosterSearchQuery.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
            document.querySelectorAll('#tp-sheet-roster-list .player-roster-row').forEach(row => {
                const rn = (row.getAttribute('data-player-name') || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                row.style.display = (!norm || rn.includes(norm)) ? 'flex' : 'none';
            });
        }

        renderTeamSheet(teamId, activeTab = 'resumen', highlightPlayer = null) {
            const team = this.lastTeams.find(t => t.id === teamId) || (window.ClubTeamsData || []).find(t => t.id === teamId);
            if (!team) return;

            const m = this.computeTeamMetrics(team);
            const favId = localStorage.getItem('favTeam_somospadel');
            const isFav = team.id === favId;
            const shortName = this.getShortTeamName(team.name);
            const cleanCap = window.getTeamCaptain ? window.getTeamCaptain(team) : (team.captain || 'Por definir');
            const officialLink = (team.link && team.link.startsWith('http') && team.link !== 'about:blank') ? team.link : 'https://summapadel.com/event/151';

            let sheet = document.getElementById('team-hub-sheet');
            if (!sheet) {
                sheet = document.createElement('div');
                sheet.id = 'team-hub-sheet';
                sheet.className = 'tp-sheet-overlay tp-sheet';
                document.body.appendChild(sheet);
                document.body.style.overflow = 'hidden';

                // Swipe lateral táctil entre equipos
                sheet.addEventListener('touchstart', (e) => {
                    if (e.touches && e.touches.length === 1) {
                        this._touchStartX = e.touches[0].clientX;
                        this._touchStartY = e.touches[0].clientY;
                    }
                }, { passive: true });
                sheet.addEventListener('touchend', (e) => {
                    if (!e.changedTouches || e.changedTouches.length !== 1) return;
                    if (e.target && e.target.closest('.tp-sheet-tabs, table')) return;
                    const dx = e.changedTouches[0].clientX - this._touchStartX;
                    const dy = e.changedTouches[0].clientY - this._touchStartY;
                    if (Math.abs(dx) > 75 && Math.abs(dy) < 45) {
                        this.navigateSheetTeam(dx < 0 ? 1 : -1);
                    }
                }, { passive: true });
            }

            const tabs = [
                { id: 'resumen', icon: 'fa-bolt', label: 'Resumen' },
                { id: 'class', icon: 'fa-trophy', label: 'Tabla' },
                { id: 'sched', icon: 'fa-calendar-alt', label: 'Partidos' },
                { id: 'rost', icon: 'fa-users', label: `Plantilla (${(team.roster || []).length})` },
                { id: 'stats', icon: 'fa-chart-line', label: 'Stats' }
            ];

            const shareTabParam = activeTab === 'resumen' ? 'class' : activeTab;

            let bodyHtml = '';
            if (activeTab === 'resumen') bodyHtml = this.renderSheetResumen(team, m, cleanCap);
            else if (activeTab === 'class') bodyHtml = this.renderSheetStandings(team, m);
            else if (activeTab === 'sched') bodyHtml = this.renderSheetSchedule(team, m);
            else if (activeTab === 'rost') bodyHtml = this.renderSheetRoster(team, cleanCap);
            else if (activeTab === 'stats') bodyHtml = this.renderSheetStats(team, m);

            sheet.innerHTML = `
                <div class="tp-sheet-header">
                    <div class="tp-sheet-nav">
                        <button type="button" class="tp-icon-btn" onclick="window.TeamView.closeTeamSheet()" aria-label="Volver">
                            <i class="fas fa-arrow-left"></i>
                        </button>

                        <div class="tp-switcher">
                            <button type="button" onclick="window.TeamView.navigateSheetTeam(-1)" aria-label="Equipo anterior"><i class="fas fa-chevron-left"></i></button>
                            <span>${shortName}</span>
                            <button type="button" onclick="window.TeamView.navigateSheetTeam(1)" aria-label="Equipo siguiente"><i class="fas fa-chevron-right"></i></button>
                        </div>

                        <div style="display:flex;gap:6px;">
                            <button type="button" class="tp-icon-btn ${isFav ? 'fav-on' : ''}" onclick="window.TeamView.toggleFavorite('${team.id}')" aria-label="Favorito">
                                <i class="fas fa-star"></i>
                            </button>
                            <a href="${officialLink}" target="_blank" rel="noopener" class="tp-icon-btn" title="Web Oficial SummaPádel">
                                <i class="fas fa-external-link-alt"></i>
                            </a>
                        </div>
                    </div>

                    <div class="tp-sheet-title-block">
                        <div style="min-width:0;">
                            <h2 class="tp-sheet-team-name">${team.name}</h2>
                            <div class="tp-sheet-sub">${(team.division || '').replace(/\n/g, ' ')} • ${team.group || team.category} • 👑 ${cleanCap}</div>
                        </div>
                        <div class="tp-sheet-pos-pill">
                            <div style="font-size:1.1rem;font-weight:950;line-height:1;">#${m.rank || '-'}</div>
                            <div style="font-size:0.62rem;font-weight:900;margin-top:2px;">${team.points || 0} PTS</div>
                        </div>
                    </div>

                    <div class="tp-sheet-tabs">
                        ${tabs.map(t => `
                            <button type="button" class="tp-sheet-tab ${activeTab === t.id ? 'active' : ''}" onclick="window.TeamView.switchSheetTab('${t.id}')">
                                <i class="fas ${t.icon}"></i> ${t.label}
                            </button>
                        `).join('')}
                    </div>
                </div>

                <div class="tp-sheet-body" id="tp-sheet-scroll-body">
                    ${bodyHtml}
                </div>

                <div class="tp-sheet-footer">
                    <button type="button" class="tp-foot-btn primary" onclick="window.TeamController.showTeamDetail('${team.id}', 'convocatoria')">
                        <i class="fas fa-clipboard-check"></i> Convocatoria & RSVP
                    </button>
                    <button type="button" class="tp-foot-btn tactic" onclick="window.TeamController.showTeamDetail('${team.id}', 'tactica')">
                        <i class="fas fa-chess"></i> Táctica
                    </button>
                    <button type="button" class="tp-foot-btn whatsapp" onclick="window.TeamView.openShareModal('${team.id}', '${shareTabParam}')" aria-label="Compartir por WhatsApp">
                        <i class="fab fa-whatsapp" style="font-size:1.15rem;"></i>
                    </button>
                </div>
            `;

            if (activeTab === 'stats') {
                setTimeout(() => this.renderSheetChart(team.id), 60);
            }

            if (activeTab === 'rost' && highlightPlayer) {
                setTimeout(() => {
                    const normTarget = highlightPlayer.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
                    const rows = document.querySelectorAll('#tp-sheet-roster-list .player-roster-row');
                    rows.forEach(row => {
                        const rn = (row.getAttribute('data-player-name') || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
                        if (rn && (rn.includes(normTarget) || normTarget.includes(rn))) {
                            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            row.style.background = '#fef08a';
                            row.style.borderColor = '#eab308';
                            setTimeout(() => {
                                row.style.background = '#ecfdf5';
                                row.style.borderColor = '#10b981';
                            }, 2200);
                        }
                    });
                }, 120);
            }
        }

        renderSheetResumen(team, m, cleanCap) {
            const topPlayers = [...(team.roster || [])].sort((a, b) => (parseFloat(b.pts) || 0) - (parseFloat(a.pts) || 0)).slice(0, 3);
            const diffLabel = m.rank === 1
                ? (m.diffToLeader > 0 ? `+${m.diffToLeader} al 2º` : 'Empate líder')
                : `${m.diffToLeader} del 1º`;

            const next = m.pendingMatch;
            const nextVenue = next ? this.getMatchVenue(next) : '';
            const safeVenue = nextVenue.replace(/'/g, "\\'");

            return `
                <!-- KPIs rápidos del equipo -->
                <div class="tp-panel-card">
                    <div class="tp-panel-title">
                        <span><i class="fas fa-tachometer-alt"></i> Situación en Liga</span>
                        <span style="color:${m.rank === 1 ? '#059669' : '#0284c7'};">${diffLabel}</span>
                    </div>
                    <div class="tp-stat-grid-4">
                        <div class="tp-stat-mini">
                            <strong>${team.points || 0}</strong>
                            <span>Puntos</span>
                        </div>
                        <div class="tp-stat-mini">
                            <strong style="color:#059669;">${m.totalWins}-${m.totalLosses}</strong>
                            <span>Bal. G-P</span>
                        </div>
                        <div class="tp-stat-mini">
                            <strong>${m.winRate}%</strong>
                            <span>Win Rate</span>
                        </div>
                        <div class="tp-stat-mini">
                            <strong>${m.remainingMatches}</strong>
                            <span>Quedan</span>
                        </div>
                    </div>
                </div>

                <!-- Próximo partido o Estado de temporada -->
                ${next ? `
                <div class="tp-panel-card" style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);color:#ffffff;border:none;">
                    <div class="tp-panel-title" style="color:#94a3b8;">
                        <span>🎾 Próximo Partido • Jornada ${next.j}</span>
                        <span class="tp-loc-pill ${next.isHome !== false ? 'home' : 'away'}">${next.isHome !== false ? '🏠 Casa' : '✈️ Fuera'}</span>
                    </div>
                    <div style="font-size:1.12rem;font-weight:950;margin-bottom:8px;">vs ${next.opponent}</div>
                    <div style="font-size:0.78rem;color:#cbd5e1;font-weight:700;display:flex;flex-direction:column;gap:4px;margin-bottom:12px;">
                        <div><i class="far fa-calendar-alt" style="color:#ccff00;width:18px;"></i> ${next.date || 'Por definir'} • ${next.time || 'TBD'}</div>
                        <div><i class="fas fa-map-marker-alt" style="color:#ccff00;width:18px;"></i> ${nextVenue}</div>
                    </div>
                    <div style="display:flex;gap:8px;">
                        <button type="button" class="tp-btn-rsvp" onclick="window.TeamController.openPlayerRsvpModal('${team.id}', '${next.j}')">
                            <i class="fas fa-check-circle"></i> Responder RSVP
                        </button>
                        <button type="button" class="tp-btn-outline" style="background:rgba(255,255,255,0.1);color:#fff;border-color:rgba(255,255,255,0.2);" onclick="window.TeamView.openMapsForVenue('${safeVenue}')">
                            <i class="fas fa-directions"></i> Mapa
                        </button>
                        <button type="button" class="tp-btn-outline" style="background:rgba(255,255,255,0.1);color:#ccff00;border-color:rgba(204,255,0,0.35);" onclick="window.TeamController.showRivalScouting('${team.id}', '${String(next.opponent || '').replace(/'/g, "\\'")}')">
                            <i class="fas fa-binoculars"></i>
                        </button>
                    </div>
                </div>
                ` : `
                <div class="tp-panel-card" style="background:#f0fdf4;border-color:#bbf7d0;">
                    <div style="display:flex;align-items:center;gap:10px;">
                        <span style="font-size:1.5rem;">🏁</span>
                        <div>
                            <div style="font-size:0.9rem;font-weight:950;color:#065f46;">Fase Regular Completada</div>
                            <div style="font-size:0.75rem;color:#047857;font-weight:700;">Balance final: ${m.totalWins} victorias y ${m.totalLosses} derrotas (${team.points || 0} pts).</div>
                        </div>
                    </div>
                </div>
                `}

                <!-- Racha últimos 5 -->
                <div class="tp-panel-card">
                    <div class="tp-panel-title">
                        <span><i class="fas fa-fire" style="color:#f97316;"></i> Racha Reciente (Últimos 5)</span>
                        <span>Media: ${m.avgPts} pts/j</span>
                    </div>
                    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                        <div class="tp-streak-dots" style="gap:7px;">
                            ${m.streak.length > 0
                                ? m.streak.map(r => `<span class="tp-dot ${r === 'W' ? 'w' : 'l'}" style="width:30px;height:30px;font-size:0.78rem;border-radius:9px;">${r === 'W' ? 'V' : 'D'}</span>`).join('')
                                : '<span style="font-size:0.78rem;color:#64748b;font-weight:700;">Sin partidos completados</span>'}
                        </div>
                        <button type="button" class="tp-section-link" onclick="window.TeamView.switchSheetTab('stats')">Ver Stats →</button>
                    </div>
                </div>

                <!-- Top 3 Jugadores MVP del equipo -->
                ${topPlayers.length > 0 ? `
                <div class="tp-panel-card">
                    <div class="tp-panel-title">
                        <span><i class="fas fa-medal" style="color:#eab308;"></i> Top Jugadores del Equipo</span>
                        <button type="button" class="tp-section-link" onclick="window.TeamView.switchSheetTab('rost')">Ver todos (${(team.roster || []).length}) →</button>
                    </div>
                    <div style="display:flex;flex-direction:column;gap:8px;">
                        ${topPlayers.map((p, i) => `
                            <div style="display:flex;align-items:center;justify-content:space-between;padding:9px 11px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;">
                                <div style="display:flex;align-items:center;gap:9px;min-width:0;">
                                    <span style="font-weight:950;font-size:0.85rem;color:${i === 0 ? '#eab308' : '#64748b'};width:22px;">#${i + 1}</span>
                                    <span style="font-size:0.85rem;font-weight:850;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.name}</span>
                                </div>
                                <span class="tp-pts-pill">${Math.round(parseFloat(p.pts) || 0)} pts</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
            `;
        }

        renderSheetStandings(team, m) {
            const standings = team.groupStandings || [];
            if (standings.length === 0) {
                return `
                    <div class="tp-panel-card" style="text-align:center;padding:32px 16px;">
                        <i class="fas fa-trophy" style="font-size:2rem;color:#cbd5e1;margin-bottom:8px;"></i>
                        <div style="font-weight:900;color:#0f172a;">Clasificación sincronizándose</div>
                        <div style="font-size:0.78rem;color:#64748b;margin-top:4px;">Pronto verás la tabla actualizada de SummaPádel.</div>
                    </div>
                `;
            }

            const leaderPts = parseInt(standings[0].pts, 10) || 0;
            const totalRows = standings.length;

            return `
                <div class="tp-panel-card" style="padding:12px 10px;">
                    <div class="tp-panel-title" style="padding:0 4px;">
                        <span><i class="fas fa-list-ol"></i> ${team.group || 'Clasificación de Grupo'}</span>
                        <span style="font-size:0.62rem;color:#0284c7;">Toca un rival para Scouting</span>
                    </div>
                    <table class="tp-standings-table">
                        <thead>
                            <tr>
                                <th>Equipo</th>
                                <th>PJ</th>
                                <th>G-P</th>
                                <th>PTS</th>
                                <th>DIF</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${standings.map((s, idx) => {
                                const pos = parseInt(s.pos, 10) || (idx + 1);
                                const isMe = !!s.isCurrent;
                                const pts = parseInt(s.pts, 10) || 0;
                                const diff = idx === 0 ? 'Líder' : `${pts - leaderPts}`;
                                const zoneColor = pos <= 2 ? '#10b981' : (totalRows >= 5 && pos >= totalRows - 1 ? '#ef4444' : 'transparent');
                                const safeRival = String(s.team || '').replace(/'/g, "\\'");
                                return `
                                    <tr class="tp-standings-row ${isMe ? 'is-me' : ''}"
                                        onclick="${isMe ? '' : `window.TeamController.showRivalScouting('${team.id}', '${safeRival}')`}">
                                        <td style="border-left:4px solid ${zoneColor};">
                                            <div style="display:flex;align-items:center;gap:8px;">
                                                <span style="font-weight:950;color:${pos === 1 ? '#ca8a04' : '#64748b'};min-width:18px;">${pos}</span>
                                                <span style="font-weight:${isMe ? '950' : '800'};color:${isMe ? '#047857' : '#0f172a'};line-height:1.2;">${s.team}</span>
                                            </div>
                                        </td>
                                        <td>${s.pj}</td>
                                        <td style="white-space:nowrap;">${s.pg}-${s.pp !== undefined ? s.pp : Math.max(0, (s.pj || 0) - (s.pg || 0))}</td>
                                        <td><strong style="color:${isMe ? '#059669' : '#0f172a'};font-size:0.92rem;">${pts}</strong></td>
                                        <td style="font-size:0.7rem;color:${idx === 0 ? '#059669' : '#64748b'};font-weight:900;">${diff}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                    <div style="display:flex;gap:12px;margin-top:10px;padding:0 4px;font-size:0.65rem;font-weight:800;color:#64748b;">
                        <span><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:#10b981;margin-right:4px;"></span>Zona Top / Ascenso</span>
                        <span><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:#ef4444;margin-right:4px;"></span>Zona Baja</span>
                    </div>
                </div>
            `;
        }

        renderSheetSchedule(team) {
            const schedule = Array.isArray(team.schedule) ? [...team.schedule].sort((a, b) => (parseInt(a.j, 10) || 0) - (parseInt(b.j, 10) || 0)) : [];
            const filtered = schedule.filter(m => {
                if (this.activeSchedFilter === 'pending') return m.status !== 'completed';
                if (this.activeSchedFilter === 'completed') return m.status === 'completed';
                return true;
            });

            return `
                <div style="display:flex;gap:6px;margin-bottom:12px;">
                    <button type="button" class="tp-cat-chip ${this.activeSchedFilter === 'all' ? 'active' : ''}" onclick="window.TeamView.setSheetSchedFilter('all')">Todos (${schedule.length})</button>
                    <button type="button" class="tp-cat-chip ${this.activeSchedFilter === 'pending' ? 'active' : ''}" onclick="window.TeamView.setSheetSchedFilter('pending')">Pendientes</button>
                    <button type="button" class="tp-cat-chip ${this.activeSchedFilter === 'completed' ? 'active' : ''}" onclick="window.TeamView.setSheetSchedFilter('completed')">Jugados</button>
                </div>

                ${filtered.length > 0 ? filtered.map(m => {
                    const isBye = String(m.opponent || '').toUpperCase().includes('BYE');
                    const res = this.getMatchResult(m);
                    const isHome = m.isHome !== false;
                    const venue = this.getMatchVenue(m);
                    const scoreCls = res.valid ? (res.isWin ? 'win' : 'loss') : 'pending';
                    const scoreTxt = res.valid ? `${res.isWin ? 'V' : 'D'} ${res.displayScore}` : (isBye ? 'DESCANSO' : 'PENDIENTE');
                    const safeOpp = String(m.opponent || '').replace(/'/g, "\\'");

                    return `
                        <div class="tp-match-row">
                            <div style="min-width:0;flex:1;">
                                <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;flex-wrap:wrap;">
                                    <span style="font-size:0.65rem;font-weight:950;background:#0f172a;color:#ccff00;padding:2px 6px;border-radius:6px;">J${m.j}</span>
                                    ${!isBye ? `<span class="tp-loc-pill ${isHome ? 'home' : 'away'}">${isHome ? 'Casa' : 'Fuera'}</span>` : ''}
                                    <span style="font-size:0.7rem;color:#64748b;font-weight:750;">${m.date || ''} ${m.time ? '• ' + m.time : ''}</span>
                                </div>
                                <div style="font-size:0.9rem;font-weight:900;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                                    ${isBye ? 'Jornada de Descanso (BYE)' : `vs ${m.opponent}`}
                                </div>
                                ${!isBye ? `
                                <div style="font-size:0.72rem;color:#64748b;font-weight:700;margin-top:2px;display:flex;align-items:center;gap:8px;">
                                    <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"><i class="fas fa-map-marker-alt" style="font-size:0.65rem;"></i> ${venue}</span>
                                    <button type="button" onclick="window.TeamController.showRivalScouting('${team.id}', '${safeOpp}')" style="background:none;border:none;color:#0284c7;font-weight:850;font-size:0.68rem;padding:0;cursor:pointer;flex-shrink:0;">Scouting</button>
                                </div>
                                ` : ''}
                            </div>
                            <div class="tp-match-score ${scoreCls}">${scoreTxt}</div>
                        </div>
                    `;
                }).join('') : `
                    <div class="tp-panel-card" style="text-align:center;padding:28px;color:#64748b;font-weight:700;">
                        No hay partidos en este filtro.
                    </div>
                `}
            `;
        }

        renderSheetRoster(team, cleanCap) {
            const roster = [...(team.roster || [])].sort((a, b) => (parseFloat(b.pts) || 0) - (parseFloat(a.pts) || 0));
            const maxPts = roster.length > 0 ? Math.max(...roster.map(p => parseFloat(p.pts) || 0)) : 0;
            const cleanCapLower = cleanCap.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const bgColors = ['#0284c7', '#7c3aed', '#db2777', '#d97706', '#059669', '#4f46e5'];

            return `
                <div style="position:relative;margin-bottom:12px;">
                    <i class="fas fa-search" style="position:absolute;left:13px;top:50%;transform:translateY(-50%);color:#94a3b8;font-size:0.8rem;"></i>
                    <input type="text" class="tp-search-input" value="${this.rosterSearchQuery}" oninput="window.TeamView.filterSheetRoster(this.value)" placeholder="Filtrar jugador de ${this.getShortTeamName(team.name)}...">
                </div>

                <div id="tp-sheet-roster-list" style="display:flex;flex-direction:column;gap:8px;">
                    ${roster.map((p, idx) => {
                        const pName = p.name || 'Jugador';
                        const pPts = Math.round(parseFloat(p.pts) || 0);
                        const pct = maxPts > 0 ? Math.round((pPts / maxPts) * 100) : 0;
                        const norm = pName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                        const isCap = cleanCapLower.length > 3 && norm.includes(cleanCapLower);
                        const isMVP = maxPts > 0 && pPts === Math.round(maxPts);
                        const bg = bgColors[pName.length % bgColors.length];

                        return `
                            <div class="tp-player-card player-roster-row" data-player-name="${pName}" style="cursor:default;">
                                <div class="tp-player-rank ${idx === 0 ? 'top1' : ''}">#${idx + 1}</div>
                                <div class="tp-avatar" style="background:${bg};">${pName.charAt(0).toUpperCase()}</div>
                                <div style="flex:1;min-width:0;">
                                    <div style="font-size:0.9rem;font-weight:900;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${pName}</div>
                                    <div style="display:flex;align-items:center;gap:5px;margin-top:3px;">
                                        ${isCap ? '<span style="background:#0f172a;color:#ccff00;font-size:0.56rem;font-weight:950;padding:1px 6px;border-radius:5px;">CAPITÁN</span>' : ''}
                                        ${isMVP ? '<span style="background:#eab308;color:#fff;font-size:0.56rem;font-weight:950;padding:1px 6px;border-radius:5px;">MVP</span>' : ''}
                                        <div style="flex:1;height:5px;background:#e2e8f0;border-radius:4px;overflow:hidden;max-width:90px;">
                                            <div style="width:${pct}%;height:100%;background:#10b981;"></div>
                                        </div>
                                    </div>
                                </div>
                                <div class="tp-pts-pill">${pPts} pts</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }

        renderSheetStats(team, m) {
            return `
                <!-- Evolución de puntos -->
                <div class="tp-panel-card">
                    <div class="tp-panel-title">
                        <span><i class="fas fa-chart-area" style="color:#10b981;"></i> Evolución de Puntos por Jornada</span>
                        <span>Media: ${m.avgPts} pts/j</span>
                    </div>
                    <div style="height:155px;width:100%;">
                        <canvas id="tp-sheet-chart-${team.id}"></canvas>
                    </div>
                </div>

                <!-- Desglose de marcadores -->
                <div class="tp-panel-card">
                    <div class="tp-panel-title">
                        <span><i class="fas fa-layer-group"></i> Desglose de Eliminatorias</span>
                        <span>${m.totalPlayed} jugadas</span>
                    </div>
                    <div class="tp-breakdown-grid">
                        <div class="tp-bd-box w30">
                            <div style="font-size:1.25rem;font-weight:950;">${m.breakdown.w30}</div>
                            <div style="font-size:0.64rem;font-weight:900;">3-0 Win</div>
                        </div>
                        <div class="tp-bd-box w21">
                            <div style="font-size:1.25rem;font-weight:950;">${m.breakdown.w21}</div>
                            <div style="font-size:0.64rem;font-weight:900;">2-1 Win</div>
                        </div>
                        <div class="tp-bd-box l12">
                            <div style="font-size:1.25rem;font-weight:950;">${m.breakdown.l12}</div>
                            <div style="font-size:0.64rem;font-weight:900;">1-2 Loss</div>
                        </div>
                        <div class="tp-bd-box l03">
                            <div style="font-size:1.25rem;font-weight:950;">${m.breakdown.l03}</div>
                            <div style="font-size:0.64rem;font-weight:900;">0-3 Loss</div>
                        </div>
                    </div>
                </div>

                <!-- Local vs Visitante -->
                <div class="tp-panel-card">
                    <div class="tp-panel-title">
                        <span><i class="fas fa-balance-scale"></i> Rendimiento Casa vs Fuera</span>
                        <span>Win Rate: ${m.winRate}%</span>
                    </div>

                    <div style="margin-bottom:14px;">
                        <div style="display:flex;justify-content:space-between;font-size:0.8rem;font-weight:850;margin-bottom:6px;">
                            <span>🏠 En Casa</span>
                            <span style="color:#059669;">${m.homeWinRate}% <span style="color:#64748b;font-size:0.72rem;">(${m.homeWins}V - ${m.homePlayed - m.homeWins}D)</span></span>
                        </div>
                        <div style="height:9px;background:#e2e8f0;border-radius:6px;overflow:hidden;">
                            <div style="width:${m.homeWinRate}%;height:100%;background:linear-gradient(90deg,#10b981,#34d399);"></div>
                        </div>
                    </div>

                    <div>
                        <div style="display:flex;justify-content:space-between;font-size:0.8rem;font-weight:850;margin-bottom:6px;">
                            <span>✈️ Visitante</span>
                            <span style="color:${m.awayWinRate >= 50 ? '#059669' : '#dc2626'};">${m.awayWinRate}% <span style="color:#64748b;font-size:0.72rem;">(${m.awayWins}V - ${m.awayPlayed - m.awayWins}D)</span></span>
                        </div>
                        <div style="height:9px;background:#e2e8f0;border-radius:6px;overflow:hidden;">
                            <div style="width:${m.awayWinRate}%;height:100%;background:${m.awayWinRate >= 50 ? 'linear-gradient(90deg,#0284c7,#38bdf8)' : 'linear-gradient(90deg,#ef4444,#f87171)'};"></div>
                        </div>
                    </div>
                </div>
            `;
        }

        renderSheetChart(teamId) {
            const ctx = document.getElementById(`tp-sheet-chart-${teamId}`);
            if (!ctx) return;

            const draw = () => {
                if (typeof Chart === 'undefined') return;
                if (this.activeChartInstance) {
                    try { this.activeChartInstance.destroy(); } catch (e) {}
                }
                const chartData = this.chartsData[teamId];
                if (!chartData || chartData.labels.length < 2) {
                    ctx.parentNode.innerHTML = '<div style="height:120px;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:0.78rem;font-weight:700;">Aún no hay suficientes jornadas completadas</div>';
                    return;
                }
                this.activeChartInstance = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: chartData.labels,
                        datasets: [{
                            label: 'Puntos Acumulados',
                            data: chartData.data,
                            borderColor: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.14)',
                            borderWidth: 3,
                            pointBackgroundColor: '#0f172a',
                            pointBorderColor: '#ccff00',
                            pointBorderWidth: 2,
                            pointRadius: 4,
                            tension: 0.32,
                            fill: true
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: { beginAtZero: true, ticks: { precision: 0, font: { size: 10, family: 'Outfit' } }, grid: { color: '#f1f5f9' } },
                            x: { ticks: { font: { size: 10, family: 'Outfit' } }, grid: { display: false } }
                        }
                    }
                });
            };

            if (typeof Chart === 'undefined' && window.loadExternalScript) {
                window.loadExternalScript('https://cdn.jsdelivr.net/npm/chart.js', 'Chart').then(draw).catch(() => {});
            } else {
                draw();
            }
        }

        // ==================================================
        // 🔍 FILTRADO INSTANTÁNEO (EQUIPOS Y JUGADORES)
        // ==================================================

        filterDOM() {
            const queryRaw = (this.searchQuery || '').trim();
            const query = queryRaw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

            const clearBtn = document.getElementById('clear-search-btn');
            if (clearBtn) clearBtn.style.display = query ? 'block' : 'none';

            const resultsPanel = document.getElementById('team-search-results-panel');
            const noResultsMsg = document.getElementById('no-results-message');

            // Modo Top Jugadores
            if (this.activeHubMode === 'players') {
                if (resultsPanel) resultsPanel.style.display = 'none';
                const rows = document.querySelectorAll('.tp-leaderboard-row');
                let visible = 0;
                rows.forEach(row => {
                    const name = row.getAttribute('data-search-name') || '';
                    const show = !query || name.includes(query);
                    row.style.display = show ? 'flex' : 'none';
                    if (show) visible++;
                });
                if (noResultsMsg) noResultsMsg.style.display = visible === 0 ? 'block' : 'none';
                return;
            }

            // Modo Equipos
            const allTeams = this.lastTeams || [];
            const cards = document.querySelectorAll('#teams-list-grid .team-card');
            let visibleCount = 0;
            const foundPlayers = [];

            if (query.length >= 2) {
                allTeams.forEach(t => {
                    (t.roster || []).forEach(p => {
                        const pn = String(p.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                        if (pn.includes(query)) {
                            foundPlayers.push({ player: p, team: t });
                        }
                    });
                });
            }

            if (resultsPanel) {
                if (foundPlayers.length > 0) {
                    resultsPanel.style.display = 'block';
                    resultsPanel.innerHTML = `
                        <div class="tp-panel-card" style="margin-bottom:0;background:#f0fdf4;border-color:#86efac;">
                            <div class="tp-panel-title" style="color:#047857;margin-bottom:8px;">
                                <span><i class="fas fa-user-check"></i> Jugadores encontrados (${foundPlayers.length})</span>
                            </div>
                            <div style="display:flex;flex-direction:column;gap:6px;">
                                ${foundPlayers.slice(0, 6).map(({ player, team }) => {
                                    const safeName = String(player.name || '').replace(/'/g, "\\'");
                                    return `
                                        <div onclick="window.TeamView.focusPlayer('${team.id}', '${safeName}')"
                                             style="display:flex;align-items:center;justify-content:space-between;background:#ffffff;padding:9px 11px;border-radius:12px;border:1px solid #dcfce7;cursor:pointer;">
                                            <div style="min-width:0;">
                                                <div style="font-size:0.84rem;font-weight:900;color:#0f172a;">${player.name}</div>
                                                <div style="font-size:0.68rem;font-weight:800;color:#059669;">${this.getShortTeamName(team.name)} • ${team.category}</div>
                                            </div>
                                            <span class="tp-pts-pill">${Math.round(parseFloat(player.pts) || 0)} pts</span>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    `;
                } else {
                    resultsPanel.style.display = 'none';
                    resultsPanel.innerHTML = '';
                }
            }

            cards.forEach(card => {
                const tid = card.getAttribute('data-team-id');
                const team = allTeams.find(t => t.id === tid);
                if (!team) return;

                const hay = [
                    team.name, team.category, team.division, team.group, team.captain,
                    ...(team.roster || []).map(p => p.name)
                ].join(' ').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

                const show = !query || hay.includes(query);
                card.style.display = show ? 'block' : 'none';
                if (show) visibleCount++;
            });

            if (noResultsMsg) {
                noResultsMsg.style.display = (visibleCount === 0 && foundPlayers.length === 0) ? 'block' : 'none';
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
            const teamMatchesRaw = teams.map(team => {
                let nextMatch = null;
                if (team.schedule && team.schedule.length > 0) {
                    const sortedMatches = [...team.schedule].sort((a, b) => parseInt(a.j) - parseInt(b.j));
                    const pendingMatches = sortedMatches.filter(m => (m.status === 'pending' || m.status === 'scheduled' || m.status === 'upcoming') && m.opponent !== 'BYE' && !m.opponent.includes('BYE'));
                    if (pendingMatches.length > 0) {
                        nextMatch = pendingMatches[0];
                    }
                }
                return { team, nextMatch };
            });

            // ──────────────────────────────────────────────────
            // 🏅 ORDENAR POR CATEGORÍA: Masculina → Femenina → Mixta
            // ──────────────────────────────────────────────────
            const categoryOrder = { 'Masculina': 0, 'Femenina': 1, 'Mixta': 2 };
            const teamMatches = [...teamMatchesRaw].sort((a, b) => {
                const catA = categoryOrder[a.team.category] ?? 99;
                const catB = categoryOrder[b.team.category] ?? 99;
                return catA - catB;
            });

            // ──────────────────────────────────────────────────
            // 🎨 PALETA DE COLORES POR CATEGORÍA
            // ──────────────────────────────────────────────────
            const categoryStyles = {
                'Masculina': {
                    accent:      '#0284c7',
                    accentDark:  '#0369a1',
                    cardBg:      '#f0f9ff',
                    border:      '#bae6fd',
                    gradient:    'linear-gradient(180deg, #0284c7 0%, #0369a1 100%)',
                    teamColor:   '#0284c7',
                    emoji:       '👨',
                    label:       'MASCULINA',
                    headerBg:    'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                },
                'Femenina': {
                    accent:      '#db2777',
                    accentDark:  '#be185d',
                    cardBg:      '#fdf2f8',
                    border:      '#fbcfe8',
                    gradient:    'linear-gradient(180deg, #db2777 0%, #be185d 100%)',
                    teamColor:   '#db2777',
                    emoji:       '👩',
                    label:       'FEMENINA',
                    headerBg:    'linear-gradient(135deg, #db2777 0%, #f472b6 100%)',
                },
                'Mixta': {
                    accent:      '#7c3aed',
                    accentDark:  '#6d28d9',
                    cardBg:      '#f5f3ff',
                    border:      '#ddd6fe',
                    gradient:    'linear-gradient(180deg, #7c3aed 0%, #6d28d9 100%)',
                    teamColor:   '#7c3aed',
                    emoji:       '👥',
                    label:       'MIXTA',
                    headerBg:    'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
                },
            };
            const defaultStyle = {
                accent: '#38b000', accentDark: '#007200', cardBg: '#f8fafc',
                border: '#e2e8f0', gradient: 'linear-gradient(180deg, #38b000 0%, #007200 100%)',
                teamColor: '#38b000', emoji: '🏓', label: '', headerBg: 'linear-gradient(135deg, #38b000, #70e000)',
            };

            // Determinar dimensiones según la cantidad de equipos para que quepan todos en 1920px de alto
            const count = teams.length;
            let sizes = {
                containerPadding: '50px 46px',
                headerMarginBottom: '32px',
                headerTitleFontSize: '52px',
                headerBannerPadding: '16px 50px',
                headerBannerFontSize: '40px',
                rowGap: '14px',
                catHeaderFontSize: '22px',
                catHeaderPadding: '10px 20px',
                catHeaderMarginBottom: '8px',
                cardPadding: '22px 28px',
                cardGap: '8px',
                teamNameFontSize: '30px',
                homeAwayFontSize: '20px',
                homeAwayPadding: '7px 16px',
                vsFontSize: '34px',
                detailsFontSize: '24px',
                jornadaFontSize: '20px',
                footerMarginTop: '32px',
                footerPaddingTop: '24px',
                footerLine1FontSize: '28px',
                footerLine2FontSize: '20px',
                noMatchPadding: '20px 28px',
                noMatchFontSize: '28px',
                noMatchTextFontSize: '24px'
            };

            if (count === 5) {
                sizes = {
                    containerPadding: '44px 40px',
                    headerMarginBottom: '26px',
                    headerTitleFontSize: '46px',
                    headerBannerPadding: '14px 44px',
                    headerBannerFontSize: '36px',
                    rowGap: '12px',
                    catHeaderFontSize: '20px',
                    catHeaderPadding: '8px 18px',
                    catHeaderMarginBottom: '6px',
                    cardPadding: '18px 24px',
                    cardGap: '6px',
                    teamNameFontSize: '28px',
                    homeAwayFontSize: '18px',
                    homeAwayPadding: '6px 14px',
                    vsFontSize: '30px',
                    detailsFontSize: '22px',
                    jornadaFontSize: '18px',
                    footerMarginTop: '26px',
                    footerPaddingTop: '20px',
                    footerLine1FontSize: '24px',
                    footerLine2FontSize: '18px',
                    noMatchPadding: '16px 22px',
                    noMatchFontSize: '26px',
                    noMatchTextFontSize: '22px'
                };
            } else if (count === 6) {
                sizes = {
                    containerPadding: '36px 34px',
                    headerMarginBottom: '20px',
                    headerTitleFontSize: '42px',
                    headerBannerPadding: '12px 38px',
                    headerBannerFontSize: '32px',
                    rowGap: '10px',
                    catHeaderFontSize: '18px',
                    catHeaderPadding: '7px 16px',
                    catHeaderMarginBottom: '5px',
                    cardPadding: '14px 20px',
                    cardGap: '5px',
                    teamNameFontSize: '24px',
                    homeAwayFontSize: '16px',
                    homeAwayPadding: '5px 12px',
                    vsFontSize: '27px',
                    detailsFontSize: '20px',
                    jornadaFontSize: '16px',
                    footerMarginTop: '20px',
                    footerPaddingTop: '16px',
                    footerLine1FontSize: '22px',
                    footerLine2FontSize: '16px',
                    noMatchPadding: '12px 18px',
                    noMatchFontSize: '22px',
                    noMatchTextFontSize: '19px'
                };
            } else if (count >= 7) {
                sizes = {
                    containerPadding: '28px 26px',
                    headerMarginBottom: '14px',
                    headerTitleFontSize: '36px',
                    headerBannerPadding: '8px 28px',
                    headerBannerFontSize: '28px',
                    rowGap: '9px',
                    catHeaderFontSize: '16px',
                    catHeaderPadding: '6px 14px',
                    catHeaderMarginBottom: '4px',
                    cardPadding: '12px 16px',
                    cardGap: '4px',
                    teamNameFontSize: '22px',
                    homeAwayFontSize: '14px',
                    homeAwayPadding: '4px 10px',
                    vsFontSize: '24px',
                    detailsFontSize: '18px',
                    jornadaFontSize: '14px',
                    footerMarginTop: '14px',
                    footerPaddingTop: '12px',
                    footerLine1FontSize: '20px',
                    footerLine2FontSize: '14px',
                    noMatchPadding: '10px 14px',
                    noMatchFontSize: '20px',
                    noMatchTextFontSize: '17px'
                };
            }

            const cardStyle = isForCapture ? 'width: 1080px; height: 1920px;' : 'width: 100%; height: 100%;';

            // ──────────────────────────────────────────────────
            // 🏟️ CONSTRUIR LAS FILAS AGRUPADAS POR CATEGORÍA
            // ──────────────────────────────────────────────────
            let lastCategory = null;
            const teamRows = teamMatches.map((tm) => {
                const { team, nextMatch } = tm;
                const teamShortName = team.name.replace('SOMOS PÁDEL BCN ', '').replace('SOMOS PÁDEL ', '');
                const cat = team.category || '';
                const cs = categoryStyles[cat] || defaultStyle;

                // Cabecera de sección si es una nueva categoría
                let catHeader = '';
                if (cat !== lastCategory) {
                    lastCategory = cat;
                    if (cat) {
                        catHeader = `
                            <div style="display: flex; align-items: center; gap: 12px; margin-top: ${lastCategory === cat ? '0' : sizes.rowGap}; margin-bottom: ${sizes.catHeaderMarginBottom};">
                                <div style="flex: 1; height: 2px; background: ${cs.gradient}; border-radius: 2px; opacity: 0.5;"></div>
                                <div style="background: ${cs.headerBg}; color: #ffffff; padding: ${sizes.catHeaderPadding}; border-radius: 30px; font-size: ${sizes.catHeaderFontSize}; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; white-space: nowrap; box-shadow: 0 4px 12px ${cs.accent}33;">
                                    ${cs.emoji} ${cs.label}
                                </div>
                                <div style="flex: 1; height: 2px; background: ${cs.gradient}; border-radius: 2px; opacity: 0.5;"></div>
                            </div>
                        `;
                    }
                }

                let cardHTML = '';
                if (nextMatch) {
                    const isHome = nextMatch.isHome;
                    const homeAwayBg = isHome ? `${cs.accent}18` : 'rgba(37, 99, 235, 0.1)';
                    const homeAwayColor = isHome ? cs.accentDark : '#1d4ed8';
                    const homeAwayText = isHome ? '🏠 LOCAL' : '✈️ VISIT.';
                    cardHTML = `
                        <div style="background: ${cs.cardBg}; border: 1.5px solid ${cs.border}; border-radius: 20px; padding: ${sizes.cardPadding}; display: flex; flex-direction: column; gap: ${sizes.cardGap}; position: relative; overflow: hidden; box-shadow: 0 8px 20px ${cs.accent}12;">
                            <div style="position: absolute; top: 0; left: 0; width: 6px; height: 100%; background: ${cs.gradient}; border-radius: 6px 0 0 6px;"></div>
                            <div style="display: flex; justify-content: space-between; align-items: center; padding-left: 6px;">
                                <div style="font-size: ${sizes.teamNameFontSize}; font-weight: 950; color: ${cs.teamColor}; text-transform: uppercase; letter-spacing: 0.5px;">${teamShortName}</div>
                                <div style="background: ${homeAwayBg}; color: ${homeAwayColor}; padding: ${sizes.homeAwayPadding}; border-radius: 30px; font-size: ${sizes.homeAwayFontSize}; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">${homeAwayText}</div>
                            </div>
                            <div style="font-size: ${sizes.vsFontSize}; font-weight: 800; color: #0f172a; margin: 2px 0 2px; padding-left: 6px;">vs ${nextMatch.opponent}</div>
                            <div style="display: flex; gap: 20px; align-items: center; flex-wrap: wrap; padding-left: 6px;">
                                <div style="display: flex; align-items: center; gap: 8px; color: #475569; font-size: ${sizes.detailsFontSize}; font-weight: 700;">📅 ${nextMatch.date}${nextMatch.time ? ' · ' + nextMatch.time : ''} &nbsp; 📍 ${nextMatch.venue}</div>
                            </div>
                            <div style="color: ${cs.accent}; font-size: ${sizes.jornadaFontSize}; font-weight: 700; padding-left: 6px;">Jornada ${nextMatch.j} · ${team.group || team.division}</div>
                        </div>
                    `;
                } else {
                    cardHTML = `
                        <div style="background: ${cs.cardBg}; border: 1.5px solid ${cs.border}; border-radius: 20px; padding: ${sizes.noMatchPadding}; display: flex; align-items: center; gap: 16px; opacity: 0.7; box-shadow: 0 4px 12px ${cs.accent}08; position: relative; overflow: hidden;">
                            <div style="position: absolute; top: 0; left: 0; width: 6px; height: 100%; background: ${cs.gradient}; border-radius: 6px 0 0 6px;"></div>
                            <div style="font-size: ${sizes.noMatchFontSize}; font-weight: 950; color: ${cs.teamColor}; text-transform: uppercase; padding-left: 6px;">${teamShortName}</div>
                            <div style="color: #64748b; font-size: ${sizes.noMatchTextFontSize}; font-weight: 700;">— Sin partidos pendientes</div>
                        </div>
                    `;
                }
                return catHeader + cardHTML;
            }).join('');

            return `
                <div style="${cardStyle} background: linear-gradient(180deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%); font-family: 'Outfit', sans-serif; display: flex; flex-direction: column; position: relative; overflow: hidden; box-sizing: border-box; padding: ${sizes.containerPadding};">
                    <!-- Background glow effects sutiles -->
                    <div style="position: absolute; top: -120px; right: -80px; width: 450px; height: 450px; background: radial-gradient(circle, rgba(56,176,0,0.04), transparent 70%); pointer-events: none;"></div>
                    <div style="position: absolute; bottom: -120px; left: -80px; width: 400px; height: 400px; background: radial-gradient(circle, rgba(56,176,0,0.03), transparent 70%); pointer-events: none;"></div>

                    <!-- Header with Club Logo -->
                    <div style="text-align: center; margin-bottom: ${sizes.headerMarginBottom}; flex-shrink: 0; display: flex; flex-direction: column; align-items: center;">
                        <div style="margin-bottom: 20px; display: flex; justify-content: center; align-items: center; flex-shrink: 0;">
                            <img src="img/official_ball_logo.png" style="height: 100px; width: auto; object-fit: contain;" alt="Somos Pádel BCN">
                        </div>
                        <div style="font-size: 20px; font-weight: 900; color: #475569; letter-spacing: 5px; text-transform: uppercase; margin-bottom: 14px;">LLIGA GUINOTPRUNERA 2025-2026</div>
                        <div style="display: inline-block; background: linear-gradient(135deg, #CCFF00 0%, #38b000 100%); padding: ${sizes.headerBannerPadding}; border-radius: 50px; margin-bottom: 18px; box-shadow: 0 8px 30px rgba(56,176,0,0.15);">
                            <span style="font-size: ${sizes.headerBannerFontSize}; font-weight: 950; color: #000; text-transform: uppercase; letter-spacing: 3px;">⚡ PRÓXIMA JORNADA ⚡</span>
                        </div>
                        <div style="font-size: ${sizes.headerTitleFontSize}; font-weight: 950; color: #0f172a; text-transform: uppercase; letter-spacing: -0.5px; line-height: 1.15;">EQUIPOS <span style="background: linear-gradient(135deg, #38b000, #007200); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">SOMOS PÁDEL BCN</span></div>
                        <div style="width: 100px; height: 4px; background: linear-gradient(90deg, #38b000, #007200); margin: 20px auto 0; border-radius: 4px;"></div>
                    </div>

                    <!-- Team cards -->
                    <div style="display: flex; flex-direction: column; gap: ${sizes.rowGap}; flex: 1; justify-content: center;">
                        ${teamRows}
                    </div>

                    <!-- Footer -->
                    <div style="text-align: center; margin-top: ${sizes.footerMarginTop}; padding-top: ${sizes.footerPaddingTop}; border-top: 1px solid #e2e8f0; flex-shrink: 0;">
                        <div style="font-size: ${sizes.footerLine1FontSize}; font-weight: 800; color: #0f172a;">🎾 ¡Vamos equipo! Apoya a nuestros jugadores 💪🔥</div>
                        <div style="font-size: ${sizes.footerLine2FontSize}; color: #475569; font-weight: 700; margin-top: 12px;">${dateStr} • somospadel.es</div>
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
                    const pendingMatches = sortedMatches.filter(m => (m.status === 'pending' || m.status === 'scheduled' || m.status === 'upcoming') && m.opponent !== 'BYE' && !m.opponent.includes('BYE'));
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
        /**
         * 🏆 REVOLUCIONARIO MATCHDAY CENTER • PRÓXIMA JORNADA (FONDO BLANCO & TEXTO EN NEGRO)
         * Cartelera interactiva de partidos con alto contraste, cartel oficial HD y compartir inteligente.
         */
        openNextMatchesSummaryModal() {
            const teams = this.lastTeams || [];
            if (teams.length === 0) {
                alert("No hay equipos cargados.");
                return;
            }

            // Haptic feedback
            if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(25);

            // Extraer partidos de todos los equipos
            const matchesData = [];
            teams.forEach(team => {
                let nextMatch = null;
                if (team.schedule && team.schedule.length > 0) {
                    const sortedMatches = [...team.schedule].sort((a, b) => parseInt(a.j) - parseInt(b.j));
                    const pendingMatches = sortedMatches.filter(m => (m.status === 'pending' || m.status === 'scheduled' || m.status === 'upcoming') && m.opponent !== 'BYE' && !m.opponent.includes('BYE'));
                    if (pendingMatches.length > 0) {
                        nextMatch = pendingMatches[0];
                    }
                }
                const teamShortName = team.name.replace('SOMOS PÁDEL BCN ', '').replace('SOMOS PÁDEL ', '').toUpperCase();
                matchesData.push({
                    team,
                    teamShortName,
                    nextMatch
                });
            });

            const activeMatches = matchesData.filter(m => m.nextMatch !== null);
            const homeMatches = activeMatches.filter(m => m.nextMatch.isHome);
            const awayMatches = activeMatches.filter(m => !m.nextMatch.isHome);
            const restingTeams = matchesData.filter(m => m.nextMatch === null);
            const whatsAppText = this.getSummaryWhatsAppText(teams);

            // Generar tarjetas de partidos en MODO CLARO (FONDO BLANCO / TEXTO NEGRO DE ALTO CONTRASTE)
            const matchCardsHTML = activeMatches.map(item => {
                const { team, teamShortName, nextMatch } = item;
                const isHome = !!nextMatch.isHome;
                const opponent = nextMatch.opponent || 'Rival';
                const venue = nextMatch.venue || 'Club por confirmar';
                const date = nextMatch.date || 'Fecha por confirmar';
                const time = nextMatch.time || '';
                const jornada = nextMatch.j || 'Próx.';
                const category = team.category || 'Categoría';
                const group = team.group || team.division || '';
                const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue)}`;

                return `
                    <div class="summary-match-card" data-is-home="${isHome}" style="
                        background: #ffffff;
                        border: 1.5px solid #e2e8f0;
                        border-left: 5px solid ${isHome ? '#16a34a' : '#0284c7'};
                        border-radius: 20px;
                        padding: 16px;
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                        box-shadow: 0 4px 16px rgba(15, 23, 42, 0.06);
                        position: relative;
                        overflow: hidden;
                        transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
                    ">
                        <!-- Top status line -->
                        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <span style="background: #f1f5f9; color: #0f172a; border: 1px solid #e2e8f0; font-size: 0.65rem; font-weight: 900; padding: 4px 9px; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
                                    ${category}${group ? ' • ' + group : ''}
                                </span>
                                <span style="background: #fef08a; color: #854d0e; border: 1px solid #fde047; font-size: 0.65rem; font-weight: 950; padding: 4px 8px; border-radius: 8px;">
                                    J${jornada}
                                </span>
                            </div>
                            <span style="
                                background: ${isHome ? '#dcfce7' : '#e0f2fe'};
                                color: ${isHome ? '#15803d' : '#0369a1'};
                                border: 1.5px solid ${isHome ? '#86efac' : '#7dd3fc'};
                                font-size: 0.64rem; font-weight: 950; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px;
                                display: inline-flex; align-items: center; gap: 5px;
                            ">
                                <i class="fas ${isHome ? 'fa-home' : 'fa-plane'}"></i>
                                ${isHome ? 'EN CASA' : 'VISITANTE'}
                            </span>
                        </div>

                        <!-- Face-off Duel -->
                        <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; background: #f8fafc; padding: 12px 14px; border-radius: 14px; border: 1.5px solid #e2e8f0;">
                            <!-- Local / SomosPadel -->
                            <div style="display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0;">
                                <div style="width: 38px; height: 38px; border-radius: 50%; background: #0f172a; border: 2px solid #ccff00; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
                                    <img src="img/official_ball_logo.png" style="width: 28px; height: 28px; object-fit: contain;" alt="SomosPadel">
                                </div>
                                <div style="min-width: 0;">
                                    <div style="font-size: 0.6rem; color: #64748b; font-weight: 850; letter-spacing: 0.5px; text-transform: uppercase;">SOMOS PÁDEL</div>
                                    <div style="font-size: 1.05rem; font-weight: 950; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: -0.3px;">
                                        ${teamShortName}
                                    </div>
                                </div>
                            </div>

                            <!-- VS Badge -->
                            <div style="
                                width: 30px; height: 30px; border-radius: 50%;
                                background: #0f172a;
                                border: 1.5px solid #0f172a;
                                color: #ccff00; font-size: 0.7rem; font-weight: 950;
                                display: flex; align-items: center; justify-content: center; flex-shrink: 0;
                                box-shadow: 0 2px 6px rgba(15,23,42,0.25);
                            ">
                                VS
                            </div>

                            <!-- Rival -->
                            <div style="display: flex; align-items: center; justify-content: flex-end; gap: 10px; flex: 1; min-width: 0; text-align: right;">
                                <div style="min-width: 0;">
                                    <div style="font-size: 0.6rem; color: #64748b; font-weight: 850; letter-spacing: 0.5px; text-transform: uppercase;">RIVAL</div>
                                    <div style="font-size: 0.95rem; font-weight: 950; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: -0.2px;">
                                        ${opponent}
                                    </div>
                                </div>
                                <div style="width: 38px; height: 38px; border-radius: 50%; background: #e2e8f0; border: 1.5px solid #cbd5e1; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #334155; font-size: 0.95rem;">
                                    <i class="fas fa-shield-alt"></i>
                                </div>
                            </div>
                        </div>

                        <!-- Date, Time & Venue -->
                        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px 12px; display: flex; flex-direction: column; gap: 6px;">
                            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 6px;">
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <i class="fas fa-calendar-alt" style="color: #16a34a; font-size: 0.85rem;"></i>
                                    <span style="font-weight: 900; color: #0f172a; font-size: 0.78rem;">${date}</span>
                                    ${time ? `<span style="color: #94a3b8;">•</span> <i class="fas fa-clock" style="color: #0284c7; font-size: 0.8rem;"></i> <strong style="color: #0284c7; font-size: 0.78rem;">${time}</strong>` : ''}
                                </div>
                                <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" style="
                                    color: #0284c7; text-decoration: none; font-size: 0.68rem; font-weight: 900;
                                    display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 8px;
                                    background: #f0f9ff; border: 1px solid #bae6fd; transition: all 0.2s;
                                " onmouseover="this.style.background='#0284c7'; this.style.color='#ffffff';" onmouseout="this.style.background='#f0f9ff'; this.style.color='#0284c7';">
                                    <i class="fas fa-directions"></i> Maps
                                </a>
                            </div>
                            <div style="display: flex; align-items: center; gap: 6px; color: #334155; font-size: 0.74rem; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                <i class="fas fa-map-marker-alt" style="color: #dc2626; font-size: 0.8rem; flex-shrink: 0;"></i>
                                <span style="overflow: hidden; text-overflow: ellipsis;">${venue}</span>
                            </div>
                        </div>

                        <!-- Card Action buttons -->
                        <div style="display: grid; grid-template-columns: 1.5fr 1fr 42px; gap: 8px; margin-top: 4px; padding-top: 8px; border-top: 1.5px solid #f1f5f9;">
                            <button onclick="window.TeamView.closeNextMatchesSummaryModal(); window.TeamController.openPlayerRsvpModal('${team.id}', '${jornada}');" style="
                                background: #ccff00; color: #0f172a; border: 1.5px solid #bbf400; padding: 11px 8px; border-radius: 12px;
                                font-weight: 950; font-size: 0.74rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;
                                box-shadow: 0 4px 12px rgba(187,244,0,0.35); text-transform: uppercase; transition: transform 0.15s;
                            " onmouseover="this.style.transform='scale(1.02)';" onmouseout="this.style.transform='scale(1)';">
                                <i class="fas fa-clipboard-check"></i>
                                <span>RSVP</span>
                            </button>

                            <button onclick="window.TeamView.jumpToTeamFromModal('${team.id}');" style="
                                background: #f8fafc; color: #0f172a; border: 1.5px solid #cbd5e1;
                                padding: 11px 8px; border-radius: 12px; font-weight: 900; font-size: 0.72rem; cursor: pointer;
                                display: flex; align-items: center; justify-content: center; gap: 5px; transition: all 0.15s;
                            " onmouseover="this.style.background='#e2e8f0';" onmouseout="this.style.background='#f8fafc';">
                                <i class="fas fa-shield-alt" style="color: #64748b;"></i>
                                <span>Equipo</span>
                            </button>

                            <button onclick="window.TeamView.shareSingleMatchWhatsApp('${team.id}', '${jornada}');" title="Compartir este partido por WhatsApp" style="
                                background: #25D366; color: white; border: none; border-radius: 12px;
                                font-size: 1.05rem; cursor: pointer; display: flex; align-items: center; justify-content: center;
                                transition: transform 0.15s; box-shadow: 0 2px 8px rgba(37,211,102,0.25);
                            " onmouseover="this.style.transform='scale(1.08)';" onmouseout="this.style.transform='scale(1)';">
                                <i class="fab fa-whatsapp"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');

            const restingHTML = restingTeams.length > 0 ? `
                <div style="background: #f8fafc; border: 1.5px dashed #cbd5e1; border-radius: 16px; padding: 12px 16px; margin-top: 14px; display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap;">
                    <div style="display: flex; align-items: center; gap: 8px; font-size: 0.74rem; color: #475569; font-weight: 750;">
                        <i class="fas fa-bed" style="color: #64748b;"></i>
                        <span>Equipos con descanso esta jornada:</span>
                        <strong style="color: #0f172a;">${restingTeams.map(t => t.teamShortName).join(', ')}</strong>
                    </div>
                </div>
            ` : '';

            // Create overlay
            const overlay = document.createElement('div');
            overlay.id = 'next-matches-summary-overlay';
            overlay.style.cssText = `
                position: fixed; inset: 0; background: rgba(15, 23, 42, 0.65); z-index: 120000;
                display: flex; align-items: center; justify-content: center;
                font-family: 'Outfit', sans-serif; backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px); opacity: 0; transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                padding: 12px; box-sizing: border-box; overflow-y: auto;
            `;

            overlay.innerHTML = `
                <style>
                    #summary-modal-container {
                        background: #ffffff;
                        border: 2px solid #e2e8f0;
                        border-radius: 28px;
                        width: 100%;
                        max-width: 900px;
                        display: flex;
                        flex-direction: column;
                        padding: 24px;
                        box-sizing: border-box;
                        position: relative;
                        box-shadow: 0 25px 60px rgba(15, 23, 42, 0.25);
                        transform: scale(0.92);
                        transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                        max-height: 92vh;
                        overflow-y: auto;
                        color: #0f172a;
                    }
                    .summary-match-card:hover {
                        border-color: #cbd5e1 !important;
                        box-shadow: 0 10px 28px rgba(15, 23, 42, 0.12) !important;
                        transform: translateY(-2px);
                    }
                    @media (max-width: 768px) {
                        #summary-modal-container {
                            padding: 16px !important;
                            border-radius: 22px !important;
                            max-height: 95vh !important;
                        }
                        #summary-matches-grid {
                            grid-template-columns: 1fr !important;
                        }
                    }
                </style>

                <div id="summary-modal-container">
                    <!-- Header -->
                    <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 16px;">
                        <div>
                            <div style="display: inline-flex; align-items: center; gap: 6px; font-size: 0.68rem; font-weight: 900; color: #15803d; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px;">
                                <span style="width: 8px; height: 8px; border-radius: 50%; background: #16a34a; box-shadow: 0 0 8px rgba(22,163,74,0.5); display: inline-block;"></span>
                                <span>MATCHDAY CENTER • SOMOSPÁDEL BCN</span>
                            </div>
                            <h2 style="color: #0f172a; font-weight: 950; font-size: 1.5rem; margin: 0; letter-spacing: -0.6px; line-height: 1.15;">
                                Cartelera de la <span style="color: #16a34a;">Próxima Jornada</span>
                            </h2>
                            <div style="font-size: 0.75rem; color: #475569; font-weight: 800; margin-top: 5px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                                <span><strong style="color: #0f172a;">${activeMatches.length}</strong> Partidos</span>
                                <span>•</span>
                                <span style="color: #15803d;"><strong style="color: #15803d;">${homeMatches.length}</strong> en Casa</span>
                                <span>•</span>
                                <span style="color: #0369a1;"><strong style="color: #0369a1;">${awayMatches.length}</strong> a Domicilio</span>
                            </div>
                        </div>

                        <!-- Close button -->
                        <button onclick="window.TeamView.closeNextMatchesSummaryModal()" style="
                            background: #f1f5f9; border: 1.5px solid #cbd5e1; color: #0f172a;
                            width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
                            cursor: pointer; transition: all 0.2s; font-size: 1.05rem; flex-shrink: 0;
                        " onmouseover="this.style.background='#fee2e2'; this.style.color='#dc2626'; this.style.borderColor='#fca5a5';" onmouseout="this.style.background='#f1f5f9'; this.style.color='#0f172a'; this.style.borderColor='#cbd5e1';">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>

                    <!-- Segmented tab selector -->
                    <div style="display: flex; gap: 6px; background: #f1f5f9; padding: 5px; border-radius: 16px; border: 1.5px solid #e2e8f0; margin-bottom: 16px;">
                        <button id="summary-nav-btn-matches" onclick="window.TeamView.switchSummaryTab('matches')" style="
                            flex: 1; padding: 10px 8px; border-radius: 12px; border: none; font-weight: 950; font-size: 0.74rem; cursor: pointer;
                            display: flex; align-items: center; justify-content: center; gap: 6px; background: #0f172a; color: #ccff00; box-shadow: 0 4px 12px rgba(15,23,42,0.18); transition: all 0.2s;
                        ">
                            <i class="fas fa-table-tennis"></i>
                            <span>PARTIDOS (${activeMatches.length})</span>
                        </button>
                        <button id="summary-nav-btn-flyer" onclick="window.TeamView.switchSummaryTab('flyer')" style="
                            flex: 1; padding: 10px 8px; border-radius: 12px; border: none; font-weight: 900; font-size: 0.74rem; cursor: pointer;
                            display: flex; align-items: center; justify-content: center; gap: 6px; background: transparent; color: #475569; transition: all 0.2s;
                        ">
                            <i class="fas fa-image"></i>
                            <span>CARTEL HD</span>
                        </button>
                        <button id="summary-nav-btn-whatsapp" onclick="window.TeamView.switchSummaryTab('whatsapp')" style="
                            flex: 1; padding: 10px 8px; border-radius: 12px; border: none; font-weight: 900; font-size: 0.74rem; cursor: pointer;
                            display: flex; align-items: center; justify-content: center; gap: 6px; background: transparent; color: #475569; transition: all 0.2s;
                        ">
                            <i class="fab fa-whatsapp"></i>
                            <span>WHATSAPP</span>
                        </button>
                    </div>

                    <!-- ──────────────────────────────────────────────────────────── -->
                    <!-- TAB 1: PARTIDOS (CARDS INTERACTIVAS - MODO CLARO)             -->
                    <!-- ──────────────────────────────────────────────────────────── -->
                    <div id="summary-panel-matches" style="display: block;">
                        <!-- Filter Bar -->
                        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 14px; flex-wrap: wrap;">
                            <div style="display: flex; gap: 6px;">
                                <button id="summary-filter-all" onclick="window.TeamView.filterSummaryMatches('all')" style="
                                    padding: 7px 14px; border-radius: 10px; border: 1.5px solid #0f172a; background: #0f172a;
                                    color: #ffffff; font-weight: 950; font-size: 0.7rem; cursor: pointer; transition: all 0.2s;
                                ">
                                    Todos (${activeMatches.length})
                                </button>
                                <button id="summary-filter-home" onclick="window.TeamView.filterSummaryMatches('home')" style="
                                    padding: 7px 14px; border-radius: 10px; border: 1.5px solid #cbd5e1; background: #ffffff;
                                    color: #334155; font-weight: 900; font-size: 0.7rem; cursor: pointer; transition: all 0.2s;
                                ">
                                    🏠 Casa (${homeMatches.length})
                                </button>
                                <button id="summary-filter-away" onclick="window.TeamView.filterSummaryMatches('away')" style="
                                    padding: 7px 14px; border-radius: 10px; border: 1.5px solid #cbd5e1; background: #ffffff;
                                    color: #334155; font-weight: 900; font-size: 0.7rem; cursor: pointer; transition: all 0.2s;
                                ">
                                    ✈️ Fuera (${awayMatches.length})
                                </button>
                            </div>

                            <button onclick="window.open('https://api.whatsapp.com/send?text=' + encodeURIComponent(window.TeamView.getSummaryWhatsAppText(window.TeamView.lastTeams || [])), '_blank')" style="
                                background: #25D366; color: white; border: none; padding: 8px 14px; border-radius: 10px;
                                font-size: 0.72rem; font-weight: 950; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 12px rgba(37,211,102,0.25);
                            ">
                                <i class="fab fa-whatsapp"></i> Compartir Todo
                            </button>
                        </div>

                        <!-- Matches Grid -->
                        <div id="summary-matches-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 14px;">
                            ${matchCardsHTML}
                        </div>
                        ${restingHTML}
                    </div>

                    <!-- ──────────────────────────────────────────────────────────── -->
                    <!-- TAB 2: CARTEL OFICIAL HD                                     -->
                    <!-- ──────────────────────────────────────────────────────────── -->
                    <div id="summary-panel-flyer" style="display: none;">
                        <!-- Actions bar -->
                        <div style="display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap;">
                            <button id="summary-dl-btn" onclick="window.TeamView.downloadSummaryImage('summary-dl-btn')" style="
                                flex: 1.5; min-width: 220px; background: #0f172a; color: #ffffff; border: none; padding: 14px; border-radius: 14px;
                                font-weight: 950; font-size: 0.8rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
                                box-shadow: 0 4px 14px rgba(15,23,42,0.2); text-transform: uppercase; transition: all 0.15s;
                            " onmouseover="this.style.background='#1e293b'; this.style.transform='translateY(-1px)';" onmouseout="this.style.background='#0f172a'; this.style.transform='none';">
                                <i class="fas fa-download" style="color: #38bdf8;"></i>
                                <span>DESCARGAR FOTO EN ALTA DEFINICIÓN (PNG)</span>
                            </button>

                            <button id="summary-copy-img-btn" onclick="window.TeamView.copySummaryImageToClipboard('summary-copy-img-btn')" style="
                                flex: 1; min-width: 160px; background: #ffffff; color: #0f172a; border: 1.5px solid #cbd5e1;
                                padding: 14px; border-radius: 14px; font-weight: 900; font-size: 0.8rem; cursor: pointer;
                                display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s;
                            " onmouseover="this.style.background='#f1f5f9';" onmouseout="this.style.background='#ffffff';">
                                <i class="far fa-clipboard" style="color: #0f172a;"></i>
                                <span>COPIAR IMAGEN</span>
                            </button>
                        </div>

                        <!-- Preview Column -->
                        <div id="summary-preview-column" style="
                            display: flex; flex-direction: column; align-items: center; justify-content: center;
                            background: #f1f5f9; border: 1.5px dashed #cbd5e1; border-radius: 20px;
                            padding: 24px 12px; position: relative; overflow: hidden; min-height: 480px; box-shadow: inset 0 2px 10px rgba(0,0,0,0.03);
                        ">
                            <!-- Container Sizer con posición relativa fija para albergar el lienzo escalado -->
                            <div id="summary-preview-sizer" style="position: relative; width: 270px; height: 480px; overflow: visible; margin: 0 auto; transition: width 0.2s ease, height 0.2s ease;">
                                <div id="summary-preview-scale-wrapper" style="position: absolute; top: 0; left: 0; transform-origin: 0 0; width: 1080px; height: 1920px; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 50px rgba(15,23,42,0.18); background: #ffffff;">
                                    <div id="summary-preview-content" style="width: 1080px; height: 1920px;"></div>
                                </div>
                            </div>
                            <div id="summary-helper-text" style="position: absolute; bottom: 12px; background: rgba(15,23,42,0.85); border: 1px solid rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 30px; font-size: 0.65rem; color: #ffffff; font-weight: 800; pointer-events: none; display: flex; align-items: center; gap: 6px; z-index: 10;">
                                <i class="fas fa-info-circle" style="color: #38bdf8;"></i> FORMATO OFICIAL STORY / CARTEL (9:16)
                            </div>
                        </div>
                    </div>

                    <!-- ──────────────────────────────────────────────────────────── -->
                    <!-- TAB 3: WHATSAPP INTELIGENTE                                   -->
                    <!-- ──────────────────────────────────────────────────────────── -->
                    <div id="summary-panel-whatsapp" style="display: none;">
                        <div style="max-width: 620px; margin: 0 auto; display: flex; flex-direction: column; gap: 14px;">
                            <!-- Header simulation -->
                            <div style="background: #075e54; color: white; border-radius: 18px 18px 0 0; padding: 14px 18px; display: flex; align-items: center; justify-content: space-between;">
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <div style="width: 34px; height: 34px; border-radius: 50%; background: #000; border: 1px solid #ccff00; display: flex; align-items: center; justify-content: center;">
                                        <img src="img/official_ball_logo.png" style="width: 24px; height: 24px; object-fit: contain;">
                                    </div>
                                    <div>
                                        <div style="font-weight: 900; font-size: 0.85rem;">SomosPádel BCN • Cartelera</div>
                                        <div style="font-size: 0.65rem; color: #a7f3d0;">Lliga Guinotprunera Oficial</div>
                                    </div>
                                </div>
                                <i class="fab fa-whatsapp" style="font-size: 1.5rem; color: #25D366;"></i>
                            </div>

                            <!-- WhatsApp Message Preview (Light mode authentic bubble) -->
                            <div style="background: #efeae2; border-radius: 0 0 18px 18px; padding: 16px; border: 1.5px solid #e2e8f0; border-top: none; max-height: 320px; overflow-y: auto;">
                                <div style="background: #d9fdd3; color: #111b21; border-radius: 12px 12px 12px 2px; padding: 14px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 0.8rem; line-height: 1.55; white-space: pre-wrap; word-break: break-word; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #c1ecc0;">${whatsAppText}</div>
                            </div>

                            <!-- Actions -->
                            <button onclick="window.open('https://api.whatsapp.com/send?text=' + encodeURIComponent(window.TeamView.getSummaryWhatsAppText(window.TeamView.lastTeams || [])), '_blank')" style="
                                background: #25D366; color: white; border: none; padding: 16px; border-radius: 16px;
                                font-weight: 950; font-size: 0.92rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;
                                box-shadow: 0 8px 24px rgba(37,211,102,0.3); text-transform: uppercase; transition: transform 0.15s;
                            " onmouseover="this.style.transform='scale(1.02)';" onmouseout="this.style.transform='scale(1)';">
                                <i class="fab fa-whatsapp" style="font-size: 1.3rem;"></i>
                                <span>ABRIR EN WHATSAPP Y ENVIAR MENSAJE</span>
                            </button>

                            <button id="summary-copy-txt-btn" onclick="window.TeamView.copySummaryToClipboard()" style="
                                background: #ffffff; color: #0f172a; border: 1.5px solid #cbd5e1;
                                padding: 12px; border-radius: 14px; font-weight: 900; font-size: 0.78rem; cursor: pointer;
                                display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s;
                            " onmouseover="this.style.background='#f1f5f9';" onmouseout="this.style.background='#ffffff';">
                                <i class="far fa-copy"></i>
                                <span>COPIAR TEXTO FORMATEADO</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            // Renderizar flyer cromo en preview column
            const previewContent = document.getElementById('summary-preview-content');
            if (previewContent) {
                previewContent.innerHTML = this.getNextMatchesSummaryStoryHTML(teams, false);
            }

            // Escala responsiva
            this.adjustSummaryPreviewScale();
            this._boundAdjustSummaryScale = () => this.adjustSummaryPreviewScale();
            window.addEventListener('resize', this._boundAdjustSummaryScale);

            // Animación de entrada
            setTimeout(() => {
                overlay.style.opacity = '1';
                const container = document.getElementById('summary-modal-container');
                if (container) container.style.transform = 'scale(1)';
            }, 50);
        }

        /**
         * Alterna entre pestañas del modal de resumen (Partidos, Cartel HD, WhatsApp).
         */
        switchSummaryTab(tabName) {
            const tabs = ['matches', 'flyer', 'whatsapp'];
            tabs.forEach(t => {
                const btn = document.getElementById(`summary-nav-btn-${t}`);
                const panel = document.getElementById(`summary-panel-${t}`);
                if (btn) {
                    if (t === tabName) {
                        btn.style.background = '#0f172a';
                        btn.style.color = '#ccff00';
                        btn.style.boxShadow = '0 4px 12px rgba(15,23,42,0.18)';
                    } else {
                        btn.style.background = 'transparent';
                        btn.style.color = '#475569';
                        btn.style.boxShadow = 'none';
                    }
                }
                if (panel) {
                    panel.style.display = (t === tabName) ? 'block' : 'none';
                }
            });

            if (tabName === 'flyer') {
                const previewContent = document.getElementById('summary-preview-content');
                if (previewContent && (!previewContent.innerHTML || previewContent.innerHTML.trim() === '')) {
                    const teams = (this.lastTeams && this.lastTeams.length > 0) ? this.lastTeams : (window.ClubTeamsData || []);
                    previewContent.innerHTML = this.getNextMatchesSummaryStoryHTML(teams, false);
                }
                this.adjustSummaryPreviewScale();
                requestAnimationFrame(() => this.adjustSummaryPreviewScale());
                setTimeout(() => this.adjustSummaryPreviewScale(), 80);
            }
        }

        /**
         * Filtra los partidos de la cartelera entre Todos, En Casa y Fuera.
         */
        filterSummaryMatches(filterType) {
            const filterBtns = ['all', 'home', 'away'];
            filterBtns.forEach(f => {
                const btn = document.getElementById(`summary-filter-${f}`);
                if (btn) {
                    if (f === filterType) {
                        btn.style.background = '#0f172a';
                        btn.style.color = '#ffffff';
                        btn.style.borderColor = '#0f172a';
                    } else {
                        btn.style.background = '#ffffff';
                        btn.style.color = '#334155';
                        btn.style.borderColor = '#cbd5e1';
                    }
                }
            });

            const cards = document.querySelectorAll('.summary-match-card');
            cards.forEach(c => {
                const isHome = c.getAttribute('data-is-home') === 'true';
                if (filterType === 'all') {
                    c.style.display = 'flex';
                } else if (filterType === 'home') {
                    c.style.display = isHome ? 'flex' : 'none';
                } else if (filterType === 'away') {
                    c.style.display = !isHome ? 'flex' : 'none';
                }
            });
        }


        /**
         * Salta directamente a la ficha del equipo en el listado principal y cierra el modal.
         */
        jumpToTeamFromModal(teamId) {
            this.closeNextMatchesSummaryModal();
            setTimeout(() => {
                const el = document.getElementById(`team-${teamId}`);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    el.style.transition = 'box-shadow 0.3s, transform 0.3s';
                    el.style.boxShadow = '0 0 0 4px #ccff00, 0 12px 30px rgba(204,255,0,0.35)';
                    el.style.transform = 'scale(1.02)';
                    setTimeout(() => {
                        el.style.boxShadow = '';
                        el.style.transform = '';
                    }, 2200);
                }
            }, 360);
        }

        /**
         * Comparte un partido individual por WhatsApp para el grupo del equipo.
         */
        shareSingleMatchWhatsApp(teamId, jNum) {
            const team = (this.lastTeams || []).find(t => t.id === teamId);
            if (!team) return;
            const match = (team.schedule || []).find(m => String(m.j) === String(jNum)) || {};
            const teamShortName = team.name.replace('SOMOS PÁDEL BCN ', '').replace('SOMOS PÁDEL ', '').toUpperCase();
            const isHome = !!match.isHome;
            const homeAwayText = isHome ? '🏠 JUGAMOS EN CASA' : '✈️ JUGAMOS COMO VISITANTE';

            let text = `🎾 *PARTIDAZO SOMOS PÁDEL BCN* 🎾\n\n`;
            text += `🛡️ *${teamShortName}* (Jornada ${match.j || jNum})\n`;
            text += `⚔️ *vs ${match.opponent || 'Rival'}*\n`;
            text += `📅 *Fecha:* ${match.date || 'Por definir'}${match.time ? ' • ⏰ ' + match.time : ''}\n`;
            text += `📍 *Club:* ${match.venue || 'Club por confirmar'}\n`;
            text += `${homeAwayText}\n\n`;
            text += `¡A darlo todo en la pista! 💪🔥\n`;
            text += `📲 App Oficial: https://somospadelbarcelona.github.io/Americanas-somospadel/#teams`;

            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
        }


        /**
         * Asegura la carga asíncrona de html2canvas con soporte y fallback.
         */
        async ensureHtml2Canvas() {
            if (typeof window.html2canvas === 'function') {
                return window.html2canvas;
            }
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
                script.onload = () => resolve(window.html2canvas);
                script.onerror = () => {
                    const fallback = document.createElement('script');
                    fallback.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
                    fallback.onload = () => resolve(window.html2canvas);
                    fallback.onerror = () => reject(new Error('No se pudo cargar la librería html2canvas'));
                    document.head.appendChild(fallback);
                };
                document.head.appendChild(script);
            });
        }

        adjustSummaryPreviewScale() {
            const previewColumn = document.getElementById('summary-preview-column');
            const scaleWrapper = document.getElementById('summary-preview-scale-wrapper');
            const sizer = document.getElementById('summary-preview-sizer');
            if (!previewColumn || !scaleWrapper || !sizer) return;

            const padding = 24;
            const containerWidth = previewColumn.clientWidth - padding;
            if (containerWidth <= 0) return;

            const isMobile = window.innerWidth <= 768;
            const maxAvailableHeight = isMobile 
                ? Math.min(window.innerHeight * 0.48, 440) 
                : Math.min(window.innerHeight * 0.68, 640);

            const cardWidth = 1080;
            const cardHeight = 1920;

            const scaleX = containerWidth / cardWidth;
            const scaleY = maxAvailableHeight / cardHeight;
            const finalScale = Math.min(scaleX, scaleY);

            scaleWrapper.style.transform = `scale(${finalScale})`;
            sizer.style.width = `${Math.round(cardWidth * finalScale)}px`;
            sizer.style.height = `${Math.round(cardHeight * finalScale)}px`;
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
            const teams = (this.lastTeams && this.lastTeams.length > 0) ? this.lastTeams : (window.ClubTeamsData || []);
            const text = this.getSummaryWhatsAppText(teams);

            if (btn) {
                btn.disabled = true;
                btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> COPIANDO...`;
            }

            try {
                await navigator.clipboard.writeText(text);
                if (btn) {
                    btn.innerHTML = `<i class="fas fa-check"></i> ¡TEXTO COPIADO!`;
                    btn.style.borderColor = '#15803d';
                    btn.style.color = '#15803d';
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

            const teams = (this.lastTeams && this.lastTeams.length > 0) ? this.lastTeams : (window.ClubTeamsData || []);

            try {
                const h2c = await this.ensureHtml2Canvas();

                // Render a full 1080x1920 container off-screen for capture
                const container = document.createElement('div');
                container.style.cssText = "position: fixed; top: -9999px; left: -9999px; width: 1080px; height: 1920px; overflow: hidden; z-index: -9999;";
                container.innerHTML = this.getNextMatchesSummaryStoryHTML(teams, true);
                document.body.appendChild(container);

                // Esperar a que carguen imágenes
                const imgs = Array.from(container.querySelectorAll('img'));
                await Promise.all(imgs.map(img => {
                    if (img.complete) return Promise.resolve();
                    return new Promise(r => { img.onload = r; img.onerror = r; });
                }));
                await new Promise(resolve => setTimeout(resolve, 300));

                const canvas = await h2c(container, {
                    scale: 2,
                    useCORS: true,
                    allowTaint: false,
                    backgroundColor: '#ffffff',
                    logging: false
                });

                document.body.removeChild(container);

                const dataUrl = canvas.toDataURL('image/png', 1.0);
                const link = document.createElement('a');
                link.download = `SomosPadel_ProximaJornada_${new Date().toISOString().slice(0,10)}.png`;
                link.href = dataUrl;
                link.click();

                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = `<i class="fas fa-check"></i> ¡FOTO GUARDADA!`;
                    btn.style.background = '#15803d';
                    btn.style.color = '#ffffff';
                    setTimeout(() => {
                        btn.style.background = '#0f172a';
                        btn.style.color = '#ffffff';
                        btn.innerHTML = `<i class="fas fa-download" style="color: #38bdf8;"></i> <span>DESCARGAR FOTO EN ALTA DEFINICIÓN (PNG)</span>`;
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

            const teams = (this.lastTeams && this.lastTeams.length > 0) ? this.lastTeams : (window.ClubTeamsData || []);

            try {
                const h2c = await this.ensureHtml2Canvas();

                const container = document.createElement('div');
                container.style.cssText = "position: fixed; top: -9999px; left: -9999px; width: 1080px; height: 1920px; overflow: hidden; z-index: -9999;";
                container.innerHTML = this.getNextMatchesSummaryStoryHTML(teams, true);
                document.body.appendChild(container);

                const imgs = Array.from(container.querySelectorAll('img'));
                await Promise.all(imgs.map(img => {
                    if (img.complete) return Promise.resolve();
                    return new Promise(r => { img.onload = r; img.onerror = r; });
                }));
                await new Promise(resolve => setTimeout(resolve, 300));

                const canvas = await h2c(container, {
                    scale: 1.5,
                    useCORS: true,
                    allowTaint: false,
                    backgroundColor: '#ffffff',
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
                            btn.disabled = false;
                            btn.innerHTML = `<i class="fas fa-check"></i> ¡IMAGEN COPIADA!`;
                            btn.style.borderColor = '#15803d';
                            btn.style.color = '#15803d';
                            setTimeout(() => {
                                btn.style.borderColor = '#cbd5e1';
                                btn.style.color = '#0f172a';
                                btn.innerHTML = `<i class="far fa-clipboard" style="color: #0f172a;"></i> <span>COPIAR IMAGEN</span>`;
                            }, 2500);
                        }
                    } catch (clipErr) {
                        console.warn("Clipboard API blocked, fallback to direct download:", clipErr);
                        const dataUrl = canvas.toDataURL('image/png', 1.0);
                        const link = document.createElement('a');
                        link.download = `SomosPadel_ProximaJornada_${new Date().toISOString().slice(0,10)}.png`;
                        link.href = dataUrl;
                        link.click();
                        if (btn) {
                            btn.disabled = false;
                            btn.innerHTML = `<i class="fas fa-download"></i> ¡DESCARGADA!`;
                            setTimeout(() => {
                                btn.innerHTML = `<i class="far fa-clipboard"></i> <span>COPIAR IMAGEN</span>`;
                            }, 2500);
                        }
                    }
                }, 'image/png');
            } catch (err) {
                console.error("Error copying summary image:", err);
                alert("Error al procesar la imagen. Por favor, reintenta.");
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = `<i class="fas fa-exclamation-triangle"></i> REINTENTAR`;
                }
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
                                <button onclick="window.TeamView.changeScheduleFilter('${teamId}', '${filterVal}')" style="padding: 8px 12px; border-radius: 10px; border: 1px solid ${isActive ? '#CCFF00' : 'rgba(255,255,255,0.1)'}; font-weight: 900; font-size: 0.65rem; cursor: pointer; transition: all 0.2s; text-transform: uppercase; background: ${isActive ? '#CCFF00' : 'transparent'}; color: ${isActive ? '#000' : '#cbd5e1'}; flex-shrink: 0; min-width: 60px;">
                                    ${start}-${end}
                                </button>
                            `;
                        }
                        buttonsArea.innerHTML = buttonsHTML;
                    }
                } else {
                    rangeContainer.style.display = 'none';
                }
            }

            // Render share template
            const cardContent = document.getElementById('preview-card-content');
            if (cardContent) {
                cardContent.innerHTML = this.getShareTemplateHTML(team, tabName, false);
            }
        }

        changeScheduleFilter(teamId, filterVal) {
            this.shareScheduleFilter = filterVal;
            this.renderSharePreview(teamId, 'sched');
        }

        getShareTemplateHTML(team, tabName, isForCapture = false) {
            const defaultLogo = 'img/official_ball_logo.png';
            let logoSrc = team.logo || defaultLogo;
            if (!logoSrc || logoSrc.includes('logo_somospadel') || logoSrc.includes('logo.png') || !logoSrc.startsWith('http')) {
                logoSrc = defaultLogo;
            }
            const isExternal = logoSrc.startsWith('http');
            const logoAttr = isExternal ? 'crossorigin="anonymous"' : '';

            const dateStr = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
            const standings = team.groupStandings || [];
            const schedule = team.schedule || [];
            const roster = team.roster || [];
            
            // Captain sanitization
            const cleanCap = window.getTeamCaptain ? window.getTeamCaptain(team) : (team.captain || 'Capitán por definir');
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

            // Return corresponding premium template HTML (White/Light Violet UI Match Theme)
            if (tabName === 'class') {
                return `
                    <div class="insta-story-card" style="${scaleStyle} width: 1080px; height: 1920px; background: linear-gradient(135deg, #ffffff 0%, #f6f8fd 60%, #eaeefc 100%); font-family: 'Outfit', sans-serif; position: relative; color: #0f172a; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: space-between; padding: 70px 70px; box-sizing: border-box;">
                        <!-- Glowing Circles for Visual Polish -->
                        <div style="position: absolute; top: -100px; left: -100px; width: 650px; height: 650px; background: rgba(56,176,0,0.06); filter: blur(150px); border-radius: 50%;"></div>
                        <div style="position: absolute; bottom: -100px; right: -100px; width: 650px; height: 650px; background: rgba(139,92,246,0.06); filter: blur(150px); border-radius: 50%;"></div>
                        <div style="position: absolute; inset: 0; background-image: repeating-linear-gradient(45deg, rgba(15,23,42,0.005) 0, rgba(15,23,42,0.005) 1px, transparent 0, transparent 50%); background-size: 25px 25px; opacity: 0.3;"></div>

                        <!-- Header -->
                        <div style="text-align: center; z-index: 10; width: 100%;">
                            <img src="${logoSrc}" ${logoAttr} style="width: 140px; height: 140px; object-fit: contain; margin-bottom: 25px; filter: drop-shadow(0 8px 20px rgba(15,23,42,0.08));">
                            <div style="font-size: 1.3rem; font-weight: 900; color: #38b000; letter-spacing: 6px; text-transform: uppercase;">LLIGA GUINOTPRUNERA</div>
                            <h1 style="font-size: 3.5rem; font-weight: 950; margin: 10px 0; color: #0f172a; text-transform: uppercase; letter-spacing: -1.5px; line-height: 1.05;">
                                CLASIFICACIÓN<br><span style="color: #38b000;">GRUPO ${team.group.split(' ').pop().toUpperCase()}</span>
                            </h1>
                        </div>

                        <!-- Main stand card -->
                        <div style="width: 100%; background: #ffffff; border: 1.5px solid #edf2f7; border-radius: 35px; padding: 25px 30px; box-sizing: border-box; z-index: 10; box-shadow: 0 20px 45px rgba(15,23,42,0.04);">
                            <table style="width: 100%; border-collapse: separate; border-spacing: 0 12px;">
                                <thead>
                                    <tr style="color: #64748b; font-size: 1.05rem; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; text-align: center;">
                                        <th style="padding: 10px; text-align: left;">POS & EQUIPO</th>
                                        <th style="padding: 10px;">PTS</th>
                                        <th style="padding: 10px;">PJ</th>
                                        <th style="padding: 10px;">PG</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${standings.slice(0, 8).map((s, idx) => {
                                        const isSp = s.isCurrent;
                                        const rowBg = isSp ? 'linear-gradient(90deg, rgba(56,176,0,0.08) 0%, rgba(56,176,0,0.02) 100%)' : '#ffffff';
                                        const rowBorder = isSp ? '2px solid #38b000' : '1px solid #edf2f7';
                                        return `
                                            <tr style="background: ${rowBg}; border-radius: 14px;">
                                                <td style="padding: 12px 20px; font-weight: 900; font-size: 1.5rem; border-top-left-radius: 14px; border-bottom-left-radius: 14px; border: ${rowBorder}; border-right: none; display: flex; align-items: center; gap: 15px; color: ${isSp ? '#38b000' : '#0f172a'};">
                                                    <span style="font-size: 1.8rem; font-weight: 950; color: ${idx === 0 ? '#eab308' : (idx === 1 ? '#94a3b8' : (idx === 2 ? '#CD7F32' : 'rgba(15,23,42,0.2)'))};">#${s.pos}</span>
                                                    <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 440px; ${isSp ? 'text-decoration: underline; text-underline-offset: 6px; font-weight: 950;' : ''}">
                                                        ${s.team.toUpperCase()} ${isSp ? '👑' : ''}
                                                    </span>
                                                </td>
                                                <td style="padding: 12px 10px; font-size: 1.7rem; font-weight: 950; text-align: center; color: ${isSp ? '#38b000' : '#0f172a'}; border-top: ${rowBorder}; border-bottom: ${rowBorder};">${s.pts}</td>
                                                <td style="padding: 12px 10px; font-size: 1.5rem; font-weight: 800; text-align: center; color: #64748b; border-top: ${rowBorder}; border-bottom: ${rowBorder};">${s.pj}</td>
                                                <td style="padding: 12px 20px; font-size: 1.5rem; font-weight: 900; text-align: center; color: #38b000; border-top-right-radius: 14px; border-bottom-right-radius: 14px; border: ${rowBorder}; border-left: none;">${s.pg}</td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>

                        <!-- Footer -->
                        <div style="text-align: center; z-index: 10; width: 100%;">
                            <div style="font-size: 1.7rem; font-weight: 900; letter-spacing: 5px; color: #0f172a;">SOMOS PÁDEL BCN</div>
                            <div style="font-size: 1.1rem; color: #64748b; margin-top: 10px; text-transform: uppercase; letter-spacing: 2px;">APP OFICIAL • ${dateStr}</div>
                            <div style="margin-top: 30px; display: inline-flex; align-items: center; gap: 15px; background: #38b000; color: white; padding: 14px 35px; border-radius: 50px; font-weight: 900; font-size: 1.25rem; box-shadow: 0 8px 20px rgba(56,176,0,0.15);">
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
                    <div class="insta-story-card" style="${scaleStyle} width: 1080px; height: 1920px; background: linear-gradient(135deg, #ffffff 0%, #f4f6fc 60%, #eaeefc 100%); font-family: 'Outfit', sans-serif; position: relative; color: #0f172a; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: space-between; padding: 110px 70px; box-sizing: border-box;">
                        <!-- Glows -->
                        <div style="position: absolute; top: -100px; left: -100px; width: 650px; height: 650px; background: rgba(56,176,0,0.05); filter: blur(150px); border-radius: 50%;"></div>
                        <div style="position: absolute; bottom: -100px; right: -100px; width: 650px; height: 650px; background: rgba(139,92,246,0.06); filter: blur(150px); border-radius: 50%;"></div>
                        <div style="position: absolute; inset: 0; background-image: repeating-linear-gradient(45deg, rgba(15,23,42,0.005) 0, rgba(15,23,42,0.005) 1px, transparent 0, transparent 50%); background-size: 25px 25px; opacity: 0.3;"></div>

                        <!-- Header -->
                        <div style="text-align: center; z-index: 10; width: 100%;">
                            <img src="${logoSrc}" ${logoAttr} style="width: 140px; height: 140px; object-fit: contain; margin-bottom: 25px; filter: drop-shadow(0 8px 20px rgba(15,23,42,0.08));">
                            <div style="font-size: 1.3rem; font-weight: 900; color: #38b000; letter-spacing: 6px; text-transform: uppercase;">CALENDARIO & RESULTADOS ${filter === 'smart' ? '• ACTUALIDAD' : `• J${filter}`}</div>
                            <h1 style="font-size: 3.2rem; font-weight: 950; margin: 10px 0; color: #0f172a; text-transform: uppercase; letter-spacing: -1px; line-height: 1.05; max-width: 900px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: inline-block;">
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

                                const cardBg = isLive ? 'rgba(56,176,0,0.06)' : '#ffffff';
                                const cardBorder = isLive ? '2px solid #38b000' : '1.5px solid #edf2f7';
                                const labelBg = isLive ? '#38b000' : (!isCompleted ? '#f1f5f9' : (isWin ? 'rgba(56,176,0,0.1)' : 'rgba(239,68,68,0.08)'));
                                const labelColor = isLive ? 'white' : (!isCompleted ? '#64748b' : (isWin ? '#38b000' : '#ef4444'));
                                const statusText = isLive ? 'EN JUEGO' : (isCompleted ? m.score : 'PENDIENTE');

                                return `
                                    <div style="background: ${cardBg}; border: ${cardBorder}; border-radius: 26px; padding: ${cardPadding}; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 10px 30px rgba(15,23,42,0.03);">
                                        <div style="display: flex; flex-direction: column; gap: ${cardGap}; min-width: 0; flex: 1;">
                                            <span style="font-size: ${jnSize}; color: #38b000; font-weight: 900; letter-spacing: 2px; text-transform: uppercase;">JORNADA ${m.j}</span>
                                            <span style="font-size: ${opSize}; font-weight: 900; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-right: 15px;">
                                                vs ${m.opponent.toUpperCase()}
                                            </span>
                                            <div style="display: flex; align-items: center; gap: 10px; font-size: ${infoSize}; color: #64748b; font-weight: 700;">
                                                <i class="far fa-calendar-alt" style="color: #38b000;"></i>
                                                <span>${m.date} • ${m.venue.toUpperCase()}</span>
                                            </div>
                                        </div>
                                        <div style="font-size: ${resSize}; font-weight: 950; background: ${labelBg}; color: ${labelColor}; padding: ${resPadding}; border-radius: 18px; border: 1px solid #edf2f7; min-width: ${resMinWidth}; text-align: center; letter-spacing: 0.5px; flex-shrink: 0;">
                                            ${statusText}
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>

                        <!-- Footer -->
                        <div style="text-align: center; z-index: 10; width: 100%;">
                            <div style="font-size: 1.7rem; font-weight: 900; letter-spacing: 5px; color: #0f172a;">SOMOS PÁDEL BCN</div>
                            <div style="font-size: 1.1rem; color: #64748b; margin-top: 10px; text-transform: uppercase; letter-spacing: 2px;">APP OFICIAL • LIGA DE PÁDEL</div>
                            <div style="margin-top: 30px; display: inline-flex; align-items: center; gap: 15px; background: #38b000; color: white; padding: 14px 35px; border-radius: 50px; font-weight: 900; font-size: 1.25rem; box-shadow: 0 8px 20px rgba(56,176,0,0.15);">
                                <i class="fab fa-instagram" style="font-size: 1.5rem;"></i> @somospadelbarcelona_
                            </div>
                        </div>
                    </div>
                `;
            }

            if (tabName === 'rost') {
                return `
                    <div class="insta-story-card" style="${scaleStyle} width: 1080px; height: 1920px; background: linear-gradient(135deg, #ffffff 0%, #f4f6fc 60%, #eaeefc 100%); font-family: 'Outfit', sans-serif; position: relative; color: #0f172a; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: space-between; padding: 110px 70px; box-sizing: border-box;">
                        <!-- Glows -->
                        <div style="position: absolute; top: -100px; left: -100px; width: 650px; height: 650px; background: rgba(56,176,0,0.05); filter: blur(150px); border-radius: 50%;"></div>
                        <div style="position: absolute; bottom: -100px; right: -100px; width: 650px; height: 650px; background: rgba(139,92,246,0.06); filter: blur(150px); border-radius: 50%;"></div>
                        <div style="position: absolute; inset: 0; background-image: repeating-linear-gradient(45deg, rgba(15,23,42,0.005) 0, rgba(15,23,42,0.005) 1px, transparent 0, transparent 50%); background-size: 25px 25px; opacity: 0.3;"></div>

                        <!-- Header -->
                        <div style="text-align: center; z-index: 10; width: 100%;">
                            <img src="${logoSrc}" ${logoAttr} style="width: 140px; height: 140px; object-fit: contain; margin-bottom: 25px; filter: drop-shadow(0 8px 20px rgba(15,23,42,0.08));">
                            <div style="font-size: 1.3rem; font-weight: 900; color: #38b000; letter-spacing: 6px; text-transform: uppercase;">PLANTILLA OFICIAL • ROSTER</div>
                            <h1 style="font-size: 3.2rem; font-weight: 950; margin: 10px 0; color: #0f172a; text-transform: uppercase; letter-spacing: -1px; line-height: 1.05; max-width: 900px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: inline-block;">
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
                                    <div style="background: #ffffff; border: 1.5px solid #edf2f7; border-radius: 25px; padding: 18px 25px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 10px 25px rgba(15,23,42,0.03);">
                                        <div style="display: flex; align-items: center; gap: 20px; min-width: 0; flex: 1;">
                                            <!-- Avatar -->
                                            <div style="width: 70px; height: 70px; border-radius: 50%; background: ${avatarBg}; color: white; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 900; box-shadow: 0 5px 12px rgba(0,0,0,0.1); position: relative; flex-shrink: 0;">
                                                ${initial}
                                                ${isCap ? `
                                                    <div style="position: absolute; bottom: -2px; right: -2px; background: #0f172a; border: 1.5px solid #fff; color: #fff; font-size: 0.8rem; font-weight: 950; width: 25px; height: 25px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.15);" title="Capitán">C</div>
                                                ` : ''}
                                            </div>
                                            <div style="display: flex; flex-direction: column; gap: 4px; min-width: 0; flex: 1;">
                                                <span style="font-size: 1.65rem; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${player.name.toUpperCase()}</span>
                                                <div style="display: flex; gap: 8px;">
                                                    ${isCap ? `<span style="background: #f1f5f9; border: 1px solid #cbd5e1; color: #0f172a; font-size: 0.8rem; font-weight: 900; padding: 2px 10px; border-radius: 6px; letter-spacing: 0.5px;">CAPITÁN</span>` : ''}
                                                    ${isMVP ? `<span style="background: linear-gradient(135deg, #eab308 0%, #f59e0b 100%); color: white; font-size: 0.8rem; font-weight: 900; padding: 2px 10px; border-radius: 6px; box-shadow: 0 2px 6px rgba(234,179,8,0.15); display: inline-flex; align-items: center; gap: 3px;"><i class="fas fa-crown"></i> MVP</span>` : ''}
                                                </div>
                                            </div>
                                        </div>
                                        <div style="background: rgba(56, 176, 0, 0.08); border: 1px solid rgba(56, 176, 0, 0.2); color: #38b000; font-size: 1.45rem; font-weight: 950; padding: 10px 22px; border-radius: 16px; letter-spacing: 0.5px; flex-shrink: 0; margin-left: 10px;">
                                            ${player.pts} <span style="font-size: 1rem; color: #64748b;">PTS</span>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>

                        <!-- Footer -->
                        <div style="text-align: center; z-index: 10; width: 100%;">
                            <div style="font-size: 1.7rem; font-weight: 900; letter-spacing: 5px; color: #0f172a;">SOMOS PÁDEL BCN</div>
                            <div style="font-size: 1.1rem; color: #64748b; margin-top: 10px; text-transform: uppercase; letter-spacing: 2px;">APP OFICIAL • ROSTER COMPLETO</div>
                            <div style="margin-top: 30px; display: inline-flex; align-items: center; gap: 15px; background: #38b000; color: white; padding: 14px 35px; border-radius: 50px; font-weight: 900; font-size: 1.25rem; box-shadow: 0 8px 20px rgba(56,176,0,0.15);">
                                <i class="fab fa-instagram" style="font-size: 1.5rem;"></i> @somospadelbarcelona_
                            </div>
                        </div>
                    </div>
                `;
            }

            if (tabName === 'stats') {
                return `
                    <div class="insta-story-card" style="${scaleStyle} width: 1080px; height: 1920px; background: linear-gradient(135deg, #ffffff 0%, #f4f6fc 60%, #eaeefc 100%); font-family: 'Outfit', sans-serif; position: relative; color: #0f172a; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: space-between; padding: 110px 70px; box-sizing: border-box;">
                        <!-- Glows -->
                        <div style="position: absolute; top: -100px; left: -100px; width: 650px; height: 650px; background: rgba(56,176,0,0.05); filter: blur(150px); border-radius: 50%;"></div>
                        <div style="position: absolute; bottom: -100px; right: -100px; width: 650px; height: 650px; background: rgba(139,92,246,0.06); filter: blur(150px); border-radius: 50%;"></div>
                        <div style="position: absolute; inset: 0; background-image: repeating-linear-gradient(45deg, rgba(15,23,42,0.005) 0, rgba(15,23,42,0.005) 1px, transparent 0, transparent 50%); background-size: 25px 25px; opacity: 0.3;"></div>

                        <!-- Header -->
                        <div style="text-align: center; z-index: 10; width: 100%;">
                            <img src="${logoSrc}" ${logoAttr} style="width: 140px; height: 140px; object-fit: contain; margin-bottom: 25px; filter: drop-shadow(0 8px 20px rgba(15,23,42,0.08));">
                            <div style="font-size: 1.3rem; font-weight: 900; color: #38b000; letter-spacing: 6px; text-transform: uppercase;">ESTADÍSTICAS & RENDIMIENTO</div>
                            <h1 style="font-size: 3.2rem; font-weight: 950; margin: 10px 0; color: #0f172a; text-transform: uppercase; letter-spacing: -1px; line-height: 1.05; max-width: 900px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: inline-block;">
                                ${team.name.toUpperCase()}
                            </h1>
                        </div>

                        <!-- Main KPIs Content -->
                        <div style="width: 100%; display: flex; flex-direction: column; gap: 35px; z-index: 10; margin: 30px 0;">
                            
                            <!-- Win Rate big visual -->
                            <div style="background: #ffffff; border: 1.5px solid #edf2f7; border-radius: 35px; padding: 45px; text-align: center; box-shadow: 0 15px 40px rgba(15,23,42,0.04);">
                                <div style="font-size: 1.3rem; color: #64748b; font-weight: 800; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 15px;">PORCENTAJE DE VICTORIAS</div>
                                <div style="font-size: 7rem; font-weight: 950; color: #38b000; line-height: 1; margin-bottom: 25px;">${winRate}%</div>
                                
                                <!-- Progress bar -->
                                <div style="width: 100%; background: #f1f5f9; height: 20px; border-radius: 10px; overflow: hidden; border: 1px solid #edf2f7; padding: 2px; box-sizing: border-box;">
                                    <div style="width: ${winRate}%; background: linear-gradient(90deg, #38b000 0%, #70e000 100%); height: 100%; border-radius: 8px;"></div>
                                </div>
                            </div>

                            <!-- Dual columns Sub-KPIs -->
                            <div style="display: flex; gap: 24px;">
                                <!-- PJ / PG -->
                                <div style="flex: 1; background: #ffffff; border: 1.5px solid #edf2f7; border-radius: 28px; padding: 25px; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 12px 35px rgba(15,23,42,0.03);">
                                    <span style="font-size: 1rem; color: #64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px;">PARTIDOS J/G</span>
                                    <span style="font-size: 3.2rem; font-weight: 950; color: #0f172a;">${pjCount}<span style="font-size: 2rem; color: #38b000; font-weight: 900;"> / ${winCount}</span></span>
                                </div>
                                
                                <!-- Sets Diff -->
                                <div style="flex: 1; background: #ffffff; border: 1.5px solid #edf2f7; border-radius: 28px; padding: 25px; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 12px 35px rgba(15,23,42,0.03);">
                                    <span style="font-size: 1rem; color: #64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px;">DIF. SETS</span>
                                    <span style="font-size: 3.2rem; font-weight: 950; color: ${setDiff >= 0 ? '#38b000' : '#ef4444'};">${setDiff > 0 ? '+' + setDiff : setDiff}</span>
                                </div>
                            </div>

                            <!-- Streak Row -->
                            <div style="background: #ffffff; border: 1.5px solid #edf2f7; border-radius: 28px; padding: 25px 35px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 12px 35px rgba(15,23,42,0.03);">
                                <span style="font-size: 1.25rem; font-weight: 900; color: #0f172a; letter-spacing: 1px; text-transform: uppercase;">FORMA (ÚLT. 5)</span>
                                <div style="display: flex; gap: 12px;">
                                    ${streak.length > 0 ? streak.map(res => `
                                        <div style="width: 46px; height: 46px; border-radius: 50%; background: ${res === 'W' ? '#38b000' : '#ef4444'}; color: white; font-size: 1.35rem; font-weight: 950; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px ${res === 'W' ? 'rgba(56,176,0,0.15)' : 'rgba(239,68,68,0.15)'};">
                                            ${res === 'W' ? 'V' : 'D'}
                                        </div>
                                    `).join('') : '<span style="font-size: 1.2rem; color: #94a3b8; font-weight: 800;">SIN REGISTROS</span>'}
                                </div>
                            </div>
                        </div>

                        <!-- Footer -->
                        <div style="text-align: center; z-index: 10; width: 100%;">
                            <div style="font-size: 1.7rem; font-weight: 900; letter-spacing: 5px; color: #0f172a;">SOMOS PÁDEL BCN</div>
                            <div style="font-size: 1.1rem; color: #64748b; margin-top: 10px; text-transform: uppercase; letter-spacing: 2px;">APP OFICIAL • EVOLUCIÓN PREMIUM</div>
                            <div style="margin-top: 30px; display: inline-flex; align-items: center; gap: 15px; background: #38b000; color: white; padding: 14px 35px; border-radius: 50px; font-weight: 900; font-size: 1.25rem; box-shadow: 0 8px 20px rgba(56,176,0,0.15);">
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

            if (window.loadExternalScript) {
                try {
                    await window.loadExternalScript('https://html2canvas.hertzen.com/dist/html2canvas.min.js', 'html2canvas');
                } catch (err) {
                    console.error("❌ Error loading html2canvas:", err);
                    alert("Error: No se pudo iniciar el generador de imágenes. Reintente.");
                    if (btn) {
                        btn.disabled = false;
                        btn.innerHTML = `<i class="fas fa-exclamation-triangle"></i> REINTENTAR`;
                    }
                    return;
                }
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
                    scale: 3.5, // Extreme high resolution (ultra crisp)
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff', // Clean white background match
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

            if (window.loadExternalScript) {
                try {
                    await window.loadExternalScript('https://html2canvas.hertzen.com/dist/html2canvas.min.js', 'html2canvas');
                } catch (err) {
                    console.error("❌ Error loading html2canvas:", err);
                    alert("Error: No se pudo iniciar el generador de imágenes. Reintente.");
                    if (btn) {
                        btn.disabled = false;
                        btn.innerHTML = `<i class="fas fa-exclamation-triangle"></i> REINTENTAR`;
                    }
                    return;
                }
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
                    scale: 2.5, // Optimized crisp resolution for copying
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff', // Clean white background match
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

        // =========================================================================
        // 🛡️ MÓDULO EXCLUSIVO: 3. MI EQUIPO (VISTA ULTRA-PERSONALIZADA Y PROFUNDA)
        // =========================================================================

        renderMyTeam(teams) {
            if (teams && teams.length > 0) {
                this.lastTeams = teams;
            } else if (!this.lastTeams || this.lastTeams.length === 0) {
                this.lastTeams = window.ClubTeamsData || [];
            }
            const allTeams = this.lastTeams;
            this.container = document.getElementById('content-area');
            if (!this.container) return;

            // 1. Identificar usuario activo
            const currentUser = window.Store?.getState('currentUser') || (() => {
                try { return JSON.parse(localStorage.getItem('currentUser') || '{}'); } catch(e) { return {}; }
            })();
            const rawName = (currentUser.name || currentUser.displayName || currentUser.fullName || '').trim();
            const cleanName = rawName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

            // 2. Equipos guardados explícitamente en el dispositivo
            let savedTeamIds = [];
            try {
                const rawSaved = localStorage.getItem('myTeams_somospadel');
                if (rawSaved) {
                    const parsed = JSON.parse(rawSaved);
                    if (Array.isArray(parsed)) savedTeamIds = parsed;
                }
            } catch(e) {}
            const favTeamId = localStorage.getItem('favTeam_somospadel');
            if (favTeamId && !savedTeamIds.includes(favTeamId)) {
                savedTeamIds.push(favTeamId);
            }

            // 3. Buscar coincidencias en rosters o capitanías de los equipos del club
            let userTeams = [];
            allTeams.forEach(team => {
                let isMember = false;
                let rosterMatch = null;

                if (savedTeamIds.includes(team.id)) {
                    isMember = true;
                }

                if (cleanName && team.roster && Array.isArray(team.roster)) {
                    for (const player of team.roster) {
                        const pName = (typeof player === 'string' ? player : (player.name || '')).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
                        if (pName && (pName === cleanName || pName.includes(cleanName) || cleanName.includes(pName))) {
                            isMember = true;
                            rosterMatch = player;
                            break;
                        }
                    }
                }

                if (cleanName) {
                    const cap = (team.captain || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                    const sub = (team.subcaptain || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                    if (cap.includes(cleanName) || cleanName.includes(cap) || sub.includes(cleanName) || cleanName.includes(sub)) {
                        isMember = true;
                    }
                }

                if (isMember && !userTeams.some(t => t.id === team.id)) {
                    userTeams.push({
                        ...team,
                        _userRosterData: rosterMatch
                    });
                }
            });

            // Si hay más de 2 equipos detectados, limitamos a un máximo de 2 equipos (requisito de usuario)
            if (userTeams.length > 2) {
                userTeams = userTeams.slice(0, 2);
            }

            // CASO 0: No detectado en ningún equipo aún -> Selector amigable de vinculación
            if (userTeams.length === 0) {
                this.renderMyTeamOnboarding(allTeams, rawName);
                return;
            }

            // CASO 1 o 2: Mostrar única y exclusivamente su(s) equipo(s)
            if (this.activeMyTeamIndex >= userTeams.length) {
                this.activeMyTeamIndex = 0;
            }
            const activeTeam = userTeams[this.activeMyTeamIndex];

            this.renderMyTeamDetail(userTeams, activeTeam, rawName);
        }

        renderMyTeamOnboarding(allTeams, rawName) {
            this.container.innerHTML = `
                <div class="my-team-container animate-fade-in" style="padding: 24px 16px 120px; max-width: 800px; margin: 0 auto; font-family: 'Outfit', sans-serif;">
                    
                    <div style="background: linear-gradient(145deg, #0b1329 0%, #0f172a 100%); border-radius: 28px; border: 1.5px solid rgba(255, 94, 0, 0.35); padding: 32px 22px; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.5); position: relative; overflow: hidden;">
                        
                        <div style="width: 80px; height: 80px; margin: 0 auto 16px; background: rgba(255, 94, 0, 0.15); border: 2px solid #ff5e00; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 25px rgba(255, 94, 0, 0.3);">
                            <i class="fas fa-users-cog" style="font-size: 2.2rem; color: #ff5e00;"></i>
                        </div>

                        <div style="display: inline-flex; align-items: center; gap: 6px; background: rgba(255, 94, 0, 0.12); border: 1px solid rgba(255, 94, 0, 0.3); padding: 4px 12px; border-radius: 20px; margin-bottom: 12px;">
                            <span style="width: 6px; height: 6px; border-radius: 50%; background: #ff5e00;"></span>
                            <span style="font-size: 0.65rem; color: #ff8c42; font-weight: 900; letter-spacing: 1px; text-transform: uppercase;">SECCIÓN 3. MI EQUIPO</span>
                        </div>

                        <h2 style="color: #ffffff; font-weight: 950; font-size: 1.8rem; margin: 0 0 10px; letter-spacing: -0.5px;">
                            ¡Hola, ${rawName || 'Jugador/a'}! 👋
                        </h2>
                        
                        <p style="color: #94a3b8; font-size: 0.88rem; line-height: 1.6; max-width: 540px; margin: 0 auto 24px;">
                            En esta pestaña verás <strong>únicamente tu equipo</strong> (o los 2 equipos si juegas en varias categorías). Elige a continuación tu equipo oficial para vincularlo a tu perfil y profundizar en tus estadísticas, convocatorias y clasificación.
                        </p>

                        <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 20px; text-align: left; margin-bottom: 24px;">
                            
                            <!-- Selector 1: Equipo Principal -->
                            <label style="display: block; font-size: 0.75rem; font-weight: 900; color: #ff8c42; text-transform: uppercase; margin-bottom: 8px;">
                                1. Tu Equipo Principal *
                            </label>
                            <select id="select-my-team-1" style="width: 100%; background: #1e293b; color: #ffffff; border: 1.5px solid rgba(255,255,255,0.15); padding: 13px 14px; border-radius: 14px; font-weight: 800; font-size: 0.85rem; outline: none; margin-bottom: 16px;">
                                ${allTeams.map(t => `<option value="${t.id}">${t.name} (${t.category} • ${t.division || ''})</option>`).join('')}
                            </select>

                            <!-- Selector 2: Segundo Equipo Opcional -->
                            <label style="display: block; font-size: 0.75rem; font-weight: 900; color: #94a3b8; text-transform: uppercase; margin-bottom: 8px;">
                                2. Segundo Equipo (Opcional, si juegas en 2 categorías ej. Mixto)
                            </label>
                            <select id="select-my-team-2" style="width: 100%; background: #1e293b; color: #cbd5e1; border: 1px solid rgba(255,255,255,0.1); padding: 13px 14px; border-radius: 14px; font-weight: 700; font-size: 0.85rem; outline: none;">
                                <option value="none">-- Solo juego en 1 equipo --</option>
                                ${allTeams.map(t => `<option value="${t.id}">${t.name} (${t.category} • ${t.division || ''})</option>`).join('')}
                            </select>

                        </div>

                        <button onclick="window.TeamView.saveAndSetMyTeams(document.getElementById('select-my-team-1').value, document.getElementById('select-my-team-2').value)"
                                style="width: 100%; max-width: 400px; background: linear-gradient(135deg, #ff5e00 0%, #ff8c42 100%); color: #ffffff; border: none; padding: 15px 24px; border-radius: 16px; font-weight: 950; font-size: 0.95rem; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 10px; box-shadow: 0 8px 25px rgba(255, 94, 0, 0.45); transition: all 0.2s;"
                                onmouseover="this.style.transform='translateY(-2px)'"
                                onmouseout="this.style.transform='translateY(0)'">
                            <i class="fas fa-check-circle"></i> VINCULAR Y ACCEDER A MI EQUIPO
                        </button>

                    </div>

                </div>
            `;
        }

        renderMyTeamDetail(userTeams, activeTeam, rawName) {
            const cleanUserName = (rawName || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

            // Buscar ficha del jugador en el roster del equipo activo
            const roster = activeTeam.roster || [];
            const sortedRoster = [...roster].sort((a, b) => (b.pts || 0) - (a.pts || 0));
            
            let userRosterIndex = -1;
            let userRosterData = null;
            if (cleanUserName) {
                userRosterIndex = sortedRoster.findIndex(p => {
                    const pName = (typeof p === 'string' ? p : (p.name || '')).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
                    return pName && (pName === cleanUserName || pName.includes(cleanUserName) || cleanUserName.includes(pName));
                });
                if (userRosterIndex !== -1) {
                    userRosterData = sortedRoster[userRosterIndex];
                }
            }

            const userPts = userRosterData ? (userRosterData.pts || 0) : '--';
            const userRankText = userRosterIndex !== -1 ? `#${userRosterIndex + 1} del equipo` : 'Titular oficial';

            // Próximo partido
            const nextMatch = (activeTeam.schedule || []).find(m => m.status !== 'completed' && m.opponent !== 'BYE' && !m.opponent.includes('BYE')) || activeTeam.nextMatch || {};
            const isHome = nextMatch.isHome;
            const address = nextMatch.venue ? (window.TeamConvocatoriaService?.getClubAddress(nextMatch.venue) || nextMatch.venue) : 'Sede por confirmar';

            // Estado de disponibilidad del jugador para este partido
            const jNum = nextMatch.j || 1;
            const convoKey = `somospadel_convo_${activeTeam.id}_j${jNum}`;
            let convoData = null;
            try {
                convoData = JSON.parse(localStorage.getItem(convoKey) || '{}');
            } catch(e) {}
            
            const playerResponse = convoData?.responses?.[rawName] || null;
            const userStatus = playerResponse?.status || null; // 'available', 'unavailable'

            // Conteo de confirmados
            const responsesMap = convoData?.responses || {};
            const confirmedNames = Object.keys(responsesMap).filter(k => responsesMap[k]?.status === 'available');
            const confirmedCount = confirmedNames.length;
            const targetCount = 6; // 3 parejas requeridas

            // Color temático de categoría
            const catLower = (activeTeam.category || '').toLowerCase();
            const catTheme = catLower.includes('fem') ? '#ec4899' : (catLower.includes('mix') ? '#10b981' : '#38bdf8');

            this.container.innerHTML = `
                <div class="my-team-container animate-fade-in" style="padding: 20px 16px 120px; max-width: 1000px; margin: 0 auto; font-family: 'Outfit', sans-serif;">
                    
                    <!-- 🛡️ BARRA SUPERIOR: SELECTOR SI JUEGA EN 2 EQUIPOS + BOTÓN CAMBIAR -->
                    <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 16px; flex-wrap: wrap;">
                        
                        <!-- Si tiene 2 equipos: selector en pestañas exclusivas -->
                        ${userTeams.length > 1 ? `
                            <div style="display: flex; gap: 8px; background: rgba(15, 23, 42, 0.9); padding: 4px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.08); flex-grow: 1; max-width: 600px;">
                                ${userTeams.map((t, idx) => {
                                    const isActive = idx === this.activeMyTeamIndex;
                                    const bg = isActive ? 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' : 'transparent';
                                    const col = isActive ? '#ffffff' : '#94a3b8';
                                    const shadow = isActive ? 'box-shadow: 0 4px 14px rgba(14,165,233,0.4);' : '';
                                    return `
                                        <button onclick="window.TeamView.switchMyTeamActive(${idx})" 
                                                style="flex: 1; padding: 10px 12px; border: none; border-radius: 12px; font-weight: 900; font-size: 0.76rem; cursor: pointer; transition: all 0.2s; background: ${bg}; color: ${col}; ${shadow} text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                            🎾 ${t.name} (${t.category})
                                        </button>
                                    `;
                                }).join('')}
                            </div>
                        ` : `
                            <div style="display: inline-flex; align-items: center; gap: 7px; background: rgba(14, 165, 233, 0.12); border: 1px solid rgba(14, 165, 233, 0.35); padding: 6px 14px; border-radius: 20px;">
                                <span style="width: 7px; height: 7px; border-radius: 50%; background: #0ea5e9; box-shadow: 0 0 10px #0ea5e9;"></span>
                                <span style="font-size: 0.68rem; color: #38bdf8; font-weight: 900; letter-spacing: 1px; text-transform: uppercase;">TU EQUIPO OFICIAL DE LIGA</span>
                            </div>
                        `}

                        <!-- Botón para reelegir o gestionar equipo -->
                        <button onclick="window.TeamView.openChangeMyTeamsModal()" 
                                style="background: rgba(255,255,255,0.06); color: #cbd5e1; border: 1px solid rgba(255,255,255,0.12); padding: 7px 12px; border-radius: 12px; font-size: 0.72rem; font-weight: 800; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: all 0.2s;"
                                onmouseover="this.style.background='rgba(255,255,255,0.12)'"
                                onmouseout="this.style.background='rgba(255,255,255,0.06)'">
                            <i class="fas fa-sliders-h" style="color: #38bdf8;"></i> Cambiar / Añadir Equipo
                        </button>
                    </div>

                    <!-- 🏆 HERO CARD PRO EXCLUSIVO DEL EQUIPO -->
                    <div style="margin-bottom: 22px; background: linear-gradient(140deg, #0b1329 0%, #0f172a 65%, #1e1b4b 100%); border-radius: 26px; border: 1.5px solid rgba(255, 255, 255, 0.08); padding: 24px 20px; position: relative; overflow: hidden; box-shadow: 0 16px 40px rgba(0,0,0,0.5);">
                        <!-- Accent Bar -->
                        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 4px; background: linear-gradient(90deg, ${catTheme}, #ccff00, #38bdf8);"></div>
                        
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; position: relative; z-index: 2;">
                            <div>
                                <div style="display: inline-flex; align-items: center; gap: 6px; background: rgba(204, 255, 0, 0.12); border: 1px solid rgba(204, 255, 0, 0.3); padding: 3px 10px; border-radius: 16px; margin-bottom: 8px;">
                                    <span style="font-size: 0.64rem; color: #ccff00; font-weight: 900; letter-spacing: 0.8px; text-transform: uppercase;">
                                        ${activeTeam.category} • ${activeTeam.division || '3ª División'}
                                    </span>
                                </div>
                                <h1 style="color: #ffffff; font-weight: 950; font-size: 2rem; margin: 0 0 6px; letter-spacing: -0.5px; line-height: 1.1;">
                                    ${activeTeam.name}
                                </h1>
                                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 0.78rem; color: #94a3b8;">
                                    <span><i class="fas fa-layer-group" style="color: #38bdf8;"></i> Grupo: <strong style="color: #f1f5f9;">${activeTeam.group || 'Oficial SummaPadel'}</strong></span>
                                    <span>•</span>
                                    <span><i class="fas fa-crown" style="color: #f59e0b;"></i> Cap: <strong style="color: #f1f5f9;">${activeTeam.captain || 'Por definir'}</strong></span>
                                </div>
                            </div>
                            <img src="${activeTeam.logo || 'img/logo_somospadel.png'}" 
                                 style="width: 64px; height: 64px; object-fit: contain; filter: drop-shadow(0 6px 16px rgba(0,0,0,0.6)); flex-shrink: 0;">
                        </div>

                        <!-- 4 MARCADORES PRO DEL EQUIPO -->
                        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 20px;">
                            <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 10px 4px; text-align: center;">
                                <div style="font-size: 0.55rem; color: #94a3b8; font-weight: 800; text-transform: uppercase;">Posición</div>
                                <div style="font-size: 1.3rem; font-weight: 950; color: #ccff00;">${activeTeam.ranking ? `${activeTeam.ranking}º` : '1º'}</div>
                            </div>
                            <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 10px 4px; text-align: center;">
                                <div style="font-size: 0.55rem; color: #94a3b8; font-weight: 800; text-transform: uppercase;">Puntos Liga</div>
                                <div style="font-size: 1.3rem; font-weight: 950; color: #ffffff;">${activeTeam.points || 0}</div>
                            </div>
                            <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 10px 4px; text-align: center;">
                                <div style="font-size: 0.55rem; color: #94a3b8; font-weight: 800; text-transform: uppercase;">Victorias</div>
                                <div style="font-size: 1.3rem; font-weight: 950; color: #38bdf8;">${activeTeam.stats?.pg || 0}<span style="font-size: 0.75rem; color: #64748b;">/${activeTeam.stats?.pj || 0}</span></div>
                            </div>
                            <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 10px 4px; text-align: center;">
                                <div style="font-size: 0.55rem; color: #94a3b8; font-weight: 800; text-transform: uppercase;">Dif. Sets</div>
                                <div style="font-size: 1.3rem; font-weight: 950; color: #a78bfa;">${(activeTeam.stats?.df >= 0 ? '+' : '') + (activeTeam.stats?.df || 0)}</div>
                            </div>
                        </div>

                    </div>

                    <!-- 🌟 TARJETA 1: TU FICHA PERSONAL DENTRO DEL EQUIPO -->
                    <div style="background: linear-gradient(135deg, rgba(14, 165, 233, 0.12) 0%, rgba(2, 132, 199, 0.04) 100%); border: 1.5px solid rgba(14, 165, 233, 0.35); border-radius: 22px; padding: 18px 20px; margin-bottom: 22px; display: flex; justify-content: space-between; align-items: center; gap: 14px; flex-wrap: wrap;">
                        <div style="display: flex; align-items: center; gap: 14px;">
                            <div style="width: 52px; height: 52px; border-radius: 50%; background: #0ea5e9; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; font-weight: 950; box-shadow: 0 4px 15px rgba(14, 165, 233, 0.4);">
                                ${(rawName || 'J').charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div style="font-size: 0.65rem; color: #38bdf8; font-weight: 900; text-transform: uppercase; letter-spacing: 0.8px;">TU PERFIL EN EL EQUIPO</div>
                                <div style="font-size: 1.15rem; font-weight: 950; color: #ffffff;">${rawName || 'Jugador SomosPadel'}</div>
                                <div style="font-size: 0.75rem; color: #94a3b8;">${userRankText} • Plantilla Oficial 2026</div>
                            </div>
                        </div>
                        <div style="text-align: right; background: rgba(0,0,0,0.25); padding: 8px 14px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.08);">
                            <div style="font-size: 0.6rem; color: #94a3b8; font-weight: 800; text-transform: uppercase;">Puntos SummaPadel</div>
                            <div style="font-size: 1.35rem; font-weight: 950; color: #ccff00;">${userPts} <span style="font-size: 0.7rem; color: #94a3b8;">PTS</span></div>
                        </div>
                    </div>

                    <!-- 📅 TARJETA 2: PRÓXIMA JORNADA & CONVOCATORIA INTERACTIVA (RSVP) -->
                    <div style="background: #0f172a; border: 1.5px solid rgba(255,255,255,0.08); border-radius: 24px; padding: 22px; margin-bottom: 22px; box-shadow: 0 10px 30px rgba(0,0,0,0.35);">
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="background: rgba(204, 255, 0, 0.16); color: #ccff00; border: 1px solid rgba(204, 255, 0, 0.4); font-size: 0.65rem; font-weight: 900; padding: 3px 9px; border-radius: 12px; text-transform: uppercase;">
                                    JORNADA ${jNum}
                                </span>
                                <span style="font-size: 0.72rem; color: ${isHome ? '#34d399' : '#38bdf8'}; font-weight: 800;">
                                    ${isHome ? '🏠 JUGAMOS EN CASA' : '🚗 JUGAMOS FUERA'}
                                </span>
                            </div>
                            ${nextMatch.venue ? `
                                <a href="https://maps.google.com/?q=${encodeURIComponent(address)}" target="_blank" 
                                   style="font-size: 0.7rem; color: #38bdf8; text-decoration: none; font-weight: 800; display: inline-flex; align-items: center; gap: 4px;">
                                    <i class="fas fa-map-marker-alt"></i> Cómo llegar
                                </a>
                            ` : ''}
                        </div>

                        <!-- Detalle del partido -->
                        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 18px; padding: 16px; margin-bottom: 18px;">
                            <div style="font-size: 0.65rem; color: #94a3b8; font-weight: 800; text-transform: uppercase; margin-bottom: 4px;">Rival oficial</div>
                            <div style="font-size: 1.3rem; font-weight: 950; color: #ffffff; margin-bottom: 10px;">
                                🆚 ${nextMatch.opponent || 'Por definir'}
                            </div>
                            <div style="display: flex; gap: 16px; flex-wrap: wrap; font-size: 0.8rem; color: #cbd5e1;">
                                <div><i class="far fa-calendar-alt" style="color: #ccff00;"></i> <strong>${nextMatch.date || 'Fecha pendiente'}</strong></div>
                                <div><i class="far fa-clock" style="color: #38bdf8;"></i> <strong>${nextMatch.time || 'Hora pendiente'}</strong></div>
                                <div><i class="fas fa-building" style="color: #a78bfa;"></i> <strong>${nextMatch.venue || 'Sede oficial'}</strong></div>
                            </div>
                        </div>

                        <!-- MÓDULO INTERACTIVO RSVP DEL JUGADOR -->
                        <div style="background: linear-gradient(135deg, rgba(255, 94, 0, 0.1) 0%, rgba(255, 94, 0, 0.02) 100%); border: 1.5px solid rgba(255, 94, 0, 0.3); border-radius: 18px; padding: 18px; margin-bottom: 16px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
                                <div>
                                    <div style="font-size: 0.82rem; font-weight: 900; color: #ffffff;">¿Juegas esta jornada con tu equipo?</div>
                                    <div style="font-size: 0.72rem; color: #94a3b8;">Confirma tu disponibilidad para que el capitán cierre la alineación</div>
                                </div>
                                ${userStatus ? `
                                    <div style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 12px; font-size: 0.72rem; font-weight: 900; background: ${userStatus === 'available' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}; color: ${userStatus === 'available' ? '#34d399' : '#f87171'}; border: 1px solid ${userStatus === 'available' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'};">
                                        <i class="fas ${userStatus === 'available' ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                                        ${userStatus === 'available' ? '¡VOY A JUGAR!' : 'NO PUEDO'}
                                    </div>
                                ` : ''}
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                <button onclick="window.TeamView.quickRsvpMyTeam('${activeTeam.id}', '${jNum}', 'available')"
                                        style="background: ${userStatus === 'available' ? '#10b981' : 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.35) 100%)'}; 
                                               color: #ffffff; border: 1.5px solid #10b981; padding: 12px 14px; border-radius: 14px; font-weight: 900; font-size: 0.82rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.25); transition: all 0.2s;">
                                    <i class="fas fa-check"></i> VOY A JUGAR
                                </button>
                                <button onclick="window.TeamView.quickRsvpMyTeam('${activeTeam.id}', '${jNum}', 'unavailable')"
                                        style="background: ${userStatus === 'unavailable' ? '#ef4444' : 'rgba(239, 68, 68, 0.15)'}; 
                                               color: ${userStatus === 'unavailable' ? '#ffffff' : '#fca5a5'}; border: 1.5px solid rgba(239, 68, 68, 0.4); padding: 12px 14px; border-radius: 14px; font-weight: 900; font-size: 0.82rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s;">
                                    <i class="fas fa-times"></i> NO PUEDO IR
                                </button>
                            </div>
                        </div>

                        <!-- ESTADO DE LA PLANTILLA: CONFIRMADOS DE LA JORNADA -->
                        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; margin-bottom: 8px;">
                            <span style="color: #94a3b8; font-weight: 800;">Convocatoria de tu equipo:</span>
                            <span style="color: #ccff00; font-weight: 900;">${confirmedCount} de ${targetCount} jugadores necesarios</span>
                        </div>
                        <div style="background: rgba(255,255,255,0.06); height: 8px; border-radius: 4px; overflow: hidden; margin-bottom: 12px;">
                            <div style="background: linear-gradient(90deg, #10b981, #ccff00); height: 100%; width: ${Math.min(100, Math.round((confirmedCount / targetCount) * 100))}%; transition: width 0.4s ease;"></div>
                        </div>

                        <!-- Botón para compartir convocatoria por WhatsApp -->
                        <button onclick="window.TeamView.shareMyTeamConvocatoria('${activeTeam.id}', '${jNum}')"
                                style="width: 100%; background: #25D366; color: #ffffff; border: none; padding: 12px 16px; border-radius: 14px; font-weight: 900; font-size: 0.78rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 15px rgba(37, 211, 102, 0.3);">
                            <i class="fab fa-whatsapp" style="font-size: 1rem;"></i> COMPARTIR CONVOCATORIA EN WHATSAPP DEL EQUIPO
                        </button>

                    </div>

                    <!-- 📊 TARJETA 3: CLASIFICACIÓN COMPLETA DEL GRUPO (SummaPadel) -->
                    <div style="background: #0f172a; border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; padding: 22px; margin-bottom: 22px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                            <div>
                                <h3 style="color: #ffffff; font-size: 1.05rem; font-weight: 950; margin: 0;">
                                    CLASIFICACIÓN OFICIAL DEL GRUPO
                                </h3>
                                <div style="font-size: 0.72rem; color: #94a3b8;">${activeTeam.group || 'Liga Oficial'}</div>
                            </div>
                            <span style="font-size: 0.65rem; color: #38bdf8; background: rgba(56, 189, 248, 0.12); border: 1px solid rgba(56, 189, 248, 0.3); padding: 3px 8px; border-radius: 10px; font-weight: 800;">
                                SUMMAPADEL
                            </span>
                        </div>

                        <div style="overflow-x: auto;">
                            <table style="width: 100%; border-collapse: collapse; font-size: 0.75rem; text-align: left;">
                                <thead>
                                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: #64748b;">
                                        <th style="padding: 8px 6px;">#</th>
                                        <th style="padding: 8px 6px;">EQUIPO</th>
                                        <th style="padding: 8px 6px; text-align: center;">PJ</th>
                                        <th style="padding: 8px 6px; text-align: center;">PG</th>
                                        <th style="padding: 8px 6px; text-align: center;">PP</th>
                                        <th style="padding: 8px 6px; text-align: right;">PTS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${(activeTeam.groupStandings && activeTeam.groupStandings.length > 0 ? activeTeam.groupStandings : [
                                        { pos: 1, team: activeTeam.name, pj: activeTeam.stats?.pj || 3, pg: activeTeam.stats?.pg || 3, pp: activeTeam.stats?.pp || 0, pts: activeTeam.points || 6, isCurrent: true }
                                    ]).map(row => {
                                        const isMyTeamRow = row.isCurrent || (row.team && (row.team.toLowerCase().includes(activeTeam.name.toLowerCase()) || activeTeam.name.toLowerCase().includes(row.team.toLowerCase())));
                                        const bg = isMyTeamRow ? 'rgba(204, 255, 0, 0.12)' : 'transparent';
                                        const border = isMyTeamRow ? '1px solid rgba(204, 255, 0, 0.3)' : '1px solid rgba(255,255,255,0.03)';
                                        return `
                                            <tr style="background: ${bg}; border-bottom: ${border}; font-weight: ${isMyTeamRow ? '900' : '600'};">
                                                <td style="padding: 10px 6px; color: ${row.pos <= 2 ? '#ccff00' : '#94a3b8'};">${row.pos || '-'}</td>
                                                <td style="padding: 10px 6px; color: ${isMyTeamRow ? '#ccff00' : '#f1f5f9'};">
                                                    ${row.team}
                                                    ${isMyTeamRow ? '<span style="background: #ccff00; color: #000; font-size: 0.55rem; padding: 2px 5px; border-radius: 6px; margin-left: 6px; font-weight: 950;">TU EQUIPO</span>' : ''}
                                                </td>
                                                <td style="padding: 10px 6px; text-align: center; color: #cbd5e1;">${row.pj !== undefined ? row.pj : '-'}</td>
                                                <td style="padding: 10px 6px; text-align: center; color: #34d399;">${row.pg !== undefined ? row.pg : '-'}</td>
                                                <td style="padding: 10px 6px; text-align: center; color: #f87171;">${row.pp !== undefined ? row.pp : '-'}</td>
                                                <td style="padding: 10px 6px; text-align: right; color: ${isMyTeamRow ? '#ccff00' : '#ffffff'}; font-weight: 950; font-size: 0.85rem;">${row.pts !== undefined ? row.pts : '-'}</td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- 👥 TARJETA 4: PLANTILLA COMPLETA DE COMPAÑEROS (ROSTER OFICIAL) -->
                    <div style="background: #0f172a; border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; padding: 22px; margin-bottom: 22px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                            <div>
                                <h3 style="color: #ffffff; font-size: 1.05rem; font-weight: 950; margin: 0;">
                                    PLANTILLA OFICIAL Y PUNTOS (${sortedRoster.length})
                                </h3>
                                <div style="font-size: 0.72rem; color: #94a3b8;">Ordenados por puntos oficiales SummaPadel</div>
                            </div>
                        </div>

                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            ${sortedRoster.map((player, idx) => {
                                const pName = typeof player === 'string' ? player : (player.name || 'Jugador');
                                const pts = typeof player === 'string' ? 0 : (player.pts || 0);
                                const isMe = cleanUserName && pName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(cleanUserName);
                                const isCap = activeTeam.captain && activeTeam.captain.toLowerCase().includes(pName.toLowerCase());
                                const isSub = activeTeam.subcaptain && activeTeam.subcaptain.toLowerCase().includes(pName.toLowerCase());

                                const bg = isMe ? 'linear-gradient(135deg, rgba(204, 255, 0, 0.15) 0%, rgba(14, 165, 233, 0.15) 100%)' : 'rgba(255,255,255,0.03)';
                                const border = isMe ? '1.5px solid #ccff00' : '1px solid rgba(255,255,255,0.06)';

                                return `
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: ${bg}; border: ${border}; border-radius: 14px;">
                                        <div style="display: flex; align-items: center; gap: 10px;">
                                            <span style="font-size: 0.72rem; font-weight: 900; color: ${idx < 3 ? '#ccff00' : '#64748b'}; width: 22px;">#${idx + 1}</span>
                                            <div>
                                                <div style="font-size: 0.82rem; font-weight: 900; color: ${isMe ? '#ccff00' : '#ffffff'};">
                                                    ${pName} ${isMe ? '<span style="background: #ccff00; color: #000; font-size: 0.55rem; padding: 2px 6px; border-radius: 8px; margin-left: 6px; font-weight: 950;">TÚ</span>' : ''}
                                                </div>
                                                ${isCap ? '<span style="font-size: 0.6rem; color: #f59e0b; font-weight: 800;"><i class="fas fa-crown"></i> Capitán</span>' : ''}
                                                ${isSub ? '<span style="font-size: 0.6rem; color: #38bdf8; font-weight: 800;"><i class="fas fa-star"></i> Subcapitán</span>' : ''}
                                            </div>
                                        </div>
                                        <div style="font-size: 0.9rem; font-weight: 950; color: #ffffff;">
                                            ${pts.toFixed(1)} <span style="font-size: 0.62rem; color: #94a3b8;">PTS</span>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>

                    <!-- 📅 TARJETA 5: CALENDARIO COMPLETO DE JORNADAS -->
                    <div style="background: #0f172a; border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; padding: 22px; margin-bottom: 22px;">
                        <h3 style="color: #ffffff; font-size: 1.05rem; font-weight: 950; margin: 0 0 14px;">
                            CALENDARIO COMPLETO DE LA LIGA (${(activeTeam.schedule || []).length} JORNADAS)
                        </h3>

                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            ${(activeTeam.schedule || []).map(m => {
                                const isCompleted = m.status === 'completed';
                                const hasResult = isCompleted && m.score && m.score !== 'Pendiente';
                                const res = this.getMatchResult(m);
                                const statusColor = res.isWin ? '#10b981' : (res.isLoss ? '#ef4444' : '#94a3b8');

                                return `
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; flex-wrap: wrap; gap: 8px;">
                                        <div style="display: flex; align-items: center; gap: 10px;">
                                            <span style="font-size: 0.68rem; font-weight: 900; background: rgba(255,255,255,0.08); padding: 3px 7px; border-radius: 8px; color: #cbd5e1;">J${m.j}</span>
                                            <div>
                                                <div style="font-size: 0.8rem; font-weight: 900; color: #ffffff;">vs ${m.opponent}</div>
                                                <div style="font-size: 0.68rem; color: #94a3b8;">${m.date} • ${m.time} • ${m.venue}</div>
                                            </div>
                                        </div>
                                        <div>
                                            ${hasResult ? `
                                                <span style="font-size: 0.75rem; font-weight: 900; background: ${res.isWin ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}; color: ${statusColor}; border: 1px solid ${statusColor}; padding: 3px 8px; border-radius: 8px;">
                                                    ${m.score} (${res.isWin ? 'W' : 'L'})
                                                </span>
                                            ` : `
                                                <span style="font-size: 0.68rem; color: #94a3b8; background: rgba(255,255,255,0.05); padding: 3px 8px; border-radius: 8px;">
                                                    ${m.score || 'Pendiente'}
                                                </span>
                                            `}
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>

                    <!-- 🛠️ TARJETA 6: HERRAMIENTAS Y ACCIONES DE EQUIPO -->
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 24px;">
                        <button onclick="window.TeamController?.showTeamDetail('${activeTeam.id}', 'tactica')"
                                style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.25) 100%); color: #34d399; border: 1.5px solid #10b981; padding: 14px; border-radius: 16px; font-weight: 900; font-size: 0.8rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
                            <i class="fas fa-clipboard-list" style="font-size: 1rem;"></i> PIZARRA TÁCTICA
                        </button>
                        <button onclick="window.TeamController?.showTeamDetail('${activeTeam.id}', 'liderazgo')"
                                style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.25) 100%); color: #fbbf24; border: 1.5px solid #f59e0b; padding: 14px; border-radius: 16px; font-weight: 900; font-size: 0.8rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
                            <i class="fas fa-chart-line" style="font-size: 1rem;"></i> ESTADÍSTICAS PRO
                        </button>
                    </div>

                </div>
            `;
        }

        switchMyTeamActive(index) {
            this.activeMyTeamIndex = index;
            if (window.PlayerView?.haptic) window.PlayerView.haptic(20);
            this.renderMyTeam(this.lastTeams);
        }

        saveAndSetMyTeams(primaryId, secondaryId) {
            const selected = [primaryId];
            if (secondaryId && secondaryId !== 'none' && secondaryId !== primaryId) {
                selected.push(secondaryId);
            }
            localStorage.setItem('myTeams_somospadel', JSON.stringify(selected));
            if (primaryId) {
                localStorage.setItem('favTeam_somospadel', primaryId);
            }
            this.activeMyTeamIndex = 0;
            if (window.PlayerView?.haptic) window.PlayerView.haptic(25);
            if (window.PremiumModal && typeof window.PremiumModal.toast === 'function') {
                window.PremiumModal.toast('✅ Equipo vinculado correctamente', 'success');
            }
            this.renderMyTeam(this.lastTeams);
        }

        openChangeMyTeamsModal() {
            const allTeams = this.lastTeams && this.lastTeams.length > 0 ? this.lastTeams : (window.ClubTeamsData || []);
            
            let savedTeamIds = [];
            try {
                const raw = localStorage.getItem('myTeams_somospadel');
                if (raw) savedTeamIds = JSON.parse(raw);
            } catch(e) {}
            const currentFav = savedTeamIds[0] || localStorage.getItem('favTeam_somospadel') || (allTeams[0] ? allTeams[0].id : '');
            const currentSec = savedTeamIds[1] || 'none';

            const modalHtml = `
                <div style="text-align: left; padding: 6px;">
                    <p style="font-size: 0.85rem; color: #475569; margin-bottom: 16px; line-height: 1.5;">
                        Selecciona tu equipo principal y, si compites en una segunda categoría (ej. Mixta), selecciona también tu segundo equipo:
                    </p>
                    <label style="display: block; font-size: 0.72rem; font-weight: 800; color: #0f172a; margin-bottom: 6px; text-transform: uppercase;">
                        1. Equipo Principal
                    </label>
                    <select id="modal-edit-team-1" style="width: 100%; padding: 10px; border-radius: 12px; border: 1.5px solid #cbd5e1; font-weight: 700; margin-bottom: 14px; font-size: 0.82rem;">
                        ${allTeams.map(t => `<option value="${t.id}" ${t.id === currentFav ? 'selected' : ''}>${t.name} (${t.category})</option>`).join('')}
                    </select>

                    <label style="display: block; font-size: 0.72rem; font-weight: 800; color: #0f172a; margin-bottom: 6px; text-transform: uppercase;">
                        2. Segundo Equipo (Opcional)
                    </label>
                    <select id="modal-edit-team-2" style="width: 100%; padding: 10px; border-radius: 12px; border: 1.5px solid #cbd5e1; font-weight: 700; margin-bottom: 18px; font-size: 0.82rem;">
                        <option value="none" ${currentSec === 'none' ? 'selected' : ''}>-- Solo 1 equipo --</option>
                        ${allTeams.map(t => `<option value="${t.id}" ${t.id === currentSec ? 'selected' : ''}>${t.name} (${t.category})</option>`).join('')}
                    </select>
                </div>
            `;

            window.PremiumModal.confirm({
                title: '⚙️ CONFIGURAR MI EQUIPO',
                message: modalHtml,
                confirmText: 'GUARDAR CAMBIOS',
                cancelText: 'CANCELAR',
                onConfirm: () => {
                    const t1 = document.getElementById('modal-edit-team-1')?.value;
                    const t2 = document.getElementById('modal-edit-team-2')?.value;
                    if (t1) {
                        this.saveAndSetMyTeams(t1, t2);
                    }
                }
            });
        }

        async quickRsvpMyTeam(teamId, jNum, status) {
            const currentUser = window.Store?.getState('currentUser') || (() => {
                try { return JSON.parse(localStorage.getItem('currentUser') || '{}'); } catch(e) { return {}; }
            })();
            const playerName = (currentUser.name || currentUser.displayName || currentUser.fullName || 'Jugador').trim();

            if (window.PlayerView?.haptic) window.PlayerView.haptic(30);

            try {
                if (window.TeamConvocatoriaService && typeof window.TeamConvocatoriaService.submitPlayerResponse === 'function') {
                    await window.TeamConvocatoriaService.submitPlayerResponse(teamId, jNum, playerName, status, '');
                } else {
                    const key = `somospadel_convo_${teamId}_j${jNum}`;
                    let data = {};
                    try { data = JSON.parse(localStorage.getItem(key) || '{}'); } catch(e){}
                    data.responses = data.responses || {};
                    data.responses[playerName] = { status: status, updatedAt: new Date().toISOString() };
                    localStorage.setItem(key, JSON.stringify(data));
                }

                if (window.PremiumModal && typeof window.PremiumModal.toast === 'function') {
                    const msg = status === 'available' ? '✅ ¡Confirmado! Asistirás a la jornada' : '❌ Has indicado que no puedes jugar';
                    window.PremiumModal.toast(msg, status === 'available' ? 'success' : 'info');
                }

                this.renderMyTeam(this.lastTeams);
            } catch (err) {
                console.error("Error al registrar disponibilidad:", err);
                alert("Error al guardar: " + err.message);
            }
        }

        shareMyTeamConvocatoria(teamId, jNum) {
            const team = (this.lastTeams || []).find(t => t.id === teamId);
            if (!team) return;

            const match = (team.schedule || []).find(m => String(m.j) === String(jNum)) || {};
            const key = `somospadel_convo_${teamId}_j${jNum}`;
            let convoData = {};
            try { convoData = JSON.parse(localStorage.getItem(key) || '{}'); } catch(e){}
            const responses = convoData.responses || {};
            const confirmed = Object.keys(responses).filter(k => responses[k]?.status === 'available');

            const text = `🎾 *SOMOS PÁDEL BARCELONA • CONVOCATORIA OFICIAL* 🎾\n\n` +
                         `🛡️ *${team.name}*\n` +
                         `📅 *Jornada ${jNum}:* vs ${match.opponent || 'Rival'}\n` +
                         `🗓️ *Fecha:* ${match.date || 'Por definir'} - ${match.time || 'Hora'}\n` +
                         `📍 *Sede:* ${match.venue || 'Club'}\n\n` +
                         `👥 *Jugadores Confirmados (${confirmed.length}/6):*\n` +
                         (confirmed.length > 0 ? confirmed.map(n => `✅ ${n}`).join('\n') : '⏳ Esperando confirmaciones...') +
                         `\n\n📲 *Confirma tu asistencia en la app oficial de SomosPadel*`;

            const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
            window.open(url, '_blank');
        }
    }

    window.TeamView = new TeamView();
})();
