/**
 * StoryFeedWidget.js - V3 (Professional Edition)
 * 📱 Real-Time Data Stories Engine
 * Arquitectura de alto rendimiento para visualización de Big Data.
 */
(function () {
    'use strict';

    class StoryFeedWidget {
        constructor() {
            this.containerId = 'story-feed-root';

            // Static premium order for consistent user experience and low CPU/memory footprint
            this.stories = [
                { id: 'noticias', label: 'NOTICIAS 📰', icon: 'fa-bullhorn', color: '#00E36D' },
                { id: 'ranking', label: 'RANKING 🏆', icon: 'fa-trophy', color: '#fb7185' },
                { id: 'equipos', label: 'EQUIPOS 👥', icon: 'fa-users', color: '#38bdf8' },
                { id: 'shop', label: 'TIENDA 🛍️', icon: 'fa-shopping-bag', color: '#6366f1' },
                { id: 'tournaments', label: 'TORNEOS 🏆', icon: 'fa-award', color: '#fb923c' },
                { id: 'records', label: 'RÉCORDS 📊', icon: 'fa-history', color: '#10b981' }
            ];
        }

        async loadDynamicStories() {
            // Start with base stories
            const dynamicStories = [
                { id: 'noticias', label: 'NOTICIAS 📰', icon: 'fa-bullhorn', color: '#00E36D' },
                { id: 'ranking', label: 'RANKING 🏆', icon: 'fa-trophy', color: '#fb7185' }
            ];

            // 1. Fetch Active Events dynamically from the database
            try {
                if (window.AmericanaService) {
                    const events = await window.AmericanaService.getAllActiveEvents();
                    const openEvents = events.filter(e => ['open', 'upcoming', 'scheduled', 'live'].includes(e.status));
                    
                    // Add up to 3 active events as custom story bubbles!
                    openEvents.slice(0, 3).forEach(event => {
                        let color = '#38bdf8'; // Blue for male/default
                        const nameLower = event.name.toLowerCase();
                        if (nameLower.includes('fem') || nameLower.includes('chicas')) color = '#f472b6'; // Pink
                        else if (nameLower.includes('mix')) color = '#fbbf24'; // Orange/Yellow
                        else if (event.type === 'entreno') color = '#a3d900'; // Green

                        // Extract a concise single-word label for the Instagram bubble
                        let label = event.name.split(' ')[0].toUpperCase();
                        if (label.length > 9) label = label.substring(0, 8) + '…';

                        dynamicStories.push({
                            id: `event_${event.id}`,
                            label: `${label} 🎾`,
                            icon: event.type === 'entreno' ? 'fa-graduation-cap' : 'fa-medal',
                            color: color,
                            isEvent: true,
                            eventData: event
                        });
                    });
                }
            } catch (e) {
                console.warn("Error loading dynamic event stories", e);
            }

            // 2. Add remaining base stories
            dynamicStories.push(
                { id: 'equipos', label: 'EQUIPOS 👥', icon: 'fa-users', color: '#38bdf8' },
                { id: 'shop', label: 'TIENDA 🛍️', icon: 'fa-shopping-bag', color: '#6366f1' },
                { id: 'tournaments', label: 'TORNEOS 🏆', icon: 'fa-award', color: '#fb923c' },
                { id: 'records', label: 'RÉCORDS 📊', icon: 'fa-history', color: '#10b981' }
            );

            this.stories = dynamicStories;
        }

        async render(containerId) {
            this.containerId = containerId || this.containerId;
            const container = document.getElementById(this.containerId);
            if (!container) return;

            await this.loadDynamicStories(); // Fetch live news/events dynamically

            this.injectStyles();
            this.updateUI();
        }

        injectStyles() {
            if (document.getElementById('story-feed-v3-styles')) return;
            const style = document.createElement('style');
            style.id = 'story-feed-v3-styles';
            style.textContent = `
                /* Story Bar Layout */
                .story-feed-v3-wrapper {
                    padding: 5px 0; /* Reduced top padding to balance with bottom label space */
                    user-select: none;
                    perspective: 1200px;
                }
                .story-h-scroll {
                    display: flex;
                    justify-content: center;
                    gap: 16px;
                    padding: 10px 5px;
                    overflow-x: auto;
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                }
                .story-h-scroll::-webkit-scrollbar { display: none; }
                
                .story-v3-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    transition: all 0.25s ease;
                }
                
                .story-v3-item:hover { 
                    transform: translateY(-4px) scale(1.05); 
                }

                @keyframes pulseDot {
                    0% { transform: scale(1); opacity: 0.8; }
                    50% { transform: scale(1.25); opacity: 1; }
                    100% { transform: scale(1); opacity: 0.8; }
                }

                .story-v3-outer {
                    width: 54px;
                    height: 54px;
                    border-radius: 50%;
                    padding: 2.5px;
                    background: linear-gradient(135deg, #f09433 0%, #dc2743 50%, #bc1888 100%);
                    position: relative;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.5), inset 0 2px 10px rgba(255,255,255,0.4);
                    transition: all 0.25s ease;
                }
                .story-v3-item:hover .story-v3-outer {
                    box-shadow: 0 12px 30px rgba(220, 39, 67, 0.4), inset 0 2px 10px rgba(255,255,255,0.6);
                }
                
                .story-v3-inner {
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    background: radial-gradient(circle at 30% 30%, #333, #000);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 1.5px solid rgba(0,0,0,0.5);
                    overflow: hidden;
                    position: relative;
                }
                /* Glare effect on inner sphere */
                .story-v3-inner::after {
                    content: '';
                    position: absolute;
                    top: 10%;
                    left: 20%;
                    width: 25%;
                    height: 15%;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.1);
                    filter: blur(2px);
                    transform: skewX(-20deg);
                }
                
                .story-v3-label {
                    font-size: 0.55rem;
                    font-weight: 950; /* Ultra Bold */
                    color: #000000; /* Pure Black */
                    letter-spacing: 0.5px;
                    text-transform: uppercase;
                    white-space: nowrap;
                    margin-top: 6px;
                    
                    /* SHARPNESS FIXES */
                    transform: translateZ(0); 
                    backface-visibility: hidden;
                    -webkit-font-smoothing: antialiased;
                    -moz-osx-font-smoothing: grayscale;
                    text-rendering: optimizeLegibility;
                    text-shadow: none; /* No shadow for clean black look */
                }

                .story-v3-modal {
                    position: fixed;
                    inset: 0;
                    background: #000;
                    z-index: 9999999;
                    display: none;
                    flex-direction: column;
                    overflow: hidden;
                    animation: storyEnter 0.4s both cubic-bezier(0.19, 1, 0.22, 1);
                }
                @keyframes storyEnter {
                    from { transform: scale(1.2); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }

                .story-progress-v3 {
                    position: absolute;
                    top: env(safe-area-inset-top, 20px);
                    left: 10px;
                    right: 10px;
                    height: 3px;
                    display: flex;
                    gap: 4px;
                    z-index: 100;
                }
                .story-bar-v3 {
                    flex: 1;
                    background: rgba(255,255,255,0.25);
                    border-radius: 10px;
                    height: 100%;
                    overflow: hidden;
                }
                .story-fill-v3 {
                    width: 100%;
                    height: 100%;
                    background: #fff;
                    transform-origin: left;
                    transition: transform 5s linear;
                    transform: scaleX(0);
                }
            `;
            document.head.appendChild(style);
        }

        updateUI() {
            const container = document.getElementById(this.containerId);
            if (!container) return;

            container.innerHTML = `
                <div class="story-feed-v3-wrapper" style="position: relative; padding: 5px 0 10px;">
                    <!-- FLEX LAYOUT FOR MOBILE (SWIPEABLE ROW) -->
                    <div class="story-h-scroll" style="
                        display: flex;
                        align-items: center;
                        gap: 16px;
                        padding: 10px 20px;
                        overflow-x: auto;
                        scrollbar-width: none;
                        -ms-overflow-style: none;
                        -webkit-overflow-scrolling: touch;
                    ">
                        <!-- STORY ITEMS -->
                        ${this.stories.map(story => {
                            let ringBg = 'linear-gradient(135deg, #f09433 0%, #dc2743 50%, #bc1888 100%)';
                            let outerShadow = '0 8px 20px rgba(0,0,0,0.4)';
                            if (story.id === 'noticias') {
                                ringBg = 'linear-gradient(135deg, #00E36D 0%, #00ff9d 100%)';
                                outerShadow = '0 0 15px rgba(0,227,109,0.5)';
                            } else if (story.id === 'records') {
                                ringBg = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                                outerShadow = '0 0 15px rgba(16,185,129,0.5)';
                            } else if (story.id === 'equipos') {
                                ringBg = 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)';
                                outerShadow = '0 0 15px rgba(56,189,248,0.5)';
                            } else if (story.id === 'tournaments') {
                                ringBg = 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)';
                                outerShadow = '0 0 15px rgba(251,146,60,0.5)';
                            }

                            return `
                                <div class="story-v3-item" style="flex-shrink: 0; display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: pointer; transition: all 0.25s;" onclick="window.StoryFeedWidget.showStory('${story.id}')">
                                    <div class="story-v3-outer" style="
                                        width: 56px; height: 56px; border-radius: 50%; padding: 2.5px;
                                        background: ${ringBg};
                                        box-shadow: ${outerShadow}, inset 0 2px 10px rgba(255,255,255,0.2);
                                        position: relative; transition: all 0.25s;
                                    ">
                                        <div class="story-v3-inner" style="
                                            width: 100%; height: 100%; border-radius: 50%;
                                            background: radial-gradient(circle at 30% 30%, #1e293b, #0f172a);
                                            display: flex; align-items: center; justify-content: center;
                                            border: 1px solid rgba(255,255,255,0.05);
                                        ">
                                            <i class="fas ${story.icon}" style="color: ${story.color}; font-size: 1.15rem; filter: drop-shadow(0 0 5px ${story.color});"></i>
                                        </div>
                                        ${story.id === 'noticias' ? `<div style="position: absolute; top: -3px; right: -3px; width: 12px; height: 12px; background: #FF2D55; border-radius: 50%; border: 2.5px solid #0f172a; box-shadow: 0 0 10px #FF2D55; animation: pulseDot 1s infinite;"></div>` : ''}
                                    </div>
                                    <span class="story-v3-label" style="font-size: 0.6rem; font-weight: 900; color: #000000; letter-spacing: 0.3px; text-transform: uppercase;">${story.label.split(' ')[0]}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                    </div>
                </div>
                
                <style>
                    @keyframes livePulse {
                        0% { opacity: 1; transform: scale(1); }
                        50% { opacity: 0.7; transform: scale(1.05); }
                        100% { opacity: 1; transform: scale(1); }
                    }
                    
                    /* Responsive para pantallas muy pequeñas (iPhone SE, etc) */
                    @media (max-width: 375px) {
                        .story-feed-v3-wrapper > div {
                            grid-template-columns: repeat(auto-fit, minmax(50px, 1fr)) !important;
                            gap: 10px !important;
                            padding: 8px 10px !important;
                        }
                        .story-v3-label {
                            font-size: 0.5rem !important;
                        }
                    }
                    
                    /* Para tablets y pantallas más grandes */
                    @media (min-width: 768px) {
                        .story-feed-v3-wrapper > div {
                            grid-template-columns: repeat(7, 1fr) !important;
                            max-width: 600px;
                            margin: 0 auto;
                        }
                    }
                </style>
            `;
        }

        async showStory(id) {
            let modal = document.getElementById('story-v3-modal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'story-v3-modal';
                modal.className = 'story-v3-modal';
                document.body.appendChild(modal);
            }

            const index = this.stories.findIndex(s => s.id === id);
            if (index === -1) return;

            this.currentStoryIndex = index;
            const story = this.stories[index];
            let contentHtml = '';

            // FETCH REAL DATA CORE
            let playersData = [];
            let rankedData = [];
            try {
                if (window.RankingController) {
                    rankedData = await window.RankingController.calculateSilently();
                    playersData = rankedData;
                } else if (window.PlayerService) {
                    playersData = await window.PlayerService.getAllPlayers();
                } else if (window.db) {
                    const snap = await window.db.collection('players').get();
                    playersData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                }
            } catch (e) { console.warn("Players fetch failed", e); }

            const [allEvents, weatherData] = await Promise.all([
                window.AmericanaService ? window.AmericanaService.getAllActiveEvents() : [],
                window.WeatherService ? window.WeatherService.getDashboardWeather() : []
            ]);

            const allPlayers = playersData;
            const topRanked = rankedData.length > 0 ? rankedData : allPlayers.sort((a, b) => (b.points || 0) - (a.points || 0));

            // CONTENT INJECTION
            if (id.startsWith('event_')) {
                const event = story.eventData;
                if (event) {
                    const regCount = (event.players || event.registeredPlayers || []).length;
                    const maxPlazas = (event.max_courts || 0) * 4;
                    const percent = maxPlazas > 0 ? Math.min(100, Math.round((regCount / maxPlazas) * 100)) : 0;
                    
                    let catColor = '#00E36D';
                    const lowerName = event.name.toLowerCase();
                    if (lowerName.includes('fem') || lowerName.includes('chicas')) catColor = '#FF2D55';
                    else if (lowerName.includes('mix')) catColor = '#FFD700';
                    else if (lowerName.includes('masc') || lowerName.includes('chicos')) catColor = '#00C4FF';

                    const playersHtml = (event.players || event.registeredPlayers || []).slice(0, 8).map(p => `
                        <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 8px 12px; border-radius: 10px; display: flex; align-items: center; justify-content: space-between;">
                            <span style="font-weight: 700; font-size: 0.8rem; text-transform: uppercase;">${p.name || 'Jugador'}</span>
                            <span style="font-size: 0.7rem; color: #fbbf24; font-weight: 800;">${p.level ? `NIVEL ${p.level}` : 'READY'}</span>
                        </div>
                    `).join('');

                    contentHtml = `
                        <div style="color: white; width: 100%; display: flex; flex-direction: column;">
                            <div style="text-align: center; margin-bottom: 20px; animation: fadeIn 0.4s ease-out;">
                                <span style="background: ${catColor}; color: #000; padding: 4px 14px; border-radius: 50px; font-weight: 950; font-size: 0.65rem; letter-spacing: 1px; text-transform: uppercase; box-shadow: 0 0 15px ${catColor}50;">${event.type === 'entreno' ? 'ENTRENAMIENTO' : 'AMERICANAS'}</span>
                                <h2 style="font-size: 2.2rem; font-weight: 1000; margin: 12px 0 5px; font-family: 'Outfit', sans-serif; line-height: 1.1; text-transform: uppercase;">${event.name}</h2>
                                <p style="color: rgba(255,255,255,0.4); font-size: 0.75rem; margin: 0; font-weight: 700; text-transform: uppercase;">${event.date} • ${event.time || '18:00'}</p>
                            </div>

                            <div style="display: flex; flex-direction: column; gap: 16px; padding-bottom: 40px;">
                                <!-- CAPACITY PROGRESS -->
                                <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 18px;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                        <span style="font-size: 0.75rem; font-weight: 900; color: rgba(255,255,255,0.6);">PLAZAS OCUPADAS</span>
                                        <span style="font-size: 0.95rem; font-weight: 1000; color: ${catColor};">${regCount} / ${maxPlazas}</span>
                                    </div>
                                    <div style="width: 100%; height: 8px; background: rgba(255,255,255,0.1); border-radius: 10px; overflow: hidden;">
                                        <div style="width: ${percent}%; height: 100%; background: ${catColor}; border-radius: 10px; box-shadow: 0 0 10px ${catColor};"></div>
                                    </div>
                                </div>

                                <!-- REGISTERED PLAYERS LIST -->
                                ${regCount > 0 ? `
                                    <div style="display: flex; flex-direction: column; gap: 8px;">
                                        <h4 style="margin: 0 0 4px; font-size: 0.85rem; font-weight: 900; color: rgba(255,255,255,0.5); text-transform: uppercase;">JUGADORES INSCRITOS</h4>
                                        <div style="display: flex; flex-direction: column; gap: 8px; max-height: 180px; overflow-y: auto;">
                                            ${playersHtml}
                                        </div>
                                    </div>
                                ` : `
                                    <div style="text-align: center; padding: 20px; background: rgba(255,255,255,0.02); border-radius: 20px; border: 1px dashed rgba(255,255,255,0.1);">
                                        <p style="margin: 0; font-size: 0.8rem; color: rgba(255,255,255,0.4); font-weight: 700;">¡Inaugura la lista! Sé el primero en inscribirse.</p>
                                    </div>
                                `}

                                <!-- ACTION BUTTON -->
                                <button onclick="event.stopPropagation(); window.dashNavigate('entrenos', 'event_story')" style="width: 100%; background: ${catColor}; color: #000; border: none; padding: 14px; border-radius: 15px; font-size: 0.85rem; font-weight: 1000; cursor: pointer; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 5px 15px ${catColor}40; margin-top: 10px;">
                                    ${event.status === 'live' ? 'VER PISTAS EN VIVO' : 'RESERVAR PLAZA AHORA'}
                                            </div>
                        </div>
                    `;
                } else {
                    contentHtml = `<div style="padding:40px; color:white; text-align:center;"><h2 style="font-weight:950; font-size:2rem;">EVENTO</h2><p style="opacity:0.6; margin-top:20px;">Detalles no disponibles.</p></div>`;
                }
            } else switch (id) {
                case 'noticias':
                    contentHtml = `
                        <div style="color: white; width: 100%; display: flex; flex-direction: column;">
                            <div style="text-align: center; margin-bottom: 25px; animation: fadeIn 0.4s ease-out;">
                                <span style="background: #00E36D; color: #000; padding: 4px 14px; border-radius: 50px; font-weight: 950; font-size: 0.65rem; letter-spacing: 1px; box-shadow: 0 0 15px rgba(0,227,109,0.3);">BOLETÍN OFICIAL</span>
                                <h2 style="font-size: 2.2rem; font-weight: 1000; margin: 12px 0 5px; font-family: 'Outfit', sans-serif;">SOMOSPADEL <span style="color: #00E36D;">BCN</span></h2>
                                <p style="color: rgba(255,255,255,0.4); font-size: 0.75rem; margin: 0; font-weight: 700; text-transform: uppercase;">Últimas novedades y accesos rápidos</p>
                            </div>

                            <div style="display: flex; flex-direction: column; gap: 16px; padding-bottom: 40px;">
                                <!-- 1. DESTACADO (ENTRENOS EN GRUPO) -->
                                <div style="background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%); border: 1.5px solid #6366f1; border-radius: 20px; padding: 18px; position: relative; overflow: hidden; box-shadow: 0 10px 25px rgba(99,102,241,0.25);">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                        <span style="font-size: 0.55rem; font-weight: 950; color: #818cf8; background: rgba(99,102,241,0.2); padding: 3px 8px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px;">🎾 ENTRENOS</span>
                                        <i class="fas fa-graduation-cap" style="color: #818cf8;"></i>
                                    </div>
                                    <h4 style="margin: 0 0 6px; font-size: 1.05rem; font-weight: 900; color: white;">ENTRENAMIENTOS DE GRUPO</h4>
                                    <p style="margin: 0 0 14px; font-size: 0.72rem; color: rgba(255,255,255,0.6); line-height: 1.3;">Apúntate hoy a nuestros entrenamientos de grupo y pozos por niveles para perfeccionar tu técnica.</p>
                                    <button onclick="event.stopPropagation(); window.dashNavigate('entrenos', 'noticias_story')" style="width: 100%; background: #6366f1; color: white; border: none; padding: 10px; border-radius: 10px; font-size: 0.75rem; font-weight: 900; cursor: pointer; text-transform: uppercase; letter-spacing: 0.5px; transition: 0.2s;">VER ENTRENOS</button>
                                </div>

                                <!-- 2. TIENDA VIP (MIGRATION TO INTEGRATED SHOP) -->
                                <div style="background: linear-gradient(135deg, #172554 0%, #0f172a 100%); border: 1.5px solid #3b82f6; border-radius: 20px; padding: 18px; position: relative; overflow: hidden; box-shadow: 0 10px 25px rgba(59,130,246,0.25);">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                        <span style="font-size: 0.55rem; font-weight: 950; color: #60a5fa; background: rgba(59,130,246,0.2); padding: 3px 8px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px;">🛍️ TIENDA VIP</span>
                                        <i class="fas fa-shopping-bag" style="color: #60a5fa;"></i>
                                    </div>
                                    <h4 style="margin: 0 0 6px; font-size: 1.05rem; font-weight: 900; color: white;">Tienda Oficial (En Breve)</h4>
                                    <p style="margin: 0 0 14px; font-size: 0.72rem; color: rgba(255,255,255,0.6); line-height: 1.3;">Muy pronto estará disponible la tienda online oficial integrada directamente en esta app.</p>
                                    <button onclick="event.stopPropagation(); window.StoryFeedWidget.showStory('shop')" style="width: 100%; background: #3b82f6; color: white; border: none; padding: 10px; border-radius: 10px; font-size: 0.75rem; font-weight: 900; cursor: pointer; text-transform: uppercase; letter-spacing: 0.5px; transition: 0.2s;">VER DETALLES</button>
                                </div>

                                <!-- 3. PERFIL Y STATS -->
                                <div style="background: linear-gradient(135deg, #064e3b 0%, #0f172a 100%); border: 1.5px solid #10b981; border-radius: 20px; padding: 18px; position: relative; overflow: hidden; box-shadow: 0 10px 25px rgba(16,185,129,0.25);">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                        <span style="font-size: 0.55rem; font-weight: 950; color: #34d399; background: rgba(16,185,129,0.2); padding: 3px 8px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px;">📊 MI EVOLUCIÓN</span>
                                        <i class="fas fa-chart-line" style="color: #34d399;"></i>
                                    </div>
                                    <h4 style="margin: 0 0 6px; font-size: 1.05rem; font-weight: 900; color: white;">Progreso y Nivel Power</h4>
                                    <p style="margin: 0 0 14px; font-size: 0.72rem; color: rgba(255,255,255,0.6); line-height: 1.3;">Visualiza tu evolución de nivel, ELO y últimas estadísticas competitivas.</p>
                                    <button onclick="event.stopPropagation(); window.dashNavigate('profile', 'noticias_story')" style="width: 100%; background: #10b981; color: white; border: none; padding: 10px; border-radius: 10px; font-size: 0.75rem; font-weight: 900; cursor: pointer; text-transform: uppercase; letter-spacing: 0.5px; transition: 0.2s;">VER MIS ESTADÍSTICAS</button>
                                </div>

                                <!-- 4. SMART TIP -->
                                <div style="background: rgba(255, 255, 255, 0.03); border: 1px dashed rgba(255,255,255,0.15); border-radius: 20px; padding: 18px;">
                                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                                        <i class="fas fa-lightbulb" style="color: #fbbf24; font-size: 1.1rem;"></i>
                                        <h4 style="margin: 0; font-size: 0.9rem; font-weight: 900; color: white; text-transform: uppercase; letter-spacing: 0.5px;">💡 SMART TIP</h4>
                                    </div>
                                    <p style="margin: 0; font-size: 0.72rem; color: rgba(255,255,255,0.5); line-height: 1.4;">
                                        Desliza hacia abajo para cerrar esta pantalla de historias en cualquier momento o pulsa en los lados izquierdo/derecho para cambiar de canal.
                                    </p>
                                </div>
                            </div>
                        </div>
                    `;
                    break;
                case 'ranking':
                    this.currentRankingData = topRanked; // Store for search
                    const top3 = topRanked.slice(0, 3);
                    contentHtml = `
                        <div style="color: white; width: 100%; display: flex; flex-direction: column;">
                            <div id="ranking-default-view">
                                <span style="background:#fb7185; color:#000; padding:4px 12px; border-radius:50px; font-weight:950; font-size:0.6rem;">RANKING ACTUALIZADO</span>
                                <h2 style="font-size: 2.2rem; font-weight: 950; margin: 15px 0;">LOS REYES<br>DE <span style="color:#fb7185">LA PISTA</span></h2>
                            </div>

                            <!-- SEARCH BAR -->
                            <div style="margin-bottom:20px; position:relative; z-index:1005;">
                                <div style="position:relative;">
                                    <i class="fas fa-search" style="position:absolute; left:15px; top:50%; transform:translateY(-50%); color:rgba(255,255,255,0.4);"></i>
                                    <input type="text" placeholder="Buscar jugador..." 
                                        onclick="event.stopPropagation()"
                                        onkeyup="window.StoryFeedWidget.onRankingSearch(this.value)"
                                        onfocus="window.StoryFeedWidget.pauseStory()"
                                        style="width:100%; background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); padding:12px 12px 12px 45px; border-radius:15px; color:white; font-weight:700; outline:none; font-family:inherit; font-size: 0.9rem;">
                                </div>
                            </div>

                            <div id="ranking-content-area" style="overflow-y:auto; flex:1; padding-bottom:50px; -ms-overflow-style: none; scrollbar-width: none;">
                                <!-- DEFAULT TOP 3 -->
                                <div id="ranking-top-list" style="display:flex; flex-direction:column; gap:12px;">
                                    ${top3.length > 0 ? top3.map((p, i) => `
                                        <div style="display:flex; align-items:center; gap:15px; background:rgba(251,113,133,0.1); padding:15px; border-radius:18px; border:1px solid rgba(251,113,133,0.2); animation: enterStoryCard 0.5s both ${i * 0.1}s;">
                                            <div style="font-size:1.5rem; font-weight:900; color:#fb7185; min-width: 40px;">#${i + 1}</div>
                                            <div style="flex:1; font-weight:800; font-size:1rem; text-transform:uppercase;">${p.name || 'Pro Player'}</div>
                                            <div style="font-weight:900; color:#fb7185;">${Math.round((p.stats?.americanas?.points || 0) + (p.stats?.entrenos?.points || 0))} PTS</div>
                                        </div>
                                    `).join('') : '<p style="color:rgba(255,255,255,0.4); text-align:center;">Analizando métricas del club...</p>'}
                                </div>
                                <!-- SEARCH RESULTS (Hidden by default) -->
                                <div id="ranking-search-results" style="display:none; flex-direction:column; gap:10px;"></div>
                            </div>
                        </div>
                    `;
                    break;
                case 'clinica':
                    contentHtml = `
                        <div style="padding: 40px; text-align:center; color: white;">
                            <div style="width:100px; height:100px; background:#f472b6; border-radius:30px; display:flex; align-items:center; justify-content:center; margin:0 auto 30px; box-shadow:0 15px 40px rgba(244,114,182,0.4);">
                                <i class="fas fa-graduation-cap" style="color:black; font-size:3rem;"></i>
                            </div>
                            <h2 style="font-size: 2rem; font-weight: 1000;">ESCUELA DE<br><span style="color:#f472b6">PÁDEL</span></h2>
                            <p style="color:rgba(255,255,255,0.8); margin-top:15px; line-height:1.6; font-weight:600;">Mejora tu técnica con clases personalizadas y grupos adaptados a todos los niveles.</p>
                            <div style="margin-top:40px; background:rgba(255,255,255,0.05); padding:20px; border-radius:20px; border: 1px dashed #f472b6;">
                                <p style="color:#f472b6; font-weight:900; font-size:0.85rem; margin:0; line-height:1.4;">
                                    Escríbenos por privado para ponerte en contacto con el profesor de pádel.
                                </p>
                            </div>
                        </div>
                    `;
                    break;
                case 'records':
                    contentHtml = `
                        <div style="padding: 40px; text-align:center; color: white; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%;">
                            <div style="width:100px; height:100px; background:#10b981; border-radius:30px; display:flex; align-items:center; justify-content:center; margin:0 auto 30px; box-shadow:0 15px 40px rgba(16,185,129,0.4);">
                                <i class="fas fa-history" style="color:black; font-size:3rem;"></i>
                            </div>
                            <h2 style="font-size: 2.2rem; font-weight: 1000; font-family:'Outfit',sans-serif;">HISTORIAL<br><span style="color:#10b981">Y RÉCORDS</span></h2>
                            <p style="color:rgba(255,255,255,0.7); margin-top:15px; line-height:1.5; font-weight:600; max-width:280px;">
                                Explora el Hall of Fame del club, ganadores históricos y registros de competiciones pasadas.
                            </p>
                            <button onclick="event.stopPropagation(); window.dashNavigate('records', 'records_story')" style="width: 100%; background: #10b981; color: #000; border: none; padding: 12px; border-radius: 12px; font-size: 0.85rem; font-weight: 1000; cursor: pointer; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 30px; box-shadow: 0 5px 15px rgba(16,185,129,0.3);">VER HISTORIAL COMPLETO</button>
                        </div>
                    `;
                    break;
                case 'equipos':
                    contentHtml = `
                        <div style="padding: 40px; text-align:center; color: white; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%;">
                            <div style="width:100px; height:100px; background:#38bdf8; border-radius:30px; display:flex; align-items:center; justify-content:center; margin:0 auto 30px; box-shadow:0 15px 40px rgba(56,189,248,0.4);">
                                <i class="fas fa-users" style="color:black; font-size:3rem;"></i>
                            </div>
                            <h2 style="font-size: 2.2rem; font-weight: 1000; font-family:'Outfit',sans-serif;">EQUIPOS<br><span style="color:#38bdf8">OFICIALES</span></h2>
                            <p style="color:rgba(255,255,255,0.7); margin-top:15px; line-height:1.5; font-weight:600; max-width:280px;">
                                Forma parte de la liga oficial, representa a SomosPadel y compite contra otros clubes de la región.
                            </p>
                            <button onclick="event.stopPropagation(); window.dashNavigate('equipos', 'equipos_story')" style="width: 100%; background: #38bdf8; color: #000; border: none; padding: 12px; border-radius: 12px; font-size: 0.85rem; font-weight: 1000; cursor: pointer; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 30px; box-shadow: 0 5px 15px rgba(56,189,248,0.3);">VER EQUIPOS Y LIGAS</button>
                        </div>
                    `;
                    break;
                case 'matches':
                    const openMatches = allEvents.filter(e => e.status === 'open').slice(0, 2);
                    contentHtml = `
                        <div style="padding: 40px; color: white;">
                            <h2 style="font-size: 2rem; font-weight: 950;">PRÓXIMOS<br><span style="color:#ca8a04">RETOS</span></h2>
                            <p style="color:rgba(255,255,255,0.6); margin-top:10px;">Inscríbete en los eventos oficiales de esta semana.</p>
                            <div style="margin-top:30px; display:flex; flex-direction:column; gap:15px;">
                                ${openMatches.length > 0 ? openMatches.map(m => `
                                    <div style="background:#111; border:1px solid #ca8a04; border-radius:20px; padding:20px;">
                                        <div style="color:#ca8a04; font-weight:900; font-size:0.7rem; text-transform:uppercase;">${m.date} • ${m.time}h</div>
                                        <div style="color:white; font-weight:1000; font-size:1.1rem; text-transform:uppercase;">${m.name}</div>
                                    </div>
                                `).join('') : `
                                    <div style="padding:40px; text-align:center; background:rgba(202,138,4,0.05); border:1px dashed #ca8a04; border-radius:20px;">
                                        <div style="color:white; font-weight:900; font-size:1.1rem;">PRÓXIMAMENTE</div>
                                        <p style="color:rgba(255,255,255,0.4); font-size:0.8rem; margin-top:8px;">Estamos preparando nuevos cuadros de competición.</p>
                                    </div>
                                `}
                            </div>
                        </div>
                    `;
                    break;
                case 'growth':
                    contentHtml = `
                        <div style="padding: 40px; color:white;">
                            <h2 style="font-size: 2.2rem; font-weight: 950;">RETO<br><span style="color:#0ea5e9">SOMOSPADEL BCN</span></h2>
                            <div style="margin-top:40px; height:200px; display:flex; align-items:flex-end; gap:8px;">
                                <div style="flex:1; height:30%; background:#0ea5e930; border-radius:10px;"></div>
                                <div style="flex:1; height:50%; background:#0ea5e950; border-radius:10px;"></div>
                                <div style="flex:1; height:80%; background:#0ea5e9; border-radius:10px; border:2px solid #fff;"></div>
                                <div style="flex:1; height:100%; background:white; border-radius:10px;"></div>
                            </div>
                            <div style="margin-top:20px; font-size:1.4rem; font-weight:900;">OBJETIVO: ${allPlayers.length + 50} JUGADORES</div>
                            <p style="opacity:0.6; font-size:0.8rem;">Proyección mensual estimada según el ritmo de nuevas altas.</p>
                        </div>
                    `;
                    break;
                case 'security':
                    contentHtml = `
                        <div style="padding: 40px; color: white;">
                            <div style="text-align:center; margin-bottom:40px;">
                                <i class="fas fa-shield-check" style="color:#8b5cf6; font-size:5rem;"></i>
                            </div>
                            <h2 style="font-size: 2rem; font-weight: 1000; text-align:center;">PRIVACIDAD<br>TOTAL</h2>
                            <div style="margin-top:30px; background:rgba(255,255,255,0.05); border-radius:20px; padding:20px; border-left:4px solid #8b5cf6;">
                                <div style="color:white; font-weight:900; font-size:0.9rem;">ENCRIPTACIÓN DE DATOS</div>
                                <div style="color:rgba(255,255,255,0.6); font-size:0.75rem; margin-top:8px; line-height:1.4;">Tus resultados y estadísticas están protegidos bajo protocolos de alta seguridad.</div>
                            </div>
                        </div>
                    `;
                    break;
                case 'tournaments':
                    contentHtml = `
                        <div style="padding: 40px; text-align:center; color: white; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%;">
                            <div style="width:100px; height:100px; background:#fb923c; border-radius:30px; display:flex; align-items:center; justify-content:center; margin:0 auto 30px; box-shadow:0 15px 40px rgba(251,146,60,0.4);">
                                <i class="fas fa-award" style="color:black; font-size:3rem;"></i>
                            </div>
                            <h2 style="font-size: 2.2rem; font-weight: 1000; font-family:'Outfit',sans-serif; color:#fb923c;">TORNEOS</h2>
                            <p style="color:rgba(255,255,255,0.7); margin-top:15px; line-height:1.5; font-weight:600; max-width:280px;">
                                Participa en nuestros torneos abiertos de fin de semana, suma puntos de ranking y gana grandes premios.
                            </p>
                            <button onclick="event.stopPropagation(); window.dashNavigate('tournaments', 'tournaments_story')" style="width: 100%; background: #fb923c; color: #000; border: none; padding: 12px; border-radius: 12px; font-size: 0.85rem; font-weight: 1000; cursor: pointer; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 30px; box-shadow: 0 5px 15px rgba(251,146,60,0.3);">VER PRÓXIMOS TORNEOS</button>
                        </div>
                    `;
                    break;
                case 'shop':
                    contentHtml = `
                        <div style="padding: 40px; text-align:center; color: white; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%;">
                            <i class="fas fa-shopping-bag" style="font-size:5rem; color:#6366f1; margin-bottom:20px; filter: drop-shadow(0 0 15px rgba(99,102,241,0.5));"></i>
                            <h2 style="font-size: 2.2rem; font-weight: 950; font-family:'Outfit',sans-serif;">TIENDA<br><span style="color:#6366f1">ONLINE</span></h2>
                            <span style="background: rgba(99,102,241,0.2); color: #818cf8; padding: 4px 14px; border-radius: 50px; font-weight: 950; font-size: 0.65rem; letter-spacing: 1px; margin-top: 15px; text-transform: uppercase;">PRÓXIMAMENTE</span>
                            <p style="color:rgba(255,255,255,0.6); margin-top:20px; font-size:0.9rem; font-weight:700; line-height:1.4; max-width:280px; text-align:center;">
                                Estamos integrando la tienda oficial de SomosPadel directamente en la app. ¡Muy pronto estará disponible con ofertas exclusivas!
                            </p>
                        </div>
                    `;
                    break;
                default:
                    contentHtml = `<div style="padding:40px; color:white; text-align:center;"><h2 style="font-weight:950; font-size:2rem;">SOMOSPADEL<br>LIFE</h2><p style="opacity:0.6; margin-top:20px;">Mantente al día con lo último del club.</p></div>`;
            }

            modal.innerHTML = `
                <!-- SEGMENTED PROGRESS BARS (INSTAGRAM STYLE) -->
                <div class="story-progress-v3" style="display: flex; gap: 4px; padding: 0 10px; position: absolute; top: env(safe-area-inset-top, 20px); width: 100%; box-sizing: border-box; z-index: 2000;">
                    ${this.stories.map((s, i) => `
                        <div class="story-bar-v3" style="flex: 1; height: 2.5px; background: rgba(255,255,255,0.2); border-radius: 10px; overflow: hidden;">
                            <div id="story-fill-${i}" class="story-fill-v3" style="
                                width: 100%; height: 100%; background: #fff; 
                                transform: scaleX(${i < index ? '1' : '0'}); 
                                transform-origin: left;
                                transition: ${i === index ? 'transform 5s linear' : 'none'};
                            "></div>
                        </div>
                    `).join('')}
                </div>
                
                <!-- Close button -->
                <div style="position: absolute; top: env(safe-area-inset-top, 35px); right: 20px; color: white; font-size: 1.8rem; z-index: 2100; cursor: pointer; padding: 10px;" onclick="event.stopPropagation(); window.StoryFeedWidget.hideStory(event)">
                    <i class="fas fa-times-circle" style="filter: drop-shadow(0 2px 10px rgba(0,0,0,0.8));"></i>
                </div>



                <div id="story-content-container" style="
                    flex: 1; 
                    display: flex; 
                    flex-direction: column; 
                    justify-content: flex-start; 
                    background: radial-gradient(circle at center, #181818 0%, #000 100%); 
                    position: relative;
                    z-index: 1000;
                    overflow-y: auto;
                    -webkit-overflow-scrolling: touch;
                    padding: 70px 24px 110px; /* Spacing for bars and footer */
                    box-sizing: border-box;
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                ">
                    <style>
                        #story-content-container::-webkit-scrollbar { display: none; }
                    </style>
                    ${contentHtml}
                </div>

                <!-- Footer with fixed label -->
                <div style="padding: 20px 24px; background: rgba(0,0,0,0.95); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-top: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; gap: 16px; position: absolute; bottom: 0; left: 0; right: 0; z-index: 1800;">
                    <div style="width: 42px; height: 42px; border-radius: 12px; background: ${story.color}; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(0,0,0,0.4);">
                        <i class="fas ${story.icon}" style="color: black; font-size: 1.25rem;"></i>
                    </div>
                    <div style="flex: 1;">
                        <div style="color: white; font-weight: 1000; font-size: 0.85rem; letter-spacing: 0.3px; text-transform: uppercase;">${story.label}</div>
                        <div style="color: rgba(255,255,255,0.4); font-size: 0.6rem; font-weight: 800; letter-spacing: 0.5px;">SOMOSPADEL BCN • CANAL OFICIAL</div>
                    </div>
                </div>
            `;

            modal.style.display = 'flex';
            this.setupNavigationInteractions();

            // Start Fill Animation
            setTimeout(() => {
                const fill = document.getElementById(`story-fill-${index}`);
                if (fill) fill.style.transform = 'scaleX(1)';
            }, 50);

            // AUTO-NEXT TIMER
            this.startStoryTimer(index);
        }

        setupNavigationInteractions() {
            const modal = document.getElementById('story-v3-modal');
            if (!modal) return;

            // Direct border click handling (Left 20%, Right 20%) without blocking central buttons
            modal.onclick = (e) => {
                // If the user clicked on any button, search input, link, close icon, or standard card, do not navigate stories!
                if (e.target.closest('button') || e.target.closest('input') || e.target.closest('a') || e.target.closest('.fa-times-circle') || e.target.closest('.holo-card') || e.target.closest('.story-progress-v3') || e.target.closest('i')) {
                    return;
                }

                const clickX = e.clientX;
                const width = window.innerWidth;
                if (clickX < width * 0.20) {
                    this.prevStory();
                } else if (clickX > width * 0.80) {
                    this.nextStory();
                }
            };

            // Touch Swipe Detection
            let touchStartX = 0;
            let touchStartY = 0;
            let isHolding = false;
            let holdTimer = null;

            modal.ontouchstart = (e) => {
                // Don't intercept touches on interactive elements (buttons, links)
                if (e.target.closest('button') || e.target.closest('a') || e.target.closest('input')) return;
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;

                // Pause on hold
                holdTimer = setTimeout(() => {
                    isHolding = true;
                    this.pauseStory();
                }, 150);
            };

            modal.ontouchend = (e) => {
                // Don't intercept touches on interactive elements (buttons, links)
                if (e.target.closest('button') || e.target.closest('a') || e.target.closest('input')) {
                    clearTimeout(holdTimer);
                    return;
                }
                clearTimeout(holdTimer);
                if (isHolding) {
                    isHolding = false;
                    this.resumeStory();
                    return;
                }

                const touchEndX = e.changedTouches[0].clientX;
                const touchEndY = e.changedTouches[0].clientY;
                const diffX = touchEndX - touchStartX;
                const diffY = touchEndY - touchStartY;

                // Horizontal Swipe (Instagram style)
                if (Math.abs(diffX) > 50 && Math.abs(diffY) < 100) {
                    if (diffX < 0) this.nextStory();
                    else this.prevStory();
                }
                // Close on swipe down
                else if (diffY > 100 && Math.abs(diffX) < 100) {
                    this.hideStory();
                }
            };

            // Long press for Desktop (testing)
            modal.onmousedown = () => {
                holdTimer = setTimeout(() => {
                    isHolding = true;
                    this.pauseStory();
                }, 150);
            };
            modal.onmouseup = () => {
                clearTimeout(holdTimer);
                if (isHolding) {
                    isHolding = false;
                    this.resumeStory();
                }
            };
        }

        pauseStory() {
            console.log("⏸ Story Paused");
            if (this.storyTimer) clearTimeout(this.storyTimer);
            const currentFill = document.getElementById(`story-fill-${this.currentStoryIndex}`);
            if (currentFill) {
                const computedStyle = window.getComputedStyle(currentFill);
                const transform = computedStyle.getPropertyValue('transform');
                currentFill.style.transition = 'none';
                currentFill.style.transform = transform;
            }
        }

        resumeStory() {
            console.log("▶ Story Resumed");
            const index = this.currentStoryIndex;
            const currentFill = document.getElementById(`story-fill-${index}`);
            if (currentFill) {
                const computedStyle = window.getComputedStyle(currentFill);
                const transform = computedStyle.getPropertyValue('transform');
                const matrix = new WebKitCSSMatrix(transform);
                const currentScale = matrix.m11; // Extract scaleX

                const remainingProgress = 1 - currentScale;
                const remainingTime = remainingProgress * 5000;

                currentFill.style.transition = `transform ${remainingTime}ms linear`;
                currentFill.style.transform = 'scaleX(1)';

                if (this.storyTimer) clearTimeout(this.storyTimer);
                this.storyTimer = setTimeout(() => {
                    this.nextStory();
                }, remainingTime);
            }
        }

        nextStory() {
            const nextIndex = this.currentStoryIndex + 1;
            if (nextIndex < this.stories.length) {
                this.showStory(this.stories[nextIndex].id);
            } else {
                this.hideStory();
            }
        }

        prevStory() {
            const prevIndex = this.currentStoryIndex - 1;
            if (prevIndex >= 0) {
                this.showStory(this.stories[prevIndex].id);
            } else {
                // Restart current if it's the first
                this.showStory(this.stories[0].id);
            }
        }

        startStoryTimer(index) {
            if (this.storyTimer) clearTimeout(this.storyTimer);
            this.storyTimer = setTimeout(() => {
                if (index < this.stories.length - 1) {
                    this.showStory(this.stories[index + 1].id);
                } else {
                    this.hideStory();
                }
            }, 5050);
        }

        onRankingSearch(query) {
            const resultsContainer = document.getElementById('ranking-search-results');
            const topList = document.getElementById('ranking-top-list');
            const defaultHeader = document.getElementById('ranking-default-view');

            if (!resultsContainer || !topList || !this.currentRankingData) return;

            if (query.length < 2) {
                resultsContainer.style.display = 'none';
                topList.style.display = 'flex';
                if (defaultHeader) defaultHeader.style.display = 'block';
                return;
            }

            // Perform search
            const lowerQ = query.toLowerCase();
            const matches = this.currentRankingData
                .map((p, index) => ({ ...p, originalRank: index + 1 }))
                .filter(p => (p.name || '').toLowerCase().includes(lowerQ));

            topList.style.display = 'none';
            if (defaultHeader) defaultHeader.style.display = 'none';
            resultsContainer.style.display = 'flex';

            if (matches.length === 0) {
                resultsContainer.innerHTML = '<div style="text-align:center; opacity:0.6; padding:20px;">No se encontraron jugadores</div>';
            } else {
                resultsContainer.innerHTML = matches.slice(0, 10).map(p => `
                    <div style="display:flex; align-items:center; gap:15px; background:rgba(255,255,255,0.05); padding:12px; border-radius:12px; border:1px solid rgba(255,255,255,0.1); animation: fadeIn 0.3s ease-out;">
                        <div style="font-size:1rem; font-weight:900; color:#fb7185; width:40px;">#${p.originalRank}</div>
                        <div style="flex:1; font-weight:700; font-size:0.9rem; text-transform:uppercase;">${p.name}</div>
                        <div style="font-weight:900; color:white; font-size:0.8rem;">${Math.round((p.stats?.americanas?.points || 0) + (p.stats?.entrenos?.points || 0))} PTS</div>
                    </div>
                `).join('');
            }
        }

        hideStory(e) {
            if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
            if (this.storyTimer) clearTimeout(this.storyTimer);
            const modal = document.getElementById('story-v3-modal');
            if (modal) modal.style.display = 'none';
        }
    }

    window.dashNavigate = function(dest, source) {
        console.log(`🧭 [Navigation] dashNavigate to: ${dest} from ${source}`);
        if (window.StoryFeedWidget) {
            window.StoryFeedWidget.hideStory();
        }
        
        if (dest.startsWith('http://') || dest.startsWith('https://')) {
            window.open(dest, '_blank');
        } else {
            if (window.Router && window.Router.navigate) {
                window.Router.navigate(dest);
            } else {
                console.error("Router not found!");
            }
        }
    };

    window.StoryFeedWidget = new StoryFeedWidget();
    console.log('✅ Story Feed V3 Loaded');
})();
