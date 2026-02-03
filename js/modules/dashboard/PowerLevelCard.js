/**
 * PowerLevelCard.js
 * Visualización Premium del nivel competitivo del jugador.
 * Muestra el progreso, el último cambio y el rango actual.
 */
(function () {
    class PowerLevelCard {
        static render(user) {
            if (!user) return '';

            const level = parseFloat(user.level || 3.5).toFixed(2);
            const lastUpdate = user.lastLevelUpdate ? new Date(user.lastLevelUpdate).toLocaleDateString() : 'Sin datos';

            // Determinamos el color basado en el nivel (Degradado Pro)
            let color = '#CCFF00'; // Standard Padel Yellow
            let rankName = 'JUGADOR PRO';

            if (level >= 5.0) { rankName = 'ELITE MUNDIAL'; color = '#FFD700'; }
            else if (level >= 4.0) { rankName = 'COMPETICIÓN'; color = '#00E36D'; }
            else if (level >= 3.0) { rankName = 'AVANZADO'; color = '#0099FF'; }

            return `
                <div class="power-level-card fade-in" style="
                    background: linear-gradient(145deg, #0f172a 0%, #1e293b 100%);
                    border-radius: 28px;
                    padding: 25px;
                    margin: 2px 15px 12px !important;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    box-shadow: 0 20px 40px rgba(0,0,0,0.4);
                    position: relative;
                    overflow: hidden;
                    animation: floatUp 0.8s ease-out both;
                ">
                    <!-- Tech Background Elements -->
                    <div style="position: absolute; top: -10px; right: -10px; font-size: 6rem; color: ${color}; opacity: 0.03; font-weight: 900;">
                        ${level}
                    </div>
                    <div style="position: absolute; bottom: 0; left: 0; width: 100%; height: 2px; background: linear-gradient(90deg, transparent, ${color}, transparent); opacity: 0.3;"></div>

                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 20px;">
                        <div>
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
                                <div style="width: 8px; height: 8px; background: ${color}; border-radius: 50%; box-shadow: 0 0 10px ${color};"></div>
                                <span style="font-size: 0.65rem; font-weight: 900; letter-spacing: 1.5px; color: ${color}; text-transform: uppercase;">
                                    POWER LEVEL STATUS
                                </span>
                            </div>
                            <h2 style="font-family: 'Outfit'; font-weight: 900; font-size: 1.4rem; color: white; margin: 0; letter-spacing: -0.5px;">
                                ${rankName}
                            </h2>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 2.2rem; font-weight: 950; color: white; line-height: 1; font-family: 'Outfit';">
                                ${level}
                            </div>
                            <div style="font-size: 0.6rem; color: #64748b; font-weight: 800; margin-top: 4px;">PUNTUACIÓN ELO</div>
                        </div>
                    </div>

                    <div style="background: rgba(0,0,0,0.3); border-radius: 20px; padding: 15px; display: flex; align-items: center; gap: 15px;">
                        <div style="flex: 1;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                <span style="font-size: 0.65rem; color: #94a3b8; font-weight: 700;">PROGRESO NIVEL</span>
                                <span style="font-size: 0.65rem; color: white; font-weight: 900;">${Math.round((level % 1) * 100)}%</span>
                            </div>
                            <div style="height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden;">
                                <div style="height: 100%; width: ${(level % 1) * 100}%; background: ${color}; box-shadow: 0 0 10px ${color}; border-radius: 3px; transition: width 1s cubic-bezier(0.34, 1.56, 0.64, 1);"></div>
                            </div>
                        </div>
                        <button onclick="window.Router.navigate('ranking')" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.3s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'">
                            <i class="fas fa-chevron-right" style="font-size: 0.8rem;"></i>
                        </button>
                    </div>

                    <div style="display: flex; gap: 20px; margin-top: 20px; padding-left: 5px;">
                        <div>
                            <div style="font-size: 0.55rem; color: #64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">Último Ajuste</div>
                            <div style="font-size: 0.8rem; color: #00E36D; font-weight: 900;">+0.015 <i class="fas fa-caret-up"></i></div>
                        </div>
                        <div>
                            <div style="font-size: 0.55rem; color: #64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">Sincronizado</div>
                            <div style="font-size: 0.8rem; color: white; font-weight: 700; opacity: 0.8;">${lastUpdate}</div>
                        </div>
                        <div style="flex: 1; text-align: right; display: flex; align-items: flex-end; justify-content: flex-end;">
                           <div style="font-size: 0.55rem; color: #64748b; font-weight: 900; background: rgba(255,255,255,0.05); padding: 4px 8px; border-radius: 6px;">COMPETITIVE READY</div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    window.PowerLevelCard = PowerLevelCard;
    console.log('⚡ PowerLevelCard Component Loaded');
})();
