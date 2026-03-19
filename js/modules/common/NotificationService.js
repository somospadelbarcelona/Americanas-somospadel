/**
 * NotificationService.js
 * 
 * Gestiona el sistema de notificaciones híbrido (Push + In-App).
 */
window.NotificationServiceClass = class NotificationService {
    constructor() {
        this.unsubscribe = null;
        this.notifications = [];
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
        
        // 1. Verificar si window.auth existe
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

        // 2. Escuchar cambios en el Store
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
        const data = {
            count: this.unreadCount,
            items: this.getMergedNotifications()
        };
        this.callbacks.forEach(cb => cb(data));
    }

    /**
     * Fusiona las notificaciones de Firestore con los mensajes de chat recientes
     */
    getMergedNotifications() {
        try {
            const combined = [...this.notifications, ...this.chatNotifications];

            // Ordenar por tiempo (descendente)
            const sorted = combined.sort((a, b) => {
                const timeA = this._getTimestampValue(a.timestamp);
                const timeB = this._getTimestampValue(b.timestamp);
                return timeB - timeA;
            });

            // Deduplicar por contenido (Título + Cuerpo) para evitar spam en la ticketera
            const seen = new Set();
            const deduplicated = sorted.filter(item => {
                if (!item) return false;
                const title = String(item.title || '');
                const body = String(item.body || '');
                const signature = `${title}|${body}`.toLowerCase().trim();
                if (seen.has(signature)) return false;
                seen.add(signature);
                return true;
            });

            return deduplicated.slice(0, 50);
        } catch (e) {
            console.error("❌ [NotificationService] Merging failed:", e);
            return this.notifications.slice(0, 20);
        }
    }

    _getTimestampValue(ts) {
        if (!ts) return Date.now(); // Fallback a 'ahora' para evitar que mensajes nuevos se vayan al final
        if (ts.toMillis) return ts.toMillis();
        if (ts instanceof Date) return ts.getTime();
        if (typeof ts === 'string') return new Date(ts).getTime();
        if (typeof ts === 'number') return ts;
        return Date.now();
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

                // NEW: Iniciar observación de chats al cargar notificaciones
                this.initChatObserver();

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

            // Forzar actualización inicial por si ya había mensajes
            this.notifySubscribers();
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
     * Solicita permiso para Push Notifications
     */
    async requestPushPermission() {
        if (!window.messaging) {
            console.warn("📴 Messaging not supported/blocked. Revisa si usas HTTPS y un navegador moderno.");
            return false;
        }

        // DETECCIÓN ESPECÍFICA PARA IPHONE (iOS)
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

        if (isIOS && !isStandalone) {
            window.PremiumModal.alert({
                title: "📲 INSTALAR EN IPHONE",
                message: "Para recibir avisos en tu iPhone, añade esta App a tu pantalla de inicio:<br><br>1. Pulsa el botón <strong>'Compartir'</strong> (cuadrado con flecha)<br>2. Selecciona <strong>'Añadir a pantalla de inicio'</strong>",
                type: 'info'
            });
            return false;
        }

        try {
            console.log("🔔 Solicitando permiso de notificaciones...");

            if (!('Notification' in window)) {
                console.warn("⚠️ API de Notificaciones no soportada en este entorno.");
                return false;
            }

            const permission = await Notification.requestPermission();

            if (permission === 'granted') {
                console.log("✅ Permiso concedido. Obteniendo Token FCM...");

                // VAPID KEY REAL para el proyecto americanas-somospadel
                const VAPID_KEY = "BD-Ue7u-m6m999_placeholder_pon_tu_clave_aqui";
                // Nota: El usuario debería reemplazar este placeholder con su clave pública FCM Cloud Messaging

                try {
                    const currentToken = await window.messaging.getToken({
                        vapidKey: VAPID_KEY.includes('placeholder') ? undefined : VAPID_KEY
                    });

                    if (currentToken) {
                        this.token = currentToken;
                        console.log("🔑 FCM Token Generado:", currentToken);
                        await this.saveTokenToProfile(currentToken);
                        return true;
                    } else {
                        console.warn("⚠️ No se pudo generar el token (Token vacío).");
                    }
                } catch (tokenError) {
                    console.error("🚨 Error grave obteniendo Token FCM. Posible VAPID incorrecto o Service Worker no registrado:", tokenError);
                }
            } else {
                console.log("🚫 Permiso denegado por el usuario.");
                window.PremiumModal.alert({
                    title: "AVISO BLOCK",
                    message: "Has denegado las notificaciones. No podrás recibir avisos de nuevos partidos en tiempo real.",
                    type: 'warning'
                });
            }
        } catch (e) {
            console.error("🚨 Error en el flujo de permisos:", e);
        }
        return false;
    }

    async checkPermissionStatus() {
        if (!('Notification' in window)) return;

        if (Notification.permission === 'granted' && window.messaging) {
            const token = await window.messaging.getToken();
            if (token) this.saveTokenToProfile(token);
        }
    }

    async saveTokenToProfile(token) {
        const user = window.auth.currentUser;
        if (!user) return;

        await window.db.collection('players').doc(user.uid).set({
            fcm_token: token,
            last_token_update: new Date().toISOString()
        }, { merge: true });
    }

    /**
     * Marca una notificación como leída
     */
    async markAsRead(notificationId) {
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

        // Soporte para borrar chats (solo local)
        if (notificationId.startsWith('chat_')) {
            this.chatNotifications = this.chatNotifications.filter(n => n.id !== notificationId);
            this.notifySubscribers();
            return;
        }

        const uid = this.currentUserUid || window.auth.currentUser?.uid || window.Store?.getState('currentUser')?.uid;
        if (!uid) {
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
        const uid = this.currentUserUid || window.auth.currentUser?.uid || window.Store?.getState('currentUser')?.uid;
        if (!uid) return;

        if (!skipConfirm && !confirm("¿Seguro que quieres borrar todas tus notificaciones?")) return;

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
        const user = window.auth.currentUser;
        if (!user) return;

        const batch = window.db.batch();
        const unread = this.notifications.filter(n => !n.read);

        unread.forEach(n => {
            const ref = window.db.collection('players').doc(user.uid).collection('notifications').doc(n.id);
            batch.update(ref, { read: true });
        });

        await batch.commit();

        // Limpiar TODA la bandeja de entrada nativa
        this.clearAllNativeNotifications();
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
