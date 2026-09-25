/**
 * NotificationService.js
 * 
 * Gestiona el sistema de notificaciones híbrido (Push + In-App).
 */
window.NotificationServiceClass = class NotificationService {
    constructor() {
        this.unsubscribe = null;
        this.notifications = [];
        this.eventNotifications = [];
        this.eventsUnsubscribes = [];
        this._eventsObserverStarted = false;
        this._hasInitialEventsLoaded = false;
        this._eventsMap = new Map();
        this.unreadCount = 0;
        this.callbacks = [];
        this.chatNotifications = [];
        this.chatUnsubscribes = new Map();
        this.serviceStartTime = Date.now();
        this.token = null;
        this.hasLoadedInitialBatch = false;

        // Lista reactiva de notificaciones purgadas globalmente por SuperAdmin
        this.globalPurgedIds = new Set();
        this.purgedUnsubscribe = null;
        
        // El arranque ahora lo gestiona AppInit
        console.log("🔔 NotificationServiceClass defined.");
    }

    init() {
        console.log("🔔 [NotificationService] Initializing...");

        // 1. Iniciar observador de feed de eventos globales (funciona tanto para invitados como autenticados)
        this.initEventsFeedObserver();

        // 1.b. Iniciar observador de notificaciones purgadas globalmente por el SuperAdmin
        this.initGlobalPurgedObserver();
        
        // 2. Verificar si window.auth existe
        if (!window.auth) {
            console.error("❌ [NotificationService] window.auth missing at init!");
            return;
        }

        // Escuchar autenticación real de Firebase
        window.auth.onAuthStateChanged(user => {
            if (user) {
                console.log("🔔 [NotificationService] Firebase Auth session detected:", user.uid);
                this.currentUserUid = user.uid;
                this.subscribeToFirestore(user.uid);
                this.checkPermissionStatus();
            } else {
                const localUser = window.Store ? window.Store.getState('currentUser') : null;
                if (localUser && localUser.uid) {
                    console.log("🔔 [NotificationService] Local session detected:", localUser.uid);
                    this.currentUserUid = localUser.uid;
                    this.subscribeToFirestore(localUser.uid);
                } else {
                    this.currentUserUid = null;
                    this.unsubscribeFirestore();
                }
            }
        });

        // 3. Escuchar cambios en el Store
        if (window.Store) {
            window.Store.subscribe('currentUser', (user) => {
                if (user && user.uid) {
                    this.currentUserUid = user.uid;
                    if (!this.unsubscribe) {
                        console.log("🔔 [NotificationService] Session started/changed in Store");
                        this.subscribeToFirestore(user.uid);
                    }
                    this.initChatObserver();
                } else if (!user) {
                    this.currentUserUid = null;
                    this.unsubscribeFirestore();
                    this.stopChatObserver();
                }
            });
        }
    }
    // ... rest of the methods remain same ...


    /**
     * Observa en tiempo real la lista de notificaciones purgadas globalmente por el SuperAdmin
     */
    initGlobalPurgedObserver() {
        if (!window.db) {
            return;
        }
        if (this.purgedUnsubscribe) {
            return;
        }

        try {
            this.purgedUnsubscribe = window.db.collection('system_config').doc('purged_notifications')
                .onSnapshot(docSnap => {
                    try {
                        if (docSnap && docSnap.exists) {
                            const data = docSnap.data() || {};
                            const list = data.purgedIds || data.ids || [];
                            this.globalPurgedIds = new Set(
                                Array.isArray(list) ? list.map(item => String(item).trim()).filter(Boolean) : []
                            );
                        } else {
                            this.globalPurgedIds = new Set();
                        }
                        this.notifySubscribers();
                    } catch (snapErr) {
                        console.warn("⚠️ [NotificationService] Error procesando snapshot de purged_notifications:", snapErr);
                    }
                }, error => {
                    // Fallback silencioso si no existe aún el documento o colección
                    console.warn("⚠️ [NotificationService] purged_notifications doc listener notice (silent fallback):", error?.message);
                });
        } catch (e) {
            console.warn("⚠️ [NotificationService] Error suscribiendo a purged_notifications:", e);
        }
    }

    /**
     * Comprueba si una notificación o evento ha sido purgado globalmente por el SuperAdmin
     * @param {object} rawItem 
     * @returns {boolean}
     */
    _isItemGloballyPurged(rawItem) {
        if (!this.globalPurgedIds || this.globalPurgedIds.size === 0 || !rawItem) {
            return false;
        }

        const id = rawItem.id ? String(rawItem.id).trim() : null;
        if (id && this.globalPurgedIds.has(id)) return true;

        const broadcastId = (rawItem.data?.broadcastId || rawItem.broadcastId) ? String(rawItem.data?.broadcastId || rawItem.broadcastId).trim() : null;
        if (broadcastId && this.globalPurgedIds.has(broadcastId)) return true;

        const eventId = (rawItem.data?.eventId || rawItem.eventId) ? String(rawItem.data?.eventId || rawItem.eventId).trim() : null;
        if (eventId && this.globalPurgedIds.has(eventId)) return true;

        const title = String(rawItem.title || rawItem.name || '').trim();
        const body = String(rawItem.body || rawItem.text || rawItem.message || '').trim();

        if (title && this.globalPurgedIds.has(title)) return true;

        const textSignature = `txt_${title.toLowerCase()}|${body.toLowerCase()}`;
        if (this.globalPurgedIds.has(textSignature)) return true;

        return false;
    }

    /**
     * Comprueba si una notificación o evento ha sido eliminado localmente por el usuario
     * @param {object} rawItem
     * @returns {boolean}
     */
    _isItemUserDeleted(rawItem) {
        if (!rawItem) return false;
        try {
            const id = rawItem.id ? String(rawItem.id).trim() : null;
            if (id) {
                if (localStorage.getItem('sp_deleted_notif_' + id) === 'true') return true;
                if (localStorage.getItem('sp_evt_deleted_' + id) === 'true') return true;
                if (id === 'system_radar_clima_relocated' && localStorage.getItem('sp_radar_relocated_notif_deleted') === 'true') return true;
            }

            const broadcastId = (rawItem.data?.broadcastId || rawItem.broadcastId) ? String(rawItem.data?.broadcastId || rawItem.broadcastId).trim() : null;
            if (broadcastId) {
                if (localStorage.getItem('sp_deleted_notif_' + broadcastId) === 'true') return true;
                if (localStorage.getItem('sp_evt_deleted_' + broadcastId) === 'true') return true;
            }

            const eventId = (rawItem.data?.eventId || rawItem.eventId) ? String(rawItem.data?.eventId || rawItem.eventId).trim() : null;
            if (eventId) {
                if (localStorage.getItem('sp_deleted_notif_' + eventId) === 'true') return true;
                if (localStorage.getItem('sp_evt_deleted_' + eventId) === 'true') return true;
            }

            const title = String(rawItem.title || rawItem.name || '').trim();
            const body = String(rawItem.body || rawItem.text || rawItem.message || '').trim();
            if (title || body) {
                const textSig = `sp_deleted_sig_${title}|${body}`;
                if (localStorage.getItem(textSig) === 'true') return true;
            }
        } catch (e) {
            console.warn("⚠️ [NotificationService] Error en _isItemUserDeleted:", e);
        }
        return false;
    }

    /**
     * Comprueba si una notificación ha sido leída por el usuario (en Firestore o en localStorage)
     * @param {object} rawItem
     * @returns {boolean}
     */
    _isItemUserRead(rawItem) {
        if (!rawItem) return false;
        if (rawItem.read === true) return true;
        try {
            const id = rawItem.id ? String(rawItem.id).trim() : null;
            if (id) {
                if (localStorage.getItem('sp_read_notif_' + id) === 'true') return true;
                if (localStorage.getItem('sp_evt_read_' + id) === 'true') return true;
                if (id === 'system_radar_clima_relocated' && localStorage.getItem('sp_radar_relocated_notif_read') === 'true') return true;
            }

            const broadcastId = (rawItem.data?.broadcastId || rawItem.broadcastId) ? String(rawItem.data?.broadcastId || rawItem.broadcastId).trim() : null;
            if (broadcastId) {
                if (localStorage.getItem('sp_read_notif_' + broadcastId) === 'true') return true;
                if (localStorage.getItem('sp_evt_read_' + broadcastId) === 'true') return true;
            }

            const eventId = (rawItem.data?.eventId || rawItem.eventId) ? String(rawItem.data?.eventId || rawItem.eventId).trim() : null;
            if (eventId) {
                if (localStorage.getItem('sp_read_notif_' + eventId) === 'true') return true;
                if (localStorage.getItem('sp_evt_read_' + eventId) === 'true') return true;
            }
        } catch (e) {
            console.warn("⚠️ [NotificationService] Error en _isItemUserRead:", e);
        }
        return false;
    }

    /**
     * Suscribe una función de callback para recibir actualizaciones de UI
     * @param {Function} callback (data) => void
     */
    onUpdate(callback) {
        this.callbacks.push(callback);
    }

    notifySubscribers() {
        const items = this.getMergedNotifications();
        this.unreadCount = items.filter(n => !n.read).length;
        const data = {
            count: this.unreadCount,
            items: items
        };
        this.callbacks.forEach(cb => cb(data));
    }

    /**
     * Fusiona las notificaciones de Firestore con los mensajes de chat y eventos del club
     */
    getMergedNotifications() {
        try {
            // 1. Filtrar notificaciones de Firestore: purga global + borrado local del usuario
            const firestoreNotifs = (this.notifications || []).filter(item => {
                if (!item || !item.id) return false;
                if (this._isItemGloballyPurged(item)) return false;
                if (this._isItemUserDeleted(item)) return false;
                return true;
            }).map(item => ({
                ...item,
                read: this._isItemUserRead(item)
            }));

            // 2. Filtrar mensajes de chat: purga global + borrado local del usuario
            const chatNotifs = (this.chatNotifications || []).filter(item => {
                if (!item || !item.id) return false;
                if (this._isItemGloballyPurged(item)) return false;
                if (this._isItemUserDeleted(item)) return false;
                return true;
            }).map(item => ({
                ...item,
                read: this._isItemUserRead(item)
            }));

            // 3. Filtrar eventos reales no eliminados por el usuario ni purgados globalmente
            const activeEventNotifs = (this.eventNotifications || []).filter(item => {
                if (!item || !item.id) return false;
                if (this._isItemGloballyPurged(item)) return false;
                if (this._isItemUserDeleted(item)) return false;
                return true;
            }).map(item => ({
                ...item,
                read: this._isItemUserRead(item)
            }));

            // 4. Integrar eventos cancelados persistidos en localStorage (resiliencia offline y tras borrado en Firestore)
            const cancelledLogs = this._getCancelledEventsLog().filter(item => {
                if (!item || !item.id) return false;
                if (this._isItemGloballyPurged(item)) return false;
                if (this._isItemUserDeleted(item)) return false;
                item.read = this._isItemUserRead(item);
                const itemEvtId = item.data?.eventId || item.eventId;
                return !activeEventNotifs.some(a => {
                    if (!a) return false;
                    if (a.id === item.id) return true;
                    const aEvtId = a.data?.eventId || a.eventId;
                    if (itemEvtId && aEvtId && itemEvtId === aEvtId) return true;
                    return false;
                });
            });

            const combined = [...firestoreNotifs, ...chatNotifs, ...activeEventNotifs, ...cancelledLogs];

            // Inyectar notificación de sistema del nuevo Radar & Clima (si no ha sido eliminada por el usuario ni purgada globalmente)
            const isRadarDeleted = this._isItemUserDeleted({ id: 'system_radar_clima_relocated' });
            if (!isRadarDeleted && !this._isItemGloballyPurged({ id: 'system_radar_clima_relocated' })) {
                const isRadarRead = this._isItemUserRead({ id: 'system_radar_clima_relocated' });
                // Fecha estática histórica, NUNCA new Date().toISOString()
                const radarTs = localStorage.getItem('sp_radar_relocated_notif_ts') || '2026-09-21T09:00:00.000Z';
                if (!localStorage.getItem('sp_radar_relocated_notif_ts')) {
                    try { localStorage.setItem('sp_radar_relocated_notif_ts', radarTs); } catch (_) {}
                }
                combined.unshift({
                    id: 'system_radar_clima_relocated',
                    title: '🌦️ Radar Táctico y Clima de Pistas',
                    body: 'Nuevo mapa de viento/lluvia y telemetría de pistas en El Prat y Cornellà. ¡Disponible en Americanas y Entrenos!',
                    timestamp: radarTs,
                    read: isRadarRead,
                    icon: 'cloud-sun',
                    category: 'clima',
                    data: {
                        url: 'clima'
                    }
                });
            }

            // Ordenar por tiempo (descendente)
            const sorted = combined.sort((a, b) => {
                const timeA = this._getTimestampValue(a.timestamp);
                const timeB = this._getTimestampValue(b.timestamp);
                return timeB - timeA;
            });

            // Enriquecer y Deduplicar contenido para evitar spam repetitivo
            const seen = new Set();
            const deduplicated = [];

            for (const rawItem of sorted) {
                if (!rawItem) continue;
                if (this._isItemGloballyPurged(rawItem)) continue;
                if (this._isItemUserDeleted(rawItem)) continue;

                let title = String(rawItem.title || rawItem.name || '').trim();
                let body = String(rawItem.body || rawItem.text || rawItem.message || '').trim();

                // Normalización de títulos repetitivos antiguos
                if (title === 'Inscripción OK' || title === 'Inscripcion OK') {
                    title = '✅ Inscripción Confirmada';
                    if (!body) body = 'Tu plaza está reservada para el próximo evento. ¡Nos vemos en la pista!';
                } else if (title === 'Baja Confirmada') {
                    title = '📋 Baja de Torneo Tramitada';
                    if (!body) body = 'Has liberado tu plaza para el evento correctamente.';
                } else if (title.includes('PLAZA LIBRE') || title.includes('Plaza Libre')) {
                    if (!title.startsWith('⚡')) {
                        title = '⚡ ¡Plaza Libre Disponible!';
                        if (!body) body = 'Hay una plaza vacante en el torneo de hoy. Entra y resérvala antes de que se agote.';
                    }
                }

                const eventId = rawItem.data?.eventId || rawItem.eventId;
                const isCancelled = Boolean(rawItem.isCancelled || rawItem.data?.isCancelled || title.toLowerCase().includes('cancelad') || title.toLowerCase().includes('suspendid') || title.toLowerCase().includes('eliminad'));
                const isSpot = Boolean(String(rawItem.id || '').startsWith('evt_spot_') || title.toLowerCase().includes('plaza libre'));
                const isNew = Boolean(String(rawItem.id || '').startsWith('evt_new_') || title.toLowerCase().includes('nuevo') || title.toLowerCase().includes('nueva'));

                // Firmas de deduplicación complementarias:
                // 1. Clave por Evento + Acción
                const evtSignature = eventId ? `evt_${eventId}_${isCancelled ? 'cancelled' : (isSpot ? 'spot' : (isNew ? 'new' : 'action'))}` : null;
                // 2. Clave por Contenido Textual Exacto
                const textSignature = `txt_${title.toLowerCase().trim()}|${body.toLowerCase().trim()}`;
                // 3. Clave por ID explícito
                const idSignature = rawItem.id ? `id_${rawItem.id}` : null;

                // Descartar si alguna de las firmas está en las purgas globales
                if (evtSignature && this.globalPurgedIds && this.globalPurgedIds.has(evtSignature)) continue;
                if (textSignature && this.globalPurgedIds && this.globalPurgedIds.has(textSignature)) continue;
                if (idSignature && this.globalPurgedIds && this.globalPurgedIds.has(idSignature)) continue;

                if (evtSignature && seen.has(evtSignature)) continue;
                if (seen.has(textSignature)) continue;
                if (idSignature && seen.has(idSignature)) continue;

                if (evtSignature) seen.add(evtSignature);
                seen.add(textSignature);
                if (idSignature) seen.add(idSignature);

                deduplicated.push({
                    ...rawItem,
                    title: title || 'Aviso SomosPadel',
                    body: body || 'Nueva actualización disponible en tu cuenta.',
                    read: this._isItemUserRead(rawItem)
                });
            }

            return deduplicated.slice(0, 50);
        } catch (e) {
            console.error("❌ [NotificationService] Merging failed:", e);
            return (this.notifications || []).filter(n => !this._isItemUserDeleted(n) && !this._isItemGloballyPurged(n)).slice(0, 20);
        }
    }

    _getTimestampValue(ts) {
        if (!ts) return 0;
        if (ts.toMillis && typeof ts.toMillis === 'function') return ts.toMillis();
        if (ts.toDate && typeof ts.toDate === 'function') return ts.toDate().getTime();
        if (ts instanceof Date) return ts.getTime();
        if (typeof ts === 'string') {
            const parsed = Date.parse(ts);
            return isNaN(parsed) ? 0 : parsed;
        }
        if (typeof ts === 'number') {
            return ts < 10000000000 ? ts * 1000 : ts;
        }
        return 0;
    }

    /**
     * Extrae el timestamp real de creación o modificación del evento,
     * o infiere la fecha y hora a partir de 'date' y 'time'.
     */
    _extractEventTimestamp(evt) {
        if (!evt) return '2026-09-21T09:00:00.000Z';

        // 1. Extraer de createdAt, created_at, timestamp, updatedAt, updated_at
        const raw = evt.createdAt || evt.created_at || evt.timestamp || evt.updatedAt || evt.updated_at;
        if (raw) {
            if (raw.toDate && typeof raw.toDate === 'function') {
                return raw.toDate().toISOString();
            }
            if (raw.toMillis && typeof raw.toMillis === 'function') {
                return new Date(raw.toMillis()).toISOString();
            }
            if (raw instanceof Date) {
                return raw.toISOString();
            }
            if (typeof raw === 'number') {
                const ms = raw < 10000000000 ? raw * 1000 : raw;
                return new Date(ms).toISOString();
            }
            if (typeof raw === 'string') {
                const parsed = Date.parse(raw);
                if (!isNaN(parsed)) {
                    return new Date(parsed).toISOString();
                }
            }
        }

        // 2. Si no, inferir fecha/hora real a partir de date ('YYYY-MM-DD' o 'DD/MM/YYYY') y time ('HH:mm')
        if (evt.date) {
            try {
                const timeStr = String(evt.time || '10:00').trim();
                const dateStr = String(evt.date).trim();
                let year, month, day;

                if (dateStr.includes('-')) {
                    const parts = dateStr.split('-');
                    if (parts[0].length === 4) {
                        year = parseInt(parts[0], 10);
                        month = parseInt(parts[1], 10) - 1;
                        day = parseInt(parts[2], 10);
                    } else if (parts[2] && parts[2].length === 4) {
                        year = parseInt(parts[2], 10);
                        month = parseInt(parts[1], 10) - 1;
                        day = parseInt(parts[0], 10);
                    }
                } else if (dateStr.includes('/')) {
                    const parts = dateStr.split('/');
                    if (parts[2] && parts[2].length === 4) {
                        year = parseInt(parts[2], 10);
                        month = parseInt(parts[1], 10) - 1;
                        day = parseInt(parts[0], 10);
                    } else if (parts[0] && parts[0].length === 4) {
                        year = parseInt(parts[0], 10);
                        month = parseInt(parts[1], 10) - 1;
                        day = parseInt(parts[2], 10);
                    }
                }

                const timeParts = timeStr.split(':');
                const hours = parseInt(timeParts[0] || '10', 10);
                const minutes = parseInt(timeParts[1] || '0', 10);

                if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
                    const inferred = new Date(year, month, day, hours, minutes, 0, 0);
                    if (!isNaN(inferred.getTime())) {
                        return inferred.toISOString();
                    }
                }
            } catch (_) {}
        }

        return '2026-09-21T09:00:00.000Z';
    }

    /**
     * Obtiene el historial persistente de eventos cancelados/eliminados de localStorage
     * y sanea automáticamente duplicados preexistentes.
     * @returns {Array<object>}
     */
    _getCancelledEventsLog() {
        try {
            const raw = localStorage.getItem('sp_cancelled_events_log');
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return [];

            // Deduplicación estricta por eventId, id o contenido idéntico
            const unique = [];
            const seen = new Set();
            for (const item of parsed) {
                if (!item || !item.id) continue;
                const evtId = item.data?.eventId || item.eventId || '';
                const titleStr = String(item.title || '').trim().toLowerCase();
                const bodyStr = String(item.body || '').trim().toLowerCase();
                const key = evtId ? `evt_${evtId}` : (item.id ? `id_${item.id}` : `${titleStr}|${bodyStr}`);

                if (!seen.has(key)) {
                    seen.add(key);
                    unique.push(item);
                }
            }

            // Si se detectaron y limpiaron duplicados, actualizar localStorage
            if (unique.length !== parsed.length) {
                try {
                    localStorage.setItem('sp_cancelled_events_log', JSON.stringify(unique));
                } catch (_) {}
            }

            return unique;
        } catch (e) {
            console.warn("⚠️ [NotificationService] Error leyendo sp_cancelled_events_log:", e);
            return [];
        }
    }

    /**
     * Guarda de forma persistente un evento cancelado/eliminado en localStorage
     * para que no desaparezca cuando el documento sea borrado en Firestore.
     * Deduplica estrictamente para evitar entradas redundantes.
     * @param {object} notif 
     */
    _saveCancelledEvent(notif) {
        if (!notif || !notif.id) return;
        try {
            let log = this._getCancelledEventsLog();
            const notifEvtId = notif.data?.eventId || notif.eventId;
            const notifTitle = String(notif.title || '').trim().toLowerCase();
            const notifBody = String(notif.body || '').trim().toLowerCase();
            const notifTextSig = `${notifTitle}|${notifBody}`;

            const idx = log.findIndex(item => {
                if (!item) return false;
                if (item.id === notif.id) return true;
                const itemEvtId = item.data?.eventId || item.eventId;
                if (notifEvtId && itemEvtId && itemEvtId === notifEvtId) return true;
                const itemTitle = String(item.title || '').trim().toLowerCase();
                const itemBody = String(item.body || '').trim().toLowerCase();
                if (`${itemTitle}|${itemBody}` === notifTextSig) return true;
                return false;
            });

            if (idx >= 0) {
                const prev = log[idx];
                log[idx] = {
                    ...prev,
                    ...notif,
                    timestamp: prev.timestamp || notif.timestamp
                };
            } else {
                log.unshift(notif);
            }

            // Mantener un historial controlado de hasta 50 eventos cancelados
            if (log.length > 50) {
                log = log.slice(0, 50);
            }
            localStorage.setItem('sp_cancelled_events_log', JSON.stringify(log));
        } catch (e) {
            console.warn("⚠️ [NotificationService] Error guardando en sp_cancelled_events_log:", e);
        }
    }

    /**
     * Elimina las notificaciones de 'nuevo evento' o 'plazas libres' asociadas a un ID
     * tanto en memoria, en localStorage (evita reaparición) como en la bandeja nativa.
     * @param {string} type 
     * @param {string} id 
     */
    _removeEventActiveNotifs(type, id) {
        if (!id) return;
        const normType = (type === 'entreno' || String(type).toLowerCase().includes('entreno')) ? 'entreno' : 'americana';
        const newId = `evt_new_${normType}_${id}`;
        const spotId = `evt_spot_${normType}_${id}`;

        // Limpiar en memoria
        if (Array.isArray(this.eventNotifications)) {
            this.eventNotifications = this.eventNotifications.filter(n => n && n.id !== newId && n.id !== spotId);
        }

        // Marcar como borradas en localStorage
        try {
            localStorage.setItem('sp_evt_deleted_' + newId, 'true');
            localStorage.setItem('sp_evt_deleted_' + spotId, 'true');
        } catch (_) {}

        // Limpiar de la bandeja de notificaciones nativa del SO
        this.clearNativeNotification(newId);
        this.clearNativeNotification(spotId);
    }

    /**
     * Maneja la eliminación física de un evento en Firestore o llamada desde EventService
     * @param {string} type 
     * @param {string} id 
     * @param {object} eventData 
     */
    handleEventDeleted(type, id, eventData = {}) {
        if (!id) return;
        const normType = (type === 'entreno' || String(eventData.name || '').toLowerCase().includes('entreno')) ? 'entreno' : 'americana';
        const notifId = `evt_cancelled_${normType}_${id}`;

        // Retirar notificaciones previas de nuevo evento o plazas libres
        this._removeEventActiveNotifs(normType, id);

        const isRead = localStorage.getItem('sp_evt_read_' + notifId) === 'true';
        const isDeleted = localStorage.getItem('sp_evt_deleted_' + notifId) === 'true';

        const notif = {
            id: notifId,
            title: `⛔ ${normType === 'entreno' ? 'Entreno Eliminado' : 'Americana Eliminada'}: ${eventData.name || 'Convocatoria'}`,
            body: `El evento previsto para el ${eventData.date || ''} a las ${eventData.time || ''} ha sido cancelado o eliminado por la organización.`,
            timestamp: new Date().toISOString(),
            category: normType === 'entreno' ? 'entrenos' : 'matches',
            isCancelled: true,
            read: isRead,
            data: {
                id: notifId,
                url: normType === 'entreno' ? 'entrenos' : 'americanas',
                eventId: id,
                isCancelled: true
            }
        };

        // Guardar persistentemente en sp_cancelled_events_log
        this._saveCancelledEvent(notif);

        // Disparar push nativo fuera de la app para alertar al móvil de inmediato
        if (!isDeleted) {
            this._checkAndTriggerPush(notif);
            this.showNativeNotification(notif.title, notif.body, notif.data);
        }

        if (!this._isInsideSnapshotBatch && this._hasInitialEventsLoaded) {
            this._processEventsFeed();
        }
    }

    /**
     * Maneja la cancelación o suspensión de un evento (cambio de estado o llamada directa)
     * @param {string} type 
     * @param {string} id 
     * @param {object} eventData 
     * @param {string} reasonOrStatus 
     * @param {boolean} skipPush 
     */
    handleEventCancelled(type, id, eventData = {}, reasonOrStatus = '', skipPush = false) {
        if (!id) return;
        const normType = (type === 'entreno' || String(eventData.name || '').toLowerCase().includes('entreno')) ? 'entreno' : 'americana';
        const notifId = `evt_cancelled_${normType}_${id}`;

        // Retirar notificaciones previas de plazas libres o nuevo evento
        this._removeEventActiveNotifs(normType, id);

        const status = String(reasonOrStatus || eventData.status || 'cancelled').toLowerCase().trim();
        const isSuspended = ['suspendido', 'suspended', 'postponed'].includes(status);
        const actionLabel = isSuspended
            ? (normType === 'americana' ? 'Suspendida' : 'Suspendido')
            : (status === 'anulado'
                ? (normType === 'americana' ? 'Anulada' : 'Anulado')
                : (normType === 'americana' ? 'Cancelada' : 'Cancelado'));
        const icon = isSuspended ? '⚠️' : '⛔';

        const isRead = localStorage.getItem('sp_evt_read_' + notifId) === 'true';
        const isDeleted = localStorage.getItem('sp_evt_deleted_' + notifId) === 'true';

        const reason = eventData.cancelReason || eventData.reason || '';
        const bodyText = reason
            ? `El evento del ${eventData.date || ''} a las ${eventData.time || ''} ha sido ${actionLabel.toLowerCase()}: ${reason}`
            : `El evento previsto para el ${eventData.date || ''} a las ${eventData.time || ''} ha sido ${isSuspended ? 'suspendido' : 'cancelado o anulado'} por la organización.`;

        const notif = {
            id: notifId,
            title: `${icon} ${normType === 'entreno' ? 'Entreno ' + actionLabel : 'Americana ' + actionLabel}: ${eventData.name || 'Convocatoria'}`,
            body: bodyText,
            timestamp: new Date().toISOString(),
            category: normType === 'entreno' ? 'entrenos' : 'matches',
            isCancelled: true,
            read: isRead,
            data: {
                id: notifId,
                url: normType === 'entreno' ? 'entrenos' : 'americanas',
                eventId: id,
                isCancelled: true
            }
        };

        // Guardar persistentemente en sp_cancelled_events_log
        this._saveCancelledEvent(notif);

        // Disparar push nativo fuera de la app
        if (!isDeleted && !skipPush) {
            this._checkAndTriggerPush(notif);
            this.showNativeNotification(notif.title, notif.body, notif.data);
        }

        if (!this._isInsideSnapshotBatch && this._hasInitialEventsLoaded) {
            this._processEventsFeed();
        }
    }

    /**
     * Observa las colecciones 'americanas' y 'entrenos' en tiempo real
     * para sincronizar eventos reales y plazas libres tanto para usuarios como invitados.
     */
    initEventsFeedObserver() {
        if (this._eventsObserverStarted) return;
        this._eventsObserverStarted = true;
        console.log("🏆 [NotificationService] initEventsFeedObserver starting...");

        const firestore = window.db || (window.firebase && typeof window.firebase.firestore === 'function' ? window.firebase.firestore() : null);

        if (!firestore) {
            console.log("⏳ [NotificationService] Firestore no disponible de inmediato para feed de eventos, reintentando...");
            const retryInterval = setInterval(() => {
                const fs = window.db || (window.firebase && typeof window.firebase.firestore === 'function' ? window.firebase.firestore() : null);
                if (fs) {
                    clearInterval(retryInterval);
                    this._eventsObserverStarted = false;
                    this.initEventsFeedObserver();
                }
            }, 500);

            setTimeout(() => {
                clearInterval(retryInterval);
                if (this.eventsUnsubscribes.length === 0) {
                    this._loadEventsFallback();
                }
            }, 3000);
            return;
        }

        const collectionsToWatch = [
            { name: 'americanas', type: 'americana' },
            { name: 'entrenos', type: 'entreno' }
        ];

        let directConnectionFailed = false;

        collectionsToWatch.forEach(({ name, type }) => {
            try {
                const unsub = firestore.collection(name).onSnapshot(
                    snapshot => {
                        let hasChanges = false;
                        this._isInsideSnapshotBatch = true;
                        try {
                            snapshot.docChanges().forEach(change => {
                                const data = change.doc.data() || {};
                                const evtId = change.doc.id;
                                const evt = { id: evtId, ...data };

                                if (change.type === 'removed') {
                                    // 1. Obtener datos previos del evento desde this._eventsMap
                                    const prev = this._eventsMap.get(evtId);
                                    const prevEvent = (prev && prev.event) ? prev.event : evt;
                                    const prevType = (prev && prev.type) ? prev.type : type;
                                    this._eventsMap.delete(evtId);

                                    // Generar notificación de cancelación/eliminación y disparar push nativo
                                    this.handleEventDeleted(prevType, evtId, prevEvent);
                                    hasChanges = true;
                                } else if (change.type === 'modified') {
                                    const status = String(evt.status || '').toLowerCase().trim();
                                    const isCancelled = ['cancelled', 'cancelado', 'suspendido', 'anulado', 'suspended', 'postponed'].includes(status);
                                    this._eventsMap.set(evtId, { event: evt, type });

                                    // Si un evento cambia a estado cancelado o suspendido
                                    if (isCancelled) {
                                        this.handleEventCancelled(type, evtId, evt, status);
                                    }
                                    hasChanges = true;
                                } else {
                                    // 'added'
                                    const status = String(evt.status || '').toLowerCase().trim();
                                    const isCancelled = ['cancelled', 'cancelado', 'suspendido', 'anulado', 'suspended', 'postponed'].includes(status);
                                    this._eventsMap.set(evtId, { event: evt, type });

                                    if (isCancelled) {
                                        this.handleEventCancelled(type, evtId, evt, status, !this._hasInitialEventsLoaded);
                                    }
                                    hasChanges = true;
                                }
                            });
                        } finally {
                            this._isInsideSnapshotBatch = false;
                        }

                        if (hasChanges || !this._hasInitialEventsLoaded) {
                            this._hasInitialEventsLoaded = true;
                            this._processEventsFeed();
                        }
                    },
                    err => {
                        console.warn(`⚠️ [NotificationService] onSnapshot error on collection '${name}':`, err);
                        if (!directConnectionFailed) {
                            directConnectionFailed = true;
                            this._loadEventsFallback();
                        }
                    }
                );
                this.eventsUnsubscribes.push(unsub);
            } catch (err) {
                console.warn(`⚠️ [NotificationService] Error attaching listener to '${name}':`, err);
                if (!directConnectionFailed) {
                    directConnectionFailed = true;
                    this._loadEventsFallback();
                }
            }
        });
    }

    /**
     * Fallback para cargar eventos a través de AmericanaService si falla la conexión directa de Firestore
     */
    async _loadEventsFallback() {
        console.log("🔄 [NotificationService] Cargando eventos vía AmericanaService.getAllActiveEvents()...");
        try {
            if (!window.AmericanaService) return;
            const events = await window.AmericanaService.getAllActiveEvents();
            if (Array.isArray(events) && events.length > 0) {
                events.forEach(evt => {
                    const isEntreno = evt.type === 'entreno' ||
                        String(evt.name || evt.title || '').toLowerCase().includes('entreno');
                    const type = isEntreno ? 'entreno' : 'americana';
                    this._eventsMap.set(evt.id, { event: evt, type });
                });
                this._processEventsFeed();
            }
        } catch (e) {
            console.error("❌ [NotificationService] Fallback de eventos falló:", e);
        }
    }

    /**
     * Procesa los eventos detectados en el feed y genera notificaciones de nuevos eventos, plazas libres
     * e integra el registro persistente de eventos cancelados y eliminados.
     */
    _processEventsFeed() {
        const generated = [];

        this._eventsMap.forEach(({ event: evt, type }) => {
            if (!evt || !evt.id) return;

            const status = String(evt.status || '').toLowerCase().trim();
            const isCancelled = ['cancelled', 'cancelado', 'suspendido', 'anulado', 'suspended', 'postponed'].includes(status);

            // Si el evento está cancelado o suspendido, no generar aviso de nuevo ni plazas libres
            if (isCancelled) {
                this._removeEventActiveNotifs(type, evt.id);
                const cId = `evt_cancelled_${type}_${evt.id}`;
                const cancelledLogs = this._getCancelledEventsLog();
                if (!cancelledLogs.some(c => c && c.id === cId)) {
                    this.handleEventCancelled(type, evt.id, evt, status, !this._hasInitialEventsLoaded);
                }
                return;
            }

            const realTimestamp = this._extractEventTimestamp(evt);
            const timeMs = this._getTimestampValue(realTimestamp);
            const now = Date.now();
            const isRecentCreation = !isNaN(timeMs) && (now - timeMs) >= 0 && (now - timeMs) <= (72 * 60 * 60 * 1000);

            const isFinished = ['finished', 'finalizado', 'completed'].includes(status);
            const isActive = !isFinished;

            // 1. Si el evento es reciente (creado en las últimas 72 horas o activo actualmente)
            if (isRecentCreation || isActive) {
                const newId = `evt_new_${type}_${evt.id}`;
                const isDeleted = localStorage.getItem('sp_evt_deleted_' + newId) === 'true';
                if (!isDeleted) {
                    const isRead = localStorage.getItem('sp_evt_read_' + newId) === 'true';

                    const newNotif = {
                        id: newId,
                        title: `${type === 'entreno' ? '💪 Nuevo Entreno' : '🏆 Nueva Americana'}: ${evt.name || 'Torneo SomosPadel'}`,
                        body: `Fecha: ${evt.date || ''} a las ${evt.time || ''} · ${evt.courts || 4} pistas · ${evt.location || 'SomosPadel'}. ¡Inscripciones abiertas!`,
                        timestamp: realTimestamp,
                        category: type === 'entreno' ? 'entrenos' : 'matches',
                        read: isRead,
                        data: { url: type === 'entreno' ? 'entrenos' : 'americanas', eventId: evt.id, id: newId }
                    };

                    generated.push(newNotif);
                    this._checkAndTriggerPush(newNotif);
                }
            }

            // 2. Si el evento tiene plazas libres y está abierto
            const maxPlayers = Number(evt.max_players || evt.maxPlayers || (evt.courts ? evt.courts * 4 : 16));
            const registeredCount = Array.isArray(evt.players)
                ? evt.players.length
                : (Array.isArray(evt.registeredPlayers) ? evt.registeredPlayers.length : 0);
            const openSpots = maxPlayers - registeredCount;
            const isOpen = (status === 'open' || !isFinished);

            if (openSpots > 0 && isOpen) {
                const spotId = `evt_spot_${type}_${evt.id}`;
                const isSpotDeleted = localStorage.getItem('sp_evt_deleted_' + spotId) === 'true';
                if (!isSpotDeleted) {
                    const isSpotRead = localStorage.getItem('sp_evt_read_' + spotId) === 'true';

                    const spotNotif = {
                        id: spotId,
                        title: `⚡ ¡${openSpots} ${openSpots === 1 ? 'Plaza Libre' : 'Plazas Libres'}! ${evt.name || 'Torneo'}`,
                        body: `Quedan ${openSpots} plazas vacantes para jugar el ${evt.date || ''} a las ${evt.time || ''}. ¡Reserva antes de que se completen!`,
                        timestamp: realTimestamp,
                        category: type === 'entreno' ? 'entrenos' : 'matches',
                        read: isSpotRead,
                        data: { url: type === 'entreno' ? 'entrenos' : 'americanas', eventId: evt.id, id: spotId }
                    };

                    generated.push(spotNotif);
                    this._checkAndTriggerPush(spotNotif);
                }
            }
        });

        // 3. Integrar los eventos del registro persistente 'sp_cancelled_events_log'
        const cancelledLogs = this._getCancelledEventsLog();
        cancelledLogs.forEach(cNotif => {
            if (!cNotif || !cNotif.id) return;

            // Respetar si el usuario la ha eliminado individualmente
            if (localStorage.getItem('sp_evt_deleted_' + cNotif.id) === 'true') return;

            // Respetar si el usuario la ha leído individualmente
            cNotif.read = localStorage.getItem('sp_evt_read_' + cNotif.id) === 'true';

            // Evitar duplicados en generated
            if (!generated.some(n => n.id === cNotif.id)) {
                generated.push(cNotif);
            }
        });

        this.eventNotifications = generated;
        this.notifySubscribers();
        this.updateAppBadge();
    }

    /**
     * Soporte FUERA DE LA APP (Web Push / Push Notifications nativas)
     * e In-App feedback si está en primer plano.
     */
    _checkAndTriggerPush(notif) {
        if (!notif || !notif.id) return;
        const id = notif.id;

        if (localStorage.getItem('sp_pushed_' + id) === 'true') {
            return;
        }

        const isPushAllowed = (typeof Notification !== 'undefined' && Notification.permission === 'granted') ||
            (localStorage.getItem('somospadel_push_enabled') === 'true');

        if (isPushAllowed) {
            this.showNativeNotification(notif.title, notif.body, notif.data);
            try {
                localStorage.setItem('sp_pushed_' + id, 'true');
            } catch (_) {}

            const isForeground = typeof document !== 'undefined' && !document.hidden;
            if (isForeground) {
                this.showInAppToast(notif.title, notif.body);
                if (window.NotificationUi && typeof window.NotificationUi.playNotificationSound === 'function') {
                    window.NotificationUi.playNotificationSound();
                }
            }
        }
    }

    stopEventsFeedObserver() {
        this.eventsUnsubscribes.forEach(unsub => {
            try { unsub(); } catch (_) {}
        });
        this.eventsUnsubscribes = [];
        this._eventsObserverStarted = false;
    }

    /**
     * Escucha en tiempo real la subcolección de notificaciones del usuario
     */
    subscribeToFirestore(userId) {
        if (this.unsubscribe) return;

        console.log("🔔 [NotificationService] Subscribing to Firestore...");
        this.unsubscribe = window.db.collection('players').doc(userId).collection('notifications')
            .orderBy('timestamp', 'desc')
            .limit(50)
            .onSnapshot(snapshot => {
                const items = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                this.notifications = items;
                this.unreadCount = this.getMergedNotifications().filter(n => !n.read).length;

                console.log(`🔔 [NotificationService] Updated: ${this.unreadCount} unread`);

                // Iniciar observación de chats al cargar notificaciones (solo la primera vez)
                if (!this._chatObserverStarted) {
                    this._chatObserverStarted = true;
                    this.initChatObserver();
                }

                // NEW: Visual feedback for local/dev environment
                let isFirstLoad = !this.hasLoadedInitialBatch;

                if (snapshot.docChanges().length > 0) {
                    snapshot.docChanges().forEach(change => {
                        if (change.type === 'added') {
                            const data = change.doc.data() || {};
                            const changeItem = { id: change.doc.id, ...data };
                            if (this._isItemGloballyPurged(changeItem) || this._isItemUserDeleted(changeItem)) {
                                return;
                            }
                            const isRead = this._isItemUserRead(changeItem);

                            // Only show visual toasts for NEW arrivals after initial load
                            // to prevent clumping on startup
                            if (!isRead && !isFirstLoad) {
                                console.log("📣 NEW NOTIFICATION RECEIVED:", data.title, data.body);
                                // Pasamos el ID del documento para que se pueda borrar nativamente luego
                                this.showNativeNotification(data.title, data.body, { ...data.data, id: change.doc.id });

                                // Feedback visual discreto si no hay permisos push
                                const notificationSupported = 'Notification' in window;
                                if (!notificationSupported || Notification.permission !== 'granted') {
                                    this.showInAppToast(data.title, data.body);
                                }
                            }
                        }
                    });
                }

                this.hasLoadedInitialBatch = true;

                this.notifySubscribers();
                this.updateAppBadge(); // NEW: Actualizar badge del icono de la app
            }, error => {
                console.error("🔔 [NotificationService] Listener Error:", error);
            });
    }

    /**
     * Actualiza el badge (contador) en el icono de la app instalada (PWA)
     * Funciona en Android, iOS (PWA 16.4+) y Desktop
     */
    async updateAppBadge() {
        if ('setAppBadge' in navigator) {
            try {
                if (this.unreadCount > 0) {
                    await navigator.setAppBadge(this.unreadCount);
                    console.log(`🔢 [NotificationService] App Badge set to: ${this.unreadCount}`);
                } else {
                    await navigator.clearAppBadge();
                    console.log("VX [NotificationService] App Badge cleared");
                }
            } catch (e) {
                console.warn("⚠️ [NotificationService] Error setting app badge:", e);
            }
        }
    }

    /**
     * Observa los chats de eventos activos para mostrar mensajes en tiempo real
     */
    async initChatObserver() {
        // NOTA: No limpiamos agresivamente para no interrumpir listeners activos
        // Solo añadiremos los eventos que no tengan listener

        try {
            if (!window.AmericanaService) return;

            // Reintentar si no hay eventos activos (puede ser que se estén cargando)
            let events = await window.AmericanaService.getAllActiveEvents();
            if (!events || events.length === 0) {
                console.log("💬 [NotificationService] No initial events found, retrying in 2s...");
                await new Promise(r => setTimeout(r, 2000));
                events = await window.AmericanaService.getAllActiveEvents();
            }

            if (!events || events.length === 0) {
                console.warn("💬 [NotificationService] No direct active events found to monitor chats.");
                return;
            }

            console.log(`💬 [NotificationService] Total events to monitor: ${events.length}. Current active observers: ${this.chatUnsubscribes.size}`);

            // Filtrar solo eventos nuevos para no duplicar listeners
            const newEvents = events.filter(evt => !this.chatUnsubscribes.has(evt.id));
            if (newEvents.length === 0) {
                console.log("💬 [NotificationService] No new events detected for chat monitoring.");
                return;
            }

            console.log(`💬 [NotificationService] SUBSCRIBING to ${newEvents.length} NEW chats:`, newEvents.map(e => e.name));

            newEvents.forEach(evt => {
                const unsub = window.db.collection('chats').doc(evt.id).collection('messages')
                    .orderBy('timestamp', 'desc')
                    .limit(5)
                    .onSnapshot(snap => {
                        let hasNew = false;
                        snap.docChanges().forEach(change => {
                            if (change.type === 'added') {
                                const msg = change.doc.data();
                                // IMPORTANTE: El timestamp de servidor puede venir null en el primer cambio local
                                const msgTime = msg.timestamp ? (msg.timestamp.toMillis ? msg.timestamp.toMillis() : msg.timestamp) : Date.now();

                                console.log(`💬 [Chat Debug] Msg from ${msg.senderName}: "${msg.text?.substring(0, 15)}..." Time: ${msgTime} vs Service: ${this.serviceStartTime}`);

                                // Relajamos el filtro: aceptamos cualquier mensaje recibido DESDE que se inició el servicio
                                // con un margen de 5 minutos por discrepancias de reloj.
                                if (msgTime > this.serviceStartTime - 300000) {
                                    // Evitar duplicados con ID robusto
                                    const chatNotifId = `chat_${evt.id}_${change.doc.id}`;
                                    if (!this.chatNotifications.find(n => n.id === chatNotifId)) {
                                        console.log("💬 [Chat Observer] New message detected:", msg.text);
                                        this.chatNotifications.push({
                                            id: chatNotifId,
                                            title: `💬 ${msg.senderName || 'Chat'} [${evt.name || 'Evento'}]:`,
                                            body: msg.text,
                                            timestamp: msg.timestamp || new Date(),
                                            read: true, // Marcar como leída para no inflar el contador del badge
                                            icon: 'comment-dots',
                                            isChat: true,
                                            data: { url: 'live', eventId: evt.id }
                                        });
                                        hasNew = true;
                                    }
                                }
                            }
                        });

                        if (hasNew) {
                            console.log("💬 [NotificationService] New chat messages loaded, notifying subscribers");
                            // Limitar cache local de chats
                            if (this.chatNotifications.length > 20) {
                                this.chatNotifications = this.chatNotifications.slice(-20);
                            }
                            this.notifySubscribers();
                        }
                    });
                this.chatUnsubscribes.set(evt.id, unsub);
            });

            // No llamamos notifySubscribers() aquí incondicionalmente — 
            // solo se notifica dentro del snapshot cuando hay mensajes realmente nuevos (hasNew=true).
        } catch (e) {
            console.warn("💬 [NotificationService] Chat observation failed:", e);
        }
    }

    stopChatObserver() {
        this.chatUnsubscribes.forEach(unsub => unsub());
        this.chatUnsubscribes.clear();
        this.chatNotifications = [];
    }

    unsubscribeFirestore() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
        this.notifications = [];
        this.unreadCount = 0;
        this.notifySubscribers();
    }

    /**
     * Obtiene o genera un identificador único persistente para este navegador/dispositivo
     */
    getDeviceId() {
        let deviceId = null;
        try {
            deviceId = localStorage.getItem('sp_device_id');
        } catch (e) {}

        if (!deviceId) {
            deviceId = 'dev_' + (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : (Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9)));
            try {
                localStorage.setItem('sp_device_id', deviceId);
            } catch (e) {
                console.warn("⚠️ [NotificationService] No se pudo guardar sp_device_id en localStorage:", e);
            }
        }
        return deviceId;
    }

    /**
     * Detecta la plataforma del dispositivo actual ('ios', 'android', 'desktop')
     */
    getDevicePlatform() {
        const ua = navigator.userAgent || '';
        if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
            return 'ios';
        }
        if (/android/i.test(ua)) {
            return 'android';
        }
        return 'desktop';
    }

    /**
     * Convierte una clave VAPID Base64 URL-safe a Uint8Array (estándar W3C Push API)
     */
    _urlB64ToUint8Array(base64String) {
        if (!base64String || typeof base64String !== 'string') return new Uint8Array(0);
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');
        const rawData = (typeof window !== 'undefined' && window.atob) ? window.atob(base64) : Buffer.from(base64, 'base64').toString('binary');
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    /**
     * Solicita permiso para Push Notifications.
     * IMPORTANTE: El permiso nativo del navegador se solicita SIEMPRE con soporte Promise y callback,
     * independientemente de si FCM/messaging está disponible.
     * El token FCM es opcional y su fallo no impide marcar el permiso como activo.
     */
    async requestPushPermission() {
        // DETECCIÓN ESPECÍFICA PARA IPHONE (iOS) sin modo standalone
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

        if (isIOS && !isStandalone) {
            if (window.PremiumModal) {
                window.PremiumModal.alert({
                    title: "📲 INSTALAR EN IPHONE",
                    message: "Para recibir avisos en tu iPhone, añade esta App a tu pantalla de inicio:<br><br>1. Pulsa el botón <strong>'Compartir'</strong> (cuadrado con flecha)<br>2. Selecciona <strong>'Añadir a pantalla de inicio'</strong>",
                    type: 'info'
                });
            }
            return false;
        }

        if (!('Notification' in window)) {
            console.warn("⚠️ API de Notificaciones no soportada en este entorno.");
            return false;
        }

        try {
            console.log("🔔 Solicitando permiso nativo de notificaciones...");

            // PASO 1: Petición de permiso nativo con soporte dual Promise y callback para navegadores móviles
            let permission = null;
            try {
                const req = Notification.requestPermission();
                if (req && typeof req.then === 'function') {
                    permission = await req;
                } else {
                    permission = await new Promise(resolve => Notification.requestPermission(resolve));
                }
            } catch (permErr) {
                console.warn("⚠️ Fallback por callback en requestPermission:", permErr);
                permission = await new Promise(resolve => Notification.requestPermission(resolve));
            }

            if (permission !== 'granted') {
                const isDenied = permission === 'denied';
                console.log(`🚫 Permiso no concedido por el usuario (${permission}).`);

                try {
                    localStorage.setItem('somospadel_push_enabled', 'false');
                } catch (_) {}

                await this.savePushSubscriptionStatus(false);

                window.dispatchEvent(new CustomEvent('sp_push_permission_changed', {
                    detail: { granted: false, denied: isDenied }
                }));

                if (isDenied && window.PremiumModal) {
                    window.PremiumModal.alert({
                        title: "AVISO BLOQUEADO",
                        message: "Has denegado las notificaciones. No podrás recibir avisos de nuevos partidos o plazas libres en tiempo real.",
                        type: 'warning'
                    });
                }

                return false;
            }

            // PASO 2: Permiso concedido - ACTIVACIÓN INSTANTÁNEA (0ms)
            console.log("✅ Permiso concedido por el navegador.");

            // 1. Guardar de forma síncrona e inmediata en localStorage
            try {
                localStorage.setItem('somospadel_push_enabled', 'true');
            } catch (_) {}

            // 2. Emitir evento global DE INMEDIATO para actualizar la UI en 0ms
            window.dispatchEvent(new CustomEvent('sp_push_permission_changed', {
                detail: { granted: true }
            }));

            // 3. Disparar notificación push de bienvenida real al dispositivo
            this.sendWelcomeNotification().catch(err => {
                console.warn("⚠️ Error en notificación de bienvenida:", err);
            });

            // 4. Tareas en segundo plano (Firestore, Web Push nativo y FCM) sin bloquear al usuario
            (async () => {
                try {
                    // Persistir en Firestore en perfil del usuario y subcolección devices
                    await this.savePushSubscriptionStatus(true);

                    let swReg = null;
                    if ('serviceWorker' in navigator) {
                        try { swReg = await navigator.serviceWorker.ready; } catch (_) {}
                    }

                    const VAPID_KEY = "BCQ_YjYrpwremCwo-xQhtP1x5TDi39LWQ2fuwnBAcyjxN3bJTD8WtXNYsFM7IDxHd3hzEPn2z7JRsLdT0l2L87E";
                    let nativePushSub = null;

                    // A. Suscripción nativa Web Push mediante W3C PushManager (funciona aunque FCM falle)
                    if (swReg && swReg.pushManager && VAPID_KEY && !VAPID_KEY.includes('placeholder')) {
                        try {
                            const convertedKey = this._urlB64ToUint8Array(VAPID_KEY);
                            nativePushSub = await swReg.pushManager.getSubscription();
                            if (!nativePushSub) {
                                nativePushSub = await swReg.pushManager.subscribe({
                                    userVisibleOnly: true,
                                    applicationServerKey: convertedKey
                                });
                            }
                            console.log("📡 [PushManager] Suscripción nativa Web Push OK:", nativePushSub.endpoint);
                        } catch (subErr) {
                            console.warn("⚠️ [PushManager] Aviso en suscripción nativa:", subErr);
                        }
                    }

                    // B. Registro de Token FCM si Firebase Messaging está activo
                    let currentFcmToken = null;
                    if (window.messaging) {
                        try {
                            const tokenOptions = {};
                            if (VAPID_KEY && !VAPID_KEY.includes('placeholder')) {
                                tokenOptions.vapidKey = VAPID_KEY;
                            }
                            if (swReg) {
                                tokenOptions.serviceWorkerRegistration = swReg;
                            }
                            currentFcmToken = await window.messaging.getToken(tokenOptions);
                            if (currentFcmToken) {
                                this.token = currentFcmToken;
                                console.log("🔑 FCM Token Registrado:", currentFcmToken);
                            }
                        } catch (fcmErr) {
                            console.warn("⚠️ [FCM] Aviso obteniendo token FCM:", fcmErr.message || fcmErr);
                        }
                    }

                    // C. Guardar en el perfil del jugador en Firestore con dualidad token / pushSubscription
                    const primaryToken = currentFcmToken || (nativePushSub ? nativePushSub.endpoint : null);
                    if (primaryToken || nativePushSub) {
                        await this.saveTokenToProfile(primaryToken, nativePushSub);
                    }
                } catch (bgErr) {
                    console.warn("⚠️ Sincronización push en segundo plano:", bgErr.message || bgErr);
                }
            })();

            return true;

        } catch (e) {
            console.error("🚨 Error en el flujo de permisos:", e);
            const isGranted = typeof Notification !== 'undefined' && Notification.permission === 'granted';
            if (isGranted) {
                try { localStorage.setItem('somospadel_push_enabled', 'true'); } catch (_) {}
                window.dispatchEvent(new CustomEvent('sp_push_permission_changed', { detail: { granted: true } }));
                this.savePushSubscriptionStatus(true).catch(() => {});
            }
            return isGranted;
        }
    }

    /**
     * Persiste el estado de suscripción de notificaciones push tanto en localStorage
     * como en Firestore (perfil del jugador y subcolección de devices).
     * @param {boolean} granted
     */
    async savePushSubscriptionStatus(granted) {
        try {
            localStorage.setItem('somospadel_push_enabled', granted ? 'true' : 'false');
        } catch (storageErr) {
            console.warn("⚠️ [NotificationService] Error guardando estado push en localStorage:", storageErr);
        }

        const uid = this.currentUserUid || (window.auth && window.auth.currentUser?.uid) || (window.Store ? window.Store.getState('currentUser')?.uid : null);
        if (!uid || !window.db) {
            console.log("ℹ️ [NotificationService] savePushSubscriptionStatus: Usuario no autenticado o Firestore no inicializado.");
            return;
        }

        const deviceId = this.getDeviceId();
        const platform = this.getDevicePlatform();
        const nowIso = new Date().toISOString();
        const permStatus = granted ? 'granted' : (typeof Notification !== 'undefined' ? Notification.permission : 'denied');
        const serverTs = (typeof firebase !== 'undefined' && firebase?.firestore?.FieldValue?.serverTimestamp)
            ? firebase.firestore.FieldValue.serverTimestamp()
            : ((window.firebase && window.firebase.firestore && window.firebase.firestore.FieldValue)
                ? window.firebase.firestore.FieldValue.serverTimestamp()
                : nowIso);

        try {
            // 1. Guardar en perfil del usuario
            const profileData = {
                push_notifications_enabled: !!granted,
                push_permission: permStatus,
                push_platform: platform,
                push_updated_at: serverTs,
                last_push_status_update: nowIso
            };
            if (granted) {
                profileData.last_push_enabled_at = nowIso;
            } else {
                profileData.last_push_disabled_at = nowIso;
            }

            await window.db.collection('players').doc(uid).set(profileData, { merge: true });

            // 2. Guardar en subcolección de devices
            const deviceData = {
                deviceId: deviceId,
                platform: platform,
                push_enabled: !!granted,
                push_permission: permStatus,
                userAgent: navigator.userAgent || '',
                updated_at: serverTs,
                last_active: nowIso
            };

            await window.db.collection('players').doc(uid)
                .collection('devices').doc(deviceId)
                .set(deviceData, { merge: true });

            console.log(`📡 [NotificationService] Estado push persistido en Firestore: granted=${granted} [${platform} / ${deviceId}]`);
        } catch (dbErr) {
            console.error("❌ [NotificationService] Error guardando estado push en Firestore:", dbErr);
        }
    }

    /**
     * Envía una notificación nativa real de prueba/bienvenida al dispositivo
     * @param {ServiceWorkerRegistration} [swReg]
     */
    async sendWelcomeNotification(swReg = null) {
        if (!('Notification' in window) || Notification.permission !== 'granted') return;

        try {
            let registration = swReg;
            if (!registration && 'serviceWorker' in navigator) {
                try {
                    registration = await navigator.serviceWorker.ready;
                } catch (swErr) {
                    console.warn("⚠️ [NotificationService] ServiceWorker no listo para bienvenida:", swErr);
                }
            }

            const title = '🎾 ¡Alertas Push Activadas!';
            const options = {
                body: 'Ya tienes activados los avisos en tiempo real para partidos, plazas libres y chat.',
                icon: 'img/logo_somospadel.png',
                badge: 'img/logo_somospadel.png',
                data: { url: './', type: 'welcome' },
                vibrate: [200, 100, 200],
                tag: 'somospadel-welcome',
                renotify: true
            };

            if (registration && typeof registration.showNotification === 'function') {
                await registration.showNotification(title, options);
                console.log("🔔 [NotificationService] Notificación de bienvenida enviada vía Service Worker");
            } else {
                new Notification(title, options);
                console.log("🔔 [NotificationService] Notificación de bienvenida enviada vía Window Notification");
            }
        } catch (err) {
            console.warn("⚠️ [NotificationService] No se pudo lanzar la notificación de bienvenida:", err);
        }
    }

    /**
     * Sincroniza automáticamente el estado de permisos y suscripción al iniciar la app.
     */
    async checkPermissionStatus() {
        if (!('Notification' in window)) return;

        const currentPerm = Notification.permission;
        console.log(`🔔 [NotificationService] checkPermissionStatus: permiso actual = ${currentPerm}`);

        if (currentPerm === 'granted') {
            try {
                localStorage.setItem('somospadel_push_enabled', 'true');
            } catch (_) {}

            await this.savePushSubscriptionStatus(true);

            // Intentar sincronizar token FCM si messaging está activo
            if (window.messaging) {
                try {
                    let swRegistration = undefined;
                    if ('serviceWorker' in navigator) {
                        try {
                            swRegistration = await navigator.serviceWorker.ready;
                        } catch (swErr) {
                            // Fallback silencioso
                        }
                    }

                    const VAPID_KEY = "BCQ_YjYrpwremCwo-xQhtP1x5TDi39LWQ2fuwnBAcyjxN3bJTD8WtXNYsFM7IDxHd3hzEPn2z7JRsLdT0l2L87E";
                    const tokenOptions = {};
                    if (VAPID_KEY && !VAPID_KEY.includes('placeholder')) {
                        tokenOptions.vapidKey = VAPID_KEY;
                    }
                    if (swRegistration) {
                        tokenOptions.serviceWorkerRegistration = swRegistration;
                    }

                    const token = await window.messaging.getToken(tokenOptions);
                    if (token) {
                        this.token = token;
                        await this.saveTokenToProfile(token);
                    }
                } catch (e) {
                    console.warn("⚠️ [NotificationService] Error al sincronizar token existente al inicio:", e);
                }
            }

            window.dispatchEvent(new CustomEvent('sp_push_permission_changed', {
                detail: { granted: true }
            }));
        } else if (currentPerm === 'denied') {
            try {
                localStorage.setItem('somospadel_push_enabled', 'false');
            } catch (_) {}

            await this.savePushSubscriptionStatus(false);

            window.dispatchEvent(new CustomEvent('sp_push_permission_changed', {
                detail: { granted: false, denied: true }
            }));
        } else {
            // 'default' (sin decidir aún)
            try {
                const wasEnabled = localStorage.getItem('somospadel_push_enabled') === 'true';
                if (wasEnabled) {
                    localStorage.setItem('somospadel_push_enabled', 'false');
                }
            } catch (_) {}

            window.dispatchEvent(new CustomEvent('sp_push_permission_changed', {
                detail: { granted: false, denied: false }
            }));
        }
    }

    /**
     * Sincroniza el token del dispositivo (alias explícito)
     */
    async syncDeviceToken(token) {
        return this.saveTokenToProfile(token);
    }

    /**
     * Registra o actualiza el dispositivo en la subcolección players/{userId}/devices/{deviceId}
     * y mantiene fcm_token en el perfil del jugador para compatibilidad.
     */
    async saveTokenToProfile(token, pushSubscription = null) {
        if (!token && !pushSubscription) return;

        const uid = this.currentUserUid || (window.auth && window.auth.currentUser?.uid) || (window.Store ? window.Store.getState('currentUser')?.uid : null);
        if (!uid || !window.db) {
            console.warn("⚠️ [NotificationService] No se puede guardar token: Usuario no autenticado o Firestore no inicializado.");
            return;
        }

        const deviceId = this.getDeviceId();
        const platform = this.getDevicePlatform();
        const nowIso = new Date().toISOString();
        const serverTs = (typeof firebase !== 'undefined' && firebase?.firestore?.FieldValue?.serverTimestamp)
            ? firebase.firestore.FieldValue.serverTimestamp()
            : ((window.firebase && window.firebase.firestore && window.firebase.firestore.FieldValue)
                ? window.firebase.firestore.FieldValue.serverTimestamp()
                : nowIso);

        const subJson = pushSubscription ? (typeof pushSubscription.toJSON === 'function' ? pushSubscription.toJSON() : pushSubscription) : null;
        const finalToken = token || subJson?.endpoint || '';

        try {
            // 1. Registrar en subcolección multi-dispositivo players/{userId}/devices/{deviceId}
            const deviceData = {
                token: finalToken,
                deviceId: deviceId,
                platform: platform,
                push_enabled: true,
                push_permission: 'granted',
                userAgent: navigator.userAgent || '',
                updated_at: serverTs,
                last_active: nowIso
            };
            if (subJson) {
                deviceData.subscription = subJson;
                deviceData.endpoint = subJson.endpoint || '';
            }

            await window.db.collection('players').doc(uid)
                .collection('devices').doc(deviceId).set(deviceData, { merge: true });

            // 2. Actualizar campo de compatibilidad en documento raíz de jugador
            const rootUpdate = {
                fcm_token: finalToken,
                push_notifications_enabled: true,
                push_permission: 'granted',
                last_token_update: nowIso,
                last_platform: platform
            };
            if (subJson) {
                rootUpdate.push_subscription = subJson;
            }

            await window.db.collection('players').doc(uid).set(rootUpdate, { merge: true });

            console.log(`📱 [NotificationService] Dispositivo registrado con éxito [${platform} / ${deviceId}]`);
        } catch (err) {
            console.error("❌ [NotificationService] Error registrando dispositivo en Firestore:", err);
        }
    }

    /**
     * Marca una notificación como leída
     */
    async markAsRead(notificationId) {
        if (!notificationId) return;

        // 1. Registrar siempre en localStorage para persistencia garantizada
        try {
            localStorage.setItem('sp_read_notif_' + notificationId, 'true');
        } catch (_) {}

        if (notificationId === 'system_radar_clima_relocated') {
            try { localStorage.setItem('sp_radar_relocated_notif_read', 'true'); } catch (_) {}
        }

        if (String(notificationId).startsWith('evt_')) {
            try { localStorage.setItem('sp_evt_read_' + notificationId, 'true'); } catch (_) {}
        }

        // Buscar datos en memoria para asociar broadcastId o eventId
        const allItems = [
            ...(this.notifications || []),
            ...(this.eventNotifications || []),
            ...(this.chatNotifications || []),
            ...this._getCancelledEventsLog()
        ];
        const targetItem = allItems.find(n => n && (n.id === notificationId || n.data?.broadcastId === notificationId));
        if (targetItem?.data?.broadcastId) {
            try { localStorage.setItem('sp_read_notif_' + targetItem.data.broadcastId, 'true'); } catch (_) {}
        }

        // Marcar en memoria
        if (targetItem) {
            targetItem.read = true;
        }
        const notifMem = (this.notifications || []).find(n => n && n.id === notificationId);
        if (notifMem) notifMem.read = true;
        const evtMem = (this.eventNotifications || []).find(n => n && n.id === notificationId);
        if (evtMem) evtMem.read = true;
        const chatMem = (this.chatNotifications || []).find(n => n && n.id === notificationId);
        if (chatMem) chatMem.read = true;

        this.clearNativeNotification(notificationId);

        // Recalcular contador y notificar
        this.unreadCount = this.getMergedNotifications().filter(n => !n.read).length;
        this.updateAppBadge();
        this.notifySubscribers();

        // Si es de Firestore, actualizar en background
        const uid = this.currentUserUid || (window.auth && window.auth.currentUser?.uid) || (window.Store && window.Store.getState('currentUser')?.uid);
        if (uid && window.db && !String(notificationId).startsWith('evt_') && !String(notificationId).startsWith('chat_') && notificationId !== 'system_radar_clima_relocated') {
            try {
                await window.db.collection('players').doc(uid)
                    .collection('notifications').doc(notificationId)
                    .update({ read: true });
            } catch (e) {
                console.warn("⚠️ [NotificationService] Error actualizando read en Firestore:", e?.message);
            }
        }
    }

    async deleteNotification(notificationId) {
        console.log("🗑️ [NotificationService] Deleting notification:", notificationId);

        if (!notificationId) return;

        // 1. Lápida de borrado permanente en localStorage SIEMPRE
        try {
            localStorage.setItem('sp_deleted_notif_' + notificationId, 'true');
            localStorage.setItem('sp_read_notif_' + notificationId, 'true');
        } catch (_) {}

        if (notificationId === 'system_radar_clima_relocated') {
            try {
                localStorage.setItem('sp_radar_relocated_notif_read', 'true');
                localStorage.setItem('sp_radar_relocated_notif_deleted', 'true');
            } catch (_) {}
        }

        if (String(notificationId).startsWith('evt_')) {
            try {
                localStorage.setItem('sp_evt_deleted_' + notificationId, 'true');
                localStorage.setItem('sp_evt_read_' + notificationId, 'true');
            } catch (_) {}
        }

        // 2. Extraer metadatos para lápida profunda (broadcastId, eventId, firma de texto)
        const allItems = [
            ...(this.notifications || []),
            ...(this.eventNotifications || []),
            ...(this.chatNotifications || []),
            ...this._getCancelledEventsLog()
        ];
        const targetItem = allItems.find(n => n && (n.id === notificationId || n.data?.broadcastId === notificationId || n.data?.eventId === notificationId));

        if (targetItem) {
            const bId = targetItem.data?.broadcastId || targetItem.broadcastId;
            if (bId) {
                try {
                    localStorage.setItem('sp_deleted_notif_' + bId, 'true');
                    localStorage.setItem('sp_read_notif_' + bId, 'true');
                } catch (_) {}
            }
            const eId = targetItem.data?.eventId || targetItem.eventId;
            if (eId) {
                try {
                    localStorage.setItem('sp_deleted_notif_' + eId, 'true');
                    localStorage.setItem('sp_evt_deleted_' + eId, 'true');
                    localStorage.setItem('sp_read_notif_' + eId, 'true');
                } catch (_) {}
            }
            const t = String(targetItem.title || targetItem.name || '').trim();
            const b = String(targetItem.body || targetItem.text || targetItem.message || '').trim();
            if (t || b) {
                try {
                    localStorage.setItem(`sp_deleted_sig_${t}|${b}`, 'true');
                } catch (_) {}
            }
        }

        // 3. Si está en sp_cancelled_events_log, retirarlo del array
        try {
            const log = this._getCancelledEventsLog();
            const updated = log.filter(item => {
                if (!item) return false;
                if (item.id === notificationId) return false;
                if (targetItem && targetItem.id === item.id) return false;
                const itEvtId = item.data?.eventId || item.eventId;
                if (itEvtId && (itEvtId === notificationId || (targetItem && (targetItem.data?.eventId || targetItem.eventId) === itEvtId))) return false;
                return true;
            });
            localStorage.setItem('sp_cancelled_events_log', JSON.stringify(updated));
        } catch (_) {}

        // 4. Limpieza en memoria inmediata
        this.notifications = (this.notifications || []).filter(n => n && n.id !== notificationId && (!targetItem || n.id !== targetItem.id));
        this.eventNotifications = (this.eventNotifications || []).filter(n => n && n.id !== notificationId && (!targetItem || n.id !== targetItem.id));
        this.chatNotifications = (this.chatNotifications || []).filter(n => n && n.id !== notificationId && (!targetItem || n.id !== targetItem.id));

        // 5. Cerrar notificación nativa
        this.clearNativeNotification(notificationId);

        // 6. Recalcular contador y notificar subscribers INMEDIATAMENTE
        this.unreadCount = this.getMergedNotifications().filter(n => !n.read).length;
        this.updateAppBadge();
        this.notifySubscribers();

        // 7. Borrado en Firestore si aplica (background sin bloquear ni revertir local)
        const uid = this.currentUserUid || (window.auth && window.auth.currentUser?.uid) || (window.Store && window.Store.getState('currentUser')?.uid);
        if (uid && window.db && !String(notificationId).startsWith('evt_') && !String(notificationId).startsWith('chat_') && notificationId !== 'system_radar_clima_relocated') {
            try {
                console.log(`📡 [NotificationService] Deleting from: players/${uid}/notifications/${notificationId}`);
                await window.db.collection('players').doc(uid)
                    .collection('notifications').doc(notificationId)
                    .delete();
                console.log("✅ [NotificationService] Firestore delete success");
            } catch (e) {
                console.warn("⚠️ [NotificationService] Firestore delete failed/offline, local tombstone preserved:", e?.message);
            }
        }
    }

    async deleteAllMyNotifications(skipConfirm = false) {
        const uid = this.currentUserUid || (window.auth && window.auth.currentUser?.uid) || (window.Store && window.Store.getState('currentUser')?.uid);

        if (!skipConfirm && !confirm("¿Seguro que quieres borrar todas tus notificaciones?")) return;

        // 1. Obtener todas las notificaciones actuales y marcar lápida de borrado local permanente
        try {
            const allItems = this.getMergedNotifications();
            allItems.forEach(n => {
                if (!n || !n.id) return;
                try {
                    localStorage.setItem('sp_deleted_notif_' + n.id, 'true');
                    localStorage.setItem('sp_read_notif_' + n.id, 'true');
                    if (String(n.id).startsWith('evt_')) {
                        localStorage.setItem('sp_evt_deleted_' + n.id, 'true');
                        localStorage.setItem('sp_evt_read_' + n.id, 'true');
                    }
                    if (n.data?.broadcastId) {
                        localStorage.setItem('sp_deleted_notif_' + n.data.broadcastId, 'true');
                        localStorage.setItem('sp_read_notif_' + n.data.broadcastId, 'true');
                    }
                    const t = String(n.title || n.name || '').trim();
                    const b = String(n.body || n.text || n.message || '').trim();
                    if (t || b) {
                        localStorage.setItem(`sp_deleted_sig_${t}|${b}`, 'true');
                    }
                } catch (_) {}
            });
        } catch (_) {}

        // 2. Limpiar radar y logs de cancelaciones
        try {
            localStorage.setItem('sp_radar_relocated_notif_read', 'true');
            localStorage.setItem('sp_radar_relocated_notif_deleted', 'true');
            localStorage.removeItem('sp_cancelled_events_log');
        } catch (_) {}

        // 3. Limpieza en memoria inmediata
        this.notifications = [];
        this.eventNotifications = [];
        this.chatNotifications = [];
        this.unreadCount = 0;
        this.clearAllNativeNotifications();
        this.updateAppBadge();
        this.notifySubscribers();

        if (!uid || !window.db) return;

        try {
            const snapshot = await window.db.collection('players').doc(uid).collection('notifications').get();
            if (snapshot.empty) return;

            const batch = window.db.batch();
            snapshot.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();

            console.log("🧹 [NotificationService] User notifications cleared in Firestore");
        } catch (e) {
            console.error("Error clearing notifications:", e);
        }
    }

    async markAllAsRead() {
        try { localStorage.setItem('sp_radar_relocated_notif_read', 'true'); } catch (_) {}

        // 1. Registrar lectura persistente para todos los items
        const allItems = this.getMergedNotifications();
        allItems.forEach(n => {
            if (!n || !n.id) return;
            n.read = true;
            try {
                localStorage.setItem('sp_read_notif_' + n.id, 'true');
                if (String(n.id).startsWith('evt_')) {
                    localStorage.setItem('sp_evt_read_' + n.id, 'true');
                }
                if (n.data?.broadcastId) {
                    localStorage.setItem('sp_read_notif_' + n.data.broadcastId, 'true');
                }
            } catch (_) {}
        });

        if (Array.isArray(this.notifications)) {
            this.notifications.forEach(n => { if (n) n.read = true; });
        }
        if (Array.isArray(this.eventNotifications)) {
            this.eventNotifications.forEach(n => { if (n) n.read = true; });
        }
        if (Array.isArray(this.chatNotifications)) {
            this.chatNotifications.forEach(n => { if (n) n.read = true; });
        }

        this.unreadCount = 0;
        this.clearAllNativeNotifications();
        this.updateAppBadge();
        this.notifySubscribers();

        // 2. En Firestore si existe sesión
        const uid = this.currentUserUid || (window.auth && window.auth.currentUser?.uid) || (window.Store && window.Store.getState('currentUser')?.uid);
        if (uid && window.db) {
            try {
                const unreadFirestore = (this.notifications || []).filter(n => n && !n.read);
                if (unreadFirestore.length > 0) {
                    const batch = window.db.batch();
                    unreadFirestore.forEach(n => {
                        const ref = window.db.collection('players').doc(uid).collection('notifications').doc(n.id);
                        batch.update(ref, { read: true });
                    });
                    await batch.commit();
                }
            } catch (e) {
                console.warn("⚠️ [NotificationService] Error marcando todo leído en Firestore:", e?.message);
            }
        }
    }

    /**
     * Envía una notificación a un usuario (Admin triggered)
     * Soporta: 
     * - Posicional: (uid, title, body, metadata)
     * - Objeto: (uid, { title, body, icon, data, ... })
     */
    async sendNotificationToUser(targetUserId, titleOrConfig, body, metadata = {}) {
        let finalTitle = titleOrConfig;
        let finalBody = body;
        let finalData = metadata;
        let finalIcon = 'bell';

        // Detectar si el segundo argumento es un objeto de configuración
        if (typeof titleOrConfig === 'object' && titleOrConfig !== null) {
            finalTitle = titleOrConfig.title;
            finalBody = titleOrConfig.body;
            finalData = titleOrConfig.data || titleOrConfig.metadata || {};
            finalIcon = titleOrConfig.icon || 'bell';
        }

        try {
            await window.db.collection('players').doc(targetUserId).collection('notifications').add({
                title: finalTitle,
                body: finalBody,
                read: false,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                data: finalData,
                icon: finalIcon
            });

            // Si el usuario destino es el actual, forzamos un toast visual (In-App Feedback)
            const currentUser = window.Store ? window.Store.getState('currentUser') : null;
            if (currentUser && currentUser.uid === targetUserId) {
                this.showInAppToast(finalTitle, finalBody);
            }
        } catch (e) {
            console.error("Error sending notification to user", targetUserId, e);
        }
    }

    /**
     * MÉTODO DE SUPERADMIN: Borra TODAS las notificaciones de la comunidad entera.
     * Útil para limpiar el historial global de ruidos antiguos.
     */
    async clearAllCommunityNotifications() {
        const currentUser = window.auth.currentUser || (window.Store ? window.Store.getState('currentUser') : null);
        if (!currentUser || currentUser.role !== 'admin') {
            throw new Error("Acceso denegado: Se requieren permisos de Super Admin.");
        }

        try {
            console.log("🧹 [NotificationService] Inicianodo limpieza global...");
            const playersSnap = await window.db.collection('players').get();

            const promises = playersSnap.docs.map(async (playerDoc) => {
                const notifsSnap = await playerDoc.ref.collection('notifications').get();
                if (notifsSnap.empty) return;

                const batch = window.db.batch();
                notifsSnap.docs.forEach(nDoc => batch.delete(nDoc.ref));
                return batch.commit();
            });

            await Promise.all(promises);
            console.log("✅ [NotificationService] Comunidad limpia.");

            // Refrescar UI localmente
            this.notifications = [];
            this.unreadCount = 0;
            this.notifySubscribers();

            return true;
        } catch (e) {
            console.error("Error en limpieza global:", e);
            throw e;
        }
    }

    /**
     * Limpia una notificación específica de la bandeja de entrada del Sistema Operativo
     */
    async clearNativeNotification(id) {
        if (!('serviceWorker' in navigator)) return;
        try {
            const reg = await navigator.serviceWorker.ready;
            const notifications = await reg.getNotifications();
            notifications.forEach(n => {
                // Si guardamos el ID en data, podemos compararlo.
                // Si no, al menos intentamos cerrar la que coincida por tag o contenido
                if (n.data && n.data.id === id) {
                    n.close();
                }
            });
        } catch (e) {
            console.warn("⚠️ No se pudo limpiar la notificación nativa:", e);
        }
    }

    /**
     * Limpia todas las notificaciones de esta app de la bandeja del móvil
     */
    async clearAllNativeNotifications() {
        if (!('serviceWorker' in navigator)) return;
        try {
            const reg = await navigator.serviceWorker.ready;
            const notifications = await reg.getNotifications();
            notifications.forEach(n => n.close());
            console.log("🧹 Bandeja de entrada nativa limpia.");
        } catch (e) {
            console.warn("⚠️ Error limpiando bandeja nativa:", e);
        }
    }

    /**
     * Muestra una notificación nativa del navegador si hay permiso.
     * Útil cuando el usuario tiene la app abierta.
     */
    showNativeNotification(title, body, data = {}) {
        if (!('Notification' in window)) return;

        if (Notification.permission === 'granted') {
            const options = {
                body: body,
                icon: 'img/logo_somospadel.png',
                badge: 'img/logo_somospadel.png',
                data: data,
                vibrate: [200, 100, 200],
                tag: data.id || 'somospadel-notification', // TAG único por ID para poder borrarla específicamente
                renotify: true
            };

            // Si el SW está listo, usamos el registro del SW para mostrarla
            if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                navigator.serviceWorker.ready.then(registration => {
                    registration.showNotification(title, options);
                });
            } else {
                // Fallback a notificación estándar
                new Notification(title, options);
            }
        }
    }

    /**
     * Alias for showInAppToast to allow cleaner calls like showToast(msg, type)
     */
    showToast(msg, type = 'info') {
        this.showInAppToast(msg, type);
    }

    /**
     * Muestra un aviso visual dentro de la app con sistema de apilado (Stacking) Premium
     */
    showInAppToast(title, body) {
        // 1. Asegurar contenedor de Toasts
        let container = document.getElementById('toast-stack-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-stack-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = 'premium-toast';

        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas fa-bell"></i>
            </div>
            <div class="toast-content">
                <div class="toast-label">AVISO RECIENTE</div>
                <div class="toast-title">${title}</div>
            </div>
        `;

        container.appendChild(toast);

        // Auto-remove
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(20px) scale(0.95)';
            setTimeout(() => {
                toast.remove();
                if (container.children.length === 0) container.remove();
            }, 300);
        }, 5000);
    }

    /**
     * Elimina una notificación de forma global para TODOS los jugadores del sistema.
     * Solo ejecutable por SuperAdmin.
     * @param {string} targetId
     * @param {object} meta { broadcastId, eventId, title, ... }
     * @returns {Promise<{ success: boolean, deletedFromPlayersCount: number, broadcastDeleted: boolean }>}
     */
    async deleteNotificationGlobally(targetId, meta = {}) {
        if (!targetId && !meta?.broadcastId) {
            throw new Error("Se requiere targetId o meta.broadcastId para eliminar globalmente.");
        }

        // Verificación de rol SuperAdmin
        const currentUser = (window.Store && window.Store.getState('currentUser')) || window.auth?.currentUser || window.AdminAuth?.user || {};
        const role = (currentUser.role || window.AdminAuth?.user?.role || '').toString().toLowerCase().trim();
        const isSuperAdmin = ['super_admin', 'superadmin'].includes(role) ||
            (window.AdminAuth && typeof window.AdminAuth.hasAdminRole === 'function' && window.AdminAuth.hasAdminRole(role));

        if (!isSuperAdmin) {
            throw new Error("Acceso denegado: Se requieren privilegios de SuperAdmin para purgar notificaciones globalmente.");
        }

        if (!window.db) {
            throw new Error("Base de datos Firestore no disponible.");
        }

        const idToPurge = String(targetId || meta.broadcastId).trim();
        let broadcastDeleted = false;

        // 1. Borrar documento en la colección 'broadcasts' de Firestore si existe
        const broadcastIdsToCheck = new Set();
        if (meta?.broadcastId) broadcastIdsToCheck.add(String(meta.broadcastId).trim());
        if (idToPurge) broadcastIdsToCheck.add(idToPurge);

        for (const bId of broadcastIdsToCheck) {
            if (!bId) continue;
            try {
                const bRef = window.db.collection('broadcasts').doc(bId);
                const bSnap = await bRef.get();
                if (bSnap.exists) {
                    await bRef.delete();
                    broadcastDeleted = true;
                    console.log(`📢 [NotificationService] Broadcast '${bId}' eliminado de Firestore.`);
                }
            } catch (bErr) {
                console.warn(`⚠️ [NotificationService] Error borrando broadcast '${bId}':`, bErr);
            }
        }

        // 2. Registrar el ID en system_config/purged_notifications
        const FieldValue = window.firebase?.firestore?.FieldValue;
        const purgedIdsToAdd = [idToPurge];
        if (meta?.broadcastId && String(meta.broadcastId).trim() !== idToPurge) {
            purgedIdsToAdd.push(String(meta.broadcastId).trim());
        }
        if (meta?.eventId && String(meta.eventId).trim() !== idToPurge) {
            purgedIdsToAdd.push(String(meta.eventId).trim());
        }
        if (meta?.title && String(meta.title).trim()) {
            purgedIdsToAdd.push(String(meta.title).trim());
        }

        try {
            const configRef = window.db.collection('system_config').doc('purged_notifications');
            if (FieldValue && typeof FieldValue.arrayUnion === 'function') {
                await configRef.set({
                    purgedIds: FieldValue.arrayUnion(...purgedIdsToAdd),
                    updatedAt: FieldValue.serverTimestamp ? FieldValue.serverTimestamp() : new Date().toISOString()
                }, { merge: true });
            } else {
                const docSnap = await configRef.get();
                const existing = (docSnap.exists && Array.isArray(docSnap.data()?.purgedIds)) ? docSnap.data().purgedIds : [];
                const merged = Array.from(new Set([...existing, ...purgedIdsToAdd]));
                await configRef.set({
                    purgedIds: merged,
                    updatedAt: new Date().toISOString()
                }, { merge: true });
            }
            console.log("🛡️ [NotificationService] IDs registrados en system_config/purged_notifications:", purgedIdsToAdd);
        } catch (cfgErr) {
            console.warn("⚠️ [NotificationService] Error al actualizar purged_notifications en Firestore:", cfgErr);
        }

        // Actualizar instantáneamente en el Set local y notificar UI
        if (this.globalPurgedIds) {
            purgedIdsToAdd.forEach(id => this.globalPurgedIds.add(id));
        }
        this.notifySubscribers();

        // 3. Realizar fan-out de borrado en Firestore por lotes (batch) en las subcolecciones 'notifications' de cada jugador
        let deletedFromPlayersCount = 0;
        const targetBroadcastId = meta?.broadcastId || idToPurge;
        const targetTitle = meta?.title ? String(meta.title).trim() : null;

        try {
            const playersSnap = await window.db.collection('players').get();
            if (!playersSnap.empty) {
                const playerDocs = playersSnap.docs;
                const allRefsToDelete = [];

                const inspectPlayer = async (pDoc) => {
                    const playerNotifsRef = window.db.collection('players').doc(pDoc.id).collection('notifications');
                    const matchedRefs = new Map();

                    // Comprobación A: ID idéntico al targetId
                    try {
                        const directDoc = await playerNotifsRef.doc(idToPurge).get();
                        if (directDoc.exists) {
                            matchedRefs.set(directDoc.ref.path, directDoc.ref);
                        }
                    } catch (_) {}

                    // Comprobación B: data.broadcastId === targetBroadcastId
                    if (targetBroadcastId) {
                        try {
                            const bSnap = await playerNotifsRef.where('data.broadcastId', '==', targetBroadcastId).get();
                            bSnap.forEach(d => matchedRefs.set(d.ref.path, d.ref));
                        } catch (_) {}
                    }

                    // Comprobación C: Título coincidente
                    if (targetTitle) {
                        try {
                            const tSnap = await playerNotifsRef.where('title', '==', targetTitle).get();
                            tSnap.forEach(d => matchedRefs.set(d.ref.path, d.ref));
                        } catch (_) {}
                    }

                    return Array.from(matchedRefs.values());
                };

                // Inspección paralela por bloques
                const chunkSize = 20;
                for (let i = 0; i < playerDocs.length; i += chunkSize) {
                    const chunk = playerDocs.slice(i, i + chunkSize);
                    const chunkResults = await Promise.all(chunk.map(inspectPlayer));
                    chunkResults.forEach(refs => allRefsToDelete.push(...refs));
                }

                // Borrado en batches de Firestore (hasta 450 ops)
                deletedFromPlayersCount = allRefsToDelete.length;
                if (allRefsToDelete.length > 0) {
                    const batches = [];
                    let currentBatch = window.db.batch();
                    let opCount = 0;

                    for (const ref of allRefsToDelete) {
                        currentBatch.delete(ref);
                        opCount++;
                        if (opCount >= 450) {
                            batches.push(currentBatch.commit());
                            currentBatch = window.db.batch();
                            opCount = 0;
                        }
                    }
                    if (opCount > 0) {
                        batches.push(currentBatch.commit());
                    }
                    await Promise.all(batches);
                    console.log(`🧹 [NotificationService] Borrado fan-out completado: ${deletedFromPlayersCount} notificaciones eliminadas de jugadores.`);
                }
            }
        } catch (fanOutErr) {
            console.warn("⚠️ [NotificationService] Error durante fan-out de eliminación en jugadores:", fanOutErr);
        }

        // 4. Retornar resumen del borrado
        return {
            success: true,
            deletedFromPlayersCount,
            broadcastDeleted
        };
    }

    /**
     * Obtiene los comunicados de 'broadcasts', los avisos del sistema y un muestreo consolidado
     * para presentarlas al SuperAdmin en la vista de administración.
     * Devuelve un array ordenado por fecha con campos: id, title, body, type, createdAt, authorName, targetCount.
     * @returns {Promise<Array<object>>}
     */
    async fetchAllGlobalNotifications() {
        if (!window.db) {
            console.warn("⚠️ [NotificationService] window.db no disponible para fetchAllGlobalNotifications.");
            return [];
        }

        const items = [];
        const seenIds = new Set();

        // 1. Obtener comunicados de la colección 'broadcasts'
        try {
            let broadcastQuery;
            try {
                broadcastQuery = await window.db.collection('broadcasts').orderBy('timestamp', 'desc').limit(50).get();
            } catch (_) {
                broadcastQuery = await window.db.collection('broadcasts').limit(50).get();
            }

            broadcastQuery.forEach(doc => {
                const data = doc.data() || {};
                let createdAtStr = new Date().toISOString();
                if (data.createdAt) {
                    createdAtStr = data.createdAt;
                } else if (data.timestamp) {
                    const tsVal = this._getTimestampValue(data.timestamp);
                    if (tsVal > 0) createdAtStr = new Date(tsVal).toISOString();
                }

                const item = {
                    id: doc.id,
                    title: data.title || 'Comunicado General',
                    body: data.body || '',
                    type: data.type || 'broadcast',
                    createdAt: createdAtStr,
                    authorName: data.authorName || 'SuperAdmin',
                    targetCount: data.targetCount || 'Todos',
                    data: data
                };
                seenIds.add(doc.id);
                items.push(item);
            });
        } catch (err) {
            console.warn("⚠️ [NotificationService] Error al obtener broadcasts:", err);
        }

        // 2. Avisos del sistema
        const systemNotifs = [
            {
                id: 'system_radar_clima_relocated',
                title: '🌦️ Radar Táctico y Clima de Pistas',
                body: 'Nuevo mapa de viento/lluvia y telemetría de pistas en El Prat y Cornellà. ¡Disponible en Americanas y Entrenos!',
                type: 'system',
                createdAt: '2026-09-21T09:00:00.000Z',
                authorName: 'Sistema SomosPadel',
                targetCount: 'Todos'
            }
        ];

        for (const sysItem of systemNotifs) {
            if (!seenIds.has(sysItem.id) && (!this.globalPurgedIds || !this.globalPurgedIds.has(sysItem.id))) {
                seenIds.add(sysItem.id);
                items.push(sysItem);
            }
        }

        // 3. Muestreo consolidado de notificaciones de jugadores
        try {
            const samplePlayers = await window.db.collection('players').limit(5).get();
            for (const pDoc of samplePlayers.docs) {
                try {
                    const notifsSnap = await window.db.collection('players').doc(pDoc.id).collection('notifications')
                        .orderBy('timestamp', 'desc').limit(20).get();

                    notifsSnap.forEach(nDoc => {
                        const nData = nDoc.data() || {};
                        const bId = nData.data?.broadcastId;
                        if (bId && seenIds.has(bId)) return;
                        if (seenIds.has(nDoc.id)) return;
                        if (this._isItemGloballyPurged({ id: nDoc.id, data: nData.data, title: nData.title })) return;

                        let createdAtStr = new Date().toISOString();
                        if (nData.timestamp) {
                            const tsVal = this._getTimestampValue(nData.timestamp);
                            if (tsVal > 0) createdAtStr = new Date(tsVal).toISOString();
                        }

                        seenIds.add(nDoc.id);
                        items.push({
                            id: nDoc.id,
                            title: nData.title || 'Aviso General',
                            body: nData.body || '',
                            type: nData.type || (bId ? 'broadcast' : 'general'),
                            createdAt: createdAtStr,
                            authorName: nData.authorName || 'Organización',
                            targetCount: 'Jugadores',
                            data: nData.data || {}
                        });
                    });
                } catch (_) {}
            }
        } catch (sampleErr) {
            console.warn("⚠️ [NotificationService] Error al muestrear notificaciones de jugadores:", sampleErr);
        }

        // 4. Excluir las purgadas globalmente
        const filtered = items.filter(item => !this._isItemGloballyPurged(item));

        // 5. Ordenar por fecha descendente
        filtered.sort((a, b) => {
            const timeA = this._getTimestampValue(a.createdAt);
            const timeB = this._getTimestampValue(b.createdAt);
            return timeB - timeA;
        });

        return filtered;
    }

    /**
     * Delegación estática para eliminar notificaciones globalmente (SuperAdmin)
     */
    static async deleteNotificationGlobally(targetId, meta = {}) {
        if (window.NotificationService && typeof window.NotificationService.deleteNotificationGlobally === 'function') {
            return await window.NotificationService.deleteNotificationGlobally(targetId, meta);
        }
        const instance = new window.NotificationServiceClass();
        return await instance.deleteNotificationGlobally(targetId, meta);
    }

    /**
     * Delegación estática para consultar notificaciones globales (SuperAdmin)
     */
    static async fetchAllGlobalNotifications() {
        if (window.NotificationService && typeof window.NotificationService.fetchAllGlobalNotifications === 'function') {
            return await window.NotificationService.fetchAllGlobalNotifications();
        }
        const instance = new window.NotificationServiceClass();
        return await instance.fetchAllGlobalNotifications();
    }

    /**
     * Delegación estática para registrar la eliminación de un evento
     */
    static handleEventDeleted(type, id, eventData = {}) {
        if (window.NotificationService && typeof window.NotificationService.handleEventDeleted === 'function') {
            window.NotificationService.handleEventDeleted(type, id, eventData);
        }
    }

    /**
     * Delegación estática para registrar la cancelación o suspensión de un evento
     */
    static handleEventCancelled(type, id, eventData = {}, reasonOrStatus = '') {
        if (window.NotificationService && typeof window.NotificationService.handleEventCancelled === 'function') {
            window.NotificationService.handleEventCancelled(type, id, eventData, reasonOrStatus);
        }
    }
}

// No auto-init. Managed by AppInit.
console.log("🔔 NotificationService Module Loaded (Class definition)");
