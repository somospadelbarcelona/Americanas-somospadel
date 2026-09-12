/**
 * MatchCard.js
 * Extracted UI logic for rendering a tournament match card.
 */
(function () {
    window.MatchCard = {
        renderOdometer(value, isWinner, id, type) {
            const strip = Array.from({ length: 11 }, (_, i) => `<span style="${isWinner ? 'color: #000000;' : 'color: #0f172a;'} font-weight: 950;">${i < 10 ? i : '0'}</span>`).join('');
            return `
                <div id="odometer-${type}-${id}" class="odometer-container ${isWinner ? 'winner' : ''}" style="${!isWinner ? 'background: #e2e8f0; border: 1px solid #cbd5e1;' : ''}">
                    <div class="odometer-digit-strip" style="transform: translateY(-${(value % 10) * 50}px)">
                        ${strip}
                    </div>
                </div>
            `;
        },

        updateOdometer(id, side, newValue, isWinner) {
            const container = document.getElementById(`odometer-${side}-${id}`);
            if (!container) return;

            const strip = container.querySelector('.odometer-digit-strip');
            if (strip) {
                strip.style.transform = `translateY(-${(newValue % 10) * 50}px)`;
                const spans = strip.querySelectorAll('span');
                spans.forEach(s => {
                    s.style.color = isWinner ? '#000000' : '#0f172a';
                });
            }

            if (isWinner) {
                container.classList.add('winner');
                container.style.background = '';
                container.style.borderColor = '';
            } else {
                container.classList.remove('winner');
                container.style.background = '#e2e8f0';
                container.style.borderColor = '#cbd5e1';
            }
        },

        formatSingleName(raw) {
            if (!raw || typeof raw !== 'string') return '';
            const cleaned = raw.trim();
            if (!cleaned) return '';

            const cap = (w) => {
                const lower = w.toLowerCase();
                if (['de', 'del', 'la', 'las', 'el', 'los', 'da', 'do', 'dos', 'das', 'y', 'i'].includes(lower)) {
                    return lower;
                }
                return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
            };

            const parts = cleaned.split(/\s+/);
            if (parts.length <= 2) {
                return parts.map(cap).join(' ');
            }

            const compoundFirstNames = [
                'juan', 'jose', 'josé', 'maria', 'maría', 'miguel', 'francisco',
                'carlos', 'ana', 'victor', 'víctor', 'luis', 'pedro', 'jesus', 'jesús'
            ];

            const p0Lower = parts[0].toLowerCase();
            const isCompound = parts.length >= 4 && compoundFirstNames.includes(p0Lower);
            const firstName = isCompound ? `${cap(parts[0])} ${cap(parts[1])}` : cap(parts[0]);
            const surnameStart = isCompound ? 2 : 1;

            const rem = parts.slice(surnameStart);
            let surname = '';
            if (rem.length === 1) {
                surname = cap(rem[0]);
            } else if (rem[0].toLowerCase() === 'de' && rem.length >= 2 && ['la', 'las', 'el', 'los'].includes(rem[1].toLowerCase())) {
                surname = rem.length >= 3 ? `de ${rem[1].toLowerCase()} ${cap(rem[2])}` : `de ${rem[1].toLowerCase()}`;
            } else if (['de', 'del', 'da'].includes(rem[0].toLowerCase()) && rem.length >= 2) {
                surname = `${rem[0].toLowerCase()} ${cap(rem[1])}`;
            } else {
                surname = cap(rem[0]);
            }

            return `${firstName} ${surname}`.trim();
        },

        parseTeam(namesArr, teamStr) {
            let list = [];
            if (Array.isArray(namesArr) && namesArr.length > 0) {
                list = namesArr;
            } else if (teamStr && typeof teamStr === 'string' && teamStr.length > 0) {
                list = teamStr.split(/\s*\/\s*/);
            }

            if (list.length === 0) return { fullText: 'EQUIPO', players: ['EQUIPO'] };

            const players = list.map(p => this.formatSingleName(p)).filter(Boolean);
            return {
                fullText: players.join(' / '),
                players: players.length > 0 ? players : ['EQUIPO']
            };
        },

        render(match, options = {}) {
            const { currentUser, isEntreno, eventStatus, theme } = options;
            const colorClass = `border-${(match.court % 4) + 1}`;

            const teamAInfo = this.parseTeam(match.team_a_names, match.teamA);
            const teamBInfo = this.parseTeam(match.team_b_names, match.teamB);
            const safeTeamA = teamAInfo.fullText || 'EQUIPO A';
            const safeTeamB = teamBInfo.fullText || 'EQUIPO B';

            const rawTeamAStr = (Array.isArray(match.team_a_names) ? match.team_a_names.join(' ') : (match.teamA || '')).toLowerCase();
            const rawTeamBStr = (Array.isArray(match.team_b_names) ? match.team_b_names.join(' ') : (match.teamB || '')).toLowerCase();
            const currentUserNameLower = (currentUser?.name || '').toLowerCase();

            const isPartA = currentUser && (match.team_a_ids?.includes(currentUser.uid) || 
                safeTeamA.toLowerCase().includes(currentUserNameLower) ||
                rawTeamAStr.includes(currentUserNameLower));
            const isPartB = currentUser && (match.team_b_ids?.includes(currentUser.uid) || 
                safeTeamB.toLowerCase().includes(currentUserNameLower) ||
                rawTeamBStr.includes(currentUserNameLower));
            const isMyMatch = isPartA || isPartB;
            const isAdmin = options.isControlTower || ['super_admin', 'superadmin', 'admin', 'admin_player', 'captain', 'capitan', 'capitanes', 'organizador', 'organizadores'].includes((currentUser?.role || '').toLowerCase());

            const isFinished = match.status === 'finished' || match.status === 'finalizado' || match.isFinished === true;
            const isLive = (eventStatus === 'live' || eventStatus === 'adjusting' || options.isControlTower) && !isFinished;

            let statusBadge = '';
            const canEdit = options.canEdit || options.isControlTower || ((eventStatus === 'live' || eventStatus === 'adjusting') && currentUser);
            const canUnlock = options.canUnlock || options.isControlTower || isAdmin || isMyMatch || canEdit;

            if (isFinished) {
                statusBadge = `
                    <div style="display:flex; align-items:center; gap:6px;">
                        <span style="background: #25D366; color: white; padding: 4px 10px; border-radius: 12px; font-weight: 950; font-size: 0.6rem; letter-spacing: 0.5px; text-transform:uppercase;">FINALIZADO</span>
                        ${canUnlock ? `
                            <button onclick="window.ControlTowerView.unlockMatch('${match.id}')" title="Corregir resultado"
                                    style="background: #ffffff; color: #0284c7; border: 1px solid #bae6fd; padding: 3px 8px; border-radius: 10px; font-weight: 900; font-size: 0.6rem; cursor: pointer; display: flex; align-items: center; gap: 4px; box-shadow: 0 1px 4px rgba(0,0,0,0.05);">
                                ✏️ EDITAR
                            </button>
                        ` : ''}
                    </div>
                `;
            } else if (isLive) {
                statusBadge = '<span class="status-badge-live" style="animation: pulse 1s infinite alternate;">⚡ EN JUEGO</span>';
            } else {
                statusBadge = '<span style="background: rgba(255,255,255,0.1); color: #888; padding: 4px 10px; border-radius: 12px; font-weight: 900; font-size: 0.6rem; letter-spacing: 0.5px;">PROGRAMADO</span>';
            }

            const sA = parseInt(match.score_a || 0);
            const sB = parseInt(match.score_b || 0);
            const timeLabel = (window.calculateMatchTime) ? window.calculateMatchTime(options.eventTime || "10:00", parseInt(match.round) || 1) : "Seguido";

            let cardStyle = 'border: 1px solid #e2e8f0;';
            let cardBg = '#ffffff';

            if (isFinished) {
                cardStyle = 'border: 1px solid #e2e8f0; z-index: 1;';
                cardBg = '#f8fafc';
            } else if (isMyMatch && isLive) {
                cardStyle = 'border: 3px solid #72a800; box-shadow: 0 15px 45px rgba(114, 168, 0, 0.2); transform: scale(1.03); z-index: 10;';
            }

            const winnerA = isFinished && sA > sB;
            const winnerB = isFinished && sB > sA;

            // Action Area logic
            let actionArea = '';
            if (isFinished) {
                actionArea = `
                    <div style="margin-top: 12px; padding: 10px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 1rem;">🏁</span>
                            <div style="display: flex; flex-direction: column;">
                                <span style="font-size: 0.7rem; color: #0a192f; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px;">Resultado Confirmado</span>
                                <span style="font-size: 0.65rem; color: #64748b; font-weight: 700;">Final: <b>${sA} - ${sB}</b> ${winnerA ? `(Gana ${safeTeamA})` : (winnerB ? `(Gana ${safeTeamB})` : '')}</span>
                            </div>
                        </div>
                        ${canUnlock ? `
                            <button onclick="window.ControlTowerView.unlockMatch('${match.id}')"
                                    style="background: #ffffff; color: #0284c7; border: 1px solid #bae6fd; padding: 7px 14px; border-radius: 10px; font-weight: 950; font-size: 0.75rem; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 2px 8px rgba(2,132,199,0.12); transition: all 0.2s;">
                                ✏️ Corregir Marcador
                            </button>
                        ` : ''}
                    </div>
                `;
            } else if (canEdit || isAdmin) {
                actionArea = `
                    <div style="margin-top:12px; padding-top:12px; border-top:1px solid #e2e8f0;">
                        <div style="text-align:center; margin-bottom:8px;">
                            <span style="font-size:0.55rem; font-weight:950; color:#72a800; letter-spacing:2px; text-transform:uppercase;">INTRODUCIR RESULTADO</span>
                        </div>
                        <div style="display:flex; gap:8px; justify-content:space-between; width:100%;">
                            <div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:4px; background:#f8fafc; padding:8px 5px; border-radius:14px; border:1px solid #e2e8f0;">
                                <div style="font-size:0.5rem; color:#64748b; font-weight:900; text-transform:uppercase; letter-spacing:0.5px;">EQ. ARRIBA</div>
                                <div style="display:flex; align-items:center; gap:6px; justify-content:center;">
                                    <button onclick="window.ControlTowerView.adjustScore('${match.id}', 'score_a', -1)" style="width:28px; height:28px; border-radius:50%; border:1px solid #e2e8f0; background:#f1f5f9; color:#0a192f; font-size:1.2rem; cursor:pointer; display:flex; align-items:center; justify-content:center; line-height:1;">-</button>
                                    <span id="score-a-val-${match.id}" style="font-size:1.4rem; font-weight:950; color:#0a192f; min-width:24px; text-align:center;">${sA}</span>
                                    <button onclick="window.ControlTowerView.adjustScore('${match.id}', 'score_a', 1)" style="width:28px; height:28px; border-radius:50%; border:1px solid #e2e8f0; background:#f1f5f9; color:#0a192f; font-size:1.2rem; cursor:pointer; display:flex; align-items:center; justify-content:center; line-height:1;">+</button>
                                </div>
                            </div>
                            <div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:4px; background:#f8fafc; padding:8px 5px; border-radius:14px; border:1px solid #e2e8f0;">
                                <div style="font-size:0.5rem; color:#64748b; font-weight:900; text-transform:uppercase; letter-spacing:0.5px;">EQ. ABAJO</div>
                                <div style="display:flex; align-items:center; gap:6px; justify-content:center;">
                                    <button onclick="window.ControlTowerView.adjustScore('${match.id}', 'score_b', -1)" style="width:28px; height:28px; border-radius:50%; border:1px solid #e2e8f0; background:#f1f5f9; color:#0a192f; font-size:1.2rem; cursor:pointer; display:flex; align-items:center; justify-content:center; line-height:1;">-</button>
                                    <span id="score-b-val-${match.id}" style="font-size:1.4rem; font-weight:950; color:#0a192f; min-width:24px; text-align:center;">${sB}</span>
                                    <button onclick="window.ControlTowerView.adjustScore('${match.id}', 'score_b', 1)" style="width:28px; height:28px; border-radius:50%; border:1px solid #e2e8f0; background:#f1f5f9; color:#0a192f; font-size:1.2rem; cursor:pointer; display:flex; align-items:center; justify-content:center; line-height:1;">+</button>
                                </div>
                            </div>
                        </div>
                        ${isEntreno ? `
                        <div id="tie-warning-${match.id}" style="display:${sA === sB && (sA > 0 || sB > 0) ? 'flex' : 'none'}; align-items:center; gap:6px; margin-top:8px; padding:6px 12px; background:rgba(255,160,0,0.12); border:1px solid rgba(255,160,0,0.4); border-radius:10px;">
                            <span style="font-size:0.9rem;">⚠️</span>
                            <span style="font-size:0.65rem; color:#FFA000; font-weight:800;">EMPATE NO VÁLIDO</span>
                        </div>` : ''}
                        <button onclick="window.ControlTowerView.finishMatch('${match.id}')"
                                id="finish-btn-${match.id}"
                                style="width:100%; margin-top:12px; padding:12px 14px; background:${isEntreno && sA === sB ? 'rgba(255,160,0,0.2)' : 'var(--brand-neon)'}; color:${isEntreno && sA === sB ? '#FFA000' : 'black'}; font-weight:950; border-radius:14px; font-size:0.85rem; cursor:pointer; border:none;">
                            ${isEntreno && sA === sB ? 'EMPATE — CORRIGE' : 'FINALIZAR PARTIDO'}
                        </button>
                    </div>
                `;
            } else {
                actionArea = `
                    <div style="margin-top:10px; padding:8px; background:rgba(255,255,255,0.02); border:1px dashed rgba(255,255,255,0.1); border-radius:10px; text-align:center;">
                        <span style="font-size:0.65rem; color:#666; font-weight:700;">MODO ESPECTADOR</span>
                    </div>
                `;
            }

            const isEnJuego = match.status === 'live' || match.status === 'en juego';
            const liveClass = isEnJuego ? 'live-pulse-card' : '';
            const cardGlow = (isEnJuego && !isMyMatch) ? 'border: 1px solid rgba(204, 255, 0, 0.3);' : (isMyMatch && isLive ? '' : 'border: 1px solid rgba(255,255,255,0.08);');

            const renderTeamMarkup = (teamInfo, isWinner) => {
                const borderStyle = isWinner ? 'border-bottom: 2px solid #72a800;' : '';
                if (!teamInfo.players || teamInfo.players.length <= 1) {
                    return `<span style="font-size: 1.02rem; color: #0a192f; font-weight: 900; letter-spacing: -0.3px; ${borderStyle}">${teamInfo.players[0] || 'EQUIPO'}</span>`;
                }
                return `
                    <span style="font-size: 0.98rem; color: #0a192f; font-weight: 900; letter-spacing: -0.3px; ${borderStyle}; white-space: nowrap;">${teamInfo.players[0]}</span>
                    <span style="color: #94a3b8; font-size: 0.85rem; font-weight: 700; user-select: none; margin: 0 1px;">/</span>
                    <span style="font-size: 0.98rem; color: #0a192f; font-weight: 900; letter-spacing: -0.3px; ${borderStyle}; white-space: nowrap;">${teamInfo.players[1]}</span>
                `;
            };

            return `
                <div class="match-card animate-pop-in ${isLive ? 'live-shadow' : ''}" id="card-${match.id}" 
                     style="background: ${cardBg}; border-radius: 20px; overflow: hidden; margin-bottom: 12px; position: relative; ${cardStyle}; box-shadow: 0 6px 20px rgba(0,0,0,0.04);">
                    <div style="padding: 10px 16px; background: #f8fafc; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0;">
                        <span style="font-size: 0.6rem; font-weight: 950; color: #64748b; letter-spacing: 1.5px; text-transform: uppercase;">
                            PISTA ${match.court} • R${match.round} • ${timeLabel}
                        </span>
                        <div class="status-area">${statusBadge}</div>
                    </div>
                    <div style="padding: 14px 16px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <div style="flex: 1; display: flex; flex-direction: column; gap: 4px; min-width: 0; padding-right: 10px;">
                                <div style="display: flex; align-items: center; flex-wrap: wrap; gap: 3px 6px; line-height: 1.25;">
                                    ${winnerA ? `<i class="fas fa-trophy" style="color: #72a800; font-size: 0.92rem; margin-right: 3px; flex-shrink: 0;"></i>` : ''}
                                    ${renderTeamMarkup(teamAInfo, winnerA)}
                                </div>
                                ${isPartA ? '<span style="color: #72a800; font-size: 0.55rem; font-weight: 950; letter-spacing: 1px;">TU EQUIPO ★</span>' : ''}
                            </div>
                            <div id="match-score-a-${match.id}" 
                                 onclick="${isAdmin || canEdit ? `window.ControlTowerView.manualScoreEdit('${match.id}', 'score_a')` : ''}">
                                 ${window.MatchCard.renderOdometer(sA, winnerA, match.id, 'a')}
                            </div>
                        </div>
                        
                        <div style="height: 1px; background: #e2e8f0; margin: 10px 0; position: relative;">
                            <div style="position: absolute; top: -9px; left: 50%; transform: translateX(-50%); background: #ffffff; padding: 1px 8px; border-radius: 6px; font-size: 0.5rem; color: #cbd5e1; font-weight: 950; border: 1px solid #e2e8f0;">VS</div>
                        </div>

                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div style="flex: 1; display: flex; flex-direction: column; gap: 4px; min-width: 0; padding-right: 10px;">
                                <div style="display: flex; align-items: center; flex-wrap: wrap; gap: 3px 6px; line-height: 1.25;">
                                    ${winnerB ? `<i class="fas fa-trophy" style="color: #72a800; font-size: 0.92rem; margin-right: 3px; flex-shrink: 0;"></i>` : ''}
                                    ${renderTeamMarkup(teamBInfo, winnerB)}
                                </div>
                                ${isPartB ? '<span style="color: #72a800; font-size: 0.55rem; font-weight: 950; letter-spacing: 1px;">TU EQUIPO ★</span>' : ''}
                            </div>
                            <div id="match-score-b-${match.id}" 
                                 onclick="${isAdmin || canEdit ? `window.ControlTowerView.manualScoreEdit('${match.id}', 'score_b')` : ''}">
                                 ${window.MatchCard.renderOdometer(sB, winnerB, match.id, 'b')}
                            </div>
                        </div>
                        ${actionArea}
                    </div>
                </div>
            `;
        }
    };
})();
