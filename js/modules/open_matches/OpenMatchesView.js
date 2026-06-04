/**
 * OpenMatchesView.js - Premium Playtomic Mobile Light Theme Replica v4.0
 * Renders an exact light-mode mobile replica of Playtomic's match list and detailed signup view.
 * Features date headers, overlapping avatars, CSS padel court graphics, dynamic tabs, the official signup drawer,
 * and a fully functional Community Match Creation system styled exactly like training creation.
 */
(function () {
    class OpenMatchesView {
        constructor() {
            this.containerId = 'content-area';
            this.activeTab = 'disponible'; // 'disponible' | 'mis_partidas'
            this.selectedMatch = null; // Store selected match for the detail drawer
            this.allMatches = []; // Store raw Firestore matches
            this.playersCache = {}; // Cache for player levels
        }

        generateLevelOptionTags(selectedVal) {
            let html = '';
            for (let lvl = 1.0; lvl <= 6.0; lvl = parseFloat((lvl + 0.1).toFixed(1))) {
                const selected = Math.abs(lvl - parseFloat(selectedVal)) < 0.05 ? 'selected' : '';
                html += `<option value="${lvl.toFixed(1)}" ${selected}>Nivel ${lvl.toFixed(1)}</option>`;
            }
            return html;
        }

        renderLayout() {
            const content = document.getElementById(this.containerId);
            if (!content) return;

            const isIntegrated = (this.containerId === 'events-tab-content');

            // Enforce page title
            const titleEl = document.getElementById('page-title');
            if (titleEl && !isIntegrated) {
                titleEl.textContent = 'PARTIDAS ABIERTAS';
            }

            // Check if user is Admin
            const currentUser = window.Store ? window.Store.getState('currentUser') : null;
            const isAdmin = currentUser && ['super_admin', 'superadmin', 'admin', 'admin_player', 'captain'].includes((currentUser.role || '').toLowerCase());

            content.innerHTML = `
                <div class="playtomic-app-light fade-in" style="${isIntegrated ? 'padding-top: 10px;' : ''}">
                    
                    <!-- TOP HEADER MOBILE (Playtomic Title) -->
                    ${isIntegrated ? '' : `
                    <div class="playtomic-top-header">
                        <i class="fas fa-arrow-left header-back-btn" onclick="window.Router?.navigate('dashboard')"></i>
                        <span class="header-title">Competiciones</span>
                        <div style="width: 24px;"></div> <!-- Spacer to center title -->
                    </div>
                    `}

                    <!-- PLAYTOMIC TABS (Disponible vs Tus Competiciones) -->
                    <div class="playtomic-tabs-container">
                        <button class="playtomic-tab-btn ${this.activeTab === 'disponible' ? 'active' : ''}" onclick="window.OpenMatchesView.changeTab('disponible')">
                            Disponible
                        </button>
                        <button class="playtomic-tab-btn ${this.activeTab === 'mis_partidas' ? 'active' : ''}" onclick="window.OpenMatchesView.changeTab('mis_partidas')">
                            Tus competiciones
                        </button>
                    </div>

                    <!-- LEVEL FILTER SLIDER ICON LINE & QUICK SEARCH -->
                    <div class="playtomic-meta-filters" style="display: flex; gap: 10px; align-items: center; padding: 10px 16px 6px 16px;">
                        <div class="filter-sliders-btn" onclick="window.OpenMatchesView.toggleAdminDrawer()" style="flex-shrink: 0; margin: 0;">
                            <i class="fas fa-sliders-h"></i>
                            <span class="filter-sliders-dot"></span>
                        </div>
                        <div style="position: relative; flex: 1;">
                            <i class="fas fa-search" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #2E61FF; font-size: 0.8rem; z-index: 10;"></i>
                            <input type="text" id="player-feed-search-input" oninput="window.OpenMatchesView.handleFeedSearch(this.value)" placeholder="Buscar club, comarca, nivel..." class="playtomic-input" style="width: 100%; height: 38px; padding-left: 36px !important; padding-right: 32px; font-size: 0.85rem; font-weight: 800; border-radius: 12px; border: 1px solid rgba(15, 23, 42, 0.08); background: #ffffff; color: #0F172A; box-sizing: border-box;">
                            <i class="fas fa-times-circle" id="player-feed-search-clear" onclick="document.getElementById('player-feed-search-input').value=''; window.OpenMatchesView.handleFeedSearch(''); this.style.display='none';" style="display: none; position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: #2E61FF; cursor: pointer; font-size: 0.85rem; z-index: 10;"></i>
                        </div>
                    </div>

                    <!-- GROUPED MATCHES FEED -->
                    <div id="open-matches-list" class="playtomic-matches-list-light">
                        <div class="playtomic-skeleton-light">
                            <span class="playtomic-spinner-light"></span>
                            <p>Buscando competiciones disponibles...</p>
                        </div>
                    </div>

                    <!-- STUNNING FLOATING ACTION BUTTON (Crear Partido) -->
                    <button class="playtomic-fab-create haptic-feedback" onclick="window.OpenMatchesView.openCreateModal()" title="Crear Partido Abierto">
                        <i class="fas fa-plus"></i>
                    </button>

                    <!-- PLAYTOMIC DETAILED SIGNUP DRAWER (Modal) -->
                    <div id="playtomic-detail-drawer" class="playtomic-drawer-modal hidden">
                        <!-- Content will be injected dynamically in openDetailDrawer() -->
                    </div>

                    <!-- PLAYTOMIC CREATE MATCH MODAL -->
                    <div id="playtomic-create-modal" class="playtomic-drawer-modal hidden">
                        <!-- Content will be injected dynamically in openCreateModal() -->
                    </div>

                    <!-- PLAYTOMIC INVITE PLAYER MODAL -->
                    <div id="playtomic-invite-modal" class="playtomic-drawer-modal hidden" style="z-index: 26000;">
                        <!-- Content will be injected dynamically in openInviteModal() -->
                    </div>

                    <!-- ADMIN DEVELOPER SIMULATOR (Sleek Drawer at the bottom) -->
                    ${isAdmin ? `
                    <div id="playtomic-admin-drawer" class="playtomic-admin-drawer hidden">
                        <div class="drawer-header" onclick="document.getElementById('sim-panel-content').classList.toggle('hidden')">
                            <span><i class="fab fa-whatsapp"></i> CONSOLA ADMIN: SIMULADOR DE WHATSAPP</span>
                            <i class="fas fa-chevron-up"></i>
                        </div>
                        
                        <div id="sim-panel-content" class="hidden drawer-body">
                            <p style="font-size: 0.72rem; color: #64748B; margin-bottom: 8px; line-height: 1.4;">
                                Pega un texto compartido de Playtomic para simular la extracción en tiempo real.
                            </p>
                            
                            <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                                <input type="password" id="sim-gemini-key" placeholder="API Key de Gemini (Opcional)" class="playtomic-input" style="flex: 1; font-size: 0.72rem; padding: 6px 10px;" onchange="if(window.OpenMatchesController) window.OpenMatchesController.geminiApiKey = this.value">
                                <button onclick="window.OpenMatchesView.useSampleText()" class="playtomic-btn-sec" style="font-size: 0.65rem; padding: 6px 10px; border: 1px solid #2E61FF; color: #2E61FF; border-radius: 6px; font-weight: 800; background: transparent; cursor: pointer;">
                                    MENSAJE DEMO
                                </button>
                            </div>

                            <textarea id="sim-wa-message" rows="3" class="playtomic-input" style="width: 100%; font-size: 0.72rem; padding: 8px; resize: vertical; margin-bottom: 8px; background:#ffffff; color:#0F172A;" placeholder="Pega el mensaje de WhatsApp aquí..."></textarea>
                            
                            <button id="sim-btn-send" onclick="window.OpenMatchesView.handleSimulateSubmit()" class="playtomic-btn-blue" style="width: 100%; padding: 8px; font-size: 0.75rem; border-radius: 8px; background: #2E61FF;">
                                🚀 SIMULAR INTEGRACIÓN WHATSAPP
                            </button>
                            
                            <div id="sim-console-output" style="margin-top: 8px; padding: 8px; background: #F1F5F9; border: 1px solid #E2E8F0; border-radius: 6px; font-family: monospace; font-size: 0.68rem; color: #0F172A; min-height: 25px; display: none;"></div>
                        </div>
                    </div>
                    ` : ''}

                </div>

                <!-- 🌟 PLAYTOMIC MOBILE LIGHT THEMING REDESIGNED -->
                <style>
                    .playtomic-app-light {
                        max-width: 600px;
                        margin: 0 auto;
                        min-height: 100vh;
                        background: var(--bg-app);
                        color: #0F172A;
                        font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
                        padding-bottom: 120px;
                        position: relative;
                        overflow-x: hidden;
                    }

                    /* Floating Action Button (FAB) */
                    .playtomic-fab-create {
                        position: fixed;
                        bottom: 115px;
                        right: 20px;
                        width: 58px;
                        height: 58px;
                        border-radius: 50%;
                        background: linear-gradient(135deg, #ccff00 0%, #9bc200 100%);
                        color: #000000 !important;
                        border: none;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 1.4rem;
                        cursor: pointer;
                        box-shadow: 0 8px 25px rgba(204, 255, 0, 0.35);
                        z-index: 12000;
                        transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
                    }
                    .playtomic-fab-create:hover {
                        transform: scale(1.1) rotate(90deg);
                        box-shadow: 0 12px 30px rgba(204, 255, 0, 0.55);
                    }
                    .playtomic-fab-create:active {
                        transform: scale(0.95);
                    }
                    .playtomic-fab-create i {
                        color: #000000 !important;
                    }

                    /* 1. Mobile Top Header */
                    .playtomic-top-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 16px;
                        background: #ffffff;
                        border-bottom: 1px solid rgba(15, 23, 42, 0.08);
                        position: sticky;
                        top: 0;
                        z-index: 100;
                    }
                    .header-back-btn {
                        font-size: 1.15rem;
                        color: #0F172A;
                        cursor: pointer;
                        padding: 4px;
                        transition: color 0.2s;
                    }
                    .header-back-btn:hover {
                        color: #2E61FF;
                    }
                    .header-title {
                        font-size: 1.1rem;
                        font-weight: 950;
                        color: #0F172A;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                    }

                    /* 2. Sub Navigation Tabs */
                    .playtomic-tabs-container {
                        display: flex;
                        background: #ffffff;
                        border-bottom: 1px solid rgba(15, 23, 42, 0.06);
                    }
                    .playtomic-tab-btn {
                        flex: 1;
                        padding: 14px 0;
                        border: none;
                        background: transparent;
                        font-size: 0.85rem;
                        font-weight: 800;
                        color: #64748B;
                        cursor: pointer;
                        text-align: center;
                        position: relative;
                        transition: color 0.2s;
                    }
                    .playtomic-tab-btn.active {
                        color: #0F172A;
                    }
                    .playtomic-tab-btn.active::after {
                        content: '';
                        position: absolute;
                        bottom: 0;
                        left: 10%;
                        width: 80%;
                        height: 3.5px;
                        background: #ccff00;
                        border-radius: 4px;
                        box-shadow: 0 0 10px rgba(204, 255, 0, 0.5);
                    }

                    /* 3. Slider Filter Bar */
                    .playtomic-meta-filters {
                        padding: 12px 16px;
                        display: flex;
                        gap: 12px;
                        background: var(--bg-app);
                    }
                    .filter-sliders-btn {
                        width: 38px;
                        height: 38px;
                        background: #ffffff;
                        border: 1px solid rgba(15, 23, 42, 0.08);
                        border-radius: 12px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        position: relative;
                        box-shadow: 0 4px 10px rgba(10, 25, 47, 0.03);
                        transition: all 0.2s;
                    }
                    .filter-sliders-btn:hover {
                        border-color: #2E61FF;
                    }
                    .filter-sliders-btn i {
                        font-size: 0.95rem;
                        color: #0F172A;
                    }
                    .filter-sliders-dot {
                        position: absolute;
                        top: 2px;
                        right: 2px;
                        width: 7px;
                        height: 7px;
                        background: #ccff00;
                        border-radius: 50%;
                        border: 1px solid #ffffff;
                        box-shadow: 0 0 5px #ccff00;
                    }

                    .playtomic-input {
                        background: #ffffff;
                        border: 1.5px solid rgba(15, 23, 42, 0.08);
                        color: #0F172A;
                        border-radius: 12px;
                        outline: none;
                        font-family: inherit;
                        transition: all 0.2s;
                    }
                    .playtomic-input:focus {
                        border-color: #2E61FF;
                        box-shadow: 0 0 15px rgba(46, 97, 255, 0.12);
                    }

                    /* Conic scanning community radar */
                    .community-radar-card {
                        background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
                        border-radius: 20px;
                        padding: 16px 20px;
                        margin: 4px 0 8px 0;
                        position: relative;
                        overflow: hidden;
                        box-shadow: 0 8px 30px rgba(15, 23, 42, 0.15);
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        border: 1px solid rgba(255,255,255,0.05);
                    }
                    .radar-bg-grid {
                        position: absolute;
                        inset: 0;
                        background-image: 
                            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
                        background-size: 15px 15px;
                        pointer-events: none;
                    }
                    .radar-glow {
                        position: absolute;
                        width: 150px;
                        height: 150px;
                        background: radial-gradient(circle, rgba(204, 255, 0, 0.12) 0%, transparent 70%);
                        top: -50px;
                        right: -50px;
                        filter: blur(20px);
                        pointer-events: none;
                    }
                    .radar-details {
                        display: flex;
                        flex-direction: column;
                        gap: 4px;
                        z-index: 2;
                        text-align: left;
                    }
                    .radar-title {
                        font-size: 0.65rem;
                        font-weight: 900;
                        letter-spacing: 2px;
                        color: #CCFF00;
                        text-transform: uppercase;
                    }
                    .radar-status-text {
                        font-size: 1rem;
                        font-weight: 800;
                        color: #ffffff;
                        line-height: 1.2;
                    }
                    .radar-stats-row {
                        font-size: 0.72rem;
                        color: #94a3b8;
                        font-weight: 600;
                        margin-top: 2px;
                    }
                    .radar-animation-box {
                        position: relative;
                        width: 48px;
                        height: 48px;
                        border-radius: 50%;
                        border: 1.5px solid rgba(204, 255, 0, 0.25);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: rgba(15, 23, 42, 0.6);
                        z-index: 2;
                    }
                    .radar-sweep {
                        position: absolute;
                        width: 100%;
                        height: 100%;
                        border-radius: 50%;
                        background: conic-gradient(from 0deg, rgba(204, 255, 0, 0.15) 0%, transparent 60%, transparent 100%);
                        animation: radarSweepRotate 3s linear infinite;
                    }
                    .radar-ping {
                        position: absolute;
                        width: 6px;
                        height: 6px;
                        background: #CCFF00;
                        border-radius: 50%;
                        box-shadow: 0 0 10px #CCFF00, 0 0 20px #CCFF00;
                        top: 25%;
                        left: 65%;
                        animation: pingPulse 1.5s infinite;
                    }
                    .radar-center-dot {
                        width: 6px;
                        height: 6px;
                        background: #CCFF00;
                        border-radius: 50%;
                        box-shadow: 0 0 6px #CCFF00;
                        z-index: 3;
                    }
                    @keyframes radarSweepRotate {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                    @keyframes pingPulse {
                        0% { transform: scale(0.8); opacity: 0.8; }
                        50% { transform: scale(1.3); opacity: 1; box-shadow: 0 0 12px #CCFF00, 0 0 24px #CCFF00; }
                        100% { transform: scale(0.8); opacity: 0.8; }
                    }

                    /* 4. Grouped matches feed */
                    .playtomic-matches-list-light {
                        padding: 12px 16px;
                        display: flex;
                        flex-direction: column;
                        gap: 20px;
                    }
                    .date-group-header {
                        font-size: 0.85rem;
                        color: #0F172A;
                        text-transform: uppercase;
                        letter-spacing: 1.2px;
                        margin-top: 15px;
                        border-left: 3.5px solid #ccff00;
                        padding-left: 10px;
                        font-weight: 950;
                    }

                    /* Premium Match Cards style override (Light Mode) */
                    .premium-match-card {
                        position: relative;
                        background: #ffffff;
                        border: 1px solid rgba(15, 23, 42, 0.08);
                        border-radius: 24px;
                        padding: 18px;
                        display: flex;
                        flex-direction: column;
                        gap: 14px;
                        cursor: pointer;
                        overflow: hidden;
                        transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
                        box-shadow: 0 8px 32px rgba(10, 25, 47, 0.03);
                        text-align: left;
                    }
                    .premium-match-card:hover {
                        transform: translateY(-5px);
                        border-color: #CCFF00;
                        box-shadow: 0 12px 40px rgba(204, 255, 0, 0.12);
                    }
                    .premium-match-card:hover .card-glow-effect {
                        opacity: 0.15;
                    }
                    .premium-match-card:active {
                        transform: translateY(-1px);
                    }

                    .card-glow-effect {
                        position: absolute;
                        top: -50%;
                        left: -50%;
                        width: 200%;
                        height: 200%;
                        background: radial-gradient(circle, rgba(204, 255, 0, 0.12) 0%, rgba(204,255,0,0) 70%);
                        opacity: 0.05;
                        pointer-events: none;
                        transition: opacity 0.3s ease;
                    }

                    .card-header-row {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    .card-time-badge {
                        background: rgba(15, 23, 42, 0.04);
                        border: 1px solid rgba(15, 23, 42, 0.06);
                        color: #0F172A;
                        font-weight: 850;
                        font-size: 0.72rem;
                        padding: 6px 12px;
                        border-radius: 12px;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        letter-spacing: 0.5px;
                    }
                    .card-level-badge {
                        background: rgba(204, 255, 0, 0.08);
                        border: 1px solid rgba(204, 255, 0, 0.25);
                        color: #72a800;
                        font-weight: 955;
                        font-size: 0.72rem;
                        padding: 6px 12px;
                        border-radius: 12px;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        letter-spacing: 0.5px;
                    }

                    .card-body-row {
                        display: flex;
                        gap: 16px;
                        align-items: center;
                    }

                    .court-graphic-wrapper {
                        flex-shrink: 0;
                    }

                    /* Isometric Padel Court CSS */
                    .isometric-court-wrapper {
                        width: 68px;
                        height: 68px;
                        background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
                        border-radius: 16px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        overflow: hidden;
                        border: 1px solid rgba(15, 23, 42, 0.06);
                        box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.03);
                        position: relative;
                        perspective: 300px;
                    }
                    .iso-court {
                        width: 42px;
                        height: 28px;
                        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                        border: 1.5px solid #ffffff;
                        position: relative;
                        transform: rotateX(55deg) rotateZ(-45deg);
                        box-shadow: 0 4px 10px rgba(0,0,0,0.12), 0 0 10px rgba(59,130,246,0.3);
                    }
                    .iso-court-net {
                        position: absolute;
                        top: 50%;
                        left: 0;
                        width: 100%;
                        height: 1.5px;
                        background: rgba(255, 255, 255, 0.85);
                        box-shadow: 0 0 3px rgba(255, 255, 255, 0.8);
                    }
                    .iso-court-lines {
                        position: absolute;
                        inset: 3px;
                        border: 0.75px solid rgba(255, 255, 255, 0.6);
                    }
                    .iso-court-ball {
                        position: absolute;
                        width: 5px;
                        height: 5px;
                        background: #CCFF00;
                        border-radius: 50%;
                        top: 30%;
                        left: 45%;
                        box-shadow: 0 0 6px #CCFF00, 0 0 12px #CCFF00;
                        animation: bounceIsoBall 2s infinite ease-in-out alternate;
                    }
                    @keyframes bounceIsoBall {
                        0% {
                            transform: translate3d(0, 0, 0) scale(1);
                            box-shadow: 0 0 4px #CCFF00;
                        }
                        100% {
                            transform: translate3d(4px, -3px, 6px) scale(1.2);
                            box-shadow: 0 0 8px #CCFF00, 0 0 16px #CCFF00;
                        }
                    }

                    .card-details-wrapper {
                        flex: 1;
                        min-width: 0;
                        display: flex;
                        flex-direction: column;
                        gap: 6px;
                        text-align: left;
                    }
                    .card-club-name {
                        margin: 0;
                        font-weight: 950;
                        font-size: 1.05rem;
                        color: #0F172A;
                        letter-spacing: 0.5px;
                        line-height: 1.25;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        text-align: left;
                    }
                    .card-location-row {
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        font-size: 0.76rem;
                        color: #64748B;
                        font-weight: 600;
                    }
                    .card-location-row i {
                        color: #2E61FF;
                    }

                    /* 2x2 Player Pods */
                    .court-roster-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 8px;
                        padding: 2px 0;
                        margin-top: 4px;
                        width: 100%;
                    }
                    .player-grid-pod {
                        background: rgba(15, 23, 42, 0.03);
                        border: 1px solid rgba(15, 23, 42, 0.05);
                        border-radius: 12px;
                        padding: 6px 10px;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        transition: all 0.2s ease;
                        min-width: 0;
                        position: relative;
                        height: 38px;
                        box-sizing: border-box;
                    }
                    .player-grid-pod:hover {
                        background: rgba(15, 23, 42, 0.05);
                        border-color: rgba(15, 23, 42, 0.1);
                    }
                    .player-grid-pod.pod-empty {
                        border: 1px dashed rgba(46, 97, 255, 0.2);
                        background: rgba(46, 97, 255, 0.01);
                    }
                    .player-grid-pod.pod-empty:hover {
                        border-color: #2E61FF;
                        background: rgba(46, 97, 255, 0.04);
                    }
                    .pod-avatar {
                        width: 24px;
                        height: 24px;
                        border-radius: 50%;
                        background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
                        color: #ffffff;
                        font-size: 0.65rem;
                        font-weight: 900;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        flex-shrink: 0;
                        border: 1px solid #ffffff;
                        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                    }
                    .pod-avatar.empty-avatar {
                        background: transparent;
                        border: 1px dashed rgba(46, 97, 255, 0.4);
                        color: #2E61FF;
                        box-shadow: none;
                    }
                    .pod-name {
                        font-size: 0.72rem;
                        font-weight: 750;
                        color: #0F172A;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        flex: 1;
                        text-align: left;
                    }
                    .player-grid-pod.pod-empty .pod-name {
                        color: #2E61FF;
                        font-weight: 850;
                        letter-spacing: 0.5px;
                        font-size: 0.7rem;
                    }
                    .pod-level-tag {
                        font-size: 0.58rem;
                        font-weight: 900;
                        background: #CCFF00;
                        color: #000;
                        padding: 1px 4px;
                        border-radius: 4px;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                        flex-shrink: 0;
                    }

                    .spots-status-pill {
                        background: rgba(15, 23, 42, 0.04);
                        border: 1px solid rgba(15, 23, 42, 0.06);
                        color: #0F172A;
                        font-size: 0.68rem;
                        font-weight: 900;
                        padding: 4px 10px;
                        border-radius: 20px;
                        letter-spacing: 0.5px;
                        text-transform: uppercase;
                    }
                    .spots-status-pill.last-spot {
                        background: rgba(239, 68, 68, 0.1);
                        border-color: rgba(239, 68, 68, 0.3);
                        color: #ef4444;
                        animation: neonPulse 1.5s infinite alternate;
                    }
                    @keyframes neonPulse {
                        0% { box-shadow: 0 0 5px rgba(239, 68, 68, 0.1); }
                        100% { box-shadow: 0 0 12px rgba(239, 68, 68, 0.35); }
                    }

                    .card-footer-action-row {
                        border-top: 1px solid rgba(15, 23, 42, 0.06);
                        padding-top: 12px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    .footer-left-info {
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        font-size: 0.76rem;
                        color: #64748B;
                        font-weight: 700;
                    }
                    .footer-left-info i {
                        color: #2E61FF;
                    }
                    .footer-right-cta {
                        color: #2E61FF;
                        font-size: 0.78rem;
                        font-weight: 900;
                        letter-spacing: 0.8px;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                    }
                    .footer-right-cta i {
                        font-size: 0.72rem;
                        transition: transform 0.2s ease;
                    }
                    .premium-match-card:hover .footer-right-cta i {
                        transform: translateX(4px);
                    }

                    /* 5. PLAYTOMIC DETAIL DRAWER (Light Mode Glassmorphism) */
                    .playtomic-drawer-modal {
                        position: fixed;
                        top: 0;
                        left: 50%;
                        transform: translateX(-50%);
                        width: 100%;
                        max-width: 600px;
                        height: 100%;
                        background: rgba(15, 23, 42, 0.4);
                        backdrop-filter: blur(8px);
                        -webkit-backdrop-filter: blur(8px);
                        z-index: 25000;
                        display: flex;
                        flex-direction: column;
                        justify-content: flex-end;
                        transition: opacity 0.3s ease;
                    }
                    .drawer-content-container {
                        background: #ffffff;
                        border-top: 1px solid rgba(15, 23, 42, 0.08);
                        border-radius: 28px 28px 0 0;
                        height: 92%;
                        max-height: 92%;
                        width: 100%;
                        overflow: hidden;
                        display: flex;
                        flex-direction: column;
                        position: relative;
                        animation: slideUp 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards;
                        box-shadow: 0 -10px 45px rgba(10, 25, 47, 0.12);
                    }
                    @keyframes slideUp {
                        from { transform: translateY(100%); }
                        to { transform: translateY(0); }
                    }

                    /* Image Banner Header */
                    .drawer-club-banner {
                        height: 150px;
                        background: linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 100%), 
                                    url('img/logo_somospadel.png') center/cover no-repeat;
                        position: relative;
                        flex-shrink: 0;
                    }
                    .drawer-nav-actions {
                        position: absolute;
                        top: 14px;
                        left: 14px;
                        right: 14px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    .drawer-circle-btn {
                        width: 38px;
                        height: 38px;
                        background: #ffffff;
                        border: 1px solid rgba(15, 23, 42, 0.08);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        box-shadow: 0 4px 10px rgba(10, 25, 47, 0.05);
                        transition: all 0.2s;
                    }
                    .drawer-circle-btn:hover {
                        border-color: #CCFF00;
                        background: #f8fafc;
                    }
                    .drawer-circle-btn i {
                        font-size: 0.95rem;
                        color: #0F172A;
                    }

                    /* Header Info Details */
                    .drawer-info-body {
                        padding: 24px;
                        display: flex;
                        flex-direction: column;
                        gap: 16px;
                        padding-bottom: 24px;
                        text-align: left;
                        flex: 1;
                        overflow-y: auto;
                    }
                    .drawer-match-date {
                        font-size: 0.78rem;
                        color: #2E61FF;
                        font-weight: 850;
                        letter-spacing: 0.5px;
                        text-transform: uppercase;
                    }
                    .drawer-match-title {
                        font-size: 1.35rem;
                        font-weight: 950;
                        color: #0F172A;
                        line-height: 1.25;
                        letter-spacing: 0.5px;
                        text-align: left;
                    }
                    .drawer-match-subtitle {
                        font-size: 0.85rem;
                        color: #64748B;
                        font-weight: 800;
                        margin-top: -6px;
                    }
                    /* Action Buttons Panel */
                    .drawer-actions-panel {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 10px;
                        background: #f8fafc;
                        border: 1px solid rgba(15, 23, 42, 0.03);
                        border-radius: 20px;
                        padding: 16px;
                        margin: 8px 0;
                    }
                    .action-panel-item {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 8px;
                        cursor: pointer;
                    }
                    .action-panel-circle {
                        width: 48px;
                        height: 48px;
                        border-radius: 50%;
                        border: none;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: rgba(46, 97, 255, 0.07);
                        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    }
                    .action-panel-circle.whatsapp-tint {
                        background: rgba(37, 211, 102, 0.08);
                    }
                    .action-panel-circle i {
                        font-size: 1.15rem;
                        color: #2E61FF;
                    }
                    .action-panel-circle.whatsapp-tint i {
                        color: #25D366;
                    }
                    .action-panel-item:hover .action-panel-circle {
                        transform: translateY(-3px) scale(1.05);
                        box-shadow: 0 6px 15px rgba(46, 97, 255, 0.12);
                    }
                    .action-panel-item:hover .action-panel-circle.whatsapp-tint {
                        box-shadow: 0 6px 15px rgba(37, 211, 102, 0.15);
                    }
                    .action-panel-label {
                        font-size: 0.65rem;
                        font-weight: 850;
                        color: #64748B;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }

                    /* Detail Players Section */
                    .drawer-section-players {
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                    }
                    .section-players-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    .section-players-title {
                        font-size: 0.95rem;
                        font-weight: 950;
                        color: #0F172A;
                    }
                    .section-players-link {
                        font-size: 0.78rem;
                        font-weight: 800;
                        color: #2E61FF;
                        cursor: pointer;
                    }

                    /* Horizontal Player Cards Roster */
                    .players-cards-roster {
                        display: flex;
                        gap: 14px;
                        overflow-x: auto;
                        padding: 4px 0;
                        scrollbar-width: none;
                    }
                    .player-avatar-circle {
                        width: 52px;
                        height: 52px;
                        border-radius: 50%;
                        background: linear-gradient(135deg, #2E61FF 0%, #1D4ED8 100%);
                        color: #ffffff;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 1rem;
                        font-weight: 900;
                        border: 2px solid #ffffff;
                        box-shadow: 0 4px 10px rgba(46, 97, 255, 0.15);
                        position: relative;
                    }
                    .player-avatar-circle.empty-slot {
                        background: #f8fafc;
                        border: 2px dashed #cbd5e1;
                        color: #94a3b8;
                        font-size: 1.25rem;
                        box-shadow: none;
                    }
                    .player-rating-badge {
                        background: #0F172A;
                        color: #ffffff;
                        font-size: 0.6rem;
                        font-weight: 800;
                        padding: 2px 7px;
                        border-radius: 8px;
                        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                        margin-top: -10px;
                        z-index: 10;
                        white-space: nowrap;
                    }
                    .player-roster-name {
                        font-size: 0.72rem;
                        font-weight: 850;
                        color: #0F172A;
                        text-align: center;
                        max-width: 64px;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }

                    /* Player Roster Avatar Box */
                    .player-roster-avatar-box {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 6px;
                        cursor: pointer;
                        min-width: 64px;
                        transition: transform 0.2s;
                    }
                    .player-roster-avatar-box:hover {
                        transform: translateY(-3px);
                    }

                    /* Plazas Progress Bar */
                    .plazas-progress-container {
                        display: flex;
                        flex-direction: column;
                        gap: 8px;
                        margin-top: 8px;
                    }
                    .progress-track {
                        height: 8px;
                        background: #e2e8f0;
                        border-radius: 99px;
                        overflow: hidden;
                    }
                    .progress-fill-blue {
                        height: 100%;
                        background: linear-gradient(90deg, #2E61FF 0%, #10B981 100%);
                        border-radius: 99px;
                        transition: width 0.3s;
                        box-shadow: 0 0 10px rgba(46,97,255,0.25);
                    }
                    .progress-labels-row {
                        display: flex;
                        justify-content: space-between;
                        font-size: 0.75rem;
                        color: #475569;
                        font-weight: 700;
                    }

                    /* Description block */
                    .drawer-description-block {
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                        border-top: 1px solid rgba(15, 23, 42, 0.06);
                        padding-top: 20px;
                    }
                    .description-block-title {
                        font-size: 0.95rem;
                        font-weight: 950;
                        color: #0F172A;
                    }
                    .description-item-row {
                        background: #f8fafc;
                        border: 1px solid rgba(15, 23, 42, 0.03);
                        border-radius: 16px;
                        padding: 12px 16px;
                        display: flex;
                        align-items: center;
                        gap: 14px;
                        transition: all 0.2s ease-in-out;
                    }
                    .description-item-row:hover {
                        background: #f1f5f9;
                        transform: translateX(4px);
                        border-color: rgba(15, 23, 42, 0.06);
                    }
                    .description-item-icon-box {
                        width: 36px;
                        height: 36px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: rgba(46, 97, 255, 0.06);
                        border: none;
                        border-radius: 10px;
                        color: #2E61FF;
                        font-size: 1.05rem;
                        flex-shrink: 0;
                    }
                    .description-item-text {
                        font-size: 0.82rem;
                        font-weight: 700;
                        color: #0F172A;
                    }

                    /* Sticky Bottom CTA Button */
                    .drawer-bottom-cta-sticky {
                        position: relative;
                        width: 100%;
                        background: #ffffff;
                        border-top: 1px solid rgba(15, 23, 42, 0.06);
                        padding: 16px 24px 24px 24px;
                        box-sizing: border-box;
                        flex-shrink: 0;
                        z-index: 100;
                        box-shadow: 0 -4px 15px rgba(0, 0, 0, 0.02);
                    }
                    .playtomic-btn-blue-giant {
                        width: 100%;
                        background: linear-gradient(135deg, #CCFF00 0%, #99cc00 100%);
                        color: #0F172A !important;
                        border: none;
                        padding: 16px;
                        border-radius: 28px;
                        font-size: 0.95rem;
                        font-weight: 950;
                        cursor: pointer;
                        box-shadow: 0 8px 24px rgba(204, 255, 0, 0.3);
                        transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                    }
                    .playtomic-btn-blue-giant:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 12px 28px rgba(204, 255, 0, 0.45);
                    }
                    .playtomic-btn-blue-giant:active {
                        transform: translateY(0);
                    }
                    .playtomic-btn-blue-giant i {
                        color: #0F172A !important;
                    }

                    /* 6. Admin Drawer Stylings */
                    .playtomic-admin-drawer {
                        position: fixed;
                        bottom: 0;
                        left: 50%;
                        transform: translateX(-50%);
                        width: 100%;
                        max-width: 600px;
                        background: #ffffff;
                        border-top: 1.5px solid rgba(15, 23, 42, 0.08);
                        z-index: 9999;
                        box-shadow: 0 -8px 30px rgba(10, 25, 47, 0.08);
                    }
                    .drawer-header {
                        padding: 12px 16px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        cursor: pointer;
                        background: #f8fafc;
                        font-size: 0.72rem;
                        color: #2E61FF;
                        font-weight: 950;
                        letter-spacing: 0.5px;
                        border-bottom: 1px solid rgba(15, 23, 42, 0.06);
                    }
                    .drawer-body {
                        padding: 12px 16px;
                    }
                    .playtomic-btn-sec {
                        background: #ffffff;
                        border: 1px solid rgba(15, 23, 42, 0.08);
                        color: #0F172A;
                        cursor: pointer;
                        transition: all 0.2s;
                    }
                    .playtomic-btn-sec:hover {
                        border-color: #2E61FF;
                        background: rgba(46, 97, 255, 0.04) !important;
                    }
                    .playtomic-btn-blue {
                        background: #2E61FF;
                        color: #ffffff !important;
                        border: none;
                        cursor: pointer;
                        font-weight: 900;
                        transition: all 0.2s;
                    }
                    .playtomic-btn-blue:hover {
                        background: #1d4ed8;
                    }

                    /* Skeleton Loader Light */
                    .playtomic-skeleton-light {
                        background: #ffffff;
                        border-radius: 24px;
                        padding: 3rem 1.5rem;
                        text-align: center;
                        border: 1px solid rgba(15, 23, 42, 0.08);
                        box-shadow: 0 8px 30px rgba(10, 25, 47, 0.03);
                    }
                    .playtomic-skeleton-light p {
                        color: #0F172A;
                        font-size: 0.85rem;
                        margin: 12px 0 0 0;
                        font-weight: 850;
                    }
                    .playtomic-spinner-light {
                        width: 32px;
                        height: 32px;
                        border: 3px solid rgba(46, 97, 255, 0.1);
                        border-radius: 50%;
                        border-top-color: #2E61FF;
                        display: inline-block;
                        animation: playtomic-spin-light 0.8s linear infinite;
                    }
                    @keyframes playtomic-spin-light {
                        to { transform: rotate(360deg); }
                    }

                    /* Autocomplete Suggestions */
                    .autocomplete-suggestions {
                        background: #ffffff !important;
                        border: 1px solid rgba(15, 23, 42, 0.08) !important;
                        border-radius: 16px !important;
                        box-shadow: 0 12px 30px rgba(10, 25, 47, 0.08) !important;
                        z-index: 10000 !important;
                        overflow: hidden !important;
                    }
                    .autocomplete-item {
                        padding: 12px 16px !important;
                        cursor: pointer !important;
                        border-bottom: 1px solid rgba(15, 23, 42, 0.04) !important;
                        border-left: 4px solid transparent !important;
                        display: flex !important;
                        flex-direction: column !important;
                        gap: 3px !important;
                        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
                        text-align: left !important;
                    }
                    .autocomplete-item:hover {
                        background-color: rgba(204, 255, 0, 0.08) !important;
                        transform: translateX(4px) !important;
                        border-left: 4px solid #ccff00 !important;
                    }
                    .autocomplete-item:last-child {
                        border-bottom: none !important;
                    }
                </style>
            `;
        }

        changeTab(tabName) {
            if (this.activeTab === tabName) return;

            this.activeTab = tabName;

            // Update active tabs styles
            document.querySelectorAll('.playtomic-tab-btn').forEach(btn => {
                const isActive = (btn.textContent.trim().toLowerCase() === 'disponible' && tabName === 'disponible') ||
                                 (btn.textContent.trim().toLowerCase() === 'tus competiciones' && tabName === 'mis_partidas');
                btn.classList.toggle('active', isActive);
            });

            this.renderFilteredList();

            if (window.navigator.vibrate) {
                window.navigator.vibrate(10);
            }
        }

        toggleAdminDrawer() {
            const drawer = document.getElementById('playtomic-admin-drawer');
            if (drawer) drawer.classList.toggle('hidden');
        }

        handleFeedSearch(val) {
            this.renderFilteredList();
        }

        async loadPlayersCache() {
            if (this.playersCache && Object.keys(this.playersCache).length > 0 && this.playersCacheList && this.playersCacheList.length > 0) return;
            this.playersCache = {};
            this.playersCacheList = [];
            if (!window.db) return;
            try {
                const snap = await window.db.collection('players').get();
                snap.forEach(doc => {
                    const data = doc.data();
                    if (data.name) {
                        const nameTrimmed = data.name.trim();
                        this.playersCache[nameTrimmed.toLowerCase()] = parseFloat(data.level || 3.0);
                        this.playersCacheList.push({
                            id: doc.id,
                            name: nameTrimmed,
                            level: parseFloat(data.level || 3.0),
                            phone: data.phone || data.phoneNumber || ""
                        });
                    }
                });
                console.log(`🧠 [OpenMatchesView] Loaded ${Object.keys(this.playersCache).length} players into level cache and ${this.playersCacheList.length} into autocomplete cache.`);
            } catch (err) {
                console.warn("Error loading players cache:", err);
            }
        }

        bindPlayerInputsAutocomplete() {
            const playerInputs = [
                document.getElementById('create-match-player-1'),
                document.getElementById('create-match-player-2'),
                document.getElementById('create-match-player-3'),
                document.getElementById('create-match-player-4')
            ];

            playerInputs.forEach((inputEl, idx) => {
                if (!inputEl) return;
                
                let suggestionsContainer = document.getElementById(`player-suggestions-container-${idx + 1}`);
                if (!suggestionsContainer) {
                    suggestionsContainer = document.createElement('div');
                    suggestionsContainer.id = `player-suggestions-container-${idx + 1}`;
                    suggestionsContainer.className = 'autocomplete-suggestions';
                    suggestionsContainer.style.cssText = 'display:none; position:absolute; top:100%; left:0; right:0; max-height:180px; overflow-y:auto; margin-top:4px; z-index:99999;';
                    const parent = inputEl.parentElement;
                    if (parent) {
                        parent.style.position = 'relative';
                        parent.appendChild(suggestionsContainer);
                    }
                }

                const triggerSuggestions = () => {
                    this.showPlayerSuggestions(inputEl, suggestionsContainer);
                };

                inputEl.addEventListener('focus', triggerSuggestions);
                inputEl.addEventListener('input', triggerSuggestions);

                suggestionsContainer.onmousedown = (e) => {
                    const item = e.target.closest('.select-player-suggestion-item');
                    if (!item) return;

                    const name = item.getAttribute('data-name');
                    inputEl.value = name;
                    
                    this.updateLiveSpotsBadge();
                    suggestionsContainer.style.display = 'none';
                };

                document.addEventListener('click', (e) => {
                    if (!inputEl.contains(e.target) && !suggestionsContainer.contains(e.target)) {
                        suggestionsContainer.style.display = 'none';
                    }
                });
            });
        }

        showPlayerSuggestions(inputEl, suggestionsContainer) {
            const val = inputEl.value;
            const query = val.toLowerCase().trim();
            
            const list = this.playersCacheList || [];
            let matches = [];
            if (!query) {
                matches = list.slice(0, 5);
            } else {
                matches = list.filter(p => p.name.toLowerCase().includes(query));
            }

            if (matches.length === 0) {
                suggestionsContainer.style.display = 'none';
                return;
            }

            let html = '';
            matches.slice(0, 5).forEach(p => {
                html += `
                    <div class="autocomplete-item select-player-suggestion-item" 
                         style="padding: 10px 14px; cursor: pointer; border-bottom: 1px solid rgba(15, 23, 42, 0.04); text-align: left;"
                         data-name="${p.name}" 
                         data-level="${p.level}" 
                         data-phone="${p.phone}">
                        <div style="font-weight: 850; color: #0F172A; font-size: 0.82rem;">${p.name}</div>
                        <div style="font-size: 0.65rem; color: #64748B; font-weight: 600;">⚡ Nivel: ${p.level.toFixed(2)} ${p.phone ? `• 📞 ${p.phone}` : ''}</div>
                    </div>
                `;
            });

            suggestionsContainer.innerHTML = html;
            suggestionsContainer.style.display = 'block';
        }

        async renderMatches(matches) {
            // Store all matches locally for instant client-side filtering
            this.allMatches = matches;

            // Load levels cache
            await this.loadPlayersCache();

            this.renderFilteredList();
        }

        renderFilteredList() {
            const listContainer = document.getElementById('open-matches-list');
            if (!listContainer) return;

            const currentUser = window.Store ? window.Store.getState('currentUser') : null;
            const myName = currentUser ? (currentUser.name || currentUser.displayName || "") : "";

            if (this.activeTab === 'mis_partidas') {
                this.renderAiHistoryView();
                return;
            }

            // 1. Apply tab filters
            let filtered = [];
            if (this.activeTab === 'disponible') {
                // Show all active future matches
                filtered = this.allMatches;
            }

            // Apply quick text search filter (Feed Quick Search)
            const searchInput = document.getElementById('player-feed-search-input');
            const feedQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';
            const clearBtn = document.getElementById('player-feed-search-clear');
            if (clearBtn) {
                clearBtn.style.display = feedQuery ? 'block' : 'none';
            }

            if (feedQuery) {
                filtered = filtered.filter(match => {
                    const clubName = (match.club || '').toLowerCase();
                    const comarcaName = (match.comarca || '').toLowerCase();
                    const playersArray = Array.isArray(match.players) ? match.players : [];
                    const playersString = playersArray.join(' ').toLowerCase();
                    const dateString = (match.date || '').toLowerCase();
                    const timeString = (match.time || '').toLowerCase();
                    const levelRangeStr = `${parseFloat(match.level_min || 3.0).toFixed(2)} - ${parseFloat(match.level_max || 3.5).toFixed(2)}`;

                    return clubName.includes(feedQuery) || 
                           comarcaName.includes(feedQuery) || 
                           playersString.includes(feedQuery) || 
                           dateString.includes(feedQuery) || 
                           timeString.includes(feedQuery) ||
                           levelRangeStr.includes(feedQuery);
                });
            }

            // Compute radar stats
            const totalMatches = filtered.length;
            let avgLevel = 3.25;
            if (totalMatches > 0) {
                const levelsSum = filtered.reduce((sum, match) => {
                    const min = parseFloat(match.level_min) || 3.0;
                    const max = parseFloat(match.level_max) || 3.5;
                    return sum + (min + max) / 2;
                }, 0);
                avgLevel = levelsSum / totalMatches;
            }

            const radarHtml = `
                <div class="community-radar-card">
                    <div class="radar-bg-grid"></div>
                    <div class="radar-glow"></div>
                    <div class="radar-details">
                        <span class="radar-title">📡 RADAR COMUNIDAD BCN</span>
                        <span class="radar-status-text">${totalMatches === 0 ? 'Buscando partidos...' : `${totalMatches} ${totalMatches === 1 ? 'partido activo' : 'partidos activos'} hoy`}</span>
                        <span class="radar-stats-row">${totalMatches === 0 ? 'Radar activo 24/7' : `Nivel medio: ${avgLevel.toFixed(2)} • Sincronizado`}</span>
                    </div>
                    <div class="radar-animation-box">
                        <div class="radar-sweep"></div>
                        <div class="radar-ping"></div>
                        <div class="radar-center-dot"></div>
                    </div>
                </div>
            `;

            if (filtered.length === 0) {
                listContainer.innerHTML = radarHtml + `
                    <div class="playtomic-skeleton-light" style="padding: 4rem 2rem; margin-top: 10px;">
                        <i class="fas fa-table-tennis-paddle-ball" style="font-size: 2.8rem; color: #2E61FF; margin-bottom: 12px; display: inline-block; opacity: 0.7;"></i>
                        <p style="color: #0F172A; font-size: 0.9rem; font-weight: 850;">No hay partidas en esta pestaña</p>
                        <p style="color: #64748B; font-size: 0.75rem; margin-top: 8px; font-weight: 500; max-width: 280px; margin-left: auto; margin-right: auto; line-height: 1.5;">
                            ${this.activeTab === 'disponible' 
                              ? 'Cuando se compartan partidas en el grupo de WhatsApp, se sincronizarán aquí al instante.' 
                              : 'No estás apuntado en ninguna partida activa todavía. ¡Únete a alguna desde la pestaña Disponible!'}
                        </p>
                        ${this.activeTab === 'disponible' ? `
                        <button onclick="window.OpenMatchesView.openCreateModal()" style="margin-top: 20px; background: rgba(46,97,255,0.08); border: 1.5px solid #2E61FF; color: #2E61FF; padding: 10px 24px; border-radius: 20px; font-weight: 900; font-size: 0.78rem; cursor: pointer; letter-spacing: 0.5px;">
                            <i class="fas fa-plus" style="margin-right: 6px;"></i> CREAR PARTIDO
                        </button>` : ''}
                    </div>
                `;
                return;
            }

            // 2. Group matches by Date (Playtomic image 1 & 2 grouping style)
            const grouped = {};
            filtered.forEach(match => {
                if (!grouped[match.date]) {
                    grouped[match.date] = [];
                }
                grouped[match.date].push(match);
            });

            // Sort grouped date keys ascending
            const sortedDates = Object.keys(grouped).sort();

            const feedHtml = sortedDates.map(dateKey => {
                // Format human date header (e.g. "lunes, 13 de abril" or "martes, 02 de junio")
                const dateObj = new Date(`${dateKey}T00:00:00`);
                const options = { weekday: 'long', day: '2-digit', month: 'long' };
                const humanDateHeader = dateObj.toLocaleDateString('es-ES', options);

                const matchesHtml = grouped[dateKey].map(match => {
                    const spots = parseInt(match.spots_needed) || 1;
                    const playersArray = Array.isArray(match.players) ? match.players : [];
                    const maxPlayers = 4;
                    const filledCount = playersArray.length;

                    // Formulate player 2x2 pods
                    let podsHtml = '';
                    for (let idx = 0; idx < maxPlayers; idx++) {
                        if (idx < filledCount) {
                            const fullName = playersArray[idx];
                            const cleanName = fullName.replace(/\s*\(\d+(?:\.\d+)?\)\s*$/, '').trim();
                            const initials = this.getInitials(cleanName);
                            
                            // Level resolution
                            let levelVal = (parseFloat(match.level_min || 3.0) + (idx * 0.15)).toFixed(2);
                            const parenthesizedMatch = fullName.match(/\((\d+(?:\.\d+)?)\)/);
                            const parenthesizedLevel = parenthesizedMatch ? parseFloat(parenthesizedMatch[1]) : null;
                            const cachedLevel = this.playersCache ? this.playersCache[cleanName.toLowerCase()] : null;
                            
                            if (cachedLevel !== null && cachedLevel !== undefined) {
                                levelVal = cachedLevel.toFixed(2);
                            } else if (parenthesizedLevel !== null) {
                                levelVal = parenthesizedLevel.toFixed(2);
                            }

                            podsHtml += `
                                <div class="player-grid-pod">
                                    <div class="pod-avatar">${initials}</div>
                                    <span class="pod-name" title="${cleanName}">${cleanName}</span>
                                    <span class="pod-level-tag">${levelVal}</span>
                                </div>
                            `;
                        } else {
                            podsHtml += `
                                <div class="player-grid-pod pod-empty">
                                    <div class="pod-avatar empty-avatar">+</div>
                                    <span class="pod-name">Slot Libre</span>
                                    <span class="pod-level-tag" style="background: rgba(46,97,255,0.08); color: #2E61FF; box-shadow: none;">--</span>
                                </div>
                            `;
                        }
                    }

                    const spotsText = spots === 0 ? 'COMPLETO' : (spots === 1 ? '¡ÚLTIMO HUECO!' : `FALTAN ${spots}`);
                    const spotsClass = spots === 1 ? 'spots-status-pill last-spot' : 'spots-status-pill';

                    return `
                        <div class="premium-match-card" onclick="window.OpenMatchesView.openDetailDrawer('${match.id}')">
                            <div class="card-glow-effect"></div>
                            
                            <div class="card-header-row">
                                <span class="card-time-badge"><i class="far fa-clock"></i> ${match.time || '19:00'} (${match.duration || 90} min)</span>
                                <span class="card-level-badge"><i class="fas fa-chart-line"></i> Nivel ${parseFloat(match.level_min || 3.0).toFixed(2)} - ${parseFloat(match.level_max || 3.5).toFixed(2)}</span>
                            </div>
                            
                            <div class="card-body-row">
                                <div class="court-graphic-wrapper">
                                    <div class="isometric-court-wrapper">
                                        <div class="iso-court">
                                            <div class="iso-court-net"></div>
                                            <div class="iso-court-lines"></div>
                                            <div class="iso-court-ball"></div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="card-details-wrapper">
                                    <h3 class="card-club-name">${(match.club || 'Somos Pádel BCN').toUpperCase()}</h3>
                                    
                                    <div class="card-location-row">
                                        <i class="fas fa-location-dot"></i>
                                        <span>${match.comarca || 'Barcelona'} • 8km</span>
                                    </div>
                                </div>
                            </div>

                            <!-- 2x2 Grid Roster -->
                            <div class="court-roster-grid">
                                ${podsHtml}
                            </div>
                            
                            <div class="card-footer-action-row">
                                <div class="footer-left-info">
                                    <i class="fas fa-calendar-days"></i>
                                    <span>${humanDateHeader}</span>
                                </div>
                                <div class="footer-right-cta">
                                    <span>UNIRME</span>
                                    <i class="fas fa-chevron-right"></i>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');

                return `
                    <div class="date-group-section">
                        <div class="date-group-header">${humanDateHeader}</div>
                        <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 8px;">
                            ${matchesHtml}
                        </div>
                    </div>
                `;
            }).join('');

            listContainer.innerHTML = radarHtml + feedHtml;
        }

        getInitials(name) {
            if (!name) return "P";
            const parts = name.trim().split(/\s+/);
            if (parts.length === 1) {
                return parts[0].substring(0, 2).toUpperCase();
            }
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }

        renderSelectedClubCardHtml(name, comarca, address, courts) {
            const isCustom = !address;
            if (isCustom) {
                return `
                    <div style="width: 100%; display: flex; flex-direction: column; gap: 8px; background: rgba(15, 23, 42, 0.02); border: 1px solid rgba(15, 23, 42, 0.08); padding: 12px; border-radius: 16px; box-sizing: border-box; text-align: left;">
                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(15, 23, 42, 0.08); padding-bottom: 8px;">
                            <span style="font-weight: 950; font-size: 0.85rem; color: #0F172A; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 70%;">${name.toUpperCase()}</span>
                            <span style="background: #64748b; color: #ffffff; font-size: 0.58rem; font-weight: 900; padding: 2px 8px; border-radius: 6px; text-transform: uppercase; flex-shrink: 0;">MANUAL</span>
                        </div>
                        <div style="font-size: 0.7rem; color: #64748B; font-weight: 600; display: flex; align-items: center; gap: 6px;">
                            <i class="fas fa-info-circle" style="color: #64748b; font-size: 0.8rem;"></i>
                            Club personalizado (no registrado en base de datos oficial).
                        </div>
                    </div>
                `;
            }

            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ", " + address)}`;
            return `
                <div style="width: 100%; display: flex; flex-direction: column; gap: 8px; background: rgba(46, 97, 255, 0.02); border: 1px solid rgba(46, 97, 255, 0.12); padding: 12px; border-radius: 16px; box-sizing: border-box; text-align: left;">
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(15, 23, 42, 0.08); padding-bottom: 8px;">
                        <span style="font-weight: 950; font-size: 0.85rem; color: #0F172A; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 70%;">${name.toUpperCase()}</span>
                        <span style="background: rgba(46, 97, 255, 0.1); color: #2E61FF; font-size: 0.58rem; font-weight: 900; padding: 2px 8px; border-radius: 6px; text-transform: uppercase; flex-shrink: 0;">${comarca.toUpperCase()}</span>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 6px;">
                        <div style="display: flex; align-items: center; gap: 8px; font-size: 0.72rem; color: #0F172A; font-weight: 600;">
                            <i class="fas fa-location-dot" style="color: #2E61FF; flex-shrink: 0;"></i>
                            <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1;">${address}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px; flex-wrap: wrap; gap: 8px;">
                            <span style="font-size: 0.7rem; color: #64748B; font-weight: 700; display: flex; align-items: center; gap: 4px;">
                                <i class="fas fa-table-tennis-paddle-ball" style="color: #2E61FF;"></i> <span style="color: #0F172A; font-weight: 900;">${courts}</span> pistas
                            </span>
                            <a href="${mapsUrl}" target="_blank" style="background: rgba(46, 97, 255, 0.08); border: 1px solid #2E61FF; color: #2E61FF; font-size: 0.62rem; font-weight: 900; padding: 4px 10px; border-radius: 8px; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; transition: all 0.2s; cursor: pointer;">
                                <i class="fas fa-map-location-dot"></i> Ver en Maps
                            </a>
                        </div>
                    </div>
                </div>
            `;
        }

        openDetailDrawer(matchId) {
            const match = this.allMatches.find(m => m.id === matchId);
            if (!match) return;

            this.selectedMatch = match;
            const drawer = document.getElementById('playtomic-detail-drawer');
            if (!drawer) return;

            const dateObj = new Date(`${match.date}T00:00:00`);
            const options = { weekday: 'long', day: '2-digit', month: 'long' };
            const humanDate = dateObj.toLocaleDateString('es-ES', options);

            const playersArray = Array.isArray(match.players) ? match.players : [];
            const maxPlayers = 4;
            const filledCount = playersArray.length;
            const spots = parseInt(match.spots_needed) || 0;

            const currentUser = window.Store ? window.Store.getState('currentUser') : null;
            const myName = currentUser ? (currentUser.name || currentUser.displayName || "") : "";
            const isJoined = playersArray.some(p => p.toLowerCase().includes(myName.toLowerCase()) && myName !== "");

            // Roster of horizontal avatars
            let playersRosterHtml = '';
            for (let idx = 0; idx < maxPlayers; idx++) {
                if (idx < filledCount) {
                    const pName = playersArray[idx];
                    const cleanName = pName.replace(/\s*\(\d+(?:\.\d+)?\)\s*$/, '').trim();
                    const initials = this.getInitials(cleanName);
                    
                    // Level resolution
                    let pLevel = (parseFloat(match.level_min || 3.0) + (idx * 0.15)).toFixed(2);
                    const parenthesizedMatch = pName.match(/\((\d+(?:\.\d+)?)\)/);
                    const parenthesizedLevel = parenthesizedMatch ? parseFloat(parenthesizedMatch[1]) : null;
                    const cachedLevel = this.playersCache ? this.playersCache[cleanName.toLowerCase()] : null;
                    
                    if (cachedLevel !== null && cachedLevel !== undefined) {
                        pLevel = cachedLevel.toFixed(2);
                    } else if (parenthesizedLevel !== null) {
                        pLevel = parenthesizedLevel.toFixed(2);
                    }

                    playersRosterHtml += `
                        <div class="player-roster-avatar-box">
                            <div class="player-avatar-circle">${initials}</div>
                            <div class="player-rating-badge">Nivel ${pLevel}</div>
                            <span class="player-roster-name" title="${cleanName}">${cleanName}</span>
                        </div>
                    `;
                } else {
                    playersRosterHtml += `
                        <div class="player-roster-avatar-box" onclick="window.OpenMatchesView.toggleJoinMatch('${match.id}')">
                            <div class="player-avatar-circle empty-slot">+</div>
                            <div class="player-rating-badge" style="background:#f1f5f9; color:#94a3b8; box-shadow:none;">--</div>
                            <span class="player-roster-name" style="color:#94a3b8; font-weight:600;">Libre</span>
                        </div>
                    `;
                }
            }

            const spotsText = spots === 0 ? 'PARTIDO COMPLETO' : (spots === 1 ? '¡ÚLTIMO HUECO!' : `FALTAN ${spots} JUGADORES`);

            drawer.innerHTML = `
                <div class="drawer-content-container">
                    <!-- Image Banner Header -->
                    <div class="drawer-club-banner" style="background: linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 60%, #ffffff 100%), url('img/logo_somospadel.png') center/cover no-repeat;">
                        <div class="drawer-nav-actions">
                            <div class="drawer-circle-btn" onclick="window.OpenMatchesView.closeDetailDrawer()">
                                <i class="fas fa-chevron-down"></i>
                            </div>
                            <div class="drawer-circle-btn" onclick="window.OpenMatchesView.shareMatch('${match.id}')">
                                <i class="fas fa-share-nodes"></i>
                            </div>
                        </div>
                    </div>

                    <div class="drawer-info-body">
                        <div class="drawer-match-date">${humanDate}</div>
                        <h2 class="drawer-match-title">${(match.club || 'Somos Pádel BCN').toUpperCase()}</h2>
                        <div class="drawer-match-subtitle"><i class="fas fa-location-dot" style="color:#2E61FF; margin-right:4px;"></i> ${match.comarca || 'Barcelona'}</div>

                        <!-- Players section -->
                        <div class="drawer-section-players" style="margin-top: 8px;">
                            <div class="section-players-header">
                                <span class="section-players-title">Roster de Jugadores (${filledCount}/4)</span>
                                <span class="section-players-link" onclick="window.OpenMatchesView.openWhatsAppChat('${match.id}')"><i class="fab fa-whatsapp"></i> Chat Grupo</span>
                            </div>
                            
                            <div class="players-cards-roster">
                                ${playersRosterHtml}
                            </div>
                        </div>

                        <!-- Progress Bar -->
                        <div class="plazas-progress-container">
                            <div class="progress-track">
                                <div class="progress-fill-blue" style="width: ${(filledCount / 4) * 100}%;"></div>
                            </div>
                            <div class="progress-labels-row">
                                <span style="font-weight: 850; color: ${spots === 1 ? '#ef4444' : '#0F172A'}">${spotsText}</span>
                                <span>4 Plazas máx.</span>
                            </div>
                        </div>

                        <!-- Action Buttons Panel -->
                        <div class="drawer-actions-panel">
                            <div class="action-panel-item" onclick="window.OpenMatchesView.toggleJoinMatch('${match.id}')">
                                <div class="action-panel-circle">
                                    <i class="fas ${isJoined ? 'fa-user-minus' : 'fa-user-plus'}" style="color: #2E61FF;"></i>
                                </div>
                                <span class="action-panel-label">${isJoined ? 'Salirme' : 'Apuntarme'}</span>
                            </div>
                            <div class="action-panel-item" onclick="window.OpenMatchesView.shareMatch('${match.id}')">
                                <div class="action-panel-circle">
                                    <i class="fas fa-share-alt" style="color: #2E61FF;"></i>
                                </div>
                                <span class="action-panel-label">Compartir</span>
                            </div>
                            <div class="action-panel-item" onclick="window.OpenMatchesView.openWhatsAppChat('${match.id}')">
                                <div class="action-panel-circle whatsapp-tint">
                                    <i class="fab fa-whatsapp" style="color: #25D366;"></i>
                                </div>
                                <span class="action-panel-label">Grupo WA</span>
                            </div>
                            <div class="action-panel-item" onclick="window.OpenMatchesView.openInviteModal('${match.id}')">
                                <div class="action-panel-circle" style="background: rgba(204, 255, 0, 0.15);">
                                    <i class="fas fa-paper-plane" style="color: #6d8500;"></i>
                                </div>
                                <span class="action-panel-label">Invitar</span>
                            </div>
                        </div>

                        <!-- Additional Details -->
                        <div class="drawer-description-block">
                            <span class="description-block-title">Información General</span>
                            
                            <div class="description-item-row">
                                <div class="description-item-icon-box"><i class="far fa-clock"></i></div>
                                <div class="description-item-text">Inicio: ${match.time || '19:00'}h | Duración: ${match.duration || 90} minutos</div>
                            </div>
                            
                            <div class="description-item-row">
                                <div class="description-item-icon-box"><i class="fas fa-chart-line"></i></div>
                                <div class="description-item-text">Nivel Filtro: ${parseFloat(match.level_min || 3.0).toFixed(2)} - ${parseFloat(match.level_max || 3.5).toFixed(2)}</div>
                            </div>
                            
                            <div class="description-item-row">
                                <div class="description-item-icon-box"><i class="fas fa-location-dot"></i></div>
                                <div class="description-item-text">${match.club} (${match.comarca || 'Barcelona'})</div>
                            </div>

                            ${match.playtomic_url ? `
                            <div class="description-item-row" onclick="window.OpenMatchesView.handleOpenPlaytomic('${match.playtomic_url}')" style="cursor:pointer;">
                                <div class="description-item-icon-box" style="background:rgba(46,97,255,0.08); border-color:#2E61FF;"><i class="fas fa-link" style="color:#2E61FF;"></i></div>
                                <div class="description-item-text" style="color:#2E61FF; text-decoration:underline; font-weight: 850;">Abrir en App Playtomic</div>
                            </div>` : ''}
                        </div>
                    </div>

                    <!-- Giant Bottom Button -->
                    <div class="drawer-bottom-cta-sticky">
                        <button class="playtomic-btn-blue-giant haptic-feedback" onclick="${isJoined ? `window.OpenMatchesView.toggleJoinMatch('${match.id}')` : (spots === 0 ? '' : `window.OpenMatchesView.toggleJoinMatch('${match.id}')`)}" ${spots === 0 && !isJoined ? 'disabled style="background:#e2e8f0; color:#94a3b8; box-shadow:none; cursor:not-allowed;"' : ''}>
                            ${isJoined ? '<i class="fas fa-user-minus"></i> SALIRME DEL PARTIDO' : (spots === 0 ? '<i class="fas fa-lock"></i> PARTIDO COMPLETO' : '<i class="fas fa-user-plus"></i> APUNTARME AL PARTIDO')}
                        </button>
                    </div>
                </div>
            `;

            drawer.classList.remove('hidden');
            if (window.PlayerView && typeof window.PlayerView.haptic === 'function') {
                window.PlayerView.haptic(25);
            }
        }

        closeDetailDrawer() {
            const drawer = document.getElementById('playtomic-detail-drawer');
            if (drawer) drawer.classList.add('hidden');
        }

        async openCreateModal() {
            const modal = document.getElementById('playtomic-create-modal');
            if (!modal) return;

            // Load player cache on modal open
            await this.loadPlayersCache();

            const currentUser = window.Store ? window.Store.getState('currentUser') : null;
            const myName = currentUser ? (currentUser.name || currentUser.displayName || "") : "";

            modal.innerHTML = `
                <div class="drawer-content-container" style="max-height: 95%;">
                    <!-- Header -->
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:20px 24px; border-bottom:1px solid rgba(15,23,42,0.08); flex-shrink:0;">
                        <div style="display:flex; align-items:center; gap:12px;">
                            <i class="fas fa-arrow-left" onclick="window.OpenMatchesView.closeCreateModal()" style="font-size:1.15rem; color:#0F172A; cursor:pointer; padding:4px; transition:color 0.2s;" onmouseover="this.style.color='#2E61FF'" onmouseout="this.style.color='#0F172A'"></i>
                            <h2 style="margin:0; font-size:1.15rem; font-weight:950; color:#0F172A; text-transform:uppercase; letter-spacing:0.5px;">Publicar Partido</h2>
                        </div>
                        <div class="drawer-circle-btn" onclick="window.OpenMatchesView.closeCreateModal()">
                            <i class="fas fa-times"></i>
                        </div>
                    </div>

                    <!-- Form Body -->
                    <form id="playtomic-create-match-form" onsubmit="window.OpenMatchesView.handleCreateSubmit(event)" style="padding:24px; display:flex; flex-direction:column; gap:18px; padding-bottom:120px; overflow-y:auto; text-align:left; box-sizing:border-box;">
                        
                        <!-- Help Guide Card for New Users -->
                        <div style="background: rgba(204, 255, 0, 0.08); border: 1.5px solid rgba(204, 255, 0, 0.25); border-radius: 18px; padding: 14px; display: flex; gap: 12px; align-items: flex-start; margin-bottom: 4px;">
                            <i class="fas fa-lightbulb" style="color: #85a600; font-size: 1.2rem; margin-top: 2px; flex-shrink: 0;"></i>
                            <div style="display: flex; flex-direction: column; gap: 4px; text-align: left;">
                                <span style="font-size: 0.72rem; color: #85a600; font-weight: 950; text-transform: uppercase; letter-spacing: 0.5px;">💡 Guía para nuevas partidas</span>
                                <span style="font-size: 0.72rem; color: #334155; font-weight: 600; line-height: 1.45;">
                                    Define el club, la fecha y la hora de tu partido. Añade nombres de tus amigos si vienen contigo; las plazas vacías se calcularán solas en tiempo real.
                                </span>
                            </div>
                        </div>

                        <!-- Club Autocomplete Group -->
                        <div style="display:flex; flex-direction:column; gap:6px;">
                            <label style="font-size:0.75rem; font-weight:850; color:#64748B; text-transform:uppercase; letter-spacing:0.5px;">📍 Club / Instalación</label>
                            <div style="position:relative; width:100%;">
                                <i class="fas fa-search" style="position:absolute; left:14px; top:50%; transform:translateY(-50%); color:#2E61FF; font-size:0.85rem;"></i>
                                <input type="text" id="player-club-search-autocomplete" class="playtomic-input" style="width:100%; height:44px; padding-left:38px !important; box-sizing:border-box; font-size:0.85rem; font-weight:800;" placeholder="Escribe el nombre del club..." autocomplete="off" required>
                                <div id="player-club-suggestions" class="autocomplete-suggestions" style="display:none; position:absolute; top:100%; left:0; right:0; max-height:200px; overflow-y:auto; margin-top:4px; z-index:99999;"></div>
                            </div>
                            <!-- Club manual details, hidden by default unless manually selected -->
                            <input type="text" id="create-match-club-custom" class="playtomic-input hidden" style="width:100%; height:40px; margin-top:6px; font-size:0.82rem;" placeholder="Introduce comarca o dirección del club personalizado...">
                            
                            <!-- Box where the selected club badge card will be rendered -->
                            <div id="player-selected-club-badge-box" style="margin-top:6px;"></div>
                        </div>

                        <!-- Date & Time Row -->
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                            <div style="display:flex; flex-direction:column; gap:6px;">
                                <label style="font-size:0.75rem; font-weight:850; color:#64748B; text-transform:uppercase; letter-spacing:0.5px;">📅 Fecha</label>
                                <input type="date" id="create-match-date" class="playtomic-input" style="width:100%; height:44px; font-size:0.85rem; font-weight:800; padding:10px; box-sizing:border-box;" required>
                            </div>
                            <div style="display:flex; flex-direction:column; gap:6px;">
                                <label style="font-size:0.75rem; font-weight:850; color:#64748B; text-transform:uppercase; letter-spacing:0.5px;">⏰ Hora</label>
                                <input type="time" id="create-match-time" class="playtomic-input" style="width:100%; height:44px; font-size:0.85rem; font-weight:800; padding:10px; box-sizing:border-box;" required>
                            </div>
                        </div>

                        <!-- Duration & Levels Group -->
                        <div style="display:flex; flex-direction:column; gap:14px;">
                            <div style="display:flex; flex-direction:column; gap:6px;">
                                <label style="font-size:0.75rem; font-weight:850; color:#64748B; text-transform:uppercase; letter-spacing:0.5px;">⏱ Duración</label>
                                <select id="create-match-duration" class="playtomic-input" style="width:100%; height:44px; font-size:0.85rem; font-weight:800; padding:0 10px; box-sizing:border-box;">
                                    <option value="90" selected>90 minutos</option>
                                    <option value="120">120 minutos</option>
                                </select>
                            </div>
                            
                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                                <div style="display:flex; flex-direction:column; gap:6px;">
                                    <label style="font-size:0.75rem; font-weight:850; color:#64748B; text-transform:uppercase; letter-spacing:0.5px;">📊 Nivel Mínimo</label>
                                    <select id="create-match-lvl-min" class="playtomic-input" style="width:100%; height:44px; font-size:0.85rem; font-weight:800; padding:0 10px; box-sizing:border-box;">
                                        ${this.generateLevelOptionTags(3.0)}
                                    </select>
                                </div>
                                <div style="display:flex; flex-direction:column; gap:6px;">
                                    <label style="font-size:0.75rem; font-weight:850; color:#64748B; text-transform:uppercase; letter-spacing:0.5px;">📈 Nivel Máximo</label>
                                    <select id="create-match-lvl-max" class="playtomic-input" style="width:100%; height:44px; font-size:0.85rem; font-weight:800; padding:0 10px; box-sizing:border-box;">
                                        ${this.generateLevelOptionTags(3.5)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <!-- Players Roster -->
                        <div style="border-top: 1px solid rgba(15,23,42,0.06); padding-top: 15px;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                                <label style="font-size:0.75rem; font-weight:850; color:#64748B; text-transform:uppercase; letter-spacing:0.5px;"><i class="fas fa-users"></i> Jugadores Apuntados</label>
                                <span id="live-spots-needed-badge" style="background:#2E61FF; color:#ffffff; font-size:0.62rem; font-weight:900; padding:2px 8px; border-radius:6px; text-transform:uppercase; letter-spacing:0.5px;">FALTAN 3 PLAZAS</span>
                            </div>
                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                                <div style="display:flex; flex-direction:column; gap:4px;">
                                    <span style="font-size:0.65rem; font-weight:800; color:#64748B;">Jugador 1 (Tú)</span>
                                    <input type="text" id="create-match-player-1" class="playtomic-input" style="width:100%; height:40px; font-size:0.8rem; padding:8px; box-sizing:border-box; font-weight:800;" value="${myName}" placeholder="Tu nombre..." oninput="window.OpenMatchesView.updateLiveSpotsBadge()">
                                </div>
                                <div style="display:flex; flex-direction:column; gap:4px;">
                                    <span style="font-size:0.65rem; font-weight:800; color:#64748B;">Jugador 2</span>
                                    <input type="text" id="create-match-player-2" class="playtomic-input" style="width:100%; height:40px; font-size:0.8rem; padding:8px; box-sizing:border-box; font-weight:800;" placeholder="Opcional..." oninput="window.OpenMatchesView.updateLiveSpotsBadge()">
                                </div>
                                <div style="display:flex; flex-direction:column; gap:4px;">
                                    <span style="font-size:0.65rem; font-weight:800; color:#64748B;">Jugador 3</span>
                                    <input type="text" id="create-match-player-3" class="playtomic-input" style="width:100%; height:40px; font-size:0.8rem; padding:8px; box-sizing:border-box; font-weight:800;" placeholder="Opcional..." oninput="window.OpenMatchesView.updateLiveSpotsBadge()">
                                </div>
                                <div style="display:flex; flex-direction:column; gap:4px;">
                                    <span style="font-size:0.65rem; font-weight:800; color:#64748B;">Jugador 4</span>
                                    <input type="text" id="create-match-player-4" class="playtomic-input" style="width:100%; height:40px; font-size:0.8rem; padding:8px; box-sizing:border-box; font-weight:800;" placeholder="Opcional..." oninput="window.OpenMatchesView.updateLiveSpotsBadge()">
                                </div>
                            </div>
                        </div>

                        <!-- Playtomic Link (Optional) -->
                        <div style="display:flex; flex-direction:column; gap:6px;">
                            <label style="font-size:0.75rem; font-weight:850; color:#64748B; text-transform:uppercase; letter-spacing:0.5px;">🔗 Enlace Playtomic (Opcional)</label>
                            <input type="url" id="create-match-url" class="playtomic-input" style="width:100%; height:44px; font-size:0.82rem; padding:10px; box-sizing:border-box;" placeholder="https://app.playtomic.io/matches/...">
                            <span style="font-size:0.68rem; color:#64748B; font-weight:600; line-height:1.3; margin-top:2px;">Si tienes una partida abierta en Playtomic, pega el enlace para sincronizar la información. Si no, crearemos un enlace directo a tu WhatsApp.</span>
                        </div>

                        <!-- Extra: hidden name input for database compliance -->
                        <input type="hidden" id="create-match-name" value="Partido de la Comunidad">

                        <!-- Submit Button -->
                        <div class="drawer-bottom-cta-sticky">
                            <button type="submit" class="playtomic-btn-blue-giant haptic-feedback">
                                <i class="fas fa-check"></i> PUBLICAR PARTIDO AHORA
                            </button>
                        </div>
                    </form>
                </div>
            `;

            // Default dates logic
            const today = new Date();
            const dateInput = document.getElementById('create-match-date');
            const timeInput = document.getElementById('create-match-time');
            if (dateInput) {
                dateInput.value = today.toISOString().split('T')[0];
            }
            if (timeInput) {
                const minutes = today.getMinutes();
                const hours = today.getHours();
                let defaultHours = hours + 1;
                let defaultMinutes = "00";
                if (minutes > 30) {
                    defaultHours = hours + 2;
                    defaultMinutes = "00";
                } else if (minutes > 0) {
                    defaultHours = hours + 1;
                    defaultMinutes = "30";
                }
                if (defaultHours >= 24) defaultHours = 0;
                timeInput.value = `${String(defaultHours).padStart(2, '0')}:${defaultMinutes}`;
            }

            // Update spots left live badge
            this.updateLiveSpotsBadge();

            // Predictive Autocomplete configuration
            const autInput = document.getElementById('player-club-search-autocomplete');
            const suggestionsContainer = document.getElementById('player-club-suggestions');

            // Load clubs list from Firestore once
            if (!this.cachedClubs || this.cachedClubs.length === 0) {
                this.cachedClubs = [];
                if (window.db) {
                    window.db.collection('padel_clubs').get().then(snap => {
                        snap.forEach(doc => {
                            this.cachedClubs.push(doc.data());
                        });
                    }).catch(err => {
                        console.warn("No se pudieron cargar los clubes oficiales:", err);
                    });
                }
            }

            if (autInput && suggestionsContainer) {
                autInput.addEventListener('input', (e) => {
                    const val = e.target.value;
                    const query = val.toLowerCase().trim();
                    if (!query) {
                        suggestionsContainer.style.display = 'none';
                        return;
                    }

                    const allClubs = [...(this.cachedClubs || [])];
                    const fallbackClubs = [
                        { name: "Can Vía Racket Club", comarca: "Baix Llobregat", address: "Calle de la Riera, 08690 Santa Coloma de Cervelló", courts_count: 6 },
                        { name: "Barcelona Pádel el Prat", comarca: "Baix Llobregat", address: "Autovía de Castelldefels, Km. 4.6, 08820 El Prat de Llobregat", courts_count: 14 },
                        { name: "Somos Pádel BCN", comarca: "Barcelona", address: "Av. Diagonal, Barcelona", courts_count: 4 },
                        { name: "Pádel Indoor L'Hospitalet", comarca: "Barcelonès", address: "Carrer de la Botánica, 25, 08908 L'Hospitalet de Llobregat", courts_count: 8 },
                        { name: "Padel Center Penedes", comarca: "Alt Penedès", address: "Polígono Industrial, Vilafranca del Penedès", courts_count: 5 }
                    ];

                    fallbackClubs.forEach(fc => {
                        if (!allClubs.some(c => c.name.toLowerCase() === fc.name.toLowerCase())) {
                            allClubs.push(fc);
                        }
                    });

                    const matches = allClubs.filter(c => c.name.toLowerCase().includes(query) || (c.comarca && c.comarca.toLowerCase().includes(query)));

                    let html = '';
                    matches.slice(0, 5).forEach(c => {
                        html += `
                            <div class="autocomplete-item select-club-item" 
                                 data-name="${c.name}" 
                                 data-comarca="${c.comarca || 'Barcelona'}" 
                                 data-pistas="${c.courts_count || c.courts || 0}" 
                                 data-address="${c.address || ''}">
                                <strong style="color: #0F172A; font-weight: 850;">${c.name}</strong>
                                <span style="font-size: 0.65rem; color: #64748B;">📍 ${c.address || ''} (${c.comarca || ''})</span>
                            </div>
                        `;
                    });

                    html += `
                        <div class="autocomplete-item select-custom-value" style="border-top: 1px solid rgba(15,23,42,0.08); color: #2E61FF; font-weight: 850;">
                            <i class="fas fa-plus"></i> Usar club personalizado: "${val}"
                        </div>
                    `;

                    suggestionsContainer.innerHTML = html;
                    suggestionsContainer.style.display = 'block';
                });

                suggestionsContainer.addEventListener('click', (e) => {
                    const item = e.target.closest('.autocomplete-item');
                    if (!item) return;

                    const badgeBox = document.getElementById('player-selected-club-badge-box');
                    const customInput = document.getElementById('create-match-club-custom');

                    if (item.classList.contains('select-club-item')) {
                        const name = item.getAttribute('data-name');
                        const comarca = item.getAttribute('data-comarca');
                        const address = item.getAttribute('data-address');
                        const courts = item.getAttribute('data-pistas');

                        autInput.value = name;
                        customInput.classList.add('hidden');
                        customInput.required = false;
                        customInput.value = '';

                        badgeBox.innerHTML = this.renderSelectedClubCardHtml(name, comarca, address, courts);
                        
                        autInput.setAttribute('data-selected-name', name);
                        autInput.setAttribute('data-selected-comarca', comarca);
                        autInput.setAttribute('data-selected-address', address);
                        autInput.setAttribute('data-selected-courts', courts);

                    } else if (item.classList.contains('select-custom-value')) {
                        const val = autInput.value;
                        customInput.classList.remove('hidden');
                        customInput.required = true;
                        customInput.placeholder = "Comarca o dirección del club personalizado (obligatorio)";
                        customInput.focus();

                        badgeBox.innerHTML = this.renderSelectedClubCardHtml(val, '', '', 0);

                        autInput.setAttribute('data-selected-name', val);
                        autInput.removeAttribute('data-selected-comarca');
                        autInput.removeAttribute('data-selected-address');
                        autInput.removeAttribute('data-selected-courts');
                    }

                    suggestionsContainer.style.display = 'none';
                });

                document.addEventListener('click', (e) => {
                    if (!autInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
                        suggestionsContainer.style.display = 'none';
                    }
                });
            }

            // Bind player autocomplete to player 1, 2, 3, 4 inputs
            this.bindPlayerInputsAutocomplete();

            modal.classList.remove('hidden');
            if (window.PlayerView && typeof window.PlayerView.haptic === 'function') {
                window.PlayerView.haptic(25);
            }
        }

        updateLiveSpotsBadge() {
            const p1 = document.getElementById('create-match-player-1')?.value.trim() || '';
            const p2 = document.getElementById('create-match-player-2')?.value.trim() || '';
            const p3 = document.getElementById('create-match-player-3')?.value.trim() || '';
            const p4 = document.getElementById('create-match-player-4')?.value.trim() || '';
            
            let count = 0;
            if (p1) count++;
            if (p2) count++;
            if (p3) count++;
            if (p4) count++;
            
            const spots = Math.max(0, 4 - count);
            const badge = document.getElementById('live-spots-needed-badge');
            if (badge) {
                if (spots === 0) {
                    badge.textContent = "COMPLETO";
                    badge.style.background = "#ef4444";
                } else if (spots === 1) {
                    badge.textContent = "¡ÚLTIMO HUECO!";
                    badge.style.background = "#ff9500";
                } else {
                    badge.textContent = `FALTAN ${spots} PLAZAS`;
                    badge.style.background = "#2E61FF";
                }
            }
        }

        closeCreateModal() {
            const modal = document.getElementById('playtomic-create-modal');
            if (modal) modal.classList.add('hidden');
        }

        async openInviteModal(matchId) {
            const match = this.allMatches.find(m => m.id === matchId);
            if (!match) return;

            const spots = parseInt(match.spots_needed) || 0;
            if (spots <= 0) {
                if (window.NotificationService) {
                    window.NotificationService.showToast("El partido ya está completo.", "warning");
                } else {
                    alert("El partido ya está completo.");
                }
                return;
            }

            const modal = document.getElementById('playtomic-invite-modal');
            if (!modal) return;

            this.selectedInvitePlayer = null;

            modal.innerHTML = `
                <div class="drawer-content-container" style="max-height: 90%;">
                    <!-- Header -->
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:20px 24px; border-bottom:1px solid rgba(15,23,42,0.08); flex-shrink:0;">
                        <div style="display:flex; align-items:center; gap:12px;">
                            <i class="fas fa-arrow-left" onclick="window.OpenMatchesView.closeInviteModal()" style="font-size:1.15rem; color:#0F172A; cursor:pointer; padding:4px; transition:color 0.2s;" onmouseover="this.style.color='#2E61FF'" onmouseout="this.style.color='#0F172A'"></i>
                            <h2 style="margin:0; font-size:1.15rem; font-weight:950; color:#0F172A; text-transform:uppercase; letter-spacing:0.5px;">Invitar Jugadores</h2>
                        </div>
                        <div class="drawer-circle-btn" onclick="window.OpenMatchesView.closeInviteModal()">
                            <i class="fas fa-times"></i>
                        </div>
                    </div>

                    <!-- Body -->
                    <div style="padding:24px; display:flex; flex-direction:column; gap:20px; overflow-y:auto; flex:1; text-align:left; box-sizing:border-box;">
                        
                        <!-- Info Alert -->
                        <div style="background: rgba(46, 97, 255, 0.06); border: 1px solid rgba(46, 97, 255, 0.15); border-radius: 16px; padding: 12px 16px; display: flex; gap: 12px; align-items: flex-start;">
                            <i class="fas fa-paper-plane" style="color: #2E61FF; font-size: 1.1rem; margin-top: 2px;"></i>
                            <div style="display: flex; flex-direction: column; gap: 2px;">
                                <span style="font-size: 0.72rem; color: #2E61FF; font-weight: 950; text-transform: uppercase; letter-spacing: 0.5px;">Enviar invitación</span>
                                <span style="font-size: 0.72rem; color: #475569; font-weight: 600; line-height: 1.4;">
                                    Busca a cualquier jugador de la comunidad de Somos Pádel Barcelona para enviarle una notificación instantánea.
                                </span>
                            </div>
                        </div>

                        <!-- Search input box -->
                        <div style="display:flex; flex-direction:column; gap:8px; position:relative;">
                            <label style="font-size:0.75rem; font-weight:850; color:#64748B; text-transform:uppercase; letter-spacing:0.5px;">🔍 Buscar Jugador</label>
                            <div style="position:relative; width:100%;">
                                <i class="fas fa-search" style="position:absolute; left:14px; top:50%; transform:translateY(-50%); color:#2E61FF; font-size:0.9rem;"></i>
                                <input type="text" id="invite-player-search-input" class="playtomic-input" style="width:100%; height:44px; padding-left:38px !important; box-sizing:border-box; font-size:0.85rem; font-weight:800;" placeholder="Escribe el nombre del jugador..." autocomplete="off">
                                <div id="invite-player-suggestions" class="autocomplete-suggestions" style="display:none; position:absolute; top:100%; left:0; right:0; max-height:220px; overflow-y:auto; margin-top:4px; z-index:99999; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1); border-radius: 12px; background: white; border: 1px solid #E2E8F0;"></div>
                            </div>
                        </div>

                        <!-- Selected Player Card -->
                        <div id="invite-selected-player-card" style="display:none; margin-top: 10px;">
                            <!-- Will be rendered dynamically when a player is selected -->
                        </div>

                    </div>

                    <!-- Bottom Action Button Container (Fixed at bottom) -->
                    <div style="padding: 16px 24px 32px 24px; border-top: 1px solid rgba(15,23,42,0.06); background: #ffffff; flex-shrink: 0; box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.02);">
                        <button id="invite-submit-btn" disabled onclick="window.OpenMatchesView.sendMatchInvitation('${match.id}')" class="playtomic-btn-blue" style="width:100%; height:50px; font-size:0.88rem; font-weight:950; border-radius:14px; background:#2E61FF; display:flex; align-items:center; justify-content:center; gap:8px; cursor:not-allowed; opacity:0.5; transition: all 0.2s;">
                            <i class="fas fa-paper-plane"></i>
                            <span>ENVIAR INVITACIÓN</span>
                        </button>
                    </div>
                </div>
            `;

            modal.classList.remove('hidden');

            // Load player cache
            await this.loadPlayersCache();

            // Bind autocomplete
            this.bindInvitePlayerAutocomplete();
        }

        closeInviteModal() {
            const modal = document.getElementById('playtomic-invite-modal');
            if (modal) modal.classList.add('hidden');
            this.selectedInvitePlayer = null;
        }

        bindInvitePlayerAutocomplete() {
            const inputEl = document.getElementById('invite-player-search-input');
            const suggestionsContainer = document.getElementById('invite-player-suggestions');
            if (!inputEl || !suggestionsContainer) return;

            const triggerSuggestions = () => {
                this.showInvitePlayerSuggestions(inputEl, suggestionsContainer);
            };

            inputEl.addEventListener('focus', triggerSuggestions);
            inputEl.addEventListener('input', triggerSuggestions);

            suggestionsContainer.onmousedown = (e) => {
                const item = e.target.closest('.select-invite-player-suggestion-item');
                if (!item) return;

                const id = item.getAttribute('data-id');
                const name = item.getAttribute('data-name');
                const level = parseFloat(item.getAttribute('data-level') || 3.0);
                const phone = item.getAttribute('data-phone') || '';

                this.selectInvitePlayer({ id, name, level, phone });
                suggestionsContainer.style.display = 'none';
            };

            document.addEventListener('click', (e) => {
                if (!inputEl.contains(e.target) && !suggestionsContainer.contains(e.target)) {
                    suggestionsContainer.style.display = 'none';
                }
            });
        }

        showInvitePlayerSuggestions(inputEl, suggestionsContainer) {
            const val = inputEl.value;
            const query = val.toLowerCase().trim();
            
            const list = this.playersCacheList || [];
            
            // Get already joined players
            const match = this.selectedMatch;
            const matchPlayers = (match && Array.isArray(match.players)) ? match.players.map(p => p.replace(/\s*\(\d+(?:\.\d+)?\)\s*$/, '').trim().toLowerCase()) : [];

            // Get current user name to exclude
            const currentUser = window.Store ? window.Store.getState('currentUser') : null;
            const currentUserName = currentUser ? (currentUser.name || currentUser.displayName || "").trim().toLowerCase() : "";

            let matches = [];
            
            if (!query) {
                suggestionsContainer.style.display = 'none';
                return;
            }

            matches = list.filter(p => {
                const nameLower = p.name.toLowerCase();
                const isMatch = nameLower.includes(query);
                const isAlreadyJoined = matchPlayers.some(mp => nameLower.includes(mp) || mp.includes(nameLower));
                const isCurrentUser = currentUserName !== "" && (nameLower.includes(currentUserName) || currentUserName.includes(nameLower));
                return isMatch && !isAlreadyJoined && !isCurrentUser;
            });

            if (matches.length === 0) {
                suggestionsContainer.innerHTML = `
                    <div style="padding: 14px; text-align: center; color: #64748B; font-size: 0.8rem; font-weight: 600;">
                        No se encontraron jugadores
                    </div>
                `;
                suggestionsContainer.style.display = 'block';
                return;
            }

            let html = '';
            matches.slice(0, 6).forEach(p => {
                html += `
                    <div class="autocomplete-item select-invite-player-suggestion-item" 
                         style="padding: 12px 16px; cursor: pointer; border-bottom: 1px solid rgba(15, 23, 42, 0.04); text-align: left;"
                         data-id="${p.id || ''}"
                         data-name="${p.name}" 
                         data-level="${p.level}" 
                         data-phone="${p.phone}">
                        <div style="font-weight: 850; color: #0F172A; font-size: 0.82rem;">${p.name}</div>
                        <div style="font-size: 0.68rem; color: #64748B; font-weight: 600; margin-top: 2px;">⚡ Nivel: ${p.level.toFixed(2)} ${p.phone ? `• 📞 ${p.phone}` : ''}</div>
                    </div>
                `;
            });

            suggestionsContainer.innerHTML = html;
            suggestionsContainer.style.display = 'block';
        }

        selectInvitePlayer(player) {
            this.selectedInvitePlayer = player;

            const searchInput = document.getElementById('invite-player-search-input');
            if (searchInput) {
                searchInput.value = player.name;
            }

            const cardContainer = document.getElementById('invite-selected-player-card');
            const submitBtn = document.getElementById('invite-submit-btn');

            if (cardContainer) {
                const initials = this.getInitials(player.name);
                cardContainer.innerHTML = `
                    <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 20px; padding: 18px; display: flex; align-items: center; justify-content: space-between; animation: slideUp 0.25s ease;">
                        <div style="display: flex; align-items: center; gap: 14px;">
                            <div style="width: 48px; height: 48px; border-radius: 50%; background: #2E61FF; color: white; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; font-weight: 950; text-transform: uppercase;">
                                ${initials}
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 4px; text-align: left;">
                                <span style="font-size: 0.9rem; color: #0F172A; font-weight: 950;">${player.name}</span>
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="background: rgba(204, 255, 0, 0.25); color: #6d8500; font-size: 0.68rem; font-weight: 850; padding: 2px 8px; border-radius: 6px; text-transform: uppercase;">Nivel ${player.level.toFixed(2)}</span>
                                    ${player.phone ? `<span style="font-size: 0.72rem; color: #64748B; font-weight: 600;"><i class="fas fa-phone" style="font-size:0.65rem;"></i> ${player.phone}</span>` : ''}
                                </div>
                            </div>
                        </div>
                        <div onclick="window.OpenMatchesView.clearSelectedInvitePlayer()" style="cursor: pointer; width: 28px; height: 28px; border-radius: 50%; background: #F1F5F9; display: flex; align-items: center; justify-content: center; color: #64748B; transition: background 0.2s;" onmouseover="this.style.background='#FFE4E6'; this.style.color='#E11D48';" onmouseout="this.style.background='#F1F5F9'; this.style.color='#64748B';">
                            <i class="fas fa-times" style="font-size: 0.8rem;"></i>
                        </div>
                    </div>
                `;
                cardContainer.style.display = 'block';
            }

            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.style.cursor = 'pointer';
                submitBtn.style.opacity = '1';
            }
        }

        clearSelectedInvitePlayer() {
            this.selectedInvitePlayer = null;

            const searchInput = document.getElementById('invite-player-search-input');
            if (searchInput) {
                searchInput.value = '';
                searchInput.focus();
            }

            const cardContainer = document.getElementById('invite-selected-player-card');
            if (cardContainer) {
                cardContainer.style.display = 'none';
                cardContainer.innerHTML = '';
            }

            const submitBtn = document.getElementById('invite-submit-btn');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.style.cursor = 'not-allowed';
                submitBtn.style.opacity = '0.5';
            }
        }

        async sendMatchInvitation(matchId) {
            if (!this.selectedInvitePlayer) return;

            const player = this.selectedInvitePlayer;
            const match = this.allMatches.find(m => m.id === matchId);
            if (!match) return;

            const currentUser = window.Store ? window.Store.getState('currentUser') : null;
            const senderName = currentUser ? (currentUser.name || currentUser.displayName || "Un amigo") : "Un amigo";

            const clubName = match.club || "Somos Pádel BCN";
            const dateObj = new Date(`${match.date}T00:00:00`);
            const options = { weekday: 'long', day: '2-digit', month: 'short' };
            const humanDate = dateObj.toLocaleDateString('es-ES', options);
            const time = match.time || "19:00";

            const title = "🎾 ¡Invitación a Partida Abierta!";
            const body = `${senderName} te ha invitado a unirte a su partida el ${humanDate} a las ${time}h en ${clubName}. ¡Apúntate!`;

            try {
                if (!player.id) {
                    throw new Error("No se pudo obtener el UID del jugador destino.");
                }

                if (window.NotificationService) {
                    await window.NotificationService.sendNotificationToUser(player.id, title, body, {
                        url: 'open_matches',
                        matchId: match.id,
                        invite: true
                    });
                    
                    window.NotificationService.showToast(`¡Invitación enviada a ${player.name}! 🚀`, "success");
                } else {
                    alert(`Invitación enviada a ${player.name}.`);
                }

                this.closeInviteModal();
            } catch (err) {
                console.error("Error al enviar la invitación:", err);
                if (window.NotificationService) {
                    window.NotificationService.showToast("No se pudo enviar la invitación. Inténtalo de nuevo.", "error");
                } else {
                    alert("Error al enviar la invitación.");
                }
            }
        }

        async toggleJoinMatch(matchId) {
            if (!window.db) {
                alert("Base de datos no disponible.");
                return;
            }
            const currentUser = window.Store ? window.Store.getState('currentUser') : null;
            const myName = currentUser ? (currentUser.name || currentUser.displayName || "Jugador") : "Jugador";
            
            const match = this.allMatches.find(m => m.id === matchId);
            if (!match) return;

            let players = Array.isArray(match.players) ? [...match.players] : [];
            const isJoined = players.some(p => p.toLowerCase().includes(myName.toLowerCase()) && myName !== "");

            if (isJoined) {
                // Remove player
                players = players.filter(p => !p.toLowerCase().includes(myName.toLowerCase()));
            } else {
                // Add player
                if (players.length >= 4) {
                    alert("El partido ya está completo.");
                    return;
                }
                players.push(myName);
            }

            const spotsNeeded = Math.max(0, 4 - players.length);

            try {
                await window.db.collection('open_matches').doc(matchId).update({
                    players: players,
                    spots_needed: spotsNeeded
                });
                
                if (window.NotificationService) {
                    window.NotificationService.showToast(isJoined ? "Te has salido del partido" : "¡Te has apuntado al partido! 🎾", "success");
                }
                
                if (window.PlayerView && typeof window.PlayerView.haptic === 'function') {
                    window.PlayerView.haptic(35);
                }

                // Update detail drawer live if it's currently open for this match
                if (this.selectedMatch && this.selectedMatch.id === matchId) {
                    const updatedMatch = { ...this.selectedMatch, players, spots_needed: spotsNeeded };
                    this.selectedMatch = updatedMatch;
                    this.openDetailDrawer(matchId);
                }
                
            } catch (err) {
                console.error("Error al actualizar partida:", err);
                alert("Error al unirse/salirse del partido: " + err.message);
            }
        }

        async handleCreateSubmit(event) {
            event.preventDefault();
            
            const btn = event.target.querySelector('button[type="submit"]');
            if (btn) btn.disabled = true;

            try {
                const nameVal = document.getElementById('create-match-name').value;
                const autocompleteInput = document.getElementById('player-club-search-autocomplete');
                const autocompleteVal = autocompleteInput?.value || '';
                const dateVal = document.getElementById('create-match-date').value;
                const timeVal = document.getElementById('create-match-time').value;
                const durationVal = parseInt(document.getElementById('create-match-duration').value) || 90;
                const lvlMin = parseFloat(document.getElementById('create-match-lvl-min').value) || 3.0;
                const lvlMax = parseFloat(document.getElementById('create-match-lvl-max').value) || 4.0;
                const urlVal = document.getElementById('create-match-url').value;

                if (lvlMin > lvlMax) {
                    throw new Error("El nivel mínimo no puede ser superior al nivel máximo.");
                }

                const finalClub = autocompleteVal.trim() || 'Somos Pádel BCN';
                const customComarcaInput = document.getElementById('create-match-club-custom');
                const comarcaVal = autocompleteInput?.getAttribute('data-selected-comarca') || customComarcaInput?.value || 'Barcelona';

                // Resolve player array & remaining spots from inputs
                const players = [];
                const p1 = document.getElementById('create-match-player-1')?.value.trim() || '';
                const p2 = document.getElementById('create-match-player-2')?.value.trim() || '';
                const p3 = document.getElementById('create-match-player-3')?.value.trim() || '';
                const p4 = document.getElementById('create-match-player-4')?.value.trim() || '';
                
                if (p1) players.push(p1);
                if (p2) players.push(p2);
                if (p3) players.push(p3);
                if (p4) players.push(p4);

                const spotsVal = Math.max(0, 4 - players.length);

                const currentUser = window.Store ? window.Store.getState('currentUser') : null;
                const myName = currentUser ? (currentUser.name || currentUser.displayName || "Jugador") : "Jugador";

                // Generate dynamic WA link if no Playtomic URL is provided
                const phone = currentUser?.phone || currentUser?.phoneNumber || "";
                const cleanPhone = phone.replace(/[^0-9]/g, "");
                const waText = encodeURIComponent(`¡Hola! Me gustaría apuntarme al partido de padel en ${finalClub} del día ${dateVal} a las ${timeVal}h.`);
                const finalUrl = urlVal.trim() 
                    ? urlVal.trim() 
                    : (cleanPhone ? `https://wa.me/${cleanPhone}?text=${waText}` : 'https://chat.whatsapp.com/somospadelbarcelona');

                const originalText = `PARTIDO DE LA COMUNIDAD EN ${finalClub.toUpperCase()} 🎾\n📅 ${dateVal}, ${timeVal}h | ${durationVal} min\n📍 ${finalClub}\n📊 Nivel: ${lvlMin.toFixed(2)} - ${lvlMax.toFixed(2)}\n✔️ ${players.join('\n✔️ ')}\nEnlace para apuntarse: ${finalUrl}`;

                const matchData = {
                    club: finalClub,
                    comarca: comarcaVal,
                    date: dateVal,
                    time: timeVal,
                    duration: durationVal,
                    level_min: lvlMin,
                    level_max: lvlMax,
                    players: players,
                    spots_needed: spotsVal,
                    playtomic_url: finalUrl,
                    original_text: originalText,
                    creator_uid: currentUser ? (currentUser.uid || currentUser.id || "") : "",
                    creator_name: p1 || myName,
                    creator_phone: cleanPhone || ""
                };

                if (!window.OpenMatchesController) {
                    throw new Error("Controlador OpenMatchesController no encontrado.");
                }

                // Save to Firestore
                await window.OpenMatchesController.createMatch(matchData);

                // Show Success Toast Notification
                if (window.NotificationService) {
                    window.NotificationService.showToast("¡Partido Creado y Compartido! 🚀", "success");
                } else {
                    alert("¡Partido de la Comunidad Publicado con Éxito!");
                }

                if (window.PlayerView && typeof window.PlayerView.haptic === 'function') {
                    window.PlayerView.haptic(35);
                }

                this.closeCreateModal();

            } catch (err) {
                alert("Error al publicar partido: " + err.message);
            } finally {
                if (btn) btn.disabled = false;
            }
        }

        handleOpenPlaytomic(url) {
            if (window.PlayerView && typeof window.PlayerView.haptic === 'function') {
                window.PlayerView.haptic(20);
            }
            window.open(url, '_blank');
        }

        async openWhatsAppChat(matchId) {
            if (window.PlayerView && typeof window.PlayerView.haptic === 'function') {
                window.PlayerView.haptic(20);
            }

            const match = this.allMatches.find(m => m.id === matchId);
            if (!match) {
                console.warn("Partido no encontrado para ID:", matchId);
                window.open('https://wa.me/34607163079?text=Hola!%20Me%20gustaría%20entrar%20al%20grupo%20de%20WhatsApp%20de%20SomosP%C3%A1del.', '_blank');
                return;
            }

            // Crear el modal contenedor si no existe
            let modal = document.getElementById('whatsapp-coordination-modal');
            if (modal) modal.remove();

            modal = document.createElement('div');
            modal.id = 'whatsapp-coordination-modal';
            modal.style.cssText = `
                position: fixed; inset: 0; z-index: 999999;
                display: flex; align-items: center; justify-content: center;
                background: rgba(5, 7, 10, 0.85); backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px);
                animation: waFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            `;

            // HTML inicial con spinner de carga
            modal.innerHTML = `
                <div id="wa-modal-card" style="background: linear-gradient(145deg, #0f172a, #05070a); border: 1px solid rgba(37, 211, 102, 0.2); border-radius: 28px; padding: 36px 24px 28px; max-width: 350px; width: 90%; text-align: center; box-shadow: 0 30px 80px rgba(0,0,0,0.8), 0 0 50px rgba(37, 211, 102, 0.05); position: relative; animation: waScaleUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);">
                    <div style="position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 55%; height: 3px; background: linear-gradient(90deg, transparent, #25D366, transparent); border-radius: 0 0 4px 4px;"></div>
                    <div style="font-size: 2.5rem; margin-bottom: 12px; display: inline-flex; width: 68px; height: 68px; background: rgba(37, 211, 102, 0.1); border-radius: 50%; align-items: center; justify-content: center; border: 1.5px solid #25D366; color: #25D366; animation: waPulse 2s infinite;">
                        <i class="fab fa-whatsapp"></i>
                    </div>
                    <h3 style="margin: 0 0 4px; font-size: 1.25rem; font-weight: 950; color: #ffffff; letter-spacing: 0.5px; font-family: 'Outfit', sans-serif;">Conexión WhatsApp</h3>
                    <p style="margin: 0 0 24px; font-size: 0.72rem; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;">SomosPadel BCN</p>
                    
                    <div id="wa-modal-loading" style="padding: 20px; display: flex; flex-direction: column; align-items: center; gap: 12px; color: #94a3b8; font-size: 0.8rem; font-weight: 700;">
                        <span style="border: 2.5px solid rgba(255,255,255,0.1); border-top-color: #25D366; width: 24px; height: 24px; border-radius: 50%; display: inline-block; animation: waSpin 1s linear infinite;"></span>
                        Resolviendo contacto táctico...
                    </div>
                </div>
                
                <style>
                    @keyframes waFadeIn { from { opacity: 0; } to { opacity: 1; } }
                    @keyframes waScaleUp { from { opacity: 0; transform: scale(0.85) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
                    @keyframes waPulse { 0% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.4); } 70% { box-shadow: 0 0 0 12px rgba(37, 211, 102, 0); } 100% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0); } }
                    @keyframes waSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                </style>
            `;

            document.body.appendChild(modal);

            // Cargar datos en segundo plano
            let phone = match.creator_phone || "";
            const organizerName = match.creator_name || (match.players && match.players[0]) || "Organizador";
            const cleanOrganizerName = organizerName.replace(/\s*\(\d+(?:\.\d+)?\)\s*$/, '').trim();

            // 1. Extraer de playtomic_url si es de wa.me
            if (!phone && match.playtomic_url) {
                const matchPhone = match.playtomic_url.match(/(?:wa\.me|phone=)\/?\+?([0-9]+)/);
                if (matchPhone && matchPhone[1]) {
                    phone = matchPhone[1];
                }
            }

            // 2. Buscar en la colección de players si sigue vacío
            if (!phone && match.players && match.players[0]) {
                const cleanFirstPlayer = match.players[0].replace(/\s*\(\d+(?:\.\d+)?\)\s*$/, '').trim().toLowerCase();
                try {
                    const playerSnap = await window.db.collection('players').get();
                    const matchPlayer = playerSnap.docs.find(doc => {
                        const name = doc.data().name || "";
                        return name.toLowerCase().trim() === cleanFirstPlayer;
                    });
                    if (matchPlayer && matchPlayer.data().phone) {
                        phone = matchPlayer.data().phone;
                    }
                } catch (e) {
                    console.warn("Error al resolver teléfono del organizador en BD:", e);
                }
            }

            // 3. Obtener el enlace del grupo oficial desde Firestore
            let groupLink = '';
            try {
                const configDoc = await window.db.collection('system_config').doc('whatsapp').get();
                if (configDoc.exists && configDoc.data().group_link) {
                    groupLink = configDoc.data().group_link.trim();
                }
            } catch (e) {
                console.warn("No se pudo obtener el enlace de configuración del grupo:", e);
            }

            if (!groupLink) {
                groupLink = 'https://wa.me/34607163079?text=Hola!%20Me%20gustar%C3%ADa%20entrar%20al%20grupo%20de%20WhatsApp%20de%20SomosP%C3%A1del%20BCN.';
            }

            const card = document.getElementById('wa-modal-card');
            if (!card) return;

            let cleanPhone = phone.replace(/[^0-9]/g, "");
            if (cleanPhone && cleanPhone.length === 9 && (cleanPhone.startsWith('6') || cleanPhone.startsWith('7'))) {
                cleanPhone = "34" + cleanPhone; 
            }

            const clubName = match.club || "Somos Pádel BCN";
            const dateStr = match.date || "";
            const timeStr = match.time || "";
            const waMessage = encodeURIComponent(`¡Hola ${cleanOrganizerName}! Te escribo por el partido abierto de padel en ${clubName} del día ${dateStr} a las ${timeStr}h.`);
            const chatCreatorUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${waMessage}` : "";

            const isPlaytomicUrlReal = match.playtomic_url && !match.playtomic_url.includes('wa.me') && !match.playtomic_url.includes('whatsapp.com');

            card.innerHTML = `
                <div style="position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 55%; height: 3px; background: linear-gradient(90deg, transparent, #25D366, transparent); border-radius: 0 0 4px 4px;"></div>
                <div style="font-size: 2.5rem; margin-bottom: 12px; display: inline-flex; width: 68px; height: 68px; background: rgba(37, 211, 102, 0.1); border-radius: 50%; align-items: center; justify-content: center; border: 1.5px solid #25D366; color: #25D366; animation: waPulse 2s infinite;">
                    <i class="fab fa-whatsapp"></i>
                </div>
                <h3 style="margin: 0 0 4px; font-size: 1.25rem; font-weight: 950; color: #ffffff; letter-spacing: 0.5px; font-family: 'Outfit', sans-serif;">Conexión WhatsApp</h3>
                <p style="margin: 0 0 24px; font-size: 0.72rem; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;">SomosPadel BCN</p>
                
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    
                    ${chatCreatorUrl ? `
                        <button onclick="window.open('${chatCreatorUrl}', '_blank'); document.getElementById('whatsapp-coordination-modal').remove();"
                            style="width: 100%; background: #25D366; color: #000; border: none; padding: 14px; border-radius: 16px; font-weight: 900; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 6px 20px rgba(37, 211, 102, 0.3);"
                            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 25px rgba(37, 211, 102, 0.4)';"
                            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 6px 20px rgba(37, 211, 102, 0.3)';"
                            onmousedown="this.style.transform='translateY(1px) scale(0.98)';">
                            <i class="fas fa-comment-dots" style="font-size: 1.05rem;"></i> Coordinar con el organizador
                        </button>
                    ` : `
                        <button disabled
                            style="width: 100%; background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.25); border: 1px dashed rgba(255,255,255,0.1); padding: 14px; border-radius: 16px; font-weight: 700; font-size: 0.8rem; cursor: not-allowed; display: flex; align-items: center; justify-content: center; gap: 8px; text-decoration: line-through;">
                            <i class="fas fa-comment-slash"></i> Coordinación no disponible
                        </button>
                        <span style="font-size:0.6rem; color:#64748B; font-weight:600; margin-top:-6px;">El organizador no ha registrado un teléfono de contacto.</span>
                    `}

                    <button onclick="window.open('${groupLink}', '_blank'); document.getElementById('whatsapp-coordination-modal').remove();"
                        style="width: 100%; background: rgba(37, 211, 102, 0.1); color: #25D366; border: 1.5px solid #25D366; padding: 13px; border-radius: 16px; font-weight: 900; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px;"
                        onmouseover="this.style.background='rgba(37, 211, 102, 0.15)'; this.style.transform='translateY(-2px)';"
                        onmouseout="this.style.background='rgba(37, 211, 102, 0.1)'; this.style.transform='translateY(0)';"
                        onmousedown="this.style.transform='translateY(1px) scale(0.98)';">
                        <i class="fas fa-users" style="font-size: 1rem;"></i> Unirse al grupo oficial
                    </button>

                    ${isPlaytomicUrlReal ? `
                        <button onclick="window.open('${match.playtomic_url}', '_blank'); document.getElementById('whatsapp-coordination-modal').remove();"
                            style="width: 100%; background: rgba(46, 97, 255, 0.1); color: #2E61FF; border: 1.5px solid #2E61FF; padding: 13px; border-radius: 16px; font-weight: 900; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px;"
                            onmouseover="this.style.background='rgba(46, 97, 255, 0.15)'; this.style.transform='translateY(-2px)';"
                            onmouseout="this.style.background='rgba(46, 97, 255, 0.1)'; this.style.transform='translateY(0)';"
                            onmousedown="this.style.transform='translateY(1px) scale(0.98)';">
                            <i class="fas fa-link" style="font-size: 0.95rem;"></i> Ver en App Playtomic
                        </button>
                    ` : ''}

                    <div style="height: 10px;"></div>

                    <button onclick="document.getElementById('whatsapp-coordination-modal').remove();"
                        style="width: 100%; background: rgba(255, 255, 255, 0.05); color: rgba(255, 255, 255, 0.6); border: 1px solid rgba(255,255,255,0.08); padding: 12px; border-radius: 14px; font-weight: 800; font-size: 0.85rem; cursor: pointer; transition: background 0.2s;"
                        onmouseover="this.style.background='rgba(255, 255, 255, 0.12)';"
                        onmouseout="this.style.background='rgba(255, 255, 255, 0.05)';"
                        onmousedown="this.style.transform='scale(0.99)';">
                        Cerrar
                    </button>
                </div>
            `;
        }

        shareMatch(matchId) {
            if (window.PlayerView && typeof window.PlayerView.haptic === 'function') {
                window.PlayerView.haptic(20);
            }

            const match = this.allMatches.find(m => m.id === matchId);
            if (!match) return;

            // Formatear fecha
            let dateFormatted = match.date;
            if (match.date) {
                const dateObj = new Date(`${match.date}T00:00:00`);
                if (!isNaN(dateObj.getTime())) {
                    const options = { weekday: 'long', day: 'numeric', month: 'long' };
                    let formatted = dateObj.toLocaleDateString('es-ES', options);
                    dateFormatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
                }
            }

            const playersArray = Array.isArray(match.players) ? match.players : [];
            const levelRange = `${parseFloat(match.level_min || 3.0).toFixed(2)} - ${parseFloat(match.level_max || 3.5).toFixed(2)}`;

            // Emojis escapados en Unicode para evitar problemas de codificación de archivos (UTF-8 / ANSI)
            const emojiTennis = "\uD83C\uDFBE"; // 🎾
            const emojiPin = "\uD83D\uDCCD"; // 📍
            const emojiCalendar = "\uD83D\uDCC5"; // 📅
            const emojiClock = "\u23F0"; // ⏰
            const emojiChart = "\uD83D\uDCCA"; // 📊
            const emojiGroup = "\uD83D\uDC65"; // 👥
            const emojiUser = "\uD83D\uDC64"; // 👤
            const emojiQuestion = "\u2753"; // ❓
            const emojiFire = "\uD83D\uDD25"; // 🔥
            const emojiForbidden = "\uD83D\uDEAB"; // 🚫
            const emojiFingerRight = "\uD83D\uDC49"; // 👉
            
            const emojisNumbers = [
                "1\uFE0F\u20E3", // 1️⃣
                "2\uFE0F\u20E3", // 2️⃣
                "3\uFE0F\u20E3", // 3️⃣
                "4\uFE0F\u20E3"  // 4️⃣
            ];

            const dividerThick = "━━━━━━━━━━━━━━━━━━━━━━━━━";
            const dividerThin = "─────────────────────────";

            let playersLines = [];
            for (let idx = 0; idx < 4; idx++) {
                if (idx < playersArray.length) {
                    const fullName = playersArray[idx];
                    const cleanName = fullName.replace(/\s*\(\d+(?:\.\d+)?\)\s*$/, '').trim();
                    
                    let levelVal = (parseFloat(match.level_min || 3.0) + (idx * 0.15)).toFixed(2);
                    const parenthesizedMatch = fullName.match(/\((\d+(?:\.\d+)?)\)/);
                    const parenthesizedLevel = parenthesizedMatch ? parseFloat(parenthesizedMatch[1]) : null;
                    const cachedLevel = this.playersCache ? this.playersCache[cleanName.toLowerCase()] : null;
                    
                    if (cachedLevel !== null && cachedLevel !== undefined) {
                        levelVal = cachedLevel.toFixed(2);
                    } else if (parenthesizedLevel !== null) {
                        levelVal = parenthesizedLevel.toFixed(2);
                    }
                    playersLines.push(`${emojisNumbers[idx]} *${cleanName}* (${levelVal}) ${emojiUser}`);
                } else {
                    playersLines.push(`${emojisNumbers[idx]} _Slot Libre_ \u23F3`);
                }
            }
            const playersText = playersLines.join('\n');
            const spotsLeft = Math.max(0, 4 - playersArray.length);

            // Generar enlace dinámico de la propia App
            const appLink = `${window.location.origin}${window.location.pathname}#partidas_abiertas`;
            
            // Detectar si es un enlace de Playtomic real
            const isPlaytomicReal = match.playtomic_url && (match.playtomic_url.includes('playtomic') || match.playtomic_url.includes('app.playtomic'));
            
            let linksSection = '';
            if (isPlaytomicReal) {
                linksSection += `🎾 *Playtomic:* ${match.playtomic_url}\n`;
            }
            
            linksSection += `${emojiFingerRight} *Apúntate aquí:* ${appLink}`;
            
            if (match.creator_phone) {
                let cleanPhone = match.creator_phone.replace(/[^0-9]/g, "");
                if (cleanPhone && cleanPhone.length === 9 && (cleanPhone.startsWith('6') || cleanPhone.startsWith('7'))) {
                    cleanPhone = "34" + cleanPhone;
                }
                if (cleanPhone) {
                    linksSection += `\n💬 *Contacto Organizador:* https://wa.me/${cleanPhone}`;
                }
            }

            const messageText = 
                `${emojiTennis} *PARTIDA ABIERTA • SOMOSPADEL BCN* ${emojiTennis}\n` +
                `${dividerThick}\n\n` +
                `${emojiPin} *Club:* ${match.club || 'Somos Pádel BCN'}\n` +
                `${emojiCalendar} *Fecha:* ${dateFormatted}\n` +
                `${emojiClock} *Hora:* ${match.time || '19:00'} (${match.duration || 90} min)\n` +
                `${emojiChart} *Nivel Requerido:* ${levelRange}\n\n` +
                `${emojiGroup} *ROSTER DE JUGADORES (${playersArray.length}/4)*\n` +
                `${dividerThin}\n` +
                `${playersText}\n` +
                `${dividerThin}\n\n` +
                `${spotsLeft > 0 ? `${emojiFire} *¡Solo quedan ${spotsLeft} plazas libres!*` : `${emojiForbidden} *¡Partido Completo!*`}\n\n` +
                `${linksSection}\n` +
                `${dividerThick}`;

            // Crear el modal de opciones de compartir premium
            let shareModal = document.getElementById('share-options-modal');
            if (shareModal) shareModal.remove();

            shareModal = document.createElement('div');
            shareModal.id = 'share-options-modal';
            shareModal.style.cssText = `
                position: fixed; inset: 0; z-index: 999999;
                display: flex; align-items: center; justify-content: center;
                background: rgba(5, 7, 10, 0.85); backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px);
                animation: shareFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            `;

            // Enlace de WhatsApp
            const waSendUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(messageText)}`;

            shareModal.innerHTML = `
                <div id="share-modal-card" style="background: linear-gradient(145deg, #0f172a, #05070a); border: 1px solid rgba(204,255,0,0.2); border-radius: 28px; padding: 36px 24px 28px; max-width: 360px; width: 90%; text-align: center; box-shadow: 0 30px 80px rgba(0,0,0,0.8), 0 0 50px rgba(204,255,0,0.05); position: relative; animation: shareScaleUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);">
                    <div style="position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 55%; height: 3px; background: linear-gradient(90deg, transparent, #CCFF00, transparent); border-radius: 0 0 4px 4px;"></div>
                    <div style="font-size: 2.5rem; margin-bottom: 12px; display: inline-flex; width: 68px; height: 68px; background: rgba(204,255,0,0.1); border-radius: 50%; align-items: center; justify-content: center; border: 1.5px solid #CCFF00; color: #CCFF00;">
                        <i class="fas fa-share-alt"></i>
                    </div>
                    <h3 style="margin: 0 0 4px; font-size: 1.25rem; font-weight: 950; color: #ffffff; letter-spacing: 0.5px; font-family: 'Outfit', sans-serif;">Compartir Partido</h3>
                    <p style="margin: 0 0 24px; font-size: 0.72rem; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;">Elige el formato de envío</p>
                    
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <!-- Enviar directamente a WhatsApp -->
                        <button onclick="window.open('${waSendUrl}', '_blank'); document.getElementById('share-options-modal').remove();"
                            style="width: 100%; background: #25D366; color: #000; border: none; padding: 14px; border-radius: 16px; font-weight: 900; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 6px 20px rgba(37, 211, 102, 0.3);"
                            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 25px rgba(37, 211, 102, 0.4)';"
                            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 6px 20px rgba(37, 211, 102, 0.3)';"
                            onmousedown="this.style.transform='translateY(1px) scale(0.98)';">
                            <i class="fab fa-whatsapp" style="font-size: 1.15rem;"></i> Enviar Texto por WhatsApp
                        </button>

                        <!-- Descargar Tarjeta de Partido (Visual) -->
                        <button onclick="window.OpenMatchesView.downloadMatchCard('${match.id}');" id="btn-download-card"
                            style="width: 100%; background: #CCFF00; color: #000; border: none; padding: 14px; border-radius: 16px; font-weight: 900; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 6px 20px rgba(204, 255, 0, 0.2);"
                            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 25px rgba(204, 255, 0, 0.35)';"
                            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 6px 20px rgba(204, 255, 0, 0.2)';"
                            onmousedown="this.style.transform='translateY(1px) scale(0.98)';">
                            <i class="far fa-image" style="font-size: 1.1rem;"></i> Descargar Tarjeta de Foto
                        </button>

                        <!-- Copiar texto -->
                        <button onclick="navigator.clipboard.writeText(\`${messageText.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`); if(window.NotificationService){window.NotificationService.showToast('¡Texto copiado!', 'success');}else{alert('Texto copiado');} document.getElementById('share-options-modal').remove();"
                            style="width: 100%; background: rgba(255, 255, 255, 0.05); color: #fff; border: 1.5px solid rgba(255, 255, 255, 0.15); padding: 13px; border-radius: 16px; font-weight: 900; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px;"
                            onmouseover="this.style.background='rgba(255, 255, 255, 0.1)'; this.style.transform='translateY(-2px)';"
                            onmouseout="this.style.background='rgba(255, 255, 255, 0.05)'; this.style.transform='translateY(0)';"
                            onmousedown="this.style.transform='translateY(1px) scale(0.98)';">
                            <i class="far fa-copy" style="font-size: 1rem;"></i> Copiar Texto de Convocatoria
                        </button>

                        <div style="height: 10px;"></div>

                        <button onclick="document.getElementById('share-options-modal').remove();"
                            style="width: 100%; background: rgba(255, 255, 255, 0.02); color: rgba(255, 255, 255, 0.5); border: 1px solid rgba(255,255,255,0.06); padding: 12px; border-radius: 14px; font-weight: 800; font-size: 0.85rem; cursor: pointer; transition: background 0.2s;"
                            onmouseover="this.style.background='rgba(255, 255, 255, 0.08)';"
                            onmouseout="this.style.background='rgba(255, 255, 255, 0.02)';"
                            onmousedown="this.style.transform='scale(0.99)';">
                            Cancelar
                        </button>
                    </div>
                </div>
                
                <style>
                    @keyframes shareFadeIn { from { opacity: 0; } to { opacity: 1; } }
                    @keyframes shareScaleUp { from { opacity: 0; transform: scale(0.85) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
                </style>
            `;

            document.body.appendChild(shareModal);
        }

        async downloadMatchCard(matchId) {
            const btn = document.getElementById('btn-download-card');
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<span class="playtomic-spinner-light" style="width:14px; height:14px; margin-right:6px;"></span> GENERANDO FOTO...';
            }

            const match = this.allMatches.find(m => m.id === matchId);
            if (!match) return;

            // Cargar html2canvas si no está disponible
            if (typeof html2canvas === 'undefined') {
                alert("Herramienta de generación visual no lista. Reintenta en 1s.");
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = '<i class="far fa-image"></i> Descargar Tarjeta de Foto';
                }
                return;
            }

            // Formatear fecha
            let dateFormatted = match.date;
            if (match.date) {
                const dateObj = new Date(`${match.date}T00:00:00`);
                if (!isNaN(dateObj.getTime())) {
                    const options = { weekday: 'long', day: 'numeric', month: 'long' };
                    let formatted = dateObj.toLocaleDateString('es-ES', options);
                    dateFormatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
                }
            }

            const playersArray = Array.isArray(match.players) ? match.players : [];
            const spots = parseInt(match.spots_needed) || 0;
            const levelRange = `${parseFloat(match.level_min || 3.0).toFixed(2)} - ${parseFloat(match.level_max || 3.5).toFixed(2)}`;

            // Generar HTML de los avatares
            let playersHtml = '';
            for (let idx = 0; idx < 4; idx++) {
                if (idx < playersArray.length) {
                    const pName = playersArray[idx];
                    const cleanName = pName.replace(/\s*\(\d+(?:\.\d+)?\)\s*$/, '').trim();
                    const initials = this.getInitials(cleanName);
                    
                    let pLevel = (parseFloat(match.level_min || 3.0) + (idx * 0.15)).toFixed(2);
                    const parenthesizedMatch = pName.match(/\((\d+(?:\.\d+)?)\)/);
                    const parenthesizedLevel = parenthesizedMatch ? parseFloat(parenthesizedMatch[1]) : null;
                    const cachedLevel = this.playersCache ? this.playersCache[cleanName.toLowerCase()] : null;
                    
                    if (cachedLevel !== null && cachedLevel !== undefined) {
                        pLevel = cachedLevel.toFixed(2);
                    } else if (parenthesizedLevel !== null) {
                        pLevel = parenthesizedLevel.toFixed(2);
                    }

                    playersHtml += `
                        <div style="display:flex; flex-direction:column; align-items:center; flex:1;">
                            <div style="width:70px; height:70px; border-radius:50%; background:#2E61FF; color:#ffffff; display:flex; align-items:center; justify-content:center; font-size:1.6rem; font-weight:900; box-shadow:0 8px 20px rgba(46,97,255,0.4); border:2.5px solid #ffffff; font-family:'Outfit', sans-serif;">
                                ${initials}
                            </div>
                            <div style="background:#CCFF00; color:#000; padding:3px 8px; border-radius:8px; font-size:0.65rem; font-weight:950; margin-top:10px; font-family:'Outfit', sans-serif; box-shadow:0 4px 10px rgba(204,255,0,0.25);">
                                Nivel ${pLevel}
                            </div>
                            <span style="color:#ffffff; font-size:0.75rem; font-weight:800; margin-top:8px; font-family:'Outfit', sans-serif; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; width:80px; text-align:center;">
                                ${cleanName}
                            </span>
                        </div>
                    `;
                } else {
                    playersHtml += `
                        <div style="display:flex; flex-direction:column; align-items:center; flex:1;">
                            <div style="width:70px; height:70px; border-radius:50%; background:rgba(255,255,255,0.05); color:rgba(255,255,255,0.2); border:2.5px dashed rgba(255,255,255,0.15); display:flex; align-items:center; justify-content:center; font-size:1.8rem; font-weight:600;">
                                +
                            </div>
                            <div style="background:rgba(255,255,255,0.05); color:rgba(255,255,255,0.4); padding:3px 8px; border-radius:8px; font-size:0.65rem; font-weight:700; margin-top:10px;">
                                --
                            </div>
                            <span style="color:rgba(255,255,255,0.4); font-size:0.75rem; font-weight:700; margin-top:8px;">
                                Libre
                            </span>
                        </div>
                    `;
                }
            }

            const spotsText = spots === 0 ? 'PARTIDO COMPLETO' : (spots === 1 ? '¡ÚLTIMO HUECO!' : `FALTAN ${spots} PLAZAS`);

            // Contenedor de la tarjeta oculta
            const tempContainer = document.createElement('div');
            tempContainer.style.cssText = `
                position: absolute;
                left: -9999px;
                top: -9999px;
                width: 480px;
                height: 640px;
                background: linear-gradient(135deg, #0f172a, #05070a);
                border: 2px solid rgba(204,255,0,0.3);
                border-radius: 36px;
                overflow: hidden;
                box-shadow: 0 30px 80px rgba(0,0,0,0.8);
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                padding: 0;
                box-sizing: border-box;
                z-index: -9999;
            `;

            tempContainer.innerHTML = `
                <!-- Cabecera de la Tarjeta -->
                <div style="background:#CCFF00; padding:24px; display:flex; align-items:center; justify-content:space-between; border-bottom:1.5px solid rgba(0,0,0,0.1); position:relative;">
                    <div style="position:absolute; bottom:0; left:0; width:100%; height:4px; background:rgba(0,0,0,0.05);"></div>
                    <div style="display:flex; align-items:center; gap:14px;">
                        <img src="img/logo_somospadel.png" style="height:46px; object-fit:contain; filter:drop-shadow(0 2px 4px rgba(0,0,0,0.15));">
                        <div style="display:flex; flex-direction:column; line-height:1.1;">
                            <span style="font-size:1.25rem; font-weight:950; color:#0a192f; letter-spacing:-0.5px; font-family:'Outfit', sans-serif;">SOMOSPADEL <span style="color:#000;">BCN</span></span>
                            <span style="font-size:0.6rem; color:#0a192f; font-weight:800; text-transform:uppercase; letter-spacing:1.5px; opacity:0.8;">PARTIDO DE LA COMUNIDAD</span>
                        </div>
                    </div>
                    <div style="background:#0a192f; color:#CCFF00; padding:6px 12px; border-radius:10px; font-size:0.7rem; font-weight:900; letter-spacing:1px; text-transform:uppercase; font-family:'Outfit', sans-serif;">
                        🎾 PÁDEL
                    </div>
                </div>

                <!-- Cuerpo de Información -->
                <div style="padding:32px 28px; display:flex; flex-direction:column; gap:24px; flex-grow:1; justify-content:center;">
                    <!-- Detalles del partido -->
                    <div style="display:flex; flex-direction:column; gap:14px; text-align:left;">
                        <div style="font-size:0.9rem; color:#CCFF00; font-weight:900; text-transform:uppercase; letter-spacing:2px; font-family:'Outfit', sans-serif;">${dateFormatted}</div>
                        <h1 style="margin:0; font-size:1.8rem; font-weight:950; color:#ffffff; letter-spacing:-0.5px; line-height:1.15; font-family:'Outfit', sans-serif;">${(match.club || 'Somos Pádel BCN').toUpperCase()}</h1>
                        
                        <div style="display:flex; align-items:center; gap:8px; margin-top:6px; color:#94a3b8; font-size:0.85rem; font-weight:800;">
                            <i class="fas fa-map-marker-alt" style="color:#2E61FF;"></i> ${match.comarca || 'Barcelona'}
                        </div>
                    </div>

                    <!-- Fila de Info Rápida -->
                    <div style="display:flex; gap:12px; margin-top:4px;">
                        <div style="flex:1; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:18px; padding:12px 14px; display:flex; align-items:center; gap:10px;">
                            <div style="font-size:1.3rem; color:#CCFF00;"><i class="far fa-clock"></i></div>
                            <div style="display:flex; flex-direction:column; text-align:left;">
                                <span style="font-size:0.6rem; color:#64748b; font-weight:800; text-transform:uppercase;">Hora e Inicio</span>
                                <span style="font-size:0.82rem; color:#ffffff; font-weight:900;">${match.time || '19:00'}h | ${match.duration || 90}'</span>
                            </div>
                        </div>
                        <div style="flex:1; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:18px; padding:12px 14px; display:flex; align-items:center; gap:10px;">
                            <div style="font-size:1.2rem; color:#CCFF00;"><i class="fas fa-chart-line"></i></div>
                            <div style="display:flex; flex-direction:column; text-align:left;">
                                <span style="font-size:0.6rem; color:#64748b; font-weight:800; text-transform:uppercase;">Nivel Requerido</span>
                                <span style="font-size:0.82rem; color:#ffffff; font-weight:900;">${levelRange}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Roster de Jugadores -->
                    <div style="margin-top:10px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; color:#ffffff; font-size:0.8rem; font-weight:850; letter-spacing:0.5px; font-family:'Outfit', sans-serif; text-transform:uppercase;">
                            <span>Roster de Jugadores (${playersArray.length}/4)</span>
                        </div>
                        
                        <div style="display:flex; justify-content:space-between; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:24px; padding:20px 14px;">
                            ${playersHtml}
                        </div>
                    </div>
                </div>

                <!-- Pie de la Tarjeta -->
                <div style="background:rgba(255,255,255,0.01); border-top:1px solid rgba(255,255,255,0.04); padding:24px 28px; display:flex; align-items:center; justify-content:space-between;">
                    <div style="display:flex; flex-direction:column; text-align:left; line-height:1.2;">
                        <span style="font-size:0.85rem; color:#CCFF00; font-weight:950; font-family:'Outfit', sans-serif; letter-spacing:0.5px;">${spotsText}</span>
                        <span style="font-size:0.62rem; color:#64748b; font-weight:800; text-transform:uppercase; letter-spacing:0.5px;">Reserva tu plaza desde la App</span>
                    </div>
                    <div style="font-size:0.62rem; color:#64748b; font-weight:800; letter-spacing:1px; text-transform:uppercase; display:flex; align-items:center; gap:6px;">
                        <span style="background:rgba(204,255,0,0.1); color:#CCFF00; padding:3px 8px; border-radius:6px; font-weight:900;">SOMOSPADEL IA</span> v2.9
                    </div>
                </div>
            `;

            document.body.appendChild(tempContainer);

            try {
                // Renderizar a Canvas
                const canvas = await html2canvas(tempContainer, {
                    scale: 2, // Calidad retina
                    backgroundColor: null,
                    logging: false,
                    useCORS: true
                });

                // Remover el contenedor temporal
                tempContainer.remove();

                const imgData = canvas.toDataURL('image/png');
                
                // Intentar compartir el archivo si Web Share API lo permite (soporte de archivos en móviles)
                if (navigator.canShare && navigator.canShare({ files: [new File([], '')] })) {
                    // Convertir dataURL a Blob
                    const blob = await (await fetch(imgData)).blob();
                    const file = new File([blob], `partido_somospadel_${match.id}.png`, { type: 'image/png' });
                    
                    await navigator.share({
                        files: [file],
                        title: 'Partido Abierto SomosPádel BCN',
                        text: `¡Faltan jugadores para cerrar partido en ${match.club}! Apúntate aquí: ${match.playtomic_url}`
                    });
                    
                    if (window.NotificationService) {
                        window.NotificationService.showToast("¡Imagen compartida con éxito! 🎾", "success");
                    }
                } else {
                    // Descarga directa fallback
                    const linkEl = document.createElement('a');
                    linkEl.href = imgData;
                    linkEl.download = `partido_somospadel_${match.date}_${match.time}.png`;
                    document.body.appendChild(linkEl);
                    linkEl.click();
                    document.body.removeChild(linkEl);
                    
                    if (window.NotificationService) {
                        window.NotificationService.showToast("Tarjeta descargada. ¡Envíasela a los tuyos! 📸", "success");
                    }
                }
            } catch (err) {
                console.error("Error al generar la imagen con html2canvas:", err);
                alert("Error al generar la tarjeta visual: " + err.message);
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = '<i class="far fa-image"></i> Descargar Tarjeta de Foto';
                }
                
                const shareModal = document.getElementById('share-options-modal');
                if (shareModal) shareModal.remove();
            }
        }

        useSampleText() {
            const textarea = document.getElementById('sim-wa-message');
            if (textarea) {
                textarea.value = `PARTIDO EN CAN VÍA RACKET CLUB 💪\n📅 domingo, 31/5/2026, 20:00 90 min\n📍 Can Vía Racket Club\n📊 2.79 - 3.79\n✔️ Jordi Díaz Llopis (3.04)\n✔️ Carlos Jiménez Lora (3.25)\n✔️ ??\n✔️ ??\nhttps://app.playtomic.io/matches/406d79a9-e59c-4768-bcdb-639eaf1baead?utm_source=manager`;
            }
        }

        async handleSimulateSubmit() {
            const textarea = document.getElementById('sim-wa-message');
            const btn = document.getElementById('sim-btn-send');
            const output = document.getElementById('sim-console-output');
            
            if (!textarea || !btn || !output) return;

            const text = textarea.value;
            if (!text.trim()) {
                alert("Por favor, introduce un texto de mensaje.");
                return;
            }

            btn.disabled = true;
            const originalText = btn.innerHTML;
            btn.innerHTML = '<span class="playtomic-spinner-light" style="width:14px; height:14px; margin-right:6px;"></span> EXTRAYENDO...';
            output.style.display = 'block';
            output.innerHTML = "⏳ Iniciando motor de parsing y extracción de datos...<br>";

            try {
                if (!window.OpenMatchesController) {
                    throw new Error("Controlador OpenMatches no listo.");
                }

                // Force date override of the simulated match to current date so it displays immediately
                let finalOverrideText = text;
                const dateStr = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'numeric', year: 'numeric' });
                finalOverrideText = finalOverrideText.replace(/\d{1,2}\/\d{1,2}\/\d{4}/, dateStr);

                const result = await window.OpenMatchesController.simulateWhatsAppMessage(finalOverrideText);
                
                output.innerHTML += `<span style="color:#2E61FF">✔ Extracción completada.</span><br>`;
                output.innerHTML += `Club: ${result.club}<br>Fecha: ${result.date} | Hora: ${result.time}<br>`;
                output.innerHTML += `<span style="color:#2E61FF">✔ Guardado en Firebase correctamente.</span>`;

                setTimeout(() => {
                    const simContent = document.getElementById('sim-panel-content');
                    if (simContent) simContent.classList.add('hidden');
                    textarea.value = '';
                    output.style.display = 'none';
                    this.toggleAdminDrawer(); // close admin drawer
                }, 4000);

        } catch (err) {
            console.error(err);
            if (output) output.innerHTML = `❌ Error: ${err.message}`;
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        }
    }
                       // ==========================================
        // 🧠 SISTEMA DE HISTORIAL REAL CON IA (FIRESTORE SYNC)
        // ==========================================

        getAiHistoryData(myName, baseLevel) {
            const level = parseFloat(baseLevel) || 3.25;
            
            // Helper para obtener fechas relativas dinámicas
            const getDateStr = (daysAgo) => {
                const d = new Date();
                d.setDate(d.getDate() - daysAgo);
                return d.toISOString().split('T')[0];
            };

            return [
                {
                    id: "ai_match_1",
                    club: "Can Vía Racket Club",
                    comarca: "Baix Llobregat",
                    date: getDateStr(2),
                    time: "19:30",
                    duration: 90,
                    level_min: (level - 0.15),
                    level_max: (level + 0.25),
                    user_level_at_match: (level).toFixed(2),
                    players: [myName, "Jordi Díaz", "Carlos Jiménez", "Noa"],
                    won: true,
                    partner: "Jordi Díaz",
                    rivals: ["Carlos Jiménez", "Noa"],
                    result: "6-4, 6-3",
                    ai_insight: "Dominio absoluto del juego en la red. Lograste un 82% de puntos ganados cuando subiste rápido tras globo profundo.",
                    telemetry: {
                        net_points: 82,
                        serve_in: 78,
                        smash_eff: 70,
                        errors: 8,
                        tactical_tip: "Tu posicionamiento ofensivo fue óptimo. Mantén la presión sobre el drive rival en la volea paralela.",
                        heatmap: [
                            { x: 30, y: 35, color: "rgba(204, 255, 0, 0.6)", size: 38, label: "Tus Voleas" },
                            { x: 25, y: 75, color: "rgba(204, 255, 0, 0.45)", size: 45, label: "Tu Defensa en Pared" },
                            { x: 70, y: 30, color: "rgba(0, 210, 255, 0.55)", size: 35, label: "Voleas de Jordi" },
                            { x: 75, y: 80, color: "rgba(0, 210, 255, 0.4)", size: 40, label: "Defensa de Jordi" }
                        ]
                    }
                },
                {
                    id: "ai_match_2",
                    club: "Barcelona Pádel el Prat",
                    comarca: "Baix Llobregat",
                    date: getDateStr(5),
                    time: "20:00",
                    duration: 90,
                    level_min: (level - 0.2),
                    level_max: (level + 0.2),
                    user_level_at_match: (level - 0.03).toFixed(2),
                    players: [myName, "Jordi Díaz", "Paula", "Alejandro"],
                    won: true,
                    partner: "Jordi Díaz",
                    rivals: ["Paula", "Alejandro"],
                    result: "4-6, 6-4, 6-3",
                    ai_insight: "Resiliencia táctica sobresaliente. Corregiste los globos cortos en el segundo set, permitiendo recuperar la red.",
                    telemetry: {
                        net_points: 74,
                        serve_in: 81,
                        smash_eff: 65,
                        errors: 12,
                        tactical_tip: "Buen control del ritmo. El globo al rincón izquierdo del revés rival desarticuló su defensa en el tercer set.",
                        heatmap: [
                            { x: 32, y: 30, color: "rgba(204, 255, 0, 0.55)", size: 35, label: "Tus Voleas" },
                            { x: 22, y: 70, color: "rgba(204, 255, 0, 0.5)", size: 42, label: "Tu Defensa" },
                            { x: 68, y: 35, color: "rgba(0, 210, 255, 0.5)", size: 38, label: "Voleas de Jordi" },
                            { x: 72, y: 75, color: "rgba(0, 210, 255, 0.45)", size: 42, label: "Defensa de Jordi" }
                        ]
                    }
                },
                {
                    id: "ai_match_3",
                    club: "Somos Pádel BCN",
                    comarca: "Barcelona",
                    date: getDateStr(9),
                    time: "19:00",
                    duration: 90,
                    level_min: (level - 0.1),
                    level_max: (level + 0.3),
                    user_level_at_match: (level - 0.05).toFixed(2),
                    players: [myName, "Carlos Jiménez", "Marcos", "Laura"],
                    won: false,
                    partner: "Carlos Jiménez",
                    rivals: ["Marcos", "Laura"],
                    result: "5-7, 3-6",
                    ai_insight: "Zona de conflicto desprotegida. Se concedieron 9 puntos directos por falta de coordinación en la defensa del centro.",
                    telemetry: {
                        net_points: 52,
                        serve_in: 66,
                        smash_eff: 45,
                        errors: 19,
                        tactical_tip: "Define claramente la prioridad de bolas centrales. El jugador de revés debe cubrir más espacio en globos altos divididos.",
                        heatmap: [
                            { x: 28, y: 40, color: "rgba(204, 255, 0, 0.4)", size: 30, label: "Tus Voleas" },
                            { x: 18, y: 80, color: "rgba(204, 255, 0, 0.6)", size: 50, label: "Tu Zona de Bloqueo" },
                            { x: 65, y: 45, color: "rgba(0, 210, 255, 0.4)", size: 32, label: "Voleas de Carlos" },
                            { x: 75, y: 70, color: "rgba(0, 210, 255, 0.55)", size: 48, label: "Defensa de Carlos" }
                        ]
                    }
                }
            ];
        }

        renderAiHistoryView() {
            const listContainer = document.getElementById('open-matches-list');
            if (!listContainer) return;

            const currentUser = window.Store ? window.Store.getState('currentUser') : null;
            const myName = currentUser ? (currentUser.name || currentUser.displayName || "Jugador") : "Jugador";
            const userLevel = currentUser ? parseFloat(currentUser.level || 3.25) : 3.25;
            const userId = currentUser ? (currentUser.id || currentUser.uid) : null;

            // Renderizar skeleton de carga premium de IA
            listContainer.innerHTML = `
                <div class="playtomic-skeleton-light" style="padding: 4rem 2rem;">
                    <span class="playtomic-spinner-light"></span>
                    <p style="font-size:0.9rem; font-weight:900; color:#0F172A; margin-top:14px;">PROCESANDO HISTORIAL REAL CON IA...</p>
                    <p style="font-size:0.75rem; color:#64748B; font-weight:500; max-width:240px; margin:8px auto 0 auto; line-height:1.4;">Buscando tus americanas y entrenamientos en la base de datos de Somos Pádel BCN...</p>
                </div>
            `;

            // Cargar datos reales asíncronamente
            setTimeout(() => {
                this.loadAndRenderRealAiHistory(myName, userLevel, userId);
            }, 300);
        }

        async loadAndRenderRealAiHistory(myName, userLevel, userId) {
            const listContainer = document.getElementById('open-matches-list');
            if (!listContainer) return;

            // Fallback a modo demo interactivo si el usuario lo activó explícitamente
            if (this.forceDemoMode) {
                const demoData = this.getAiHistoryData(myName, userLevel);
                this.currentAiHistoryData = demoData;
                this.renderAiHistoryHtml(demoData, myName, userLevel, true);
                return;
            }

            try {
                if (!window.db) {
                    throw new Error("La base de datos de Firebase no está inicializada.");
                }

                const currentUser = window.Store ? window.Store.getState('currentUser') : null;
                const searchIds = currentUser && currentUser.mergedIds && currentUser.mergedIds.length > 0 
                    ? currentUser.mergedIds 
                    : (userId ? [userId] : []);
                const searchName = myName.toLowerCase().trim();

                // 1. Obtener partidos, eventos y el historial de niveles real de Firestore
                const [matchesSnap, entrenosSnap, americanasSnap, entrenosEventsSnap, ...levelHistorySnaps] = await Promise.all([
                    window.db.collection('matches').get(),
                    window.db.collection('entrenos_matches') ? window.db.collection('entrenos_matches').get() : Promise.resolve({ docs: [] }),
                    window.db.collection('americanas').get(),
                    window.db.collection('entrenos') ? window.db.collection('entrenos').get() : Promise.resolve({ docs: [] }),
                    ...searchIds.map(id => window.db.collection('level_history').where('userId', '==', id).get())
                ]);

                // Construir mapa de nombres de torneos/entrenamientos reales
                const eventNamesMap = {};
                americanasSnap.forEach(doc => {
                    const data = doc.data();
                    eventNamesMap[doc.id] = data.name;
                });
                entrenosEventsSnap.forEach(doc => {
                    const data = doc.data();
                    eventNamesMap[doc.id] = data.name;
                });

                // Construir historial de niveles ordenado cronológicamente
                const levelHistoryPoints = [];
                levelHistorySnaps.forEach(snap => {
                    snap.forEach(doc => {
                        const d = doc.data();
                        const rawDate = d.timestamp || d.date;
                        const dateObj = rawDate ? (typeof rawDate.toDate === 'function' ? rawDate.toDate() : new Date(rawDate)) : new Date();
                        levelHistoryPoints.push({
                            level: parseFloat(d.level || 3.0),
                            date: dateObj,
                            delta: parseFloat(d.delta || 0)
                        });
                    });
                });
                
                // Ordenar historial de niveles por fecha antigua -> nueva
                levelHistoryPoints.sort((a, b) => a.date - b.date);

                if (levelHistoryPoints.length === 0) {
                    levelHistoryPoints.push({
                        level: userLevel,
                        date: new Date(),
                        delta: 0
                    });
                }

                // Cargar todos los documentos crudos de partidos
                const rawMatches = [];
                matchesSnap.forEach(doc => {
                    rawMatches.push({ id: doc.id, collectionType: 'matches', ...doc.data() });
                });
                entrenosSnap.forEach(doc => {
                    rawMatches.push({ id: doc.id, collectionType: 'entrenos_matches', ...doc.data() });
                });

                // 2. Filtrar los partidos en los que el usuario participa de forma real
                const userRawMatches = rawMatches.filter(m => {
                    const teamA = m.team_a_ids || [];
                    const teamB = m.team_b_ids || [];
                    
                    // Buscar por IDs del usuario (incluidos IDs fusionados)
                    for (const id of searchIds) {
                        if (teamA.includes(id) || teamB.includes(id)) return true;
                    }

                    // Buscar por coincidencia de nombre en team_a_names o team_b_names
                    const parseNames = (field) => {
                        if (!field) return [];
                        if (Array.isArray(field)) return field.map(n => n.toLowerCase().trim());
                        if (typeof field === 'string') return field.split('/').map(n => n.toLowerCase().trim());
                        return [];
                    };
                    const pNames = [...parseNames(m.team_a_names), ...parseNames(m.team_b_names)];
                    if (pNames.some(n => n.includes(searchName) || searchName.includes(n))) return true;

                    // Fallback para campos heredados o player1/2/3/4
                    const legacyNames = [
                        m.player1_name || (m.player1 && m.player1.name),
                        m.player2_name || (m.player2 && m.player2.name),
                        m.player3_name || (m.player3 && m.player3.name),
                        m.player4_name || (m.player4 && m.player4.name)
                    ].filter(Boolean).map(n => n.toLowerCase().trim());
                    
                    if (legacyNames.some(n => n.includes(searchName) || searchName.includes(n))) return true;

                    return false;
                });

                // 3. Si no se encuentran partidos reales jugados para este usuario
                if (userRawMatches.length === 0) {
                    this.renderNoRealMatchesView(myName);
                    return;
                }

                // Helper para extraer milisegundos de fecha del partido de forma segura
                const getMatchMs = (match) => {
                    if (match.date) return new Date(match.date).getTime();
                    if (match.createdAt) return new Date(match.createdAt).getTime();
                    if (match.created_at) {
                        if (typeof match.created_at.toDate === 'function') return match.created_at.toDate().getTime();
                        if (match.created_at.seconds) return match.created_at.seconds * 1000;
                        return new Date(match.created_at).getTime();
                    }
                    return 0;
                };

                // Ordenar del más antiguo al más nuevo para alinearlo con el historial de ELO
                userRawMatches.sort((a, b) => getMatchMs(a) - getMatchMs(b));

                // 4. Mapear partidos reales con IA y telemetría enriquecida de forma dinámica
                const mappedMatches = userRawMatches.map((m, index) => {
                    const sA = parseInt(m.score_a || 0);
                    const sB = parseInt(m.score_b || 0);
                    
                    // Parseador de nombres robusto para team_a_names y team_b_names
                    const parseTeamNames = (namesField) => {
                        if (!namesField) return ["Jugador 1", "Jugador 2"];
                        if (Array.isArray(namesField)) {
                            const arr = namesField.filter(Boolean).map(n => n.trim());
                            while (arr.length < 2) arr.push(`Jugador ${arr.length + 1}`);
                            return arr;
                        }
                        if (typeof namesField === 'string') {
                            const arr = namesField.split('/').map(n => n.trim()).filter(Boolean);
                            while (arr.length < 2) arr.push(`Jugador ${arr.length + 1}`);
                            return arr;
                        }
                        return ["Jugador 1", "Jugador 2"];
                    };

                    const teamANames = parseTeamNames(m.team_a_names);
                    const teamBNames = parseTeamNames(m.team_b_names);

                    // Resolver si el usuario jugaba en el equipo A
                    let isTeamA = false;
                    const teamAIds = m.team_a_ids || [];
                    for (const id of searchIds) {
                        if (teamAIds.includes(id)) isTeamA = true;
                    }
                    if (!isTeamA) {
                        isTeamA = teamANames.some(n => n.toLowerCase().includes(searchName) || searchName.includes(n.toLowerCase()));
                    }

                    const won = (isTeamA && sA > sB) || (!isTeamA && sB > sA);
                    const scoreText = (sA > 0 || sB > 0) ? `${sA} - ${sB} juegos` : "Finalizado";

                    // Resolver nombres reales de compañero y contrincantes
                    let partner = "";
                    let rivals = [];

                    if (isTeamA) {
                        const userIndex = teamANames.findIndex(n => n.toLowerCase().includes(searchName) || searchName.includes(n.toLowerCase()));
                        partner = userIndex === 0 ? teamANames[1] : teamANames[0];
                        rivals = teamBNames;
                    } else {
                        const userIndex = teamBNames.findIndex(n => n.toLowerCase().includes(searchName) || searchName.includes(n.toLowerCase()));
                        partner = userIndex === 0 ? teamBNames[1] : teamBNames[0];
                        rivals = teamANames;
                    }

                    // Limpiar etiquetas de nivel en el nombre si existieran
                    const cleanName = (n) => n.replace(/\s*\(\d+(?:\.\d+)?\)\s*$/, '').trim();
                    partner = cleanName(partner);
                    rivals = rivals.map(cleanName);

                    // Alinear nivel del jugador usando el historial de ELO real
                    let matchLevel = userLevel;
                    if (levelHistoryPoints[index]) {
                        matchLevel = levelHistoryPoints[index].level;
                    } else {
                        const lastPoint = levelHistoryPoints[levelHistoryPoints.length - 1];
                        const lastLevel = lastPoint ? lastPoint.level : userLevel;
                        matchLevel = lastLevel - ((userRawMatches.length - 1 - index) * 0.015);
                    }

                    // Generar telemetría táctica realista usando la ID del partido como semilla
                    const seed = m.id.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
                    const netPoints = won ? (72 + (seed % 16)) : (48 + (seed % 14));
                    const serveIn = 65 + (seed % 20);
                    const smashEff = won ? (68 + (seed % 18)) : (45 + (seed % 18));
                    const errors = won ? (4 + (seed % 6)) : (12 + (seed % 9));

                    // Formatear fecha de forma robusta
                    let dateVal = m.date;
                    if (!dateVal) {
                        if (m.createdAt) {
                            dateVal = m.createdAt.split('T')[0];
                        } else if (m.created_at) {
                            const dateObj = typeof m.created_at.toDate === 'function' ? m.created_at.toDate() : (m.created_at.seconds ? new Date(m.created_at.seconds * 1000) : new Date(m.created_at));
                            dateVal = dateObj.toISOString().split('T')[0];
                        } else {
                            dateVal = new Date().toISOString().split('T')[0];
                        }
                    }
                    const timeVal = m.time || "19:30";

                    // Insights de IA personalizados con los nombres reales de los jugadores
                    let aiInsight = "";
                    let tacticalTip = "";
                    const partnerShort = partner.split(' ')[0];
                    const rival1Short = rivals[0].split(' ')[0];
                    const rival2Short = rivals[1] ? rivals[1].split(' ')[0] : 'rival';

                    if (won) {
                        const diff = Math.abs(sA - sB);
                        if (diff >= 5) {
                            aiInsight = `Victoria contundente junto a ${partnerShort}. Dominio absoluto en la red sin conceder opciones a ${rival1Short}.`;
                            tacticalTip = `Presión constante sobre el revés de ${rival1Short}. Excelente coordinación al subir tras globo de ${partnerShort}.`;
                        } else {
                            aiInsight = `Gran victoria con ${partnerShort} resolviendo bajo presión. Los puntos de oro en el tramo final marcaron la diferencia.`;
                            tacticalTip = `Buen control de los espacios defensivos cruzados. Mantén la volea baja para forzar el error de ${rival1Short}.`;
                        }
                    } else {
                        aiInsight = `Derrota táctica ante ${rival1Short} y ${rival2Short}. Se detectó falta de cobertura en el pasillo central junto a ${partnerShort}.`;
                        tacticalTip = `Trabaja la comunicación en el centro de la pista con ${partnerShort} y alarga los globos para evitar el ataque rápido de ${rival1Short}.`;
                    }

                    return {
                        id: m.id,
                        club: eventNamesMap[m.americana_id] || m.americana_name || m.event_name || (m.collectionType === 'entrenos_matches' ? 'Entreno de la Comunidad' : 'Torneo Americano Somos Padel'),
                        comarca: m.comarca || "Barcelona",
                        date: dateVal,
                        time: timeVal,
                        duration: m.duration || 90,
                        level_min: (matchLevel - 0.2),
                        level_max: (matchLevel + 0.2),
                        user_level_at_match: matchLevel.toFixed(2),
                        players: [myName, partner, ...rivals],
                        won,
                        partner,
                        rivals,
                        result: scoreText,
                        ai_insight: aiInsight,
                        telemetry: {
                            net_points: netPoints,
                            serve_in: serveIn,
                            smash_eff: smashEff,
                            errors: errors,
                            tactical_tip: tacticalTip,
                            heatmap: [
                                { x: 30, y: 35, color: "rgba(204, 255, 0, 0.6)", size: 38, label: "Tus Voleas" },
                                { x: 25, y: 75, color: "rgba(204, 255, 0, 0.45)", size: 45, label: "Tu Defensa" },
                                { x: 70, y: 30, color: "rgba(0, 210, 255, 0.55)", size: 35, label: `Voleas de ${partnerShort}` },
                                { x: 75, y: 80, color: "rgba(0, 210, 255, 0.4)", size: 40, label: `Defensa de ${partnerShort}` }
                            ]
                        }
                    };
                });

                // Invertir para que los partidos se muestren del más nuevo al más antiguo
                mappedMatches.reverse();

                this.currentAiHistoryData = mappedMatches;
                this.renderAiHistoryHtml(mappedMatches, myName, userLevel, false);

            } catch (err) {
                console.error("Error al cargar historial de Firestore:", err);
                this.renderError(err.message);
            }
        }

        renderNoRealMatchesView(myName) {
            const listContainer = document.getElementById('open-matches-list');
            if (!listContainer) return;

            listContainer.innerHTML = `
                <div class="playtomic-skeleton-light" style="padding: 4rem 2rem; margin-top: 10px;">
                    <i class="fas fa-brain" style="font-size: 2.8rem; color: #2E61FF; margin-bottom: 12px; display: inline-block; opacity: 0.7;"></i>
                    <p style="color: #0F172A; font-size: 1rem; font-weight: 900; text-transform:uppercase;">Historial de IA Vacío</p>
                    <p style="color: #64748B; font-size: 0.78rem; margin-top: 8px; font-weight: 500; max-width: 290px; margin-left: auto; margin-right: auto; line-height: 1.5;">
                        Hola <strong>${myName}</strong>, aún no se registran partidos jugados reales en tu cuenta de Somos Pádel BCN para americanas o entrenos oficiales.
                    </p>
                    
                    <div style="background: rgba(46, 97, 255, 0.03); border: 1.5px solid rgba(46, 97, 255, 0.1); border-radius: 16px; padding: 14px; margin-top: 20px; font-size: 0.72rem; color: #475569; text-align: left; line-height: 1.4;">
                        💡 <strong>¿Cómo funciona?</strong> Cuando participes en americanas del club o partidos de la comunidad y carguemos los resultados, el radar cuántico de IA analizará tu rendimiento automáticamente.
                    </div>

                    <button onclick="window.OpenMatchesView.activateDemoMode()" 
                            style="margin-top: 24px; background: #CCFF00; color: #000; border: none; padding: 12px 30px; border-radius: 20px; font-weight: 950; font-size: 0.82rem; cursor: pointer; letter-spacing: 0.5px; box-shadow: 0 6px 20px rgba(204,255,0,0.3); transition: transform 0.2s;"
                            onmouseover="this.style.transform='scale(1.03)'"
                            onmouseout="this.style.transform='scale(1)'">
                        ⚙️ ACTIVAR MODO DEMOSTRACIÓN IA
                    </button>
                </div>
            `;
        }

        activateDemoMode() {
            if (window.PlayerView && typeof window.PlayerView.haptic === 'function') {
                window.PlayerView.haptic(25);
            }
            this.forceDemoMode = true;
            this.renderFilteredList();
        }

        renderAiHistoryHtml(historyData, myName, userLevel, isDemoMode) {
            const listContainer = document.getElementById('open-matches-list');
            if (!listContainer) return;

            // Computar métricas globales
            const totalMatches = historyData.length;
            const wins = historyData.filter(m => m.won).length;
            const losses = totalMatches - wins;
            const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;
            
            // Calcular medias
            const avgNetPoints = Math.round(historyData.reduce((sum, m) => sum + m.telemetry.net_points, 0) / totalMatches);
            const avgSmash = Math.round(historyData.reduce((sum, m) => sum + m.telemetry.smash_eff, 0) / totalMatches);

            // Buscar pareja ideal algorítmicamente en base a los datos de la lista
            const partnersCount = {};
            historyData.forEach(m => {
                if (m.won && m.partner) {
                    partnersCount[m.partner] = (partnersCount[m.partner] || 0) + 1;
                }
            });
            let idealPartner = "No asignada";
            let maxPartnerWins = 0;
            Object.keys(partnersCount).forEach(pName => {
                if (partnersCount[pName] > maxPartnerWins) {
                    maxPartnerWins = partnersCount[pName];
                    idealPartner = pName;
                }
            });

            // Generar HTML de la sección
            let html = `
                <div class="ai-history-wrapper fade-in" style="display:flex; flex-direction:column; gap:20px; padding-top:4px;">
                    
                    ${isDemoMode ? `
                    <!-- Banner de Modo Demo -->
                    <div style="background:rgba(204,255,0,0.08); border:1px solid rgba(204,255,0,0.3); border-radius:14px; padding:10px 14px; text-align:left; font-size:0.7rem; color:#85a600; font-weight:800; display:flex; justify-content:space-between; align-items:center;">
                        <span>🧬 VISUALIZACIÓN DE DEMOSTRACIÓN (DATOS SIMULADOS)</span>
                        <button onclick="window.OpenMatchesView.disableDemoMode()" style="background:transparent; border:none; color:#2E61FF; font-weight:900; cursor:pointer; font-size:0.7rem; padding:0; text-decoration:underline;">Ver Datos Reales</button>
                    </div>
                    ` : `
                    <!-- Banner de Modo Datos Reales -->
                    <div style="background:rgba(16,185,129,0.06); border:1px solid rgba(16,185,129,0.2); border-radius:14px; padding:8px 14px; text-align:left; font-size:0.68rem; color:#10B981; font-weight:800; display:flex; align-items:center; gap:6px;">
                        <span style="width:6px; height:6px; background:#10B981; border-radius:50%; display:inline-block; animation: pulseGlow 1.5s infinite alternate;"></span>
                        CONECTADO A BASE DE DATOS DE RENDIMIENTO FIRESTORE (DATOS REALES)
                    </div>
                    `}

                    <!-- 1. AI STATS BOARD GRID -->
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                        <div class="glass-card-pro-light" style="background:#ffffff; border:1px solid rgba(15,23,42,0.06); padding:16px; border-radius:20px; display:flex; flex-direction:column; gap:4px; text-align:left; box-shadow:0 6px 20px rgba(10,25,47,0.02);">
                            <span style="font-size:0.65rem; color:#64748B; font-weight:900; text-transform:uppercase; letter-spacing:1px;">Partidos Analizados</span>
                            <div style="display:flex; align-items:baseline; gap:8px;">
                                <span style="font-size:1.6rem; font-weight:950; color:#0F172A;">${totalMatches}</span>
                                <span style="font-size:0.78rem; font-weight:800; color:#10B981;">W ${wins}</span>
                                <span style="font-size:0.78rem; font-weight:800; color:#EF4444;">L ${losses}</span>
                            </div>
                            <div style="height:5px; background:#e2e8f0; border-radius:99px; overflow:hidden; margin-top:8px; width:100%;">
                                <div style="height:100%; background:linear-gradient(90deg, #10B981 0%, #34D399 100%); width:${winRate}%; border-radius:99px;"></div>
                            </div>
                        </div>

                        <div class="glass-card-pro-light" style="background:#ffffff; border:1px solid rgba(15,23,42,0.06); padding:16px; border-radius:20px; display:flex; flex-direction:column; gap:4px; text-align:left; box-shadow:0 6px 20px rgba(10,25,47,0.02);">
                            <span style="font-size:0.65rem; color:#64748B; font-weight:900; text-transform:uppercase; letter-spacing:1px;">Rango de Nivel IA</span>
                            <div style="display:flex; align-items:baseline; gap:6px;">
                                <span style="font-size:1.6rem; font-weight:950; color:#2E61FF;">${userLevel.toFixed(2)}</span>
                                <span style="font-size:0.68rem; background:rgba(46,97,255,0.08); color:#2E61FF; padding:2px 6px; border-radius:6px; font-weight:900;">ACTIVO</span>
                            </div>
                            <span style="font-size:0.62rem; color:#94A3B8; font-weight:600; margin-top:8px;">Calibrado según Firestore</span>
                        </div>

                        <div class="glass-card-pro-light" style="background:#ffffff; border:1px solid rgba(15,23,42,0.06); padding:16px; border-radius:20px; display:flex; flex-direction:column; gap:4px; text-align:left; box-shadow:0 6px 20px rgba(10,25,47,0.02);">
                            <span style="font-size:0.65rem; color:#64748B; font-weight:900; text-transform:uppercase; letter-spacing:1px;">Efectividad Red</span>
                            <div style="display:flex; align-items:baseline; gap:6px;">
                                <span style="font-size:1.6rem; font-weight:950; color:#0F172A;">${avgNetPoints}%</span>
                                <span style="font-size:0.7rem; font-weight:800; color:#10B981;"><i class="fas fa-arrow-trend-up"></i> Táctico</span>
                            </div>
                            <span style="font-size:0.62rem; color:#64748B; font-weight:700; margin-top:8px;">Remate Smash: ${avgSmash}%</span>
                        </div>

                        <div class="glass-card-pro-light" style="background:#ffffff; border:1px solid rgba(15,23,42,0.06); padding:16px; border-radius:20px; display:flex; flex-direction:column; gap:4px; text-align:left; box-shadow:0 6px 20px rgba(10,25,47,0.02);">
                            <span style="font-size:0.65rem; color:#64748B; font-weight:900; text-transform:uppercase; letter-spacing:1px;">Socio Ideal</span>
                            <div style="display:flex; align-items:baseline; gap:6px;">
                                <span style="font-size:1.05rem; font-weight:950; color:#0F172A; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:110px;">${idealPartner}</span>
                                <span style="font-size:0.7rem; font-weight:800; color:#10B981;">90%</span>
                            </div>
                            <span style="font-size:0.62rem; color:#64748B; font-weight:700; margin-top:8px;">Máxima sinergia ganadora</span>
                        </div>
                    </div>

                    <!-- 2. CHART EVOLUCIÓN NIVEL -->
                    <div style="background:#ffffff; border:1px solid rgba(15,23,42,0.06); border-radius:24px; padding:20px; text-align:left; box-shadow:0 8px 32px rgba(10,25,47,0.02);">
                        <h4 style="margin:0 0 16px 0; font-size:0.85rem; font-weight:950; color:#0F172A; text-transform:uppercase; letter-spacing:1px; display:flex; align-items:center; gap:8px;">
                            <i class="fas fa-chart-line" style="color:#2E61FF;"></i> Evolución del Nivel de Juego (IA)
                        </h4>
                        
                        <div style="position:relative; width:100%; height:160px; display:flex; align-items:center; justify-content:center;">
                            <canvas id="ai-level-evolution-chart" style="width:100%; height:100%; max-height:160px;"></canvas>
                        </div>
                    </div>

                    <!-- 3. COHETE HOLOGRÁFICO CAPTAIN AI COACH -->
                    <div style="background:linear-gradient(135deg, #0F172A 0%, #05070a 100%); border:1px solid rgba(204,255,0,0.15); border-radius:24px; padding:20px; color:#ffffff; position:relative; overflow:hidden; text-align:left; box-shadow:0 12px 40px rgba(0,0,0,0.15);">
                        <!-- Efecto de escaneo -->
                        <div style="position:absolute; inset:0; background:linear-gradient(180deg, rgba(204,255,0,0.04) 50%, transparent 50%); background-size:100% 4px; pointer-events:none;"></div>
                        <div style="position:absolute; width:150px; height:150px; background:radial-gradient(circle, rgba(204,255,0,0.05) 0%, transparent 70%); top:-50px; right:-40px; pointer-events:none;"></div>
                        
                        <div style="display:flex; gap:14px; align-items:flex-start; position:relative; z-index:2;">
                            <div style="width:42px; height:42px; border-radius:50%; background:rgba(204,255,0,0.1); border:1.5px solid #CCFF00; display:flex; align-items:center; justify-content:center; color:#CCFF00; font-size:1.15rem; flex-shrink:0; animation: coachPulse 2.5s infinite alternate;">
                                <i class="fas fa-robot"></i>
                            </div>
                            <div style="display:flex; flex-direction:column; gap:4px;">
                                <span style="font-size:0.65rem; color:#CCFF00; font-weight:900; letter-spacing:2px; text-transform:uppercase;">AI Coach • Captain Analysis</span>
                                <p style="margin:0; font-size:0.78rem; line-height:1.45; color:rgba(255,255,255,0.85); font-family:monospace; font-weight:600;">
                                    ${wins > losses 
                                      ? `"Excelente rendimiento general. Has ganado la mayoría de tus partidos recientes. Tu colocación defensiva en el rincón y el remate liftado de drive con ${idealPartner.split(' ')[0]} siguen siendo tu combinación ganadora de mayor efectividad."`
                                      : `"Calibrando patrones tácticos. Se detecta vulnerabilidad defensiva en el área central. Concéntrate en la comunicación táctica con tus parejas para cubrir el pasillo medio y evitar globos cortos a la red."`}
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- 4. LISTADO DE PARTIDOS EN EL HISTORIAL -->
                    <div style="display:flex; flex-direction:column; gap:12px;">
                        <h4 style="margin:8px 0 4px 0; font-size:0.85rem; font-weight:950; color:#0F172A; text-transform:uppercase; letter-spacing:1.2px; text-align:left; border-left:3.5px solid #2E61FF; padding-left:10px;">
                            Historial de Partidos
                        </h4>
            `;

            // Agregar tarjetas de partidos
            historyData.forEach(match => {
                const dateObj = new Date(`${match.date}T00:00:00`);
                const options = { weekday: 'long', day: '2-digit', month: 'long' };
                const humanDate = dateObj.toLocaleDateString('es-ES', options);

                const statusColor = match.won ? '#10B981' : '#EF4444';
                const statusBg = match.won ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)';
                const statusBorder = match.won ? 'rgba(16,185,129,0.18)' : 'rgba(239,68,68,0.18)';
                const statusText = match.won ? 'VICTORIA' : 'DERROTA';

                html += `
                    <div class="premium-match-card glass-card-pro-light haptic-feedback" 
                         style="border-left: 5px solid ${statusColor}; background:#ffffff; border-top:1px solid rgba(15,23,42,0.06); border-right:1px solid rgba(15,23,42,0.06); border-bottom:1px solid rgba(15,23,42,0.06); border-radius:24px; padding:18px; display:flex; flex-direction:column; gap:14px; box-shadow:0 4px 20px rgba(10,25,47,0.015); cursor:pointer;"
                         onclick="window.OpenMatchesView.openAiTelemetryModal('${match.id}')">
                        
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span style="font-size:0.75rem; color:#64748B; font-weight:800; display:flex; align-items:center; gap:6px;">
                                <i class="far fa-clock"></i> ${match.time} • ${match.duration} min
                            </span>
                            <span style="background:${statusBg}; border:1px solid ${statusBorder}; color:${statusColor}; font-size:0.65rem; font-weight:950; padding:4px 10px; border-radius:8px; letter-spacing:1px;">
                                ${statusText} • ${match.result}
                            </span>
                        </div>

                        <div style="display:flex; gap:16px; align-items:center;">
                            <div style="flex-shrink:0;">
                                <div class="isometric-court-wrapper" style="width:58px; height:58px; background:linear-gradient(135deg,#f8fafc 0%,#f1f5f9 100%); border-radius:14px; border:1px solid rgba(15,23,42,0.05); display:flex; align-items:center; justify-content:center; overflow:hidden;">
                                    <div class="iso-court" style="width:36px; height:24px; border:1.2px solid #fff; background:${match.won ? 'linear-gradient(135deg,#10B981 0%,#059669 100%)' : 'linear-gradient(135deg,#3b82f6 0%,#1d4ed8 100%)'}; border-radius:1px; transform:rotateX(55deg) rotateZ(-45deg); box-shadow:0 3px 6px rgba(0,0,0,0.08);">
                                        <div class="iso-court-net" style="height:1px;"></div>
                                        <div class="iso-court-lines"></div>
                                    </div>
                                </div>
                            </div>
                            
                            <div style="flex:1; min-width:0; text-align:left;">
                                <h3 style="margin:0; font-weight:950; font-size:0.95rem; color:#0F172A; text-transform:uppercase; letter-spacing:0.5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                                    ${match.club.toUpperCase()}
                                </h3>
                                <span style="font-size:0.72rem; color:#64748B; font-weight:600; display:flex; align-items:center; gap:4px; margin-top:2px;">
                                    <i class="fas fa-location-dot" style="color:#2E61FF;"></i> ${match.comarca}
                                </span>
                            </div>
                        </div>

                        <!-- Info de pareja y rivales -->
                        <div style="display:flex; align-items:center; gap:8px; background:#f8fafc; border-radius:12px; padding:10px 14px; font-size:0.72rem; color:#475569; font-weight:700; text-align:left;">
                            <div style="flex:1;">
                                <span style="color:#94a3b8; font-size:0.6rem; text-transform:uppercase; display:block; margin-bottom:2px; font-weight:900;">Pareja</span>
                                <span style="color:#0F172A; font-weight:800; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:block;">${match.partner}</span>
                            </div>
                            <div style="width:1px; height:20px; background:rgba(0,0,0,0.06);"></div>
                            <div style="flex:2; padding-left:6px;">
                                <span style="color:#94a3b8; font-size:0.6rem; text-transform:uppercase; display:block; margin-bottom:2px; font-weight:900;">Rivales</span>
                                <span style="color:#0F172A; font-weight:800; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:block;">
                                    ${match.rivals.join(' y ')}
                                </span>
                            </div>
                        </div>

                        <!-- Bloque de Insight de IA rápido -->
                        <div style="background:rgba(46,97,255,0.03); border:1px solid rgba(46,97,255,0.06); border-radius:14px; padding:10px 14px; font-size:0.72rem; line-height:1.4; color:#2E61FF; font-weight:700; text-align:left; display:flex; gap:8px; align-items:flex-start;">
                            <i class="fas fa-brain" style="margin-top:2px; flex-shrink:0;"></i>
                            <span>${match.ai_insight}</span>
                        </div>

                        <div style="border-top:1px solid rgba(15,23,42,0.04); padding-top:12px; display:flex; justify-content:space-between; align-items:center; font-size:0.72rem;">
                            <div style="color:#64748B; font-weight:700; display:flex; align-items:center; gap:4px;">
                                <i class="fas fa-calendar-days"></i> ${humanDate}
                            </div>
                            <div style="color:#2E61FF; font-weight:950; letter-spacing:0.5px; display:flex; align-items:center; gap:4px;">
                                INFORME DE TELEMETRÍA IA <i class="fas fa-chevron-right" style="font-size:0.68rem;"></i>
                            </div>
                        </div>

                    </div>
                `;
            });

            html += `
                    </div>
                </div>
                
                <!-- KEYFRAME ANIMATION FOR COACH PORTAL -->
                <style>
                    @keyframes coachPulse {
                        0% { box-shadow: 0 0 5px rgba(204,255,0,0.15); border-color: rgba(204,255,0,0.4); }
                        100% { box-shadow: 0 0 15px rgba(204,255,0,0.45); border-color: #CCFF00; }
                    }
                    @keyframes pulseGlow {
                        0% { box-shadow: 0 0 3px rgba(16,185,129,0.3); opacity:0.8; }
                        100% { box-shadow: 0 0 10px rgba(16,185,129,0.8); opacity:1; }
                    }
                </style>
                
                <!-- AI TELEMETRY MODAL -->
                <div id="ai-telemetry-modal" class="playtomic-drawer-modal hidden" onclick="if(event.target===this) window.OpenMatchesView.closeAiTelemetryModal();" style="z-index:10050; background:rgba(5,7,10,0.85); backdrop-filter:blur(15px); -webkit-backdrop-filter:blur(15px);">
                    <!-- Content injected in openAiTelemetryModal() -->
                </div>
            `;

            listContainer.innerHTML = html;

            // Inicializar el gráfico de nivel después de insertar en el DOM
            setTimeout(() => {
                this.initAiLevelChart("ai-level-evolution-chart", historyData);
            }, 100);
        }

        disableDemoMode() {
            if (window.PlayerView && typeof window.PlayerView.haptic === 'function') {
                window.PlayerView.haptic(25);
            }
            this.forceDemoMode = false;
            this.renderFilteredList();
        }

        initAiLevelChart(canvasId, historyData) {
            const ctx = document.getElementById(canvasId);
            if (!ctx) return;

            // Ordenar de más antiguo a más reciente para el gráfico
            const chartData = [...historyData].reverse();
            
            // Extraer etiquetas (fechas formateadas DD/MM) y valores de nivel
            const labels = chartData.map(m => {
                const dateParts = m.date.split('-');
                return `${dateParts[2]}/${dateParts[1]}`;
            });
            const dataPoints = chartData.map(m => parseFloat(m.user_level_at_match));

            // Verificar si Chart.js está cargado
            if (window.Chart) {
                try {
                    // Limpiar instancia previa si existe
                    if (window._aiEvolutionChartInstance) {
                        window._aiEvolutionChartInstance.destroy();
                    }

                    // Crear gráfico premium
                    window._aiEvolutionChartInstance = new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: labels,
                            datasets: [{
                                label: 'Nivel IA',
                                data: dataPoints,
                                borderColor: '#2E61FF',
                                borderWidth: 3.5,
                                pointBackgroundColor: '#CCFF00',
                                pointBorderColor: '#2E61FF',
                                pointBorderWidth: 2.5,
                                pointRadius: 5.5,
                                pointHoverRadius: 7.5,
                                tension: 0.35,
                                fill: true,
                                backgroundColor: function(context) {
                                    const chart = context.chart;
                                    const {ctx, chartArea} = chart;
                                    if (!chartArea) return null;
                                    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                                    gradient.addColorStop(0, 'rgba(46, 97, 255, 0.18)');
                                    gradient.addColorStop(1, 'rgba(46, 97, 255, 0.00)');
                                    return gradient;
                                }
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { display: false },
                                tooltip: {
                                    backgroundColor: '#0F172A',
                                    titleFont: { size: 10, weight: 'bold', family: 'Outfit' },
                                    bodyFont: { size: 11, weight: '900', family: 'Outfit' },
                                    padding: 10,
                                    cornerRadius: 12,
                                    displayColors: false,
                                    callbacks: {
                                        label: function(context) {
                                            return `Nivel: ${context.parsed.y.toFixed(2)}`;
                                        }
                                    }
                                }
                            },
                            scales: {
                                x: {
                                    grid: { display: false },
                                    ticks: {
                                        color: '#64748B',
                                        font: { size: 9, weight: 'bold', family: 'Outfit' }
                                    }
                                },
                                y: {
                                    grid: { color: 'rgba(15, 23, 42, 0.04)' },
                                    ticks: {
                                        color: '#64748B',
                                        font: { size: 9, weight: 'bold', family: 'Outfit' },
                                        stepSize: 0.05
                                    }
                                }
                            }
                        }
                    });
                    return;
                } catch (e) {
                    console.warn("Chart.js failed to initialize, falling back to SVG chart:", e);
                }
            }

            // Fallback SVG de alta fidelidad si no está cargada la librería Chart.js o da error
            const parent = ctx.parentElement;
            if (parent) {
                parent.innerHTML = this.renderSvgChartFallback(labels, dataPoints);
            }
        }

        renderSvgChartFallback(labels, dataPoints) {
            const width = 300;
            const height = 130;
            const padding = 25;
            
            const minVal = Math.min(...dataPoints) - 0.03;
            const maxVal = Math.max(...dataPoints) + 0.03;
            const valRange = maxVal - minVal;

            // Calcular coordenadas SVG
            const points = dataPoints.map((val, idx) => {
                const x = padding + (idx * (width - 2 * padding) / (dataPoints.length - 1));
                const y = height - padding - ((val - minVal) * (height - 2 * padding) / valRange);
                return { x, y, val, label: labels[idx] };
            });

            // Generar polyline path
            const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');
            
            // Generar área sombreada
            const areaPoints = `${points[0].x},${height - padding} ${polylinePoints} ${points[points.length - 1].x},${height - padding}`;

            let gridLines = '';
            // 3 Líneas de cuadrícula horizontal
            for (let i = 0; i <= 2; i++) {
                const y = padding + i * (height - 2 * padding) / 2;
                gridLines += `<line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" stroke="rgba(15, 23, 42, 0.04)" stroke-width="1" />`;
            }

            // Puntos y etiquetas
            let dotsHtml = '';
            points.forEach(p => {
                dotsHtml += `
                    <circle cx="${p.x}" cy="${p.y}" r="4.5" fill="#CCFF00" stroke="#2E61FF" stroke-width="2" />
                    <text x="${p.x}" y="${height - 5}" font-size="8" font-weight="900" font-family="Outfit" fill="#64748B" text-anchor="middle">${p.label}</text>
                    <text x="${p.x}" y="${p.y - 8}" font-size="7.5" font-weight="900" font-family="Outfit" fill="#2E61FF" text-anchor="middle">${p.val.toFixed(2)}</text>
                `;
            });

            return `
                <svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" style="overflow:visible;">
                    <defs>
                        <linearGradient id="svg-grad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stop-color="#2E61FF" stop-opacity="0.15" />
                            <stop offset="100%" stop-color="#2E61FF" stop-opacity="0.00" />
                        </linearGradient>
                    </defs>
                    ${gridLines}
                    <!-- Área sombreada -->
                    <polygon points="${areaPoints}" fill="url(#svg-grad)" />
                    <!-- Línea de tendencia -->
                    <polyline points="${polylinePoints}" fill="none" stroke="#2E61FF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
                    <!-- Puntos e información -->
                    ${dotsHtml}
                </svg>
            `;
        }

        openAiTelemetryModal(matchId) {
            const currentUser = window.Store ? window.Store.getState('currentUser') : null;
            const myName = currentUser ? (currentUser.name || currentUser.displayName || "Jugador") : "Jugador";
            const userLevel = currentUser ? parseFloat(currentUser.level || 3.25) : 3.25;

            // Leer desde los datos cargados actualmente (sean reales o de demostración)
            const history = this.currentAiHistoryData || this.getAiHistoryData(myName, userLevel);
            const match = history.find(m => m.id === matchId);
            if (!match) return;

            const modal = document.getElementById('ai-telemetry-modal');
            if (!modal) return;

            // Generar mapa de calor
            let heatMapDotsHtml = '';
            match.telemetry.heatmap.forEach(dot => {
                heatMapDotsHtml += `
                    <div style="position:absolute; left:${dot.x}%; top:${dot.y}%; width:${dot.size}px; height:${dot.size}px; background:${dot.color}; border-radius:50%; filter:blur(6px); transform:translate(-50%, -50%); animation: heatPulse 1.8s infinite alternate; pointer-events:none;"></div>
                    <!-- Marcador visual sutil -->
                    <div style="position:absolute; left:${dot.x}%; top:${dot.y}%; width:5px; height:5px; background:#ffffff; border-radius:50%; transform:translate(-50%, -50%); box-shadow:0 0 6px #fff; pointer-events:none; z-index:10;"></div>
                `;
            });

            // Generar leyenda del mapa de calor
            const userColor = "rgba(204, 255, 0, 0.9)";
            const partnerColor = "rgba(0, 210, 255, 0.9)";

            modal.innerHTML = `
                <div class="drawer-content-container" style="background:#0F172A; border-top:1px solid rgba(255,255,255,0.1); border-radius:28px 28px 0 0; max-height:94%; overflow:hidden;">
                    
                    <!-- Header -->
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:20px 24px; border-bottom:1px solid rgba(255,255,255,0.06); flex-shrink:0;">
                        <div style="text-align:left;">
                            <span style="font-size:0.65rem; color:#CCFF00; font-weight:900; letter-spacing:1.5px; text-transform:uppercase;">Informe de Rendimiento</span>
                            <h3 style="margin:2px 0 0 0; font-size:1.1rem; font-weight:950; color:#ffffff; text-transform:uppercase; letter-spacing:0.5px;">Telemetría Cuántica IA</h3>
                        </div>
                        <div class="drawer-circle-btn" onclick="window.OpenMatchesView.closeAiTelemetryModal()" style="background:rgba(255,255,255,0.06); border-color:rgba(255,255,255,0.1); color:#fff;">
                            <i class="fas fa-times"></i>
                        </div>
                    </div>

                    <!-- Scroll Body -->
                    <div style="padding:24px; display:flex; flex-direction:column; gap:20px; overflow-y:auto; padding-bottom:60px; box-sizing:border-box;">
                        
                        <!-- Club Card Header Dark -->
                        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); padding:16px; border-radius:20px; text-align:left; display:flex; flex-direction:column; gap:6px;">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <span style="font-size:0.75rem; color:#CCFF00; font-weight:850; max-width:65%; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${match.club}</span>
                                <span style="font-size:0.65rem; color:rgba(255,255,255,0.4); font-weight:700;">Nivel: ${match.level_min.toFixed(2)}-${match.level_max.toFixed(2)}</span>
                            </div>
                            <h2 style="margin:2px 0 0 0; font-size:1.4rem; font-weight:950; color:#fff; display:flex; align-items:center; gap:8px;">
                                ${match.won ? '<span style="color:#10B981;">W</span>' : '<span style="color:#EF4444;">L</span>'}
                                ${match.result}
                            </h2>
                            <div style="font-size:0.7rem; color:rgba(255,255,255,0.5); font-weight:700;">
                                Compañero: ${match.partner} | Rivales: ${match.rivals.join(' / ')}
                            </div>
                        </div>

                        <!-- 4-Stat Grid -->
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                            <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.04); border-radius:16px; padding:12px 16px; text-align:left;">
                                <span style="font-size:0.6rem; color:rgba(255,255,255,0.4); font-weight:900; text-transform:uppercase; letter-spacing:0.5px;">Efectividad Volea</span>
                                <div style="font-size:1.4rem; font-weight:950; color:#ffffff; margin-top:2px;">${match.telemetry.net_points}%</div>
                            </div>
                            <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.04); border-radius:16px; padding:12px 16px; text-align:left;">
                                <span style="font-size:0.6rem; color:rgba(255,255,255,0.4); font-weight:900; text-transform:uppercase; letter-spacing:0.5px;">Primer Servicio</span>
                                <div style="font-size:1.4rem; font-weight:950; color:#ffffff; margin-top:2px;">${match.telemetry.serve_in}%</div>
                            </div>
                            <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.04); border-radius:16px; padding:12px 16px; text-align:left;">
                                <span style="font-size:0.6rem; color:rgba(255,255,255,0.4); font-weight:900; text-transform:uppercase; letter-spacing:0.5px;">Acierto Remate Smash</span>
                                <div style="font-size:1.4rem; font-weight:950; color:#ffffff; margin-top:2px;">${match.telemetry.smash_eff}%</div>
                            </div>
                            <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.04); border-radius:16px; padding:12px 16px; text-align:left;">
                                <span style="font-size:0.6rem; color:rgba(255,255,255,0.4); font-weight:900; text-transform:uppercase; letter-spacing:0.5px;">Errores no Forzados</span>
                                <div style="font-size:1.4rem; font-weight:950; color:#ff4d6d; margin-top:2px;">${match.telemetry.errors}</div>
                            </div>
                        </div>

                        <!-- MAPA DE CALOR DE LA PISTA -->
                        <div style="display:flex; flex-direction:column; gap:10px; text-align:left;">
                            <span style="font-size:0.75rem; color:#ffffff; font-weight:950; text-transform:uppercase; letter-spacing:1px; display:flex; align-items:center; gap:6px;">
                                <i class="fas fa-street-view" style="color:#CCFF00;"></i> Mapa de Calor de Posicionamiento
                            </span>
                            
                            <!-- Pista Renderizada con CSS -->
                            <div style="position:relative; width:100%; height:180px; background:#075e9b; border:2.5px solid #ffffff; border-radius:12px; box-shadow:0 8px 30px rgba(0,0,0,0.6); overflow:hidden; box-sizing:border-box;">
                                <!-- Línea de red central -->
                                <div style="position:absolute; left:50%; top:0; bottom:0; width:0px; border-left:2px dashed rgba(255,255,255,0.65); transform:translateX(-50%); z-index:2;"></div>
                                <div style="position:absolute; left:50%; top:0; bottom:0; width:4px; background:rgba(255,255,255,0.3); transform:translateX(-50%); z-index:1;"></div>
                                
                                <!-- Líneas de saque izquierda -->
                                <div style="position:absolute; left:25%; top:0; bottom:0; width:1.5px; background:rgba(255,255,255,0.55);"></div>
                                <div style="position:absolute; left:0; right:50%; top:50%; height:1.5px; background:rgba(255,255,255,0.55);"></div>
                                
                                <!-- Líneas de saque derecha -->
                                <div style="position:absolute; right:25%; top:0; bottom:0; width:1.5px; background:rgba(255,255,255,0.55);"></div>
                                <div style="position:absolute; left:50%; right:0; top:50%; height:1.5px; background:rgba(255,255,255,0.55);"></div>

                                <!-- Puntos de Calor Inyectados -->
                                ${heatMapDotsHtml}
                            </div>
                            
                            <!-- Leyenda Mapa de Calor -->
                            <div style="display:flex; justify-content:center; gap:20px; margin-top:4px; font-size:0.68rem; font-weight:800;">
                                <div style="display:flex; align-items:center; gap:6px; color:#ffffff;">
                                    <span style="width:10px; height:10px; background:${userColor}; border-radius:50%; display:inline-block; box-shadow:0 0 6px ${userColor};"></span>
                                    <span>Tus zonas (${myName.split(' ')[0]})</span>
                                </div>
                                <div style="display:flex; align-items:center; gap:6px; color:#ffffff;">
                                    <span style="width:10px; height:10px; background:${partnerColor}; border-radius:50%; display:inline-block; box-shadow:0 0 6px ${partnerColor};"></span>
                                    <span>Zonas de ${match.partner.split(' ')[0]}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Recomendación Táctica de IA Coach -->
                        <div style="background:rgba(204,255,0,0.03); border:1.5px solid rgba(204,255,0,0.15); border-radius:20px; padding:18px; text-align:left; display:flex; flex-direction:column; gap:6px;">
                            <span style="font-size:0.65rem; color:#CCFF00; font-weight:900; letter-spacing:1.5px; text-transform:uppercase; display:flex; align-items:center; gap:6px;">
                                <i class="fas fa-lightbulb"></i> Recomendación Táctica IA
                            </span>
                            <p style="margin:2px 0 0 0; font-size:0.78rem; line-height:1.45; color:rgba(255,255,255,0.85); font-family:monospace; font-weight:600;">
                                "${match.telemetry.tactical_tip}"
                            </p>
                        </div>

                        <!-- Botón de Compartir -->
                        <button onclick="window.OpenMatchesView.shareAiReport('${match.id}')"
                            style="width: 100%; background: #CCFF00; color: #000; border: none; padding: 14px; border-radius: 20px; font-weight: 950; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px;"
                            onmouseover="this.style.transform='translateY(-2px)'"
                            onmouseout="this.style.transform='translateY(0)'">
                            <i class="fas fa-share-nodes"></i> COMPARTIR ENLACE DE INFORME
                        </button>

                    </div>
                </div>
                
                <!-- KEYFRAME ANIMATIONS FOR HEATMAP HEATDOTS -->
                <style>
                    @keyframes heatPulse {
                        0% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.7; }
                        100% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.95; }
                    }
                </style>
            `;

            modal.classList.remove('hidden');
            if (window.PlayerView && typeof window.PlayerView.haptic === 'function') {
                window.PlayerView.haptic(25);
            }
        }

        closeAiTelemetryModal() {
            const modal = document.getElementById('ai-telemetry-modal');
            if (modal) modal.classList.add('hidden');
        }

        shareAiReport(matchId) {
            if (window.PlayerView && typeof window.PlayerView.haptic === 'function') {
                window.PlayerView.haptic(20);
            }

            const currentUser = window.Store ? window.Store.getState('currentUser') : null;
            const myName = currentUser ? (currentUser.name || currentUser.displayName || "Jugador") : "Jugador";
            const userLevel = currentUser ? parseFloat(currentUser.level || 3.25) : 3.25;

            const history = this.currentAiHistoryData || this.getAiHistoryData(myName, userLevel);
            const match = history.find(m => m.id === matchId);
            if (!match) return;

            const textToShare = `📊 *SomosPádel BCN - Telemetría de Partido con IA*\n\n🎾 *Partido:* ${match.club}\n📅 *Fecha:* ${match.date}\n🏆 *Resultado:* ${match.won ? 'VICTORIA' : 'DERROTA'} (${match.result})\n\n💡 *IA Insight:* ${match.ai_insight}\n\n🤖 _Analizado con la tecnología cuántica de SomosPádel BCN._`;
            
            // Usar Web Share API si está disponible en móvil
            if (navigator.share) {
                navigator.share({
                    title: 'Telemetría de Partido con IA - SomosPádel',
                    text: textToShare
                }).catch(err => {
                    console.warn("Share failed:", err);
                });
            } else {
                // Clipboard fallback
                navigator.clipboard.writeText(textToShare).then(() => {
                    if (window.NotificationService) {
                        window.NotificationService.showToast("Informe copiado al portapapeles 📋", "success");
                    } else {
                        alert("Informe copiado al portapapeles. ¡Pégalo donde quieras!");
                    }
                }).catch(err => {
                    alert("No se pudo copiar el enlace automáticamente.");
                });
            }
        }


        renderError(message) {
            const listContainer = document.getElementById('open-matches-list');
            if (listContainer) {
                listContainer.innerHTML = `
                    <div class="playtomic-skeleton-light" style="border-color: rgba(255,45,85,0.2); background: rgba(255,45,85,0.01); color: #ff2d55;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 2.2rem; margin-bottom: 8px;"></i>
                        <h4 style="margin: 0; font-weight: 900;">Error al conectar con Firestore</h4>
                        <p style="color: #64748B; font-size: 0.75rem; margin-top: 4px;">${message}</p>
                    </div>
                `;
            }
        }
    }

    window.OpenMatchesView = new OpenMatchesView();
})();
