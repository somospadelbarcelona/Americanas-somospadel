/**
 * NeuralAgent_v6.js
 * 🤖 EL AGENTE AUTÓNOMO DE SOMOSPADEL BCN
 * Trabaja en segundo plano, detecta problemas y propone soluciones proactivamente.
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
            console.log("🤖 Neural Agent v6.0 Online (Modo Autónomo)");
            this.startMonitoring();
        },

        startMonitoring() {
            // Primer chequeo a los 30 segundos de cargar
            setTimeout(() => this.runAudit(), 30000);
            
            // Intervalo de vigilancia
            setInterval(() => {
                this.runAudit();
            }, this.config.checkInterval);
        },

        async runAudit() {
            console.log("🧠 Neural Agent: Ejecutando auditoría autónoma...");
            try {
                const alerts = [];

                // 1. Detectar Jugadores Pendientes
                const pSnap = await window.db.collection('players').where('status', '==', 'pending').get();
                if (pSnap.size > 0) {
                    alerts.push({
                        type: 'security',
                        title: 'Nuevos Registros',
                        desc: `Hay ${pSnap.size} jugadores esperando validación.`,
                        action: 'window.loadAdminView("users")'
                    });
                }

                // 2. Detectar Americanas con baja ocupación
                const aSnap = await window.db.collection('americanas').where('status', '==', 'active').get();
                aSnap.forEach(doc => {
                    const data = doc.data();
                    const playersCount = (data.players || []).length;
                    const maxPlayers = data.maxPlayers || 16;
                    if (playersCount / maxPlayers < this.config.triggers.lowOccupancy) {
                        alerts.push({
                            type: 'warning',
                            title: 'Baja Ocupación',
                            desc: `La americana "${data.name}" está solo al ${Math.round((playersCount/maxPlayers)*100)}%.`,
                            action: 'window.loadAdminView("events")'
                        });
                    }
                });

                // Si hay alertas, disparar el Pulso Neural
                if (alerts.length > 0) {
                    this.showNeuralNotification(alerts[0]);
                }

            } catch (e) {
                console.error("Neural Agent Error:", e);
            }
        },

        showNeuralNotification(alert) {
            if (document.getElementById('neural-alert')) return;

            const toast = document.createElement('div');
            toast.id = 'neural-alert';
            toast.style = `
                position: fixed; bottom: 30px; right: 30px;
                background: rgba(10, 10, 10, 0.95);
                backdrop-filter: blur(20px);
                border: 1px solid var(--ai-neon);
                padding: 20px; border-radius: 20px;
                color: white; width: 300px;
                box-shadow: 0 20px 50px rgba(0,0,0,0.5), 0 0 20px rgba(204,255,0,0.2);
                z-index: 200005; animation: alertSlide 0.5s cubic-bezier(0.23, 1, 0.32, 1);
            `;
            
            toast.innerHTML = `
                <div style="display:flex; align-items:center; gap:12px; margin-bottom:10px;">
                    <div class="neural-pulse"></div>
                    <b style="font-size:0.7rem; letter-spacing:2px; color:var(--ai-neon); text-transform:uppercase;">Alerta Neural</b>
                </div>
                <div style="font-weight:800; font-size:0.9rem; margin-bottom:5px;">${alert.title}</div>
                <div style="font-size:0.8rem; opacity:0.7; margin-bottom:15px;">${alert.desc}</div>
                <div style="display:flex; gap:10px;">
                    <button class="ai-pro-btn" style="flex:1; font-size:0.6rem;" onclick="${alert.action}; this.parentElement.parentElement.remove();">REVISAR</button>
                    <button class="ai-pro-btn" style="background:transparent; border:none; flex:0.4; font-size:0.6rem; color:#888;" onclick="this.parentElement.parentElement.remove()">IGNORAR</button>
                </div>
                <style>
                    @keyframes alertSlide { from { transform: translateX(100%); opacity:0; } to { transform: translateX(0); opacity:1; } }
                </style>
            `;

            document.body.appendChild(toast);
            
            // Sonido o vibración proactiva
            if (window.PlayerView?.haptic) window.PlayerView.haptic(50);
        }
    };

    window.NeuralAgent = NeuralAgent;
    
    // Auto-init si la base de datos está lista
    const checkDB = setInterval(() => {
        if (window.db) {
            NeuralAgent.init();
            clearInterval(checkDB);
        }
    }, 1000);

})();
