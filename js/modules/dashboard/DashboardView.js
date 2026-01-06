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
                <!-- 0. Dynamic Ticker (News) -->
                <div class="ticker-wrap">
                    <div class="ticker-content">
                        ${this.renderTickerItems(context)}
                    </div>
                </div>

                <!-- 1. The Command Bar -->
                <div class="cmd-bar">
                    
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
                    <div class="drawer-item" onclick="Router.navigate('dashboard')">
                        <i class="fas fa-home"></i> <span>Inicio</span>
                    </div>
                    <div class="drawer-item" onclick="Router.navigate('americanas')">
                        <i class="fas fa-trophy"></i> <span>Americanas</span>
                    </div>
                    <div class="drawer-item" onclick="Router.navigate('agenda')">
                        <i class="far fa-calendar-alt"></i> <span>Agenda</span>
                    </div>
                    <div class="drawer-item" onclick="Router.navigate('profile')">
                        <i class="far fa-user"></i> <span>Mi Perfil</span>
                    </div>
                     <div class="drawer-item" onclick="Router.navigate('ranking')">
                        <i class="fas fa-medal"></i> <span>Ranking</span>
                    </div>
                </div>

                <!-- AI ASSISTANT "BRAIN-BALL" (Mascot) -->
                <div class="ai-assistant-container" onclick="window.DashboardView.toggleAIChat()">
                    <div class="ai-racket-img">
                        <img src="img/brain_ball_mascot_3d.png" alt="AI Brain Ball">
                        <!-- Orbiting ball removed as the mascot IS a ball -->
                    </div>
                    <div class="ai-thought-bubble" id="ai-bubble">
                        🧠 Calculando estrategia...
                    </div>
                </div>

                <div class="dashboard-v2-container fade-in" style="padding-top: 16px;">

                    <!-- NEW: LIVE AMERICANAS WIDGET (Global Activity) -->
                    <div class="live-matches-container">
                        <div class="live-header">
                            <div style="font-weight:800; font-size:1rem; color:var(--brand-navy);">EN JUEGO AHORA</div>
                            <div class="live-indicator-tag">
                                <div class="pulsing-dot"></div>
                                <span>LIVE</span>
                            </div>
                        </div>
                        
                        <div class="live-scroller">
                            ${this.renderLiveWidget(context)}
                        </div>
                    </div>
                    
                    <!-- 2. SMART HERO CARD (Context Dependent) -->
                    ${this.renderSmartHero(context, userLevel)}

                    <!-- 3. ACTION GRID (2 Columns) -->
                    <div class="action-grid-v2" style="padding-bottom: 100px;">
                        
                        <!-- Col 1: Profile -->
                        <div class="action-card" onclick="Router.navigate('profile')">
                            <div class="action-icon-circle">
                                <i class="far fa-user"></i>
                            </div>
                            <div class="action-label">Mi Perfil</div>
                        </div>

                        <!-- Col 2: PLAY (Highlighted) -->
                        <div class="action-card highlight" onclick="Router.navigate('americanas')">
                            <div class="action-icon-circle">
                                <i class="fas fa-plus"></i>
                            </div>
                            <div class="action-label">JUGAR TORNEO</div>
                            <div class="action-sub">Inscripciones Abiertas</div>
                        </div>

                        <!-- Row 2 -->
                        <div class="action-card" onclick="Router.navigate('americanas')">
                            <div class="action-icon-circle">
                                <i class="fas fa-clipboard-list"></i>
                            </div>
                            <div class="action-label">Resultados</div>
                        </div>

                        <div class="action-card" onclick="Router.navigate('ranking')">
                            <div class="action-icon-circle">
                                <i class="fas fa-medal"></i>
                            </div>
                            <div class="action-label">Ranking</div>
                        </div>

                        <!-- Row 3 -->
                        <div class="action-card" onclick="Router.navigate('profile')">
                            <div class="action-icon-circle">
                                <i class="fas fa-chart-bar"></i>
                            </div>
                            <div class="action-label">Estadísticas</div>
                        </div>

                        <div class="action-card" onclick="Router.navigate('agenda')">
                            <div class="action-icon-circle">
                                <i class="far fa-calendar-alt"></i>
                            </div>
                            <div class="action-label">Agenda</div>
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
            return `
                <div class="hero-v2 community-stats">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <div>
                            <div style="color:#888; font-size:0.8rem; font-weight:700; letter-spacing:1px; margin-bottom: 4px;">TU NIVEL</div>
                            <div style="font-family:var(--font-heading); font-size:4rem; line-height:0.9; font-weight:800; letter-spacing:-2px;">
                                ${userLevel}
                            </div>
                        </div>
                        <div class="level-circle-container">
                            <div class="level-number">${userLevel}</div>
                        </div>
                    </div>

                    <div class="stats-row">
                        <div class="stat-item">
                            <div class="stat-label">PARTIDOS</div>
                            <div class="stat-val">12</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">VICTORIAS</div>
                            <div class="stat-val neon">8</div>
                        </div>
                            <div class="stat-item">
                            <div class="stat-label">EFECTIVIDAD</div>
                            <div class="stat-val">66%</div>
                        </div>
                    </div>
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
