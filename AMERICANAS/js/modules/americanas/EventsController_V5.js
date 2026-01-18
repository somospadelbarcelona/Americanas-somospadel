/**
 * EventsController_V5.js
 * FORZADO DE VERSIÓN PARA BYPASS DE CACHÉ
 * Contiene la lógica completa original con correcciones críticas.
 */
(function () {
    console.log("🔥 [EventsController_V5] SCRIPT LOADED AND EXECUTING!");

    // Global handler for results navigation - USE PREMIUM CONTROLTOWER VIEW OR ENTRENO LIVE VIEW
    window.openResultsView = (id, type) => {
        console.log("🚀 [EventsController] Opening Results for:", id, "Type:", type);

        // NEW: Redirect Entrenos to EntrenoLiveView (same view for finished and live)
        if (type === 'entreno') {
            console.log("👉 Redirecting finished Entreno to EntrenoLiveView");

            if (!window.EntrenoLiveView) {
                console.error("❌ EntrenoLiveView not loaded!");
                alert("Error: El módulo de Entrenos no está cargado. Por favor recarga la página.");
                return;
            }

            window.currentLiveEntrenoId = id;
            sessionStorage.setItem('currentLiveEntrenoId', id);
            window.Router.navigate('live-entreno');
            return;
        }

        // For Americanas: Wait for ControlTowerView to be ready
        const waitForControlTower = (attempts = 0) => {
            if (window.ControlTowerView && typeof window.ControlTowerView.prepareLoad === 'function') {
                console.log("✅ ControlTowerView ready, loading event");
                window.ControlTowerView.prepareLoad(id, type);
                window.Router.navigate('live');
            } else if (attempts < 20) {
                console.log(`⏳ Waiting for ControlTowerView... (attempt ${attempts + 1})`);
                setTimeout(() => waitForControlTower(attempts + 1), 100);
            } else {
                console.error("❌ ControlTowerView not available, using fallback");
                window.location.href = `resultados.html?id=${id}`;
            }
        };

        waitForControlTower();
    };

    class EventsController {
        constructor() {
            this.state = {
                activeTab: 'events',
                americanas: null,
                entrenos: null,
                users: [],
                personalMatches: [],
                loading: true,
                initialized: false,
                loadingResults: false,
                currentUser: null,
                playerCache: {}, // NEW: For resolving names on the fly
                filters: {
                    month: 'all',
                    category: 'all'
                }
            };
            this.unsubscribeEvents = null;
            this.unsubscribeEntrenos = null;
            this.unsubscribeUsers = null;
        }

        setFilter(type, value) {
            if (this.state.filters[type] === value) return;
            this.state.filters[type] = value;
            this.render();
        }

        getAvailableMonths(events) {
            const months = new Set();
            events.forEach(e => {
                if (!e.date) return;
                const d = new Date(e.date);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                months.add(key);
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
            const all = [
                ...(this.state.americanas || []).map(e => ({ ...e, type: 'americana' })),
                ...(this.state.entrenos || []).map(e => ({ ...e, type: 'entreno' }))
            ];
            return all.sort((a, b) => {
                if (!a.date || !b.date) return 0;
                if (a.date === b.date) return (a.time || '').localeCompare(b.time || '');
                return a.date.localeCompare(b.date);
            });
        }

        init() {
            if (this.state.initialized) {
                console.log("🎟️ [EventsController_V5] Already initialized, rendering current state.");
                this.render();
                return;
            }
            console.log("🎟️ [EventsController_V5] Initializing for the first time...");
            this.state.initialized = true;

            // grab user from global store (auth)
            this.state.currentUser = window.Store ? window.Store.getState('currentUser') : null;

            // 1. Real-time Americanas Listener
            if (this.unsubscribeEvents) this.unsubscribeEvents();
            this.unsubscribeEvents = window.db.collection('americanas')
                .orderBy('date', 'asc')
                .onSnapshot(snapshot => {
                    this.state.americanas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    this.checkLoading();
                }, err => console.error("Error fetching americanas:", err));

            // 1b. Real-time Entrenos Listener
            if (this.unsubscribeEntrenos) this.unsubscribeEntrenos();
            this.unsubscribeEntrenos = window.db.collection('entrenos')
                .orderBy('date', 'asc')
                .onSnapshot(snapshot => {
                    this.state.entrenos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    this.checkLoading();
                }, err => console.error("Error fetching entrenos:", err));


            // 2. Real-time Users Listener (For Ranking)
            if (this.unsubscribeUsers) this.unsubscribeUsers();
            this.unsubscribeUsers = window.db.collection('players')
                .limit(50)
                .onSnapshot(snapshot => {
                    this.state.users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    if (this.state.activeTab === 'ranking') this.render();
                });

            // 3. Auto-Start Loop (Every 30s)
            if (this.autoStartInterval) clearInterval(this.autoStartInterval);
            this.autoStartInterval = setInterval(() => {
                this.checkAutoStartEvents();
                // REMOVED: Force re-render - Now using real-time listeners
                // if (['events', 'agenda'].includes(this.state.activeTab)) {
                //     this.render();
                // }
            }, 30000); // 30 seconds
        }

        hasEventStarted(dateStr, timeStr) {
            if (!dateStr || !timeStr) return false;
            try {
                let eventDate;
                if (dateStr.includes('/')) {
                    const [day, month, year] = dateStr.split('/');
                    eventDate = new Date(`${year}-${month}-${day}T${timeStr}:00`);
                } else {
                    eventDate = new Date(`${dateStr}T${timeStr}:00`);
                }
                const now = new Date();
                return now >= eventDate;
            } catch (e) {
                console.warn("Error parsing date/time:", dateStr, timeStr, e);
                return false;
            }
        }

        checkAutoStartEvents() {
            if (!this.state.americanas || !this.state.entrenos) return;
            const allEvents = [
                ...this.state.americanas.map(e => ({ ...e, type: 'americana' })),
                ...this.state.entrenos.map(e => ({ ...e, type: 'entreno' }))
            ];
            allEvents.forEach(evt => {
                if (evt.status !== 'open') return;

                // FULL CHECK: Ensure event is full before auto-start
                const players = evt.players || evt.registeredPlayers || [];
                const maxCourts = evt.max_courts || 4;
                const isFull = players.length >= (maxCourts * 4);

                if (this.hasEventStarted(evt.date, evt.time)) {
                    // Only start if FULL
                    if (isFull) {
                        console.log(`⏰ [AutoStart] Event ${evt.name} has started and is FULL.`);
                        if (window.EventService) {
                            window.EventService.updateStatus(evt.id, 'live', evt.type)
                                .catch(err => console.warn(`⚠️ [AutoStart] Silent fail (permissions?):`, err));
                        }
                    } else {
                        console.warn(`⏳ [AutoStart] Event ${evt.name} reached start time but is NOT FULL (${players.length}/${maxCourts * 4}). Waiting.`);
                    }
                }
            });
        }

        checkLoading() {
            if (this.state.americanas !== null && this.state.entrenos !== null) {
                this.state.loading = false;
                console.log("🎟️ [EventsController_V5] Loading complete. Events:", (this.state.americanas.length + this.state.entrenos.length));

                // NEW: Automatic promotion check
                this.checkAutoStartEvents();

                this.render();
                this.render();
            }
        }

        async setTab(tabName) {
            console.log("🎯 [EventsController_V5] setTab called with:", tabName);
            this.state.activeTab = tabName;

            // Haptic Feedback
            if (window.navigator && window.navigator.vibrate) {
                window.navigator.vibrate(15);
            }

            // If switching to results, fetch personal matches in real-time
            if (tabName === 'results' && this.state.currentUser) {
                this.state.loadingResults = true;
                await this.render();

                // Clear previous listeners if any
                if (this.unsubscribeMatchesA) this.unsubscribeMatchesA();
                if (this.unsubscribeMatchesB) this.unsubscribeMatchesB();
                if (this.unsubscribeEntrenosA) this.unsubscribeEntrenosA();
                if (this.unsubscribeEntrenosB) this.unsubscribeEntrenosB();

                const uid = this.state.currentUser.uid;
                const updatePersonalMatches = () => {
                    const all = [
                        ...(this.state.rawMatchesA || []),
                        ...(this.state.rawMatchesB || []),
                        ...(this.state.rawEntrenosA || []),
                        ...(this.state.rawEntrenosB || [])
                    ];
                    // Deduplicate by ID
                    const unique = [];
                    const seen = new Set();
                    all.forEach(m => {
                        if (!seen.has(m.id)) {
                            seen.add(m.id);
                            unique.push(m);
                        }
                    });

                    this.state.personalMatches = unique.sort((a, b) => {
                        const dateA = a.timestamp || a.createdAt || 0;
                        const dateB = b.timestamp || b.createdAt || 0;
                        return new Date(dateB) - new Date(dateA);
                    });
                    this.state.loadingResults = false;
                    this.render();
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
            } else {
                await this.render();
            }
        }

        async render() {
            const container = document.getElementById('content-area');
            if (!container) {
                console.error("❌ [EventsController_V5] Content area #content-area NOT FOUND!");
                return;
            }

            // --- 1. SUBMENU NAVIGATION ---
            const tabs = [
                { id: 'entrenos', label: 'ENTRENOS', icon: 'fa-user-graduate' },
                { id: 'events', label: 'AMERICANAS', icon: 'fa-trophy' },
                { id: 'agenda', label: 'AGENDA', icon: 'fa-circle' },
                { id: 'finished', label: 'FINALIZADAS', icon: 'fa-history' }
            ];

            const navHtml = `
                <div class="events-submenu-container" style="
                    background: #232a32; 
                    padding: 10px 4px; 
                    border-bottom: 2px solid #CCFF00; 
                    margin-bottom: 0px; 
                    display: flex; 
                    justify-content: space-around; 
                    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
                    position: sticky;
                    position: -webkit-sticky;
                    top: 158px; 
                    z-index: 12000; 
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                ">
                    ${tabs.map(tab => {
                const isActive = this.state.activeTab === tab.id;
                const isPadelBall = tab.id === 'agenda';

                return `
                <button onclick="window.EventsController.setTab('${tab.id}')" 
                                style="
                                    background: transparent; 
                                    border: none; 
                                    display: flex;
                                    flex-direction: column;
                                    align-items: center;
                                    gap: 8px;
                                    color: ${isActive ? '#CCFF00' : 'rgba(255,255,255,0.4)'}; 
                                    font-weight: 800; 
                                    padding: 8px 4px; 
                                    font-size: 0.55rem;
                                    cursor: pointer;
                                    transition: all 0.2s ease;
                                    flex: 1;
                                    letter-spacing: 0.3px;
                                    position: relative;
                                    min-width: 0;
                                ">
                            <div style="
                                width: 44px; height: 44px; 
                                border-radius: 14px; 
                                background: ${isActive ? 'rgba(204,255,0,0.1)' : 'rgba(255,255,255,0.05)'};
                                display: flex; align-items: center; justify-content: center; 
                                border: 1.5px solid ${isActive ? '#CCFF00' : 'rgba(255,255,255,0.1)'};
                                transition: all 0.3s;
                                box-shadow: ${isActive ? '0 0 15px rgba(204,255,0,0.3)' : 'none'};
                                margin-bottom: 2px;
                            ">
                                ${isPadelBall ?
                        `<div style="
                                        width: 22px; height: 22px; 
                                        background: ${isActive ? '#CCFF00' : 'rgba(255,255,255,0.5)'}; 
                                        border-radius: 50%; 
                                        position: relative;
                                        border: 2px solid ${isActive ? '#000' : 'transparent'};
                                    ">
                                        <div style="position:absolute; top:20%; left:10%; width:80%; height:60%; border:1.5px solid rgba(0,0,0,0.2); border-radius:50%; border-top:none; border-bottom:none;"></div>
                                    </div>` :
                        `<i class="fas ${tab.icon}" style="font-size: 1.1rem; color: ${isActive ? '#CCFF00' : '#888'};"></i>`
                    }
                            </div>
                            <span style="text-transform: uppercase; font-weight: 900; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;">${tab.label}</span>
                            ${isActive ? `<div style="width: 16px; height: 3px; background: #CCFF00; border-radius: 10px; margin-top: 4px; box-shadow: 0 0 10px #CCFF00;"></div>` : ''}
                        </button>
                    `}).join('')}
                </div>
            `;

            // --- 2. CONTENT AREA ---
            let contentHtml = '';

            if (this.state.loading) {
                contentHtml = '<div style="padding:40px; text-align:center;"><div class="loader"></div><p style="color:#888; margin-top:10px;">Cargando datos...</p></div>';
            } else {
                switch (this.state.activeTab) {
                    case 'events': contentHtml = this.renderEventsList(false, false); break;
                    case 'entrenos': contentHtml = this.renderEventsList(false, false, true); break;
                    case 'agenda': contentHtml = this.renderAgendaView(); break;
                    case 'results':
                        contentHtml = await this.renderResultsView();
                        break;
                    case 'finished': contentHtml = this.renderFinishedView(); break;
                }
            }

            container.innerHTML = `<div class="fade-in">${navHtml}${contentHtml}</div>`;
            console.log("✅ [EventsController_V5] Content rendered successfully");
        }

        renderEventsList(onlyMine, onlyEntrenos = false, showBothTypes = false) {
            let events = this.getAllSortedEvents();
            const { month, category } = this.state.filters;
            const uid = this.state.currentUser ? this.state.currentUser.uid : null;
            const todayStr = this.getTodayStr();

            if (!onlyMine) {
                // Show 'open' OR 'live' events in DISPONIBLES.
                // Filter out 'finished' events and those from significantly older days (yesterday).
                events = events.filter(e => {
                    const isCorrectType = showBothTypes ? true : (onlyEntrenos ? e.type === 'entreno' : e.type === 'americana');

                    // CRITICAL: Finished events MUST only show in "FINALIZADAS" tab.
                    if (e.status === 'finished') return false;

                    if (e.status === 'live') return isCorrectType; // Keep live events visible
                    return e.date >= todayStr && isCorrectType;
                });
            } else if (onlyMine) {
                if (!uid) return `<div style="text-align:center; padding:40px; color:#888;">Debes iniciar sesión.</div>`;
                events = events.filter(e => {
                    const players = e.players || e.registeredPlayers || [];
                    return players.some(p => p.uid === uid || p.id === uid);
                });
            }

            if (month !== 'all') events = events.filter(e => e.date.startsWith(month));
            if (category !== 'all') events = events.filter(e => e.category === category);

            let eventsHtml = '';
            try {
                eventsHtml = events.map(evt => this.renderCard(evt)).join('');
            } catch (e) {
                console.error("❌ [EventsController_V5] Error rendering event cards:", e);
                eventsHtml = `<div style="padding:40px; text-align:center; color:red;">Error al renderizar eventos.</div>`;
            }

            const availableEvents = this.getAllSortedEvents().filter(e => e.status !== 'finished' && (e.status === 'live' || e.date >= todayStr));
            const filterBarHtml = !onlyMine ? this.renderFilterBar(availableEvents) : '';

            return `
                <div style="min-height: 80vh; padding-top: 5px;">
                    <div style="padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; background: linear-gradient(135deg, #0f172a 0%, #000000 100%); border-radius: 20px; margin: 0 10px 10px 10px; box-shadow: 0 0 25px rgba(204,255,0,0.25), 0 10px 40px rgba(0,0,0,0.6); border: 2px solid #CCFF00; position: relative; overflow: hidden; animation: pulse-border 3s infinite alternate;">
                        <div style="position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(204,255,0,0.1) 0%, transparent 70%); pointer-events: none;"></div>
                        <div style="display: flex; align-items: center; gap: 12px; position: relative; z-index: 1;">
                            <div style="width: 44px; height: 44px; background: #000; border: 2.5px solid #CCFF00; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 20px rgba(204,255,0,0.7), inset 0 0 10px rgba(204,255,0,0.3); position: relative; overflow: hidden;">
                                <div style="width: 26px; height: 26px; background: #CCFF00; border-radius: 50%; position: relative; box-shadow: 0 0 15px #CCFF00, 0 0 30px rgba(204,255,0,0.5); animation: ball-float 3s ease-in-out infinite;">
                                    <div style="position:absolute; top:15%; left:-5%; width:110%; height:70%; border:1.8px solid rgba(0,0,0,0.3); border-radius:50%; border-top:none; border-bottom:none;"></div>
                                </div>
                            </div>
                            <div>
                                <h2 style="font-size: 1.15rem; font-weight: 950; margin: 0; color: white; display: flex; align-items: center; gap: 8px; text-shadow: 0 0 15px rgba(204,255,0,0.4); letter-spacing: -0.5px;">Eventos <span style="color: #CCFF00;">Somospadel BCN</span></h2>
                                <p style="color: rgba(204,255,0,0.9); font-size: 0.65rem; font-weight: 850; text-transform: uppercase; letter-spacing: 2px; margin: 0; animation: glow-text 2s ease-in-out infinite alternate;">¡Apúntate en tiempo real!</p>
                            </div>
                        </div>
                        <div style="display:flex; gap: 8px; align-items: center;">
                             <div style="background: #000; padding: 6px 14px; border-radius: 14px; border: 1.5px solid #00E36D; color: white; font-weight: 950;"><i class="fas fa-bolt" style="color: #00E36D;"></i> ${events.length}</div>
                        </div>
                    </div>
                    ${filterBarHtml}
                    <div style="padding-bottom: 120px; padding-left:10px; padding-right:10px;">
                        ${events.length === 0 ? `<div style="padding:100px 40px; text-align:center; color:#444;"><i class="fas fa-filter" style="font-size: 4rem; opacity: 0.1;"></i><h3 style="color:#666;">SIN RESULTADOS</h3></div>` : eventsHtml}
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
                if (e.date < todayStr && e.status !== 'live') return false;
                const players = e.players || e.registeredPlayers || [];
                return players.some(p => p.uid === uid || p.id === uid);
            });

            return `
                <div style="padding: 25px; background: #f8fafc; min-height: 80vh; font-family: 'Outfit', sans-serif;">
                    
                    <!-- HEADER -->
                    <div style="margin-bottom: 25px;">
                        <span style="background: rgba(132, 204, 22, 0.1); color: #84cc16; padding: 5px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">Próximos Retos</span>
                        <h2 style="font-size: 2rem; font-weight: 950; color: #0f172a; margin: 10px 0;">Mi <span style="color: #84cc16;">Agenda</span></h2>
                    </div>

                    ${myEvents.length === 0 ? `
                        <div style="text-align:center; padding: 80px 30px; background: white; border-radius: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.04); border: 1px solid #e2e8f0;">
                            <div style="width: 80px; height: 80px; background: #f1f5f9; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 25px;">
                                <i class="fas fa-calendar-alt" style="font-size: 2rem; color: #cbd5e1;"></i>
                            </div>
                            <h3 style="color: #1e293b; font-weight: 900; font-size: 1.3rem; margin-bottom: 10px;">SIN PLANES</h3>
                            <p style="color: #64748b; font-size: 0.9rem; margin-bottom: 25px;">No tienes inscripciones activas para esta semana. ¡Es hora de saltar a la pista!</p>
                            <button onclick="window.EventsController.setTab('events')" style="background: #84cc16; color: white; border: none; padding: 14px 28px; border-radius: 16px; font-weight: 800; font-size: 0.85rem; box-shadow: 0 10px 20px rgba(132, 204, 22, 0.2); cursor: pointer;">BUSCAR AMERICANAS</button>
                        </div>
                    ` : `
                        <div style="padding-bottom: 120px; display: flex; flex-direction: column; gap: 20px; position: relative;">
                            <!-- VERTICAL TIMELINE LINE -->
                            <div style="position: absolute; left: 30px; top: 0; bottom: 120px; width: 2px; background: #e2e8f0; z-index: 0;"></div>
                            
                            ${myEvents.map((evt, idx) => {
                const d = new Date(evt.date);
                const dayNum = d.getDate();
                const monthName = d.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase();

                return `
                                <div style="position: relative; z-index: 1; display: flex; gap: 20px;">
                                    <!-- DATE CIRCLE -->
                                    <div style="min-width: 60px; height: 60px; background: white; border: 2px solid ${idx === 0 ? '#84cc16' : '#e2e8f0'}; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                                        <span style="font-size: 0.6rem; font-weight: 900; color: #94a3b8;">${monthName}</span>
                                        <span style="font-size: 1.25rem; font-weight: 950; color: ${idx === 0 ? '#0f172a' : '#64748b'}; line-height: 1;">${dayNum}</span>
                                    </div>
                                    
                                    <!-- EVENT CARD -->
                                    <div style="flex: 1; background: white; border-radius: 24px; padding: 20px; border: 1px solid #e2e8f0; box-shadow: 0 4px 15px rgba(0,0,0,0.02);">
                                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                                            <h3 style="margin: 0; font-size: 1.05rem; color: #0f172a; font-weight: 900; line-height: 1.2;">${evt.name}</h3>
                                            ${evt.status === 'live' ? '<span style="background: #e0f2fe; color: #0ea5e9; font-size: 0.55rem; font-weight: 900; padding: 2px 8px; border-radius: 8px; animation: pulse 2s infinite; border: 1px solid #0ea5e9;">EN JUEGO</span>' : ''}
                                        </div>
                                        
                                        <div style="display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 18px;">
                                            <div style="display: flex; align-items: center; gap: 6px; color: #64748b; font-size: 0.75rem; font-weight: 600;">
                                                <i class="far fa-clock" style="color: #84cc16;"></i> ${evt.time}
                                            </div>
                                            <div style="display: flex; align-items: center; gap: 6px; color: #64748b; font-size: 0.75rem; font-weight: 600;">
                                                <i class="fas fa-map-marker-alt" style="color: #0ea5e9;"></i> ${evt.location || 'Somospadel'}
                                            </div>
                                        </div>
                                        
                                        <button onclick="window.EventsController.openLiveEvent('${evt.id}', '${evt.type || 'americana'}');" 
                                                style="width: 100%; height: 48px; background: #0f172a; color: white; border: none; border-radius: 12px; font-weight: 800; font-size: 0.8rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;">
                                            GESTIONAR EVENTO <i class="fas fa-chevron-right" style="font-size: 0.7rem;"></i>
                                        </button>
                                    </div>
                                </div>`;
            }).join('')}
                        </div>
                    `}
                </div>
            `;
        }

        renderFinishedView() {
            const todayStr = this.getTodayStr();
            const { month, category } = this.state.filters;
            let finishedEvents = this.getAllSortedEvents().filter(e => e.status === 'finished' || e.date < todayStr);
            if (month !== 'all') finishedEvents = finishedEvents.filter(e => e.date.startsWith(month));
            if (category !== 'all') finishedEvents = finishedEvents.filter(e => e.category === category);

            return `
                <div style="padding: 25px; background: #f8fafc; min-height: 80vh; font-family: 'Outfit', sans-serif;">
                    
                    <!-- HEADER -->
                    <div style="margin-bottom: 10px;">
                        <span style="background: rgba(100, 116, 139, 0.1); color: #64748b; padding: 5px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">Archivo Histórico</span>
                        <h2 style="font-size: 2rem; font-weight: 950; color: #0f172a; margin: 10px 0;">Eventos <span style="color: #64748b;">Pasados</span></h2>
                    </div>

                    ${this.renderFilterBar(this.getAllSortedEvents().filter(e => e.status === 'finished' || e.date < todayStr))}

                    <div style="display: flex; flex-direction: column; gap: 15px; padding-bottom: 120px;">
                        ${finishedEvents.length ? finishedEvents.map(evt => this.renderCard(evt, true)).join('') : `
                            <div style="text-align:center; padding: 80px 30px; background: white; border-radius: 32px; border: 1px solid #e2e8f0; color: #94a3b8;">
                                <i class="fas fa-history" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.5;"></i>
                                <h4 style="margin: 0; color: #1e293b; font-weight: 900; font-size: 1.1rem;">No hay eventos finalizados</h4>
                                <p style="font-size: 0.85rem; margin-top: 8px; font-weight: 600;">Aún no hay registros que coincidan con los filtros.</p>
                            </div>
                        `}
                    </div>
                </div>
            `;
        }

        async renderResultsView() {
            const matches = this.state.personalMatches || [];
            const user = this.state.currentUser;

            if (this.state.loadingResults) return `<div style="padding:100px; text-align:center;"><div class="loader"></div></div>`;
            if (!user) return `<div style="padding:80px; text-align:center; color:white;"><i class="fas fa-lock" style="font-size:3rem; margin-bottom:15px; opacity:0.2;"></i><p>Inicia sesión para ver resultados.</p></div>`;

            // --- CRITICAL FILTERING FIX V4 (The Final Clean) ---
            const realMatches = matches.filter(m => {
                const s1 = parseInt(m.score_a || 0);
                const s2 = parseInt(m.score_b || 0);

                // 1. Filtros básicos de puntuación
                if (s1 === 0 && s2 === 0) return false;
                if ((s1 + s2) < 2) return false;

                // 2. EXIGIR NOMBRES REALES EN LA BASE DE DATOS
                // El problema es que la DB tiene partidos antiguos sin el campo `team_a_names`
                // y la UI pinta "Equipo A" por defecto. Aquí los bloqueamos.
                const hasNamesA = Array.isArray(m.team_a_names) && m.team_a_names.length > 0;
                const hasNamesB = Array.isArray(m.team_b_names) && m.team_b_names.length > 0;

                // Si NO hay nombres guardados, es un partido fantasma. Fuera.
                if (!hasNamesA || !hasNamesB) return false;

                // 3. Verificar Nombres Genéricos explícitos (por si acado si se guardaron)
                const strNames = [...(m.team_a_names), ...(m.team_b_names)].join(' ').toLowerCase();
                if (strNames.includes('equipo a') || strNames.includes('equipo b') || strNames.includes('jugador')) {
                    return false;
                }

                return true;
            });

            const totalMatches = realMatches.length;
            let totalWins = 0;

            realMatches.forEach(m => {
                const s1 = parseInt(m.score_a || 0);
                const s2 = parseInt(m.score_b || 0);
                const isTeamA = m.team_a_ids && m.team_a_ids.includes(user.uid);
                // Draw is not a win
                const won = (isTeamA && s1 > s2) || (!isTeamA && s2 > s1);
                if (won) totalWins++;
            });

            const winRate = totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0;
            const userLevel = user.level || user.playtomic_level || 3.5;

            // --- NEW STRUCTURE UI ---
            return `
                <div style="padding: 20px 15px 120px; background: #080808; min-height: 90vh; font-family: 'Outfit', sans-serif; color: white;">
                    
                    <!-- 1. PROFILE HEADER CENTERED -->
                    <div style="text-align: center; margin-bottom: 30px; margin-top: 10px;">
                        <div style="width: 80px; height: 80px; margin: 0 auto 15px; background: linear-gradient(135deg, rgba(204,255,0,0.2), rgba(0,0,0,0)); border-radius: 50%; padding: 3px; border: 2px solid var(--brand-neon, #CCFF00);">
                            <div style="width: 100%; height: 100%; border-radius: 50%; background: #111; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                                ${user.photoURL ?
                    `<img src="${user.photoURL}" style="width:100%; height:100%; object-fit:cover;">` :
                    `<span style="font-size: 2rem; font-weight: 900; color: #CCFF00;">${(user.name || 'P').charAt(0)}</span>`
                }
                            </div>
                        </div>
                        <h2 style="font-size: 1.8rem; font-weight: 950; margin: 0; line-height: 1.2;">${user.name || user.displayName || 'Jugador'}</h2>
                        <div style="color: #666; font-size: 0.8rem; font-weight: 700; letter-spacing: 1px; margin-top: 5px;">PLAYER STATISTICS</div>
                    </div>

                    ${totalMatches === 0 ? `
                        <!-- EMPTY STATE -->
                        <div style="text-align:center; padding: 60px 20px; background: rgba(255,255,255,0.02); border-radius: 24px; border: 1px dashed rgba(255,255,255,0.1);">
                            <div style="background: rgba(255,255,255,0.05); width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
                                <i class="fas fa-chart-bar" style="font-size: 1.5rem; color: rgba(255,255,255,0.3);"></i>
                            </div>
                            <h3 style="font-weight: 900; margin-bottom: 8px; font-size: 1.1rem;">AÚN NO HAY DATOS</h3>
                            <p style="color: #666; font-size: 0.9rem; line-height: 1.5; margin-bottom: 25px; padding: 0 10px;">Juega tu primer Americano o Entreno para desbloquear tus estadísticas y nivel.</p>
                            <button onclick="window.EventsController.setTab('events')" style="background: #CCFF00; color: black; border: none; padding: 14px 28px; border-radius: 12px; font-weight: 950; font-size: 0.85rem; cursor: pointer; box-shadow: 0 5px 20px rgba(204,255,0,0.2);">
                                🔥 VER TORNEOS
                            </button>
                        </div>
                    ` : `
                        <!-- 2. STATS OVERVIEW -->
                        <div style="background: rgba(255,255,255,0.03); border-radius: 20px; padding: 20px; display: flex; justify-content: space-around; margin-bottom: 30px; border: 1px solid rgba(255,255,255,0.05);">
                            <div style="text-align: center;">
                                <div style="font-size: 2rem; font-weight: 950; color: #CCFF00; line-height: 1;">${totalMatches}</div>
                                <div style="font-size: 0.6rem; font-weight: 800; color: #666; margin-top: 5px; letter-spacing: 1px;">PARTIDOS</div>
                            </div>
                            <div style="width: 1px; background: rgba(255,255,255,0.1);"></div>
                            <div style="text-align: center;">
                                <div style="font-size: 2rem; font-weight: 950; color: white; line-height: 1;">${winRate}%</div>
                                <div style="font-size: 0.6rem; font-weight: 800; color: #666; margin-top: 5px; letter-spacing: 1px;">VICTORIAS</div>
                            </div>
                            <div style="width: 1px; background: rgba(255,255,255,0.1);"></div>
                            <div style="text-align: center;">
                                <div style="font-size: 2rem; font-weight: 950; color: white; line-height: 1;">${parseFloat(userLevel).toFixed(2)}</div>
                                <div style="font-size: 0.6rem; font-weight: 800; color: #666; margin-top: 5px; letter-spacing: 1px;">NIVEL</div>
                            </div>
                        </div>

                        <!-- 3. MATCH HISTORY -->
                        <div style="margin-bottom: 15px; display: flex; align-items: center; justify-content: space-between; padding: 0 5px;">
                            <h3 style="font-weight: 950; font-size: 1rem; color: white;">Última Actividad</h3>
                            <button onclick="window.EventsController.setTab('results')" style="background:none; border:none; color: #CCFF00; font-size: 0.7rem; font-weight: 800; cursor:pointer;">
                                <i class="fas fa-sync-alt"></i>
                            </button>
                        </div>

                        <div style="display: flex; flex-direction: column; gap: 12px; padding-bottom: 120px;">
                            <!-- PASSING realMatches INSTEAD OF matches IS THE KEY FIX -->
                            ${await this.renderMatchCards(realMatches, user)}
                        </div>
                    `}
                </div>
            `;
        }

        async renderMatchCards(matches, user) {
            // Sort by recent first (if matches have timestamps/IDs that allow sorting)
            // Assuming matches come sorted or we can't sort easily without more data
            const reversedMatches = [...matches].reverse();

            const htmls = await Promise.all(reversedMatches.map(async (m) => {
                const s1 = parseInt(m.score_a || 0);
                const s2 = parseInt(m.score_b || 0);
                const isTeamA = m.team_a_ids && m.team_a_ids.includes(user.uid);

                // Determine Result
                let resultClass = 'draw';
                let resultColor = '#888';
                let resultText = 'EMPATE';

                if (s1 !== s2) {
                    const won = (isTeamA && s1 > s2) || (!isTeamA && s2 > s1);
                    resultClass = won ? 'win' : 'loss';
                    resultColor = won ? '#CCFF00' : '#FF3B30';
                    resultText = won ? 'W' : 'L';
                }

                // Enhanced Name Handling with Cache
                const resolveNames = async (ids, names, defaultLabel) => {
                    if (!names) return defaultLabel;

                    let cleanNames = [];
                    if (Array.isArray(names)) {
                        cleanNames = names.filter(n => n && n !== 'Equipo A' && n !== 'Equipo B');
                    } else if (typeof names === 'string') {
                        // Split by common separators if it's a string
                        cleanNames = names.split(/[&/]/).map(n => n.trim()).filter(n => n && n !== 'Equipo A' && n !== 'Equipo B');
                    }

                    if (cleanNames.length > 0) {
                        return cleanNames.map(n => {
                            if (n === user.name || (user.displayName && n === user.displayName)) return '<span style="color:#CCFF00; font-weight:900;">TÚ</span>';
                            if (n.includes('VACANTE')) return '<span style="color:#FF3B30; font-weight:900;">🔴 VACANTE</span>';
                            return n.split(' ')[0]; // First name only
                        }).join(' & ');
                    }
                    return defaultLabel;
                };

                const teamANames = await resolveNames(m.team_a_ids, m.team_a_names, 'Equipo A');
                const teamBNames = await resolveNames(m.team_b_ids, m.team_b_names, 'Equipo B');

                return `
                    <div style="
                        background: linear-gradient(90deg, #111 0%, #0d0d0d 100%); 
                        border-radius: 16px; 
                        padding: 0; 
                        position: relative; 
                        overflow: hidden; 
                        border: 1px solid rgba(255,255,255,0.08);
                        display: flex;
                        align-items: stretch;
                        height: 70px;
                    ">
                        <!-- Result Strip -->
                        <div style="width: 6px; background: ${resultColor};"></div>
                        
                        <!-- Main Content -->
                        <div style="flex: 1; display: flex; align-items: center; justify-content: space-between; padding: 0 15px;">
                            
                            <!-- Team A -->
                            <div style="flex: 1; text-align: left;">
                                <div style="color: ${isTeamA ? 'white' : '#888'}; font-weight: ${isTeamA ? '700' : '500'}; font-size: 0.8rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 90px;">
                                    ${teamANames}
                                </div>
                            </div>

                            <!-- Score Badge -->
                            <div style="background: rgba(30,30,30,0.8); padding: 5px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); display: flex; gap: 8px; font-family: 'Monospace', monospace; font-weight: 700;">
                                <span style="color: ${s1 > s2 ? '#fff' : '#666'}">${s1}</span>
                                <span style="color: #444">-</span>
                                <span style="color: ${s2 > s1 ? '#fff' : '#666'}">${s2}</span>
                            </div>

                            <!-- Team B -->
                            <div style="flex: 1; text-align: right;">
                                <div style="color: ${!isTeamA ? 'white' : '#888'}; font-weight: ${!isTeamA ? '700' : '500'}; font-size: 0.8rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 90px; margin-left: auto;">
                                    ${teamBNames}
                                </div>
                            </div>
                        </div>

                        <!-- Result Badge (Right) -->
                        <div style="
                            width: 35px; 
                            display: flex; 
                            align-items: center; 
                            justify-content: center; 
                            background: rgba(255,255,255,0.03); 
                            border-left: 1px solid rgba(255,255,255,0.05);
                        ">
                            <span style="color: ${resultColor}; font-weight: 900; font-size: 0.9rem;">${resultText}</span>
                        </div>
                    </div>
                `;
            }));
            return htmls.join('');
        }

        renderCard(evt, isLight = false) {
            const rawPlayers = evt.players || evt.registeredPlayers || [];
            // Robust unique player counting
            const seenIds = new Set();
            const players = rawPlayers.filter(p => {
                const id = (typeof p === 'string') ? p : (p.uid || p.id);
                if (id && !seenIds.has(id)) {
                    seenIds.add(id);
                    return true;
                }
                return false;
            });
            const playerCount = players.length;
            const maxPlayers = (evt.max_courts || 4) * 4;

            const d = new Date(evt.date);
            const dayName = d.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase().replace('.', '');
            const dayNum = d.getDate();

            const user = this.state.currentUser;
            const uid = user ? user.uid : '-';
            const isJoined = players.some(p => p.uid === uid || p.id === uid);
            const isFull = playerCount >= maxPlayers;

            const todayStr = this.getTodayStr();
            const isPastDate = evt.date < todayStr;
            const hasStarted = this.hasEventStarted(evt.date, evt.time);
            // VISUAL FORCE: If it is 'open' but time has passed, show as live visually
            const isLive = evt.status === 'live' || (evt.status === 'open' && hasStarted);

            // Finished only if explicitly set OR if past date AND not live (logic check: if isLive is true due to start time, it won't be finished unless explicit)
            // But if it is significantly past (e.g. yesterday) and still open, we might consider it finished? 
            // For now, keep simple:
            const isFinished = evt.status === 'finished' || (isPastDate && !isLive);

            // Waitlist logic
            const waitlist = evt.waitlist || [];
            const isInWaitlist = waitlist.some(p => p.uid === uid);

            // --- 1. ACTION BUTTON STATE ---
            let btnContent = '<i class="fas fa-plus" style="font-size: 1.4rem;"></i>';
            // Default Circular Dimensions
            let btnDims = 'width: 55px; height: 55px; border-radius: 50%;';
            let btnStyle = 'background: #CCFF00; color: #000; box-shadow: 0 0 20px rgba(204, 255, 0, 0.6); animation: pulse-neon-btn 2s infinite;';
            let btnAction = `event.stopPropagation(); window.EventsController.joinEvent('${evt.id}', '${evt.type || 'americana'}')`;
            let btnDisabled = false;

            if (isFinished) {
                btnContent = '<div style="display:flex; flex-direction:column; align-items:center; line-height:1; gap:2px;"><i class="fas fa-poll" style="font-size: 1rem;"></i><span style="font-size:0.45rem; font-weight:950; text-align:center;">VER<br>RESULTADOS</span></div>';
                btnStyle = 'background: #CCFF00; color: #000; box-shadow: 0 4px 15px rgba(204, 255, 0, 0.4); width: 55px; height: 55px;';
                btnAction = `event.stopPropagation(); window.openResultsView('${evt.id}', '${evt.type || 'americana'}');`;
            } else if (isLive) {
                if (isJoined) {
                    btnContent = '<span style="font-size:0.45rem; font-weight:950; text-align:center; line-height:1.1;">EN<br>JUEGO</span>';
                    btnStyle = 'background: #0ea5e9; color: white; animation: pulse 2s infinite; padding: 0; width: 55px; height: 55px; box-shadow: 0 4px 15px rgba(14, 165, 233, 0.4);';
                    // Redirect to specific Entreno Live View if it's an entreno
                    const isEntreno = evt.type === 'entreno';
                    btnAction = `event.stopPropagation(); window.EventsController.openLiveEvent('${evt.id}', '${evt.type || 'americana'}');`;
                } else if (!isFull) {
                    // LIVE BUT VACANCY AVAILABLE -> ALLOW JOIN
                    // Use pulsing alert style to indicate urgency
                    btnContent = '<i class="fas fa-plus" style="font-size: 1.4rem;"></i>';
                    btnStyle = 'background: #FF2D55; color: white; box-shadow: 0 0 20px rgba(255, 45, 85, 0.6); animation: pulse-neon-btn 1s infinite;';
                    btnAction = `event.stopPropagation(); window.EventsController.joinEvent('${evt.id}', '${evt.type || 'americana'}')`;
                } else {
                    // Live and Full -> Just View
                    btnContent = '<span style="font-size:0.45rem; font-weight:950; text-align:center; line-height:1.1;">EN<br>JUEGO</span>';
                    btnStyle = 'background: #0ea5e9; color: white; animation: pulse 2s infinite; padding: 0; width: 55px; height: 55px; box-shadow: 0 4px 15px rgba(14, 165, 233, 0.4);';
                    btnAction = `event.stopPropagation(); window.EventsController.openLiveEvent('${evt.id}', '${evt.type || 'americana'}');`;
                }
            } else if (isJoined) {
                btnContent = '<i class="fas fa-check"></i>';
                btnStyle = 'background: white; color: #84cc16; border: 2px solid #84cc16; box-shadow: 0 4px 15px rgba(132, 204, 22, 0.3);';
                btnAction = `event.stopPropagation(); window.EventsController.leaveEvent('${evt.id}', '${evt.type || 'americana'}')`;
                btnDisabled = false;
            } else if (isInWaitlist) {
                btnContent = '<div style="display:flex; flex-direction:column; align-items:center; line-height:1; gap:2px;"><i class="fas fa-clock" style="font-size: 1rem;"></i><span style="font-size:0.4rem; font-weight:950;">EN<br>RESERVA</span></div>';
                btnStyle = 'background: #FFA500; color: white; border: 2px solid white; box-shadow: 0 4px 15px rgba(255, 165, 0, 0.5);';
                btnAction = `event.stopPropagation(); window.EventsController.leaveWaitlist('${evt.id}', '${evt.type || 'americana'}')`;
                btnDisabled = false;
            } else if (isFull) {
                btnContent = '<div style="display:flex; flex-direction:column; align-items:center; line-height:1; gap:2px;"><i class="fas fa-clock" style="font-size: 1rem;"></i><span style="font-size:0.4rem; font-weight:950;">LISTA DE<br>RESERVA</span></div>';
                btnStyle = 'background: #FFA500; color: white; box-shadow: 0 4px 15px rgba(255, 165, 0, 0.4);';
                btnAction = `event.stopPropagation(); window.EventsController.joinWaitlist('${evt.id}', '${evt.type || 'americana'}')`;
                btnDisabled = false;
            }

            // --- 2. LABELS & CATEGORY COLOR ---
            const categoryMap = { 'male': 'MASCULINA', 'female': 'FEMENINA', 'mixed': 'MIXTA', 'open': 'MULTINIVEL' };
            const categoryLabel = categoryMap[evt.category] || (evt.type === 'entreno' ? 'ENTRENO' : 'AMERICANA');

            const isFijaType = evt.is_fija || evt.name.toUpperCase().includes('FIJA');
            const extraType = isFijaType ? 'FIJA' : 'TWISTER';
            const extraTypeColor = isFijaType ? '#FACC15' : '#22D3EE'; // Oro para FIJA, Cian para TWISTER

            let catColor = '#64748b';
            let catIcon = 'fa-venus-mars'; // Default

            if (evt.category === 'female') {
                catColor = '#ec4899';
                catIcon = 'fa-venus';
            } else if (evt.category === 'male') {
                catColor = '#0ea5e9';
                catIcon = 'fa-mars';
            } else if (evt.category === 'mixed') {
                catColor = '#A78BFA'; // Morado suave para Mixta
                catIcon = 'fa-people-arrows';
            }

            let bgImage = (evt.image_url || 'img/americana-neon-bg.jpg').replace(/ /g, '%20');
            if (!evt.image_url && evt.category === 'mixed') bgImage = 'img/ball-mixta.png';

            const pMember = evt.price_members || 12;
            const pExternal = evt.price_external || 14;

            return `
                <style>
                    @keyframes pulse-neon-btn {
                        0% { transform: scale(1); box-shadow: 0 0 15px rgba(204, 255, 0, 0.5); }
                        50% { transform: scale(1.1); box-shadow: 0 0 35px rgba(204, 255, 0, 0.8); }
                        100% { transform: scale(1); box-shadow: 0 0 15px rgba(204, 255, 0, 0.5); }
                    }
                    @keyframes fadeOutHint {
                        0% { opacity: 0; transform: translateX(-10px); }
                        2% { opacity: 1; transform: translateX(0); }
                        90% { opacity: 1; transform: translateX(0); }
                        100% { opacity: 0; transform: translateX(5px); }
                    }
                    @keyframes hueRotate {
                        from { filter: hue-rotate(0deg); }
                        to { filter: hue-rotate(360deg); }
                    }
                </style>
                <div class="card-hybrid-c" onclick="window.EventsController.openLiveEvent('${evt.id}', '${evt.type || 'americana'}')" 
                     style="
                        position: relative; 
                        background: ${isLight ? 'white' : '#111'};
                        border-radius: 28px; 
                        overflow: hidden; 
                        margin-bottom: 20px; 
                        box-shadow: ${isLight ? '0 10px 30px rgba(0,0,0,0.03)' : '0 15px 45px rgba(0,0,0,0.5)'};
                        border: 1px solid ${isLight ? '#e2e8f0' : '#222'};
                        display: flex;
                        flex-direction: column;
                        transition: transform 0.2s;
                     ">
                    
                    <!-- IMAGE AREA -->
                    <div style="height: 150px; width: 100%; background: url('${bgImage}') no-repeat center center / cover; position: relative;">
                        <!-- TYPE BADGE -->
                        <div style="position: absolute; bottom: 12px; left: 12px; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); border: 1.5px solid ${extraTypeColor}; color: ${extraTypeColor}; padding: 4px 12px; border-radius: 8px; font-weight: 950; font-size: 0.65rem; z-index: 10; letter-spacing: 2px; box-shadow: 0 0 15px ${extraTypeColor}44;">
                            ${extraType}
                        </div>

                        <!-- PRICE -->
                        <div style="position: absolute; top: 12px; right: 12px; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); border-radius: 12px; padding: 4px; display: flex; gap: 4px; z-index: 10;">
                            <div style="background:rgba(255,255,255,0.1); color:white; padding:4px 8px; border-radius:8px; font-weight:900; font-size:0.75rem;">${pMember}€ <span style="font-size: 0.5rem; opacity: 0.7;">SOC</span></div>
                            <div style="background:white; color:#000; padding:4px 8px; border-radius:8px; font-weight:900; font-size:0.75rem;">${pExternal}€ <span style="font-size: 0.5rem; opacity: 0.7;">EXT</span></div>
                        </div>

                        <!-- DATE -->
                        <div style="position: absolute; top: 12px; left: 12px; background: white; border-radius: 16px; padding: 8px 12px; min-width: 55px; text-align: center; box-shadow: 0 0 20px rgba(204, 255, 0, 0.4), 0 4px 15px rgba(0,0,0,0.2); z-index: 10; border: 2px solid #CCFF00;">
                            <div style="font-size: 0.65rem; font-weight: 950; color: #84cc16; text-transform:uppercase; margin-bottom: 2px; letter-spacing: 1px;">${dayName}</div>
                            <div style="font-size: 1.6rem; font-weight: 950; color: #000; line-height: 1;">${dayNum}</div>
                        </div>

                        ${isFinished ? `
                        <div style="position: absolute; inset:0; background: rgba(0,0,0,0.4); backdrop-filter: grayscale(1); display: flex; align-items: center; justify-content: center; z-index: 5;">
                            <div style="border: 2px solid white; color: white; padding: 6px 15px; font-weight: 900; letter-spacing: 2px; transform: rotate(-8deg); font-size: 1.1rem; background: rgba(0,0,0,0.5);">FINALIZADA</div>
                        </div>
                        ` : ''}
                    </div>

                    <!-- ACTION BUTTON -->
                    <div style="position: absolute; top: 125px; right: 20px; z-index: 20; display: flex; align-items: center;">
                         ${(!isJoined && !isFinished && !isInWaitlist) ? `
                            <div style="
                                margin-right: 12px; 
                                background: #CCFF00; 
                                color: black; 
                                font-size: 0.6rem; 
                                font-weight: 900; 
                                padding: 4px 8px; 
                                borderRadius: 6px; 
                                white-space: nowrap; 
                                position: relative; 
                                animation: fadeOutHint 30s forwards, hueRotate 3s linear infinite; 
                                box-shadow: 0 0 15px rgba(204,255,0,0.4);
                                pointer-events: none;
                                letter-spacing: 0.5px;
                            ">
                                ¡APÚNTATE!
                                <div style="position: absolute; right: -4px; top: 50%; transform: translateY(-50%); width: 0; height: 0; border-top: 4px solid transparent; border-bottom: 4px solid transparent; border-left: 4px solid #CCFF00;"></div>
                            </div>
                        ` : ''}
                        <button onclick="${btnAction}" ${btnDisabled ? 'disabled' : ''}
                                style="width: 55px; height: 55px; border-radius: 50%; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; ${btnStyle}">
                            ${btnContent}
                        </button>
                    </div>

                    <!-- CONTENT Area -->
                    <div style="padding: 24px 20px; background: ${isLight ? 'white' : '#0a0a0a'}; border-top: 1px solid ${isLight ? '#f1f5f9' : '#1a1a1a'};">
                        <h3 style="color: ${isLight ? '#0f172a' : 'white'}; font-size: 1.3rem; font-weight: 950; margin: 0 0 20px 0; line-height: 1.2; padding-right: 60px; letter-spacing: -0.5px;">${evt.name}</h3>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; font-size: 0.75rem; font-weight: 850;">
                            <div style="display: flex; align-items: center; gap: 8px; color: ${isLight ? '#64748b' : '#aaa'};" title="Horario: ${evt.time || '00:00'} a ${(() => {
                    try {
                        const [h, m] = (evt.time || '00:00').split(':').map(Number);
                        let totalMin = h * 60 + m;
                        const dur = evt.duration || '1h 30m';
                        const hMatch = dur.match(/(\d+)h/);
                        const mMatch = dur.match(/(\d+)m/);
                        if (hMatch) totalMin += parseInt(hMatch[1]) * 60;
                        if (mMatch) totalMin += parseInt(mMatch[1]);
                        const endH = Math.floor(totalMin / 60) % 24;
                        const endM = totalMin % 60;
                        return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
                    } catch (e) { return '??:??'; }
                })()}">
                                <i class="far fa-clock" style="color: #CCFF00; font-size: 0.9rem;"></i> ${evt.time || '00:00'} - ${evt.time_end ? evt.time_end : (() => {
                    try {
                        const [h, m] = (evt.time || '00:00').split(':').map(Number);
                        let totalMin = h * 60 + m;
                        const dur = evt.duration || '1h 30m';
                        const hMatch = dur.match(/(\d+)h/);
                        const mMatch = dur.match(/(\d+)m/);
                        if (hMatch) totalMin += parseInt(hMatch[1]) * 60;
                        if (mMatch) totalMin += parseInt(mMatch[1]);
                        const endH = Math.floor(totalMin / 60) % 24;
                        const endM = totalMin % 60;
                        return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
                    } catch (e) { return '??:??'; }
                })()}
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px; color: ${catColor};">
                                <i class="fas ${catIcon}" style="font-size: 0.9rem;"></i> ${categoryLabel}
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px; color: ${isLight ? '#64748b' : '#aaa'};">
                                <i class="fas fa-th-large" style="color: #0ea5e9; font-size: 0.9rem;"></i> ${evt.max_courts || 0} Pistas
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px; color: ${playerCount >= maxPlayers ? '#ef4444' : '#CCFF00'}; cursor: pointer;" 
                                 onclick="event.stopPropagation(); window.EventsController.openPlayerListModal('${evt.id}')">
                                <i class="fas fa-users-cog" style="font-size: 0.9rem;"></i> 
                                <span style="text-decoration: underline;">${playerCount} / ${maxPlayers} Plazas</span>
                            </div>
                        </div>

                        <!-- SEDE INFO -->
                        <div style="margin-top: 18px; padding-top: 15px; border-top: 1px solid ${isLight ? '#f1f5f9' : '#1a1a1a'}; display: flex; align-items: center; gap: 10px; color: ${isLight ? '#64748b' : '#888'}; font-size: 0.75rem; font-weight: 800;">
                            <i class="fas fa-map-marker-alt" style="color: #ef4444; font-size: 0.9rem;"></i>
                            <span>SEDE: <span style="color: ${isLight ? '#0f172a' : '#ddd'};">${evt.location || 'Barcelona Pádel el Prat'}</span></span>
                        </div>

                        <!-- Progress Bar (Subtle) -->
                        <div style="width: 100%; height: 6px; background: ${isLight ? '#f1f5f9' : '#1a1a1a'}; border-radius: 10px; margin-top: 15px; overflow: hidden;">
                            <div style="width: ${(playerCount / (maxPlayers || 1)) * 100}%; height: 100%; background: linear-gradient(90deg, #84cc16, #CCFF00); border-radius: 10px; box-shadow: 0 0 10px rgba(204, 255, 0, 0.3);"></div>
                        </div>

                        <!-- Waitlist Indicator -->
                        ${waitlist.length > 0 ? `
                            <div style="margin-top: 12px; display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: rgba(255,165,0,0.1); border-left: 3px solid #FFA500; border-radius: 6px;">
                                <i class="fas fa-clock" style="color: #FFA500; font-size: 0.9rem;"></i>
                                <span style="color: ${isLight ? '#0f172a' : '#FFA500'}; font-size: 0.7rem; font-weight: 800;">
                                    ${waitlist.length} ${waitlist.length === 1 ? 'persona' : 'personas'} en lista de reserva
                                </span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }

        async openPlayerListModal(eventId) {
            console.log("🎟️ [EventsController_V5] Opening player list for:", eventId);

            const allEvents = this.getAllSortedEvents();
            const evt = allEvents.find(e => e.id === eventId);
            if (!evt) return;

            const rawPlayers = evt.players || evt.registeredPlayers || [];
            const seenIds = new Set();
            let players = rawPlayers.filter(p => {
                const id = (typeof p === 'string') ? p : (p.uid || p.id);
                if (id && !seenIds.has(id)) {
                    seenIds.add(id);
                    return true;
                }
                return false;
            });

            // Create Modal Shell Immediately (UX: Fast Feedback)
            const modalId = 'player-list-modal';
            const existingModal = document.getElementById(modalId);
            if (existingModal) existingModal.remove();

            const modal = document.createElement('div');
            modal.id = modalId;
            modal.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: radial-gradient(circle at center, #001a4d 0%, #000 100%);
                z-index: 99999; display: flex; flex-direction: column;
                animation: fadeInModal 0.5s cubic-bezier(0.16, 1, 0.3, 1);
                font-family: 'Inter', 'Outfit', sans-serif; color: white; overflow: hidden;
            `;

            modal.innerHTML = `
                <!-- Background Effects -->
                <div style="position: absolute; inset: 0; pointer-events: none; z-index: 1; overflow: hidden;">
                    <div style="position: absolute; top: -10%; left: -10%; width: 120%; height: 120%; background: radial-gradient(circle at 50% 0%, rgba(204, 255, 0, 0.15) 0%, transparent 70%);"></div>
                    <div style="position: absolute; inset: 0; background: linear-gradient(rgba(255, 255, 255, 0.02) 50%, transparent 50%); background-size: 100% 4px; opacity: 0.3;"></div>
                </div>

                <style>
                    @keyframes fadeInModal { from { opacity: 0; transform: scale(0.98) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
                    @keyframes enterCard { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
                    @keyframes newsTicker { from { transform: translateX(100%); } to { transform: translateX(-100%); } }
                    @keyframes pulseNeon { 0% { box-shadow: 0 0 10px rgba(204,255,0,0.2); } 50% { box-shadow: 0 0 25px rgba(204,255,0,0.5); } 100% { box-shadow: 0 0 10px rgba(204,255,0,0.2); } }
                    @keyframes rotateBall { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                    @keyframes slideHeader { from { transform: translateY(-100%); } to { transform: translateY(0); } }
                </style>

                <!-- WOW HEADER -->
                <div style="position: relative; z-index: 10; padding: 40px 25px 30px; background: linear-gradient(to bottom, rgba(0,0,0,0.95), transparent); animation: slideHeader 0.6s cubic-bezier(0.16, 1, 0.3, 1);">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div style="flex: 1;">
                            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                                <div style="width: 52px; height: 52px; background: #CCFF00; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 25px #CCFF00; animation: rotateBall 4s linear infinite;">
                                    <i class="fas fa-baseball-ball" style="color: black; font-size: 1.7rem;"></i>
                                </div>
                                <div>
                                    <h1 style="font-size: 2rem; font-weight: 950; margin: 0; color: white; letter-spacing: -1px; text-transform: uppercase; line-height: 0.9;">
                                        LISTA DE <span style="color: #CCFF00;">INSCRITOS</span>
                                    </h1>
                                    <div style="font-size: 0.8rem; color: rgba(255,255,255,0.6); font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin-top: 5px;">${evt.name}</div>
                                </div>
                            </div>
                        </div>
                        
                        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 15px;">
                            <button onclick="this.closest('#player-list-modal').remove()" style="background: rgba(255,255,255,0.05); border: 2px solid rgba(255,255,255,0.1); color: white; width: 44px; height: 44px; border-radius: 12px; font-size: 1.2rem; display: flex; align-items: center; justify-content: center; cursor: pointer; backdrop-filter: blur(10px); transition: all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.1)';" onmouseout="this.style.background='rgba(255,255,255,0.05)';">&times;</button>
                            <div style="background: rgba(0,0,0,0.5); padding: 12px 20px; border-radius: 16px; border: 1px solid rgba(204,255,0,0.3); text-align: right; box-shadow: 0 0 20px rgba(204,255,0,0.15); animation: pulseNeon 2s infinite;">
                                <div style="font-size: 0.65rem; color: #CCFF00; font-weight: 900; letter-spacing: 1px; text-transform: uppercase;">Total Plazas</div>
                                <div style="display: flex; align-items: baseline; gap: 4px; justify-content: flex-end;">
                                    <span id="player-count-display" style="font-size: 2.5rem; font-weight: 950; color: white; line-height: 1;">${players.length}</span>
                                    <span style="font-size: 1rem; color: rgba(255,255,255,0.4); font-weight: 800;">/ ${(evt.max_courts || 4) * 4}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="player-grid-container" style="position: relative; z-index: 5; flex: 1; overflow-y: auto; overflow-x: hidden; -webkit-overflow-scrolling: touch; padding: 10px 25px 40px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; scrollbar-width: none;">
                    <div style="grid-column: 1 / -1; text-align: center; padding: 100px 20px;">
                        <div class="loader-mini" style="margin: 0 auto 20px; border-top-color: #CCFF00;"></div>
                        <p style="color: rgba(255,255,255,0.5); font-weight: 800; font-size: 0.8rem; letter-spacing: 2px;">ESCANEANDO JUGADORES...</p>
                    </div>
                </div>

                <!-- BOTTOM INFO TICKER -->
                <div style="background: #000; height: 45px; border-top: 2px solid #CCFF00; display: flex; align-items: center; position: relative; z-index: 10; box-shadow: 0 -10px 30px rgba(0,0,0,0.5);">
                    <div style="background: #CCFF00; color: black; font-weight: 950; font-size: 0.75rem; padding: 0 20px; height: 100%; display: flex; align-items: center; z-index: 20; letter-spacing: 1px;">SISTEMA LIVE</div>
                    <div style="flex: 1; overflow: hidden; white-space: nowrap; position: relative; display: flex; align-items: center;">
                        <div id="player-ticker-content" style="display: inline-block; color: white; font-weight: 800; font-size: 0.8rem; padding-left: 100%;">
                            • CARGANDO ESTADÍSTICAS EN TIEMPO REAL...
                        </div>
                    </div>
                </div>

                <div style="background: rgba(0,0,0,0.98); padding: 30px; text-align: center; border-top: 1px solid rgba(255,255,255,0.05); position: relative; z-index: 10;">
                    <button onclick="document.getElementById('${modalId}').remove()" style="background: transparent; border: 2px solid rgba(255,255,255,0.2); color: white; padding: 16px 80px; border-radius: 14px; font-weight: 950; text-transform: uppercase; cursor: pointer; letter-spacing: 2px; transition: all 0.3s; font-size: 0.9rem;" onmouseover="this.style.borderColor='#CCFF00'; this.style.color='#CCFF00';" onmouseout="this.style.borderColor='rgba(255,255,255,0.2)'; this.style.color='white';">CERRAR VISTA</button>
                </div>
            `;

            document.body.appendChild(modal);

            // Fetch Hydrated Data in background
            try {
                const playerIds = players.map(p => (typeof p === 'string') ? p : (p.uid || p.id));
                let hydratedPlayers = [];
                const playersDict = {}; // Dictionary to store player data by ID

                if (playerIds.length > 0) {
                    // Filter invalid IDs to prevent Firestore errors
                    const validIds = playerIds.filter(id => id && typeof id === 'string' && id.trim() !== '');

                    if (validIds.length > 0) {
                        // Optimized fetching: Use 'in' query with documentId()
                        // Chunk size 10 is safe for 'in' queries on document IDs
                        const chunks = [];
                        for (let i = 0; i < validIds.length; i += 10) chunks.push(validIds.slice(i, i + 10));

                        try {
                            if (!window.db) throw new Error("Database not initialized");

                            const snapshots = await Promise.all(chunks.map(chunk =>
                                window.db.collection('players')
                                    .where(firebase.firestore.FieldPath.documentId(), 'in', chunk)
                                    .get()
                            ));

                            snapshots.forEach(snap => {
                                snap.forEach(doc => {
                                    // Store by BOTH id formats to be safe
                                    const data = doc.data();
                                    data.id = doc.id; // Ensure ID is present
                                    playersDict[doc.id] = data;
                                });
                            });
                        } catch (err) {
                            console.error("Hydration Error (Inner):", err);
                            // Siently fail hydration and fall back to default data
                        }
                    }
                }


                hydratedPlayers = players.map(p => {
                    const id = (typeof p === 'string') ? p : (p.uid || p.id);
                    const fullData = playersDict[id] || {};
                    // Ensure we get joinedAt from the original event player object if possible
                    const originalJoinedAt = (typeof p === 'object' && p.joinedAt) ? p.joinedAt : null;

                    // TEAM RESOLUTION - ROBUST
                    // Prioritize team_somospadel (Array) > team (String)
                    let teamName = fullData.team_somospadel || fullData.team || fullData.team_name || fullData.level_name || fullData.category || p.team || null;

                    if (Array.isArray(teamName)) {
                        // If user has multiple teams, try to find one that matches the event category/gender? 
                        // For simplicity, take the first one or join them?
                        // User wants to see "THE" team. Usually the first one is primary.
                        // Let's take the first non-empty one.
                        teamName = teamName.length > 0 ? teamName[0] : null;
                    }
                    if (teamName && typeof teamName === 'string') teamName = teamName.toUpperCase();

                    // LEVEL RESOLUTION
                    let level = parseFloat(fullData.level || fullData.playtomic_level || p.level || 0);

                    // Smart Level Deduction from Team (If level is 0 or missing)
                    // Also, if 'sync levels' is desired, we might overwrite?
                    // User complaint: "tampoco detecta los niveles reales". 
                    // It implies the level in DB is more accurate than 0, OR the team level should be used.
                    // Let's prioritize: DB Level > Team Level > Default.

                    if ((!level || level === 0) && teamName && window.AppConstants && window.AppConstants.TEAM_LEVELS) {
                        if (window.AppConstants.TEAM_LEVELS[teamName]) {
                            level = window.AppConstants.TEAM_LEVELS[teamName];
                        }
                    }
                    if (!level) level = 3.5; // Default fallback

                    return {
                        id: id,
                        name: fullData.name || p.name || 'JUGADOR',
                        level: level,
                        photoURL: fullData.photoURL || p.photoURL || null,
                        team: teamName,
                        joinedAt: originalJoinedAt
                    };
                });

                // Render Grid Internal Helper
                const grid = document.getElementById('player-grid-container');
                const formatJoinedAt = (iso) => {
                    if (!iso) return "CONFIRMADO";
                    try {
                        const d = new Date(iso);
                        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                    } catch (e) { return "CONFIRMADO"; }
                };

                if (grid) {
                    // NEON PALETTE FOR TEAMS (BRIGHTER)
                    const teamColors = [
                        '#00FFFF', // Cyan Neon
                        '#FF00FF', // Magenta Neon
                        '#FFFF00', // Yellow Neon
                        '#00FF00', // Green Neon
                        '#FFA500', // Orange Neon
                        '#AD00FF', // Purple Neon
                        '#FF0055', // Pink Neon
                        '#00FF99', // Teal Neon
                    ];

                    const getTeamColor = (name) => {
                        if (!name) return '#CCFF00';
                        let hash = 0;
                        for (let i = 0; i < name.length; i++) {
                            hash = name.charCodeAt(i) + ((hash << 5) - hash);
                        }
                        const index = Math.abs(hash) % teamColors.length;
                        return teamColors[index];
                    };

                    grid.innerHTML = hydratedPlayers.map((p, i) => {
                        const lvl = parseFloat(p.level || 3.5);
                        const lvlColor = lvl >= 4.5 ? '#FF2D55' : (lvl >= 4 ? '#FFCC00' : '#00E36D');

                        let teamHtml = '';
                        if (p.team) {
                            const tColor = getTeamColor(p.team);
                            // WOW EFFECT: Bigger scale + Double Shadow
                            teamHtml = `<div style="
                                font-size: 0.85rem; 
                                color: ${tColor}; 
                                font-weight: 950; 
                                text-transform: uppercase; 
                                margin-bottom: 5px; 
                                letter-spacing: 1.5px; 
                                text-shadow: 0 0 5px ${tColor}, 0 0 15px ${tColor};
                                animation: pulseText 2s infinite alternate;
                            ">${p.team}</div>`;
                        } else {
                            // FALLBACK IF NO TEAM: Show placeholder to avoid empty gap
                            teamHtml = `<div style="font-size: 0.5rem; color: #555; font-weight: 700; margin-bottom: 5px;">SIN EQUIPO</div>`;
                        }

                        return `
                            <div style="background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02)); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); border-bottom: 4px solid ${lvlColor}; border-radius: 24px; padding: 20px 5px 15px; text-align: center; animation: enterCard 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity:0; animation-delay:${i * 0.05}s; position: relative; box-shadow: 0 10px 20px rgba(0,0,0,0.2);">
                                <div style="position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: ${lvlColor}; color: #000; font-size: 0.6rem; font-weight: 950; padding: 3px 10px; border-radius: 20px; box-shadow: 0 0 15px ${lvlColor}66; white-space:nowrap;">NIVEL ${lvl.toFixed(2)}</div>
                                <div style="width: 55px; height: 55px; margin: 5px auto 10px; background: #000; border-radius: 18px; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 2px solid rgba(255,255,255,0.15); box-shadow: 0 5px 10px rgba(0,0,0,0.4);">
                                    ${p.photoURL ? `<img src="${p.photoURL}" style="width:100%; height:100%; object-fit:cover;">` : `<i class="fas fa-user-ninja" style="font-size: 1.5rem; color: #CCFF00; opacity: 0.8;"></i>`}
                                </div>
                                ${teamHtml}
                                <div style="font-size: 0.75rem; font-weight: 950; color: white; text-transform: uppercase; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: -0.2px; padding: 0 5px;">${p.name.split(' ')[0]} ${p.name.split(' ')[1] ? p.name.split(' ')[1].charAt(0) + '.' : ''}</div>
                                <div style="font-size: 0.55rem; color: rgba(255,255,255,0.4); font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">${formatJoinedAt(p.joinedAt)}</div>
                            </div>`;
                    }).join('');
                }

                const ticker = document.getElementById('player-ticker-content');
                if (ticker && hydratedPlayers.length > 0) {
                    const avgLvl = (hydratedPlayers.reduce((a, b) => a + (parseFloat(b.level) || 3.5), 0) / hydratedPlayers.length).toFixed(2);
                    ticker.style.animation = 'newsTicker 30s linear infinite';
                    ticker.innerHTML = `• NIVEL MEDIO: ${avgLvl} ${hydratedPlayers.map(p => `• ${p.name.toUpperCase()} (LVL: ${(parseFloat(p.level || 3.5)).toFixed(2)})`).join(' ')}`;
                }
            } catch (err) {
                console.error("Error hydrating players:", err);
                const grid = document.getElementById('player-grid-container');
                if (grid) grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: #ff3b30; padding: 20px;">Error al cargar jugadores.</div>`;
            }
        }

        // Helper: Wait for AmericanaService to be ready
        async waitForService(maxRetries = 10) {
            for (let i = 0; i < maxRetries; i++) {
                if (window.AmericanaService && window.AmericanaService.db) {
                    return true;
                }
                await new Promise(resolve => setTimeout(resolve, 100 * (i + 1))); // Exponential backoff
            }
            return false;
        }

        async openLiveEvent(id, type = 'americana') {
            console.log("🔓 [EventsController] Opening LIVE event:", id, "Type:", type);

            // NEW: Redirect Entrenos to dedicated simple view
            if (type === 'entreno') {
                console.log("👉 Redirecting Entreno to EntrenoLiveView");

                if (!window.EntrenoLiveView) {
                    console.error("❌ EntrenoLiveView not loaded!");
                    alert("Error: El módulo de Entrenos no está cargado. Por favor recarga la página.");
                    return;
                }

                window.currentLiveEntrenoId = id;
                sessionStorage.setItem('currentLiveEntrenoId', id);
                window.Router.navigate('live-entreno');
                return;
            }

            // 1. Validate Router
            if (!window.Router) {
                alert("❌ Error Crítico: Router no encontrado. Recarga la página.");
                return;
            }

            // 2. Validate ControlTowerView
            if (!window.ControlTowerView) {
                console.warn("⚠️ ControlTowerView not ready. Waiting 1000ms...");
                // UI Feedback
                const btn = document.activeElement;
                if (btn) {
                    const originalText = btn.innerHTML;
                    btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> CARGANDO...';
                    setTimeout(() => btn.innerHTML = originalText, 2000);
                }

                await new Promise(r => setTimeout(r, 1000));

                // Retry Check
                if (!window.ControlTowerView) {
                    // Last ditch effort: Try to instantiate if class exists
                    try {
                        if (window.ControlTowerViewClass) {
                            window.ControlTowerView = new window.ControlTowerViewClass();
                            console.log("⚠️ Force-Instantiated ControlTowerView from exported class");
                        } else {
                            alert("❌ Error: El módulo de control no se ha cargado correctamente.\n\nPor favor, recarga la página completamente.");
                            return;
                        }
                    } catch (e) {
                        alert("❌ Error Fatal: " + e.message);
                        return;
                    }
                }
            }

            // 3. Prepare & Go
            try {
                if (window.ControlTowerView) {
                    // PASS TYPE TO CONTROL TOWER
                    window.ControlTowerView.prepareLoad(id, type);
                    window.Router.navigate('live');
                } else {
                    throw new Error("ControlTowerView null after checks");
                }
            } catch (err) {
                console.error("Navigation error:", err);
                alert("❌ Error de Navegación: " + err.message);
            }
        }

        async joinEvent(id, type = 'americana') {
            if (!this.state.currentUser) { alert("Acceso denegado. Inicia sesión."); return; }

            // Wait for service
            const ready = await this.waitForService();
            if (!ready) {
                alert("⚠️ El sistema aún se está cargando. Por favor, espera unos segundos e inténtalo de nuevo.");
                return;
            }

            const confirm = window.confirm("¿Confirmas tu inscripción?");
            if (!confirm) return;
            try {
                const res = await window.AmericanaService.addPlayer(id, this.state.currentUser, type);
                if (res.success) alert("Inscripción exitosa");
                else alert("Error: " + res.error);
            } catch (err) { alert("Error fatal: " + err.message); }
        }

        async leaveEvent(id, type = 'americana') {
            if (!this.state.currentUser) return;

            // Wait for service
            const ready = await this.waitForService();
            if (!ready) {
                alert("⚠️ El sistema aún se está cargando. Por favor, espera unos segundos e inténtalo de nuevo.");
                return;
            }

            const confirm = window.confirm("¿Deseas darte de baja de este evento?");
            if (!confirm) return;
            try {
                const res = await window.AmericanaService.removePlayer(id, this.state.currentUser.uid, type);
                if (res.success) alert("Te has dado de baja correctamente.");
                else alert("Error: " + res.error);
            } catch (err) { alert("Error fatal: " + err.message); }
        }

        async joinWaitlist(id, type = 'americana') {
            if (!this.state.currentUser) {
                alert("Acceso denegado. Inicia sesión.");
                return;
            }

            const confirm = window.confirm("¿Quieres añadirte a la lista de reserva?\n\nSi hay una plaza disponible, te avisaremos automáticamente.");
            if (!confirm) return;

            try {
                const db = type === 'entreno' ? window.FirebaseDB.entrenos : window.FirebaseDB.americanas;
                await db.addToWaitlist(id, {
                    uid: this.state.currentUser.uid,
                    name: this.state.currentUser.name || this.state.currentUser.displayName
                });
                alert("✅ Te has añadido a la lista de reserva.\n\nTe avisaremos si hay plaza disponible.");
                this.init(); // Refresh
            } catch (e) {
                alert("❌ " + e.message);
            }
        }

        async leaveWaitlist(id, type = 'americana') {
            if (!this.state.currentUser) return;

            const confirm = window.confirm("¿Salir de la lista de reserva?");
            if (!confirm) return;

            try {
                const db = type === 'entreno' ? window.FirebaseDB.entrenos : window.FirebaseDB.americanas;
                await db.removeFromWaitlist(id, this.state.currentUser.uid);
                alert("Has salido de la lista de reserva.");
                this.init(); // Refresh
            } catch (e) {
                alert("❌ " + e.message);
            }
        }
    }

    window.EventsController = new EventsController();
    console.log("🚀 [EventsController_V5] Global instance ready!");
    // --- ENBEDDED ENTRENO LIVE VIEW (Emergency Fix + Enhanced Score Features + UI Upgrade) ---
    class EntrenoLiveView {
        constructor() {
            this.eventId = null;
            this.unsubscribe = null;
            this.matches = [];
            this.viewState = {
                tab: 'matches', // matches, standings, stats
                selectedRound: null,
                editingMatchId: null
            };
            // Singleton pattern to ensure UI events always find the right instance
            window.EntrenoLiveView = this;
        }

        handleRoute() {
            let eventId = window.currentLiveEntrenoId;
            if (!eventId) eventId = sessionStorage.getItem('currentLiveEntrenoId');

            console.log("🎯 [EntrenoLiveView] Handling Route. ID:", eventId);

            if (!eventId) {
                console.error("❌ No Entreno ID found. Redirecting...");
                window.Router.navigate('entrenos');
                return;
            }

            this.load(eventId);
        }

        async load(eventId) {
            this.eventId = eventId;
            this.renderLoading();

            try {
                // 1. Get Event Details
                const doc = await window.db.collection('entrenos').doc(eventId).get();
                if (!doc.exists) {
                    alert("Entreno no encontrado");
                    window.Router.navigate('entrenos');
                    return;
                }
                this.eventData = doc.data();

                // 2. Start Listening to Matches
                if (this.unsubscribe) this.unsubscribe();

                this.unsubscribe = window.db.collection('entrenos_matches')
                    .where('americana_id', '==', eventId)
                    .onSnapshot(snapshot => {
                        this.matches = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                        console.log("🔥 Loaded Matches:", this.matches.length, this.matches);
                        // Auto-select latest round if none selected OR if we just generated a new one
                        const maxRound = Math.max(...this.matches.map(m => parseInt(m.round) || 1), 1);
                        console.log("📊 Max Round Detected:", maxRound);

                        // If we detect a new round appeared that is higher than current, switch to it?
                        // Or just if none selected?
                        if (!this.viewState.selectedRound || maxRound > this.viewState.selectedRound) {
                            this.viewState.selectedRound = maxRound;
                        }

                        this.render();
                    }, err => {
                        console.error("Error loading entreno matches:", err);
                        this.renderError(err.message);
                    });

            } catch (e) {
                console.error("Critical Error loading entreno:", e);
                this.renderError(e.message);
            }
        }

        // --- ACTIONS ---

        _isUserAuthorized() {
            const user = window.Store?.getState('currentUser') || window.AdminAuth?.user;
            if (!user) return false;

            // 1. Check Admin Roles (Comprehensive list from admin.js)
            const role = (user.role || '').toString().toLowerCase().trim();
            const isAdmin = ['super_admin', 'superadmin', 'admin', 'admin_player', 'captain', 'capitan', 'capitanes'].includes(role);
            if (isAdmin || window.AdminAuth?.user) return true;

            // 2. Check if player is registered in this entreno
            const players = this.eventData?.players || this.eventData?.registeredPlayers || [];
            const isRegistered = players.some(p => (p.id === user.uid || p.uid === user.uid || p.id === user.id || p.uid === user.id));

            return isRegistered;
        }

        setTab(tab) {
            this.viewState.tab = tab;
            this.render();
        }

        setRound(round) {
            this.viewState.selectedRound = round;
            this.render();
        }

        openEditScore(matchId) {
            this.viewState.editingMatchId = matchId;
            this.render();
        }



        async adjustScore(matchId, field, delta) {
            const m = this.matches.find(match => match.id === matchId);
            if (!m) return;

            // CHECK CASCADE
            const maxRound = Math.max(...this.matches.map(m => parseInt(m.round) || 1));
            const matchRound = parseInt(m.round) || 1;

            if (matchRound < maxRound) {
                if (confirm(`⚠️ ATENCIÓN: Estás editando la Ronda ${matchRound}, pero ya existen rondas posteriores (hasta R${maxRound}).\n\nLos cruces de las rondas siguientes ya no son válidos.\n\n¿Deseas BORRAR las rondas posteriores y regenerar desde aquí?`)) {
                    await window.MatchMakingService.purgeSubsequentRounds(this.eventId, matchRound, 'entreno');
                    // Render will happen automatically via snapshot
                    return;
                }
            }

            const current = parseInt(m[field] || 0);
            const newValue = Math.max(0, current + delta);
            await this.updateScore(matchId, field, newValue);
        }

        async updateScore(matchId, field, value) {
            try {
                const update = {};
                update[field] = parseInt(value) || 0;
                await window.db.collection('entrenos_matches').doc(matchId).update(update);
            } catch (e) {
                console.error("Error updating score:", e);
            }
        }

        async finishMatch(matchId, currentScoreA, currentScoreB) {
            if (!confirm("¿Confirmar resultado " + currentScoreA + " - " + currentScoreB + "?")) return;
            try {
                // 1. Finish this match
                await window.db.collection('entrenos_matches').doc(matchId).update({ status: 'finished' });

                // 2. CHECK FOR AUTO-GENERATION & CASCADE
                const m = this.matches.find(m => m.id === matchId);
                if (m) {
                    const currentRound = parseInt(m.round) || 1;
                    const roundMatches = this.matches.filter(rm => (parseInt(rm.round) || 1) === currentRound);
                    const unfinishedOthers = roundMatches.filter(rm => rm.id !== matchId && rm.status !== 'finished');

                    if (unfinishedOthers.length === 0) {
                        // This round is complete!
                        console.log(`🚀 Round ${currentRound} Complete! Checking for cascade...`);

                        // Check if subsequent rounds exist
                        const maxRoundNumInDB = Math.max(...this.matches.map(rm => parseInt(rm.round) || 1));

                        if (currentRound < maxRoundNumInDB) {
                            console.log(`🧹 Double check purge: R${currentRound} finished, cleaning higher rounds.`);
                            if (window.MatchMakingService) {
                                await window.MatchMakingService.purgeSubsequentRounds(this.eventId, currentRound, 'entreno');
                                await new Promise(r => setTimeout(r, 1000));
                            }
                        }

                        // Close edit mode
                        this.viewState.editingMatchId = null;

                        // Trigger Generation
                        setTimeout(() => this.generateNextRound(), 1200);
                    } else {
                        // Just close edit mode
                        this.viewState.editingMatchId = null;
                        this.render();
                    }
                }
            } catch (e) {
                alert("Error al finalizar: " + e.message);
            }
        }

        async unlockMatch(matchId) {
            const m = this.matches.find(match => match.id === matchId);
            if (!m) {
                console.error("Match not found:", matchId);
                return;
            }

            // CHECK CASCADE
            const maxRound = Math.max(...this.matches.map(m => parseInt(m.round) || 1));
            const matchRound = parseInt(m.round) || 1;

            if (matchRound < maxRound) {
                if (!confirm(`⚠️ ATENCIÓN: Estás reabriendo un partido de la Ronda ${matchRound}, pero ya existen rondas posteriores.\n\nEsto BORRARÁ permanentemente las rondas posteriores.\n\n¿Deseas continuar?`)) return;

                // Set to current round so UI doesn't look at "deleted" rounds
                this.viewState.selectedRound = matchRound;

                try {
                    if (window.MatchMakingService) {
                        console.log("🧹 Purging rounds after:", matchRound);
                        await window.MatchMakingService.purgeSubsequentRounds(this.eventId, matchRound, 'entreno');
                    }
                } catch (e) {
                    alert("Error purgando rondas: " + e.message);
                    return;
                }

                // Wait for listeners
                await new Promise(r => setTimeout(r, 1000));
            } else {
                if (!confirm("¿Editar resultado? El partido volverá a estar activo.")) return;
            }

            try {
                console.log("✏️ Unlocking match:", matchId);
                await window.db.collection('entrenos_matches').doc(matchId).update({
                    status: 'scheduled'
                });

                this.viewState.editingMatchId = matchId;
                this.render();
            } catch (e) {
                alert("❌ Error al desbloquear: " + e.message);
            }
        }

        async generateNextRound() {
            // Robust calculation: target round is maxFinished + 1
            const finishedMatches = this.matches.filter(m => m.status === 'finished');
            const maxFinishedRound = finishedMatches.length > 0 ? Math.max(...finishedMatches.map(m => parseInt(m.round) || 1)) : 0;

            const nextRoundNum = maxFinishedRound + 1;

            if (nextRoundNum > 6) {
                if (this.eventData && this.eventData.is_simulation) return;
                alert("Torneo finalizado (R6 completada).");
                return;
            }

            const btn = document.getElementById('btn-next-round');
            if (btn) btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Generando P' + nextRoundNum + '...';

            try {
                if (window.AmericanaService) {
                    await window.AmericanaService.generateNextRound(this.eventId, maxFinishedRound, 'entreno');

                    // AUTO-SIMULATION CHAIN
                    if (this.eventData && this.eventData.is_simulation) {
                        if (window.MatchMakingService) {
                            await window.MatchMakingService.simulateRound(this.eventId, nextRoundNum, 'entreno');
                            if (nextRoundNum < 6) {
                                setTimeout(() => this.generateNextRound(), 1200);
                            }
                        }
                    }

                    this.viewState.selectedRound = nextRoundNum;
                    setTimeout(() => this.render(), 600);
                } else {
                    alert("Error: Servicio no disponible");
                }
            } catch (e) {
                console.error(e);
                alert("Error generando ronda: " + e.message);
                if (btn) btn.innerHTML = 'INTENTAR DE NUEVO';
            }
        }

        // --- DATA PROCESSING ---

        calculateStandings() {
            const standings = {};

            // Initialize from registered players if available, or infer from matches
            // Ideally we use eventData.players
            const players = this.eventData.players || this.eventData.registeredPlayers || [];
            players.forEach(p => {
                standings[p.id || p.uid] = {
                    name: p.name,
                    played: 0,
                    won: 0,
                    points: 0,
                    diff: 0
                };
            });

            this.matches.forEach(m => {
                if (m.status !== 'finished') return;

                const sA = parseInt(m.score_a || 0);
                const sB = parseInt(m.score_b || 0);

                const processTeam = (ids, scoreFor, scoreAgainst) => {
                    ids.forEach(id => {
                        if (!standings[id]) standings[id] = { name: 'Unknown', played: 0, won: 0, points: 0, diff: 0 };

                        standings[id].played++;
                        standings[id].points += scoreFor; // Americana style: points = games won
                        standings[id].diff += (scoreFor - scoreAgainst);
                        if (scoreFor > scoreAgainst) standings[id].won++;
                    });
                };

                processTeam(m.team_a_ids || [], sA, sB);
                processTeam(m.team_b_ids || [], sB, sA);
            });

            return Object.values(standings).sort((a, b) => b.points - a.points || b.diff - a.diff);
        }

        // --- RENDER ---

        renderLoading() {
            const container = document.getElementById('content-area');
            if (container) {
                container.innerHTML = `
                    <div style="height:80vh; display:flex; flex-direction:column; align-items:center; justify-content:center; color:white;">
                        <div class="loader"></div>
                        <h3 style="margin-top:20px; font-weight:300;">Conectando con pista...</h3>
                    </div>
                `;
            }
        }

        renderError(msg) {
            const container = document.getElementById('content-area');
            if (container) {
                container.innerHTML = `<div style="padding:40px; text-align:center; color:white;">Error: ${msg}</div>`;
            }
        }

        render() {
            const container = document.getElementById('content-area');
            if (!container) return;

            const maxRound = Math.max(...this.matches.map(m => m.round || 1), 1);
            if (!this.viewState.selectedRound) this.viewState.selectedRound = maxRound;

            // Header UI with Gradient and Tabs
            const headerHtml = `
                <div style="background:white; padding-top:20px; padding-bottom:10px; position:sticky; top:0; z-index:100; backdrop-filter:blur(15px); background-color:rgba(255,255,255,0.9); border-bottom:1px solid #f1f5f9; box-shadow:0 10px 30px rgba(0,0,0,0.02);">
                     <div style="display:flex; justify-content:space-between; align-items:center; padding:0 20px; margin-bottom:15px;">
                        <button onclick="window.Router.navigate('entrenos')" style="background:none; border:none; color:#1e293b; font-size:1.2rem; cursor:pointer;"><i class="fas fa-arrow-left"></i></button>
                        <div style="display:flex; flex-direction:column; align-items:center;">
                            <h1 style="color:#000; margin:0; font-size:1.1rem; font-weight:950; letter-spacing:0.5px; text-transform:uppercase; text-align:center;">${this.eventData.name || 'Entreno'}</h1>
                            <span style="font-size:0.7rem; color:#94a3b8; font-weight:700;">${this.eventData.date || ''} • ENTRENO</span>
                        </div>
                        <div style="width:30px; text-align:right;">
                            <i class="fas fa-signal" style="color:#10b981; font-size:0.8rem;"></i>
                        </div>
                    </div>

                    <!-- TABS -->
                    <div style="display:grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap:8px; padding:0 15px; margin-bottom:15px;">
                        ${this._renderTabBtn('matches', 'PARTIDOS')}
                        ${this._renderTabBtn('standings', 'POSICIONES')}
                        ${this._renderTabBtn('stats', 'ESTADÍSTICAS')}
                        ${this._renderTabBtn('report', 'INFORME')}
                    </div>

                    <!-- ROUND SELECTOR (Only active for Matches Tab) -->
                    ${this.viewState.tab === 'matches' ? this._renderRoundSelector(maxRound) : ''}
                </div>
            `;

            let contentHtml = '';
            if (this.viewState.tab === 'matches') {
                contentHtml = this._renderMatchesContent(maxRound);
            } else if (this.viewState.tab === 'standings') {
                contentHtml = this._renderStandingsContent();
            } else if (this.viewState.tab === 'stats') {
                contentHtml = this._renderStatsContent();
            } else {
                contentHtml = this._renderReportContent();
            }

            container.innerHTML = `
                <div style="background:#f8f9fa; min-height:100vh; font-family:'Outfit', sans-serif; padding-bottom:100px;">
                    ${headerHtml}
                    ${contentHtml}
                </div>
            `;
        }

        _renderTabBtn(id, label) {
            const isActive = this.viewState.tab === id;
            return `
                <button onclick="window.EntrenoLiveView.setTab('${id}')" 
                    style="padding:12px; border-radius:12px; border:none; font-weight:900; font-size:0.75rem; letter-spacing:0.3px; transition:all 0.3s;
                    ${isActive ? 'background:#CCFF00; color:black; box-shadow:0 8px 20px rgba(204,255,0,0.25); transform:translateY(-2px);' : 'background:#e2e8f0; color:#64748b;'}">
                    ${label}
                </button>
            `;
        }

        _renderRoundSelector(maxRound) {
            // Force 6 rounds limit based on user request (R1 to R6)
            let roundsFn = [1, 2, 3, 4, 5, 6];

            return `
                <div style="display:flex; align-items:center; gap:12px; overflow-x:auto; padding:0 20px 15px 20px; -webkit-overflow-scrolling:touch; scrollbar-width:none;">
                    ${roundsFn.map(r => {
                const exists = (this.matches.some(m => (parseInt(m.round) || 1) === r));
                const isActive = this.viewState.selectedRound === r;

                return `
                        <button onclick="window.EntrenoLiveView.setRound(${r})" 
                            style="min-width:55px; height:55px; border-radius:18px; border:none; font-weight:900; font-size:1rem; flex-shrink:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; box-shadow:0 10px 20px rgba(0,0,0,0.05); transition:all 0.3s;
                            ${isActive ? 'background:white; color:black; transform:scale(1.05); border:3px solid #CCFF00;' : (exists ? 'background:#f8fafc; color:#1e293b; border:1px solid #e2e8f0;' : 'background:#f1f5f9; color:#cbd5e1; opacity:0.6;')}">
                            <span>P${r}</span>
                            ${isActive ? '<span style="font-size:0.5rem; color:#CCFF00; font-weight:950; background:black; padding:1px 4px; border-radius:4px;">PROX</span>' : ''}
                        </button>`;
            }).join('')}
                    
                    <!-- FIN Indicator -->
                    <div style="min-width:60px; height:55px; border-radius:18px; border:2px dashed #cbd5e1; display:flex; flex-direction:column; align-items:center; justify-content:center; opacity:0.6; flex-shrink:0; color:#94a3b8;">
                        <i class="fas fa-flag-checkered" style="font-size:0.8rem;"></i>
                        <span style="font-size:0.6rem; font-weight:900;">FIN</span>
                    </div>
                </div>
            `;
        }

        _renderMatchesContent(maxRound) {
            const round = this.viewState.selectedRound;
            const roundMatches = this.matches.filter(m => (parseInt(m.round) || 1) === round);

            // SORT MATCHES BY COURT (1,2,3...)
            roundMatches.sort((a, b) => (parseInt(a.court) || 999) - (parseInt(b.court) || 999));

            const isLatestRound = round === maxRound;
            const allFinished = roundMatches.length > 0 && roundMatches.every(m => m.status === 'finished');

            if (roundMatches.length === 0) {
                return `<div style="padding:100px 20px; text-align:center; color:#94a3b8;">
                    <i class="fas fa-ghost" style="font-size:3rem; margin-bottom:1rem; opacity:0.1;"></i>
                    <p style="font-weight:700;">No hay partidos cargados en la Partida ${round}.</p>
                </div>`;
            }

            return `
                <div style="padding:10px 20px; display:grid; gap:15px; animation:fadeIn 0.4s ease-out;">
                    ${roundMatches.map(m => this.renderMatchCard(m)).join('')}
                    
                    ${(isLatestRound && allFinished) ? `
                        <div style="margin-top:20px;">
                            ${round < 6 ? `
                                <button id="btn-next-round" onclick="window.EntrenoLiveView.generateNextRound()" 
                                    style="width:100%; background:#CCFF00; color:black; border:none; padding:20px; border-radius:20px; font-weight:950; font-size:1.1rem; box-shadow:0 10px 25px rgba(204,255,0,0.25); display:flex; justify-content:center; align-items:center; gap:12px; transition:all 0.3s; cursor:pointer;">
                                    GENERAR PARTIDA ${round + 1} <i class="fas fa-arrow-right"></i>
                                </button>
                            ` : `
                                <div style="background:white; border-radius:24px; padding:25px; text-align:center; border:2px solid #CCFF00; box-shadow:0 15px 35px rgba(0,0,0,0.05);">
                                    <div style="width:50px; height:50px; background:#CCFF00; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 15px;">
                                        <i class="fas fa-flag-checkered" style="color:black;"></i>
                                    </div>
                                    <h3 style="color:#1e293b; font-weight:950; margin:0 0 5px 0;">¡ENTRENO FINALIZADO!</h3>
                                    <p style="color:#64748b; font-size:0.85rem; margin-bottom:0;">Todas las partidas (6/6) completadas.</p>
                                </div>
                            `}
                        </div>
                    ` : ''}
                </div>
            `;
        }

        _renderStandingsContent() {
            const data = this.calculateStandings();
            return `
                <div style="padding:0 20px; animation:fadeIn 0.4s ease-out;">
                    <div style="background:white; border-radius:28px; overflow:hidden; box-shadow:0 15px 35px rgba(0,0,0,0.03); border:1px solid rgba(0,0,0,0.02);">
                        <table style="width:100%; border-collapse:collapse; color:#1e293b; font-size:0.95rem;">
                            <thead style="background:#f8fafc; color:#94a3b8; font-size:0.7rem; text-transform:uppercase; font-weight:900; letter-spacing:1px;">
                                <tr>
                                    <th style="padding:18px 20px; text-align:left;"># JUGADOR</th>
                                    <th style="padding:18px 20px; text-align:center;">PJ</th>
                                    <th style="padding:18px 20px; text-align:center;">DIF</th>
                                    <th style="padding:18px 20px; text-align:center; color:#CCFF00; background:black;">PTS</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.map((p, i) => `
                                    <tr style="border-bottom:1px solid #f1f5f9; ${i === 0 ? 'background:#CCFF00;' : ''}">
                                        <td style="padding:16px 20px; display:flex; align-items:center; gap:15px;">
                                            <span style="font-weight:950; color:${i < 3 ? (i === 0 ? '#000' : '#CCFF00') : '#cbd5e1'}; font-size:1.1rem; width:22px;">${i + 1}</span>
                                            <div style="display:flex; flex-direction:column;">
                                                <span style="font-weight:800; color:#1e293b; font-size:0.95rem;">${p.name.toUpperCase()}</span>
                                                <span style="font-size:0.65rem; color:${i === 0 ? '#000' : '#94a3b8'}; font-weight:700;">${p.won} VICTORIAS</span>
                                            </div>
                                        </td>
                                        <td style="padding:16px 20px; text-align:center; color:#64748b; font-weight:700;">${p.played}</td>
                                        <td style="padding:16px 20px; text-align:center; font-weight:800; color:${p.diff > 0 ? '#10b981' : (p.diff < 0 ? '#ef4444' : '#94a3b8')}">${p.diff > 0 ? '+' + p.diff : p.diff}</td>
                                        <td style="padding:16px 20px; text-align:center; font-weight:950; font-size:1.2rem; ${i === 0 ? '' : 'background:rgba(204,255,0,0.02);'}">
                                            <span style="${i === 0 ? 'color:#000; font-size:1.4rem;' : 'border-bottom:3px solid #CCFF00;'}">${p.points}</span>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }

        _renderReportContent() {
            const finishedMatches = this.matches.filter(m => m.status === 'finished');
            if (finishedMatches.length === 0) {
                return `<div style="padding:100px 20px; text-align:center; color:#94a3b8;">
                    <i class="fas fa-chart-line" style="font-size:3rem; margin-bottom:20px; opacity:0.2;"></i>
                    <h3 style="color:#1e293b; font-weight:950;">ANÁLISIS EN PAUSA</h3>
                    <p style="font-size:0.9rem;">Necesitamos datos de partidos finalizados para el Informe Pro.</p>
                </div>`;
            }

            // Calculation Logic
            const players = {};
            const pairs = {};

            finishedMatches.forEach(m => {
                const sA = parseInt(m.score_a || 0);
                const sB = parseInt(m.score_b || 0);

                const track = (ids, names, score, oppScore) => {
                    if (ids.length === 2) {
                        const pairId = ids.sort().join('|');
                        const pairNames = names.sort().join(' / ');
                        if (!pairs[pairId]) pairs[pairId] = { names: pairNames, won: 0, pj: 0, gf: 0, gc: 0 };
                        pairs[pairId].pj++;
                        pairs[pairId].gf += score;
                        pairs[pairId].gc += oppScore;
                        if (score > oppScore) pairs[pairId].won++;
                    }
                    ids.forEach((id, i) => {
                        if (!players[id]) players[id] = { name: names[i], gf: 0, gc: 0, won: 0, pj: 0 };
                        players[id].pj++;
                        players[id].gf += score;
                        players[id].gc += oppScore;
                        if (score > oppScore) players[id].won++;
                    });
                };
                track(m.team_a_ids, m.team_a_names, sA, sB);
                track(m.team_b_ids, m.team_b_names, sB, sA);
            });

            const topPair = Object.values(pairs).sort((a, b) => b.won - a.won || (b.gf - b.gc) - (a.gf - a.gc))[0] || { names: 'Consultando...', won: 0 };
            const topPlayer = Object.values(players).sort((a, b) => b.won - a.won || (b.gf - b.gc) - (a.gf - a.gc))[0];

            return `
                <div style="padding:0 20px; animation:fadeIn 0.5s ease-out;">
                    <!-- HEADER EXPLICATIVO -->
                    <div style="background:linear-gradient(135deg, #000 0%, #1e293b 100%); border-radius:24px; padding:25px; margin-bottom:25px; box-shadow:0 15px 40px rgba(0,0,0,0.15); border:2px solid #CCFF00;">
                        <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
                            <div style="width:40px; height:40px; background:#CCFF00; border-radius:12px; display:flex; align-items:center; justify-content:center;">
                                <i class="fas fa-chart-bar" style="color:#000; font-size:1.2rem;"></i>
                            </div>
                            <h2 style="color:#CCFF00; margin:0; font-size:1.3rem; font-weight:950; letter-spacing:0.5px;">ESTADÍSTICAS AVANZADAS</h2>
                        </div>
                        <p style="color:#fff; margin:0; font-size:0.9rem; line-height:1.6; font-weight:500;">
                            Análisis detallado del rendimiento individual y por parejas durante este entreno. 
                            Aquí encontrarás métricas clave como MVP, mejores sociedades, diferencial de juegos y eficiencia en pista.
                        </p>
                    </div>

                    <!-- HERO INSIGHT -->
                    <div style="background:white; border-radius:28px; padding:25px; box-shadow:0 15px 35px rgba(0,0,0,0.04); margin-bottom:25px; border:1px solid rgba(0,0,0,0.01); position:relative; overflow:hidden;">
                        <div style="position: absolute; right: -10px; top: -10px; font-size: 6rem; color: #CCFF00; opacity: 0.08;"><i class="fas fa-medal"></i></div>
                        <div style="display:flex; align-items:center; gap:10px; margin-bottom:15px;">
                            <span style="background:#000; color:#CCFF00; padding:4px 10px; border-radius:8px; font-weight:950; font-size:0.65rem; text-transform:uppercase; letter-spacing:1px;">MVP BIG DATA</span>
                        </div>
                        <h2 style="color:#1e293b; margin:0 0 10px 0; font-size:1.6rem; font-weight:950; line-height:1.1;">${topPlayer.name.toUpperCase()}</h2>
                        <p style="color:#64748b; font-size:0.95rem; line-height:1.4; margin:0; font-weight:600;">Máxima efectividad en pista con un diferencial de <b style="color:#000;">+${topPlayer.gf - topPlayer.gc}</b> juegos.</p>
                    </div>

                    <!-- TOP PAIRS RANKING -->
                    <div style="background:white; border-radius:24px; padding:20px; box-shadow:0 4px 15px rgba(0,0,0,0.02); margin-bottom:25px;">
                        <h3 style="color:#94a3b8; font-size:0.75rem; font-weight:900; text-transform:uppercase; letter-spacing:1.5px; margin-bottom:15px; display:flex; align-items:center; gap:8px;">
                            <i class="fas fa-hands-helping" style="color:#CCFF00;"></i> SOCIEDADES DE ÉLITE (TOP 5)
                        </h3>
                        <div style="display:flex; flex-direction:column; gap:12px;">
                            ${(() => {
                    const pairsList = Object.values(pairs).sort((a, b) => b.won - a.won || (b.gf - b.gc) - (a.gf - a.gc)).slice(0, 5);

                    if (pairsList.length === 0) {
                        return '<div style="text-align:center; padding:20px; color:#94a3b8;">No hay datos de parejas disponibles</div>';
                    }

                    const maxWins = pairsList[0].won || 1;
                    const colors = ['#CCFF00', '#a3e635', '#84cc16', '#65a30d', '#4d7c0f'];
                    const bgColors = ['#000', '#1e293b', '#334155', '#475569', '#64748b'];

                    return pairsList.map((pair, idx) => {
                        const barWidth = (pair.won / maxWins) * 100;

                        return `
                                        <div style="display:flex; justify-content:space-between; align-items:center; background:${idx === 0 ? '#f0fdf4' : '#f8fafc'}; padding:15px; border-radius:18px; border:1px solid ${idx === 0 ? colors[0] : '#f1f5f9'}; position:relative; overflow:hidden;">
                                            <div style="position:absolute; left:0; top:0; bottom:0; width:${barWidth}%; background:linear-gradient(90deg, ${colors[idx]}22 0%, transparent 100%); z-index:0;"></div>
                                            <div style="display:flex; align-items:center; gap:12px; z-index:1; position:relative;">
                                                <div style="width:35px; height:35px; background:${bgColors[idx]}; border-radius:10px; display:flex; align-items:center; justify-content:center; color:${colors[idx]}; font-weight:900; font-size:1rem;">
                                                    ${idx + 1}
                                                </div>
                                                <div style="display:flex; flex-direction:column;">
                                                    <span style="font-weight:800; color:#1e293b; font-size:0.95rem;">${pair.names}</span>
                                                    <span style="font-size:0.7rem; color:#64748b; font-weight:700;">${pair.pj} partidos • ${pair.gf}F/${pair.gc}C</span>
                                                </div>
                                            </div>
                                            <span style="background:${idx === 0 ? colors[0] : '#e2e8f0'}; color:${idx === 0 ? 'black' : '#64748b'}; padding:4px 12px; border-radius:10px; font-weight:950; font-size:0.8rem; z-index:1; position:relative;">
                                                ${pair.won} ${pair.won === 1 ? 'VICTORIA' : 'VICTORIAS'}
                                            </span>
                                        </div>
                                    `;
                    }).join('');
                })()}
                        </div>
                    </div>

                    <!-- GOLAVERAGE CHART -->
                    <div style="background:white; border-radius:25px; padding:25px; box-shadow:0 10px 30px rgba(0,0,0,0.03); margin-bottom:25px;">
                        <h3 style="color:#94a3b8; font-size:0.75rem; font-weight:900; text-transform:uppercase; letter-spacing:1px; margin-bottom:20px;">DIFERENCIAL DE JUEGOS (TOP 4)</h3>
                        ${Object.values(players).sort((a, b) => b.gf - b.gc).slice(0, 4).map(p => {
                    const total = p.gf + p.gc || 1;
                    const perc = (p.gf / total) * 100;
                    return `
                            <div style="margin-bottom:18px;">
                                <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-weight:800; font-size:0.85rem; color:#1e293b;">
                                    <span>${p.name.toUpperCase()}</span>
                                    <span style="color:#64748b;">${p.gf}F / ${p.gc}C</span>
                                </div>
                                <div style="width:100%; height:10px; background:#f1f5f9; border-radius:10px; overflow:hidden; border:1px solid rgba(0,0,0,0.03);">
                                    <div style="width:${perc}%; height:100%; background:linear-gradient(90deg, #CCFF00 0%, #a3e635 100%); box-shadow:0 0 10px rgba(204,255,0,0.2);"></div>
                                </div>
                            </div>
                            `;
                }).join('')}
                    </div>

                    <!-- TOP METRICS GRID -->
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; margin-bottom:25px;">
                        ${(() => {
                    const topScorer = Object.values(players).sort((a, b) => b.gf - a.gf)[0];
                    const bestDefense = Object.values(players).sort((a, b) => a.gc - b.gc)[0];
                    const mostActive = Object.values(players).sort((a, b) => b.pj - a.pj)[0];
                    const winRateChamp = Object.values(players).sort((a, b) => (b.won / b.pj) - (a.won / a.pj))[0];

                    return `
                                <!-- TOP GOLEADOR -->
                                <div style="background:white; border-radius:20px; padding:20px; box-shadow:0 8px 20px rgba(0,0,0,0.03); border:1px solid rgba(0,0,0,0.02);">
                                    <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px;">
                                        <div style="width:32px; height:32px; background:#10b981; border-radius:8px; display:flex; align-items:center; justify-content:center;">
                                            <i class="fas fa-fire" style="color:#fff; font-size:0.9rem;"></i>
                                        </div>
                                        <span style="font-size:0.7rem; color:#94a3b8; font-weight:900; text-transform:uppercase; letter-spacing:1px;">Top Goleador</span>
                                    </div>
                                    <div style="font-weight:950; color:#1e293b; font-size:1.1rem; margin-bottom:4px;">${topScorer.name}</div>
                                    <div style="font-size:1.8rem; font-weight:950; color:#10b981; font-family:'Outfit';">${topScorer.gf}</div>
                                    <div style="font-size:0.65rem; color:#64748b; font-weight:700;">JUEGOS GANADOS</div>
                                </div>

                                <!-- MEJOR DEFENSA -->
                                <div style="background:white; border-radius:20px; padding:20px; box-shadow:0 8px 20px rgba(0,0,0,0.03); border:1px solid rgba(0,0,0,0.02);">
                                    <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px;">
                                        <div style="width:32px; height:32px; background:#3b82f6; border-radius:8px; display:flex; align-items:center; justify-content:center;">
                                            <i class="fas fa-shield-alt" style="color:#fff; font-size:0.9rem;"></i>
                                        </div>
                                        <span style="font-size:0.7rem; color:#94a3b8; font-weight:900; text-transform:uppercase; letter-spacing:1px;">Mejor Defensa</span>
                                    </div>
                                    <div style="font-weight:950; color:#1e293b; font-size:1.1rem; margin-bottom:4px;">${bestDefense.name}</div>
                                    <div style="font-size:1.8rem; font-weight:950; color:#3b82f6; font-family:'Outfit';">${bestDefense.gc}</div>
                                    <div style="font-size:0.65rem; color:#64748b; font-weight:700;">JUEGOS ENCAJADOS</div>
                                </div>

                                <!-- MÁS ACTIVO -->
                                <div style="background:white; border-radius:20px; padding:20px; box-shadow:0 8px 20px rgba(0,0,0,0.03); border:1px solid rgba(0,0,0,0.02);">
                                    <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px;">
                                        <div style="width:32px; height:32px; background:#f59e0b; border-radius:8px; display:flex; align-items:center; justify-content:center;">
                                            <i class="fas fa-bolt" style="color:#fff; font-size:0.9rem;"></i>
                                        </div>
                                        <span style="font-size:0.7rem; color:#94a3b8; font-weight:900; text-transform:uppercase; letter-spacing:1px;">Más Activo</span>
                                    </div>
                                    <div style="font-weight:950; color:#1e293b; font-size:1.1rem; margin-bottom:4px;">${mostActive.name}</div>
                                    <div style="font-size:1.8rem; font-weight:950; color:#f59e0b; font-family:'Outfit';">${mostActive.pj}</div>
                                    <div style="font-size:0.65rem; color:#64748b; font-weight:700;">PARTIDOS JUGADOS</div>
                                </div>

                                <!-- EFECTIVIDAD -->
                                <div style="background:white; border-radius:20px; padding:20px; box-shadow:0 8px 20px rgba(0,0,0,0.03); border:1px solid rgba(0,0,0,0.02);">
                                    <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px;">
                                        <div style="width:32px; height:32px; background:#8b5cf6; border-radius:8px; display:flex; align-items:center; justify-content:center;">
                                            <i class="fas fa-percentage" style="color:#fff; font-size:0.9rem;"></i>
                                        </div>
                                        <span style="font-size:0.7rem; color:#94a3b8; font-weight:900; text-transform:uppercase; letter-spacing:1px;">Efectividad</span>
                                    </div>
                                    <div style="font-weight:950; color:#1e293b; font-size:1.1rem; margin-bottom:4px;">${winRateChamp.name}</div>
                                    <div style="font-size:1.8rem; font-weight:950; color:#8b5cf6; font-family:'Outfit';">${Math.round((winRateChamp.won / winRateChamp.pj) * 100)}%</div>
                                    <div style="font-size:0.65rem; color:#64748b; font-weight:700;">VICTORIAS</div>
                                </div>
                            `;
                })()}
                    </div>
                </div>
            `;
        }

        _renderStatsContent() {
            const finishedMatches = this.matches.filter(m => m.status === 'finished');
            const data = this.calculateStandings(); // Basic sorted players

            return `
                <div style="padding:0 20px; animation:fadeIn 0.5s ease-out;">
                    <div style="background:white; border-radius:28px; padding:20px; box-shadow:0 15px 35px rgba(0,0,0,0.03); border:1px solid rgba(0,0,0,0.01);">
                        <h3 style="color:#94a3b8; font-size:0.75rem; font-weight:900; text-transform:uppercase; letter-spacing:1px; margin-bottom:15px;">EFICIENCIA INDIVIDUAL</h3>
                        <div style="display:flex; flex-direction:column; gap:10px;">
                            ${data.slice(0, 10).map((p, i) => {
                const winRate = Math.round((p.won / (p.played || 1)) * 100);
                return `
                                <div style="display:flex; align-items:center; gap:15px; padding:15px; background:${i === 0 ? '#CCFF00' : '#f8fafc'}; border-radius:18px; border:1px solid ${i === 0 ? '#CCFF00' : '#f1f5f9'};">
                                    <span style="font-weight:950; color:${i === 0 ? '#000' : '#cbd5e1'}; font-size:0.9rem; width:20px;">${i + 1}</span>
                                    <div style="flex:1;">
                                        <div style="font-weight:800; color:#1e293b; font-size:0.95rem; margin-bottom:4px;">${p.name}</div>
                                        <div style="display:flex; align-items:center; gap:8px;">
                                            <div style="flex:1; height:4px; background:#e2e8f0; border-radius:4px; overflow:hidden;">
                                                <div style="width:${winRate}%; height:100%; background:${winRate > 60 ? '#10b981' : (winRate > 40 ? '#fbbf24' : '#ef4444')};"></div>
                                            </div>
                                            <span style="font-size:0.75rem; color:#64748b; font-weight:800; min-width:35px;">${winRate}%</span>
                                        </div>
                                    </div>
                                    <div style="text-align:right;">
                                        <div style="font-size:0.85rem; font-weight:950; color:#000;">${p.points}</div>
                                        <div style="font-size:0.6rem; color:${i === 0 ? '#000' : '#94a3b8'}; font-weight:800;">TOTAL PTOS</div>
                                    </div>
                                </div>
                                `;
            }).join('')}
                        </div>
                    </div>
                </div>
            `;
        }

        renderMatchCard(m) {
            const isEditing = this.viewState.editingMatchId === m.id;
            const s1 = parseInt(m.score_a || 0);
            const s2 = parseInt(m.score_b || 0);
            const isFinished = m.status === 'finished';

            const formatNameSimple = (fullName) => {
                if (!fullName) return '';
                const parts = fullName.trim().split(/\s+/);
                if (parts.length <= 2) return fullName;
                // Return Name + First Surname
                return `${parts[0]} ${parts[1]}`;
            };

            const formatTeam = (names) => {
                if (!names) return 'Equipo';
                if (Array.isArray(names)) {
                    return names.map(n => formatNameSimple(n)).join(' / ');
                }
                if (typeof names === 'string' && names.includes(' / ')) {
                    return names.split(' / ').map(n => formatNameSimple(n)).join(' / ');
                }
                return formatNameSimple(names);
            };

            const tA = formatTeam(m.team_a_names);
            const tB = formatTeam(m.team_b_names);
            const winA = isFinished && s1 > s2;
            const winB = isFinished && s2 > s1;

            let statusBadge = '';
            if (isFinished) {
                statusBadge = `<div style="font-size:0.6rem; font-weight:900; background:#f3e8ff; color:#7c3aed; padding:4px 10px; border-radius:10px; text-transform:uppercase; border:1px solid #c4b5fd; letter-spacing:0.5px;">FINALIZADO</div>`;
            } else {
                statusBadge = `<div style="font-size:0.6rem; font-weight:900; background:#f0fdf4; color:#15803d; padding:4px 10px; border-radius:10px; text-transform:uppercase; display:flex; align-items:center; gap:6px; border:1px solid #bbf7d0;"><span style="width:5px; height:5px; background:#22c55e; border-radius:50%; animation:pulse 2s infinite;"></span> EN JUEGO</div>`;
            }

            if (!isEditing) {
                // NORMAL CARD (Soft Light)
                return `
                <div style="background:white; border-radius:28px; padding:25px; position:relative; box-shadow:0 15px 40px rgba(0,0,0,0.03); border:1px solid rgba(0,0,0,0.01); display:flex; flex-direction:column; gap:1.2rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #f1f5f9; padding-bottom:12px;">
                        <span style="font-size:0.7rem; color:#000; font-weight:900; letter-spacing:1px; text-transform:uppercase;">PISTA ${m.court}</span>
                        ${statusBadge}
                    </div>
                    
                    <div style="display:flex; flex-direction:column; gap:15px;">
                        <!-- TEAM A -->
                        <div style="display:flex; justify-content:space-between; align-items:center; ${winA ? 'background:#CCFF00; padding:8px 12px; border-radius:12px; margin:-4px;' : ''}">
                             <div style="display:flex; align-items:center; gap:12px; flex:1;">
                                ${winA ? '<div style="color:#000;"><i class="fas fa-trophy"></i></div>' : ''}
                                <span style="color:#1e293b; font-weight:800; font-size:1rem;">${tA.toUpperCase()}</span>
                             </div>
                             <span style="font-size:2.2rem; font-weight:950; color:${winA ? '#000' : '#cbd5e1'}; font-family:'Outfit';">${s1}</span>
                        </div>
                        
                        <!-- TEAM B -->
                        <div style="display:flex; justify-content:space-between; align-items:center; ${winB ? 'background:#CCFF00; padding:8px 12px; border-radius:12px; margin:-4px;' : ''}">
                             <div style="display:flex; align-items:center; gap:12px; flex:1;">
                                ${winB ? '<div style="color:#000;"><i class="fas fa-trophy"></i></div>' : ''}
                                <span style="color:#1e293b; font-weight:800; font-size:1rem;">${tB.toUpperCase()}</span>
                             </div>
                             <span style="font-size:2.2rem; font-weight:950; color:${winB ? '#000' : '#cbd5e1'}; font-family:'Outfit';">${s2}</span>
                        </div>
                    </div>

                    ${(!isFinished && this._isUserAuthorized()) ? `
                        <button onclick="window.EntrenoLiveView.openEditScore('${m.id}')" 
                                style="background:#f8fafc; border:1px solid #CCFF00; color:#1e293b; width:100%; padding:14px; border-radius:14px; font-weight:900; font-size:0.8rem; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; margin-top:5px; transition:all 0.2s; box-shadow:0 5px 15px rgba(204,255,0,0.1);">
                            <i class="fas fa-edit" style="color:#000;"></i> ANOTAR RESULTADO
                        </button>
                    ` : ''}

                    ${(isFinished && this._isUserAuthorized()) ? `
                         <div style="position:absolute; top:18px; right:15px; z-index:10;">
                            <button onclick="window.EntrenoLiveView.unlockMatch('${m.id}')" 
                                style="background:#CCFF00; color:#000; border:none; width:36px; height:36px; border-radius:12px; box-shadow:0 8px 20px rgba(0,0,0,0.1); cursor:pointer; display:flex; align-items:center; justify-content:center;">
                                <i class="fas fa-pen" style="font-size:0.9rem;"></i>
                            </button>
                         </div>
                    ` : ''}
                </div>`;
            } else {
                // INPUT CARD (Soft Light Edit Mode)
                return `
                <div style="background:white; border:2px solid #CCFF00; border-radius:28px; padding:25px; position:relative; box-shadow:0 20px 50px rgba(204,255,0,0.1); display:flex; flex-direction:column; gap:1.5rem;">
                     <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #f1f5f9; padding-bottom:12px;">
                        <span style="font-size:0.7rem; color:#CCFF00; font-weight:900; letter-spacing:1px; background:black; padding:2px 8px; border-radius:6px;">EDITANDO PISTA ${m.court}</span>
                        <button onclick="window.EntrenoLiveView.openEditScore(null)" style="background:none; border:none; color:#94a3b8; font-size:1.2rem; cursor:pointer;"><i class="fas fa-times"></i></button>
                     </div>

                     <div style="display:flex; flex-direction:column; gap:20px;">
                        <!-- Team A Control -->
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span style="font-size:0.95rem; color:#1e293b; font-weight:800; flex:1; line-height:1.2; padding-right:10px;">${tA.toUpperCase()}</span>
                            <div style="display:flex; align-items:center; gap:12px;">
                                <button onclick="window.EntrenoLiveView.adjustScore('${m.id}', 'score_a', -1)" style="width:40px; height:40px; border-radius:12px; border:1px solid #e2e8f0; background:#f8fafc; color:#1e293b; font-weight:900; font-size:1.2rem;">-</button>
                                <span style="min-width:35px; text-align:center; font-size:2rem; font-weight:950; color:#000; font-family:'Outfit';">${s1}</span>
                                <button onclick="window.EntrenoLiveView.adjustScore('${m.id}', 'score_a', 1)" style="width:40px; height:40px; border-radius:12px; border:1px solid #e2e8f0; background:#f8fafc; color:#1e293b; font-weight:900; font-size:1.2rem;">+</button>
                            </div>
                        </div>

                        <!-- Team B Control -->
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span style="font-size:0.95rem; color:#1e293b; font-weight:800; flex:1; line-height:1.2; padding-right:10px;">${tB.toUpperCase()}</span>
                            <div style="display:flex; align-items:center; gap:12px;">
                                <button onclick="window.EntrenoLiveView.adjustScore('${m.id}', 'score_b', -1)" style="width:40px; height:40px; border-radius:12px; border:1px solid #e2e8f0; background:#f8fafc; color:#1e293b; font-weight:900; font-size:1.2rem;">-</button>
                                <span style="min-width:35px; text-align:center; font-size:2rem; font-weight:950; color:#000; font-family:'Outfit';">${s2}</span>
                                <button onclick="window.EntrenoLiveView.adjustScore('${m.id}', 'score_b', 1)" style="width:40px; height:40px; border-radius:12px; border:1px solid #e2e8f0; background:#f8fafc; color:#1e293b; font-weight:900; font-size:1.2rem;">+</button>
                            </div>
                        </div>
                     </div>

                     <button onclick="window.EntrenoLiveView.finishMatch('${m.id}', ${s1}, ${s2})" 
                        style="width:100%; background:#CCFF00; color:black; border:none; padding:18px; border-radius:18px; font-size:1rem; font-weight:950; letter-spacing:1px; transition:all 0.3s; box-shadow:0 10px 25px rgba(204,255,0,0.2); cursor:pointer;">
                        CONFIRMAR RESULTADO
                     </button>
                </div>`;
            }
        }
    }

    // Force init
    window.EntrenoLiveView = new EntrenoLiveView();
    console.log("✅ [EventsController] Embedded EntrenoLiveView upgraded (Tabs+Standings).");

})();
