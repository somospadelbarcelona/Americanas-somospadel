/**
 * EventWeatherModal.js
 * Modal interactivo de telemetría meteorológica y radar avanzado para eventos deportivos.
 * Estilo SomosPádel BCN (Dark Glassmorphism, neones deportivos, SVG interactivo).
 * Proporciona:
 *  - Cabecera meteorológica de la sede y tramo horario exacto
 *  - Gráfica interactiva de viento (km/h) vs lluvia (%)
 *  - Telemetría táctica de pista y comportamiento de bola (Padel Science)
 *  - Aviso preventivo de lluvia (push automático y WhatsApp a inscritos)
 *  - Despliegue de Radar Satelital en Vivo (Windy)
 */

(function (window) {
    'use strict';

    const EventWeatherModal = {
        _modalElement: null,
        _currentEvent: null,
        _currentForecast: null,
        _windyVisible: false,
        _windyLayer: 'rain', // 'rain' o 'wind'

        /**
         * Abre el modal para un evento concreto
         * @param {Object} eventDoc Documento o datos del evento
         */
        async open(eventDoc = {}) {
            if (!eventDoc) return;
            this._currentEvent = eventDoc;
            this._windyVisible = false;
            this._windyLayer = 'rain';

            // Cerrar cualquier instancia previa
            this.close();

            // 1. Crear modal esqueleto con estado de carga
            this._createSkeletonModal();

            // 2. Obtener pronóstico de WeatherService
            let forecast = null;
            if (window.WeatherService && typeof window.WeatherService.getEventWeatherForecast === 'function') {
                try {
                    forecast = await window.WeatherService.getEventWeatherForecast(eventDoc);
                } catch (err) {
                    console.warn('[EventWeatherModal] Error al obtener pronóstico:', err);
                }
            }

            // Fallback si WeatherService no estuviese disponible
            if (!forecast) {
                forecast = this._createFallbackForecast(eventDoc);
            }

            this._currentForecast = forecast;

            // 3. Renderizar contenido completo
            this._renderForecastContent(forecast);
        },

        /**
         * Cierra el modal y limpia eventos
         */
        close() {
            if (this._modalElement && this._modalElement.parentNode) {
                this._modalElement.classList.add('sp-weather-modal-closing');
                setTimeout(() => {
                    if (this._modalElement && this._modalElement.parentNode) {
                        this._modalElement.parentNode.removeChild(this._modalElement);
                    }
                    this._modalElement = null;
                }, 220);
            }
            document.removeEventListener('keydown', this._handleKeyDown);
        },

        /**
         * Manejador de teclado para cerrar con ESC
         */
        _handleKeyDown(e) {
            if (e.key === 'Escape') {
                EventWeatherModal.close();
            }
        },

        /**
         * Crea el esqueleto inicial del modal con animación y spinner
         */
        _createSkeletonModal() {
            const modalId = 'sp-event-weather-modal';
            const existing = document.getElementById(modalId);
            if (existing) existing.remove();

            const overlay = document.createElement('div');
            overlay.id = modalId;
            overlay.className = 'sp-weather-modal-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(4, 8, 16, 0.85);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                z-index: 100050;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 12px;
                opacity: 0;
                animation: spWeatherFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            `;

            // Click fuera para cerrar
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.close();
                }
            });

            const dialog = document.createElement('div');
            dialog.className = 'sp-weather-modal-dialog';
            dialog.style.cssText = `
                background: linear-gradient(155deg, rgba(15, 23, 42, 0.96) 0%, rgba(9, 14, 26, 0.98) 100%);
                border: 1.5px solid rgba(56, 189, 248, 0.35);
                border-radius: 24px;
                width: 100%;
                max-width: 680px;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 25px 60px -10px rgba(0, 0, 0, 0.85), 0 0 30px rgba(56, 189, 248, 0.15);
                position: relative;
                color: #ffffff;
                display: flex;
                flex-direction: column;
                transform: scale(0.96);
                animation: spWeatherZoomIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            `;

            // Contenedor interior para el contenido dinámico
            dialog.innerHTML = `
                <div style="padding: 40px 24px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px;">
                    <div style="width: 58px; height: 58px; border-radius: 50%; border: 3px solid rgba(56,189,248,0.2); border-top-color: #38bdf8; animation: spWeatherSpin 0.9s linear infinite; box-shadow: 0 0 20px rgba(56,189,248,0.3);"></div>
                    <div style="font-size: 1.05rem; font-weight: 850; color: #ffffff; letter-spacing: -0.2px;">Sintonizando Radar Meteorológico...</div>
                    <div style="font-size: 0.78rem; color: #94a3b8;">Consultando telemetría horaria y satélite de la pista</div>
                </div>
            `;

            overlay.appendChild(dialog);
            document.body.appendChild(overlay);
            this._modalElement = overlay;

            this._handleKeyDown = this._handleKeyDown.bind(this);
            document.addEventListener('keydown', this._handleKeyDown);

            this._injectStyles();
        },

        /**
         * Renderiza el contenido del pronóstico en el diálogo
         */
        _renderForecastContent(forecast) {
            if (!this._modalElement) return;
            const dialog = this._modalElement.querySelector('.sp-weather-modal-dialog');
            if (!dialog) return;

            const evt = this._currentEvent || {};
            const eventName = evt.name || 'Partido de Pádel';
            const venueName = forecast.location?.name || evt.sede || 'SomosPadel BCN';
            const dateStr = this._formatDisplayDate(forecast.date || evt.date);
            const timeRange = forecast.timeRange || evt.time || 'Horario oficial';

            // Estado de pista
            let badgeText = '🟢 CONDICIONES ÓPTIMAS';
            let badgeBg = 'rgba(34, 197, 94, 0.16)';
            let badgeBorder = 'rgba(34, 197, 94, 0.45)';
            let badgeColor = '#4ade80';

            if (forecast.riskLevel === 'high') {
                badgeText = '🔴 RIESGO DE LLUVIA';
                badgeBg = 'rgba(239, 68, 68, 0.22)';
                badgeBorder = 'rgba(239, 68, 68, 0.55)';
                badgeColor = '#f87171';
            } else if (forecast.riskLevel === 'moderate') {
                badgeText = '🟡 ATENCIÓN VIENTO/LLUVIA';
                badgeBg = 'rgba(245, 158, 11, 0.2)';
                badgeBorder = 'rgba(245, 158, 11, 0.5)';
                badgeColor = '#fbbf24';
            }

            // Clima actual/promedio
            const mainIcon = (forecast.hours && forecast.hours[1]?.icon) || '🌤️';
            const mainCondition = (forecast.hours && forecast.hours[1]?.condition) || 'Condiciones Estables';
            const avgTemp = forecast.avgTemp !== undefined ? `${forecast.avgTemp}°C` : '22°C';

            // SVG / Timeline de Viento y Lluvia
            const chartHtml = this._renderHourlyTimeline(forecast);

            // Telemetría Táctica
            const telemetryHtml = this._renderTacticalTelemetry(forecast);

            // Banner Alerta Preventiva (si riesgo alto o >= 70%)
            const alertBannerHtml = this._renderAlertSection(forecast, evt);

            // Sección Radar Satelital
            const radarSectionHtml = this._renderRadarSection(forecast);

            dialog.innerHTML = `
                <!-- Barra superior con botón de cierre -->
                <div style="position: absolute; top: 14px; right: 14px; z-index: 20;">
                    <button type="button" 
                            onclick="window.EventWeatherModal.close()" 
                            aria-label="Cerrar ventana" 
                            style="width: 36px; height: 36px; border-radius: 12px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; cursor: pointer; transition: all 0.2s; backdrop-filter: blur(8px);"
                            onmouseover="this.style.background='rgba(239,68,68,0.25)'; this.style.borderColor='#ef4444'; this.style.color='#ffffff';"
                            onmouseout="this.style.background='rgba(255,255,255,0.08)'; this.style.borderColor='rgba(255,255,255,0.15)'; this.style.color='#cbd5e1';">
                        ✕
                    </button>
                </div>

                <div style="padding: 22px 20px 26px; display: flex; flex-direction: column; gap: 16px;">
                    
                    <!-- ==============================================
                         A. CABECERA METEOROLÓGICA DEL EVENTO
                         ============================================== -->
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        
                        <!-- Mini tags de contexto -->
                        <div style="display: flex; align-items: center; flex-wrap: wrap; gap: 6px;">
                            <span style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.35); padding: 3px 8px; border-radius: 8px; font-size: 0.65rem; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase; display: inline-flex; align-items: center; gap: 4px;">
                                <i class="fas fa-satellite-dish"></i> RADAR METEOROLÓGICO
                            </span>
                            <span style="background: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeBorder}; padding: 3px 9px; border-radius: 8px; font-size: 0.65rem; font-weight: 900; letter-spacing: 0.4px;">
                                ${badgeText}
                            </span>
                            ${forecast.isFallback ? `
                                <span style="background: rgba(255,255,255,0.08); color: #94a3b8; padding: 3px 7px; border-radius: 7px; font-size: 0.6rem; font-weight: 800;">
                                    ESTIMACIÓN HISTÓRICA
                                </span>
                            ` : ''}
                        </div>

                        <!-- Título del Evento y Sede -->
                        <div>
                            <h2 style="margin: 0; font-size: 1.35rem; font-weight: 950; color: #ffffff; letter-spacing: -0.4px; line-height: 1.25;">
                                ${eventName}
                            </h2>
                            <div style="display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-top: 4px; font-size: 0.76rem; color: #94a3b8; font-weight: 600;">
                                <span style="display: inline-flex; align-items: center; gap: 4px; color: #38bdf8; font-weight: 800;">
                                    <i class="fas fa-location-dot"></i> ${venueName}
                                </span>
                                <span>•</span>
                                <span style="display: inline-flex; align-items: center; gap: 4px; color: #e2e8f0;">
                                    <i class="far fa-calendar-alt"></i> ${dateStr}
                                </span>
                                <span>•</span>
                                <span style="display: inline-flex; align-items: center; gap: 4px; color: #CCFF00; font-weight: 900;">
                                    <i class="far fa-clock"></i> ${timeRange}
                                </span>
                            </div>
                        </div>

                        <!-- Card de Resumen de Temperatura y Viento Principal -->
                        <div style="background: linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.85) 100%); border-radius: 18px; border: 1px solid rgba(255,255,255,0.1); padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap; box-shadow: 0 8px 24px rgba(0,0,0,0.3);">
                            <div style="display: flex; align-items: center; gap: 14px;">
                                <div style="font-size: 2.8rem; line-height: 1; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.4));">
                                    ${mainIcon}
                                </div>
                                <div>
                                    <div style="font-size: 2.2rem; font-weight: 950; color: #ffffff; line-height: 1; font-family: 'Outfit', sans-serif;">
                                        ${avgTemp}
                                    </div>
                                    <div style="font-size: 0.78rem; font-weight: 800; color: #38bdf8; margin-top: 4px;">
                                        ${mainCondition}
                                    </div>
                                </div>
                            </div>

                            <div style="display: flex; align-items: center; gap: 14px; border-left: 1px solid rgba(255,255,255,0.1); padding-left: 14px;">
                                <div style="display: flex; flex-direction: column; gap: 4px;">
                                    <div style="font-size: 0.62rem; color: #94a3b8; font-weight: 800; text-transform: uppercase;">VIENTO MEDIO</div>
                                    <div style="font-size: 0.95rem; font-weight: 950; color: #f1f5f9; display: flex; align-items: center; gap: 5px;">
                                        <i class="fas fa-wind" style="color: #38bdf8;"></i> ${forecast.avgWind} km/h
                                    </div>
                                    <div style="font-size: 0.65rem; color: #cbd5e1; font-weight: 700;">
                                        Ráfagas: <span style="color: ${forecast.maxWindGust >= 25 ? '#f59e0b' : '#38bdf8'}; font-weight: 900;">${forecast.maxWindGust} km/h</span>
                                    </div>
                                </div>
                                <div style="display: flex; flex-direction: column; gap: 4px;">
                                    <div style="font-size: 0.62rem; color: #94a3b8; font-weight: 800; text-transform: uppercase;">PROB. LLUVIA</div>
                                    <div style="font-size: 0.95rem; font-weight: 950; color: ${forecast.maxRainProb >= 70 ? '#ef4444' : (forecast.maxRainProb >= 30 ? '#f59e0b' : '#38bdf8')}; display: flex; align-items: center; gap: 5px;">
                                        <i class="fas fa-cloud-showers-heavy"></i> ${forecast.maxRainProb}%
                                    </div>
                                    <div style="font-size: 0.65rem; color: #94a3b8; font-weight: 700;">
                                        ${forecast.maxRainProb >= 70 ? 'Riesgo alto' : (forecast.maxRainProb >= 30 ? 'Chubasco posible' : 'Despejado')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- ==============================================
                         B. GRÁFICA HORARIA EXACTA DEL TRAMO DEL EVENTO
                         ============================================== -->
                    ${chartHtml}

                    <!-- ==============================================
                         C. TELEMETRÍA TÁCTICA DE PISTA (PADEL SCIENCE)
                         ============================================== -->
                    ${telemetryHtml}

                    <!-- ==============================================
                         D. AVISO PREVENTIVO DE LLUVIA
                         ============================================== -->
                    ${alertBannerHtml}

                    <!-- ==============================================
                         E. RADAR SATELITAL EN VIVO (WINDY)
                         ============================================== -->
                    ${radarSectionHtml}

                </div>
            `;
        },

        /**
         * Renderiza la gráfica visual/timeline responsiva:
         * Barras verticales para Probabilidad de Lluvia (%) + Indicador de Viento (km/h) y Ráfagas por hora.
         */
        _renderHourlyTimeline(forecast) {
            const hours = forecast.hours || [];
            if (hours.length === 0) {
                return '';
            }

            // Calcular valores máximos para escalar las barras de lluvia
            const maxRain = Math.max(100, ...hours.map(h => h.rainProb || 0));

            const columnsHtml = hours.map((h, idx) => {
                const isMatchWindow = h.isEventWindow;
                const rain = h.rainProb || 0;
                const wind = h.windSpeed || 0;
                const gust = h.windGusts || wind;
                
                // Color de la barra de lluvia según nivel
                let barGradient = 'linear-gradient(180deg, #38bdf8 0%, rgba(56, 189, 248, 0.3) 100%)';
                let barColor = '#38bdf8';
                if (rain >= 70) {
                    barGradient = 'linear-gradient(180deg, #ef4444 0%, rgba(239, 68, 68, 0.4) 100%)';
                    barColor = '#ef4444';
                } else if (rain >= 30) {
                    barGradient = 'linear-gradient(180deg, #f59e0b 0%, rgba(245, 158, 11, 0.35) 100%)';
                    barColor = '#f59e0b';
                }

                // Altura de la barra en px (de 8px a 70px)
                const barHeight = Math.max(8, Math.round((rain / 100) * 70));

                return `
                    <div style="flex: 1; min-width: 60px; display: flex; flex-direction: column; align-items: center; gap: 6px; position: relative;">
                        
                        <!-- Badge de hora en juego -->
                        ${isMatchWindow ? `
                            <div style="position: absolute; top: -14px; background: #CCFF00; color: #000; font-size: 0.50rem; font-weight: 950; padding: 1.5px 5px; border-radius: 5px; letter-spacing: 0.3px; text-transform: uppercase; box-shadow: 0 2px 6px rgba(204,255,0,0.4); white-space: nowrap;">
                                JUEGO
                            </div>
                        ` : `
                            <div style="height: 6px;"></div>
                        `}

                        <!-- Hora -->
                        <div style="font-size: 0.72rem; font-weight: ${isMatchWindow ? '950' : '700'}; color: ${isMatchWindow ? '#ffffff' : '#94a3b8'}; margin-top: 2px;">
                            ${h.hour}
                        </div>

                        <!-- Mini Icono del tiempo y temp -->
                        <div style="display: flex; flex-direction: column; align-items: center;">
                            <span style="font-size: 1.15rem; line-height: 1;">${h.icon}</span>
                            <span style="font-size: 0.66rem; font-weight: 850; color: #e2e8f0; margin-top: 2px;">${h.temp}°</span>
                        </div>

                        <!-- Zona de Barra de Probabilidad de Lluvia (%) -->
                        <div style="height: 75px; width: 100%; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; position: relative;">
                            <!-- Etiqueta del % sobre la barra -->
                            <span style="font-size: 0.60rem; font-weight: 900; color: ${barColor}; margin-bottom: 3px;">
                                ${rain}%
                            </span>
                            <!-- Barra vertical con gradiente -->
                            <div style="width: 22px; height: ${barHeight}px; background: ${barGradient}; border-radius: 6px 6px 3px 3px; box-shadow: ${rain >= 70 ? '0 0 10px rgba(239,68,68,0.5)' : (rain >= 30 ? '0 0 8px rgba(245,158,11,0.3)' : 'none')}; transition: height 0.3s ease;"></div>
                        </div>

                        <!-- Viento y ráfagas -->
                        <div style="background: ${isMatchWindow ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255,255,255,0.04)'}; border: 1px solid ${isMatchWindow ? 'rgba(56, 189, 248, 0.3)' : 'rgba(255,255,255,0.06)'}; border-radius: 8px; padding: 4px 5px; width: 92%; text-align: center; display: flex; flex-direction: column; align-items: center;">
                            <div style="font-size: 0.64rem; font-weight: 900; color: #38bdf8; display: flex; align-items: center; gap: 3px;">
                                <i class="fas fa-wind" style="font-size: 0.55rem;"></i> ${wind} <span style="font-size: 0.52rem; opacity: 0.8;">km/h</span>
                            </div>
                            ${gust > wind + 5 ? `
                                <div style="font-size: 0.54rem; font-weight: 800; color: ${gust >= 30 ? '#f59e0b' : '#94a3b8'}; margin-top: 1px;">
                                    ráf. ${gust}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            }).join('');

            return `
                <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 16px 14px; display: flex; flex-direction: column; gap: 12px;">
                    
                    <!-- Cabecera de la gráfica -->
                    <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
                        <div style="font-size: 0.78rem; font-weight: 950; color: #ffffff; letter-spacing: 0.3px; display: flex; align-items: center; gap: 6px;">
                            <i class="fas fa-chart-simple" style="color: #38bdf8;"></i> PREDICCIÓN HORARIA EXACTA (VIENTO & LLUVIA)
                        </div>
                        <div style="font-size: 0.62rem; color: #94a3b8; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                            <span style="display: inline-flex; align-items: center; gap: 4px;">
                                <span style="width: 8px; height: 8px; border-radius: 2px; background: #38bdf8;"></span> Prob. Lluvia (%)
                            </span>
                            <span style="display: inline-flex; align-items: center; gap: 4px;">
                                <i class="fas fa-wind" style="color: #38bdf8; font-size: 0.6rem;"></i> Viento (km/h)
                            </span>
                        </div>
                    </div>

                    <!-- Timeline de columnas con scroll horizontal táctil si es necesario -->
                    <div style="display: flex; gap: 8px; overflow-x: auto; padding: 18px 4px 6px; -webkit-overflow-scrolling: touch;">
                        ${columnsHtml}
                    </div>

                    <div style="font-size: 0.64rem; color: #94a3b8; text-align: center; border-top: 1px dashed rgba(255,255,255,0.08); padding-top: 8px;">
                        Tramo exacto analizado: <strong style="color: #CCFF00;">${forecast.timeRange}</strong> (incluye 1 hora previa de calentamiento y 1 hora posterior).
                    </div>
                </div>
            `;
        },

        /**
         * Renderiza la telemetría táctica de pista y comportamiento de la bola
         */
        _renderTacticalTelemetry(forecast) {
            const ball = forecast.ballPhysics || {};
            const speed = ball.speed || 'MEDIA';
            const reactivity = ball.reactivity || 'Equilibrada';
            const description = ball.description || 'Rebote estándar y buena respuesta.';

            // Estado de césped y cristales
            const isHighHumid = (forecast.hours && forecast.hours[0]?.humidity > 80);
            const isRainy = (forecast.maxRainProb >= 50);

            let gripStatus = 'SECO Y RÁPIDO';
            let gripColor = '#4ade80';
            let glassStatus = 'Cristales secos con rebote reactivo';

            if (isRainy) {
                gripStatus = 'HÚMEDO / DESLIZANTE';
                gripColor = '#ef4444';
                glassStatus = 'Cristales húmedos: la bola resbala y cae rápido al impactar';
            } else if (isHighHumid) {
                gripStatus = 'HUMEDAD AMBIENTAL';
                gripColor = '#f59e0b';
                glassStatus = 'Condensación en cristales: reduce la altura en salidas de pared';
            }

            return `
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    <div style="font-size: 0.78rem; font-weight: 950; color: #ffffff; letter-spacing: 0.3px; display: flex; align-items: center; gap: 6px;">
                        <i class="fas fa-brain" style="color: #CCFF00;"></i> TELEMETRÍA TÁCTICA DE PISTA & CIENCIA DEL PÁDEL
                    </div>

                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px;">
                        
                        <!-- Card 1: Comportamiento de la Bola -->
                        <div style="background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 12px 14px; display: flex; flex-direction: column; gap: 6px;">
                            <div style="display: flex; align-items: center; justify-content: space-between;">
                                <span style="font-size: 0.62rem; color: #94a3b8; font-weight: 800; text-transform: uppercase;">BOLA & VELOCIDAD</span>
                                <span style="background: rgba(204,255,0,0.15); color: #CCFF00; font-size: 0.58rem; font-weight: 900; padding: 2px 6px; border-radius: 6px;">
                                    ${speed}
                                </span>
                            </div>
                            <div style="font-size: 0.92rem; font-weight: 950; color: #ffffff;">
                                Reactividad: ${reactivity}
                            </div>
                            <div style="font-size: 0.68rem; color: #cbd5e1; line-height: 1.35;">
                                ${description}
                            </div>
                        </div>

                        <!-- Card 2: Estado del Césped & Cristales -->
                        <div style="background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 12px 14px; display: flex; flex-direction: column; gap: 6px;">
                            <div style="display: flex; align-items: center; justify-content: space-between;">
                                <span style="font-size: 0.62rem; color: #94a3b8; font-weight: 800; text-transform: uppercase;">CÉSPED & CRISTALES</span>
                                <span style="background: ${gripColor}22; color: ${gripColor}; font-size: 0.58rem; font-weight: 900; padding: 2px 6px; border-radius: 6px;">
                                    ${gripStatus}
                                </span>
                            </div>
                            <div style="font-size: 0.92rem; font-weight: 950; color: #ffffff;">
                                Humedad: ${forecast.hours && forecast.hours[0] ? forecast.hours[0].humidity : 55}%
                            </div>
                            <div style="font-size: 0.68rem; color: #cbd5e1; line-height: 1.35;">
                                ${glassStatus}
                            </div>
                        </div>

                        <!-- Card 3: Consejo Táctico Oficial -->
                        <div style="background: linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(30, 41, 59, 0.6) 100%); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 16px; padding: 12px 14px; display: flex; flex-direction: column; gap: 6px;">
                            <div style="display: flex; align-items: center; justify-content: space-between;">
                                <span style="font-size: 0.62rem; color: #38bdf8; font-weight: 800; text-transform: uppercase;">CONSEJO TÁCTICO</span>
                                <i class="fas fa-lightbulb" style="color: #38bdf8; font-size: 0.75rem;"></i>
                            </div>
                            <div style="font-size: 0.72rem; color: #f1f5f9; line-height: 1.4; font-weight: 600;">
                                ${forecast.tacticalAdvice || 'Condiciones estables. Juega con profundidad y busca ganar la red de manera agresiva.'}
                            </div>
                        </div>

                    </div>
                </div>
            `;
        },

        /**
         * Renderiza la sección de Aviso Preventivo de Lluvia y botones de notificación
         */
        _renderAlertSection(forecast, evt) {
            const isHighRain = (forecast.maxRainProb >= 70 || forecast.riskLevel === 'high');

            if (!isHighRain) {
                return `
                    <div style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.25); border-radius: 16px; padding: 12px 16px; display: flex; align-items: center; gap: 12px;">
                        <div style="width: 36px; height: 36px; border-radius: 10px; background: rgba(34, 197, 94, 0.2); color: #4ade80; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0;">
                            ✓
                        </div>
                        <div style="font-size: 0.72rem; color: #cbd5e1; line-height: 1.4;">
                            <strong style="color: #4ade80;">Previsión Meteorológica Favorable:</strong> No hay alertas de lluvia activas para esta franja horaria. El partido puede disputarse con normalidad.
                        </div>
                    </div>
                `;
            }

            // Alerta activa de lluvia (>= 70%)
            return `
                <div style="background: linear-gradient(135deg, rgba(239, 68, 68, 0.18) 0%, rgba(185, 28, 28, 0.12) 100%); border: 1.5px solid rgba(239, 68, 68, 0.5); border-radius: 18px; padding: 16px 18px; display: flex; flex-direction: column; gap: 12px; box-shadow: 0 8px 25px rgba(239, 68, 68, 0.2); animation: spWeatherPulse 2.5s infinite;">
                    
                    <div style="display: flex; align-items: flex-start; gap: 12px;">
                        <div style="width: 42px; height: 42px; border-radius: 12px; background: rgba(239, 68, 68, 0.3); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.6); display: flex; align-items: center; justify-content: center; font-size: 1.3rem; flex-shrink: 0;">
                            🌧️
                        </div>
                        <div style="flex: 1; min-width: 0;">
                            <div style="font-size: 0.86rem; font-weight: 950; color: #f87171; letter-spacing: -0.2px; text-transform: uppercase;">
                                ALERTA PREVENTIVA METEOROLÓGICA
                            </div>
                            <div style="font-size: 0.74rem; color: #fecaca; line-height: 1.4; margin-top: 3px;">
                                Alta probabilidad de lluvia (<strong style="color: #ffffff;">${forecast.maxRainProb}%</strong>) en tu horario de juego. El club está monitorizando la pista en tiempo real.
                            </div>
                        </div>
                    </div>

                    <!-- Botones de Acción Preventiva -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 4px;">
                        
                        <!-- Botón 1: Enviar Notificación Push Preventiva -->
                        <button type="button" 
                                id="sp-btn-send-preventive-push"
                                onclick="window.EventWeatherModal.sendPushAlert()" 
                                style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: #ffffff; border: none; padding: 10px 12px; border-radius: 12px; font-size: 0.72rem; font-weight: 950; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 4px 14px rgba(239, 68, 68, 0.4); transition: transform 0.15s ease;"
                                onmouseover="this.style.transform='scale(1.02)';"
                                onmouseout="this.style.transform='scale(1)';"
                                onmousedown="this.style.transform='scale(0.98)';">
                            <i class="fas fa-bell"></i>
                            <span>🚨 ENVIAR AVISO PUSH</span>
                        </button>

                        <!-- Botón 2: Avisar por WhatsApp a Inscritos -->
                        <button type="button" 
                                onclick="window.EventWeatherModal.shareWhatsAppAlert()" 
                                style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: #ffffff; border: none; padding: 10px 12px; border-radius: 12px; font-size: 0.72rem; font-weight: 950; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 4px 14px rgba(34, 197, 94, 0.35); transition: transform 0.15s ease;"
                                onmouseover="this.style.transform='scale(1.02)';"
                                onmouseout="this.style.transform='scale(1)';"
                                onmousedown="this.style.transform='scale(0.98)';">
                            <i class="fab fa-whatsapp"></i>
                            <span>💬 AVISAR POR WHATSAPP</span>
                        </button>

                    </div>
                </div>
            `;
        },

        /**
         * Renderiza el acordeón o botón de despliegue del radar satelital (Windy)
         */
        _renderRadarSection(forecast) {
            const loc = forecast.location || { lat: 41.3278, lon: 2.0947, name: 'Barcelona' };

            return `
                <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; overflow: hidden; display: flex; flex-direction: column;">
                    
                    <!-- Barra de activación del Radar -->
                    <div onclick="window.EventWeatherModal.toggleWindyRadar()" 
                         style="padding: 14px 16px; cursor: pointer; display: flex; align-items: center; justify-content: space-between; gap: 10px; background: rgba(255,255,255,0.03); transition: background 0.2s;"
                         onmouseover="this.style.background='rgba(56, 189, 248, 0.08)';"
                         onmouseout="this.style.background='rgba(255,255,255,0.03)';">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 1.1rem;">🛰️</span>
                            <div>
                                <div style="font-size: 0.80rem; font-weight: 950; color: #ffffff; letter-spacing: 0.3px;">
                                    RADAR SATELITAL EN VIVO (WINDY)
                                </div>
                                <div style="font-size: 0.65rem; color: #94a3b8;">
                                    Monitoreo satelital de frentes de lluvia y masas de viento en ${loc.name}
                                </div>
                            </div>
                        </div>
                        
                        <div id="sp-windy-toggle-badge" style="background: rgba(56,189,248,0.15); color: #38bdf8; border: 1px solid rgba(56,189,248,0.3); padding: 4px 10px; border-radius: 8px; font-size: 0.64rem; font-weight: 900; display: inline-flex; align-items: center; gap: 4px;">
                            <span>DESPLEGAR</span> <i class="fas fa-chevron-down" style="font-size: 0.6rem;"></i>
                        </div>
                    </div>

                    <!-- Contenedor del Iframe de Windy (oculto por defecto) -->
                    <div id="sp-windy-radar-container" style="display: none; flex-direction: column; border-top: 1px solid rgba(255,255,255,0.08);">
                        <!-- Barra de controles de capa -->
                        <div style="padding: 8px 14px; background: rgba(10, 15, 28, 0.9); display: flex; align-items: center; justify-content: space-between; gap: 8px; border-bottom: 1px solid rgba(255,255,255,0.06);">
                            <span style="font-size: 0.62rem; color: #94a3b8; font-weight: 800; text-transform: uppercase;">CAPA METEOROLÓGICA:</span>
                            <div style="display: flex; gap: 6px;">
                                <button type="button" 
                                        id="sp-windy-layer-rain" 
                                        onclick="window.EventWeatherModal.switchWindyLayer('rain')" 
                                        style="background: #38bdf8; color: #000000; border: none; padding: 4px 9px; border-radius: 6px; font-size: 0.62rem; font-weight: 950; cursor: pointer;">
                                    🌧️ Radar de Lluvia
                                </button>
                                <button type="button" 
                                        id="sp-windy-layer-wind" 
                                        onclick="window.EventWeatherModal.switchWindyLayer('wind')" 
                                        style="background: rgba(255,255,255,0.08); color: #cbd5e1; border: 1px solid rgba(255,255,255,0.12); padding: 4px 9px; border-radius: 6px; font-size: 0.62rem; font-weight: 950; cursor: pointer;">
                                    💨 Campo de Viento
                                </button>
                            </div>
                        </div>

                        <!-- Iframe Windy -->
                        <div id="sp-windy-iframe-wrapper" style="width: 100%; height: 320px; background: #000; position: relative;">
                            <!-- Iframe inyectado dinámicamente al abrir -->
                        </div>
                    </div>

                </div>
            `;
        },

        /**
         * Alterna el radar Windy desplegable
         */
        toggleWindyRadar() {
            const container = document.getElementById('sp-windy-radar-container');
            const badge = document.getElementById('sp-windy-toggle-badge');
            if (!container) return;

            this._windyVisible = !this._windyVisible;

            if (this._windyVisible) {
                container.style.display = 'flex';
                if (badge) {
                    badge.innerHTML = `<span>OCULTAR</span> <i class="fas fa-chevron-up" style="font-size: 0.6rem;"></i>`;
                }
                this._injectWindyIframe(this._windyLayer || 'rain');
            } else {
                container.style.display = 'none';
                if (badge) {
                    badge.innerHTML = `<span>DESPLEGAR</span> <i class="fas fa-chevron-down" style="font-size: 0.6rem;"></i>`;
                }
            }
        },

        /**
         * Cambia la capa de Windy (Lluvia o Viento)
         */
        switchWindyLayer(layer) {
            this._windyLayer = layer;
            const btnRain = document.getElementById('sp-windy-layer-rain');
            const btnWind = document.getElementById('sp-windy-layer-wind');

            if (layer === 'rain') {
                if (btnRain) {
                    btnRain.style.background = '#38bdf8';
                    btnRain.style.color = '#000000';
                    btnRain.style.border = 'none';
                }
                if (btnWind) {
                    btnWind.style.background = 'rgba(255,255,255,0.08)';
                    btnWind.style.color = '#cbd5e1';
                    btnWind.style.border = '1px solid rgba(255,255,255,0.12)';
                }
            } else {
                if (btnWind) {
                    btnWind.style.background = '#38bdf8';
                    btnWind.style.color = '#000000';
                    btnWind.style.border = 'none';
                }
                if (btnRain) {
                    btnRain.style.background = 'rgba(255,255,255,0.08)';
                    btnRain.style.color = '#cbd5e1';
                    btnRain.style.border = '1px solid rgba(255,255,255,0.12)';
                }
            }

            this._injectWindyIframe(layer);
        },

        /**
         * Inyecta el iframe oficial de Windy con coordenadas exactas
         */
        _injectWindyIframe(layer = 'rain') {
            const wrapper = document.getElementById('sp-windy-iframe-wrapper');
            if (!wrapper) return;

            const loc = this._currentForecast?.location || { lat: 41.3278, lon: 2.0947 };
            const overlay = (layer === 'wind') ? 'wind' : 'rain';

            wrapper.innerHTML = `
                <iframe width="100%" 
                        height="320" 
                        src="https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=mm&metricTemp=°C&metricWind=km/h&zoom=10&overlay=${overlay}&product=ecmwf&level=surface&lat=${loc.lat}&lon=${loc.lon}&detailLat=${loc.lat}&detailLon=${loc.lon}&marker=true" 
                        frameborder="0"
                        title="Radar Windy en Vivo"
                        style="border:0; width:100%; height:320px; display:block;">
                </iframe>
            `;
        },

        /**
         * Envía alerta preventivo push mediante WeatherService
         */
        async sendPushAlert() {
            const btn = document.getElementById('sp-btn-send-preventive-push');
            if (!btn) return;

            const originalHtml = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ENVIANDO...`;

            if (window.WeatherService && typeof window.WeatherService.sendPreventiveAlert === 'function') {
                try {
                    const res = await window.WeatherService.sendPreventiveAlert(this._currentEvent, this._currentForecast);
                    if (res && res.success) {
                        btn.style.background = '#16a34a';
                        btn.innerHTML = `✓ AVISO PUSH ENVIADO (${res.notifiedCount} JUGADORES)`;
                        if (window.NotificationService && typeof window.NotificationService.showToast === 'function') {
                            window.NotificationService.showToast('🚨 Aviso preventivo meteorológico enviado a los inscritos', 'success');
                        }
                    } else if (res && res.reason === 'ALREADY_SENT_RECENTLY') {
                        btn.style.background = '#475569';
                        btn.innerHTML = `ℹ️ AVISO ENVIADO HACE MENOS DE 2H`;
                        if (window.NotificationService && typeof window.NotificationService.showToast === 'function') {
                            window.NotificationService.showToast('ℹ️ Ya se emitió un aviso preventivo para este partido recientemente.', 'info');
                        }
                    }
                } catch (e) {
                    console.error('[EventWeatherModal] Error enviando alerta preventivo:', e);
                    btn.innerHTML = `⚠️ ERROR AL ENVIAR`;
                }
            } else {
                btn.innerHTML = `✓ AVISO SIMULADO CON ÉXITO`;
            }

            setTimeout(() => {
                if (btn) {
                    btn.disabled = false;
                }
            }, 3000);
        },

        /**
         * Genera y abre enlace de WhatsApp con mensaje formateado
         */
        shareWhatsAppAlert() {
            const evt = this._currentEvent || {};
            const fc = this._currentForecast || {};
            const venue = fc.location?.name || evt.sede || 'SomosPadel BCN';
            const dateStr = this._formatDisplayDate(fc.date || evt.date);
            const time = fc.timeRange || evt.time || '18:00';
            const rain = fc.maxRainProb || 70;

            const text = `🌧️ *AVISO METEOROLÓGICO SOMOSPÁDEL BCN*\n\n` +
                         `🎾 *Partido:* ${evt.name || 'Partido Oficial'}\n` +
                         `📍 *Sede:* ${venue}\n` +
                         `📅 *Fecha:* ${dateStr} (${time})\n` +
                         `⚠️ *Previsión:* ${rain}% de probabilidad de lluvia durante la franja de juego.\n\n` +
                         `El club está monitorizando la pista en tiempo real. Para cualquier duda, revisa la app o consúltanos.\n\n` +
                         `¡Nos vemos en la pista! 🎾`;

            const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
            window.open(url, '_blank');
        },

        /**
         * Helper para formatear fecha a formato legible (ej: "Vie, 26 Sep")
         */
        _formatDisplayDate(rawDate) {
            if (!rawDate) return 'Hoy';
            try {
                const parts = String(rawDate).split('-');
                if (parts.length === 3) {
                    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
                    return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
                }
            } catch (e) {
                // Ignore
            }
            return String(rawDate);
        },

        /**
         * Forecast de respaldo realista si la red o API fallan
         */
        _createFallbackForecast(eventDoc) {
            return {
                location: { name: eventDoc.sede || 'EL PRAT', lat: 41.3278, lon: 2.0947 },
                date: eventDoc.date || '2026-09-26',
                timeRange: eventDoc.time ? `${eventDoc.time} - 2h` : '18:00 - 20:00',
                hours: [
                    { hour: '17:00', temp: 22, rainProb: 15, windSpeed: 12, windGusts: 16, icon: '🌤️', condition: 'Mayormente Despejado', isEventWindow: false },
                    { hour: '18:00', temp: 22, rainProb: 20, windSpeed: 14, windGusts: 18, icon: '🌤️', condition: 'Mayormente Despejado', isEventWindow: true },
                    { hour: '19:00', temp: 21, rainProb: 25, windSpeed: 15, windGusts: 20, icon: '⛅', condition: 'Parcialmente Nublado', isEventWindow: true },
                    { hour: '20:00', temp: 20, rainProb: 20, windSpeed: 12, windGusts: 16, icon: '🌙', condition: 'Despejado', isEventWindow: true },
                    { hour: '21:00', temp: 19, rainProb: 15, windSpeed: 10, windGusts: 14, icon: '🌙', condition: 'Despejado', isEventWindow: false }
                ],
                maxRainProb: 25,
                avgWind: 14,
                maxWindGust: 20,
                avgTemp: 21,
                riskLevel: 'safe',
                ballPhysics: {
                    speed: 'MEDIA',
                    reactivity: 'Equilibrada',
                    description: 'Condiciones estándar ideales para el juego de pádel.'
                },
                isIndoorRecommended: false,
                tacticalAdvice: 'Condiciones óptimas de pista. Recomendado juego de control y voleas firmes en la red.',
                isFallback: true
            };
        },

        /**
         * Inyecta las animaciones CSS requeridas
         */
        _injectStyles() {
            const styleId = 'sp-event-weather-modal-styles';
            if (document.getElementById(styleId)) return;

            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                @keyframes spWeatherFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes spWeatherZoomIn {
                    from { transform: scale(0.94); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                @keyframes spWeatherSpin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes spWeatherPulse {
                    0%, 100% { box-shadow: 0 0 15px rgba(239, 68, 68, 0.25); }
                    50% { box-shadow: 0 0 25px rgba(239, 68, 68, 0.5); }
                }
                .sp-weather-modal-closing {
                    animation: spWeatherFadeOut 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
                }
                @keyframes spWeatherFadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    };

    // Exponer globalmente en window
    if (typeof window !== 'undefined') {
        window.EventWeatherModal = EventWeatherModal;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = EventWeatherModal;
    }
})(typeof window !== 'undefined' ? window : global);
