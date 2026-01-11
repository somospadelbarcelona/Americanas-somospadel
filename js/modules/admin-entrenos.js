
window.AdminViews = window.AdminViews || {};

window.AdminViews.entrenos_mgmt = async function () {
    const content = document.getElementById('content-area');
    const titleEl = document.getElementById('page-title');

    if (titleEl) titleEl.textContent = 'Centro de Planificación de Entrenos';
    content.innerHTML = '<div class="loader"></div>';

    const entrenos = await FirebaseDB.entrenos.getAll();
    const sortedEntrenos = entrenos.sort((a, b) => new Date(b.date) - new Date(a.date));

    const listHtml = sortedEntrenos.map(e => `
        <div class="glass-card-enterprise" style="margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; border-left: 4px solid var(--primary); background: linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%);">
            <div style="display: flex; gap: 1.5rem; align-items: center; flex: 1;">
                <div class="entreno-preview-img" style="width: 90px; height: 90px; border-radius: 16px; background: url('${e.image_url || 'img/logo_somospadel.png'}') center/cover; border: 2px solid rgba(204,255,0,0.2); box-shadow: 0 4px 15px rgba(0,0,0,0.1);"></div>
                <div class="entreno-info-pro" style="flex: 1;">
                    <div style="font-weight: 900; font-size: 1.5rem; color: #FFFFFF; margin-bottom: 0.5rem; text-shadow: 0 2px 4px rgba(0,0,0,0.3); letter-spacing: 0.5px; line-height: 1.2;">${e.name.toUpperCase()}</div>
                    <div style="display: flex; gap: 1.5rem; font-size: 0.85rem; color: var(--text-muted); flex-wrap: wrap; margin-top: 0.5rem;">
                        <span style="display: flex; align-items: center; gap: 6px;">📅 <span style="color: #FFFFFF; font-weight: 600;">${e.date}</span></span>
                        <span style="display: flex; align-items: center; gap: 6px;">🕒 <span style="color: #FFFFFF; font-weight: 600;">${e.time || '10:00'}</span></span>
                        <span style="display: flex; align-items: center; gap: 6px;">🎾 <span style="color: #FFFFFF; font-weight: 600;">${e.max_courts || 4} Pistas</span></span>
                        <span style="display: flex; align-items: center; gap: 6px;">👥 <span style="color: var(--primary); font-weight: 700;">${e.players?.length || 0} Inscritos</span></span>
                    </div>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                 <!-- Category Badge -->
                <span class="pro-category-badge" style="background: var(--primary); color: black; font-weight: 800; padding: 6px 14px; display: flex; align-items: center; gap: 6px; font-size: 0.75rem;">
                    ${e.category === 'female' ? '🚺' : (e.category === 'male' ? '🚹' : (e.category === 'mixed' ? '👫' : '🎾'))}
                    ${(e.category === 'open' ? 'TODOS' : (e.category === 'male' ? 'MASCULINA' : (e.category === 'female' ? 'FEMENINA' : (e.category === 'mixed' ? 'MIXTA' : 'TODOS')))).toUpperCase()}
                </span>

                <!-- Pair Mode Badge -->
                <span class="pro-category-badge" style="background: rgba(255, 255, 255, 0.1); color: white; font-weight: 700; padding: 6px 14px; border: 1px solid rgba(255,255,255,0.2); display: flex; align-items: center; gap: 6px; font-size: 0.75rem;">
                     ${e.pair_mode === 'fixed' ? '🔒' : '🔄'}
                     ${e.pair_mode === 'fixed' ? 'FIJA' : 'TWISTER'}
                </span>
                
                <!-- PRICE SUMMARY -->
                <span class="pro-category-badge" style="background: transparent; color: #aaa; border: 1px solid #444; font-size: 0.65rem;">
                     ${e.price_members || 20}€ / ${e.price_external || 25}€
                </span>

                <!-- Status Badge -->
                <span class="pro-category-badge" style="background: ${e.status === 'live' ? 'rgba(255, 45, 85, 0.1)' : (e.status === 'finished' ? 'rgba(136, 136, 136, 0.1)' : 'rgba(0, 227, 109, 0.1)')}; color: ${e.status === 'live' ? '#FF2D55' : (e.status === 'finished' ? '#888' : '#00E36D')}; border: 1px solid ${e.status === 'live' ? '#FF2D55' : (e.status === 'finished' ? '#444' : '#00E36D')}; font-size: 0.65rem; font-weight: 800; padding: 6px 14px; min-width: 90px; text-align: center;">
                     ${(e.status === 'open' ? 'ABIERTA' : (e.status === 'live' ? 'EN JUEGO' : (e.status === 'finished' ? 'FINALIZADA' : (e.status || 'ABIERTA')))).toUpperCase()}
                </span>

                <button class="btn-outline-pro" style="border-radius: 12px; padding: 10px 16px; display: flex; align-items: center; gap: 8px; border-color: var(--primary); color: var(--primary); font-weight: 700; font-size: 0.8rem;" 
                        onclick='openEditEntrenoModal(${JSON.stringify(e).replace(/'/g, "&#39;")})' title="Editar Evento">✏️ EDITAR</button>
                <button class="btn-secondary" style="border-radius: 12px; padding: 10px 16px; display: flex; align-items: center; gap: 8px; border-color: var(--danger-dim); color: var(--danger); font-weight: 700; font-size: 0.8rem;" 
                        onclick="deleteEntreno('${e.id}')" title="Eliminar Permanente">🗑️ BORRAR</button>
            </div>
        </div>`).join('');

    content.innerHTML = `
        <div class="dashboard-grid-enterprise" style="grid-template-columns: 400px 1fr; gap: 2.5rem;">
            <div class="glass-card-enterprise" style="background: var(--grad-dark); height: fit-content; padding: 2rem;">
                <h3 style="margin-bottom: 2rem; color: var(--primary); display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 1.5rem;">✨</span> CONFIGURAR ENTRENOS
                </h3>
                <form id="create-entreno-form" class="pro-form">
                    <div class="form-group">
                        <label>NOMBRE DEL EVENTO</label>
                        <input type="text" name="name" placeholder="Ej: CLASE TÁCTICA NIVEL 4" class="pro-input" required>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div class="form-group">
                            <label>FECHA</label>
                            <input type="date" name="date" class="pro-input" required>
                        </div>
                        <div class="form-group">
                            <label>HORA</label>
                            <input type="time" name="time" value="10:00" class="pro-input" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>CATEGORÍA DEL ENTRENO</label>
                        <select name="category" class="pro-input">
                            <option value="open">TODOS</option>
                            <option value="male">MASCULINA</option>
                            <option value="female">FEMENINA</option>
                            <option value="mixed">MIXTA</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>SEDE DEL EVENTO</label>
                        <select name="location" class="pro-input">
                            <option value="Barcelona Pádel el Prat">Barcelona Pádel el Prat</option>
                            <option value="Delfos Cornellá">Delfos Cornellá</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <span>🎯 MODO DE PAREJAS</span>
                            <span style="font-size: 0.65rem; color: #888; font-weight: 400;">(Importante)</span>
                        </label>
                        <select name="pair_mode" class="pro-input" style="font-weight: 700;">
                            <option value="fixed">🔒 PAREJA FIJA (Pozo - Suben/Bajan Juntos)</option>
                            <option value="rotating">🔄 TWISTER (Entreno Tradicional)</option>
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
                            <option value="img/entreno todo prat.jpg">ENTRENO TODOS (EL PRAT)</option>
                            <option value="img/entreno masculino prat.jpg">ENTRENO MASCULINO (EL PRAT)</option>
                            <option value="img/entreno femenino prat.jpg">ENTRENO FEMENINO (EL PRAT)</option>
                            <option value="img/entreno mixto prat.jpg">ENTRENO MIXTO (EL PRAT)</option>
                            <option value="img/entreno todo delfos.jpg">ENTRENO TODOS (DELFOS)</option>
                            <option value="img/entreno masculino delfos.jpg">ENTRENO MASCULINO (DELFOS)</option>
                            <option value="img/entreno femenino delfos.jpg">ENTRENO FEMENINO (DELFOS)</option>
                            <option value="img/entreno mixto delfos.jpg">ENTRENO MIXTO (DELFOS)</option>
                            <option value="img/ball-mixta.png">PELOTA SOMOSPADEL</option>
                            <option value="img/logo_somospadel.png">LOGOTIPO CLUB</option>
                        </select>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div class="form-group">
                            <label>DURACIÓN</label>
                            <input type="text" name="duration" value="1h 30m" class="pro-input">
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
                            <input type="number" name="price_members" value="20" class="pro-input">
                        </div>
                        <div class="form-group">
                            <label>PRECIO EXTERNOS (€)</label>
                            <input type="number" name="price_external" value="25" class="pro-input">
                        </div>
                    </div>
                    <button type="submit" class="btn-primary-pro" style="width: 100%; margin-top: 1rem; padding: 1.2rem;">LANZAR EVENTO ELITE 🚀</button>
                </form>
            </div>
            <div class="planning-area">
                <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <h3 style="margin:0; letter-spacing: 2px; font-size: 0.85rem; color: var(--text-muted); font-weight: 800;">EVENTOS EN EL RADAR</h3>
                    <button class="btn-outline-pro" style="padding: 0.6rem 1.2rem; font-size: 0.75rem;" onclick="loadAdminView('entrenos_mgmt')">REFRESCAR SISTEMA</button>
                </div>
                <div class="entreno-scroll-list" style="max-height: 75vh; overflow-y: auto; padding-right: 15px;">
                    ${listHtml.length ? listHtml : '<div class="glass-card-enterprise" style="text-align:center; padding: 4rem; color: var(--text-muted);">No hay entrenos operativos. Comienza creando uno.</div>'}
                </div>
            </div>
        </div>`;

    // Sync Logic for Create Form
    const createForm = document.getElementById('create-entreno-form');
    if (createForm) {
        const catSelect = createForm.querySelector('[name=category]');
        const locSelect = createForm.querySelector('[name=location]');
        const imgSelect = createForm.querySelector('[name=image_url]');

        const updateSync = () => {
            const cat = catSelect.value;
            const loc = locSelect.value;

            if (loc === 'Barcelona Pádel el Prat') {
                if (cat === 'male') imgSelect.value = 'img/entreno masculino prat.jpg';
                else if (cat === 'female') imgSelect.value = 'img/entreno femenino prat.jpg';
                else if (cat === 'mixed') imgSelect.value = 'img/entreno mixto prat.jpg';
                else imgSelect.value = 'img/entreno todo prat.jpg';
            } else if (loc === 'Delfos Cornellá') {
                if (cat === 'male') imgSelect.value = 'img/entreno masculino delfos.jpg';
                else if (cat === 'female') imgSelect.value = 'img/entreno femenino delfos.jpg';
                else if (cat === 'mixed') imgSelect.value = 'img/entreno mixto delfos.jpg';
                else imgSelect.value = 'img/entreno todo delfos.jpg';
            } else {
                imgSelect.value = 'img/ball-mixta.png';
            }

            const nameInput = createForm.querySelector('[name=name]');
            if (nameInput && (!nameInput.value || nameInput.value.startsWith('ENTRENO') || nameInput.value.startsWith('CLASE'))) {
                const catLabel = cat === 'male' ? 'MASCULINA' : (cat === 'female' ? 'FEMENINA' : (cat === 'mixed' ? 'MIXTA' : 'TODOS'));
                nameInput.value = `ENTRENO ${catLabel} `;
            }
        };

        if (catSelect && locSelect && imgSelect) {
            catSelect.addEventListener('change', updateSync);
            locSelect.addEventListener('change', updateSync);
            updateSync();
        }

        createForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const data = Object.fromEntries(fd.entries());
            data.price_members = parseFloat(data.price_members) || 20;
            data.price_external = parseFloat(data.price_external) || 25;
            data.max_courts = parseInt(data.max_courts) || 4;
            data.status = 'open';

            // CRITICAL: Initialize arrays to prevent undefined errors
            data.players = [];
            data.fixed_pairs = [];
            data.registeredPlayers = [];

            try {
                await FirebaseDB.entrenos.create(data);
                alert("Evento creado con éxito 🚀");
                loadAdminView('entrenos_mgmt');
            } catch (err) { alert(err.message); }
        });
    }

    // Expose helpers globally
    window.deleteEntreno = async (id) => {
        if (!confirm("¿Eliminar este entreno?")) return;
        try {
            await FirebaseDB.entrenos.delete(id);
            loadAdminView('entrenos_mgmt');
        } catch (e) { alert(e.message); }
    };

    window.openEditEntrenoModal = async (entreno) => {
        const modal = document.getElementById('admin-entreno-modal');
        const form = document.getElementById('edit-entreno-form');
        if (!modal || !form) return;

        form.querySelector('[name=id]').value = entreno.id;
        form.querySelector('[name=name]').value = entreno.name;
        form.querySelector('[name=date]').value = entreno.date;
        form.querySelector('[name=time]').value = entreno.time || '10:00';
        form.querySelector('[name=category]').value = entreno.category || 'open';
        form.querySelector('[name=location]').value = entreno.location || 'Barcelona Pádel el Prat';
        form.querySelector('[name=max_courts]').value = entreno.max_courts || 4;
        form.querySelector('[name=duration]').value = entreno.duration || '1h 30m';
        form.querySelector('[name=status]').value = entreno.status || 'open';
        form.querySelector('[name=price_members]').value = entreno.price_members || 20;
        form.querySelector('[name=price_external]').value = entreno.price_external || 25;
        if (form.querySelector('[name=pair_mode]')) {
            const pairModeSelect = form.querySelector('[name=pair_mode]');
            pairModeSelect.value = entreno.pair_mode || 'fixed';

            // Listener for Toggle
            pairModeSelect.onchange = () => {
                const isFixed = pairModeSelect.value === 'fixed';
                const area = document.getElementById('entreno-fixed-pairs-area');
                if (area) area.style.display = isFixed ? 'block' : 'none';
                if (isFixed) window.loadEntrenoPairsUI(entreno.id);
            };
        }

        const imgUrl = entreno.image_url || '';
        const imgInput = document.getElementById('edit-entreno-img-input');
        const imgPreview = document.getElementById('edit-entreno-img-preview');

        if (imgInput) imgInput.value = imgUrl;
        if (imgPreview) {
            imgPreview.src = imgUrl;
            imgPreview.style.display = imgUrl ? 'block' : 'none';
        }

        window.selectEntrenoImage = (url) => {
            if (imgInput) {
                imgInput.value = url;
                if (imgPreview) {
                    imgPreview.src = url;
                    imgPreview.style.display = 'block';
                }
            }
        };

        modal.classList.remove('hidden');
        modal.style.display = 'flex';

        await window.loadEntrenoParticipantsUI(entreno.id);
        await window.loadEntrenoPairsUI(entreno.id); // Initial Load
        await window.loadWaitlistUI(entreno.id); // Load waitlist
    };

    window.loadEntrenoParticipantsUI = async function (entrenoId) {
        const listContainer = document.getElementById('participants-list-entreno');
        const select = document.getElementById('add-player-select-entreno');
        const addBtn = document.getElementById('btn-add-player-entreno');

        if (!listContainer || !select || !addBtn) return;

        listContainer.innerHTML = '<div class="loader-mini"></div>';

        try {
            const [entreno, allUsers] = await Promise.all([
                FirebaseDB.entrenos.getById(entrenoId),
                FirebaseDB.players.getAll()
            ]);

            const participants = entreno.players || [];
            const joinedIds = new Set(participants.map(p => p.id || p.uid));
            const maxPlayers = (entreno.max_courts || 0) * 4;
            const isFull = participants.length >= maxPlayers;

            let filteredUsers = allUsers.filter(u => !joinedIds.has(u.id));
            if (entreno.category === 'male') filteredUsers = filteredUsers.filter(u => u.gender === 'chico');
            else if (entreno.category === 'female') filteredUsers = filteredUsers.filter(u => u.gender === 'chica');

            select.innerHTML = `<option value="">${isFull ? '--- EVENTO LLENO ---' : 'Seleccionar Jugador...'}</option>` +
                filteredUsers.sort((a, b) => a.name.localeCompare(b.name))
                    .map(u => `<option value="${u.id}">${u.name} (${u.level || '?'})</option>`).join('');

            select.disabled = isFull;

            addBtn.onclick = async () => {
                try {
                    const userId = select.value;
                    if (!userId) return;
                    const user = allUsers.find(u => u.id === userId);
                    if (!user) return;

                    // CHECK FOR DUPLICATES
                    const isDuplicate = participants.some(p =>
                        (p.id === user.id) || (p.uid === user.id)
                    );

                    if (isDuplicate) {
                        alert(`⚠️ ${user.name} ya está inscrito en este entreno.`);
                        return;
                    }

                    participants.push({
                        id: user.id, uid: user.id, name: user.name, level: user.level || '?', gender: user.gender || '?'
                    });

                    await FirebaseDB.entrenos.update(entrenoId, { players: participants });

                    // AUTOMATIC START LOGIC (If Full)
                    const requiredPlayers = (entreno.max_courts || 4) * 4;
                    if (participants.length >= requiredPlayers) {
                        // Check if already live/started to avoid double trigger
                        if (entreno.status !== 'live' && entreno.status !== 'finished') {
                            console.log("🚀 [AdminEntreno] Evento lleno. Activando modo LIVE y generando cruces...");

                            // 1. Update Status
                            await FirebaseDB.entrenos.update(entrenoId, { status: 'live' });

                            // 2. Generate Matches
                            if (window.AmericanaService) {
                                console.log("Calling AmericanaService.generateFirstRoundMatches...");
                                await window.AmericanaService.generateFirstRoundMatches(entrenoId, 'entreno');
                                alert("✅ Evento COMPLETO. Se ha activado el modo EN JUEGO y generado los cruces.");
                            } else {
                                alert("❌ Error CRÍTICO: Servicio de Americanas no cargado. Recarga la página.");
                            }
                        }
                    }

                    await window.loadEntrenoParticipantsUI(entrenoId);
                    await window.loadEntrenoPairsUI(entrenoId); // Refresh pairs dropdown
                } catch (err) {
                    console.error("Error adding player/generating matches:", err);
                    alert("⚠️ Error: " + err.message);
                }
            };

            if (participants.length === 0) {
                listContainer.innerHTML = '<div style="text-align:center; color:#666; padding:15px; font-style:italic;">Sin alumnos inscritos</div>';
            } else {
                listContainer.innerHTML = participants.map((p, i) => `
                    <div style="display:flex; justify-content:space-between; align-items:center; background: rgba(255,255,255,0.05); padding: 8px 12px; margin-bottom: 5px; border-radius: 6px;">
                        <span style="font-weight:600; font-size:0.9rem; color:white;">${p.name} (Nivel ${p.level || '?'})</span>
                        <button onclick="window.removePlayerFromEntreno('${entrenoId}', ${i})" style="background:transparent; border:none; color:var(--danger); cursor:pointer; font-size:1.1rem;">&times;</button>
                    </div>
                `).join('');
            }
        } catch (e) { listContainer.innerHTML = 'Error al cargar'; }
    };

    window.removePlayerFromEntreno = async function (entrenoId, playerIndex) {
        try {
            if (!confirm("¿Eliminar a este alumno?")) return;

            const entreno = await FirebaseDB.entrenos.getById(entrenoId);
            if (!entreno) {
                alert("❌ Error: Entreno no encontrado");
                return;
            }

            const players = entreno.players || [];

            if (playerIndex < 0 || playerIndex >= players.length) {
                alert("❌ Error: Jugador no válido");
                return;
            }

            // Also remove from fixed pairs if exists
            const removedPlayer = players[playerIndex];
            if (removedPlayer && entreno.fixed_pairs) {
                entreno.fixed_pairs = entreno.fixed_pairs.filter(pair =>
                    pair.player1.id !== removedPlayer.id && pair.player2.id !== removedPlayer.id
                );
            }

            players.splice(playerIndex, 1);

            await FirebaseDB.entrenos.update(entrenoId, {
                players: players,
                fixed_pairs: entreno.fixed_pairs || []
            });

            // AUTO-PROMOTE from waitlist if exists
            const promoted = await FirebaseDB.entrenos.promoteFromWaitlist(entrenoId);
            if (promoted) {
                alert(`✅ Jugador eliminado.\n\n${promoted.name} ha sido promovido automáticamente de la lista de reserva.`);
            } else {
                alert("✅ Jugador eliminado correctamente");
            }

            await window.loadEntrenoParticipantsUI(entrenoId);
            await window.loadEntrenoPairsUI(entrenoId); // Reload pairs too
            await window.loadWaitlistUI(entrenoId); // Reload waitlist
            loadAdminView('entrenos_mgmt');
        } catch (error) {
            console.error("Error removing player:", error);
            alert("❌ Error al eliminar jugador: " + error.message);
        }
    };

    // ========== WAITLIST MANAGEMENT ==========
    window.loadWaitlistUI = async function (entrenoId) {
        const container = document.getElementById('waitlist-entreno');
        const promoteBtn = document.getElementById('btn-promote-waitlist-entreno');

        if (!container) return;

        try {
            const entreno = await FirebaseDB.entrenos.getById(entrenoId);
            const waitlist = entreno.waitlist || [];

            if (waitlist.length === 0) {
                container.innerHTML = '<div style="text-align:center; color:#888; padding:20px;">No hay jugadores en lista de reserva</div>';
                if (promoteBtn) promoteBtn.disabled = true;
            } else {
                container.innerHTML = waitlist.map((p, i) => `
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:8px; background:rgba(0,0,0,0.2); margin-bottom:5px; border-radius:6px;">
                        <span style="font-weight:700; color:white;">${i + 1}. ${p.name}</span>
                        <button onclick="window.removeFromWaitlistAdmin('${entrenoId}', '${p.uid}')" 
                                style="background:transparent; border:none; color:var(--danger); cursor:pointer; font-size:1.1rem;">×</button>
                    </div>
                `).join('');

                if (promoteBtn) {
                    promoteBtn.disabled = false;
                    promoteBtn.onclick = () => window.promoteFromWaitlistAdmin(entrenoId);
                }
            }
        } catch (e) {
            container.innerHTML = '<div style="text-align:center; color:#ef4444; padding:20px;">Error al cargar</div>';
        }
    };

    window.promoteFromWaitlistAdmin = async (entrenoId) => {
        try {
            const promoted = await FirebaseDB.entrenos.promoteFromWaitlist(entrenoId);
            if (promoted) {
                alert(`✅ ${promoted.name} ha sido promovido de la lista de reserva!`);
                await window.loadEntrenoParticipantsUI(entrenoId);
                await window.loadWaitlistUI(entrenoId);
                await window.loadEntrenoPairsUI(entrenoId);
            } else {
                alert("⚠️ No hay jugadores en la lista de reserva");
            }
        } catch (e) {
            alert("❌ " + e.message);
        }
    };

    window.removeFromWaitlistAdmin = async (entrenoId, playerId) => {
        if (!confirm("¿Eliminar de la lista de reserva?")) return;
        try {
            await FirebaseDB.entrenos.removeFromWaitlist(entrenoId, playerId);
            await window.loadWaitlistUI(entrenoId);
        } catch (e) {
            alert("❌ " + e.message);
        }
    };

    /**
     * MANUAL PAIR MANAGER UI
     */
    window.loadEntrenoPairsUI = async function (entrenoId) {
        const container = document.getElementById('entreno-fixed-pairs-area');
        const listContainer = document.getElementById('entreno-pairs-list');
        const select1 = document.getElementById('entreno-pair-p1');
        const select2 = document.getElementById('entreno-pair-p2');
        const addBtn = document.getElementById('btn-add-pair-entreno');
        const autoBtn = document.getElementById('btn-auto-entreno');
        const countSpan = document.getElementById('entreno-pairs-count');

        if (!container || !listContainer) return;

        try {
            const entreno = await FirebaseDB.entrenos.getById(entrenoId);
            const isFixed = entreno.pair_mode === 'fixed';

            // Toggle Visibility
            container.style.display = isFixed ? 'block' : 'none';
            if (!isFixed) return;

            const players = entreno.players || entreno.registeredPlayers || [];
            const fixedPairs = entreno.fixed_pairs || [];
            const maxCourts = entreno.max_courts || 4;
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
                        <button onclick="window.removeEntrenoPair('${entrenoId}', ${i})" style="background:transparent; border:none; color:var(--danger); cursor:pointer;">&times;</button>
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
                    await FirebaseDB.entrenos.update(entrenoId, { fixed_pairs: mergedPairs });
                    await window.loadEntrenoPairsUI(entrenoId);
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
                    court: 0 // Will be assigned later
                };

                const newPairs = [...fixedPairs, newPair];
                await FirebaseDB.entrenos.update(entrenoId, { fixed_pairs: newPairs });
                await window.loadEntrenoPairsUI(entrenoId);
            };

            // =========================================================
            // ACTION: GENERATE FIX PAIRS AND RESTART MATCHES BUTTON
            // =========================================================
            let regenBtn = document.getElementById('btn-regen-pairs-entreno');

            // Create container if not exists or append to somewhere suitable
            if (!regenBtn) {
                const divider = document.createElement('div');
                divider.style.borderTop = '1px solid rgba(255,255,255,0.1)';
                divider.style.margin = '20px 0';
                container.appendChild(divider);

                regenBtn = document.createElement('button');
                regenBtn.id = 'btn-regen-pairs-entreno';
                regenBtn.className = 'btn-primary-pro';
                regenBtn.style.marginTop = '1rem';
                regenBtn.style.width = '100%';
                regenBtn.style.background = '#CCFF00';
                regenBtn.style.color = 'black';
                regenBtn.style.fontWeight = '900';
                regenBtn.style.textTransform = 'uppercase';
                regenBtn.style.padding = '14px';
                regenBtn.style.display = 'flex';
                regenBtn.style.alignItems = 'center';
                regenBtn.style.justifyContent = 'center';
                regenBtn.style.gap = '10px';
                regenBtn.style.boxShadow = '0 5px 15px rgba(204, 255, 0, 0.2)';

                regenBtn.innerHTML = `
                    <span style="font-size: 1.2rem;">💾</span> 
                    <span>GUARDAR PAREJAS Y APLICAR CAMBIOS</span>
                 `;

                const warning = document.createElement('div');
                warning.style.fontSize = '0.7rem';
                warning.style.color = '#888';
                warning.style.marginTop = '8px';
                warning.style.textAlign = 'center';
                warning.innerHTML = '⚠️ Importante: Esto regenerará la Ronda 1 con las parejas actuales.';

                container.appendChild(regenBtn);
                container.appendChild(warning);
            }

            regenBtn.onclick = async () => {
                await window.applyFixedPairsAndRegenerate(entrenoId);
            };

        } catch (e) { console.error(e); }
    };

    window.removeEntrenoPair = async (entrenoId, index) => {
        if (!confirm("¿Deshacer esta pareja?")) return;
        const entreno = await FirebaseDB.entrenos.getById(entrenoId);
        const pairs = entreno.fixed_pairs || [];
        pairs.splice(index, 1);
        await FirebaseDB.entrenos.update(entrenoId, { fixed_pairs: pairs });
        await window.loadEntrenoPairsUI(entrenoId);
    };

    window.applyFixedPairsAndRegenerate = async (entrenoId) => {
        if (!confirm("CONFIRMACIÓN DE SEGURIDAD 🛡️\n\n¿Quieres aplicar estas parejas y REGENERAR los partidos?\n\n⚠️ Acción destructiva: Se borrarán los partidos existentes de la Ronda 1 y se crearán nuevos cruces con las parejas seleccionadas.")) return;

        const btn = document.getElementById('btn-regen-pairs-entreno');
        const originalText = btn ? btn.innerHTML : '';
        if (btn) btn.innerHTML = '<div class="loader-mini"></div> APLICANDO...';

        try {
            if (!window.AmericanaService) throw new Error("Servicio no disponible");

            // 0. LOCK STATUS: Set to 'adjusting' to silence auto-listeners (ControlTower, etc.)
            // This prevents them from seeing "0 matches" and auto-generating while we are working.
            console.log("🔒 Locking event status to 'adjusting'...");
            await FirebaseDB.entrenos.update(entrenoId, { status: 'adjusting' });

            // 1. Force purge of current matches
            console.log("🔥 Purging matches for entreno:", entrenoId);
            await window.AmericanaService.purgeMatches(entrenoId, 'entreno');

            // 2. Generate Round 1 again (Now safe from interference)
            console.log("🎲 Regenerating Round 1...");
            await window.AmericanaService.generateFirstRoundMatches(entrenoId, 'entreno');

            // 3. Unlock Status: Set back to LIVE
            console.log("🔓 Unlocking status to LIVE...");
            await FirebaseDB.entrenos.update(entrenoId, { status: 'live' });

            alert("✅ ¡PAREJAS APLICADAS CON ÉXITO! \n\nLos partidos se han regenerado correctamente.");

            // DON'T close modal - let user continue editing if needed
            // const modal = document.getElementById('admin-entreno-modal');
            // if (modal) {
            //     modal.classList.add('hidden');
            //     modal.style.display = 'none';
            // }

            // DON'T auto-navigate - user can manually go to results view if they want
            // if (window.loadAdminView) loadAdminView('entrenos_results');

        } catch (error) {
            console.error("Error applying pairs:", error);
            alert("❌ Error: " + error.message);
        } finally {
            if (btn) btn.innerHTML = originalText;
        }
    };
};

/**
 * CENTRO DE RESULTADOS DE ENTRENOS (MÓDULO DE CONTROL)
 * Migrado desde el núcleo monolítico de admin.js
 */
window.AdminViews.entrenos_results = async function () {
    const content = document.getElementById('content-area');
    const titleEl = document.getElementById('page-title');

    if (titleEl) titleEl.textContent = 'Centro de Resultados de Entrenos';

    const entries = await FirebaseDB.entrenos.getAll();

    // 1. Determinar el entreno activo
    let activeEntreno = entries[0];
    if (window.selectedEntrenoId) {
        activeEntreno = entries.find(e => e.id === window.selectedEntrenoId) || activeEntreno;
    } else {
        activeEntreno = entries.find(a => a.status === 'live' || a.status === 'open') || activeEntreno;
    }

    if (!activeEntreno) {
        content.innerHTML = `<div class="glass-card-enterprise text-center" style="padding: 4rem;"> <p>No hay entrenos programados para registrar resultados.</p></div>`;
        return;
    }

    // 2. Renderizar Estructura Principal (Clon de Americanas)
    content.innerHTML = `
        <div class="dashboard-header-pro" style="margin-bottom: 2rem; background: linear-gradient(135deg, #0a0a0a 0%, #000 100%); padding: 2.5rem; border-radius: 24px; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2.5rem; flex-wrap: wrap; gap: 20px;">
                <div style="display: flex; align-items: center; gap: 1.5rem;">
                    <div style="width: 70px; height: 70px; background: rgba(52, 152, 219, 0.15); border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 2.2rem; border: 1px solid rgba(52, 152, 219, 0.3); box-shadow: 0 0 20px rgba(52, 152, 219, 0.1);">🏆</div>
                    <div>
                        <h1 style="margin:0; color: white; font-size: 2.4rem; font-weight: 950; letter-spacing: -1.5px; line-height: 1;">${activeEntreno.name}</h1>
                        <div style="color: var(--primary); font-weight: 800; font-size: 0.85rem; letter-spacing: 3px; text-transform: uppercase; margin-top: 8px; opacity: 0.9;">MÓDULO DE CONTROL DE RESULTADOS</div>
                    </div>
                </div>
                 <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                    <button class="btn-outline-pro" onclick="resetEntrenoRound('${activeEntreno.id}', window.currentEntrenoRound)" style="border-color: #ff4d4d; color: #ff4d4d; font-weight: 800; padding: 0.9rem 1.8rem; border-radius: 12px; font-size: 0.85rem;">🚨 REINICIAR PARTIDO</button>
                    <button class="btn-primary-pro" onclick="window.forceGenerateEntrenoMatches('${activeEntreno.id}', 1)" style="background: #CCFF00; color: black; border-color: #CCFF00; font-weight: 800; padding: 0.9rem 1.8rem; border-radius: 12px; font-size: 0.85rem;">⚡ GENERAR PARTIDOS MANUALMENTE</button>
                    <button class="btn-primary-pro" onclick="simulateEntrenoRound('${activeEntreno.id}', window.currentEntrenoRound)" style="background: #25D366; color: black; border-color: #25D366; font-weight: 800; padding: 0.9rem 1.8rem; border-radius: 12px; font-size: 0.85rem;">🎲 SIMULAR PARTIDO</button>
                    <button class="btn-primary-pro" onclick="simulateAllEntrenoTournament('${activeEntreno.id}')" style="background: var(--primary); color: black; border-color: var(--primary); font-weight: 800; padding: 0.9rem 1.8rem; border-radius: 12px; font-size: 0.85rem;">🎮 SIMULAR TORNEO COMPLETO</button>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1.5fr 1fr 120px; gap: 20px; margin-bottom: 2rem; background: rgba(255,255,255,0.03); padding: 1.8rem; border-radius: 20px; border: 1px solid rgba(255,255,255,0.08);">
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <label style="color: rgba(255,255,255,0.4); font-size: 0.65rem; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">BUSCADOR DE EVENTO:</label>
                    <select id="entreno-select" onchange="loadSpecificEntrenoResults(this.value)" class="pro-input" style="width: 100%; height: 60px !important; font-size: 1.1rem !important; font-weight: 800 !important; background: #ffffff !important; color: #000000 !important; border-radius: 14px; border: 3px solid #3498db !important; padding: 0 15px !important;">
                        ${entries.map(e => `<option value="${e.id}" ${e.id === activeEntreno.id ? 'selected' : ''}>${e.name.toUpperCase()} — ${e.date}</option>`).join('')}
                    </select>
                </div>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <label style="color: rgba(255,255,255,0.4); font-size: 0.65rem; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">BUSCADOR RÁPIDO JUGADOR:</label>
                    <input type="text" id="entreno-player-search" placeholder="Escribe nombre para destacar..." class="pro-input" style="width: 100%; height: 60px !important; background: white !important; color: black !important; font-weight: 700; border-radius: 14px; border: 3px solid #3498db !important;" onkeyup="highlightEntrenoPlayer(this.value)">
                </div>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <label style="color: rgba(255,255,255,0.4); font-size: 0.65rem; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">Nº PISTAS:</label>
                    <div style="display: flex; gap: 5px;">
                        <input type="number" id="entreno-quick-max-courts" value="${activeEntreno.max_courts || 0}" min="1" max="20" class="pro-input" style="width: 100%; height: 60px !important; text-align: center; font-size: 1.4rem !important; font-weight: 800 !important; background: #ffffff !important; color: #000000 !important; border-radius: 14px; border: 3px solid #3498db !important;">
                        <button class="btn-primary-pro" onclick="updateEntrenoMaxCourtsQuick('${activeEntreno.id}')" style="height: 60px; min-width: 60px; padding: 0; display: flex; align-items: center; justify-content: center; border-radius: 14px; font-size: 1.5rem; background:#3498db; border:none;" title="Guardar Pistas">💾</button>
                    </div>
                </div>
            </div>

            <div style="display: flex; gap: 1rem; overflow-x: auto; padding-bottom: 8px;">
                ${[1, 2, 3, 4, 5, 6].map(r => `<button class="btn-round-tab entreno-round-btn" id="btn-entreno-round-${r}" onclick="renderEntrenoMatches('${activeEntreno.id}', ${r})" style="flex: 1; min-width: 150px; height: 55px; font-weight: 900; font-size: 0.95rem; border-radius: 14px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); color: #888;">PARTIDO ${r}</button>`).join('')}
                <button class="btn-round-tab" id="btn-entreno-summary" onclick="renderEntrenoSummary('${activeEntreno.id}')" style="flex: 1.3; min-width: 180px; height: 55px; font-weight: 900; background: #3498db; border: none; border-radius: 14px; color: white; display: flex; align-items: center; justify-content: center; gap: 8px;">📊 INFORME FINAL</button>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 2.5fr 1.2fr; gap: 2.5rem;">
            <div id="entreno-matches-container"><div class="loader"></div></div>

            <div class="glass-card-enterprise" style="height: fit-content; padding: 2rem; background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.05); border-radius: 20px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 1rem;">
                    <h3 style="margin:0; color:white; font-size: 1.1rem; font-weight: 900; letter-spacing: 1px;">📊 CLASIFICACIÓN</h3>
                    <span style="font-size:0.7rem; color: #3498db; font-weight: 800; background: rgba(52,152,219,0.1); padding: 4px 10px; border-radius: 20px;">EN VIVO</span>
                </div>
                <div id="entreno-standings-container" style="max-height: 800px; overflow-y: auto; padding-right: 5px;">
                    <!-- Standings inserted here -->
                </div>
            </div>
        </div>
    `;

    // 3. Inicializar primer partido
    window.currentEntrenoRound = 1;
    renderEntrenoMatches(activeEntreno.id, 1);
};

/**
 * FUNCIONES GLOBALES DE SOPORTE PARA ENTRENOS
 */

window.loadSpecificEntrenoResults = (id) => {
    window.selectedEntrenoId = id;
    window.AdminViews.entrenos_results();
};

window.renderEntrenoMatches = async (entrenoId, roundNum) => {
    window.currentEntrenoRound = roundNum;
    const container = document.getElementById('entreno-matches-container');
    if (!container) return;

    // Tabs Logic
    document.querySelectorAll('.entreno-round-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.style.background = 'rgba(255,255,255,0.03)';
        btn.style.color = '#888';
        btn.style.borderColor = 'rgba(255,255,255,0.1)';
        btn.style.boxShadow = 'none';
    });
    const activeBtn = document.getElementById(`btn-entreno-round-${roundNum}`);
    if (activeBtn) {
        activeBtn.classList.add('active');
        activeBtn.style.background = '#3498db';
        activeBtn.style.color = 'white';
        activeBtn.style.borderColor = '#3498db';
        activeBtn.style.boxShadow = '0 0 15px rgba(52, 152, 219, 0.3)';
    }

    container.innerHTML = '<div class="loader"></div>';

    // Clear existing listener if any
    if (window.entrenoMatchesUnsubscribe) {
        window.entrenoMatchesUnsubscribe();
        window.entrenoMatchesUnsubscribe = null;
    }

    // Use Real-time Listener
    window.entrenoMatchesUnsubscribe = window.db.collection('entrenos_matches')
        .where('americana_id', '==', entrenoId)
        .onSnapshot(async (snapshot) => {
            const matches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const entreno = await FirebaseDB.entrenos.getById(entrenoId);
            const roundMatches = matches.filter(m => m.round === roundNum);

            if (roundMatches.length === 0) {
                // If this is a future round, check if previous is finished
                container.innerHTML = `
                <div class="glass-card-enterprise text-center" style="padding: 4rem; display: flex; flex-direction: column; align-items: center; gap: 1.5rem;">
                    <div style="font-size: 3rem; opacity: 0.5;">🎾</div>
                    <h3 style="color: rgba(255,255,255,0.5); font-weight: 800; margin: 0;">PARTIDO ${roundNum} SIN PARTIDOS</h3>
                    <p style="color: #666; font-size: 0.8rem;">Los partidos se generarán automáticamente cuando termine el Partido ${roundNum - 1}</p>
                    <button class="btn-primary-pro" onclick="window.forceGenerateEntrenoMatches('${entrenoId}', ${roundNum})" style="padding: 1.2rem 3rem; font-size: 1.1rem; background: #3498db; border: none;">GENERAR PARTIDO ${roundNum} (MANUAL)</button>
                </div>`;

                // AUTOMATIC GENERATION TRIGGER FOR ROUND 1 (Safety Net)
                if (roundNum === 1 && window.AmericanaService) {
                    // Double check if live/full before auto-generating blindly
                    if (entreno.status === 'live' || (entreno.players && entreno.players.length >= (entreno.max_courts || 4) * 4)) {
                        window.AmericanaService.generateFirstRoundMatches(entrenoId, 'entreno');
                    }
                }
            } else {
                const courtColors = ['#CCFF00', '#00E36D', '#3498db', '#f1c40f', '#e74c3c', '#9b59b6'];
                container.innerHTML = `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 1.5rem;">
                ${roundMatches.sort((a, b) => a.court - b.court).map(m => `
                    <div class="glass-card-enterprise entreno-match-card" data-players="${(m.team_a_names + ' ' + m.team_b_names).toLowerCase()}" style="padding: 0; border: 1px solid rgba(255,255,255,0.08); overflow: hidden;">
                         <div style="padding: 1rem; background: rgba(255,255,255,0.02); display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05); border-left: 4px solid ${courtColors[m.court - 1] || '#666'};">
                            <span style="font-weight: 800; color: ${courtColors[m.court - 1] || '#ccc'}; letter-spacing: 1px;">PISTA ${m.court}</span>
                            <span style="font-size: 0.7rem; color: #555;">${m.status === 'finished' ? '<span style="color:#25D366; font-weight:800;">FINALIZADO</span>' : 'EN JUEGO'}</span>
                        </div>
                        <div style="padding: 1.5rem;">
                            <!-- TEAM A -->
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                                <div style="font-weight: 700; font-size: 1rem; color: white;">${m.team_a_names}</div>
                                <button onclick="setEntrenoWinner('${m.id}', 'A')" style="min-width: 100px; padding: 12px 20px; border-radius: 10px; font-weight: 900; border: none; font-size: 0.8rem; cursor: pointer; background: ${m.score_a > m.score_b ? '#25D366' : 'rgba(255,255,255,0.05)'}; color: ${m.score_a > m.score_b ? 'black' : '#666'};">
                                    ${m.score_a > m.score_b ? 'GANADOR' : 'WIN'}
                                </button>
                            </div>
                            <!-- TEAM B -->
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div style="font-weight: 700; font-size: 1rem; color: white;">${m.team_b_names}</div>
                                <button onclick="setEntrenoWinner('${m.id}', 'B')" style="min-width: 100px; padding: 12px 20px; border-radius: 10px; font-weight: 900; border: none; font-size: 0.8rem; cursor: pointer; background: ${m.score_b > m.score_a ? '#25D366' : 'rgba(255,255,255,0.05)'}; color: ${m.score_b > m.score_a ? 'black' : '#666'};">
                                    ${m.score_b > m.score_a ? 'GANADOR' : 'WIN'}
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>`;
            }

            renderEntrenoLiveStandings(matches);

        }, (error) => {
            console.error("Error listening to entreno matches:", error);
            container.innerHTML = `Error: ${error.message}`;
        });
};

function renderEntrenoLiveStandings(matches) {
    const stContainer = document.getElementById('entreno-standings-container');
    if (!stContainer) return;

    const stats = {};
    matches.forEach(m => {
        const tA = Array.isArray(m.team_a_names) ? m.team_a_names.join(' / ') : (m.team_a_names || 'Equipo A');
        const tB = Array.isArray(m.team_b_names) ? m.team_b_names.join(' / ') : (m.team_b_names || 'Equipo B');

        if (!stats[tA]) stats[tA] = { name: tA, played: 0, won: 0, games: 0 };
        if (!stats[tB]) stats[tB] = { name: tB, played: 0, won: 0, games: 0 };

        const sA = parseInt(m.score_a || 0);
        const sB = parseInt(m.score_b || 0);

        if (sA > 0 || sB > 0 || m.status === 'finished') {
            stats[tA].played++;
            stats[tB].played++;
            stats[tA].games += sA;
            stats[tB].games += sB;
            if (sA > sB) stats[tA].won++; else if (sB > sA) stats[tB].won++;
        }
    });

    const ranking = Object.values(stats).sort((a, b) => b.games - a.games || b.won - a.won);
    const maxGames = ranking.length > 0 ? Math.max(...ranking.map(r => r.games)) : 1;

    stContainer.innerHTML = ranking.map((r, i) => {
        const isPodium = i < 3;
        const barWidth = (r.games / maxGames) * 100;
        const icon = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;

        return `
            <div style="position: relative; margin-bottom: 8px; padding: 10px 12px; background: rgba(255,255,255,0.02); border-radius: 10px; border: 1px solid rgba(255,255,255,0.05); overflow: hidden;">
                <div style="position: absolute; left: 0; top: 0; height: 100%; width: ${barWidth}%; background: rgba(52,152,219,0.1); z-index: 0;"></div>
                <div style="position: relative; z-index: 1; display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-weight: 900; color: #3498db; width: 25px;">${icon}</span>
                        <div>
                            <div style="font-weight: 700; color: white; font-size: 0.85rem;">${r.name}</div>
                            <div style="font-size: 0.7rem; color: #888;">${r.played} partidos</div>
                        </div>
                    </div>
                    <div style="font-weight: 900; color: #3498db; font-size: 1.1rem;">${r.games} <span style="font-size: 0.7rem; opacity: 0.5;">VICT</span></div>
                </div>
            </div>`;
    }).join('');
}

window.setEntrenoWinner = async (matchId, winnerTeam) => {
    await FirebaseDB.entrenos_matches.update(matchId, {
        score_a: winnerTeam === 'A' ? 1 : 0,
        score_b: winnerTeam === 'B' ? 1 : 0,
        status: 'finished'
    });

    // Trigger Automation
    if (window.AmericanaService && window.AmericanaService.generateNextRound) {
        // Small delay to ensure consistency
        setTimeout(() => {
            window.AmericanaService.generateNextRound(window.selectedEntrenoId, window.currentEntrenoRound, 'entreno');
        }, 500);
    }

    renderEntrenoMatches(window.selectedEntrenoId, window.currentEntrenoRound);
};

window.resetEntrenoRound = async (id, round) => {
    if (!confirm(`¿Reiniciar Ronda ${round}?`)) return;
    const matches = await FirebaseDB.entrenos_matches.getByAmericana(id);
    const roundMatches = matches.filter(m => m.round === round);
    await Promise.all(roundMatches.map(m => FirebaseDB.entrenos_matches.update(m.id, { score_a: 0, score_b: 0, status: 'scheduled' })));
    renderEntrenoMatches(id, round);
};

window.simulateEntrenoRound = async (id, round) => {
    const matches = await FirebaseDB.entrenos_matches.getByAmericana(id);
    const roundMatches = matches.filter(m => m.round === round);
    await Promise.all(roundMatches.map(m => {
        const winA = Math.random() > 0.5;
        return FirebaseDB.entrenos_matches.update(m.id, { score_a: winA ? 1 : 0, score_b: winA ? 0 : 1, status: 'finished' });
    }));

    // Trigger Automation
    if (window.AmericanaService && window.AmericanaService.generateNextRound) {
        setTimeout(() => {
            window.AmericanaService.generateNextRound(id, round, 'entreno');
        }, 500);
    }

    renderEntrenoMatches(id, round);

};

window.simulateAllEntrenoTournament = async (id) => {
    if (!confirm("¿Simular TODO el entreno?")) return;
    const matches = await FirebaseDB.entrenos_matches.getByAmericana(id);
    await Promise.all(matches.map(m => {
        const winA = Math.random() > 0.5;
        return FirebaseDB.entrenos_matches.update(m.id, { score_a: winA ? 1 : 0, score_b: winA ? 0 : 1, status: 'finished' });
    }));
    renderEntrenoMatches(id, window.currentEntrenoRound);
};

window.highlightEntrenoPlayer = (val) => {
    const q = val.toLowerCase();
    document.querySelectorAll('.entreno-match-card').forEach(card => {
        const players = card.getAttribute('data-players') || '';
        card.style.opacity = (q === '' || players.includes(q)) ? '1' : '0.15';
    });
};

window.updateEntrenoMaxCourtsQuick = async (id) => {
    const val = document.getElementById('entreno-quick-max-courts').value;
    await FirebaseDB.entrenos.update(id, { max_courts: parseInt(val) });
    alert("Pistas actualizadas");
};

window.renderEntrenoSummary = (id) => {
    if (window.ControlTowerView) {
        document.getElementById('content-area').innerHTML = '';
        window.ControlTowerView.load(id);
    }
};

// MANUAL MATCH GENERATION (FALLBACK)
window.forceGenerateEntrenoMatches = async (entrenoId, roundNum) => {
    if (!window.AmericanaService) {
        alert("❌ AmericanaService no está cargado. Recarga la página.");
        return;
    }

    if (!confirm(`¿Generar partidos para el Partido ${roundNum}?`)) return;

    try {
        if (roundNum === 1) {
            await window.AmericanaService.generateFirstRoundMatches(entrenoId, 'entreno');
        } else {
            await window.AmericanaService.generateNextRound(entrenoId, roundNum - 1, 'entreno');
        }
        alert("✅ Partidos generados correctamente");
        setTimeout(() => window.renderEntrenoMatches(entrenoId, roundNum), 500);
    } catch (err) {
        alert("❌ Error: " + err.message);
        console.error(err);
    }
};

window.generateEntrenoNextRound = async (id, round) => {
    if (!confirm(`¿Generar automáticamente la Ronda ${round}?`)) return;

    if (window.AmericanaService) {
        // Updated to use the new generic method
        if (window.AmericanaService.generateNextRound) {
            await window.AmericanaService.generateNextRound(id, round - 1, 'entreno'); // Pass CURRENT completed round
        } else {
            // Fallback
            await window.AmericanaService.generateEntrenoNextRound(id, round - 1);
        }

        // Refresh after short delay
        setTimeout(() => renderEntrenoMatches(id, round), 1000);
    } else {
        alert("AmericanaService no disponible");
    }
};

window.AdminViews.entrenos_simulator = async function () {
    const content = document.getElementById('content-area');
    const titleEl = document.getElementById('page-title');

    if (titleEl) titleEl.textContent = 'Simulador de Entrenos';

    content.innerHTML = `
        <div class="glass-card-enterprise" style="max-width: 800px; margin: 0 auto; text-align: center; padding: 3rem;">
            <div style="font-size: 4rem; margin-bottom: 2rem;">🏋️</div>
            <h2 style="color: var(--primary); margin-bottom: 1rem;">Simulador de Entrenos PRO</h2>
            <p style="color: var(--text-muted); margin-bottom: 2.5rem;">Crea Escenarios de Entrenamiento con Alumnos Reales</p>
            
            <div style="margin-bottom: 2rem; background: rgba(255,255,255,0.03); padding: 2rem; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05);">
                <label style="color: var(--primary); font-weight: 800; display: block; margin-bottom: 1rem; letter-spacing: 1px;">⚙️ CONFIGURACIÓN DEL SIMULADOR</label>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div>
                        <label style="font-size: 0.7rem; color: var(--text-muted); display: block; margin-bottom: 5px;">PISTAS (CAPACIDAD)</label>
                        <select id="sim-training-courts" class="pro-input" style="width: 100%; text-align: center;">
                            <option value="2">2 Pistas (8 Pax)</option>
                            <option value="3" selected>3 Pistas (12 Pax)</option>
                            <option value="4">4 Pistas (16 Pax)</option>
                            <option value="5">5 Pistas (20 Pax)</option>
                        </select>
                    </div>
                    <div>
                        <label style="font-size: 0.7rem; color: var(--text-muted); display: block; margin-bottom: 5px;">MODO DE PAREJAS</label>
                        <select id="sim-training-pair-mode" class="pro-input" style="width: 100%; text-align: center;">
                            <option value="fixed">🔒 Pareja Fija (Pozo)</option>
                            <option value="rotating" selected>🔄 Twister (Individual)</option>
                        </select>
                    </div>
                </div>
            </div>

            <div id="sim-training-status" style="display: none; margin-bottom: 2rem; padding: 1rem; background: rgba(0,0,0,0.3); border-radius: 8px; font-family: monospace; text-align: left; font-size: 0.8rem; color: #00E36D;"></div>

            <button class="btn-primary-pro" style="padding: 1rem 3rem; font-size: 1.1rem;" onclick="AdminSimulator.runTrainingCycle()">
                🚀 LANZAR SIMULACIÓN DE ENTRENO
            </button>
        </div>
    `;
};
