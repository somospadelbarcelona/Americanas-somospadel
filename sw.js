// 🛡️ Service Worker - Protocolo de Autodestrucción y Recarga Forzada
// Este Service Worker se desregistra a sí mismo, limpia toda la caché y fuerza la recarga de todas las pestañas abiertas.

self.addEventListener('install', function(e) {
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    self.clients.claim()
      .then(function() {
        return self.clients.matchAll({ type: 'window' });
      })
      .then(function(clients) {
        return Promise.all(
          clients.map(function(client) {
            console.log('🚨 [SW AUTO-UPDATE] Force reloading client:', client.url);
            return client.navigate(client.url).catch(function(err) {
              console.warn('Failed to navigate client:', err);
            });
          })
        );
      })
      .then(function() {
        return self.registration.unregister();
      })
      .then(function() {
        return caches.keys().then(function(names) {
          return Promise.all(
            names.map(function(name) {
              console.log('🚨 [SW AUTO-UPDATE] Deleting Cache:', name);
              return caches.delete(name);
            })
          );
        });
      })
  );
});

self.addEventListener('fetch', function(event) {
  // No hacer nada, dejar que el navegador realice la petición directamente a la red
});
