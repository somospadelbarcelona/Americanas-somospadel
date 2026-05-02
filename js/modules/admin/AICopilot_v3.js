/**
 * ai-copilot.js
 * 🤖 INTERFAZ DEL COPILOTO IA - v2.0 REBORN
 * Robust connection, fixed interactions and strategic positioning.
 */

(function () {
    'use strict';

    const AICopilot = {
        isOpen: false,

        init() {
            console.log("👻 [AICopilot] Ghost Mode Active. Waiting for secret gesture...");
            this.renderStyles();
            // renderElements ya no se llama aquí, se llama al abrir
            this.bindSecretGesture();
        },

        bindSecretGesture() {
            // Buscamos el logo (index) o el título (admin)
            const trigger = document.querySelector('.cmd-brand') || document.querySelector('.top-title');
            if (!trigger) {
                console.warn("⚠️ AICopilot: Trigger element not found for gesture.");
                return;
            }

            let tapCount = 0;
            let lastTap = 0;

            trigger.addEventListener('click', (e) => {
                const now = Date.now();
                if (now - lastTap < 400) {
                    tapCount++;
                } else {
                    tapCount = 1;
                }
                lastTap = now;

                if (tapCount === 3) {
                    console.log("🔑 [AICopilot] Secret Gesture Detected!");
                    this.open();
                    tapCount = 0;
                }
            });
            
            // Eliminamos el cursor pointer para que parezca un elemento estático
            trigger.style.cursor = 'default';
        },

        renderStyles() {
            if (document.getElementById('ai-copilot-styles')) return;
            const style = document.createElement('style');
            style.id = 'ai-copilot-styles';
            style.textContent = `
                :root {
                    --ai-neon: #ccff00;
                    --ai-bg: #000000;
                    --ai-glass: rgba(255, 255, 255, 0.95);
                }

                /* POSICIÓN ESTRATÉGICA: Centro-Derecha (Tipo pestaña inteligente) */
                .ai-trigger-pill {
                    position: fixed;
                    right: -10px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: var(--ai-bg);
                    color: var(--ai-neon);
                    padding: 12px 20px 12px 15px;
                    border-radius: 30px 0 0 30px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    cursor: pointer;
                    z-index: 100000;
                    box-shadow: -5px 0 20px rgba(0,0,0,0.3);
                    border: 1px solid rgba(204, 255, 0, 0.3);
                    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                .ai-trigger-pill:hover { right: 0; background: #111; }
                .ai-trigger-pill i { font-size: 1.2rem; animation: aiPulse 2s infinite; }
                .ai-trigger-pill span { font-size: 0.7rem; font-weight: 900; letter-spacing: 1px; }

                @keyframes aiPulse {
                    0% { transform: scale(1); text-shadow: 0 0 0px var(--ai-neon); }
                    50% { transform: scale(1.2); text-shadow: 0 0 10px var(--ai-neon); }
                    100% { transform: scale(1); text-shadow: 0 0 0px var(--ai-neon); }
                }

                /* CONSOLA FLOTANTE (SPOTLIGHT STYLE) */
                .ai-console-v2 {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -40%) scale(0.9);
                    width: 90%;
                    max-width: 450px;
                    height: 60vh;
                    background: rgba(0, 0, 0, 0.85);
                    backdrop-filter: blur(25px) saturate(180%);
                    -webkit-backdrop-filter: blur(25px) saturate(180%);
                    z-index: 100001;
                    box-shadow: 0 30px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1);
                    display: flex;
                    flex-direction: column;
                    border-radius: 28px;
                    opacity: 0;
                    pointer-events: none;
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                .ai-console-v2.open { 
                    opacity: 1; 
                    pointer-events: auto; 
                    transform: translate(-50%, -50%) scale(1);
                }

                .ai-header-v2 {
                    padding: 20px 25px;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .ai-chat-area {
                    flex: 1;
                    padding: 20px;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                    scrollbar-width: none;
                }
                .ai-chat-area::-webkit-scrollbar { display: none; }

                .msg-v2 {
                    padding: 12px 16px;
                    border-radius: 20px;
                    font-size: 0.85rem;
                    max-width: 85%;
                    line-height: 1.5;
                }
                .msg-v2.bot { 
                    background: rgba(204, 255, 0, 0.1); 
                    color: var(--ai-neon); 
                    align-self: flex-start; 
                    border: 1px solid rgba(204, 255, 0, 0.2);
                    border-bottom-left-radius: 4px;
                }
                .msg-v2.user { 
                    background: rgba(255, 255, 255, 0.1); 
                    color: #fff; 
                    align-self: flex-end; 
                    border-bottom-right-radius: 4px;
                    border: 1px solid rgba(255,255,255,0.1);
                }

                .ai-footer-v2 {
                    padding: 15px 20px 25px 20px;
                    background: transparent;
                    display: flex;
                    gap: 10px;
                }
                .ai-input-v2 {
                    flex: 1;
                    padding: 14px 20px;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 18px;
                    outline: none;
                    color: white;
                    font-family: inherit;
                    font-size: 0.9rem;
                }
                .ai-send-v2 {
                    width: 48px;
                    height: 48px;
                    background: var(--ai-neon);
                    color: #000;
                    border: none;
                    border-radius: 18px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: transform 0.2s;
                }
                .ai-send-v2:active { transform: scale(0.9); }

                /* OVERLAY MÁS OSCURO */
                .ai-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.7);
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                    z-index: 100000;
                    opacity: 0;
                    pointer-events: none;
                    transition: opacity 0.4s ease;
                }
                .ai-overlay.open { opacity: 1; pointer-events: auto; }

                @media (max-width: 600px) {
                    .ai-console-v2 { width: 100%; }
                }
            `;
            document.head.appendChild(style);
        },

        renderElements() {
            // Trigger Pill ELIMINADO (El usuario quiere lanzarlo desde un menú)
            
            // Overlay
            const overlay = document.createElement('div');
            overlay.id = 'ai-overlay';
            overlay.className = 'ai-overlay';
            document.body.appendChild(overlay);

            // Console
            const consoleDiv = document.createElement('div');
            consoleDiv.id = 'ai-console-v2';
            consoleDiv.className = 'ai-console-v2';
            consoleDiv.innerHTML = `
                <div class="ai-header-v2">
                    <div style="display:flex; align-items:center; gap:12px;">
                        <i class="fas fa-robot" style="color:var(--ai-neon)"></i>
                        <span style="font-weight:900; letter-spacing:1px; font-size:0.9rem;">SOMOSPADEL IA</span>
                    </div>
                    <i class="fas fa-times" id="ai-close" style="cursor:pointer; font-size:1.2rem;"></i>
                </div>
                <div class="ai-chat-area" id="ai-chat-body">
                    <div class="msg-v2 bot">
                        <b>¡Hola! 👋</b> Soy el Copiloto Inteligente de SomosPadel BCN. 
                        <br><br>
                        ¿En qué puedo ayudarte hoy?<br>
                        Prueba a decirme: <i>"Ver ranking"</i> o <i>"Crea americana de 12 personas"</i>.
                    </div>
                </div>
                <div class="ai-footer-v2">
                    <input type="text" id="ai-input" class="ai-input-v2" placeholder="Escribe un comando...">
                    <button id="ai-send" class="ai-send-v2">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            `;
            document.body.appendChild(consoleDiv);
        },

        bindEvents() {
            const close = document.getElementById('ai-close');
            const overlay = document.getElementById('ai-overlay');
            const sendBtn = document.getElementById('ai-send');
            const input = document.getElementById('ai-input');

            if (close) close.addEventListener('click', () => this.toggle(false));
            if (overlay) overlay.addEventListener('click', () => this.toggle(false));

            if (sendBtn) sendBtn.addEventListener('click', () => this.sendMessage());
            if (input) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') this.sendMessage();
                });
            }
        },

        open() {
            if (!document.getElementById('ai-console-v2')) {
                this.renderElements();
                this.bindEvents();
            }
            this.toggle(true);
        },

        toggle(open) {
            this.isOpen = open;
            const consoleEl = document.getElementById('ai-console-v2');
            const overlayEl = document.getElementById('ai-overlay');
            if (consoleEl) consoleEl.classList.toggle('open', open);
            if (overlayEl) overlayEl.classList.toggle('open', open);
            if (open) {
                const inputEl = document.getElementById('ai-input');
                if (inputEl) inputEl.focus();
                if (window.PlayerView?.haptic) window.PlayerView.haptic(20);
            }
        },

        sendMessage() {
            const input = document.getElementById('ai-input');
            const text = input.value.trim();
            if (!text) return;

            this.addMessage(text, 'user');
            input.value = '';

            this.showTyping();

            // Safety delay for "thinking" feel
            setTimeout(() => {
                this.hideTyping();
                
                if (window.AIEngine && typeof window.AIEngine.interpretCommand === 'function') {
                    const response = window.AIEngine.interpretCommand(text);
                    this.addMessage(response.message || "Entendido. Procesando solicitud...", 'bot');
                } else {
                    console.error("❌ AIEngine not found or interpretCommand is not a function");
                    this.addMessage("Lo siento, estoy teniendo problemas para conectar con mi procesador central. Por favor, intenta de nuevo en unos segundos.", 'bot');
                }
            }, 1000);
        },

        addMessage(text, type) {
            const body = document.getElementById('ai-chat-body');
            const msg = document.createElement('div');
            msg.className = `msg-v2 ${type}`;
            msg.innerHTML = text;
            body.appendChild(msg);
            body.scrollTop = body.scrollHeight;
        },

        showTyping() {
            const body = document.getElementById('ai-chat-body');
            const typing = document.createElement('div');
            typing.id = 'ai-typing-v2';
            typing.className = 'typing-v2';
            typing.innerHTML = '<div class="dot-v2"></div><div class="dot-v2"></div><div class="dot-v2"></div>';
            body.appendChild(typing);
            body.scrollTop = body.scrollHeight;
        },

        hideTyping() {
            const t = document.getElementById('ai-typing-v2');
            if (t) t.remove();
        }
    };

    window.AICopilot = AICopilot;

    // Robust Initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => AICopilot.init());
    } else {
        AICopilot.init();
    }

})();
