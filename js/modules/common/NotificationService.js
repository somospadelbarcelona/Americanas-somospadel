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
        
        // El arranque ahora lo gestiona AppInit
        console.log("🔔 NotificationServiceClass defined.");
    }

    init() {
        console.log("🔔 [NotificationService] Initializing...");

        // 1. Iniciar observador de feed de eventos globales (funciona tanto para invitados como autenticados)
        this.initEventsFeedObserver();
        
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
            // Filtrar eventos reales no eliminados por el usuario
            const activeEventNotifs = (this.eventNotifications || []).filter(item => {
                if (!item || !item.id) return false;
                return localStorage.getItem('sp_evt_deleted_' + item.id) !== 'true';
            });

            const combined = [...this.notifications, ...this.chatNotifications, ...activeEventNotifs];

            // Inyectar notificación de sistema del nuevo Radar & Clima (si no ha sido eliminada por el usuario)
            const isRadarDeleted = localStorage.getItem('sp_radar_relocated_notif_deleted') === 'true';
            if (!isRadarDeleted) {
                const isRadarRead = localStorage.getItem('sp_radar_relocated_notif_read') === 'true';
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

                // Firma única para deduplicación: si tiene id tipo evt_ o chat_ usamos el ID
                const signature = rawItem.id ? `id_${rawItem.id}` : `${title}|${body}`.toLowerCase().trim();
                if (seen.has(signature)) continue;
                seen.add(signature);

                deduplicated.push({
                    ...rawItem,
                    title: title || 'Aviso SomosPadel',
                    body: body || 'Nueva actualización disponible en tu cuenta.'
                });
            }

            return deduplicated.slice(0, 50);
        } catch (e) {
            console.error("❌ [NotificationService] Merging failed:", e);
            return (this.notifications || []).slice(0, 20);
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
                        snapshot.docChanges().forEach(change => {
                            const data = change.doc.data();
                            const evt = { id: change.doc.id, ...data };

                            if (change.type === 'removed') {
                                this._eventsMap.delete(evt.id);
                                hasChanges = true;
                            } else {
                                this._eventsMap.set(evt.id, { event: evt, type });
                                hasChanges = true;
                            }
                        });

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
     * Procesa los eventos detectados en el feed y genera notificaciones de nuevos eventos y plazas libres.
     */
    _processEventsFeed() {
        const generated = [];

        this._eventsMap.forEach(({ event: evt, type }) => {
            if (!evt || !evt.id) return;

            const realTimestamp = this._extractEventTimestamp(evt);
            const timeMs = this._getTimestampValue(realTimestamp);
            const now = Date.now();
            const isRecentCreation = !isNaN(timeMs) && (now - timeMs) >= 0 && (now - timeMs) <= (72 * 60 * 60 * 1000);

            const status = String(evt.status || '').toLowerCase().trim();
            const isFinished = ['finished', 'finalizado', 'completed', 'cancelled'].includes(status);
            const isActive = !isFinished;

            // 1. Si el evento es reciente (creado en las últimas 72 horas o activo actualmente)
            if (isRecentCreation || isActive) {
                const newId = `evt_new_${type}_${evt.id}`;
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

            // 2. Si el evento tiene plazas libres y está abierto
            const maxPlayers = Number(evt.max_players || evt.maxPlayers || (evt.courts ? evt.courts * 4 : 16));
            const registeredCount = Array.isArray(evt.players)
                ? evt.players.length
                : (Array.isArray(evt.registeredPlayers) ? evt.registeredPlayers.length : 0);
            const openSpots = maxPlayers - registeredCount;
            const isOpen = (status === 'open' || !isFinished);

            if (openSpots > 0 && isOpen) {
                const spotId = `evt_spot_${type}_${evt.id}`;
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
                this.unreadCount = items.filter(n => !n.read).length;

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
                            const data = change.doc.data();

                            // Only show visual toasts for NEW arrivals after initial load
                            // to prevent clumping on startup
                            if (!data.read && !isFirstLoad) {
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

            // 4. Tareas en segundo plano (Firestore y FCM) sin bloquear la respuesta al usuario
            (async () => {
                try {
                    // Persistir en Firestore en perfil del usuario y subcolección devices
                    await this.savePushSubscriptionStatus(true);

                    // Intentar registrar FCM token si messaging está soportado
                    if (window.messaging) {
                        let swReg = null;
                        if ('serviceWorker' in navigator) {
                            try { swReg = await navigator.serviceWorker.ready; } catch (_) {}
                        }
                        const VAPID_KEY = "BD-Ue7u-m6m999_placeholder_pon_tu_clave_aqui";
                        const tokenOptions = {};
                        if (VAPID_KEY && !VAPID_KEY.includes('placeholder')) {
                            tokenOptions.vapidKey = VAPID_KEY;
                        }
                        if (swReg) {
                            tokenOptions.serviceWorkerRegistration = swReg;
                        }
                        const currentToken = await window.messaging.getToken(tokenOptions);
                        if (currentToken) {
                            this.token = currentToken;
                            console.log("🔑 FCM Token Registrado en segundo plano:", currentToken);
                            await this.saveTokenToProfile(currentToken);
                        }
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

                    const VAPID_KEY = "BD-Ue7u-m6m999_placeholder_pon_tu_clave_aqui";
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
    async saveTokenToProfile(token) {
        if (!token) return;

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

        try {
            // 1. Registrar en subcolección multi-dispositivo players/{userId}/devices/{deviceId}
            await window.db.collection('players').doc(uid)
                .collection('devices').doc(deviceId).set({
                    token: token,
                    deviceId: deviceId,
                    platform: platform,
                    push_enabled: true,
                    push_permission: 'granted',
                    userAgent: navigator.userAgent || '',
                    updated_at: serverTs,
                    last_active: nowIso
                }, { merge: true });

            // 2. Actualizar campo de compatibilidad en documento raíz de jugador
            await window.db.collection('players').doc(uid).set({
                fcm_token: token,
                push_notifications_enabled: true,
                push_permission: 'granted',
                last_token_update: nowIso,
                last_platform: platform
            }, { merge: true });

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

        if (notificationId === 'system_radar_clima_relocated') {
            try { localStorage.setItem('sp_radar_relocated_notif_read', 'true'); } catch (_) {}
            this.notifySubscribers();
            return;
        }

        // Soporte para marcar eventos reales como leídos
        if (notificationId.startsWith('evt_')) {
            try { localStorage.setItem('sp_evt_read_' + notificationId, 'true'); } catch (_) {}
            const notif = (this.eventNotifications || []).find(n => n.id === notificationId);
            if (notif) notif.read = true;
            this.clearNativeNotification(notificationId);
            this.notifySubscribers();
            return;
        }

        const user = window.auth.currentUser;
        if (!user) return;

        await window.db.collection('players').doc(user.uid)
            .collection('notifications').doc(notificationId)
            .update({ read: true });

        // Intentar cerrar la notificación nativa en la bandeja de entrada
        this.clearNativeNotification(notificationId);

        // Optimistic UI update
        const notif = this.notifications.find(n => n.id === notificationId);
        if (notif && !notif.read) {
            notif.read = true;
            this.unreadCount = Math.max(0, this.unreadCount - 1);
            this.notifySubscribers();
        }
    }

    async deleteNotification(notificationId) {
        console.log("🗑️ [NotificationService] Deleting notification:", notificationId);

        if (!notificationId) return;

        if (notificationId === 'system_radar_clima_relocated') {
            try {
                localStorage.setItem('sp_radar_relocated_notif_read', 'true');
                localStorage.setItem('sp_radar_relocated_notif_deleted', 'true');
            } catch (_) {}
            this.notifySubscribers();
            return;
        }

        // Soporte para borrar notificaciones de eventos reales
        if (notificationId.startsWith('evt_')) {
            try {
                localStorage.setItem('sp_evt_deleted_' + notificationId, 'true');
                localStorage.setItem('sp_evt_read_' + notificationId, 'true');
            } catch (_) {}
            this.eventNotifications = (this.eventNotifications || []).filter(n => n.id !== notificationId);
            this.clearNativeNotification(notificationId);
            this.notifySubscribers();
            return;
        }

        // Soporte para borrar chats (solo local)
        if (notificationId.startsWith('chat_')) {
            this.chatNotifications = this.chatNotifications.filter(n => n.id !== notificationId);
            this.notifySubscribers();
            return;
        }

        const uid = this.currentUserUid || (window.auth && window.auth.currentUser?.uid) || (window.Store && window.Store.getState('currentUser')?.uid);
        if (!uid || !window.db) {
            console.error("❌ [NotificationService] Cannot delete: No user UID found");
            return;
        }

        try {
            console.log(`📡 [NotificationService] Deleting from: players/${uid}/notifications/${notificationId}`);
            await window.db.collection('players').doc(uid)
                .collection('notifications').doc(notificationId)
                .delete();
            console.log("✅ [NotificationService] Firestore delete success");

            // Intentar cerrar la notificación nativa
            this.clearNativeNotification(notificationId);

            // Optimistic update
            this.notifications = this.notifications.filter(n => n.id !== notificationId);
            this.unreadCount = this.notifications.filter(n => !n.read).length;
            this.notifySubscribers();
        } catch (e) {
            console.error("Error deleting notification:", e);
        }
    }

    async deleteAllMyNotifications(skipConfirm = false) {
        const uid = this.currentUserUid || (window.auth && window.auth.currentUser?.uid) || (window.Store && window.Store.getState('currentUser')?.uid);

        if (!skipConfirm && !confirm("¿Seguro que quieres borrar todas tus notificaciones?")) return;

        // Limpieza de eventos reales (localStorage y en memoria)
        if (Array.isArray(this.eventNotifications)) {
            this.eventNotifications.forEach(n => {
                try {
                    localStorage.setItem('sp_evt_deleted_' + n.id, 'true');
                    localStorage.setItem('sp_evt_read_' + n.id, 'true');
                } catch (_) {}
            });
            this.eventNotifications = [];
        }

        try {
            localStorage.setItem('sp_radar_relocated_notif_read', 'true');
            localStorage.setItem('sp_radar_relocated_notif_deleted', 'true');
        } catch (_) {}

        if (!uid || !window.db) {
            this.notifications = [];
            this.unreadCount = 0;
            this.clearAllNativeNotifications();
            this.notifySubscribers();
            return;
        }

        try {
            const snapshot = await window.db.collection('players').doc(uid).collection('notifications').get();
            if (snapshot.empty) return;

            const batch = window.db.batch();
            snapshot.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();

            console.log("🧹 [NotificationService] User notifications cleared");

            // Local cleanup
            this.notifications = [];
            this.unreadCount = 0;
            this.clearAllNativeNotifications();
            this.notifySubscribers();
        } catch (e) {
            console.error("Error clearing notifications:", e);
        }
    }

    async markAllAsRead() {
        try { localStorage.setItem('sp_radar_relocated_notif_read', 'true'); } catch (_) {}

        // Marcar todos los eventNotifications como leídos en localStorage y memoria
        if (Array.isArray(this.eventNotifications)) {
            this.eventNotifications.forEach(n => {
                n.read = true;
                try { localStorage.setItem('sp_evt_read_' + n.id, 'true'); } catch (_) {}
            });
        }

        const user = window.auth ? window.auth.currentUser : null;
        if (!user || !window.db) {
            this.clearAllNativeNotifications();
            this.notifySubscribers();
            return;
        }

        const batch = window.db.batch();
        const unread = this.notifications.filter(n => !n.read);

        unread.forEach(n => {
            const ref = window.db.collection('players').doc(user.uid).collection('notifications').doc(n.id);
            batch.update(ref, { read: true });
        });

        await batch.commit();

        // Limpiar TODA la bandeja de entrada nativa
        this.clearAllNativeNotifications();
        this.notifySubscribers();
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
}

// No auto-init. Managed by AppInit.
console.log("🔔 NotificationService Module Loaded (Class definition)");
