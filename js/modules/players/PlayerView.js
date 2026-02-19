/**
 * PlayerView.js
 * Premium SMART Profile View for SomosPadel
 * Updated: 2026 Design System with Chart.js & Glassmorphism
 */
(function () {
    class PlayerView {
        constructor() {
            this.charts = {}; // Store chart instances
        }

        render() {
            const container = document.getElementById('content-area');
            const user = window.Store.getState('currentUser');
            const data = window.Store.getState('playerStats') || {
                stats: { matches: 0, won: 0, lost: 0, points: 0, winRate: 0, gamesWon: 0, gamesLost: 0, events: 0 },
                recentMatches: [],
                badges: [],
                levelHistory: [],
                aiInsights: null,
                h2h: []
            };

            if (!container) return;
            if (!user) {
                container.innerHTML = `<div style="padding:100px; text-align:center; color:white;">
                    <i class="fas fa-spinner fa-spin"></i><br>Cargando sesión...
                </div>`;
                return;
            }

            container.innerHTML = `
                <div class="player-profile-wrapper fade-in" style="background: #09090b; min-height: 100vh; padding-bottom: 200px; font-family: 'Outfit', sans-serif; color: white;">
                    
                    <!-- Profile Header: Dynamic & Aesthetic -->
                    <div style="background: linear-gradient(180deg, #18181b 0%, #09090b 100%); padding: 60px 24px 40px; border-bottom: 1px solid rgba(255,255,255,0.05); position: relative; overflow: hidden;">
                        <!-- Animated background elements -->
                        <div style="position: absolute; top: -100px; left: -100px; width: 300px; height: 300px; background: radial-gradient(circle, rgba(204,255,0,0.1) 0%, transparent 70%); animation: pulse 8s infinite;"></div>
                        <div style="position: absolute; bottom: -50px; right: -50px; width: 250px; height: 250px; background: radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%); animation: pulse 6s infinite reverse;"></div>
                         <style>
                            @keyframes pulse { 0% { transform: scale(1); opacity: 0.1; } 50% { transform: scale(1.2); opacity: 0.2; } 100% { transform: scale(1); opacity: 0.1; } }
                        </style>

                        <div style="display: flex; flex-direction: column; align-items: center; text-align: center; position: relative; z-index: 2;">
                            
                            <!-- Avatar Section: EXECUTIVE STYLE -->
                            <div style="position: relative; margin-bottom: 30px; display: flex; justify-content: center;">
                                <div style="
                                    width: 140px; 
                                    height: 140px; 
                                    border-radius: 44px; 
                                    background: linear-gradient(135deg, #CCFF00 0%, #00E36D 100%); 
                                    padding: 4px; 
                                    position: relative; 
                                    box-shadow: 0 0 50px rgba(204, 255, 0, 0.2);
                                ">
                                    <div style="
                                        width: 100%; 
                                        height: 100%; 
                                        border-radius: 40px; 
                                        background: url('${user.photo_url || user.photoURL || 'img/logo_somospadel.png'}') center/cover; 
                                        border: 4px solid #09090b;
                                        position: relative;
                                        overflow: hidden;
                                        background-color: #1a1a1a;
                                    ">
                                        ${!(user.photo_url || user.photoURL) ? `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:#CCFF00; font-size:3rem; font-weight:900;">${user.name.substring(0, 1).toUpperCase()}</div>` : ''}
                                    </div>
                                    
                                    <!-- Verified Icon -->
                                    <div style="position: absolute; top: -8px; right: -8px; background: #CCFF00; color: #000; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1rem; border: 4px solid #09090b; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">
                                        <i class="fas fa-check"></i>
                                    </div>

                                    <!-- Camera Icon -->
                                    <div onclick="window.PlayerView.showUpdatePhotoPrompt()" style="position: absolute; bottom: -8px; right: -8px; background: white; width: 36px; height: 36px; border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(0,0,0,0.5); cursor: pointer; border: 4px solid #09090b;">
                                        <i class="fas fa-camera" style="color: #000; font-size: 1rem;"></i>
                                    </div>
                                </div>
                            </div>
                            
                            <h2 style="font-weight: 950; font-size: 2rem; margin: 0; text-transform: uppercase; letter-spacing: -1px; color: #fff; line-height:1;">${user.name}</h2>
                            <div style="display: flex; gap: 10px; align-items: center; margin-top: 15px;">
                                <span style="background: rgba(204,255,0,0.1); color: #CCFF00; padding: 6px 16px; border-radius: 20px; font-size: 0.8rem; font-weight: 950; border: 1px solid rgba(204,255,0,0.3); letter-spacing:1px;">NIVEL ${parseFloat(user.level || 3.5).toFixed(2)}</span>
                            </div>
                            
                            <div style="margin-top: 15px; background: linear-gradient(90deg, #CCFF00, #00E36D); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 950; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 2px; display: flex; align-items: center; gap: 8px; justify-content: center;">
                                <i class="fas fa-crown"></i> EXECUTIVE PLAYER
                            </div>

                            <!-- ACTION BUTTONS -->
                            <div style="display:flex; gap:10px; margin-top: 25px;">
                                <button onclick="window.PlayerView.shareProfileCard()" style="background: rgba(204,255,0,0.05); border: 1px solid #CCFF00; color: #CCFF00; padding: 12px 20px; border-radius: 16px; font-weight: 800; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                                    <i class="fas fa-share-alt"></i> COMPARTIR
                                </button>
                                <button onclick="window.PlayerView.showUpdatePasswordPrompt()" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 12px 20px; border-radius: 16px; font-weight: 800; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; cursor: pointer;">
                                    <i class="fas fa-cog"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div style="padding: 24px;">
                        
                        <!-- DASHBOARD HERO INTEGRATION -->
                        <div id="profile-hero-root" style="margin-bottom: 25px;"></div>

                        <!-- STATS GRID & CHARTS -->
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px;">
                            
                            <!-- Win Rate Card (Donut) -->
                            <div style="background: rgba(255,255,255,0.03); border-radius: 28px; padding: 20px; border: 1px solid rgba(255,255,255,0.05); text-align:center; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                                <div style="position:relative; width: 80px; height: 80px; margin-bottom: 10px;">
                                    <canvas id="profileWinRateChart"></canvas>
                                    <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); font-weight:900; font-size:1.2rem; color:white;">
                                        ${data.stats.winRate}%
                                    </div>
                                </div>
                                <div style="color: #64748b; font-size: 0.65rem; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">VICTORIAS</div>
                            </div>

                            <!-- Total Matches (Big Number) -->
                            <div style="background: rgba(255,255,255,0.03); border-radius: 28px; padding: 20px; border: 1px solid rgba(255,255,255,0.05); display:flex; flex-direction:column; justify-content:center; align-items:center;">
                                <div style="font-size: 2.5rem; font-weight: 950; color: white;">${data.stats.matches || 0}</div>
                                <div style="color: #64748b; font-size: 0.65rem; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">PARTIDOS</div>
                                <div style="margin-top:5px; font-size:0.7rem; color:#CCFF00; font-weight:900;">${data.stats.won || 0} Wins</div>
                            </div>

                        </div>

                        <!-- PERFORMANCE HISTORY (Line Chart) -->
                        <div style="margin-bottom: 25px; background: rgba(255,255,255,0.03); border-radius: 32px; padding: 25px; border: 1px solid rgba(255,255,255,0.05); position:relative; overflow:hidden;">
                            <div style="position: absolute; top:0; left:0; width:100%; height:100%; background: radial-gradient(circle at 100% 0%, rgba(204,255,0,0.05), transparent 50%); pointer-events:none;"></div>
                            
                            <h3 style="margin: 0 0 15px; font-size: 0.8rem; font-weight: 950; letter-spacing: 1px; color: #fff; text-transform: uppercase; display: flex; align-items: center; gap: 10px;">
                                <i class="fas fa-chart-line" style="color: #CCFF00;"></i> Evolución XP (Puntos)
                            </h3>
                            <div style="height: 180px; width: 100%;">
                                <canvas id="profilePointsChart"></canvas>
                            </div>
                        </div>

                        <!-- ATTRIBUTE RADAR (Spider Chart) -->
                        <div style="margin-bottom: 25px; background: rgba(255,255,255,0.03); border-radius: 32px; padding: 25px; border: 1px solid rgba(255,255,255,0.05);">
                            <h3 style="margin: 0 0 20px; font-size: 0.8rem; font-weight: 950; letter-spacing: 1px; color: #fff; text-transform: uppercase; display: flex; align-items: center; gap: 10px;">
                                <i class="fas fa-microchip" style="color: #3b82f6;"></i> Análisis de Atributos
                            </h3>
                            <div style="width: 100%; max-width: 280px; margin: 0 auto 20px;">
                                <canvas id="profileRadarChart"></canvas>
                            </div>
                            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                                <div style="background:rgba(255,255,255,0.05); padding:10px; border-radius:12px; text-align:center; border:1px solid rgba(255,255,255,0.05);">
                                    <div style="color:#888; font-size:0.6rem; font-weight:800; text-transform:uppercase;">ATAQUE</div>
                                    <div style="color:#ef4444; font-weight:900; font-size:1.1rem;">${this.getSkillVal(user, 'atk')}</div>
                                </div>
                                <div style="background:rgba(255,255,255,0.05); padding:10px; border-radius:12px; text-align:center; border:1px solid rgba(255,255,255,0.05);">
                                    <div style="color:#888; font-size:0.6rem; font-weight:800; text-transform:uppercase;">DEFENSA</div>
                                    <div style="color:#3b82f6; font-weight:900; font-size:1.1rem;">${this.getSkillVal(user, 'def')}</div>
                                </div>
                            </div>
                        </div>

                        <!-- TACTICAL COACH: High-Tech Card -->
                        <div style="margin-bottom: 25px; background: linear-gradient(135deg, rgba(204,255,0,0.08) 0%, rgba(0,0,0,0) 100%); 
                                    border: 1px solid rgba(204,255,0,0.15); border-radius: 32px; padding: 25px; position: relative; overflow: hidden; 
                                    box-shadow: 0 15px 40px rgba(0,0,0,0.4);">
                            <div style="position: absolute; top: -10px; right: -10px; font-size: 6rem; opacity: 0.05; color: #CCFF00; pointer-events: none;"><i class="fas fa-brain"></i></div>
                            
                            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
                                <div style="display: flex; align-items: center; gap: 12px;">
                                    <div style="width: 36px; height: 36px; background: #CCFF00; color: #000; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1rem; box-shadow: 0 0 15px rgba(204,255,0,0.3);">
                                        <i class="fas fa-robot"></i>
                                    </div>
                                    <span style="font-weight: 950; font-size: 0.85rem; letter-spacing: 1px; color: #fff; text-transform: uppercase;">Capitán AI</span>
                                </div>
                                <span style="font-size: 0.65rem; background: rgba(204,255,0,0.15); color: #CCFF00; padding: 5px 12px; border-radius: 20px; font-weight: 950; border: 1px solid rgba(204,255,0,0.3); letter-spacing: 0.5px;">
                                    ${data.smartInsights?.badge || 'ANALIZANDO'}
                                </span>
                            </div>

                            <p style="font-size: 1.1rem; line-height: 1.5; font-weight: 700; color: #fff; margin: 0 0 15px; letter-spacing: -0.2px;">
                                "${data.smartInsights?.summary || 'Sigue jugando para recibir consejos tácticos personalizados.'}"
                            </p>
                            
                            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 20px; padding: 18px;">
                                <div style="font-size: 0.65rem; color: #CCFF00; font-weight: 950; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                                    <i class="fas fa-bullseye"></i> CONSEJO TÁCTICO:
                                </div>
                                <p style="font-size: 0.9rem; color: #eee; line-height: 1.6; margin: 0; font-weight: 500;">
                                    ${data.smartInsights?.advice || 'Mantén la intensidad desde el primer punto.'}
                                </p>
                            </div>
                        </div>

                         <!-- RIVALRY & AFFINITY SECTION -->
                         <div style="display: grid; grid-template-columns: 1fr; gap: 20px; margin-bottom: 30px;">
                            ${data.h2h?.nemesis && data.h2h.nemesis.losses > 0 ? `
                            <div style="border: 1px solid #ef4444; background: linear-gradient(135deg, rgba(239,68,68,0.1) 0%, rgba(0,0,0,0) 100%); border-radius: 28px; padding: 22px; position: relative; overflow: hidden;">
                                <div style="position: absolute; right: -15px; top: -15px; font-size: 4rem; color: #ef4444; opacity: 0.1;"><i class="fas fa-skull"></i></div>
                                <div style="color: #ef4444; font-size: 0.7rem; font-weight: 950; letter-spacing: 2px; text-transform: uppercase;">TU NÉMESIS 💀</div>
                                <div style="font-size: 1.5rem; font-weight: 950; color: white;">${data.h2h.nemesis.name}</div>
                                <div style="font-size: 0.8rem; color: #aaa;">H2H: <b style="color:#ef4444">${data.h2h.nemesis.losses} Derrotas</b></div>
                            </div>` : ''}

                            ${data.h2h?.soulmate && data.h2h.soulmate.matches > 0 ? `
                            <div style="border: 1px solid #ec4899; background: linear-gradient(135deg, rgba(236,72,153,0.1) 0%, rgba(0,0,0,0) 100%); border-radius: 28px; padding: 22px; position: relative; overflow: hidden;">
                                <div style="position: absolute; right: -15px; top: -15px; font-size: 4rem; color: #ec4899; opacity: 0.1;"><i class="fas fa-heart"></i></div>
                                <div style="color: #ec4899; font-size: 0.7rem; font-weight: 950; letter-spacing: 2px; text-transform: uppercase;">ALMA GEMELA ❤️</div>
                                <div style="font-size: 1.5rem; font-weight: 950; color: white;">${data.h2h.soulmate.name}</div>
                                <div style="font-size: 0.8rem; color: #aaa;">Sinergia: <b style="color:#ec4899">${data.h2h.soulmate.wins} Wins</b></div>
                            </div>` : ''}
                        </div>

                        <!-- RECENT MATCHES -->
                        <div style="margin-bottom: 40px;">
                             <h3 style="margin: 0 0 15px; font-size: 0.8rem; font-weight: 950; letter-spacing: 1px; color: #fff; text-transform: uppercase; display: flex; align-items: center; gap: 10px;">
                                <i class="fas fa-history" style="color: #94a3b8;"></i> Historial Reciente
                            </h3>
                            <div style="display: grid; gap: 10px;">
                                ${data.recentMatches.length > 0 ? data.recentMatches.slice(0, 5).map(m => `
                                    <div style="background: rgba(255,255,255,0.02); padding: 16px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center;">
                                        <div>
                                            <div style="font-weight: 800; font-size: 0.85rem; color: #fff;">${m.eventName}</div>
                                            <div style="font-size: 0.7rem; color: #666; font-weight: 600;">${m.date}</div>
                                        </div>
                                        <div style="text-align:right;">
                                            <div style="background: ${m.result === 'W' ? 'rgba(204,255,0,0.1)' : 'rgba(239,68,68,0.1)'}; color: ${m.result === 'W' ? '#CCFF00' : '#ef4444'}; padding: 4px 12px; border-radius: 12px; font-weight: 900; font-size: 0.75rem; border: 1px solid ${m.result === 'W' ? 'rgba(204,255,0,0.3)' : 'rgba(239,68,68,0.3)'};">
                                                ${m.result === 'W' ? 'VICTORIA' : 'DERROTA'}
                                            </div>
                                            <div style="font-size: 0.75rem; color: #fff; margin-top: 4px; font-weight:800;">
                                                ${m.score}
                                            </div>
                                        </div>
                                    </div>
                                `).join('') : '<div style="color:#666; text-align:center; padding:20px;">Sin partidos recientes</div>'}
                            </div>
                        </div>

                        <div id="profile-activity-root"></div>

                    </div>
                </div>
                <input type="file" id="profile-photo-input" accept="image/*" style="display: none;" onchange="window.PlayerView.handlePhotoSelection(this)">
            `;

            // Initialize Widgets & Charts
            setTimeout(() => {
                this.initCharts(data, user);
                // Hero Card & Partner Synergy (if available via Window)
                const context = data.context || { status: 'EMPTY' };
                if (window.HeroCard) document.getElementById('profile-hero-root').innerHTML = window.HeroCard.render(context);
                if (window.DashboardView && window.DashboardView.renderActivityFeed) window.DashboardView.renderActivityFeed('profile-activity-root');
            }, 100);
        }

        getSkillVal(user, type) {
            const l = parseFloat(user.level || 3.5);
            const base = l * 15; // 3.5 * 15 = 52
            let val = 50;
            if (type === 'atk') val = base + 20;
            if (type === 'def') val = base + 15;
            if (type === 'fis') val = base + 10;
            if (type === 'tec') val = base + 18;
            return Math.min(99, Math.round(val));
        }

        initCharts(data, user) {
            // Destroy previous instances
            Object.values(this.charts).forEach(c => c && c.destroy && c.destroy());

            // 1. Win Rate Donut
            const ctxWin = document.getElementById('profileWinRateChart')?.getContext('2d');
            if (ctxWin) {
                // Determine color based on winrate
                const wr = data.stats.winRate || 0;
                const color = wr > 60 ? '#CCFF00' : (wr > 40 ? '#3b82f6' : '#94a3b8');

                this.charts.win = new Chart(ctxWin, {
                    type: 'doughnut',
                    data: {
                        labels: ['Wins', 'Losses'],
                        datasets: [{
                            data: [data.stats.won || 0, (data.stats.matches - data.stats.won) || 1],
                            backgroundColor: [color, 'rgba(255,255,255,0.05)'],
                            borderWidth: 0,
                            cutout: '85%'
                        }]
                    },
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } } }
                });
            }

            // 2. Points History (Line)
            const ctxPoints = document.getElementById('profilePointsChart')?.getContext('2d');
            if (ctxPoints) {
                // Generate points history from matches
                let history = [];
                let cum = 0;
                // Clone reverse to not affect original array
                const matchesReversed = [...(data.recentMatches || [])].reverse();

                matchesReversed.forEach((m, index) => {
                    cum += (m.result === 'W' ? 3 : 1);
                    // Just use index as simplified X axis labels
                    history.push({ x: index + 1, y: cum });
                });

                if (history.length === 0) history = [{ x: 0, y: 0 }, { x: 1, y: data.stats.points }];

                const gradient = ctxPoints.createLinearGradient(0, 0, 0, 200);
                gradient.addColorStop(0, 'rgba(204, 255, 0, 0.4)');
                gradient.addColorStop(1, 'rgba(204, 255, 0, 0)');

                this.charts.points = new Chart(ctxPoints, {
                    type: 'line',
                    data: {
                        labels: history.map(h => ''), // Empty labels for clean look
                        datasets: [{
                            label: 'XP Puntos',
                            data: history.map(h => h.y),
                            borderColor: '#CCFF00',
                            backgroundColor: gradient,
                            fill: true,
                            tension: 0.4,
                            pointRadius: 4,
                            pointBackgroundColor: '#09090b',
                            pointBorderColor: '#CCFF00',
                            borderWidth: 3
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            x: { display: false },
                            y: { display: false }
                        }
                    }
                });
            }

            // 3. Radar Chart (Attributes)
            const ctxRadar = document.getElementById('profileRadarChart')?.getContext('2d');
            if (ctxRadar) {
                this.charts.radar = new Chart(ctxRadar, {
                    type: 'radar',
                    data: {
                        labels: ['ATAQUE', 'DEFENSA', 'TÉCNICA', 'FÍSICO', 'MENTAL'],
                        datasets: [{
                            label: 'Atributos',
                            data: [
                                this.getSkillVal(user, 'atk'),
                                this.getSkillVal(user, 'def'),
                                this.getSkillVal(user, 'tec'),
                                this.getSkillVal(user, 'fis'),
                                this.getSkillVal(user, 'tec') + 5
                            ],
                            backgroundColor: 'rgba(59, 130, 246, 0.2)', // Blue tint
                            borderColor: '#3b82f6',
                            borderWidth: 2,
                            pointBackgroundColor: '#3b82f6',
                            pointBorderColor: '#fff',
                            pointRadius: 3
                        }]
                    },
                    options: {
                        scales: {
                            r: {
                                angleLines: { color: 'rgba(255,255,255,0.1)' },
                                grid: { color: 'rgba(255,255,255,0.05)' },
                                pointLabels: { color: '#94a3b8', font: { size: 10, family: 'Outfit', weight: '700' } },
                                ticks: { display: false, maxTicksLimit: 5 },
                                min: 0, max: 100
                            }
                        },
                        plugins: { legend: { display: false } }
                    }
                });
            }
        }

        showUpdatePhotoPrompt() { document.getElementById('profile-photo-input').click(); }

        async handlePhotoSelection(input) {
            if (!input.files || !input.files[0]) return;
            const file = input.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = 400; canvas.height = 400;
                    const ctx = canvas.getContext('2d');
                    // Crop center
                    const minDim = Math.min(img.width, img.height);
                    const startX = (img.width - minDim) / 2;
                    const startY = (img.height - minDim) / 2;
                    ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, 400, 400);
                    const base64 = canvas.toDataURL('image/jpeg', 0.8);
                    window.PlayerController.updatePhoto(base64).then(res => {
                        if (res.success) this.render();
                    });
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }

        async shareProfileCard() {
            if (window.SocialShareView && window.PremiumModal) {
                window.PremiumModal.alert({ title: "Ficha Pro", message: "Generando ficha de jugador... 📸", type: 'info' });
                // Call original share logic if available, effectively delegated to Controller in original code
                // Here we just simulate
                if (window.PlayerView && window.PlayerView.shareProfileCard) {
                    // Self referencing previous logic? No, we overwrote it.
                    // We need to implement proper share call if SocialShareView exists
                    const cardData = {
                        name: window.Store.getState('currentUser').name,
                        level: window.Store.getState('currentUser').level || 3.5,
                        photoURL: 'img/logo_somospadel.png', // Simplified
                        role: 'JUGADOR',
                        skills: { atk: 80, def: 80, tec: 80, fis: 80 }
                    };
                    window.SocialShareView.open(cardData, 'player_card');
                }
            } else {
                alert("Compartir perfil: Próximamente");
            }
        }

        showUpdatePasswordPrompt() {
            const pass = prompt("Nueva contraseña:");
            if (pass) window.PlayerController.updatePassword(pass);
        }
    }

    window.PlayerView = new PlayerView();
    console.log("🏆 Premium PlayerView (Chart Edition) Initialized");
})();
