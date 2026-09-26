/**
 * SosSubstitutesWidget.js
 * 
 * 🚨 BOLSA DE SUPLENTES SOS & MATCHMAKING INTELIGENTE - SomosPádel BCN
 * 
 * Componente frontend y experiencia visual completa para la gestión de bajas
 * urgentes, matchmaking con compatibilidad inteligente y bolsa de guardia activa.
 * 
 * Estilo SomosPádel BCN: Dark Glassmorphism, neón rojo urgencia (#EF4444),
 * ámbar (#F59E0B), verde neón (#CCFF00), celeste (#38BDF8), tipografía Outfit/Inter.
 * 
 * Expuesto globalmente en `window.SosSubstitutesWidget`.
 */

(function (global) {
    'use strict';

    class SosSubstitutesWidget {
        constructor() {
            this.containerId = 'sos-substitutes-widget-root';
            this.currentContainer = null;
            this.isMounted = false;
            this.isLoading = false;
            this.alerts = [];
            this.substitutes = [];
            this.guardStatus = { isAvailable: false, timeSlot: 'tardes', date: '' };
            this.currentUser = null;
            this.expandedReasons = new Set();
            this._boundEventHandlers = false;
            this._refreshDebounceTimer = null;
            this.activeModal = null; // 'create' | 'guardList' | 'confirmJoin'

            console.log('🚨 [SosSubstitutesWidget] Módulo visual cargado.');
        }

        // =========================================================================
        // 1. MONTAJE & CICLO DE VIDA
        // =========================================================================

        /**
         * Monta el widget en un contenedor del DOM
         * @param {string|HTMLElement} containerOrId 
         */
        async mount(containerOrId) {
            let container = null;
            if (typeof containerOrId === 'string') {
                container = document.getElementById(containerOrId);
                this.containerId = containerOrId;
            } else if (containerOrId && containerOrId.nodeType === 1) {
                container = containerOrId;
                this.containerId = container.id || 'sos-substitutes-widget-root';
            }

            if (!container) {
                // Si aún no está en el DOM, buscar por ID por defecto
                container = document.getElementById(this.containerId);
            }

            if (!container) {
                // Silencioso: no bloquear si la vista actual no contiene el contenedor
                return;
            }

            this.currentContainer = container;
            this.injectStyles();
            this._bindServiceEvents();

            // Cargar datos y renderizar
            await this.refresh(false);
            this.isMounted = true;
        }

        /**
         * Actualiza los datos y re-renderiza la interfaz
         * @param {boolean} showLoading 
         */
        async refresh(showLoading = false) {
            if (!this.currentContainer && this.containerId) {
                this.currentContainer = document.getElementById(this.containerId);
            }
            if (!this.currentContainer) return;

            if (showLoading) {
                this.currentContainer.innerHTML = this.renderLoadingSkeleton();
            }

            try {
                this.currentUser = this._resolveCurrentUser();
                const service = window.SosSubstitutesService;

                if (service) {
                    const [activeAlerts, availableSubs] = await Promise.all([
                        service.getActiveSosAlerts().catch(() => []),
                        service.getAvailableSubstitutes().catch(() => [])
                    ]);

                    this.alerts = Array.isArray(activeAlerts) ? activeAlerts : [];
                    this.substitutes = Array.isArray(availableSubs) ? availableSubs : [];

                    const uid = this.currentUser?.uid || this.currentUser?.id;
                    if (uid) {
                        this.guardStatus = service.getPlayerAvailability(uid);
                    }
                }

                this.render();
            } catch (err) {
                console.error('❌ [SosSubstitutesWidget] Error en refresh:', err);
                if (this.currentContainer) {
                    this.currentContainer.innerHTML = this.renderErrorState(err.message);
                }
            }
        }

        /**
         * Re-renderiza el contenido HTML en el contenedor actual
         */
        render() {
            if (!this.currentContainer) return;

            const hasActiveAlerts = this.alerts.length > 0;
            const containerClass = `sp-sos-widget-wrapper ${hasActiveAlerts ? 'sos-has-alerts' : 'sos-no-alerts'}`;

            this.currentContainer.innerHTML = `
                <div class="${containerClass}" id="sp-sos-widget-main-card">
                    <!-- Glow decorativo superior -->
                    <div class="sos-glow-decor top-right"></div>
                    <div class="sos-glow-decor bottom-left"></div>

                    <!-- CABECERA DEL WIDGET -->
                    ${this.renderHeader(hasActiveAlerts)}

                    <!-- SECCIÓN A: ALERTAS SOS DE EMERGENCIA ACTIVAS -->
                    <div class="sos-alerts-section">
                        ${hasActiveAlerts ? this.renderAlertsList() : this.renderEmptyAlertsState()}
                    </div>

                    <!-- SECCIÓN B: PANEL DE GUARDIA ACTIVA HOY -->
                    <div class="sos-guard-section">
                        ${this.renderGuardActivePanel()}
                    </div>
                </div>
            `;
        }

        // =========================================================================
        // 2. RENDERS PARCIALES: CABECERA & BADGES
        // =========================================================================

        renderHeader(hasActiveAlerts) {
            const urgentCount = this.alerts.length;
            const subsCount = this.substitutes.length;

            return `
                <div class="sos-header-row">
                    <div class="sos-header-left">
                        <div class="sos-radar-icon-wrap ${hasActiveAlerts ? 'sos-radar-live' : ''}">
                            <span class="sos-radar-ping"></span>
                            <span class="sos-radar-ping ping-2"></span>
                            <span class="sos-radar-siren">🚨</span>
                        </div>
                        <div>
                            <div class="sos-badge-line">
                                <span class="sos-urgent-pill ${hasActiveAlerts ? 'pulse-urgent' : 'pill-calm'}">
                                    <i class="fas ${hasActiveAlerts ? 'fa-fire' : 'fa-check-circle'}"></i> 
                                    ${hasActiveAlerts ? `${urgentCount} ${urgentCount === 1 ? 'PLAZA URGENTE' : 'PLAZAS URGENTES'}` : 'PISTAS CUBIERTAS'}
                                </span>
                                <span class="sos-honor-xp-pill">
                                    <i class="fas fa-bolt"></i> +150 XP HONOR
                                </span>
                            </div>
                            <h3 class="sos-main-title">
                                BOLSA DE SUPLENTES SOS
                            </h3>
                            <p class="sos-subtitle">
                                Matchmaking Inteligente de Bajas de Última Hora
                            </p>
                        </div>
                    </div>

                    <!-- ACCIONES RÁPIDAS DE CABECERA -->
                    <div class="sos-header-actions">
                        <button type="button" class="sos-btn-header-cta" onclick="window.SosSubstitutesWidget?.openCreateAlertModal()">
                            <i class="fas fa-plus-circle"></i>
                            <span>Pedir Suplente</span>
                        </button>
                        <button type="button" class="sos-btn-header-sub" onclick="window.SosSubstitutesWidget?.openGuardListModal()">
                            <i class="fas fa-user-shield"></i>
                            <span>Guardia (${subsCount})</span>
                        </button>
                    </div>
                </div>
            `;
        }

        // =========================================================================
        // 3. SECCIÓN A: TARJETAS DE ALERTAS ACTIVAS & COMPATIBILIDAD
        // =========================================================================

        renderAlertsList() {
            return `
                <div class="sos-alerts-grid">
                    ${this.alerts.map(alert => this.renderAlertCard(alert)).join('')}
                </div>
            `;
        }

        renderAlertCard(alert) {
            const service = window.SosSubstitutesService;
            const currentUser = this.currentUser || {};
            const compat = service ? service.calculateCompatibility(currentUser, alert) : { score: 75, label: 'Compatible', reasons: [] };

            const isExpanded = this.expandedReasons.has(alert.id);
            const scoreColor = this._getScoreColor(compat.score);
            const scoreBg = this._getScoreBg(compat.score);
            const scoreBadgeClass = this._getScoreBadgeClass(compat.score);

            const eventTypeLabel = (alert.eventType === 'entrenos' || alert.eventType === 'entreno') ? 'ENTRENO TÁCTICO' : 'TORNEO AMERICANO';
            const eventIcon = (alert.eventType === 'entrenos' || alert.eventType === 'entreno') ? '🎾' : '🏆';
            const sideLabel = this._formatSideName(alert.sideNeeded);

            return `
                <div class="sos-alert-card ${compat.score >= 80 ? 'elite-match-glow' : ''}" data-alert-id="${alert.id}">
                    <!-- Ribbon / Barra Superior de la Tarjeta -->
                    <div class="sos-card-topbar">
                        <div class="sos-event-meta">
                            <span class="sos-type-chip">${eventIcon} ${eventTypeLabel}</span>
                            <span class="sos-time-chip">
                                <i class="far fa-clock"></i> Hoy ${alert.time || '19:30'}
                            </span>
                            <span class="sos-court-chip">
                                <i class="fas fa-map-marker-alt"></i> ${alert.court || 'Pista Principal'}
                            </span>
                        </div>
                        <div class="sos-xp-tag">
                            +${alert.bonusXp || 150} XP
                        </div>
                    </div>

                    <!-- Título del Evento y Requisitos -->
                    <div class="sos-card-body">
                        <div class="sos-card-title-row">
                            <h4 class="sos-card-title">${alert.eventName || 'Torneo Americano Express'}</h4>
                            <div class="sos-slots-badge">
                                <strong>${alert.slotsNeeded || 1}</strong> vacante libre
                            </div>
                        </div>

                        <!-- Pills de requisitos: Nivel y Lado -->
                        <div class="sos-req-pills">
                            <span class="sos-req-pill req-level">
                                <i class="fas fa-layer-group"></i> Nivel ${Number(alert.levelMin || 3.0).toFixed(1)} - ${Number(alert.levelMax || 4.5).toFixed(1)}
                            </span>
                            <span class="sos-req-pill req-side">
                                <i class="fas fa-arrows-alt-h"></i> Lado: <strong>${sideLabel}</strong>
                            </span>
                            ${alert.bonusText ? `<span class="sos-req-pill req-bonus"><i class="fas fa-award"></i> ${alert.bonusText}</span>` : ''}
                        </div>

                        <!-- INDICADOR DE COMPATIBILIDAD INTELIGENTE -->
                        <div class="sos-compat-box">
                            <div class="sos-compat-header">
                                <div class="sos-compat-title">
                                    <span class="sos-ai-sparkle">✨</span>
                                    <span>Tu Afinidad Matchmaking:</span>
                                </div>
                                <div class="sos-compat-score-badge ${scoreBadgeClass}" style="color: ${scoreColor}; background: ${scoreBg};">
                                    ${compat.score}% • ${compat.label}
                                </div>
                            </div>

                            <!-- Barra de progreso visual con brillo -->
                            <div class="sos-progress-track">
                                <div class="sos-progress-fill" style="width: ${compat.score}%; background: linear-gradient(90deg, #38BDF8 0%, ${scoreColor} 100%);">
                                    <span class="sos-progress-dot"></span>
                                </div>
                            </div>

                            <!-- Desglose de motivos / Tooltip interactivo -->
                            <div class="sos-reasons-wrapper">
                                <button type="button" class="sos-btn-toggle-reasons" onclick="window.SosSubstitutesWidget?.toggleReasons('${alert.id}')">
                                    <span>${isExpanded ? 'Ocultar desglose de afinidad' : '¿Por qué encajas en esta plaza?'}</span>
                                    <i class="fas ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}"></i>
                                </button>
                                
                                ${isExpanded ? `
                                    <div class="sos-reasons-list fade-in">
                                        ${compat.reasons.map(r => `
                                            <div class="sos-reason-item">
                                                <i class="fas fa-check-circle" style="color: ${scoreColor};"></i>
                                                <span>${r}</span>
                                            </div>
                                        `).join('')}
                                    </div>
                                ` : ''}
                            </div>
                        </div>

                        <!-- BOTÓN DE ACCIÓN RÁPIDA: CUBRIR PLAZA -->
                        <div class="sos-cta-row">
                            <button type="button" class="sos-btn-join-alert haptic-feedback" onclick="window.SosSubstitutesWidget?.openConfirmJoinModal('${alert.id}')">
                                <span class="sos-btn-shine"></span>
                                <span class="sos-btn-content">
                                    <i class="fas fa-running"></i>
                                    <strong>¡CUBRIR PLAZA!</strong>
                                    <span class="sos-btn-subtext">(+${alert.bonusXp || 150} XP Inmediatos)</span>
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        renderEmptyAlertsState() {
            return `
                <div class="sos-empty-card">
                    <div class="sos-empty-icon-ring">
                        <i class="fas fa-shield-alt"></i>
                    </div>
                    <div class="sos-empty-text">
                        <h4 class="sos-empty-title">¡Pistas al 100%! No hay bajas urgentes ahora</h4>
                        <p class="sos-empty-desc">
                            La comunidad de SomosPádel está a pleno rendimiento. Activa tu Guardia abajo para recibir un aviso express si surge cualquier hueco y gana <strong>+150 XP de honor</strong>.
                        </p>
                    </div>
                    <div class="sos-empty-badge">
                        <i class="fas fa-check-double"></i> Todo cubierto en el club
                    </div>
                </div>
            `;
        }

        // =========================================================================
        // 4. SECCIÓN B: PANEL DE GUARDIA ACTIVA (DISPONIBILIDAD HOY)
        // =========================================================================

        renderGuardActivePanel() {
            const isAvail = Boolean(this.guardStatus.isAvailable);
            const currentSlot = this.guardStatus.timeSlot || 'tardes';
            const subsCount = this.substitutes.length;

            return `
                <div class="sos-guard-card ${isAvail ? 'guard-is-active' : ''}">
                    <div class="sos-guard-header-row">
                        <div class="sos-guard-title-block">
                            <div class="sos-guard-icon">
                                <i class="fas fa-user-shield"></i>
                            </div>
                            <div>
                                <h4 class="sos-guard-title">Tu Guardia Activa de Hoy</h4>
                                <p class="sos-guard-desc">¿Disponible si falta alguien a última hora? Tendrás prioridad máxima en matchmaking.</p>
                            </div>
                        </div>

                        <!-- Badge de estado -->
                        <div class="sos-guard-status-pill ${isAvail ? 'pill-active-glow' : 'pill-inactive'}">
                            <span class="sos-guard-pulse-dot"></span>
                            <strong>${isAvail ? 'EN GUARDIA ACTIVA HOY' : 'EN DESCANSO'}</strong>
                        </div>
                    </div>

                    <!-- Control Interactivo: Toggle y Selector de Franja -->
                    <div class="sos-guard-controls">
                        <!-- Switch Toggle Grande -->
                        <div class="sos-toggle-container" onclick="window.SosSubstitutesWidget?.toggleAvailability()">
                            <div class="sos-custom-switch ${isAvail ? 'checked' : ''}">
                                <div class="sos-switch-handle"></div>
                            </div>
                            <span class="sos-toggle-label">
                                ${isAvail ? 'Estoy disponible para jugar hoy si surge una vacante' : 'Activar mi disponibilidad de suplente hoy'}
                            </span>
                        </div>

                        <!-- Selector de Franjas Horarias -->
                        <div class="sos-slot-selector-row">
                            <span class="sos-slot-label">Franja preferida:</span>
                            <div class="sos-slot-buttons">
                                <button type="button" 
                                    class="sos-slot-btn ${currentSlot === 'mananas' ? 'active' : ''}" 
                                    onclick="window.SosSubstitutesWidget?.setGuardSlot('mananas')">
                                    <i class="fas fa-sun"></i> Mañanas <span>(9:00 - 14:00)</span>
                                </button>
                                <button type="button" 
                                    class="sos-slot-btn ${currentSlot === 'tardes' ? 'active' : ''}" 
                                    onclick="window.SosSubstitutesWidget?.setGuardSlot('tardes')">
                                    <i class="fas fa-moon"></i> Tardes <span>(17:00 - 22:30)</span>
                                </button>
                                <button type="button" 
                                    class="sos-slot-btn ${currentSlot === 'todo_el_dia' ? 'active' : ''}" 
                                    onclick="window.SosSubstitutesWidget?.setGuardSlot('todo_el_dia')">
                                    <i class="fas fa-bolt"></i> Todo el día
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Footer de la Guardia con Enlace a la Bolsa General -->
                    <div class="sos-guard-footer">
                        <div class="sos-guard-info-hint">
                            <i class="fas fa-sparkles" style="color: #CCFF00;"></i>
                            <span>Estar en guardia activa suma <strong>+25% de afinidad</strong> en el radar SOS.</span>
                        </div>
                        <button type="button" class="sos-btn-view-pool" onclick="window.SosSubstitutesWidget?.openGuardListModal()">
                            <i class="fas fa-users"></i>
                            <span>Ver Suplentes de Guardia (${subsCount})</span>
                        </button>
                    </div>
                </div>
            `;
        }

        // =========================================================================
        // 5. ACCIONES & CONTROLADORES INTERACTIVOS
        // =========================================================================

        /**
         * Alterna el estado de guardia activa (ON / OFF)
         */
        async toggleAvailability() {
            this._hapticFeedback(25);
            const service = window.SosSubstitutesService;
            if (!service) return;

            const currentUser = this._resolveCurrentUser();
            if (!currentUser) {
                this._showNotification('Inicia sesión para gestionar tu guardia activa', 'warning');
                return;
            }

            const current = this.guardStatus.isAvailable;
            const newStatus = !current;
            const timeSlot = this.guardStatus.timeSlot || 'tardes';

            try {
                const res = await service.setPlayerAvailability(currentUser, {
                    isAvailable: newStatus,
                    timeSlot
                });

                this.guardStatus = res;

                if (newStatus) {
                    this._celebrateSparkles();
                    this._showNotification('🛡️ ¡Guardia activada! Recibirás avisos preferentes si falta alguien hoy.', 'success');
                } else {
                    this._showNotification('Guardia desactivada. ¡Que disfrutes del descanso!', 'info');
                }

                await this.refresh(false);
            } catch (err) {
                console.error('[SosSubstitutesWidget] Error al cambiar guardia:', err);
                this._showNotification('Error al actualizar disponibilidad', 'error');
            }
        }

        /**
         * Cambia la franja horaria de guardia seleccionada
         * @param {string} slot 'mananas' | 'tardes' | 'todo_el_dia'
         */
        async setGuardSlot(slot) {
            this._hapticFeedback(15);
            const service = window.SosSubstitutesService;
            if (!service) return;

            const currentUser = this._resolveCurrentUser();
            if (!currentUser) return;

            try {
                const res = await service.setPlayerAvailability(currentUser, {
                    isAvailable: true, // Si selecciona franja, activamos la disponibilidad
                    timeSlot: slot
                });

                this.guardStatus = res;
                this._showNotification(`Franja actualizada a ${this._formatSlotName(slot)}`, 'success');
                await this.refresh(false);
            } catch (err) {
                console.error('[SosSubstitutesWidget] Error al cambiar franja:', err);
            }
        }

        /**
         * Expande o colapsa el desglose de compatibilidad de una alerta
         * @param {string} alertId 
         */
        toggleReasons(alertId) {
            this._hapticFeedback(10);
            if (this.expandedReasons.has(alertId)) {
                this.expandedReasons.delete(alertId);
            } else {
                this.expandedReasons.add(alertId);
            }
            this.render();
        }

        /**
         * Desplaza la pantalla con suavidad hacia el widget y resalta su borde
         */
        scrollToWidget() {
            const root = this.currentContainer || document.getElementById(this.containerId);
            if (root) {
                root.scrollIntoView({ behavior: 'smooth', block: 'center' });
                const card = root.querySelector('#sp-sos-widget-main-card') || root;
                card.classList.add('sos-highlight-focus');
                setTimeout(() => card.classList.remove('sos-highlight-focus'), 1800);
            }
        }

        // =========================================================================
        // 6. MODALES: CONFIRMAR RESCATE, VER BOLSA Y CREAR ALERTA
        // =========================================================================

        /**
         * Modal 1: Confirmación de Rescate / Cubrir Plaza SOS
         * @param {string} alertId 
         */
        async openConfirmJoinModal(alertId) {
            this._hapticFeedback(30);
            const alert = this.alerts.find(a => a.id === alertId);
            if (!alert) {
                this._showNotification('Alerta SOS no encontrada', 'error');
                return;
            }

            const currentUser = this._resolveCurrentUser();
            const service = window.SosSubstitutesService;
            const compat = service ? service.calculateCompatibility(currentUser, alert) : { score: 85, label: 'Compatible', reasons: [] };
            const scoreColor = this._getScoreColor(compat.score);

            const modalHtml = `
                <div class="sos-modal-overlay fade-in" id="sp-sos-confirm-modal">
                    <div class="sos-modal-dialog">
                        <button type="button" class="sos-modal-close-btn" onclick="window.SosSubstitutesWidget?.closeModal()">&times;</button>
                        
                        <div class="sos-modal-header text-center">
                            <div class="sos-modal-icon-badge fire-pulse">
                                🚨
                            </div>
                            <h3 class="sos-modal-title">¡CUBRIR VACANTE SOS!</h3>
                            <p class="sos-modal-subtitle">Rescata la partida y sé el héroe de la jornada</p>
                        </div>

                        <div class="sos-confirm-body">
                            <!-- Ficha de resumen del partido -->
                            <div class="sos-confirm-card">
                                <div class="sos-confirm-row">
                                    <span class="label"><i class="fas fa-trophy"></i> Evento:</span>
                                    <span class="value">${alert.eventName}</span>
                                </div>
                                <div class="sos-confirm-row">
                                    <span class="label"><i class="far fa-clock"></i> Horario:</span>
                                    <span class="value highlight-text">Hoy a las ${alert.time}</span>
                                </div>
                                <div class="sos-confirm-row">
                                    <span class="label"><i class="fas fa-map-pin"></i> Pista:</span>
                                    <span class="value">${alert.court || 'Pista Principal'}</span>
                                </div>
                                <div class="sos-confirm-row">
                                    <span class="label"><i class="fas fa-layer-group"></i> Nivel:</span>
                                    <span class="value">${Number(alert.levelMin).toFixed(1)} - ${Number(alert.levelMax).toFixed(1)}</span>
                                </div>
                                <div class="sos-confirm-row">
                                    <span class="label"><i class="fas fa-arrows-alt-h"></i> Posición:</span>
                                    <span class="value">${this._formatSideName(alert.sideNeeded)}</span>
                                </div>
                            </div>

                            <!-- Afinidad y Bonificación -->
                            <div class="sos-confirm-perks">
                                <div class="perk-compat" style="border-left: 3px solid ${scoreColor};">
                                    <span class="score" style="color: ${scoreColor};">${compat.score}%</span>
                                    <span class="desc">Afinidad calculada con tu estilo</span>
                                </div>
                                <div class="perk-xp">
                                    <span class="xp-val">+${alert.bonusXp || 150} XP</span>
                                    <span class="desc">Bonificación de Honor al instante</span>
                                </div>
                            </div>

                            <p class="sos-confirm-notice">
                                <i class="fas fa-info-circle"></i> Al confirmar, se te inscribirá de forma inmediata en la plaza y se avisará a los organizadores.
                            </p>

                            <!-- Botones de Acción -->
                            <div class="sos-modal-actions">
                                <button type="button" class="sos-btn-cancel" onclick="window.SosSubstitutesWidget?.closeModal()">
                                    Pensarlo mejor
                                </button>
                                <button type="button" class="sos-btn-confirm-action" id="sos-btn-exec-join" onclick="window.SosSubstitutesWidget?.executeJoinAlert('${alert.id}')">
                                    <i class="fas fa-bolt"></i> ¡CONFIRMAR Y JUGAR!
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            this._injectModal(modalHtml);
        }

        /**
         * Ejecuta la postulación definitiva para una alerta SOS
         * @param {string} alertId 
         */
        async executeJoinAlert(alertId) {
            const btn = document.getElementById('sos-btn-exec-join');
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> Asignando plaza...`;
            }

            this._hapticFeedback(50);
            const service = window.SosSubstitutesService;
            const currentUser = this._resolveCurrentUser();

            try {
                if (!service) throw new Error("Servicio SOS no disponible");

                const result = await service.joinSosAlert(alertId, currentUser);

                if (!result.success) {
                    this._showNotification(result.reason || 'No se pudo cubrir la plaza', 'warning');
                    this.closeModal();
                    await this.refresh(false);
                    return;
                }

                // Celebración con Confetti y Vibración Premium
                this._celebrateBigWin();
                this._hapticFeedback([60, 40, 80]);

                this.closeModal();
                this._showRescueSuccessModal(result.alert, result.bonusXp);
                await this.refresh(false);

            } catch (err) {
                console.error('[SosSubstitutesWidget] Error cubriendo plaza:', err);
                this._showNotification(err.message || 'Error al asignar la plaza', 'error');
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = `<i class="fas fa-bolt"></i> Reintentar`;
                }
            }
        }

        /**
         * Modal de éxito tras rescate completado
         */
        _showRescueSuccessModal(alert, bonusXp = 150) {
            const modalHtml = `
                <div class="sos-modal-overlay fade-in" id="sp-sos-success-modal">
                    <div class="sos-modal-dialog success-border text-center">
                        <button type="button" class="sos-modal-close-btn" onclick="window.SosSubstitutesWidget?.closeModal()">&times;</button>
                        
                        <div class="sos-success-trophy-wrap">
                            <span class="sos-trophy-emoji">🦸‍♂️</span>
                        </div>
                        <h3 class="sos-success-title">¡ERES EL HÉROE SOS!</h3>
                        <p class="sos-success-subtitle">Has cubierto con éxito la plaza en <strong>${alert?.eventName || 'el evento'}</strong></p>

                        <div class="sos-success-xp-card">
                            <div class="xp-number">+${bonusXp} XP</div>
                            <div class="xp-label">PUNTOS DE HONOR OTORGADOS A TU PERFIL</div>
                        </div>

                        <p class="sos-success-hint">
                            Preséntate en <strong>${alert?.court || 'Pista Principal'}</strong> a las <strong>${alert?.time || 'la hora indicada'}</strong>. ¡A darlo todo en la pista!
                        </p>

                        <div class="sos-modal-actions single">
                            <button type="button" class="sos-btn-confirm-action green" onclick="window.SosSubstitutesWidget?.closeModal()">
                                <i class="fas fa-check"></i> ¡ENTENDIDO, A LA PISTA!
                            </button>
                        </div>
                    </div>
                </div>
            `;
            this._injectModal(modalHtml);
        }

        /**
         * Modal 2: Bolsa de Suplentes de Guardia Hoy
         */
        async openGuardListModal() {
            this._hapticFeedback(20);
            const service = window.SosSubstitutesService;
            let subs = this.substitutes;

            if (service) {
                subs = await service.getAvailableSubstitutes().catch(() => this.substitutes);
                this.substitutes = subs;
            }

            const modalHtml = `
                <div class="sos-modal-overlay fade-in" id="sp-sos-guard-list-modal">
                    <div class="sos-modal-dialog wide">
                        <button type="button" class="sos-modal-close-btn" onclick="window.SosSubstitutesWidget?.closeModal()">&times;</button>
                        
                        <div class="sos-modal-header">
                            <div class="flex-align-gap">
                                <div class="sos-modal-icon-badge blue">🛡️</div>
                                <div>
                                    <h3 class="sos-modal-title">BOLSA DE SUPLENTES DE GUARDIA</h3>
                                    <p class="sos-modal-subtitle">Jugadores disponibles hoy para cubrir bajas de última hora</p>
                                </div>
                            </div>
                        </div>

                        <!-- Filtros por Lado -->
                        <div class="sos-modal-filter-tabs">
                            <button type="button" class="filter-tab active" onclick="window.SosSubstitutesWidget?.filterGuardListModal('all', this)">Todos (${subs.length})</button>
                            <button type="button" class="filter-tab" onclick="window.SosSubstitutesWidget?.filterGuardListModal('reves', this)">Revés</button>
                            <button type="button" class="filter-tab" onclick="window.SosSubstitutesWidget?.filterGuardListModal('drive', this)">Drive</button>
                        </div>

                        <!-- Lista de Jugadores de Guardia -->
                        <div class="sos-guard-players-list" id="sos-guard-players-container">
                            ${subs.length === 0 ? `
                                <div class="sos-empty-subs">
                                    <i class="fas fa-user-clock"></i>
                                    <p>Aún no hay suplentes anotados en guardia hoy.</p>
                                </div>
                            ` : subs.map(sub => this._renderGuardPlayerItem(sub)).join('')}
                        </div>

                        <!-- Footer con Acción para unirse a la guardia -->
                        <div class="sos-modal-footer-guard">
                            <div class="footer-left-info">
                                <i class="fas fa-info-circle"></i> Puedes cambiar tu estado en la pantalla de inicio cuando quieras.
                            </div>
                            <button type="button" class="sos-btn-header-cta" onclick="window.SosSubstitutesWidget?.closeModal(); window.SosSubstitutesWidget?.toggleAvailability();">
                                ${this.guardStatus.isAvailable ? 'Desactivar mi guardia' : '¡Ponerme de Guardia Hoy!'}
                            </button>
                        </div>
                    </div>
                </div>
            `;

            this._injectModal(modalHtml);
        }

        _renderGuardPlayerItem(sub) {
            const sideName = this._formatSideName(sub.side);
            const slotName = this._formatSlotName(sub.timeSlot);
            const levelVal = Number(sub.level || 3.5).toFixed(2);
            const initials = this._getInitials(sub.name);

            return `
                <div class="sos-player-item-card" data-side="${sub.side || 'any'}">
                    <div class="player-left">
                        <div class="player-avatar">
                            ${sub.photoURL ? `<img src="${sub.photoURL}" alt="${sub.name}" onerror="this.style.display='none'">` : ''}
                            <span class="avatar-initials">${initials}</span>
                        </div>
                        <div class="player-details">
                            <div class="player-name">${sub.name || 'Jugador SomosPadel'}</div>
                            <div class="player-badges">
                                <span class="badge-level">Nv. ${levelVal}</span>
                                <span class="badge-side">${sideName}</span>
                                <span class="badge-slot"><i class="far fa-clock"></i> ${slotName}</span>
                            </div>
                        </div>
                    </div>

                    <div class="player-right-action">
                        <span class="active-pulse-beacon"></span>
                        <span class="ready-tag">LISTO</span>
                    </div>
                </div>
            `;
        }

        /**
         * Filtra la lista de jugadores dentro del modal de guardia
         */
        filterGuardListModal(sideFilter, tabBtn) {
            this._hapticFeedback(10);
            const container = document.getElementById('sos-guard-players-container');
            const tabs = document.querySelectorAll('.sos-modal-filter-tabs .filter-tab');
            tabs.forEach(t => t.classList.remove('active'));
            if (tabBtn) tabBtn.classList.add('active');

            if (!container) return;
            const items = container.querySelectorAll('.sos-player-item-card');

            items.forEach(card => {
                const side = card.getAttribute('data-side') || 'any';
                if (sideFilter === 'all') {
                    card.style.display = 'flex';
                } else if (sideFilter === 'reves') {
                    card.style.display = (side === 'reves' || side === 'any') ? 'flex' : 'none';
                } else if (sideFilter === 'drive') {
                    card.style.display = (side === 'drive' || side === 'any') ? 'flex' : 'none';
                }
            });
        }

        /**
         * Modal 3: Publicar Alerta SOS de Emergencia ("Pedir Suplente Urgente")
         */
        openCreateAlertModal() {
            this._hapticFeedback(25);
            const now = new Date();
            const defaultTime = `${String(Math.min(22, now.getHours() + 1)).padStart(2, '0')}:30`;
            const todayStr = this._getTodayDateString();

            const modalHtml = `
                <div class="sos-modal-overlay fade-in" id="sp-sos-create-modal">
                    <div class="sos-modal-dialog">
                        <button type="button" class="sos-modal-close-btn" onclick="window.SosSubstitutesWidget?.closeModal()">&times;</button>
                        
                        <div class="sos-modal-header">
                            <div class="flex-align-gap">
                                <div class="sos-modal-icon-badge red fire-pulse">🚨</div>
                                <div>
                                    <h3 class="sos-modal-title">PEDIR SUPLENTE URGENTE</h3>
                                    <p class="sos-modal-subtitle">Aviso express a todos los jugadores de guardia compatibles</p>
                                </div>
                            </div>
                        </div>

                        <form id="sos-create-alert-form" class="sos-form-body" onsubmit="window.SosSubstitutesWidget?.submitCreateAlertForm(event)">
                            <!-- Tipo de Evento -->
                            <div class="form-group">
                                <label class="form-label">Tipo de Convocatoria:</label>
                                <div class="form-segmented-pills">
                                    <label class="pill-radio">
                                        <input type="radio" name="eventType" value="americana" checked>
                                        <span>🏆 Torneo Americano</span>
                                    </label>
                                    <label class="pill-radio">
                                        <input type="radio" name="eventType" value="entrenos">
                                        <span>🎾 Entreno / Partido</span>
                                    </label>
                                </div>
                            </div>

                            <!-- Nombre o Pista del Evento -->
                            <div class="form-group">
                                <label class="form-label" for="sos-form-name">Nombre del Evento:</label>
                                <input type="text" id="sos-form-name" class="form-input" placeholder="Ej. Torneo Americano Nivel 3.5 o Entreno Express" value="Torneo Americano Express">
                            </div>

                            <!-- Horario y Pista -->
                            <div class="form-grid-2">
                                <div class="form-group">
                                    <label class="form-label" for="sos-form-time">Hora del Partido:</label>
                                    <input type="time" id="sos-form-time" class="form-input" value="${defaultTime}" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label" for="sos-form-court">Pista:</label>
                                    <input type="text" id="sos-form-court" class="form-input" placeholder="Ej. Pista 1" value="Pista Central">
                                </div>
                            </div>

                            <!-- Nivel Requerido -->
                            <div class="form-group">
                                <label class="form-label">Rango de Nivel Aprox:</label>
                                <div class="form-grid-2">
                                    <div>
                                        <span class="sub-label">Mínimo:</span>
                                        <select id="sos-form-level-min" class="form-select">
                                            <option value="2.5">2.50 (Iniciación Alta)</option>
                                            <option value="3.0">3.00 (Intermedio)</option>
                                            <option value="3.5" selected>3.50 (Intermedio Alto)</option>
                                            <option value="4.0">4.00 (Avanzado)</option>
                                            <option value="4.5">4.50 (Competición)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <span class="sub-label">Máximo:</span>
                                        <select id="sos-form-level-max" class="form-select">
                                            <option value="3.5">3.50</option>
                                            <option value="4.0">4.00</option>
                                            <option value="4.5" selected>4.50</option>
                                            <option value="5.0">5.00 (Élite Pro)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <!-- Lado Necesario -->
                            <div class="form-group">
                                <label class="form-label">Posición requerida en pista:</label>
                                <div class="form-segmented-pills">
                                    <label class="pill-radio">
                                        <input type="radio" name="sideNeeded" value="any" checked>
                                        <span>Cualquiera</span>
                                    </label>
                                    <label class="pill-radio">
                                        <input type="radio" name="sideNeeded" value="reves">
                                        <span>Revés</span>
                                    </label>
                                    <label class="pill-radio">
                                        <input type="radio" name="sideNeeded" value="drive">
                                        <span>Drive</span>
                                    </label>
                                </div>
                            </div>

                            <!-- Recompensa de Honor -->
                            <div class="sos-form-xp-box">
                                <div class="xp-icon">⚡</div>
                                <div class="xp-text">
                                    <strong>+150 XP de Bonificación de Honor</strong>
                                    <span>Se otorgarán automáticamente al suplente que rescate la plaza.</span>
                                </div>
                            </div>

                            <!-- Botones Formulario -->
                            <div class="sos-modal-actions">
                                <button type="button" class="sos-btn-cancel" onclick="window.SosSubstitutesWidget?.closeModal()">Cancelar</button>
                                <button type="submit" class="sos-btn-confirm-action red" id="sos-btn-submit-alert">
                                    <i class="fas fa-bullhorn"></i> PUBLICAR ALERTA SOS
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            `;

            this._injectModal(modalHtml);
        }

        /**
         * Manejador de envío del formulario de creación de alerta
         */
        async submitCreateAlertForm(e) {
            if (e && e.preventDefault) e.preventDefault();

            const btn = document.getElementById('sos-btn-submit-alert');
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> Publicando...`;
            }

            this._hapticFeedback(30);

            try {
                const service = window.SosSubstitutesService;
                if (!service) throw new Error("Servicio SOS no disponible");

                const eventType = document.querySelector('input[name="eventType"]:checked')?.value || 'americana';
                const eventName = document.getElementById('sos-form-name')?.value?.trim() || 'Convocatoria Express';
                const time = document.getElementById('sos-form-time')?.value || '19:30';
                const court = document.getElementById('sos-form-court')?.value?.trim() || 'Pista Principal';
                const levelMin = parseFloat(document.getElementById('sos-form-level-min')?.value || 3.0);
                const levelMax = parseFloat(document.getElementById('sos-form-level-max')?.value || 4.5);
                const sideNeeded = document.querySelector('input[name="sideNeeded"]:checked')?.value || 'any';

                const newAlert = await service.createSosAlert({
                    eventType,
                    eventName,
                    time,
                    court,
                    levelMin,
                    levelMax,
                    sideNeeded,
                    slotsNeeded: 1,
                    bonusXp: 150
                });

                this._celebrateSparkles();
                this._showNotification('🚨 ¡Alerta SOS publicada! Los suplentes han sido alertados.', 'success');
                this.closeModal();

                await this.refresh(false);
            } catch (err) {
                console.error('[SosSubstitutesWidget] Error al crear alerta SOS:', err);
                this._showNotification(err.message || 'Error al crear la alerta', 'error');
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = `<i class="fas fa-bullhorn"></i> Reintentar`;
                }
            }
        }

        /**
         * Cierra cualquier modal abierto del widget
         */
        closeModal() {
            this._hapticFeedback(10);
            const existing = document.getElementById('sp-sos-modal-root');
            if (existing) {
                existing.innerHTML = '';
            }
            this.activeModal = null;
        }

        // =========================================================================
        // 7. INYECCIÓN DE ESTILOS CSS (DARK ATHLETIC GLASSMORPHISM)
        // =========================================================================

        injectStyles() {
            if (document.getElementById('sos-substitutes-styles')) return;

            const style = document.createElement('style');
            style.id = 'sos-substitutes-styles';
            style.textContent = `
                /* =========================================================
                   SOS SUBSTITUTES WIDGET - SOMOSPÁDEL BCN PREMIUM STYLES
                   ========================================================= */

                .sp-sos-widget-wrapper {
                    font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                    background: linear-gradient(145deg, rgba(10, 15, 29, 0.96) 0%, rgba(15, 23, 42, 0.98) 100%);
                    border-radius: 26px;
                    padding: 20px 18px 18px;
                    color: #ffffff;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(239, 68, 68, 0.08);
                    border: 1.5px solid rgba(255, 255, 255, 0.1);
                    transition: border-color 0.3s ease, box-shadow 0.3s ease;
                }

                .sp-sos-widget-wrapper.sos-has-alerts {
                    border: 1.5px solid rgba(239, 68, 68, 0.45);
                    box-shadow: 0 18px 45px rgba(0, 0, 0, 0.65), 0 0 35px rgba(239, 68, 68, 0.2);
                    animation: sosPulseBorder 3s infinite ease-in-out;
                }

                @keyframes sosPulseBorder {
                    0%, 100% {
                        border-color: rgba(239, 68, 68, 0.45);
                        box-shadow: 0 18px 45px rgba(0, 0, 0, 0.65), 0 0 25px rgba(239, 68, 68, 0.2);
                    }
                    50% {
                        border-color: rgba(245, 158, 11, 0.6);
                        box-shadow: 0 18px 45px rgba(0, 0, 0, 0.65), 0 0 35px rgba(245, 158, 11, 0.28);
                    }
                }

                .sos-highlight-focus {
                    animation: sosFlashFocus 1.5s ease-out;
                }

                @keyframes sosFlashFocus {
                    0% { transform: scale(1.02); box-shadow: 0 0 50px rgba(204, 255, 0, 0.6); }
                    100% { transform: scale(1); }
                }

                /* Glow decorativos de esquina */
                .sos-glow-decor {
                    position: absolute;
                    width: 140px;
                    height: 140px;
                    border-radius: 50%;
                    pointer-events: none;
                    filter: blur(40px);
                    opacity: 0.3;
                }
                .sos-glow-decor.top-right {
                    top: -50px;
                    right: -50px;
                    background: #EF4444;
                }
                .sos-glow-decor.bottom-left {
                    bottom: -50px;
                    left: -50px;
                    background: #CCFF00;
                    opacity: 0.15;
                }

                /* Cabecera */
                .sos-header-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                    margin-bottom: 18px;
                    flex-wrap: wrap;
                    position: relative;
                    z-index: 2;
                }
                .sos-header-left {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                }

                .sos-radar-icon-wrap {
                    position: relative;
                    width: 52px;
                    height: 52px;
                    background: rgba(239, 68, 68, 0.12);
                    border: 1.5px solid rgba(239, 68, 68, 0.4);
                    border-radius: 18px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.45rem;
                    flex-shrink: 0;
                }
                .sos-radar-icon-wrap.sos-radar-live .sos-radar-ping {
                    position: absolute;
                    inset: -4px;
                    border-radius: 20px;
                    border: 2px solid #EF4444;
                    animation: sosRadarWave 2s cubic-bezier(0, 0.2, 0.8, 1) infinite;
                    pointer-events: none;
                }
                .sos-radar-icon-wrap.sos-radar-live .sos-radar-ping.ping-2 {
                    animation-delay: 0.75s;
                }

                @keyframes sosRadarWave {
                    0% { transform: scale(0.95); opacity: 0.9; }
                    100% { transform: scale(1.4); opacity: 0; }
                }

                .sos-badge-line {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    margin-bottom: 4px;
                    flex-wrap: wrap;
                }
                .sos-urgent-pill {
                    font-size: 0.64rem;
                    font-weight: 950;
                    padding: 3px 8px;
                    border-radius: 6px;
                    letter-spacing: 0.5px;
                    text-transform: uppercase;
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                }
                .sos-urgent-pill.pulse-urgent {
                    background: #EF4444;
                    color: #ffffff;
                    box-shadow: 0 0 14px rgba(239, 68, 68, 0.5);
                }
                .sos-urgent-pill.pill-calm {
                    background: rgba(34, 197, 94, 0.15);
                    color: #4ADE80;
                    border: 1px solid rgba(34, 197, 94, 0.3);
                }

                .sos-honor-xp-pill {
                    background: rgba(204, 255, 0, 0.14);
                    border: 1px solid rgba(204, 255, 0, 0.45);
                    color: #CCFF00;
                    font-size: 0.64rem;
                    font-weight: 950;
                    padding: 3px 8px;
                    border-radius: 6px;
                    letter-spacing: 0.4px;
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                }

                .sos-main-title {
                    margin: 0;
                    font-size: 1.25rem;
                    font-weight: 950;
                    letter-spacing: -0.3px;
                    color: #ffffff;
                    line-height: 1.15;
                }
                .sos-subtitle {
                    margin: 3px 0 0 0;
                    font-size: 0.74rem;
                    color: #94A3B8;
                    font-weight: 500;
                }

                .sos-header-actions {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .sos-btn-header-cta {
                    background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
                    color: #ffffff;
                    border: none;
                    border-radius: 12px;
                    padding: 8px 14px;
                    font-size: 0.75rem;
                    font-weight: 900;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    cursor: pointer;
                    box-shadow: 0 4px 15px rgba(239, 68, 68, 0.35);
                    transition: all 0.2s ease;
                }
                .sos-btn-header-cta:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(239, 68, 68, 0.5);
                }
                .sos-btn-header-sub {
                    background: rgba(255, 255, 255, 0.08);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    color: #f1f5f9;
                    border-radius: 12px;
                    padding: 8px 12px;
                    font-size: 0.75rem;
                    font-weight: 800;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                }
                .sos-btn-header-sub:hover {
                    background: rgba(255, 255, 255, 0.15);
                }

                /* Sección de Alertas */
                .sos-alerts-section {
                    margin-bottom: 16px;
                }
                .sos-alerts-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .sos-alert-card {
                    background: rgba(15, 23, 42, 0.85);
                    border: 1.5px solid rgba(255, 255, 255, 0.1);
                    border-radius: 20px;
                    padding: 16px;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
                    transition: transform 0.2s ease, border-color 0.2s ease;
                }
                .sos-alert-card.elite-match-glow {
                    border-color: rgba(204, 255, 0, 0.45);
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35), 0 0 25px rgba(204, 255, 0, 0.12);
                }

                .sos-card-topbar {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 8px;
                    margin-bottom: 10px;
                    flex-wrap: wrap;
                }
                .sos-event-meta {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    flex-wrap: wrap;
                }
                .sos-type-chip {
                    background: rgba(56, 189, 248, 0.15);
                    border: 1px solid rgba(56, 189, 248, 0.35);
                    color: #38BDF8;
                    font-size: 0.60rem;
                    font-weight: 900;
                    padding: 2px 7px;
                    border-radius: 6px;
                    letter-spacing: 0.4px;
                }
                .sos-time-chip, .sos-court-chip {
                    font-size: 0.68rem;
                    color: #E2E8F0;
                    font-weight: 700;
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                }
                .sos-xp-tag {
                    background: linear-gradient(135deg, #CCFF00 0%, #a3e635 100%);
                    color: #000000;
                    font-weight: 1000;
                    font-size: 0.66rem;
                    padding: 2px 8px;
                    border-radius: 6px;
                    box-shadow: 0 2px 8px rgba(204, 255, 0, 0.3);
                }

                .sos-card-title-row {
                    display: flex;
                    align-items: baseline;
                    justify-content: space-between;
                    gap: 8px;
                    margin-bottom: 10px;
                }
                .sos-card-title {
                    margin: 0;
                    font-size: 1.15rem;
                    font-weight: 950;
                    color: #ffffff;
                    letter-spacing: -0.2px;
                }
                .sos-slots-badge {
                    font-size: 0.70rem;
                    color: #F87171;
                    font-weight: 800;
                    background: rgba(239, 68, 68, 0.12);
                    padding: 2px 8px;
                    border-radius: 6px;
                    white-space: nowrap;
                }

                .sos-req-pills {
                    display: flex;
                    gap: 6px;
                    flex-wrap: wrap;
                    margin-bottom: 12px;
                }
                .sos-req-pill {
                    font-size: 0.68rem;
                    font-weight: 800;
                    padding: 4px 10px;
                    border-radius: 8px;
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                }
                .sos-req-pill.req-level {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.12);
                    color: #F1F5F9;
                }
                .sos-req-pill.req-side {
                    background: rgba(251, 191, 36, 0.12);
                    border: 1px solid rgba(251, 191, 36, 0.3);
                    color: #FBBF24;
                }
                .sos-req-pill.req-bonus {
                    background: rgba(204, 255, 0, 0.10);
                    border: 1px solid rgba(204, 255, 0, 0.3);
                    color: #CCFF00;
                }

                /* Caja de Afinidad / Matchmaking */
                .sos-compat-box {
                    background: rgba(0, 0, 0, 0.35);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 14px;
                    padding: 12px;
                    margin-bottom: 14px;
                }
                .sos-compat-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 8px;
                }
                .sos-compat-title {
                    font-size: 0.72rem;
                    font-weight: 850;
                    color: #94A3B8;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                .sos-compat-score-badge {
                    font-size: 0.72rem;
                    font-weight: 950;
                    padding: 3px 9px;
                    border-radius: 8px;
                    letter-spacing: 0.3px;
                }

                .sos-progress-track {
                    width: 100%;
                    height: 8px;
                    background: rgba(255, 255, 255, 0.08);
                    border-radius: 99px;
                    overflow: visible;
                    position: relative;
                    margin-bottom: 8px;
                }
                .sos-progress-fill {
                    height: 100%;
                    border-radius: 99px;
                    position: relative;
                    transition: width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                .sos-progress-dot {
                    position: absolute;
                    right: 0;
                    top: 50%;
                    transform: translate(50%, -50%);
                    width: 12px;
                    height: 12px;
                    background: #ffffff;
                    border-radius: 50%;
                    box-shadow: 0 0 8px currentColor;
                }

                .sos-btn-toggle-reasons {
                    background: none;
                    border: none;
                    color: #38BDF8;
                    font-size: 0.68rem;
                    font-weight: 800;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    padding: 0;
                    margin-top: 2px;
                }
                .sos-btn-toggle-reasons:hover {
                    text-decoration: underline;
                }

                .sos-reasons-list {
                    margin-top: 8px;
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                    padding-top: 6px;
                    border-top: 1px dashed rgba(255, 255, 255, 0.08);
                }
                .sos-reason-item {
                    font-size: 0.68rem;
                    color: #CBD5E1;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    line-height: 1.3;
                }

                /* Botón CTA Cubrir Plaza */
                .sos-cta-row {
                    display: flex;
                }
                .sos-btn-join-alert {
                    width: 100%;
                    padding: 13px 18px;
                    background: linear-gradient(135deg, #EF4444 0%, #DC2626 50%, #B91C1C 100%);
                    color: #ffffff;
                    border: none;
                    border-radius: 14px;
                    cursor: pointer;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }
                .sos-btn-join-alert:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(239, 68, 68, 0.55);
                }
                .sos-btn-join-alert:active {
                    transform: scale(0.98);
                }

                .sos-btn-shine {
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 50%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
                    transform: skewX(-20deg);
                    animation: sosBtnShine 3.5s infinite;
                }
                @keyframes sosBtnShine {
                    0%, 70% { left: -100%; }
                    100% { left: 200%; }
                }

                .sos-btn-content {
                    position: relative;
                    z-index: 2;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    font-size: 0.88rem;
                    letter-spacing: 0.4px;
                }
                .sos-btn-subtext {
                    font-size: 0.72rem;
                    opacity: 0.9;
                    font-weight: 700;
                }

                /* Estado Vacío de Alertas */
                .sos-empty-card {
                    background: rgba(15, 23, 42, 0.6);
                    border: 1px dashed rgba(255, 255, 255, 0.15);
                    border-radius: 18px;
                    padding: 20px 16px;
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                }
                .sos-empty-icon-ring {
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    background: rgba(34, 197, 94, 0.12);
                    border: 1.5px solid rgba(34, 197, 94, 0.4);
                    color: #4ADE80;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.3rem;
                }
                .sos-empty-title {
                    margin: 0;
                    font-size: 0.95rem;
                    font-weight: 950;
                    color: #ffffff;
                }
                .sos-empty-desc {
                    margin: 4px 0 0;
                    font-size: 0.75rem;
                    color: #94A3B8;
                    max-width: 460px;
                    line-height: 1.4;
                }
                .sos-empty-badge {
                    background: rgba(255, 255, 255, 0.05);
                    padding: 4px 10px;
                    border-radius: 99px;
                    font-size: 0.65rem;
                    color: #4ADE80;
                    font-weight: 800;
                    margin-top: 4px;
                }

                /* Sección de Guardia Activa */
                .sos-guard-card {
                    background: rgba(15, 23, 42, 0.7);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 20px;
                    padding: 16px;
                    transition: all 0.3s ease;
                }
                .sos-guard-card.guard-is-active {
                    border-color: rgba(204, 255, 0, 0.4);
                    background: linear-gradient(145deg, rgba(15, 23, 42, 0.8) 0%, rgba(20, 35, 30, 0.8) 100%);
                    box-shadow: 0 0 25px rgba(204, 255, 0, 0.1);
                }

                .sos-guard-header-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                    margin-bottom: 14px;
                    flex-wrap: wrap;
                }
                .sos-guard-title-block {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .sos-guard-icon {
                    width: 38px;
                    height: 38px;
                    border-radius: 12px;
                    background: rgba(204, 255, 0, 0.12);
                    border: 1px solid rgba(204, 255, 0, 0.35);
                    color: #CCFF00;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.1rem;
                }
                .sos-guard-title {
                    margin: 0;
                    font-size: 0.96rem;
                    font-weight: 950;
                    color: #ffffff;
                }
                .sos-guard-desc {
                    margin: 2px 0 0;
                    font-size: 0.68rem;
                    color: #94A3B8;
                }

                .sos-guard-status-pill {
                    font-size: 0.62rem;
                    font-weight: 950;
                    padding: 4px 10px;
                    border-radius: 99px;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    letter-spacing: 0.4px;
                }
                .sos-guard-status-pill.pill-active-glow {
                    background: rgba(204, 255, 0, 0.18);
                    border: 1px solid #CCFF00;
                    color: #CCFF00;
                    box-shadow: 0 0 12px rgba(204, 255, 0, 0.35);
                }
                .sos-guard-status-pill.pill-inactive {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    color: #94A3B8;
                }
                .sos-guard-pulse-dot {
                    width: 7px;
                    height: 7px;
                    border-radius: 50%;
                    background: currentColor;
                    box-shadow: 0 0 6px currentColor;
                }

                .sos-guard-controls {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    background: rgba(0, 0, 0, 0.3);
                    padding: 12px;
                    border-radius: 14px;
                    margin-bottom: 12px;
                }

                /* Toggle Switch */
                .sos-toggle-container {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    cursor: pointer;
                    user-select: none;
                }
                .sos-custom-switch {
                    width: 48px;
                    height: 26px;
                    background: rgba(255, 255, 255, 0.15);
                    border-radius: 99px;
                    padding: 2px;
                    transition: background 0.25s ease;
                    position: relative;
                    flex-shrink: 0;
                }
                .sos-custom-switch.checked {
                    background: #CCFF00;
                }
                .sos-switch-handle {
                    width: 22px;
                    height: 22px;
                    background: #ffffff;
                    border-radius: 50%;
                    transition: transform 0.25s ease;
                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
                }
                .sos-custom-switch.checked .sos-switch-handle {
                    transform: translateX(22px);
                    background: #000000;
                }
                .sos-toggle-label {
                    font-size: 0.78rem;
                    font-weight: 850;
                    color: #F1F5F9;
                }

                /* Selector de Franjas */
                .sos-slot-selector-row {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                .sos-slot-label {
                    font-size: 0.65rem;
                    font-weight: 800;
                    color: #94A3B8;
                    text-transform: uppercase;
                    letter-spacing: 0.4px;
                }
                .sos-slot-buttons {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 6px;
                }
                .sos-slot-btn {
                    padding: 8px 6px;
                    border-radius: 10px;
                    border: 1px solid rgba(255, 255, 255, 0.12);
                    background: rgba(255, 255, 255, 0.05);
                    color: #CBD5E1;
                    font-size: 0.68rem;
                    font-weight: 850;
                    cursor: pointer;
                    transition: all 0.15s ease;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    gap: 2px;
                }
                .sos-slot-btn span {
                    font-size: 0.55rem;
                    opacity: 0.7;
                    font-weight: 600;
                }
                .sos-slot-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                }
                .sos-slot-btn.active {
                    background: rgba(204, 255, 0, 0.15);
                    border-color: #CCFF00;
                    color: #CCFF00;
                    box-shadow: 0 0 12px rgba(204, 255, 0, 0.2);
                }

                .sos-guard-footer {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 10px;
                    flex-wrap: wrap;
                }
                .sos-guard-info-hint {
                    font-size: 0.68rem;
                    color: #94A3B8;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                .sos-btn-view-pool {
                    background: rgba(255, 255, 255, 0.06);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    color: #ffffff;
                    padding: 6px 12px;
                    border-radius: 10px;
                    font-size: 0.70rem;
                    font-weight: 850;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                }
                .sos-btn-view-pool:hover {
                    background: rgba(255, 255, 255, 0.12);
                    border-color: #38BDF8;
                }

                /* Modales SOS */
                .sos-modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(5, 10, 20, 0.85);
                    backdrop-filter: blur(16px);
                    -webkit-backdrop-filter: blur(16px);
                    z-index: 99999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 16px;
                }
                .sos-modal-dialog {
                    background: linear-gradient(145deg, #090e1a 0%, #0f172a 100%);
                    border: 1.5px solid rgba(255, 255, 255, 0.15);
                    border-radius: 26px;
                    width: 100%;
                    max-width: 480px;
                    padding: 22px 20px;
                    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(239, 68, 68, 0.15);
                    color: #ffffff;
                    position: relative;
                    animation: sosModalPop 0.28s cubic-bezier(0.16, 1, 0.3, 1) both;
                    max-height: 90vh;
                    overflow-y: auto;
                }
                .sos-modal-dialog.wide {
                    max-width: 540px;
                }
                .sos-modal-dialog.success-border {
                    border-color: rgba(34, 197, 94, 0.5);
                    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(34, 197, 94, 0.2);
                }

                @keyframes sosModalPop {
                    0% { transform: scale(0.92); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }

                .sos-modal-close-btn {
                    position: absolute;
                    top: 14px;
                    right: 14px;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.08);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    color: #ffffff;
                    font-size: 1.2rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                }

                .sos-modal-icon-badge {
                    width: 50px;
                    height: 50px;
                    border-radius: 18px;
                    background: rgba(239, 68, 68, 0.15);
                    border: 1.5px solid #EF4444;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                    margin: 0 auto 10px;
                }
                .sos-modal-icon-badge.blue {
                    background: rgba(56, 189, 248, 0.15);
                    border-color: #38BDF8;
                }
                .sos-modal-icon-badge.red {
                    background: rgba(239, 68, 68, 0.15);
                    border-color: #EF4444;
                }

                .sos-modal-title {
                    margin: 0;
                    font-size: 1.25rem;
                    font-weight: 950;
                    color: #ffffff;
                    letter-spacing: -0.3px;
                }
                .sos-modal-subtitle {
                    margin: 4px 0 0;
                    font-size: 0.75rem;
                    color: #94A3B8;
                }

                /* Confirm Card */
                .sos-confirm-card {
                    background: rgba(0, 0, 0, 0.35);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 16px;
                    padding: 12px 14px;
                    margin: 14px 0;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .sos-confirm-row {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.78rem;
                }
                .sos-confirm-row .label {
                    color: #94A3B8;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .sos-confirm-row .value {
                    font-weight: 850;
                    color: #ffffff;
                }
                .sos-confirm-row .value.highlight-text {
                    color: #CCFF00;
                }

                .sos-confirm-perks {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 10px;
                    margin-bottom: 12px;
                }
                .perk-compat, .perk-xp {
                    background: rgba(255, 255, 255, 0.04);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    padding: 10px;
                    border-radius: 12px;
                    display: flex;
                    flex-direction: column;
                }
                .perk-compat .score {
                    font-size: 1.3rem;
                    font-weight: 1000;
                    line-height: 1;
                }
                .perk-xp .xp-val {
                    font-size: 1.3rem;
                    font-weight: 1000;
                    color: #CCFF00;
                    line-height: 1;
                }
                .perk-compat .desc, .perk-xp .desc {
                    font-size: 0.62rem;
                    color: #94A3B8;
                    margin-top: 3px;
                }

                .sos-confirm-notice {
                    font-size: 0.68rem;
                    color: #94A3B8;
                    line-height: 1.4;
                    margin: 0 0 16px;
                    text-align: center;
                }

                .sos-modal-actions {
                    display: grid;
                    grid-template-columns: 1fr 1.5fr;
                    gap: 10px;
                }
                .sos-modal-actions.single {
                    grid-template-columns: 1fr;
                }

                .sos-btn-cancel {
                    background: rgba(255, 255, 255, 0.08);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    color: #CBD5E1;
                    padding: 12px;
                    border-radius: 14px;
                    font-weight: 900;
                    font-size: 0.80rem;
                    cursor: pointer;
                }
                .sos-btn-confirm-action {
                    background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
                    color: #ffffff;
                    border: none;
                    padding: 12px;
                    border-radius: 14px;
                    font-weight: 950;
                    font-size: 0.82rem;
                    cursor: pointer;
                    box-shadow: 0 4px 18px rgba(239, 68, 68, 0.4);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                }
                .sos-btn-confirm-action.green {
                    background: linear-gradient(135deg, #22C55E 0%, #16A34A 100%);
                    box-shadow: 0 4px 18px rgba(34, 197, 94, 0.4);
                }

                /* Formulario Crear Alerta */
                .sos-form-body {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    margin-top: 14px;
                }
                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                }
                .form-label {
                    font-size: 0.72rem;
                    font-weight: 850;
                    color: #CBD5E1;
                }
                .sub-label {
                    font-size: 0.65rem;
                    color: #94A3B8;
                    display: block;
                    margin-bottom: 2px;
                }
                .form-input, .form-select {
                    background: rgba(0, 0, 0, 0.4);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    border-radius: 10px;
                    padding: 9px 12px;
                    color: #ffffff;
                    font-size: 0.78rem;
                    font-family: inherit;
                    width: 100%;
                    box-sizing: border-box;
                }
                .form-input:focus, .form-select:focus {
                    outline: none;
                    border-color: #38BDF8;
                }

                .form-grid-2 {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 10px;
                }

                .form-segmented-pills {
                    display: flex;
                    gap: 6px;
                }
                .pill-radio {
                    flex: 1;
                    position: relative;
                }
                .pill-radio input {
                    position: absolute;
                    opacity: 0;
                    cursor: pointer;
                }
                .pill-radio span {
                    display: block;
                    padding: 8px 6px;
                    text-align: center;
                    border-radius: 10px;
                    border: 1px solid rgba(255, 255, 255, 0.12);
                    background: rgba(255, 255, 255, 0.05);
                    color: #CBD5E1;
                    font-size: 0.72rem;
                    font-weight: 850;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .pill-radio input:checked + span {
                    background: rgba(56, 189, 248, 0.18);
                    border-color: #38BDF8;
                    color: #38BDF8;
                }

                .sos-form-xp-box {
                    background: rgba(204, 255, 0, 0.1);
                    border: 1px dashed rgba(204, 255, 0, 0.35);
                    border-radius: 12px;
                    padding: 10px 12px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .sos-form-xp-box .xp-icon {
                    font-size: 1.2rem;
                    color: #CCFF00;
                }
                .sos-form-xp-box .xp-text {
                    display: flex;
                    flex-direction: column;
                    font-size: 0.72rem;
                    line-height: 1.25;
                }
                .sos-form-xp-box .xp-text strong {
                    color: #CCFF00;
                }
                .sos-form-xp-box .xp-text span {
                    color: #CBD5E1;
                    font-size: 0.65rem;
                }

                /* Lista de Suplentes en Modal */
                .sos-modal-filter-tabs {
                    display: flex;
                    gap: 6px;
                    margin: 12px 0;
                }
                .filter-tab {
                    padding: 6px 14px;
                    border-radius: 99px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: #94A3B8;
                    font-size: 0.70rem;
                    font-weight: 850;
                    cursor: pointer;
                }
                .filter-tab.active {
                    background: #38BDF8;
                    color: #021327;
                    border-color: #38BDF8;
                }

                .sos-guard-players-list {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    max-height: 320px;
                    overflow-y: auto;
                    padding-right: 4px;
                }
                .sos-player-item-card {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.07);
                    border-radius: 14px;
                    padding: 10px 12px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 10px;
                }
                .player-left {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .player-avatar {
                    width: 38px;
                    height: 38px;
                    border-radius: 12px;
                    background: linear-gradient(135deg, #0284c7 0%, #06b6d4 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #ffffff;
                    font-weight: 900;
                    font-size: 0.85rem;
                    overflow: hidden;
                    position: relative;
                }
                .player-avatar img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .player-details {
                    display: flex;
                    flex-direction: column;
                    gap: 3px;
                }
                .player-name {
                    font-size: 0.80rem;
                    font-weight: 900;
                    color: #ffffff;
                }
                .player-badges {
                    display: flex;
                    gap: 4px;
                    flex-wrap: wrap;
                }
                .badge-level {
                    background: rgba(204, 255, 0, 0.15);
                    color: #CCFF00;
                    font-size: 0.58rem;
                    font-weight: 900;
                    padding: 1px 6px;
                    border-radius: 4px;
                }
                .badge-side {
                    background: rgba(56, 189, 248, 0.15);
                    color: #7dd3fc;
                    font-size: 0.58rem;
                    font-weight: 850;
                    padding: 1px 6px;
                    border-radius: 4px;
                }
                .badge-slot {
                    background: rgba(255, 255, 255, 0.07);
                    color: #CBD5E1;
                    font-size: 0.58rem;
                    font-weight: 700;
                    padding: 1px 6px;
                    border-radius: 4px;
                }

                .player-right-action {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                .active-pulse-beacon {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #22C55E;
                    box-shadow: 0 0 8px #22C55E;
                }
                .ready-tag {
                    font-size: 0.60rem;
                    color: #4ADE80;
                    font-weight: 950;
                    letter-spacing: 0.5px;
                }

                .sos-empty-subs {
                    text-align: center;
                    padding: 30px 10px;
                    color: #64748B;
                    font-size: 0.78rem;
                }
                .sos-empty-subs i {
                    font-size: 1.8rem;
                    margin-bottom: 8px;
                    display: block;
                    opacity: 0.5;
                }

                .sos-modal-footer-guard {
                    margin-top: 14px;
                    padding-top: 10px;
                    border-top: 1px solid rgba(255, 255, 255, 0.08);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 10px;
                    flex-wrap: wrap;
                }
                .footer-left-info {
                    font-size: 0.66rem;
                    color: #94A3B8;
                }

                /* Éxito */
                .sos-success-trophy-wrap {
                    font-size: 3.2rem;
                    margin: 8px 0;
                }
                .sos-success-title {
                    font-size: 1.35rem;
                    font-weight: 1000;
                    color: #22C55E;
                    margin: 0;
                }
                .sos-success-subtitle {
                    font-size: 0.78rem;
                    color: #CBD5E1;
                    margin: 4px 0 16px;
                }
                .sos-success-xp-card {
                    background: rgba(204, 255, 0, 0.12);
                    border: 1.5px solid #CCFF00;
                    border-radius: 16px;
                    padding: 14px;
                    margin-bottom: 14px;
                }
                .sos-success-xp-card .xp-number {
                    font-size: 1.8rem;
                    font-weight: 1000;
                    color: #CCFF00;
                    line-height: 1;
                }
                .sos-success-xp-card .xp-label {
                    font-size: 0.62rem;
                    font-weight: 900;
                    color: #ffffff;
                    letter-spacing: 0.5px;
                    margin-top: 4px;
                }
                .sos-success-hint {
                    font-size: 0.74rem;
                    color: #94A3B8;
                    margin-bottom: 18px;
                    line-height: 1.4;
                }

                .flex-align-gap {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                /* Mobile responsiveness */
                @media (max-width: 600px) {
                    .sp-sos-widget-wrapper {
                        padding: 16px 14px;
                        border-radius: 20px;
                    }
                    .sos-slot-buttons {
                        grid-template-columns: 1fr;
                    }
                    .sos-modal-actions {
                        grid-template-columns: 1fr;
                    }
                    .sos-header-actions {
                        width: 100%;
                        justify-content: flex-start;
                        margin-top: 6px;
                    }
                    .sos-btn-header-cta, .sos-btn-header-sub {
                        flex: 1;
                        justify-content: center;
                    }
                }
            `;

            document.head.appendChild(style);
        }

        // =========================================================================
        // 8. HELPERS DE INTEGRACIÓN & REACTIVIDAD
        // =========================================================================

        _bindServiceEvents() {
            if (this._boundEventHandlers) return;
            this._boundEventHandlers = true;

            const handleUpdate = () => {
                clearTimeout(this._refreshDebounceTimer);
                this._refreshDebounceTimer = setTimeout(() => {
                    this.refresh(false);
                }, 150);
            };

            window.addEventListener('onSosAlertCreated', handleUpdate);
            window.addEventListener('onSosAlertFilled', handleUpdate);
            window.addEventListener('onSosAlertCancelled', handleUpdate);
            window.addEventListener('onSosAvailabilityChanged', handleUpdate);

            // Suscribir directamente al servicio también
            if (window.SosSubstitutesService && typeof window.SosSubstitutesService.subscribe === 'function') {
                window.SosSubstitutesService.subscribe('onSosAlertCreated', handleUpdate);
                window.SosSubstitutesService.subscribe('onSosAlertFilled', handleUpdate);
                window.SosSubstitutesService.subscribe('activeAlerts', handleUpdate);
            }
        }

        _resolveCurrentUser() {
            if (typeof window === 'undefined') return null;
            return (window.Store && typeof window.Store.getState === 'function' ? window.Store.getState('currentUser') : null) ||
                   window.auth?.currentUser ||
                   window.AdminAuth?.user ||
                   null;
        }

        _injectModal(html) {
            let root = document.getElementById('sp-sos-modal-root');
            if (!root) {
                root = document.createElement('div');
                root.id = 'sp-sos-modal-root';
                document.body.appendChild(root);
            }
            root.innerHTML = html;

            // Cerrar al pulsar Escape
            const escListener = (e) => {
                if (e.key === 'Escape') {
                    this.closeModal();
                    document.removeEventListener('keydown', escListener);
                }
            };
            document.addEventListener('keydown', escListener);
        }

        _hapticFeedback(pattern = 20) {
            try {
                if (window.PlayerView && typeof window.PlayerView.haptic === 'function') {
                    window.PlayerView.haptic(Array.isArray(pattern) ? pattern[0] : pattern);
                }
                if (typeof navigator !== 'undefined' && navigator.vibrate) {
                    navigator.vibrate(pattern);
                }
            } catch (e) {}
        }

        _celebrateSparkles() {
            try {
                if (typeof window.confetti === 'function') {
                    window.confetti({
                        particleCount: 50,
                        spread: 50,
                        origin: { y: 0.7 },
                        colors: ['#CCFF00', '#38BDF8', '#ffffff']
                    });
                }
            } catch (e) {}
        }

        _celebrateBigWin() {
            try {
                if (typeof window.confetti === 'function') {
                    window.confetti({
                        particleCount: 120,
                        spread: 80,
                        origin: { y: 0.5 },
                        colors: ['#EF4444', '#F59E0B', '#CCFF00', '#ffffff']
                    });
                }
            } catch (e) {}
        }

        _showNotification(message, type = 'info') {
            if (window.NotificationService && typeof window.NotificationService.showToast === 'function') {
                window.NotificationService.showToast(message, type);
            } else if (window.NotificationService && typeof window.NotificationService.showInAppToast === 'function') {
                window.NotificationService.showInAppToast('Bolsa de Suplentes SOS', message, type);
            } else {
                console.log(`[SosSubstitutesWidget] (${type.toUpperCase()}) ${message}`);
            }
        }

        _getScoreColor(score) {
            if (score >= 80) return '#CCFF00'; // Élite
            if (score >= 60) return '#F59E0B'; // Alta
            if (score >= 40) return '#38BDF8'; // Media
            return '#94A3B8';
        }

        _getScoreBg(score) {
            if (score >= 80) return 'rgba(204, 255, 0, 0.16)';
            if (score >= 60) return 'rgba(245, 158, 11, 0.16)';
            if (score >= 40) return 'rgba(56, 189, 248, 0.16)';
            return 'rgba(148, 163, 184, 0.15)';
        }

        _getScoreBadgeClass(score) {
            if (score >= 80) return 'score-elite';
            if (score >= 60) return 'score-high';
            return 'score-mid';
        }

        _formatSideName(side) {
            if (!side) return 'Cualquiera';
            const s = String(side).toLowerCase();
            if (s.includes('rev')) return 'Revés';
            if (s.includes('dri')) return 'Drive';
            return 'Cualquiera (Polivalente)';
        }

        _formatSlotName(slot) {
            if (slot === 'mananas') return 'Mañanas (9:00 - 14:00)';
            if (slot === 'todo_el_dia') return 'Todo el día';
            return 'Tardes (17:00 - 22:30)';
        }

        _getInitials(name) {
            if (!name) return 'SP';
            const parts = name.trim().split(/\s+/).filter(Boolean);
            if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
            return name.substring(0, 2).toUpperCase();
        }

        _getTodayDateString() {
            const now = new Date();
            const y = now.getFullYear();
            const m = String(now.getMonth() + 1).padStart(2, '0');
            const d = String(now.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        }

        renderLoadingSkeleton() {
            return `
                <div class="sp-sos-widget-wrapper" style="opacity: 0.7;">
                    <div style="height: 180px; display: flex; align-items: center; justify-content: center; gap: 10px; color: #CCFF00;">
                        <i class="fas fa-circle-notch fa-spin" style="font-size: 1.5rem;"></i>
                        <span style="font-weight: 800; font-size: 0.85rem;">Conectando con el Radar SOS...</span>
                    </div>
                </div>
            `;
        }

        renderErrorState(errMsg) {
            return `
                <div class="sp-sos-widget-wrapper">
                    <div style="text-align: center; padding: 20px; color: #EF4444;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 1.6rem; margin-bottom: 8px;"></i>
                        <div style="font-weight: 900; font-size: 0.85rem;">Error al cargar la Bolsa SOS</div>
                        <div style="font-size: 0.70rem; color: #94A3B8; margin-top: 4px;">${errMsg}</div>
                        <button type="button" class="sos-btn-header-sub" style="margin-top: 12px;" onclick="window.SosSubstitutesWidget?.refresh(true)">
                            <i class="fas fa-sync-alt"></i> Reintentar
                        </button>
                    </div>
                </div>
            `;
        }
    }

    // Instancia global
    global.SosSubstitutesWidget = new SosSubstitutesWidget();

    // Auto-montaje al cargar el DOM si el root ya está presente
    if (typeof document !== 'undefined') {
        const tryAutoMount = () => {
            const el = document.getElementById('sos-substitutes-widget-root');
            if (el) {
                global.SosSubstitutesWidget.mount(el);
            }
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', tryAutoMount);
        } else {
            setTimeout(tryAutoMount, 100);
        }
    }

})(typeof window !== 'undefined' ? window : this);
