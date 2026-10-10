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

    const ensureHtml2Canvas = async () => {
        if (typeof window.html2canvas !== 'undefined') return window.html2canvas;
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
            script.onload = () => resolve(window.html2canvas);
            script.onerror = () => {
                const fallback = document.createElement('script');
                fallback.src = 'https://html2canvas.hertzen.com/dist/html2canvas.min.js';
                fallback.onload = () => resolve(window.html2canvas);
                fallback.onerror = (err) => reject(new Error('No se pudo cargar html2canvas'));
                document.head.appendChild(fallback);
            };
            document.head.appendChild(script);
        });
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
                        background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                        border: 2.5px solid ${ringColor};
                        display: flex; align-items: center; justify-content: center;
                        font-weight: 950; font-size: 0.95rem; color: #0f172a;
                        box-shadow: 0 3px 10px rgba(0,0,0,0.08);
                    ">${init1}</div>
                    <span style="
                        position: absolute; bottom: -4px; right: -4px;
                        width: 20px; height: 20px; border-radius: 50%;
                        background: ${medalBg}; border: 1.5px solid ${medalBorder};
                        display: flex; align-items: center; justify-content: center;
                        font-size: 0.72rem; line-height: 1; box-shadow: 0 2px 6px rgba(0,0,0,0.1);
                    ">${medalIcon}</span>
                </div>
            `;
        }

        return `
            <div style="position: relative; flex-shrink: 0; width: 62px; height: 44px; display: flex; align-items: center;">
                <div style="
                    width: 38px; height: 38px; border-radius: 50%;
                    background: linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%);
                    border: 2.5px solid ${ringColor};
                    display: flex; align-items: center; justify-content: center;
                    font-weight: 950; font-size: 0.8rem; color: #0f172a;
                    box-shadow: 0 3px 8px rgba(0,0,0,0.12); z-index: 2; position: relative;
                " title="${p1}">
                    ${init1}
                </div>
                <div style="
                    width: 38px; height: 38px; border-radius: 50%;
                    background: linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 100%);
                    border: 2.5px solid ${ringColor};
                    display: flex; align-items: center; justify-content: center;
                    font-weight: 950; font-size: 0.8rem; color: #0f172a;
                    box-shadow: 0 3px 8px rgba(0,0,0,0.12);
                    margin-left: -14px; z-index: 1; position: relative;
                " title="${p2}">
                    ${init2}
                </div>
                <span style="
                    position: absolute; bottom: -2px; right: 0;
                    width: 20px; height: 20px; border-radius: 50%;
                    background: ${medalBg}; border: 1.5px solid ${medalBorder};
                    display: flex; align-items: center; justify-content: center;
                    font-size: 0.72rem; line-height: 1; z-index: 3; box-shadow: 0 2px 6px rgba(0,0,0,0.1);
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
                    <div style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 999px; background: #dcfce7; border: 1.5px solid #86efac; color: #15803d; font-size: 0.68rem; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 20px;">
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
                const originalHtml = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> GENERANDO SIGUIENTE RONDA...';
                btn.style.opacity = '0.85';
                btn.style.pointerEvents = 'none';
                try {
                    if (onNextRound) await onNextRound();
                } catch (err) {
                    console.error("❌ [EventModals] Error al avanzar ronda:", err);
                    btn.innerHTML = '<span>🚀 REINTENTAR SIGUIENTE RONDA</span>';
                    btn.style.opacity = '1';
                    btn.style.pointerEvents = 'auto';
                }
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
         * Shows the summary/gala flyer modal for both Entrenos and Americanas.
         * Supports both live (in-progress) and finished sessions, individual and fixed pairs.
         * Features html2canvas HD capture, WhatsApp/Instagram direct Web Share API, and downloads.
         */
        showTrainingFinishedModal(finalRound, matches, americanaDoc, onShare, onTabChange, onMenu) {
            if (document.getElementById('training-finished-modal')) return;

            const isEntreno = !!(americanaDoc?.isEntreno || (americanaDoc?.type || '').toLowerCase().includes('entreno') || (americanaDoc?.name || '').toLowerCase().includes('entreno'));
            const isSwiss = !!(americanaDoc?.isSwiss || (americanaDoc?.type || '').toLowerCase().includes('swiss') || (americanaDoc?.tournament_type || '').toLowerCase().includes('swiss') || (americanaDoc?.format || '').toLowerCase().includes('suizo') || (americanaDoc?.name || '').toLowerCase().includes('suizo'));
            const eventType = isSwiss ? 'swiss' : (isEntreno ? 'entreno' : 'americana');

            const isFixedPairs = !!(
                (americanaDoc?.pair_mode || '').toLowerCase().includes('fix')
                || (americanaDoc?.name || '').toUpperCase().includes('FIJA')
                || (americanaDoc?.tournament_type || '').toLowerCase().includes('fija')
                || (americanaDoc?.format || '').toLowerCase().includes('fija')
            );

            const allPlayers = americanaDoc?.players || [];
            const safeMatches = Array.isArray(matches) ? matches : [];

            const totalRounds = parseInt(americanaDoc?.rounds_count || americanaDoc?.rounds) || 6;
            const maxPlayedRound = (safeMatches.length > 0)
                ? Math.max(...safeMatches.map(m => parseInt(m.round || 1)))
                : 1;
            const currentRound = finalRound || maxPlayedRound;
            const maxRound = currentRound;

            // Determine if the session is completed or live/in-progress
            const isFinished = Boolean(
                americanaDoc?.status === 'finished'
                || americanaDoc?.status === 'completed'
                || americanaDoc?.is_finished === true
                || (maxPlayedRound >= totalRounds && safeMatches.length > 0 && safeMatches.filter(m => parseInt(m.round) === totalRounds).every(m => m.status === 'completed' || m.status === 'finished' || (m.score_a !== undefined && m.score_a !== '' && m.score_a !== null)))
            );

            // Compute standings transparently according to event type and format
            let rankingItems = (window.StandingsService && safeMatches.length > 0)
                ? window.StandingsService.calculate(safeMatches, isSwiss ? 'swiss' : eventType, isFixedPairs, allPlayers, isSwiss)
                : [];

            // 1. Identify Court 1 Match for Pair Winners/Leaders & Finalists/Aspirants
            let finalCourt1Match = safeMatches.find(m => parseInt(m.round) === parseInt(maxRound) && parseInt(m.court) === 1);
            if (!finalCourt1Match && safeMatches.length > 0) {
                const c1Matches = safeMatches.filter(m => parseInt(m.court) === 1).sort((a, b) => parseInt(b.round || 1) - parseInt(a.round || 1));
                if (c1Matches.length > 0) finalCourt1Match = c1Matches[0];
            }

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
                    winningPair = { names: teamANames, score: scoreA, rivalScore: scoreB };
                    finalistPair = { names: teamBNames, score: scoreB, rivalScore: scoreA };
                } else if (teamANames.length > 0 || teamBNames.length > 0) {
                    winningPair = { names: teamANames, score: null, rivalScore: null };
                    finalistPair = { names: teamBNames, score: null, rivalScore: null };
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

            // Text Adaptation (Live vs Finished)
            const eventName = americanaDoc?.name || (isEntreno ? 'Entreno SomosPadel' : (isSwiss ? 'Torneo Suizo' : 'Americana SomosPadel'));
            let badgeText = '';
            let modalTitle = '';
            let modalSubtitle = '';

            if (isFinished) {
                const sessionLabel = isEntreno ? 'SESIÓN COMPLETADA' : 'TORNEO COMPLETADO';
                badgeText = `<span style="width: 6px; height: 6px; border-radius: 50%; background: #CCFF00; box-shadow: 0 0 8px #CCFF00; display: inline-block;"></span> SOMOSPADEL BCN • ${sessionLabel}`;
                modalTitle = isEntreno ? 'FIN DEL ENTRENO' : (isSwiss ? 'FIN DEL SUIZO' : 'FIN DE LA AMERICANA');
                modalSubtitle = `${eventName} • ${maxRound} RONDAS COMPLETADAS`;
            } else {
                badgeText = `<span class="sp-live-pulse-dot" style="width: 7px; height: 7px; border-radius: 50%; background: #00E36D; display: inline-block; box-shadow: 0 0 10px #00E36D;"></span> SOMOSPADEL BCN • EN VIVO`;
                modalTitle = isEntreno ? 'ENTRENO EN VIVO' : (isSwiss ? 'TORNEO SUIZO EN VIVO' : 'AMERICANA EN VIVO');
                modalSubtitle = `${eventName} • RONDA ${currentRound || maxRound} DE ${totalRounds}`;
            }

            // Pair Highlight Cards HTML (Court 1)
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
                        border-radius: 6px; background: #ecfccb; color: #365314; border: 1.5px solid #84cc16; font-size: 0.68rem; font-weight: 950;
                    ">
                        ${winningPair.score} - ${winningPair.rivalScore}
                    </span>`
                    : '';

                const winnerBadgeTitle = isFinished
                    ? '👑 PAREJA GANADORA • PISTA 1'
                    : '🔥 LÍDERES • PISTA 1';

                const winnerScoreText = (winningPair.score !== null && winningPair.rivalScore !== null)
                    ? (isFinished ? `Victoria ${winningPair.score} - ${winningPair.rivalScore} en Pista 1` : `Marcador ${winningPair.score} - ${winningPair.rivalScore} en Pista 1`)
                    : (isFinished ? `Campeones de Pista 1 • Ronda Final` : `Líderes en Pista 1 • Ronda ${maxRound}`);

                const winningCardHTML = `
                    <div class="sp-final-pair-card" style="
                        padding: 14px 16px; border-radius: 18px; margin-bottom: 10px;
                        background: linear-gradient(135deg, #f7fee7 0%, #ffffff 100%);
                        border: 2px solid #84cc16;
                        box-shadow: 0 4px 16px rgba(132, 204, 22, 0.18);
                        animation: spSlideInRow 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
                    ">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="
                                display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px;
                                border-radius: 6px; background: #CCFF00; color: #0f172a;
                                border: 1.5px solid #84cc16;
                                font-size: 0.64rem; font-weight: 950; letter-spacing: 0.8px; text-transform: uppercase;
                            ">
                                ${winnerBadgeTitle}
                            </span>
                            ${winnerScoreBadge}
                        </div>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            ${doubleAvatarWinner}
                            <div style="flex: 1; min-width: 0;">
                                <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 4px 6px;">
                                    ${renderPairNamesWithBadges(winningPair.names, allPlayers, '#0f172a')}
                                </div>
                                <div style="font-size: 0.70rem; color: #15803d; font-weight: 850; margin-top: 5px; display: flex; align-items: center; gap: 6px;">
                                    <i class="fas fa-trophy" style="font-size: 0.75rem; color: #16a34a;"></i>
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
                            border-radius: 6px; background: #f1f5f9; color: #334155; border: 1.5px solid #cbd5e1; font-size: 0.68rem; font-weight: 900;
                        ">
                            ${finalistPair.score} - ${finalistPair.rivalScore}
                        </span>`
                        : '';

                    const finalistBadgeTitle = isFinished
                        ? '🥈 PAREJA FINALISTA • PISTA 1'
                        : '⚡ ASPIRANTES • PISTA 1';

                    const finalistSubText = isFinished
                        ? 'Subcampeones de Pista 1 en la Gran Final'
                        : `Disputando Pista 1 • Ronda ${maxRound}`;

                    finalistCardHTML = `
                        <div class="sp-final-pair-card" style="
                            padding: 13px 16px; border-radius: 18px; margin-bottom: 12px;
                            background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
                            border: 1.5px solid #cbd5e1;
                            box-shadow: 0 3px 12px rgba(0,0,0,0.04);
                            animation: spSlideInRow 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.08s both;
                        ">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                <span style="
                                    display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px;
                                    border-radius: 6px; background: #e2e8f0; color: #1e293b;
                                    border: 1px solid #cbd5e1;
                                    font-size: 0.64rem; font-weight: 950; letter-spacing: 0.8px; text-transform: uppercase;
                                ">
                                    ${finalistBadgeTitle}
                                </span>
                                ${finalistScoreBadge}
                            </div>
                            <div style="display: flex; align-items: center; gap: 12px;">
                                ${doubleAvatarFinalist}
                                <div style="flex: 1; min-width: 0;">
                                    <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 4px 6px;">
                                        ${renderPairNamesWithBadges(finalistPair.names, allPlayers, '#0f172a')}
                                    </div>
                                    <div style="font-size: 0.70rem; color: #64748b; font-weight: 750; margin-top: 5px; display: flex; align-items: center; gap: 6px;">
                                        <i class="fas fa-medal" style="font-size: 0.75rem; color: #94a3b8;"></i>
                                        <span>${finalistSubText}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }

                const court1SectionTitle = isFinished ? '👑 GRAN FINAL • PISTA 1' : '🔥 PISTA 1 DESTACADA';
                const court1SectionSubtitle = isFinished ? 'PAREJAS DESTACADAS' : 'LÍDERES EN VIVO';

                finalPairsSectionHTML = `
                    <div style="margin-bottom: 4px;">
                        <div style="
                            display: flex; justify-content: space-between; align-items: center;
                            margin-bottom: 10px; padding: 0 4px;
                        ">
                            <div style="font-size: 0.72rem; color: #0f172a; font-weight: 950; letter-spacing: 1.2px; text-transform: uppercase; display: flex; align-items: center; gap: 6px;">
                                <span>${court1SectionTitle}</span>
                                <span style="font-size: 0.60rem; background: #f1f5f9; color: #0f172a; padding: 1px 6px; border-radius: 5px; border: 1px solid #cbd5e1; font-weight: 900;">RONDA ${maxRound}</span>
                            </div>
                            <div style="font-size: 0.62rem; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                                ${court1SectionSubtitle}
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
                    badgeBg: '#fef08a',
                    badgeText: '#854d0e',
                    cardBg: 'linear-gradient(135deg, #fefce8 0%, #ffffff 100%)',
                    border: '#facc15',
                    nameColor: '#0f172a',
                    accentGlow: '0 4px 16px rgba(250, 204, 21, 0.20)',
                    ringColor: '#eab308',
                    avatarBg: '#fef08a',
                    avatarColor: '#854d0e',
                    ptsColor: '#854d0e',
                    medalIcon: '🥇',
                    medalBg: '#fef9c3',
                    medalBorder: '#facc15'
                },
                {
                    rankBadge: '2º PUESTO',
                    badgeBg: '#e2e8f0',
                    badgeText: '#334155',
                    cardBg: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
                    border: '#cbd5e1',
                    nameColor: '#0f172a',
                    accentGlow: '0 3px 10px rgba(0,0,0,0.04)',
                    ringColor: '#94a3b8',
                    avatarBg: '#f1f5f9',
                    avatarColor: '#334155',
                    ptsColor: '#334155',
                    medalIcon: '🥈',
                    medalBg: '#f1f5f9',
                    medalBorder: '#cbd5e1'
                },
                {
                    rankBadge: '3º PUESTO',
                    badgeBg: '#ffedd5',
                    badgeText: '#9a3412',
                    cardBg: 'linear-gradient(135deg, #fff7ed 0%, #ffffff 100%)',
                    border: '#fdba74',
                    nameColor: '#0f172a',
                    accentGlow: '0 3px 10px rgba(249, 115, 22, 0.12)',
                    ringColor: '#f97316',
                    avatarBg: '#ffedd5',
                    avatarColor: '#9a3412',
                    ptsColor: '#9a3412',
                    medalIcon: '🥉',
                    medalBg: '#fff7ed',
                    medalBorder: '#fdba74'
                }
            ];

            const podiumHTML = rankingItems.slice(0, 3).map((p, i) => {
                const tier = podiumTierStyles[i];
                const diff = (p.diff !== undefined) ? p.diff : ((p.points || 0) - (p.gamesLost || 0));
                const diffStr = diff > 0 ? `+${diff}` : `${diff}`;
                const diffColor = diff > 0 ? '#10b981' : (diff < 0 ? '#ef4444' : '#94a3b8');

                // Primary metric according to event type
                const isEntrenoType = (eventType === 'entreno');
                const ptsValue = isEntrenoType ? (p.won || 0) : (p.points !== undefined ? p.points : (p.won || 0));
                const ptsLabel = isEntrenoType ? 'VICTORIAS' : 'PTS';

                const isPairItem = isFixedPairs || (typeof p.name === 'string' && (p.name.includes(' & ') || p.name.includes(' / ')));
                let avatarBlockHTML = '';
                let nameBlockHTML = '';

                if (isPairItem) {
                    const pairNames = sanitizeTeamNames(p.name, p.name);
                    avatarBlockHTML = renderDoubleAvatar(
                        pairNames,
                        tier.ringColor,
                        tier.medalIcon,
                        tier.medalBg,
                        tier.border
                    );
                    nameBlockHTML = `
                        <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 2px;">
                            <span style="
                                font-size: 0.58rem; font-weight: 900; padding: 1px 6px;
                                border-radius: 4px; background: ${tier.badgeBg}; color: ${tier.badgeText};
                                letter-spacing: 0.5px;
                            ">${tier.rankBadge}</span>
                            <span style="
                                font-size: 0.58rem; font-weight: 900; padding: 1px 6px;
                                border-radius: 4px; background: rgba(255,255,255,0.08); color: #e2e8f0;
                            ">PAREJA</span>
                        </div>
                        <div style="
                            font-weight: 900; font-size: 0.90rem; color: ${tier.nameColor};
                            text-transform: uppercase; white-space: nowrap; overflow: hidden;
                            text-overflow: ellipsis; letter-spacing: 0.3px;
                        ">
                            ${p.name || 'Pareja'}
                        </div>
                    `;
                } else {
                    const initials = getInitials(p.name);
                    const playerLevel = resolvePlayerLevel(p, allPlayers);
                    const levelColor = getLevelColor(playerLevel);

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

                    avatarBlockHTML = `
                        <div style="position: relative; flex-shrink: 0;">
                            <div style="
                                width: 44px; height: 44px; border-radius: 50%;
                                background: ${tier.avatarBg || '#f1f5f9'};
                                border: 2.5px solid ${tier.ringColor};
                                display: flex; align-items: center; justify-content: center;
                                font-weight: 950; font-size: 0.95rem; color: ${tier.avatarColor || '#0f172a'};
                                box-shadow: 0 3px 8px rgba(0,0,0,0.08);
                            ">
                                ${initials}
                            </div>
                            <span style="
                                position: absolute; bottom: -4px; right: -4px;
                                width: 20px; height: 20px; border-radius: 50%;
                                background: ${tier.medalBg}; border: 1.5px solid ${tier.medalBorder || tier.border}; box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                                display: flex; align-items: center; justify-content: center;
                                font-size: 0.72rem; line-height: 1;
                            ">${tier.medalIcon}</span>
                        </div>
                    `;

                    nameBlockHTML = `
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
                    `;
                }

                return `
                    <div class="sp-podium-card" style="
                        display: flex; align-items: center; gap: 12px; padding: 13px 16px;
                        border-radius: 18px; background: ${tier.cardBg}; border: 1px solid ${tier.border};
                        margin-bottom: 9px; box-shadow: ${tier.accentGlow}; position: relative;
                        animation: spSlideInRow 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${(i + 1) * 0.1}s both;
                        backdrop-filter: blur(8px);
                    ">
                        ${avatarBlockHTML}

                        <div style="flex: 1; min-width: 0;">
                            ${nameBlockHTML}
                            <div style="display: flex; align-items: center; gap: 8px; font-size: 0.72rem; color: #64748b; font-weight: 700; margin-top: 3px;">
                                <span style="color: #16a34a; font-weight: 950;">${p.won || 0}V</span>
                                <span>·</span>
                                <span>${p.played || 0}PJ</span>
                                <span>·</span>
                                <span>Dif: <strong style="color: ${diffColor};">${diffStr}</strong></span>
                            </div>
                        </div>

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

            const podiumTitleText = isFixedPairs ? '🏆 PODIO PAREJAS' : '🏆 PODIO INDIVIDUAL';
            const podiumSubtitleText = isFixedPairs ? 'TOP 3 DEL EVENTO' : 'TOP 3 DE LA JORNADA';
            const individualPodiumHeaderHTML = `
                <div style="
                    display: flex; justify-content: space-between; align-items: center;
                    margin-bottom: 11px; padding: ${finalPairsSectionHTML ? '10px 4px 0' : '0 4px'};
                    ${finalPairsSectionHTML ? 'border-top: 1.5px solid #e2e8f0; margin-top: 8px;' : ''}
                ">
                    <div style="font-size: 0.72rem; color: #0f172a; font-weight: 950; letter-spacing: 1.2px; text-transform: uppercase; display: flex; align-items: center; gap: 6px;">
                        <span>${podiumTitleText}</span>
                    </div>
                    <div style="font-size: 0.62rem; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                        ${podiumSubtitleText}
                    </div>
                </div>
            `;

            // Helper to generate the official WhatsApp/social text message
            const generateOfficialText = () => {
                const medals = ['🥇', '🥈', '🥉'];
                let pairShareText = '';
                if (pairResults?.winningPair?.names?.length) {
                    const winNames = pairResults.winningPair.names.join(' & ');
                    const winScore = (pairResults.winningPair.score !== null && pairResults.winningPair.score !== undefined)
                        ? ` (${pairResults.winningPair.score}-${pairResults.winningPair.rivalScore})`
                        : '';
                    pairShareText += isFinished
                        ? `👑 PAREJA GANADORA (PISTA 1): ${winNames}${winScore}\n`
                        : `🔥 LÍDERES EN PISTA 1: ${winNames}${winScore}\n`;
                }
                if (pairResults?.finalistPair?.names?.length) {
                    const finNames = pairResults.finalistPair.names.join(' & ');
                    pairShareText += isFinished
                        ? `🥈 PAREJA FINALISTA (PISTA 1): ${finNames}\n`
                        : `⚡ ASPIRANTES PISTA 1: ${finNames}\n`;
                }
                if (pairShareText) pairShareText += '\n';

                const podTitle = isFixedPairs ? '🏆 PODIO PAREJAS (TOP 3):' : '🏆 PODIO INDIVIDUAL (TOP 3):';
                const podiumText = rankingItems.slice(0, 3).map((p, i) => {
                    const diff = (p.diff !== undefined) ? p.diff : ((p.points || 0) - (p.gamesLost || 0));
                    const diffStr = diff > 0 ? `+${diff}` : `${diff}`;
                    const val = (eventType === 'entreno') ? `${p.won || 0}V` : `${p.points || 0} PTS`;
                    return `${medals[i]} ${(p.name || 'Jugador').toUpperCase()} — ${val} (${p.played || 0}PJ) • Dif: ${diffStr}`;
                }).join('\n');

                const statusHeader = isFinished ? '🏆 CLASIFICACIÓN FINAL SOMOSPADEL BCN' : '🔥 CLASIFICACIÓN EN VIVO • SOMOSPADEL BCN';
                const eventLabel = isEntreno ? 'Entreno' : (isSwiss ? 'Torneo Suizo' : 'Americana');
                return `${statusHeader}\n🎾 ${americanaDoc?.name || eventLabel}\n\n${pairShareText}${podTitle}\n${podiumText}\n\n🎯 Todos los partidos computan para tu Nivel Oficial SomosPadel.\n📲 Consulta cuadros y estadísticas en vivo en la app oficial de SomosPadel BCN 🔥`;
            };

            const overlay = document.createElement('div');
            overlay.id = 'training-finished-modal';
            overlay.style.cssText = `
                position: fixed; inset: 0; z-index: 14000;
                display: flex; align-items: center; justify-content: center;
                background: rgba(15, 23, 42, 0.60); backdrop-filter: blur(10px);
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
                    @keyframes pulseLive {
                        0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 227, 109, 0.7); }
                        70% { transform: scale(1.15); box-shadow: 0 0 0 6px rgba(0, 227, 109, 0); }
                        100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 227, 109, 0); }
                    }
                    .sp-live-pulse-dot {
                        animation: pulseLive 1.8s infinite;
                    }
                    .sp-particle {
                        position: absolute; border-radius: 50%; pointer-events: none;
                        animation: spParticleDrift linear infinite;
                    }
                    .sp-tf-btn-social:hover {
                        transform: translateY(-2px);
                        filter: brightness(1.08);
                    }
                    .sp-tf-btn-social:active {
                        transform: scale(0.98);
                    }
                    .sp-tf-tab-btn {
                        background: #f8fafc;
                        color: #1e293b;
                        border: 1.5px solid #e2e8f0;
                        padding: 9px 4px;
                        border-radius: 12px;
                        font-weight: 800;
                        font-size: 0.66rem;
                        cursor: pointer;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 3px;
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
                        font-size: 0.95rem;
                        color: #16a34a;
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
                    background: #ffffff; color: #0f172a;
                    width: 100%; max-width: 440px; border-radius: 26px;
                    border: 1.5px solid #e2e8f0;
                    box-shadow: 0 25px 60px rgba(0,0,0,0.22), 0 0 35px rgba(22, 163, 74, 0.12);
                    overflow: hidden; position: relative; font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
                    max-height: calc(100vh - 28px); display: flex; flex-direction: column;
                ">
                    <!-- Close button in top right -->
                    <button id="btn-close-training-modal" class="sp-close-icon-btn" style="
                        position: absolute; top: 16px; right: 16px; width: 34px; height: 34px;
                        border-radius: 50%; background: #f1f5f9; border: 1.5px solid #cbd5e1; color: #475569; display: flex; align-items: center; justify-content: center;
                        font-size: 1rem; cursor: pointer; transition: all 0.2s ease; z-index: 30;
                    ">
                        <i class="fas fa-times"></i>
                    </button>

                    <!-- Scrollable Content Body -->
                    <div style="overflow-y: auto; -webkit-overflow-scrolling: touch; flex: 1; min-height: 0; padding-bottom: 8px;">
                        <!-- Capturable Container for Flyer Export -->
                        <div id="sp-flyer-capture-card" style="
                            background: #ffffff;
                            margin: 12px; border-radius: 22px; border: 2px solid #e2e8f0;
                            overflow: hidden; position: relative; box-shadow: 0 8px 30px rgba(0,0,0,0.06);
                        ">
                            <!-- Olympic Header -->
                            <div style="
                                padding: 24px 20px 16px; text-align: center;
                                background: radial-gradient(circle at 50% 10%, rgba(204, 255, 0, 0.22) 0%, rgba(255, 255, 255, 0) 75%);
                                border-bottom: 1.5px solid #e2e8f0;
                                position: relative;
                            ">
                                <!-- Status Badge -->
                                <div style="
                                    display: inline-flex; align-items: center; gap: 7px; padding: 4px 12px;
                                    border-radius: 999px; background: #dcfce7; border: 1.5px solid #86efac; color: #15803d;
                                    font-size: 0.63rem; font-weight: 900; letter-spacing: 1.3px;
                                    text-transform: uppercase; margin-bottom: 12px;
                                ">
                                    ${badgeText}
                                </div>

                                <!-- Floating Trophy -->
                                <div style="
                                    font-size: 3.1rem; line-height: 1; margin-bottom: 8px;
                                    filter: drop-shadow(0 6px 14px rgba(204, 255, 0, 0.35));
                                    animation: spFloatTrophy 3.5s ease-in-out infinite;
                                ">🏆</div>

                                <!-- Title & Event Info -->
                                <h1 style="
                                    font-size: 1.55rem; font-weight: 950; color: #0f172a; letter-spacing: 0.5px; margin: 0 0 4px 0; text-transform: uppercase;
                                ">
                                    ${modalTitle}
                                </h1>
                                <div style="
                                    font-size: 0.76rem; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.6px;
                                    display: flex; align-items: center; justify-content: center; gap: 8px;
                                ">
                                    <span>${modalSubtitle}</span>
                                </div>
                            </div>

                            <!-- Content Cards: Court 1 + Podium -->
                            <div style="padding: 14px 14px 6px;">
                                ${finalPairsSectionHTML}
                                ${individualPodiumHeaderHTML}
                                ${podiumHTML}
                            </div>

                            <!-- Watermark / Footer Inside Captured Flyer -->
                            <div style="
                                padding: 10px 16px; display: flex; justify-content: space-between; align-items: center;
                                border-top: 1.5px solid #e2e8f0; background: #f8fafc;
                            ">
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <img src="img/logo_somospadel.png" style="width: 17px; height: 17px; border-radius: 50%; object-fit: cover;" onerror="this.style.display='none'">
                                    <span style="font-size: 0.62rem; color: #0f172a; font-weight: 950; letter-spacing: 0.8px;">SOMOSPADEL BCN</span>
                                </div>
                                <span style="font-size: 0.58rem; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                                    PÁDEL SOCIAL & COMPETITIVO
                                </span>
                            </div>
                        </div>

                        <!-- Fair Play & Level Compute Info Capsule -->
                        <div style="padding: 0 16px; margin-top: 2px; margin-bottom: 8px;">
                            <div style="
                                background: #f8fafc; border: 1.5px solid #e2e8f0;
                                border-radius: 12px; padding: 9px 12px; display: flex; align-items: center; gap: 8px;
                            ">
                                <span style="font-size: 1rem; color: #CCFF00; flex-shrink: 0;">🎯</span>
                                <span style="font-size: 0.68rem; color: #475569; line-height: 1.35; font-weight: 650;">
                                    <strong style="color: #0f172a;">Objetivo: Superación & Fair Play.</strong> Los partidos de este evento computan para tu Nivel Oficial SomosPadel.
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Interactive Action Buttons (Fixed at bottom) -->
                    <div style="
                        padding: 14px 16px; display: flex; flex-direction: column; gap: 9px;
                        background: #ffffff;
                        border-top: 1.5px solid #e2e8f0; flex-shrink: 0; z-index: 10;
                    ">
                        <!-- Row 0: Crónica Épica IA Post-Torneo -->
                        <button id="btn-tf-chronicle-ai" class="sp-tf-btn-social" style="
                            background: linear-gradient(135deg, #8B5CF6 0%, #4C1D95 100%);
                            color: #ffffff; border: 1px solid rgba(204, 255, 0, 0.6); padding: 11px 14px; border-radius: 14px;
                            font-weight: 950; font-size: 0.82rem; cursor: pointer;
                            display: flex; align-items: center; justify-content: center; gap: 8px;
                            box-shadow: 0 4px 18px rgba(139, 92, 246, 0.4); transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                            letter-spacing: 0.5px;
                        ">
                            <span style="font-size: 1.05rem;">✨</span>
                            <span>CRÓNICA ÉPICA & STORY 9:16</span>
                            <span style="background: #CCFF00; color: #000; font-size: 0.58rem; padding: 2px 6px; border-radius: 6px; font-weight: 950;">NUEVO</span>
                        </button>

                        <!-- Row 1: WhatsApp & Instagram (50% / 50%) -->
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                            <button id="btn-tf-whatsapp" class="sp-tf-btn-social" style="
                                background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
                                color: #ffffff; border: none; padding: 12px 10px; border-radius: 14px;
                                font-weight: 950; font-size: 0.82rem; cursor: pointer;
                                display: flex; align-items: center; justify-content: center; gap: 8px;
                                box-shadow: 0 4px 16px rgba(37, 211, 102, 0.35); transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                                letter-spacing: 0.5px;
                            ">
                                <i class="fab fa-whatsapp" style="font-size: 1.15rem;"></i>
                                <span>WHATSAPP</span>
                            </button>

                            <button id="btn-tf-instagram" class="sp-tf-btn-social" style="
                                background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
                                color: #ffffff; border: none; padding: 12px 10px; border-radius: 14px;
                                font-weight: 950; font-size: 0.82rem; cursor: pointer;
                                display: flex; align-items: center; justify-content: center; gap: 8px;
                                box-shadow: 0 4px 16px rgba(220, 39, 67, 0.35); transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                                letter-spacing: 0.5px;
                            ">
                                <i class="fab fa-instagram" style="font-size: 1.15rem;"></i>
                                <span>INSTAGRAM</span>
                            </button>
                        </div>

                        <!-- Row 2: Guardar Flyer HD -->
                        <button id="btn-tf-download-flyer" class="sp-tf-btn-social" style="
                            background: #f0fdf4; color: #15803d;
                            border: 2px solid #22c55e; padding: 11px 14px; border-radius: 12px;
                            font-weight: 950; font-size: 0.80rem; box-shadow: 0 3px 12px rgba(34, 197, 94, 0.18); cursor: pointer;
                            display: flex; align-items: center; justify-content: center; gap: 7px;
                            transition: all 0.2s ease;
                        ">
                            <i class="fas fa-download" style="font-size: 0.85rem;"></i>
                            <span>GUARDAR FLYER HD</span>
                        </button>

                        <!-- Row 3: Quick Navigation Tabs -->
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px;">
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

                        <!-- Row 4: Return Button -->
                        <button id="btn-tf-menu" class="sp-tf-menu-btn" style="
                            width: 100%; background: #ffffff; color: #475569;
                            border: 1.5px solid #cbd5e1; padding: 9px;
                            border-radius: 12px; font-weight: 850; font-size: 0.76rem;
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

            // Cached flyer capture promise
            let _cachedCanvas = null;
            let _cachedBlob = null;
            let _cachedFile = null;
            let _cachedFileName = null;

            const generateFlyerImage = async () => {
                if (_cachedCanvas && _cachedBlob && _cachedFile) {
                    return { canvas: _cachedCanvas, blob: _cachedBlob, file: _cachedFile, fileName: _cachedFileName };
                }

                await ensureHtml2Canvas();

                const captureEl = document.getElementById('sp-flyer-capture-card');
                if (!captureEl) throw new Error('Flyer card element not found');

                const canvas = await window.html2canvas(captureEl, {
                    scale: 2,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    logging: false,
                    scrollX: 0,
                    scrollY: 0
                });

                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 0.95));
                const safeName = (americanaDoc?.name || (isEntreno ? 'Entreno' : 'Americana')).replace(/[^a-zA-Z0-9]/g, '_');
                const fileName = `SomosPadel_Flyer_${safeName}.png`;
                const file = new File([blob], fileName, { type: 'image/png' });

                _cachedCanvas = canvas;
                _cachedBlob = blob;
                _cachedFile = file;
                _cachedFileName = fileName;

                return { canvas, blob, file, fileName };
            };

            // AI CHRONICLE MODAL
            const chronicleAiBtn = document.getElementById('btn-tf-chronicle-ai');
            if (chronicleAiBtn) {
                chronicleAiBtn.onclick = () => {
                    if (window.TournamentChronicleModal) {
                        window.TournamentChronicleModal.open(americanaDoc, safeMatches);
                    }
                };
            }

            // WHATSAPP SHARE
            document.getElementById('btn-tf-whatsapp').onclick = async () => {
                const btn = document.getElementById('btn-tf-whatsapp');
                const origHtml = btn.innerHTML;
                try {
                    btn.disabled = true;
                    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> <span>GENERANDO...</span>`;

                    const { canvas, file, fileName } = await generateFlyerImage();
                    const shareText = generateOfficialText();

                    // Check mobile Web Share API for direct image share
                    if (navigator.canShare && navigator.canShare({ files: [file] })) {
                        try {
                            await navigator.share({
                                files: [file],
                                title: 'SomosPadel BCN',
                                text: shareText
                            });
                            return;
                        } catch (shareErr) {
                            if (shareErr.name === 'AbortError') return;
                            console.warn("navigator.share failed, fallback to direct download & wa:", shareErr);
                        }
                    }

                    // Desktop / fallback: Download image and open WhatsApp Web/App
                    const a = document.createElement('a');
                    a.href = canvas.toDataURL('image/png');
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();

                    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
                    window.open(waUrl, '_blank');

                    if (window.NotificationService?.showToast) {
                        window.NotificationService.showToast('📸 Flyer HD descargado y abriendo WhatsApp', 'success');
                    }
                } catch (err) {
                    console.error("Error al compartir en WhatsApp:", err);
                    alert("No se pudo generar el flyer para WhatsApp. Revisa tu conexión.");
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = origHtml;
                }
            };

            // INSTAGRAM SHARE
            document.getElementById('btn-tf-instagram').onclick = async () => {
                const btn = document.getElementById('btn-tf-instagram');
                const origHtml = btn.innerHTML;
                try {
                    btn.disabled = true;
                    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> <span>GENERANDO...</span>`;

                    const { canvas, blob, file, fileName } = await generateFlyerImage();

                    if (navigator.canShare && navigator.canShare({ files: [file] })) {
                        try {
                            await navigator.share({
                                files: [file],
                                title: 'SomosPadel BCN'
                            });
                            return;
                        } catch (shareErr) {
                            if (shareErr.name === 'AbortError') return;
                            console.warn("navigator.share failed for Instagram, fallback:", shareErr);
                        }
                    }

                    // Desktop / fallback: Download image and attempt clipboard copy
                    const a = document.createElement('a');
                    a.href = canvas.toDataURL('image/png');
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();

                    let copied = false;
                    if (navigator.clipboard && window.ClipboardItem) {
                        try {
                            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                            copied = true;
                        } catch (cErr) {
                            console.warn("Clipboard copy not permitted:", cErr);
                        }
                    }

                    if (window.NotificationService?.showToast) {
                        window.NotificationService.showToast(
                            copied
                                ? '📸 Flyer HD descargado y copiado al portapapeles para Instagram'
                                : '📸 Flyer HD descargado para tus Stories de Instagram',
                            'success'
                        );
                    }
                } catch (err) {
                    console.error("Error al compartir en Instagram:", err);
                    alert("No se pudo generar el flyer para Instagram. Revisa tu conexión.");
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = origHtml;
                }
            };

            // DIRECT HD FLYER DOWNLOAD
            document.getElementById('btn-tf-download-flyer').onclick = async () => {
                const btn = document.getElementById('btn-tf-download-flyer');
                const origHtml = btn.innerHTML;
                try {
                    btn.disabled = true;
                    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> <span>GENERANDO...</span>`;

                    const { canvas, fileName } = await generateFlyerImage();

                    const a = document.createElement('a');
                    a.href = canvas.toDataURL('image/png');
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();

                    if (window.NotificationService?.showToast) {
                        window.NotificationService.showToast('📸 Flyer HD guardado en tus descargas', 'success');
                    }
                } catch (err) {
                    console.error("Error al descargar flyer:", err);
                    alert("No se pudo descargar el flyer. Revisa tu conexión.");
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = origHtml;
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
        },

        /**
         * Alias compatible method for opening the event summary flyer
         */
        showEventSummaryFlyerModal(finalRound, matches, americanaDoc, onShare, onTabChange, onMenu) {
            return this.showTrainingFinishedModal(finalRound, matches, americanaDoc, onShare, onTabChange, onMenu);
        }
    };

    window.EventModals.showEventSummaryFlyerModal = window.EventModals.showTrainingFinishedModal;
})();

