/**
 * EventsController.js (Playtomic Theme)
 * REPLICA: Competition List View
 */
(function () {
    class EventsController {
        constructor() {
            this.state = {
                events: [],
                loading: false
            };
        }

        init() {
            this.loadEvents();
        }

        async loadEvents() {
            this.state.loading = true;
            this.render();

            if (window.AmericanaService) {
                this.state.events = await window.AmericanaService.getActiveAmericanas();
            }
            this.state.loading = false;
            this.render();
        }

        async joinEvent(eventId) {
            // Simplified join logic
            const user = window.Store ? window.Store.getState('currentUser') : null;
            if (!user) { alert("Inicia sesión para apuntarte"); return; }
            if (!confirm("¿Inscribirte por 0€?")) return;

            await window.AmericanaService.addPlayer(eventId, user);
            alert("¡Apuntado!");
            this.loadEvents();
        }

        render() {
            const container = document.getElementById('content-area');
            if (!container) return;

            const eventsHtml = this.state.events.map(evt => this.renderCard(evt)).join('');

            container.innerHTML = `
                <div class="fade-in">
                    <!-- Filters (Mock) -->
                    <div style="padding: 10px 20px; display:flex; gap:20px; border-bottom:1px solid #eee;">
                         <div style="font-weight:700; color:black; border-bottom:2px solid black; padding-bottom:8px;">Disponible</div>
                         <div style="font-weight:500; color:#888; padding-bottom:8px;">Tus competiciones</div>
                    </div>
                
                    <h2 class="p-section-title">Hoy</h2>
                    
                    <div>
                        ${eventsHtml.length ? eventsHtml : '<div style="padding:20px; text-align:center; color:#aaa;">No hay torneos hoy.</div>'}
                    </div>
                </div>
            `;
        }

        renderCard(evt) {
            const playerCount = evt.registeredPlayers ? evt.registeredPlayers.length : 0;
            const maxPlayers = (evt.max_courts || 0) * 4;

            // Format Date
            const d = new Date(evt.date);
            const days = ['domngo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
            const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
            const dayName = days[d.getDay()];
            const dayNum = d.getDate();
            const monthName = months[d.getMonth()];

            return `
                <div class="comp-card">
                    <div class="comp-header">
                        <div class="comp-date-box">
                             <!-- Visual Box like Playtomic Blue/Square -->
                             <div style="background:var(--playtomic-blue); height:40px; width:40px; border-radius:4px; position:relative;">
                                <div style="position:absolute; top:5px; right:5px; width:10px; height:10px; background:var(--playtomic-neon); border-radius:50%;"></div>
                                <div style="position:absolute; bottom:5px; left:5px; width:20px; height:2px; background:white;"></div>
                             </div>
                        </div>
                        <div class="comp-info">
                             <div style="font-size:0.8rem; color:#666; margin-bottom:4px;">${dayName}, ${dayNum} de ${monthName} | ${evt.time}</div>
                             <h3>${evt.name || 'Americana Padel'}</h3>
                             <div style="font-size:0.75rem; color:#888; margin-top:4px;">Torneo</div>
                             <div class="comp-meta" style="margin-top:8px;">
                                 <span><i class="fas fa-table-tennis"></i> Padel</span>
                                 <span><i class="fas fa-trophy"></i> Torneo</span>
                                 <span><i class="fas fa-signal"></i> 0-7</span>
                                 <span><i class="fas fa-venus-mars"></i> Abierto</span>
                             </div>
                             
                             <div style="margin-top:12px; display:flex; align-items:center; gap:8px;">
                                 <div class="comp-avatars">
                                     ${this.renderAvatars(evt.registeredPlayers)}
                                     <button class="btn-comp-join" style="width:30px; height:30px; padding:0; border-radius:50%; display:flex; align-items:center; justify-content:center;">+</button>
                                 </div>
                                 <span style="font-size:0.8rem; color:#666;">${playerCount}/${maxPlayers}</span>
                             </div>
                        </div>
                    </div>
                    <div class="comp-footer">
                        <div style="display:flex; align-items:center; gap:10px;">
                             <i class="far fa-building" style="font-size:1.2rem;"></i>
                             <div>
                                 <div style="font-weight:600; font-size:0.9rem;">Somos Padel BCN</div>
                                 <div style="font-size:0.75rem; color:#888;">0km</div>
                             </div>
                        </div>
                        <div style="text-align:right;">
                             <button class="btn-comp-join primary" onclick="EventsController.joinEvent('${evt.id}')">
                                 <i class="far fa-user"></i> 0€
                             </button>
                        </div>
                    </div>
                </div>
            `;
        }

        renderAvatars(players) {
            if (!players) return '';
            return players.slice(0, 3).map(p => `<div class="comp-avatar" title="${p.name}"></div>`).join('');
        }
    }

    window.EventsController = new EventsController();
})();
