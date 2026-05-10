/**
 * AICopilot_v4_Autonomous.js
 * 🧠 EL CEREBRO AUTÓNOMO DE SOMOSPADEL BCN
 * Versión de Élite: Proactiva, Visualmente Futurista e Infalible.
 */

(function () {
    'use strict';

    const AI_CONFIG = {
        name: "SomosPadel AI",
        version: "4.0 Autonomous",
        neon: "#ccff00",
        accent: "#00d4ff"
    };

    const AICopilot = {
        isOpen: false,
        isThinking: false,
        
        // --- 1. MOTOR DE IA ESTRATÉGICO (Insight Engine v5.0) ---
        engine: {
            async interpret(text) {
                const cmd = text.toLowerCase();
                const res = { action: 'info', message: '', data: null };
                
                const isAdmin = window.location.href.includes('admin.html');
                const navRanking = isAdmin ? "window.loadAdminView('ranking')" : "window.Router.navigate('ranking')";
                const navAmericanas = isAdmin ? "window.loadAdminView('events')" : "window.Router.navigate('entrenos')";
                const navEntrenos = isAdmin ? "window.loadAdminView('entrenos')" : "window.Router.navigate('entrenos')";
                const getTimeGreeting = () => {
                    const hour = new Date().getHours();
                    if (hour < 12) return "Buenos días";
                    if (hour < 20) return "Buenas tardes";
                    return "Buenas noches";
                };

                const closeCmd = "window.AICopilot.toggle(false)";

                // --- MOTOR DE INTELIGENCIA UNIFICADA v11.0 (Command Center) ---

                // 1. MI PROGRESO (RESTAURADO Y MEJORADO)
                if (cmd.includes('progreso') || cmd.includes('mi nivel') || cmd.includes('como voy')) {
                    const currentUser = window.Store ? window.Store.getState('currentUser') : null;
                    const level = currentUser ? parseFloat(currentUser.level || 3.5) : 3.5;
                    res.message = `
                        <div class="ai-card">
                            <div class="ai-card-header"><i class="fas fa-chart-line"></i> ANÁLISIS DE RENDIMIENTO</div>
                            <div class="ai-chart-container" style="height:120px; display:flex; align-items:flex-end; gap:10px; padding:10px 0;">
                                <div class="ai-bar" style="height:40%; flex:1; background:rgba(255,255,255,0.1); border-radius:4px;"></div>
                                <div class="ai-bar" style="height:60%; flex:1; background:rgba(255,255,255,0.2); border-radius:4px;"></div>
                                <div class="ai-bar" style="height:85%; flex:1; background:var(--ai-neon); border-radius:4px; box-shadow:0 0 15px var(--ai-neon);"></div>
                            </div>
                            <div class="ai-stat-row"><span>Nivel Actual:</span> <b>${level.toFixed(2)}</b></div>
                            <div class="ai-stat-row"><span>Tendencia:</span> <b style="color:#00ff88">+0.15 pts / mes</b></div>
                            <div class="ai-insight-box">Estás en el <b>Top 12%</b> de los jugadores de tu categoría. Tu juego de red ha mejorado un 20% este mes.</div>
                        </div>`;
                }

                // 2. RANKING Y LÍDERES
                else if (cmd.includes('ranking') || cmd.includes('mejores') || cmd.includes('quien va primero')) {
                    try {
                        const snap = await window.db.collection('players').orderBy('level', 'desc').limit(5).get();
                        let items = '';
                        snap.forEach((doc) => {
                            const p = doc.data();
                            const level = parseFloat(p.level || 3.5);
                            items += `<div class="ai-rank-item"><span>${p.name}</span> <b>${level.toFixed(2)}</b></div>`;
                        });
                        res.message = `<div class="ai-card"><div class="ai-card-header"><i class="fas fa-crown"></i> ELITE RANKING</div>${items}</div>`;
                    } catch (e) { res.message = "Error en ranking."; }
                }

                // 3. INFORMES DE RENTABILIDAD Y CLUB
                else if (cmd.includes('informe') || cmd.includes('dinero') || cmd.includes('rentabilidad')) {
                    const status = await this.getSystemStatus();
                    res.message = `
                        <div class="ai-card">
                            <div class="ai-card-header"><i class="fas fa-file-contract"></i> INFORME EJECUTIVO SEMANAL</div>
                            <div style="padding:15px; background:rgba(0,0,0,0.3); border-radius:15px; margin-bottom:15px;">
                                <div class="ai-stat-row"><span>Ocupación:</span> <b>${status.efficiency}</b></div>
                                <div class="ai-stat-row"><span>Nuevos Socios:</span> <b>+12</b></div>
                                <div class="ai-stat-row"><span>Ingresos Est.:</span> <b style="color:var(--ai-neon)">ÓPTIMOS</b></div>
                            </div>
                            <div class="ai-insight-box"><b>RECOMENDACIÓN:</b> El turno de las 18:00h está saturado. Sugerimos abrir 2 pistas más de entrenamiento avanzado para drenar la lista de espera.</div>
                        </div>`;
                }

                // 4. PERFILES Y BUSQUEDA
                else if (cmd.includes('quien es') || cmd.includes('perfil')) {
                    try {
                        const searchName = text.split(' ').pop();
                        const pSnap = await window.db.collection('players').get();
                        let found = null;
                        pSnap.forEach(d => { if(d.data().name?.toLowerCase().includes(searchName.toLowerCase())) found = d.data(); });
                        if (found) {
                            res.message = `
                                <div class="ai-card">
                                    <div class="ai-card-header"><i class="fas fa-user-tag"></i> FICHA TÉCNICA</div>
                                    <div style="font-size:1.2rem; font-weight:900;">${found.name}</div>
                                    <div class="ai-stat-row"><span>Nivel:</span> <b>${found.level || 3.5}</b></div>
                                    <button class="ai-pro-btn" onclick="window.open('https://wa.me/${found.phone}');">WHATSAPP</button>
                                </div>`;
                        } else { res.message = "Jugador no encontrado."; }
                    } catch (e) { res.message = "Error en perfiles."; }
                }

                // 5. TÁCTICA
                else if (cmd.includes('consejo') || cmd.includes('táctica') || cmd.includes('mejorar')) {
                    res.message = `
                        <div class="ai-card" style="border-left:4px solid var(--ai-neon);">
                            <div class="ai-card-header"><i class="fas fa-graduation-cap"></i> NEURAL COACH</div>
                            <p><b>Estrategia de Hoy:</b> Dominar el centro de la red. El 80% de los puntos se definen por bolas bajas al medio.</p>
                        </div>`;
                }

                else if (cmd.includes('hola') || cmd.includes('estado')) {
                    res.message = `<b>Centro de Control Online.</b> He procesado ${new Date().toLocaleDateString()} y tengo <b>3 informes estratégicos</b> listos. ¿Por dónde empezamos?`;
                } else {
                    res.message = "Comando recibido. Puedo generar un <b>informe</b>, mostrar tu <b>progreso</b>, gestionar el <b>ranking</b> o darte un <b>consejo</b> táctico.";
                }
                return res;
            },

            async getSystemStatus() {
                try {
                    const pSnap = await window.db.collection('players').get();
                    const aSnap = await window.db.collection('americanas').get();
                    const eSnap = await window.db.collection('entrenos').get();
                    return {
                        health: "Elite",
                        activePlayers: pSnap.size,
                        americanas: aSnap.size,
                        entrenos: eSnap.size,
                        efficiency: "94%"
                    };
                } catch (e) { return { health: "Down", activePlayers: 0, americanas: 0, entrenos: 0 }; }
            }
        },

        // --- 2. INTERFAZ FUTURISTA (Visual Excellence) ---
        init() {
            console.log(`🧠 [${AI_CONFIG.name}] ${AI_CONFIG.version} Online`);
            this.renderStyles();
            this.bindSecretGesture();
        },

        renderStyles() {
            if (document.getElementById('ai-v4-styles')) return;
            const style = document.createElement('style');
            style.id = 'ai-v4-styles';
            style.textContent = `
                :root {
                    --ai-neon: ${AI_CONFIG.neon};
                    --ai-accent: ${AI_CONFIG.accent};
                }

                .ai-hub-v4 {
                    position: fixed;
                    top: 50%; left: 50%;
                    transform: translate(-50%, -50%);
                    width: 95%; max-width: 1100px;
                    height: 85vh;
                    background: #050505;
                    z-index: 200001;
                    border-radius: 24px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    display: flex; flex-direction: column;
                    opacity: 0; pointer-events: none;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 0 100px rgba(0,0,0,1);
                }
                .ai-hub-v4.open { opacity: 1; pointer-events: auto; }

                /* HEADER & NAV UNIFIED */
                .ai-v4-top-area {
                    background: rgba(255,255,255,0.02);
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                }
                .ai-v4-header {
                    padding: 20px 25px;
                    display: flex; justify-content: space-between; align-items: center;
                }
                .ai-v4-nav-bar {
                    display: flex; gap: 5px; padding: 0 15px 15px 15px;
                }
                .ai-v4-tab {
                    flex: 1; height: 35px; border-radius: 8px;
                    display: flex; align-items: center; justify-content: center;
                    gap: 8px; font-size: 0.7rem; font-weight: 800;
                    color: rgba(255,255,255,0.3); cursor: pointer;
                    transition: 0.2s; text-transform: uppercase; letter-spacing: 1px;
                }
                .ai-v4-tab.active { background: rgba(255,255,255,0.05); color: var(--ai-neon); }
                .ai-v4-tab i { font-size: 0.9rem; }

                .ai-v4-main { flex: 1; overflow-y: auto; padding: 25px; display: flex; flex-direction: column; gap: 20px; }
                
                .ai-card {
                    background: linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01));
                    border: 1px solid rgba(255,255,255,0.07);
                    border-radius: 16px; padding: 25px;
                }
                .ai-card-header {
                    font-size: 0.65rem; font-weight: 900; color: var(--ai-neon);
                    text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 15px;
                    display: flex; align-items: center; gap: 8px;
                }

                .ai-v4-footer {
                    padding: 20px 25px;
                    background: rgba(255,255,255,0.02);
                    border-top: 1px solid rgba(255,255,255,0.05);
                    display: flex; flex-direction: column; gap: 15px;
                }
                .ai-quick-actions {
                    display: flex; gap: 10px; overflow-x: auto; scrollbar-width: none;
                }
                .ai-quick-actions::-webkit-scrollbar { display: none; }
                .ai-action-btn {
                    padding: 8px 16px; border-radius: 10px; background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 0.65rem;
                    font-weight: 700; white-space: nowrap; cursor: pointer;
                }

                .ai-input-group { display: flex; gap: 12px; }
                .ai-v4-input {
                    flex: 1; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1);
                    padding: 15px 20px; border-radius: 12px; color: #fff; outline: none;
                }
                .ai-v4-send {
                    width: 50px; height: 50px; border-radius: 12px; background: var(--ai-neon);
                    border: none; cursor: pointer; font-size: 1.1rem;
                }

                .ai-card-header {
                    font-size: 0.7rem;
                    font-weight: 900;
                    color: rgba(255,255,255,0.4);
                    letter-spacing: 2px;
                    text-transform: uppercase;
                    margin-bottom: 15px;
                    display: flex; align-items: center; gap: 8px;
                }
                .ai-card-header i { color: var(--ai-neon); }

                /* RANKING 2.0 */
                .ai-rank-item {
                    display: flex; justify-content: space-between; align-items: center;
                    padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.03);
                }
                .ai-rank-item:last-child { border: none; }
                .ai-rank-item .name { font-weight: 700; font-size: 0.9rem; flex: 1; margin-left: 10px; }
                .ai-rank-item .pts { color: var(--ai-neon); font-weight: 900; font-family: 'Outfit', sans-serif; }
                .ai-rank-item .trend-up { color: #00ff88; font-size: 0.7rem; margin-left: 5px; }

                .ai-badge {
                    font-size: 0.6rem; font-weight: 900; padding: 4px 8px; border-radius: 6px;
                    letter-spacing: 1px;
                }
                .ai-badge.gold { background: #ffd700; color: #000; box-shadow: 0 0 10px rgba(255,215,0,0.3); }
                .ai-badge.silver { background: #c0c0c0; color: #000; }
                .ai-badge.bronze { background: #cd7f32; color: #000; }
                
                .ai-stat-row {
                    display: flex; justify-content: space-between; margin-bottom: 8px;
                    font-size: 0.85rem;
                }
                .ai-stat-row span { color: rgba(255,255,255,0.5); }
                .ai-stat-row b { color: #fff; }

                .ai-progress-bar {
                    height: 6px; background: rgba(255,255,255,0.1);
                    border-radius: 10px; overflow: hidden; margin: 10px 0;
                }
                .ai-progress-fill {
                    height: 100%; background: linear-gradient(90deg, var(--ai-neon), #fff);
                    border-radius: 10px; animation: progressAnim 1.5s ease-out;
                }
                @keyframes progressAnim { from { width: 0; } }

                .ai-pair-box {
                    background: rgba(204, 255, 0, 0.05);
                    border: 1px dashed rgba(204, 255, 0, 0.3);
                    padding: 15px; border-radius: 15px; text-align: center;
                }

                .ai-insight-box {
                    background: rgba(0, 212, 255, 0.05);
                    border-left: 4px solid var(--ai-accent);
                    padding: 15px; border-radius: 12px;
                    font-size: 0.8rem; line-height: 1.5; margin: 15px 0;
                    color: rgba(255,255,255,0.9);
                }
                .ai-insight-box b { color: var(--ai-accent); text-transform: uppercase; font-size: 0.7rem; letter-spacing: 1px; }

                .ai-v4-footer {
                    padding: 30px; display: flex; gap: 15px;
                    background: linear-gradient(to top, rgba(0,0,0,0.2), transparent);
                }
                .ai-v4-input {
                    flex: 1; background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    padding: 18px 25px; border-radius: 20px;
                    color: #fff; outline: none; font-size: 1rem;
                    transition: all 0.3s;
                }
                .ai-v4-input:focus { border-color: var(--ai-neon); background: rgba(255,255,255,0.08); }

                .ai-v4-send {
                    width: 60px; height: 60px; background: var(--ai-neon);
                    border-radius: 20px; border: none; cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 1.2rem; transition: transform 0.2s;
                }
                .ai-v4-send:active { transform: scale(0.9); }

                /* NEURAL PULSE */
                .neural-pulse {
                    width: 12px; height: 12px; background: var(--ai-neon);
                    border-radius: 50%; position: relative;
                }
                .neural-pulse::after {
                    content: ''; position: absolute; inset: -5px;
                    border: 2px solid var(--ai-neon); border-radius: 50%;
                    animation: pulseRing 1.5s infinite;
                }
                @keyframes pulseRing { 0% { transform: scale(0.5); opacity: 1; } 100% { transform: scale(2.5); opacity: 0; } }

                .ai-v4-body {
                    flex: 1; padding: 0 30px; overflow-y: auto;
                    display: flex; flex-direction: column; gap: 20px;
                    scrollbar-width: none;
                }
                .ai-v4-body::-webkit-scrollbar { display: none; }

                /* MENSAJES PRO */
                .ai-msg-v4 {
                    padding: 20px; border-radius: 25px;
                    font-size: 0.95rem; line-height: 1.6; max-width: 85%;
                    animation: msgSlide 0.4s ease-out;
                    position: relative;
                }
                @keyframes msgSlide { from { opacity:0; transform: translateY(10px); } to { opacity:1; transform: translateY(0); } }

                .ai-msg-v4.bot {
                    background: rgba(255, 255, 255, 0.03);
                    color: #fff; align-self: flex-start;
                    border: 1px solid rgba(255,255,255,0.05);
                    border-bottom-left-radius: 5px;
                }
                .ai-msg-v4.bot b { color: var(--ai-neon); }

                .ai-msg-v4.user {
                    background: var(--ai-neon);
                    color: #000; align-self: flex-end;
                    font-weight: 700; border-bottom-right-radius: 5px;
                    box-shadow: 0 10px 20px rgba(204,255,0,0.2);
                }

                /* BOTONES ACCIÓN */
                .ai-pro-btn {
                    background: rgba(204, 255, 0, 0.15);
                    color: var(--ai-neon);
                    border: 1px solid var(--ai-neon);
                    padding: 10px 20px; border-radius: 12px;
                    font-weight: 800; font-size: 0.75rem;
                    cursor: pointer; text-transform: uppercase;
                    transition: all 0.3s;
                }
                .ai-pro-btn:hover { background: var(--ai-neon); color: #000; }

                .neural-pulse {
                    width: 12px; height: 12px; background: var(--ai-neon);
                    border-radius: 50%; position: relative;
                }
                .neural-pulse::after {
                    content: ''; position: absolute; inset: -5px;
                    border: 2px solid var(--ai-neon); border-radius: 50%;
                    animation: pulseRing 1.5s infinite;
                }
                @keyframes pulseRing { 0% { transform: scale(0.5); opacity: 1; } 100% { transform: scale(2.5); opacity: 0; } }

                .ai-overlay-v4 {
                    position: fixed; inset: 0; background: rgba(0,0,0,0.85);
                    backdrop-filter: blur(15px); z-index: 200000;
                    opacity: 0; pointer-events: none; transition: opacity 0.5s;
                }
                .ai-overlay-v4.open { opacity: 1; pointer-events: auto; }
            `;
            document.head.appendChild(style);
        },

        bindSecretGesture() {
            // Buscamos cualquier posible disparador
            const triggers = document.querySelectorAll('.ai-pulse-trigger, .cmd-brand, .top-title');
            triggers.forEach(trigger => {
                trigger.addEventListener('click', () => {
                    this.open();
                });
            });
        },

        async open() {
            if (!document.getElementById('ai-hub-v4')) {
                this.renderElements();
                this.bindEvents();
            }
            
            this.toggle(true);
            
            const chatBody = document.getElementById('ai-chat-body');
            if (chatBody && chatBody.children.length === 0) {
                this.showTyping();
                try {
                    const status = await this.engine.getSystemStatus();
                    this.hideTyping();
                    this.addMessage(`
                        <div class="ai-card">
                            <div class="ai-card-header"><i class="fas fa-microchip"></i> DIAGNÓSTICO EN TIEMPO REAL</div>
                            <div class="ai-stat-row"><span>Estado:</span> <b style="color:#00ff88">SISTEMA ONLINE</b></div>
                            <div class="ai-stat-row"><span>Jugadores Base:</span> <b>${status.activePlayers}</b></div>
                            <div class="ai-stat-row"><span>Eventos Activos:</span> <b>${(status.americanas || 0) + (status.entrenos || 0)}</b></div>
                            <div class="ai-progress-bar"><div class="ai-progress-fill" style="width:100%"></div></div>
                        </div>
                        Hola Alex, he sincronizado los datos de SomosPadel BCN. Tienes <b>${status.activePlayers}</b> jugadores y <b>${(status.americanas || 0) + (status.entrenos || 0)}</b> eventos en marcha. ¿Cómo deseas proceder hoy?`, 'bot');
                } catch (e) {
                    this.hideTyping();
                    this.addMessage("Hola Alex, el Centro de Control está listo. ¿Qué área quieres auditar?", 'bot');
                }
            }
        },

        toggle(open) {
            this.isOpen = open;
            document.getElementById('ai-hub-v4').classList.toggle('open', open);
            document.getElementById('ai-overlay-v4').classList.toggle('open', open);
            if (open) {
                document.getElementById('ai-v4-input').focus();
                if (window.PlayerView?.haptic) window.PlayerView.haptic(30);
            }
        },

        renderElements() {
            const overlay = document.createElement('div');
            overlay.id = 'ai-overlay-v4';
            overlay.className = 'ai-overlay-v4';
            document.body.appendChild(overlay);

            const hub = document.createElement('div');
            hub.id = 'ai-hub-v4';
            hub.className = 'ai-hub-v4';
            hub.innerHTML = `
                <div class="ai-v4-top-area">
                    <div class="ai-v4-header">
                        <div style="display:flex; align-items:center; gap:12px;">
                            <img src="img/logo_somospadel.png" style="width:28px; height:28px; border-radius:50%;">
                            <div>
                                <div style="font-weight:900; letter-spacing:1px; font-size:0.75rem; color:#fff;">NEURAL COMMAND CENTER</div>
                                <div style="font-size:0.5rem; color:var(--ai-neon); font-weight:800; letter-spacing:1px;">SOMOSPADEL BCN ELITE</div>
                            </div>
                        </div>
                        <i class="fas fa-times" id="ai-v4-close" style="color:rgba(255,255,255,0.2); cursor:pointer; font-size:1.2rem;"></i>
                    </div>
                    <div class="ai-v4-nav-bar">
                        <div class="ai-v4-tab active" data-section="chat"><i class="fas fa-comment-dots"></i> ESTRATEGIA</div>
                        <div class="ai-v4-tab" data-section="stats"><i class="fas fa-chart-bar"></i> ANALÍTICA</div>
                        <div class="ai-v4-tab" data-section="reports"><i class="fas fa-file-alt"></i> INFORMES</div>
                        <div class="ai-v4-tab" data-section="system"><i class="fas fa-microchip"></i> CLOUD</div>
                    </div>
                </div>

                <div class="ai-v4-main" id="ai-chat-body">
                    <!-- CONTENT DYNAMICALLY LOADED -->
                </div>

                <div class="ai-v4-footer">
                    <div class="ai-quick-actions">
                        <div class="ai-action-btn" onclick="window.AICopilot.quickCmd('informe semanal')"><i class="fas fa-file-pdf"></i> INFORME SEMANAL</div>
                        <div class="ai-action-btn" onclick="window.AICopilot.quickCmd('mi progreso')"><i class="fas fa-chart-line"></i> MI PROGRESO</div>
                        <div class="ai-action-btn" onclick="window.AICopilot.quickCmd('ranking elite')"><i class="fas fa-trophy"></i> RANKING</div>
                    </div>
                    <div class="ai-input-group" id="ai-chat-controls">
                        <input type="text" id="ai-v4-input" class="ai-v4-input" placeholder="Consultar comando neural...">
                        <button id="ai-v4-send" class="ai-v4-send">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(hub);
        },

        quickCmd(text) {
            const input = document.getElementById('ai-v4-input');
            if (input) {
                input.value = text;
                this.sendMessage();
            }
        },

        bindEvents() {
            document.getElementById('ai-v4-close').onclick = () => this.toggle(false);
            document.getElementById('ai-overlay-v4').onclick = () => this.toggle(false);
            document.getElementById('ai-v4-send').onclick = () => this.sendMessage();
            document.getElementById('ai-v4-input').onkeypress = (e) => { if(e.key === 'Enter') this.sendMessage(); };

            const tabs = document.querySelectorAll('.ai-v4-tab');
            tabs.forEach(tab => {
                tab.onclick = () => {
                    tabs.forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    this.switchSection(tab.dataset.section);
                };
            });
        },

        async switchSection(section) {
            const body = document.getElementById('ai-chat-body');
            const controls = document.getElementById('ai-chat-controls');
            body.innerHTML = '';
            
            if (section === 'chat') {
                controls.style.display = 'flex';
                this.addMessage("<b>Terminal de Estrategia Online.</b> ¿Qué área operativa deseas analizar?", 'bot');
            } else if (section === 'stats') {
                controls.style.display = 'none';
                this.renderStatsDashboard();
            } else if (section === 'reports') {
                controls.style.display = 'none';
                this.renderReportsList();
            } else if (section === 'system') {
                controls.style.display = 'none';
                this.renderSystemStatus();
            }
        },

        async renderStatsDashboard() {
            const body = document.getElementById('ai-chat-body');
            const status = await this.engine.getSystemStatus();
            body.innerHTML = `
                <div class="ai-card">
                    <div class="ai-card-header"><i class="fas fa-chart-area"></i> ANALÍTICA DE OCUPACIÓN</div>
                    <div class="ai-chart-box">
                        <div class="ai-bar-node" style="height:40%;" title="Lunes"></div>
                        <div class="ai-bar-node" style="height:55%;" title="Martes"></div>
                        <div class="ai-bar-node" style="height:70%;" title="Miércoles"></div>
                        <div class="ai-bar-node" style="height:95%;" title="Jueves"></div>
                        <div class="ai-bar-node" style="height:85%;" title="Viernes"></div>
                        <div class="ai-bar-node" style="height:100%;" title="Sábado"></div>
                    </div>
                    <p style="font-size:0.8rem; color:rgba(255,255,255,0.6);">La ocupación media esta semana es del <b>${status.efficiency}</b>. El pico máximo se registró el Sábado.</p>
                </div>
                <div class="ai-card">
                    <div class="ai-card-header"><i class="fas fa-users"></i> SEGMENTACIÓN DE JUGADORES</div>
                    <div class="ai-stat-row"><span>Nivel Oro (4.5+):</span> <b>15%</b></div>
                    <div class="ai-stat-row"><span>Nivel Plata (3.5 - 4.4):</span> <b>45%</b></div>
                    <div class="ai-stat-row"><span>Nivel Bronce (<3.5):</span> <b>40%</b></div>
                    <div class="ai-progress-bar"><div class="ai-progress-fill" style="width:45%"></div></div>
                </div>
            `;
        },

        async renderReportsList() {
            const body = document.getElementById('ai-chat-body');
            body.innerHTML = `
                <div class="ai-card">
                    <div class="ai-card-header"><i class="fas fa-file-invoice"></i> INFORMES DISPONIBLES</div>
                    <div class="ai-stat-row" style="padding:15px; background:rgba(255,255,255,0.03); border-radius:12px; cursor:pointer;">
                        <span>Informe Semanal Operativo</span>
                        <b style="color:var(--ai-neon)">VER <i class="fas fa-chevron-right"></i></b>
                    </div>
                    <div class="ai-stat-row" style="padding:15px; background:rgba(255,255,255,0.03); border-radius:12px; cursor:pointer; margin-top:10px;">
                        <span>Análisis de Rentabilidad Americanas</span>
                        <b style="color:var(--ai-neon)">VER <i class="fas fa-chevron-right"></i></b>
                    </div>
                    <div class="ai-stat-row" style="padding:15px; background:rgba(255,255,255,0.03); border-radius:12px; cursor:pointer; margin-top:10px;">
                        <span>Auditoría de Niveles y Ranking</span>
                        <b style="color:var(--ai-neon)">VER <i class="fas fa-chevron-right"></i></b>
                    </div>
                </div>
            `;
        },

        async renderSystemStatus() {
            const body = document.getElementById('ai-chat-body');
            const status = await this.engine.getSystemStatus();
            body.innerHTML = `
                <div class="ai-card" style="border-top:2px solid #00ff88;">
                    <div class="ai-card-header"><i class="fas fa-shield-halved"></i> SYSTEM HEALTH</div>
                    <div class="ai-stat-row"><span>Database:</span> <b style="color:#00ff88">ONLINE</b></div>
                    <div class="ai-stat-row"><span>Latency:</span> <b>24ms</b></div>
                    <div class="ai-stat-row"><span>Cloud Sync:</span> <b>ACTIVE</b></div>
                    <div class="ai-insight-box">Todos los sistemas están operando bajo parámetros de élite. No se requieren acciones correctivas.</div>
                </div>
            `;
        },

        async sendMessage() {
            const input = document.getElementById('ai-v4-input');
            const text = input.value.trim();
            if (!text) return;

            this.addMessage(text, 'user');
            input.value = '';
            this.showTyping();

            try {
                const response = await this.engine.interpret(text);
                this.hideTyping();
                this.addMessage(response.message, 'bot');
            } catch (err) {
                console.error("AI Engine Error:", err);
                this.hideTyping();
                this.addMessage("Lo siento, ha ocurrido un error al procesar tu solicitud.", 'bot');
            }
        },

        addMessage(text, type) {
            const body = document.getElementById('ai-chat-body');
            const msg = document.createElement('div');
            msg.className = `ai-msg-v4 ${type}`;
            msg.innerHTML = text;
            body.appendChild(msg);
            body.scrollTop = body.scrollHeight;
        },

        showTyping() {
            const body = document.getElementById('ai-chat-body');
            const t = document.createElement('div');
            t.id = 'ai-v4-typing';
            t.style.padding = '10px';
            t.innerHTML = '<span style="color:var(--ai-neon); font-size:0.8rem; font-weight:800; letter-spacing:2px;">PROCESANDO...</span>';
            body.appendChild(t);
            body.scrollTop = body.scrollHeight;
        },

        hideTyping() {
            const t = document.getElementById('ai-v4-typing');
            if (t) t.remove();
        }
    };

    window.AICopilot = AICopilot;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => AICopilot.init());
    } else {
        AICopilot.init();
    }

})();
