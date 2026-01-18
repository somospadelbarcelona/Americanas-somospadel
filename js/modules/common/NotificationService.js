/**
 * NotificationService.js
 * 
 * Gestiona el sistema de notificaciones híbrido (Push + In-App).
 * - Escucha cambios en Firestore (notifications/{userId}/items)
 * - Gestiona permisos y tokens de FCM
 * - Provee métodos para enviar notificaciones (que el admin usa)
 */
class NotificationService {
    constructor() {
        this.unsubscribe = null;
        this.notifications = [];
        this.unreadCount = 0;
        this.callbacks = []; // Suscriptores UI (Dashboard, etc)
        this.chatNotifications = []; // Notificaciones de chat temporales (en memoria)
        this.chatUnsubscribes = new Map(); // Usar Map para trackear por EventID
        this.serviceStartTime = Date.now();
        this.token = null;
        this.init();
    }

    init() {
        // 1. Escuchar autenticación real de Firebase
        window.auth.onAuthStateChanged(user => {
            if (user) {
                console.log("🔔 [NotificationService] Firebase Auth session detected");
                this.subscribeToFirestore(user.uid);
                this.checkPermissionStatus();
            } else {
                // Si no hay sesión Firebase, comprobamos si hay sesión Local en el Store
                const localUser = window.Store ? window.Store.getState('currentUser') : null;
                if (localUser && localUser.uid) {
                    console.log("🔔 [NotificationService] Local session detected:", localUser.name);
                    this.subscribeToFirestore(localUser.uid);
                } else {
                    this.unsubscribeFirestore();
                }
            }
        });

        // 2. Escuchar cambios en el Store por si la sesión local se inicia después
        if (window.Store) {
            window.Store.subscribe('currentUser', (user) => {
                if (user && user.uid && !this.unsubscribe) {
                    console.log("🔔 [NotificationService] Session started/changed in Store");
                    this.subscribeToFirestore(user.uid);
                    this.initChatObserver(); // Iniciar observación de chats
                } else if (!user) {
                    this.unsubscribeFirestore();
                    this.stopChatObserver();
                }
            });
        }
    }

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
        const combined = [...this.notifications, ...this.chatNotifications];
        return combined.sort((a, b) => {
            const timeA = this._getTimestampValue(a.timestamp);
            const timeB = this._getTimestampValue(b.timestamp);
            return timeB - timeA;
        }).slice(0, 50);
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
                if (snapshot.docChanges().length > 0) {
                    snapshot.docChanges().forEach(change => {
                        if (change.type === 'added') {
                            const data = change.doc.data();
                            if (!data.read) {
                                console.log("📣 NEW NOTIFICATION RECEIVED:", data.title, data.body);
                                this.showNativeNotification(data.title, data.body, data.data);

                                // Opcional: Feedback visual discreto si no hay permisos push
                                if (Notification.permission !== 'granted') {
                                    this.showInAppToast(data.title, data.body);
                                }
                            }
                        }
                    });
                }

                this.notifySubscribers();
            }, error => {
                console.error("🔔 [NotificationService] Listener Error:", error);
            });
    }

    /**
     * Observa los chats de eventos activos para mostrar mensajes en tiempo real
     */
    async initChatObserver() {
        // NOTA: No limpiamos agresivamente para no interrumpir listeners activos
        // Solo añadiremos los eventos que no tengan listener

        try {
            if (!window.AmericanaService) return;
            const events = await window.AmericanaService.getAllActiveEvents();
            if (!events || events.length === 0) return;

            // Filtrar solo eventos nuevos para no duplicar listeners
            const newEvents = events.filter(evt => !this.chatUnsubscribes.has(evt.id));
            if (newEvents.length === 0) return;

            console.log(`💬 [NotificationService] Adding ${newEvents.length} new chat observers`);

            newEvents.forEach(evt => {
                const unsub = window.db.collection('chats').doc(evt.id).collection('messages')
                    .orderBy('timestamp', 'desc')
                    .limit(5)
                    .onSnapshot(snap => {
                        let hasNew = false;
                        snap.docChanges().forEach(change => {
                            if (change.type === 'added') {
                                const msg = change.doc.data();
                                const msgTime = msg.timestamp ? (msg.timestamp.toMillis ? msg.timestamp.toMillis() : msg.timestamp) : Date.now();

                                // Solo procesar si es un mensaje enviado tras arrancar el servicio (margen 10s)
                                if (msgTime > this.serviceStartTime - 10000) {
                                    // Evitar duplicados
                                    if (!this.chatNotifications.find(n => n.id === change.doc.id)) {
                                        console.log("💬 [Chat Observer] New message detected:", msg.text);
                                        this.chatNotifications.push({
                                            id: change.doc.id,
                                            title: `💬 ${msg.senderName || 'Chat'}:`,
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
                            // Limitar cache local de chats
                            if (this.chatNotifications.length > 20) {
                                this.chatNotifications = this.chatNotifications.slice(-20);
                            }
                            this.notifySubscribers();
                        }
                    });
                this.chatUnsubscribes.set(evt.id, unsub);
            });
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
            console.warn("📴 Messaging not supported or blocked");
            return false;
        }

        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                if (permission === 'granted') {
                    console.log("✅ Notification permission granted.");

                    // Intentamos obtener el token usando la configuración por defecto de Firebase
                    // Esto funciona si el firebaseConfig tiene el senderId correcto
                    try {
                        const currentToken = await window.messaging.getToken();
                        if (currentToken) {
                            this.token = currentToken;
                            console.log("🔑 FCM Token:", currentToken);
                            await this.saveTokenToProfile(currentToken);
                            return true;
                        } else {
                            console.log('No Instance ID token available. Request permission to generate one.');
                        }
                    } catch (tokenError) {
                        console.warn("FCM Token Error (probablemente falta VAPID key publica si es web push standard):", tokenError);
                        // Si falla, no bloqueamos la app, solo no hay push.
                    }
                    console.log('No Instance ID token available. Request permission to generate one.');
                }
            } else {
                console.log("🚫 Permission denied");
            }
        } catch (e) {
            console.error("🚨 Error getting permission/token", e);
        }
        return false;
    }

    async checkPermissionStatus() {
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

        // Optimistic UI update
        const notif = this.notifications.find(n => n.id === notificationId);
        if (notif && !notif.read) {
            notif.read = true;
            this.unreadCount = Math.max(0, this.unreadCount - 1);
            this.notifySubscribers();
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
     * Muestra una notificación nativa del navegador si hay permiso.
     * Útil cuando el usuario tiene la app abierta.
     */
    showNativeNotification(title, body, data = {}) {
        if (Notification.permission === 'granted') {
            const options = {
                body: body,
                icon: 'img/logo_somospadel.png',
                badge: 'img/logo_somospadel.png',
                data: data,
                vibrate: [200, 100, 200],
                tag: 'somospadel-notification'
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
     * Muestra un aviso visual dentro de la app (útil si el navegador bloquea push en local)
     */
    showInAppToast(title, body) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%);
            background: #CCFF00; color: black; padding: 15px 25px; border-radius: 40px;
            font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 0.9rem;
            box-shadow: 0 10px 25px rgba(0,0,0,0.3); z-index: 999999;
            display: flex; align-items: center; gap: 15px; border: 2px solid black;
            animation: slideUp 0.5s ease-out;
        `;
        toast.innerHTML = `<i class="fas fa-bell"></i> <div><div style="font-size:0.7rem; opacity:0.7;">NOTIFICACIÓN</div>${title}</div>`;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.5s';
            setTimeout(() => toast.remove(), 500);
        }, 5000);
    }
}

// Inicializar y exportar
window.NotificationService = new NotificationService();
