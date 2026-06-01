/**
 * admin-results.js
 * Unified Controller for Results Management (Americanas & Entrenos).
 * Replaces old admin-matches.js and embedded entreno results logic.
 */

window.AdminViews = window.AdminViews || {};

window.AdminController = {
    currentRound: 1,
    activeEvent: null,
    activeTab: 'matches', // 'matches', 'standings', 'stats'
    matchesBuffer: []
};

/**
 * Generic Entry Point
 * @param {string} forcedType - Optional, forces 'americana' or 'entreno' context
 */
window.loadResultsView = async function (forcedType = null) {
    const content = document.getElementById('content-area');
    const titleEl = document.getElementById('page-title');

    if (titleEl) titleEl.textContent = 'Centro de Control de Resultados';
    content.innerHTML = '<div class="loader"></div>';

    // 1. Fetch Candidates (Live or Open)
    // We fetch ALL events if no type forced, or specific.
    // For simplicity, let's fetch both and merge, OR use the forcedType to decide.

    let events = [];
    if (!forcedType || forcedType === 'entreno') {
        const ent = await EventService.getAll('entreno');
        events.push(...ent.map(e => ({ ...e, type: 'entreno' })));
    }
    if (!forcedType || forcedType === 'americana') {
        const am = await EventService.getAll('americana');
        events.push(...am.map(e => ({ ...e, type: 'americana' })));
    }

    // Sort: Live first, then Date
    events.sort((a, b) => {
        if (a.status === 'live' && b.status !== 'live') return -1;
        if (a.status !== 'live' && b.status === 'live') return 1;
        return new Date(b.date) - new Date(a.date);
    });

    let activeEvent = events[0];
    if (window.selectedEventId) {
        activeEvent = events.find(e => e.id === window.selectedEventId) || activeEvent;
    }

    if (!activeEvent) {
        content.innerHTML = `<div class="glass-card-enterprise text-center" style="padding: 4rem;"><p>No hay eventos activos.</p></div>`;
        return;
    }

    window.AdminController.activeEvent = activeEvent;

    // 2. Render UI
    renderResultsFrame(content, activeEvent, events);

    // 3. Load Matches
    renderMatchesGrid(activeEvent.id, activeEvent.type, window.AdminController.currentRound);

    // 4. REMOVED: statusInterval - Now using Real-Time onSnapshot listeners
    // The Smart DOM Patching handles all updates automatically
    if (window.AdminController.statusInterval) {
        clearInterval(window.AdminController.statusInterval);
        window.AdminController.statusInterval = null;
    }

};

// Aliases for Sidebar access
window.AdminViews.americanas_results = () => window.loadResultsView('americana');
window.AdminViews.entrenos_results = () => window.loadResultsView('entreno');
window.AdminViews.matches = () => window.loadResultsView(); // Generic fallback

// Helper: Render Frame
// Helper: Render Frame
function renderResultsFrame(container, activeEvent, allEvents) {
    const isEntreno = activeEvent.type === 'entreno';
    const color = isEntreno ? '#FF2D55' : '#CCFF00';

    // --- REAL-TIME HEADER UDPATES ---
    // If we have an active listener for the event doc, clear it first
    if (window.AdminController.eventUnsubscribe) {
        window.AdminController.eventUnsubscribe();
    }

    // Determine collection
    const collectionName = isEntreno ? 'entrenos' : 'americanas';

    // Setup Listener
    window.AdminController.eventUnsubscribe = window.db.collection(collectionName).doc(activeEvent.id)
        .onSnapshot(doc => {
            if (doc.exists) {
                const newData = doc.data();
                // Update local ref
                window.AdminController.activeEvent = { ...activeEvent, ...newData };

                // Update Badge UI directly
                const badge = document.getElementById('event-status-badge');
                if (badge) {
                    const status = newData.status; // 'open', 'live', 'finished'
                    const isLive = status === 'live';
                    const baseColor = isEntreno ? '#FF2D55' : '#CCFF00';
                    const badgeText = (isEntreno ? 'CONTROL DE CLASE/ENTRENO' : 'CONTROL DE TORNEO') + ' • ' + status.toUpperCase();

                    badge.style.color = baseColor;
                    badge.innerHTML = `<span style="width: 6px; height: 6px; border-radius: 50%; background: ${baseColor}; display: inline-block; box-shadow: 0 0 8px ${baseColor};"></span> ${badgeText}`;
                    
                    const titleEl = document.getElementById('event-title-header');
                    if (titleEl && newData.name) titleEl.innerText = newData.name;

                    const courtLabel = document.getElementById('telemetry-courts-label');
                    if (courtLabel && newData.max_courts !== undefined) courtLabel.innerText = `${newData.max_courts} pistas`;

                    const courtInput = document.getElementById('quick-courts');
                    if (courtInput && newData.max_courts !== undefined) courtInput.value = newData.max_courts;
                }
            }
        });

    container.innerHTML = `
        <div class="dashboard-header-pro" style="margin-bottom: 2rem; background: linear-gradient(135deg, #0d0e12 0%, #15181f 100%); padding: 2rem; border-radius: 20px; border: 1px solid rgba(255,255,255,0.06); box-shadow: 0 15px 35px rgba(0,0,0,0.4);">
            <div style="display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 2rem; align-items: start;">
                
                <!-- COLUMNA IZQUIERDA: INFO & METADATA -->
                <div style="display: flex; flex-direction: column; gap: 1.2rem;">
                    <!-- Badge & Icon Row -->
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div style="width: 54px; height: 54px; border-radius: 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: center; font-size: 1.8rem; box-shadow: 0 8px 20px rgba(0,0,0,0.3);">
                            ${isEntreno ? '🏋️' : '🏆'}
                        </div>
                        <div>
                            <span id="event-status-badge" style="display: inline-flex; align-items: center; gap: 6px; color: ${color}; background: rgba(${isEntreno ? '255,45,85' : '204,255,0'}, 0.08); border: 1px solid rgba(${isEntreno ? '255,45,85' : '204,255,0'}, 0.2); padding: 4px 10px; border-radius: 8px; font-weight: 800; letter-spacing: 1px; font-size: 0.7rem; text-transform: uppercase;">
                                <span style="width: 6px; height: 6px; border-radius: 50%; background: ${color}; display: inline-block; box-shadow: 0 0 8px ${color};"></span>
                                ${isEntreno ? 'CONTROL DE CLASE/ENTRENO' : 'CONTROL DE TORNEO'} • ${activeEvent.status.toUpperCase()}
                            </span>
                            <h1 id="event-title-header" style="margin: 6px 0 0 0; color: white; font-size: 1.8rem; font-weight: 900; letter-spacing: -0.5px;">${activeEvent.name}</h1>
                        </div>
                    </div>

                    <!-- Telemetry Chips Row -->
                    <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                        <!-- Sede Chip -->
                        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); padding: 6px 12px; border-radius: 10px; font-size: 0.75rem; font-weight: 700; color: #a0aec0; display: flex; align-items: center; gap: 6px;">
                            <i class="fas fa-map-marker-alt" style="color: #60A5FA;"></i> ${activeEvent.location || 'Sede no definida'}
                        </div>
                        <!-- Formato Chip -->
                        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); padding: 6px 12px; border-radius: 10px; font-size: 0.75rem; font-weight: 700; color: #a0aec0; display: flex; align-items: center; gap: 6px;">
                            <i class="fas fa-shuffle" style="color: #A78BFA;"></i> Formato: ${activeEvent.pair_mode === 'rotating' ? 'Individual / Twister' : 'Parejas Fijas'}
                        </div>
                        <!-- Modo de juego -->
                        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); padding: 6px 12px; border-radius: 10px; font-size: 0.75rem; font-weight: 700; color: #a0aec0; display: flex; align-items: center; gap: 6px;">
                            <i class="fas fa-table-tennis-paddle-ball" style="color: #F59E0B;"></i> <span id="telemetry-courts-label">${activeEvent.max_courts || 4} pistas</span>
                        </div>
                    </div>
                </div>

                <!-- COLUMNA DERECHA: SELECTOR DE EVENTO & STEPPER -->
                <div style="display: flex; flex-direction: column; gap: 12px; align-items: flex-end;">
                    <!-- Event Selector -->
                    <div style="width: 100%; position: relative;">
                        <select id="event-selector" class="pro-input" onchange="window.locationSelectEvent(this.value)" style="width:100%; height: 48px; border-radius: 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding-left: 15px; font-weight: 700;">
                            ${allEvents.map(e => `<option value="${e.id}" ${e.id === activeEvent.id ? 'selected' : ''}>[${e.type.substring(0, 3).toUpperCase()}] ${e.name}</option>`).join('')}
                        </select>
                    </div>

                    <!-- Stepper Control de Pistas -->
                    <div style="display: flex; align-items: center; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; height: 48px; padding: 0 4px; width: 100%; justify-content: space-between;">
                        <span style="font-size: 0.75rem; font-weight: 800; color: #888; padding: 0 12px; text-transform: uppercase; letter-spacing: 0.5px;">Gestionar Pistas</span>
                        <div style="display: flex; align-items: center; gap: 5px;">
                            <button type="button" onclick="window.Actions.adjustCourts(-1)" style="width: 34px; height: 34px; border-radius: 8px; border: none; background: rgba(255,255,255,0.06); color: white; font-weight: 900; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.06)'">-</button>
                            <input type="number" id="quick-courts" value="${activeEvent.max_courts || 4}" readonly style="width: 35px; border: none; background: transparent; color: white; text-align: center; font-weight: 900; font-size: 1.1rem; -moz-appearance: textfield; pointer-events: none; margin: 0;">
                            <button type="button" onclick="window.Actions.adjustCourts(1)" style="width: 34px; height: 34px; border-radius: 8px; border: none; background: rgba(255,255,255,0.06); color: white; font-weight: 900; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.06)'">+</button>
                        </div>
                    </div>
                </div>

            </div>

            <!-- SEPARADOR SLEEK -->
            <div style="height: 1px; background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.08) 20%, rgba(255,255,255,0.08) 80%, rgba(255,255,255,0) 100%); margin: 1.5rem 0;"></div>

            <!-- FILAS INFERIORES: TABS & ACTION BUTTONS GRID -->
            <div style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 2rem; align-items: start;">
                
                <!-- TABS DE RESULTADOS (Izquierda) -->
                <div style="display: flex; gap: 6px; background: rgba(255,255,255,0.02); padding: 6px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.04); margin-top: 10px;">
                    <button onclick="window.setTab('matches')" class="tab-btn ${window.AdminController.activeTab === 'matches' ? 'active' : ''}" id="tab-matches" style="flex:1; border:none; padding:10px 15px; border-radius:10px; font-weight:900; font-size: 0.8rem; letter-spacing: 0.5px; background:${window.AdminController.activeTab === 'matches' ? color : 'transparent'}; color:${window.AdminController.activeTab === 'matches' ? '#000' : '#888'}; cursor: pointer; transition: all 0.3s;">PARTIDOS</button>
                    <button onclick="window.setTab('standings')" class="tab-btn ${window.AdminController.activeTab === 'standings' ? 'active' : ''}" id="tab-standings" style="flex:1; border:none; padding:10px 15px; border-radius:10px; font-weight:900; font-size: 0.8rem; letter-spacing: 0.5px; background:${window.AdminController.activeTab === 'standings' ? color : 'transparent'}; color:${window.AdminController.activeTab === 'standings' ? '#000' : '#888'}; cursor: pointer; transition: all 0.3s;">POSICIONES</button>
                    <button onclick="window.setTab('stats')" class="tab-btn ${window.AdminController.activeTab === 'stats' ? 'active' : ''}" id="tab-stats" style="flex:1; border:none; padding:10px 15px; border-radius:10px; font-weight:900; font-size: 0.8rem; letter-spacing: 0.5px; background:${window.AdminController.activeTab === 'stats' ? color : 'transparent'}; color:${window.AdminController.activeTab === 'stats' ? '#000' : '#888'}; cursor: pointer; transition: all 0.3s;">ESTADÍSTICAS</button>
                </div>

                <!-- ACCIONES DEL EVENTO EN FILA PREMIUM OPTIMIZADA (Derecha) -->
                <div style="display: flex; flex-direction: column; gap: 8px; width: 100%; align-items: flex-end;">
                    
                    <div style="font-size: 0.65rem; font-weight: 800; color: #555; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 2px;">
                        Control del evento
                    </div>

                    <div style="display: flex; gap: 8px; align-items: center; justify-content: flex-end; width: 100%; flex-wrap: wrap;">
                        
                        <!-- Botón Circular de Ayuda ❔ (Naranja/Amber) -->
                        <button onclick="window.Actions.toggleHelpMode()" id="btn-toggle-help"
                            style="width: 38px; height: 38px; border-radius: 50%;
                                   border: 1.5px solid rgba(251, 191, 36, 0.5);
                                   background: rgba(251, 191, 36, 0.08);
                                   color: #fbbf24; font-size: 0.9rem; cursor: pointer;
                                   display: flex; align-items: center; justify-content: center;
                                   transition: all 0.25s; box-shadow: 0 0 8px rgba(251,191,36,0.2);"
                            title="Activar Modo Ayuda"
                            onmouseover="this.style.background='rgba(251,191,36,0.18)'; this.style.boxShadow='0 0 14px rgba(251,191,36,0.4)';"
                            onmouseout="this.style.background='rgba(251,191,36,0.08)'; this.style.boxShadow='0 0 8px rgba(251,191,36,0.2)';">
                            <i class="fas fa-question"></i>
                        </button>

                        <!-- Botón COMPARTIR 📢 (Violeta) -->
                        <button onclick="window.Actions.shareStandings()"
                            style="height: 38px; padding: 0 14px; border-radius: 10px;
                                   font-weight: 800; font-size: 0.72rem; letter-spacing: 0.3px;
                                   border: 1.5px solid rgba(167, 139, 250, 0.5);
                                   background: rgba(167, 139, 250, 0.08);
                                   color: #a78bfa; cursor: pointer;
                                   display: flex; align-items: center; gap: 6px;
                                   transition: all 0.25s; box-shadow: 0 0 8px rgba(167,139,250,0.15);"
                            title="Copiar clasificación para WhatsApp/compartir"
                            onmouseover="this.style.background='rgba(167,139,250,0.18)'; this.style.boxShadow='0 0 14px rgba(167,139,250,0.35)';"
                            onmouseout="this.style.background='rgba(167,139,250,0.08)'; this.style.boxShadow='0 0 8px rgba(167,139,250,0.15)';">
                            <i class="fas fa-share-nodes"></i> COMPARTIR
                        </button>

                        <!-- Dropdown de Herramientas 🛠️ (Azul) -->
                        <div style="position: relative; display: inline-block;" id="tools-dropdown-wrapper">
                            <button onclick="window.Actions.toggleToolsDropdown(event)" id="btn-tools-dropdown"
                                style="height: 38px; padding: 0 14px; border-radius: 10px;
                                       font-weight: 800; font-size: 0.72rem; letter-spacing: 0.3px;
                                       border: 1.5px solid rgba(96, 165, 250, 0.5);
                                       background: rgba(96, 165, 250, 0.08);
                                       color: #60a5fa; cursor: pointer;
                                       display: flex; align-items: center; gap: 6px;
                                       transition: all 0.25s; box-shadow: 0 0 8px rgba(96,165,250,0.15);"
                                onmouseover="this.style.background='rgba(96,165,250,0.18)'; this.style.boxShadow='0 0 14px rgba(96,165,250,0.35)';"
                                onmouseout="this.style.background='rgba(96,165,250,0.08)'; this.style.boxShadow='0 0 8px rgba(96,165,250,0.15)';">
                                <i class="fas fa-tools"></i> HERRAMIENTAS <i class="fas fa-chevron-down" style="font-size: 0.55rem; opacity: 0.7;"></i>
                            </button>
                            
                            <!-- MENÚ FLOTANTE GLASSMORPHIC -->
                            <div id="tools-dropdown-menu" style="display: none; position: absolute; right: 0; top: 46px; width: 270px;
                                background: rgba(13, 14, 20, 0.97); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
                                border: 1px solid rgba(255,255,255,0.1); border-radius: 14px;
                                box-shadow: 0 15px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(96,165,250,0.1);
                                z-index: 200; padding: 8px; flex-direction: column; gap: 3px;">

                                <!-- Header del menú -->
                                <div style="padding: 6px 10px 10px 10px; border-bottom: 1px solid rgba(255,255,255,0.06); margin-bottom: 4px;">
                                    <span style="font-size: 0.6rem; font-weight: 900; color: #555; text-transform: uppercase; letter-spacing: 1px;">🛠️ Herramientas de Control</span>
                                </div>

                                <!-- SANEAR: Amarillo con fondo sutil -->
                                <div style="display: flex; flex-direction: column; width: 100%;">
                                    <button onclick="window.Actions.sanitizeCurrentRound(); window.Actions.toggleToolsDropdown()"
                                        style="width: 100%; text-align: left; padding: 10px 12px; border-radius: 9px;
                                               border: 1px solid rgba(241,196,15,0.2);
                                               background: rgba(241,196,15,0.06);
                                               color: #f1c40f; font-weight: 700; font-size: 0.76rem;
                                               display: flex; align-items: center; gap: 10px; cursor: pointer; transition: all 0.2s;"
                                        onmouseover="this.style.background='rgba(241,196,15,0.14)'; this.style.borderColor='rgba(241,196,15,0.4)';"
                                        onmouseout="this.style.background='rgba(241,196,15,0.06)'; this.style.borderColor='rgba(241,196,15,0.2)';">
                                        <span style="width:22px; height:22px; border-radius:6px; background:rgba(241,196,15,0.15); display:flex; align-items:center; justify-content:center; flex-shrink:0;"><i class="fas fa-broom" style="font-size:0.7rem;"></i></span>
                                        <span>Sanear Ronda</span>
                                    </button>
                                    <p class="action-help-text" style="display: none; font-size: 0.62rem; color: #a0aec0; padding: 4px 12px 8px 44px; margin: 0; line-height: 1.4;">
                                        Limpia partidos duplicados o fantasma si hubo micro-cortes de red.
                                    </p>
                                </div>

                                <!-- REPARAR: Verde neón con fondo sutil -->
                                <div style="display: flex; flex-direction: column; width: 100%;">
                                    <button onclick="window.Actions.repairCurrentRound(); window.Actions.toggleToolsDropdown()"
                                        style="width: 100%; text-align: left; padding: 10px 12px; border-radius: 9px;
                                               border: 1px solid rgba(0,227,109,0.2);
                                               background: rgba(0,227,109,0.06);
                                               color: #00E36D; font-weight: 700; font-size: 0.76rem;
                                               display: flex; align-items: center; gap: 10px; cursor: pointer; transition: all 0.2s;"
                                        onmouseover="this.style.background='rgba(0,227,109,0.14)'; this.style.borderColor='rgba(0,227,109,0.4)';"
                                        onmouseout="this.style.background='rgba(0,227,109,0.06)'; this.style.borderColor='rgba(0,227,109,0.2)';">
                                        <span style="width:22px; height:22px; border-radius:6px; background:rgba(0,227,109,0.15); display:flex; align-items:center; justify-content:center; flex-shrink:0;"><i class="fas fa-wrench" style="font-size:0.7rem;"></i></span>
                                        <span>Reparar Pistas</span>
                                    </button>
                                    <p class="action-help-text" style="display: none; font-size: 0.62rem; color: #a0aec0; padding: 4px 12px 8px 44px; margin: 0; line-height: 1.4;">
                                        Detecta jugadores sin partido y reconstruye sus pistas de juego.
                                    </p>
                                </div>

                                <!-- SIMULAR / AZAR (Condicional): Naranja -->
                                ${activeEvent.pair_mode === 'rotating' || activeEvent.type === 'entreno' ? `
                                <div style="display: flex; flex-direction: column; width: 100%;">
                                    <button onclick="window.Actions.resetEvent(true); window.Actions.toggleToolsDropdown()"
                                        style="width: 100%; text-align: left; padding: 10px 12px; border-radius: 9px;
                                               border: 1px solid rgba(243,156,18,0.2);
                                               background: rgba(243,156,18,0.06);
                                               color: #f39c12; font-weight: 700; font-size: 0.76rem;
                                               display: flex; align-items: center; gap: 10px; cursor: pointer; transition: all 0.2s;"
                                        onmouseover="this.style.background='rgba(243,156,18,0.14)'; this.style.borderColor='rgba(243,156,18,0.4)';"
                                        onmouseout="this.style.background='rgba(243,156,18,0.06)'; this.style.borderColor='rgba(243,156,18,0.2)';">
                                        <span style="width:22px; height:22px; border-radius:6px; background:rgba(243,156,18,0.15); display:flex; align-items:center; justify-content:center; flex-shrink:0;"><i class="fas fa-dice" style="font-size:0.7rem;"></i></span>
                                        <span>Reiniciar con Azar</span>
                                    </button>
                                    <p class="action-help-text" style="display: none; font-size: 0.62rem; color: #a0aec0; padding: 4px 12px 8px 44px; margin: 0; line-height: 1.4;">
                                        Reinicia y regenera la Ronda 1 con parejas al 100% de azar (social).
                                    </p>
                                </div>
                                ` : ''}

                                <!-- SEPARADOR -->
                                <div style="height: 1px; background: rgba(255,255,255,0.05); margin: 3px 0;"></div>

                                <!-- RESET (Reiniciar Balanceado): Rojo -->
                                <div style="display: flex; flex-direction: column; width: 100%;">
                                    <button onclick="window.Actions.resetEvent(); window.Actions.toggleToolsDropdown()"
                                        style="width: 100%; text-align: left; padding: 10px 12px; border-radius: 9px;
                                               border: 1px solid rgba(239,68,68,0.2);
                                               background: rgba(239,68,68,0.06);
                                               color: #ef4444; font-weight: 700; font-size: 0.76rem;
                                               display: flex; align-items: center; gap: 10px; cursor: pointer; transition: all 0.2s;"
                                        onmouseover="this.style.background='rgba(239,68,68,0.14)'; this.style.borderColor='rgba(239,68,68,0.4)';"
                                        onmouseout="this.style.background='rgba(239,68,68,0.06)'; this.style.borderColor='rgba(239,68,68,0.2)';">
                                        <span style="width:22px; height:22px; border-radius:6px; background:rgba(239,68,68,0.15); display:flex; align-items:center; justify-content:center; flex-shrink:0;"><i class="fas fa-rotate" style="font-size:0.7rem;"></i></span>
                                        <span>Reiniciar Balanceado</span>
                                    </button>
                                    <p class="action-help-text" style="display: none; font-size: 0.62rem; color: #a0aec0; padding: 4px 12px 8px 44px; margin: 0; line-height: 1.4;">
                                        ⚠️ Borra TODOS los partidos y regenera la Ronda 1 por niveles.
                                    </p>
                                </div>

                                <!-- BORRAR POSTERIORES (Seguridad): Rojo oscuro -->
                                <div id="btn-purge-safe-wrapper" style="display: none; width: 100%;">
                                    <button id="btn-purge-safe" onclick="window.Actions.purgeFutureRoundsFromUI(); window.Actions.toggleToolsDropdown()"
                                        style="width: 100%; text-align: left; padding: 10px 12px; border-radius: 9px;
                                               border: 1px solid rgba(239,68,68,0.2);
                                               background: rgba(239,68,68,0.04);
                                               color: #ef4444; font-weight: 700; font-size: 0.76rem;
                                               display: flex; align-items: center; gap: 10px; cursor: pointer; transition: all 0.2s;"
                                        onmouseover="this.style.background='rgba(239,68,68,0.12)'; this.style.borderColor='rgba(239,68,68,0.4)';"
                                        onmouseout="this.style.background='rgba(239,68,68,0.04)'; this.style.borderColor='rgba(239,68,68,0.2)';">
                                        <span style="width:22px; height:22px; border-radius:6px; background:rgba(239,68,68,0.15); display:flex; align-items:center; justify-content:center; flex-shrink:0;"><i class="fas fa-trash-alt" style="font-size:0.7rem;"></i></span>
                                        <span>Borrar Posteriores</span>
                                    </button>
                                    <p class="action-help-text" style="display: none; font-size: 0.62rem; color: #a0aec0; padding: 4px 12px 8px 44px; margin: 0; line-height: 1.4;">
                                        Elimina rondas siguientes para corregir resultados anteriores.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- ROND+1: Botón Principal Neón (Azul/Cian brillante) -->
                        <button onclick="window.Actions.generateRound()"
                            style="height: 38px; padding: 0 18px; border-radius: 10px;
                                   font-weight: 900; font-size: 0.75rem; letter-spacing: 0.5px;
                                   border: none; cursor: pointer;
                                   background: linear-gradient(135deg, #00d4ff 0%, #0072ff 100%);
                                   color: white; box-shadow: 0 0 14px rgba(0,212,255,0.4), 0 2px 8px rgba(0,114,255,0.3);
                                   display: flex; align-items: center; gap: 6px; transition: all 0.25s;"
                            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(0,212,255,0.55), 0 0 30px rgba(0,114,255,0.3)';"
                            onmouseout="this.style.transform='none'; this.style.boxShadow='0 0 14px rgba(0,212,255,0.4), 0 2px 8px rgba(0,114,255,0.3)';">
                            <i class="fas fa-wand-magic-sparkles"></i> ⚡ ROND+1
                        </button>

                    </div>
                </div>

            </div>

             <!-- PESTAÑAS DE RONDAS -->
             <div id="round-tabs-container" style="display: flex; gap: 8px; margin-top: 1.5rem; overflow-x: auto; padding-bottom: 5px; -webkit-overflow-scrolling: touch;">
                ${[1, 2, 3, 4, 5, 6].map(r => `
                    <button class="btn-round-tab ${window.AdminController.currentRound === r ? 'active' : ''}" 
                            onclick="window.Actions.switchRound(${r})" style="font-size: 0.75rem; padding: 10px 18px; border-radius: 10px;">
                        RONDA ${r}
                    </button>`).join('')}
             </div>

        </div>

        <div id="results-main-layout" style="display: grid; grid-template-columns: 3fr 1fr; gap: 2rem;">
            <div id="matches-grid"><div class="loader"></div></div>
            <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                <!-- PRESENCIA EN TIEMPO REAL -->
                <div class="glass-card-enterprise" style="padding: 1.5rem; border-color: rgba(0,227,109,0.3); border-radius:16px;">
                    <h3 style="margin:0 0 1rem 0; color:#00E36D; font-size:0.85rem; font-weight:900; letter-spacing:1px; display:flex; align-items:center; gap:8px;">
                        <i class="fas fa-satellite-dish"></i> RADAR DE PRESENCIA
                    </h3>
                    <div id="presence-list">
                        <div style="color:rgba(255,255,255,0.3); font-size:0.75rem; text-align:center; padding:10px;">Cargando presencias...</div>
                    </div>
                    <div style="margin-top:10px; font-size:0.6rem; color:rgba(255,255,255,0.2); text-align:center;">Actualización: cada 30s</div>
                </div>
                <!-- CLASIFICACIÓN -->
                <div id="sidebar-container" class="glass-card-enterprise" style="border-radius:16px;">
                    <h3 style="margin:0 0 1rem 0; color:white; font-size:1rem;">CLASIFICACIÓN</h3>
                    <div id="standings-list"></div>
                </div>
            </div>
        </div>
    `;
    // Start Presence Radar for admin
    startPresenceRadar(activeEvent);
}

async function renderMatchesGrid(eventId, type, round) {
    const container = document.getElementById('matches-grid');
    if (!container) return;

    // Clear Listeners
    if (window.AdminController.matchesUnsubscribers) {
        window.AdminController.matchesUnsubscribers.forEach(u => u && u());
    }
    window.AdminController.matchesUnsubscribers = [];
    if (window.AdminController.matchesUnsubscribe) {
        window.AdminController.matchesUnsubscribe();
        window.AdminController.matchesUnsubscribe = null;
    }

    // Initial Loader only if empty
    if (!container.innerHTML.includes('match-card') && !container.innerHTML.includes('smart-grid')) {
        container.innerHTML = '<div class="loader"></div>';
    }

    window.AdminController.matchesBuffer = [];

    const updateUI = () => {
        const gridContainer = document.getElementById('matches-grid');
        if (!gridContainer) return;

        if (window.AdminController.activeTab === 'standings') {
            gridContainer.innerHTML = '<div class="glass-card-enterprise" style="padding:2rem;">' + document.getElementById('standings-list').innerHTML.replace(/display:flex/g, 'display:grid; grid-template-columns: 1fr auto; font-size: 1.2rem; padding: 15px;') + '</div>';
            return;
        }

        if (window.AdminController.activeTab === 'stats') {
            renderFullStatsView(gridContainer, window.AdminController.matchesBuffer);
            return;
        }

        const roundMatches = window.AdminController.matchesBuffer
            .filter(m => (m.round == round) || (!m.round && round == 1))
            .sort((a, b) => a.court - b.court);

        if (roundMatches.length === 0) {
            container.innerHTML = `
            <div style="text-align:center; padding: 4rem; color: #666;">
                <h3>Sin partidos en Ronda ${round}</h3>
                <p>Genera los cruces o comprueba otra ronda.</p>
            </div>`;
            return;
        }

        // Setup Grid Container
        let grid = container.querySelector('.smart-grid');
        if (!grid) {
            container.innerHTML = `<div class="smart-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem; animation: fadeIn 0.3s;"></div>`;
            grid = container.querySelector('.smart-grid');
        }

        const validIds = new Set();

        roundMatches.forEach(match => {
            validIds.add(match.id);
            const cardId = `card-${match.id}`;
            let el = document.getElementById(cardId);

            if (el) {
                // --- SMART UPDATE ---
                // 1. Status
                const statusEl = document.getElementById(`status-${match.id}`);
                const isFinished = match.status === 'finished';
                const newStatusHTML = isFinished ?
                    '<span style="font-size:0.6rem; background:#00ff64; color:black; padding:2px 6px; border-radius:4px; font-weight:800;">FINALIZADO</span>' :
                    '<span style="font-size:0.6rem; color:#ff9f43; animation: blink 1s infinite;">EN JUEGO</span>';

                if (statusEl && statusEl.innerHTML !== newStatusHTML) {
                    statusEl.innerHTML = newStatusHTML;
                    el.style.border = isFinished ? '1px solid #333' : '1px solid var(--primary-glow)';

                    // Update Action Button too
                    const btnFinish = document.getElementById(`btn-finish-${match.id}`);
                    if (btnFinish) {
                        btnFinish.innerText = isFinished ? '✓ RESULTADO CONFIRMADO' : 'ACEPTAR RESULTADO';
                        btnFinish.style.background = isFinished ? 'rgba(255,255,255,0.05)' : 'var(--primary)';
                        btnFinish.style.color = isFinished ? '#666' : 'black';
                        btnFinish.setAttribute('onclick', `window.Actions.finishMatch('${match.id}', ${!isFinished})`);
                    }
                }

                // 2. Scores (Update Spans)
                const sA_el = document.getElementById(`score-a-${match.id}`);
                const sB_el = document.getElementById(`score-b-${match.id}`);
                const pA_el = document.getElementById(`score-primary-a-${match.id}`);
                const pB_el = document.getElementById(`score-primary-b-${match.id}`);

                const scoreA = match.score_a || 0;
                const scoreB = match.score_b || 0;

                if (sA_el && sA_el.innerText != scoreA) sA_el.innerText = scoreA;
                if (sB_el && sB_el.innerText != scoreB) sB_el.innerText = scoreB;
                if (pA_el && pA_el.innerText != scoreA) pA_el.innerText = scoreA;
                if (pB_el && pB_el.innerText != scoreB) pB_el.innerText = scoreB;

                // 3. Names (Update names if they changed)
                const nameAEl = document.getElementById(`name-a-${match.id}`);
                const nameBEl = document.getElementById(`name-b-${match.id}`);
                const teamAStr = match.teamA || (Array.isArray(match.team_a_names) ? match.team_a_names.join(' / ') : match.team_a_names);
                const teamBStr = match.teamB || (Array.isArray(match.team_b_names) ? match.team_b_names.join(' / ') : match.team_b_names);

                if (nameAEl && nameAEl.innerText !== teamAStr) nameAEl.innerText = teamAStr;
                if (nameBEl && nameBEl.innerText !== teamBStr) nameBEl.innerText = teamBStr;

            } else {
                // --- INSERT ---
                grid.insertAdjacentHTML('beforeend', renderMatchCard(match));
            }
        });

        // Remove old
        grid.querySelectorAll('.match-card').forEach(card => {
            const id = card.id.replace('card-', '');
            if (!validIds.has(id)) card.remove();
        });

        // --- NEW: NEXT ROUND PROMPT IN ADMIN PANEL ---
        const maxMatchRound = Math.max(...window.AdminController.matchesBuffer.map(m => parseInt(m.round) || 1));
        const isCurrentRoundFinished = roundMatches.length > 0 && roundMatches.every(m => m.status === 'finished' || m.status === 'finalizado');

        const existingPrompt = document.getElementById('admin-next-round-prompt');
        if (existingPrompt) existingPrompt.remove();

        if (isCurrentRoundFinished && round === maxMatchRound) {
            const promptHTML = `
                <div id="admin-next-round-prompt" class="glass-card-enterprise animate-pop-in" style="grid-column: 1 / -1; margin-top: 2rem; padding: 2.5rem; border: 2px solid var(--primary); text-align: center; background: rgba(204,255,0,0.05);">
                    <h2 style="color: var(--primary); margin: 0 0 10px 0; font-weight: 900;">🎯 RONDA ${round} COMPLETADA</h2>
                    <p style="color: rgba(255,255,255,0.7); margin-bottom: 2rem;">Todos los partidos de esta ronda han finalizado. ¿Deseas generar la siguiente ronda ahora?</p>
                    <div style="display: flex; gap: 1rem; justify-content: center;">
                        <button onclick="window.Actions.generateRound()" class="btn-primary-pro" style="padding: 15px 40px; font-size: 1.1rem;">
                            🚀 GENERAR RONDA ${round + 1}
                        </button>
                    </div>
                </div>
            `;
            grid.insertAdjacentHTML('beforeend', promptHTML);
        }

        renderStandingsInternal(window.AdminController.matchesBuffer);
    };

    const primaryColl = (type === 'entreno') ? 'entrenos_matches' : 'matches';

    try {
        const sub = window.db.collection(primaryColl)
            .where('americana_id', '==', eventId)
            .onSnapshot(snap => {
                window.AdminController.matchesBuffer = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                updateUI();
            });

        window.AdminController.matchesUnsubscribers = [sub];

        // --- NEW: UI DYNAMICS FOR PURGE BUTTON ---
        setTimeout(() => {
            const maxR = Math.max(...window.AdminController.matchesBuffer.map(m => parseInt(m.round) || 1));
            const btnPurgeWrapper = document.getElementById('btn-purge-safe-wrapper');
            if (btnPurgeWrapper) btnPurgeWrapper.style.display = (round < maxR) ? 'block' : 'none';
        }, 500);

    } catch (e) {
        container.innerHTML = `Error: ${e.message}`;
    }
}

function renderMatchCard(match) {
    const isFinished = match.status === 'finished' || match.status === 'finalizado';
    const sA = match.score_a || 0;
    const sB = match.score_b || 0;

    const formatNameSimple = (fullName) => {
        if (!fullName) return '';
        const parts = fullName.trim().split(/\s+/);
        if (parts.length <= 2) return fullName;
        return `${parts[0]} ${parts[1]}`;
    };

    const formatTeam = (names) => {
        if (!names) return 'Equipo';
        if (Array.isArray(names)) return names.map(n => formatNameSimple(n)).join(' / ');
        if (typeof names === 'string' && names.includes(' / ')) {
            return names.split(' / ').map(n => formatNameSimple(n)).join(' / ');
        }
        return formatNameSimple(names);
    };

    const teamA = formatTeam(match.teamA || match.team_a_names);
    const teamB = formatTeam(match.teamB || match.team_b_names);

    // Presence Radar: Check if players are physically at the club
    const presenceCache = window._presenceCache || {};
    const teamAIds = match.team_a_ids || [];
    const teamBIds = match.team_b_ids || [];
    const aPresent = teamAIds.some(id => presenceCache[id]);
    const bPresent = teamBIds.some(id => presenceCache[id]);
    const presenceBadgeA = aPresent ? '<span title="Jugadores presentes en el club" style="font-size:0.6rem; background:rgba(0,227,109,0.2); color:#00E36D; padding:2px 6px; border-radius:4px; margin-left:6px;"><i class="fas fa-location-dot"></i> EN CLUB</span>' : '';
    const presenceBadgeB = bPresent ? '<span title="Jugadores presentes en el club" style="font-size:0.6rem; background:rgba(0,227,109,0.2); color:#00E36D; padding:2px 6px; border-radius:4px; margin-left:6px;"><i class="fas fa-location-dot"></i> EN CLUB</span>' : '';

    const scoreControls = `
        <div style="position: relative; background: rgba(0,0,0,0.2); padding: 15px; border-radius: 16px; margin-top: 15px; border: 1px solid rgba(255,255,255,0.05);">
            <!-- OPTIONAL OCR SCAN BUTTON (Moved to corner) -->
            <button onclick="window.Actions.scanMatchScore('${match.id}')" title="Escanear Marcador con IA" style="position: absolute; right: 10px; top: 10px; background: rgba(204, 255, 0, 0.1); border: 1px solid var(--primary); color: var(--primary); width: 32px; height: 32px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; z-index: 5;">
                <i class="fas fa-camera" style="font-size: 0.9rem;"></i>
            </button>

            <div style="display: flex; gap: 15px; justify-content: center; align-items: center;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <button onclick="window.Actions.adjustScore('${match.id}', 'score_a', -1)" style="width:32px; height:32px; border-radius:50%; border:1px solid #444; background:#222; color:white; font-weight:900;">-</button>
                    <span id="score-a-${match.id}" onclick="window.Actions.manualScoreEdit('${match.id}', 'score_a')" style="width: 30px; text-align: center; font-weight: 950; font-size: 1.4rem; color: var(--primary); cursor: pointer;" title="Click para editar">${sA}</span>
                    <button onclick="window.Actions.adjustScore('${match.id}', 'score_a', 1)" style="width:32px; height:32px; border-radius:50%; border:1px solid var(--primary); background:#222; color:var(--primary); font-weight:900;">+</button>
                </div>
                
                <div style="font-weight: 900; color: rgba(255,255,255,0.1); font-size: 1.5rem;">VS</div>
                
                <div style="display: flex; align-items: center; gap: 8px;">
                    <button onclick="window.Actions.adjustScore('${match.id}', 'score_b', -1)" style="width:32px; height:32px; border-radius:50%; border:1px solid #444; background:#222; color:white; font-weight:900;">-</button>
                    <span id="score-b-${match.id}" onclick="window.Actions.manualScoreEdit('${match.id}', 'score_b')" style="width: 30px; text-align: center; font-weight: 950; font-size: 1.4rem; color: var(--primary); cursor: pointer;" title="Click para editar">${sB}</span>
                    <button onclick="window.Actions.adjustScore('${match.id}', 'score_b', 1)" style="width:32px; height:32px; border-radius:50%; border:1px solid var(--primary); background:#222; color:var(--primary); font-weight:900;">+</button>
                </div>
            </div>
        </div>
    `;

    return `
        <div id="card-${match.id}" class="glass-card-enterprise match-card" style="padding:0; overflow:hidden; border: 1px solid ${isFinished ? '#333' : 'var(--primary-glow)'}; transition: all 0.3s; position:relative;">
            <div style="background: rgba(255,255,255,0.03); padding: 12px 20px; display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.05); align-items:center;">
                <div style="display:flex; align-items:center; gap:10px;">
                    <span style="font-weight:900; color:var(--primary); font-size:0.75rem; letter-spacing:1px;">PISTA ${match.court}</span>
                    <button onclick="window.Actions.deleteMatch('${match.id}')" title="Eliminar este partido" style="background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.5); color:#ef4444; border-radius:6px; cursor:pointer; font-size:0.7rem; padding:3px 8px; font-weight:800; line-height:1;">🗑 BORRAR</button>
                </div>
                <div id="status-${match.id}">
                    ${isFinished ?
            '<span style="font-size:0.65rem; background:#00ff64; color:black; padding:3px 8px; border-radius:6px; font-weight:950;">FINALIZADO</span>' :
            '<span style="font-size:0.65rem; color:#CCFF00; font-weight:900; text-shadow:0 0 10px #CCFF0040;">⚡ EN JUEGO</span>'}
                </div>
            </div>
            <div style="padding: 1.8rem;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        ${isFinished && sA > sB ? '<i class="fas fa-trophy" style="color:var(--primary); font-size:0.8rem;"></i>' : ''}
                        <span id="name-a-${match.id}" style="font-weight:800; color:${isFinished && sA > sB ? 'white' : 'white'}; font-size:0.95rem; ${isFinished && sA > sB ? 'border-bottom: 3px solid var(--primary); padding-bottom: 2px;' : ''}">${teamA}</span>
                        <button onclick="window.Actions.swapPlayerInMatch('${match.id}')" title="Sustituir jugador" style="background:none; border:none; color:rgba(255,255,255,0.2); cursor:pointer; font-size:0.7rem; padding: 2px;"><i class="fas fa-sync-alt"></i></button>
                    </div>
                    <span id="score-primary-a-${match.id}" style="font-weight:950; font-size:1.4rem; color:${isFinished && sA > sB ? 'var(--primary)' : 'rgba(255,255,255,0.3)'};">${sA}</span>
                </div>
                <div style="height:1px; background:rgba(255,255,255,0.05); margin-bottom:12px;"></div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        ${isFinished && sB > sA ? '<i class="fas fa-trophy" style="color:var(--primary); font-size:0.8rem;"></i>' : ''}
                        <span id="name-b-${match.id}" style="font-weight:800; color:${isFinished && sB > sA ? 'white' : 'white'}; font-size:0.95rem; ${isFinished && sB > sA ? 'border-bottom: 3px solid var(--primary); padding-bottom: 2px;' : ''}">${teamB}</span>
                        <button onclick="window.Actions.swapPlayerInMatch('${match.id}')" title="Sustituir jugador" style="background:none; border:none; color:rgba(255,255,255,0.2); cursor:pointer; font-size:0.7rem; padding: 2px;"><i class="fas fa-sync-alt"></i></button>
                    </div>
                    <span id="score-primary-b-${match.id}" style="font-weight:950; font-size:1.4rem; color:${isFinished && sB > sA ? 'var(--primary)' : 'rgba(255,255,255,0.3)'};">${sB}</span>
                </div>
                
                ${scoreControls}
                
                <div style="margin-top:20px; display:flex; flex-direction:column; gap:12px;">
                     <button id="btn-finish-${match.id}" class="btn-primary-pro ${(!isFinished && (sA > 0 || sB > 0)) ? 'btn-pulse-primary' : ''}" 
                             onclick="${isFinished ? '' : `window.Actions.finishMatch('${match.id}', true)`}" 
                             style="width:100%; padding:14px; font-size:0.85rem; font-weight:900; 
                                    background:${isFinished ? 'rgba(0,255,100,0.1)' : 'var(--primary)'}; 
                                    box-shadow:${(!isFinished && (sA > 0 || sB > 0)) ? '0 0 20px var(--primary-glow)' : 'none'};
                                    color:${isFinished ? '#00ff64' : 'black'}; border:none; cursor:${isFinished ? 'default' : 'pointer'}; position:relative; overflow:hidden;">
                        ${isFinished ? '<i class="fas fa-check-circle"></i> RESULTADO CONFIRMADO' : 'ACEPTAR RESULTADO'}
                        ${(!isFinished && (sA > 0 || sB > 0)) ? '<div class="confetti-hint"></div>' : ''}
                     </button>
                     ${isFinished ? `
                        <button class="btn-outline-pro" onclick="window.Actions.finishMatch('${match.id}', false)" 
                                style="width:100%; padding:10px; font-size:0.8rem; font-weight:900; color:#ff9f43; border:1px solid #ff9f43; background:transparent;">
                            <i class="fas fa-undo"></i> REABRIR / CORREGIR
                        </button>
                     ` : ''}
                </div>
            </div>
        </div>
    `;
}

function renderStandingsInternal(matches) {
    const container = document.getElementById('standings-list');
    if (!container) return;

    const stats = {};
    const evt = window.AdminController.activeEvent;
    const isRotating = evt && evt.pair_mode === 'rotating';

    matches.forEach(m => {
        if (m.status === 'finished' || m.status === 'finalizado') {
            const processTeams = (namesGroup, score) => {
                // Determine if we should treat names as separate individuals or a single pair
                let namesToProcess = [];
                if (Array.isArray(namesGroup)) {
                    if (isRotating) namesToProcess = namesGroup; // Process each player
                    else namesToProcess = [namesGroup.join(' / ')]; // Process as one pair
                } else if (typeof namesGroup === 'string') {
                    namesToProcess = [namesGroup];
                }

                namesToProcess.forEach(name => {
                    if (!name || name.includes('VACANTE')) return;
                    if (!stats[name]) stats[name] = { played: 0, games: 0, wins: 0 };
                    stats[name].played++;
                    stats[name].games += parseInt(score || 0);
                });
            };

            processTeams(m.team_a_names, m.score_a);
            processTeams(m.team_b_names, m.score_b);
        }
    });

    const sorted = Object.entries(stats)
        .map(([k, v]) => ({ name: k, ...v }))
        .sort((a, b) => b.games - a.games);

    container.innerHTML = sorted.map((s, i) => `
        <div style="display:flex; justify-content:space-between; padding:8px; border-bottom:1px solid rgba(255,255,255,0.05); align-items:center;">
            <div style="display:flex; align-items:center; gap:8px; overflow:hidden;">
                <span style="color:var(--primary); font-weight:900; min-width:25px;">#${i + 1}</span> 
                <span style="color:white; font-size:0.85rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${s.name}</span>
            </div>
            <div style="color:white; font-weight:700; background:rgba(255,255,255,0.05); padding:2px 8px; border-radius:4px;">${s.games}</div>
        </div>
    `).join('') || '<div style="padding:1rem; opacity:0.5; text-align:center;">Esperando resultados...</div>';
}


// --- ACTIONS EXPOSED TO WINDOW ---
window.Actions = {
    async purgeFutureRoundsFromUI() {
        const evt = window.AdminController.activeEvent;
        const round = window.AdminController.currentRound;

        const confirmed = await PremiumModal.confirm({
            title: "🛑 BORRADO DE SEGURIDAD",
            message: `¿Estás seguro de que deseas eliminar TODAS las rondas posteriores a la <b>Ronda ${round}</b>?<br><br>Esta acción es necesaria si quieres corregir resultados de la ronda actual que afecten a los cruces siguientes.`,
            confirmText: "SÍ, BORRAR POSTERIORES",
            cancelText: "CANCELAR",
            type: 'danger'
        });

        if (confirmed) {
            try {
                await MatchMakingService.purgeSubsequentRounds(evt.id, round, evt.type);
                PremiumModal.alert({ title: "ÉXITO", message: "Rondas posteriores eliminadas correctamente.", type: 'success' });
                window.loadResultsView(evt.type);
            } catch (e) {
                PremiumModal.alert({ title: "ERROR", message: e.message, type: 'danger' });
            }
        }
    },

    async generateRound() {
        const evt = window.AdminController.activeEvent;
        const round = window.AdminController.currentRound;

        // Confirmation?
        // RESTRICTION: Specific Status Check
        if (evt.status !== 'live' && evt.status !== 'pairing') {
            if (evt.status === 'open') {
                alert("⛔ EL EVENTO ESTÁ 'ABIERTO'\n\nPara empezar a generar partidos, cambia el estado a 'EN JUEGO' o 'EMPAREJAMIENTO'.");
            } else if (evt.status === 'finished') {
                alert("⛔ EL EVENTO ESTÁ 'FINALIZADO'\n\nYa no se pueden generar más rondas.");
            } else {
                alert(`⛔ Estado actual: ${evt.status.toUpperCase()}\n\nEl evento debe estar 'EN JUEGO' o 'EMPAREJAMIENTO' para generar rondas.`);
            }
            return;
        }

        try {
            await MatchMakingService.generateRound(evt.id, evt.type, round);
            window.loadResultsView(evt.type); // Refresh
        } catch (e) {
            if (e.message.includes('sin finalizar') && confirm(e.message + "\n\n¿Quieres FORZAR la generación de la siguiente ronda?")) {
                try {
                    await MatchMakingService.generateRound(evt.id, evt.type, round, true);
                    window.loadResultsView(evt.type);
                } catch (err) { alert("Error al forzar: " + err.message); }
            } else {
                alert(e.message);
            }
        }
    },

    async sanitizeCurrentRound() {
        const evt = window.AdminController.activeEvent;
        const round = window.AdminController.currentRound;
        if (!confirm(`⚠️ ¿Deseas sanear la Ronda ${round}?\n\nSe eliminarán:\n- Partidos duplicados (misma pista/par)\n- Partidos fantasma sin finalizar si ya existe uno finalizado.`)) return;

        try {
            const res = await MatchMakingService.sanitizeRound(evt.id, evt.type, round);
            alert(`✅ Saneamiento completado.\n\nRegistros eliminados: ${res.deleted}`);
            window.loadResultsView(evt.type);
        } catch (e) {
            alert("❌ Error: " + e.message);
        }
    },

    async repairCurrentRound() {
        const evt = window.AdminController.activeEvent;
        const round = window.AdminController.currentRound;
        if (!confirm(`⚠️ ¿Deseas reparar la Ronda ${round}?\n\nSe buscarán jugadores sin partido y se restaurarán las pistas faltantes.`)) return;

        try {
            const res = await MatchMakingService.repairRound(evt.id, evt.type, round);
            if (res.repaired > 0) {
                alert(`✅ Reparación completada.\n\nPistas restauradas: ${res.repaired}`);
            } else {
                alert(res.message || "✅ No se han detectado pistas faltantes o jugadores sin asignar.");
            }
            window.loadResultsView(evt.type);
        } catch (e) {
            alert("❌ Error: " + e.message);
        }
    },

    async switchRound(r) {
        console.log("📍 Switching to Round:", r);
        window.AdminController.currentRound = r;

        // Update Tabs UI
        document.querySelectorAll('.btn-round-tab').forEach(btn => {
            const isTarget = btn.innerText.includes(String(r));
            btn.classList.toggle('active', isTarget);
        });

        const evt = window.AdminController.activeEvent;
        if (evt) {
            window.renderMatchesGrid(evt.id, evt.type, r);
        }
    },

    async recalculateLevels() {
        if (!confirm("⚠️ ¿Recalcular niveles ELO de TODOS los jugadores?\n\nEste proceso escanea todos los partidos finalizados y ajusta los niveles para corregir posibles desviaciones.")) return;

        if (window.LevelAdjustmentService && window.LevelAdjustmentService.recalculateAllLevels) {
            await window.LevelAdjustmentService.recalculateAllLevels();
        } else {
            alert("Error: LevelAdjustmentService no disponible.");
        }
    },

    async simulateRound() {
        const evt = window.AdminController.activeEvent;
        const round = window.AdminController.currentRound;

        if (!evt.is_simulation && !confirm("Simular resultados aleatorios?")) return;

        try {
            await MatchMakingService.simulateRound(evt.id, round, evt.type);

            // IF SIMULATION MODE: Auto-chain to next rounds until R6
            if (evt.is_simulation && round < 6) {
                console.log(`🤖 Auto-Chaining Simulation: Round ${round} -> ${round + 1}`);
                const nextRound = round + 1;
                await MatchMakingService.generateRound(evt.id, evt.type, nextRound);
                await MatchMakingService.simulateRound(evt.id, nextRound, evt.type);

                // Recursively call for next round (or just loop)
                // For simplicity, we can just reload and the finishMatch logic will handle it if we triggered it.
                // But better to do it here explicitly for a "One-Click" feel.
                for (let r = nextRound + 1; r <= 6; r++) {
                    await MatchMakingService.generateRound(evt.id, evt.type, r);
                    await MatchMakingService.simulateRound(evt.id, r, evt.type);
                }
                window.Actions.switchRound(6);
            } else {
                window.loadResultsView(evt.type);
            }
        } catch (e) { alert(e.message); }
    },

    /**
     * OCR Integration: Scan scoreboard from photo
     */
    async manualScoreEdit(matchId, field) {
        const match = window.AdminController.matchesBuffer.find(m => m.id === matchId);
        if (!match) return;

        const currentVal = match[field] || 0;
        const teamLabel = field === 'score_a' ? 'EQUIPO A' : 'EQUIPO B';

        // --- NEW: QUICK GRID SELECTOR ---
        const options = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(v => ({
            id: v,
            name: String(v),
            sub: v === currentVal ? 'ACTUAL' : ''
        }));

        const selected = await PremiumModal.selector({
            title: `SELECCIONAR JUEGOS - ${teamLabel}`,
            message: `Puntuación actual: ${currentVal}`,
            items: options,
            placeholder: 'Filtrar...',
            type: 'primary'
        });

        if (selected !== null && selected !== undefined) {
            // Extraer el ID si es un objeto, o usar el valor directo
            const val = (typeof selected === 'object') ? selected.id : selected;
            await this.updateScore(matchId, field, val);
        }
    },

    async scanMatchScore(matchId) {
        if (!window.OcrService) {
            alert("Error: OCR Service no cargado.");
            return;
        }

        window.OcrService.captureAndScan(async (scoreA, scoreB) => {
            console.log(`📸 OCR Result for ${matchId}: ${scoreA}-${scoreB}`);
            // Update scores in DB
            const evt = window.AdminController.activeEvent;
            const collection = (evt && evt.type === 'entreno') ? FirebaseDB.entrenos_matches : FirebaseDB.matches;

            await collection.update(matchId, {
                score_a: scoreA,
                score_b: scoreB
            });

            // UI will update automatically via onSnapshot
        });
    },

    async updateScore(matchId, field, value) {
        const match = window.AdminController.matchesBuffer.find(m => m.id === matchId);
        if (match && (match.status === 'finished' || match.status === 'finalizado')) {
            const proced = await PremiumModal.confirm({
                title: "⚠️ PARTIDO FINALIZADO",
                message: "Este partido ya está cerrado. Para cambiar el resultado, se recomienda reabrirlo primero.<br><br>¿Deseas modificar el marcador de todas formas?",
                confirmText: "MODIFICAR",
                cancelText: "CANCELAR",
                type: 'danger'
            });
            if (!proced) return;
        }

        const evt = window.AdminController.activeEvent;
        const collection = (evt && evt.type === 'entreno') ? FirebaseDB.entrenos_matches : FirebaseDB.matches;
        await collection.update(matchId, { [field]: parseInt(value) });
    },

    async adjustScore(matchId, field, delta) {
        const match = window.AdminController.matchesBuffer.find(m => m.id === matchId);
        if (!match) return;

        if (match.status === 'finished' || match.status === 'finalizado') {
            console.log("Admin editing finished match score via +/-");
            // We allow it in admin panel but we could add a subtle toast
        }

        // CHECK CASCADE
        await this.checkAndPurge(matchId);

        let newVal = (match[field] || 0) + delta;
        if (newVal < 0) newVal = 0;
        await this.updateScore(matchId, field, newVal);
    },

    async checkAndPurge(matchId) {
        const match = window.AdminController.matchesBuffer.find(m => m.id === matchId);
        if (!match) return;

        const maxRound = Math.max(...window.AdminController.matchesBuffer.map(m => parseInt(m.round) || 1));
        if (match.round < maxRound) {
            if (confirm(`⚠️ ATENCIÓN: Estás editando la Ronda ${match.round}, pero ya existen rondas posteriores (hasta R${maxRound}).\n\nLos cruces actuales de las rondas R${match.round + 1} a R${maxRound} ya no son válidos con este cambio.\n\n¿Deseas BORRAR las rondas posteriores y regenerar el torneo desde aquí?`)) {
                const evt = window.AdminController.activeEvent;
                const currentRoundNum = parseInt(match.round);

                console.log(`🧹 Purging rounds > ${currentRoundNum} for ${evt.id}`);
                await MatchMakingService.purgeSubsequentRounds(evt.id, currentRoundNum, evt.type);

                // --- AUTO REGENERATE FOR SIMULATIONS ---
                if (evt.is_simulation) {
                    console.log("🤖 [Simulation] Auto-regenerating chain after purge...");
                    // Small delay to let DB settle
                    setTimeout(async () => {
                        for (let r = currentRoundNum + 1; r <= 6; r++) {
                            console.log(`🤖 Regenerating R${r}...`);
                            try {
                                await MatchMakingService.generateRound(evt.id, evt.type, r);
                                await MatchMakingService.simulateRound(evt.id, r, evt.type);
                            } catch (err) {
                                console.error(`Error regenerating R${r}:`, err);
                                break;
                            }
                        }
                        window.Actions.switchRound(6);
                        window.loadResultsView(evt.type);
                    }, 500);
                } else {
                    window.loadResultsView(evt.type);
                }
            }
        }
    },

    async finishMatch(matchId, isFinish) {
        const match = window.AdminController.matchesBuffer.find(m => m.id === matchId);
        if (!match) return;

        const evt = window.AdminController.activeEvent;
        const collection = (evt && evt.type === 'entreno') ? FirebaseDB.entrenos_matches : FirebaseDB.matches;

        if (isFinish) {
            // --- ROBUST CONFIRMATION ---
            const sA = parseInt(match.score_a || 0);
            const sB = parseInt(match.score_b || 0);
            const teamA = match.teamA || (Array.isArray(match.team_a_names) ? match.team_a_names.join(' / ') : match.team_a_names);
            const teamB = match.teamB || (Array.isArray(match.team_b_names) ? match.team_b_names.join(' / ') : match.team_b_names);

            let winnerText = "EMPATE";
            let type = 'warning';
            if (sA > sB) { winnerText = `GANADOR: ${teamA}`; type = 'success'; }
            else if (sB > sA) { winnerText = `GANADOR: ${teamB}`; type = 'success'; }

            if (sA === 0 && sB === 0) {
                const confirmZero = await PremiumModal.confirm({
                    title: "⚠️ ¿MARCADOR 0 - 0?",
                    message: `Has introducido un 0-0. ¿Es este el resultado real o un error?`,
                    confirmText: "ES CORRECTO (0-0)",
                    cancelText: "VOLVER A EDITAR",
                    type: 'danger'
                });
                if (!confirmZero) return;
            }

            const confirmed = await PremiumModal.confirm({
                title: "✅ CONFIRMAR RESULTADO",
                message: `
                    <div style="background: rgba(0,0,0,0.2); padding: 20px; border-radius: 20px; margin: 15px 0; border: 1px solid rgba(255,255,255,0.05);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <span style="font-weight: 800; color: white;">${teamA}</span>
                            <span style="font-size: 1.5rem; font-weight: 950; color: var(--primary);">${sA}</span>
                        </div>
                        <div style="height: 1px; background: rgba(255,255,255,0.05); margin: 10px 0;"></div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-weight: 800; color: white;">${teamB}</span>
                            <span style="font-size: 1.5rem; font-weight: 950; color: var(--primary);">${sB}</span>
                        </div>
                    </div>
                    <div style="font-weight: 900; color: ${type === 'success' ? '#00ff88' : '#ccff00'}; letter-spacing: 1px; font-size: 0.8rem;">${winnerText.toUpperCase()}</div>
                    <p style="margin-top: 15px; font-size: 0.85rem; color: #94a3b8;">Al confirmar, se actualizarán los niveles ELO de los jugadores.</p>
                `,
                confirmText: "ACEPTAR Y FINALIZAR",
                cancelText: "REVISAR",
                type: type
            });

            if (!confirmed) return;
        } else {
            // --- REOPENING LOGIC WITH AUTO-ROLLBACK ---
            const confirmedValue = await PremiumModal.confirm({
                title: "🔓 REABRIR PARTIDO",
                message: "¿Estás seguro de que quieres reabrir este partido?<br><br><b>SISTEMA DE SEGURIDAD:</b> Al reabrir, se <u>deshacerán automáticamente</u> los ajustes de nivel ELO realizados previamente para este partido.",
                confirmText: "SÍ, REABRIR Y REVERTIR",
                cancelText: "CANCELAR",
                type: 'warning'
            });
            if (!confirmedValue) return;

            // 1. Rollback ELO Results
            if (window.LevelAdjustmentService) {
                try { await LevelAdjustmentService.rollbackMatchResults(matchId); }
                catch (e) { console.error("Error en rollback:", e); }
            }

            // 2. CHECK CASCADE (Purge subsequent if user changes rank-critical results later)
            await this.checkAndPurge(matchId);
        }

        try {
            const newStatus = isFinish ? 'finished' : 'live';
            await collection.update(matchId, { status: newStatus });

            if (isFinish) {
                // Ajuste de nivel (Pro Smart)
                if (window.LevelAdjustmentService) {
                    LevelAdjustmentService.processMatchResults(match).catch(e => {
                        console.error("Error ajustando nivel:", e);
                    });
                }

                // Actualizar fecha de actividad
                if (window.LevelReliabilityService) {
                    const playerIds = [...(match.team_a_ids || []), ...(match.team_b_ids || [])];
                    window.LevelReliabilityService.updateLastMatchDate(playerIds).catch(e => {
                        console.error("Error actualizando fiabilidad:", e);
                    });
                }
            }

            console.log("✅ Estado actualizado en DB.");

            if (isFinish) {
                // Check for round completion
                setTimeout(async () => {
                    const round = window.AdminController.currentRound;
                    // We need to re-fetch or use buffer but buffer might be old. 
                    // Better to check the latest buffer
                    const roundMatches = window.AdminController.matchesBuffer.filter(m => parseInt(m.round) == round);
                    const pending = roundMatches.filter(m => m.status !== 'finished');

                    if (pending.length === 0 && roundMatches.length > 0) {
                        if (round >= 6) {
                            await PremiumModal.alert({
                                title: "🏁 EVENTO COMPLETADO",
                                message: "Se han completado las 6 rondas oficiales con éxito.",
                                type: 'success'
                            });
                            return;
                        }

                        const nextRound = round + 1;
                        const autoGenerate = evt.is_simulation;

                        if (autoGenerate || await PremiumModal.confirm({
                            title: `🚀 RONDA ${round} FINALIZADA`,
                            message: `Todos los partidos de la Ronda ${round} han terminado.<br><br>¿Quieres generar los cruces de la <b>Ronda ${nextRound}</b> ahora?`,
                            confirmText: "GENERAR SIGUIENTE RONDA",
                            cancelText: "LO HARÉ LUEGO",
                            type: 'success'
                        })) {
                            try {
                                await MatchMakingService.generateRound(evt.id, evt.type, nextRound);
                                if (autoGenerate) {
                                    await MatchMakingService.simulateRound(evt.id, nextRound, evt.type);
                                }
                                window.Actions.switchRound(nextRound);
                            } catch (e) {
                                PremiumModal.alert({ title: "ERROR AL GENERAR", message: e.message, type: 'danger' });
                            }
                        }
                    }
                }, 800);
            }
        } catch (e) {
            PremiumModal.alert({ title: "ERROR DB", message: e.message, type: 'danger' });
        }
    },

    async recalculateLevels() {
        if (window.LevelAdjustmentService) {
            await LevelAdjustmentService.recalculateAllLevels();
        } else {
            alert("Error: LevelAdjustmentService no disponible.");
        }
    },

    switchRound(r) {
        window.AdminController.currentRound = r;
        const evt = window.AdminController.activeEvent;
        renderMatchesGrid(evt.id, evt.type, r);

        // Update Tabs UI
        document.querySelectorAll('.btn-round-tab').forEach(b => b.classList.remove('active'));
        // Find button by text or index... easier to re-render context but that's expensive.
        // We just re-render frame? No. 
        // Just cheat and update generic style
    },

    async updateCourts() {
        const val = document.getElementById('quick-courts').value;
        const evt = window.AdminController.activeEvent;
        await EventService.updateEvent(evt.type, evt.id, { max_courts: parseInt(val) });
        alert("Pistas actualizadas");
    },

    async adjustCourts(delta) {
        const input = document.getElementById('quick-courts');
        if (!input) return;
        let val = parseInt(input.value) + delta;
        if (val < 1) val = 1;
        input.value = val;
        
        const evt = window.AdminController.activeEvent;
        if (!evt) return;
        
        try {
            await EventService.updateEvent(evt.type, evt.id, { max_courts: val });
            if (window.NotificationService) {
                window.NotificationService.showToast(`Pistas actualizadas a ${val}`, "success");
            }
        } catch (e) {
            console.error("Error al actualizar pistas:", e);
            alert("Error: " + e.message);
        }
    },

    shareStandings() {
        const evt = window.AdminController.activeEvent;
        const matches = window.AdminController.matchesBuffer || [];
        if (!matches.length) {
            if (window.NotificationService) {
                window.NotificationService.showToast('No hay datos de clasificación todavía', 'warning');
            } else {
                alert('No hay datos de clasificación todavía.');
            }
            return;
        }

        // Build stats map (same logic as renderStandingsInternal)
        const stats = {};
        const isRotating = evt && evt.pair_mode === 'rotating';
        matches.forEach(m => {
            if (m.status !== 'finished' && m.status !== 'finalizado') return;
            const process = (namesGroup, score) => {
                let names = [];
                if (Array.isArray(namesGroup)) names = isRotating ? namesGroup : [namesGroup.join(' / ')];
                else if (typeof namesGroup === 'string') names = [namesGroup];
                names.forEach(name => {
                    if (!name || name.includes('VACANTE')) return;
                    if (!stats[name]) stats[name] = { games: 0, played: 0 };
                    stats[name].played++;
                    stats[name].games += parseInt(score || 0);
                });
            };
            process(m.team_a_names, m.score_a);
            process(m.team_b_names, m.score_b);
        });

        const sorted = Object.entries(stats)
            .map(([k, v]) => ({ name: k, ...v }))
            .sort((a, b) => b.games - a.games);

        if (!sorted.length) {
            alert('Aún no hay partidos finalizados para compartir.');
            return;
        }

        const medals = ['🥇', '🥈', '🥉'];
        const eventName = evt ? evt.name : 'Torneo';
        const now = new Date();
        const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

        let text = `🏓 *CLASIFICACIÓN EN VIVO — ${eventName.toUpperCase()}*\n`;
        text += `📅 Actualizado: ${timeStr}h\n`;
        text += `${'─'.repeat(28)}\n`;
        sorted.forEach((p, i) => {
            const medal = medals[i] || `${i + 1}.`;
            const first = p.name.split(' ')[0];
            text += `${medal} *${first}* — ${p.games} juegos (${p.played} PJ)\n`;
        });
        text += `${'─'.repeat(28)}\n`;
        text += `⚡ _SomosPadel BCN_`;

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                if (window.NotificationService) {
                    window.NotificationService.showToast('📋 Clasificación copiada — pégala en WhatsApp', 'success');
                } else {
                    alert('✅ Clasificación copiada al portapapeles.');
                }
            }).catch(() => {
                prompt('Copia este texto:', text);
            });
        } else {
            prompt('Copia este texto para compartir:', text);
        }
    },

    toggleToolsDropdown(event) {
        if (event) event.stopPropagation();
        const menu = document.getElementById('tools-dropdown-menu');
        if (!menu) return;
        
        if (!event) {
            menu.style.display = 'none';
            return;
        }
        
        const isCurrentlyOpen = menu.style.display === 'flex';
        menu.style.display = isCurrentlyOpen ? 'none' : 'flex';
        
        if (!isCurrentlyOpen) {
            const closeDropdown = (e) => {
                const wrapper = document.getElementById('tools-dropdown-wrapper');
                if (wrapper && !wrapper.contains(e.target)) {
                    menu.style.display = 'none';
                    document.removeEventListener('click', closeDropdown);
                }
            };
            setTimeout(() => {
                document.addEventListener('click', closeDropdown);
            }, 50);
        }
    },

    toggleHelpMode() {
        const btn = document.getElementById('btn-toggle-help');
        if (!btn) return;
        const helps = document.querySelectorAll('.action-help-text');
        const isActive = btn.classList.toggle('active');
        
        if (isActive) {
            btn.style.borderColor = 'rgba(204,255,0,0.6)';
            btn.style.color = '#CCFF00';
            btn.style.background = 'rgba(204,255,0,0.1)';
            helps.forEach(h => {
                h.style.display = 'block';
                h.style.animation = 'fadeIn 0.2s ease-out';
            });
        } else {
            btn.style.borderColor = 'rgba(255,255,255,0.08)';
            btn.style.color = '#888';
            btn.style.background = 'rgba(255,255,255,0.03)';
            helps.forEach(h => h.style.display = 'none');
        }
    },

    async resetEvent(randomize = false) {
        let msg = randomize
            ? "⚠️ ¿ESTÁS SEGURO?\n\nSe borrarán TODOS los partidos y se generará la Ronda 1 con PAREJAS TOTALMENTE NUEVAS (Modo Aleatorio).\n\n¿Continuar?"
            : "⚠️ ¿ESTÁS SEGURO?\n\nEsta acción es irreversible:\n1. Borrará TODOS los partidos y resultados.\n2. Reiniciará el evento a estado 'Live'.\n3. Generará automáticamente la Ronda 1.\n\n¿Continuar?";

        if (!confirm(msg)) return;

        if (randomize) console.log("🎲 Reinicio aleatorio solicitado...");

        const evt = window.AdminController.activeEvent;
        if (!evt || !evt.id) {
            alert("❌ Error: No hay evento activo");
            return;
        }

        const loader = document.getElementById('matches-grid');
        if (loader) loader.innerHTML = '<div class="loader"></div>';

        try {
            console.log(`🔄 Reiniciando evento: ${evt.name} (${evt.id})`);

            // 1. Delete all matches for this event (Search in BOTH collections)
            const collections = ['matches', 'entrenos_matches'];
            let totalDeleted = 0;

            for (const collName of collections) {
                try {
                    const snap = await window.db.collection(collName).where('americana_id', '==', evt.id).get();
                    if (!snap.empty) {
                        const batch = window.db.batch();
                        snap.docs.forEach(doc => {
                            batch.delete(doc.ref);
                            totalDeleted++;
                        });
                        await batch.commit();
                        console.log(`✅ Deleted ${snap.size} matches from ${collName}`);
                    }
                } catch (err) {
                    console.warn(`⚠️ Error deleting from ${collName}:`, err);
                }
            }

            console.log(`🔥 Purged ${totalDeleted} matches across all collections.`);

            // 2. Reset Event Status to LIVE (Immediate Restart)
            console.log("📝 Updating event status to 'live'...");

            // Clean update payload - remove any undefined fields
            const updatePayload = {
                status: 'live'
            };

            // Use EventService if available, otherwise direct DB update
            if (window.EventService && window.EventService.updateEvent) {
                await EventService.updateEvent(evt.type, evt.id, updatePayload);
            } else {
                // Fallback to direct DB update
                const collectionName = evt.type === 'entreno' ? 'entrenos' : 'americanas';
                await window.db.collection(collectionName).doc(evt.id).update(updatePayload);
            }

            console.log("✅ Event status updated to 'live'");

            // 3. Auto-Generate Round 1
            console.log("🚀 Auto-generating Round 1 after reset...");

            if (!window.MatchMakingService) {
                throw new Error("MatchMakingService no está disponible");
            }

            await MatchMakingService.generateRound(evt.id, evt.type, 1, false, randomize);
            console.log("✅ Round 1 generated successfully");

            if (window.NotificationService) {
                window.NotificationService.showToast(randomize ? "🎲 Reiniciado con Nuevas Parejas" : "✅ Evento Reiniciado", "success");
            } else {
                alert(randomize ? "🎲 Reiniciado con éxito (Nuevas Parejas)" : "✅ Evento reiniciado y Ronda 1 generada.");
            }

            // Reload view
            if (window.loadResultsView) {
                window.loadResultsView(evt.type);
            } else {
                location.reload();
            }

        } catch (e) {
            console.error("❌ Error al reiniciar evento:", e);
            alert(`❌ Error al reiniciar: ${e.message}\n\nRevisa la consola para más detalles.`);

            // Restore UI
            if (loader) {
                loader.innerHTML = '<div style="padding:2rem; text-align:center; color:#ff4444;">Error al reiniciar. Recarga la página.</div>';
            }
        }
    },

    async finishEvent() {
        const evt = window.AdminController.activeEvent;
        if (!evt || !evt.id) {
            alert("❌ Error: No hay evento activo");
            return;
        }

        // Check if all matches are finished
        const allMatches = window.AdminController.matchesBuffer || [];
        const unfinished = allMatches.filter(m => m.status !== 'finished');

        if (unfinished.length > 0) {
            if (!confirm(`⚠️ ATENCIÓN\n\nAún hay ${unfinished.length} partidos sin finalizar.\n\n¿Deseas finalizar el evento de todas formas?`)) {
                return;
            }
        }

        if (!confirm(`🏁 ¿Finalizar el evento "${evt.name}"?\n\nEsto marcará el evento como terminado y no se podrán generar más rondas.`)) {
            return;
        }

        try {
            console.log(`🏁 Finalizando evento: ${evt.name}`);

            // Update event status to finished
            const updatePayload = {
                status: 'finished',
                finishedAt: new Date().toISOString()
            };

            if (window.EventService && window.EventService.updateEvent) {
                await EventService.updateEvent(evt.type, evt.id, updatePayload);
            } else {
                const collectionName = evt.type === 'entreno' ? 'entrenos' : 'americanas';
                await window.db.collection(collectionName).doc(evt.id).update(updatePayload);
            }

            alert("✅ Evento finalizado correctamente");

            // Reload view
            if (window.loadResultsView) {
                window.loadResultsView(evt.type);
            } else {
                location.reload();
            }

        } catch (e) {
            console.error("❌ Error al finalizar evento:", e);
            alert(`❌ Error: ${e.message}`);
        }
    },

    async deleteMatch(matchId) {
        if (!confirm('🗑️ ¿Eliminar este partido?\n\nSe borrará completamente. Esto no se puede deshacer.')) return;

        try {
            const evt = window.AdminController.activeEvent;
            const collection = (evt && evt.type === 'entreno') ? 'entrenos_matches' : 'matches';

            // Single DELETE operation — mínima cuota Firebase
            await db.collection(collection).doc(matchId).delete();

            // Remove card from UI immediately
            const card = document.getElementById(`card-${matchId}`);
            if (card) {
                card.style.transition = 'all 0.3s';
                card.style.opacity = '0';
                card.style.transform = 'scale(0.9)';
                setTimeout(() => card.remove(), 300);
            }

            // Update local buffer
            if (window.AdminController.matchesBuffer) {
                window.AdminController.matchesBuffer = window.AdminController.matchesBuffer.filter(m => m.id !== matchId);
            }

            console.log(`✅ Partido ${matchId} eliminado`);
        } catch (e) {
            console.error('Error eliminando partido:', e);
            alert('❌ Error al eliminar: ' + e.message);
        }
    },

    async runRescue1101() {
        if (window.LevelReliabilityService) {
            await window.LevelReliabilityService.runRescue1101();
        } else {
            alert("Error: LevelReliabilityService no disponible.");
        }
    },

    async swapPlayerInMatch(matchId) {
        if (!window.PremiumModal) return alert("PremiumModal no disponible");

        const match = window.AdminController.matchesBuffer.find(m => m.id === matchId);
        if (!match) return;

        const evt = window.AdminController.activeEvent;
        const players = evt.players || [];

        try {
            // 1. Select player in match to replace
            const teamAIds = match.team_a_ids || [];
            const teamBIds = match.team_b_ids || [];
            const teamANames = Array.isArray(match.team_a_names) ? match.team_a_names : [match.team_a_names];
            const teamBNames = Array.isArray(match.team_b_names) ? match.team_b_names : [match.team_b_names];

            const matchPlayerItems = [
                ...teamANames.map((n, i) => ({ id: teamAIds[i], name: n, sub: 'Equipo A' })),
                ...teamBNames.map((n, i) => ({ id: teamBIds[i], name: n, sub: 'Equipo B' }))
            ].filter(p => p.name);

            const oldPlayer = await PremiumModal.selector({
                title: '¿A quién quieres sustituir?',
                message: 'Selecciona el jugador que NO ha venido o que quieres cambiar en el cuadro.',
                items: matchPlayerItems,
                type: 'warning'
            });

            if (!oldPlayer) return;

            // 2. Select replacement from event players
            const replacementItems = players.map(p => ({
                id: p.id || p.uid,
                name: (p.name || 'JUGADOR').toUpperCase(),
                sub: `Nivel: ${p.level || '3.5'}`
            })).sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));

            const newPlayer = await PremiumModal.selector({
                title: 'Selecciona al sustituto',
                message: `Elige quién ocupará el lugar de ${oldPlayer.name}:`,
                items: replacementItems,
                placeholder: 'Busca al nuevo jugador...',
                type: 'success'
            });

            if (!newPlayer) return;

            if (confirm(`¿Sustituir a ${oldPlayer.name} por ${newPlayer.name}?\n\nEsto actualizará todos los partidos pendientes donde aparezca ${oldPlayer.name}.`)) {

                // Show loader or similar
                const updatesCount = await MatchmakingService.substitutePlayerInMatchesRobust(
                    evt.id, oldPlayer.id, oldPlayer.name, newPlayer.id, newPlayer.name, evt.type
                );

                if (window.NotificationService) {
                    window.NotificationService.showToast(`Sustitución completada. ${updatesCount} partidos actualizados.`, "success");
                } else {
                    alert(`✓ Éxito: ${updatesCount} partidos actualizados.`);
                }

                window.loadResultsView(evt.type);
            }
        } catch (e) {
            console.error("Error swapping player:", e);
            alert("Error: " + e.message);
        }
    }
};

window.setTab = (tab) => {
    window.AdminController.activeTab = tab;
    // UI Update
    document.querySelectorAll('.tab-btn').forEach(b => {
        const isTarget = b.id === `tab-${tab}`;
        const activeColor = window.AdminController.activeEvent.type === 'entreno' ? '#FF2D55' : '#CCFF00';
        b.style.background = isTarget ? activeColor : 'transparent';
        b.style.color = isTarget ? 'black' : '#888';
    });

    // Toggle containers
    const grid = document.getElementById('results-main-layout');
    const roundNav = document.getElementById('round-tabs-container');
    const sidebar = document.getElementById('sidebar-container');

    if (tab === 'matches') {
        grid.style.gridTemplateColumns = '3fr 1fr';
        roundNav.style.display = 'flex';
        sidebar.style.display = 'block';
    } else {
        grid.style.gridTemplateColumns = '1fr';
        roundNav.style.display = 'none';
        sidebar.style.display = 'none';
    }

    window.renderMatchesGrid(window.AdminController.activeEvent.id, window.AdminController.activeEvent.type, window.AdminController.currentRound);
};

function renderFullStatsView(container, matches) {
    const statsMap = {};
    matches.forEach(m => {
        if (m.status !== 'finished') return;
        const process = (ids, names, score, oppScore) => {
            ids.forEach((id, i) => {
                if (!statsMap[id]) statsMap[id] = { name: names[i] || id, pj: 0, wins: 0, games: 0 };
                statsMap[id].pj++;
                statsMap[id].games += score;
                if (score > oppScore) statsMap[id].wins++;
            });
        };
        process(m.team_a_ids, m.team_a_names, m.score_a, m.score_b);
        process(m.team_b_ids, m.team_b_names, m.score_b, m.score_a);
    });

    const sorted = Object.values(statsMap).sort((a, b) => b.wins - a.wins || b.games - a.games);

    container.innerHTML = `
        <div class="glass-card-enterprise animate-fade-in" style="padding: 2.5rem; border-color: rgba(204,255,0,0.2);">
            <h2 style="color: var(--primary); margin: 0 0 2rem 0; font-size: 1.5rem; display: flex; align-items: center; gap: 15px;">
                <i class="fas fa-chart-line"></i> Estadísticas Detalladas del Entreno
            </h2>
            <div style="overflow-x: auto; background: rgba(0,0,0,0.2); border-radius: 20px; border: 1px solid rgba(255,255,255,0.05);">
                <table style="width: 100%; border-collapse: collapse; text-align: left;">
                    <thead style="background: rgba(255,255,255,0.03);">
                        <tr>
                            <th style="padding: 20px; color: #666; font-size: 0.7rem; font-weight: 900;">#</th>
                            <th style="padding: 20px; color: #666; font-size: 0.7rem; font-weight: 900;">JUGADOR</th>
                            <th style="padding: 20px; color: #666; font-size: 0.7rem; font-weight: 900; text-align: center;">PJ</th>
                            <th style="padding: 20px; color: #666; font-size: 0.7rem; font-weight: 900; text-align: center;">V</th>
                            <th style="padding: 20px; color: #666; font-size: 0.7rem; font-weight: 900; text-align: center;">JUEGOS</th>
                            <th style="padding: 20px; color: #666; font-size: 0.7rem; font-weight: 900; text-align: center;">RENDIMIENTO</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sorted.map((p, i) => `
                            <tr style="border-bottom: 1px solid rgba(255,255,255,0.02);">
                                <td style="padding: 15px 20px; font-weight: 900; color: var(--primary);">${i + 1}</td>
                                <td style="padding: 15px 20px; font-weight: 800; color: white;">${p.name}</td>
                                <td style="padding: 15px 20px; text-align: center; color: #888;">${p.pj}</td>
                                <td style="padding: 15px 20px; text-align: center; color: #00ff64; font-weight: 900;">${p.wins}</td>
                                <td style="padding: 15px 20px; text-align: center; font-weight: 900;">${p.games}</td>
                                <td style="padding: 15px 20px; text-align: center;">
                                    <span style="background: rgba(204,255,0,0.1); color: #ccff00; padding: 4px 10px; border-radius: 8px; font-weight: 900; font-size: 0.75rem;">
                                        ${Math.round((p.wins / Math.max(1, p.pj)) * 100)}%
                                    </span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// --- NAVIGATION HANDLER ---
window.locationSelectEvent = function (id) {
    console.log("🔄 Changing Event to:", id);
    if (!id) return;
    window.selectedEventId = id;

    // Attempt to preserve the current "Filter Context" (Americana vs Entreno)
    // based on the current active event's type.
    const currentType = window.AdminController.activeEvent ? window.AdminController.activeEvent.type : null;

    // Reload the view
    window.loadResultsView(currentType);
};

console.log("🏆 Admin-Results Optimized Loaded");

// =============================================================
// RADAR DE PRESENCIA: Admin sees who is physically at the club
// =============================================================
let _presenceInterval = null;

async function startPresenceRadar(activeEvent) {
    if (_presenceInterval) clearInterval(_presenceInterval);

    const fetchPresence = async () => {
        const presenceEl = document.getElementById('presence-list');
        if (!presenceEl) { clearInterval(_presenceInterval); return; }

        try {
            // Who is at the club? Players whose last_location was updated in the last 10 min
            const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
            const snap = await window.db.collection('players')
                .where('last_location.at_hq', '!=', false)
                .get();

            const atClub = [];
            window._presenceCache = {};

            snap.docs.forEach(doc => {
                const data = doc.data();
                const loc = data.last_location;
                if (!loc || !loc.at_hq) return;
                // Only count if in last 10 minutes
                if (loc.at && loc.at > tenMinutesAgo) {
                    atClub.push({ id: doc.id, name: data.name, hq: loc.at_hq });
                    window._presenceCache[doc.id] = true;
                }
            });

            // Render the presence widget
            if (atClub.length === 0) {
                presenceEl.innerHTML = `<div style="color:rgba(255,255,255,0.3); font-size:0.75rem; text-align:center; padding:10px;">Nadie en el club aún</div>`;
            } else {
                presenceEl.innerHTML = atClub.map(p => `
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.05);">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span style="width:8px; height:8px; border-radius:50%; background:#00E36D; display:inline-block; box-shadow:0 0 6px #00E36D; flex-shrink:0;"></span>
                            <span style="color:white; font-size:0.75rem; font-weight:700;">${(p.name || '').split(' ')[0]}</span>
                        </div>
                        <span style="font-size:0.55rem; color:#00E36D; font-weight:800; background:rgba(0,227,109,0.1); padding:2px 6px; border-radius:4px;">${p.hq}</span>
                    </div>
                `).join('');
            }

            // Update badge count in header
            const countBadge = document.getElementById('presence-count-badge');
            if (countBadge) countBadge.textContent = atClub.length;

        } catch (e) {
            console.warn("Presence Radar error:", e.message);
        }
    };

    fetchPresence(); // Run immediately
    _presenceInterval = setInterval(fetchPresence, 30000); // Then every 30s
}
