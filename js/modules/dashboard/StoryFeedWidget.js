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
                { id: 'noticias', label: 'Noticias 📰', icon: 'fa-bullhorn', color: '#10b981' },
                { id: 'ranking', label: 'Ranking 🏆', icon: 'fa-trophy', color: '#f43f5e' },
                { id: 'equipos', label: 'Equipos 👥', icon: 'fa-users', color: '#0ea5e9' },
                { id: 'shop', label: 'Tienda 🛍️', icon: 'fa-shopping-bag', color: '#8b5cf6' },
                { id: 'tournaments', label: 'Torneos 🏆', icon: 'fa-award', color: '#f59e0b' },
                { id: 'records', label: 'Récords 📊', icon: 'fa-history', color: '#0d9488' }
            ];
        }

        async loadDynamicStories() {
            // Start with base stories
            const dynamicStories = [
                { id: 'noticias', label: 'Noticias 📰', icon: 'fa-bullhorn', color: '#10b981' },
                { id: 'ranking', label: 'Ranking 🏆', icon: 'fa-trophy', color: '#f43f5e' }
            ];

            // 1. Fetch Active Events dynamically from the database
            try {
                if (window.AmericanaService) {
                    const events = await window.AmericanaService.getAllActiveEvents();
                    const openEvents = events.filter(e => ['open', 'upcoming', 'scheduled', 'live'].includes(e.status));
                    
                    // Add up to 3 active events as custom story bubbles!
                    openEvents.slice(0, 3).forEach(event => {
                        let color = '#0ea5e9'; // Blue for male/default
                        const nameLower = (event.name || '').toLowerCase();
                        if (nameLower.includes('fem') || nameLower.includes('chicas')) color = '#ec4899'; // Pink
                        else if (nameLower.includes('mix')) color = '#f59e0b'; // Amber
                        else if (event.type === 'entreno') color = '#84cc16'; // Lime green

                        // Extract a concise single-word label for the Instagram bubble
                        let rawPart = (event.name || '').split(' ')[0] || 'Evento';
                        if (rawPart.length > 9) rawPart = rawPart.substring(0, 8) + '…';
                        const label = rawPart.charAt(0).toUpperCase() + rawPart.slice(1).toLowerCase();

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
                { id: 'equipos', label: 'Equipos 👥', icon: 'fa-users', color: '#0ea5e9' },
                { id: 'shop', label: 'Tienda 🛍️', icon: 'fa-shopping-bag', color: '#8b5cf6' },
                { id: 'tournaments', label: 'Torneos 🏆', icon: 'fa-award', color: '#f59e0b' },
                { id: 'records', label: 'Récords 📊', icon: 'fa-history', color: '#0d9488' }
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
                    padding: 2px 0 0;
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
                    width: 36px;
                    background: linear-gradient(to right, transparent, var(--bg-app, #f8fafc));
                    pointer-events: none;
                    z-index: 10;
                }
                
                .story-h-scroll {
                    display: flex !important;
                    flex-direction: row !important;
                    justify-content: flex-start;
                    align-items: flex-start;
                    gap: 14px;
                    padding: 6px 16px 8px;
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
                        gap: 10px;
                        padding: 4px 14px 6px;
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
                    gap: 6px;
                    cursor: pointer;
                    transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
                    scroll-snap-align: start;
                    flex-shrink: 0 !important;
                    min-width: 72px !important;
                    -webkit-tap-highlight-color: transparent;
                }
                @media (max-width: 600px) {
                    .story-v3-item {
                        min-width: 68px !important;
                        gap: 5px;
                    }
                }
                
                .story-v3-item:hover { 
                    transform: translateY(-2px); 
                }
                .story-v3-item:active {
                    transform: scale(0.93);
                }

                @keyframes pulseDot {
                    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
                    70% { transform: scale(1.15); box-shadow: 0 0 0 5px rgba(239, 68, 68, 0); }
                    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }

                /* Modern Story Ring (Instagram / App Stories Style) */
                .story-v3-outer {
                    width: 64px;
                    height: 64px;
                    border-radius: 50%;
                    padding: 2.5px;
                    position: relative;
                    transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.22s ease;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
                    box-sizing: border-box;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                @media (max-width: 600px) {
                    .story-v3-outer {
                        width: 62px;
                        height: 62px;
                        padding: 2.5px;
                    }
                }
                
                .story-v3-item:hover .story-v3-outer {
                    transform: scale(1.05);
                    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
                }
                
                /* Crisp White Separation + Luminous Light Core */
                .story-v3-inner {
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    background: #ffffff;
                    border: 2px solid #ffffff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                    position: relative;
                    box-sizing: border-box;
                    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.03);
                }
                
                .story-v3-inner i {
                    font-size: 1.35rem;
                    transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                @media (max-width: 600px) {
                    .story-v3-inner i {
                        font-size: 1.3rem;
                    }
                }
                
                .story-v3-item:hover .story-v3-inner i {
                    transform: scale(1.15);
                }
                
                /* Refined Typography */
                .story-v3-label {
                    font-size: 0.74rem;
                    font-weight: 800; 
                    color: #475569 !important; 
                    letter-spacing: -0.1px;
                    white-space: nowrap;
                    margin-top: 2px;
                    text-align: center;
                    font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    transition: color 0.2s ease;
                    
                    /* Sharp anti-aliasing */
                    transform: translateZ(0); 
                    backface-visibility: hidden;
                    -webkit-font-smoothing: antialiased;
                    -moz-osx-font-smoothing: grayscale;
                    text-rendering: optimizeLegibility;
                }
                @media (max-width: 600px) {
                    .story-v3-label {
                        font-size: 0.72rem;
                        margin-top: 2px;
                    }
                }
                .story-v3-item:hover .story-v3-label {
                    color: #0f172a !important;
                }

                /* Stories Fullscreen Modal */
                .story-v3-modal {
                    position: fixed;
                    inset: 0;
                    background: radial-gradient(circle at 50% 15%, #1e293b 0%, #0f172a 60%, #020617 100%);
                    z-index: 9999999;
                    display: none;
                    flex-direction: column;
                    overflow-x: hidden;
                    overflow-y: auto;
                    -webkit-overflow-scrolling: touch;
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
                            let baseColor = story.color || '#0ea5e9';
                            let ringBg = `linear-gradient(135deg, ${baseColor} 0%, #334155 100%)`;
                            let innerBg = `radial-gradient(circle at 50% 35%, #ffffff 40%, ${baseColor}15 100%)`;

                            if (story.id === 'noticias') {
                                baseColor = '#10b981';
                                ringBg = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                                innerBg = 'radial-gradient(circle at 50% 35%, #ffffff 35%, rgba(16, 185, 129, 0.12) 100%)';
                            } else if (story.id === 'ranking') {
                                baseColor = '#f43f5e';
                                ringBg = 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)';
                                innerBg = 'radial-gradient(circle at 50% 35%, #ffffff 35%, rgba(244, 63, 94, 0.12) 100%)';
                            } else if (story.id === 'equipos') {
                                baseColor = '#0ea5e9';
                                ringBg = 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)';
                                innerBg = 'radial-gradient(circle at 50% 35%, #ffffff 35%, rgba(14, 165, 233, 0.12) 100%)';
                            } else if (story.id === 'shop') {
                                baseColor = '#8b5cf6';
                                ringBg = 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)';
                                innerBg = 'radial-gradient(circle at 50% 35%, #ffffff 35%, rgba(139, 92, 246, 0.12) 100%)';
                            } else if (story.id === 'tournaments') {
                                baseColor = '#f59e0b';
                                ringBg = 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)';
                                innerBg = 'radial-gradient(circle at 50% 35%, #ffffff 35%, rgba(245, 158, 11, 0.12) 100%)';
                            } else if (story.id === 'records') {
                                baseColor = '#0d9488';
                                ringBg = 'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)';
                                innerBg = 'radial-gradient(circle at 50% 35%, #ffffff 35%, rgba(13, 148, 136, 0.12) 100%)';
                            } else if (story.isEvent) {
                                ringBg = `linear-gradient(135deg, ${baseColor} 0%, #475569 100%)`;
                                innerBg = `radial-gradient(circle at 50% 35%, #ffffff 35%, ${baseColor}15 100%)`;
                            }

                            // Dynamic label display (Formatted with clean Capitalization)
                            const rawLabel = (story.label || '').split(' ')[0] || '';
                            const displayLabel = rawLabel ? (rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1).toLowerCase()) : '';

                            return `
                                <div class="story-v3-item" role="button" tabindex="0" onclick="window.StoryFeedWidget.showStory('${story.id}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();window.StoryFeedWidget.showStory('${story.id}');}" title="${displayLabel}">
                                    <div class="story-v3-outer" style="background: ${ringBg};">
                                        <div class="story-v3-inner" style="background: ${innerBg};">
                                            <i class="fas ${story.icon}" style="color: ${baseColor};"></i>
                                        </div>
                                        ${story.id === 'noticias' ? `<div style="position: absolute; top: 0px; right: 0px; width: 12px; height: 12px; background: #ef4444; border-radius: 50%; border: 2.2px solid #ffffff; box-shadow: 0 2px 6px rgba(239, 68, 68, 0.45); animation: pulseDot 1.6s infinite;"></div>` : ''}
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
            try {
                if (navigator.vibrate) navigator.vibrate(10);
            } catch (_) {}

            // Cancel any pending hide or story timeouts immediately
            if (this.hideTimeout) {
                clearTimeout(this.hideTimeout);
                this.hideTimeout = null;
            }
            if (this.storyTimeout) {
                clearTimeout(this.storyTimeout);
                this.storyTimeout = null;
            }

            let modal = document.getElementById('story-v3-modal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'story-v3-modal';
                modal.className = 'story-v3-modal';
                document.body.appendChild(modal);
            }

            // Instant display and entrance animation reset
            modal.style.pointerEvents = 'auto';
            modal.style.animation = 'storyEnter 0.35s both cubic-bezier(0.19, 1, 0.22, 1)';
            modal.style.display = 'flex';

            const index = this.stories.findIndex(s => s.id === id);
            if (index === -1) return;

            this.currentStoryIndex = index;
            const story = this.stories[index];
            let contentHtml = '';

            // Setup ESC key listener once
            if (!this._keyListenerAttached) {
                window.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') {
                        const m = document.getElementById('story-v3-modal');
                        if (m && m.style.display === 'flex') this.hideStory();
                    }
                });
                this._keyListenerAttached = true;
            }

            // FAST ON-DEMAND DATA FETCHING (Only fetch what's needed for the active story)
            let topRanked = [];
            if (id === 'ranking') {
                if (this.currentRankingData && this.currentRankingData.length > 0) {
                    topRanked = this.currentRankingData;
                } else {
                    try {
                        if (window.RankingController) {
                            topRanked = await Promise.race([
                                window.RankingController.calculateSilently(),
                                new Promise(res => setTimeout(() => res([]), 800))
                            ]);
                        }
                    } catch (e) { console.warn("Story ranking fetch failed", e); }
                    if (!topRanked || topRanked.length === 0) {
                        try {
                            if (window.PlayerService) {
                                const pList = await window.PlayerService.getAllPlayers();
                                topRanked = (pList || []).sort((a, b) => (b.points || 0) - (a.points || 0));
                            }
                        } catch (e) { console.warn("PlayerService fallback failed", e); }
                    }
                }
            }

            // Fetch dynamic blog news only if id is 'noticias'
            let latestNews = null;
            if (id === 'noticias') {
                try {
                    if (window.DashboardView && window.DashboardView.cachedBlogPosts && window.DashboardView.cachedBlogPosts.length > 0) {
                        latestNews = window.DashboardView.cachedBlogPosts[0];
                    } else if (window.db) {
                        const newsSnap = await window.db.collection('blog_posts').orderBy('timestamp', 'desc').limit(1).get();
                        if (!newsSnap.empty) {
                            latestNews = { id: newsSnap.docs[0].id, ...newsSnap.docs[0].data() };
                        }
                    }
                } catch (err) {
                    console.warn("Story news fetch:", err);
                }
                if (!latestNews && window.SomosPadelNewsEngine) {
                    const fPosts = window.SomosPadelNewsEngine.getDeterministicFallbackPosts();
                    if (fPosts && fPosts.length > 0) latestNews = fPosts[0];
                }
                if (!latestNews) {
                    latestNews = {
                        id: 'torneo-primavera',
                        title: 'Gran Torneo de Primavera 2026',
                        category: '🏆 TORNEOS',
                        snippet: '¡Inscripciones abiertas! 120 plazas, Welcome Pack premium y barbacoa final.',
                        content: 'Llega el evento más esperado del año en SomosPadel.',
                        date: 'Hoy',
                        readTime: '2 min'
                    };
                }
            }

            // CONTENT INJECTION
            if (id.startsWith('event_')) {
                const event = story.eventData;
                if (event) {
                    const regCount = (event.players || event.registeredPlayers || []).length;
                    const maxPlazas = (event.max_courts || 0) * 4;
                    const percent = maxPlazas > 0 ? Math.min(100, Math.round((regCount / maxPlazas) * 100)) : 0;
                    
                    let catColor = '#10b981';
                    const lowerName = (event.name || '').toLowerCase();
                    if (lowerName.includes('fem') || lowerName.includes('chicas')) catColor = '#ec4899';
                    else if (lowerName.includes('mix')) catColor = '#f59e0b';
                    else if (lowerName.includes('masc') || lowerName.includes('chicos')) catColor = '#0ea5e9';

                    const playersHtml = (event.players || event.registeredPlayers || []).slice(0, 8).map((p, idx) => `
                        <div style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); padding: 9px 12px; border-radius: 12px; display: flex; align-items: center; justify-content: space-between;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="font-size: 0.72rem; color: rgba(255,255,255,0.45); font-weight: 800;">#${idx + 1}</span>
                                <span style="font-weight: 800; font-size: 0.82rem; color: white;">${p.name || 'Jugador'}</span>
                            </div>
                            <span style="font-size: 0.65rem; color: #fbbf24; font-weight: 900; background: rgba(251,191,36,0.15); padding: 2px 7px; border-radius: 6px;">${p.level ? `NIVEL ${p.level}` : 'READY'}</span>
                        </div>
                    `).join('');

                    contentHtml = `
                        <div style="color: white; width: 100%; max-width: 420px; display: flex; flex-direction: column; animation: fadeIn 0.35s ease-out;">
                            <div style="text-align: center; margin-bottom: 18px;">
                                <span style="background: ${catColor}; color: #000; padding: 4px 14px; border-radius: 50px; font-weight: 950; font-size: 0.65rem; letter-spacing: 1px; text-transform: uppercase;">${event.type === 'entreno' ? 'ENTRENAMIENTO' : 'AMERICANAS'}</span>
                                <h2 style="font-size: 1.9rem; font-weight: 950; margin: 10px 0 4px; font-family: 'Outfit', sans-serif; line-height: 1.15;">${event.name}</h2>
                                <p style="color: rgba(255,255,255,0.55); font-size: 0.78rem; margin: 0; font-weight: 700;">${event.date} • ${event.time || '18:00'}</p>
                            </div>

                            <div style="display: flex; flex-direction: column; gap: 12px; padding-bottom: 25px;">
                                <!-- CAPACITY PROGRESS -->
                                <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 14px;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                        <span style="font-size: 0.72rem; font-weight: 800; color: rgba(255,255,255,0.7);">PLAZAS OCUPADAS</span>
                                        <span style="font-size: 0.92rem; font-weight: 950; color: ${catColor};">${regCount} / ${maxPlazas}</span>
                                    </div>
                                    <div style="width: 100%; height: 7px; background: rgba(255,255,255,0.12); border-radius: 10px; overflow: hidden;">
                                        <div style="width: ${percent}%; height: 100%; background: ${catColor}; border-radius: 10px;"></div>
                                    </div>
                                </div>

                                <!-- REGISTERED PLAYERS LIST -->
                                ${regCount > 0 ? `
                                    <div style="display: flex; flex-direction: column; gap: 6px;">
                                        <h4 style="margin: 0 0 2px; font-size: 0.75rem; font-weight: 900; color: rgba(255,255,255,0.5); text-transform: uppercase;">JUGADORES INSCRITOS</h4>
                                        <div style="display: flex; flex-direction: column; gap: 6px; max-height: 160px; overflow-y: auto;">
                                            ${playersHtml}
                                        </div>
                                    </div>
                                ` : `
                                    <div style="text-align: center; padding: 20px; background: rgba(255,255,255,0.03); border-radius: 16px; border: 1px dashed rgba(255,255,255,0.15);">
                                        <p style="margin: 0; font-size: 0.8rem; color: rgba(255,255,255,0.6); font-weight: 700;">¡Inaugura la lista! Sé el primero en inscribirte.</p>
                                    </div>
                                `}

                                <!-- ACTION BUTTON -->
                                <button onclick="event.stopPropagation(); window.dashNavigate('entrenos', 'event_story')" style="width: 100%; background: ${catColor}; color: #000; border: none; padding: 13px; border-radius: 14px; font-size: 0.82rem; font-weight: 950; cursor: pointer; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 14px ${catColor}50; margin-top: 4px;">
                                    ${event.status === 'live' ? 'VER PISTAS EN VIVO' : 'RESERVAR MI PLAZA AHORA'}
                                </button>
                            </div>
                        </div>
                    `;
                } else {
                    contentHtml = `<div style="padding:40px; color:white; text-align:center;"><h2 style="font-weight:950; font-size:2rem;">EVENTO</h2><p style="opacity:0.6; margin-top:20px;">Detalles no disponibles.</p></div>`;
                }
            } else switch (id) {
                case 'noticias': {
                    const newsCat = (latestNews.category || 'NOTICIAS').toUpperCase();
                    const newsDate = latestNews.date || 'Hoy';
                    const newsRead = latestNews.readTime || '2 min';
                    contentHtml = `
                        <div style="color: white; width: 100%; max-width: 420px; display: flex; flex-direction: column; animation: fadeIn 0.35s ease-out;">
                            <div style="text-align: center; margin-bottom: 16px;">
                                <span style="background: rgba(16,185,129,0.18); color: #10b981; border: 1px solid rgba(16,185,129,0.35); padding: 4px 14px; border-radius: 50px; font-weight: 950; font-size: 0.65rem; letter-spacing: 0.8px; text-transform: uppercase;">SOMOSPADEL JOURNAL</span>
                                <h2 style="font-size: 1.8rem; font-weight: 950; margin: 8px 0 4px; font-family: 'Outfit', sans-serif;">ÚLTIMA <span style="color: #10b981;">NOTICIA</span></h2>
                                <p style="color: rgba(255,255,255,0.5); font-size: 0.75rem; margin: 0; font-weight: 600;">${newsDate} • ${newsRead} de lectura</p>
                            </div>

                            <div style="display: flex; flex-direction: column; gap: 12px; padding-bottom: 20px;">
                                <!-- HERO ARTICLE CARD -->
                                <div style="background: linear-gradient(145deg, rgba(15,23,42,0.85) 0%, rgba(30,41,59,0.7) 100%); border: 1px solid rgba(16,185,129,0.3); border-radius: 18px; padding: 18px; box-shadow: 0 10px 25px rgba(0,0,0,0.35); position: relative; overflow: hidden;">
                                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                                        <span style="font-size: 0.6rem; font-weight: 950; color: #10b981; background: rgba(16,185,129,0.15); padding: 3px 9px; border-radius: 6px; text-transform: uppercase;">${newsCat}</span>
                                        <i class="fas fa-newspaper" style="color: #10b981; font-size: 0.9rem;"></i>
                                    </div>
                                    <h3 style="margin: 0 0 10px; font-size: 1.2rem; font-weight: 900; color: white; font-family: 'Outfit', sans-serif; line-height: 1.3;">${latestNews.title}</h3>
                                    <p style="margin: 0 0 16px; font-size: 0.78rem; color: rgba(255,255,255,0.7); line-height: 1.45;">${latestNews.snippet || latestNews.content?.substring(0, 150) + '...'}</p>
                                    
                                    <button onclick="event.stopPropagation(); window.StoryFeedWidget.hideStory(); if (window.DashboardView && typeof window.DashboardView.openBlogModal === 'function') { window.DashboardView.openBlogModal('${latestNews.id}'); } else { window.dashNavigate('dashboard', 'news_story'); }" style="width: 100%; background: #10b981; color: white; border: none; padding: 12px; border-radius: 12px; font-size: 0.8rem; font-weight: 900; cursor: pointer; text-transform: uppercase; letter-spacing: 0.5px; transition: 0.2s; box-shadow: 0 4px 12px rgba(16,185,129,0.35);">LEER ARTÍCULO COMPLETO</button>
                                </div>

                                <!-- SECONDARY QUICK LINKS -->
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                    <div onclick="event.stopPropagation(); window.dashNavigate('entrenos', 'news_story')" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 12px; cursor: pointer; text-align: center;">
                                        <i class="fas fa-graduation-cap" style="color: #818cf8; font-size: 1.1rem; margin-bottom: 4px; display: block;"></i>
                                        <span style="font-size: 0.72rem; font-weight: 800; color: white; display: block;">Entrenamientos</span>
                                        <span style="font-size: 0.6rem; color: rgba(255,255,255,0.45);">Pozos y clases</span>
                                    </div>
                                    <div onclick="event.stopPropagation(); window.dashNavigate('ranking', 'news_story')" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 12px; cursor: pointer; text-align: center;">
                                        <i class="fas fa-trophy" style="color: #fb7185; font-size: 1.1rem; margin-bottom: 4px; display: block;"></i>
                                        <span style="font-size: 0.72rem; font-weight: 800; color: white; display: block;">Clasificación</span>
                                        <span style="font-size: 0.6rem; color: rgba(255,255,255,0.45);">Top jugadores</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                    break;
                }
                case 'ranking': {
                    this.currentRankingData = topRanked;
                    const top3 = topRanked.slice(0, 3);
                    const medals = ['🥇', '🥈', '🥉'];
                    const medalBorders = ['#eab308', '#94a3b8', '#b45309'];
                    const medalBgs = ['rgba(234,179,8,0.12)', 'rgba(148,163,184,0.1)', 'rgba(180,83,9,0.1)'];

                    contentHtml = `
                        <div style="color: white; width: 100%; max-width: 420px; display: flex; flex-direction: column; animation: fadeIn 0.35s ease-out;">
                            <div id="ranking-default-view" style="text-align: center; margin-bottom: 14px;">
                                <span style="background: rgba(244,63,94,0.18); color: #f43f5e; border: 1px solid rgba(244,63,94,0.35); padding: 4px 14px; border-radius: 50px; font-weight: 950; font-size: 0.65rem; letter-spacing: 0.8px;">RANKING OFICIAL</span>
                                <h2 style="font-size: 1.8rem; font-weight: 950; margin: 8px 0 4px; font-family: 'Outfit', sans-serif;">PODIO DE LA <span style="color: #f43f5e;">PISTA</span></h2>
                                <p style="color: rgba(255,255,255,0.5); font-size: 0.75rem; margin: 0; font-weight: 600;">Líderes de la temporada en puntos</p>
                            </div>

                            <!-- SEARCH BAR -->
                            <div style="margin-bottom: 12px; position: relative; z-index: 1005;">
                                <div style="position: relative;">
                                    <i class="fas fa-search" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: rgba(255,255,255,0.4); font-size: 0.85rem;"></i>
                                    <input type="text" placeholder="Buscar jugador..." 
                                        onclick="event.stopPropagation()"
                                        onkeyup="window.StoryFeedWidget.onRankingSearch(this.value)"
                                        onfocus="window.StoryFeedWidget.pauseStory()"
                                        style="width: 100%; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.18); padding: 10px 12px 10px 38px; border-radius: 12px; color: white; font-weight: 700; outline: none; font-family: inherit; font-size: 0.82rem; box-sizing: border-box;">
                                </div>
                            </div>

                            <div id="ranking-content-area" style="overflow-y: auto; flex: 1; padding-bottom: 15px;">
                                <!-- TOP 3 PODIUM CARDS -->
                                <div id="ranking-top-list" style="display: flex; flex-direction: column; gap: 8px;">
                                    ${top3.length > 0 ? top3.map((p, i) => `
                                        <div style="display: flex; align-items: center; gap: 12px; background: ${medalBgs[i] || 'rgba(255,255,255,0.05)'}; padding: 12px 15px; border-radius: 14px; border: 1px solid ${medalBorders[i] || 'rgba(255,255,255,0.1)'}; animation: enterStoryCard 0.4s both ${i * 0.08}s;">
                                            <div style="font-size: 1.3rem; min-width: 28px; text-align: center;">${medals[i] || `#${i+1}`}</div>
                                            <div style="flex: 1; min-width: 0;">
                                                <div style="font-weight: 850; font-size: 0.9rem; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: white;">${p.name || 'Pro Player'}</div>
                                                <div style="font-size: 0.65rem; color: rgba(255,255,255,0.5); font-weight: 700;">Nivel ${p.level || '3.5'} • Temporada 2026</div>
                                            </div>
                                            <div style="font-weight: 950; color: #f43f5e; font-size: 0.95rem; font-family: 'Outfit', sans-serif;">${Math.round((p.stats?.americanas?.points || 0) + (p.stats?.entrenos?.points || 0) || (p.points || 0))} PTS</div>
                                        </div>
                                    `).join('') : '<p style="color:rgba(255,255,255,0.4); text-align:center; padding: 20px;">Calculando clasificación en vivo...</p>'}
                                </div>
                                <!-- SEARCH RESULTS -->
                                <div id="ranking-search-results" style="display: none; flex-direction: column; gap: 8px;"></div>
                            </div>

                            <button onclick="event.stopPropagation(); window.dashNavigate('ranking', 'ranking_story');" style="width: 100%; background: #f43f5e; color: white; border: none; padding: 13px; border-radius: 14px; font-size: 0.82rem; font-weight: 900; cursor: pointer; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(244,63,94,0.35); margin-top: 6px;">VER CLASIFICACIÓN COMPLETA</button>
                        </div>
                    `;
                    break;
                }
                case 'shop':
                    contentHtml = `
                        <div style="color: white; width: 100%; max-width: 420px; display: flex; flex-direction: column; animation: fadeIn 0.35s ease-out;">
                            <div style="text-align: center; margin-bottom: 16px;">
                                <span style="background: rgba(139,92,246,0.18); color: #a78bfa; border: 1px solid rgba(139,92,246,0.35); padding: 4px 14px; border-radius: 50px; font-weight: 950; font-size: 0.65rem; letter-spacing: 0.8px;">PRO SHOP & MATERIAL</span>
                                <h2 style="font-size: 1.8rem; font-weight: 950; margin: 8px 0 4px; font-family: 'Outfit', sans-serif;">MATERIAL <span style="color: #a78bfa;">OFICIAL</span></h2>
                                <p style="color: rgba(255,255,255,0.5); font-size: 0.75rem; margin: 0; font-weight: 600;">Equipaciones y accesorios disponibles en el club</p>
                            </div>

                            <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 14px;">
                                <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(139,92,246,0.25); border-radius: 14px; padding: 12px; display: flex; align-items: center; justify-content: space-between;">
                                    <div style="display: flex; align-items: center; gap: 12px;">
                                        <div style="width: 36px; height: 36px; border-radius: 10px; background: rgba(139,92,246,0.15); display: flex; align-items: center; justify-content: center;">
                                            <i class="fas fa-table-tennis" style="color: #a78bfa; font-size: 1rem;"></i>
                                        </div>
                                        <div>
                                            <h4 style="margin: 0; font-size: 0.86rem; font-weight: 850; color: white;">Palas Test en Pista</h4>
                                            <span style="font-size: 0.68rem; color: rgba(255,255,255,0.5);">Prueba modelos Bullpadel y Nox</span>
                                        </div>
                                    </div>
                                    <span style="font-size: 0.65rem; color: #c4b5fd; font-weight: 900; background: rgba(196,181,253,0.15); padding: 3px 7px; border-radius: 6px;">DISPONIBLE</span>
                                </div>

                                <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(139,92,246,0.25); border-radius: 14px; padding: 12px; display: flex; align-items: center; justify-content: space-between;">
                                    <div style="display: flex; align-items: center; gap: 12px;">
                                        <div style="width: 36px; height: 36px; border-radius: 10px; background: rgba(139,92,246,0.15); display: flex; align-items: center; justify-content: center;">
                                            <i class="fas fa-tshirt" style="color: #a78bfa; font-size: 1rem;"></i>
                                        </div>
                                        <div>
                                            <h4 style="margin: 0; font-size: 0.86rem; font-weight: 850; color: white;">Camiseta Oficial SomosPadel</h4>
                                            <span style="font-size: 0.68rem; color: rgba(255,255,255,0.5);">Tejido transpirable edición 2026</span>
                                        </div>
                                    </div>
                                    <span style="font-size: 0.72rem; color: #a78bfa; font-weight: 900;">24,90€</span>
                                </div>

                                <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(139,92,246,0.25); border-radius: 14px; padding: 12px; display: flex; align-items: center; justify-content: space-between;">
                                    <div style="display: flex; align-items: center; gap: 12px;">
                                        <div style="width: 36px; height: 36px; border-radius: 10px; background: rgba(139,92,246,0.15); display: flex; align-items: center; justify-content: center;">
                                            <i class="fas fa-box-open" style="color: #a78bfa; font-size: 1rem;"></i>
                                        </div>
                                        <div>
                                            <h4 style="margin: 0; font-size: 0.86rem; font-weight: 850; color: white;">Pack Bolas & Overgrips</h4>
                                            <span style="font-size: 0.68rem; color: rgba(255,255,255,0.5);">Botes Head Pro y grips Bullpadel</span>
                                        </div>
                                    </div>
                                    <span style="font-size: 0.65rem; color: #c4b5fd; font-weight: 900; background: rgba(196,181,253,0.15); padding: 3px 7px; border-radius: 6px;">STOCK ALTO</span>
                                </div>
                            </div>

                            <div style="background: rgba(139,92,246,0.12); border: 1px dashed rgba(139,92,246,0.35); border-radius: 12px; padding: 10px 14px; margin-bottom: 12px; display: flex; align-items: center; gap: 10px;">
                                <i class="fas fa-tag" style="color: #a78bfa; font-size: 1rem;"></i>
                                <span style="font-size: 0.72rem; color: #ddd6fe; font-weight: 700;">10% de descuento directo para jugadores registrados.</span>
                            </div>

                            <button onclick="event.stopPropagation(); window.dashNavigate('entrenos', 'shop_story');" style="width: 100%; background: #8b5cf6; color: white; border: none; padding: 13px; border-radius: 14px; font-size: 0.82rem; font-weight: 900; cursor: pointer; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(139,92,246,0.35);">CONSULTAR MATERIAL EN RECEPCIÓN</button>
                        </div>
                    `;
                    break;
                case 'records':
                    contentHtml = `
                        <div style="color: white; width: 100%; max-width: 420px; display: flex; flex-direction: column; animation: fadeIn 0.35s ease-out;">
                            <div style="text-align: center; margin-bottom: 16px;">
                                <span style="background: rgba(13,148,136,0.18); color: #14b8a6; border: 1px solid rgba(13,148,136,0.35); padding: 4px 14px; border-radius: 50px; font-weight: 950; font-size: 0.65rem; letter-spacing: 0.8px;">HISTORIAL SOMOSPADEL</span>
                                <h2 style="font-size: 1.8rem; font-weight: 950; margin: 8px 0 4px; font-family: 'Outfit', sans-serif;">HALL OF <span style="color: #14b8a6;">FAME</span></h2>
                                <p style="color: rgba(255,255,255,0.5); font-size: 0.75rem; margin: 0; font-weight: 600;">Las mayores leyendas y marcas del club</p>
                            </div>

                            <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px;">
                                <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(13,148,136,0.25); border-radius: 14px; padding: 12px 14px; display: flex; align-items: center; justify-content: space-between;">
                                    <div style="display: flex; align-items: center; gap: 12px;">
                                        <div style="width: 36px; height: 36px; border-radius: 10px; background: rgba(13,148,136,0.15); display: flex; align-items: center; justify-content: center;">
                                            <i class="fas fa-crown" style="color: #2dd4bf;"></i>
                                        </div>
                                        <div>
                                            <h4 style="margin: 0; font-size: 0.86rem; font-weight: 850; color: white;">Mayor Racha Invicto</h4>
                                            <span style="font-size: 0.68rem; color: rgba(255,255,255,0.5);">14 Victorias Consecutivas</span>
                                        </div>
                                    </div>
                                    <span style="font-size: 0.72rem; color: #2dd4bf; font-weight: 950;">RÉCORD</span>
                                </div>

                                <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(13,148,136,0.25); border-radius: 14px; padding: 12px 14px; display: flex; align-items: center; justify-content: space-between;">
                                    <div style="display: flex; align-items: center; gap: 12px;">
                                        <div style="width: 36px; height: 36px; border-radius: 10px; background: rgba(13,148,136,0.15); display: flex; align-items: center; justify-content: center;">
                                            <i class="fas fa-bolt" style="color: #2dd4bf;"></i>
                                        </div>
                                        <div>
                                            <h4 style="margin: 0; font-size: 0.86rem; font-weight: 850; color: white;">Puntos en una Americana</h4>
                                            <span style="font-size: 0.68rem; color: rgba(255,255,255,0.5);">Máximo histórico registrado</span>
                                        </div>
                                    </div>
                                    <span style="font-size: 0.72rem; color: #2dd4bf; font-weight: 950;">48 PTS</span>
                                </div>

                                <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(13,148,136,0.25); border-radius: 14px; padding: 12px 14px; display: flex; align-items: center; justify-content: space-between;">
                                    <div style="display: flex; align-items: center; gap: 12px;">
                                        <div style="width: 36px; height: 36px; border-radius: 10px; background: rgba(13,148,136,0.15); display: flex; align-items: center; justify-content: center;">
                                            <i class="fas fa-medal" style="color: #2dd4bf;"></i>
                                        </div>
                                        <div>
                                            <h4 style="margin: 0; font-size: 0.86rem; font-weight: 850; color: white;">Palmarés del Club</h4>
                                            <span style="font-size: 0.68rem; color: rgba(255,255,255,0.5);">Histórico de campeones anuales</span>
                                        </div>
                                    </div>
                                    <span style="font-size: 0.72rem; color: #2dd4bf; font-weight: 950;">ACTUAL</span>
                                </div>
                            </div>

                            <button onclick="event.stopPropagation(); window.dashNavigate('records', 'records_story');" style="width: 100%; background: #0d9488; color: white; border: none; padding: 13px; border-radius: 14px; font-size: 0.82rem; font-weight: 900; cursor: pointer; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(13,148,136,0.35);">VER TODOS LOS RÉCORDS Y LOGROS</button>
                        </div>
                    `;
                    break;
                case 'equipos':
                    contentHtml = `
                        <div style="color: white; width: 100%; max-width: 420px; display: flex; flex-direction: column; animation: fadeIn 0.35s ease-out;">
                            <div style="text-align: center; margin-bottom: 16px;">
                                <span style="background: rgba(14,165,233,0.18); color: #0ea5e9; border: 1px solid rgba(14,165,233,0.35); padding: 4px 14px; border-radius: 50px; font-weight: 950; font-size: 0.65rem; letter-spacing: 0.8px;">COMPETICIÓN OFICIAL</span>
                                <h2 style="font-size: 1.8rem; font-weight: 950; margin: 8px 0 4px; font-family: 'Outfit', sans-serif;">EQUIPOS <span style="color: #0ea5e9;">SOMOSPADEL</span></h2>
                                <p style="color: rgba(255,255,255,0.5); font-size: 0.75rem; margin: 0; font-weight: 600;">Liga Interclubs de Cataluña & Torneos Federados</p>
                            </div>

                            <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px;">
                                <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(14,165,233,0.25); border-radius: 14px; padding: 12px 14px; display: flex; align-items: center; justify-content: space-between;">
                                    <div style="display: flex; align-items: center; gap: 12px;">
                                        <div style="width: 36px; height: 36px; border-radius: 10px; background: rgba(14,165,233,0.15); display: flex; align-items: center; justify-content: center;">
                                            <i class="fas fa-users" style="color: #0ea5e9;"></i>
                                        </div>
                                        <div>
                                            <h4 style="margin: 0; font-size: 0.86rem; font-weight: 850; color: white;">Masculino A & B</h4>
                                            <span style="font-size: 0.68rem; color: rgba(255,255,255,0.5);">1ª y 3ª División Federada</span>
                                        </div>
                                    </div>
                                    <span style="font-size: 0.65rem; color: #38bdf8; font-weight: 900; background: rgba(56,189,248,0.15); padding: 3px 8px; border-radius: 6px;">ACTIVO</span>
                                </div>

                                <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(236,72,153,0.25); border-radius: 14px; padding: 12px 14px; display: flex; align-items: center; justify-content: space-between;">
                                    <div style="display: flex; align-items: center; gap: 12px;">
                                        <div style="width: 36px; height: 36px; border-radius: 10px; background: rgba(236,72,153,0.15); display: flex; align-items: center; justify-content: center;">
                                            <i class="fas fa-venus" style="color: #ec4899;"></i>
                                        </div>
                                        <div>
                                            <h4 style="margin: 0; font-size: 0.86rem; font-weight: 850; color: white;">Femenino SomosPadel</h4>
                                            <span style="font-size: 0.68rem; color: rgba(255,255,255,0.5);">2ª División FCP</span>
                                        </div>
                                    </div>
                                    <span style="font-size: 0.65rem; color: #f472b6; font-weight: 900; background: rgba(244,114,182,0.15); padding: 3px 8px; border-radius: 6px;">ACTIVO</span>
                                </div>

                                <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(245,158,11,0.25); border-radius: 14px; padding: 12px 14px; display: flex; align-items: center; justify-content: space-between;">
                                    <div style="display: flex; align-items: center; gap: 12px;">
                                        <div style="width: 36px; height: 36px; border-radius: 10px; background: rgba(245,158,11,0.15); display: flex; align-items: center; justify-content: center;">
                                            <i class="fas fa-handshake" style="color: #f59e0b;"></i>
                                        </div>
                                        <div>
                                            <h4 style="margin: 0; font-size: 0.86rem; font-weight: 850; color: white;">Equipo Mixto</h4>
                                            <span style="font-size: 0.68rem; color: rgba(255,255,255,0.5);">Liga Interclubs Fin de Semana</span>
                                        </div>
                                    </div>
                                    <span style="font-size: 0.65rem; color: #fbbf24; font-weight: 900; background: rgba(251,191,36,0.15); padding: 3px 8px; border-radius: 6px;">OPEN</span>
                                </div>
                            </div>

                            <button onclick="event.stopPropagation(); window.dashNavigate('equipos', 'equipos_story');" style="width: 100%; background: #0ea5e9; color: white; border: none; padding: 13px; border-radius: 14px; font-size: 0.82rem; font-weight: 900; cursor: pointer; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(14,165,233,0.35);">VER EQUIPOS Y CONVOCATORIAS</button>
                        </div>
                    `;
                    break;
                case 'tournaments':
                    contentHtml = `
                        <div style="color: white; width: 100%; max-width: 420px; display: flex; flex-direction: column; animation: fadeIn 0.35s ease-out;">
                            <div style="text-align: center; margin-bottom: 16px;">
                                <span style="background: rgba(245,158,11,0.18); color: #f59e0b; border: 1px solid rgba(245,158,11,0.35); padding: 4px 14px; border-radius: 50px; font-weight: 950; font-size: 0.65rem; letter-spacing: 0.8px;">CIRCUITO DE TORNEOS</span>
                                <h2 style="font-size: 1.8rem; font-weight: 950; margin: 8px 0 4px; font-family: 'Outfit', sans-serif;">TORNEOS & <span style="color: #f59e0b;">AMERICANAS</span></h2>
                                <p style="color: rgba(255,255,255,0.5); font-size: 0.75rem; margin: 0; font-weight: 600;">Eventos especiales, cuadro con consolación y premios</p>
                            </div>

                            <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px;">
                                <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(245,158,11,0.25); border-radius: 14px; padding: 12px 14px;">
                                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                                        <span style="font-size: 0.65rem; font-weight: 900; color: #f59e0b; text-transform: uppercase;">🎾 GRAN OPEN DE PRIMAVERA</span>
                                        <span style="font-size: 0.65rem; color: #fbbf24; font-weight: 800; background: rgba(251,191,36,0.15); padding: 2px 7px; border-radius: 6px;">PRÓXIMO</span>
                                    </div>
                                    <h4 style="margin: 0 0 4px; font-size: 0.92rem; font-weight: 900; color: white;">Torneo Oficial 120 Plazas</h4>
                                    <p style="margin: 0; font-size: 0.72rem; color: rgba(255,255,255,0.6); line-height: 1.4;">Categorías Masculina, Femenina y Mixta. Mínimo 3 partidos garantizados, barbacoa y Welcome Pack.</p>
                                </div>

                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                    <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 10px; text-align: center;">
                                        <i class="fas fa-gift" style="color: #f59e0b; font-size: 1rem; margin-bottom: 3px; display: block;"></i>
                                        <span style="font-size: 0.72rem; font-weight: 850; color: white; display: block;">Welcome Pack</span>
                                        <span style="font-size: 0.6rem; color: rgba(255,255,255,0.45);">Camiseta + Bebida</span>
                                    </div>
                                    <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 10px; text-align: center;">
                                        <i class="fas fa-trophy" style="color: #fbbf24; font-size: 1rem; margin-bottom: 3px; display: block;"></i>
                                        <span style="font-size: 0.72rem; font-weight: 850; color: white; display: block;">Puntos Dobles</span>
                                        <span style="font-size: 0.6rem; color: rgba(255,255,255,0.45);">Para el Ranking</span>
                                    </div>
                                </div>
                            </div>

                            <button onclick="event.stopPropagation(); window.dashNavigate('americanas', 'tournaments_story');" style="width: 100%; background: #f59e0b; color: #000; border: none; padding: 13px; border-radius: 14px; font-size: 0.82rem; font-weight: 950; cursor: pointer; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(245,158,11,0.35);">VER CALENDARIO E INSCRIBIRME</button>
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
                <div style="position: absolute; top: env(safe-area-inset-top, 16px); left: 0; right: 0; padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; z-index: 1001; background: linear-gradient(180deg, rgba(0,0,0,0.65) 0%, transparent 100%);">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 32px; height: 32px; border-radius: 50%; background: ${story.color}; display: flex; align-items: center; justify-content: center; border: 1.5px solid white; box-shadow: 0 0 10px ${story.color}80;">
                            <i class="fas ${story.icon}" style="color: black; font-size: 0.95rem;"></i>
                        </div>
                        <span style="font-weight: 900; font-size: 0.85rem; text-transform: uppercase; color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.6); font-family: 'Outfit', sans-serif;">${story.label}</span>
                    </div>
                    <button onclick="window.StoryFeedWidget.hideStory(event)" style="background: none; border: none; color: white; font-size: 1.3rem; cursor: pointer; text-shadow: 0 2px 4px rgba(0,0,0,0.6); padding: 5px; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 50%; background: rgba(255,255,255,0.12); backdrop-filter: blur(5px);">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <!-- MAIN CARD CONTENT AREA -->
                <div style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 75px 18px 25px; z-index: 1000; position: relative; box-sizing: border-box; width: 100%;">
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
            if (event && event.stopPropagation) event.stopPropagation();
            if (this.storyTimeout) {
                clearTimeout(this.storyTimeout);
                this.storyTimeout = null;
            }

            const modal = document.getElementById('story-v3-modal');
            if (modal) {
                modal.style.pointerEvents = 'none';
                modal.style.animation = 'storyExit 0.25s both cubic-bezier(0.19, 1, 0.22, 1)';
                
                if (this.hideTimeout) clearTimeout(this.hideTimeout);
                this.hideTimeout = setTimeout(() => {
                    modal.style.display = 'none';
                    modal.innerHTML = '';
                    modal.style.animation = '';
                    modal.style.pointerEvents = '';
                    this.hideTimeout = null;
                }, 250);
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
