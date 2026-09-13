/**
 * SmartTicker.js - BROADCAST SPORTS BAR & PRO TIPS EDITION
 * Sistema inteligente de ticker estilo Premier Padel / ESPN / DAZN con modal interactivo y animación controlada.
 */

(function () {
    class SmartTickerModal {
        static open(item) {
            if (!item) return;
            this.close(true); // limpiar si hubiera otro abierto

            // Pausar el ticker mientras el modal esté visible
            const container = document.querySelector('.ticker-container');
            if (container) container.classList.add('is-paused');

            // Haptic feedback
            if (window.PlayerView && typeof window.PlayerView.haptic === 'function') {
                try { window.PlayerView.haptic(15); } catch (e) { }
            }

            const overlay = document.createElement('div');
            overlay.id = 'sp-smart-ticker-modal';
            overlay.className = 'sp-ticker-modal-overlay';
            overlay.setAttribute('role', 'dialog');
            overlay.setAttribute('aria-modal', 'true');
            overlay.setAttribute('aria-labelledby', 'ticker-modal-title');

            // Generar lista de consejos tácticos
            let tacticalListHtml = '';
            if (Array.isArray(item.tacticalTip) && item.tacticalTip.length > 0) {
                tacticalListHtml = item.tacticalTip
                    .map(tip => `<li><i class="fas fa-crosshairs"></i> <span>${tip}</span></li>`)
                    .join('');
            } else if (item.tacticalTip) {
                tacticalListHtml = `<li><i class="fas fa-crosshairs"></i> <span>${item.tacticalTip}</span></li>`;
            } else {
                tacticalListHtml = `<li><i class="fas fa-crosshairs"></i> <span>Aplica este concepto en tu próximo partido en SomosPadel.</span></li>`;
            }

            // Botón de acción principal
            let actionBtnHtml = '';
            if (item.action && item.action.label) {
                actionBtnHtml = `
                    <button type="button" class="sp-ticker-btn-action" id="sp-ticker-action-btn">
                        <i class="fas ${item.action.icon || 'fa-arrow-right'}"></i>
                        <span>${item.action.label}</span>
                    </button>
                `;
            }

            overlay.innerHTML = `
                <div class="sp-ticker-modal-backdrop" id="sp-ticker-backdrop"></div>
                <div class="sp-ticker-modal-container">
                    <div class="sp-ticker-modal-card">
                        <!-- Grabber táctil para mobile bottom-sheet -->
                        <div class="sp-ticker-sheet-grabber"></div>

                        <!-- Header con Badge de Categoría y Cerrar -->
                        <div class="sp-ticker-modal-header">
                            <div class="sp-ticker-modal-badge ${item.class || 'tag-protip'}">
                                <i class="fas ${item.icon || 'fa-lightbulb'}"></i>
                                <span>${item.label || 'PRO TIP'}</span>
                            </div>
                            <button type="button" class="sp-ticker-modal-close" id="sp-ticker-close-btn" aria-label="Cerrar modal">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>

                        <!-- Título Deportivo -->
                        <h3 class="sp-ticker-modal-title" id="ticker-modal-title">${item.title || item.text}</h3>

                        <!-- Explicación Detallada -->
                        <div class="sp-ticker-modal-body">
                            <p>${item.detail || item.text}</p>
                        </div>

                        <!-- Caja de Clave Táctica Visual -->
                        <div class="sp-ticker-tactical-box">
                            <div class="sp-ticker-tactical-header">
                                <i class="fas fa-bullseye"></i>
                                <span>CLAVE TÁCTICA SOMOSPADEL</span>
                            </div>
                            <ul class="sp-ticker-tactical-list">
                                ${tacticalListHtml}
                            </ul>
                        </div>

                        <!-- Botones de Acción -->
                        <div class="sp-ticker-modal-footer">
                            ${actionBtnHtml}
                            <button type="button" class="sp-ticker-btn-secondary" id="sp-ticker-dismiss-btn">
                                <span>ENTENDIDO</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);
            document.body.style.overflow = 'hidden';

            // Entrada animada
            requestAnimationFrame(() => {
                overlay.classList.add('sp-ticker-visible');
            });

            // Handlers de cierre y acción
            const close = () => this.close();
            document.getElementById('sp-ticker-backdrop')?.addEventListener('click', close);
            document.getElementById('sp-ticker-close-btn')?.addEventListener('click', close);
            document.getElementById('sp-ticker-dismiss-btn')?.addEventListener('click', close);

            const actionBtn = document.getElementById('sp-ticker-action-btn');
            if (actionBtn && item.action) {
                actionBtn.addEventListener('click', () => {
                    if (item.action.type === 'copy') {
                        const copyText = `🎾 Consejo SomosPadel: ${item.title}\n\n${item.detail}\n\n💡 Clave:\n${Array.isArray(item.tacticalTip) ? item.tacticalTip.map(t => '• ' + t).join('\n') : item.tacticalTip}`;
                        if (navigator.clipboard && navigator.clipboard.writeText) {
                            navigator.clipboard.writeText(copyText).then(() => {
                                if (window.NotificationService && window.NotificationService.showToast) {
                                    window.NotificationService.showToast('¡Consejo copiado al portapapeles! 📋🎾', 'success');
                                }
                            }).catch(() => {
                                if (window.NotificationService && window.NotificationService.showToast) {
                                    window.NotificationService.showToast('Consejo guardado 🎾', 'info');
                                }
                            });
                        }
                        close();
                    } else if (typeof item.action.handler === 'function') {
                        close();
                        item.action.handler();
                    } else if (item.action.route && window.Router) {
                        close();
                        window.Router.navigate(item.action.route);
                    } else {
                        close();
                    }
                });
            }

            // Atajo con tecla Escape
            this._handleKeyDown = (e) => {
                if (e.key === 'Escape') this.close();
            };
            document.addEventListener('keydown', this._handleKeyDown);
        }

        static close(immediate = false) {
            const overlay = document.getElementById('sp-smart-ticker-modal');
            if (overlay) {
                if (immediate) {
                    overlay.remove();
                    document.body.style.overflow = '';
                } else {
                    overlay.classList.remove('sp-ticker-visible');
                    setTimeout(() => {
                        overlay.remove();
                        document.body.style.overflow = '';
                    }, 250);
                }
            }

            // Reanudar ticker
            const container = document.querySelector('.ticker-container');
            if (container) container.classList.remove('is-paused');

            if (this._handleKeyDown) {
                document.removeEventListener('keydown', this._handleKeyDown);
                this._handleKeyDown = null;
            }
        }
    }

    class SmartTicker {
        constructor() {
            this.container = null;
            this.tickerElement = null;
            this.updateInterval = null;
            this.messages = [];
            this.isInitialized = false;
        }

        init() {
            this.container = document.querySelector('.ticker-container');
            this.tickerElement = document.getElementById('ticker-track');
            if (!this.tickerElement || !this.container) return;

            // Inyectar o actualizar el badge estilo broadcast moderno con indicador LIVE
            this.setupBrandBadge();

            // Inyectar estilos scoped adicionales si faltasen
            this.injectStyles();

            // Configurar controles de pausa por interacción
            this.setupInteractionControls();

            // Primera carga de contenido
            this.update();

            // Actualización periódica cada 4 minutos
            if (this.updateInterval) clearInterval(this.updateInterval);
            this.updateInterval = setInterval(() => this.update(), 240000);

            // Escuchar notificaciones en tiempo real
            if (window.NotificationService && typeof window.NotificationService.onUpdate === 'function') {
                window.NotificationService.onUpdate(() => this.update());
            }

            // Escuchar el evento de cambio de campaña
            window.addEventListener('sp_campaign_status_changed', () => this.update());
            window.addEventListener('storage', (e) => { if (e.key === 'sp_season_campaign_active') this.update(); });

            this.isInitialized = true;
        }

        setupBrandBadge() {
            let badge = this.container.querySelector('.ticker-brand-badge');
            if (!badge) {
                badge = document.createElement('div');
                badge.className = 'ticker-brand-badge';
                this.container.appendChild(badge);
            }

            badge.setAttribute('title', 'SomosPadel Live Broadcast Feed');
            badge.setAttribute('role', 'button');
            badge.setAttribute('tabindex', '0');
            badge.innerHTML = `
                <span class="ticker-pulse-container">
                    <span class="ticker-pulse-ring"></span>
                    <span class="ticker-pulse-dot"></span>
                </span>
                <span class="ticker-badge-text-full">SP FEED</span>
                <span class="ticker-badge-text-mobile">LIVE</span>
            `;

            badge.onclick = (e) => {
                e.stopPropagation();
                if (window.PlayerView && typeof window.PlayerView.haptic === 'function') {
                    try { window.PlayerView.haptic(10); } catch (err) { }
                }
                SmartTickerModal.open({
                    label: 'SOMOSPADEL LIVE',
                    icon: 'fa-broadcast-tower',
                    class: 'tag-live',
                    title: 'Canal Broadcast SomosPadel Barcelona',
                    text: 'Noticias en vivo, avisos de competición, estado de pistas y táctica.',
                    detail: 'Este ticker informativo te mantiene al día en tiempo real sobre los torneos americanos activos, convocatorias de liga por equipos, evolución del ranking y consejos tácticos pro elaborados por nuestros entrenadores.',
                    tacticalTip: [
                        'Toca cualquier consejo o noticia del ticker para abrir su ficha táctica completa.',
                        'Pasa el ratón o mantén pulsado en móvil para pausar la barra y leer cómodamente.',
                        'Guarda los tips tácticos directamente en tu portapapeles con un toque.'
                    ],
                    action: {
                        label: 'EXPLORAR AMERICANAS',
                        icon: 'fa-trophy',
                        handler: () => {
                            if (window.Router) window.Router.navigate('americanas');
                        }
                    }
                });
            };
        }

        setupInteractionControls() {
            if (!this.container) return;

            // Pausar en hover (desktop)
            this.container.addEventListener('mouseenter', () => {
                this.container.classList.add('is-paused');
            });

            this.container.addEventListener('mouseleave', () => {
                if (!document.getElementById('sp-smart-ticker-modal')) {
                    this.container.classList.remove('is-paused');
                }
            });

            // Pausar en touch (mobile)
            this.container.addEventListener('touchstart', () => {
                this.container.classList.add('is-paused');
            }, { passive: true });

            this.container.addEventListener('touchend', () => {
                setTimeout(() => {
                    if (!document.getElementById('sp-smart-ticker-modal')) {
                        this.container.classList.remove('is-paused');
                    }
                }, 1200);
            }, { passive: true });

            // Delegación de clics en el track para abrir el modal
            this.tickerElement.addEventListener('click', (e) => {
                const itemEl = e.target.closest('.ticker-item');
                if (itemEl && itemEl.dataset.tickerIndex !== undefined) {
                    const idx = parseInt(itemEl.dataset.tickerIndex, 10);
                    this.openDetailModal(idx);
                }
            });
        }

        injectStyles() {
            const oldStyle = document.getElementById('ticker-style-custom');
            if (oldStyle) oldStyle.remove();

            const style = document.createElement('style');
            style.id = 'ticker-style-custom';
            style.innerHTML = `
                @keyframes ticker-scroll-pro {
                    0% { transform: translate3d(0, 0, 0); }
                    100% { transform: translate3d(-50%, 0, 0); }
                }
                
                .ticker-track {
                    display: flex;
                    align-items: center;
                    width: max-content;
                    animation: ticker-scroll-pro 95s linear infinite !important;
                    position: relative;
                    z-index: 5;
                    height: 100%;
                    will-change: transform;
                }

                .ticker-container:hover .ticker-track,
                .ticker-container.is-paused .ticker-track,
                .ticker-track:hover {
                    animation-play-state: paused !important;
                }
            `;
            document.head.appendChild(style);
        }

        async update() {
            this.messages = await this.generateMassiveContent();
            this.render();
        }

        async generateMassiveContent() {
            const insights = [];

            // 1. PULSOS DE LA COMUNIDAD & TORNEOS EN DIRECTO (DYNAMIC)
            try {
                if (window.AmericanaService) {
                    const activeEvents = await window.AmericanaService.getActiveAmericanas();
                    const liveEvents = activeEvents.filter(a => a.status === 'live');

                    if (liveEvents.length > 0) {
                        liveEvents.forEach(a => {
                            insights.push({
                                id: `live-${a.id}`,
                                category: 'live',
                                label: 'EN DIRECTO',
                                icon: 'fa-video',
                                class: 'tag-live',
                                title: `Torneo en Vivo: ${a.name || 'Americana SomosPadel'}`,
                                text: `Pistas en juego en ${a.name}. ¡Sigue los resultados punto a punto!`,
                                detail: `El torneo ${a.name} se está disputando en directo. La Torre de Control actualiza marcadores, cruces y clasificación de jugadores en tiempo real.`,
                                tacticalTip: [
                                    'Comprueba el estado de tus pistas y tiempo restante.',
                                    'Revisa los cruces de la siguiente ronda en pantalla.'
                                ],
                                action: {
                                    label: 'VER TORNEO EN VIVO',
                                    icon: 'fa-bolt',
                                    handler: () => {
                                        if (window.ControlTowerView) {
                                            window.ControlTowerView.prepareLoad(a.id);
                                            if (window.Router) window.Router.navigate('live');
                                        } else if (window.Router) {
                                            window.Router.navigate('americanas');
                                        }
                                    }
                                }
                            });
                        });
                    }
                }
            } catch (e) { }

            // Si no hay torneos live, destacar próxima americana
            if (!insights.some(i => i.category === 'live')) {
                insights.push({
                    id: 'americanas-hub',
                    category: 'live',
                    label: 'EN DIRECTO',
                    icon: 'fa-bolt',
                    class: 'tag-live',
                    title: 'Americanas y Torneos SomosPadel',
                    text: 'Pistas Centrales preparadas. ¡Reserva tu plaza en los próximos torneos!',
                    detail: 'Las Americanas de SomosPadel reúnen a jugadores de todos los niveles en un formato continuo con rotación de parejas, marcadores dinámicos y tercer tiempo.',
                    tacticalTip: [
                        'Formato dinámico sin eliminación directa: juegas todos los sets.',
                        'Suma puntos para el ranking general en cada juego disputado.'
                    ],
                    action: {
                        label: 'EXPLORAR AMERICANAS',
                        icon: 'fa-calendar-check',
                        handler: () => {
                            if (window.Router) window.Router.navigate('americanas');
                        }
                    }
                });
            }

            // 2. EQUIPOS SOMOSPADEL (CAMPANA DE TEMPORADA)
            let isCampaignActive = false;
            try {
                if (window.SeasonCampaignService) {
                    if (typeof window.SeasonCampaignService.isCampaignActive === 'function') {
                        isCampaignActive = await window.SeasonCampaignService.isCampaignActive();
                    } else if (typeof window.SeasonCampaignService.isCampaignActiveSync === 'function') {
                        isCampaignActive = window.SeasonCampaignService.isCampaignActiveSync();
                    }
                } else {
                    isCampaignActive = localStorage.getItem('sp_season_campaign_active') === 'true';
                }
            } catch (e) {
                isCampaignActive = false;
            }

            if (isCampaignActive === true) {
                insights.push({
                    id: 'equipos-campaign',
                    category: 'equipos',
                    label: 'EQUIPOS',
                    icon: 'fa-fire',
                    class: 'tag-equipos',
                    title: 'Inscripciones Equipos SomosPadel 2027',
                    text: 'Equipos SomosPadel (Fem 2ª-3ª-4ª, Mix 3ª-4ª, Masc 3ª-4ª). ¡Plazas limitadas!',
                    detail: 'Forma parte de los equipos oficiales de SomosPadel Barcelona en ligas federadas y comarcales. Incluye equipación oficial, capitanes experimentados, entrenamientos tácticos previos y gran ambiente de club.',
                    tacticalTip: [
                        'Categorías Femenino (2ª, 3ª y 4ª), Mixto (3ª y 4ª) y Masculino (3ª y 4ª).',
                        'Pruebas de nivel continuas para asignación de escuadras.',
                        'Prioridad de plaza por orden estricto de inscripción.'
                    ],
                    action: {
                        label: 'VER EQUIPOS E INSCRIBIRSE',
                        icon: 'fa-users',
                        handler: () => {
                            if (window.SeasonCampaignView && typeof window.SeasonCampaignView.openModal === 'function') {
                                window.SeasonCampaignView.openModal('equipos');
                            } else if (window.Router) {
                                window.Router.navigate('dashboard');
                            }
                        }
                    }
                });
            }

            // 3. RANKING & LIDERAZGO
            insights.push({
                id: 'ranking-general',
                category: 'ranking',
                label: 'RANKING',
                icon: 'fa-trophy',
                class: 'tag-ranking',
                title: 'Ranking Semanal SomosPadel Barcelona',
                text: 'Alejandro lidera el ranking de esta semana. ¡Suma puntos y escala posiciones!',
                detail: 'El ranking de la comunidad mide tu rendimiento ponderado en cada partido, torneo y liga. Vencer a rivales de mayor nivel otorga bonus de coeficiente ELO.',
                tacticalTip: [
                    'Cada victoria en americana pondera según el nivel de los oponentes.',
                    'Completar partidos limpios sin ceder juegos maximiza tu ratio.',
                    'El Top 8 clasifica automáticamente al Master Final de temporada.'
                ],
                action: {
                    label: 'CONSULTAR RANKING',
                    icon: 'fa-trophy',
                    handler: () => {
                        if (window.Router) window.Router.navigate('ranking');
                    }
                }
            });

            // 4. CLIMA PISTAS (WEATHER & COURT CONDITION)
            insights.push({
                id: 'clima-pistas',
                category: 'clima',
                label: 'CLIMA PISTAS',
                icon: 'fa-cloud-sun',
                class: 'tag-clima',
                title: 'Condición de Pistas & Rebote de Bola en Barcelona',
                text: 'Pistas de Barcelona: humedad controlada, rebote vivo en cristales y juego rápido.',
                detail: 'El estado meteorológico en Barcelona influye directamente en el comportamiento de la bola y el cristal. Hoy las pistas presentan un bote reactivo óptimo para el juego ofensivo y bajadas de pared agresivas.',
                tacticalTip: [
                    'Con humedad >70%: la bola cae pesada en el cristal, usa tiros más planos.',
                    'Con temperatura templada (>20°C): la bola vuela más, aprovecha el remate por 3.',
                    'Vigila la condensación en los cristales en pistas descubiertas al atardecer.'
                ],
                action: {
                    label: 'VER METEO DE PISTAS',
                    icon: 'fa-temperature-half',
                    handler: () => {
                        if (window.showWeatherDetails) {
                            window.showWeatherDetails();
                        } else if (window.DashboardView && window.DashboardView.toggleWeatherDetails) {
                            window.DashboardView.toggleWeatherDetails('EL_PRAT');
                        } else if (window.NotificationService && window.NotificationService.showToast) {
                            window.NotificationService.showToast('🌤️ Condiciones en Barcelona ideales para juego ofensivo', 'info');
                        }
                    }
                }
            });

            // 5. BIBLIOTECA PRO: SECRETOS, TÁCTICA & EQUIPAMIENTO
            const proTipsLibrary = [
                {
                    id: 'tip-remate-x3',
                    category: 'protip',
                    label: 'PRO TIP',
                    icon: 'fa-bolt',
                    class: 'tag-protip',
                    title: 'Remate por 3 Metros: Punto de Impacto',
                    text: 'Remate X3: Golpea la bola en su punto más alto y busca el pico del cristal lateral.',
                    detail: 'Para sacar la bola por la valla lateral de 3 metros, el secreto radica en la aceleración de muñeca y la posición corporal. Colócate de lado, impacta la bola en su punto más alto por encima de tu cabeza y cepíllala hacia afuera con efecto liftado.',
                    tacticalTip: [
                        'Pies perpendiculares a la pared de fondo para transferir el peso.',
                        'Impacto a las 12h: acelera el codo y termina la pronación hacia afuera.',
                        'Apunta al segundo cristal lateral para que el rebote vuele fuera de la pista.'
                    ],
                    action: { label: 'GUARDAR CONSEJO', icon: 'fa-copy', type: 'copy' }
                },
                {
                    id: 'tip-la-chiquita',
                    category: 'protip',
                    label: 'PRO TIP',
                    icon: 'fa-bullseye',
                    class: 'tag-protip',
                    title: 'La Chiquita: Neutraliza la Red Rival',
                    text: 'La Chiquita: Tira suave a los pies del rival cuando suba para forzar un globo cómodo.',
                    detail: 'La chiquita es el golpe táctico por excelencia para recuperar la red sin arriesgar un globo fácil. El objetivo no es hacer punto directo sino obligar al rival a levantar una bola incómoda por debajo del nivel de la red.',
                    tacticalTip: [
                        'No aceleres la pala: amortigua la fuerza de la bola con las piernas flexionadas.',
                        'Busca los pies del jugador que esté más pegado a la red.',
                        'Inmediatamente tras golpear, avanza un paso para cazar la volea flotante.'
                    ],
                    action: { label: 'GUARDAR CONSEJO', icon: 'fa-copy', type: 'copy' }
                },
                {
                    id: 'tip-bloqueo-red',
                    category: 'protip',
                    label: 'PRO TIP',
                    icon: 'fa-shield-halved',
                    class: 'tag-protip',
                    title: 'Bloqueo en la Red ante Bajadas Fuertes',
                    text: 'Bloqueo Firme: En la red, si te tiran al cuerpo, no muevas la pala: firmeza y bloqueo.',
                    detail: 'Cuando el rival te tira una bola rápida al cuerpo desde el fondo, el error más común es intentar armar un swing completo. Mantén la pala armada por delante del pecho y deja que la velocidad de su propio tiro haga el trabajo.',
                    tacticalTip: [
                        'Agarre firme en el momento del impacto sin retroceder la pala.',
                        'Apunta al centro de la pista rival para no regalar ángulos en el rebote.',
                        'Flexiona las rodillas para bajar tu centro de gravedad.'
                    ],
                    action: { label: 'GUARDAR CONSEJO', icon: 'fa-copy', type: 'copy' }
                },
                {
                    id: 'tip-doble-pared',
                    category: 'protip',
                    label: 'PRO TIP',
                    icon: 'fa-arrows-split-up-and-left',
                    class: 'tag-protip',
                    title: 'Doble Pared: Acompaña con el Giro Corporal',
                    text: 'Doble Pared: Acompaña la bola con el cuerpo, no solo con el brazo. Sé uno con el cristal.',
                    detail: 'En las dobles paredes que abren o cierran, el secreto es leer la trayectoria antes de que toque el primer cristal y rotar los hombros al compás del rebote.',
                    tacticalTip: [
                        'Mantén una distancia mínima de 1 metro respecto al cristal de fondo.',
                        'Deja pasar la bola por delante de tu cuerpo antes de ejecutar el impacto.',
                        'Asegura un tiro de salida alto y cruzado para recuperar posición.'
                    ],
                    action: { label: 'GUARDAR CONSEJO', icon: 'fa-copy', type: 'copy' }
                },
                {
                    id: 'tactica-nevera',
                    category: 'tactica',
                    label: 'TÁCTICA ELITE',
                    icon: 'fa-chess',
                    class: 'tag-tactica',
                    title: 'La Nevera Psicológica y el Ritmo del Partido',
                    text: 'Nevera Táctica: Identifica al rival frío o con dudas y aísla al rematador contrario.',
                    detail: 'Jugarle la mayoría de bolas al jugador con menor consistencia desactiva el ritmo competitivo de su compañero. La clave reside en mantener la calma y no apresurarse en definir.',
                    tacticalTip: [
                        'Varía alturas y efectos al jugador en la nevera para desgastarlo mentalmente.',
                        'Si te hacen la nevera a ti: mantén el cuerpo activo dando pequeños saltitos.',
                        'Comunícate constantemente con tu pareja para cerrar huecos en el centro.'
                    ],
                    action: { label: 'GUARDAR CONSEJO', icon: 'fa-copy', type: 'copy' }
                },
                {
                    id: 'tactica-resto-centro',
                    category: 'tactica',
                    label: 'TÁCTICA ELITE',
                    icon: 'fa-bullseye',
                    class: 'tag-tactica',
                    title: 'Resto al Centro: Anula el Saque Agresivo',
                    text: 'Presión al Saque: Resta cruzado bajo o al centro para anular el ángulo de ataque rival.',
                    detail: 'Restar al centro entre ambos rivales genera dudas sobre quién cubre la volea y evita que el sacador aproveche el ángulo abierto hacia el cristal.',
                    tacticalTip: [
                        'Prioriza profundidad sobre velocidad: el objetivo es que la bola bote detrás de la línea de saque.',
                        'Si el sacador sube muy rápido, busca un tiro raso que le obligue a agacharse.',
                        'Sube a la red únicamente cuando tu globo obligue al rival a retroceder a pared.'
                    ],
                    action: { label: 'GUARDAR CONSEJO', icon: 'fa-copy', type: 'copy' }
                },
                {
                    id: 'equipamiento-overgrip',
                    category: 'equipamiento',
                    label: 'EQUIPAMIENTO',
                    icon: 'fa-baseball-bat-ball',
                    class: 'tag-science',
                    title: 'Overgrip & Agarre Óptimo en Mano',
                    text: 'Overgrip Pro: Cámbialo cada 3-4 partidos. El control de pala empieza en el mango.',
                    detail: 'Un overgrip desgastado o resbaladizo obliga a apretar la mano con excesiva fuerza involuntaria, provocando fatiga prematura y sobrecargas en el antebrazo y codo.',
                    tacticalTip: [
                        'Utiliza overgrips microperforados si te sudan las manos en indoor.',
                        'El grosor correcto permite que quepa el dedo índice entre los dedos y la palma.',
                        'Revisa el tapón protector y el cordón de seguridad antes de cada torneo.'
                    ],
                    action: { label: 'GUARDAR CONSEJO', icon: 'fa-copy', type: 'copy' }
                },
                {
                    id: 'equipamiento-bolas',
                    category: 'equipamiento',
                    label: 'EQUIPAMIENTO',
                    icon: 'fa-circle-dot',
                    class: 'tag-science',
                    title: 'Presión de Bolas & Rebote en Pista',
                    text: 'Bolas Pro: Una bola nueva bota hasta un 25% más. Ajusta tu potencia en el primer set.',
                    detail: 'En las pistas de pádel la presión interna de las bolas disminuye rápidamente con el uso y el frío. Con bolas usadas deberás aportar mayor aceleración con el brazo en las salidas de pared.',
                    tacticalTip: [
                        'En el calentamiento: mide el bote de la bola en el cristal de fondo.',
                        'Con bolas rápidas: frena los remates y busca bandejas colocadas a la reja.',
                        'Con bolas pesadas: juega más al centro y evita los globos cortos.'
                    ],
                    action: { label: 'GUARDAR CONSEJO', icon: 'fa-copy', type: 'copy' }
                }
            ];

            // Mezclar y añadir una selección de tips
            const shuffledTips = [...proTipsLibrary].sort(() => Math.random() - 0.5);
            shuffledTips.forEach(tip => insights.push(tip));

            // 6. ALERTAS NO LEÍDAS (SI EXISTEN)
            try {
                if (window.NotificationService && Array.isArray(window.NotificationService.notifications)) {
                    const unread = window.NotificationService.notifications.filter(n => !n.read).slice(0, 2);
                    unread.forEach(n => {
                        insights.unshift({
                            id: `notif-${n.id || Math.random()}`,
                            category: 'notif',
                            label: 'AVISO CLUB',
                            icon: 'fa-bell',
                            class: 'tag-breaking',
                            title: n.title || 'Aviso de SomosPadel',
                            text: `${n.title}: ${n.body || ''}`,
                            detail: n.body || n.message || 'Tienes una nueva notificación activa en tu cuenta de SomosPadel.',
                            tacticalTip: [
                                'Consulta el centro de notificaciones en tu panel de control.',
                                'Mantén tus preferencias de contacto actualizadas.'
                            ],
                            action: {
                                label: 'IR AL PANEL',
                                icon: 'fa-house',
                                handler: () => {
                                    if (window.Router) window.Router.navigate('dashboard');
                                }
                            }
                        });
                    });
                }
            } catch (e) { }

            // Branding SomosPadel
            insights.push({
                id: 'branding-somospadel',
                category: 'ranking',
                label: 'SOMOSPADEL BCN',
                icon: 'fa-crown',
                class: 'tag-ranking',
                title: 'SomosPadel Barcelona: La Mayor Comunidad',
                text: 'La mayor comunidad de pádel de Barcelona. ¡Compite, entrena y suma puntos!',
                detail: 'SomosPadel organiza torneos americanos, entrenamientos grupales, ligas por equipos y partidas abiertas en los clubes más destacados de Barcelona y su área metropolitana.',
                tacticalTip: [
                    'Más de 30 sedes premium con pistas de última generación.',
                    'Ranking en tiempo real con estadísticas y coeficiente ELO.',
                    'Torre de Control digital en vivo para todos los torneos.'
                ],
                action: {
                    label: 'VER PRÓXIMOS EVENTOS',
                    icon: 'fa-calendar-days',
                    handler: () => {
                        if (window.Router) window.Router.navigate('americanas');
                    }
                }
            });

            return insights;
        }

        render() {
            if (!this.tickerElement || this.messages.length === 0) return;

            // Duplicar el array de mensajes para scroll infinito fluido y perfecto (-50%)
            const duplicateMessages = [...this.messages, ...this.messages];

            const html = duplicateMessages.map((msg, idx) => {
                const originalIndex = idx % this.messages.length;
                const icon = msg.icon || 'fa-circle-info';
                const tagClass = msg.class || 'tag-protip';

                return `
                    <div class="ticker-item" role="button" tabindex="0" data-ticker-index="${originalIndex}">
                        <span class="ticker-label-tag ${tagClass}">
                            <i class="fas ${icon}"></i> ${msg.label}
                        </span>
                        <span class="ticker-text">
                            ${msg.text}
                        </span>
                    </div>
                `;
            }).join('');

            this.tickerElement.innerHTML = html;
        }

        openDetailModal(identifier) {
            let item = null;
            if (typeof identifier === 'number') {
                item = this.messages[identifier] || this.messages[0];
            } else if (typeof identifier === 'object' && identifier !== null) {
                item = identifier;
            } else if (typeof identifier === 'string') {
                item = this.messages.find(m => m.id === identifier) || this.messages[0];
            }

            if (item) {
                SmartTickerModal.open(item);
            }
        }
    }

    // Exponer SmartTicker y SmartTickerModal globalmente
    window.SmartTickerModal = SmartTickerModal;
    window.SmartTicker = new SmartTicker();

    // Inicialización automática respetando el ciclo de vida del DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.SmartTicker.init();
        });
    } else {
        window.SmartTicker.init();
    }
})();
