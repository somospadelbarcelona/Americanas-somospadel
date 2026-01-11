
window.AdminViews = window.AdminViews || {};

window.AdminViews.americanas_mgmt = async function () {
    const content = document.getElementById('content-area');
    const titleEl = document.getElementById('page-title');

    if (titleEl) titleEl.textContent = 'Centro de Planificación de Americanas';
    content.innerHTML = '<div class="loader"></div>';

    const americanas = await FirebaseDB.americanas.getAll();
    const listHtml = americanas.map(a => `
        <div class="glass-card-enterprise" style="margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; border-left: 4px solid var(--primary); background: linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%);">
            <div style="display: flex; gap: 1.5rem; align-items: center; flex: 1;">
                <div class="americana-preview-img" style="width: 90px; height: 90px; border-radius: 16px; background: url('${a.image_url || 'img/logo_somospadel.png'}') center/cover; border: 2px solid rgba(204,255,0,0.2); box-shadow: 0 4px 15px rgba(0,0,0,0.1);"></div>
                <div class="americana-info-pro" style="flex: 1;">
                    <div style="font-weight: 900; font-size: 1.5rem; color: #FFFFFF; margin-bottom: 0.5rem; text-shadow: 0 2px 4px rgba(0,0,0,0.3); letter-spacing: 0.5px; line-height: 1.2;">${a.name.toUpperCase()}</div>
                    <div style="display: flex; gap: 1.5rem; font-size: 0.85rem; color: var(--text-muted); flex-wrap: wrap; margin-top: 0.5rem;">
                        <span style="display: flex; align-items: center; gap: 6px;">📅 <span style="color: #FFFFFF; font-weight: 600;">${a.date}</span></span>
                        <span style="display: flex; align-items: center; gap: 6px;">🕒 <span style="color: #FFFFFF; font-weight: 600;">${a.time || '18:30'}</span></span>
                        <span style="display: flex; align-items: center; gap: 6px;">🎾 <span style="color: #FFFFFF; font-weight: 600;">${a.max_courts || 4} Pistas</span></span>
                        <span style="display: flex; align-items: center; gap: 6px;">👥 <span style="color: var(--primary); font-weight: 700;">${a.players?.length || 0} Inscritos</span></span>
                    </div>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                 <!-- Category Badge -->
                <span class="pro-category-badge" style="background: var(--primary); color: black; font-weight: 800; padding: 6px 14px; display: flex; align-items: center; gap: 6px; font-size: 0.75rem;">
                    ${a.category === 'female' ? '🚺' : (a.category === 'male' ? '🚹' : (a.category === 'mixed' ? '👫' : '🎾'))}
                    ${(a.category === 'open' ? 'TODOS' : (a.category === 'male' ? 'MASCULINA' : (a.category === 'female' ? 'FEMENINA' : (a.category === 'mixed' ? 'MIXTA' : 'TODOS')))).toUpperCase()}
                </span>

                <!-- Pair Mode Badge (New) -->
                <span class="pro-category-badge" style="background: rgba(255, 255, 255, 0.1); color: white; font-weight: 700; padding: 6px 14px; border: 1px solid rgba(255,255,255,0.2); display: flex; align-items: center; gap: 6px; font-size: 0.75rem;">
                     ${a.pair_mode === 'fixed' ? '🔒' : '🔄'}
                     ${a.pair_mode === 'fixed' ? 'FIJA' : 'TWISTER'}
                </span>
                
                <!-- PRICE SUMMARY -->
                <span class="pro-category-badge" style="background: transparent; color: #aaa; border: 1px solid #444; font-size: 0.65rem;">
                     ${a.price_members || 12}€ / ${a.price_external || 14}€
                </span>

                <!-- Status Badge (New) -->
                <span class="pro-category-badge" style="background: ${a.status === 'live' ? 'rgba(255, 45, 85, 0.1)' : (a.status === 'finished' ? 'rgba(136, 136, 136, 0.1)' : 'rgba(0, 227, 109, 0.1)')}; color: ${a.status === 'live' ? '#FF2D55' : (a.status === 'finished' ? '#888' : '#00E36D')}; border: 1px solid ${a.status === 'live' ? '#FF2D55' : (a.status === 'finished' ? '#444' : '#00E36D')}; font-size: 0.65rem; font-weight: 800; padding: 6px 14px; min-width: 90px; text-align: center;">
                     ${(a.status === 'open' ? 'ABIERTA' : (a.status === 'live' ? 'EN JUEGO' : (a.status === 'finished' ? 'FINALIZADA' : (a.status || 'ABIERTA')))).toUpperCase()}
                </span>

                <button class="btn-outline-pro" style="border-radius: 12px; padding: 10px 16px; display: flex; align-items: center; gap: 8px; border-color: var(--primary); color: var(--primary); font-weight: 700; font-size: 0.8rem;" 
                        onclick='openEditAmericanaModal(${JSON.stringify(a).replace(/'/g, "&#39;")})' title="Editar Evento">✏️ EDITAR</button>
                <button class="btn-secondary" style="border-radius: 12px; padding: 10px 16px; display: flex; align-items: center; gap: 8px; border-color: var(--danger-dim); color: var(--danger); font-weight: 700; font-size: 0.8rem;" 
                        onclick="deleteAmericana('${a.id}')" title="Eliminar Permanente">🗑️ BORRAR</button>
            </div>
        </div>`).join('');

    content.innerHTML = `
        <div class="dashboard-grid-enterprise" style="grid-template-columns: 400px 1fr; gap: 2.5rem;">
            <div class="glass-card-enterprise" style="background: var(--grad-dark); height: fit-content; padding: 2rem;">
                <h3 style="margin-bottom: 2rem; color: var(--primary); display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 1.5rem;">✨</span> CONFIGURAR AMERICANAS
                </h3>
                <form id="create-americana-form" class="pro-form">
                    <div class="form-group">
                        <label>NOMBRE DEL EVENTO</label>
                        <input type="text" name="name" placeholder="Ej: VIERNES PRO LEAGUE" class="pro-input" required>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div class="form-group">
                            <label>FECHA</label>
                            <input type="date" name="date" class="pro-input" required>
                        </div>
                        <div class="form-group">
                            <label>HORA</label>
                            <input type="time" name="time" value="18:30" class="pro-input" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>CATEGORÍA DEL TORNEO</label>
                        <select name="category" class="pro-input">
                            <option value="open">TODOS</option>
                            <option value="male">MASCULINA</option>
                            <option value="female">FEMENINA</option>
                            <option value="mixed">MIXTA</option>
                        </select>
                    </div>

                    <!-- NUEVO: Selector de Sede -->
                    <div class="form-group">
                        <label>SEDE DEL EVENTO</label>
                        <select name="location" class="pro-input">
                            <option value="Barcelona Pádel el Prat">Barcelona Pádel el Prat</option>
                            <option value="Delfos Cornellá">Delfos Cornellá</option>
                        </select>
                    </div>

                    <!-- NUEVO: Modo de Parejas -->
                    <div class="form-group">
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <span>🎯 MODO DE PAREJAS</span>
                            <span style="font-size: 0.65rem; color: #888; font-weight: 400;">(Importante)</span>
                        </label>
                        <select name="pair_mode" class="pro-input" style="font-weight: 700;">
                            <option value="fixed">🔒 PAREJA FIJA (Pozo - Suben/Bajan Juntos)</option>
                            <option value="rotating">🔄 TWISTER (Americana Tradicional)</option>
                        </select>
                        <div style="margin-top: 8px; padding: 10px; background: rgba(204,255,0,0.05); border-radius: 6px; border: 1px solid rgba(204,255,0,0.1);">
                            <div style="font-size: 0.7rem; color: #888; line-height: 1.5;">
                                <strong style="color: var(--primary);">Fijas:</strong> Misma pareja todo el torneo, suben/bajan pistas según resultados<br>
                                    <strong style="color: var(--primary);">Rotativas:</strong> Cambias de compañero cada ronda
                            </div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>PLANTILLA VISUAL (IMAGEN)</label>
                        <select name="image_url" class="pro-input">
                            <option value="img/americana mixta.jpg">AMERICANA TODOS (EL PRAT)</option>
                            <option value="img/americana masculina.jpg">AMERICANA MASCULINA (EL PRAT)</option>
                            <option value="img/americana femeninas.jpg">AMERICANA FEMENINA (EL PRAT)</option>
                            <option value="img/americana mixta.jpg">AMERICANA MIXTA (EL PRAT)</option>
                            <option value="img/ball-mixta.png">PELOTA SOMOSPADEL (AMARILLO)</option>
                            <option value="img/ball-masculina.png">PELOTA SOMOSPADEL (VERDE)</option>
                            <option value="img/ball-femenina.png">PELOTA SOMOSPADEL (ROSA)</option>
                            <option value="img/americana-pro.png">SALA PRO (NEÓN AMARILLO)</option>
                            <option value="img/americana-night.png">NIGHT SESSION (AZUL/PÚRPURA)</option>
                            <option value="img/americana-mixed.png">MIXED VIBES (NARANJA/ROJO)</option>
                            <option value="img/logo_somospadel.png">LOGOTIPO CLUB</option>
                        </select>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div class="form-group">
                            <label>DURACIÓN</label>
                            <input type="text" name="duration" value="2h" class="pro-input">
                        </div>
                        <div class="form-group">
                            <label>MAX. PISTAS</label>
                            <input type="number" name="max_courts" value="4" class="pro-input">
                        </div>
                    </div>
                    <!-- PRECIOS -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div class="form-group">
                            <label>PRECIO SOCIOS (€)</label>
                            <input type="number" name="price_members" value="12" class="pro-input">
                        </div>
                        <div class="form-group">
                            <label>PRECIO EXTERNOS (€)</label>
                            <input type="number" name="price_external" value="14" class="pro-input">
                        </div>
                    </div>
                    <button type="submit" class="btn-primary-pro" style="width: 100%; margin-top: 1rem; padding: 1.2rem;">LANZAR EVENTO ELITE 🚀</button>
                </form>
            </div>
            <div class="planning-area">
                <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <h3 style="margin:0; letter-spacing: 2px; font-size: 0.85rem; color: var(--text-muted); font-weight: 800;">EVENTOS EN EL RADAR</h3>
                    <button class="btn-outline-pro" style="padding: 0.6rem 1.2rem; font-size: 0.75rem;" onclick="loadAdminView('americanas_mgmt')">REFRESCAR SISTEMA</button>
                </div>
                <div class="americana-scroll-list" style="max-height: 75vh; overflow-y: auto; padding-right: 15px;">
                    ${listHtml || '<div class="glass-card-enterprise" style="text-align:center; padding: 4rem; color: var(--text-muted);">No hay eventos operativos. Comienza creando uno.</div>'}
                </div>
            </div>
        </div>`;

    // Synchronization Logic for Create Form
    const createForm = document.getElementById('create-americana-form');
    if (createForm) {
        const catSelect = createForm.querySelector('[name=category]');
        const locSelect = createForm.querySelector('[name=location]');
        const imgSelect = createForm.querySelector('[name=image_url]');

        const updateSync = () => {
            const cat = catSelect.value;
            const loc = locSelect.value;

            if (loc === 'Barcelona Pádel el Prat') {
                if (cat === 'male') imgSelect.value = 'img/americana masculina.jpg';
                else if (cat === 'female') imgSelect.value = 'img/americana femeninas.jpg';
                else if (cat === 'mixed') imgSelect.value = 'img/americana mixta.jpg';
                else imgSelect.value = 'img/americana mixta.jpg';
            } else if (loc === 'Delfos Cornellá') {
                imgSelect.value = 'img/delfos.png';
            } else {
                if (cat === 'male') imgSelect.value = 'img/ball-masculina.png';
                else if (cat === 'female') imgSelect.value = 'img/ball-femenina.png';
                else imgSelect.value = 'img/ball-mixta.png';
            }

            // Auto-fill Name if empty
            const nameInput = createForm.querySelector('[name=name]');
            if (nameInput && (!nameInput.value || nameInput.value.startsWith('AMERICANA'))) {
                const catLabel = cat === 'male' ? 'MASCULINA' : (cat === 'female' ? 'FEMENINA' : (cat === 'mixed' ? 'MIXTA' : 'TODOS'));
                nameInput.value = `AMERICANA ${catLabel} `;
            }
        };

        if (catSelect && locSelect && imgSelect) {
            catSelect.addEventListener('change', updateSync);
            locSelect.addEventListener('change', updateSync);
            updateSync(); // Initial sync
        }

        createForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const data = Object.fromEntries(fd.entries());
            // Convert numbers
            data.price_members = parseFloat(data.price_members) || 12;
            data.price_external = parseFloat(data.price_external) || 14;
            data.max_courts = parseInt(data.max_courts) || 4;

            try {
                await FirebaseDB.americanas.create(data);
                alert("Evento creado con éxito 🚀");
                loadAdminView('americanas_mgmt');
            } catch (err) { alert(err.message); }
        });
    }

    // Module internal helpers
    window.deleteAmericana = async (id) => {
        if (!confirm("¿Eliminar este evento?")) return;
        try {
            await FirebaseDB.americanas.delete(id);
            loadAdminView('americanas_mgmt');
        } catch (e) { alert(e.message); }
    };

    window.openEditAmericanaModal = async (americana) => {
        const modal = document.getElementById('admin-americana-modal');
        const form = document.getElementById('edit-americana-form');
        if (!modal || !form) return;

        // 1. Fill Form
        form.querySelector('[name=id]').value = americana.id;
        form.querySelector('[name=name]').value = americana.name;
        form.querySelector('[name=date]').value = americana.date;
        form.querySelector('[name=time]').value = americana.time || '18:30';
        form.querySelector('[name=category]').value = americana.category || 'open';
        form.querySelector('[name=location]').value = americana.location || 'Barcelona Pádel el Prat';
        form.querySelector('[name=max_courts]').value = americana.max_courts || 4;
        form.querySelector('[name=duration]').value = americana.duration || '2h';
        form.querySelector('[name=status]').value = americana.status || 'open';
        form.querySelector('[name=price_members]').value = americana.price_members || 12;
        form.querySelector('[name=price_external]').value = americana.price_external || 14;

        // PAIR MODE LOGIC
        if (form.querySelector('[name=pair_mode]')) {
            const pairSelect = form.querySelector('[name=pair_mode]');
            pairSelect.value = americana.pair_mode || 'rotating';

            pairSelect.onchange = () => {
                const isFixed = pairSelect.value === 'fixed';
                const area = document.getElementById('americana-fixed-pairs-area');
                if (area) area.style.display = isFixed ? 'block' : 'none';
                if (isFixed) window.loadAmericanaPairsUI(americana.id);
            };
        }

        const imgUrl = americana.image_url || '';
        const imgInput = form.querySelector('[name=image_url]');
        const imgPreview = document.getElementById('img-preview');

        imgInput.value = imgUrl;

        // Set initial preview
        if (imgUrl) {
            imgPreview.src = imgUrl;
            imgPreview.style.display = 'block';
        } else {
            imgPreview.style.display = 'none';
        }

        // Real-time preview update
        imgInput.oninput = function () {
            const url = this.value;
            if (url) {
                imgPreview.src = url;
                imgPreview.style.display = 'block';
            } else {
                imgPreview.style.display = 'none';
            }
        };

        // Helper for quick select buttons
        window.selectImage = (url) => {
            imgInput.value = url;
            if (imgInput.oninput) imgInput.oninput();
        };

        // Auto-sync category/location change in Edit Modal
        const catEdit = form.querySelector('[name=category]');
        const locEdit = form.querySelector('[name=location]');

        const updateEditSync = () => {
            const cat = catEdit.value;
            const loc = locEdit.value;
            let url = 'img/ball-mixta.png';

            if (loc === 'Barcelona Pádel el Prat') {
                if (cat === 'male') url = 'img/americana masculina.jpg';
                else if (cat === 'female') url = 'img/americana femeninas.jpg';
                else if (cat === 'mixed') url = 'img/americana mixta.jpg';
                else url = 'img/americana mixta.jpg';
            } else if (loc === 'Delfos Cornellá') {
                url = 'img/delfos.png';
            } else {
                if (cat === 'male') url = 'img/ball-masculina.png';
                else if (cat === 'female') url = 'img/ball-femenina.png';
                else url = 'img/ball-mixta.png';
            }

            window.selectImage(url);
        };

        catEdit.onchange = updateEditSync;
        locEdit.onchange = updateEditSync;

        modal.classList.remove('hidden');
        modal.style.display = 'flex';

        // 2. Load Participants Section
        if (typeof loadParticipantsUI === 'function') {
            await loadParticipantsUI(americana.id);
        } else {
            console.warn("loadParticipantsUI not available, defining it now...");
            // Define it if not available
            await window.loadParticipantsUI(americana.id);
        }
        await window.loadAmericanaPairsUI(americana.id);
    };

    // Expose loadParticipantsUI globally
    window.loadParticipantsUI = async function (americanaId) {
        const listContainer = document.getElementById('participants-list');
        const select = document.getElementById('add-player-select');
        const addBtn = document.getElementById('btn-add-player');

        if (!listContainer || !select || !addBtn) {
            console.error("Participants UI elements not found");
            return;
        }

        listContainer.innerHTML = '<div class="loader-mini"></div>';

        try {
            const [americana, allUsers] = await Promise.all([
                FirebaseDB.americanas.getById(americanaId),
                FirebaseDB.players.getAll()
            ]);

            const participants = americana.players || americana.registeredPlayers || [];
            const joinedIds = new Set(participants.map(p => p.id || p.uid));
            const maxPlayers = (americana.max_courts || 0) * 4;
            const isFull = participants.length >= maxPlayers;

            // Filter users by category
            let filteredUsers = allUsers.filter(u => !joinedIds.has(u.id));

            if (americana.category === 'male') {
                filteredUsers = filteredUsers.filter(u => u.gender === 'chico');
            } else if (americana.category === 'female') {
                filteredUsers = filteredUsers.filter(u => u.gender === 'chica');
            } else if (americana.category === 'mixed' || americana.category === 'open') {
                filteredUsers = filteredUsers.filter(u => u.gender === 'chico' || u.gender === 'chica');
            }

            select.innerHTML = `<option value="">${isFull ? '--- EVENTO LLENO ---' : 'Seleccionar Jugador...'}</option>` +
                filteredUsers
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(u => `<option value="${u.id}">${u.name} (${u.level || '?'})[${u.gender || '?'}]</option>`)
                    .join('');

            select.disabled = isFull;

            addBtn.onclick = async () => {
                const userId = select.value;
                if (!userId) return;

                try {
                    const user = allUsers.find(u => u.id === userId);
                    if (!user) return;

                    const players = americana.players || americana.registeredPlayers || [];
                    const isAlreadyEnrolled = players.some(p => {
                        const pid = (typeof p === 'string') ? p : (p.uid || p.id);
                        return pid === user.id;
                    });

                    if (isAlreadyEnrolled) {
                        alert('Este jugador ya está inscrito en la americana.');
                        return;
                    }

                    players.push({
                        id: user.id,
                        uid: user.id,
                        name: user.name,
                        level: user.level || user.self_rate_level || 'N/A',
                        gender: user.gender || '?',
                        joinedAt: new Date().toISOString()
                    });

                    await FirebaseDB.americanas.update(americanaId, {
                        players: players,
                        registeredPlayers: players
                    });

                    await window.loadParticipantsUI(americanaId);
                    await window.loadAmericanaPairsUI(americanaId); // Refresh pairs dropdown
                } catch (err) {
                    alert('Error al añadir jugador: ' + err.message);
                }
            };

            // Render participants list
            if (participants.length === 0) {
                listContainer.innerHTML = '<div style="text-align:center; color:#666; padding:15px; font-style:italic;">Sin participantes inscritos</div>';
            } else {
                // Resolve all participants details first to ensure accurate counts and display
                const resolvedParticipants = participants.map(p => {
                    const pId = (typeof p === 'string') ? p : (p.id || p.uid);
                    const user = allUsers.find(u => u.id === pId);
                    return user ? { ...user, ...((typeof p === 'object') ? p : {}) } : (typeof p === 'object' ? p : { id: pId, name: 'Desconocido', gender: '?' });
                });

                const maleCount = resolvedParticipants.filter(p => p.gender === 'chico').length;
                const femaleCount = resolvedParticipants.filter(p => p.gender === 'chica').length;

                const summaryHtml = `
                    <div style="display:flex; gap:10px; margin-bottom:15px; background:rgba(0,0,0,0.2); padding:10px; border-radius:8px; border:1px solid rgba(255,255,255,0.05);">
                        <div style="flex:1; text-align:center;">
                            <div style="font-size:0.6rem; color:#888; font-weight:800;">HOMBRES</div>
                            <div style="font-size:1.1rem; font-weight:900; color:#3b82f6;">${maleCount}</div>
                        </div>
                        <div style="flex:1; text-align:center; border-left:1px solid rgba(255,255,255,0.1);">
                            <div style="font-size:0.6rem; color:#888; font-weight:800;">MUJERES</div>
                            <div style="font-size:1.1rem; font-weight:900; color:#ec4899;">${femaleCount}</div>
                        </div>
                        <div style="flex:1; text-align:center; border-left:1px solid rgba(255,255,255,0.1);">
                            <div style="font-size:0.6rem; color:#888; font-weight:800;">TOTAL</div>
                            <div style="font-size:1.1rem; font-weight:900; color:var(--brand-neon);">${participants.length}/${maxPlayers}</div>
                        </div>
                    </div>
                `;

                listContainer.innerHTML = summaryHtml + resolvedParticipants.map((p, i) => {
                    const pId = p.id || p.uid || 'no-id';
                    let pName = p.name || 'Desconocido';
                    const pLevel = p.level || p.self_rate_level || '?';
                    const pGender = p.gender || '?';

                    return `
                        <div style="display:flex; justify-content:space-between; align-items:center; background: rgba(255,255,255,0.05); padding: 8px 12px; margin-bottom: 5px; border-radius: 6px;">
                            <div style="display:flex; align-items:center; gap:10px;">
                                <div style="width:24px; height:24px; background:var(--brand-neon); color:black; border-radius:50%; font-size:0.7rem; font-weight:700; display:flex; align-items:center; justify-content:center;">
                                    ${pName.charAt(0)}
                                </div>
                                <div>
                                    <div style="font-weight:600; font-size:0.9rem; color:white;" title="ID: ${pId}">${pName}</div>
                                    <div style="font-size:0.7rem; color:#888;">Nivel ${pLevel} | ${pGender === 'chico' ? '♂' : pGender === 'chica' ? '♀' : '?'}</div>
                                </div>
                            </div>
                            <button onclick="window.removePlayerFromAmericana('${americanaId}', ${i})"
                                style="background:transparent; border:none; color:var(--danger); cursor:pointer; font-size:1.1rem; opacity:0.8;"
                                title="Eliminar">
                                &times;
                            </button>
                        </div>
                    `;
                }).join('');
            }

        } catch (e) {
            console.error("Error loading participants:", e);
            listContainer.innerHTML = `<div style="color:red; text-align:center;">Error al cargar: ${e.message}</div>`;
        }
    };

    window.removePlayerFromAmericana = async function (americanaId, playerIndex) {
        if (!confirm("¿Eliminar a este jugador?")) return;
        try {
            const americana = await FirebaseDB.americanas.getById(americanaId);
            const players = americana.players || americana.registeredPlayers || [];

            // Also remove from fixed pairs if exists
            const removedPlayer = players[playerIndex];
            if (removedPlayer && americana.fixed_pairs) {
                americana.fixed_pairs = americana.fixed_pairs.filter(pair =>
                    pair.player1.id !== removedPlayer.id && pair.player2.id !== removedPlayer.id
                );
            }

            players.splice(playerIndex, 1);

            const updates = {
                players: players,
                registeredPlayers: players,
                fixed_pairs: americana.fixed_pairs || []
            };
            const minPlayers = (americana.max_courts || 4) * 4;

            // If player count drops below minimum, revert status from 'live' to 'open'
            if (americana.status === 'live' && players.length < minPlayers) {
                updates.status = 'open';
                console.log(`Americana ${americanaId} reverted to OPEN. Purging matches...`);

                // Call global service to purge matches
                if (window.AmericanaService && window.AmericanaService.purgeMatches) {
                    await window.AmericanaService.purgeMatches(americanaId, 'americana');
                }
            }

            await FirebaseDB.americanas.update(americanaId, updates);

            // Refresh main list and current modal
            if (window.loadAdminView) {
                const navItem = document.querySelector('.nav-item-pro.active');
                if (navItem && navItem.getAttribute('onclick')?.includes('americanas_mgmt')) {
                    loadAdminView('americanas_mgmt');
                }
            }
            await window.loadParticipantsUI(americanaId);
            await window.loadAmericanaPairsUI(americanaId); // Reload pairs too

        } catch (e) {
            alert("Error eliminando: " + e.message);
        }
    };

    /**
     * MANUAL PAIR MANAGER UI (AMERICANA)
     */
    window.loadAmericanaPairsUI = async function (americanaId) {
        const container = document.getElementById('americana-fixed-pairs-area');
        const listContainer = document.getElementById('americana-pairs-list');
        const select1 = document.getElementById('americana-pair-p1');
        const select2 = document.getElementById('americana-pair-p2');
        const addBtn = document.getElementById('btn-add-pair-americana');
        const autoBtn = document.getElementById('btn-auto-americana');
        const countSpan = document.getElementById('americana-pairs-count');

        if (!container || !listContainer) return;

        try {
            const americana = await FirebaseDB.americanas.getById(americanaId);
            const isFixed = americana.pair_mode === 'fixed';

            // Toggle Visibility
            container.style.display = isFixed ? 'block' : 'none';
            if (!isFixed) return;

            const players = americana.players || americana.registeredPlayers || [];
            const fixedPairs = americana.fixed_pairs || [];
            const maxCourts = americana.max_courts || 4;
            const requiredPairs = maxCourts * 2;

            // Update Counter
            if (countSpan) {
                const isComplete = fixedPairs.length >= requiredPairs;
                countSpan.textContent = `Parejas: ${fixedPairs.length} / ${requiredPairs}`;
                countSpan.style.background = isComplete ? 'rgba(0, 255, 100, 0.2)' : 'rgba(255, 255, 255, 0.1)';
                countSpan.style.color = isComplete ? '#00ff64' : '#ccc';
            }

            // Calculate paired IDs
            const pairedIds = new Set();
            fixedPairs.forEach(p => {
                if (p.player1) pairedIds.add(p.player1.id);
                if (p.player2) pairedIds.add(p.player2.id);
            });

            // Available Players
            const available = players.filter(p => !pairedIds.has(p.id || p.uid));

            // Populate Selects
            const options = `<option value="">Seleccionar...</option>` +
                available.map(p => `<option value="${p.id || p.uid}">${p.name}</option>`).join('');

            select1.innerHTML = options;
            select2.innerHTML = options;

            // Render List
            if (fixedPairs.length === 0) {
                listContainer.innerHTML = '<div style="text-align:center; color:#666; font-style:italic;">No hay parejas definidas</div>';
            } else {
                listContainer.innerHTML = fixedPairs.map((pair, i) => `
                    <div style="display:flex; justify-content:space-between; align-items:center; background: rgba(255,255,255,0.05); padding: 8px 12px; margin-bottom: 5px; border-radius: 6px;">
                        <span style="font-weight:600; font-size:0.9rem; color:white;">
                            ${pair.player1.name} 🤝 ${pair.player2.name}
                        </span>
                        <button onclick="window.removeAmericanaPair('${americanaId}', ${i})" style="background:transparent; border:none; color:var(--danger); cursor:pointer;">&times;</button>
                    </div>
                `).join('');
            }

            // AUTO-FILL BUTTON LOGIC
            if (autoBtn) {
                autoBtn.style.display = available.length >= 2 ? 'block' : 'none';
                autoBtn.onclick = async () => {
                    if (!confirm(`¿Auto-emparejar a los ${available.length} jugadores restantes?`)) return;

                    // Shuffle available
                    const shuffled = [...available].sort(() => 0.5 - Math.random());
                    const newPairsToAdd = [];

                    for (let i = 0; i < shuffled.length; i += 2) {
                        if (i + 1 < shuffled.length) {
                            newPairsToAdd.push({
                                player1: shuffled[i],
                                player2: shuffled[i + 1],
                                court: 0
                            });
                        }
                    }

                    const mergedPairs = [...fixedPairs, ...newPairsToAdd];
                    await FirebaseDB.americanas.update(americanaId, { fixed_pairs: mergedPairs });
                    await window.loadAmericanaPairsUI(americanaId);
                };
            }

            // Bind Add Action
            addBtn.onclick = async () => {
                const p1Id = select1.value;
                const p2Id = select2.value;

                if (!p1Id || !p2Id) return alert("Selecciona dos jugadores");
                if (p1Id === p2Id) return alert("No puedes elegir al mismo jugador");

                const p1 = players.find(p => (p.id || p.uid) === p1Id);
                const p2 = players.find(p => (p.id || p.uid) === p2Id);

                const newPair = {
                    player1: p1,
                    player2: p2,
                    court: 0
                };

                const newPairs = [...fixedPairs, newPair];
                await FirebaseDB.americanas.update(americanaId, { fixed_pairs: newPairs });
                await window.loadAmericanaPairsUI(americanaId);
            };

        } catch (e) { console.error(e); }
    };

    window.removeAmericanaPair = async (americanaId, index) => {
        if (!confirm("¿Deshacer esta pareja?")) return;
        const americana = await FirebaseDB.americanas.getById(americanaId);
        const pairs = americana.fixed_pairs || [];
        pairs.splice(index, 1);
        await FirebaseDB.americanas.update(americanaId, { fixed_pairs: pairs });
        await window.loadAmericanaPairsUI(americanaId);
    };

};
