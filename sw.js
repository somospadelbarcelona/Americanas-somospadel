// Service Worker para PWA - Somospadel BCN
importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js');

// Inicializar Firebase en el SW (usando la misma config que en la app, pero hardcodeada aquí o importada)
// Nota: Para simplificar, hardcodeamos la config básica requerida para messaging.
// La misma que en firebase-config.js
try {
    firebase.initializeApp({
        apiKey: "AIzaSyBCy8nN4wKL2Cqvxp_mkmYpsA923N1g5iE",
        projectId: "americ-7473a",
        messagingSenderId: "103953800507",
        appId: "1:103953800507:web:c6722fb485123512270966"
    });

    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
        console.log('[SW] Received background message ', payload);

        const notificationTitle = payload.notification.title;
        const notificationOptions = {
            body: payload.notification.body,
            icon: '/img/logo_somospadel.png',
            badge: '/img/logo_somospadel.png',
            data: payload.data
        };

        self.registration.showNotification(notificationTitle, notificationOptions);
    });
} catch (e) { console.error("[SW] Firebase init error", e); }

const CACHE_NAME = 'somospadel-pro-v6';
const STATIC_RESOURCES = [
    './',
    './index.html',
    './manifest.json',
    './css/theme-playtomic.css?v=701',
    './js/app.js?v=2026',
    './img/logo_somospadel.png',
    'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800;900&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css'
];

// Install: Cache Shell
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_RESOURCES))
    );
    self.skipWaiting();
});

// Activate: Cleanup
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.map(key => { if (key !== CACHE_NAME) return caches.delete(key); })
        ))
    );
    return self.clients.claim();
});

// Fetch Strategy: Stale-While-Revalidate for Static, Network-First for others
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Skip Firebase calls and cross-origin analytics
    if (url.origin.includes('firestore.googleapis.com') || url.origin.includes('firebasestorage')) {
        return;
    }

    // Static Assets: Stale-While-Revalidate
    if (STATIC_RESOURCES.some(res => event.request.url.includes(res)) || event.request.destination === 'image') {
        event.respondWith(
            caches.match(event.request).then(cachedResponse => {
                const fetchPromise = fetch(event.request).then(networkResponse => {
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse.clone()));
                    return networkResponse;
                });
                return cachedResponse || fetchPromise;
            })
        );
        return;
    }

    // Others (Data): Network First
    event.respondWith(
        fetch(event.request)
            .catch(() => caches.match(event.request))
            .then(res => res || caches.match('./index.html'))
    );
});
