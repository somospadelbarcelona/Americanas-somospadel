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
            const container = document.getElementById('content-area');
            if (!container) return;

            // 1. Get Real User Data
            const user = window.Store ? window.Store.getState('currentUser') : null;
            const userName = user ? (user.name || "Alejandro Coscolín") : "Alejandro Coscolín";
            const userInitials = userName.substring(0, 2).toUpperCase();

            // Simulation of Level (In real app, fetch from Store)
            const userLevel = user ? (user.level || "3.5") : "3.5";

            // 2. Build Context (The Brains) - ACTIVATED
            const context = await this.buildContext(user);

            // UPDATE GLOBAL HEADER (If exists)
            const headerName = document.getElementById('header-user-name');
            const headerAvatar = document.getElementById('header-user-avatar');
            if (headerName && userName) headerName.innerText = userName.split(' ')[0].toUpperCase();
            if (headerAvatar && userInitials) headerAvatar.innerText = userInitials;

            // 3. Render "Community Black/Neon" UI (CONTENT ONLY)
            container.innerHTML = `
                <!-- MAIN DASHBOARD SCROLL CONTENT -->
                <!-- padding-top is handled by #content-area css in index.html now -->
                <div class="dashboard-v2-container fade-in full-width-mobile">
                    
                    <!-- 1. LIVE MATCH WIDGET -->
                    <div class="live-widget-container mobile-panel">
                        <div class="live-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                            <div style="font-weight:900; font-size:1.1rem; color:var(--brand-navy); letter-spacing:-0.5px;">EN JUEGO <span style="color:var(--brand-red);">AHORA</span></div>
                            <div class="live-indicator-tag" style="background:var(--brand-red); color:white; padding:4px 8px; border-radius:6px; font-size:0.7rem; font-weight:800; display:flex; align-items:center;">
                                <div class="pulsing-dot" style="background:white; width:6px; height:6px; border-radius:50%; margin-right:4px; animation:blink 1s infinite;"></div>
                                LIVE
                            </div>
                        </div>
                        
                        <div class="live-scroller">
                            ${this.renderLiveWidget(context)}
                        </div>
                    </div>
                    
                    <!-- 2. SMART HERO CARD -->
                    <div class="mobile-panel">
                        ${this.renderSmartHero(context, userLevel)}
                    </div>

                    <!-- 3. PRO CONTENT SECTION -->
                    <div class="pro-content-section mobile-panel" style="padding-bottom: 120px;">
                        
                        <!-- A. EVENTS FEED -->
                        <div class="section-header" style="padding: 0 4px; margin-bottom: 16px; display:flex; justify-content:space-between; align-items:center;">
                            <h3 style="color:var(--text-primary); font-size:1.1rem; font-weight:800; letter-spacing:-0.5px; margin:0;">PRÓXIMAS <span style="color:var(--brand-neon)">AMERICANAS</span></h3>
                            <span style="color:#666; font-size:0.8rem; font-weight:600; cursor:pointer;" onclick="Router.navigate('agenda')">Ver todo</span>
                        </div>

                        <!-- Horizontal Scroller for Events -->
                        <div class="events-scroller" style="display: flex; overflow-x: auto; padding: 0 4px 20px 4px; gap: 10px; scroll-snap-type: x mandatory;">

                            <div class="event-card-pro" onclick="Router.navigate('americanas')" style="min-width: 85vw; background: #1a1a1a; border-radius: 16px; overflow: hidden; scroll-snap-align: center; border: 1px solid #333; position:relative;">
                                <div style="height: 120px; background: url('img/default-americana.jpg') center/cover; position:relative;">
                                    <div style="position:absolute; top:10px; right:10px; background:rgba(0,0,0,0.7); color:white; padding:4px 8px; border-radius:6px; font-weight:700; font-size:0.7rem;">
                                        MAÑANA
                                    </div>
                                </div>
                                <div style="padding: 15px;">
                                    <div style="color:var(--brand-neon); font-size:0.7rem; font-weight:800; letter-spacing:1px; margin-bottom:5px;">NIVEL 3.5 - 4.0</div>
                                    <div style="color:white; font-size:1.2rem; font-weight:700; margin-bottom:10px; line-height:1.2;">Americana Nocturna</div>
                                    <div style="display:flex; justify-content:space-between; align-items:center; color:#999; font-size:0.9rem;">
                                        <span><i class="far fa-clock"></i> 20:00 - 22:00</span>
                                        <span style="color:white; background:var(--brand-navy); padding:6px 12px; border-radius:6px;">8€</span>
                                    </div>
                                </div>
                            </div>

                            <div class="event-card-pro" onclick="Router.navigate('americanas')" style="min-width: 85vw; background: #1a1a1a; border-radius: 16px; overflow: hidden; scroll-snap-align: center; border: 1px solid #333;">
                                <div style="height: 120px; background: linear-gradient(45deg, #111, #222); display:flex; align-items:center; justify-content:center;">
                                    <i class="fas fa-bolt" style="color:#333; font-size:4rem;"></i>
                                </div>
                                <div style="padding: 15px;">
                                    <div style="color:var(--brand-blue); font-size:0.7rem; font-weight:800; letter-spacing:1px; margin-bottom:5px;">NIVEL 4.0+</div>
                                    <div style="color:white; font-size:1.2rem; font-weight:700; margin-bottom:10px; line-height:1.2;">King of Court</div>
                                    <div style="display:flex; justify-content:space-between; align-items:center; color:#999; font-size:0.9rem;">
                                        <span><i class="far fa-calendar"></i> Sábado</span>
                                        <span style="color:white; background:var(--brand-navy); padding:6px 12px; border-radius:6px;">12€</span>
                                    </div>
                                </div>
                            </div>

                        </div>

                        <!-- B. LATEST PERSONAL RESULTS WIDGET -->
                        <div class="section-header" style="padding: 0 4px; margin-bottom: 16px; margin-top: 32px; display:flex; justify-content:space-between; align-items:center;">
                            <h3 style="color:var(--text-primary); font-size:1.1rem; font-weight:800; letter-spacing:-0.5px; margin:0;">MIS <span style="color:var(--brand-neon)">RANKING</span></h3>
                            <span style="color:#666; font-size:0.8rem; font-weight:600; cursor:pointer;" onclick="Router.navigate('results')">Ver todos</span>
                        </div>

                        <div class="ranking-preview" style="margin: 0; background: #fff; border-radius: 16px; padding: 15px; border: 1px solid rgba(0,0,0,0.05); box-shadow: var(--shadow-card);">
                            <div style="display:flex; align-items:center; margin-bottom:12px; border-bottom:1px solid var(--border-subtle); padding-bottom:12px;">
                                <div style="width:24px; font-weight:800; color:#4ADE80;">W</div>
                                <div style="flex:1; color:var(--text-primary); font-weight:600;">Americana Nocturna</div>
                                <div style="font-weight:700; color:var(--text-primary);">+0.12</div>
                            </div>
                            <div style="display:flex; align-items:center;">
                                <div style="width:24px; font-weight:800; color:#FF4D4D;">L</div>
                                <div style="flex:1; color:var(--text-primary); font-weight:600;">King of Court</div>
                                <div style="font-weight:700; color:var(--text-primary);">-0.05</div>
                            </div>
                        </div>

                    </div>

                </div>
            `;
        }

        /**
         * Decide which Hero Card to show based on Context Priority
         */
        /**
         * 4. INTELLIGENT RENDERER: Choose the perfect Hero Card
         */
        /**
         * 4. INTELLIGENT RENDERER: Choose the perfect Hero Card
         */
        renderSmartHero(context, userLevel) {
            // CAROUSEL HERO (Slide Interaction)

            // Slide 1: Primary Context
            let slide1 = '';
            if (context.status === 'LIVE_MATCH') {
                slide1 = `
                     <div class="hero-slide-item live-pulse">
                        <div class="pulse-ring"></div>
                        <div class="hero-label">🔴 TU PARTIDO EN JUEGO</div>
                        <div class="hero-title" style="margin-top:10px;">PISTA ${context.court}</div>
                        <div class="hero-subtitle">vs ${context.opponents}</div>
                        <button class="btn-3d navy" onclick="Router.navigate('americanas')">VER MARCADOR</button>
                    </div>
                `;
            } else if (context.status === 'UPCOMING_EVENT' || context.status === 'OPEN_REGISTRATION' || context.status === 'FINISHED') {

                // --- PARSE DATE ---
                const dateObj = new Date(context.eventDateRaw || new Date());
                const dayMatch = context.eventDate ? context.eventDate.match(/\d+/) : null;
                const dayNum = dayMatch ? dayMatch[0] : dateObj.getDate();
                const monthName = "ENE";

                // --- DETERMINE STATE VISUALS ---
                let stateClass = "";
                let pillText = "ABIERTA";
                let btnText = "APUNTARME 14€";
                let btnStyle = "background:var(--brand-neon); color:black;";
                let logoText = "AMERICANAS";
                let explainerText = "¡Quedan pocas plazas! Apúntate ya.";
                let statusIcon = "fa-lock-open";
                let iconAnim = "pt-icon-unlock"; // Class for animation

                if (context.status === 'UPCOMING_EVENT') {
                    // USER IS REGISTERED
                    stateClass = "state-registered";
                    pillText = "INSCRIT@";
                    btnText = "VER MI PLAZA";
                    btnStyle = "background:#059669; color:white; border:none;";
                    logoText = "TU PLAZA";
                    explainerText = "Todo listo. Recuerda llegar 15min antes.";
                    statusIcon = "fa-check-circle";
                    iconAnim = "pt-icon-check";
                } else if (context.status === 'FINISHED') {
                    // EVENT FINISHED
                    stateClass = "state-finished";
                    pillText = "FINALIZADA";
                    btnText = "VER VIDEO / RESULTADOS";
                    btnStyle = "background:rgba(255,255,255,0.1); border:1px solid #666; color:white;";
                    logoText = "RESUMEN";
                    explainerText = "Consulta los ganadores y estadísticas.";
                    statusIcon = "fa-flag-checkered";
                    iconAnim = "";
                } else {
                    // OPEN
                    stateClass = "state-open";
                }

                slide1 = `
                <div class="playtomic-hero-card ${stateClass}" onclick="Router.navigate('americanas')">
                    <!-- Image Area -->
                    <div class="pt-image-bg" style="background-image: url('img/ball_hero.jpg'), linear-gradient(45deg, #222, #444);">
                        <div class="pt-date-badge">
                            <span class="pt-date-day">${dayNum}</span>
                            <span class="pt-date-month">${monthName}</span>
                        </div>
                        
                        <!-- Pulse Pill -->
                        <div class="pt-status-pill">
                            <i class="fas ${statusIcon} ${iconAnim}" style="margin-right:4px;"></i> ${pillText}
                        </div>
                        
                        <!-- Small Logo Center -->
                        <div class="pt-center-logo">
                            <span class="pt-logo-text">${logoText}</span>
                            <span class="pt-sub-text">SOMOS PADEL BCN</span>
                        </div>
                    </div>

                    <!-- Content Footer -->
                    <div class="pt-card-content">
                        <div class="pt-title-row">
                            <div class="pt-title">${context.eventName}</div>
                             ${context.status === 'OPEN_REGISTRATION' ? `<div class="pt-price-tag">14€</div>` : ''}
                        </div>
                        
                        <!-- Explainer Line -->
                        <div class="pt-explainer-text">
                            ${explainerText}
                        </div>

                        <div class="pt-details-row" style="margin-top:8px;">
                            <div class="pt-detail-item">
                                <i class="far fa-clock"></i> ${context.eventTime}
                            </div>
                            <div class="pt-detail-item">
                                <i class="fas fa-layer-group"></i> Nivel 3.5 - 4.5
                            </div>
                        </div>
                        
                        <!-- CTA -->
                        <div style="margin-top:12px; width:100%;">
                             <button style="width:100%; border-radius:12px; padding:12px 0; font-weight:800; font-size:0.85rem; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; box-shadow:0 4px 10px rgba(0,0,0,0.2); ${btnStyle}">
                                ${btnText} <i class="fas fa-arrow-right"></i>
                             </button>
                        </div>
                    </div>
                </div>
                `;
            } else {
                // EMPTY / NO EVENTS
                slide1 = `
                <div class="playtomic-hero-card" onclick="Router.navigate('americanas')">
                    <div class="pt-image-bg" style="background: linear-gradient(135deg, #111, #222);">
                        <div class="pt-date-badge">
                            <span class="pt-date-day">??</span>
                            <span class="pt-date-month">HOY</span>
                        </div>
                        
                        <div class="pt-center-logo">
                            <span class="pt-logo-text">TU PARTIDO</span>
                            <span class="pt-sub-text">RESERVA AHORA</span>
                        </div>
                    </div>

                    <div class="pt-card-content">
                         <div class="pt-title-row">
                            <div class="pt-title">Buscar Americana</div>
                        </div>
                        <div class="pt-details-row">
                            <span style="font-size:0.8rem; opacity:0.7;">No hay eventos activos. Organiza el tuyo.</span>
                        </div>
                        <div style="margin-top:12px; width:100%;">
                             <button style="width:100%; border-radius:12px; padding:10px 0; font-weight:800; font-size:0.85rem; cursor:pointer; background:var(--brand-neon); color:black;">
                                VER CALENDARIO
                             </button>
                        </div>
                    </div>
                </div>
                `;
            }

            // Slide 2: AI / Stats Teaser (Interactive)
            let slide2 = `
                <div class="hero-slide-item ai-teaser" onclick="window.DashboardView.toggleAIChat()">
                    <div class="hero-label" style="color:var(--brand-blue)">TU ASISTENTE IA</div>
                    <div class="hero-title" style="font-size:1.4rem;">"Analizando tu nivel..."</div>
                    <div style="margin-top:10px; font-size:0.9rem; color:#aaa;">Descubre cómo mejorar tu 3.5 🔥</div>
                </div>
            `;

            // WRAPPER SCROLL
            return `
                <div class="hero-carousel-wrapper" style="display: flex; overflow-x: auto; scroll-snap-type: x mandatory; gap: 16px; padding-bottom: 20px;">
                    <style>
                        .hero-slide-item {
                            min-width: 90%;
                            scroll-snap-align: center;
                            border-radius: 24px;
                            padding: 24px;
                            position: relative;
                            overflow: hidden;
                            display: flex;
                            flex-direction: column;
                            justify-content: center;
                            border: 1px solid rgba(255,255,255,0.1);
                        }
                        .hero-slide-item.live-pulse { background: linear-gradient(135deg, #111, #300);}
                        .hero-slide-item.upcoming-gradient { background: linear-gradient(135deg, #0f172a, #1e293b); }
                        .hero-slide-item.empty-state { background: linear-gradient(135deg, #111, #000); }
                        .hero-slide-item.ai-teaser { background: linear-gradient(135deg, #000, #112); border: 1px solid var(--brand-blue); }
                    </style>
                    ${slide1}
                    ${slide2}
                </div>
            `;
        }

        renderLiveWidget(context) {
            // Helper to generate live cards. In a real app, Map functionality would go here.
            // For now, we return static + context if available.

            let html = '';

            // If context matches, show User's match first
            if (context.status === 'LIVE_MATCH') {
                html += `
                <div class="live-match-card active-user" onclick="Router.navigate('americanas')">
                        <div class="live-court-badge">PISTA ${context.court}</div>
                        <div style="color:#888; font-size:0.7rem; font-weight:700; margin-bottom: 4px;">TU PARTIDO</div>
                        <div class="live-score-row">
                            <div class="live-team" style="color:var(--brand-neon);">Tú / Comp</div>
                            <div class="live-score-box">VS</div>
                            <div class="live-team" style="text-align:right;">${context.opponents}</div>
                        </div>
                    </div>
                `;
            }

            // Other matches (Simulation of "Real Time" Scoreboard)
            html += `
                <div class="live-match-card">
                    <div class="live-court-badge">PISTA 1</div>
                    <div style="color:#888; font-size:0.7rem; font-weight:700; margin-bottom: 4px;">CATEGORÍA A</div>
                    <div class="live-score-row">
                        <div class="live-team">Bela / Coel</div>
                        <div class="live-score-box state-live">6 - 6</div>
                        <div class="live-team" style="text-align:right;">Galán / Lebrón</div>
                    </div>
                </div>
                <div class="live-match-card">
                    <div class="live-court-badge">PISTA 2</div>
                    <div style="color:#888; font-size:0.7rem; font-weight:700; margin-bottom: 4px;">MIXTO</div>
                    <div class="live-score-row">
                        <div class="live-team">Ana / Pablo</div>
                        <div class="live-score-box state-live">4 - 5</div>
                        <div class="live-team" style="text-align:right;">Luisa / Xavi</div>
                    </div>
                </div>
                 <div class="live-match-card">
                    <div class="live-court-badge">PISTA 3</div>
                    <div style="color:#888; font-size:0.7rem; font-weight:700; margin-bottom: 4px;">FEMENINO</div>
                    <div class="live-score-row">
                        <div class="live-team">Marta / Bea</div>
                        <div class="live-score-box state-live">2 - 0</div>
                        <div class="live-team" style="text-align:right;">Ari / Paula</div>
                    </div>
                </div>
            `;

            return html;
        }

        renderTickerItems(context) {
            return `
                <div class="ticker-item"><span class="ticker-badge">ÚLTIMA HORA</span> Inauguramos nuevas pistas Panorámicas este fin de semana 🎉</div>
                <div class="ticker-item"><span class="ticker-badge">TORNEO</span> Quedan 2 plazas para la Americana de Mañana 19:00h</div>
                <div class="ticker-item"><span class="ticker-badge">CLINIC</span> Clase maestra con Pablo Lima - Apúntate en Recepción</div>
            `;
        }

        /**
         * Intelligence Layer: Determine Player Context
         */
        /**
         * Intelligence Layer: Determine Player Context
         */
        async buildContext(user) {
            const context = {
                status: 'EMPTY', // 'LIVE_MATCH' | 'UPCOMING_EVENT' | 'OPEN_REGISTRATION' | 'FINISHED' | 'EMPTY'
                eventName: null,
                eventDate: null,
                eventTime: null,
                court: null,
                opponents: null,
                eventDateRaw: null // For parsing
            };

            // if (!user) return context; // Allow guest view of open events

            try {
                if (window.AmericanaService) {
                    const activeButtons = await window.AmericanaService.getActiveAmericanas();

                    if (!activeButtons || activeButtons.length === 0) return context;

                    // 1. Check if User is Registered in any
                    const myEvent = user ? activeButtons.find(a =>
                        (a.players && a.players.includes(user.uid)) ||
                        (a.registeredPlayers && a.registeredPlayers.includes(user.uid))
                    ) : null;

                    if (myEvent) {
                        // USER IS REGISTERED
                        const today = new Date().toISOString().split('T')[0];
                        const isToday = myEvent.date === today;
                        const isLiveStatus = myEvent.status === 'live';

                        if (isLiveStatus) {
                            context.status = 'LIVE_MATCH';
                            context.eventName = myEvent.name;
                            context.matchTime = myEvent.time;
                            context.court = Math.floor(Math.random() * 4) + 1;
                            context.opponents = "Pareja Rival";
                        } else if (myEvent.status === 'finished') {
                            context.status = 'FINISHED';
                            context.eventName = myEvent.name;
                            context.eventDateRaw = myEvent.date;
                            context.eventDate = this.formatDate(myEvent.date);
                            context.eventTime = myEvent.time;
                        } else {
                            // Upcoming
                            context.status = 'UPCOMING_EVENT';
                            context.eventName = myEvent.name;
                            context.eventDateRaw = myEvent.date;
                            context.eventDate = this.formatDate(myEvent.date);
                            context.eventTime = myEvent.time || '10:00';
                        }
                    } else {
                        // USER NOT REGISTERED - FIND NEXT OPEN EVENT
                        // Filter for upcoming or live
                        const openEvent = activeButtons.find(a => a.status === 'upcoming' || a.status === 'live');
                        const finishedEvent = activeButtons.find(a => a.status === 'finished');

                        if (openEvent) {
                            context.status = 'OPEN_REGISTRATION';
                            context.eventName = openEvent.name;
                            context.eventDateRaw = openEvent.date;
                            context.eventDate = this.formatDate(openEvent.date);
                            context.eventTime = openEvent.time || '10:00';
                        } else if (finishedEvent) {
                            context.status = 'FINISHED';
                            context.eventName = finishedEvent.name;
                            context.eventDateRaw = finishedEvent.date;
                            context.eventDate = this.formatDate(finishedEvent.date);
                            context.eventTime = finishedEvent.time;
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
            return `${days[date.getDay()]} ${date.getDate()} `;
        }
    }

    window.DashboardView = new DashboardView();
    console.log("🚀 Context-First Dashboard Loaded");

    // --- AI "NEO" LOGIC ---
    window.DashboardView.toggleAIChat = function () {
        const bubble = document.getElementById('ai-bubble');
        if (!bubble) return;

        // Force show interesting message
        const messages = [
            "¿Te ayudo a buscar rival?",
            "¡Esa derecha hay que mejorarla!",
            "El torneo empieza en 2h 🕒",
            "¿Has visto tu ranking hoy? 🔥",
            "Soy 100% IA, pregúntame algo."
        ];
        const randomMsg = messages[Math.floor(Math.random() * messages.length)];
        bubble.innerText = "🤖 " + randomMsg;
        bubble.classList.add('show');

        // Hide after 4 seconds
        setTimeout(() => bubble.classList.remove('show'), 4000);
    };

    // Auto-Think Loop (Aliveness)
    setInterval(() => {
        if (Math.random() > 0.7) { // 30% chance every loop
            window.DashboardView.toggleAIChat();
        }
    }, 10000); // Check every 10 seconds

})();
