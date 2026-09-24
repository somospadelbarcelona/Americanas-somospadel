/**
 * 🎴 PadelFutCard.js — Cartas FIFA Ultimate Team de Pádel & Stories de Victoria
 * Renderiza tarjetas coleccionables estilo Ultimate Team adaptadas al pádel
 * y genera Stories 9:16 (1080x1920) en HTML5 Canvas para Instagram y WhatsApp.
 * SomosPadel BCN — 2026
 */
(function () {
    'use strict';

    const PadelFutCard = {
        /**
         * Calcula o completa los datos del jugador para su carta FUT
         * @param {Object} rawData 
         * @returns {Object} FutData completada
         */
        calculateCardData(rawData = {}) {
            rawData = rawData || {};
            const user = rawData.user || rawData || {};
            const stats = rawData.stats || (typeof window !== 'undefined' && window.Store && window.Store.getState('playerStats')?.stats) || {};

            const name = (user.name || user.displayName || 'Jugador SomosPadel').trim();
            const level = parseFloat(user.level || user.nivel || 3.5) || 3.5;
            const photoUrl = user.photo_url || user.photoURL || user.avatar || 'img/logo_somospadel.png';
            
            // Posición: Drive (DRV), Revés (REV) o Polivalente (POL)
            let posRaw = String(user.position || user.preferred_side || user.posicion || 'drive').toLowerCase();
            let position = 'DRV';
            if (posRaw.includes('rev') || posRaw.includes('izq') || posRaw.includes('left')) {
                position = 'REV';
            } else if (posRaw.includes('poli') || posRaw.includes('ambos')) {
                position = 'POL';
            }

            // Win rate
            const matchesCount = stats.matches || (stats.won || 0) + (stats.lost || 0) || user.matches_played || user.total_matches || 10;
            const winsCount = stats.won !== undefined ? stats.won : (user.wins || Math.round(matchesCount * 0.55));
            const winRate = stats.winRate !== undefined ? stats.winRate : (user.win_rate !== undefined ? user.win_rate : Math.round((winsCount / Math.max(1, matchesCount)) * 100));

            // Cálculo del OVR (Overall Rating entre 60 y 99)
            // Nivel 2.0 = 62, 3.0 = 74, 4.0 = 85, 5.0 = 93, 6.0 = 98
            const baseOvrFromLevel = Math.round(42 + (level * 10.2));
            const wrBonus = Math.round((winRate - 50) * 0.12);
            let ovr = Math.min(99, Math.max(60, baseOvrFromLevel + wrBonus));

            // Rareza de carta según OVR
            let cardTier = 'GOLD';
            let tierColor = '#FFD700';
            let tierBorder = 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #CCFF00 100%)';
            let glowColor = 'rgba(255, 215, 0, 0.4)';

            if (ovr >= 91) {
                cardTier = 'ICON';
                tierColor = '#00E5FF';
                tierBorder = 'linear-gradient(135deg, #00E5FF 0%, #CCFF00 50%, #FF0055 100%)';
                glowColor = 'rgba(0, 229, 255, 0.5)';
            } else if (ovr >= 83) {
                cardTier = 'GOLD PRO';
                tierColor = '#CCFF00';
                tierBorder = 'linear-gradient(135deg, #CCFF00 0%, #00E36D 100%)';
                glowColor = 'rgba(204, 255, 0, 0.4)';
            } else if (ovr < 75) {
                cardTier = 'SILVER';
                tierColor = '#C0C0C0';
                tierBorder = 'linear-gradient(135deg, #E2E8F0 0%, #94A3B8 100%)';
                glowColor = 'rgba(226, 232, 240, 0.3)';
            }

            // 6 Atributos Clave: REM, VOL, DEF, FIS, TAC, CLU
            // Ajuste orgánico según posición
            const seed = (name.length * 7 + Math.round(level * 10)) % 10;
            const variance = (offset) => Math.min(99, Math.max(50, Math.round(ovr + ((seed + offset) % 9) - 4)));

            let rem = variance(1); // Remate / Smash
            let vol = variance(3); // Volea / Red
            let def = variance(5); // Defensa / Pared
            let fis = variance(7); // Físico / Resistencia
            let tac = variance(2); // Táctica / Colocación
            let clu = variance(4); // Clutch / Puntos de Oro

            if (position === 'REV') {
                rem = Math.min(99, rem + 4);
                vol = Math.min(99, vol + 3);
                def = Math.max(55, def - 2);
            } else if (position === 'DRV') {
                def = Math.min(99, def + 4);
                tac = Math.min(99, tac + 3);
                rem = Math.max(55, rem - 2);
            } else {
                tac = Math.min(99, tac + 2);
                clu = Math.min(99, clu + 2);
            }

            return {
                name: name.toUpperCase(),
                level: level.toFixed(2),
                ovr,
                position,
                photoUrl,
                winRate,
                matchesCount,
                cardTier,
                tierColor,
                tierBorder,
                glowColor,
                attributes: {
                    REM: rem,
                    VOL: vol,
                    DEF: def,
                    FIS: fis,
                    TAC: tac,
                    CLU: clu
                },
                bestResult: rawData.bestResult || 'Pista 1 SomosPadel',
                matchScore: rawData.matchScore || (rawData.matches && rawData.matches[0]?.score) || null
            };
        },

        /**
         * Abre el modal interactivo con la carta FUT y opciones para compartir Story
         * @param {Object} playerData 
         */
        open(playerData = {}) {
            playerData = playerData || {};
            const data = this.calculateCardData(playerData);
            this.currentData = data;

            // Eliminar modal previo si existe
            const existing = document.getElementById('padel-fut-card-modal');
            if (existing) existing.remove();

            const modal = document.createElement('div');
            modal.id = 'padel-fut-card-modal';
            modal.style.cssText = `
                position: fixed; inset: 0; z-index: 99999;
                background: rgba(5, 7, 12, 0.94); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                font-family: 'Outfit', sans-serif; padding: 20px; overflow-y: auto;
            `;

            modal.innerHTML = `
                <div style="width: 100%; max-width: 420px; position: relative; display: flex; flex-direction: column; align-items: center;">
                    
                    <!-- Close button -->
                    <button onclick="document.getElementById('padel-fut-card-modal').remove()" 
                        style="position: absolute; top: -45px; right: 0; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); 
                               color: white; width: 38px; height: 38px; border-radius: 50%; cursor: pointer; 
                               font-size: 1.1rem; display: flex; align-items: center; justify-content: center;">
                        ✕
                    </button>

                    <div style="text-align: center; margin-bottom: 12px;">
                        <span style="color: #CCFF00; font-size: 0.65rem; font-weight: 950; letter-spacing: 3px; text-transform: uppercase;">
                            CARTA OFICIAL SOMOSPADEL BCN
                        </span>
                        <h2 style="color: #fff; margin: 2px 0 0 0; font-size: 1.2rem; font-weight: 900;">ULTIMATE TEAM PÁDEL</h2>
                    </div>

                    <!-- THE 3D FUT CARD -->
                    <div id="padel-fut-card-element" style="
                        width: min(330px, calc(100vw - 32px)); max-width: 100%; height: auto; aspect-ratio: 330/490; max-height: 80vh;
                        background: linear-gradient(160deg, #111422 0%, #07090e 60%, #151a0b 100%);
                        border-radius: 28px;
                        position: relative;
                        padding: 3px;
                        box-shadow: 0 20px 60px ${data.glowColor}, 0 0 30px rgba(0,0,0,0.9);
                        transition: transform 0.3s ease;
                        overflow: hidden;
                    ">
                        <!-- Holographic border shine -->
                        <div style="position: absolute; inset: 0; border-radius: 28px; padding: 2.5px; background: ${data.tierBorder}; -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none;"></div>

                        <!-- Card Inner Body -->
                        <div style="width: 100%; height: 100%; background: radial-gradient(circle at 50% 20%, rgba(204,255,0,0.06) 0%, #090c14 80%); border-radius: 25px; position: relative; padding: 20px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden;">
                            
                            <!-- Hexagon / Carbon Pattern overlay -->
                            <div style="position: absolute; inset: 0; opacity: 0.05; background-image: radial-gradient(#CCFF00 1px, transparent 1px); background-size: 16px 16px; pointer-events: none;"></div>
                            
                            <!-- Top Left: OVR, Position, Club Badge & Flag -->
                            <div style="position: absolute; top: 22px; left: 24px; display: flex; flex-direction: column; align-items: center; z-index: 5;">
                                <div style="font-size: 2.5rem; font-weight: 950; color: ${data.tierColor}; line-height: 0.9; text-shadow: 0 0 15px ${data.glowColor}; font-variant-numeric: tabular-nums;">
                                    ${data.ovr}
                                </div>
                                <div style="font-size: 0.95rem; font-weight: 900; color: #fff; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px;">
                                    ${data.position}
                                </div>
                                <div style="width: 24px; height: 2px; background: ${data.tierColor}; margin: 6px 0; border-radius: 2px;"></div>
                                <!-- Escudo SomosPadel -->
                                <div style="width: 28px; height: 28px; border-radius: 50%; background: #CCFF00; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; box-shadow: 0 2px 8px rgba(204,255,0,0.3); margin-bottom: 4px;" title="SomosPadel BCN">
                                    🎾
                                </div>
                                <span style="font-size: 0.75rem;">🇪🇸</span>
                            </div>

                            <!-- Top Center / Right: Player Photo -->
                            <div style="width: 100%; height: 220px; display: flex; justify-content: flex-end; align-items: center; position: relative; z-index: 2; margin-top: 5px;">
                                <div style="width: 195px; height: 210px; border-radius: 24px; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 80%);">
                                    <img src="${data.photoUrl}" alt="${data.name}" 
                                         onerror="this.src='img/logo_somospadel.png'"
                                         style="width: 100%; height: 100%; object-fit: cover; border-radius: 20px; filter: drop-shadow(0 10px 15px rgba(0,0,0,0.8));">
                                </div>
                            </div>

                            <!-- Center: Player Name & Badge -->
                            <div style="text-align: center; position: relative; z-index: 5; margin-top: 5px; border-bottom: 1.5px solid rgba(255,255,255,0.12); padding-bottom: 8px;">
                                <div style="font-size: 1.4rem; font-weight: 950; color: #ffffff; text-transform: uppercase; letter-spacing: 1px; line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-shadow: 0 2px 10px rgba(0,0,0,0.8);">
                                    ${data.name}
                                </div>
                                <div style="display: flex; justify-content: center; align-items: center; gap: 8px; margin-top: 4px;">
                                    <span style="background: rgba(255,255,255,0.06); color: ${data.tierColor}; border: 1px solid ${data.tierColor}44; padding: 2px 8px; border-radius: 10px; font-size: 0.55rem; font-weight: 900; letter-spacing: 1px;">
                                        ${data.cardTier}
                                    </span>
                                    <span style="color: #94a3b8; font-size: 0.6rem; font-weight: 800;">
                                        LVL ${data.level} • WR ${data.winRate}%
                                    </span>
                                </div>
                            </div>

                            <!-- Bottom: 6 FUT Attributes (2 columns) -->
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; padding: 10px 12px; background: rgba(0,0,0,0.3); border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); position: relative; z-index: 5;">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <span style="font-size: 1rem; font-weight: 950; color: #fff;">${data.attributes.REM}</span>
                                    <span style="font-size: 0.72rem; font-weight: 800; color: #94a3b8; letter-spacing: 0.5px;">REM</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <span style="font-size: 1rem; font-weight: 950; color: #fff;">${data.attributes.FIS}</span>
                                    <span style="font-size: 0.72rem; font-weight: 800; color: #94a3b8; letter-spacing: 0.5px;">FIS</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <span style="font-size: 1rem; font-weight: 950; color: #fff;">${data.attributes.VOL}</span>
                                    <span style="font-size: 0.72rem; font-weight: 800; color: #94a3b8; letter-spacing: 0.5px;">VOL</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <span style="font-size: 1rem; font-weight: 950; color: #fff;">${data.attributes.TAC}</span>
                                    <span style="font-size: 0.72rem; font-weight: 800; color: #94a3b8; letter-spacing: 0.5px;">TAC</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <span style="font-size: 1rem; font-weight: 950; color: #fff;">${data.attributes.DEF}</span>
                                    <span style="font-size: 0.72rem; font-weight: 800; color: #94a3b8; letter-spacing: 0.5px;">DEF</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <span style="font-size: 1rem; font-weight: 950; color: ${data.tierColor};">${data.attributes.CLU}</span>
                                    <span style="font-size: 0.72rem; font-weight: 800; color: #94a3b8; letter-spacing: 0.5px;">CLU</span>
                                </div>
                            </div>

                            <!-- Official Footer mark -->
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px; padding: 0 4px; font-size: 0.45rem; font-weight: 900; color: rgba(255,255,255,0.25); text-transform: uppercase; letter-spacing: 1px;">
                                <span>SOMOSPADEL.APP</span>
                                <span>★ OFFICIAL CARD</span>
                            </div>

                        </div>
                    </div>

                    <!-- ACTION BUTTONS: STORY SHARING & DOWNLOAD -->
                    <div style="display: flex; flex-direction: column; width: 100%; max-width: 330px; gap: 10px; margin-top: 20px;">
                        <button id="fut-share-story-btn" onclick="window.PadelFutCard.generateAndShareStory()" style="
                            background: #CCFF00; border: none; color: #000;
                            padding: 14px; border-radius: 16px; font-weight: 950; font-size: 0.85rem;
                            text-transform: uppercase; letter-spacing: 1px; cursor: pointer;
                            display: flex; align-items: center; justify-content: center; gap: 10px;
                            box-shadow: 0 4px 20px rgba(204,255,0,0.3); transition: transform 0.2s;
                        ">
                            <span>📲</span> COMPARTIR EN STORY (9:16)
                        </button>

                        <div style="display: flex; gap: 10px;">
                            <button onclick="window.PadelFutCard.downloadStoryPNG()" style="
                                flex: 1; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.18);
                                color: #fff; padding: 12px; border-radius: 14px; font-weight: 900; font-size: 0.75rem;
                                text-transform: uppercase; letter-spacing: 0.5px; cursor: pointer;
                                display: flex; align-items: center; justify-content: center; gap: 6px;
                            ">
                                <span>⬇️</span> Guardar Story
                            </button>
                            <button onclick="document.getElementById('padel-fut-card-modal').remove()" style="
                                flex: 1; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);
                                color: #94a3b8; padding: 12px; border-radius: 14px; font-weight: 800; font-size: 0.75rem;
                                text-transform: uppercase; cursor: pointer;
                            ">
                                Cerrar
                            </button>
                        </div>
                    </div>

                </div>
            `;

            document.body.appendChild(modal);
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.remove();
            });
        },

        /**
         * Renderiza la Story en un Canvas nativo 9:16 (1080x1920)
         * @returns {Promise<HTMLCanvasElement>}
         */
        async renderStoryCanvas(data = this.currentData) {
            data = data || this.currentData || this.calculateCardData();
            const canvas = document.createElement('canvas');
            canvas.width = 1080;
            canvas.height = 1920;
            const ctx = canvas.getContext('2d');

            // 1. Fondo Degradado Neón Sombre
            const bgGrad = ctx.createRadialGradient(540, 700, 100, 540, 960, 1100);
            bgGrad.addColorStop(0, '#151d2f');
            bgGrad.addColorStop(0.5, '#090c15');
            bgGrad.addColorStop(1, '#040508');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, 1080, 1920);

            // 2. Líneas Decorativas de Pista de Pádel en el fondo
            ctx.save();
            ctx.strokeStyle = 'rgba(204, 255, 0, 0.05)';
            ctx.lineWidth = 4;
            // Pista perimetral
            ctx.strokeRect(100, 180, 880, 1560);
            // Línea de saque y red
            ctx.beginPath();
            ctx.moveTo(100, 960);
            ctx.lineTo(980, 960);
            ctx.moveTo(540, 480);
            ctx.lineTo(540, 1440);
            ctx.stroke();
            ctx.restore();

            // 3. Glow Neón en el centro
            const glow = ctx.createRadialGradient(540, 860, 10, 540, 860, 500);
            glow.addColorStop(0, 'rgba(204, 255, 0, 0.15)');
            glow.addColorStop(0.6, 'rgba(0, 229, 255, 0.05)');
            glow.addColorStop(1, 'transparent');
            ctx.fillStyle = glow;
            ctx.fillRect(0, 300, 1080, 1200);

            // 4. Header de la Story
            ctx.save();
            ctx.textAlign = 'center';

            // Tag SomosPadel
            ctx.fillStyle = '#CCFF00';
            ctx.font = '900 36px "Outfit", sans-serif';
            ctx.letterSpacing = '8px';
            ctx.fillText('SOMOSPADEL BCN', 540, 190);

            // Título Impacto
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '950 64px "Outfit", sans-serif';
            ctx.fillText('¡VICTORIA EN PISTA!', 540, 270);

            // Fecha
            const dateStr = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
            ctx.fillStyle = '#94A3B8';
            ctx.font = '800 28px "Outfit", sans-serif';
            ctx.fillText(dateStr, 540, 325);
            ctx.restore();

            // 5. CARTA FUT DIBUJADA EN CANVAS (Centrada: X=190, Y=390, W=700, H=1050)
            const cx = 190, cy = 390, cw = 700, ch = 1060, radius = 54;
            
            // Función auxiliar para esquinas redondeadas
            function roundRect(ctx, x, y, width, height, r) {
                ctx.beginPath();
                ctx.moveTo(x + r, y);
                ctx.lineTo(x + width - r, y);
                ctx.quadraticCurveTo(x + width, y, x + width, y + r);
                ctx.lineTo(x + width, y + height - r);
                ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
                ctx.lineTo(x + r, y + height);
                ctx.quadraticCurveTo(x, y + height, x, y + height - r);
                ctx.lineTo(x, y + r);
                ctx.quadraticCurveTo(x, y, x + r, y);
                ctx.closePath();
            }

            // Borde degradado carta
            ctx.save();
            const borderGrad = ctx.createLinearGradient(cx, cy, cx + cw, cy + ch);
            borderGrad.addColorStop(0, '#CCFF00');
            borderGrad.addColorStop(0.5, '#00E5FF');
            borderGrad.addColorStop(1, '#FF0055');
            ctx.strokeStyle = borderGrad;
            ctx.lineWidth = 10;
            ctx.shadowColor = 'rgba(204, 255, 0, 0.4)';
            ctx.shadowBlur = 40;
            roundRect(ctx, cx, cy, cw, ch, radius);
            ctx.stroke();

            // Fondo interior carta
            const cardInnerGrad = ctx.createLinearGradient(cx, cy, cx, cy + ch);
            cardInnerGrad.addColorStop(0, '#161c2d');
            cardInnerGrad.addColorStop(0.6, '#0d111d');
            cardInnerGrad.addColorStop(1, '#11190d');
            ctx.fillStyle = cardInnerGrad;
            ctx.fill();
            ctx.restore();

            // 6. OVR y Posición dentro de la carta
            ctx.save();
            ctx.textAlign = 'left';
            ctx.fillStyle = data.tierColor || '#CCFF00';
            ctx.font = '950 110px "Outfit", sans-serif';
            ctx.shadowColor = data.glowColor || 'rgba(204,255,0,0.5)';
            ctx.shadowBlur = 25;
            ctx.fillText(String(data.ovr), cx + 55, cy + 155);

            ctx.shadowBlur = 0;
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '900 40px "Outfit", sans-serif';
            ctx.fillText(data.position, cx + 60, cy + 215);

            // Línea separadora
            ctx.strokeStyle = data.tierColor || '#CCFF00';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(cx + 60, cy + 240);
            ctx.lineTo(cx + 120, cy + 240);
            ctx.stroke();

            // Logo pelota & bandera
            ctx.font = '34px sans-serif';
            ctx.fillText('🎾', cx + 60, cy + 295);
            ctx.fillText('🇪🇸', cx + 60, cy + 345);
            ctx.restore();

            // 7. Cargar y dibujar foto del jugador en la carta
            try {
                const img = await this._loadImage(data.photoUrl);
                ctx.save();
                const imgX = cx + 240, imgY = cy + 50, imgW = 410, imgH = 460, imgR = 40;
                roundRect(ctx, imgX, imgY, imgW, imgH, imgR);
                ctx.clip();
                ctx.drawImage(img, imgX, imgY, imgW, imgH);
                ctx.restore();
            } catch (e) {
                // Fallback si la imagen falla por CORS o ruta
                ctx.save();
                ctx.fillStyle = '#1e293b';
                roundRect(ctx, cx + 240, cy + 50, 410, 460, 40);
                ctx.fill();
                ctx.fillStyle = '#CCFF00';
                ctx.font = '950 120px "Outfit", sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(data.name.substring(0, 1), cx + 445, cy + 310);
                ctx.restore();
            }

            // 8. Nombre del Jugador
            ctx.save();
            ctx.textAlign = 'center';
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '950 56px "Outfit", sans-serif';
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 15;
            ctx.fillText(data.name, cx + (cw / 2), cy + 570);

            // Subtítulo rango / nivel
            ctx.fillStyle = data.tierColor;
            ctx.font = '900 28px "Outfit", sans-serif';
            ctx.fillText(`${data.cardTier} • NIVEL ${data.level} • WIN RATE ${data.winRate}%`, cx + (cw / 2), cy + 620);

            // Línea divisoria
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx + 60, cy + 655);
            ctx.lineTo(cx + cw - 60, cy + 655);
            ctx.stroke();
            ctx.restore();

            // 9. Atributos en 2 columnas de 3
            ctx.save();
            const col1X = cx + 90, col2X = cx + 390;
            const startY = cy + 735, gapY = 85;

            const drawAttr = (x, y, val, label, highlight = false) => {
                ctx.textAlign = 'left';
                ctx.fillStyle = highlight ? '#CCFF00' : '#FFFFFF';
                ctx.font = '950 48px "Outfit", sans-serif';
                ctx.fillText(String(val), x, y);

                ctx.fillStyle = '#94A3B8';
                ctx.font = '800 32px "Outfit", sans-serif';
                ctx.fillText(label, x + 85, y - 4);
            };

            drawAttr(col1X, startY, data.attributes.REM, 'REM');
            drawAttr(col1X, startY + gapY, data.attributes.VOL, 'VOL');
            drawAttr(col1X, startY + gapY * 2, data.attributes.DEF, 'DEF');

            drawAttr(col2X, startY, data.attributes.FIS, 'FIS');
            drawAttr(col2X, startY + gapY, data.attributes.TAC, 'TAC');
            drawAttr(col2X, startY + gapY * 2, data.attributes.CLU, 'CLU', true);
            ctx.restore();

            // 10. Sello de Verificación Oficial SomosPadel
            ctx.save();
            ctx.textAlign = 'center';
            ctx.fillStyle = '#CCFF00';
            ctx.font = '900 36px "Outfit", sans-serif';
            ctx.fillText('SOMOSPADEL APP • RESULTADO VERIFICADO', 540, 1540);

            ctx.fillStyle = '#FFFFFF';
            ctx.font = '800 28px "Outfit", sans-serif';
            ctx.fillText('Comparte tu progreso con #SomosPadelBCN', 540, 1595);

            // Badge inferior decorativo
            ctx.strokeStyle = 'rgba(204, 255, 0, 0.4)';
            ctx.lineWidth = 3;
            roundRect(ctx, 340, 1640, 400, 75, 25);
            ctx.stroke();

            ctx.fillStyle = '#CCFF00';
            ctx.font = '950 30px "Outfit", sans-serif';
            ctx.fillText('🎾 SOMOSPADEL.APP', 540, 1688);
            ctx.restore();

            return canvas;
        },

        _loadImage(src) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => resolve(img);
                img.onerror = (err) => reject(err);
                img.src = src;
            });
        },

        /**
         * Comparte la Story vertical 9:16 con Web Share API (móvil) o descarga
         */
        async generateAndShareStory() {
            const btn = document.getElementById('fut-share-story-btn');
            const originalText = btn ? btn.innerHTML : '';
            if (btn) {
                btn.innerHTML = '⏳ Generando Story HD...';
                btn.disabled = true;
            }

            try {
                const canvas = await this.renderStoryCanvas();
                
                canvas.toBlob(async (blob) => {
                    if (!blob) {
                        this.downloadStoryPNG();
                        return;
                    }
                    const file = new File([blob], `story_somospadel_${Date.now()}.png`, { type: 'image/png' });

                    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                        await navigator.share({
                            title: '¡Mi Carta FUT en SomosPadel BCN! 🎾',
                            text: '¡Mira mi carta de jugador y estadísticas en SomosPadel BCN! #SomosPadel #PadelFUT',
                            files: [file]
                        });
                    } else {
                        // Fallback: descarga directa
                        this._triggerDownload(blob);
                    }

                    if (btn) {
                        btn.innerHTML = '✅ ¡Listo!';
                        setTimeout(() => { btn.innerHTML = originalText; btn.disabled = false; }, 2000);
                    }
                }, 'image/png');

            } catch (err) {
                console.error('Error sharing story:', err);
                alert('No se pudo compartir directamente. Descargando imagen...');
                this.downloadStoryPNG();
                if (btn) {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                }
            }
        },

        /**
         * Descarga directa en formato PNG
         */
        async downloadStoryPNG() {
            try {
                const canvas = await this.renderStoryCanvas();
                canvas.toBlob((blob) => {
                    this._triggerDownload(blob);
                }, 'image/png');
            } catch (err) {
                console.error('Error generating download:', err);
                alert('Error al generar la imagen para descargar.');
            }
        },

        _triggerDownload(blob) {
            const link = document.createElement('a');
            link.download = `story_somospadel_${Date.now()}.png`;
            link.href = URL.createObjectURL(blob);
            link.click();
            setTimeout(() => URL.revokeObjectURL(link.href), 3000);
        }
    };

    window.PadelFutCard = PadelFutCard;
    console.log('🎴 [PadelFutCard] Módulo de Cartas FUT & Stories de Victoria cargado correctamente.');
})();
