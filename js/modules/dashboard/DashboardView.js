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
            const userName = user ? (user.name || "Alejandro (Dev)") : "Alejandro (Dev)";
            const userInitials = userName.substring(0, 2).toUpperCase();

            // Simulation of Level (In real app, fetch from Store)
            const userLevel = user ? (user.level || "3.5") : "3.5";

            // 2. Build Context (The Brains) - ACTIVATED
            const context = await this.buildContext(user);

            // 3. Render "Community Black/Neon" UI
            container.innerHTML = `
                <!-- TOP TICKER (Running Text) - INTERACTIVE -->
                <div class="ticker-container" onclick="Router.navigate('americanas')" style="cursor: pointer;">
                    <div class="ticker-track" id="ticker-track">
                        <div class="ticker-item"><span>🔴 EN JUEGO:</span> Pista 1 (Tie-Break)</div>
                        <div class="ticker-item"><span>🏆 TORNEO:</span> Final "Rey de la Pista" 20:00h</div>
                        <div class="ticker-item"><span>🚀 RANKING:</span> ¡Alejandro ha subido a 4.2!</div>
                        <div class="ticker-item"><span>🔥 CLUB:</span> 120 Jugadores en pista ahora</div>
                    </div>
                </div>

                <!-- 1. The Command Bar -->
                <div class="cmd-bar" style="top: 40px;"> <!-- Push down to match new ticker height -->
                    
                    <!-- LEFT HAMBURGER TRIGGER -->
                    <div class="header-burger-btn" onclick="document.getElementById('side-drawer-container').classList.add('open'); document.getElementById('side-drawer-menu').classList.add('open');">
                        <i class="fas fa-bars"></i>
                    </div>

                    <div class="cmd-brand">
                        <img src="img/logo_somospadel.png" alt="Somos Padel" class="brand-logo-img">
                        <div style="line-height:1; display:flex; flex-direction:column; justify-content:center;">
                            <span style="font-size:1.1rem; letter-spacing:-0.5px;">SOMOS<span style="color:var(--brand-neon)">PADEL</span></span>
                            <span style="font-size:0.6rem; color:#888; letter-spacing:2px; font-weight:600;">AMERICANAS</span>
                        </div>
                    </div>
                    
                    <div class="cmd-avatar-container" onclick="Router.navigate('profile')">
                         <div style="text-align:right; display:flex; flex-direction:column;">
                            <span style="font-size:0.6rem; color:#bbb; font-weight:700;">HOLA,</span>
                            <span style="font-size:0.9rem; font-weight:700; color:white;">${userName.split(' ')[0]}</span>
                        </div>
                        <div class="cmd-avatar">
                            ${userInitials}
                        </div>
                    </div>
                </div>

                <!-- SIDE NAVIGATION DRAWER -->
                <div id="side-drawer-container" class="side-drawer-overlay" onclick="this.classList.remove('open'); document.getElementById('side-drawer-menu').classList.remove('open');"></div>
                
                <div id="side-drawer-menu" class="side-drawer">
                    <div class="drawer-header">
                        <div style="font-weight:800; color:white; font-size:1.2rem;">MENÚ</div>
                        <i class="fas fa-times" style="color:white; font-size:1.4rem;" onclick="document.getElementById('side-drawer-container').classList.remove('open'); document.getElementById('side-drawer-menu').classList.remove('open');"></i>
                    </div>
                    
                    <!-- 1. Mi Perfil -->
                    <div class="drawer-item" onclick="Router.navigate('profile')">
                        <i class="far fa-user"></i> <span>Mi Perfil</span>
                    </div>

                    <!-- 2. Mis Americanas -->
                    <div class="drawer-item" onclick="Router.navigate('americanas')">
                        <i class="fas fa-table-tennis"></i> <span>Mis Americanas</span>
                    </div>

                    <!-- 3. Mis Estadísticas -->
                    <div class="drawer-item" onclick="Router.navigate('stats')"> <!-- Assumed 'stats' route based on previous logs -->
                        <i class="fas fa-chart-line"></i> <span>Mis Estadísticas</span>
                    </div>

                    <!-- 4. Agenda -->
                    <div class="drawer-item" onclick="Router.navigate('agenda')">
                        <i class="far fa-calendar-alt"></i> <span>Agenda</span>
                    </div>

                    <!-- 5. Ranking -->
                    <div class="drawer-item" onclick="Router.navigate('ranking')">
                        <i class="fas fa-medal"></i> <span>Ranking</span>
                    </div>

                    <!-- Back to Home (Optional, kept at bottom for utility if needed, or hidden?) 
                         User asked SPECIFICALLY for the above list. I will stick to the list strictly. -->
                </div>

                <!-- AI ASSISTANT REMOVED BY USER REQUEST -->


                <!-- MAIN DASHBOARD CONTAINER (Mobile Centered) -->
                <div class="dashboard-v2-container fade-in" style="padding-top: 120px; max-width: 480px; margin: 0 auto; width: 100%; box-sizing: border-box;">
                    
                    <!-- 1. LIVE MATCH WIDGET (If active) -->
                    <div class="live-widget-container" style="margin: 0 20px 24px 20px; display:block;"> <!-- VISIBLE NOW -->
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
                    
                    <!-- 2. SMART HERO CARD (Context Dependent) -->
                    <div style="margin: 0 20px 24px 20px;"> <!-- Standard Margin & Gap -->
                        ${this.renderSmartHero(context, userLevel)}
                    </div>

                    <!-- 3. PRO CONTENT SECTION (Replaces Grid) -->
                    <div class="pro-content-section" style="padding-bottom: 120px;">
                        
                        <!-- A. EVENTS FEED (Agenda) -->
                        <div class="section-header" style="padding: 0 20px; margin-bottom: 16px; display:flex; justify-content:space-between; align-items:center;">
                            <h3 style="color:var(--text-primary); font-size:1.1rem; font-weight:800; letter-spacing:-0.5px; margin:0;">PRÓXIMAS <span style="color:var(--brand-neon)">AMERICANAS</span></h3>
                            <span style="color:#666; font-size:0.8rem; font-weight:600; cursor:pointer;" onclick="Router.navigate('agenda')">Ver todo</span>
                        </div>

                        <!-- Horizontal Scroller for Events -->
                        <div class="events-scroller" style="display: flex; overflow-x: auto; padding: 0 20px 20px 20px; gap: 15px; scroll-snap-type: x mandatory;">
                            
                            <!-- Card 1 -->
                            <div class="event-card-pro" onclick="Router.navigate('americanas')" style="min-width: 280px; background: #1a1a1a; border-radius: 16px; overflow: hidden; scroll-snap-align: center; border: 1px solid #333; position:relative;">
                                <div style="height: 100px; background: url('img/default-americana.jpg') center/cover; position:relative;">
                                    <div style="position:absolute; top:10px; right:10px; background:rgba(0,0,0,0.7); color:white; padding:4px 8px; border-radius:6px; font-weight:700; font-size:0.7rem;">
                                        MAÑANA
                                    </div>
                                </div>
                                <div style="padding: 15px;">
                                    <div style="color:var(--brand-neon); font-size:0.7rem; font-weight:800; letter-spacing:1px; margin-bottom:5px;">NIVEL 3.5 - 4.0</div>
                                    <div style="color:white; font-size:1rem; font-weight:700; margin-bottom:10px; line-height:1.2;">Americana Nocturna</div>
                                    <div style="display:flex; justify-content:space-between; align-items:center; color:#999; font-size:0.8rem;">
                                        <span><i class="far fa-clock"></i> 20:00 - 22:00</span>
                                        <span style="color:white; background:var(--brand-navy); padding:4px 8px; border-radius:4px;">8€</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Card 2 -->
                            <div class="event-card-pro" onclick="Router.navigate('americanas')" style="min-width: 280px; background: #1a1a1a; border-radius: 16px; overflow: hidden; scroll-snap-align: center; border: 1px solid #333;">
                                <div style="height: 100px; background: linear-gradient(45deg, #111, #222); display:flex; align-items:center; justify-content:center;">
                                    <i class="fas fa-bolt" style="color:#333; font-size:3rem;"></i>
                                </div>
                                <div style="padding: 15px;">
                                    <div style="color:var(--brand-blue); font-size:0.7rem; font-weight:800; letter-spacing:1px; margin-bottom:5px;">NIVEL 4.0+</div>
                                    <div style="color:white; font-size:1rem; font-weight:700; margin-bottom:10px; line-height:1.2;">King of Court</div>
                                    <div style="display:flex; justify-content:space-between; align-items:center; color:#999; font-size:0.8rem;">
                                        <span><i class="far fa-calendar"></i> Sábado</span>
                                        <span style="color:white; background:var(--brand-navy); padding:4px 8px; border-radius:4px;">12€</span>
                                    </div>
                                </div>
                            </div>

                        </div>

                        <!-- B. TOP PLAYERS WIDGET -->
                         <div class="section-header" style="padding: 0 20px; margin-bottom: 16px; margin-top: 32px; display:flex; justify-content:space-between; align-items:center;">
                            <h3 style="color:var(--text-primary); font-size:1.1rem; font-weight:800; letter-spacing:-0.5px; margin:0;">TOP <span style="color:var(--brand-gold)">RANKING</span></h3>
                            <span style="color:#666; font-size:0.8rem; font-weight:600; cursor:pointer;" onclick="Router.navigate('ranking')">Ver tabla</span>
                        </div>

                        <div class="ranking-preview" style="margin: 0 20px; background: #fff; border-radius: 16px; padding: 15px; border: 1px solid rgba(0,0,0,0.05); box-shadow: var(--shadow-card);">
                            <div style="display:flex; align-items:center; margin-bottom:12px; border-bottom:1px solid var(--border-subtle); padding-bottom:12px;">
                                <div style="width:24px; font-weight:800; color:var(--brand-gold);">1</div>
                                <div style="width:36px; height:36px; background:#333; border-radius:50%; margin-right:12px; display:flex; align-items:center; justify-content:center; font-weight:700; color:white;">A</div>
                                <div style="flex:1; color:var(--text-primary); font-weight:600;">Alex Coscolin</div>
                                <div style="font-weight:700; color:var(--brand-neon);">4.56</div>
                            </div>
                            <div style="display:flex; align-items:center; margin-bottom:12px; border-bottom:1px solid var(--border-subtle); padding-bottom:12px;">
                                <div style="width:24px; font-weight:800; color:#silver;">2</div>
                                <div style="width:36px; height:36px; background:#333; border-radius:50%; margin-right:12px; display:flex; align-items:center; justify-content:center; font-weight:700; color:white;">M</div>
                                <div style="flex:1; color:var(--text-primary); font-weight:600;">Marc Padel</div>
                                <div style="font-weight:700; color:var(--text-primary);">4.42</div>
                            </div>
                             <div style="display:flex; align-items:center;">
                                <div style="width:24px; font-weight:800; color:#cd7f32;">3</div>
                                <div style="width:36px; height:36px; background:#333; border-radius:50%; margin-right:12px; display:flex; align-items:center; justify-content:center; font-weight:700; color:white;">L</div>
                                <div style="flex:1; color:var(--text-primary); font-weight:600;">Lucía Sainz</div>
                                <div style="font-weight:700; color:var(--text-primary);">4.38</div>
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
        renderSmartHero(context, userLevel) {

            // SCENARIO A: PLAYER IS LIVE! (Show Match Controls)
            if (context.status === 'LIVE_MATCH') {
                return `
                    <div class="hero-v2 live" onclick="Router.navigate('americanas')">
                        <div class="pulse-ring"></div>
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <div class="hero-label">🔴 TU PARTIDO EN JUEGO</div>
                            <div style="background:rgba(255,255,255,0.2); padding:4px 8px; border-radius:6px; font-size:0.7rem; font-weight:800;">LIVE</div>
                        </div>
                        
                        <div class="hero-title">PISTA ${context.court}</div>
                        <div class="hero-subtitle">vs ${context.opponents}</div>
                        
                        <button class="btn-3d navy" style="margin-top:0;">
                            INTRODUCIR RESULTADO
                        </button>
                    </div>
                `;
            }

            // SCENARIO B: PLAYER HAS UPCOMING GAME
            if (context.status === 'UPCOMING_EVENT') {
                return `
                    <div class="hero-v2 upcoming" onclick="Router.navigate('americanas')">
                        <div class="hero-label" style="color:var(--brand-gold)">PRÓXIMA AMERICANA</div>
                        <div class="hero-title" style="font-size: 2.2rem; margin-bottom:8px;">${context.eventName}</div>
                        
                        <div style="display:flex; gap:16px; margin-bottom: 20px;">
                            <div style="display:flex; align-items:center; gap:6px;">
                                <i class="far fa-calendar-alt" style="color:var(--brand-gold)"></i>
                                <span style="font-weight:600">${context.eventDate}</span>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px;">
                                <i class="far fa-clock" style="color:var(--brand-gold)"></i>
                                <span style="font-weight:600">${context.eventTime}</span>
                            </div>
                        </div>

                        <div style="background:rgba(255,255,255,0.1); padding:12px; border-radius:12px; font-size:0.85rem; line-height:1.4;">
                            Recuerda llegar 15 min antes para el calentamiento. No olvides tu agua.
                        </div>
                    </div>
                `;
            }

            // SCENARIO C: PASSIVE STATE (Show Level & Stats - The "Community" Default)
            // SCENARIO C: PASSIVE STATE (Default)
            // User requested to REMOVE the Stats/Level card from here.
            // Replacing with a generic "Pulse" card to invite action.
            return `
                <div class="hero-v2 upcoming" onclick="Router.navigate('americanas')" style="background: linear-gradient(135deg, #111 0%, #0a0a0a 100%); border: 1px solid rgba(255,255,255,0.1);">
                    <div class="hero-label" style="color:var(--brand-neon)">RESERVA TU PLAZA</div>
                    <div class="hero-title" style="font-size: 1.8rem; margin-bottom:8px; line-height:1.1;">
                        ¿PARTIDO <br>O TORNEO?
                    </div>
                    
                    <button class="btn-3d neon" style="margin-top:10px; width:100%;">
                        JUGAR
                    </button>
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

            // Other matches (Simulation)
            html += `
                <div class="live-match-card">
                    <div class="live-court-badge">PISTA 1</div>
                    <div style="color:#888; font-size:0.7rem; font-weight:700; margin-bottom: 4px;">CATEGORÍA A</div>
                    <div class="live-score-row">
                        <div class="live-team">Bela / Coel</div>
                        <div class="live-score-box">6 - 6</div>
                        <div class="live-team" style="text-align:right;">Galán / Lebrón</div>
                    </div>
                </div>
                 <div class="live-match-card">
                    <div class="live-court-badge">PISTA 2</div>
                    <div style="color:#888; font-size:0.7rem; font-weight:700; margin-bottom: 4px;">MIXTO</div>
                    <div class="live-score-row">
                        <div class="live-team">Ana / Pablo</div>
                        <div class="live-score-box">4 - 5</div>
                        <div class="live-team" style="text-align:right;">Luisa / Xavi</div>
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
        async buildContext(user) {
            const context = {
                status: 'EMPTY', // 'LIVE_MATCH' | 'UPCOMING_EVENT' | 'EMPTY'
                eventName: null,
                eventDate: null,
                eventTime: null,
                court: null,
                opponents: null
            };

            if (!user) return context;

            try {
                if (window.AmericanaService) {
                    const activeButtons = await window.AmericanaService.getActiveAmericanas();

                    // 1. Find ANY active registration
                    const myEvent = activeButtons.find(a =>
                        (a.players && a.players.includes(user.uid)) ||
                        (a.registeredPlayers && a.registeredPlayers.includes(user.uid))
                    );

                    if (myEvent) {
                        // Check if it's LIVE (Today + Inside Time Window or Status Live)
                        const today = new Date().toISOString().split('T')[0];
                        const isToday = myEvent.date === today;
                        const isLiveStatus = myEvent.status === 'live';

                        if (isLiveStatus || isToday) {
                            context.status = 'LIVE_MATCH';
                            context.eventName = myEvent.name;
                            context.matchTime = myEvent.time;
                            context.court = Math.floor(Math.random() * 4) + 1; // Simulation
                            context.opponents = "Pareja Rival";
                        } else {
                            // It's upcoming
                            context.status = 'UPCOMING_EVENT';
                            context.eventName = myEvent.name;
                            context.eventDate = this.formatDate(myEvent.date);
                            context.eventTime = myEvent.time || '10:00';
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
