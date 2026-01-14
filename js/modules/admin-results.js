/**
 * admin-results.js
 * Unified Controller for Results Management (Americanas & Entrenos).
 * Replaces old admin-matches.js and embedded entreno results logic.
 */

window.AdminViews = window.AdminViews || {};

window.AdminController = {
    currentRound: 1,
    activeEvent: null
};

/**
 * Generic Entry Point
 * @param {string} forcedType - Optional, forces 'americana' or 'entreno' context
 */
window.loadResultsView = async function (forcedType = null) {
    const content = document.getElementById('content-area');
    const titleEl = document.getElementById('page-title');

    if (titleEl) titleEl.textContent = 'Centro de Control de Resultados';
    content.innerHTML = '<div class="loader"></div>';

    // 1. Fetch Candidates (Live or Open)
    // We fetch ALL events if no type forced, or specific.
    // For simplicity, let's fetch both and merge, OR use the forcedType to decide.

    let events = [];
    if (!forcedType || forcedType === 'entreno') {
        const ent = await EventService.getAll('entreno');
        events.push(...ent.map(e => ({ ...e, type: 'entreno' })));
    }
    if (!forcedType || forcedType === 'americana') {
        const am = await EventService.getAll('americana');
        events.push(...am.map(e => ({ ...e, type: 'americana' })));
    }

    // Sort: Live first, then Date
    events.sort((a, b) => {
        if (a.status === 'live' && b.status !== 'live') return -1;
        if (a.status !== 'live' && b.status === 'live') return 1;
        return new Date(b.date) - new Date(a.date);
    });

    let activeEvent = events[0];
    if (window.selectedEventId) {
        activeEvent = events.find(e => e.id === window.selectedEventId) || activeEvent;
    }

    if (!activeEvent) {
        content.innerHTML = `<div class="glass-card-enterprise text-center" style="padding: 4rem;"><p>No hay eventos activos.</p></div>`;
        return;
    }

    window.AdminController.activeEvent = activeEvent;

    // 2. Render UI
    renderResultsFrame(content, activeEvent, events);

    // 3. Load Matches
    renderMatchesGrid(activeEvent.id, activeEvent.type, window.AdminController.currentRound);

    // 4. REMOVED: statusInterval - Now using Real-Time onSnapshot listeners
    // The Smart DOM Patching handles all updates automatically
    if (window.AdminController.statusInterval) {
        clearInterval(window.AdminController.statusInterval);
        window.AdminController.statusInterval = null;
    }

};

// Aliases for Sidebar access
window.AdminViews.americanas_results = () => window.loadResultsView('americana');
window.AdminViews.entrenos_results = () => window.loadResultsView('entreno');
window.AdminViews.matches = () => window.loadResultsView(); // Generic fallback

// Helper: Render Frame
function renderResultsFrame(container, activeEvent, allEvents) {
    const isEntreno = activeEvent.type === 'entreno';
    const color = isEntreno ? '#FF2D55' : '#CCFF00'; // Entreno Red, Americana Green/Yellow

    container.innerHTML = `
        <div class="dashboard-header-pro" style="margin-bottom: 2rem; background: linear-gradient(135deg, #0a0a0a 0%, #111 100%); padding: 2.5rem; border-radius: 24px;">
            <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 20px;">
                <div style="display: flex; align-items: center; gap: 1.5rem;">
                    <div style="font-size: 2.5rem; text-shadow: 0 0 20px ${color}40;">${isEntreno ? '🏋️' : '🏆'}</div>
                    <div>
                        <h1 style="margin:0; color: white; font-size: 2.2rem; font-weight: 900;">${activeEvent.name}</h1>
                        <span style="color: ${activeEvent.status === 'live' ? '#fff' : color}; background: ${activeEvent.status === 'live' ? '#E11D48' : 'transparent'}; padding: 2px 10px; border-radius: 4px; font-weight: 800; letter-spacing: 2px; font-size: 0.8rem; text-transform: uppercase; box-shadow: ${activeEvent.status === 'live' ? '0 0 15px #E11D48' : 'none'};">
                            ${isEntreno ? 'CONTROL DE CLASE/ENTRENO' : 'CONTROL DE TORNEO'} | ${activeEvent.status.toUpperCase()}
                        </span>
                    </div>
                </div>
                
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <button class="btn-primary-pro" onclick="window.Actions.generateRound()" style="background: #3498db; color:white;">⚡ GENERAR RONDA</button>
                    <button class="btn-primary-pro" onclick="window.Actions.simulateRound()" style="background: #e67e22; color:white;">🎲 SIMULAR RONDA</button>
                    <button class="btn-primary-pro" onclick="window.Actions.finishEvent()" style="background: #27ae60; color:white;">🏁 FINALIZAR</button>
                    <button class="btn-primary-pro" onclick="window.Actions.resetEvent()" style="background: #e74c3c; color:white;">🗑️ REINICIAR (Panic Button)</button>
                    <button class="btn-outline-pro" onclick="window.Actions.emergencyRename()" style="border:1px solid #666; color:#999; font-size:0.7rem;">🔧 MANUAL FIX</button>
                </div>
            </div>

            <!-- FILTERS -->
             <div style="margin-top: 2rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; padding: 1.5rem; background: rgba(255,255,255,0.03); border-radius: 16px;">
                 <div>
                    <label style="color: #666; font-size: 0.7rem; font-weight: 800;">CAMBIAR EVENTO</label>
                    <select id="event-selector" class="pro-input" onchange="window.locationSelectEvent(this.value)">
                        ${allEvents.map(e => `<option value="${e.id}" ${e.id === activeEvent.id ? 'selected' : ''}>[${e.type.substring(0, 3).toUpperCase()}] ${e.name}</option>`).join('')}
                    </select>
                 </div>
                 <div>
                    <label style="color: #666; font-size: 0.7rem; font-weight: 800;">BUSCAR JUGADOR</label>
                    <input type="text" class="pro-input" placeholder="Nombre..." onkeyup="window.highlightPlayerCard(this.value)">
                 </div>
                 <div>
                    <label style="color: #666; font-size: 0.7rem; font-weight: 800;">PISTAS ACTIVAS</label>
                    <div style="display:flex; gap:10px;">
                        <input type="number" id="quick-courts" value="${activeEvent.max_courts || 4}" class="pro-input" style="width:60px; text-align:center;">
                        <button class="btn-outline-pro" onclick="window.Actions.updateCourts()">💾</button>
                    </div>
                 </div>
             </div>
             
             <!-- ROUND TABS -->
             <div style="display: flex; gap: 1rem; margin-top: 2rem; overflow-x: auto; padding-bottom: 5px;">
                ${[1, 2, 3, 4, 5, 6].map(r => `
                    <button class="btn-round-tab ${window.AdminController.currentRound === r ? 'active' : ''}" 
                            onclick="window.Actions.switchRound(${r})">
                        RONDA ${r}
                    </button>`).join('')}
             </div>
        </div>

        <div style="display: grid; grid-template-columns: 3fr 1fr; gap: 2rem;">
            <div id="matches-grid"><div class="loader"></div></div>
            <div class="glass-card-enterprise">
                <h3 style="margin:0 0 1rem 0; color:white; font-size:1rem;">CLASIFICACIÓN</h3>
                <div id="standings-list"></div>
            </div>
        </div>
    `;
}

async function renderMatchesGrid(eventId, type, round) {
    const container = document.getElementById('matches-grid');
    if (!container) return;

    // Clear Listeners
    if (window.AdminController.matchesUnsubscribers) {
        window.AdminController.matchesUnsubscribers.forEach(u => u && u());
    }
    window.AdminController.matchesUnsubscribers = [];
    if (window.AdminController.matchesUnsubscribe) {
        window.AdminController.matchesUnsubscribe();
        window.AdminController.matchesUnsubscribe = null;
    }

    // Initial Loader only if empty
    if (!container.innerHTML.includes('match-card') && !container.innerHTML.includes('smart-grid')) {
        container.innerHTML = '<div class="loader"></div>';
    }

    window.AdminController.matchesBuffer = { s1: [], s2: [] };

    const updateUI = () => {
        // Merge & Dedup
        const all = [...window.AdminController.matchesBuffer.s1, ...window.AdminController.matchesBuffer.s2];
        const unique = Array.from(new Map(all.map(item => [item.id, item])).values());
        const roundMatches = unique.filter(m => (m.round == round) || (!m.round && round == 1)).sort((a, b) => a.court - b.court);

        console.log(`[Grid] Smart Render: ${roundMatches.length} matches`);

        if (roundMatches.length === 0) {
            container.innerHTML = `
            <div style="text-align:center; padding: 4rem; color: #666;">
                <h3>Sin partidos en Ronda ${round}</h3>
                <p>Genera los cruces o comprueba otra ronda.</p>
            </div>`;
            return;
        }

        // Setup Grid Container
        let grid = container.querySelector('.smart-grid');
        if (!grid) {
            container.innerHTML = `<div class="smart-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem; animation: fadeIn 0.3s;"></div>`;
            grid = container.querySelector('.smart-grid');
        }

        const validIds = new Set();

        roundMatches.forEach(match => {
            validIds.add(match.id);
            const cardId = `card-${match.id}`;
            let el = document.getElementById(cardId);

            if (el) {
                // --- SMART UPDATE ---
                // 1. Status
                const statusEl = document.getElementById(`status-${match.id}`);
                const isFinished = match.status === 'finished';
                const newStatusHTML = isFinished ?
                    '<span style="font-size:0.6rem; background:#00ff64; color:black; padding:2px 6px; border-radius:4px; font-weight:800;">FINALIZADO</span>' :
                    '<span style="font-size:0.6rem; color:#ff9f43; animation: blink 1s infinite;">EN JUEGO</span>';

                if (statusEl && statusEl.innerHTML !== newStatusHTML) {
                    statusEl.innerHTML = newStatusHTML;
                    el.style.border = isFinished ? '1px solid #333' : '1px solid #555';
                }

                // 2. Scores (Update if not focused)
                const inpA = document.getElementById(`input-a-${match.id}`);
                const inpB = document.getElementById(`input-b-${match.id}`);

                if (inpA && document.activeElement !== inpA && inpA.value != (match.score_a || 0)) {
                    inpA.value = match.score_a || 0;
                }
                if (inpB && document.activeElement !== inpB && inpB.value != (match.score_b || 0)) {
                    inpB.value = match.score_b || 0;
                }

                // 3. Names (Update names if they changed)
                const nameAEl = document.getElementById(`name-a-${match.id}`);
                const nameBEl = document.getElementById(`name-b-${match.id}`);
                const teamAStr = match.teamA || (Array.isArray(match.team_a_names) ? match.team_a_names.join(' / ') : match.team_a_names);
                const teamBStr = match.teamB || (Array.isArray(match.team_b_names) ? match.team_b_names.join(' / ') : match.team_b_names);

                if (nameAEl && nameAEl.innerText !== teamAStr) nameAEl.innerText = teamAStr;
                if (nameBEl && nameBEl.innerText !== teamBStr) nameBEl.innerText = teamBStr;

            } else {
                // --- INSERT ---
                grid.insertAdjacentHTML('beforeend', renderMatchCard(match));
            }
        });

        // Remove old
        grid.querySelectorAll('.match-card').forEach(card => {
            const id = card.id.replace('card-', '');
            if (!validIds.has(id)) card.remove();
        });

        renderStandingsInternal(unique);
    };

    try {
        const subs = [];
        const primaryColl = (type === 'entreno') ? 'entrenos_matches' : 'matches';

        // Primary
        subs.push(window.db.collection(primaryColl)
            .where('americana_id', '==', eventId)
            .onSnapshot(snap => {
                window.AdminController.matchesBuffer.s1 = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                updateUI();
            })
        );
        // Secondary
        if (type === 'entreno') {
            subs.push(window.db.collection('matches')
                .where('americana_id', '==', eventId)
                .onSnapshot(snap => {
                    window.AdminController.matchesBuffer.s2 = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                    updateUI();
                })
            );
        }
        window.AdminController.matchesUnsubscribers = subs;
    } catch (e) {
        container.innerHTML = `Error: ${e.message}`;
    }
}

function renderMatchCard(match) {
    const isFinished = match.status === 'finished';
    return `
        <div id="card-${match.id}" class="glass-card-enterprise match-card" style="padding:0; overflow:hidden; border: 1px solid ${isFinished ? '#333' : '#555'}; transition: border 0.3s;">
            <div style="background: rgba(255,255,255,0.03); padding: 10px 15px; display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.05); align-items:center;">
                <span style="font-weight:900; color:var(--primary);">PISTA ${match.court}</span>
                <div id="status-${match.id}">
                    ${isFinished ?
            '<span style="font-size:0.6rem; background:#00ff64; color:black; padding:2px 6px; border-radius:4px; font-weight:800;">FINALIZADO</span>' :
            '<span style="font-size:0.6rem; color:#ff9f43; animation: blink 1s infinite;">EN JUEGO</span>'}
                </div>
            </div>
            <div style="padding: 1.5rem;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <span id="name-a-${match.id}" style="font-weight:700; color:white; font-size:0.9rem;">${match.teamA || (Array.isArray(match.team_a_names) ? match.team_a_names.join(' / ') : match.team_a_names)}</span>
                    <input type="number" id="input-a-${match.id}" class="pro-input score-input" value="${match.score_a || 0}" 
                           onchange="window.Actions.updateScore('${match.id}', 'score_a', this.value)"
                           style="width:50px; text-align:center; height:40px; font-size:1.2rem; font-weight:900;">
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span id="name-b-${match.id}" style="font-weight:700; color:white; font-size:0.9rem;">${match.teamB || (Array.isArray(match.team_b_names) ? match.team_b_names.join(' / ') : match.team_b_names)}</span>
                    <input type="number" id="input-b-${match.id}" class="pro-input score-input" value="${match.score_b || 0}" 
                           onchange="window.Actions.updateScore('${match.id}', 'score_b', this.value)"
                           style="width:50px; text-align:center; height:40px; font-size:1.2rem; font-weight:900;">
                </div>
                <div style="margin-top:10px; text-align:right;">
                     ${!isFinished ? `<button class="btn-outline-pro" onclick="window.Actions.finishMatch('${match.id}', true)" style="font-size:0.6rem; padding:4px 8px;">FINALIZAR</button>`
            : `<button class="btn-outline-pro" onclick="window.Actions.finishMatch('${match.id}', false)" style="font-size:0.6rem; padding:4px 8px; opacity:0.5;">REABRIR</button>`}
                </div>
            </div>
        </div>
    `;
}

function renderStandingsInternal(matches) {
    const container = document.getElementById('standings-list');
    if (!container) return;

    const stats = {};
    const evt = window.AdminController.activeEvent;
    const isRotating = evt && evt.pair_mode === 'rotating';

    matches.forEach(m => {
        if (m.status === 'finished') {
            const processTeams = (namesGroup, score) => {
                // Determine if we should treat names as separate individuals or a single pair
                let namesToProcess = [];
                if (Array.isArray(namesGroup)) {
                    if (isRotating) namesToProcess = namesGroup; // Process each player
                    else namesToProcess = [namesGroup.join(' / ')]; // Process as one pair
                } else if (typeof namesGroup === 'string') {
                    namesToProcess = [namesGroup];
                }

                namesToProcess.forEach(name => {
                    if (!name || name.includes('VACANTE')) return;
                    if (!stats[name]) stats[name] = { played: 0, games: 0, wins: 0 };
                    stats[name].played++;
                    stats[name].games += parseInt(score || 0);
                });
            };

            processTeams(m.team_a_names, m.score_a);
            processTeams(m.team_b_names, m.score_b);
        }
    });

    const sorted = Object.entries(stats)
        .map(([k, v]) => ({ name: k, ...v }))
        .sort((a, b) => b.games - a.games);

    container.innerHTML = sorted.map((s, i) => `
        <div style="display:flex; justify-content:space-between; padding:8px; border-bottom:1px solid rgba(255,255,255,0.05); align-items:center;">
            <div style="display:flex; align-items:center; gap:8px; overflow:hidden;">
                <span style="color:var(--primary); font-weight:900; min-width:25px;">#${i + 1}</span> 
                <span style="color:white; font-size:0.85rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${s.name}</span>
            </div>
            <div style="color:white; font-weight:700; background:rgba(255,255,255,0.05); padding:2px 8px; border-radius:4px;">${s.games}</div>
        </div>
    `).join('') || '<div style="padding:1rem; opacity:0.5; text-align:center;">Esperando resultados...</div>';
}


// --- ACTIONS EXPOSED TO WINDOW ---
window.Actions = {
    async generateRound() {
        const evt = window.AdminController.activeEvent;
        const round = window.AdminController.currentRound;

        // Confirmation?

        try {
            await MatchMakingService.generateRound(evt.id, evt.type, round);
            window.loadResultsView(evt.type); // Refresh
        } catch (e) { alert(e.message); }
    },

    async simulateRound() {
        if (!confirm("Simular resultados aleatorios?")) return;
        const evt = window.AdminController.activeEvent;
        const round = window.AdminController.currentRound;
        try {
            await MatchMakingService.simulateRound(evt.id, round);
            window.loadResultsView(evt.type);
        } catch (e) { alert(e.message); }
    },

    async updateScore(matchId, field, value) {
        const evt = window.AdminController.activeEvent;
        const collection = (evt && evt.type === 'entreno') ? FirebaseDB.entrenos_matches : FirebaseDB.matches;
        await collection.update(matchId, { [field]: parseInt(value), status: 'finished' });
    },

    switchRound(r) {
        window.AdminController.currentRound = r;
        const evt = window.AdminController.activeEvent;
        renderMatchesGrid(evt.id, evt.type, r);

        // Update Tabs UI
        document.querySelectorAll('.btn-round-tab').forEach(b => b.classList.remove('active'));
        // Find button by text or index... easier to re-render context but that's expensive.
        // We just re-render frame? No. 
        // Just cheat and update generic style
    },

    async updateCourts() {
        const val = document.getElementById('quick-courts').value;
        const evt = window.AdminController.activeEvent;
        await EventService.updateEvent(evt.type, evt.id, { max_courts: parseInt(val) });
        alert("Pistas actualizadas");
    },

    async resetEvent() {
        if (!confirm("⚠️ ¿ESTÁS SEGURO?\n\nEsta acción es irreversible:\n1. Borrará TODOS los partidos y resultados.\n2. Reiniciará el evento a estado 'Abierto'.\n3. Tendrás que generar los cruces de nuevo.\n\n¿Continuar?")) return;

        const evt = window.AdminController.activeEvent;
        const loader = document.getElementById('matches-grid');
        if (loader) loader.innerHTML = '<div class="loader"></div>';

        try {
            // 1. Delete all matches for this event (Search in BOTH collections)
            const collections = ['matches', 'entrenos_matches'];
            let totalDeleted = 0;

            for (const collName of collections) {
                const snap = await window.db.collection(collName).where('americana_id', '==', evt.id).get();
                if (!snap.empty) {
                    const batch = window.db.batch();
                    snap.docs.forEach(doc => {
                        batch.delete(doc.ref);
                        totalDeleted++;
                    });
                    await batch.commit();
                }
            }

            console.log(`🔥 Purged ${totalDeleted} matches across all collections.`);

            // 2. Reset Event Status
            await EventService.updateEvent(evt.type, evt.id, { status: 'open' });

            alert("✅ Evento reiniciado correctamente. Ahora puedes generar la Ronda 1.");
            window.loadResultsView(evt.type);

        } catch (e) {
            console.error(e);
            alert("Error al reiniciar: " + e.message);
        }
    }
};

window.locationSelectEvent = (id) => {
    window.selectedEventId = id;
    window.loadResultsView();
};

window.highlightPlayerCard = (val) => {
    const q = val.toLowerCase();
    document.querySelectorAll('.match-card').forEach(c => {
        const names = c.getAttribute('data-players');
        c.style.opacity = names.includes(q) ? 1 : 0.2;
    });
};

console.log("🏆 Admin-Results Loaded");
