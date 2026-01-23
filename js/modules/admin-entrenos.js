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

        // 📅 Get available months for filter list
        const availableMonths = [...new Set(sortedEntrenos.map(e => {
            if (!e.date) return null;
            if (e.date.includes('-')) return e.date.substring(0, 7); // YYYY-MM
            if (e.date.includes('/')) {
                const p = e.date.split('/');
                return `${p[2]}-${p[1].padStart(2, '0')}`;
            }
            return null;
        }))].filter(Boolean).sort((a, b) => b.localeCompare(a));

        const monthNames = { '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril', '05': 'Mayo', '06': 'Junio', '07': 'Julio', '08': 'Agosto', '09': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre' };
        const monthOptions = availableMonths.map(m => {
            const [y, mm] = m.split('-');
            return `<option value="${m}">${monthNames[mm].toUpperCase()} ${y}</option>`;
        }).join('');

        const listHtml = sortedEntrenos.map(e => renderEntrenoCard(e)).join('');

        content.innerHTML = `
            <div class="dashboard-grid-enterprise" style="grid-template-columns: 380px 1fr; gap: 2.5rem;">
                <!-- Create Form Column -->
                <div class="glass-card-enterprise" style="background: var(--grad-dark); height: fit-content; padding: 2rem; position: sticky; top: 20px;">
                    <h3 style="margin-bottom: 2.5rem; color: var(--primary); display: flex; align-items: center; gap: 15px; font-weight: 950; letter-spacing: 1px;">
                        <span style="font-size: 1.5rem;">✨</span> CONFIGURAR ENTRENOS
                    </h3>
                    ${renderCreateForm()}
                </div>
                
                <!-- List Column -->
                <div class="planning-area" id="entrenos-planning-area">
                    <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; gap: 20px;">
                        <div style="flex:1;">
                            <h3 style="margin:0; letter-spacing: 2px; font-size: 0.85rem; color: var(--text-muted); font-weight: 800;">EVENTOS EN EL RADAR</h3>
                        </div>
                    </div>

                    <!-- 🔍 ADVANCED FILTERS BAR -->
                    <div class="filter-bar-pro" style="display: grid; grid-template-columns: 1.5fr 1fr 1fr 1fr auto; gap: 10px; margin-bottom: 2rem; background: rgba(255,255,255,0.02); padding: 15px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); align-items: center;">
                        <div style="position:relative;">
                            <i class="fas fa-search" style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:rgba(255,255,255,0.3); font-size:0.8rem;"></i>
                            <input type="text" id="entreno-search-input" placeholder="Buscar por nombre..." 
                                style="padding-left:35px; height:40px; font-size:0.8rem; width:100%; border-radius:10px; background:rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); color: white;">
                        </div>
                        <select id="filter-month" style="height:40px; border-radius:10px; background:#1a1c23; color:white; border:1px solid rgba(255,255,255,0.1); font-size:0.75rem; font-weight:700; padding:0 10px; cursor:pointer;">
                            <option value="all">TODOS LOS MESES</option>
                            ${monthOptions}
                        </select>
                        <select id="filter-status" style="height:40px; border-radius:10px; background:#1a1c23; color:white; border:1px solid rgba(255,255,255,0.1); font-size:0.75rem; font-weight:700; padding:0 10px; cursor:pointer;">
                            <option value="all">TODOS LOS ESTADOS</option>
                            <option value="open">🟢 ABIERTAS</option>
                            <option value="live">🎾 EN JUEGO</option>
                            <option value="finished">🏁 FINALIZADAS</option>
                            <option value="cancelled">⛔ ANULADAS</option>
                            <option value="pairing">🔀 EMPAREJAMIENTO</option>
                        </select>
                        <select id="filter-category" style="height:40px; border-radius:10px; background:#1a1c23; color:white; border:1px solid rgba(255,255,255,0.1); font-size:0.75rem; font-weight:700; padding:0 10px; cursor:pointer;">
                            <option value="all">TODAS LAS CATEGORÍAS</option>
                            <option value="male">MASCULINA</option>
                            <option value="female">FEMENINA</option>
                            <option value="mixed">MIXTA</option>
                            <option value="open">OPEN</option>
                        </select>
                        <button class="btn-outline-pro" onclick="loadAdminView('entrenos_mgmt')" style="padding: 0 1rem; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center;">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                    </div>

                    <div class="entreno-scroll-list" id="entrenos-list-container">
                        ${listHtml.length ? listHtml : '<div class="glass-card-enterprise" style="text-align:center; padding: 4rem; color: var(--text-muted);">No hay entrenos operativos.</div>'}
                    </div>
                </div>
            </div>`;

        // setup Search & Filter Logic
        const searchInput = document.getElementById('entreno-search-input');
        const monthSelect = document.getElementById('filter-month');
        const statusSelect = document.getElementById('filter-status');
        const catSelect = document.getElementById('filter-category');

        const applyFilters = () => {
            const query = searchInput?.value.toLowerCase() || '';
            const month = monthSelect?.value || 'all';
            const status = statusSelect?.value || 'all';
            const cat = catSelect?.value || 'all';

            const cards = document.querySelectorAll('#entrenos-list-container > .entreno-card-item');
            cards.forEach(card => {
                const cMonth = card.getAttribute('data-month');
                const cStatus = card.getAttribute('data-status');
                const cCat = card.getAttribute('data-category');
                const cText = card.innerText.toLowerCase();

                const matchesSearch = !query || cText.includes(query);
                const matchesMonth = month === 'all' || cMonth === month;
                const matchesStatus = status === 'all' || cStatus === status;
                const matchesCat = cat === 'all' || cCat === cat;

                card.style.display = (matchesSearch && matchesMonth && matchesStatus && matchesCat) ? 'flex' : 'none';
            });
        };

        if (searchInput) searchInput.oninput = applyFilters;
        if (monthSelect) monthSelect.onchange = applyFilters;
        if (statusSelect) statusSelect.onchange = applyFilters;
        if (catSelect) catSelect.onchange = applyFilters;

        setupCreateForm();

        // Admin Automation Loop (runs every 30s)
        if (window.adminAutoInterval) clearInterval(window.adminAutoInterval);

        const runAutomation = () => {
            console.log("🤖 [AdminBot] Checking for auto-start events...");
            EventService.getAll(AppConstants.EVENT_TYPES.ENTRENO).then(evts => {
                const now = new Date();
                evts.forEach(evt => {
                    // Parse Time: "10:00 - 11:30" or "10:00"
                    let start, end;
                    try {
                        const parts = (evt.time || '10:00').split('-').map(s => s.trim());

                        // Fix Date Pasring (Handle YYYY-MM-DD and DD/MM/YYYY)
                        let dateIso = evt.date;
                        if (evt.date && evt.date.includes('/')) {
                            const [d, m, y] = evt.date.split('/');
                            dateIso = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
                        }

                        start = new Date(`${dateIso}T${parts[0]}:00`);
                        if (parts[1]) end = new Date(`${dateIso}T${parts[1]}:00`);
                        else end = new Date(start.getTime() + 90 * 60000); // 90 mins default

                        // Debug log to confirm parsing works now
                        // console.log(`[BotDebug] ${evt.name} | Start: ${start.toLocaleString()} | Now: ${now.toLocaleString()}`);
                    } catch (e) { console.error("Date Parse Error", e); return; }

                    // 1. OPEN/PAIRING -> LIVE
                    if ((evt.status === 'open' || evt.status === 'pairing') && now >= start && now < end) {
                        const players = evt.players || [];
                        const isTwister = evt.name && evt.name.toUpperCase().includes('TWISTER');
                        // Default courts: 4 (16 players) unless Twister (3 courts = 12 players)
                        const reqPlayers = (parseInt(evt.courts) || (isTwister ? 3 : 4)) * 4;

                        // Allow start if >= 75% capacity filled or manual override needed? 
                        // For auto-start we usually want full or near full. 
                        // Keeping existing logic: >= reqPlayers (Full)
                        // Or maybe we should relax it? The user said "sincronizado ... importante". 
                        // Let's stick to existing condition but robustify the execution.
                        if (players.length >= reqPlayers) {
                            console.log(`⚡ Admin Auto-Start: ${evt.name}`);

                            EventService.updateEvent('entreno', evt.id, { status: 'live' })
                                .then(async () => {
                                    // Robust Match Generation (using MatchMakingService)
                                    if (window.MatchMakingService) {
                                        try {
                                            // Check R1 existence first
                                            const r1 = await window.db.collection('entrenos_matches')
                                                .where('americana_id', '==', evt.id)
                                                .where('round', '==', 1)
                                                .limit(1).get();

                                            if (r1.empty) {
                                                console.log(`🎲 Generating R1 for auto-started event ${evt.name}...`);
                                                await window.MatchMakingService.generateRound(evt.id, 'entreno', 1);
                                            } else {
                                                console.log(`✅ Matches already exist for ${evt.name}, skipping generation.`);
                                            }
                                        } catch (err) {
                                            console.error("❌ Auto-start match gen failed:", err);
                                        }
                                    }
                                })
                                .then(() => loadAdminView('entrenos_mgmt')); // Refresh UI
                        }
                    }
                    // 1.5. OPEN -> PAIRING (4 hours before)
                    else if (evt.status === 'open') {
                        const diffMs = start - now;
                        const diffHours = diffMs / (1000 * 60 * 60);

                        // If within 4 hours (and not already started)
                        if (diffHours <= 4 && diffHours > 0) {
                            console.log(`🔀 Admin Auto-Pairing Mode: ${evt.name}`);
                            EventService.updateEvent('entreno', evt.id, { status: 'pairing' })
                                .then(() => loadAdminView('entrenos_mgmt'));
                        }
                    }
                    // 2. LIVE -> FINISHED
                    else if (evt.status === 'live' && now >= end) {
                        console.log(`🏁 Admin Auto-Finish: ${evt.name}`);
                        EventService.updateEvent('entreno', evt.id, { status: 'finished' })
                            .then(() => loadAdminView('entrenos_mgmt'));
                    }
                    // 3. SMART REVERT: LIVE -> OPEN (If time modified to future)
                    else if (evt.status === 'live' && now < start) {
                        console.log(`⏪ Smart Revert: ${evt.name} back to OPEN (Future Time)`);
                        EventService.updateEvent('entreno', evt.id, { status: 'open' })
                            .then(() => loadAdminView('entrenos_mgmt'));
                    }
                });
            });
        };

        window.adminAutoInterval = setInterval(runAutomation, 30000);
        runAutomation(); // Run once immediately

    } catch (e) {
        content.innerHTML = `<div class="error-box">Error loading entrenos: ${e.message}</div>`;
    }
};

// --- HELPER RENDERING FUNCTIONS --- //

function renderEntrenoCard(e) {
    const playersCount = e.players?.length || 0;
    const maxPlayers = (parseInt(e.max_courts) || 4) * 4;

    const isCancelled = e.status === 'cancelled';
    const statusLabel = e.status === 'live' ? 'EN JUEGO' : e.status === 'finished' ? 'FINALIZADA' : e.status === 'pairing' ? 'EMPAREJAMIENTO' : (isCancelled ? 'ANULADO' : 'ABIERTA');
    const statusColor = e.status === 'live' ? '#FF2D55' : e.status === 'finished' ? '#888' : e.status === 'pairing' ? '#22D3EE' : (isCancelled ? '#F43F5E' : '#00E36D');

    // Generate Month Key for Filtering (Standardized YYYY-MM)
    let eMonth = '';
    if (e.date && e.date.includes('-')) eMonth = e.date.substring(0, 7);
    else if (e.date && e.date.includes('/')) {
        const p = e.date.split('/');
        eMonth = `${p[2]}-${p[1].padStart(2, '0')}`;
    }

    // Normalize category for filtering (male, female, mixed, open)
    const rawCat = (e.category || 'open').toLowerCase();
    const normalizedCat = rawCat.includes('masculina') || rawCat === 'male' ? 'male' :
        (rawCat.includes('femenina') || rawCat === 'female' ? 'female' :
            (rawCat.includes('mixt') || rawCat === 'mixed' ? 'mixed' : 'open'));

    return `
        <div class="glass-card-enterprise entreno-card-item" 
             data-month="${eMonth}" 
             data-status="${e.status || 'open'}" 
             data-category="${normalizedCat}"
             style="margin-bottom: 1.2rem; display: flex; justify-content: space-between; align-items: center; padding: 1.2rem; border-left: 4px solid ${statusColor}; background: linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%);">
            <div style="display: flex; gap: 1.2rem; align-items: center; flex: 1;">
                <div class="entreno-preview-img" style="width: 70px; height: 70px; border-radius: 12px; background: url('${e.image_url || 'img/logo_somospadel.png'}') center/cover; border: 1px solid rgba(255,255,255,0.1); position:relative;">
                    <div style="position:absolute; bottom:-5px; right:-5px; background:${statusColor}; width:12px; height:12px; border-radius:50%; border:2px solid #1a1c23;"></div>
                </div>
                <div class="entreno-info-pro" style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 0.3rem;">
                        <div style="font-weight: 950; font-size: 1.2rem; color: #FFFFFF;">${e.name.toUpperCase()}</div>
                        <div style="
                            background: ${e.pair_mode === 'rotating' ? 'rgba(34, 211, 238, 0.1)' : 'rgba(168, 85, 247, 0.1)'}; 
                            color: ${e.pair_mode === 'rotating' ? '#22d3ee' : '#a855f7'}; 
                            padding: 2px 6px; 
                            border-radius: 4px; 
                            font-size: 0.6rem; 
                            font-weight: 800; 
                            text-transform: uppercase;
                        ">
                            ${e.pair_mode === 'rotating' ? '🌪️ TWISTER' : '🔒 FIJA'}
                        </div>
                    </div>
                    <div style="display: flex; gap: 1rem; font-size: 0.75rem; color: var(--text-muted); flex-wrap: wrap;">
                         <span>📅 <span style="color:#eee">${e.date}</span></span>
                         <span>🕒 <span style="color:#eee">${e.time || '10:00'}</span></span>
                         <span onclick='window.openEditEntrenoModal(${JSON.stringify(e).replace(/'/g, "&#39;")})' style="cursor:pointer;" title="Gestionar participantes">👥 <span style="color:var(--primary); font-weight:800;">${playersCount}</span><span style="opacity:0.5">/${maxPlayers}</span></span>
                    </div>
                </div>
            </div>
            
            <!-- RIGHT ACTIONS AREA -->
            <div style="display: flex; align-items: center; gap: 12px;">
                
                <!-- Status Selector (Dropdown) -->
                <div style="position: relative; min-width: 140px;">
                    <select onchange="window.updateEntrenoStatus('${e.id}', this.value)" 
                            style="
                                width: 100%;
                                appearance: none; 
                                background: ${statusColor}15; 
                                color: #FFFFFF; 
                                border: 1px solid ${statusColor}; 
                                padding: 8px 10px; 
                                border-radius: 8px; 
                                font-weight: 800; 
                                font-size: 0.7rem; 
                                cursor: pointer; 
                                text-align: center;
                                outline: none;
                                text-transform: uppercase;
                                letter-spacing: 1px;
                            ">
                        <option value="open" ${e.status === 'open' ? 'selected' : ''}>🟢 ABIERTA</option>
                        <option value="pairing" ${e.status === 'pairing' ? 'selected' : ''}>🔀 EMPAREJAMIENTO</option>
                        <option value="live" ${e.status === 'live' ? 'selected' : ''}>🎾 EN JUEGO</option>
                        <option value="finished" ${e.status === 'finished' ? 'selected' : ''}>🏁 FINALIZADA</option>
                        <option value="cancelled" ${e.status === 'cancelled' ? 'selected' : ''}>⛔ ANULADO</option>
                    </select>
                    <i class="fas fa-chevron-down" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); font-size: 0.6rem; color: #FFFFFF; pointer-events: none;"></i>
                </div>

                <!-- Action Menu -->
                <div style="display: flex; gap: 6px;">
                    <button class="btn-micro" 
                            style="background:rgba(37, 211, 102, 0.1); color:#25D366;" 
                            onclick='window.WhatsAppService.shareStartFromAdmin(${JSON.stringify(e).replace(/'/g, "&#39;")})'
                            title="Enviar WhatsApp">
                        <i class="fab fa-whatsapp"></i>
                    </button>
                    <button class="btn-micro" style="background:rgba(255,255,255,0.05);" onclick='window.duplicateEntreno(${JSON.stringify(e).replace(/'/g, "&#39;")})' title="Duplicar">📋</button>
                    <button class="btn-micro" style="background:rgba(255,255,255,0.05);" onclick='window.openEditEntrenoModal(${JSON.stringify(e).replace(/'/g, "&#39;")})' title="Editar">✏️</button>
                    <button class="btn-micro" style="background:rgba(239, 68, 68, 0.1); color:#ef4444;" onclick="window.deleteEntreno('${e.id}')" title="Eliminar">🗑️</button>
                </div>

                <!-- Price Badge -->
                <div style="background:rgba(255,255,255,0.05); padding:8px 12px; border-radius:8px; font-size:0.75rem; font-weight:900; color:var(--primary); min-width:60px; text-align:center; border: 1px solid rgba(255,255,255,0.05);">
                    ${e.price_members || 20}€
                </div>
            </div>
        </div>`;
}

function renderCreateForm() {
    return `
        <form id="create-entreno-form" class="pro-form compact-admin-form">
            <div class="form-group">
                <label><i class="fas fa-signature"></i> NOMBRE DEL ENTRENO</label>
                <input type="text" name="name" class="pro-input" required placeholder="ENTRENO...">
            </div>
            
            <div style="display:grid; grid-template-columns:1.5fr 1fr; gap:12px;">
                <div class="form-group">
                    <label><i class="fas fa-calendar"></i> FECHA</label>
                    <input type="date" name="date" class="pro-input" required>
                </div>
                <div class="form-group">
                    <label><i class="fas fa-clock"></i> HORA</label>
                    <input type="time" name="time" value="10:00" class="pro-input" required>
                </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                <div class="form-group">
                    <label><i class="fas fa-tags"></i> CATEGORÍA</label>
                    <select name="category" class="pro-input">
                        <option value="open">TODOS</option>
                        <option value="male">MASCULINA</option>
                        <option value="female">FEMENINA</option>
                        <option value="mixed">MIXTA</option>
                    </select>
                </div>
                <div class="form-group">
                    <label><i class="fas fa-map-marker-alt"></i> SEDE</label>
                    <select name="location" class="pro-input">
                        <option value="Barcelona Pádel el Prat">El Prat</option>
                        <option value="Delfos Cornellá">Delfos</option>
                    </select>
                </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1.2fr; gap:12px;">
                <div class="form-group">
                    <label><i class="fas fa-users"></i> MODO</label>
                    <select name="pair_mode" class="pro-input">
                         <option value="fixed">🔒 PAREJA FIJA</option>
                         <option value="rotating">🌪️ TWISTER</option>
                    </select>
                </div>
                <div class="form-group">
                    <label><i class="fas fa-image"></i> IMAGEN</label>
                    <select name="image_url" class="pro-input"></select>
                </div>
            </div>
            
            <button type="submit" class="btn-primary-pro" style="width:100%; margin-top:1.5rem; height: 50px; font-weight: 900; letter-spacing: 1px;">LANZAR ENTRENO 🚀</button>
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
            const newEventId = await EventService.createEvent('entreno', data);

            // --- NOTIFICATION: NEW ENTRENO (BROADCAST TO ACTIVE USERS) ---
            if (window.NotificationService && window.db) {
                try {
                    // Send to top 50 active users to avoid client-side overload
                    // We assume 'players' collection is cached or cheap enough
                    const usersSnap = await window.db.collection('players')
                        .orderBy('lastLogin', 'desc') // Requires index? If fails, fallback to simple limit
                        .limit(50)
                        .get();

                    if (!usersSnap.empty) {
                        const notifPromises = usersSnap.docs.map(doc => {
                            return window.NotificationService.sendNotificationToUser(
                                doc.id,
                                "Nuevo Entreno Disponible",
                                `Se ha publicado: ${data.name} en ${data.location}. ¡Apúntate!`,
                                { url: 'live', eventId: newEventId }
                            );
                        });
                        console.log(`🔔 Notifying ${notifPromises.length} active users about new entreno...`);
                    }
                } catch (notifErr) {
                    console.warn("Notification broadcast failed (check indexes?):", notifErr);
                    // Fallback: Notify at least the admin/me for verification
                    // window.NotificationService.sendNotificationToUser(window.currentUser.uid, ...)
                }
            }

            alert("✅ Entreno creado y notificado");
            window.loadAdminView('entrenos_mgmt');
        } catch (err) { alert(err.message); }
    };
}


// --- GLOBAL ACTIONS --- //

window.duplicateEntreno = async (e) => {
    if (!confirm(`¿Duplicar "${e.name}"? Se creará una copia en estado ABIERTO.`)) return;

    // Create copy without ID and reset status/players
    const copy = { ...e };
    delete copy.id;
    copy.status = 'open';
    copy.players = [];
    copy.waitlist = [];
    copy.fixed_pairs = [];

    // Suggest next week date
    try {
        if (copy.date) {
            const current = new Date(copy.date);
            current.setDate(current.getDate() + 7);
            const y = current.getFullYear();
            const m = String(current.getMonth() + 1).padStart(2, '0');
            const d = String(current.getDate()).padStart(2, '0');
            copy.date = `${y}-${m}-${d}`;
        }
    } catch (err) { console.warn("Date suggest failed", err); }

    try {
        await EventService.createEvent('entreno', copy);
        if (window.NotificationService) NotificationService.showToast("Entreno duplicado para la próxima semana", "success");
        window.loadAdminView('entrenos_mgmt');
    } catch (err) { alert(err.message); }
};

window.updateEntrenoStatus = async (id, newStatus) => {
    try {
        const evt = await EventService.getById('entreno', id);
        if (!evt) throw new Error("Evento no encontrado");

        await EventService.updateEvent('entreno', id, { status: newStatus });

        // AUTO-START ROUND 1 CHECK
        if (newStatus === 'live' && window.MatchMakingService) {
            const r1 = await window.db.collection('entrenos_matches')
                .where('americana_id', '==', id)
                .where('round', '==', 1)
                .limit(1).get();
            if (r1.empty) {
                try {
                    await window.MatchMakingService.generateRound(id, 'entreno', 1);
                    console.log("✅ Ronda 1 generada automáticamente.");
                } catch (e) {
                    console.error(e);
                    alert("⚠️ Estado cambiado a EN JUEGO, pero falló la generación de R1: " + e.message);
                }
            }
        }

        // --- BROADCAST NOTIFICATION (AUTOMATIC FOR ALL STATUS CHANGES) ---
        if (window.NotificationService) {
            const statusMap = {
                'cancelled': { title: "⛔ EVENTO ANULADO", body: `⚠️ ATENCIÓN: El evento ${evt.name} ha sido ANULADO.`, url: 'finished' },
                'live': { title: "🎾 ¡EN JUEGO!", body: `El evento ${evt.name} ya ha comenzado. ¡Sigue los resultados en vivo!`, url: 'live' },
                'pairing': { title: "🔀 EMPAREJAMIENTOS", body: `Ya puedes ver las parejas y pistas para ${evt.name}.`, url: 'live' },
                'finished': { title: "🏁 FINALIZADO", body: `El evento ${evt.name} ha terminado. Consulta los resultados.`, url: 'finished' },
                'open': { title: "🟢 INSCRIPCIONES ABIERTAS", body: `¡Atención! el evento ${evt.name} vuelve a estar ABIERTO. ¡Apúntate ya!`, url: 'live' }
            };

            const config = statusMap[newStatus];
            if (config) {
                console.log("🔔 Broadcast automático para estado:", newStatus);
                await window.broadcastCommunityNotification(config.title, config.body, {
                    url: config.url,
                    eventId: id,
                    push: true
                });
            }
        }

        window.loadAdminView('entrenos_mgmt');

    } catch (e) {
        alert("Error cambiando estado: " + e.message);
        window.loadAdminView('entrenos_mgmt');
    }
};

// Helper for broadcasting to top 50 active users
window.broadcastCommunityNotification = async (title, body, payload = {}) => {
    if (!window.NotificationService || !window.db) return;
    try {
        // Aumentamos el límite a 500 para cubrir a "toda la comunidad" activa
        let usersSnap;
        try {
            usersSnap = await window.db.collection('players')
                .orderBy('lastLogin', 'desc')
                .limit(500)
                .get();
        } catch (e) {
            console.warn("⚠️ Fallo ordenando por lastLogin (posible falta de índice). Intentando backup simple...");
            usersSnap = await window.db.collection('players').limit(500).get();
        }

        if (!usersSnap.empty) {
            const promises = usersSnap.docs.map(doc =>
                window.NotificationService.sendNotificationToUser(doc.id, title, body, payload)
            );
            await Promise.all(promises);
            console.log(`📣 Broadcast completado a ${promises.length} usuarios.`);
        }
    } catch (err) {
        console.warn("Broadcast failed:", err);
    }
};

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

            // --- BROADCAST AUTOMATICO AL EDITAR ---
            if (window.NotificationService && data.status) {
                const statusMap = {
                    'cancelled': { title: "⛔ EVENTO ANULADO", body: `⚠️ ATENCIÓN: El evento ${data.name} ha sido ANULADO.`, url: 'finished' },
                    'live': { title: "🎾 ¡EN JUEGO!", body: `${data.name} ya ha comenzado.`, url: 'live' },
                    'pairing': { title: "🔀 EMPAREJAMIENTOS", body: `Parejas disponibles para ${data.name}.`, url: 'live' },
                    'finished': { title: "🏁 FINALIZADO", body: `Consulta resultados de ${data.name}.`, url: 'finished' },
                    'open': { title: "🟢 INSCRIPCIONES ABIERTAS", body: `¡Atención! El evento ${data.name} vuelve a estar ABIERTO.`, url: 'live' }
                };

                const config = statusMap[data.status];
                if (config) {
                    console.log("🔔 Broadcast desde Modal para:", data.status);
                    await window.broadcastCommunityNotification(config.title, config.body, {
                        url: config.url,
                        eventId: id,
                        push: true
                    });
                }
            }

            // --- AUTO-START LOGIC: GENERATE ROUND 1 ---
            if (data.status === 'live') {
                console.log("🚀 Entreno set to LIVE. Checking/Generating Round 1...");
                if (window.MatchMakingService) {
                    const r1 = await window.db.collection('entrenos_matches')
                        .where('americana_id', '==', id)
                        .where('round', '==', 1)
                        .limit(1).get();

                    if (r1.empty) {
                        try {
                            await window.MatchMakingService.generateRound(id, 'entreno', 1);
                            alert("✅ Ronda 1 generada automáticamente. ¡A jugar!");
                        } catch (genErr) {
                            console.error("Auto-start error:", genErr);
                            alert("⚠️ El evento está EN JUEGO, pero la Ronda 1 no se pudo generar: " + genErr.message);
                        }
                    }
                }
            }

            alert("✅ Entreno actualizado correctamente");

            // --- NOTIFICATION: EVENT UPDATE (ENROLLED ONLY) ---
            // Only if important changes (Date, Time, Status)
            if (window.NotificationService && (data.status === 'live' || data.status === 'cancelled' || data.date || data.time)) {
                try {
                    // Fetch fresh event data to get players
                    const updatedEvt = await EventService.getById('entreno', id);
                    if (updatedEvt && updatedEvt.players && updatedEvt.players.length > 0) {
                        const isLive = data.status === 'live';
                        const isCancelled = data.status === 'cancelled';

                        let title = "Actualización de Entreno";
                        let msg = `Hubo cambios en ${updatedEvt.name}. Revisa los detalles.`;

                        if (isLive) {
                            title = "¡ENTRENO EN JUEGO!";
                            msg = `${updatedEvt.name} ha comenzado. ¡Consulta tus partidos!`;
                        } else if (isCancelled) {
                            title = "⛔ EVENTO CANCELADO";
                            msg = `El evento ${updatedEvt.name} ha sido ANULADO. Consultar detalles.`;
                        }

                        if (isCancelled && !confirm(`¿Enviar alerta de CANCELACIÓN a ${updatedEvt.players.length} jugadores?`)) {
                            // User cancelled the notification part
                        } else {
                            updatedEvt.players.forEach(p => {
                                const pid = p.uid || p.id;
                                window.NotificationService.sendNotificationToUser(
                                    pid,
                                    title,
                                    msg,
                                    { url: isCancelled ? 'finished' : 'live', eventId: id }
                                ).catch(e => { });
                            });
                            console.log(`🔔 Notified ${updatedEvt.players.length} players of update.`);
                        }
                    }
                } catch (e) { console.warn("Update notif failed", e); }
            }

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

window.selectEntrenoImage = (url) => {
    const input = document.getElementById('edit-entreno-img-input');
    const preview = document.getElementById('edit-entreno-img-preview');
    if (input) {
        input.value = url;
        if (preview) {
            preview.src = url;
            preview.style.display = 'block';
        }
    }
};
