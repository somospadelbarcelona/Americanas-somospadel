/**
 * AdminTournamentLogicLab.js
 * 
 * 🧪 CENTRO DE CONTROL & AUDITORÍA DE LÓGICA DE TORNEOS Y ENTRENOS
 * SomosPádel BCN - Admin Suite
 * 
 * Interfaz interactiva de simulación multimodal, escáner de las 5 Reglas de Oro,
 * diagnóstico de eventos reales y batería de auto-test algorítmico.
 * 
 * Expuesto globalmente en `window.AdminTournamentLogicLab`.
 * Hook registrado en `window.AdminViews.logic_lab`.
 */

(function (global) {
    'use strict';

    class AdminTournamentLogicLab {
        constructor() {
            this.container = null;
            this.activeTab = 'simulator'; // 'simulator' | 'rules_scanner' | 'real_diagnosis' | 'self_test'

            // Estado del Simulador
            this.simEventType = 'americana'; // 'americana' | 'entreno'
            this.simPlayersSource = 'real'; // 'real' | 'pro'
            this.simClonedFrom = null; // información del evento clonado si aplica
            this.simMode = 'twister'; // 'twister' | 'fixed' | 'swiss'
            this.simCourts = 4;
            this.simRounds = 6;
            this.lastSimulation = null;
            this.selectedRoundView = 1;
            this.cachedRealPlayers = null;

            // Clonador de Eventos Reales para Simulación Ficticia
            this.simCloneEventType = 'americana';
            this.simCloneEventsList = [
                { id: 'ev_demo_americana_1', name: 'Americana Nocturna Viernes - 4 Pistas', date: '2026-09-25', status: 'finished', pair_mode: 'twister', num_courts: 4 },
                { id: 'ev_demo_americana_2', name: 'Torneo Parejas Oro - Sábado Mañana', date: '2026-09-26', status: 'finished', pair_mode: 'fixed', num_courts: 4 },
                { id: 'ev_demo_americana_3', name: 'Americana Dominical Non-Stop - 5 Pistas', date: '2026-09-27', status: 'finished', pair_mode: 'twister', num_courts: 5 }
            ];
            this.loadingSimCloneEvents = false;

            // Estado de Simulación Paso a Paso
            this.stepState = {
                active: false,
                currentRound: 0,
                maxRounds: 6,
                history: [],
                players: []
            };

            // Estado de Escáner de Reglas de Oro
            this.lastAuditResult = null;
            this.lastAuditSource = 'Ninguna auditoría ejecutada todavía';
            this.expandedRuleId = null;

            // Estado de Diagnóstico de Eventos Reales
            this.realEventType = 'americana'; // 'americana' | 'entreno'
            this.realEventsList = [];
            this.selectedRealEventId = '';
            this.loadingRealEvents = false;
            this.lastRealDiagnosis = null;

            // Estado de Self-Test
            this.lastSelfTestResult = null;
            this.runningSelfTest = false;
        }

        /**
         * Retorna la referencia al servicio de auditoría
         */
        getService() {
            if (global.TournamentLogicAuditService) {
                return global.TournamentLogicAuditService;
            }
            if (typeof require !== 'undefined') {
                try {
                    return require('./TournamentLogicAuditService.js');
                } catch (e) {
                    // Ignore
                }
            }
            return null;
        }

        /**
         * Renderiza la vista principal en el contenedor objetivo
         * @param {HTMLElement|string|null} targetContainer 
         */
        render(targetContainer = null) {
            // Actualizar inmediatamente el título superior del admin
            const titleEl = document.getElementById('page-title');
            if (titleEl) titleEl.textContent = 'AUDITORÍA DE LÓGICA (LAB)';

            const container = (typeof targetContainer === 'string')
                ? document.querySelector(targetContainer)
                : (targetContainer || document.getElementById('content-area'));

            if (!container) {
                console.error("❌ [AdminTournamentLogicLab] Contenedor objetivo #content-area no encontrado.");
                return;
            }

            this.container = container;
            this._injectScopedStyles();

            const service = this.getService();

            // Si !this.lastSimulation: generar inmediatamente en memoria la simulación síncrona (sin await de red)
            if (!this.lastSimulation && service) {
                try {
                    const result = service.simulateTournament({
                        eventType: this.simEventType,
                        playersSource: this.simPlayersSource,
                        numCourts: this.simCourts,
                        mode: this.simMode,
                        rounds: this.simRounds
                    });

                    this.lastSimulation = result;
                    this.selectedRoundView = 1;

                    // Actualizar automáticamente la auditoría de estas actas
                    this.lastAuditResult = service.auditGoldenRules(result.allMatches, {
                        mode: result.mode,
                        num_courts: result.numCourts,
                        rounds: result.rounds
                    });
                    this.lastAuditSource = `Última Simulación Turbo (${this.simEventType.toUpperCase()}, ${result.mode.toUpperCase()}, ${result.numCourts} pistas, 6 rondas)`;
                } catch (e) {
                    console.error("❌ [AdminTournamentLogicLab] Error en simulación síncrona inicial:", e);
                }
            }

            // Inyectar this.container.innerHTML de forma síncrona e instantánea
            this.container.innerHTML = `
                <div class="logic-lab-wrapper" id="logic-lab-view">
                    <!-- Cabecera de Telemetría -->
                    ${this._renderHeaderHtml()}

                    <!-- Navegación por Pestañas (Sub-nav) -->
                    ${this._renderSubNavHtml()}

                    <!-- Contenedor Dinámico de Pestaña -->
                    <div class="logic-lab-tab-content" id="logic-lab-tab-container">
                        ${this._renderActiveTabContent()}
                    </div>
                </div>
            `;

            // Enlazar listeners
            this._setupEventListeners();

            // Precarga de jugadores de Firestore en segundo plano (non-blocking)
            if (this.simPlayersSource === 'real' && !this.cachedRealPlayers && service && typeof service.fetchRealPlayers === 'function') {
                const required = this.simCourts * 4;
                service.fetchRealPlayers(Math.max(40, required)).then(pool => {
                    if (Array.isArray(pool) && pool.length > 0) {
                        this.cachedRealPlayers = pool;
                    }
                }).catch(() => {});
            }

            // Cargar en segundo plano eventos reales disponibles para clonar si aún no están cargados (non-blocking)
            if (this.simCloneEventsList.length <= 3 && !this.loadingSimCloneEvents) {
                this.fetchCloneEvents(false).catch(() => {});
            }
        }

        /**
         * Inyección de estilos CSS encapsulados con estética Dark Glassmorphism oficial
         * @private
         */
        _injectScopedStyles() {
            if (document.getElementById('logic-lab-styles')) return;

            const style = document.createElement('style');
            style.id = 'logic-lab-styles';
            style.textContent = `
                .logic-lab-wrapper {
                    font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                    color: #F8FAFC;
                    padding: 8px 4px 40px 4px;
                    max-width: 1400px;
                    margin: 0 auto;
                }

                /* Header */
                .ll-header {
                    background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.85));
                    border: 1px solid rgba(56, 189, 248, 0.25);
                    border-radius: 20px;
                    padding: 24px 28px;
                    margin-bottom: 22px;
                    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(20px);
                    position: relative;
                    overflow: hidden;
                }
                .ll-header::before {
                    content: '';
                    position: absolute;
                    top: -50px;
                    right: -50px;
                    width: 240px;
                    height: 240px;
                    background: radial-gradient(circle, rgba(56, 189, 248, 0.18), transparent 70%);
                    pointer-events: none;
                }
                .ll-header-top {
                    display: flex;
                    flex-wrap: wrap;
                    align-items: center;
                    justify-content: space-between;
                    gap: 16px;
                }
                .ll-title-group h1 {
                    font-size: 1.75rem;
                    font-weight: 900;
                    letter-spacing: -0.02em;
                    margin: 0 0 6px 0;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    background: linear-gradient(135deg, #FFFFFF 30%, #38BDF8 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .ll-title-group p {
                    color: #94A3B8;
                    font-size: 0.95rem;
                    margin: 0;
                    line-height: 1.4;
                }
                .ll-engine-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: rgba(16, 185, 129, 0.12);
                    border: 1px solid rgba(16, 185, 129, 0.35);
                    color: #10B981;
                    padding: 8px 16px;
                    border-radius: 9999px;
                    font-size: 0.82rem;
                    font-weight: 800;
                    letter-spacing: 0.05em;
                    box-shadow: 0 0 16px rgba(16, 185, 129, 0.2);
                }
                .ll-pulse-dot {
                    width: 9px;
                    height: 9px;
                    background: #10B981;
                    border-radius: 50%;
                    box-shadow: 0 0 10px #10B981;
                    animation: llPulse 1.8s infinite;
                }
                @keyframes llPulse {
                    0% { transform: scale(0.9); opacity: 0.7; box-shadow: 0 0 4px #10B981; }
                    50% { transform: scale(1.25); opacity: 1; box-shadow: 0 0 14px #10B981; }
                    100% { transform: scale(0.9); opacity: 0.7; box-shadow: 0 0 4px #10B981; }
                }

                /* SubNav Tabs */
                .ll-subnav {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    background: rgba(15, 23, 42, 0.7);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 16px;
                    padding: 8px;
                    margin-bottom: 24px;
                    backdrop-filter: blur(12px);
                }
                .ll-tab-btn {
                    flex: 1 1 auto;
                    min-width: 170px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    padding: 12px 18px;
                    border-radius: 12px;
                    border: 1px solid transparent;
                    background: transparent;
                    color: #94A3B8;
                    font-size: 0.92rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.22s ease-in-out;
                }
                .ll-tab-btn:hover {
                    color: #FFFFFF;
                    background: rgba(255, 255, 255, 0.05);
                }
                .ll-tab-btn.active {
                    background: linear-gradient(135deg, rgba(56, 189, 248, 0.18), rgba(15, 23, 42, 0.9));
                    border: 1px solid #38BDF8;
                    color: #38BDF8;
                    box-shadow: 0 4px 20px rgba(56, 189, 248, 0.25);
                }
                .ll-tab-btn.active.rules {
                    border-color: #CCFF00;
                    color: #CCFF00;
                    background: linear-gradient(135deg, rgba(204, 255, 0, 0.16), rgba(15, 23, 42, 0.9));
                    box-shadow: 0 4px 20px rgba(204, 255, 0, 0.2);
                }
                .ll-tab-btn.active.real {
                    border-color: #8B5CF6;
                    color: #A78BFA;
                    background: linear-gradient(135deg, rgba(139, 92, 246, 0.18), rgba(15, 23, 42, 0.9));
                    box-shadow: 0 4px 20px rgba(139, 92, 246, 0.2);
                }
                .ll-tab-btn.active.selftest {
                    border-color: #F59E0B;
                    color: #FBBF24;
                    background: linear-gradient(135deg, rgba(245, 158, 11, 0.18), rgba(15, 23, 42, 0.9));
                    box-shadow: 0 4px 20px rgba(245, 158, 11, 0.2);
                }

                /* Common Cards */
                .ll-card {
                    background: rgba(15, 23, 42, 0.85);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 18px;
                    padding: 24px;
                    backdrop-filter: blur(16px);
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
                    margin-bottom: 24px;
                    position: relative;
                }
                .ll-card-header {
                    display: flex;
                    flex-wrap: wrap;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                    margin-bottom: 20px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
                    padding-bottom: 14px;
                }
                .ll-card-title {
                    font-size: 1.2rem;
                    font-weight: 800;
                    color: #FFFFFF;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin: 0;
                }
                .ll-card-subtitle {
                    color: #94A3B8;
                    font-size: 0.85rem;
                    margin-top: 3px;
                }

                /* Controls Bar */
                .ll-controls-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                    gap: 16px;
                    margin-bottom: 20px;
                }
                .ll-form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .ll-form-label {
                    font-size: 0.8rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: #94A3B8;
                }
                .ll-select, .ll-input {
                    background: #1E293B;
                    border: 1px solid rgba(255, 255, 255, 0.12);
                    border-radius: 10px;
                    color: #F8FAFC;
                    padding: 10px 14px;
                    font-size: 0.92rem;
                    font-family: inherit;
                    outline: none;
                    transition: border-color 0.2s;
                }
                .ll-select:focus, .ll-input:focus {
                    border-color: #38BDF8;
                    box-shadow: 0 0 10px rgba(56, 189, 248, 0.3);
                }
                .ll-btn-actions {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 12px;
                    margin-top: 14px;
                }
                .ll-btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 9px;
                    padding: 12px 22px;
                    border-radius: 12px;
                    font-size: 0.92rem;
                    font-weight: 800;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    border: none;
                    text-decoration: none;
                }
                .ll-btn-primary {
                    background: linear-gradient(135deg, #0284C7, #38BDF8);
                    color: #031327;
                    box-shadow: 0 4px 18px rgba(56, 189, 248, 0.4);
                }
                .ll-btn-primary:hover {
                    background: linear-gradient(135deg, #38BDF8, #7DD3FC);
                    transform: translateY(-2px);
                    box-shadow: 0 6px 24px rgba(56, 189, 248, 0.55);
                }
                .ll-btn-neon {
                    background: linear-gradient(135deg, #A3E635, #CCFF00);
                    color: #0F172A;
                    box-shadow: 0 4px 18px rgba(204, 255, 0, 0.35);
                }
                .ll-btn-neon:hover {
                    background: linear-gradient(135deg, #CCFF00, #E4FF66);
                    transform: translateY(-2px);
                    box-shadow: 0 6px 24px rgba(204, 255, 0, 0.5);
                }
                .ll-btn-outline {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    color: #E2E8F0;
                }
                .ll-btn-outline:hover {
                    background: rgba(255, 255, 255, 0.12);
                    border-color: #94A3B8;
                }

                /* Clone & Fictitious Simulation Box */
                .ll-clone-card {
                    background: linear-gradient(135deg, rgba(30, 41, 59, 0.85), rgba(15, 23, 42, 0.95));
                    border: 1px solid rgba(56, 189, 248, 0.25);
                    border-radius: 16px;
                    padding: 18px 22px;
                    margin-bottom: 22px;
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
                    backdrop-filter: blur(16px);
                }
                .ll-clone-header {
                    display: flex;
                    flex-wrap: wrap;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                    margin-bottom: 14px;
                    padding-bottom: 10px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
                }
                .ll-clone-info {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .ll-clone-icon {
                    width: 38px;
                    height: 38px;
                    border-radius: 10px;
                    background: rgba(56, 189, 248, 0.15);
                    border: 1px solid rgba(56, 189, 248, 0.3);
                    color: #38BDF8;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.1rem;
                }
                .ll-clone-title {
                    font-size: 1.05rem;
                    font-weight: 800;
                    color: #FFFFFF;
                    margin: 0 0 2px 0;
                }
                .ll-clone-subtitle {
                    font-size: 0.82rem;
                    color: #94A3B8;
                    margin: 0;
                }
                .ll-clone-controls {
                    display: flex;
                    flex-wrap: wrap;
                    align-items: flex-end;
                    gap: 14px;
                }
                .ll-clone-btn-group {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                    flex-wrap: wrap;
                }
                .ll-btn-clone {
                    background: linear-gradient(135deg, #0284C7, #0EA5E9);
                    color: #FFFFFF;
                    font-weight: 800;
                    border: 1px solid #38BDF8;
                    box-shadow: 0 4px 16px rgba(14, 165, 233, 0.35);
                }
                .ll-btn-clone:hover {
                    background: linear-gradient(135deg, #0EA5E9, #38BDF8);
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(14, 165, 233, 0.5);
                }
                .ll-btn-unlink {
                    background: rgba(239, 68, 68, 0.15);
                    border: 1px solid rgba(239, 68, 68, 0.35);
                    color: #F87171;
                    border-radius: 8px;
                    padding: 6px 12px;
                    font-size: 0.78rem;
                    font-weight: 800;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                }
                .ll-btn-unlink:hover {
                    background: rgba(239, 68, 68, 0.25);
                    border-color: #EF4444;
                    color: #FFFFFF;
                }
                .ll-cloned-badge-group {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    flex-wrap: wrap;
                }

                /* Telemetry Badges Bar */
                .ll-telemetry-badge-bar {
                    display: flex;
                    flex-wrap: wrap;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 18px;
                }
                .ll-telemetry-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 14px;
                    border-radius: 9999px;
                    font-size: 0.8rem;
                    font-weight: 800;
                    letter-spacing: 0.04em;
                    backdrop-filter: blur(10px);
                }
                .ll-telemetry-badge.americana {
                    background: rgba(56, 189, 248, 0.15);
                    border: 1px solid rgba(56, 189, 248, 0.4);
                    color: #38BDF8;
                    box-shadow: 0 0 14px rgba(56, 189, 248, 0.2);
                }
                .ll-telemetry-badge.entreno {
                    background: rgba(204, 255, 0, 0.15);
                    border: 1px solid rgba(204, 255, 0, 0.4);
                    color: #CCFF00;
                    box-shadow: 0 0 14px rgba(204, 255, 0, 0.2);
                }
                .ll-telemetry-badge.real {
                    background: rgba(167, 139, 250, 0.15);
                    border: 1px solid rgba(167, 139, 250, 0.4);
                    color: #C4B5FD;
                }
                .ll-telemetry-badge.pro {
                    background: rgba(245, 158, 11, 0.15);
                    border: 1px solid rgba(245, 158, 11, 0.4);
                    color: #FCD34D;
                }
                .ll-telemetry-badge.cloned {
                    background: rgba(16, 185, 129, 0.15);
                    border: 1px solid rgba(16, 185, 129, 0.4);
                    color: #6EE7B7;
                    box-shadow: 0 0 14px rgba(16, 185, 129, 0.2);
                }

                /* Telemetry Stats Bar */
                .ll-kpi-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                    gap: 14px;
                    margin-bottom: 24px;
                }
                .ll-kpi-card {
                    background: rgba(30, 41, 59, 0.65);
                    border: 1px solid rgba(255, 255, 255, 0.07);
                    border-radius: 14px;
                    padding: 16px 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    position: relative;
                    overflow: hidden;
                }
                .ll-kpi-label {
                    font-size: 0.76rem;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                    color: #94A3B8;
                    font-weight: 700;
                }
                .ll-kpi-value {
                    font-size: 1.6rem;
                    font-weight: 900;
                    color: #FFFFFF;
                }
                .ll-kpi-badge {
                    font-size: 0.72rem;
                    font-weight: 800;
                    color: #38BDF8;
                }

                /* Podio de Honor */
                .ll-podium-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 16px;
                    margin-bottom: 24px;
                }
                .ll-podium-card {
                    border-radius: 16px;
                    padding: 20px;
                    position: relative;
                    background: rgba(15, 23, 42, 0.9);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    overflow: hidden;
                }
                .ll-podium-card.gold {
                    border-color: rgba(234, 179, 8, 0.5);
                    background: linear-gradient(135deg, rgba(234, 179, 8, 0.12), rgba(15, 23, 42, 0.95));
                    box-shadow: 0 8px 24px rgba(234, 179, 8, 0.18);
                }
                .ll-podium-card.silver {
                    border-color: rgba(148, 163, 184, 0.4);
                    background: linear-gradient(135deg, rgba(148, 163, 184, 0.1), rgba(15, 23, 42, 0.95));
                }
                .ll-podium-card.bronze {
                    border-color: rgba(217, 119, 6, 0.4);
                    background: linear-gradient(135deg, rgba(217, 119, 6, 0.1), rgba(15, 23, 42, 0.95));
                }
                .ll-podium-rank {
                    font-size: 1.8rem;
                    font-weight: 900;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .ll-podium-name {
                    font-size: 1.15rem;
                    font-weight: 800;
                    color: #FFFFFF;
                    word-break: break-word;
                }
                .ll-podium-stats {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 12px;
                    font-size: 0.84rem;
                    color: #94A3B8;
                    margin-top: 4px;
                }
                .ll-podium-stat-pill {
                    background: rgba(255, 255, 255, 0.06);
                    padding: 4px 10px;
                    border-radius: 8px;
                    font-weight: 700;
                }

                /* Round Selector & Match Cards */
                .ll-rounds-nav {
                    display: flex;
                    gap: 8px;
                    overflow-x: auto;
                    padding-bottom: 8px;
                    margin-bottom: 18px;
                }
                .ll-round-pill {
                    background: rgba(30, 41, 59, 0.8);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: #94A3B8;
                    padding: 8px 16px;
                    border-radius: 10px;
                    font-size: 0.85rem;
                    font-weight: 800;
                    cursor: pointer;
                    white-space: nowrap;
                    transition: all 0.2s;
                }
                .ll-round-pill:hover {
                    color: #FFFFFF;
                    border-color: rgba(255, 255, 255, 0.25);
                }
                .ll-round-pill.active {
                    background: #0284C7;
                    border-color: #38BDF8;
                    color: #FFFFFF;
                    box-shadow: 0 4px 14px rgba(56, 189, 248, 0.35);
                }

                .ll-matches-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
                    gap: 16px;
                }
                .ll-match-card {
                    background: rgba(30, 41, 59, 0.75);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 14px;
                    padding: 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    transition: transform 0.2s;
                }
                .ll-match-card:hover {
                    transform: translateY(-2px);
                    border-color: rgba(56, 189, 248, 0.35);
                }
                .ll-match-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    font-size: 0.82rem;
                    font-weight: 800;
                    color: #38BDF8;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
                    padding-bottom: 8px;
                }
                .ll-team-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 8px 10px;
                    border-radius: 10px;
                    background: rgba(15, 23, 42, 0.5);
                    transition: background 0.2s;
                }
                .ll-team-row.winner {
                    background: rgba(16, 185, 129, 0.12);
                    border: 1px solid rgba(16, 185, 129, 0.35);
                }
                .ll-team-names {
                    font-size: 0.9rem;
                    font-weight: 700;
                    color: #F1F5F9;
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                    flex: 1;
                    min-width: 0;
                    word-break: break-word;
                }
                .ll-team-subtag {
                    font-size: 0.72rem;
                    font-weight: 700;
                }
                .ll-team-subtag.up {
                    color: #10B981;
                }
                .ll-team-subtag.down {
                    color: #F59E0B;
                }
                .ll-team-score {
                    font-size: 1.4rem;
                    font-weight: 900;
                    color: #FFFFFF;
                    min-width: 34px;
                    text-align: right;
                    flex-shrink: 0;
                    margin-left: 10px;
                }

                /* Step-By-Step Box */
                .ll-step-box {
                    background: linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95));
                    border: 1px solid rgba(204, 255, 0, 0.3);
                    border-radius: 16px;
                    padding: 20px;
                    margin-bottom: 24px;
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
                }
                .ll-step-progress-bar {
                    height: 8px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 4px;
                    overflow: hidden;
                    margin: 14px 0 18px 0;
                }
                .ll-step-progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #38BDF8, #CCFF00);
                    transition: width 0.3s ease;
                }

                /* Golden Rules Traffic Lights */
                .ll-score-overview {
                    display: flex;
                    flex-wrap: wrap;
                    align-items: center;
                    justify-content: space-between;
                    gap: 20px;
                    background: linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95));
                    border: 1px solid rgba(255, 255, 255, 0.12);
                    border-radius: 18px;
                    padding: 24px 28px;
                    margin-bottom: 24px;
                }
                .ll-big-score {
                    display: flex;
                    align-items: baseline;
                    gap: 6px;
                }
                .ll-big-score-number {
                    font-size: 3.5rem;
                    font-weight: 950;
                    line-height: 1;
                }
                .ll-big-score-number.healthy {
                    color: #CCFF00;
                    text-shadow: 0 0 24px rgba(204, 255, 0, 0.4);
                }
                .ll-big-score-number.warning {
                    color: #F59E0B;
                    text-shadow: 0 0 24px rgba(245, 158, 11, 0.4);
                }
                .ll-big-score-number.danger {
                    color: #EF4444;
                    text-shadow: 0 0 24px rgba(239, 68, 68, 0.4);
                }
                .ll-big-score-max {
                    font-size: 1.4rem;
                    font-weight: 800;
                    color: #64748B;
                }

                .ll-rules-stack {
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                }
                .ll-rule-card {
                    background: rgba(30, 41, 59, 0.7);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 14px;
                    padding: 18px 22px;
                    transition: all 0.2s;
                }
                .ll-rule-card.passed {
                    border-left: 5px solid #10B981;
                }
                .ll-rule-card.warning {
                    border-left: 5px solid #F59E0B;
                }
                .ll-rule-card.failed {
                    border-left: 5px solid #EF4444;
                }
                .ll-rule-head {
                    display: flex;
                    flex-wrap: wrap;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                    margin-bottom: 10px;
                }
                .ll-rule-name {
                    font-size: 1.05rem;
                    font-weight: 800;
                    color: #FFFFFF;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .ll-rule-badge {
                    padding: 4px 12px;
                    border-radius: 9999px;
                    font-size: 0.78rem;
                    font-weight: 900;
                    letter-spacing: 0.03em;
                }
                .ll-rule-badge.green {
                    background: rgba(16, 185, 129, 0.15);
                    border: 1px solid rgba(16, 185, 129, 0.4);
                    color: #10B981;
                }
                .ll-rule-badge.amber {
                    background: rgba(245, 158, 11, 0.15);
                    border: 1px solid rgba(245, 158, 11, 0.4);
                    color: #F59E0B;
                }
                .ll-rule-badge.red {
                    background: rgba(239, 68, 68, 0.15);
                    border: 1px solid rgba(239, 68, 68, 0.4);
                    color: #EF4444;
                }
                .ll-rule-bar {
                    height: 6px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 3px;
                    overflow: hidden;
                    margin-bottom: 10px;
                }
                .ll-rule-bar-fill {
                    height: 100%;
                    border-radius: 3px;
                }
                .ll-rule-bar-fill.green {
                    background: linear-gradient(90deg, #10B981, #CCFF00);
                }
                .ll-rule-bar-fill.amber {
                    background: linear-gradient(90deg, #F59E0B, #FBBF24);
                }
                .ll-rule-bar-fill.red {
                    background: linear-gradient(90deg, #DC2626, #EF4444);
                }
                .ll-rule-desc {
                    font-size: 0.88rem;
                    color: #CBD5E1;
                    line-height: 1.4;
                }
                .ll-rule-warnings {
                    margin-top: 12px;
                    padding-top: 10px;
                    border-top: 1px dashed rgba(255, 255, 255, 0.1);
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                .ll-warning-item {
                    font-size: 0.8rem;
                    color: #FCA5A5;
                    display: flex;
                    align-items: flex-start;
                    gap: 6px;
                }

                /* Recommendations Box */
                .ll-recommendations-box {
                    background: linear-gradient(135deg, rgba(88, 28, 135, 0.25), rgba(15, 23, 42, 0.9));
                    border: 1px solid rgba(139, 92, 246, 0.35);
                    border-radius: 16px;
                    padding: 22px;
                    margin-top: 20px;
                }
                .ll-recommendation-item {
                    font-size: 0.9rem;
                    color: #E2E8F0;
                    padding: 8px 12px;
                    background: rgba(255, 255, 255, 0.04);
                    border-radius: 8px;
                    margin-bottom: 8px;
                    line-height: 1.4;
                }

                /* Self-Test Benchmarks Table */
                .ll-test-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 14px;
                }
                .ll-test-table th {
                    text-align: left;
                    font-size: 0.78rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                    color: #94A3B8;
                    padding: 12px 14px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }
                .ll-test-table td {
                    padding: 14px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                    font-size: 0.9rem;
                    color: #F1F5F9;
                }
                .ll-test-table tr:hover td {
                    background: rgba(255, 255, 255, 0.03);
                }

                /* Responsive */
                @media (max-width: 768px) {
                    .ll-header { padding: 18px 16px; }
                    .ll-title-group h1 { font-size: 1.35rem; }
                    .ll-subnav { gap: 6px; }
                    .ll-tab-btn { min-width: 140px; font-size: 0.82rem; padding: 10px 12px; }
                    .ll-card { padding: 18px 16px; }
                    .ll-big-score-number { font-size: 2.8rem; }
                }
            `;
            document.head.appendChild(style);
        }

        /**
         * Renderiza la cabecera principal con telemetría de motor
         * @private
         */
        _renderHeaderHtml() {
            return `
                <div class="ll-header">
                    <div class="ll-header-top">
                        <div class="ll-title-group">
                            <h1>
                                <span>🧪</span> CENTRO DE CONTROL & AUDITORÍA DE LÓGICA
                            </h1>
                            <p>Simulación multimodal en vivo, auditoría de las 5 Reglas de Oro y diagnóstico algorítmico de Americanas y Entrenos</p>
                        </div>
                        <div class="ll-engine-badge" id="ll-engine-status-badge">
                            <span class="ll-pulse-dot"></span>
                            <span>MOTOR 100% OPERATIVO</span>
                        </div>
                    </div>
                </div>
            `;
        }

        /**
         * Renderiza la barra de pestañas (Sub-nav)
         * @private
         */
        _renderSubNavHtml() {
            const tabs = [
                { id: 'simulator', label: '🎮 Simulador Multimodal', class: '' },
                { id: 'rules_scanner', label: '🛡️ Escáner de 5 Reglas de Oro', class: 'rules' },
                { id: 'real_diagnosis', label: '🔍 Diagnóstico de Eventos Reales', class: 'real' },
                { id: 'self_test', label: '⚡ Self-Test Algorítmico', class: 'selftest' }
            ];

            return `
                <nav class="ll-subnav" aria-label="Auditoría de Lógica Tabs">
                    ${tabs.map(t => `
                        <button type="button" 
                                class="ll-tab-btn ${this.activeTab === t.id ? `active ${t.class}` : ''}" 
                                data-tab="${t.id}"
                                onclick="window.AdminTournamentLogicLab.switchTab('${t.id}')">
                            ${t.label}
                        </button>
                    `).join('')}
                </nav>
            `;
        }

        /**
         * Cambia de pestaña activa y re-renderiza el contenido correspondiente
         * @param {string} tabName 
         */
        switchTab(tabName) {
            this.activeTab = tabName;

            // Actualizar botones de pestaña
            const tabButtons = this.container.querySelectorAll('.ll-tab-btn');
            tabButtons.forEach(btn => {
                const target = btn.getAttribute('data-tab');
                btn.className = `ll-tab-btn ${target === tabName ? `active ${target === 'rules_scanner' ? 'rules' : target === 'real_diagnosis' ? 'real' : target === 'self_test' ? 'selftest' : ''}` : ''}`;
            });

            // Re-renderizar contenido de pestaña
            const contentContainer = document.getElementById('logic-lab-tab-container');
            if (contentContainer) {
                contentContainer.innerHTML = this._renderActiveTabContent();
                this._setupTabListeners();
            }

            // Si entra a self-test por primera vez, ejecutarlo automáticamente
            if (tabName === 'self_test' && !this.lastSelfTestResult && !this.runningSelfTest) {
                this.executeSelfTest();
            }

            // Si entra a diagnóstico real y no se han cargado eventos, cargarlos
            if (tabName === 'real_diagnosis' && this.realEventsList.length === 0 && !this.loadingRealEvents) {
                this.fetchRealEvents();
            }
        }

        /**
         * Retorna el HTML de la pestaña activa
         * @private
         */
        _renderActiveTabContent() {
            switch (this.activeTab) {
                case 'simulator':
                    return this._renderSimulatorTab();
                case 'rules_scanner':
                    return this._renderRulesScannerTab();
                case 'real_diagnosis':
                    return this._renderRealDiagnosisTab();
                case 'self_test':
                    return this._renderSelfTestTab();
                default:
                    return this._renderSimulatorTab();
            }
        }

        // =========================================================================
        // PESTAÑA 1: SIMULADOR MULTIMODAL EN VIVO
        // =========================================================================

        _renderSimulatorTab() {
            const sim = this.lastSimulation;
            const roundView = this.selectedRoundView;
            const isEntreno = this.simEventType === 'entreno';

            return `
                <!-- Panel de Configuración y Disparo de Simulación -->
                <div class="ll-card">
                    <div class="ll-card-header">
                        <div>
                            <h2 class="ll-card-title">🎮 Laboratorio de Simulación Multimodal</h2>
                            <div class="ll-card-subtitle">Configura los parámetros del evento ficticio y ejecuta el motor en vivo en memoria</div>
                        </div>
                        <div style="font-size: 0.8rem; color: #38BDF8; font-weight: 700; display: flex; align-items: center; gap: 6px;">
                            <i class="fas fa-microchip"></i> Motor en memoria zero-delay
                        </div>
                    </div>

                    <div class="ll-controls-grid">
                        <!-- a) Selector de Tipo de Evento Ficticio -->
                        <div class="ll-form-group">
                            <label class="ll-form-label" for="ll-sim-event-type">Tipo de Evento Ficticio</label>
                            <select id="ll-sim-event-type" class="ll-select" onchange="window.AdminTournamentLogicLab.onSimEventTypeChange(this.value)">
                                <option value="americana" ${this.simEventType === 'americana' ? 'selected' : ''}>🏆 Americana (Competición Oficial)</option>
                                <option value="entreno" ${this.simEventType === 'entreno' ? 'selected' : ''}>🎾 Entreno (Sesión Formativa & Pozo)</option>
                            </select>
                        </div>

                        <!-- b) Selector de Fuente de Jugadores -->
                        <div class="ll-form-group">
                            <label class="ll-form-label" for="ll-sim-players-source">Fuente de Jugadores</label>
                            <select id="ll-sim-players-source" class="ll-select" onchange="window.AdminTournamentLogicLab.onSimPlayersSourceChange(this.value)">
                                <option value="real" ${this.simPlayersSource === 'real' ? 'selected' : ''}>👥 Jugadores Reales del Club (BD Firestore)</option>
                                <option value="pro" ${this.simPlayersSource === 'pro' ? 'selected' : ''}>⭐ Jugadores Profesionales (WPT / Premier Padel)</option>
                            </select>
                        </div>

                        <!-- c) Selector de Modalidad -->
                        <div class="ll-form-group">
                            <label class="ll-form-label" for="ll-sim-mode">Modalidad de Competición</label>
                            <select id="ll-sim-mode" class="ll-select" onchange="window.AdminTournamentLogicLab.onModeChange(this.value)">
                                <option value="twister" ${this.simMode === 'twister' ? 'selected' : ''}>Twister Individual (Pozo rotativo)</option>
                                <option value="fixed" ${this.simMode === 'fixed' ? 'selected' : ''}>Parejas Fijas</option>
                                <option value="swiss" ${this.simMode === 'swiss' ? 'selected' : ''}>Sistema Suizo (Por Clasificación)</option>
                            </select>
                        </div>

                        <!-- d) Selector de Número de Pistas -->
                        <div class="ll-form-group">
                            <label class="ll-form-label" for="ll-sim-courts">Número de Pistas</label>
                            <select id="ll-sim-courts" class="ll-select" onchange="window.AdminTournamentLogicLab.onCourtsChange(this.value)">
                                <option value="3" ${this.simCourts === 3 ? 'selected' : ''}>3 Pistas (12 jugadores)</option>
                                <option value="4" ${this.simCourts === 4 ? 'selected' : ''}>4 Pistas (16 jugadores)</option>
                                <option value="5" ${this.simCourts === 5 ? 'selected' : ''}>5 Pistas (20 jugadores)</option>
                                <option value="6" ${this.simCourts === 6 ? 'selected' : ''}>6 Pistas (24 jugadores)</option>
                                <option value="7" ${this.simCourts === 7 ? 'selected' : ''}>7 Pistas (28 jugadores)</option>
                                <option value="8" ${this.simCourts === 8 ? 'selected' : ''}>8 Pistas (32 jugadores)</option>
                                <option value="9" ${this.simCourts === 9 ? 'selected' : ''}>9 Pistas (36 jugadores)</option>
                                <option value="10" ${this.simCourts === 10 ? 'selected' : ''}>10 Pistas (40 jugadores)</option>
                            </select>
                        </div>

                        <!-- Rondas Oficiales -->
                        <div class="ll-form-group">
                            <label class="ll-form-label">Rondas Oficiales</label>
                            <input type="text" class="ll-input" value="6 Rondas (Estándar Oficial)" disabled style="opacity: 0.8; cursor: not-allowed;">
                        </div>
                    </div>

                    <div class="ll-btn-actions">
                        <button type="button" class="ll-btn ll-btn-primary" onclick="window.AdminTournamentLogicLab.executeTurboSimulation()">
                            <i class="fas fa-bolt"></i> SIMULACIÓN TURBO (6 RONDAS)
                        </button>
                        <button type="button" class="ll-btn ll-btn-neon" onclick="window.AdminTournamentLogicLab.toggleStepByStep()">
                            <i class="fas ${this.stepState.active ? 'fa-pause' : 'fa-play'}"></i> 
                            ${this.stepState.active ? 'CONTINUAR PASO A PASO' : 'SIMULACIÓN PASO A PASO'}
                        </button>
                        ${sim ? `
                            <button type="button" class="ll-btn ll-btn-outline" onclick="window.AdminTournamentLogicLab.auditCurrentSimulation()">
                                <i class="fas fa-shield-alt" style="color: #CCFF00;"></i> Auditar esta simulación con las 5 Reglas
                            </button>
                        ` : ''}
                    </div>
                </div>

                <!-- Barra de Acción: Cargar Simulación desde un Evento Real (Americana o Entreno existente) -->
                <div class="ll-clone-card">
                    <div class="ll-clone-header">
                        <div class="ll-clone-info">
                            <span class="ll-clone-icon"><i class="fas fa-copy"></i></span>
                            <div>
                                <h3 class="ll-clone-title">📂 Cargar Simulación desde un Evento Real</h3>
                                <p class="ll-clone-subtitle">Clona participantes y parámetros de una Americana o Entreno real existente para simular en memoria sin alterar la base de datos.</p>
                            </div>
                        </div>
                        ${this.simClonedFrom ? `
                            <div class="ll-cloned-badge-group">
                                <span class="ll-telemetry-badge cloned">
                                    <i class="fas fa-check-circle"></i> Activo: ${this.simClonedFrom.name}
                                </span>
                                <button type="button" class="ll-btn-unlink" onclick="window.AdminTournamentLogicLab.unlinkClonedEvent()">
                                    <i class="fas fa-xmark"></i> Desvincular
                                </button>
                            </div>
                        ` : ''}
                    </div>

                    <div class="ll-clone-controls">
                        <div class="ll-form-group" style="min-width: 170px; max-width: 210px;">
                            <label class="ll-form-label" for="ll-clone-type-filter">Colección Real</label>
                            <select id="ll-clone-type-filter" class="ll-select" onchange="window.AdminTournamentLogicLab.onCloneTypeFilterChange(this.value)">
                                <option value="americana" ${this.simCloneEventType === 'americana' ? 'selected' : ''}>🏆 Americanas</option>
                                <option value="entreno" ${this.simCloneEventType === 'entreno' ? 'selected' : ''}>🎾 Entrenos</option>
                            </select>
                        </div>

                        <div class="ll-form-group" style="flex: 1; min-width: 260px;">
                            <label class="ll-form-label" for="ll-clone-event-select">Seleccionar Evento Existente</label>
                            <select id="ll-clone-event-select" class="ll-select">
                                ${this.loadingSimCloneEvents ? `
                                    <option value="">Cargando eventos desde la BD...</option>
                                ` : (this.simCloneEventsList.length === 0 ? `
                                    <option value="">No hay eventos disponibles en esta colección</option>
                                ` : this.simCloneEventsList.map(ev => `
                                    <option value="${ev.id}">
                                        ${ev.name || 'Sin título'} (${ev.date || 'Fecha n/d'}) - ${ev.status || 'finalizado'} [${ev.num_courts || 4} pistas]
                                    </option>
                                `).join(''))}
                            </select>
                        </div>

                        <div class="ll-clone-btn-group">
                            <button type="button" class="ll-btn ll-btn-clone" onclick="window.AdminTournamentLogicLab.cloneSelectedRealEvent()">
                                <i class="fas fa-folder-open"></i> Clonar & Simular Ficticiamente (Sin tocar la BD)
                            </button>
                            <button type="button" class="ll-btn ll-btn-outline" style="padding: 10px 14px;" onclick="window.AdminTournamentLogicLab.refreshCloneEvents()" title="Refrescar lista de eventos">
                                <i class="fas fa-rotate"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Panel de Simulación Paso a Paso (si está activo) -->
                ${this.stepState.active ? this._renderStepByStepBox() : ''}

                <!-- Métricas de Telemetría Resultante -->
                ${sim ? `
                    <!-- Badges Identificadores en la Telemetría -->
                    <div class="ll-telemetry-badge-bar">
                        <span class="ll-telemetry-badge ${isEntreno ? 'entreno' : 'americana'}">
                            ${isEntreno ? '🎾 ENTRENO' : '🏆 AMERICANA'}
                        </span>
                        <span class="ll-telemetry-badge ${this.simPlayersSource === 'pro' ? 'pro' : 'real'}">
                            ${this.simPlayersSource === 'pro' ? '⭐ ESTRELLAS PRO' : '👥 JUGADORES REALES (BD)'}
                        </span>
                        ${this.simClonedFrom ? `
                            <span class="ll-telemetry-badge cloned">
                                📂 Basado en: ${this.simClonedFrom.name || this.simClonedFrom.id} (Ficticio)
                            </span>
                        ` : ''}
                    </div>

                    <div class="ll-kpi-grid">
                        <div class="ll-kpi-card">
                            <span class="ll-kpi-label">Tiempo de Cómputo</span>
                            <span class="ll-kpi-value" style="color: #38BDF8;">${sim.executionTimeMs} <span style="font-size: 0.9rem;">ms</span></span>
                            <span class="ll-kpi-badge">Velocidad Ultra-Rápida</span>
                        </div>
                        <div class="ll-kpi-card">
                            <span class="ll-kpi-label">Partidos Generados</span>
                            <span class="ll-kpi-value" style="color: #CCFF00;">${sim.allMatches.length}</span>
                            <span class="ll-kpi-badge">100% Finalizados</span>
                        </div>
                        <div class="ll-kpi-card">
                            <span class="ll-kpi-label">Juegos Totales Disputados</span>
                            <span class="ll-kpi-value">${sim.allMatches.reduce((acc, m) => acc + (m.score_a || 0) + (m.score_b || 0), 0)}</span>
                            <span class="ll-kpi-badge">Balance Simétrico</span>
                        </div>
                        <div class="ll-kpi-card">
                            <span class="ll-kpi-label">Participantes Activos</span>
                            <span class="ll-kpi-value" style="color: #A78BFA;">${sim.mode === 'fixed' ? (sim.pairs.length + ' duplas') : (sim.players.length + ' jug.')}</span>
                            <span class="ll-kpi-badge">${this.simPlayersSource === 'pro' ? 'Estrellas Pro' : 'Socios Reales'}</span>
                        </div>
                    </div>

                    <!-- Podio de Honor / Cuadro de Rendimiento -->
                    <div class="ll-card">
                        <div class="ll-card-header">
                            <div>
                                <h3 class="ll-card-title">
                                    ${isEntreno ? '🎾 Cuadro de Rendimiento del Entreno' : '🏆 Podio de Honor de la Americana'}
                                </h3>
                                <div class="ll-card-subtitle">
                                    ${isEntreno 
                                        ? 'Evaluación de progreso formativo, diferenciales de juego y consistencia en pista' 
                                        : 'Clasificación final calculada por victorias, diferencial de juegos y puntos'}
                                </div>
                            </div>
                        </div>

                        <div class="ll-podium-grid">
                            ${this._renderPodiumCards(sim.standings)}
                        </div>
                    </div>

                    <!-- Visualizador de Rondas y Partidos en Detalle -->
                    <div class="ll-card">
                        <div class="ll-card-header">
                            <div>
                                <h3 class="ll-card-title">
                                    ${isEntreno ? '🎾 Actas & Partidos del Entreno' : '🏆 Actas & Partidos de la Americana'}
                                </h3>
                                <div class="ll-card-subtitle">Inspecciona los enfrentamientos, parejas formadas y movimientos de pista</div>
                            </div>

                            <!-- Selector de Rondas R1 a R6 -->
                            <div class="ll-rounds-nav">
                                ${(sim.roundsDetail || []).map(rd => `
                                    <button type="button" 
                                            class="ll-round-pill ${roundView === rd.round ? 'active' : ''}"
                                            onclick="window.AdminTournamentLogicLab.selectRoundView(${rd.round})">
                                        Ronda ${rd.round}
                                    </button>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Parrilla de Partidos de la Ronda Seleccionada -->
                        <div class="ll-matches-grid">
                            ${this._renderRoundMatches(sim, roundView)}
                        </div>
                    </div>
                ` : `
                    <div class="ll-card" style="text-align: center; padding: 48px 24px;">
                        <i class="fas fa-play-circle" style="font-size: 3rem; color: #38BDF8; margin-bottom: 16px; opacity: 0.8;"></i>
                        <h3 style="color: #FFF; margin: 0 0 8px 0;">Pulsa en "Simulación Turbo" para comenzar</h3>
                        <p style="color: #94A3B8; max-width: 500px; margin: 0 auto;">
                            El motor generará en milisegundos un torneo completo de 6 rondas, calculando emparejamientos, movimientos de pozo y actas reales.
                        </p>
                    </div>
                `}
            `;
        }

        /**
         * Renderiza el bloque interactivo de simulación paso a paso
         * @private
         */
        _renderStepByStepBox() {
            const step = this.stepState;
            const progressPct = Math.round((step.currentRound / step.maxRounds) * 100);

            return `
                <div class="ll-step-box">
                    <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
                        <div>
                            <span style="background: rgba(204, 255, 0, 0.2); color: #CCFF00; font-size: 0.72rem; font-weight: 900; padding: 3px 10px; border-radius: 6px; letter-spacing: 0.05em;">
                                MODO PASO A PASO ACTIVO
                            </span>
                            <h3 style="color: #FFF; margin: 6px 0 0 0; font-size: 1.15rem;">
                                Ronda Actual: ${step.currentRound} de ${step.maxRounds}
                            </h3>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            ${step.currentRound < step.maxRounds ? `
                                <button type="button" class="ll-btn ll-btn-neon" onclick="window.AdminTournamentLogicLab.nextStepRound()">
                                    <i class="fas fa-forward-step"></i> Ejecutar Ronda ${step.currentRound + 1}
                                </button>
                            ` : `
                                <span style="color: #CCFF00; font-weight: 800; display: inline-flex; align-items: center; gap: 6px;">
                                    <i class="fas fa-check-circle"></i> 6 Rondas Completadas
                                </span>
                            `}
                            <button type="button" class="ll-btn ll-btn-outline" onclick="window.AdminTournamentLogicLab.resetStepByStep()">
                                <i class="fas fa-rotate-left"></i> Reiniciar
                            </button>
                        </div>
                    </div>

                    <div class="ll-step-progress-bar">
                        <div class="ll-step-progress-fill" style="width: ${progressPct}%;"></div>
                    </div>

                    <div style="font-size: 0.86rem; color: #CBD5E1; line-height: 1.4;">
                        ${step.currentRound === 0 
                            ? 'Pistas iniciales asignadas. Haz clic en <strong>"Ejecutar Ronda 1"</strong> para disputar los primeros partidos.' 
                            : `Ronda ${step.currentRound} completada. Los ganadores ascienden de pista (▲ Pista c-1) y los perdedores descienden (▼ Pista c+1).`
                        }
                    </div>
                </div>
            `;
        }

        /**
         * Renderiza las 3 tarjetas del Podio de Honor o Cuadro de Rendimiento
         * @private
         */
        _renderPodiumCards(standings = []) {
            if (!standings || standings.length === 0) return '<p>Sin clasificación disponible</p>';

            const isEntreno = this.simEventType === 'entreno';
            const top3 = standings.slice(0, 3);
            const classes = ['gold', 'silver', 'bronze'];
            const medals = isEntreno ? ['🌟', '🥈', '🥉'] : ['🥇', '🥈', '🥉'];
            const titles = isEntreno 
                ? ['MVP DE LA SESIÓN', 'TOP RENDIMIENTO', '3º PUESTO'] 
                : ['CAMPEÓN', 'SUBCAMPEÓN', '3º PUESTO'];

            return top3.map((item, index) => `
                <div class="ll-podium-card ${classes[index]}">
                    <div class="ll-podium-rank">
                        <span>${medals[index]} ${titles[index]}</span>
                        <span style="font-size: 1rem; color: #94A3B8;">#${item.position}</span>
                    </div>
                    <div class="ll-podium-name">${item.name}</div>
                    <div class="ll-podium-stats">
                        <span class="ll-podium-stat-pill"><strong>${item.matches_won}</strong> PG / ${item.matches_played} PJ</span>
                        <span class="ll-podium-stat-pill"><strong>${item.games_won}</strong> Dif: ${item.games_diff > 0 ? '+' : ''}${item.games_diff}</span>
                        <span class="ll-podium-stat-pill" style="color: #CCFF00;"><strong>${item.points}</strong> pts</span>
                    </div>
                </div>
            `).join('');
        }

        /**
         * Renderiza los partidos de la ronda seleccionada
         * @private
         */
        _renderRoundMatches(sim, roundNum) {
            const rd = (sim.roundsDetail || []).find(r => r.round === roundNum);
            if (!rd || !rd.matches || rd.matches.length === 0) {
                return '<div style="color: #94A3B8; padding: 20px;">No hay actas registradas para esta ronda.</div>';
            }

            return rd.matches.map(m => {
                const isWinA = (m.score_a || 0) > (m.score_b || 0);
                const isWinB = (m.score_b || 0) > (m.score_a || 0);

                const teamANames = Array.isArray(m.team_a_names) ? m.team_a_names.join(' & ') : 'Equipo A';
                const teamBNames = Array.isArray(m.team_b_names) ? m.team_b_names.join(' & ') : 'Equipo B';

                const courtNum = m.court;
                const isTopCourt = courtNum === 1;
                const isBottomCourt = courtNum === sim.numCourts;

                const tagA = isWinA 
                    ? (isTopCourt ? '👑 REYES DE PISTA 1 (Mantiene)' : `▲ ASCIENDE A PISTA ${courtNum - 1}`)
                    : (isBottomCourt ? '🔻 FONDO DE PISTA (Mantiene)' : `▼ DESCIENDE A PISTA ${courtNum + 1}`);

                const tagB = isWinB 
                    ? (isTopCourt ? '👑 REYES DE PISTA 1 (Mantiene)' : `▲ ASCIENDE A PISTA ${courtNum - 1}`)
                    : (isBottomCourt ? '🔻 FONDO DE PISTA (Mantiene)' : `▼ DESCIENDE A PISTA ${courtNum + 1}`);

                return `
                    <div class="ll-match-card">
                        <div class="ll-match-header">
                            <span><i class="fas fa-table-tennis-paddle-ball"></i> PISTA ${m.court} ${isTopCourt ? '🌟 (Central)' : ''}</span>
                            <span style="color: #10B981;"><i class="fas fa-check-circle"></i> Acta Verificada</span>
                        </div>

                        <!-- Equipo A -->
                        <div class="ll-team-row ${isWinA ? 'winner' : ''}">
                            <div class="ll-team-names">
                                <span>${teamANames}</span>
                                <span class="ll-team-subtag ${isWinA ? 'up' : 'down'}">${tagA}</span>
                            </div>
                            <div class="ll-team-score" style="color: ${isWinA ? '#CCFF00' : '#94A3B8'};">${m.score_a}</div>
                        </div>

                        <!-- Equipo B -->
                        <div class="ll-team-row ${isWinB ? 'winner' : ''}">
                            <div class="ll-team-names">
                                <span>${teamBNames}</span>
                                <span class="ll-team-subtag ${isWinB ? 'up' : 'down'}">${tagB}</span>
                            </div>
                            <div class="ll-team-score" style="color: ${isWinB ? '#CCFF00' : '#94A3B8'};">${m.score_b}</div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // =========================================================================
        // PESTAÑA 2: ESCÁNER DE LAS 5 REGLAS DE ORO
        // =========================================================================

        _renderRulesScannerTab() {
            const audit = this.lastAuditResult;

            return `
                <div class="ll-card">
                    <div class="ll-card-header">
                        <div>
                            <h2 class="ll-card-title">🛡️ Escáner Integral de las 5 Reglas de Oro</h2>
                            <div class="ll-card-subtitle">Auditoría algorítmica de integridad, dinámica de pozo, rotación y equidad de actas</div>
                        </div>
                        <div style="font-size: 0.82rem; color: #94A3B8;">
                            Fuente: <strong style="color: #F8FAFC;">${this.lastAuditSource}</strong>
                        </div>
                    </div>

                    <div class="ll-btn-actions" style="margin-bottom: 20px;">
                        <button type="button" class="ll-btn ll-btn-primary" onclick="window.AdminTournamentLogicLab.auditLastSimulationQuick()">
                            <i class="fas fa-rotate"></i> Auditar Última Simulación
                        </button>
                        <button type="button" class="ll-btn ll-btn-neon" onclick="window.AdminTournamentLogicLab.runStressBenchmarkAudit('twister')">
                            <i class="fas fa-vial"></i> Simular & Auditar Twister 4 Pistas
                        </button>
                        <button type="button" class="ll-btn ll-btn-outline" onclick="window.AdminTournamentLogicLab.runStressBenchmarkAudit('fixed')">
                            <i class="fas fa-users"></i> Simular & Auditar Parejas Fijas
                        </button>
                    </div>

                    ${audit ? `
                        <!-- Resumen Global de Salud Algorítmica -->
                        <div class="ll-score-overview">
                            <div>
                                <span style="font-size: 0.8rem; text-transform: uppercase; font-weight: 800; letter-spacing: 0.05em; color: #94A3B8;">
                                    Health Score General
                                </span>
                                <div class="ll-big-score">
                                    <span class="ll-big-score-number ${audit.overallScore >= 85 ? 'healthy' : audit.overallScore >= 60 ? 'warning' : 'danger'}">
                                        ${audit.overallScore}
                                    </span>
                                    <span class="ll-big-score-max">/ 100</span>
                                </div>
                                <div style="margin-top: 6px;">
                                    <span class="ll-rule-badge ${audit.isHealthy ? 'green' : 'amber'}">
                                        ${audit.isHealthy ? '● SISTEMA SALUDABLE & SIN RIESGOS' : '⚠️ ATENCIÓN: INCIDENCIAS LOCALIZADAS'}
                                    </span>
                                </div>
                            </div>

                            <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                                <div style="display: flex; flex-direction: column;">
                                    <span style="font-size: 0.76rem; color: #94A3B8; text-transform: uppercase; font-weight: 700;">Partidos Auditados</span>
                                    <span style="font-size: 1.5rem; font-weight: 900; color: #FFF;">${audit.totalMatches}</span>
                                </div>
                                <div style="display: flex; flex-direction: column;">
                                    <span style="font-size: 0.76rem; color: #94A3B8; text-transform: uppercase; font-weight: 700;">Rondas Analizadas</span>
                                    <span style="font-size: 1.5rem; font-weight: 900; color: #FFF;">${audit.totalRounds}</span>
                                </div>
                                <div style="display: flex; flex-direction: column;">
                                    <span style="font-size: 0.76rem; color: #94A3B8; text-transform: uppercase; font-weight: 700;">Incidencias Halladas</span>
                                    <span style="font-size: 1.5rem; font-weight: 900; color: ${audit.issuesFound.length === 0 ? '#10B981' : '#EF4444'};">
                                        ${audit.issuesFound.length}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <!-- Tarjetas Semáforo de las 5 Reglas Críticas -->
                        <div class="ll-rules-stack">
                            ${(audit.rules || []).map(r => this._renderRuleCard(r)).join('')}
                        </div>
                    ` : `
                        <div style="text-align: center; padding: 40px; color: #94A3B8;">
                            <i class="fas fa-shield-virus" style="font-size: 2.5rem; color: #CCFF00; margin-bottom: 14px;"></i>
                            <h3 style="color: #FFF; margin: 0 0 8px 0;">No hay resultados de auditoría en memoria</h3>
                            <p style="margin: 0;">Selecciona una de las acciones superiores para auditar un conjunto de partidos.</p>
                        </div>
                    `}
                </div>
            `;
        }

        /**
         * Renderiza una tarjeta de regla individual con formato semáforo
         * @private
         */
        _renderRuleCard(rule) {
            const isGreen = rule.score >= 85;
            const isAmber = rule.score >= 60 && rule.score < 85;
            const statusClass = isGreen ? 'green' : isAmber ? 'amber' : 'red';
            const cardState = isGreen ? 'passed' : isAmber ? 'warning' : 'failed';

            const ruleIcons = {
                'RULE_POZO_MOVEMENT': 'fa-arrows-up-down',
                'RULE_NO_PARTNER_REPEAT': 'fa-user-group',
                'RULE_SCORE_INTEGRITY': 'fa-calculator',
                'RULE_COURT_EQUITY': 'fa-table-tennis-paddle-ball',
                'RULE_ROUND_CONSISTENCY': 'fa-clock-rotate-left'
            };

            const iconClass = ruleIcons[rule.id] || 'fa-check';

            return `
                <div class="ll-rule-card ${cardState}">
                    <div class="ll-rule-head">
                        <div class="ll-rule-name">
                            <i class="fas ${iconClass}" style="color: ${isGreen ? '#10B981' : isAmber ? '#F59E0B' : '#EF4444'};"></i>
                            <span>${rule.name}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 1.15rem; font-weight: 900; color: #FFF;">${rule.score}%</span>
                            <span class="ll-rule-badge ${statusClass}">
                                ${rule.passed ? 'CUMPLIDA ✅' : 'REVISIÓN REQUERIDA ⚠️'}
                            </span>
                        </div>
                    </div>

                    <div class="ll-rule-bar">
                        <div class="ll-rule-bar-fill ${statusClass}" style="width: ${rule.score}%;"></div>
                    </div>

                    <div class="ll-rule-desc">
                        ${rule.details}
                    </div>

                    ${(rule.warnings && rule.warnings.length > 0) ? `
                        <div class="ll-rule-warnings">
                            <strong style="font-size: 0.76rem; text-transform: uppercase; color: #FCA5A5; letter-spacing: 0.05em;">
                                Desglose de Avisos Detectados (${rule.warnings.length}):
                            </strong>
                            ${rule.warnings.map(w => `
                                <div class="ll-warning-item">
                                    <i class="fas fa-triangle-exclamation"></i>
                                    <span>${w}</span>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        }

        // =========================================================================
        // PESTAÑA 3: DIAGNÓSTICO DE EVENTOS REALES
        // =========================================================================

        _renderRealDiagnosisTab() {
            const diag = this.lastRealDiagnosis;

            return `
                <div class="ll-card">
                    <div class="ll-card-header">
                        <div>
                            <h2 class="ll-card-title">🔍 Diagnóstico de Eventos Reales</h2>
                            <div class="ll-card-subtitle">Inspección de actas, emparejamientos y consistencia de torneos reales de la base de datos</div>
                        </div>
                    </div>

                    <div class="ll-controls-grid">
                        <div class="ll-form-group">
                            <label class="ll-form-label" for="ll-real-type">Tipo de Evento</label>
                            <select id="ll-real-type" class="ll-select" onchange="window.AdminTournamentLogicLab.onRealTypeChange(this.value)">
                                <option value="americana" ${this.realEventType === 'americana' ? 'selected' : ''}>Americanas de Competición</option>
                                <option value="entreno" ${this.realEventType === 'entreno' ? 'selected' : ''}>Entrenos & Clínics</option>
                            </select>
                        </div>

                        <div class="ll-form-group" style="grid-column: span 2;">
                            <label class="ll-form-label" for="ll-real-event-select">Seleccionar Evento para Auditar</label>
                            <select id="ll-real-event-select" class="ll-select">
                                ${this.loadingRealEvents ? `
                                    <option value="">Cargando eventos desde Firebase...</option>
                                ` : this.realEventsList.length === 0 ? `
                                    <option value="">No hay eventos disponibles</option>
                                ` : this.realEventsList.map(ev => `
                                    <option value="${ev.id}" ${this.selectedRealEventId === ev.id ? 'selected' : ''}>
                                        ${ev.name || 'Sin título'} (${ev.date || 'Sin fecha'}) - ${ev.status || 'Estado n/a'} [${ev.id.substring(0, 8)}...]
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                    </div>

                    <div class="ll-btn-actions">
                        <button type="button" class="ll-btn ll-btn-primary" onclick="window.AdminTournamentLogicLab.executeRealDiagnosis()">
                            <i class="fas fa-microscope"></i> AUDITAR EVENTO SELECCIONADO
                        </button>
                        <button type="button" class="ll-btn ll-btn-outline" onclick="window.AdminTournamentLogicLab.fetchRealEvents()">
                            <i class="fas fa-arrows-rotate"></i> Refrescar Lista de Eventos
                        </button>
                    </div>

                    <!-- Diagnóstico Resultante -->
                    ${diag ? `
                        <div style="margin-top: 28px;">
                            <div class="ll-card" style="background: rgba(30, 41, 59, 0.5); border-color: rgba(139, 92, 246, 0.3);">
                                <div class="ll-card-header">
                                    <div>
                                        <span style="font-size: 0.76rem; text-transform: uppercase; color: #A78BFA; font-weight: 800;">
                                            Informe de Diagnóstico en Tiempo Real
                                        </span>
                                        <h3 style="color: #FFF; margin: 4px 0 0 0; font-size: 1.25rem;">
                                            ${diag.eventName}
                                        </h3>
                                        <div style="font-size: 0.8rem; color: #94A3B8; margin-top: 4px;">
                                            ID: <code>${diag.eventId}</code> • Tipo: <strong>${diag.eventType}</strong> • Fecha de análisis: ${new Date(diag.timestamp).toLocaleString()}
                                        </div>
                                    </div>
                                    <div>
                                        <span class="ll-rule-badge ${diag.auditResult?.isHealthy ? 'green' : 'amber'}" style="font-size: 0.85rem; padding: 6px 14px;">
                                            SCORE: ${diag.auditResult?.overallScore || 0} / 100
                                        </span>
                                    </div>
                                </div>

                                <!-- Recomendaciones Operativas -->
                                <div class="ll-recommendations-box">
                                    <h4 style="color: #A78BFA; margin: 0 0 12px 0; font-size: 0.95rem; display: flex; align-items: center; gap: 8px;">
                                        <i class="fas fa-lightbulb"></i> Recomendaciones Operativas & Resolución
                                    </h4>
                                    ${(diag.recommendations || []).map(rec => `
                                        <div class="ll-recommendation-item">
                                            ${rec}
                                        </div>
                                    `).join('')}
                                </div>

                                <!-- Desglose de las 5 Reglas para el Evento Real -->
                                <div style="margin-top: 20px;">
                                    <h4 style="color: #FFF; font-size: 0.95rem; margin-bottom: 12px;">Auditoría de Actas del Evento</h4>
                                    <div class="ll-rules-stack">
                                        ${(diag.auditResult?.rules || []).map(r => this._renderRuleCard(r)).join('')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        }

        // =========================================================================
        // PESTAÑA 4: SELF-TEST ALGORÍTMICO
        // =========================================================================

        _renderSelfTestTab() {
            const test = this.lastSelfTestResult;

            return `
                <div class="ll-card">
                    <div class="ll-card-header">
                        <div>
                            <h2 class="ll-card-title">⚡ Batería de Self-Test Algorítmico</h2>
                            <div class="ll-card-subtitle">Ejecución de benchmarks en memoria midiendo latencias de cálculo y exactitud lógica</div>
                        </div>
                        <div>
                            <button type="button" class="ll-btn ll-btn-primary" onclick="window.AdminTournamentLogicLab.executeSelfTest()">
                                <i class="fas fa-rocket"></i> EJECUTAR TEST DE ESTRÉS INTEGRAL
                            </button>
                        </div>
                    </div>

                    ${test ? `
                        <div class="ll-score-overview">
                            <div>
                                <span style="font-size: 0.8rem; text-transform: uppercase; font-weight: 800; letter-spacing: 0.05em; color: #94A3B8;">
                                    Estado Global del Motor
                                </span>
                                <div class="ll-big-score">
                                    <span class="ll-big-score-number ${test.healthScore === 100 ? 'healthy' : 'warning'}">
                                        ${test.healthScore}%
                                    </span>
                                </div>
                                <div style="margin-top: 6px;">
                                    <span class="ll-rule-badge ${test.passedTests === test.totalTests ? 'green' : 'amber'}">
                                        ${test.passedTests === test.totalTests ? '● 6 DE 6 BENCHMARKS SATISFACTORIOS' : '● PRUEBAS CON OBSERVACIONES'}
                                    </span>
                                </div>
                            </div>

                            <div style="display: flex; gap: 24px; flex-wrap: wrap;">
                                <div style="display: flex; flex-direction: column;">
                                    <span style="font-size: 0.76rem; color: #94A3B8; text-transform: uppercase; font-weight: 700;">Pruebas Ejecutadas</span>
                                    <span style="font-size: 1.5rem; font-weight: 900; color: #FFF;">${test.totalTests}</span>
                                </div>
                                <div style="display: flex; flex-direction: column;">
                                    <span style="font-size: 0.76rem; color: #94A3B8; text-transform: uppercase; font-weight: 700;">Aprobadas</span>
                                    <span style="font-size: 1.5rem; font-weight: 900; color: #10B981;">${test.passedTests}</span>
                                </div>
                                <div style="display: flex; flex-direction: column;">
                                    <span style="font-size: 0.76rem; color: #94A3B8; text-transform: uppercase; font-weight: 700;">Latencia Media</span>
                                    <span style="font-size: 1.5rem; font-weight: 900; color: #38BDF8;">
                                        ${(test.tests.reduce((acc, t) => acc + (t.durationMs || 0), 0) / test.tests.length).toFixed(2)} ms
                                    </span>
                                </div>
                            </div>
                        </div>

                        <!-- Tabla Detallada de Benchmarks -->
                        <div style="overflow-x: auto;">
                            <table class="ll-test-table">
                                <thead>
                                    <tr>
                                        <th># Benchmark de Lógica</th>
                                        <th>Estado</th>
                                        <th>Latencia</th>
                                        <th>Detalles de Ejecución</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${(test.tests || []).map(t => `
                                        <tr>
                                            <td style="font-weight: 700;">${t.name}</td>
                                            <td>
                                                <span class="ll-rule-badge ${t.passed ? 'green' : 'red'}">
                                                    ${t.passed ? 'PASSED ✅' : 'FAILED ❌'}
                                                </span>
                                            </td>
                                            <td style="color: #38BDF8; font-weight: 800;">${t.durationMs} ms</td>
                                            <td style="color: #CBD5E1; font-size: 0.85rem;">${t.details}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    ` : `
                        <div style="text-align: center; padding: 48px; color: #94A3B8;">
                            <i class="fas fa-spinner fa-spin" style="font-size: 2.5rem; color: #38BDF8; margin-bottom: 12px;"></i>
                            <p>Ejecutando benchmarks algorítmicos...</p>
                        </div>
                    `}
                </div>
            `;
        }

        // =========================================================================
        // ACCIONES Y MANEJADORES DE EVENTOS
        // =========================================================================

        async onSimEventTypeChange(value) {
            this.simEventType = (value === 'entreno') ? 'entreno' : 'americana';
            if (this.stepState.active) {
                this.stepState.active = false;
                this.stepState.currentRound = 0;
            }
            await this.executeTurboSimulation();
        }

        async onSimPlayersSourceChange(value) {
            this.simPlayersSource = (value === 'pro') ? 'pro' : 'real';
            this.cachedRealPlayers = null;
            if (this.stepState.active) {
                this.stepState.active = false;
                this.stepState.currentRound = 0;
            }
            await this.executeTurboSimulation();
        }

        onModeChange(value) {
            this.simMode = value;
            if (this.stepState.active) {
                this.stepState.active = false;
                this.stepState.currentRound = 0;
            }
            return this.executeTurboSimulation();
        }

        onCourtsChange(value) {
            const parsed = parseInt(value, 10);
            this.simCourts = (!isNaN(parsed) && parsed >= 3 && parsed <= 10) ? parsed : 4;
            if (this.stepState.active) {
                this.stepState.active = false;
                this.stepState.currentRound = 0;
            }
            return this.executeTurboSimulation();
        }

        onRealTypeChange(value) {
            this.realEventType = value;
            this.fetchRealEvents();
        }

        async onCloneTypeFilterChange(value) {
            this.simCloneEventType = (value === 'entreno') ? 'entreno' : 'americana';
            await this.fetchCloneEvents(true);
        }

        async fetchCloneEvents(triggerRender = true) {
            this.loadingSimCloneEvents = true;
            if (triggerRender) this._refreshTabContent();

            const isEntreno = this.simCloneEventType === 'entreno';
            let events = [];

            try {
                if (global.FirebaseDB) {
                    const col = isEntreno ? global.FirebaseDB.entrenos : (global.FirebaseDB.americanas || global.FirebaseDB.tournaments);
                    if (col && typeof col.getAll === 'function') {
                        events = await col.getAll();
                    }
                }

                if (events.length === 0 && global.db) {
                    const colName = isEntreno ? 'entrenos' : 'tournaments';
                    const snap = await global.db.collection(colName).limit(20).get();
                    if (!snap.empty) {
                        events = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                    }
                }
            } catch (err) {
                console.warn("[AdminTournamentLogicLab] Error fetchCloneEvents:", err.message);
            }

            if (!events || events.length === 0) {
                events = isEntreno ? [
                    { id: 'ev_demo_entreno_1', name: 'Entreno Pozo Intensivo Nivel 3.5 - Viernes', date: '2026-09-25', status: 'finished', pair_mode: 'twister', num_courts: 4 },
                    { id: 'ev_demo_entreno_2', name: 'Clínic Táctico SomosPadel - 3 Pistas', date: '2026-09-26', status: 'completed', pair_mode: 'twister', num_courts: 3 }
                ] : [
                    { id: 'ev_demo_americana_1', name: 'Americana Nocturna Viernes - 4 Pistas', date: '2026-09-25', status: 'finished', pair_mode: 'twister', num_courts: 4 },
                    { id: 'ev_demo_americana_2', name: 'Torneo Parejas Oro - Sábado Mañana', date: '2026-09-26', status: 'finished', pair_mode: 'fixed', num_courts: 4 },
                    { id: 'ev_demo_americana_3', name: 'Americana Dominical Non-Stop - 5 Pistas', date: '2026-09-27', status: 'finished', pair_mode: 'twister', num_courts: 5 }
                ];
            }

            this.simCloneEventsList = events;
            this.loadingSimCloneEvents = false;
            if (triggerRender) this._refreshTabContent();
        }

        async refreshCloneEvents() {
            this._showToast('Actualizando eventos disponibles...', 'info');
            await this.fetchCloneEvents(true);
        }

        async cloneSelectedRealEvent() {
            const selectEl = document.getElementById('ll-clone-event-select');
            const eventId = selectEl ? selectEl.value : '';
            if (!eventId) {
                this._showToast('Selecciona un evento para clonar', 'warning');
                return;
            }
            await this.simulateFromRealEvent(eventId, this.simCloneEventType);
        }

        unlinkClonedEvent() {
            this.simClonedFrom = null;
            this._showToast('Modo clonado desvinculado. Restaurando simulación estándar.');
            this.executeTurboSimulation(true);
        }

        selectRoundView(roundNum) {
            this.selectedRoundView = roundNum;
            this._refreshTabContent();
        }

        /**
         * Ejecuta la simulación turbo completa de 6 rondas (síncrono en memoria primero con los datos listos, 0 delay)
         */
        async executeTurboSimulation(triggerRender = true) {
            const service = this.getService();
            if (!service) {
                console.error("❌ TournamentLogicAuditService no encontrado.");
                return;
            }

            try {
                const required = this.simCourts * 4;
                let realPlayers = null;

                if (this.simPlayersSource === 'real') {
                    if (this.cachedRealPlayers && this.cachedRealPlayers.length >= required) {
                        realPlayers = this.cachedRealPlayers.slice(0, required);
                    } else if (typeof service.fetchRealPlayers === 'function') {
                        // Lanzar en segundo plano sin esperar ni congelar el renderizado
                        service.fetchRealPlayers(Math.max(40, required)).then(pool => {
                            if (Array.isArray(pool) && pool.length > 0) {
                                this.cachedRealPlayers = pool;
                            }
                        }).catch(e => console.warn("fetchRealPlayers aviso:", e.message));
                    }
                }

                // Simulación síncrona inmediata en memoria
                const result = service.simulateTournament({
                    eventType: this.simEventType,
                    playersSource: this.simPlayersSource,
                    players: realPlayers,
                    numCourts: this.simCourts,
                    mode: this.simMode,
                    rounds: this.simRounds
                });

                this.lastSimulation = result;
                this.selectedRoundView = 1;

                // Actualizar automáticamente la auditoría de estas actas
                this.lastAuditResult = service.auditGoldenRules(result.allMatches, {
                    mode: result.mode,
                    num_courts: result.numCourts,
                    rounds: result.rounds
                });
                const clonedTag = this.simClonedFrom ? ` [Clon: ${this.simClonedFrom.name}]` : '';
                this.lastAuditSource = `Última Simulación Turbo (${this.simEventType.toUpperCase()}, ${result.mode.toUpperCase()}, ${result.numCourts} pistas, 6 rondas)${clonedTag}`;

                if (triggerRender) {
                    this._refreshTabContent();
                    this._showToast('⚡ Simulación Turbo completada con éxito');
                }
            } catch (err) {
                console.error("❌ Error en executeTurboSimulation:", err);
                this._showToast('Error ejecutando simulación: ' + err.message, 'error');
            }
        }

        /**
         * Carga y simula un evento real de forma ficticia en memoria sin tocar la BD
         * @param {string} eventId 
         * @param {string} eventType 
         */
        async simulateFromRealEvent(eventId, eventType = 'americana') {
            const service = this.getService();
            if (!service) {
                this._showToast('TournamentLogicAuditService no disponible', 'error');
                return;
            }

            this._showToast('Clonando evento y simulando en memoria sin alterar BD...', 'info');

            try {
                let targetArg = eventId;
                const foundInClone = (this.simCloneEventsList || []).find(e => e.id === eventId);
                const foundInReal = (this.realEventsList || []).find(e => e.id === eventId);
                const foundEvent = foundInClone || foundInReal;

                if (foundEvent && typeof eventId === 'string' && eventId.startsWith('ev_demo_')) {
                    targetArg = foundEvent;
                }

                const result = await service.simulateFromRealEvent(targetArg, eventType, {
                    mode: this.simMode,
                    numCourts: this.simCourts,
                    rounds: this.simRounds
                });

                this.lastSimulation = result;
                this.simEventType = eventType;
                this.simPlayersSource = 'real';
                if (result.numCourts) this.simCourts = result.numCourts;
                if (result.mode) this.simMode = result.mode;
                this.simClonedFrom = {
                    id: result.sourceEventId || eventId,
                    name: result.sourceEventName || (foundEvent ? foundEvent.name : 'Evento Real'),
                    type: eventType
                };
                this.selectedRoundView = 1;

                // Actualizar automáticamente auditoría de 5 reglas
                this.lastAuditResult = service.auditGoldenRules(result.allMatches, {
                    mode: result.mode,
                    num_courts: result.numCourts,
                    rounds: result.rounds
                });
                this.lastAuditSource = `Simulación Clonada de "${this.simClonedFrom.name}" (${result.mode.toUpperCase()}, ${result.numCourts} pistas)`;

                // Resetear modo paso a paso
                this.stepState.active = false;
                this.stepState.currentRound = 0;

                this._refreshTabContent();
                this._showToast(`📂 Evento "${this.simClonedFrom.name}" clonado con éxito (Sin tocar BD)`);
            } catch (err) {
                console.error("❌ Error en simulateFromRealEvent:", err);
                this._showToast('Error al clonar evento: ' + err.message, 'error');
            }
        }

        /**
         * Inicia o avanza el modo paso a paso
         */
        toggleStepByStep() {
            if (!this.stepState.active) {
                this.stepState.active = true;
                this.stepState.currentRound = 0;
                this.stepState.maxRounds = 6;
                this.stepState.history = [];
                this.stepState.players = [];
            }
            this.nextStepRound();
        }

        /**
         * Avanza una ronda en la simulación paso a paso respetando tipo de evento y jugadores reales
         */
        async nextStepRound() {
            const service = this.getService();
            if (!service) return;

            if (this.stepState.currentRound >= this.stepState.maxRounds) {
                this._showToast('Simulación de 6 rondas ya finalizada');
                return;
            }

            this.stepState.currentRound++;
            
            let realPlayers = null;
            if (this.simPlayersSource === 'real') {
                const required = this.simCourts * 4;
                if (!this.cachedRealPlayers || this.cachedRealPlayers.length < required) {
                    this.cachedRealPlayers = await service.fetchRealPlayers(required);
                }
                realPlayers = (this.cachedRealPlayers || []).slice(0, required);
            }

            // Simular hasta la ronda actual
            const partialSim = service.simulateTournament({
                eventType: this.simEventType,
                playersSource: this.simPlayersSource,
                players: realPlayers,
                numCourts: this.simCourts,
                mode: this.simMode,
                rounds: this.stepState.currentRound
            });

            this.lastSimulation = partialSim;
            this.selectedRoundView = this.stepState.currentRound;

            this._refreshTabContent();
            this._showToast(`Ronda ${this.stepState.currentRound} completada`);
        }

        /**
         * Reinicia el flujo paso a paso
         */
        resetStepByStep() {
            this.stepState.active = false;
            this.stepState.currentRound = 0;
            this.executeTurboSimulation();
        }

        /**
         * Pasa los resultados de la simulación al escáner de reglas y cambia de pestaña
         */
        auditCurrentSimulation() {
            if (!this.lastSimulation) return;
            const service = this.getService();
            if (!service) return;

            this.lastAuditResult = service.auditGoldenRules(this.lastSimulation.allMatches, {
                mode: this.lastSimulation.mode,
                num_courts: this.lastSimulation.numCourts,
                rounds: this.lastSimulation.rounds
            });
            this.lastAuditSource = `Simulación Actual (${this.lastSimulation.mode.toUpperCase()}, ${this.lastSimulation.numCourts} pistas)`;

            this.switchTab('rules_scanner');
        }

        /**
         * Audita rápidamente la última simulación desde la pestaña de reglas
         */
        auditLastSimulationQuick() {
            if (!this.lastSimulation) {
                this.executeTurboSimulation(false);
            }
            this.auditCurrentSimulation();
        }

        /**
         * Ejecuta simulación de estrés dirigida para auditar
         */
        runStressBenchmarkAudit(mode = 'twister') {
            const service = this.getService();
            if (!service) return;

            const sim = service.simulateTournament({ mode: mode, numCourts: 4, rounds: 6 });
            this.lastSimulation = sim;
            this.lastAuditResult = service.auditGoldenRules(sim.allMatches, { mode: mode, num_courts: 4, rounds: 6 });
            this.lastAuditSource = `Benchmark de Estrés (${mode.toUpperCase()} 4 Pistas, 6 Rondas)`;

            this._refreshTabContent();
            this._showToast(`Benchmark de estrés (${mode}) auditado con éxito`);
        }

        /**
         * Obtiene la lista de eventos reales disponibles en Firestore o FirebaseDB
         */
        async fetchRealEvents() {
            this.loadingRealEvents = true;
            this._refreshTabContent();

            const isEntreno = this.realEventType === 'entreno';
            let events = [];

            try {
                // Caso 1: FirebaseDB helper
                if (global.FirebaseDB) {
                    const col = isEntreno ? global.FirebaseDB.entrenos : global.FirebaseDB.americanas;
                    if (col && typeof col.getAll === 'function') {
                        events = await col.getAll();
                    }
                }

                // Caso 2: Firestore nativo window.db
                if (events.length === 0 && global.db) {
                    const colName = isEntreno ? 'entrenos' : 'tournaments';
                    const snap = await global.db.collection(colName).limit(20).get();
                    if (!snap.empty) {
                        events = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                    }
                }
            } catch (err) {
                console.warn("[AdminTournamentLogicLab] Error al cargar eventos de Firebase:", err.message);
            }

            // Si está offline o vacío, inyectar lista representativa para diagnósticos de demostración
            if (!events || events.length === 0) {
                events = [
                    { id: 'ev_demo_1', name: 'Americana Nocturna Viernes - 4 Pistas', date: '2026-09-25', status: 'finished', pair_mode: 'twister', num_courts: 4 },
                    { id: 'ev_demo_2', name: 'Torneo Parejas Oro - Sábado Mañana', date: '2026-09-26', status: 'finished', pair_mode: 'fixed', num_courts: 4 },
                    { id: 'ev_demo_3', name: 'Entreno Táctico Avanzado Nivel 4+', date: '2026-09-24', status: 'completed', pair_mode: 'twister', num_courts: 3 }
                ];
            }

            this.realEventsList = events;
            this.loadingRealEvents = false;
            if (events.length > 0 && !this.selectedRealEventId) {
                this.selectedRealEventId = events[0].id;
            }

            this._refreshTabContent();
        }

        /**
         * Ejecuta el diagnóstico de un evento real seleccionado
         */
        async executeRealDiagnosis() {
            const selectEl = document.getElementById('ll-real-event-select');
            const eventId = selectEl ? selectEl.value : this.selectedRealEventId;
            if (!eventId) {
                this._showToast('Selecciona un evento para auditar', 'warning');
                return;
            }

            const service = this.getService();
            if (!service) return;

            this._showToast('Ejecutando diagnóstico de actas reales...');

            try {
                // Si es un evento demo, generar matches sintéticos consistentes
                let targetArg = eventId;
                const foundDemo = this.realEventsList.find(e => e.id === eventId);

                if (foundDemo && eventId.startsWith('ev_demo_')) {
                    const sim = service.simulateTournament({
                        mode: foundDemo.pair_mode || 'twister',
                        numCourts: foundDemo.num_courts || 4,
                        rounds: 6
                    });
                    targetArg = {
                        event: foundDemo,
                        matches: sim.allMatches
                    };
                }

                const diagResult = await service.diagnoseRealEvent(targetArg, this.realEventType);
                this.lastRealDiagnosis = diagResult;
                this.selectedRealEventId = eventId;

                this._refreshTabContent();
                this._showToast('Diagnóstico de evento real completado');
            } catch (err) {
                console.error("❌ Error en executeRealDiagnosis:", err);
                this._showToast('Error al diagnosticar evento: ' + err.message, 'error');
            }
        }

        /**
         * Ejecuta la batería de 6 pruebas de auto-test
         */
        executeSelfTest() {
            const service = this.getService();
            if (!service) return;

            this.runningSelfTest = true;
            try {
                const result = service.runAlgorithmicSelfTest();
                this.lastSelfTestResult = result;
                this.runningSelfTest = false;

                this._refreshTabContent();
                this._showToast('🚀 Batería de auto-test completada al 100%');
            } catch (err) {
                this.runningSelfTest = false;
                console.error("❌ Error en executeSelfTest:", err);
                this._showToast('Error en self-test: ' + err.message, 'error');
            }
        }

        /**
         * Refresca solo el contenedor dinámico de la pestaña activa
         * @private
         */
        _refreshTabContent() {
            const contentContainer = document.getElementById('logic-lab-tab-container');
            if (contentContainer) {
                contentContainer.innerHTML = this._renderActiveTabContent();
                this._setupTabListeners();
            }
        }

        /**
         * Muestra notificación toast si existe el sistema global o un banner flotante
         * @private
         */
        _showToast(msg, type = 'success') {
            if (global.AdminUtils && typeof global.AdminUtils.showToast === 'function') {
                global.AdminUtils.showToast(msg, type);
                return;
            }
            if (typeof global.showToast === 'function') {
                global.showToast(msg, type);
                return;
            }

            // Fallback: Toast flotante rápido
            let toast = document.getElementById('ll-floating-toast');
            if (!toast) {
                toast = document.createElement('div');
                toast.id = 'll-floating-toast';
                toast.style.cssText = `
                    position: fixed;
                    bottom: 24px;
                    right: 24px;
                    background: #0F172A;
                    border: 1px solid #38BDF8;
                    color: #FFFFFF;
                    padding: 12px 20px;
                    border-radius: 12px;
                    font-size: 0.9rem;
                    font-weight: 700;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
                    z-index: 99999;
                    transition: opacity 0.3s ease;
                `;
                if (typeof document !== 'undefined' && document.body) {
                    document.body.appendChild(toast);
                }
            }
            if (toast) {
                toast.textContent = msg;
                toast.style.borderColor = type === 'error' ? '#EF4444' : type === 'warning' ? '#F59E0B' : '#38BDF8';
                toast.style.opacity = '1';
            }

            clearTimeout(this._toastTimeout);
            this._toastTimeout = setTimeout(() => {
                if (toast) toast.style.opacity = '0';
            }, 3000);
        }

        _setupEventListeners() {
            // Listeners globales si son necesarios
        }

        _setupTabListeners() {
            // Listeners específicos por pestaña
        }
    }

    // Instancia singleton
    const adminTournamentLogicLabInstance = new AdminTournamentLogicLab();
    global.AdminTournamentLogicLab = adminTournamentLogicLabInstance;

    // Registrar en window.AdminViews para interoperabilidad con el router
    if (!global.AdminViews) {
        global.AdminViews = {};
    }
    global.AdminViews.logic_lab = () => adminTournamentLogicLabInstance.render();

    console.log("✅ [AdminTournamentLogicLab] Módulo registrado globalmente en window.AdminTournamentLogicLab y window.AdminViews.logic_lab");

})(typeof window !== 'undefined' ? window : globalThis);
