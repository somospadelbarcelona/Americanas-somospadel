/**
 * PremiumModal.js
 * Un reemplazo de élite para alert() y confirm() con estética NASA/Somospadel.
 */
class PremiumModal {
    static async confirm(options = {}) {
        const {
            title = 'CONFIRMACIÓN',
            message = '¿Estás seguro de realizar esta acción?',
            confirmText = 'CONFIRMAR',
            cancelText = 'CANCELAR',
            type = 'warning' // 'warning', 'danger', 'info'
        } = options;

        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'premium-modal-overlay';
            overlay.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.85); backdrop-filter: blur(10px);
                z-index: 200000; display: flex; align-items: center; justify-content: center;
                opacity: 0; transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            `;

            const colors = {
                warning: '#ccff00',
                danger: '#ef4444',
                info: '#3b82f6'
            };
            const accent = colors[type] || colors.warning;

            const modal = document.createElement('div');
            modal.style.cssText = `
                background: #0f172a; width: 90%; max-width: 400px;
                border-radius: 24px; border: 1px solid rgba(255,255,255,0.1);
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                overflow: hidden; transform: scale(0.9);
                transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            `;

            modal.innerHTML = `
                <div style="height: 6px; background: ${accent}; width: 100%;"></div>
                <div style="padding: 30px; text-align: center;">
                    <div style="width: 60px; height: 60px; border-radius: 50%; background: ${accent}15; color: ${accent}; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 1.5rem; border: 1px solid ${accent}30;">
                        <i class="fas fa-${type === 'danger' ? 'exclamation-triangle' : (type === 'warning' ? 'question' : 'info-circle')}"></i>
                    </div>
                    <h3 style="color: white; font-family: 'Outfit'; font-weight: 800; margin-bottom: 10px; letter-spacing: 0.5px; text-transform: uppercase;">${title}</h3>
                    <p style="color: #94a3b8; font-size: 0.9rem; line-height: 1.5; margin: 0;">${message}</p>
                </div>
                <div style="display: flex; padding: 20px; gap: 12px; background: rgba(0,0,0,0.2);">
                    <button id="p-modal-cancel" style="flex: 1; padding: 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: #94a3b8; font-weight: 700; cursor: pointer; transition: all 0.2s;">${cancelText}</button>
                    <button id="p-modal-confirm" style="flex: 1; padding: 12px; border-radius: 12px; border: none; background: ${accent}; color: #000; font-weight: 900; cursor: pointer; transition: all 0.2s;">${confirmText}</button>
                </div>
            `;

            overlay.appendChild(modal);
            document.body.appendChild(overlay);

            // Animate in
            setTimeout(() => {
                overlay.style.opacity = '1';
                modal.style.transform = 'scale(1)';
            }, 10);

            const cleanup = (result) => {
                overlay.style.opacity = '0';
                modal.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    overlay.remove();
                    resolve(result);
                }, 300);
            };

            overlay.querySelector('#p-modal-confirm').onclick = () => cleanup(true);
            overlay.querySelector('#p-modal-cancel').onclick = () => cleanup(false);

            // Hover effects
            const btnConfirm = overlay.querySelector('#p-modal-confirm');
            btnConfirm.onmouseover = () => btnConfirm.style.filter = 'brightness(1.1)';
            btnConfirm.onmouseout = () => btnConfirm.style.filter = 'brightness(1)';
        });
    }

    static async alert(options = {}) {
        const {
            title = 'AVISO',
            message = '',
            btnText = 'ENTENDIDO',
            type = 'info'
        } = typeof options === 'string' ? { message: options } : options;

        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'premium-modal-overlay';
            overlay.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.85); backdrop-filter: blur(10px);
                z-index: 200000; display: flex; align-items: center; justify-content: center;
                opacity: 0; transition: opacity 0.3s ease;
            `;

            const colors = {
                success: '#00ff88',
                danger: '#ef4444',
                info: '#ccff00'
            };
            const accent = colors[type] || colors.info;

            const modal = document.createElement('div');
            modal.style.cssText = `
                background: #0f172a; width: 90%; max-width: 380px;
                border-radius: 24px; border: 1px solid rgba(255,255,255,0.1);
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                overflow: hidden; transform: scale(0.9);
                transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            `;

            modal.innerHTML = `
                <div style="height: 6px; background: ${accent}; width: 100%;"></div>
                <div style="padding: 30px; text-align: center;">
                    <div style="width: 60px; height: 60px; border-radius: 50%; background: ${accent}15; color: ${accent}; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 1.5rem;">
                        <i class="fas fa-${type === 'danger' ? 'times-circle' : (type === 'success' ? 'check-circle' : 'info-circle')}"></i>
                    </div>
                    <h3 style="color: white; font-family: 'Outfit'; font-weight: 800; margin-bottom: 10px; text-transform: uppercase;">${title}</h3>
                    <p style="color: #94a3b8; font-size: 0.9rem; line-height: 1.5; margin: 0;">${message}</p>
                </div>
                <div style="padding: 0 20px 25px;">
                    <button id="p-modal-ok" style="width: 100%; padding: 14px; border-radius: 12px; border: none; background: ${accent}; color: #000; font-weight: 900; cursor: pointer; transition: all 0.2s; text-transform: uppercase; letter-spacing: 1px;">${btnText}</button>
                </div>
            `;

            overlay.appendChild(modal);
            document.body.appendChild(overlay);

            setTimeout(() => {
                overlay.style.opacity = '1';
                modal.style.transform = 'scale(1)';
            }, 10);

            const cleanup = () => {
                overlay.style.opacity = '0';
                modal.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    overlay.remove();
                    resolve();
                }, 300);
            };

            overlay.querySelector('#p-modal-ok').onclick = cleanup;
        });
    }
}

window.PremiumModal = PremiumModal;
