/**
 * ShareModal.js
 * Modal to preview and download the generated match image.
 */
class ShareModal {
    constructor() {
        this.modalId = 'share-match-modal';
        this.injectStyles();
    }

    injectStyles() {
        if (document.getElementById('share-modal-styles')) return;
        const style = document.createElement('style');
        style.id = 'share-modal-styles';
        style.innerHTML = `
            .share-modal-overlay {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.9); z-index: 14000;
                display: flex; align-items: center; justify-content: center;
                backdrop-filter: blur(10px);
                opacity: 0; transition: opacity 0.3s; pointer-events: none;
            }
            .share-modal-overlay.open {
                opacity: 1; pointer-events: all;
            }
            .share-modal-content {
                width: 90%; max-width: 450px;
                background: #111; border-radius: 24px;
                overflow: hidden; border: 1px solid #333;
                transform: translateY(20px); transition: transform 0.3s;
                position: relative;
            }
            .share-modal-overlay.open .share-modal-content {
                transform: translateY(0);
            }
            .share-preview-img {
                width: 100%; height: auto; display: block;
                border-bottom: 1px solid #333;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Opens the modal to share different types of content.
     * @param {string} type - 'match', 'ranking', 'stats', 'report'
     * @param {Object} data - The primary data (match object, ranking array, or metrics object)
     * @param {Object} extraData - Additional data (eventDoc, subjectName, etc.)
     */
    async open(type, data, extraData) {
        // 0. Loading State
        this.showLoading();

        try {
            // 1. Generate Image based on Type
            if (!window.SocialShareService) {
                throw new Error("SocialShareService not found");
            }

            let dataUrl;
            if (type === 'match') {
                dataUrl = await window.SocialShareService.generateMatchImage(data, extraData); // data=match, extra=eventDoc
            } else if (type === 'ranking') {
                dataUrl = await window.SocialShareService.generateRankingImage(data, extraData); // data=ranking, extra=eventDoc
            } else if (type === 'stats') {
                dataUrl = await window.SocialShareService.generateStatsImage(data, extraData); // data=ranking, extra=eventDoc
            } else if (type === 'report') {
                // data=metrics, extraData={subjectName, eventDoc}
                dataUrl = await window.SocialShareService.generateReportImage(data, extraData.subjectName, extraData.eventDoc);
            } else {
                throw new Error("Unknown share type: " + type);
            }

            // 2. Render Modal with Image
            this.renderModal(dataUrl);

        } catch (e) {
            console.error(e);
            alert("Error al generar la imagen: " + e.message);
            this.close();
        }
    }

    showLoading() {
        let el = document.getElementById(this.modalId);
        if (!el) {
            el = document.createElement('div');
            el.id = this.modalId;
            el.className = 'share-modal-overlay open';
            document.body.appendChild(el);
        }
        el.innerHTML = `
            <div style="text-align: center; color: white;">
                <div class="loader" style="margin: 0 auto 20px;"></div>
                <div style="font-weight: 800; font-size: 1.1rem;">GENERANDO CAPTURA...</div>
                <div style="font-size: 0.8rem; color: #888; margin-top: 5px;">Sonriendo para la foto 📸</div>
            </div>
        `;
    }

    renderModal(dataUrl) {
        const el = document.getElementById(this.modalId);
        if (!el) return;

        el.innerHTML = `
            <div class="share-modal-content">
                <div style="padding: 15px; position: absolute; top: 0; right: 0; z-index: 10;">
                    <div onclick="window.ShareModal.close()" style="background: rgba(0,0,0,0.5); color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                        <i class="fas fa-times"></i>
                    </div>
                </div>
                
                <img src="${dataUrl}" class="share-preview-img" alt="Resultado Match">

                <div style="padding: 20px; text-align: center; background: #111;">
                    <h3 style="color: white; margin: 0 0 5px 0; font-size: 1.2rem;">¡Listo para compartir! 🚀</h3>
                    <p style="color: #666; font-size: 0.8rem; margin-bottom: 20px;">Sube esta imagen a tus Stories y etiqueta a @somospadelbcn</p>
                    
                    <div style="display: flex; gap: 10px; flex-direction: column;">
                        <a href="${dataUrl}" download="match-somospadel.png" class="btn-primary-pro" style="text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 10px; background: #CCFF00; color: black;">
                            <i class="fas fa-download"></i> DESCARGAR IMAGEN
                        </a>
                        
                        ${navigator.share ? `
                            <button onclick="window.ShareModal.nativeShare('${dataUrl}')" style="background: #333; color: white; border: none; padding: 15px; border-radius: 12px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer;">
                                <i class="fas fa-share-alt"></i> COMPARTIR
                            </button>
                        ` : ''}

                        <button onclick="window.ShareModal.close()" style="background: transparent; border: 1px solid #333; color: #888; padding: 12px; border-radius: 12px; font-weight: 800; cursor: pointer; margin-top: 5px;">
                            VOLVER
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    async nativeShare(dataUrl) {
        try {
            const blob = await (await fetch(dataUrl)).blob();
            const file = new File([blob], 'somospadel-match.png', { type: blob.type });

            if (navigator.share) {
                await navigator.share({
                    title: 'Resultado SomosPadel',
                    text: '¡Mira mi resultado en SomosPadel BCN!',
                    files: [file]
                });
            }
        } catch (e) {
            console.error("Native share failed:", e);
            alert("No se pudo abrir el menú de compartir nativo. Usa el botón de descargar.");
        }
    }

    close() {
        const el = document.getElementById(this.modalId);
        if (el) {
            el.classList.remove('open');
            setTimeout(() => el.remove(), 300);
        }
    }
}

window.ShareModal = new ShareModal();
