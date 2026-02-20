/**
 * HeatmapWidget.js - PERFORMANCE & TALENT FLOW VISUALIZER 🗺️
 * Displays global competitiveness density using Big Data metrics.
 */

window.HeatmapWidget = {
    render(data = []) {
        return `
            <div class="glass-card-enterprise" style="
                background: linear-gradient(180deg, #09090b 0%, #000 100%);
                border-radius: 28px;
                padding: 24px;
                margin: 15px;
                border: 1px solid rgba(255,255,255,0.08);
                position: relative;
                overflow: hidden;
            ">
                <!-- Header -->
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px;">
                    <div>
                        <div style="font-size: 0.65rem; color: #CCFF00; font-weight: 950; letter-spacing: 2px; text-transform: uppercase;">
                            <i class="fas fa-satellite-dish"></i> TELEMETRY SOCIAL PULSE
                        </div>
                        <h3 style="color:white; font-size:1.4rem; font-weight:950; margin:5px 0 0 0; letter-spacing:-0.5px;">
                            MAPA DE <span style="color:#CCFF00;">TALENTO</span>
                        </h3>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size: 0.55rem; color: rgba(255,255,255,0.4); font-weight:900;">GLOBAL ELO DENSITY</div>
                        <div style="font-size: 0.9rem; color: #fff; font-weight:950;">REC: LIVE</div>
                    </div>
                </div>

                <!-- Heatmap Canvas Container -->
                <div style="
                    height: 200px; 
                    background: rgba(204, 255, 0, 0.03); 
                    border-radius: 20px; 
                    border: 1px solid rgba(204, 255, 0, 0.1); 
                    position: relative;
                    overflow: hidden;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">
                    <!-- Tech Grid Background -->
                    <div style="position: absolute; inset: 0; background-image: radial-gradient(rgba(204, 255, 0, 0.1) 1px, transparent 1px); background-size: 20px 20px; opacity: 0.3;"></div>

                    <!-- Animated Pulse Hotspots -->
                    ${this._renderHotspots(data)}

                    <div style="z-index:10; text-align:center;">
                        <img src="https://cdn-icons-png.flaticon.com/512/814/814420.png" style="width: 40px; opacity: 0.2; filter: invert(1);" />
                        <div style="color:rgba(255,255,255,0.3); font-size:0.6rem; font-weight:800; margin-top:10px;">GENERANDO MODELO PREDICTIVO...</div>
                    </div>
                </div>

                <!-- Footer Summary -->
                <div style="display:flex; gap:15px; margin-top:20px;">
                    <div style="flex:1; background:rgba(255,255,255,0.03); padding:12px; border-radius:15px;">
                        <div style="font-size:0.5rem; color:rgba(255,255,255,0.5); font-weight:900;">NIVEL MEDIO</div>
                        <div style="font-size:1.1rem; color:#CCFF00; font-weight:950;">3.85 <i class="fas fa-caret-up" style="font-size:0.7rem;"></i></div>
                    </div>
                    <div style="flex:1; background:rgba(255,255,255,0.03); padding:12px; border-radius:15px;">
                        <div style="font-size:0.5rem; color:rgba(255,255,255,0.5); font-weight:900;">ZONA CALIENTE</div>
                        <div style="font-size:0.9rem; color:#fff; font-weight:900;">EL PRAT (P3)</div>
                    </div>
                </div>
            </div>
            
            <style>
                @keyframes heatmapPulse {
                    0% { transform: scale(1); opacity: 0.5; box-shadow: 0 0 0 0 rgba(204, 255, 0, 0.4); }
                    70% { transform: scale(1.5); opacity: 0; box-shadow: 0 0 0 20px rgba(204, 255, 0, 0); }
                    100% { transform: scale(1); opacity: 0; }
                }
            </style>
        `;
    },

    _renderHotspots(data) {
        return data.map(point => `
            <div style="
                position: absolute; 
                left: ${point.x}%; 
                top: ${point.y}%; 
                width: 30px; 
                height: 30px; 
                background: radial-gradient(circle, rgba(204, 255, 0, ${point.intensity}) 0%, transparent 70%); 
                border-radius: 50%;
                z-index: 5;
            ">
                <div style="
                    width: 100%; 
                    height: 100%; 
                    border-radius: 50%; 
                    border: 2px solid #CCFF00; 
                    animation: heatmapPulse 2s infinite;
                "></div>
                <div style="position: absolute; white-space: nowrap; top: 35px; left: 50%; transform: translateX(-50%); font-size: 0.5rem; color: #CCFF00; font-weight: 950; text-shadow: 0 0 10px #000;">
                    ${point.venue.toUpperCase()} [ELO +${(point.intensity * 10).toFixed(1)}]
                </div>
            </div>
        `).join('');
    }
};
