// 🛡️ ANTI-GRAVITY SERVICE WORKER v5.0 (PREMIUM PERFORMANCE)
// Optimizado para carga instantánea y gestión de notificaciones persistentes.

importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js');

const CACHE_NAME = 'somospadel-ultra-cache-v3';

// Recursos críticos para el "App Shell"
const CORE_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './css/theme-playtomic.css?v=800',
    './img/logo_somospadel.png',
    './js/app.js?v=3000',
    './js/core/AuthService.js?v=12.1'
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

// FETCH: Advanced Strategy (Cache-First for Modules, Network-First for Data)
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Ignorar APIs externas y Firebase
    if (url.origin.includes('firestore.googleapis.com') ||
        url.origin.includes('firebasestorage') ||
        url.origin.includes('google-analytics')) {
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
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse.clone()));
                    }
                    return networkResponse;
                }).catch(() => null);

                // Devolver del cache si existe, si no, esperar al fetch
                return response || fetchPromise;
            })
        );
        return;
    }

    // Estrategia para Documentos y otros (Stale-While-Revalidate)
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request).then(cached => {
                if (cached) return cached;
                // Si falla todo, devolver el index.html (SPA routing support)
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            });
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
