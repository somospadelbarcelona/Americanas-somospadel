/**
 * MatchCard.js
 * Extracted UI logic for rendering a tournament match card.
 */
(function () {
    window.MatchCard = {
        renderOdometer(value, isWinner, id, type) {
            const strip = Array.from({ length: 11 }, (_, i) => `<span>${i < 10 ? i : '0'}</span>`).join('');
            return `
                <div id="odometer-${type}-${id}" class="odometer-container ${isWinner ? 'winner' : ''}">
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
            }

            if (isWinner) {
                container.classList.add('winner');
            } else {
                container.classList.remove('winner');
            }
        },
        render(match, options = {}) {
            const { currentUser, isEntreno, eventStatus, theme } = options;
            const colorClass = `border-${(match.court % 4) + 1}`;

            const getTeamName = (namesArr, teamStr) => {
                if (teamStr && typeof teamStr === 'string' && teamStr.length > 0) return teamStr;
                if (Array.isArray(namesArr)) return namesArr.join(' / ');
                return String(namesArr || '');
            };

            const safeTeamA = getTeamName(match.team_a_names, match.teamA) || 'EQUIPO A';
            const safeTeamB = getTeamName(match.team_b_names, match.teamB) || 'EQUIPO B';

            const isPartA = currentUser && (match.team_a_ids?.includes(currentUser.uid) || safeTeamA.toLowerCase().includes((currentUser.name || '').toLowerCase()));
            const isPartB = currentUser && (match.team_b_ids?.includes(currentUser.uid) || safeTeamB.toLowerCase().includes((currentUser.name || '').toLowerCase()));
            const isMyMatch = isPartA || isPartB;
            const isAdmin = ['super_admin', 'superadmin', 'admin', 'admin_player', 'captain', 'capitan', 'capitanes', 'organizador', 'organizadores'].includes((currentUser?.role || '').toLowerCase());

            const isFinished = match.status === 'finished' || match.status === 'finalizado' || match.isFinished === true;
            const isLive = (eventStatus === 'live' || eventStatus === 'adjusting') && !isFinished;

            let statusBadge = '';
            if (isFinished) {
                statusBadge = '<span style="background: #25D366; color: white; padding: 4px 10px; border-radius: 12px; font-weight: 950; font-size: 0.6rem; letter-spacing: 0.5px; text-transform:uppercase;">FINALIZADO</span>';
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
                cardStyle = 'border: 1px solid #e2e8f0; opacity: 0.6; filter: grayscale(100%); z-index: 1;';
                cardBg = '#f8fafc';
            } else if (isMyMatch && isLive) {
                cardStyle = 'border: 3px solid #72a800; box-shadow: 0 15px 45px rgba(114, 168, 0, 0.2); transform: scale(1.03); z-index: 10;';
            }

            const winnerA = isFinished && sA > sB;
            const winnerB = isFinished && sB > sA;


            // Action Area logic
            let actionArea = '';
            const canEdit = (eventStatus === 'live' || eventStatus === 'adjusting') && currentUser;

            if (isFinished && !isAdmin) {
                const userDelta = isPartA ? (match.delta_a || 0) : (match.delta_b || 0);
                actionArea = `
                    <div style="margin-top: 15px; padding: 12px; background: #f1f5f9; border-radius: 16px; border: 1px solid #e2e8f0; text-align: center;">
                        <span style="font-size: 0.75rem; color: #64748b; font-weight: 700;">PARTIDO FINALIZADO</span>
                    </div>
                `;
            } else if (canEdit || isAdmin) {
                actionArea = `
                    <div style="margin-top:20px; padding-top:20px; border-top:1px solid #e2e8f0;">
                        <div style="text-align:center; margin-bottom:15px;">
                            <span style="font-size:0.6rem; font-weight:950; color:#72a800; letter-spacing:2px; text-transform:uppercase;">INTRODUCIR RESULTADO</span>
                        </div>
                        <div style="display:flex; gap:8px; justify-content:space-between; width:100%;">
                            <div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:6px; background:#f8fafc; padding:12px 5px; border-radius:20px; border:1px solid #e2e8f0;">
                                <div style="font-size:0.55rem; color:#64748b; font-weight:900; text-transform:uppercase; letter-spacing:0.5px;">EQ. ARRIBA</div>
                                <div style="display:flex; align-items:center; gap:6px; justify-content:center;">
                                    <button onclick="window.ControlTowerView.adjustScore('${match.id}', 'score_a', -1)" style="width:36px; height:36px; border-radius:50%; border:1px solid #e2e8f0; background:#f1f5f9; color:#0a192f; font-size:1.5rem; cursor:pointer;">-</button>
                                    <span id="score-a-val-${match.id}" style="font-size:1.8rem; font-weight:950; color:#0a192f; min-width:32px; text-align:center;">${sA}</span>
                                    <button onclick="window.ControlTowerView.adjustScore('${match.id}', 'score_a', 1)" style="width:36px; height:36px; border-radius:50%; border:1px solid #e2e8f0; background:#f1f5f9; color:#0a192f; font-size:1.5rem; cursor:pointer;">+</button>
                                </div>
                            </div>
                            <div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:6px; background:#f8fafc; padding:12px 5px; border-radius:20px; border:1px solid #e2e8f0;">
                                <div style="font-size:0.55rem; color:#64748b; font-weight:900; text-transform:uppercase; letter-spacing:0.5px;">EQ. ABAJO</div>
                                <div style="display:flex; align-items:center; gap:6px; justify-content:center;">
                                    <button onclick="window.ControlTowerView.adjustScore('${match.id}', 'score_b', -1)" style="width:36px; height:36px; border-radius:50%; border:1px solid #e2e8f0; background:#f1f5f9; color:#0a192f; font-size:1.5rem; cursor:pointer;">-</button>
                                    <span id="score-b-val-${match.id}" style="font-size:1.8rem; font-weight:950; color:#0a192f; min-width:32px; text-align:center;">${sB}</span>
                                    <button onclick="window.ControlTowerView.adjustScore('${match.id}', 'score_b', 1)" style="width:36px; height:36px; border-radius:50%; border:1px solid #e2e8f0; background:#f1f5f9; color:#0a192f; font-size:1.5rem; cursor:pointer;">+</button>
                                </div>
                            </div>
                        </div>
                        ${isEntreno ? `
                        <div id="tie-warning-${match.id}" style="display:${sA === sB && (sA > 0 || sB > 0) ? 'flex' : 'none'}; align-items:center; gap:8px; margin-top:14px; padding:10px 14px; background:rgba(255,160,0,0.12); border:1px solid rgba(255,160,0,0.4); border-radius:14px;">
                            <span style="font-size:1.1rem;">⚠️</span>
                            <span style="font-size:0.7rem; color:#FFA000; font-weight:800;">EMPATE NO VÁLIDO</span>
                        </div>` : ''}
                        <button onclick="window.ControlTowerView.finishMatch('${match.id}')"
                                id="finish-btn-${match.id}"
                                style="width:100%; margin-top:20px; padding:18px; background:${isEntreno && sA === sB ? 'rgba(255,160,0,0.2)' : 'var(--brand-neon)'}; color:${isEntreno && sA === sB ? '#FFA000' : 'black'}; font-weight:950; border-radius:20px; cursor:pointer;">
                            ${isEntreno && sA === sB ? 'EMPATE — CORRIGE' : 'FINALIZAR PARTIDO'}
                        </button>
                    </div>
                `;
            } else {
                actionArea = `
                    <div style="margin-top:15px; padding:12px; background:rgba(255,255,255,0.02); border:1px dashed rgba(255,255,255,0.1); border-radius:12px; text-align:center;">
                        <span style="font-size:0.7rem; color:#666; font-weight:700;">MODO ESPECTADOR</span>
                    </div>
                `;
            }

            const isEnJuego = match.status === 'live' || match.status === 'en juego';
            const liveClass = isEnJuego ? 'live-pulse-card' : '';
            const cardGlow = (isEnJuego && !isMyMatch) ? 'border: 1px solid rgba(204, 255, 0, 0.3);' : (isMyMatch && isLive ? '' : 'border: 1px solid rgba(255,255,255,0.08);');

            return `
                <div class="match-card animate-pop-in ${isLive ? 'live-shadow' : ''}" id="card-${match.id}" 
                     style="background: ${cardBg}; border-radius: 24px; overflow: hidden; margin-bottom: 20px; position: relative; ${cardStyle}; box-shadow: 0 10px 30px rgba(0,0,0,0.04);">
                    <div style="padding: 14px 24px; background: #f8fafc; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0;">
                        <span style="font-size: 0.65rem; font-weight: 950; color: #64748b; letter-spacing: 1.5px; text-transform: uppercase;">
                            PISTA ${match.court} • R${match.round} • ${timeLabel}
                        </span>
                        <div class="status-area">${statusBadge}</div>
                    </div>
                    <div style="padding: 24px 20px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                            <div style="flex: 1; display: flex; flex-direction: column; gap: 6px;">
                                <div style="font-size: 1.15rem; color: #0a192f; font-weight: 950; text-transform: uppercase; letter-spacing: -0.5px;">
                                    ${winnerA ? `<i class="fas fa-trophy" style="color: #72a800; margin-right: 8px;"></i>` : ''}
                                    <span style="${winnerA ? 'border-bottom: 3px solid #72a800;' : ''}">${safeTeamA}</span>
                                </div>
                                ${isPartA ? '<span style="color: #72a800; font-size: 0.65rem; font-weight: 950; letter-spacing: 1px;">TU EQUIPO ★</span>' : ''}
                            </div>
                            <div id="match-score-a-${match.id}" 
                                 onclick="${isAdmin || canEdit ? `window.ControlTowerView.manualScoreEdit('${match.id}', 'score_a')` : ''}">
                                 ${window.MatchCard.renderOdometer(sA, winnerA, match.id, 'a')}
                            </div>
                        </div>
                        
                        <div style="height: 1px; background: #e2e8f0; margin: 20px 0; position: relative;">
                            <div style="position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: #f8fafc; padding: 2px 10px; border-radius: 8px; font-size: 0.55rem; color: #cbd5e1; font-weight: 950;">VS</div>
                        </div>

                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div style="flex: 1; display: flex; flex-direction: column; gap: 6px;">
                                <div style="font-size: 1.15rem; color: #0a192f; font-weight: 950; text-transform: uppercase; letter-spacing: -0.5px;">
                                    ${winnerB ? `<i class="fas fa-trophy" style="color: #72a800; margin-right: 8px;"></i>` : ''}
                                    <span style="${winnerB ? 'border-bottom: 3px solid #72a800;' : ''}">${safeTeamB}</span>
                                </div>
                                ${isPartB ? '<span style="color: #72a800; font-size: 0.65rem; font-weight: 950; letter-spacing: 1px;">TU EQUIPO ★</span>' : ''}
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
