/**
 * SmartTicker.js - AI & BIG DATA EDITION V2
 * Sistema ultra-inteligente de ticker con animación controlada y contenido masivo.
 */

(function () {
    class SmartTicker {
        constructor() {
            this.tickerElement = null;
            this.updateInterval = null;
            this.messages = [];
            this.lastFetch = 0;
        }

        init() {
            this.container = document.querySelector('.ticker-container');
            this.tickerElement = document.getElementById('ticker-track');
            if (!this.tickerElement) return;

            // INYECTAR BADGE DINÁMICO (Si no existe)
            if (!document.querySelector('.ticker-brand-badge')) {
                const badge = document.createElement('div');
                badge.className = 'ticker-brand-badge';
                badge.innerHTML = '<i class="fas fa-lightbulb"></i> CONSEJO';
                this.container.appendChild(badge);
            }

            // INYECTAR ESTILOS DE ANIMACIÓN PERSONALIZADOS
            this.injectStyles();

            // Primera carga
            this.update();

            // Actualizar datos cada 5 minutos
            this.updateInterval = setInterval(() => this.update(), 300000);

            // Escuchar notificaciones en tiempo real
            if (window.NotificationService) {
                window.NotificationService.onUpdate(() => this.update());
            }
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
                    width: max-content;
                    animation: ticker-scroll-pro 135s linear infinite !important; 
                    padding-left: 170px; /* Wider space for badge */
                    position: relative;
                    z-index: 5; /* Above the overlay */
                    height: 100%;
                    align-items: center;
                }

                .ticker-track:hover {
                    animation-play-state: paused !important;
                }

                .ticker-item {
                    flex-shrink: 0;
                    display: flex;
                    align-items: center;
                    padding: 0 40px;
                    height: 100%;
                    position: relative;
                }

                .ticker-item::after {
                    content: '|';
                    color: rgba(255,255,255,0.2);
                    margin-left: 40px;
                    font-weight: 100;
                    font-size: 1.2rem;
                }

                /* CATEGORY TAGS - HIGH CONTRAST */
                .ticker-label-tag {
                    padding: 2px 12px;
                    border-radius: 4px;
                    font-weight: 900;
                    font-size: 0.65rem;
                    margin-right: 15px;
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.5);
                    border: 1px solid rgba(255,255,255,0.2);
                    white-space: nowrap;
                }

                .ticker-text {
                    color: #FFFFFF !important; /* Force true white */
                    font-weight: 700;
                    font-size: 0.9rem;
                    white-space: nowrap;
                    letter-spacing: 0.2px;
                    font-family: 'Outfit', sans-serif;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.8);
                }

                /* COLOR SCHEME - TV BROADCAST STANDARD */
                .tag-breaking { background: #FF5500 !important; color: #fff; box-shadow: 0 0 15px rgba(255, 85, 0, 0.4); }
                .tag-live { background: #ef4444 !important; color: #fff; box-shadow: 0 0 15px rgba(239, 68, 68, 0.4); animation: pulseLiveSlow 2s infinite; }
                .tag-academy { background: #CCFF00 !important; color: #000; box-shadow: 0 0 15px rgba(204, 255, 0, 0.4); }
                .tag-science { background: #0ea5e9 !important; color: #fff; box-shadow: 0 0 15px rgba(14, 165, 233, 0.4); }
                .tag-mindset { background: #f59e0b !important; color: #fff; box-shadow: 0 0 15px rgba(245, 158, 11, 0.4); }
                .tag-ranking { background: #8b5cf6 !important; color: #fff; box-shadow: 0 0 15px rgba(139, 92, 246, 0.4); }

                @keyframes pulseLiveSlow {
                    0% { opacity: 1; }
                    50% { opacity: 0.8; }
                    100% { opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }

        async update() {
            this.messages = await this.generateMassiveContent();
            this.render();
        }

        async generateMassiveContent() {
            let insights = [];

            // 1. PULSOS DE LA COMUNIDAD (DYNAMIC)
            try {
                if (window.AmericanaService) {
                    const am = await window.AmericanaService.getActiveAmericanas();
                    am.filter(a => a.status === 'live').forEach(a => {
                        insights.push({
                            label: 'EN DIRECTO', icon: 'fa-video',
                            text: `Cámara activa en Torneo: ${a.name.toUpperCase()}. ¡Mira los puntazos!`,
                            class: 'tag-live'
                        });
                    });
                }
            } catch (e) { }

            // 2. EL MANUAL DEL MAESTRO (WIPED & REGENERATED)
            const library = {
                secrets: [
                    "🚀 REMATE X3: Golpea la bola en su punto más alto y busca el pico del cristal lateral.",
                    "🤫 LA CHIQUITA: Tira suave a los pies del rival cuando suba a la red para forzar un globo cómodo.",
                    "🛡️ BLOQUEO: En la red, si te tiran al cuerpo, no muevas la pala, solo firmeza y bloqueo.",
                    "🧗 SALIDA DE PISTA: Si el cristal es bajo y la bola sale, ¡corre! Un punto ganado fuera vale doble moral.",
                    "🧱 DOBLE PARED: Acompaña la bola con el cuerpo, no solo con el brazo. Sé uno con el cristal.",
                    "🎭 AMAGO: Amaga el remate potente y deja una dejada suave. Destruye la mente del rival."
                ],
                equipment: [
                    "🎾 BOLAS: Una bola nueva bota 20cm más que una usada. Ajusta tu fuerza en el primer set.",
                    "🧤 GRIP: Si te suda la mano, cambia el overgrip cada 3 partidos. El control empieza en el mango.",
                    "🏸 BALANCE: Pala cabezona = más potencia. Pala hacia el puño = más control y menos lesiones.",
                    "👟 SUELA OMNI: Ideal para pistas de césped artificial sin arena. Máximo agarre lateral."
                ],
                advanced_tactics: [
                    "📐 ÁNGULOS: Cuanto más cerca estés de la red, más ángulo tienes para sacar la bola por el lateral.",
                    "🔄 RELEVO: Si tu compañero cruza a tu lado, tú debes cubrir el suyo inmediatamente.",
                    "🌑 NEVERA PSICOLÓGICA: No solo no le tires, ni le mires. Que pierda la conexión con el partido.",
                    "🔥 PRESION AL SAQUE: Resta siempre profundo y al centro para anular el ataque del saque."
                ],
                pro_tips: [
                    "🧘 RESPIRACIÓN: Expulsa el aire al golpear. Te da un 10% más de potencia estable.",
                    "👀 MIRADA: Nunca quites el ojo de la bola hasta que impacte en tu pala. Parece obvio, no lo es.",
                    "🏃 PIES: Nunca estés estático. El pequeño 'saltito' antes del golpe rival activa tus reflejos."
                ]
            };

            const getRandom = (arr, n) => arr.sort(() => Math.random() - 0.5).slice(0, n);

            // Generar Mix de Expertos
            getRandom(library.secrets, 4).forEach(t => insights.push({ label: 'SECRETOS PRO', icon: 'fa-user-ninja', text: t, class: 'tag-academy' }));
            getRandom(library.equipment, 3).forEach(e => insights.push({ label: 'EQUIPAMIENTO', icon: 'fa-mitten', text: e, class: 'tag-science' }));
            getRandom(library.advanced_tactics, 3).forEach(a => insights.push({ label: 'TÁCTICA ELITE', icon: 'fa-chess', text: a, class: 'tag-ranking' }));
            getRandom(library.pro_tips, 3).forEach(p => insights.push({ label: 'CONSEJO PRO', icon: 'fa-lightbulb', text: p, class: 'tag-mindset' }));

            // 3. ALERTAS DE ÚLTIMA HORA
            try {
                if (window.NotificationService && window.NotificationService.notifications) {
                    const notifs = window.NotificationService.notifications.filter(n => !n.read).slice(0, 3);
                    notifs.forEach(n => {
                        insights.unshift({ label: 'CONSEJO', icon: 'fa-lightbulb', text: `${n.title}: ${n.body}`, class: 'tag-breaking' });
                    });
                }
            } catch (e) { }

            // Branding Especial
            insights.push({ label: 'SOMOSPADEL BCN', icon: 'fa-crown', text: "La mayor comunidad de pádel de Barcelona. ¡Sigue compitiendo!", class: 'tag-ranking' });

            return insights;
        }

        render() {
            if (!this.tickerElement || this.messages.length === 0) return;

            // Barajar para que cada entrada sea única
            const shuffled = [...this.messages].sort(() => Math.random() - 0.5);

            // Repetir para scroll infinito fluido
            const finalContent = [...shuffled, ...shuffled, ...shuffled];

            const html = finalContent.map(msg => {
                const icon = msg.icon || 'fa-info-circle';
                const tagClass = msg.class || '';

                return `
                    <div class="ticker-item">
                        <div class="ticker-label-tag ${tagClass}">
                            <i class="fas ${icon}"></i> ${msg.label}
                        </div>
                        <div class="ticker-text">
                            ${msg.text}
                        </div>
                    </div>
                `;
            }).join('');

            this.tickerElement.innerHTML = html;
        }
    }

    // Instancia Global
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.SmartTicker = new SmartTicker();
            window.SmartTicker.init();
        });
    } else {
        window.SmartTicker = new SmartTicker();
        window.SmartTicker.init();
    }
})();
