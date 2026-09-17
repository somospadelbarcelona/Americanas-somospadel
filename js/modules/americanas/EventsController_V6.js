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
                    searchQuery: ''
                },
                eventTabs: {},
                matchCache: {} // { eventId: { matches: [], lastFetch: timestamp } }
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

            this.stopAutoRefreshPolling();

            if (window.GeoService) window.GeoService.stopTracking();
            window.removeEventListener('geo_update', this._onGeoUpdate);

            if (window.OpenMatchesController) {
                window.OpenMatchesController.destroy();
            }

            this.state.bgInitialized = false;
        }

        onDataUpdate() {
            // Check if we have received at least one update for each main collection
            if (this.state.americanas && this.state.entrenos) {
                this.state.loading = false;
                if (this.state.viewInitialized) {
                    if (this._onDataUpdateDebounce) clearTimeout(this._onDataUpdateDebounce);
                    this._onDataUpdateDebounce = setTimeout(() => {
                        this.render();
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
                        if (this.state.viewInitialized && (this.state.activeTab === 'events' || this.state.activeTab === 'entrenos')) {
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
            if (this.state.filters[type] === value) return;
            this.state.filters[type] = value;
            this.render();
        }

        getAvailableMonths(events) {
            const months = new Set();
            events.forEach(e => {
                if (!e.normDate || e.normDate === '9999-99-99') return;
                const [y, m] = e.normDate.split('-');
                months.add(`${y}-${m}`);
            });
            return Array.from(months).sort();
        }

        renderFilterBar(events) {
            const months = this.getAvailableMonths(events);
            const currentMonth = this.state.filters.month;
            const currentCat = this.state.filters.category;
            const monthLabels = { '01': 'ENE', '02': 'FEB', '03': 'MAR', '04': 'ABR', '05': 'MAY', '06': 'JUN', '07': 'JUL', '08': 'AGO', '09': 'SEP', '10': 'OCT', '11': 'NOV', '12': 'DIC' };

            const currentSearch = this.state.filters.searchQuery || '';

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

                    <!-- Month Filters -->
                    <div style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; -webkit-overflow-scrolling: touch; scrollbar-width: none;">
                        <button onclick="window.EventsController.setFilter('month', 'all')" 
                                style="white-space: nowrap; padding: 7px 16px; border-radius: 12px; font-size: 0.68rem; font-weight: 900; border: 1.5px solid ${currentMonth === 'all' ? '#CCFF00' : 'rgba(255,255,255,0.08)'}; cursor: pointer; transition: all 0.2s; 
                                ${currentMonth === 'all' ? 'background: #CCFF00; color: #000; box-shadow: 0 0 12px rgba(204,255,0,0.3);' : 'background: rgba(255,255,255,0.04); color: #94a3b8;'}">TODO</button>
                        ${months.map(m => {
                const [year, month] = m.split('-');
                const label = `${monthLabels[month]} '${year.slice(2)}`;
                const isActive = currentMonth === m;
                return `<button onclick="window.EventsController.setFilter('month', '${m}')" style="white-space: nowrap; padding: 7px 16px; border-radius: 12px; font-size: 0.68rem; font-weight: 900; border: 1.5px solid ${isActive ? '#CCFF00' : 'rgba(255,255,255,0.08)'}; cursor: pointer; transition: all 0.2s; ${isActive ? 'background: #CCFF00; color: #000; box-shadow: 0 0 12px rgba(204,255,0,0.3);' : 'background: rgba(255,255,255,0.04); color: #94a3b8;'}">${label}</button>`;
            }).join('')}
                    </div>
                    <!-- Category Filters -->
                    <div style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; -webkit-overflow-scrolling: touch; scrollbar-width: none;">
                        <button onclick="window.EventsController.setFilter('category', 'all')" style="white-space: nowrap; padding: 7px 16px; border-radius: 12px; font-size: 0.68rem; font-weight: 900; border: 1.5px solid ${currentCat === 'all' ? '#CCFF00' : 'rgba(255,255,255,0.08)'}; cursor: pointer; transition: all 0.2s; ${currentCat === 'all' ? 'background: #CCFF00; color: #000; box-shadow: 0 0 12px rgba(204,255,0,0.3);' : 'background: rgba(255,255,255,0.04); color: #94a3b8;'}">TODAS</button>
                        <button onclick="window.EventsController.setFilter('category', 'male')" style="white-space: nowrap; padding: 7px 16px; border-radius: 12px; font-size: 0.68rem; font-weight: 900; border: 1.5px solid ${currentCat === 'male' ? '#0ea5e9' : 'rgba(255,255,255,0.08)'}; cursor: pointer; transition: all 0.2s; ${currentCat === 'male' ? 'background: #0ea5e9; color: #fff; box-shadow: 0 0 12px rgba(14,165,233,0.35);' : 'background: rgba(255,255,255,0.04); color: #94a3b8;'}">MASCULINO</button>
                        <button onclick="window.EventsController.setFilter('category', 'female')" style="white-space: nowrap; padding: 7px 16px; border-radius: 12px; font-size: 0.68rem; font-weight: 900; border: 1.5px solid ${currentCat === 'female' ? '#ec4899' : 'rgba(255,255,255,0.08)'}; cursor: pointer; transition: all 0.2s; ${currentCat === 'female' ? 'background: #ec4899; color: #fff; box-shadow: 0 0 12px rgba(236,72,153,0.35);' : 'background: rgba(255,255,255,0.04); color: #94a3b8;'}">FEMENINO</button>
                        <button onclick="window.EventsController.setFilter('category', 'mixed')" style="white-space: nowrap; padding: 7px 16px; border-radius: 12px; font-size: 0.68rem; font-weight: 900; border: 1.5px solid ${currentCat === 'mixed' ? '#eab308' : 'rgba(255,255,255,0.08)'}; cursor: pointer; transition: all 0.2s; ${currentCat === 'mixed' ? 'background: #eab308; color: #000; box-shadow: 0 0 12px rgba(234,179,8,0.35);' : 'background: rgba(255,255,255,0.04); color: #94a3b8;'}">MIXTA</button>
                    </div>
                </div>
            `;
        }

        getTodayStr() {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }

        getAllSortedEvents() {
            const normalize = (d) => {
                if (!d) return '9999-99-99';
                if (d.includes('/')) {
                    const [day, month, year] = d.split('/');
                    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
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

        _parseDate(dateStr, timeStr) {
            if (!dateStr) return null;
            try {
                let dateBase = dateStr;
                if (dateStr.includes('/')) {
                    const [d, m, y] = dateStr.split('/');
                    dateBase = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
                }

                const start = timeStr ?
                    new Date(`${dateBase}T${timeStr.split('-')[0].trim()}:00`) :
                    new Date(`${dateBase}T00:00:00`);

                const end = (timeStr && timeStr.includes('-')) ?
                    new Date(`${dateBase}T${timeStr.split('-')[1].trim()}:00`) :
                    new Date(start.getTime() + 120 * 60000);

                return { start, end };
            } catch (e) {
                console.error("Error parsing date:", dateStr, timeStr, e);
                return null;
            }
        }

        hasEventStarted(dateStr, timeStr) {
            const times = this._parseDate(dateStr, timeStr);
            return times ? new Date() >= times.start : false;
        }

        getEventTimes(dateStr, timeStr) {
            return this._parseDate(dateStr, timeStr);
        }

        checkAutoStartEvents() {
            if (!this.state.americanas || !this.state.entrenos) return;
            const allEvents = [
                ...this.state.americanas.map(e => ({ ...e, type: 'americana' })),
                ...this.state.entrenos.map(e => ({ ...e, type: 'entreno' }))
            ];

            const now = new Date();

            allEvents.forEach(evt => {
                const times = this.getEventTimes(evt.date, evt.time);
                if (!times) return;

                const players = evt.players || evt.registeredPlayers || [];
                const defaultCourts = evt.name && evt.name.toUpperCase().includes('TWISTER') ? 3 : 4;
                const maxCourts = parseInt(evt.max_courts || evt.courts || defaultCourts);
                const requiredPlayers = maxCourts * 4;
                const isFull = players.length >= requiredPlayers;

                if (evt.status === 'open' && isFull) {
                    const diffMs = times.start - now;
                    const diffHours = diffMs / (1000 * 60 * 60);

                    // Changed from 4 to 3 hours as per user request
                    if (diffHours <= 3 && diffHours > 0) {
                        console.log(`⏰ [AutoAutomation] OPEN -> PAIRING (3h trigger): ${evt.name}`);
                        if (window.EventService && window.AmericanaService) {
                            window.EventService.updateEvent(evt.type, evt.id, { status: 'pairing' })
                                .then(() => window.AmericanaService.generateFirstRoundMatches(evt.id, evt.type))
                                .catch(e => console.error(e));
                        }
                    }
                }

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

                if (evt.status === 'live' && now >= times.end) {
                    console.log(`🏁 [AutoAutomation] LIVE -> FINISHED: ${evt.name}`);
                    if (window.EventService) {
                        window.EventService.updateEvent(evt.type, evt.id, { status: 'finished' })
                            .then(() => {
                                // 🤖 TRIGGER CAPTAIN ANALYSIS FOR ENTRENOS
                                if (evt.type === 'entreno' && window.CaptainView) {
                                    console.log(`🤖 [Captain] Auto-launching post-event analysis for: ${evt.name}`);
                                    setTimeout(() => {
                                        window.CaptainView.open(evt);
                                    }, 2000); // Small delay to ensure data is synced
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

            if (window.navigator && window.navigator.vibrate) {
                window.navigator.vibrate(15);
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
            const container = document.getElementById('content-area');
            if (!container) return;

            // --- ZERO-LATENCY SMART PATCHING (Audit Point 1) ---
            const currentTab = this.state.activeTab;
            if (!this.state.loading && (currentTab === 'events' || currentTab === 'entrenos')) {
                const todayStr = this.getTodayStr();
                const events = this.getAllSortedEvents().filter(e => {
                    const isCorrectType = (currentTab === 'entrenos' ? e.type === 'entreno' : e.type === 'americana');
                    if (e.status === 'finished' || e.status === 'cancelled') return false;
                    return isCorrectType && (e.status === 'live' || e.normDate >= todayStr);
                });

                // Check if we already have the grid rendered
                if (document.getElementById(`event-card-${events[0]?.id}`)) {
                    if (this.smartUpdate(events)) {
                        console.log("⚡ [EventsController] Zero-Latency Update Applied.");
                        return; // Successfully updated DOM without full re-render
                    }
                }
            }

            const isAmericanasSection = ['events', 'agenda_americanas', 'help_americanas', 'finished_americanas'].includes(this.state.activeTab);

            const tabs = isAmericanasSection ? [
                { id: 'events', label: 'AMERICANAS', icon: 'fa-trophy' },
                { id: 'agenda_americanas', label: 'AGENDA', icon: 'fa-circle' },
                { id: 'help_americanas', label: 'INFO', icon: 'fa-info-circle' },
                { id: 'finished_americanas', label: 'FINALIZADAS', icon: 'fa-history' }
            ] : [
                { id: 'entrenos', label: 'ENTRENOS', icon: 'fa-user-ninja' },
                { id: 'agenda', label: 'AGENDA', icon: 'fa-circle' },
                { id: 'help', label: 'INFO', icon: 'fa-info-circle' },
                { id: 'finished', label: 'FINALIZADOS', icon: 'fa-history' }
            ];

            const navHtml = `
                <style>
                    .events-submenu-wrapper {
                        position: sticky;
                        top: 108px;
                        z-index: 9500;
                        background: #0a0e1a;
                        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
                        display: flex;
                        align-items: center;
                        padding: 3px 6px 7px;
                        gap: 6px;
                    }
                    .events-submenu-pro-bar {
                        display: flex;
                        gap: 8px;
                        overflow-x: auto;
                        -webkit-overflow-scrolling: touch;
                        scroll-behavior: smooth;
                        overscroll-behavior-x: contain;
                        touch-action: pan-x;
                        padding: 6px 2px 8px;
                        scrollbar-width: thin;
                        scrollbar-color: #CCFF00 rgba(255, 255, 255, 0.08);
                        flex: 1;
                        cursor: grab;
                        user-select: none;
                        -webkit-user-select: none;
                    }
                    .events-submenu-pro-bar:active {
                        cursor: grabbing;
                    }
                    /* Barra de scroll visual deportiva */
                    .events-submenu-pro-bar::-webkit-scrollbar {
                        height: 5px;
                        display: block;
                    }
                    .events-submenu-pro-bar::-webkit-scrollbar-track {
                        background: rgba(255, 255, 255, 0.06);
                        border-radius: 6px;
                        margin: 0 4px;
                    }
                    .events-submenu-pro-bar::-webkit-scrollbar-thumb {
                        background: #CCFF00;
                        border-radius: 6px;
                        box-shadow: 0 0 10px rgba(204, 255, 0, 0.6);
                    }
                    .esm-nav-arrow {
                        background: rgba(15, 23, 42, 0.95);
                        border: 1px solid rgba(255, 255, 255, 0.12);
                        color: #CCFF00;
                        width: 30px;
                        height: 38px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        border-radius: 10px;
                        flex-shrink: 0;
                        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
                        z-index: 2;
                        padding: 0;
                    }
                    .esm-nav-arrow:hover {
                        background: #CCFF00;
                        color: #000;
                        transform: scale(1.08);
                    }
                    .esm-nav-arrow:active {
                        transform: scale(0.9);
                    }
                    .esm-pro-btn {
                        flex-shrink: 0;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        padding: 8px 16px;
                        border-radius: 14px;
                        font-size: 0.72rem;
                        font-weight: 900;
                        letter-spacing: 0.4px;
                        white-space: nowrap;
                        cursor: pointer;
                        transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
                        scroll-snap-align: center;
                    }
                    .esm-pro-btn:active {
                        transform: scale(0.96);
                    }
                    .esm-pro-btn.active {
                        background: #CCFF00 !important;
                        color: #000000 !important;
                        border: 1.5px solid #CCFF00 !important;
                        box-shadow: 0 4px 16px rgba(204, 255, 0, 0.38) !important;
                    }
                    .esm-pro-btn.active i {
                        color: #000000 !important;
                    }
                    .esm-pro-btn.inactive {
                        background: rgba(255, 255, 255, 0.04);
                        color: #94a3b8;
                        border: 1.5px solid rgba(255, 255, 255, 0.08);
                    }
                    .esm-pro-btn.inactive:hover {
                        background: rgba(255, 255, 255, 0.08);
                        color: #ffffff;
                    }
                    /* Estilo y contraste PRO para botones de acción de eventos y entrenos */
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
                        <i class="fas fa-chevron-left" style="font-size: 0.8rem;"></i>
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
                            <i class="fas ${tab.icon}" style="font-size: 0.85rem; color: ${isActive ? '#000' : '#64748b'};"></i>
                            <span style="text-transform: uppercase;">${tab.label}</span>
                        </button>
                    `;
                }).join('')}
                    </div>
                    <button id="esm-arrow-right" class="esm-nav-arrow" onclick="window.EventsController.scrollSubmenu('right')" title="Desplazar a la derecha" aria-label="Desplazar derecha">
                        <i class="fas fa-chevron-right" style="font-size: 0.8rem;"></i>
                    </button>
                </div>
            `;

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
                }
            }

            container.innerHTML = `<div class="fade-in">${navHtml}${contentHtml}</div>`;

            // TRIGGER ASYNC CONTENT
            this.loadGeoRadarWidget();

            // Inicializar interacciones avanzadas de scroll (drag, rueda, auto-center)
            this.initSubmenuScrollInteractions();

            // Auto-enfoque y scroll a evento si viene referenciado por Deep Link (?event=ID)
            this._checkDeepLinkEvent();
        }

        _checkDeepLinkEvent() {
            try {
                const urlParams = new URLSearchParams(window.location.search);
                const hash = window.location.hash || '';
                let targetId = urlParams.get('event') || urlParams.get('openEvent') || urlParams.get('id');

                if (!targetId && hash.includes('event=')) {
                    const match = hash.match(/event=([^&/#]+)/);
                    if (match) targetId = match[1];
                }

                if (!targetId) return;

                console.log("🔗 [EventsController] Deep Link target event detected:", targetId);

                setTimeout(() => {
                    const card = document.getElementById(`event-card-${targetId}`);
                    if (card) {
                        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        card.style.transition = 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                        card.style.boxShadow = '0 0 35px #CCFF00, 0 0 70px rgba(204, 255, 0, 0.4)';
                        card.style.borderColor = '#CCFF00';
                        card.style.transform = 'scale(1.02)';

                        if (window.navigator && window.navigator.vibrate) window.navigator.vibrate([30, 50, 30]);

                        setTimeout(() => {
                            card.style.boxShadow = '';
                            card.style.borderColor = '';
                            card.style.transform = '';
                        }, 3500);
                    } else {
                        const allEvents = this.getAllSortedEvents();
                        const targetEvt = allEvents.find(e => String(e.id) === String(targetId));
                        if (targetEvt) {
                            const isEntreno = targetEvt.type === 'entreno';
                            const targetTab = isEntreno ? 'entrenos' : 'events';
                            if (this.state.activeTab !== targetTab) {
                                console.log(`🔄 [EventsController] Conmutando a pestaña ${targetTab} para deep link...`);
                                this.setTab(targetTab);
                            }
                        }
                    }
                }, 400);
            } catch (err) {
                console.warn("⚠️ Deep link check error:", err);
            }
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
            const bar = document.getElementById('events-submenu-bar');
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

        renderEventsList(onlyMine, onlyEntrenos = false, showBothTypes = false) {
            let events = this.getAllSortedEvents();
            const { month, category } = this.state.filters;
            const uid = this.state.currentUser ? this.state.currentUser.uid : null;
            const todayStr = this.getTodayStr();

            if (!onlyMine) {
                events = events.filter(e => {
                    const isCorrectType = showBothTypes ? true : (onlyEntrenos ? e.type === 'entreno' : e.type === 'americana');

                    // Si el evento está finalizado o anulado, no va en esta pestaña
                    if (e.status === 'finished' || e.status === 'cancelled') return false;

                    if (e.status === 'live') return isCorrectType;
                    return e.normDate >= todayStr && isCorrectType;
                });
            } else if (onlyMine) {
                if (!uid) return '<div style="text-align:center; padding:40px; color:#888;">Debes iniciar sesión.</div>';
                events = events.filter(e => {
                    const players = e.players || e.registeredPlayers || [];
                    return players.some(p => p.uid === uid || p.id === uid);
                });
            }

            if (month !== 'all') events = events.filter(e => e.normDate && e.normDate.startsWith(month));
            if (category !== 'all') {
                events = events.filter(e => {
                    const cat = (e.category || '').toLowerCase();
                    if (category === 'male') return ['male', 'masculina', 'masculino', 'chicos', 'hombres'].includes(cat);
                    if (category === 'female') return ['female', 'femenina', 'femenino', 'chicas', 'mujeres'].includes(cat);
                    if (category === 'mixed') return ['mixed', 'mixta', 'mixto'].includes(cat);
                    return cat === category;
                });
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
                    return name.includes(q) || sede.includes(q) || format.includes(q) || cat.includes(q) || club.includes(q);
                });
            }

            const isAmericanasSection = this.state.activeTab === 'events';
            const organizerBannerHtml = isAmericanasSection ? `
                <div class="organizer-promo-banner" style="
                    background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%);
                    border: 1.5px solid rgba(204, 255, 0, 0.35);
                    border-radius: 20px;
                    padding: 16px 18px;
                    margin-bottom: 18px;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5), inset 0 0 20px rgba(204,255,0,0.05);
                ">
                    <!-- Glow decoration -->
                    <div style="position: absolute; top: -30px; right: -30px; width: 120px; height: 120px; background: radial-gradient(circle, rgba(204,255,0,0.2) 0%, transparent 70%); pointer-events: none;"></div>
                    
                    <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; position: relative; z-index: 2;">
                        <div style="flex: 1; min-width: 0;">
                            <div style="display: inline-flex; align-items: center; gap: 6px; background: rgba(204, 255, 0, 0.15); border: 1px solid rgba(204, 255, 0, 0.4); padding: 3px 10px; border-radius: 20px; margin-bottom: 8px;">
                                <i class="fas fa-crown" style="color: #CCFF00; font-size: 0.65rem;"></i>
                                <span style="color: #CCFF00; font-size: 0.62rem; font-weight: 950; text-transform: uppercase; letter-spacing: 0.5px;">Espacio Clubes & Organizadores</span>
                            </div>
                            <h3 style="margin: 0; color: #ffffff; font-size: 1.02rem; font-weight: 950; line-height: 1.25; letter-spacing: -0.3px;">
                                ¿Organizas Americanas en Barcelona?
                            </h3>
                            <p style="margin: 5px 0 12px; color: #cbd5e1; font-size: 0.74rem; line-height: 1.4; font-weight: 500;">
                                Publica tus torneos aquí, llena tus pistas con nuestra comunidad y gestiona con la <strong style="color: #CCFF00;">Torre de Control digital</strong> en vivo.
                            </p>
                            
                            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                                <a href="https://wa.me/34649219350?text=¡Hola%20Alex!%20Soy%20organizador/club%20de%20pádel%20y%20me%20gustaría%20publicar%20mis%20americanas%20en%20SomosPadel%20BCN." 
                                   target="_blank" 
                                   rel="noopener noreferrer" 
                                   style="background: #CCFF00; color: #000; padding: 8px 16px; border-radius: 12px; font-weight: 950; font-size: 0.75rem; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 14px rgba(204, 255, 0, 0.35); transition: transform 0.2s;"
                                   onmouseover="this.style.transform='scale(1.03)';"
                                   onmouseout="this.style.transform='scale(1)';"
                                   onmousedown="this.style.transform='scale(0.96)';">
                                    <i class="fab fa-whatsapp" style="font-size: 0.95rem;"></i> PUBLICAR MI EVENTO
                                </a>
                                <button onclick="window.EventsController.renderClubBenefitsModal()" 
                                        style="background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15); color: #ffffff; padding: 8px 14px; border-radius: 12px; font-weight: 800; font-size: 0.75rem; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: background 0.2s;"
                                        onmouseover="this.style.background='rgba(255, 255, 255, 0.15)';"
                                        onmouseout="this.style.background='rgba(255, 255, 255, 0.08)';">
                                    <i class="fas fa-info-circle" style="color: #38bdf8;"></i> VENTAJAS CLUBES
                                </button>
                            </div>
                        </div>
                        <div style="width: 44px; height: 44px; background: rgba(204,255,0,0.1); border: 1.5px solid rgba(204,255,0,0.3); border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                            <i class="fas fa-trophy" style="color: #CCFF00; font-size: 1.25rem;"></i>
                        </div>
                    </div>
                </div>
            ` : '';

            const eventsHtml = events.map(evt => this.renderCard(evt)).join('');
            const filterBarHtml = !onlyMine ? this.renderFilterBar(this.getAllSortedEvents().filter(e => e.status !== 'finished' && (e.status === 'live' || e.normDate >= todayStr))) : '';

            return `
                <div style="min-height: 80vh; padding-top: 5px;">
                    <style>
                        
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
                        .entreno-premium-card {
                            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                            cursor: pointer;
                        }
                        .entreno-premium-card:hover, .entreno-premium-card:active {
                            transform: translateY(-4px) scale(1.01) !important;
                            border-color: rgba(139, 92, 246, 0.45) !important;
                            box-shadow: 0 25px 50px rgba(0,0,0,0.85), 0 0 35px rgba(139, 92, 246, 0.25) !important;
                        }
                        .americana-premium-card {
                            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                            cursor: pointer;
                        }
                        .americana-premium-card:hover, .americana-premium-card:active {
                            transform: translateY(-4px) scale(1.01) !important;
                            border-color: rgba(204, 255, 0, 0.45) !important;
                            box-shadow: 0 25px 50px rgba(0,0,0,0.85), 0 0 35px rgba(204, 255, 0, 0.25) !important;
                        }
                        .entreno-tile-interactive {
                            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                            cursor: pointer;
                        }
                        .entreno-tile-interactive:hover, .entreno-tile-interactive:active {
                            background: rgba(255,255,255,0.15) !important;
                            transform: translateY(-2px) scale(1.02);
                            box-shadow: 0 8px 20px rgba(139,92,246,0.2), inset 0 0 15px rgba(139, 92, 246, 0.05) !important;
                            border-color: #a855f7 !important;
                            z-index: 5;
                        }
                    </style>
                    <div style="padding: 14px 16px; display: flex; justify-content: space-between; align-items: center; background: #0f172a; border-radius: 22px; margin: 12px 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.35); border: 1px solid rgba(255,255,255,0.08); position: relative; overflow: hidden; gap: 10px;">
                        <!-- Subtle accent line -->
                        <div style="position:absolute; top:0; left:0; width:100%; height:3px; background: linear-gradient(90deg, #CCFF00, #84cc16); border-radius:22px 22px 0 0;"></div>
                        <div style="display: flex; align-items: center; gap: 10px; position: relative; z-index: 1; min-width: 0; flex: 1;">
                            <!-- Botón de actualización instantánea -->
                            <button id="btn-instant-refresh" 
                                    onclick="window.EventsController.refreshInstantly(this)" 
                                    title="Actualización instantánea"
                                    aria-label="Actualizar inscripciones"
                                    style="width: 44px; height: 44px; min-width: 44px; background: rgba(255,255,255,0.04); border: 1.5px solid rgba(255,255,255,0.1); border-radius: 14px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; color: #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.3); transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); position: relative; padding: 0; flex-shrink: 0;"
                                    onmouseover="this.style.borderColor='#CCFF00'; this.style.transform='scale(1.05)';"
                                    onmouseout="this.style.borderColor='rgba(255,255,255,0.1)'; this.style.transform='scale(1)';"
                                    onmousedown="this.style.transform='scale(0.92)';">
                                <i id="instant-refresh-icon" class="fas fa-arrows-rotate" style="font-size: 1rem; color: #CCFF00; transition: transform 0.4s ease;"></i>
                                <span id="instant-refresh-label" style="font-size: 0.46rem; font-weight: 900; color: #94a3b8; letter-spacing: 0.3px; margin-top: 2px; line-height: 1;">SYNC</span>
                                <span id="instant-refresh-dot" style="position: absolute; top: -3px; right: -3px; width: 8px; height: 8px; background: #22c55e; border-radius: 50%; border: 1.5px solid #0f172a; box-shadow: 0 0 8px rgba(34, 197, 94, 0.9);"></span>
                            </button>
                            <div style="width: 44px; height: 44px; min-width: 44px; background: rgba(255,255,255,0.05); border: 1.5px solid rgba(255,255,255,0.08); border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.35rem; flex-shrink: 0;">
                                🎾
                            </div>
                            <div style="min-width: 0; overflow: hidden;">
                                <h2 style="font-size: 1.05rem; font-weight: 950; margin: 0; color: #ffffff; letter-spacing: -0.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                    ${this.state.activeTab === 'events' ? 'Americanas <span style="color: #CCFF00;">Barcelona</span>' : 'Entrenos <span style="color: #CCFF00;">SomosPadel BCN</span>'}
                                </h2>
                                <p style="color: #94a3b8; font-size: 0.62rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; margin: 2px 0 0; display: flex; align-items: center; gap: 5px;">
                                    <span>${this.state.activeTab === 'events' ? 'SomosPadel & Externas' : 'Inscripción en tiempo real'}</span>
                                    <span style="display:inline-block; width:4px; height:4px; border-radius:50%; background:#22c55e;"></span>
                                    <span style="color:#22c55e; font-size:0.58rem; font-weight:900;">EN VIVO</span>
                                </p>
                            </div>
                        </div>
                        <div style="background: rgba(255,255,255,0.05); padding: 6px 14px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.08); color: #ffffff; font-weight: 950; display:flex; align-items:center; gap:6px; font-size:0.92rem; flex-shrink:0;">
                            <span style="color:#CCFF00; font-size:0.68rem; font-weight:900;">TOTAL</span> 
                            <span id="events-total-badge">${events.length}</span>
                        </div>
                    </div>
                    ${filterBarHtml}
                    <div style="padding-bottom: 80px; padding-left:10px; padding-right:10px;">
                        ${organizerBannerHtml}
                        ${events.length === 0 ? `<div style="padding:100px 40px; text-align:center; color:#444;"><i class="fas fa-filter" style="font-size: 4rem; opacity: 0.1;"></i><h3 style="color:#666;">SIN RESULTADOS</h3></div>` : eventsHtml}
                        <div style="margin-top: 25px; display: flex; flex-direction: column; align-items: center; padding-bottom: 20px; gap: 20px;">
                            
                            <!-- GEOLOCALIZACIÓN RADAR -->
                            <div id="geo-radar-root" style="width: 100%; max-width: 500px; margin: 5px auto; animation: floatUp 0.8s ease-out forwards;">
                                <!-- Cargado vía JS -->
                            </div>

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
            const myEvents = this.getAllSortedEvents().filter(e => {
                if (typeFilter) {
                    const isType = typeFilter === 'americana' 
                        ? (e.type === 'americana' || (!e.type && !e.name?.toUpperCase().includes('ENTRENO')))
                        : (e.type === 'entreno' || e.name?.toUpperCase().includes('ENTRENO'));
                    if (!isType) return false;
                }
                if (e.status === 'finished') return false;
                if (e.normDate < todayStr && e.status !== 'live') return false;
                const players = e.players || e.registeredPlayers || [];
                return players.some(p => p.uid === uid || p.id === uid);
            });

            return `
                <div style="padding: 25px 20px; background: linear-gradient(180deg, #f8fafc 0%, #edf2f7 100%); min-height: 80vh; font-family: 'Outfit', sans-serif;">
                    <div style="margin-bottom: 30px; position: relative;">
                        <span style="background: rgba(204, 255, 0, 0.15); color: #84cc16; padding: 6px 14px; border-radius: 20px; font-size: 0.75rem; font-weight: 900; letter-spacing: 0.5px; border: 1px solid rgba(132, 204, 22, 0.2);">PRÓXIMOS RETOS</span>
                        <h2 style="font-size: 2.2rem; font-weight: 950; color: #0f172a; margin: 12px 0 5px;">Mi <span style="color: #84cc16;">Agenda</span></h2>
                        <div style="width: 50px; height: 4px; background: #CCFF00; border-radius: 10px;"></div>
                    </div>

                    ${myEvents.length === 0 ? `
                        <div style="text-align:center; padding: 80px 30px; background: white; border-radius: 32px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.03);">
                            <div style="width: 80px; height: 80px; background: #f1f5f9; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 25px;">
                                <i class="fas fa-calendar-times" style="font-size: 2rem; color: #cbd5e1;"></i>
                            </div>
                            <h3 style="color: #1e293b; font-weight: 900; font-size: 1.4rem; margin-bottom: 10px;">SIN PLANES</h3>
                            <p style="color: #64748b; font-size: 0.9rem; margin-bottom: 30px;">¡No te quedes fuera! Apúntate a un evento y empieza a sumar puntos.</p>
                            <button onclick="window.EventsController.setTab('events')" style="background: #0f172a; color: white; border: none; padding: 16px 32px; border-radius: 18px; font-weight: 800; cursor: pointer; transition: transform 0.2s;">BUSCAR AMERICANAS</button>
                        </div>
                    ` : `
                        <div style="padding-bottom: 120px; display: flex; flex-direction: column; gap: 0px; position: relative;">
                            <!-- Vertical Line -->
                            <div style="position: absolute; left: 30px; top: 10px; bottom: 40px; width: 2px; background: linear-gradient(to bottom, #CCFF00, #e2e8f0); z-index: 1;"></div>
                            
                            ${myEvents.map((evt, idx) => {
                const times = this._parseDate(evt.date);
                const d = times ? times.start : new Date();
                const isLive = evt.status === 'live';

                return `
                                <div style="display: flex; gap: 20px; margin-bottom: 30px; position: relative; z-index: 2;">
                                    <div style="min-width: 62px; height: 62px; background: ${isLive ? '#CCFF00' : 'white'}; border: 3px solid ${isLive ? '#CCFF00' : '#e2e8f0'}; border-radius: 18px; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 8px 15px rgba(0,0,0,0.08); transition: transform 0.3s ease;">
                                        <span style="font-size: 0.65rem; font-weight: 900; color: ${isLive ? '#000' : '#94a3b8'};">${d.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase()}</span>
                                        <span style="font-size: 1.4rem; font-weight: 950; color: ${isLive ? '#000' : '#0f172a'}; line-height: 1;">${d.getDate()}</span>
                                    </div>
                                    <div style="flex: 1; background: white; border-radius: 26px; padding: 22px; border: 1px solid ${isLive ? '#CCFF00' : '#e2e8f0'}; box-shadow: 0 10px 25px rgba(0,0,0,0.03); position: relative; overflow: hidden;">
                                        ${isLive ? `<div style="position: absolute; top: 0; right: 0; background: #FF2D55; color: white; padding: 4px 12px; font-size: 0.6rem; font-weight: 900; border-bottom-left-radius: 12px; animation: pulse 2s infinite;">LIVE NOW</div>` : ''}
                                        
                                        <div style="font-size: 0.65rem; font-weight: 800; color: #84cc16; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px;">${evt.type === 'entreno' ? 'Entreno Pro' : 'Americana'}</div>
                                        <h3 style="margin: 0; font-size: 1.15rem; color: #0f172a; font-weight: 900; line-height: 1.2;">${evt.name}</h3>
                                        
                                        <div style="display: flex; gap: 15px; margin: 15px 0 20px; color: #64748b; font-size: 0.8rem; font-weight: 600;">
                                            <span><i class="far fa-clock" style="color: #CCFF00; margin-right: 5px;"></i> ${evt.time}</span>
                                            <span><i class="fas fa-map-marker-alt" style="color: #64748b; margin-right: 5px;"></i> SomosPadel BCN</span>
                                        </div>
                                        
                                        <button onclick="window.EventsController.openLiveEvent('${evt.id}', '${evt.type || 'americana'}');" 
                                                style="width: 100%; padding: 14px; background: ${isLive ? '#CCFF00' : '#0f172a'}; color: ${isLive ? '#000' : '#fff'}; border: none; border-radius: 16px; font-weight: 900; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: all 0.2s; box-shadow: ${isLive ? '0 5px 15px rgba(204,255,0,0.3)' : 'none'};">
                                            ${isLive ? '<i class="fas fa-play"></i> ENTRAR EN PISTA' : 'GESTIONAR MI PLAZA'}
                                        </button>
                                    </div>
                                </div>`;
            }).join('')}
                            <!-- GEOLOCALIZACIÓN RADAR -->
                            <div id="geo-radar-root" style="width: 100%; max-width: 500px; margin: 20px auto 100px; animation: floatUp 0.8s ease-out forwards;">
                                <!-- Cargado vía JS -->
                            </div>
                        </div>
                    `}
                </div>
            `;
        }

        renderFinishedView(typeFilter = null) {
            const todayStr = this.getTodayStr();
            const { month, category } = this.state.filters;
            const isAmericana = typeFilter === 'americana';
            
            // ✅ Logic: Archive includes explicitly finished/cancelled events OR events that have passed the today marker
            let finishedEvents = this.getAllSortedEvents().filter(e => {
                if (typeFilter) {
                    const isType = isAmericana 
                        ? (e.type === 'americana' || (!e.type && !e.name?.toUpperCase().includes('ENTRENO')))
                        : (e.type === 'entreno' || e.name?.toUpperCase().includes('ENTRENO'));
                    if (!isType) return false;
                }
                const isPast = e.normDate && e.normDate < todayStr && e.normDate !== '9999-99-99';
                const isExplicitlyFinished = e.status === 'finished' || e.status === 'cancelled';
                return isExplicitlyFinished || isPast;
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
            const monthsRaw = this.getAvailableMonths(this.getAllSortedEvents().filter(e => e.status === 'finished' || e.status === 'cancelled' || (e.normDate && e.normDate < todayStr)));
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
            const hasStarted = this.hasEventStarted(evt.date, evt.time);
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

            // Category & Format Logic
            const catMap = { 'male': 'MASCULINO', 'female': 'FEMENINO', 'mixed': 'MIXTO', 'open': 'OPEN' };
            const categoryLabel = catMap[evt.category] || (evt.category || 'MASCULINO').toUpperCase();

            let categoryIcon = 'fa-mars', categoryColor = '#38bdf8';
            if (evt.category === 'female') { categoryIcon = 'fa-venus'; categoryColor = '#ea4c89'; }
            else if (evt.category === 'mixed') { categoryIcon = 'fa-venus-mars'; categoryColor = '#eab308'; }
            else if (evt.category === 'open') { categoryIcon = 'fa-globe'; categoryColor = '#84cc16'; }

            const mode = (evt.pair_mode || evt.format || '').toLowerCase();
            const nameUpper = (evt.name || '').toUpperCase();
            let isTwister = nameUpper.includes('TWISTER') || mode.includes('twister') || mode.includes('rotating') || mode.includes('rotativo');
            let isFixed = mode === 'fixed' || nameUpper.includes('FIJA');

            let formatLabel = 'PAREJA FIJA', formatColor = '#a855f7';
            if (isTwister) { formatLabel = 'TWISTER'; formatColor = '#38bdf8'; }

            // Time Formatting
            const times = this._parseDate(evt.date, evt.time);
            let timeLabel = evt.time;
            if (times && !evt.time.includes('-')) {
                const pad = n => n.toString().padStart(2, '0');
                timeLabel = `${pad(times.start.getHours())}:${pad(times.start.getMinutes())} - ${pad(times.end.getHours())}:${pad(times.end.getMinutes())}`;
            }

            // Gender Check (Robust normalization with Admin Bypass)
            const userGender = user ? (user.gender || '').toLowerCase() : '';
            const isChico = ['m', 'chico', 'male', 'masculino', 'hombre'].includes(userGender);
            const isChica = ['f', 'chica', 'female', 'femenina', 'femenino', 'mujer'].includes(userGender);
            const cat = (evt.category || 'open').toLowerCase();
            let isGenderMismatch = false, mismatchCase = '';

            const isEventMale = ['male', 'masculina', 'masculino', 'chicos', 'hombres'].includes(cat);
            const isEventFemale = ['female', 'femenina', 'femenino', 'chicas', 'mujeres'].includes(cat);

            const isAdmin = user && (user.role === 'admin' || user.role === 'super_admin' || user.role === 'admin_player');
            if (isEventMale && !isChico && !isAdmin) { isGenderMismatch = true; mismatchCase = 'male'; }
            if (isEventFemale && !isChica && !isAdmin) { isGenderMismatch = true; mismatchCase = 'female'; }

            // Button Logic
            let cardAction = `window.EventsController.openLiveEvent('${evt.id}', '${evt.type || 'americana'}')`;
            let fabAction = cardAction, btnLabel = 'ENTRAR', btnIcon = 'fa-play', btnColor = '#CCFF00';

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
            } else if (isGenderMismatch && !isJoined) {
                btnLabel = mismatchCase === 'male' ? 'SOLO CHICOS' : 'SOLO CHICAS'; btnIcon = 'fa-lock'; btnColor = '#4b5563';
                fabAction = `window.PremiumModal.alert({ title: '⚠️ RESTRICCIÓN', message: 'Género no válido.' })`;
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

            // Calculate progress for plazas bar
            const progress = Math.min((playerCount / maxPlayers) * 100, 100);
            const progressColor = isFull ? '#FF3B30' : (progress > 80 ? '#eab308' : '#CCFF00');

            // 🌈 BROADCAST V7: HYPER-COMPACT & ULTRA-COLORFUL (MATTE AESTHETIC)
            const themeColor = isLive ? '#FF2D55' : (isCancelled ? '#ef4444' : (isEntreno ? '#8b5cf6' : categoryColor));
            
            // Estilos específicos para entrenos y americanas
            const cardBg = isEntreno ? 'linear-gradient(145deg, #18112b 0%, #0c0914 100%)' : 'linear-gradient(145deg, #181c24 0%, #11141a 100%)';
            const cardBorder = isEntreno ? '1px solid rgba(139, 92, 246, 0.15)' : '1px solid rgba(204, 255, 0, 0.12)';
            const cardGlow = isEntreno ? '0 20px 40px rgba(0,0,0,0.8), 0 0 25px rgba(139, 92, 246, 0.1)' : '0 20px 40px rgba(0,0,0,0.6), 0 0 20px rgba(204, 255, 0, 0.05)';
            const tileClass = isEntreno ? 'entreno-tile-interactive' : 'premium-tile-interactive';
            const cardClass = isEntreno ? 'entreno-premium-card' : 'americana-premium-card';
            
            // Iconos y colores por tipo
            const timeIconBg = isEntreno ? 'rgba(139, 92, 246, 0.15)' : 'rgba(204, 255, 0, 0.12)';
            const timeIconColor = isEntreno ? '#a855f7' : '#CCFF00';
            const capacityIconColor = isEntreno ? '#06b6d4' : '#FF2D55';
            const locIconBg = isEntreno ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255, 45, 85, 0.15)';
            const locIconColor = isEntreno ? '#8b5cf6' : '#FF2D55';

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
                levelBadgeHtml = `<span style="background: rgba(255,255,255,0.08); color: #fff; padding: 4px 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); font-size: 0.6rem; font-weight: 700; backdrop-filter: blur(4px); display: inline-flex; align-items: center; gap: 4px;"><i class="fas fa-graduation-cap"></i> NIVEL ${rawEventLevel}</span>`;
                
                const userLevelVal = user ? (user.level || user.self_rate_level) : null;
                if (userLevelVal) {
                    const userLvl = parseFloat(userLevelVal);
                    const minLvl = evt.level_min ? parseFloat(evt.level_min) : null;
                    const maxLvl = evt.level_max ? parseFloat(evt.level_max) : null;
                    const singleLvl = parseFloat(rawEventLevel);

                    if (minLvl !== null && maxLvl !== null && !isNaN(minLvl) && !isNaN(maxLvl)) {
                        if (userLvl >= minLvl - 0.25 && userLvl <= maxLvl + 0.25) {
                            levelFeedbackHtml = `<span style="background: linear-gradient(135deg, rgba(234, 179, 8, 0.3) 0%, rgba(202, 138, 4, 0.2) 100%); color: #facc15; border: 1.5px solid rgba(250, 204, 21, 0.5); padding: 4px 10px; border-radius: 8px; font-size: 0.62rem; font-weight: 950; backdrop-filter: blur(4px); display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 4px 14px rgba(234, 179, 8, 0.3); animation: pulse 2.2s infinite;"><i class="fas fa-star" style="color: #facc15;"></i> ¡IDEAL PARA TI!</span>`;
                        } else if (userLvl > maxLvl + 0.25) {
                            levelFeedbackHtml = `<span style="background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); padding: 4px 10px; border-radius: 8px; font-size: 0.6rem; font-weight: 900; backdrop-filter: blur(4px); display: inline-flex; align-items: center; gap: 4px;"><i class="fas fa-angle-double-up"></i> NIVEL CÓMODO</span>`;
                        } else {
                            levelFeedbackHtml = `<span style="background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); padding: 4px 10px; border-radius: 8px; font-size: 0.6rem; font-weight: 900; backdrop-filter: blur(4px); display: inline-flex; align-items: center; gap: 4px;"><i class="fas fa-exclamation-triangle"></i> EXIGENTE</span>`;
                        }
                    } else if (!isNaN(singleLvl)) {
                        const diff = Math.abs(userLvl - singleLvl);
                        if (diff <= 0.35) {
                            levelFeedbackHtml = `<span style="background: linear-gradient(135deg, rgba(234, 179, 8, 0.3) 0%, rgba(202, 138, 4, 0.2) 100%); color: #facc15; border: 1.5px solid rgba(250, 204, 21, 0.5); padding: 4px 10px; border-radius: 8px; font-size: 0.62rem; font-weight: 950; backdrop-filter: blur(4px); display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 4px 14px rgba(234, 179, 8, 0.3); animation: pulse 2.2s infinite;"><i class="fas fa-star" style="color: #facc15;"></i> ¡IDEAL PARA TI!</span>`;
                        } else if (userLvl > singleLvl) {
                            levelFeedbackHtml = `<span style="background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); padding: 4px 10px; border-radius: 8px; font-size: 0.6rem; font-weight: 900; backdrop-filter: blur(4px); display: inline-flex; align-items: center; gap: 4px;"><i class="fas fa-angle-double-up"></i> NIVEL CÓMODO</span>`;
                        } else {
                            levelFeedbackHtml = `<span style="background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); padding: 4px 10px; border-radius: 8px; font-size: 0.6rem; font-weight: 900; backdrop-filter: blur(4px); display: inline-flex; align-items: center; gap: 4px;"><i class="fas fa-exclamation-triangle"></i> EXIGENTE</span>`;
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
                    return `<img src="${photo}" alt="Jugador" style="width:22px; height:22px; border-radius:50%; border:2px solid #141414; margin-left:${idx === 0 ? '0' : '-8px'}; object-fit:cover; display:inline-block; vertical-align:middle; box-shadow:0 2px 5px rgba(0,0,0,0.5);">`;
                }
                return `<span style="width:22px; height:22px; border-radius:50%; border:2px solid #141414; margin-left:${idx === 0 ? '0' : '-8px'}; background:#1e293b; color:#CCFF00; font-size:0.55rem; font-weight:950; display:inline-flex; align-items:center; justify-content:center; vertical-align:middle; box-shadow:0 2px 5px rgba(0,0,0,0.5);">${initial}</span>`;
            }).join('');
            const avatarStackHtml = playersList.length > 0 ? `<div style="display:inline-flex; align-items:center; margin-right:6px;">${previewAvatars}</div>` : '';

            // Indicador de urgencia si quedan 2 o menos plazas
            const remainingSpots = maxPlayers - playerCount;
            let urgencyHtml = '';
            if (!isFull && remainingSpots <= 2 && remainingSpots > 0) {
                urgencyHtml = `<span style="background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); padding: 2px 8px; border-radius: 6px; font-size: 0.58rem; font-weight: 950; letter-spacing: 0.5px; animation: pulse 1.5s infinite;">¡ÚLTIMAS ${remainingSpots}!</span>`;
            }

            return `
                <div id="event-card-${evt.id}" class="${cardClass}" onclick="${cardAction}" style="
                    background: ${cardBg};
                    border-radius: 24px;
                    overflow: hidden;
                    margin-bottom: 14px;
                    border: ${cardBorder};
                    box-shadow: ${cardGlow};
                    font-family: 'Outfit', sans-serif;
                    position: relative;
                    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s ease;
                ">
                    <!-- ACCENT STRIPE -->
                    <div style="height: 4px; background: ${themeColor}; opacity: 0.95;"></div>

                    <div style="display: flex; flex-direction: column;">
                        
                        <!-- IMAGE AREA -->
                        <div onclick="event.stopPropagation(); window.EventsController.openPosterModal('${(evt.image_url || 'img/padel-event.jpg').replace(/'/g, "\\'")}', '${(evt.name || '').replace(/'/g, "\\'")}', '${(evt.sede || evt.location || '').replace(/'/g, "\\'")}')" 
                             title="Toca para ver el Cartel Oficial"
                             style="height: 125px; background: url('${(evt.image_url || 'img/padel-event.jpg').replace(/ /g, '%20')}') no-repeat center/cover; position: relative; cursor: pointer;">
                            <div style="position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(10,14,26,0.3) 0%, rgba(10,14,26,0.85) 75%, ${isEntreno ? '#0c0914' : '#141414'} 100%);"></div>
                            
                            <!-- FLOATING BADGES -->
                            <div style="position: absolute; top: 12px; left: 12px; display: flex; align-items: center; gap: 8px;">
                                <div style="background: rgba(15, 23, 42, 0.85); width: 50px; height: 52px; border-radius: 14px; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.12); backdrop-filter: blur(12px); box-shadow: 0 4px 15px rgba(0,0,0,0.4);">
                                    <span style="font-size: 0.55rem; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">${dayName}</span>
                                    <span style="font-size: 1.35rem; font-weight: 950; color: #fff; line-height: 1;">${dayNum}</span>
                                </div>
                                ${evt.normDate === this.getTodayStr() ? `
                                    <span style="background: linear-gradient(135deg, #f59e0b, #d97706); color: #000; padding: 5px 10px; border-radius: 10px; font-size: 0.65rem; font-weight: 950; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4); animation: pulse 1.8s infinite;">
                                        <i class="fas fa-fire"></i> ¡HOY!
                                    </span>
                                ` : ''}
                            </div>

                            <div style="position: absolute; top: 12px; right: 12px; display: flex; align-items: center; gap: 6px; z-index: 10;">
                                <!-- Botón Cartel Oficial -->
                                <button onclick="event.stopPropagation(); window.EventsController.openPosterModal('${(evt.image_url || 'img/padel-event.jpg').replace(/'/g, "\\'")}', '${(evt.name || '').replace(/'/g, "\\'")}', '${(evt.sede || evt.location || '').replace(/'/g, "\\'")}')" 
                                        title="Ver Cartel Oficial" 
                                        aria-label="Ver cartel del evento"
                                        style="
                                            background: rgba(15, 23, 42, 0.88);
                                            height: 38px;
                                            padding: 0 12px;
                                            border-radius: 12px;
                                            border: 1.5px solid rgba(204, 255, 0, 0.5);
                                            color: #CCFF00;
                                            display: flex;
                                            align-items: center;
                                            gap: 6px;
                                            cursor: pointer;
                                            backdrop-filter: blur(12px);
                                            box-shadow: 0 4px 15px rgba(0,0,0,0.4), 0 0 12px rgba(204,255,0,0.18);
                                            font-size: 0.72rem;
                                            font-weight: 950;
                                            letter-spacing: 0.6px;
                                            transition: transform 0.2s, box-shadow 0.2s;
                                        "
                                        onmouseover="this.style.transform='scale(1.06)';"
                                        onmouseout="this.style.transform='scale(1)';"
                                        onmousedown="this.style.transform='scale(0.94)';">
                                    <i class="fas fa-image" style="font-size: 0.85rem; color: #CCFF00;"></i>
                                    <span>CARTEL</span>
                                </button>

                                <!-- Botón Compartir WhatsApp Pro -->
                                <button onclick="event.stopPropagation(); window.EventsController.shareEvent('${evt.id}', '${evt.type || 'americana'}')" 
                                        title="Compartir por WhatsApp" 
                                        aria-label="Compartir evento"
                                        style="background: rgba(15, 23, 42, 0.85); width: 38px; height: 38px; border-radius: 12px; border: 1px solid rgba(34, 197, 94, 0.3); color: #22c55e; display: flex; align-items: center; justify-content: center; cursor: pointer; backdrop-filter: blur(12px); box-shadow: 0 4px 15px rgba(0,0,0,0.4); transition: transform 0.2s;"
                                        onmouseover="this.style.transform='scale(1.08)';"
                                        onmouseout="this.style.transform='scale(1)';"
                                        onmousedown="this.style.transform='scale(0.92)';">
                                    <i class="fab fa-whatsapp" style="font-size: 1.15rem;"></i>
                                </button>
                                
                                <!-- Dual Price Badge: Socio & No Socio -->
                                <div style="background: rgba(15, 23, 42, 0.88); border-radius: 12px; padding: 5px 9px; border: 1px solid rgba(255,255,255,0.14); color: #fff; display: flex; align-items: center; gap: 7px; backdrop-filter: blur(12px); box-shadow: 0 4px 15px rgba(0,0,0,0.4); flex-shrink: 0;">
                                    <div style="display: flex; flex-direction: column; align-items: center; line-height: 1;">
                                        <span style="font-size: 0.48rem; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.4px;">SOCIO</span>
                                        <span style="font-size: 0.82rem; font-weight: 950; color: #CCFF00; margin-top: 2px;">${numSoc}€</span>
                                    </div>
                                    <div style="width: 1px; height: 18px; background: rgba(255,255,255,0.18);"></div>
                                    <div style="display: flex; flex-direction: column; align-items: center; line-height: 1;">
                                        <span style="font-size: 0.48rem; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.4px;">NO SOCIO</span>
                                        <span style="font-size: 0.82rem; font-weight: 950; color: #ffffff; margin-top: 2px;">${numExt}€</span>
                                    </div>
                                </div>
                            </div>

                            <div style="position: absolute; bottom: 12px; left: 12px; right: 12px; display: flex; flex-wrap: wrap; align-items: center; gap: 6px; z-index: 5;">
                                ${isEntreno ? `
                                    <span style="background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%); color: #fff; padding: 4px 10px; border-radius: 8px; font-size: 0.6rem; font-weight: 950; text-transform: uppercase; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.45); display: inline-flex; align-items: center; gap: 4px;"><i class="fas fa-user-ninja"></i> ENTRENO</span>
                                    ${isTwister ? 
                                        `<span style="background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%); color: #fff; padding: 4px 10px; border-radius: 8px; font-size: 0.6rem; font-weight: 950; text-transform: uppercase; box-shadow: 0 4px 10px rgba(6, 182, 212, 0.3); display: inline-flex; align-items: center; gap: 4px;"><i class="fas fa-wind"></i> TWISTER</span>` :
                                        `<span style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: #fff; padding: 4px 10px; border-radius: 8px; font-size: 0.6rem; font-weight: 950; text-transform: uppercase; box-shadow: 0 4px 10px rgba(236, 72, 153, 0.3); display: inline-flex; align-items: center; gap: 4px;"><i class="fas fa-lock"></i> PAREJA FIJA</span>`
                                    }
                                    ${levelBadgeHtml}
                                    ${levelFeedbackHtml}
                                ` : `
                                    ${isTwister ? 
                                        `<span style="background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%); color: #fff; padding: 4px 10px; border-radius: 8px; font-size: 0.6rem; font-weight: 950; text-transform: uppercase; box-shadow: 0 4px 10px rgba(6, 182, 212, 0.3); display: inline-flex; align-items: center; gap: 4px;"><i class="fas fa-wind"></i> TWISTER</span>` :
                                        `<span style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: #fff; padding: 4px 10px; border-radius: 8px; font-size: 0.6rem; font-weight: 950; text-transform: uppercase; box-shadow: 0 4px 10px rgba(236, 72, 153, 0.3); display: inline-flex; align-items: center; gap: 4px;"><i class="fas fa-lock"></i> PAREJA FIJA</span>`
                                    }
                                    <span style="background: rgba(255,255,255,0.08); color: #fff; padding: 4px 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06); font-size: 0.6rem; font-weight: 800; backdrop-filter: blur(6px);">${maxCourts} PISTAS</span>
                                    ${levelBadgeHtml}
                                    ${levelFeedbackHtml}
                                    ${(evt.is_external || evt.external || evt.organizer_type === 'external' || evt.origin === 'external') ? `
                                        <span style="background: linear-gradient(135deg, #0284c7, #2563eb); color: #fff; padding: 4px 10px; border-radius: 8px; font-size: 0.6rem; font-weight: 950; text-transform: uppercase; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 2px 8px rgba(14, 165, 233, 0.35); border: 1px solid rgba(255,255,255,0.18);"><i class="fas fa-building-columns"></i> ${evt.club || evt.organizer || 'CLUB ASOCIADO'}</span>
                                        <span style="background: rgba(14, 165, 233, 0.18); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.35); padding: 4px 8px; border-radius: 8px; font-size: 0.58rem; font-weight: 900; display: inline-flex; align-items: center; gap: 3px;"><i class="fas fa-check-circle"></i> VERIFICADO</span>
                                    ` : `
                                        <span style="background: rgba(204,255,0,0.12); color: #CCFF00; border: 1px solid rgba(204,255,0,0.35); padding: 4px 10px; border-radius: 8px; font-size: 0.6rem; font-weight: 950; text-transform: uppercase; display: inline-flex; align-items: center; gap: 4px;"><i class="fas fa-certificate"></i> SOMOSPADEL BCN</span>
                                    `}
                                `}
                            </div>
                        </div>

                        <!-- CONTENT AREA -->
                        <div style="padding: 16px 16px 14px;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; gap: 8px;">
                                <h3 style="margin: 0; font-size: 1.22rem; font-weight: 950; color: #fff; line-height: 1.15; letter-spacing: -0.4px; text-transform: uppercase; flex: 1;">${evt.name}</h3>
                                ${evt.description && evt.description.trim() ? `
                                    <button onclick="event.stopPropagation(); window.EventsController.openDescriptionModal('${evt.id}', '${evt.type || 'americana'}')"
                                            title="Ver descripción y notas para jugadores"
                                            aria-label="Ver descripción"
                                            style="
                                                background: rgba(56, 189, 248, 0.12);
                                                border: 1.5px solid rgba(56, 189, 248, 0.4);
                                                color: #38bdf8;
                                                padding: 6px 12px;
                                                border-radius: 12px;
                                                font-size: 0.72rem;
                                                font-weight: 950;
                                                display: inline-flex;
                                                align-items: center;
                                                gap: 6px;
                                                cursor: pointer;
                                                flex-shrink: 0;
                                                box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                                                transition: transform 0.2s, background 0.2s;
                                            "
                                            onmouseover="this.style.transform='scale(1.05)'; this.style.background='rgba(56, 189, 248, 0.2)';"
                                            onmouseout="this.style.transform='scale(1)'; this.style.background='rgba(56, 189, 248, 0.12)';"
                                            onmousedown="this.style.transform='scale(0.95)';">
                                        <i class="fas fa-info-circle" style="font-size: 0.82rem; color: #38bdf8;"></i>
                                        <span>INFO</span>
                                    </button>
                                ` : ''}
                            </div>

                            ${evt.description && evt.description.trim() ? `
                                <div onclick="event.stopPropagation(); window.EventsController.openDescriptionModal('${evt.id}', '${evt.type || 'americana'}')" 
                                     title="Toca para leer el aviso completo"
                                     style="
                                        background: linear-gradient(135deg, rgba(56, 189, 248, 0.1) 0%, rgba(37, 99, 235, 0.06) 100%);
                                        border: 1px solid rgba(56, 189, 248, 0.25);
                                        border-left: 3.5px solid #38bdf8;
                                        border-radius: 12px;
                                        padding: 8px 12px;
                                        margin-bottom: 12px;
                                        cursor: pointer;
                                        display: flex;
                                        align-items: center;
                                        justify-content: space-between;
                                        gap: 8px;
                                        transition: transform 0.15s, background 0.15s;
                                     "
                                     onmouseover="this.style.background='rgba(56, 189, 248, 0.16)';"
                                     onmouseout="this.style.background='linear-gradient(135deg, rgba(56, 189, 248, 0.1) 0%, rgba(37, 99, 235, 0.06) 100%)';">
                                    <div style="display: flex; align-items: center; gap: 8px; overflow: hidden; min-width: 0;">
                                        <i class="fas fa-bullhorn" style="color: #38bdf8; font-size: 0.85rem; flex-shrink: 0;"></i>
                                        <span style="font-size: 0.74rem; color: #f1f5f9; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                            ${evt.description.replace(/\n/g, ' ')}
                                        </span>
                                    </div>
                                    <span style="font-size: 0.62rem; font-weight: 950; color: #38bdf8; text-transform: uppercase; white-space: nowrap; flex-shrink: 0; display: inline-flex; align-items: center; gap: 3px;">
                                        LEER <i class="fas fa-chevron-right" style="font-size: 0.6rem;"></i>
                                    </span>
                                </div>
                            ` : ''}
                            
                            <!-- 💎 2 ESSENTIAL PILLS -->
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                                <!-- Time Tile -->
                                <div class="${tileClass}" style="background: rgba(255,255,255,0.06); border-radius: 14px; padding: 8px 10px; display: flex; align-items: center; gap: 8px; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                                    <div style="width: 26px; height: 26px; background: ${timeIconBg}; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                        <i class="far fa-clock" style="color: ${timeIconColor}; font-size: 0.8rem;"></i>
                                    </div>
                                    <span style="font-weight: 900; font-size: 0.82rem; color: #eee; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${timeLabel}</span>
                                </div>
                                <!-- Category Tile -->
                                <div class="${tileClass}" style="background: rgba(255,255,255,0.06); border-radius: 14px; padding: 8px 10px; display: flex; align-items: center; gap: 8px; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                                    <div style="width: 26px; height: 26px; background: ${categoryColor}25; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                        <i class="fas ${categoryIcon}" style="color: ${categoryColor}; font-size: 0.8rem;"></i>
                                    </div>
                                    <span style="font-weight: 900; font-size: 0.82rem; color: #eee; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${categoryLabel}</span>
                                </div>
                            </div>

                            <!-- CAPACITY & BUBBLE STACK (INTERACTIVE) -->
                            <div class="${tileClass}" onclick="event.stopPropagation(); window.EventsController.showInscritosModal('${evt.id}', '${evt.type || 'americana'}')" style="background: rgba(255,255,255,0.06); border-radius: 16px; padding: 10px 12px; border: 1px solid rgba(255,255,255,0.08); cursor: pointer; position: relative; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.2); margin-bottom: 10px;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; position: relative;">
                                    <div style="display: flex; align-items: center; gap: 6px;">
                                        ${avatarStackHtml}
                                        <i id="event-players-icon-${evt.id}" class="fas fa-users" style="color: ${capacityIconColor}; font-size: 0.85rem; margin-left: 2px;"></i>
                                        <span id="event-players-label-${evt.id}" style="font-weight: 950; font-size: 0.9rem; color: #fff;">${playerCount} / ${maxPlayers} Plazas</span>
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 6px;">
                                        ${urgencyHtml}
                                        <span id="event-status-capacity-${evt.id}" style="font-size: 0.65rem; font-weight: 950; color: ${isFull ? '#FF3B30' : (isEntreno ? '#a855f7' : '#CCFF00')}; text-transform: uppercase; letter-spacing: 0.5px;">${isFull ? 'COMPLETO' : 'DISPONIBLE'}</span>
                                    </div>
                                </div>
                                <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.06); border-radius: 10px; overflow: hidden;">
                                    <div id="event-progress-bar-${evt.id}" style="width: ${progress}%; height: 100%; background: ${progressColor}; box-shadow: 0 0 10px ${progressColor}55; transition: width 0.3s ease;"></div>
                                </div>
                                <div id="event-waitlist-label-${evt.id}">
                                    ${waitlist.length > 0 ? `<div style="margin-top: 5px; font-size: 0.65rem; font-weight: 900; color: #eab308; text-transform: uppercase;">+${waitlist.length} EN ESPERA</div>` : ''}
                                </div>
                            </div>

                            <!-- 📍 LOCATION & UNIFIED PRIMARY ACTION CTA -->
                            <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 2px; gap: 8px;">
                                <!-- Sede Oficial Box con GPS / Indicaciones directas -->
                                <div class="${tileClass}" onclick="event.stopPropagation(); window.EventsController.openDirections('${(evt.sede || evt.location || 'Barcelona Pádel el Prat').replace(/'/g, "\\'")}')" 
                                     title="Navegar por GPS al club (Google Maps / Apple Maps)"
                                     style="display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.06); padding: 8px 10px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.08); flex: 1; min-width: 0; cursor: pointer;"
                                     onmouseover="this.style.borderColor='#38bdf8';"
                                     onmouseout="this.style.borderColor='rgba(255,255,255,0.08)';">
                                    <div style="width: 28px; height: 28px; background: ${locIconBg}; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                        <i class="fas fa-location-arrow" style="color: ${locIconColor}; font-size: 0.85rem;"></i>
                                    </div>
                                    <div style="display: flex; flex-direction: column; min-width: 0;">
                                        <div style="display: flex; align-items: center; gap: 4px;">
                                            <span style="font-size: 0.52rem; font-weight: 800; color: #888; text-transform: uppercase; letter-spacing: 0.5px;">${(evt.is_external || evt.external || evt.organizer_type === 'external' || evt.origin === 'external') ? 'Club Organizador' : 'Sede Oficial'}</span>
                                            <span style="font-size: 0.52rem; font-weight: 950; color: #38bdf8; text-transform: uppercase;">GPS ↗</span>
                                        </div>
                                        <span style="font-size: 0.82rem; font-weight: 950; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${evt.sede || evt.location || 'Bcn Pádel'}</span>
                                    </div>
                                </div>

                                <!-- ⚡ PRIMARY PRO ACTION BUTTON (Unifies FAB & Status Badge) -->
                                <div style="position: relative; flex-shrink: 0;">
                                    ${isLive ? `<div style="position: absolute; inset: -3px; border-radius: 16px; background: #FF2D55; opacity: 0.5; animation: status-breathe 1.2s ease-in-out infinite; filter: blur(5px);"></div>` : ''}
                                    ${!isLive && !isCancelled && !isFinished && !isJoined ? `<div style="position: absolute; inset: -2px; border-radius: 16px; background: ${isEntreno ? '#8b5cf6' : '#CCFF00'}; opacity: 0.25; animation: status-breathe 2.2s ease-in-out infinite; filter: blur(4px);"></div>` : ''}
                                    
                                    ${(() => {
                                        // Definir contraste perfecto para el botón de acción principal (APUNTARME / DENTRO / LIVE / ESPERA)
                                        let ctaBg = '#CCFF00';
                                        let ctaTextColor = '#000000';
                                        let ctaShadow = '0 6px 18px rgba(204, 255, 0, 0.45)';

                                        if (isLive) {
                                            ctaBg = '#FF2D55';
                                            ctaTextColor = '#ffffff';
                                            ctaShadow = '0 6px 18px rgba(255, 45, 85, 0.5)';
                                        } else if (isCancelled) {
                                            ctaBg = '#ef4444';
                                            ctaTextColor = '#ffffff';
                                            ctaShadow = '0 6px 18px rgba(239, 68, 68, 0.4)';
                                        } else if (isFinished || evt.status === 'finished') {
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

                                        return `
                                            <button id="event-fab-${evt.id}" 
                                                    onclick="event.stopPropagation(); ${fabAction}"
                                                    aria-label="${btnLabel}"
                                                    style="
                                                        position: relative;
                                                        background: ${ctaBg} !important;
                                                        color: ${ctaTextColor} !important;
                                                        padding: 10px 18px;
                                                        border-radius: 14px;
                                                        font-size: 0.78rem;
                                                        font-weight: 950;
                                                        font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
                                                        text-transform: uppercase;
                                                        letter-spacing: 0.6px;
                                                        display: flex;
                                                        align-items: center;
                                                        gap: 7px;
                                                        border: none;
                                                        cursor: pointer;
                                                        box-shadow: ${ctaShadow};
                                                        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                                                        ${isLive ? 'animation: status-shake 0.5s ease-in-out infinite alternate;' : ''}
                                                    "
                                                    onmouseover="this.style.transform='scale(1.04)';"
                                                    onmouseout="this.style.transform='scale(1)';"
                                                    onmousedown="this.style.transform='scale(0.95)';">
                                                <i id="event-fab-icon-${evt.id}" class="fas ${btnIcon}" style="font-size: 0.85rem; color: ${ctaTextColor} !important; font-weight: 900;"></i>
                                                <span id="event-fab-label-${evt.id}" style="color: ${ctaTextColor} !important; font-weight: 950; letter-spacing: 0.6px;">${btnLabel}</span>
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
            const events = type === 'entreno' ? this.state.entrenos : this.state.americanas;
            let evt = events.find(e => e.id === id);

            if (!evt && window.EventService) {
                try {
                    evt = await window.EventService.getById(type === 'entreno' ? 'entreno' : 'americana', id);
                } catch (e) {
                    console.warn("⚠️ [EventsController] Fallback fetch:", e);
                }
            }

            if (!evt) {
                console.warn("⚠️ Evento no encontrado para compartir:", id);
                return;
            }

            // Normalización idéntica al Admin de Entrenos y Americanas
            const normalizedEvt = {
                ...evt,
                id: evt.id || id,
                type: evt.type || type,
                location: evt.sede || evt.location || evt.club || 'SomosPadel BCN',
                sede: evt.sede || evt.location || evt.club || 'SomosPadel BCN',
                players: evt.players || evt.registeredPlayers || [],
                registeredPlayers: evt.registeredPlayers || evt.players || [],
                price_members: evt.price_members || evt.price_socio || evt.price || 10,
                price_external: evt.price_external || evt.price_no_socio || evt.price_externo || evt.price || 10,
                max_courts: evt.max_courts || evt.courts || 4
            };

            if (window.WhatsAppService && typeof window.WhatsAppService.shareStartFromAdmin === 'function') {
                await window.WhatsAppService.shareStartFromAdmin(normalizedEvt);
                return;
            }

            // Fallback de seguridad en caso de no disponibilidad de WhatsAppService
            const maxCourts = parseInt(normalizedEvt.max_courts || 4);
            const maxPlayers = maxCourts * 4;
            const remaining = Math.max(0, maxPlayers - normalizedEvt.players.length);
            const shareText = `🎾 *SOMOSPADEL BCN - CONVOCATORIA DE PÁDEL* 🎾\n\n🏆 *${normalizedEvt.name}*\n📅 *Fecha:* ${normalizedEvt.date}\n🕒 *Horario:* ${normalizedEvt.time || '19:30 - 21:30'}\n📍 *Sede:* ${normalizedEvt.location}\n👥 *Plazas libres:* ${remaining} de ${maxPlayers} plazas\n💰 *Precio:* ${normalizedEvt.price_members}€\n\n⚡ ¡Apúntate antes de que se agoten las plazas!\n👉 ${window.location.origin}`;

            const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
            window.open(whatsappUrl, '_blank');
        }

        addToCalendar(id, type = 'americana') {
            const events = type === 'entreno' ? this.state.entrenos : this.state.americanas;
            const evt = events.find(e => e.id === id);
            if (!evt) return;

            const title = encodeURIComponent(`SomosPadel: ${evt.name}`);
            const location = encodeURIComponent(evt.sede || evt.location || 'Barcelona Pádel el Prat');
            const details = encodeURIComponent(`Torneo/Entreno SomosPadel BCN.\nHorario: ${evt.time}\nPrecio: ${evt.price_socio || 10}€\n¡A darlo todo en pista!`);
            
            // Construir fecha ISO simple
            const normDate = evt.normDate || this.getTodayStr();
            const dateClean = normDate.replace(/-/g, '');
            const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateClean}T180000Z/${dateClean}T200000Z&details=${details}&location=${location}`;
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
                            <i class="fas fa-image"></i> CARTEL OFICIAL
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
                    <h3 style="margin: 0 0 12px; font-size: 1.1rem; font-weight: 950; color: #fff; text-transform: uppercase; line-height: 1.25; letter-spacing: -0.3px;">
                        ${title}
                    </h3>

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

                const events = type === 'entreno' ? this.state.entrenos : this.state.americanas;
                const evt = events.find(e => e.id === id);
                if (!evt) return;

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
            const pairsCount = finalGroups.filter(g => g.type === 'pair').length;
            const solosCount = finalGroups.filter(g => g.type !== 'pair').length;
            const levelsArr = dbPlayers.map(p => parseFloat(p.level || 3.5));
            const balanceScore = totalPlayers > 1 
                ? Math.min(99, Math.max(82, Math.round(100 - (Math.abs(Math.max(...levelsArr) - Math.min(...levelsArr)) * 4.5)))) 
                : 95;

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
            window.shareConvocatoriaBattleReady = function() {
                const eventTitle = (evt.name || 'Torneo').toUpperCase();
                const timeText = evt.time || '16:30';
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

            // 🎯 Quad Tab Switcher (Roster vs War Room vs Roulette vs Duel)
            window.switchBattleReadyTab = function(tab) {
                window._currentBattleTab = tab;
                const tabs = ['roster', 'warroom', 'roulette', 'duel'];

                tabs.forEach(t => {
                    const viewEl = document.getElementById(`battle-view-${t}`);
                    const btnEl = document.getElementById(`battle-tab-btn-${t}`);
                    if (viewEl) viewEl.style.display = (t === tab) ? 'block' : 'none';
                    if (btnEl) {
                        if (t === tab) {
                            btnEl.style.background = '#0f172a';
                            btnEl.style.color = '#ffffff';
                            btnEl.style.borderColor = '#0f172a';
                            btnEl.style.boxShadow = '0 4px 12px rgba(15,23,42,0.15)';
                        } else {
                            btnEl.style.background = '#ffffff';
                            btnEl.style.color = '#475569';
                            btnEl.style.borderColor = '#cbd5e1';
                            btnEl.style.boxShadow = 'none';
                        }
                    }
                });

                if (tab === 'duel' && window.updateBattleDuel) {
                    window.updateBattleDuel();
                }
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
                const photo = player.photo_url || player.photoURL || 'img/logo_somospadel.png';
                const level = parseFloat(player.level || 3.5).toFixed(2);
                const teams = Array.isArray(player.team_somospadel) ? player.team_somospadel : (player.team_somospadel ? [player.team_somospadel] : []);
                const position = player.position || (level > 3.6 ? 'Revés' : 'Drive');
                const posIcon = position.toLowerCase().includes('rev') ? '⚡ Revés' : '🛡️ Drive';
                const streak = player.streak || (parseFloat(level) > 3.5 ? 3 : 1);

                return `
                    <div style="display: flex; align-items: center; gap: 14px; padding: 14px; position: relative;">
                        <div style="position: relative;">
                            <div style="width: 54px; height: 54px; border-radius: 14px; background: url('${photo}') center/cover; border: 2px solid ${badgeColor}; box-shadow: 0 2px 8px rgba(0,0,0,0.08);"></div>
                            <span style="position: absolute; bottom: -4px; right: -4px; background: #0f172a; color: #f59e0b; font-size: 0.55rem; font-weight: 950; padding: 1px 4px; border-radius: 4px; border: 1px solid #e2e8f0;">🔥${streak}W</span>
                        </div>
                        <div style="flex: 1; min-width: 0;">
                            <div style="font-weight: 950; font-size: 0.98rem; color: #0f172a; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: -0.3px;">${player.name}</div>
                            <div style="display: flex; align-items: center; gap: 6px; margin-top: 4px; flex-wrap: wrap;">
                                <span style="background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; font-weight: 950; font-size: 0.72rem; padding: 1px 6px; border-radius: 6px;">${level} <small style="font-weight: 800;">LVL</small></span>
                                <span style="background: #f1f5f9; color: #334155; font-size: 0.62rem; font-weight: 800; padding: 2px 7px; border-radius: 6px; border: 1px solid #e2e8f0;">${posIcon}</span>
                                ${teams.length > 0 ? `<span style="background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; font-size: 0.55rem; font-weight: 900; padding: 1px 5px; border-radius: 4px;">${teams[0].toUpperCase()}</span>` : ''}
                            </div>
                        </div>
                        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px;">
                            <div style="background: ${badgeColor}; color: #ffffff; font-size: 0.58rem; font-weight: 1000; padding: 3px 9px; border-radius: 6px; letter-spacing: 0.5px;">${badgeText}</div>
                            <button onclick="event.stopPropagation(); window.PadelFutCard && window.PadelFutCard.open({ user: { id: '${player.id || player.uid}', name: '${player.name.replace(/'/g, "\\'")}', level: '${player.level || 3.5}', photo_url: '${photo}' } })" 
                                    style="background: #fffbeb; border: 1px solid #fde68a; color: #b45309; font-size: 0.58rem; font-weight: 900; padding: 2px 7px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 4px; transition: all 0.2s;">
                                🎴 CARTA
                            </button>
                        </div>
                    </div>
                `;
            };

            // 🧬 4. QUÍMICA DE PAREJA (SYNERGY SCORE %) EN TARJETAS DE ROSTER
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
                        synergyDesc = 'Doble especialista en derecha (rotación requerida)';
                    } else if (isRev1 && isRev2) {
                        synergyScore = 78;
                        synergyBadge = '⚠️ QUÍMICA 78% • DOBLE REVÉS';
                        synergyColor = '#e11d48';
                        synergyDesc = 'Gran pegada aérea (atención al centro)';
                    }

                    return `
                    <div class="battle-ready-item neon-pair-card" data-filter-type="pair" data-player-names="${pNames}" data-player-levels="${pLevels}" style="
                        background: #ffffff;
                        border: 1.5px solid #38bdf8;
                        border-radius: 22px;
                        padding: 6px;
                        position: relative;
                        overflow: hidden;
                        box-shadow: 0 4px 20px rgba(56, 189, 248, 0.08);
                        margin-bottom: 15px;
                        animation: floatUp 0.4s ease-out forwards;
                    ">
                        <div style="position: absolute; top: 0; right: 0; background: #0284c7; color: #ffffff; font-size: 0.55rem; font-weight: 1000; padding: 3px 14px; border-bottom-left-radius: 12px; text-transform: uppercase; letter-spacing: 1px; z-index: 10;">👥 PAREJA CONFIRMADA</div>
                        ${renderNeonPlayer(group.p1, 'JUGADOR 1', '#0284c7')}
                        
                        <!-- SYNERGY SCORE STRIP -->
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin: 4px 12px; padding: 8px 12px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                                <span style="font-size: 0.64rem; font-weight: 1000; color: ${synergyColor}; letter-spacing: 0.5px;">${synergyBadge}</span>
                                <span style="font-size: 0.58rem; color: #64748b; font-weight: 800;">${synergyDesc}</span>
                            </div>
                            <div style="width: 100%; height: 5px; background: #e2e8f0; border-radius: 99px; overflow: hidden;">
                                <div style="width: ${synergyScore}%; height: 100%; background: ${synergyColor}; border-radius: 99px;"></div>
                            </div>
                        </div>

                        ${renderNeonPlayer(group.p2, 'JUGADOR 2', '#0284c7')}
                    </div>
                    `;
                } else {
                    const pNames = `${group.p1.name}`.replace(/"/g, '&quot;');
                    const pLevels = `${group.p1.level || '3.5'}`;
                    return `
                    <div class="battle-ready-item neon-single-card" data-filter-type="solo" data-player-names="${pNames}" data-player-levels="${pLevels}" style="
                        background: #ffffff;
                        border: 1.5px solid #eab308;
                        border-radius: 22px;
                        padding: 6px;
                        position: relative;
                        overflow: hidden;
                        box-shadow: 0 4px 20px rgba(234, 179, 8, 0.08);
                        margin-bottom: 15px;
                        animation: floatUp 0.4s ease-out forwards;
                    ">
                        <div style="position: absolute; top: 0; right: 0; background: #fef9c3; color: #854d0e; border-left: 1px solid #fef08a; border-bottom: 1px solid #fef08a; font-size: 0.55rem; font-weight: 1000; padding: 3px 12px; border-bottom-left-radius: 12px; letter-spacing: 0.5px;">🔍 BUSCA PAREJA</div>
                        ${renderNeonPlayer(group.p1, `#${idx + 1}`, '#ca8a04')}
                        ${group.p1.partner_name ? `
                            <div style="padding: 8px 16px 10px; font-size: 0.68rem; color: #854d0e; font-weight: 800; text-transform: uppercase; display: flex; align-items: center; justify-content: space-between; border-top: 1px dashed #fef08a; background: #fefce8; border-bottom-left-radius: 16px; border-bottom-right-radius: 16px;">
                                <span><i class="fas fa-search" style="color: #ca8a04;"></i> Buscando a: <b style="color: #0f172a;">${group.p1.partner_name}</b></span>
                                <a href="https://wa.me/?text=¡Hola!%20Te%20veo%20en%20la%20lista%20de%20SomosPadel%20para%20jugar%20juntos" target="_blank" style="background: #16a34a; color:#ffffff; padding:3px 10px; border-radius:6px; text-decoration:none; font-size:0.58rem; font-weight:900; box-shadow: 0 2px 6px rgba(22,163,74,0.25);">UNIRME</a>
                            </div>
                        ` : ''}
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
                        background: #ffffff;
                        border: 2px dashed #94a3b8;
                        border-radius: 22px;
                        padding: 18px 16px;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 12px;
                        cursor: pointer;
                        transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                        position: relative;
                        overflow: hidden;
                        margin-bottom: 15px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.02);
                    " onmouseover="this.style.background='#f0fdf4'; this.style.borderColor='#16a34a'; this.style.transform='translateY(-2px)';" onmouseout="this.style.background='#ffffff'; this.style.borderColor='#94a3b8'; this.style.transform='none';">
                        <div style="display: flex; align-items: center; gap: 14px;">
                            <div style="width: 48px; height: 48px; border-radius: 14px; background: #f0fdf4; border: 1.5px dashed #16a34a; display: flex; align-items: center; justify-content: center; color: #16a34a; font-size: 1.3rem;">
                                <i class="fas fa-user-plus"></i>
                            </div>
                            <div>
                                <div style="font-weight: 950; font-size: 0.95rem; color: #0f172a; letter-spacing: 0.5px;">PLAZA LIBRE #${slotNum}</div>
                                <div style="font-size: 0.68rem; color: #16a34a; font-weight: 800; margin-top: 2px;">¡Disponible! Toca para apuntarte</div>
                            </div>
                        </div>
                        <div style="background: #16a34a; color: #ffffff; font-size: 0.68rem; font-weight: 1000; padding: 7px 14px; border-radius: 8px; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(22,163,74,0.3);">
                            ¡OCUPAR!
                        </div>
                    </div>
                `;
            }

            const tierStyles = [
                { name: 'CENTRAL ORO', icon: '👑', color: '#b45309', border: '#f59e0b', bg: '#fffbeb', desc: 'Top Seed Tier' },
                { name: 'PISTA PLATA', icon: '⚡', color: '#0369a1', border: '#0284c7', bg: '#f0f9ff', desc: 'High Competitive' },
                { name: 'PISTA BRONCE', icon: '🛡️', color: '#c2410c', border: '#ea580c', bg: '#fff7ed', desc: 'Balanced Core' },
                { name: 'PISTA DIAMANTE', icon: '💎', color: '#7e22ce', border: '#9333ea', bg: '#faf5ff', desc: 'Advanced Match' },
                { name: 'PISTA NEÓN', icon: '🎾', color: '#15803d', border: '#16a34a', bg: '#f0fdf4', desc: 'Clutch Arena' },
                { name: 'PISTA ESMERALDA', icon: '🌱', color: '#047857', border: '#059669', bg: '#ecfdf5', desc: 'Rising Players' }
            ];

            // AI War Room Court Simulation HTML
            const courtSimulationsHtml = (() => {
                if (dbPlayers.length === 0) {
                    return `
                        <div style="text-align: center; padding: 60px 20px; color: #64748b; background: #ffffff; border-radius: 20px; border: 1.5px dashed #cbd5e1;">
                            <i class="fas fa-users-slash" style="font-size: 2.6rem; color: #0284c7; margin-bottom: 14px; display: block;"></i>
                            <div style="font-weight: 950; font-size: 1.1rem; color: #0f172a;">Aún no hay suficientes inscritos para proyectar pistas</div>
                            <div style="font-size: 0.82rem; margin-top: 6px; color: #475569;">Comparte la convocatoria para llenar las plazas y activar la estimación por nivel.</div>
                        </div>
                    `;
                }

                const sortedPlayers = [...dbPlayers].sort((a, b) => parseFloat(b.level || 3.5) - parseFloat(a.level || 3.5));
                const courtsList = [];

                for (let c = 0; c < maxCourts; c++) {
                    const courtPlayers = sortedPlayers.slice(c * 4, (c + 1) * 4);
                    if (courtPlayers.length === 0) break;
                    const tier = tierStyles[c % tierStyles.length];
                    const courtAvg = courtPlayers.length > 0 
                        ? (courtPlayers.reduce((acc, p) => acc + parseFloat(p.level || 3.5), 0) / courtPlayers.length).toFixed(2)
                        : '0.00';

                    let playerSlotsHtml = '';
                    for (let s = 0; s < 4; s++) {
                        const player = courtPlayers[s];
                        if (player) {
                            const photo = player.photo_url || player.photoURL || 'img/logo_somospadel.png';
                            const pos = player.position || (parseFloat(player.level || 3.5) > 3.6 ? 'Revés' : 'Drive');
                            playerSlotsHtml += `
                                <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 10px; display: flex; align-items: center; gap: 10px; transition: transform 0.2s; box-shadow: 0 1px 4px rgba(0,0,0,0.02);" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='none'">
                                    <div style="width: 36px; height: 36px; border-radius: 10px; background: url('${photo}') center/cover; border: 1.5px solid ${tier.border}; flex-shrink: 0;"></div>
                                    <div style="flex: 1; min-width: 0;">
                                        <div style="font-size: 0.8rem; font-weight: 950; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${player.name}</div>
                                        <div style="font-size: 0.65rem; color: ${tier.color}; font-weight: 800; margin-top: 2px;">
                                            ${parseFloat(player.level || 3.5).toFixed(2)} LVL <span style="color: #64748b; font-size: 0.58rem; margin-left: 2px;">• ${pos}</span>
                                        </div>
                                    </div>
                                </div>
                            `;
                        } else {
                            playerSlotsHtml += `
                                <div style="background: #ffffff; border: 1px dashed #cbd5e1; border-radius: 14px; padding: 10px; display: flex; align-items: center; gap: 10px; opacity: 0.8;">
                                    <div style="width: 36px; height: 36px; border-radius: 10px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 0.85rem; flex-shrink: 0;"><i class="fas fa-user-plus"></i></div>
                                    <div>
                                        <div style="font-size: 0.75rem; font-weight: 800; color: #64748b;">Pendiente...</div>
                                        <div style="font-size: 0.6rem; color: #94a3b8;">Slot libre</div>
                                    </div>
                                </div>
                            `;
                        }
                    }

                    courtsList.push(`
                        <div style="
                            background: #ffffff;
                            border: 1.5px solid #e2e8f0;
                            border-top: 4px solid ${tier.border};
                            border-radius: 24px;
                            padding: 18px;
                            position: relative;
                            overflow: hidden;
                            box-shadow: 0 4px 20px rgba(0,0,0,0.04);
                            display: flex;
                            flex-direction: column;
                            gap: 14px;
                        ">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <span style="font-size: 1.4rem;">${tier.icon}</span>
                                    <div>
                                        <div style="font-size: 0.95rem; font-weight: 1000; color: #0f172a; letter-spacing: 0.5px;">PISTA ${c + 1}: ${tier.name}</div>
                                        <div style="font-size: 0.65rem; color: #64748b; font-weight: 800;">${tier.desc} • 4 Jugadores</div>
                                    </div>
                                </div>
                                <div style="background: ${tier.bg}; border: 1px solid ${tier.border}; color: ${tier.color}; padding: 4px 10px; border-radius: 8px; font-size: 0.75rem; font-weight: 1000; letter-spacing: 0.5px;">
                                    ${courtAvg} <small style="font-size: 0.6rem;">AVG</small>
                                </div>
                            </div>

                            <!-- 2x2 Mini Court Simulation Grid -->
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 16px; padding: 12px; position: relative;">
                                <div style="position: absolute; top: 50%; left: 0; right: 0; height: 1px; background: #cbd5e1; z-index: 1;"></div>
                                <div style="position: absolute; top: 0; bottom: 0; left: 50%; width: 1px; background: #cbd5e1; z-index: 1;"></div>
                                ${playerSlotsHtml}
                            </div>
                        </div>
                    `);
                }

                return courtsList.join('');
            })();

            // 🎰 2. BATTLE ROULETTE / SORTEO CINEMÁTICO LOGIC
            window.startBattleRoulette = function() {
                if (dbPlayers.length < 2) {
                    alert('Se necesitan al menos 2 jugadores para ejecutar el sorteo cinemático.');
                    return;
                }
                const spinBtn = document.getElementById('battle-roulette-btn');
                const displayCard = document.getElementById('battle-roulette-display');
                const resultBox = document.getElementById('battle-roulette-results');
                const confettiBox = document.getElementById('battle-roulette-confetti');

                if (spinBtn) {
                    spinBtn.disabled = true;
                    spinBtn.style.opacity = '0.6';
                    spinBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> SORTEANDO EN VIVO...`;
                }
                if (resultBox) resultBox.style.display = 'none';
                if (confettiBox) confettiBox.innerHTML = '';

                let steps = 0;
                const maxSteps = 24;
                let delay = 60;

                if (window._battleRouletteTimer) {
                    clearTimeout(window._battleRouletteTimer);
                    window._battleRouletteTimer = null;
                }

                const spinStep = () => {
                    const randIdx = Math.floor(Math.random() * dbPlayers.length);
                    const p = dbPlayers[randIdx] || dbPlayers[0] || { name: 'Jugador', level: 3.5 };
                    const photo = p.photo_url || p.photoURL || 'img/logo_somospadel.png';
                    const numLvl = parseFloat(String(p.level || 3.5).replace(',', '.')) || 3.5;
                    const lvl = numLvl.toFixed(2);
                    const pName = p.name || 'Jugador';

                    if (displayCard) {
                        displayCard.innerHTML = `
                            <div style="width: 80px; height: 80px; border-radius: 20px; background: url('${photo}') center/cover; border: 3px solid #0284c7; box-shadow: 0 4px 15px rgba(2,132,199,0.25); margin: 0 auto 10px; transition: transform 0.1s;"></div>
                            <div style="font-weight: 1000; font-size: 1.25rem; color: #0f172a; text-transform: uppercase; letter-spacing: -0.5px;">${pName}</div>
                            <div style="font-size: 0.8rem; color: #0284c7; font-weight: 950; margin-top: 4px;">NIVEL ${lvl} • ${p.position || (numLvl > 3.6 ? 'Revés' : 'Drive')}</div>
                        `;
                    }

                    window.playBattleAudio('tick');
                    steps++;

                    if (steps < maxSteps) {
                        delay += 14;
                        window._battleRouletteTimer = setTimeout(spinStep, delay);
                    } else {
                        // Sorteo completado
                        window._battleRouletteTimer = null;
                        window.playBattleAudio('fanfare');
                        if (spinBtn) {
                            spinBtn.disabled = false;
                            spinBtn.style.opacity = '1';
                            spinBtn.innerHTML = `<i class="fas fa-redo"></i> RE-SORTEAR RULETA`;
                        }

                        // Confeti neón
                        if (confettiBox) {
                            let confettiHtml = '';
                            const colors = ['#0284c7', '#16a34a', '#dc2626', '#f59e0b', '#9333ea'];
                            for (let i = 0; i < 32; i++) {
                                const left = Math.random() * 95;
                                const c = colors[i % colors.length];
                                const dur = 1.3 + Math.random() * 1.5;
                                const delaySec = Math.random() * 0.3;
                                const size = 6 + Math.random() * 8;
                                confettiHtml += `<div style="position: absolute; left: ${left}%; top: -10px; width: ${size}px; height: ${size}px; background: ${c}; border-radius: 50%; opacity: 0.9; animation: confettiFall ${dur}s ease-out ${delaySec}s infinite; pointer-events: none; z-index: 20;"></div>`;
                            }
                            confettiBox.innerHTML = confettiHtml;
                        }

                        // Generar pistas con jugadores mezclados
                        const shuffled = [...dbPlayers].sort(() => Math.random() - 0.5);
                        let rouletteCourtsHtml = '';
                        for (let c = 0; c < maxCourts; c++) {
                            const cPlayers = shuffled.slice(c * 4, (c + 1) * 4);
                            if (cPlayers.length === 0) break;
                            const tier = tierStyles[c % tierStyles.length];
                            const courtAvg = (cPlayers.reduce((acc, p) => acc + (parseFloat(String(p.level || 3.5).replace(',', '.')) || 3.5), 0) / cPlayers.length).toFixed(2);

                            rouletteCourtsHtml += `
                                <div style="background: #ffffff; border: 1.5px solid ${tier.border}; border-radius: 18px; padding: 14px; box-shadow: 0 4px 15px rgba(0,0,0,0.04);">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                        <div style="display: flex; align-items: center; gap: 8px;">
                                            <span style="font-size: 1.2rem;">${tier.icon}</span>
                                            <div>
                                                <div style="font-weight: 1000; font-size: 0.85rem; color: #0f172a;">PISTA ${c + 1}: ${tier.name}</div>
                                                <div style="font-size: 0.62rem; color: #64748b; font-weight: 800;">Sorteo Oficial • 4 Guerreros</div>
                                            </div>
                                        </div>
                                        <span style="background: ${tier.bg}; border: 1px solid ${tier.border}; color: ${tier.color}; font-size: 0.7rem; font-weight: 1000; padding: 3px 8px; border-radius: 6px;">${courtAvg} LVL</span>
                                    </div>
                                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                                        ${cPlayers.map((p) => {
                                            const pFirstName = ((p.name || 'Jugador').split(' ')[0]).replace(/</g, '&lt;');
                                            const pLvl = (parseFloat(String(p.level || 3.5).replace(',', '.')) || 3.5).toFixed(2);
                                            return `
                                            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 8px; display: flex; align-items: center; gap: 8px;">
                                                <div style="width: 28px; height: 28px; border-radius: 8px; background: url('${p.photo_url || p.photoURL || 'img/logo_somospadel.png'}') center/cover; flex-shrink: 0; border: 1px solid ${tier.border};"></div>
                                                <div style="min-width: 0; flex: 1;">
                                                    <div style="font-size: 0.72rem; font-weight: 900; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${pFirstName}</div>
                                                    <div style="font-size: 0.58rem; color: ${tier.color}; font-weight: 800;">LVL ${pLvl}</div>
                                                </div>
                                            </div>
                                        `;}).join('')}
                                    </div>
                                </div>
                            `;
                        }

                        if (resultBox) {
                            resultBox.innerHTML = `
                                <div style="text-align: center; margin-bottom: 16px;">
                                    <span style="background: #0f172a; color: #ffffff; font-size: 0.75rem; font-weight: 1000; padding: 6px 18px; border-radius: 20px; letter-spacing: 1px; box-shadow: 0 4px 15px rgba(15,23,42,0.15);">
                                        🎉 ¡CUADRO DE PISTAS DEFINIDO!
                                    </span>
                                </div>
                                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px;">
                                    ${rouletteCourtsHtml}
                                </div>
                            `;
                            resultBox.style.display = 'block';
                        }
                    }
                };

                spinStep();
            };

            // ⚔️ 3. AI DUEL ARENA / CARA A CARA (HEAD-TO-HEAD) LOGIC
            window.renderDuelArena = window.updateBattleDuel = function() {
                const sel1 = document.getElementById('duel-player-1-select');
                const sel2 = document.getElementById('duel-player-2-select');
                if (!sel1 || !sel2 || dbPlayers.length === 0) return;

                const id1 = sel1.value;
                const id2 = sel2.value;

                const p1 = dbPlayers.find(p => (p.id || p.uid) === id1) || dbPlayers[0];
                const p2 = dbPlayers.find(p => (p.id || p.uid) === id2) || dbPlayers[1] || dbPlayers[0];

                if (!p1 || !p2) return;

                const lvl1 = parseFloat(String(p1.level || 3.5).replace(',', '.')) || 3.5;
                const lvl2 = parseFloat(String(p2.level || 3.5).replace(',', '.')) || 3.5;

                const baseP1 = Math.round(lvl1 * 16.5);
                const baseP2 = Math.round(lvl2 * 16.5);

                const pos1 = ((p1.position || (lvl1 > 3.6 ? 'Revés' : 'Drive')) || '').toLowerCase();
                const pos2 = ((p2.position || (lvl2 > 3.6 ? 'Revés' : 'Drive')) || '').toLowerCase();

                const pwr1 = Math.min(99, Math.max(45, baseP1 + (pos1.includes('rev') ? 6 : 0)));
                const pwr2 = Math.min(99, Math.max(45, baseP2 + (pos2.includes('rev') ? 6 : 0)));

                const def1 = Math.min(99, Math.max(45, baseP1 + (pos1.includes('dri') ? 5 : 1)));
                const def2 = Math.min(99, Math.max(45, baseP2 + (pos2.includes('dri') ? 5 : 1)));

                const reg1 = Math.min(99, Math.max(45, baseP1 + 2));
                const reg2 = Math.min(99, Math.max(45, baseP2 + 2));

                const streak1 = parseInt(p1.streak || (lvl1 > 3.5 ? 3 : 1), 10) || 1;
                const streak2 = parseInt(p2.streak || (lvl2 > 3.5 ? 3 : 1), 10) || 1;
                const clt1 = Math.min(99, Math.max(50, 60 + (streak1 * 7)));
                const clt2 = Math.min(99, Math.max(50, 60 + (streak2 * 7)));

                const diff = lvl1 - lvl2;
                let winRate1 = Math.round(50 + (diff * 26) + ((streak1 - streak2) * 2));
                winRate1 = Math.max(12, Math.min(88, winRate1));
                if (isNaN(winRate1)) winRate1 = 50;
                let winRate2 = 100 - winRate1;

                const name1 = p1.name || 'Jugador 1';
                const name2 = p2.name || 'Jugador 2';

                let verdict = `🤖 IA VERDICT: Duelo ultra igualado. Máxima tensión en los puntos de oro y juego rasante.`;
                if (winRate1 >= 60) {
                    verdict = `🤖 IA VERDICT: Clara ventaja predictiva para <b>${name1}</b> (${winRate1}%). Su ritmo de bola y agresividad aérea marcan la pauta.`;
                } else if (winRate2 >= 60) {
                    verdict = `🤖 IA VERDICT: Clara ventaja predictiva para <b>${name2}</b> (${winRate2}%). Mayor solidez defensiva y juego de contragolpe.`;
                }

                const container = document.getElementById('duel-comparison-card');
                if (container) {
                    const photo1 = p1.photo_url || p1.photoURL || 'img/logo_somospadel.png';
                    const photo2 = p2.photo_url || p2.photoURL || 'img/logo_somospadel.png';

                    const renderStatRow = (label, v1, v2) => {
                        const safeV1 = isNaN(v1) ? 50 : v1;
                        const safeV2 = isNaN(v2) ? 50 : v2;
                        const is1Higher = safeV1 >= safeV2;
                        const is2Higher = safeV2 >= safeV1;
                        return `
                            <div style="margin-bottom: 12px;">
                                <div style="display: flex; justify-content: space-between; font-size: 0.72rem; font-weight: 900; margin-bottom: 4px;">
                                    <span style="color: ${is1Higher ? '#0284c7' : '#64748b'}; font-weight: 950;">${safeV1}</span>
                                    <span style="color: #334155; text-transform: uppercase; font-size: 0.62rem; letter-spacing: 0.5px; font-weight: 900;">${label}</span>
                                    <span style="color: ${is2Higher ? '#16a34a' : '#64748b'}; font-weight: 950;">${safeV2}</span>
                                </div>
                                <div style="display: flex; gap: 6px; height: 6px;">
                                    <div style="flex: 1; background: #e2e8f0; border-radius: 4px; overflow: hidden; display: flex; justify-content: flex-end;">
                                        <div style="width: ${safeV1}%; background: ${is1Higher ? '#0284c7' : '#93c5fd'}; border-radius: 4px;"></div>
                                    </div>
                                    <div style="flex: 1; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
                                        <div style="width: ${safeV2}%; background: ${is2Higher ? '#16a34a' : '#86efac'}; border-radius: 4px;"></div>
                                    </div>
                                </div>
                            </div>
                        `;
                    };

                    const name1Escaped = name1.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
                    const name2Escaped = name2.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');

                    container.innerHTML = `
                        <!-- HEADERS WITH AVATARS -->
                        <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 20px;">
                            <!-- JUGADOR 1 -->
                            <div style="flex: 1; text-align: center; background: #f0f9ff; border: 1.5px solid #0284c7; border-radius: 18px; padding: 14px 10px;">
                                <div style="width: 62px; height: 62px; border-radius: 16px; background: url('${photo1}') center/cover; border: 2px solid #0284c7; margin: 0 auto 8px; box-shadow: 0 4px 12px rgba(2,132,199,0.2);"></div>
                                <div style="font-weight: 1000; font-size: 0.95rem; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${name1}</div>
                                <div style="font-size: 0.68rem; color: #0284c7; font-weight: 900; margin-top: 2px;">${lvl1.toFixed(2)} LVL</div>
                                <div style="margin-top: 6px; font-size: 1.4rem; font-weight: 1000; color: #0284c7;">${winRate1}%</div>
                                <div style="font-size: 0.55rem; color: #64748b; font-weight: 900; letter-spacing: 0.5px;">PROBABILIDAD IA</div>
                            </div>

                            <!-- VS BADGE -->
                            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;">
                                <div style="background: linear-gradient(135deg, #ef4444, #dc2626); color: #fff; font-size: 0.95rem; font-weight: 1000; padding: 8px 12px; border-radius: 12px; box-shadow: 0 4px 12px rgba(220,38,38,0.25); letter-spacing: 1px;">
                                    VS
                                </div>
                                <span style="font-size: 0.55rem; color: #64748b; font-weight: 900;">H2H ARENA</span>
                            </div>

                            <!-- JUGADOR 2 -->
                            <div style="flex: 1; text-align: center; background: #f0fdf4; border: 1.5px solid #16a34a; border-radius: 18px; padding: 14px 10px;">
                                <div style="width: 62px; height: 62px; border-radius: 16px; background: url('${photo2}') center/cover; border: 2px solid #16a34a; margin: 0 auto 8px; box-shadow: 0 4px 12px rgba(22,163,74,0.2);"></div>
                                <div style="font-weight: 1000; font-size: 0.95rem; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${name2}</div>
                                <div style="font-size: 0.68rem; color: #16a34a; font-weight: 900; margin-top: 2px;">${lvl2.toFixed(2)} LVL</div>
                                <div style="margin-top: 6px; font-size: 1.4rem; font-weight: 1000; color: #16a34a;">${winRate2}%</div>
                                <div style="font-size: 0.55rem; color: #64748b; font-weight: 900; letter-spacing: 0.5px;">PROBABILIDAD IA</div>
                            </div>
                        </div>

                        <!-- PROBABILITY DUAL BAR -->
                        <div style="margin-bottom: 20px;">
                            <div style="width: 100%; height: 8px; background: #e2e8f0; border-radius: 99px; overflow: hidden; display: flex;">
                                <div style="width: ${winRate1}%; background: #0284c7;"></div>
                                <div style="width: ${winRate2}%; background: #16a34a;"></div>
                            </div>
                        </div>

                        <!-- COMPARATIVE STATS BARS -->
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 16px; margin-bottom: 18px;">
                            ${renderStatRow('POTENCIA / REMATE', pwr1, pwr2)}
                            ${renderStatRow('DEFENSA / PAREDES', def1, def2)}
                            ${renderStatRow('REGULARIDAD / CONTROL', reg1, reg2)}
                            ${renderStatRow('CLUTCH & RACHA', clt1, clt2)}
                        </div>

                        <!-- AI VERDICT BADGE -->
                        <div style="background: #f1f5f9; border: 1.5px solid #cbd5e1; border-radius: 14px; padding: 12px 16px; margin-bottom: 18px; font-size: 0.82rem; color: #0f172a; font-weight: 800; line-height: 1.4;">
                            ${verdict}
                        </div>

                        <!-- WHATSAPP RETO BUTTON -->
                        <div style="text-align: center;">
                            <button onclick="window.sendBattleDuelChallenge('${name1Escaped}', '${name2Escaped}', ${winRate1}, ${winRate2})" style="
                                background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
                                color: #fff;
                                border: none;
                                padding: 12px 24px;
                                border-radius: 14px;
                                font-size: 0.82rem;
                                font-weight: 950;
                                cursor: pointer;
                                display: inline-flex;
                                align-items: center;
                                gap: 8px;
                                box-shadow: 0 6px 20px rgba(37,211,102,0.35);
                                transition: transform 0.2s;
                            " onmouseover="this.style.transform='scale(1.02)';" onmouseout="this.style.transform='scale(1)';">
                                <i class="fab fa-whatsapp" style="font-size: 1.1rem;"></i> RETAR POR WHATSAPP (DESAFÍO IA)
                            </button>
                        </div>
                    `;
                }
            };

            window.sendBattleDuelChallenge = function(name1, name2, prob1, prob2) {
                const safeName1 = name1 || 'Jugador 1';
                const safeName2 = name2 || 'Jugador 2';
                const safeProb1 = (prob1 !== undefined && !isNaN(prob1)) ? prob1 : 50;
                const safeProb2 = (prob2 !== undefined && !isNaN(prob2)) ? prob2 : (100 - safeProb1);

                const text = `⚔️ *¡DESAFÍO SOMOSPADEL BCN (AI DUEL)!* ⚔️\n\n` +
                    `Hola *${safeName2}*, la Inteligencia Artificial nos ha emparejado para un cara a cara en *${(evt.name || 'Torneo').toUpperCase()}*:\n\n` +
                    `📊 *Probabilidad de Victoria Estimada:*\n` +
                    `🎾 ${safeName1}: ${safeProb1}%\n` +
                    `🎾 ${safeName2}: ${safeProb2}%\n\n` +
                    `¿Te atreves a resolverlo en la pista? ¡Prepara la pala! 🔥🏆`;

                if (navigator.share) {
                    navigator.share({ title: 'Desafío SomosPadel', text }).catch(() => {});
                } else if (navigator.clipboard) {
                    navigator.clipboard.writeText(text).then(() => {
                        alert('¡Mensaje de reto copiado al portapapeles! Pégalo en WhatsApp. 🚀');
                    });
                } else {
                    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                }
            };

            modal.innerHTML = `
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Syncopate:wght@400;700&family=Montserrat:wght@900&display=swap');
                    .battle-filter-pill {
                        background: #ffffff;
                        border: 1.5px solid #cbd5e1;
                        color: #475569;
                        padding: 7px 15px;
                        border-radius: 12px;
                        font-size: 0.75rem;
                        font-weight: 900;
                        cursor: pointer;
                        transition: all 0.2s;
                        white-space: nowrap;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.03);
                    }
                    .battle-filter-pill:hover {
                        color: #0f172a;
                        background: #f1f5f9;
                        border-color: #94a3b8;
                    }
                    .battle-filter-pill.active {
                        background: #0f172a !important;
                        color: #ffffff !important;
                        border-color: #0f172a !important;
                        box-shadow: 0 4px 12px rgba(15,23,42,0.15) !important;
                    }
                    .battle-tab-btn {
                        padding: 10px 18px;
                        border-radius: 12px;
                        font-size: 0.78rem;
                        font-weight: 950;
                        cursor: pointer;
                        transition: all 0.2s;
                        border: 1.5px solid #cbd5e1;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        background: #ffffff;
                        color: #475569;
                    }
                    .battle-tab-btn:hover {
                        color: #0f172a;
                        border-color: #94a3b8;
                    }
                    .scrolling-text { display: inline-block; animation: marquee 35s linear infinite; }
                    @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
                    #inscritos-modal::-webkit-scrollbar { width: 6px; }
                    #inscritos-modal::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                    #inscritos-modal::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
                    .neon-pair-card, .neon-single-card { transition: transform 0.2s, box-shadow 0.2s; }
                    .neon-pair-card:hover, .neon-single-card:hover { transform: translateY(-3px); }

                    /* Ecualizador animado CSS para Locución IA */
                    @keyframes soundWave {
                        0%, 100% { height: 4px; }
                        50% { height: 14px; }
                    }
                    .eq-bar {
                        width: 3px;
                        height: 4px;
                        background: #dc2626;
                        border-radius: 2px;
                        display: inline-block;
                        animation: soundWave 0.7s ease-in-out infinite;
                    }
                    .eq-bar:nth-child(2) { animation-delay: 0.15s; }
                    .eq-bar:nth-child(3) { animation-delay: 0.3s; }
                    .eq-bar:nth-child(4) { animation-delay: 0.45s; }

                    #battle-top-bar {
                        background: #ffffff !important;
                    }
                    .battle-tabs-wrapper {
                        display: flex;
                        gap: 8px;
                        margin-bottom: 18px;
                        background: #e2e8f0;
                        padding: 5px;
                        border-radius: 16px;
                        border: 1px solid #cbd5e1;
                        width: fit-content;
                        max-width: 100%;
                        box-sizing: border-box;
                    }
                    @media (max-width: 640px) {
                        .battle-tabs-wrapper {
                            display: grid !important;
                            grid-template-columns: 1fr 1fr !important;
                            gap: 6px !important;
                            width: 100% !important;
                        }
                        .battle-tabs-wrapper .battle-tab-btn {
                            justify-content: center !important;
                            padding: 10px 8px !important;
                            font-size: 0.72rem !important;
                            width: 100% !important;
                            box-sizing: border-box !important;
                        }
                    }
                    .battle-pills-row {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        overflow-x: auto;
                        overflow-y: hidden;
                        scrollbar-width: none !important;
                        -ms-overflow-style: none !important;
                        -webkit-overflow-scrolling: touch;
                        padding-bottom: 4px;
                    }
                    .battle-pills-row::-webkit-scrollbar {
                        display: none !important;
                        width: 0 !important;
                        height: 0 !important;
                    }
                    @keyframes confettiFall {
                        0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
                        100% { transform: translateY(240px) rotate(480deg); opacity: 0; }
                    }
                </style>

                <!-- STICKY TOP NAVIGATION BAR -->
                <div id="battle-top-bar" style="position: sticky; top: 0; z-index: 30010; background: #ffffff !important; border-bottom: 1px solid #e2e8f0; padding: 12px 18px; display: flex; justify-content: space-between; align-items: center; gap: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.06);">
                    <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                        <span style="background: #0f172a; color: #ccff00; padding: 4px 10px; border-radius: 8px; font-weight: 950; font-size: 0.68rem; letter-spacing: 1.5px;">BROADCAST</span>
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <div style="width: 8px; height: 8px; background: #dc2626; border-radius: 50%; animation: pulse 1s infinite;"></div>
                            <span style="font-size: 0.65rem; font-weight: 950; color: #dc2626; letter-spacing: 1px;">PRE-PARTY LIVE</span>
                        </div>
                        <div id="battle-countdown-badge" style="background: #ffffff; border: 1.5px solid #cbd5e1; padding: 4px 10px; border-radius: 8px; font-size: 0.68rem; font-weight: 900; color: #0f172a; display: flex; align-items: center; gap: 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.04);">
                            <i class="far fa-clock" style="color:#0284c7;"></i> CALCULANDO...
                        </div>
                    </div>

                        <!-- 📢 SPEAKER OFICIAL DE ESTADIO (ÚNICO Y HUMANO) -->
                        <button id="battle-voice-btn" onclick="window.toggleBattleVoiceBroadcast()" title="Megafonía Oficial de Pista" style="
                            background: #0f172a;
                            border: 1.5px solid #0f172a;
                            color: #ffffff;
                            padding: 8px 16px;
                            border-radius: 20px;
                            font-size: 0.74rem;
                            font-weight: 950;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            transition: all 0.2s;
                            box-shadow: 0 4px 14px rgba(15,23,42,0.18);
                        ">
                            <i class="fas fa-bullhorn" id="battle-voice-icon" style="color: #38bdf8;"></i>
                            <span id="battle-voice-text">📢 SPEAKER DE PISTA</span>
                            <div id="battle-voice-eq" style="display: none; align-items: flex-end; gap: 2px; height: 14px;">
                                <span class="eq-bar" style="background: #38bdf8;"></span>
                                <span class="eq-bar" style="background: #38bdf8;"></span>
                                <span class="eq-bar" style="background: #38bdf8;"></span>
                                <span class="eq-bar" style="background: #38bdf8;"></span>
                            </div>
                        </button>

                        <button onclick="window.toggleBattleReadyFullscreen()" title="Pantalla Completa TV" style="background: #ffffff; border: 1.5px solid #cbd5e1; color: #0f172a; width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 0.9rem; transition: all 0.2s; box-shadow: 0 2px 6px rgba(0,0,0,0.04);">
                            <i class="fas fa-expand"></i>
                        </button>
                        <button onclick="window.closeBattleReadyModal()" title="Cerrar" style="background: #fee2e2; border: 1.5px solid #fca5a5; color: #dc2626; width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 1rem; transition: all 0.2s; box-shadow: 0 2px 6px rgba(220,38,38,0.15);"
                                onmouseover="this.style.background='#dc2626'; this.style.color='#fff';"
                                onmouseout="this.style.background='#fee2e2'; this.style.color='#dc2626';">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>

                <div class="broadcast-container" style="padding: 20px 16px 80px; max-width: 1400px; margin: 0 auto; width: 100%; box-sizing: border-box;">
                    
                    <!-- HERO HEADER -->
                    <div class="broadcast-header" style="
                        background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%); 
                        border: 1.5px solid #e2e8f0;
                        border-radius: 26px; 
                        padding: 24px; 
                        margin-bottom: 22px;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.04);
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        flex-wrap: wrap;
                        gap: 20px;
                    ">
                        <div style="flex: 1; min-width: 260px;">
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap;">
                                <span style="background: #0284c7; color: #ffffff; font-size: 0.68rem; font-weight: 950; padding: 4px 10px; border-radius: 8px; letter-spacing: 1px;">
                                    ${isEntrenoModal ? '🎾 ENTRENO OFICIAL' : '🏆 TORNEO AMERICANO'}
                                </span>
                                <span style="background: rgba(15,23,42,0.06); color: #0f172a; font-size: 0.68rem; font-weight: 900; padding: 4px 10px; border-radius: 8px; letter-spacing: 1px;">
                                    INSCRITOS BATTLE READY
                                </span>
                            </div>
                            <h1 style="
                                margin: 0; 
                                font-family: 'Montserrat', sans-serif; 
                                font-size: clamp(1.8rem, 4.2vw, 2.7rem); 
                                font-weight: 1000; 
                                text-transform: uppercase; 
                                letter-spacing: -1px; 
                                line-height: 1.05;
                                color: #0f172a;
                            ">
                                ${eventTitle}
                            </h1>
                            <p style="margin: 6px 0 0 0; color: #64748b; font-weight: 900; font-size: 0.86rem; text-transform: uppercase; letter-spacing: 0.5px;">
                                CONVOCATORIA OFICIAL Y ASIGNACIÓN DE PISTAS
                            </p>
                            <div style="display: flex; align-items: center; gap: 16px; color: #475569; font-size: 0.84rem; font-weight: 800; margin-top: 10px; flex-wrap: wrap;">
                                <span><i class="far fa-clock" style="color: #0284c7;"></i> ${evt.time || '16:30'}</span>
                                <span><i class="fas fa-map-marker-alt" style="color: #dc2626;"></i> ${eventLocation}</span>
                                <span><i class="fas fa-euro-sign" style="color: #d97706;"></i> ${eventPriceText}</span>
                            </div>
                        </div>

                        <!-- BIG PLAYER COUNT BADGE -->
                        <div style="text-align: center; background: #0f172a; border: 2px solid #0f172a; padding: 14px 28px; border-radius: 20px; box-shadow: 0 6px 20px rgba(15,23,42,0.15); min-width: 140px;">
                            <div style="font-size: 0.62rem; font-weight: 950; color: #38bdf8; margin-bottom: 4px; letter-spacing: 2px; text-transform: uppercase;">PLAYER COUNT</div>
                            <div style="font-size: 2.7rem; font-weight: 1000; color: #fff; line-height: 0.9;">
                                ${totalPlayers}<span style="color: rgba(255,255,255,0.4); font-size: 1.4rem; font-weight: 700; margin-left: 2px;">/${maxPlayers}</span>
                            </div>
                            <div style="margin-top: 6px; font-size: 0.65rem; color: ${slotsLeft > 0 ? '#38bdf8' : '#f87171'}; font-weight: 900;">
                                ${slotsLeft > 0 ? `FALTAN ${slotsLeft} PLAZAS` : '¡AFORO COMPLETO!'}
                            </div>
                        </div>
                    </div>

                    <!-- BATTLE INTELLIGENCE STATS BAR -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 12px; margin-bottom: 22px;">
                        <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 16px; padding: 14px 16px; display: flex; align-items: center; gap: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.03);">
                            <div style="width: 40px; height: 40px; border-radius: 10px; background: #f0fdf4; color: #16a34a; display: flex; align-items: center; justify-content: center; font-size: 1.1rem;"><i class="fas fa-chart-line"></i></div>
                            <div>
                                <div style="font-size: 0.65rem; color: #64748b; font-weight: 900; text-transform: uppercase;">NIVEL MEDIO</div>
                                <div style="font-size: 1.3rem; font-weight: 1000; color: #0f172a;">${avgLevel} <small style="font-size: 0.65rem; color: #16a34a; font-weight: 900;">LVL</small></div>
                            </div>
                        </div>

                        <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 16px; padding: 14px 16px; display: flex; align-items: center; gap: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.03);">
                            <div style="width: 40px; height: 40px; border-radius: 10px; background: #f0f9ff; color: #0284c7; display: flex; align-items: center; justify-content: center; font-size: 1.1rem;"><i class="fas fa-scale-balanced"></i></div>
                            <div>
                                <div style="font-size: 0.65rem; color: #64748b; font-weight: 900; text-transform: uppercase;">COMPETITIVIDAD</div>
                                <div style="font-size: 1.3rem; font-weight: 1000; color: #0f172a;">${balanceScore}% <small style="font-size: 0.65rem; color: #0284c7; font-weight: 900;">EQUILIBRIO</small></div>
                            </div>
                        </div>

                        <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 16px; padding: 14px 16px; display: flex; align-items: center; gap: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.03);">
                            <div style="width: 40px; height: 40px; border-radius: 10px; background: #fefce8; color: #ca8a04; display: flex; align-items: center; justify-content: center; font-size: 1.1rem;"><i class="fas fa-users-viewfinder"></i></div>
                            <div>
                                <div style="font-size: 0.65rem; color: #64748b; font-weight: 900; text-transform: uppercase;">DISTRIBUCIÓN</div>
                                <div style="font-size: 1.1rem; font-weight: 1000; color: #0f172a;">${pairsCount} Parejas <span style="font-size: 0.72rem; color: #64748b; font-weight: 800;">• ${solosCount} Solos</span></div>
                            </div>
                        </div>

                        <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 16px; padding: 14px 16px; display: flex; align-items: center; gap: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.03);">
                            <div style="width: 40px; height: 40px; border-radius: 10px; background: #fef2f2; color: #dc2626; display: flex; align-items: center; justify-content: center; font-size: 1.1rem;"><i class="fas fa-ticket"></i></div>
                            <div>
                                <div style="font-size: 0.65rem; color: #64748b; font-weight: 900; text-transform: uppercase;">PLAZAS VACANTES</div>
                                <div style="font-size: 1.3rem; font-weight: 1000; color: ${slotsLeft > 0 ? '#16a34a' : '#dc2626'};">${slotsLeft > 0 ? `${slotsLeft} LIBRES` : 'AGOTADAS'}</div>
                            </div>
                        </div>
                    </div>

                    <!-- ACTION BAR: SHARE WHATSAPP & TV MODE -->
                    <div style="display: flex; gap: 10px; margin-bottom: 22px; flex-wrap: wrap;">
                        <button onclick="window.shareConvocatoriaBattleReady()" style="
                            flex: 1;
                            min-width: 200px;
                            background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
                            color: #ffffff;
                            border: none;
                            padding: 13px 20px;
                            border-radius: 14px;
                            font-weight: 950;
                            font-size: 0.85rem;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 8px;
                            box-shadow: 0 6px 20px rgba(37, 211, 102, 0.35);
                            transition: transform 0.2s;
                        " onmouseover="this.style.transform='scale(1.02)';" onmouseout="this.style.transform='scale(1)';">
                            <i class="fab fa-whatsapp" style="font-size: 1.1rem;"></i> COMPARTIR CONVOCATORIA
                        </button>

                        <button onclick="window.toggleBattleReadyFullscreen()" style="
                            background: #ffffff;
                            border: 1.5px solid #cbd5e1;
                            color: #0f172a;
                            padding: 13px 18px;
                            border-radius: 14px;
                            font-weight: 900;
                            font-size: 0.85rem;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
                        ">
                            <i class="fas fa-tv"></i> MODO PANTALLA COMPLETA
                        </button>
                    </div>

                    <!-- 🎛️ QUAD TAB SWITCHER: ROSTER VS AI WAR ROOM VS ROULETTE VS DUEL ARENA -->
                    <div class="battle-tabs-wrapper">
                        <button id="battle-tab-btn-roster" class="battle-tab-btn" onclick="window.switchBattleReadyTab('roster')" style="background: #0f172a; color: #ffffff; border-color: #0f172a; box-shadow: 0 4px 12px rgba(15,23,42,0.15);">
                            <i class="fas fa-users"></i> ROSTER (${totalPlayers + slotsLeft})
                        </button>
                        <button id="battle-tab-btn-warroom" class="battle-tab-btn" onclick="window.switchBattleReadyTab('warroom')" style="background: #ffffff; color: #475569; border-color: #cbd5e1;">
                            <i class="fas fa-chess-board"></i> PISTAS ESTIMADAS
                        </button>
                        <button id="battle-tab-btn-roulette" class="battle-tab-btn" onclick="window.switchBattleReadyTab('roulette')" style="background: #ffffff; color: #475569; border-color: #cbd5e1;">
                            <i class="fas fa-dharmachakra"></i> 🎰 LIVE ROULETTE
                        </button>
                        <button id="battle-tab-btn-duel" class="battle-tab-btn" onclick="window.switchBattleReadyTab('duel')" style="background: #ffffff; color: #475569; border-color: #cbd5e1;">
                            <i class="fas fa-bolt"></i> ⚔️ DUEL ARENA H2H
                        </button>
                    </div>

                    <!-- VIEW 1: ROSTER VIEW -->
                    <div id="battle-view-roster" style="display: block;">
                        <!-- SEARCH BAR & FILTER PILLS -->
                        <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 18px;">
                            <div style="position: relative; width: 100%;">
                                <i class="fas fa-search" style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: #64748b; font-size: 0.9rem;"></i>
                                <input type="text" id="battle-search-input" placeholder="Buscar jugador por nombre o nivel..." oninput="window.searchBattleReady(this.value)" 
                                       style="width: 100%; box-sizing: border-box; background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 14px; padding: 12px 16px 12px 44px; color: #0f172a; font-size: 0.85rem; font-weight: 800; outline: none; transition: all 0.2s; box-shadow: 0 2px 6px rgba(0,0,0,0.02);"
                                       onfocus="this.style.borderColor='#0284c7'; this.style.boxShadow='0 0 0 3px rgba(2,132,199,0.15)';"
                                       onblur="this.style.borderColor='#cbd5e1'; this.style.boxShadow='0 2px 6px rgba(0,0,0,0.02)';">
                            </div>

                            <div class="battle-pills-row">
                                <button id="battle-pill-all" class="battle-filter-pill active" onclick="window.filterBattleReady('all')">Todos (${totalPlayers + slotsLeft})</button>
                                <button id="battle-pill-pair" class="battle-filter-pill" onclick="window.filterBattleReady('pair')">Parejas (${pairsCount})</button>
                                <button id="battle-pill-solo" class="battle-filter-pill" onclick="window.filterBattleReady('solo')">Buscando Pareja 🔍 (${solosCount})</button>
                                <button id="battle-pill-vacant" class="battle-filter-pill" onclick="window.filterBattleReady('vacant')">Plazas Libres 🎟️ (${slotsLeft})</button>
                            </div>
                        </div>

                        <!-- HIGH DENSITY GRID -->
                        <div class="broadcast-grid" style="
                            display: grid; 
                            grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr)); 
                            gap: 14px; 
                            margin-bottom: 40px;
                        ">
                            ${cardsHtml}
                            ${vacantSlotsHtml}
                        </div>
                    </div>

                    <!-- VIEW 2: AI WAR ROOM PISTAS VIEW -->
                    <div id="battle-view-warroom" style="display: none; margin-bottom: 40px;">
                        <div style="background: #eff6ff; border: 1.5px solid #bfdbfe; border-radius: 16px; padding: 14px 18px; margin-bottom: 20px; display: flex; align-items: center; gap: 12px;">
                            <i class="fas fa-brain" style="font-size: 1.4rem; color: #0284c7;"></i>
                            <div style="font-size: 0.82rem; color: #1e293b; font-weight: 700;">
                                <b>Proyección Algorítmica de Pistas:</b> Los jugadores se asignan ordenados por ranking y nivel para asegurar la máxima competitividad en cada pista. Esta distribución es provisional hasta el inicio del evento.
                            </div>
                        </div>

                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(330px, 1fr)); gap: 16px;">
                            ${courtSimulationsHtml}
                        </div>
                    </div>

                    <!-- VIEW 3: 🎰 BATTLE ROULETTE / LIVE ROULETTE VIEW -->
                    <div id="battle-view-roulette" style="display: none; margin-bottom: 40px;">
                        <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 24px; padding: 26px 20px; text-align: center; position: relative; overflow: hidden; margin-bottom: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.04);">
                            
                            <!-- Confetti Particle Container -->
                            <div id="battle-roulette-confetti" style="position: absolute; inset: 0; pointer-events: none; overflow: hidden;"></div>

                            <div style="display: inline-flex; align-items: center; gap: 8px; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 5px 14px; border-radius: 20px; margin-bottom: 14px;">
                                <i class="fas fa-dharmachakra" style="color: #16a34a; font-size: 0.85rem;"></i>
                                <span style="font-size: 0.68rem; font-weight: 1000; color: #15803d; letter-spacing: 1px; text-transform: uppercase;">CINEMATIC DRAW ARENA</span>
                            </div>

                            <h2 style="margin: 0 0 6px 0; font-size: clamp(1.4rem, 3vw, 2rem); font-weight: 1000; color: #0f172a; text-transform: uppercase; letter-spacing: -0.5px;">
                                SORTEO CINEMÁTICO <span style="color: #0284c7;">EN VIVO</span>
                            </h2>
                            <p style="margin: 0 0 20px 0; color: #475569; font-size: 0.85rem; font-weight: 700; max-width: 600px; margin-left: auto; margin-right: auto;">
                                Gira la ruleta interactiva para generar el sorteo oficial con ambientación de audio y suspense en tiempo real.
                            </p>

                            <!-- SLOT DISPLAY SCREEN -->
                            <div style="max-width: 440px; margin: 0 auto 22px; background: #f8fafc; border: 2px solid #0284c7; border-radius: 20px; padding: 24px 18px; box-shadow: 0 4px 20px rgba(2,132,199,0.1); min-height: 160px; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                                <div id="battle-roulette-display">
                                    <div style="width: 72px; height: 72px; border-radius: 20px; background: #e0f2fe; border: 2px dashed #0284c7; display: flex; align-items: center; justify-content: center; color: #0284c7; font-size: 2rem; margin: 0 auto 10px;">
                                        <i class="fas fa-play"></i>
                                    </div>
                                    <div style="font-weight: 1000; font-size: 1.1rem; color: #0f172a; text-transform: uppercase;">¿LISTOS PARA EL SORTEO?</div>
                                    <div style="font-size: 0.75rem; color: #64748b; margin-top: 4px; font-weight: 800;">Pulsa el botón para iniciar el suspense</div>
                                </div>
                            </div>

                            <!-- ACTION SPIN BUTTON -->
                            <button id="battle-roulette-btn" onclick="window.startBattleRoulette()" style="
                                background: #0f172a;
                                color: #ffffff;
                                border: none;
                                padding: 15px 36px;
                                border-radius: 16px;
                                font-weight: 1000;
                                font-size: 0.95rem;
                                cursor: pointer;
                                display: inline-flex;
                                align-items: center;
                                gap: 10px;
                                letter-spacing: 0.5px;
                                box-shadow: 0 6px 20px rgba(15,23,42,0.2);
                                transition: transform 0.2s;
                            " onmouseover="this.style.transform='scale(1.03)';" onmouseout="this.style.transform='scale(1)';">
                                <i class="fas fa-dice" style="color: #38bdf8;"></i> 🎲 INICIAR SORTEO CINEMÁTICO
                            </button>
                        </div>

                        <!-- RESULTS OF ROULETTE DRAW -->
                        <div id="battle-roulette-results" style="display: none;"></div>
                    </div>

                    <!-- VIEW 4: ⚔️ AI DUEL ARENA / CARA A CARA (H2H) VIEW -->
                    <div id="battle-view-duel" style="display: none; margin-bottom: 40px;">
                        <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 24px; padding: 24px 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.04); margin-bottom: 24px;">
                            
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
                                <div>
                                    <div style="display: inline-flex; align-items: center; gap: 8px; background: #f0f9ff; border: 1px solid #bfdbfe; padding: 4px 12px; border-radius: 20px; margin-bottom: 6px;">
                                        <i class="fas fa-crosshairs" style="color: #0284c7; font-size: 0.75rem;"></i>
                                        <span style="font-size: 0.65rem; font-weight: 1000; color: #0284c7; letter-spacing: 1px;">HEAD TO HEAD SIMULATOR</span>
                                    </div>
                                    <h2 style="margin: 0; font-size: clamp(1.3rem, 3vw, 1.8rem); font-weight: 1000; color: #0f172a; text-transform: uppercase;">
                                        SIMULADOR DE DUELOS <span style="color: #0284c7;">H2H</span>
                                    </h2>
                                </div>
                                <div style="font-size: 0.75rem; color: #64748b; font-weight: 800;">
                                    Compara 2 jugadores con atributos calculados por IA
                                </div>
                            </div>

                            <!-- PLAYER SELECTORS -->
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 20px;">
                                <div>
                                    <label style="font-size: 0.7rem; color: #0284c7; font-weight: 950; text-transform: uppercase; margin-bottom: 6px; display: block; letter-spacing: 0.5px;">LUCHADOR 1 (AZUL):</label>
                                    <select id="duel-player-1-select" onchange="window.updateBattleDuel()" style="width: 100%; box-sizing: border-box; background: #ffffff; border: 1.5px solid #0284c7; border-radius: 12px; color: #0f172a; padding: 11px; font-weight: 900; font-size: 0.85rem; outline: none; box-shadow: 0 2px 6px rgba(0,0,0,0.03);">
                                        ${dbPlayers.map((p, i) => `<option value="${p.id || p.uid}" ${i === 0 ? 'selected' : ''}>${p.name} (LVL ${parseFloat(p.level || 3.5).toFixed(2)})</option>`).join('')}
                                    </select>
                                </div>
                                <div>
                                    <label style="font-size: 0.7rem; color: #16a34a; font-weight: 950; text-transform: uppercase; margin-bottom: 6px; display: block; letter-spacing: 0.5px;">LUCHADOR 2 (VERDE):</label>
                                    <select id="duel-player-2-select" onchange="window.updateBattleDuel()" style="width: 100%; box-sizing: border-box; background: #ffffff; border: 1.5px solid #16a34a; border-radius: 12px; color: #0f172a; padding: 11px; font-weight: 900; font-size: 0.85rem; outline: none; box-shadow: 0 2px 6px rgba(0,0,0,0.03);">
                                        ${dbPlayers.map((p, i) => `<option value="${p.id || p.uid}" ${i === (dbPlayers.length > 1 ? 1 : 0) ? 'selected' : ''}>${p.name} (LVL ${parseFloat(p.level || 3.5).toFixed(2)})</option>`).join('')}
                                    </select>
                                </div>
                            </div>

                            <!-- DYNAMIC COMPARISON CARD -->
                            <div id="duel-comparison-card"></div>
                        </div>
                    </div>

                    <!-- FOOTER CLOSE BUTTON -->
                    <div style="display: flex; justify-content: center; gap: 20px; padding-bottom: 40px;">
                        <button onclick="window.closeBattleReadyModal()" 
                                style="background: #0f172a; color: #ffffff; border: 2px solid #0f172a; padding: 14px 45px; border-radius: 14px; font-weight: 950; cursor: pointer; text-transform: uppercase; font-size: 0.85rem; box-shadow: 0 4px 15px rgba(15,23,42,0.15); transition: all 0.2s;"
                                onmouseover="this.style.background='#1e293b';"
                                onmouseout="this.style.background='#0f172a';">
                            CERRAR VISTA
                        </button>
                    </div>
                </div>

                <!-- TICKER INFERIOR MARQUEE -->
                <div style="position: fixed; bottom: 0; left: 0; width: 100%; height: 38px; background: #0f172a; border-top: 1px solid #1e293b; display: flex; align-items: center; overflow: hidden; z-index: 30001; box-shadow: 0 -4px 20px rgba(0,0,0,0.15);">
                    <div class="scrolling-text" style="white-space: nowrap; font-weight: 900; font-size: 0.78rem; color: #ffffff; text-transform: uppercase; letter-spacing: 0.5px;">
                        ${dbPlayers.map(p => `• <span style="color: #ffffff;">${p.name}</span> (<span style="color: #38bdf8;">LVL ${p.level || 3.5}</span>)`).join('  &nbsp;&nbsp;&nbsp;&nbsp;  ')} 
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

                card.setAttribute('onclick', cardAction);

                const fab = document.getElementById(`event-fab-${evt.id}`);
                const fabLabel = document.getElementById(`event-fab-label-${evt.id}`);
                const fabIcon = document.getElementById(`event-fab-icon-${evt.id}`);

                let ctaBg = '#CCFF00';
                let ctaTextColor = '#000000';
                let ctaShadow = '0 6px 18px rgba(204, 255, 0, 0.45)';

                if (isLive) {
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
                    if (fabLabel && fabLabel.innerText !== btnLabel) {
                        fabLabel.innerText = btnLabel;
                    }
                    fab.setAttribute('onclick', `event.stopPropagation(); ${fabAction}`);
                    fab.style.setProperty('background', ctaBg, 'important');
                    fab.style.setProperty('color', ctaTextColor, 'important');
                    fab.style.boxShadow = ctaShadow;
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
})();
