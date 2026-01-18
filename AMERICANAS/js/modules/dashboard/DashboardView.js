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
                    background: radial-gradient(circle at 50% 0%, rgba(15, 23, 42, 0.08) 0%, transparent 70%);
                    min-height: 100vh;
                ">

                    
                    <!-- LOGIC TO HIDE WEATHER IF EMPTY -->
                    <!-- 1. LIVE REGISTRATION WIDGET (FULL WIDTH SCROLLER) -->
                    <div id="registration-widget-root" style="
                        background: #0a0a14;
                        border: 1px solid rgba(0, 227, 109, 0.3);
                        border-radius: 20px;
                        margin: 25px 15px 0px; /* MORE TOP MARGIN, ZERO BOTTOM */
                        padding: 12px 15px;
                        box-shadow: 0 5px 25px rgba(0,0,0,0.5); /* REDUCED SHADOW */
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
                        
                        <div id="live-scroller-content" class="live-scroller" style="overflow-x: auto; display: flex; gap: 15px; justify-content: center; padding-bottom: 5px; -webkit-overflow-scrolling: touch;">
                            <div style="text-align: center; width: 100%; padding: 15px; color: rgba(255,255,255,0.4);">
                                <i class="fas fa-spinner fa-spin" style="font-size: 1.2rem; color: #00E36D;"></i>
                                <div style="margin-top: 8px; font-size: 0.75rem; font-weight: 700;">Buscando pistas...</div>
                            </div>
                        </div>
                    </div>

                    <!-- NEW WEATHER WIDGET -->
                    <div id="weather-widget-root" style="
                        margin: 0 15px;
                        display: none; /* HIDDEN BY DEFAULT */ 
                        gap: 10px; 
                        overflow-x: auto; 
                        animation: floatUp 0.8s ease-out forwards;
                    ">
                        <!-- Content loaded via JS -->
                    </div>

                    <!-- 1.25 ACTIVIDAD RECIENTE -->
                    <div id="activity-feed-root" style="
                        background: rgba(10, 10, 20, 0.9);
                        backdrop-filter: blur(20px);
                        border: 1px solid rgba(0, 227, 109, 0.2);
                        border-radius: 20px;
                        margin: 5px 15px 10px; /* BALANCED MARGINS */
                        padding: 15px;
                        box-shadow: 0 15px 35px rgba(0,0,0,0.5);
                        animation: floatUp 0.85s ease-out forwards;
                    ">
                        <div style="font-weight:950; font-size:0.85rem; color:white; letter-spacing:-0.5px; text-transform: uppercase; display: flex; align-items: center; gap: 8px; margin-bottom: 15px;">
                            <i class="fas fa-rss" style="color: #00E36D; font-size: 1rem;"></i> ACTIVIDAD RECIENTE
                        </div>
                        <div id="activity-feed-content" style="display: flex; flex-direction: column; gap: 10px;">
                            <!-- Content will be loaded here -->
                        </div>
                    </div>

                    <!-- 1.5 ÚLTIMA HORA (AI FEED) -->
                    <div id="ai-activity-root" style="
                        background: rgba(30, 41, 59, 0.95);
                        backdrop-filter: blur(20px);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        border-radius: 28px;
                        margin: 0 15px 25px; /* Removed top margin */
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

                    <!-- TICKER STATS REMOVED PER USER REQUEST -->
                    <!-- <div id="ticker-stats-root"></div> -->

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

                // Hide legacy hero/ticker (user requested removal)
                if (legacyHero) legacyHero.style.display = 'none';
                if (legacyTicker) legacyTicker.style.display = 'none'; // OCULTAR ÚLTIMOS RESULTADOS

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
                    <div style="min-width: 100%; background: var(--bg-card); border-radius: 32px; padding: 50px 30px; text-align: center; border: 1px solid var(--border-subtle); box-shadow: var(--shadow-lg);">
                        <div style="width: 80px; height: 80px; background: var(--bg-app); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 25px; border: 1px solid var(--border-subtle);">
                            <i class="fas fa-calendar-plus" style="font-size: 2.2rem; color: #cbd5e1;"></i>
                        </div>
                        <h3 style="color: var(--text-primary); font-weight: 950; font-size: 1.25rem; margin-bottom: 10px; letter-spacing: -0.5px;">SIN PLANES PRÓXIMOS</h3>
                        <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 25px; font-weight: 600; line-height: 1.5;">Apúntate a una americana para<br>empezar a sumar en el ranking.</p>
                        <button onclick="Router.navigate('americanas')" class="btn-3d primary" style="width: auto; padding: 14px 28px;">EXPLORAR EVENTOS</button>
                    </div>
                `;
            }

            return myEvents.map(am => `
                <div class="agenda-card" onclick="window.ControlTowerView?.prepareLoad('${am.id}'); Router.navigate('live');" style="
                    min-width: 280px; background: var(--bg-card);
                    border-radius: 32px; border: 1px solid var(--border-subtle);
                    padding: 24px; scroll-snap-align: center; position: relative;
                    box-shadow: var(--shadow-md);
                    transition: all 0.2s;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
                        <div style="color: var(--brand-neon); background: var(--brand-navy); padding: 4px 12px; border-radius: 10px; font-size: 0.7rem; font-weight: 950; letter-spacing: 1px; text-transform: uppercase;">${this.formatDateShort(am.date)}</div>
                        <div style="background: rgba(6, 182, 212, 0.1); color: var(--brand-accent); padding: 4px 10px; border-radius: 8px; font-size: 0.6rem; font-weight: 900;">CONFIRMADO</div>
                    </div>
                    <h4 style="margin: 0; color: var(--text-primary); font-size: 1.3rem; font-weight: 950; letter-spacing: -0.5px; line-height: 1.2;">${am.name}</h4>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 25px; padding-top: 15px; border-top: 1px solid var(--border-subtle);">
                        <span style="color: var(--text-secondary); font-size: 0.85rem; font-weight: 800;"><i class="far fa-clock" style="color: var(--brand-neon); margin-right: 8px;"></i> ${am.time}</span>
                        <div style="width: 36px; height: 36px; background: var(--brand-navy); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.9rem; box-shadow: var(--shadow-sm);">
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
            let btnClass = "primary";
            let logoText = "AMERICANAS";
            let explainerText = "¡Quedan pocas plazas! No te quedes fuera hoy.";
            let heroImage = "img/ball_hero.jpg";
            let overlayColor = "linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 64, 175, 0.7))";

            if (context.status === 'UPCOMING_EVENT') {
                pillText = "ESTÁS INSCRITO";
                btnText = "VER DETALLES";
                btnClass = "navy";
                logoText = "MI PLAZA";
                explainerText = "¡Prepárate! Tu próximo reto está a punto de empezar.";
                overlayColor = "linear-gradient(135deg, rgba(2, 6, 23, 0.95), rgba(6, 182, 212, 0.7))";
            } else if (context.status === 'FINISHED') {
                pillText = "EVENTO FINALIZADO";
                btnText = "VER RESUMEN";
                btnClass = "secondary";
                logoText = "HISTORY";
                explainerText = "Consulta los resultados y revive los mejores momentos.";
                overlayColor = "linear-gradient(135deg, rgba(31, 41, 55, 0.95), rgba(107, 114, 128, 0.7))";
            } else if (context.status === 'LIVE_MATCH') {
                pillText = "¡ESTÁS EN PISTA!";
                btnText = "MARCADOR EN VIVO";
                btnClass = "primary";
                logoText = "LIVE NOW";
                explainerText = "Tu partido está en progreso. ¡A por todas!";
                overlayColor = "linear-gradient(135deg, rgba(225, 29, 72, 0.95), rgba(204, 255, 0, 0.4))";
            }

            return `
                <div class="vibrant-hero-card" onclick="Router.navigate('live')" style="
                    background: ${overlayColor};
                    backdrop-filter: var(--backdrop-blur);
                    border-radius: 32px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 0;
                    margin-bottom: 30px;
                    overflow: hidden;
                    box-shadow: var(--shadow-xl);
                    position: relative;
                ">
                    <div style="height: 160px; background: url('${heroImage}') center/cover; position: relative;">
                        <div style="position: absolute; inset: 0; background: linear-gradient(to bottom, transparent, rgba(0,0,0,0.6));"></div>
                        <div style="position: absolute; top: 20px; left: 20px; background: var(--brand-neon); padding: 6px 16px; border-radius: 12px; font-weight: 950; color: #000; font-size: 0.75rem; box-shadow: var(--shadow-neon); letter-spacing: 1px;">
                            ${pillText}
                        </div>
                    </div>
                    
                    <div style="padding: 28px; color: white;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div>
                                <h4 style="margin: 0; font-size: 0.8rem; font-weight: 900; color: var(--brand-neon); text-transform: uppercase; letter-spacing: 2px;">${logoText}</h4>
                                <h2 style="margin: 8px 0 0; font-size: 1.8rem; font-weight: 950; line-height: 1.1; letter-spacing: -0.5px;">${context.eventName || 'Americana Hoy'}</h2>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-size: 1.3rem; font-weight: 950; color: var(--brand-neon);">${context.eventTime || context.matchTime || '18:00'}</div>
                                <div style="font-size: 0.75rem; font-weight: 700; opacity: 0.7; letter-spacing: 1px;">${context.matchDay || 'HOY'}</div>
                            </div>
                        </div>
                        
                        <p style="margin: 20px 0 25px; font-size: 0.95rem; color: rgba(255,255,255,0.9); line-height: 1.5; font-weight: 500;">
                            ${explainerText}
                        </p>
                        
                        <button class="btn-3d ${btnClass}" style="margin-top: 0; font-size: 1.1rem; height: 60px;">
                            ${btnText} <i class="fas fa-chevron-right" style="margin-left: 10px; font-size: 0.9rem;"></i>
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

                        /* 
                                                    Registration Ticker Card 
                                                 */
                        let catColor = '#84cc16'; // Default (Green/Generic)
                        const lowerName = am.name.toLowerCase();
                        if (lowerName.includes('femenina') || lowerName.includes('chicas')) {
                            catColor = '#ec4899'; // Pink
                        } else if (lowerName.includes('masculina') || lowerName.includes('chicos')) {
                            catColor = '#06b6d4'; // Cyan
                        } else if (lowerName.includes('mixto') || lowerName.includes('mix')) {
                            catColor = '#8b5cf6'; // Violet
                        }

                        html += `
                            <div class="registration-ticker-card" 
                                 onclick="event.stopPropagation(); window.ControlTowerView?.prepareLoad('${am.id}'); Router.navigate('live');" 
                                 style="
                                min-width: 160px; 
                                max-width: 160px;
                                background: linear-gradient(135deg, ${catColor}44 0%, rgba(10,10,10,0.95) 100%);
                                border-top: 3px solid ${statusColor};
                                border-bottom: 1px solid ${catColor}30;
                                border-left: 1px solid ${catColor}30;
                                border-right: 1px solid ${catColor}30;
                                border-radius: 12px; 
                                padding: 10px; 
                                flex-shrink: 0; 
                                box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                                display: flex; 
                                flex-direction: column; 
                                gap: 6px; 
                                cursor: pointer;
                                transition: all 0.3s ease;
                                backdrop-filter: blur(5px);
                                -webkit-backdrop-filter: blur(5px);
                            "
                            >
                                <!-- Header with Status -->
                                <div style="display:flex; justify-content:space-between; align-items:center;">
                                    <span style="font-size:0.5rem; font-weight:900; color:${statusColor}; background:rgba(255,255,255,0.05); padding:2px 6px; border-radius:4px;">${statusLabel}</span>
                                    <span style="font-size:0.85rem; filter: drop-shadow(0 0 5px ${catColor});">${categoryIcon}</span>
                                </div>
                                
                                <!-- Event Name - Compact -->
                                <div style="color:white; font-weight:800; font-size:0.75rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; line-height:1.1; text-shadow: 0 0 10px ${catColor}80;">
                                    ${am.name.toUpperCase()}
                                </div>
                                <div style="color:${statusColor}; font-size:0.5rem; font-weight:900; opacity:0.8; letter-spacing:1px;">${typeLabel}</div>
                                
                                <!-- Date & Time - Compact -->
                                <div style="color:#aaa; font-size:0.6rem; font-weight:700;">
                                    ${this.formatDateShort(am.date)} ${am.time}
                                </div>
                                
                                <!-- Status & Count - Compact -->
								<div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px; padding-top:6px; border-top:1px solid ${catColor}30; cursor: pointer;"
									 onclick="event.stopPropagation(); window.EventsController?.openPlayerListModal('${am.id}')">
									<div style="font-size: 0.75rem; color: ${isFull ? '#FF3B30' : '#00E36D'}; font-weight: 900;">
										${isFull ? 'COMPLETO' : `${spotsLeft} LIB.`}
									</div>
									<div style="font-size: 1.1rem; color: ${isFull ? '#FF3B30' : '#00E36D'}; font-weight: 900; display: flex; align-items: center; gap: 4px;">
										<span style="font-size: 1.3rem;">${players.length}</span>
										<span style="color: #888; font-size: 0.8rem;">/${maxPlayers}</span>
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

                // 3. Load Activity Feed
                const activityContainer = document.getElementById('activity-feed-content');
                if (activityContainer) {
                    this.renderActivityFeed().then(html => {
                        activityContainer.innerHTML = html;
                    }).catch(e => {
                        console.error("Activity Feed failed", e);
                    });
                }
            } catch (e) {
                console.error('❌ [DashboardView] Error loading widgets:', e);
            }
        }

        async renderActivityFeed() {
            try {
                // Inyectar estilos de animación si no existen
                if (!document.getElementById('activity-feed-styles')) {
                    const style = document.createElement('style');
                    style.id = 'activity-feed-styles';
                    style.textContent = `
                        @keyframes gradientFlow {
                            0% { background-position: 0% 50%; }
                            50% { background-position: 100% 50%; }
                            100% { background-position: 0% 50%; }
                        }
                        @keyframes pulseGlow {
                            0% { opacity: 0.5; transform: scaleY(0.95); }
                            50% { opacity: 1; transform: scaleY(1); }
                            100% { opacity: 0.5; transform: scaleY(0.95); }
                        }
                        .activity-item-hover:hover {
                            background: rgba(255,255,255,0.06) !important;
                            transform: translateX(5px);
                        }
                    `;
                    document.head.appendChild(style);
                }

                const activities = [];

                // 1. Obtener datos de múltiples fuentes en paralelo
                const [registrations, urgentAlerts, rankingChanges] = await Promise.all([
                    this.getRecentRegistrations(60),
                    this.getUrgentAlerts(),
                    this.getRankingChanges()
                ]);

                // 2. Convertir inscripciones a formato de actividad
                registrations.forEach(reg => {
                    // Determinar color según categoría (Nombre del evento)
                    let catColor = '#84cc16'; // Default Green (Lime)
                    let catColorSec = '#bef264';

                    const lowerName = reg.eventName.toLowerCase();
                    if (lowerName.includes('femenina') || lowerName.includes('chicas')) {
                        catColor = '#ec4899'; // Pink-500
                        catColorSec = '#f472b6'; // Pink-400
                    } else if (lowerName.includes('masculina') || lowerName.includes('chicos')) {
                        catColor = '#06b6d4'; // Cyan-500
                        catColorSec = '#22d3ee'; // Cyan-400
                    } else if (lowerName.includes('mixto') || lowerName.includes('mix')) {
                        catColor = '#8b5cf6'; // Violet-500
                        catColorSec = '#a78bfa'; // Violet-400
                    }

                    activities.push({
                        type: 'registration',
                        icon: '🎾',
                        title: `${reg.playerName} se unió a ${reg.eventName}`,
                        time: this.formatRelativeTime(reg.timestamp),
                        color: catColor,
                        secondaryColor: catColorSec,
                        timestamp: reg.timestamp,
                        score: 0
                    });
                });

                // 3. Convertir alertas de urgencia
                urgentAlerts.forEach(alert => {
                    activities.push({
                        type: 'urgent',
                        icon: '⚠️',
                        title: alert.title,
                        time: 'ahora',
                        color: '#ef4444',
                        secondaryColor: '#f87171', // Red-400
                        timestamp: alert.timestamp,
                        priority: 'critical',
                        score: 0
                    });
                });

                // 4. Convertir cambios de ranking
                rankingChanges.forEach(change => {
                    activities.push({
                        type: 'ranking',
                        icon: change.position === 1 ? '👑' : '📈',
                        title: `${change.playerName} ${change.position === 1 ? 'lidera el ranking' : `está en TOP ${change.position}`}`,
                        time: this.formatRelativeTime(change.timestamp),
                        color: '#f59e0b',
                        secondaryColor: '#fbbf24', // Amber-400
                        timestamp: change.timestamp,
                        score: 0
                    });
                });

                // 5. Calcular scores para cada actividad
                activities.forEach(a => {
                    a.score = this.calculateActivityScore(a);
                    if (!a.secondaryColor) a.secondaryColor = a.color;
                });

                // 6. Ordenar por score y limitar a top 5
                const top5 = activities
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 5);

                // 7. Renderizar
                if (top5.length === 0) {
                    return `
                        <div style="text-align: center; padding: 20px; color: rgba(255,255,255,0.4);">
                            <i class="fas fa-inbox" style="font-size: 1.5rem; opacity: 0.3; margin-bottom: 10px; display: block;"></i>
                            <div style="font-size: 0.75rem; font-weight: 700;">Sin actividad reciente</div>
                        </div>
                    `;
                }

                return top5.map((activity, index) => `
                    <div class="activity-item-hover" style="
                        position: relative;
                        display: flex;
                        align-items: start;
                        gap: 12px;
                        padding: 12px 14px;
                        background: linear-gradient(90deg, ${activity.color}55 0%, rgba(0,0,0,0.4) 100%);
                        backdrop-filter: blur(10px);
                        -webkit-backdrop-filter: blur(10px);
                        border-radius: 12px;
                        margin-bottom: 8px;
                        border: 1px solid ${activity.color}30;
                        overflow: hidden;
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                        animation: slideIn 0.5s ease-out backwards;
                        animation-delay: ${index * 0.1}s;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                    ">
                        <!-- Living Color Bar -->
                        <div style="
                            position: absolute;
                            left: 0;
                            top: 0;
                            bottom: 0;
                            width: 4px;
                            background: linear-gradient(180deg, ${activity.color}, ${activity.secondaryColor}, ${activity.color});
                            background-size: 100% 200%;
                            animation: gradientFlow 3s infinite linear;
                            box-shadow: 0 0 10px ${activity.color}60;
                        "></div>

                        <!-- Icon Container with Glow -->
                        <div style="
                            font-size: 1.2rem;
                            position: relative;
                            z-index: 2;
                            text-shadow: 0 0 15px ${activity.color}80;
                            animation: pulseGlow 2s infinite ease-in-out;
                        ">${activity.icon}</div>

                        <div style="flex: 1; z-index: 2;">
                            <div style="
                                font-size: 0.8rem; 
                                font-weight: 700; 
                                color: white; 
                                line-height: 1.3;
                                text-shadow: 0 2px 4px rgba(0,0,0,0.5);
                            ">
                                ${activity.title}
                            </div>
                            <div style="
                                font-size: 0.65rem; 
                                color: rgba(255,255,255,0.6); 
                                margin-top: 4px; 
                                font-weight: 600;
                                display: flex;
                                align-items: center;
                                gap: 4px;
                            ">
                                <span style="
                                    display: inline-block;
                                    width: 6px;
                                    height: 6px;
                                    border-radius: 50%;
                                    background: ${activity.color};
                                    box-shadow: 0 0 5px ${activity.color};
                                "></span>
                                ${activity.time}
                            </div>
                        </div>
                    </div>
                `).join('');
            } catch (e) {
                console.error('Activity Feed error:', e);
                return '';
            }
        }

        async getRecentRegistrations(minutesAgo = 60) {
            try {
                const cutoff = Date.now() - (minutesAgo * 60 * 1000);
                const events = window.AmericanaService ? await window.AmericanaService.getAllActiveEvents() : [];
                const registrations = [];

                events.forEach(event => {
                    const players = event.players || event.registeredPlayers || [];
                    if (players.length > 0) {
                        // Simular timestamp reciente para últimos jugadores
                        const recentPlayers = players.slice(-Math.min(3, players.length));
                        recentPlayers.forEach((playerId, index) => {
                            const timestamp = Date.now() - (index * 15 * 60 * 1000); // Cada 15 min
                            if (timestamp > cutoff) {
                                registrations.push({
                                    type: 'registration',
                                    playerName: this.getPlayerName(playerId),
                                    eventName: event.name,
                                    timestamp: timestamp,
                                    eventId: event.id
                                });
                            }
                        });
                    }
                });

                return registrations;
            } catch (e) {
                console.error('Error getting registrations:', e);
                return [];
            }
        }

        async getUrgentAlerts() {
            try {
                const events = window.AmericanaService ? await window.AmericanaService.getAllActiveEvents() : [];
                const alerts = [];

                events.forEach(event => {
                    if (!['open', 'upcoming', 'scheduled'].includes(event.status)) return;

                    const players = (event.players || event.registeredPlayers || []).length;
                    const maxPlayers = (event.max_courts || 0) * 4;
                    const spotsLeft = maxPlayers - players;

                    if (spotsLeft > 0 && spotsLeft <= 2 && maxPlayers > 0) {
                        alerts.push({
                            type: 'urgent',
                            title: `¡ÚLTIMA${spotsLeft === 1 ? '' : 'S'} ${spotsLeft} PLAZA${spotsLeft === 1 ? '' : 'S'}! ${event.name}`,
                            eventName: event.name,
                            spotsLeft,
                            timestamp: Date.now(),
                            priority: 'critical'
                        });
                    }
                });

                return alerts;
            } catch (e) {
                console.error('Error getting urgent alerts:', e);
                return [];
            }
        }

        async getRankingChanges() {
            try {
                if (!window.RankingController) return [];

                const players = await window.RankingController.calculateSilently();
                const changes = [];

                // Top 3 jugadores con puntos
                players.slice(0, 3).forEach((player, index) => {
                    const points = player.stats?.americanas?.points || 0;
                    if (points > 0) {
                        changes.push({
                            type: 'ranking',
                            playerName: player.name,
                            position: index + 1,
                            points: points,
                            timestamp: Date.now() - Math.random() * 7200000 // Últimas 2 horas
                        });
                    }
                });

                return changes;
            } catch (e) {
                console.error('Error getting ranking changes:', e);
                return [];
            }
        }

        calculateActivityScore(activity) {
            let score = 0;

            // 1. Urgencia temporal (0-100 puntos)
            const minutesAgo = (Date.now() - activity.timestamp) / 60000;
            score += Math.max(0, 100 - minutesAgo);

            // 2. Prioridad por tipo (0-100 puntos)
            const priorityScores = {
                'urgent': 100,      // Alertas de urgencia
                'registration': 70, // Inscripciones
                'ranking': 50,      // Cambios ranking
                'match': 30,        // Partidos finalizados
                'event': 20         // Nuevos eventos
            };
            score += priorityScores[activity.type] || 0;

            // 3. Bonus por criticidad
            if (activity.priority === 'critical') score += 50;

            return score;
        }

        formatRelativeTime(timestamp) {
            const seconds = Math.floor((Date.now() - timestamp) / 1000);

            if (seconds < 60) return 'ahora';
            if (seconds < 3600) return `hace ${Math.floor(seconds / 60)} min`;
            if (seconds < 86400) return `hace ${Math.floor(seconds / 3600)}h`;
            return `hace ${Math.floor(seconds / 86400)}d`;
        }

        getPlayerName(playerId) {
            // Intentar obtener nombre del jugador
            if (typeof playerId === 'string') {
                // Es solo un ID, devolver "Alguien"
                return 'Alguien';
            } else if (playerId && playerId.name) {
                // Es un objeto con nombre
                return playerId.name.split(' ')[0];
            }
            return 'Alguien';
        }

        async renderLiveActivity() {
            try {
                const events = window.AmericanaService ? await window.AmericanaService.getAllActiveEvents() : [];
                let recentActions = [];

                // Find the most urgent event (fewest spots left)
                const urgentAm = events.find(am => {
                    const pCount = (am.players || am.registeredPlayers || []).length;
                    const maxP = (am.max_courts || 0) * 4;
                    const spots = maxP - pCount;
                    return maxP > 0 && spots > 0 && spots <= 4;
                }) || events[0];

                if (urgentAm) {
                    const players = urgentAm.players || urgentAm.registeredPlayers || [];
                    const pCount = players.length;
                    const maxP = (urgentAm.max_courts || 0) * 4;
                    const spots = Math.max(0, maxP - pCount);
                    const isFull = spots === 0;

                    const cardBg = isFull ? 'linear-gradient(135deg, #475569 0%, #1e293b 100%)' : 'linear-gradient(135deg, #00C6FF 0%, #0072FF 100%)';
                    const btnText = isFull ? 'VER LISTA DE ESPERA' : 'APUNTARME AHORA';
                    const btnBg = isFull ? '#94a3b8' : '#00E36D';
                    const statusDesc = isFull ? '¡Pista completa! Avisaremos bajas.' : `¡Solo <b>${spots} plazas</b>! Se llenará pronto.`;

                    // FIXED: Route explicitly to entrenos using global Router
                    const navigateAction = "window.Router.navigate('entrenos'); setTimeout(() => { if(window.EventsController) window.EventsController.filterByType('entreno'); }, 200);";

                    let html = '';

                    // Styles for seamless marquee
                    html += `
                        <style>
                            @keyframes marquee-scroll {
                                0% { transform: translateX(0); }
                                100% { transform: translateX(-50%); } 
                            }
                            .ticker-marquee-container {
                                overflow: hidden;
                                white-space: nowrap;
                                position: relative;
                                mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
                                -webkit-mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
                            }
                            .ticker-marquee-content {
                                display: inline-block;
                                animation: marquee-scroll 20s linear infinite;
                                white-space: nowrap;
                            }
                            .ticker-tag {
                                display: inline-flex;
                                align-items: center;
                                gap: 6px;
                                background: rgba(255,255,255,0.08);
                                padding: 6px 14px;
                                border-radius: 100px;
                                font-size: 0.75rem;
                                color: white;
                                font-weight: 700;
                                border: 1px solid rgba(255,255,255,0.1);
                                margin-right: 12px;
                            }
                        </style>
                    `;

                    html += `
                        <div class="ai-hero-card" onclick="${navigateAction}" style="background: ${cardBg}; border-radius: 16px; padding: 20px; color: white; position: relative; overflow: hidden; margin-bottom: 5px; cursor: pointer;">
                            <div style="position: absolute; top: -20px; right: -20px; font-size: 5rem; color: rgba(255,255,255,0.1); transform: rotate(-15deg);"><i class="fas fa-star"></i></div>
                            <div style="background: rgba(255,255,255,0.2); backdrop-filter: blur(5px); color: white; padding: 4px 12px; border-radius: 100px; font-size: 0.6rem; font-weight: 900; display: inline-block; margin-bottom: 12px; text-transform: uppercase;">RECOMENDACIÓN</div>
                            <div style="font-size: 1.4rem; font-weight: 900; margin-bottom: 5px;">${urgentAm.name}</div>
                            <p style="font-size: 0.8rem; opacity: 0.9; margin-bottom: 15px;">${statusDesc}</p>
                            <div style="background: ${btnBg}; color: black; padding: 12px; border-radius: 12px; text-align: center; font-weight: 950; font-size: 0.8rem; display: flex; align-items: center; justify-content: center; gap: 10px;">
                                ${btnText} <i class="fas fa-arrow-right"></i>
                            </div>
                        </div>
                    `;

                    // Generate Hype Content
                    const hypeMessages = [
                        `🔥 <b>${pCount + 3} personas</b> viéndolo`,
                        `⚡ <b>Alta Demanda</b>: Se llenará hoy`,
                        `🏆 <b>Nivel Garantizado</b>`
                    ];

                    if (players.length > 0) {
                        // Pick a random player to show "X just joined"
                        const randomPlayer = players[Math.floor(Math.random() * players.length)];
                        const pName = (randomPlayer.name || 'Jugador').split(' ')[0];
                        hypeMessages.unshift(`🚀 <b>${pName}</b> acaba de unirse`);
                    }

                    // Duplicate messages for smooth infinite scroll
                    const tickerContent = [...hypeMessages, ...hypeMessages, ...hypeMessages].map(msg => `
                        <div class="ticker-tag">
                            <div style="width: 6px; height: 6px; border-radius: 50%; background: #00E36D; box-shadow: 0 0 5px #00E36D;"></div>
                            ${msg}
                        </div>
                    `).join('');

                    html += `
                        <div class="ticker-marquee-container" style="padding: 5px 0;">
                            <div class="ticker-marquee-content">
                                ${tickerContent}
                            </div>
                        </div>
                    `;
                    return html;
                }

                return '';
            } catch (e) { return ''; }
        }
    }

    window.DashboardView = new DashboardView();
    console.log("🚀 Vibrant Dashboard Loaded");
})();
