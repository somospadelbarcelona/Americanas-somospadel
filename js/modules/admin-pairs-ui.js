/**
 * admin-pairs-ui.js
 * Shared UI Controller for managing Fixed Pairs.
 * Handles: Listing pairs, Adding new pairs, Auto-Pairing.
 */

window.PairsUI = {

    /**
     * Load the Pairs Management Interface into a container
     */
    async load(containerId, eventId, eventType) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const event = await EventService.getById(eventType, eventId);
        if (event.pair_mode !== 'fixed') {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';
        container.innerHTML = `
            <div style="background: rgba(255,255,255,0.02); padding: 15px; border-radius: 12px; margin-top: 15px; border: 1px dashed #444;">
                <h4 style="margin:0 0 10px 0; color: #CCFF00;">🔐 GESTIÓN DE PAREJAS FIJAS (POZO)</h4>
                
                <div id="pairs-list-${eventId}" style="margin-bottom: 15px;"></div>
                
                <div style="display:flex; gap:10px;">
                     <select id="p1-${eventId}" class="pro-input"></select>
                     <select id="p2-${eventId}" class="pro-input"></select>
                     <button id="btn-add-pair-${eventId}" class="btn-primary-pro" style="padding: 0 15px;">➕</button>
                </div>
                
                <button id="btn-auto-pair-${eventId}" class="btn-outline-pro" style="width:100%; margin-top:10px;">⚡ AUTO-EMPAREJAR RESTANTES</button>
                
                <!-- REGEN BUTTON -->
                <button id="btn-regen-${eventId}" class="btn-primary-pro" style="width:100%; margin-top:15px; background: #e67e22; border-color: #e67e22;">
                    🎲 GUARDAR Y REGENERAR CRUCES
                </button>
            </div>
        `;

        await this.renderList(eventId, eventType);
        this.setupListeners(eventId, eventType);
    },

    async renderList(eventId, eventType) {
        const listDiv = document.getElementById(`pairs-list-${eventId}`);
        const s1 = document.getElementById(`p1-${eventId}`);
        const s2 = document.getElementById(`p2-${eventId}`);

        if (!listDiv) return;

        const event = await EventService.getById(eventType, eventId);
        const pairs = event.fixed_pairs || [];
        const players = event.players || [];

        // 1. Render Pairs
        if (pairs.length === 0) {
            listDiv.innerHTML = '<div style="color:#666; font-style:italic;">Sin parejas definidas</div>';
        } else {
            listDiv.innerHTML = pairs.map((p, i) => `
                <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.3); padding:8px; margin-bottom:5px; border-radius:6px;">
                    <span style="color:white;">${p.player1.name} 🤝 ${p.player2.name}</span>
                    <button onclick="window.PairsUI.removePair('${eventId}', '${eventType}', ${i})" style="color:red; background:none; border:none; cursor:pointer;">×</button>
                </div>
            `).join('');
        }

        // 2. Populate Selects (Available players only)
        const pairedIds = new Set();
        pairs.forEach(p => {
            if (p.player1) pairedIds.add(p.player1.id || p.player1.uid);
            if (p.player2) pairedIds.add(p.player2.id || p.player2.uid);
        });

        const available = players.filter(p => !pairedIds.has(p.id || p.uid));
        const opts = `<option value="">Seleccionar...</option>` + available.map(p => `<option value="${p.id || p.uid}">${p.name}</option>`).join('');

        if (s1) s1.innerHTML = opts;
        if (s2) s2.innerHTML = opts;
    },

    setupListeners(eventId, eventType) {
        const btnAdd = document.getElementById(`btn-add-pair-${eventId}`);
        const btnAuto = document.getElementById(`btn-auto-pair-${eventId}`);
        const btnRegen = document.getElementById(`btn-regen-${eventId}`);

        if (btnAdd) btnAdd.onclick = () => this.addPair(eventId, eventType);
        if (btnAuto) btnAuto.onclick = () => this.autoPair(eventId, eventType);
        if (btnRegen) btnRegen.onclick = () => this.regenerate(eventId, eventType);
    },

    async addPair(eventId, eventType) {
        const s1 = document.getElementById(`p1-${eventId}`);
        const s2 = document.getElementById(`p2-${eventId}`);

        const id1 = s1.value;
        const id2 = s2.value;

        if (!id1 || !id2 || id1 === id2) return alert("Selecciona dos jugadores distintos");

        const event = await EventService.getById(eventType, eventId);
        const players = event.players || [];
        const p1 = players.find(p => (p.id || p.uid) === id1);
        const p2 = players.find(p => (p.id || p.uid) === id2);

        const newPair = { player1: p1, player2: p2, court: 0, wins: 0, games: 0 }; // Basic init
        const currentPairs = event.fixed_pairs || [];

        await EventService.updateEvent(eventType, eventId, { fixed_pairs: [...currentPairs, newPair] });
        this.renderList(eventId, eventType);
    },

    async removePair(eventId, eventType, index) {
        if (!confirm("Eliminar pareja?")) return;
        const event = await EventService.getById(eventType, eventId);
        const pairs = event.fixed_pairs || [];
        pairs.splice(index, 1);
        await EventService.updateEvent(eventType, eventId, { fixed_pairs: pairs });
        this.renderList(eventId, eventType);
    },

    async autoPair(eventId, eventType) {
        if (!confirm("Auto-emparejar restantes?")) return;
        const event = await EventService.getById(eventType, eventId);

        // Use Logic from FixedPairsLogic ideally, or simple shuffle here
        // Reusing the simple shuffle for UI speed
        const pairs = event.fixed_pairs || [];
        const pairedIds = new Set();
        pairs.forEach(p => { pairedIds.add(p.player1.id); pairedIds.add(p.player2.id); });

        let available = (event.players || []).filter(p => !pairedIds.has(p.id || p.uid));
        available.sort(() => 0.5 - Math.random());

        const newPairs = [];
        for (let i = 0; i < available.length; i += 2) {
            if (i + 1 < available.length) {
                newPairs.push({ player1: available[i], player2: available[i + 1], court: 0 });
            }
        }

        await EventService.updateEvent(eventType, eventId, { fixed_pairs: [...pairs, ...newPairs] });
        this.renderList(eventId, eventType);
    },

    async regenerate(eventId, eventType) {
        if (!confirm("Generar nuevos cruces con estas parejas? (Borrará R1)")) return;
        try {
            await window.AmericanaService.purgeMatches(eventId, eventType); // Ops, AmericanaService might be legacy?
            // Use MatchMakingService
            // But we need to purge specifically. MatchMakingService has purgeMatches.
            await MatchMakingService.purgeMatches(eventId);
            await MatchMakingService.generateRound(eventId, eventType, 1);
            alert("✅ Cruces regenerados");
        } catch (e) { alert(e.message); }
    }
};
