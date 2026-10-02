/**
 * RoundAutoRegenNotice.js
 * Interfaz y notificaciones visibles en tiempo real para avisar sobre la
 * regeneración automática de rondas ante nuevos inscritos.
 */

(function () {
    'use strict';

    window.RoundAutoRegenNotice = {
        /**
         * Muestra el banner visible en la parte superior o anclado a un contenedor
         */
        showNotice(message = "⚠️ La planificación se ha actualizado automáticamente debido a nuevos inscritos.") {
            // Evitar duplicados
            const existing = document.getElementById('sp-round-regen-banner');
            if (existing) {
                existing.remove();
            }

            const banner = document.createElement('div');
            banner.id = 'sp-round-regen-banner';
            banner.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; width: 100%; max-width: 600px; margin: 0 auto;">
                    <div style="display: flex; align-items: center; gap: 10px; text-align: left;">
                        <span style="font-size: 1.3rem; animation: pulseIcon 1.5s infinite;">⚠️</span>
                        <span style="font-size: 0.85rem; font-weight: 800; color: #ffffff; letter-spacing: 0.2px; line-height: 1.3;">
                            ${message}
                        </span>
                    </div>
                    <button type="button" onclick="document.getElementById('sp-round-regen-banner')?.remove()" 
                            style="background: transparent; border: none; color: rgba(255,255,255,0.7); font-size: 1.1rem; cursor: pointer; padding: 4px 8px; line-height: 1;">
                        ✕
                    </button>
                </div>
            `;

            Object.assign(banner.style, {
                position: 'fixed',
                top: '16px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: '999999',
                background: 'linear-gradient(135deg, rgba(217, 119, 6, 0.95), rgba(180, 83, 9, 0.95))',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(251, 191, 36, 0.5)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
                borderRadius: '16px',
                padding: '12px 18px',
                width: 'calc(100% - 32px)',
                maxWidth: '620px',
                animation: 'slideDownNotice 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards'
            });

            // Estilos CSS de animación si no existen
            if (!document.getElementById('sp-regen-notice-styles')) {
                const style = document.createElement('style');
                style.id = 'sp-regen-notice-styles';
                style.textContent = `
                    @keyframes slideDownNotice {
                        from { opacity: 0; transform: translate(-50%, -20px); }
                        to { opacity: 1; transform: translate(-50%, 0); }
                    }
                    @keyframes pulseIcon {
                        0%, 100% { transform: scale(1); }
                        50% { transform: scale(1.15); }
                    }
                `;
                document.head.appendChild(style);
            }

            document.body.appendChild(banner);

            // Auto-ocultar a los 12 segundos
            setTimeout(() => {
                if (banner && banner.parentNode) {
                    banner.style.opacity = '0';
                    banner.style.transition = 'opacity 0.4s ease';
                    setTimeout(() => banner.remove(), 400);
                }
            }, 12000);
        },

        /**
         * Modal administrativo para cuando un jugador entra pero la ronda ya tiene partidos en curso
         */
        showActiveRoundAdminModal(detail) {
            const playerName = detail?.addedPlayer?.name || 'Un nuevo jugador';
            const roundNum = detail?.round || 1;

            if (window.PremiumModal && typeof window.PremiumModal.alert === 'function') {
                window.PremiumModal.alert({
                    title: "⚠️ JUGADOR INSCRITO EN RONDA ACTIVA",
                    message: `<b>${playerName}</b> se ha inscrito cuando la <b>Ronda ${roundNum}</b> ya está iniciada.<br><br>Para no interrumpir los partidos en juego, la ronda actual no ha sido modificada.<br>Puedes asignarlo como reserva o programarlo para la siguiente ronda.`
                });
            } else {
                alert(`⚠️ ATENCIÓN ADMINISTRADOR:\n\n${playerName} se ha inscrito pero la Ronda ${roundNum} ya tiene partidos iniciados.\nLa ronda actual se ha mantenido intacta.`);
            }
        },

        /**
         * Inicializa los listeners globales de tiempo real
         */
        initListeners() {
            // 1. Escuchar regeneración automática exitosa
            window.addEventListener('roundAutoRegenerated', (e) => {
                console.log("⚡ [RoundAutoRegenNotice] Evento de regeneración recibido:", e.detail);
                const msg = e.detail?.message || "⚠️ La planificación se ha actualizado automáticamente debido a nuevos inscritos.";
                this.showNotice(msg);

                // Si está abierta la Torre de Control o Resultados, recargar datos inmediatamente
                if (window.ControlTowerView && typeof window.ControlTowerView.reloadMatches === 'function') {
                    window.ControlTowerView.reloadMatches();
                }
                if (window.AdminResults && typeof window.AdminResults.loadResults === 'function') {
                    window.AdminResults.loadResults();
                }
                if (window.loadResultsView) {
                    window.loadResultsView(e.detail?.eventType);
                }
            });

            // 2. Escuchar bloqueo por partidos en juego
            window.addEventListener('roundCannotRegenerateActiveMatches', (e) => {
                console.warn("🛑 [RoundAutoRegenNotice] Ronda activa no regenerable:", e.detail);
                this.showActiveRoundAdminModal(e.detail);
            });
        }
    };

    // Auto-inicializar listeners
    window.RoundAutoRegenNotice.initListeners();
    console.log("🚀 RoundAutoRegenNotice cargado e inicializado");
})();
