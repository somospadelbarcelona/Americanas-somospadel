/**
 * WhatsAppService.js - VERSION 9.0 BROADCAST PRO & CONVOCATORIA STUDIO
 * 🛡️ Sistema inteligente de convocatorias deportivas para WhatsApp y Redes Sociales.
 * - Elimina la saturación de emojis y aplica diseño tipográfico deportivo de alto nivel.
 * - Corrige el bug numérico en listas a partir de 2 dígitos (11, 12...).
 * - Incorpora Barra de Ocupación visual en texto [█████░░░░].
 * - Calcula el Nivel Medio real en directo del cuadro.
 * - Generador de Flyer / Cartel Digital HD integrado (Share Studio).
 * - Enlaces inteligentes Deep Link y Google Calendar en 1 clic.
 */

window.WhatsAppService = {

    /**
     * Símbolos y emojis funcionales optimizados
     */
    E: {
        SPARKLE: '✨',
        TENNIS: '🎾',
        MALE: '🚹',
        FEMALE: '🚺',
        MIXED: '🚻',
        CALENDAR: '📅',
        TIMER: '⏰',
        DRUM: '🥁',
        PIN: '📍',
        BOLT: '⚡',
        LINK: '🔗',
        BALANCE: '⚖️',
        TROPHY: '🏆',
        CARD: '💳',
        STATS: '📊'
    },

    /**
     * Asegura la disponibilidad asíncrona de html2canvas para la generación del Flyer HD
     */
    async _ensureHtml2Canvas() {
        if (typeof window.html2canvas !== 'undefined') return true;
        if (window.loadExternalScript) {
            try {
                await window.loadExternalScript('https://html2canvas.hertzen.com/dist/html2canvas.min.js', 'html2canvas');
                return true;
            } catch (e) {
                console.warn("⚠️ Fallo con loadExternalScript para html2canvas:", e);
            }
        }
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://html2canvas.hertzen.com/dist/html2canvas.min.js';
            script.onload = () => resolve(true);
            script.onerror = () => {
                console.error("❌ No se pudo cargar html2canvas CDN.");
                resolve(false);
            };
            document.head.appendChild(script);
        });
    },

    /**
     * Calcula métricas del cuadro: balance de género, media de nivel y rango
     */
    _calculateEventMetrics(displayList) {
        const list = displayList || [];
        let maleCount = 0;
        let femaleCount = 0;
        const validLevels = [];

        list.forEach(p => {
            const g = (p.gender || '').toLowerCase();
            if (['male', 'chico', 'hombre', 'masculino'].includes(g)) maleCount++;
            else if (['female', 'chica', 'mujer', 'femenino'].includes(g)) femaleCount++;

            const lvl = parseFloat(p.level || p.playtomic_level || p.self_rate_level);
            if (!isNaN(lvl) && lvl > 0) {
                validLevels.push(lvl);
            }
        });

        let avgLevel = null;
        let minLevel = null;
        let maxLevel = null;

        if (validLevels.length > 0) {
            avgLevel = (validLevels.reduce((a, b) => a + b, 0) / validLevels.length).toFixed(2);
            minLevel = Math.min(...validLevels).toFixed(1);
            maxLevel = Math.max(...validLevels).toFixed(1);
        }

        return { maleCount, femaleCount, avgLevel, minLevel, maxLevel, validCount: validLevels.length };
    },

    /**
     * Genera la barra de progreso tipográfica para WhatsApp
     */
    _generateProgressBar(filled, total) {
        const maxSlots = total || 12;
        const current = Math.min(filled, maxSlots);
        const barLength = Math.min(12, maxSlots);
        const filledChars = Math.round((current / maxSlots) * barLength);
        const emptyChars = Math.max(0, barLength - filledChars);
        return '█'.repeat(filledChars) + '░'.repeat(emptyChars);
    },

    /**
     * Genera un enlace directo para añadir el evento a Google Calendar
     */
    _getGoogleCalendarUrl(event) {
        try {
            if (!event || !event.date) return '';
            const cleanDate = String(event.date).replace(/[^0-9]/g, '');
            if (cleanDate.length !== 8) return '';
            const startTime = (event.time || '10:00').replace(/[^0-9]/g, '').padEnd(4, '0') + '00';
            const endTime = (event.time_end || '12:00').replace(/[^0-9]/g, '').padEnd(4, '0') + '00';
            const startIso = `${cleanDate}T${startTime}`;
            const endIso = `${cleanDate}T${endTime}`;
            const title = encodeURIComponent(`SomosPadel: ${event.name || 'Convocatoria'}`);
            const loc = encodeURIComponent(event.location || 'Barcelona Pádel El Prat');
            const details = encodeURIComponent(`Convocatoria oficial SomosPadel BCN.\nModalidad: ${event.pair_mode || 'Twister'}\nNivel: ${event.level || ''}`);
            return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&location=${loc}&details=${details}`;
        } catch (e) {
            return '';
        }
    },

    /**
     * Genera un mensaje formateado para WhatsApp (Broadcast Pro 9.0)
     * @param {Object} event - Objeto del evento
     * @param {Array} richPlayers - Lista de jugadores enriquecida con nivel/género
     * @param {string} mode - 'pro' (Oficial Pro), 'flash' (Últimas Plazas), 'list' (Solo Lista)
     */
    generateMessage(event, richPlayers = null, mode = 'pro') {
        if (!event) return '';

        const name = (event.name || 'TORNEO SOMOSPADEL').toUpperCase();
        const type = (event.category || 'open').toLowerCase();
        const isMixed = type === 'mixed' || type === 'mixto' || type === 'mixta';
        const isFemale = type === 'female' || type === 'femenina';
        const isAmericana = name.includes('AMERICANA') || event.type === 'americana';

        const dateStr = this._formatDate(event.date);
        const timeStr = event.time || '10:00';
        const endTimeStr = event.time_end ? ` a ${event.time_end}` : '';
        const location = event.location || 'SomosPadel BCN';

        const players = event.players || [];
        const maxPlayers = (parseInt(event.max_courts) || 4) * 4;
        const spotsLeft = Math.max(0, maxPlayers - players.length);

        const pMember = event.price_members || 10;
        const pExt = event.price_external || 10;

        // Formateo de nivel
        let levelText = '3.0 - 4.5';
        if (event.level && String(event.level).trim()) {
            levelText = String(event.level).trim();
        } else if (event.level_min && event.level_max) {
            levelText = `${event.level_min} - ${event.level_max}`;
        } else if (event.level_min) {
            levelText = `${event.level_min}`;
        } else if (event.level_max) {
            levelText = `Hasta ${event.level_max}`;
        }

        const isFixed = event.pair_mode === 'fixed' || event.pair_mode === 'fixed_auto' || event.pair_mode === 'fixed_admin' || name.includes('FIJA');
        const modeLabel = isFixed ? 'Pareja Fija' : 'Twister (Individual)';

        const isDelfos = location.toUpperCase().includes('DELFOS');
        const isPrat = location.toUpperCase().includes('PRAT');

        let extras = ['Bolas Nuevas 🎾'];
        if (isPrat && !isDelfos) extras.push('Agua 💦');
        if (isAmericana) extras.push('Premios 🏆');
        extras.push('App en Directo 📱');
        const extrasStr = extras.join(' · ');

        const displayList = richPlayers || players;
        const metrics = this._calculateEventMetrics(displayList);
        const progressBar = this._generateProgressBar(players.length, maxPlayers);

        // Deep link directo al evento
        const baseUrl = "https://somospadelbarcelona.github.io/Americanas-somospadel";
        const sectionHash = isAmericana ? "#americanas" : "#entrenos";
        const eventParam = event.id ? `?event=${event.id}` : '';
        const deepLinkUrl = `${baseUrl}/${eventParam}${sectionHash}`;
        const gCalendarUrl = this._getGoogleCalendarUrl(event);

        // === MODO FLASH / ÚLTIMAS PLAZAS (BATSEÑAL) ===
        if (mode === 'flash') {
            let flashMsg = `⚡ *¡ÚLTIMAS ${spotsLeft} PLAZAS! · SOMOSPADEL BCN* ⚡\n`;
            flashMsg += `🏆 *${name}*\n`;
            flashMsg += `━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
            flashMsg += `📅 *Fecha:* ${dateStr}\n`;
            flashMsg += `⏰ *Horario:* ${timeStr}${endTimeStr}\n`;
            flashMsg += `📍 *Club:* ${location}\n`;
            flashMsg += `🎾 *Formato:* ${modeLabel} (Nivel ${levelText})\n`;
            if (metrics.avgLevel) {
                flashMsg += `⭐ *Nivel Medio actual:* ${metrics.avgLevel}\n`;
            }
            if (isMixed && (metrics.maleCount + metrics.femaleCount > 0)) {
                flashMsg += `⚖️ *Balance actual:* 🚹 ${metrics.maleCount} Chicos · 🚺 ${metrics.femaleCount} Chicas\n`;
            }
            flashMsg += `\n📊 *Ocupación:* [${progressBar}] (${players.length}/${maxPlayers})\n`;
            flashMsg += `🔥 *Solo faltan ${spotsLeft} jugadores para cerrar pista.*\n\n`;
            flashMsg += `📲 *Inscríbete en 1 clic:*\n👉 ${deepLinkUrl}\n`;
            flashMsg += `━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
            return flashMsg;
        }

        // === CONSTRUCCIÓN DE LISTA DE JUGADORES (Pro & Clean con 01., 02., 10., 11., 12.) ===
        const processedIds = new Set();
        let displayCount = 0;
        const totalRows = isFixed ? Math.floor(maxPlayers / 2) : maxPlayers;
        let playerListText = '';

        if (isFixed) {
            displayList.forEach((p) => {
                const pId = p.id || p.uid;
                if (processedIds.has(pId)) return;

                displayCount++;
                const padNum = String(displayCount).padStart(2, '0');
                const pName = p.name ? p.name.trim() : 'Jugador';
                const lvl = p.level || p.playtomic_level || '';
                const lvlStr = lvl ? ` _(N${lvl})_` : '';

                if (p.partner_name && String(p.partner_name).trim().length > 0) {
                    let partnerName = p.partner_name.trim();
                    let partnerLvlStr = "";
                    let partnerObj = null;

                    if (p.partner_id) {
                        partnerObj = displayList.find(x => (x.id || x.uid) === p.partner_id);
                    } else {
                        partnerObj = displayList.find(x => x.name && x.name.toLowerCase() === partnerName.toLowerCase() && (x.id || x.uid) !== pId);
                    }

                    if (partnerObj) {
                        processedIds.add(partnerObj.id || partnerObj.uid);
                        if (partnerObj.level || partnerObj.playtomic_level) {
                            partnerLvlStr = ` _(N${partnerObj.level || partnerObj.playtomic_level})_`;
                        }
                    }
                    playerListText += `${padNum}. 🎾 *${pName}*${lvlStr} & *${partnerName}*${partnerLvlStr}\n`;
                } else {
                    playerListText += `${padNum}. 🎾 *${pName}*${lvlStr} · _(Busca Pareja)_\n`;
                }
                processedIds.add(pId);
            });

            for (let i = displayCount; i < totalRows; i++) {
                const padNum = String(i + 1).padStart(2, '0');
                playerListText += `${padNum}. ▫️ _Pareja libre_\n`;
            }
        } else {
            // Modo Individual (Twister / Rotativo)
            displayList.forEach((p) => {
                const pId = p.id || p.uid;
                if (processedIds.has(pId)) return;

                displayCount++;
                const padNum = String(displayCount).padStart(2, '0');
                const pName = p.name ? p.name.trim() : 'Jugador';
                const lvl = p.level || p.playtomic_level || '';
                const lvlStr = lvl ? ` _(N${lvl})_` : '';

                let gIcon = '🎾';
                const g = (p.gender || '').toLowerCase();
                if (['male', 'chico', 'hombre', 'masculino'].includes(g)) gIcon = '🚹';
                else if (['female', 'chica', 'mujer', 'femenino'].includes(g)) gIcon = '🚺';

                playerListText += `${padNum}. ${gIcon} *${pName}*${lvlStr}\n`;
                processedIds.add(pId);
            });

            for (let i = displayCount; i < totalRows; i++) {
                const padNum = String(i + 1).padStart(2, '0');
                playerListText += `${padNum}. ▫️ _Plaza disponible_\n`;
            }
        }

        // === MODO SOLO LISTA RÁPIDA ===
        if (mode === 'list') {
            let listMsg = `👥 *LISTA ACTUALIZADA · ${name}*\n`;
            listMsg += `📅 ${dateStr} · ⏰ ${timeStr}${endTimeStr}\n`;
            listMsg += `📊 Ocupación: [${progressBar}] (${players.length}/${maxPlayers})\n`;
            listMsg += `━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
            listMsg += playerListText;
            listMsg += `━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
            listMsg += `📲 Ver cuadro en directo: ${deepLinkUrl}\n`;
            return listMsg;
        }

        // === MODO OFICIAL PRO (Default) ===
        let msg = `*SOMOSPADEL BCN*\n`;
        msg += `🏆 *${name}*\n`;
        msg += `━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

        // Datos del evento
        msg += `📅 *Fecha:* ${dateStr}\n`;
        msg += `⏰ *Horario:* ${timeStr}${endTimeStr}\n`;
        msg += `📍 *Club:* ${location}\n`;
        msg += `🎾 *Modo:* ${modeLabel}\n`;
        msg += `⚡ *Nivel:* ${levelText}\n`;
        if (metrics.avgLevel) {
            msg += `⭐ *Nivel Medio actual:* ${metrics.avgLevel} (Rango: ${metrics.minLevel} - ${metrics.maxLevel})\n`;
        }
        msg += `✨ *Extras:* ${extrasStr}\n\n`;

        // Ocupación y balance
        msg += `📊 *Ocupación (${players.length}/${maxPlayers}):*\n`;
        msg += `[${progressBar}] · `;
        if (spotsLeft === 0) {
            msg += `*¡CUADRO COMPLETO!* 🔴\n`;
        } else if (spotsLeft === 1) {
            msg += `*¡ÚLTIMA PLAZA DISPONIBLE!* 🔥\n`;
        } else {
            msg += `*Quedan ${spotsLeft} plazas disponibles*\n`;
        }

        if (isMixed && (metrics.maleCount + metrics.femaleCount > 0)) {
            msg += `⚖️ *Balance:* 🚹 ${metrics.maleCount} Chicos · 🚺 ${metrics.femaleCount} Chicas\n`;
        } else if (isFemale && metrics.femaleCount > 0) {
            msg += `⚖️ *Inscritas:* 🚺 ${metrics.femaleCount} Jugadoras\n`;
        }
        msg += `\n`;

        // Lista de inscritos
        msg += `👥 *INSCRIPCIONES:*\n`;
        msg += playerListText;

        // Tarifas y CTA
        msg += `\n━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        msg += `💳 *Tarifa:* ${pMember}€ socios / ${pExt}€ externos\n`;
        msg += `📲 *Inscripción directa en la App:*\n`;
        msg += `👉 ${deepLinkUrl}\n`;
        if (gCalendarUrl) {
            msg += `\n📅 *Añadir a mi Google Calendar:*\n`;
            msg += `🔗 ${gCalendarUrl}\n`;
        }
        msg += `━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

        return msg;
    },

    /**
     * Renderiza el template HTML del Flyer Digital Oficial en alta resolución (para capturar con html2canvas)
     */
    _getFlyerTemplateHTML(event, richPlayers = null) {
        const name = (event.name || 'CONVOCATORIA SOMOSPADEL').toUpperCase();
        const dateStr = this._formatDate(event.date);
        const timeStr = event.time || '10:00';
        const endTimeStr = event.time_end ? ` - ${event.time_end}` : '';
        const location = event.location || 'Barcelona Pádel El Prat';
        const players = event.players || [];
        const maxPlayers = (parseInt(event.max_courts) || 4) * 4;
        const spotsLeft = Math.max(0, maxPlayers - players.length);
        const displayList = richPlayers || players;
        const metrics = this._calculateEventMetrics(displayList);
        const pct = Math.min(100, Math.round((players.length / maxPlayers) * 100));

        let levelText = '3.0 - 4.5';
        if (event.level) levelText = event.level;
        else if (event.level_min && event.level_max) levelText = `${event.level_min} - ${event.level_max}`;

        const isAmericana = name.includes('AMERICANA') || event.type === 'americana';
        const typeBadge = isAmericana ? 'AMERICANA OFICIAL' : 'ENTRENO MIXTO / ABIERTO';
        const pMember = event.price_members || 10;
        const pExt = event.price_external || 10;

        return `
        <div id="flyer-card-render" style="
            width: 1080px; min-height: 1440px; background: #08080c; 
            font-family: 'Outfit', sans-serif; color: #fff; padding: 60px; box-sizing: border-box; 
            position: relative; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between;
            border: 2px solid rgba(204, 255, 0, 0.3); border-radius: 40px;
            box-shadow: inset 0 0 100px rgba(0,0,0,0.9), 0 30px 90px rgba(0,0,0,0.8);
        ">
            <!-- Glow FX -->
            <div style="position: absolute; top: -120px; right: -120px; width: 450px; height: 450px; background: #CCFF00; filter: blur(160px); opacity: 0.15; border-radius: 50%; pointer-events: none;"></div>
            <div style="position: absolute; bottom: -120px; left: -120px; width: 450px; height: 450px; background: #8B5CF6; filter: blur(160px); opacity: 0.18; border-radius: 50%; pointer-events: none;"></div>

            <!-- HEADER -->
            <div style="position: relative; z-index: 2;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <span style="font-size: 2.4rem;">🎾</span>
                        <div>
                            <div style="font-size: 2rem; font-weight: 950; letter-spacing: 2px; color: #fff; line-height: 1;">SOMOSPADEL BCN</div>
                            <div style="font-size: 0.95rem; font-weight: 700; color: #CCFF00; letter-spacing: 4px; text-transform: uppercase;">COMUNIDAD OFICIAL DE PÁDEL</div>
                        </div>
                    </div>
                    <div style="background: rgba(204,255,0,0.12); border: 1.5px solid #CCFF00; padding: 10px 24px; border-radius: 50px; font-weight: 900; font-size: 1.1rem; color: #CCFF00; letter-spacing: 1px;">
                        ${typeBadge}
                    </div>
                </div>

                <div style="background: linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.01)); border: 1.5px solid rgba(255,255,255,0.1); border-radius: 28px; padding: 35px 40px; margin-top: 20px;">
                    <div style="font-size: 3.2rem; font-weight: 950; line-height: 1.1; color: #fff; text-transform: uppercase; margin-bottom: 15px; text-shadow: 0 4px 20px rgba(0,0,0,0.5);">
                        ${name}
                    </div>
                    <div style="display: flex; flex-wrap: wrap; gap: 30px; font-size: 1.35rem; color: #e2e8f0; font-weight: 600;">
                        <div>📅 <span style="color:#fff; font-weight:800;">${dateStr}</span></div>
                        <div>⏰ <span style="color:#fff; font-weight:800;">${timeStr}${endTimeStr}</span></div>
                        <div>📍 <span style="color:#fff; font-weight:800;">${location}</span></div>
                    </div>
                </div>
            </div>

            <!-- METRICS & BADGES GRID -->
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 30px 0; position: relative; z-index: 2;">
                <!-- Nivel -->
                <div style="background: rgba(18, 18, 24, 0.85); border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; padding: 25px; text-align: center;">
                    <div style="font-size: 0.95rem; font-weight: 800; color: #94a3b8; letter-spacing: 2px; text-transform: uppercase;">NIVEL OFICIAL</div>
                    <div style="font-size: 2.2rem; font-weight: 950; color: #CCFF00; margin-top: 5px;">${levelText}</div>
                    ${metrics.avgLevel ? `<div style="font-size: 0.95rem; color: #cbd5e1; margin-top: 4px; font-weight: 700;">Media: ${metrics.avgLevel}</div>` : ''}
                </div>
                <!-- Ocupación -->
                <div style="background: rgba(18, 18, 24, 0.85); border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; padding: 25px; text-align: center;">
                    <div style="font-size: 0.95rem; font-weight: 800; color: #94a3b8; letter-spacing: 2px; text-transform: uppercase;">PLAZAS TOTALES</div>
                    <div style="font-size: 2.2rem; font-weight: 950; color: ${spotsLeft === 0 ? '#ef4444' : '#38bdf8'}; margin-top: 5px;">${players.length} / ${maxPlayers}</div>
                    <div style="font-size: 0.95rem; color: ${spotsLeft === 0 ? '#ef4444' : '#CCFF00'}; margin-top: 4px; font-weight: 800;">
                        ${spotsLeft === 0 ? 'COMPLETO' : `QUEDAN ${spotsLeft} PLAZAS`}
                    </div>
                </div>
                <!-- Tarifa -->
                <div style="background: rgba(18, 18, 24, 0.85); border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; padding: 25px; text-align: center;">
                    <div style="font-size: 0.95rem; font-weight: 800; color: #94a3b8; letter-spacing: 2px; text-transform: uppercase;">PRECIO</div>
                    <div style="font-size: 2.2rem; font-weight: 950; color: #fff; margin-top: 5px;">${pMember}€ <span style="font-size:1.1rem; color:#94a3b8; font-weight:600;">/ ${pExt}€</span></div>
                    <div style="font-size: 0.95rem; color: #94a3b8; margin-top: 4px; font-weight: 700;">Socios / Externos</div>
                </div>
            </div>

            <!-- PROGRESS BAR VISUAL -->
            <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 20px 25px; margin-bottom: 25px; position: relative; z-index: 2;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 1.1rem; font-weight: 800;">
                    <span style="color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Estado del Cuadro</span>
                    <span style="color: #CCFF00;">${pct}% Ocupado</span>
                </div>
                <div style="width: 100%; height: 16px; background: rgba(0,0,0,0.6); border-radius: 10px; overflow: hidden; position: relative;">
                    <div style="width: ${pct}%; height: 100%; background: linear-gradient(90deg, #CCFF00, #38bdf8); box-shadow: 0 0 15px rgba(204,255,0,0.5);"></div>
                </div>
            </div>

            <!-- FOOTER CALL TO ACTION -->
            <div style="background: linear-gradient(135deg, rgba(204,255,0,0.15), rgba(139,92,246,0.15)); border: 1.5px solid rgba(204,255,0,0.4); border-radius: 28px; padding: 30px 40px; display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 2;">
                <div>
                    <div style="font-size: 1.8rem; font-weight: 950; color: #fff;">¡APÚNTATE AHORA EN LA APP!</div>
                    <div style="font-size: 1.1rem; color: #cbd5e1; margin-top: 4px; font-weight: 600;">Resultados a tiempo real y seguimiento en directo</div>
                </div>
                <div style="background: #CCFF00; color: #000; font-weight: 950; font-size: 1.3rem; padding: 16px 36px; border-radius: 50px; letter-spacing: 1px; box-shadow: 0 10px 30px rgba(204,255,0,0.4);">
                    somospadelbarcelona.github.io
                </div>
            </div>
        </div>`;
    },

    /**
     * Abre el modal interactivo "Share Studio" (Hub de Convocatoria)
     */
    async openShareStudio(event, richPlayers = null) {
        if (!event) return;

        // Haptic feedback
        if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(25);

        // Asegurar que tenemos la lista enriquecida de jugadores
        let enrichedPlayers = richPlayers;
        if (!enrichedPlayers && event.players && event.players.length > 0) {
            try {
                let allUsers = window._allPlayersCache || window.allUsersCache;
                if (!allUsers && window.FirebaseDB?.players?.getAll) {
                    allUsers = await window.FirebaseDB.players.getAll();
                    window._allPlayersCache = allUsers;
                }
                if (allUsers && Array.isArray(allUsers) && allUsers.length > 0) {
                    enrichedPlayers = event.players.map(p => {
                        const pid = (typeof p === 'string') ? p : (p.id || p.uid);
                        const user = allUsers.find(u => (u.id === pid) || (u.uid === pid));
                        return {
                            ...p,
                            name: user ? user.name : (p.name || 'Jugador'),
                            level: user ? (user.level || user.self_rate_level || p.level) : p.level,
                            gender: user ? user.gender : (p.gender || null),
                            teams: user ? (user.team_somospadel || user.EQUIPOS || user.equipos) : (p.teams || null)
                        };
                    });
                }
            } catch (err) {
                console.warn("⚠️ Player enrichment fallback:", err);
            }
        }

        // Crear overlay modal
        const existingOverlay = document.getElementById('sp-share-studio-overlay');
        if (existingOverlay) existingOverlay.remove();

        const overlay = document.createElement('div');
        overlay.id = 'sp-share-studio-overlay';
        overlay.style.cssText = `
            position: fixed; inset: 0; background: rgba(5, 5, 8, 0.88); z-index: 120000;
            display: flex; align-items: center; justify-content: center;
            font-family: 'Outfit', sans-serif; backdrop-filter: blur(25px);
            -webkit-backdrop-filter: blur(25px); opacity: 0; transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            padding: 16px; box-sizing: border-box; overflow-y: auto;
        `;

        let currentMode = 'pro';
        let initialText = this.generateMessage(event, enrichedPlayers, currentMode);

        overlay.innerHTML = `
            <style>
                #sp-studio-container {
                    background: rgba(14, 14, 20, 0.96);
                    border: 1.5px solid rgba(204, 255, 0, 0.3);
                    border-radius: 28px;
                    width: 100%;
                    max-width: 960px;
                    display: flex;
                    flex-direction: column;
                    gap: 18px;
                    padding: 24px;
                    box-sizing: border-box;
                    box-shadow: 0 30px 80px rgba(0,0,0,0.85);
                    transform: scale(0.95);
                    transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.2);
                    max-height: 94vh;
                    overflow-y: auto;
                }
                .studio-tab-btn {
                    background: rgba(255, 255, 255, 0.05);
                    color: #94a3b8;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    padding: 10px 18px;
                    font-size: 0.85rem;
                    font-weight: 800;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                }
                .studio-tab-btn.active {
                    background: #CCFF00;
                    color: #000;
                    border-color: #CCFF00;
                    box-shadow: 0 4px 15px rgba(204, 255, 0, 0.3);
                }
                .studio-action-btn {
                    padding: 14px 20px;
                    border-radius: 14px;
                    font-weight: 900;
                    font-size: 0.95rem;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    transition: all 0.2s ease;
                    border: none;
                }
                .studio-action-btn:active {
                    transform: scale(0.97);
                }
                #sp-preview-text-box {
                    background: #09090d;
                    color: #f1f5f9;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 16px;
                    padding: 16px;
                    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                    font-size: 0.82rem;
                    line-height: 1.45;
                    white-space: pre-wrap;
                    max-height: 380px;
                    overflow-y: auto;
                    user-select: text;
                    border-left: 4px solid #CCFF00;
                }
                @media (max-width: 860px) {
                    #sp-studio-grid {
                        grid-template-columns: 1fr !important;
                    }
                    #sp-studio-flyer-col {
                        display: none !important;
                    }
                }
            </style>

            <div id="sp-studio-container">
                <!-- TOP BAR -->
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 14px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="font-size: 1.6rem;">📢</span>
                        <div>
                            <div style="font-size: 1.25rem; font-weight: 950; color: #fff; letter-spacing: 0.5px;">CONVOCATORIA STUDIO</div>
                            <div style="font-size: 0.75rem; font-weight: 700; color: #CCFF00; letter-spacing: 2px; text-transform: uppercase;">SOMOSPADEL BCN PRO</div>
                        </div>
                    </div>
                    <button id="sp-studio-close-btn" style="background: rgba(255,255,255,0.08); border: none; color: #fff; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; font-size: 1.1rem; display: flex; align-items: center; justify-content: center;">
                        ✕
                    </button>
                </div>

                <!-- MODE SELECTOR TABS -->
                <div style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center;">
                    <span style="font-size: 0.75rem; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-right: 5px;">Formato:</span>
                    <button class="studio-tab-btn active" data-mode="pro">📋 OFICIAL PRO</button>
                    <button class="studio-tab-btn" data-mode="flash">⚡ FLASH ÚLTIMAS PLAZAS</button>
                    <button class="studio-tab-btn" data-mode="list">👥 SOLO LISTA</button>
                </div>

                <!-- MAIN SPLIT GRID -->
                <div id="sp-studio-grid" style="display: grid; grid-template-columns: 1fr 1.1fr; gap: 24px; align-items: start;">
                    
                    <!-- LEFT COLUMN: FLYER PREVIEW & ACTIONS -->
                    <div id="sp-studio-flyer-col" style="display: flex; flex-direction: column; gap: 14px; background: #08080c; padding: 16px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.06);">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 0.8rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px;">Cartel Oficial HD</span>
                            <span style="font-size: 0.7rem; background: rgba(204,255,0,0.15); color: #CCFF00; padding: 4px 10px; border-radius: 20px; font-weight: 800;">READY</span>
                        </div>

                        <!-- Scaled Mini Preview -->
                        <div id="flyer-preview-wrapper" style="width: 100%; height: 260px; overflow: hidden; border-radius: 14px; position: relative; background: #000; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.1);">
                            <div id="flyer-scalable-inner" style="transform: scale(0.24); transform-origin: top center; width: 1080px; position: absolute; top: 0;">
                                ${this._getFlyerTemplateHTML(event, enrichedPlayers)}
                            </div>
                        </div>

                        <!-- Flyer Actions -->
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                            <button id="btn-copy-flyer" class="studio-action-btn" style="background: rgba(255,255,255,0.08); color: #fff; border: 1px solid rgba(255,255,255,0.15); font-size: 0.85rem; padding: 10px;">
                                🖼️ Copiar Cartel
                            </button>
                            <button id="btn-download-flyer" class="studio-action-btn" style="background: rgba(204,255,0,0.12); color: #CCFF00; border: 1px solid rgba(204,255,0,0.3); font-size: 0.85rem; padding: 10px;">
                                📥 Descargar HD
                            </button>
                        </div>
                    </div>

                    <!-- RIGHT COLUMN: TEXT PREVIEW & WHATSAPP ACTIONS -->
                    <div style="display: flex; flex-direction: column; gap: 14px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 0.8rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px;">Mensaje de WhatsApp</span>
                            <span id="char-count-label" style="font-size: 0.72rem; color: #64748b; font-weight: 700;">Broadcast Formatter</span>
                        </div>

                        <div id="sp-preview-text-box">${this._escapeHTML(initialText)}</div>

                        <!-- Actions Bar -->
                        <div style="display: flex; flex-direction: column; gap: 10px;">
                            <button id="btn-send-whatsapp" class="studio-action-btn" style="background: #25D366; color: #000; font-size: 1.05rem; box-shadow: 0 10px 25px rgba(37, 211, 102, 0.35);">
                                <i class="fab fa-whatsapp" style="font-size: 1.25rem;"></i> ENVIAR A WHATSAPP
                            </button>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                <button id="btn-copy-text" class="studio-action-btn" style="background: rgba(255,255,255,0.08); color: #fff; border: 1px solid rgba(255,255,255,0.15); font-size: 0.85rem;">
                                    📋 Copiar Texto
                                </button>
                                <button id="btn-copy-link" class="studio-action-btn" style="background: rgba(255,255,255,0.08); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.25); font-size: 0.85rem;">
                                    🔗 Copiar Link Directo
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Animar entrada
        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
            const cont = document.getElementById('sp-studio-container');
            if (cont) cont.style.transform = 'scale(1)';
        });

        const closeStudio = () => {
            overlay.style.opacity = '0';
            const cont = document.getElementById('sp-studio-container');
            if (cont) cont.style.transform = 'scale(0.95)';
            setTimeout(() => {
                if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
            }, 300);
        };

        document.getElementById('sp-studio-close-btn')?.addEventListener('click', closeStudio);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeStudio();
        });

        // Manejador de Tabs
        const textBox = document.getElementById('sp-preview-text-box');
        const tabButtons = overlay.querySelectorAll('.studio-tab-btn');

        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                tabButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentMode = btn.getAttribute('data-mode');
                const newText = this.generateMessage(event, enrichedPlayers, currentMode);
                if (textBox) textBox.textContent = newText;
                if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(10);
            });
        });

        // Acción: Enviar a WhatsApp
        document.getElementById('btn-send-whatsapp')?.addEventListener('click', () => {
            const txt = textBox ? textBox.textContent : this.generateMessage(event, enrichedPlayers, currentMode);
            this.shareText(txt, `SomosPadel: ${event.name || 'Convocatoria'}`);
        });

        // Acción: Copiar Texto
        document.getElementById('btn-copy-text')?.addEventListener('click', async () => {
            const txt = textBox ? textBox.textContent : this.generateMessage(event, enrichedPlayers, currentMode);
            try {
                await navigator.clipboard.writeText(txt);
                const btn = document.getElementById('btn-copy-text');
                if (btn) {
                    btn.innerHTML = '✅ ¡TEXTO COPIADO!';
                    btn.style.borderColor = '#25D366';
                    btn.style.color = '#25D366';
                    setTimeout(() => {
                        btn.innerHTML = '📋 Copiar Texto';
                        btn.style.borderColor = 'rgba(255,255,255,0.15)';
                        btn.style.color = '#fff';
                    }, 2200);
                }
            } catch (e) {
                console.warn("Fallback copy:", e);
            }
        });

        // Acción: Copiar Link Directo
        document.getElementById('btn-copy-link')?.addEventListener('click', async () => {
            const isAmericana = (event.name || '').toUpperCase().includes('AMERICANA') || event.type === 'americana';
            const baseUrl = "https://somospadelbarcelona.github.io/Americanas-somospadel";
            const sectionHash = isAmericana ? "#americanas" : "#entrenos";
            const directUrl = `${baseUrl}/?event=${event.id || ''}${sectionHash}`;
            try {
                await navigator.clipboard.writeText(directUrl);
                const btn = document.getElementById('btn-copy-link');
                if (btn) {
                    btn.innerHTML = '✅ ¡LINK COPIADO!';
                    btn.style.color = '#CCFF00';
                    setTimeout(() => {
                        btn.innerHTML = '🔗 Copiar Link Directo';
                        btn.style.color = '#38bdf8';
                    }, 2200);
                }
            } catch (e) {}
        });

        // Helper para renderizar Canvas del Flyer
        const renderFlyerCanvas = async () => {
            await this._ensureHtml2Canvas();
            if (typeof window.html2canvas === 'undefined') {
                throw new Error("html2canvas no está disponible");
            }
            const hiddenContainer = document.createElement('div');
            hiddenContainer.style.cssText = "position: fixed; top: -9999px; left: -9999px; width: 1080px; z-index: -9999;";
            hiddenContainer.innerHTML = this._getFlyerTemplateHTML(event, enrichedPlayers);
            document.body.appendChild(hiddenContainer);
            await new Promise(r => setTimeout(r, 250));

            const target = hiddenContainer.firstElementChild || hiddenContainer;
            const canvas = await window.html2canvas(target, {
                scale: 2.0,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#08080c',
                logging: false
            });
            document.body.removeChild(hiddenContainer);
            return canvas;
        };

        // Acción: Copiar Flyer al portapapeles
        document.getElementById('btn-copy-flyer')?.addEventListener('click', async () => {
            const btn = document.getElementById('btn-copy-flyer');
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando...';
            }
            try {
                const canvas = await renderFlyerCanvas();
                canvas.toBlob(async (blob) => {
                    if (!blob) throw new Error("No blob generated");
                    try {
                        const item = new ClipboardItem({ "image/png": blob });
                        await navigator.clipboard.write([item]);
                        if (btn) {
                            btn.disabled = false;
                            btn.innerHTML = '✅ ¡IMAGEN COPIADA!';
                            btn.style.color = '#CCFF00';
                            btn.style.borderColor = '#CCFF00';
                            setTimeout(() => {
                                btn.innerHTML = '🖼️ Copiar Cartel';
                                btn.style.color = '#fff';
                                btn.style.borderColor = 'rgba(255,255,255,0.15)';
                            }, 2500);
                        }
                    } catch (clipErr) {
                        console.warn("Restricción del navegador, descargando:", clipErr);
                        const link = document.createElement('a');
                        link.download = `SomosPadel_${(event.name || 'evento').replace(/\s+/g, '_')}.png`;
                        link.href = canvas.toDataURL('image/png');
                        link.click();
                        if (btn) {
                            btn.disabled = false;
                            btn.innerHTML = '📥 DESCARGADO';
                            setTimeout(() => { btn.innerHTML = '🖼️ Copiar Cartel'; }, 2000);
                        }
                    }
                }, 'image/png');
            } catch (err) {
                console.error("Error copiando flyer:", err);
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = '⚠️ Reintentar';
                }
            }
        });

        // Acción: Descargar Flyer HD
        document.getElementById('btn-download-flyer')?.addEventListener('click', async () => {
            const btn = document.getElementById('btn-download-flyer');
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando...';
            }
            try {
                const canvas = await renderFlyerCanvas();
                const link = document.createElement('a');
                link.download = `SomosPadel_${(event.name || 'evento').replace(/\s+/g, '_')}_HD.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = '✅ ¡GUARDADO!';
                    setTimeout(() => {
                        btn.innerHTML = '📥 Descargar HD';
                    }, 2500);
                }
            } catch (err) {
                console.error("Error descargando flyer:", err);
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = '⚠️ Reintentar';
                }
            }
        });
    },

    /**
     * Utilidad para escapar HTML en previsualizaciones
     */
    _escapeHTML(str) {
        if (!str) return '';
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },

    /**
     * Punto de entrada principal desde paneles de administración
     * Abre directamente el nuevo Share Studio interactivo
     */
    async shareStartFromAdmin(event) {
        try {
            console.log("🚀 [WhatsAppService] Opening Convocatoria Studio Pro for event:", event?.id);
            await this.openShareStudio(event);
        } catch (e) {
            console.error("WhatsApp Error:", e);
            if (window.PremiumModal) {
                window.PremiumModal.alert({ title: "WhatsApp", message: "No se pudo abrir el centro de compartir.", type: 'warning' });
            }
        }
    },

    _formatDate(dateString) {
        if (!dateString) return '';
        try {
            const date = new Date(dateString + 'T12:00:00');
            const options = { weekday: 'long', day: 'numeric', month: 'long' };
            let f = new Intl.DateTimeFormat('es-ES', options).format(date);
            return f.charAt(0).toUpperCase() + f.slice(1);
        } catch (e) { return dateString; }
    },

    /**
     * Share full ranking list
     */
    async shareRanking(title, players, viewType) {
        const E = this.E;
        let msg = E.TROPHY + " *RANKING SOMOSPADEL BCN* " + E.TROPHY + "\n";
        msg += "*" + title.toUpperCase() + "* (" + viewType.toUpperCase() + ")\n";
        msg += "--------------------------\n\n";

        players.slice(0, 15).forEach((p, i) => {
            const medal = i === 0 ? "🥇" : (i === 1 ? "🥈" : (i === 2 ? "🥉" : (i + 1) + "."));
            const name = p.name || "Jugador";
            const pts = p.points || 0;
            const lvl = (p.level && !isNaN(p.level)) ? " _(N" + parseFloat(p.level).toFixed(2) + ")_" : "";

            msg += medal + " *" + name + "* " + pts + " pts" + lvl + "\n";
        });

        msg += "\n" + E.DOWN + " *MIRA EL RANKING COMPLETO:* \n";
        msg += E.LINK + " https://somospadelbarcelona.github.io/Americanas-somospadel/#ranking\n";

        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || isIOS;

        if (isMobile && navigator.share) {
            try {
                await navigator.share({
                    title: 'Ranking Somospadel',
                    text: msg
                });
                return;
            } catch (e) {
                if (e.name === 'AbortError' || (e.message && e.message.toLowerCase().includes('abort'))) {
                    console.log("ℹ️ Compartir ranking cancelado por el usuario.");
                    return;
                }
                console.warn("Native share failed", e);
            }
        }

        const encodedText = encodeURIComponent(msg);
        const url = "https://api.whatsapp.com/send?text=" + encodedText;
        this._openUrlSafely(url);
    },

    /**
     * Share Hall of Fame (Records)
     */
    async shareHallOfFame(records) {
        if (!records) return;
        const E = this.E;

        let msg = E.TROPHY + " *SALÓN DE LA FAMA - SOMOSPADEL BCN* " + E.TROPHY + "\n";
        msg += "*TEMPORADA 2026*\n";
        msg += "--------------------------\n\n";

        const items = [
            { r: records.alpha, t: "REY DE LA 1" },
            { r: records.punisher, t: "EL VERDUGO" },
            { r: records.ame, t: "MAESTRO DE AMERICANAS" },
            { r: records.ent, t: "REY DE COPAS (Entrenos)" },
            { r: records.streak, t: "LA MURALLA (Victorias)" },
            { r: records.giant, t: "MATA-GIGANTES" },
            { r: records.catalyst, t: "SOCIO DE ORO" },
            { r: records.sniper, t: "FRANCOTIRADOR" },
            { r: records.ironman, t: "EL INFATIGABLE" },
            { r: records.wall, t: "EL INTOCABLE" }
        ];

        items.forEach(item => {
            if (item.r && item.r.name !== 'VACANTE') {
                const icon = item.r.icon || "🏆";
                msg += icon + " *" + item.t + "*\n";
                msg += "👑 " + item.r.name + " (" + item.r.value + ")\n\n";
            }
        });

        msg += E.DOWN + " *MIRA TODOS LOS DETALLES:* \n";
        msg += E.LINK + " https://somospadelbarcelona.github.io/Americanas-somospadel/#records\n";

        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || isIOS;

        if (isMobile && navigator.share) {
            try {
                await navigator.share({
                    title: 'Salón de la Fama Somospadel',
                    text: msg
                });
                return;
            } catch (e) {
                if (e.name === 'AbortError' || (e.message && e.message.toLowerCase().includes('abort'))) {
                    console.log("ℹ️ Compartir hall of fame cancelado por el usuario.");
                    return;
                }
            }
        }

        const encodedText = encodeURIComponent(msg);
        const url = "https://api.whatsapp.com/send?text=" + encodedText;
        this._openUrlSafely(url);
    },

    /**
     * Share a "Need Players" alert
     */
    async shareLookingFor(event, countNeeded) {
        const E = this.E;
        const typeIcon = (event.type === 'entreno') ? "🏋️‍♂️" : "🏆";

        let msg = E.DRUM + " *¡BUSCAMOS " + countNeeded + " JUGADORE" + (countNeeded > 1 ? 'S' : '') + "!* " + E.DRUM + "\n\n";
        msg += typeIcon + " *" + (event.name || 'EVENTO').toUpperCase() + "*\n";
        msg += E.CALENDAR + " " + this._formatDate(event.date) + "\n";
        msg += E.TIMER + " " + (event.time || '10:00') + "\n";
        msg += E.PIN + " " + (event.location || 'SomosPadel BCN') + "\n";
        msg += "--------------------------\n\n";
        msg += "Nos falta" + (countNeeded > 1 ? 'n ' : ' ') + "*" + countNeeded + "* para completar el cuadro. ¡Dale caña! 🔥🎾\n\n";

        const baseUrl = "https://somospadelbarcelona.github.io/Americanas-somospadel";
        const sectionHash = (event.type === 'entreno') ? "#entrenos" : "#americanas";
        msg += E.LINK + " " + baseUrl + "/" + sectionHash + "\n";

        const encodedText = encodeURIComponent(msg);
        const url = "https://api.whatsapp.com/send?text=" + encodedText;
        this._openUrlSafely(url);
    },

    /**
     * Generic text sharer (V8.5+)
     * Uses native share if available, otherwise falls back to WhatsApp link.
     */
    async shareText(text, title = 'Somospadel') {
        if (!text) return;
        
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || isIOS;

        console.log("📤 WhatsAppService.shareText triggered", { isMobile, hasNativeShare: !!navigator.share });

        if (isMobile && navigator.share) {
            try {
                await navigator.share({
                    title: title,
                    text: text
                });
                return;
            } catch (e) {
                if (e.name === 'AbortError' || (e.message && e.message.toLowerCase().includes('abort'))) {
                    console.log("ℹ️ shareText cancelado por el usuario.");
                    return;
                }
                console.warn("Native share failed, falling back to WhatsApp link", e); 
            }
        }

        // Fallback to WhatsApp Web/App link
        const encodedText = encodeURIComponent(text);
        const url = "https://api.whatsapp.com/send?text=" + encodedText;
        this._openUrlSafely(url);
    },

    /**
     * Integración Nativa Automatizada (Concepto API Twilio/Cloud)
     * Envía una notificación sin intervención del usuario a través de un Webhook.
     * @param {string} phone - Formato internacional (ej: 34600000000)
     * @param {Object} data - Información del evento/partido
     */
    async sendAutomatedNotification(phone, data) {
        try {
            console.log(`🤖 [WhatsAppService] Intentando envío automatizado a ${phone}...`);
            
            // Placeholder: Sustituir por URL de Cloud Function o Twilio API
            const API_URL = "https://europe-west1-somospadel-bcn.cloudfunctions.net/api/whatsapp/send";
            
            // Construct the payload
            const payload = {
                to: phone,
                template: data.template || 'match_confirmation',
                components: [
                    { type: 'header', text: data.title || 'PARTIDO CONFIRMADO' },
                    { type: 'body', params: [data.userName, data.time, data.court] },
                    { type: 'button', index: 0, payload: `confirm_${data.matchId}` }
                ]
            };

            // En un entorno real asincrónico:
            /*
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            return await response.json();
            */

            console.log("✅ [Mock] Notificación en cola de envío via API.");
            return { success: true, messageId: "msg_" + Math.random().toString(36).substr(2, 9) };

        } catch (e) {
            console.error("❌ Error en envío automatizado:", e);
            return { success: false, error: e.message };
        }
    }
};

console.log("💬 WhatsAppService V9.0 BROADCAST PRO & CONVOCATORIA STUDIO Loaded.");
