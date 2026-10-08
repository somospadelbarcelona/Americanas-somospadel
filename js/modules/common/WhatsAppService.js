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
     * Construye la URL canónica directa para un evento (Americanas o Entrenos)
     * Formato limpio y optimizado para compartir en WhatsApp
     */
    getEventCanonicalUrl(event) {
        const baseUrl = "https://somospadel.eu/";
        if (!event) return baseUrl;
        const name = (event.name || '').toUpperCase();
        const isEntreno = event.type === 'entreno' || name.includes('ENTRENO');
        const rawId = event.id || event._id || event.uid;
        const eventId = rawId ? encodeURIComponent(String(rawId).trim()) : '';
        if (!eventId) return baseUrl;
        const typeParam = isEntreno ? '&type=entreno' : '';
        return `${baseUrl}?event=${eventId}${typeParam}`;
    },

    /**
     * Abre URLs de forma segura evitando bloqueos de popups y desbordamientos
     */
    _openUrlSafely(url) {
        if (!url) return;
        try {
            const win = window.open(url, '_blank', 'noopener,noreferrer');
            if (!win || win.closed || typeof win.closed === 'undefined') {
                window.location.href = url;
            }
        } catch (e) {
            window.location.href = url;
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
        const isEntreno = event.type === 'entreno' || name.includes('ENTRENO');
        const isAmericana = !isEntreno;

        const dateStr = this._formatDate(event.date);
        const timeStr = event.time || '10:00';
        const endTimeStr = event.time_end ? ` a ${event.time_end}` : '';
        const location = event.location || event.sede || event.club || 'SomosPadel BCN';

        const players = event.players || event.registeredPlayers || [];
        const rawCourts = parseInt(event.max_courts || event.courts || 0);
        const maxCourts = rawCourts > 0 ? rawCourts : (event.max_players ? Math.max(1, Math.round(event.max_players / 4)) : 4);
        // Court capacity in padel is strictly 4 players per court
        const maxPlayers = maxCourts * 4;
        const spotsLeft = Math.max(0, maxPlayers - players.length);

        const pMember = event.price_members || event.price_socio || event.price || 10;
        const pExt = event.price_external || event.price_no_socio || event.price_externo || event.price || 10;

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

        let extras = ['Bolas Nuevas'];
        if (isPrat && !isDelfos) extras.push('Agua');
        if (isAmericana) extras.push('Premios');
        extras.push('App en Directo');
        const extrasStr = extras.join(' · ');

        const displayList = richPlayers || players;
        const metrics = this._calculateEventMetrics(displayList);
        const progressBar = this._generateProgressBar(players.length, maxPlayers);

        // Deep link canónico directo al evento
        const deepLinkUrl = this.getEventCanonicalUrl(event);

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
                playerListText += `${padNum}. ▫️ _(Pareja Libre)_\n`;
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
                playerListText += `${padNum}. ▫️ _(Disponible)_\n`;
            }
        }

        // === CONSTRUCCIÓN DEL MENSAJE OFICIAL (Limpio, Directo y Deportivo) ===
        let msg = `*SOMOSPADEL BCN*\n`;
        msg += `🏆 *${name}*\n`;
        msg += `─────────────────────────\n\n`;

        // Datos del evento
        msg += `📅 *Fecha:* ${dateStr}\n`;
        msg += `⏰ *Horario:* ${timeStr}${endTimeStr}\n`;
        msg += `📍 *Club:* ${location}\n`;
        if (event.organizer && String(event.organizer).trim()) {
            msg += `👤 *Organizador:* ${String(event.organizer).trim()}\n`;
        }
        msg += `🎾 *Modo:* ${modeLabel}\n`;
        msg += `⚡ *Nivel:* ${levelText}\n`;
        if (metrics.avgLevel) {
            msg += `📊 *Nivel medio:* ${metrics.avgLevel}\n`;
        }
        msg += `✨ *Extras:* ${extrasStr}\n\n`;
        if (event.description && String(event.description).trim()) {
            msg += `📢 *Nota del organizador:*\n_${String(event.description).trim()}_\n\n`;
        }

        // Ocupación y balance
        msg += `📊 *Ocupación (${players.length}/${maxPlayers}):*\n`;
        msg += `[${progressBar}] · `;
        if (spotsLeft === 0) {
            msg += `🔴 *¡CUADRO COMPLETO!*\n`;
        } else if (spotsLeft === 1) {
            msg += `🔥 *¡ÚLTIMA PLAZA DISPONIBLE!*\n`;
        } else {
            msg += `*Quedan ${spotsLeft} plazas*\n`;
        }

        if (isMixed && (metrics.maleCount + metrics.femaleCount > 0)) {
            msg += `⚖️ *Balance:* 🚹 ${metrics.maleCount} Chicos · 🚺 ${metrics.femaleCount} Chicas\n`;
        } else if (isFemale && metrics.femaleCount > 0) {
            msg += `⚖️ *Inscritas:* 🚺 ${metrics.femaleCount} Jugadoras\n`;
        }
        msg += `\n`;

        // Lista de inscritos con contador exacto
        msg += `👥 *INSCRIPCIONES (${players.length}/${maxPlayers}):*\n`;
        msg += playerListText;

        // Tarifas y CTA directo
        msg += `\n─────────────────────────\n`;
        msg += `💳 *Tarifa:* ${pMember}€ socios / ${pExt}€ externos\n`;
        msg += `📲 *¡Apúntate en un clic!:*\n`;
        msg += `👉 ${deepLinkUrl}\n`;
        msg += `─────────────────────────\n`;

        return msg;
    },



    /**
     * Punto de entrada principal para compartir el evento por WhatsApp
     * ACCIÓN DIRECTA EN 1 CLIC (Sin modales, sin líos y a la máxima velocidad)
     */
    async shareStartFromAdmin(event) {
        if (!event) return;
        try {
            console.log("🚀 [WhatsAppService] Compartir directo en WhatsApp para:", event.id || event.name);

            // Vibración táctil sutil
            if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(25);

            // 100% FRESH FETCH from Firestore to prevent stale in-memory data
            let freshEvent = event;
            if (event.id && window.EventService?.getById) {
                try {
                    const evtType = (event.type === 'entreno' || (event.name && event.name.toUpperCase().includes('ENTRENO'))) ? 'entreno' : 'americana';
                    const fetched = await window.EventService.getById(evtType, event.id);
                    if (fetched) {
                        freshEvent = { ...event, ...fetched, id: event.id, type: evtType };
                    }
                } catch (fetchErr) {
                    console.warn("⚠️ [WhatsAppService] Error fetching fresh event from Firestore, using in-memory event:", fetchErr);
                }
            }

            // Enriquecer jugadores con niveles actualizados y género
            let richPlayers = null;
            const eventPlayers = freshEvent.players || freshEvent.registeredPlayers || [];
            if (eventPlayers && eventPlayers.length > 0) {
                try {
                    let allUsers = window._allPlayersCache || window.allUsersCache;
                    if (!allUsers && window.FirebaseDB?.players?.getAll) {
                        try {
                            allUsers = await window.FirebaseDB.players.getAll();
                            window._allPlayersCache = allUsers;
                        } catch (errDb) {
                            allUsers = window.allUsersCache || [];
                        }
                    }
                    if (allUsers && Array.isArray(allUsers) && allUsers.length > 0) {
                        richPlayers = eventPlayers.map(p => {
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
                } catch (pErr) {
                    console.warn("⚠️ Player enrichment fallback:", pErr);
                }
            }

            // Generar el mensaje optimizado para WhatsApp con el evento 100% actualizado
            const text = this.generateMessage(freshEvent, richPlayers);

            // Copia de seguridad automática en el portapapeles (por si el navegador bloquea popups en escritorio)
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(text);
                }
            } catch (clipErr) {}

            // Feedback visual sutil
            if (window.NotificationService && typeof window.NotificationService.show === 'function') {
                window.NotificationService.show("Abriendo WhatsApp...", "success");
            }

            // Abrir directamente WhatsApp
            await this.shareText(text, `SomosPadel: ${freshEvent.name || 'Convocatoria'}`);

        } catch (e) {
            console.error("❌ Error en shareStartFromAdmin:", e);
            if (window.PremiumModal) {
                window.PremiumModal.alert({ title: "WhatsApp", message: "No se pudo compartir el evento.", type: 'warning' });
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

        let msg = E.TROPHY + " *RÉCORDS DE LA TEMPORADA - SOMOSPADEL BCN* " + E.TROPHY + "\n";
        msg += "*LIGA SUMMAPADEL 2026*\n";
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
                const title = item.r.title || item.t;
                const metric = item.r.count || item.r.value || "";
                msg += icon + " *" + title.toUpperCase() + "*\n";
                msg += "👑 " + item.r.name + (metric ? " (" + metric + ")" : "") + "\n\n";
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
        const name = (event.name || 'EVENTO').toUpperCase();
        const isEntreno = event.type === 'entreno' || name.includes('ENTRENO');
        const typeIcon = isEntreno ? "🏋️‍♂️" : "🏆";

        let msg = E.DRUM + " *¡BUSCAMOS " + countNeeded + " JUGADORE" + (countNeeded > 1 ? 'S' : '') + "!* " + E.DRUM + "\n\n";
        msg += typeIcon + " *" + name + "*\n";
        msg += E.CALENDAR + " " + this._formatDate(event.date) + "\n";
        msg += E.TIMER + " " + (event.time || '10:00') + (event.time_end && !event.time?.includes('-') ? ' - ' + event.time_end : '') + "\n";
        msg += E.PIN + " " + (event.location || 'SomosPadel BCN') + "\n";
        msg += "--------------------------\n\n";
        msg += "Nos falta" + (countNeeded > 1 ? 'n ' : ' ') + "*" + countNeeded + "* para completar el cuadro. ¡Dale caña! 🔥🎾\n\n";

        const deepLinkUrl = this.getEventCanonicalUrl(event);
        msg += E.LINK + " " + deepLinkUrl + "\n";

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
    },

    /**
     * =========================================================================
     * 📢 CARTELERA MULTI-EVENTO / MENÚ DEL DÍA (WHATSAPP BROADCAST PRO)
     * Genera mensajes agrupados por fecha con estado de plazas en directo y enlaces limpios
     * =========================================================================
     */
    generateCarteleraBroadcast(events, options = {}) {
        if (!events || events.length === 0) return '';

        const header = options.header !== undefined ? options.header : '🚨🎾 ¡HOY TODO SOLD OUT… RESERVA TU TURNO DE MAÑANA! 🎾🚨';
        const promo = options.promo !== undefined ? options.promo : '🎁 ¡ÚLTIMO DÍA DE SORTEO!\nApúntate antes de las 22:00 y entrarás en el sorteo de 1 americana gratis 🍀';
        const footer = options.footer !== undefined ? options.footer : '⚡ ¡Elige tu turno y asegura tu plaza antes de que vuelen!';

        // Agrupar eventos por fecha
        const groups = {};
        events.forEach(evt => {
            const d = evt.date || 'Sin fecha';
            if (!groups[d]) groups[d] = [];
            groups[d].push(evt);
        });

        // Ordenar fechas cronológicamente
        const sortedDates = Object.keys(groups).sort((a, b) => {
            const da = new Date(a.includes('/') ? a.split('/').reverse().join('-') : a);
            const db = new Date(b.includes('/') ? b.split('/').reverse().join('-') : b);
            return da - db;
        });

        let msg = `${header}\n\n`;
        if (promo && promo.trim()) {
            msg += `${promo.trim()}\n\n`;
        }

        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        const daysOfWeek = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];

        sortedDates.forEach((dateKey) => {
            const evts = groups[dateKey];
            evts.sort((a, b) => String(a.time || '00:00').localeCompare(String(b.time || '00:00')));

            let dateLabel = dateKey;
            try {
                const normDate = dateKey.includes('/') ? dateKey.split('/').reverse().join('-') : dateKey;
                const dObj = new Date(normDate + 'T00:00:00');
                const dayName = daysOfWeek[dObj.getDay()];
                if (normDate === todayStr) {
                    dateLabel = `HOY ${dayName}`;
                } else if (normDate === tomorrowStr) {
                    dateLabel = `MAÑANA ${dayName}`;
                } else {
                    dateLabel = `${dayName} ${dObj.getDate()}/${dObj.getMonth() + 1}`;
                }
            } catch (e) {
                dateLabel = dateKey;
            }

            msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
            msg += `📅 *${dateLabel}*\n`;
            msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

            evts.forEach(e => {
                const name = (e.name || 'Torneo SomosPadel').trim();
                const upperName = name.toUpperCase();
                const time = e.time || '10:00';
                const location = (e.location || e.sede || e.club || 'SomosPadel BCN').trim();
                const price = e.price_external || e.price_members || e.price || 10;
                const isEntreno = e.type === 'entreno' || upperName.includes('ENTRENO');

                // Emoji dinámico por franja horaria / modalidad
                let icon = '🎾';
                if (upperName.includes('JAMON') || upperName.includes('JAMÓN')) icon = '🥓';
                else if (upperName.includes('VERMUT') || upperName.includes('VERMÚ')) icon = '🍸';
                else if (isEntreno) icon = '🏋️‍♂️';
                else {
                    const hour = parseInt((time.split(':')[0] || '10'), 10);
                    if (hour < 12) icon = '🌅';
                    else if (hour < 16) icon = '☀️';
                    else if (hour < 20) icon = '🌆';
                    else icon = '🌙';
                }

                // Cálculo de ocupación
                const courts = parseInt(e.max_courts || e.courts || 4, 10);
                const maxPlayers = courts * 4;
                const playersCount = (e.players || e.registeredPlayers || []).length;
                const spotsLeft = Math.max(0, maxPlayers - playersCount);

                msg += `${icon} *${time}* · *${name}*\n`;
                msg += `📍 ${location} · ${price} €\n`;

                const link = this.getEventCanonicalUrl(e);

                if (spotsLeft === 0) {
                    msg += `⛔ *SOLD OUT*\n\n`;
                } else if (spotsLeft === 1) {
                    msg += `🔥 *¡ÚLTIMA PLAZA DISPONIBLE!*\n`;
                    msg += `👉 ${link}\n\n`;
                } else if (spotsLeft <= 3) {
                    msg += `⚡ *¡Últimas ${spotsLeft} plazas!*\n`;
                    msg += `👉 ${link}\n\n`;
                } else {
                    msg += `✅ *Plazas disponibles*\n`;
                    msg += `👉 ${link}\n\n`;
                }
            });
        });

        if (footer && footer.trim()) {
            msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
            msg += `${footer.trim()}\n`;
        }

        return msg;
    },

    /**
     * Abre el modal visual para configurar y enviar la cartelera multi-torneo
     */
    async openCarteleraModal() {
        // Eliminar modal previo si existe
        const oldModal = document.getElementById('sp-cartelera-modal-root');
        if (oldModal) oldModal.remove();

        // 1. Obtener eventos activos
        let events = [];
        try {
            if (window._currentAmericanasCache && window._currentAmericanasCache.length > 0) {
                events = [...window._currentAmericanasCache];
            } else if (window.EventService && window.AppConstants) {
                events = await window.EventService.getAll(window.AppConstants.EVENT_TYPES.AMERICANA);
            } else if (window.FirebaseDB?.americanas) {
                events = await window.FirebaseDB.americanas.getAll();
            }
        } catch (e) {
            console.warn("Error cargando americanas para cartelera:", e);
        }

        // Cargar entrenos también si están disponibles
        try {
            if (window.FirebaseDB?.entrenos) {
                const entrenos = await window.FirebaseDB.entrenos.getAll();
                if (Array.isArray(entrenos)) {
                    events = [...events, ...entrenos.map(x => ({ ...x, type: 'entreno' }))];
                }
            }
        } catch (e) {}

        // Filtrar solo eventos no finalizados
        events = events.filter(e => e && e.status !== 'finished' && e.status !== 'cancelado');

        // Ordenar cronológicamente
        events.sort((a, b) => {
            const da = new Date(a.date ? (a.date.includes('/') ? a.date.split('/').reverse().join('-') : a.date) : 0);
            const db = new Date(b.date ? (b.date.includes('/') ? b.date.split('/').reverse().join('-') : b.date) : 0);
            return da - db;
        });

        const modal = document.createElement('div');
        modal.id = 'sp-cartelera-modal-root';
        modal.style.cssText = `
            position: fixed; inset: 0; background: rgba(3, 7, 18, 0.94);
            backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
            z-index: 999999; display: flex; align-items: center; justify-content: center;
            padding: 16px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            animation: fadeIn 0.2s ease-out;
        `;

        modal.innerHTML = `
            <div style="background: #0b101b; width: 100%; max-width: 820px; max-height: 92vh; border-radius: 24px; border: 1.5px solid rgba(37, 211, 102, 0.35); box-shadow: 0 25px 60px rgba(0,0,0,0.8); display: flex; flex-direction: column; overflow: hidden; color: #fff;">
                
                <!-- HEADER -->
                <div style="padding: 18px 24px; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: space-between; background: linear-gradient(90deg, rgba(37, 211, 102, 0.15), rgba(204, 255, 0, 0.05));">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 40px; height: 40px; border-radius: 12px; background: #25D366; display: flex; align-items: center; justify-content: center; color: #000; font-size: 1.3rem;">
                            <i class="fab fa-whatsapp"></i>
                        </div>
                        <div>
                            <div style="font-weight: 900; font-size: 1.15rem; color: #fff;">CARTELERA DE TORNEOS (WHATSAPP)</div>
                            <div style="font-size: 0.78rem; color: #94a3b8;">Genera y comparte el menú de convocatorias con enlaces a somospadel.eu</div>
                        </div>
                    </div>
                    <button id="sp-cartelera-close-btn" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #fff; width: 34px; height: 34px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1rem;">
                        ✕
                    </button>
                </div>

                <!-- BODY (Dos Columnas: Configuración & Preview) -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 20px; overflow-y: auto; flex: 1;">
                    
                    <!-- COLUMNA IZQUIERDA: CONFIGURACIÓN -->
                    <div style="display: flex; flex-direction: column; gap: 14px;">
                        <div>
                            <label style="display: block; font-size: 0.8rem; font-weight: 700; color: #25D366; margin-bottom: 6px;">
                                🚨 TITULAR GANCHO:
                            </label>
                            <input id="sp-cart-header" type="text" value="🚨🎾 ¡HOY TODO SOLD OUT… RESERVA TU TURNO DE MAÑANA! 🎾🚨" style="width: 100%; box-sizing: border-box; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; color: #fff; padding: 10px; font-size: 0.85rem;">
                        </div>

                        <div>
                            <label style="display: block; font-size: 0.8rem; font-weight: 700; color: #CCFF00; margin-bottom: 6px;">
                                🎁 SORTEO / ANUNCIO DESTACADO (Opcional):
                            </label>
                            <textarea id="sp-cart-promo" rows="3" style="width: 100%; box-sizing: border-box; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; color: #fff; padding: 10px; font-size: 0.82rem; resize: vertical;">🎁 ¡ÚLTIMO DÍA DE SORTEO!
Apúntate antes de las 22:00 y entrarás en el sorteo de 1 americana gratis 🍀</textarea>
                        </div>

                        <div>
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                <label style="font-size: 0.8rem; font-weight: 700; color: #38bdf8;">
                                    🎾 EVENTOS A INCLUIR (${events.length}):
                                </label>
                                <span style="font-size: 0.72rem; color: #94a3b8; cursor: pointer; text-decoration: underline;" id="sp-toggle-all-events">Seleccionar todos</span>
                            </div>
                            <div id="sp-cart-events-list" style="max-height: 200px; overflow-y: auto; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 10px; display: flex; flex-direction: column; gap: 8px;">
                                ${events.length === 0 ? '<div style="color:#94a3b8; font-size:0.8rem; text-align:center; padding:15px;">No hay eventos activos programados.</div>' : ''}
                                ${events.map((e, idx) => {
                                    const courts = parseInt(e.max_courts || e.courts || 4, 10);
                                    const maxP = courts * 4;
                                    const pCount = (e.players || e.registeredPlayers || []).length;
                                    const isSoldOut = pCount >= maxP;
                                    const badge = isSoldOut ? '⛔ SOLD OUT' : `✅ ${pCount}/${maxP}`;
                                    return `
                                        <label style="display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.03); padding: 8px 10px; border-radius: 8px; cursor: pointer; font-size: 0.8rem;">
                                            <input type="checkbox" class="sp-cart-evt-cb" data-event-id="${e.id || e._id}" checked style="accent-color: #25D366; width: 16px; height: 16px;">
                                            <div style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                                <strong style="color: #fff;">${e.date || ''} ${e.time || ''}</strong> · ${e.name || 'Torneo'}
                                            </div>
                                            <span style="font-size: 0.72rem; padding: 2px 6px; border-radius: 6px; background: ${isSoldOut ? 'rgba(239,68,68,0.2)' : 'rgba(37,211,102,0.2)'}; color: ${isSoldOut ? '#ef4444' : '#25D366'}; font-weight: 700;">
                                                ${badge}
                                            </span>
                                        </label>
                                    `;
                                }).join('')}
                            </div>
                        </div>

                        <div>
                            <label style="display: block; font-size: 0.8rem; font-weight: 700; color: #94a3b8; margin-bottom: 6px;">
                                ⚡ CIERRE / LLAMADA A LA ACCIÓN:
                            </label>
                            <input id="sp-cart-footer" type="text" value="⚡ ¡Elige tu turno y asegura tu plaza antes de que vuelen!" style="width: 100%; box-sizing: border-box; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; color: #fff; padding: 10px; font-size: 0.85rem;">
                        </div>
                    </div>

                    <!-- COLUMNA DERECHA: PREVISUALIZACIÓN -->
                    <div style="display: flex; flex-direction: column;">
                        <label style="display: block; font-size: 0.8rem; font-weight: 700; color: #a78bfa; margin-bottom: 6px;">
                            📱 VISTA PREVIA (WHATSAPP):
                        </label>
                        <textarea id="sp-cart-preview" readonly style="flex: 1; min-height: 380px; width: 100%; box-sizing: border-box; background: #070d19; border: 1px solid rgba(255,255,255,0.12); border-radius: 14px; color: #e2e8f0; font-family: monospace; font-size: 0.82rem; padding: 14px; line-height: 1.5; resize: none;"></textarea>
                    </div>
                </div>

                <!-- FOOTER ACTIONS -->
                <div style="padding: 16px 24px; border-top: 1px solid rgba(255,255,255,0.08); background: #070d19; display: flex; justify-content: flex-end; gap: 12px; align-items: center;">
                    <button id="sp-cart-copy-btn" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2); color: #fff; font-weight: 800; padding: 12px 20px; border-radius: 14px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 0.9rem;">
                        <i class="far fa-copy"></i> COPIAR TEXTO
                    </button>
                    <button id="sp-cart-send-btn" style="background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); border: none; color: #fff; font-weight: 900; padding: 12px 26px; border-radius: 14px; cursor: pointer; display: flex; align-items: center; gap: 10px; font-size: 0.95rem; box-shadow: 0 6px 20px rgba(37, 211, 102, 0.4);">
                        <i class="fab fa-whatsapp" style="font-size: 1.2rem;"></i> ABRIR EN WHATSAPP
                    </button>
                </div>

            </div>
        `;

        document.body.appendChild(modal);

        // Controladores de actualización
        const updatePreview = () => {
            const h = document.getElementById('sp-cart-header').value;
            const p = document.getElementById('sp-cart-promo').value;
            const f = document.getElementById('sp-cart-footer').value;

            const checkedIds = new Set(
                Array.from(document.querySelectorAll('.sp-cart-evt-cb:checked')).map(cb => cb.dataset.eventId)
            );

            const selectedEvents = events.filter(e => checkedIds.has(e.id || e._id));
            const msg = window.WhatsAppService.generateCarteleraBroadcast(selectedEvents, {
                header: h,
                promo: p,
                footer: f
            });

            document.getElementById('sp-cart-preview').value = msg;
        };

        // Event Listeners
        document.getElementById('sp-cartelera-close-btn').onclick = () => modal.remove();
        document.getElementById('sp-cart-header').oninput = updatePreview;
        document.getElementById('sp-cart-promo').oninput = updatePreview;
        document.getElementById('sp-cart-footer').oninput = updatePreview;
        document.querySelectorAll('.sp-cart-evt-cb').forEach(cb => cb.onchange = updatePreview);

        document.getElementById('sp-toggle-all-events').onclick = () => {
            const cbs = document.querySelectorAll('.sp-cart-evt-cb');
            const anyUnchecked = Array.from(cbs).some(c => !c.checked);
            cbs.forEach(c => c.checked = anyUnchecked);
            updatePreview();
        };

        // Botón Copiar
        document.getElementById('sp-cart-copy-btn').onclick = async () => {
            const text = document.getElementById('sp-cart-preview').value;
            if (!text) return;
            try {
                if (navigator.clipboard?.writeText) {
                    await navigator.clipboard.writeText(text);
                } else {
                    const el = document.getElementById('sp-cart-preview');
                    el.select();
                    document.execCommand('copy');
                }
                const btn = document.getElementById('sp-cart-copy-btn');
                const orig = btn.innerHTML;
                btn.innerHTML = '✅ ¡COPIADO!';
                setTimeout(() => { btn.innerHTML = orig; }, 2000);
            } catch (err) {
                alert('Texto copiado al portapapeles');
            }
        };

        // Botón Enviar WhatsApp
        document.getElementById('sp-cart-send-btn').onclick = () => {
            const text = document.getElementById('sp-cart-preview').value;
            if (!text) return;
            const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
            window.WhatsAppService._openUrlSafely(url);
        };

        // Render inicial
        updatePreview();
    }
};

console.log("💬 WhatsAppService V9.0 BROADCAST PRO & CONVOCATORIA STUDIO Loaded.");
