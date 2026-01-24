/**
 * SocialShareService.js
 * "Modo Creador" 📸 - Generador de activos virales para redes sociales.
 * Dependencia: html2canvas
 */
class SocialShareService {
    constructor() {
        this.templates = {
            cyberpunk: { name: 'Cyberpunk Neon', class: 'share-template-cyber' },
            clean: { name: 'Pro Clean', class: 'share-template-clean' },
            data: { name: 'Data Driven', class: 'share-template-data' }
        };
    }

    /**
     * Genera una imagen (Blob) a partir de un template y datos
     * @param {string} type - 'cyberpunk', 'clean', 'data'
     * @param {Object} data - { title, score, player1, player2, date, etc }
     */
    /**
     * Genera una imagen (Blob) a partir de un template y datos
     * @param {string} type - 'cyberpunk', 'clean', 'data'
     * @param {Object} data - { title, score, player1, player2, date, etc }
     */
    async generateImage(type, data) {
        if (typeof html2canvas === 'undefined') {
            throw new Error("html2canvas library not loaded");
        }

        // 1. Create hidden container
        const container = document.createElement('div');
        container.id = 'social-share-render-area';
        container.style.position = 'fixed';
        container.style.top = '-9999px';
        container.style.left = '-9999px';
        container.style.width = '1080px';
        container.style.height = '1920px';
        container.style.zIndex = '-1';
        document.body.appendChild(container);

        // 2. Render HTML
        const templateClass = this.templates[type]?.class || 'share-template-cyber';
        container.innerHTML = this._getHtmlForTemplate(type, templateClass, data);

        try {
            // 3. Convert to Canvas
            const canvas = await html2canvas(container, {
                useCORS: true,
                scale: 1,
                backgroundColor: null,
                logging: false,
                allowTaint: true // Allowed because we use Data URI now
            });

            document.body.removeChild(container);
            return canvas.toDataURL("image/png");
        } catch (err) {
            console.error("Error generating social image:", err);
            if (document.body.contains(container)) document.body.removeChild(container);
            throw err;
        }
    }

    _getLogoSvg() {
        // High-Quality Vertical Stacked SVG to avoid cropping
        const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
            <g>
                <!-- Ball Icon -->
                <circle cx="100" cy="70" r="50" fill="#ccff00" />
                <path d="M100 20 A50 50 0 0 1 100 120 M60 70 L140 70" stroke="#aacc00" stroke-width="3" fill="none" opacity="0.5"/>
                
                <!-- Text -->
                <text x="100" y="150" font-family="Arial, sans-serif" font-weight="900" font-size="28" fill="white" text-anchor="middle">SOMOSPADEL</text>
                <text x="100" y="175" font-family="Arial, sans-serif" font-weight="900" font-size="14" fill="#ccff00" text-anchor="middle" letter-spacing="4">BARCELONA</text>
            </g>
        </svg>`;
        return "data:image/svg+xml;base64," + btoa(svg);
    }

    _getHtmlForTemplate(type, cssClass, data) {
        // Common Styles
        const commonStyle = `
            width: 100%; height: 100%; 
            display: flex; flex-direction: column; 
            font-family: 'Outfit', sans-serif;
            box-sizing: border-box;
            background: #000; color: white;
            padding: 40px;
        `;

        if (type === 'cyberpunk') {
            return `
                <div style="${commonStyle} background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%); position:relative; overflow:hidden;">
                    <!-- Neon Glows -->
                    <div style="position:absolute; top:-200px; left:-200px; width:800px; height:800px; background:radial-gradient(circle, rgba(204,255,0,0.2) 0%, transparent 70%); border-radius:50%;"></div>
                    <div style="position:absolute; bottom:-100px; right:-100px; width:800px; height:800px; background:radial-gradient(circle, rgba(34,211,238,0.2) 0%, transparent 70%); border-radius:50%;"></div>
                    
                    <div style="flex:1; display:flex; flex-direction:column; justify-content:flex-start; align-items:center; z-index:2; text-align:center; padding-top: 60px;">
                        <!-- LOGO ON TOP (SVG) -->
                        <img src="${this._getLogoSvg()}" style="height:140px; margin-bottom: 30px; filter: drop-shadow(0 0 20px rgba(0,0,0,0.5));">

                        <h2 style="font-size:2.5rem; font-weight:800; letter-spacing:4px; margin-bottom:20px; color:rgba(255,255,255,0.7); text-transform:uppercase;">RESULTADO PARTIDO</h2>
                        
                        <div style="font-size:8rem; font-weight:900; color:#ccff00; text-shadow: 0 0 40px rgba(204,255,0,0.6); margin-bottom:50px; line-height:1; font-variant-numeric: tabular-nums;">
                            ${data.score || '0-0'}
                        </div>

                        <div style="display:flex; justify-content:center; gap:60px; width:100%; margin-bottom:60px;">
                            <div style="text-align:center;">
                                <div style="font-size:2.2rem; font-weight:700; color:white; margin-bottom:5px;">${data.player1 || 'JUGADOR 1'}</div>
                                <div style="font-size:1.5rem; color:#aaa;">&</div>
                                <div style="font-size:2.2rem; font-weight:700; color:white;">${data.partner1 || 'COMPAÑERO 1'}</div>
                            </div>
                            <div style="display:flex; align-items:center; font-size:3rem; color:#555; font-style:italic; font-weight:900;">VS</div>
                            <div style="text-align:center;">
                                <div style="font-size:2.2rem; font-weight:700; color:white; margin-bottom:5px;">${data.player2 || 'RIVAL 1'}</div>
                                <div style="font-size:1.5rem; color:#aaa;">&</div>
                                <div style="font-size:2.2rem; font-weight:700; color:white;">${data.partner2 || 'RIVAL 2'}</div>
                            </div>
                        </div>

                        <div style="background:rgba(255,255,255,0.1); padding:15px 30px; border-radius:50px; border:1px solid rgba(255,255,255,0.2); display:flex; gap:15px; align-items:center;">
                            <span style="font-size:1.2rem; color:#ccc;">📅 ${data.date || new Date().toLocaleDateString()}</span>
                            <span style="height:20px; width:1px; background:rgba(255,255,255,0.3);"></span>
                            <span style="font-size:1.2rem; color:#fff; font-weight:700;">📍 ${data.location || 'SomosPadel BCN'}</span>
                        </div>
                    </div>

                    <div style="position:absolute; bottom:60px; left:0; width:100%; text-align:center;">
                        <div style="font-size:1.5rem; color: #fff; font-weight: 700; letter-spacing: 1px; opacity: 0.9;">
                             <i class="fab fa-instagram"></i> @somospadelbarcelona_
                        </div>
                    </div>
                </div>
            `;
        }

        // Add other templates as needed...
        return `<div>Template ${type} not implemented</div>`;
    }
}

window.SocialShareService = new SocialShareService();
