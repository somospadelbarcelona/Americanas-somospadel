/**
 * SeasonCampaignView.js
 * Módulo de Interfaz de Usuario para la Campaña de Temporada (Octubre - Noviembre 2026).
 * 
 * SomosPadel Barcelona
 * Provee:
 * 1. Modal interactivo de alto impacto visual con diseño Dark Luxury / Neon Lime (#CCFF00).
 * 2. Tres secciones dinámicas:
 *    - EQUIPOS: Catálogo de categorías (1ª, 2ª, 3ª, Fem, Mix, Vet) + Formulario de pre-inscripción ágil con auto-relleno de usuario y confirmación por WhatsApp en 1-clic.
 *    - AMERICANAS: Vitrina de la dinámica en vivo, puntos en tiempo real, ranking ELO y acceso directo.
 *    - ENTRENOS: Presentación de entrenos de tecnificación, táctica y físico para la nueva temporada.
 * 3. Diseño 100% responsive para móvil (iOS/Android) y escritorio.
 * 
 * Expuesto globalmente en `window.SeasonCampaignView`.
 */

(function (global) {
    'use strict';

    class SeasonCampaignView {
        constructor() {
            this.activeTab = 'equipos'; // 'equipos' | 'americanas' | 'entrenos'
            this.selectedCategoryId = 'femenina-2';
            this.lastSubmissionData = null;
            this.isSubmitting = false;
            this._handleKeydown = this._handleKeydown.bind(this);
        }

        /**
         * Abre el modal de la campaña de temporada.
         * @param {string|null} [preselectedCategory=null] - ID o nombre de categoría o sección a abrir inicialmente.
         */
        openModal(preselectedCategory = null) {
            // Si ya está abierto, cerrarlo primero para limpiar
            this.closeModal(true);

            // Determinar pestaña y categoría inicial
            if (preselectedCategory === 'americanas' || preselectedCategory === 'entrenos') {
                this.activeTab = preselectedCategory;
            } else {
                this.activeTab = 'equipos';
                if (preselectedCategory) {
                    this.selectedCategoryId = preselectedCategory;
                }
            }

            // Crear y montar overlay
            const overlay = document.createElement('div');
            overlay.id = 'sp-season-campaign-overlay';
            overlay.setAttribute('role', 'dialog');
            overlay.setAttribute('aria-modal', 'true');
            overlay.className = 'sp-season-overlay';
            overlay.innerHTML = this._buildModalHtml();

            document.body.appendChild(overlay);
            document.body.style.overflow = 'hidden';

            // Escuchar tecla escape
            document.addEventListener('keydown', this._handleKeydown);

            // Animar entrada
            requestAnimationFrame(() => {
                overlay.classList.add('sp-season-visible');
                const container = overlay.querySelector('.sp-season-modal-container');
                if (container) {
                    container.classList.add('sp-season-scale-in');
                }
            });

            // Inicializar sliders e inputs si estamos en equipos
            this._postMountSetup();

            // Disparar haptic si está disponible
            if (window.PlayerView && typeof window.PlayerView.haptic === 'function') {
                window.PlayerView.haptic(15);
            }
        }

        /**
         * Cierra el modal con animación fluida.
         * @param {boolean} [immediate=false]
         */
        closeModal(immediate = false) {
            const overlay = document.getElementById('sp-season-campaign-overlay');
            if (!overlay) return;

            document.removeEventListener('keydown', this._handleKeydown);
            document.body.style.overflow = '';

            if (immediate) {
                overlay.remove();
                return;
            }

            const container = overlay.querySelector('.sp-season-modal-container');
            if (container) {
                container.classList.remove('sp-season-scale-in');
                container.classList.add('sp-season-scale-out');
            }
            overlay.classList.remove('sp-season-visible');

            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.remove();
                }
            }, 260);
        }

        /**
         * Manejador de teclado para accesible escape.
         */
        _handleKeydown(e) {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        }

        /**
         * Cambia la pestaña activa ('equipos', 'americanas', 'entrenos').
         */
        switchTab(tabKey) {
            this.activeTab = tabKey;
            const tabButtons = document.querySelectorAll('.sp-season-nav-btn');
            tabButtons.forEach(btn => {
                const isCurrent = btn.getAttribute('data-tab') === tabKey;
                btn.classList.toggle('active', isCurrent);
            });

            const contentPanes = document.querySelectorAll('.sp-season-pane');
            contentPanes.forEach(pane => {
                const isTarget = pane.id === `sp-season-pane-${tabKey}`;
                pane.style.display = isTarget ? 'block' : 'none';
                if (isTarget) {
                    pane.classList.remove('sp-pane-enter');
                    void pane.offsetWidth; // trigger reflow
                    pane.classList.add('sp-pane-enter');
                }
            });

            if (window.PlayerView && typeof window.PlayerView.haptic === 'function') {
                window.PlayerView.haptic(10);
            }
        }

        /**
         * Selecciona una categoría del listado oficial.
         */
        selectCategory(categoryId) {
            this.selectedCategoryId = categoryId;
            const categoryCards = document.querySelectorAll('.sp-cat-card');
            categoryCards.forEach(card => {
                const isSelected = card.getAttribute('data-cat-id') === categoryId;
                card.classList.toggle('selected', isSelected);
            });

            // Sincronizar con el select del formulario
            const selectEl = document.getElementById('sp-form-category');
            if (selectEl) {
                selectEl.value = categoryId;
            }

            // Sincronizar badge de división recomendada si existe
            const catObj = this._getCategoryById(categoryId);
            const badgeEl = document.getElementById('sp-selected-cat-badge');
            if (badgeEl && catObj) {
                badgeEl.textContent = `${catObj.icon} ${catObj.name} (${catObj.levelRange})`;
            }

            if (window.PlayerView && typeof window.PlayerView.haptic === 'function') {
                window.PlayerView.haptic(8);
            }
        }

        /**
         * Actualiza el badge visual del slider de nivel en tiempo real.
         */
        onLevelChange(value) {
            const level = parseFloat(value);
            const badge = document.getElementById('sp-level-value-badge');
            const levelLabel = document.getElementById('sp-level-desc-badge');
            if (badge) {
                badge.textContent = level.toFixed(1);
            }

            if (levelLabel) {
                let desc = 'Iniciación';
                let bg = 'rgba(59, 130, 246, 0.2)';
                let color = '#60a5fa';

                if (level >= 5.5) {
                    desc = 'Competición Élite';
                    bg = 'rgba(239, 68, 68, 0.2)';
                    color = '#f87171';
                } else if (level >= 4.5) {
                    desc = 'Avanzado Alto';
                    bg = 'rgba(204, 255, 0, 0.2)';
                    color = '#CCFF00';
                } else if (level >= 3.5) {
                    desc = 'Intermedio Plus';
                    bg = 'rgba(34, 197, 94, 0.2)';
                    color = '#4ade80';
                } else if (level >= 2.5) {
                    desc = 'Intermedio';
                    bg = 'rgba(14, 165, 233, 0.2)';
                    color = '#38bdf8';
                }

                levelLabel.textContent = desc;
                levelLabel.style.backgroundColor = bg;
                levelLabel.style.color = color;
            }
        }

        /**
         * Manejador del envío del formulario de pre-inscripción.
         */
        async handleFormSubmit(e) {
            if (e && e.preventDefault) e.preventDefault();
            if (this.isSubmitting) return;

            const nameInput = document.getElementById('sp-form-name');
            const phoneInput = document.getElementById('sp-form-phone');
            const levelInput = document.getElementById('sp-form-level');
            const categorySelect = document.getElementById('sp-form-category');
            const commentsInput = document.getElementById('sp-form-comments');
            const errorContainer = document.getElementById('sp-form-error-banner');
            const submitBtn = document.getElementById('sp-form-submit-btn');

            if (errorContainer) {
                errorContainer.style.display = 'none';
                errorContainer.innerHTML = '';
            }

            const catId = categorySelect ? categorySelect.value : this.selectedCategoryId;
            const catObj = this._getCategoryById(catId);

            const formData = {
                name: nameInput ? nameInput.value : '',
                phone: phoneInput ? phoneInput.value : '',
                level: levelInput ? parseFloat(levelInput.value) : 3.5,
                category: catObj ? catObj.name : catId,
                preferredDivision: catObj ? `${catObj.division} (${catObj.badge})` : catId,
                comments: commentsInput ? commentsInput.value : ''
            };

            // Validar con el servicio
            if (window.SeasonCampaignService && typeof window.SeasonCampaignService.validateInscription === 'function') {
                const validation = window.SeasonCampaignService.validateInscription(formData);
                if (!validation.isValid) {
                    this._showErrorBanner(validation.errors.join('<br>'));
                    return;
                }
            } else {
                if (!formData.name.trim() || !formData.phone.trim()) {
                    this._showErrorBanner('Por favor, indica tu nombre completo y teléfono móvil.');
                    return;
                }
            }

            // Iniciar estado de carga
            this.isSubmitting = true;
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = `
                    <i class="fas fa-circle-notch fa-spin" style="margin-right: 8px;"></i>
                    REGISTRANDO PLAZA...
                `;
            }

            try {
                let result = null;
                if (window.SeasonCampaignService && typeof window.SeasonCampaignService.submitTeamInscription === 'function') {
                    result = await window.SeasonCampaignService.submitTeamInscription(formData);
                } else {
                    // Fallback simulado
                    await new Promise(r => setTimeout(r, 600));
                    result = { success: true, id: 'temp_' + Date.now(), isOffline: true, data: formData };
                }

                this.lastSubmissionData = {
                    ...formData,
                    id: result.id || 'SP-' + Math.floor(1000 + Math.random() * 9000),
                    isOffline: result.isOffline || false
                };

                // Renderizar pantalla de éxito
                this._renderSuccessView(this.lastSubmissionData);

            } catch (err) {
                console.error('❌ [SeasonCampaignView] Error en registro:', err);
                const msg = err.validationErrors ? err.validationErrors.join('<br>') : (err.message || 'Error al procesar la inscripción. Inténtalo de nuevo.');
                this._showErrorBanner(msg);
            } finally {
                this.isSubmitting = false;
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = `
                        <i class="fas fa-paper-plane" style="margin-right: 8px;"></i>
                        ENVIAR FORMULARIO INSCRIPCIÓN
                    `;
                }
            }
        }

        /**
         * Muestra banner de error visual dentro del modal.
         */
        _showErrorBanner(messageHtml) {
            const errorContainer = document.getElementById('sp-form-error-banner');
            if (errorContainer) {
                errorContainer.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 1.1rem; color: #f87171; flex-shrink: 0;"></i>
                        <div style="font-size: 0.8rem; line-height: 1.3;">${messageHtml}</div>
                    </div>
                `;
                errorContainer.style.display = 'block';
                errorContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }

        /**
         * Renderiza la vista de éxito y confirmación en 1 clic por WhatsApp.
         */
        _renderSuccessView(data) {
            const formCard = document.getElementById('sp-equipos-form-wrapper');
            if (!formCard) return;

            const categoryName = data.category || 'Equipo SomosPadel';
            const phoneDisplay = window.SeasonCampaignService 
                ? window.SeasonCampaignService.formatPhoneDisplay(data.phone)
                : data.phone;

            formCard.innerHTML = `
                <div class="sp-success-box">
                    <div class="sp-success-icon-wrap">
                        <i class="fas fa-check-circle sp-success-icon"></i>
                    </div>

                    <div class="sp-success-badge">¡PRE-INSCRIPCIÓN REGISTRADA!</div>
                    <h3 class="sp-success-title">¡Nos vemos en la pista, ${this._escapeHtml(data.name)}!</h3>
                    <p class="sp-success-desc">
                        Tu solicitud para <strong>${this._escapeHtml(categoryName)}</strong> ha sido recibida correctamente en el sistema de SomosPadel Barcelona.
                    </p>

                    <!-- RESUMEN DE DATOS -->
                    <div class="sp-success-summary">
                        <div class="sp-summary-row">
                            <span class="sp-summary-label">👤 Jugador:</span>
                            <span class="sp-summary-val">${this._escapeHtml(data.name)}</span>
                        </div>
                        <div class="sp-summary-row">
                            <span class="sp-summary-label">📱 Teléfono:</span>
                            <span class="sp-summary-val">${this._escapeHtml(phoneDisplay)}</span>
                        </div>
                        <div class="sp-summary-row">
                            <span class="sp-summary-label">📊 Nivel acreditado:</span>
                            <span class="sp-summary-val highlight">${data.level}</span>
                        </div>
                        <div class="sp-summary-row">
                            <span class="sp-summary-label">🏆 Categoría:</span>
                            <span class="sp-summary-val">${this._escapeHtml(categoryName)}</span>
                        </div>
                        ${data.comments ? `
                        <div class="sp-summary-row" style="flex-direction: column; align-items: flex-start; gap: 4px;">
                            <span class="sp-summary-label">💬 Observaciones:</span>
                            <span class="sp-summary-val" style="font-size: 0.75rem; color: #94a3b8; font-style: italic;">"${this._escapeHtml(data.comments)}"</span>
                        </div>
                        ` : ''}
                    </div>

                    <!-- CTA WHATSAPP 1-CLIC -->
                    <div class="sp-whatsapp-cta-card">
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                            <div class="sp-wa-icon-glow">
                                <i class="fab fa-whatsapp"></i>
                            </div>
                            <div style="text-align: left;">
                                <div style="color: #ffffff; font-weight: 900; font-size: 0.9rem;">Confirmación Inmediata con Coordinación</div>
                                <div style="color: #94a3b8; font-size: 0.75rem;">Asegura tu plaza enviando el mensaje pre-configurado al WhatsApp del club.</div>
                            </div>
                        </div>

                        <button 
                            type="button" 
                            id="sp-whatsapp-direct-btn"
                            class="sp-btn-whatsapp-action"
                            onclick="window.SeasonCampaignView.openWhatsAppConfirmation()">
                            <i class="fab fa-whatsapp" style="font-size: 1.2rem;"></i>
                            CONFIRMAR POR WHATSAPP EN 1 CLIC
                        </button>
                    </div>

                    <!-- ACCIONES FINALES -->
                    <div style="display: flex; gap: 10px; margin-top: 18px; width: 100%;">
                        <button 
                            type="button" 
                            class="sp-btn-secondary"
                            onclick="window.SeasonCampaignView.resetFormView()">
                            <i class="fas fa-redo"></i> Inscribir a otra persona
                        </button>
                        <button 
                            type="button" 
                            class="sp-btn-close-modal"
                            onclick="window.SeasonCampaignView.closeModal()">
                            Listo / Cerrar
                        </button>
                    </div>
                </div>
            `;

            if (window.PlayerView && typeof window.PlayerView.haptic === 'function') {
                window.PlayerView.haptic(25);
            }
        }

        /**
         * Abre WhatsApp usando el helper del servicio con los últimos datos registrados.
         */
        openWhatsAppConfirmation() {
            if (!this.lastSubmissionData) return;
            if (window.SeasonCampaignService && typeof window.SeasonCampaignService.openWhatsApp === 'function') {
                window.SeasonCampaignService.openWhatsApp(this.lastSubmissionData);
            } else {
                const msg = encodeURIComponent(`Hola Alex, soy ${this.lastSubmissionData.name}. Confirmo mi inscripción para la categoría ${this.lastSubmissionData.category}.`);
                window.open(`https://wa.me/34649219350?text=${msg}`, '_blank', 'noopener,noreferrer');
            }
        }

        /**
         * Restaura la vista del formulario para una nueva inscripción.
         */
        resetFormView() {
            const formCard = document.getElementById('sp-equipos-form-wrapper');
            if (formCard) {
                formCard.innerHTML = this._buildFormInnerHtml();
                this._postMountSetup();
            }
        }

        /**
         * Obtiene las categorías de servicio o fallback oficial.
         */
        _getCategories() {
            if (window.SeasonCampaignService && typeof window.SeasonCampaignService.getAvailableCategories === 'function') {
                return window.SeasonCampaignService.getAvailableCategories();
            }
            return [
                { id: 'femenina-2', name: 'Femenina 2ª División', category: 'Femenina', division: '2ª División', type: 'team', icon: '🚺', badge: 'Competición Alta', levelRange: '3.5 - 4.5', description: 'Equipo femenino consolidado. Nivel intermedio-alto para jugadoras con experiencia en ligas.' },
                { id: 'femenina-3', name: 'Femenina 3ª División', category: 'Femenina', division: '3ª División', type: 'team', icon: '🎾', badge: 'Competición Regular', levelRange: '2.75 - 3.5', description: 'Equipo femenino intermedio. Buen ritmo de juego y excelente ambiente de club en competición.' },
                { id: 'femenina-4', name: 'Femenina 4ª División', category: 'Femenina', division: '4ª División', type: 'team', icon: '✨', badge: 'Iniciación / Promoción', levelRange: '2.0 - 2.75', description: 'Equipo femenino de desarrollo e iniciación a la competición por equipos.' },
                { id: 'mixta-3', name: 'Mixta 3ª División', category: 'Mixta', division: '3ª División', type: 'team', icon: '🚻', badge: 'Competición Intermedia', levelRange: '2.75 - 3.75', description: 'Equipo mixto de competición regular. Formato dinámico y competitivo en jornadas de club.' },
                { id: 'mixta-4', name: 'Mixta 4ª División', category: 'Mixta', division: '4ª División', type: 'team', icon: '⚡', badge: 'Iniciación / Social', levelRange: '2.0 - 2.75', description: 'Equipo mixto de iniciación y nivel medio para disfrutar de la competición en pareja.' },
                { id: 'masculina-3', name: 'Masculina 3ª División', category: 'Masculina', division: '3ª División', type: 'team', icon: '🏆', badge: 'Competición Consolidada', levelRange: '3.0 - 3.75', description: 'Equipo masculino de 3ª División. Nuestro equipo referente en ligas intercomarcales.' },
                { id: 'masculina-4', name: 'Masculina 4ª División', category: 'Masculina', division: '4ª División', type: 'team', icon: '🛡️', badge: 'Promoción y Ritmo', levelRange: '2.0 - 3.0', description: 'Equipo masculino de 4ª División. Ideal para sumar partidos oficiales y progresar de nivel.' }
            ];
        }

        _getCategoryById(catId) {
            const list = this._getCategories();
            return list.find(c => c.id === catId || c.name === catId) || list[0];
        }

        /**
         * Inicializa valores por defecto o pre-llenados desde el Store.
         */
        _postMountSetup() {
            const currentUser = window.Store ? window.Store.getState('currentUser') : null;

            const nameInput = document.getElementById('sp-form-name');
            const phoneInput = document.getElementById('sp-form-phone');
            const levelInput = document.getElementById('sp-form-level');

            if (currentUser) {
                if (nameInput && !nameInput.value) {
                    nameInput.value = currentUser.name || currentUser.displayName || '';
                }
                if (phoneInput && !phoneInput.value) {
                    phoneInput.value = currentUser.phone || currentUser.phoneNumber || '';
                }
                if (levelInput && currentUser.level) {
                    const parsed = parseFloat(currentUser.level);
                    if (!isNaN(parsed) && parsed >= 1.0 && parsed <= 7.0) {
                        levelInput.value = parsed;
                        this.onLevelChange(parsed);
                    }
                }
            }

            // Seleccionar categoría visual activa
            this.selectCategory(this.selectedCategoryId);

            // Trigger inicial de slider
            if (levelInput) {
                this.onLevelChange(levelInput.value);
            }
        }

        /**
         * Construye el HTML completo del Modal con sus estilos CSS encapsulados.
         */
        _buildModalHtml() {
            const categories = this._getCategories().filter(c => c.type === 'team' || !c.type);

            return `
            <style>
                /* OVERLAY BASE */
                .sp-season-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: rgba(15, 23, 42, 0.65);
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                    z-index: 999999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 16px;
                    box-sizing: border-box;
                    opacity: 0;
                    pointer-events: none;
                    transition: opacity 0.25s ease-out;
                    font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                }
                .sp-season-overlay.sp-season-visible {
                    opacity: 1;
                    pointer-events: auto;
                }

                /* MODAL CONTAINER (LIGHT THEME) */
                .sp-season-modal-container {
                    background: #ffffff;
                    border: 1.5px solid #e2e8f0;
                    border-radius: 28px;
                    width: 100%;
                    max-width: 900px;
                    max-height: 92vh;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.25), 0 0 35px rgba(0, 0, 0, 0.06);
                    transform: scale(0.92);
                    transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
                    color: #0f172a;
                    position: relative;
                }
                .sp-season-modal-container.sp-season-scale-in {
                    transform: scale(1);
                }
                .sp-season-modal-container.sp-season-scale-out {
                    transform: scale(0.92);
                }

                /* HEADER */
                .sp-season-header {
                    padding: 22px 24px 16px;
                    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                    border-bottom: 1px solid #e2e8f0;
                    position: relative;
                    flex-shrink: 0;
                }
                .sp-season-close-icon {
                    position: absolute;
                    top: 18px;
                    right: 20px;
                    width: 38px;
                    height: 38px;
                    border-radius: 50%;
                    background: #ffffff;
                    border: 1px solid #cbd5e1;
                    color: #64748b;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.05rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
                }
                .sp-season-close-icon:hover {
                    background: #fee2e2;
                    color: #ef4444;
                    border-color: #fca5a5;
                    transform: scale(1.05);
                }
                .sp-season-badge-top {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    background: #0f172a;
                    color: #CCFF00;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 0.68rem;
                    font-weight: 900;
                    letter-spacing: 0.8px;
                    text-transform: uppercase;
                    margin-bottom: 8px;
                }
                .sp-season-title {
                    margin: 0;
                    font-size: 1.35rem;
                    font-weight: 950;
                    color: #0f172a;
                    letter-spacing: -0.5px;
                    line-height: 1.2;
                }
                .sp-season-subtitle {
                    margin: 4px 0 0;
                    font-size: 0.82rem;
                    color: #64748b;
                    font-weight: 500;
                }

                /* NAVIGATION TABS */
                .sp-season-nav {
                    display: flex;
                    gap: 8px;
                    padding: 12px 24px 0;
                    background: #ffffff;
                    border-bottom: 1px solid #e2e8f0;
                    overflow-x: auto;
                    scrollbar-width: none;
                    flex-shrink: 0;
                }
                .sp-season-nav::-webkit-scrollbar { display: none; }
                .sp-season-nav-btn {
                    padding: 10px 18px;
                    border-radius: 12px 12px 0 0;
                    border: none;
                    background: transparent;
                    color: #64748b;
                    font-size: 0.82rem;
                    font-weight: 800;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.2s;
                    border-bottom: 3px solid transparent;
                    white-space: nowrap;
                }
                .sp-season-nav-btn:hover {
                    color: #0f172a;
                    background: #f8fafc;
                }
                .sp-season-nav-btn.active {
                    color: #000000;
                    background: #CCFF00;
                    border-bottom: 3px solid #000000;
                    box-shadow: 0 -2px 10px rgba(204, 255, 0, 0.35);
                }

                /* MODAL BODY (SCROLLABLE) */
                .sp-season-body {
                    padding: 20px 24px 28px;
                    overflow-y: auto;
                    flex: 1;
                    box-sizing: border-box;
                }
                .sp-season-pane {
                    display: none;
                }
                .sp-pane-enter {
                    animation: spFadeSlideUp 0.3s ease-out forwards;
                }
                @keyframes spFadeSlideUp {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                /* CATEGORIES GRID */
                .sp-categories-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
                    gap: 12px;
                    margin-bottom: 22px;
                }
                .sp-cat-card {
                    background: #ffffff;
                    border: 1.5px solid #e2e8f0;
                    border-radius: 18px;
                    padding: 14px 16px;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
                    position: relative;
                    text-align: left;
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
                }
                .sp-cat-card:hover {
                    background: #f8fafc;
                    border-color: #cbd5e1;
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
                }
                .sp-cat-card-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 6px;
                }
                .sp-cat-name {
                    font-size: 0.95rem;
                    font-weight: 900;
                    color: #0f172a;
                }
                .sp-cat-badge {
                    font-size: 0.65rem;
                    font-weight: 800;
                    padding: 3px 8px;
                    border-radius: 6px;
                    background: #f1f5f9;
                    color: #475569;
                    border: 1px solid #e2e8f0;
                    transition: all 0.2s;
                }
                .sp-cat-desc {
                    font-size: 0.75rem;
                    color: #64748b;
                    margin-bottom: 8px;
                    line-height: 1.35;
                }
                .sp-cat-level {
                    font-size: 0.72rem;
                    font-weight: 800;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    transition: color 0.2s;
                }

                /* ============================================================ */
                /* 🎨 COLORES POR GÉNERO AL SELECCIONAR:                         */
                /* - Rosa: Femenino                                             */
                /* - Azul: Masculino                                            */
                /* - Amarillo Verdoso: Mixto                                    */
                /* ============================================================ */

                /* 1. FEMENINO (ROSA) */
                .sp-cat-card.sp-cat-female {
                    border-color: #fbcfe8;
                }
                .sp-cat-card.sp-cat-female:hover:not(.selected) {
                    background: #ffffff;
                    border-color: #f472b6;
                    box-shadow: 0 6px 16px rgba(236, 72, 153, 0.12);
                }
                .sp-cat-card.sp-cat-female .sp-cat-badge {
                    background: #fdf2f8;
                    color: #db2777;
                    border-color: #fbcfe8;
                }
                .sp-cat-card.sp-cat-female .sp-cat-level {
                    color: #db2777;
                }
                .sp-cat-card.sp-cat-female.selected {
                    background: #fdf2f8 !important;
                    border: 2px solid #ec4899 !important;
                    box-shadow: 0 6px 20px rgba(236, 72, 153, 0.24) !important;
                }
                .sp-cat-card.sp-cat-female.selected .sp-cat-badge {
                    background: #fce7f3 !important;
                    color: #be185d !important;
                    border-color: #f472b6 !important;
                }
                .sp-cat-card.sp-cat-female.selected .sp-cat-name {
                    color: #9d174d;
                }

                /* 2. MIXTO (AMARILLO VERDOSO) */
                .sp-cat-card.sp-cat-mixed {
                    border-color: #e2e8f0;
                }
                .sp-cat-card.sp-cat-mixed:hover:not(.selected) {
                    background: #ffffff;
                    border-color: #a3e635;
                    box-shadow: 0 6px 16px rgba(132, 204, 22, 0.15);
                }
                .sp-cat-card.sp-cat-mixed .sp-cat-badge {
                    background: #f7fee7;
                    color: #4d7c0f;
                    border-color: #d9f99d;
                }
                .sp-cat-card.sp-cat-mixed .sp-cat-level {
                    color: #65a30d;
                }
                .sp-cat-card.sp-cat-mixed.selected {
                    background: #f7fee7 !important;
                    border: 2px solid #84cc16 !important;
                    box-shadow: 0 6px 20px rgba(132, 204, 22, 0.28) !important;
                }
                .sp-cat-card.sp-cat-mixed.selected .sp-cat-badge {
                    background: #ecfccb !important;
                    color: #365314 !important;
                    border-color: #bef264 !important;
                }
                .sp-cat-card.sp-cat-mixed.selected .sp-cat-name {
                    color: #1a2e05;
                }

                /* 3. MASCULINO (AZUL) */
                .sp-cat-card.sp-cat-male {
                    border-color: #e0f2fe;
                }
                .sp-cat-card.sp-cat-male:hover:not(.selected) {
                    background: #ffffff;
                    border-color: #38bdf8;
                    box-shadow: 0 6px 16px rgba(14, 165, 233, 0.12);
                }
                .sp-cat-card.sp-cat-male .sp-cat-badge {
                    background: #f0f9ff;
                    color: #0284c7;
                    border-color: #bae6fd;
                }
                .sp-cat-card.sp-cat-male .sp-cat-level {
                    color: #0284c7;
                }
                .sp-cat-card.sp-cat-male.selected {
                    background: #f0f9ff !important;
                    border: 2px solid #0ea5e9 !important;
                    box-shadow: 0 6px 20px rgba(14, 165, 233, 0.24) !important;
                }
                .sp-cat-card.sp-cat-male.selected .sp-cat-badge {
                    background: #e0f2fe !important;
                    color: #0369a1 !important;
                    border-color: #7dd3fc !important;
                }
                .sp-cat-card.sp-cat-male.selected .sp-cat-name {
                    color: #0c4a6e;
                }

                /* FORM STYLES */
                .sp-form-card {
                    background: #f8fafc;
                    border: 1.5px solid #e2e8f0;
                    border-radius: 22px;
                    padding: 22px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
                }
                .sp-form-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                }
                @media (max-width: 640px) {
                    .sp-form-grid {
                        grid-template-columns: 1fr;
                        gap: 14px;
                    }
                    .sp-categories-grid {
                        grid-template-columns: 1fr;
                    }
                    .sp-season-header {
                        padding: 18px 16px 14px;
                    }
                    .sp-season-body {
                        padding: 16px;
                    }
                }
                .sp-form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                .sp-form-label {
                    font-size: 0.75rem;
                    font-weight: 800;
                    color: #334155;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .sp-input {
                    background: #ffffff;
                    border: 1.5px solid #cbd5e1;
                    border-radius: 14px;
                    padding: 12px 14px;
                    color: #0f172a;
                    font-size: 0.88rem;
                    font-family: inherit;
                    transition: all 0.2s;
                    outline: none;
                    box-sizing: border-box;
                    width: 100%;
                }
                .sp-input:focus {
                    border-color: #84cc16;
                    box-shadow: 0 0 0 3px rgba(132, 204, 22, 0.25);
                    background: #ffffff;
                }
                .sp-select {
                    background: #ffffff;
                    border: 1.5px solid #cbd5e1;
                    border-radius: 14px;
                    padding: 12px 14px;
                    color: #0f172a;
                    font-size: 0.88rem;
                    font-family: inherit;
                    outline: none;
                    width: 100%;
                    box-sizing: border-box;
                    cursor: pointer;
                }
                .sp-select option {
                    background: #ffffff;
                    color: #0f172a;
                }

                /* SLIDER DE NIVEL */
                .sp-level-slider-wrap {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-top: 4px;
                }
                .sp-range-input {
                    flex: 1;
                    accent-color: #65a30d;
                    height: 6px;
                    cursor: pointer;
                }
                .sp-level-value-badge {
                    background: #0f172a;
                    color: #CCFF00;
                    font-weight: 950;
                    font-size: 0.88rem;
                    padding: 4px 10px;
                    border-radius: 10px;
                    min-width: 38px;
                    text-align: center;
                }

                /* SUBMIT BUTTON */
                .sp-btn-submit {
                    width: 100%;
                    padding: 15px;
                    background: #CCFF00;
                    color: #000000;
                    border: 1.5px solid #b5e600;
                    border-radius: 16px;
                    font-weight: 950;
                    font-size: 0.95rem;
                    letter-spacing: 0.5px;
                    text-transform: uppercase;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 6px 20px rgba(204, 255, 0, 0.35);
                    transition: all 0.2s;
                    margin-top: 18px;
                }
                .sp-btn-submit:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 25px rgba(204, 255, 0, 0.45);
                    background: #d4ff1a;
                }
                .sp-btn-submit:active:not(:disabled) {
                    transform: scale(0.98);
                }

                /* ERROR BANNER */
                .sp-error-banner {
                    background: #fef2f2;
                    border: 1px solid #fecaca;
                    border-radius: 14px;
                    padding: 12px 16px;
                    color: #b91c1c;
                    margin-bottom: 16px;
                    display: none;
                }

                /* SUCCESS VIEW */
                .sp-success-box {
                    text-align: center;
                    padding: 10px 0;
                    animation: spFadeSlideUp 0.3s ease-out;
                }
                .sp-success-icon-wrap {
                    width: 64px;
                    height: 64px;
                    background: rgba(204, 255, 0, 0.15);
                    border: 2px solid #CCFF00;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 16px;
                    box-shadow: 0 0 25px rgba(204, 255, 0, 0.3);
                }
                .sp-success-icon {
                    font-size: 2.2rem;
                    color: #CCFF00;
                }
                .sp-success-badge {
                    display: inline-block;
                    background: rgba(34, 197, 94, 0.15);
                    color: #4ade80;
                    border: 1px solid rgba(34, 197, 94, 0.35);
                    font-size: 0.7rem;
                    font-weight: 900;
                    padding: 3px 12px;
                    border-radius: 12px;
                    margin-bottom: 8px;
                }
                .sp-success-title {
                    font-size: 1.3rem;
                    font-weight: 950;
                    color: #0f172a;
                    margin: 0 0 6px;
                }
                .sp-success-desc {
                    font-size: 0.85rem;
                    color: #64748b;
                    margin: 0 auto 18px;
                    max-width: 480px;
                    line-height: 1.4;
                }
                .sp-success-summary {
                    background: #f8fafc;
                    border: 1.5px solid #e2e8f0;
                    border-radius: 16px;
                    padding: 14px 18px;
                    margin-bottom: 20px;
                    text-align: left;
                }
                .sp-summary-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 6px 0;
                    border-bottom: 1px dashed #e2e8f0;
                    font-size: 0.82rem;
                }
                .sp-summary-row:last-child {
                    border-bottom: none;
                }
                .sp-summary-label {
                    color: #64748b;
                    font-weight: 600;
                }
                .sp-summary-val {
                    color: #0f172a;
                    font-weight: 800;
                }
                .sp-summary-val.highlight {
                    color: #15803d;
                }

                /* WHATSAPP ACTION */
                .sp-whatsapp-cta-card {
                    background: #f0fdf4;
                    border: 1.5px solid #86efac;
                    border-radius: 20px;
                    padding: 16px;
                    text-align: left;
                    box-shadow: 0 4px 15px rgba(34, 197, 94, 0.08);
                }
                .sp-wa-icon-glow {
                    width: 38px;
                    height: 38px;
                    border-radius: 12px;
                    background: #25D366;
                    color: #ffffff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.4rem;
                    box-shadow: 0 0 15px rgba(37, 211, 102, 0.4);
                    flex-shrink: 0;
                }
                .sp-btn-whatsapp-action {
                    width: 100%;
                    padding: 14px;
                    background: #25D366;
                    color: #ffffff;
                    border: none;
                    border-radius: 14px;
                    font-weight: 950;
                    font-size: 0.9rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    box-shadow: 0 6px 18px rgba(37, 211, 102, 0.3);
                    transition: all 0.2s;
                }
                .sp-btn-whatsapp-action:hover {
                    background: #20bd5a;
                    transform: translateY(-2px);
                }
                .sp-btn-secondary {
                    flex: 1;
                    padding: 12px;
                    background: #ffffff;
                    border: 1.5px solid #cbd5e1;
                    color: #334155;
                    border-radius: 14px;
                    font-weight: 800;
                    font-size: 0.8rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .sp-btn-secondary:hover {
                    background: #f8fafc;
                    color: #0f172a;
                }
                .sp-btn-close-modal {
                    flex: 1;
                    padding: 12px;
                    background: #0f172a;
                    border: 1px solid #0f172a;
                    color: #ffffff;
                    border-radius: 14px;
                    font-weight: 800;
                    font-size: 0.8rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .sp-btn-close-modal:hover {
                    background: #1e293b;
                }

                /* FEATURE CARDS (AMERICANAS / ENTRENOS) */
                .sp-feature-hero {
                    border-radius: 24px;
                    padding: 24px;
                    position: relative;
                    overflow: hidden;
                    margin-bottom: 20px;
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.06);
                }
                .sp-feature-grid-3 {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                    gap: 14px;
                    margin-bottom: 22px;
                }
                .sp-feature-card {
                    background: #ffffff;
                    border: 1.5px solid #e2e8f0;
                    border-radius: 18px;
                    padding: 18px;
                    text-align: left;
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
                }
                .sp-feature-card-icon {
                    width: 44px;
                    height: 44px;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.3rem;
                    margin-bottom: 12px;
                }
            </style>

            <div class="sp-season-modal-container">
                <!-- HEADER -->
                <div class="sp-season-header">
                    <div class="sp-season-close-icon" onclick="window.SeasonCampaignView.closeModal()" title="Cerrar modal">
                        <i class="fas fa-times"></i>
                    </div>
                    <div class="sp-season-badge-top">
                        <i class="fas fa-fire"></i> EQUIPOS | TEMPORADA 2027 (OCT-NOV)
                    </div>
                    <h2 class="sp-season-title">SOMOSPÁDEL BARCELONA</h2>
                    <p class="sp-season-subtitle">Inscripciones oficiales para los equipos de competición, tecnificación y americanas.</p>
                </div>

                <!-- TABS -->
                <div class="sp-season-nav">
                    <button 
                        type="button" 
                        class="sp-season-nav-btn ${this.activeTab === 'equipos' ? 'active' : ''}" 
                        data-tab="equipos" 
                        onclick="window.SeasonCampaignView.switchTab('equipos')">
                        <span>🏆</span> EQUIPOS DE COMPETICIÓN
                    </button>
                    <button 
                        type="button" 
                        class="sp-season-nav-btn ${this.activeTab === 'americanas' ? 'active' : ''}" 
                        data-tab="americanas" 
                        onclick="window.SeasonCampaignView.switchTab('americanas')">
                        <span>⚡</span> AMERICANAS EN VIVO
                    </button>
                    <button 
                        type="button" 
                        class="sp-season-nav-btn ${this.activeTab === 'entrenos' ? 'active' : ''}" 
                        data-tab="entrenos" 
                        onclick="window.SeasonCampaignView.switchTab('entrenos')">
                        <span>🎯</span> ENTRENOS Y CLASES
                    </button>
                </div>

                <!-- BODY -->
                <div class="sp-season-body">
                    <!-- ================= PANE 1: EQUIPOS ================= -->
                    <div id="sp-season-pane-equipos" class="sp-season-pane" style="display: ${this.activeTab === 'equipos' ? 'block' : 'none'};">
                        <div style="margin-bottom: 18px;">
                            <h3 style="margin: 0 0 4px; font-size: 1.1rem; font-weight: 900; color: #0f172a;">
                                1. Selecciona tu Categoría o Equipo Preferido
                            </h3>
                            <p style="margin: 0; font-size: 0.78rem; color: #64748b;">
                                El club compite en las series oficiales de Barcelona. Elige el formato que mejor encaje con tu juego:
                            </p>
                        </div>

                        <!-- CATEGORIAS GRID ORGANIZADAS POR DIVISIÓN -->
                        <div style="display: flex; flex-direction: column; gap: 18px; margin-bottom: 24px;">
                            <!-- GRUPO FEMENINO (ROSA) -->
                            <div>
                                <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
                                    <span style="background:#fdf2f8; color:#db2777; border:1px solid #fbcfe8; font-size:0.7rem; font-weight:900; padding:4px 10px; border-radius:8px; text-transform:uppercase;">
                                        🚺 EQUIPOS FEMENINOS (2ª, 3ª y 4ª)
                                    </span>
                                </div>
                                <div class="sp-categories-grid">
                                    ${categories.filter(c => c.category === 'Femenina' || c.id.startsWith('femenina')).map(cat => `
                                        <div 
                                            class="sp-cat-card sp-cat-female ${cat.id === this.selectedCategoryId ? 'selected' : ''}"
                                            data-cat-id="${cat.id}"
                                            onclick="window.SeasonCampaignView.selectCategory('${cat.id}')">
                                            <div class="sp-cat-card-header">
                                                <span class="sp-cat-name">${cat.icon} ${this._escapeHtml(cat.name)}</span>
                                                <span class="sp-cat-badge">${this._escapeHtml(cat.badge)}</span>
                                            </div>
                                            <div class="sp-cat-desc">${this._escapeHtml(cat.description)}</div>
                                            <div class="sp-cat-level">
                                                <i class="fas fa-chart-line"></i> Nivel sugerido: ${cat.levelRange}
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>

                            <!-- GRUPO MIXTO (AMARILLO VERDOSO) -->
                            <div>
                                <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
                                    <span style="background:#f7fee7; color:#4d7c0f; border:1px solid #d9f99d; font-size:0.7rem; font-weight:900; padding:4px 10px; border-radius:8px; text-transform:uppercase;">
                                        🚻 EQUIPOS MIXTOS (3ª y 4ª)
                                    </span>
                                </div>
                                <div class="sp-categories-grid">
                                    ${categories.filter(c => c.category === 'Mixta' || c.id.startsWith('mixta')).map(cat => `
                                        <div 
                                            class="sp-cat-card sp-cat-mixed ${cat.id === this.selectedCategoryId ? 'selected' : ''}"
                                            data-cat-id="${cat.id}"
                                            onclick="window.SeasonCampaignView.selectCategory('${cat.id}')">
                                            <div class="sp-cat-card-header">
                                                <span class="sp-cat-name">${cat.icon} ${this._escapeHtml(cat.name)}</span>
                                                <span class="sp-cat-badge">${this._escapeHtml(cat.badge)}</span>
                                            </div>
                                            <div class="sp-cat-desc">${this._escapeHtml(cat.description)}</div>
                                            <div class="sp-cat-level">
                                                <i class="fas fa-chart-line"></i> Nivel sugerido: ${cat.levelRange}
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>

                            <!-- GRUPO MASCULINO (AZUL) -->
                            <div>
                                <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
                                    <span style="background:#f0f9ff; color:#0284c7; border:1px solid #bae6fd; font-size:0.7rem; font-weight:900; padding:4px 10px; border-radius:8px; text-transform:uppercase;">
                                        🏆 EQUIPOS MASCULINOS (3ª y 4ª)
                                    </span>
                                </div>
                                <div class="sp-categories-grid">
                                    ${categories.filter(c => c.category === 'Masculina' || c.id.startsWith('masculina')).map(cat => `
                                        <div 
                                            class="sp-cat-card sp-cat-male ${cat.id === this.selectedCategoryId ? 'selected' : ''}"
                                            data-cat-id="${cat.id}"
                                            onclick="window.SeasonCampaignView.selectCategory('${cat.id}')">
                                            <div class="sp-cat-card-header">
                                                <span class="sp-cat-name">${cat.icon} ${this._escapeHtml(cat.name)}</span>
                                                <span class="sp-cat-badge">${this._escapeHtml(cat.badge)}</span>
                                            </div>
                                            <div class="sp-cat-desc">${this._escapeHtml(cat.description)}</div>
                                            <div class="sp-cat-level">
                                                <i class="fas fa-chart-line"></i> Nivel sugerido: ${cat.levelRange}
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>

                        <!-- FORMULARIO RAPIDO -->
                        <div id="sp-equipos-form-wrapper">
                            ${this._buildFormInnerHtml()}
                        </div>
                    </div>

                    <!-- ================= PANE 2: AMERICANAS ================= -->
                    <div id="sp-season-pane-americanas" class="sp-season-pane" style="display: ${this.activeTab === 'americanas' ? 'block' : 'none'};">
                        <div class="sp-feature-hero" style="background: linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%); border: 1.5px solid rgba(59, 130, 246, 0.4);">
                            <div style="display: inline-block; background: #00d2ff; color: #000; font-weight: 900; font-size: 0.65rem; padding: 3px 10px; border-radius: 8px; margin-bottom: 8px;">
                                DINÁMICA REY DE PISTA
                            </div>
                            <h3 style="margin: 0 0 8px; font-size: 1.4rem; font-weight: 950; color: #ffffff;">
                                Americanas SomosPadel: Adrenalina, Puntos y Tercer Tiempo
                            </h3>
                            <p style="margin: 0; font-size: 0.85rem; color: #cbd5e1; max-width: 600px; line-height: 1.45;">
                                Juega partidos dinámicos de 20 minutos con rotación constante de parejas y subida/bajada de pistas. Puntuaciones registradas en vivo en la app oficial.
                            </p>
                        </div>

                        <div class="sp-feature-grid-3">
                            <div class="sp-feature-card">
                                <div class="sp-feature-card-icon" style="background: rgba(204, 255, 0, 0.15); color: #CCFF00;">
                                    <i class="fas fa-bolt"></i>
                                </div>
                                <div style="font-weight: 900; font-size: 0.95rem; color: #0f172a; margin-bottom: 6px;">Puntuación en Vivo</div>
                                <div style="font-size: 0.78rem; color: #64748b; line-height: 1.4;">
                                    Ingresa resultados desde tu móvil al finalizar cada ronda. La app calcula clasificación y cruces sin esperas.
                                </div>
                            </div>

                            <div class="sp-feature-card">
                                <div class="sp-feature-card-icon" style="background: rgba(14, 165, 233, 0.15); color: #38bdf8;">
                                    <i class="fas fa-trophy"></i>
                                </div>
                                <div style="font-weight: 900; font-size: 0.95rem; color: #0f172a; margin-bottom: 6px;">Ranking de Club Oficial</div>
                                <div style="font-size: 0.78rem; color: #64748b; line-height: 1.4;">
                                    Cada americana puntúa para la Carrera de Campeones y el Salón de la Fama. ¡Mide tu progreso real!
                                </div>
                            </div>

                            <div class="sp-feature-card">
                                <div class="sp-feature-card-icon" style="background: rgba(168, 85, 247, 0.15); color: #c084fc;">
                                    <i class="fas fa-beer"></i>
                                </div>
                                <div style="font-weight: 900; font-size: 0.95rem; color: #0f172a; margin-bottom: 6px;">El Mejor Tercer Tiempo</div>
                                <div style="font-size: 0.78rem; color: #64748b; line-height: 1.4;">
                                    Conoce nuevos compañeros de juego, organiza futuros partidos y disfruta del ambiente de comunidad de SomosPadel.
                                </div>
                            </div>
                        </div>

                        <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 20px; padding: 20px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.03);">
                            <div style="font-weight: 900; font-size: 1.05rem; color: #0f172a; margin-bottom: 6px;">
                                ¿Listo para saltar a pista este fin de semana?
                            </div>
                            <div style="font-size: 0.8rem; color: #64748b; margin-bottom: 16px;">
                                Consulta las próximas americanas programadas y asegura tu plaza antes de que se completen.
                            </div>
                            <button 
                                type="button" 
                                class="sp-btn-submit" 
                                style="max-width: 320px; margin: 0 auto;"
                                onclick="window.Router && window.Router.navigate('americanas'); window.SeasonCampaignView.closeModal();">
                                <i class="fas fa-play" style="margin-right: 8px;"></i>
                                IR A AMERICANAS ACTIVAS
                            </button>
                        </div>
                    </div>

                    <!-- ================= PANE 3: ENTRENOS ================= -->
                    <div id="sp-season-pane-entrenos" class="sp-season-pane" style="display: ${this.activeTab === 'entrenos' ? 'block' : 'none'};">
                        <div class="sp-feature-hero" style="background: linear-gradient(135deg, #14532d 0%, #064e3b 60%, #022c22 100%); border: 1.5px solid rgba(34, 197, 94, 0.4);">
                            <div style="display: inline-block; background: #CCFF00; color: #000; font-weight: 900; font-size: 0.65rem; padding: 3px 10px; border-radius: 8px; margin-bottom: 8px;">
                                TECNIFICACIÓN & PREPARACIÓN
                            </div>
                            <h3 style="margin: 0 0 8px; font-size: 1.4rem; font-weight: 950; color: #ffffff;">
                                Entrenos de Tecnificación: Llega al 100% a la Nueva Temporada
                            </h3>
                            <p style="margin: 0; font-size: 0.85rem; color: #dcfce7; max-width: 620px; line-height: 1.45;">
                                Clases dirigidas por entrenadores certificados para perfeccionar tu víbora, bajada de pared, toma de decisiones táctica y resistencia en pista.
                            </p>
                        </div>

                        <div class="sp-feature-grid-3">
                            <div class="sp-feature-card">
                                <div class="sp-feature-card-icon" style="background: rgba(34, 197, 94, 0.15); color: #4ade80;">
                                    <i class="fas fa-crosshairs"></i>
                                </div>
                                <div style="font-weight: 900; font-size: 0.95rem; color: #0f172a; margin-bottom: 6px;">Perfeccionamiento Técnico</div>
                                <div style="font-size: 0.78rem; color: #64748b; line-height: 1.4;">
                                    Mecánica de golpeo precisa: globo defensivo con altura, volea agresiva y definición en la red sin cometer errores no forzados.
                                </div>
                            </div>

                            <div class="sp-feature-card">
                                <div class="sp-feature-card-icon" style="background: rgba(234, 179, 8, 0.15); color: #facc15;">
                                    <i class="fas fa-chess"></i>
                                </div>
                                <div style="font-weight: 900; font-size: 0.95rem; color: #0f172a; margin-bottom: 6px;">Táctica de Pareja</div>
                                <div style="font-size: 0.78rem; color: #64748b; line-height: 1.4;">
                                    Aprende a coordinarte con tu compañero: basculaciones, cobertura del centro, lectura del juego rival y transiciones ataque-defensa.
                                </div>
                            </div>

                            <div class="sp-feature-card">
                                <div class="sp-feature-card-icon" style="background: rgba(56, 189, 248, 0.15); color: #38bdf8;">
                                    <i class="fas fa-users"></i>
                                </div>
                                <div style="font-weight: 900; font-size: 0.95rem; color: #0f172a; margin-bottom: 6px;">Grupos Reducidos</div>
                                <div style="font-size: 0.78rem; color: #64748b; line-height: 1.4;">
                                    Máximo 4 jugadores por pista para garantizar alto volumen de bolas, atención individualizada y corrección en tiempo real.
                                </div>
                            </div>
                        </div>

                        <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 20px; padding: 20px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.03);">
                            <div style="font-weight: 900; font-size: 1.05rem; color: #0f172a; margin-bottom: 6px;">
                                Reserva tu Plaza de Tecnificación
                            </div>
                            <div style="font-size: 0.8rem; color: #64748b; margin-bottom: 16px;">
                                Conoce horarios, disponibilidad de pistas y entrenadores de SomosPadel Barcelona.
                            </div>
                            <button 
                                type="button" 
                                class="sp-btn-submit" 
                                style="max-width: 320px; margin: 0 auto; background: #22c55e; color: #ffffff;"
                                onclick="window.Router && window.Router.navigate('entrenos'); window.SeasonCampaignView.closeModal();">
                                <i class="fas fa-graduation-cap" style="margin-right: 8px;"></i>
                                VER CLASES Y HORARIOS
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            `;
        }

        /**
         * Genera el HTML del interior del formulario.
         */
        _buildFormInnerHtml() {
            const categories = this._getCategories();
            const selectedCat = this._getCategoryById(this.selectedCategoryId);

            return `
            <div class="sp-form-card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 8px;">
                    <div>
                        <span style="font-size: 0.7rem; font-weight: 900; color: #CCFF00; letter-spacing: 1px; text-transform: uppercase;">
                            SOLICITUD OFICIAL
                        </span>
                        <h4 style="margin: 2px 0 0; font-size: 1.05rem; font-weight: 900; color: #fff;">
                            Formulario Rápido de Pre-Inscripción
                        </h4>
                    </div>
                    <div id="sp-selected-cat-badge" style="background: rgba(204, 255, 0, 0.12); border: 1px solid rgba(204, 255, 0, 0.3); color: #CCFF00; font-size: 0.72rem; font-weight: 900; padding: 4px 10px; border-radius: 10px;">
                        ${selectedCat ? `${selectedCat.icon} ${selectedCat.name} (${selectedCat.levelRange})` : 'Selecciona categoría'}
                    </div>
                </div>

                <!-- BANNER DE ERROR DINÁMICO -->
                <div id="sp-form-error-banner" class="sp-error-banner"></div>

                <form id="sp-season-form" onsubmit="window.SeasonCampaignView.handleFormSubmit(event)">
                    <div class="sp-form-grid">
                        <!-- NOMBRE -->
                        <div class="sp-form-group">
                            <label class="sp-form-label" for="sp-form-name">Nombre y Apellidos *</label>
                            <input 
                                type="text" 
                                id="sp-form-name" 
                                class="sp-input" 
                                placeholder="Ej. Carlos Martínez" 
                                required 
                                maxlength="80"
                                autocomplete="name">
                        </div>

                        <!-- TELÉFONO -->
                        <div class="sp-form-group">
                            <label class="sp-form-label" for="sp-form-phone">Teléfono Móvil (WhatsApp) *</label>
                            <input 
                                type="tel" 
                                id="sp-form-phone" 
                                class="sp-input" 
                                placeholder="Ej. 649 21 93 50" 
                                required 
                                autocomplete="tel">
                        </div>

                        <!-- NIVEL -->
                        <div class="sp-form-group">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <label class="sp-form-label" for="sp-form-level">Nivel de Juego (1.0 - 7.0) *</label>
                                <span id="sp-level-desc-badge" style="font-size: 0.65rem; font-weight: 800; padding: 2px 8px; border-radius: 6px; background: rgba(34, 197, 94, 0.2); color: #4ade80;">
                                    Intermedio Plus
                                </span>
                            </div>
                            <div class="sp-level-slider-wrap">
                                <input 
                                    type="range" 
                                    id="sp-form-level" 
                                    class="sp-range-input" 
                                    min="1.0" 
                                    max="7.0" 
                                    step="0.25" 
                                    value="3.5"
                                    oninput="window.SeasonCampaignView.onLevelChange(this.value)">
                                <span id="sp-level-value-badge" class="sp-level-value-badge">3.5</span>
                            </div>
                        </div>

                        <!-- CATEGORÍA / EQUIPO SELECT -->
                        <div class="sp-form-group">
                            <label class="sp-form-label" for="sp-form-category">Categoría / Preferencia *</label>
                            <select 
                                id="sp-form-category" 
                                class="sp-select" 
                                onchange="window.SeasonCampaignView.selectCategory(this.value)">
                                <optgroup label="🚺 Equipos Femeninos">
                                    ${categories.filter(c => c.category === 'Femenina' || c.id.startsWith('femenina')).map(c => `
                                        <option value="${c.id}" ${c.id === this.selectedCategoryId ? 'selected' : ''}>
                                            ${c.icon} ${c.name} (${c.levelRange})
                                        </option>
                                    `).join('')}
                                </optgroup>
                                <optgroup label="🚻 Equipos Mixtos">
                                    ${categories.filter(c => c.category === 'Mixta' || c.id.startsWith('mixta')).map(c => `
                                        <option value="${c.id}" ${c.id === this.selectedCategoryId ? 'selected' : ''}>
                                            ${c.icon} ${c.name} (${c.levelRange})
                                        </option>
                                    `).join('')}
                                </optgroup>
                                <optgroup label="🏆 Equipos Masculinos">
                                    ${categories.filter(c => c.category === 'Masculina' || c.id.startsWith('masculina')).map(c => `
                                        <option value="${c.id}" ${c.id === this.selectedCategoryId ? 'selected' : ''}>
                                            ${c.icon} ${c.name} (${c.levelRange})
                                        </option>
                                    `).join('')}
                                </optgroup>
                            </select>
                        </div>
                    </div>

                    <!-- OBSERVACIONES / DISPONIBILIDAD -->
                    <div class="sp-form-group" style="margin-top: 14px;">
                        <label class="sp-form-label" for="sp-form-comments">Disponibilidad / Preferencia de Posición (Opcional)</label>
                        <textarea 
                            id="sp-form-comments" 
                            class="sp-input" 
                            rows="2" 
                            placeholder="Ej. Juego de revés, disponible fines de semana y tardes. Me gustaría jugar en el equipo de 2ª."></textarea>
                    </div>

                    <!-- BOTÓN ENVIAR -->
                    <button type="submit" id="sp-form-submit-btn" class="sp-btn-submit">
                        <i class="fas fa-paper-plane" style="margin-right: 8px;"></i>
                        ENVIAR FORMULARIO INSCRIPCIÓN
                    </button>

                    <div style="text-align: center; margin-top: 12px; font-size: 0.72rem; color: #94a3b8;">
                        🔒 Tus datos se procesan con cifrado seguro y se sincronizan directamente con el delegado deportivo.
                    </div>
                </form>
            </div>
            `;
        }

        /**
         * Escape utilitario contra inyecciones XSS.
         */
        _escapeHtml(text) {
            if (!text) return '';
            const map = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            };
            return String(text).replace(/[&<>"']/g, m => map[m]);
        }
    }

    // Instanciar singleton y registrar en window
    const viewInstance = new SeasonCampaignView();
    global.SeasonCampaignView = viewInstance;

    console.log('🎾 [SeasonCampaignView] Módulo de Vista de Campaña de Temporada cargado v1.0');

})(typeof window !== 'undefined' ? window : this);
