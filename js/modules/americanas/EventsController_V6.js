/**
 * EventsController_V6.js
 * Optimized version: Removed embedded views and added listener cleanup.
 */
(function () {
    console.log("🔥 [EventsController_V6] SCRIPT LOADED AND EXECUTING!");

    // Global handler for results navigation - USE PREMIUM CONTROLTOWER VIEW OR ENTRENO LIVE VIEW
    window.openResultsView = (id, type) => {
        console.log("🚀 [EventsController] Opening Results for:", id, "Type:", type);

        // For Americanas & Entrenos (Unified Pro View): Wait for ControlTowerView to be ready
        const waitForControlTower = (attempts = 0) => {
            if (window.ControlTowerView && typeof window.ControlTowerView.prepareLoad === 'function') {
                console.log("✅ ControlTowerView ready, loading event");
                window.ControlTowerView.prepareLoad(id, type);
                window.Router.navigate('live');
            } else if (attempts < 20) {
                console.log(`⏳ Waiting for ControlTowerView... (attempt ${attempts + 1})`);

                // NEW: Last ditch effort if instance missing but class exists
                if (!window.ControlTowerView && window.ControlTowerViewClass) {
                    try {
                        window.ControlTowerView = new window.ControlTowerViewClass();
                        console.log("⚠️ Force-Instantiated ControlTowerView from exported class in openResultsView");
                    } catch (e) { console.error("Error force-instantiating:", e); }
                }

                setTimeout(() => waitForControlTower(attempts + 1), 150);
            } else {
                console.error("❌ ControlTowerView not available, using fallback");
                window.location.href = `resultados.html?id=${id}`;
            }
        };

        waitForControlTower();
    };

    // Global handler for live event navigation
    window.openLiveEvent = async (id, type = 'americana') => {
        if (window.EventsController) {
            return await window.EventsController.openLiveEvent(id, type);
        } else {
            console.error("❌ EventsController not initialized");
        }
    };

    // Global handler for TV Mode
    window.openTVMode = (id, type) => {
        if (window.TVView) {
            window.TVView.load(id, type);
        } else {
            console.error("❌ TVView not loaded");
        }
    };

    // Global handlers for Cartel / Poster Lightbox Modal
    window.openPosterModal = (imageUrl, eventName, clubName) => {
        if (window.EventsController && window.EventsController.openPosterModal) {
            window.EventsController.openPosterModal(imageUrl, eventName, clubName);
        } else {
            console.warn("⚠️ EventsController not ready for openPosterModal");
        }
    };
    window.closePosterModal = () => {
        if (window.EventsController && window.EventsController.closePosterModal) {
            window.EventsController.closePosterModal();
        }
    };

    // Global handlers for Description / Info Modal
    window.openDescriptionModal = (id, type) => {
        if (window.EventsController && window.EventsController.openDescriptionModal) {
            window.EventsController.openDescriptionModal(id, type);
        } else {
            console.warn("⚠️ EventsController not ready for openDescriptionModal");
        }
    };
    window.closeDescriptionModal = () => {
        if (window.EventsController && window.EventsController.closeDescriptionModal) {
            window.EventsController.closeDescriptionModal();
        }
    };

    // Global handlers for View Modes & Card Expansion
    window.setViewMode = (mode) => {
        if (window.EventsController && window.EventsController.setViewMode) {
            window.EventsController.setViewMode(mode);
        }
    };
    window.toggleCardExpansion = (evtId, e) => {
        if (window.EventsController && window.EventsController.toggleCardExpansion) {
            window.EventsController.toggleCardExpansion(evtId, e);
        }
    };
    window.toggleAllCardsExpansion = (expandAll) => {
        if (window.EventsController && window.EventsController.toggleAllCardsExpansion) {
            window.EventsController.toggleAllCardsExpansion(expandAll);
        }
    };

    class EventsController {
        constructor() {
            this.state = {
                activeTab: 'events',
                americanas: [],
                entrenos: [],
                users: [],
                personalMatches: [],
                loading: true,
                viewInitialized: false,
                bgInitialized: false,
                loadingResults: false,
                currentUser: null,
                playerCache: {},
                filters: {
                    month: 'all',
                    category: 'all',
                    status: 'all',
                    searchQuery: ''
                },
                viewMode: (() => {
                    try { return localStorage.getItem('sp_events_view_mode') || 'compact'; } catch(e) { return 'compact'; }
                })(),
                expandedCards: new Set(),
                collapsedCards: new Set(),
                eventTabs: {},
                matchCache: {}, // { eventId: { matches: [], lastFetch: timestamp } }
                pendingDeepLinkTarget: null
            };
            this.unsubscribeEvents = null;
            this.unsubscribeEntrenos = null;
            this.unsubscribeUsers = null;
            this.autoStartInterval = null;
            this._onDataUpdateDebounce = null;
            this._personalMatchesDebounce = null;
            this._pollingInterval = null;
            this._isRefreshing = false;
            this._currentInscritosEventId = null;
            this._currentInscritosType = null;
            this._visibilityBound = false;
            this._forceFullRender = false;
            this._deepLinkInterval = null;
            this._isResolvingDeepLink = false;
            this._handledDeepLinkTarget = null;

            // AUTO-INIT: Start Background Services Immediately
            this.startBackgroundService();
        }

        /**
         * Cleans up all active Firebase listeners and intervals.
         * Crucial for preventing memory leaks.
         */
        destroy() {
            console.log("🧹 [EventsController] Cleaning up listeners...");
            if (this.unsubscribeEvents) this.unsubscribeEvents();
            if (this.unsubscribeEntrenos) this.unsubscribeEntrenos();
            if (this.unsubscribeUsers) this.unsubscribeUsers();
            if (this.unsubscribeMatchesA) this.unsubscribeMatchesA();
            if (this.unsubscribeMatchesB) this.unsubscribeMatchesB();
            if (this.unsubscribeEntrenosA) this.unsubscribeEntrenosA();
            if (this.unsubscribeEntrenosB) this.unsubscribeEntrenosB();
            if (this.autoStartInterval) clearInterval(this.autoStartInterval);
            if (this._onDataUpdateDebounce) clearTimeout(this._onDataUpdateDebounce);
            if (this._personalMatchesDebounce) clearTimeout(this._personalMatchesDebounce);
            if (this._deepLinkInterval) clearInterval(this._deepLinkInterval);

            this.stopAutoRefreshPolling();

            if (window.GeoService) window.GeoService.stopTracking();
            window.removeEventListener('geo_update', this._onGeoUpdate);

            if (window.OpenMatchesController) {
                window.OpenMatchesController.destroy();
            }

            this.state.bgInitialized = false;
        }

        isCurrentRouteActive() {
            if (!window.Router || !window.Router.currentRoute) return true;
            const eventsRoutes = [
                'events', 'americanas', 'finished_americanas', 'agenda_americanas',
                'help_americanas', 'finished', 'agenda', 'results', 'entrenos', 'partidas_abiertas'
            ];
            return eventsRoutes.includes(window.Router.currentRoute);
        }

        onDataUpdate() {
            // Check if we have received at least one update for each main collection
            if (this.state.americanas && this.state.entrenos) {
                this.state.loading = false;
                if (this.state.pendingDeepLinkTarget) {
                    this._resolveDeepLinkTarget();
                }
                if (this.state.viewInitialized && this.isCurrentRouteActive()) {
                    if (this._onDataUpdateDebounce) clearTimeout(this._onDataUpdateDebounce);
                    this._onDataUpdateDebounce = setTimeout(() => {
                        if (this.isCurrentRouteActive()) {
                            this.render();
                        }
                    }, 50); // 50ms batch window
                }
            }
        }

        startBackgroundService() {
            if (this.state.bgInitialized) return;
            if (!window.db || typeof window.db.collection !== 'function') {
                console.warn("⏳ [EventsController] window.db no listo aún. Reintentando suscripción en 300ms...");
                setTimeout(() => this.startBackgroundService(), 300);
                return;
            }
            console.log("🤖 [EventsController] Starting Background Automation Service (Real-time Firestore Listeners)...");
            this.state.bgInitialized = true;

            // 1. Data Listeners - Use robust query with logging
            try {
                this.unsubscribeEvents = window.db.collection('americanas')
                    .onSnapshot(snap => {
                        this.state.americanas = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                        console.log(`📡 [EventsController] Real-time Americanas update: ${this.state.americanas.length} events`);
                        this.onDataUpdate();
                    }, err => console.error("Error loading americanas:", err));

                this.unsubscribeEntrenos = window.db.collection('entrenos')
                    .onSnapshot(snap => {
                        this.state.entrenos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                        console.log(`📡 [EventsController] Real-time Entrenos update: ${this.state.entrenos.length} events`);
                        this.onDataUpdate();
                    }, err => console.error("Error loading entrenos:", err));
            } catch (listenErr) {
                console.error("❌ [EventsController] Error iniciando listeners Firestore:", listenErr);
                this.state.bgInitialized = false;
            }

            // 2. Automation Loop (Check every 120s to save quota)
            if (this.autoStartInterval) clearInterval(this.autoStartInterval);
            this.autoStartInterval = setInterval(() => {
                this.checkAutoStartEvents();
                if (window.AmericanaService?.processWaitlistTimeouts) {
                    window.AmericanaService.processWaitlistTimeouts();
                }
            }, 120000); // 2 minutes (optimized for quota)
        }

        init() {
            // Asegurar que el servicio de datos y el auto-refresh en segundo plano estén corriendo
            this.startBackgroundService();
            if (this.state.activeTab === 'events' || this.state.activeTab === 'entrenos') {
                this.startAutoRefreshPolling();
            }

            // Refresco al recuperar el foco de la app/pestaña
            if (!this._visibilityBound) {
                this._visibilityBound = true;
                document.addEventListener('visibilitychange', () => {
                    if (document.visibilityState === 'visible') {
                        if (this.isCurrentRouteActive() && this.state.viewInitialized && (this.state.activeTab === 'events' || this.state.activeTab === 'entrenos')) {
                            console.log("👁️ [EventsController] App en primer plano: refresco automático");
                            this.refreshInstantly(null, true);
                        }
                    }
                });
            }

            if (this.state.viewInitialized) {
                this.render();
                return;
            }
            this.state.viewInitialized = true;
            console.log("🎟️ [EventsController_V6] UI Initialized.");

            this.state.currentUser = window.Store ? window.Store.getState('currentUser') : null;

            this.render();
        }

        setFilter(type, value) {
            try { window.PlayerView?.haptic?.(15); } catch (e) {}
            if (!this.state.filters) {
                this.state.filters = { month: 'all', category: 'all', status: 'all', searchQuery: '' };
            }
            if (this.state.filters[type] === value) {
                // Si el usuario toca el filtro ya activo (que no sea 'all' ni 'searchQuery'), lo deselecciona alternando a 'all'
                if (type !== 'searchQuery' && value !== 'all') {
                    this.state.filters[type] = 'all';
                    this._forceFullRender = true;
                    this.render();
                    return;
                }
                return;
            }
            this.state.filters[type] = value;
            this._forceFullRender = true;
            this.render();
        }

        resetFilters() {
            try { window.PlayerView?.haptic?.(20); } catch (e) {}
            this.state.filters = { month: 'all', category: 'all', status: 'all', searchQuery: '' };
            this._forceFullRender = true;
            this.render();
        }

        hasActiveFilters() {
            const f = this.state.filters;
            if (!f) return false;
            return (f.month && f.month !== 'all') || 
                   (f.category && f.category !== 'all') || 
                   (f.status && f.status !== 'all') ||
                   (f.searchQuery && f.searchQuery.trim() !== '');
        }

        getAvailableMonths(events) {
            const months = new Set();
            (events || []).forEach(e => {
                if (!e.normDate || e.normDate === '9999-99-99') return;
                const [y, m] = e.normDate.split('-');
                if (y && m) months.add(`${y}-${m}`);
            });
            return Array.from(months).sort();
        }

        renderFilterBar(events) {
            const evList = events || [];
            const months = this.getAvailableMonths(evList);
            const currentMonth = this.state.filters.month || 'all';
            const currentCat = this.state.filters.category || 'all';
            const currentStatus = this.state.filters.status || 'all';
            const currentSearch = this.state.filters.searchQuery || '';
            const monthLabels = { '01': 'ENE', '02': 'FEB', '03': 'MAR', '04': 'ABR', '05': 'MAY', '06': 'JUN', '07': 'JUL', '08': 'AGO', '09': 'SEP', '10': 'OCT', '11': 'NOV', '12': 'DIC' };

            // Dynamic counts
            const totalCount = evList.length;
            const maleCount = evList.filter(e => this.getNormalizedCategory(e) === 'male').length;
            const femaleCount = evList.filter(e => this.getNormalizedCategory(e) === 'female').length;
            const mixedCount = evList.filter(e => this.getNormalizedCategory(e) === 'mixed').length;

            const liveCount = evList.filter(e => e.status === 'live').length;
            const availableCount = evList.filter(e => {
                const players = e.players || e.registeredPlayers || [];
                const maxCourts = parseInt(e.max_courts || e.courts || 4);
                return players.length < (maxCourts * 4);
            }).length;

            const isFiltered = this.hasActiveFilters();

            return `
                <div class="filters-container" style="padding: 10px 12px 18px; display: flex; flex-direction: column; gap: 10px; background: transparent;">
                    <!-- Live Search Bar -->
                    <div style="position: relative; width: 100%;">
                        <i class="fas fa-search" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #64748b; font-size: 0.8rem;"></i>
                        <input type="text" 
                               id="events-live-search-input"
                               placeholder="Buscar por sede, formato o nivel (ej: Prat, Twister, 3.5)..." 
                               value="${currentSearch.replace(/"/g, '&quot;')}"
                               oninput="window.EventsController.setFilter('searchQuery', this.value)"
                               style="width: 100%; box-sizing: border-box; background: rgba(255,255,255,0.04); border: 1.5px solid ${currentSearch ? '#CCFF00' : 'rgba(255,255,255,0.08)'}; border-radius: 14px; padding: 9px 36px 9px 38px; color: #ffffff; font-size: 0.74rem; font-weight: 800; font-family: 'Outfit', sans-serif; outline: none; transition: border-color 0.2s; box-shadow: 0 2px 8px rgba(0,0,0,0.25);"
                               onfocus="this.style.borderColor='#CCFF00';"
                               onblur="if(!this.value) this.style.borderColor='rgba(255,255,255,0.08)';">
                        ${currentSearch ? `
                            <button onclick="window.EventsController.setFilter('searchQuery', '')" 
                                    title="Borrar búsqueda"
                                    style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: transparent; border: none; color: #94a3b8; cursor: pointer; font-size: 0.85rem; padding: 4px; display: flex; align-items: center;">
                                <i class="fas fa-times-circle"></i>
                            </button>
                        ` : ''}
                    </div>

                    <!-- View Mode Toggle & Reset Chips -->
                    <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 2px;">
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <span style="font-size: 0.64rem; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.6px;">
                                <i class="fas fa-layer-group" style="color: #CCFF00; font-size: 0.65rem; margin-right: 3px;"></i> Vista:
                            </span>
                            <div style="background: rgba(255, 255, 255, 0.05); border: 1.5px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 2px; display: inline-flex; gap: 3px;">
                                <button type="button" 
                                        onclick="window.EventsController.setViewMode('detailed')" 
                                        title="Vista Completa (Con cartel, fotos y detalles)"
                                        style="padding: 5px 12px; border-radius: 9px; border: none; font-weight: 950; font-size: 0.66rem; cursor: pointer; transition: all 0.2s ease; display: inline-flex; align-items: center; gap: 5px; text-transform: uppercase; ${this.state.viewMode === 'detailed' ? 'background: #CCFF00; color: #000; box-shadow: 0 2px 8px rgba(204,255,0,0.35);' : 'background: transparent; color: #94a3b8;'}">
                                    <i class="fas fa-th-large"></i> Completa
                                </button>
                                <button type="button" 
                                        onclick="window.EventsController.setViewMode('compact')" 
                                        title="Vista Minimizada (Ideal cuando hay muchos eventos)"
                                        style="padding: 5px 12px; border-radius: 9px; border: none; font-weight: 950; font-size: 0.66rem; cursor: pointer; transition: all 0.2s ease; display: inline-flex; align-items: center; gap: 5px; text-transform: uppercase; ${this.state.viewMode === 'compact' ? 'background: #CCFF00; color: #000; box-shadow: 0 2px 8px rgba(204,255,0,0.35);' : 'background: transparent; color: #94a3b8;'}">
                                    <i class="fas fa-bars"></i> Minimizada
                                </button>
                            </div>
                        </div>

                        <div style="display: flex; align-items: center; gap: 6px;">
                            ${isFiltered ? `
                                <button type="button"
                                        onclick="window.EventsController.resetFilters()"
                                        title="Quitar todos los filtros"
                                        style="background: rgba(204, 255, 0, 0.12); border: 1px solid rgba(204, 255, 0, 0.4); color: #CCFF00; padding: 5px 10px; border-radius: 9px; font-size: 0.62rem; font-weight: 900; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; transition: all 0.15s;">
                                    <i class="fas fa-rotate-left"></i>
                                    <span>LIMPIAR</span>
                                </button>
                            ` : ''}

                            <!-- Quick Action: Ampliar / Minimizar Todo -->
                            <button type="button" 
                                    onclick="window.EventsController.toggleAllCardsExpansion(${this.state.viewMode === 'compact'})" 
                                    title="${this.state.viewMode === 'compact' ? 'Ampliar todas las tarjetas' : 'Minimizar todas las tarjetas'}"
                                    style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.12); color: #cbd5e1; padding: 5px 10px; border-radius: 9px; font-size: 0.62rem; font-weight: 850; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; transition: all 0.15s;"
                                    onmouseover="this.style.color='#CCFF00'; this.style.borderColor='rgba(204,255,0,0.4)';"
                                    onmouseout="this.style.color='#cbd5e1'; this.style.borderColor='rgba(255,255,255,0.12)';">
                                <i class="fas ${this.state.viewMode === 'compact' ? 'fa-expand-alt' : 'fa-compress-alt'}"></i>
                                <span>${this.state.viewMode === 'compact' ? 'Ampliar' : 'Minimizar'}</span>
                            </button>
                        </div>
                    </div>

                    <!-- Status Filters (Activos, Plazas, En Directo) -->
                    <div style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 2px; -webkit-overflow-scrolling: touch; scrollbar-width: none;">
                        <button onclick="window.EventsController.setFilter('status', 'all')" 
                                style="white-space: nowrap; padding: 6px 14px; border-radius: 12px; font-size: 0.66rem; font-weight: 900; border: 1.5px solid ${currentStatus === 'all' ? '#CCFF00' : 'rgba(255,255,255,0.08)'}; cursor: pointer; transition: all 0.2s; 
                                ${currentStatus === 'all' ? 'background: #CCFF00; color: #000; box-shadow: 0 0 10px rgba(204,255,0,0.3);' : 'background: rgba(255,255,255,0.04); color: #94a3b8;'}">
                            <i class="fas fa-layer-group" style="font-size: 0.6rem; margin-right: 4px;"></i>TODOS (${totalCount})
                        </button>
                        <button onclick="window.EventsController.setFilter('status', 'available')" 
                                style="white-space: nowrap; padding: 6px 14px; border-radius: 12px; font-size: 0.66rem; font-weight: 900; border: 1.5px solid ${currentStatus === 'available' ? '#22c55e' : 'rgba(255,255,255,0.08)'}; cursor: pointer; transition: all 0.2s; 
                                ${currentStatus === 'available' ? 'background: #22c55e; color: #000; box-shadow: 0 0 10px rgba(34,197,94,0.35);' : 'background: rgba(255,255,255,0.04); color: #94a3b8;'}">
                            <i class="fas fa-user-plus" style="font-size: 0.6rem; margin-right: 4px;"></i>CON PLAZAS (${availableCount})
                        </button>
                        ${liveCount > 0 ? `
                            <button onclick="window.EventsController.setFilter('status', 'live')" 
                                    style="white-space: nowrap; padding: 6px 14px; border-radius: 12px; font-size: 0.66rem; font-weight: 900; border: 1.5px solid ${currentStatus === 'live' ? '#ef4444' : 'rgba(255,255,255,0.08)'}; cursor: pointer; transition: all 0.2s; 
                                    ${currentStatus === 'live' ? 'background: #ef4444; color: #fff; box-shadow: 0 0 10px rgba(239,68,68,0.4);' : 'background: rgba(255,255,255,0.04); color: #94a3b8;'}">
                                <i class="fas fa-broadcast-tower" style="font-size: 0.6rem; margin-right: 4px; animation: pulse 1.5s infinite;"></i>EN JUEGO (${liveCount})
                            </button>
                        ` : ''}
                    </div>

                    <!-- Month Filters -->
                    <div style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 2px; -webkit-overflow-scrolling: touch; scrollbar-width: none;">
                        <button onclick="window.EventsController.setFilter('month', 'all')" 
                                style="white-space: nowrap; padding: 7px 16px; border-radius: 12px; font-size: 0.68rem; font-weight: 900; border: 1.5px solid ${currentMonth === 'all' ? '#CCFF00' : 'rgba(255,255,255,0.08)'}; cursor: pointer; transition: all 0.2s; 
                                ${currentMonth === 'all' ? 'background: #CCFF00; color: #000; box-shadow: 0 0 12px rgba(204,255,0,0.3);' : 'background: rgba(255,255,255,0.04); color: #94a3b8;'}">TODO</button>
                        ${months.map(m => {
                            const [year, month] = m.split('-');
                            const label = `${monthLabels[month] || month} '${year.slice(2)}`;
                            const countInMonth = evList.filter(e => e.normDate && e.normDate.startsWith(m)).length;
                            const isActive = currentMonth === m;
                            return `<button onclick="window.EventsController.setFilter('month', '${m}')" style="white-space: nowrap; padding: 7px 16px; border-radius: 12px; font-size: 0.68rem; font-weight: 900; border: 1.5px solid ${isActive ? '#CCFF00' : 'rgba(255,255,255,0.08)'}; cursor: pointer; transition: all 0.2s; ${isActive ? 'background: #CCFF00; color: #000; box-shadow: 0 0 12px rgba(204,255,0,0.3);' : 'background: rgba(255,255,255,0.04); color: #94a3b8;'}">${label} (${countInMonth})</button>`;
                        }).join('')}
                    </div>

                    <!-- Category Filters -->
                    <div style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; -webkit-overflow-scrolling: touch; scrollbar-width: none;">
                        <button onclick="window.EventsController.setFilter('category', 'all')" style="white-space: nowrap; padding: 7px 16px; border-radius: 12px; font-size: 0.68rem; font-weight: 900; border: 1.5px solid ${currentCat === 'all' ? '#CCFF00' : 'rgba(255,255,255,0.08)'}; cursor: pointer; transition: all 0.2s; ${currentCat === 'all' ? 'background: #CCFF00; color: #000; box-shadow: 0 0 12px rgba(204,255,0,0.3);' : 'background: rgba(255,255,255,0.04); color: #94a3b8;'}">TODAS (${totalCount})</button>
                        <button onclick="window.EventsController.setFilter('category', 'male')" style="white-space: nowrap; padding: 7px 16px; border-radius: 12px; font-size: 0.68rem; font-weight: 900; border: 1.5px solid ${currentCat === 'male' ? '#0ea5e9' : 'rgba(255,255,255,0.08)'}; cursor: pointer; transition: all 0.2s; ${currentCat === 'male' ? 'background: #0ea5e9; color: #fff; box-shadow: 0 0 12px rgba(14,165,233,0.35);' : 'background: rgba(255,255,255,0.04); color: #94a3b8;'}">MASCULINO (${maleCount})</button>
                        <button onclick="window.EventsController.setFilter('category', 'female')" style="white-space: nowrap; padding: 7px 16px; border-radius: 12px; font-size: 0.68rem; font-weight: 900; border: 1.5px solid ${currentCat === 'female' ? '#ec4899' : 'rgba(255,255,255,0.08)'}; cursor: pointer; transition: all 0.2s; ${currentCat === 'female' ? 'background: #ec4899; color: #fff; box-shadow: 0 0 12px rgba(236,72,153,0.35);' : 'background: rgba(255,255,255,0.04); color: #94a3b8;'}">FEMENINO (${femaleCount})</button>
                        <button onclick="window.EventsController.setFilter('category', 'mixed')" style="white-space: nowrap; padding: 7px 16px; border-radius: 12px; font-size: 0.68rem; font-weight: 900; border: 1.5px solid ${currentCat === 'mixed' ? '#eab308' : 'rgba(255,255,255,0.08)'}; cursor: pointer; transition: all 0.2s; ${currentCat === 'mixed' ? 'background: #eab308; color: #000; box-shadow: 0 0 12px rgba(234,179,8,0.35);' : 'background: rgba(255,255,255,0.04); color: #94a3b8;'}">MIXTA (${mixedCount})</button>
                    </div>
                </div>
            `;
        }

        setViewMode(mode) {
            try { window.PlayerView?.haptic?.(20); } catch (e) {}
            this.state.viewMode = mode;
            try { localStorage.setItem('sp_events_view_mode', mode); } catch (e) {}
            if (this.state.expandedCards) this.state.expandedCards.clear();
            if (this.state.collapsedCards) this.state.collapsedCards.clear();
            this.render();
        }

        toggleCardExpansion(evtId, event) {
            if (event) {
                event.stopPropagation();
            }
            try { window.PlayerView?.haptic?.(15); } catch (e) {}
            if (!this.state.expandedCards) this.state.expandedCards = new Set();
            if (!this.state.collapsedCards) this.state.collapsedCards = new Set();

            const isCurrentlyExpanded = this.isCardExpanded(evtId);
            if (this.state.viewMode === 'compact') {
                if (isCurrentlyExpanded) {
                    this.state.expandedCards.delete(evtId);
                } else {
                    this.state.expandedCards.add(evtId);
                }
            } else {
                if (isCurrentlyExpanded) {
                    this.state.collapsedCards.add(evtId);
                } else {
                    this.state.collapsedCards.delete(evtId);
                }
            }

            // Quick in-place update if card DOM is present
            const cardEl = document.getElementById(`event-card-${evtId}`);
            if (cardEl) {
                const allSorted = this.getAllSortedEvents();
                const evt = allSorted.find(e => e.id === evtId);
                if (evt) {
                    const temp = document.createElement('div');
                    temp.innerHTML = this.renderCard(evt, evt.status === 'finished');
                    const newEl = temp.firstElementChild;
                    if (newEl) {
                        cardEl.replaceWith(newEl);
                        return;
                    }
                }
            }
            this.render();
        }

        toggleAllCardsExpansion(expandAll) {
            try { window.PlayerView?.haptic?.(25); } catch (e) {}
            if (!this.state.expandedCards) this.state.expandedCards = new Set();
            if (!this.state.collapsedCards) this.state.collapsedCards = new Set();

            if (expandAll) {
                this.state.viewMode = 'detailed';
                this.state.collapsedCards.clear();
            } else {
                this.state.viewMode = 'compact';
                this.state.expandedCards.clear();
            }
            try { localStorage.setItem('sp_events_view_mode', this.state.viewMode); } catch (e) {}
            this.render();
        }

        isCardExpanded(evtId) {
            if (this.state.viewMode === 'compact') {
                return this.state.expandedCards ? this.state.expandedCards.has(evtId) : false;
            } else {
                return this.state.collapsedCards ? !this.state.collapsedCards.has(evtId) : true;
            }
        }

        getNormalizedCategory(evt) {
            const rawCat = (evt?.category || evt?.categoria || '').toLowerCase().trim();
            const rawGender = (evt?.gender || evt?.gender_type || evt?.sex || '').toLowerCase().trim();
            const rawName = (evt?.name || evt?.title || '').toLowerCase().trim();
            const combined = `${rawCat} ${rawGender} ${rawName}`;

            if (
                ['female', 'femenina', 'femenino', 'chicas', 'mujeres', 'f'].includes(rawCat) ||
                ['female', 'femenina', 'femenino', 'chicas', 'mujeres', 'f'].includes(rawGender) ||
                combined.includes('femenin') ||
                combined.includes('chicas') ||
                combined.includes('mujeres') ||
                rawCat.includes('fem') ||
                rawGender.includes('fem')
            ) {
                return 'female';
            }
            if (
                ['mixed', 'mixto', 'mixta', 'mix'].includes(rawCat) ||
                ['mixed', 'mixto', 'mixta', 'mix'].includes(rawGender) ||
                combined.includes('mixt') ||
                combined.includes('mix')
            ) {
                return 'mixed';
            }
            if (
                ['male', 'masculino', 'masculina', 'chicos', 'hombres', 'm'].includes(rawCat) ||
                ['male', 'masculino', 'masculina', 'chicos', 'hombres', 'm'].includes(rawGender) ||
                combined.includes('masculin') ||
                combined.includes('chicos') ||
                combined.includes('hombres') ||
                rawCat.includes('masc') ||
                rawGender.includes('masc')
            ) {
                return 'male';
            }
            if (rawCat === 'open' || rawCat === 'abierta' || rawCat === 'abierto' || combined.includes('open') || combined.includes('abiert')) {
                return 'open';
            }
            return 'male';
        }

        checkGenderEligibility(evt, user) {
            if (!user) {
                return { eligible: true, isChico: false, isChica: false, catType: 'open' };
            }

            const isAdmin = user.role === 'admin' || user.role === 'super_admin' || user.role === 'admin_player';
            const userGender = (user.gender || '').toLowerCase().trim();
            const isChico = ['m', 'chico', 'male', 'masculino', 'hombre', 'boy'].includes(userGender);
            const isChica = ['f', 'chica', 'female', 'femenina', 'femenino', 'mujer', 'girl'].includes(userGender);

            const catType = this.getNormalizedCategory(evt);

            if (isAdmin) {
                return { eligible: true, isChico, isChica, catType, isAdmin: true };
            }

            if (catType === 'male') {
                if (!isChico) {
                    return {
                        eligible: false,
                        mismatchCase: 'male',
                        title: '⛔ CATEGORÍA MASCULINA',
                        message: isChica
                            ? 'Este evento es exclusivo para chicos. Como chica, solo puedes jugar en categoría Femenina o Mixta.'
                            : 'Debes tener definido tu género (chico/chica) en tu perfil para apuntarte a este evento masculino.',
                        buttonLabel: 'SOLO CHICOS',
                        isChico, isChica, catType
                    };
                }
            } else if (catType === 'female') {
                if (!isChica) {
                    return {
                        eligible: false,
                        mismatchCase: 'female',
                        title: '⛔ CATEGORÍA FEMENINA',
                        message: isChico
                            ? 'Este evento es exclusivo para chicas. Como chico, solo puedes jugar en categoría Masculina o Mixta.'
                            : 'Debes tener definido tu género (chico/chica) en tu perfil para apuntarte a este evento femenino.',
                        buttonLabel: 'SOLO CHICAS',
                        isChico, isChica, catType
                    };
                }
            } else if (catType === 'mixed') {
                if (!isChico && !isChica) {
                    return {
                        eligible: false,
                        mismatchCase: 'mixed_no_gender',
                        title: '⚠️ GÉNERO NO DEFINIDO',
                        message: 'Por favor, define tu género en tu perfil antes de inscribirte a este evento mixto.',
                        buttonLabel: 'DEFINIR GÉNERO',
                        isChico, isChica, catType
                    };
                }
            }

            return { eligible: true, isChico, isChica, catType };
        }

        getTodayStr() {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }

        isEventFinished(evt) {
            if (!evt) return false;
            if (window.EventService && typeof window.EventService.isEventFinished === 'function') {
                return window.EventService.isEventFinished(evt);
            }
            const st = (evt.status || '').toLowerCase().trim();
            if (st === 'finished' || st === 'finalizado' || st === 'completed' || st === 'cancelled') return true;
            const times = this.getEventTimes(evt.date, evt.time, evt.time_end);
            if (!times) return false;
            const now = new Date();
            const todayStr = this.getTodayStr();
            return (times.normDate && times.normDate < todayStr) || (now >= times.end);
        }

        getAllSortedEvents() {
            const normalize = (d) => {
                if (window.EventService && typeof window.EventService.normalizeDate === 'function') {
                    return window.EventService.normalizeDate(d);
                }
                if (!d) return '9999-99-99';
                if (d.includes('/')) {
                    const parts = d.split('/').map(p => p.trim());
                    if (parts.length >= 2) {
                        const day = parts[0].padStart(2, '0');
                        const month = parts[1].padStart(2, '0');
                        const year = parts[2] ? (parts[2].length === 2 ? '20' + parts[2] : parts[2]) : String(new Date().getFullYear());
                        return `${year}-${month}-${day}`;
                    }
                }
                return d;
            };

            const all = [
                ...(this.state.americanas || []).map(e => ({ ...e, type: 'americana', normDate: normalize(e.date) })),
                ...(this.state.entrenos || []).map(e => ({ ...e, type: 'entreno', normDate: normalize(e.date) }))
            ];

            return all.sort((a, b) => {
                if (a.normDate === b.normDate) return (a.time || '').localeCompare(b.time || '');
                return (a.normDate || '').localeCompare(b.normDate || '');
            });
        }

        _parseDate(dateStr, timeStr, timeEndStr) {
            if (window.EventService && typeof window.EventService.getEventTimes === 'function') {
                return window.EventService.getEventTimes(dateStr, timeStr, timeEndStr);
            }
            if (!dateStr) return null;
            try {
                let dateBase = dateStr;
                if (dateStr.includes('/')) {
                    const parts = dateStr.split('/').map(p => p.trim());
                    if (parts.length >= 2) {
                        const d = parts[0].padStart(2, '0');
                        const m = parts[1].padStart(2, '0');
                        const y = parts[2] ? (parts[2].length === 2 ? '20' + parts[2] : parts[2]) : String(new Date().getFullYear());
                        dateBase = `${y}-${m}-${d}`;
                    }
                }

                const rawTime = (timeStr || '').split('-')[0].replace(/[^\d:]/g, '').trim() || '10:00';
                const start = new Date(`${dateBase}T${rawTime.includes(':') ? rawTime : rawTime + ':00'}:00`);

                let end;
                if (timeEndStr) {
                    const rawEnd = timeEndStr.replace(/[^\d:]/g, '').trim();
                    end = new Date(`${dateBase}T${rawEnd.includes(':') ? rawEnd : rawEnd + ':00'}:00`);
                } else if (timeStr && timeStr.includes('-')) {
                    const rawEnd = timeStr.split('-')[1].replace(/[^\d:]/g, '').trim();
                    end = new Date(`${dateBase}T${rawEnd.includes(':') ? rawEnd : rawEnd + ':00'}:00`);
                } else {
                    end = new Date(start.getTime() + 105 * 60000);
                }

                return { start, end, normDate: dateBase };
            } catch (e) {
                console.error("Error parsing date:", dateStr, timeStr, e);
                return null;
            }
        }

        hasEventStarted(dateStr, timeStr, timeEndStr) {
            const times = this._parseDate(dateStr, timeStr, timeEndStr);
            return times ? new Date() >= times.start : false;
        }

        getEventTimes(dateStr, timeStr, timeEndStr) {
            return this._parseDate(dateStr, timeStr, timeEndStr);
        }

        formatEventTime(evt) {
            if (!evt) return '10:00';
            const rawTime = (evt.time || '').trim();
            const rawTimeEnd = (evt.time_end || evt.timeEnd || '').trim();

            if (rawTime.includes('-')) {
                return rawTime;
            }
            if (rawTime.toLowerCase().includes(' a ')) {
                const parts = rawTime.toLowerCase().split(' a ').map(s => s.trim());
                return parts.length >= 2 ? `${parts[0]} - ${parts[1]}` : rawTime;
            }
            if (rawTime && rawTimeEnd) {
                return `${rawTime} - ${rawTimeEnd}`;
            }
            if (rawTime) {
                const times = this.getEventTimes(evt.date, rawTime, rawTimeEnd);
                if (times && times.end) {
                    const pad = n => String(n).padStart(2, '0');
                    return `${rawTime} - ${pad(times.end.getHours())}:${pad(times.end.getMinutes())}`;
                }
                return rawTime;
            }
            return '10:00';
        }

        checkAutoStartEvents() {
            if (!this.state.americanas || !this.state.entrenos) return;
            const allEvents = [
                ...this.state.americanas.map(e => ({ ...e, type: 'americana' })),
                ...this.state.entrenos.map(e => ({ ...e, type: 'entreno' }))
            ];

            const now = new Date();
            const todayStr = this.getTodayStr();

            allEvents.forEach(evt => {
                const times = this.getEventTimes(evt.date, evt.time, evt.time_end);
                if (!times) return;

                const players = evt.players || evt.registeredPlayers || [];
                const defaultCourts = evt.name && evt.name.toUpperCase().includes('TWISTER') ? 3 : 4;
                const maxCourts = parseInt(evt.max_courts || evt.courts || defaultCourts);
                const requiredPlayers = maxCourts * 4;
                const isFull = players.length >= requiredPlayers;

                // 1. OPEN -> PAIRING (3h antes si está lleno)
                if (evt.status === 'open' && isFull) {
                    const diffMs = times.start - now;
                    const diffHours = diffMs / (1000 * 60 * 60);

                    if (diffHours <= 3 && diffHours > 0) {
                        console.log(`⏰ [AutoAutomation] OPEN -> PAIRING (3h trigger): ${evt.name}`);
                        if (window.EventService && window.AmericanaService) {
                            window.EventService.updateEvent(evt.type, evt.id, { status: 'pairing' })
                                .then(() => window.AmericanaService.generateFirstRoundMatches(evt.id, evt.type))
                                .catch(e => console.error(e));
                        }
                    }
                }

                // 2. OPEN/PAIRING -> LIVE (a la hora de inicio si está lleno)
                if (evt.status === 'open' || evt.status === 'pairing') {
                    if (now >= times.start && now < times.end) {
                        if (isFull) {
                            console.log(`⏰ [AutoAutomation] ${evt.status.toUpperCase()} -> LIVE: ${evt.name}`);
                            if (window.EventService && window.AmericanaService) {
                                window.EventService.updateEvent(evt.type, evt.id, { status: 'live' })
                                    .then(() => window.AmericanaService.generateFirstRoundMatches(evt.id, evt.type))
                                    .catch(e => console.error(e));
                            }
                        }
                    }
                }

                // 3. CUALQUIER ESTADO ACTIVO (live, open, pairing) -> FINISHED si ya concluyó su horario o fecha
                const isExpired = (now >= times.end) || (times.normDate && times.normDate < todayStr);
                if (isExpired && evt.status !== 'finished' && evt.status !== 'cancelled') {
                    console.log(`🏁 [AutoAutomation] ${evt.status.toUpperCase()} -> FINISHED (horario/fecha superada): ${evt.name}`);
                    evt.status = 'finished'; // Actualizar de inmediato en memoria
                    if (window.EventService) {
                        window.EventService.updateEvent(evt.type, evt.id, { status: 'finished' })
                            .then(() => {
                                // Trigger captain analysis para entrenos
                                if (evt.type === 'entreno' && window.CaptainView) {
                                    console.log(`🤖 [Captain] Auto-launching post-event analysis for: ${evt.name}`);
                                    setTimeout(() => {
                                        window.CaptainView.open(evt);
                                    }, 2000);
                                }
                            })
                            .catch(e => console.error(e));
                    }
                }
            });
        }

        async setTab(tabName) {
            console.log("🎯 [EventsController_V6] setTab called with:", tabName);
            this.state.activeTab = tabName;
            this._forceFullRender = true;

            if (window.navigator && window.navigator.vibrate) {
                window.navigator.vibrate(15);
            }

            if (['events', 'agenda_americanas', 'help_americanas', 'finished_americanas'].includes(tabName)) {
                this.state.lastSubnavContext = 'americanas';
            } else if (['entrenos', 'agenda', 'help', 'finished'].includes(tabName)) {
                this.state.lastSubnavContext = 'entrenos';
            }

            const isAmericanasSection = ['events', 'agenda_americanas', 'help_americanas', 'finished_americanas'].includes(tabName) || (tabName === 'meteo' && this.state.lastSubnavContext !== 'entrenos');
            if (isAmericanasSection && window.SubnavManager) {
                window.SubnavManager.renderAmericanas(tabName);
            }
            const isEntrenosSection = ['entrenos', 'agenda', 'help', 'finished'].includes(tabName) || (tabName === 'meteo' && this.state.lastSubnavContext === 'entrenos');
            if (isEntrenosSection && window.SubnavManager) {
                window.SubnavManager.renderCommunity('entrenos');
            }

            // Gestionar polling en segundo plano según la pestaña
            if (tabName === 'events' || tabName === 'entrenos') {
                this.startAutoRefreshPolling();
            } else {
                this.stopAutoRefreshPolling();
            }
            if (tabName === 'results' && this.state.currentUser) {
                if (this.state.resultsInitialized) {
                    // Already initialized and listening. Just render.
                    await this.render();
                } else {
                    this.state.loadingResults = true;
                    this.state.resultsInitialized = true;
                    await this.render();

                    if (window.currentUser) {
                        this.state.currentUser = window.currentUser;
                    }
                    const uid = this.state.currentUser ? this.state.currentUser.uid : null;
                    if (!uid) return;

                    const updatePersonalMatches = () => {
                        const all = [
                            ...(this.state.rawMatchesA || []),
                            ...(this.state.rawMatchesB || []),
                            ...(this.state.rawEntrenosA || []),
                            ...(this.state.rawEntrenosB || [])
                        ].filter(m => m.status === 'finished');

                        const unique = [];
                        const seen = new Set();
                        all.forEach(m => {
                            if (!seen.has(m.id)) {
                                seen.add(m.id);
                                unique.push(m);
                            }
                        });

                        this.state.personalMatches = unique.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                        this.state.loadingResults = false;
                        
                        if (this._personalMatchesDebounce) clearTimeout(this._personalMatchesDebounce);
                        this._personalMatchesDebounce = setTimeout(() => {
                            this.render();
                        }, 50); // 50ms batch window
                    };

                    this.unsubscribeMatchesA = window.db.collection('matches').where('team_a_ids', 'array-contains', uid).onSnapshot(snap => {
                        this.state.rawMatchesA = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        updatePersonalMatches();
                    });
                    this.unsubscribeMatchesB = window.db.collection('matches').where('team_b_ids', 'array-contains', uid).onSnapshot(snap => {
                        this.state.rawMatchesB = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        updatePersonalMatches();
                    });
                    this.unsubscribeEntrenosA = window.db.collection('entrenos_matches').where('team_a_ids', 'array-contains', uid).onSnapshot(snap => {
                        this.state.rawEntrenosA = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        updatePersonalMatches();
                    });
                    this.unsubscribeEntrenosB = window.db.collection('entrenos_matches').where('team_b_ids', 'array-contains', uid).onSnapshot(snap => {
                        this.state.rawEntrenosB = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        updatePersonalMatches();
                    });
                }
            } else {
                await this.render();
            }
        }

        async setEventTab(eventId, tab) {
            console.log(` [EventsController] Changing sub-tab for ${eventId} to ${tab}`);
            this.state.eventTabs[eventId] = tab;
            
            // Si es Rank o Draws, cargar partidos si no están en caché
            if ((tab === 'rank' || tab === 'draws') && !this.state.matchCache[eventId]) {
                await this.loadEventMatches(eventId);
            }
            
            this.render();
        }

        async loadEventMatches(eventId) {
            console.log(`📡 [EventsController] Loading matches for event: ${eventId}`);
            try {
                // Buscar tipo de evento
                const all = this.getAllSortedEvents();
                const evt = all.find(e => e.id === eventId);
                const type = evt ? evt.type : 'americana';
                const coll = type === 'entreno' ? 'entrenos_matches' : 'matches';

                const snap = await window.db.collection(coll).where('americanaId', '==', eventId).get();
                const matches = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                
                this.state.matchCache[eventId] = {
                    matches: matches,
                    lastFetch: Date.now()
                };
                console.log(`✅ Loaded ${matches.length} matches for ${eventId}`);
            } catch (e) {
                console.error("Error loading event matches:", e);
                this.state.matchCache[eventId] = { matches: [], lastFetch: Date.now() };
            }
        }


        async loadGeoRadarWidget() {
            try {
                const geoRoot = document.getElementById('geo-radar-root');
                if (geoRoot && window.GeoRadarWidget) {
                    // Initial render (empty/waiting)
                    geoRoot.innerHTML = window.GeoRadarWidget.render({ proximity: { distance: 0, nearHq: false } });

                    // Listen for updates from GeoService
                    window.removeEventListener('geo_update', this._onGeoUpdate);
                    this._onGeoUpdate = (e) => {
                        if (geoRoot) geoRoot.innerHTML = window.GeoRadarWidget.render(e.detail);
                    };
                    window.addEventListener('geo_update', this._onGeoUpdate);

                    // Start Service if not tracking
                    if (window.GeoService) window.GeoService.startTracking();
                }
            } catch (e) {
                console.error("❌ GeoRadar render failed:", e);
            }
        }

        async loadEvents() {
            // Background service manages real-time updates now.
            // We just ensure we have data or show loader if empty.
            if (this.state.entrenos.length === 0 && this.state.americanas.length === 0) {
                this.showLoader();
            } else {
                this.state.loading = false;
                this.render();
            }
        }

        async render() {
            if (!this.isCurrentRouteActive()) {
                console.log(`🛡️ [EventsController] Bloqueando render: la ruta activa es '${window.Router?.currentRoute}', no pertenece a Americanas/Entrenos.`);
                return;
            }
            const container = document.getElementById('content-area');
            if (!container) return;

            // --- ZERO-LATENCY SMART PATCHING (Audit Point 1) ---
            const currentTab = this.state.activeTab;
            const shouldForce = this._forceFullRender;
            this._forceFullRender = false;

            if (!shouldForce && !this.hasActiveFilters() && !this.state.loading && (currentTab === 'events' || currentTab === 'entrenos')) {
                const todayStr = this.getTodayStr();
                const events = this.getAllSortedEvents().filter(e => {
                    const isCorrectType = (currentTab === 'entrenos' ? e.type === 'entreno' : e.type === 'americana');
                    if (this.isEventFinished(e)) return false;
                    return isCorrectType;
                });

                // Check if we already have the grid rendered
                if (events.length > 0 && document.getElementById(`event-card-${events[0]?.id}`)) {
                    if (this.smartUpdate(events)) {
                        console.log("⚡ [EventsController] Zero-Latency Update Applied.");
                        return; // Successfully updated DOM without full re-render
                    }
                }
            }

            const isAmericanasSection = ['events', 'agenda_americanas', 'help_americanas', 'finished_americanas'].includes(this.state.activeTab) || (this.state.activeTab === 'meteo' && this.state.lastSubnavContext !== 'entrenos');

            const tabs = isAmericanasSection ? [
                { id: 'events', label: 'AMERICANAS', icon: 'fa-trophy' },
                { id: 'agenda_americanas', label: 'AGENDA', icon: 'fa-calendar-check' },
                { id: 'help_americanas', label: 'INFO', icon: 'fa-info-circle' },
                { id: 'meteo', label: 'CLIMA & RADAR', icon: 'fa-cloud-sun' },
                { id: 'finished_americanas', label: 'FINALIZADAS', icon: 'fa-history' }
            ] : [];

            const navHtml = isAmericanasSection ? `
                <style>
                    .events-submenu-wrapper {
                        position: sticky;
                        top: var(--header-actual-height, 96px);
                        z-index: 9500;
                        background: rgba(10, 14, 26, 0.98);
                        backdrop-filter: blur(16px);
                        -webkit-backdrop-filter: blur(16px);
                        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
                        display: flex;
                        align-items: center;
                        padding: 6px 12px;
                        gap: 6px;
                        box-sizing: border-box;
                        width: 100%;
                    }
                    .events-submenu-pro-bar {
                        display: flex;
                        gap: 8px;
                        overflow-x: auto;
                        -webkit-overflow-scrolling: touch;
                        scroll-behavior: smooth;
                        touch-action: pan-x;
                        padding: 2px 0;
                        scrollbar-width: none;
                        flex: 1;
                    }
                    .events-submenu-pro-bar::-webkit-scrollbar {
                        display: none;
                    }
                    @media (max-width: 680px) {
                        .esm-nav-arrow {
                            display: none !important;
                        }
                    }
                    .esm-nav-arrow {
                        background: rgba(15, 23, 42, 0.95);
                        border: 1px solid rgba(255, 255, 255, 0.12);
                        color: #CCFF00;
                        width: 28px;
                        height: 34px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        border-radius: 8px;
                        flex-shrink: 0;
                        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                        padding: 0;
                    }
                    .esm-nav-arrow:hover {
                        background: #CCFF00;
                        color: #000;
                        transform: scale(1.05);
                    }
                    .esm-pro-btn {
                        flex-shrink: 0;
                        display: flex;
                        align-items: center;
                        gap: 7px;
                        padding: 7px 14px;
                        border-radius: 12px;
                        font-size: 0.72rem;
                        font-weight: 900;
                        letter-spacing: 0.3px;
                        white-space: nowrap;
                        cursor: pointer;
                        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    }
                    .esm-pro-btn:active {
                        transform: scale(0.96);
                    }
                    .esm-pro-btn.active {
                        background: #CCFF00 !important;
                        color: #000000 !important;
                        border: 1.5px solid #CCFF00 !important;
                        box-shadow: 0 4px 14px rgba(204, 255, 0, 0.35) !important;
                    }
                    .esm-pro-btn.active i {
                        color: #000000 !important;
                    }
                    .esm-pro-btn.inactive {
                        background: rgba(255, 255, 255, 0.05);
                        color: #94a3b8;
                        border: 1.5px solid rgba(255, 255, 255, 0.08);
                    }
                    .esm-pro-btn.inactive:hover {
                        background: rgba(255, 255, 255, 0.09);
                        color: #ffffff;
                    }
                    [id^="event-fab-"] {
                        font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif !important;
                    }
                    [id^="event-fab-"] span {
                        font-weight: 950 !important;
                        letter-spacing: 0.6px !important;
                    }
                </style>
                <div class="events-submenu-wrapper">
                    <button id="esm-arrow-left" class="esm-nav-arrow" onclick="window.EventsController.scrollSubmenu('left')" title="Desplazar a la izquierda" aria-label="Desplazar izquierda">
                        <i class="fas fa-chevron-left" style="font-size: 0.75rem;"></i>
                    </button>
                    <div id="events-submenu-bar" class="events-submenu-pro-bar">
                        ${tabs.map(tab => {
                            const isActive = this.state.activeTab === tab.id;
                            return `
                                <button class="esm-pro-btn ${isActive ? 'active' : 'inactive'}"
                                    onclick="(function(btn){
                                        if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(12);
                                        window.EventsController.setTab('${tab.id}');
                                        try { btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }); } catch(e){}
                                    })(this)"
                                    aria-label="${tab.label}">
                                    <i class="fas ${tab.icon}" style="font-size: 0.82rem; color: ${isActive ? '#000' : '#94a3b8'};"></i>
                                    <span style="text-transform: uppercase;">${tab.label}</span>
                                </button>
                            `;
                        }).join('')}
                        <button class="esm-pro-btn inactive"
                            style="border: 1px solid rgba(204, 255, 0, 0.45); color: #CCFF00; background: rgba(204, 255, 0, 0.08);"
                            onclick="if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(12); window.showPointsPolicyModal ? window.showPointsPolicyModal() : null;"
                            aria-label="Sistema Oficial de Puntos">
                            <i class="fas fa-balance-scale" style="font-size: 0.82rem; color: #CCFF00;"></i>
                            <span style="text-transform: uppercase; font-weight: 950;">PUNTOS RANKING</span>
                        </button>
                    </div>
                    <button id="esm-arrow-right" class="esm-nav-arrow" onclick="window.EventsController.scrollSubmenu('right')" title="Desplazar a la derecha" aria-label="Desplazar derecha">
                        <i class="fas fa-chevron-right" style="font-size: 0.75rem;"></i>
                    </button>
                </div>
            ` : '';

            let contentHtml = '';
            if (this.state.loading) {
                contentHtml = '<div style="padding: 100px; text-align: center;"><div class="loader"></div><p style="margin-top:20px; font-weight:900; letter-spacing:2px;">CARGANDO AMERICANAS...</p></div>';
            } else {
                switch (this.state.activeTab) {
                    case 'events': contentHtml = this.renderEventsList(false, false); break;
                    case 'entrenos': contentHtml = this.renderEventsList(false, true); break;
                    case 'agenda': contentHtml = this.renderAgendaView('entreno'); break;
                    case 'agenda_americanas': contentHtml = this.renderAgendaView('americana'); break;
                    case 'results': contentHtml = await this.renderResultsView(); break;
                    case 'finished': contentHtml = this.renderFinishedView('entreno'); break;
                    case 'finished_americanas': contentHtml = this.renderFinishedView('americana'); break;
                    case 'help': contentHtml = window.ControlTowerView ? window.ControlTowerView.renderHelpContent() : '<div style="padding:40px; color:white;">Cargando ayuda...</div>'; break;
                    case 'help_americanas': contentHtml = window.ControlTowerView ? window.ControlTowerView.renderHelpContent() : '<div style="padding:40px; color:white;">Cargando ayuda...</div>'; break;
                    case 'meteo': contentHtml = await this.renderWeatherAndRadarView(); break;
                }
            }

            const isEntrenosSection = ['entrenos', 'agenda', 'help', 'finished'].includes(this.state.activeTab) || (this.state.activeTab === 'meteo' && this.state.lastSubnavContext === 'entrenos');
            let entrenosSubmenuHtml = '';
            if (isEntrenosSection) {
                const entrenosTabs = [
                    { id: 'entrenos', label: 'ENTRENOS', icon: 'fa-table-tennis' },
                    { id: 'agenda', label: 'AGENDA', icon: 'fa-calendar-check' },
                    { id: 'help', label: 'INFO', icon: 'fa-info-circle' },
                    { id: 'meteo', label: 'CLIMA & RADAR', icon: 'fa-cloud-sun' },
                    { id: 'finished', label: 'FINALIZADAS', icon: 'fa-history' }
                ];
                entrenosSubmenuHtml = `
                    <div class="entrenos-subnav-container" style="
                        width: 100%;
                        background: #334155;
                        border-top: 1px solid rgba(255, 255, 255, 0.18);
                        border-bottom: 1px solid rgba(0, 0, 0, 0.35);
                        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 4px 18px rgba(0, 0, 0, 0.25);
                        padding: 6px 8px;
                        box-sizing: border-box;
                        margin-bottom: 16px;
                    ">
                        <div class="subnav-outer-flex" style="display: flex; align-items: center; max-width: 1200px; margin: 0 auto; gap: 6px;">
                            <button class="subnav-nav-arrow" onclick="(function(){
                                const b = document.getElementById('entrenos-tab-bar');
                                if(b) b.scrollBy({ left: -220, behavior: 'smooth' });
                            })()" title="Desplazar a la izquierda" aria-label="Desplazar izquierda" style="background: #1e293b; border: 1.5px solid rgba(255, 255, 255, 0.18); color: #CCFF00;">
                                <i class="fas fa-chevron-left" style="font-size: 0.75rem;"></i>
                            </button>
                            <div id="entrenos-tab-bar" class="entrenos-submenu-bar" style="
                                display: flex;
                                gap: 8px;
                                overflow-x: auto;
                                -webkit-overflow-scrolling: touch;
                                scroll-behavior: smooth;
                                touch-action: pan-x;
                                scrollbar-width: none;
                                flex: 1;
                                padding: 4px 4px;
                                box-sizing: border-box;
                            ">
                                ${entrenosTabs.map(tab => {
                                    const isActive = this.state.activeTab === tab.id;
                                    return `
                                        <button class="esm-pro-btn ${isActive ? 'active' : 'inactive'}"
                                            onclick="(function(btn){
                                                if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(12);
                                                window.EventsController.setTab('${tab.id}');
                                                try { btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }); } catch(e){}
                                            })(this)"
                                            style="
                                                flex-shrink: 0;
                                                display: flex;
                                                align-items: center;
                                                gap: 8px;
                                                padding: 8px 18px;
                                                border-radius: 999px;
                                                font-size: 0.72rem;
                                                font-weight: 950;
                                                letter-spacing: 0.3px;
                                                white-space: nowrap;
                                                cursor: pointer;
                                                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                                                ${isActive ? 'background: #CCFF00 !important; color: #000000 !important; border: 1.5px solid #CCFF00 !important; box-shadow: 0 0 16px rgba(204, 255, 0, 0.45) !important;' : 'background: rgba(15, 23, 42, 0.65) !important; color: #f8fafc !important; border: 1.5px solid rgba(255, 255, 255, 0.15) !important;'}
                                            "
                                            aria-label="${tab.label}">
                                            <i class="fas ${tab.icon}" style="font-size: 0.82rem; color: ${isActive ? '#000000' : '#f8fafc'};"></i>
                                            <span style="text-transform: uppercase;">${tab.label}</span>
                                        </button>
                                    `;
                                }).join('')}
                            </div>
                            <button class="subnav-nav-arrow" onclick="(function(){
                                const b = document.getElementById('entrenos-tab-bar');
                                if(b) b.scrollBy({ left: 220, behavior: 'smooth' });
                            })()" title="Desplazar a la derecha" aria-label="Desplazar derecha" style="background: #1e293b; border: 1.5px solid rgba(255, 255, 255, 0.18); color: #CCFF00;">
                                <i class="fas fa-chevron-right" style="font-size: 0.75rem;"></i>
                            </button>
                        </div>
                    </div>
                `;
            }

            if (isAmericanasSection && window.SubnavManager) {
                window.SubnavManager.renderAmericanas(this.state.activeTab);
            } else if (!isAmericanasSection) {
                if (window.Router && typeof window.Router.attachCommunitySubmenu === 'function') {
                    window.Router.attachCommunitySubmenu('entrenos');
                }
            }

            const searchInput = document.getElementById('events-live-search-input');
            const wasSearchFocused = (document.activeElement === searchInput);
            const cursorPosition = searchInput ? searchInput.selectionStart : null;

            container.innerHTML = `<div class="fade-in">${entrenosSubmenuHtml}${contentHtml}</div>`;

            if (wasSearchFocused) {
                const newSearchInput = document.getElementById('events-live-search-input');
                if (newSearchInput) {
                    newSearchInput.focus();
                    if (cursorPosition !== null) {
                        try { newSearchInput.setSelectionRange(cursorPosition, cursorPosition); } catch (e) {}
                    }
                }
            }

            // TRIGGER ASYNC CONTENT
            this.loadGeoRadarWidget();

            // Inicializar interacciones avanzadas de scroll (drag, rueda, auto-center)
            this.initSubmenuScrollInteractions();

            // Auto-enfoque y scroll a evento si viene referenciado por Deep Link (?event=ID)
            this._checkDeepLinkEvent();
            if (this.state.pendingDeepLinkTarget) {
                this._resolveDeepLinkTarget();
            }
        }

        _extractDeepLinkTarget() {
            try {
                // 1. Extraer de window.location.search (?event=, openEvent=, id=)
                const urlParams = new URLSearchParams(window.location.search);
                let targetId = urlParams.get('event') || urlParams.get('openEvent') || urlParams.get('id');

                // 2. Extraer de window.location.hash (#entrenos?event=, #americanas?event=, #event=, etc.)
                const hash = window.location.hash || '';
                if (!targetId && hash) {
                    const qIdx = hash.indexOf('?');
                    if (qIdx !== -1) {
                        const hashParams = new URLSearchParams(hash.substring(qIdx));
                        targetId = hashParams.get('event') || hashParams.get('openEvent') || hashParams.get('id');
                    }
                    if (!targetId) {
                        const match = hash.match(/(?:event|openEvent|id)=([^&/#]+)/i);
                        if (match && match[1]) targetId = match[1];
                    }
                    if (!targetId && hash.startsWith('#event-')) {
                        targetId = hash.replace('#event-', '');
                    }
                }

                return targetId ? String(targetId).trim() : null;
            } catch (err) {
                console.warn("⚠️ [EventsController] Error extrayendo targetId de deep link:", err);
                return null;
            }
        }

        _checkDeepLinkEvent() {
            try {
                const targetId = this._extractDeepLinkTarget();
                if (!targetId) return;

                // Evitar repetir si ya se procesó este ID en la sesión
                if (this._handledDeepLinkTarget === targetId && !this.state.pendingDeepLinkTarget) return;

                console.log("🔗 [EventsController] Deep Link target event detectado:", targetId);
                this.state.pendingDeepLinkTarget = targetId;

                this._resolveDeepLinkTarget();
            } catch (err) {
                console.warn("⚠️ [EventsController] Deep link check error:", err);
            }
        }

        _resolveDeepLinkTarget() {
            const targetId = this.state.pendingDeepLinkTarget;
            if (!targetId) return;

            // Si ya hay un proceso de resolución activo, intentar resolución inmediata con datos actuales
            if (this._isResolvingDeepLink) {
                this._attemptDeepLinkResolution(targetId);
                return;
            }

            this._isResolvingDeepLink = true;
            let attempts = 0;
            const maxAttempts = 30; // 30 intentos x 200ms = 6 segundos (máxima resiliencia móvil 4G)

            const checkAndResolve = async () => {
                attempts++;
                const resolved = await this._attemptDeepLinkResolution(targetId);
                if (resolved || attempts >= maxAttempts) {
                    if (this._deepLinkInterval) {
                        clearInterval(this._deepLinkInterval);
                        this._deepLinkInterval = null;
                    }
                    this._isResolvingDeepLink = false;
                    if (!resolved && attempts >= maxAttempts) {
                        console.warn(`⌛ [EventsController] Timeout resolviendo deep link para ID: ${targetId} tras ${maxAttempts} intentos.`);
                        this.state.pendingDeepLinkTarget = null;
                    }
                }
            };

            // Intento inmediato
            checkAndResolve();
            if (this._isResolvingDeepLink) {
                this._deepLinkInterval = setInterval(checkAndResolve, 200);
            }
        }

        async _attemptDeepLinkResolution(targetId) {
            const allEvents = (typeof this.getAllSortedEvents === 'function')
                ? this.getAllSortedEvents()
                : [...(this.state.americanas || []), ...(this.state.entrenos || [])];

            const targetEvt = allEvents.find(e => String(e.id) === String(targetId));
            if (!targetEvt) return false;

            console.log(`✅ [EventsController] Evento Deep Link localizado (${targetEvt.name || targetEvt.id}). Procesando foco y navegación...`);
            this.state.pendingDeepLinkTarget = null;
            this._handledDeepLinkTarget = targetId;

            const isFinished = this.isEventFinished(targetEvt);
            const isEntreno = targetEvt.type === 'entreno';

            // 1. Determinar pestaña según tipo y estado
            let targetTab = isEntreno ? 'entrenos' : 'events';
            if (isFinished) {
                targetTab = isEntreno ? 'finished' : 'finished_americanas';
            }

            // 2. Expandir automáticamente la tarjeta en el estado
            if (!this.state.expandedCards) this.state.expandedCards = new Set();
            if (!this.state.collapsedCards) this.state.collapsedCards = new Set();
            this.state.expandedCards.add(targetId);
            this.state.collapsedCards.delete(targetId);

            // 3. Resetear filtros si están activos y pueden ocultar el evento
            const hadActiveFilters = (typeof this.hasActiveFilters === 'function' && this.hasActiveFilters());
            if (hadActiveFilters) {
                console.log("🧹 [EventsController] Reseteando filtros activos para revelar evento de Deep Link");
                this.resetFilters();
            }

            // 4. Cambiar a la pestaña si no es la actual
            if (this.state.activeTab !== targetTab) {
                console.log(`🔄 [EventsController] Conmutando a pestaña ${targetTab} para deep link...`);
                await this.setTab(targetTab);
            } else if (!hadActiveFilters) {
                this._forceFullRender = true;
                this.render();
            }

            // 5. Scroll suave al centro, resplandor neón #CCFF00, borde vibrante y vibración háptica
            setTimeout(() => {
                const card = document.getElementById(`event-card-${targetId}`);
                if (card) {
                    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    card.style.transition = 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                    card.style.boxShadow = '0 0 35px #CCFF00, 0 0 70px rgba(204, 255, 0, 0.45)';
                    card.style.borderColor = '#CCFF00';
                    card.style.transform = 'scale(1.02)';
                    card.style.zIndex = '50';

                    if (window.navigator && window.navigator.vibrate) {
                        try { window.navigator.vibrate([30, 50, 30]); } catch (e) {}
                    }

                    try {
                        window.NotificationService?.showToast?.("🎾 Abriendo evento seleccionado...", "success");
                    } catch (e) {}

                    setTimeout(() => {
                        card.style.boxShadow = '';
                        card.style.borderColor = '';
                        card.style.transform = '';
                        card.style.zIndex = '';
                    }, 3500);
                } else {
                    console.warn(`⚠️ [EventsController] Tarjeta #event-card-${targetId} aún no presente en DOM tras activación.`);
                }
            }, 120);

            return true;
        }

        scrollSubmenu(direction) {
            const bar = document.getElementById('events-submenu-bar');
            if (bar) {
                const offset = direction === 'left' ? -240 : 240;
                bar.scrollBy({ left: offset, behavior: 'smooth' });
                setTimeout(() => this.updateSubmenuArrows(), 320);
            }
        }

        updateSubmenuArrows() {
            const bar = document.getElementById('events-submenu-bar');
            const leftBtn = document.getElementById('esm-arrow-left');
            const rightBtn = document.getElementById('esm-arrow-right');
            if (!bar || !leftBtn || !rightBtn) return;

            const maxScroll = bar.scrollWidth - bar.clientWidth;
            if (maxScroll <= 0) {
                leftBtn.style.opacity = '0.3';
                leftBtn.style.pointerEvents = 'none';
                rightBtn.style.opacity = '0.3';
                rightBtn.style.pointerEvents = 'none';
                return;
            }

            const atStart = bar.scrollLeft <= 6;
            const atEnd = bar.scrollLeft >= maxScroll - 6;

            leftBtn.style.opacity = atStart ? '0.25' : '1';
            leftBtn.style.pointerEvents = atStart ? 'none' : 'auto';
            rightBtn.style.opacity = atEnd ? '0.25' : '1';
            rightBtn.style.pointerEvents = atEnd ? 'none' : 'auto';
        }

        initSubmenuScrollInteractions() {
            const bar = document.getElementById('events-submenu-bar') || document.getElementById('entrenos-tab-bar');
            if (!bar || bar._hasScrollInteractions) return;
            bar._hasScrollInteractions = true;

            // 1. Rueda del ratón: convertir scroll vertical en horizontal suave
            bar.addEventListener('wheel', (e) => {
                if (e.deltaY !== 0) {
                    e.preventDefault();
                    bar.scrollLeft += e.deltaY * 1.1;
                    this.updateSubmenuArrows();
                }
            }, { passive: false });

            // 2. Drag-to-scroll con ratón (arrastrar libremente en escritorio)
            let isDown = false;
            let startX = 0;
            let scrollLeft = 0;
            let hasMoved = false;

            bar.addEventListener('mousedown', (e) => {
                isDown = true;
                hasMoved = false;
                bar.style.cursor = 'grabbing';
                startX = e.pageX - bar.offsetLeft;
                scrollLeft = bar.scrollLeft;
            });

            if (!this._onWindowMouseUp) {
                this._onWindowMouseUp = () => {
                    const activeBar = document.getElementById('events-submenu-bar');
                    if (activeBar) activeBar.style.cursor = 'grab';
                };
                window.addEventListener('mouseup', this._onWindowMouseUp);
            }

            bar.addEventListener('mousemove', (e) => {
                if (!isDown) return;
                const x = e.pageX - bar.offsetLeft;
                const diff = x - startX;
                if (Math.abs(diff) > 4) {
                    hasMoved = true;
                    e.preventDefault();
                    bar.scrollLeft = scrollLeft - (diff * 1.4);
                    this.updateSubmenuArrows();
                }
            });

            bar.addEventListener('mouseup', () => {
                isDown = false;
                bar.style.cursor = 'grab';
            });

            bar.addEventListener('mouseleave', () => {
                isDown = false;
                bar.style.cursor = 'grab';
            });

            // Evitar que el clic abra la pestaña si se estaba arrastrando con ratón
            bar.addEventListener('click', (e) => {
                if (hasMoved) {
                    e.preventDefault();
                    e.stopPropagation();
                    hasMoved = false;
                }
            }, true);

            // Escuchar scroll nativo (táctil o flechas) para actualizar opacidad de flechas
            bar.addEventListener('scroll', () => {
                this.updateSubmenuArrows();
            }, { passive: true });

            // 3. Auto-scroll suave para centrar la pestaña activa al cargar
            setTimeout(() => {
                const active = bar.querySelector('.esm-pro-btn.active');
                if (active) {
                    active.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                }
                this.updateSubmenuArrows();
            }, 80);
        }

        renderEntrenoGuideModal() {
            if (typeof window.showGameModesModal === 'function') {
                window.showGameModesModal('twister');
                return;
            }
            const modalId = 'entreno-guide-modal';
            if (document.getElementById(modalId)) return;

            const modal = document.createElement('div');
            modal.id = modalId;
            modal.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 13000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(5px); animation: fadeIn 0.3s ease; padding: 20px; box-sizing: border-box;`;

            modal.innerHTML = `
                <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); width: 100%; max-width: 500px; border-radius: 24px; border: 1px solid rgba(255,255,255,0.1); display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
                    <div style="padding: 25px; background: rgba(255,255,255,0.03); border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center;">
                        <h2 style="margin:0; color: white; font-size: 1.4rem; font-weight: 800; font-family: 'Outfit', sans-serif;"><span style="color: #CCFF00;">INFO</span> ENTRENOS</h2>
                        <button id="close-guide-btn" style="background: rgba(255,255,255,0.1); border: none; color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer;"><i class="fas fa-times"></i></button>
                    </div>
                    <div style="padding: 25px; overflow-y: auto; max-height: 70vh;">
                        <div style="margin-bottom: 30px;">
                            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 15px;">
                                <div style="width: 40px; height: 40px; background: rgba(56, 189, 248, 0.15); border-radius: 12px; display: flex; align-items: center; justify-content: center;"><i class="fas fa-lock" style="color: #38bdf8; font-size: 1.2rem;"></i></div>
                                <h3 style="margin:0; color: white; font-size: 1.1rem; font-weight: 700;">Pareja Fija</h3>
                            </div>
                            <ul style="margin: 0; padding-left: 20px; color: #94a3b8; font-size: 0.95rem; line-height: 1.6; list-style-type: disc;">
                                <li style="margin-bottom: 8px;">Juegas con tu compañero asignado todo el torneo.</li>
                                <li style="margin-bottom: 8px;">Si <strong>ganáis</strong>, subís de pista juntos.</li>
                                <li style="margin-bottom: 8px;">Si <strong>perdéi</strong>s, bajáis de pista juntos.</li>
                            </ul>
                        </div>
                        <div style="margin-bottom: 10px;">
                            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 15px;">
                                <div style="width: 40px; height: 40px; background: rgba(236, 72, 153, 0.15); border-radius: 12px; display: flex; align-items: center; justify-content: center;"><i class="fas fa-random" style="color: #ec4899; font-size: 1.2rem;"></i></div>
                                <h3 style="margin:0; color: white; font-size: 1.1rem; font-weight: 700;">Twister (Individual)</h3>
                            </div>
                            <ul style="margin: 0; padding-left: 20px; color: #94a3b8; font-size: 0.95rem; line-height: 1.6; list-style-type: disc;">
                                <li style="margin-bottom: 8px;">Te apuntas individualmente.</li>
                                <li style="margin-bottom: 8px;">Si ganas, <strong>TÚ</strong> subes de pista y te cambias de pareja.</li>
                                <li style="margin-bottom: 8px;">Si pierdes, <strong>TÚ</strong> bajas de pista y te cambias de pareja.</li>
                            </ul>
                        </div>
                    </div>
                    <div style="padding: 20px 25px; background: rgba(0,0,0,0.2); border-top: 1px solid rgba(255,255,255,0.05); text-align: center;">
                        <button id="close-guide-action" style="background: #CCFF00; color: black; border: none; padding: 14px 40px; border-radius: 12px; font-weight: 800; font-size: 0.95rem; cursor: pointer; width: 100%;">¡ENTENDIDO!</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            const close = () => { modal.style.opacity = '0'; setTimeout(() => modal.remove(), 300); };
            document.getElementById('close-guide-btn').onclick = close;
            document.getElementById('close-guide-action').onclick = close;
        }

        renderClubBenefitsModal() {
            const modalId = 'club-benefits-modal';
            if (document.getElementById(modalId)) return;

            const modal = document.createElement('div');
            modal.id = modalId;
            modal.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.88); z-index: 13000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(8px); animation: fadeIn 0.3s ease; padding: 18px; box-sizing: border-box;`;

            modal.innerHTML = `
                <div style="background: linear-gradient(145deg, #0f172a 0%, #020617 100%); width: 100%; max-width: 520px; border-radius: 24px; border: 1.5px solid rgba(204, 255, 0, 0.3); display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 25px 60px -10px rgba(0, 0, 0, 0.8), 0 0 30px rgba(204, 255, 0, 0.15); font-family: 'Outfit', -apple-system, sans-serif;">
                    <div style="padding: 20px 22px; background: rgba(255,255,255,0.03); border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="width: 38px; height: 38px; background: rgba(204,255,0,0.12); border-radius: 12px; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(204,255,0,0.3);">
                                <i class="fas fa-handshake" style="color: #CCFF00; font-size: 1.1rem;"></i>
                            </div>
                            <div>
                                <h2 style="margin:0; color: white; font-size: 1.15rem; font-weight: 900; letter-spacing: -0.3px;">ESPACIO <span style="color: #CCFF00;">CLUBES & ORGANIZADORES</span></h2>
                                <p style="margin: 2px 0 0; color: #94a3b8; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Impulsa tus Americanas en Barcelona</p>
                            </div>
                        </div>
                        <button id="close-club-btn" style="background: rgba(255,255,255,0.08); border: none; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.2s;"><i class="fas fa-times"></i></button>
                    </div>
                    <div style="padding: 22px 24px; overflow-y: auto; max-height: 65vh; display: flex; flex-direction: column; gap: 16px;">
                        <div style="background: rgba(204,255,0,0.05); border: 1px dashed rgba(204,255,0,0.3); border-radius: 16px; padding: 14px 16px; display: flex; align-items: center; gap: 12px;">
                            <i class="fas fa-bolt" style="color: #CCFF00; font-size: 1.4rem;"></i>
                            <div>
                                <div style="color: #CCFF00; font-weight: 900; font-size: 0.85rem;">Publica tus torneos y llena pistas</div>
                                <div style="color: #cbd5e1; font-size: 0.75rem; margin-top: 2px;">Conéctate con la mayor comunidad de jugadores de pádel de Barcelona y digitaliza tu operativa.</div>
                            </div>
                        </div>

                        <!-- Ventaja 1 -->
                        <div style="display: flex; gap: 14px; align-items: flex-start;">
                            <div style="width: 36px; height: 36px; min-width: 36px; background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-users" style="color: #38bdf8; font-size: 0.95rem;"></i>
                            </div>
                            <div>
                                <h4 style="margin: 0; color: #fff; font-size: 0.9rem; font-weight: 800;">1. Jugadores Activos de Inmediato</h4>
                                <p style="margin: 4px 0 0; color: #94a3b8; font-size: 0.78rem; line-height: 1.45;">No empieces de cero para llenar tus pistas. Tus eventos se muestran en tiempo real con inscripciones abiertas y avisos a jugadores por nivel.</p>
                            </div>
                        </div>

                        <!-- Ventaja 2 -->
                        <div style="display: flex; gap: 14px; align-items: flex-start;">
                            <div style="width: 36px; height: 36px; min-width: 36px; background: rgba(204, 255, 0, 0.15); border: 1px solid rgba(204, 255, 0, 0.3); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-tv" style="color: #CCFF00; font-size: 0.95rem;"></i>
                            </div>
                            <div>
                                <h4 style="margin: 0; color: #fff; font-size: 0.9rem; font-weight: 800;">2. Torre de Control Digital (Sin Papel ni Boli)</h4>
                                <p style="margin: 4px 0 0; color: #94a3b8; font-size: 0.78rem; line-height: 1.45;">Rotaciones automáticas de pistas, subidas/bajadas, tanteo en directo desde el móvil de los jugadores y ranking instantáneo.</p>
                            </div>
                        </div>

                        <!-- Ventaja 3 -->
                        <div style="display: flex; gap: 14px; align-items: flex-start;">
                            <div style="width: 36px; height: 36px; min-width: 36px; background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-shield-halved" style="color: #c084fc; font-size: 0.95rem;"></i>
                            </div>
                            <div>
                                <h4 style="margin: 0; color: #fff; font-size: 0.9rem; font-weight: 800;">3. Ficha de Club Colaborador & GPS</h4>
                                <p style="margin: 4px 0 0; color: #94a3b8; font-size: 0.78rem; line-height: 1.45;">Tu club destacado con insignia de Club Verificado, fotos, dirección e indicaciones GPS directas en un toque para los asistentes.</p>
                            </div>
                        </div>

                        <!-- Ventaja 4 -->
                        <div style="display: flex; gap: 14px; align-items: flex-start;">
                            <div style="width: 36px; height: 36px; min-width: 36px; background: rgba(34, 197, 94, 0.15); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-gift" style="color: #4ade80; font-size: 0.95rem;"></i>
                            </div>
                            <div>
                                <h4 style="margin: 0; color: #fff; font-size: 0.9rem; font-weight: 800;">4. Prueba Gratuita Sin Compromiso</h4>
                                <p style="margin: 4px 0 0; color: #94a3b8; font-size: 0.78rem; line-height: 1.45;">Colabora con nosotros sin cuotas fijas. Gestiona tus primeros eventos con el software de SomosPadel 100% gratis.</p>
                            </div>
                        </div>
                    </div>
                    <div style="padding: 16px 22px; background: rgba(0,0,0,0.4); border-top: 1px solid rgba(255,255,255,0.06); display: flex; flex-direction: column; gap: 10px;">
                        <a href="https://wa.me/34649219350?text=¡Hola%20Alex!%20Soy%20organizador/club%20de%20pádel%20y%20me%20gustaría%20publicar%20mis%20americanas%20en%20SomosPadel%20BCN." 
                           target="_blank" 
                           rel="noopener noreferrer" 
                           style="background: #25D366; color: #000; padding: 14px; border-radius: 14px; font-weight: 950; font-size: 0.88rem; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 10px; box-shadow: 0 4px 20px rgba(37, 211, 102, 0.4); transition: transform 0.2s;">
                            <i class="fab fa-whatsapp" style="font-size: 1.25rem;"></i> CONTACTAR PARA PUBLICAR TORNEO
                        </a>
                        <button id="close-club-action" style="background: transparent; border: 1px solid rgba(255,255,255,0.15); color: #94a3b8; padding: 10px; border-radius: 12px; font-weight: 700; font-size: 0.8rem; cursor: pointer;">CERRAR</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            const close = () => { modal.style.opacity = '0'; setTimeout(() => modal.remove(), 300); };
            document.getElementById('close-club-btn').onclick = close;
            document.getElementById('close-club-action').onclick = close;
        }

        toggleOrganizerBanner() {
            const banner = document.getElementById('organizer-collapsible-banner');
            const label = document.getElementById('organizer-banner-toggle-label');
            const arrow = document.getElementById('organizer-banner-toggle-arrow');
            const btn = document.getElementById('btn-toggle-organizer-banner');
            if (!banner) return;

            const isHidden = banner.style.display === 'none' || banner.style.display === '';
            if (isHidden) {
                banner.style.display = 'block';
                if (label) label.textContent = 'Ocultar';
                if (arrow) arrow.style.transform = 'rotate(180deg)';
                if (btn) btn.setAttribute('aria-expanded', 'true');
            } else {
                banner.style.display = 'none';
                if (label) label.textContent = 'Mostrar';
                if (arrow) arrow.style.transform = 'rotate(0deg)';
                if (btn) btn.setAttribute('aria-expanded', 'false');
            }
        }

        renderEventsList(onlyMine, onlyEntrenos = false, showBothTypes = false) {
            let events = this.getAllSortedEvents();
            const { month, category } = this.state.filters;
            const uid = this.state.currentUser ? this.state.currentUser.uid : null;
            const todayStr = this.getTodayStr();

            if (!onlyMine) {
                events = events.filter(e => {
                    const isCorrectType = showBothTypes ? true : (onlyEntrenos ? e.type === 'entreno' : e.type === 'americana');

                    // Si el evento está finalizado o vencido por fecha/horario, no va en eventos activos
                    if (this.isEventFinished(e)) return false;

                    return isCorrectType;
                });
            } else if (onlyMine) {
                if (!uid) return '<div style="text-align:center; padding:40px; color:#888;">Debes iniciar sesión.</div>';
                events = events.filter(e => {
                    const players = e.players || e.registeredPlayers || [];
                    return players.some(p => p.uid === uid || p.id === uid);
                });
            }

            // 1. Filtrado por mes
            if (month && month !== 'all') {
                events = events.filter(e => e.normDate && e.normDate.startsWith(month));
            }

            // 2. Filtrado robusto por categoría
            if (category && category !== 'all') {
                events = events.filter(e => {
                    const normCat = this.getNormalizedCategory(e);
                    return normCat === category;
                });
            }

            // 3. Filtrado por estado (todos / con plazas / en juego)
            const statusFilter = this.state.filters.status || 'all';
            if (statusFilter === 'available') {
                events = events.filter(e => {
                    const players = e.players || e.registeredPlayers || [];
                    const maxCourts = parseInt(e.max_courts || e.courts || 4);
                    return players.length < (maxCourts * 4);
                });
            } else if (statusFilter === 'live') {
                events = events.filter(e => e.status === 'live');
            } else if (statusFilter === 'open') {
                events = events.filter(e => e.status === 'open' || !e.status);
            }

            // Filtrado dinámico por búsqueda de texto
            if (this.state.filters.searchQuery) {
                const q = this.state.filters.searchQuery.trim().toLowerCase();
                events = events.filter(e => {
                    const name = (e.name || '').toLowerCase();
                    const sede = (e.sede || e.location || '').toLowerCase();
                    const format = (e.pair_mode || e.format || '').toLowerCase();
                    const cat = (e.category || '').toLowerCase();
                    const club = (e.club || e.organizer || (e.is_external ? 'externa' : 'somospadel')).toLowerCase();
                    // Nivel: buscar en todos los campos posibles de nivel
                    const level = (e.level || '').toString().toLowerCase();
                    const levelMin = (e.level_min || e.min_level || '').toString().toLowerCase();
                    const levelMax = (e.level_max || e.max_level || '').toString().toLowerCase();
                    const levelRange = (levelMin && levelMax) ? `${levelMin} - ${levelMax}` : (levelMin || levelMax);
                    return name.includes(q) || sede.includes(q) || format.includes(q) || cat.includes(q) || club.includes(q)
                        || level.includes(q) || levelMin.includes(q) || levelMax.includes(q) || levelRange.includes(q);
                });
            }

            const isAmericanasSection = this.state.activeTab === 'events';
            const organizerBannerHtml = isAmericanasSection ? `
                <div class="organizer-promo-wrapper" style="margin-bottom: 16px;">
                    <!-- Botón disparador para mostrar/ocultar el espacio de clubes -->
                    <button id="btn-toggle-organizer-banner" 
                            onclick="window.EventsController.toggleOrganizerBanner()" 
                            aria-expanded="false"
                            style="
                                width: 100%;
                                background: linear-gradient(135deg, rgba(15, 23, 42, 0.94) 0%, rgba(30, 41, 59, 0.94) 100%);
                                border: 1.5px solid rgba(204, 255, 0, 0.35);
                                color: #ffffff;
                                padding: 11px 16px;
                                border-radius: 18px;
                                font-family: 'Outfit', sans-serif;
                                font-weight: 850;
                                font-size: 0.78rem;
                                display: flex;
                                align-items: center;
                                justify-content: space-between;
                                cursor: pointer;
                                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
                                transition: all 0.25s ease;
                            "
                            onmouseover="this.style.borderColor='#CCFF00'; this.style.transform='translateY(-1px)';"
                            onmouseout="this.style.borderColor='rgba(204, 255, 0, 0.35)'; this.style.transform='translateY(0)';"
                    >
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 10px; background: rgba(204, 255, 0, 0.15); color: #CCFF00; font-size: 0.85rem; box-shadow: 0 0 10px rgba(204,255,0,0.25);">
                                <i class="fas fa-crown"></i>
                            </span>
                            <div style="text-align: left;">
                                <div style="color: #ffffff; font-size: 0.82rem; font-weight: 950; letter-spacing: -0.2px;">
                                    ¿Organizas Americanas? <span style="color: #CCFF00;">Espacio Clubes</span>
                                </div>
                                <div style="color: #94a3b8; font-size: 0.62rem; font-weight: 700;">Publica tus torneos en SomosPadel Barcelona</div>
                            </div>
                        </div>
                        <div id="organizer-banner-toggle-badge" style="font-size: 0.68rem; color: #CCFF00; display: flex; align-items: center; gap: 5px; background: rgba(204, 255, 0, 0.1); padding: 5px 11px; border-radius: 20px; border: 1px solid rgba(204, 255, 0, 0.25); flex-shrink: 0; font-weight: 850;">
                            <span id="organizer-banner-toggle-label">Mostrar</span>
                            <i id="organizer-banner-toggle-arrow" class="fas fa-chevron-down" style="font-size: 0.62rem; transition: transform 0.3s ease;"></i>
                        </div>
                    </button>

                    <!-- Contenedor desplegable (oculto por defecto) -->
                    <div id="organizer-collapsible-banner" style="display: none; margin-top: 10px; animation: bannerSlideDown 0.35s cubic-bezier(0.16, 1, 0.3, 1);">
                        <div class="organizer-promo-banner" style="
                            background: linear-gradient(135deg, rgba(11, 17, 32, 0.98) 0%, rgba(15, 23, 42, 0.98) 50%, rgba(3, 7, 18, 0.98) 100%);
                            border: 1px solid rgba(204, 255, 0, 0.32);
                            border-radius: 22px;
                            padding: 18px 20px;
                            position: relative;
                            overflow: hidden;
                            box-shadow: 0 16px 36px -10px rgba(0, 0, 0, 0.75), 0 0 25px -5px rgba(204, 255, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.12);
                            backdrop-filter: blur(16px);
                        ">
                            <!-- Ambient Glow Orbs -->
                            <div style="position: absolute; top: -35px; left: -35px; width: 140px; height: 140px; background: radial-gradient(circle, rgba(204, 255, 0, 0.18) 0%, transparent 70%); filter: blur(25px); pointer-events: none;"></div>
                            <div style="position: absolute; bottom: -35px; right: -35px; width: 150px; height: 150px; background: radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, transparent 70%); filter: blur(30px); pointer-events: none;"></div>
                            
                            <!-- Decorative Background Watermark -->
                            <i class="fas fa-trophy" style="position: absolute; right: -12px; bottom: -18px; font-size: 7.5rem; color: #CCFF00; opacity: 0.04; transform: rotate(-12deg); pointer-events: none; z-index: 1;"></i>

                            <div style="position: relative; z-index: 2;">
                                <!-- Top Header: Badge + Glowing Trophy Emblem + Close Button -->
                                <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 10px;">
                                    <div style="display: inline-flex; align-items: center; gap: 6px; background: linear-gradient(135deg, rgba(204, 255, 0, 0.14) 0%, rgba(56, 189, 248, 0.08) 100%); border: 1px solid rgba(204, 255, 0, 0.35); padding: 4px 11px; border-radius: 999px; box-shadow: 0 2px 8px rgba(0,0,0,0.25);">
                                        <i class="fas fa-crown" style="color: #CCFF00; font-size: 0.68rem;"></i>
                                        <span style="color: #CCFF00; font-size: 0.64rem; font-weight: 950; text-transform: uppercase; letter-spacing: 0.8px;">ESPACIO CLUBES & ORGANIZADORES</span>
                                    </div>

                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <div style="width: 40px; height: 40px; border-radius: 12px; background: linear-gradient(135deg, rgba(204, 255, 0, 0.18) 0%, rgba(56, 189, 248, 0.12) 100%); border: 1.5px solid rgba(204, 255, 0, 0.4); display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4);">
                                            <i class="fas fa-trophy" style="color: #CCFF00; font-size: 1.15rem; filter: drop-shadow(0 2px 6px rgba(204, 255, 0, 0.45));"></i>
                                        </div>
                                        <button onclick="window.EventsController.toggleOrganizerBanner()" 
                                                style="width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.16); color: #94a3b8; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s;" 
                                                title="Ocultar espacio clubes"
                                                onmouseover="this.style.background='rgba(255,255,255,0.18)'; this.style.color='#ffffff';"
                                                onmouseout="this.style.background='rgba(255,255,255,0.08)'; this.style.color='#94a3b8';">
                                            <i class="fas fa-times" style="font-size: 0.75rem;"></i>
                                        </button>
                                    </div>
                                </div>

                                <!-- Headline -->
                                <h3 style="margin: 0 0 6px; color: #ffffff; font-size: 1.15rem; font-weight: 950; line-height: 1.25; letter-spacing: -0.4px;">
                                    ¿Organizas Americanas en <span style="background: linear-gradient(90deg, #CCFF00, #38bdf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Barcelona</span>?
                                </h3>

                                <!-- Subtitle -->
                                <p style="margin: 0 0 12px; color: #cbd5e1; font-size: 0.78rem; line-height: 1.5; font-weight: 500;">
                                    Publica tus torneos aquí, atrae a nuestra comunidad y gestiona en directo con la <strong style="color: #CCFF00; font-weight: 900;">Torre de Control digital</strong>.
                                </p>

                                <!-- Key Benefits Micro-Chips -->
                                <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px;">
                                    <span style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 3px 8px; font-size: 0.65rem; font-weight: 800; color: #e2e8f0; display: inline-flex; align-items: center; gap: 4px;">
                                        <i class="fas fa-users" style="color: #38bdf8; font-size: 0.65rem;"></i> +1.500 Jugadores
                                    </span>
                                    <span style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 3px 8px; font-size: 0.65rem; font-weight: 800; color: #e2e8f0; display: inline-flex; align-items: center; gap: 4px;">
                                        <i class="fas fa-tv" style="color: #CCFF00; font-size: 0.65rem;"></i> Marcador en Vivo
                                    </span>
                                    <span style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 3px 8px; font-size: 0.65rem; font-weight: 800; color: #e2e8f0; display: inline-flex; align-items: center; gap: 4px;">
                                        <i class="fas fa-bolt" style="color: #fbbf24; font-size: 0.65rem;"></i> Sin Coste Fijo
                                    </span>
                                </div>
                                
                                <!-- Actions Grid -->
                                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                                    <a href="https://wa.me/34649219350?text=¡Hola%20Alex!%20Soy%20organizador/club%20de%20pádel%20y%20me%20gustaría%20publicar%20mis%20americanas%20en%20SomosPadel%20BCN." 
                                       target="_blank" 
                                       rel="noopener noreferrer" 
                                       style="
                                           background: #CCFF00;
                                           color: #050b14;
                                           padding: 9px 14px;
                                           border-radius: 12px;
                                           font-weight: 950;
                                           font-size: 0.74rem;
                                           text-decoration: none;
                                           display: inline-flex;
                                           align-items: center;
                                           justify-content: center;
                                           gap: 6px;
                                           box-shadow: 0 4px 14px rgba(204, 255, 0, 0.35);
                                           letter-spacing: 0.3px;
                                           transition: all 0.2s ease;
                                           flex: 1 1 140px;
                                           min-width: 125px;
                                       "
                                       onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(204, 255, 0, 0.55)';"
                                       onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 14px rgba(204, 255, 0, 0.4)';"
                                       onmousedown="this.style.transform='scale(0.97)';">
                                        <i class="fab fa-whatsapp" style="font-size: 0.95rem; color: #050b14;"></i>
                                        <span>PUBLICAR MI EVENTO</span>
                                    </a>
                                    <button onclick="window.EventsController.renderClubBenefitsModal()" 
                                            style="
                                                background: rgba(255, 255, 255, 0.08);
                                                border: 1px solid rgba(255, 255, 255, 0.16);
                                                color: #ffffff;
                                                padding: 9px 14px;
                                                border-radius: 12px;
                                                font-weight: 900;
                                                font-size: 0.74rem;
                                                cursor: pointer;
                                                display: inline-flex;
                                                align-items: center;
                                                justify-content: center;
                                                gap: 6px;
                                                backdrop-filter: blur(10px);
                                                letter-spacing: 0.3px;
                                                transition: all 0.2s ease;
                                                flex: 1 1 140px;
                                                min-width: 125px;
                                            "
                                            onmouseover="this.style.background='rgba(255, 255, 255, 0.14)'; this.style.borderColor='rgba(56, 189, 248, 0.5)';"
                                            onmouseout="this.style.background='rgba(255, 255, 255, 0.08)'; this.style.borderColor='rgba(255, 255, 255, 0.16)';"
                                            onmousedown="this.style.transform='scale(0.97)';">
                                        <i class="fas fa-info-circle" style="color: #38bdf8; font-size: 0.85rem;"></i>
                                        <span>VENTAJAS CLUBES</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ` : '';

            const eventsHtml = events.map(evt => this.renderCard(evt)).join('');

            // Filtrar eventos activos específicamente para la pestaña actual (Entrenos vs Americanas)
            const activeTypeEvents = this.getAllSortedEvents().filter(e => {
                const isCorrectType = showBothTypes ? true : (onlyEntrenos ? e.type === 'entreno' : e.type === 'americana');
                if (this.isEventFinished(e)) return false;
                return isCorrectType;
            });
            const filterBarHtml = !onlyMine ? this.renderFilterBar(activeTypeEvents) : '';

            return `
                <div style="min-height: 80vh; padding-top: 5px;">
                    <style>
                        @keyframes bannerSlideDown {
                            from { opacity: 0; transform: translateY(-8px); }
                            to { opacity: 1; transform: translateY(0); }
                        }
                        @keyframes status-breathe {
                            0% { box-shadow: 0 0 8px rgba(255,45,85,0.4); }
                            50% { box-shadow: 0 0 16px rgba(255,45,85,0.8); }
                            100% { box-shadow: 0 0 8px rgba(255,45,85,0.4); }
                        }
                        @keyframes status-shake {
                            0% { transform: translateX(0); }
                            50% { transform: translateX(-2px); }
                            100% { transform: translateX(2px); }
                        }
                        @keyframes status-dot-ping {
                            0% { transform: scale(1); opacity:0.8; }
                            70% { transform: scale(1.5); opacity:0; }
                            100% { transform: scale(1); opacity:0.8; }
                        }
                        @keyframes ball-physics {
                            0% { transform: translateY(0) scale(1) rotate(0deg); opacity: 0.8; }
                            15% { transform: translateY(-30px) scale(0.9, 1.1) rotate(45deg); opacity: 1; }
                            30% { transform: translateY(0) scale(1.2, 0.8) rotate(90deg); opacity: 0.8; }
                            45% { transform: translateY(-15px) scale(0.95, 1.05) rotate(135deg); opacity: 1; }
                            60% { transform: translateY(0) scale(1.1, 0.9) rotate(180deg); opacity: 0.8; }
                            100% { transform: translateY(0) scale(1) rotate(360deg); opacity: 0.8; }
                        }
                        @keyframes internal-spin {
                            0% { transform: rotate(0deg) scale(1); filter: brightness(1); }
                            50% { transform: rotate(180deg) scale(1.1); filter: brightness(1.3); }
                            100% { transform: rotate(360deg) scale(1); filter: brightness(1); }
                        }
                        @keyframes neon-flicker {
                            0%, 100% { opacity: 1; }
                            50% { opacity: 0.8; transform: scale(1.02); }
                        }
                        .padel-ball-live {
                            animation: ball-physics 3s cubic-bezier(0.45, 0, 0.55, 1) infinite;
                        }
                        .ball-inner-spin {
                            animation: internal-spin 2s linear infinite;
                        }
                        .premium-tile-interactive {
                            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                            cursor: pointer;
                        }
                        .premium-tile-interactive:hover, .premium-tile-interactive:active {
                            background: rgba(255,255,255,0.15) !important;
                            transform: translateY(-2px) scale(1.02);
                            box-shadow: 0 8px 20px rgba(204,255,0,0.2), inset 0 0 15px rgba(204,255,0,0.05) !important;
                            border-color: #CCFF00 !important;
                            z-index: 5;
                        }
                        .entreno-premium-card, .americana-premium-card {
                            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                            cursor: pointer;
                        }
                        .card-theme-male:hover, .card-theme-male:active {
                            transform: translateY(-4px) scale(1.01) !important;
                            border-color: rgba(56, 189, 248, 0.65) !important;
                            box-shadow: 0 25px 50px rgba(0,0,0,0.85), 0 0 35px rgba(56, 189, 248, 0.32) !important;
                        }
                        .card-theme-female:hover, .card-theme-female:active {
                            transform: translateY(-4px) scale(1.01) !important;
                            border-color: rgba(236, 72, 153, 0.65) !important;
                            box-shadow: 0 25px 50px rgba(0,0,0,0.85), 0 0 35px rgba(236, 72, 153, 0.32) !important;
                        }
                        .card-theme-mixed:hover, .card-theme-mixed:active {
                            transform: translateY(-4px) scale(1.01) !important;
                            border-color: rgba(245, 158, 11, 0.65) !important;
                            box-shadow: 0 25px 50px rgba(0,0,0,0.85), 0 0 35px rgba(245, 158, 11, 0.32) !important;
                        }
                        .card-theme-open:hover, .card-theme-open:active {
                            transform: translateY(-4px) scale(1.01) !important;
                            border-color: rgba(132, 204, 22, 0.65) !important;
                            box-shadow: 0 25px 50px rgba(0,0,0,0.85), 0 0 35px rgba(132, 204, 22, 0.32) !important;
                        }
                        .entreno-tile-interactive {
                            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                            cursor: pointer;
                        }
                        .entreno-tile-interactive:hover, .entreno-tile-interactive:active {
                            background: rgba(255,255,255,0.15) !important;
                            transform: translateY(-2px) scale(1.02);
                            box-shadow: 0 8px 20px rgba(245, 158, 11, 0.2), inset 0 0 15px rgba(245, 158, 11, 0.05) !important;
                            border-color: #f59e0b !important;
                            z-index: 5;
                        }
                    </style>
                    <div style="padding: 13px 16px; display: flex; justify-content: space-between; align-items: center; background: #ffffff; border-radius: 20px; margin: 10px 10px 8px 10px; box-shadow: 0 8px 24px -4px rgba(0,0,0,0.06), 0 2px 6px -1px rgba(0,0,0,0.04); border: 1.5px solid #e2e8f0; position: relative; overflow: hidden; gap: 10px;">
                        <!-- Subtle accent line -->
                        <div style="position:absolute; top:0; left:0; width:100%; height:3.5px; background: linear-gradient(90deg, #65a30d, #84cc16, #22c55e); border-radius:20px 20px 0 0;"></div>
                        <div style="display: flex; align-items: center; gap: 10px; position: relative; z-index: 1; min-width: 0; flex: 1;">
                            <!-- Botón de actualización instantánea -->
                            <button id="btn-instant-refresh" 
                                    onclick="window.EventsController.refreshInstantly(this)" 
                                    title="Actualización instantánea"
                                    aria-label="Actualizar inscripciones"
                                    style="width: 44px; height: 44px; min-width: 44px; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 14px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; color: #0f172a; box-shadow: 0 2px 6px rgba(0,0,0,0.04); transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); position: relative; padding: 0; flex-shrink: 0;"
                                    onmouseover="this.style.borderColor='#65a30d'; this.style.transform='scale(1.05)';"
                                    onmouseout="this.style.borderColor='#cbd5e1'; this.style.transform='scale(1)';"
                                    onmousedown="this.style.transform='scale(0.92)';">
                                <i id="instant-refresh-icon" class="fas fa-arrows-rotate" style="font-size: 1rem; color: #65a30d; transition: transform 0.4s ease;"></i>
                                <span id="instant-refresh-label" style="font-size: 0.46rem; font-weight: 900; color: #64748b; letter-spacing: 0.3px; margin-top: 2px; line-height: 1;">SYNC</span>
                                <span id="instant-refresh-dot" style="position: absolute; top: -3px; right: -3px; width: 8px; height: 8px; background: #22c55e; border-radius: 50%; border: 1.5px solid #ffffff; box-shadow: 0 0 6px rgba(34, 197, 94, 0.6);"></span>
                            </button>
                            <div style="width: 44px; height: 44px; min-width: 44px; background: #f1f5f9; border: 1.5px solid #e2e8f0; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.35rem; flex-shrink: 0;">
                                🎾
                            </div>
                            <div style="min-width: 0; overflow: hidden;">
                                <h2 style="font-size: 1.05rem; font-weight: 950; margin: 0; color: #0f172a; letter-spacing: -0.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                    ${this.state.activeTab === 'events' ? 'Americanas <span style="color: #65a30d;">Barcelona</span>' : 'Entrenos <span style="color: #65a30d;">SomosPadel BCN</span>'}
                                </h2>
                                <p style="color: #64748b; font-size: 0.64rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; margin: 2px 0 0; display: flex; align-items: center; gap: 5px;">
                                    <span>${this.state.activeTab === 'events' ? 'SomosPadel & Externas' : 'Inscripción en tiempo real'}</span>
                                    <span style="display:inline-block; width:4px; height:4px; border-radius:50%; background:#22c55e;"></span>
                                    <span style="color:#16a34a; font-size:0.6rem; font-weight:900;">EN VIVO</span>
                                </p>
                            </div>
                        </div>
                        <div style="background: #f8fafc; padding: 6px 14px; border-radius: 14px; border: 1.5px solid #e2e8f0; color: #0f172a; font-weight: 950; display:flex; align-items:center; gap:6px; font-size:0.92rem; flex-shrink:0;">
                            <span style="color:#65a30d; font-size:0.68rem; font-weight:900;">TOTAL</span> 
                            <span id="events-total-badge" style="color:#0f172a;">${events.length}</span>
                        </div>
                    </div>
                    <!-- LISTADO DE EVENTOS (ENTRENOS Y AMERICANAS DIRECTAMENTE A CONTINUACIÓN DE LA CABECERA) -->
                    <div style="padding-left:10px; padding-right:10px; margin-top: 4px;">
                        ${events.length === 0 ? `
                            <div style="padding: 55px 20px; text-align: center; background: rgba(255,255,255,0.03); border: 1.5px dashed rgba(255,255,255,0.12); border-radius: 24px; margin: 15px 0;">
                                <div style="width: 54px; height: 54px; border-radius: 50%; background: rgba(204,255,0,0.12); display: flex; align-items: center; justify-content: center; margin: 0 auto 14px; box-shadow: 0 0 20px rgba(204,255,0,0.2);">
                                    <i class="fas fa-filter" style="font-size: 1.4rem; color: #CCFF00;"></i>
                                </div>
                                <h3 style="color: #ffffff; font-weight: 900; margin: 0; font-size: 1.05rem; letter-spacing: -0.3px;">${this.hasActiveFilters() ? `SIN ${this.state.activeTab === 'events' ? 'AMERICANAS' : 'ENTRENOS'} CON ESTOS FILTROS` : `NO HAY ${this.state.activeTab === 'events' ? 'AMERICANAS' : 'ENTRENOS'} ACTIVOS`}</h3>
                                <p style="color: #94a3b8; font-size: 0.78rem; margin: 6px 0 16px;">${this.hasActiveFilters() ? 'Prueba a seleccionar otro mes, categoría o limpiar los filtros.' : 'Pronto abriremos nuevas convocatorias en tiempo real.'}</p>
                                ${this.hasActiveFilters() ? `
                                    <button onclick="window.EventsController.resetFilters()" style="background: #CCFF00; color: #000; border: none; font-weight: 950; font-size: 0.74rem; padding: 10px 22px; border-radius: 12px; cursor: pointer; box-shadow: 0 4px 14px rgba(204,255,0,0.35); display: inline-flex; align-items: center; gap: 6px;">
                                        <i class="fas fa-rotate-left"></i> REINICIAR FILTROS
                                    </button>
                                ` : ''}
                            </div>
                        ` : eventsHtml}
                    </div>

                    <!-- BARRA DE BÚSQUEDA Y FILTROS -->
                    ${filterBarHtml}

                    <!-- ESPACIO CLUBES & ORGANIZADORES (SI APLICA) -->
                    <div style="padding-left:10px; padding-right:10px;">
                        ${organizerBannerHtml}
                    </div>

                    <!-- SELECTOR VISUAL PREMIUM DE MODOS DE JUEGO (FONDO BLANCO, ALTO CONTRASTE Y 3 BLOQUES CLAROS) -->
                    <div style="margin: 10px 10px 10px 10px; background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 20px; padding: 12px 14px; box-shadow: 0 8px 24px -4px rgba(0,0,0,0.06), 0 2px 6px -1px rgba(0,0,0,0.04);">
                        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                            <div style="display: flex; align-items: center; gap: 7px;">
                                <span style="display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 8px; background: #0f172a; color: #CCFF00; font-size: 0.8rem; box-shadow: 0 2px 6px rgba(0,0,0,0.15);">
                                    <i class="fas fa-layer-group"></i>
                                </span>
                                <span style="color: #0f172a; font-weight: 950; font-size: 0.8rem; letter-spacing: 0.3px; text-transform: uppercase;">
                                    Modos de Juego
                                </span>
                                <span style="background: #0f172a; color: #CCFF00; font-size: 0.6rem; padding: 2px 8px; border-radius: 999px; font-weight: 900; letter-spacing: 0.5px;">
                                    3 FORMATOS
                                </span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <button onclick="window.showPointsPolicyModal ? window.showPointsPolicyModal() : null" 
                                        title="Consultar Sistema Oficial de Puntos para el Ranking"
                                        style="background: #0f172a; border: 1.5px solid rgba(204, 255, 0, 0.4); color: #CCFF00; font-size: 0.68rem; font-weight: 900; padding: 5px 10px; border-radius: 10px; cursor: pointer; display: flex; align-items: center; gap: 5px; transition: all 0.2s; box-shadow: 0 2px 8px rgba(0,0,0,0.12);"
                                        onmouseover="this.style.background='#1e293b'; this.style.transform='scale(1.03)';"
                                        onmouseout="this.style.background='#0f172a'; this.style.transform='scale(1)';">
                                    <i class="fas fa-balance-scale"></i>
                                    <span>Puntos Ranking</span>
                                </button>
                                <button onclick="window.showGameModesModal ? window.showGameModesModal('comparativa') : null" 
                                        style="background: #f8fafc; border: 1.5px solid #cbd5e1; color: #0f172a; font-size: 0.68rem; font-weight: 850; padding: 5px 11px; border-radius: 10px; cursor: pointer; display: flex; align-items: center; gap: 5px; transition: all 0.2s;"
                                        onmouseover="this.style.background='#0f172a'; this.style.borderColor='#0f172a'; this.style.color='#CCFF00';"
                                        onmouseout="this.style.background='#f8fafc'; this.style.borderColor='#cbd5e1'; this.style.color='#0f172a';">
                                    <span>Guía</span>
                                    <i class="fas fa-chevron-right" style="font-size: 0.6rem; color: #65a30d;"></i>
                                </button>
                            </div>
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 10px;">
                            <!-- CHIP 1: PAREJA FIJA -->
                            <div onclick="window.showGameModesModal ? window.showGameModesModal('pareja') : null"
                                 title="Ver reglas de Pareja Fija"
                                 style="cursor: pointer; background: linear-gradient(180deg, #f0f9ff 0%, #e0f2fe 100%); border: 1.5px solid #38bdf8; border-radius: 14px; padding: 10px 4px; text-align: center; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; box-shadow: 0 4px 12px rgba(56, 189, 248, 0.12);"
                                 onmouseover="this.style.transform='translateY(-2px) scale(1.02)'; this.style.boxShadow='0 8px 18px rgba(56, 189, 248, 0.25)';"
                                 onmouseout="this.style.transform='translateY(0) scale(1)'; this.style.boxShadow='0 4px 12px rgba(56, 189, 248, 0.12)';"
                                 onmousedown="this.style.transform='scale(0.96)';">
                                <div style="font-size: 1.25rem; line-height: 1;">👥</div>
                                <div style="color: #0f172a; font-weight: 950; font-size: 0.82rem; letter-spacing: -0.2px; line-height: 1.2;">Pareja Fija</div>
                                <div style="color: #0284c7; font-size: 0.6rem; font-weight: 950; text-transform: uppercase; letter-spacing: 0.4px;">PAREJA FIJA</div>
                            </div>
                            <!-- CHIP 2: TWISTER INDIVIDUAL -->
                            <div onclick="window.showGameModesModal ? window.showGameModesModal('twister') : null"
                                 title="Ver reglas de Twister Individual"
                                 style="cursor: pointer; background: linear-gradient(180deg, #fdf2f8 0%, #fce7f3 100%); border: 1.5px solid #ec4899; border-radius: 14px; padding: 10px 4px; text-align: center; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; box-shadow: 0 4px 12px rgba(236, 72, 153, 0.12);"
                                 onmouseover="this.style.transform='translateY(-2px) scale(1.02)'; this.style.boxShadow='0 8px 18px rgba(236, 72, 153, 0.25)';"
                                 onmouseout="this.style.transform='translateY(0) scale(1)'; this.style.boxShadow='0 4px 12px rgba(236, 72, 153, 0.12)';"
                                 onmousedown="this.style.transform='scale(0.96)';">
                                <div style="font-size: 1.25rem; line-height: 1;">🌪️</div>
                                <div style="color: #0f172a; font-weight: 950; font-size: 0.82rem; letter-spacing: -0.2px; line-height: 1.2;">Twister</div>
                                <div style="color: #db2777; font-size: 0.6rem; font-weight: 950; text-transform: uppercase; letter-spacing: 0.4px;">INDIVIDUAL</div>
                            </div>
                            <!-- CHIP 3: SUIZO -->
                            <div onclick="window.showGameModesModal ? window.showGameModesModal('suizo') : null"
                                 title="Ver reglas de Americana / Entreno Suizo"
                                 style="cursor: pointer; background: linear-gradient(180deg, #fef2f2 0%, #fee2e2 100%); border: 1.5px solid #ef4444; border-radius: 14px; padding: 10px 4px; text-align: center; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.12);"
                                 onmouseover="this.style.transform='translateY(-2px) scale(1.02)'; this.style.boxShadow='0 8px 18px rgba(239, 68, 68, 0.25)';"
                                 onmouseout="this.style.transform='translateY(0) scale(1)'; this.style.boxShadow='0 4px 12px rgba(239, 68, 68, 0.12)';"
                                 onmousedown="this.style.transform='scale(0.96)';">
                                <div style="font-size: 1.25rem; line-height: 1; display: flex; align-items: center; justify-content: center;">
                                    <span style="display:inline-flex; align-items:center; justify-content:center; width:22px; height:22px; background:#dc2626; color:#ffffff; border-radius:6px; font-weight:950; font-size:0.9rem; line-height:1; box-shadow:0 2px 6px rgba(220,38,38,0.35);">✚</span>
                                </div>
                                <div style="color: #0f172a; font-weight: 950; font-size: 0.82rem; letter-spacing: -0.2px; line-height: 1.2;">Suizo</div>
                                <div style="color: #dc2626; font-size: 0.6rem; font-weight: 950; text-transform: uppercase; letter-spacing: 0.4px;">POR JUEGOS</div>
                            </div>
                        </div>
                    </div>

                    <div style="padding-bottom: 80px; padding-left:10px; padding-right:10px;">
                        <div style="margin-top: 25px; display: flex; flex-direction: column; align-items: center; padding-bottom: 20px; gap: 14px;">
                            
                            <!-- GEOLOCALIZACIÓN RADAR -->
                            <div id="geo-radar-root" style="width: 100%; max-width: 500px; margin: 5px auto; animation: floatUp 0.8s ease-out forwards;">
                                <!-- Cargado vía JS -->
                            </div>

                            <!-- BOTÓN DESTACADO INFERIOR MODOS DE JUEGO (FONDO BLANCO, ALTO CONTRASTE) -->
                            <button onclick="window.showGameModesModal ? window.showGameModesModal('${this.state.activeTab}') : (window.EventsController && window.EventsController.renderEntrenoGuideModal && window.EventsController.renderEntrenoGuideModal())" 
                                    style="background: #ffffff; color: #0f172a; border: 1.5px solid #cbd5e1; padding: 11px 20px; border-radius: 999px; font-size: 0.8rem; font-weight: 850; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 6px 20px rgba(0,0,0,0.06); transition: all 0.22s ease;" 
                                    onmouseover="this.style.transform='scale(1.03)'; this.style.borderColor='#0f172a'; this.style.boxShadow='0 8px 24px rgba(0,0,0,0.12)';" 
                                    onmouseout="this.style.transform='scale(1)'; this.style.borderColor='#cbd5e1'; this.style.boxShadow='0 6px 20px rgba(0,0,0,0.06)';">
                                <span style="background: #0f172a; color: #CCFF00; font-size: 0.65rem; font-weight: 950; padding: 3px 8px; border-radius: 6px;">🎮 REGLAS</span>
                                <span style="background: #e0f2fe; color: #0284c7; border: 1px solid #38bdf8; padding: 3px 8px; border-radius: 8px; font-size: 0.68rem; font-weight: 950;">👥 Pareja Fija</span>
                                <span style="background: #fce7f3; color: #db2777; border: 1px solid #ec4899; padding: 3px 8px; border-radius: 8px; font-size: 0.68rem; font-weight: 950;">🌪️ Twister</span>
                                <span style="background: #fee2e2; color: #dc2626; border: 1px solid #ef4444; padding: 3px 8px; border-radius: 8px; font-size: 0.68rem; font-weight: 950; display: inline-flex; align-items: center; gap: 3px;"><span style="background:#dc2626; color:#fff; border-radius:3px; padding:0 3px; font-size:0.58rem; font-weight:950;">✚</span> Suizo</span>
                            </button>

                            <!-- BOTÓN BANNER SISTEMA OFICIAL DE PUNTOS Y RANKING -->
                            <button onclick="window.showPointsPolicyModal ? window.showPointsPolicyModal() : null" 
                                    style="background: linear-gradient(135deg, #090e1a 0%, #0f172a 100%); color: #CCFF00; border: 1.5px solid rgba(204,255,0,0.45); padding: 12px 22px; border-radius: 999px; font-size: 0.78rem; font-weight: 950; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.35), 0 0 15px rgba(204,255,0,0.15); transition: all 0.22s ease;" 
                                    onmouseover="this.style.transform='scale(1.03)'; this.style.borderColor='#CCFF00'; this.style.boxShadow='0 10px 28px rgba(204,255,0,0.3)';" 
                                    onmouseout="this.style.transform='scale(1)'; this.style.borderColor='rgba(204,255,0,0.45)'; this.style.boxShadow='0 8px 24px rgba(0,0,0,0.35), 0 0 15px rgba(204,255,0,0.15)';">
                                <i class="fas fa-balance-scale" style="font-size: 1rem; color: #CCFF00;"></i>
                                <span>⚖️ SISTEMA OFICIAL DE PUNTOS: ENTRENOS & AMERICANAS (100 PTS + 2 PTS/PG)</span>
                            </button>

                            ${(this.state.activeTab === 'events') ? `
                            <button onclick="window.EventsController.renderClubBenefitsModal()" style="background: rgba(30, 41, 59, 0.85); backdrop-filter: blur(10px); color: #CCFF00; border: 1px solid rgba(204,255,0,0.35); padding: 12px 25px; border-radius: 30px; font-size: 0.8rem; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.4); transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.03)';" onmouseout="this.style.transform='scale(1)';">
                                <i class="fas fa-building-columns" style="color: #CCFF00;"></i> ¿ERES UN CLUB? BENEFICIOS Y PUBLICACIÓN
                            </button>
                            ` : ''}

                            ${(this.state.activeTab === 'entrenos') ? `
                            <button onclick="window.EventsController.renderEntrenoGuideModal()" style="background: rgba(30, 41, 59, 0.8); backdrop-filter: blur(10px); color: #cbd5e1; border: 1px solid rgba(255,255,255,0.1); padding: 12px 25px; border-radius: 30px; font-size: 0.8rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 10px;">
                                <i class="fas fa-info-circle" style="color: #CCFF00;"></i> ¿CÓMO FUNCIONAN LOS FORMATOS?
                            </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }

        renderAgendaView(typeFilter = null) {
            const uid = this.state.currentUser ? this.state.currentUser.uid : null;
            if (!uid) return `<div style="text-align:center; padding:80px 20px; color:#888;"><i class="fas fa-lock" style="font-size:3rem; margin-bottom:15px; opacity:0.1;"></i><br><h3 style="color:#64748b;">ACCESO RESTRINGIDO</h3><p style="font-size:0.85rem;">Inicia sesión para ver tu agenda.</p></div>`;

            const todayStr = this.getTodayStr();
            const allSorted = this.getAllSortedEvents();
            const myEvents = allSorted.filter(e => {
                if (typeFilter) {
                    const isType = typeFilter === 'americana' 
                        ? (e.type === 'americana' || (!e.type && !e.name?.toUpperCase().includes('ENTRENO')))
                        : (e.type === 'entreno' || e.name?.toUpperCase().includes('ENTRENO'));
                    if (!isType) return false;
                }
                if (this.isEventFinished(e)) return false;
                const players = e.players || e.registeredPlayers || [];
                return players.some(p => p.uid === uid || p.id === uid);
            });

            // Eventos con plazas abiertas recomendados si la agenda está libre (solo activos y no finalizados)
            const availableEvents = allSorted.filter(e => {
                if (this.isEventFinished(e)) return false;
                if (!['open', 'upcoming', 'scheduled'].includes(e.status)) return false;
                const players = e.players || e.registeredPlayers || [];
                return !players.some(p => p.uid === uid || p.id === uid);
            }).slice(0, 3);

            return `
                <div style="padding: 18px 16px 130px; background: linear-gradient(180deg, #f8fafc 0%, #edf2f7 100%); min-height: 85vh; font-family: 'Outfit', sans-serif;">
                    
                    <!-- Header Dinámico y Compacto -->
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; flex-wrap: wrap; gap: 8px;">
                        <div>
                            <span style="background: rgba(204, 255, 0, 0.18); color: #4d7c0f; padding: 4px 10px; border-radius: 8px; font-size: 0.66rem; font-weight: 900; letter-spacing: 0.6px; border: 1px solid rgba(132, 204, 22, 0.35); text-transform: uppercase; display: inline-flex; align-items: center; gap: 4px;">
                                <span>🎯</span> PRÓXIMOS RETOS
                            </span>
                            <h2 style="font-size: 1.85rem; font-weight: 950; color: #0f172a; margin: 6px 0 2px; letter-spacing: -0.5px; line-height: 1.15;">
                                Mi <span style="color: #65a30d;">Agenda</span>
                            </h2>
                            <div style="width: 42px; height: 3px; background: #CCFF00; border-radius: 6px; margin-top: 4px;"></div>
                        </div>
                        <span style="background: ${myEvents.length > 0 ? 'rgba(34,197,94,0.12)' : 'rgba(241,245,249,0.9)'}; color: ${myEvents.length > 0 ? '#15803d' : '#64748b'}; border: 1px solid ${myEvents.length > 0 ? 'rgba(34,197,94,0.3)' : '#cbd5e1'}; padding: 4px 10px; border-radius: 10px; font-size: 0.68rem; font-weight: 900; letter-spacing: 0.4px;">
                            ${myEvents.length > 0 ? `🟢 ${myEvents.length} ${myEvents.length === 1 ? 'CONVOCATORIA' : 'CONVOCATORIAS'}` : '⚪ 0 PARTIDOS'}
                        </span>
                    </div>

                    ${myEvents.length === 0 ? `
                        <!-- Tarjeta de Estado Vacío Evolucionada Pro -->
                        <div style="background: #ffffff; border-radius: 24px; border: 1.5px solid #e2e8f0; padding: 22px 18px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); text-align: center; position: relative; overflow: hidden;">
                            <!-- Glows sutiles decorativos -->
                            <div style="position: absolute; top: -35px; right: -35px; width: 130px; height: 130px; background: radial-gradient(circle, rgba(204,255,0,0.22) 0%, transparent 70%); border-radius: 50%; pointer-events: none;"></div>
                            <div style="position: absolute; bottom: -35px; left: -35px; width: 130px; height: 130px; background: radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%); border-radius: 50%; pointer-events: none;"></div>

                            <div style="position: relative; z-index: 2;">
                                <!-- Icono Deportivo con Aura Neón -->
                                <div style="width: 66px; height: 66px; background: linear-gradient(135deg, #090e1a 0%, #1e293b 100%); border: 2px solid #CCFF00; box-shadow: 0 0 20px rgba(204,255,0,0.35); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px;">
                                    <span style="font-size: 1.85rem; line-height: 1;">🎾</span>
                                </div>
                                
                                <span style="background: rgba(204, 255, 0, 0.18); color: #4d7c0f; border: 1px solid rgba(204, 255, 0, 0.4); font-size: 0.64rem; font-weight: 900; padding: 3px 9px; border-radius: 8px; letter-spacing: 0.5px; text-transform: uppercase;">
                                    AGENDA DESPEJADA
                                </span>

                                <h3 style="color: #0f172a; font-weight: 950; font-size: 1.25rem; margin: 8px 0 4px; letter-spacing: -0.3px;">TU PALA ESTÁ EN DESCANSO</h3>
                                <p style="color: #64748b; font-size: 0.78rem; line-height: 1.4; margin: 0 auto 16px; max-width: 310px;">
                                    No tienes partidos asignados. Reserva tu plaza en los eventos abiertos y sigue sumando puntos al ranking oficial.
                                </p>

                                <!-- Grid de Acciones Principales (Dual CTA) -->
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: ${availableEvents.length > 0 ? '16px' : '4px'};">
                                    <button onclick="window.PlayerView?.haptic?.(15); window.EventsController.setTab('events');" style="background: #CCFF00; color: #000000; border: none; padding: 12px 10px; border-radius: 12px; font-weight: 950; font-size: 0.75rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 4px 12px rgba(204,255,0,0.35); transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='none'">
                                        <span>🏆</span> AMERICANAS
                                    </button>
                                    <button onclick="window.PlayerView?.haptic?.(15); window.EventsController.setTab('entrenos');" style="background: #0f172a; color: #ffffff; border: 1px solid rgba(255,255,255,0.12); padding: 12px 10px; border-radius: 12px; font-weight: 950; font-size: 0.75rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 4px 12px rgba(15,23,42,0.2); transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='none'">
                                        <span>🎯</span> ENTRENOS & POZOS
                                    </button>
                                </div>

                                <!-- Sugerencias de eventos con plazas abiertas -->
                                ${availableEvents.length > 0 ? `
                                    <div style="border-top: 1px dashed #e2e8f0; padding-top: 14px; text-align: left;">
                                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                            <span style="font-size: 0.66rem; font-weight: 900; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 4px;">
                                                <span style="color: #eab308;">⚡</span> PLAZAS ABIERTAS RECOMENDADAS
                                            </span>
                                            <span style="font-size: 0.62rem; color: #65a30d; font-weight: 800;">INSCRIPCIÓN ACTIVA</span>
                                        </div>

                                        <div style="display: flex; flex-direction: column; gap: 8px;">
                                            ${availableEvents.map(evt => {
                                                const times = this._parseDate(evt.date);
                                                const d = times ? times.start : new Date();
                                                const dateBadge = `${d.getDate()}/${d.getMonth()+1}`;
                                                const maxCourts = parseInt(evt.max_courts || evt.courts || 0);
                                                const maxP = maxCourts > 0 ? (maxCourts * 4) : parseInt(evt.max_players || evt.maxPlayers || 16);
                                                const regP = (evt.players || evt.registeredPlayers || []).length;
                                                const spotsLeft = Math.max(0, maxP - regP);
                                                const isEntreno = evt.type === 'entreno' || (evt.name || '').toUpperCase().includes('ENTRENO');

                                                return `
                                                    <div onclick="window.PlayerView?.haptic?.(15); window.EventsController.openLiveEvent('${evt.id}', '${evt.type || (isEntreno ? 'entreno' : 'americana')}');" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 8px 10px; display: flex; align-items: center; justify-content: space-between; gap: 8px; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.borderColor='#3b82f6'; this.style.background='#f0fdf4';" onmouseout="this.style.borderColor='#e2e8f0'; this.style.background='#f8fafc';">
                                                        <div style="display: flex; align-items: center; gap: 8px; min-width: 0;">
                                                            <div style="background: #0f172a; color: #CCFF00; padding: 3px 6px; border-radius: 7px; font-size: 0.64rem; font-weight: 900; text-align: center; line-height: 1.1; flex-shrink: 0;">
                                                                <div>${dateBadge}</div>
                                                                <div style="font-size: 0.58rem; color: #fff; opacity: 0.85;">${this.formatEventTime(evt)}</div>
                                                            </div>
                                                            <div style="min-width: 0;">
                                                                <div style="font-size: 0.80rem; font-weight: 900; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${evt.name}</div>
                                                                <div style="font-size: 0.66rem; color: #64748b; font-weight: 600;">${isEntreno ? 'Entreno (Pozo)' : 'Americana'} • <span style="color: ${spotsLeft <= 4 ? '#ef4444' : '#15803d'}; font-weight: 800;">${spotsLeft} plazas libres</span></div>
                                                            </div>
                                                        </div>
                                                        <span style="background: #0f172a; color: #CCFF00; font-size: 0.62rem; font-weight: 900; padding: 5px 8px; border-radius: 7px; flex-shrink: 0; display: inline-flex; align-items: center; gap: 2px;">
                                                            VER ➜
                                                        </span>
                                                    </div>
                                                `;
                                            }).join('')}
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    ` : `
                        <div style="padding-bottom: 120px; display: flex; flex-direction: column; gap: 0px; position: relative;">
                            <!-- Línea vertical del Timeline -->
                            <div style="position: absolute; left: 30px; top: 10px; bottom: 40px; width: 2px; background: linear-gradient(to bottom, #CCFF00, #e2e8f0); z-index: 1;"></div>
                            
                            ${myEvents.map((evt, idx) => {
                                const times = this._parseDate(evt.date);
                                const d = times ? times.start : new Date();
                                const isLive = evt.status === 'live';

                                return `
                                    <div style="display: flex; gap: 14px; margin-bottom: 22px; position: relative; z-index: 2;">
                                        <div style="min-width: 58px; height: 58px; background: ${isLive ? '#CCFF00' : 'white'}; border: 2.5px solid ${isLive ? '#CCFF00' : '#e2e8f0'}; border-radius: 16px; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 6px 14px rgba(0,0,0,0.06); flex-shrink: 0;">
                                            <span style="font-size: 0.62rem; font-weight: 900; color: ${isLive ? '#000' : '#94a3b8'}; text-transform: uppercase;">${d.toLocaleDateString('es-ES', { month: 'short' })}</span>
                                            <span style="font-size: 1.3rem; font-weight: 950; color: ${isLive ? '#000' : '#0f172a'}; line-height: 1;">${d.getDate()}</span>
                                        </div>
                                        <div style="flex: 1; min-width: 0; background: white; border-radius: 20px; padding: 16px 18px; border: 1.5px solid ${isLive ? '#CCFF00' : '#e2e8f0'}; box-shadow: 0 8px 20px rgba(0,0,0,0.03); position: relative; overflow: hidden;">
                                            ${isLive ? `<div style="position: absolute; top: 0; right: 0; background: #FF2D55; color: white; padding: 3px 10px; font-size: 0.58rem; font-weight: 900; border-bottom-left-radius: 10px; animation: pulse 2s infinite;">LIVE NOW</div>` : ''}
                                            
                                            <div style="font-size: 0.62rem; font-weight: 800; color: #84cc16; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.8px;">${evt.type === 'entreno' ? 'Entreno' : 'Americana'}</div>
                                            <h3 style="margin: 0; font-size: 1.05rem; color: #0f172a; font-weight: 900; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${evt.name}</h3>
                                            
                                            <div style="display: flex; gap: 12px; margin: 10px 0 14px; color: #64748b; font-size: 0.76rem; font-weight: 600;">
                                                <span><i class="far fa-clock" style="color: #65a30d; margin-right: 4px;"></i> ${this.formatEventTime(evt)}</span>
                                                <span><i class="fas fa-map-marker-alt" style="color: #94a3b8; margin-right: 4px;"></i> SomosPadel BCN</span>
                                            </div>
                                            
                                            <button onclick="window.PlayerView?.haptic?.(15); window.EventsController.openLiveEvent('${evt.id}', '${evt.type || 'americana'}');" 
                                                    style="width: 100%; padding: 11px; background: ${isLive ? '#CCFF00' : '#0f172a'}; color: ${isLive ? '#000' : '#fff'}; border: none; border-radius: 12px; font-weight: 900; font-size: 0.80rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; box-shadow: ${isLive ? '0 4px 12px rgba(204,255,0,0.3)' : 'none'};">
                                                ${isLive ? '<i class="fas fa-play"></i> ENTRAR EN PISTA' : 'GESTIONAR MI PLAZA ➜'}
                                            </button>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                            
                            <!-- GEOLOCALIZACIÓN RADAR -->
                            <div id="geo-radar-root" style="width: 100%; max-width: 500px; margin: 15px auto 40px; animation: floatUp 0.8s ease-out forwards;">
                                <!-- Cargado vía JS -->
                            </div>
                        </div>
                    `}
                </div>
            `;
        }

        async renderWeatherAndRadarView() {
            let weatherData = [];
            if (window.WeatherService) {
                try {
                    weatherData = await window.WeatherService.getDashboardWeather();
                } catch (e) {
                    console.error("[EventsController] Error obteniendo datos del tiempo:", e);
                }
            }

            if (!weatherData || weatherData.length === 0) {
                weatherData = [
                    {
                        name: 'EL PRAT',
                        temp: 22,
                        icon: '🌙',
                        condition: 'Despejado',
                        wind: 12,
                        humidity: 58,
                        rainProb: 0,
                        uv: 0,
                        pressure: 1016,
                        visibility: 10,
                        isPropitious: true,
                        intelligence: {
                            score: 100,
                            ballSpeed: 'RÁPIDA (+12%)',
                            gripStatus: 'ÓPTIMO (92%)',
                            recommendation: 'Condiciones excelentes en El Prat. Bote vivo y cristales secos ideales para remates x3 y salidas de pared agresivas.'
                        }
                    },
                    {
                        name: 'CORNELLÀ',
                        temp: 20,
                        icon: '🌙',
                        condition: 'Despejado',
                        wind: 10,
                        humidity: 62,
                        rainProb: 0,
                        uv: 0,
                        pressure: 1016,
                        visibility: 10,
                        isPropitious: true,
                        intelligence: {
                            score: 100,
                            ballSpeed: 'MEDIA-ALTA (+8%)',
                            gripStatus: 'ÓPTIMO (95%)',
                            recommendation: 'Excelente temperatura y agarre en Cornellà. La bola mantiene buena presión y el césped ofrece tracción máxima.'
                        }
                    }
                ];
            }

            let cardsHtml = '';
            weatherData.forEach(w => {
                const safeCityId = (w.name || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "-");
                const intel = w.intelligence || { score: 100, ballSpeed: 'Óptima', gripStatus: 'Óptimo', recommendation: 'Condiciones de pista favorables para jugar.' };
                const isPropitious = w.isPropitious !== false;
                const statusLabel = isPropitious ? 'ÓPTIMO' : 'ADVERSO';
                const statusColor = isPropitious ? '#00E36D' : '#FF2D55';
                const rainProb = parseInt(w.rainProb) || 0;
                const isRaining = rainProb > 30;

                let cardBg = isRaining 
                    ? 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)' 
                    : (isPropitious ? 'linear-gradient(135deg, #2d4f13 0%, #063122 100%)' : 'linear-gradient(135deg, #334155 0%, #0f172a 100%)');

                cardsHtml += `
                    <div style="
                        background: ${cardBg};
                        border: 1px solid rgba(255,255,255,0.12);
                        border-radius: 28px;
                        padding: 22px 18px;
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                        box-shadow: 0 16px 36px rgba(0,0,0,0.5);
                        position: relative;
                        overflow: hidden;
                        transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    ">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; position: relative; z-index: 2;">
                            <div style="font-size: 3.2rem; line-height: 1; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.3));">${w.icon || '☀️'}</div>
                            <div style="text-align: right;">
                                <div style="background: rgba(0,0,0,0.4); color: ${statusColor}; padding: 5px 12px; border-radius: 10px; font-size: 0.65rem; font-weight: 950; border: 1px solid ${statusColor}50; margin-bottom: 4px; display: inline-block;">${statusLabel}</div>
                                <div style="font-size: 0.62rem; color: #ffffff; opacity: 0.75; font-weight: 800; letter-spacing: 0.8px;">SCORE ${intel.score || 100}%</div>
                            </div>
                        </div>

                        <div style="position: relative; z-index: 2; margin-top: 6px; display: flex; justify-content: space-between; align-items: flex-end;">
                            <div>
                                <div style="color: #ffffff; font-weight: 950; font-size: 2.6rem; line-height: 0.95; letter-spacing: -1.5px;">${w.temp}°C</div>
                                <div style="color: rgba(255,255,255,0.8); font-size: 0.78rem; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 6px;">${w.name}</div>
                            </div>
                            <button onclick="event.stopPropagation(); window.toggleWeatherDetails('${safeCityId}')" 
                                    id="weather-btn-${safeCityId}" 
                                    style="background: rgba(255,255,255,0.14); border: 1px solid rgba(255,255,255,0.25); color: white; border-radius: 12px; padding: 7px 12px; font-size: 0.65rem; font-weight: 900; cursor: pointer; display: flex; align-items: center; gap: 5px; transition: all 0.2s; backdrop-filter: blur(6px);">
                                Ver más <i class="fas fa-chevron-down" id="weather-icon-${safeCityId}"></i>
                            </button>
                        </div>

                        <div id="weather-details-${safeCityId}" style="display: none; flex-direction: column; gap: 8px; margin-top: 10px; background: rgba(0, 0, 0, 0.35); border-radius: 16px; padding: 12px 14px; border: 1px solid rgba(255,255,255,0.08); position: relative; z-index: 2;">
                            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 6px;">
                                <span style="font-size: 0.58rem; color: rgba(255,255,255,0.65); font-weight: 800; text-transform: uppercase; display:flex; align-items:center; gap:5px;"><i class="fas fa-bolt" style="color:#fbbf24;"></i> VELOCIDAD BOLA</span>
                                <span style="font-size: 0.68rem; color: #fbbf24; font-weight: 950;">${intel.ballSpeed || '--'}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 6px;">
                                <span style="font-size: 0.58rem; color: rgba(255,255,255,0.65); font-weight: 800; text-transform: uppercase; display:flex; align-items:center; gap:5px;"><i class="fas fa-wind" style="color:#0ea5e9;"></i> VIENTO</span>
                                <span style="font-size: 0.68rem; color: white; font-weight: 900;">${w.wind} km/h</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 6px;">
                                <span style="font-size: 0.58rem; color: rgba(255,255,255,0.65); font-weight: 800; text-transform: uppercase; display:flex; align-items:center; gap:5px;"><i class="fas fa-tint" style="color:#38bdf8;"></i> HUMEDAD</span>
                                <span style="font-size: 0.68rem; color: white; font-weight: 900;">${w.humidity}%</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="font-size: 0.58rem; color: rgba(255,255,255,0.65); font-weight: 800; text-transform: uppercase; display:flex; align-items:center; gap:5px;"><i class="fas fa-hand-rock" style="color:#00E36D;"></i> AGARRE PISTA</span>
                                <span style="font-size: 0.68rem; color: #00E36D; font-weight: 950;">${intel.gripStatus || 'ÓPTIMO'}</span>
                            </div>
                        </div>

                        <div id="weather-insight-${safeCityId}" style="display: none; margin-top: 8px; padding: 10px 12px; background: rgba(0,0,0,0.3); border-radius: 12px; border-left: 3px solid ${statusColor};">
                            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                                <i class="fas fa-brain" style="font-size: 0.6rem; color: ${statusColor};"></i>
                                <span style="font-size: 0.55rem; font-weight: 950; color: ${statusColor}; letter-spacing: 0.5px; text-transform: uppercase;">INSIGHT TÁCTICO</span>
                            </div>
                            <p style="margin: 0; font-size: 0.68rem; color: rgba(255,255,255,0.8); font-weight: 600; line-height: 1.4;">
                                ${intel.recommendation || ''}
                            </p>
                        </div>
                    </div>
                `;
            });

            return `
                <div class="weather-and-radar-container" style="max-width: 1000px; margin: 0 auto; padding: 0 16px 40px; box-sizing: border-box; animation: fadeIn 0.3s ease-out;">
                    <!-- Cabecera de Sección -->
                    <div style="background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%); border: 1.5px solid rgba(255, 255, 255, 0.1); border-radius: 24px; padding: 20px 22px; margin-bottom: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.35); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
                        <div>
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                                <span style="background: rgba(204, 255, 0, 0.15); color: #CCFF00; padding: 4px 10px; border-radius: 8px; font-size: 0.65rem; font-weight: 950; letter-spacing: 0.5px; text-transform: uppercase;">
                                    <i class="fas fa-satellite-dish" style="margin-right: 4px;"></i> LIVE TELEMETRY
                                </span>
                                <span style="display: inline-flex; align-items: center; gap: 5px; font-size: 0.62rem; color: #00E36D; font-weight: 900;">
                                    <span style="width: 7px; height: 7px; background: #00E36D; border-radius: 50%; box-shadow: 0 0 8px #00E36D;"></span> TIEMPO REAL
                                </span>
                            </div>
                            <h2 style="margin: 0; color: #ffffff; font-size: 1.35rem; font-weight: 950; letter-spacing: -0.5px;">Condiciones de Pista & Radar</h2>
                            <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 0.78rem; font-weight: 600;">Sedes oficiales SomosPadel: El Prat de Llobregat y Cornellà</p>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button onclick="window.Router?.navigate('americanas')" style="background: rgba(204,255,0,0.12); border: 1px solid rgba(204,255,0,0.35); color: #CCFF00; padding: 8px 14px; border-radius: 12px; font-size: 0.72rem; font-weight: 900; cursor: pointer; transition: all 0.2s;">
                                🏆 Americanas
                            </button>
                            <button onclick="window.Router?.navigate('entrenos')" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #ffffff; padding: 8px 14px; border-radius: 12px; font-size: 0.72rem; font-weight: 900; cursor: pointer; transition: all 0.2s;">
                                🎾 Entrenos
                            </button>
                        </div>
                    </div>

                    <!-- Tarjetas de las 2 Sedes -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; margin-bottom: 22px;">
                        ${cardsHtml}
                    </div>

                    <!-- Radar Táctico WAR ROOM Windy -->
                    <div style="position: relative; border-radius: 28px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.12); background: #0f172a; box-shadow: 0 20px 45px rgba(0,0,0,0.6); margin-bottom: 22px;">
                        <div style="background: linear-gradient(90deg, #0f172a 0%, #1e293b 100%); padding: 14px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08);">
                            <div style="display:flex; align-items:center; gap:10px;">
                                <i class="fas fa-radar" style="color: #CCFF00; font-size: 0.9rem;"></i>
                                <span style="font-size:0.8rem; font-weight:950; color:white; letter-spacing:0.5px;">RADAR METEOROLÓGICO <span style="color:#CCFF00;">WAR ROOM</span></span>
                            </div>
                            <div style="display:flex; align-items:center; gap:8px;">
                                <button onclick="window.toggleTacticalHUD()" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.22); color: #fff; padding: 6px 12px; border-radius: 10px; font-size: 0.65rem; font-weight: 900; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s;">
                                    <i class="fas fa-eye"></i> TACTICAL HUD
                                </button>
                                <span style="width:8px; height:8px; background:#00E36D; border-radius:50%; box-shadow: 0 0 10px #00E36D;"></span>
                                <span style="font-size:0.62rem; color: #00E36D; font-weight: 900; letter-spacing:1px;">SCANNING</span>
                            </div>
                        </div>

                        <div style="width: 100%; height: 350px; position: relative;">
                            <iframe width="100%" height="100%" src="https://embed.windy.com/embed2.html?lat=41.320&lon=2.040&zoom=10&level=surface&overlay=radar&product=radar&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1" frameborder="0" style="filter: contrast(1.1) brightness(0.85) grayscale(0.2);" loading="lazy"></iframe>
                            
                            <!-- Overlay oscuro y viñeteado -->
                            <div style="pointer-events:none; position:absolute; inset:0; box-shadow: inset 0 0 60px rgba(0,0,0,0.85); background: radial-gradient(circle at 50% 50%, transparent 65%, rgba(204,255,0,0.03) 100%);"></div>

                            <!-- HUD Grip -->
                            <div id="tactical-hud-grip" style="position:absolute; top:16px; left:16px; background:rgba(10,15,28,0.92); backdrop-filter:blur(16px); padding:10px 14px; border-radius:12px; border-left:3.5px solid #00E36D; pointer-events:none; display: none; z-index: 50; box-shadow: 0 10px 30px rgba(0,0,0,0.6);">
                                <div style="font-size:0.52rem; color:#94a3b8; font-weight:900; text-transform:uppercase; letter-spacing:1px;">ESTADO DE PISTA</div>
                                <div style="font-size:0.82rem; color:#fff; font-weight:1000;">GRIP: <span style="color:#00E36D;">ÓPTIMO (92%)</span></div>
                                <div style="font-size:0.5rem; color:rgba(255,255,255,0.5); font-weight:700; margin-top:3px;">Riesgo pista húmeda: Bajo (&lt;10%)</div>
                            </div>

                            <!-- HUD Bounce -->
                            <div id="tactical-hud-bounce" style="position:absolute; top:16px; right:16px; background:rgba(10,15,28,0.92); backdrop-filter:blur(16px); padding:10px 14px; border-radius:12px; border-right:3.5px solid #CCFF00; pointer-events:none; text-align:right; display: none; z-index: 50; box-shadow: 0 10px 30px rgba(0,0,0,0.6);">
                                <div style="font-size:0.52rem; color:#94a3b8; font-weight:900; text-transform:uppercase; letter-spacing:1px;">INTELIGENCIA BOLA</div>
                                <div style="font-size:0.82rem; color:#fff; font-weight:1000;">REBOTE: <span style="color:#CCFF00;">VIVO (+12%)</span></div>
                                <div style="font-size:0.5rem; color:rgba(255,255,255,0.5); font-weight:700; margin-top:3px;">Presión y reactividad en cristal</div>
                            </div>
                        </div>
                    </div>

                    <!-- Consejos Tácticos de Pádel según Clima -->
                    <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(255,255,255,0.08); border-radius: 22px; padding: 20px; box-shadow: 0 8px 24px rgba(0,0,0,0.3);">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                            <i class="fas fa-lightbulb" style="color: #CCFF00; font-size: 0.9rem;"></i>
                            <span style="color: #ffffff; font-weight: 950; font-size: 0.85rem; letter-spacing: 0.3px; text-transform: uppercase;">
                                Claves de Juego según el Clima en Barcelona
                            </span>
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px;">
                            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 14px; padding: 12px 14px;">
                                <div style="color: #38bdf8; font-weight: 900; font-size: 0.75rem; margin-bottom: 4px;">💧 Humedad y Cristales</div>
                                <div style="color: #94a3b8; font-size: 0.7rem; line-height: 1.45; font-weight: 600;">
                                    Si la humedad supera el 70%, la bola resbala en los cristales y cae más rápido. Juega con golpes más planos y anticipa la bajada.
                                </div>
                            </div>
                            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 14px; padding: 12px 14px;">
                                <div style="color: #facc15; font-weight: 900; font-size: 0.75rem; margin-bottom: 4px;">☀️ Temperatura y Presión</div>
                                <div style="color: #94a3b8; font-size: 0.7rem; line-height: 1.45; font-weight: 600;">
                                    Con temperaturas templadas (&gt;20°C) la goma de la pala y el aire interno de la bola se expanden, facilitando remates por 3 y mayor pegada.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        toggleWeatherDetails(safeCityId) {
            const details = document.getElementById(`weather-details-${safeCityId}`);
            const insight = document.getElementById(`weather-insight-${safeCityId}`);
            const icon = document.getElementById(`weather-icon-${safeCityId}`);
            if (details) {
                const isHidden = details.style.display === 'none' || !details.style.display;
                details.style.display = isHidden ? 'flex' : 'none';
                if (insight) insight.style.display = isHidden ? 'block' : 'none';
                if (icon) {
                    icon.className = isHidden ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
                }
            }
        }

        toggleTacticalHUD() {
            const grip = document.getElementById('tactical-hud-grip');
            const bounce = document.getElementById('tactical-hud-bounce');
            if (grip && bounce) {
                const isVisible = grip.style.display === 'block';
                grip.style.display = isVisible ? 'none' : 'block';
                bounce.style.display = isVisible ? 'none' : 'block';
            }
        }

        renderFinishedView(typeFilter = null) {
            const todayStr = this.getTodayStr();
            const { month, category } = this.state.filters;
            const isAmericana = typeFilter === 'americana';
            
            // ✅ Logic: Archive includes explicitly finished/cancelled events OR events that have passed date/time
            let finishedEvents = this.getAllSortedEvents().filter(e => {
                if (typeFilter) {
                    const isType = isAmericana 
                        ? (e.type === 'americana' || (!e.type && !e.name?.toUpperCase().includes('ENTRENO')))
                        : (e.type === 'entreno' || e.name?.toUpperCase().includes('ENTRENO'));
                    if (!isType) return false;
                }
                return this.isEventFinished(e);
            });
            
            const totalCount = finishedEvents.length;

            // Apply Filters
            if (month !== 'all') finishedEvents = finishedEvents.filter(e => e.normDate && e.normDate.startsWith(month));
            if (category !== 'all') {
                finishedEvents = finishedEvents.filter(e => {
                    const cat = (e.category || '').toLowerCase();
                    if (category === 'male') return cat === 'male' || cat === 'masculina';
                    if (category === 'female') return cat === 'female' || cat === 'femenina';
                    if (category === 'mixed') return cat === 'mixed' || cat === 'mixta' || cat === 'mixto';
                    return cat === category;
                });
            }
            
            // Sort: Newest first (Descending order)
            finishedEvents = finishedEvents.sort((a, b) => {
                const dateCompare = (b.normDate || '').localeCompare(a.normDate || '');
                if (dateCompare === 0) return (b.time || '').localeCompare(a.time || '');
                return dateCompare;
            });

            // Custom Dark Filter Bar for Premium View
            const monthsRaw = this.getAvailableMonths(this.getAllSortedEvents().filter(e => this.isEventFinished(e)));
            // ✅ Reorder: Newest month first (so it appears 2nd after 'Historial Completo')
            const months = monthsRaw.sort((a, b) => b.localeCompare(a));
            
            const currentMonth = this.state.filters.month;
            const currentCat = this.state.filters.category;
            const monthLabels = { '01': 'ENE', '02': 'FEB', '03': 'MAR', '04': 'ABR', '05': 'MAY', '06': 'JUN', '07': 'JUL', '08': 'AGO', '09': 'SEP', '10': 'OCT', '11': 'NOV', '12': 'DIC' };

            const darkFilterBar = `
                <style>
                    .custom-scroll-archive::-webkit-scrollbar {
                        height: 4px;
                    }
                    .custom-scroll-archive::-webkit-scrollbar-track {
                        background: rgba(255,255,255,0.05);
                        border-radius: 10px;
                    }
                    .custom-scroll-archive::-webkit-scrollbar-thumb {
                        background: #CCFF00;
                        border-radius: 10px;
                        box-shadow: 0 0 10px #CCFF00;
                    }
                </style>
                <div class="archive-filters" style="padding: 10px 0 25px; display: flex; flex-direction: column; gap: 15px; width: 100%; max-width: 100vw; overflow: hidden;">
                    <!-- Month Selectors (Dark) -->
                    <div class="custom-scroll-archive" style="display: flex; gap: 12px; overflow-x: auto; padding-bottom: 12px; -webkit-overflow-scrolling: touch; width: 100%;">
                        <button onclick="window.EventsController.setFilter('month', 'all')" 
                                style="flex-shrink: 0; white-space: nowrap; padding: 12px 22px; border-radius: 12px; font-size: 0.75rem; font-weight: 950; border: 1.5px solid ${currentMonth === 'all' ? '#CCFF00' : 'rgba(255,255,255,0.1)'}; cursor: pointer; transition: all 0.2s; 
                                ${currentMonth === 'all' ? 'background: #CCFF00; color: #000; box-shadow: 0 0 15px rgba(204,255,0,0.3);' : 'background: rgba(255,255,255,0.05); color: #888;'}">HISTORIAL COMPLETO</button>
                        ${months.map(m => {
                            const [year, month] = m.split('-');
                            const label = `${monthLabels[month]} '${year.slice(2)}`;
                            const isActive = currentMonth === m;
                            return `<button onclick="window.EventsController.setFilter('month', '${m}')" style="flex-shrink: 0; white-space: nowrap; padding: 12px 22px; border-radius: 12px; font-size: 0.75rem; font-weight: 950; border: 1.5px solid ${isActive ? '#CCFF00' : 'rgba(255,255,255,0.1)'}; cursor: pointer; transition: all 0.2s; ${isActive ? 'background: #CCFF00; color: #000; box-shadow: 0 0 15px rgba(204,255,0,0.3);' : 'background: rgba(255,255,255,0.05); color: #888;'}">${label}</button>`;
                        }).join('')}
                        <div style="flex-shrink: 0; width: 30px;"></div> <!-- Spacer -->
                    </div>
                    <!-- Category Selectors (Dark) -->
                    <div class="custom-scroll-archive" style="display: flex; gap: 10px; overflow-x: auto; padding-bottom: 8px; -webkit-overflow-scrolling: touch; width: 100%;">
                        <button onclick="window.EventsController.setFilter('category', 'all')" style="flex-shrink: 0; white-space: nowrap; padding: 8px 18px; border-radius: 14px; font-size: 0.7rem; font-weight: 900; border: 1px solid ${currentCat === 'all' ? '#CCFF00' : 'rgba(255,255,255,0.1)'}; cursor: pointer; transition: all 0.2s; ${currentCat === 'all' ? 'background: #CCFF00; color: #000;' : 'background: transparent; color: #64748b;'}">TODAS</button>
                        <button onclick="window.EventsController.setFilter('category', 'male')" style="flex-shrink: 0; white-space: nowrap; padding: 8px 18px; border-radius: 14px; font-size: 0.7rem; font-weight: 900; border: 1px solid ${currentCat === 'male' ? '#38bdf8' : 'rgba(255,255,255,0.1)'}; cursor: pointer; transition: all 0.2s; ${currentCat === 'male' ? 'background: #38bdf8; color: #000;' : 'background: transparent; color: #64748b;'}">MASCULINO</button>
                        <button onclick="window.EventsController.setFilter('category', 'female')" style="flex-shrink: 0; white-space: nowrap; padding: 8px 18px; border-radius: 14px; font-size: 0.7rem; font-weight: 900; border: 1px solid ${currentCat === 'female' ? '#ec4899' : 'rgba(255,255,255,0.1)'}; cursor: pointer; transition: all 0.2s; ${currentCat === 'female' ? 'background: #ec4899; color: #000;' : 'background: transparent; color: #64748b;'}">FEMENINO</button>
                        <button onclick="window.EventsController.setFilter('category', 'mixed')" style="flex-shrink: 0; white-space: nowrap; padding: 8px 18px; border-radius: 14px; font-size: 0.7rem; font-weight: 900; border: 1px solid ${currentCat === 'mixed' ? '#eab308' : 'rgba(255,255,255,0.1)'}; cursor: pointer; transition: all 0.2s; ${currentCat === 'mixed' ? 'background: #eab308; color: #000;' : 'background: transparent; color: #64748b;'}">MIXTA</button>
                    </div>
                </div>
            `;

            return `
                <div style="background: #ffffff; min-height: 100vh; padding: 25px 20px 140px; font-family: 'Outfit', sans-serif; position: relative; overflow: hidden;">
                    <!-- Ambient Glow Effects -->
                    <div style="position: absolute; top: -100px; right: -100px; width: 300px; height: 300px; background: radial-gradient(circle, rgba(204,255,0,0.05) 0%, transparent 70%); pointer-events: none;"></div>
                    <div style="position: absolute; bottom: 100px; left: -100px; width: 400px; height: 400px; background: radial-gradient(circle, rgba(56,189,248,0.03) 0%, transparent 70%); pointer-events: none;"></div>

                    <!-- ARCHIVE HEADER -->
                    <div style="margin-bottom: 30px; position: relative; z-index: 2;">
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                            <div style="width: 32px; height: 32px; background: rgba(255,255,255,0.05); border-radius: 8px; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.1);">
                                <i class="fas fa-history" style="color: #64748b; font-size: 0.8rem;"></i>
                            </div>
                            <span style="color: #64748b; font-size: 0.75rem; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">Archivo de Retransmisiones</span>
                        </div>
                        <h2 style="font-size: 2.2rem; font-weight: 950; color: #0a192f; margin: 0; line-height: 1; letter-spacing: -1px;">${isAmericana ? 'AMERICANAS' : 'EVENTOS'} <span style="color: #72a800;">${isAmericana ? 'FINALIZADAS' : 'PASADOS'}</span></h2>
                        <div style="display: flex; align-items: center; gap: 15px; margin-top: 15px;">
                            <div style="background: rgba(255,255,255,0.05); padding: 8px 15px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; gap: 8px;">
                                <i class="fas fa-database" style="color: #CCFF00; font-size: 0.7rem;"></i>
                                <span style="color: #0a192f; font-weight: 800; font-size: 0.8rem;">${totalCount} REGISTROS</span>
                            </div>
                            <div style="height: 4px; flex: 1; background: rgba(255,255,255,0.05); border-radius: 10px;"></div>
                        </div>
                    </div>

                    <!-- DARK FILTER BAR -->
                    ${darkFilterBar}

                    <!-- EVENTS GRID -->
                    <div style="display: flex; flex-direction: column; gap: 20px; position: relative; z-index: 2;">
                        ${finishedEvents.length ? 
                            finishedEvents.map(evt => this.renderCard(evt, true)).join('') : 
                            `
                            <div style="padding: 100px 40px; text-align: center; background: rgba(255,255,255,0.02); border-radius: 30px; border: 2px dashed rgba(255,255,255,0.05); margin-top: 20px;">
                                <div style="width: 80px; height: 80px; background: rgba(255,255,255,0.03); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
                                    <i class="fas fa-search" style="font-size: 2rem; color: rgba(255,255,255,0.1);"></i>
                                </div>
                                <h3 style="color: white; font-weight: 800; margin: 0;">SIN REGISTROS</h3>
                                <p style="color: #64748b; font-size: 0.9rem; margin-top: 10px;">No se encontraron eventos para los filtros seleccionados.</p>
                                <button onclick="window.EventsController.setFilter('month', 'all'); window.EventsController.setFilter('category', 'all');" 
                                        style="margin-top: 25px; background: transparent; border: 1.5px solid #CCFF00; color: #CCFF00; padding: 12px 25px; border-radius: 12px; font-weight: 800; cursor: pointer;">REINICIAR FILTROS</button>
                            </div>
                            `
                        }
                    </div>
                </div>
            `;
        }

        async renderResultsView() {
            const matches = this.state.personalMatches || [];
            const user = this.state.currentUser;

            if (this.state.loadingResults) return '<div style="padding: 100px; text-align: center;"><div class="loader"></div><p style="margin-top:20px; font-weight:900; letter-spacing:2px;">CARGANDO RESULTADOS...</p></div>';
            if (!user) return '<div style="padding:80px; text-align:center; color:white;"><i class="fas fa-lock" style="font-size:3rem; margin-bottom:15px; opacity:0.2;"></i><p>Inicia sesión.</p></div>';

            const realMatches = matches.filter(m => {
                const s1 = parseInt(m.score_a || 0), s2 = parseInt(m.score_b || 0);
                if (s1 === 0 && s2 === 0) return false;
                if ((s1 + s2) < 2) return false;
                const hasNamesA = Array.isArray(m.team_a_names) && m.team_a_names.length > 0;
                const hasNamesB = Array.isArray(m.team_b_names) && m.team_b_names.length > 0;
                return hasNamesA && hasNamesB;
            });

            // === AI OPTIMIZATION: USE CENTRALIZED SERVICE (AUDIT FIX) ===
            let totalMatches = realMatches.length;
            let totalWins = 0;
            let winRate = 0;

            if (window.StandingsService && totalMatches > 0) {
                const stats = window.StandingsService.calculate(realMatches);
                const userStats = stats.find(p => p.uid === user.uid);
                if (userStats) {
                    totalWins = userStats.won;
                    winRate = Math.round((totalWins / totalMatches) * 100);
                }
            }

            return `
                <div style="padding: 20px 15px 120px; background: #080808; min-height: 90vh; font-family: 'Outfit', sans-serif; color: white; text-align: center;">
                    <div style="width: 80px; height: 80px; margin: 20px auto; border-radius: 50%; border: 2px solid #CCFF00; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                        ${user.photoURL ? `<img src="${user.photoURL}" style="width:100%; height:100%; object-fit:cover;">` : `<span style="color:#CCFF00; font-size:2rem;">${(user.name || 'P').charAt(0)}</span>`}
                    </div>
                    <h2>${user.name || 'Jugador'}</h2>
                    ${totalMatches === 0 ? '<p>No hay datos. ¡Juega tu primer torneo!</p>' : `
                        <div style="background: rgba(255,255,255,0.03); border-radius: 20px; padding: 20px; display: flex; justify-content: space-around; margin: 20px 0;">
                            <div><div style="font-size: 1.5rem; color:#CCFF00;">${totalMatches}</div><div>PARTIDOS</div></div>
                            <div><div style="font-size: 1.5rem;">${winRate}%</div><div>WINS</div></div>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 12px;">${(await this.renderMatchCards(realMatches, user))}</div>
                    `}
                </div>
            `;
        }

        renderMatchCards(matches, user) {
            const list = [...matches].reverse();
            return list.map((m) => {
                const s1 = parseInt(m.score_a || 0), s2 = parseInt(m.score_b || 0);
                const isTeamA = m.team_a_ids && m.team_a_ids.includes(user.uid);
                const won = (s1 === s2) ? null : ((isTeamA && s1 > s2) || (!isTeamA && s2 > s1));
                const color = won === null ? '#888' : (won ? '#CCFF00' : '#FF3B30');
                return `
                    <div style="background: #111; border-radius: 12px; height: 60px; display: flex; align-items: center; border-left: 5px solid ${color}; padding: 0 15px; justify-content: space-between;">
                        <span style="font-size:0.8rem;">${(m.team_a_names[0] || '').split(' ')[0]} vs ${(m.team_b_names[0] || '').split(' ')[0]}</span>
                        <div style="background:#222; padding:5px 10px; border-radius:8px;">${s1} - ${s2}</div>
                        <span style="color:${color}; font-weight:900;">${won === null ? '=' : (won ? 'W' : 'L')}</span>
                    </div>`;
            }).join('');
        }

        renderCard(evt, isFinished = false) {
            // ✅ LOGIC BLOCK (Restored)
            const players = (evt.players && evt.players.length > 0) ? evt.players : (evt.registeredPlayers || []);
            const playerCount = players.length;
            const maxCourts = parseInt(evt.max_courts || evt.courts || 4);
            const maxPlayers = maxCourts * 4;
            const user = this.state.currentUser;
            const uid = user ? user.uid : '-';
            const isJoined = players.some(p => p.uid === uid || p.id === uid);
            const isFull = playerCount >= maxPlayers;
            const hasStarted = this.hasEventStarted(evt.date, evt.time, evt.time_end || evt.timeEnd);
            const isLive = evt.status === 'live';
            const isPairing = evt.status === 'pairing';
            const isCancelled = evt.status === 'cancelled';
            const isEntreno = evt.type === 'entreno';

            // Waitlist Logic
            const waitlist = evt.waitlist || [];
            const isWaitlistPending = evt.waitlist_pending_user && (evt.waitlist_pending_user.uid === uid);
            const isInWaitlist = waitlist.some(p => p.uid === uid);
            const waitlistPos = waitlist.findIndex(p => p.uid === uid) + 1;

            // Date Parsing
            const dateObj = this._parseDate(evt.date);
            const dayNum = dateObj ? dateObj.start.getDate() : '--';
            const dayName = dateObj ? dateObj.start.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase().replace('.', '') : '---';

            // Prices Socio & No Socio
            const cleanMoney = (val) => {
                if (val === null || val === undefined || val === '') return null;
                const match = String(val).match(/[0-9]+([.,][0-9]+)?/);
                return match ? match[0].replace(',', '.') : null;
            };

            const numSoc = cleanMoney(evt.price_members ?? evt.price_socio ?? evt.price_member ?? evt.price) ?? '20';
            const numExt = cleanMoney(evt.price_external ?? evt.price_externo ?? evt.price_no_socio) ?? (parseFloat(numSoc) ? String(parseFloat(numSoc) + 2) : '25');
            const priceSoc = numSoc;
            const priceExt = numExt;

            // Category & Format Logic - Robust Category Normalization
            const catType = this.getNormalizedCategory(evt);

            let categoryLabel = 'MASCULINO';
            let categoryIcon = 'fa-mars';
            let categoryColor = '#38bdf8'; // Electric Sky Blue
            let categoryGradient = 'linear-gradient(90deg, #0284c7 0%, #38bdf8 100%)';
            let catCardClass = 'card-theme-male';
            let catBg = 'linear-gradient(145deg, #0d1726 0%, #080d17 100%)';
            let catFadeBottom = '#080d17';

            if (catType === 'female') {
                categoryLabel = 'FEMENINO';
                categoryIcon = 'fa-venus';
                categoryColor = '#ec4899'; // Neon Pink / Fuchsia
                categoryGradient = 'linear-gradient(90deg, #db2777 0%, #ec4899 100%)';
                catCardClass = 'card-theme-female';
                catBg = 'linear-gradient(145deg, #220d1c 0%, #120610 100%)';
                catFadeBottom = '#120610';
            } else if (catType === 'mixed') {
                categoryLabel = 'MIXTO';
                categoryIcon = 'fa-venus-mars';
                categoryColor = '#f59e0b'; // Electric Golden Amber
                categoryGradient = 'linear-gradient(90deg, #d97706 0%, #fbbf24 100%)';
                catCardClass = 'card-theme-mixed';
                catBg = 'linear-gradient(145deg, #1d150b 0%, #100c06 100%)';
                catFadeBottom = '#100c06';
            } else if (catType === 'open') {
                categoryLabel = 'OPEN';
                categoryIcon = 'fa-globe';
                categoryColor = '#84cc16'; // Neon Lime
                categoryGradient = 'linear-gradient(90deg, #65a30d 0%, #a3e635 100%)';
                catCardClass = 'card-theme-open';
                catBg = 'linear-gradient(145deg, #111a0c 0%, #091007 100%)';
                catFadeBottom = '#091007';
            }

            const mode = (evt.pair_mode || evt.format || '').toLowerCase();
            const nameUpper = (evt.name || '').toUpperCase();
            let isSwiss = mode === 'swiss' || nameUpper.includes('SUIZ');
            let isTwister = !isSwiss && (nameUpper.includes('TWISTER') || mode.includes('twister') || mode.includes('rotating') || mode.includes('rotativo'));
            let isFixed = !isSwiss && (mode === 'fixed' || nameUpper.includes('FIJA'));

            let formatLabel = 'PAREJA FIJA', formatColor = '#a855f7';
            if (isSwiss) {
                formatLabel = isEntreno ? '🇨🇭 ENTRENO SUIZO' : '🇨🇭 SUIZA';
                formatColor = '#ef4444';
            } else if (isTwister) {
                formatLabel = 'TWISTER';
                formatColor = '#38bdf8';
            }

            // Time Formatting
            const times = this._parseDate(evt.date, evt.time, evt.time_end || evt.timeEnd);
            let timeLabel = this.formatEventTime(evt);

            // Gender Check (Centralized, Strict and Unified)
            const genderCheck = this.checkGenderEligibility(evt, user);
            const isGenderMismatch = !genderCheck.eligible;
            const mismatchCase = genderCheck.mismatchCase;

            // Comprobación de Privacidad (Americana Privada con Contraseña)
            const isEventPrivate = (evt.is_private === true || evt.is_private === 'true');
            const isEventUnlocked = this.isAmericanaUnlocked(evt);

            // Button Logic
            let cardAction = `window.EventsController.openLiveEvent('${evt.id}', '${evt.type || 'americana'}')`;
            let fabAction = cardAction, btnLabel = 'ENTRAR', btnIcon = 'fa-play', btnColor = '#CCFF00';

            const isAmericanasOnlyUser = this.state.currentUser && this.state.currentUser.role === 'player_americanas';

            if (isCancelled) {
                btnLabel = 'ANULADO'; btnIcon = 'fa-ban'; btnColor = '#ef4444';
                cardAction = "window.PremiumModal.alert({ title: '⛔ ANULADO', message: 'Este evento ha sido cancelado.', type: 'error' })";
                fabAction = cardAction;
            } else if (isFinished || evt.status === 'finished') {
                btnLabel = 'VER'; btnIcon = 'fa-history'; btnColor = '#64748b';
                cardAction = `window.openResultsView('${evt.id}', '${evt.type || 'americana'}')`;
                fabAction = cardAction;
            } else if (isLive) {
                btnLabel = 'LIVE'; btnIcon = 'fa-broadcast-tower'; btnColor = '#FF2D55';
            } else if (isWaitlistPending) {
                btnLabel = 'CONFIRMAR'; btnIcon = 'fa-star'; btnColor = '#CCFF00';
                fabAction = `window.EventsController.confirmWaitlist('${evt.id}', '${evt.type || 'americana'}')`;
            } else if (isEntreno && isAmericanasOnlyUser && !isJoined) {
                btnLabel = 'SOLO AMERICANAS'; btnIcon = 'fa-lock'; btnColor = '#4b5563';
                fabAction = `window.PremiumModal.alert({ title: '🏆 ACCESO EXCLUSIVO', message: 'Tu perfil de jugador está registrado exclusivamente para Americanas.' })`;
            } else if (isGenderMismatch && !isJoined) {
                btnLabel = genderCheck.buttonLabel || (mismatchCase === 'male' ? 'SOLO CHICOS' : 'SOLO CHICAS'); 
                btnIcon = 'fa-lock'; 
                btnColor = '#4b5563';
                const safeTitle = (genderCheck.title || '⚠️ RESTRICCIÓN').replace(/'/g, "\\'");
                const safeMsg = (genderCheck.message || 'Género no válido.').replace(/'/g, "\\'");
                fabAction = `window.PremiumModal.alert({ title: '${safeTitle}', message: '${safeMsg}', type: 'warning' })`;
            } else if (isInWaitlist) {
                btnLabel = `ESPERA (${waitlistPos})`; btnIcon = 'fa-hourglass-half'; btnColor = '#94a3b8';
                fabAction = `window.EventsController.leaveWaitlist('${evt.id}', '${evt.type || 'americana'}')`;
            } else if (isFull && !isJoined) {
                btnLabel = '🔔 AVISADME DE BAJA'; btnIcon = 'fa-bell'; btnColor = '#eab308';
                fabAction = `window.EventsController.joinWaitlist('${evt.id}', '${evt.type || 'americana'}')`;
            } else if (!isJoined && !isFull) {
                btnLabel = 'APUNTARME'; btnIcon = 'fa-plus'; btnColor = '#CCFF00';
                fabAction = `window.EventsController.joinEvent('${evt.id}', '${evt.type || 'americana'}')`;
            } else if (isJoined) {
                btnLabel = 'DENTRO'; btnIcon = 'fa-check'; btnColor = '#fff';
                fabAction = `window.EventsController.leaveEvent('${evt.id}', '${evt.type || 'americana'}')`;
            }

            // Si es privada y no está desbloqueada por el usuario (y no es admin) -> Bloqueo con contraseña
            if (isEventPrivate && !isEventUnlocked) {
                btnLabel = 'CLAVE ACCESO 🔒';
                btnIcon = 'fa-key';
                btnColor = '#ef4444';
                cardAction = `window.EventsController.promptPrivatePassword('${evt.id}', '${evt.type || 'americana'}', 'view')`;
                fabAction = `window.EventsController.promptPrivatePassword('${evt.id}', '${evt.type || 'americana'}', 'join')`;
            }

            // Calculate progress for plazas bar
            const progress = Math.min((playerCount / maxPlayers) * 100, 100);
            const progressColor = isFull ? '#FF3B30' : (progress > 80 ? '#eab308' : '#CCFF00');

            // 🌈 BROADCAST V7: CATEGORY-THEMED AESTHETIC (Distinct Colors for Male, Female, Mixed)
            const themeColor = isLive ? '#FF2D55' : (isCancelled ? '#ef4444' : categoryGradient);
            
            // Estilos específicos para entrenos y americanas basados en categoría
            const cardBg = catBg;
            const cardBorder = isLive ? '1.5px solid rgba(255, 45, 85, 0.6)' : (isCancelled ? '1px solid rgba(239, 68, 68, 0.3)' : `1.5px solid ${categoryColor}45`);
            const cardGlow = isLive ? '0 20px 40px rgba(0,0,0,0.8), 0 0 30px rgba(255, 45, 85, 0.3)' : `0 20px 40px rgba(0,0,0,0.75), 0 0 25px ${categoryColor}20`;
            const tileClass = isEntreno ? 'entreno-tile-interactive' : 'premium-tile-interactive';
            const cardClass = `${isEntreno ? 'entreno-premium-card' : 'americana-premium-card'} ${catCardClass}`;
            
            // Iconos y colores sincronizados con la categoría
            const timeIconBg = `${categoryColor}20`;
            const timeIconColor = categoryColor;
            const capacityIconColor = categoryColor;
            const locIconBg = `${categoryColor}20`;
            const locIconColor = categoryColor;

            // Estado dinámico
            let statusBg = '';
            let statusColorText = '#fff';
            let statusGlowColor = 'rgba(0,0,0,0.3)';

            if (isLive) {
                statusBg = 'linear-gradient(135deg, #FF2D55, #ff0844)';
                statusGlowColor = '#FF2D5566';
            } else if (isCancelled) {
                statusBg = 'linear-gradient(135deg, #666, #444)';
            } else if (isFinished || evt.status === 'finished') {
                statusBg = 'linear-gradient(135deg, #555, #333)';
            } else {
                statusBg = categoryGradient;
                statusColorText = '#fff';
                statusGlowColor = `${categoryColor}40`;
            }

            // Analizar e integrar recomendador de nivel inteligente (Matchmaking)
            let rawEventLevel = evt.level || null;
            if (!rawEventLevel && (evt.level_min || evt.level_max)) {
                rawEventLevel = evt.level_min && evt.level_max ? `${evt.level_min} - ${evt.level_max}` : (evt.level_min || evt.level_max);
            }
            if (!rawEventLevel && evt.name) {
                const matched = evt.name.match(/\b[1-7]\.[0-9]\b/);
                if (matched) rawEventLevel = matched[0];
            }

            let levelBadgeHtml = '';
            let levelFeedbackHtml = '';
            if (rawEventLevel) {
                levelBadgeHtml = `<span style="background: rgba(255,255,255,0.08); color: #fff; padding: 2.5px 7px; border-radius: 7px; border: 1px solid rgba(255,255,255,0.08); font-size: 0.6rem; font-weight: 800; backdrop-filter: blur(4px); display: inline-flex; align-items: center; gap: 4px;"><i class="fas fa-graduation-cap" style="font-size: 0.55rem;"></i> NIVEL ${rawEventLevel}</span>`;
                
                const userLevelVal = user ? (user.level || user.self_rate_level) : null;
                if (userLevelVal) {
                    const userLvl = parseFloat(userLevelVal);
                    const minLvl = evt.level_min ? parseFloat(evt.level_min) : null;
                    const maxLvl = evt.level_max ? parseFloat(evt.level_max) : null;
                    const singleLvl = parseFloat(rawEventLevel);

                    if (minLvl !== null && maxLvl !== null && !isNaN(minLvl) && !isNaN(maxLvl)) {
                        if (userLvl >= minLvl - 0.25 && userLvl <= maxLvl + 0.25) {
                            levelFeedbackHtml = `<span style="background: linear-gradient(135deg, rgba(234, 179, 8, 0.25) 0%, rgba(202, 138, 4, 0.18) 100%); color: #facc15; border: 1px solid rgba(250, 204, 21, 0.45); padding: 2.5px 7px; border-radius: 7px; font-size: 0.6rem; font-weight: 950; backdrop-filter: blur(4px); display: inline-flex; align-items: center; gap: 3px; box-shadow: 0 2px 8px rgba(234, 179, 8, 0.25); animation: pulse 2.2s infinite;"><i class="fas fa-star" style="color: #facc15; font-size: 0.55rem;"></i> ¡IDEAL!</span>`;
                        } else if (userLvl > maxLvl + 0.25) {
                            levelFeedbackHtml = `<span style="background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); padding: 2.5px 7px; border-radius: 7px; font-size: 0.58rem; font-weight: 850; backdrop-filter: blur(4px); display: inline-flex; align-items: center; gap: 3px;"><i class="fas fa-angle-double-up" style="font-size: 0.55rem;"></i> CÓMODO</span>`;
                        } else {
                            levelFeedbackHtml = `<span style="background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); padding: 2.5px 7px; border-radius: 7px; font-size: 0.58rem; font-weight: 850; backdrop-filter: blur(4px); display: inline-flex; align-items: center; gap: 3px;"><i class="fas fa-exclamation-triangle" style="font-size: 0.55rem;"></i> EXIGENTE</span>`;
                        }
                    } else if (!isNaN(singleLvl)) {
                        const diff = Math.abs(userLvl - singleLvl);
                        if (diff <= 0.35) {
                            levelFeedbackHtml = `<span style="background: linear-gradient(135deg, rgba(234, 179, 8, 0.25) 0%, rgba(202, 138, 4, 0.18) 100%); color: #facc15; border: 1px solid rgba(250, 204, 21, 0.45); padding: 2.5px 7px; border-radius: 7px; font-size: 0.6rem; font-weight: 950; backdrop-filter: blur(4px); display: inline-flex; align-items: center; gap: 3px; box-shadow: 0 2px 8px rgba(234, 179, 8, 0.25); animation: pulse 2.2s infinite;"><i class="fas fa-star" style="color: #facc15; font-size: 0.55rem;"></i> ¡IDEAL!</span>`;
                        } else if (userLvl > singleLvl) {
                            levelFeedbackHtml = `<span style="background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); padding: 2.5px 7px; border-radius: 7px; font-size: 0.58rem; font-weight: 850; backdrop-filter: blur(4px); display: inline-flex; align-items: center; gap: 3px;"><i class="fas fa-angle-double-up" style="font-size: 0.55rem;"></i> CÓMODO</span>`;
                        } else {
                            levelFeedbackHtml = `<span style="background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); padding: 2.5px 7px; border-radius: 7px; font-size: 0.58rem; font-weight: 850; backdrop-filter: blur(4px); display: inline-flex; align-items: center; gap: 3px;"><i class="fas fa-exclamation-triangle" style="font-size: 0.55rem;"></i> EXIGENTE</span>`;
                        }
                    }
                }
            }

            // Bubble Stack de avatares para los primeros jugadores
            const playersList = evt.players || evt.registeredPlayers || [];
            const previewAvatars = playersList.slice(0, 3).map((p, idx) => {
                const photo = p.photoURL || p.photo_url || p.photo;
                const initial = (p.name || 'J').charAt(0).toUpperCase();
                if (photo) {
                    return `<img src="${photo}" alt="Jugador" style="width:20px; height:20px; border-radius:50%; border:1.5px solid #141414; margin-left:${idx === 0 ? '0' : '-6px'}; object-fit:cover; display:inline-block; vertical-align:middle; box-shadow:0 2px 4px rgba(0,0,0,0.4);">`;
                }
                return `<span style="width:20px; height:20px; border-radius:50%; border:1.5px solid #141414; margin-left:${idx === 0 ? '0' : '-6px'}; background:#1e293b; color:#CCFF00; font-size:0.52rem; font-weight:950; display:inline-flex; align-items:center; justify-content:center; vertical-align:middle; box-shadow:0 2px 4px rgba(0,0,0,0.4);">${initial}</span>`;
            }).join('');
            const avatarStackHtml = playersList.length > 0 ? `<div style="display:inline-flex; align-items:center; margin-right:4px; flex-shrink:0;">${previewAvatars}</div>` : '';

            // Indicador de urgencia si quedan 2 o menos plazas
            const remainingSpots = maxPlayers - playerCount;
            let urgencyHtml = '';
            if (!isFull && remainingSpots <= 2 && remainingSpots > 0) {
                urgencyHtml = `<span style="background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); padding: 2px 6px; border-radius: 6px; font-size: 0.55rem; font-weight: 950; letter-spacing: 0.4px; animation: pulse 1.5s infinite;">¡ÚLTIMAS ${remainingSpots}!</span>`;
            }

            const isExpanded = this.isCardExpanded(evt.id);

            // ==========================================
            // 📑 1. VISTA MINIMIZADA / COMPACTA
            // ==========================================
            if (!isExpanded) {
                return `
                    <div id="event-card-${evt.id}" class="${cardClass} card-view-minimized" onclick="window.EventsController.toggleCardExpansion('${evt.id}', event)" style="
                        background: ${cardBg};
                        border-radius: 18px;
                        overflow: hidden;
                        margin-bottom: 9px;
                        border: ${cardBorder};
                        box-shadow: ${cardGlow};
                        font-family: 'Outfit', sans-serif;
                        position: relative;
                        transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
                        cursor: pointer;
                    "
                    onmouseover="this.style.transform='translateY(-2px) scale(1.004)';"
                    onmouseout="this.style.transform='translateY(0) scale(1)';"
                    >
                        <!-- ACCENT STRIPE -->
                        <div style="height: 3px; background: ${themeColor}; opacity: 0.95;"></div>

                        <div style="padding: 10px 12px; display: flex; align-items: center; justify-content: space-between; gap: 10px;">
                            <!-- Left: Date & Time Badge -->
                            <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
                                <div style="background: rgba(15, 23, 42, 0.92); min-width: 44px; height: 48px; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 1.2px solid rgba(255,255,255,0.12); box-shadow: 0 4px 10px rgba(0,0,0,0.3); flex-shrink: 0;">
                                    <span style="font-size: 0.52rem; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.4px;">${dayName}</span>
                                    <span style="font-size: 1.22rem; font-weight: 950; color: #ffffff; line-height: 1;">${dayNum}</span>
                                </div>
                            </div>

                            <!-- Middle: Main Information -->
                            <div style="flex: 1; min-width: 0; overflow: hidden; display: flex; flex-direction: column; gap: 3px;">
                                <!-- Tags row -->
                                <div style="display: flex; align-items: center; gap: 4px; overflow: hidden; white-space: nowrap;">
                                    ${isLive ? `
                                        <span style="background: #FF2D55; color: #fff; padding: 2px 6px; border-radius: 6px; font-size: 0.54rem; font-weight: 950; text-transform: uppercase; animation: status-breathe 1.2s infinite; flex-shrink: 0;">LIVE</span>
                                    ` : (evt.normDate === this.getTodayStr() ? `
                                        <span style="background: linear-gradient(135deg, #f59e0b, #d97706); color: #000; padding: 2px 6px; border-radius: 6px; font-size: 0.54rem; font-weight: 950; flex-shrink: 0;">¡HOY!</span>
                                    ` : '')}

                                    <span style="background: ${categoryColor}25; color: ${categoryColor}; border: 1px solid ${categoryColor}40; padding: 1.5px 6px; border-radius: 6px; font-size: 0.56rem; font-weight: 900; text-transform: uppercase; flex-shrink: 0;">
                                        <i class="fas ${categoryIcon}" style="font-size: 0.52rem; margin-right: 2px;"></i> ${categoryLabel}
                                    </span>

                                    <span style="background: rgba(255,255,255,0.07); color: #e2e8f0; border: 1px solid rgba(255,255,255,0.1); padding: 1.5px 6px; border-radius: 6px; font-size: 0.55rem; font-weight: 850; text-transform: uppercase; flex-shrink: 0;">
                                        ${isSwiss ? '🇨🇭 SUIZO' : (isTwister ? '🌪️ TWISTER' : (isEntreno ? '🥋 ENTRENO' : '👥 PAREJA FIJA'))}
                                    </span>

                                    ${rawEventLevel ? `
                                        <span style="background: rgba(255,255,255,0.06); color: #cbd5e1; border: 1px solid rgba(255,255,255,0.08); padding: 1.5px 5px; border-radius: 6px; font-size: 0.55rem; font-weight: 800; flex-shrink: 0;">
                                            NV ${rawEventLevel}
                                        </span>
                                    ` : ''}

                                    ${levelFeedbackHtml}
                                    ${isEventPrivate ? `
                                        <span style="background: rgba(239,68,68,0.2); color: #f87171; border: 1px solid rgba(239,68,68,0.4); padding: 1.5px 5px; border-radius: 6px; font-size: 0.52rem; font-weight: 900; flex-shrink: 0;">
                                            <i class="fas fa-lock" style="font-size: 0.5rem;"></i>
                                        </span>
                                    ` : ''}
                                </div>

                                <!-- Event Title -->
                                <div style="font-size: 0.86rem; font-weight: 950; color: #ffffff; line-height: 1.2; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: -0.2px;" title="${evt.name}">
                                    ${evt.name}
                                </div>

                                <!-- Micro Meta: Time, Club, Plazas, Price -->
                                <div style="display: flex; align-items: center; gap: 6px; font-size: 0.63rem; color: #94a3b8; font-weight: 600; white-space: nowrap; overflow: hidden;">
                                    <span style="color: #f1f5f9; font-weight: 800; display: inline-flex; align-items: center; gap: 3px; flex-shrink: 0;">
                                        <i class="far fa-clock" style="color: ${timeIconColor}; font-size: 0.58rem;"></i> ${timeLabel}
                                    </span>
                                    <span style="color: rgba(255,255,255,0.2); flex-shrink: 0;">•</span>
                                    <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px; display: inline-flex; align-items: center; gap: 3px; flex-shrink: 1;">
                                        <i class="fas fa-location-dot" style="color: #38bdf8; font-size: 0.58rem;"></i> ${evt.sede || evt.location || 'SomosPadel'}
                                    </span>
                                    <span style="color: rgba(255,255,255,0.2); flex-shrink: 0;">•</span>
                                    <span id="event-players-label-${evt.id}" style="color: ${isFull ? '#ef4444' : '#CCFF00'}; font-weight: 900; flex-shrink: 0;">
                                        ${playerCount}/${maxPlayers} ${isFull ? 'COMPLETO' : 'plz'}
                                    </span>
                                    <i id="event-players-icon-${evt.id}" style="display: none;"></i>
                                    <span style="color: rgba(255,255,255,0.2); flex-shrink: 0;">•</span>
                                    <span style="color: #ffffff; font-weight: 900; flex-shrink: 0;">
                                        ${numSoc}€
                                    </span>
                                </div>
                            </div>

                            <!-- Right: Action Button + Expand Chevron -->
                            <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
                                <button id="event-fab-${evt.id}" 
                                        onclick="event.stopPropagation(); ${fabAction}" 
                                        aria-label="${btnLabel}"
                                        style="
                                            background: ${isLive ? '#FF2D55' : (isJoined ? '#00E36D' : (isGenderMismatch ? 'rgba(255, 255, 255, 0.08)' : (isFull ? '#eab308' : '#CCFF00')))} !important;
                                            color: ${isLive ? '#ffffff' : (isGenderMismatch ? '#94a3b8' : '#000000')} !important;
                                            border: ${isGenderMismatch ? '1px solid rgba(255, 255, 255, 0.15)' : 'none'} !important;
                                            padding: 8px 11px;
                                            border-radius: 11px;
                                            font-size: 0.68rem;
                                            font-weight: 950;
                                            cursor: pointer;
                                            text-transform: uppercase;
                                            letter-spacing: 0.3px;
                                            display: flex;
                                            align-items: center;
                                            gap: 4px;
                                            box-shadow: ${isGenderMismatch ? 'none' : '0 2px 10px rgba(0,0,0,0.3)'};
                                            transition: transform 0.15s ease;
                                        "
                                        onmouseover="this.style.transform='scale(1.04)';"
                                        onmouseout="this.style.transform='scale(1)';"
                                >
                                    <i id="event-fab-icon-${evt.id}" class="fas ${btnIcon}" style="font-size: 0.65rem; color: ${isLive ? '#ffffff' : (isGenderMismatch ? '#94a3b8' : '#000000')} !important;"></i>
                                    <span id="event-fab-label-${evt.id}" style="white-space: nowrap; color: ${isLive ? '#ffffff' : (isGenderMismatch ? '#94a3b8' : '#000000')} !important;">${isGenderMismatch && !isJoined ? btnLabel : (btnLabel === 'CLAVE ACCESO 🔒' ? 'CLAVE' : (btnLabel === 'DENTRO' ? 'DENTRO' : (isFull && !isJoined ? 'ESPERA' : 'UNIRME')))}</span>
                                </button>

                                <!-- Chevron Button for Expand -->
                                <button type="button" 
                                        onclick="window.EventsController.toggleCardExpansion('${evt.id}', event)" 
                                        title="Toca para ver el cartel oficial y todos los detalles"
                                        aria-label="Ampliar detalles"
                                        style="
                                            width: 32px; 
                                            height: 32px; 
                                            border-radius: 10px; 
                                            background: rgba(255, 255, 255, 0.08); 
                                            border: 1px solid rgba(255, 255, 255, 0.12); 
                                            color: #CCFF00; 
                                            display: flex; 
                                            align-items: center; 
                                            justify-content: center; 
                                            cursor: pointer; 
                                            transition: all 0.2s;
                                        "
                                        onmouseover="this.style.background='rgba(204,255,0,0.18)'; this.style.borderColor='#CCFF00';"
                                        onmouseout="this.style.background='rgba(255, 255, 255, 0.08)'; this.style.borderColor='rgba(255, 255, 255, 0.12)';"
                                >
                                    <i class="fas fa-chevron-down" style="font-size: 0.72rem;"></i>
                                </button>
                            </div>
                        </div>

                        <!-- Mini Progress Bar -->
                        <div style="width: 100%; height: 3px; background: rgba(255,255,255,0.06); overflow: hidden;">
                            <div id="event-progress-bar-${evt.id}" style="width: ${progress}%; height: 100%; background: ${progressColor}; transition: width 0.3s ease;"></div>
                        </div>

                        <!-- Hidden compatibility anchors for smartUpdate -->
                        <div id="event-waitlist-label-${evt.id}" style="display: none;"></div>
                        <span id="event-status-badge-${evt.id}" style="display: none;"></span>
                        <span id="event-status-capacity-${evt.id}" style="display: none;"></span>
                    </div>
                `;
            }

            // ==========================================
            // 🗂️ 2. VISTA DETALLADA / COMPLETA
            // ==========================================
            return `
                <div id="event-card-${evt.id}" class="${cardClass} card-view-detailed" onclick="${cardAction}" style="
                    background: ${cardBg};
                    border-radius: 20px;
                    overflow: hidden;
                    margin-bottom: 12px;
                    border: ${cardBorder};
                    box-shadow: ${cardGlow};
                    font-family: 'Outfit', sans-serif;
                    position: relative;
                    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s ease;
                ">
                    <!-- ACCENT STRIPE -->
                    <div style="height: 3.5px; background: ${themeColor}; opacity: 0.95;"></div>

                    <div style="display: flex; flex-direction: column;">
                        
                        <!-- IMAGE AREA -->
                        <div onclick="event.stopPropagation(); window.EventsController.openPosterModal('${(evt.image_url || 'img/padel-event.jpg').replace(/'/g, "\\'")}', '${(evt.name || '').replace(/'/g, "\\'")}', '${(evt.sede || evt.location || '').replace(/'/g, "\\'")}')" 
                             title="Toca para ver el Cartel Oficial"
                             style="height: 136px; background: url('${(evt.image_url || 'img/padel-event.jpg').replace(/ /g, '%20')}') no-repeat center/cover; position: relative; cursor: pointer;">
                            <div style="position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(10,14,26,0.3) 0%, rgba(10,14,26,0.85) 75%, ${catFadeBottom} 100%);"></div>
                            
                            <!-- TOP BAR OVER IMAGE: DATE (LEFT) & DUAL PRICE (RIGHT) -->
                            <div style="position: absolute; top: 10px; left: 10px; right: 10px; display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; z-index: 10; pointer-events: none;">
                                <!-- Left: Date & Status -->
                                <div style="display: flex; align-items: center; gap: 6px; pointer-events: auto;">
                                    <div style="background: rgba(15, 23, 42, 0.88); width: 44px; height: 46px; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.12); backdrop-filter: blur(12px); box-shadow: 0 4px 15px rgba(0,0,0,0.4);">
                                        <span style="font-size: 0.52rem; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">${dayName}</span>
                                        <span style="font-size: 1.25rem; font-weight: 950; color: #fff; line-height: 1;">${dayNum}</span>
                                    </div>
                                    ${evt.normDate === this.getTodayStr() ? `
                                        <span style="background: linear-gradient(135deg, #f59e0b, #d97706); color: #000; padding: 4px 8px; border-radius: 8px; font-size: 0.6rem; font-weight: 950; display: inline-flex; align-items: center; gap: 3px; box-shadow: 0 3px 10px rgba(245, 158, 11, 0.4); animation: pulse 1.8s infinite;">
                                            <i class="fas fa-fire"></i> ¡HOY!
                                        </span>
                                    ` : ''}
                                    ${isEventPrivate && !isEventUnlocked ? `
                                        <span style="background: rgba(239, 68, 68, 0.92); color: #fff; padding: 4px 8px; border-radius: 8px; font-size: 0.6rem; font-weight: 950; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 3px 10px rgba(239, 68, 68, 0.5);">
                                            <i class="fas fa-lock"></i> PRIVADA
                                        </span>
                                    ` : ''}
                                </div>

                                <!-- Right: Dual Price Badge -->
                                <div style="background: rgba(15, 23, 42, 0.88); border-radius: 11px; padding: 4px 8px; border: 1px solid rgba(255,255,255,0.14); color: #fff; display: flex; align-items: center; gap: 6px; backdrop-filter: blur(12px); box-shadow: 0 4px 15px rgba(0,0,0,0.4); flex-shrink: 0; pointer-events: auto;">
                                    <div style="display: flex; flex-direction: column; align-items: center; line-height: 1;">
                                        <span style="font-size: 0.46rem; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.3px;">SOCIO</span>
                                        <span style="font-size: 0.78rem; font-weight: 950; color: #CCFF00; margin-top: 2px;">${numSoc}€</span>
                                    </div>
                                    <div style="width: 1px; height: 16px; background: rgba(255,255,255,0.18);"></div>
                                    <div style="display: flex; flex-direction: column; align-items: center; line-height: 1;">
                                        <span style="font-size: 0.46rem; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.3px;">NO SOCIO</span>
                                        <span style="font-size: 0.78rem; font-weight: 950; color: #ffffff; margin-top: 2px;">${numExt}€</span>
                                    </div>
                                </div>
                            </div>

                            <!-- BOTTOM BAR OVER IMAGE: FORMAT & COURTS (LEFT) + QUICK ACTIONS (RIGHT) -->
                            <div style="position: absolute; bottom: 8px; left: 10px; right: 10px; display: flex; align-items: center; justify-content: space-between; gap: 6px; z-index: 10; pointer-events: none;">
                                <!-- Left: Format & Courts -->
                                <div style="display: flex; align-items: center; gap: 5px; flex-wrap: nowrap; overflow: hidden; pointer-events: auto;">
                                    ${isEntreno ? `
                                        <span style="background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%); color: #fff; padding: 3.5px 7px; border-radius: 7px; font-size: 0.58rem; font-weight: 950; text-transform: uppercase; box-shadow: 0 2px 6px rgba(139, 92, 246, 0.4); display: inline-flex; align-items: center; gap: 3px;"><i class="fas fa-user-ninja"></i> ENTRENO</span>
                                    ` : ''}
                                    ${isSwiss ?
                                        `<span style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: #fff; padding: 3.5px 7px; border-radius: 7px; font-size: 0.58rem; font-weight: 950; text-transform: uppercase; box-shadow: 0 2px 6px rgba(239, 68, 68, 0.4); display: inline-flex; align-items: center; gap: 3px;"><span style="font-size:0.7rem;">🇨🇭</span> ${isEntreno ? 'ENTRENO SUIZO' : 'SUIZA'}</span>` :
                                        (isTwister ? 
                                            `<span style="background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%); color: #fff; padding: 3.5px 7px; border-radius: 7px; font-size: 0.58rem; font-weight: 950; text-transform: uppercase; box-shadow: 0 2px 6px rgba(6, 182, 212, 0.3); display: inline-flex; align-items: center; gap: 3px;"><i class="fas fa-wind"></i> TWISTER</span>` :
                                            `<span style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: #fff; padding: 3.5px 7px; border-radius: 7px; font-size: 0.58rem; font-weight: 950; text-transform: uppercase; box-shadow: 0 2px 6px rgba(236, 72, 153, 0.3); display: inline-flex; align-items: center; gap: 3px;"><i class="fas fa-lock"></i> PAREJA FIJA</span>`
                                        )
                                    }
                                    <span style="background: rgba(15, 23, 42, 0.85); color: #fff; padding: 3.5px 7px; border-radius: 7px; border: 1px solid rgba(255,255,255,0.12); font-size: 0.58rem; font-weight: 850; backdrop-filter: blur(8px); display: inline-flex; align-items: center; gap: 3px;"><i class="fas fa-table-tennis" style="color: #CCFF00; font-size: 0.55rem;"></i> ${maxCourts} PISTAS</span>
                                </div>

                                <!-- Right: Quick Actions (Cartel, WhatsApp, Instagram) -->
                                <div style="display: flex; align-items: center; gap: 5px; flex-shrink: 0; pointer-events: auto;">
                                    <!-- Botón Cartel Oficial -->
                                    <button onclick="event.stopPropagation(); window.EventsController.openPosterModal('${(evt.image_url || 'img/padel-event.jpg').replace(/'/g, "\\'")}', '${(evt.name || '').replace(/'/g, "\\'")}', '${(evt.sede || evt.location || '').replace(/'/g, "\\'")}')" 
                                            title="Ver Cartel Oficial" 
                                            aria-label="Ver cartel del evento"
                                            style="
                                                background: rgba(15, 23, 42, 0.88);
                                                height: 30px;
                                                padding: 0 8px;
                                                border-radius: 9px;
                                                border: 1.2px solid rgba(204, 255, 0, 0.5);
                                                color: #CCFF00;
                                                display: flex;
                                                align-items: center;
                                                gap: 4px;
                                                cursor: pointer;
                                                backdrop-filter: blur(10px);
                                                box-shadow: 0 3px 10px rgba(0,0,0,0.35);
                                                font-size: 0.65rem;
                                                font-weight: 950;
                                                letter-spacing: 0.4px;
                                                transition: transform 0.15s;
                                            "
                                            onmouseover="this.style.transform='scale(1.05)';"
                                            onmouseout="this.style.transform='scale(1)';"
                                            onmousedown="this.style.transform='scale(0.95)';">
                                        <i class="fas fa-file-image" style="font-size: 0.72rem; color: #CCFF00;"></i>
                                        <span>CARTEL</span>
                                    </button>

                                    <!-- Botón Compartir WhatsApp Pro -->
                                    <button onclick="event.stopPropagation(); window.EventsController.shareEvent('${evt.id}', '${evt.type || 'americana'}')" 
                                            title="Compartir por WhatsApp" 
                                            aria-label="Compartir evento por WhatsApp"
                                            style="background: rgba(15, 23, 42, 0.85); width: 30px; height: 30px; border-radius: 9px; border: 1px solid rgba(34, 197, 94, 0.35); color: #22c55e; display: flex; align-items: center; justify-content: center; cursor: pointer; backdrop-filter: blur(10px); box-shadow: 0 3px 10px rgba(0,0,0,0.35); transition: transform 0.15s;"
                                            onmouseover="this.style.transform='scale(1.08)';"
                                            onmouseout="this.style.transform='scale(1)';"
                                            onmousedown="this.style.transform='scale(0.92)';">
                                        <i class="fab fa-whatsapp" style="font-size: 0.95rem;"></i>
                                    </button>

                                    <!-- Botón Compartir Instagram Stories Pro -->
                                    <button onclick="event.stopPropagation(); window.EventsController.shareInstagram('${evt.id}', '${evt.type || 'americana'}')" 
                                            title="Compartir en Instagram Stories" 
                                            aria-label="Compartir en Instagram"
                                            style="background: rgba(15, 23, 42, 0.85); width: 30px; height: 30px; border-radius: 9px; border: 1px solid rgba(225, 48, 108, 0.45); color: #E1306C; display: flex; align-items: center; justify-content: center; cursor: pointer; backdrop-filter: blur(10px); box-shadow: 0 3px 10px rgba(0,0,0,0.35); transition: transform 0.15s;"
                                            onmouseover="this.style.transform='scale(1.08)';"
                                            onmouseout="this.style.transform='scale(1)';"
                                            onmousedown="this.style.transform='scale(0.92)';">
                                        <i class="fab fa-instagram" style="font-size: 0.95rem; background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;"></i>
                                    </button>

                                    <!-- Botón Minimizar Tarjeta -->
                                    <button onclick="event.stopPropagation(); window.EventsController.toggleCardExpansion('${evt.id}', event)" 
                                            title="Minimizar esta tarjeta" 
                                            aria-label="Minimizar tarjeta"
                                            style="background: rgba(15, 23, 42, 0.88); width: 30px; height: 30px; border-radius: 9px; border: 1px solid rgba(255, 255, 255, 0.2); color: #cbd5e1; display: flex; align-items: center; justify-content: center; cursor: pointer; backdrop-filter: blur(10px); box-shadow: 0 3px 10px rgba(0,0,0,0.35); transition: transform 0.15s;"
                                            onmouseover="this.style.transform='scale(1.08)'; this.style.color='#CCFF00'; this.style.borderColor='rgba(204,255,0,0.4)';"
                                            onmouseout="this.style.transform='scale(1)'; this.style.color='#cbd5e1'; this.style.borderColor='rgba(255,255,255,0.2)';"
                                            onmousedown="this.style.transform='scale(0.92)';">
                                        <i class="fas fa-compress-alt" style="font-size: 0.82rem;"></i>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- CONTENT AREA -->
                        <div style="padding: 12px 13px 13px;">
                            <!-- METADATA BADGES STRIP (Organized & Clean, Single Row Wrap) -->
                            <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 5px; margin-bottom: 7px;">
                                ${(evt.is_external || evt.external || evt.organizer_type === 'external' || evt.origin === 'external' || evt.club) ? `
                                    <span style="background: rgba(14, 165, 233, 0.12); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); padding: 2.5px 7px; border-radius: 7px; font-size: 0.6rem; font-weight: 850; display: inline-flex; align-items: center; gap: 4px;">
                                        <i class="fas fa-building-columns" style="font-size: 0.55rem;"></i> ${evt.club || 'CLUB ASOCIADO'} <i class="fas fa-check-circle" style="color: #38bdf8; font-size: 0.58rem; margin-left: 1px;" title="Verificado"></i>
                                    </span>
                                ` : `
                                    <span style="background: rgba(204,255,0,0.12); color: #CCFF00; border: 1px solid rgba(204,255,0,0.3); padding: 2.5px 7px; border-radius: 7px; font-size: 0.6rem; font-weight: 900; text-transform: uppercase; display: inline-flex; align-items: center; gap: 4px;">
                                        <i class="fas fa-certificate" style="font-size: 0.55rem;"></i> SOMOSPADEL BCN
                                    </span>
                                `}
                                ${levelBadgeHtml}
                                ${levelFeedbackHtml}
                                ${evt.organizer ? `
                                    <span style="background: rgba(204,255,0,0.12); color: #CCFF00; border: 1px solid rgba(204,255,0,0.3); padding: 2.5px 7px; border-radius: 7px; font-size: 0.6rem; font-weight: 850; display: inline-flex; align-items: center; gap: 4px;">
                                        <i class="fas fa-user-tie" style="font-size: 0.55rem;"></i> ${evt.organizer}
                                    </span>
                                ` : ''}
                                ${isEventPrivate ? `
                                    <span style="background: ${isEventUnlocked ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.2)'}; color: ${isEventUnlocked ? '#4ade80' : '#f87171'}; border: 1px solid ${isEventUnlocked ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.5)'}; padding: 2.5px 7px; border-radius: 7px; font-size: 0.58rem; font-weight: 900; display: inline-flex; align-items: center; gap: 3px;">
                                        <i class="fas ${isEventUnlocked ? 'fa-unlock' : 'fa-lock'}" style="font-size: 0.55rem;"></i> ${isEventUnlocked ? 'Desbloqueada' : 'Clave requerida'}
                                    </span>
                                ` : ''}
                            </div>

                            <!-- EVENT TITLE (Full Width, Uncluttered) -->
                            <h3 style="margin: 0 0 7px 0; font-size: 1.15rem; font-weight: 950; color: #fff; line-height: 1.2; letter-spacing: -0.3px; text-transform: uppercase; word-break: break-word;">${evt.name}</h3>

                            <!-- DESCRIPTION TEASER NOTICE (Single clean gateway to description modal) -->
                            ${evt.description && evt.description.trim() ? `
                                <div onclick="event.stopPropagation(); window.EventsController.openDescriptionModal('${evt.id}', '${evt.type || 'americana'}')" 
                                     title="Toca para leer el aviso completo"
                                     style="
                                        background: linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(37, 99, 235, 0.04) 100%);
                                        border: 1px solid rgba(56, 189, 248, 0.22);
                                        border-left: 3px solid #38bdf8;
                                        border-radius: 10px;
                                        padding: 6px 10px;
                                        margin-bottom: 9px;
                                        cursor: pointer;
                                        display: flex;
                                        align-items: center;
                                        justify-content: space-between;
                                        gap: 8px;
                                        transition: background 0.15s;
                                     "
                                     onmouseover="this.style.background='rgba(56, 189, 248, 0.14)';"
                                     onmouseout="this.style.background='linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(37, 99, 235, 0.04) 100%)';">
                                    <div style="display: flex; align-items: center; gap: 7px; overflow: hidden; min-width: 0;">
                                        <i class="fas fa-bullhorn" style="color: #38bdf8; font-size: 0.78rem; flex-shrink: 0;"></i>
                                        <span style="font-size: 0.72rem; color: #e2e8f0; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                            ${evt.description.replace(/\n/g, ' ')}
                                        </span>
                                    </div>
                                    <span style="font-size: 0.6rem; font-weight: 950; color: #38bdf8; text-transform: uppercase; white-space: nowrap; flex-shrink: 0; display: inline-flex; align-items: center; gap: 3px;">
                                        LEER <i class="fas fa-chevron-right" style="font-size: 0.55rem;"></i>
                                    </span>
                                </div>
                            ` : ''}
                            
                            <!-- 💎 2 ESSENTIAL PILLS (TIME & CATEGORY) -->
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 9px;">
                                <!-- Time Tile -->
                                <div class="${tileClass}" style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 7px 9px; display: flex; align-items: center; gap: 7px; border: 1px solid rgba(255,255,255,0.07); box-shadow: 0 2px 8px rgba(0,0,0,0.2); min-width: 0;">
                                    <div style="width: 24px; height: 24px; background: ${timeIconBg}; border-radius: 7px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                        <i class="far fa-clock" style="color: ${timeIconColor}; font-size: 0.75rem;"></i>
                                    </div>
                                    <span style="font-weight: 900; font-size: 0.78rem; color: #f1f5f9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${timeLabel}</span>
                                </div>
                                <!-- Category Tile -->
                                <div class="${tileClass}" style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 7px 9px; display: flex; align-items: center; gap: 7px; border: 1.2px solid ${categoryColor}40; box-shadow: 0 2px 8px ${categoryColor}15; min-width: 0;">
                                    <div style="width: 24px; height: 24px; background: ${categoryColor}25; border-radius: 7px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                        <i class="fas ${categoryIcon}" style="color: ${categoryColor}; font-size: 0.78rem;"></i>
                                    </div>
                                    <span style="font-weight: 950; font-size: 0.78rem; color: ${categoryColor}; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: 0.3px;">${categoryLabel}</span>
                                </div>
                            </div>

                            <!-- CAPACITY & BUBBLE STACK (INTERACTIVE) -->
                            <div class="${tileClass}" onclick="event.stopPropagation(); ${(isEventPrivate && !isEventUnlocked) ? `window.EventsController.promptPrivatePassword('${evt.id}', '${evt.type || 'americana'}', 'inscritos')` : `window.EventsController.showInscritosModal('${evt.id}', '${evt.type || 'americana'}')`}" style="background: rgba(255,255,255,0.05); border-radius: 14px; padding: 8px 10px; border: 1px solid rgba(255,255,255,0.07); cursor: pointer; position: relative; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.2); margin-bottom: 9px;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; position: relative; gap: 6px;">
                                    <div style="display: flex; align-items: center; gap: 5px; min-width: 0; overflow: hidden;">
                                        ${avatarStackHtml}
                                        <i id="event-players-icon-${evt.id}" class="fas fa-users" style="color: ${capacityIconColor}; font-size: 0.8rem; margin-left: 1px; flex-shrink: 0;"></i>
                                        <span id="event-players-label-${evt.id}" style="font-weight: 950; font-size: 0.82rem; color: #fff; white-space: nowrap;">${playerCount} / ${maxPlayers} Plazas</span>
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 5px; flex-shrink: 0;">
                                        ${urgencyHtml}
                                        <span id="event-status-capacity-${evt.id}" style="font-size: 0.62rem; font-weight: 950; color: ${isFull ? '#FF3B30' : categoryColor}; text-transform: uppercase; letter-spacing: 0.4px;">${isFull ? 'COMPLETO' : 'DISPONIBLE'}</span>
                                    </div>
                                </div>
                                <div style="width: 100%; height: 5px; background: rgba(255,255,255,0.06); border-radius: 10px; overflow: hidden;">
                                    <div id="event-progress-bar-${evt.id}" style="width: ${progress}%; height: 100%; background: ${progressColor}; box-shadow: 0 0 10px ${progressColor}55; transition: width 0.3s ease;"></div>
                                </div>
                                <div id="event-waitlist-label-${evt.id}">
                                    ${waitlist.length > 0 ? `<div style="margin-top: 4px; font-size: 0.62rem; font-weight: 900; color: #eab308; text-transform: uppercase;">+${waitlist.length} EN ESPERA</div>` : ''}
                                </div>
                            </div>

                            <!-- 📍 LOCATION & UNIFIED PRIMARY ACTION CTA -->
                            <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 1px; gap: 8px;">
                                <!-- Sede Oficial Box con GPS / Indicaciones directas -->
                                <div class="${tileClass}" onclick="event.stopPropagation(); window.EventsController.openDirections('${(evt.sede || evt.location || 'Barcelona Pádel el Prat').replace(/'/g, "\\'")}')" 
                                     title="Navegar por GPS al club (Google Maps / Apple Maps)"
                                     style="display: flex; align-items: center; gap: 7px; background: rgba(255,255,255,0.05); padding: 7px 9px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.07); flex: 1; min-width: 0; cursor: pointer;"
                                     onmouseover="this.style.borderColor='#38bdf8';"
                                     onmouseout="this.style.borderColor='rgba(255,255,255,0.07)';">
                                    <div style="width: 26px; height: 26px; background: ${locIconBg}; border-radius: 7px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                        <i class="fas fa-location-arrow" style="color: ${locIconColor}; font-size: 0.78rem;"></i>
                                    </div>
                                    <div style="display: flex; flex-direction: column; min-width: 0; overflow: hidden;">
                                        <div style="display: flex; align-items: center; gap: 3px;">
                                            <span style="font-size: 0.5rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.4px;">${(evt.is_external || evt.external || evt.organizer_type === 'external' || evt.origin === 'external') ? 'Club' : 'Sede Oficial'}</span>
                                            <span style="font-size: 0.5rem; font-weight: 950; color: #38bdf8; text-transform: uppercase;">GPS ↗</span>
                                        </div>
                                        <span style="font-size: 0.78rem; font-weight: 900; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${evt.sede || evt.location || 'Bcn Pádel'}</span>
                                    </div>
                                </div>

                                <!-- ⚡ PRIMARY PRO ACTION BUTTON (Unifies FAB & Status Badge) -->
                                <div style="position: relative; flex-shrink: 0;">
                                    ${isLive ? `<div style="position: absolute; inset: -3px; border-radius: 14px; background: #FF2D55; opacity: 0.5; animation: status-breathe 1.2s ease-in-out infinite; filter: blur(4px);"></div>` : ''}
                                    ${!isLive && !isCancelled && !isFinished && !isJoined ? `<div style="position: absolute; inset: -2px; border-radius: 14px; background: ${categoryColor}; opacity: 0.25; animation: status-breathe 2.2s ease-in-out infinite; filter: blur(3px);"></div>` : ''}
                                    
                                    ${(() => {
                                        let ctaBg = '#CCFF00';
                                        let ctaTextColor = '#000000';
                                        let ctaShadow = '0 4px 14px rgba(204, 255, 0, 0.4)';

                                        if (isLive) {
                                            ctaBg = '#FF2D55';
                                            ctaTextColor = '#ffffff';
                                            ctaShadow = '0 4px 14px rgba(255, 45, 85, 0.5)';
                                        } else if (isCancelled) {
                                            ctaBg = '#ef4444';
                                            ctaTextColor = '#ffffff';
                                            ctaShadow = '0 4px 14px rgba(239, 68, 68, 0.4)';
                                        } else if (isFinished || evt.status === 'finished') {
                                            ctaBg = '#475569';
                                            ctaTextColor = '#ffffff';
                                            ctaShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
                                        } else if (isJoined) {
                                            ctaBg = '#00E36D';
                                            ctaTextColor = '#000000';
                                            ctaShadow = '0 4px 14px rgba(0, 227, 109, 0.4)';
                                        } else if (isWaitlistPending) {
                                            ctaBg = '#CCFF00';
                                            ctaTextColor = '#000000';
                                            ctaShadow = '0 4px 14px rgba(204, 255, 0, 0.4)';
                                        } else if (isInWaitlist) {
                                            ctaBg = '#334155';
                                            ctaTextColor = '#ffffff';
                                            ctaShadow = '0 4px 12px rgba(0, 0, 0, 0.4)';
                                        } else if (isGenderMismatch && !isJoined) {
                                            ctaBg = '#1e293b';
                                            ctaTextColor = '#94a3b8';
                                            ctaShadow = 'none';
                                        } else if (isFull && !isJoined) {
                                            ctaBg = '#eab308';
                                            ctaTextColor = '#000000';
                                            ctaShadow = '0 4px 14px rgba(234, 179, 8, 0.4)';
                                        } else {
                                            ctaBg = '#CCFF00';
                                            ctaTextColor = '#000000';
                                            ctaShadow = '0 4px 14px rgba(204, 255, 0, 0.4)';
                                        }

                                        return `
                                            <button id="event-fab-${evt.id}" 
                                                    onclick="event.stopPropagation(); ${fabAction}"
                                                    aria-label="${btnLabel}"
                                                    style="
                                                        position: relative;
                                                        background: ${ctaBg} !important;
                                                        color: ${ctaTextColor} !important;
                                                        padding: 9px 15px;
                                                        border-radius: 12px;
                                                        font-size: 0.75rem;
                                                        font-weight: 950;
                                                        font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
                                                        text-transform: uppercase;
                                                        letter-spacing: 0.5px;
                                                        display: flex;
                                                        align-items: center;
                                                        gap: 6px;
                                                        border: none;
                                                        cursor: pointer;
                                                        box-shadow: ${ctaShadow};
                                                        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                                                        ${isLive ? 'animation: status-shake 0.5s ease-in-out infinite alternate;' : ''}
                                                    "
                                                    onmouseover="this.style.transform='scale(1.04)';"
                                                    onmouseout="this.style.transform='scale(1)';"
                                                    onmousedown="this.style.transform='scale(0.95)';">
                                                <i id="event-fab-icon-${evt.id}" class="fas ${btnIcon}" style="font-size: 0.8rem; color: ${ctaTextColor} !important; font-weight: 900;"></i>
                                                <span id="event-fab-label-${evt.id}" style="color: ${ctaTextColor} !important; font-weight: 950; letter-spacing: 0.5px;">${btnLabel}</span>
                                            </button>
                                        `;
                                    })()}

                                    <!-- Hidden anchor for smartUpdate status-badge compatibility -->
                                    <span id="event-status-badge-${evt.id}" style="display: none;"></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        async shareEvent(id, type = 'americana') {
            console.log("🔗 [EventsController] shareEvent triggered for:", id, type);
            let evt = null;

            // 1. Siempre obtener datos 100% frescos y actualizados de Firestore
            if (window.EventService) {
                try {
                    evt = await window.EventService.getById(type === 'entreno' ? 'entreno' : 'americana', id);
                } catch (e) {
                    console.warn("⚠️ [EventsController] Error al obtener evento fresco de Firestore:", e);
                }
            }

            // 2. Fallback a estado local
            if (!evt) {
                const events = type === 'entreno' ? this.state.entrenos : this.state.americanas;
                evt = events.find(e => e.id === id);
            }

            if (!evt) {
                console.warn("⚠️ Evento no encontrado para compartir:", id);
                return;
            }

            const rawCourts = parseInt(evt.max_courts || evt.courts || 0);
            const maxCourts = rawCourts > 0 ? rawCourts : (evt.max_players ? Math.max(1, Math.round(evt.max_players / 4)) : 4);

            // Normalización idéntica al Admin de Entrenos y Americanas
            const normalizedEvt = {
                ...evt,
                id: evt.id || id,
                type: evt.type || type,
                location: evt.sede || evt.location || evt.club || 'SomosPadel BCN',
                sede: evt.sede || evt.location || evt.club || 'SomosPadel BCN',
                organizer: evt.organizer || '',
                players: evt.players || evt.registeredPlayers || [],
                registeredPlayers: evt.registeredPlayers || evt.players || [],
                price_members: evt.price_members || evt.price_socio || evt.price || 10,
                price_external: evt.price_external || evt.price_no_socio || evt.price_externo || evt.price || 10,
                max_courts: maxCourts,
                courts: maxCourts,
                max_players: maxCourts * 4
            };

            if (window.WhatsAppService && typeof window.WhatsAppService.shareStartFromAdmin === 'function') {
                await window.WhatsAppService.shareStartFromAdmin(normalizedEvt);
                return;
            }

            // Fallback de seguridad en caso de no disponibilidad de WhatsAppService
            const fallbackCourts = parseInt(normalizedEvt.max_courts || maxCourts || 4);
            const maxPlayers = fallbackCourts * 4;
            const remaining = Math.max(0, maxPlayers - (normalizedEvt.players ? normalizedEvt.players.length : 0));
            const organizerLine = normalizedEvt.organizer ? `👤 *Organizador:* ${normalizedEvt.organizer}\n` : '';
            const shareText = `🎾 *SOMOSPADEL BCN - CONVOCATORIA DE PÁDEL* 🎾\n\n🏆 *${normalizedEvt.name}*\n📅 *Fecha:* ${normalizedEvt.date}\n🕒 *Horario:* ${normalizedEvt.time || '19:30 - 21:30'}\n📍 *Sede:* ${normalizedEvt.location}\n${organizerLine}👥 *Plazas libres:* ${remaining} de ${maxPlayers} plazas\n💰 *Precio:* ${normalizedEvt.price_members}€\n\n⚡ ¡Apúntate antes de que se agoten las plazas!\n👉 ${window.location.origin}`;

            const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
            window.open(whatsappUrl, '_blank');
        }

        addToCalendar(id, type = 'americana') {
            const events = type === 'entreno' ? this.state.entrenos : this.state.americanas;
            const evt = events.find(e => e.id === id);
            if (!evt) return;

            const timeStr = this.formatEventTime(evt);
            const title = encodeURIComponent(`SomosPadel: ${evt.name}`);
            const location = encodeURIComponent(evt.sede || evt.location || 'Barcelona Pádel el Prat');
            const details = encodeURIComponent(`Torneo/Entreno SomosPadel BCN.\nHorario: ${timeStr}\nPrecio: ${evt.price_socio || evt.price_members || 10}€\n¡A darlo todo en pista!`);
            
            // Construir fecha ISO
            const times = this.getEventTimes(evt.date, evt.time, evt.time_end || evt.timeEnd);
            const normDate = (times && times.normDate) || evt.normDate || this.getTodayStr();
            const dateClean = normDate.replace(/-/g, '');
            let datesParam = `${dateClean}T180000Z/${dateClean}T200000Z`;
            if (times && times.start && times.end) {
                const pad = n => String(n).padStart(2, '0');
                const startStr = `${times.start.getFullYear()}${pad(times.start.getMonth()+1)}${pad(times.start.getDate())}T${pad(times.start.getHours())}${pad(times.start.getMinutes())}00`;
                const endStr = `${times.end.getFullYear()}${pad(times.end.getMonth()+1)}${pad(times.end.getDate())}${pad(times.end.getHours())}${pad(times.end.getMinutes())}00`;
                datesParam = `${startStr}/${endStr}`;
            }
            const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${datesParam}&details=${details}&location=${location}`;
            window.open(gCalUrl, '_blank');
        }

        openDirections(sede) {
            const club = (sede || 'Barcelona Pádel el Prat').trim();
            const query = encodeURIComponent(`${club}, Barcelona`);
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
            const mapsUrl = isIOS 
                ? `maps://maps.apple.com/?q=${query}` 
                : `https://www.google.com/maps/dir/?api=1&destination=${query}`;
            
            console.log("🗺️ [EventsController] Opening directions to:", club);
            window.open(mapsUrl, '_blank');
        }

        openPosterModal(imageUrl, eventName, clubName) {
            const finalImg = (imageUrl && imageUrl.trim()) ? imageUrl.trim() : 'img/padel-event.jpg';
            const finalName = (eventName && eventName.trim()) ? eventName.trim() : 'Americana SomosPadel';
            const finalClub = (clubName && clubName.trim()) ? clubName.trim() : 'Sede Oficial';

            let overlay = document.getElementById('sp-americana-poster-modal');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'sp-americana-poster-modal';
                overlay.style.cssText = `
                    position: fixed;
                    inset: 0;
                    background: rgba(4, 7, 15, 0.92);
                    backdrop-filter: blur(14px);
                    -webkit-backdrop-filter: blur(14px);
                    z-index: 9999999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 16px;
                    box-sizing: border-box;
                    opacity: 0;
                    transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                    font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
                `;
                document.body.appendChild(overlay);

                overlay.addEventListener('click', (e) => {
                    if (e.target === overlay) this.closePosterModal();
                });

                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape' && overlay.style.display !== 'none') {
                        this.closePosterModal();
                    }
                });
            }

            overlay.innerHTML = `
                <div style="
                    position: relative;
                    width: 100%;
                    max-width: 480px;
                    max-height: 92vh;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    background: #090e18;
                    border: 1.5px solid rgba(204, 255, 0, 0.45);
                    border-radius: 22px;
                    padding: 14px 14px 16px;
                    box-shadow: 0 25px 60px rgba(0,0,0,0.9), 0 0 35px rgba(204,255,0,0.2);
                    box-sizing: border-box;
                ">
                    <!-- Botón Cerrar Circular Flotante -->
                    <button type="button" onclick="window.EventsController.closePosterModal()"
                            aria-label="Cerrar cartel"
                            style="
                                position: absolute;
                                top: -14px;
                                right: -14px;
                                width: 38px;
                                height: 38px;
                                border-radius: 50%;
                                background: #0f172a;
                                color: #CCFF00;
                                border: 2px solid #CCFF00;
                                font-size: 1.1rem;
                                font-weight: 900;
                                cursor: pointer;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                box-shadow: 0 4px 15px rgba(0,0,0,0.6);
                                z-index: 30;
                                transition: transform 0.15s;
                            "
                            onmouseover="this.style.transform='scale(1.1) rotate(90deg)';"
                            onmouseout="this.style.transform='scale(1) rotate(0deg)';">
                        ✕
                    </button>

                    <!-- Header del Lightbox -->
                    <div style="width: 100%; display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding: 0 2px;">
                        <span style="background: #CCFF00; color: #000; font-size: 0.65rem; font-weight: 950; padding: 4px 10px; border-radius: 8px; letter-spacing: 0.5px; display: inline-flex; align-items: center; gap: 5px;">
                            <i class="fas fa-file-image"></i> CARTEL OFICIAL
                        </span>
                        <span style="font-size: 0.72rem; color: #94a3b8; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 58%;">
                            <i class="fas fa-map-marker-alt" style="color: #38bdf8;"></i> ${finalClub}
                        </span>
                    </div>

                    <!-- Título del Evento -->
                    <h3 style="margin: 0 0 10px; font-size: 1.05rem; font-weight: 950; color: #fff; text-transform: uppercase; text-align: center; width: 100%; line-height: 1.25; letter-spacing: -0.3px;">
                        ${finalName}
                    </h3>

                    <!-- Contenedor del Cartel HD -->
                    <div style="
                        width: 100%;
                        max-height: 60vh;
                        overflow: hidden;
                        border-radius: 14px;
                        border: 1px solid rgba(255,255,255,0.1);
                        background: #000;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        box-shadow: inset 0 0 20px rgba(0,0,0,0.7);
                    ">
                        <img src="${finalImg}" 
                             alt="Cartel ${finalName}" 
                             style="
                                width: 100%;
                                height: auto;
                                max-height: 60vh;
                                object-fit: contain;
                                display: block;
                             "
                             onerror="this.src='img/padel-event.jpg'"
                        />
                    </div>

                    <!-- Botones de Acción al pie del Modal -->
                    <div style="display: flex; gap: 10px; width: 100%; margin-top: 14px;">
                        <a href="${finalImg}" target="_blank" rel="noopener noreferrer" download
                           style="
                                flex: 1;
                                padding: 11px 12px;
                                background: rgba(255,255,255,0.08);
                                border: 1px solid rgba(255,255,255,0.2);
                                border-radius: 12px;
                                color: #fff;
                                font-weight: 900;
                                font-size: 0.78rem;
                                text-decoration: none;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                gap: 6px;
                           ">
                            <i class="fas fa-external-link-alt"></i> ABRIR IMAGEN
                        </a>
                        <button type="button" onclick="window.EventsController.closePosterModal()"
                                style="
                                    flex: 1;
                                    padding: 11px 12px;
                                    background: #CCFF00;
                                    color: #000;
                                    border: none;
                                    border-radius: 12px;
                                    font-weight: 950;
                                    font-size: 0.78rem;
                                    cursor: pointer;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    gap: 6px;
                                    box-shadow: 0 4px 14px rgba(204,255,0,0.3);
                                ">
                            <i class="fas fa-check"></i> CERRAR
                        </button>
                    </div>
                </div>
            `;

            overlay.style.display = 'flex';
            requestAnimationFrame(() => {
                overlay.style.opacity = '1';
            });
        }

        closePosterModal() {
            const overlay = document.getElementById('sp-americana-poster-modal');
            if (overlay) {
                overlay.style.opacity = '0';
                setTimeout(() => {
                    overlay.style.display = 'none';
                }, 250);
            }
        }

        async _ensureHtml2Canvas() {
            if (typeof window.html2canvas !== 'undefined') return true;
            return new Promise((resolve) => {
                const s = document.createElement('script');
                s.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
                s.onload = () => resolve(true);
                s.onerror = () => {
                    console.warn("No se pudo cargar html2canvas CDN.");
                    resolve(false);
                };
                document.head.appendChild(s);
            });
        }

        async shareInstagram(id, type = 'americana') {
            console.log("📸 [EventsController] shareInstagram triggered for:", id, type);
            if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(25);

            let evt = null;
            if (window.EventService) {
                try {
                    evt = await window.EventService.getById(type === 'entreno' ? 'entreno' : 'americana', id);
                } catch (e) {
                    console.warn("⚠️ [EventsController] Error al obtener evento fresco:", e);
                }
            }

            if (!evt) {
                const events = type === 'entreno' ? this.state.entrenos : this.state.americanas;
                evt = events.find(e => e.id === id);
            }

            if (!evt) {
                console.warn("⚠️ Evento no encontrado para compartir en Instagram:", id);
                return;
            }

            const rawCourts = parseInt(evt.max_courts || evt.courts || 0);
            const maxCourts = rawCourts > 0 ? rawCourts : (evt.max_players ? Math.max(1, Math.round(evt.max_players / 4)) : 4);

            const normalizedEvt = {
                ...evt,
                id: evt.id || id,
                type: evt.type || type,
                name: evt.name || 'Convocatoria SomosPadel',
                location: evt.sede || evt.location || evt.club || 'SomosPadel BCN',
                sede: evt.sede || evt.location || evt.club || 'SomosPadel BCN',
                club: evt.club || evt.sede || evt.location || 'SomosPadel BCN',
                organizer: evt.organizer || '',
                organizer_type: evt.organizer_type || (evt.is_external ? 'external' : 'official'),
                players: evt.players || evt.registeredPlayers || [],
                registeredPlayers: evt.registeredPlayers || evt.players || [],
                price_members: (evt.price_members !== undefined) ? evt.price_members : (evt.price_socio || evt.price || 10),
                price_external: (evt.price_external !== undefined) ? evt.price_external : (evt.price_no_socio || evt.price_externo || evt.price || 10),
                max_courts: maxCourts,
                courts: maxCourts,
                max_players: maxCourts * 4,
                level: evt.level || (evt.min_level ? `${evt.min_level} - ${evt.max_level || 4.5}` : '2 - 4.5'),
                time: evt.time || '19:30',
                time_end: evt.time_end || '',
                category: evt.category || 'Mixto',
                pair_mode: evt.pair_mode || 'twister',
                image_url: evt.image_url || 'img/padel-event.jpg',
                description: evt.description || evt.perk || evt.promo || ''
            };

            this.openInstagramStoryModal(normalizedEvt);
        }

        openInstagramStoryModal(evt) {
            let overlay = document.getElementById('sp-instagram-story-modal');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'sp-instagram-story-modal';
                overlay.style.cssText = `
                    position: fixed;
                    inset: 0;
                    background: rgba(4, 7, 15, 0.95);
                    backdrop-filter: blur(16px);
                    -webkit-backdrop-filter: blur(16px);
                    z-index: 9999999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 16px;
                    box-sizing: border-box;
                    opacity: 0;
                    overflow-y: auto;
                    transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                    font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
                `;
                document.body.appendChild(overlay);

                overlay.addEventListener('click', (e) => {
                    if (e.target === overlay) this.closeInstagramStoryModal();
                });

                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape' && overlay.style.display !== 'none') {
                        this.closeInstagramStoryModal();
                    }
                });
            }

            const rawDate = evt.date || evt.normDate || '';
            let dayName = 'SÁB';
            let dayNum = '19';
            let fullDateHeader = 'PRÓXIMO PARTIDO';
            if (rawDate) {
                const d = new Date(rawDate.includes('T') ? rawDate : rawDate + 'T12:00:00');
                if (!isNaN(d.getTime())) {
                    const dNames = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
                    const mNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                    dayName = dNames[d.getDay()];
                    dayNum = d.getDate().toString();
                    fullDateHeader = `${dayName} ${dayNum} DE ${mNames[d.getMonth()].toUpperCase()}`;
                }
            }

            const isEntreno = (evt.type === 'entreno') || (evt.name && evt.name.toUpperCase().includes('ENTRENO'));
            const isTwister = (evt.pair_mode === 'individual') || (evt.modality === 'twister') || (evt.name && evt.name.toUpperCase().includes('TWISTER'));
            const maxCourts = parseInt(evt.max_courts || evt.courts || 4);
            const maxPlayers = maxCourts * 4;
            const players = evt.players || evt.registeredPlayers || [];
            const filled = players.length;
            const isFull = filled >= maxPlayers;
            const statusText = isFull ? 'COMPLETO' : 'DISPONIBLE';
            const statusColor = isFull ? '#ef4444' : '#CCFF00';
            const progressPct = Math.min(100, Math.round((filled / Math.max(1, maxPlayers)) * 100));

            const numSoc = (evt.price_members !== undefined) ? evt.price_members : 10;
            const numExt = (evt.price_external !== undefined) ? evt.price_external : 10;
            const sede = evt.sede || evt.location || evt.club || 'SomosPadel BCN';
            const level = evt.level || '2 - 4.5';
            const timeStr = this.formatEventTime(evt);
            const category = (evt.category || 'Mixto').toUpperCase();
            const organizer = evt.organizer || (evt.organizer_type === 'external' ? (evt.club || 'Club Asociado') : 'SomosPadel BCN');
            const perk = (evt.description && evt.description.length < 90) ? evt.description : (evt.perk || evt.promo || '');
            const imgUrl = (evt.image_url && evt.image_url.trim()) ? evt.image_url.trim() : 'img/padel-event.jpg';

            overlay.innerHTML = `
                <div style="
                    position: relative;
                    width: 100%;
                    max-width: 420px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    background: #090e18;
                    border: 1.5px solid rgba(225, 48, 108, 0.4);
                    border-radius: 24px;
                    padding: 16px 14px 18px;
                    box-shadow: 0 25px 60px rgba(0,0,0,0.95), 0 0 30px rgba(225,48,108,0.25);
                    box-sizing: border-box;
                    margin: auto;
                ">
                    <!-- Botón Cerrar Flotante -->
                    <button type="button" onclick="window.EventsController.closeInstagramStoryModal()"
                            aria-label="Cerrar ventana de Instagram"
                            style="
                                position: absolute;
                                top: -14px;
                                right: -14px;
                                width: 38px;
                                height: 38px;
                                border-radius: 50%;
                                background: #0f172a;
                                color: #ffffff;
                                border: 2px solid #E1306C;
                                font-size: 1.1rem;
                                font-weight: 900;
                                cursor: pointer;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                box-shadow: 0 4px 15px rgba(0,0,0,0.6);
                                z-index: 40;
                                transition: transform 0.15s;
                            "
                            onmouseover="this.style.transform='scale(1.1) rotate(90deg)';"
                            onmouseout="this.style.transform='scale(1) rotate(0deg)';">
                        ✕
                    </button>

                    <!-- Header del Modal -->
                    <div style="width: 100%; display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding: 0 4px;">
                        <span style="background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); color: #fff; font-size: 0.68rem; font-weight: 950; padding: 4px 10px; border-radius: 8px; letter-spacing: 0.5px; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 8px rgba(225,48,108,0.35);">
                            <i class="fab fa-instagram"></i> INSTAGRAM STORY FLYER
                        </span>
                        <span style="font-size: 0.72rem; color: #94a3b8; font-weight: 800;">
                            Formato Stories 9:16 HD
                        </span>
                    </div>

                    <!-- CONTENEDOR CAPTURABLE DEL FLYER (EL DISEÑO EXACTO DE LA CARD PARA INSTAGRAM) -->
                    <div id="instagram-story-capture-card" style="
                        width: 100%;
                        max-width: 360px;
                        background: #060b14;
                        border-radius: 22px;
                        overflow: hidden;
                        border: 1px solid rgba(255, 255, 255, 0.12);
                        box-shadow: 0 16px 36px rgba(0,0,0,0.8);
                        display: flex;
                        flex-direction: column;
                        position: relative;
                        font-family: 'Outfit', sans-serif;
                    ">
                        <!-- Story Header Tag -->
                        <div style="background: linear-gradient(90deg, #090e18, #111a2e, #090e18); padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08);">
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <span style="font-size: 0.9rem;">🎾</span>
                                <span style="font-size: 0.68rem; font-weight: 950; color: #CCFF00; letter-spacing: 1px; text-transform: uppercase;">SOMOSPADEL BARCELONA</span>
                            </div>
                            <span style="font-size: 0.6rem; font-weight: 800; color: #38bdf8; background: rgba(56,189,248,0.12); padding: 2px 7px; border-radius: 6px; border: 1px solid rgba(56,189,248,0.25);">
                                ${fullDateHeader}
                            </span>
                        </div>

                        <!-- Image Area with Floating Badges (Identical to User Screenshots) -->
                        <div style="height: 140px; background: url('${imgUrl}') no-repeat center/cover; position: relative;">
                            <div style="position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(10,14,26,0.3) 0%, rgba(10,14,26,0.75) 75%, #060b14 100%);"></div>

                            <!-- Date Box (Left) -->
                            <div style="position: absolute; top: 10px; left: 10px;">
                                <div style="background: rgba(15, 23, 42, 0.9); width: 48px; height: 50px; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.15); backdrop-filter: blur(10px); box-shadow: 0 4px 15px rgba(0,0,0,0.5);">
                                    <span style="font-size: 0.52rem; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">${dayName}</span>
                                    <span style="font-size: 1.3rem; font-weight: 950; color: #ffffff; line-height: 1;">${dayNum}</span>
                                </div>
                            </div>

                            <!-- Badges Top Right (Cartel, WhatsApp, Instagram & Pricing) -->
                            <div style="position: absolute; top: 10px; right: 10px; display: flex; align-items: center; gap: 4px; z-index: 10;">
                                <div style="background: rgba(15, 23, 42, 0.9); height: 32px; padding: 0 8px; border-radius: 9px; border: 1px solid #CCFF00; color: #CCFF00; display: flex; align-items: center; gap: 4px; font-size: 0.65rem; font-weight: 950;">
                                    <i class="fas fa-file-image" style="font-size: 0.75rem;"></i>
                                    <span>CARTEL</span>
                                </div>
                                <div style="background: rgba(15, 23, 42, 0.9); width: 32px; height: 32px; border-radius: 9px; border: 1px solid rgba(34, 197, 94, 0.4); color: #22c55e; display: flex; align-items: center; justify-content: center; font-size: 0.95rem;">
                                    <i class="fab fa-whatsapp"></i>
                                </div>
                                <div style="background: rgba(15, 23, 42, 0.9); width: 32px; height: 32px; border-radius: 9px; border: 1px solid rgba(225, 48, 108, 0.5); color: #E1306C; display: flex; align-items: center; justify-content: center; font-size: 0.95rem;">
                                    <i class="fab fa-instagram" style="background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;"></i>
                                </div>
                                <div style="background: rgba(15, 23, 42, 0.92); border-radius: 9px; padding: 4px 7px; border: 1px solid rgba(255,255,255,0.15); color: #fff; display: flex; align-items: center; gap: 5px;">
                                    <div style="display: flex; flex-direction: column; align-items: center; line-height: 1;">
                                        <span style="font-size: 0.42rem; font-weight: 900; color: #94a3b8;">SOCIO</span>
                                        <span style="font-size: 0.75rem; font-weight: 950; color: #CCFF00; margin-top: 1px;">${numSoc}€</span>
                                    </div>
                                    <div style="width: 1px; height: 14px; background: rgba(255,255,255,0.2);"></div>
                                    <div style="display: flex; flex-direction: column; align-items: center; line-height: 1;">
                                        <span style="font-size: 0.42rem; font-weight: 900; color: #94a3b8;">NO SOCIO</span>
                                        <span style="font-size: 0.75rem; font-weight: 950; color: #ffffff; margin-top: 1px;">${numExt}€</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Modality Pills on bottom of image -->
                            <div style="position: absolute; bottom: 8px; left: 10px; right: 10px; display: flex; align-items: center; gap: 5px;">
                                ${isEntreno ? `
                                    <span style="background: linear-gradient(135deg, #a855f7, #6366f1); color: #fff; padding: 3px 8px; border-radius: 6px; font-size: 0.58rem; font-weight: 950;"><i class="fas fa-user-ninja"></i> ENTRENO</span>
                                ` : `
                                    <span style="background: linear-gradient(135deg, #CCFF00, #10b981); color: #000; padding: 3px 8px; border-radius: 6px; font-size: 0.58rem; font-weight: 950;"><i class="fas fa-trophy"></i> AMERICANA</span>
                                `}
                                ${isTwister ? `
                                    <span style="background: linear-gradient(135deg, #06b6d4, #3b82f6); color: #fff; padding: 3px 8px; border-radius: 6px; font-size: 0.58rem; font-weight: 950;"><i class="fas fa-wind"></i> TWISTER</span>
                                ` : `
                                    <span style="background: linear-gradient(135deg, #ec4899, #8b5cf6); color: #fff; padding: 3px 8px; border-radius: 6px; font-size: 0.58rem; font-weight: 950;"><i class="fas fa-lock"></i> PAREJA FIJA</span>
                                `}
                                <span style="background: rgba(15, 23, 42, 0.85); color: #fff; padding: 3px 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.12); font-size: 0.58rem; font-weight: 850;"><i class="fas fa-table-tennis" style="color: #CCFF00; font-size: 0.55rem;"></i> ${maxCourts} PISTAS</span>
                            </div>
                        </div>

                        <!-- Card Content (Tags, Title, Perks, Details, Plazas) -->
                        <div style="padding: 12px 14px 14px;">
                            <!-- Badges Strip -->
                            <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 5px; margin-bottom: 8px;">
                                <span style="background: rgba(204, 255, 0, 0.12); color: #CCFF00; border: 1px solid rgba(204, 255, 0, 0.35); padding: 3px 7px; border-radius: 6px; font-size: 0.62rem; font-weight: 950;">
                                    🎾 SOMOSPADEL BCN
                                </span>
                                <span style="background: rgba(14, 165, 233, 0.12); color: #38bdf8; border: 1px solid rgba(14, 165, 233, 0.3); padding: 3px 7px; border-radius: 6px; font-size: 0.62rem; font-weight: 950;">
                                    ✓ VERIFICADO
                                </span>
                                <span style="background: rgba(255, 255, 255, 0.08); color: #f1f5f9; border: 1px solid rgba(255, 255, 255, 0.14); padding: 3px 7px; border-radius: 6px; font-size: 0.62rem; font-weight: 900;">
                                    🎓 NIVEL ${level}
                                </span>
                                ${evt.organizer ? `
                                    <span style="background: rgba(234, 179, 8, 0.15); color: #fde047; border: 1px solid rgba(234, 179, 8, 0.3); padding: 3px 7px; border-radius: 6px; font-size: 0.6rem; font-weight: 900;">
                                        👤 Organiza: ${evt.organizer}
                                    </span>
                                ` : ''}
                            </div>

                            <!-- Big Title -->
                            <h2 style="font-family: 'Outfit', sans-serif; font-size: 1.25rem; font-weight: 950; color: #ffffff; text-transform: uppercase; margin: 0 0 8px 0; line-height: 1.2; letter-spacing: -0.3px;">
                                ${evt.name}
                            </h2>

                            <!-- Optional Promo / Perk Banner -->
                            ${perk ? `
                                <div style="background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 9px; padding: 6px 10px; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; color: #bae6fd; font-size: 0.72rem; font-weight: 800;">
                                    <i class="fas fa-bullhorn" style="color: #38bdf8;"></i>
                                    <span>${perk}</span>
                                </div>
                            ` : ''}

                            <!-- Time & Gender Box Grid -->
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
                                <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 7px 10px; display: flex; align-items: center; gap: 6px; color: #ffffff; font-size: 0.78rem; font-weight: 800;">
                                    <i class="far fa-clock" style="color: #f59e0b;"></i>
                                    <span>${timeStr}</span>
                                </div>
                                <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 7px 10px; display: flex; align-items: center; gap: 6px; color: #ffffff; font-size: 0.78rem; font-weight: 800;">
                                    <i class="fas fa-venus-mars" style="color: #eab308;"></i>
                                    <span>${category}</span>
                                </div>
                            </div>

                            <!-- Plazas & Occupancy Bar -->
                            <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 8px 10px; margin-bottom: 8px;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; font-size: 0.78rem; font-weight: 900;">
                                    <span style="color: #ffffff;"><i class="fas fa-users" style="color: #f59e0b;"></i> ${filled} / ${maxPlayers} Plazas</span>
                                    <span style="color: ${statusColor}; font-weight: 950;">${statusText}</span>
                                </div>
                                <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;">
                                    <div style="width: ${progressPct}%; height: 100%; background: ${isFull ? '#ef4444' : 'linear-gradient(90deg, #CCFF00, #10b981)'}; border-radius: 3px;"></div>
                                </div>
                            </div>

                            <!-- Location Box -->
                            <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 7px 10px; display: flex; align-items: center; gap: 6px; color: #e2e8f0; font-size: 0.75rem; font-weight: 800; margin-bottom: 10px;">
                                <i class="fas fa-map-marker-alt" style="color: #ef4444;"></i>
                                <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">Sede Oficial: <strong>${sede}</strong></span>
                            </div>

                            <!-- Story Call To Action Banner -->
                            <div style="background: linear-gradient(135deg, #CCFF00, #10b981); color: #000; border-radius: 12px; padding: 9px 12px; text-align: center; font-weight: 950; font-size: 0.78rem; letter-spacing: 0.4px; box-shadow: 0 4px 14px rgba(204,255,0,0.35);">
                                📲 ¡RESERVA TU PLAZA EN EL LINK DE LA BIO!
                            </div>
                            <div style="text-align: center; color: #94a3b8; font-size: 0.62rem; font-weight: 700; margin-top: 6px; letter-spacing: 0.5px;">
                                @somospadelbcn • somospadel.com
                            </div>
                        </div>
                    </div>

                    <!-- BOTONES DE ACCIÓN PARA INSTAGRAM (MODO AVANZADO DIRECTO) -->
                    <div style="display: flex; flex-direction: column; gap: 9px; width: 100%; max-width: 360px; margin-top: 14px;">
                        <!-- Botón Principal 1: Abrir directo en App Instagram Stories -->
                        <button id="btn-direct-ig-action" 
                                onclick="window.EventsController.launchDirectInstagram(window._lastInstagramEvent)" 
                                style="
                                    width: 100%;
                                    padding: 13px 14px;
                                    background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
                                    color: #ffffff;
                                    border: none;
                                    border-radius: 14px;
                                    font-weight: 950;
                                    font-size: 0.88rem;
                                    cursor: pointer;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    gap: 9px;
                                    box-shadow: 0 6px 22px rgba(225,48,108,0.5);
                                    transition: transform 0.15s, box-shadow 0.15s;
                                "
                                onmouseover="this.style.transform='scale(1.02)';"
                                onmouseout="this.style.transform='scale(1)';"
                                onmousedown="this.style.transform='scale(0.98)';">
                            <i class="fab fa-instagram" style="font-size: 1.25rem;"></i>
                            <span>⚡ ABRIR EN APP INSTAGRAM</span>
                        </button>

                        <!-- Botón 2: Compartir mediante Menú del Sistema -->
                        <button id="btn-share-ig-action" 
                                onclick="window.EventsController.executeInstagramShare(window._lastInstagramEvent)" 
                                style="
                                    width: 100%;
                                    padding: 10px 14px;
                                    background: rgba(255,255,255,0.08);
                                    border: 1px solid rgba(225,48,108,0.4);
                                    color: #ffffff;
                                    border-radius: 13px;
                                    font-weight: 900;
                                    font-size: 0.8rem;
                                    cursor: pointer;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    gap: 8px;
                                    backdrop-filter: blur(8px);
                                    transition: transform 0.15s, background 0.15s;
                                "
                                onmouseover="this.style.background='rgba(225,48,108,0.18)';"
                                onmouseout="this.style.background='rgba(255,255,255,0.08)';"
                                onmousedown="this.style.transform='scale(0.98)';">
                            <i class="fas fa-share-nodes" style="color: #E1306C; font-size: 0.95rem;"></i>
                            <span>📲 Menú Compartir del Móvil</span>
                        </button>

                        <div style="display: flex; gap: 8px; width: 100%;">
                            <!-- Botón 3: Guardar en Galería -->
                            <button onclick="window.EventsController.downloadInstagramStory(window._lastInstagramEvent)" 
                                    style="
                                        flex: 1;
                                        padding: 9px;
                                        background: rgba(255,255,255,0.05);
                                        border: 1px solid rgba(255,255,255,0.15);
                                        color: #ffffff;
                                        border-radius: 11px;
                                        font-weight: 850;
                                        font-size: 0.73rem;
                                        cursor: pointer;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        gap: 6px;
                                    ">
                                <i class="fas fa-download" style="color: #38bdf8;"></i> Guardar Foto
                            </button>

                            <!-- Botón 4: Copiar Texto -->
                            <button onclick="window.EventsController.copyInstagramCaption(window._lastInstagramEvent)" 
                                    style="
                                        flex: 1;
                                        padding: 9px;
                                        background: rgba(255,255,255,0.05);
                                        border: 1px solid rgba(255,255,255,0.15);
                                        color: #ffffff;
                                        border-radius: 11px;
                                        font-weight: 850;
                                        font-size: 0.73rem;
                                        cursor: pointer;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        gap: 6px;
                                    ">
                                <i class="fas fa-copy" style="color: #CCFF00;"></i> Copiar Texto
                            </button>
                        </div>

                        <!-- Micro-Guía de Asistencia Pro -->
                        <div style="background: rgba(225,48,108,0.08); border: 1px dashed rgba(225,48,108,0.35); border-radius: 12px; padding: 8px 10px; display: flex; align-items: center; gap: 8px; margin-top: 2px;">
                            <i class="fas fa-bolt" style="color: #E1306C; font-size: 0.95rem; flex-shrink: 0;"></i>
                            <div style="font-size: 0.65rem; color: #cbd5e1; line-height: 1.25;">
                                <strong>Modo Automático:</strong> Abre la cámara de Instagram Stories con la foto copiada y guardada en tu galería para publicar al instante.
                            </div>
                        </div>
                    </div>
                </div>
            `;

            window._lastInstagramEvent = evt;
            this._cachedStoryCanvas = null;
            this._cachedStoryBlob = null;
            this._cachedStoryEventId = null;

            overlay.style.display = 'flex';
            requestAnimationFrame(() => {
                overlay.style.opacity = '1';
                // Pre-render silencioso en background para que el click sea 100% instantáneo
                setTimeout(() => {
                    this._getOrRenderStoryCanvas(evt).catch(() => {});
                }, 120);
            });
        }

        closeInstagramStoryModal() {
            const overlay = document.getElementById('sp-instagram-story-modal');
            if (overlay) {
                overlay.style.opacity = '0';
                setTimeout(() => {
                    overlay.style.display = 'none';
                }, 250);
            }
        }

        async _getOrRenderStoryCanvas(evt) {
            if (this._cachedStoryCanvas && this._cachedStoryBlob && this._cachedStoryEventId === evt.id) {
                return { canvas: this._cachedStoryCanvas, blob: this._cachedStoryBlob };
            }
            const cardEl = document.getElementById('instagram-story-capture-card');
            if (!cardEl) return { canvas: null, blob: null };

            await this._ensureHtml2Canvas();
            if (typeof html2canvas === 'undefined') throw new Error("html2canvas no disponible");

            const canvas = await html2canvas(cardEl, {
                scale: 2.5,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#060b14',
                logging: false
            });

            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            this._cachedStoryCanvas = canvas;
            this._cachedStoryBlob = blob;
            this._cachedStoryEventId = evt.id;

            return { canvas, blob };
        }

        async launchDirectInstagram(evt) {
            if (!evt) return;
            const directBtn = document.getElementById('btn-direct-ig-action');
            const originalHtml = directBtn ? directBtn.innerHTML : '';
            if (directBtn) {
                directBtn.disabled = true;
                directBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Abriendo Instagram Stories...';
            }

            try {
                const { canvas, blob } = await this._getOrRenderStoryCanvas(evt);
                if (!canvas || !blob) throw new Error("No se pudo renderizar la Story");

                // 1. Guardar/Descargar copia en el dispositivo para que aparezca como foto #1 en la galería de Instagram
                await this.downloadInstagramStory(evt, canvas, false);

                // 2. Intentar copiar imagen binaria al portapapeles para sticker automático en Stories
                const captionText = `🎾 ¡NUEVA CONVOCATORIA EN SOMOSPADEL BARCELONA! 🎾\n\n🏆 ${evt.name}\n📅 Fecha: ${evt.date}\n⏰ Horario: ${this.formatEventTime(evt)}\n📍 Sede: ${evt.sede || evt.location || 'SomosPadel BCN'}\n👥 Plazas: ${evt.players ? evt.players.length : 0} inscritos\n💰 Tarifa: ${evt.price_members || 10}€ socios / ${evt.price_external || 10}€ no socios\n\n📲 ¡Reserva tu plaza en el link de la bio @somospadelbcn!\n\n#SomosPadel #PadelBarcelona #AmericanasPadel #PadelAddict`;

                if (navigator.clipboard) {
                    try {
                        if (window.ClipboardItem) {
                            await navigator.clipboard.write([
                                new ClipboardItem({ 'image/png': blob })
                            ]);
                        } else if (navigator.clipboard.writeText) {
                            await navigator.clipboard.writeText(captionText);
                        }
                    } catch (clipErr) {
                        console.warn("ClipboardItem write:", clipErr);
                        try {
                            if (navigator.clipboard.writeText) await navigator.clipboard.writeText(captionText);
                        } catch (e) {}
                    }
                }

                if (window.NotificationService) {
                    window.NotificationService.show("🚀 ¡Abriendo Instagram Stories! Imagen guardada y lista en tu galería.", "success");
                }

                // 3. Deep link nativo a la cámara de Instagram Stories
                const ua = navigator.userAgent || navigator.vendor || window.opera || '';
                const isAndroid = /android/i.test(ua);
                const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;

                if (isAndroid) {
                    // Intent nativo directo a la cámara de Stories de Instagram
                    const intentUrl = 'intent://story-camera#Intent;package=com.instagram.android;scheme=instagram;end;';
                    window.location.href = intentUrl;
                    setTimeout(() => {
                        window.location.href = 'instagram://story-camera';
                    }, 500);
                    setTimeout(() => {
                        window.location.href = 'https://www.instagram.com/';
                    }, 1600);
                } else if (isIOS) {
                    // Esquema directo en iOS
                    window.location.href = 'instagram-stories://share?source_application=somospadel';
                    setTimeout(() => {
                        window.location.href = 'instagram://story-camera';
                    }, 500);
                    setTimeout(() => {
                        window.location.href = 'https://www.instagram.com/';
                    }, 1600);
                } else {
                    // Desktop: abre Instagram Web
                    window.open('https://www.instagram.com/', '_blank');
                }

            } catch (err) {
                console.error("Error en launchDirectInstagram:", err);
                if (window.NotificationService) {
                    window.NotificationService.show("Usa 'Guardar Foto' para subirla manualmente a Stories.", "warning");
                }
            } finally {
                if (directBtn) {
                    directBtn.disabled = false;
                    directBtn.innerHTML = originalHtml;
                }
            }
        }

        async executeInstagramShare(evt) {
            if (!evt) return;
            const shareBtn = document.getElementById('btn-share-ig-action');
            const originalHtml = shareBtn ? shareBtn.innerHTML : '';
            if (shareBtn) {
                shareBtn.disabled = true;
                shareBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Preparando Menú...';
            }

            try {
                const { canvas, blob } = await this._getOrRenderStoryCanvas(evt);
                if (!canvas || !blob) throw new Error("No se pudo obtener el gráfico");

                const captionText = `🎾 ¡NUEVA CONVOCATORIA EN SOMOSPADEL BARCELONA! 🎾\n\n🏆 ${evt.name}\n📅 Fecha: ${evt.date}\n⏰ Horario: ${this.formatEventTime(evt)}\n📍 Sede: ${evt.sede || evt.location || 'SomosPadel BCN'}\n👥 Plazas: ${evt.players ? evt.players.length : 0} inscritos\n💰 Tarifa: ${evt.price_members || 10}€ socios / ${evt.price_external || 10}€ no socios\n\n📲 ¡Reserva tu plaza en el link de la bio @somospadelbcn!\n\n#SomosPadel #PadelBarcelona #AmericanasPadel #PadelAddict`;

                try {
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        await navigator.clipboard.writeText(captionText);
                    }
                } catch (e) {}

                const fileName = `somospadel_story_${(evt.name || 'evento').replace(/\s+/g, '_').toLowerCase()}.png`;
                const file = new File([blob], fileName, { type: 'image/png' });

                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            title: `SomosPadel: ${evt.name}`,
                            text: captionText,
                            files: [file]
                        });
                        if (window.NotificationService) {
                            window.NotificationService.show("¡Compartido con éxito!", "success");
                        }
                        return;
                    } catch (shareErr) {
                        if (shareErr.name === 'AbortError') return;
                        console.warn("Native file share fallback:", shareErr);
                    }
                }

                // Fallback si navigator.share no está disponible
                this.downloadInstagramStory(evt, canvas, false);
                window.open('https://www.instagram.com/', '_blank');
                if (window.NotificationService) {
                    window.NotificationService.show("📸 Flyer guardado y texto copiado. Abriendo Instagram.", "success");
                }

            } catch (err) {
                console.error("Error en executeInstagramShare:", err);
                alert("No se pudo abrir el menú nativo. Usa 'Guardar Foto'.");
            } finally {
                if (shareBtn) {
                    shareBtn.disabled = false;
                    shareBtn.innerHTML = originalHtml;
                }
            }
        }

        async downloadInstagramStory(evt, existingCanvas = null, showToast = true) {
            try {
                let canvas = existingCanvas;
                if (!canvas) {
                    const res = await this._getOrRenderStoryCanvas(evt);
                    canvas = res.canvas;
                }
                if (!canvas) return;

                const link = document.createElement('a');
                link.download = `somospadel_story_${(evt.name || 'evento').replace(/\s+/g, '_').toLowerCase()}.png`;
                link.href = canvas.toDataURL('image/png');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                if (showToast && window.NotificationService) {
                    window.NotificationService.show("📥 ¡Imagen HD descargada en tu dispositivo!", "success");
                }
            } catch (e) {
                console.error("Error al descargar Story:", e);
            }
        }

        async copyInstagramCaption(evt) {
            if (!evt) return;
            const captionText = `🎾 ¡NUEVA CONVOCATORIA EN SOMOSPADEL BARCELONA! 🎾\n\n🏆 ${evt.name}\n📅 Fecha: ${evt.date}\n⏰ Horario: ${this.formatEventTime(evt)}\n📍 Sede: ${evt.sede || evt.location || 'SomosPadel BCN'}\n👥 Plazas: ${evt.players ? evt.players.length : 0} inscritos\n💰 Tarifa: ${evt.price_members || 10}€ socios / ${evt.price_external || 10}€ no socios\n\n📲 ¡Reserva tu plaza ahora en el link de la bio @somospadelbcn!\n\n#SomosPadel #PadelBarcelona #AmericanasPadel #PadelAddict`;
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(captionText);
                }
                if (window.NotificationService) {
                    window.NotificationService.show("📋 ¡Texto y hashtags copiados!", "success");
                } else {
                    alert("📋 ¡Texto de Instagram copiado al portapapeles!");
                }
            } catch (e) {
                console.warn("Clipboard error:", e);
            }
        }

        // ==========================================
        // 🔒 GESTIÓN DE AMERICANAS PRIVADAS CON PIN
        // ==========================================
        isAmericanaUnlocked(evt) {
            if (!evt) return true;
            const isPrivate = (evt.is_private === true || evt.is_private === 'true');
            if (!isPrivate) return true;

            // 1. Administrador siempre tiene acceso
            const user = this.state.currentUser;
            if (user && (user.role === 'admin' || user.role === 'super_admin' || user.role === 'admin_player')) {
                return true;
            }

            // 2. Si el jugador ya está inscrito en la convocatoria
            const players = evt.players || evt.registeredPlayers || [];
            if (user && players.some(p => (p.id === user.id || p.uid === user.id || p.name === user.name))) {
                return true;
            }

            // 3. Si el jugador ya introdujo la contraseña en este dispositivo
            const unlockKey = `unlocked_americana_${evt.id}`;
            if (localStorage.getItem(unlockKey) === 'true') {
                return true;
            }

            // 4. Si la americana no tiene clave configurada
            if (!evt.access_pin || !String(evt.access_pin).trim()) {
                return true;
            }

            return false;
        }

        promptPrivatePassword(id, type = 'americana', action = 'view') {
            const events = type === 'entreno' ? this.state.entrenos : this.state.americanas;
            const evt = events.find(e => e.id === id);
            if (!evt) return;

            if (this.isAmericanaUnlocked(evt)) {
                this._executeUnlockedAction(id, type, action);
                return;
            }

            let overlay = document.getElementById('sp-private-americana-modal');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'sp-private-americana-modal';
                overlay.style.cssText = `
                    position: fixed;
                    inset: 0;
                    background: rgba(4, 7, 15, 0.94);
                    backdrop-filter: blur(16px);
                    -webkit-backdrop-filter: blur(16px);
                    z-index: 99999999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 16px;
                    box-sizing: border-box;
                    opacity: 0;
                    transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                    font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
                `;
                document.body.appendChild(overlay);

                overlay.addEventListener('click', (e) => {
                    if (e.target === overlay) this.closePrivatePasswordModal();
                });

                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape' && overlay.style.display !== 'none') {
                        this.closePrivatePasswordModal();
                    }
                });
            }

            overlay.innerHTML = `
                <div style="
                    position: relative;
                    width: 100%;
                    max-width: 390px;
                    background: #090e18;
                    border: 1.5px solid rgba(239, 68, 68, 0.45);
                    border-radius: 26px;
                    padding: 24px 20px 22px;
                    box-shadow: 0 25px 60px rgba(0,0,0,0.95), 0 0 35px rgba(239, 68, 68, 0.25);
                    box-sizing: border-box;
                    text-align: center;
                    margin: auto;
                ">
                    <!-- Botón Cerrar -->
                    <button type="button" onclick="window.EventsController.closePrivatePasswordModal()" 
                            aria-label="Cerrar"
                            style="position: absolute; top: -12px; right: -12px; width: 36px; height: 36px; border-radius: 50%; background: #0f172a; color: #ffffff; border: 2px solid #ef4444; font-size: 1rem; font-weight: 900; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(0,0,0,0.6);">
                        ✕
                    </button>

                    <!-- Icono Candado Neón -->
                    <div style="width: 68px; height: 68px; margin: 0 auto 14px; border-radius: 20px; background: rgba(239, 68, 68, 0.12); border: 2px solid rgba(239, 68, 68, 0.4); display: flex; align-items: center; justify-content: center; box-shadow: 0 0 25px rgba(239, 68, 68, 0.3);">
                        <i class="fas fa-lock" style="font-size: 2rem; color: #f87171;"></i>
                    </div>

                    <!-- Títulos -->
                    <div style="display: inline-block; background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.35); padding: 3px 10px; border-radius: 8px; font-size: 0.65rem; font-weight: 950; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 8px;">
                        🔒 AMERICANA PRIVADA
                    </div>
                    
                    <h3 style="color: #ffffff; font-size: 1.2rem; font-weight: 950; margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: -0.3px;">
                        ${evt.name || 'Americana Exclusiva'}
                    </h3>
                    
                    <p style="color: #94a3b8; font-size: 0.78rem; line-height: 1.4; margin: 0 0 18px 0;">
                        Esta convocatoria está reservada para un grupo privado. Introduce la clave de acceso facilitada por el organizador para entrar a ver los partidos, resultados y participar.
                    </p>

                    <!-- Formulario de Clave -->
                    <form onsubmit="event.preventDefault(); window.EventsController.verifyPrivatePassword('${evt.id}', '${evt.type || 'americana'}', '${action}');" style="display: flex; flex-direction: column; gap: 12px;">
                        <div style="position: relative; width: 100%;">
                            <input type="password" id="sp-private-pin-input" 
                                   placeholder="Introduce la contraseña..." 
                                   autocomplete="off"
                                   style="
                                       width: 100%;
                                       padding: 13px 44px 13px 16px;
                                       background: rgba(15, 23, 42, 0.85);
                                       border: 1.5px solid rgba(255, 255, 255, 0.15);
                                       border-radius: 14px;
                                       color: #ffffff;
                                       font-size: 1rem;
                                       font-weight: 900;
                                       letter-spacing: 2px;
                                       text-align: center;
                                       box-sizing: border-box;
                                       outline: none;
                                       transition: border-color 0.2s, box-shadow 0.2s;
                                   "
                                   onfocus="this.style.borderColor='#f87171'; this.style.boxShadow='0 0 15px rgba(239, 68, 68, 0.3)';"
                                   onblur="this.style.borderColor='rgba(255, 255, 255, 0.15)'; this.style.boxShadow='none';">
                            
                            <button type="button" onclick="window.EventsController.togglePinVisibility()" 
                                    aria-label="Ver contraseña"
                                    style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #94a3b8; font-size: 1rem; cursor: pointer; padding: 4px;">
                                <i id="sp-pin-eye-icon" class="fas fa-eye"></i>
                            </button>
                        </div>

                        <div id="sp-private-error-msg" style="display: none; color: #f87171; font-size: 0.72rem; font-weight: 800;">
                            <i class="fas fa-exclamation-circle"></i> Contraseña incorrecta. Pide la clave al organizador.
                        </div>

                        <button type="submit" id="sp-btn-unlock-private" style="
                            width: 100%;
                            padding: 13px;
                            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                            color: #ffffff;
                            border: none;
                            border-radius: 14px;
                            font-size: 0.88rem;
                            font-weight: 950;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 8px;
                            box-shadow: 0 4px 18px rgba(239, 68, 68, 0.45);
                            transition: transform 0.15s, box-shadow 0.15s;
                        "
                        onmouseover="this.style.transform='scale(1.02)';"
                        onmouseout="this.style.transform='scale(1)';"
                        onmousedown="this.style.transform='scale(0.98)';">
                            <i class="fas fa-unlock"></i>
                            <span>DESBLOQUEAR Y ENTRAR</span>
                        </button>
                    </form>
                </div>
            `;

            overlay.style.display = 'flex';
            requestAnimationFrame(() => {
                overlay.style.opacity = '1';
                const pinInput = document.getElementById('sp-private-pin-input');
                if (pinInput) pinInput.focus();
            });
        }

        togglePinVisibility() {
            const input = document.getElementById('sp-private-pin-input');
            const icon = document.getElementById('sp-pin-eye-icon');
            if (!input || !icon) return;
            if (input.type === 'password') {
                input.type = 'text';
                icon.className = 'fas fa-eye-slash';
            } else {
                input.type = 'password';
                icon.className = 'fas fa-eye';
            }
        }

        closePrivatePasswordModal() {
            const overlay = document.getElementById('sp-private-americana-modal');
            if (overlay) {
                overlay.style.opacity = '0';
                setTimeout(() => {
                    overlay.style.display = 'none';
                }, 250);
            }
        }

        verifyPrivatePassword(id, type = 'americana', action = 'view') {
            const events = type === 'entreno' ? this.state.entrenos : this.state.americanas;
            const evt = events.find(e => e.id === id);
            if (!evt) return;

            const input = document.getElementById('sp-private-pin-input');
            const errorEl = document.getElementById('sp-private-error-msg');
            const enteredPin = (input?.value || '').trim();
            const expectedPin = String(evt.access_pin || evt.access_password || '').trim();

            if (enteredPin && (enteredPin.toLowerCase() === expectedPin.toLowerCase())) {
                localStorage.setItem(`unlocked_americana_${id}`, 'true');
                if (window.navigator?.vibrate) window.navigator.vibrate([30, 50, 30]);

                if (window.NotificationService) {
                    window.NotificationService.show("🔓 ¡Americana Desbloqueada con éxito!", "success");
                }

                this.closePrivatePasswordModal();
                this._executeUnlockedAction(id, type, action);

                // Re-renderizamos para reflejar el estado desbloqueado
                setTimeout(() => this.render(), 100);
            } else {
                if (window.navigator?.vibrate) window.navigator.vibrate(100);
                if (errorEl) errorEl.style.display = 'block';
                if (input) {
                    input.style.borderColor = '#ef4444';
                    input.select();
                }
            }
        }

        _executeUnlockedAction(id, type, action) {
            if (action === 'join') {
                this.joinEvent(id, type);
            } else if (action === 'inscritos') {
                this.showInscritosModal(id, type);
            } else if (action === 'results') {
                if (window.openResultsView) window.openResultsView(id, type);
            } else {
                this.openLiveEvent(id, type);
            }
        }

        openDescriptionModal(id, type = 'americana') {
            const events = type === 'entreno' ? this.state.entrenos : this.state.americanas;
            const evt = events.find(e => e.id === id) || {};
            const title = evt.name || 'Americana SomosPadel';
            const club = evt.sede || evt.location || evt.club || 'Sede Oficial';
            const desc = (evt.description && evt.description.trim()) ? evt.description.trim() : 'No hay notas o avisos adicionales para esta convocatoria.';

            let modal = document.getElementById('sp-description-modal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'sp-description-modal';
                modal.style.cssText = `
                    position: fixed;
                    inset: 0;
                    background: rgba(4, 7, 15, 0.92);
                    backdrop-filter: blur(14px);
                    -webkit-backdrop-filter: blur(14px);
                    z-index: 9999999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 16px;
                    box-sizing: border-box;
                    opacity: 0;
                    transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                    font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
                `;
                document.body.appendChild(modal);

                modal.addEventListener('click', (e) => {
                    if (e.target === modal) this.closeDescriptionModal();
                });

                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape' && modal.style.display !== 'none') {
                        this.closeDescriptionModal();
                    }
                });
            }

            modal.innerHTML = `
                <div style="
                    position: relative;
                    width: 100%;
                    max-width: 480px;
                    max-height: 90vh;
                    display: flex;
                    flex-direction: column;
                    background: #090e18;
                    border: 1.5px solid rgba(56, 189, 248, 0.45);
                    border-radius: 22px;
                    padding: 16px 16px 18px;
                    box-shadow: 0 25px 60px rgba(0,0,0,0.9), 0 0 35px rgba(56, 189, 248, 0.15);
                    box-sizing: border-box;
                ">
                    <!-- Botón Cerrar Circular Flotante -->
                    <button type="button" onclick="window.EventsController.closeDescriptionModal()"
                            aria-label="Cerrar avisos"
                            style="
                                position: absolute;
                                top: -14px;
                                right: -14px;
                                width: 38px;
                                height: 38px;
                                border-radius: 50%;
                                background: #0f172a;
                                color: #38bdf8;
                                border: 2px solid #38bdf8;
                                font-size: 1.1rem;
                                font-weight: 900;
                                cursor: pointer;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                box-shadow: 0 4px 15px rgba(0,0,0,0.6);
                                z-index: 30;
                                transition: transform 0.15s;
                            "
                            onmouseover="this.style.transform='scale(1.1) rotate(90deg)';"
                            onmouseout="this.style.transform='scale(1) rotate(0deg)';">
                        ✕
                    </button>

                    <!-- Header -->
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding: 0 2px;">
                        <span style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.4); font-size: 0.65rem; font-weight: 950; padding: 4px 10px; border-radius: 8px; letter-spacing: 0.5px; display: inline-flex; align-items: center; gap: 5px;">
                            <i class="fas fa-bullhorn"></i> AVISOS DEL ORGANIZADOR
                        </span>
                        <span style="font-size: 0.72rem; color: #94a3b8; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 50%;">
                            <i class="fas fa-map-marker-alt" style="color: #38bdf8;"></i> ${club}
                        </span>
                    </div>

                    <!-- Título -->
                    <h3 style="margin: 0 0 10px; font-size: 1.1rem; font-weight: 950; color: #fff; text-transform: uppercase; line-height: 1.25; letter-spacing: -0.3px;">
                        ${title}
                    </h3>

                    ${evt.organizer ? `
                        <div style="margin-bottom: 12px; background: rgba(204, 255, 0, 0.08); border: 1px solid rgba(204, 255, 0, 0.25); border-radius: 12px; padding: 8px 12px; display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-user-tie" style="color: #CCFF00; font-size: 0.9rem;"></i>
                            <div style="font-size: 0.8rem; color: #f1f5f9;">
                                <span style="color: #94a3b8; font-weight: 700;">Organizado por:</span> <strong style="color: #CCFF00; font-weight: 900;">${evt.organizer}</strong>
                            </div>
                        </div>
                    ` : ''}

                    <!-- Caja de Contenido de la Descripción -->
                    <div style="
                        background: rgba(15, 23, 42, 0.75);
                        border: 1px solid rgba(255, 255, 255, 0.08);
                        border-radius: 14px;
                        padding: 16px;
                        color: #f1f5f9;
                        font-size: 0.92rem;
                        line-height: 1.6;
                        overflow-y: auto;
                        max-height: 52vh;
                        white-space: pre-wrap;
                        word-break: break-word;
                        box-shadow: inset 0 2px 10px rgba(0,0,0,0.5);
                    ">${desc}</div>

                    <!-- Botón Cerrar Inferior -->
                    <div style="margin-top: 14px; width: 100%;">
                        <button type="button" onclick="window.EventsController.closeDescriptionModal()"
                                style="
                                    width: 100%;
                                    padding: 12px 16px;
                                    background: linear-gradient(135deg, #0284c7, #2563eb);
                                    color: #ffffff;
                                    border: none;
                                    border-radius: 12px;
                                    font-weight: 950;
                                    font-size: 0.82rem;
                                    cursor: pointer;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    gap: 6px;
                                    box-shadow: 0 4px 15px rgba(2, 132, 199, 0.4);
                                    letter-spacing: 0.5px;
                                ">
                            <i class="fas fa-check"></i> ENTENDIDO
                        </button>
                    </div>
                </div>
            `;

            modal.style.display = 'flex';
            requestAnimationFrame(() => {
                modal.style.opacity = '1';
            });
        }

        closeDescriptionModal() {
            const modal = document.getElementById('sp-description-modal');
            if (modal) {
                modal.style.opacity = '0';
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 250);
            }
        }

        async openLiveEvent(id, type = 'americana', action = null) {
            const events = type === 'entreno' ? this.state.entrenos : this.state.americanas;
            const evt = events?.find(e => e.id === id);
            if (evt && !this.isAmericanaUnlocked(evt)) {
                this.promptPrivatePassword(id, type, 'view');
                return;
            }

            if (!window.ControlTowerView && window.ControlTowerViewClass) {
                window.ControlTowerView = new window.ControlTowerViewClass();
            }
            if (window.ControlTowerView) {
                window.ControlTowerView.prepareLoad(id, type, action);
                window.Router.navigate('live');
            } else {
                window.PremiumModal.alert({ title: "⏳ CARGANDO", message: "Cargando módulo de control de pista..." });
            }
        }

        async waitForService() {
            if (window.AmericanaService && (window.AmericanaService.db || window.AmericanaService._getCollectionService)) return true;
            
            console.log("⏳ [EventsController] Waiting for AmericanaService...");
            for (let i = 0; i < 50; i++) {
                if (window.AmericanaService && (window.AmericanaService.db || window.AmericanaService._getCollectionService)) {
                    console.log("✅ [EventsController] AmericanaService ready.");
                    return true;
                }
                await new Promise(r => setTimeout(r, 200));
            }
            console.error("❌ [EventsController] AmericanaService TIMEOUT. Check AppInit.");
            window.PremiumModal.alert({
                title: "⚠️ TIEMPO AGOTADO",
                message: "Los servicios de inscripción no están respondiendo. Por favor, recarga la página.",
                type: 'danger'
            });
            return false;
        }

        async joinEvent(id, type = 'americana') {
            try {
                if (!this.state.currentUser) {
                    window.PremiumModal.alert({ title: "🔒 ACCESO", message: "Inicia sesión para inscribirte." });
                    return;
                }

                if (type === 'entreno' && this.state.currentUser?.role === 'player_americanas') {
                    window.PremiumModal.alert({
                        title: "🏆 ACCESO EXCLUSIVO",
                        message: "Tu perfil de jugador está asignado exclusivamente a Americanas. No tienes acceso a inscripciones de entrenos."
                    });
                    return;
                }

                const events = type === 'entreno' ? this.state.entrenos : this.state.americanas;
                const evt = events.find(e => e.id === id);
                if (!evt) return;

                // 🛑 Comprobación estricta de género del jugador
                const genderCheck = this.checkGenderEligibility(evt, this.state.currentUser);
                if (!genderCheck.eligible) {
                    window.PremiumModal.alert({
                        title: genderCheck.title,
                        message: genderCheck.message,
                        type: 'warning'
                    });
                    return;
                }

                if (!this.isAmericanaUnlocked(evt)) {
                    this.promptPrivatePassword(id, type, 'join');
                    return;
                }

                const mode = (evt.pair_mode || evt.format || '').toLowerCase();
                const isFixed = mode === 'fixed' || (evt.name || '').toUpperCase().includes('FIJA');

                if (await this.waitForService()) {
                    // 🛡️ PREVENT DOUBLE-CLICK SPAM (429 Protection)
                    if (this.isJoining) return;
                    this.isJoining = true;

                    let partnerName = null;
                    let partnerId = null;

                    if (isFixed) {
                        const choice = await window.PremiumModal.confirm({
                            title: "🎾 PAREJA FIJA",
                            message: "¿Te apuntas solo o con tu compañero habitual?",
                            confirmText: "ELEGIR PAREJA",
                            cancelText: "SOLO"
                        });

                        if (choice) {
                            const playersSvc = window.createService('players');
                            const allPlayers = await playersSvc.getAll();
                            const currentUid = this.state.currentUser.uid || this.state.currentUser.id;
                            const items = allPlayers
                                .filter(p => p.id !== currentUid)
                                .map(p => ({
                                    id: p.id,
                                    name: p.name || 'Sin nombre',
                                    sub: `Nivel: ${p.level || p.self_rate_level || '3.5'} • ${p.phone || 'SP Player'}`,
                                    image: p.photo_url || p.photo
                                }));

                            const selectedPartner = await window.PremiumModal.selector({
                                title: "🔍 BUSCAR COMPAÑERO",
                                message: "Selecciona a tu compañero de la base de datos:",
                                items: items,
                                placeholder: "Escribe nombre o teléfono..."
                            });

                            if (!selectedPartner) {
                                this.isJoining = false;
                                return;
                            }

                            // Validar también el género del compañero en eventos masculinos o femeninos
                            if (genderCheck.catType === 'male' || genderCheck.catType === 'female') {
                                const partnerFull = allPlayers.find(p => (p.id === selectedPartner.id || p.uid === selectedPartner.id));
                                if (partnerFull) {
                                    const partnerGenderCheck = this.checkGenderEligibility(evt, partnerFull);
                                    if (!partnerGenderCheck.eligible) {
                                        window.PremiumModal.alert({
                                            title: "⛔ COMPAÑERO NO VÁLIDO",
                                            message: `El jugador seleccionado (${selectedPartner.name}) no cumple con la categoría del evento (${genderCheck.catType === 'male' ? 'debe ser chico' : 'debe ser chica'}).`,
                                            type: 'warning'
                                        });
                                        this.isJoining = false;
                                        return;
                                    }
                                }
                            }

                            partnerName = selectedPartner.name;
                            partnerId = selectedPartner.id;
                        } else {
                            const confirmSolo = await window.PremiumModal.confirm({
                                title: "⚖️ APUNTARSE SOLO",
                                message: "Te apuntarás sin pareja. El sistema o el admin te asignarán una más adelante. ¿Continuar?",
                                confirmText: "SÍ, APUNTARME"
                            });
                            if (!confirmSolo) {
                                this.isJoining = false;
                                return;
                            }
                        }
                    } else {
                        const confirmed = await window.PremiumModal.confirm({
                            title: "🎾 INSCRIBIRSE",
                            message: "¿Quieres apuntarte a este evento?",
                            confirmText: "SÍ, APUNTARME"
                        });
                        if (!confirmed) {
                            this.isJoining = false;
                            return;
                        }
                    }

                    const userToJoin = {
                        ...this.state.currentUser,
                        uid: this.state.currentUser.uid || this.state.currentUser.id,
                        id: this.state.currentUser.uid || this.state.currentUser.id
                    };

                    const res = await window.AmericanaService.addPlayer(id, userToJoin, type, partnerName, partnerId);
                    
                    this.isJoining = false; 

                    if (res.success) {
                        this.onDataUpdate();
                        // 🎊 CONFETTI FEEDBACK (Punto 6)
                        if (window.confetti) {
                            window.confetti({
                                particleCount: 100,
                                spread: 70,
                                origin: { y: 0.6 },
                                colors: ['#CCFF00', '#00E36D', '#ffffff']
                            });
                        }
                    }

                    window.PremiumModal.alert({
                        title: res.success ? "✅ ÉXITO" : "❌ ERROR",
                        message: res.success ? (partnerName ? `Inscrito correctamente con ${partnerName}.` : "Te has inscrito correctamente.") : "Error: " + res.error,
                        type: res.success ? 'success' : 'error'
                    });
                }
            } catch (err) {
                this.isJoining = false; 
                console.error("Error joining event:", err);
                const msg = err.message || "Error desconocido";
                window.PremiumModal.alert({ title: "❌ ERROR", message: "Error al intentar apuntarse: " + msg, type: 'error' });
            }
        }

        async leaveEvent(id, type = 'americana') {
            try {
                if (!this.state.currentUser) {
                    window.PremiumModal.alert({ title: "🔒 ACCESO", message: "Inicia sesión." });
                    return;
                }
                if (await this.waitForService()) {
                    const confirmed = await window.PremiumModal.confirm({
                        title: "👋 DARSE DE BAJA",
                        message: "¿Seguro que quieres borrarte del evento?",
                        confirmText: "SÍ, BORRARME",
                        confirmColor: "#FF3B30",
                        type: 'danger'
                    });
                    if (!confirmed) return;

                    const userUid = this.state.currentUser.uid || this.state.currentUser.id;
                    const res = await window.AmericanaService.removePlayer(id, userUid, type);
                    
                    if (res.success) {
                        this.onDataUpdate(); // 🚀 REFRESH INSTANTÁNEO
                    }

                    window.PremiumModal.alert({
                        title: res.success ? "✅ TRÁMITE REALIZADO" : "❌ ERROR",
                        message: res.success ? "Baja tramitada correctamente." : "Error: " + res.error,
                        type: res.success ? 'success' : 'error'
                    });
                }
            } catch (err) {
                console.error("Error leaving event:", err);
                window.PremiumModal.alert({ title: "❌ ERROR", message: "Error al tramitar la baja: " + err.message, type: 'error' });
            }
        }

        async joinWaitlist(id, type = 'americana') {
            try {
                if (!this.state.currentUser) {
                    window.PremiumModal.alert({ title: "🔒 ACCESO", message: "Inicia sesión." });
                    return;
                }

                if (type === 'entreno' && this.state.currentUser?.role === 'player_americanas') {
                    window.PremiumModal.alert({
                        title: "🏆 ACCESO EXCLUSIVO",
                        message: "Tu perfil de jugador está asignado exclusivamente a Americanas."
                    });
                    return;
                }

                const events = type === 'entreno' ? this.state.entrenos : this.state.americanas;
                const evt = events?.find(e => e.id === id);
                if (!evt) return;

                // 🛑 Comprobación estricta de género para lista de espera
                const genderCheck = this.checkGenderEligibility(evt, this.state.currentUser);
                if (!genderCheck.eligible) {
                    window.PremiumModal.alert({
                        title: genderCheck.title,
                        message: genderCheck.message,
                        type: 'warning'
                    });
                    return;
                }

                if (!this.isAmericanaUnlocked(evt)) {
                    this.promptPrivatePassword(id, type, 'join');
                    return;
                }

                const confirmed = await window.PremiumModal.confirm({
                    title: "⏳ LISTA DE ESPERA",
                    message: "El evento está lleno. ¿Quieres entrar en lista de espera? Te avisaremos si queda una plaza libre.",
                    confirmText: "ENTRAR EN ESPERA",
                    type: 'warning'
                });
                if (confirmed) {
                    const userToJoin = {
                        ...this.state.currentUser,
                        uid: this.state.currentUser.uid || this.state.currentUser.id
                    };
                    const res = await window.AmericanaService.addToWaitlist(id, userToJoin, type);
                    if (res.success) {
                        this.onDataUpdate();
                    }
                    window.PremiumModal.alert({
                        title: res.success ? "✅ REGISTRADO" : "❌ ERROR",
                        message: res.success ? "Estás en lista de espera. ¡Suerte!" : "Error: " + res.error,
                        type: res.success ? 'success' : 'error'
                    });
                }
            } catch (err) {
                window.PremiumModal.alert({ title: "❌ ERROR", message: err.message, type: 'error' });
            }
        }

        async confirmWaitlist(id, type = 'americana') {
            try {
                if (!this.state.currentUser) return;
                const confirmed = await window.PremiumModal.confirm({
                    title: "✨ CONFIRMAR PLAZA",
                    message: "¡Ha quedado una plaza libre para ti! ¿Confirmas tu asistencia ahora?",
                    confirmText: "SÍ, CONFIRMAR YA",
                    type: 'success'
                });
                if (confirmed) {
                    const userUid = this.state.currentUser.uid || this.state.currentUser.id;
                    const res = await window.AmericanaService.confirmWaitlist(id, userUid, type);
                    
                    if (res.success) {
                        this.onDataUpdate();
                        if (window.confetti) {
                            window.confetti({
                                particleCount: 150,
                                spread: 100,
                                origin: { y: 0.6 },
                                colors: ['#CCFF00', '#38bdf8', '#ffffff']
                            });
                        }
                    }

                    window.PremiumModal.alert({
                        title: res.success ? "🎾 ¡DENTRO!" : "❌ ERROR",
                        message: res.success ? "¡Bienvenido al evento!" : "Error: " + res.error,
                        type: res.success ? 'success' : 'error'
                    });
                }
            } catch (err) {
                window.PremiumModal.alert({ title: "❌ ERROR", message: err.message, type: 'error' });
            }
        }

        async leaveWaitlist(id, type = 'americana') {
            try {
                if (!this.state.currentUser) return;
                const confirmed = await window.PremiumModal.confirm({
                    title: "⏳ SALIR DE ESPERA",
                    message: "¿Seguro que quieres salir de la lista de espera?",
                    type: 'warning'
                });
                if (!confirmed) return;

                const userUid = this.state.currentUser.uid || this.state.currentUser.id;
                const res = await window.AmericanaService.leaveWaitlist(id, userUid, type);
                if (res.success) {
                    this.onDataUpdate();
                }
                window.PremiumModal.alert({
                    title: "ℹ️ INFO",
                    message: res.success ? "Has salido de la lista de espera." : "Error: " + res.error
                });
            } catch (err) {
                console.error("Error leaving waitlist:", err);
            }
        }

        async showInscritosModal(id, type, silent = false) {
            this._currentInscritosEventId = id;
            this._currentInscritosType = type;

            const localEvents = type === 'entreno' ? this.state.entrenos : this.state.americanas;
            let evt = localEvents.find(e => e.id === id);
            if (!evt) return;

            if (!this.isAmericanaUnlocked(evt)) {
                this.promptPrivatePassword(id, type, 'inscritos');
                return;
            }

            let modal = document.getElementById('inscritos-modal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'inscritos-modal';
                document.body.appendChild(modal);
            }
            modal.style.cssText = `position: fixed; inset: 0; background: #f8fafc; z-index: 30000; overflow-y: auto; -webkit-overflow-scrolling: touch; overscroll-behavior: contain; font-family: 'Outfit', sans-serif; color: #0f172a; display: flex; flex-direction: column;`;
            if (!silent) {
                modal.innerHTML = `
<div style="padding: 100px; text-align: center; color: #0f172a;"><div class="loader"></div><p style="margin-top:20px; font-weight:900; letter-spacing:2px; color: #0f172a;">CARGANDO JUGADORES...</p></div>
                `;
            }
            modal.style.display = 'block';

            // ✅ FIX V2: LECTURA DIRECTA desde Firestore (evita datos stale del snapshot local)
            try {
                const collectionName = type === 'entreno' ? 'entrenos' : 'americanas';
                const freshDoc = await window.db.collection(collectionName).doc(id).get();
                if (freshDoc.exists) {
                    const freshData = { id: freshDoc.id, ...freshDoc.data() };
                    console.log(`✅ [Inscritos] Lectura fresca OK: players=${(freshData.players || []).length}, registeredPlayers=${(freshData.registeredPlayers || []).length}`);
                    evt = freshData;
                } else {
                    console.warn(`⚠️ [Inscritos] Doc ${id} no existe en ${collectionName}. Usando snapshot local.`);
                }
            } catch (freshErr) {
                console.warn(`⚠️ [Inscritos] Error lectura fresca, usando snapshot local:`, freshErr);
            }

            // ✅ FIX V2: Robust player list — prioriza players, luego registeredPlayers
            const rawList = (evt.players && evt.players.length > 0)
                ? evt.players
                : (evt.registeredPlayers && evt.registeredPlayers.length > 0)
                    ? evt.registeredPlayers
                    : [];
            
            console.log(`📋 [Inscritos] rawList tiene ${rawList.length} entradas para evento: ${evt.name || id}`);

            // DEDUPLICATE UNIQUE IDS
            const seenIds = new Set();
            const uniqueRawList = rawList.filter(p => {
                const uid = (typeof p === 'string') ? p : (p.uid || p.id);
                if (!uid || seenIds.has(uid)) return false;
                seenIds.add(uid);
                return true;
            });

            // Evitar re-render y saltos de scroll si los datos de inscritos no han cambiado
            const currentSig = `${id}_${uniqueRawList.length}_` + uniqueRawList.map(p => (typeof p === 'string' ? p : `${p.uid || p.id}_${p.partner_id || ''}_${p.level || ''}`)).join('|');
            if (silent && this._lastInscritosSignature === currentSig) {
                return;
            }
            this._lastInscritosSignature = currentSig;

            const savedScrollTop = (modal && modal.scrollTop) ? modal.scrollTop : 0;
            const prevTab = window._currentBattleTab || 'roster';
            const prevFilter = window._battleFilter || 'all';
            const prevSearch = window._battleSearchQuery || '';

            if (!silent) {
                modal.innerHTML = `
<div style="padding: 100px; text-align: center; color: #0f172a;"><div class="loader"></div><p style="margin-top:20px; font-weight:900; letter-spacing:2px; color: #0f172a;">CARGANDO BASE DE DATOS...</p></div>
                `;
            }

            const dbPlayers = [];
            try {
                // ✅ FIX V2: Referencia ultra-segura a FieldPath con triple fallback
                let FieldPath = null;
                if (window.FirebaseFirestore && window.FirebaseFirestore.FieldPath) {
                    FieldPath = window.FirebaseFirestore.FieldPath;
                } else if (window.firebase && window.firebase.firestore && window.firebase.firestore.FieldPath) {
                    FieldPath = window.firebase.firestore.FieldPath;
                } else if (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldPath) {
                    FieldPath = firebase.firestore.FieldPath;
                }
                console.log(`🔑 [Inscritos] FieldPath disponible: ${!!FieldPath}`);

                // Extraer IDs para la consulta batch
                const uids = uniqueRawList
                    .map(p => (typeof p === 'string') ? p : (p.uid || p.id))
                    .filter(id => id && typeof id === 'string' && id.length > 0); 

                if (uids.length > 0 && FieldPath && window.db) {
                    const chunks = [];
                    for (let i = 0; i < uids.length; i += 30) {
                        chunks.push(uids.slice(i, i + 30));
                    }

                    for (const chunk of chunks) {
                        if (chunk.length === 0) continue;
                        try {
                            const snap = await window.db.collection('players').where(FieldPath.documentId(), 'in', chunk).get();
                            snap.forEach(doc => {
                                dbPlayers.push({ id: doc.id, ...doc.data() });
                            });
                        } catch (chunkErr) { console.error("Error fetching chunk:", chunkErr); }
                    }
                } else if (uids.length > 0 && !FieldPath && window.db) {
                    // ✅ FALLBACK EXTREMO: Si FieldPath no existe, buscar uno a uno por doc ID
                    console.warn(`⚠️ [Inscritos] FieldPath no disponible, buscando jugadores uno a uno...`);
                    for (const uid of uids) {
                        try {
                            const doc = await window.db.collection('players').doc(uid).get();
                            if (doc.exists) {
                                dbPlayers.push({ id: doc.id, ...doc.data() });
                            }
                        } catch (e) { /* skip */ }
                    }
                }

                // ✅ FALLBACK: Si un jugador no está en dbPlayers, lo añadimos usando los datos del evento
                const foundIds = new Set(dbPlayers.map(p => p.id));
                uniqueRawList.forEach(raw => {
                    const rid = (typeof raw === 'string') ? raw : (raw.uid || raw.id);
                    if (rid && !foundIds.has(rid)) {
                        if (typeof raw === 'object') {
                            dbPlayers.push({
                                id: rid, uid: rid,
                                name: raw.name || 'Jugador',
                                level: raw.level || '3.5',
                                joinedAt: raw.joinedAt || null,
                                partner_name: raw.partner_name || null,
                                partner_id: raw.partner_id || null,
                                team_somospadel: raw.team_somospadel || []
                            });
                        } else {
                            dbPlayers.push({ id: rid, uid: rid, name: 'Jugador', level: '3.5', joinedAt: null });
                        }
                    }
                });

                // Sincronizar metadatos (unimos lo que venga de la BD con lo que venía en el evento)
                dbPlayers.forEach(p => {
                    const meta = uniqueRawList.find(r => ((typeof r === 'string') ? r : (r.uid || r.id)) === p.id);
                    if (meta && typeof meta === 'object') {
                        p.joinedAt = p.joinedAt || meta.joinedAt || null;
                        p.partner_name = p.partner_name || meta.partner_name || null;
                        p.partner_id = p.partner_id || meta.partner_id || null;
                        if (!p.name || p.name === 'Jugador') p.name = meta.name || p.name;
                    }
                });

                // Ordenar por hora de inscripción
                dbPlayers.sort((a, b) => {
                    const timeA = a.joinedAt ? new Date(a.joinedAt).getTime() : 0;
                    const timeB = b.joinedAt ? new Date(b.joinedAt).getTime() : 0;
                    return timeA - timeB;
                });

                console.log(`✅ [Inscritos] ${dbPlayers.length} jugadores procesados para el modal.`);
            } catch (e) { console.error("Error fetching players in batch:", e); }

            // --- REDESIGN: NEON BROADCAST WITH PAIR GROUPING ---
            const eventLocation = evt.sede || evt.location || evt.club || evt.venue || 'Barcelona Pádel el Prat';
            const isEntrenoModal = (evt.type === 'entreno' || type === 'entreno');
            const eventTitle = (evt.name || (isEntrenoModal ? 'Entreno Masculino' : 'Torneo Americano')).toUpperCase();
            const eventPriceText = isEntrenoModal 
                ? `${evt.price || evt.price_socio || evt.price_members || 6.5}€`
                : `${evt.price_members || 18}€ / ${evt.price_external || 22}€`;

            const maxCourts = parseInt(evt.max_courts || evt.courts || 4);
            const maxPlayers = maxCourts * 4;

            const processedIds = new Set();
            const finalGroups = [];

            // Robust bidirectional matching
            const findPartner = (player, currentIdx) => {
                const myId = (player.id || player.uid);
                const myPartnerId = String(player.partner_id || '');
                const myPartnerName = (player.partner_name || '').trim().toUpperCase();

                return dbPlayers.find((other, otherIdx) => {
                    const otherId = (other.id || other.uid);
                    if (otherIdx === currentIdx || processedIds.has(otherId)) return false;

                    const otherPartnerId = String(other.partner_id || '');
                    const otherPartnerName = (other.partner_name || '').trim().toUpperCase();
                    const otherName = (other.name || '').trim().toUpperCase();
                    const myName = (player.name || '').trim().toUpperCase();

                    // Option A: Direct ID Link (either way)
                    if (myPartnerId && myPartnerId === otherId) return true;
                    if (otherPartnerId && otherPartnerId === myId) return true;

                    // Option B: Name Match Fallback
                    if (myPartnerName && myPartnerName === otherName) return true;
                    if (otherPartnerName && otherPartnerName === myName) return true;

                    return false;
                });
            };

            dbPlayers.forEach((p, idx) => {
                const pid = (p.id || p.uid);
                if (processedIds.has(pid)) return;

                const partner = findPartner(p, idx);

                if (partner) {
                    finalGroups.push({ type: 'pair', p1: p, p2: partner });
                    processedIds.add(pid);
                    processedIds.add(partner.id || partner.uid);
                } else {
                    finalGroups.push({ type: 'single', p1: p });
                    processedIds.add(pid);
                }
            });

            const totalPlayers = uniqueRawList.length;
            const avgLevel = totalPlayers > 0 ? (dbPlayers.reduce((acc, p) => acc + parseFloat(p.level || 3.5), 0) / totalPlayers).toFixed(2) : '3.50';
            const slotsLeft = Math.max(0, maxPlayers - totalPlayers);
            const fillPercent = maxPlayers > 0 ? Math.min(100, Math.round((totalPlayers / maxPlayers) * 100)) : 0;
            const pairsCount = finalGroups.filter(g => g.type === 'pair').length;
            const solosCount = finalGroups.filter(g => g.type !== 'pair').length;
            const levelsArr = dbPlayers.map(p => parseFloat(p.level || 3.5));
            const balanceScore = totalPlayers > 1 
                ? Math.min(99, Math.max(82, Math.round(100 - (Math.abs(Math.max(...levelsArr) - Math.min(...levelsArr)) * 4.5)))) 
                : 95;

            // Stats breakdown (Drive vs Revés counts & Level Range)
            let drivesCount = 0;
            let revesCount = 0;
            dbPlayers.forEach(p => {
                const pos = (p.position || '').toLowerCase();
                const lvl = parseFloat(p.level || 3.5);
                if (pos.includes('rev') || (!pos.includes('dri') && lvl > 3.6)) {
                    revesCount++;
                } else {
                    drivesCount++;
                }
            });
            const minLvl = levelsArr.length ? Math.min(...levelsArr).toFixed(1) : '3.0';
            const maxLvl = levelsArr.length ? Math.max(...levelsArr).toFixed(1) : '4.5';
            const levelRange = levelsArr.length ? `${minLvl} - ${maxLvl}` : '3.0 - 4.5';

            // --- CLEANUP & AUDIO CUE ---
            if (window._battleReadyTimer) {
                clearInterval(window._battleReadyTimer);
                window._battleReadyTimer = null;
            }

            // Web Audio API Synthesizer Helper
            window.playBattleAudio = function(type) {
                try {
                    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                    if (!AudioContextClass) return;
                    if (!window._battleAudioCtx) {
                        window._battleAudioCtx = new AudioContextClass();
                    }
                    const ctx = window._battleAudioCtx;
                    if (ctx.state === 'suspended') {
                        ctx.resume().catch(() => {});
                    }

                    if (type === 'tick') {
                        const osc = ctx.createOscillator();
                        const gain = ctx.createGain();
                        osc.type = 'triangle';
                        osc.frequency.setValueAtTime(640, ctx.currentTime);
                        osc.frequency.exponentialRampToValueAtTime(860, ctx.currentTime + 0.04);
                        gain.gain.setValueAtTime(0.06, ctx.currentTime);
                        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
                        osc.connect(gain);
                        gain.connect(ctx.destination);
                        osc.start();
                        osc.stop(ctx.currentTime + 0.05);
                    } else if (type === 'radio-jingle' || type === 'jingle' || type === 'stadium-chime') {
                        // Megafonía oficial de estadio de fútbol / pista (Sol4, Mi4, Do5 clásico)
                        const chimeNotes = [
                            { freq: 392.00, start: 0.00, duration: 0.18, gainVal: 0.14 },
                            { freq: 329.63, start: 0.16, duration: 0.18, gainVal: 0.14 },
                            { freq: 523.25, start: 0.32, duration: 0.38, gainVal: 0.16 }
                        ];
                        chimeNotes.forEach(tone => {
                            const osc = ctx.createOscillator();
                            const gain = ctx.createGain();
                            const startTime = ctx.currentTime + tone.start;
                            osc.type = 'sine';
                            osc.frequency.setValueAtTime(tone.freq, startTime);
                            gain.gain.setValueAtTime(tone.gainVal, startTime);
                            gain.gain.exponentialRampToValueAtTime(0.0001, startTime + tone.duration);
                            osc.connect(gain);
                            gain.connect(ctx.destination);
                            osc.start(startTime);
                            osc.stop(startTime + tone.duration);
                        });
                    } else if (type === 'fanfare') {
                        const freqs = [523.25, 659.25, 783.99, 1046.50]; // Do, Mi, Sol, Do alto
                        freqs.forEach((freq, idx) => {
                            const osc = ctx.createOscillator();
                            const gain = ctx.createGain();
                            const startTime = ctx.currentTime + (idx * 0.08);
                            osc.type = 'triangle';
                            osc.frequency.setValueAtTime(freq, startTime);
                            gain.gain.setValueAtTime(0.08, startTime);
                            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.38);
                            osc.connect(gain);
                            gain.connect(ctx.destination);
                            osc.start(startTime);
                            osc.stop(startTime + 0.38);
                        });
                    } else if (type === 'duel') {
                        const osc = ctx.createOscillator();
                        const gain = ctx.createGain();
                        osc.type = 'sawtooth';
                        osc.frequency.setValueAtTime(320, ctx.currentTime);
                        osc.frequency.exponentialRampToValueAtTime(750, ctx.currentTime + 0.16);
                        gain.gain.setValueAtTime(0.06, ctx.currentTime);
                        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
                        osc.connect(gain);
                        gain.connect(ctx.destination);
                        osc.start();
                        osc.stop(ctx.currentTime + 0.22);
                    }
                } catch(e) {}
            };

            // Global Safe Close Action
            window.closeBattleReadyModal = function() {
                if (window._battleReadyTimer) {
                    clearInterval(window._battleReadyTimer);
                    window._battleReadyTimer = null;
                }
                if (window._battleRouletteTimer) {
                    clearTimeout(window._battleRouletteTimer);
                }
                window._battleRouletteTimer = null;
                if (window._battleVoiceTimeout) {
                    clearTimeout(window._battleVoiceTimeout);
                    window._battleVoiceTimeout = null;
                }
                if (window._activeSpeakerAudio) {
                    try {
                        window._activeSpeakerAudio.pause();
                        window._activeSpeakerAudio.currentTime = 0;
                    } catch(e) {}
                    window._activeSpeakerAudio = null;
                }
                if (window.speechSynthesis) {
                    try { window.speechSynthesis.cancel(); } catch(e) {}
                }
                window._isBattleBroadcasting = false;

                const btn = document.getElementById('battle-voice-btn');
                const txt = document.getElementById('battle-voice-text');
                const eq = document.getElementById('battle-voice-eq');
                const icon = document.getElementById('battle-voice-icon');
                if (txt) txt.textContent = '📢 SPEAKER DE PISTA';
                if (eq) eq.style.display = 'none';
                if (icon) icon.style.display = 'inline-block';
                if (btn) {
                    btn.style.borderColor = '#0f172a';
                    btn.style.color = '#0f172a';
                    btn.style.background = '#ffffff';
                    btn.style.boxShadow = '0 2px 6px rgba(0,0,0,0.04)';
                }

                const confettiBox = document.getElementById('battle-roulette-confetti');
                if (confettiBox) confettiBox.innerHTML = '';

                const modalEl = document.getElementById('inscritos-modal');
                if (modalEl) modalEl.style.display = 'none';
                if (window.EventsController) {
                    window.EventsController._currentInscritosEventId = null;
                    window.EventsController._lastInscritosSignature = null;
                }
                if (document.fullscreenElement) {
                    document.exitFullscreen?.().catch(() => {});
                }
            };

            // Sound cue on modal load
            window.playBattleAudio('tick');

            // 📢 1. SPEAKER OFICIAL DE ESTADIO (AUDIO NEURAL REAL + ESTUDIO)
            window._isBattleBroadcasting = false;
            window._activeSpeakerAudio = null;

            window.toggleBattleVoiceBroadcast = function() {
                const btn = document.getElementById('battle-voice-btn');
                const txt = document.getElementById('battle-voice-text');
                const eq = document.getElementById('battle-voice-eq');
                const icon = document.getElementById('battle-voice-icon');

                const resetVoiceUI = () => {
                    window._isBattleBroadcasting = false;
                    if (window._battleVoiceTimeout) {
                        clearTimeout(window._battleVoiceTimeout);
                        window._battleVoiceTimeout = null;
                    }
                    if (window._activeSpeakerAudio) {
                        try {
                            window._activeSpeakerAudio.pause();
                            window._activeSpeakerAudio.currentTime = 0;
                        } catch(e) {}
                        window._activeSpeakerAudio = null;
                    }
                    if (window.speechSynthesis) {
                        try { window.speechSynthesis.cancel(); } catch(e) {}
                    }
                    if (txt) txt.textContent = '📢 SPEAKER DE PISTA';
                    if (eq) eq.style.display = 'none';
                    if (icon) icon.style.display = 'inline-block';
                    if (btn) {
                        btn.style.background = '#0f172a';
                        btn.style.color = '#ffffff';
                        btn.style.borderColor = '#0f172a';
                    }
                };

                // Si ya está sonando, pausar y restaurar
                if (window._isBattleBroadcasting || (window._activeSpeakerAudio && !window._activeSpeakerAudio.paused) || (window.speechSynthesis && window.speechSynthesis.speaking)) {
                    resetVoiceUI();
                    return;
                }

                // Determinar el archivo de locución de alta fidelidad humana según evento y sede
                const isPratVenue = (eventLocation || '').toLowerCase().includes('prat');
                let audioFile = '';
                if (isEntrenoModal) {
                    audioFile = isPratVenue ? './audio/speaker/entreno_bcn_prat.mp3' : './audio/speaker/entreno_general.mp3';
                } else {
                    audioFile = './audio/speaker/torneo_intro.mp3';
                }

                // Feedback visual instantáneo
                window._isBattleBroadcasting = true;
                if (txt) txt.textContent = '🔊 CONECTANDO...';
                if (eq) eq.style.display = 'inline-flex';
                if (icon) icon.style.display = 'none';

                // Tocar jingle/chime de megafonía de estadio
                window.playBattleAudio('stadium-chime');

                window._battleVoiceTimeout = setTimeout(() => {
                    try {
                        const audio = new Audio(audioFile);
                        window._activeSpeakerAudio = audio;

                        audio.onplay = () => {
                            window._isBattleBroadcasting = true;
                            if (txt) txt.textContent = '🔊 EMITIENDO...';
                            if (eq) eq.style.display = 'inline-flex';
                            if (icon) icon.style.display = 'none';
                            if (btn) {
                                btn.style.background = '#dc2626';
                                btn.style.borderColor = '#dc2626';
                                btn.style.color = '#ffffff';
                            }
                        };

                        audio.onended = () => {
                            resetVoiceUI();
                        };

                        audio.onerror = (err) => {
                            console.warn('Audio MP3 de speaker no disponible, recurriendo a voz de respaldo:', err);
                            fallbackSpeechSynth();
                        };

                        const playPromise = audio.play();
                        if (playPromise !== undefined) {
                            playPromise.catch((e) => {
                                console.warn('Error iniciando audio:', e);
                                fallbackSpeechSynth();
                            });
                        }
                    } catch(err) {
                        fallbackSpeechSynth();
                    }
                }, 480);

                function fallbackSpeechSynth() {
                    if (!window.speechSynthesis || !('speechSynthesis' in window)) {
                        resetVoiceUI();
                        return;
                    }
                    const currentHour = new Date().getHours();
                    const saludo = currentHour < 14 ? '¡Muy buenos días a todos!' : (currentHour < 20 ? '¡Muy buenas tardes a todos!' : '¡Muy buenas noches a todos!');
                    const speechText = `${saludo} ¡Atención a todas las pistas! ¡Todo listo para el ${evt.name || (isEntrenoModal ? 'Entreno Oficial' : 'Torneo Americano')}! Nos encontramos en directo en ${eventLocation}. ¡A calentar bien y que comience el mejor pádel!`;

                    const utterance = new SpeechSynthesisUtterance(speechText);
                    utterance.lang = 'es-ES';
                    const voices = window.speechSynthesis.getVoices() || [];
                    const esVoices = voices.filter(v => v.lang && v.lang.toLowerCase().startsWith('es'));
                    const maleKeywords = ['alvaro', 'álvaro', 'jorge', 'pablo', 'manuel', 'enrique', 'diego', 'carlos', 'david', 'male'];
                    let voice = esVoices.find(v => {
                        const n = (v.name || '').toLowerCase();
                        return maleKeywords.some(k => n.includes(k));
                    }) || esVoices[0];
                    if (voice) utterance.voice = voice;
                    utterance.pitch = 0.95;
                    utterance.rate = 1.04;

                    utterance.onstart = () => {
                        window._isBattleBroadcasting = true;
                        if (txt) txt.textContent = '🔊 EMITIENDO...';
                        if (eq) eq.style.display = 'inline-flex';
                        if (icon) icon.style.display = 'none';
                        if (btn) {
                            btn.style.background = '#dc2626';
                            btn.style.borderColor = '#dc2626';
                            btn.style.color = '#ffffff';
                        }
                    };
                    utterance.onend = utterance.onerror = () => {
                        resetVoiceUI();
                    };

                    try {
                        window.speechSynthesis.cancel();
                        window.speechSynthesis.speak(utterance);
                    } catch(e) {
                        resetVoiceUI();
                    }
                }
            };
            window.toggleVoiceBroadcast = window.toggleBattleVoiceBroadcast;

            // Global Share Convocatoria Action
            const eventFormattedTime = this.formatEventTime(evt);
            window.shareConvocatoriaBattleReady = function() {
                const eventTitle = (evt.name || 'Torneo').toUpperCase();
                const timeText = eventFormattedTime;
                const playersList = dbPlayers.map((p, i) => `${i + 1}. ${p.name} (LVL ${parseFloat(p.level || 3.5).toFixed(2)})`).join('\n');
                const shareText = `🎾 *SOMOSPADEL BCN • CONVOCATORIA OFICIAL* 🎾\n` +
                    `🏆 *${eventTitle}*\n` +
                    `🕒 Horario: ${timeText} | 📍 ${eventLocation}\n` +
                    `👥 Inscritos: ${totalPlayers}/${maxPlayers} ${slotsLeft > 0 ? `(¡Quedan ${slotsLeft} plazas!)` : '🔥 ¡COMPLETO!'}\n` +
                    `📊 Nivel Medio: ${avgLevel} LVL | ⚖️ Equilibrio: ${balanceScore}%\n\n` +
                    `*Jugadores Confirmados:*\n${playersList}\n\n` +
                    `${slotsLeft > 0 ? `👉 ¡Entra a la App y reserva tu plaza antes de que se agoten!` : `🔥 ¡Nos vemos en la pista!`}`;

                if (navigator.share) {
                    navigator.share({
                        title: `Convocatoria SomosPadel - ${eventTitle}`,
                        text: shareText
                    }).catch(() => {});
                } else if (navigator.clipboard) {
                    navigator.clipboard.writeText(shareText).then(() => {
                        alert('¡Convocatoria copiada al portapapeles para enviar por WhatsApp! 🚀');
                    });
                } else {
                    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
                }
            };

            // 🤝 Matchmaking Express: Proponer Pareja
            window.proposePairChallenge = function(targetPlayerName, targetPlayerLevel) {
                const safeName = targetPlayerName || 'Compañero';
                const lvl = targetPlayerLevel || '3.5';
                const eventName = (evt.name || (isEntrenoModal ? 'Entreno Oficial' : 'Torneo Americano')).toUpperCase();
                const text = `🎾 *¡HOLA ${safeName.toUpperCase()}!* 🎾\n\n` +
                    `Te he visto en la convocatoria de SomosPadel para el evento *${eventName}* (📍 ${eventLocation}).\n` +
                    `Veo que estás buscando pareja (Nivel ${lvl} LVL). ¿Te gustaría que juguemos juntos como pareja? 🔥\n\n` +
                    `¡Avísame y cerramos pareja oficial en la app! 🏆`;

                if (navigator.share) {
                    navigator.share({ title: 'Proponer Pareja SomosPadel', text }).catch(() => {});
                } else if (navigator.clipboard) {
                    navigator.clipboard.writeText(text).then(() => {
                        alert('¡Mensaje para proponer pareja copiado al portapapeles! Envíalo por WhatsApp 🚀');
                    });
                } else {
                    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                }
            };

            // 📸 2. GENERADOR OFICIAL DE CARTEL / STORY HD PARA REDES ("POSTER CREATOR")
            window.generateConvocatoriaStory = function() {
                const storyBtn = document.getElementById('battle-story-btn');
                const storyTxt = document.getElementById('battle-story-text');
                if (storyTxt) storyTxt.textContent = 'GENERANDO...';
                if (storyBtn) storyBtn.style.opacity = '0.7';

                window.playBattleAudio('tick');

                setTimeout(() => {
                    try {
                        const canvas = document.createElement('canvas');
                        canvas.width = 1080;
                        canvas.height = 1920;
                        const ctx = canvas.getContext('2d');

                        // Safe roundRect helper
                        const roundRect = (x, y, w, h, r) => {
                            ctx.beginPath();
                            ctx.moveTo(x + r, y);
                            ctx.lineTo(x + w - r, y);
                            ctx.quadraticCurveTo(x + w, y, x + w, y + r);
                            ctx.lineTo(x + w, y + h - r);
                            ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
                            ctx.lineTo(x + r, y + h);
                            ctx.quadraticCurveTo(x, y + h, x, y + h - r);
                            ctx.lineTo(x, y + r);
                            ctx.quadraticCurveTo(x, y, x + r, y);
                            ctx.closePath();
                        };

                        // 1. Sport Gradient Background
                        const bgGrad = ctx.createLinearGradient(0, 0, 0, 1920);
                        bgGrad.addColorStop(0, '#040914');
                        bgGrad.addColorStop(0.3, '#0b1d3a');
                        bgGrad.addColorStop(0.7, '#07152b');
                        bgGrad.addColorStop(1, '#020611');
                        ctx.fillStyle = bgGrad;
                        ctx.fillRect(0, 0, 1080, 1920);

                        // Ambient Glow Top (Cyan)
                        const topGlow = ctx.createRadialGradient(250, 200, 10, 250, 200, 600);
                        topGlow.addColorStop(0, 'rgba(56, 189, 248, 0.18)');
                        topGlow.addColorStop(1, 'rgba(56, 189, 248, 0)');
                        ctx.fillStyle = topGlow;
                        ctx.fillRect(0, 0, 1080, 700);

                        // Ambient Glow Bottom (Emerald)
                        const botGlow = ctx.createRadialGradient(850, 1700, 10, 850, 1700, 600);
                        botGlow.addColorStop(0, 'rgba(16, 185, 129, 0.16)');
                        botGlow.addColorStop(1, 'rgba(16, 185, 129, 0)');
                        ctx.fillStyle = botGlow;
                        ctx.fillRect(0, 1200, 1080, 720);

                        // Subtle Outer Court Border Watermark
                        ctx.save();
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
                        ctx.lineWidth = 4;
                        roundRect(50, 50, 980, 1820, 32);
                        ctx.stroke();
                        ctx.restore();

                        // 2. Header Top Badge
                        roundRect(310, 70, 460, 44, 22);
                        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
                        ctx.fill();
                        ctx.strokeStyle = '#38bdf8';
                        ctx.lineWidth = 2;
                        ctx.stroke();

                        ctx.fillStyle = '#38bdf8';
                        ctx.font = 'bold 18px Montserrat, sans-serif';
                        ctx.textAlign = 'center';
                        ctx.fillText('🎾 SOMOSPADEL BCN • CONVOCATORIA', 540, 98);

                        // 3. Event Title
                        ctx.fillStyle = '#ffffff';
                        ctx.font = '900 46px Montserrat, sans-serif';
                        ctx.textAlign = 'center';
                        const rawTitle = (evt.name || (isEntrenoModal ? 'ENTRENO OFICIAL' : 'TORNEO AMERICANO')).toUpperCase();
                        const displayTitle = rawTitle.length > 32 ? rawTitle.substring(0, 30) + '...' : rawTitle;
                        ctx.fillText(displayTitle, 540, 165);

                        // 4. Metadata Badges Row (Date, Club, Time, Price)
                        const metaY = 205;
                        const metaItems = [
                            { icon: '📅', text: evt.date || 'HOY' },
                            { icon: '🕒', text: eventFormattedTime || '16:30' },
                            { icon: '📍', text: eventLocation.length > 20 ? eventLocation.substring(0, 18) + '...' : eventLocation },
                            { icon: '💶', text: eventPriceText || '15€' }
                        ];
                        const metaWidth = 210;
                        const metaGap = 16;
                        const metaStartX = 540 - ((4 * metaWidth + 3 * metaGap) / 2);

                        metaItems.forEach((m, idx) => {
                            const mx = metaStartX + idx * (metaWidth + metaGap);
                            roundRect(mx, metaY, metaWidth, 42, 10);
                            ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
                            ctx.fill();
                            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
                            ctx.lineWidth = 1;
                            ctx.stroke();

                            ctx.fillStyle = '#e2e8f0';
                            ctx.font = 'bold 16px Outfit, Montserrat, sans-serif';
                            ctx.textAlign = 'center';
                            ctx.fillText(`${m.icon} ${m.text}`, mx + metaWidth / 2, metaY + 26);
                        });

                        // 5. KPI Stats Strip (4 cards)
                        const kpiY = 275;
                        const kpis = [
                            { label: 'NIVEL MEDIO', val: `${avgLevel} LVL`, color: '#10b981' },
                            { label: 'EQUILIBRIO', val: `${balanceScore}% EQ`, color: '#38bdf8' },
                            { label: 'INSCRITOS', val: `${totalPlayers}/${maxPlayers}`, color: '#f59e0b' },
                            { label: 'PLAZAS', val: slotsLeft > 0 ? `${slotsLeft} LIBRES` : 'COMPLETO', color: slotsLeft > 0 ? '#4ade80' : '#f87171' }
                        ];
                        const kpiWidth = 210;
                        const kpiGap = 16;
                        const kpiStartX = 540 - ((4 * kpiWidth + 3 * kpiGap) / 2);

                        kpis.forEach((k, idx) => {
                            const kx = kpiStartX + idx * (kpiWidth + kpiGap);
                            roundRect(kx, kpiY, kpiWidth, 70, 14);
                            ctx.fillStyle = '#0f223d';
                            ctx.fill();
                            ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
                            ctx.lineWidth = 1.5;
                            ctx.stroke();

                            ctx.fillStyle = '#94a3b8';
                            ctx.font = 'bold 13px Montserrat, sans-serif';
                            ctx.textAlign = 'center';
                            ctx.fillText(k.label, kx + kpiWidth / 2, kpiY + 24);

                            ctx.fillStyle = k.color;
                            ctx.font = '900 22px Montserrat, sans-serif';
                            ctx.fillText(k.val, kx + kpiWidth / 2, kpiY + 54);
                        });

                        // 6. Section Divider: JUGADORES CONFIRMADOS
                        ctx.fillStyle = '#38bdf8';
                        ctx.font = '900 24px Montserrat, sans-serif';
                        ctx.textAlign = 'left';
                        ctx.fillText(`⚔️ CUADRO DE JUGADORES (${totalPlayers}/${maxPlayers})`, 80, 385);

                        ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(80, 395);
                        ctx.lineTo(1000, 395);
                        ctx.stroke();

                        // 7. Grid of Player Cards (2 Columns, up to 16-24 slots)
                        const gridStartY = 415;
                        const colWidth = 445;
                        const cardHeight = 68;
                        const rowGap = 12;
                        const colGap = 30;
                        const maxSlotsToShow = Math.min(24, Math.max(16, maxPlayers));

                        for (let i = 0; i < maxSlotsToShow; i++) {
                            const col = i % 2;
                            const row = Math.floor(i / 2);
                            const cx = 80 + col * (colWidth + colGap);
                            const cy = gridStartY + row * (cardHeight + rowGap);

                            if (cy + cardHeight > 1700) break;

                            const player = dbPlayers[i];
                            if (player) {
                                // Confirmed Player Card
                                roundRect(cx, cy, colWidth, cardHeight, 14);
                                ctx.fillStyle = 'rgba(15, 34, 61, 0.9)';
                                ctx.fill();
                                ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
                                ctx.lineWidth = 1.5;
                                ctx.stroke();

                                // Number badge
                                roundRect(cx + 8, cy + 14, 38, 38, 10);
                                ctx.fillStyle = '#0f172a';
                                ctx.fill();
                                ctx.strokeStyle = '#38bdf8';
                                ctx.lineWidth = 1.5;
                                ctx.stroke();

                                ctx.fillStyle = '#38bdf8';
                                ctx.font = '900 16px Montserrat, sans-serif';
                                ctx.textAlign = 'center';
                                ctx.fillText(`${i + 1}`, cx + 27, cy + 39);

                                // Player Name
                                const pName = (player.name || 'Jugador').toUpperCase();
                                const shortName = pName.length > 17 ? pName.substring(0, 15) + '..' : pName;
                                ctx.fillStyle = '#ffffff';
                                ctx.font = 'bold 20px Montserrat, sans-serif';
                                ctx.textAlign = 'left';
                                ctx.fillText(shortName, cx + 58, cy + 34);

                                // Position
                                const pPos = (player.position || (parseFloat(player.level || 3.5) > 3.6 ? 'Revés' : 'Drive')).toUpperCase();
                                ctx.fillStyle = '#94a3b8';
                                ctx.font = 'bold 13px Outfit, sans-serif';
                                ctx.fillText(`${pPos.includes('REV') ? '⚡' : '🛡️'} ${pPos}`, cx + 58, cy + 54);

                                // Level Badge
                                const lvlVal = parseFloat(player.level || 3.5).toFixed(2);
                                roundRect(cx + colWidth - 95, cy + 16, 85, 34, 8);
                                ctx.fillStyle = '#064e3b';
                                ctx.fill();
                                ctx.strokeStyle = '#10b981';
                                ctx.lineWidth = 1.5;
                                ctx.stroke();

                                ctx.fillStyle = '#34d399';
                                ctx.font = '900 16px Montserrat, sans-serif';
                                ctx.textAlign = 'center';
                                ctx.fillText(`${lvlVal} LVL`, cx + colWidth - 52, cy + 39);
                            } else {
                                // Empty / Available Slot Card
                                roundRect(cx, cy, colWidth, cardHeight, 14);
                                ctx.fillStyle = 'rgba(16, 185, 129, 0.06)';
                                ctx.fill();
                                ctx.strokeStyle = 'rgba(52, 211, 153, 0.4)';
                                ctx.lineWidth = 1.5;
                                ctx.setLineDash([6, 4]);
                                ctx.stroke();
                                ctx.setLineDash([]);

                                roundRect(cx + 8, cy + 14, 38, 38, 10);
                                ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
                                ctx.fill();
                                ctx.fillStyle = '#34d399';
                                ctx.font = 'bold 22px Montserrat, sans-serif';
                                ctx.textAlign = 'center';
                                ctx.fillText('+', cx + 27, cy + 41);

                                ctx.fillStyle = '#a7f3d0';
                                ctx.font = 'bold 18px Montserrat, sans-serif';
                                ctx.textAlign = 'left';
                                ctx.fillText(`PLAZA LIBRE #${i + 1}`, cx + 58, cy + 34);

                                ctx.fillStyle = '#6ee7b7';
                                ctx.font = 'bold 13px Outfit, sans-serif';
                                ctx.fillText('¡TOCA PARA APUNTARTE!', cx + 58, cy + 54);
                            }
                        }

                        // 8. Footer Call To Action Banner
                        const footY = 1740;
                        roundRect(80, footY, 920, 80, 20);
                        const footGrad = ctx.createLinearGradient(80, footY, 1000, footY);
                        if (slotsLeft > 0) {
                            footGrad.addColorStop(0, '#059669');
                            footGrad.addColorStop(1, '#0284c7');
                        } else {
                            footGrad.addColorStop(0, '#0284c7');
                            footGrad.addColorStop(1, '#4f46e5');
                        }
                        ctx.fillStyle = footGrad;
                        ctx.fill();
                        ctx.strokeStyle = '#ffffff';
                        ctx.lineWidth = 2;
                        ctx.stroke();

                        ctx.fillStyle = '#ffffff';
                        ctx.font = '900 26px Montserrat, sans-serif';
                        ctx.textAlign = 'center';
                        if (slotsLeft > 0) {
                            ctx.fillText(`⚡ ¡QUEDAN ${slotsLeft} PLAZAS LIBRES! • APÚNTATE EN LA APP`, 540, footY + 49);
                        } else {
                            ctx.fillText(`🔥 ¡AFORO COMPLETO! • SOMOSPADEL BCN`, 540, footY + 49);
                        }

                        // Sub-footer text
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                        ctx.font = 'bold 15px Montserrat, sans-serif';
                        ctx.textAlign = 'center';
                        ctx.fillText('SOMOSPADEL BARCELONA • www.somospadelbarcelona.com', 540, 1855);

                        // Play fanfare cue
                        window.playBattleAudio('fanfare');

                        // Export to Image & Share / Download
                        canvas.toBlob(async (blob) => {
                            if (storyTxt) storyTxt.textContent = 'CARTEL STORY HD';
                            if (storyBtn) storyBtn.style.opacity = '1';

                            if (!blob) {
                                alert('Error generando imagen de cartel');
                                return;
                            }

                            const fileName = `Convocatoria-SomosPadel-${(evt.name || 'Torneo').replace(/[^a-zA-Z0-9]/g, '_')}.png`;
                            const file = new File([blob], fileName, { type: 'image/png' });

                            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                                try {
                                    await navigator.share({
                                        files: [file],
                                        title: `Convocatoria SomosPadel - ${evt.name || 'Pádel'}`,
                                        text: `🎾 Convocatoria oficial para ${evt.name || 'Torneo Americano'}. ¡Nos vemos en la pista!`
                                    });
                                    return;
                                } catch (shareErr) {
                                    if (shareErr.name === 'AbortError') return;
                                }
                            }

                            // Direct download fallback
                            const link = document.createElement('a');
                            link.href = URL.createObjectURL(blob);
                            link.download = fileName;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            setTimeout(() => URL.revokeObjectURL(link.href), 3000);
                        }, 'image/png');

                    } catch (err) {
                        console.error('Error al crear cartel Story HD:', err);
                        if (storyTxt) storyTxt.textContent = 'CARTEL STORY HD';
                        if (storyBtn) storyBtn.style.opacity = '1';
                        alert('No se pudo generar el cartel: ' + err.message);
                    }
                }, 100);
            };

            // 🏟️ 3. SELECTOR DE VISTA TÁCTICA: MODO TARJETAS vs MODO PISTAS
            window._battleDisplayMode = 'cards';
            window.setBattleDisplayMode = function(mode) {
                window._battleDisplayMode = mode || 'cards';
                const cardsEl = document.getElementById('battle-cards-container');
                const courtsEl = document.getElementById('battle-courts-container');
                const btnCards = document.getElementById('battle-mode-cards-btn');
                const btnCourts = document.getElementById('battle-mode-courts-btn');

                if (mode === 'courts') {
                    if (cardsEl) cardsEl.style.display = 'none';
                    if (courtsEl) courtsEl.style.display = 'block';
                    if (btnCards) {
                        btnCards.style.background = 'transparent';
                        btnCards.style.color = '#64748b';
                        btnCards.style.boxShadow = 'none';
                    }
                    if (btnCourts) {
                        btnCourts.style.background = '#0f172a';
                        btnCourts.style.color = '#ffffff';
                        btnCourts.style.boxShadow = '0 2px 6px rgba(0,0,0,0.12)';
                    }
                } else {
                    if (cardsEl) cardsEl.style.display = 'grid';
                    if (courtsEl) courtsEl.style.display = 'none';
                    if (btnCards) {
                        btnCards.style.background = '#0f172a';
                        btnCards.style.color = '#ffffff';
                        btnCards.style.boxShadow = '0 2px 6px rgba(0,0,0,0.12)';
                    }
                    if (btnCourts) {
                        btnCourts.style.background = 'transparent';
                        btnCourts.style.color = '#64748b';
                        btnCourts.style.boxShadow = 'none';
                    }
                }
                window.playBattleAudio('tick');
            };

            // Global Toggle Fullscreen TV Mode
            window.toggleBattleReadyFullscreen = function() {
                const modalEl = document.getElementById('inscritos-modal');
                if (!modalEl) return;
                if (!document.fullscreenElement) {
                    modalEl.requestFullscreen?.().catch(() => {});
                } else {
                    document.exitFullscreen?.().catch(() => {});
                }
            };

            // Active State Filters & Search
            window._battleFilter = 'all';
            window._battleSearchQuery = '';

            window.applyBattleReadyVisibility = function() {
                const allCards = document.querySelectorAll('.battle-ready-item');
                const allCourts = document.querySelectorAll('.battle-court-card');
                const filter = window._battleFilter || 'all';
                const query = (window._battleSearchQuery || '').trim().toLowerCase();

                allCards.forEach(card => {
                    const cardType = card.getAttribute('data-filter-type');
                    const cardNames = (card.getAttribute('data-player-names') || '').toLowerCase();
                    const cardLevels = (card.getAttribute('data-player-levels') || '').toLowerCase();

                    const matchesType = (filter === 'all' || cardType === filter);
                    const matchesQuery = (!query || cardNames.includes(query) || cardLevels.includes(query) || (cardType === 'vacant' && query.includes('libre')));

                    if (matchesType && matchesQuery) {
                        card.style.display = 'block';
                    } else {
                        card.style.display = 'none';
                    }
                });

                allCourts.forEach(court => {
                    const courtNames = (court.getAttribute('data-player-names') || '').toLowerCase();
                    const matchesQuery = (!query || courtNames.includes(query));
                    if (matchesQuery) {
                        court.style.display = 'block';
                    } else {
                        court.style.display = 'none';
                    }
                });
            };

            window.filterBattleReady = function(type) {
                window._battleFilter = type;
                const pills = document.querySelectorAll('.battle-filter-pill');
                pills.forEach(p => p.classList.remove('active'));
                const activePill = document.getElementById(`battle-pill-${type}`);
                if (activePill) activePill.classList.add('active');
                window.applyBattleReadyVisibility();
            };

            window.searchBattleReady = function(query) {
                window._battleSearchQuery = query;
                window.applyBattleReadyVisibility();
            };

            // 🎯 Battle Ready Tab Switcher (Safe handler / Direct Roster)
            window.switchBattleReadyTab = function(tab) {
                window._currentBattleTab = tab || 'roster';
                const viewEl = document.getElementById('battle-view-roster');
                if (viewEl) viewEl.style.display = 'block';
            };

            // Live Countdown Calculation
            const parseTargetTime = () => {
                try {
                    const now = new Date();
                    let dateStr = evt.date;
                    if (!dateStr) {
                        dateStr = now.toISOString().split('T')[0];
                    }
                    const timeStr = (evt.time || '18:00').trim();
                    const match = timeStr.match(/(\d{1,2})[:.](\d{2})/);
                    let h = 18, m = 0;
                    if (match) {
                        h = parseInt(match[1], 10);
                        m = parseInt(match[2], 10);
                    }
                    const target = new Date(dateStr);
                    target.setHours(h, m, 0, 0);
                    return target;
                } catch (e) {
                    return null;
                }
            };

            window.updateBattleCountdown = function() {
                const badgeEl = document.getElementById('battle-countdown-badge');
                if (!badgeEl) return;
                const target = parseTargetTime();
                if (!target || isNaN(target.getTime())) {
                    badgeEl.innerHTML = `<i class="far fa-clock" style="color:#0284c7;"></i> HOY ${evt.time || ''}`;
                    return;
                }
                const diff = target.getTime() - Date.now();
                if (diff <= 0) {
                    badgeEl.innerHTML = `<span style="color:#16a34a; font-weight:1000;"><i class="fas fa-play"></i> ¡A PISTA! EN CURSO</span>`;
                } else {
                    const totalSecs = Math.floor(diff / 1000);
                    const hrs = Math.floor(totalSecs / 3600);
                    const mins = Math.floor((totalSecs % 3600) / 60);
                    const secs = totalSecs % 60;
                    const pad = n => String(n).padStart(2, '0');
                    badgeEl.innerHTML = `<i class="far fa-clock" style="color:#0284c7;"></i> COMIENZA EN: <b style="color:#0f172a;">${pad(hrs)}:${pad(mins)}:${pad(secs)}</b>`;
                }
            };
            window._battleReadyTimer = setInterval(window.updateBattleCountdown, 1000);

            const renderNeonPlayer = (player, badgeText, badgeColor = '#0284c7') => {
                if (!player) return '';
                const photo = player.photo_url || player.photoURL || 'img/logo_somospadel.png';
                const level = parseFloat(player.level || 3.5).toFixed(2);
                const teams = Array.isArray(player.team_somospadel) ? player.team_somospadel : (player.team_somospadel ? [player.team_somospadel] : []);
                const position = player.position || (level > 3.6 ? 'Revés' : 'Drive');
                const posIcon = position.toLowerCase().includes('rev') ? '⚡ Revés' : '🛡️ Drive';
                const streak = player.streak || (parseFloat(level) > 3.5 ? 3 : 1);
                const rawName = (player.name || 'Jugador').trim();
                const displayName = rawName.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                const safeNameAttr = rawName.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');

                return `
                    <div style="display: flex; align-items: center; gap: 10px; padding: 10px 12px; position: relative;">
                        <div style="position: relative; flex-shrink: 0;">
                            <div style="width: 44px; height: 44px; border-radius: 12px; background: url('${photo}') center/cover; border: 2px solid ${badgeColor}; box-shadow: 0 2px 6px rgba(0,0,0,0.06);"></div>
                            <span style="position: absolute; bottom: -3px; right: -3px; background: #0f172a; color: #f59e0b; font-size: 0.52rem; font-weight: 950; padding: 1px 4px; border-radius: 4px; border: 1px solid #e2e8f0;">🔥${streak}W</span>
                        </div>
                        <div style="flex: 1; min-width: 0;">
                            <div style="font-weight: 950; font-size: 0.9rem; color: #0f172a; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: -0.2px;">${displayName}</div>
                            <div style="display: flex; align-items: center; gap: 5px; margin-top: 3px; flex-wrap: wrap;">
                                <span style="background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; font-weight: 950; font-size: 0.68rem; padding: 1px 6px; border-radius: 5px;">${level} <small style="font-weight: 800;">LVL</small></span>
                                <span style="background: #f1f5f9; color: #334155; font-size: 0.6rem; font-weight: 800; padding: 1px 6px; border-radius: 5px; border: 1px solid #e2e8f0;">${posIcon}</span>
                                ${teams.length > 0 ? `<span style="background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; font-size: 0.52rem; font-weight: 900; padding: 1px 5px; border-radius: 4px;">${teams[0].toUpperCase()}</span>` : ''}
                            </div>
                        </div>
                        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0;">
                            <div style="background: ${badgeColor}; color: #ffffff; font-size: 0.52rem; font-weight: 1000; padding: 2px 7px; border-radius: 5px; letter-spacing: 0.5px;">${badgeText}</div>
                            <button onclick="event.stopPropagation(); window.PadelFutCard && window.PadelFutCard.open({ user: { id: '${player.id || player.uid}', name: '${safeNameAttr}', level: '${player.level || 3.5}', photo_url: '${photo}' } })" 
                                    style="background: #fffbeb; border: 1px solid #fde68a; color: #b45309; font-size: 0.54rem; font-weight: 900; padding: 2px 6px; border-radius: 5px; cursor: pointer; display: flex; align-items: center; gap: 3px; transition: all 0.2s;"
                                    onmouseover="this.style.background='#fef3c7';" onmouseout="this.style.background='#fffbeb';">
                                🎴 CARTA
                            </button>
                        </div>
                    </div>
                `;
            };

            // 🧬 QUÍMICA DE PAREJA & TARJETAS DE ROSTER
            const cardsHtml = finalGroups.map((group, idx) => {
                if (group.type === 'pair') {
                    const p1Name = (group.p1 && group.p1.name) || 'Jugador 1';
                    const p2Name = (group.p2 && group.p2.name) || 'Jugador 2';
                    const pNames = `${p1Name} ${p2Name}`.replace(/"/g, '&quot;');
                    const pLevels = `${(group.p1 && group.p1.level) || '3.5'} ${(group.p2 && group.p2.level) || '3.5'}`;

                    const getPos = (p) => {
                        if (!p) return 'Drive';
                        if (typeof p.position === 'string' && p.position.trim()) return p.position.trim();
                        const lvlNum = parseFloat(String((p && p.level) || 3.5).replace(',', '.')) || 3.5;
                        return lvlNum > 3.6 ? 'Revés' : 'Drive';
                    };
                    const pos1 = getPos(group.p1).toLowerCase();
                    const pos2 = getPos(group.p2).toLowerCase();
                    const isRev1 = pos1.includes('rev');
                    const isRev2 = pos2.includes('rev');
                    const isDri1 = pos1.includes('dri');
                    const isDri2 = pos2.includes('dri');

                    let synergyScore = 88;
                    let synergyBadge = '⚡ QUÍMICA 88% • EQUILIBRADA';
                    let synergyColor = '#0284c7';
                    let synergyDesc = 'Buena complementación técnica';

                    if ((isRev1 && isDri2) || (isDri1 && isRev2)) {
                        synergyScore = 98;
                        synergyBadge = '⚡ QUÍMICA 98% • TÁCTICA PERFECTA';
                        synergyColor = '#16a34a';
                        synergyDesc = 'Combinación ideal Revés + Drive';
                    } else if (isDri1 && isDri2) {
                        synergyScore = 75;
                        synergyBadge = '⚠️ QUÍMICA 75% • DOBLE DRIVE';
                        synergyColor = '#ea580c';
                        synergyDesc = 'Doble especialista en derecha';
                    } else if (isRev1 && isRev2) {
                        synergyScore = 78;
                        synergyBadge = '⚠️ QUÍMICA 78% • DOBLE REVÉS';
                        synergyColor = '#e11d48';
                        synergyDesc = 'Gran pegada aérea';
                    }

                    return `
                    <div class="battle-ready-item neon-pair-card" data-filter-type="pair" data-player-names="${pNames}" data-player-levels="${pLevels}" style="
                        background: #ffffff;
                        border: 1.5px solid #38bdf8;
                        border-radius: 18px;
                        padding: 4px;
                        position: relative;
                        overflow: hidden;
                        box-shadow: 0 3px 14px rgba(56, 189, 248, 0.08);
                        margin-bottom: 12px;
                        transition: transform 0.2s, box-shadow 0.2s;
                    " onmouseover="this.style.boxShadow='0 6px 20px rgba(56, 189, 248, 0.18)'; this.style.transform='translateY(-2px)';" onmouseout="this.style.boxShadow='0 3px 14px rgba(56, 189, 248, 0.08)'; this.style.transform='none';">
                        <div style="position: absolute; top: 0; right: 0; background: #0284c7; color: #ffffff; font-size: 0.52rem; font-weight: 1000; padding: 2px 10px; border-bottom-left-radius: 10px; text-transform: uppercase; letter-spacing: 0.5px; z-index: 10;">👥 PAREJA CONFIRMADA</div>
                        ${renderNeonPlayer(group.p1, 'JUGADOR 1', '#0284c7')}
                        
                        <!-- SYNERGY SCORE STRIP -->
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; margin: 2px 10px; padding: 6px 10px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
                                <span style="font-size: 0.6rem; font-weight: 1000; color: ${synergyColor}; letter-spacing: 0.4px;">${synergyBadge}</span>
                                <span style="font-size: 0.55rem; color: #64748b; font-weight: 800;">${synergyDesc}</span>
                            </div>
                            <div style="width: 100%; height: 4px; background: #e2e8f0; border-radius: 99px; overflow: hidden;">
                                <div style="width: ${synergyScore}%; height: 100%; background: ${synergyColor}; border-radius: 99px;"></div>
                            </div>
                        </div>

                        ${renderNeonPlayer(group.p2, 'JUGADOR 2', '#0284c7')}
                    </div>
                    `;
                } else {
                    const p1Name = (group.p1 && group.p1.name) || 'Jugador';
                    const pNames = String(p1Name).replace(/"/g, '&quot;');
                    const pLevels = `${(group.p1 && group.p1.level) || '3.5'}`;
                    const partnerSearchName = group.p1 && group.p1.partner_name ? String(group.p1.partner_name).replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
                    const rawP1Name = (group.p1 && group.p1.name) || 'Jugador';
                    const safeP1NameAttr = rawP1Name.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
                    const p1Lvl = (group.p1 && group.p1.level) || '3.5';

                    return `
                    <div class="battle-ready-item neon-single-card" data-filter-type="solo" data-player-names="${pNames}" data-player-levels="${pLevels}" style="
                        background: #ffffff;
                        border: 1.5px solid #f59e0b;
                        border-radius: 18px;
                        padding: 4px;
                        position: relative;
                        overflow: hidden;
                        box-shadow: 0 3px 14px rgba(245, 158, 11, 0.08);
                        margin-bottom: 12px;
                        transition: transform 0.2s, box-shadow 0.2s;
                    " onmouseover="this.style.boxShadow='0 6px 20px rgba(245, 158, 11, 0.18)'; this.style.transform='translateY(-2px)';" onmouseout="this.style.boxShadow='0 3px 14px rgba(245, 158, 11, 0.08)'; this.style.transform='none';">
                        <div style="position: absolute; top: 0; right: 0; background: #fef3c7; color: #92400e; border-left: 1px solid #fde68a; border-bottom: 1px solid #fde68a; font-size: 0.52rem; font-weight: 1000; padding: 2px 10px; border-bottom-left-radius: 10px; letter-spacing: 0.5px;">🔍 BUSCA PAREJA</div>
                        ${renderNeonPlayer(group.p1, `#${idx + 1}`, '#ca8a04')}
                        
                        <!-- PARTNER PROPOSAL STRIP -->
                        <div style="padding: 6px 10px 8px; font-size: 0.65rem; color: #854d0e; font-weight: 800; display: flex; align-items: center; justify-content: space-between; border-top: 1px dashed #fef08a; background: #fefce8; border-bottom-left-radius: 14px; border-bottom-right-radius: 14px; gap: 6px; flex-wrap: wrap;">
                            <span style="display: flex; align-items: center; gap: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 170px;">
                                <i class="fas fa-search" style="color: #ca8a04;"></i> ${partnerSearchName ? `Busca a: <b style="color: #0f172a;">${partnerSearchName}</b>` : 'Busca compañero'}
                            </span>
                            <button onclick="event.stopPropagation(); window.proposePairChallenge('${safeP1NameAttr}', '${p1Lvl}')" 
                                    style="background: #16a34a; color:#ffffff; border: none; padding: 3px 8px; border-radius: 6px; cursor: pointer; font-size: 0.58rem; font-weight: 950; box-shadow: 0 2px 6px rgba(22,163,74,0.25); display: inline-flex; align-items: center; gap: 4px; transition: all 0.2s;"
                                    onmouseover="this.style.background='#15803d';" onmouseout="this.style.background='#16a34a';">
                                <i class="fab fa-whatsapp"></i> PROPONER PAREJA
                            </button>
                        </div>
                    </div>
                    `;
                }
            }).join('');

            // Vacant Slot Cards
            let vacantSlotsHtml = '';
            for (let i = 0; i < slotsLeft; i++) {
                const slotNum = totalPlayers + i + 1;
                vacantSlotsHtml += `
                    <div class="battle-ready-item vacant-slot-card" data-filter-type="vacant" data-player-names="libre disponible vacante" data-player-levels="" onclick="document.getElementById('inscritos-modal').style.display = 'none'; if(window.EventsController) window.EventsController.registerInEvent('${evt.id}');" style="
                        background: #f0fdf4;
                        border: 1.5px dashed #22c55e;
                        border-radius: 18px;
                        padding: 12px 14px;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 10px;
                        cursor: pointer;
                        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                        position: relative;
                        overflow: hidden;
                        margin-bottom: 12px;
                        box-shadow: 0 2px 8px rgba(34, 197, 94, 0.06);
                    " onmouseover="this.style.background='#dcfce7'; this.style.borderColor='#16a34a'; this.style.transform='translateY(-2px)';" onmouseout="this.style.background='#f0fdf4'; this.style.borderColor='#22c55e'; this.style.transform='none';">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="width: 40px; height: 40px; border-radius: 12px; background: #ffffff; border: 1.5px dashed #16a34a; display: flex; align-items: center; justify-content: center; color: #16a34a; font-size: 1.1rem; flex-shrink: 0;">
                                <i class="fas fa-plus"></i>
                            </div>
                            <div>
                                <div style="font-weight: 950; font-size: 0.88rem; color: #0f172a; letter-spacing: 0.3px;">PLAZA LIBRE #${slotNum}</div>
                                <div style="font-size: 0.65rem; color: #15803d; font-weight: 800; margin-top: 2px;">¡Disponible ahora! Toca para apuntarte</div>
                            </div>
                        </div>
                        <div style="background: #16a34a; color: #ffffff; font-size: 0.65rem; font-weight: 1000; padding: 6px 12px; border-radius: 8px; letter-spacing: 0.5px; box-shadow: 0 3px 10px rgba(22,163,74,0.3); white-space: nowrap;">
                            ¡APUNTARME!
                        </div>
                    </div>
                `;
            }

            // 🏟️ PREMIER PADEL COURTS GENERATION
            const totalCourtsNeeded = Math.max(1, Math.ceil(Math.max(totalPlayers + slotsLeft, maxPlayers) / 4));
            const assignedPlayerSlots = [];

            finalGroups.filter(g => g.type === 'pair').forEach(pairGroup => {
                assignedPlayerSlots.push({ player: pairGroup.p1, isPair: true, pairPartner: pairGroup.p2 });
                assignedPlayerSlots.push({ player: pairGroup.p2, isPair: true, pairPartner: pairGroup.p1 });
            });
            finalGroups.filter(g => g.type !== 'pair').forEach(soloGroup => {
                assignedPlayerSlots.push({ player: soloGroup.p1, isPair: false });
            });

            const renderCourtPlayerSlot = (slot, defaultPos, slotIndex) => {
                if (slot && slot.player) {
                    const p = slot.player;
                    const photo = p.photo_url || p.photoURL || 'img/logo_somospadel.png';
                    const rawName = (p.name || 'Jugador').trim();
                    const displayName = rawName.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                    const safeNameAttr = rawName.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
                    const level = parseFloat(p.level || 3.5).toFixed(2);
                    const position = p.position || defaultPos;
                    const posLabel = position.toLowerCase().includes('rev') ? '⚡ Revés' : '🛡️ Drive';

                    return `
                        <div class="court-player-slot filled" onclick="event.stopPropagation(); window.PadelFutCard && window.PadelFutCard.open({ user: { id: '${p.id || p.uid}', name: '${safeNameAttr}', level: '${p.level || 3.5}', photo_url: '${photo}' } })" style="
                            background: rgba(15, 23, 42, 0.9);
                            backdrop-filter: blur(6px);
                            border: 1px solid rgba(255,255,255,0.22);
                            border-radius: 10px;
                            padding: 6px 8px;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            cursor: pointer;
                            box-shadow: 0 3px 8px rgba(0,0,0,0.3);
                            transition: transform 0.15s, background 0.15s;
                        " onmouseover="this.style.transform='scale(1.02)'; this.style.background='rgba(15,23,42,1)';" onmouseout="this.style.transform='scale(1)'; this.style.background='rgba(15,23,42,0.9)';">
                            <div style="width: 32px; height: 32px; border-radius: 8px; background: url('${photo}') center/cover; border: 1.5px solid #38bdf8; flex-shrink: 0;"></div>
                            <div style="min-width: 0; flex: 1;">
                                <div style="font-size: 0.72rem; font-weight: 950; color: #ffffff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-transform: uppercase;">${displayName}</div>
                                <div style="display: flex; align-items: center; gap: 4px; margin-top: 2px;">
                                    <span style="background: #10b981; color: #ffffff; font-size: 0.55rem; font-weight: 950; padding: 0 4px; border-radius: 4px;">${level}</span>
                                    <span style="color: rgba(255,255,255,0.75); font-size: 0.52rem; font-weight: 800;">${posLabel}</span>
                                </div>
                            </div>
                        </div>
                    `;
                } else {
                    return `
                        <div class="court-player-slot vacant" onclick="document.getElementById('inscritos-modal').style.display = 'none'; if(window.EventsController) window.EventsController.registerInEvent('${evt.id}');" style="
                            background: rgba(255, 255, 255, 0.12);
                            border: 1.5px dashed rgba(255, 255, 255, 0.55);
                            border-radius: 10px;
                            padding: 8px 10px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 6px;
                            cursor: pointer;
                            color: #ffffff;
                            font-size: 0.68rem;
                            font-weight: 900;
                            transition: all 0.15s;
                        " onmouseover="this.style.background='rgba(34,197,94,0.3)'; this.style.borderColor='#4ade80';" onmouseout="this.style.background='rgba(255,255,255,0.12)'; this.style.borderColor='rgba(255,255,255,0.55)';">
                            <i class="fas fa-plus-circle" style="color: #4ade80; font-size: 0.85rem;"></i>
                            <span style="letter-spacing: 0.3px;">Plaza Libre</span>
                        </div>
                    `;
                }
            };

            let courtsHtml = '';
            for (let c = 0; c < totalCourtsNeeded; c++) {
                const courtNum = c + 1;
                const s1 = assignedPlayerSlots[c * 4 + 0] || null;
                const s2 = assignedPlayerSlots[c * 4 + 1] || null;
                const s3 = assignedPlayerSlots[c * 4 + 2] || null;
                const s4 = assignedPlayerSlots[c * 4 + 3] || null;

                const courtPlayers = [s1, s2, s3, s4].filter(s => s && s.player).map(s => s.player);
                const courtPlayerNames = courtPlayers.map(p => p.name || '').join(' ').replace(/"/g, '&quot;');
                const courtAvgLvl = courtPlayers.length > 0 
                    ? (courtPlayers.reduce((acc, p) => acc + parseFloat(p.level || 3.5), 0) / courtPlayers.length).toFixed(2)
                    : avgLevel;

                courtsHtml += `
                    <div class="battle-court-card" data-player-names="${courtPlayerNames}" style="
                        background: #ffffff;
                        border: 1.5px solid #cbd5e1;
                        border-radius: 18px;
                        padding: 14px;
                        box-shadow: 0 4px 16px rgba(0,0,0,0.04);
                        margin-bottom: 16px;
                    ">
                        <!-- Court Header -->
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding: 0 2px;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="background: #0f172a; color: #38bdf8; font-weight: 1000; font-size: 0.72rem; padding: 4px 10px; border-radius: 8px; letter-spacing: 0.5px;">
                                    🎾 PISTA ${courtNum}
                                </span>
                                <span style="font-size: 0.65rem; color: #64748b; font-weight: 800;">CÉSPED PREMIER AZUL</span>
                            </div>
                            <div style="font-size: 0.62rem; color: #0284c7; font-weight: 950; background: #f0f9ff; border: 1px solid #bae6fd; padding: 3px 8px; border-radius: 6px;">
                                NIVEL MEDIO: ${courtAvgLvl} LVL
                            </div>
                        </div>

                        <!-- Court Simulation Box -->
                        <div style="
                            background: linear-gradient(180deg, #0284c7 0%, #0369a1 100%);
                            border: 2px solid #ffffff;
                            border-radius: 14px;
                            position: relative;
                            padding: 12px;
                            box-shadow: inset 0 0 24px rgba(0,0,0,0.25);
                        ">
                            <!-- Center Net Divider Line -->
                            <div style="position: absolute; top: 0; bottom: 0; left: 50%; width: 2px; background: rgba(255,255,255,0.7); transform: translateX(-50%); z-index: 1;"></div>
                            
                            <!-- Center Net Pill -->
                            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #0f172a; color: #38bdf8; border: 1.5px solid #38bdf8; font-size: 0.52rem; font-weight: 1000; padding: 2px 7px; border-radius: 6px; z-index: 5; letter-spacing: 1px; box-shadow: 0 2px 8px rgba(0,0,0,0.4);">
                                RED 🎾
                            </div>

                            <!-- 2 Teams Grid -->
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; position: relative; z-index: 2;">
                                <!-- Team Left (Team A) -->
                                <div style="display: flex; flex-direction: column; gap: 8px;">
                                    <div style="font-size: 0.54rem; font-weight: 1000; color: rgba(255,255,255,0.9); text-transform: uppercase; letter-spacing: 0.5px;">PAREJA A</div>
                                    ${renderCourtPlayerSlot(s1, '⚡ Revés', 1)}
                                    ${renderCourtPlayerSlot(s2, '🛡️ Drive', 2)}
                                </div>

                                <!-- Team Right (Team B) -->
                                <div style="display: flex; flex-direction: column; gap: 8px;">
                                    <div style="font-size: 0.54rem; font-weight: 1000; color: rgba(255,255,255,0.9); text-transform: uppercase; letter-spacing: 0.5px; text-align: right;">PAREJA B</div>
                                    ${renderCourtPlayerSlot(s3, '⚡ Revés', 3)}
                                    ${renderCourtPlayerSlot(s4, '🛡️ Drive', 4)}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }

            // 🎰 Sorteo / Ruleta (Safe Handler)
            window.startBattleRoulette = function() {
                console.log('Battle Roulette safe handler');
            };

            // ⚔️ AI Duel Arena (Safe Handlers)
            window.renderDuelArena = window.updateBattleDuel = function() {
                console.log('Battle Duel safe handler');
            };

            window.sendBattleDuelChallenge = function(name1, name2, prob1, prob2) {
                const safeName1 = name1 || 'Jugador 1';
                const safeName2 = name2 || 'Jugador 2';
                const safeProb1 = (prob1 !== undefined && !isNaN(prob1)) ? prob1 : 50;
                const safeProb2 = (prob2 !== undefined && !isNaN(prob2)) ? prob2 : (100 - safeProb1);

                const text = `⚔️ *¡DESAFÍO SOMOSPADEL BCN!* ⚔️\n\n` +
                    `Hola *${safeName2}*, reto directo en *${(evt.name || 'Torneo').toUpperCase()}*:\n\n` +
                    `🎾 ${safeName1}: ${safeProb1}%\n` +
                    `🎾 ${safeName2}: ${safeProb2}%\n\n` +
                    `¿Te atreves a resolverlo en la pista? ¡Prepara la pala! 🔥🏆`;

                if (navigator.share) {
                    navigator.share({ title: 'Desafío SomosPadel', text }).catch(() => {});
                } else if (navigator.clipboard) {
                    navigator.clipboard.writeText(text).then(() => {
                        alert('¡Mensaje copiado al portapapeles! 🚀');
                    });
                } else {
                    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                }
            };

            modal.innerHTML = `
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@800;900;1000&family=Outfit:wght@600;700;800;900&display=swap');
                    
                    .battle-stats-grid {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 8px;
                        margin-bottom: 12px;
                    }
                    @media (min-width: 640px) {
                        .battle-stats-grid {
                            grid-template-columns: repeat(4, 1fr);
                        }
                    }

                    .battle-filter-pill {
                        background: #ffffff;
                        border: 1.5px solid #cbd5e1;
                        color: #475569;
                        padding: 6px 13px;
                        border-radius: 10px;
                        font-size: 0.72rem;
                        font-weight: 900;
                        cursor: pointer;
                        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                        white-space: nowrap;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.02);
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                    }
                    .battle-filter-pill:hover {
                        color: #0f172a;
                        background: #f8fafc;
                        border-color: #94a3b8;
                    }
                    .battle-filter-pill.active {
                        background: #0f172a !important;
                        color: #ffffff !important;
                        border-color: #0f172a !important;
                        box-shadow: 0 3px 10px rgba(15,23,42,0.18) !important;
                    }

                    .battle-pills-row {
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        overflow-x: auto;
                        overflow-y: hidden;
                        scrollbar-width: none !important;
                        -ms-overflow-style: none !important;
                        -webkit-overflow-scrolling: touch;
                        padding-bottom: 2px;
                    }
                    .battle-pills-row::-webkit-scrollbar {
                        display: none !important;
                        width: 0 !important;
                        height: 0 !important;
                    }
                    .scrolling-text { display: inline-block; animation: marquee 35s linear infinite; }
                    @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
                    #inscritos-modal::-webkit-scrollbar { width: 6px; }
                    #inscritos-modal::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                    #inscritos-modal::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
                    
                    @keyframes soundWave {
                        0%, 100% { height: 4px; }
                        50% { height: 14px; }
                    }
                    .eq-bar {
                        width: 3px;
                        height: 4px;
                        background: #38bdf8;
                        border-radius: 2px;
                        display: inline-block;
                        animation: soundWave 0.7s ease-in-out infinite;
                    }
                    .eq-bar:nth-child(2) { animation-delay: 0.15s; }
                    .eq-bar:nth-child(3) { animation-delay: 0.3s; }
                    .eq-bar:nth-child(4) { animation-delay: 0.45s; }

                    @keyframes confettiFall {
                        0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
                        100% { transform: translateY(240px) rotate(480deg); opacity: 0; }
                    }
                    @keyframes pulseBadge {
                        0%, 100% { transform: scale(1); opacity: 1; }
                        50% { transform: scale(1.06); opacity: 0.85; }
                    }
                </style>

                <!-- STICKY TOP NAVIGATION BAR (COMPACT BROADCAST BAR) -->
                <div id="battle-top-bar" style="position: sticky; top: 0; z-index: 30010; background: #ffffff !important; border-bottom: 1px solid #e2e8f0; padding: 8px 14px; display: flex; justify-content: space-between; align-items: center; gap: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.04);">
                    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                        <span style="background: #0f172a; color: #38bdf8; padding: 3px 8px; border-radius: 6px; font-weight: 950; font-size: 0.64rem; letter-spacing: 1px;">BROADCAST</span>
                        <div style="display: flex; align-items: center; gap: 5px;">
                            <div style="width: 7px; height: 7px; background: #dc2626; border-radius: 50%; animation: pulseBadge 1.2s infinite;"></div>
                            <span style="font-size: 0.62rem; font-weight: 950; color: #dc2626; letter-spacing: 0.5px;">LIVE</span>
                        </div>
                        <div id="battle-countdown-badge" style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 3px 8px; border-radius: 6px; font-size: 0.65rem; font-weight: 900; color: #0f172a; display: flex; align-items: center; gap: 5px;">
                            <i class="far fa-clock" style="color:#0284c7;"></i> CALCULANDO...
                        </div>
                    </div>

                    <div style="display: flex; align-items: center; gap: 6px;">
                        <!-- 📢 SPEAKER OFICIAL DE ESTADIO -->
                        <button id="battle-voice-btn" onclick="window.toggleBattleVoiceBroadcast()" title="Megafonía Oficial de Pista" style="
                            background: #0f172a;
                            border: 1px solid #0f172a;
                            color: #ffffff;
                            padding: 6px 12px;
                            border-radius: 12px;
                            font-size: 0.7rem;
                            font-weight: 950;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            gap: 6px;
                            transition: all 0.2s;
                            box-shadow: 0 2px 8px rgba(15,23,42,0.15);
                        ">
                            <i class="fas fa-bullhorn" id="battle-voice-icon" style="color: #38bdf8; font-size: 0.75rem;"></i>
                            <span id="battle-voice-text">SPEAKER</span>
                            <div id="battle-voice-eq" style="display: none; align-items: flex-end; gap: 2px; height: 12px;">
                                <span class="eq-bar"></span>
                                <span class="eq-bar"></span>
                                <span class="eq-bar"></span>
                                <span class="eq-bar"></span>
                            </div>
                        </button>

                        <button onclick="window.toggleBattleReadyFullscreen()" title="Pantalla Completa TV" style="background: #ffffff; border: 1px solid #cbd5e1; color: #0f172a; width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 0.85rem; transition: all 0.2s;">
                            <i class="fas fa-expand"></i>
                        </button>
                        <button onclick="window.closeBattleReadyModal()" title="Cerrar" style="background: #fee2e2; border: 1px solid #fca5a5; color: #dc2626; width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 0.95rem; transition: all 0.2s;"
                                onmouseover="this.style.background='#dc2626'; this.style.color='#fff';"
                                onmouseout="this.style.background='#fee2e2'; this.style.color='#dc2626';">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>

                <div class="broadcast-container" style="padding: 12px 14px 60px; max-width: 1400px; margin: 0 auto; width: 100%; box-sizing: border-box;">
                    
                    <!-- COMPACT SPORT HERO BANNER & CAPACITY BAR -->
                    <div class="broadcast-header" style="
                        background: #ffffff; 
                        border: 1.5px solid #e2e8f0;
                        border-radius: 18px; 
                        padding: 14px 16px; 
                        margin-bottom: 12px;
                        box-shadow: 0 4px 16px rgba(0,0,0,0.03);
                    ">
                        <!-- TOP ROW: BADGES & METADATA CHIPS -->
                        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin-bottom: 6px;">
                            <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                                <span style="background: #0f172a; color: #38bdf8; font-size: 0.62rem; font-weight: 950; padding: 3px 8px; border-radius: 6px; letter-spacing: 0.5px;">
                                    ${isEntrenoModal ? '🎾 ENTRENO OFICIAL' : '🏆 TORNEO AMERICANO'}
                                </span>
                                <span style="display: inline-flex; align-items: center; gap: 4px; font-size: 0.68rem; font-weight: 800; color: #334155; background: #f1f5f9; padding: 3px 8px; border-radius: 6px; border: 1px solid #e2e8f0;">
                                    <i class="far fa-clock" style="color: #0284c7;"></i> ${this.formatEventTime(evt)}
                                </span>
                                <span style="display: inline-flex; align-items: center; gap: 4px; font-size: 0.68rem; font-weight: 800; color: #334155; background: #f1f5f9; padding: 3px 8px; border-radius: 6px; border: 1px solid #e2e8f0;">
                                    <i class="fas fa-map-marker-alt" style="color: #dc2626;"></i> ${eventLocation}
                                </span>
                                <span style="display: inline-flex; align-items: center; gap: 4px; font-size: 0.68rem; font-weight: 800; color: #334155; background: #f1f5f9; padding: 3px 8px; border-radius: 6px; border: 1px solid #e2e8f0;">
                                    <i class="fas fa-euro-sign" style="color: #d97706;"></i> ${eventPriceText}
                                </span>
                            </div>

                            <span style="font-size: 0.62rem; font-weight: 900; color: #64748b; letter-spacing: 0.5px; text-transform: uppercase;">
                                SOMOSPADEL BCN
                            </span>
                        </div>

                        <!-- EVENT TITLE -->
                        <h1 style="
                            margin: 2px 0 10px 0; 
                            font-family: 'Montserrat', sans-serif; 
                            font-size: clamp(1.15rem, 2.6vw, 1.6rem); 
                            font-weight: 1000; 
                            text-transform: uppercase; 
                            letter-spacing: -0.4px; 
                            line-height: 1.15;
                            color: #0f172a;
                        ">
                            ${eventTitle}
                        </h1>

                        <!-- CAPACITY METER (COMPACT & NEON STYLIZED) -->
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 8px 12px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <i class="fas fa-users" style="color: #0284c7; font-size: 0.8rem;"></i>
                                    <span style="font-size: 0.78rem; font-weight: 950; color: #0f172a;">
                                        ${totalPlayers}/${maxPlayers} <span style="color: #64748b; font-weight: 800; font-size: 0.72rem;">Inscritos (${fillPercent}%)</span>
                                    </span>
                                </div>
                                <div>
                                    ${slotsLeft > 0 ? `
                                        <span style="background: #ecfdf5; border: 1px solid #a7f3d0; color: #047857; font-size: 0.62rem; font-weight: 1000; padding: 2px 8px; border-radius: 6px; letter-spacing: 0.5px;">
                                            ⚡ ¡FALTAN ${slotsLeft} PLAZAS!
                                        </span>
                                    ` : `
                                        <span style="background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; font-size: 0.62rem; font-weight: 1000; padding: 2px 8px; border-radius: 6px; letter-spacing: 0.5px;">
                                            🔥 ¡AFORO COMPLETO!
                                        </span>
                                    `}
                                </div>
                            </div>
                            <div style="width: 100%; height: 6px; background: #e2e8f0; border-radius: 99px; overflow: hidden;">
                                <div style="width: ${fillPercent}%; height: 100%; background: linear-gradient(90deg, #10b981 0%, #06b6d4 100%); border-radius: 99px; box-shadow: 0 0 8px rgba(16,185,129,0.35); transition: width 0.3s ease;"></div>
                            </div>
                        </div>
                    </div>

                    <!-- 1. SYMMETRIC DASHBOARD STATS STRIP (2x2 MOBILE, 4-COL DESKTOP) -->
                    <div class="battle-stats-grid">
                        <!-- KPI 1: Nivel Medio & Rango -->
                        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 8px 10px; display: flex; align-items: center; gap: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.02);">
                            <div style="width: 32px; height: 32px; border-radius: 8px; background: #ecfdf5; color: #059669; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; flex-shrink: 0;"><i class="fas fa-chart-line"></i></div>
                            <div style="min-width: 0; flex: 1;">
                                <div style="font-size: 0.54rem; color: #64748b; font-weight: 900; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">NIVEL MEDIO</div>
                                <div style="font-size: 0.95rem; font-weight: 1000; color: #0f172a; line-height: 1.1; margin-top: 1px;">
                                    ${avgLevel} <small style="font-size: 0.55rem; color: #059669; font-weight: 900;">LVL</small>
                                </div>
                                <div style="font-size: 0.52rem; color: #64748b; font-weight: 800; margin-top: 2px;">Rango ${levelRange}</div>
                            </div>
                        </div>

                        <!-- KPI 2: Equilibrio & Tensión -->
                        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 8px 10px; display: flex; align-items: center; gap: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.02);">
                            <div style="width: 32px; height: 32px; border-radius: 8px; background: #f0f9ff; color: #0284c7; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; flex-shrink: 0;"><i class="fas fa-scale-balanced"></i></div>
                            <div style="min-width: 0; flex: 1;">
                                <div style="font-size: 0.54rem; color: #64748b; font-weight: 900; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">EQUILIBRIO</div>
                                <div style="font-size: 0.95rem; font-weight: 1000; color: #0f172a; line-height: 1.1; margin-top: 1px;">
                                    ${balanceScore}% <small style="font-size: 0.55rem; color: #0284c7; font-weight: 900;">EQ</small>
                                </div>
                                <div style="width: 100%; height: 3px; background: #e2e8f0; border-radius: 99px; margin-top: 4px; overflow: hidden;">
                                    <div style="width: ${balanceScore}%; height: 100%; background: #0284c7; border-radius: 99px;"></div>
                                </div>
                            </div>
                        </div>

                        <!-- KPI 3: Formato & Táctica -->
                        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 8px 10px; display: flex; align-items: center; gap: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.02);">
                            <div style="width: 32px; height: 32px; border-radius: 8px; background: #fefce8; color: #ca8a04; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; flex-shrink: 0;"><i class="fas fa-users-viewfinder"></i></div>
                            <div style="min-width: 0; flex: 1;">
                                <div style="font-size: 0.54rem; color: #64748b; font-weight: 900; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">FORMATO</div>
                                <div style="font-size: 0.92rem; font-weight: 1000; color: #0f172a; line-height: 1.1; margin-top: 1px; white-space: nowrap;">
                                    ${pairsCount}P <small style="font-size: 0.65rem; color: #64748b; font-weight: 800;">• ${solosCount}S</small>
                                </div>
                                <div style="font-size: 0.52rem; color: #64748b; font-weight: 800; margin-top: 2px;">🛡️${drivesCount}D • ⚡${revesCount}R</div>
                            </div>
                        </div>

                        <!-- KPI 4: Plazas Disponibles -->
                        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 8px 10px; display: flex; align-items: center; gap: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.02);">
                            <div style="width: 32px; height: 32px; border-radius: 8px; background: ${slotsLeft > 0 ? '#f0fdf4' : '#fef2f2'}; color: ${slotsLeft > 0 ? '#16a34a' : '#dc2626'}; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; flex-shrink: 0;"><i class="fas fa-ticket"></i></div>
                            <div style="min-width: 0; flex: 1;">
                                <div style="font-size: 0.54rem; color: #64748b; font-weight: 900; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">PLAZAS</div>
                                <div style="font-size: 0.9rem; font-weight: 1000; color: ${slotsLeft > 0 ? '#16a34a' : '#dc2626'}; line-height: 1.1; margin-top: 1px;">
                                    ${slotsLeft > 0 ? `${slotsLeft} LIBRES` : 'COMPLETO'}
                                </div>
                                <div style="display: inline-flex; align-items: center; gap: 3px; font-size: 0.52rem; color: ${slotsLeft > 0 ? '#15803d' : '#b91c1c'}; font-weight: 900; margin-top: 2px;">
                                    <span style="width: 5px; height: 5px; border-radius: 50%; background: ${slotsLeft > 0 ? '#22c55e' : '#ef4444'}; animation: pulseBadge 1.2s infinite;"></span>
                                    ${slotsLeft > 0 ? 'DISPONIBLES' : 'AGOTADAS'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- ACTION ROW: WHATSAPP SHARE + INSTAGRAM / STORY POSTER CREATOR -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
                        <button onclick="window.shareConvocatoriaBattleReady()" style="
                            background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
                            color: #ffffff;
                            border: none;
                            padding: 11px 10px;
                            border-radius: 14px;
                            font-weight: 950;
                            font-size: 0.76rem;
                            letter-spacing: 0.3px;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 6px;
                            box-shadow: 0 4px 14px rgba(37, 211, 102, 0.25);
                            transition: transform 0.2s, box-shadow 0.2s;
                        " onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 6px 18px rgba(37, 211, 102, 0.35)';" onmouseout="this.style.transform='none'; this.style.boxShadow='0 4px 14px rgba(37, 211, 102, 0.25)';">
                            <i class="fab fa-whatsapp" style="font-size: 1.05rem;"></i>
                            <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">COMPARTIR CONVOCATORIA</span>
                        </button>

                        <button id="battle-story-btn" onclick="window.generateConvocatoriaStory()" style="
                            background: linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%);
                            color: #ffffff;
                            border: none;
                            padding: 11px 10px;
                            border-radius: 14px;
                            font-weight: 950;
                            font-size: 0.76rem;
                            letter-spacing: 0.3px;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 6px;
                            box-shadow: 0 4px 14px rgba(253, 29, 29, 0.25);
                            transition: transform 0.2s, box-shadow 0.2s;
                        " onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 6px 18px rgba(253, 29, 29, 0.35)';" onmouseout="this.style.transform='none'; this.style.boxShadow='0 4px 14px rgba(253, 29, 29, 0.25)';">
                            <i class="fas fa-camera-retro" style="font-size: 1rem;"></i>
                            <span id="battle-story-text" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">CARTEL STORY HD</span>
                        </button>
                    </div>

                    <!-- TACTICAL VIEW TOGGLE: CARDS vs COURTS -->
                    <div style="display: flex; background: #f1f5f9; padding: 3px; border-radius: 12px; border: 1px solid #cbd5e1; margin-bottom: 12px;">
                        <button id="battle-mode-cards-btn" class="battle-view-mode-btn active" onclick="window.setBattleDisplayMode('cards')" style="
                            flex: 1;
                            padding: 7px 10px;
                            border-radius: 9px;
                            font-weight: 950;
                            font-size: 0.72rem;
                            cursor: pointer;
                            border: none;
                            transition: all 0.2s;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 6px;
                            background: #0f172a;
                            color: #ffffff;
                            box-shadow: 0 2px 6px rgba(0,0,0,0.12);
                        ">
                            <span>🃏</span> <span>MODO TARJETAS</span>
                        </button>
                        <button id="battle-mode-courts-btn" class="battle-view-mode-btn" onclick="window.setBattleDisplayMode('courts')" style="
                            flex: 1;
                            padding: 7px 10px;
                            border-radius: 9px;
                            font-weight: 950;
                            font-size: 0.72rem;
                            cursor: pointer;
                            border: none;
                            transition: all 0.2s;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 6px;
                            background: transparent;
                            color: #64748b;
                        ">
                            <span>🎾</span> <span>MODO PISTAS</span>
                        </button>
                    </div>

                    <!-- ROSTER DIRECT VIEW (SEARCH, FILTERS, CARDS GRID & COURTS SIMULATION) -->
                    <div id="battle-view-roster" style="display: block;">
                        <!-- SEARCH BAR & FILTER PILLS -->
                        <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px;">
                            <div style="position: relative; width: 100%;">
                                <i class="fas fa-search" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #64748b; font-size: 0.8rem;"></i>
                                <input type="text" id="battle-search-input" placeholder="Buscar jugador o nivel..." oninput="window.searchBattleReady(this.value)" 
                                       style="width: 100%; box-sizing: border-box; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; padding: 9px 14px 9px 38px; color: #0f172a; font-size: 0.82rem; font-weight: 800; outline: none; transition: all 0.2s;"
                                       onfocus="this.style.borderColor='#0284c7'; this.style.boxShadow='0 0 0 3px rgba(2,132,199,0.12)';"
                                       onblur="this.style.borderColor='#cbd5e1'; this.style.boxShadow='none';">
                            </div>

                            <div class="battle-pills-row">
                                <button id="battle-pill-all" class="battle-filter-pill active" onclick="window.filterBattleReady('all')">Todos (${totalPlayers + slotsLeft})</button>
                                <button id="battle-pill-pair" class="battle-filter-pill" onclick="window.filterBattleReady('pair')">Parejas (${pairsCount})</button>
                                <button id="battle-pill-solo" class="battle-filter-pill" onclick="window.filterBattleReady('solo')">Buscando Pareja 🔍 (${solosCount})</button>
                                <button id="battle-pill-vacant" class="battle-filter-pill" onclick="window.filterBattleReady('vacant')">Plazas Libres 🎟️ (${slotsLeft})</button>
                            </div>
                        </div>

                        <!-- CARDS VIEW CONTAINER -->
                        <div id="battle-cards-container" class="broadcast-grid" style="
                            display: grid; 
                            grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr)); 
                            gap: 12px; 
                            margin-bottom: 30px;
                        ">
                            ${cardsHtml}
                            ${vacantSlotsHtml}
                        </div>

                        <!-- COURTS VIEW CONTAINER (CÉSPED PREMIER PADEL) -->
                        <div id="battle-courts-container" style="display: none; margin-bottom: 30px;">
                            ${courtsHtml}
                        </div>
                    </div>

                    <!-- FOOTER CLOSE BUTTON -->
                    <div style="display: flex; justify-content: center; gap: 14px; padding-bottom: 30px;">
                        <button onclick="window.closeBattleReadyModal()" 
                                style="background: #0f172a; color: #ffffff; border: 1.5px solid #0f172a; padding: 11px 36px; border-radius: 12px; font-weight: 950; cursor: pointer; text-transform: uppercase; font-size: 0.8rem; box-shadow: 0 4px 14px rgba(15,23,42,0.15); transition: all 0.2s;"
                                onmouseover="this.style.background='#1e293b';"
                                onmouseout="this.style.background='#0f172a';">
                            CERRAR VISTA
                        </button>
                    </div>
                </div>

                <!-- TICKER INFERIOR MARQUEE -->
                <div style="position: fixed; bottom: 0; left: 0; width: 100%; height: 34px; background: #0f172a; border-top: 1px solid #1e293b; display: flex; align-items: center; overflow: hidden; z-index: 30001; box-shadow: 0 -4px 16px rgba(0,0,0,0.12);">
                    <div class="scrolling-text" style="white-space: nowrap; font-weight: 900; font-size: 0.74rem; color: #ffffff; text-transform: uppercase; letter-spacing: 0.5px;">
                        ${dbPlayers.map(p => {
                            const tickerName = String(p.name || 'Jugador').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                            const tickerLvl = parseFloat(p.level || 3.5).toFixed(2);
                            return `• <span style="color: #ffffff;">${tickerName}</span> (<span style="color: #38bdf8;">LVL ${tickerLvl}</span>)`;
                        }).join('  &nbsp;&nbsp;&nbsp;&nbsp;  ')} 
                        &nbsp;&nbsp;&nbsp;&nbsp; 🎾 <span style="color: #38bdf8; font-weight: 950;">SOMOSPADEL BCN</span> • <span style="color: ${slotsLeft > 0 ? '#4ade80' : '#f87171'}; font-weight: 950;">${slotsLeft > 0 ? `¡QUEDAN ${slotsLeft} PLAZAS LIBRES!` : '¡EVENTO COMPLETO!'}</span> • INSCRIPCIONES ABIERTAS EN LA APP &nbsp;&nbsp;&nbsp;&nbsp;
                    </div>
                </div>
            `;

            modal.style.display = 'block';
            window.updateBattleCountdown();

            // Sincronizar el selector de perfil de locutor con el estado actual
            const voiceProfileSel = document.getElementById('battle-voice-profile-select');
            if (voiceProfileSel && window._battleVoiceProfile) {
                voiceProfileSel.value = window._battleVoiceProfile;
            }

            // Preservar y restaurar la posición de scroll y estado interactivo
            if (savedScrollTop > 0) {
                requestAnimationFrame(() => {
                    if (modal) modal.scrollTop = savedScrollTop;
                });
            }
            if (prevTab && window.switchBattleReadyTab) {
                window.switchBattleReadyTab(prevTab);
            }
            if (prevSearch && window.searchBattleReady) {
                const searchInp = document.getElementById('battle-search-input');
                if (searchInp) searchInp.value = prevSearch;
                window.searchBattleReady(prevSearch);
            }
            if (prevFilter && prevFilter !== 'all' && window.filterBattleReady) {
                window.filterBattleReady(prevFilter);
            }



        }

        _renderEventTabHeader(eventId, tabId, label, icon) {
            const activeTab = this.state.eventTabs[eventId] || 'info';
            const isActive = activeTab === tabId;
            return `
                <button onclick="event.stopPropagation(); window.EventsController.setEventTab('${eventId}', '${tabId}')" 
                        style="flex:1; background: ${isActive ? 'rgba(204,255,0,0.1)' : 'transparent'}; border: 1.5px solid ${isActive ? '#CCFF00' : 'transparent'}; color: ${isActive ? '#CCFF00' : '#888'}; padding: 8px 5px; border-radius: 10px; font-size: 0.65rem; font-weight: 900; display: flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer; transition: all 0.2s;">
                    <i class="fas ${icon}" style="font-size: 0.8rem;"></i> ${label}
                </button>
            `;
        }

        _renderEventTabContent(evt) {
            const activeTab = this.state.eventTabs[evt.id] || 'info';

            // Precios reales
            const priceSoc = evt.price_members || evt.price_socio || evt.price_member || '18';
            const priceExt = evt.price_external || evt.price_externo || evt.price_externa || '22';

            if (activeTab === 'info') {
                return `
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 0.8rem; color: #ccc;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-calendar-check" style="color: #84cc16;"></i>
                            <span>${(evt.players || evt.registeredPlayers || []).length} Apuntados</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-euro-sign" style="color: #eab308;"></i>
                            <span style="font-size: 0.9rem; color: #fff;">Precio: <span style="color:#CCFF00; font-weight:950;">SOC ${priceSoc}€</span> / <span style="color:#FF2D55; font-weight:950;">EXT ${priceExt}€</span></span>
                        </div>
                    </div>
                `;
            }

            const cache = this.state.matchCache[evt.id];

            if (activeTab === 'rank') {
                if (!cache) {
                    return `<div style="text-align:center; padding:15px; color:#888;"><i class="fas fa-spinner fa-spin"></i> Cargando Ranking...</div>`;
                }

                let rankData = [];
                if (window.StandingsService) {
                    rankData = window.StandingsService.calculate(cache.matches).slice(0, 3);
                }

                if (rankData.length === 0) {
                    return `<div style="text-align:center; padding:15px; color:#666; font-size:0.75rem;">No hay partidos finalizados todavía.</div>`;
                }

                return `
                    <div style="background: rgba(0,0,0,0.2); border-radius: 12px; padding: 10px; font-size: 0.75rem;">
                         <div style="display:flex; justify-content:space-between; margin-bottom: 8px; color: #CCFF00; font-weight: 900; font-size: 0.6rem; text-transform: uppercase; letter-spacing:1px;">
                            <span>TOP 3 JUGADORES</span>
                            <span>PTS</span>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            ${rankData.map((p, idx) => `
                                <div style="display:flex; justify-content:space-between; align-items:center; background: rgba(255,255,255,0.03); padding: 5px 10px; border-radius: 8px;">
                                    <div style="display:flex; align-items:center; gap:8px;">
                                        <span style="color:#888; font-weight:900; width:15px;">${idx + 1}.</span>
                                        <span style="color:#fff; font-weight:700;">${p.name.split(' ')[0]}</span>
                                    </div>
                                    <span style="color:#CCFF00; font-weight:900;">${p.points}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }

            if (activeTab === 'draws') {
                if (!cache) {
                    return `<div style="text-align:center; padding:15px; color:#888;"><i class="fas fa-spinner fa-spin"></i> Cargando Cuadros...</div>`;
                }

                const totalRounds = new Set(cache.matches.map(m => m.round)).size;
                const totalMatches = cache.matches.length;

                return `
                    <div style="background: rgba(0,0,0,0.2); border-radius: 12px; padding: 15px; display: flex; align-items: center; justify-content: space-between;">
                        <div style="text-align: left;">
                            <div style="color: #fff; font-weight: 900; font-size: 0.8rem; margin-bottom: 2px;">ESTADO TORNEO</div>
                            <div style="color: #888; font-size: 0.65rem;">${totalRounds} Rondas • ${totalMatches} Partidos</div>
                        </div>
                        <i class="fas fa-sitemap" style="font-size: 1.5rem; color: #CCFF00; opacity: 0.8;"></i>
                    </div>
                `;
            }

            return '';
        }

        smartUpdate(events) {
            const user = this.state.currentUser;
            const uid = user ? user.uid : '-';

            // 0. Si no hay eventos, o si falta alguna tarjeta en el DOM, forzar render completo
            if (!events || events.length === 0) {
                return false;
            }

            // Purgar tarjetas del DOM que ya no están activas en events (ej. pasaron a finished o cancelled)
            const activeIds = new Set(events.map(e => String(e.id)));
            const domCards = document.querySelectorAll('[id^="event-card-"]');
            domCards.forEach(card => {
                const cardId = card.id.replace('event-card-', '');
                if (!activeIds.has(cardId)) {
                    card.remove();
                }
            });

            const allCardsPresent = events.every(evt => document.getElementById(`event-card-${evt.id}`));
            if (!allCardsPresent) {
                return false; // Algún nuevo evento requiere renderizado completo
            }

            let updatedCount = 0;
            events.forEach(evt => {
                const card = document.getElementById(`event-card-${evt.id}`);
                if (!card) return;

                const isEntreno = evt.type === 'entreno';

                // 1. Update Player Count & Capacity
                const players = (evt.players && evt.players.length > 0) ? evt.players : (evt.registeredPlayers || []);
                const playerCount = players.length;
                const maxCourts = parseInt(evt.max_courts || evt.courts || 4);
                const maxPlayers = maxCourts * 4;
                const isFull = playerCount >= maxPlayers;
                const waitlist = evt.waitlist || [];

                const playersLabel = document.getElementById(`event-players-label-${evt.id}`);
                if (playersLabel) {
                    const newText = `${playerCount} / ${maxPlayers} Plazas`;
                    if (playersLabel.innerText !== newText) {
                        playersLabel.innerText = newText;
                        playersLabel.style.color = isFull ? '#FF3B30' : '#fff';
                        const icon = document.getElementById(`event-players-icon-${evt.id}`);
                        if (icon) icon.style.color = isFull ? '#FF3B30' : (isEntreno ? '#06b6d4' : '#FF2D55');
                    }
                }
                const wlLabel = document.getElementById(`event-waitlist-label-${evt.id}`);
                if (wlLabel) {
                    const newWl = waitlist.length > 0 ? `<div style="margin-top: 5px; font-size: 0.65rem; font-weight: 900; color: #eab308; text-transform: uppercase;">+${waitlist.length} EN ESPERA</div>` : '';
                    if (wlLabel.innerHTML !== newWl) wlLabel.innerHTML = newWl;
                }

                // 2. Update FAB & Actions
                const isJoined = players.some(p => p.uid === uid || p.id === uid);
                const isLive = evt.status === 'live';
                const isFinished = evt.status === 'finished';
                const isCancelled = evt.status === 'cancelled';
                const isPairing = evt.status === 'pairing';
                const isWaitlistPending = evt.waitlist_pending_user && (evt.waitlist_pending_user.uid === uid);
                const isInWaitlist = waitlist.some(p => p.uid === uid);
                const waitlistPos = waitlist.findIndex(p => p.uid === uid) + 1;

                let btnLabel = 'ENTRAR';
                let btnIcon = 'fa-play';
                let btnColor = '#CCFF00';
                let cardAction = `window.EventsController.openLiveEvent('${evt.id}', '${evt.type || 'americana'}')`;
                let fabAction = cardAction;

                const isAmericanasOnlyUser = this.state.currentUser && this.state.currentUser.role === 'player_americanas';

                // Gender Check in smartUpdate
                const genderCheck = this.checkGenderEligibility(evt, this.state.currentUser);
                const isGenderMismatch = !genderCheck.eligible;

                if (isCancelled) {
                    btnLabel = 'ANULADO'; btnIcon = 'fa-ban'; btnColor = '#ef4444';
                    cardAction = "window.PremiumModal.alert({ title: '⛔ ANULADO', message: 'Este evento ha sido cancelado por la organización.', type: 'error' })";
                    fabAction = cardAction;
                } else if (isFinished) {
                    btnLabel = 'VER'; btnIcon = 'fa-history'; btnColor = '#64748b';
                    cardAction = `window.openResultsView('${evt.id}', '${evt.type || 'americana'}')`;
                    fabAction = cardAction;
                } else if (isLive) {
                    btnLabel = 'LIVE'; btnIcon = 'fa-broadcast-tower'; btnColor = '#FF2D55';
                } else if (isWaitlistPending) {
                    btnLabel = '¡NUEVA PLAZA! CONFIRMAR'; btnIcon = 'fa-star'; btnColor = '#CCFF00';
                    fabAction = `window.EventsController.confirmWaitlist('${evt.id}', '${evt.type || 'americana'}')`;
                } else if (isEntreno && isAmericanasOnlyUser && !isJoined) {
                    btnLabel = 'SOLO AMERICANAS'; btnIcon = 'fa-lock'; btnColor = '#4b5563';
                    fabAction = `window.PremiumModal.alert({ title: '🏆 ACCESO EXCLUSIVO', message: 'Tu perfil de jugador está registrado exclusivamente para Americanas.' })`;
                } else if (isGenderMismatch && !isJoined) {
                    btnLabel = genderCheck.buttonLabel || (genderCheck.mismatchCase === 'male' ? 'SOLO CHICOS' : 'SOLO CHICAS');
                    btnIcon = 'fa-lock';
                    btnColor = '#4b5563';
                    const safeTitle = (genderCheck.title || '⚠️ RESTRICCIÓN').replace(/'/g, "\\'");
                    const safeMsg = (genderCheck.message || 'Género no válido.').replace(/'/g, "\\'");
                    fabAction = `window.PremiumModal.alert({ title: '${safeTitle}', message: '${safeMsg}', type: 'warning' })`;
                } else if (isInWaitlist) {
                    btnLabel = `ESPERA (${waitlistPos})`; btnIcon = 'fa-hourglass-half'; btnColor = '#94a3b8';
                    fabAction = `window.EventsController.leaveWaitlist('${evt.id}', '${evt.type || 'americana'}')`;
                } else if (isFull && !isJoined) {
                    btnLabel = 'LISTA ESPERA'; btnIcon = 'fa-clock'; btnColor = '#eab308';
                    fabAction = `window.EventsController.joinWaitlist('${evt.id}', '${evt.type || 'americana'}')`;
                } else if (!isJoined && !isFull) {
                    btnLabel = 'APUNTARME'; btnIcon = 'fa-plus'; btnColor = '#CCFF00';
                    fabAction = `window.EventsController.joinEvent('${evt.id}', '${evt.type || 'americana'}')`;
                } else if (isJoined) {
                    btnLabel = 'DENTRO'; btnIcon = 'fa-check'; btnColor = '#fff';
                    fabAction = `window.EventsController.leaveEvent('${evt.id}', '${evt.type || 'americana'}')`;
                }

                // Comprobación de Privacidad (Americana Privada con Contraseña)
                const isEventPrivate = (evt.is_private === true || evt.is_private === 'true');
                const isEventUnlocked = this.isAmericanaUnlocked(evt);

                if (isEventPrivate && !isEventUnlocked) {
                    btnLabel = 'CLAVE ACCESO 🔒';
                    btnIcon = 'fa-key';
                    btnColor = '#ef4444';
                    cardAction = `window.EventsController.promptPrivatePassword('${evt.id}', '${evt.type || 'americana'}', 'view')`;
                    fabAction = `window.EventsController.promptPrivatePassword('${evt.id}', '${evt.type || 'americana'}', 'join')`;
                }

                card.setAttribute('onclick', cardAction);

                const fab = document.getElementById(`event-fab-${evt.id}`);
                const fabLabel = document.getElementById(`event-fab-label-${evt.id}`);
                const fabIcon = document.getElementById(`event-fab-icon-${evt.id}`);

                let ctaBg = '#CCFF00';
                let ctaTextColor = '#000000';
                let ctaShadow = '0 6px 18px rgba(204, 255, 0, 0.45)';

                if (isEventPrivate && !isEventUnlocked) {
                    ctaBg = '#ef4444';
                    ctaTextColor = '#ffffff';
                    ctaShadow = '0 6px 18px rgba(239, 68, 68, 0.45)';
                } else if (isLive) {
                    ctaBg = '#FF2D55';
                    ctaTextColor = '#ffffff';
                    ctaShadow = '0 6px 18px rgba(255, 45, 85, 0.5)';
                } else if (isCancelled) {
                    ctaBg = '#ef4444';
                    ctaTextColor = '#ffffff';
                    ctaShadow = '0 6px 18px rgba(239, 68, 68, 0.4)';
                } else if (isFinished) {
                    ctaBg = '#475569';
                    ctaTextColor = '#ffffff';
                    ctaShadow = '0 6px 18px rgba(0, 0, 0, 0.3)';
                } else if (isJoined) {
                    ctaBg = '#00E36D';
                    ctaTextColor = '#000000';
                    ctaShadow = '0 6px 18px rgba(0, 227, 109, 0.4)';
                } else if (isWaitlistPending) {
                    ctaBg = '#CCFF00';
                    ctaTextColor = '#000000';
                    ctaShadow = '0 6px 18px rgba(204, 255, 0, 0.45)';
                } else if (isInWaitlist) {
                    ctaBg = '#334155';
                    ctaTextColor = '#ffffff';
                    ctaShadow = '0 6px 18px rgba(0, 0, 0, 0.4)';
                } else if (isGenderMismatch && !isJoined) {
                    ctaBg = '#1e293b';
                    ctaTextColor = '#94a3b8';
                    ctaShadow = 'none';
                } else if (isFull && !isJoined) {
                    ctaBg = '#eab308';
                    ctaTextColor = '#000000';
                    ctaShadow = '0 6px 18px rgba(234, 179, 8, 0.4)';
                } else {
                    // !isJoined && !isFull -> 'APUNTARME'
                    ctaBg = '#CCFF00';
                    ctaTextColor = '#000000';
                    ctaShadow = '0 6px 18px rgba(204, 255, 0, 0.45)';
                }

                if (fab) {
                    const isMinCard = card.classList.contains('card-view-minimized');
                    let displayLabel = btnLabel;
                    if (isMinCard) {
                        displayLabel = isGenderMismatch && !isJoined ? btnLabel : (btnLabel === 'CLAVE ACCESO 🔒' ? 'CLAVE' : (btnLabel === 'DENTRO' ? 'DENTRO' : (isFull && !isJoined ? 'ESPERA' : 'UNIRME')));
                    }
                    if (fabLabel && fabLabel.innerText !== displayLabel) {
                        fabLabel.innerText = displayLabel;
                    }
                    fab.setAttribute('onclick', `event.stopPropagation(); ${fabAction}`);
                    fab.style.setProperty('background', ctaBg, 'important');
                    fab.style.setProperty('color', ctaTextColor, 'important');
                    fab.style.boxShadow = ctaShadow;
                    if (isGenderMismatch && !isJoined) {
                        fab.style.border = '1px solid rgba(255, 255, 255, 0.15)';
                    } else {
                        fab.style.border = 'none';
                    }
                    if (fabLabel) {
                        fabLabel.style.setProperty('color', ctaTextColor, 'important');
                        fabLabel.style.fontWeight = '950';
                    }
                    if (fabIcon) {
                        fabIcon.className = `fas ${btnIcon}`;
                        fabIcon.style.setProperty('color', ctaTextColor, 'important');
                    }
                    fab.style.animation = isLive ? 'pulse-border 2s infinite' : '';
                }

                // 2B. Update Progress Bar & Capacity State
                const progressBar = document.getElementById(`event-progress-bar-${evt.id}`);
                if (progressBar) {
                    const progress = Math.min((playerCount / maxPlayers) * 100, 100);
                    const progressColor = isFull ? '#FF3B30' : (progress > 80 ? '#eab308' : '#CCFF00');
                    progressBar.style.width = `${progress}%`;
                    progressBar.style.background = progressColor;
                    progressBar.style.boxShadow = `0 0 10px ${progressColor}55`;
                }

                const statusCapacity = document.getElementById(`event-status-capacity-${evt.id}`);
                if (statusCapacity) {
                    const statusText = isFull ? 'COMPLETO' : 'DISPONIBLE';
                    statusCapacity.innerText = statusText;
                    statusCapacity.style.color = isFull ? '#FF3B30' : (isEntreno ? '#a855f7' : '#CCFF00');
                }

                // 3. Update Status Badge
                const statusBadge = document.getElementById(`event-status-badge-${evt.id}`);
                if (statusBadge) {
                    let statusBg = '';
                    let statusColorText = '#fff';
                    let statusGlowColor = 'rgba(0,0,0,0.3)';

                    if (isLive) {
                        statusBg = 'linear-gradient(135deg, #FF2D55, #ff0844)';
                        statusGlowColor = '#FF2D5566';
                    } else if (isCancelled) {
                        statusBg = 'linear-gradient(135deg, #666, #444)';
                    } else if (isFinished) {
                        statusBg = 'linear-gradient(135deg, #555, #333)';
                    } else if (isPairing) {
                        statusBg = 'linear-gradient(135deg, #38bdf8, #0284c7)';
                        statusColorText = '#fff';
                        statusGlowColor = 'rgba(56, 189, 248, 0.4)';
                    } else {
                        if (isEntreno) {
                            statusBg = 'linear-gradient(135deg, #8b5cf6, #6366f1)';
                            statusColorText = '#fff';
                            statusGlowColor = 'rgba(139,92,246,0.4)';
                        } else {
                            statusBg = 'linear-gradient(135deg, #CCFF00, #a3e600)';
                            statusColorText = '#000';
                            statusGlowColor = '#CCFF0055';
                        }
                    }

                    const badgeText = isLive ? 'EN VIVO' : (isCancelled ? 'ANULADO' : (isPairing ? 'EMPAREJANDO' : (isFinished ? 'FINALIZADO' : 'ABIERTA')));
                    const badgeIcon = isLive ? 'fa-broadcast-tower' : (isCancelled ? 'fa-skull-crossbones' : (isFinished ? 'fa-flag-checkered' : (isPairing ? 'fa-shuffle' : 'fa-bolt')));
                    const iconAnim = isLive ? 'animation: status-dot-ping 0.8s ease-in-out infinite; text-shadow: 0 0 8px #fff;' : (!isFinished && !isCancelled ? 'animation: status-dot-ping 1.5s ease-in-out infinite; text-shadow: 0 0 6px #000;' : 'opacity: 0.6;');

                    statusBadge.style.background = statusBg;
                    statusBadge.style.color = statusColorText;
                    statusBadge.style.boxShadow = `0 6px 20px ${statusGlowColor}`;
                    statusBadge.style.animation = isLive ? 'status-shake 0.5s ease-in-out infinite alternate' : '';
                    statusBadge.innerHTML = `<i class="fas ${badgeIcon}" style="font-size: 0.75rem; ${iconAnim}"></i> ${badgeText}`;
                }

                updatedCount++;
            });

            const totalBadge = document.getElementById('events-total-badge');
            if (totalBadge && totalBadge.innerText !== String(events.length)) {
                totalBadge.innerText = String(events.length);
            }

            return updatedCount > 0 && updatedCount === events.length;
        }

        async refreshInstantly(btnEl = null, silent = false) {
            if (!this.isCurrentRouteActive()) return;
            if (this._isRefreshing) return;
            this._isRefreshing = true;

            const icon = document.getElementById('instant-refresh-icon');
            const label = document.getElementById('instant-refresh-label');
            const btn = btnEl || document.getElementById('btn-instant-refresh');

            if (!silent) {
                if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(25);
                if (icon) icon.classList.add('fa-spin');
                if (label) {
                    label.textContent = 'SYNC...';
                    label.style.color = '#72a800';
                }
                if (btn) {
                    btn.style.borderColor = '#72a800';
                    btn.style.background = '#f0fdf4';
                }
            }

            try {
                console.log("⚡ [EventsController] Sincronizando datos frescos con Firestore...");
                let snapA = null, snapE = null;
                try {
                    [snapA, snapE] = await Promise.all([
                        window.db.collection('americanas').get({ source: 'server' }),
                        window.db.collection('entrenos').get({ source: 'server' })
                    ]);
                } catch (serverErr) {
                    console.warn("⚠️ [EventsController] Fallback a get() estándar:", serverErr);
                    [snapA, snapE] = await Promise.all([
                        window.db.collection('americanas').get(),
                        window.db.collection('entrenos').get()
                    ]);
                }

                if (snapA && snapE) {
                    this.state.americanas = snapA.docs.map(d => ({ id: d.id, ...d.data() }));
                    this.state.entrenos = snapE.docs.map(d => ({ id: d.id, ...d.data() }));
                    this.state.loading = false;
                }

                const currentTab = this.state.activeTab;
                if (currentTab === 'events' || currentTab === 'entrenos') {
                    const todayStr = this.getTodayStr();
                    const events = this.getAllSortedEvents().filter(e => {
                        const isCorrectType = (currentTab === 'entrenos' ? e.type === 'entreno' : e.type === 'americana');
                        if (e.status === 'finished' || e.status === 'cancelled') return false;
                        return isCorrectType && (e.status === 'live' || e.normDate >= todayStr);
                    });

                    const totalBadge = document.getElementById('events-total-badge');
                    if (totalBadge) totalBadge.textContent = `${events.length}`;

                    const patchOk = this.smartUpdate(events);
                    if (!patchOk) {
                        this.render();
                    }
                }

                // Si el modal de inscritos está abierto para un evento, refrescarlo silenciosamente
                const inscritosModal = document.getElementById('inscritos-modal');
                if (inscritosModal && inscritosModal.style.display !== 'none' && this._currentInscritosEventId) {
                    this.showInscritosModal(this._currentInscritosEventId, this._currentInscritosType, true);
                }

                if (!silent) {
                    if (icon) {
                        icon.classList.remove('fa-spin', 'fa-arrows-rotate');
                        icon.classList.add('fa-check');
                        icon.style.color = '#16a34a';
                    }
                    if (label) {
                        label.textContent = '¡LISTO!';
                        label.style.color = '#16a34a';
                    }
                    if (btn) {
                        btn.style.borderColor = '#22c55e';
                        btn.style.background = '#dcfce7';
                    }

                    setTimeout(() => {
                        if (icon) {
                            icon.classList.remove('fa-check');
                            icon.classList.add('fa-arrows-rotate');
                            icon.style.color = '#72a800';
                        }
                        if (label) {
                            label.textContent = 'SYNC';
                            label.style.color = '#64748b';
                        }
                        if (btn) {
                            btn.style.borderColor = '#e2e8f0';
                            btn.style.background = '#f8fafc';
                        }
                    }, 1200);
                }
            } catch (err) {
                console.error("❌ [EventsController] Error en refreshInstantly:", err);
                if (!silent) {
                    if (icon) icon.classList.remove('fa-spin');
                    if (label) label.textContent = 'ERROR';
                    setTimeout(() => {
                        if (label) label.textContent = 'SYNC';
                    }, 1500);
                }
            } finally {
                this._isRefreshing = false;
            }
        }

        startAutoRefreshPolling() {
            if (this._pollingInterval) clearInterval(this._pollingInterval);

            // Polling en segundo plano cada 6.5 segundos
            this._pollingInterval = setInterval(async () => {
                if (!this.isCurrentRouteActive()) {
                    this.stopAutoRefreshPolling();
                    return;
                }
                if (!this.state.viewInitialized) return;
                if (this.state.activeTab !== 'events' && this.state.activeTab !== 'entrenos') return;
                if (document.hidden) return; // Si la app no está en pantalla, no gastar lecturas
                if (this._isRefreshing) return;

                await this.refreshInstantly(null, true);

                // Micro destello en el dot LIVE
                const dot = document.getElementById('instant-refresh-dot');
                if (dot) {
                    dot.style.transform = 'scale(1.4)';
                    setTimeout(() => { if (dot) dot.style.transform = 'scale(1)'; }, 350);
                }
            }, 6500);

            console.log("⏱️ [EventsController] Auto-refresh en segundo plano iniciado (6.5s).");
        }

        stopAutoRefreshPolling() {
            if (this._pollingInterval) {
                clearInterval(this._pollingInterval);
                this._pollingInterval = null;
                console.log("🛑 [EventsController] Auto-refresh en segundo plano detenido.");
            }
        }
    }

    window.EventsController = new EventsController();
    window.renderClubBenefitsModal = () => window.EventsController?.renderClubBenefitsModal();

    window.toggleWeatherDetails = (id) => {
        if (window.EventsController?.toggleWeatherDetails) window.EventsController.toggleWeatherDetails(id);
        else if (window.DashboardView?.toggleWeatherDetails) window.DashboardView.toggleWeatherDetails(id);
    };
    window.toggleTacticalHUD = () => {
        if (window.EventsController?.toggleTacticalHUD) window.EventsController.toggleTacticalHUD();
        else if (window.DashboardView?.toggleTacticalHUD) window.DashboardView.toggleTacticalHUD();
    };
})();
