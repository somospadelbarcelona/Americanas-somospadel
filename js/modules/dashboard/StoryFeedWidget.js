/**
 * StoryFeedWidget.js - V3 (Professional & Premium Edition)
 * 📱 Real-Time Data Stories Engine
 * Arquitectura de alto rendimiento para visualización de Big Data.
 * Rediseñado con estética de esferas 3D de clase mundial y optimización móvil premium.
 */
(function () {
    'use strict';

    class StoryFeedWidget {
        constructor() {
            this.containerId = 'story-feed-root';
            this.currentStoryIndex = 0;
            this.storyTimeout = null;
            this.storyDuration = 5000; // 5 segundos por historia
            this.timerStart = 0;
            this.timerRemaining = 5000;
            this.currentRankingData = [];

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
                /* Story Bar Layout with Premium Fade Edge Indication */
                .story-feed-v3-wrapper {
                    position: relative;
                    padding: 0;
                    user-select: none;
                    width: 100%;
                    overflow: visible;
                    background: transparent;
                }
                .story-feed-v3-wrapper::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    right: 0;
                    height: calc(100% - 10px);
                    width: 40px;
                    background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.98));
                    pointer-events: none;
                    z-index: 10;
                }
                
                .story-h-scroll {
                    display: flex !important;
                    flex-direction: row !important;
                    justify-content: flex-start;
                    align-items: center;
                    gap: 12px;
                    padding: 6px 16px 10px;
                    overflow-x: auto !important;
                    overflow-y: visible !important;
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                    -webkit-overflow-scrolling: touch;
                    width: 100%;
                    box-sizing: border-box;
                    scroll-snap-type: x mandatory;
                }
                .story-h-scroll::-webkit-scrollbar { display: none; }
                
                @media (max-width: 600px) {
                    .story-h-scroll {
                        gap: 8px;
                        padding: 4px 12px 8px;
                    }
                }
                
                @media (min-width: 768px) {
                    .story-h-scroll {
                        justify-content: center;
                    }
                    .story-feed-v3-wrapper::after {
                        display: none;
                    }
                }
                
                /* Story Bubble Base */
                .story-v3-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 5px;
                    cursor: pointer;
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    scroll-snap-align: start;
                    flex-shrink: 0 !important;
                    min-width: 66px !important;
                }
                @media (max-width: 600px) {
                    .story-v3-item {
                        min-width: 58px !important;
                        gap: 3px;
                    }
                }
                
                .story-v3-item:hover { 
                    transform: translateY(-2px) scale(1.03); 
                }

                @keyframes pulseDot {
                    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 45, 85, 0.8); }
                    70% { transform: scale(1.2); box-shadow: 0 0 0 6px rgba(255, 45, 85, 0); }
                    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 45, 85, 0); }
                }

                /* Sphere 3D Outer & Inner Glow Engine */
                .story-v3-outer {
                    width: 54px;
                    height: 54px;
                    border-radius: 50%;
                    padding: 2.5px;
                    position: relative;
                    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
                    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
                }
                @media (max-width: 600px) {
                    .story-v3-outer {
                        width: 48px;
                        height: 48px;
                        padding: 2px;
                    }
                }
                
                /* Interactive ambient glow */
                .story-v3-item:hover .story-v3-outer {
                    transform: rotate(15deg);
                }
                
                .story-v3-inner {
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    background: radial-gradient(circle at 35% 35%, #232d3f 0%, #0f172a 75%, #020617 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px solid rgba(255,255,255,0.06);
                    overflow: hidden;
                    position: relative;
                    box-shadow: inset 0 2px 4px rgba(255,255,255,0.15), inset 0 -2px 4px rgba(0,0,0,0.6);
                }
                
                /* Specular Glare Layer for 3D realism */
                .story-v3-inner::after {
                    content: '';
                    position: absolute;
                    top: 5%;
                    left: 15%;
                    width: 40%;
                    height: 25%;
                    border-radius: 50%;
                    background: linear-gradient(to bottom, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 100%);
                    filter: blur(0.5px);
                    transform: rotate(-15deg);
                    pointer-events: none;
                }
                
                .story-v3-inner i {
                    font-size: 1.15rem;
                    transition: all 0.25s ease;
                }
                @media (max-width: 600px) {
                    .story-v3-inner i {
                        font-size: 1rem;
                    }
                }
                
                .story-v3-item:hover .story-v3-inner i {
                    transform: scale(1.15);
                }
                
                /* Precise Typography styling */
                .story-v3-label {
                    font-size: 0.6rem;
                    font-weight: 900; 
                    color: #0f172a !important; 
                    letter-spacing: 0.3px;
                    text-transform: uppercase;
                    white-space: nowrap;
                    margin-top: 4px;
                    text-align: center;
                    font-family: 'Outfit', sans-serif;
                    
                    /* Sharp anti-aliasing */
                    transform: translateZ(0); 
                    backface-visibility: hidden;
                    -webkit-font-smoothing: antialiased;
                    -moz-osx-font-smoothing: grayscale;
                    text-rendering: optimizeLegibility;
                }
                @media (max-width: 600px) {
                    .story-v3-label {
                        font-size: 0.55rem;
                        margin-top: 3px;
                    }
                }

                /* Stories Fullscreen Modal */
                .story-v3-modal {
                    position: fixed;
                    inset: 0;
                    background: #000;
                    z-index: 9999999;
                    display: none;
                    flex-direction: column;
                    overflow: hidden;
                    animation: storyEnter 0.35s both cubic-bezier(0.19, 1, 0.22, 1);
                }
                @keyframes storyEnter {
                    from { transform: scale(0.9) translateY(40px); opacity: 0; }
                    to { transform: scale(1) translateY(0); opacity: 1; }
                }
                @keyframes storyExit {
                    from { transform: scale(1) translateY(0); opacity: 1; }
                    to { transform: scale(0.9) translateY(40px); opacity: 0; }
                }

                .story-progress-v3 {
                    position: absolute;
                    top: env(safe-area-inset-top, 20px);
                    left: 12px;
                    right: 12px;
                    height: 3px;
                    display: flex;
                    gap: 5px;
                    z-index: 1002;
                }
                .story-bar-v3 {
                    flex: 1;
                    background: rgba(255,255,255,0.22);
                    border-radius: 10px;
                    height: 100%;
                    overflow: hidden;
                }
                .story-fill-v3 {
                    width: 100%;
                    height: 100%;
                    background: #fff;
                    transform-origin: left;
                    transform: scaleX(0);
                }
                
                @keyframes enterStoryCard {
                    from { opacity: 0; transform: translateY(15px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `;
            document.head.appendChild(style);
        }

        updateUI() {
            const container = document.getElementById(this.containerId);
            if (!container) return;

            container.innerHTML = `
                <div class="story-feed-v3-wrapper">
                    <!-- FLEX LAYOUT FOR MOBILE (SWIPEABLE ROW WITH SNAP EFFECT) -->
                    <div class="story-h-scroll">
                        <!-- STORY ITEMS -->
                        ${this.stories.map(story => {
                            let baseColor = story.color || '#38bdf8';
                            let ringBg = `linear-gradient(135deg, ${baseColor} 0%, rgba(15,23,42,0.8) 100%)`;
                            let outerShadow = `0 4px 12px rgba(15,23,42,0.15), 0 0 10px ${baseColor}25`;

                            if (story.id === 'noticias') {
                                ringBg = 'linear-gradient(135deg, #00E36D 0%, #00b050 100%)';
                                outerShadow = '0 4px 15px rgba(0,227,109,0.2), 0 0 15px rgba(0,227,109,0.45)';
                            } else if (story.id === 'ranking') {
                                ringBg = 'linear-gradient(135deg, #fb7185 0%, #e11d48 100%)';
                                outerShadow = '0 4px 15px rgba(251,113,133,0.2), 0 0 15px rgba(251,113,133,0.45)';
                            } else if (story.id === 'equipos') {
                                ringBg = 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)';
                                outerShadow = '0 4px 15px rgba(56,189,248,0.2), 0 0 15px rgba(56,189,248,0.45)';
                            } else if (story.id === 'shop') {
                                ringBg = 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)';
                                outerShadow = '0 4px 15px rgba(99,102,241,0.2), 0 0 15px rgba(99,102,241,0.45)';
                            } else if (story.id === 'tournaments') {
                                ringBg = 'linear-gradient(135deg, #fb923c 0%, #ea580c 100%)';
                                outerShadow = '0 4px 15px rgba(251,146,60,0.2), 0 0 15px rgba(251,146,60,0.45)';
                            } else if (story.id === 'records') {
                                ringBg = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                                outerShadow = '0 4px 15px rgba(16,185,129,0.2), 0 0 15px rgba(16,185,129,0.45)';
                            } else if (story.isEvent) {
                                ringBg = `linear-gradient(135deg, ${baseColor} 0%, rgba(15,23,42,0.8) 100%)`;
                                outerShadow = `0 4px 15px rgba(15,23,42,0.15), 0 0 12px ${baseColor}35`;
                            }

                            // Dynamic label display (Concise text only)
                            const displayLabel = story.label.split(' ')[0];

                            return `
                                <div class="story-v3-item" onclick="window.StoryFeedWidget.showStory('${story.id}')">
                                    <div class="story-v3-outer" style="background: ${ringBg}; box-shadow: ${outerShadow};">
                                        <div class="story-v3-inner">
                                            <i class="fas ${story.icon}" style="color: ${baseColor}; filter: drop-shadow(0 0 4px ${baseColor}80);"></i>
                                        </div>
                                        ${story.id === 'noticias' ? `<div style="position: absolute; top: -2px; right: -2px; width: 11px; height: 11px; background: #FF2D55; border-radius: 50%; border: 2.2px solid #0f172a; animation: pulseDot 1.4s infinite;"></div>` : ''}
                                    </div>
                                    <span class="story-v3-label">${displayLabel}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
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
                                </button>
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
                case 'shop':
                    contentHtml = `
                        <div style="padding: 40px; text-align:center; color: white; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%;">
                            <div style="width:100px; height:100px; background:#6366f1; border-radius:30px; display:flex; align-items:center; justify-content:center; margin:0 auto 30px; box-shadow:0 15px 40px rgba(99,102,241,0.4);">
                                <i class="fas fa-shopping-bag" style="color:black; font-size:3rem;"></i>
                            </div>
                            <h2 style="font-size: 2.2rem; font-weight: 1000; font-family:'Outfit',sans-serif; color:#6366f1;">TIENDA VIP</h2>
                            <p style="color:rgba(255,255,255,0.7); margin-top:15px; line-height:1.5; font-weight:600; max-width:280px;">
                                Muy pronto estará disponible la tienda oficial online de SomosPadel. Ropa técnica, palas y accesorios exclusivos del club.
                            </p>
                        </div>
                    `;
                    break;
                case 'records':
                    contentHtml = `
                        <div style="padding: 40px; text-align:center; color: white; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%;">
                            <div style="width:100px; height:100px; background:#10b981; border-radius:30px; display:flex; align-items:center; justify-content:center; margin:0 auto 30px; box-shadow:0 15px 40px rgba(16,185,129,0.4);">
                                <i class="fas fa-history" style="color:black; font-size:3rem;"></i>
                            </div>
                            <h2 style="font-size: 2.2rem; font-weight: 1000; font-family:'Outfit',sans-serif; color:#10b981;">RÉCORDS</h2>
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
                            <h2 style="font-size: 2.2rem; font-weight: 1000; font-family:'Outfit',sans-serif; color:#38bdf8;">EQUIPOS</h2>
                            <p style="color:rgba(255,255,255,0.7); margin-top:15px; line-height:1.5; font-weight:600; max-width:280px;">
                                Forma parte de la liga oficial, representa a SomosPadel y compite contra otros clubes de la región.
                            </p>
                            <button onclick="event.stopPropagation(); window.dashNavigate('equipos', 'equipos_story')" style="width: 100%; background: #38bdf8; color: #000; border: none; padding: 12px; border-radius: 12px; font-size: 0.85rem; font-weight: 1000; cursor: pointer; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 30px; box-shadow: 0 5px 15px rgba(56,189,248,0.3);">VER EQUIPOS Y LIGAS</button>
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
            }

            modal.innerHTML = `
                <div class="story-progress-v3">
                    ${this.stories.map((s, i) => `
                        <div class="story-bar-v3">
                            <div id="story-fill-${i}" class="story-fill-v3" style="transform: scaleX(${i < index ? 1 : 0})"></div>
                        </div>
                    `).join('')}
                </div>

                <!-- TOP BAR INTERACTION -->
                <div style="position: absolute; top: env(safe-area-inset-top, 20px); left: 0; right: 0; padding: 15px; display: flex; align-items: center; justify-content: space-between; z-index: 1001; background: linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 100%);">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 32px; height: 32px; border-radius: 50%; background: ${story.color}; display: flex; align-items: center; justify-content: center; border: 1.5px solid white; box-shadow: 0 0 10px ${story.color}80;">
                            <i class="fas ${story.icon}" style="color: black; font-size: 0.95rem;"></i>
                        </div>
                        <span style="font-weight: 900; font-size: 0.85rem; text-transform: uppercase; color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.6); font-family: 'Outfit', sans-serif;">${story.label}</span>
                    </div>
                    <button onclick="window.StoryFeedWidget.hideStory(event)" style="background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer; text-shadow: 0 2px 4px rgba(0,0,0,0.6); padding: 5px; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 50%; background: rgba(255,255,255,0.08); backdrop-filter: blur(5px);">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <!-- MAIN CARD CONTENT AREA -->
                <div style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 20px; z-index: 1000; position: relative;">
                    ${contentHtml}
                </div>

                <!-- INTERACTION GESTURES (LEFT/RIGHT TAP AREAS) -->
                <div style="position: absolute; inset: 0; display: flex; z-index: 999;">
                    <div id="story-v3-prev-zone" style="flex: 1; cursor: w-resize;"></div>
                    <div id="story-v3-next-zone" style="flex: 2; cursor: e-resize;"></div>
                </div>
            `;

            modal.style.display = 'flex';

            // ATTACH REAL-TIME INTERACTION GESTURES
            const prevZone = document.getElementById('story-v3-prev-zone');
            const nextZone = document.getElementById('story-v3-next-zone');

            let isHolding = false;
            let holdTimer = null;

            const onHoldStart = (e) => {
                e.preventDefault();
                holdTimer = setTimeout(() => {
                    isHolding = true;
                    this.pauseStory();
                }, 200);
            };

            const onHoldEnd = (e, callback) => {
                e.preventDefault();
                if (holdTimer) clearTimeout(holdTimer);
                if (isHolding) {
                    isHolding = false;
                    this.resumeStory();
                } else {
                    callback();
                }
            };

            if (prevZone && nextZone) {
                // Mobile Touch Events
                prevZone.addEventListener('touchstart', onHoldStart, { passive: false });
                prevZone.addEventListener('touchend', (e) => onHoldEnd(e, () => this.prevStory()), { passive: false });

                nextZone.addEventListener('touchstart', onHoldStart, { passive: false });
                nextZone.addEventListener('touchend', (e) => onHoldEnd(e, () => this.nextStory()), { passive: false });

                // Desktop Mouse Events
                prevZone.addEventListener('mousedown', onHoldStart);
                prevZone.addEventListener('mouseup', (e) => onHoldEnd(e, () => this.prevStory()));

                nextZone.addEventListener('mousedown', onHoldStart);
                nextZone.addEventListener('mouseup', (e) => onHoldEnd(e, () => this.nextStory()));
            }

            // TRIGGER FILL TRANSITION & TIMER
            setTimeout(() => {
                const fill = document.getElementById(`story-fill-${index}`);
                if (fill) {
                    this.startStoryTimer(index);
                }
            }, 50);
        }

        startStoryTimer(index) {
            if (this.storyTimeout) clearTimeout(this.storyTimeout);
            this.timerStart = Date.now();
            this.timerRemaining = this.storyDuration;
            this.animateProgress(index, this.timerRemaining);
        }

        animateProgress(index, duration) {
            const fill = document.getElementById(`story-fill-${index}`);
            if (!fill) return;

            fill.style.transition = `transform ${duration}ms linear`;
            fill.style.transform = 'scaleX(1)';

            this.storyTimeout = setTimeout(() => {
                this.nextStory();
            }, duration);
        }

        pauseStory() {
            if (this.storyTimeout) {
                clearTimeout(this.storyTimeout);
                this.storyTimeout = null;
            }

            const index = this.currentStoryIndex;
            const fill = document.getElementById(`story-fill-${index}`);
            if (fill) {
                const computedStyle = window.getComputedStyle(fill);
                const transform = computedStyle.transform;
                let scaleX = 0;
                if (transform && transform !== 'none') {
                    const values = transform.split('(')[1].split(')')[0].split(',');
                    scaleX = parseFloat(values[0]) || 0;
                }

                fill.style.transition = 'none';
                fill.style.transform = `scaleX(${scaleX})`;

                const elapsed = Date.now() - this.timerStart;
                this.timerRemaining = Math.max(0, this.timerRemaining - elapsed);
            }
        }

        resumeStory() {
            if (this.storyTimeout) return;
            this.timerStart = Date.now();
            this.animateProgress(this.currentStoryIndex, this.timerRemaining);
        }

        prevStory() {
            if (this.storyTimeout) clearTimeout(this.storyTimeout);

            const prevIndex = this.currentStoryIndex - 1;
            if (prevIndex >= 0) {
                const currentFill = document.getElementById(`story-fill-${this.currentStoryIndex}`);
                if (currentFill) {
                    currentFill.style.transition = 'none';
                    currentFill.style.transform = 'scaleX(0)';
                }

                const prevFill = document.getElementById(`story-fill-${prevIndex}`);
                if (prevFill) {
                    prevFill.style.transition = 'none';
                    prevFill.style.transform = 'scaleX(0)';
                }

                this.showStory(this.stories[prevIndex].id);
            } else {
                const currentFill = document.getElementById(`story-fill-${this.currentStoryIndex}`);
                if (currentFill) {
                    currentFill.style.transition = 'none';
                    currentFill.style.transform = 'scaleX(0)';
                }
                this.showStory(this.stories[0].id);
            }
        }

        nextStory() {
            if (this.storyTimeout) clearTimeout(this.storyTimeout);

            const nextIndex = this.currentStoryIndex + 1;
            if (nextIndex < this.stories.length) {
                const currentFill = document.getElementById(`story-fill-${this.currentStoryIndex}`);
                if (currentFill) {
                    currentFill.style.transition = 'none';
                    currentFill.style.transform = 'scaleX(1)';
                }
                this.showStory(this.stories[nextIndex].id);
            } else {
                this.hideStory();
            }
        }

        hideStory(event) {
            if (event) event.stopPropagation();
            if (this.storyTimeout) clearTimeout(this.storyTimeout);

            const modal = document.getElementById('story-v3-modal');
            if (modal) {
                modal.style.animation = 'storyExit 0.3s both cubic-bezier(0.19, 1, 0.22, 1)';
                setTimeout(() => {
                    modal.style.display = 'none';
                    modal.innerHTML = '';
                }, 300);
            }
        }

        onRankingSearch(query) {
            const normalizedQuery = query.toLowerCase().trim();
            const list = document.getElementById('ranking-top-list');
            const searchResults = document.getElementById('ranking-search-results');

            if (!normalizedQuery) {
                if (list) list.style.display = 'flex';
                if (searchResults) {
                    searchResults.style.display = 'none';
                    searchResults.innerHTML = '';
                }
                this.resumeStory();
                return;
            }

            this.pauseStory();
            if (list) list.style.display = 'none';
            if (searchResults && this.currentRankingData) {
                const filtered = this.currentRankingData.filter(p => (p.name || '').toLowerCase().includes(normalizedQuery));

                if (filtered.length > 0) {
                    searchResults.innerHTML = filtered.slice(0, 10).map((p, i) => `
                        <div style="display:flex; align-items:center; gap:15px; background:rgba(251,113,133,0.1); padding:12px 15px; border-radius:15px; border:1px solid rgba(251,113,133,0.2);">
                            <div style="font-weight:800; font-size:0.9rem; text-transform:uppercase; flex:1;">${p.name || 'Pro Player'}</div>
                            <div style="font-weight:900; color:#fb7185; font-size:0.9rem;">${Math.round((p.stats?.americanas?.points || 0) + (p.stats?.entrenos?.points || 0))} PTS</div>
                        </div>
                    `).join('');
                } else {
                    searchResults.innerHTML = `<p style="color:rgba(255,255,255,0.4); text-align:center; font-size:0.8rem; padding:15px;">Ningún jugador coincide.</p>`;
                }
                searchResults.style.display = 'flex';
            }
        }
    }

    window.StoryFeedWidget = new StoryFeedWidget();
    console.log('🎯 StoryFeedWidget Component Loaded and Instantiated');
})();
