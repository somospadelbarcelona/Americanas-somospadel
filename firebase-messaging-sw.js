// ============================================================================
// 🎾 SOMOSPADEL - FIREBASE MESSAGING SERVICE WORKER (Background Push)
// ============================================================================

importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js');

// Configuración de Firebase del proyecto SomosPadel
const firebaseConfig = {
    apiKey: "AIzaSyBCy8nN4wKL2Cqvxp_mkmYpsA923N1g5iE",
    authDomain: "americanas-somospadel.firebaseapp.com",
    projectId: "americanas-somospadel",
    storageBucket: "americanas-somospadel.firebasestorage.app",
    messagingSenderId: "638578709472",
    appId: "1:638578709472:web:bf99bbb7688a947b4bd185"
};

firebase.initializeApp(firebaseConfig);

let messaging;
try {
    messaging = firebase.messaging();
} catch (err) {
    console.error('❌ [firebase-messaging-sw] Error al inicializar firebase.messaging():', err);
}

// Handler de mensajes en segundo plano (cuando la aplicación está cerrada o en segundo plano)
if (messaging) {
    messaging.onBackgroundMessage((payload) => {
        console.log('📬 [FCM SW] Mensaje recibido en segundo plano:', payload);

        const notificationTitle = (payload.notification && payload.notification.title) ||
                                  (payload.data && payload.data.title) ||
                                  'SomosPadel BCN 🎾';

        const notificationBody = (payload.notification && payload.notification.body) ||
                                 (payload.data && payload.data.body) ||
                                 'Tienes una nueva actualización en SomosPadel.';

        const notificationData = payload.data || {};
        const notificationIcon = (payload.notification && payload.notification.icon) ||
                                 notificationData.icon ||
                                 './img/logo_somospadel.png';

        const notificationOptions = {
            body: notificationBody,
            icon: notificationIcon,
            badge: './img/logo_somospadel.png',
            tag: notificationData.id || notificationData.tag || ('somospadel-push-' + Date.now()),
            data: notificationData,
            vibrate: [200, 100, 200],
            renotify: true
        };

        return self.registration.showNotification(notificationTitle, notificationOptions);
    });
}

// ============================================================================
// LISTENER: NOTIFICATION CLICK (Abrir app o enfocar pestaña existente)
// ============================================================================
self.addEventListener('notificationclick', (event) => {
    console.log('🔔 [FCM SW] Clic en notificación push:', event.notification);
    event.notification.close();

    const data = event.notification.data || {};
    let targetPath = data.url || data.link || './';

    // Normalizar destino
    let urlToOpen;
    try {
        if (targetPath.startsWith('http://') || targetPath.startsWith('https://')) {
            urlToOpen = targetPath;
        } else if (targetPath.startsWith('/') || targetPath.startsWith('./')) {
            urlToOpen = new URL(targetPath, self.location.origin).href;
        } else {
            // Asumir hash de sección (ej: 'live', 'americanas', 'dashboard')
            urlToOpen = new URL('./#' + targetPath, self.location.origin).href;
        }
    } catch (e) {
        urlToOpen = self.location.origin;
    }

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // 1. Si ya hay una pestaña abierta de SomosPadel, enfocarla y navegar o notificar
                for (const client of clientList) {
                    if (client.url && client.url.includes(self.location.origin) && 'focus' in client) {
                        if ('navigate' in client && urlToOpen) {
                            client.navigate(urlToOpen);
                        }
                        if (client.postMessage) {
                            client.postMessage({
                                type: 'NOTIFICATION_CLICKED',
                                data: data,
                                url: urlToOpen
                            });
                        }
                        return client.focus();
                    }
                }

                // 2. Si no hay pestaña abierta, abrir una nueva ventana con la URL correspondiente
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});
