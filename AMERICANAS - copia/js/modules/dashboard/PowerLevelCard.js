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
            let glowColor = 'rgba(204, 255, 0, 0.2)';

            if (level >= 5.0) {
                rankName = 'ELITE MUNDIAL';
                color = '#FFD700';
                glowColor = 'rgba(255, 215, 0, 0.2)';
            } else if (level >= 4.0) {
                rankName = 'COMPETICIÓN';
                color = '#00E36D';
                glowColor = 'rgba(0, 227, 109, 0.2)';
            } else if (level >= 3.0) {
                rankName = 'AVANZADO';
                color = '#0099FF';
                glowColor = 'rgba(0, 153, 255, 0.2)';
            }

            return `
                <div class="power-level-card fade-in" style="
                    background: linear-gradient(135deg, #0a0f18 0%, #161e2e 100%);
                    border-radius: 32px;
                    padding: 28px;
                    margin: 5px 15px 15px !important;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    box-shadow: 0 25px 50px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.05);
                    position: relative;
                    overflow: hidden;
                    font-family: 'Outfit', sans-serif;
                ">
                    <!-- High-Tech Background Elements -->
                    <div style="position: absolute; top: -20px; right: -20px; font-size: 10rem; color: ${color}; opacity: 0.04; font-weight: 950; letter-spacing: -10px; pointer-events: none;">
                        ${level}
                    </div>
                    
                    <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(circle at 0% 0%, ${glowColor} 0%, transparent 60%); pointer-events: none;"></div>

                    <!-- Header Section -->
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;">
                        <div>
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                                <div style="width: 10px; height: 10px; background: ${color}; border-radius: 2px; box-shadow: 0 0 15px ${color}; animation: pulse 2s infinite;"></div>
                                <span style="font-size: 0.65rem; font-weight: 900; letter-spacing: 2px; color: #64748b; text-transform: uppercase;">
                                    POWER LEVEL STATUS
                                </span>
                            </div>
                            <h2 style="font-weight: 950; font-size: 1.8rem; color: white; margin: 0; letter-spacing: -1px; line-height: 1;">
                                ${rankName}
                            </h2>
                        </div>
                        <div style="text-align: right;">
                            <div style="
                                font-size: 2.8rem; 
                                font-weight: 950; 
                                color: white; 
                                line-height: 0.9;
                                letter-spacing: -2px;
                                background: linear-gradient(to bottom, #fff 0%, #aaa 100%);
                                -webkit-background-clip: text;
                                -webkit-text-fill-color: transparent;
                                filter: drop-shadow(0 0 10px rgba(255,255,255,0.1));
                            ">
                                ${level}
                            </div>
                            <div style="font-size: 0.6rem; color: #475569; font-weight: 900; margin-top: 6px; letter-spacing: 1px;">PUNTUACIÓN ELO</div>
                        </div>
                    </div>

                    <!-- Progress Bar (Glassmorphic) -->
                    <div style="
                        background: rgba(0,0,0,0.4); 
                        border: 1px solid rgba(255,255,255,0.03);
                        border-radius: 24px; 
                        padding: 18px; 
                        display: flex; 
                        align-items: center; 
                        gap: 15px;
                        margin-bottom: 24px;
                        box-shadow: 0 10px 20px rgba(0,0,0,0.2);
                    ">
                        <div style="flex: 1;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 10px; align-items: flex-end;">
                                <span style="font-size: 0.65rem; color: #64748b; font-weight: 800; letter-spacing: 0.5px;">PROGRESO NIVEL</span>
                                <span style="font-size: 0.9rem; color: white; font-weight: 950; line-height: 1;">${Math.round((level % 1) * 100)}<span style="font-size: 0.6rem; color: #444;">%</span></span>
                            </div>
                            <div style="height: 8px; background: #000; border-radius: 4px; overflow: hidden; padding: 1px;">
                                <div style="
                                    height: 100%; 
                                    width: ${(level % 1) * 100}%; 
                                    background: linear-gradient(90deg, ${color} 0%, white 100%); 
                                    box-shadow: 0 0 20px ${color}55; 
                                    border-radius: 4px; 
                                    transition: width 1.5s cubic-bezier(0.34, 1.56, 0.64, 1);
                                "></div>
                            </div>
                        </div>
                        <button onclick="window.Router.navigate('ranking')" style="
                            background: rgba(255,255,255,0.05); 
                            border: 1px solid rgba(255,255,255,0.1); 
                            color: white; 
                            width: 44px; 
                            height: 44px; 
                            border-radius: 14px; 
                            display: flex; 
                            align-items: center; 
                            justify-content: center; 
                            cursor: pointer; 
                            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                        " onmouseover="this.style.transform='scale(1.1)'; this.style.background='rgba(255,255,255,0.1)';" onmouseout="this.style.transform='scale(1)'; this.style.background='rgba(255,255,255,0.05)';">
                            <i class="fas fa-chevron-right" style="font-size: 0.9rem;"></i>
                        </button>
                    </div>

                    <!-- Details Section -->
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0 4px;">
                        <div style="display: flex; gap: 24px;">
                            <div>
                                <div style="font-size: 0.55rem; color: #475569; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">ÚLTIMO AJUSTE</div>
                                <div style="font-size: 0.95rem; color: #00E36D; font-weight: 950; display: flex; align-items: center; gap: 4px;">
                                    +0.015 <i class="fas fa-caret-up" style="font-size: 0.7rem;"></i>
                                </div>
                            </div>
                            <div>
                                <div style="font-size: 0.55rem; color: #475569; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">SINCRONIZADO</div>
                                <div style="font-size: 0.85rem; color: rgba(255,255,255,0.7); font-weight: 800;">${lastUpdate}</div>
                            </div>
                        </div>
                        
                        <div style="
                            font-size: 0.55rem; 
                            color: ${color}; 
                            font-weight: 950; 
                            background: rgba(255,255,255,0.03); 
                            border: 1px solid rgba(255,255,255,0.05);
                            padding: 6px 12px; 
                            border-radius: 8px;
                            letter-spacing: 1px;
                            box-shadow: 0 0 15px ${glowColor};
                        ">
                            COMPETITIVE READY
                        </div>
                    </div>
                </div>
            `;
        }
    }

    window.PowerLevelCard = PowerLevelCard;
    console.log('⚡ PowerLevelCard Component Loaded');
})();
