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
                    padding-top: 4px !important; /* Reducido de 10px */
                ">

                    <!-- HEADER WITH NFL STYLE TICKER -->
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 20px; gap: 12px;">
                        <!-- NFL TICKER CONTAINER -->
                        <div id="header-ticker-container" style="
                            flex: 1; 
                            overflow: hidden; 
                            background: #0f172a; 
                            border: 1px solid #334155;
                            border-left: 3px solid #84cc16; /* NFL/Sports Accent */
                            border-radius: 4px;
                            height: 34px; /* SMALLER HEIGHT */
                            display: flex;
                            align-items: center;
                            position: relative;
                            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                        ">
                             <!-- Ticker Content -->
                             <div id="header-ticker-text" style="
                                display: flex; 
                                align-items: center; 
                                width: 100%;
                                padding: 0 10px;
                                white-space: nowrap;
                                overflow: hidden;
                             ">
                                <span style="font-size:0.7rem; color: #64748b; font-weight: 700; letter-spacing: 0.5px;">ESPERANDO LIVE...</span>
                            </div>
                        </div>
                        
                        <!-- CAPTAIN ROBOT ICON -->
                        <div style="position: relative; cursor: pointer; flex-shrink: 0;" onclick="window.CaptainView.open()">
                            <div style="
                                filter: drop-shadow(0 0 8px rgba(204, 255, 0, 0.4));
                                transition: transform 0.2s;
                                display: flex; align-items: center; justify-content: center;
                                width: 34px; height: 34px;
                                background: #222;
                                border-radius: 50%;
                                border: 1px solid #CCFF00;
                            "
                            onmouseover="this.style.transform='scale(1.1)'; this.style.boxShadow='0 0 15px rgba(204,255,0,0.6)';" 
                            onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none';">
                                <i class="fas fa-robot" style="font-size: 1rem; color: #fff;"></i>
                            </div>
                        </div>

                        <!-- WOW BELL -->
                        <div style="position: relative; cursor: pointer; flex-shrink: 0;" onclick="window.NotificationUi.toggle()">
                            <div style="
                                background: linear-gradient(135deg, #facc15 0%, #ca8a04 100%);
                                -webkit-background-clip: text;
                                -webkit-text-fill-color: transparent;
                                filter: drop-shadow(0 0 5px rgba(250, 204, 21, 0.4));
                                transition: transform 0.2s;
                            ">
                                <i id="notif-bell-icon" class="fas fa-bell" style="font-size: 1.5rem;"></i>
                            </div>
                            
                            <div id="notif-badge" style="
                                position: absolute; top: -3px; right: -3px; 
                                background: #ef4444; color: white; border: 2px solid #0f172a;
                                font-size: 0.55rem; font-weight: 900; min-width: 16px; height: 16px;
                                border-radius: 50%; display: none; align-items: center; justify-content: center;
                                padding: 1px; box-shadow: 0 2px 4px rgba(0,0,0,0.5);
                            ">0</div>
                        </div>
                    </div>

                    <style>
                        @keyframes skeletonShine {
                            0% { transform: translateX(-100%); }
                            100% { transform: translateX(100%); }
                        }
                        @keyframes shakeBell {
                            0% { transform: rotate(0deg); }
                            10% { transform: rotate(15deg); }
                            20% { transform: rotate(-15deg); }
                            30% { transform: rotate(10deg); }
                            50% { transform: rotate(0deg); }
                            100% { transform: rotate(0deg); }
                        }
                        .shake-animation {
                            animation: shakeBell 2s infinite cubic-bezier(.36,.07,.19,.97) both;
                            color: #84cc16 !important;
                        }
                    </style>

                    <!-- 1. LIVE REGISTRATION WIDGET (FULL WIDTH SCROLLER) -->
                    <div id="registration-widget-root" style="
                        background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%);
                        border-radius: 28px;
                        margin: 4px 8px 1px !important; 
                        padding: 8px 4px 0px !important; 
                        box-shadow: 0 10px 30px rgba(0,0,0,0.04);
                        z-index: 10;
                        animation: floatUp 0.8s ease-out forwards;
                    ">
                        <div class="live-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px !important; padding: 0 14px;">
                            <div style="
                                background: #00E36D; 
                                color: #000; 
                                padding: 5px 14px; 
                                border-radius: 10px; 
                                font-size: 0.7rem; 
                                font-weight: 950; 
                                letter-spacing: 1px;
                                box-shadow: 0 4px 10px rgba(0,227,109,0.3);
                                text-transform: uppercase;
                            ">
                                NOTICIAS
                            </div>
                        </div>
                        
                        <div id="live-scroller-content" class="live-scroller" style="overflow-x: auto; display: flex; padding: 5px 8px 10px; gap: 8px !important; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch;">
                            <!-- SKELETON PLACEHOLDERS TO START "FULL" -->
                            ${Array(4).fill(0).map(() => `
                                <div style="min-width: 265px; height: 140px; background: rgba(0,0,0,0.03); border-radius: 18px; border: 1px solid rgba(0,0,0,0.05); overflow: hidden; position: relative; flex-shrink: 0; scroll-snap-align: center;">
                                    <div style="position: absolute; inset: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent); transform: translateX(-100%); animation: skeletonShine 1.5s infinite;"></div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- 2. SOMOSPADEL.EU CONNECT (PREMIUM ENHANCED BANNER) -->
                    <div id="noticias-banner-root" style="padding: 1px 15px !important; animation: floatUp 0.85s ease-out forwards;">
                        <div class="noticias-banner-premium" style="
                            background: white; 
                            border-radius: 24px; 
                            padding: 16px !important; /* Reducido de 24px */
                            color: #1e293b; 
                            position: relative; 
                            overflow: hidden; 
                            box-shadow: 0 20px 40px rgba(0,0,0,0.06), 0 0 20px rgba(204,255,0,0.1);
                            border: 1px solid #e2e8f0;
                            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                        ">
                            <!-- Premium Background Detail -->
                            <div style="position: absolute; right: -20px; top: -20px; font-size: 7rem; color: #CCFF00; opacity: 0.1; transform: rotate(-15deg); filter: blur(1px);">
                                <i class="fas fa-satellite-dish"></i>
                            </div>
                            
                            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px; position: relative; z-index: 2;">
                                <div style="
                                    background: #00E36D; 
                                    color: #000; 
                                    padding: 5px 15px; 
                                    border-radius: 12px; 
                                    font-size: 0.8rem; 
                                    font-weight: 950; 
                                    letter-spacing: 1px;
                                    box-shadow: 0 0 15px rgba(0,227,109,0.4);
                                    text-transform: uppercase;
                                ">NUEVO</div>
                            </div>
                            
                            <p style="font-size: 0.85rem; color: #475569; line-height: 1.5; margin: 0 0 22px 0; font-weight: 600;">
                                Ya puedes seguir los eventos en vivo en las <b style="color:#0f172a;">TV de SomosPadel BCN</b> y usar el nuevo <b style="color:#0ea5e9;">Chat Táctico</b> con botón SOS. ¡Toda la comunidad lo podrá ver!
                            </p>
                            
                            <div style="display: flex; gap: 10px; align-items: stretch; position: relative; z-index: 2;">
                                <div style="flex: 1; display:flex; gap:8px;">
                                     <div style="flex: 1; background: #1e293b; border: 1px solid #334155; padding: 12px; border-radius: 14px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; transition: all 0.3s; box-shadow: inset 0 0 10px rgba(204,255,0,0.1);" onmouseover="this.style.transform='translateY(-3px)'; this.style.borderColor='#CCFF00'; this.style.background='#000';" onmouseout="this.style.transform='translateY(0)'; this.style.borderColor='#334155'; this.style.background='#1e293b';">
                                        <i class="fas fa-tv" style="color: #CCFF00; font-size: 1.3rem; filter: drop-shadow(0 0 10px rgba(204,255,0,0.8));"></i>
                                        <span style="font-size: 0.55rem; font-weight: 950; color: white;">TV LIVE</span>
                                    </div>
                                    <div style="flex: 1; background: #1e293b; border: 1px solid #334155; padding: 12px; border-radius: 14px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; transition: all 0.3s; box-shadow: inset 0 0 10px rgba(14,165,233,0.1);" onmouseover="this.style.transform='translateY(-3px)'; this.style.borderColor='#0ea5e9'; this.style.background='#000';" onmouseout="this.style.transform='translateY(0)'; this.style.borderColor='#334155'; this.style.background='#1e293b';">
                                        <i class="fas fa-comment-dots" style="color: #0ea5e9; font-size: 1.3rem; filter: drop-shadow(0 0 10px rgba(14,165,233,0.8));"></i>
                                        <span style="font-size: 0.55rem; font-weight: 950; color: white;">CHAT SOS</span>
                                    </div>
                                </div>
                                <!-- CAPTAIN & INFO BUTTONS -->
                                <div style="display: flex; gap: 10px;">
                                    <div onclick="window.CaptainView.open()" 
                                         style="background: black; color: white; border-radius: 14px; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 950; font-size: 0.8rem; cursor: pointer; padding: 0 16px; border: 2px solid #CCFF00; box-shadow: 0 5px 15px rgba(204,255,0,0.3); transition: all 0.3s;" 
                                         onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 0 20px rgba(204,255,0,0.6)';" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 5px 15px rgba(204,255,0,0.3)';">
                                        <i class="fas fa-robot" style="color: #CCFF00; font-size: 0.9rem;"></i>
                                        <span>CAPITÁN VIRTUAL</span>
                                    </div>

                                    <div onclick="window.DashboardView.showChatInfo()" 
                                         style="background: #0f172a; color: white; border-radius: 14px; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 950; font-size: 0.8rem; cursor: pointer; padding: 0 16px; border: 1px solid rgba(255,255,255,0.2); transition: all 0.3s;" 
                                         onmouseover="this.style.transform='scale(1.05)'; this.style.background='#1e293b';" onmouseout="this.style.transform='scale(1)'; this.style.background='#0f172a';">
                                        <i class="fas fa-info-circle" style="color: white; opacity: 0.7;"></i>
                                        <span>INFO</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>


                    <!-- 3. NEW WEATHER WIDGET -->
                    <div id="weather-widget-root" style="margin: 1px 15px 4px !important; animation: floatUp 0.8s ease-out forwards;">
                        <!-- Content loaded via JS -->
                    </div>

                    <!-- 4. ACTIVIDAD RECIENTE -->
                    <div id="activity-feed-root" style="
                        background: rgba(10, 10, 20, 0.9);
                        backdrop-filter: blur(20px);
                        border: 1px solid rgba(0, 227, 109, 0.2);
                        border-radius: 20px;
                        margin: 1px 15px 4px !important;
                        padding: 12px !important; /* Reducido de 15px */
                        box-shadow: 0 15px 35px rgba(0,0,0,0.5);
                        animation: floatUp 0.85s ease-out forwards;
                    ">
                        <div style="font-weight:950; font-size:0.85rem; color:white; letter-spacing:-0.5px; text-transform: uppercase; display: flex; align-items: center; gap: 8px; margin-bottom: 15px;">
                            <i class="fas fa-rss" style="color: #00E36D; font-size: 1rem;"></i> ACTIVIDAD RECIENTE
                        </div>
                        <div id="activity-feed-content" style="display: flex; flex-direction: column; gap: 10px;">
                            <!-- Content loaded via JS -->
                        </div>
                    </div>




                    <!-- 1.5 ÚLTIMA HORA (AI FEED) -->
                    <div id="ai-activity-root" style="
                        background: rgba(30, 41, 59, 0.95);
                        backdrop-filter: blur(20px);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        border-radius: 28px;
                        margin: 1px 15px 8px !important;
                        padding: 12px !important;
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
                    @keyframes slowTicker {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(-50%); }
                    }
                    .ticker-container {
                        width: 100%;
                        overflow: hidden;
                        position: relative;
                        mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
                        -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
                    }
                    .ticker-content {
                        display: flex;
                        gap: 12px;
                        animation: slowTicker 60s linear infinite;
                        width: max-content;
                        padding: 10px 0;
                    }
                    .ticker-content:hover {
                        animation-play-state: paused;
                    }
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

                if (aiActivity) aiActivity.style.display = 'block';

                // 2. Fetch Real Data for new Widgets (SILENT CALCULATION)
                if (window.RankingController) window.RankingController.calculateSilently().catch(e => console.error("Ranking calc failed", e));

                // 2.1 Fetch Real Weather
                let weatherData = [];
                try {
                    if (window.WeatherService) {
                        weatherData = await window.WeatherService.getDashboardWeather();
                    }
                } catch (e) { console.error("Weather fetch failed", e); }

                // 2.2 Populate Weather Widget
                const weatherRoot = document.getElementById('weather-widget-root');
                if (weatherRoot) {
                    let weatherHtml = `
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            ${this.renderWeatherCard('EL PRAT', '--', '...', { wind: '--', hum: '--', rain: '--' })}
                            ${this.renderWeatherCard('CORNELLÀ', '--', '...', { wind: '--', hum: '--', rain: '--' })}
                        </div>`;

                    if (weatherData && weatherData.length > 0) {
                        weatherHtml = `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">`;
                        weatherData.forEach(w => {
                            weatherHtml += this.renderWeatherCard(
                                w.name,
                                `${w.temp}°C`,
                                w.icon,
                                {
                                    wind: `${w.wind} km/h`,
                                    hum: `${w.humidity}%`,
                                    rain: `${w.rainProb}%`,
                                    uv: w.uv,
                                    pressure: w.pressure,
                                    visibility: w.visibility,
                                    intel: w.intelligence
                                },
                                w.isPropitious
                            );
                        });
                        weatherHtml += `</div>`;
                    }
                    weatherRoot.innerHTML = weatherHtml;
                    weatherRoot.style.display = 'block';
                }

                // 3. Populate Rest of Dashboard
                const proRoot = document.getElementById('pro-content-root');
                if (proRoot) {
                    proRoot.innerHTML = `
                        <div style="padding: 10px 15px 120px;">
                            <!-- MI AGENDA (PLAYER'S EVENTS) -->
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

            // 4. INIT HEADER TICKER SYNC
            this.initHeaderTickerSync();
        }

        initHeaderTickerSync() {
            // 1. Definir la lógica de renderizado del ticker
            const updateTicker = (data) => {
                const tickerContainer = document.getElementById('header-ticker-text');
                if (!tickerContainer) return;

                const items = (data.items && data.items.length > 0) ? data.items.slice(0, 5) : [];
                let innerHTML = '';

                if (items.length > 0) {
                    // Evitar re-render si el ID del primer item no ha cambiado (reducción de parpadeo)
                    if (tickerContainer.dataset.lastNotifId === items[0].id) return;
                    tickerContainer.dataset.lastNotifId = items[0].id;

                    const generateContent = (list) => {
                        return list.map(item => {
                            const badgeLabel = item.isChat ? 'CHAT' : 'LIVE';
                            const badgeBg = item.isChat ? '#0ea5e9' : '#ef4444';
                            const badgeShadow = item.isChat ? 'rgba(14,165,233,0.5)' : 'rgba(239,68,68,0.5)';
                            return `
                                <div style="display: flex; align-items: center; margin-right: 60px; white-space: nowrap;">
                                    <span style="background: ${badgeBg}; color: white; font-size: 0.6rem; font-weight: 950; padding: 2px 6px; border-radius: 4px; margin-right: 10px; flex-shrink: 0; box-shadow: 0 0 15px ${badgeShadow};">${badgeLabel}</span>
                                    <span style="font-weight: 900; color: #fff; font-size: 0.75rem; margin-right: 6px; text-transform: uppercase;">${item.title}</span> 
                                    <span style="color: #cbd5e1; font-weight: 600; font-size: 0.75rem; text-transform: uppercase;">${item.body}</span>
                                </div>
                            `;
                        }).join('');
                    };

                    const scrollingContent = generateContent(items);

                    innerHTML = `
                        <div style="display: flex; align-items: center; animation: marquee 25s linear infinite; padding-left: 10px;">
                            ${scrollingContent}
                            ${scrollingContent} <!-- Duplicamos para loop perfecto -->
                        </div>
                        <style>
                            @keyframes marquee { 
                                0% { transform: translateX(0); } 
                                100% { transform: translateX(-50%); } 
                            }
                        </style>
                    `;
                } else {
                    if (tickerContainer.dataset.lastNotifId === 'empty') return;
                    tickerContainer.dataset.lastNotifId = 'empty';
                    innerHTML = `
                         <div style="display: flex; align-items: center; animation: marquee 15s linear infinite;">
                            <span style="color: #84cc16; font-size: 0.8rem; margin-right: 6px;">📢</span>
                            <span style="color: #94a3b8; font-weight: 700; font-size: 0.65rem; text-transform: uppercase; margin-right: 40px;">Tu historial de avisos aparecerá aquí en tiempo real.</span>
                            <span style="color: #84cc16; font-size: 0.8rem; margin-right: 6px;">📢</span>
                            <span style="color: #94a3b8; font-weight: 700; font-size: 0.65rem; text-transform: uppercase;">Tu historial de avisos aparecerá aquí en tiempo real.</span>
                        </div>
                    `;
                }
                tickerContainer.innerHTML = innerHTML;
            };

            // 2. Lógica de sincronización robusta
            if (window.NotificationService) {
                const refresh = () => {
                    console.log("📺 [Ticker] Sincronizando noticias (Chat + Apps)...");
                    const data = {
                        items: window.NotificationService.getMergedNotifications(),
                        count: window.NotificationService.unreadCount
                    };
                    updateTicker(data);
                };

                // Suscripción única global
                if (!window._tickerSubscribed) {
                    window.NotificationService.onUpdate(() => {
                        if (window.Router?.currentRoute === 'dashboard') refresh();
                    });
                    window._tickerSubscribed = true;
                }

                // Forzar actualización inmediata tras render de vista
                setTimeout(refresh, 200);
            }
        }


        renderWeatherCard(city, temp, icon, details = {}, isPropitious = true) {
            const intel = details.intel || { score: 100, ballSpeed: '--', recommendation: 'Sincronizando meteorología...', gripStatus: '--' };
            const statusLabel = isPropitious ? 'ÓPTIMO' : 'ADVERSO';
            const statusColor = isPropitious ? '#00E36D' : '#FF2D55';
            const statusBg = isPropitious ? 'rgba(0,227,109,0.1)' : 'rgba(255,45,85,0.1)';

            return `
                <div style="
                    background: rgba(10, 10, 20, 0.95);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 28px;
                    padding: 18px;
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                    box-shadow: 0 15px 35px rgba(0,0,0,0.6);
                    position: relative;
                    overflow: hidden;
                    transition: transform 0.3s;
                ">
                    <!-- Glow effect -->
                    <div style="position: absolute; top: -10%; right: -10%; width: 60%; height: 60%; background: radial-gradient(circle, ${statusColor}15 0%, transparent 70%);"></div>

                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="font-size: 2.2rem; filter: drop-shadow(0 0 15px rgba(255,204,0,0.5));">${icon}</div>
                        <div style="text-align: right;">
                             <div style="background: ${statusBg}; color: ${statusColor}; padding: 4px 10px; border-radius: 8px; font-size: 0.6rem; font-weight: 950; border: 1px solid ${statusColor}20; letter-spacing: 0.5px; margin-bottom: 4px;">${statusLabel}</div>
                             <div style="font-size: 0.55rem; color: rgba(255,255,255,0.4); font-weight: 800;">SCORE: ${intel.score}%</div>
                        </div>
                    </div>
                    
                    <div>
                        <div style="color: white; font-weight: 950; font-size: 1.8rem; line-height: 1; letter-spacing: -0.5px;">${temp}</div>
                        <div style="color: rgba(255,255,255,0.5); font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-top: 5px;">${city}</div>
                    </div>

                    <!-- AI INSIGHTS AREA -->
                    <div style="background: rgba(255,255,255,0.03); border-radius: 16px; padding: 12px; border: 1px solid rgba(255,255,255,0.05); display: flex; flex-direction: column; gap: 8px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 0.55rem; color: #888; font-weight: 800; text-transform: uppercase;">⚡ Velocidad Bola</span>
                            <span style="font-size: 0.6rem; color: #CCFF00; font-weight: 950;">${intel.ballSpeed}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 0.55rem; color: #888; font-weight: 800; text-transform: uppercase;">👟 Agarre Pista</span>
                            <span style="font-size: 0.6rem; color: #00c4ff; font-weight: 950;">${intel.gripStatus}</span>
                        </div>
                    </div>

                    <!-- AI RECOMMENDATION -->
                    <div style="font-size: 0.65rem; color: white; opacity: 0.8; font-weight: 700; font-style: italic; line-height: 1.3;">
                         " ${intel.recommendation} "
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.05);">
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <i class="fas fa-wind" style="font-size: 0.6rem; color: #00c4ff;"></i>
                            <span style="font-size: 0.65rem; color: #888; font-weight: 700;">${details.wind || '--'}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <i class="fas fa-cloud-rain" style="font-size: 0.6rem; color: #00c4ff;"></i>
                            <span style="font-size: 0.65rem; color: #888; font-weight: 700;">${details.rain || '0%'}</span>
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
                        ${am.status === 'live' ?
                    `<div style="background: rgba(255, 45, 85, 0.2); color: #FF2D55; padding: 4px 10px; border-radius: 8px; font-size: 0.6rem; font-weight: 900; animation: blink 1s infinite; border: 1px solid #FF2D55;">EN VIVO 🔴</div>` :
                    `<div style="background: rgba(6, 182, 212, 0.1); color: var(--brand-accent); padding: 4px 10px; border-radius: 8px; font-size: 0.6rem; font-weight: 900;">CONFIRMADO</div>`
                }
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
                // 1. DATA GATHERING (INTEL)
                const [allEvents, weatherData, rankingData] = await Promise.all([
                    window.AmericanaService ? window.AmericanaService.getAllActiveEvents() : [],
                    window.WeatherService ? window.WeatherService.getDashboardWeather() : [],
                    window.RankingController ? window.RankingController.calculateSilently() : []
                ]);

                let itemsHtml = [];

                // A. WEATHER INTEL CARD (SMART)
                if (weatherData && weatherData[0]) {
                    const w = weatherData[0];
                    itemsHtml.push(`
                        <div class="registration-ticker-card" style="min-width: 280px; min-height: 150px; scroll-snap-align: center; background: linear-gradient(135deg, #1e293b 0%, #000 100%); border-top: 5px solid #3b82f6; border-radius: 24px; padding: 20px; flex-shrink: 0; box-shadow: 0 15px 30px rgba(0,0,0,0.4); border-left: 1px solid rgba(59,130,246,0.3); display: flex; flex-direction: column; gap: 10px;">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <span style="font-size:0.6rem; font-weight:950; color:white; background:#3b82f6; padding:3px 8px; border-radius:6px; letter-spacing:1px;">METEO</span>
                                <span style="font-size:1.2rem;">${w.icon}</span>
                            </div>
                            <div style="color:white; font-weight:950; font-size:1rem; margin-top:2px;">${w.name} ${w.temp}ºC</div>
                            <div style="color:#3b82f6; font-size:0.6rem; font-weight:950; letter-spacing:1.2px; text-transform:uppercase;">BOLA ${w.intelligence?.ballSpeed || 'MEDIA'}</div>
                            <div style="color:#888; font-size:0.65rem; font-weight:800; margin-top:2px; display: flex; align-items: center; gap: 5px;"><i class="fas fa-eye"></i> Visibilidad: ${w.visibility}km</div>
                        </div>
                    `);
                }

                // B. RANKING TOP CARD (SMART)
                if (rankingData && rankingData.length > 0) {
                    const top = rankingData[0];
                    const second = rankingData[1];
                    const pts1 = (top.stats.americanas.points || 0) + (top.stats.entrenos.points || 0);

                    // Check if joint leaders (Same points, wins, and court1 count)
                    const isJoint = second && pts1 > 0 &&
                        pts1 === ((second.stats.americanas.points || 0) + (second.stats.entrenos.points || 0)) &&
                        ((top.stats.americanas.won || 0) + (top.stats.entrenos.won || 0)) === ((second.stats.americanas.won || 0) + (second.stats.entrenos.won || 0)) &&
                        ((top.stats.americanas.court1Count || 0) + (top.stats.entrenos.court1Count || 0)) === ((second.stats.americanas.court1Count || 0) + (second.stats.entrenos.court1Count || 0));

                    if (isJoint) {
                        itemsHtml.push(`
                            <div class="registration-ticker-card" style="min-width: 300px; min-height: 150px; scroll-snap-align: center; background: linear-gradient(135deg, #1e1b4b 0%, #000 100%); border-top: 5px solid #CCFF00; border-radius: 24px; padding: 20px; flex-shrink: 0; box-shadow: 0 15px 30px rgba(0,0,0,0.4); border-left: 1px solid rgba(204,255,0,0.3); display: flex; flex-direction: column; gap: 8px;">
                                <div style="display:flex; justify-content:space-between; align-items:center;">
                                    <span style="font-size:0.6rem; font-weight:950; color:black; background:#CCFF00; padding:3px 8px; border-radius:6px; letter-spacing:1px;">CO-LÍDERES GLOBALES</span>
                                    <div style="display:flex; gap:-5px;">
                                        <span style="font-size:1.1rem; z-index:2;">👑</span>
                                        <span style="font-size:1.1rem; margin-left:-8px; opacity:0.8;">👑</span>
                                    </div>
                                </div>
                                <div style="display:flex; flex-direction:column; gap:2px; margin-top:5px;">
                                    <div style="color:white; font-weight:950; font-size:0.9rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">1. ${top.name.toUpperCase()}</div>
                                    <div style="color:white; font-weight:950; font-size:0.9rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">2. ${second.name.toUpperCase()}</div>
                                </div>
                                <div style="color:#CCFF00; font-size:0.65rem; font-weight:950; letter-spacing:1px; margin-top:4px;">PUNTOS: ${pts1} • EMPATE TÉCNICO</div>
                                <div style="color:#888; font-size:0.6rem; font-weight:800; display: flex; align-items: center; gap: 5px;"><i class="fas fa-trophy"></i> MVPS COMUNIDAD SOMOSPADEL</div>
                            </div>
                        `);
                    } else {
                        itemsHtml.push(`
                            <div class="registration-ticker-card" style="min-width: 280px; min-height: 150px; scroll-snap-align: center; background: linear-gradient(135deg, #451a03 0%, #000 100%); border-top: 5px solid #f59e0b; border-radius: 24px; padding: 20px; flex-shrink: 0; box-shadow: 0 15px 30px rgba(0,0,0,0.4); border-left: 1px solid rgba(245,158,11,0.3); display: flex; flex-direction: column; gap: 10px;">
                                <div style="display:flex; justify-content:space-between; align-items:center;">
                                    <span style="font-size:0.6rem; font-weight:950; color:white; background:#f59e0b; padding:3px 8px; border-radius:6px; letter-spacing:1px;">LÍDER GLOBAL</span>
                                    <span style="font-size:1.2rem;">👑</span>
                                </div>
                                <div style="color:white; font-weight:950; font-size:1rem; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${top.name.toUpperCase()}</div>
                                <div style="color:#f59e0b; font-size:0.65rem; font-weight:950; letter-spacing:1.2px;">PUNTOS: ${pts1} • LVL ${top.level.toFixed(2)}</div>
                                <div style="color:#888; font-size:0.65rem; font-weight:800; display: flex; align-items: center; gap: 5px;"><i class="fas fa-trophy"></i> MVP COMUNIDAD SOMOSPADEL</div>
                            </div>
                        `);
                    }
                }

                // C. ACTIVE EVENTS (INSCRIPCIONES)
                const openEvents = allEvents.filter(a => ['open', 'upcoming', 'draft', 'scheduled', 'live'].includes(a.status));
                openEvents.forEach(am => {
                    let statusColor = '#00c4ff';
                    let statusLabel = 'PRÓXIMO';
                    let isLive = false;

                    if (am.status === 'open') {
                        statusColor = '#00E36D';
                        statusLabel = 'ABIERTO';
                    } else if (am.status === 'live') {
                        statusColor = '#FF2D55';
                        statusLabel = 'EN JUEGO';
                        isLive = true;
                    }

                    const players = am.players || am.registeredPlayers || [];
                    const maxPlayers = (am.max_courts || 0) * 4;
                    const spotsLeft = Math.max(0, maxPlayers - players.length);
                    const isFull = maxPlayers > 0 && players.length >= maxPlayers;
                    const typeLabel = am.type === 'entreno' ? 'ENTRENO' : 'AMERICANA';
                    const categoryIcon = am.category === 'female' ? '♀️' : (am.category === 'male' ? '♂️' : '🎾');

                    itemsHtml.push(`
                        <div class="registration-ticker-card" 
                             onclick="event.stopPropagation(); window.ControlTowerView?.prepareLoad('${am.id}'); Router.navigate('live');" 
                             style="
                            min-width: 280px; 
                            min-height: 150px;
                            scroll-snap-align: center;
                            background: linear-gradient(135deg, #111 0%, #000 100%);
                            border-top: 5px solid ${statusColor};
                            border-radius: 24px; 
                            padding: 20px; 
                            flex-shrink: 0; 
                            box-shadow: 0 15px 30px rgba(0,0,0,0.4);
                            display: flex; 
                            flex-direction: column; 
                            gap: 12px; 
                            cursor: pointer;
                        ">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <span style="font-size:0.6rem; font-weight:950; color:white; background:${statusColor}; padding:3px 8px; border-radius:6px; letter-spacing:1px;">${statusLabel}</span>
                                <span style="font-size:1.1rem;">${categoryIcon}</span>
                            </div>
                            <div style="color:white; font-weight:950; font-size:0.9rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${am.name.toUpperCase()}</div>
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:2px;">
                                <div style="display:flex; flex-direction:column; gap:2px;">
                                    <span style="color:#aaa; font-size:0.65rem; font-weight:800;"><i class="far fa-clock"></i> ${am.time}</span>
                                    <span style="color:${statusColor}; font-size:0.55rem; font-weight:950; letter-spacing:1px;">${typeLabel}</span>
                                </div>
                                <div style="text-align:right;">
                                    <div style="color:${isFull ? '#ef4444' : '#00E36D'}; font-size:0.9rem; font-weight:950;">${players.length}/${maxPlayers}</div>
                                    <div style="font-size:0.5rem; color:#555; font-weight:950; text-transform:uppercase;">Plazas</div>
                                </div>
                            </div>
                        </div>
                    `);
                });

                if (itemsHtml.length === 0) {
                    return `<div style="width: 100%; text-align: center; color: #444; font-size: 0.75rem; font-weight: 700;">No hay novedades activas</div>`;
                }

                return itemsHtml.join('');
            } catch (err) {
                console.error("Smart Ticker Build Error:", err);
                return '';
            }
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
                // 1. Load Registration Cards (Intelligent Ticker)
                this.renderLiveWidget(context).then(widgetHtml => {
                    const scroller = document.getElementById('live-scroller-content');
                    if (scroller) {
                        // Intelligent Ticker: Emerges from shadows (center-biased)
                        // scroller.classList.add('ticker-container'); // REMOVED to remove blur effect per user request
                        // Duplicamos el contenido para el bucle infinito y que se vea "lleno" desde el inicio
                        scroller.innerHTML = `
                            <div class="ticker-content" style="padding-left: 20px;">
                                ${widgetHtml} ${widgetHtml} ${widgetHtml}
                            </div>
                        `;
                    }
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
        async showChatInfo() {
            const modalId = 'chat-info-modal';
            let modal = document.getElementById(modalId);
            if (!modal) {
                modal = document.createElement('div');
                modal.id = modalId;
                modal.style.cssText = `
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(0,0,0,0.85); backdrop-filter: blur(10px);
                    display: flex; align-items: center; justify-content: center;
                    z-index: 9999999; opacity: 0; transition: opacity 0.3s ease;
                `;
                modal.onclick = () => {
                    modal.style.opacity = '0';
                    setTimeout(() => modal.remove(), 300);
                };
                document.body.appendChild(modal);
            }

            modal.innerHTML = `
                <div style="
                    background: white; border-radius: 32px; padding: 40px 30px;
                    width: 90%; max-width: 450px; position: relative;
                    box-shadow: 0 25px 50px rgba(0,0,0,0.5);
                    text-align: center; border: 2px solid #CCFF00;
                    animation: modalIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                " onclick="event.stopPropagation()">
                    
                    <h3 style="margin: 0 0 25px 0; color: #1e293b; font-weight: 950; font-size: 1.4rem; letter-spacing: -0.5px;">SOMOSPADEL.EU EXPERIENCE</h3>
                    
                    <!-- TV SECTION -->
                    <div style="margin-bottom: 30px; text-align: left; background: #f8fafc; padding: 20px; border-radius: 20px; border: 1px solid #e2e8f0;">
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px;">
                            <div style="width: 40px; height: 40px; background: white; border-radius: 10px; display: flex; align-items: center; justify-content: center; border: 1px solid #e2e8f0; color: #CCFF00; font-size: 1.2rem;">
                                <i class="fas fa-tv"></i>
                            </div>
                            <span style="font-weight: 900; color: #1e293b; font-size: 1rem;">LIVE TV</span>
                        </div>
                        <p style="color: #64748b; font-size: 0.85rem; line-height: 1.5; margin: 0; font-weight: 500;">
                            Podrás seguir todos los resultados y la clasificación en vivo desde el <b>PC de Entrenos y Americanas</b> de SomosPadel BCN.
                        </p>
                    </div>

                    <!-- CHAT SECTION -->
                    <div style="margin-bottom: 30px; text-align: left; background: #f8fafc; padding: 20px; border-radius: 20px; border: 1px solid #e2e8f0;">
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px;">
                            <div style="width: 40px; height: 40px; background: white; border-radius: 10px; display: flex; align-items: center; justify-content: center; border: 1px solid #e2e8f0; color: #0ea5e9; font-size: 1.2rem;">
                                <i class="fas fa-comment-dots"></i>
                            </div>
                            <span style="font-weight: 900; color: #1e293b; font-size: 1rem;">CHAT DEL EVENTO</span>
                        </div>
                        <p style="color: #64748b; font-size: 0.85rem; line-height: 1.5; margin: 0; font-weight: 500;">
                            Dentro de cada evento en vivo encontrarás un botón de <b>CHAT</b>. Úsalo para hablar con los rivales o pulsa <b>SOS</b> si te falta pareja a última hora.
                        </p>
                    </div>

                    <div style="background: #1e293b; color: #CCFF00; padding: 12px; border-radius: 12px; font-size: 0.75rem; font-weight: 800; margin-bottom: 25px;">
                        <i class="fas fa-info-circle"></i> Encontrarás ambos iconos en los entrenos en juego y finalizados.
                    </div>

                    <button style="
                        width: 100%; background: #CCFF00; color: #000;
                        border: none; padding: 18px; border-radius: 16px;
                        font-weight: 950; font-size: 1rem; cursor: pointer;
                        box-shadow: 0 10px 20px rgba(204,255,0,0.2);
                        transition: all 0.2s;
                    " onclick="this.closest('#chat-info-modal').click()">ENTENDIDO</button>
                </div>
                <style>
                    @keyframes modalIn { from { opacity: 0; transform: scale(0.8) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
                </style>
            `;

            setTimeout(() => modal.style.opacity = '1', 10);
        }
    }

    window.DashboardView = new DashboardView();
    console.log("🚀 Vibrant Dashboard Loaded");
})();
