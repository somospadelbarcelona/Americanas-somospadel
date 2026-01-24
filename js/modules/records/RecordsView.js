/**
 * RecordsView.js
 * "Hall of Fame" UI 🏆
 * VIBRANT SHOWTIME EDITION - Lighter & More Colorful
 */
(function () {
    class RecordsView {
        render() {
            const container = document.getElementById('content-area');
            const records = window.RecordsController ? window.RecordsController.getRecords() : {};

            // If empty, trigger calculation (first load)
            if (!records.streak && window.RecordsController) {
                container.innerHTML = `<div style="padding:100px; text-align:center; color:white;">
                    <i class="fas fa-bolt fa-spin" style="color: #FFD700; font-size: 4rem; filter: drop-shadow(0 0 20px #FFD700);"></i><br><br>
                    <span style="font-family:'Outfit'; text-transform:uppercase; letter-spacing:2px; font-weight:900;">Invocando Leyendas...</span>
                </div>`;
                window.RecordsController.init();
                return;
            }

            container.innerHTML = `
                <div class="records-wrapper" style="background: #080808; min-height: 100vh; padding-bottom: 200px; font-family: 'Outfit', sans-serif; color: white; overflow-x: hidden;">
                    
                    <!-- HERO HEADER -->
                    <div style="background: radial-gradient(circle at center, #2a2a2a 0%, #000 100%); padding: 60px 24px; text-align: center; border-bottom: 1px solid #333; position: relative; overflow: hidden;">
                        <div class="hero-glow"></div>
                        
                        <h1 class="fame-title">
                            SALÓN DE LA FAMA
                        </h1>
                        <p style="color: #bbb; margin-top: 10px; font-size: 0.9rem; letter-spacing: 4px; text-transform: uppercase; font-weight: 700; position:relative; z-index:2;">
                            LEYENDAS DE SOMOSPADEL
                        </p>
                    </div>

                    <div style="padding: 30px 15px; display: grid; gap: 30px;">
                        ${this.renderRecordCard(records.streak, "Victorias seguidas", null, 1)}
                        ${this.renderRecordCard(records.sniper, "% Win Rate", (v) => (v ? v.toFixed(1) + '%' : '0%'), 2)}
                        ${this.renderRecordCard(records.matches, "Partidos Oficiales", null, 3)}
                        ${this.renderRecordCard(records.power, "Marcador Histórico", (v) => v || '0-0', 4)}
                        ${this.renderRecordCard(records.fanatic, "Nivel de Actividad", null, 5)}
                    </div>
                </div>

                <style>
                    /* ANIMATIONS */
                    @keyframes slideUpFade {
                        from { opacity: 0; transform: translateY(40px) scale(0.95); }
                        to { opacity: 1; transform: translateY(0) scale(1); }
                    }

                    @keyframes neonTitle {
                        0% { text-shadow: 0 0 10px #FFD700, 0 0 20px #FFD700; }
                        50% { text-shadow: 0 0 30px #FFD700, 0 0 50px #ff5500; }
                        100% { text-shadow: 0 0 10px #FFD700, 0 0 20px #FFD700; }
                    }

                    @keyframes iconFloat {
                        0% { transform: translateY(0) rotate(0deg); opacity: 0.15; }
                        50% { transform: translateY(-10px) rotate(5deg); opacity: 0.25; }
                        100% { transform: translateY(0) rotate(0deg); opacity: 0.15; }
                    }

                    /* CLASSES */
                    .fame-title {
                        font-family: 'Montserrat', sans-serif; 
                        font-weight: 950; 
                        font-size: 3rem; 
                        text-transform: uppercase; 
                        color: #fff; 
                        margin: 0; 
                        letter-spacing: -2px; 
                        animation: neonTitle 3s infinite alternate;
                        position: relative;
                        z-index: 2;
                    }

                    .hero-glow {
                        position: absolute;
                        top: -50%; left: -50%; width: 200%; height: 200%;
                        background: radial-gradient(circle, rgba(255,215,0,0.1) 0%, transparent 60%);
                        animation: rotate 20s linear infinite;
                        pointer-events: none;
                    }

                    .record-card-wow {
                        border-radius: 28px; 
                        padding: 25px; 
                        position: relative; 
                        overflow: hidden; 
                        transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
                        /* Lighter Border */
                        border-top: 1px solid rgba(255,255,255,0.25);
                        border-left: 1px solid rgba(255,255,255,0.15);
                        border-right: 1px solid rgba(255,255,255,0.05);
                        border-bottom: 1px solid rgba(0,0,0,0.5);
                        
                        animation: slideUpFade 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
                        opacity: 0; /* Starts hidden for animation */
                    }
                    
                    .record-card-wow:hover {
                        transform: translateY(-5px) scale(1.02);
                        z-index: 10;
                        /* Brighten on hover */
                        filter: brightness(1.2);
                    }
                    
                    .neon-name {
                        font-weight: 950; 
                        text-transform: uppercase; 
                        font-size: 1.6rem; 
                        letter-spacing: -1px;
                        margin-bottom: 5px;
                        line-height: 1.1;
                    }

                    .deep-analysis-box {
                        max-height: 0;
                        overflow: hidden;
                        transition: max-height 0.4s ease-out;
                        background: rgba(0,0,0,0.2);
                        border-radius: 12px;
                        margin-top: 15px;
                    }
                    .deep-analysis-box.open {
                        max-height: 400px;
                        padding: 15px;
                        border: 1px solid rgba(255,255,255,0.1);
                    }

                    .action-btn {
                         background: rgba(255,255,255,0.15); 
                         border: 1px solid rgba(255,255,255,0.3); 
                         color: white; 
                         padding: 8px 16px; 
                         border-radius: 20px; 
                         font-size: 0.7rem; 
                         cursor: pointer; 
                         display: flex; 
                         align-items: center; 
                         gap: 6px; 
                         transition: all 0.2s;
                         font-weight: 700;
                         text-transform: uppercase;
                         letter-spacing: 1px;
                         box-shadow: 0 4px 10px rgba(0,0,0,0.2);
                    }
                    .action-btn:hover {
                        background: white;
                        color: black;
                        transform: scale(1.05);
                        box-shadow: 0 6px 15px rgba(255,255,255,0.3);
                    }
                </style>
            `;
        }

        renderRecordCard(record, suffixLabel, valueFormatter, index) {
            if (!record) return '';

            // Define RGB for dynamic shadows
            let rgb = '160, 160, 160'; // Default Lighter Grey
            if (record.color === '#FFD700') rgb = '255, 215, 0'; // Gold
            if (record.color === '#3b82f6') rgb = '59, 130, 246'; // Blue
            if (record.color === '#ef4444') rgb = '239, 68, 68'; // Red
            if (record.color === '#8b5cf6') rgb = '139, 92, 246'; // Purple
            if (record.color === '#10b981') rgb = '16, 185, 129'; // Green

            const color = record.color || '#888';
            let value = valueFormatter ? valueFormatter(record.wr || record.score || record.count) : (record.count || 0);

            const isUnknown = !record.name || record.name === 'Jugador' || record.name === 'Anónimo' || value === 0 || value === '0%' || value === '0-0';
            const displayName = isUnknown ? 'VACANTE' : record.name;
            const displayValue = isUnknown ? '--' : value;

            // DYNAMIC BACKGROUND - MUCH LIGHTER & VIBRANT
            // Starts with solid color tint 30% -> dark grey (not black)
            const bgGradient = isUnknown
                ? `linear-gradient(135deg, #2a2a2a, #151515)` // Lighter Grey for unknown
                : `linear-gradient(135deg, rgba(${rgb}, 0.35) 0%, rgba(30,30,30,1) 100%)`; // Lighter color mix

            const borderColor = isUnknown ? '#444' : color;
            // Stronger inner glow
            const shadowStyle = isUnknown ? '' : `box-shadow: 0 20px 50px rgba(0,0,0,0.5), inset 0 0 30px rgba(${rgb}, 0.1);`;

            const id = 'rec-' + Math.random().toString(36).substr(2, 9);
            const delay = index * 0.1;

            return `
                <div class="record-card-wow" style="background: ${bgGradient}; border-left: 4px solid ${borderColor}; ${shadowStyle} animation-delay: ${delay}s; --card-rgb: ${rgb};">
                    
                    <!-- Floating Big Icon -->
                    <div style="position: absolute; right: -25px; top: -25px; font-size: 9rem; opacity: 0.15; color: ${color}; pointer-events: none; animation: iconFloat 6s ease-in-out infinite;">
                        ${record.icon}
                    </div>
                    
                    <div style="display: flex; gap: 20px; align-items: flex-start; position: relative; z-index: 2;">
                        
                        <!-- ICON BOX - Brighter -->
                        <div style="width: 65px; height: 65px; background: rgba(${rgb}, 0.25); border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 2.2rem; border: 1px solid rgba(${rgb}, 0.5); flex-shrink:0; box-shadow: 0 0 30px rgba(${rgb}, 0.4); backdrop-filter: blur(5px);">
                            ${record.icon}
                        </div>

                        <div style="flex: 1;">
                            <!-- TITLE -->
                            <div style="color: ${color}; font-size: 0.75rem; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 6px; opacity: 0.9;">
                                ${record.title}
                            </div>
                            
                            <!-- NAME -->
                            <div class="neon-name" style="color: ${isUnknown ? '#666' : '#fff'}; text-shadow: ${isUnknown ? 'none' : `0 0 25px rgba(${rgb}, 0.9)`};">
                                ${displayName}
                            </div>

                            <!-- STAT PILL -->
                            <div style="font-size: 1.1rem; color: #fff; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.08); padding: 8px 14px; border-radius: 12px; width: fit-content; border: 1px solid rgba(255,255,255,0.1);">
                                <span style="font-size: 1.4rem; color: ${color}; text-shadow: 0 0 15px rgba(${rgb}, 0.6);">${displayValue}</span> 
                                <span style="color:#ccc; font-size:0.75rem; font-weight:700; text-transform: uppercase;">${suffixLabel}</span>
                            </div>
                            
                            <!-- DESC - Brighter Text -->
                            <div style="font-size: 0.85rem; color: rgba(255,255,255,0.85); line-height: 1.5; margin-bottom: 15px; font-weight: 500;">
                                ${record.desc}
                            </div>

                            <!-- BUTTON -->
                            ${!isUnknown ? `
                                <button onclick="document.getElementById('${id}').classList.toggle('open'); this.innerHTML = this.innerHTML.includes('Mostrar') ? '<i class=\\'fas fa-chevron-up\\'></i> Ocultar' : '<i class=\\'fas fa-chart-line\\'></i> Ver Análisis'" class="action-btn">
                                    <i class="fas fa-chart-line"></i> Ver Análisis
                                </button>
                                <div id="${id}" class="deep-analysis-box">
                                    <div style="font-size: 0.8rem; color: #f0f0f0; line-height: 1.6; font-style: italic;">
                                        <i class="fas fa-quote-left" style="color: ${color}; margin-right: 8px;"></i>
                                        ${record.deepAnalysis}
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }
    }

    window.RecordsView = new RecordsView();
})();
