/**
 * admin-americanas.js
 * View Controller for Americanas Management.
 * Uses EventService, ParticipantService, PairsUI.
 */

window.AdminViews = window.AdminViews || {};

window.AdminViews.americanas_mgmt = async function () {
    const content = document.getElementById('content-area');
    content.innerHTML = '<div class="loader"></div>';

    // Clear previous listener if exists
    if (window.AdminViews.americanasUnsub) {
        window.AdminViews.americanasUnsub();
        window.AdminViews.americanasUnsub = null;
    }

    try {
        // Real-time Listener
        window.AdminViews.americanasUnsub = window.db.collection('americanas')
            .onSnapshot(snapshot => {
                const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                const sorted = events.sort((a, b) => new Date(b.date) - new Date(a.date));
                const listHtml = sorted.map(e => renderAmericanaCard(e)).join('');

                // Only update list area if form is already rendered?
                // Actually, this functions renders the WHOLE view including form.
                // If we re-render everything, we lose Form state if user is typing.
                // Better approach: Render detailed structure ONCE, then update LIST.

                // Initial Render (Structure)
                if (!document.getElementById('americanas-list-container')) {
                    content.innerHTML = `
                        <div class="dashboard-grid-enterprise" style="grid-template-columns: 400px 1fr; gap: 2.5rem;">
                            <!-- Create Form -->
                            <div class="glass-card-enterprise" style="background: var(--grad-dark); height: fit-content; padding: 2rem;">
                                <h3 style="margin-bottom: 2rem; color: var(--primary); display: flex; align-items: center; gap: 10px;">
                                    <span style="font-size: 1.5rem;">✨</span> CONFIGURAR AMERICANA
                                </h3>
                                ${renderCreateAmericanaForm()}
                            </div>
                            
                            <!-- List -->
                            <div class="planning-area">
                                <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                                    <h3 style="margin:0; letter-spacing: 2px; font-size: 0.85rem; color: var(--text-muted); font-weight: 800;">TORNEOS EN EL RADAR</h3>
                                    <span style="font-size:0.7rem; color:#666;">Actualización en tiempo real 🟢</span>
                                </div>
                                <div id="americanas-list-container" class="americana-scroll-list">
                                    <div class="loader"></div>
                                </div>
                            </div>
                        </div>`;
                    setupCreateAmericanaForm();
                }

                // Update List Content
                const listContainer = document.getElementById('americanas-list-container');
                if (listContainer) {
                    listContainer.innerHTML = listHtml.length ? listHtml : '<div class="glass-card-enterprise text-center" style="padding:4rem; color:#666;">Sin torneos.</div>';
                }

            }, error => {
                console.error("Americanas List Error:", error);
                const listContainer = document.getElementById('americanas-list-container');
                if (listContainer) listContainer.innerHTML = `Error: ${error.message}`;
            });

    } catch (e) {
        content.innerHTML = `Error: ${e.message}`;
    }
};

function renderAmericanaCard(e) {
    const statusLabel = e.status === 'live' ? 'EN JUEGO' : e.status === 'finished' ? 'FINALIZADA' : 'ABIERTA';
    const statusColor = e.status === 'live' ? '#FF2D55' : e.status === 'finished' ? '#888' : '#00E36D';

    return `
        <div class="glass-card-enterprise" style="margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; border-left: 4px solid var(--primary); background: linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%);">
            <div style="display: flex; gap: 1.5rem; align-items: center; flex: 1;">
                <div class="americana-preview-img" style="width: 90px; height: 90px; border-radius: 16px; background: url('${e.image_url}') center/cover; border: 2px solid rgba(204,255,0,0.2);"></div>
                <div class="americana-info-pro" style="flex: 1;">
                    <div style="font-weight: 900; font-size: 1.5rem; color: #FFFFFF; margin-bottom: 0.5rem;">${e.name.toUpperCase()}</div>
                    <div style="display: flex; gap: 1.5rem; font-size: 0.85rem; color: var(--text-muted); flex-wrap: wrap;">
                         <span>📅 ${e.date}</span>
                         <span>🕒 ${e.time || '18:30'}</span>
                         <span>👥 ${e.players?.length || 0} Inscritos</span>
                    </div>
                </div>
            </div>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: flex-end; max-width: 400px;">
                <span class="pro-category-badge" style="color:${statusColor}; border-color:${statusColor}; background:${statusColor}10;">${statusLabel}</span>
                <button class="btn-outline-pro" onclick='window.openEditAmericanaModal(${JSON.stringify(e).replace(/'/g, "&#39;")})'>✏️ EDITAR</button>
                <button class="btn-secondary" onclick="window.deleteAmericana('${e.id}')">🗑️</button>
            </div>
        </div>`;
}

function renderCreateAmericanaForm() {
    return `
        <form id="create-americana-form" class="pro-form">
            <div class="form-group"><label>NOMBRE</label><input type="text" name="name" class="pro-input" required placeholder="AMERICANA..."></div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                <div class="form-group"><label>FECHA</label><input type="date" name="date" class="pro-input" required></div>
                <div class="form-group"><label>HORA</label><input type="time" name="time" value="18:30" class="pro-input" required></div>
            </div>
            <div class="form-group"><label>SEDE</label><select name="location" class="pro-input"><option value="Barcelona Pádel el Prat">El Prat</option><option value="Delfos Cornellá">Delfos</option></select></div>
            <div class="form-group"><label>CATEGORÍA</label><select name="category" class="pro-input"><option value="open">TODOS</option><option value="male">MASCULINA</option><option value="female">FEMENINA</option><option value="mixed">MIXTA</option></select></div>
            <div class="form-group"><label>MODO</label><select name="pair_mode" class="pro-input"><option value="rotating">🔄 TWISTER</option><option value="fixed">🔒 POZO (Parejas Fijas)</option></select></div>
            <div class="form-group"><label>IMAGEN</label><select name="image_url" class="pro-input"></select></div>

            <button type="submit" class="btn-primary-pro" style="width:100%; margin-top:1rem;">🚀 LANZAR</button>
        </form>
    `;
}

function setupCreateAmericanaForm() {
    const form = document.getElementById('create-americana-form');
    if (!form) return;

    const cat = form.querySelector('[name=category]');
    const loc = form.querySelector('[name=location]');
    const img = form.querySelector('[name=image_url]');
    const name = form.querySelector('[name=name]');

    const sync = () => {
        // ... (Similiar sync logic to entrenos but for Americana images)
        const cVal = cat.value;
        const lVal = loc.value;

        // Auto-Image Logic
        if (lVal === 'Barcelona Pádel el Prat') {
            img.innerHTML = Object.values(AppConstants.IMAGES.AMERICANA).map(u => `<option value="${u}">${u.split('/').pop()}</option>`).join('') + Object.values(AppConstants.IMAGES.BALLS).map(u => `<option value="${u}">${u.split('/').pop()}</option>`).join('');
        } else {
            img.innerHTML = `<option value="img/delfos.png">Delfos</option>`;
        }

        // Auto-Name
        if (!name.value || name.value.startsWith('AMERICANA')) {
            name.value = `AMERICANA ${cVal.toUpperCase()}`;
        }
    };
    cat.onchange = sync;
    loc.onchange = sync;
    sync();

    form.onsubmit = async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(form).entries());
        try {
            await EventService.createEvent('americana', data);
            alert("✅ Americana creada");
            window.loadAdminView('americanas_mgmt');
        } catch (err) { alert(err.message); }
    };
}

window.deleteAmericana = async (id) => {
    if (!confirm("Confirmar borrado?")) return;
    await EventService.deleteEvent('americana', id);
    window.loadAdminView('americanas_mgmt');
};

window.openEditAmericanaModal = async (e) => {
    const modal = document.getElementById('admin-americana-modal');
    const form = document.getElementById('edit-americana-form');
    if (!modal || !form) return;

    try {
        // MAP FIELDS (Robust)
        if (form.querySelector('[name=id]')) form.querySelector('[name=id]').value = e.id;
        if (form.querySelector('[name=name]')) form.querySelector('[name=name]').value = e.name || '';
        if (form.querySelector('[name=date]')) form.querySelector('[name=date]').value = e.date || '';
        if (form.querySelector('[name=time]')) form.querySelector('[name=time]').value = e.time || '18:30';
        if (form.querySelector('[name=time_end]')) form.querySelector('[name=time_end]').value = e.time_end || '';
        if (form.querySelector('[name=category]')) form.querySelector('[name=category]').value = e.category || 'open';
        if (form.querySelector('[name=location]')) form.querySelector('[name=location]').value = e.location || 'Barcelona Pádel el Prat';
        if (form.querySelector('[name=pair_mode]')) form.querySelector('[name=pair_mode]').value = e.pair_mode || 'rotating';
        if (form.querySelector('[name=image_url]')) form.querySelector('[name=image_url]').value = e.image_url || '';

        // Extra fields (similar to Entrenos)
        if (form.querySelector('[name=duration]')) form.querySelector('[name=duration]').value = e.duration || '2h';
        if (form.querySelector('[name=status]')) form.querySelector('[name=status]').value = e.status || 'open';
        if (form.querySelector('[name=max_courts]')) form.querySelector('[name=max_courts]').value = e.max_courts || 6;
        if (form.querySelector('[name=price_members]')) form.querySelector('[name=price_members]').value = e.price_members || 20;
        if (form.querySelector('[name=price_external]')) form.querySelector('[name=price_external]').value = e.price_external || 25;

        // Preview Image
        const preview = document.getElementById('edit-americana-img-preview');
        if (preview && e.image_url) {
            preview.src = e.image_url;
            preview.style.display = 'block';
        }
    } catch (err) { console.error("Error mapping Americana fields", err); }

    modal.classList.remove('hidden');
    modal.style.display = 'flex';

    // ASYNC SUBMIT HANDLER
    form.onsubmit = async (evt) => {
        evt.preventDefault();
        const fd = new FormData(form);
        const data = Object.fromEntries(fd.entries());
        const id = data.id;
        delete data.id;

        try {
            // Convert numbers
            if (data.max_courts) data.max_courts = parseInt(data.max_courts);
            if (data.price_members) data.price_members = parseFloat(data.price_members);
            if (data.price_external) data.price_external = parseFloat(data.price_external);

            await EventService.updateEvent('americana', id, data);
            alert("✅ Americana actualizada");

            window.loadAdminView('americanas_mgmt');
            window.closeAmericanaModal();

        } catch (err) {
            alert("Error al actualizar: " + err.message);
        }
    };

    await window.loadAmericanaParticipantsUI(e.id);
    if (window.PairsUI) await window.PairsUI.load('americana-fixed-pairs-area', e.id, 'americana');
};

window.closeAmericanaModal = () => {
    const modal = document.getElementById('admin-americana-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
        // Clear preview
        const preview = document.getElementById('edit-americana-img-preview');
        if (preview) preview.style.display = 'none';
    }
};


// PARTICIPANTS UI (Dedicated wrapper around Service)
window.loadAmericanaParticipantsUI = async (id) => {
    const list = document.getElementById('participants-list'); // Existing HTML ID
    const select = document.getElementById('add-player-select');
    const btn = document.getElementById('btn-add-player');

    if (!list) return;

    const [event, users] = await Promise.all([
        EventService.getById('americana', id),
        FirebaseDB.players.getAll()
    ]);

    // AUTO-REPAIR: Fix players without IDs
    let needsRepair = false;
    const repairedPlayers = (event.players || []).map(player => {
        const playerId = player.id || player.uid || player.player_id;
        if (!playerId && player.name) {
            const foundPlayer = users.find(u =>
                u.name.toLowerCase().trim() === player.name.toLowerCase().trim()
            );
            if (foundPlayer) {
                console.log(`🔧 Auto-repair: ${player.name} -> ${foundPlayer.id}`);
                needsRepair = true;
                return {
                    ...player,
                    id: foundPlayer.id,
                    uid: foundPlayer.id
                };
            }
        }
        return player;
    });

    // Save repaired data
    if (needsRepair) {
        await EventService.updateEvent('americana', id, { players: repairedPlayers });
        console.log('✅ IDs reparados automáticamente');
    }

    // Use repaired data for rendering
    const finalPlayers = needsRepair ? repairedPlayers : (event.players || []);

    // NEW: Render Autocomplete
    if (window.PlayerAutocomplete) {
        const enrolledIds = new Set(finalPlayers.map(p => p.id || p.uid));
        window.PlayerAutocomplete.render(
            'autocomplete-container-americana',
            users,
            enrolledIds,
            async (uid) => {
                try {
                    const user = users.find(u => u.id === uid);
                    if (!user) return;
                    await ParticipantService.addPlayer(id, 'americana', user);
                    window.loadAmericanaParticipantsUI(id);
                } catch (e) { alert(e.message); }
            },
            "🔍 Buscar jugador para añadir..."
        );
    } else {
        // Fallback or Error if component missing
        console.warn("PlayerAutocomplete not found");
    }

    // Render List
    list.innerHTML = finalPlayers.map((p, i) => {
        const playerId = p.id || p.uid || p.player_id || '';
        if (!playerId) {
            console.warn('Player without ID:', p);
            return `
                <div class="player-row">
                    <span>${p.name || 'Sin nombre'}</span>
                    <button disabled style="opacity:0.5" title="No se puede eliminar: falta ID">🗑️</button>
                </div>
            `;
        }
        return `
            <div class="player-row" style="display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; flex-direction:column;">
                    <span style="font-weight:700;">${p.name || 'JUGADOR'}</span>
                    <span style="font-size:0.65rem; color:#888;">${p.joinedAt ? new Date(p.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                </div>
                <button onclick="window.removeAmericanaPlayer('${id}', '${playerId}')" class="btn-delete-micro">🗑️</button>
            </div>
        `;
    }).join('');
};

window.removeAmericanaPlayer = async (eid, uid) => {
    if (!uid || uid === 'undefined' || uid === 'null') {
        alert('❌ Error: No se puede eliminar este jugador (ID inválido). Por favor contacta al administrador.');
        console.error('Invalid player ID:', uid);
        return;
    }

    if (!confirm("Borrar jugador? Si hay partidos creados, se sustituirá por VACANTE.")) return;

    try {
        // 1. Safe Name Fetch (Typeless comparison)
        const event = await EventService.getById('americana', eid);
        const player = (event.players || []).find(p => String(p.id || p.uid) === String(uid));
        const oldName = player ? player.name : '';
        console.log(`🗑️ REMOVE AMERICANA PLAYER: ${uid}, Name=${oldName}`);

        // 2. Remove from List
        const res = await ParticipantService.removePlayer(eid, 'americana', uid);

        if (res.promoted) {
            alert(`♻️ Sustitución automática: ${oldName} -> ${res.promoted.name}`);
        } else {
            alert(`ℹ️ Jugador eliminado.`);
        }

        window.loadAmericanaParticipantsUI(eid);
        if (window.PairsUI) window.PairsUI.load('americana-fixed-pairs-area', eid, 'americana');
    } catch (e) {
        alert("Error al borrar: " + e.message);
    }
};
