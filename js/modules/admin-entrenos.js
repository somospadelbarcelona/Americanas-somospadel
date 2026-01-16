/**
 * admin-entrenos.js
 * View Controller for Entrenos Management.
 * Refactored to use EventService & ParticipantService.
 */

window.AdminViews = window.AdminViews || {};

// Main Management View
window.AdminViews.entrenos_mgmt = async function () {
    const content = document.getElementById('content-area');
    const titleEl = document.getElementById('page-title');

    if (titleEl) titleEl.textContent = 'Centro de Planificación de Entrenos';
    content.innerHTML = '<div class="loader"></div>';
    console.log("🚀 AdminEntrenos Module v3000 Loaded");

    try {
        const entrenos = await EventService.getAll(AppConstants.EVENT_TYPES.ENTRENO);
        const sortedEntrenos = entrenos.sort((a, b) => new Date(b.date) - new Date(a.date));

        const listHtml = sortedEntrenos.map(e => renderEntrenoCard(e)).join('');

        content.innerHTML = `
            <div class="dashboard-grid-enterprise" style="grid-template-columns: 400px 1fr; gap: 2.5rem;">
                <!-- Create Form Column -->
                <div class="glass-card-enterprise" style="background: var(--grad-dark); height: fit-content; padding: 2rem;">
                    <h3 style="margin-bottom: 2rem; color: var(--primary); display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 1.5rem;">✨</span> CONFIGURAR ENTRENOS
                    </h3>
                    ${renderCreateForm()}
                </div>
                
                <!-- List Column -->
                <div class="planning-area">
                    <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                        <h3 style="margin:0; letter-spacing: 2px; font-size: 0.85rem; color: var(--text-muted); font-weight: 800;">EVENTOS EN EL RADAR</h3>
                        <button class="btn-outline-pro" onclick="loadAdminView('entrenos_mgmt')" style="padding: 0.6rem 1.2rem; font-size: 0.75rem;">REFRESCAR SISTEMA</button>
                    </div>
                    <div class="entreno-scroll-list">
                        ${listHtml.length ? listHtml : '<div class="glass-card-enterprise" style="text-align:center; padding: 4rem; color: var(--text-muted);">No hay entrenos operativos.</div>'}
                    </div>
                </div>
            </div>`;

        setupCreateForm();

    } catch (e) {
        content.innerHTML = `<div class="error-box">Error loading entrenos: ${e.message}</div>`;
    }
};

// --- HELPER RENDERING FUNCTIONS --- //

function renderEntrenoCard(e) {
    const priceStr = `${e.price_members || 20}€ / ${e.price_external || 25}€`;
    const statusLabel = e.status === 'live' ? 'EN JUEGO' : e.status === 'finished' ? 'FINALIZADA' : 'ABIERTA';
    const statusColor = e.status === 'live' ? '#FF2D55' : e.status === 'finished' ? '#888' : '#00E36D';

    return `
        <div class="glass-card-enterprise" style="margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; border-left: 4px solid var(--primary); background: linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%);">
            <div style="display: flex; gap: 1.5rem; align-items: center; flex: 1;">
                <div class="entreno-preview-img" style="width: 90px; height: 90px; border-radius: 16px; background: url('${e.image_url || 'img/logo_somospadel.png'}') center/cover; border: 2px solid rgba(204,255,0,0.2);"></div>
                <div class="entreno-info-pro" style="flex: 1;">
                    <div style="font-weight: 900; font-size: 1.5rem; color: #FFFFFF; margin-bottom: 0.5rem;">${e.name.toUpperCase()}</div>
                    <div style="display: flex; gap: 1.5rem; font-size: 0.85rem; color: var(--text-muted); flex-wrap: wrap;">
                         <span>📅 <span style="color:white">${e.date}</span></span>
                         <span>🕒 <span style="color:white">${e.time || '10:00'}</span></span>
                         <span>👥 <span style="color:var(--primary)">${e.players?.length || 0} Inscritos</span></span>
                    </div>
                </div>
            </div>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: flex-end; max-width: 400px;">
                <span class="pro-category-badge" style="border:1px solid #444; color:#aaa;">${priceStr}</span>
                <span class="pro-category-badge" style="color:${statusColor}; border-color:${statusColor}; background:${statusColor}10;">${statusLabel}</span>
                
                <button class="btn-outline-pro" style="color:#25D366; border-color:#25D366;" onclick='window.WhatsAppService.shareStartFromAdmin(${JSON.stringify(e).replace(/'/g, "&#39;")})'>
                    <i class="fab fa-whatsapp"></i> WA
                </button>
                <button class="btn-outline-pro" onclick='window.openEditEntrenoModal(${JSON.stringify(e).replace(/'/g, "&#39;")})'>✏️ EDITAR</button>
                <button class="btn-secondary" onclick="window.deleteEntreno('${e.id}')">🗑️</button>
            </div>
        </div>`;
}

function renderCreateForm() {
    return `
        <form id="create-entreno-form" class="pro-form">
            <div class="form-group"><label>NOMBRE</label><input type="text" name="name" class="pro-input" required placeholder="ENTRENO..."></div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                <div class="form-group"><label>FECHA</label><input type="date" name="date" class="pro-input" required></div>
                <div class="form-group"><label>HORA</label><input type="time" name="time" value="10:00" class="pro-input" required></div>
            </div>
            <div class="form-group"><label>CATEGORÍA</label>
                <select name="category" class="pro-input">
                    <option value="open">TODOS</option><option value="male">MASCULINA</option><option value="female">FEMENINA</option><option value="mixed">MIXTA</option>
                </select>
            </div>
            <div class="form-group"><label>SEDE</label>
                <select name="location" class="pro-input">
                    <option value="Barcelona Pádel el Prat">El Prat</option><option value="Delfos Cornellá">Delfos</option>
                </select>
            </div>
            <div class="form-group"><label>MODO</label>
                 <select name="pair_mode" class="pro-input"><option value="fixed">🔒 PAREJA FIJA (Pozo)</option><option value="rotating">🔄 TWISTER (Rotativo)</option></select>
            </div>
            <div class="form-group"><label>IMAGEN</label><select name="image_url" class="pro-input"></select></div> <!-- Populated via JS -->
            
            <button type="submit" class="btn-primary-pro" style="width:100%; margin-top:1rem;">🚀 LANZAR</button>
        </form>
    `;
}

function setupCreateForm() {
    const form = document.getElementById('create-entreno-form');
    if (!form) return;

    // Auto-Sync Logic (Images & Names)
    const cat = form.querySelector('[name=category]');
    const loc = form.querySelector('[name=location]');
    const img = form.querySelector('[name=image_url]');
    const name = form.querySelector('[name=name]');

    const sync = () => {
        const cVal = cat.value;
        const lVal = loc.value;

        // Populate Image Options dynamically could be better, but we just set value logic here
        // Re-injecting options only if empty? 
        if (img.options.length === 0) {
            // Simplified options
            img.innerHTML = `<option value="img/entreno todo prat.jpg">PRAT (General)</option>...`; // Just keeping simple for now? 
            // Actually, let's just leave it simple or user can paste URL? 
            // To match previous UX, we should allow selection. 
            // Im implementing a smart sync:
        }

        // Smart Default
        const autoImg = EventService.getAutoImage(lVal, cVal, 'entreno');
        // We can create a hidden option or just set it if using text input
        // Using a Select with common options
        img.innerHTML = Object.values(AppConstants.IMAGES.PRAT).map(u => `<option value="${u}">${u.split('/').pop()}</option>`).join('') +
            `<option value="img/delfos.png">Delfos</option>`;
        img.value = autoImg;

        // Name Sync
        if (!name.value || name.value.startsWith('ENTRENO')) {
            name.value = `ENTRENO ${cVal.toUpperCase()}`;
        }
    };

    cat.onchange = sync;
    loc.onchange = sync;
    sync(); // Init

    form.onsubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const data = Object.fromEntries(fd.entries());
        try {
            await EventService.createEvent('entreno', data);
            alert("✅ Entreno creado");
            window.loadAdminView('entrenos_mgmt');
        } catch (err) { alert(err.message); }
    };
}


// --- GLOBAL ACTIONS --- //

window.deleteEntreno = async (id) => {
    if (!confirm("Confirmar borrado?")) return;
    await EventService.deleteEvent('entreno', id);
    window.loadAdminView('entrenos_mgmt');
};

window.openEditEntrenoModal = async (entreno) => {
    const modal = document.getElementById('admin-entreno-modal');
    const form = document.getElementById('edit-entreno-form');

    if (!modal || !form) {
        console.error("Edit modal elements not found");
        return;
    }

    // MAP FIELDS
    try {
        if (form.querySelector('[name=id]')) form.querySelector('[name=id]').value = entreno.id;
        if (form.querySelector('[name=name]')) form.querySelector('[name=name]').value = entreno.name || '';
        if (form.querySelector('[name=date]')) form.querySelector('[name=date]').value = entreno.date || '';
        if (form.querySelector('[name=time]')) form.querySelector('[name=time]').value = entreno.time || '10:00';
        if (form.querySelector('[name=time_end]')) form.querySelector('[name=time_end]').value = entreno.time_end || '';
        if (form.querySelector('[name=category]')) form.querySelector('[name=category]').value = entreno.category || 'open';
        if (form.querySelector('[name=location]')) form.querySelector('[name=location]').value = entreno.location || 'Barcelona Pádel el Prat';
        if (form.querySelector('[name=pair_mode]')) form.querySelector('[name=pair_mode]').value = entreno.pair_mode || 'fixed';
        if (form.querySelector('[name=image_url]')) form.querySelector('[name=image_url]').value = entreno.image_url || '';

        // Extra fields
        if (form.querySelector('[name=duration]')) form.querySelector('[name=duration]').value = entreno.duration || '1h 30m';
        if (form.querySelector('[name=status]')) form.querySelector('[name=status]').value = entreno.status || 'open';
        if (form.querySelector('[name=max_courts]')) form.querySelector('[name=max_courts]').value = entreno.max_courts || 4;
        if (form.querySelector('[name=price_members]')) form.querySelector('[name=price_members]').value = entreno.price_members || 20;
        if (form.querySelector('[name=price_external]')) form.querySelector('[name=price_external]').value = entreno.price_external || 25;

        // Preview Image
        const preview = document.getElementById('edit-entreno-img-preview');
        if (preview && entreno.image_url) {
            preview.src = entreno.image_url;
            preview.style.display = 'block';
        }

    } catch (e) { console.error("Error mapping fields", e); }


    modal.classList.remove('hidden');
    modal.style.display = 'flex';

    // ATTACH SUBMIT HANDLER
    form.onsubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const data = Object.fromEntries(fd.entries());
        const id = data.id;
        delete data.id; // Don't update ID

        try {
            // Convert numbers
            if (data.max_courts) data.max_courts = parseInt(data.max_courts);
            if (data.price_members) data.price_members = parseFloat(data.price_members);
            if (data.price_external) data.price_external = parseFloat(data.price_external);

            await EventService.updateEvent('entreno', id, data);
            alert("✅ Entreno actualizado correctamente");

            // Reload View if needed (optional, or just close)
            // Ideally we refresh the list behind
            window.loadAdminView('entrenos_mgmt');

            // Close Modal
            closeEntrenoModal();

        } catch (err) {
            alert("Error al actualizar: " + err.message);
        }
    };

    // Load Sub-UIs (Async)
    window.loadEntrenoParticipantsUI(entreno.id);
    window.loadWaitlistUI(entreno.id);
    if (window.PairsUI) window.PairsUI.load('entreno-fixed-pairs-area', entreno.id, 'entreno');
};

// Global Close Helper
window.closeEntrenoModal = () => {
    const modal = document.getElementById('admin-entreno-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
};


// --- SUB-UI MANAGERS (Using ParticipantService) --- //

window.loadEntrenoParticipantsUI = async (id) => {
    const list = document.getElementById('participants-list-entreno');

    // Legacy elements check (removed in HTML update) or keep reference for safety
    // const select = document.getElementById('add-player-select-entreno'); 
    // const btn = document.getElementById('btn-add-player-entreno');

    if (!list) return;
    list.innerHTML = 'Loading...';

    const [event, users] = await Promise.all([
        EventService.getById('entreno', id),
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
        await EventService.updateEvent('entreno', id, { players: repairedPlayers });
        console.log('✅ IDs reparados automáticamente');
    }

    // Use repaired data for rendering
    const finalPlayers = needsRepair ? repairedPlayers : (event.players || []);

    // NEW: Render Autocomplete
    if (window.PlayerAutocomplete) {
        const enrolledIds = new Set(finalPlayers.map(p => p.id || p.uid));
        window.PlayerAutocomplete.render(
            'autocomplete-container-entreno',
            users,
            enrolledIds,
            async (uid) => {
                try {
                    const user = users.find(u => u.id === uid);
                    if (!user) return;
                    await ParticipantService.addPlayer(id, 'entreno', user);
                    window.loadEntrenoParticipantsUI(id); // Reload
                } catch (e) { alert(e.message); }
            },
            "🔍 Buscar jugador para añadir..."
        );
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
                <button onclick="window.removeEntrenoPlayer('${id}', '${playerId}')" class="btn-delete-micro">🗑️</button>
            </div>
        `;
    }).join('');
};

window.removeEntrenoPlayer = async (eid, uid) => {
    if (!uid || uid === 'undefined' || uid === 'null') {
        alert('❌ Error: No se puede eliminar este jugador (ID inválido). Por favor contacta al administrador.');
        console.error('Invalid player ID:', uid);
        return;
    }

    if (!confirm("Eliminar jugador? Si el evento está en juego, se actualizarán los partidos.")) return;

    try {
        // 1. Get Event and Player Name BEFORE removing
        const event = await EventService.getById(AppConstants.EVENT_TYPES.ENTRENO, eid);
        // FORCE STRING COMPARISON
        const player = (event.players || []).find(p => String(p.id || p.uid) === String(uid));
        const oldName = player ? player.name : '';

        console.log(`🗑️ REMOVE REQUEST: UID=${uid}, FoundName="${oldName}"`);

        // 2. Remove
        const res = await ParticipantService.removePlayer(eid, 'entreno', uid);

        if (res.promoted) {
            alert(`♻️ Sustitución automática: ${oldName} -> ${res.promoted.name}`);
        } else {
            alert(`ℹ️ Jugador eliminado.`);
        }

        if (res.promoted) alert(`Promovido: ${res.promoted.name}`);
        window.loadEntrenoParticipantsUI(eid);
        window.loadWaitlistUI(eid);

    } catch (e) {
        console.error(e);
        alert("Error al eliminar: " + e.message);
    }
};

window.loadWaitlistUI = async (id) => {
    const div = document.getElementById('waitlist-entreno');
    const list = await ParticipantService.getWaitlist(id, 'entreno');
    if (div) div.innerHTML = list.map((p, i) => `<div>${i + 1}. ${p.name}</div>`).join('') || 'Vacía';
};
