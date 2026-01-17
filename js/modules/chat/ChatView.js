/**
 * ChatView.js
 * "Ops Room" UI - The Tactical Communication Interface.
 */
(function () {
    class ChatView {
        constructor() {
            this.eventId = null;
            this.isVisible = false;
            this.sosUnsubscribe = null;
        }

        init(eventId, eventName) {
            this.eventId = eventId;
            this.eventName = eventName;
            this.render();
            this.startListeners();
            this.show();
        }

        render() {
            // Remove existing if any
            const existing = document.getElementById('ops-room-drawer');
            if (existing) existing.remove();

            const html = `
                <div id="ops-room-drawer" class="ops-drawer open">
                    <div class="ops-header" onclick="window.ChatView.toggle()">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <div class="ops-led"></div>
                            <div>
                                <h3 style="margin:0; font-size:1rem; font-weight:800; color:white; letter-spacing:1px;">CHAT DEL EVENTO</h3>
                                <div style="font-size:0.7rem; color:#888;">${this.eventName || 'Canal Táctico'}</div>
                            </div>
                        </div>
                        <div style="display:flex; gap:15px; align-items:center;">
                            <!-- SOS TOGGLE -->
                            <div id="sos-toggle-btn" class="sos-btn" onclick="event.stopPropagation(); window.ChatView.handleSOS()">
                                <i class="fas fa-life-ring"></i> SOS
                            </div>
                            <!-- Minimizar Icon matches state -->
                            <i id="ops-toggle-icon" class="fas fa-chevron-down" style="color:white; font-size:1.2rem; cursor:pointer;"></i>
                        </div>
                    </div>

                    <!-- SOS BAR -->
                    <div id="sos-active-bar" class="sos-bar hidden">
                        <i class="fas fa-exclamation-triangle"></i> JUGADORES BUSCANDO PAREJA: <span id="sos-count">0</span>
                    </div>

                    <div id="ops-messages-area" class="ops-messages">
                        <div style="text-align:center; color:#444; margin-top:50px;">
                            <i class="fas fa-satellite-dish fa-spin"></i><br>Estableciendo enlace seguro...
                        </div>
                    </div>

                    <div class="ops-input-area">
                        <input type="text" id="ops-input" placeholder="Enviar mensaje al grupo..." autocomplete="off">
                        <button onclick="window.ChatView.sendMessage()" id="ops-send-btn">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </div>

                <style>
                    .ops-drawer {
                        position: fixed;
                        bottom: 0;
                        left: 0;
                        width: 100%;
                        height: 85vh;
                        background: #0f172a;
                        z-index: 999999;
                        border-top-left-radius: 25px;
                        border-top-right-radius: 25px;
                        box-shadow: 0 -10px 50px rgba(0,0,0,0.5);
                        display: flex;
                        flex-direction: column;
                        transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                        /* Default: Minimized/Docked */
                        transform: translateY(calc(100% - 70px)); 
                    }
                    
                    /* Expanded State */
                    .ops-drawer.expanded { 
                        transform: translateY(0); 
                    }
                    
                    .ops-header {
                        padding: 15px 25px;
                        height: 70px; /* Fixed height for dock calculation */
                        box-sizing: border-box;
                        background: #020617;
                        border-top-left-radius: 25px;
                        border-top-right-radius: 25px;
                        border-bottom: 1px solid #1e293b;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        cursor: pointer; /* Clickable to expand */
                    }
                    
                    /* ... (Rest of styles same) ... */
                    .ops-led {
                        width: 10px;
                        height: 10px;
                        background: #10b981;
                        border-radius: 50%;
                        box-shadow: 0 0 10px #10b981;
                        animation: blink-led 2s infinite;
                    }
                    @keyframes blink-led { 0% {opacity:1;} 50% {opacity:0.3;} 100% {opacity:1;} }

                    .sos-btn {
                        background: rgba(239, 68, 68, 0.1);
                        color: #ef4444;
                        border: 1px solid #ef4444;
                        padding: 5px 12px;
                        border-radius: 20px;
                        font-size: 0.7rem;
                        font-weight: 800;
                        cursor: pointer;
                        transition: all 0.2s;
                    }
                    .sos-btn.active {
                        background: #ef4444;
                        color: white;
                        box-shadow: 0 0 15px rgba(239, 68, 68, 0.5);
                    }

                    .sos-bar {
                        background: #ef4444;
                        color: white;
                        padding: 8px;
                        text-align: center;
                        font-size: 0.7rem;
                        font-weight: 800;
                        animation: slideDown 0.3s;
                    }

                    .ops-messages {
                        flex: 1;
                        overflow-y: auto;
                        padding: 20px;
                        display: flex;
                        flex-direction: column;
                        gap: 15px;
                        background-image: radial-gradient(#1e293b 1px, transparent 1px);
                        background-size: 20px 20px;
                    }

                    .msg-bubble {
                        max-width: 80%;
                        padding: 10px 15px;
                        border-radius: 15px;
                        font-size: 0.9rem;
                        position: relative;
                        line-height: 1.4;
                    }
                    .msg-self {
                        align-self: flex-end;
                        background: #3b82f6;
                        color: white;
                        border-bottom-right-radius: 2px;
                    }
                    .msg-other {
                        align-self: flex-start;
                        background: #1e293b;
                        color: #e2e8f0;
                        border-bottom-left-radius: 2px;
                        border: 1px solid #334155;
                    }
                    .msg-admin {
                        align-self: center;
                        background: rgba(204, 255, 0, 0.1);
                        border: 1px solid #CCFF00;
                        color: #CCFF00;
                        text-align: center;
                        width: 90%;
                        font-weight: 600;
                        box-shadow: 0 0 15px rgba(204, 255, 0, 0.1);
                    }
                    
                    .msg-meta {
                        font-size: 0.65rem;
                        margin-bottom: 3px;
                        opacity: 0.7;
                        display: flex;
                        align-items: center;
                        gap: 5px;
                    }

                    .ops-input-area {
                        padding: 15px 20px; /* Reduced padding for mobile keyboard */
                        padding-bottom: 30px; /* Safe area */
                        background: #020617;
                        border-top: 1px solid #1e293b;
                        display: flex;
                        gap: 10px;
                    }
                    
                    #ops-input {
                        flex: 1;
                        background: #1e293b;
                        border: none;
                        padding: 12px 20px;
                        border-radius: 25px;
                        color: white;
                        font-family: 'Outfit';
                        outline: none;
                    }
                    #ops-input:focus {
                        box-shadow: 0 0 0 2px #3b82f6;
                    }
                    
                    #ops-send-btn {
                        background: #CCFF00;
                        color: black;
                        width: 45px;
                        height: 45px;
                        border-radius: 50%;
                        border: none;
                        font-size: 1.2rem;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: transform 0.1s;
                    }
                    #ops-send-btn:active { transform: scale(0.9); }
                </style>
            `;

            document.body.insertAdjacentHTML('beforeend', html);

            // Handle Input Enter Key
            document.getElementById('ops-input').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.sendMessage();
            });
        }

        show() {
            // Start expanded
            setTimeout(() => {
                const el = document.getElementById('ops-room-drawer');
                if (el) el.classList.add('expanded'); // Start open
                this.updateIconState();
            }, 50);
            this.isVisible = true;
        }

        toggle() {
            const el = document.getElementById('ops-room-drawer');
            if (el) {
                el.classList.toggle('expanded');
                this.updateIconState();
            }
        }

        updateIconState() {
            const el = document.getElementById('ops-room-drawer');
            const icon = document.getElementById('ops-toggle-icon');
            if (el && icon) {
                const isExpanded = el.classList.contains('expanded');
                icon.className = isExpanded ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
            }
        }

        hide() {
            // Fully remove? Or just minimize?
            // "Closing" usually means destroying or minimizing. 
            // For now, let's just force minimize.
            const el = document.getElementById('ops-room-drawer');
            if (el) {
                el.classList.remove('expanded');
                this.updateIconState();
            }
        }

        startListeners() {
            // Messages Listener
            window.ChatService.subscribe(this.eventId, (messages) => {
                this.renderMessages(messages);
            });

            // SOS Listener
            this.sosUnsubscribe = window.ChatService.subscribeSOS(this.eventId, (signals) => {
                this.updateSOSView(signals);
            });
        }

        updateSOSView(signals) {
            const bar = document.getElementById('sos-active-bar');
            const count = document.getElementById('sos-count');
            const btn = document.getElementById('sos-toggle-btn');
            const user = window.Store.getState('currentUser');
            const uid = user ? (user.id || user.uid) : null;

            if (signals && signals.length > 0) {
                bar.classList.remove('hidden');
                count.innerText = signals.length;
            } else {
                bar.classList.add('hidden');
            }

            // Check if I am active
            const amIActive = signals.some(s => s.uid === uid);
            if (amIActive) {
                btn.classList.add('active');
                btn.innerHTML = '<i class="fas fa-check"></i> ESPERANDO';
            } else {
                btn.classList.remove('active');
                btn.innerHTML = '<i class="fas fa-life-ring"></i> SOS';
            }
        }

        renderMessages(messages) {
            const container = document.getElementById('ops-messages-area');
            const user = window.Store.getState('currentUser');
            const myId = user ? (user.id || user.uid) : null;

            if (messages.length === 0) {
                container.innerHTML = `
                    <div style="text-align:center; color:#444; margin-top:50px;">
                        <i class="fas fa-comment-slash" style="font-size:2rem; opacity:0.3;"></i><br>
                        <span style="font-size:0.9rem;">Sala operativa lista.<br>Sin mensajes.</span>
                    </div>
                `;
                return;
            }

            container.innerHTML = messages.map(msg => {
                const isMe = msg.senderId === myId;
                const isAdmin = msg.type === 'admin';
                let contentClass = isMe ? 'msg-self' : 'msg-other';
                if (isAdmin) contentClass = 'msg-admin';

                return `
                    <div class="msg-bubble ${contentClass} fade-in">
                        ${!isMe ? `<div class="msg-meta">${isAdmin ? '🛡️ COMANDO' : msg.senderName}</div>` : ''}
                        ${msg.text}
                    </div>
                `;
            }).join('');

            // Scroll to bottom
            container.scrollTop = container.scrollHeight;
        }

        async sendMessage() {
            const input = document.getElementById('ops-input');
            const text = input.value.trim();
            if (!text) return;

            input.value = ''; // Optimistic clear
            await window.ChatService.sendMessage(this.eventId, text);
        }

        async handleSOS() {
            const btn = document.getElementById('sos-toggle-btn');
            const isActive = btn.classList.contains('active');

            // Toggle UI optimistically but logic handles real state via listener
            await window.ChatService.toggleSOS(this.eventId, !isActive);
        }
    }

    window.ChatView = new ChatView();
    console.log("📟 Chat View Module Loaded");
})();
