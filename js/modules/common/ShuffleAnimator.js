/**
 * ShuffleAnimator.js
 * handles ultra-high-impact animations for draw/shuffle events.
 * Version: 3.0 Cinema Edition (Professional Tournament Style)
 */
(function () {
    'use strict';

    class ShuffleAnimator {
        constructor() {
            this.isAnimating = false;
        }

        animate(data, onComplete) {
            if (this.isAnimating) return;
            this.isAnimating = true;

            const overlay = document.createElement('div');
            overlay.id = 'shuffle-animator-overlay';
            overlay.style.cssText = `
                position: fixed; inset: 0; background: radial-gradient(circle at center, #0a192f 0%, #000 100%); z-index: 999999;
                display: flex; flex-direction: column; align-items: center;
                font-family: 'Outfit', sans-serif; color: white; 
                overflow-x: hidden; overflow-y: auto; padding: 40px 0 120px;
                opacity: 0; transition: opacity 1s cubic-bezier(0.4, 0, 0.2, 1);
            `;

            overlay.innerHTML = `
                <!-- SKY BEAMS AND VORTEX EFFECTS -->
                <div class="sky-beam beam-1"></div>
                <div class="sky-beam beam-2"></div>
                <div class="vortex-container"></div>
                <div class="tv-scanlines"></div>
                <div class="noise-overlay"></div>
                
                
                <div id="shuffle-header" style="text-align: center; margin-bottom: 60px; z-index: 10; animation: tvHeaderEntry 1.2s both cubic-bezier(0.19, 1, 0.22, 1); flex-shrink: 0; position: relative;">
                    <div class="tv-live-badge"><span class="pulse-dot"></span> EN VIVO</div>
                    <h1 style="font-size: 5rem; font-weight: 1000; margin: 0; text-transform: uppercase; letter-spacing: -5px; line-height: 0.75; position: relative;">
                        <span style="color: #fff; text-shadow: 0 0 40px rgba(255,255,255,0.4);">SORTEO</span><br>
                        <span class="metallic-text">RONDA ${data.round}</span>
                    </h1>
                    <div class="tv-sub-stats">
                        <span style="color: #CCFF00; text-shadow: 0 0 15px rgba(204,255,0,0.6);">SOMOSPADEL BCN</span> • <span style="color: #fff; opacity: 0.9; letter-spacing: 5px;">COMPITE Y DISFRUTA</span>
                    </div>
                </div>

                <div id="shuffle-container" style="display: flex; flex-wrap: wrap; justify-content: center; gap: 40px; width: 98%; max-width: 1600px; z-index: 10; flex: 1; perspective: 1000px;">
                    <!-- Court slots populated via JS -->
                </div>

                <canvas id="shuffle-canvas" style="position: fixed; inset: 0; z-index: 1; opacity: 0.6; pointer-events: none;"></canvas>

                <!-- BOTTOM TV GRAPHIC (SCOREBOARD STYLE) -->
                <div class="tv-bottom-bar">
                    <div class="tv-bar-content">
                        <div class="tv-logo-mini">Σ</div>
                        <div class="tv-ticker">
                            <div class="ticker-text" id="shuffle-status-marquee">PREPARANDO PISTAS AZULES • CALCULANDO CRUCES POR NIVEL • SINCRONIZANDO RANKING GLOBAL • SOMOSPADEL BCN LIVE • </div>
                        </div>
                        <div class="tv-clock" id="shuffle-timer">00:00</div>
                    </div>
                </div>

                <button id="close-shuffle" class="tv-close-btn">
                    <i class="fas fa-times"></i>
                </button>

                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100..950&display=swap');
                    @keyframes tvHeaderEntry { from { opacity: 0; transform: translateY(-40px) scale(0.8) rotateX(20deg); filter: blur(20px); } to { opacity: 1; transform: translateY(0) scale(1) rotateX(0); filter: blur(0); } }
                    
                    .tv-live-badge {
                        background: linear-gradient(90deg, #ff0000, #cc0000); color: white; padding: 6px 18px; border-radius: 6px; font-weight: 950; font-size: 0.75rem; 
                        display: inline-flex; align-items: center; gap: 10px; margin-bottom: 15px; letter-spacing: 2px; box-shadow: 0 0 30px rgba(255,0,0,0.5);
                        animation: tvPulse 1.2s infinite; border: 1px solid rgba(255,255,255,0.3);
                    }
                    .pulse-dot { width: 8px; height: 8px; background: #fff; border-radius: 50%; box-shadow: 0 0 10px #fff; }
                    @keyframes tvPulse { 0%, 100% { transform: scale(1); filter: brightness(1); } 50% { transform: scale(1.1); filter: brightness(1.3); } }

                    .metallic-text {
                        background: linear-gradient(to bottom, #fff 20%, #00C4FF 50%, #CCFF00 80%);
                        -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                        filter: drop-shadow(0 0 25px rgba(0,196,255,0.6));
                        animation: metalShine 2s infinite linear;
                    }
                    @keyframes metalShine { from { filter: hue-rotate(0deg) drop-shadow(0 0 25px rgba(0,196,255,0.6)); } to { filter: hue-rotate(360deg) drop-shadow(0 0 25px rgba(204,255,0,0.6)); } }

                    .tv-sub-stats {
                        color: rgba(255,255,255,0.5); font-size: 0.65rem; font-weight: 900; letter-spacing: 3px; margin-top: 20px;
                    }

                    .level-badge-pro {
                        color: #000; font-size: 0.7rem; font-weight: 1000; padding: 2px 8px; border-radius: 4px;
                        margin-left: 6px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.3);
                        transition: all 0.3s;
                    }
                    .team-label-pro {
                        color: rgba(255,255,255,0.7); font-size: 0.65rem; font-weight: 900; text-transform: uppercase;
                        letter-spacing: 1px;
                    }

                    .vs-badge-massive {
                        font-size: 2.8rem; font-weight: 1000; letter-spacing: -3px; line-height: 1;
                        background: linear-gradient(135deg, #FF2D55 0%, #00C4FF 100%);
                        -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                        filter: drop-shadow(0 0 15px rgba(255,45,85,0.5));
                        animation: vsMassivePulse 1s infinite alternate cubic-bezier(0.45, 0, 0.55, 1);
                        margin: 15px 0; z-index: 100; align-self: center; position: relative;
                    }
                    @keyframes vsMassivePulse { from { transform: scale(1) rotate(-5deg); filter: brightness(1) drop-shadow(0 0 15px rgba(255,45,85,0.5)); } to { transform: scale(1.15) rotate(5deg); filter: brightness(1.3) drop-shadow(0 0 25px rgba(0,196,255,0.7)); } }
                    .vs-badge-massive::before { content: 'VS'; position: absolute; inset: 0; filter: blur(10px); opacity: 0.5; z-index: -1; }

                    .court-slot {
                        width: 400px; height: 560px; position: relative; border-radius: 24px;
                        transition: all 0.6s cubic-bezier(0.19, 1, 0.22, 1);
                        transform: rotateY(20deg) translateZ(-100px); opacity: 0;
                        background: #000; border: 1px solid rgba(0,196,255,0.2);
                        box-shadow: 0 30px 80px rgba(0,0,0,0.9);
                        display: flex; flex-direction: column; overflow: hidden;
                        perspective: 1000px;
                    }
                    .court-slot.visible { transform: rotateY(0) translateZ(0); opacity: 1; }
                    
                    /* REALISTIC PADEL COURT 3D */
                    .court-container-3d {
                        height: 250px; width: 100%; position: relative; background: #001a33;
                        display: flex; align-items: center; justify-content: center;
                        overflow: hidden; border-bottom: 2px solid rgba(255,255,255,0.1);
                    }
                    .padel-court-floor {
                        width: 140%; height: 200%; background: #004fb0;
                        transform: rotateX(60deg) translateY(-20%);
                        position: relative; box-shadow: inset 0 0 100px rgba(0,0,0,0.5);
                        background-image: 
                            radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 80%),
                            url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.6' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
                    }
                    .court-lines {
                        position: absolute; inset: 10%; border: 3px solid rgba(255,255,255,0.6);
                        box-shadow: 0 0 15px rgba(255,255,255,0.2);
                    }
                    .court-center-line {
                        position: absolute; top: 0; left: 50%; width: 3px; height: 100%; background: rgba(255,255,255,0.6);
                    }
                    .court-service-line {
                        position: absolute; top: 30%; left: 10%; width: 80%; height: 3px; background: rgba(255,255,255,0.6);
                    }
                    .court-net-3d {
                        position: absolute; top: 48%; left: 0; width: 100%; height: 15px; 
                        background: repeating-linear-gradient(45deg, #111 0 2px, #333 2px 4px);
                        border-top: 2px solid #fff; z-index: 10; transform: translateZ(10px);
                    }
                    .stadium-light {
                        position: absolute; width: 40px; height: 40px; background: radial-gradient(circle, #fff 0%, transparent 70%);
                        opacity: 0.4; z-index: 20; filter: blur(5px);
                    }
                    .light-top-l { top: 10px; left: 10px; }
                    .light-top-r { top: 10px; right: 10px; }

                    .pista-name-overlay {
                        position: absolute; color: #fff; font-weight: 1000; font-size: 4rem; letter-spacing: -4px;
                        z-index: 50; transform: translateY(-10px);
                        background: linear-gradient(to bottom, #fff, #999); -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                        filter: drop-shadow(0 10px 30px rgba(0,0,0,1));
                    }
                    
                    .tv-court-badge {
                        position: absolute; top: 15px; left: 15px; background: #CCFF00; color: #000; padding: 4px 12px; border-radius: 6px; font-weight: 1000; font-size: 0.65rem;
                        box-shadow: 0 0 20px rgba(204,255,0,0.6); z-index: 100;
                    }

                    .players-section { flex: 1; padding: 20px; display: flex; flex-direction: column; justify-content: space-between; background: linear-gradient(to bottom, #080808, #000); }

                    .slot-name { 
                        height: 56px; position: relative; border-radius: 12px; margin: 5px 0; 
                        background: rgba(255,255,255,0.03); border-left: 8px solid #00C4FF;
                        overflow: hidden; display: flex; align-items: center; padding: 0 20px;
                        transition: all 0.4s; box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                    }
                    .slot-name.revealed { background: linear-gradient(90deg, rgba(0,196,255,0.15), transparent); border-left-color: #00C4FF; }
                    .slot-name.opponent { border-left-color: #FF2D55; border-right: 0; }
                    .slot-name.opponent.revealed { background: linear-gradient(-90deg, rgba(255,45,85,0.15), transparent); border-left-color: #FF2D55; }

                    .scrolling-names {
                        color: rgba(0, 196, 255, 0.4); font-weight: 1000; font-size: 0.7rem;
                        animation: tvNameScroll 0.4s infinite linear;
                    }
                    @keyframes tvNameScroll { 0% { transform: translateY(50%); } 100% { transform: translateY(-50%); } }
                    
                    @keyframes playerEntrance {
                        0% { transform: translateX(-100%) skewX(15deg); opacity: 0; filter: blur(10px) brightness(2); }
                        100% { transform: translateX(0) skewX(0); opacity: 1; filter: blur(0) brightness(1); }
                    }
                    @keyframes opponentEntrance {
                        0% { transform: translateX(100%) skewX(-15deg); opacity: 0; filter: blur(10px) brightness(2); }
                        100% { transform: translateX(0) skewX(0); opacity: 1; filter: blur(0) brightness(1); }
                    }

                    .winner-name-container {
                        display: flex; flex-direction: column; width: 100%;
                    }
                    .winner-name { 
                        color: #fff; font-size: 1.15rem; font-weight: 1000; letter-spacing: 0.5px; line-height: 1.2;
                    }
                    .slot-name:not(.opponent) .winner-name { animation: playerEntrance 0.5s both cubic-bezier(0.175, 0.885, 0.32, 1.275); }
                    .slot-name.opponent .winner-name { animation: opponentEntrance 0.5s both cubic-bezier(0.175, 0.885, 0.32, 1.275); text-align: right; }
                    .slot-name.opponent { justify-content: flex-end; padding-right: 20px; border-left: 0; border-right: 8px solid #FF2D55; }
                    
                    .player-meta-badges {
                        display: flex; align-items: center; gap: 6px; margin-top: 4px;
                    }
                    .slot-name:not(.opponent) .player-meta-badges { animation: playerMetaEntrance 0.6s 0.2s both ease-out; }
                    .slot-name.opponent .player-meta-badges { animation: playerMetaEntrance 0.6s 0.2s both ease-out; justify-content: flex-end; }
                    @keyframes playerMetaEntrance { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

                    .level-badge-pro {
                        background: rgba(255,255,255,0.1); color: #fff;
                        font-size: 0.65rem; font-weight: 1000; padding: 2px 6px; border-radius: 3px;
                        border: 1px solid rgba(255,255,255,0.2); margin-left: 4px;
                    }
                    .team-label-pro {
                        color: #CCFF00; font-size: 0.65rem; font-weight: 1000; text-transform: uppercase;
                        letter-spacing: 1px;
                    }

                    /* TV HUD STYLES */
                    .tv-bottom-bar {
                        position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
                        width: 95%; max-width: 1200px; height: 75px; background: rgba(10,10,10,0.95);
                        border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); overflow: hidden; z-index: 1000;
                        box-shadow: 0 30px 80px rgba(0,0,0,1); backdrop-filter: blur(25px);
                    }
                    .tv-bar-content { display: flex; height: 100%; align-items: center; }
                    .tv-logo-mini { width: 75px; background: #CCFF00; color: #000; display: flex; align-items: center; justify-content: center; font-weight: 1000; font-size: 2rem; height: 100%; }
                    .tv-ticker { flex: 1; padding: 0 30px; overflow: hidden; }
                    .ticker-text { white-space: nowrap; font-weight: 950; font-size: 1rem; color: #fff; letter-spacing: 2px; animation: tvTicker 15s linear infinite; text-transform: uppercase; }
                    @keyframes tvTicker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
                    .tv-clock { width: 140px; background: rgba(255,255,255,0.03); height: 100%; display: flex; align-items: center; justify-content: center; font-weight: 1000; font-size: 1.3rem; color: #CCFF00; border-left: 1px solid rgba(255,255,255,0.1); }

                    .tv-close-btn { 
                        position: fixed; top: 30px; right: 30px; width: 70px; height: 70px; background: #CCFF00; border: none; 
                        border-radius: 20px; cursor: pointer; display: none; z-index: 2000; color: #000; font-size: 1.8rem;
                        box-shadow: 0 10px 50px rgba(204,255,0,0.5); transition: all 0.3s;
                    }
                    .tv-close-btn:hover { transform: scale(1.15) rotate(90deg); background: #fff; }

                    /* LIGHT ANIMATIONS */
                    .sky-beam { position: fixed; width: 3px; height: 250%; background: linear-gradient(to top, transparent, rgba(0,196,255,0.5), transparent); top: -75%; z-index: 0; }
                    .beam-1 { left: 30%; transform: rotate(15deg); animation: beamMove 5s infinite alternate ease-in-out; }
                    .beam-2 { right: 30%; transform: rotate(-15deg); animation: beamMove 7s infinite alternate-reverse ease-in-out; }
                    @keyframes beamMove { from { transform: rotate(10deg) translateX(-80px); } to { transform: rotate(25deg) translateX(80px); } }

                    .vortex-container {
                        position: fixed; inset: 0; pointer-events: none; opacity: 0.15;
                        background: radial-gradient(circle at center, transparent 30%, #00C4FF 100%), repeating-conic-gradient(from 0deg, #00C4FF 0deg 0.5deg, transparent 0.5deg 10deg);
                        animation: vortexRotate 20s linear infinite;
                        filter: blur(5px); z-index: 0; transform: scale(3);
                    }
                    @keyframes vortexRotate { to { transform: rotate(360deg) scale(4); } }

                    .tv-scanlines {
                        position: fixed; inset: 0; pointer-events: none; z-index: 100;
                        background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.15) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.03));
                        background-size: 100% 2px, 1px 100%; opacity: 0.5;
                    }

                    .noise-overlay {
                        position: fixed; inset: 0; pointer-events: none; z-index: 101;
                        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
                        opacity: 0.05; mix-blend-mode: overlay;
                    }
        }
        }
                </style>
            `;

            document.body.appendChild(overlay);
            setTimeout(() => overlay.style.opacity = '1', 10);

            this.initCanvas();
            this.startTimer();

            const container = document.getElementById('shuffle-container');
            const maxMatchCourt = data.matches ? Math.max(0, ...data.matches.map(m => parseInt(m.court || m.pista || 0))) : 0;
            const numCourts = Math.max(data.courts || 4, maxMatchCourt);

            for (let i = 1; i <= numCourts; i++) {
                const slot = document.createElement('div');
                slot.className = 'court-slot';
                slot.innerHTML = `
                    <div class="court-container-3d">
                        <div class="tv-court-badge">SOMOSPADEL LIVE</div>
                        <div class="stadium-light light-top-l"></div>
                        <div class="stadium-light light-top-r"></div>
                        <div class="padel-court-floor">
                            <div class="court-lines">
                                <div class="court-center-line"></div>
                                <div class="court-service-line"></div>
                            </div>
                        </div>
                        <div class="court-net-3d"></div>
                        <div class="pista-name-overlay">PISTA ${i}</div>
                    </div>
                    <div class="players-section">
                        <div style="display:flex; flex-direction:column; gap:6px;">
                            <div class="slot-name" id="slot-${i}-p1"><div class="scrolling-names">${this.getRandomNamesText(data.players)}</div></div>
                            <div class="slot-name" id="slot-${i}-p2"><div class="scrolling-names">${this.getRandomNamesText(data.players)}</div></div>
                        </div>
                        <div class="vs-badge-massive">VS</div>
                        <div style="display:flex; flex-direction:column; gap:6px;">
                            <div class="slot-name opponent" id="slot-${i}-p3"><div class="scrolling-names">${this.getRandomNamesText(data.players)}</div></div>
                            <div class="slot-name opponent" id="slot-${i}-p4"><div class="scrolling-names">${this.getRandomNamesText(data.players)}</div></div>
                        </div>
                    </div>
                `;
                container.appendChild(slot);
                setTimeout(() => slot.classList.add('visible'), i * 50);
            }

            // Uniform experience or slightly faster but not instant
            const isFirstRound = parseInt(data.round) === 1;
            const shuffleDuration = isFirstRound ? 1500 : 800; 

            setTimeout(() => this.revealResults(data, overlay, onComplete), shuffleDuration);

            const closeBtn = document.querySelector('.tv-close-btn');
            closeBtn.onclick = () => this.finishAnimation(overlay, onComplete);
            setTimeout(() => { closeBtn.style.display = 'block'; }, 2000);
        }

        async revealResults(data, overlay, onComplete) {
            const matches = data.matches || [];
            if (matches.length === 0) return this.finishAnimation(overlay, onComplete);

            const marquee = document.getElementById('shuffle-status-marquee');
            if (marquee) marquee.innerText = "SORTEO COMPLETADO • RESULTADOS PUBLICADOS • TODOS A PISTAS • REGLAMENTO SOMOSPADEL ACTIVADO • ";

            const isFirstRound = parseInt(data.round) === 1;
            const matchDelay = isFirstRound ? 300 : 150;
            const playerDelay = isFirstRound ? 100 : 50;

            const revealedCourts = new Set();

            // Prepare all data first to ensure no sync issues
            const matchesData = await Promise.all(matches.map(async (m, idx) => {
                const pData = await this.extractPlayerDataFromMatch(m, data.players);
                let val = parseInt(String(m.court || m.pista || '').replace(/\D/g, ''));
                if (isNaN(val)) val = idx + 1;
                return { match: m, pData, court: val, idx };
            }));

            matchesData.forEach(({ match, pData, court, idx }) => {
                const c = court;
                revealedCourts.add(c);

                setTimeout(() => {
                    for (let i = 1; i <= 4; i++) {
                        setTimeout(() => {
                            const slotId = `slot-${c}-p${i}`;
                            const el = document.getElementById(slotId);
                            if (el) {
                                el.classList.add('revealed');
                                const p = pData[i - 1];
                                const nameToDisplay = (p.name || 'JUGADOR').toUpperCase();
                                
                                const levelVal = parseFloat(p.level);
                                const levelColor = this.getLevelColor(levelVal);
                                
                                el.innerHTML = `
                                    <div class="winner-name-container">
                                        <div class="winner-name">${nameToDisplay}</div>
                                        <div class="player-meta-badges">
                                            <span class="team-label-pro">${p.team || 'SOMOSPADEL TEAM'}</span>
                                            <span class="level-badge-pro" style="background: ${levelColor}">${p.level}</span>
                                        </div>
                                    </div>
                                `;
                            }
                        }, i * playerDelay);
                    }
                }, idx * matchDelay);
            });

            const totalRevealTime = (matches.length * matchDelay) + (4 * playerDelay);

            // SWEEPER: Clean up any courts that didn't get a match.
            // Increased safety buffer to 2000ms to ensure it never preempts a valid reveal.
            setTimeout(() => {
                const slots = document.querySelectorAll('.court-slot');
                slots.forEach((slot, index) => {
                    // Robust ID inference
                    const pisteOverlay = slot.querySelector('.pista-name-overlay');
                    let pisteNum = index + 1; // Default
                    if (pisteOverlay) {
                        const txt = pisteOverlay.innerText.replace(/\D/g, '');
                        if (txt) pisteNum = parseInt(txt);
                    }

                    if (!revealedCourts.has(pisteNum)) {
                        const nameSlots = slot.querySelectorAll('.slot-name:not(.revealed)');
                        nameSlots.forEach(ns => {
                            ns.classList.add('revealed');
                            ns.style.background = 'rgba(255,255,255,0.05)';
                            ns.innerHTML = '<div class="winner-name" style="color: #666; font-size: 0.8rem; letter-spacing: 1px;">DISPONIBLE</div>';
                        });
                        const ribbon = slot.querySelector('.vs-ribbon');
                        if (ribbon) ribbon.style.opacity = '0';
                    }
                });
            }, totalRevealTime + 2000);

            // TOTAL DURATION
            // increased buffer to allow reading
            setTimeout(() => {
                const btn = document.querySelector('.tv-close-btn');
                if (btn) btn.classList.add('pulse-attention'); // hypothetical class to draw attention

                setTimeout(() => {
                    // Auto-close if still open (increased to 10s as requested)
                    if (document.getElementById('shuffle-animator-overlay')) this.finishAnimation(overlay, onComplete);
                }, 10000);
            }, totalRevealTime + 2500);
        }

        async extractPlayerDataFromMatch(m, allPlayers) {
            const normalize = (str) => {
                if (!str) return '';
                // Remove accents and convert to uppercase
                return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
            };

            // Ensure we have a pool. If allPlayers is empty, use global caches or fetch
            let pool = [...(allPlayers || []), ...(window._allPlayersCache || []), ...(window.allUsersCache || [])];
            
            if (pool.length === 0 && window.FirebaseDB) {
                console.log("📡 [ShuffleAnimator] Pool empty, fetching fresh players from DB...");
                try {
                    pool = await window.FirebaseDB.players.getAll();
                    window._allPlayersCache = pool;
                } catch (e) { console.error(e); }
            }

            const getP = (id, name) => {
                if (!name || name === '---' || name === 'DISPONIBLE') return { name: '---', level: '0.0', team: 'OPEN' };
                
                const searchName = normalize(name);
                const searchId = String(id || '').trim();

                // 1. SEARCH BY ID / UID (Highest Priority)
                let p = pool.find(p => {
                    const pid = String(p.id || '').trim();
                    const puid = String(p.uid || '').trim();
                    return (pid && searchId && pid === searchId) || (puid && searchId && puid === searchId);
                });

                // 2. SEARCH BY NORMALIZED NAME (Fallback)
                if (!p) {
                    p = pool.find(p => {
                        const pname = normalize(p.name || p.displayName);
                        if (!pname || !searchName) return false;
                        if (pname === searchName) return true;
                        
                        // Smart overlap check
                        const parts = searchName.split(' ').filter(x => x.length > 2);
                        const pParts = pname.split(' ').filter(x => x.length > 2);
                        const common = parts.filter(pt => pParts.some(pp => pp.includes(pt) || pt.includes(pp)));
                        return common.length >= Math.min(parts.length, 2);
                    });
                }

                const getLevel = (player) => {
                    if (!player) return 0;
                    const val = player.level || player.self_rate_level || player.rating || player.nivel || player.rank || 0;
                    return parseFloat(val) || 0;
                };

                const getTeam = (player) => {
                    if (!player) return '';
                    const t = player.team_somospadel || player.team || player.equipo || '';
                    return Array.isArray(t) ? t[0] : t;
                };

                const finalName = p ? (p.name || p.displayName) : name;
                const finalLevel = getLevel(p).toFixed(1);
                const finalTeam = getTeam(p) || 'INDIV. SOMOSPADEL';

                return {
                    name: finalName.toUpperCase(),
                    level: finalLevel,
                    team: finalTeam.toUpperCase()
                };
            };

            const p1_id = m.player1 || (m.team_a_ids ? m.team_a_ids[0] : null);
            const p2_id = m.player2 || (m.team_a_ids ? m.team_a_ids[1] : null);
            const p3_id = m.player3 || (m.team_b_ids ? m.team_b_ids[0] : null);
            const p4_id = m.player4 || (m.team_b_ids ? m.team_b_ids[1] : null);

            const p1_name = m.player1_name || m.p1_name || (m.team_a_names ? m.team_a_names[0] : '---');
            const p2_name = m.player2_name || m.p2_name || (m.team_a_names ? m.team_a_names[1] : '---');
            const p3_name = m.player3_name || m.p3_name || (m.team_b_names ? m.team_b_names[0] : '---');
            const p4_name = m.player4_name || m.p4_name || (m.team_b_names ? m.team_b_names[1] : '---');

            return [
                getP(p1_id, p1_name),
                getP(p2_id, p2_name),
                getP(p3_id, p3_name),
                getP(p4_id, p4_name)
            ];
        }

        getLevelColor(lv) {
            if (lv >= 6.0) return '#FF0000'; // Elite (Red)
            if (lv >= 5.0) return '#FF8C00'; // Expert (Orange)
            if (lv >= 4.0) return '#FFD700'; // Advanced (Gold)
            if (lv >= 3.0) return '#00C4FF'; // Intermediate (Cyan)
            return '#00FF88'; // Beginner (Green)
        }

        finishAnimation(overlay, onComplete) {
            if (!overlay || !overlay.parentNode) return;
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.remove();
                this.isAnimating = false;
                if (onComplete) onComplete();
                if (this.timerInterval) clearInterval(this.timerInterval);
            }, 1000);
        }

        getRandomNamesText(players) {
            if (!players || players.length === 0) return "...";
            const names = players.map(p => (typeof p === 'string' ? p : (p.name || p.displayName || 'JUGADOR')).split(' ')[0]);
            let text = "";
            for (let i = 0; i < 20; i++) {
                text += `<div>${names[Math.floor(Math.random() * names.length)].toUpperCase()}</div>`;
            }
            return text;
        }

        startTimer() {
            let sec = 0;
            this.timerInterval = setInterval(() => {
                sec++;
                const m = Math.floor(sec / 60).toString().padStart(2, '0');
                const s = (sec % 60).toString().padStart(2, '0');
                const clock = document.getElementById('shuffle-timer');
                if (clock) clock.innerText = `${m}:${s}`;
            }, 1000);
        }

        initCanvas() {
            const canvas = document.getElementById('shuffle-canvas');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            let w, h;
            const resize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
            window.addEventListener('resize', resize);
            resize();
            const particles = [];
            for (let i = 0; i < 100; i++) particles.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.5, vy: -(Math.random() * 2 + 0.5), s: Math.random() * 2 + 1, o: Math.random() * 0.5 });
            const draw = () => {
                if (!document.getElementById('shuffle-canvas')) return;
                ctx.clearRect(0, 0, w, h);
                particles.forEach(p => {
                    p.y += p.vy; p.x += p.vx;
                    if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
                    ctx.fillStyle = `rgba(0, 196, 255, ${p.o})`;
                    ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2); ctx.fill();
                });
                requestAnimationFrame(draw);
            };
            draw();
        }
    }

    window.ShuffleAnimator = new ShuffleAnimator();
})();
