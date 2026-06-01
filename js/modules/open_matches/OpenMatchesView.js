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
        }

        renderLayout() {
            const content = document.getElementById(this.containerId);
            if (!content) return;

            // Enforce page title
            const titleEl = document.getElementById('page-title');
            if (titleEl) titleEl.textContent = 'PARTIDAS ABIERTAS';

            // Check if user is Admin
            const currentUser = window.Store ? window.Store.getState('currentUser') : null;
            const isAdmin = currentUser && ['super_admin', 'superadmin', 'admin', 'admin_player', 'captain'].includes((currentUser.role || '').toLowerCase());

            content.innerHTML = `
                <div class="playtomic-app-light fade-in">
                    
                    <!-- TOP HEADER MOBILE (Playtomic Title) -->
                    <div class="playtomic-top-header">
                        <i class="fas fa-arrow-left header-back-btn" onclick="window.Router?.navigate('dashboard')"></i>
                        <span class="header-title">Competiciones</span>
                        <div style="width: 24px;"></div> <!-- Spacer to center title -->
                    </div>

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
                            <i class="fas fa-search" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #ccff00; font-size: 0.8rem; z-index: 10;"></i>
                            <input type="text" id="player-feed-search-input" oninput="window.OpenMatchesView.handleFeedSearch(this.value)" placeholder="Buscar club, comarca, nivel..." class="playtomic-input" style="width: 100%; height: 38px; padding-left: 36px !important; padding-right: 32px; font-size: 0.85rem; font-weight: 800; border-radius: 12px; border: 1.5px solid rgba(255, 255, 255, 0.08); background: #10131c; color: #ffffff; box-sizing: border-box;">
                            <i class="fas fa-times-circle" id="player-feed-search-clear" onclick="document.getElementById('player-feed-search-input').value=''; window.OpenMatchesView.handleFeedSearch(''); this.style.display='none';" style="display: none; position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: #ccff00; cursor: pointer; font-size: 0.85rem; z-index: 10;"></i>
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

                            <textarea id="sim-wa-message" rows="3" class="playtomic-input" style="width: 100%; font-size: 0.72rem; padding: 8px; resize: vertical; margin-bottom: 8px;" placeholder="Pega el mensaje de WhatsApp aquí..."></textarea>
                            
                            <button id="sim-btn-send" onclick="window.OpenMatchesView.handleSimulateSubmit()" class="playtomic-btn-blue" style="width: 100%; padding: 8px; font-size: 0.75rem; border-radius: 8px; background: #2E61FF;">
                                🚀 SIMULAR INTEGRACIÓN WHATSAPP
                            </button>
                            
                            <div id="sim-console-output" style="margin-top: 8px; padding: 8px; background: #F1F5F9; border: 1px solid #E2E8F0; border-radius: 6px; font-family: monospace; font-size: 0.68rem; color: #0F172A; min-height: 25px; display: none;"></div>
                        </div>
                    </div>
                    ` : ''}

                </div>

                <!-- 🌟 PLAYTOMIC MOBILE LIGHT THEMING -->
                <style>
                    .playtomic-app-light {
                        max-width: 600px;
                        margin: 0 auto;
                        min-height: 100vh;
                        background: #08090d;
                        color: #ffffff;
                        font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
                        padding-bottom: 120px;
                        position: relative;
                        overflow-x: hidden;
                    }

                    /* Floating Action Button (FAB) */
                    .playtomic-fab-create {
                        position: fixed;
                        bottom: 96px;
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
                        z-index: 1000;
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
                        background: #10131c;
                        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                        position: sticky;
                        top: 0;
                        z-index: 100;
                    }
                    .header-back-btn {
                        font-size: 1.15rem;
                        color: #ffffff;
                        cursor: pointer;
                        padding: 4px;
                        transition: color 0.2s;
                    }
                    .header-back-btn:hover {
                        color: #ccff00;
                    }
                    .header-title {
                        font-size: 1.1rem;
                        font-weight: 950;
                        color: #ffffff;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                    }

                    /* 2. Sub Navigation Tabs */
                    .playtomic-tabs-container {
                        display: flex;
                        background: #10131c;
                        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
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
                        color: #ccff00;
                    }
                    .playtomic-tab-btn.active::after {
                        content: '';
                        position: absolute;
                        bottom: 0;
                        left: 0;
                        width: 100%;
                        height: 3px;
                        background: #ccff00;
                        border-radius: 4px;
                        box-shadow: 0 0 10px rgba(204, 255, 0, 0.5);
                    }

                    /* 3. Slider Filter Bar */
                    .playtomic-meta-filters {
                        padding: 12px 16px;
                        display: flex;
                        gap: 12px;
                        background: #08090d;
                    }
                    .filter-sliders-btn {
                        width: 38px;
                        height: 38px;
                        background: #10131c;
                        border: 1px solid rgba(255, 255, 255, 0.08);
                        border-radius: 12px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        position: relative;
                        box-shadow: 0 4px 10px rgba(0,0,0,0.2);
                        transition: all 0.2s;
                    }
                    .filter-sliders-btn:hover {
                        border-color: #ccff00;
                    }
                    .filter-sliders-btn i {
                        font-size: 0.95rem;
                        color: #ccff00;
                    }
                    .filter-sliders-dot {
                        position: absolute;
                        top: 2px;
                        right: 2px;
                        width: 7px;
                        height: 7px;
                        background: #ccff00;
                        border-radius: 50%;
                        border: 1px solid #10131c;
                        box-shadow: 0 0 5px #ccff00;
                    }

                    .playtomic-input {
                        background: #10131c;
                        border: 1.5px solid rgba(255, 255, 255, 0.08);
                        color: #ffffff;
                        border-radius: 12px;
                        outline: none;
                        font-family: inherit;
                        transition: all 0.2s;
                    }
                    .playtomic-input:focus {
                        border-color: #ccff00;
                        box-shadow: 0 0 15px rgba(204, 255, 0, 0.15);
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
                        color: #ccff00;
                        text-transform: uppercase;
                        letter-spacing: 1.2px;
                        margin-top: 15px;
                        border-left: 3.5px solid #ccff00;
                        padding-left: 10px;
                        font-weight: 950;
                    }

                    /* Premium Match Cards style override */
                    .premium-match-card {
                        position: relative;
                        background: linear-gradient(135deg, #121620 0%, #0d0f14 100%);
                        border: 1.5px solid rgba(255, 255, 255, 0.08);
                        border-radius: 24px;
                        padding: 18px;
                        display: flex;
                        flex-direction: column;
                        gap: 14px;
                        cursor: pointer;
                        overflow: hidden;
                        transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
                        box-shadow: 0 8px 32px rgba(0,0,0,0.25);
                        text-align: left;
                    }
                    .premium-match-card:hover {
                        transform: translateY(-5px);
                        border-color: #ccff00;
                        box-shadow: 0 12px 40px rgba(204, 255, 0, 0.15);
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
                        background: radial-gradient(circle, rgba(204, 255, 0, 0.15) 0%, rgba(204,255,0,0) 70%);
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
                        background: rgba(255, 255, 255, 0.06);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        color: #ffffff;
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
                        color: #ccff00;
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
                    .neon-court {
                        width: 60px;
                        height: 60px;
                        border-radius: 16px;
                        background: linear-gradient(135deg, #090a0f 0%, #151821 100%);
                        border: 2px solid #ccff00;
                        box-shadow: inset 0 0 10px rgba(204, 255, 0, 0.2), 0 0 15px rgba(204, 255, 0, 0.1);
                        position: relative;
                        overflow: hidden;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .court-net {
                        position: absolute;
                        width: 100%;
                        height: 2px;
                        background: rgba(204, 255, 0, 0.35);
                        top: 50%;
                        transform: translateY(-50%);
                    }
                    .court-inner-lines {
                        position: absolute;
                        width: 75%;
                        height: 75%;
                        border: 1px solid rgba(255, 255, 255, 0.2);
                    }
                    .court-glow-ball {
                        width: 9px;
                        height: 9px;
                        background: #ccff00;
                        border-radius: 50%;
                        position: absolute;
                        top: 35%;
                        left: 35%;
                        box-shadow: 0 0 8px #ccff00, 0 0 15px #ccff00;
                        animation: neonBallFloat 3s ease-in-out infinite alternate;
                    }
                    @keyframes neonBallFloat {
                        0% { transform: scale(1) translate(0, 0); }
                        100% { transform: scale(1.1) translate(3px, 3px); }
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
                        color: #ffffff;
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
                        color: #94a3b8;
                        font-weight: 600;
                    }
                    .card-location-row i {
                        color: #ccff00;
                    }

                    .card-players-section {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        margin-top: 4px;
                    }
                    .overlapping-avatars-row {
                        display: flex;
                        flex-direction: row-reverse;
                        justify-content: flex-end;
                    }
                    .premium-overlap-circle {
                        width: 32px;
                        height: 32px;
                        border-radius: 50%;
                        border: 2px solid #0d0f14;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 0.72rem;
                        font-weight: 900;
                        margin-right: -8px;
                        background: linear-gradient(135deg, #1e2230 0%, #0d0f14 100%);
                        color: #ffffff;
                        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                        transition: all 0.2s;
                    }
                    .premium-overlap-circle.plus-slot {
                        border: 2px dashed rgba(204, 255, 0, 0.4);
                        background: rgba(204, 255, 0, 0.03);
                        color: #ccff00;
                    }
                    .premium-overlap-circle:hover {
                        transform: translateY(-3px) scale(1.1);
                        z-index: 100 !important;
                    }

                    .spots-status-pill {
                        background: rgba(255, 255, 255, 0.05);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        color: #ffffff;
                        font-size: 0.68rem;
                        font-weight: 900;
                        padding: 4px 10px;
                        border-radius: 20px;
                        letter-spacing: 0.5px;
                        text-transform: uppercase;
                    }
                    .spots-status-pill.last-spot {
                        background: rgba(239, 68, 68, 0.15);
                        border-color: rgba(239, 68, 68, 0.4);
                        color: #ef4444;
                        animation: neonPulse 1.5s infinite alternate;
                    }
                    @keyframes neonPulse {
                        0% { box-shadow: 0 0 5px rgba(239, 68, 68, 0.2); }
                        100% { box-shadow: 0 0 15px rgba(239, 68, 68, 0.5); }
                    }

                    .card-footer-action-row {
                        border-top: 1px solid rgba(255, 255, 255, 0.08);
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
                        color: #94a3b8;
                        font-weight: 700;
                    }
                    .footer-left-info i {
                        color: #ccff00;
                    }
                    .footer-right-cta {
                        color: #ccff00;
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

                    /* 5. PLAYTOMIC DETAIL DRAWER (Sliding Panel in Dark mode) */
                    .playtomic-drawer-modal {
                        position: fixed;
                        top: 0;
                        left: 50%;
                        transform: translateX(-50%);
                        width: 100%;
                        max-width: 600px;
                        height: 100%;
                        background: rgba(0, 0, 0, 0.6);
                        z-index: 9000;
                        display: flex;
                        flex-direction: column;
                        justify-content: flex-end;
                        transition: opacity 0.3s ease;
                    }
                    .drawer-content-container {
                        background: #0d0f14;
                        border-top: 2px solid rgba(255, 255, 255, 0.08);
                        border-radius: 28px 28px 0 0;
                        max-height: 92%;
                        width: 100%;
                        overflow-y: auto;
                        display: flex;
                        flex-direction: column;
                        position: relative;
                        animation: slideUp 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards;
                        box-shadow: 0 -10px 40px rgba(0,0,0,0.5);
                    }
                    @keyframes slideUp {
                        from { transform: translateY(100%); }
                        to { transform: translateY(0); }
                    }

                    /* Image Banner Header */
                    .drawer-club-banner {
                        height: 150px;
                        background: linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 100%), 
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
                        background: #1e2230;
                        border: 1px solid rgba(255,255,255,0.1);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                        transition: all 0.2s;
                    }
                    .drawer-circle-btn:hover {
                        border-color: #ccff00;
                    }
                    .drawer-circle-btn i {
                        font-size: 0.95rem;
                        color: #ffffff;
                    }

                    /* Header Info Details */
                    .drawer-info-body {
                        padding: 24px;
                        display: flex;
                        flex-direction: column;
                        gap: 16px;
                        padding-bottom: 120px;
                        text-align: left;
                    }
                    .drawer-match-date {
                        font-size: 0.78rem;
                        color: #ccff00;
                        font-weight: 850;
                        letter-spacing: 0.5px;
                        text-transform: uppercase;
                    }
                    .drawer-match-title {
                        font-size: 1.35rem;
                        font-weight: 950;
                        color: #ffffff;
                        line-height: 1.25;
                        letter-spacing: 0.5px;
                        text-align: left;
                    }
                    .drawer-match-subtitle {
                        font-size: 0.85rem;
                        color: #94a3b8;
                        font-weight: 800;
                        margin-top: -6px;
                    }

                    /* Three Action Buttons Panel */
                    .drawer-actions-panel {
                        display: grid;
                        grid-template-columns: 1fr 1fr 1fr;
                        gap: 12px;
                        border-top: 1px solid rgba(255,255,255,0.06);
                        border-bottom: 1px solid rgba(255,255,255,0.06);
                        padding: 16px 0;
                        margin: 4px 0;
                    }
                    .action-panel-item {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 6px;
                        cursor: pointer;
                    }
                    .action-panel-circle {
                        width: 48px;
                        height: 48px;
                        border-radius: 50%;
                        border: 1.5px solid rgba(255,255,255,0.08);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: #121620;
                        box-shadow: 0 4px 10px rgba(0,0,0,0.2);
                        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    }
                    .action-panel-circle i {
                        font-size: 1.15rem;
                        color: #ffffff;
                    }
                    .action-panel-item:hover .action-panel-circle {
                        border-color: #ccff00;
                        background-color: rgba(204, 255, 0, 0.1);
                        transform: translateY(-2px);
                    }
                    .action-panel-label {
                        font-size: 0.65rem;
                        font-weight: 850;
                        color: #94a3b8;
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
                        color: #ffffff;
                    }
                    .section-players-link {
                        font-size: 0.78rem;
                        font-weight: 800;
                        color: #ccff00;
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
                        width: 48px;
                        height: 48px;
                        border-radius: 50%;
                        background: linear-gradient(135deg, #1d2230 0%, #0d0f14 100%);
                        color: #FFFFFF;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 0.95rem;
                        font-weight: 950;
                        border: 2px solid rgba(255,255,255,0.08);
                        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                        position: relative;
                    }
                    .player-avatar-circle.empty-slot {
                        background: rgba(204,255,0,0.03);
                        border: 2px dashed #ccff00;
                        color: #ccff00;
                        font-size: 1.1rem;
                    }
                    .player-rating-badge {
                        background: #ccff00;
                        color: #000000;
                        font-size: 0.65rem;
                        font-weight: 955;
                        padding: 2px 7px;
                        border-radius: 12px;
                        box-shadow: 0 2px 5px rgba(204,255,0,0.3);
                        margin-top: -14px;
                        z-index: 10;
                        white-space: nowrap;
                    }
                    .player-roster-name {
                        font-size: 0.72rem;
                        font-weight: 850;
                        color: #ffffff;
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
                        gap: 6px;
                        margin-top: 4px;
                    }
                    .progress-track {
                        height: 6px;
                        background: rgba(255, 255, 255, 0.06);
                        border-radius: 4px;
                        overflow: hidden;
                    }
                    .progress-fill-blue {
                        height: 100%;
                        background: linear-gradient(90deg, #ccff00 0%, #9bc200 100%);
                        border-radius: 4px;
                        transition: width 0.3s;
                        box-shadow: 0 0 8px rgba(204,255,0,0.3);
                    }
                    .progress-labels-row {
                        display: flex;
                        justify-content: space-between;
                        font-size: 0.72rem;
                        color: #94a3b8;
                        font-weight: 750;
                    }

                    /* Description block */
                    .drawer-description-block {
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                        border-top: 1px solid rgba(255,255,255,0.06);
                        padding-top: 18px;
                    }
                    .description-block-title {
                        font-size: 0.95rem;
                        font-weight: 950;
                        color: #ffffff;
                    }
                    .description-item-row {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        padding: 4px 0;
                    }
                    .description-item-icon-box {
                        width: 32px;
                        height: 32px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: #10131c;
                        border: 1px solid rgba(255,255,255,0.06);
                        border-radius: 8px;
                        color: #ccff00;
                    }
                    .description-item-text {
                        font-size: 0.8rem;
                        font-weight: 800;
                        color: #ffffff;
                    }

                    /* Sticky Bottom CTA Button */
                    .drawer-bottom-cta-sticky {
                        position: absolute;
                        bottom: 0;
                        left: 0;
                        width: 100%;
                        background: linear-gradient(180deg, rgba(13,15,20,0) 0%, rgba(13,15,20,0.95) 30%, #0d0f14 100%);
                        padding: 16px 24px 28px 24px;
                        box-sizing: border-box;
                    }
                    .playtomic-btn-blue-giant {
                        width: 100%;
                        background: linear-gradient(135deg, #ccff00 0%, #9bc200 100%);
                        color: #000000 !important;
                        border: none;
                        padding: 16px;
                        border-radius: 28px;
                        font-size: 0.95rem;
                        font-weight: 950;
                        cursor: pointer;
                        box-shadow: 0 8px 24px rgba(204, 255, 0, 0.25);
                        transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                    }
                    .playtomic-btn-blue-giant:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 12px 28px rgba(204, 255, 0, 0.4);
                    }
                    .playtomic-btn-blue-giant:active {
                        transform: translateY(0);
                    }
                    .playtomic-btn-blue-giant i {
                        color: #000000 !important;
                    }

                    /* 6. Admin Drawer Stylings */
                    .playtomic-admin-drawer {
                        position: fixed;
                        bottom: 0;
                        left: 50%;
                        transform: translateX(-50%);
                        width: 100%;
                        max-width: 600px;
                        background: #10131c;
                        border-top: 1px solid rgba(255,255,255,0.08);
                        z-index: 9999;
                        box-shadow: 0 -4px 20px rgba(0,0,0,0.3);
                    }
                    .drawer-header {
                        padding: 10px 16px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        cursor: pointer;
                        background: #0d0f14;
                        font-size: 0.7rem;
                        color: #ccff00;
                        font-weight: 950;
                        letter-spacing: 0.5px;
                        border-bottom: 1px solid rgba(255,255,255,0.06);
                    }
                    .drawer-body {
                        padding: 12px 16px;
                    }
                    .playtomic-btn-sec {
                        background: #10131c;
                        border: 1px solid rgba(255,255,255,0.08);
                        color: #ffffff;
                        cursor: pointer;
                        transition: all 0.2s;
                    }
                    .playtomic-btn-sec:hover {
                        border-color: #ccff00;
                        background: rgba(204, 255, 0, 0.1) !important;
                    }
                    .playtomic-btn-blue {
                        background: #ccff00;
                        color: #000000 !important;
                        border: none;
                        cursor: pointer;
                        font-weight: 900;
                        transition: all 0.2s;
                    }
                    .playtomic-btn-blue:hover {
                        background: #9bc200;
                    }

                    /* Skeleton Loader Light */
                    .playtomic-skeleton-light {
                        background: #10131c;
                        border-radius: 24px;
                        padding: 3rem 1.5rem;
                        text-align: center;
                        border: 1.5px solid rgba(255, 255, 255, 0.08);
                    }
                    .playtomic-skeleton-light p {
                        color: #ffffff;
                        font-size: 0.85rem;
                        margin: 12px 0 0 0;
                        font-weight: 850;
                    }
                    .playtomic-spinner-light {
                        width: 32px;
                        height: 32px;
                        border: 3px solid rgba(204, 255, 0, 0.1);
                        border-radius: 50%;
                        border-top-color: #ccff00;
                        display: inline-block;
                        animation: playtomic-spin-light 0.8s linear infinite;
                    }
                    @keyframes playtomic-spin-light {
                        to { transform: rotate(360deg); }
                    }

                    /* Autocomplete Suggestions */
                    .autocomplete-suggestions {
                        background: #10131c !important;
                        border: 1.5px solid #000000 !important;
                        border-radius: 16px !important;
                        box-shadow: 0 12px 30px rgba(0,0,0,0.4) !important;
                        z-index: 10000 !important;
                        overflow: hidden !important;
                    }
                    .autocomplete-item {
                        padding: 12px 16px !important;
                        cursor: pointer !important;
                        border-bottom: 1px solid rgba(255,255,255,0.06) !important;
                        border-left: 4px solid transparent !important;
                        display: flex !important;
                        flex-direction: column !important;
                        gap: 3px !important;
                        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
                        text-align: left !important;
                    }
                    .autocomplete-item:hover {
                        background-color: rgba(204, 255, 0, 0.15) !important;
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

        renderMatches(matches) {
            // Store all matches locally for instant client-side filtering
            this.allMatches = matches;

            this.renderFilteredList();
        }

        renderFilteredList() {
            const listContainer = document.getElementById('open-matches-list');
            if (!listContainer) return;

            const currentUser = window.Store ? window.Store.getState('currentUser') : null;
            const myName = currentUser ? (currentUser.name || currentUser.displayName || "") : "";

            // 1. Apply tab filters
            let filtered = [];
            if (this.activeTab === 'disponible') {
                // Show all active future matches
                filtered = this.allMatches;
            } else {
                // Show ONLY matches where current user name is in players list!
                filtered = this.allMatches.filter(match => {
                    const playersArray = Array.isArray(match.players) ? match.players : [];
                    return playersArray.some(p => p.toLowerCase().includes(myName.toLowerCase()) && myName !== "");
                });
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

            if (filtered.length === 0) {
                listContainer.innerHTML = `
                    <div class="playtomic-skeleton-light" style="padding: 4rem 2rem;">
                        <i class="fas fa-table-tennis-paddle-ball" style="font-size: 2.8rem; color: #ccff00; margin-bottom: 12px; display: inline-block; opacity: 0.7;"></i>
                        <p style="color: #ffffff; font-size: 0.9rem; font-weight: 850;">No hay partidas en esta pestaña</p>
                        <p style="color: #64748B; font-size: 0.75rem; margin-top: 8px; font-weight: 500; max-width: 280px; margin-left: auto; margin-right: auto; line-height: 1.5;">
                            ${this.activeTab === 'disponible' 
                              ? 'Cuando se compartan partidas en el grupo de WhatsApp, se sincronizarán aquí al instante.' 
                              : 'No estás apuntado en ninguna partida activa todavía. ¡Únete a alguna desde la pestaña Disponible!'}
                        </p>
                        ${this.activeTab === 'disponible' ? `
                        <button onclick="window.OpenMatchesView.openCreateModal()" style="margin-top: 20px; background: rgba(204,255,0,0.1); border: 1.5px solid #ccff00; color: #ccff00; padding: 10px 24px; border-radius: 20px; font-weight: 900; font-size: 0.78rem; cursor: pointer; letter-spacing: 0.5px;">
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

            listContainer.innerHTML = sortedDates.map(dateKey => {
                // Format human date header (e.g. "lunes, 13 de abril" or "martes, 02 de junio")
                const dateObj = new Date(`${dateKey}T00:00:00`);
                const options = { weekday: 'long', day: '2-digit', month: 'long' };
                const humanDateHeader = dateObj.toLocaleDateString('es-ES', options);

                const matchesHtml = grouped[dateKey].map(match => {
                    const spots = parseInt(match.spots_needed) || 1;
                    const playersArray = Array.isArray(match.players) ? match.players : [];
                    const maxPlayers = 4;
                    const filledCount = playersArray.length;

                    // Formulate overlapping circles grid
                    let circlesHtml = '';
                    
                    // Render registered player initials overlapping
                    for (let idx = 0; idx < maxPlayers; idx++) {
                        if (idx < maxPlayers) {
                            if (idx < filledCount) {
                                const initials = this.getInitials(playersArray[idx]);
                                circlesHtml += `<div class="premium-overlap-circle" style="z-index: ${maxPlayers - idx};">${initials}</div>`;
                            } else {
                                circlesHtml += `<div class="premium-overlap-circle plus-slot" style="z-index: ${maxPlayers - idx};">+</div>`;
                            }
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
                                    <div class="neon-court">
                                        <div class="court-net"></div>
                                        <div class="court-inner-lines"></div>
                                        <div class="court-glow-ball"></div>
                                    </div>
                                </div>
                                
                                <div class="card-details-wrapper">
                                    <h3 class="card-club-name">${(match.club || 'Somos Pádel BCN').toUpperCase()}</h3>
                                    
                                    <div class="card-location-row">
                                        <i class="fas fa-location-dot"></i>
                                        <span>${match.comarca || 'Barcelona'} • 8km</span>
                                    </div>
                                    
                                    <div class="card-players-section">
                                        <div class="overlapping-avatars-row">
                                            ${circlesHtml}
                                        </div>
                                        <span class="${spotsClass}">${spotsText}</span>
                                    </div>
                                </div>
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
        }

        getInitials(name) {
            if (!name) return "P";
            const parts = name.trim().split(/\s+/);
            if (parts.length === 1) {
                return parts[0].substring(0, 2).toUpperCase();
            }
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }

        openDetailDrawer(matchId) {
            const match = this.allMatches.find(m => m.id === matchId);
            if (!match) return;

            this.selectedMatch = match;

            const drawer = document.getElementById('playtomic-detail-drawer');
            if (!drawer) return;

            // Formulate players list with rating badges underneath (Playtomic Image 3 Style!)
            const playersArray = Array.isArray(match.players) ? match.players : [];
            const maxPlayers = 4;
            const progressPercent = (playersArray.length / maxPlayers) * 100;

            let rosterHtml = '';
            for (let idx = 0; idx < maxPlayers; idx++) {
                if (idx < maxPlayers) {
                    if (idx < playersArray.length) {
                        const fullName = playersArray[idx];
                        const initials = this.getInitials(fullName);
                        const firstName = fullName.split(' ')[0];
                        const levelVal = (parseFloat(match.level_min) + (idx * 0.2)).toFixed(2);

                        rosterHtml += `
                            <div class="player-roster-avatar-box">
                                <div class="player-avatar-circle">${initials}</div>
                                <div class="player-rating-badge">${levelVal}</div>
                                <span class="player-roster-name">${firstName}</span>
                            </div>
                        `;
                    } else {
                        rosterHtml += `
                            <div class="player-roster-avatar-box" onclick="window.OpenMatchesView.handleDetailJoin('${match.playtomic_url}')">
                                <div class="player-avatar-circle empty-slot">+</div>
                                <div class="player-rating-badge" style="background:#E2E8F0; color:#64748B;">--</div>
                                <span class="player-roster-name" style="color:#64748B;">Libre</span>
                            </div>
                        `;
                    }
                }
            }

            const dateObj = new Date(`${match.date}T00:00:00`);
            const options = { weekday: 'long', day: '2-digit', month: 'long' };
            const humanDate = dateObj.toLocaleDateString('es-ES', options);

            const cleanUrl = match.playtomic_url.replace(/'/g, "\\'");

            drawer.innerHTML = `
                <div class="drawer-content-container">
                    
                    <!-- Top Image Club Banner -->
                    <div class="drawer-club-banner">
                        <div class="drawer-nav-actions">
                            <div class="drawer-circle-btn" onclick="window.OpenMatchesView.closeDetailDrawer()">
                                <i class="fas fa-arrow-left"></i>
                            </div>
                            <div style="display: flex; gap: 8px;">
                                <div class="drawer-circle-btn" onclick="window.OpenMatchesView.shareMatch('${match.id}')">
                                    <i class="fas fa-share-alt"></i>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Details Body -->
                    <div class="drawer-info-body">
                        <span class="drawer-match-date">${humanDate} | ${match.time || '19:00'} (${match.duration || 90} min)</span>
                        <div class="drawer-match-title">${match.club ? match.club.toUpperCase() : 'PARTIDO DE PÁDEL'}</div>
                        <span class="drawer-match-subtitle">${match.club || 'Somos Pádel BCN'} • ${match.comarca || 'Barcelona'}</span>

                        <!-- Three Action Buttons Panel (Image 3 Style) -->
                        <div class="drawer-actions-panel">
                            <div class="action-panel-item" onclick="window.OpenMatchesView.handleDetailJoin('${cleanUrl}')">
                                <div class="action-panel-circle">
                                    <i class="fas fa-plus"></i>
                                </div>
                                <span class="action-panel-label">Apuntarme</span>
                            </div>
                            <div class="action-panel-item" onclick="window.OpenMatchesView.shareMatch('${match.id}')">
                                <div class="action-panel-circle">
                                    <i class="fas fa-share-alt"></i>
                                </div>
                                <span class="action-panel-label">Compartir</span>
                            </div>
                            <div class="action-panel-item" onclick="window.OpenMatchesView.openWhatsAppChat()">
                                <div class="action-panel-circle">
                                    <i class="fab fa-whatsapp" style="color: #25d366;"></i>
                                </div>
                                <span class="action-panel-label">Chat WA</span>
                            </div>
                        </div>

                        <!-- Players Section (Overlapping details) -->
                        <div class="drawer-section-players">
                            <div class="section-players-header">
                                <span class="section-players-title">Jugadores (${playersArray.length}/${maxPlayers})</span>
                                <span class="section-players-link" onclick="window.OpenMatchesView.handleDetailJoin('${cleanUrl}')">Ver todos</span>
                            </div>

                            <!-- Player Roster Cards Grid -->
                            <div class="players-cards-roster">
                                ${rosterHtml}
                            </div>

                            <!-- Progress Track Line -->
                            <div class="plazas-progress-container">
                                <div class="progress-track">
                                    <div class="progress-fill-blue" style="width: ${progressPercent}%;"></div>
                                </div>
                                <div class="progress-labels-row">
                                    <span>Requiere un mínimo de 2 jugadores</span>
                                    <span>${playersArray.length}/${maxPlayers}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Description Block (Image 4 Style) -->
                        <div class="drawer-description-block">
                            <span class="description-block-title">Descripción</span>
                            
                            <div class="description-item-row">
                                <div class="description-item-icon-box"><i class="fas fa-baseball-ball"></i></div>
                                <span class="description-item-text">Pádel, inscripción individual o doble</span>
                            </div>
                            <div class="description-item-row">
                                <div class="description-item-icon-box"><i class="fas fa-chart-line"></i></div>
                                <span class="description-item-text">Nivel compatible: ${parseFloat(match.level_min || 3.0).toFixed(2)} - ${parseFloat(match.level_max || 3.5).toFixed(2)}</span>
                            </div>
                            <div class="description-item-row">
                                <div class="description-item-icon-box"><i class="fas fa-venus-mars"></i></div>
                                <span class="description-item-text">Género: Abierto</span>
                            </div>
                            <div class="description-item-row">
                                <div class="description-item-icon-box"><i class="fas fa-clock"></i></div>
                                <span class="description-item-text">Sincronizado vía WhatsApp Partidas Abiertas</span>
                            </div>
                        </div>
                    </div>

                    <!-- Fixed Giant Blue Button (Apuntarme) -->
                    <div class="drawer-bottom-cta-sticky">
                        <button class="playtomic-btn-blue-giant" onclick="window.OpenMatchesView.handleDetailJoin('${cleanUrl}')">
                            Apuntarme - Gratis <i class="fas fa-chevron-right" style="font-size:0.75rem;"></i>
                        </button>
                    </div>

                </div>
            `;

            drawer.classList.remove('hidden');

            if (window.navigator.vibrate) {
                window.navigator.vibrate(15);
            }
        }

        closeDetailDrawer() {
            const drawer = document.getElementById('playtomic-detail-drawer');
            if (drawer) drawer.classList.add('hidden');
            this.selectedMatch = null;
        }

        /**
         * Dynamic Creation Modal Setup (Playtomic Light Theme)
         */
        async openCreateModal() {
            const modal = document.getElementById('playtomic-create-modal');
            if (!modal) return;

            // Generate levels option items
            const lvlMinOpts = this.generateLevelOptionTags(3.0);
            const lvlMaxOpts = this.generateLevelOptionTags(4.0);

            // Set default date picker to today's date in local time zone
            const todayIso = new Date().toISOString().split('T')[0];

            // 📍 Fetch dynamic clubs/sedes from Firestore with static fallback
            let clubs = [];
            try {
                if (window.db) {
                    const snapshot = await window.db.collection('padel_clubs').get();
                    snapshot.forEach(doc => {
                        clubs.push(doc.data());
                    });
                    clubs.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                }
            } catch (err) {
                console.warn("⚠️ Error loading clubs dynamically in player view, using static fallback:", err);
            }

            if (clubs.length === 0) {
                clubs = [
                    { name: "Can Vía Racket Club", comarca: "Baix Llobregat", courts_count: 8, address: "Masia Can Via, s/n, 08690 Santa Coloma de Cervelló, Barcelona" },
                    { name: "Padel Indoor Hospitalet", comarca: "Baix Llobregat", courts_count: 8, address: "Carrer de la Botánica, 110, 08908 L'Hospitalet de Llobregat, Barcelona" },
                    { name: "Nick Club Pádel Barcelona", comarca: "Barcelona", courts_count: 9, address: "Carrer de la Font d'en Fargas, 2, 08032 Barcelona" },
                    { name: "Club Delfos Cornellá", comarca: "Baix Llobregat", courts_count: 10, address: "Carrer del Verge de Montserrat, 2, 08940 Cornellà de Llobregat, Barcelona" },
                    { name: "Barcelona Pádel el Prat", comarca: "Baix Llobregat", courts_count: 14, address: "Parque de la Riera, Carrer de les Moreres, s/n, 08820 El Prat de Llobregat, Barcelona" },
                    { name: "Real Club de Polo de Barcelona", comarca: "Barcelona", courts_count: 16, address: "Avinguda de Doctor Marañón, 19, 08028 Barcelona" },
                    { name: "Artós Sports Club", comarca: "Barcelona", courts_count: 6, address: "Carrer de les Tres Creus, 8, 08017 Barcelona" },
                    { name: "Padelarium Gavà", comarca: "Baix Llobregat", courts_count: 12, address: "Carrer de la Máquina, 11, 08850 Gavà, Barcelona" },
                    { name: "Aurial Padel Sant Boi", comarca: "Baix Llobregat", courts_count: 14, address: "Carrer del Baldiri Aleu, 3, 08830 Sant Boi de Llobregat, Barcelona" },
                    { name: "Indoor Padel Barcelona", comarca: "Barcelona", courts_count: 8, address: "Carrer de Veneçuela, 78, 08019 Barcelona" }
                ];
            }

            modal.innerHTML = `
                <div class="drawer-content-container" style="max-height: 95%;">
                    <div class="playtomic-top-header" style="border-bottom: 1.5px solid rgba(255,255,255,0.08); border-radius: 28px 28px 0 0;">
                        <i class="fas fa-arrow-left header-back-btn" onclick="window.OpenMatchesView.closeCreateModal()"></i>
                        <span class="header-title">Crear Partido Comunitario</span>
                        <div style="width: 24px;"></div>
                    </div>

                    <div class="drawer-info-body" style="padding: 20px; text-align: left;">
                        <p style="font-size: 0.75rem; color: #94a3b8; font-weight: 700; margin-bottom: 16px; line-height: 1.4; text-align: left;">
                            Configura los detalles de tu partido para compartirlo inmediatamente con la comunidad del club en la pestaña Disponible.
                        </p>

                        <form id="playtomic-create-match-form" onsubmit="window.OpenMatchesView.handleCreateSubmit(event)" style="display:flex; flex-direction:column; gap:14px; text-align: left;">
                            
                            <!-- Nombre / Título del partido -->
                            <div style="display:flex; flex-direction:column; gap:4px;">
                                <label style="font-size:0.68rem; font-weight:850; color:#64748B; text-transform:uppercase;">Nombre del Partido</label>
                                <input type="text" id="create-match-name" class="playtomic-input" style="width:100%; height:46px; padding:12px; font-weight:800; font-size:0.9rem; border-radius:10px; box-sizing: border-box;" placeholder="Ej: Mañanero de Nivel Medio" required>
                            </div>

                            <!-- Club Selector with Search Engine (Autocomplete) -->
                            <div style="display:flex; flex-direction:column; gap:4px; position: relative;">
                                <label style="font-size:0.68rem; font-weight:850; color:#64748B; text-transform:uppercase;">Ubicación / Club (Buscador)</label>
                                <div style="position: relative; display: flex; align-items: center; width: 100%;">
                                    <i class="fas fa-search" style="position: absolute; left: 16px; color: #ccff00; font-size: 0.85rem; z-index: 10;"></i>
                                    <input type="text" id="player-club-search-autocomplete" class="playtomic-input" style="width:100%; height:46px; padding-left:46px !important; font-weight:800; font-size:0.9rem; border-radius:10px; box-sizing: border-box;" placeholder="Escribe para buscar club..." autocomplete="off" required>
                                    <input type="hidden" id="create-match-club-select">
                                </div>
                                
                                <!-- Suggestions Container -->
                                <div id="player-club-suggestions" class="autocomplete-suggestions" style="display: none; position: absolute; top: 100%; left: 0; right: 0; background: #ffffff; border: 1.5px solid #000000; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); z-index: 9500; max-height: 180px; overflow-y: auto; margin-top: 4px;"></div>
                                
                                <!-- Selected Club Info Badge -->
                                <div id="player-selected-club-badge" style="display: none; margin-top: 15px; padding: 16px; background: #000000; border: 2px solid #ccff00; outline: 1px solid rgba(204, 255, 0, 0.4); outline-offset: -4px; border-radius: 16px; color: #ffffff; flex-direction: column; gap: 8px; position: relative; box-shadow: 0 8px 20px rgba(0,0,0,0.15); transition: all 0.3s ease;"></div>
                            </div>

                            <!-- Date and Time Picker -->
                            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                                <div style="display:flex; flex-direction:column; gap:4px;">
                                    <label style="font-size:0.68rem; font-weight:850; color:#64748B; text-transform:uppercase;">Fecha</label>
                                    <input type="date" id="create-match-date" class="playtomic-input" style="width:100%; height:46px; padding:12px; border-radius:10px; font-weight: 700; box-sizing: border-box;" value="${todayIso}" required>
                                </div>
                                <div style="display:flex; flex-direction:column; gap:4px;">
                                    <label style="font-size:0.68rem; font-weight:850; color:#64748B; text-transform:uppercase;">Hora de Inicio</label>
                                    <input type="time" id="create-match-time" class="playtomic-input" style="width:100%; height:46px; padding:12px; border-radius:10px; font-weight: 700; box-sizing: border-box;" value="18:30" required>
                                </div>
                            </div>

                            <!-- Duration & Spots Open -->
                            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                                <div style="display:flex; flex-direction:column; gap:4px;">
                                    <label style="font-size:0.68rem; font-weight:850; color:#64748B; text-transform:uppercase;">Duración</label>
                                    <select id="create-match-duration" class="playtomic-input" style="width:100%; height:46px; padding:0 12px; border-radius:10px; font-weight: 700; box-sizing: border-box;">
                                        <option value="60">60 min</option>
                                        <option value="90" selected>90 min</option>
                                        <option value="120">120 min</option>
                                    </select>
                                </div>
                                <div style="display:flex; flex-direction:column; gap:4px;">
                                    <label style="font-size:0.68rem; font-weight:850; color:#64748B; text-transform:uppercase;">Plazas Libres</label>
                                    <select id="create-match-spots" class="playtomic-input" style="width:100%; height:46px; padding:0 12px; border-radius:10px; font-weight: 700; box-sizing: border-box;">
                                        <option value="3" selected>3 plazas libres (Juegas tú)</option>
                                        <option value="2">2 plazas libres (Juegas tú + amigo)</option>
                                        <option value="1">1 plaza libre (Falta 1 jugador)</option>
                                        <option value="4">4 plazas libres (Creas el partido)</option>
                                    </select>
                                </div>
                            </div>

                            <!-- Recommended Level Range -->
                            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                                <div style="display:flex; flex-direction:column; gap:4px;">
                                    <label style="font-size:0.68rem; font-weight:850; color:#64748B; text-transform:uppercase;">Nivel Mínimo</label>
                                    <select id="create-match-lvl-min" class="playtomic-input" style="width:100%; height:46px; padding:0 12px; border-radius:10px; font-weight: 700; box-sizing: border-box;">
                                        ${lvlMinOpts}
                                    </select>
                                </div>
                                <div style="display:flex; flex-direction:column; gap:4px;">
                                    <label style="font-size:0.68rem; font-weight:850; color:#64748B; text-transform:uppercase;">Nivel Máximo</label>
                                    <select id="create-match-lvl-max" class="playtomic-input" style="width:100%; height:46px; padding:0 12px; border-radius:10px; font-weight: 700; box-sizing: border-box;">
                                        ${lvlMaxOpts}
                                    </select>
                                </div>
                            </div>

                            <!-- Playtomic Link (Opcional) -->
                            <div style="display:flex; flex-direction:column; gap:4px;">
                                <label style="font-size:0.68rem; font-weight:850; color:#64748B; text-transform:uppercase;">Enlace de Playtomic (Opcional)</label>
                                <input type="text" id="create-match-url" class="playtomic-input" style="width:100%; height:46px; padding:12px; font-size:0.8rem; border-radius:10px; box-sizing: border-box;" placeholder="https://app.playtomic.io/matches/...">
                            </div>

                            <!-- Auto Join Toggle -->
                            <div style="display:flex; align-items:center; gap:8px; margin-top: 4px; margin-bottom: 8px;">
                                <input type="checkbox" id="create-match-autojoin" style="width:18px; height:18px; accent-color:#2E61FF; cursor:pointer;" checked>
                                <label for="create-match-autojoin" style="font-size:0.75rem; font-weight:800; color:#0F172A; cursor:pointer;">Unirme automáticamente como Jugador 1</label>
                            </div>

                            <!-- Actions -->
                            <div style="display:flex; gap:12px; margin-top:10px;">
                                <button type="button" class="playtomic-btn-sec" onclick="window.OpenMatchesView.closeCreateModal()" style="flex:1; padding:14px; border-radius:24px; border:1px solid #E2E8F0; font-weight:800; font-size:0.85rem; cursor:pointer; background: #FFFFFF; color: #0F172A;">
                                    Cancelar
                                </button>
                                <button type="submit" class="playtomic-btn-blue-giant" style="flex:2; padding:14px; border-radius:24px; font-size:0.9rem; position:relative; box-shadow:0 6px 18px rgba(46,97,255,0.25); background: #2E61FF; color:#FFFFFF;">
                                    Publicar Partido 🚀
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            `;

            // 🌟 Setup Player-Side Autocomplete Logic
            setTimeout(() => {
                const autInput = document.getElementById('player-club-search-autocomplete');
                const hidInput = document.getElementById('create-match-club-select');
                const sugBox = document.getElementById('player-club-suggestions');
                const bdgBox = document.getElementById('player-selected-club-badge');

                if (autInput && sugBox) {
                    const showSuggestions = (q) => {
                        const query = q.toLowerCase().trim();
                        const filtered = clubs.filter(c => 
                            (c.name || '').toLowerCase().includes(query) || 
                            (c.address || '').toLowerCase().includes(query)
                        );

                        if (filtered.length === 0) {
                            sugBox.innerHTML = `
                                <div class="autocomplete-item select-custom-value" style="color: #ccff00; font-weight: 800; font-size: 0.8rem; text-align: left;">
                                    ✍ ...Usar manual: "${q}"
                                </div>
                            `;
                        } else {
                            let itemsHtml = filtered.map(c => `
                                <div class="autocomplete-item select-club-item" data-name="${c.name}" data-comarca="${c.comarca || 'Barcelona'}" data-pistas="${c.courts_count || 0}" data-address="${c.address || ''}" style="text-align: left;">
                                    <span style="font-weight: 850; font-size: 0.82rem; color: #ffffff; text-align: left;">${c.name.toUpperCase()}</span>
                                    <span style="font-size: 0.65rem; color: #94a3b8; font-weight: 600; display: flex; align-items: center; gap: 4px; text-align: left;">
                                        <i class="fas fa-location-dot"></i> ${c.comarca || 'Barcelona'} • ${c.courts_count || 0} pistas
                                    </span>
                                </div>
                            `).join('');
                            
                            if (query) {
                                itemsHtml += `
                                    <div class="autocomplete-item select-custom-value" style="border-top: 1px solid rgba(255,255,255,0.06); color: #ccff00; font-weight: 800; font-size: 0.8rem; text-align: left;">
                                        ✍ ...Usar manual: "${q}"
                                    </div>
                                `;
                            }
                            sugBox.innerHTML = itemsHtml;
                        }
                        sugBox.style.display = 'block';
                    };

                    autInput.addEventListener('focus', () => {
                        showSuggestions(autInput.value);
                    });

                    autInput.addEventListener('input', () => {
                        showSuggestions(autInput.value);
                    });

                    sugBox.addEventListener('click', (e) => {
                        const item = e.target.closest('.autocomplete-item');
                        if (!item) return;

                        if (item.classList.contains('select-club-item')) {
                            const name = item.getAttribute('data-name');
                            const comarca = item.getAttribute('data-comarca');
                            const pistas = item.getAttribute('data-pistas');
                            const address = item.getAttribute('data-address') || '';

                            autInput.value = name;
                            hidInput.value = name;
                            
                            bdgBox.innerHTML = window.renderSelectedClubCardHtml(name, comarca, address, pistas);
                            bdgBox.style.display = 'flex';
                        } else if (item.classList.contains('select-custom-value')) {
                            const customVal = autInput.value.trim();
                            hidInput.value = customVal;
                            bdgBox.innerHTML = window.renderSelectedClubCardHtml(customVal, '', '', 0);
                            bdgBox.style.display = 'flex';
                        }

                        sugBox.style.display = 'none';
                    });

                    document.addEventListener('click', (e) => {
                        if (!autInput.contains(e.target) && !sugBox.contains(e.target)) {
                            sugBox.style.display = 'none';
                        }
                    });
                }
            }, 50);

            modal.classList.remove('hidden');

            if (window.navigator.vibrate) {
                window.navigator.vibrate(15);
            }
        }

        closeCreateModal() {
            const modal = document.getElementById('playtomic-create-modal');
            if (modal) modal.classList.add('hidden');
            this.selectedMatch = null;
        }

        handleCreateClubChange(value) {
            const customInput = document.getElementById('create-match-club-custom');
            if (!customInput) return;

            if (value === 'custom') {
                customInput.classList.remove('hidden');
                customInput.required = true;
                customInput.focus();
            } else {
                customInput.classList.add('hidden');
                customInput.required = false;
                customInput.value = '';
            }
        }

        generateLevelOptionTags(selectedVal) {
            let html = '';
            for (let i = 1.0; i <= 6.0; i += 0.25) {
                const val = i.toFixed(2);
                const isSelected = parseFloat(val) === parseFloat(selectedVal);
                html += `<option value="${val}" ${isSelected ? 'selected' : ''}>${val}</option>`;
            }
            return html;
        }

        async handleCreateSubmit(event) {
            event.preventDefault();
            
            const btn = event.target.querySelector('button[type="submit"]');
            if (btn) btn.disabled = true;

            try {
                const nameVal = document.getElementById('create-match-name').value;
                const clubSelect = document.getElementById('create-match-club-select')?.value || '';
                const autocompleteVal = document.getElementById('player-club-search-autocomplete')?.value || '';
                const dateVal = document.getElementById('create-match-date').value;
                const timeVal = document.getElementById('create-match-time').value;
                const durationVal = parseInt(document.getElementById('create-match-duration').value) || 90;
                const spotsVal = parseInt(document.getElementById('create-match-spots').value) || 3;
                const lvlMin = parseFloat(document.getElementById('create-match-lvl-min').value) || 3.0;
                const lvlMax = parseFloat(document.getElementById('create-match-lvl-max').value) || 4.0;
                const urlVal = document.getElementById('create-match-url').value;
                const autojoinVal = document.getElementById('create-match-autojoin').checked;

                if (lvlMin > lvlMax) {
                    throw new Error("El nivel mínimo no puede ser superior al nivel máximo.");
                }

                const finalClub = clubSelect.trim() || autocompleteVal.trim() || 'Somos Pádel BCN';

                // Resolve player array & remaining spots
                const players = [];
                const currentUser = window.Store ? window.Store.getState('currentUser') : null;
                const myName = currentUser ? (currentUser.name || currentUser.displayName || "Jugador") : "Jugador";

                if (autojoinVal) {
                    players.push(myName);
                    // Add friends if slots are limited
                    if (spotsVal === 2) {
                        players.push(`Amigo de ${myName.split(' ')[0]}`);
                    } else if (spotsVal === 1) {
                        players.push(`Amigo 1 de ${myName.split(' ')[0]}`);
                        players.push(`Amigo 2 de ${myName.split(' ')[0]}`);
                    }
                }

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
                    date: dateVal,
                    time: timeVal,
                    duration: durationVal,
                    level_min: lvlMin,
                    level_max: lvlMax,
                    players: players,
                    spots_needed: spotsVal,
                    playtomic_url: finalUrl,
                    original_text: originalText
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

                // Close modal & reload UI view (happens automatically due to Firestore real-time listener!)
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

        openWhatsAppChat() {
            if (window.PlayerView && typeof window.PlayerView.haptic === 'function') {
                window.PlayerView.haptic(20);
            }
            // Link to typical Somos Padel WA group chat
            window.open('https://chat.whatsapp.com/somospadelbarcelona', '_blank');
        }

        shareMatch(matchId) {
            const match = this.allMatches.find(m => m.id === matchId);
            if (!match) return;

            if (navigator.share) {
                navigator.share({
                    title: `Partida Abierta: ${match.club}`,
                    text: `¡Únete a la partida en ${match.club} a las ${match.time}h! Faltan jugadores.`,
                    url: match.playtomic_url
                }).catch(e => console.log('Share canceled:', e));
            } else {
                // Fallback: Copy to clipboard
                navigator.clipboard.writeText(match.playtomic_url);
                alert("¡Enlace de Playtomic copiado al portapapeles! Compártelo con tus amigos.");
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
                output.innerHTML += `<span style="color:#ff2d55">❌ ERROR: ${err.message}</span>`;
            } finally {
                btn.disabled = false;
                btn.innerHTML = originalText;
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
