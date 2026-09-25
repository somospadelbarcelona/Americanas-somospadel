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
    messagingSenderId: "486590022834",
    appId: "1:486590022834:web:069bc96e1e11c0edb75ab"
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

// Listener push nativo (W3C Web Push fallback para mensajes directos con app apagada)
self.addEventListener('push', (event) => {
    console.log('📬 [FCM SW] Evento push nativo recibido.');
    if (!event.data) return;

    let payload = {};
    try {
        payload = event.data.json();
    } catch (_) {
        try {
            payload = { notification: { body: event.data.text() } };
        } catch (e) {
            payload = {};
        }
    }

    const notification = payload.notification || {};
    const data = payload.data || {};

    const title = notification.title || data.title || 'SomosPadel BCN 🎾';
    const body = notification.body || data.body || 'Tienes una nueva actualización en SomosPadel.';
    const icon = notification.icon || data.icon || './img/logo_somospadel.png';
    const tag = data.id || data.tag || ('somospadel-push-' + Date.now());

    const options = {
        body: body,
        icon: icon,
        badge: './img/logo_somospadel.png',
        data: data,
        tag: tag,
        vibrate: [200, 100, 200],
        renotify: true
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

// ============================================================================
// LISTENER: NOTIFICATION CLICK (Abrir app o enfocar pestaña existente)
// ============================================================================
self.addEventListener('notificationclick', (event) => {
    console.log('🔔 [FCM SW] Clic en notificación push:', event.notification);
    event.notification.close();

    const data = event.notification.data || {};
    let targetPath = data.url || data.link || './';
    const articleId = data.articleId || data.article;

    // Si viene articleId en data y la URL no contiene parámetro de artículo, adjuntarlo
    if (articleId && !targetPath.includes('article=') && !targetPath.includes('post=')) {
        if (targetPath === './' || targetPath === '/' || !targetPath) {
            targetPath = `dashboard?article=${encodeURIComponent(articleId)}`;
        } else {
            const separator = targetPath.includes('?') ? '&' : '?';
            targetPath = `${targetPath}${separator}article=${encodeURIComponent(articleId)}`;
        }
    }

    // Normalizar destino relativo al scope del Service Worker (evita 404 en GitHub Pages)
    let urlToOpen;
    try {
        const baseScope = (self.registration && self.registration.scope) 
            ? self.registration.scope 
            : (self.location.origin + self.location.pathname.replace(/\/[^/]*$/, '/'));

        if (targetPath.startsWith('http://') || targetPath.startsWith('https://')) {
            urlToOpen = targetPath;
        } else if (targetPath.startsWith('#')) {
            urlToOpen = new URL(targetPath, baseScope).href;
        } else if (targetPath.startsWith('./') || targetPath.startsWith('?')) {
            urlToOpen = new URL(targetPath, baseScope).href;
        } else if (targetPath.startsWith('/')) {
            urlToOpen = new URL('.' + targetPath, baseScope).href;
        } else {
            // Convierte 'dashboard?article=...' o 'journal?article=...' a ruta hash (#dashboard?article=...)
            urlToOpen = new URL('#' + targetPath.replace(/^#/, ''), baseScope).href;
        }
    } catch (e) {
        urlToOpen = (self.registration && self.registration.scope) ? self.registration.scope : self.location.href;
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
                                url: urlToOpen,
                                articleId: articleId || (targetPath.match(/[?&#](?:article|articleId|post)=([^&#]+)/) || [])[1]
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
