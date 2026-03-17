/**
 * MatchRadarAIWidgets.js
 * Advanced AI & Big Data Visualization for SomosPadel
 */
(function () {
    class MatchRadarAIWidgets {
        constructor() {}

        renderHeatmap() {
            const hours = ['09:00', '11:00', '13:00', '15:00', '17:00', '19:00', '21:00'];
            const days = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
            
            // Simulación de Big Data: Densidad de jugadores y probabilidad de éxito
            const data = days.map(() => hours.map(() => Math.floor(Math.random() * 100)));

            return `
                <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(204, 255, 0, 0.15); border-radius: 28px; padding: 25px; margin-bottom: 25px; position: relative; overflow: hidden; box-shadow: 0 15px 40px rgba(0,0,0,0.4);">
                    <!-- Title & Header -->
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="width: 36px; height: 36px; background: #CCFF00; color: #000; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1rem; box-shadow: 0 0 15px rgba(204,255,0,0.3);">
                                <i class="fas fa-layer-group"></i>
                            </div>
                            <div>
                                <h3 style="margin: 0; font-size: 0.85rem; font-weight: 950; letter-spacing: 1px; color: #fff; text-transform: uppercase;">AI HEATMAP</h3>
                                <p style="margin: 0; font-size: 0.6rem; color: #CCFF00; font-weight: 800;">BIG DATA DISPONIBILIDAD</p>
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <span style="font-size: 0.65rem; background: rgba(0,227,109,0.15); color: #00E36D; padding: 5px 12px; border-radius: 20px; font-weight: 950; border: 1px solid rgba(0,227,109,0.3);">CALIDAD: ÓPTIMA</span>
                        </div>
                    </div>

                    <!-- Heatmap Grid -->
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                        <!-- Hours Label -->
                        <div style="display: grid; grid-template-columns: 30px repeat(7, 1fr); gap: 4px; margin-bottom: 8px;">
                            <div></div>
                            ${hours.map(h => `<div style="font-size: 0.5rem; font-weight: 900; color: #444; text-align: center;">${h}</div>`).join('')}
                        </div>

                        <!-- Days + Cells -->
                        ${days.map((day, dIdx) => `
                            <div style="display: grid; grid-template-columns: 30px repeat(7, 1fr); gap: 4px; align-items: center;">
                                <div style="font-size: 0.6rem; font-weight: 950; color: #888;">${day}</div>
                                ${data[dIdx].map(val => {
                                    const opacity = val / 100;
                                    const color = val > 80 ? '#CCFF00' : (val > 40 ? '#00E36D' : '#3b82f6');
                                    return `
                                        <div title="Probabilidad: ${val}%" style="
                                            aspect-ratio: 1; 
                                            background: ${color}; 
                                            opacity: ${0.2 + (opacity * 0.8)}; 
                                            border-radius: 4px;
                                            box-shadow: ${val > 80 ? '0 0 10px rgba(204,255,0,0.4)' : 'none'};
                                        "></div>
                                    `;
                                }).join('')}
                            </div>
                        `).join('')}
                    </div>

                    <!-- Legend -->
                    <div style="margin-top: 15px; display: flex; justify-content: flex-end; gap: 15px; font-size: 0.5rem; font-weight: 900; color: #64748b;">
                        <div style="display: flex; align-items: center; gap: 4px;">
                            <div style="width: 8px; height: 8px; background: #3b82f6; border-radius: 2px;"></div> BAJA
                        </div>
                        <div style="display: flex; align-items: center; gap: 4px;">
                            <div style="width: 8px; height: 8px; background: #00E36D; border-radius: 2px;"></div> MEDIA
                        </div>
                        <div style="display: flex; align-items: center; gap: 4px;">
                            <div style="width: 8px; height: 8px; background: #CCFF00; border-radius: 2px;"></div> ALTA
                        </div>
                    </div>
                </div>
            `;
        }
    }

    window.MatchRadarAIWidgets = new MatchRadarAIWidgets();
})();
