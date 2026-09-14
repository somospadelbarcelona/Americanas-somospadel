/**
 * ControlTowerBrackets.js
 * Sub-module for rendering dynamic tournament brackets, court ladders and player journeys.
 * Version: 5.0 Playoff Brackets & Court Ladder Edition (SomosPadel BCN)
 */
(function () {
    'use strict';

    class ControlTowerBrackets {
        static render(matches, eventDoc) {
            if (!matches || matches.length === 0) {
                return `
                    <div style="padding: 60px 20px; text-align: center; color: #64748b; font-family: 'Outfit', sans-serif;">
                        <i class="fas fa-sitemap" style="font-size: 3rem; opacity: 0.25; margin-bottom: 20px; color: #0ea5e9;"></i>
                        <h3 style="font-weight: 900; color: #0f172a; margin-bottom: 8px;">CUADROS NO GENERADOS</h3>
                        <p style="font-size: 0.8rem; max-width: 280px; margin: 0 auto; color: #64748b;">Los cuadros y la escalera de cruces se activarán conforme se disputen los primeros partidos.</p>
                    </div>
                `;
            }

            const isEntreno = !!eventDoc?.isEntreno;
            const isPozo = isEntreno || (eventDoc?.pair_mode || '').toLowerCase().includes('pozo') || (eventDoc?.name || '').toUpperCase().includes('POZO');
            
            // Extract unique players for the Player Journey Filter
            const playersSet = new Map();
            matches.forEach(m => {
                (m.team_a_names || []).forEach((n, idx) => {
                    if (n && n !== '---') playersSet.set(n.trim().toUpperCase(), n.trim());
                });
                (m.team_b_names || []).forEach((n, idx) => {
                    if (n && n !== '---') playersSet.set(n.trim().toUpperCase(), n.trim());
                });
            });
            const playerList = Array.from(playersSet.values()).sort();

            // Group matches by round
            const roundsMap = matches.reduce((acc, m) => {
                const r = parseInt(m.round) || 1;
                if (!acc[r]) acc[r] = [];
                acc[r].push(m);
                return acc;
            }, {});

            const rounds = Object.keys(roundsMap).sort((a, b) => a - b);
            const totalRounds = Math.max(...rounds.map(Number));

            // Max court count
            const maxCourt = Math.max(1, ...matches.map(m => parseInt(m.court || 1)));

            return `
                <style>
                    .sp-brackets-wrap {
                        font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
                        padding: 12px 14px 40px;
                        background: #f8fafc;
                        min-height: 80vh;
                        box-sizing: border-box;
                    }

                    /* Top Controls */
                    .sp-brackets-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 16px;
                        gap: 10px;
                        flex-wrap: wrap;
                    }
                    .sp-brackets-btn-back {
                        background: #ffffff;
                        border: 1px solid #e2e8f0;
                        color: #475569;
                        padding: 8px 16px;
                        border-radius: 12px;
                        font-weight: 800;
                        font-size: 0.72rem;
                        cursor: pointer;
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.03);
                    }
                    .sp-brackets-btn-back:hover {
                        background: #0f172a;
                        color: #ffffff;
                        border-color: #0f172a;
                    }

                    .sp-brackets-view-toggle {
                        display: inline-flex;
                        background: #e2e8f0;
                        padding: 3px;
                        border-radius: 14px;
                        gap: 3px;
                    }
                    .sp-toggle-btn {
                        border: none;
                        background: transparent;
                        color: #64748b;
                        padding: 6px 14px;
                        border-radius: 11px;
                        font-weight: 900;
                        font-size: 0.68rem;
                        cursor: pointer;
                        transition: all 0.2s;
                        letter-spacing: 0.5px;
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                    }
                    .sp-toggle-btn.active {
                        background: #0f172a;
                        color: #ffffff;
                        box-shadow: 0 2px 8px rgba(15, 23, 42, 0.2);
                    }

                    /* Player Journey Filter Bar */
                    .sp-journey-filter-card {
                        background: #ffffff;
                        border: 1px solid #e2e8f0;
                        border-radius: 18px;
                        padding: 12px 16px;
                        margin-bottom: 20px;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 12px;
                        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
                        flex-wrap: wrap;
                    }
                    .sp-journey-title {
                        font-size: 0.75rem;
                        font-weight: 900;
                        color: #0f172a;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    .sp-journey-select {
                        background: #f8fafc;
                        border: 1.5px solid #cbd5e1;
                        padding: 7px 14px;
                        border-radius: 10px;
                        font-size: 0.75rem;
                        font-weight: 800;
                        color: #0f172a;
                        font-family: inherit;
                        outline: none;
                        cursor: pointer;
                    }

                    /* 1. BRACKETS STAGE */
                    .sp-bracket-tree {
                        display: flex;
                        gap: 24px;
                        padding: 14px 4px 30px;
                        overflow-x: auto;
                        -webkit-overflow-scrolling: touch;
                    }
                    .sp-bracket-col {
                        display: flex;
                        flex-direction: column;
                        justify-content: space-around;
                        min-width: 280px;
                        gap: 20px;
                    }
                    .sp-bracket-col-title {
                        text-align: center;
                        font-size: 0.72rem;
                        font-weight: 950;
                        letter-spacing: 1.5px;
                        text-transform: uppercase;
                        color: #64748b;
                        background: #ffffff;
                        padding: 6px 14px;
                        border-radius: 20px;
                        border: 1px solid #e2e8f0;
                        box-shadow: 0 2px 6px rgba(0,0,0,0.02);
                        margin-bottom: 8px;
                    }
                    .sp-bracket-col.final-col .sp-bracket-col-title {
                        color: #d97706;
                        border-color: #fef08a;
                        background: #fffbeb;
                    }

                    /* Match Node */
                    .sp-bracket-node {
                        background: #ffffff;
                        border: 1.5px solid #e2e8f0;
                        border-radius: 16px;
                        padding: 10px 12px;
                        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
                        position: relative;
                        transition: all 0.25s;
                    }
                    .sp-bracket-node.highlighted {
                        border-color: #0ea5e9;
                        box-shadow: 0 0 20px rgba(14, 165, 233, 0.35);
                        transform: scale(1.02);
                    }
                    .sp-bracket-node-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        font-size: 0.62rem;
                        font-weight: 900;
                        color: #64748b;
                        margin-bottom: 6px;
                        text-transform: uppercase;
                    }
                    .sp-node-court-tag {
                        background: #0f172a;
                        color: #CCFF00;
                        padding: 2px 7px;
                        border-radius: 6px;
                        font-weight: 950;
                    }
                    .sp-bracket-pair {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 6px 8px;
                        border-radius: 8px;
                        margin: 3px 0;
                        background: #f8fafc;
                        border: 1px solid #f1f5f9;
                        transition: all 0.2s;
                    }
                    .sp-bracket-pair.winner {
                        background: rgba(16, 185, 129, 0.08);
                        border-color: rgba(16, 185, 129, 0.4);
                    }
                    .sp-bracket-pair-name {
                        font-size: 0.72rem;
                        font-weight: 800;
                        color: #1e293b;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        max-width: 180px;
                        text-transform: uppercase;
                    }
                    .sp-bracket-pair.winner .sp-bracket-pair-name {
                        font-weight: 950;
                        color: #047857;
                    }
                    .sp-bracket-pair-score {
                        min-width: 26px;
                        height: 26px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border-radius: 7px;
                        font-weight: 950;
                        font-size: 0.85rem;
                        color: #64748b;
                        background: #ffffff;
                        border: 1px solid #e2e8f0;
                    }
                    .sp-bracket-pair.winner .sp-bracket-pair-score {
                        background: #10b981;
                        color: #ffffff;
                        border-color: #10b981;
                    }

                    /* 2. COURT LADDER (Escalera de Pistas / Pozo) */
                    .sp-ladder-view {
                        display: flex;
                        flex-direction: column;
                        gap: 16px;
                    }
                    .sp-ladder-tier {
                        background: #ffffff;
                        border: 1.5px solid #e2e8f0;
                        border-radius: 20px;
                        padding: 16px;
                        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.03);
                        position: relative;
                        overflow: hidden;
                    }
                    .sp-ladder-tier.king-tier {
                        background: linear-gradient(135deg, #fffbeb 0%, #ffffff 100%);
                        border-color: #f59e0b;
                        box-shadow: 0 8px 30px rgba(245, 158, 11, 0.15);
                    }
                    .sp-ladder-tier-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 12px;
                    }
                    .sp-ladder-tier-title {
                        font-weight: 950;
                        font-size: 0.85rem;
                        color: #0f172a;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }
                    .sp-ladder-movement-badge {
                        font-size: 0.62rem;
                        font-weight: 900;
                        padding: 3px 8px;
                        border-radius: 6px;
                        display: inline-flex;
                        align-items: center;
                        gap: 4px;
                    }
                    .badge-up { background: rgba(16, 185, 129, 0.12); color: #047857; }
                    .badge-down { background: rgba(239, 68, 68, 0.12); color: #b91c1c; }
                    .badge-stay { background: rgba(100, 116, 139, 0.12); color: #475569; }

                    .sp-ladder-matches-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                        gap: 12px;
                    }

                    /* 3. PLAYER JOURNEY TIMELINE */
                    .sp-journey-timeline {
                        background: #ffffff;
                        border: 1px solid #e2e8f0;
                        border-radius: 20px;
                        padding: 20px 16px;
                        margin-top: 14px;
                        box-shadow: 0 6px 20px rgba(0,0,0,0.03);
                    }
                    .sp-timeline-row {
                        display: flex;
                        align-items: center;
                        gap: 14px;
                        padding: 12px 0;
                        border-bottom: 1px solid #f1f5f9;
                    }
                    .sp-timeline-row:last-child {
                        border-bottom: none;
                    }
                    .sp-timeline-round-pill {
                        width: 44px;
                        height: 44px;
                        border-radius: 12px;
                        background: #0f172a;
                        color: #CCFF00;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        font-weight: 950;
                        font-size: 0.72rem;
                        line-height: 1;
                        flex-shrink: 0;
                    }
                    .sp-timeline-court-tag {
                        background: #f1f5f9;
                        padding: 3px 8px;
                        border-radius: 6px;
                        font-size: 0.65rem;
                        font-weight: 900;
                        color: #475569;
                    }
                </style>

                <div class="sp-brackets-wrap">
                    <!-- HEADER & TOGGLE -->
                    <div class="sp-brackets-header">
                        <button class="sp-brackets-btn-back" onclick="window.ControlTowerView.switchTab('results')">
                            <i class="fas fa-arrow-left"></i>
                            <span>VER RESULTADOS</span>
                        </button>
                        
                        <div class="sp-brackets-view-toggle">
                            <button class="sp-toggle-btn active" id="sp-btn-view-brackets" onclick="window.ControlTowerBrackets.switchSubView('tree')">
                                <i class="fas fa-sitemap"></i> CUADRO / CRUCES
                            </button>
                            <button class="sp-toggle-btn" id="sp-btn-view-ladder" onclick="window.ControlTowerBrackets.switchSubView('ladder')">
                                <i class="fas fa-stream"></i> ESCALERA DE PISTAS
                            </button>
                        </div>
                    </div>

                    <!-- PLAYER JOURNEY FINDER -->
                    <div class="sp-journey-filter-card">
                        <div class="sp-journey-title">
                            <i class="fas fa-route" style="color: #0ea5e9;"></i>
                            <span>MI RECORRIDO EN EL TORNEO:</span>
                        </div>
                        <select class="sp-journey-select" id="sp-journey-player-select" onchange="window.ControlTowerBrackets.highlightPlayerJourney(this.value)">
                            <option value="">-- Selecciona jugador para ver su ruta --</option>
                            ${playerList.map(name => `<option value="${name.toLowerCase()}">${name}</option>`).join('')}
                        </select>
                    </div>

                    <!-- VIEW CONTAINER 1: BRACKET TREE -->
                    <div id="sp-view-tree" class="sp-bracket-tree">
                        ${rounds.map((r, idx) => {
                            const isFinal = parseInt(r) === totalRounds;
                            const rMatches = roundsMap[r] || [];
                            const colTitle = isFinal ? '🏆 RONDA FINAL' : (parseInt(r) === totalRounds - 1 ? 'SEMIFINALES' : `RONDA ${r}`);

                            return `
                                <div class="sp-bracket-col ${isFinal ? 'final-col' : ''}">
                                    <div class="sp-bracket-col-title">${colTitle}</div>
                                    ${rMatches.map(m => {
                                        const scoreA = parseInt(m.score_a || 0);
                                        const scoreB = parseInt(m.score_b || 0);
                                        const isFinished = m.status === 'finished' || (scoreA + scoreB > 0);
                                        const isWinnerA = isFinished && scoreA > scoreB;
                                        const isWinnerB = isFinished && scoreB > scoreA;
                                        const teamAName = (m.team_a_names || []).join(' & ') || 'POR DEFINIR';
                                        const teamBName = (m.team_b_names || []).join(' & ') || 'POR DEFINIR';
                                        const courtNum = m.court || m.pista || 1;

                                        return `
                                            <div class="sp-bracket-node" data-players="${teamAName.toLowerCase()}|${teamBName.toLowerCase()}">
                                                <div class="sp-bracket-node-header">
                                                    <span class="sp-node-court-tag">PISTA ${courtNum}</span>
                                                    <span>${isFinished ? 'FINALIZADO' : 'EN JUEGO'}</span>
                                                </div>
                                                <div class="sp-bracket-pair ${isWinnerA ? 'winner' : ''}">
                                                    <span class="sp-bracket-pair-name" title="${teamAName}">${teamAName}</span>
                                                    <span class="sp-bracket-pair-score">${scoreA}</span>
                                                </div>
                                                <div class="sp-bracket-pair ${isWinnerB ? 'winner' : ''}">
                                                    <span class="sp-bracket-pair-name" title="${teamBName}">${teamBName}</span>
                                                    <span class="sp-bracket-pair-score">${scoreB}</span>
                                                </div>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            `;
                        }).join('')}
                    </div>

                    <!-- VIEW CONTAINER 2: COURT LADDER (ESCALERA DE PISTAS) -->
                    <div id="sp-view-ladder" class="sp-ladder-view" style="display: none;">
                        ${Array.from({ length: maxCourt }, (_, i) => i + 1).map(cNum => {
                            const isCourt1 = cNum === 1;
                            const matchesOnCourt = matches.filter(m => parseInt(m.court || 1) === cNum);
                            const lastMatch = matchesOnCourt[matchesOnCourt.length - 1];

                            return `
                                <div class="sp-ladder-tier ${isCourt1 ? 'king-tier' : ''}">
                                    <div class="sp-ladder-tier-header">
                                        <div class="sp-ladder-tier-title">
                                            <span>${isCourt1 ? '👑 PISTA 1 (PISTA REINA / CENTRAL)' : `🎾 PISTA ${cNum}`}</span>
                                        </div>
                                        <div>
                                            ${isCourt1 
                                                ? `<span class="sp-ladder-movement-badge badge-up"><i class="fas fa-crown"></i> ZONA DE CAMPEONES</span>`
                                                : `<span class="sp-ladder-movement-badge badge-up"><i class="fas fa-arrow-up"></i> GANA = SUBE A PISTA ${cNum - 1}</span>`
                                            }
                                        </div>
                                    </div>
                                    <div class="sp-ladder-matches-grid">
                                        ${matchesOnCourt.slice(-3).map(m => {
                                            const teamA = (m.team_a_names || []).join(' & ');
                                            const teamB = (m.team_b_names || []).join(' & ');
                                            return `
                                                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:8px 12px; font-size:0.72rem;">
                                                    <div style="font-weight:900; color:#64748b; font-size:0.6rem; margin-bottom:4px;">RONDA ${m.round}</div>
                                                    <div style="display:flex; justify-content:space-between; font-weight:800; color:#0f172a; margin-bottom:2px;">
                                                        <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:140px;">${teamA}</span>
                                                        <span style="font-weight:950;">${m.score_a || 0}</span>
                                                    </div>
                                                    <div style="display:flex; justify-content:space-between; font-weight:800; color:#0f172a;">
                                                        <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:140px;">${teamB}</span>
                                                        <span style="font-weight:950;">${m.score_b || 0}</span>
                                                    </div>
                                                </div>
                                            `;
                                        }).join('')}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>

                    <!-- DYNAMIC PLAYER JOURNEY CONTAINER -->
                    <div id="sp-player-journey-box" style="display:none;" class="sp-journey-timeline">
                        <div style="font-weight:950; color:#0f172a; font-size:0.85rem; margin-bottom:12px; display:flex; align-items:center; gap:8px;">
                            <i class="fas fa-user-astronaut" style="color:#0ea5e9;"></i>
                            <span id="sp-journey-name-title">RECORRIDO DEL JUGADOR</span>
                        </div>
                        <div id="sp-journey-timeline-rows"></div>
                    </div>
                </div>
            `;
        }

        static switchSubView(view) {
            const treeEl = document.getElementById('sp-view-tree');
            const ladderEl = document.getElementById('sp-view-ladder');
            const btnTree = document.getElementById('sp-btn-view-brackets');
            const btnLadder = document.getElementById('sp-btn-view-ladder');

            if (view === 'tree') {
                if (treeEl) treeEl.style.display = 'flex';
                if (ladderEl) ladderEl.style.display = 'none';
                if (btnTree) btnTree.classList.add('active');
                if (btnLadder) btnLadder.classList.remove('active');
            } else {
                if (treeEl) treeEl.style.display = 'none';
                if (ladderEl) ladderEl.style.display = 'flex';
                if (btnTree) btnTree.classList.remove('active');
                if (btnLadder) btnLadder.classList.add('active');
            }
        }

        static highlightPlayerJourney(playerName) {
            const name = (playerName || '').toLowerCase().trim();
            const nodes = document.querySelectorAll('.sp-bracket-node');
            const journeyBox = document.getElementById('sp-player-journey-box');
            const journeyRows = document.getElementById('sp-journey-timeline-rows');
            const journeyTitle = document.getElementById('sp-journey-name-title');

            if (!name) {
                nodes.forEach(n => n.classList.remove('highlighted'));
                if (journeyBox) journeyBox.style.display = 'none';
                return;
            }

            nodes.forEach(n => {
                const p = n.getAttribute('data-players') || '';
                if (p.includes(name)) {
                    n.classList.add('highlighted');
                } else {
                    n.classList.remove('highlighted');
                }
            });

            // Populate journey box
            const allMatches = window.ControlTowerView?.allMatches || [];
            const playerMatches = allMatches.filter(m => {
                const teamA = (m.team_a_names || []).map(x => (x || '').toLowerCase()).join(' ');
                const teamB = (m.team_b_names || []).map(x => (x || '').toLowerCase()).join(' ');
                return teamA.includes(name) || teamB.includes(name);
            }).sort((a, b) => (parseInt(a.round || 1) - parseInt(b.round || 1)));

            if (journeyBox && journeyRows) {
                journeyTitle.innerText = `RECORRIDO DE: ${playerName.toUpperCase()} (${playerMatches.length} PARTIDOS)`;
                journeyRows.innerHTML = playerMatches.map(m => {
                    const isInTeamA = (m.team_a_names || []).some(x => (x || '').toLowerCase().includes(name));
                    const scoreMy = isInTeamA ? (m.score_a || 0) : (m.score_b || 0);
                    const scoreRival = isInTeamA ? (m.score_b || 0) : (m.score_a || 0);
                    const partners = isInTeamA ? m.team_a_names : m.team_b_names;
                    const rivals = isInTeamA ? m.team_b_names : m.team_a_names;
                    const won = parseInt(scoreMy) > parseInt(scoreRival);

                    return `
                        <div class="sp-timeline-row">
                            <div class="sp-timeline-round-pill">
                                <span>R${m.round}</span>
                            </div>
                            <div style="flex:1;">
                                <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                                    <span class="sp-timeline-court-tag"><i class="fas fa-table-tennis"></i> PISTA ${m.court || 1}</span>
                                    <span style="font-weight:900; font-size:0.68rem; color:${won ? '#10b981' : '#ef4444'};">
                                        ${won ? '✅ VICTORIA' : '❌ DERROTA'} (${scoreMy} - ${scoreRival})
                                    </span>
                                </div>
                                <div style="font-size:0.72rem; color:#475569;">
                                    <strong>Con:</strong> ${(partners || []).join(' & ')} • <strong>Vs:</strong> ${(rivals || []).join(' & ')}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('') || '<div style="color:#94a3b8; font-style:italic;">No se han encontrado partidos disputados para este jugador.</div>';

                journeyBox.style.display = 'block';
                journeyBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }

    window.ControlTowerBrackets = ControlTowerBrackets;
})();
