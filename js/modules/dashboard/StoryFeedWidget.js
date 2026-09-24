/**
 * StoryFeedWidget.js - Pro Elite Edition
 * 📱 World-Class Stories & Quick Navigation Engine
 * Diseñado con los más altos estándares visuales (Instagram Pro, Playtomic Pro, Apple Fitness, Nike).
 * Esferas de profundidad 3D, anillos cinemáticos, badges de estado en vivo y físicas táctiles de muelle.
 */
(function () {
    'use strict';

    class StoryFeedWidget {
        constructor() {
            this.containerId = 'story-feed-root';
            this.currentStoryIndex = 0;
            this.storyTimeout = null;
            this.storyDuration = 5200; // 5.2 segundos por historia
            this.timerStart = 0;
            this.timerRemaining = 5200;
            this.currentRankingData = [];
            this.hideTimeout = null;
            this._keyListenerAttached = false;

            // Variables de control para el rotador de historias del Header (1 esfera dinámica compacta)
            this.headerRotatorContainerId = 'header-story-rotator';
            this.headerCurrentIndex = 0;
            this.headerRotationTimer = null;
            this.headerRotationInterval = 3800; // 3.8 segundos por rotación automática
            this.isHeaderHovered = false;
            this.isHeaderModalOpen = false;
            this._headerInitialized = false;

            // Historial de historias vistas en la sesión actual
            try {
                const stored = sessionStorage.getItem('somospadel_viewed_stories');
                this.viewedStories = new Set(stored ? JSON.parse(stored) : []);
            } catch (_) {
                this.viewedStories = new Set();
            }

            // Historias base con paleta de clase mundial y badges icónicos
            this.stories = [
                {
                    id: 'clima',
                    label: 'Radar Clima',
                    icon: 'fa-cloud-sun',
                    color: '#06b6d4',
                    ringGradient: 'linear-gradient(135deg, #38bdf8 0%, #06b6d4 50%, #0284c7 100%)',
                    coreTint: 'rgba(6, 182, 212, 0.12)',
                    badge: { text: 'NUEVO', bg: 'linear-gradient(135deg, #0284c7, #06b6d4)', isPulse: true }
                },
                {
                    id: 'noticias',
                    label: 'Noticias',
                    icon: 'fa-bullhorn',
                    color: '#10b981',
                    ringGradient: 'linear-gradient(135deg, #34d399 0%, #10b981 50%, #047857 100%)',
                    coreTint: 'rgba(16, 185, 129, 0.08)',
                    badge: { text: 'LIVE', bg: 'linear-gradient(135deg, #ef4444, #dc2626)', isPulse: true }
                },
                {
                    id: 'ranking',
                    label: 'Ranking',
                    icon: 'fa-trophy',
                    color: '#f59e0b',
                    ringGradient: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #ea580c 100%)',
                    coreTint: 'rgba(245, 158, 11, 0.08)',
                    badge: { text: 'TOP 1', bg: 'linear-gradient(135deg, #f59e0b, #d97706)', icon: 'fa-crown' }
                },
                {
                    id: 'equipos',
                    label: 'Equipos',
                    icon: 'fa-users',
                    color: '#0ea5e9',
                    ringGradient: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 50%, #1d4ed8 100%)',
                    coreTint: 'rgba(14, 165, 233, 0.08)',
                    badge: { text: '8 TEAM', bg: 'linear-gradient(135deg, #0284c7, #1e40af)' }
                },
                {
                    id: 'shop',
                    label: 'Tienda',
                    icon: 'fa-shopping-bag',
                    color: '#8b5cf6',
                    ringGradient: 'linear-gradient(135deg, #c084fc 0%, #8b5cf6 50%, #6366f1 100%)',
                    coreTint: 'rgba(139, 92, 246, 0.08)',
                    badge: { text: '-10%', bg: 'linear-gradient(135deg, #a855f7, #6366f1)' }
                },
                {
                    id: 'tournaments',
                    label: 'Torneos',
                    icon: 'fa-award',
                    color: '#ea580c',
                    ringGradient: 'linear-gradient(135deg, #fb923c 0%, #ea580c 50%, #b45309 100%)',
                    coreTint: 'rgba(234, 88, 12, 0.08)',
                    badge: { text: 'OPEN', bg: 'linear-gradient(135deg, #ea580c, #c2410c)' }
                },
                {
                    id: 'records',
                    label: 'Récords',
                    icon: 'fa-bolt',
                    color: '#0d9488',
                    ringGradient: 'linear-gradient(135deg, #2dd4bf 0%, #0d9488 50%, #115e59 100%)',
                    coreTint: 'rgba(13, 148, 136, 0.08)',
                    badge: { text: 'MAX', bg: 'linear-gradient(135deg, #0d9488, #065f46)' }
                }
            ];
        }

        /**
         * Marca una historia como vista y actualiza el estilo de su anillo en caliente
         */
        markStoryAsViewed(storyId) {
            if (!this.viewedStories.has(storyId)) {
                this.viewedStories.add(storyId);
                try {
                    sessionStorage.setItem('somospadel_viewed_stories', JSON.stringify([...this.viewedStories]));
                } catch (_) {}

                const items = document.querySelectorAll(`[data-story-id="${storyId}"]`);
                items.forEach(el => el.classList.add('story-is-viewed'));
            }
        }

        async loadDynamicStories() {
            const dynamicStories = [
                {
                    id: 'clima',
                    label: 'Radar Clima',
                    icon: 'fa-cloud-sun',
                    color: '#06b6d4',
                    ringGradient: 'linear-gradient(135deg, #38bdf8 0%, #06b6d4 50%, #0284c7 100%)',
                    coreTint: 'rgba(6, 182, 212, 0.12)',
                    badge: { text: 'NUEVO', bg: 'linear-gradient(135deg, #0284c7, #06b6d4)', isPulse: true }
                },
                {
                    id: 'noticias',
                    label: 'Noticias',
                    icon: 'fa-bullhorn',
                    color: '#10b981',
                    ringGradient: 'linear-gradient(135deg, #34d399 0%, #10b981 50%, #047857 100%)',
                    coreTint: 'rgba(16, 185, 129, 0.08)',
                    badge: { text: 'LIVE', bg: 'linear-gradient(135deg, #ef4444, #dc2626)', isPulse: true }
                },
                {
                    id: 'ranking',
                    label: 'Ranking',
                    icon: 'fa-trophy',
                    color: '#f59e0b',
                    ringGradient: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #ea580c 100%)',
                    coreTint: 'rgba(245, 158, 11, 0.08)',
                    badge: { text: 'TOP 1', bg: 'linear-gradient(135deg, #f59e0b, #d97706)', icon: 'fa-crown' }
                }
            ];

            // Obtener eventos dinámicos activos
            try {
                if (window.AmericanaService) {
                    const events = await window.AmericanaService.getAllActiveEvents();
                    const openEvents = events.filter(e => ['open', 'upcoming', 'scheduled', 'live'].includes(e.status));

                    openEvents.slice(0, 3).forEach(event => {
                        let color = '#0ea5e9';
                        let ringGradient = 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 50%, #0369a1 100%)';
                        let badgeText = 'OPEN';
                        let badgeBg = 'linear-gradient(135deg, #0284c7, #0369a1)';

                        const nameLower = (event.name || '').toLowerCase();
                        if (nameLower.includes('fem') || nameLower.includes('chicas')) {
                            color = '#ec4899';
                            ringGradient = 'linear-gradient(135deg, #f472b6 0%, #ec4899 50%, #be185d 100%)';
                            badgeText = 'FEM';
                            badgeBg = 'linear-gradient(135deg, #ec4899, #be185d)';
                        } else if (nameLower.includes('mix')) {
                            color = '#f59e0b';
                            ringGradient = 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #b45309 100%)';
                            badgeText = 'MIX';
                            badgeBg = 'linear-gradient(135deg, #f59e0b, #b45309)';
                        } else if (event.type === 'entreno') {
                            color = '#84cc16';
                            ringGradient = 'linear-gradient(135deg, #a3e635 0%, #84cc16 50%, #4d7c0f 100%)';
                            badgeText = 'CLASE';
                            badgeBg = 'linear-gradient(135deg, #84cc16, #4d7c0f)';
                        }

                        if (event.status === 'live') {
                            badgeText = 'EN VIVO';
                            badgeBg = 'linear-gradient(135deg, #ef4444, #dc2626)';
                        }

                        let rawPart = (event.name || '').split(' ')[0] || 'Evento';
                        if (rawPart.length > 8) rawPart = rawPart.substring(0, 7) + '…';
                        const label = rawPart.charAt(0).toUpperCase() + rawPart.slice(1).toLowerCase();

                        dynamicStories.push({
                            id: `event_${event.id}`,
                            label: label,
                            icon: event.type === 'entreno' ? 'fa-graduation-cap' : 'fa-medal',
                            color: color,
                            ringGradient: ringGradient,
                            coreTint: `${color}15`,
                            badge: { text: badgeText, bg: badgeBg },
                            isEvent: true,
                            eventData: event
                        });
                    });
                }
            } catch (e) {
                console.warn("[StoryFeedWidget] Carga de eventos dinámicos omitida:", e);
            }

            dynamicStories.push(
                {
                    id: 'equipos',
                    label: 'Equipos',
                    icon: 'fa-users',
                    color: '#0ea5e9',
                    ringGradient: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 50%, #1d4ed8 100%)',
                    coreTint: 'rgba(14, 165, 233, 0.08)',
                    badge: { text: '8 TEAM', bg: 'linear-gradient(135deg, #0284c7, #1e40af)' }
                },
                {
                    id: 'shop',
                    label: 'Tienda',
                    icon: 'fa-shopping-bag',
                    color: '#8b5cf6',
                    ringGradient: 'linear-gradient(135deg, #c084fc 0%, #8b5cf6 50%, #6366f1 100%)',
                    coreTint: 'rgba(139, 92, 246, 0.08)',
                    badge: { text: '-10%', bg: 'linear-gradient(135deg, #a855f7, #6366f1)' }
                },
                {
                    id: 'tournaments',
                    label: 'Torneos',
                    icon: 'fa-award',
                    color: '#ea580c',
                    ringGradient: 'linear-gradient(135deg, #fb923c 0%, #ea580c 50%, #b45309 100%)',
                    coreTint: 'rgba(234, 88, 12, 0.08)',
                    badge: { text: 'OPEN', bg: 'linear-gradient(135deg, #ea580c, #c2410c)' }
                },
                {
                    id: 'records',
                    label: 'Récords',
                    icon: 'fa-bolt',
                    color: '#0d9488',
                    ringGradient: 'linear-gradient(135deg, #2dd4bf 0%, #0d9488 50%, #115e59 100%)',
                    coreTint: 'rgba(13, 148, 136, 0.08)',
                    badge: { text: 'MAX', bg: 'linear-gradient(135deg, #0d9488, #065f46)' }
                }
            );

            this.stories = dynamicStories;
        }

        async render(containerId) {
            this.containerId = containerId || this.containerId;
            const container = document.getElementById(this.containerId);

            await this.loadDynamicStories();

            this.injectStyles();
            if (container) {
                this.updateUI();
                this.setupScrollFade();
            }

            // Inicializar y renderizar automáticamente el rotador del header
            this.renderHeaderRotator();
        }

        /**
         * Renderiza e inicializa la esfera auto-rotativa en el header (#header-story-rotator)
         */
        renderHeaderRotator(targetId) {
            const rotRoot = document.getElementById(targetId || this.headerRotatorContainerId);
            if (!rotRoot) return;

            this.injectStyles();

            // Si aún no se inicializó el listener de hover para el contenedor
            if (!this._headerInitialized) {
                rotRoot.addEventListener('mouseenter', () => {
                    this.isHeaderHovered = true;
                });
                rotRoot.addEventListener('mouseleave', () => {
                    this.isHeaderHovered = false;
                });
                this._headerInitialized = true;
            }

            this.updateHeaderRotatorUI(false);
            this.startHeaderRotation();
        }

        /**
         * Obtiene la historia actual para la esfera del header
         */
        getHeaderCurrentStory() {
            if (!this.stories || this.stories.length === 0) return null;
            const idx = Math.abs(this.headerCurrentIndex) % this.stories.length;
            return this.stories[idx];
        }

        /**
         * Actualiza el HTML de la esfera única del header con animación pop elástica
         */
        updateHeaderRotatorUI(animate = true) {
            const rotRoot = document.getElementById(this.headerRotatorContainerId);
            if (!rotRoot) return;

            const story = this.getHeaderCurrentStory();
            if (!story) return;

            const isViewed = this.viewedStories.has(story.id);
            const ringGradient = story.ringGradient || 'linear-gradient(135deg, #0ea5e9, #0284c7)';
            const innerBg = `radial-gradient(circle at 35% 28%, #ffffff 0%, #f8fafc 55%, ${story.coreTint || 'rgba(0,0,0,0.03)'} 100%)`;
            const badge = story.badge;

            const rawLabel = (story.label || '').split(' ')[0] || '';
            const displayLabel = rawLabel ? (rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1).toLowerCase()) : '';

            const animClass = animate ? 'header-rotator-anim-enter' : '';

            rotRoot.innerHTML = `
                <div class="header-rotator-inner">
                    <div class="header-rotator-stage ${animClass}">
                        <div class="header-rotator-item ${isViewed ? 'story-is-viewed' : ''}" 
                             data-story-id="${story.id}"
                             role="button" 
                             tabindex="0" 
                             onclick="window.StoryFeedWidget.onHeaderSphereClick('${story.id}')" 
                             onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();window.StoryFeedWidget.onHeaderSphereClick('${story.id}');}" 
                             title="${story.label || displayLabel} - Ver Historia">
                            
                            <div class="header-rotator-sphere-wrap" style="background: ${ringGradient};">
                                <div class="header-rotator-sphere-core" style="background: ${innerBg};">
                                    <i class="fas ${story.icon}" style="color: ${story.color};"></i>
                                </div>

                                ${badge ? `
                                    <div class="header-rotator-badge" style="background: ${badge.bg};">
                                        ${badge.isPulse ? `<span class="header-rotator-badge-pulse"></span>` : ''}
                                        ${badge.icon ? `<i class="fas ${badge.icon}" style="font-size:0.42rem;"></i>` : ''}
                                        <span>${badge.text}</span>
                                    </div>
                                ` : ''}
                            </div>

                            <span class="header-rotator-label">${displayLabel}</span>
                        </div>
                    </div>
                </div>
            `;
        }

        /**
         * Maneja el clic en la esfera del header
         */
        onHeaderSphereClick(storyId) {
            try {
                if (navigator.vibrate) navigator.vibrate(15);
            } catch (_) {}
            this.showStory(storyId);
        }

        /**
         * Inicia el ciclo de auto-rotación cada ~3.8 segundos
         */
        startHeaderRotation() {
            if (this.headerRotationTimer) {
                clearInterval(this.headerRotationTimer);
            }

            this.headerRotationTimer = setInterval(() => {
                // Pausar si el cursor está encima o el modal de historias está abierto
                if (this.isHeaderHovered || this.isHeaderModalOpen) {
                    return;
                }

                this.rotateToNextHeaderStory();
            }, this.headerRotationInterval);
        }

        /**
         * Rota fluidamente a la siguiente historia (1 esfera a la vez)
         */
        rotateToNextHeaderStory() {
            const rotRoot = document.getElementById(this.headerRotatorContainerId);
            if (!rotRoot || !this.stories || this.stories.length <= 1) return;

            const stage = rotRoot.querySelector('.header-rotator-stage');
            if (stage) {
                stage.classList.remove('header-rotator-anim-enter');
                stage.classList.add('header-rotator-anim-exit');

                setTimeout(() => {
                    this.headerCurrentIndex = (this.headerCurrentIndex + 1) % this.stories.length;
                    this.updateHeaderRotatorUI(true);
                }, 260);
            } else {
                this.headerCurrentIndex = (this.headerCurrentIndex + 1) % this.stories.length;
                this.updateHeaderRotatorUI(true);
            }
        }

        injectStyles() {
            if (document.getElementById('story-feed-v3-styles')) return;
            const style = document.createElement('style');
            style.id = 'story-feed-v3-styles';
            style.textContent = `
                /* ══════════════════════════════════════════════════════════════
                   CONTENEDOR PREMIUM TIPO HISTORIAS PLAYTOMIC PRO / APPLE FITNESS
                   ══════════════════════════════════════════════════════════════ */
                .story-feed-v3-wrapper {
                    position: relative;
                    user-select: none;
                    -webkit-user-select: none;
                    width: auto;
                    margin: 6px 14px 14px;
                    background: #ffffff;
                    background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.94) 100%);
                    border-radius: 22px;
                    border: 1px solid rgba(226, 232, 240, 0.85);
                    box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.04), 0 2px 6px -1px rgba(0, 0, 0, 0.02);
                    padding: 10px 0 10px;
                    overflow: hidden;
                    box-sizing: border-box;
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }

                @media (max-width: 600px) {
                    .story-feed-v3-wrapper {
                        margin: 4px 10px 12px;
                        border-radius: 20px;
                        padding: 9px 0 9px;
                    }
                }

                /* Micro-header de integración con el feed */
                .story-feed-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 16px 6px;
                    border-bottom: 1px solid rgba(241, 245, 249, 0.9);
                    margin-bottom: 8px;
                }
                .story-feed-header-left {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .story-feed-header-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: #10b981;
                    box-shadow: 0 0 8px rgba(16, 185, 129, 0.8);
                    animation: pulseLiveDot 1.6s infinite ease-in-out;
                }
                .story-feed-header-title {
                    font-family: 'Outfit', sans-serif;
                    font-size: 0.65rem;
                    font-weight: 950;
                    letter-spacing: 0.8px;
                    color: #475569;
                    text-transform: uppercase;
                }
                .story-feed-header-subtitle {
                    font-family: 'Outfit', sans-serif;
                    font-size: 0.58rem;
                    font-weight: 800;
                    color: #94a3b8;
                    letter-spacing: 0.5px;
                    text-transform: uppercase;
                }

                /* Máscaras de scroll lateral suave (fade masks) */
                .story-h-scroll-container {
                    position: relative;
                    width: 100%;
                    overflow: hidden;
                }
                .story-fade-mask-left {
                    position: absolute;
                    top: 0;
                    bottom: 0;
                    left: 0;
                    width: 28px;
                    background: linear-gradient(to right, rgba(255, 255, 255, 0.95), transparent);
                    pointer-events: none;
                    z-index: 10;
                    opacity: 0;
                    transition: opacity 0.22s ease;
                }
                .story-fade-mask-right {
                    position: absolute;
                    top: 0;
                    bottom: 0;
                    right: 0;
                    width: 32px;
                    background: linear-gradient(to left, rgba(255, 255, 255, 0.95), transparent);
                    pointer-events: none;
                    z-index: 10;
                    opacity: 1;
                    transition: opacity 0.22s ease;
                }

                /* Contenedor con scroll táctil ultra fluido */
                .story-h-scroll {
                    display: flex !important;
                    flex-direction: row !important;
                    justify-content: flex-start;
                    align-items: flex-start;
                    gap: 15px;
                    padding: 4px 16px 4px;
                    overflow-x: auto !important;
                    overflow-y: visible !important;
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                    -webkit-overflow-scrolling: touch;
                    width: 100%;
                    box-sizing: border-box;
                    scroll-snap-type: x proximity;
                }
                .story-h-scroll::-webkit-scrollbar { display: none; }

                @media (max-width: 600px) {
                    .story-h-scroll {
                        gap: 12px;
                        padding: 2px 14px 2px;
                    }
                }
                @media (min-width: 820px) {
                    .story-h-scroll {
                        justify-content: center;
                    }
                    .story-fade-mask-left,
                    .story-fade-mask-right {
                        display: none !important;
                    }
                }

                /* ══════════════════════════════════════════════════════════════
                   BURBUJA DE HISTORIA (STORY BUBBLE) ESTILO INSTAGRAM PRO / NIKE
                   ══════════════════════════════════════════════════════════════ */
                .story-v3-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    cursor: pointer;
                    scroll-snap-align: start;
                    flex-shrink: 0 !important;
                    min-width: 66px !important;
                    -webkit-tap-highlight-color: transparent;
                    transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
                    position: relative;
                }

                /* Físicas táctiles de muelle al interactuar */
                .story-v3-item:hover {
                    transform: translateY(-2px);
                }
                .story-v3-item:active {
                    transform: scale(0.91);
                    transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1);
                }

                /* Anillo cinemático de historia (Story Ring) */
                .story-v3-outer {
                    width: 66px;
                    height: 66px;
                    border-radius: 50%;
                    padding: 2.2px;
                    position: relative;
                    box-sizing: border-box;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.22s ease;
                    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
                }

                @media (max-width: 600px) {
                    .story-v3-outer {
                        width: 62px;
                        height: 62px;
                        padding: 2.2px;
                    }
                }

                .story-v3-item:hover .story-v3-outer {
                    transform: scale(1.05);
                    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
                }

                /* Estado de Historia ya VISTA: Anillo gris platino refinado */
                .story-v3-item.story-is-viewed .story-v3-outer {
                    background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 50%, #94a3b8 100%) !important;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04) !important;
                }
                .story-v3-item.story-is-viewed .story-v3-inner i {
                    opacity: 0.85;
                }

                /* Gap de ultra-precisión blanco + Núcleo 3D de cristal esférico */
                .story-v3-inner {
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    background: #ffffff;
                    border: 2px solid #ffffff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    box-sizing: border-box;
                    overflow: visible;
                    box-shadow: inset 0 2px 5px rgba(255, 255, 255, 0.95), 
                                inset 0 -2px 5px rgba(0, 0, 0, 0.05), 
                                0 2px 6px rgba(0, 0, 0, 0.03);
                }

                .story-v3-inner i {
                    font-size: 1.35rem;
                    transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
                    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.14));
                }

                @media (max-width: 600px) {
                    .story-v3-inner i {
                        font-size: 1.28rem;
                    }
                }

                .story-v3-item:hover .story-v3-inner i {
                    transform: scale(1.16);
                }

                /* Badges de Notificación / Estado en Vivo */
                .story-v3-badge {
                    position: absolute;
                    bottom: -3px;
                    left: 50%;
                    transform: translateX(-50%);
                    font-size: 0.52rem;
                    font-weight: 950;
                    letter-spacing: 0.5px;
                    text-transform: uppercase;
                    color: #ffffff;
                    padding: 1.5px 6.5px;
                    border-radius: 999px;
                    border: 1.5px solid #ffffff;
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.18);
                    white-space: nowrap;
                    z-index: 5;
                    pointer-events: none;
                    display: inline-flex;
                    align-items: center;
                    gap: 3px;
                    line-height: 1.2;
                    font-family: 'Outfit', sans-serif;
                }

                /* Punto blanco pulsante para badge LIVE */
                .story-v3-badge-pulse {
                    display: inline-block;
                    width: 4.5px;
                    height: 4.5px;
                    border-radius: 50%;
                    background: #ffffff;
                    animation: pulseLiveDot 1.2s infinite ease-in-out;
                }

                @keyframes pulseLiveDot {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(0.55); opacity: 0.35; }
                }

                /* Tipografía condensada pro */
                .story-v3-label {
                    font-size: 0.72rem;
                    font-weight: 800;
                    color: #1e293b;
                    letter-spacing: -0.2px;
                    text-align: center;
                    white-space: nowrap;
                    font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    transition: color 0.18s ease;
                    margin-top: 5px;
                    max-width: 76px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    -webkit-font-smoothing: antialiased;
                    -moz-osx-font-smoothing: grayscale;
                }

                @media (max-width: 600px) {
                    .story-v3-label {
                        font-size: 0.69rem;
                        margin-top: 4px;
                        max-width: 70px;
                    }
                }

                .story-v3-item:hover .story-v3-label {
                    color: #0f172a;
                }

                
                /* Botones flotantes de navegación táctil rápida (‹ y ›) */
                .story-nav-btn {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    width: clamp(38px, 6vw, 44px);
                    height: clamp(38px, 6vw, 44px);
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.12);
                    border: 1px solid rgba(255, 255, 255, 0.25);
                    color: #ffffff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.05rem;
                    cursor: pointer;
                    z-index: 1005;
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                    transition: all 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
                    box-shadow: 0 4px 18px rgba(0, 0, 0, 0.35);
                    user-select: none;
                    -webkit-tap-highlight-color: transparent;
                }
                .story-nav-btn:hover {
                    background: rgba(255, 255, 255, 0.28);
                    color: #ffffff;
                    transform: translateY(-50%) scale(1.12);
                }
                .story-nav-btn:active {
                    transform: translateY(-50%) scale(0.9);
                    background: rgba(204, 255, 0, 0.35);
                    border-color: #ccff00;
                }
                .story-nav-prev { left: 8px; }
                .story-nav-next { right: 8px; }

                @media (max-width: 480px) {
                    .story-nav-btn {
                        width: 36px;
                        height: 36px;
                        font-size: 0.95rem;
                        background: rgba(0, 0, 0, 0.25);
                    }
                    .story-nav-prev { left: 6px; }
                    .story-nav-next { right: 6px; }
                }

/* ══════════════════════════════════════════════════════════════
                   MODAL DE HISTORIAS A PANTALLA COMPLETA (INSTAGRAM STORIES VIP)
                   ══════════════════════════════════════════════════════════════ */
                .story-v3-modal {
                    position: fixed;
                    inset: 0;
                    background: radial-gradient(circle at 50% 15%, #1e293b 0%, #0f172a 65%, #020617 100%);
                    z-index: 9999999;
                    display: none;
                    flex-direction: column;
                    overflow-x: hidden;
                    overflow-y: auto;
                    -webkit-overflow-scrolling: touch;
                    animation: storyModalEnter 0.32s both cubic-bezier(0.19, 1, 0.22, 1);
                }

                @keyframes storyModalEnter {
                    from { transform: scale(0.92) translateY(30px); opacity: 0; }
                    to { transform: scale(1) translateY(0); opacity: 1; }
                }
                @keyframes storyModalExit {
                    from { transform: scale(1) translateY(0); opacity: 1; }
                    to { transform: scale(0.92) translateY(30px); opacity: 0; }
                }

                .story-progress-v3 {
                    position: absolute;
                    top: env(safe-area-inset-top, 16px);
                    left: 14px;
                    right: 14px;
                    height: 3px;
                    display: flex;
                    gap: 5px;
                    z-index: 1002;
                }
                .story-bar-v3 {
                    flex: 1;
                    background: rgba(255, 255, 255, 0.22);
                    border-radius: 10px;
                    height: 100%;
                    overflow: hidden;
                }
                .story-fill-v3 {
                    width: 100%;
                    height: 100%;
                    background: #ffffff;
                    transform-origin: left;
                    transform: scaleX(0);
                }

                @keyframes enterStoryCard {
                    from { opacity: 0; transform: translateY(16px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                /* ══════════════════════════════════════════════════════════════
                   HEADER STORY ROTATOR - 2 ESFERAS DINÁMICAS AUTO-ROTATIVAS
                   ══════════════════════════════════════════════════════════════ */
                /* ══════════════════════════════════════════════════════════════
                   HEADER STORY ROTATOR - CÁPSULA ARMÓNICA CON 2 ESFERAS DINÁMICAS
                   ══════════════════════════════════════════════════════════════ */
                .header-story-rotator {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    flex-shrink: 0;
                    user-select: none;
                    -webkit-user-select: none;
                    height: 46px;
                    padding: 0 10px;
                    box-sizing: border-box;
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 14px;
                    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
                    z-index: 100;
                    overflow: visible;
                    transition: border-color 0.2s ease, box-shadow 0.2s ease;
                }

                .header-story-rotator:hover {
                    border-color: #cbd5e1;
                    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.09);
                }

                .header-rotator-inner {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    position: relative;
                    gap: 8px;
                }

                .header-rotator-stage {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    position: relative;
                    height: 100%;
                }

                /* Cada elemento es un chip/pill horizontal interactivo */
                .header-rotator-item {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    text-decoration: none;
                    cursor: pointer;
                    outline: none;
                    -webkit-tap-highlight-color: transparent;
                    transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
                    padding: 2px 4px;
                    border-radius: 999px;
                }

                .header-rotator-item:hover {
                    transform: translateY(-1px) scale(1.04);
                }

                .header-rotator-item:active {
                    transform: scale(0.94);
                    transition: transform 0.12s ease;
                }

                /* Transiciones de rotación: pop-in y pop-out elásticos */
                .header-rotator-anim-enter {
                    animation: headerStoryPopIn 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both;
                }

                .header-rotator-anim-exit {
                    animation: headerStoryPopOut 0.35s cubic-bezier(0.4, 0, 0.2, 1) both;
                }

                @keyframes headerStoryPopIn {
                    0% {
                        opacity: 0;
                        transform: scale(0.75) translateY(6px);
                        filter: blur(3px);
                    }
                    70% {
                        opacity: 1;
                        transform: scale(1.03) translateY(-1px);
                        filter: blur(0);
                    }
                    100% {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }

                @keyframes headerStoryPopOut {
                    0% {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                    100% {
                        opacity: 0;
                        transform: scale(0.75) translateY(-6px);
                        filter: blur(3px);
                    }
                }

                /* Aro 3D perfectamente dimensionado (30px en desktop) */
                .header-rotator-sphere-wrap {
                    position: relative;
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    padding: 1.8px;
                    box-sizing: border-box;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12), inset 0 1px 1px rgba(255, 255, 255, 0.6);
                    transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease;
                    animation: headerRingBreathe 3.5s ease-in-out infinite alternate;
                }

                @keyframes headerRingBreathe {
                    0% {
                        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
                        filter: brightness(1);
                    }
                    100% {
                        box-shadow: 0 3px 12px rgba(16, 185, 129, 0.25);
                        filter: brightness(1.06);
                    }
                }

                .header-rotator-item:hover .header-rotator-sphere-wrap {
                    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
                    filter: brightness(1.1);
                }

                /* Si la historia ya fue vista */
                .header-rotator-item.story-is-viewed .header-rotator-sphere-wrap {
                    background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 50%, #94a3b8 100%) !important;
                    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05) !important;
                    animation: none !important;
                }

                /* Núcleo esférico con icono centrado */
                .header-rotator-sphere-core {
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    background: #ffffff;
                    border: 1.4px solid #ffffff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    box-sizing: border-box;
                    box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.9), inset 0 -1px 2px rgba(0, 0, 0, 0.06);
                    overflow: visible;
                }

                .header-rotator-sphere-core i {
                    font-size: 0.78rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.1));
                    transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
                }

                .header-rotator-item:hover .header-rotator-sphere-core i {
                    transform: scale(1.15);
                }

                /* Micro badge flotante ultra-compacto */
                .header-rotator-badge {
                    position: absolute;
                    bottom: -2.5px;
                    left: 50%;
                    transform: translateX(-50%);
                    color: #ffffff;
                    font-size: 0.42rem;
                    font-weight: 950;
                    letter-spacing: 0.2px;
                    padding: 0.8px 3.5px;
                    border-radius: 6px;
                    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
                    display: inline-flex;
                    align-items: center;
                    gap: 2px;
                    white-space: nowrap;
                    z-index: 5;
                    border: 1px solid #ffffff;
                    text-transform: uppercase;
                    line-height: 1;
                    font-family: 'Outfit', sans-serif;
                }

                .header-rotator-badge-pulse {
                    width: 3.5px;
                    height: 3.5px;
                    border-radius: 50%;
                    background: #ffffff;
                    display: inline-block;
                    animation: pulseLiveDot 1.2s infinite ease-in-out;
                }

                /* Micro etiqueta al lado de la esfera (formato chip horizontal) */
                .header-rotator-label {
                    font-size: 0.68rem;
                    font-weight: 800;
                    color: #0f172a;
                    letter-spacing: -0.2px;
                    white-space: nowrap;
                    font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
                    max-width: 68px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    -webkit-font-smoothing: antialiased;
                    line-height: 1.1;
                    transition: color 0.18s ease;
                }

                .header-rotator-item:hover .header-rotator-label {
                    color: #0284c7;
                }

                /* Indicadores de paginación sutiles en la cápsula */
                .header-rotator-dots {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 3px;
                    padding-left: 2px;
                    margin-left: 2px;
                    border-left: 1px solid #f1f5f9;
                }

                .header-rotator-dot {
                    width: 3.5px;
                    height: 3.5px;
                    border-radius: 50%;
                    background: #cbd5e1;
                    transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
                }

                .header-rotator-dot.active {
                    background: #0ea5e9;
                    height: 8px;
                    border-radius: 3px;
                    box-shadow: 0 0 5px rgba(14, 165, 233, 0.5);
                }
            `;
            document.head.appendChild(style);
        }

        setupScrollFade() {
            const scrollEl = document.querySelector('.story-h-scroll');
            const leftMask = document.querySelector('.story-fade-mask-left');
            const rightMask = document.querySelector('.story-fade-mask-right');
            if (!scrollEl || !leftMask || !rightMask) return;

            const handleScroll = () => {
                const scrollLeft = scrollEl.scrollLeft;
                const maxScroll = scrollEl.scrollWidth - scrollEl.clientWidth;

                leftMask.style.opacity = scrollLeft > 8 ? '1' : '0';
                rightMask.style.opacity = (maxScroll - scrollLeft) > 8 ? '1' : '0';
            };

            scrollEl.addEventListener('scroll', handleScroll, { passive: true });
            handleScroll();
        }

        updateUI() {
            const container = document.getElementById(this.containerId);
            if (!container) return;

            container.innerHTML = `
                <div class="story-feed-v3-wrapper">
                    <!-- MICRO-HEADER ELEGANTE DE INTEGRACIÓN -->
                    <div class="story-feed-header">
                        <div class="story-feed-header-left">
                            <span class="story-feed-header-dot"></span>
                            <span class="story-feed-header-title">DESTACADOS & EN VIVO</span>
                        </div>
                        <span class="story-feed-header-subtitle">SOMOSPADEL</span>
                    </div>

                    <!-- CONTENEDOR CON MÁSCARAS DE SCROLL -->
                    <div class="story-h-scroll-container">
                        <div class="story-fade-mask-left"></div>
                        <div class="story-fade-mask-right"></div>

                        <div class="story-h-scroll">
                            ${this.stories.map(story => {
                                const isViewed = this.viewedStories.has(story.id);
                                const ringGradient = story.ringGradient || 'linear-gradient(135deg, #0ea5e9, #0284c7)';
                                const innerBg = `radial-gradient(circle at 35% 28%, #ffffff 0%, #f8fafc 55%, ${story.coreTint || 'rgba(0,0,0,0.03)'} 100%)`;
                                const badge = story.badge;

                                const rawLabel = (story.label || '').split(' ')[0] || '';
                                const displayLabel = rawLabel ? (rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1).toLowerCase()) : '';

                                return `
                                    <div class="story-v3-item ${isViewed ? 'story-is-viewed' : ''}" 
                                         data-story-id="${story.id}"
                                         role="button" 
                                         tabindex="0" 
                                         onclick="window.StoryFeedWidget.showStory('${story.id}')" 
                                         onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();window.StoryFeedWidget.showStory('${story.id}');}" 
                                         title="${displayLabel}">
                                        
                                        <div class="story-v3-outer" style="background: ${ringGradient};">
                                            <div class="story-v3-inner" style="background: ${innerBg};">
                                                <i class="fas ${story.icon}" style="color: ${story.color};"></i>
                                            </div>

                                            ${badge ? `
                                                <div class="story-v3-badge" style="background: ${badge.bg};">
                                                    ${badge.isPulse ? `<span class="story-v3-badge-pulse"></span>` : ''}
                                                    ${badge.icon ? `<i class="fas ${badge.icon}" style="font-size:0.5rem;"></i>` : ''}
                                                    <span>${badge.text}</span>
                                                </div>
                                            ` : ''}
                                        </div>

                                        <span class="story-v3-label">${displayLabel}</span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
            `;
        }

        async showStory(id) {
            // Feedback háptico nativo para experiencia de élite
            try {
                if (navigator.vibrate) navigator.vibrate(12);
            } catch (_) {}

            // Cancelar timeouts previos
            if (this.hideTimeout) {
                clearTimeout(this.hideTimeout);
                this.hideTimeout = null;
            }
            if (this.storyTimeout) {
                clearTimeout(this.storyTimeout);
                this.storyTimeout = null;
            }

            // Marcar como historia vista al instante
            this.markStoryAsViewed(id);

            let modal = document.getElementById('story-v3-modal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'story-v3-modal';
                modal.className = 'story-v3-modal';
                document.body.appendChild(modal);
            }

            modal.style.pointerEvents = 'auto';
            modal.style.animation = 'storyModalEnter 0.32s both cubic-bezier(0.19, 1, 0.22, 1)';
            modal.style.display = 'flex';
            this.isHeaderModalOpen = true;

            const index = this.stories.findIndex(s => s.id === id);
            if (index === -1) return;

            this.currentStoryIndex = index;
            const story = this.stories[index];
            let contentHtml = '';

            // Listener de teclas Escape y flechas Izquierda/Derecha
            if (!this._keyListenerAttached) {
                window.addEventListener('keydown', (e) => {
                    const m = document.getElementById('story-v3-modal');
                    if (!m || m.style.display !== 'flex') return;

                    if (e.key === 'Escape') {
                        this.hideStory();
                    } else if (e.key === 'ArrowRight' || e.key === ' ') {
                        e.preventDefault();
                        this.nextStory();
                    } else if (e.key === 'ArrowLeft') {
                        e.preventDefault();
                        this.prevStory();
                    }
                });
                this._keyListenerAttached = true;
            }

            // Carga de datos bajo demanda para máxima velocidad
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
                    } catch (e) { console.warn("Error en ranking story:", e); }
                    if (!topRanked || topRanked.length === 0) {
                        try {
                            if (window.PlayerService) {
                                const pList = await window.PlayerService.getAllPlayers();
                                topRanked = (pList || []).sort((a, b) => (b.points || 0) - (a.points || 0));
                            }
                        } catch (e) { console.warn("Fallback playerService ranking:", e); }
                    }
                }
            }

            // Noticias en vivo
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
                        category: 'TORNEOS',
                        snippet: '¡Inscripciones abiertas! 120 plazas, Welcome Pack premium y barbacoa final.',
                        content: 'Llega el evento más esperado del año en SomosPadel.',
                        date: 'Hoy',
                        readTime: '2 min'
                    };
                }
            }

            // Inyección de contenido según la historia
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
                        <div style="color: white; width: 100%; max-width: 420px; display: flex; flex-direction: column; animation: enterStoryCard 0.35s ease-out;">
                            <div style="text-align: center; margin-bottom: 18px;">
                                <span style="background: ${catColor}; color: #000; padding: 4px 14px; border-radius: 50px; font-weight: 950; font-size: 0.65rem; letter-spacing: 1px; text-transform: uppercase;">${event.type === 'entreno' ? 'ENTRENAMIENTO' : 'AMERICANAS'}</span>
                                <h2 style="font-size: 1.85rem; font-weight: 950; margin: 10px 0 4px; font-family: 'Outfit', sans-serif; line-height: 1.15;">${event.name}</h2>
                                <p style="color: rgba(255,255,255,0.55); font-size: 0.78rem; margin: 0; font-weight: 700;">${event.date} • ${event.time || '18:00'}</p>
                            </div>

                            <div style="display: flex; flex-direction: column; gap: 12px; padding-bottom: 25px;">
                                <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 14px;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                        <span style="font-size: 0.72rem; font-weight: 800; color: rgba(255,255,255,0.7);">PLAZAS OCUPADAS</span>
                                        <span style="font-size: 0.92rem; font-weight: 950; color: ${catColor};">${regCount} / ${maxPlazas}</span>
                                    </div>
                                    <div style="width: 100%; height: 7px; background: rgba(255,255,255,0.12); border-radius: 10px; overflow: hidden;">
                                        <div style="width: ${percent}%; height: 100%; background: ${catColor}; border-radius: 10px;"></div>
                                    </div>
                                </div>

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

                                <button onclick="event.stopPropagation(); window.StoryFeedWidget.hideStory(); window.dashNavigate('entrenos', 'event_story');" style="width: 100%; background: ${catColor}; color: #000; border: none; padding: 13px; border-radius: 14px; font-size: 0.82rem; font-weight: 950; cursor: pointer; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 14px ${catColor}50; margin-top: 4px;">
                                    ${event.status === 'live' ? 'VER PISTAS EN VIVO' : 'RESERVAR MI PLAZA AHORA'}
                                </button>
                            </div>
                        </div>
                    `;
                }
            } else switch (id) {
                case 'noticias': {
                    const newsCat = (latestNews.category || 'NOTICIAS').toUpperCase();
                    const newsDate = latestNews.date || 'Hoy';
                    const newsRead = latestNews.readTime || '2 min';
                    contentHtml = `
                        <div style="color: white; width: 100%; max-width: 420px; display: flex; flex-direction: column; animation: enterStoryCard 0.35s ease-out;">
                            <div style="text-align: center; margin-bottom: 16px;">
                                <span style="background: rgba(16,185,129,0.18); color: #10b981; border: 1px solid rgba(16,185,129,0.35); padding: 4px 14px; border-radius: 50px; font-weight: 950; font-size: 0.65rem; letter-spacing: 0.8px; text-transform: uppercase;">SOMOSPADEL JOURNAL</span>
                                <h2 style="font-size: 1.85rem; font-weight: 950; margin: 8px 0 4px; font-family: 'Outfit', sans-serif;">ÚLTIMA <span style="color: #10b981;">NOTICIA</span></h2>
                                <p style="color: rgba(255,255,255,0.5); font-size: 0.75rem; margin: 0; font-weight: 600;">${newsDate} • ${newsRead} de lectura</p>
                            </div>

                            <div style="display: flex; flex-direction: column; gap: 12px; padding-bottom: 20px;">
                                <div style="background: linear-gradient(145deg, rgba(15,23,42,0.85) 0%, rgba(30,41,59,0.7) 100%); border: 1px solid rgba(16,185,129,0.3); border-radius: 18px; padding: 18px; box-shadow: 0 10px 25px rgba(0,0,0,0.35); position: relative; overflow: hidden;">
                                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                                        <span style="font-size: 0.6rem; font-weight: 950; color: #10b981; background: rgba(16,185,129,0.15); padding: 3px 9px; border-radius: 6px; text-transform: uppercase;">${newsCat}</span>
                                        <i class="fas fa-newspaper" style="color: #10b981; font-size: 0.9rem;"></i>
                                    </div>
                                    <h3 style="margin: 0 0 10px; font-size: 1.2rem; font-weight: 900; color: white; font-family: 'Outfit', sans-serif; line-height: 1.3;">${latestNews.title}</h3>
                                    <p style="margin: 0 0 16px; font-size: 0.78rem; color: rgba(255,255,255,0.7); line-height: 1.45;">${latestNews.snippet || latestNews.content?.substring(0, 150) + '...'}</p>
                                    
                                    <button onclick="event.stopPropagation(); window.StoryFeedWidget.hideStory(); if (window.DashboardView && typeof window.DashboardView.openBlogModal === 'function') { window.DashboardView.openBlogModal('${latestNews.id}'); } else { window.dashNavigate('dashboard', 'news_story'); }" style="width: 100%; background: #10b981; color: white; border: none; padding: 12px; border-radius: 12px; font-size: 0.8rem; font-weight: 900; cursor: pointer; text-transform: uppercase; letter-spacing: 0.5px; transition: 0.2s; box-shadow: 0 4px 12px rgba(16,185,129,0.35);">LEER ARTÍCULO COMPLETO</button>
                                </div>

                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                    <div onclick="event.stopPropagation(); window.StoryFeedWidget.hideStory(); window.dashNavigate('entrenos', 'news_story');" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 12px; cursor: pointer; text-align: center;">
                                        <i class="fas fa-graduation-cap" style="color: #818cf8; font-size: 1.1rem; margin-bottom: 4px; display: block;"></i>
                                        <span style="font-size: 0.72rem; font-weight: 800; color: white; display: block;">Entrenamientos</span>
                                        <span style="font-size: 0.6rem; color: rgba(255,255,255,0.45);">Pozos y clases</span>
                                    </div>
                                    <div onclick="event.stopPropagation(); window.StoryFeedWidget.hideStory(); window.dashNavigate('ranking', 'news_story');" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 12px; cursor: pointer; text-align: center;">
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
                        <div style="color: white; width: 100%; max-width: 420px; display: flex; flex-direction: column; animation: enterStoryCard 0.35s ease-out;">
                            <div id="ranking-default-view" style="text-align: center; margin-bottom: 14px;">
                                <span style="background: rgba(244,63,94,0.18); color: #f43f5e; border: 1px solid rgba(244,63,94,0.35); padding: 4px 14px; border-radius: 50px; font-weight: 950; font-size: 0.65rem; letter-spacing: 0.8px;">RANKING OFICIAL</span>
                                <h2 style="font-size: 1.85rem; font-weight: 950; margin: 8px 0 4px; font-family: 'Outfit', sans-serif;">PODIO DE LA <span style="color: #f59e0b;">PISTA</span></h2>
                                <p style="color: rgba(255,255,255,0.5); font-size: 0.75rem; margin: 0; font-weight: 600;">Líderes de la temporada en puntos</p>
                            </div>

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
                                <div id="ranking-top-list" style="display: flex; flex-direction: column; gap: 8px;">
                                    ${top3.length > 0 ? top3.map((p, i) => `
                                        <div style="display: flex; align-items: center; gap: 12px; background: ${medalBgs[i] || 'rgba(255,255,255,0.05)'}; padding: 12px 15px; border-radius: 14px; border: 1px solid ${medalBorders[i] || 'rgba(255,255,255,0.1)'}; animation: enterStoryCard 0.4s both ${i * 0.08}s;">
                                            <div style="font-size: 1.3rem; min-width: 28px; text-align: center;">${medals[i] || `#${i+1}`}</div>
                                            <div style="flex: 1; min-width: 0;">
                                                <div style="font-weight: 850; font-size: 0.9rem; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: white;">${p.name || 'Pro Player'}</div>
                                                <div style="font-size: 0.65rem; color: rgba(255,255,255,0.5); font-weight: 700;">Nivel ${p.level || '3.5'} • Temporada 2026</div>
                                            </div>
                                            <div style="font-weight: 950; color: #f59e0b; font-size: 0.95rem; font-family: 'Outfit', sans-serif;">${Math.round((p.stats?.americanas?.points || 0) + (p.stats?.entrenos?.points || 0) || (p.points || 0))} PTS</div>
                                        </div>
                                    `).join('') : '<p style="color:rgba(255,255,255,0.4); text-align:center; padding: 20px;">Calculando clasificación en vivo...</p>'}
                                </div>
                                <div id="ranking-search-results" style="display: none; flex-direction: column; gap: 8px;"></div>
                            </div>

                            <button onclick="event.stopPropagation(); window.StoryFeedWidget.hideStory(); window.dashNavigate('ranking', 'ranking_story');" style="width: 100%; background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #ea580c 100%); color: #000; border: none; padding: 13px; border-radius: 14px; font-size: 0.82rem; font-weight: 950; cursor: pointer; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(245,158,11,0.35); margin-top: 6px;">VER CLASIFICACIÓN COMPLETA</button>
                        </div>
                    `;
                    break;
                }
                case 'shop':
                    contentHtml = `
                        <div style="color: white; width: 100%; max-width: 420px; display: flex; flex-direction: column; animation: enterStoryCard 0.35s ease-out;">
                            <div style="text-align: center; margin-bottom: 16px;">
                                <span style="background: rgba(139,92,246,0.18); color: #a78bfa; border: 1px solid rgba(139,92,246,0.35); padding: 4px 14px; border-radius: 50px; font-weight: 950; font-size: 0.65rem; letter-spacing: 0.8px;">PRO SHOP & MATERIAL</span>
                                <h2 style="font-size: 1.85rem; font-weight: 950; margin: 8px 0 4px; font-family: 'Outfit', sans-serif;">MATERIAL <span style="color: #c084fc;">OFICIAL</span></h2>
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
                                            <span style="font-size: 0.68rem; color: rgba(255,255,255,0.5);">Edición limitada temporada 2026</span>
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

                            <button onclick="event.stopPropagation(); window.StoryFeedWidget.hideStory(); window.dashNavigate('entrenos', 'shop_story');" style="width: 100%; background: linear-gradient(135deg, #a855f7 0%, #8b5cf6 50%, #6366f1 100%); color: white; border: none; padding: 13px; border-radius: 14px; font-size: 0.82rem; font-weight: 900; cursor: pointer; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(139,92,246,0.35);">CONSULTAR MATERIAL EN RECEPCIÓN</button>
                        </div>
                    `;
                    break;
                case 'records':
                    contentHtml = `
                        <div style="color: white; width: 100%; max-width: 420px; display: flex; flex-direction: column; animation: enterStoryCard 0.35s ease-out;">
                            <div style="text-align: center; margin-bottom: 16px;">
                                <span style="background: rgba(13,148,136,0.18); color: #14b8a6; border: 1px solid rgba(13,148,136,0.35); padding: 4px 14px; border-radius: 50px; font-weight: 950; font-size: 0.65rem; letter-spacing: 0.8px;">HISTORIAL SOMOSPADEL</span>
                                <h2 style="font-size: 1.85rem; font-weight: 950; margin: 8px 0 4px; font-family: 'Outfit', sans-serif;">HALL OF <span style="color: #2dd4bf;">FAME</span></h2>
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

                            <button onclick="event.stopPropagation(); window.StoryFeedWidget.hideStory(); window.dashNavigate('records', 'records_story');" style="width: 100%; background: linear-gradient(135deg, #14b8a6 0%, #0d9488 50%, #0f766e 100%); color: white; border: none; padding: 13px; border-radius: 14px; font-size: 0.82rem; font-weight: 900; cursor: pointer; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(13,148,136,0.35);">VER TODOS LOS RÉCORDS Y LOGROS</button>
                        </div>
                    `;
                    break;
                case 'equipos':
                    contentHtml = `
                        <div style="color: white; width: 100%; max-width: 420px; display: flex; flex-direction: column; animation: enterStoryCard 0.35s ease-out;">
                            <div style="text-align: center; margin-bottom: 14px;">
                                <span style="background: rgba(14,165,233,0.18); color: #0ea5e9; border: 1px solid rgba(14,165,233,0.35); padding: 4px 14px; border-radius: 50px; font-weight: 950; font-size: 0.65rem; letter-spacing: 0.8px;">COMPETICIÓN OFICIAL 2026</span>
                                <h2 style="font-size: 1.85rem; font-weight: 950; margin: 8px 0 4px; font-family: 'Outfit', sans-serif;">EQUIPOS <span style="color: #38bdf8;">SOMOSPADEL</span></h2>
                                <p style="color: rgba(255,255,255,0.65); font-size: 0.74rem; margin: 0; font-weight: 600;">Lliga GuinotPrunera • 8 Equipos en Competición</p>
                            </div>

                            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 14px;">
                                <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 8px 6px; text-align: center;">
                                    <div style="font-size: 1.15rem; font-weight: 950; color: #0ea5e9;">8</div>
                                    <div style="font-size: 0.62rem; color: rgba(255,255,255,0.5); font-weight: 700; text-transform: uppercase;">Equipos</div>
                                </div>
                                <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 8px 6px; text-align: center;">
                                    <div style="font-size: 1.15rem; font-weight: 950; color: #10b981;">3</div>
                                    <div style="font-size: 0.62rem; color: rgba(255,255,255,0.5); font-weight: 700; text-transform: uppercase;">Ramas</div>
                                </div>
                                <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 8px 6px; text-align: center;">
                                    <div style="font-size: 1.15rem; font-weight: 950; color: #f59e0b;">+140</div>
                                    <div style="font-size: 0.62rem; color: rgba(255,255,255,0.5); font-weight: 700; text-transform: uppercase;">Jugadores</div>
                                </div>
                            </div>

                            <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px;">
                                <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(14,165,233,0.25); border-radius: 14px; padding: 11px 13px; display: flex; align-items: center; justify-content: space-between;">
                                    <div style="display: flex; align-items: center; gap: 12px;">
                                        <div style="width: 36px; height: 36px; border-radius: 10px; background: rgba(14,165,233,0.15); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                            <i class="fas fa-users" style="color: #0ea5e9;"></i>
                                        </div>
                                        <div>
                                            <h4 style="margin: 0; font-size: 0.85rem; font-weight: 850; color: white;">Masculinos (3MA, 3MB, 4M)</h4>
                                            <span style="font-size: 0.68rem; color: rgba(255,255,255,0.6);">3ª y 4ª División • Lliga GuinotPrunera</span>
                                        </div>
                                    </div>
                                    <span style="font-size: 0.63rem; color: #38bdf8; font-weight: 900; background: rgba(56,189,248,0.15); padding: 3px 8px; border-radius: 6px; white-space: nowrap;">3 EQUIPOS</span>
                                </div>

                                <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(236,72,153,0.25); border-radius: 14px; padding: 11px 13px; display: flex; align-items: center; justify-content: space-between;">
                                    <div style="display: flex; align-items: center; gap: 12px;">
                                        <div style="width: 36px; height: 36px; border-radius: 10px; background: rgba(236,72,153,0.15); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                            <i class="fas fa-venus" style="color: #ec4899;"></i>
                                        </div>
                                        <div>
                                            <h4 style="margin: 0; font-size: 0.85rem; font-weight: 850; color: white;">Femeninos (2F, 4FA)</h4>
                                            <span style="font-size: 0.68rem; color: rgba(255,255,255,0.6);">2ª y 4ª División • Lliga GuinotPrunera</span>
                                        </div>
                                    </div>
                                    <span style="font-size: 0.63rem; color: #f472b6; font-weight: 900; background: rgba(244,114,182,0.15); padding: 3px 8px; border-radius: 6px; white-space: nowrap;">2 EQUIPOS</span>
                                </div>

                                <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(245,158,11,0.25); border-radius: 14px; padding: 11px 13px; display: flex; align-items: center; justify-content: space-between;">
                                    <div style="display: flex; align-items: center; gap: 12px;">
                                        <div style="width: 36px; height: 36px; border-radius: 10px; background: rgba(245,158,11,0.15); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                            <i class="fas fa-handshake" style="color: #f59e0b;"></i>
                                        </div>
                                        <div>
                                            <h4 style="margin: 0; font-size: 0.85rem; font-weight: 850; color: white;">Mixtos (3XA, 4XA, 4XB)</h4>
                                            <span style="font-size: 0.68rem; color: rgba(255,255,255,0.6);">3ª y 4ª División • Lliga GuinotPrunera</span>
                                        </div>
                                    </div>
                                    <span style="font-size: 0.63rem; color: #fbbf24; font-weight: 900; background: rgba(251,191,36,0.15); padding: 3px 8px; border-radius: 6px; white-space: nowrap;">3 EQUIPOS</span>
                                </div>
                            </div>

                            <button onclick="event.stopPropagation(); window.StoryFeedWidget.hideStory(); window.dashNavigate('equipos', 'equipos_story');" style="width: 100%; background: linear-gradient(135deg, #38bdf8 0%, #0ea5e9 50%, #1d4ed8 100%); color: white; border: none; padding: 13px; border-radius: 14px; font-size: 0.82rem; font-weight: 900; cursor: pointer; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(14,165,233,0.35);">VER EQUIPOS Y CONVOCATORIAS</button>
                        </div>
                    `;
                    break;
                case 'tournaments':
                    contentHtml = `
                        <div style="color: white; width: 100%; max-width: 420px; display: flex; flex-direction: column; animation: enterStoryCard 0.35s ease-out;">
                            <div style="text-align: center; margin-bottom: 16px;">
                                <span style="background: rgba(245,158,11,0.18); color: #f59e0b; border: 1px solid rgba(245,158,11,0.35); padding: 4px 14px; border-radius: 50px; font-weight: 950; font-size: 0.65rem; letter-spacing: 0.8px;">CIRCUITO DE TORNEOS</span>
                                <h2 style="font-size: 1.85rem; font-weight: 950; margin: 8px 0 4px; font-family: 'Outfit', sans-serif;">TORNEOS & <span style="color: #fb923c;">AMERICANAS</span></h2>
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

                            <button onclick="event.stopPropagation(); window.StoryFeedWidget.hideStory(); window.dashNavigate('americanas', 'tournaments_story');" style="width: 100%; background: linear-gradient(135deg, #fb923c 0%, #ea580c 50%, #c2410c 100%); color: white; border: none; padding: 13px; border-radius: 14px; font-size: 0.82rem; font-weight: 950; cursor: pointer; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(245,158,11,0.35);">VER CALENDARIO E INSCRIBIRME</button>
                        </div>
                    `;
                    break;
                case 'clima':
                    contentHtml = `
                        <div style="color: white; width: 100%; max-width: 420px; display: flex; flex-direction: column; animation: enterStoryCard 0.35s ease-out;">
                            <div style="text-align: center; margin-bottom: 16px;">
                                <span style="background: rgba(6,182,212,0.18); color: #38bdf8; border: 1px solid rgba(56,189,248,0.35); padding: 4px 14px; border-radius: 50px; font-weight: 950; font-size: 0.65rem; letter-spacing: 0.8px;">TELEMETRÍA & PISTAS</span>
                                <h2 style="font-size: 1.85rem; font-weight: 950; margin: 8px 0 4px; font-family: 'Outfit', sans-serif;">NUEVO RADAR <span style="color: #38bdf8;">TÁCTICO</span></h2>
                                <p style="color: rgba(255,255,255,0.6); font-size: 0.75rem; margin: 0; font-weight: 600;">Ahora disponible en Americanas y Entrenos</p>
                            </div>

                            <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px;">
                                <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(56,189,248,0.25); border-radius: 14px; padding: 12px 14px; display: flex; align-items: center; gap: 12px;">
                                    <div style="width: 38px; height: 38px; border-radius: 10px; background: rgba(6,182,212,0.15); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                        <i class="fas fa-satellite-dish" style="color: #38bdf8; font-size: 1.1rem;"></i>
                                    </div>
                                    <div>
                                        <h4 style="margin: 0; font-size: 0.86rem; font-weight: 850; color: white;">Radar Interactivo en Vivo</h4>
                                        <span style="font-size: 0.68rem; color: rgba(255,255,255,0.6);">Capas de viento, lluvia y presión atmosférica en Barcelona.</span>
                                    </div>
                                </div>

                                <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(56,189,248,0.25); border-radius: 14px; padding: 12px 14px; display: flex; align-items: center; gap: 12px;">
                                    <div style="width: 38px; height: 38px; border-radius: 10px; background: rgba(6,182,212,0.15); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                        <i class="fas fa-table-tennis" style="color: #38bdf8; font-size: 1.1rem;"></i>
                                    </div>
                                    <div>
                                        <h4 style="margin: 0; font-size: 0.86rem; font-weight: 850; color: white;">Condiciones de Pistas El Prat & Cornellà</h4>
                                        <span style="font-size: 0.68rem; color: rgba(255,255,255,0.6);">Humedad en cristal, bote de bola y recomendaciones tácticas.</span>
                                    </div>
                                </div>

                                <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(56,189,248,0.25); border-radius: 14px; padding: 12px 14px; display: flex; align-items: center; gap: 12px;">
                                    <div style="width: 38px; height: 38px; border-radius: 10px; background: rgba(6,182,212,0.15); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                        <i class="fas fa-location-arrow" style="color: #38bdf8; font-size: 1.1rem;"></i>
                                    </div>
                                    <div>
                                        <h4 style="margin: 0; font-size: 0.86rem; font-weight: 850; color: white;">¿Dónde encontrarlo?</h4>
                                        <span style="font-size: 0.68rem; color: rgba(255,255,255,0.6);">En la pestaña <strong>CLIMA & RADAR</strong> de Americanas o Entrenos, y en el menú lateral.</span>
                                    </div>
                                </div>
                            </div>

                            <button onclick="event.stopPropagation(); window.StoryFeedWidget.hideStory(); if (window.Router) { window.Router.navigate('clima'); } else if (window.EventsController) { window.EventsController.setTab('meteo'); }" style="width: 100%; background: linear-gradient(135deg, #38bdf8 0%, #0284c7 100%); color: #000; border: none; padding: 13px; border-radius: 14px; font-size: 0.84rem; font-weight: 950; cursor: pointer; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(56,189,248,0.35);">VER RADAR & CONDICIONES AHORA</button>
                        </div>
                    `;
                    break;
            }

            modal.innerHTML = `
                <!-- BARRAS DE PROGRESO SEGMENTADAS -->
                <div class="story-progress-v3">
                    ${this.stories.map((s, i) => `
                        <div class="story-bar-v3">
                            <div id="story-fill-${i}" class="story-fill-v3" style="transform: scaleX(${i < index ? 1 : 0})"></div>
                        </div>
                    `).join('')}
                </div>

                <!-- TOP BAR HEADER VIP -->
                <div style="position: absolute; top: env(safe-area-inset-top, 16px); left: 0; right: 0; padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; z-index: 1001; background: linear-gradient(180deg, rgba(0,0,0,0.68) 0%, transparent 100%);">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 36px; height: 36px; border-radius: 50%; background: ${story.ringGradient || story.color}; display: flex; align-items: center; justify-content: center; padding: 2px; box-shadow: 0 0 12px ${story.color}80;">
                            <div style="width: 100%; height: 100%; border-radius: 50%; background: #ffffff; display: flex; align-items: center; justify-content: center;">
                                <i class="fas ${story.icon}" style="color: ${story.color}; font-size: 0.95rem;"></i>
                            </div>
                        </div>
                        <div>
                            <span style="font-weight: 900; font-size: 0.86rem; text-transform: uppercase; color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.6); font-family: 'Outfit', sans-serif; display: block; line-height: 1.1;">${story.label}</span>
                            <span style="font-size: 0.58rem; color: rgba(255,255,255,0.65); font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">SomosPadel Pro</span>
                        </div>
                    </div>
                    <button onclick="window.StoryFeedWidget.hideStory(event)" style="background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.22); color: white; font-size: 1.1rem; cursor: pointer; text-shadow: 0 2px 4px rgba(0,0,0,0.6); padding: 5px; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 50%; backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);" onmousedown="this.style.transform='scale(0.91)'" onmouseup="this.style.transform='scale(1)'">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <!-- ÁREA PRINCIPAL DE CONTENIDO -->
                <div style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 75px 18px 25px; z-index: 1000; position: relative; box-sizing: border-box; width: 100%;">
                    ${contentHtml}
                </div>

                <!-- BOTONES FLOTANTES DE NAVEGACIÓN RÁPIDA (‹ Y ›) -->
                ${index > 0 ? `
                    <button onclick="event.stopPropagation(); window.StoryFeedWidget.prevStory();" class="story-nav-btn story-nav-prev" title="Historia anterior" aria-label="Anterior">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                ` : ''}

                <button onclick="event.stopPropagation(); window.StoryFeedWidget.nextStory();" class="story-nav-btn story-nav-next" title="Historia siguiente" aria-label="Siguiente">
                    <i class="fas fa-chevron-right"></i>
                </button>
            `;

            modal.style.display = 'flex';

            // CONFIGURAR CONTROL TÁCTIL TOTAL (DESLIZAR SWIPE IZQ/DER + CLIC LATERAL RÁPIDO + HOLD TO PAUSE)
            let touchStartX = 0;
            let touchStartY = 0;
            let touchStartTime = 0;
            let isHolding = false;
            let holdTimer = null;

            modal.ontouchstart = (e) => {
                if (e.touches && e.touches.length === 1) {
                    touchStartX = e.touches[0].clientX;
                    touchStartY = e.touches[0].clientY;
                    touchStartTime = Date.now();
                    isHolding = false;
                    if (holdTimer) clearTimeout(holdTimer);
                    holdTimer = setTimeout(() => {
                        isHolding = true;
                        this.pauseStory();
                    }, 240);
                }
            };

            modal.ontouchmove = (e) => {
                if (e.touches && e.touches.length === 1) {
                    const moveX = Math.abs(e.touches[0].clientX - touchStartX);
                    const moveY = Math.abs(e.touches[0].clientY - touchStartY);
                    if (moveX > 10 || moveY > 10) {
                        if (holdTimer) clearTimeout(holdTimer);
                    }
                }
            };

            modal.ontouchend = (e) => {
                if (holdTimer) clearTimeout(holdTimer);
                if (isHolding) {
                    isHolding = false;
                    this.resumeStory();
                    return;
                }

                if (!e.changedTouches || e.changedTouches.length === 0) return;
                const endX = e.changedTouches[0].clientX;
                const endY = e.changedTouches[0].clientY;
                const diffX = endX - touchStartX;
                const diffY = endY - touchStartY;
                const elapsed = Date.now() - touchStartTime;

                // 1. Detección de Swipe Horizontal (Deslizar a la izquierda o derecha)
                if (Math.abs(diffX) > 36 && Math.abs(diffX) > Math.abs(diffY) * 1.15) {
                    if (diffX < 0) {
                        // Deslizó hacia la izquierda -> Siguiente historia
                        this.nextStory();
                    } else {
                        // Deslizó hacia la derecha -> Historia anterior
                        this.prevStory();
                    }
                    return;
                }

                // 2. Detección de Toque Rápido Lateral (Tap izq / der)
                if (elapsed < 350 && Math.abs(diffX) < 16 && Math.abs(diffY) < 16) {
                    // Si pulsó sobre un botón de acción, input o close, no interferir
                    if (e.target && e.target.closest('button, input, a, select, textarea, .story-nav-btn')) {
                        return;
                    }

                    if (endX < window.innerWidth * 0.38) {
                        this.prevStory();
                    } else {
                        this.nextStory();
                    }
                }
            };

            // Listener para Desktop (Clic izquierdo o derecho en el fondo)
            modal.onclick = (e) => {
                if (e.target && e.target.closest('button, input, a, select, textarea, .story-nav-btn')) {
                    return;
                }
                const clickX = e.clientX;
                if (clickX < window.innerWidth * 0.38) {
                    this.prevStory();
                } else {
                    this.nextStory();
                }
            };

            // Iniciar animación de barra de progreso
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

            try {
                if (navigator.vibrate) navigator.vibrate(8);
            } catch (_) {}

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

            try {
                if (navigator.vibrate) navigator.vibrate(8);
            } catch (_) {}

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

            this.isHeaderModalOpen = false;

            const modal = document.getElementById('story-v3-modal');
            if (modal) {
                modal.style.pointerEvents = 'none';
                modal.style.animation = 'storyModalExit 0.24s both cubic-bezier(0.19, 1, 0.22, 1)';

                if (this.hideTimeout) clearTimeout(this.hideTimeout);
                this.hideTimeout = setTimeout(() => {
                    modal.style.display = 'none';
                    modal.innerHTML = '';
                    modal.style.animation = '';
                    modal.style.pointerEvents = '';
                    this.hideTimeout = null;
                }, 240);
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
                    searchResults.innerHTML = filtered.slice(0, 10).map((p) => `
                        <div style="display:flex; align-items:center; gap:15px; background:rgba(251,113,133,0.1); padding:12px 15px; border-radius:15px; border:1px solid rgba(251,113,133,0.2);">
                            <div style="font-weight:800; font-size:0.9rem; text-transform:uppercase; flex:1;">${p.name || 'Pro Player'}</div>
                            <div style="font-weight:900; color:#fb7185; font-size:0.9rem;">${Math.round((p.stats?.americanas?.points || 0) + (p.stats?.entrenos?.points || 0) || (p.points || 0))} PTS</div>
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
    console.log('💎 StoryFeedWidget Pro Elite Edition cargado con éxito');

    // Inicialización automática del Header Story Rotator
    function initHeaderRotatorAuto() {
        if (window.StoryFeedWidget && typeof window.StoryFeedWidget.renderHeaderRotator === 'function') {
            const rotEl = document.getElementById('header-story-rotator');
            if (rotEl) {
                window.StoryFeedWidget.renderHeaderRotator('header-story-rotator');
            }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHeaderRotatorAuto);
    } else {
        initHeaderRotatorAuto();
    }
    // NOTA: NO añadir listener en 'load' — ya se llama arriba si el DOM está listo,
    // o en DOMContentLoaded si no. Duplicarlo causaría dos setInterval en el rotador.
})();

