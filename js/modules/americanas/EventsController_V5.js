/**
 * EventsController_V5.js
 * FORZADO DE VERSIÓN PARA BYPASS DE CACHÉ
 * Contiene la lógica completa original con correcciones críticas.
 */
(function () {
    console.log("🔥 [EventsController_V5] SCRIPT LOADED AND EXECUTING!");

    class EventsController {
        constructor() {
            this.state = {
                activeTab: 'events',
                americanas: null, // Initialized to null for checkLoading
                entrenos: null,
                users: [], // For ranking
                personalMatches: [], // NEW: User's history
                loading: true,
                initialized: false,
                loadingResults: false,
                currentUser: null,
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
        }

        checkLoading() {
            if (this.state.americanas !== null && this.state.entrenos !== null) {
                this.state.loading = false;
                console.log("🎟️ [EventsController_V5] Loading complete. Events:", (this.state.americanas.length + this.state.entrenos.length));
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

            // If switching to results, fetch personal matches
            if (tabName === 'results' && this.state.currentUser) {
                this.state.loadingResults = true;
                this.render();
                try {
                    const matches = await window.FirebaseDB.matches.getByPlayer(this.state.currentUser.uid);
                    this.state.personalMatches = matches;
                } catch (e) {
                    console.error("Error fetching personal matches:", e);
                } finally {
                    this.state.loadingResults = false;
                    this.render();
                }
            } else {
                this.render();
            }
        }

        render() {
            const container = document.getElementById('content-area');
            if (!container) {
                console.error("❌ [EventsController_V5] Content area #content-area NOT FOUND!");
                return;
            }

            // --- 1. SUBMENU NAVIGATION ---
            const tabs = [
                { id: 'events', label: 'DISPONIBLES', icon: 'fa-trophy' },
                { id: 'agenda', label: 'AGENDA', icon: 'fa-circle' },
                { id: 'results', label: 'MIS RESULTADOS', icon: 'fa-poll' },
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
                    case 'events': contentHtml = this.renderEventsList(false); break;
                    case 'agenda': contentHtml = this.renderAgendaView(); break;
                    case 'results': contentHtml = this.renderResultsView(); break;
                    case 'finished': contentHtml = this.renderFinishedView(); break;
                }
            }

            container.innerHTML = `<div class="fade-in">${navHtml}${contentHtml}</div>`;
            console.log("✅ [EventsController_V5] Content rendered successfully");
        }

        renderEventsList(onlyMine) {
            let events = this.getAllSortedEvents();
            const { month, category } = this.state.filters;
            const uid = this.state.currentUser ? this.state.currentUser.uid : null;
            const todayStr = this.getTodayStr();

            if (!onlyMine) {
                events = events.filter(e => e.status !== 'finished' && e.date >= todayStr);
            } else if (onlyMine) {
                if (!uid) return `<div style="text-align:center; padding:40px; color:#888;">Debes iniciar sesión.</div>`;
                events = events.filter(e => {
                    const players = e.players || e.registeredPlayers || [];
                    return players.some(p => p.uid === uid || p.id === uid);
                });
            }

            if (month !== 'all') events = events.filter(e => e.date.startsWith(month));
            if (category !== 'all') events = events.filter(e => e.category === category);

            const eventsHtml = events.map(evt => this.renderCard(evt)).join('');
            const availableEvents = this.getAllSortedEvents().filter(e => e.status !== 'finished' && e.date >= todayStr);
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
                        <div style="background: #000; padding: 6px 14px; border-radius: 14px; border: 1.5px solid #00E36D; color: white; font-weight: 950;"><i class="fas fa-bolt" style="color: #00E36D;"></i> ${events.length}</div>
                    </div>
                    ${filterBarHtml}
                    <div style="padding-bottom: 120px; padding-left:10px; padding-right:10px;">
                        ${eventsHtml.length ? eventsHtml : `<div style="padding:100px 40px; text-align:center; color:#444;"><i class="fas fa-filter" style="font-size: 4rem; opacity: 0.1;"></i><h3 style="color:#666;">SIN RESULTADOS</h3></div>`}
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
                                        
                                        <button onclick="window.ControlTowerView.prepareLoad('${evt.id}'); window.Router.navigate('live');" 
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

        renderResultsView() {
            const matches = this.state.personalMatches || [];
            const user = this.state.currentUser;

            if (this.state.loadingResults) return `<div style="padding:100px; text-align:center;"><div class="loader"></div></div>`;
            if (!user) return `<div style="padding:80px; text-align:center; color:white;"><i class="fas fa-lock" style="font-size:3rem; margin-bottom:15px; opacity:0.2;"></i><p>Inicia sesión para ver resultados.</p></div>`;

            // Calculate Stats & Filter Real Data (Exclude 0-0 unless explicitly finished with points)
            const realMatches = matches.filter(m => {
                const s1 = parseInt(m.score_a || 0);
                const s2 = parseInt(m.score_b || 0);
                return (s1 > 0 || s2 > 0); // Only keep matches with actual points
            });

            let totalWins = 0;
            let totalMatches = realMatches.length;

            realMatches.forEach(m => {
                const s1 = parseInt(m.score_a || 0);
                const s2 = parseInt(m.score_b || 0);
                const isTeamA = m.team_a_ids && m.team_a_ids.includes(user.uid);
                const won = (isTeamA && s1 > s2) || (!isTeamA && s2 > s1);
                if (won) totalWins++;
            });

            const winRate = totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0;
            const userLevel = user.level || user.playtomic_level || 3.5;

            // Motivational Logic
            let quote = "¡Tu camino hacia la cima del pádel empieza aquí!";
            let motivationColor = "#CCFF00";
            if (winRate >= 70) {
                quote = "¡Estás imparable! Tu nivel está subiendo como la espuma. 🔥";
                motivationColor = "#00E36D";
            } else if (winRate >= 40) {
                quote = "Buen progreso. Cada partido te acerca más a tu siguiente nivel.";
                motivationColor = "#CCFF00";
            } else if (totalMatches > 0) {
                quote = "No te rindas. Los grandes jugadores se forjan en las derrotas. ¡A por la siguiente!";
                motivationColor = "#FF2D55";
            }

            return `
                <div style="padding: 25px; background: #f8fafc; min-height: 80vh; font-family: 'Outfit', sans-serif;">
                    
                    <!-- HEADER -->
                    <div style="margin-bottom: 25px;">
                        <span style="background: rgba(0,0,0,0.05); color: #64748b; padding: 5px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">Rendimiento Personal</span>
                        <h2 style="font-size: 2rem; font-weight: 950; color: #0f172a; margin: 10px 0;">Mis <span style="color: #84cc16;">Resultados</span></h2>
                    </div>

                    ${totalMatches === 0 ? `
                        <!-- EMPTY STATE (NO DATA) -->
                        <div style="text-align:center; padding: 80px 30px; background: white; border-radius: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.04); border: 1px solid #e2e8f0;">
                            <div style="width: 80px; height: 80px; background: #f1f5f9; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 25px;">
                                <i class="fas fa-chart-line" style="font-size: 2rem; color: #cbd5e1;"></i>
                            </div>
                            <h3 style="color: #1e293b; font-weight: 900; font-size: 1.3rem; margin-bottom: 10px;">HISTORIAL VACÍO</h3>
                            <p style="color: #64748b; font-size: 0.9rem; line-height: 1.5; margin-bottom: 25px;">Todavía no tienes partidos registrados en Americanas. Tus estadísticas aparecerán aquí en tiempo real cuando completes tu primer evento.</p>
                            <button onclick="window.EventsController.setTab('events')" style="background: #0f172a; color: white; border: none; padding: 14px 28px; border-radius: 16px; font-weight: 800; font-size: 0.85rem; box-shadow: 0 10px 20px rgba(0,0,0,0.1); cursor: pointer;">EXPLORAR PRÓXIMAS AMERICANAS</button>
                        </div>
                    ` : `
                        <!-- MOTIVATION CARD (ONLY IF DATA) -->
                        <div style="background: white; border: 1px solid #e2e8f0; padding: 24px; border-radius: 28px; margin-bottom: 25px; border-left: 6px solid ${motivationColor}; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
                            <p style="margin:0; color: #1e293b; font-size: 1.15rem; font-weight: 800; line-height: 1.4;">${quote}</p>
                            <div style="margin-top: 15px; display: flex; align-items: center; gap: 8px;">
                                <div style="padding: 4px 10px; background: #f1f5f9; border-radius: 8px; font-size: 0.65rem; font-weight: 900; color: #64748b;">
                                    BASADO EN ${totalMatches} PARTIDOS REALES
                                </div>
                            </div>
                        </div>

                        <!-- STATS GRID (ONLY IF DATA) -->
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px;">
                            <div style="background: white; border: 1px solid #e2e8f0; padding: 20px; border-radius: 24px; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.02);">
                                <div style="font-size: 2.2rem; font-weight: 950; color: #1e293b;">${winRate}<span style="font-size: 1rem; color: #94a3b8;">%</span></div>
                                <div style="font-size: 0.7rem; color: #64748b; font-weight: 800; text-transform: uppercase; margin-top: 4px;">Victoria Rate</div>
                            </div>
                            <div style="background: white; border: 1px solid #e2e8f0; padding: 20px; border-radius: 24px; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.02);">
                                <div style="font-size: 2.2rem; font-weight: 950; color: #84cc16;">${parseFloat(userLevel).toFixed(2)}</div>
                                <div style="font-size: 0.7rem; color: #64748b; font-weight: 800; text-transform: uppercase; margin-top: 4px;">Nivel Actual</div>
                            </div>
                        </div>

                        <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
                            <h3 style="color: #1e293b; font-weight: 900; font-size: 1rem; margin: 0; letter-spacing: 0.5px;">CRONOLOGÍA DE PARTIDOS</h3>
                        </div>

                        <div style="padding-bottom: 120px; display: flex; flex-direction: column; gap: 15px;">
                            ${matches.map((m, i) => {
                const s1 = parseInt(m.score_a || 0);
                const s2 = parseInt(m.score_b || 0);
                const isTeamA = m.team_a_ids && m.team_a_ids.includes(user.uid);
                const won = (isTeamA && s1 > s2) || (!isTeamA && s2 > s1);
                const resultColor = won ? '#22c55e' : '#ef4444';
                const bgBadge = won ? '#f0fdf4' : '#fef2f2';

                return `
                                    <div style="background: white; border: 1px solid #e2e8f0; border-radius: 24px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.02); position: relative;">
                                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;">
                                            <div style="display: flex; align-items: center; gap: 10px;">
                                                <div style="background: #f8fafc; padding: 6px 12px; border-radius: 10px; color: #64748b; font-size: 0.7rem; font-weight: 800; border: 1px solid #f1f5f9;">PISTA ${m.court || '?'}</div>
                                                <div style="color: #94a3b8; font-size: 0.7rem; font-weight: 700;">${m.timestamp ? new Date(m.timestamp).toLocaleDateString() : 'Finalizado'}</div>
                                            </div>
                                            <div style="background: ${bgBadge}; color: ${resultColor}; padding: 4px 12px; border-radius: 12px; font-size: 0.75rem; font-weight: 900; letter-spacing: 1px;">
                                                ${won ? 'VICTORIA' : 'DERROTA'}
                                            </div>
                                        </div>

                                        <div style="display: flex; align-items: center; justify-content: space-between; gap: 15px; padding: 10px 0;">
                                            <div style="flex: 1; text-align: center;">
                                                <div style="font-size: 0.85rem; font-weight: 800; color: ${isTeamA ? '#0f172a' : '#94a3b8'}; line-height: 1.3;">
                                                    ${Array.isArray(m.team_a_names) ? m.team_a_names.join('<br>') : 'Equipo A'}
                                                </div>
                                            </div>
                                            
                                            <div style="display: flex; align-items: center; gap: 12px; background: #f8fafc; padding: 10px 20px; border-radius: 16px; border: 1px solid #f1f5f9;">
                                                <span style="font-size: 1.6rem; font-weight: 950; color: ${isTeamA ? '#0f172a' : '#cbd5e1'};">${s1}</span>
                                                <span style="color: #e2e8f0; font-weight: 900;">:</span>
                                                <span style="font-size: 1.6rem; font-weight: 950; color: ${!isTeamA ? '#0f172a' : '#cbd5e1'};">${s2}</span>
                                            </div>

                                            <div style="flex: 1; text-align: center;">
                                                <div style="font-size: 0.85rem; font-weight: 800; color: ${!isTeamA ? '#0f172a' : '#94a3b8'}; line-height: 1.3;">
                                                    ${Array.isArray(m.team_b_names) ? m.team_b_names.join('<br>') : 'Equipo B'}
                                                </div>
                                            </div>
                                        </div>

                                        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #f1f5f9; display: flex; justify-content: center;">
                                            <button onclick="window.ControlTowerView.prepareLoad('${m.americana_id}'); window.Router.navigate('live'); event.stopPropagation();" 
                                                    style="background: none; border: none; color: #64748b; font-size: 0.75rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                                                Ver americana <i class="fas fa-chevron-right" style="font-size: 0.6rem;"></i>
                                            </button>
                                        </div>
                                    </div>
                                `;
            }).reverse().join('')}
                        </div>
                    `}
                </div>
            `;
        }

        renderCard(evt, isLight = false) {
            const players = evt.players || evt.registeredPlayers || [];
            const playerCount = players.length;
            const maxPlayers = (evt.max_courts || 0) * 4;

            const d = new Date(evt.date);
            const dayName = d.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase().replace('.', '');
            const dayNum = d.getDate();

            const user = this.state.currentUser;
            const uid = user ? user.uid : '-';
            const isJoined = players.some(p => p.uid === uid || p.id === uid);
            const isFull = playerCount >= maxPlayers;

            const todayStr = this.getTodayStr();
            const isPast = evt.date < todayStr;
            const isFinished = evt.status === 'finished' || (isPast && evt.status !== 'live');
            const isLive = evt.status === 'live';

            // --- 1. ACTION BUTTON STATE ---
            let btnContent = '<i class="fas fa-plus" style="font-size: 1.4rem;"></i>';
            let btnStyle = 'background: #CCFF00; color: #000; box-shadow: 0 0 20px rgba(204, 255, 0, 0.6); animation: pulse-neon-btn 2s infinite;';
            let btnAction = `event.stopPropagation(); window.EventsController.joinEvent('${evt.id}', '${evt.type || 'americana'}')`;
            let btnDisabled = false;

            if (isFinished) {
                btnContent = '<div style="display:flex; flex-direction:column; align-items:center; line-height:1; gap:2px;"><i class="fas fa-poll" style="font-size: 1rem;"></i><span style="font-size:0.45rem; font-weight:950; text-align:center;">VER<br>RESULTADOS</span></div>';
                btnStyle = 'background: #CCFF00; color: #000; box-shadow: 0 4px 15px rgba(204, 255, 0, 0.4); width: 55px; height: 55px;';
                btnAction = `event.stopPropagation(); window.ControlTowerView.prepareLoad('${evt.id}'); window.Router.navigate('live');`;
            } else if (isLive) {
                btnContent = '<span style="font-size:0.45rem; font-weight:950; text-align:center; line-height:1.1;">EN<br>JUEGO</span>';
                btnStyle = 'background: #0ea5e9; color: white; animation: pulse 2s infinite; padding: 0; width: 55px; height: 55px; box-shadow: 0 4px 15px rgba(14, 165, 233, 0.4);';
                btnAction = `event.stopPropagation(); window.ControlTowerView.prepareLoad('${evt.id}'); window.Router.navigate('live');`;
            } else if (isJoined) {
                btnContent = '<i class="fas fa-check"></i>';
                btnStyle = 'background: white; color: #84cc16; border: 2px solid #84cc16; box-shadow: 0 4px 15px rgba(132, 204, 22, 0.3);';
                btnAction = `event.stopPropagation(); window.EventsController.leaveEvent('${evt.id}', '${evt.type || 'americana'}')`;
                btnDisabled = false;
            } else if (isFull) {
                btnContent = '<span style="font-size:0.55rem; font-weight:950;">LLENO</span>';
                btnStyle = 'background: #ef4444; color: white; box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4); animation: none;';
                btnDisabled = true;
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
                </style>
                <div class="card-hybrid-c" onclick="window.ControlTowerView.prepareLoad('${evt.id}'); window.Router.navigate('live');" 
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
                    <div style="position: absolute; top: 125px; right: 20px; z-index: 20;">
                        <button onclick="${btnAction}" ${btnDisabled ? 'disabled' : ''}
                                style="width: 55px; height: 55px; border-radius: 50%; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; ${btnStyle}">
                            ${btnContent}
                        </button>
                    </div>

                    <!-- CONTENT Area -->
                    <div style="padding: 24px 20px; background: ${isLight ? 'white' : '#0a0a0a'}; border-top: 1px solid ${isLight ? '#f1f5f9' : '#1a1a1a'};">
                        <h3 style="color: ${isLight ? '#0f172a' : 'white'}; font-size: 1.3rem; font-weight: 950; margin: 0 0 20px 0; line-height: 1.2; padding-right: 60px; letter-spacing: -0.5px;">${evt.name}</h3>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; font-size: 0.75rem; font-weight: 850;">
                            <div style="display: flex; align-items: center; gap: 8px; color: ${isLight ? '#64748b' : '#aaa'};">
                                <i class="far fa-clock" style="color: #CCFF00; font-size: 0.9rem;"></i> ${evt.time || '00:00'} h
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
                    </div>
                </div>
            `;
        }

        openPlayerListModal(eventId) {
            console.log("🎟️ [EventsController_V5] Opening player list for:", eventId);

            // Find the event in our state to get the players
            const allEvents = this.getAllSortedEvents();
            const evt = allEvents.find(e => e.id === eventId);

            if (!evt) {
                console.error("Event not found for list modal:", eventId);
                return;
            }

            const players = evt.players || evt.registeredPlayers || [];

            const modalId = 'player-list-modal';
            const existingModal = document.getElementById(modalId);
            if (existingModal) existingModal.remove();

            const modal = document.createElement('div');
            modal.id = modalId;
            modal.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: radial-gradient(circle at center, #001a4d 0%, #000 100%);
                z-index: 20000; display: flex; flex-direction: column;
                animation: fadeInModal 0.5s cubic-bezier(0.16, 1, 0.3, 1);
                font-family: 'Inter', 'Outfit', sans-serif;
                color: white;
                overflow: hidden;
            `;

            const content = `
                <!-- BACKGROUND FX -->
                <div style="position: absolute; inset: 0; pointer-events: none; z-index: 1;">
                    <div style="position: absolute; inset: 0; background: radial-gradient(circle at 50% -20%, rgba(30, 64, 175, 0.4) 0%, transparent 70%);"></div>
                    <div style="position: absolute; inset: 0; background: linear-gradient(rgba(255, 255, 255, 0.03) 50%, transparent 50%); background-size: 100% 4px;"></div>
                </div>

                <!-- FOX HEADER -->
                <div style="
                    position: relative; z-index: 10;
                    background: linear-gradient(90deg, #1e40af 0%, #001a4d 60%, #000 100%);
                    padding: 45px 30px 35px;
                    border-bottom: 5px solid #00E36D;
                    box-shadow: 0 15px 50px rgba(0,0,0,0.6);
                    display: flex; align-items: flex-end; justify-content: space-between;
                ">
                    <div>
                        <div style="background: white; color: #1e40af; display: inline-block; padding: 4px 15px; font-weight: 900; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 2.5px; transform: skew(-15deg); margin-bottom: 18px;">SOMOSPADEL LIVE</div>
                        <h2 style="margin: 0; font-size: 2.2rem; font-weight: 950; text-transform: uppercase; line-height: 0.9; color: white;">PARTICIPANTES <br> <span style="color: #00E36D;">CONFIRMADOS</span></h2>
                    </div>
                    <div style="text-align: right; border-left: 2px solid rgba(255,255,255,0.15); padding-left: 25px;">
                        <div style="font-size: 0.9rem; color: rgba(255,255,255,0.7); text-transform: uppercase;">TOTAL</div>
                        <div style="font-size: 4rem; font-weight: 950; line-height: 0.8; margin-top: 5px; color: white;">${players.length}</div>
                    </div>
                </div>

                <!-- PLAYER GRID -->
                <div style="position: relative; z-index: 5; flex: 1; overflow-y: auto; padding: 30px 20px; display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 15px;">
                    ${players.length === 0 ? '<div style="grid-column:1/-1; text-align:center; padding:100px; opacity:0.5;">Cargando...</div>' : players.map((p, i) => {
                const lvl = parseFloat(p.level || p.playtomic_level || 3.5);
                const lvlColor = lvl >= 4.5 ? '#FF2D55' : (lvl >= 4 ? '#FFCC00' : '#00E36D');
                return `
                        <div style="background: rgba(255,255,255,0.05); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); border-top: 4px solid ${lvlColor}; border-radius: 12px; padding: 20px 10px; text-align: center; animation: enterCard 0.5s ease-out forwards; opacity:0; animation-delay:${i * 0.05}s;">
                            <div style="position: absolute; top: 10px; right: 8px; background: ${lvlColor}; color: #000; font-size: 0.7rem; font-weight: 950; padding: 2px 6px; border-radius: 4px;">${lvl.toFixed(2)}</div>
                            <div style="width: 60px; height: 60px; margin: 0 auto 15px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 2px solid rgba(255,255,255,0.1);">
                                <i class="fas fa-user-ninja" style="font-size: 2rem; color: #1e40af;"></i>
                            </div>
                            <div style="font-size: 0.85rem; font-weight: 950; color: white; text-transform: uppercase;">${p.name ? p.name.split(' ')[0] : 'JUGADOR'}</div>
                            <div style="font-size: 0.6rem; color: #888; margin-top: 4px;">VERIFICADO</div>
                        </div>`;
            }).join('')}
                </div>

                <!-- TICKER -->
                <div style="background: #000; height: 40px; border-top: 2px solid #CCFF00; display: flex; align-items: center; position: relative; z-index: 10;">
                    <div style="background: #CCFF00; color: black; font-weight: 950; font-size: 0.7rem; padding: 0 15px; height: 100%; display: flex; align-items: center; z-index: 20;">TICKER EN VIVO</div>
                    <div style="flex: 1; overflow: hidden; white-space: nowrap;">
                        <div style="display: inline-block; animation: newsTicker 30s linear infinite; color: white; font-weight: 800; font-size: 0.8rem; padding-left: 100%;">
                            • NIVEL MEDIO: ${(players.reduce((a, b) => a + (parseFloat(b.level) || 3.5), 0) / (players.length || 1)).toFixed(2)} 
                            ${players.map(p => `• ${p.name ? p.name.toUpperCase() : 'JUGADOR'} (LVL: ${(parseFloat(p.level || p.playtomic_level || 3.5)).toFixed(2)})`).join(' ')}
                        </div>
                    </div>
                </div>

                <!-- EXIT BUTTON -->
                <div style="background: #000; padding: 20px; text-align: center; border-top: 1px solid #222; position: relative; z-index: 10;">
                    <button onclick="document.getElementById('${modalId}').remove()" style="background: #00E36D; color: black; border: none; padding: 15px 80px; border-radius: 12px; font-weight: 950; text-transform: uppercase; cursor: pointer; box-shadow: 0 0 20px rgba(0,227,109,0.4);">SALIR</button>
                </div>

                <style>
                    @keyframes fadeInModal { from { opacity: 0; transform: scale(1.02); } to { opacity: 1; transform: scale(1); } }
                    @keyframes enterCard { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                    @keyframes newsTicker { from { transform: translateX(0); } to { transform: translateX(-100%); } }
                </style>
            `;

            modal.innerHTML = content;
            document.body.appendChild(modal);
        }

        async joinEvent(id, type = 'americana') {
            if (!this.state.currentUser) { alert("Acceso denegado. Inicia sesión."); return; }
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
            const confirm = window.confirm("¿Deseas darte de baja de este evento?");
            if (!confirm) return;
            try {
                const res = await window.AmericanaService.removePlayer(id, this.state.currentUser.uid, type);
                if (res.success) alert("Te has dado de baja correctamente.");
                else alert("Error: " + res.error);
            } catch (err) { alert("Error fatal: " + err.message); }
        }
    }

    window.EventsController = new EventsController();
    console.log("🚀 [EventsController_V5] Global instance ready!");
})();
