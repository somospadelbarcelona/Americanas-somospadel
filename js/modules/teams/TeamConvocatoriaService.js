/**
 * TeamConvocatoriaService.js
 * Servicio de Persistencia y Lógica de Negocio para el Sistema de Disponibilidad
 * y Convocatorias Interactivas (RSVP) de Equipos de Somos Pádel Barcelona.
 * 
 * Funcionalidades principales:
 * 1. Persistencia dual Firestore ('teams_convocatorias') y fallback offline en localStorage.
 * 2. Registro de disponibilidad individual de jugadores ('available', 'conditional', 'unavailable').
 * 3. Suscripción en tiempo real vía onSnapshot con retorno de función unsubscribe.
 * 4. Generación de enlaces profundos para respuesta móvil (RSVP 1-clic).
 * 5. Redacción de mensajes oficiales para WhatsApp con emojis del club y resumen de asistencia.
 * 6. Cálculo automatizado de estados (confirmados, dudas, bajas y pendientes del roster).
 * 
 * Expuesto globalmente en `window.TeamConvocatoriaService`.
 */

(function (global) {
    'use strict';

    // Constantes del Servicio
    const CONFIG = {
        COLLECTION: 'teams_convocatorias',
        STORAGE_PREFIX: 'somospadel_convo_',
        BASE_URL_FALLBACK: 'https://somospadelbarcelona.github.io/Americanas-somospadel/',
        DEFAULT_STATUS: 'open',
        STATUS: {
            OPEN: 'open',
            CLOSED: 'closed'
        },
        PLAYER_STATUS: {
            AVAILABLE: 'available',
            CONDITIONAL: 'conditional',
            UNAVAILABLE: 'unavailable'
        }
    };

    // Emojis oficiales para la comunicación del club
    const E = {
        tennis: '🎾',
        cal: '📅',
        timer: '⏱️',
        clock: '⏰',
        vs: '🆚',
        stadium: '🏟️',
        pin: '📍',
        check: '✅',
        maybe: '🤔',
        cross: '❌',
        clockWait: '⏳',
        strong: '💪',
        green: '🟢',
        memo: '📝',
        link: '📲',
        shield: '🛡️',
        trophy: '🏆',
        line: '━━━━━━━━━━━━━━━━━━'
    };

    // Diccionario de direcciones de clubes frecuentes para enriquecer convocatorias
    const CLUB_ADDRESSES = {
        'padel bcn - el prat': 'B-250, Parc del Riu 3-4, 08820, Prat del Llobregat',
        'padel bcn el prat': 'B-250, Parc del Riu 3-4, 08820, Prat del Llobregat',
        'el prat': 'B-250, Parc del Riu 3-4, 08820, Prat del Llobregat',
        'padeland': 'c/ Perú 1, 08754, El Papiol',
        'hospitalet': 'Carrer de la Residència s/n, Hospitalet de Llobregat',
        'cem tennis hospitalet': 'Carrer de la Residència s/n, Hospitalet de Llobregat',
        'crazyxpadel': 'Sant Boi de Llobregat',
        'castellar': 'Castellar del Vallès',
        'la paleda': 'La Paleda Indoor Padel, Cornellà',
        'rubí': 'Rubí, Barcelona',
        'indoor rubi': 'Rubí, Barcelona',
        'club padel vallirana': 'Vallirana, Barcelona',
        'club tennis i padel segur': 'Segur de Calafell, Tarragona',
        'club tennis segur': 'Segur de Calafell, Tarragona'
    };

    class TeamConvocatoriaService {
        constructor() {
            this.config = CONFIG;
            this.emojis = E;
            this.clubAddresses = CLUB_ADDRESSES;
            console.log('📋 [TeamConvocatoriaService] Servicio de Convocatorias RSVP inicializado');
        }

        /**
         * Obtiene la instancia activa de Firestore (soporta window.db o window.firebase.firestore()).
         * @private
         * @returns {Object|null}
         */
        _getDb() {
            if (typeof window !== 'undefined') {
                if (window.db && typeof window.db.collection === 'function') {
                    return window.db;
                }
                if (window.firebase && typeof window.firebase.firestore === 'function') {
                    return window.firebase.firestore();
                }
            }
            return null;
        }

        /**
         * Normaliza el identificador de la convocatoria.
         * Formato estándar: `${teamId}_j${jornada}`
         * @param {string} teamId - ID del equipo (ej: "somos-padel-bcn-3ma")
         * @param {string|number} jornada - Número de jornada (ej: 9 o "9")
         * @returns {string} ID normalizado
         */
        normalizeId(teamId, jornada) {
            const cleanTeam = String(teamId || '').trim().toLowerCase();
            const cleanJ = String(jornada || '').replace(/^[jJ]/, '').trim();
            return `${cleanTeam}_j${cleanJ}`;
        }

        /**
         * Clave de localStorage para una convocatoria específica.
         * @private
         */
        _getStorageKey(teamId, jornada) {
            const id = this.normalizeId(teamId, jornada);
            return `${CONFIG.STORAGE_PREFIX}${id}`;
        }

        /**
         * Normaliza el estado de disponibilidad del jugador aceptando sinónimos.
         * @private
         */
        _normalizePlayerStatus(status) {
            if (!status) return CONFIG.PLAYER_STATUS.AVAILABLE;
            const s = String(status).trim().toLowerCase();

            if (['available', 'si', 'yes', 'confirmado', 'asisto', 'voy', 'ok'].includes(s)) {
                return CONFIG.PLAYER_STATUS.AVAILABLE;
            }
            if (['conditional', 'duda', 'talvez', 'maybe', 'pendiente', 'si_falta_uno', 'condicional'].includes(s)) {
                return CONFIG.PLAYER_STATUS.CONDITIONAL;
            }
            if (['unavailable', 'no', 'baja', 'no_disponible', 'no_asisto', 'out'].includes(s)) {
                return CONFIG.PLAYER_STATUS.UNAVAILABLE;
            }

            return CONFIG.PLAYER_STATUS.AVAILABLE;
        }

        /**
         * Guarda en caché local (localStorage) de manera segura.
         * @private
         */
        _saveToLocalStorage(key, data) {
            try {
                if (typeof localStorage !== 'undefined') {
                    localStorage.setItem(key, JSON.stringify(data));
                }
            } catch (err) {
                console.warn('⚠️ [TeamConvocatoriaService] No se pudo escribir en localStorage:', err);
            }
        }

        /**
         * Lee de caché local (localStorage) de manera segura.
         * @private
         */
        _readFromLocalStorage(key) {
            try {
                if (typeof localStorage === 'undefined') return null;
                const raw = localStorage.getItem(key);
                return raw ? JSON.parse(raw) : null;
            } catch (err) {
                console.warn('⚠️ [TeamConvocatoriaService] Error leyendo de localStorage:', err);
                return null;
            }
        }

        /**
         * Obtiene la dirección recomendada para un club.
         * @param {string} venue 
         * @returns {string}
         */
        getClubAddress(venue) {
            if (!venue) return '';
            const clean = venue.toLowerCase().trim();
            for (const key in this.clubAddresses) {
                if (clean.includes(key) || key.includes(clean)) {
                    return this.clubAddresses[key];
                }
            }
            return '';
        }

        /**
         * Calcula la hora sugerida de convocatoria previa al partido (30 min antes).
         * @param {string} matchTime - Ejemplo "13:30" o "13:30h"
         * @returns {string}
         */
        getConvocatoriaTime(matchTime) {
            if (!matchTime || matchTime === 'TBD' || matchTime === 'Por definir') {
                return '30 min antes';
            }
            const clean = String(matchTime).replace(/h/gi, '').trim();
            const parts = clean.split(':');
            if (parts.length < 2) {
                const hr = parseInt(clean, 10);
                if (!isNaN(hr)) {
                    const prev = hr - 1;
                    return `${prev < 10 ? '0' + prev : prev}:30h`;
                }
                return '30 min antes';
            }
            let hr = parseInt(parts[0], 10);
            let min = parseInt(parts[1], 10);
            min -= 30;
            if (min < 0) {
                min = 30;
                hr -= 1;
            }
            if (hr < 0) hr = 23;
            const hrStr = hr.toString().padStart(2, '0');
            const minStr = min.toString().padStart(2, '0');
            return `${hrStr}:${minStr}h`;
        }

        /**
         * Carga una convocatoria desde Firestore ('teams_convocatorias') o fallback a localStorage.
         * 
         * @param {string} teamId - ID del equipo
         * @param {string|number} jornada - Número de jornada
         * @returns {Promise<Object|null>} Objeto de convocatoria o null si no existe
         */
        async getConvocatoria(teamId, jornada) {
            if (!teamId || jornada === undefined || jornada === null) {
                console.warn('⚠️ [TeamConvocatoriaService.getConvocatoria] teamId y jornada requeridos.');
                return null;
            }

            const convoId = this.normalizeId(teamId, jornada);
            const storageKey = this._getStorageKey(teamId, jornada);
            const db = this._getDb();
            const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

            // 1. Intentar cargar desde Firestore si está disponible y online
            if (db && isOnline) {
                try {
                    const docSnap = await db.collection(CONFIG.COLLECTION).doc(convoId).get();
                    if (docSnap.exists) {
                        const data = docSnap.data();
                        const normalizedData = {
                            id: convoId,
                            ...data,
                            teamId: data.teamId || teamId,
                            jornada: data.jornada !== undefined ? data.jornada : jornada,
                            responses: data.responses || {},
                            status: data.status || CONFIG.STATUS.OPEN
                        };
                        // Sincronizar en caché local
                        this._saveToLocalStorage(storageKey, normalizedData);
                        return normalizedData;
                    }
                } catch (fsErr) {
                    console.warn(`⚠️ [TeamConvocatoriaService] Firestore get fallo (${convoId}), usando fallback local:`, fsErr.message);
                }
            }

            // 2. Fallback local si Firestore no responde o no está disponible
            const cached = this._readFromLocalStorage(storageKey);
            if (cached) {
                return {
                    id: convoId,
                    ...cached,
                    responses: cached.responses || {},
                    status: cached.status || CONFIG.STATUS.OPEN
                };
            }

            return null;
        }

        /**
         * Guarda o actualiza una convocatoria en Firestore y en localStorage.
         * Si Firestore falla o no está conectado, persiste localmente sin interrumpir la app.
         * 
         * @param {Object} convoData - Datos de la convocatoria
         * @returns {Promise<{success: boolean, isOffline: boolean, data: Object}>}
         */
        async saveConvocatoria(convoData) {
            if (!convoData || !convoData.teamId || convoData.jornada === undefined) {
                throw new Error('Datos de convocatoria inválidos: teamId y jornada son obligatorios.');
            }

            const teamId = String(convoData.teamId).trim();
            const jornada = String(convoData.jornada).replace(/^[jJ]/, '').trim();
            const convoId = this.normalizeId(teamId, jornada);
            const storageKey = this._getStorageKey(teamId, jornada);

            const nowIso = new Date().toISOString();

            // Estructura normalizada y sanitizada
            const sanitized = {
                id: convoId,
                teamId: teamId,
                jornada: jornada,
                opponent: convoData.opponent || 'Por definir',
                matchDate: convoData.matchDate || 'Por definir',
                matchTime: convoData.matchTime || '',
                convocatoriaTime: convoData.convocatoriaTime || (convoData.matchTime ? this.getConvocatoriaTime(convoData.matchTime) : '30 min antes'),
                venue: convoData.venue || 'Club por definir',
                address: convoData.address || this.getClubAddress(convoData.venue),
                isHome: convoData.isHome !== undefined ? Boolean(convoData.isHome) : true,
                status: convoData.status === CONFIG.STATUS.CLOSED ? CONFIG.STATUS.CLOSED : CONFIG.STATUS.OPEN,
                createdAt: convoData.createdAt || nowIso,
                updatedAt: nowIso,
                deadline: convoData.deadline || null,
                responses: convoData.responses && typeof convoData.responses === 'object' ? { ...convoData.responses } : {},
                customNotes: typeof convoData.customNotes === 'string' ? convoData.customNotes.trim() : ''
            };

            // 1. Persistir inmediatamente en localStorage
            this._saveToLocalStorage(storageKey, sanitized);

            // 2. Disparar evento personalizado para actualizar componentes activos en UI
            if (typeof window !== 'undefined' && window.dispatchEvent) {
                try {
                    window.dispatchEvent(new CustomEvent('somospadel:convocatoria_updated', {
                        detail: { convoId, data: sanitized }
                    }));
                } catch (e) {}
            }

            // 3. Persistir en Firestore
            const db = this._getDb();
            const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

            if (db && isOnline) {
                try {
                    await db.collection(CONFIG.COLLECTION).doc(convoId).set(sanitized, { merge: true });
                    return {
                        success: true,
                        isOffline: false,
                        id: convoId,
                        data: sanitized
                    };
                } catch (fsErr) {
                    console.warn(`⚠️ [TeamConvocatoriaService] No se pudo guardar en Firestore (${convoId}). Modo offline activo:`, fsErr.message);
                    return {
                        success: true,
                        isOffline: true,
                        id: convoId,
                        data: sanitized,
                        warning: 'Guardado localmente. Se sincronizará al conectar.'
                    };
                }
            }

            return {
                success: true,
                isOffline: true,
                id: convoId,
                data: sanitized
            };
        }

        /**
         * Registra o actualiza la respuesta de disponibilidad de un jugador individual.
         * 
         * @param {string} teamId - ID del equipo
         * @param {string|number} jornada - Jornada
         * @param {string} playerName - Nombre completo del jugador
         * @param {'available'|'conditional'|'unavailable'} status - Estado RSVP
         * @param {string} [note=''] - Nota u observación opcional del jugador
         * @returns {Promise<{success: boolean, data: Object, playerResponse: Object}>}
         */
        async submitPlayerResponse(teamId, jornada, playerName, status, note = '') {
            if (!playerName || !String(playerName).trim()) {
                throw new Error('El nombre del jugador es requerido para responder.');
            }

            const cleanPlayerName = String(playerName).trim();
            const normalizedStatus = this._normalizePlayerStatus(status);
            const cleanNote = String(note || '').trim();

            // Cargar o inicializar la convocatoria
            let convo = await this.getConvocatoria(teamId, jornada);

            if (!convo) {
                convo = {
                    teamId: teamId,
                    jornada: jornada,
                    opponent: 'Por definir',
                    matchDate: 'Por definir',
                    venue: 'Por definir',
                    status: CONFIG.STATUS.OPEN,
                    responses: {},
                    createdAt: new Date().toISOString()
                };
            }

            // Validar si la convocatoria está cerrada
            if (convo.status === CONFIG.STATUS.CLOSED) {
                throw new Error('La convocatoria para esta jornada ha sido cerrada por el capitán.');
            }

            // Registrar la respuesta del jugador
            const playerResponse = {
                status: normalizedStatus,
                note: cleanNote,
                updatedAt: new Date().toISOString()
            };

            convo.responses = convo.responses || {};
            convo.responses[cleanPlayerName] = playerResponse;

            // Guardar cambios tanto en Firestore como en localStorage
            const saveResult = await this.saveConvocatoria(convo);

            return {
                success: true,
                isOffline: saveResult.isOffline,
                data: saveResult.data,
                playerResponse: playerResponse
            };
        }

        /**
         * Establece una suscripción en tiempo real a los cambios de una convocatoria.
         * Devuelve una función para cancelar la suscripción (unsubscribe).
         * 
         * @param {string} teamId - ID del equipo
         * @param {string|number} jornada - Jornada
         * @param {Function} onUpdate - Callback ejecutado con los datos de la convocatoria
         * @returns {Function} Función unsubscribe
         */
        listenConvocatoria(teamId, jornada, onUpdate) {
            if (!teamId || jornada === undefined || typeof onUpdate !== 'function') {
                return () => {};
            }

            const convoId = this.normalizeId(teamId, jornada);
            const storageKey = this._getStorageKey(teamId, jornada);

            // 1. Emitir inmediatamente el estado en caché local o estructura inicial para renderizado instantáneo
            let initialEmitted = false;
            const cached = this._readFromLocalStorage(storageKey);
            if (cached) {
                try {
                    onUpdate(cached);
                    initialEmitted = true;
                } catch (e) {
                    console.error('⚠️ [TeamConvocatoriaService] Error en callback de caché inicial:', e);
                }
            } else {
                // Emitir inmediatamente estructura por defecto para que la UI renderice sin esperar a la red
                const defaultConvo = {
                    id: convoId,
                    teamId: teamId,
                    jornada: jornada,
                    status: CONFIG.STATUS.OPEN,
                    responses: {}
                };
                try {
                    onUpdate(defaultConvo);
                    initialEmitted = true;
                } catch (e) {
                    console.error('⚠️ [TeamConvocatoriaService] Error en callback inicial por defecto:', e);
                }
            }

            // 2. Suscribirse a eventos de Storage por si otra pestaña o componente actualiza localmente
            const storageListener = (e) => {
                if (e.key === storageKey && e.newValue) {
                    try {
                        const parsed = JSON.parse(e.newValue);
                        onUpdate(parsed);
                    } catch (err) {}
                }
            };

            if (typeof window !== 'undefined' && window.addEventListener) {
                window.addEventListener('storage', storageListener);
            }

            // 3. Suscribirse a Firestore .onSnapshot si está conectado
            const db = this._getDb();
            let firestoreUnsubscribe = null;

            if (db) {
                try {
                    firestoreUnsubscribe = db.collection(CONFIG.COLLECTION).doc(convoId)
                        .onSnapshot((docSnap) => {
                            if (docSnap.exists) {
                                const liveData = {
                                    id: convoId,
                                    ...docSnap.data(),
                                    responses: docSnap.data().responses || {},
                                    status: docSnap.data().status || CONFIG.STATUS.OPEN
                                };
                                this._saveToLocalStorage(storageKey, liveData);
                                onUpdate(liveData);
                            } else if (!initialEmitted) {
                                onUpdate({
                                    id: convoId,
                                    teamId: teamId,
                                    jornada: jornada,
                                    status: CONFIG.STATUS.OPEN,
                                    responses: {}
                                });
                            }
                        }, (err) => {
                            console.warn(`⚠️ [TeamConvocatoriaService] Error en onSnapshot de ${convoId}:`, err.message);
                            if (!initialEmitted) {
                                onUpdate({
                                    id: convoId,
                                    teamId: teamId,
                                    jornada: jornada,
                                    status: CONFIG.STATUS.OPEN,
                                    responses: {}
                                });
                            }
                        });
                } catch (snapErr) {
                    console.warn(`⚠️ [TeamConvocatoriaService] Error configurando onSnapshot:`, snapErr.message);
                }
            }

            // Función unificada de desuscripción
            return () => {
                if (firestoreUnsubscribe && typeof firestoreUnsubscribe === 'function') {
                    try {
                        firestoreUnsubscribe();
                    } catch (e) {}
                }
                if (typeof window !== 'undefined' && window.removeEventListener) {
                    window.removeEventListener('storage', storageListener);
                }
            };
        }

        /**
         * Genera un enlace directo (deep-link) para que los jugadores accedan
         * en el móvil y respondan su disponibilidad en 1 clic.
         * 
         * @param {string} teamId - ID del equipo
         * @param {string|number} jornada - Jornada
         * @returns {string} URL formateada
         */
        generateShareUrl(teamId, jornada) {
            const cleanTeam = String(teamId || '').trim();
            const cleanJ = String(jornada || '').replace(/^[jJ]/, '').trim();

            let base = CONFIG.BASE_URL_FALLBACK;
            if (typeof window !== 'undefined' && window.location) {
                const origin = window.location.origin;
                const href = window.location.href;
                if (origin && origin !== 'null' && !origin.startsWith('file:') && !href.startsWith('file:')) {
                    const pathname = window.location.pathname || '/';
                    base = `${origin}${pathname}`;
                }
            }

            // Normalizar separación de query string
            const separator = base.includes('?') ? '&' : '?';
            return `${base}${separator}action=rsvp&team=${encodeURIComponent(cleanTeam)}&j=${encodeURIComponent(cleanJ)}`;
        }

        /**
         * Genera el texto oficial de convocatoria con formato WhatsApp,
         * emojis del club y enlace directo para responder.
         * 
         * @param {Object} team - Objeto del equipo (nombre, división, etc.)
         * @param {Object} match - Objeto del partido (rival, fecha, hora, venue, etc.)
         * @param {Object} [convoData=null] - Datos de la convocatoria con respuestas
         * @returns {string} Texto preparado para pegar en WhatsApp
         */
        generateWhatsAppConvocatoriaText(team, match, convoData = null) {
            const teamObj = team || {};
            const matchObj = match || {};

            const teamName = teamObj.name || 'SOMOS PÁDEL BCN';
            const jNum = matchObj.j || convoData?.jornada || 'X';
            const groupText = teamObj.group || teamObj.division || '';
            const phaseStr = groupText.toUpperCase().includes('FASE 1') ? 'Fase 1' : 'Fase 2';
            const homeAway = matchObj.isHome !== false ? 'Casa' : 'Fuera';
            const matchDate = matchObj.date || convoData?.matchDate || 'Por definir';
            const matchTime = (matchObj.time || convoData?.matchTime || 'TBD').replace(/h/gi, '');
            const convTime = convoData?.convocatoriaTime || this.getConvocatoriaTime(matchTime);
            const venue = matchObj.venue || convoData?.venue || 'Por definir';
            const opponent = matchObj.opponent || convoData?.opponent || 'Por definir';
            const address = convoData?.address || this.getClubAddress(venue);
            const addressLabel = address ? `\n${E.pin} *Dirección:* _${address}_` : '';

            const shareUrl = this.generateShareUrl(teamObj.id || convoData?.teamId, jNum);

            let text = `${E.tennis} *CONVOCATORIA - JORNADA ${jNum}* ${E.tennis}\n`;
            text += `*${teamName.toUpperCase()}*\n`;
            text += `${E.line}\n`;
            text += `${E.shield} *Competición:* ${phaseStr} (${homeAway})\n`;
            text += `${E.cal} *Día:* ${matchDate}\n`;
            text += `${E.timer} *Hora partido:* ${matchTime}h\n`;
            text += `${E.clock} *Hora convocatoria:* ${convTime}\n`;
            text += `${E.vs} *Rival:* ${opponent}\n`;
            text += `${E.stadium} *Club:* ${venue}${addressLabel}\n`;

            // Si hay notas del capitán personalizadas
            if (convoData?.customNotes && convoData.customNotes.trim()) {
                text += `${E.memo} *Nota del capitán:* _${convoData.customNotes.trim()}_\n`;
            }

            text += `${E.line}\n`;

            // Si hay respuestas registradas, incluir resumen ordenado
            if (convoData && convoData.responses && Object.keys(convoData.responses).length > 0) {
                const summary = this.getConvocatoriaSummary(convoData, teamObj.roster || []);

                if (summary.available.length > 0) {
                    text += `${E.check} *CONFIRMADOS (${summary.available.length}):*\n`;
                    summary.available.forEach(p => {
                        const noteStr = p.note ? ` _(${p.note})_` : '';
                        text += `  • ${p.name}${noteStr}\n`;
                    });
                    text += '\n';
                }

                if (summary.conditional.length > 0) {
                    text += `${E.maybe} *DUDAS / CONDICIONAL (${summary.conditional.length}):*\n`;
                    summary.conditional.forEach(p => {
                        const noteStr = p.note ? ` _(${p.note})_` : '';
                        text += `  • ${p.name}${noteStr}\n`;
                    });
                    text += '\n';
                }

                if (summary.unavailable.length > 0) {
                    text += `${E.cross} *BAJAS / NO DISPONIBLES (${summary.unavailable.length}):*\n`;
                    summary.unavailable.forEach(p => {
                        const noteStr = p.note ? ` _(${p.note})_` : '';
                        text += `  • ${p.name}${noteStr}\n`;
                    });
                    text += '\n';
                }

                if (summary.pending.length > 0) {
                    text += `${E.clockWait} *PENDIENTES POR RESPONDER (${summary.pending.length}):*\n`;
                    const pendingNames = summary.pending.map(p => p.name).slice(0, 10);
                    text += `  _${pendingNames.join(', ')}${summary.pending.length > 10 ? '...' : ''}_\n`;
                    text += '\n';
                }
            }

            // Llamado a la acción con link interactivo directo
            text += `${E.link} *RESPONDE TU DISPONIBILIDAD EN 1-CLIC:*\n`;
            text += `${shareUrl}\n\n`;
            text += `¡Vamos Somos Pádel BCN! ${E.strong}${E.green}`;

            return text;
        }

        /**
         * Calcula el resumen estadístico y listados de jugadores agrupados por estado RSVP.
         * Cruza las respuestas con el roster oficial del equipo para identificar pendientes.
         * 
         * @param {Object} convoData - Datos de la convocatoria con `responses`
         * @param {Array<Object|string>} [roster=[]] - Lista del roster del equipo
         * @returns {Object} Resumen con arrays { available, conditional, unavailable, pending } y counts
         */
        getConvocatoriaSummary(convoData, roster = []) {
            const responses = convoData?.responses || {};

            const available = [];
            const conditional = [];
            const unavailable = [];

            // Normalizador de nombres para cruce sin distinción de mayúsculas ni tildes
            const normalizeName = (str) => {
                if (!str) return '';
                return String(str)
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .trim();
            };

            const respondedNamesSet = new Set();

            // Clasificar las respuestas recibidas
            Object.keys(responses).forEach(playerName => {
                const item = responses[playerName];
                const normalizedItem = {
                    name: playerName,
                    status: this._normalizePlayerStatus(item.status),
                    note: item.note || '',
                    updatedAt: item.updatedAt || ''
                };

                respondedNamesSet.add(normalizeName(playerName));

                if (normalizedItem.status === CONFIG.PLAYER_STATUS.AVAILABLE) {
                    available.push(normalizedItem);
                } else if (normalizedItem.status === CONFIG.PLAYER_STATUS.CONDITIONAL) {
                    conditional.push(normalizedItem);
                } else if (normalizedItem.status === CONFIG.PLAYER_STATUS.UNAVAILABLE) {
                    unavailable.push(normalizedItem);
                }
            });

            // Ordenar alfabéticamente cada lista
            const sortByName = (a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
            available.sort(sortByName);
            conditional.sort(sortByName);
            unavailable.sort(sortByName);

            // Cruzar con el roster para listar a los pendientes que aún no han votado
            const pending = [];
            if (Array.isArray(roster)) {
                roster.forEach(player => {
                    const rawName = typeof player === 'string' ? player : (player?.name || '');
                    const clean = rawName.trim();
                    if (clean && !respondedNamesSet.has(normalizeName(clean))) {
                        pending.push({
                            name: clean,
                            pts: typeof player === 'object' && player.pts !== undefined ? player.pts : 0
                        });
                    }
                });
            }
            pending.sort(sortByName);

            return {
                available,
                conditional,
                unavailable,
                pending,
                counts: {
                    available: available.length,
                    conditional: conditional.length,
                    unavailable: unavailable.length,
                    pending: pending.length,
                    totalRoster: Array.isArray(roster) ? roster.length : 0,
                    totalResponses: Object.keys(responses).length
                }
            };
        }

        /**
         * Abre o cierra formalmente una convocatoria (función para el capitán).
         * @param {string} teamId 
         * @param {string|number} jornada 
         * @param {'open'|'closed'} status 
         */
        async setConvocatoriaStatus(teamId, jornada, status) {
            const current = await this.getConvocatoria(teamId, jornada);
            if (!current) {
                throw new Error(`Convocatoria ${teamId} J${jornada} no encontrada para cambiar estado.`);
            }
            current.status = status === CONFIG.STATUS.CLOSED ? CONFIG.STATUS.CLOSED : CONFIG.STATUS.OPEN;
            return await this.saveConvocatoria(current);
        }

        /**
         * Inicializa o crea una convocatoria a partir de un partido del schedule del equipo.
         * @param {Object} team 
         * @param {Object} match 
         * @param {Object} [options={}] 
         */
        async createFromMatch(team, match, options = {}) {
            if (!team || !match) {
                throw new Error('Equipo y partido requeridos para crear convocatoria.');
            }

            const teamId = team.id;
            const jornada = match.j || '1';
            const matchTime = (match.time || 'TBD').replace(/h/gi, '');

            const payload = {
                teamId: teamId,
                jornada: jornada,
                opponent: match.opponent || 'Por definir',
                matchDate: match.date || 'Por definir',
                matchTime: matchTime,
                convocatoriaTime: this.getConvocatoriaTime(matchTime),
                venue: match.venue || 'Club por definir',
                address: this.getClubAddress(match.venue),
                isHome: match.isHome !== false,
                status: CONFIG.STATUS.OPEN,
                customNotes: options.customNotes || '',
                responses: {}
            };

            return await this.saveConvocatoria(payload);
        }
    }

    // Instanciación del Singleton y registro global
    const serviceInstance = new TeamConvocatoriaService();
    global.TeamConvocatoriaService = serviceInstance;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = serviceInstance;
    }

})(typeof window !== 'undefined' ? window : this);
