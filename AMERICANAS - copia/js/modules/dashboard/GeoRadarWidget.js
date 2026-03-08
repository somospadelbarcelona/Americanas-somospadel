/**
 * GeoRadarWidget.js
 * Visual component for the Proximity Radar on the Dashboard.
 */

window.GeoRadarWidget = {
    render(data) {
        const { nearHq, hqName, distance } = data.proximity || { nearHq: false, distance: 0 };

        const statusColor = nearHq ? '#00E36D' : (distance < 2000 ? '#eab308' : 'rgba(255,255,255,0.2)');
        const statusText = nearHq ? `ESTÁS EN ${hqName}` : (distance < 1000 ? 'MUY CERCA' : 'BUSCANDO SEDE...');
        const iconColor = nearHq ? '#00E36D' : '#ffffff';
        const animation = nearHq ? 'pulse-green 2s infinite' : 'scanner 4s linear infinite';

        return `
            <style>
                @keyframes scanner {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes pulse-green {
                    0% { box-shadow: 0 0 0 0 rgba(0, 227, 109, 0.4); }
                    70% { box-shadow: 0 0 0 10px rgba(0, 227, 109, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(0, 227, 109, 0); }
                }
                .radar-circle {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    border: 1px solid ${statusColor};
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    background: rgba(0,0,0,0.2);
                    animation: ${animation};
                }
                .radar-dot {
                    width: 6px;
                    height: 6px;
                    background: ${statusColor};
                    border-radius: 50%;
                    position: absolute;
                    top: 5px;
                }
            </style>
            
            <div class="glass-card-enterprise animate-fade-in" style="padding: 15px; display: flex; align-items: center; gap: 15px; border-color: ${statusColor}80; background: rgba(255,255,255,0.95); box-shadow: 0 10px 25px rgba(0,0,0,0.1); border-radius: 20px; border: 1px solid ${statusColor}40;">
                <div class="radar-circle" style="background: rgba(0,0,0,0.05); border-color: ${statusColor};">
                    <div class="radar-dot" style="background: ${statusColor};"></div>
                    <i class="fas fa-location-crosshairs" style="color: ${nearHq ? '#00E36D' : '#000000'}; font-size: 0.9rem; transform: rotate(0deg) !important; animation: none;"></i>
                </div>
                
                <div style="flex: 1;">
                    <div style="font-size: 0.65rem; font-weight: 800; color: rgba(0,0,0,0.5); letter-spacing: 1px; text-transform: uppercase;">
                        Radar de Proximidad
                    </div>
                    <div style="font-size: 0.85rem; font-weight: 900; color: ${nearHq ? '#00E36D' : '#000000'}; margin-top: 2px;">
                        ${statusText}
                    </div>
                    <div style="font-size: 0.7rem; color: rgba(0,0,0,0.7); font-weight: 600; margin-top: 2px;">
                        ${nearHq ? 'Check-in automático activado' : `Distancia: ${(distance / 1000).toFixed(1)} km`}
                    </div>
                </div>
                
                ${nearHq ? `
                    <div style="background: rgba(0, 227, 109, 0.1); padding: 8px; border-radius: 10px; border: 1px solid rgba(0, 227, 109, 0.2);">
                        <i class="fas fa-check-circle" style="color: #00E36D;"></i>
                    </div>
                ` : ''}
            </div>
        `;
    }
};
