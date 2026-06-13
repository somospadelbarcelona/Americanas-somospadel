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
        
        try {
            // 1. ESPERA A FIREBASE (El pilar básico)
            await this.waitForDependency('db', 50); 
            await this.waitForDependency('auth', 50); 
            console.log("✅ [AppInit] Firebase DB y Auth detectados.");

            // 2. REGISTRO Y LANZAMIENTO DE SERVICIOS
            // Añade aquí cada servicio que necesitemos iniciar centralizadamente
            this.initServices();

            // 3. NOTIFICAR AL RESTO DEL CÓDIGO (Event Driven)
            this.initialized = true;
            document.dispatchEvent(new CustomEvent('AppReady', { 
                detail: { 
                    db: window.db,
                    auth: window.auth,
                    services: this.services 
                } 
            }));
            
            console.log("🏆 [AppInit] Sistemas OK. ¡A jugar!");

        } catch (error) {
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
        const errorBanner = document.createElement('div');
        errorBanner.style = "position:fixed; top:0; left:0; width:100%; padding:20px; background:#ff4b2b; color:white; text-align:center; z-index:9999; font-family:sans-serif; font-weight:bold;";
        errorBanner.innerHTML = `⚠️ ERROR DE INICIO: ${msg}. Por favor, recarga la página.`;
        document.body.appendChild(errorBanner);
    }
};

// Arrancamos automáticamente al terminar de cargar el DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.AppInit.boot());
} else {
    window.AppInit.boot();
}
