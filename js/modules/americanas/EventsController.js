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
                loading: true,
                currentUser: null
            };
            this.unsubscribeEvents = null;
            this.unsubscribeUsers = null;
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

        setTab(tabName) {
            this.state.activeTab = tabName;
            this.render();
        }

        render() {
            const container = document.getElementById('content-area');
            if (!container) return;

            // --- 1. SUBMENU NAVIGATION ---
            // "RESULTADOS - CLASIFICACION - NOTICIAS - RANKING" + "EVENTOS" (Home) + "MIS TORNEOS"
            const tabs = [
                { id: 'events', label: 'TORNEOS', icon: 'fa-trophy' },
                { id: 'agenda', label: 'MI AGENDA', icon: 'fa-calendar-check' },
                { id: 'ranking', label: 'RANKING', icon: 'fa-medal' },
                { id: 'standings', label: 'CLASIF.', icon: 'fa-chart-line' }
            ];

            const navHtml = `
                <div class="events-submenu-container" style="background: white; padding: 10px 0; border-bottom: 1px solid #eee; margin-bottom: 10px; display: flex; justify-content: space-around; position: sticky; top: 0; z-index: 10;">
                    ${tabs.map(tab => `
                        <button onclick="EventsController.setTab('${tab.id}')" 
                                style="
                                    background: transparent; 
                                    border: none; 
                                    display: flex;
                                    flex-direction: column;
                                    align-items: center;
                                    gap: 5px;
                                    color: ${this.state.activeTab === tab.id ? 'var(--playtomic-blue)' : '#999'}; 
                                    font-weight: 700; 
                                    padding: 8px;
                                    font-size: 0.65rem;
                                    cursor: pointer;
                                    transition: all 0.2s;
                                    flex: 1;
                                ">
                            <i class="fas ${tab.icon}" style="font-size: 1.1rem; color: ${this.state.activeTab === tab.id ? 'var(--playtomic-neon)' : 'inherit'};"></i>
                            ${tab.label}
                        </button>
                    `).join('')}
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
                    case 'ranking':
                        contentHtml = this.renderRankingView();
                        break;
                    case 'standings':
                        contentHtml = this.renderStandingsView();
                        break;
                }
            }

            container.innerHTML = `<div class="fade-in">${navHtml}${contentHtml}</div>`;
        }

        // --- VIEW RENDERERS ---

        renderEventsList(onlyMine) {
            let events = this.state.events;
            const uid = this.state.currentUser ? this.state.currentUser.uid : null;

            if (onlyMine) {
                if (!uid) return `<div style="text-align:center; padding:40px; color:#888;">Debes iniciar sesión.</div>`;
                events = events.filter(e => {
                    const players = e.players || e.registeredPlayers || [];
                    return players.some(p => p.uid === uid || p.id === uid);
                });
            }

            const eventsHtml = events.map(evt => this.renderCard(evt)).join('');

            return `
                <div style="background: #000; min-height: 80vh; padding-top: 15px;">
                    <div style="padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; background: linear-gradient(to bottom, rgba(204,255,0,0.05), transparent);">
                        <div>
                            <h2 style="font-size: 1.4rem; font-weight: 900; margin: 0; color: white; letter-spacing: -0.5px;">Americanas <span style="color: var(--playtomic-neon);">BCN</span></h2>
                            <p style="font-size: 0.75rem; color: #666; margin: 0;">Reserva tu plaza en los mejores torneos</p>
                        </div>
                        <div style="text-align: right;">
                            <span style="font-size: 0.65rem; color: var(--playtomic-neon); border: 1px solid var(--playtomic-neon); padding: 4px 12px; border-radius: 20px; font-weight: 800; letter-spacing: 1px;">
                                ${events.length} ACTIVAS
                            </span>
                        </div>
                    </div>
                    <div style="padding-bottom: 120px;">
                        ${eventsHtml.length ? eventsHtml : `
                            <div style="padding:80px 40px; text-align:center; color:#444;">
                                <i class="fas fa-calendar-times" style="font-size: 4rem; margin-bottom: 20px; opacity: 0.2;"></i>
                                <h3 style="color: #666;">No hay torneos disponibles</h3>
                                <p style="font-size: 0.9rem;">Vuelve pronto para ver las nuevas fechas.</p>
                            </div>
                        `}
                    </div>
                </div>
            `;
        }

        renderAgendaView() {
            const uid = this.state.currentUser ? this.state.currentUser.uid : null;
            if (!uid) return `<div style="text-align:center; padding:60px 20px; color:#888;"><i class="fas fa-lock" style="font-size:3rem; margin-bottom:20px; opacity:0.1;"></i><br>Inicia sesión para ver tu agenda personal.</div>`;

            // Filter events where user is participant
            const myEvents = this.state.events.filter(e => {
                const players = e.players || e.registeredPlayers || [];
                return players.some(p => p.uid === uid || p.id === uid);
            });

            if (myEvents.length === 0) {
                return `
                    <div style="text-align:center; padding:80px 40px; color:#999;">
                        <i class="far fa-calendar-times" style="font-size:4rem; margin-bottom:20px; opacity:0.1;"></i>
                        <h3 style="color:#333;">Agenda Vacía</h3>
                        <p style="font-size:0.9rem;">No tienes torneos próximos. ¡Inscríbete en uno para aparecer aquí!</p>
                        <button class="btn-primary-pro" onclick="EventsController.setTab('events')" style="margin-top:20px;">VER TORNEOS</button>
                    </div>
                `;
            }

            return `
                <div style="padding: 20px; background: #f8f9fa; min-height: 80vh;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 25px;">
                        <div style="width: 45px; height: 45px; background: var(--playtomic-neon); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; color: black;"><i class="fas fa-calendar-day"></i></div>
                        <div>
                            <h2 style="font-size: 1.2rem; font-weight: 800; margin: 0;">Tu Próxima Cita</h2>
                            <p style="font-size: 0.75rem; color: #888; margin: 0;">Sincronizado con SomosPadel BCN</p>
                        </div>
                    </div>

                    ${myEvents.map(evt => {
                const statusColor = evt.status === 'live' ? 'var(--playtomic-neon)' : (evt.status === 'finished' ? '#4ADE80' : '#0055FF');
                return `
                            <div class="glass-card-enterprise" style="background: white; border: 1px solid #eee; margin-bottom: 15px; padding: 20px; border-left: 5px solid ${statusColor}; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                    <div>
                                        <div style="font-size: 0.7rem; color: #888; font-weight: 700; text-transform: uppercase; margin-bottom: 5px;">📅 ${evt.date} • ${evt.time}</div>
                                        <h3 style="margin: 0; font-size: 1.1rem; color: #000; font-weight: 800;">${evt.name}</h3>
                                        <div style="font-size: 0.8rem; color: #666; margin-top: 5px;"><i class="fas fa-map-marker-alt" style="margin-right: 5px; color: #ff4d4d;"></i> SomosPadel Indoor</div>
                                    </div>
                                    <div style="text-align: right;">
                                        <div style="background: ${evt.status === 'live' ? 'black' : '#eee'}; color: ${evt.status === 'live' ? 'var(--playtomic-neon)' : '#666'}; padding: 4px 8px; border-radius: 6px; font-size: 0.6rem; font-weight: 800;">
                                            ${evt.status === 'live' ? 'EN JUEGO' : (evt.status === 'finished' ? 'FINALIZADO' : 'PRÓXIMO')}
                                        </div>
                                    </div>
                                </div>
                                <div style="margin-top: 15px; pt-15px; border-top: 1px solid #f0f0f0; padding-top: 15px; display: flex; justify-content: space-between; align-items: center;">
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <div style="width: 25px; height: 25px; background: #ddd; border-radius: 50%; font-size: 0.6rem; display: flex; align-items: center; justify-content: center;"><i class="fas fa-users"></i></div>
                                        <span style="font-size: 0.75rem; color: #777;">Inscripción Confirmada</span>
                                    </div>
                                    <button onclick="ControlTowerView.load('${evt.id}'); Router.navigate('live');" style="background: var(--playtomic-blue); color: white; border: none; padding: 8px 15px; border-radius: 20px; font-size: 0.75rem; font-weight: 700;">
                                        VER TORNEO
                                    </button>
                                </div>
                            </div>
                        `;
            }).join('')}
                </div>
            `;
        }

        renderRankingView() {
            // Render a dummy ranking based on loaded users
            const sortedUsers = [...this.state.users].sort((a, b) => (b.level || 0) - (a.level || 0));

            return `
                <div style="padding: 1rem;">
                    <h3 style="color:var(--primary); margin-bottom:1rem;">Ranking Global (Nivel)</h3>
                    <div style="background: rgba(255,255,255,0.03); border-radius: 12px; overflow: hidden;">
                        ${sortedUsers.map((u, i) => `
                            <div style="display:flex; align-items:center; padding: 12px 15px; border-bottom: 1px solid rgba(255,255,255,0.05); background: ${i < 3 ? 'rgba(204,255,0,0.05)' : 'transparent'};">
                                <div style="width: 30px; font-weight: 800; color: ${i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : '#666'}; text-align:center;">#${i + 1}</div>
                                <div style="width: 40px; height: 40px; border-radius: 50%; background: #333; margin-right: 15px; display:flex; align-items:center; justify-content:center; font-weight:700; color:#fff;">${u.name.charAt(0)}</div>
                                <div style="flex:1;">
                                    <div style="font-weight: 700; color: white;">${u.name}</div>
                                    <div style="font-size: 0.7rem; color: #888;">${u.matches_played || 0} Partidos</div>
                                </div>
                                <div style="font-weight: 800; color: var(--primary); font-size: 1.1rem;">${(u.level || 0).toFixed(2)}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        renderStandingsView() {
            return `
                <div style="padding: 2rem; text-align: center;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📊</div>
                    <h3 style="color: white; margin-bottom: 0.5rem;">Clasificación por Torneo</h3>
                    <p style="color: #666; font-size: 0.9rem;">Selecciona un torneo en la pestaña "Resultados" para ver la clasificación detallada de ese evento específico.</p>
                </div>
            `;
        }

        renderNewsView() {
            return `
                <div style="padding: 2rem; text-align: center;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📰</div>
                    <h3 style="color: white; margin-bottom: 0.5rem;">Noticias y Novedades</h3>
                    <p style="color: #666; font-size: 0.9rem;">Próximamente: Crónicas de partidos, entrevistas a jugadores destacados y anuncios de nuevos torneos especiales.</p>
                </div>
            `;
        }

        // --- CARD RENDERER (Classic Playtomic Style) ---
        renderCard(evt) {
            const players = evt.players || evt.registeredPlayers || [];
            const playerCount = players.length;
            const maxPlayers = (evt.max_courts || 0) * 4;

            const d = new Date(evt.date);
            const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
            const monthName = months[d.getMonth()];
            const dayNum = d.getDate();

            const user = this.state.currentUser;
            const uid = user ? user.uid : '-';
            const isJoined = players.some(p => p.uid === uid || p.id === uid);
            const isFull = playerCount >= maxPlayers;

            const statusLabel = evt.status === 'live' ? 'EN VIVO' : (evt.status === 'finished' ? 'FINALIZADO' : 'ABIERTA');
            const statusClass = evt.status === 'live' ? 'live-glow' : '';

            return `
                <div class="comp-card-v2" onclick="ControlTowerView.load('${evt.id}'); Router.navigate('live');">
                    <div class="card-hero" style="background-image: linear-gradient(to bottom, transparent, #000 95%), url('${evt.image_url || 'img/americana-pro.png'}');">
                        <div class="date-badge">
                            <span class="day">${dayNum}</span>
                            <span class="month">${monthName}</span>
                        </div>
                        <div class="status-overlay ${statusClass}">${statusLabel}</div>
                    </div>
                    
                    <div class="card-content">
                        <div class="card-header-row">
                            <h3 class="card-title">${evt.name}</h3>
                            <div class="card-price">14€</div>
                        </div>
                        
                        <div class="card-meta-grid">
                            <div class="meta-item"><i class="far fa-clock"></i> ${evt.time}</div>
                            <div class="meta-item"><i class="fas fa-map-marker-alt"></i> SomosPadel Indoor</div>
                            <div class="meta-item"><i class="fas fa-layer-group"></i> Nivel ${evt.category || 'Open'}</div>
                        </div>

                        <div class="card-footer-row">
                            <div class="player-count">
                                <div class="avatars-group">${this.renderAvatars(players, 3)}</div>
                                <span class="count-text">${playerCount}/${maxPlayers}</span>
                            </div>
                            
                            <button class="join-btn-v2 ${isJoined ? 'joined' : (isFull ? 'full' : 'active')}" 
                                    onclick="event.stopPropagation(); ${isJoined ? '' : `EventsController.joinEvent('${evt.id}')`}"
                                    ${(isJoined || isFull) ? 'disabled' : ''}>
                                ${isJoined ? 'INSCRITO' : (isFull ? 'COMPLETO' : 'APUNTARME')}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        renderAvatars(players, max = 3) {
            if (!players || !players.length) return `<div class="p-avatar-empty"></div>`;
            let html = players.slice(0, max).map(p => `
                <div class="p-avatar-mini" style="background: var(--playtomic-neon); color: black;">
                    ${(p.name || 'P').charAt(0)}
                </div>
            `).join('');

            if (players.length > max) {
                html += `<div class="p-avatar-plus">+${players.length - max}</div>`;
            }
            return html;
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
