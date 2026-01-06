/**
 * AgendaView.js
 */
(function () {
    class AgendaView {
        render(myEvents, upcomingEvents) {
            const container = document.getElementById('content-area');
            if (!container) return;

            container.innerHTML = `
                <div class="agenda-container fade-in" style="background: #fafafa; min-height: 100vh; padding-bottom: 100px; font-family: 'Inter', sans-serif;">
                    
                    <!-- Header -->
                    <div style="background: #000; padding: 30px 24px; color: white;">
                        <h1 style="font-family: 'Outfit'; font-weight: 800; font-size: 1.8rem; margin: 0;">Mi <span style="color: var(--playtomic-neon);">Agenda</span></h1>
                        <p style="color: #666; font-size: 0.9rem; margin-top: 5px;">Tus próximos partidos y torneos reservados.</p>
                    </div>

                    <!-- My Reserved Events -->
                    <div style="padding: 24px;">
                        <div style="font-size: 0.7rem; font-weight: 800; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px;">PRÓXIMAS CITAS</div>
                        ${myEvents.length === 0 ? `
                            <div style="background: white; border-radius: 16px; padding: 40px 20px; text-align: center; border: 1px dashed #ddd;">
                                <div style="font-size: 2rem; margin-bottom: 10px;">📅</div>
                                <div style="font-weight: 700; color: #444;">No tienes reservas</div>
                                <p style="font-size: 0.8rem; color: #888; margin-top: 5px;">¡Apúntate a una americana para empezar!</p>
                                <button onclick="Router.navigate('americanas')" style="background: #000; color: white; border: none; padding: 10px 20px; border-radius: 10px; font-weight: 700; font-size: 0.8rem; margin-top: 15px;">EXPLORAR EVENTOS</button>
                            </div>
                        ` : myEvents.map(e => this.renderEventCard(e, true)).join('')}
                    </div>

                    <!-- Recommended -->
                    <div style="padding: 0 24px;">
                        <div style="font-size: 0.7rem; font-weight: 800; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px;">RECOMENDADOS PARA TI</div>
                        ${upcomingEvents.map(e => this.renderEventCard(e, false)).join('')}
                    </div>

                </div>
            `;
        }

        renderEventCard(event, isReserved) {
            const date = new Date(event.date);
            const day = date.getDate();
            const month = date.toLocaleString('es', { month: 'short' }).toUpperCase();

            return `
                <div style="background: white; border-radius: 20px; padding: 16px; margin-bottom: 15px; display: flex; align-items: center; gap: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); border: 1px solid #eeeff2;">
                    <div style="background: #f0f4ff; color: #0055ff; padding: 10px; border-radius: 12px; text-align: center; min-width: 50px;">
                        <div style="font-size: 1.1rem; font-weight: 900;">${day}</div>
                        <div style="font-size: 0.6rem; font-weight: 800;">${month}</div>
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: 800; color: #111; font-size: 0.9rem;">${event.name}</div>
                        <div style="font-size: 0.75rem; color: #666; margin-top: 2px;">
                            <i class="far fa-clock" style="margin-right: 4px;"></i> ${event.time} • ${event.category || 'Open'}
                        </div>
                    </div>
                    ${isReserved ? `
                        <div style="background: #34d399; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                            <i class="fas fa-check" style="font-size: 0.8rem;"></i>
                        </div>
                    ` : `
                        <button onclick="Router.navigate('americanas')" style="background: #000; color: white; border: none; padding: 8px 12px; border-radius: 8px; font-weight: 800; font-size: 0.7rem;">VER</button>
                    `}
                </div>
            `;
        }
    }

    window.AgendaView = new AgendaView();
    console.log("📅 AgendaView Initialized");
})();
