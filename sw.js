// 🛡️ ANTI-GRAVITY SERVICE WORKER v7.0 [AUTONOMOUS UPGRADE]
// Optimizado para carga instantánea y gestión de notificaciones persistentes.

importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js');

const CACHE_NAME = 'somospadel-ultra-cache-v827';

// Recursos críticos para el "App Shell"
const CORE_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './css/theme-playtomic.css?v=801',
    './img/logo_somospadel.png',
    './js/app.js?v=3004',
    './js/core/AuthService.js?v=12.2',
    './js/modules/admin/AICopilot_v4.js?v=4.1',
    './js/modules/dashboard/PadelPulse.js?v=6.2'
];

// Initialize Firebase Messaging
try {
    firebase.initializeApp({
        apiKey: "AIzaSyBCy8nN4wKL2Cqvxp_mkmYpsA923N1g5iE",
        authDomain: "americanas-somospadel.firebaseapp.com",
        projectId: "americanas-somospadel",
        storageBucket: "americanas-somospadel.firebasestorage.app",
        messagingSenderId: "638578709472",
        appId: "1:638578709472:web:bf99bbb7688a947b4bd185"
    });

    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
        const { title, body } = payload.notification;
        const options = {
            body,
            icon: '/img/logo_somospadel.png',
            badge: '/img/logo_somospadel.png',
            vibrate: [100, 50, 100],
            data: payload.data,
            tag: payload.data?.tag || 'general-match-alert',
            renotify: true
        };
        return self.registration.showNotification(title, options);
    });
} catch (e) { console.error("[SW] Messaging init failed", e); }

// INSTALL: Pre-cache core assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS))
    );
    self.skipWaiting();
});

// ACTIVATE: Cleanup old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.map(key => {
                if (key !== CACHE_NAME) return caches.delete(key);
            })
        ))
    );
    return self.clients.claim();
});

// Limitador de caché para no saturar la RAM de dispositivos gama media/baja (Fase 4)
async function trimCache(cacheName, maxItems) {
    try {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        if (keys.length > maxItems) {
            // Borramos los más antiguos (las primeras posiciones)
            for (let i = 0; i < keys.length - maxItems; i++) {
                await cache.delete(keys[i]);
            }
            console.log(`🧹 [SW Cache Cleanup] Trimmed cache to ${maxItems} items.`);
        }
    } catch (e) {
        console.error("Cache trim failed:", e);
    }
}

// FETCH: Advanced Strategy (Cache-First for Modules, Network-First for Data)
self.addEventListener('fetch', (event) => {
    // Solo cachear peticiones GET
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);

    // 1. Estrategia Network-First para peticiones de navegación y páginas HTML
    const isNavigate = event.request.mode === 'navigate';
    const isHtml = url.pathname.endsWith('.html') || url.pathname === '/' || url.pathname.endsWith('/');

    if (isNavigate || isHtml) {
        event.respondWith(
            fetch(event.request).then(networkResponse => {
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // Fallback a la caché si falla la red (offline)
                return caches.match(event.request).then(cachedResponse => {
                    if (cachedResponse) return cachedResponse;
                    return caches.match('./index.html');
                });
            })
        );
        return;
    }

    // Ignorar APIs externas, Firebase y Analytics
    if (url.origin.includes('firestore.googleapis.com') ||
        url.origin.includes('firebasestorage') ||
        url.origin.includes('google-analytics') ||
        url.origin.includes('google') ||
        url.pathname.includes('/api/')) {
        return;
    }

    // Estrategia para Módulos JS e Imágenes (Cache First con Update en segundo plano)
    const isModule = url.pathname.includes('/js/modules/') || url.pathname.endsWith('.js');
    const isImage = event.request.destination === 'image';

    if (isModule || isImage) {
        event.respondWith(
            caches.match(event.request).then(response => {
                const fetchPromise = fetch(event.request).then(networkResponse => {
                    // Solo cachear si la respuesta es válida
                    if (networkResponse && networkResponse.status === 200) {
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, networkResponse.clone());
                            trimCache(CACHE_NAME, 60); // Limitar a 60 recursos
                        });
                    }
                    return networkResponse;
                }).catch(() => null);

                // Devolver del cache si existe, si no, esperar al fetch
                return response || fetchPromise;
            })
        );
        return;
    }

    // Estrategia para Documentos y otros (Stale-While-Revalidate Real y Eficiente)
    event.respondWith(
        caches.match(event.request).then(cached => {
            const fetchPromise = fetch(event.request).then(networkResponse => {
                if (networkResponse && networkResponse.status === 200) {
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, networkResponse.clone());
                        trimCache(CACHE_NAME, 60); // Limitar a 60 recursos
                    });
                }
                return networkResponse;
            }).catch(() => null);

            // Retornar de inmediato el caché si existe (Carga instantánea)
            if (cached) return cached;

            // Soporte offline para rutas de navegación (SPA)
            if (event.request.mode === 'navigate') {
                return caches.match('./index.html') || fetchPromise;
            }

            return fetchPromise;
        })
    );
});

// GESTIÓN DE NOTIFICACIONES
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            for (let client of windowClients) {
                if (client.url.includes(urlToOpen) && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) return clients.openWindow(urlToOpen);
        })
    );
});
