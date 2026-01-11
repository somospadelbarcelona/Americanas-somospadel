/**
 * DashboardView.js
 * "Context-First" Mobile Dashboard
 * Designed for Clarity, Speed and Outdoor Use
 */
(function () {
    class DashboardView {
        constructor() {
            if (window.Store) {
                window.Store.subscribe('dashboardData', (data) => {
                    if (window.Router && window.Router.currentRoute === 'dashboard') {
                        this.render(data);
                    }
                });
            }
        }

        async render(data) {
            console.log("📊 [DashboardView] Rendering started...", data);
            const container = document.getElementById('content-area');
            if (!container) return;

            // 1. Get Real User Data
            const user = window.Store ? window.Store.getState('currentUser') : null;
            const userName = user ? (user.name || "Alejandro Coscolín") : "Alejandro Coscolín";
            const userInitials = userName.substring(0, 2).toUpperCase();

            // Simulation of Level (In real app, fetch from Store)
            const userLevel = user ? (user.level || "3.5") : "3.5";

            // UPDATE GLOBAL HEADER (If exists)
            const headerName = document.getElementById('header-user-name');
            const headerAvatar = document.getElementById('header-user-avatar');
            if (headerName && userName) headerName.innerText = userName.split(' ')[0].toUpperCase();
            if (headerAvatar && userInitials) headerAvatar.innerText = userInitials;

            // 2. Render IMMEDIATE SHELL (Loading State)
            container.innerHTML = `
                <!-- MAIN DASHBOARD SCROLL CONTENT -->
                <div class="dashboard-v2-container fade-in full-width-mobile" style="
                    background: radial-gradient(circle at 50% 0%, rgba(30, 64, 175, 0.15) 0%, transparent 50%);
                    min-height: 100vh;
                ">

                    
                    <!-- 1. LIVE REGISTRATION WIDGET (FULL WIDTH SCROLLER) -->
                    <div id="registration-widget-root" style="
                        background: #0a0a14;
                        border: 1px solid rgba(0, 227, 109, 0.3);
                        border-radius: 20px;
                        margin: 25px 15px 15px;
                        padding: 12px 15px;
                        box-shadow: 0 15px 35px rgba(0,0,0,0.5);
                        z-index: 10;
                        animation: floatUp 0.8s ease-out forwards;
                    ">
                        <div class="live-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; padding: 5px 5px 0;">
                            <div style="font-weight:950; font-size:1rem; color:white; letter-spacing:-0.5px; text-transform: uppercase; display: flex; align-items: center; gap: 8px;">
                                <i class="fas fa-bolt" style="color: #00E36D; font-size: 1.2rem;"></i> INSCRIPCIONES
                            </div>
                            <div class="live-indicator-tag" style="background:rgba(0,227,109,0.1); color:#00E36D; padding:4px 12px; border-radius:100px; font-size:0.7rem; font-weight:950; display:flex; align-items:center; border: 1px solid rgba(0,227,109,0.2);">
                                <div class="pulsing-dot" style="background:#00E36D; width:6px; height:6px; border-radius:50%; margin-right:6px; animation:blink 1s infinite;"></div>
                                LIVE
                            </div>
                        </div>
                        
                        <div id="live-scroller-content" class="live-scroller" style="overflow-x: auto; display: flex; gap: 12px; padding-bottom: 5px; -webkit-overflow-scrolling: touch;">
                            <div style="text-align: center; width: 100%; padding: 15px; color: rgba(255,255,255,0.4);">
                                <i class="fas fa-spinner fa-spin" style="font-size: 1.2rem; color: #00E36D;"></i>
                                <div style="margin-top: 8px; font-size: 0.75rem; font-weight: 700;">Buscando pistas...</div>
                            </div>
                        </div>
                    </div>

                    <!-- 1.5 ÚLTIMA HORA (AI FEED) -->
                    <div id="ai-activity-root" style="
                        background: rgba(30, 41, 59, 0.95);
                        backdrop-filter: blur(20px);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        border-radius: 28px;
                        margin: 5px 15px 25px;
                        padding: 15px;
                        box-shadow: 0 20px 40px rgba(0,0,0,0.5);
                        animation: floatUp 0.9s ease-out forwards;
                    ">
                        <div id="ai-activity-content" style="display:flex; flex-direction:column; gap:12px;">
                            <!-- Predictive Content will be loaded here -->
                        </div>
                    </div>
                    
                    <div id="hero-section-root" style="margin: 0 15px; min-height: 180px;">
                        <div class="loader-mini" style="margin: 40px auto; opacity: 0.5;"></div>
                    </div>

                    <!-- 2.5 PLAYER PERFORMANCE & RESULTS TICKER (NEW) -->
                    <div id="ticker-stats-root" style="margin: 0 15px 25px;">
                        <div style="
                            background: linear-gradient(135deg, #0f172a 0%, #064e3b 100%);
                            border: 1px solid rgba(0, 227, 109, 0.3);
                            border-radius: 24px;
                            padding: 15px;
                            box-shadow: 0 15px 35px rgba(0,0,0,0.4);
                            display: flex;
                            align-items: center;
                            gap: 15px;
                            min-height: 100px;
                            position: relative;
                            overflow: hidden;
                        ">
                            <!-- Background Neon Glow -->
                            <div style="position: absolute; top: -20px; right: -20px; width: 80px; height: 80px; background: rgba(0, 227, 109, 0.15); filter: blur(30px); border-radius: 50%;"></div>
                            
                            <!-- A. MINI TICKER (Left) -->
                            <div style="flex: 1.2; overflow: hidden; border-right: 1px solid rgba(255,255,255,0.1); padding-right: 10px;">
                                <div style="font-size: 0.55rem; color: #00E36D; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px; display: flex; align-items: center; gap: 5px;">
                                    <div style="width: 5px; height: 5px; background: #00E36D; border-radius: 50%; animation: blink 1s infinite;"></div> ÚLTIMOS RESULTADOS
                                </div>
                                <div id="results-ticker" style="height: 60px; position: relative;">
                                    <!-- Dynamic Ticker Content -->
                                    <div class="ticker-item" style="animation: slideUpDown 8s infinite;">
                                        <div style="color: white; font-weight: 800; font-size: 0.8rem; margin-bottom: 2px;">6 - 4 <span style="color: rgba(255,255,255,0.5); font-weight: 500;">vs</span> Tapia/Coello</div>
                                        <div style="font-size: 0.6rem; color: rgba(255,255,255,0.4);">Padel Pro - Pista 1</div>
                                    </div>
                                </div>
                            </div>

                            <!-- B. MINI CHART (Right) -->
                            <div style="flex: 0.8; height: 75px; display: flex; align-items: flex-end; justify-content: space-around; padding-bottom: 5px;">
                                <div style="width: 8px; height: 40%; background: #00E36D; border-radius: 4px; box-shadow: 0 0 10px rgba(0,227,109,0.3);"></div>
                                <div style="width: 8px; height: 70%; background: #00E36D; border-radius: 4px; box-shadow: 0 0 10px rgba(0,227,109,0.3);"></div>
                                <div style="width: 8px; height: 55%; background: #00E36D; border-radius: 4px; box-shadow: 0 0 10px rgba(0,227,109,0.3);"></div>
                                <div style="width: 8px; height: 90%; background: #00E36D; border-radius: 4px; box-shadow: 0 0 15px rgba(0,227,109,0.5); animation: float 3s infinite;"></div>
                                <div style="width: 8px; height: 75%; background: #00E36D; border-radius: 4px; box-shadow: 0 0 10px rgba(0,227,109,0.3);"></div>
                            </div>

                            <!-- Floating Label -->
                            <div style="position: absolute; bottom: 8px; right: 12px; font-size: 0.5rem; color: #00E36D; font-weight: 900; background: rgba(0,227,109,0.1); padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(0,227,109,0.2);">
                                TREND +12%
                            </div>
                        </div>

                        <style>
                            @keyframes slideUpDown {
                                0%, 20% { transform: translateY(0); opacity: 1; }
                                25%, 45% { transform: translateY(-20px); opacity: 0; }
                                50%, 70% { transform: translateY(-40px); opacity: 1; }
                                75%, 95% { transform: translateY(-60px); opacity: 0; }
                                100% { transform: translateY(0); opacity: 1; }
                            }
                        </style>
                    </div>

                    <div id="pro-content-root"></div>

                </div>

                <style>
                    @keyframes floatUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
                    @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
                    @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
                    .dashboard-v2-container ::-webkit-scrollbar { display: none; }
                </style>
            `;

            // 3. ASYNC LOADING OF DATA-DEPENDENT COMPONENTS
            try {
                // Build context (Might take time)
                const context = await this.buildContext(user);

                // Load Widget Content
                this.loadLiveWidgetContent(context);

                // Populate Hero Section
                const heroRoot = document.getElementById('hero-section-root');
                if (heroRoot) {
                    heroRoot.innerHTML = this.renderSmartHero(context, userLevel);
                }

                // 1. DASHBOARD COMPONENT VISIBILITY
                const legacyHero = document.getElementById('hero-section-root');
                const legacyTicker = document.getElementById('ticker-stats-root');

                // Hide legacy hero/ticker as user requested "eliman estos dos" earlier (re-confirmed by excluded list)
                if (legacyHero) legacyHero.style.display = 'none';
                if (legacyTicker) legacyTicker.style.display = 'none';

                // Ensure Top Widgets are visible (Inscripciones & Ultima Hora)
                const regWidget = document.getElementById('registration-widget-root');
                const aiActivity = document.getElementById('ai-activity-root');
                if (regWidget) regWidget.style.display = 'block';
                if (aiActivity) aiActivity.style.display = 'block';

                // 2. Fetch Real Data for new Widgets (SILENT CALCULATION)
                if (window.RankingController) window.RankingController.calculateSilently().catch(e => console.error("Ranking calc failed", e));

                // 3. Populate Rest of Dashboard
                const proRoot = document.getElementById('pro-content-root');
                if (proRoot) {
                    proRoot.innerHTML = `
                        <div style="padding: 10px 15px 120px;">
                            
                             <!-- A. DUAL WEATHER WIDGETS -->
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 30px;">
                                ${this.renderWeatherCard('EL PRAT', '19°C', '☀️', { wind: '12 km/h', hum: '65%', rain: '0%' })}
                                ${this.renderWeatherCard('CORNELLÀ', '18°C', '🌤️', { wind: '10 km/h', hum: '68%', rain: '5%' })}
                            </div>

                            <!-- B. MI AGENDA (PLAYER'S EVENTS) -->
                            <div class="section-header" style="padding: 0 5px; margin-bottom: 20px; display:flex; justify-content:space-between; align-items:center;">
                                <h3 style="color:white; font-size:1.1rem; font-weight:950; letter-spacing:-0.5px; margin:0;">MI <span style="background: linear-gradient(90deg, #00E36D, #00c4ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">AGENDA</span></h3>
                                <span style="color:#00c4ff; font-size:0.8rem; font-weight:800; cursor:pointer;" onclick="Router.navigate('agenda')">Ver todo <i class="fas fa-chevron-right" style="font-size:0.6rem;"></i></span>
                            </div>

                            <!-- Horizontal Scroller for Agenda -->
                            <div class="agenda-scroller" style="display: flex; overflow-x: auto; padding-bottom: 15px; gap: 15px; scroll-snap-type: x mandatory;">
                                ${this.renderAgendaWidget(context.myEvents || [])}
                            </div>

                        </div>
                    `;
                }

            } catch (err) {
                console.error("Dashboard Render Error:", err);
            }
        }

        renderWeatherCard(city, temp, icon, details = {}) {
            return `
                <div style="
                    background: rgba(10, 10, 20, 0.9);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 24px;
                    padding: 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    box-shadow: 0 15px 35px rgba(0,0,0,0.5);
                    position: relative;
                    overflow: hidden;
                ">
                    <!-- Glow effect -->
                    <div style="position: absolute; top: -10%; right: -10%; width: 50%; height: 50%; background: radial-gradient(circle, rgba(0, 227, 109, 0.1) 0%, transparent 70%);"></div>

                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div style="font-size: 2.2rem; filter: drop-shadow(0 0 15px rgba(255,204,0,0.4));">${icon}</div>
                        <div style="background: rgba(0,227,109,0.1); color: #00E36D; padding: 4px 10px; border-radius: 8px; font-size: 0.6rem; font-weight: 950; border: 1px solid rgba(0,227,109,0.1); letter-spacing: 0.5px;">ÓPTIMO</div>
                    </div>
                    
                    <div>
                        <div style="color: white; font-weight: 950; font-size: 1.6rem; line-height: 1;">${temp}</div>
                        <div style="color: rgba(255,255,255,0.5); font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px;">${city}</div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.05);">
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <i class="fas fa-wind" style="font-size: 0.6rem; color: #00c4ff;"></i>
                            <span style="font-size: 0.65rem; color: #888; font-weight: 700;">${details.wind || '8km/h'}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <i class="fas fa-tint" style="font-size: 0.6rem; color: #00c4ff;"></i>
                            <span style="font-size: 0.65rem; color: #888; font-weight: 700;">${details.hum || '60%'}</span>
                        </div>
                    </div>
                </div>
            `;
        }

        renderAgendaWidget(myEvents) {
            if (myEvents.length === 0) {
                return `
                    <div style="min-width: 100%; background: white; border-radius: 32px; padding: 50px 30px; text-align: center; border: 1px solid #e2e8f0; box-shadow: 0 10px 30px rgba(0,0,0,0.03);">
                        <div style="width: 80px; height: 80px; background: #f8fafc; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 25px; border: 1px solid #f1f5f9;">
                            <i class="fas fa-calendar-plus" style="font-size: 2.2rem; color: #cbd5e1;"></i>
                        </div>
                        <h3 style="color: #0f172a; font-weight: 950; font-size: 1.25rem; margin-bottom: 10px; letter-spacing: -0.5px;">SIN PLANES PRÓXIMOS</h3>
                        <p style="color: #64748b; font-size: 0.85rem; margin-bottom: 25px; font-weight: 600; line-height: 1.5;">Apúntate a una americana para<br>empezar a sumar en el ranking.</p>
                        <button onclick="Router.navigate('americanas')" style="background: #0f172a; color: white; border: none; padding: 14px 28px; border-radius: 16px; font-weight: 900; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 8px 20px rgba(0,0,0,0.1); cursor: pointer;">EXPLORAR EVENTOS</button>
                    </div>
                `;
            }

            return myEvents.map(am => `
                <div class="agenda-card" onclick="window.ControlTowerView?.prepareLoad('${am.id}'); Router.navigate('live');" style="
                    min-width: 260px; background: white;
                    border-radius: 28px; border: 1px solid #e2e8f0;
                    padding: 22px; scroll-snap-align: center; position: relative;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.02);
                ">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px;">
                        <div style="color: #84cc16; font-size: 0.75rem; font-weight: 950; letter-spacing: 1px; text-transform: uppercase;">${this.formatDateShort(am.date)}</div>
                        <div style="background: rgba(14, 165, 233, 0.1); color: #0ea5e9; padding: 4px 10px; border-radius: 8px; font-size: 0.6rem; font-weight: 900;">CONFIRMADO</div>
                    </div>
                    <h4 style="margin: 0; color: #0f172a; font-size: 1.2rem; font-weight: 950; letter-spacing: -0.5px; line-height: 1.2;">${am.name}</h4>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 25px; padding-top: 15px; border-top: 1px solid #f8fafc;">
                        <span style="color: #64748b; font-size: 0.8rem; font-weight: 800;"><i class="far fa-clock" style="color: #84cc16; margin-right: 6px;"></i> ${am.time}</span>
                        <div style="width: 32px; height: 32px; background: #0f172a; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.8rem;">
                            <i class="fas fa-chevron-right"></i>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        renderSmartHero(context, userLevel) {
            // SLIDE: VIBRANT GLASS HERO
            let pillText = "INSCRIPCIÓN ABIERTA";
            let btnText = "APUNTARME AHORA";
            let btnBg = "linear-gradient(135deg, #00E36D, #00c4ff)";
            let logoText = "AMERICANAS";
            let explainerText = "¡Quedan pocas plazas! No te quedes fuera hoy.";
            let heroImage = "img/ball_hero.jpg";

            if (context.status === 'UPCOMING_EVENT') {
                pillText = "ESTÁS INSCRITO";
                btnText = "VER DETALLES";
                btnBg = "linear-gradient(135deg, #1e40af, #00c4ff)";
                logoText = "MI PLAZA";
                explainerText = "¡Prepárate! Tu próximo reto está a punto de empezar.";
            } else if (context.status === 'FINISHED') {
                pillText = "EVENTO FINALIZADO";
                btnText = "VER RESUMEN";
                btnBg = "rgba(255,255,255,0.1)";
                logoText = "HISTORY";
                explainerText = "Consulta los resultados y revive los mejores momentos.";
            } else if (context.status === 'LIVE_MATCH') {
                pillText = "¡ESTÁS EN PISTA!";
                btnText = "MARCADOR EN VIVO";
                btnBg = "#00E36D";
                logoText = "LIVE NOW";
                explainerText = "Tu partido está en progreso. ¡A por todas!";
            }

            return `
                <div class="vibrant-hero-card" onclick="Router.navigate('live')" style="
                    background: linear-gradient(135deg, rgba(30, 64, 175, 0.9), rgba(0, 196, 255, 0.7));
                    backdrop-filter: blur(20px);
                    border-radius: 28px;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    padding: 0;
                    margin-bottom: 25px;
                    overflow: hidden;
                    box-shadow: 0 20px 40px rgba(30, 64, 175, 0.3);
                    position: relative;
                ">
                    <div style="height: 140px; background: url('${heroImage}') center/cover; position: relative;">
                        <div style="position: absolute; inset: 0; background: linear-gradient(to bottom, transparent, rgba(0,0,0,0.4));"></div>
                        <div style="position: absolute; top: 15px; left: 15px; background: rgba(255,255,255,0.9); padding: 5px 15px; border-radius: 12px; font-weight: 900; color: #1e40af; font-size: 0.8rem; box-shadow: 0 5px 15px rgba(0,0,0,0.2);">
                            ${pillText}
                        </div>
                    </div>
                    
                    <div style="padding: 25px; color: white;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div>
                                <h4 style="margin: 0; font-size: 0.85rem; font-weight: 800; color: #00E36D; text-transform: uppercase; letter-spacing: 1px;">${logoText}</h4>
                                <h2 style="margin: 5px 0 0; font-size: 1.6rem; font-weight: 950; line-height: 1;">${context.eventName || 'Americana Hoy'}</h2>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-size: 1.1rem; font-weight: 950;">${context.eventTime || context.matchTime || '18:00'}</div>
                                <div style="font-size: 0.75rem; font-weight: 600; opacity: 0.7;">${context.matchDay || 'HOY'}</div>
                            </div>
                        </div>
                        
                        <p style="margin: 15px 0 20px; font-size: 0.9rem; color: rgba(255,255,255,0.85); line-height: 1.4;">
                            ${explainerText}
                        </p>
                        
                        <button style="
                            width: 100%; height: 55px; border-radius: 16px; border: none;
                            background: ${btnBg}; color: ${btnBg === '#00E36D' ? 'black' : 'white'};
                            font-weight: 950; font-size: 1.1rem; display: flex; align-items: center; justify-content: center; gap: 12px;
                            box-shadow: 0 10px 20px rgba(0,0,0,0.2); transition: all 0.2s;
                            text-transform: uppercase; letter-spacing: 1px;
                        ">
                            ${btnText} <i class="fas fa-arrow-right"></i>
                        </button>
                    </div>
                </div>
            `;
        }

        async renderLiveWidget(context) {
            try {
                const allEvents = window.AmericanaService ? await window.AmericanaService.getAllActiveEvents() : [];
                const openEvents = allEvents.filter(a => ['open', 'upcoming', 'draft', 'scheduled'].includes(a.status));

                if (openEvents.length > 0) {
                    let html = '';
                    openEvents.forEach(am => {
                        const statusColor = am.status === 'open' ? '#00E36D' : '#00c4ff';
                        const statusLabel = am.status === 'open' ? 'ABIERTO' : 'PRÓXIMO';
                        const players = am.players || am.registeredPlayers || [];
                        const maxPlayers = (am.max_courts || 0) * 4;
                        const spotsLeft = Math.max(0, maxPlayers - players.length);
                        const isFull = maxPlayers > 0 && players.length >= maxPlayers;
                        const categoryIcon = am.category === 'female' ? '♀️' : (am.category === 'male' ? '♂️' : '🎾');
                        const typeLabel = am.type === 'entreno' ? 'ENTRENO' : 'AMERICANA';

                        html += `
                            <div class="registration-ticker-card" 
                                 onclick="event.stopPropagation(); window.ControlTowerView?.prepareLoad('${am.id}'); Router.navigate('live');" 
                                 style="
                                min-width: 160px; 
                                max-width: 160px;
                                background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%); 
                                border-top: 2px solid ${statusColor};
                                border-radius: 12px; 
                                padding: 10px; 
                                flex-shrink: 0; 
                                box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                                display: flex; 
                                flex-direction: column; 
                                gap: 6px; 
                                cursor: pointer;
                                transition: all 0.3s ease;
                                border: 1px solid rgba(255,255,255,0.05);
                            "
                            >
                                <!-- Header with Status -->
                                <div style="display:flex; justify-content:space-between; align-items:center;">
                                    <span style="font-size:0.5rem; font-weight:900; color:${statusColor}; background:rgba(0,227,109,0.1); padding:2px 6px; border-radius:4px;">${statusLabel}</span>
                                    <span style="font-size:0.85rem;">${categoryIcon}</span>
                                </div>
                                
                                <!-- Event Name - Compact -->
                                <div style="color:white; font-weight:800; font-size:0.75rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; line-height:1.1;">
                                    ${am.name.toUpperCase()}
                                </div>
                                <div style="color:${statusColor}; font-size:0.5rem; font-weight:900; opacity:0.8; letter-spacing:1px;">${typeLabel}</div>
                                
                                <!-- Date & Time - Compact -->
                                <div style="color:#888; font-size:0.6rem; font-weight:700;">
                                    ${this.formatDateShort(am.date)} ${am.time}
                                </div>
                                
                                <!-- Status & Count - Compact -->
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px; padding-top:6px; border-top:1px solid rgba(255,255,255,0.05);">
                                    <div style="font-size:0.75rem; color:${isFull ? '#FF3B30' : '#00E36D'}; font-weight:900;">
                                        ${isFull ? 'COMPLETO' : `${spotsLeft} LIB.`}
                                    </div>
                                    <div style="font-size:1.1rem; color:${isFull ? '#FF3B30' : '#00E36D'}; font-weight:900; display:flex; align-items:center; gap:4px;">
                                        <span style="font-size:1.3rem;">${players.length}</span>
                                        <span style="color:#666; font-size:0.8rem;">/${maxPlayers}</span>
                                    </div>
                                </div>
                            </div>
                        `;
                    });
                    return html;
                }
                return `<div style="width: 100%; text-align: center; color: #444; font-size: 0.75rem; font-weight: 700;">No hay eventos disponibles</div>`;
            } catch (err) { console.error(err); return ''; }
        }

        formatDateShort(dateString) {
            if (!dateString) return 'HOY';
            const date = new Date(dateString);
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            if (date.toDateString() === today.toDateString()) return 'HOY';
            if (date.toDateString() === tomorrow.toDateString()) return 'MAÑANA';

            const days = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
            return `${days[date.getDay()]} ${date.getDate()}`;
        }

        async buildContext(user) {
            const context = {
                status: 'EMPTY',
                eventName: null,
                eventDate: null,
                eventTime: null,
                court: null,
                opponents: null,
                partner: null,
                eventDateRaw: null,
                hasMatchToday: false,
                hasOpenTournament: false,
                activeTournaments: 0,
                upcomingMatches: 0,
                myEvents: []
            };

            try {
                if (window.AmericanaService) {
                    const allAmericanas = await window.AmericanaService.getActiveAmericanas();
                    if (!allAmericanas || allAmericanas.length === 0) return context;

                    // 1. Check for Active Tournaments (for ActionGrid badges)
                    const openAmericanas = allAmericanas.filter(a => ['open', 'upcoming', 'scheduled'].includes(a.status));
                    context.activeTournaments = openAmericanas.length;
                    context.hasOpenTournament = openAmericanas.length > 0;

                    if (user) {
                        // 2. Check for User's Matches
                        context.myEvents = allAmericanas.filter(a => {
                            const players = a.players || a.registeredPlayers || [];
                            return players.some(p => p === user.uid || (p.uid === user.uid) || (p.id === user.uid));
                        });

                        context.upcomingMatches = context.myEvents.filter(a => a.status !== 'finished').length;

                        // ONLY focus on events that are NOT finished
                        const myEvent = context.myEvents.find(e => !['finished', 'closed'].includes(e.status));

                        if (myEvent) {
                            const now = new Date();
                            const eventDate = new Date(myEvent.date);
                            const isToday = eventDate.toDateString() === now.toDateString();

                            if (myEvent.status === 'live' || (myEvent.status === 'scheduled' && isToday)) {
                                context.status = 'LIVE_MATCH';
                                context.hasMatchToday = true;
                                context.eventName = myEvent.name;
                                context.matchTime = myEvent.time;
                                context.matchDay = 'HOY';
                                context.court = myEvent.court || 'Pista 1';
                            } else {
                                context.status = 'UPCOMING_EVENT';
                                context.eventName = myEvent.name;
                                context.eventTime = myEvent.time || '18:00';
                                context.matchDay = this.formatDate(myEvent.date);
                            }
                        } else {
                            // No active events, just show default or nothing
                            context.status = 'EMPTY';
                        }
                    }
                }
            } catch (e) {
                console.warn("Context build failed", e);
            }
            return context;
        }

        formatDate(dateString) {
            if (!dateString) return '';
            const date = new Date(dateString);
            const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            return `${days[date.getDay()]} ${date.getDate()}`;
        }

        async loadLiveWidgetContent(context) {
            const container = document.getElementById('live-scroller-content');
            const aiContainer = document.getElementById('ai-activity-content');
            if (!container) return;

            try {
                // 1. Load Registration Cards
                this.renderLiveWidget(context).then(widgetHtml => {
                    container.innerHTML = widgetHtml;
                }).catch(e => {
                    console.error("Widget render failed", e);
                });

                // 2. Load AI Activity
                if (aiContainer) {
                    this.renderLiveActivity().then(html => {
                        aiContainer.innerHTML = html;
                    }).catch(e => {
                        console.error("AI Activity failed", e);
                    });
                }
            } catch (e) {
                console.error('❌ [DashboardView] Error loading widgets:', e);
            }
        }

        async renderLiveActivity() {
            try {
                const events = window.AmericanaService ? await window.AmericanaService.getAllActiveEvents() : [];
                let recentActions = [];

                events.forEach(am => {
                    const players = am.players || am.registeredPlayers || [];
                    const maxPlayers = (am.max_courts || 0) * 4;
                    const openSpots = maxPlayers - players.length;

                    if (players.length > 0) {
                        recentActions.push({
                            text: `<b>ALGUIEN</b> se unió a <span style="color:#00E36D;">${am.name}</span>`,
                            type: 'join',
                            timeLabel: 'HACE POCO'
                        });
                    }

                    if (openSpots > 0 && openSpots <= 2) {
                        recentActions.push({
                            text: `¡Solo quedan <b>${openSpots} plazas</b> para ${am.name}!`,
                            type: 'alert',
                            timeLabel: 'URGENTE'
                        });
                    }
                });

                if (recentActions.length === 0) {
                    recentActions = [{ text: "Previsión de alta ocupación hoy.", type: 'info', timeLabel: 'IA INFO' }];
                }

                const urgentAm = events.find(am => {
                    const pCount = (am.players || am.registeredPlayers || []).length;
                    const maxP = (am.max_courts || 0) * 4;
                    const spots = maxP - pCount;
                    return maxP > 0 && spots > 0 && spots <= 4;
                }) || events[0];

                let html = '';

                if (urgentAm) {
                    const pCount = (urgentAm.players || urgentAm.registeredPlayers || []).length;
                    const maxP = (urgentAm.max_courts || 0) * 4;
                    const spots = Math.max(0, maxP - pCount);
                    const isFull = spots === 0;

                    const cardBg = isFull ? 'linear-gradient(135deg, #475569 0%, #1e293b 100%)' : 'linear-gradient(135deg, #00C6FF 0%, #0072FF 100%)';
                    const btnText = isFull ? 'VER LISTA DE ESPERA' : 'APUNTARME AHORA';
                    const btnBg = isFull ? '#94a3b8' : '#00E36D';
                    const statusDesc = isFull ? '¡Pista completa! Avisaremos bajas.' : `¡Solo <b>${spots} plazas</b>! Se llenará pronto.`;

                    html += `
                        <div class="ai-hero-card" onclick="Router.navigate('americanas');" style="background: ${cardBg}; border-radius: 16px; padding: 20px; color: white; position: relative; overflow: hidden; margin-bottom: 5px; cursor: pointer;">
                            <div style="position: absolute; top: -20px; right: -20px; font-size: 5rem; color: rgba(255,255,255,0.1); transform: rotate(-15deg);"><i class="fas fa-star"></i></div>
                            <div style="background: rgba(255,255,255,0.2); backdrop-filter: blur(5px); color: white; padding: 4px 12px; border-radius: 100px; font-size: 0.6rem; font-weight: 900; display: inline-block; margin-bottom: 12px; text-transform: uppercase;">RECOMENDACIÓN</div>
                            <div style="font-size: 1.4rem; font-weight: 900; margin-bottom: 5px;">${urgentAm.name}</div>
                            <p style="font-size: 0.8rem; opacity: 0.9; margin-bottom: 15px;">${statusDesc}</p>
                            <div style="background: ${btnBg}; color: black; padding: 12px; border-radius: 12px; text-align: center; font-weight: 950; font-size: 0.8rem; display: flex; align-items: center; justify-content: center; gap: 10px;">${btnText} <i class="fas fa-arrow-right"></i></div>
                        </div>
                    `;
                }

                html += `<div style="display:flex; gap:10px; overflow-x: auto; padding: 5px 0;">`;
                recentActions.slice(0, 5).forEach(action => {
                    html += `
                        <div style="white-space: nowrap; background: rgba(255,255,255,0.08); padding: 8px 16px; border-radius: 100px; font-size: 0.75rem; color: white; font-weight: 700; display: flex; align-items: center; gap: 10px; border: 1px solid rgba(255,255,255,0.1);">
                            <div style="width: 8px; height: 8px; border-radius: 50%; background: #00E36D; box-shadow: 0 0 10px #00E36D;"></div>
                            ${action.text.replace(/<[^>]*>?/gm, '')}
                        </div>
                    `;
                });
                html += `</div>`;
                return html;
            } catch (e) { return ''; }
        }
    }

    window.DashboardView = new DashboardView();
    console.log("🚀 Vibrant Dashboard Loaded");
})();
