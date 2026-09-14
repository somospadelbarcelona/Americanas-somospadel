/**
 * UpdateManager.js
 * Gestiona las actualizaciones automáticas de la PWA y el Service Worker.
 * Detecta cuando hay una nueva versión disponible y solicita al usuario actualizar.
 */
(function () {
    class UpdateManager {
        constructor() {
            this.init();
        }

        init() {
            if (!('serviceWorker' in navigator) || window.location.protocol === 'file:') return;

            // LIMPIEZA FORZADA: Eliminar cachés antiguos que apuntan a rutas incorrectas
            this.cleanupOldCaches();

            // Escuchar cambios de controlador (cuando el nuevo SW toma el control)
            let refreshing = false;
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (refreshing) return;
                refreshing = true;
                console.log("🔄 UpdateManager: New version active. Reloading...");
                window.location.reload();
            });

            // Verificar estado al cargar
            navigator.serviceWorker.ready.then(registration => {
                // Chequear si ya hay uno esperando
                if (registration.waiting) {
                    this.promptUpdate(registration);
                }

                // Escuchar nuevas instalaciones
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    console.log("📥 UpdateManager: New version found, installing...");

                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // Nueva versión instalada y esperando
                            this.promptUpdate(registration);
                        }
                    });
                });
            });
        }

        async cleanupOldCaches() {
            if (typeof caches === 'undefined') return;
            try {
                const cacheNames = await caches.keys();
                const oldCaches = cacheNames.filter(name =>
                    name.includes('somospadel') && !name.includes('somospadel-pwa-v2.0.0') && !name.includes('v28')
                );

                if (oldCaches.length > 0) {
                    console.log(`🧹 Limpiando ${oldCaches.length} cachés antiguos...`);
                    await Promise.all(oldCaches.map(name => caches.delete(name)));
                    console.log('✅ Cachés antiguos eliminados');
                }
            } catch (e) {
                console.warn('⚠️ Error limpiando cachés:', e);
            }
        }

        promptUpdate(registration) {
            if (document.getElementById('sp-pwa-update-toast') || document.querySelector('.update-toast')) {
                return;
            }
            console.log("✨ UpdateManager: Update ready/waiting. Prompting user.");

            // Usar el sistema de UI existente o crear uno propio
            const msg = "🚀 Nueva versión disponible con mejoras.\nPulsa para aplicar cambios.";

            // 1. Si existe NotificationService (Toast de la app)
            if (window.NotificationService && window.NotificationService.showToast) {
                // Creamos un toast persistente o con acción
                const toast = document.createElement('div');
                toast.className = 'update-toast glass-card';
                toast.style.cssText = `
                    position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
                    width: 90%; max-width: 400px; background: rgba(20, 20, 20, 0.95);
                    border: 1px solid #CCFF00; padding: 16px; border-radius: 12px;
                    z-index: 10000; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                    display: flex; align-items: center; justify-content: space-between;
                    backdrop-filter: blur(10px); animation: slideUp 0.5s ease;
                `;

                toast.innerHTML = `
                    <div style="flex:1; color:white; font-size:0.9rem; font-weight:600;">
                        <i class="fas fa-bolt" style="color:#CCFF00; margin-right:8px;"></i>${msg.replace(/\n/g, '<br>')}
                    </div>
                    <button id="btn-update-pwa" style="
                        background:#CCFF00; color:black; border:none; padding:8px 16px;
                        border-radius:20px; font-weight:800; font-size:0.8rem; cursor:pointer;
                    ">ACTUALIZAR</button>
                `;

                document.body.appendChild(toast);

                const btn = toast.querySelector('#btn-update-pwa');
                btn.onclick = () => {
                    btn.innerHTML = "ACTUALIZANDO...";
                    if (registration.waiting) {
                        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                    }
                };

            } else {
                // Fallback nativo
                if (confirm(msg)) {
                    if (registration.waiting) {
                        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                    }
                }
            }
        }
    }

    // Inyectar estilos para la animación
    const style = document.createElement('style');
    style.innerHTML = `@keyframes slideUp { from { transform: translate(-50%, 100px); opacity:0; } to { transform: translate(-50%, 0); opacity:1; } }`;
    document.head.appendChild(style);

    window.UpdateManager = new UpdateManager();
    console.log("🔄 UpdateManager Loaded");
})();
