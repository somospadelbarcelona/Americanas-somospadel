/**
 * StateManager.js (Global Version)
 * Adapta el patrón Pub/Sub para funcionar sin módulos ES6.
 */
(function () {
    class StateManager {
        constructor() {
            this.state = {
                currentUser: null,
                dashboardData: null,
                // ... más estado inicial
            };
            this.listeners = {};
        }

        getState(key) {
            return this.state[key];
        }

        setState(key, value) {
            this.state[key] = value;
            // Notificar suscriptores
            if (this.listeners[key]) {
                this.listeners[key].forEach(callback => callback(value));
            }
        }

        subscribe(key, callback) {
            if (!this.listeners[key]) {
                this.listeners[key] = [];
            }
            this.listeners[key].push(callback);
            // Ejecutar inmediatamente con valor actual si existe
            if (this.state[key] !== undefined) {
                callback(this.state[key]);
            }
        }
    }

    // Expose globally with absolute priority
    window.Store = new StateManager();
    console.log("📦 StateManager Global Loaded & Initialized");
})();
