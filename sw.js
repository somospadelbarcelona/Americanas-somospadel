// ============================================================================
// 🎾 SOMOSPADEL PWA SERVICE WORKER
// Versión: somospadel-pwa-v2.0.2
// Estrategias:
//  - Documentos de navegación: Network First con fallback a caché offline
//  - Recursos estáticos pesados (fuentes, imágenes, CSS, JS): Stale-While-Revalidate / Cache First
//  - Firestore y APIs externas: Excluidas de caché (conexión directa)
// ============================================================================

const CACHE_NAME = 'somospadel-pwa-v2.0.2';

// Recursos críticos para el funcionamiento offline básico (App Shell)
const PRECACHE_ASSETS = [
    './',
    './index.html',
    './admin.html',
    './manifest.json',
    './css/theme-playtomic.css',
    './css/notifications.css',
    './css/nav-mobile.css',
    './css/glassmorphism.css',
    './css/dashboard-premium.css',
    './css/mobile-header-fix.css',
    './img/logo_somospadel.png',
    './img/ball.png',
    './img/ball-masculina.png',
    './img/ball-femenina.png',
    './img/ball-mixta.png',
    './audio/speaker/entreno_bcn_prat.mp3',
    './audio/speaker/entreno_general.mp3',
    './audio/speaker/torneo_intro.mp3',
    './audio/speaker/speaker_call.mp3'
];

// Dominios excluidos del Service Worker (APIs dinámicas y Firebase)
const EXCLUDED_HOSTS = [
    'firestore.googleapis.com',
    'identitytoolkit.googleapis.com',
    'securetoken.googleapis.com',
    'firebaseinstallations.googleapis.com',
    'firebaseio.com',
    'apis.google.com',
    'www.googleapis.com',
    'api.openai.com'
];

// ============================================================================
// CICLO DE VIDA: INSTALACIÓN
// ============================================================================
self.addEventListener('install', (event) => {
    console.log(`🎾 [SW] Instalando Service Worker (${CACHE_NAME})...`);
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(async (cache) => {
                console.log('🎾 [SW] Precargando App Shell crítico...');
                // Precache resiliente: si algún recurso individual falla, no aborta la instalación
                await Promise.allSettled(
                    PRECACHE_ASSETS.map((asset) =>
                        cache.add(asset).catch((err) => {
                            console.warn(`[SW] Aviso: No se pudo precargar recurso ${asset}:`, err);
                        })
                    )
                );
            })
            .then(() => {
                console.log('🎾 [SW] App Shell precargado con éxito. Activando de inmediato...');
                return self.skipWaiting();
            })
    );
});

// ============================================================================
// CICLO DE VIDA: ACTIVACIÓN Y PURGA DE CACHÉS OBSOLETAS
// ============================================================================
self.addEventListener('activate', (event) => {
    console.log(`🎾 [SW] Activando Service Worker (${CACHE_NAME})...`);
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((name) => {
                        if (name !== CACHE_NAME) {
                            console.log(`🧹 [SW] Purgando caché obsoleta: ${name}`);
                            return caches.delete(name);
                        }
                    })
                );
            })
            .then(() => {
                console.log('🎾 [SW] Reclamando control de todos los clientes activos.');
                return self.clients.claim();
            })
    );
});

// ============================================================================
// MENSAJERÍA (Para soportar actualizaciones suaves bajo demanda)
// ============================================================================
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log('🎾 [SW] Mensaje SKIP_WAITING recibido.');
        self.skipWaiting();
    }
});

// ============================================================================
// ESTRATEGIAS DE FETCH
// ============================================================================
self.addEventListener('fetch', (event) => {
    const request = event.request;

    // 1. Excluir peticiones no GET (POST, PUT, DELETE...)
    if (request.method !== 'GET') {
        return;
    }

    let url;
    try {
        url = new URL(request.url);
    } catch (e) {
        return;
    }

    // 2. Excluir esquemas no HTTP/HTTPS (chrome-extension, file, etc.)
    if (!url.protocol.startsWith('http')) {
        return;
    }

    // 3. Excluir APIs de Firebase / Firestore y rutas de backend dinámicas
    if (EXCLUDED_HOSTS.some((host) => url.hostname.includes(host))) {
        return;
    }

    if (url.pathname.startsWith('/api/') || url.pathname.includes('/api/')) {
        return;
    }

    // 4. Estrategia NETWORK FIRST: Documentos de navegación HTML
    // Garantiza que el usuario reciba siempre la versión más fresca si hay red,
    // pero si está en la pista con mala cobertura, sirve la copia en caché.
    const isNavigation = request.mode === 'navigate' ||
        (request.headers.get('Accept') && request.headers.get('Accept').includes('text/html')) ||
        url.pathname.endsWith('.html') ||
        url.pathname === '/' ||
        url.pathname.endsWith('/');

    if (isNavigation) {
        event.respondWith(handleNetworkFirstNavigation(request));
        return;
    }

    // 5. Estrategia CACHE FIRST: Fuentes externas pesadas (Google Fonts, FontAwesome)
    const isFont = request.destination === 'font' ||
        url.hostname.includes('fonts.gstatic.com') ||
        url.hostname.includes('fonts.googleapis.com') ||
        url.hostname.includes('cdnjs.cloudflare.com') ||
        /\.(woff|woff2|ttf|otf|eot)(\?.*)?$/i.test(url.pathname);

    if (isFont) {
        event.respondWith(handleCacheFirst(request));
        return;
    }

    // 6. Estrategia STALE-WHILE-REVALIDATE: Imágenes, CSS, JS locales
    const isStaticAsset = request.destination === 'image' ||
        request.destination === 'style' ||
        request.destination === 'script' ||
        url.pathname.includes('/img/') ||
        url.pathname.includes('/css/') ||
        url.pathname.includes('/js/') ||
        /\.(png|jpg|jpeg|svg|webp|gif|ico|css|js)(\?.*)?$/i.test(url.pathname);

    if (isStaticAsset) {
        event.respondWith(handleStaleWhileRevalidate(request));
        return;
    }

    // Para cualquier otro recurso estático GET, intentar Stale-While-Revalidate
    event.respondWith(handleStaleWhileRevalidate(request));
});

// ============================================================================
// IMPLEMENTACIÓN DE ESTRATEGIAS
// ============================================================================

/**
 * Estrategia Network First para documentos de navegación
 */
async function handleNetworkFirstNavigation(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (networkError) {
        console.warn('🎾 [SW] Sin conexión a internet. Buscando documento en caché offline:', request.url);
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        // Fallback secundario a la raíz o index.html en caso de que la URL varíe
        const fallbackResponse = await caches.match('./index.html') ||
                                 await caches.match('index.html') ||
                                 await caches.match('./') ||
                                 await caches.match('/');
        if (fallbackResponse) {
            return fallbackResponse;
        }

        throw networkError;
    }
}

/**
 * Estrategia Cache First (ideal para fuentes y recursos inmutables)
 */
async function handleCacheFirst(request) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }

    try {
        const networkResponse = await fetch(request);
        if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.warn('🎾 [SW] Fallo al obtener recurso font/cache-first offline:', request.url);
        return new Response('', { status: 408, statusText: 'Offline' });
    }
}

/**
 * Estrategia Stale-While-Revalidate (ideal para CSS, JS e imágenes)
 * Responde instantáneamente desde la caché si existe, mientras actualiza la caché
 * en segundo plano para la próxima visita.
 */
async function handleStaleWhileRevalidate(request) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);

    const networkFetchPromise = fetch(request)
        .then((networkResponse) => {
            if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
                cache.put(request, networkResponse.clone());
            }
            return networkResponse;
        })
        .catch((err) => {
            // Error de red silencioso en segundo plano
            return null;
        });

    if (cachedResponse) {
        return cachedResponse;
    }

    const freshResponse = await networkFetchPromise;
    if (freshResponse) {
        return freshResponse;
    }

    return new Response('', { status: 503, statusText: 'Service Unavailable Offline' });
}

