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

const processedPushCache = new Set();
function markAndCheckPush(id) {
    if (!id) return false;
    if (processedPushCache.has(id)) return true;
    processedPushCache.add(id);
    if (processedPushCache.size > 100) {
        const first = processedPushCache.values().next().value;
        processedPushCache.delete(first);
    }
    return false;
}

// Handler de mensajes en segundo plano (cuando la aplicación está cerrada o en segundo plano)
if (messaging) {
    messaging.onBackgroundMessage((payload) => {
        console.log('📬 [FCM SW] Mensaje recibido en segundo plano:', payload);

        const notificationData = payload.data || {};
        const dedupeId = payload.messageId || notificationData.notificationId || notificationData.id || notificationData.tag || (payload.notification?.title + ':' + payload.notification?.body);
        if (markAndCheckPush(dedupeId)) {
            console.log('🛡️ [FCM SW] Mensaje ya mostrado, omitiendo duplicado:', dedupeId);
            return;
        }

        const notificationTitle = (payload.notification && payload.notification.title) ||
                                  notificationData.title ||
                                  'SomosPadel BCN 🎾';

        const notificationBody = (payload.notification && payload.notification.body) ||
                                 notificationData.body ||
                                 'Tienes una nueva actualización en SomosPadel.';

        const notificationIcon = (payload.notification && payload.notification.icon) ||
                                 notificationData.icon ||
                                 './img/logo_somospadel.png';

        const notificationOptions = {
            body: notificationBody,
            icon: notificationIcon,
            badge: './img/badge_somospadel.png',
            tag: notificationData.notificationId || notificationData.id || notificationData.tag || 'somospadel-push',
            data: notificationData,
            vibrate: [200, 100, 200],
            renotify: true
        };

        if (typeof self.navigator !== 'undefined' && 'setAppBadge' in self.navigator) {
            try {
                const badgeCount = parseInt(notificationData.unreadCount || notificationData.count || 1, 10);
                self.navigator.setAppBadge(badgeCount).catch(() => {});
            } catch (_) {}
        }

        const inboxItem = {
            id: notificationData.notificationId || notificationData.id || ('push_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6)),
            title: notificationTitle,
            body: notificationBody,
            icon: notificationIcon,
            timestamp: notificationData.timestamp || new Date().toISOString(),
            type: notificationData.type || (notificationData.broadcastId ? 'broadcast' : 'push'),
            category: notificationData.category || (notificationData.broadcastId || notificationData.type === 'broadcast' ? 'broadcast' : (notificationData.type === 'entreno' ? 'entrenos' : 'matches')),
            read: false,
            data: notificationData
        };

        const saveAndNotifyClients = async () => {
            try {
                if (typeof indexedDB !== 'undefined') {
                    await new Promise((resolve) => {
                        const req = indexedDB.open('somospadel_inbox_db', 1);
                        req.onupgradeneeded = (e) => {
                            const db = e.target.result;
                            if (!db.objectStoreNames.contains('inbound_pushes')) {
                                db.createObjectStore('inbound_pushes', { keyPath: 'id' });
                            }
                        };
                        req.onsuccess = (e) => {
                            try {
                                const db = e.target.result;
                                const tx = db.transaction('inbound_pushes', 'readwrite');
                                tx.objectStore('inbound_pushes').put(inboxItem);
                                tx.oncomplete = () => { db.close(); resolve(); };
                                tx.onerror = () => { db.close(); resolve(); };
                            } catch (_) { resolve(); }
                        };
                        req.onerror = () => resolve();
                    });
                }
            } catch (_) {}

            try {
                const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
                clientList.forEach((client) => {
                    if (client.postMessage) {
                        client.postMessage({
                            type: 'SP_INBOUND_NOTIFICATION',
                            item: inboxItem
                        });
                    }
                });
            } catch (_) {}
        };

        saveAndNotifyClients();
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

    const data = payload.data || {};
    const isFcmPayload = Boolean(payload.from || payload['google.c.sender.id'] || payload.fcmMessageId || payload.fcmOptions);
    const dedupeId = payload.fcmMessageId || payload.messageId || data.notificationId || data.id || data.tag || (payload.notification?.title + ':' + payload.notification?.body);

    if (markAndCheckPush(dedupeId)) {
        console.log('🛡️ [FCM SW Native] Mensaje ya procesado por onBackgroundMessage, omitiendo duplicado:', dedupeId);
        return;
    }

    if (messaging && isFcmPayload) {
        console.log('ℹ️ [FCM SW Native] Delegando notificación a FCM onBackgroundMessage.');
        return;
    }

    const notification = payload.notification || {};
    const title = notification.title || data.title || 'SomosPadel BCN 🎾';
    const body = notification.body || data.body || 'Tienes una nueva actualización en SomosPadel.';
    const icon = notification.icon || data.icon || './img/logo_somospadel.png';
    const tag = data.notificationId || data.id || data.tag || 'somospadel-push';

    const options = {
        body: body,
        icon: icon,
        badge: './img/badge_somospadel.png',
        data: data,
        tag: tag,
        vibrate: [200, 100, 200],
        renotify: true
    };

    if (typeof self.navigator !== 'undefined' && 'setAppBadge' in self.navigator) {
        try {
            const badgeCount = parseInt(data.unreadCount || data.count || 1, 10);
            self.navigator.setAppBadge(badgeCount).catch(() => {});
        } catch (_) {}
    }

    const inboxItem = {
        id: data.notificationId || data.id || ('push_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6)),
        title: title,
        body: body,
        icon: icon,
        timestamp: data.timestamp || new Date().toISOString(),
        type: data.type || (data.broadcastId ? 'broadcast' : 'push'),
        category: data.category || (data.broadcastId || data.type === 'broadcast' ? 'broadcast' : (data.type === 'entreno' ? 'entrenos' : 'matches')),
        read: false,
        data: data
    };

    const saveAndNotifyClients = async () => {
        try {
            if (typeof indexedDB !== 'undefined') {
                await new Promise((resolve) => {
                    const req = indexedDB.open('somospadel_inbox_db', 1);
                    req.onupgradeneeded = (e) => {
                        const db = e.target.result;
                        if (!db.objectStoreNames.contains('inbound_pushes')) {
                            db.createObjectStore('inbound_pushes', { keyPath: 'id' });
                        }
                    };
                    req.onsuccess = (e) => {
                        try {
                            const db = e.target.result;
                            const tx = db.transaction('inbound_pushes', 'readwrite');
                            tx.objectStore('inbound_pushes').put(inboxItem);
                            tx.oncomplete = () => { db.close(); resolve(); };
                            tx.onerror = () => { db.close(); resolve(); };
                        } catch (_) { resolve(); }
                    };
                    req.onerror = () => resolve();
                });
            }
        } catch (_) {}

        try {
            const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
            clientList.forEach((client) => {
                if (client.postMessage) {
                    client.postMessage({
                        type: 'SP_INBOUND_NOTIFICATION',
                        item: inboxItem
                    });
                }
            });
        } catch (_) {}
    };

    event.waitUntil(
        Promise.all([
            self.registration.showNotification(title, options),
            saveAndNotifyClients()
        ])
    );
});

// ============================================================================
// LISTENER: NOTIFICATION CLICK (Abrir app o enfocar pestaña existente)
// ============================================================================
self.addEventListener('notificationclick', (event) => {
    console.log('🔔 [FCM SW] Clic en notificación push:', event.notification);
    event.notification.close();

    if (typeof self.navigator !== 'undefined' && 'clearAppBadge' in self.navigator) {
        try { self.navigator.clearAppBadge().catch(() => {}); } catch (_) {}
    }

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
