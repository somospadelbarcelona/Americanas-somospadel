/**
 * MatchCard.js
 * Extracted UI logic for rendering a tournament match card.
 * SomosPadel BCN - Pro Sports Edition
 */
(function () {
    window.MatchCard = {
        renderOdometer(value, isWinner, id, type) {
            const strip = Array.from({ length: 13 }, (_, i) => {
                const num = i < 12 ? i : '0';
                return `<span style="${isWinner ? 'color: #000000;' : 'color: #0f172a;'} font-weight: 1000; font-family: 'Outfit', sans-serif;">${num}</span>`;
            }).join('');

            return `
                <div id="odometer-${type}-${id}" class="odometer-container ${isWinner ? 'winner' : ''}" 
                     style="${!isWinner ? 'background: #f1f5f9; border: 1.5px solid #cbd5e1; box-shadow: inset 0 2px 5px rgba(0,0,0,0.06);' : ''}">
                    <div class="odometer-digit-strip" style="transform: translateY(-${(value % 12) * 50}px)">
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
                strip.style.transform = `translateY(-${(newValue % 12) * 50}px)`;
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
                container.style.background = '#f1f5f9';
                container.style.borderColor = '#cbd5e1';
                container.style.boxShadow = 'inset 0 2px 5px rgba(0,0,0,0.06)';
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

        getInitials(name) {
            if (!name) return '🎾';
            const parts = name.trim().split(/\s+/);
            if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
            return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
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
            const { currentUser, isEntreno, eventStatus } = options;

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

            const canEdit = options.canEdit || options.isControlTower || ((eventStatus === 'live' || eventStatus === 'adjusting') && currentUser);
            const canUnlock = options.canUnlock || options.isControlTower || isAdmin || isMyMatch || canEdit;

            const sA = parseInt(match.score_a || 0);
            const sB = parseInt(match.score_b || 0);
            const winnerA = isFinished && sA > sB;
            const winnerB = isFinished && sB > sA;

            const timeLabel = (window.calculateMatchTime) ? window.calculateMatchTime(options.eventTime || "10:00", parseInt(match.round) || 1) : "Seguido";

            // Status Badge
            let statusBadge = '';
            if (isFinished) {
                statusBadge = `
                    <div style="display:inline-flex; align-items:center; gap:5px; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 3px 9px; border-radius: 20px;">
                        <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#10b981;"></span>
                        <span style="color: #065f46; font-weight: 950; font-size: 0.6rem; letter-spacing: 0.5px; text-transform:uppercase;">CONFIRMADO</span>
                    </div>
                `;
            } else if (isLive) {
                statusBadge = `
                    <div style="display:inline-flex; align-items:center; gap:5px; background: rgba(34, 197, 94, 0.12); border: 1px solid rgba(34, 197, 94, 0.35); padding: 3px 9px; border-radius: 20px;">
                        <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#22c55e; animation: livePulseDot 1.5s infinite;"></span>
                        <span style="color: #15803d; font-weight: 950; font-size: 0.6rem; letter-spacing: 0.5px; text-transform:uppercase;">EN JUEGO</span>
                    </div>
                `;
            } else {
                statusBadge = `
                    <div style="display:inline-flex; align-items:center; gap:4px; background: #f1f5f9; border: 1px solid #e2e8f0; padding: 3px 9px; border-radius: 20px;">
                        <span style="color: #64748b; font-weight: 900; font-size: 0.6rem; letter-spacing: 0.5px;">PROGRAMADO</span>
                    </div>
                `;
            }

            // Card Container Styling
            let cardBorder = 'border: 1px solid #e2e8f0;';
            let cardBg = '#ffffff';
            let cardShadow = '0 4px 18px rgba(0, 0, 0, 0.04)';

            if (isMyMatch) {
                cardBorder = 'border: 2px solid #72a800;';
                cardBg = 'linear-gradient(180deg, #fafef5 0%, #ffffff 40px)';
                cardShadow = '0 8px 30px rgba(114, 168, 0, 0.15)';
            } else if (isFinished) {
                cardBorder = 'border: 1px solid #e2e8f0;';
                cardBg = '#fafcff';
            }

            // Action Area
            let actionArea = '';
            if (isFinished) {
                actionArea = `
                    <div style="margin-top: 14px; padding: 10px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 1rem;">🏁</span>
                            <div style="display: flex; flex-direction: column;">
                                <span style="font-size: 0.68rem; color: #0a192f; font-weight: 950; text-transform: uppercase; letter-spacing: 0.5px;">Resultado Oficial</span>
                                <span style="font-size: 0.65rem; color: #64748b; font-weight: 800;">
                                    Final: <b>${sA} - ${sB}</b> ${winnerA ? `• Victoria ${safeTeamA}` : (winnerB ? `• Victoria ${safeTeamB}` : '')}
                                </span>
                            </div>
                        </div>
                        ${canUnlock ? `
                            <button type="button" onclick="window.ControlTowerView.unlockMatch('${match.id}')"
                                    title="Modificar resultado"
                                    style="background: #ffffff; color: #0284c7; border: 1px solid #bae6fd; padding: 6px 12px; border-radius: 10px; font-weight: 950; font-size: 0.68rem; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; box-shadow: 0 2px 6px rgba(2,132,199,0.08); transition: all 0.2s;">
                                <i class="fas fa-edit"></i>
                                <span>Corregir</span>
                            </button>
                        ` : ''}
                    </div>
                `;
            } else if (canEdit || isAdmin) {
                actionArea = `
                    <div style="margin-top: 14px; padding-top: 14px; border-top: 1px solid #f1f5f9;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <span style="font-size: 0.6rem; font-weight: 950; color: #72a800; letter-spacing: 1.2px; text-transform: uppercase;">
                                <i class="fas fa-sliders-h"></i> CONTROL DE MARCADOR
                            </span>
                            <span style="font-size: 0.58rem; color: #94a3b8; font-weight: 800;">PULSA + O -</span>
                        </div>
                        <div style="display: flex; gap: 8px; justify-content: space-between; width: 100%;">
                            <!-- Team A score buttons -->
                            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 5px; background: #f8fafc; padding: 9px 6px; border-radius: 14px; border: 1px solid #e2e8f0;">
                                <div style="font-size: 0.55rem; color: #64748b; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px;">EQ. SUPERIOR</div>
                                <div style="display: flex; align-items: center; gap: 8px; justify-content: center;">
                                    <button type="button" onclick="window.ControlTowerView.adjustScore('${match.id}', 'score_a', -1)" 
                                            style="width: 34px; height: 34px; border-radius: 10px; border: 1px solid #cbd5e1; background: #ffffff; color: #0a192f; font-size: 1.2rem; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: 900; box-shadow: 0 2px 5px rgba(0,0,0,0.04); transition: transform 0.1s;">-</button>
                                    <span id="score-a-val-${match.id}" style="font-size: 1.35rem; font-weight: 1000; color: #0a192f; min-width: 26px; text-align: center; font-family: 'Outfit', sans-serif;">${sA}</span>
                                    <button type="button" onclick="window.ControlTowerView.adjustScore('${match.id}', 'score_a', 1)" 
                                            style="width: 34px; height: 34px; border-radius: 10px; border: 1px solid #cbd5e1; background: #ffffff; color: #0a192f; font-size: 1.2rem; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: 900; box-shadow: 0 2px 5px rgba(0,0,0,0.04); transition: transform 0.1s;">+</button>
                                </div>
                            </div>
                            <!-- Team B score buttons -->
                            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 5px; background: #f8fafc; padding: 9px 6px; border-radius: 14px; border: 1px solid #e2e8f0;">
                                <div style="font-size: 0.55rem; color: #64748b; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px;">EQ. INFERIOR</div>
                                <div style="display: flex; align-items: center; gap: 8px; justify-content: center;">
                                    <button type="button" onclick="window.ControlTowerView.adjustScore('${match.id}', 'score_b', -1)" 
                                            style="width: 34px; height: 34px; border-radius: 10px; border: 1px solid #cbd5e1; background: #ffffff; color: #0a192f; font-size: 1.2rem; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: 900; box-shadow: 0 2px 5px rgba(0,0,0,0.04); transition: transform 0.1s;">-</button>
                                    <span id="score-b-val-${match.id}" style="font-size: 1.35rem; font-weight: 1000; color: #0a192f; min-width: 26px; text-align: center; font-family: 'Outfit', sans-serif;">${sB}</span>
                                    <button type="button" onclick="window.ControlTowerView.adjustScore('${match.id}', 'score_b', 1)" 
                                            style="width: 34px; height: 34px; border-radius: 10px; border: 1px solid #cbd5e1; background: #ffffff; color: #0a192f; font-size: 1.2rem; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: 900; box-shadow: 0 2px 5px rgba(0,0,0,0.04); transition: transform 0.1s;">+</button>
                                </div>
                            </div>
                        </div>

                        ${isEntreno ? `
                            <div id="tie-warning-${match.id}" style="display:${sA === sB && (sA > 0 || sB > 0) ? 'flex' : 'none'}; align-items: center; gap: 7px; margin-top: 9px; padding: 7px 12px; background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.35); border-radius: 10px;">
                                <span style="font-size: 0.95rem;">⚠️</span>
                                <span style="font-size: 0.68rem; color: #d97706; font-weight: 900;">EMPATE NO VÁLIDO: en entreno debe haber ganador.</span>
                            </div>
                        ` : ''}

                        <button type="button" 
                                onclick="window.ControlTowerView.finishMatch('${match.id}')"
                                id="finish-btn-${match.id}"
                                style="width: 100%; margin-top: 10px; padding: 12px 14px; background: ${isEntreno && sA === sB ? 'rgba(245, 158, 11, 0.15)' : 'linear-gradient(135deg, #72a800 0%, #00e36d 100%)'}; color: ${isEntreno && sA === sB ? '#d97706' : '#000000'}; font-weight: 1000; border-radius: 14px; font-size: 0.84rem; cursor: pointer; border: ${isEntreno && sA === sB ? '1px solid rgba(245, 158, 11, 0.4)' : 'none'}; box-shadow: ${isEntreno && sA === sB ? 'none' : '0 6px 18px rgba(114, 168, 0, 0.28)'}; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s;">
                            <i class="fas ${isEntreno && sA === sB ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i>
                            <span>${isEntreno && sA === sB ? 'EMPATE — CORRIGE MARCADOR' : 'FINALIZAR PARTIDO'}</span>
                        </button>
                    </div>
                `;
            } else {
                actionArea = `
                    <div style="margin-top: 10px; padding: 7px; background: #f8fafc; border: 1px dashed #e2e8f0; border-radius: 10px; text-align: center;">
                        <span style="font-size: 0.62rem; color: #94a3b8; font-weight: 800; letter-spacing: 0.5px;">MODO ESPECTADOR • EN SEGUIMIENTO</span>
                    </div>
                `;
            }

            // Render Team Avatars & Names
            const renderTeamBlock = (teamInfo, isWinner, isMyTeam) => {
                const players = teamInfo.players || ['EQUIPO'];
                const p1 = players[0] || 'JUGADOR 1';
                const p2 = players[1] || '';

                const p1Init = this.getInitials(p1);
                const p2Init = p2 ? this.getInitials(p2) : '';

                return `
                    <div style="display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1;">
                        <!-- Overlapping Avatar Badges -->
                        <div style="display: flex; align-items: center; position: relative; width: ${p2 ? '42px' : '28px'}; height: 28px; flex-shrink: 0;">
                            <div style="width: 28px; height: 28px; border-radius: 50%; background: ${isWinner ? '#72a800' : '#334155'}; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 0.62rem; font-weight: 950; border: 2px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.12); position: relative; z-index: 2;">
                                ${p1Init}
                            </div>
                            ${p2 ? `
                                <div style="width: 28px; height: 28px; border-radius: 50%; background: ${isWinner ? '#00e36d' : '#64748b'}; color: ${isWinner ? '#000000' : '#ffffff'}; display: flex; align-items: center; justify-content: center; font-size: 0.62rem; font-weight: 950; border: 2px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.12); margin-left: -12px; position: relative; z-index: 1;">
                                    ${p2Init}
                                </div>
                            ` : ''}
                        </div>

                        <!-- Player Names -->
                        <div style="display: flex; flex-direction: column; min-width: 0; flex: 1;">
                            <div style="display: flex; align-items: center; gap: 5px; flex-wrap: wrap;">
                                ${isWinner ? `<i class="fas fa-trophy" style="color: #eab308; font-size: 0.82rem; flex-shrink: 0;"></i>` : ''}
                                <span style="font-size: 0.92rem; font-weight: ${isWinner ? '1000' : '850'}; color: ${isWinner ? '#0f172a' : '#334155'}; letter-spacing: -0.2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 130px;">
                                    ${p1}
                                </span>
                                ${p2 ? `
                                    <span style="color: #cbd5e1; font-weight: 700; font-size: 0.8rem;">/</span>
                                    <span style="font-size: 0.92rem; font-weight: ${isWinner ? '1000' : '850'}; color: ${isWinner ? '#0f172a' : '#334155'}; letter-spacing: -0.2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 130px;">
                                        ${p2}
                                    </span>
                                ` : ''}
                            </div>
                            ${isMyTeam ? `
                                <span style="display: inline-block; color: #72a800; font-size: 0.58rem; font-weight: 950; letter-spacing: 0.8px; margin-top: 1px;">
                                    TU EQUIPO ★
                                </span>
                            ` : ''}
                        </div>
                    </div>
                `;
            };

            return `
                <div class="match-card animate-pop-in" id="card-${match.id}" 
                     style="background: ${cardBg}; border-radius: 18px; overflow: hidden; margin-bottom: 12px; position: relative; ${cardBorder}; box-shadow: ${cardShadow}; transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);">
                    
                    ${isMyMatch ? `
                        <!-- My Match Accent Ribbon -->
                        <div style="background: linear-gradient(90deg, #72a800 0%, #00e36d 100%); padding: 3px 14px; display: flex; align-items: center; justify-content: space-between; color: #000000; font-size: 0.6rem; font-weight: 1000; letter-spacing: 0.8px;">
                            <span>⭐ TU PARTIDO DESIGNADO</span>
                            <span>PISTA ${match.court}</span>
                        </div>
                    ` : ''}

                    <!-- Card Header -->
                    <div style="padding: 9px 14px; background: #f8fafc; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="background: #0f172a; color: #ffffff; padding: 2px 8px; border-radius: 8px; font-size: 0.65rem; font-weight: 950; letter-spacing: 0.5px;">
                                PISTA ${match.court}
                            </span>
                            <span style="font-size: 0.65rem; font-weight: 850; color: #64748b; letter-spacing: 0.5px;">
                                R${match.round} • ${timeLabel}
                            </span>
                        </div>
                        <div class="status-area">${statusBadge}</div>
                    </div>

                    <!-- Card Body -->
                    <div style="padding: 14px 14px 12px;">
                        <!-- Team A Row -->
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            ${renderTeamBlock(teamAInfo, winnerA, isPartA)}
                            <div id="match-score-a-${match.id}" 
                                 onclick="${isAdmin || canEdit ? `window.ControlTowerView.manualScoreEdit('${match.id}', 'score_a')` : ''}"
                                 style="cursor: ${isAdmin || canEdit ? 'pointer' : 'default'}; flex-shrink: 0; margin-left: 8px;"
                                 title="${isAdmin || canEdit ? 'Editar marcador' : ''}">
                                ${window.MatchCard.renderOdometer(sA, winnerA, match.id, 'a')}
                            </div>
                        </div>

                        <!-- VS Divider -->
                        <div style="height: 1px; background: #f1f5f9; margin: 10px 0; position: relative;">
                            <div style="position: absolute; top: -8px; left: 50%; transform: translateX(-50%); background: #ffffff; padding: 0 8px; border-radius: 6px; font-size: 0.52rem; color: #94a3b8; font-weight: 950; border: 1px solid #e2e8f0;">
                                VS
                            </div>
                        </div>

                        <!-- Team B Row -->
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            ${renderTeamBlock(teamBInfo, winnerB, isPartB)}
                            <div id="match-score-b-${match.id}" 
                                 onclick="${isAdmin || canEdit ? `window.ControlTowerView.manualScoreEdit('${match.id}', 'score_b')` : ''}"
                                 style="cursor: ${isAdmin || canEdit ? 'pointer' : 'default'}; flex-shrink: 0; margin-left: 8px;"
                                 title="${isAdmin || canEdit ? 'Editar marcador' : ''}">
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

