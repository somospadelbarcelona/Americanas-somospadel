/**
 * WhatsAppService.js - VERSION 8.0 PREMIUM
 * 🛡️ ULTRA-ROBUST EMOJI ENCODING & EXPERT LAYOUT.
 * Customized layout and empty slot handling.
 */

window.WhatsAppService = {

    /**
     * Emojis as explicit Char Codes (Surrogate pairs)
     */
    E: {
        SPARKLE: String.fromCharCode(10024),                      // ✨ (U+2728)
        TENNIS: String.fromCharCode(55356, 57278),                // 🎾 (U+1F3BE)
        MALE: String.fromCharCode(55357, 57017),                  // 🚹 (U+1F6B9)
        FEMALE: String.fromCharCode(55357, 57018),                // 🚺 (U+1F6BA)
        MIXED: String.fromCharCode(55357, 57019),                 // 🚻 (U+1F6BB)
        CALENDAR: String.fromCharCode(55357, 56517),               // 📅 (U+1F4C5)
        TIMER: String.fromCharCode(9201, 65039),                  // ⏱️ (U+23F1)
        DRUM: String.fromCharCode(55358, 56641),                  // 🥁 (U+1F941)
        WATER: String.fromCharCode(55357, 56486),                 // 💦 (U+1F4A6)
        GIFT: String.fromCharCode(55356, 57217),                  // 🎁 (U+1F381)
        PIN: String.fromCharCode(55357, 56525),                   // 📍 (U+1F4CC)
        MONEY: String.fromCharCode(55357, 56496),                  // 💰 (U+1F4B0)
        RED: String.fromCharCode(55357, 56628),                    // 🔴 (U+1F534)
        STAR: String.fromCharCode(11088, 65039),                   // ⭐ (U+2B50)
        BOLT: String.fromCharCode(9889),                          // ⚡ (U+26A1)
        LINK: String.fromCharCode(55357, 56599),                  // 🔗 (U+1F517)
        DOWN: String.fromCharCode(55357, 56391),                  // 👇 (U+1F447)
        BALANCE: String.fromCharCode(9878, 65039),                 // ⚖️ (U+2696)
        EURO: String.fromCharCode(8364),                           // € (U+20AC)
        TROPHY: String.fromCharCode(55356, 57286)                  // 🏆 (U+1F3C6)
    },

    /**
     * Generates a formatted message for an event (V8.0 Premium Edition)
     * Optimized for high-end mobile display and instant clarity.
     */
    generateMessage(event, richPlayers = null) {
        if (!event) return '';
        const E = this.E;

        const name = (event.name || 'TORNEO SOMOSPADEL').toUpperCase();
        const type = (event.category || 'open').toLowerCase();
        const isMale = type === 'male' || type === 'masculina';
        const isFemale = type === 'female' || type === 'femenina';
        const isMixed = type === 'mixed' || type === 'mixto' || type === 'mixta';
        const isAmericana = name.includes('AMERICANA') || event.type === 'americana';

        // 1. HEADER LOGIC
        let headerTitle = isAmericana ? 'AMERICANA' : 'ENTRENO';
        let catEmoji = E.TENNIS;
        if (isMale) { catEmoji = E.MALE; headerTitle += ' MASCULINO'; }
        else if (isFemale) { catEmoji = E.FEMALE; headerTitle += ' FEMENINO'; }
        else if (isMixed) { catEmoji = E.MIXED; headerTitle += ' MIXTO'; }

        const dateStr = this._formatDate(event.date);
        const timeStr = event.time || '10:00';
        const endTimeStr = event.time_end ? " a " + event.time_end : '';
        const location = event.location || 'SomosPadel BCN';

        const players = event.players || [];
        const maxPlayers = (parseInt(event.max_courts) || 4) * 4;
        const spotsLeft = Math.max(0, maxPlayers - players.length);

        const pMember = event.price_members || 20;
        const pExt = event.price_external || 25;

        // --- START MESSAGE CONSTRUCTION ---
        let msg = `${E.SPARKLE} *${name}* ${E.SPARKLE}\n`;
        msg += "━━━━━━━━━━━━━━━━━━\n\n";

        // SECTION: LOGISTICS
        msg += `${E.CALENDAR} *DÍA:* ${dateStr}\n`;
        msg += `${E.TIMER} *HORA:* ${timeStr}${endTimeStr}\n`;
        msg += `${E.PIN} *LUGAR:* ${location}\n\n`;

        // SECTION: DETAILS
        msg += `◈ *TIPO:* ${headerTitle}\n`;
        msg += `◈ *MODO:* ${event.pair_mode === 'rotating' ? 'Individual / Twister' : 'Pareja Fija'}\n`;
        msg += `◈ *NIVEL:* ${event.level_min || '3.5'} - ${event.level_max || '4.5'}\n\n`;

        // SECTION: BENEFITS (Professional Bullet Points)
        msg += "*INCLUYE:*\n";
        msg += `• Pelotas Nuevas ${E.TENNIS}\n`;

        // Water policy: Only in El Prat, strictly NOT in Delfos
        const isDelfos = location.toUpperCase().includes('DELFOS');
        const isPrat = location.toUpperCase().includes('PRAT');
        if (isPrat && !isDelfos) {
            msg += `• Agua para cada jugador ${E.WATER}\n`;
        }

        if (isAmericana) msg += `• Premios para ganadores ${E.GIFT}\n`;
        msg += `• Gestión y Cuadros automatizados a través de la app a tiempo real ${E.STAR}\n\n`;

        msg += "━━━━━━━━━━━━━━━━━━\n\n";

        // SECTION: AVAILABILITY
        if (spotsLeft === 0) {
            msg += `${E.RED} *CUADRO COMPLETO*\n\n`;
        } else {
            msg += `${E.BOLT} *¡ÚLTIMAS ${spotsLeft} PLAZAS!* ${E.BOLT}\n\n`;
        }

        // SECTION: BALANCE (Explicit for Mixed/Female)
        if ((isMixed || isFemale) && richPlayers) {
            const m = richPlayers.filter(p => ['male', 'chico', 'hombre', 'masculino'].includes((p.gender || '').toLowerCase())).length;
            const f = richPlayers.filter(p => ['female', 'chica', 'mujer', 'femenino'].includes((p.gender || '').toLowerCase())).length;

            if (isMixed && (m + f > 0)) {
                msg += `${E.BALANCE} *Balance:* ${E.MALE} ${m} - ${E.FEMALE} ${f}\n\n`;
            } else if (isFemale && f > 0) {
                msg += `${E.BALANCE} *Jugadoras:* ${E.FEMALE} ${f}\n\n`;
            }
        }

        // SECTION: PLAYER LIST
        msg += "*LISTA DE INSCRITOS:*\n";

        const displayList = richPlayers || players;
        const processedIds = new Set();
        let displayCount = 0;

        displayList.forEach((p) => {
            const pId = p.id || p.uid;
            if (processedIds.has(pId)) return;

            displayCount++;
            let pName = p.name ? p.name.trim() : 'Jugador';
            const lvl = p.level || p.playtomic_level || '';
            const lvlStr = lvl ? ` (N${lvl})` : "";

            // --- PAIR DETECTION & LOGIC (Professional Format) ---
            const isFixed = event.pair_mode === 'fixed' || event.pair_mode === 'fixed_auto' || name.includes('FIJA');
            const shouldForcePairLayout = isFixed || isMixed || (p.partner_name && String(p.partner_name).trim().length > 0);

            if (shouldForcePairLayout) {
                if (p.partner_name) {
                    let partnerName = p.partner_name;
                    let partnerLvlStr = "";

                    let partnerObj = null;
                    if (p.partner_id) {
                        partnerObj = displayList.find(x => (x.id || x.uid) === p.partner_id);
                    } else {
                        partnerObj = displayList.find(x => x.name && x.name.toLowerCase() === p.partner_name.toLowerCase() && (x.id || x.uid) !== pId);
                    }

                    if (partnerObj) {
                        processedIds.add(partnerObj.id || partnerObj.uid);
                        if (partnerObj.level) partnerLvlStr = ` (N${partnerObj.level})`;
                    }

                    msg += `${displayCount}. ${E.TENNIS} *${pName}*${lvlStr} & *${partnerName}*${partnerLvlStr}\n`;
                } else {
                    msg += `${displayCount}. ${E.TENNIS} *${pName}*${lvlStr} - _(Busca Pareja)_\n`;
                }
                processedIds.add(pId);
                return;
            }

            // Standard individual layout
            let gIcon = '• ';
            const g = (p.gender || '').toLowerCase();
            if (['male', 'chico', 'hombre', 'masculino'].includes(g)) gIcon = E.MALE + " ";
            else if (['female', 'chica', 'mujer', 'femenino'].includes(g)) gIcon = E.FEMALE + " ";

            msg += `${displayCount}. ${gIcon} *${pName}*${lvlStr}\n`;
            processedIds.add(pId);
        });

        // Vacancy lines
        const isPairLayout = event.pair_mode === 'fixed' || event.pair_mode === 'fixed_auto' || name.includes('FIJA') || isMixed;
        const totalRows = isPairLayout ? (maxPlayers / 2) : maxPlayers;
        for (let i = displayCount; i < totalRows; i++) {
            msg += `${i + 1}. ${E.TENNIS} _(Libre)_\n`;
        }

        // SECTION: PRICES & CTA
        msg += "\n━━━━━━━━━━━━━━━━━━\n";
        msg += `${E.MONEY} *PRECIO:* ${pMember}${E.EURO} socios / ${pExt}${E.EURO} externos\n\n`;
        msg += `${E.DOWN} *RESERVA TU PLAZA AQUÍ:* \n`;

        const baseUrl = "https://somospadelbarcelona.github.io/Americanas-somospadel";
        const sectionHash = isAmericana ? "#americanas" : "#entrenos";
        msg += `${E.LINK} ${baseUrl}/${sectionHash}\n`;

        return msg;
    },

    /**
     * Opens WhatsApp with the pre-filled message
     */
    async shareStartFromAdmin(event) {
        try {
            console.log("📤 WhatsApp Share Start (V8.0 Premium)");
            let richPlayers = null;

            // Optimization: Fetch players only if needed and try to be fast
            if (event.players && event.players.length > 0) {
                try {
                    // Try to get cached players from Admin context if available to save time
                    let allUsers = window._allPlayersCache;
                    if (!allUsers) {
                        console.log("⏱️ Fetching players for share...");
                        allUsers = await window.FirebaseDB.players.getAll();
                        window._allPlayersCache = allUsers; // Cache it
                    }

                    richPlayers = event.players.map(p => {
                        const pid = (typeof p === 'string') ? p : (p.id || p.uid);
                        const user = allUsers.find(u => (u.id === pid) || (u.uid === pid));
                        return {
                            ...p,
                            name: (user ? user.name : (p.name || 'Jugador')),
                            level: user ? (user.level || user.self_rate_level || p.level) : p.level,
                            gender: user ? user.gender : (p.gender || null),
                            teams: user ? (user.team_somospadel || user.EQUIPOS || user.equipos || user.Equipos) : (p.teams || p.team_somospadel || p.EQUIPOS || null)
                        };
                    });
                } catch (err) { console.warn("Player enrichment failed, using basic data", err); }
            }

            const text = this.generateMessage(event, richPlayers);
            const encodedText = encodeURIComponent(text);
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || isIOS;

            if (isMobile && navigator.share) {
                try {
                    await navigator.share({
                        title: 'Evento Somospadel',
                        text: text
                    });
                    return;
                } catch (e) { console.warn("Native share failed", e); }
            }

            const url = "https://api.whatsapp.com/send?text=" + encodedText;

            if (isIOS) {
                window.location.href = url;
            } else {
                window.open(url, '_blank');
            }
        } catch (e) {
            console.error("WhatsApp Error:", e);
            alert("Error al compartir en WhatsApp");
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
            } catch (e) { console.warn("Native share failed", e); }
        }

        const encodedText = encodeURIComponent(msg);
        const url = "https://api.whatsapp.com/send?text=" + encodedText;

        if (isIOS) {
            window.location.href = url;
        } else {
            window.open(url, '_blank');
        }
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
            } catch (e) { }
        }

        const encodedText = encodeURIComponent(msg);
        const url = "https://api.whatsapp.com/send?text=" + encodedText;
        if (isIOS) window.location.href = url;
        else window.open(url, '_blank');
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

        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        if (isIOS) window.location.href = url;
        else window.open(url, '_blank');
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
                console.warn("Native share failed, falling back to WhatsApp link", e); 
            }
        }

        // Fallback to WhatsApp Web/App link
        const encodedText = encodeURIComponent(text);
        const url = "https://api.whatsapp.com/send?text=" + encodedText;

        if (isIOS) {
            window.location.href = url;
        } else {
            window.open(url, '_blank');
        }
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

console.log("💬 WhatsAppService V8.5 PREMIUM Loaded (Hybrid API Support)");
