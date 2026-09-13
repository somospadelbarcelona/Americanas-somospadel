/**
 * NeuralAgent_v6.js
 * 🤖 EL AGENTE AUTÓNOMO DE SOMOSPADEL BCN
 * Trabaja en segundo plano, detecta problemas y propone soluciones proactivamente solo a usuarios administradores.
 */

(function () {
    'use strict';

    const NeuralAgent = {
        config: {
            checkInterval: 300000, // Cada 5 minutos (300000ms)
            lastCheck: null,
            triggers: {
                lowOccupancy: 0.5, // 50%
                newPlayers: true,
                performanceJumps: true
            }
        },

        init() {
            console.log("🤖 Neural Agent v6.1 Online (Modo Autónomo)");
            this.startMonitoring();
        },

        startMonitoring() {
            // Primer chequeo a los 10 segundos de cargar
            setTimeout(() => this.runAudit(), 10000);
            
            // Intervalo de vigilancia
            setInterval(() => {
                this.runAudit();
            }, this.config.checkInterval);
        },

        /**
         * Verifica si el usuario actual tiene privilegios de administración.
         * Evita mostrar alertas internas de gestión a jugadores regulares.
         */
        isAdminUser() {
            try {
                // 1. En panel admin por URL o estructura DOM
                if (window.location.pathname.includes('admin.html') || 
                    window.location.hash.includes('admin') || 
                    document.getElementById('admin-layout') || 
                    document.querySelector('.admin-sidebar')) {
                    return true;
                }
                
                // 2. AdminAuth activo
                if (window.AdminAuth && window.AdminAuth.user) {
                    return true;
                }

                // 3. Current user en Store global
                const storeUser = (window.Store && typeof window.Store.getState === 'function')
                    ? window.Store.getState('currentUser')
                    : null;
                
                // 4. Fallback en localStorage
                const cachedUser = storeUser || JSON.parse(localStorage.getItem('adminUser') || localStorage.getItem('currentUser') || 'null');
                if (cachedUser && cachedUser.role) {
                    const role = String(cachedUser.role).toLowerCase().trim();
                    return ['super_admin', 'superadmin', 'admin', 'admin_player', 'captain', 'capitan', 'organizador'].includes(role);
                }
            } catch (e) {
                console.warn("Neural Agent: Error al verificar rol de admin:", e);
            }
            return false;
        },

        /**
         * Comprueba si una alerta fue descartada recientemente en esta sesión
         */
        isDismissed(id) {
            try {
                const ts = sessionStorage.getItem(`neural_dismiss_${id}`);
                if (!ts) return false;
                // Silenciar durante 30 minutos
                return (Date.now() - parseInt(ts, 10)) < 30 * 60 * 1000;
            } catch (e) {
                return false;
            }
        },

        dismissAlert(id) {
            try {
                if (id) {
                    sessionStorage.setItem(`neural_dismiss_${id}`, Date.now().toString());
                }
            } catch (e) {}
        },

        async runAudit() {
            // Si el usuario NO es administrador, no ejecutar auditoría de gestión
            if (!this.isAdminUser()) {
                return;
            }

            if (!window.db) return;

            console.log("🧠 Neural Agent: Ejecutando auditoría autónoma...");
            try {
                const alerts = [];

                // 1. Detectar Jugadores Pendientes de Validación
                const pSnap = await window.db.collection('players').where('status', '==', 'pending').get();
                if (pSnap.size > 0 && !this.isDismissed('pending_players')) {
                    const count = pSnap.size;
                    const desc = count === 1
                        ? 'Hay 1 jugador esperando validación.'
                        : `Hay ${count} jugadores esperando validación.`;

                    alerts.push({
                        id: 'pending_players',
                        type: 'security',
                        title: 'Nuevos Registros',
                        desc: desc,
                        targetView: 'users'
                    });
                }

                // 2. Detectar Americanas con baja ocupación
                const aSnap = await window.db.collection('americanas').where('status', '==', 'active').get();
                aSnap.forEach(doc => {
                    const data = doc.data();
                    const alertId = `low_occ_${doc.id}`;
                    if (this.isDismissed(alertId)) return;

                    const playersCount = (data.players || []).length;
                    const maxPlayers = data.maxPlayers || 16;
                    const percentage = Math.round((playersCount / maxPlayers) * 100);

                    if (playersCount / maxPlayers < this.config.triggers.lowOccupancy) {
                        alerts.push({
                            id: alertId,
                            type: 'warning',
                            title: 'Baja Ocupación',
                            desc: `La americana "${data.name || 'Próxima'}" está solo al ${percentage}%.`,
                            targetView: 'americanas_mgmt'
                        });
                    }
                });

                // Si hay alertas pendientes, mostrar la primera
                if (alerts.length > 0) {
                    this.showNeuralNotification(alerts[0]);
                }

            } catch (e) {
                console.error("Neural Agent Error:", e);
            }
        },

        /**
         * Maneja el clic en "REVISAR", compatible tanto con admin.html como con index.html
         */
        handleAction(targetView, alertId) {
            this.closeNotification(alertId);

            if (alertId === 'pending_players') {
                try {
                    sessionStorage.setItem('admin_pending_review', 'true');
                    sessionStorage.setItem('admin_filter_status', 'pending');
                } catch (e) {}
            }

            if (typeof window.loadAdminView === 'function') {
                const loadPromise = window.loadAdminView(targetView);
                if (loadPromise && typeof loadPromise.then === 'function') {
                    loadPromise.then(() => {
                        setTimeout(() => {
                            if (alertId === 'pending_players' && typeof window.checkAndApplyPendingFocus === 'function') {
                                window.checkAndApplyPendingFocus();
                            }
                        }, 250);
                    });
                } else {
                    setTimeout(() => {
                        if (alertId === 'pending_players' && typeof window.checkAndApplyPendingFocus === 'function') {
                            window.checkAndApplyPendingFocus();
                        }
                    }, 250);
                }
            } else {
                // Si está en index.html, redirige a la vista administrativa con el filtro activo
                const query = (alertId === 'pending_players') ? '?filter=pending' : '';
                window.location.href = `admin.html${query}#${targetView}`;
            }
        },

        closeNotification(alertId) {
            if (alertId) {
                this.dismissAlert(alertId);
            }
            const toast = document.getElementById('neural-alert');
            if (toast) {
                toast.classList.remove('active');
                setTimeout(() => {
                    if (toast && toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300);
            }
        },

        showNeuralNotification(alert) {
            if (document.getElementById('neural-alert')) return;

            const toast = document.createElement('div');
            toast.id = 'neural-alert';
            toast.className = 'neural-toast-container';
            
            toast.innerHTML = `
                <style>
                    .neural-toast-container {
                        position: fixed;
                        bottom: 24px;
                        right: 24px;
                        width: 320px;
                        background: rgba(13, 16, 23, 0.96);
                        backdrop-filter: blur(20px);
                        -webkit-backdrop-filter: blur(20px);
                        border: 1px solid rgba(204, 255, 0, 0.4);
                        box-shadow: 0 16px 45px rgba(0, 0, 0, 0.6), 0 0 25px rgba(204, 255, 0, 0.15);
                        padding: 16px 18px;
                        border-radius: 18px;
                        color: #ffffff;
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                        z-index: 200005;
                        opacity: 0;
                        transform: translateY(20px);
                        transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                        box-sizing: border-box;
                    }
                    .neural-toast-container.active {
                        opacity: 1;
                        transform: translateY(0);
                    }
                    .neural-toast-header {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        margin-bottom: 8px;
                    }
                    .neural-toast-badge {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }
                    .neural-pulse-dot {
                        width: 9px;
                        height: 9px;
                        background: #CCFF00;
                        border-radius: 50%;
                        position: relative;
                        box-shadow: 0 0 8px #CCFF00;
                    }
                    .neural-pulse-dot::after {
                        content: '';
                        position: absolute;
                        top: -4px;
                        left: -4px;
                        right: -4px;
                        bottom: -4px;
                        border-radius: 50%;
                        border: 1.5px solid #CCFF00;
                        animation: neuralPulseAnim 1.8s infinite cubic-bezier(0.25, 0.46, 0.45, 0.94);
                    }
                    @keyframes neuralPulseAnim {
                        0% { transform: scale(0.6); opacity: 0.9; }
                        100% { transform: scale(2.2); opacity: 0; }
                    }
                    .neural-tag-text {
                        font-size: 0.68rem;
                        font-weight: 800;
                        letter-spacing: 1.5px;
                        color: #CCFF00;
                        text-transform: uppercase;
                    }
                    .neural-close-btn {
                        background: transparent;
                        border: none;
                        color: #888888;
                        font-size: 1.3rem;
                        line-height: 1;
                        cursor: pointer;
                        padding: 0 4px;
                        transition: color 0.2s;
                    }
                    .neural-close-btn:hover {
                        color: #ffffff;
                    }
                    .neural-toast-title {
                        font-weight: 700;
                        font-size: 0.95rem;
                        color: #ffffff;
                        margin-bottom: 4px;
                    }
                    .neural-toast-desc {
                        font-size: 0.82rem;
                        line-height: 1.4;
                        color: rgba(255, 255, 255, 0.75);
                        margin-bottom: 14px;
                    }
                    .neural-toast-actions {
                        display: flex;
                        gap: 10px;
                        align-items: center;
                    }
                    .neural-btn-review {
                        flex: 1;
                        background: #CCFF00;
                        color: #0a0a0a;
                        font-weight: 800;
                        font-size: 0.72rem;
                        letter-spacing: 0.5px;
                        padding: 9px 14px;
                        border: none;
                        border-radius: 10px;
                        cursor: pointer;
                        transition: transform 0.15s ease, box-shadow 0.15s ease;
                        text-align: center;
                        box-shadow: 0 4px 12px rgba(204, 255, 0, 0.25);
                    }
                    .neural-btn-review:hover {
                        transform: translateY(-1px);
                        box-shadow: 0 6px 16px rgba(204, 255, 0, 0.35);
                    }
                    .neural-btn-review:active {
                        transform: scale(0.97);
                    }
                    .neural-btn-ignore {
                        background: rgba(255, 255, 255, 0.06);
                        color: #999999;
                        font-weight: 600;
                        font-size: 0.72rem;
                        padding: 9px 14px;
                        border: 1px solid rgba(255, 255, 255, 0.12);
                        border-radius: 10px;
                        cursor: pointer;
                        transition: background 0.2s, color 0.2s;
                    }
                    .neural-btn-ignore:hover {
                        background: rgba(255, 255, 255, 0.12);
                        color: #ffffff;
                    }
                    @media (max-width: 768px) {
                        .neural-toast-container {
                            bottom: calc(85px + env(safe-area-inset-bottom, 15px));
                            right: 14px;
                            left: 14px;
                            width: auto;
                            max-width: 420px;
                            margin: 0 auto;
                        }
                    }
                </style>
                <div class="neural-toast-header">
                    <div class="neural-toast-badge">
                        <div class="neural-pulse-dot"></div>
                        <span class="neural-tag-text">Alerta Neural</span>
                    </div>
                    <button class="neural-close-btn" id="neural-close" aria-label="Cerrar">&times;</button>
                </div>
                <div class="neural-toast-title">${alert.title}</div>
                <div class="neural-toast-desc">${alert.desc}</div>
                <div class="neural-toast-actions">
                    <button class="neural-btn-review" id="neural-action-btn">REVISAR</button>
                    <button class="neural-btn-ignore" id="neural-ignore-btn">IGNORAR</button>
                </div>
            `;

            document.body.appendChild(toast);
            
            // Animación suave de entrada
            requestAnimationFrame(() => {
                toast.classList.add('active');
            });

            // Asignar eventos de forma limpia y segura
            const closeBtn = toast.querySelector('#neural-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    this.closeNotification(alert.id);
                });
            }

            const ignoreBtn = toast.querySelector('#neural-ignore-btn');
            if (ignoreBtn) {
                ignoreBtn.addEventListener('click', () => {
                    this.closeNotification(alert.id);
                });
            }

            const actionBtn = toast.querySelector('#neural-action-btn');
            if (actionBtn) {
                actionBtn.addEventListener('click', () => {
                    this.handleAction(alert.targetView, alert.id);
                });
            }
            
            // Sonido o vibración proactiva si existe
            if (window.PlayerView?.haptic) {
                try { window.PlayerView.haptic(50); } catch (e) {}
            }
        }
    };

    window.NeuralAgent = NeuralAgent;
    
    // Auto-init cuando la base de datos esté disponible
    const checkDB = setInterval(() => {
        if (window.db) {
            NeuralAgent.init();
            clearInterval(checkDB);
        }
    }, 1000);

})();
