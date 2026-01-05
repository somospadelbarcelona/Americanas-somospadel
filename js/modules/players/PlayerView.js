/**
 * PlayerView.js (Global Version)
 * AIR THEME: 'Wallet Pass' Style for Matches
 */
(function () {
    class PlayerView {
        constructor() {
            this.container = null;
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.init());
            } else {
                this.init();
            }
        }

        init() {
            this.container = document.getElementById('content-area');
            if (window.Store) {
                window.Store.subscribe('playerData', (data) => {
                    this.latestData = data;
                });
            }
        }

        render() {
            this.container = document.getElementById('content-area');
            if (!this.container) return;

            if (!this.latestData || !this.latestData.currentMatch) {
                this.renderEmptyState();
                return;
            }

            const match = this.latestData.currentMatch;
            this.container.innerHTML = `
                <div class="fade-in" style="max-width: 450px; margin: 0 auto; padding-top: 2rem;">
                    <h1 class="page-title" style="text-align: center; margin-bottom: 24px;">Tu Pase de Juego</h1>
                    
                    <!-- Wallet Pass Card -->
                    <div class="card-air" style="padding: 0; overflow: hidden; border: 1px solid rgba(0,0,0,0.08);">
                        <!-- Header Color -->
                        <div style="background: var(--text-main); color: white; padding: 20px; display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <div style="font-size: 0.8rem; font-weight: 600; opacity: 0.8;">HORA DE INICIO</div>
                                <div style="font-size: 2rem; font-weight: 800; font-family: var(--font-heading);">${match.time}</div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-size: 0.8rem; font-weight: 600; opacity: 0.8;">PISTA</div>
                                <div style="font-size: 2.5rem; font-weight: 800; font-family: var(--font-heading); color: var(--primary);">${match.court}</div>
                            </div>
                        </div>
                        
                        <!-- Content -->
                        <div style="padding: 32px 24px; text-align: center;">
                            <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 8px;">TU PAREJA</div>
                            <div style="font-size: 1.5rem; font-weight: 700; color: var(--text-main); margin-bottom: 24px;">${match.partner.name}</div>
                            
                            <hr style="border: 0; border-top: 2px dashed var(--border-subtle); margin-bottom: 24px;">
                            
                            <!-- QR Code Fake -->
                            <div style="font-family: monospace; font-size: 0.8rem; color: var(--text-secondary); background: #F5F5F7; padding: 12px; border-radius: 8px; margin-bottom: 24px;">
                                ||| || ||| | |||| || ||| ||||
                                <br>
                                TICKET ID: ${Date.now().toString().slice(-8)}
                            </div>
                            
                            <button class="btn-air-primary" style="width: 100%; justify-content: center;">
                                <i class="fas fa-check-circle"></i> Confirmar Asistencia
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        renderEmptyState() {
            this.container.innerHTML = `
                <div style="text-align:center; padding: 4rem 1rem;">
                    <div style="width: 80px; height: 80px; background: #F5F5F7; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px auto;">
                        <i class="fas fa-couch" style="font-size: 2rem; color: var(--text-muted);"></i>
                    </div>
                    <h2 class="card-title">Sin Partido Asignado</h2>
                    <p class="page-subtitle" style="max-width: 300px; margin: 12px auto;">Apúntate a una Americana o espera a que se genere el próximo cuadro.</p>
                    <button class="btn-air-ghost" onclick="Router.navigate('events')">Buscar Eventos</button>
                </div>
            `;
        }
    }

    window.PlayerView = new PlayerView();
    console.log("📱 PlayerView Air Loaded");
})();
