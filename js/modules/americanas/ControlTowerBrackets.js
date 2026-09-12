/**
 * ControlTowerBrackets.js
 * Sub-module for rendering tournament brackets and pair matches.
 * DESIGN: Summa Padel / Playtomic Style 🎾
 */
(function () {
    class ControlTowerBrackets {
        static render(matches, eventDoc) {
            if (!matches || matches.length === 0) {
                return `
                    <div style="padding: 60px 20px; text-align: center; color: #666; font-family: 'Outfit';">
                        <i class="fas fa-sitemap" style="font-size: 3rem; opacity: 0.2; margin-bottom: 20px;"></i>
                        <h3 style="font-weight: 800; color: #444;">CUADROS NO GENERADOS</h3>
                        <p style="font-size: 0.8rem; max-width: 250px; margin: 10px auto;">Los cuadros de juego se mostrarán una vez que el torneo comience oficialmente.</p>
                    </div>
                `;
            }

            // Group matches by round
            const roundsMap = matches.reduce((acc, m) => {
                const r = parseInt(m.round) || 1;
                if (!acc[r]) acc[r] = [];
                acc[r].push(m);
                return acc;
            }, {});

            const rounds = Object.keys(roundsMap).sort((a, b) => a - b);
            const totalRounds = Math.max(...rounds.map(Number));

            return `
                <style>
                    .bracket-container {
                        display: flex;
                        gap: 20px;
                        padding: 20px;
                        overflow-x: auto;
                        -webkit-overflow-scrolling: touch;
                        background: #f8fafc;
                        min-height: 70vh;
                    }
                    .bracket-round {
                        display: flex;
                        flex-direction: column;
                        justify-content: space-around;
                        min-width: 280px;
                        gap: 15px;
                    }
                    .bracket-match-node {
                        background: #ffffff;
                        border-radius: 16px;
                        border: 1px solid #e2e8f0;
                        padding: 12px;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.03);
                        position: relative;
                    }
                    .bracket-team {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 6px 8px;
                        gap: 10px;
                    }
                    .bracket-team-name {
                        font-size: 0.75rem;
                        font-weight: 800;
                        color: #0a192f;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        text-transform: uppercase;
                    }
                    .bracket-score {
                        background: #f1f5f9;
                        min-width: 26px;
                        height: 26px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border-radius: 6px;
                        font-weight: 950;
                        font-size: 0.8rem;
                        color: #64748b;
                        border: 1px solid #e2e8f0;
                    }
                    .bracket-winner {
                        color: #72a800 !important;
                    }
                    .bracket-winner-score {
                        background: #72a800 !important;
                        color: #ffffff !important;
                        border-color: #72a800 !important;
                    }
                    .bracket-connector {
                        position: absolute;
                        right: -10px;
                        top: 50%;
                        width: 10px;
                        height: 1px;
                        background: #e2e8f0;
                    }
                    .round-title {
                        text-align: center;
                        color: #64748b;
                        font-size: 0.65rem;
                        font-weight: 950;
                        letter-spacing: 2px;
                        margin-bottom: 20px;
                        text-transform: uppercase;
                    }
                </style>

                <div class="bracket-container fade-in">
                    ${rounds.map(r => `
                        <div class="bracket-round">
                            <div class="round-title">RONDA ${r}</div>
                            ${roundsMap[r].map(m => {
                                const sA = parseInt(m.score_a || 0);
                                const sB = parseInt(m.score_b || 0);
                                const isFinished = m.status === 'finished';
                                const winA = isFinished && sA > sB;
                                const winB = isFinished && sB > sA;

                                const formatTeamName = (names, fallback) => {
                                    if (window.MatchCard && typeof window.MatchCard.parseTeam === 'function') {
                                        return window.MatchCard.parseTeam(names, fallback).fullText;
                                    }
                                    return Array.isArray(names) ? names.join(' / ') : (names || fallback);
                                };

                                return `
                                    <div class="bracket-match-node">
                                        <div class="bracket-team">
                                            <span class="bracket-team-name ${winA ? 'bracket-winner' : ''}">${formatTeamName(m.team_a_names, 'TEAM A')}</span>
                                            <span class="bracket-score ${winA ? 'bracket-winner-score' : ''}">${isFinished ? sA : '-'}</span>
                                        </div>
                                        <div style="height: 1px; background: #f1f5f9; margin: 4px 0;"></div>
                                        <div class="bracket-team">
                                            <span class="bracket-team-name ${winB ? 'bracket-winner' : ''}">${formatTeamName(m.team_b_names, 'TEAM B')}</span>
                                            <span class="bracket-score ${winB ? 'bracket-winner-score' : ''}">${isFinished ? sB : '-'}</span>
                                        </div>
                                        ${parseInt(r) < totalRounds ? '<div class="bracket-connector"></div>' : ''}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }
    window.ControlTowerBrackets = ControlTowerBrackets;
})();
