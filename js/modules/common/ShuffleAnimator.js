/**
 * ShuffleAnimator.js
 * Handles high-impact animations for draw/shuffle events.
 * Version: 2.0 Ultra Pro (With SomosPadel Brand Identity)
 */
(function () {
    class ShuffleAnimator {
        constructor() {
            this.isAnimating = false;
        }

        /**
         * Triggers the full-screen shuffle animation
         * @param {Object} data { players: [], courts: 4, mode: 'twister', round: 1, matches: [] }
         * @param {Function} onComplete Callback when animation finishes
         */
        animate(data, onComplete) {
            if (this.isAnimating) return;
            this.isAnimating = true;

            const overlay = document.createElement('div');
            overlay.id = 'shuffle-animator-overlay';
            overlay.style.cssText = `
                position: fixed; inset: 0; background: #000; z-index: 99999;
                display: flex; flex-direction: column; align-items: center;
                font-family: 'Outfit', sans-serif; color: white; 
                overflow-x: hidden; overflow-y: auto; padding: 60px 0 120px;
                opacity: 0; transition: opacity 0.5s ease;
            `;

            overlay.innerHTML = `
                <div id="shuffle-header" style="text-align: center; margin-bottom: 40px; z-index: 10; animation: slideDown 0.8s cubic-bezier(0.2, 1, 0.3, 1); flex-shrink: 0;">
                    <div style="background: linear-gradient(90deg, #CCFF00, #00E36D); color: black; padding: 12px 40px; border-radius: 50px; font-weight: 950; font-size: 1.1rem; display: inline-block; box-shadow: 0 0 40px rgba(204,255,0,0.4); margin-bottom: 25px; letter-spacing: 2px; text-transform: uppercase;">
                        DISFRUTA Y COMPITE
                    </div>
                    <h1 style="font-size: 1.7rem; font-weight: 950; margin: 0; text-transform: uppercase; letter-spacing: -1px; color: #fff; line-height: 0.9;">GENERANDO <span style="color: #CCFF00;">RONDA ${data.round}</span></h1>
                    <p style="color: rgba(255,255,255,0.4); font-size: 1.2rem; font-weight: 700; letter-spacing: 4px; margin-top: 15px;">CALCULANDO BALANCE PERFECTO...</p>
                </div>

                <div id="shuffle-container" style="display: flex; flex-wrap: wrap; justify-content: center; gap: 20px; width: 95%; max-width: 1600px; z-index: 10; flex: 1;">
                    <!-- Court slots -->
                </div>

                <canvas id="shuffle-canvas" style="position: fixed; inset: 0; z-index: 1; opacity: 0.4; pointer-events: none;"></canvas>

                <!-- BOTTOM INFO BAR -->
                <div style="position: fixed; bottom: 0; left: 0; width: 100%; height: 80px; background: rgba(0,0,0,0.8); border-top: 1px solid rgba(204,255,0,0.2); display: flex; align-items: center; justify-content: center; z-index: 100; backdrop-filter: blur(10px);">
                    <div class="loader-spinner" style="border-width: 3px; width: 25px; height: 25px; margin-right: 20px; border-color: #CCFF00; border-top-color: transparent;"></div>
                    <p id="shuffle-status-text" style="color: #CCFF00; font-weight: 900; letter-spacing: 5px; font-size: 0.9rem; margin: 0; text-transform: uppercase;">Sincronizando con base de datos real-time...</p>
                </div>

                <button id="close-shuffle" style="position: fixed; top: 30px; right: 30px; background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.2); color: white; width: 50px; height: 50px; border-radius: 50%; display: none; align-items: center; justify-content: center; cursor: pointer; z-index: 200; transition: all 0.3s; backdrop-filter: blur(5px);">
                    <i class="fas fa-times" style="font-size: 1.2rem;"></i>
                </button>

                <style>
                    @keyframes slideDown { from { transform: translateY(-50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                    
                    .court-slot {
                        background: linear-gradient(180deg, rgba(20,20,20,0.8) 0%, rgba(5,5,5,0.9) 100%);
                        border: 1px solid rgba(255,255,255,0.05);
                        width: 350px; padding: 30px; border-radius: 30px;
                        transition: all 0.6s cubic-bezier(0.19, 1, 0.22, 1);
                        transform: scale(0.8) translateY(100px); opacity: 0;
                        position: relative; overflow: hidden;
                        box-shadow: 0 20px 50px rgba(0,0,0,0.5);
                    }
                    .court-slot.visible { transform: scale(1) translateY(0); opacity: 1; }
                    .court-slot::before {
                        content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 4px;
                        background: linear-gradient(90deg, #CCFF00, transparent); opacity: 0.5;
                    }
                    
                    .slot-name { 
                        font-size: 1rem; font-weight: 950; color: #444; margin: 8px 0; padding: 0 12px; 
                        background: rgba(255,255,255,0.03); border-radius: 12px; overflow: hidden; 
                        height: 48px; position: relative; border: 1px solid rgba(255,255,255,0.02);
                        transition: all 0.3s;
                    }
                    .slot-name.revealed { background: rgba(204,255,0,0.05); border-color: rgba(204,255,0,0.2); }

                    .scrolling-names {
                        position: absolute; left: 0; width: 100%; text-align: center;
                        animation: nameScroll 2s infinite linear;
                        white-space: nowrap;
                    }
                    @keyframes nameScroll { 0% { transform: translateY(0); } 100% { transform: translateY(-50%); } }
                    
                    .winner-name { 
                        color: #fff !important; font-size: 1.3rem !important; font-weight: 950;
                        height: 48px; line-height: 48px; text-align: center;
                        animation: revealPop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
                        text-shadow: 0 0 15px rgba(255,255,255,0.5);
                    }
                    @keyframes revealPop {
                        0% { transform: scale(2) rotate(-5deg); filter: blur(10px); color: #CCFF00; opacity: 0; }
                        50% { filter: blur(0); }
                        100% { transform: scale(1) rotate(0); color: #fff; opacity: 1; }
                    }
                    
                    .pista-num {
                        font-weight: 950; color: #CCFF00; font-size: 2.2rem; margin-bottom: 25px; 
                        display: flex; align-items: center; gap: 15px; letter-spacing: -1px;
                    }
                    .pista-num::after { content: ''; flex: 1; height: 1px; background: rgba(204,255,0,0.2); }

                    .loader-spinner {
                        width: 30px; height: 30px; border: 3px solid rgba(204,255,0,0.2);
                        border-top: 3px solid #CCFF00; border-radius: 50%;
                        animation: spin 1s linear infinite;
                    }
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                </style>
            `;

            document.body.appendChild(overlay);
            setTimeout(() => overlay.style.opacity = '1', 10);

            this.initCanvas();

            const container = document.getElementById('shuffle-container');
            const numCourts = data.courts || 4;

            // Create slots
            for (let i = 1; i <= numCourts; i++) {
                const slot = document.createElement('div');
                slot.className = 'court-slot';
                slot.innerHTML = `
                    <div class="pista-num">PISTA ${i}</div>
                    <div class="slot-name" id="slot-${i}-p1"><div class="scrolling-names">${this.getRandomNamesText(data.players)}</div></div>
                    <div class="slot-name" id="slot-${i}-p2"><div class="scrolling-names">${this.getRandomNamesText(data.players)}</div></div>
                    <div style="height: 10px; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.1); font-weight: 950; font-size: 0.7rem; margin: 10px 0; letter-spacing: 2px;">V S</div>
                    <div class="slot-name" id="slot-${i}-p3"><div class="scrolling-names">${this.getRandomNamesText(data.players)}</div></div>
                    <div class="slot-name" id="slot-${i}-p4"><div class="scrolling-names">${this.getRandomNamesText(data.players)}</div></div>
                `;
                container.appendChild(slot);

                // Staggered enter
                setTimeout(() => slot.classList.add('visible'), i * 150);
            }

            // Dynamic Timers based on Round (Requested: More tension on Round 1)
            const isFirstRound = parseInt(data.round) === 1;
            const shuffleDuration = isFirstRound ? 5000 : 2000;

            // Shuffle Animation phase
            setTimeout(() => {
                this.revealResults(data, overlay, onComplete);
            }, shuffleDuration);

            // Close button logic
            const closeBtn = document.getElementById('close-shuffle');
            closeBtn.onclick = () => {
                overlay.style.opacity = '0';
                setTimeout(() => {
                    overlay.remove();
                    this.isAnimating = false;
                    if (onComplete) onComplete();
                }, 500);
            };

            // Show close button early so users can skip long animations
            setTimeout(() => {
                if (closeBtn) closeBtn.style.display = 'flex';
            }, 1500);
        }

        revealResults(data, overlay, onComplete) {
            const matches = data.matches || [];
            if (matches.length === 0) {
                this.finishAnimation(overlay, onComplete);
                return;
            }

            const statusText = document.getElementById('shuffle-status-text');
            if (statusText) statusText.innerText = "SORTEO FINALIZADO • CUADRANTE ACTUALIZADO";

            const isFirstRound = parseInt(data.round) === 1;
            const matchDelay = isFirstRound ? 800 : 350;
            const playerDelay = isFirstRound ? 250 : 120;

            matches.forEach((m, idx) => {
                const c = m.court;

                // --- IDENTIFICAR JUGADORES (ROBUSTO) ---
                let pNames = [];
                const extractFullTeam = (namesArr, teamArr) => {
                    const raw = namesArr || teamArr || [];
                    const items = Array.isArray(raw) ? raw : [raw];
                    let processed = [];
                    items.forEach(item => {
                        const str = (typeof item === 'object' ? (item.name || item.displayName) : String(item)) || '';
                        if (str.includes(' / ')) {
                            processed.push(...str.split(' / ').map(s => s.trim()));
                        } else if (str) {
                            processed.push(str);
                        }
                    });
                    return processed;
                };

                const teamAnames = extractFullTeam(m.team_a_names, m.team_a);
                const teamBnames = extractFullTeam(m.team_b_names, m.team_b);

                // Forzar 2 nombres por equipo para que encajen en los 4 slots
                while (teamAnames.length < 2) teamAnames.push('---');
                while (teamBnames.length < 2) teamBnames.push('---');

                pNames = [teamAnames[0], teamAnames[1], teamBnames[0], teamBnames[1]];

                setTimeout(() => {
                    for (let i = 1; i <= 4; i++) {
                        setTimeout(() => {
                            const el = document.getElementById(`slot-${c}-p${i}`);
                            if (el) {
                                el.classList.add('revealed');
                                const displayName = pNames[i - 1] || '---';
                                el.innerHTML = `<div class="winner-name">${displayName.toUpperCase()}</div>`;
                            }
                        }, i * playerDelay);
                    }
                }, idx * matchDelay);
            });

            // Show close button after all revealed
            const totalRevealTime = (matches.length * matchDelay) + (4 * playerDelay);
            setTimeout(() => {
                const closeBtn = document.getElementById('close-shuffle');
                if (closeBtn) {
                    closeBtn.style.display = 'flex';
                    closeBtn.style.animation = 'slideDown 0.5s reverse ease'; // Just a quick way to say fade in/slide in
                }

                // Auto-close after 5 more seconds
                setTimeout(() => {
                    if (document.getElementById('shuffle-animator-overlay')) {
                        this.finishAnimation(overlay, onComplete);
                    }
                }, 7000);
            }, totalRevealTime + 500);
        }

        finishAnimation(overlay, onComplete) {
            if (!overlay || !overlay.parentNode) return;
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.remove();
                this.isAnimating = false;
                if (onComplete) onComplete();
            }, 600);
        }

        getRandomNamesText(players) {
            if (!players || players.length === 0) return "<div>...</div>";
            const names = players.map(p => {
                if (typeof p === 'string') return p;
                return p.name || p.displayName || 'JUGADOR';
            });
            let text = "";
            for (let i = 0; i < 40; i++) {
                const n = names[Math.floor(Math.random() * names.length)];
                text += `<div style="height:48px; line-height:48px; text-align:center; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${n.toUpperCase()}</div>`;
            }
            return text;
        }

        initCanvas() {
            const canvas = document.getElementById('shuffle-canvas');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            let w, h;

            const resize = () => {
                w = canvas.width = window.innerWidth;
                h = canvas.height = window.innerHeight;
            };
            window.addEventListener('resize', resize);
            resize();

            const particles = [];
            for (let i = 0; i < 80; i++) {
                particles.push({
                    x: Math.random() * w,
                    y: Math.random() * h,
                    vx: (Math.random() - 0.5) * 1,
                    vy: (Math.random() - 0.5) * 3,
                    s: Math.random() * 2 + 1,
                    o: Math.random() * 0.5 + 0.1
                });
            }

            const draw = () => {
                if (!document.getElementById('shuffle-canvas')) return;
                ctx.clearRect(0, 0, w, h);
                particles.forEach(p => {
                    p.y -= p.vy; // Floating up
                    if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
                    ctx.fillStyle = `rgba(204, 255, 0, ${p.o})`;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
                    ctx.fill();
                });
                requestAnimationFrame(draw);
            };
            draw();
        }
    }

    window.ShuffleAnimator = new ShuffleAnimator();
})();
