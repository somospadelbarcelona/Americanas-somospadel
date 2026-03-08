/**
 * BatSignalAgent.js
 * "Batseñal 2.0" 🦇🤖 - Agente Conversacional Proactivo
 * El sistema ahora no espera a que el admin actúe, sino que analiza y propone.
 */
class BatSignalAgent {
    constructor() {
        this.isScanning = false;
        this.suggestions = [];
        this.isVisible = false;
    }

    /**
     * Inicializa el agente proactivo.
     */
    init() {
        console.log("🦇 [BatSignal Agent] Inicializando Agente Conversacional Proactivo...");

        // Ejecutar primer escaneo con retraso para asegurar carga de datos
        setTimeout(() => this.runProactiveScan(), 3000);

        // Re-escaneo cada 5 minutos
        setInterval(() => this.runProactiveScan(), 300000);

        // Añadir el widget al DOM si estamos en el panel admin
        if (document.getElementById('admin-layout') || document.querySelector('.admin-sidebar')) {
            this._injectAgentUI();
        }
    }

    /**
     * Escanea el sistema en busca de puntos críticos.
     */
    async runProactiveScan() {
        if (this.isScanning) return;
        this.isScanning = true;
        this.suggestions = [];

        try {
            // 1. Obtener datos clave
            const players = await window.FirebaseDB.players.getAll();
            const upcomingAmericanas = await window.db.collection('americanas')
                .where('status', '==', 'open')
                .get();
            const upcomingEntrenos = await window.db.collection('entrenos')
                .where('status', '!=', 'finished')
                .get();

            // 2. LÓGICA DE DETECCIÓN

            // A. Huecos en eventos próximos (Próximas 48h)
            const allEvents = [
                ...upcomingAmericanas.docs.map(d => ({ id: d.id, ...d.data(), type: 'americana' })),
                ...upcomingEntrenos.docs.map(d => ({ id: d.id, ...d.data(), type: 'entreno' }))
            ].filter(ev => {
                const evDate = new Date(ev.date);
                const now = new Date();
                const diffHours = (evDate - now) / (1000 * 60 * 60);
                return diffHours > 0 && diffHours < 48;
            });

            for (const ev of allEvents) {
                const max = parseInt(ev.max_players || (ev.max_courts * 4) || 16);
                const current = (ev.players || []).length;
                if (current < max) {
                    this.suggestions.push({
                        id: `gap-${ev.id}`,
                        type: 'urgent',
                        icon: 'fa-users-slash',
                        title: '⚠️ Huecos Libres',
                        text: `Faltan **${max - current} personas** para "${ev.name}" de mañana. ¿Lanzamos la Batseñal a jugadores nivel ${ev.level || 'similar'}?`,
                        actionLabel: 'LANZAR BATSEÑAL',
                        action: () => window.SmartAlertsService.openUI(ev)
                    });
                }
            }

            // B. Revelaciones de nivel (Basado en el sistema de analytics)
            const revelations = players
                .filter(p => (p.last_level_change || 0) > 0.05)
                .sort((a, b) => b.last_level_change - a.last_level_change)
                .slice(0, 2);

            for (const p of revelations) {
                this.suggestions.push({
                    id: `rev-${p.uid}`,
                    type: 'insight',
                    icon: 'fa-chart-line',
                    title: '🚀 Jugador en Racha',
                    text: `**${p.name}** ha subido **+${p.last_level_change.toFixed(2)}** puntos. Deberías considerar subirlo de grupo en el próximo entrenamiento.`,
                    actionLabel: 'VER PERFIL',
                    action: () => {
                        if (window.loadAdminView) window.loadAdminView('users');
                        // Optional: trigger detail view if implemented
                    }
                });
            }

            // C. Predictive Churn & Stagnation Analysis (PREDICTIVE AI)
            const fifteenDaysAgo = new Date();
            fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

            // Get some recent match samples to check activity
            const recentMatchesSnap = await window.db.collection('matches')
                .where('date', '>=', fifteenDaysAgo.toISOString().split('T')[0])
                .get();
            const recentMatches = recentMatchesSnap.docs.map(d => JSON.stringify(d.data()));

            for (const p of players) {
                if (p.level < 3.0) continue; // Focus on established players

                const lastSeen = p.last_match_date ? new Date(p.last_match_date) : null;
                const matchesCount = p.matches_played || 0;

                // 1. CHURN RISK: High frequency player who stopped suddenly
                if (matchesCount > 20 && lastSeen && lastSeen < fifteenDaysAgo && lastSeen > thirtyDaysAgo) {
                    this.suggestions.push({
                        id: `churn-${p.uid}`,
                        type: 'urgent',
                        icon: 'fa-heart-broken',
                        title: '💔 Riesgo de Abandono',
                        text: `**${p.name}** era muy activo (P: ${matchesCount}) pero no ha jugado en 15 días. ¿Le enviamos un **PowerUp** (Invitación VIP) para motivarlo?`,
                        actionLabel: 'MOTIVAR JUGADOR',
                        action: () => window.open(`https://api.whatsapp.com/send?phone=${p.phone}&text=Hola ${p.name}! Te hemos seleccionado para un entrenamiento PRO especial esta semana. ¡Te esperamos!`)
                    });
                }

                // 2. STAGNATION: Level hasn't moved but plays often
                const isVeryActive = recentMatches.filter(m => m.includes(p.uid)).length >= 3;
                if (isVeryActive && Math.abs(p.last_level_change || 0) < 0.001) {
                    this.suggestions.push({
                        id: `stag-${p.uid}`,
                        type: 'insight',
                        icon: 'fa-layer-group',
                        title: '📉 Estancamiento Nivel',
                        text: `**${p.name}** está jugando mucho pero su nivel no progresa. Sugiero un **reto de entrenamiento** específico para romper su techo.`,
                        actionLabel: 'PLANEAR RETO',
                        action: () => {
                            if (window.loadAdminView) window.loadAdminView('entrenos');
                        }
                    });
                }
            }

            // D. Inactividad Crítica (Long term)
            const inactivePRO = players.filter(p => {
                const lastSeen = p.last_match_date ? new Date(p.last_match_date) : null;
                return p.level > 4.0 && (!lastSeen || lastSeen < thirtyDaysAgo);
            }).slice(0, 1);

            for (const p of inactivePRO) {
                this.suggestions.push({
                    id: `inactive-${p.uid}`,
                    type: 'warning',
                    icon: 'fa-user-clock',
                    title: '🧊 Inactividad PRO',
                    text: `Tu jugador TOP **${p.name}** lleva más de un mes sin aparecer. ¿Le envío un WhatsApp de seguimiento?`,
                    actionLabel: 'ENVIAR WHATSAPP',
                    action: () => window.open(`https://api.whatsapp.com/send?phone=${p.phone}&text=Hola ${p.name}, te echamos de menos en las pistas!`)
                });
            }

            // 3. Notificar si hay algo nuevo e importante
            if (this.suggestions.length > 0) {
                this._updateAgentUI();
            }

        } catch (e) {
            console.error("BatSignal Agent Error:", e);
        } finally {
            this.isScanning = false;
        }
    }

    _injectAgentUI() {
        const agentHtml = `
            <div id="batsignal-agent" style="
                position: fixed; bottom: 30px; right: 30px; z-index: 9999;
                display: flex; flex-direction: column; align-items: flex-end;
                font-family: 'Outfit', sans-serif;
            ">
                <!-- Chat Bubble -->
                <div id="agent-bubble" style="
                    background: #1e293b; border: 1px solid rgba(255,215,0,0.3);
                    border-radius: 20px 20px 4px 20px; padding: 20px; width: 320px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.4); margin-bottom: 15px;
                    display: none; flex-direction: column; gap: 15px;
                    animation: slideInAgent 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28);
                ">
                    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom:10px;">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <div style="width:10px; height:10px; border-radius:50%; background:#22c55e; box-shadow:0 0 10px #22c55e;"></div>
                            <span style="color:#FFD700; font-weight:950; font-size:0.75rem; letter-spacing:1px;">AI COMMAND CENTER</span>
                        </div>
                        <button onclick="window.BatSignalAgent.toggleUI()" style="background:none; border:none; color:#64748b; cursor:pointer;"><i class="fas fa-times"></i></button>
                    </div>
                    
                    <div id="agent-suggestions-list" style="max-height: 400px; overflow-y: auto; display:flex; flex-direction:column; gap:12px; padding-right:5px;">
                        <!-- Sugerencias aquí -->
                    </div>

                    <div style="font-size: 0.65rem; color: #475569; font-weight: 700; text-align: center; text-transform:uppercase;">
                        Monitorización Autónoma Activa
                    </div>
                </div>

                <!-- Main Button -->
                <button id="agent-toggle-btn" onclick="window.BatSignalAgent.toggleUI()" style="
                    width: 70px; height: 70px; border-radius: 50%;
                    background: linear-gradient(135deg, #FFD700 0%, #B8860B 100%);
                    border: none; color: black; font-size: 1.8rem; cursor: pointer;
                    box-shadow: 0 10px 30px rgba(255, 215, 0, 0.3);
                    transition: transform 0.3s, box-shadow 0.3s;
                    display: flex; align-items: center; justify-content: center;
                    position: relative; overflow: hidden;
                ">
                    <i class="fas fa-brain" id="agent-icon"></i>
                    <div id="agent-badge" style="
                        position: absolute; top: 12px; right: 12px;
                        width: 14px; height: 14px; background: #ff3b30;
                        border-radius: 50%; border: 2px solid white;
                        display: none; animation: pulseBadge 2s infinite;
                    "></div>
                </button>
            </div>

            <style>
                @keyframes slideInAgent {
                    from { opacity: 0; transform: translateY(20px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes pulseBadge {
                    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 59, 48, 0.7); }
                    70% { transform: scale(1.2); box-shadow: 0 0 0 10px rgba(255, 59, 48, 0); }
                    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 59, 48, 0); }
                }
                #agent-toggle-btn:hover { transform: scale(1.1); box-shadow: 0 15px 40px rgba(255, 215, 0, 0.5); }
                #agent-suggestions-list::-webkit-scrollbar { width: 4px; }
                #agent-suggestions-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius:10px; }
            </style>
        `;

        const helper = document.createElement('div');
        helper.innerHTML = agentHtml;
        document.body.appendChild(helper.firstElementChild);
    }

    _updateAgentUI() {
        const list = document.getElementById('agent-suggestions-list');
        const badge = document.getElementById('agent-badge');
        const btn = document.getElementById('agent-toggle-btn');

        if (!list) return;

        if (this.suggestions.length > 0) {
            badge.style.display = 'block';
            btn.style.animation = 'pulseBadge 3s infinite';

            list.innerHTML = this.suggestions.map(s => `
                <div class="agent-suggestion-card" style="
                    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 12px; padding: 15px; border-left: 3px solid ${this._getTypeColor(s.type)};
                ">
                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
                        <i class="fas ${s.icon}" style="color:${this._getTypeColor(s.type)}; font-size:0.8rem;"></i>
                        <span style="font-size:0.8rem; font-weight:800; color:white;">${s.title}</span>
                    </div>
                    <p style="font-size:0.75rem; color:#94a3b8; line-height:1.5; margin-bottom:12px; font-weight:500;">
                        ${s.text.replace(/\*\*(.*?)\*\*/g, '<b style="color:white">$1</b>')}
                    </p>
                    <button onclick="window.BatSignalAgent.executeAction('${s.id}')" style="
                        width: 100%; padding: 8px; border-radius: 8px; border: none;
                        background: ${this._getTypeColor(s.type)}20; color: ${this._getTypeColor(s.type)};
                        font-family: 'Outfit'; font-size: 0.7rem; font-weight: 900;
                        cursor: pointer; transition: 0.2s; text-transform:uppercase; letter-spacing:0.5px;
                    ">
                        ${s.actionLabel}
                    </button>
                </div>
            `).join('');

            // If it's the first time/urgent, maybe bounce
            if (!this.isVisible && this.suggestions.some(s => s.type === 'urgent')) {
                // this.toggleUI(); // Auto-open if urgent? No, better just pulse.
            }
        } else {
            badge.style.display = 'none';
            btn.style.animation = 'none';
            list.innerHTML = '<div style="text-align:center; padding:20px; color:#64748b; font-size:0.8rem;">Todo en orden. No hay alertas críticas.</div>';
        }
    }

    _getTypeColor(type) {
        switch (type) {
            case 'urgent': return '#ff3b30';
            case 'insight': return '#00d4ff';
            case 'warning': return '#ffd700';
            default: return '#CCFF00';
        }
    }

    toggleUI() {
        const bubble = document.getElementById('agent-bubble');
        const icon = document.getElementById('agent-icon');

        if (!bubble) return;

        this.isVisible = !this.isVisible;
        if (this.isVisible) {
            bubble.style.display = 'flex';
            icon.className = 'fas fa-comments';
            // Clear badge pulse when opening
            document.getElementById('agent-toggle-btn').style.animation = 'none';
        } else {
            bubble.style.display = 'none';
            icon.className = 'fas fa-brain';
        }
    }

    executeAction(id) {
        const suggestion = this.suggestions.find(s => s.id === id);
        if (suggestion && suggestion.action) {
            suggestion.action();
            // Remove from list after execution
            this.suggestions = this.suggestions.filter(s => s.id !== id);
            this._updateAgentUI();
        }
    }
}

// Exportación Global e Inicialización
window.BatSignalAgent = new BatSignalAgent();
document.addEventListener('DOMContentLoaded', () => {
    // Solo inicializar si estamos autenticados como admin
    // La comprobación real se hace en admin.js al cargar las vistas
});
