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
        const baseUrl = "https://somospadelbarcelona.github.io/Americanas-somospadel/";
        if (!event) return baseUrl;
        const name = (event.name || '').toUpperCase();
        const isEntreno = event.type === 'entreno' || name.includes('ENTRENO');
        const sectionHash = isEntreno ? "#entrenos" : "#americanas";
        const rawId = event.id || event._id || event.uid;
        const eventId = rawId ? encodeURIComponent(String(rawId).trim()) : '';
        const queryParam = eventId ? `?event=${eventId}` : '';
        return `${baseUrl}${queryParam}${sectionHash}`;
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

        const displayList = (richPlayers || players || []).map(p => ({ ...(typeof p === 'string' ? { id: p, name: p } : (p || {})) }));
        const metrics = this._calculateEventMetrics(displayList);
        const progressBar = this._generateProgressBar(players.length, maxPlayers);

        const hasFixedPairs = Array.isArray(event.fixed_pairs) && event.fixed_pairs.length > 0;
        const hasPartnerInPlayers = displayList.some(p => p.partner_id || p.partner_name);
        const isFixed = event.pair_mode === 'fixed' || event.pair_mode === 'fixed_auto' || event.pair_mode === 'fixed_admin' || String(event.pair_mode || '').includes('fij') || name.includes('FIJA') || name.includes('PAREJA') || name.includes('PAREJAS') || name.includes('DUPLA') || hasFixedPairs || hasPartnerInPlayers;
        const modeLabel = isFixed ? 'Pareja Fija' : 'Twister (Individual)';

        const isDelfos = location.toUpperCase().includes('DELFOS');
        const isPrat = location.toUpperCase().includes('PRAT');

        let extras = ['Bolas Nuevas'];
        if (isPrat && !isDelfos) extras.push('Agua');
        if (isAmericana) extras.push('Premios');
        extras.push('App en Directo');
        const extrasStr = extras.join(' · ');

        // Deep link canónico directo al evento
        const deepLinkUrl = this.getEventCanonicalUrl(event);

        // Pre-sincronizar parejas desde fixed_pairs si existen
        if (hasFixedPairs) {
            event.fixed_pairs.forEach(fp => {
                const p1Id = String(fp.player1_id || (fp.player1 && (fp.player1.id || fp.player1.uid)) || (fp.p1 && (fp.p1.id || fp.p1.uid)) || '');
                const p2Id = String(fp.player2_id || (fp.player2 && (fp.player2.id || fp.player2.uid)) || (fp.p2 && (fp.p2.id || fp.p2.uid)) || '');
                const p1Name = String(fp.player1_name || (fp.player1 && fp.player1.name) || (fp.p1 && fp.p1.name) || '').trim().toUpperCase();
                const p2Name = String(fp.player2_name || (fp.player2 && fp.player2.name) || (fp.p2 && fp.p2.name) || '').trim().toUpperCase();

                const p1 = displayList.find(p => {
                    const pid = String(p.id || p.uid || '');
                    if (p1Id && pid === p1Id) return true;
                    if (p1Name && String(p.name || '').trim().toUpperCase() === p1Name) return true;
                    return false;
                });
                const p2 = displayList.find(p => {
                    const pid = String(p.id || p.uid || '');
                    if (p2Id && pid === p2Id) return true;
                    if (p2Name && String(p.name || '').trim().toUpperCase() === p2Name) return true;
                    return false;
                });
                if (p1 && p2 && p1 !== p2) {
                    p1.partner_id = p2.id || p2.uid;
                    p1.partner_name = p2.name;
                    p2.partner_id = p1.id || p1.uid;
                    p2.partner_name = p1.name;
                }
            });
        }

        // === CONSTRUCCIÓN DE LISTA DE JUGADORES (Pro & Clean con 01., 02., 10., 11., 12.) ===
        const processedIds = new Set();
        let displayCount = 0;
        const totalRows = isFixed ? Math.floor(maxPlayers / 2) : maxPlayers;
        let playerListText = '';

        if (isFixed) {
            const pairsFound = [];
            const singlesFound = [];

            // 1. Agrupar primero parejas de fixed_pairs
            if (hasFixedPairs) {
                event.fixed_pairs.forEach(fp => {
                    const p1Id = String(fp.player1_id || (fp.player1 && (fp.player1.id || fp.player1.uid)) || (fp.p1 && (fp.p1.id || fp.p1.uid)) || '');
                    const p2Id = String(fp.player2_id || (fp.player2 && (fp.player2.id || fp.player2.uid)) || (fp.p2 && (fp.p2.id || fp.p2.uid)) || '');
                    const p1Name = String(fp.player1_name || (fp.player1 && fp.player1.name) || (fp.p1 && fp.p1.name) || '').trim().toUpperCase();
                    const p2Name = String(fp.player2_name || (fp.player2 && fp.player2.name) || (fp.p2 && fp.p2.name) || '').trim().toUpperCase();

                    const p1 = displayList.find(p => {
                        const pid = String(p.id || p.uid || '');
                        if (processedIds.has(pid)) return false;
                        if (p1Id && pid === p1Id) return true;
                        if (p1Name && String(p.name || '').trim().toUpperCase() === p1Name) return true;
                        return false;
                    });

                    const p2 = displayList.find(p => {
                        const pid = String(p.id || p.uid || '');
                        if (processedIds.has(pid) || p === p1) return false;
                        if (p2Id && pid === p2Id) return true;
                        if (p2Name && String(p.name || '').trim().toUpperCase() === p2Name) return true;
                        return false;
                    });

                    if (p1 && p2) {
                        pairsFound.push({ p1, p2 });
                        processedIds.add(String(p1.id || p1.uid || ''));
                        processedIds.add(String(p2.id || p2.uid || ''));
                    }
                });
            }

            // 2. Emparejar el resto mediante partner_id o partner_name
            displayList.forEach(p => {
                const pId = String(p.id || p.uid || '');
                if (processedIds.has(pId)) return;

                const pPartnerId = String(p.partner_id || '');
                const pPartnerName = String(p.partner_name || '').trim().toUpperCase();

                let partnerObj = null;
                if (pPartnerId || pPartnerName) {
                    partnerObj = displayList.find(other => {
                        const oId = String(other.id || other.uid || '');
                        if (oId === pId || processedIds.has(oId)) return false;
                        if (pPartnerId && oId === pPartnerId) return true;
                        if (String(other.partner_id || '') === pId) return true;
                        const oName = String(other.name || '').trim().toUpperCase();
                        if (pPartnerName && (oName === pPartnerName || oName.includes(pPartnerName) || pPartnerName.includes(oName))) return true;
                        const oPartnerName = String(other.partner_name || '').trim().toUpperCase();
                        const myName = String(p.name || '').trim().toUpperCase();
                        if (oPartnerName && (myName === oPartnerName || myName.includes(oPartnerName) || oPartnerName.includes(myName))) return true;
                        return false;
                    });
                }

                if (partnerObj) {
                    pairsFound.push({ p1: p, p2: partnerObj });
                    processedIds.add(pId);
                    processedIds.add(String(partnerObj.id || partnerObj.uid || ''));
                } else {
                    singlesFound.push(p);
                    processedIds.add(pId);
                }
            });

            // Formatear parejas confirmadas
            pairsFound.forEach(pair => {
                displayCount++;
                const padNum = String(displayCount).padStart(2, '0');
                const p1Name = pair.p1.name ? pair.p1.name.trim() : 'Jugador 1';
                const p2Name = pair.p2.name ? pair.p2.name.trim() : 'Jugador 2';
                const l1 = pair.p1.level || pair.p1.playtomic_level || '';
                const l2 = pair.p2.level || pair.p2.playtomic_level || '';
                const l1Str = l1 ? ` _(N${parseFloat(l1).toFixed(2)})_` : '';
                const l2Str = l2 ? ` _(N${parseFloat(l2).toFixed(2)})_` : '';
                playerListText += `${padNum}. 🤝 *${p1Name}*${l1Str} & *${p2Name}*${l2Str}\n`;
            });

            // Formatear jugadores que buscan pareja
            if (singlesFound.length > 0) {
                if (pairsFound.length > 0) playerListText += `   --- _Buscan Pareja_ ---\n`;
                singlesFound.forEach(p => {
                    displayCount++;
                    const padNum = String(displayCount).padStart(2, '0');
                    const pName = p.name ? p.name.trim() : 'Jugador';
                    const lvl = p.level || p.playtomic_level || '';
                    const lvlStr = lvl ? ` _(N${parseFloat(lvl).toFixed(2)})_` : '';
                    playerListText += `${padNum}. 🔍 *${pName}*${lvlStr} · _(Busca Pareja)_\n`;
                });
            }

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
                            const isStr = typeof p === 'string';
                            const pid = isStr ? p : (p?.id || p?.uid);
                            const user = allUsers.find(u => (u.id === pid) || (u.uid === pid));
                            const baseObj = isStr ? { id: pid } : (p || {});
                            return {
                                ...baseObj,
                                id: pid,
                                name: user ? user.name : (baseObj.name || 'Jugador'),
                                level: user ? (user.level || user.self_rate_level || baseObj.level) : baseObj.level,
                                gender: user ? user.gender : (baseObj.gender || null),
                                teams: user ? (user.team_somospadel || user.EQUIPOS || user.equipos) : (baseObj.teams || null)
                            };
                        });
                    }
                } catch (pErr) {
                    console.warn("⚠️ Player enrichment fallback:", pErr);
                }
            }

            // Generar el mensaje optimizado para WhatsApp con el evento 100% actualizado
            const text = this.generateMessage(freshEvent, richPlayers);

            // Copia de seguridad automática en el portapapeles (sin agotar la activación táctil de usuario)
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(text).catch(() => {});
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
        const promo = (options.promo || '').trim();
        const footer = options.footer !== undefined ? options.footer : '⚡ ¡Elige tu turno y asegura tu plaza antes de que vuelen!';

        const normalizeDate = (d) => {
            if (!d) return '';
            const s = String(d).trim();
            if (s.includes('/')) {
                const p = s.split('/');
                if (p[0].length === 2 && p[2]?.length === 4) {
                    return `${p[2]}-${p[1].padStart(2, '0')}-${p[0].padStart(2, '0')}`;
                }
                if (p[0].length === 4) {
                    return `${p[0]}-${p[1].padStart(2, '0')}-${p[2].padStart(2, '0')}`;
                }
            }
            return s;
        };

        // Agrupar eventos por fecha normalizada
        const groups = {};
        events.forEach(evt => {
            const d = normalizeDate(evt.date) || 'Sin fecha';
            if (!groups[d]) groups[d] = [];
            groups[d].push(evt);
        });

        // Ordenar fechas cronológicamente
        const sortedDates = Object.keys(groups).sort((a, b) => a.localeCompare(b));

        const topHeader = `🎾 *SOMOSPADEL BCN | EVENTOS*\n\n📲 Inscripciones abiertas para próximos entrenos y americanas. Consulta plazas y apúntate desde la App Oficial:\n`;

        let msg = `${topHeader}\n`;
        if (header && header.trim()) {
            msg += `${header.trim()}\n\n`;
        }
        if (promo) {
            msg += `${promo}\n\n`;
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
                const isEntreno = e.type === 'entreno' || upperName.includes('ENTRENO');

                // Tarifas: tanto socio como no socio
                const pMember = (e.price_members !== undefined && e.price_members !== null && e.price_members !== '') 
                    ? e.price_members 
                    : (e.price_socio !== undefined && e.price_socio !== null ? e.price_socio : (e.price || 10));

                const pExt = (e.price_external !== undefined && e.price_external !== null && e.price_external !== '') 
                    ? e.price_external 
                    : (e.price_no_socio !== undefined && e.price_no_socio !== null ? e.price_no_socio : (e.price_externo || e.price || 10));

                let priceText = '';
                if (pMember && pExt && String(pMember) !== String(pExt)) {
                    priceText = `${pMember} € socios / ${pExt} € no socios`;
                } else if (pMember) {
                    priceText = `${pMember} € socios / ${pExt || pMember} € no socios`;
                } else {
                    priceText = `${e.price || 10} €`;
                }

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
                msg += `📍 ${location} · ${priceText}\n`;

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
     * Catálogo y Asistente IA de Titulares de alto impacto
     */
    getAITitleSuggestions(events = []) {
        const hasSoldOut = events.some(e => {
            const courts = parseInt(e.max_courts || e.courts || 4, 10);
            return (e.players || e.registeredPlayers || []).length >= (courts * 4);
        });

        const hasJamonera = events.some(e => (e.name || '').toUpperCase().includes('JAMON'));
        const hasWeekend = events.some(e => {
            try {
                const norm = e.date?.includes('/') ? e.date.split('/').reverse().join('-') : e.date;
                const day = new Date(norm + 'T00:00:00').getDay();
                return day === 0 || day === 5 || day === 6; // Viernes, sábado o domingo
            } catch(x) { return false; }
        });

        const suggestions = [
            '🚨🎾 ¡HOY TODO SOLD OUT… RESERVA TU TURNO DE MAÑANA! 🎾🚨',
            '🔥🎾 ¡ÚLTIMAS PLAZAS! CUADROS A PUNTO DE CERRAR EN SOMOSPADEL 🎾🔥',
            '🏆🎾 CARTELERA FIN DE SEMANA: ¡ELIGE TU TURNO EN 1 CLIC! 🎾🏆',
            '⚡🎾 CONVOCATORIA OFICIAL SOMOSPADEL: HORARIOS Y PLAZAS EN VIVO 🎾⚡',
            '🎾🔥 ¡PLANAZO DE PÁDEL! AMERICANAS Y ENTRENOS DISPONIBLES 🔥🎾',
            '🥓🎾 ¿MAÑANERA O JAMONERA? ¡ELIGE TU TURNO DE PÁDEL! 🎾🥓'
        ];

        if (hasSoldOut) {
            suggestions.unshift('🚨🎾 ¡TURNOS AGOTADOS! RESERVA TU PLAZA ANTES DE QUE VUELEN 🎾🚨');
        }
        if (hasWeekend) {
            suggestions.unshift('🏆🎾 ¡FIN DE SEMANA A TOPE EN SOMOSPADEL! CUADROS ACTIVOS 🎾🏆');
        }
        if (hasJamonera) {
            suggestions.unshift('🥓🎾 ¡ESPECIAL JAMONERA & MAÑANERAS! RESERVA TU PLAZA 🎾🥓');
        }

        return [...new Set(suggestions)];
    },

    /**
     * Abre el modal visual optimizado con IA y vista previa de WhatsApp
     */
    async openCarteleraModal() {
        const oldModal = document.getElementById('sp-cartelera-modal-root');
        if (oldModal) oldModal.remove();

        // 1. Cargar eventos activos
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

        try {
            if (window.FirebaseDB?.entrenos) {
                const entrenos = await window.FirebaseDB.entrenos.getAll();
                if (Array.isArray(entrenos)) {
                    events = [...events, ...entrenos.map(x => ({ ...x, type: 'entreno' }))];
                }
            }
        } catch (e) {}

        // 2. Normalización de fecha y filtrado estricto: SOLO HOY O DÍAS FUTUROS Y ABIERTOS
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        const normalizeDate = (d) => {
            if (!d) return '';
            const s = String(d).trim();
            if (s.includes('/')) {
                const p = s.split('/');
                if (p[0].length === 2 && p[2]?.length === 4) {
                    return `${p[2]}-${p[1].padStart(2, '0')}-${p[0].padStart(2, '0')}`;
                }
                if (p[0].length === 4) {
                    return `${p[0]}-${p[1].padStart(2, '0')}-${p[2].padStart(2, '0')}`;
                }
            }
            return s;
        };

        // EXCLUIR terminados, cancelados Y DÍAS ANTERIORES A HOY
        events = events.filter(e => {
            if (!e) return false;
            if (e.status === 'finished' || e.status === 'cancelado' || e.status === 'closed') return false;
            const evtDate = normalizeDate(e.date);
            if (!evtDate) return false;
            // Solo eventos desde HOY en adelante
            return evtDate >= todayStr;
        });

        // Ordenar cronológicamente (los más próximos primero)
        events.sort((a, b) => {
            const da = normalizeDate(a.date) + ' ' + (a.time || '00:00');
            const db = normalizeDate(b.date) + ' ' + (b.time || '00:00');
            return da.localeCompare(db);
        });

        // Eventos seleccionados por defecto (SOLO los próximos activos)
        const selectedIds = new Set(events.map(e => String(e.id || e._id)));

        // Sugerencias IA
        const aiTitles = this.getAITitleSuggestions(events);
        let currentTitleIndex = 0;

        const modal = document.createElement('div');
        modal.id = 'sp-cartelera-modal-root';
        modal.style.cssText = `
            position: fixed; inset: 0; background: rgba(3, 7, 18, 0.94);
            backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
            z-index: 999999; display: flex; align-items: center; justify-content: center;
            padding: 12px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            animation: fadeIn 0.2s ease-out; box-sizing: border-box;
        `;

        modal.innerHTML = `
            <div style="background: #0d121f; width: 100%; max-width: 1040px; height: 90vh; max-height: 900px; border-radius: 24px; border: 1.5px solid rgba(37, 211, 102, 0.35); box-shadow: 0 30px 80px rgba(0,0,0,0.85); display: flex; flex-direction: column; overflow: hidden; color: #fff;">
                
                <!-- HEADER MODAL -->
                <div style="padding: 16px 24px; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: space-between; background: linear-gradient(90deg, rgba(37, 211, 102, 0.18), rgba(204, 255, 0, 0.05)); flex-shrink: 0;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 42px; height: 42px; border-radius: 12px; background: #25D366; display: flex; align-items: center; justify-content: center; color: #000; font-size: 1.4rem; box-shadow: 0 4px 12px rgba(37, 211, 102, 0.4);">
                            <i class="fab fa-whatsapp"></i>
                        </div>
                        <div>
                            <div style="font-weight: 900; font-size: 1.2rem; color: #fff; letter-spacing: 0.3px;">CARTELERA DE TORNEOS (WHATSAPP PRO)</div>
                            <div style="font-size: 0.8rem; color: #94a3b8;">Menú multi-convocatoria con enlaces inteligentes a somospadel.eu</div>
                        </div>
                    </div>
                    <button id="sp-cartelera-close-btn" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #fff; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; transition: background 0.2s;">
                        ✕
                    </button>
                </div>

                <!-- BODY: DOS COLUMNAS -->
                <div style="display: grid; grid-template-columns: 1.1fr 1fr; gap: 18px; padding: 18px 24px; overflow-y: hidden; flex: 1; box-sizing: border-box;">
                    
                    <!-- COLUMNA IZQUIERDA: CONFIGURACIÓN Y SELECCIÓN -->
                    <div style="display: flex; flex-direction: column; gap: 14px; overflow-y: auto; padding-right: 8px;">
                        
                        <!-- TITULAR CON ASISTENTE IA -->
                        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 12px 14px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                <label style="font-size: 0.82rem; font-weight: 800; color: #25D366; display: flex; align-items: center; gap: 6px;">
                                    <span>🚨</span> TITULAR GANCHO:
                                </label>
                                <button id="sp-ai-btn" type="button" style="background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%); border: none; color: #fff; font-size: 0.74rem; font-weight: 800; padding: 5px 10px; border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; box-shadow: 0 2px 8px rgba(168, 85, 247, 0.4);">
                                    <span>✨</span> IA: GENERAR OTRO TITULAR
                                </button>
                            </div>
                            <input id="sp-cart-header" type="text" value="${aiTitles[0]}" style="width: 100%; box-sizing: border-box; background: #070a12; border: 1.5px solid rgba(37, 211, 102, 0.3); border-radius: 10px; color: #fff; padding: 10px 12px; font-size: 0.88rem; font-weight: 600;">
                            
                            <!-- Sugerencias rápidas IA -->
                            <div style="display: flex; gap: 6px; margin-top: 8px; overflow-x: auto; padding-bottom: 4px;">
                                <span class="sp-ai-pill" data-title="🚨🎾 ¡HOY TODO SOLD OUT… RESERVA TU TURNO DE MAÑANA! 🎾🚨" style="font-size: 0.7rem; background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #f87171; padding: 4px 8px; border-radius: 6px; cursor: pointer; white-space: nowrap;">🚨 Sold Out</span>
                                <span class="sp-ai-pill" data-title="🔥🎾 ¡ÚLTIMAS PLAZAS! CUADROS A PUNTO DE CERRAR EN SOMOSPADEL 🎾🔥" style="font-size: 0.7rem; background: rgba(245,158,11,0.15); border: 1px solid rgba(245,158,11,0.3); color: #fbbf24; padding: 4px 8px; border-radius: 6px; cursor: pointer; white-space: nowrap;">🔥 Últimas Plazas</span>
                                <span class="sp-ai-pill" data-title="🏆🎾 CARTELERA FIN DE SEMANA: ¡ELIGE TU TURNO EN 1 CLIC! 🎾🏆" style="font-size: 0.7rem; background: rgba(59,130,246,0.15); border: 1px solid rgba(59,130,246,0.3); color: #60a5fa; padding: 4px 8px; border-radius: 6px; cursor: pointer; white-space: nowrap;">🏆 Fin de Semana</span>
                                <span class="sp-ai-pill" data-title="🥓🎾 ¿MAÑANERA O JAMONERA? ¡ELIGE TU TURNO DE PÁDEL! 🎾🥓" style="font-size: 0.7rem; background: rgba(168,85,247,0.15); border: 1px solid rgba(168,85,247,0.3); color: #c084fc; padding: 4px 8px; border-radius: 6px; cursor: pointer; white-space: nowrap;">🥓 Jamonera</span>
                            </div>
                        </div>

                        <!-- SORTEO / ANUNCIO DESTACADO (VACÍO DE SERIE) -->
                        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 12px 14px;">
                            <label style="display: block; font-size: 0.82rem; font-weight: 800; color: #CCFF00; margin-bottom: 6px;">
                                🎁 SORTEO / ANUNCIO DESTACADO (Opcional - vacío de serie):
                            </label>
                            <textarea id="sp-cart-promo" rows="2" placeholder="Escribe aquí si hay sorteo hoy (ej: 🎁 ¡Sorteo de 1 americana gratis si te apuntas antes de las 22:00!). Déjalo vacío si no hay sorteo." style="width: 100%; box-sizing: border-box; background: #070a12; border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; color: #fff; padding: 8px 12px; font-size: 0.82rem; resize: vertical;"></textarea>
                        </div>

                        <!-- LISTA DE EVENTOS ACTIVOS (DISEÑO TARJETA CON CLICK AISLADO) -->
                        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 12px 14px; flex: 1; display: flex; flex-direction: column;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                <label style="font-size: 0.82rem; font-weight: 800; color: #38bdf8;">
                                    🎾 SELECCIONAR TORNEOS A INCLUIR (<span id="sp-cart-selected-count">${events.length}</span>/${events.length}):
                                </label>
                                <span style="font-size: 0.74rem; color: #94a3b8; cursor: pointer; text-decoration: underline;" id="sp-toggle-all-events">Seleccionar todos</span>
                            </div>

                            <div id="sp-cart-events-container" style="overflow-y: auto; max-height: 220px; display: flex; flex-direction: column; gap: 7px; padding-right: 4px;">
                                ${events.length === 0 ? '<div style="color:#94a3b8; font-size:0.85rem; text-align:center; padding:20px;">No hay eventos activos programados.</div>' : ''}
                                ${events.map((e) => {
                                    const id = String(e.id || e._id);
                                    const courts = parseInt(e.max_courts || e.courts || 4, 10);
                                    const maxP = courts * 4;
                                    const pCount = (e.players || e.registeredPlayers || []).length;
                                    const isSoldOut = pCount >= maxP;
                                    const badgeText = isSoldOut ? '⛔ SOLD OUT' : (maxP - pCount === 1 ? '🔥 1 plaza' : `✅ ${pCount}/${maxP}`);
                                    const badgeBg = isSoldOut ? 'rgba(239,68,68,0.2)' : (maxP - pCount === 1 ? 'rgba(245,158,11,0.2)' : 'rgba(37,211,102,0.15)');
                                    const badgeColor = isSoldOut ? '#ef4444' : (maxP - pCount === 1 ? '#fbbf24' : '#25D366');

                                    return `
                                        <div class="sp-cart-item-row" data-id="${id}" style="display: flex; align-items: center; gap: 10px; background: rgba(37,211,102,0.08); border: 1.5px solid rgba(37,211,102,0.4); border-radius: 10px; padding: 8px 12px; cursor: pointer; user-select: none; transition: all 0.15s ease;">
                                            <div class="sp-cart-check-indicator" style="width: 20px; height: 20px; border-radius: 6px; background: #25D366; color: #000; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 900; flex-shrink: 0;">
                                                ✓
                                            </div>
                                            <div style="flex: 1; min-width: 0;">
                                                <div style="font-size: 0.84rem; font-weight: 800; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                                    ${e.date || ''} · ${e.time || ''} — ${e.name || 'Torneo'}
                                                </div>
                                                <div style="font-size: 0.72rem; color: #94a3b8;">
                                                    📍 ${e.location || e.sede || 'SomosPadel BCN'} · ${e.price_members || e.price || 10}€ socios / ${e.price_external || e.price || 10}€ no socios
                                                </div>
                                            </div>
                                            <div style="font-size: 0.72rem; font-weight: 800; background: ${badgeBg}; color: ${badgeColor}; padding: 3px 8px; border-radius: 6px; flex-shrink: 0;">
                                                ${badgeText}
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>

                        <!-- CIERRE DEL MENSAJE -->
                        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 12px 14px;">
                            <label style="display: block; font-size: 0.82rem; font-weight: 800; color: #94a3b8; margin-bottom: 6px;">
                                ⚡ CIERRE / LLAMADA A LA ACCIÓN:
                            </label>
                            <input id="sp-cart-footer" type="text" value="⚡ ¡Elige tu turno y asegura tu plaza antes de que vuelen!" style="width: 100%; box-sizing: border-box; background: #070a12; border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; color: #fff; padding: 8px 12px; font-size: 0.85rem;">
                        </div>

                    </div>

                    <!-- COLUMNA DERECHA: SIMULADOR DE CHAT DE WHATSAPP -->
                    <div style="display: flex; flex-direction: column; background: #0b141a; border-radius: 18px; border: 1px solid rgba(255,255,255,0.12); overflow: hidden;">
                        
                        <!-- BARRA SUPERIOR CHAT WHATSAPP -->
                        <div style="background: #202c33; padding: 10px 14px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.05);">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <div style="width: 32px; height: 32px; border-radius: 50%; background: #00a884; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; color: #fff;">
                                    🎾
                                </div>
                                <div>
                                    <div style="font-size: 0.85rem; font-weight: 700; color: #e9edef;">Grupo Somos Pádel BCN</div>
                                    <div style="font-size: 0.7rem; color: #8696a0;">Vista previa de cómo lo verán los jugadores</div>
                                </div>
                            </div>
                            <span style="font-size: 0.72rem; color: #00a884; background: rgba(0,168,132,0.15); padding: 3px 8px; border-radius: 6px; font-weight: 700;">WHATSAPP</span>
                        </div>

                        <!-- BURBUJA DE MENSAJE -->
                        <div style="flex: 1; padding: 14px; overflow-y: auto; display: flex; flex-direction: column;">
                            <div style="align-self: flex-start; max-width: 95%; background: #005c4b; border-radius: 10px; border-top-left-radius: 2px; padding: 12px 14px; box-shadow: 0 2px 5px rgba(0,0,0,0.4); color: #e9edef; font-size: 0.85rem; line-height: 1.5; white-space: pre-wrap; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;" id="sp-cart-whatsapp-bubble">
                            </div>
                        </div>

                        <!-- TEXTO PLANO OCULTO PARA COPIAR -->
                        <textarea id="sp-cart-raw-text" style="display: none;"></textarea>

                    </div>

                </div>

                <!-- FOOTER ACTIONS -->
                <div style="padding: 16px 24px; border-top: 1px solid rgba(255,255,255,0.08); background: #070d19; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;">
                    <div style="font-size: 0.8rem; color: #94a3b8;">
                        💡 <em>Tip: Al pulsar Enviar, se abre WhatsApp con el mensaje ya redactado y los enlaces listos.</em>
                    </div>
                    <div style="display: flex; gap: 12px;">
                        <button id="sp-cart-copy-btn" type="button" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2); color: #fff; font-weight: 800; padding: 12px 20px; border-radius: 14px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 0.9rem; transition: background 0.2s;">
                            <i class="far fa-copy"></i> COPIAR TEXTO
                        </button>
                        <button id="sp-cart-send-btn" type="button" style="background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); border: none; color: #fff; font-weight: 900; padding: 12px 26px; border-radius: 14px; cursor: pointer; display: flex; align-items: center; gap: 10px; font-size: 0.95rem; box-shadow: 0 6px 20px rgba(37, 211, 102, 0.4); transition: transform 0.15s;">
                            <i class="fab fa-whatsapp" style="font-size: 1.25rem;"></i> ENVIAR A WHATSAPP
                        </button>
                    </div>
                </div>

            </div>
        `;

        document.body.appendChild(modal);

        // Controladores de actualización en tiempo real
        const updatePreview = () => {
            const h = document.getElementById('sp-cart-header').value;
            const p = document.getElementById('sp-cart-promo').value;
            const f = document.getElementById('sp-cart-footer').value;

            const selectedEvents = events.filter(e => selectedIds.has(String(e.id || e._id)));
            
            // Actualizar contador
            const countEl = document.getElementById('sp-cart-selected-count');
            if (countEl) countEl.textContent = selectedEvents.length;

            const rawText = window.WhatsAppService.generateCarteleraBroadcast(selectedEvents, {
                header: h,
                promo: p,
                footer: f
            });

            document.getElementById('sp-cart-raw-text').value = rawText;

            // Renderizar en la burbuja de WhatsApp convirtiendo *negrita* en <strong>
            const bubbleEl = document.getElementById('sp-cart-whatsapp-bubble');
            if (bubbleEl) {
                let htmlFormatted = rawText
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/\*(.*?)\*/g, '<strong style="color:#fff; font-weight:800;">$1</strong>')
                    .replace(/_(.*?)_/g, '<em>$1</em>');
                bubbleEl.innerHTML = htmlFormatted;
            }
        };

        // Eventos de Input
        document.getElementById('sp-cartelera-close-btn').onclick = () => modal.remove();
        document.getElementById('sp-cart-header').oninput = updatePreview;
        document.getElementById('sp-cart-promo').oninput = updatePreview;
        document.getElementById('sp-cart-footer').oninput = updatePreview;

        // Botón Asistente IA de Titular
        document.getElementById('sp-ai-btn').onclick = () => {
            currentTitleIndex = (currentTitleIndex + 1) % aiTitles.length;
            document.getElementById('sp-cart-header').value = aiTitles[currentTitleIndex];
            updatePreview();
        };

        // Pills de sugerencias rápidas IA
        document.querySelectorAll('.sp-ai-pill').forEach(pill => {
            pill.onclick = () => {
                document.getElementById('sp-cart-header').value = pill.dataset.title;
                updatePreview();
            };
        });

        // Toggle selección de cada fila de evento (100% independiente de cualquier CSS checkbox)
        document.querySelectorAll('.sp-cart-item-row').forEach(row => {
            row.onclick = () => {
                const id = row.dataset.id;
                const ind = row.querySelector('.sp-cart-check-indicator');

                if (selectedIds.has(id)) {
                    selectedIds.delete(id);
                    row.style.background = 'rgba(255,255,255,0.02)';
                    row.style.borderColor = 'rgba(255,255,255,0.08)';
                    row.style.opacity = '0.5';
                    ind.style.background = 'rgba(255,255,255,0.1)';
                    ind.style.color = 'transparent';
                    ind.textContent = '';
                } else {
                    selectedIds.add(id);
                    row.style.background = 'rgba(37,211,102,0.08)';
                    row.style.borderColor = 'rgba(37,211,102,0.4)';
                    row.style.opacity = '1';
                    ind.style.background = '#25D366';
                    ind.style.color = '#000';
                    ind.textContent = '✓';
                }
                updatePreview();
            };
        });

        // Toggle Todos
        document.getElementById('sp-toggle-all-events').onclick = () => {
            const allSelected = selectedIds.size === events.length;
            document.querySelectorAll('.sp-cart-item-row').forEach(row => {
                const id = row.dataset.id;
                const ind = row.querySelector('.sp-cart-check-indicator');
                if (allSelected) {
                    selectedIds.delete(id);
                    row.style.background = 'rgba(255,255,255,0.02)';
                    row.style.borderColor = 'rgba(255,255,255,0.08)';
                    row.style.opacity = '0.5';
                    ind.style.background = 'rgba(255,255,255,0.1)';
                    ind.style.color = 'transparent';
                    ind.textContent = '';
                } else {
                    selectedIds.add(id);
                    row.style.background = 'rgba(37,211,102,0.08)';
                    row.style.borderColor = 'rgba(37,211,102,0.4)';
                    row.style.opacity = '1';
                    ind.style.background = '#25D366';
                    ind.style.color = '#000';
                    ind.textContent = '✓';
                }
            });
            updatePreview();
        };

        // Botón Copiar Texto
        document.getElementById('sp-cart-copy-btn').onclick = async () => {
            const text = document.getElementById('sp-cart-raw-text').value;
            if (!text) return;
            try {
                if (navigator.clipboard?.writeText) {
                    await navigator.clipboard.writeText(text);
                } else {
                    const el = document.getElementById('sp-cart-raw-text');
                    el.style.display = 'block';
                    el.select();
                    document.execCommand('copy');
                    el.style.display = 'none';
                }
                const btn = document.getElementById('sp-cart-copy-btn');
                const orig = btn.innerHTML;
                btn.innerHTML = '✅ ¡COPIADO!';
                btn.style.background = 'rgba(37,211,102,0.2)';
                btn.style.borderColor = '#25D366';
                setTimeout(() => { 
                    btn.innerHTML = orig; 
                    btn.style.background = 'rgba(255,255,255,0.08)';
                    btn.style.borderColor = 'rgba(255,255,255,0.2)';
                }, 2000);
            } catch (err) {
                alert('Texto copiado al portapapeles');
            }
        };

        // Botón Abrir en WhatsApp
        document.getElementById('sp-cart-send-btn').onclick = () => {
            const text = document.getElementById('sp-cart-raw-text').value;
            if (!text) return;
            const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
            window.WhatsAppService._openUrlSafely(url);
        };

        // Render inicial
        updatePreview();
    }
};

console.log("💬 WhatsAppService V9.0 BROADCAST PRO & CONVOCATORIA STUDIO Loaded.");
