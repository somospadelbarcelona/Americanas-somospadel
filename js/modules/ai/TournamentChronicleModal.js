/**
 * TournamentChronicleModal.js
 * 🏆 MODAL INTERACTIVO PRO: CRÓNICA ÉPICA POST-TORNEO & GENERADOR DE INSTAGRAM STORIES HD
 * 
 * - Estética ultra-moderna SomosPádel BCN (Dark Glassmorphism, IA Violet #8B5CF6, Oro #FACC15, Neón #CCFF00)
 * - Simulación de análisis y generación con IA deportiva en tiempo real
 * - Selector de tono procedural al vuelo (Épico AS/Marca, Hype SomosPádel, Técnico WPT)
 * - Tarjetas de MVP, Podio, Momentos Cumbre y Ascensos de Pista / ELO
 * - Generador de Instagram Story 9:16 nativo en Canvas (1080x1920px reales) sin dependencias externas
 * - Compartir directo en WhatsApp, Portapapeles y Web Share API nativo
 * 
 * Expuesto globalmente como window.TournamentChronicleModal
 */

(function (root, factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.TournamentChronicleModal = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const LOG_PREFIX = '[TournamentChronicleModal]';

    class TournamentChronicleModal {
        constructor() {
            this.modalEl = null;
            this.currentEvent = null;
            this.currentMatches = [];
            this.currentChronicle = null;
            this.activeTone = 'epic'; // 'epic' | 'hype' | 'technical'
            this.activeTab = 'chronicle'; // 'chronicle' | 'story'
            this.isGenerating = false;
            this._boundKeydown = this._handleKeydown.bind(this);
        }

        /**
         * Abre el modal de Crónica Épica Post-Torneo.
         * Si no se pasan matches o eventDoc, los resuelve del estado global de la aplicación.
         */
        async open(eventDoc = null, matches = null, options = {}) {
            try {
                console.log(`${LOG_PREFIX} Abriendo experiencia Crónica Épica...`);

                // 1. Resolver Evento y Partidos del estado global si vienen nulos
                const resolved = this._resolveEventAndMatches(eventDoc, matches);
                this.currentEvent = resolved.eventDoc;
                this.currentMatches = resolved.matches;
                this.activeTone = options.tone || 'epic';
                this.activeTab = options.tab || 'chronicle';

                // 2. Destruir cualquier instancia anterior
                this._destroy();

                // 3. Crear overlay contenedor
                this._createModalContainer();

                // 4. Mostrar animación de "Generación de Crónica Épica en tiempo real"
                await this._playAILoadingAnimation();

                // 5. Generar la crónica a través del motor TournamentChronicleService
                this._generateAndRender();

            } catch (error) {
                console.error(`${LOG_PREFIX} Error al abrir modal de crónica:`, error);
                if (window.PremiumModal?.alert) {
                    window.PremiumModal.alert({
                        title: '⚠️ Error al generar crónica',
                        message: 'No se ha podido procesar la crónica deportiva: ' + (error.message || error),
                        type: 'error'
                    });
                } else {
                    alert('Error al generar la crónica post-torneo: ' + (error.message || error));
                }
                this.close();
            }
        }

        /**
         * Cierra el modal con animación fluida
         */
        close() {
            if (!this.modalEl) return;
            const content = this.modalEl.querySelector('.sp-chronicle-modal-container');
            if (content) {
                content.style.transform = 'scale(0.94) translateY(20px)';
                content.style.opacity = '0';
            }
            this.modalEl.style.opacity = '0';
            setTimeout(() => {
                this._destroy();
            }, 250);
        }

        // =========================================================================
        // RESOLUCIÓN DE DATOS Y ESTADO GLOBAL
        // =========================================================================

        _resolveEventAndMatches(eventDoc, matches) {
            let doc = eventDoc;
            let mList = matches;

            // 1. Probar ControlTowerView
            if (!doc && window.ControlTowerView?.currentAmericanaDoc) {
                doc = window.ControlTowerView.currentAmericanaDoc;
            }
            if ((!mList || mList.length === 0) && window.ControlTowerView?.allMatches?.length > 0) {
                mList = window.ControlTowerView.allMatches;
            }

            // 2. Probar ControlTowerSummary
            if (!doc && window.ControlTowerSummary?.lastSummaryData?.eventDoc) {
                doc = window.ControlTowerSummary.lastSummaryData.eventDoc;
            }
            if ((!mList || mList.length === 0) && window.ControlTowerSummary?.lastSummaryData?.matches?.length > 0) {
                mList = window.ControlTowerSummary.lastSummaryData.matches;
            }

            // 3. Probar caché en memoria de entrenos o Store
            if (!doc && window._currentEntrenoActive) {
                doc = window._currentEntrenoActive;
            }
            if (!doc && window.Store?.getState) {
                doc = window.Store.getState('currentTournament') || window.Store.getState('currentEvent');
            }

            // Si aún no hay matches pero hay id de evento y matches globales
            if ((!mList || mList.length === 0) && doc?.id && window.FirebaseDB?.matches?.getAll) {
                // Dejamos que el service trabaje con lo disponible o array vacío
                mList = [];
            }

            return {
                eventDoc: doc || { title: 'Americana SomosPádel BCN', type: 'americana', date: new Date() },
                matches: Array.isArray(mList) ? mList : []
            };
        }

        // =========================================================================
        // CREACIÓN DE ELEMENTOS DOM
        // =========================================================================

        _destroy() {
            window.removeEventListener('keydown', this._boundKeydown);
            const old = document.getElementById('sp-tournament-chronicle-modal');
            if (old) old.remove();
            this.modalEl = null;
        }

        _handleKeydown(e) {
            if (e.key === 'Escape') {
                this.close();
            }
        }

        _createModalContainer() {
            window.addEventListener('keydown', this._boundKeydown);

            const overlay = document.createElement('div');
            overlay.id = 'sp-tournament-chronicle-modal';
            overlay.style.cssText = `
                position: fixed; inset: 0; z-index: 15000;
                display: flex; align-items: center; justify-content: center;
                background: rgba(5, 8, 16, 0.88); backdrop-filter: blur(16px);
                -webkit-backdrop-filter: blur(16px);
                padding: 12px; box-sizing: border-box; overflow-y: auto;
                opacity: 0; transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1);
            `;

            overlay.innerHTML = `
                <style>
                    #sp-tournament-chronicle-modal * { box-sizing: border-box; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
                    .sp-chronicle-modal-container {
                        width: 100%; max-width: 820px; max-height: 94vh;
                        background: radial-gradient(circle at 50% 0%, rgba(139, 92, 246, 0.12) 0%, rgba(9, 14, 23, 0.98) 70%);
                        border: 1px solid rgba(139, 92, 246, 0.35);
                        border-radius: 24px;
                        box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(139, 92, 246, 0.2);
                        display: flex; flex-direction: column; overflow: hidden;
                        transform: scale(0.95) translateY(15px);
                        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                        color: #ffffff;
                    }
                    @keyframes spPulseGlow {
                        0%, 100% { opacity: 0.6; filter: drop-shadow(0 0 15px rgba(139, 92, 246, 0.6)); }
                        50% { opacity: 1; filter: drop-shadow(0 0 30px rgba(204, 255, 0, 0.8)); }
                    }
                    @keyframes spBarShimmer {
                        0% { background-position: -200% 0; }
                        100% { background-position: 200% 0; }
                    }
                    .sp-tab-btn {
                        background: transparent; border: none; padding: 10px 18px;
                        font-size: 0.82rem; font-weight: 800; color: #94a3b8;
                        cursor: pointer; border-radius: 12px; transition: all 0.2s ease;
                        display: inline-flex; align-items: center; gap: 8px; letter-spacing: 0.5px;
                    }
                    .sp-tab-btn.active {
                        background: rgba(139, 92, 246, 0.2);
                        color: #ffffff; border: 1px solid rgba(139, 92, 246, 0.5);
                        box-shadow: 0 4px 14px rgba(139, 92, 246, 0.25);
                    }
                    .sp-tone-pill {
                        background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.12);
                        color: #94a3b8; font-size: 0.72rem; font-weight: 800; padding: 6px 12px;
                        border-radius: 999px; cursor: pointer; transition: all 0.2s ease;
                        display: inline-flex; align-items: center; gap: 6px;
                    }
                    .sp-tone-pill:hover { background: rgba(255, 255, 255, 0.1); color: #fff; }
                    .sp-tone-pill.active {
                        background: linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(204, 255, 0, 0.2) 100%);
                        border-color: #8B5CF6; color: #CCFF00;
                        box-shadow: 0 0 14px rgba(139, 92, 246, 0.4);
                    }
                    .sp-action-btn-pro {
                        border: none; border-radius: 14px; font-weight: 900; font-size: 0.82rem;
                        padding: 12px 16px; cursor: pointer; display: inline-flex;
                        align-items: center; justify-content: center; gap: 8px;
                        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                    }
                    .sp-action-btn-pro:hover { transform: translateY(-2px); filter: brightness(1.1); }
                    .sp-action-btn-pro:active { transform: translateY(0); }
                    /* Scrollbar estilizada */
                    .sp-chronicle-scroll::-webkit-scrollbar { width: 6px; }
                    .sp-chronicle-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
                    .sp-chronicle-scroll::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.4); border-radius: 6px; }
                </style>
                <div class="sp-chronicle-modal-container" id="sp-chronicle-inner-container">
                    <!-- Contenido dinámico (Loading o Dashboard) -->
                </div>
            `;

            document.body.appendChild(overlay);
            this.modalEl = overlay;

            // Trigger fade in
            requestAnimationFrame(() => {
                overlay.style.opacity = '1';
                const content = overlay.querySelector('.sp-chronicle-modal-container');
                if (content) {
                    content.style.transform = 'scale(1) translateY(0)';
                }
            });
        }

        // =========================================================================
        // ANIMACIÓN DE IA EN TIEMPO REAL
        // =========================================================================

        async _playAILoadingAnimation() {
            const container = document.getElementById('sp-chronicle-inner-container');
            if (!container) return;

            const stages = [
                { icon: '⚡', text: 'Analizando marcadores, sets y diferenciales de juegos...' },
                { icon: '🔥', text: 'Identificando la mayor remontada y el MVP de la jornada...' },
                { icon: '📈', text: 'Detectando ascensos a Pista 1 y subidas estimadas de ELO...' },
                { icon: '✨', text: 'Redactando crónica deportiva épica...' }
            ];

            let stageIndex = 0;

            const renderLoadingStage = (index) => {
                const s = stages[index] || stages[0];
                const pct = Math.round(((index + 1) / stages.length) * 100);

                container.innerHTML = `
                    <div style="padding: 60px 24px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 420px;">
                        
                        <!-- Glowing AI Brain / Trophy Icon -->
                        <div style="
                            position: relative; width: 90px; height: 90px; margin-bottom: 24px;
                            display: flex; align-items: center; justify-content: center;
                            background: radial-gradient(circle, rgba(139, 92, 246, 0.25) 0%, rgba(0,0,0,0) 70%);
                            border-radius: 50%;
                        ">
                            <div style="
                                position: absolute; inset: 0; border-radius: 50%;
                                border: 2px dashed rgba(139, 92, 246, 0.6);
                                animation: spin 8s linear infinite;
                            "></div>
                            <span style="font-size: 3.2rem; animation: spPulseGlow 1.8s ease-in-out infinite;">🏆</span>
                        </div>

                        <!-- Badge -->
                        <div style="
                            display: inline-flex; align-items: center; gap: 7px; padding: 4px 14px;
                            border-radius: 999px; background: rgba(139, 92, 246, 0.15);
                            border: 1px solid rgba(139, 92, 246, 0.4); color: #c4b5fd;
                            font-size: 0.72rem; font-weight: 900; letter-spacing: 1.5px;
                            text-transform: uppercase; margin-bottom: 14px;
                        ">
                            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#CCFF00; box-shadow:0 0 8px #CCFF00;"></span>
                            IA DEPORTIVA SOMOSPÁDEL
                        </div>

                        <h2 style="font-size: 1.4rem; font-weight: 950; margin: 0 0 8px; color: #ffffff; letter-spacing: 0.5px;">
                            GENERANDO CRÓNICA ÉPICA
                        </h2>

                        <p id="sp-ai-loading-text" style="
                            font-size: 0.9rem; color: #cbd5e1; margin: 0 0 28px; max-width: 440px;
                            line-height: 1.4; min-height: 40px;
                        ">
                            <span style="margin-right: 6px;">${s.icon}</span> ${s.text}
                        </p>

                        <!-- Progress Bar -->
                        <div style="
                            width: 100%; max-width: 380px; height: 8px;
                            background: rgba(255, 255, 255, 0.08); border-radius: 999px;
                            overflow: hidden; position: relative; border: 1px solid rgba(255,255,255,0.06);
                        ">
                            <div id="sp-ai-progress-bar" style="
                                width: ${pct}%; height: 100%;
                                background: linear-gradient(90deg, #8B5CF6 0%, #CCFF00 100%);
                                border-radius: 999px; transition: width 0.35s ease;
                                box-shadow: 0 0 12px rgba(204, 255, 0, 0.6);
                            "></div>
                        </div>

                        <div style="font-size: 0.75rem; color: #64748b; font-weight: 700; margin-top: 10px;">
                            <span id="sp-ai-pct-text">${pct}%</span> completado
                        </div>
                    </div>
                `;
            };

            // Ejecución secuencial de etapas
            for (let i = 0; i < stages.length; i++) {
                renderLoadingStage(i);
                // Tiempo realista de análisis (350ms a 420ms por paso = ~1.4 - 1.6s en total)
                await new Promise(r => setTimeout(r, 380));
            }
        }

        // =========================================================================
        // GENERACIÓN Y RENDERIZADO DEL DASHBOARD
        // =========================================================================

        _generateAndRender() {
            if (!window.TournamentChronicleService) {
                throw new Error('TournamentChronicleService no está disponible en window.');
            }

            // 1. Invocar el motor procedural
            this.currentChronicle = window.TournamentChronicleService.generateEpicChronicle(
                this.currentEvent,
                this.currentMatches,
                { tone: this.activeTone }
            );

            // 2. Renderizar interfaz completa
            this._renderDashboard();
        }

        _renderDashboard() {
            const container = document.getElementById('sp-chronicle-inner-container');
            if (!container) return;

            const c = this.currentChronicle;
            const eventTitle = c?.meta?.title || this.currentEvent?.title || this.currentEvent?.name || 'Torneo SomosPádel';
            const eventDate = c?.meta?.date || this.currentEvent?.formattedDate || 'Jornada Deportiva';

            container.innerHTML = `
                <!-- CABECERA DEL MODAL -->
                <div style="
                    padding: 18px 22px; border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                    display: flex; align-items: center; justify-content: space-between; gap: 14px;
                    background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(10px);
                    flex-shrink: 0;
                ">
                    <div style="display: flex; align-items: center; gap: 12px; min-width: 0;">
                        <div style="
                            width: 44px; height: 44px; border-radius: 12px;
                            background: linear-gradient(135deg, #8B5CF6 0%, #4C1D95 100%);
                            display: flex; align-items: center; justify-content: center;
                            font-size: 1.4rem; flex-shrink: 0;
                            border: 1px solid rgba(204, 255, 0, 0.4);
                            box-shadow: 0 4px 16px rgba(139, 92, 246, 0.4);
                        ">🏆</div>
                        <div style="min-width: 0;">
                            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                                <span style="
                                    font-size: 0.62rem; font-weight: 900; padding: 2px 8px; border-radius: 6px;
                                    background: rgba(204, 255, 0, 0.15); color: #CCFF00; border: 1px solid rgba(204, 255, 0, 0.4);
                                    letter-spacing: 0.8px; text-transform: uppercase;
                                ">CRÓNICA ÉPICA OFICIAL</span>
                                <span style="font-size: 0.68rem; color: #94a3b8; font-weight: 600;">${eventDate}</span>
                            </div>
                            <div style="
                                font-size: 1.05rem; font-weight: 950; color: #ffffff;
                                white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                                margin-top: 2px; letter-spacing: 0.2px;
                            ">
                                ${eventTitle}
                            </div>
                        </div>
                    </div>

                    <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
                        <button type="button" onclick="window.TournamentChronicleModal.close()" style="
                            background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.14);
                            color: #cbd5e1; width: 36px; height: 36px; border-radius: 50%;
                            display: flex; align-items: center; justify-content: center; cursor: pointer;
                            font-size: 1rem; transition: all 0.2s ease;
                        " onmouseover="this.style.background='rgba(255,255,255,0.18)'" onmouseout="this.style.background='rgba(255,255,255,0.08)'">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>

                <!-- SELECTOR DE PESTAÑAS (CRÓNICA PERIODÍSTICA / INSTAGRAM STORY) -->
                <div style="
                    padding: 10px 20px; background: rgba(9, 14, 23, 0.6);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                    display: flex; align-items: center; justify-content: space-between; gap: 10px;
                    flex-wrap: wrap; flex-shrink: 0;
                ">
                    <div style="display: flex; gap: 6px;">
                        <button type="button" class="sp-tab-btn ${this.activeTab === 'chronicle' ? 'active' : ''}" 
                                onclick="window.TournamentChronicleModal.switchTab('chronicle')">
                            <i class="fas fa-newspaper" style="color: ${this.activeTab === 'chronicle' ? '#CCFF00' : '#8B5CF6'};"></i>
                            <span>CRÓNICA & DETALLES</span>
                        </button>
                        <button type="button" class="sp-tab-btn ${this.activeTab === 'story' ? 'active' : ''}" 
                                onclick="window.TournamentChronicleModal.switchTab('story')">
                            <i class="fab fa-instagram" style="color: ${this.activeTab === 'story' ? '#e1306c' : '#94a3b8'};"></i>
                            <span>STORY HD (9:16)</span>
                        </button>
                    </div>

                    <!-- SELECTOR DE TONO PROCEDURAL (Sólo en tab crónica) -->
                    ${this.activeTab === 'chronicle' ? `
                    <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                        <span style="font-size: 0.68rem; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">ESTILO:</span>
                        <button type="button" class="sp-tone-pill ${this.activeTone === 'epic' ? 'active' : ''}" 
                                onclick="window.TournamentChronicleModal.setTone('epic')">
                            🔥 Épico AS/Marca
                        </button>
                        <button type="button" class="sp-tone-pill ${this.activeTone === 'hype' ? 'active' : ''}" 
                                onclick="window.TournamentChronicleModal.setTone('hype')">
                            ⚡ Hype SomosPádel
                        </button>
                        <button type="button" class="sp-tone-pill ${this.activeTone === 'technical' ? 'active' : ''}" 
                                onclick="window.TournamentChronicleModal.setTone('technical')">
                            🎯 Técnico WPT
                        </button>
                    </div>
                    ` : ''}
                </div>

                <!-- CUERPO PRINCIPAL CON SCROLL -->
                <div class="sp-chronicle-scroll" style="
                    padding: 20px 22px; overflow-y: auto; flex: 1; min-height: 280px;
                ">
                    ${this.activeTab === 'chronicle' ? this._renderChronicleTabView() : this._renderStoryTabView()}
                </div>

                <!-- BARRA INFERIOR DE ACCIONES RÁPIDAS (COMPARTIR) -->
                <div style="
                    padding: 14px 22px; background: rgba(10, 16, 28, 0.95);
                    border-top: 1px solid rgba(255, 255, 255, 0.08);
                    display: flex; align-items: center; justify-content: space-between; gap: 10px;
                    flex-wrap: wrap; flex-shrink: 0;
                ">
                    <div style="display: flex; align-items: center; gap: 6px; font-size: 0.72rem; color: #94a3b8;">
                        <i class="fas fa-bolt" style="color: #CCFF00;"></i>
                        <span>IA Generativa con estadísticas oficiales SomosPádel</span>
                    </div>

                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <!-- WhatsApp Directo -->
                        <button type="button" class="sp-action-btn-pro" onclick="window.TournamentChronicleModal.shareWhatsApp()"
                                style="background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); color: #ffffff; box-shadow: 0 4px 16px rgba(37, 211, 102, 0.35);">
                            <i class="fab fa-whatsapp" style="font-size: 1.1rem;"></i>
                            <span>WHATSAPP</span>
                        </button>

                        <!-- Copiar Crónica -->
                        <button type="button" class="sp-action-btn-pro" onclick="window.TournamentChronicleModal.copyChronicle(this)"
                                style="background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.16); color: #ffffff;">
                            <i class="fas fa-copy"></i>
                            <span>COPIAR</span>
                        </button>

                        <!-- Compartir Nativo (Móvil) -->
                        <button type="button" class="sp-action-btn-pro" onclick="window.TournamentChronicleModal.shareNative()"
                                style="background: rgba(139, 92, 246, 0.2); border: 1px solid rgba(139, 92, 246, 0.5); color: #c4b5fd;">
                            <i class="fas fa-share-alt"></i>
                            <span>COMPARTIR</span>
                        </button>
                    </div>
                </div>
            `;
        }

        // =========================================================================
        // VISTA A: CRÓNICA PERIODÍSTICA
        // =========================================================================

        _renderChronicleTabView() {
            const c = this.currentChronicle;
            const mvp = c?.mvp || { name: 'Por disputar', winRatePercent: 100, court1Wins: 0, points: 0, impactScore: 90 };
            const podium = c?.podium || [];
            const hl = c?.highlights || {};
            const prog = c?.progressions || {};

            return `
                <!-- TITULAR DE IMPACTO -->
                <div style="
                    margin-bottom: 20px; padding: 20px; border-radius: 18px;
                    background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(15, 23, 42, 0.6) 100%);
                    border: 1px solid rgba(139, 92, 246, 0.3);
                ">
                    <div style="font-size: 0.72rem; font-weight: 900; color: #CCFF00; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 6px;">
                        📰 CRÓNICA DEPORTIVA EXCLUSIVA
                    </div>
                    <h1 style="
                        font-size: 1.45rem; font-weight: 950; color: #ffffff; line-height: 1.25;
                        margin: 0 0 10px; letter-spacing: -0.3px;
                    ">
                        ${c.headline || 'Jornada magistral en las pistas de SomosPádel'}
                    </h1>
                    <div style="font-size: 0.88rem; color: #cbd5e1; line-height: 1.45; font-weight: 500;">
                        ${c.subheadline || 'Los protagonistas brillaron en cada punto disputado.'}
                    </div>
                </div>

                <!-- FILA DE DESTACADOS: MVP & PODIO RESUMIDO -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; margin-bottom: 20px;">
                    
                    <!-- TARJETA MVP -->
                    <div style="
                        padding: 16px; border-radius: 18px;
                        background: radial-gradient(circle at top right, rgba(250, 204, 21, 0.15) 0%, rgba(15, 23, 42, 0.75) 100%);
                        border: 1px solid rgba(250, 204, 21, 0.4);
                        display: flex; flex-direction: column; justify-content: space-between;
                    ">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <span style="
                                background: linear-gradient(135deg, #FACC15 0%, #CA8A04 100%);
                                color: #000000; font-size: 0.64rem; font-weight: 950; padding: 3px 9px;
                                border-radius: 6px; letter-spacing: 0.8px;
                            ">
                                ⭐ MVP DE LA JORNADA
                            </span>
                            <span style="font-size: 0.68rem; color: #FACC15; font-weight: 900;">
                                Impacto: ${mvp.impactScore || 95}/100
                            </span>
                        </div>

                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                            <div style="
                                width: 50px; height: 50px; border-radius: 50%;
                                background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                                border: 2px solid #FACC15; display: flex; align-items: center; justify-content: center;
                                font-weight: 950; font-size: 1.15rem; color: #FACC15; flex-shrink: 0;
                                box-shadow: 0 0 15px rgba(250, 204, 21, 0.3);
                            ">
                                ${this._getInitials(mvp.name)}
                            </div>
                            <div style="min-width: 0;">
                                <div style="font-weight: 950; font-size: 1.15rem; color: #ffffff; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                    ${mvp.name}
                                </div>
                                <div style="font-size: 0.72rem; color: #94a3b8; margin-top: 2px;">
                                    ${mvp.court1Wins > 0 ? `👑 Rey de Pista 1 con ${mvp.court1Wins} victorias` : 'Rendimiento sobresaliente en pista'}
                                </div>
                            </div>
                        </div>

                        <div style="
                            display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px;
                            background: rgba(0, 0, 0, 0.25); padding: 8px 10px; border-radius: 12px;
                            text-align: center; border: 1px solid rgba(255, 255, 255, 0.04);
                        ">
                            <div>
                                <div style="font-size: 0.95rem; font-weight: 950; color: #CCFF00;">${mvp.winRatePercent || 100}%</div>
                                <div style="font-size: 0.58rem; color: #64748b; font-weight: 800; text-transform: uppercase;">Efectividad</div>
                            </div>
                            <div>
                                <div style="font-size: 0.95rem; font-weight: 950; color: #ffffff;">${mvp.won || 0}V</div>
                                <div style="font-size: 0.58rem; color: #64748b; font-weight: 800; text-transform: uppercase;">Victorias</div>
                            </div>
                            <div>
                                <div style="font-size: 0.95rem; font-weight: 950; color: #38bdf8;">${mvp.points || 0}</div>
                                <div style="font-size: 0.58rem; color: #64748b; font-weight: 800; text-transform: uppercase;">Puntos</div>
                            </div>
                        </div>
                    </div>

                    <!-- TARJETA PODIO RESUMIDO -->
                    <div style="
                        padding: 16px; border-radius: 18px;
                        background: radial-gradient(circle at top left, rgba(139, 92, 246, 0.15) 0%, rgba(15, 23, 42, 0.75) 100%);
                        border: 1px solid rgba(139, 92, 246, 0.35);
                        display: flex; flex-direction: column; justify-content: space-between;
                    ">
                        <div style="font-size: 0.64rem; font-weight: 950; color: #c4b5fd; letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 8px;">
                            🏅 PODIO DE HONOR
                        </div>

                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            ${podium.map((p, idx) => `
                                <div style="
                                    display: flex; align-items: center; justify-content: space-between;
                                    padding: 6px 10px; border-radius: 10px;
                                    background: rgba(255, 255, 255, ${idx === 0 ? '0.08' : '0.04'});
                                    border-left: 3px solid ${idx === 0 ? '#FACC15' : (idx === 1 ? '#cbd5e1' : '#f97316')};
                                ">
                                    <div style="display: flex; align-items: center; gap: 8px; min-width: 0;">
                                        <span style="font-size: 1rem;">${p.badge || (idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉')}</span>
                                        <span style="font-weight: 900; font-size: 0.82rem; color: #ffffff; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                            ${p.name}
                                        </span>
                                    </div>
                                    <span style="font-size: 0.75rem; font-weight: 950; color: ${idx === 0 ? '#CCFF00' : '#94a3b8'}; flex-shrink: 0;">
                                        ${p.points} pts
                                    </span>
                                </div>
                            `).join('')}
                        </div>

                        <div style="font-size: 0.65rem; color: #64748b; margin-top: 8px; text-align: right;">
                            Clasificación general homologada
                        </div>
                    </div>
                </div>

                <!-- BLOQUE MOMENTOS CUMBRE (HIGHLIGHTS) -->
                <div style="margin-bottom: 20px;">
                    <div style="font-size: 0.72rem; font-weight: 900; color: #CCFF00; letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
                        <span>🔥 MOMENTOS CUMBRE DE LA JORNADA</span>
                    </div>

                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px;">
                        
                        <!-- Partido más ajustado -->
                        <div style="padding: 12px; border-radius: 14px; background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08);">
                            <div style="font-size: 0.62rem; font-weight: 900; color: #38bdf8; text-transform: uppercase; margin-bottom: 4px;">
                                ⚡ PARTIDO MÁS AJUSTADO
                            </div>
                            <div style="font-size: 0.85rem; font-weight: 900; color: #ffffff; margin-bottom: 4px;">
                                ${hl.closestMatch?.scoreString ? `Marcador: ${hl.closestMatch.scoreString}` : 'Máxima igualdad'}
                            </div>
                            <div style="font-size: 0.72rem; color: #94a3b8; line-height: 1.35;">
                                ${hl.closestMatch?.summary || 'Cruces resueltos por detalles en la bola de partido.'}
                            </div>
                        </div>

                        <!-- La gran muralla -->
                        <div style="padding: 12px; border-radius: 14px; background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08);">
                            <div style="font-size: 0.62rem; font-weight: 900; color: #10b981; text-transform: uppercase; margin-bottom: 4px;">
                                🛡️ LA GRAN MURALLA
                            </div>
                            <div style="font-size: 0.85rem; font-weight: 900; color: #ffffff; margin-bottom: 4px;">
                                ${hl.bestDefense?.name || 'Defensa impenetrable'}
                            </div>
                            <div style="font-size: 0.72rem; color: #94a3b8; line-height: 1.35;">
                                ${hl.bestDefense ? `Apenas ${hl.bestDefense.avgLostPerMatch} juegos encajados por partido.` : 'Solidez defensiva ejemplar.'}
                            </div>
                        </div>

                        <!-- Escalada / Remontada -->
                        <div style="padding: 12px; border-radius: 14px; background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08);">
                            <div style="font-size: 0.62rem; font-weight: 900; color: #f59e0b; text-transform: uppercase; margin-bottom: 4px;">
                                🚀 MAYOR ESCALADA
                            </div>
                            <div style="font-size: 0.85rem; font-weight: 900; color: #ffffff; margin-bottom: 4px;">
                                ${hl.biggestClimber?.name || 'Superación'}
                            </div>
                            <div style="font-size: 0.72rem; color: #94a3b8; line-height: 1.35;">
                                ${hl.biggestClimber?.description || 'Impresionante progresión a lo largo de las rondas.'}
                            </div>
                        </div>

                        <!-- Racha imparable -->
                        <div style="padding: 12px; border-radius: 14px; background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08);">
                            <div style="font-size: 0.62rem; font-weight: 900; color: #ec4899; text-transform: uppercase; margin-bottom: 4px;">
                                🔥 RACHA IMPARABLE
                            </div>
                            <div style="font-size: 0.85rem; font-weight: 900; color: #ffffff; margin-bottom: 4px;">
                                ${hl.longestStreak?.name || 'Racha de victorias'}
                            </div>
                            <div style="font-size: 0.72rem; color: #94a3b8; line-height: 1.35;">
                                ${hl.longestStreak?.description || 'Enlace ganador en momentos determinantes.'}
                            </div>
                        </div>

                    </div>
                </div>

                <!-- BLOQUE ASCENSOS DE PISTA Y ELO -->
                ${(prog.court1Ascents?.length || prog.eloGainList?.length || prog.categoryPromotions?.length) ? `
                <div style="
                    margin-bottom: 20px; padding: 14px 16px; border-radius: 16px;
                    background: rgba(139, 92, 246, 0.08); border: 1px solid rgba(139, 92, 246, 0.25);
                ">
                    <div style="font-size: 0.72rem; font-weight: 900; color: #c4b5fd; letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 8px;">
                        📈 ASCENSOS DE PISTA Y SUBIDAS DE ELO
                    </div>
                    
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                        ${(prog.categoryPromotions || []).map(p => `
                            <span style="
                                display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px;
                                border-radius: 8px; background: rgba(204, 255, 0, 0.15); color: #CCFF00;
                                border: 1px solid rgba(204, 255, 0, 0.4); font-size: 0.72rem; font-weight: 900;
                            ">
                                ⭐ <strong>${p.name}</strong> • ${p.recommendation}
                            </span>
                        `).join('')}

                        ${(prog.court1Ascents || []).map(a => `
                            <span style="
                                display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px;
                                border-radius: 8px; background: rgba(56, 189, 248, 0.15); color: #38bdf8;
                                border: 1px solid rgba(56, 189, 248, 0.4); font-size: 0.72rem; font-weight: 800;
                            ">
                                👑 <strong>${a.name}</strong>: ${a.title}
                            </span>
                        `).join('')}

                        ${(prog.eloGainList || []).slice(0, 3).map(e => `
                            <span style="
                                display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px;
                                border-radius: 8px; background: rgba(255, 255, 255, 0.06); color: #e2e8f0;
                                border: 1px solid rgba(255, 255, 255, 0.12); font-size: 0.72rem; font-weight: 800;
                            ">
                                📊 <strong>${e.name}</strong> ${e.gain} (${e.winRate})
                            </span>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- CUERPO NARRATIVO COMPLETO -->
                <div style="
                    padding: 18px; border-radius: 18px;
                    background: rgba(15, 23, 42, 0.65); border: 1px solid rgba(255, 255, 255, 0.07);
                    line-height: 1.65; font-size: 0.88rem; color: #cbd5e1;
                ">
                    <div style="font-size: 0.72rem; font-weight: 900; color: #94a3b8; letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 10px;">
                        📜 CUERPO DE LA CRÓNICA
                    </div>
                    
                    <p style="margin-bottom: 12px;">${c.act1_intro || ''}</p>
                    <p style="margin-bottom: 12px;">${c.act2_highlights || ''}</p>
                    <p style="margin-bottom: 12px;">${c.act3_mvp_ascents || ''}</p>
                    <p style="margin-bottom: 0;">${c.act4_outro || ''}</p>
                </div>
            `;
        }

        // =========================================================================
        // VISTA B: GENERADOR DE INSTAGRAM STORY HD (9:16)
        // =========================================================================

        _renderStoryTabView() {
            const c = this.currentChronicle;
            const eventTitle = c?.meta?.title || 'Torneo SomosPádel';
            const eventDate = c?.meta?.date || 'Jornada Deportiva';
            const mvp = c?.mvp || { name: 'Aspirante', winRatePercent: 100 };
            const podium = c?.podium || [];

            return `
                <div style="display: flex; flex-direction: column; align-items: center; gap: 20px;">
                    
                    <!-- Explicación y botón de descarga superior -->
                    <div style="
                        width: 100%; max-width: 480px; padding: 14px 16px; border-radius: 16px;
                        background: rgba(225, 48, 108, 0.1); border: 1px solid rgba(225, 48, 108, 0.35);
                        display: flex; align-items: center; justify-content: space-between; gap: 12px;
                    ">
                        <div>
                            <div style="font-weight: 900; font-size: 0.85rem; color: #ffffff;">
                                📸 Story HD Vertical (1080 x 1920)
                            </div>
                            <div style="font-size: 0.72rem; color: #cbd5e1; margin-top: 2px;">
                                Lista para publicar directamente en Instagram Stories
                            </div>
                        </div>
                        <button type="button" class="sp-action-btn-pro" onclick="window.TournamentChronicleModal.downloadStoryPng()"
                                style="background: linear-gradient(135deg, #e1306c 0%, #833ab4 50%, #fd1d1d 100%); color: #ffffff; box-shadow: 0 4px 16px rgba(225, 48, 108, 0.4); flex-shrink: 0;">
                            <i class="fas fa-download"></i>
                            <span>DESCARGAR PNG</span>
                        </button>
                    </div>

                    <!-- PREVIEW VISUAL 9:16 ESTILIZADO -->
                    <div style="
                        width: 100%; max-width: 320px; aspect-ratio: 9 / 16;
                        background: radial-gradient(circle at 50% 15%, #1e1b4b 0%, #070a13 85%);
                        border: 2px solid rgba(139, 92, 246, 0.5); border-radius: 28px;
                        padding: 24px 18px; display: flex; flex-direction: column; justify-content: space-between;
                        box-shadow: 0 15px 40px rgba(0, 0, 0, 0.8), 0 0 25px rgba(139, 92, 246, 0.25);
                        position: relative; overflow: hidden;
                    ">
                        <!-- Glows decorativos de fondo -->
                        <div style="position: absolute; top: -40px; right: -40px; width: 140px; height: 140px; background: rgba(204, 255, 0, 0.12); filter: blur(40px); border-radius: 50%;"></div>
                        <div style="position: absolute; bottom: -30px; left: -30px; width: 140px; height: 140px; background: rgba(139, 92, 246, 0.2); filter: blur(40px); border-radius: 50%;"></div>

                        <!-- Top Brand -->
                        <div style="text-align: center; position: relative; z-index: 2;">
                            <div style="
                                display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px;
                                border-radius: 999px; background: rgba(204, 255, 0, 0.15);
                                border: 1px solid rgba(204, 255, 0, 0.4); color: #CCFF00;
                                font-size: 0.58rem; font-weight: 950; letter-spacing: 1px;
                            ">
                                ⭐ SOMOSPÁDEL BARCELONA
                            </div>
                            <div style="
                                font-size: 0.95rem; font-weight: 950; color: #ffffff;
                                margin-top: 8px; text-transform: uppercase; letter-spacing: 0.5px;
                                white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                            ">
                                ${eventTitle}
                            </div>
                            <div style="font-size: 0.62rem; color: #94a3b8; font-weight: 700; margin-top: 2px;">
                                ${eventDate}
                            </div>
                        </div>

                        <!-- Center: MVP Highlight Card -->
                        <div style="
                            background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(250, 204, 21, 0.4);
                            border-radius: 18px; padding: 14px 12px; text-align: center;
                            position: relative; z-index: 2; box-shadow: 0 8px 20px rgba(0,0,0,0.5);
                        ">
                            <span style="
                                display: inline-block; padding: 2px 8px; border-radius: 6px;
                                background: #FACC15; color: #000; font-size: 0.58rem; font-weight: 950;
                                margin-bottom: 6px; letter-spacing: 0.5px;
                            ">
                                👑 MVP DE LA JORNADA
                            </span>
                            <div style="font-size: 1.05rem; font-weight: 950; color: #ffffff; text-transform: uppercase;">
                                ${mvp.name}
                            </div>
                            <div style="font-size: 0.65rem; color: #CCFF00; font-weight: 800; margin-top: 3px;">
                                ${mvp.winRatePercent || 100}% Efectividad • ${mvp.won || 0} Victorias
                            </div>
                        </div>

                        <!-- Center-Bottom: Podium Badges -->
                        <div style="display: flex; flex-direction: column; gap: 6px; position: relative; z-index: 2;">
                            <div style="font-size: 0.58rem; font-weight: 900; color: #c4b5fd; text-align: center; letter-spacing: 1px; text-transform: uppercase;">
                                🏆 PODIO OFICIAL
                            </div>
                            ${podium.slice(0, 3).map((p, i) => `
                                <div style="
                                    display: flex; align-items: center; justify-content: space-between;
                                    padding: 6px 10px; border-radius: 10px;
                                    background: rgba(255, 255, 255, ${i === 0 ? '0.1' : '0.04'});
                                    border: 1px solid rgba(255, 255, 255, 0.08); font-size: 0.68rem;
                                ">
                                    <div style="display: flex; align-items: center; gap: 6px; min-width: 0;">
                                        <span>${p.badge || (i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉')}</span>
                                        <span style="font-weight: 900; color: #ffffff; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                            ${p.name}
                                        </span>
                                    </div>
                                    <span style="font-weight: 950; color: #CCFF00;">${p.points} PTS</span>
                                </div>
                            `).join('')}
                        </div>

                        <!-- Bottom Brand Tag -->
                        <div style="text-align: center; position: relative; z-index: 2; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 8px;">
                            <div style="font-size: 0.55rem; color: #94a3b8; font-weight: 800; letter-spacing: 0.5px;">
                                @somospadelbcn • somospadel.es
                            </div>
                        </div>
                    </div>

                    <!-- Botón inferior para móviles -->
                    <button type="button" class="sp-action-btn-pro" onclick="window.TournamentChronicleModal.downloadStoryPng()"
                            style="width: 100%; max-width: 320px; background: linear-gradient(135deg, #e1306c 0%, #833ab4 50%, #fd1d1d 100%); color: #ffffff;">
                        <i class="fas fa-camera"></i>
                        <span>DESCARGAR STORY HD (PNG 1080x1920)</span>
                    </button>
                </div>
            `;
        }

        // =========================================================================
        // ACCIONES DE USUARIO: TABS, TONOS Y COMPARTIR
        // =========================================================================

        switchTab(tabName) {
            this.activeTab = tabName;
            this._renderDashboard();
        }

        setTone(toneName) {
            if (this.activeTone === toneName) return;
            this.activeTone = toneName;
            this._generateAndRender();
        }

        shareWhatsApp() {
            if (!this.currentChronicle) return;
            const shareUrl = window.TournamentChronicleService.getWhatsAppShareUrl(this.currentChronicle);
            window.open(shareUrl, '_blank');
        }

        async copyChronicle(btnEl) {
            if (!this.currentChronicle) return;
            const text = this.currentChronicle.whatsAppText || this.currentChronicle.fullChronicle;

            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(text);
                } else {
                    const ta = document.createElement('textarea');
                    ta.value = text;
                    ta.style.position = 'fixed';
                    ta.style.opacity = '0';
                    document.body.appendChild(ta);
                    ta.select();
                    document.execCommand('copy');
                    ta.remove();
                }

                if (navigator.vibrate) {
                    navigator.vibrate(40);
                }

                if (btnEl) {
                    const originalHtml = btnEl.innerHTML;
                    btnEl.innerHTML = '<i class="fas fa-check" style="color:#CCFF00"></i> <span>¡COPIADO!</span>';
                    btnEl.style.borderColor = '#CCFF00';
                    setTimeout(() => {
                        btnEl.innerHTML = originalHtml;
                        btnEl.style.borderColor = '';
                    }, 2000);
                }

                this._showToast('✨ Crónica deportiva copiada al portapapeles');
            } catch (err) {
                console.error(`${LOG_PREFIX} Error al copiar crónica:`, err);
                this._showToast('❌ No se pudo copiar automáticamente');
            }
        }

        async shareNative() {
            if (!this.currentChronicle) return;
            const title = this.currentChronicle.headline || 'Crónica SomosPádel BCN';
            const text = this.currentChronicle.whatsAppText || this.currentChronicle.fullChronicle;

            if (navigator.share) {
                try {
                    await navigator.share({
                        title,
                        text,
                        url: window.location.href
                    });
                } catch (e) {
                    if (e.name !== 'AbortError') {
                        this.shareWhatsApp();
                    }
                }
            } else {
                this.shareWhatsApp();
            }
        }

        // =========================================================================
        // MOTOR CANVAS NATIVO: INSTAGRAM STORY HD (1080 x 1920)
        // =========================================================================

        async downloadStoryPng() {
            try {
                this._showToast('🎨 Renderizando Story HD (1080x1920)...');

                const canvas = document.createElement('canvas');
                canvas.width = 1080;
                canvas.height = 1920;
                const ctx = canvas.getContext('2d');

                await this._drawStoryOnCanvas(ctx, canvas.width, canvas.height);

                canvas.toBlob((blob) => {
                    if (!blob) {
                        throw new Error('No se pudo generar el blob de la imagen.');
                    }
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    const cleanTitle = (this.currentChronicle?.meta?.title || 'Torneo').replace(/[^a-zA-Z0-9]/g, '_');
                    link.download = `SomosPadel_Story_${cleanTitle}_${Date.now()}.png`;
                    link.href = url;
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    setTimeout(() => URL.revokeObjectURL(url), 1000);

                    this._showToast('📸 ¡Story HD descargada con éxito!');
                }, 'image/png');

            } catch (error) {
                console.error(`${LOG_PREFIX} Error al renderizar Canvas Story:`, error);
                this._showToast('⚠️ Error al generar imagen HD');
            }
        }

        async _drawStoryOnCanvas(ctx, W, H) {
            const c = this.currentChronicle;
            const eventTitle = (c?.meta?.title || this.currentEvent?.title || 'TORNEO SOMOSPÁDEL').toUpperCase();
            const eventDate = (c?.meta?.date || 'Jornada Oficial').toUpperCase();
            const mvp = c?.mvp || { name: 'Aspirante', winRatePercent: 100, court1Wins: 0, points: 0 };
            const podium = c?.podium || [];
            const hl = c?.highlights || {};

            // 1. FONDO DEGRADADO ULTRA-DARK
            const bgGrad = ctx.createLinearGradient(0, 0, W, H);
            bgGrad.addColorStop(0, '#0a0d18');
            bgGrad.addColorStop(0.35, '#12122b');
            bgGrad.addColorStop(0.7, '#080c16');
            bgGrad.addColorStop(1, '#150d24');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, W, H);

            // 2. RESPLANDORES RADIALES DECORATIVOS (NEÓN VIOLETA Y VERDE)
            const glow1 = ctx.createRadialGradient(200, 250, 10, 200, 250, 600);
            glow1.addColorStop(0, 'rgba(139, 92, 246, 0.28)');
            glow1.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = glow1;
            ctx.fillRect(0, 0, W, H);

            const glow2 = ctx.createRadialGradient(900, 600, 10, 900, 600, 500);
            glow2.addColorStop(0, 'rgba(204, 255, 0, 0.18)');
            glow2.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = glow2;
            ctx.fillRect(0, 0, W, H);

            const glow3 = ctx.createRadialGradient(540, 1500, 10, 540, 1500, 600);
            glow3.addColorStop(0, 'rgba(225, 48, 108, 0.15)');
            glow3.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = glow3;
            ctx.fillRect(0, 0, W, H);

            // 3. MARCO PERIMETRAL ELEGANTE
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.lineWidth = 4;
            this._roundRect(ctx, 40, 40, W - 80, H - 80, 40);
            ctx.stroke();

            // 4. CABECERA: MARCA SOMOSPÁDEL
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Badge superior
            this._drawBadgePill(ctx, 540, 130, '⚡ SOMOSPÁDEL BARCELONA • CRÓNICA OFICIAL', '#CCFF00', 'rgba(204, 255, 0, 0.15)');

            // Título de la Americana
            ctx.fillStyle = '#ffffff';
            ctx.font = '900 52px "Outfit", "Inter", sans-serif';
            const cleanTitle = eventTitle.length > 28 ? eventTitle.substring(0, 26) + '...' : eventTitle;
            ctx.fillText(cleanTitle, 540, 215);

            // Subtítulo con fecha
            ctx.fillStyle = '#94a3b8';
            ctx.font = '700 28px "Inter", sans-serif';
            ctx.fillText(`📅 ${eventDate}  •  BARCELONA`, 540, 275);

            // 5. TARJETA ESTELAR DEL MVP (Y: 340 a 700)
            const mvpCardY = 340;
            const mvpCardH = 360;
            const mvpCardW = W - 140; // 940px
            const mvpCardX = 70;

            // Fondo tarjeta MVP
            const mvpGrad = ctx.createLinearGradient(mvpCardX, mvpCardY, mvpCardX + mvpCardW, mvpCardY + mvpCardH);
            mvpGrad.addColorStop(0, 'rgba(30, 27, 75, 0.85)');
            mvpGrad.addColorStop(1, 'rgba(15, 23, 42, 0.92)');
            ctx.fillStyle = mvpGrad;
            this._roundRect(ctx, mvpCardX, mvpCardY, mvpCardW, mvpCardH, 32);
            ctx.fill();
            ctx.strokeStyle = 'rgba(250, 204, 21, 0.6)';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Badge MVP
            this._drawBadgePill(ctx, 540, mvpCardY + 45, '👑 MVP DE LA JORNADA', '#000000', '#FACC15');

            // Nombre MVP
            ctx.fillStyle = '#ffffff';
            ctx.font = '950 64px "Outfit", "Inter", sans-serif';
            const cleanMvpName = (mvp.name || 'JUGADOR REVELACIÓN').toUpperCase();
            ctx.fillText(cleanMvpName, 540, mvpCardY + 130);

            // Métrica de impacto
            ctx.fillStyle = '#CCFF00';
            ctx.font = '800 32px "Inter", sans-serif';
            const mvpStatsText = `${mvp.winRatePercent || 100}% EFECTIVIDAD  •  ${mvp.won || 0}V  •  ${mvp.points || 0} PUNTOS`;
            ctx.fillText(mvpStatsText, 540, mvpCardY + 195);

            // Barra decorativa o cápsulas en el MVP
            const kpiBoxY = mvpCardY + 245;
            this._drawKpiBox(ctx, 160, kpiBoxY, 210, 75, `${mvp.won || 0}`, 'VICTORIAS');
            this._drawKpiBox(ctx, 435, kpiBoxY, 210, 75, `${mvp.court1Wins || 0}`, 'PISTA 1');
            this._drawKpiBox(ctx, 710, kpiBoxY, 210, 75, `+${mvp.diff || 0}`, 'DIF. JUEGOS');

            // 6. SECCIÓN PODIO OFICIAL (Y: 740 a 1240)
            const podY = 740;
            ctx.fillStyle = '#c4b5fd';
            ctx.font = '900 34px "Outfit", "Inter", sans-serif';
            ctx.fillText('🏆 PODIO DE LA JORNADA', 540, podY);

            const medals = [
                { badge: '🥇 1º PUESTO', color: '#FACC15', border: 'rgba(250, 204, 21, 0.7)' },
                { badge: '🥈 2º PUESTO', color: '#E2E8F0', border: 'rgba(226, 232, 240, 0.5)' },
                { badge: '🥉 3º PUESTO', color: '#F97316', border: 'rgba(249, 115, 22, 0.5)' }
            ];

            for (let i = 0; i < 3; i++) {
                const itemY = podY + 55 + (i * 125);
                const p = podium[i] || { name: 'Aspirante', points: 0, won: 0 };
                const m = medals[i];

                // Fondo fila podio
                ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
                this._roundRect(ctx, 70, itemY, 940, 105, 22);
                ctx.fill();
                ctx.strokeStyle = m.border;
                ctx.lineWidth = 2;
                ctx.stroke();

                // Medalla / Puesto a la izquierda
                ctx.textAlign = 'left';
                ctx.fillStyle = m.color;
                ctx.font = '900 32px "Inter", sans-serif';
                ctx.fillText(m.badge, 105, itemY + 52);

                // Nombre
                ctx.fillStyle = '#ffffff';
                ctx.font = '900 38px "Outfit", "Inter", sans-serif';
                const pName = (p.name || 'JUGADOR').toUpperCase();
                const truncatedName = pName.length > 20 ? pName.substring(0, 18) + '...' : pName;
                ctx.fillText(truncatedName, 370, itemY + 52);

                // Puntos
                ctx.textAlign = 'right';
                ctx.fillStyle = '#CCFF00';
                ctx.font = '950 40px "Outfit", "Inter", sans-serif';
                ctx.fillText(`${p.points} PTS`, 970, itemY + 52);
            }

            // 7. HIGHLIGHT & MOMENTOS CUMBRE (Y: 1280 a 1620)
            const hlY = 1290;
            ctx.textAlign = 'center';
            ctx.fillStyle = '#38bdf8';
            ctx.font = '900 30px "Outfit", "Inter", sans-serif';
            ctx.fillText('⚡ MOMENTO CUMBRE & RECORD', 540, hlY);

            const hlCardY = hlY + 40;
            ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
            this._roundRect(ctx, 70, hlCardY, 940, 240, 24);
            ctx.fill();
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Texto partido cumbre
            ctx.fillStyle = '#38bdf8';
            ctx.font = '800 26px "Inter", sans-serif';
            ctx.fillText('🔥 PARTIDO MÁS INTENSO', 540, hlCardY + 45);

            ctx.fillStyle = '#ffffff';
            ctx.font = '900 36px "Outfit", "Inter", sans-serif';
            const matchSummary = hl.closestMatch?.summary || 'Duelo épico resuelto con máxima paridad';
            const cleanSummary = matchSummary.length > 40 ? matchSummary.substring(0, 38) + '...' : matchSummary;
            ctx.fillText(cleanSummary, 540, hlCardY + 105);

            // Sublínea
            ctx.fillStyle = '#cbd5e1';
            ctx.font = '600 26px "Inter", sans-serif';
            const streakText = hl.longestStreak?.description || 'Extraordinario nivel competitivo de todos los jugadores';
            ctx.fillText(streakText, 540, hlCardY + 170);

            // 8. PIE DE STORY SOMOSPÁDEL (Y: 1680 a 1840)
            ctx.textAlign = 'center';
            this._drawBadgePill(ctx, 540, 1720, '🎾 ÚNETE A LA COMUNIDAD EN SOMOSPADEL.ES', '#ffffff', 'rgba(255, 255, 255, 0.08)');

            ctx.fillStyle = '#94a3b8';
            ctx.font = '800 26px "Inter", sans-serif';
            ctx.fillText('@somospadelbcn  •  #SomosPadel  •  Barcelona', 540, 1785);

            ctx.fillStyle = '#64748b';
            ctx.font = '600 20px "Inter", sans-serif';
            ctx.fillText('Generado automáticamente por el motor de IA deportiva de SomosPádel', 540, 1835);
        }

        _drawBadgePill(ctx, x, y, text, textColor, bgColor) {
            ctx.save();
            ctx.font = '900 22px "Inter", sans-serif';
            const metrics = ctx.measureText(text);
            const w = metrics.width + 36;
            const h = 46;

            ctx.fillStyle = bgColor;
            this._roundRect(ctx, x - (w / 2), y - (h / 2), w, h, 23);
            ctx.fill();

            ctx.fillStyle = textColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, x, y);
            ctx.restore();
        }

        _drawKpiBox(ctx, x, y, w, h, mainVal, label) {
            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
            this._roundRect(ctx, x, y, w, h, 14);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#CCFF00';
            ctx.font = '950 32px "Outfit", "Inter", sans-serif';
            ctx.fillText(mainVal, x + (w / 2), y + 25);

            ctx.fillStyle = '#94a3b8';
            ctx.font = '800 16px "Inter", sans-serif';
            ctx.fillText(label, x + (w / 2), y + 54);
            ctx.restore();
        }

        _roundRect(ctx, x, y, width, height, radius) {
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + width - radius, y);
            ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
            ctx.lineTo(x + width, y + height - radius);
            ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            ctx.lineTo(x + radius, y + height);
            ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
        }

        _getInitials(name) {
            if (!name) return 'SP';
            const parts = String(name).trim().split(/\s+/);
            if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }

        _showToast(msg) {
            const toast = document.createElement('div');
            toast.style.cssText = `
                position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%) translateY(20px);
                background: rgba(15, 23, 42, 0.95); border: 1px solid rgba(204, 255, 0, 0.5);
                color: #ffffff; padding: 12px 24px; border-radius: 999px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.8), 0 0 15px rgba(204, 255, 0, 0.3);
                font-weight: 800; font-size: 0.85rem; z-index: 16000;
                display: flex; align-items: center; gap: 8px;
                opacity: 0; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            `;
            toast.innerHTML = msg;
            document.body.appendChild(toast);

            requestAnimationFrame(() => {
                toast.style.opacity = '1';
                toast.style.transform = 'translateX(-50%) translateY(0)';
            });

            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(-50%) translateY(20px)';
                setTimeout(() => toast.remove(), 350);
            }, 2600);
        }
    }

    const instance = new TournamentChronicleModal();
    return instance;
}));
