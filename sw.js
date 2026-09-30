// ============================================================================
// 🎾 SOMOSPADEL PWA SERVICE WORKER
// Versión: somospadel-pwa-v2.0.9
// Estrategias:
//  - Documentos de navegación: Network First con fallback a caché offline
//  - Recursos estáticos pesados (fuentes, imágenes, CSS, JS): Stale-While-Revalidate / Cache First
//  - Firestore y APIs externas: Excluidas de caché (conexión directa)
// ============================================================================

const CACHE_NAME = 'somospadel-pwa-v2.0.9';

// Recursos críticos para el funcionamiento offline básico (App Shell)
const PRECACHE_ASSETS = [
    './',
    './index.html',
    './admin.html',
    './manifest.json',
    './js/fixed-pairs-logic.js',
    './js/rotating-pozo-logic.js',
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
        event.respondWith(handleNetworkFirstNavigation(request, event));
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
 * Helper para obtener documento de navegación desde caché local con fallbacks ordenados
 */
async function getCachedNavigationFallback(request) {
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
    return null;
}

/**
 * Estrategia Network First para documentos de navegación con Timeout Rápido
 * Timeout de 1600ms (rango 1500ms - 1800ms): si la red en pista o móvil es lenta,
 * la app abre instantáneamente desde la caché local en menos de 200ms en lugar de quedarse
 * congelada durante 15-30 segundos esperando a la red.
 * Si la red responde después, actualiza la caché silenciosamente en segundo plano.
 */
async function handleNetworkFirstNavigation(request, event) {
    const FAST_TIMEOUT_MS = 1600;

    // Promesa de fetch a la red que continúa en segundo plano para actualizar caché silenciosamente
    const networkFetchPromise = fetch(request)
        .then(async (networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
                try {
                    const cache = await caches.open(CACHE_NAME);
                    await cache.put(request, networkResponse.clone());
                    console.log('🎾 [SW] Caché de navegación actualizada en segundo plano:', request.url);
                } catch (cacheErr) {
                    console.warn('🎾 [SW] Aviso al guardar navegación en caché:', cacheErr);
                }
            }
            return networkResponse;
        })
        .catch((networkError) => {
            console.warn('🎾 [SW] Fallo de red en navegación:', networkError);
            return null;
        });

    // Mantener con vida el Service Worker en segundo plano para completar el guardado en caché si la red responde tarde
    if (event && typeof event.waitUntil === 'function') {
        event.waitUntil(networkFetchPromise);
    }

    // Timeout rápido para fallback inmediato a la caché
    const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => resolve(null), FAST_TIMEOUT_MS);
    });

    try {
        // Carrera entre la red rápida y el timeout de seguridad
        const quickResponse = await Promise.race([networkFetchPromise, timeoutPromise]);

        if (quickResponse && quickResponse.status === 200) {
            return quickResponse;
        }

        // Si la red excedió el timeout (1600ms) o falló de inmediato por falta de conexión
        console.warn(`🎾 [SW] Red lenta o inaccesible (>${FAST_TIMEOUT_MS}ms). Sirviendo App Shell desde caché local:`, request.url);
        const cachedResponse = await getCachedNavigationFallback(request);

        if (cachedResponse) {
            // Nota: networkFetchPromise continúa en background para actualizar la caché cuando la red responda
            return cachedResponse;
        }

        // Si no había copia previa en caché (ej. primera visita sin precaché previa), esperar a la red como último recurso
        console.warn('🎾 [SW] Sin copia previa en caché. Esperando respuesta de red restante...');
        const networkResponse = await networkFetchPromise;
        if (networkResponse) {
            return networkResponse;
        }

        throw new Error('Sin conexión a red y sin documento en caché disponible.');
    } catch (error) {
        console.warn('🎾 [SW] Sin conexión a internet o error en navegación. Buscando documento en caché offline:', request.url);
        const cachedResponse = await getCachedNavigationFallback(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        throw error;
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

}

// ============================================================================
// PUSH NOTIFICATIONS & INTERACCIÓN (Dual FCM + Web Push Nativo)
// ============================================================================

let isFcmMessagingInitialized = false;
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

// Soporte oficial Firebase Cloud Messaging en segundo plano (app cerrada en Android/iOS PWA)
try {
    importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js');
    importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js');

    if (typeof firebase !== 'undefined' && firebase.initializeApp) {
        if (!firebase.apps || !firebase.apps.length) {
            firebase.initializeApp({
                apiKey: "AIzaSyBCy8nN4wKL2Cqvxp_mkmYpsA923N1g5iE",
                authDomain: "americanas-somospadel.firebaseapp.com",
                projectId: "americanas-somospadel",
                storageBucket: "americanas-somospadel.firebasestorage.app",
                messagingSenderId: "486590022834",
                appId: "1:486590022834:web:069bc96e1e11c0edb75ab"
            });
        }
        const swMessaging = firebase.messaging();
        isFcmMessagingInitialized = true;
        swMessaging.onBackgroundMessage((payload) => {
            console.log('📬 [FCM SW] Push recibido con app en segundo plano/cerrada:', payload);
            const data = payload.data || {};
            const dedupeId = payload.messageId || data.notificationId || data.id || data.tag || (payload.notification?.title + ':' + payload.notification?.body);
            if (markAndCheckPush(dedupeId)) {
                console.log('🛡️ [FCM SW] Push ya mostrado, omitiendo duplicado:', dedupeId);
                return;
            }

            const title = (payload.notification && payload.notification.title) ||
                          (payload.data && payload.data.title) ||
                          'SomosPadel BCN 🎾';
            const body = (payload.notification && payload.notification.body) ||
                         (payload.data && payload.data.body) ||
                         'Tienes una nueva actualización en SomosPadel.';
            const icon = (payload.notification && payload.notification.icon) || data.icon || './img/logo_somospadel.png';
            const tag = data.notificationId || data.id || data.tag || 'somospadel-fcm';

            return self.registration.showNotification(title, {
                body,
                icon,
                badge: './img/logo_somospadel.png',
                tag,
                data,
                vibrate: [200, 100, 200],
                renotify: true
            });
        });
        console.log('🎾 [SW] Firebase Messaging integrado con éxito en Service Worker principal.');
    }
} catch (swFcmErr) {
    console.warn('ℹ️ [SW] Firebase Messaging SDK no cargado en SW, operando mediante Push API estándar:', swFcmErr);
}

self.addEventListener('push', (event) => {
    console.log('📬 [SW Principal] Evento PUSH nativo recibido.');

    let payload = {};
    if (event.data) {
        try {
            payload = event.data.json();
        } catch (e) {
            try {
                payload = { notification: { body: event.data.text() } };
            } catch (err) {
                payload = {};
            }
        }
    }

    const data = payload.data || {};
    const isFcmPayload = Boolean(payload.from || payload['google.c.sender.id'] || payload.fcmMessageId || payload.fcmOptions);
    const dedupeId = payload.fcmMessageId || payload.messageId || data.notificationId || data.id || data.tag || (payload.notification?.title + ':' + payload.notification?.body);

    if (markAndCheckPush(dedupeId)) {
        console.log('🛡️ [SW Principal] Push ya procesado por FCM/SW, omitiendo duplicado:', dedupeId);
        return;
    }

    // Si FCM SDK está activo y procesando el mensaje FCM, evitar doble notificación
    if (isFcmMessagingInitialized && isFcmPayload) {
        console.log('ℹ️ [SW Principal] Mensaje gestionado por FCM onBackgroundMessage.');
        return;
    }

    const notification = payload.notification || {};
    const title = notification.title || data.title || 'SomosPadel BCN 🎾';
    const body = notification.body || data.body || 'Tienes una nueva notificación.';
    const icon = notification.icon || data.icon || './img/logo_somospadel.png';
    const tag = data.notificationId || data.id || data.tag || 'somospadel-notif';

    // ============================================================================
    // PERSISTENCIA IN-APP DE PUSH ENTRANTES EN INDEXEDDB Y POSTMESSAGE A CLIENTES
    // ============================================================================
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

    const saveAndNotify = async () => {
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
            saveAndNotify()
        ])
    );
});

self.addEventListener('notificationclick', (event) => {
    console.log('🔔 [SW Principal] Clic en notificación push:', event.notification);
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
                // 1. Si ya existe una pestaña abierta con el mismo origen, enfocarla
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

                // 2. Si no hay pestaña abierta, abrir nueva ventana
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});
