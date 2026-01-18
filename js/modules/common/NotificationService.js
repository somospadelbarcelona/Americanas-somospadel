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
        this.token = null;
        this.init();
    }

    init() {
        // Escuchar autenticación para iniciar listener
        window.auth.onAuthStateChanged(user => {
            if (user) {
                this.subscribeToFirestore(user.uid);
                // Intentar recuperar token silenciosamente si ya se dio permiso
                this.checkPermissionStatus();
            } else {
                this.unsubscribeFirestore();
            }
        });
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
            items: this.notifications
        };
        this.callbacks.forEach(cb => cb(data));
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
                this.notifySubscribers();
            }, error => {
                console.error("🔔 [NotificationService] Listener Error:", error);
            });
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
     * Esto escribe en su DB (triggering Internal) y opcionalmente
     * el backend (o cloud function) enviaría el Push.
     * Como no tenemos backend activo 24/7, confiaremos en:
     * 1. In-App inmediato si está abierto.
     * 2. Si implementamos el trigger en cliente admin, enviamos fetch a FCM API (requiere key server side... riesgo).
     * 
     * ESTRATEGIA CLIENT-SIDE ONLY (GRATIS & SEGURA):
     * Solo escribimos en DB. El Service Worker NO detecta DB changes.
     * Para Push real sin backend, el cliente Admin debe llamar a FCM API directamente (con riesgo de exponer Key de Servidor o usando Legacy Server Key restringida).
     * 
     * Por ahora: Implementación SOLIDA de In-App. 
     * Para Push: Solo funcionará si añadimos un Cloud Function basico (Gratis en Spark con limites) o 
     * si el cliente Admin hace la llamada POST a fcm.googleapis.com (Riesgoso poner key aqui).
     * 
     * DECISION: Implementar escritura en DB para In-App.
     */
    async sendNotificationToUser(targetUserId, title, body, metadata = {}) {
        await window.db.collection('players').doc(targetUserId).collection('notifications').add({
            title,
            body,
            read: false,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            data: metadata,
            icon: 'bell'
        });
    }
}

// Inicializar y exportar
window.NotificationService = new NotificationService();
