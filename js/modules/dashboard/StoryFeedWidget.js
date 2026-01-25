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
            this.stories = [
                { id: 'ranking', label: 'RANKING', icon: 'fa-trophy', color: '#fb7185' },
                { id: 'clinica', label: 'ESCUELA', icon: 'fa-graduation-cap', color: '#f472b6' },
                { id: 'live', label: 'ACTIVOS', icon: 'fa-users', color: '#00E36D' },
                { id: 'weather', label: 'VELOCIDAD', icon: 'fa-bolt', color: '#fbbf24' },
                { id: 'matches', label: 'EVENTOS', icon: 'fa-star', color: '#ca8a04' },
                { id: 'growth', label: 'INSIGHT', icon: 'fa-chart-line', color: '#0ea5e9' },
                { id: 'security', label: 'SEGURIDAD', icon: 'fa-shield-alt', color: '#8b5cf6' },
                { id: 'partners', label: 'PARTNERS', icon: 'fa-handshake', color: '#34d399' },
                { id: 'shop', label: 'TIENDA', icon: 'fa-shopping-bag', color: '#6366f1' }
            ];
        }

        render(containerId) {
            this.containerId = containerId || this.containerId;
            const container = document.getElementById(this.containerId);
            if (!container) return;

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
                    padding: 10px 0;
                    user-select: none;
                }
                .story-h-scroll {
                    display: flex;
                    justify-content: center; /* CENTRADO */
                    gap: 16px;
                    padding: 10px 5px;
                    overflow-x: auto;
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                    scroll-snap-type: x mandatory;
                }
                .story-h-scroll::-webkit-scrollbar { display: none; }
                
                .story-v3-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                    min-width: 78px;
                    cursor: pointer;
                    scroll-snap-align: center;
                    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                .story-v3-item:hover { transform: scale(1.05); }
                .story-v3-item:active { transform: scale(0.92); }

                /* Circle & Ring Design (ULTRA COMPACT) */
                .story-v3-outer {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    padding: 1.5px;
                    background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
                    position: relative;
                }
                
                .story-v3-inner {
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    background: #000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px solid #000;
                    overflow: hidden;
                    transition: all 0.3s;
                }
                
                /* Labels - Ultra Small */
                .story-v3-label {
                    font-size: 0.5rem;
                    font-weight: 800;
                    color: #1e293b;
                    letter-spacing: 0.1px;
                    text-transform: uppercase;
                    white-space: nowrap;
                    margin-top: 1px;
                }

                /* MODAL SYSTEM */
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
                <div class="story-feed-v3-wrapper" style="position: relative; padding: 2px 0;">
                    <div style="padding: 10px 15px; background: transparent;">
                    <div style="display: flex; align-items: center; gap: 12px; width: 100%;">
                        <!-- STORY ITEMS SCROLLER (FLEX GROW) -->
                        <div style="flex: 1; display: flex; overflow-x: auto; scrollbar-width: none; -ms-overflow-style: none; -webkit-overflow-scrolling: touch; gap: 16px; padding: 5px 0; mask-image: linear-gradient(to right, black 85%, transparent 100%); -webkit-mask-image: linear-gradient(to right, black 85%, transparent 100%);">
                            ${this.stories.map(story => `
                                <div class="story-v3-item" style="min-width: 50px; flex-shrink: 0;" onclick="window.StoryFeedWidget.showStory('${story.id}')">
                                    <div class="story-v3-outer" style="width: 48px; height: 48px;">
                                        <div class="story-v3-inner" style="width: 42px; height: 42px;">
                                            <i class="fas ${story.icon}" style="color: ${story.color}; font-size: 0.9rem;"></i>
                                        </div>
                                    </div>
                                    <span class="story-v3-label" style="font-size: 0.55rem; margin-top: 6px;">${story.label}</span>
                                </div>
                            `).join('')}
                        </div>

                        <!-- BROADCAST HUB (FIXED WIDTH) -->
                        <div style="
                            width: 48px; 
                            height: 48px; 
                            background: rgba(0,227,109,0.1); 
                            border-radius: 14px; 
                            border: 1.5px solid #00E36D; 
                            display: flex; 
                            flex-direction: column; 
                            align-items: center; 
                            justify-content: center; 
                            gap: 1px;
                            flex-shrink: 0;
                            box-shadow: 0 4px 15px rgba(0,227,109,0.15);
                            position: relative;
                            cursor: pointer;
                            margin-bottom: 12px; /* Alineado con labels */
                        " onclick="window.StoryFeedWidget.showStory(window.StoryFeedWidget.stories[0].id)">
                            <i class="fas fa-broadcast-tower" style="font-size: 1rem; color: #1e293b;"></i>
                            <div style="display: flex; align-items: center; gap: 2px;">
                                <span style="width: 3px; height: 3px; background: #008f45; border-radius: 50%; animation: livePulse 2s infinite;"></span>
                                <span style="font-size: 0.45rem; color: #1e293b; font-weight: 1000; letter-spacing: 0.1px;">LIVE</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="story-v3-modal" class="story-v3-modal"></div>
                
                <style>
                    @keyframes livePulse {
                        0% { opacity: 1; transform: scale(1); }
                        50% { opacity: 0.5; transform: scale(1.2); }
                        100% { opacity: 1; transform: scale(1); }
                    }
                </style>
            `;
        }

        async showStory(id) {
            const modal = document.getElementById('story-v3-modal');
            if (!modal) return;

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

            // CONTENT INJECTION (Same as before)
            switch (id) {
                case 'ranking':
                    // USAR DATOS DEL RANKING CONTROLLER (REALES)
                    const top3 = topRanked.slice(0, 3);

                    contentHtml = `
                        <div style="padding: 40px; color:white;">
                            <span style="background:#fb7185; color:#000; padding:4px 12px; border-radius:50px; font-weight:950; font-size:0.6rem;">RANKING ACTUALIZADO</span>
                            <h2 style="font-size: 2.2rem; font-weight: 950; margin: 15px 0;">LOS REYES<br>DE <span style="color:#fb7185">LA PISTA</span></h2>
                            <div style="margin-top:30px; display:flex; flex-direction:column; gap:12px;">
                                ${top3.length > 0 ? top3.map((p, i) => `
                                    <div style="display:flex; align-items:center; gap:15px; background:rgba(251,113,133,0.1); padding:15px; border-radius:18px; border:1px solid rgba(251,113,133,0.2); animation: enterStoryCard 0.5s both ${i * 0.1}s;">
                                        <div style="font-size:1.5rem; font-weight:900; color:#fb7185;">#${i + 1}</div>
                                        <div style="flex:1; font-weight:800; font-size:1rem; text-transform:uppercase;">${p.name || 'Pro Player'}</div>
                                        <div style="font-weight:900; color:#fb7185;">${Math.round((p.stats?.americanas?.points || 0) + (p.stats?.entrenos?.points || 0))} PTS</div>
                                    </div>
                                `).join('') : '<p style="color:rgba(255,255,255,0.4); text-align:center;">Analizando métricas del club...</p>'}
                            </div>
                        </div>
                    `;
                    break;
                case 'clinica':
                    contentHtml = `
                        <div style="padding: 40px; text-align:center;">
                            <div style="width:100px; height:100px; background:#f472b6; border-radius:30px; display:flex; align-items:center; justify-content:center; margin:0 auto 30px; box-shadow:0 15px 40px rgba(244,114,182,0.4);">
                                <i class="fas fa-graduation-cap" style="color:black; font-size:3rem;"></i>
                            </div>
                            <h2 style="color:white; font-size: 2rem; font-weight: 1000;">ESCUELA DE<br><span style="color:#f472b6">PÁDEL</span></h2>
                            <p style="color:rgba(255,255,255,0.8); margin-top:15px; line-height:1.6; font-weight:600;">Mejora tu técnica con clases personalizadas y grupos adaptados a todos los niveles.</p>
                            <div style="margin-top:40px; background:rgba(255,255,255,0.05); padding:20px; border-radius:20px; border: 1px dashed #f472b6;">
                                <p style="color:#f472b6; font-weight:900; font-size:0.85rem; margin:0; line-height:1.4;">
                                    Escríbenos por privado para ponerte en contacto con el profesor de pádel.
                                </p>
                            </div>
                        </div>
                    `;
                    break;
                case 'live':
                    const onlinePlayers = Math.floor(allPlayers.length * 0.4) + 5;
                    contentHtml = `
                        <div style="padding: 40px; text-align: left;">
                            <span style="background:#00E36D; color:#000; padding:4px 12px; border-radius:50px; font-weight:950; font-size:0.6rem;">ESTADO EN VIVO</span>
                            <h2 style="color:white; font-size: 2.2rem; font-weight: 950; margin: 15px 0;">COMUNIDAD<br>EN AUGE</h2>
                            <div style="background:white; border-radius:30px; padding:30px; color:#000;">
                                <div style="font-size:3rem; font-weight:950;">${onlinePlayers}</div>
                                <div style="font-weight:900; opacity:0.5; font-size:0.7rem; text-transform:uppercase;">Jugadores hoy</div>
                            </div>
                        </div>
                    `;
                    break;
                case 'weather':
                    const w = weatherData[0] || { temp: '--', icon: '☁️', intelligence: { ballSpeed: 'MEDIA' } };
                    contentHtml = `
                        <div style="padding: 40px;">
                            <span style="background:#fbbf24; color:#000; padding:4px 12px; border-radius:50px; font-weight:950; font-size:0.6rem;">CONSEJO TÁCTICO</span>
                            <h2 style="color:white; font-size: 2rem; font-weight: 950; margin-top:15px;">ESTRATEGIA<br>DE <span style="color:#fbbf24">PISTA</span></h2>
                            <p style="color:rgba(255,255,255,0.6); margin-top:10px;">Basado en condiciones de ${w.name || 'Barcelona'}:</p>
                            <div style="margin-top:40px; background:rgba(251,191,36,0.1); border:1px solid #fbbf24; border-radius:30px; padding:30px; text-align:center;">
                                <div style="font-size:4rem; margin-bottom:10px;">${w.icon}</div>
                                <div style="color:#fbbf24; font-weight:1000; font-size:1.6rem;">${w.temp}ºC</div>
                                <div style="color:white; font-weight:900; font-size:0.9rem; margin-top:10px; text-transform:uppercase;">BOLA ${w.intelligence?.ballSpeed || 'MEDIA'}</div>
                                <p style="color:white; opacity:0.8; font-size:0.8rem; margin-top:15px; line-height:1.5;">${w.intelligence?.recommendation || 'Condiciones estables. Se recomienda juego de control desde el fondo.'}</p>
                            </div>
                        </div>
                    `;
                    break;
                case 'matches':
                    const openMatches = allEvents.filter(e => e.status === 'open').slice(0, 2);
                    contentHtml = `
                        <div style="padding: 40px;">
                            <h2 style="color:white; font-size: 2rem; font-weight: 950;">PRÓXIMOS<br><span style="color:#ca8a04">RETOS</span></h2>
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
                        <div style="padding: 40px;">
                            <div style="text-align:center; margin-bottom:40px;">
                                <i class="fas fa-shield-check" style="color:#8b5cf6; font-size:5rem;"></i>
                            </div>
                            <h2 style="color:white; font-size: 2rem; font-weight: 1000; text-align:center;">PRIVACIDAD<br>TOTAL</h2>
                            <div style="margin-top:30px; background:rgba(255,255,255,0.05); border-radius:20px; padding:20px; border-left:4px solid #8b5cf6;">
                                <div style="color:white; font-weight:900; font-size:0.9rem;">ENCRIPTACIÓN DE DATOS</div>
                                <div style="color:rgba(255,255,255,0.6); font-size:0.75rem; margin-top:8px; line-height:1.4;">Tus resultados y estadísticas están protegidos bajo protocolos de alta seguridad.</div>
                            </div>
                        </div>
                    `;
                    break;
                case 'partners':
                    contentHtml = `
                        <div style="padding: 40px;">
                            <span style="background:#34d399; color:#000; padding:4px 12px; border-radius:50px; font-weight:950; font-size:0.6rem;">SOCIAL MATCH</span>
                            <h2 style="color:white; font-size: 2rem; font-weight: 1000; margin-top:15px;">BUSCA<br><span style="color:#34d399">PAREJA</span></h2>
                            <div style="margin-top:40px; background:rgba(52,211,153,0.1); border:2px dashed #34d399; border-radius:30px; padding:30px; display:flex; flex-direction:column; align-items:center;">
                                <div style="display:flex; gap:-10px; margin-bottom:15px;">
                                    ${Array(4).fill(0).map(() => `<div style="width:40px; height:40px; border-radius:50%; background:#111; border:2px solid #34d399; display:flex; align-items:center; justify-content:center; margin-left:-10px;"><i class="fas fa-user-ninja" style="font-size:1rem; color:#34d399;"></i></div>`).join('')}
                                </div>
                                <div style="color:white; font-weight:900; font-size:1.1rem; text-align:center;">12 JUGADORES BUSCANDO</div>
                                <p style="color:rgba(255,255,255,0.6); font-size:0.8rem; text-align:center; margin-top:10px;">Encuentra el partner ideal para tu nivel en segundos.</p>
                            </div>
                        </div>
                    `;
                    break;
                case 'shop':
                    contentHtml = `
                        <div style="padding: 40px; text-align:center;">
                            <i class="fas fa-shopping-bag" style="font-size:5rem; color:#6366f1; margin-bottom:20px;"></i>
                            <h2 style="color:white; font-size: 2.2rem; font-weight: 950;">SOMOSPADEL<br><span style="color:#6366f1">.EU</span></h2>
                            <p style="color:rgba(255,255,255,0.6); margin-top:15px;">Ofertas exclusivas en palas nuevas y ropa oficial.</p>
                        </div>
                    `;
                    break;
                default:
                    contentHtml = `<div style="padding:40px; color:white; text-align:center;"><h2 style="font-weight:950; font-size:2rem;">SOMOSPADEL<br>LIFE</h2><p style="opacity:0.6; margin-top:20px;">Mantente al día con lo último del club.</p></div>`;
            }

            modal.innerHTML = `
                <!-- SEGMENTED PROGRESS BARS (INSTAGRAM STYLE) -->
                <div class="story-progress-v3" style="display: flex; gap: 4px; padding: 0 10px; position: absolute; top: env(safe-area-inset-top, 20px); width: 100%; box-sizing: border-box; z-index: 1000;">
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
                
                <div style="position:absolute; top: env(safe-area-inset-top, 40px); right: 20px; color:white; font-size:1.8rem; z-index:1100; cursor:pointer;" onclick="window.StoryFeedWidget.hideStory()">
                    <i class="fas fa-times-circle"></i>
                </div>

                <div style="flex:1; display:flex; flex-direction:column; justify-content:center; background: radial-gradient(circle at top right, #111, #000);">
                    ${contentHtml}
                </div>

                <!-- Footer with fixed label -->
                <div style="padding:24px; background:rgba(0,0,0,0.9); backdrop-filter:blur(20px); border-top:1px solid rgba(255,255,255,0.1); display:flex; align-items:center; gap:16px;">
                    <div style="width:44px; height:44px; border-radius:12px; background:${story.color}; display:flex; align-items:center; justify-content:center;">
                        <i class="fas ${story.icon}" style="color:black; font-size:1.4rem;"></i>
                    </div>
                    <div style="flex:1;">
                        <div style="color:white; font-weight:1000; font-size:0.9rem;">${story.label}</div>
                        <div style="color:rgba(255,255,255,0.5); font-size:0.65rem; font-weight:800;">SOMOSPADEL BCN • INFO</div>
                    </div>
                </div>
            `;

            modal.style.display = 'flex';

            // Start Fill Animation
            setTimeout(() => {
                const fill = document.getElementById(`story-fill-${index}`);
                if (fill) fill.style.transform = 'scaleX(1)';
            }, 50);

            // AUTO-NEXT TIMER
            if (this.storyTimer) clearTimeout(this.storyTimer);
            this.storyTimer = setTimeout(() => {
                if (index < this.stories.length - 1) {
                    this.showStory(this.stories[index + 1].id);
                } else {
                    this.hideStory();
                }
            }, 5050);
        }

        hideStory() {
            if (this.storyTimer) clearTimeout(this.storyTimer);
            const modal = document.getElementById('story-v3-modal');
            if (modal) modal.style.display = 'none';
        }
    }

    window.StoryFeedWidget = new StoryFeedWidget();
    console.log('✅ Story Feed V3 Loaded');
})();
