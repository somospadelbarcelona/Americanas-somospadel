/**
 * EventModals.js
 * Extracted UI logic for tournament and training completion modals.
 * SomosPadel BCN - Dark Tech Athletic Edition
 */
(function () {
    // Utility helpers for player styling and initials
    const getInitials = (name) => {
        if (!name || typeof name !== 'string') return 'SP';
        const parts = name.trim().split(/\s+/).filter(Boolean);
        if (parts.length >= 2 && parts[0] && parts[1] && parts[0][0] && parts[1][0]) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        const clean = name.trim();
        if (clean.length >= 2) return clean.substring(0, 2).toUpperCase();
        if (clean.length === 1) return clean.toUpperCase();
        return 'SP';
    };

    const getLevelColor = (lv) => {
        const num = parseFloat(lv) || 0;
        if (num >= 5.0) return '#ef4444';
        if (num >= 4.0) return '#f59e0b';
        if (num >= 3.0) return '#0ea5e9';
        return '#10b981';
    };

    const resolvePlayerLevel = (p, playersList = []) => {
        if (p.level) return p.level;
        const normalizedName = (p.name || '').trim().toUpperCase();
        const found = playersList.find(item => {
            const itemName = (item.name || '').trim().toUpperCase();
            const itemId = item.id || item.uid;
            return (itemId && (itemId === p.uid || itemId === p.id)) || (itemName && itemName === normalizedName);
        });
        return found?.level || found?.nivel || '3.5';
    };

    const sanitizeTeamNames = (raw, fallback) => {
        let list = [];
        if (Array.isArray(raw)) {
            list = raw;
        } else if (typeof raw === 'string' && raw.trim()) {
            const trimmed = raw.trim();
            if (trimmed.includes(' / ')) list = trimmed.split(' / ');
            else if (trimmed.includes(' & ')) list = trimmed.split(' & ');
            else if (trimmed.includes(' y ')) list = trimmed.split(' y ');
            else if (trimmed.includes(' - ')) list = trimmed.split(' - ');
            else list = [trimmed];
        } else if (Array.isArray(fallback)) {
            list = fallback;
        } else if (typeof fallback === 'string' && fallback.trim()) {
            const trimmed = fallback.trim();
            if (trimmed.includes(' / ')) list = trimmed.split(' / ');
            else if (trimmed.includes(' & ')) list = trimmed.split(' & ');
            else list = [fallback];
        }

        return list
            .map(n => (typeof n === 'string' ? n.trim() : (n?.name || '').trim()))
            .filter(n => n && n !== '---' && n !== '-' && n.toUpperCase() !== 'POR DEFINIR' && n.toUpperCase() !== 'DESCONOCIDO');
    };

    const renderDoubleAvatar = (names, ringColor, medalIcon, medalBg, medalBorder) => {
        const p1 = names[0] || 'J1';
        const p2 = names[1] || 'J2';
        const init1 = getInitials(p1);
        const init2 = names.length > 1 ? getInitials(p2) : null;

        if (!init2) {
            return `
                <div style="position: relative; flex-shrink: 0;">
                    <div style="
                        width: 44px; height: 44px; border-radius: 50%;
                        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                        border: 2px solid ${ringColor};
                        display: flex; align-items: center; justify-content: center;
                        font-weight: 900; font-size: 0.95rem; color: #ffffff;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                    ">${init1}</div>
                    <span style="
                        position: absolute; bottom: -4px; right: -4px;
                        width: 20px; height: 20px; border-radius: 50%;
                        background: ${medalBg}; border: 1px solid ${medalBorder};
                        display: flex; align-items: center; justify-content: center;
                        font-size: 0.72rem; line-height: 1;
                    ">${medalIcon}</span>
                </div>
            `;
        }

        return `
            <div style="position: relative; flex-shrink: 0; width: 62px; height: 44px; display: flex; align-items: center;">
                <div style="
                    width: 38px; height: 38px; border-radius: 50%;
                    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                    border: 2px solid ${ringColor};
                    display: flex; align-items: center; justify-content: center;
                    font-weight: 900; font-size: 0.8rem; color: #ffffff;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.45); z-index: 2; position: relative;
                " title="${p1}">
                    ${init1}
                </div>
                <div style="
                    width: 38px; height: 38px; border-radius: 50%;
                    background: linear-gradient(135deg, #334155 0%, #1e293b 100%);
                    border: 2px solid ${ringColor};
                    display: flex; align-items: center; justify-content: center;
                    font-weight: 900; font-size: 0.8rem; color: #ffffff;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.45);
                    margin-left: -14px; z-index: 1; position: relative;
                " title="${p2}">
                    ${init2}
                </div>
                <span style="
                    position: absolute; bottom: -2px; right: 0;
                    width: 20px; height: 20px; border-radius: 50%;
                    background: ${medalBg}; border: 1px solid ${medalBorder};
                    display: flex; align-items: center; justify-content: center;
                    font-size: 0.72rem; line-height: 1; z-index: 3;
                ">${medalIcon}</span>
            </div>
        `;
    };

    const renderPairNamesWithBadges = (names, allPlayers, nameColor) => {
        if (!names || names.length === 0) return `<span style="color:#94a3b8; font-style:italic;">Equipo Pista 1</span>`;
        return names.map(name => {
            const lvl = resolvePlayerLevel({ name }, allPlayers);
            const lvlColor = getLevelColor(lvl);
            return `
                <span style="display: inline-flex; align-items: center; gap: 4px; font-weight: 900; font-size: 0.92rem; color: ${nameColor}; text-transform: uppercase; letter-spacing: 0.3px;">
                    <span>${name}</span>
                    <span style="font-size: 0.58rem; font-weight: 800; padding: 1px 5px; border-radius: 4px; background: ${lvlColor}; color: #ffffff; letter-spacing: 0;">Nv ${lvl}</span>
                </span>
            `;
        }).join(`<span style="color: rgba(255,255,255,0.25); font-size: 0.75rem; font-weight: 700; margin: 0 2px;">/</span>`);
    };

    window.EventModals = {
        /**
         * Shows a modern modal when all matches in a round are finished.
         */
        showRoundFinishedModal(round, americanaDoc, onNextRound, onEdit) {
            if (document.getElementById('round-finished-modal')) return;

            const modal = document.createElement('div');
            modal.id = 'round-finished-modal';
            modal.style.cssText = `
                position: fixed; inset: 0; width: 100%; height: 100%;
                background: rgba(7, 10, 19, 0.88); z-index: 13000;
                display: flex; align-items: center; justify-content: center;
                backdrop-filter: blur(10px); animation: spModalFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                padding: 16px; box-sizing: border-box;
            `;

            modal.innerHTML = `
                <style>
                    @keyframes spModalFadeIn {
                        from { opacity: 0; transform: scale(0.96); }
                        to { opacity: 1; transform: scale(1); }
                    }
                    @keyframes spGlowPulse {
                        0%, 100% { box-shadow: 0 0 25px rgba(204, 255, 0, 0.25); }
                        50% { box-shadow: 0 0 45px rgba(204, 255, 0, 0.45); }
                    }
                    .sp-round-btn-next:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 8px 24px rgba(204, 255, 0, 0.45);
                    }
                    .sp-round-btn-edit:hover {
                        background: rgba(255, 255, 255, 0.08) !important;
                        border-color: rgba(255, 255, 255, 0.3) !important;
                        color: #ffffff !important;
                    }
                    .sp-modal-close-btn:hover {
                        background: rgba(255, 255, 255, 0.2) !important;
                        color: #ffffff !important;
                        transform: rotate(90deg) scale(1.08);
                    }
                </style>
                <div style="background: linear-gradient(145deg, #0f172a 0%, #070a13 100%); width: 100%; max-width: 420px; padding: 32px 26px; border-radius: 26px; border: 1px solid rgba(204, 255, 0, 0.35); text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.6), 0 0 35px rgba(204,255,0,0.2); position: relative; font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;">
                    
                    <!-- Close button -->
                    <button id="btn-close-round-modal" class="sp-modal-close-btn" style="position: absolute; top: 16px; right: 16px; width: 34px; height: 34px; border-radius: 50%; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); color: #94a3b8; display: flex; align-items: center; justify-content: center; font-size: 1rem; cursor: pointer; transition: all 0.2s ease; z-index: 2;">
                        <i class="fas fa-times"></i>
                    </button>

                    <!-- Top Pill -->
                    <div style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 999px; background: rgba(204, 255, 0, 0.12); border: 1px solid rgba(204, 255, 0, 0.3); color: #CCFF00; font-size: 0.68rem; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 20px;">
                        <span style="width: 6px; height: 6px; border-radius: 50%; background: #CCFF00; box-shadow: 0 0 8px #CCFF00;"></span>
                        SOMOSPADEL BCN
                    </div>

                    <!-- Icon -->
                    <div style="width: 70px; height: 70px; background: linear-gradient(135deg, #CCFF00 0%, #a3e635 100%); border-radius: 20px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; box-shadow: 0 10px 25px rgba(204,255,0,0.35); animation: spGlowPulse 2.5s infinite ease-in-out;">
                        <i class="fas fa-flag-checkered" style="font-size: 2rem; color: #000;"></i>
                    </div>

                    <!-- Title & description -->
                    <h2 style="color: #ffffff; font-weight: 900; font-size: 1.55rem; margin: 0 0 8px 0; letter-spacing: 0.5px; text-transform: uppercase;">
                        RONDA ${round} FINALIZADA
                    </h2>
                    <p style="color: #94a3b8; font-size: 0.88rem; margin: 0 0 26px 0; line-height: 1.45; font-weight: 500;">
                        Todos los marcadores de la ronda han sido validados. ¿Deseas avanzar a los siguientes cruces?
                    </p>
                    
                    <!-- Action buttons -->
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <button id="btn-next-round" class="sp-round-btn-next" style="background: linear-gradient(135deg, #CCFF00 0%, #b8f000 100%); color: #000000; border: none; padding: 16px; border-radius: 16px; font-weight: 950; font-size: 0.98rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; box-shadow: 0 6px 20px rgba(204,255,0,0.35); transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); text-transform: uppercase; letter-spacing: 0.5px;">
                            <span>🚀 SÍ, SIGUIENTE RONDA</span>
                        </button>
                        <button id="btn-edit-round" class="sp-round-btn-edit" style="background: rgba(255, 255, 255, 0.04); color: #cbd5e1; border: 1px solid rgba(255, 255, 255, 0.12); padding: 14px; border-radius: 16px; font-weight: 800; font-size: 0.85rem; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: center; gap: 8px;">
                            <i class="fas fa-edit"></i> NO, QUIERO EDITAR MARCADORES
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            const closeModal = () => {
                const el = document.getElementById('round-finished-modal');
                if (el) el.remove();
            };

            document.getElementById('btn-close-round-modal').onclick = closeModal;

            document.getElementById('btn-next-round').onclick = async () => {
                const btn = document.getElementById('btn-next-round');
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> GENERANDO SIGUIENTE RONDA...';
                btn.style.opacity = '0.85';
                btn.style.pointerEvents = 'none';
                if (onNextRound) await onNextRound();
            };

            document.getElementById('btn-edit-round').onclick = () => {
                if (onEdit) onEdit();
                closeModal();
            };
        },

        closeRoundFinishedModal() {
            const el = document.getElementById('round-finished-modal');
            if (el) el.remove();
        },

        /**
         * Shows the final podium modal for a finished training session.
         * Upgraded with Dark Tech Athletic Design & Full Tie-break Transparency.
         */
        showTrainingFinishedModal(finalRound, matches, americanaDoc, onShare, onTabChange, onMenu) {
            if (document.getElementById('training-finished-modal')) return;

            const isFixedPairs = (americanaDoc?.pair_mode || '').toLowerCase().includes('fix')
                || (americanaDoc?.name || '').toUpperCase().includes('FIJA');

            const allPlayers = americanaDoc?.players || [];
            const safeMatches = Array.isArray(matches) ? matches : [];

            let rankingItems = (window.StandingsService && safeMatches.length > 0)
                ? window.StandingsService.calculate(safeMatches, 'entreno', isFixedPairs, allPlayers)
                : [];

            // 1. Identify final round & Court 1 Match for Pair Winners & Finalists
            const maxRound = finalRound || (safeMatches.length > 0 ? Math.max(...safeMatches.map(m => parseInt(m.round || 1))) : 1);
            const finalCourt1Match = safeMatches.find(m => parseInt(m.round) === parseInt(maxRound) && parseInt(m.court) === 1);

            let winningPair = null;
            let finalistPair = null;

            if (finalCourt1Match) {
                const teamANames = sanitizeTeamNames(finalCourt1Match.team_a_names, finalCourt1Match.teamA);
                const teamBNames = sanitizeTeamNames(finalCourt1Match.team_b_names, finalCourt1Match.teamB);

                const scoreA = (finalCourt1Match.score_a !== undefined && finalCourt1Match.score_a !== null && finalCourt1Match.score_a !== '')
                    ? parseInt(finalCourt1Match.score_a) : null;
                const scoreB = (finalCourt1Match.score_b !== undefined && finalCourt1Match.score_b !== null && finalCourt1Match.score_b !== '')
                    ? parseInt(finalCourt1Match.score_b) : null;

                const hasScores = (scoreA !== null && scoreB !== null && !isNaN(scoreA) && !isNaN(scoreB));
                const isWinnerA = finalCourt1Match.winner === 'A' || finalCourt1Match.winner === 'team_a';
                const isWinnerB = finalCourt1Match.winner === 'B' || finalCourt1Match.winner === 'team_b';

                if (hasScores && (scoreA > scoreB || (scoreA === scoreB && isWinnerA))) {
                    winningPair = { names: teamANames, score: scoreA, rivalScore: scoreB };
                    finalistPair = { names: teamBNames, score: scoreB, rivalScore: scoreA };
                } else if (hasScores && (scoreB > scoreA || (scoreA === scoreB && isWinnerB))) {
                    winningPair = { names: teamBNames, score: scoreB, rivalScore: scoreA };
                    finalistPair = { names: teamANames, score: scoreA, rivalScore: scoreB };
                } else if (isWinnerA) {
                    winningPair = { names: teamANames, score: scoreA, rivalScore: scoreB };
                    finalistPair = { names: teamBNames, score: scoreB, rivalScore: scoreA };
                } else if (isWinnerB) {
                    winningPair = { names: teamBNames, score: scoreB, rivalScore: scoreA };
                    finalistPair = { names: teamANames, score: scoreA, rivalScore: scoreB };
                } else if (hasScores && (scoreA > 0 || scoreB > 0)) {
                    // Empate con juegos disputados y sin desempate explícito
                    winningPair = { names: teamANames, score: scoreA, rivalScore: scoreB };
                    finalistPair = { names: teamBNames, score: scoreB, rivalScore: scoreA };
                }
            }

            // Fallback if not found directly in finalCourt1Match or names empty
            if (!winningPair || !winningPair.names || winningPair.names.length === 0) {
                const winningPlayers = rankingItems.filter(p => p.wonLastMatchCourt1);
                if (winningPlayers.length > 0) {
                    winningPair = {
                        names: winningPlayers.map(p => p.name).filter(Boolean),
                        score: null,
                        rivalScore: null
                    };
                }
            }
            if (!finalistPair || !finalistPair.names || finalistPair.names.length === 0) {
                const finalistPlayers = rankingItems.filter(p => p.lastMatchCourt === 1 && !p.wonLastMatchCourt1);
                if (finalistPlayers.length > 0) {
                    finalistPair = {
                        names: finalistPlayers.map(p => p.name).filter(Boolean),
                        score: null,
                        rivalScore: null
                    };
                }
            }

            const pairResults = {
                winningPair,
                finalistPair,
                finalRound: maxRound,
                scoreText: (winningPair && winningPair.score !== null && winningPair.rivalScore !== null)
                    ? `${winningPair.score} - ${winningPair.rivalScore}`
                    : null
            };

            // Pair Highlight Cards HTML
            let finalPairsSectionHTML = '';

            if (winningPair && winningPair.names && winningPair.names.length > 0) {
                const doubleAvatarWinner = renderDoubleAvatar(
                    winningPair.names,
                    '#CCFF00',
                    '👑',
                    'rgba(204, 255, 0, 0.25)',
                    'rgba(204, 255, 0, 0.6)'
                );

                const winnerScoreBadge = (winningPair.score !== null && winningPair.rivalScore !== null)
                    ? `<span style="
                        display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px;
                        border-radius: 6px; background: rgba(204, 255, 0, 0.16); color: #CCFF00;
                        border: 1px solid rgba(204, 255, 0, 0.4); font-size: 0.68rem; font-weight: 950;
                    ">
                        ${winningPair.score} - ${winningPair.rivalScore}
                    </span>`
                    : '';

                const winnerScoreText = (winningPair.score !== null && winningPair.rivalScore !== null)
                    ? `Victoria ${winningPair.score} - ${winningPair.rivalScore} en Pista 1`
                    : `Campeones de Pista 1 • Ronda Final`;

                const winningCardHTML = `
                    <div class="sp-final-pair-card" style="
                        padding: 13px 15px; border-radius: 18px; margin-bottom: 9px;
                        background: linear-gradient(135deg, rgba(204, 255, 0, 0.13) 0%, rgba(15, 23, 42, 0.8) 100%);
                        border: 1px solid rgba(204, 255, 0, 0.5);
                        box-shadow: 0 0 20px rgba(204, 255, 0, 0.2);
                        backdrop-filter: blur(8px);
                        animation: spSlideInRow 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
                    ">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="
                                display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px;
                                border-radius: 6px; background: #CCFF00; color: #000000;
                                font-size: 0.62rem; font-weight: 950; letter-spacing: 0.8px; text-transform: uppercase;
                            ">
                                👑 PAREJA GANADORA • PISTA 1
                            </span>
                            ${winnerScoreBadge}
                        </div>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            ${doubleAvatarWinner}
                            <div style="flex: 1; min-width: 0;">
                                <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 4px 6px;">
                                    ${renderPairNamesWithBadges(winningPair.names, allPlayers, '#ffffff')}
                                </div>
                                <div style="font-size: 0.68rem; color: #CCFF00; font-weight: 700; margin-top: 4px; display: flex; align-items: center; gap: 5px;">
                                    <i class="fas fa-trophy" style="font-size: 0.7rem;"></i>
                                    <span>${winnerScoreText}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                let finalistCardHTML = '';
                if (finalistPair && finalistPair.names && finalistPair.names.length > 0) {
                    const doubleAvatarFinalist = renderDoubleAvatar(
                        finalistPair.names,
                        '#94a3b8',
                        '🥈',
                        'rgba(148, 163, 184, 0.2)',
                        'rgba(148, 163, 184, 0.5)'
                    );

                    const finalistScoreBadge = (finalistPair.score !== null && finalistPair.rivalScore !== null)
                        ? `<span style="
                            display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px;
                            border-radius: 6px; background: rgba(148, 163, 184, 0.14); color: #cbd5e1;
                            border: 1px solid rgba(148, 163, 184, 0.3); font-size: 0.68rem; font-weight: 900;
                        ">
                            ${finalistPair.score} - ${finalistPair.rivalScore}
                        </span>`
                        : '';

                    finalistCardHTML = `
                        <div class="sp-final-pair-card" style="
                            padding: 12px 15px; border-radius: 18px; margin-bottom: 12px;
                            background: linear-gradient(135deg, rgba(148, 163, 184, 0.08) 0%, rgba(15, 23, 42, 0.75) 100%);
                            border: 1px solid rgba(148, 163, 184, 0.35);
                            backdrop-filter: blur(8px);
                            animation: spSlideInRow 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.08s both;
                        ">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                <span style="
                                    display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px;
                                    border-radius: 6px; background: #94a3b8; color: #0f172a;
                                    font-size: 0.62rem; font-weight: 950; letter-spacing: 0.8px; text-transform: uppercase;
                                ">
                                    🥈 PAREJA FINALISTA • PISTA 1
                                </span>
                                ${finalistScoreBadge}
                            </div>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                ${doubleAvatarFinalist}
                                <div style="flex: 1; min-width: 0;">
                                    <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 4px 6px;">
                                        ${renderPairNamesWithBadges(finalistPair.names, allPlayers, '#e2e8f0')}
                                    </div>
                                    <div style="font-size: 0.68rem; color: #94a3b8; font-weight: 600; margin-top: 4px; display: flex; align-items: center; gap: 5px;">
                                        <i class="fas fa-medal" style="font-size: 0.7rem; color: #94a3b8;"></i>
                                        <span>Subcampeones de Pista 1 en la Gran Final</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }

                finalPairsSectionHTML = `
                    <div style="margin-bottom: 4px;">
                        <div style="
                            display: flex; justify-content: space-between; align-items: center;
                            margin-bottom: 10px; padding: 0 4px;
                        ">
                            <div style="font-size: 0.68rem; color: #CCFF00; font-weight: 900; letter-spacing: 1.8px; text-transform: uppercase; display: flex; align-items: center; gap: 6px;">
                                <span>👑 GRAN FINAL • PISTA 1</span>
                                <span style="font-size: 0.58rem; background: rgba(204,255,0,0.15); color: #CCFF00; padding: 1px 6px; border-radius: 4px; border: 1px solid rgba(204,255,0,0.3);">RONDA ${maxRound}</span>
                            </div>
                            <div style="font-size: 0.62rem; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                                PAREJAS DESTACADAS
                            </div>
                        </div>
                        ${winningCardHTML}
                        ${finalistCardHTML}
                    </div>
                `;
            }

            const podiumTierStyles = [
                {
                    rankBadge: '1º PUESTO',
                    badgeBg: '#CCFF00',
                    badgeText: '#000000',
                    cardBg: 'linear-gradient(135deg, rgba(204, 255, 0, 0.12) 0%, rgba(15, 23, 42, 0.6) 100%)',
                    border: 'rgba(204, 255, 0, 0.5)',
                    nameColor: '#ffffff',
                    accentGlow: '0 0 20px rgba(204, 255, 0, 0.25)',
                    ringColor: '#CCFF00',
                    ptsColor: '#CCFF00',
                    medalIcon: '🥇',
                    medalBg: 'rgba(204, 255, 0, 0.2)'
                },
                {
                    rankBadge: '2º PUESTO',
                    badgeBg: '#94a3b8',
                    badgeText: '#0f172a',
                    cardBg: 'linear-gradient(135deg, rgba(148, 163, 184, 0.09) 0%, rgba(15, 23, 42, 0.6) 100%)',
                    border: 'rgba(148, 163, 184, 0.35)',
                    nameColor: '#ffffff',
                    accentGlow: 'none',
                    ringColor: '#94a3b8',
                    ptsColor: '#e2e8f0',
                    medalIcon: '🥈',
                    medalBg: 'rgba(148, 163, 184, 0.15)'
                },
                {
                    rankBadge: '3º PUESTO',
                    badgeBg: '#d97706',
                    badgeText: '#ffffff',
                    cardBg: 'linear-gradient(135deg, rgba(217, 119, 6, 0.09) 0%, rgba(15, 23, 42, 0.6) 100%)',
                    border: 'rgba(217, 119, 6, 0.35)',
                    nameColor: '#ffffff',
                    accentGlow: 'none',
                    ringColor: '#d97706',
                    ptsColor: '#f59e0b',
                    medalIcon: '🥉',
                    medalBg: 'rgba(217, 119, 6, 0.15)'
                }
            ];

            const podiumHTML = rankingItems.slice(0, 3).map((p, i) => {
                const tier = podiumTierStyles[i];
                const playerLevel = resolvePlayerLevel(p, allPlayers);
                const levelColor = getLevelColor(playerLevel);

                const diff = (p.diff !== undefined) ? p.diff : ((p.points || 0) - (p.gamesLost || 0));
                const diffStr = diff > 0 ? `+${diff}` : `${diff}`;
                const diffColor = diff > 0 ? '#10b981' : (diff < 0 ? '#ef4444' : '#94a3b8');

                const initials = getInitials(p.name);

                // Court badge logic
                const lastCourt = p.lastMatchCourt;
                let courtBadgeHTML = '';
                if (lastCourt && lastCourt < 90) {
                    if (lastCourt === 1) {
                        courtBadgeHTML = `
                            <span style="display:inline-flex; align-items:center; gap:4px; padding:2px 7px; border-radius:6px; background:rgba(204,255,0,0.18); color:#CCFF00; border:1px solid rgba(204,255,0,0.5); font-size:0.62rem; font-weight:900; letter-spacing:0.5px;">
                                👑 PISTA 1
                            </span>`;
                    } else {
                        courtBadgeHTML = `
                            <span style="display:inline-flex; align-items:center; gap:3px; padding:2px 7px; border-radius:6px; background:rgba(255,255,255,0.06); color:#cbd5e1; border:1px solid rgba(255,255,255,0.12); font-size:0.62rem; font-weight:800;">
                                PISTA ${lastCourt}
                            </span>`;
                    }
                }

                // Primary Points/Wins
                const ptsValue = isFixedPairs ? (p.won || 0) : (p.points || 0);
                const ptsLabel = isFixedPairs ? 'VICTORIAS' : 'PTS';

                return `
                    <div class="sp-podium-card" style="
                        display: flex; align-items: center; gap: 12px; padding: 13px 16px;
                        border-radius: 18px; background: ${tier.cardBg}; border: 1px solid ${tier.border};
                        margin-bottom: 9px; box-shadow: ${tier.accentGlow}; position: relative;
                        animation: spSlideInRow 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${(i + 1) * 0.1}s both;
                        backdrop-filter: blur(8px);
                    ">
                        <!-- Left Medal & Avatar -->
                        <div style="position: relative; flex-shrink: 0;">
                            <div style="
                                width: 44px; height: 44px; border-radius: 50%;
                                background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                                border: 2px solid ${tier.ringColor};
                                display: flex; align-items: center; justify-content: center;
                                font-weight: 900; font-size: 0.95rem; color: #ffffff;
                                box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                            ">
                                ${initials}
                            </div>
                            <span style="
                                position: absolute; bottom: -4px; right: -4px;
                                width: 20px; height: 20px; border-radius: 50%;
                                background: ${tier.medalBg}; border: 1px solid ${tier.border};
                                display: flex; align-items: center; justify-content: center;
                                font-size: 0.72rem; line-height: 1;
                            ">${tier.medalIcon}</span>
                        </div>

                        <!-- Player Info & Badges -->
                        <div style="flex: 1; min-width: 0;">
                            <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 2px;">
                                <span style="
                                    font-size: 0.58rem; font-weight: 900; padding: 1px 6px;
                                    border-radius: 4px; background: ${tier.badgeBg}; color: ${tier.badgeText};
                                    letter-spacing: 0.5px;
                                ">${tier.rankBadge}</span>
                                
                                <span style="
                                    font-size: 0.58rem; font-weight: 900; padding: 1px 6px;
                                    border-radius: 4px; background: ${levelColor}; color: #ffffff;
                                ">Nv ${playerLevel}</span>

                                ${courtBadgeHTML}
                            </div>

                            <div style="
                                font-weight: 900; font-size: 0.94rem; color: ${tier.nameColor};
                                text-transform: uppercase; white-space: nowrap; overflow: hidden;
                                text-overflow: ellipsis; letter-spacing: 0.3px;
                            ">
                                ${p.name || 'Jugador'}
                            </div>

                            <div style="display: flex; align-items: center; gap: 8px; font-size: 0.7rem; color: #94a3b8; font-weight: 600; margin-top: 2px;">
                                <span style="color: #CCFF00; font-weight: 800;">${p.won || 0}V</span>
                                <span>·</span>
                                <span>${p.played || 0}PJ</span>
                                <span>·</span>
                                <span>Dif: <strong style="color: ${diffColor};">${diffStr}</strong></span>
                            </div>
                        </div>

                        <!-- Right Metric Score -->
                        <div style="text-align: right; flex-shrink: 0; padding-left: 4px;">
                            <div style="
                                font-size: 1.35rem; font-weight: 950; color: ${tier.ptsColor};
                                font-family: 'Outfit', sans-serif; line-height: 1;
                            ">
                                ${ptsValue}
                            </div>
                            <div style="font-size: 0.55rem; color: #64748b; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; margin-top: 3px;">
                                ${ptsLabel}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            const individualPodiumHeaderHTML = `
                <div style="
                    display: flex; justify-content: space-between; align-items: center;
                    margin-bottom: 11px; padding: ${finalPairsSectionHTML ? '10px 4px 0' : '0 4px'};
                    ${finalPairsSectionHTML ? 'border-top: 1px solid rgba(255, 255, 255, 0.08);' : ''}
                ">
                    <div style="font-size: 0.68rem; color: #CCFF00; font-weight: 900; letter-spacing: 1.8px; text-transform: uppercase; display: flex; align-items: center; gap: 6px;">
                        <span>🏆 PODIO INDIVIDUAL</span>
                    </div>
                    <div style="font-size: 0.62rem; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                        TOP 3 DE LA JORNADA
                    </div>
                </div>
            `;

            const overlay = document.createElement('div');
            overlay.id = 'training-finished-modal';
            overlay.style.cssText = `
                position: fixed; inset: 0; z-index: 14000;
                display: flex; align-items: center; justify-content: center;
                background: rgba(7, 10, 19, 0.88); backdrop-filter: blur(12px);
                animation: spModalFadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1); padding: 12px;
                box-sizing: border-box; overflow-y: auto;
            `;

            overlay.innerHTML = `
                <style>
                    @keyframes spModalFadeIn {
                        from { opacity: 0; transform: scale(0.96) translateY(10px); }
                        to { opacity: 1; transform: scale(1) translateY(0); }
                    }
                    @keyframes spFloatTrophy {
                        0%, 100% { transform: translateY(0) rotate(0deg); }
                        50% { transform: translateY(-6px) rotate(2deg); }
                    }
                    @keyframes spSlideInRow {
                        from { opacity: 0; transform: translateY(12px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes spParticleDrift {
                        0% { transform: translateY(-20px) rotate(0deg); opacity: 0; }
                        20% { opacity: 0.9; }
                        100% { transform: translateY(160px) rotate(360deg); opacity: 0; }
                    }
                    .sp-particle {
                        position: absolute; border-radius: 50%; pointer-events: none;
                        animation: spParticleDrift linear infinite;
                    }
                    .sp-tf-btn-main:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 10px 28px rgba(204, 255, 0, 0.45);
                    }
                    .sp-tf-btn-main:active {
                        transform: scale(0.98);
                    }
                    .sp-tf-tab-btn {
                        background: rgba(255, 255, 255, 0.04);
                        color: #cbd5e1;
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        padding: 10px 4px;
                        border-radius: 12px;
                        font-weight: 800;
                        font-size: 0.68rem;
                        cursor: pointer;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 4px;
                        transition: all 0.2s ease;
                        letter-spacing: 0.5px;
                    }
                    .sp-tf-tab-btn:hover {
                        background: rgba(204, 255, 0, 0.1);
                        border-color: rgba(204, 255, 0, 0.4);
                        color: #ffffff;
                        transform: translateY(-1px);
                    }
                    .sp-tf-tab-btn i {
                        font-size: 1rem;
                        color: #CCFF00;
                    }
                    .sp-tf-menu-btn:hover {
                        background: rgba(255, 255, 255, 0.08) !important;
                        border-color: rgba(255, 255, 255, 0.25) !important;
                        color: #ffffff !important;
                    }
                    .sp-close-icon-btn:hover {
                        background: rgba(255, 255, 255, 0.2) !important;
                        color: #ffffff !important;
                        transform: rotate(90deg) scale(1.08);
                    }
                </style>

                <!-- Floating Neon Particles -->
                ${[...Array(10)].map((_, i) => {
                    const colors = ['#CCFF00', '#38bdf8', '#fbbf24', '#34d399', '#f43f5e'];
                    const left = 5 + (i * 9.5);
                    const delay = (i * 0.4) % 3;
                    const dur = 2.4 + (i % 3) * 0.7;
                    const size = 4 + (i % 4) * 2;
                    return `<div class="sp-particle" style="width:${size}px; height:${size}px; background:${colors[i % colors.length]}; left:${left}%; top:-10px; animation-duration:${dur}s; animation-delay:${delay}s; box-shadow: 0 0 8px ${colors[i % colors.length]};"></div>`;
                }).join('')}

                <!-- Modal Container Card -->
                <div style="
                    background: linear-gradient(155deg, #0f172a 0%, #080d19 100%);
                    width: 100%; max-width: 440px; border-radius: 26px;
                    border: 1px solid rgba(204, 255, 0, 0.35);
                    box-shadow: 0 25px 60px rgba(0,0,0,0.7), 0 0 35px rgba(204, 255, 0, 0.15);
                    overflow: hidden; position: relative; font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
                    max-height: calc(100vh - 28px); display: flex; flex-direction: column;
                ">
                    <!-- Close button in top right -->
                    <button id="btn-close-training-modal" class="sp-close-icon-btn" style="
                        position: absolute; top: 16px; right: 16px; width: 34px; height: 34px;
                        border-radius: 50%; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
                        color: #94a3b8; display: flex; align-items: center; justify-content: center;
                        font-size: 1rem; cursor: pointer; transition: all 0.2s ease; z-index: 20;
                    ">
                        <i class="fas fa-times"></i>
                    </button>

                    <!-- Scrollable Content Body -->
                    <div style="overflow-y: auto; -webkit-overflow-scrolling: touch; flex: 1; min-height: 0;">
                        <!-- Olympic Header with Dark Tech Atmosphere -->
                        <div style="
                            padding: 26px 20px 18px; text-align: center;
                            background: radial-gradient(circle at 50% 10%, rgba(204, 255, 0, 0.15) 0%, rgba(15, 23, 42, 0) 75%);
                            border-bottom: 1px solid rgba(255, 255, 255, 0.07);
                            position: relative;
                        ">
                            <!-- SomosPadel Session Badge -->
                            <div style="
                                display: inline-flex; align-items: center; gap: 7px; padding: 4px 12px;
                                border-radius: 999px; background: rgba(204, 255, 0, 0.12);
                                border: 1px solid rgba(204, 255, 0, 0.3); color: #CCFF00;
                                font-size: 0.65rem; font-weight: 900; letter-spacing: 1.5px;
                                text-transform: uppercase; margin-bottom: 12px;
                            ">
                                <span style="width: 6px; height: 6px; border-radius: 50%; background: #CCFF00; box-shadow: 0 0 8px #CCFF00;"></span>
                                SOMOSPADEL BCN • SESIÓN COMPLETADA
                            </div>

                            <!-- Floating Trophy -->
                            <div style="
                                font-size: 3.2rem; line-height: 1; margin-bottom: 8px;
                                filter: drop-shadow(0 6px 14px rgba(204, 255, 0, 0.35));
                                animation: spFloatTrophy 3.5s ease-in-out infinite;
                            ">🏆</div>

                            <!-- Title & Event Info -->
                            <h1 style="
                                font-size: 1.55rem; font-weight: 950; color: #ffffff;
                                letter-spacing: 1px; margin: 0 0 4px 0; text-transform: uppercase;
                            ">
                                FIN DEL ENTRENO
                            </h1>
                            <div style="
                                font-size: 0.76rem; font-weight: 700; color: #94a3b8;
                                text-transform: uppercase; letter-spacing: 0.8px;
                                display: flex; align-items: center; justify-content: center; gap: 8px;
                            ">
                                <span>${americanaDoc?.name || 'Entreno Dinámico'}</span>
                                <span style="color: rgba(255,255,255,0.2);">•</span>
                                <span style="color: #CCFF00;">${finalRound} RONDAS</span>
                            </div>
                        </div>

                        <!-- Content Cards: Gran Final Parejas + Podio Individual -->
                        <div style="padding: 16px 18px 4px;">
                            ${finalPairsSectionHTML}
                            ${individualPodiumHeaderHTML}
                            ${podiumHTML}
                        </div>

                        <!-- Fair Play & Level Compute Info Capsule -->
                        <div style="padding: 0 18px; margin-top: 4px; margin-bottom: 12px;">
                            <div style="
                                background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.07);
                                border-radius: 12px; padding: 9px 12px; display: flex; align-items: center; gap: 8px;
                            ">
                                <span style="font-size: 1rem; color: #CCFF00; flex-shrink: 0;">🎯</span>
                                <span style="font-size: 0.65rem; color: #94a3b8; line-height: 1.35; font-weight: 600;">
                                    <strong style="color: #ffffff;">Objetivo: Superación & Fair Play.</strong> Los partidos y juegos de este entreno ya se han registrado en tu Nivel Oficial SomosPadel.
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Interactive Action Buttons (Fixed at bottom) -->
                    <div style="
                        padding: 14px 18px 18px; display: flex; flex-direction: column; gap: 10px;
                        background: linear-gradient(180deg, rgba(15, 23, 42, 0.9) 0%, #080d19 100%);
                        border-top: 1px solid rgba(255, 255, 255, 0.08); flex-shrink: 0; z-index: 10;
                    ">
                        <!-- Primary Share Button -->
                        <button id="btn-tf-share" class="sp-tf-btn-main" style="
                            background: linear-gradient(135deg, #CCFF00 0%, #b8f000 100%);
                            color: #000000; border: none; padding: 14px 16px; border-radius: 16px;
                            font-weight: 950; font-size: 0.92rem; cursor: pointer;
                            display: flex; align-items: center; justify-content: center; gap: 10px;
                            box-shadow: 0 6px 20px rgba(204, 255, 0, 0.35); transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                            text-transform: uppercase; letter-spacing: 0.5px;
                        ">
                            <i class="fab fa-whatsapp" style="font-size: 1.25rem;"></i>
                            <span>COMPARTIR CLASIFICACIÓN</span>
                        </button>

                        <!-- Quick Navigation Tabs -->
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
                            <button id="btn-tf-tab-pos" class="sp-tf-tab-btn">
                                <i class="fas fa-list-ol"></i>
                                <span>POSICIONES</span>
                            </button>
                            <button id="btn-tf-tab-cuadros" class="sp-tf-tab-btn">
                                <i class="fas fa-sitemap"></i>
                                <span>CUADROS</span>
                            </button>
                            <button id="btn-tf-tab-stats" class="sp-tf-tab-btn">
                                <i class="fas fa-chart-pie"></i>
                                <span>ESTADÍSTICAS</span>
                            </button>
                        </div>

                        <!-- Return Button -->
                        <button id="btn-tf-menu" class="sp-tf-menu-btn" style="
                            width: 100%; background: transparent; color: #94a3b8;
                            border: 1px solid rgba(255, 255, 255, 0.12); padding: 11px;
                            border-radius: 14px; font-weight: 800; font-size: 0.78rem;
                            cursor: pointer; transition: all 0.2s ease; display: flex;
                            align-items: center; justify-content: center; gap: 6px;
                        ">
                            <i class="fas fa-arrow-left"></i>
                            <span>VOLVER A EVENTOS</span>
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            // Handlers
            const closeModal = () => {
                const el = document.getElementById('training-finished-modal');
                if (el) el.remove();
            };

            document.getElementById('btn-close-training-modal').onclick = closeModal;

            document.getElementById('btn-tf-share').onclick = () => {
                if (onShare) {
                    onShare(rankingItems, isFixedPairs, pairResults);
                } else {
                    const medals = ['🥇', '🥈', '🥉'];
                    let pairShareText = '';
                    if (pairResults?.winningPair?.names?.length) {
                        const winNames = pairResults.winningPair.names.join(' & ');
                        const winScore = (pairResults.winningPair.score !== null && pairResults.winningPair.score !== undefined)
                            ? ` (${pairResults.winningPair.score}-${pairResults.winningPair.rivalScore})`
                            : '';
                        pairShareText += `👑 PAREJA GANADORA (PISTA 1): ${winNames}${winScore}\n`;
                    }
                    if (pairResults?.finalistPair?.names?.length) {
                        const finNames = pairResults.finalistPair.names.join(' & ');
                        pairShareText += `🥈 PAREJA FINALISTA (PISTA 1): ${finNames}\n`;
                    }
                    if (pairShareText) pairShareText += '\n';

                    const podiumText = rankingItems.slice(0, 3).map((p, i) => {
                        const diff = (p.diff !== undefined) ? p.diff : ((p.points || 0) - (p.gamesLost || 0));
                        const diffStr = diff > 0 ? `+${diff}` : `${diff}`;
                        return `${medals[i]} ${(p.name || 'Jugador').toUpperCase()} — ${p.won || 0}V (${p.played || 0}PJ) • ${p.points || 0} PTS (Dif: ${diffStr})`;
                    }).join('\n');

                    const fullText = `🏆 CLASIFICACIÓN OFICIAL SOMOSPADEL BCN\n🎾 ${americanaDoc?.name || 'Entreno'}\n\n${pairShareText}🏆 PODIO INDIVIDUAL (TOP 3):\n${podiumText}\n\n🎯 Todos los partidos y juegos computan para tu Nivel Oficial SomosPadel.\n📲 Consulta cuadros y estadísticas en la app oficial de SomosPadel BCN 🔥`;
                    if (window.WhatsAppService?.shareText) {
                        window.WhatsAppService.shareText(fullText);
                    } else if (navigator.share) {
                        navigator.share({ text: fullText }).catch(() => {});
                    } else {
                        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(fullText)}`, '_blank');
                    }
                }
            };

            document.getElementById('btn-tf-tab-pos').onclick = () => {
                closeModal();
                if (onTabChange) onTabChange('standings');
            };

            document.getElementById('btn-tf-tab-cuadros').onclick = () => {
                closeModal();
                if (onTabChange) onTabChange('brackets');
            };

            document.getElementById('btn-tf-tab-stats').onclick = () => {
                closeModal();
                if (onTabChange) onTabChange('summary');
            };

            document.getElementById('btn-tf-menu').onclick = () => {
                closeModal();
                if (onMenu) onMenu();
            };
        }
    };
})();

