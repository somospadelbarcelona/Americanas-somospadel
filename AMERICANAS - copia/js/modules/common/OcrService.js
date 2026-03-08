/**
 * OcrService.js
 * Specialized service for scoreboard recognition using Tesseract.js.
 * Optimizes images for scoreboard reading (Padel/Tennis scores).
 */
(function () {
    const OcrService = {
        worker: null,
        isInitializing: false,

        async init() {
            if (this.worker || this.isInitializing) return;
            this.isInitializing = true;
            console.log("📂 [OcrService] Initializing Tesseract worker...");
            try {
                this.worker = await Tesseract.createWorker('eng', 1, {
                    logger: m => console.log(m)
                });
                console.log("✅ [OcrService] Tesseract worker ready.");
            } catch (e) {
                console.error("❌ [OcrService] Failed to init Tesseract:", e);
            } finally {
                this.isInitializing = false;
            }
        },

        /**
         * Generic scan function for scoreboard images.
         * @param {File|String} imageSource - File object or URL
         */
        async scanScoreboard(imageSource) {
            if (!this.worker) await this.init();

            console.log("📷 [OcrService] Scanning image for scores...");

            try {
                // Focus on digits only for better accuracy on scores
                await this.worker.setParameters({
                    tessedit_char_whitelist: '0123456789- '
                });

                const { data: { text } } = await this.worker.recognize(imageSource);
                console.log("📝 [OcrService] OCR Raw Text:", text);

                // Pattern recognition: Look for pairs of numbers
                const numbers = text.match(/\d+/g);
                if (numbers && numbers.length >= 2) {
                    const scoreA = parseInt(numbers[0]);
                    const scoreB = parseInt(numbers[1]);

                    // Sanity check for paddle scores (usually don't go above 20 in a set/pro-set)
                    if (scoreA <= 40 && scoreB <= 40) {
                        return { scoreA, scoreB, success: true };
                    }
                }

                return { success: false, text: text, error: "No se detectaron puntuaciones claras." };
            } catch (e) {
                console.error("❌ [OcrService] Scan failed:", e);
                return { success: false, error: e.message };
            }
        },

        /**
         * UI Trigger for Scoreboard Capture
         */
        async captureAndScan(onSuccess) {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.capture = 'environment'; // Prefer back camera

            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                // Show a loading alert
                if (window.PremiumModal) {
                    window.PremiumModal.alert({
                        title: "📷 PROCESANDO",
                        message: "Analizando la foto del marcador... Por favor, espera."
                    });
                }

                const result = await this.scanScoreboard(file);

                if (result.success) {
                    onSuccess(result.scoreA, result.scoreB);
                    if (window.PremiumModal) {
                        window.PremiumModal.alert({
                            title: "✅ MARCADOR DETECTADO",
                            message: `Se ha detectado un marcador de ${result.scoreA} - ${result.scoreB}.`,
                            type: 'success'
                        });
                    }
                } else {
                    if (window.PremiumModal) {
                        window.PremiumModal.alert({
                            title: "⚠️ AVISO",
                            message: "No hemos podido detectar el marcador automáticamente. Por favor, introdúcelo manualmente.",
                            type: 'warning'
                        });
                    }
                }
            };

            input.click();
        }
    };

    window.OcrService = OcrService;
})();
