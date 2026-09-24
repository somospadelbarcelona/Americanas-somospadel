/**
 * StateManager.js (Global Version)
 * Adapta el patrón Pub/Sub para funcionar sin módulos ES6.
 */
(function () {
    class StateManager {
        constructor() {
            let initialUser = null;
            try {
                const cached = localStorage.getItem('currentUser');
                if (cached) {
                    initialUser = JSON.parse(cached);
                    console.log("💾 [StateManager] Sesión recuperada de localStorage:", initialUser.email);
                }
            } catch (e) {
                console.error("Error loading cached user:", e);
            }

            this.state = {
                currentUser: initialUser,
                dashboardData: null,
                // ... más estado inicial
            };
            this.listeners = {};
        }

        getState(key) {
            return this.state[key];
        }

        setState(key, value) {
            // Guardia de idempotencia: si el valor no ha cambiado, no disparar listeners
            const prev = this.state[key];
            if (prev !== undefined && value !== undefined) {
                try {
                    if (JSON.stringify(prev) === JSON.stringify(value)) {
                        return; // Sin cambios reales, omitir propagación
                    }
                } catch (e) {
                    if (prev === value) return;
                }
            }

            this.state[key] = value;
            if (key === 'currentUser') {
                window.currentUser = value; // Sincronización global
                try {
                    if (value) {
                        localStorage.setItem('currentUser', JSON.stringify(value));
                    } else {
                        localStorage.removeItem('currentUser');
                    }
                } catch (e) {
                    console.error("Error updating localStorage for currentUser:", e);
                }
            }
            // Notificar suscriptores
            if (this.listeners[key]) {
                this.listeners[key].forEach(callback => {
                    try {
                        callback(value);
                    } catch (err) {
                        console.error(`[StateManager] Error en listener de ${key}:`, err);
                    }
                });
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
