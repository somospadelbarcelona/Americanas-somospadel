/**
 * 🎴 MatchStoryCard.js — Post-Match Shareable Story Generator
 * Genera tarjetas visuales estilo Instagram Story para compartir resultados.
 * Uses html2canvas for rendering. No external dependencies.
 * SomosPadel BCN — 2026
 */
(function () {

    const MatchStoryCard = {

        /**
         * Main entry point — opens the story generator modal.
         * @param {Object} options - { playerName, eventName, eventDate, matches, finalRanking, trajectory, teammateName }
         */
        async open(options = {}) {
            const {
                playerName = 'Jugador',
                eventName = 'Entreno',
                eventDate = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long' }),
                matches = [],
                finalRanking = null,
                totalPoints = 0,
                trajectory = [],
                teammateName = null,
                highestCourt = 1,
                winStreak = 0,
                wins = 0,
                losses = 0,
                playerLevel = null,
                gamesWon = 0,
                gamesLost = 0,
                bestResult = null,    // e.g. '6-2 en Pista 1'
                matchScores = []      // Array of '{score}' strings per round
            } = options;

            // Create modal overlay
            const overlay = document.createElement('div');
            overlay.id = 'story-card-overlay';
            overlay.style.cssText = `
                position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                z-index: 99999; background: rgba(0,0,0,0.95);
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                font-family: 'Outfit', sans-serif; overflow-y: auto; padding: 20px;
            `;

            overlay.innerHTML = `
                <div style="width: 100%; max-width: 400px; position: relative;">
                    
                    <!-- Close Button -->
                    <button onclick="document.getElementById('story-card-overlay').remove()" 
                        style="position: absolute; top: -50px; right: 0; background: rgba(255,255,255,0.1); border: none; 
                               color: white; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; 
                               font-size: 1.2rem; display: flex; align-items: center; justify-content: center;">
                        ✕
                    </button>

                    <p style="text-align: center; color: #666; font-size: 0.7rem; text-transform: uppercase; 
                               letter-spacing: 2px; margin-bottom: 15px; font-weight: 800;">
                        TU TARJETA DE RESULTADO
                    </p>

                    <!-- THE CARD (9:16 ratio) -->
                    <div id="match-story-card" style="
                        width: 360px; min-height: 560px; height: auto; margin: 0 auto;
                        background: linear-gradient(145deg, #0a0a0a 0%, #111 50%, #0d1a00 100%);
                        border-radius: 28px; position: relative; overflow: hidden;
                        border: 1px solid rgba(204,255,0,0.15);
                        box-shadow: 0 0 60px rgba(204,255,0,0.1), 0 30px 60px rgba(0,0,0,0.8);
                    ">
                        <!-- Background pattern -->
                        <div style="position: absolute; inset: 0; background: 
                            radial-gradient(ellipse at 20% 20%, rgba(204,255,0,0.08) 0%, transparent 50%),
                            radial-gradient(ellipse at 80% 80%, rgba(0,200,100,0.05) 0%, transparent 50%);
                            pointer-events: none;"></div>
                        
                        <!-- Grid lines decorative -->
                        <svg style="position:absolute; inset:0; opacity:0.04; pointer-events:none;" width="360" height="640">
                            ${Array(10).fill(0).map((_, i) => `<line x1="${i*40}" y1="0" x2="${i*40}" y2="640" stroke="#CCFF00" stroke-width="1"/>`).join('')}
                            ${Array(16).fill(0).map((_, i) => `<line x1="0" y1="${i*40}" x2="360" y2="${i*40}" stroke="#CCFF00" stroke-width="1"/>`).join('')}
                        </svg>

                        <!-- Neon corner accent -->
                        <div style="position:absolute; top:0; left:0; width:100px; height:4px; background: linear-gradient(90deg, #CCFF00, transparent);"></div>
                        <div style="position:absolute; top:0; left:0; width:4px; height:100px; background: linear-gradient(180deg, #CCFF00, transparent);"></div>
                        <div style="position:absolute; bottom:0; right:0; width:100px; height:4px; background: linear-gradient(270deg, #CCFF00, transparent);"></div>
                        <div style="position:absolute; bottom:0; right:0; width:4px; height:100px; background: linear-gradient(0deg, #CCFF00, transparent);"></div>

                        <!-- Content -->
                        <div style="position: relative; z-index: 2; height: 100%; display: flex; flex-direction: column; padding: 24px 24px 20px;">
                            
                            <!-- Header -->
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <div style="width: 28px; height: 28px; background: #CCFF00; border-radius: 7px; display: flex; align-items: center; justify-content: center; font-size: 0.9rem;">🎾</div>
                                    <div>
                                        <div style="color: #CCFF00; font-size: 0.5rem; font-weight: 950; text-transform: uppercase; letter-spacing: 2px; line-height: 1;">SOMOSPADEL BCN</div>
                                        <div style="color: rgba(255,255,255,0.4); font-size: 0.45rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">${eventDate}</div>
                                    </div>
                                </div>
                                <div style="background: rgba(204,255,0,0.1); border: 1px solid rgba(204,255,0,0.3); padding: 3px 8px; border-radius: 20px; color: #CCFF00; font-size: 0.48rem; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">
                                    ${eventName.replace('[ENT]','').replace('[AMS]','').trim().substring(0,20)}
                                </div>
                            </div>

                            <!-- Player name + Level -->
                            <div style="margin-bottom: 12px;">
                                <div style="color: rgba(255,255,255,0.35); font-size: 0.5rem; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 2px;">JUGADOR</div>
                                <div style="color: white; font-size: 1.5rem; font-weight: 950; text-transform: uppercase; letter-spacing: -1px; line-height: 1;">${playerName}</div>
                                <div style="display:flex; align-items:center; gap:10px; margin-top:4px;">
                                    ${teammateName ? `<div style="color: rgba(204,255,0,0.8); font-size: 0.65rem; font-weight: 800;">🤝 con ${teammateName}</div>` : ''}
                                    ${playerLevel ? `<div style="background: rgba(255,255,255,0.08); padding: 2px 8px; border-radius: 8px; color: rgba(255,255,255,0.5); font-size: 0.5rem; font-weight: 800;">LVL ${parseFloat(playerLevel).toFixed(2)}</div>` : ''}
                                </div>
                            </div>

                            <!-- Ranking Banner OR Win Rate fallback -->
                            ${finalRanking ? `
                            <div style="background: linear-gradient(135deg, rgba(204,255,0,0.15) 0%, rgba(0,200,80,0.06) 100%);
                                        border: 1px solid rgba(204,255,0,0.25); border-radius: 16px; 
                                        padding: 12px 16px; margin-bottom: 12px; display:flex; align-items:center; justify-content: space-between;">
                                <div>
                                    <div style="color: rgba(255,255,255,0.4); font-size: 0.45rem; font-weight: 900; text-transform: uppercase; letter-spacing: 2px;">CLASIFICACIÓN FINAL</div>
                                    <div style="color: #CCFF00; font-size: 2.8rem; font-weight: 950; line-height: 1; margin-top:2px;">#${finalRanking}</div>
                                </div>
                                <div style="text-align:right;">
                                    <div style="color: white; font-size: 1.6rem; font-weight: 950; line-height:1;">${totalPoints}</div>
                                    <div style="color: rgba(255,255,255,0.4); font-size: 0.45rem; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">PUNTOS</div>
                                    ${finalRanking === 1 ? '<div style="font-size:1.5rem; margin-top:2px;">🏆</div>' : finalRanking === 2 ? '<div style="font-size:1.5rem; margin-top:2px;">🥈</div>' : finalRanking === 3 ? '<div style="font-size:1.5rem; margin-top:2px;">🥉</div>' : ''}
                                </div>
                            </div>` : `
                            <div style="background: linear-gradient(135deg, rgba(204,255,0,0.1) 0%, rgba(0,200,80,0.05) 100%);
                                        border: 1px solid rgba(204,255,0,0.2); border-radius: 16px; 
                                        padding: 12px 16px; margin-bottom: 12px; display:flex; align-items:center; justify-content: space-between;">
                                <div>
                                    <div style="color: rgba(255,255,255,0.4); font-size: 0.45rem; font-weight: 900; text-transform: uppercase; letter-spacing: 2px;">RENDIMIENTO</div>
                                    <div style="color: #CCFF00; font-size: 2.4rem; font-weight: 950; line-height: 1; margin-top:2px;">${wins + losses > 0 ? Math.round(wins/(wins+losses)*100) : 0}%</div>
                                    <div style="color: rgba(255,255,255,0.4); font-size: 0.45rem; font-weight: 700; text-transform: uppercase;">WIN RATE</div>
                                </div>
                                <div style="text-align:right;">
                                    <div style="color: white; font-size: 1.6rem; font-weight: 950; line-height:1;">${wins * 3 + losses}</div>
                                    <div style="color: rgba(255,255,255,0.4); font-size: 0.45rem; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">PUNTOS TOT.</div>
                                    <div style="font-size:1.4rem; margin-top:4px;">${wins === (wins+losses) && wins > 0 ? '🏆 PERFECTO' : winStreak >= 4 ? '🔥 EN RACHA' : wins > losses ? '💪 GRAN SESIÓN' : ''}</div>
                                </div>
                            </div>`}

                            <!-- Stats row -->
                            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 8px; margin-bottom: 12px;">
                                <div style="background: rgba(204,255,0,0.06); border: 1px solid rgba(204,255,0,0.15); border-radius: 12px; padding: 10px 6px; text-align: center;">
                                    <div style="color: #CCFF00; font-size: 1.3rem; font-weight: 950;">${wins}</div>
                                    <div style="color: rgba(255,255,255,0.35); font-size: 0.42rem; font-weight: 900; text-transform: uppercase;">Wins</div>
                                </div>
                                <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 10px 6px; text-align: center;">
                                    <div style="color: rgba(255,100,100,0.9); font-size: 1.3rem; font-weight: 950;">${losses}</div>
                                    <div style="color: rgba(255,255,255,0.35); font-size: 0.42rem; font-weight: 900; text-transform: uppercase;">Loss</div>
                                </div>
                                <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 10px 6px; text-align: center;">
                                    <div style="color: white; font-size: 1.3rem; font-weight: 950;">${gamesWon}</div>
                                    <div style="color: rgba(255,255,255,0.35); font-size: 0.42rem; font-weight: 900; text-transform: uppercase;">Juegos</div>
                                </div>
                                <div style="background: ${winStreak >= 4 ? 'rgba(204,255,0,0.08)' : 'rgba(255,255,255,0.03)'}; border: 1px solid ${winStreak >= 4 ? 'rgba(204,255,0,0.2)' : 'rgba(255,255,255,0.06)'}; border-radius: 12px; padding: 10px 6px; text-align: center;">
                                    <div style="color: ${winStreak >= 3 ? '#CCFF00' : 'white'}; font-size: 1rem; font-weight: 950;">${winStreak}🔥</div>
                                    <div style="color: rgba(255,255,255,0.35); font-size: 0.42rem; font-weight: 900; text-transform: uppercase;">Racha</div>
                                </div>
                            </div>

                            <!-- Best result banner -->
                            ${bestResult ? `
                            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 10px 14px; margin-bottom: 12px; display:flex; align-items:center; justify-content:space-between;">
                                <div style="color: rgba(255,255,255,0.4); font-size: 0.5rem; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">🏅 Mejor resultado</div>
                                <div style="color: #CCFF00; font-size: 0.75rem; font-weight: 950;">${bestResult}</div>
                            </div>` : ''}

                            <!-- Match Scores per round -->
                            ${matchScores.length > 0 ? `
                            <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 14px; padding: 12px 14px; margin-bottom: 12px;">
                                <div style="color: rgba(255,255,255,0.35); font-size: 0.47rem; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px;">RESULTADOS POR RONDA</div>
                                <div style="display:flex; gap:6px; flex-wrap:wrap;">
                                    ${matchScores.map((s, i) => {
                                        const isWin = s.win;
                                        return `<div style="display:flex; flex-direction:column; align-items:center; gap:2px;">
                                            <div style="font-size: 0.4rem; color: rgba(255,255,255,0.3); font-weight: 700;">R${i+1}</div>
                                            <div style="background: ${isWin ? 'rgba(204,255,0,0.12)' : 'rgba(255,60,60,0.1)'}; border: 1px solid ${isWin ? 'rgba(204,255,0,0.25)' : 'rgba(255,60,60,0.2)'}; border-radius: 8px; padding: 4px 7px; color: ${isWin ? '#CCFF00' : 'rgba(255,100,100,0.9)'}; font-size: 0.55rem; font-weight: 900; white-space:nowrap;">${s.score}</div>
                                        </div>`;
                                    }).join('')}
                                </div>
                            </div>` : ''}

                            <!-- Trajectory -->
                            ${trajectory.length > 0 ? `
                            <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 14px; padding: 12px 14px;">
                                <div style="color: rgba(255,255,255,0.35); font-size: 0.47rem; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px;">TRAYECTORIA EN EL POZO</div>
                                <div style="display: flex; align-items: flex-end; gap: 5px; height: 44px;">
                                    ${(() => {
                                        const maxCourt = Math.max(...trajectory);
                                        return trajectory.map((court, i) => {
                                            const isLast = i === trajectory.length - 1;
                                            const barH = Math.max(8, ((maxCourt - court + 1) / (maxCourt || 1)) * 36);
                                            const color = court === 1 ? '#CCFF00' : court === 2 ? 'rgba(204,255,0,0.5)' : 'rgba(255,255,255,0.15)';
                                            return `<div style="display:flex; flex-direction:column; align-items:center; gap:3px; flex:1;">
                                                <div style="font-size:0.38rem; color:${color}; font-weight:900;">P${court}</div>
                                                <div style="width:100%; height:${barH}px; background:${isLast ? '#CCFF00' : color}; border-radius:3px 3px 0 0; ${isLast ? 'box-shadow:0 0 8px rgba(204,255,0,0.5);' : ''}"></div>
                                            </div>`;
                                        }).join('');
                                    })()}
                                </div>
                                <div style="text-align:center; margin-top:6px; color:rgba(255,255,255,0.25); font-size:0.42rem; font-weight:700;">
                                    PISTA MÁS ALTA: #${highestCourt} ${highestCourt === 1 ? '🏆' : highestCourt <= 2 ? '🥈' : ''}
                                </div>
                            </div>` : ''}

                            <!-- Footer -->
                            <div style="padding-top:16px; display: flex; justify-content: space-between; align-items: center;">
                                <div style="color: rgba(255,255,255,0.15); font-size: 0.45rem; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">somospadel.app</div>
                                <div style="display: flex; gap: 4px;">
                                    <div style="width: 5px; height: 5px; border-radius: 50%; background: #CCFF00; box-shadow: 0 0 6px #CCFF00;"></div>
                                    <div style="width: 5px; height: 5px; border-radius: 50%; background: rgba(204,255,0,0.3);"></div>
                                    <div style="width: 5px; height: 5px; border-radius: 50%; background: rgba(204,255,0,0.1);"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Action Buttons -->
                    <div style="display: flex; gap: 12px; margin-top: 20px; justify-content: center;">
                        <button onclick="window.MatchStoryCard.downloadCard()" style="
                            flex: 1; max-width: 180px; background: #CCFF00; border: none; color: #000;
                            padding: 14px; border-radius: 16px; font-weight: 900; font-size: 0.85rem;
                            text-transform: uppercase; letter-spacing: 1px; cursor: pointer;
                            display: flex; align-items: center; justify-content: center; gap: 8px;
                        ">
                            <span>⬇️</span> Descargar
                        </button>
                        <button onclick="window.MatchStoryCard.shareCard()" style="
                            flex: 1; max-width: 180px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: white;
                            padding: 14px; border-radius: 16px; font-weight: 900; font-size: 0.85rem;
                            text-transform: uppercase; letter-spacing: 1px; cursor: pointer;
                            display: flex; align-items: center; justify-content: center; gap: 8px;
                        ">
                            <span>📤</span> Compartir
                        </button>
                    </div>

                    <!-- VOLVER button — prominente y fácil de pulsar -->
                    <button onclick="document.getElementById('story-card-overlay').remove()" style="
                        display: block; width: 100%; max-width: 376px; margin: 12px auto 4px;
                        background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
                        color: rgba(255,255,255,0.6); padding: 14px; border-radius: 16px;
                        font-weight: 900; font-size: 0.85rem; text-transform: uppercase;
                        letter-spacing: 1px; cursor: pointer;
                        display: flex; align-items: center; justify-content: center; gap: 8px;
                    ">
                        ← VOLVER
                    </button>

                    <p style="text-align:center; color: rgba(255,255,255,0.15); font-size: 0.55rem; margin-top: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
                        Mantén pulsado la imagen para guardar en iOS
                    </p>
                </div>
            `;

            document.body.appendChild(overlay);
            // Close on backdrop click
            overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
        },

        /**
         * Downloads the card as a PNG image using html2canvas.
         */
        async downloadCard() {
            const card = document.getElementById('match-story-card');
            if (!card) return;
            try {
                const btn = event.target;
                const originalText = btn.innerHTML;
                btn.innerHTML = '⏳ Generando...';
                btn.disabled = true;

                const canvas = await html2canvas(card, {
                    scale: 3,  // High res (3x for retina/Instagram quality)
                    useCORS: true,
                    backgroundColor: null,
                    logging: false
                });

                const link = document.createElement('a');
                link.download = `somospadel_result_${Date.now()}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();

                btn.innerHTML = '✅ Descargado!';
                setTimeout(() => { btn.innerHTML = originalText; btn.disabled = false; }, 2000);
            } catch (err) {
                console.error('Error generating card:', err);
                alert('Error generando la imagen. Intenta de nuevo.');
            }
        },

        /**
         * Shares the card using the Web Share API (mobile) or falls back to download.
         */
        async shareCard() {
            const card = document.getElementById('match-story-card');
            if (!card) return;

            try {
                const canvas = await html2canvas(card, { scale: 3, useCORS: true, backgroundColor: null, logging: false });

                canvas.toBlob(async (blob) => {
                    const file = new File([blob], 'somospadel_result.png', { type: 'image/png' });

                    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                        await navigator.share({
                            title: '¡Mis resultados en SomosPadel BCN! 🎾',
                            text: 'Mira cómo quedé hoy en el entreno. ¡Seguimos mejorando! #SomosPadel #PadelBCN',
                            files: [file]
                        });
                    } else {
                        // Fallback: open image in new tab so user can long-press to save
                        const url = URL.createObjectURL(blob);
                        window.open(url, '_blank');
                    }
                }, 'image/png');
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Share error:', err);
                    this.downloadCard();
                }
            }
        },

        /**
         * Builds story data from a player's event history and opens the card.
         * @param {String} playerId 
         * @param {String} eventId 
         * @param {String} eventType  'entreno' or 'americana'
         */
        async openFromEvent(playerId, eventId, eventType = 'entreno') {
            try {
                const user = window.Store?.getState('currentUser');
                const matchesColl = eventType === 'entreno' ? 'entrenos_matches' : 'matches';
                const eventColl = eventType === 'entreno' ? 'entrenos' : 'americanas';

                const [eventSnap, matchesSnap] = await Promise.all([
                    window.db.collection(eventColl).doc(eventId).get(),
                    window.db.collection(matchesColl).where('americana_id', '==', eventId).get()
                ]);

                if (!eventSnap.exists) { alert('Evento no encontrado'); return; }

                const event = eventSnap.data();
                const allMatches = matchesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

                // Filter player's matches
                const pid = String(playerId || user?.uid || user?.id);
                const myMatches = allMatches.filter(m => {
                    const teamA = (m.team_a_ids || []).map(String);
                    const teamB = (m.team_b_ids || []).map(String);
                    return teamA.includes(pid) || teamB.includes(pid);
                }).filter(m => m.status === 'finished');

                // Compute stats
                let wins = 0, losses = 0, winStreak = 0, currentStreak = 0;
                let gamesWon = 0, gamesLost = 0;
                const trajectory = [];
                const matchScores = [];
                let teammateName = null;
                let bestResult = null;
                let bestResultScore = -1;

                const sortedMatches = myMatches.sort((a, b) => parseInt(a.round) - parseInt(b.round));
                sortedMatches.forEach(m => {
                    const isTeamA = (m.team_a_ids || []).map(String).includes(pid);
                    const scoreMe = parseInt(isTeamA ? m.score_a : m.score_b) || 0;
                    const scoreThem = parseInt(isTeamA ? m.score_b : m.score_a) || 0;
                    const won = scoreMe > scoreThem;

                    gamesWon += scoreMe;
                    gamesLost += scoreThem;

                    if (won) {
                        wins++; currentStreak++; winStreak = Math.max(winStreak, currentStreak);
                        // Track best win by highest score difference
                        if ((scoreMe - scoreThem) > bestResultScore) {
                            bestResultScore = scoreMe - scoreThem;
                            bestResult = `${scoreMe}-${scoreThem} en Pista ${m.court || '?'}`;
                        }
                    } else { losses++; currentStreak = 0; }

                    matchScores.push({ score: `${scoreMe}-${scoreThem}`, win: won });
                    trajectory.push(parseInt(m.court) || 1);

                    // Find teammate FULL name
                    if (!teammateName) {
                        const myTeam = isTeamA ? (m.team_a_names || []) : (m.team_b_names || []);
                        const myTeamIds = isTeamA ? (m.team_a_ids || []).map(String) : (m.team_b_ids || []).map(String);
                        const partnerIdx = myTeamIds.findIndex(id => id !== pid);
                        if (partnerIdx >= 0 && myTeam[partnerIdx]) {
                            teammateName = myTeam[partnerIdx]; // Full name
                        }
                    }
                });

                const highestCourt = trajectory.length > 0 ? Math.min(...trajectory) : 1;
                const finalRanking = this._getPlayerRanking(event, pid, wins, losses);
                const totalPoints = event.standings?.find(s => String(s.playerId || s.id) === pid)?.points || wins * 3;
                const eventDate = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long' });
                const playerLevel = user?.level || event.players?.find(p => String(p.id || p.uid) === pid)?.level || null;

                this.open({
                    playerName: user?.name || 'Jugador',
                    eventName: event.nombre || event.title || event.name || 'Entreno',
                    eventDate,
                    matches: sortedMatches,
                    finalRanking,
                    totalPoints,
                    trajectory,
                    teammateName,
                    highestCourt,
                    winStreak,
                    wins,
                    losses,
                    gamesWon,
                    gamesLost,
                    bestResult,
                    matchScores,
                    playerLevel
                });

            } catch (err) {
                console.error('MatchStoryCard error:', err);
                alert('Error al generar tu tarjeta: ' + err.message);
            }
        },

        _getPlayerRanking(event, pid, wins, losses) {
            // Try from event standings first
            if (event.standings) {
                const idx = event.standings.findIndex(s => String(s.playerId || s.id) === pid);
                if (idx >= 0) return idx + 1;
            }
            // Fallback: from pairs if fixed pairs mode
            if (event.fixed_pairs) {
                const sorted = [...event.fixed_pairs].sort((a, b) => (b.wins || 0) - (a.wins || 0));
                const idx = sorted.findIndex(p => String(p.player1_id) === pid || String(p.player2_id) === pid);
                if (idx >= 0) return Math.floor(idx / 2) + 1;
            }
            return null;
        }
    };

    window.MatchStoryCard = MatchStoryCard;
    console.log('🎴 MatchStoryCard Loaded');
})();
