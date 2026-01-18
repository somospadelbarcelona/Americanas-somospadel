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

const CACHE_NAME = 'somospadel-v5-notifications';
const urlsToCache = [
    './',
    './index.html',
    './admin.html',
    './css/style.css',
    './js/app.js',
    './js/core/SecurityArmor.js',
    './img/logo_somospadel.png'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching app shell');
                return cache.addAll(urlsToCache);
            })
            .catch((error) => {
                console.error('[SW] Error caching:', error);
            })
    );
    self.skipWaiting();
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// Estrategia: Network First, fallback to Cache
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Si la respuesta es válida, clona y guarda en caché
                if (response && response.status === 200) {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return response;
            })
            .catch(() => {
                // Si falla la red, intenta obtener de caché
                return caches.match(event.request).then((response) => {
                    if (response) {
                        return response;
                    }
                    // Si no está en caché, devuelve página offline
                    return caches.match('/index.html');
                });
            })
    );
});
