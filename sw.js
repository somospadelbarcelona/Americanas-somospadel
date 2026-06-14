// 🛡️ Service Worker - Protocolo de Autodestrucción
// Este Service Worker se desregistra a sí mismo y limpia toda la caché del navegador para forzar una actualización limpia.

self.addEventListener('install', function(e) {
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  self.registration.unregister()
    .then(function() {
      return self.clients.claim();
    })
    .then(function() {
      // Limpiar todas las cachés
      caches.keys().then(function(names) {
        for (let name of names) {
          caches.delete(name);
        }
      });
    });
});

self.addEventListener('fetch', function(event) {
  // No hacer nada, dejar que el navegador realice la petición directamente a la red
});
