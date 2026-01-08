/**
 * EventsController.js
 * Enhanced Real-time Events Management with Submenu
 */
(function () {
    class EventsController {
        constructor() {
            this.state = {
                activeTab: 'events',
                events: [],
                users: [], // For ranking
                personalMatches: [], // NEW: User's history
                loading: true,
                loadingResults: false,
                currentUser: null
            };
            this.unsubscribeEvents = null;
            this.unsubscribeUsers = null;
        }

        getTodayStr() {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }

        init() {
            // grab user from global store (auth)
            this.state.currentUser = window.Store ? window.Store.getState('currentUser') : null;

            // 1. Real-time Americanas Listener
            if (this.unsubscribeEvents) this.unsubscribeEvents();
            this.unsubscribeEvents = window.db.collection('americanas')
                .orderBy('date', 'desc') // Newest first
                .onSnapshot(snapshot => {
                    this.state.events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    this.state.loading = false;
                    this.render();
                }, err => console.error("Error fetching events:", err));

            // 2. Real-time Users Listener (For Ranking)
            if (this.unsubscribeUsers) this.unsubscribeUsers();
            this.unsubscribeUsers = window.db.collection('players')
                .limit(50)
                .onSnapshot(snapshot => {
                    this.state.users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    // Only re-render if we are on the ranking tab to avoid flicker
                    if (this.state.activeTab === 'ranking') this.render();
                });

            this.render();
        }

        async setTab(tabName) {
            this.state.activeTab = tabName;

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
            if (!container) return;

            // --- 1. SUBMENU NAVIGATION ---
            const tabs = [
                { id: 'events', label: 'DISPONIBLES', icon: 'fa-trophy' },
                { id: 'agenda', label: 'MI AGENDA', icon: 'fa-calendar-check' },
                { id: 'results', label: 'RESULTADOS', icon: 'fa-poll' },
                { id: 'finished', label: 'FINALIZADAS', icon: 'fa-flag-checkered' }
            ];

            const navHtml = `
                <div class="events-submenu-container" style="background: rgba(10,10,10,0.95); backdrop-filter: blur(15px); padding: 12px 0; border-bottom: 2px solid var(--playtomic-neon); margin-bottom: 0px; display: flex; justify-content: space-around; position: sticky; top: 0; z-index: 1001; box-shadow: 0 4px 20px rgba(0,0,0,0.4);">
                    ${tabs.map(tab => {
                const isActive = this.state.activeTab === tab.id;
                return `
                        <button onclick="window.EventsController.setTab('${tab.id}')" 
                                style="
                                    background: transparent; 
                                    border: none; 
                                    display: flex;
                                    flex-direction: column;
                                    align-items: center;
                                    gap: 6px;
                                    color: ${isActive ? 'white' : 'rgba(255,255,255,0.4)'}; 
                                    font-weight: 900; 
                                    padding: 8px 4px;
                                    font-size: 0.55rem;
                                    cursor: pointer;
                                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                                    flex: 1;
                                    letter-spacing: 0.5px;
                                    transform: ${isActive ? 'scale(1.05)' : 'scale(1)'};
                                ">
                            <div style="
                                width: 32px; height: 32px; 
                                display: flex; align-items: center; justify-content: center; 
                                border-radius: 10px; 
                                background: ${isActive ? 'rgba(204,255,0,0.1)' : 'transparent'};
                                margin-bottom: 2px;
                                transition: all 0.3s;
                            ">
                                <i class="fas ${tab.icon}" style="font-size: 1.1rem; color: ${isActive ? 'var(--playtomic-neon)' : 'inherit'};"></i>
                            </div>
                            ${tab.label}
                            ${isActive ? `<div style="width: 15px; height: 3px; background: var(--playtomic-neon); border-radius: 10px; margin-top: 2px;"></div>` : ''}
                        </button>
                    `}).join('')}
                </div>
            `;

            // --- 2. CONTENT AREA ---
            let contentHtml = '';

            if (this.state.loading) {
                contentHtml = '<div style="padding:40px; text-align:center;"><div class="loader"></div></div>';
            } else {
                switch (this.state.activeTab) {
                    case 'events':
                        contentHtml = this.renderEventsList(false);
                        break;
                    case 'agenda':
                        contentHtml = this.renderAgendaView();
                        break;
                    case 'results':
                        contentHtml = this.renderResultsView(); // Personal results
                        break;
                    case 'finished':
                        contentHtml = this.renderFinishedView(); // Global past tournaments
                        break;
                }
            }

            container.innerHTML = `<div class="fade-in">${navHtml}${contentHtml}</div>`;
        }

        // --- VIEW RENDERERS ---

        renderEventsList(onlyMine) {
            let events = this.state.events;
            const uid = this.state.currentUser ? this.state.currentUser.uid : null;
            const todayStr = this.getTodayStr();

            // DISPONIBLES Filter: Not finished AND not past
            if (!onlyMine) {
                events = events.filter(e => e.status !== 'finished' && e.date >= todayStr);
            } else if (onlyMine) {
                if (!uid) return `<div style="text-align:center; padding:40px; color:#888;">Debes iniciar sesión.</div>`;
                events = events.filter(e => {
                    const players = e.players || e.registeredPlayers || [];
                    return players.some(p => p.uid === uid || p.id === uid);
                });
            }

            const eventsHtml = events.map(evt => this.renderCard(evt)).join('');

            return `
                <div style="min-height: 80vh; padding-top: 15px;">
                    <div style="
                        padding: 20px; 
                        display: flex; 
                        justify-content: space-between; 
                        align-items: center; 
                        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); 
                        border-radius: 20px; 
                        margin: 0 10px 20px 10px;
                        box-shadow: 0 10px 25px rgba(0,0,0,0.3);
                        border: 1px solid rgba(255,255,255,0.05);
                    ">
                        <div>
                            <div style="color: var(--playtomic-neon); font-size: 0.65rem; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 5px;">PRÓXIMOS EVENTOS</div>
                            <h2 style="font-size: 1.1rem; font-weight: 800; margin: 0; color: white; line-height: 1.2;">
                                Apúntate en tiempo real en <span style="color: var(--playtomic-neon);">Somospádel BCN</span>
                            </h2>
                        </div>
                        <div style="text-align: right; min-width: 80px;">
                            <span style="
                                display: inline-flex;
                                align-items: center;
                                gap: 6px;
                                font-size: 0.7rem; 
                                color: black; 
                                background: var(--playtomic-neon); 
                                padding: 6px 14px; 
                                border-radius: 20px; 
                                font-weight: 950; 
                                letter-spacing: 0.5px;
                                box-shadow: 0 0 15px rgba(0,227,109,0.4);
                            ">
                                <i class="fas fa-bolt"></i> ${events.length}
                            </span>
                        </div>
                    </div>
                    <div style="padding-bottom: 120px; padding-left:10px; padding-right:10px;">
                        ${eventsHtml.length ? eventsHtml : `
                            <div style="padding:100px 40px; text-align:center; color:#444;">
                                <i class="fas fa-calendar-times" style="font-size: 4rem; margin-bottom: 20px; opacity: 0.1;"></i>
                                <h3 style="color: #666; font-weight: 800;">SIN EVENTOS DISPONIBLES</h3>
                                <p style="font-size: 0.85rem; color: #888;">No hay americanas abiertas en este momento.</p>
                            </div>
                        `}
                    </div>
                </div>
            `;
        }

        renderAgendaView() {
            const uid = this.state.currentUser ? this.state.currentUser.uid : null;
            if (!uid) return `<div style="text-align:center; padding:80px 20px; color:#888;"><i class="fas fa-lock" style="font-size:4rem; margin-bottom:20px; opacity:0.05;"></i><br><h3 style="color:#666;">ACCESO RESTRINGIDO</h3><p style="font-size:0.85rem;">Inicia sesión para ver tu agenda profesional.</p></div>`;

            const todayStr = this.getTodayStr();

            // Filter events where user is participant and NOT finished AND not past
            const myEvents = this.state.events.filter(e => {
                if (e.status === 'finished') return false;
                if (e.date < todayStr && e.status !== 'live') return false;
                const players = e.players || e.registeredPlayers || [];
                return players.some(p => p.uid === uid || p.id === uid);
            });

            if (myEvents.length === 0) {
                return `
                    <div style="text-align:center; padding:100px 40px; color:#999;">
                        <div style="width:80px; height:80px; background:#1a1a1a; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 20px; border:1px solid #333;">
                            <i class="far fa-calendar-alt" style="font-size:2.5rem; color:#444;"></i>
                        </div>
                        <h3 style="color:#fff; font-weight:800;">AGUARDA TU MOMENTO</h3>
                        <p style="font-size:0.85rem; color:#666; max-width:200px; margin:10px auto;">No tienes torneos próximos en los que estés inscrit@.</p>
                        <button onclick="window.EventsController.setTab('events')" style="margin-top:25px; background:var(--playtomic-neon); color:black; border:none; padding:12px 25px; border-radius:30px; font-weight:900; font-size:0.8rem; cursor:pointer; box-shadow:0 10px 20px rgba(0,227,109,0.2);">EXPLORAR TORNEOS</button>
                    </div>
                `;
            }

            return `
                <div style="padding: 20px; background: #0a0a0a; min-height: 80vh;">
                    <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 30px; background: #111; padding: 15px; border-radius: 16px; border: 1px solid #222;">
                        <div style="width: 50px; height: 50px; background: var(--playtomic-neon); border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; color: black; box-shadow:0 0 15px rgba(0,227,109,0.3);"><i class="fas fa-calendar-check"></i></div>
                        <div>
                            <h2 style="font-size: 1.2rem; font-weight: 800; margin: 0; color:white;">Mi Agenda Pro</h2>
                            <p style="font-size: 0.7rem; color: #666; margin: 0; text-transform:uppercase; letter-spacing:1px; font-weight:700;">${myEvents.length} TORNEOS CONFIRMADOS</p>
                        </div>
                    </div>

                    ${myEvents.map(evt => {
                const isLive = evt.status === 'live';
                const statusColor = isLive ? 'var(--playtomic-neon)' : '#007AFF';
                return `
                            <div style="background: #111; border: 1px solid #222; border-radius: 20px; margin-bottom: 20px; overflow: hidden; position: relative;">
                                ${isLive ? `<div style="position:absolute; top:0; right:0; background:var(--playtomic-neon); color:black; font-size:0.6rem; font-weight:950; padding:4px 12px; border-bottom-left-radius:12px; animation:pulse-bg 2s infinite;">LIVE</div>` : ''}
                                <div style="padding: 20px;">
                                    <div style="display: flex; gap: 15px;">
                                        <div style="text-align: center; background: #1a1a1a; padding: 10px; border-radius: 12px; min-width: 60px; height: fit-content; border: 1px solid #333;">
                                            <div style="font-size: 0.6rem; color: #888; font-weight: 900; text-transform: uppercase;">${new Date(evt.date).toLocaleDateString('es-ES', { month: 'short' }).replace('.', '').toUpperCase()}</div>
                                            <div style="font-size: 1.5rem; font-weight: 900; color: white; line-height: 1;">${new Date(evt.date).getDate()}</div>
                                        </div>
                                        <div>
                                            <h3 style="margin: 0; font-size: 1.1rem; color: #fff; font-weight: 800;">${evt.name}</h3>
                                            <div style="display: flex; align-items: center; gap: 10px; margin-top: 8px;">
                                                <span style="font-size: 0.75rem; color: #aaa;"><i class="far fa-clock" style="color: var(--playtomic-neon); margin-right: 4px;"></i> ${evt.time}</span>
                                                <span style="font-size: 0.75rem; color: #aaa;"><i class="fas fa-map-marker-alt" style="color: #ff4d4d; margin-right: 4px;"></i> Somospadel</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div style="margin-top: 20px; background: rgba(255,255,255,0.03); border-radius: 12px; padding: 12px; display: flex; justify-content: space-between; align-items: center; border: 1px solid rgba(255,255,255,0.05);">
                                        <div style="display: flex; align-items: center; gap: 10px;">
                                            <div style="width: 28px; height: 28px; background: #222; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; color: #00E36D;"><i class="fas fa-check"></i></div>
                                            <span style="font-size: 0.75rem; color: #888; font-weight: 600;">Plaza Reservada</span>
                                        </div>
                                        <button onclick="window.ControlTowerView.load('${evt.id}'); Router.navigate('live');" 
                                                style="background: #222; color: #fff; border: 1px solid #333; padding: 8px 18px; border-radius: 10px; font-size: 0.75rem; font-weight: 800; cursor: pointer; transition: all 0.2s;"
                                                onmouseover="this.style.background='#333'; this.style.borderColor='var(--playtomic-neon)';"
                                                onmouseout="this.style.background='#222'; this.style.borderColor='#333';">
                                            VER DETALLES
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `;
            }).join('')}
                    <div style="padding-bottom: 100px;"></div>
                </div>
                <style>
                    @keyframes pulse-bg { 0% { opacity: 0.8; } 50% { opacity: 1; } 100% { opacity: 0.8; } }
                </style>
            `;
        }

        renderFinishedView() {
            const todayStr = this.getTodayStr();
            // Show all finished americanas OR past americanas
            const finishedEvents = this.state.events.filter(e => e.status === 'finished' || e.date < todayStr);

            if (finishedEvents.length === 0) {
                return `
                    <div style="text-align:center; padding:100px 40px; color:#666;">
                        <i class="fas fa-history" style="font-size: 4rem; margin-bottom: 20px; opacity: 0.1;"></i>
                        <h3 style="color:#fff;">HISTORIAL VACÍO</h3>
                        <p style="font-size:0.85rem;">No hay torneos finalizados registrados.</p>
                    </div>
                `;
            }

            return `
                <div style="padding: 20px; background: #0a0a0a; min-height: 80vh;">
                    <div style="margin-bottom: 25px;">
                        <h2 style="font-size: 1.5rem; font-weight: 950; margin: 0; color: white; letter-spacing:-1px;">HISTORIAL <span style="color:var(--playtomic-neon);">DE AMERICANAS</span></h2>
                        <p style="font-size: 0.75rem; color: #666; margin: 5px 0 0 0;">RESULTADOS DE AMERICANAS FINALIZADAS</p>
                    </div>
                    
                    <div style="display: grid; gap: 15px; padding-bottom: 120px;">
                        ${finishedEvents.map(evt => this.renderCard(evt)).join('')}
                    </div>
                </div>
            `;
        }

        renderResultsView() {
            const matches = this.state.personalMatches || [];
            if (this.state.loadingResults) {
                return `<div style="padding:100px; text-align:center;"><div class="loader"></div><p style="color:#666; font-size:0.8rem; margin-top:15px;">CARGANDO TU HISTORIAL...</p></div>`;
            }

            if (!this.state.currentUser) {
                return `<div style="padding:100px 40px; text-align:center;"><i class="fas fa-lock" style="font-size:3rem; margin-bottom:20px; color:#444;"></i><h3 style="color:#fff;">ACCESO PRIVADO</h3><p style="color:#666; font-size:0.85rem;">Inicia sesión para ver tus resultados personales.</p></div>`;
            }

            if (matches.length === 0) {
                return `
                    <div style="padding:100px 40px; text-align:center; color:#666;">
                        <div style="font-size: 4rem; margin-bottom: 20px; opacity:0.1;">🎾</div>
                        <h3 style="color:#fff;">SIN PARTIDOS REGISTRADOS</h3>
                        <p style="font-size:0.85rem;">Tus resultados aparecerán aquí una vez finalices tu primera americana.</p>
                        <button onclick="window.EventsController.setTab('events')" style="margin-top:20px; background:#222; color:white; border:1px solid #333; padding:10px 20px; border-radius:10px; font-weight:700;">IR A JUGAR</button>
                    </div>
                `;
            }

            return `
                <div style="padding: 20px; background: #0a0a0a; min-height: 80vh;">
                    <div style="margin-bottom: 30px;">
                        <h2 style="font-size: 1.5rem; font-weight: 950; margin: 0; color: white;">MIS <span style="color:var(--playtomic-neon);">RESULTADOS</span></h2>
                        <p style="font-size: 0.75rem; color: #666; margin: 5px 0 0 0;">TU RENDIMIENTO EN PISTA</p>
                    </div>

                    <div style="padding-bottom: 120px;">
                        ${matches.map(m => {
                const s1 = parseInt(m.score_a || 0);
                const s2 = parseInt(m.score_b || 0);
                const isTeamA = m.team_a_ids && m.team_a_ids.includes(this.state.currentUser.uid);
                const won = (isTeamA && s1 > s2) || (!isTeamA && s2 > s1);
                const draw = s1 === s2;

                return `
                                <div style="background: #111; border: 1px solid #222; border-radius: 16px; margin-bottom: 12px; overflow: hidden; border-left: 4px solid ${draw ? '#888' : (won ? 'var(--playtomic-neon)' : '#ff4d4d')};">
                                    <div style="padding: 12px 15px; display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02); border-bottom: 1px solid #222;">
                                        <span style="font-size: 0.65rem; color: #666; font-weight: 800; letter-spacing: 1px;">ROUND ${m.round || '?'} • PISTA ${m.court || '?'}</span>
                                        <span style="font-size: 0.6rem; color: ${won ? 'var(--playtomic-neon)' : (draw ? '#888' : '#ff4d4d')}; font-weight: 900; text-transform: uppercase;">${draw ? 'EMPATE' : (won ? 'VICTORIA' : 'DERROTA')}</span>
                                    </div>
                                    <div style="padding: 15px; display: flex; align-items: center; justify-content: space-between;">
                                        <div style="flex: 1; text-align: left; opacity: ${isTeamA ? 1 : 0.6}">
                                            <div style="font-size: 0.8rem; font-weight: 700; color: ${isTeamA && won ? 'var(--playtomic-neon)' : 'white'};">${m.team_a_names ? m.team_a_names.join(' / ') : 'Pareja A'}</div>
                                        </div>
                                        <div style="margin: 0 15px; background: #1a1a1a; padding: 6px 12px; border-radius: 8px; font-family: monospace; font-size: 1.1rem; font-weight: 900; color: white; display: flex; align-items: center; gap: 8px; border: 1px solid #333;">
                                            <span style="color: ${isTeamA && won ? 'var(--playtomic-neon)' : 'white'}">${s1}</span>
                                            <span style="color: #444;">-</span>
                                            <span style="color: ${!isTeamA && won ? 'var(--playtomic-neon)' : 'white'}">${s2}</span>
                                        </div>
                                        <div style="flex: 1; text-align: right; opacity: ${!isTeamA ? 1 : 0.6}">
                                            <div style="font-size: 0.8rem; font-weight: 700; color: ${!isTeamA && won ? 'var(--playtomic-neon)' : 'white'};">${m.team_b_names ? m.team_b_names.join(' / ') : 'Pareja B'}</div>
                                        </div>
                                    </div>
                                    <div style="padding: 8px 15px; background: #0f0f0f; display: flex; justify-content: space-between; align-items: center;">
                                         <span style="font-size: 0.65rem; color: #444;"><i class="fas fa-calendar-alt"></i> ${m.created_at ? new Date(m.created_at.seconds * 1000).toLocaleDateString() : '--/--/--'}</span>
                                         <span style="font-size: 0.65rem; color: #444; font-weight: 700; cursor: pointer;" onclick="ControlTowerView.load('${m.americana_id}'); Router.navigate('live');">VER AMERICANA <i class="fas fa-chevron-right" style="font-size:0.5rem;"></i></span>
                                    </div>
                                </div>
                            `;
            }).join('')}
                    </div>
                </div>
            `;
        }

        renderPlayerStatsView() {
            // Replaces old 'standings' view
            return `
                <div style="padding: 2rem; text-align: center;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📈</div>
                    <h3 style="color: white; margin-bottom: 0.5rem;">Mis Estadísticas</h3>
                    <p style="color: #666; font-size: 0.9rem;">Tu rendimiento detallado, victorias y evolución de nivel.</p>
                </div>
            `;
        }

        // --- CARD RENDERER (OPTION C: THE HYBRID - REFINED) ---
        renderCard(evt) {
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

            // --- 1. ACTION BUTTON STATE (FAB STYLE) ---
            let btnContent = '<i class="fas fa-plus"></i>';
            let btnStyle = 'background: #00E36D; color: #000; box-shadow: 0 4px 15px rgba(0, 227, 109, 0.5);';
            let btnAction = `event.stopPropagation(); EventsController.joinEvent('${evt.id}')`;
            let btnDisabled = false;

            if (isFinished) {
                // Initial setup, will be refined below
                btnContent = '<i class="fas fa-trophy"></i>';
                btnStyle = 'background: #333; color: #fff; border: 2px solid #555;';
                btnAction = `window.ControlTowerView.prepareLoad('${evt.id}'); Router.navigate('live');`;
            } else if (isLive) {
                btnContent = '<span style="font-size:0.6rem; font-weight:800;">LIVE</span>';
                btnStyle = 'background: #FF2D55; color: white; animation: pulse 2s infinite; padding: 0;';
                btnAction = `window.ControlTowerView.load('${evt.id}'); Router.navigate('live');`;
            } else if (isJoined) {
                btnContent = '<i class="fas fa-check"></i>';
                btnStyle = 'background: #000; color: #00E36D; border: 2px solid #00E36D;';
                btnDisabled = true;
            } else if (isFull) {
                btnContent = '<i class="fas fa-hourglass-half"></i>';
                btnStyle = 'background: #333; color: #888; border: 2px solid #444;';
                btnDisabled = true;
            }

            // --- 2. LABELS & CATEGORY COLOR ---
            const categoryMap = { 'male': 'MASCULINA', 'female': 'FEMENINA', 'mixed': 'MIXTA', 'open': 'TWISTER' };
            const categoryLabel = categoryMap[evt.category] || 'TWISTER';

            // Category Color Logic (User Custom Request)
            let catColor = '#666'; // Default Gray
            if (evt.category === 'female') catColor = '#FF00CC';    // ROSA
            else if (evt.category === 'male') catColor = '#00E36D';   // VERDE
            else if (evt.category === 'mixed') catColor = '#FFD700';  // AMARILLO (Updated)
            else if (evt.category === 'open') catColor = '#00CCFF';   // AZUL

            let bgImage = evt.image_url || 'img/americana-neon-bg.jpg';
            if (!evt.image_url) {
                if (evt.category === 'mixed') bgImage = 'img/ball-mixta.png';
            }

            // --- 3. PRICES ---
            const pMember = evt.price_members || 12;
            const pExternal = evt.price_external || 14;

            // --- 4. FULL & FINISHED STATE VISUALS ---
            let isClosed = false;
            // Check if finished date is past today? Or just status.
            if (isFinished) {
                isClosed = true;
                btnContent = '<div style="display:flex; flex-direction:column; align-items:center; line-height:1;"><i class="fas fa-chart-bar" style="font-size: 1rem; margin-bottom: 2px;"></i><span style="font-size:0.55rem; font-weight:900;">REPORTE</span></div>';
                // Green for success/results
                btnStyle = 'background: #00E36D; color: black; border: none; box-shadow: 0 0 15px rgba(0,227,109, 0.4); width: 60px; height: 60px;';
                btnDisabled = false; // Enabled to see results!
                btnAction = `window.ControlTowerView.prepareLoad('${evt.id}'); Router.navigate('live'); event.stopPropagation();`;
            } else if (isFull) {
                btnContent = '<span style="font-size:0.65rem; font-weight:800; letter-spacing:0.5px;">LLENO</span>';
                btnStyle = 'background: #FF2D55; color: white; border: none; box-shadow: 0 4px 15px rgba(255, 45, 85, 0.4);';
                btnDisabled = true;
            }

            // OPTION C HTML STRUCTURE: THE HYBRID (REFINED - DARK MODE & ICONS)
            return `
                <div class="card-hybrid-c" onclick="ControlTowerView.prepareLoad('${evt.id}'); Router.navigate('live');" 
                     style="
                        position: relative; 
                        background: #111;
                        border-radius: 24px; 
                        overflow: hidden; 
                        margin-bottom: 20px; 
                        box-shadow: 0 10px 30px rgba(0,0,0,0.4);
                        border: 1px solid #222;
                        display: flex;
                        flex-direction: column;
                     ">
                    
                    <!-- TOP HALF: IMAGE -->
                    <div style="
                        height: 140px;
                        width: 100%;
                        background: url('${bgImage}') no-repeat center center / cover;
                        position: relative;
                    ">
                        
                        <!-- PRICE PILL (TOP RIGHT) - OPTIMIZED & COOL -->
                         <div style="
                            position: absolute; top: 12px; right: 12px;
                            background: rgba(0,0,0,0.6); 
                            backdrop-filter: blur(8px);
                            border: 1px solid rgba(255,255,255,0.1);
                            border-radius: 12px;
                            padding: 4px;
                            display: flex; gap: 4px; align-items: center;
                        ">
                            <div style="background:#444; color:white; padding:4px 8px; border-radius:8px; font-weight:800; font-size:0.75rem;">${pMember}€ <span style="font-weight:600; opacity:0.7; font-size: 0.65rem;">SOC</span></div>
                            <div style="background:#eee; color:#111; padding:4px 8px; border-radius:8px; font-weight:800; font-size:0.75rem;">${pExternal}€ <span style="font-weight:600; opacity:0.6; font-size: 0.65rem;">EXT</span></div>
                        </div>

                        <!-- DATE BADGE (TOP LEFT) -->
                        <div style="
                            position: absolute; top: 12px; left: 12px;
                            background: #000; 
                            border: 1px solid var(--playtomic-neon);
                            border-radius: 14px;
                            padding: 8px 12px;
                            min-width: 58px;
                            text-align: center;
                            color: white;
                            line-height: 1;
                            box-shadow: 0 4px 15px rgba(0,0,0,0.5);
                        ">
                            <div style="font-size: 0.7rem; font-weight: 700; color: var(--playtomic-neon); margin-bottom: 4px; text-transform:uppercase; letter-spacing:1px;">${dayName}</div>
                            <div style="font-size: 1.5rem; font-weight: 900; letter-spacing: -1px; color:white;">${dayNum}</div>
                        </div>

                        ${isClosed ? `
                        <div style="
                            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                            background: rgba(0,0,0,0.7);
                            backdrop-filter: blur(2px);
                            display: flex; align-items: center; justify-content: center;
                            z-index: 5;
                        ">
                            <div style="
                                border: 2px solid #00E36D; color: #00E36D; 
                                padding: 8px 20px; font-weight: 900; letter-spacing: 2px;
                                transform: rotate(-10deg); font-size: 1.2rem;
                                text-shadow: 0 0 10px rgba(0,227,109,0.5);
                                background: rgba(0,0,0,0.8);
                            ">CERRADA</div>
                        </div>
                        ` : ''}

                    </div>

                    <!-- FLOATING ACTION BUTTON -->
                    <div style="
                        position: absolute;
                        top: 115px; /* On the seam */
                        right: 20px;
                        z-index: 10;
                    ">
                        <button onclick="${btnAction}" 
                                ${btnDisabled ? 'disabled' : ''}
                                style="
                                    width: 54px; height: 54px;
                                    border-radius: 50%;
                                    border: none;
                                    font-size: 1.4rem;
                                    display: flex; align-items: center; justify-content: center;
                                    cursor: pointer;
                                    transition: transform 0.2s;
                                    ${btnStyle}
                                ">
                            ${btnContent}
                        </button>
                    </div>

                     <!-- BOTTOM HALF: CONTENT -->
                    <div style="
                        padding: 16px 20px 20px 20px;
                        background: #0a0a0a; 
                        border-top: 1px solid #222;
                    ">
                        <!-- Title -->
                        <h3 style="
                            color: white; 
                            font-size: 1.2rem; 
                            font-weight: 800; 
                            margin: 0 0 15px 0; 
                            line-height: 1.2;
                            padding-right: 60px; /* Space for FAB */
                            text-shadow: 0 2px 10px rgba(0,0,0,0.5);
                        ">
                            ${evt.name}
                        </h3>

                        <!-- NEW ICON GRID LAYOUT -->
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.75rem; font-weight: 700; color: #ccc;">
                            
                            <!-- ROW 1: Date & Time -->
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <i class="far fa-calendar-alt" style="color: var(--playtomic-neon); width: 16px; text-align: center;"></i> 
                                ${evt.date ? evt.date.split('-').reverse().join('-') : 'Sin fecha'}
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <i class="far fa-clock" style="color: var(--playtomic-neon); width: 16px; text-align: center;"></i> 
                                ${evt.time || '00:00'}
                            </div>

                            <!-- ROW 2: Category & Mode -->
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <div style="width: 16px; height: 16px; border-radius: 4px; background: ${catColor}; box-shadow: 0 0 5px ${catColor};"></div>
                                <span style="color: ${catColor}; font-weight: 800;">${categoryLabel}</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <i class="${evt.pair_mode === 'fixed' || (evt.name && evt.name.toUpperCase().includes('FIJA')) ? 'fas fa-lock' : 'fas fa-sync-alt'}" 
                                   style="color: #bbb; width: 16px; text-align: center;"></i>
                                <span style="color: #bbb;">${evt.pair_mode === 'fixed' || (evt.name && evt.name.toUpperCase().includes('FIJA')) ? 'FIJA' : 'TWISTER'}</span>
                            </div>

                            <!-- ROW 3: Courts & Players -->
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <i class="fas fa-table-tennis" style="color: #e91e63; width: 16px; text-align: center;"></i> 
                                ${(evt.max_courts || 4)} Pistas
                            </div>
                            <div onclick="event.stopPropagation(); EventsController.openPlayerListModal(this.getAttribute('data-players'))" 
                                 data-players='${JSON.stringify(players).replace(/'/g, "&apos;")}'
                                 style="display: flex; align-items: center; gap: 8px; cursor: pointer; color: var(--playtomic-neon);">
                                <i class="fas fa-users" style="width: 16px; text-align: center;"></i> 
                                <span style="text-decoration: underline;">${playerCount} Inscritos</span>
                            </div>

                        </div>
                    </div>
                </div>
            `;
        }

        openPlayerListModal(playersJson) {
            let players = [];
            try {
                players = typeof playersJson === 'string' ? JSON.parse(playersJson) : playersJson;
            } catch (e) {
                console.error("Error parsing players", e);
                return;
            }

            // Create Modal DOM
            const modalId = 'player-list-modal';
            const existingModal = document.getElementById(modalId);
            if (existingModal) existingModal.remove();

            const modal = document.createElement('div');
            modal.id = modalId;
            modal.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.96); backdrop-filter: blur(15px);
                z-index: 10000; display: flex; flex-direction: column;
                animation: fadeIn 0.3s ease-out;
                font-family: 'Outfit', sans-serif;
            `;

            const content = `
                <!-- HEADER: FOX SPORTS BROADCAST STYLE -->
                <div style="
                    background: linear-gradient(90deg, #0044cc 0%, #001133 100%);
                    padding: 30px 20px;
                    display: flex; align-items: center; justify-content: space-between;
                    border-bottom: 5px solid var(--playtomic-neon);
                    box-shadow: 0 15px 50px rgba(0,68,204,0.4);
                    position: relative; overflow: hidden;
                ">
                    <!-- Dynamic BG elements -->
                    <div style="position: absolute; right: 0; top: 0; height: 100%; width: 50%; background: repeating-linear-gradient(45deg, transparent, transparent 15px, rgba(255,255,255,0.03) 15px, rgba(255,255,255,0.03) 30px);"></div>
                    <div style="position: absolute; left: 10%; top: -20%; width: 200px; height: 200px; background: rgba(0,102,255,0.1); border-radius: 50%; filter: blur(40px);"></div>

                    <div style="position: relative; z-index: 2;">
                        <div style="
                            display: inline-block; 
                            background: var(--playtomic-neon); 
                            color: #000; 
                            padding: 2px 10px; 
                            font-size: 0.75rem; 
                            font-weight: 950; 
                            text-transform: uppercase; 
                            letter-spacing: 2px;
                            transform: skew(-15deg);
                            margin-bottom: 10px;
                        ">SOMOSPADEL LIVE</div>
                        <h2 style="color: white; margin: 0; font-size: 2.2rem; font-weight: 900; line-height: 0.9; text-transform: uppercase; letter-spacing: -1px;">
                            OFFICIAL <span style="color: var(--playtomic-neon);">LINEUP</span>
                        </h2>
                    </div>
                    
                    <div style="text-align: right; position: relative; z-index: 2;">
                        <div style="font-size: 3rem; font-weight: 900; color: white; line-height: 1; font-family: 'Montserrat';">${players.length}</div>
                        <div style="font-size: 0.8rem; color: rgba(255,255,255,0.6); text-transform: uppercase; font-weight: 800; letter-spacing: 1px;">Inscritos</div>
                    </div>
                </div>

                <!-- PLAYER GRID - CHAMPIONS STYLE -->
                <div style="flex: 1; overflow-y: auto; padding: 25px; display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 12px; align-content: start; -webkit-overflow-scrolling: touch;">
                    ${players.length === 0 ?
                    `<div style="grid-column: 1 / -1; padding: 100px 20px; text-align: center; color: #444;">
                            <i class="fas fa-users-slash" style="font-size: 5rem; margin-bottom: 20px; opacity: 0.3;"></i>
                            <h3 style="color: #666;">SIN JUGADORES REGISTRADOS</h3>
                         </div>` :
                    players.map((p, i) => {
                        const levelValue = parseFloat(p.level || p.playtomic_level || 3.5);
                        return `
                            <div style="
                                background: linear-gradient(160deg, #1a1a1a 0%, #050505 100%);
                                border: 1px solid rgba(255,255,255,0.08);
                                border-radius: 12px;
                                padding: 15px 5px;
                                text-align: center;
                                position: relative;
                                overflow: hidden;
                                animation: slideUp 0.4s cubic-bezier(0.2, 0.8, 0.2, 1.1) forwards;
                                opacity: 0;
                                animation-delay: ${i * 0.04}s;
                                box-shadow: 0 8px 15px rgba(0,0,0,0.4);
                            ">
                                 <!-- Glass shimmer -->
                                 <div style="position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: linear-gradient(45deg, transparent 45%, rgba(255,255,255,0.03) 50%, transparent 55%); animation: shimmer 3s infinite;"></div>

                                 <!-- Level Badge -->
                                 <div style="
                                    position: absolute; top: 8px; right: 8px;
                                    background: ${levelValue >= 4.5 ? '#FF2D55' : (levelValue >= 4 ? '#FFD700' : '#00E36D')};
                                    color: #000;
                                    font-size: 0.65rem; font-weight: 900;
                                    padding: 2px 7px; border-radius: 4px;
                                    box-shadow: 0 0 10px rgba(0,0,0,0.5);
                                    z-index: 5;
                                 ">
                                    ${levelValue.toFixed(2)}
                                 </div>

                                 <!-- Icon Container -->
                                 <div style="
                                    width: 55px; height: 55px; margin: 5px auto 12px;
                                    background: #222; border-radius: 50%;
                                    display: flex; align-items: center; justify-content: center;
                                    border: 2px solid ${levelValue >= 4 ? 'rgba(255,215,0,0.3)' : 'rgba(255,255,255,0.1)'};
                                    color: white; font-size: 1.6rem;
                                    box-shadow: inset 0 0 10px rgba(0,0,0,0.8);
                                 ">
                                    <i class="fas fa-user-astronaut"></i>
                                 </div>
                                 
                                 <!-- Name Text Wrapper -->
                                 <div style="padding: 0 4px;">
                                     <div style="color: white; font-weight: 800; font-size: 0.8rem; line-height: 1.1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-transform: uppercase;">
                                        ${p.name ? p.name.split(' ')[0] : 'JUGADOR'}
                                     </div>
                                     <div style="color: #666; font-size: 0.65rem; font-weight: 700; margin-top: 2px; text-transform: uppercase; overflow: hidden;">
                                        ${p.name && p.name.includes(' ') ? p.name.split(' ').slice(1).join(' ') : 'CONFIRMADO'}
                                     </div>
                                 </div>

                            </div>
                        `}).join('')}
                </div>

                <!-- TICKER FOOTER -->
                <div style="background: #000; padding: 5px 0; border-top: 1px solid #222;">
                    <div style="display: flex; overflow: hidden; white-space: nowrap;">
                        <div style="animation: ticker 30s linear infinite; color: var(--playtomic-neon); font-weight: 900; font-size: 0.7rem; letter-spacing: 2px; padding: 5px 0;">
                            &nbsp; • SOMOSPADEL BCN OFFICIAL STREAM • TOTAL REGISTRATION: ${players.length} • PLAYER LEVELS SYNCED WITH DATABASE • &nbsp;
                        </div>
                    </div>
                </div>

                <!-- CLOSE RED BUTTON -->
                <div style="
                    padding: 25px; 
                    background: #000; 
                    display: flex; justify-content: center;
                    position: relative; z-index: 10;
                ">
                    <button onclick="document.getElementById('${modalId}').remove()" style="
                        background: #FF2D55; color: white;
                        border: none;
                        padding: 18px 60px;
                        border-radius: 4px;
                        font-weight: 900;
                        font-size: 1.1rem;
                        cursor: pointer;
                        text-transform: uppercase;
                        letter-spacing: 2px;
                        box-shadow: 0 10px 40px rgba(255,45,85,0.4);
                        transition: all 0.2s;
                    " onmouseover="this.style.transform='scale(1.05)'; this.style.background='#ff5577';" 
                       onmouseout="this.style.transform='scale(1)'; this.style.background='#FF2D55';">
                        SALIR DE LA RETRANSMISIÓN
                    </button>
                </div>

                <style>
                    @keyframes shimmer { 0% { opacity: 0.3; transform: translate(-10%, -10%); } 50% { opacity: 0.6; } 100% { opacity: 0.3; transform: translate(10%, 10%); } }
                    @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
                </style>
            `;

            modal.innerHTML = content;
            document.body.appendChild(modal);
        }

        renderAvatars(players, max = 3) {
            if (!players || !players.length) return `<div class="p-avatar-empty"></div>`;
            return players.slice(0, max).map(p => `
                <div class="p-avatar-mini" style="background: var(--playtomic-neon); color: black;">
                    ${(p.name || 'P').charAt(0)}
                </div>
            `).join('') + (players.length > max ? `<div class="p-avatar-plus">+${players.length - max}</div>` : '');
        }

        async joinEvent(eventId) {
            const user = this.state.currentUser;
            if (!user) { alert("Inicia sesión para apuntarte"); window.location.hash = '#profile'; return; }

            // Basic confirmation
            if (!confirm("¿Confirmar inscripción al torneo?")) return;

            // Optimistic update handled by real-time listener, but we call service
            try {
                const res = await window.AmericanaService.addPlayer(eventId, user);
                if (!res.success) throw new Error(res.error);
                alert("¡Inscripción realizada con éxito!");
            } catch (err) {
                alert("Error: " + err.message);
            }
        }
    }

    // Initialize globally
    window.EventsController = new EventsController();

})();
