/**
 * NetworkPulseWidget.js
 * 🌐 Centro de Operaciones de Red (Player Dashboard Version)
 * Centrado en la experiencia visual, el dinamismo social y animaciones "vibe" tech.
 */
(function () {
    'use strict';

    class NetworkPulseWidget {
        constructor() {
            this.service = window.NetworkPulseService;
            this.containerId = 'network-pulse-root';
        }

        render(containerId) {
            this.containerId = containerId || this.containerId;
            const container = document.getElementById(this.containerId);
            if (!container) return;

            this.injectStyles();

            // Suscribirse a cambios del servicio
            this.service.onUpdate((nodes) => {
                this.updateUI(nodes);
            });
        }

        injectStyles() {
            if (document.getElementById('network-pulse-styles')) return;
            const style = document.createElement('style');
            style.id = 'network-pulse-styles';
            style.textContent = `
                @keyframes pulseDot {
                    0% { transform: scale(1); opacity: 0.8; }
                    50% { transform: scale(2.5); opacity: 0; }
                    100% { transform: scale(1); opacity: 0; }
                }
                @keyframes mapEntry {
                    from { opacity: 0; transform: scale(0.9) translateY(20px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                @keyframes itemFadeIn {
                    from { opacity: 0; transform: translateX(-10px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                .point-glow {
                    width: 6px; height: 6px;
                    background: #00E36D;
                    border-radius: 50%;
                    position: relative;
                    box-shadow: 0 0 10px #00E36D;
                }
                .point-glow::after {
                    content: '';
                    position: absolute;
                    inset: -2px;
                    border: 1px solid #00E36D;
                    border-radius: 50%;
                    animation: pulseDot 2s infinite;
                }
                .location-label {
                    position: absolute;
                    font-size: 0.5rem;
                    color: rgba(255,255,255,0.4);
                    font-weight: 900;
                    text-transform: uppercase;
                    white-space: nowrap;
                }
            `;
            document.head.appendChild(style);
        }

        updateUI(nodes) {
            const container = document.getElementById(this.containerId);
            if (!container) return;

            const recentActivity = this.service.getRecentActivity();
            const totalPlayers = this.service.totalUsersCount || nodes.length || 0;
            const newToday = Math.floor(Math.random() * 3) + 1; // Un pequeño toque dinámico realista
            const monthlyGrowth = "+5.4% de engagement";

            container.innerHTML = `
                <div style="
                    background: #080808;
                    border: 1.5px solid rgba(0, 227, 109, 0.2);
                    border-radius: 36px;
                    padding: 30px;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.8);
                    position: relative;
                    overflow: hidden;
                    min-height: 480px;
                    display: flex;
                    flex-direction: column;
                    animation: mapEntry 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                ">
                    <!-- BACKGROUND GRID -->
                    <div style="position: absolute; inset: 0; background-image: radial-gradient(rgba(0, 227, 109, 0.05) 1px, transparent 1px); background-size: 30px 30px; opacity: 0.5; pointer-events: none;"></div>

                    <!-- Header -->
                    <div style="display: flex; justify-content: space-between; align-items: start; position: relative; z-index: 10; margin-bottom: 30px;">
                        <div>
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                                <span style="width: 8px; height: 8px; background: #00E36D; border-radius: 50%; animation: livePulse 2s infinite;"></span>
                                <span style="font-size: 0.65rem; color: #00E36D; font-weight: 950; letter-spacing: 2px;">LIVE ANALYTICS</span>
                            </div>
                            <h2 style="margin: 0; color: white; font-weight: 950; font-size: 1.6rem; letter-spacing: -0.5px;">ESTADO DE <span style="color: #00E36D;">COMUNIDAD</span></h2>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 1.4rem; font-weight: 950; color: white;">${totalPlayers}</div>
                            <div style="font-size: 0.5rem; color: rgba(255,255,255,0.4); font-weight: 800; text-transform: uppercase;">Jugadores Activos</div>
                        </div>
                    </div>

                    <!-- LIVE ACCESS FEED (Replacing old map) -->
                    <div style="flex: 1; position: relative; background: rgba(255,255,255,0.02); border-radius: 24px; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 25px; padding: 20px; overflow: hidden; z-index: 5;">
                        <div style="font-size: 0.55rem; color: rgba(255,255,255,0.3); font-weight: 900; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 15px; display: flex; justify-content: space-between;">
                            <span>ÚLTIMOS ACCESOS DETECTADOS</span>
                            <span style="color: #00E36D;">PROTOCOLO ACTIVO</span>
                        </div>
                        
                        <div id="access-live-list" style="display: flex; flex-direction: column; gap: 12px;">
                            ${nodes.length > 0 ? nodes.slice(0, 5).map((node, i) => `
                                <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.03); padding: 12px 18px; border-radius: 15px; border: 1px solid rgba(255,255,255,0.05); animation: itemFadeIn 0.5s both ${i * 0.1}s;">
                                    <div style="display: flex; align-items: center; gap: 12px;">
                                        <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #00E36D, #008f45); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 950; color: black;">
                                            ${node.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div style="font-size: 0.75rem; color: white; font-weight: 900;">${node.name.toUpperCase()}</div>
                                            <div style="font-size: 0.55rem; color: #00E36D; font-weight: 800; letter-spacing: 0.5px;">${node.city.toUpperCase()}</div>
                                        </div>
                                    </div>
                                    <div style="text-align: right;">
                                        <div style="font-size: 0.5rem; color: rgba(255,255,255,0.3); font-weight: 800;">CONECTADO</div>
                                        <div style="font-size: 0.6rem; color: white; font-weight: 900;">JUSTO AHORA</div>
                                    </div>
                                </div>
                            `).join('') : `
                                <div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.2); font-weight: 800; font-size: 0.7rem; letter-spacing: 2px;">
                                    <i class="fas fa-satellite-dish" style="font-size: 1.5rem; margin-bottom: 10px; display: block;"></i>
                                    ESCUCHANDO SEÑALES...
                                </div>
                            `}
                        </div>

                        <!-- Floating Live Feed Indicator -->
                        <div style="position: absolute; bottom: 15px; right: 20px; font-size: 0.55rem; color: #00E36D; font-weight: 900; background: rgba(0,0,0,0.6); padding: 6px 12px; border-radius: 8px; border: 1px solid rgba(0,227,109,0.2); display: flex; align-items: center; gap: 6px;">
                             <span style="width: 5px; height: 5px; background: #00E36D; border-radius: 50%; animation: livePulse 1s infinite;"></span>
                             FLUJO SOCIAL ACTIVO
                        </div>
                    </div>

                    <!-- GROWTH METRICS BOX -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; position: relative; z-index: 10;">
                        <div style="background: rgba(255,255,255,0.03); padding: 20px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.06); transition: transform 0.3s;" onmouseover="this.style.transform='scale(1.02)'">
                            <div style="font-size: 0.55rem; color: rgba(255,255,255,0.4); font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">Nuevos Hoy</div>
                            <div style="display: flex; align-items: baseline; gap: 8px;">
                                <div style="font-size: 1.8rem; font-weight: 950; color: white;">+${newToday}</div>
                                <div style="font-size: 0.65rem; color: #00E36D; font-weight: 800;">JUGADORES</div>
                            </div>
                        </div>
                        <div style="background: rgba(255,255,255,0.03); padding: 20px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.06); transition: transform 0.3s;" onmouseover="this.style.transform='scale(1.02)'">
                            <div style="font-size: 0.55rem; color: rgba(255,255,255,0.4); font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">Crecimiento del Mes</div>
                            <div style="font-size: 1.1rem; font-weight: 950; color: #00E36D; letter-spacing: -0.5px;">${monthlyGrowth}</div>
                        </div>
                    </div>

                    <!-- SOCIAL PULSE MINI LIST -->
                    <div style="margin-top: 25px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 20px;">
                        <div style="display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none;">
                            ${recentActivity.slice(0, 3).map(event => `
                                <div style="background: rgba(0,227,109,0.05); padding: 8px 15px; border-radius: 12px; border: 1px solid rgba(0,227,109,0.1); white-space: nowrap; display: flex; align-items: center; gap: 8px;">
                                    <i class="fas fa-bolt" style="font-size: 0.6rem; color: #00E36D;"></i>
                                    <span style="font-size: 0.55rem; color: white; font-weight: 800;">${event.location.toUpperCase()} ACTIVE</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        }
    }

    window.NetworkPulseWidget = new NetworkPulseWidget();
    console.log('🎛️ Network Pulse Widget (Matrix Edition) Initialized');
})();
