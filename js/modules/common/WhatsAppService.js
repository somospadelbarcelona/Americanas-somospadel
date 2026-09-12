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

        const dateStr = this._formatDate(event.date);
        const timeStr = event.time || '10:00';
        const endTimeStr = event.time_end ? " a " + event.time_end : '';
        const location = event.location || 'SomosPadel BCN';

        const players = event.players || [];
        const maxPlayers = (parseInt(event.max_courts) || 4) * 4;
        const spotsLeft = Math.max(0, maxPlayers - players.length);

        const pMember = event.price_members || 10;
        const pExt = event.price_external || 10;

        // Level text
        let levelText = '3.5 - 4.5';
        if (event.level && String(event.level).trim()) {
            levelText = String(event.level).trim();
        } else if (event.level_min && event.level_max) {
            levelText = `${event.level_min} - ${event.level_max}`;
        } else if (event.level_min) {
            levelText = `${event.level_min}`;
        } else if (event.level_max) {
            levelText = `Hasta ${event.level_max}`;
        }

        // Pair mode detection
        const isFixed = event.pair_mode === 'fixed' || event.pair_mode === 'fixed_auto' || event.pair_mode === 'fixed_admin' || name.includes('FIJA');
        const modeLabel = isFixed ? 'Pareja Fija' : 'Twister (Individual)';

        // Water policy: Only in El Prat, strictly NOT in Delfos
        const isDelfos = location.toUpperCase().includes('DELFOS');
        const isPrat = location.toUpperCase().includes('PRAT');

        let extras = ['Bolas Nuevas 🎾'];
        if (isPrat && !isDelfos) extras.push('Agua 💦');
        if (isAmericana) extras.push('Premios 🏆');
        extras.push('App en Directo 📱');
        const extrasStr = extras.join(' · ');

        // --- START MESSAGE CONSTRUCTION ---
        let msg = `🎾✨ *SOMOSPADEL BCN* ✨🎾\n`;
        msg += `🏆 *${name}* 🏆\n`;
        msg += "═════════════════════════\n\n";

        // SECTION: DATOS ENTRENO / DATOS AMERICANA
        const sectionTitle = isAmericana ? 'DATOS AMERICANA' : 'DATOS ENTRENO';
        msg += `📍 *${sectionTitle}:*\n`;
        msg += `🔹 📅 *Fecha:* ${dateStr}\n`;
        msg += `🔹 ⏱️ *Hora:* ${timeStr}${endTimeStr}\n`;
        msg += `🔹 🏟️ *Club:* ${location}\n\n`;

        // SECTION: DETALLES
        msg += `🎯 *DETALLES:*\n`;
        msg += `🔸 🌪️ *Modo:* ${modeLabel}\n`;
        msg += `🔸 📊 *Nivel:* ${levelText}\n`;
        msg += `🔸 🎁 *Extras:* ${extrasStr}\n\n`;

        // SECTION: AVAILABILITY & BALANCE
        if (spotsLeft === 0) {
            msg += `🔴 *¡CUADRO COMPLETO!* 🔴\n`;
        } else {
            msg += `🔥 *¡ÚLTIMAS ${spotsLeft} PLAZAS DISPONIBLES!* 🔥\n`;
        }

        if ((isMixed || isFemale) && richPlayers) {
            const m = richPlayers.filter(p => ['male', 'chico', 'hombre', 'masculino'].includes((p.gender || '').toLowerCase())).length;
            const f = richPlayers.filter(p => ['female', 'chica', 'mujer', 'femenino'].includes((p.gender || '').toLowerCase())).length;

            if (isMixed && (m + f > 0)) {
                msg += `⚖️ *Balance:* 🚹 ${m} Chicos · 🚺 ${f} Chicas\n`;
            } else if (isFemale && f > 0) {
                msg += `⚖️ *Jugadoras:* 🚺 ${f}\n`;
            }
        }
        msg += `\n`;

        // Helper for badges with emoji keycaps (1️⃣..9️⃣, 1️⃣0️⃣, 1️⃣1️⃣, 1️⃣2️⃣...)
        const digitEmojis = {
            '0': '0️⃣',
            '1': '1️⃣',
            '2': '2️⃣',
            '3': '3️⃣',
            '4': '4️⃣',
            '5': '5️⃣',
            '6': '6️⃣',
            '7': '7️⃣',
            '8': '8️⃣',
            '9': '9️⃣'
        };
        const getNumBadge = (num) => {
            return String(num).split('').map(d => digitEmojis[d] || d).join('');
        };

        // SECTION: PLAYER LIST
        const displayList = richPlayers || players;
        const processedIds = new Set();
        let displayCount = 0;

        const isPairLayout = isFixed;
        const totalRows = isPairLayout ? Math.floor(maxPlayers / 2) : maxPlayers;

        msg += `👥 *INSCRIPCIONES (${players.length}/${maxPlayers}):*\n`;

        if (isPairLayout) {
            displayList.forEach((p) => {
                const pId = p.id || p.uid;
                if (processedIds.has(pId)) return;

                displayCount++;
                const badge = getNumBadge(displayCount);
                let pName = p.name ? p.name.trim() : 'Jugador';
                const lvl = p.level || p.playtomic_level || '';
                const lvlStr = lvl ? ` 🎖️ _N${lvl}_` : '';

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
                            partnerLvlStr = ` 🎖️ _N${partnerObj.level || partnerObj.playtomic_level}_`;
                        }
                    }

                    msg += `${badge} 🎾 *${pName}*${lvlStr} & *${partnerName}*${partnerLvlStr}\n`;
                } else {
                    msg += `${badge} 🎾 *${pName}*${lvlStr} · _(Busca Pareja)_\n`;
                }
                processedIds.add(pId);
            });

            for (let i = displayCount; i < totalRows; i++) {
                const badge = getNumBadge(i + 1);
                msg += `${badge} 🟢 _(Pareja Libre)_\n`;
            }
        } else {
            // Individual layout (Twister / Rotating)
            displayList.forEach((p) => {
                const pId = p.id || p.uid;
                if (processedIds.has(pId)) return;

                displayCount++;
                const badge = getNumBadge(displayCount);
                let pName = p.name ? p.name.trim() : 'Jugador';
                const lvl = p.level || p.playtomic_level || '';
                const lvlStr = lvl ? ` 🎖️ _N${lvl}_` : '';

                let gIcon = '🎾';
                const g = (p.gender || '').toLowerCase();
                if (['male', 'chico', 'hombre', 'masculino'].includes(g)) gIcon = '🚹';
                else if (['female', 'chica', 'mujer', 'femenino'].includes(g)) gIcon = '🚺';

                msg += `${badge} ${gIcon} *${pName}*${lvlStr}\n`;
                processedIds.add(pId);
            });

            for (let i = displayCount; i < totalRows; i++) {
                const badge = getNumBadge(i + 1);
                msg += `${badge} 🟢 _(Disponible)_\n`;
            }
        }

        // SECTION: PRICES & CTA
        msg += `\n═════════════════════════\n`;
        msg += `💳 *TARIFA:* ${pMember}€ socios 🤝 / ${pExt}€ externos\n`;
        msg += `🚀 *¡APÚNTATE EN UN CLIC!*\n`;

        const baseUrl = "https://somospadelbarcelona.github.io/Americanas-somospadel";
        const sectionHash = isAmericana ? "#americanas" : "#entrenos";
        msg += `👉 ${baseUrl}/${sectionHash}\n`;
        msg += `═════════════════════════\n`;

        return msg;
    },

    /**
     * Safely opens a WhatsApp URL without navigating the current window (prevents iOS Safari teardown/Firebase termination)
     */
    _openUrlSafely(url) {
        try {
            const win = window.open(url, '_blank');
            if (!win || win.closed || typeof win.closed === 'undefined') {
                const a = document.createElement('a');
                a.href = url;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                document.body.appendChild(a);
                a.click();
                setTimeout(() => {
                    if (a.parentNode) a.parentNode.removeChild(a);
                }, 1000);
            }
        } catch (e) {
            console.warn("⚠️ _openUrlSafely fallback:", e);
            try {
                const a = document.createElement('a');
                a.href = url;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                document.body.appendChild(a);
                a.click();
                setTimeout(() => {
                    if (a.parentNode) a.parentNode.removeChild(a);
                }, 1000);
            } catch (err2) {
                window.open(url, '_blank');
            }
        }
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
                    let allUsers = window._allPlayersCache || window.allUsersCache;
                    if (!allUsers && window.FirebaseDB?.players?.getAll) {
                        try {
                            console.log("⏱️ Fetching players for share...");
                            allUsers = await window.FirebaseDB.players.getAll();
                            window._allPlayersCache = allUsers; // Cache it
                        } catch (pErr) {
                            console.warn("⚠️ [WhatsAppService] Error al obtener jugadores de BD, usando fallback local:", pErr.message);
                            allUsers = window.allUsersCache || [];
                        }
                    }

                    if (allUsers && Array.isArray(allUsers) && allUsers.length > 0) {
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
                    }
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
                } catch (e) {
                    if (e.name === 'AbortError' || (e.message && e.message.toLowerCase().includes('abort'))) {
                        console.log("ℹ️ Compartir cancelado por el usuario.");
                        return;
                    }
                    console.warn("Native share failed, fallback to direct WhatsApp URL", e);
                }
            }

            const url = "https://api.whatsapp.com/send?text=" + encodedText;
            this._openUrlSafely(url);
        } catch (e) {
            console.error("WhatsApp Error:", e);
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

console.log("💬 WhatsAppService V8.5 PREMIUM Loaded (Hybrid API Support)");
