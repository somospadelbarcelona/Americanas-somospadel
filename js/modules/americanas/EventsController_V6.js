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
                    category: 'all'
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
            console.log("🤖 [EventsController] Starting Background Automation Service...");
            this.state.bgInitialized = true;

            // 1. Data Listeners - Use a simpler query to be more robust
            this.unsubscribeEvents = window.db.collection('americanas')
                .onSnapshot(snap => {
                    this.state.americanas = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                    this.onDataUpdate();
                }, err => console.error("Error loading americanas:", err));

            this.unsubscribeEntrenos = window.db.collection('entrenos')
                .onSnapshot(snap => {
                    this.state.entrenos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                    this.onDataUpdate();
                }, err => console.error("Error loading entrenos:", err));

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

            return `
                <div class="filters-container" style="padding: 10px 15px 20px; display: flex; flex-direction: column; gap: 12px; background: transparent;">
                    <!-- Month Filters -->
                    <div style="display: flex; gap: 10px; overflow-x: auto; padding-bottom: 5px; -webkit-overflow-scrolling: touch; scrollbar-width: none;">
                        <button onclick="window.EventsController.setFilter('month', 'all')" 
                                style="white-space: nowrap; padding: 8px 18px; border-radius: 14px; font-size: 0.7rem; font-weight: 900; border: 1px solid ${currentMonth === 'all' ? '#0f172a' : '#e2e8f0'}; cursor: pointer; transition: all 0.2s; 
                                ${currentMonth === 'all' ? 'background: #0f172a; color: #fff;' : 'background: #fff; color: #64748b;'}">TODO</button>
                        ${months.map(m => {
                const [year, month] = m.split('-');
                const label = `${monthLabels[month]} '${year.slice(2)}`;
                const isActive = currentMonth === m;
                return `<button onclick="window.EventsController.setFilter('month', '${m}')" style="white-space: nowrap; padding: 8px 18px; border-radius: 14px; font-size: 0.7rem; font-weight: 900; border: 1px solid ${isActive ? '#0f172a' : '#e2e8f0'}; cursor: pointer; transition: all 0.2s; ${isActive ? 'background: #0f172a; color: #fff;' : 'background: #fff; color: #64748b;'}">${label}</button>`;
            }).join('')}
                    </div>
                    <!-- Category Filters -->
                    <div style="display: flex; gap: 10px; overflow-x: auto; padding-bottom: 5px; -webkit-overflow-scrolling: touch; scrollbar-width: none;">
                        <button onclick="window.EventsController.setFilter('category', 'all')" style="white-space: nowrap; padding: 8px 18px; border-radius: 14px; font-size: 0.7rem; font-weight: 900; border: 1px solid ${currentCat === 'all' ? '#84cc16' : '#e2e8f0'}; cursor: pointer; transition: all 0.2s; ${currentCat === 'all' ? 'background: #84cc16; color: #fff;' : 'background: #fff; color: #64748b;'}">TODAS</button>
                        <button onclick="window.EventsController.setFilter('category', 'male')" style="white-space: nowrap; padding: 8px 18px; border-radius: 14px; font-size: 0.7rem; font-weight: 900; border: 1px solid ${currentCat === 'male' ? '#0ea5e9' : '#e2e8f0'}; cursor: pointer; transition: all 0.2s; ${currentCat === 'male' ? 'background: #0ea5e9; color: #fff;' : 'background: #fff; color: #64748b;'}">MASCULINO</button>
                        <button onclick="window.EventsController.setFilter('category', 'female')" style="white-space: nowrap; padding: 8px 18px; border-radius: 14px; font-size: 0.7rem; font-weight: 900; border: 1px solid ${currentCat === 'female' ? '#ec4899' : '#e2e8f0'}; cursor: pointer; transition: all 0.2s; ${currentCat === 'female' ? 'background: #ec4899; color: #fff;' : 'background: #fff; color: #64748b;'}">FEMENINO</button>
                        <button onclick="window.EventsController.setFilter('category', 'mixed')" style="white-space: nowrap; padding: 8px 18px; border-radius: 14px; font-size: 0.7rem; font-weight: 900; border: 1px solid ${currentCat === 'mixed' ? '#84cc16' : '#e2e8f0'}; cursor: pointer; transition: all 0.2s; ${currentCat === 'mixed' ? 'background: #84cc16; color: #fff;' : 'background: #fff; color: #64748b;'}">MIXTA</button>
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

            // Cleanup open matches synchronization if switching away from open_matches
            if (tabName !== 'open_matches' && window.OpenMatchesController) {
                window.OpenMatchesController.destroy();
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

            const tabs = [
                { id: 'entrenos', label: 'ENTRENOS', icon: 'fa-user-ninja' },
                { id: 'events', label: 'AMERICANAS', icon: 'fa-trophy' },
                { id: 'open_matches', label: 'PARTIDAS ABIERTAS', icon: 'fa-table-tennis-paddle-ball' },
                { id: 'agenda', label: 'AGENDA', icon: 'fa-circle' },
                { id: 'help', label: 'INFO', icon: 'fa-info-circle' },
                { id: 'finished', label: 'FINALIZADOS', icon: 'fa-history' }
            ];

            const navHtml = `
                <style>
                    @keyframes esm-ripple {
                        0%   { transform: translate(-50%,-50%) scale(0); opacity: 0.5; }
                        100% { transform: translate(-50%,-50%) scale(4); opacity: 0; }
                    }
                    @keyframes esm-bounce {
                        0%   { transform: scale(1); }
                        30%  { transform: scale(0.82); }
                        60%  { transform: scale(1.12); }
                        80%  { transform: scale(0.96); }
                        100% { transform: scale(1); }
                    }
                    @keyframes esm-label-pop {
                        0%   { letter-spacing:0.3px; }
                        50%  { letter-spacing:2px; }
                        100% { letter-spacing:0.3px; }
                    }
                    .esm-btn { position:relative; overflow:hidden; }
                    .esm-btn:active .esm-icon-box { animation: esm-bounce 0.42s cubic-bezier(0.22,1,0.36,1); }
                    .esm-ripple-el {
                        position:absolute; width:50px; height:50px;
                        background:rgba(0,0,0,0.18); border-radius:50%;
                        pointer-events:none;
                        animation: esm-ripple 0.55s ease-out forwards;
                    }
                </style>
                <div class="events-submenu-container" style="
                    background: #CCFF00;
                    padding: 8px 4px 6px;
                    border-bottom: 3px solid rgba(0,0,0,0.12);
                    margin-bottom: 0;
                    display: flex;
                    justify-content: space-around;
                    box-shadow: 0 6px 20px rgba(0,0,0,0.35);
                    position: sticky;
                    top: 108px;
                    z-index: 9500;
                ">
                    ${tabs.map(tab => {
                const isActive = this.state.activeTab === tab.id;
                const isPadelBall = tab.id === 'agenda';

                return `
                <button class="esm-btn"
                    onclick="(function(btn){
                        var r=document.createElement('span');
                        r.className='esm-ripple-el';
                        r.style.left='50%'; r.style.top='50%';
                        btn.appendChild(r);
                        setTimeout(()=>r.remove(),600);
                        window.EventsController.setTab('${tab.id}');
                    })(this)"
                    style="background: transparent; border: none; display: flex; flex-direction: column; align-items: center; gap: 5px; color: ${isActive ? '#000' : 'rgba(0,0,0,0.45)'}; font-weight: 900; padding: 6px 4px 4px; font-size: 0.52rem; cursor: pointer; transition: color 0.18s; flex: 1; letter-spacing: 0.3px; min-width: 0;">

                    <div class="esm-icon-box" style="
                        width: 40px; height: 40px; border-radius: 12px;
                        background: ${isActive ? '#000' : 'rgba(0,0,0,0.08)'};
                        display: flex; align-items: center; justify-content: center;
                        border: none;
                        transition: background 0.2s, transform 0.2s;
                        margin-bottom: 1px;
                    ">
                        ${isPadelBall ?
                        `<div style="width:20px;height:20px;background:${isActive?'#CCFF00':'rgba(0,0,0,0.55)'};border-radius:50%;position:relative;border:2px solid ${isActive?'#000':'transparent'};">
                            <div style="position:absolute;top:20%;left:10%;width:80%;height:60%;border:1.5px solid rgba(0,0,0,0.25);border-radius:50%;border-top:none;border-bottom:none;"></div>
                         </div>` :
                        `<i class="fas ${tab.icon}" style="font-size: 1rem; color: ${isActive ? '#CCFF00' : 'rgba(0,0,0,0.6)'};"></i>`
                    }
                    </div>

                    <span style="text-transform:uppercase;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;width:100%;text-align:center;
                        ${isActive ? 'animation: esm-label-pop 0.4s ease;' : ''}">
                        ${tab.label}
                    </span>
                    ${isActive ? `<div style="width:18px;height:3px;background:#000;border-radius:10px;margin-top:1px;"></div>` : ''}
                </button>
                `}).join('')}
                </div>
            `;

            let contentHtml = '';
            if (this.state.loading) {
                contentHtml = '<div style="padding: 100px; text-align: center;"><div class="loader"></div><p style="margin-top:20px; font-weight:900; letter-spacing:2px;">CARGANDO AMERICANAS...</p></div>';
            } else {
                switch (this.state.activeTab) {
                    case 'events': contentHtml = this.renderEventsList(false, false); break;
                    case 'entrenos': contentHtml = this.renderEventsList(false, true); break;
                    case 'open_matches': contentHtml = '<div id="events-tab-content" style="min-height: 80vh;"></div>'; break;
                    case 'agenda': contentHtml = this.renderAgendaView(); break;
                    case 'results': contentHtml = await this.renderResultsView(); break;
                    case 'finished': contentHtml = this.renderFinishedView(); break;
                    case 'help': contentHtml = window.ControlTowerView ? window.ControlTowerView.renderHelpContent() : '<div style="padding:40px; color:white;">Cargando ayuda...</div>'; break;
                }
            }

            container.innerHTML = `<div class="fade-in">${navHtml}${contentHtml}</div>`;

            // TRIGGER ASYNC CONTENT
            this.loadGeoRadarWidget();
            if (this.state.activeTab === 'open_matches') {
                if (window.OpenMatchesView && window.OpenMatchesController) {
                    window.OpenMatchesView.containerId = 'events-tab-content';
                    window.OpenMatchesView.renderLayout();
                    window.OpenMatchesController.init();
                }
            }
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
                    if (category === 'male') return cat === 'male' || cat === 'masculina';
                    if (category === 'female') return cat === 'female' || cat === 'femenina';
                    if (category === 'mixed') return cat === 'mixed' || cat === 'mixta' || cat === 'mixto';
                    return cat === category;
                });
            }

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
                    <div style="padding: 20px 20px 16px; display: flex; justify-content: space-between; align-items: center; background: #ffffff; border-radius: 24px; margin: 15px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); border: 1px solid #e2e8f0; position: relative; overflow: hidden;">
                        <!-- Subtle accent line -->
                        <div style="position:absolute; top:0; left:0; width:100%; height:4px; background: linear-gradient(90deg, #72a800, #a3d900); border-radius:24px 24px 0 0;"></div>
                        <div style="display: flex; align-items: center; gap: 14px; position: relative; z-index: 1;">
                            <div style="width: 48px; height: 48px; background: #f1f5f9; border: 2px solid #e2e8f0; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
                                🎾
                            </div>
                            <div>
                                <h2 style="font-size: 1.1rem; font-weight: 950; margin: 0; color: #0a192f; letter-spacing: -0.5px;">Eventos <span style="color: #72a800;">SomosPadel BCN</span></h2>
                                <p style="color: #64748b; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin: 3px 0 0;">Inscripción en tiempo real</p>
                            </div>
                        </div>
                        <div style="background: #f1f5f9; padding: 8px 16px; border-radius: 14px; border: 1px solid #e2e8f0; color: #0a192f; font-weight: 950; display:flex; align-items:center; gap:6px; font-size:1rem;"><span style="color:#72a800; font-size:0.7rem; font-weight:900;">TOTAL</span> ${events.length}</div>
                    </div>
                    ${filterBarHtml}
                    <div style="padding-bottom: 80px; padding-left:10px; padding-right:10px;">
                        ${events.length === 0 ? `<div style="padding:100px 40px; text-align:center; color:#444;"><i class="fas fa-filter" style="font-size: 4rem; opacity: 0.1;"></i><h3 style="color:#666;">SIN RESULTADOS</h3></div>` : eventsHtml}
                        <div style="margin-top: 25px; display: flex; flex-direction: column; align-items: center; padding-bottom: 20px; gap: 20px;">
                            
                            <!-- GEOLOCALIZACIÓN RADAR -->
                            <div id="geo-radar-root" style="width: 100%; max-width: 500px; margin: 5px auto; animation: floatUp 0.8s ease-out forwards;">
                                <!-- Cargado vía JS -->
                            </div>

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

        renderAgendaView() {
            const uid = this.state.currentUser ? this.state.currentUser.uid : null;
            if (!uid) return `<div style="text-align:center; padding:80px 20px; color:#888;"><i class="fas fa-lock" style="font-size:3rem; margin-bottom:15px; opacity:0.1;"></i><br><h3 style="color:#64748b;">ACCESO RESTRINGIDO</h3><p style="font-size:0.85rem;">Inicia sesión para ver tu agenda.</p></div>`;

            const todayStr = this.getTodayStr();
            const myEvents = this.getAllSortedEvents().filter(e => {
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

        renderFinishedView() {
            const todayStr = this.getTodayStr();
            const { month, category } = this.state.filters;
            
            // ✅ Logic: Archive includes explicitly finished/cancelled events OR events that have passed the today marker
            let finishedEvents = this.getAllSortedEvents().filter(e => {
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
                        <h2 style="font-size: 2.2rem; font-weight: 950; color: #0a192f; margin: 0; line-height: 1; letter-spacing: -1px;">EVENTOS <span style="color: #72a800;">PASADOS</span></h2>
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
            const isLive = evt.status === 'live' || (evt.status === 'open' && hasStarted);
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

            // Prices
            const priceSoc = evt.price_members || evt.price_socio || evt.price_member || '20€';
            const priceExt = evt.price_external || evt.price_externo || evt.price_external || '25€';

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

            // Gender Check
            const userGender = user ? (user.gender || '').toLowerCase() : '';
            const isChico = userGender === 'm' || userGender === 'chico' || userGender === 'male';
            const isChica = userGender === 'f' || userGender === 'chica' || userGender === 'female';
            const cat = (evt.category || 'open').toLowerCase();
            let isGenderMismatch = false, mismatchCase = '';
            if ((cat === 'male' || cat === 'masculina') && !isChico) { isGenderMismatch = true; mismatchCase = 'male'; }
            if ((cat === 'female' || cat === 'femenina') && !isChica) { isGenderMismatch = true; mismatchCase = 'female'; }

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
                btnLabel = 'LISTA ESPERA'; btnIcon = 'fa-clock'; btnColor = '#eab308';
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
            
            // Estilos específicos para entrenos
            const cardBg = isEntreno ? 'linear-gradient(145deg, #18112b 0%, #0c0914 100%)' : '#141414';
            const cardBorder = isEntreno ? '1px solid rgba(139, 92, 246, 0.15)' : '1px solid rgba(255,255,255,0.04)';
            const cardGlow = isEntreno ? '0 20px 40px rgba(0,0,0,0.8), 0 0 25px rgba(139, 92, 246, 0.1)' : '0 20px 40px rgba(0,0,0,0.6)';
            const tileClass = isEntreno ? 'entreno-tile-interactive' : 'premium-tile-interactive';
            const cardClass = isEntreno ? 'entreno-premium-card' : '';
            
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

            // Analizar e integrar feedback de nivel (solo para Entrenos)
            const levelMatch = evt.name.match(/\b[1-7]\.[0-9]\b/);
            let levelBadgeHtml = '';
            let levelFeedbackHtml = '';
            if (levelMatch) {
                levelBadgeHtml = `<span style="background: rgba(255,255,255,0.08); color: #fff; padding: 4px 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); font-size: 0.6rem; font-weight: 700; backdrop-filter: blur(4px); display: inline-flex; align-items: center; gap: 4px;"><i class="fas fa-graduation-cap"></i> NIVEL ${levelMatch[0]}</span>`;
                
                if (user && user.level) {
                    const eventLvl = parseFloat(levelMatch[0]);
                    const userLvl = parseFloat(user.level);
                    const diff = Math.abs(userLvl - eventLvl);
                    if (diff <= 0.35) {
                        levelFeedbackHtml = `<span style="background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.3); padding: 4px 10px; border-radius: 8px; font-size: 0.6rem; font-weight: 900; backdrop-filter: blur(4px); display: inline-flex; align-items: center; gap: 4px;"><i class="fas fa-check-circle"></i> ¡TU NIVEL!</span>`;
                    } else if (userLvl > eventLvl) {
                        levelFeedbackHtml = `<span style="background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); padding: 4px 10px; border-radius: 8px; font-size: 0.6rem; font-weight: 900; backdrop-filter: blur(4px); display: inline-flex; align-items: center; gap: 4px;"><i class="fas fa-angle-double-up"></i> NIVEL FÁCIL</span>`;
                    } else {
                        levelFeedbackHtml = `<span style="background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); padding: 4px 10px; border-radius: 8px; font-size: 0.6rem; font-weight: 900; backdrop-filter: blur(4px); display: inline-flex; align-items: center; gap: 4px;"><i class="fas fa-exclamation-triangle"></i> EXIGENTE</span>`;
                    }
                }
            }

            return `
                <div id="event-card-${evt.id}" class="${cardClass}" onclick="${cardAction}" style="
                    background: ${cardBg};
                    border-radius: 24px;
                    overflow: hidden;
                    margin-bottom: 18px;
                    border: ${cardBorder};
                    box-shadow: ${cardGlow};
                    font-family: 'Outfit', sans-serif;
                    position: relative;
                ">
                    <!-- HEADER STRIPE -->
                    <div style="height: 4px; background: ${themeColor}; opacity: 0.9;"></div>

                    <div style="display: flex; flex-direction: column;">
                        
                        <!-- IMAGE AREA -->
                        <div style="height: 140px; background: url('${(evt.image_url || 'img/padel-event.jpg').replace(/ /g, '%20')}') no-repeat center/cover; position: relative;">
                            <div style="position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(20,20,20,0.1), #141414); mix-blend-mode: overlay;"></div>
                            <div style="position: absolute; inset: 0; background: linear-gradient(to top, #141414 2%, transparent 70%);"></div>
                            
                            <!-- FLOATING BADGES -->
                            <div style="position: absolute; top: 12px; left: 12px; display: flex; gap: 8px;">
                                <div style="background: rgba(20,20,20,0.6); width: 48px; height: 52px; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.08); backdrop-filter: blur(10px);">
                                    <span style="font-size: 0.55rem; font-weight: 800; color: #94a3b8; text-transform: uppercase;">${dayName}</span>
                                    <span style="font-size: 1.3rem; font-weight: 900; color: #fff; line-height: 1;">${dayNum}</span>
                                </div>
                            </div>

                            <div style="position: absolute; top: 12px; right: 12px; background: rgba(20,20,20,0.7); border-radius: 10px; padding: 6px 12px; border: 1px solid rgba(255,255,255,0.08); color: #fff; font-size: 0.8rem; font-weight: 900; display: flex; align-items: center; backdrop-filter: blur(10px);">
                                <span style="color: #CCFF00;">${priceSoc}€</span>
                            </div>

                            <div style="position: absolute; bottom: 12px; left: 12px; display: flex; flex-wrap: wrap; align-items: center; gap: 6px; z-index: 5;">
                                ${isEntreno ? `
                                    <span style="background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%); color: #fff; padding: 4px 10px; border-radius: 8px; font-size: 0.6rem; font-weight: 900; text-transform: uppercase; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.45); display: inline-flex; align-items: center; gap: 4px;"><i class="fas fa-user-ninja"></i> ACADEMIA PRO</span>
                                    ${isTwister ? 
                                        `<span style="background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%); color: #fff; padding: 4px 10px; border-radius: 8px; font-size: 0.6rem; font-weight: 900; text-transform: uppercase; box-shadow: 0 4px 10px rgba(6, 182, 212, 0.3); display: inline-flex; align-items: center; gap: 4px;"><i class="fas fa-wind"></i> TWISTER INDIVIDUAL</span>` :
                                        `<span style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: #fff; padding: 4px 10px; border-radius: 8px; font-size: 0.6rem; font-weight: 900; text-transform: uppercase; box-shadow: 0 4px 10px rgba(236, 72, 153, 0.3); display: inline-flex; align-items: center; gap: 4px;"><i class="fas fa-lock"></i> PAREJA FIJA</span>`
                                    }
                                    ${levelBadgeHtml}
                                    ${levelFeedbackHtml}
                                ` : `
                                    <span style="background: ${themeColor}; color: #000; padding: 4px 10px; border-radius: 8px; font-size: 0.6rem; font-weight: 900; text-transform: uppercase; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">${formatLabel}</span>
                                    <span style="background: rgba(255,255,255,0.1); color: #fff; padding: 4px 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); font-size: 0.6rem; font-weight: 700; backdrop-filter: blur(4px);">${maxCourts} PISTAS</span>
                                `}
                            </div>

                            <!-- ACTION BUTTON (FAB) -->
                            <div id="event-fab-${evt.id}" onclick="event.stopPropagation(); ${fabAction}" style="position: absolute; bottom: -20px; right: 16px; width: 54px; height: 54px; background: ${btnColor === '#fff' ? '#CCFF00' : btnColor}; color: ${btnColor === '#fff' ? '#000' : 'white'}; border-radius: 16px; border: 3px solid #141414; box-shadow: 0 8px 15px rgba(0,0,0,0.4); display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; z-index: 10; transform: rotate(-3deg); transition: transform 0.2s; ${isLive ? 'animation: pulse-border 2s infinite;' : ''}">
                                <i class="fas ${btnIcon}" style="font-size: 1.1rem;"></i>
                            </div>
                        </div>

                        <!-- CONTENT AREA -->
                        <div style="padding: 30px 18px 18px;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                                <h3 style="margin: 0; font-size: 1.25rem; font-weight: 950; color: #fff; line-height: 1.1; letter-spacing: -0.5px; text-transform: uppercase;">${evt.name}</h3>
                            </div>
                            
                            <!-- 💎 THE 4 PREMIUM TILES (UNIFIED LIGHT THEME) -->
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
                                <!-- Time Tile -->
                                <div class="${tileClass}" style="background: rgba(255,255,255,0.08); border-radius: 14px; padding: 10px; display: flex; align-items: center; gap: 10px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                                    <div style="width: 28px; height: 28px; background: ${timeIconBg}; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                                        <i class="far fa-clock" style="color: ${timeIconColor}; font-size: 0.85rem;"></i>
                                    </div>
                                    <span style="font-weight: 900; font-size: 0.85rem; color: #eee;">${timeLabel}</span>
                                </div>
                                <!-- Category Tile -->
                                <div class="${tileClass}" style="background: rgba(255,255,255,0.08); border-radius: 14px; padding: 10px; display: flex; align-items: center; gap: 10px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                                    <div style="width: 28px; height: 28px; background: ${categoryColor}20; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                                        <i class="fas ${categoryIcon}" style="color: ${categoryColor}; font-size: 0.85rem;"></i>
                                    </div>
                                    <span style="font-weight: 900; font-size: 0.85rem; color: #eee; text-transform: uppercase;">${categoryLabel}</span>
                                </div>
                            </div>

                            <!-- CAPACITY & PROGRESS (LIGHT THEME) -->
                            <div class="${tileClass}" onclick="event.stopPropagation(); window.EventsController.showInscritosModal('${evt.id}', '${evt.type || 'americana'}')" style="background: rgba(255,255,255,0.08); border-radius: 16px; padding: 12px; border: 1px solid rgba(255,255,255,0.1); cursor: pointer; position: relative; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.2); margin-bottom: 12px;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; position: relative;">
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <i class="fas fa-users" style="color: ${capacityIconColor}; font-size: 0.9rem;"></i>
                                        <span style="font-weight: 950; font-size: 0.95rem; color: #fff;">${playerCount} <small style="color:#666;">/ ${maxPlayers}</small></span>
                                    </div>
                                    <span style="font-size: 0.65rem; font-weight: 950; color: ${isFull ? '#FF3B30' : (isEntreno ? '#a855f7' : '#CCFF00')}; text-transform: uppercase; letter-spacing: 0.5px;">${isFull ? 'COMPLETO' : 'DISPONIBLE'}</span>
                                </div>
                                <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.06); border-radius: 10px; overflow: hidden;">
                                    <div style="width: ${progress}%; height: 100%; background: ${progressColor}; box-shadow: 0 0 10px ${progressColor}55;"></div>
                                </div>
                                ${waitlist.length > 0 ? `<div style="margin-top: 5px; font-size: 0.65rem; font-weight: 900; color: #eab308; text-transform: uppercase;">+${waitlist.length} EN ESPERA</div>` : ''}
                            </div>

                            <!-- 📍 SUPER CHULO FOOTER (LIGHT LOCATION + PREMIUM STATUS) -->
                            <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 5px; gap: 10px;">
                                <!-- Location Box (Light Theme + Interactive) -->
                                <div class="${tileClass}" onclick="event.stopPropagation(); window.PremiumModal.alert({ title: '📍 UBICACIÓN', message: 'Sede: ${evt.sede || evt.location || 'Barcelona Pádel el Prat'}<br><br>Este evento se disputa en las instalaciones oficiales del club.', type: 'info' })" 
                                     style="display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.08); padding: 10px 14px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.1); flex: 1; min-width: 0; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                                    <div style="width: 32px; height: 32px; background: ${locIconBg}; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                        <i class="fas fa-map-marker-alt" style="color: ${locIconColor}; font-size: 0.9rem;"></i>
                                    </div>
                                    <div style="display: flex; flex-direction: column; min-width: 0;">
                                        <span style="font-size: 0.55rem; font-weight: 800; color: #888; text-transform: uppercase; letter-spacing: 1px;">Sede Oficial</span>
                                        <span style="font-size: 0.85rem; font-weight: 950; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${evt.sede || evt.location || 'Bcn Pádel'}</span>
                                    </div>
                                </div>

                                <!-- 🔥 DYNAMIC STATUS BADGE -->
                                <div style="position: relative; flex-shrink: 0;">
                                    ${isLive ? `<div style="position: absolute; inset: -4px; border-radius: 16px; background: #FF2D55; opacity: 0.4; animation: status-breathe 1.2s ease-in-out infinite; filter: blur(6px);"></div>` : ''}
                                    ${!isLive && !isCancelled && !isFinished ? `<div style="position: absolute; inset: -3px; border-radius: 16px; background: ${isEntreno ? '#a855f7' : '#CCFF00'}; opacity: 0.3; animation: status-breathe 2s ease-in-out infinite; filter: blur(5px);"></div>` : ''}
                                    <div style="
                                        position: relative;
                                        background: ${statusBg};
                                        color: ${statusColorText};
                                        padding: 10px 18px;
                                        border-radius: 14px;
                                        font-size: 0.7rem;
                                        font-weight: 950;
                                        text-transform: uppercase;
                                        letter-spacing: 1.5px;
                                        display: flex;
                                        align-items: center;
                                        gap: 8px;
                                        box-shadow: 0 6px 20px ${statusGlowColor};
                                        ${isLive ? 'animation: status-shake 0.5s ease-in-out infinite alternate;' : ''}
                                    ">
                                        <i class="fas ${isLive ? 'fa-broadcast-tower' : (isCancelled ? 'fa-skull-crossbones' : (isFinished ? 'fa-flag-checkered' : 'fa-bolt'))}" style="
                                            font-size: 0.75rem;
                                            ${isLive ? 'animation: status-dot-ping 0.8s ease-in-out infinite; text-shadow: 0 0 8px #fff;' : (!isFinished && !isCancelled ? 'animation: status-dot-ping 1.5s ease-in-out infinite; text-shadow: 0 0 6px #000;' : 'opacity: 0.6;')}
                                        "></i>
                                        ${isLive ? 'EN VIVO' : (isCancelled ? 'ANULADO' : (isFinished ? 'FINALIZADO' : 'ABIERTA'))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
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
                    
                    if (res.success && window.confetti) {
                        window.confetti({
                            particleCount: 150,
                            spread: 100,
                            origin: { y: 0.6 },
                            colors: ['#CCFF00', '#38bdf8', '#ffffff']
                        });
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
                window.PremiumModal.alert({
                    title: "ℹ️ INFO",
                    message: res.success ? "Has salido de la lista de espera." : "Error: " + res.error
                });
            } catch (err) {
                console.error("Error leaving waitlist:", err);
            }
        }

        async showInscritosModal(id, type) {
            const localEvents = type === 'entreno' ? this.state.entrenos : this.state.americanas;
            let evt = localEvents.find(e => e.id === id);
            if (!evt) return;

            let modal = document.getElementById('inscritos-modal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'inscritos-modal';
                document.body.appendChild(modal);
            }
            modal.style.cssText = `position: fixed; inset: 0; background: #000; z-index: 30000; overflow-y: auto; font-family: 'Outfit', sans-serif; color: white; display: flex; flex-direction: column;`;
            modal.innerHTML = `
<div style="padding: 100px; text-align: center;"><div class="loader"></div><p style="margin-top:20px; font-weight:900; letter-spacing:2px;">CARGANDO JUGADORES...</p></div>
            `;
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

            modal.innerHTML = `
<div style="padding: 100px; text-align: center;"><div class="loader"></div><p style="margin-top:20px; font-weight:900; letter-spacing:2px;">CARGANDO BASE DE DATOS...</p></div>
            `;

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

            const renderNeonPlayer = (player, badgeText, badgeColor = '#CCFF00') => {
                const photo = player.photo_url || player.photoURL || 'img/logo_somospadel.png';
                const level = parseFloat(player.level || 3.5).toFixed(2);
                const teams = Array.isArray(player.team_somospadel) ? player.team_somospadel : (player.team_somospadel ? [player.team_somospadel] : []);

                return `
                    <div style="display: flex; align-items: center; gap: 15px; padding: 12px; position: relative;">
                        <div style="width: 50px; height: 50px; border-radius: 12px; background: url('${photo}') center/cover; border: 2px solid ${badgeColor}; box-shadow: 0 0 15px ${badgeColor}44;"></div>
                        <div style="flex: 1; min-width: 0;">
                            <div style="font-weight: 950; font-size: 0.95rem; color: #fff; text-transform: uppercase;">${player.name}</div>
                            <div style="display: flex; align-items: center; gap: 8px; margin-top: 3px;">
                                <span style="color: ${badgeColor}; font-weight: 950; font-size: 0.75rem;">${level} <small style="opacity: 0.6;">LVL</small></span>
                                ${teams.length > 0 ? `<span style="background: rgba(255,255,255,0.1); color: #ccc; font-size: 0.55rem; padding: 2px 6px; border-radius: 4px;">${teams[0].toUpperCase()}</span>` : ''}
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div style="background: ${badgeColor}; color: #000; font-size: 0.55rem; font-weight: 950; padding: 2px 8px; border-radius: 4px;">${badgeText}</div>
                        </div>
                    </div>
                `;
            };

            const cardsHtml = finalGroups.map((group, idx) => {
                if (group.type === 'pair') {
                    return `
                    <div class="neon-pair-card" style="
                        background: linear-gradient(135deg, rgba(15,23,42,0.9) 0%, rgba(0,0,0,1) 100%);
                        border: 2px solid #38bdf8;
                        border-radius: 20px;
                        padding: 5px;
                        position: relative;
                        overflow: hidden;
                        box-shadow: 0 0 25px rgba(56, 189, 248, 0.2);
                        margin-bottom: 15px;
                    ">
                        <div style="position: absolute; top: 0; right: 0; background: #38bdf8; color: #000; font-size: 0.55rem; font-weight: 1000; padding: 3px 15px; border-bottom-left-radius: 12px; text-transform: uppercase; letter-spacing: 1px; z-index: 10;">EQUIPO CONFIRMADO</div>
                        ${renderNeonPlayer(group.p1, 'JUGADOR A', '#38bdf8')}
                        <div style="height: 1px; background: linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.3), transparent); margin: 0 20px;"></div>
                        ${renderNeonPlayer(group.p2, 'JUGADOR B', '#38bdf8')}
                    </div>
                    `;
                } else {
                    return `
                    <div class="neon-single-card" style="
                        background: linear-gradient(135deg, rgba(20,20,20,0.9) 0%, rgba(0,0,0,1) 100%);
                        border: 1px solid rgba(255,255,255,0.1);
                        border-radius: 20px;
                        padding: 5px;
                        position: relative;
                        overflow: hidden;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.4);
                        margin-bottom: 15px;
                    ">
                        <div style="position: absolute; top: 0; right: 0; background: rgba(255,255,255,0.1); color: #888; font-size: 0.5rem; font-weight: 900; padding: 3px 10px; border-bottom-left-radius: 10px;">SOLO</div>
                        ${renderNeonPlayer(group.p1, `#${idx + 1}`)}
                        ${group.p1.partner_name ? `<div style="padding: 5px 15px 10px; font-size: 0.6rem; color: #ffd700; font-weight: 800; text-transform: uppercase;"><i class="fas fa-search"></i> Buscando a: ${group.p1.partner_name}</div>` : ''}
                    </div>
                    `;
                }
            }).join('');

            modal.style.cssText = `position: fixed; inset: 0; background: #000; z-index: 30000; overflow-y: auto; font-family: 'Outfit', sans-serif; color: white; display: flex; flex-direction: column;`;
            modal.innerHTML = `
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Syncopate:wght@400;700&family=Montserrat:wght@900&display=swap');
                </style>
                <div class="broadcast-container" style="padding: 40px 20px; max-width: 1400px; margin: 0 auto; width: 100%; box-sizing: border-box;">
                    <!-- HEADER HIGH-TECH -->
                    <div class="broadcast-header" style="
                        display: flex; 
                        justify-content: space-between; 
                        align-items: center; 
                        margin-bottom: 30px; 
                        background: linear-gradient(90deg, rgba(0,0,0,0.8), rgba(15,23,42,0.5)); 
                        padding: 25px; 
                        border-radius: 20px; 
                        border: 1px solid rgba(255,255,255,0.05); 
                        box-shadow: 0 20px 40px rgba(0,0,0,0.4);
                        gap: 20px;
                    ">
                        <div style="flex: 1; display: flex; flex-direction: column; gap: 10px;">
                            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                                <span style="background: #CCFF00; color: #000; padding: 3px 12px; border-radius: 6px; font-weight: 950; font-size: 0.7rem; letter-spacing: 2px;">BROADCAST</span>
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <div style="width: 8px; height: 8px; background: #FF2D55; border-radius: 50%; animation: pulse 1s infinite;"></div>
                                    <span style="font-size: 0.65rem; font-weight: 900; color: #FF2D55; letter-spacing: 1px;">PRE-PARTY LIVE</span>
                                </div>
                            </div>
                            <h1 style="
                                margin: 0; 
                                font-family: 'Montserrat', sans-serif; 
                                font-size: 2.2rem; 
                                font-weight: 900; 
                                text-transform: uppercase; 
                                letter-spacing: -1.5px; 
                                line-height: 1;
                            ">
                                INSCRITOS <span style="color: #CCFF00;">BATTLE READY</span>
                            </h1>
                            <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 5px;">
                                <p style="margin: 0; color: #fff; font-weight: 900; font-size: 1rem; text-transform: uppercase; opacity: 0.9;">${evt.name}</p>
                                <div style="display: flex; align-items: center; gap: 15px; color: #64748b; font-size: 0.75rem; font-weight: 800;">
                                    <span><i class="far fa-clock" style="color: #CCFF00;"></i> ${evt.time}</span>
                                    <span><i class="fas fa-map-marker-alt" style="color: #FF3B30;"></i> SomosPadel BCN</span>
                                </div>
                            </div>
                        </div>
                        
                        <div style="text-align: center; background: rgba(0,0,0,0.5); backdrop-filter: blur(20px); border: 2px solid #CCFF00; padding: 15px 30px; border-radius: 20px; box-shadow: 0 0 30px rgba(204,255,0,0.2); min-width: 140px;">
                            <div style="font-size: 0.6rem; font-weight: 950; color: #CCFF00; margin-bottom: 5px; letter-spacing: 2px; text-transform: uppercase;">PLAYER COUNT</div>
                            <div style="font-size: 2.8rem; font-weight: 1000; color: #fff; text-shadow: 0 0 20px #CCFF00; line-height: 0.9;">
                                ${uniqueRawList.length}<span style="color: rgba(255,255,255,0.2); font-size: 1.4rem; font-weight: 700; margin-left: 2px;">/${maxPlayers}</span>
                            </div>
                        </div>
                    </div>

                    <!-- HIGH DENSITY GRID -->
                    <div class="broadcast-grid" style="
                        display: grid; 
                        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); 
                        gap: 15px; 
                        margin-bottom: 40px;
                    ">
                        ${cardsHtml || `
                            <div style="grid-column: 1 / -1; padding: 60px; text-align: center; background: rgba(255,255,255,0.02); border-radius: 20px; border: 1px dashed rgba(255,255,255,0.1);">
                                <i class="fas fa-users-slash" style="font-size: 3rem; color: rgba(255,255,255,0.1); margin-bottom: 15px;"></i>
                                <div style="color: #64748b; font-weight: 800; font-size: 1.1rem;">TODAVÍA NO HAY INSCRITOS</div>
                                <div style="color: #475569; font-size: 0.9rem; margin-top: 5px;">¡Sé el primero en apuntarte!</div>
                            </div>
                        `}
                    </div>

                    <!-- FOOTER ACTIONS -->
                    <div style="display: flex; justify-content: center; gap: 20px; padding-bottom: 60px;">
                        <button onclick="document.getElementById('inscritos-modal').style.display = 'none';" 
                                style="background: transparent; color: #CCFF00; border: 2px solid #CCFF00; padding: 15px 40px; border-radius: 12px; font-weight: 950; cursor: pointer; text-transform: uppercase; font-size: 0.85rem; box-shadow: 0 0 15px rgba(204,255,0,0.2);">
                            CERRAR VISTA
                        </button>
                    </div>
                </div>

                <div style="position: fixed; bottom: 0; left: 0; width: 100%; height: 35px; background: #CCFF00; display: flex; align-items: center; overflow: hidden; z-index: 30001; box-shadow: 0 -5px 20px rgba(0,0,0,0.5);">
                    <div class="scrolling-text" style="white-space: nowrap; font-weight: 950; font-size: 0.75rem; color: black; text-transform: uppercase;">
                        ${dbPlayers.map(p => `• ${p.name} (LVL ${p.level})`).join('  &nbsp;&nbsp;&nbsp;&nbsp;  ')}
                    </div>
                </div>

                <style>
                    .scrolling-text { display: inline-block; animation: marquee 30s linear infinite; }
                    @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
                    #inscritos-modal::-webkit-scrollbar { width: 6px; }
                    #inscritos-modal::-webkit-scrollbar-thumb { background: #CCFF00; border-radius: 10px; }
                    .neon-pair-card, .neon-single-card { transition: transform 0.2s; }
                    .neon-pair-card:hover, .neon-single-card:hover { transform: translateY(-3px); }
                </style>
            `;


            modal.style.display = 'block';


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

            let updatedCount = 0;
            events.forEach(evt => {
                const card = document.getElementById(`event-card-${evt.id}`);
                if (!card) return;

                // 1. Update Player Count
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
                        if (icon) icon.style.color = isFull ? '#FF3B30' : '#84cc16';
                    }
                }
                const wlLabel = document.getElementById(`event-waitlist-label-${evt.id}`);
                if (wlLabel) {
                    const newWl = waitlist.length > 0 ? `<small style="color:#eab308; margin-left:5px;">(+${waitlist.length} en espera)</small>` : '';
                    if (wlLabel.innerHTML !== newWl) wlLabel.innerHTML = newWl;
                }

                // 2. Update FAB (Join Button)
                const isJoined = players.some(p => p.uid === uid || p.id === uid);
                const hasStarted = this.hasEventStarted(evt.date, evt.time);
                const isLive = evt.status === 'live' || (evt.status === 'open' && hasStarted);
                const isFinished = evt.status === 'finished';
                const isCancelled = evt.status === 'cancelled';
                const isWaitlistPending = evt.waitlist_pending_user && (evt.waitlist_pending_user.uid === uid);
                const isInWaitlist = waitlist.some(p => p.uid === uid);
                const waitlistPos = waitlist.findIndex(p => p.uid === uid) + 1;

                let btnLabel = 'ENTRAR';
                let btnIcon = 'fa-play';
                let btnColor = '#CCFF00';
                let fabAction = `window.EventsController.openLiveEvent('${evt.id}', '${evt.type || 'americana'}')`;

                if (isCancelled) {
                    btnLabel = 'ANULADO'; btnIcon = 'fa-ban'; btnColor = '#ef4444';
                    fabAction = "window.PremiumModal.alert({ title: '⛔ ANULADO', message: 'Este evento ha sido cancelado por la organización.', type: 'error' })";
                } else if (isFinished) {
                    btnLabel = 'VER'; btnIcon = 'fa-history'; btnColor = '#64748b';
                    fabAction = `window.openResultsView('${evt.id}', '${evt.type || 'americana'}')`;
                } else if (isLive) {
                    btnLabel = 'LIVE'; btnIcon = 'fa-broadcast-tower'; btnColor = '#FF2D55';
                } else if (isWaitlistPending) {
                    btnLabel = '¡NUEVA PLAZA! CONFIRMAR'; btnIcon = 'fa-star'; btnColor = '#CCFF00';
                    fabAction = `window.EventsController.confirmWaitlist('${evt.id}', '${evt.type || 'americana'}')`;
                } else if (isInWaitlist) {
                    btnLabel = `ESPERA (Pos ${waitlistPos})`; btnIcon = 'fa-hourglass-half'; btnColor = '#94a3b8';
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

                const fab = document.getElementById(`event-fab-${evt.id}`);
                const fabLabel = document.getElementById(`event-fab-label-${evt.id}`);
                const fabIcon = document.getElementById(`event-fab-icon-${evt.id}`);

                if (fab && fabLabel) {
                    if (fabLabel.innerText !== btnLabel) {
                        fabLabel.innerText = btnLabel;
                        fab.setAttribute('onclick', `event.stopPropagation(); ${fabAction}`);
                        fab.style.background = btnColor === '#fff' ? '#CCFF00' : (btnColor === '#CCFF00' ? '#38bdf8' : btnColor);
                        fab.style.color = btnColor === '#CCFF00' ? '#fff' : (btnColor === '#fff' ? '#000' : 'white');
                        if (fabIcon) {
                            fabIcon.className = `fas ${btnIcon}`;
                        }
                    }
                }

                // 3. Update Status Badge
                const statusBadge = document.getElementById(`event-status-badge-${evt.id}`);
                if (statusBadge) {
                    const newBadgeText = isLive ? 'EN VIVO' : (isCancelled ? 'ANULADO' : (evt.status === 'pairing' ? 'EMPAREJANDO' : (isFinished ? 'FINALIZADO' : 'ABIERTA')));
                    if (statusBadge.innerText.trim() !== newBadgeText) {
                        statusBadge.innerText = newBadgeText;
                        const bgColor = isLive ? '#FF2D55' : (isCancelled ? '#ef4444' : (evt.status === 'pairing' ? '#38bdf8' : (isFinished ? '#64748b' : '#84cc16')));
                        statusBadge.style.background = bgColor;
                        statusBadge.style.color = '#fff';
                        // Add subtle pulse for live status
                        if (isLive) {
                            statusBadge.style.animation = 'pulse-soft 2s infinite';
                        } else {
                            statusBadge.style.animation = '';
                        }
                    }
                }

                updatedCount++;
            });

            return updatedCount > 0 && updatedCount === events.length;
        }
    }

    window.EventsController = new EventsController();
})();
