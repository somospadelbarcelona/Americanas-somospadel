/**
 * @file app-init.js
 * @description Controlador central para orquestar el inicio de la plataforma.
 * Evita Race Conditions esperando a que Firebase y los servicios estén listos en orden.
 */

window.AppInit = {
    initialized: false,
    services: {},

    /**
     * Punto de entrada principal
     */
    async boot() {
        console.log("🚀 [AppInit] Iniciando secuencia de arranque de AMERICANAS...");
        
        // Timeout de seguridad global de 5 segundos para evitar congelamiento infinito
        const bootTimeout = setTimeout(() => {
            if (!this.initialized) {
                console.error("❌ [AppInit Failsafe] Secuencia de arranque interrumpida por timeout de seguridad (5s).");
                this.showStartupError("El sistema tardó demasiado en responder. Comprueba tu conexión a Internet o recarga la página.");
            }
        }, 5000);

        try {
            // 1. ESPERA A FIREBASE (El pilar básico)
            await this.waitForDependency('db', 25); // Reducimos a 25 intentos (5s máx)
            await this.waitForDependency('auth', 25); 
            console.log("✅ [AppInit] Firebase DB y Auth detectados.");

            // 2. REGISTRO Y LANZAMIENTO DE SERVICIOS
            // Añade aquí cada servicio que necesitemos iniciar centralizadamente
            this.initServices();

            // 3. NOTIFICAR AL RESTO DEL CÓDIGO (Event Driven)
            this.initialized = true;
            clearTimeout(bootTimeout); // Cancelar el timeout de seguridad

            document.dispatchEvent(new CustomEvent('AppReady', { 
                detail: { 
                    db: window.db,
                    auth: window.auth,
                    services: this.services 
                } 
            }));
            
            console.log("🏆 [AppInit] Sistemas OK. ¡A jugar!");

        } catch (error) {
            clearTimeout(bootTimeout);
            console.error("❌ [AppInit] Error crítico en el arranque:", error);
            // Si falla algo crítico, avisar al usuario (Premium UX)
            this.showStartupError(error);
        }
    },

    /**
     * Espera a que una variable global esté definida (Firebase, etc)
     */
    waitForDependency(globalVar, maxAttempts = 50) {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const check = setInterval(() => {
                if (window[globalVar]) {
                    clearInterval(check);
                    resolve(window[globalVar]);
                }
                if (attempts++ >= maxAttempts) {
                    clearInterval(check);
                    reject(`Timeout esperando a ${globalVar}`);
                }
            }, 200);
        });
    },

    /**
     * Fábrica de Servicios: Crea las instancias de forma controlada
     */
    initServices() {
        // AMERICANA SERVICE
        if (window.AmericanaServiceClass && !window.AmericanaService) {
            window.AmericanaService = new window.AmericanaServiceClass();
            this.services.Americana = window.AmericanaService;
            console.log("📦 [AppInit] AmericanaService inicializado.");
        }

        // NOTIFICATION SERVICE
        if (window.NotificationServiceClass && !window.NotificationService) {
            window.NotificationService = new window.NotificationServiceClass();
            if (typeof window.NotificationService.init === 'function') {
                window.NotificationService.init();
            }
            this.services.Notifications = window.NotificationService;
            console.log("📦 [AppInit] NotificationService inicializado.");
        }

        // AUTOMATION SERVICE
        if (window.AutomationService && typeof window.AutomationService.init === 'function') {
            window.AutomationService.init();
            this.services.Automation = window.AutomationService;
            console.log("🤖 [AppInit] AutomationService activado.");
        }

        // RANKING CONTROLLER
        if (window.RankingControllerClass && !window.RankingController) {
            window.RankingController = new window.RankingControllerClass();
            this.services.Ranking = window.RankingController;
            console.log("🏆 [AppInit] RankingController inicializado.");
        }
    },

    /**
     * UX: Mostrar error si algo falla al cargar
     */
    showStartupError(msg) {
        // Evitar duplicar banners
        if (document.getElementById('startup-error-banner')) return;

        const errorBanner = document.createElement('div');
        errorBanner.id = 'startup-error-banner';
        errorBanner.style = "position:fixed; top:0; left:0; width:100%; padding:20px; background:#ff4b2b; color:white; text-align:center; z-index:9999; font-family:'Outfit',sans-serif; font-weight:bold; box-shadow:0 4px 15px rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center; gap:15px; flex-wrap:wrap;";
        errorBanner.innerHTML = `
            <span>⚠️ ERROR DE INICIO: ${msg}</span>
            <button onclick="window.location.reload()" style="padding:6px 16px; background:#ffffff; color:#ff4b2b; border:none; border-radius:8px; font-weight:900; cursor:pointer; font-size:0.8rem; box-shadow:0 2px 5px rgba(0,0,0,0.2); transition:transform 0.1s;" onmousedown="this.style.transform='scale(0.95)'" onmouseup="this.style.transform='scale(1)'">RECARGAR APLICACIÓN 🔄</button>
        `;
        document.body.appendChild(errorBanner);

        // Ocultar skeletons defensivamente para que la pantalla no se vea colgada
        const container = document.getElementById('content-area');
        if (container) {
            container.innerHTML = `
                <div class="fade-in" style="text-align:center; padding:100px 20px; color:#64748b; font-family:'Outfit',sans-serif; max-width:500px; margin:0 auto;">
                    <i class="fas fa-exclamation-triangle" style="font-size:3rem; color:#ff4b2b; margin-bottom:15px;"></i>
                    <h2 style="color:#0a192f; font-weight:900; margin:0 0 10px 0; font-size:1.4rem;">No se pudo iniciar la aplicación</h2>
                    <p style="font-size:0.9rem; margin:0; line-height:1.4;">El tiempo de respuesta del servidor expiró. Esto ocurre habitualmente por falta de conexión o si Firebase no se encuentra disponible temporalmente.</p>
                </div>
            `;
        }
    }
};

// Arrancamos automáticamente al terminar de cargar el DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.AppInit.boot());
} else {
    window.AppInit.boot();
}
