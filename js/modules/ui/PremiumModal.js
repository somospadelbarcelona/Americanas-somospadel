/**
 * PremiumModal.js
 * Un reemplazo de élite para alert() y confirm() con estética NASA/Somospadel.
 */
class PremiumModal {
    static _injectStyles() {
        if (document.getElementById('premium-modal-styles')) return;
        const style = document.createElement('style');
        style.id = 'premium-modal-styles';
        style.innerHTML = `
            @keyframes pm-fade-in { from { opacity: 0; } to { opacity: 1; } }
            @keyframes pm-scale-in { from { transform: scale(0.85) translateY(20px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
            @keyframes pm-shake { 
                0%, 100% { transform: translateX(0); }
                20%, 60% { transform: translateX(-6px); }
                40%, 80% { transform: translateX(6px); }
            }
            .pm-shake-anim { animation: pm-shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
            .pm-overlay { 
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(2, 6, 23, 0.85); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
                z-index: 999999; display: flex; align-items: center; justify-content: center;
                animation: pm-fade-in 0.3s ease-out forwards;
            }
            .pm-card {
                background: linear-gradient(165deg, #1e293b 0%, #0f172a 100%);
                width: 90%; max-width: 420px; border-radius: 28px;
                border: 1px solid rgba(255,255,255,0.08);
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), inset 0 1px 1px rgba(255,255,255,0.05);
                overflow: hidden; animation: pm-scale-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            }
            .pm-btn {
                flex: 1; padding: 14px; border-radius: 16px; border: none;
                font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 0.95rem;
                cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                text-transform: uppercase; letter-spacing: 0.5px;
            }
            .pm-btn:active { transform: scale(0.96); }
            .pm-btn-primary:hover { filter: brightness(1.1); box-shadow: 0 0 20px var(--accent-glow); }
            .pm-btn-secondary:hover { background: rgba(255,255,255,0.05); color: white; }
        `;
        document.head.appendChild(style);
    }

    static async confirm(options = {}) {
        this._injectStyles();
        const {
            title = 'CONSULTA DE SISTEMA',
            message = '¿Confirmas la ejecución de esta tarea?',
            confirmText = 'PROCEDER',
            cancelText = 'CANCELAR',
            type = 'warning'
        } = options;

        return new Promise((resolve) => {
            const colors = {
                warning: '#ccff00',
                danger: '#ff3b30',
                info: '#00d4ff',
                success: '#00ff88'
            };
            const accent = colors[type] || colors.warning;

            const overlay = document.createElement('div');
            overlay.className = 'pm-overlay';

            const modal = document.createElement('div');
            modal.className = `pm-card ${type === 'danger' ? 'pm-shake-anim' : ''}`;
            modal.style.setProperty('--accent-glow', accent + '40');

            modal.innerHTML = `
                <div style="height: 5px; background: linear-gradient(90deg, ${accent}00, ${accent}, ${accent}00); width: 100%;"></div>
                <div style="padding: 35px 30px 25px; text-align: center;">
                    <div style="width: 64px; height: 64px; border-radius: 20px; background: ${accent}12; color: ${accent}; display: flex; align-items: center; justify-content: center; margin: 0 auto 22px; font-size: 1.6rem; border: 1px solid ${accent}25; box-shadow: 0 10px 20px -5px ${accent}20;">
                        <i class="fas fa-${type === 'danger' ? 'fire' : (type === 'warning' ? 'terminal' : 'info-circle')}"></i>
                    </div>
                    <h3 style="color: white; font-family: 'Outfit'; font-weight: 900; margin-bottom: 12px; font-size: 1.3rem; letter-spacing: 0.5px;">${title}</h3>
                    <div style="color: #94a3b8; font-size: 0.95rem; line-height: 1.6; font-weight: 500;">${message}</div>
                </div>
                <div style="display: flex; padding: 0 25px 30px; gap: 12px;">
                    <button id="p-modal-cancel" class="pm-btn pm-btn-secondary" style="background: transparent; color: #64748b; border: 1px solid rgba(255,255,255,0.05);">${cancelText}</button>
                    <button id="p-modal-confirm" class="pm-btn pm-btn-primary" style="background: ${accent}; color: ${type === 'warning' || type === 'success' || type === 'info' ? '#000' : '#fff'};">${confirmText}</button>
                </div>
            `;

            overlay.appendChild(modal);
            document.body.appendChild(overlay);

            const cleanup = (result) => {
                modal.style.transition = 'all 0.2s ease-in';
                modal.style.transform = 'scale(0.9)';
                overlay.style.opacity = '0';
                setTimeout(() => {
                    overlay.remove();
                    resolve(result);
                }, 200);
            };

            overlay.querySelector('#p-modal-confirm').onclick = () => cleanup(true);
            overlay.querySelector('#p-modal-cancel').onclick = () => cleanup(false);
        });
    }

    static async alert(options = {}) {
        this._injectStyles();
        const {
            title = 'NOTIFICACIÓN',
            message = '',
            btnText = 'ENTENDIDO',
            type = 'info'
        } = typeof options === 'string' ? { message: options } : options;

        return new Promise((resolve) => {
            const colors = {
                success: '#00ff88',
                danger: '#ff3b30',
                info: '#ccff00'
            };
            const accent = colors[type] || colors.info;

            const overlay = document.createElement('div');
            overlay.className = 'pm-overlay';

            const modal = document.createElement('div');
            modal.className = 'pm-card';
            modal.style.setProperty('--accent-glow', accent + '40');

            modal.innerHTML = `
                <div style="height: 5px; background: linear-gradient(90deg, ${accent}00, ${accent}, ${accent}00); width: 100%;"></div>
                <div style="padding: 35px 30px 25px; text-align: center;">
                    <div style="width: 64px; height: 64px; border-radius: 20px; background: ${accent}12; color: ${accent}; display: flex; align-items: center; justify-content: center; margin: 0 auto 22px; font-size: 1.6rem; border: 1px solid ${accent}25;">
                        <i class="fas fa-${type === 'danger' ? 'shield-alt' : (type === 'success' ? 'check-double' : 'bell')}"></i>
                    </div>
                    <h3 style="color: white; font-family: 'Outfit'; font-weight: 900; margin-bottom: 12px; font-size: 1.3rem;">${title}</h3>
                    <div style="color: #94a3b8; font-size: 0.95rem; line-height: 1.6;">${message}</div>
                </div>
                <div style="padding: 0 25px 30px;">
                    <button id="p-modal-ok" class="pm-btn pm-btn-primary" style="width: 100%; background: ${accent}; color: ${type === 'danger' ? '#fff' : '#000'};">${btnText}</button>
                </div>
            `;

            overlay.appendChild(modal);
            document.body.appendChild(overlay);

            const cleanup = () => {
                modal.style.transition = 'all 0.2s ease-in';
                modal.style.transform = 'scale(0.9)';
                overlay.style.opacity = '0';
                setTimeout(() => {
                    overlay.remove();
                    resolve();
                }, 200);
            };

            overlay.querySelector('#p-modal-ok').onclick = cleanup;
        });
    }
}

window.PremiumModal = PremiumModal;


window.PremiumModal = PremiumModal;
