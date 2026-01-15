// Service Worker para PWA - Somospadel BCN
const CACHE_NAME = 'somospadel-v4-wow-upgrade';
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
