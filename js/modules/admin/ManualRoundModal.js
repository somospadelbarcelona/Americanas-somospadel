/**
 * ManualRoundModal.js
 * Pizarra y Asignador Visual de Rondas Manuales.
 * Exclusivo para usuarios con rol ADMIN y SUPERADMIN.
 * Soporta Entrenos y Americanas (Ronda 1 y rondas sucesivas).
 * 
 * Mejoras v2:
 * - Filtro dinámico estricto: NUNCA permite duplicar jugadores (solo muestra los disponibles).
 * - Barra visual de Jugadores Disponibles / Sin asignar con sus niveles en tiempo real.
 * - Desasignación instantánea con botón '✕'.
 * - Asignación directa en un clic desde los jugadores disponibles al primer hueco libre.
 */

(function () {
    'use strict';

    window.ManualRoundModal = {
        state: {
            isOpen: false,
            eventId: null,
            eventType: 'entreno', // 'entreno' | 'americana'
            round: 1,
            eventData: null,
            players: [],
            courtCount: 4,
            courtsData: [] // Array of { courtNum, teamA: [id1, id2], teamB: [id3, id4] }
        },

        isAuthorized() {
            try {
                const user = window.AdminAuth?.user || 
                    (window.AuthService?.getCurrentUser && window.AuthService.getCurrentUser()) ||
                    JSON.parse(localStorage.getItem('adminUser') || localStorage.getItem('currentUser') || 'null');
                const role = (user?.role || '').toLowerCase().trim();
                return ['super_admin', 'superadmin', 'admin', 'admin_player'].includes(role);
            } catch (e) {
                return false;
            }
        },

        async open(eventId, eventType = 'entreno', targetRound = 1) {
            if (!this.isAuthorized()) {
                if (window.PremiumModal?.alert) {
                    window.PremiumModal.alert({
                        title: "ACCESO RESTRINGIDO",
                        message: "Esta función de definición manual de rondas está reservada exclusivamente para ADMIN y SUPERADMIN.",
                        type: "warning"
                    });
                } else {
                    alert("⛔ Acceso restringido: Solo ADMIN y SUPERADMIN pueden definir rondas a mano.");
                }
                return;
            }

            this.state.eventId = eventId;
            this.state.eventType = eventType;
            this.state.round = parseInt(targetRound) || 1;

            this.renderModalSkeleton();
            await this.loadEventData();
        },

        close() {
            const modalEl = document.getElementById('manual-round-modal-overlay');
            if (modalEl) {
                modalEl.remove();
            }
            this.state.isOpen = false;
        },

        renderModalSkeleton() {
            let existing = document.getElementById('manual-round-modal-overlay');
            if (existing) existing.remove();

            const isEntreno = this.state.eventType === 'entreno';
            const accentColor = isEntreno ? '#a855f7' : '#CCFF00';
            const accentBg = isEntreno ? 'rgba(168, 85, 247, 0.15)' : 'rgba(204, 255, 0, 0.15)';

            const html = `
            <div id="manual-round-modal-overlay" class="modal-overlay" style="display:flex; align-items:center; justify-content:center; position:fixed; inset:0; background:rgba(0,0,0,0.88); z-index:99999; backdrop-filter:blur(8px); padding: 12px;">
                <div class="modal-content" style="width:100%; max-width:1020px; max-height:94vh; background:#0b1329; border:2px solid ${accentColor}; border-radius:18px; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 12px 50px rgba(0,0,0,0.9);">
                    
                    <!-- HEADER -->
                    <div style="padding:14px 20px; background:linear-gradient(135deg, rgba(30,41,59,0.95), rgba(15,23,42,0.98)); border-bottom:1px solid rgba(255,255,255,0.1); display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
                        <div style="display:flex; align-items:center; gap:12px;">
                            <span style="background:${accentBg}; color:${accentColor}; width:38px; height:38px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:1.1rem; border:1px solid ${accentColor}40;">
                                <i class="fas fa-sliders"></i>
                            </span>
                            <div>
                                <h3 id="mrm-title" style="margin:0; font-size:1.15rem; font-weight:900; color:#ffffff; letter-spacing:0.3px;">
                                    Definir Ronda Manualmente
                                </h3>
                                <p id="mrm-subtitle" style="margin:2px 0 0 0; font-size:0.75rem; color:#94a3b8;">
                                    Cargando información del evento...
                                </p>
                            </div>
                        </div>

                        <!-- ROUND SELECTOR & CLOSE -->
                        <div style="display:flex; align-items:center; gap:10px;">
                            <div style="display:flex; align-items:center; background:#1e293b; border-radius:10px; padding:3px 10px; border:1px solid rgba(255,255,255,0.15);">
                                <label style="font-size:0.7rem; color:#cbd5e1; font-weight:800; margin-right:6px; margin-bottom:0 !important;">RONDA:</label>
                                <select id="mrm-round-select" onchange="window.ManualRoundModal.changeRound(this.value)" 
                                    style="background:transparent; color:${accentColor}; border:none; font-weight:900; font-size:0.95rem; cursor:pointer; outline:none;">
                                    ${[1,2,3,4,5,6,7,8,9,10].map(r => `<option value="${r}" ${r === this.state.round ? 'selected' : ''} style="background:#0f172a; color:#fff;">Ronda ${r}</option>`).join('')}
                                </select>
                            </div>
                            <button onclick="window.ManualRoundModal.close()" 
                                style="background:rgba(255,255,255,0.08); border:none; color:#cbd5e1; width:34px; height:34px; border-radius:8px; cursor:pointer; font-size:1.2rem; display:flex; align-items:center; justify-content:center; transition:all 0.2s;"
                                onmouseover="this.style.background='rgba(239,68,68,0.2)'; this.style.color='#ef4444';"
                                onmouseout="this.style.background='rgba(255,255,255,0.08)'; this.style.color='#cbd5e1';">
                                &times;
                            </button>
                        </div>
                    </div>

                    <!-- TOOLBAR ACCIONES -->
                    <div style="padding:10px 20px; background:#111c35; border-bottom:1px solid rgba(255,255,255,0.08); display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px;">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <button type="button" onclick="window.ManualRoundModal.autoFillProposal()" 
                                style="background:linear-gradient(135deg, #3b82f6, #2563eb); color:#fff; border:none; padding:7px 14px; border-radius:8px; font-weight:800; font-size:0.75rem; cursor:pointer; display:flex; align-items:center; gap:6px; box-shadow:0 2px 8px rgba(59,130,246,0.3);">
                                <i class="fas fa-magic"></i> ⚡ Cargar Propuesta Algoritmo
                            </button>
                            <button type="button" onclick="window.ManualRoundModal.clearCourts()" 
                                style="background:rgba(255,255,255,0.06); color:#cbd5e1; border:1px solid rgba(255,255,255,0.15); padding:7px 12px; border-radius:8px; font-weight:700; font-size:0.75rem; cursor:pointer; display:flex; align-items:center; gap:6px;">
                                <i class="fas fa-eraser"></i> Vaciar Pistas
                            </button>
                        </div>

                        <!-- COURTS COUNT SELECTOR -->
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span style="font-size:0.75rem; color:#94a3b8; font-weight:700;">Nº Pistas:</span>
                            <select id="mrm-court-count-select" onchange="window.ManualRoundModal.changeCourtCount(parseInt(this.value))"
                                style="background:#0f172a; color:#fff; border:1px solid rgba(255,255,255,0.2); border-radius:6px; padding:4px 8px; font-size:0.8rem; font-weight:800; cursor:pointer;">
                                ${[1,2,3,4,5,6,7,8,9,10,11,12].map(n => `<option value="${n}">${n} ${n===1?'Pista':'Pistas'}</option>`).join('')}
                            </select>
                        </div>
                    </div>

                    <!-- 🌟 PANEL DE JUGADORES DISPONIBLES (NUEVO) -->
                    <div id="mrm-available-panel" style="padding:12px 20px; background:#0d182e; border-bottom:1px solid rgba(255,255,255,0.08); max-height:140px; overflow-y:auto;">
                        <!-- Contenido dinámico de disponibles -->
                    </div>

                    <!-- BODY: COURTS GRID -->
                    <div id="mrm-body" style="padding:16px 20px; overflow-y:auto; flex:1; display:flex; flex-direction:column; gap:14px; background:#0b1329;">
                        <div class="loading-container" style="padding:3rem; text-align:center; color:#94a3b8;">
                            <div class="loader"></div>
                            <p style="margin-top:10px;">Cargando participantes y pistas...</p>
                        </div>
                    </div>

                    <!-- FOOTER -->
                    <div style="padding:12px 20px; background:#111c35; border-top:1px solid rgba(255,255,255,0.1); display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
                        <div id="mrm-resting-summary" style="font-size:0.75rem; color:#94a3b8;">
                            <!-- Resting players summary -->
                        </div>
                        <div style="display:flex; align-items:center; gap:10px;">
                            <button type="button" onclick="window.ManualRoundModal.close()" 
                                style="background:transparent; color:#94a3b8; border:1px solid rgba(255,255,255,0.15); padding:9px 18px; border-radius:10px; font-weight:700; font-size:0.85rem; cursor:pointer;">
                                Cancelar
                            </button>
                            <button type="button" id="mrm-save-btn" onclick="window.ManualRoundModal.saveAndPublish()" 
                                style="background:${accentColor}; color:#000; border:none; padding:9px 24px; border-radius:10px; font-weight:900; font-size:0.9rem; cursor:pointer; display:flex; align-items:center; gap:8px; box-shadow:0 4px 15px ${accentColor}40;">
                                <i class="fas fa-save"></i> Guardar y Publicar Ronda
                            </button>
                        </div>
                    </div>

                </div>
            </div>`;

            document.body.insertAdjacentHTML('beforeend', html);
            this.state.isOpen = true;
        },

        async loadEventData() {
            try {
                const { eventId, eventType, round } = this.state;
                const collection = (eventType === 'entreno') ? window.FirebaseDB?.entrenos : window.FirebaseDB?.americanas;
                
                let evt = null;
                if (collection && collection.getById) {
                    evt = await collection.getById(eventId);
                } else if (window.EventService) {
                    evt = await window.EventService.getById(eventType, eventId);
                }

                if (!evt) {
                    throw new Error("No se pudo cargar la información del evento.");
                }

                this.state.eventData = evt;
                this.state.players = (evt.players || []).filter(p => p && (p.id || p.name));

                // Title & Subtitle
                const titleEl = document.getElementById('mrm-title');
                const subEl = document.getElementById('mrm-subtitle');
                if (titleEl) titleEl.textContent = `Definir Ronda ${round} — ${evt.name || 'Evento'}`;
                if (subEl) subEl.textContent = `${this.state.players.length} jugadores inscritos | Modo: ${evt.pair_mode || 'rotativo'} | Sede: ${evt.location || evt.sede || 'Club'}`;

                // Calculate default courts
                let defaultCourts = parseInt(evt.max_courts) || 4;
                const neededByPlayers = Math.ceil(this.state.players.length / 4);
                if (neededByPlayers > 0 && neededByPlayers !== defaultCourts) {
                    defaultCourts = Math.max(1, neededByPlayers);
                }
                this.state.courtCount = defaultCourts;

                const courtSelect = document.getElementById('mrm-court-count-select');
                if (courtSelect) courtSelect.value = defaultCourts;

                // Load existing matches for this round if any
                await this.loadExistingRoundMatches(round);

            } catch (err) {
                console.error("Error loading event for manual round:", err);
                const body = document.getElementById('mrm-body');
                if (body) {
                    body.innerHTML = `<div style="padding:2rem; text-align:center; color:#ef4444;">
                        <i class="fas fa-exclamation-circle" style="font-size:2rem; margin-bottom:10px;"></i>
                        <p>${err.message || 'Error al conectar con la base de datos'}</p>
                    </div>`;
                }
            }
        },

        async loadExistingRoundMatches(roundNum) {
            const { eventId, eventType, courtCount } = this.state;
            const matchesCol = (eventType === 'entreno') ? 'entrenos_matches' : 'matches';

            let existingMatches = [];
            try {
                if (window.db) {
                    const snap = await window.db.collection(matchesCol)
                        .where('americana_id', '==', eventId)
                        .where('round', '==', parseInt(roundNum))
                        .get();
                    existingMatches = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                }
            } catch (e) {
                console.warn("Could not query existing matches:", e);
            }

            // Initialize courts data
            const courtsData = [];
            for (let c = 1; c <= courtCount; c++) {
                const matchForCourt = existingMatches.find(m => parseInt(m.court) === c);
                if (matchForCourt) {
                    courtsData.push({
                        courtNum: c,
                        teamA: [matchForCourt.team_a_ids?.[0] || '', matchForCourt.team_a_ids?.[1] || ''],
                        teamB: [matchForCourt.team_b_ids?.[0] || '', matchForCourt.team_b_ids?.[1] || '']
                    });
                } else {
                    courtsData.push({
                        courtNum: c,
                        teamA: ['', ''],
                        teamB: ['', '']
                    });
                }
            }

            this.state.courtsData = courtsData;
            this.renderCourtsUI();
        },

        getAssignedPlayerIds() {
            const assigned = new Set();
            this.state.courtsData.forEach(c => {
                [...c.teamA, ...c.teamB].forEach(id => {
                    if (id) assigned.add(id);
                });
            });
            return assigned;
        },

        renderCourtsUI() {
            const body = document.getElementById('mrm-body');
            if (!body) return;

            const { courtsData, players, eventType } = this.state;
            const isEntreno = eventType === 'entreno';
            const courtBorderColor = isEntreno ? 'rgba(168, 85, 247, 0.4)' : 'rgba(204, 255, 0, 0.4)';
            const vsColor = isEntreno ? '#c084fc' : '#CCFF00';

            const assignedIds = this.getAssignedPlayerIds();

            // Sorted master player list
            const sortedPlayers = [...players].sort((a, b) => {
                const lA = parseFloat(a.level || a.self_rate_level || 0);
                const lB = parseFloat(b.level || b.self_rate_level || 0);
                return lB - lA;
            });

            // 1. Render Courts
            const courtsHTML = courtsData.map(c => {
                const getSlotSelect = (slotId, currentValue) => {
                    // 🛡️ REGLA ESTRICTA ANTI-DUPLICADOS:
                    // En las opciones de este select, solo mostramos los jugadores que NO estén asignados
                    // en ningún otro slot, MÁS el jugador actual de este slot (para que no desaparezca).
                    const availableForThisSlot = sortedPlayers.filter(p => 
                        !assignedIds.has(p.id) || p.id === currentValue
                    );

                    const currentPlayer = sortedPlayers.find(p => p.id === currentValue);
                    const hasPlayer = Boolean(currentPlayer);

                    return `
                        <div style="display:flex; align-items:center; gap:6px; width:100%;">
                            <select onchange="window.ManualRoundModal.updateSlot(${c.courtNum}, '${slotId}', this.value)"
                                style="flex:1; height:38px; border-radius:8px; color:#ffffff; font-size:0.8rem; font-weight:700; padding:0 8px; outline:none; cursor:pointer; background:#1e293b; border:${hasPlayer ? '1px solid #3b82f6' : '1px dashed rgba(255,255,255,0.2)'};">
                                <option value="" style="background:#0f172a; color:#64748b;">-- Vacío / Sin Asignar --</option>
                                ${availableForThisSlot.map(p => {
                                    const level = p.level || p.self_rate_level || '—';
                                    const isSelected = p.id === currentValue;
                                    return `<option value="${p.id}" ${isSelected ? 'selected' : ''} style="background:#0f172a; color:#fff;">
                                        ${p.name} (Nivel ${level})
                                    </option>`;
                                }).join('')}
                            </select>
                            ${hasPlayer ? `
                            <button type="button" onclick="window.ManualRoundModal.clearSlot(${c.courtNum}, '${slotId}')"
                                title="Quitar jugador (volver a disponibles)"
                                style="background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.3); color:#f87171; width:34px; height:34px; border-radius:8px; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                                <i class="fas fa-times"></i>
                            </button>
                            ` : ''}
                        </div>
                    `;
                };

                return `
                <div class="mrm-court-card" style="background:#131f38; border:1px solid ${courtBorderColor}; border-radius:14px; padding:12px 16px; display:flex; flex-direction:column; gap:10px; box-shadow:0 4px 14px rgba(0,0,0,0.3);">
                    
                    <!-- COURT TITLE BAR -->
                    <div style="display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:8px;">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span style="background:${vsColor}20; color:${vsColor}; font-weight:900; font-size:0.75rem; padding:3px 10px; border-radius:6px; border:1px solid ${vsColor}40;">
                                🎾 PISTA ${c.courtNum}
                            </span>
                        </div>
                        <div style="display:flex; gap:6px;">
                            <button type="button" onclick="window.ManualRoundModal.swapSides(${c.courtNum})" 
                                title="Intercambiar Pareja A y B"
                                style="background:rgba(255,255,255,0.06); border:none; color:#cbd5e1; padding:4px 8px; border-radius:6px; font-size:0.7rem; font-weight:700; cursor:pointer;">
                                <i class="fas fa-arrows-rotate"></i> Invertir
                            </button>
                            <button type="button" onclick="window.ManualRoundModal.clearSingleCourt(${c.courtNum})" 
                                title="Vaciar esta pista"
                                style="background:rgba(239,68,68,0.1); border:none; color:#f87171; padding:4px 8px; border-radius:6px; font-size:0.7rem; font-weight:700; cursor:pointer;">
                                <i class="fas fa-trash-can"></i>
                            </button>
                        </div>
                    </div>

                    <!-- TEAMS GRID -->
                    <div style="display:grid; grid-template-columns:1fr auto 1fr; gap:12px; align-items:center;">
                        
                        <!-- TEAM A -->
                        <div style="background:rgba(30,41,59,0.5); padding:10px; border-radius:10px; border:1px solid rgba(255,255,255,0.05); display:flex; flex-direction:column; gap:8px;">
                            <div style="font-size:0.7rem; font-weight:900; color:#38bdf8; text-transform:uppercase; letter-spacing:0.5px;">
                                <i class="fas fa-user-group"></i> PAREJA A
                            </div>
                            <div>${getSlotSelect('a0', c.teamA[0])}</div>
                            <div>${getSlotSelect('a1', c.teamA[1])}</div>
                        </div>

                        <!-- VS BADGE -->
                        <div style="text-align:center; font-weight:900; font-size:0.85rem; color:${vsColor}; text-shadow:0 0 8px ${vsColor}60; padding:0 4px;">
                            VS
                        </div>

                        <!-- TEAM B -->
                        <div style="background:rgba(30,41,59,0.5); padding:10px; border-radius:10px; border:1px solid rgba(255,255,255,0.05); display:flex; flex-direction:column; gap:8px;">
                            <div style="font-size:0.7rem; font-weight:900; color:#f472b6; text-transform:uppercase; letter-spacing:0.5px;">
                                <i class="fas fa-user-group"></i> PAREJA B
                            </div>
                            <div>${getSlotSelect('b0', c.teamB[0])}</div>
                            <div>${getSlotSelect('b1', c.teamB[1])}</div>
                        </div>

                    </div>

                </div>`;
            }).join('');

            body.innerHTML = `
                <div style="display:flex; flex-direction:column; gap:12px;">
                    ${courtsHTML}
                </div>
            `;

            // 2. Render Available Panel
            this.renderAvailablePanel(sortedPlayers, assignedIds);

            // 3. Render Bottom Summary
            this.updateRestingSummary();
        },

        renderAvailablePanel(sortedPlayers, assignedIds) {
            const panel = document.getElementById('mrm-available-panel');
            if (!panel) return;

            const available = sortedPlayers.filter(p => !assignedIds.has(p.id));
            const totalAssigned = assignedIds.size;
            const totalPlayers = sortedPlayers.length;

            if (available.length === 0) {
                panel.innerHTML = `
                    <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span style="background:rgba(16,185,129,0.2); color:#10b981; border:1px solid rgba(16,185,129,0.4); padding:3px 10px; border-radius:8px; font-weight:800; font-size:0.75rem;">
                                <i class="fas fa-check-double"></i> TODOS ASIGNADOS
                            </span>
                            <span style="color:#cbd5e1; font-size:0.8rem; font-weight:600;">
                                Los <strong>${totalPlayers}</strong> jugadores inscritos están colocados en las pistas.
                            </span>
                        </div>
                    </div>
                `;
                return;
            }

            const chipsHTML = available.map(p => {
                const level = p.level || p.self_rate_level || '—';
                return `
                    <div onclick="window.ManualRoundModal.assignToNextEmptySlot('${p.id}')"
                        title="Haz clic para colocar a ${p.name} en el primer hueco libre"
                        style="display:inline-flex; align-items:center; gap:6px; background:#1e293b; border:1px solid rgba(59,130,246,0.3); border-radius:8px; padding:4px 10px; cursor:pointer; transition:all 0.15s ease;"
                        onmouseover="this.style.borderColor='#38bdf8'; this.style.transform='translateY(-1px)';"
                        onmouseout="this.style.borderColor='rgba(59,130,246,0.3)'; this.style.transform='none';">
                        <span style="color:#ffffff; font-weight:700; font-size:0.75rem;">${p.name}</span>
                        <span style="background:rgba(59,130,246,0.25); color:#60a5fa; font-weight:800; font-size:0.65rem; padding:1px 5px; border-radius:4px;">
                            ${level}
                        </span>
                        <i class="fas fa-plus" style="font-size:0.65rem; color:#38bdf8; margin-left:2px;"></i>
                    </div>
                `;
            }).join('');

            panel.innerHTML = `
                <div style="display:flex; flex-direction:column; gap:8px;">
                    <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span style="background:rgba(245,158,11,0.2); color:#f59e0b; border:1px solid rgba(245,158,11,0.4); padding:2px 8px; border-radius:6px; font-weight:800; font-size:0.72rem;">
                                👥 DISPONIBLES (${available.length})
                            </span>
                            <span style="color:#94a3b8; font-size:0.75rem;">
                                Haz clic en un jugador para asignarlo al primer hueco libre:
                            </span>
                        </div>
                        <span style="color:#64748b; font-size:0.72rem;">
                            Asignados: <strong>${totalAssigned}</strong> / ${totalPlayers}
                        </span>
                    </div>
                    <div style="display:flex; flex-wrap:wrap; gap:6px;">
                        ${chipsHTML}
                    </div>
                </div>
            `;
        },

        assignToNextEmptySlot(playerId) {
            for (const c of this.state.courtsData) {
                if (!c.teamA[0]) { c.teamA[0] = playerId; this.renderCourtsUI(); return; }
                if (!c.teamA[1]) { c.teamA[1] = playerId; this.renderCourtsUI(); return; }
                if (!c.teamB[0]) { c.teamB[0] = playerId; this.renderCourtsUI(); return; }
                if (!c.teamB[1]) { c.teamB[1] = playerId; this.renderCourtsUI(); return; }
            }
            alert("Todas las pistas habilitadas están llenas. Aumenta el número de pistas si deseas asignar a más jugadores.");
        },

        updateSlot(courtNum, slotId, playerId) {
            const court = this.state.courtsData.find(c => c.courtNum === courtNum);
            if (!court) return;

            if (slotId === 'a0') court.teamA[0] = playerId;
            else if (slotId === 'a1') court.teamA[1] = playerId;
            else if (slotId === 'b0') court.teamB[0] = playerId;
            else if (slotId === 'b1') court.teamB[1] = playerId;

            this.renderCourtsUI();
        },

        clearSlot(courtNum, slotId) {
            this.updateSlot(courtNum, slotId, '');
        },

        swapSides(courtNum) {
            const court = this.state.courtsData.find(c => c.courtNum === courtNum);
            if (!court) return;
            const temp = [...court.teamA];
            court.teamA = [...court.teamB];
            court.teamB = temp;
            this.renderCourtsUI();
        },

        clearSingleCourt(courtNum) {
            const court = this.state.courtsData.find(c => c.courtNum === courtNum);
            if (!court) return;
            court.teamA = ['', ''];
            court.teamB = ['', ''];
            this.renderCourtsUI();
        },

        clearCourts() {
            if (!confirm("¿Deseas vaciar todas las pistas? Todos los jugadores volverán a la lista de disponibles.")) return;
            this.state.courtsData.forEach(c => {
                c.teamA = ['', ''];
                c.teamB = ['', ''];
            });
            this.renderCourtsUI();
        },

        changeCourtCount(newCount) {
            this.state.courtCount = newCount;
            const currentCourts = [...this.state.courtsData];
            const newCourtsData = [];

            for (let c = 1; c <= newCount; c++) {
                const existing = currentCourts.find(item => item.courtNum === c);
                if (existing) {
                    newCourtsData.push(existing);
                } else {
                    newCourtsData.push({
                        courtNum: c,
                        teamA: ['', ''],
                        teamB: ['', '']
                    });
                }
            }

            this.state.courtsData = newCourtsData;
            this.renderCourtsUI();
        },

        async changeRound(newRound) {
            this.state.round = parseInt(newRound);
            const titleEl = document.getElementById('mrm-title');
            if (titleEl && this.state.eventData) {
                titleEl.textContent = `Definir Ronda ${this.state.round} — ${this.state.eventData.name || 'Evento'}`;
            }
            await this.loadExistingRoundMatches(this.state.round);
        },

        autoFillProposal() {
            const { players, courtCount } = this.state;
            if (!players || players.length === 0) {
                alert("No hay jugadores inscritos en este evento.");
                return;
            }

            // Ordenados por nivel descendente
            const pool = [...players].sort((a, b) => {
                const lA = parseFloat(a.level || a.self_rate_level || 0);
                const lB = parseFloat(b.level || b.self_rate_level || 0);
                return lB - lA;
            });

            this.state.courtsData = [];
            for (let c = 1; c <= courtCount; c++) {
                const startIdx = (c - 1) * 4;
                const p1 = pool[startIdx]?.id || '';
                const p2 = pool[startIdx + 1]?.id || '';
                const p3 = pool[startIdx + 2]?.id || '';
                const p4 = pool[startIdx + 3]?.id || '';

                this.state.courtsData.push({
                    courtNum: c,
                    teamA: [p1, p2],
                    teamB: [p3, p4]
                });
            }

            this.renderCourtsUI();
            if (window.NotificationService?.showToast) {
                window.NotificationService.showToast("⚡ Propuesta cargada: pistas rellenadas por nivel.", "info");
            }
        },

        updateRestingSummary() {
            const summaryEl = document.getElementById('mrm-resting-summary');
            if (!summaryEl) return;

            const { players, courtsData } = this.state;
            const assignedIds = this.getAssignedPlayerIds();

            const restingPlayers = players.filter(p => !assignedIds.has(p.id));
            const totalAssigned = assignedIds.size;

            if (restingPlayers.length > 0) {
                summaryEl.innerHTML = `
                    <span style="color:#f59e0b; font-weight:800;">
                        <i class="fas fa-chair"></i> Quedarán en descanso (${restingPlayers.length}):
                    </span> 
                    <span style="color:#cbd5e1;">${restingPlayers.map(p => p.name).join(', ')}</span>
                    <span style="margin-left:8px; color:#64748b;">(${totalAssigned} jugando)</span>
                `;
            } else {
                summaryEl.innerHTML = `
                    <span style="color:#10b981; font-weight:800;">
                        <i class="fas fa-check-circle"></i> Todos los inscritos asignados (${totalAssigned} jugadores en pista).
                    </span>
                `;
            }
        },

        async saveAndPublish() {
            const { eventId, eventType, round, courtsData, players } = this.state;

            // 1. Filtrar pistas con jugadores
            const activeCourts = courtsData.filter(c => c.teamA.some(Boolean) || c.teamB.some(Boolean));
            if (activeCourts.length === 0) {
                alert("Debes asignar al menos una pista para guardar la ronda.");
                return;
            }

            // 2. Verificar pistas incompletas
            const incompleteCourts = activeCourts.filter(c => 
                !c.teamA[0] || !c.teamA[1] || !c.teamB[0] || !c.teamB[1]
            );
            if (incompleteCourts.length > 0) {
                const courtNums = incompleteCourts.map(c => c.courtNum).join(', ');
                if (!confirm(`⚠️ Las pistas ${courtNums} tienen puestos vacíos (menos de 4 jugadores).\n\n¿Deseas guardar de todos modos?`)) {
                    return;
                }
            }

            // 3. Formatear datos de partidos
            const playerMap = {};
            players.forEach(p => { playerMap[p.id] = p; });

            const matchesData = activeCourts.map(c => {
                const teamA_names = [playerMap[c.teamA[0]]?.name || '?', playerMap[c.teamA[1]]?.name || '?'];
                const teamB_names = [playerMap[c.teamB[0]]?.name || '?', playerMap[c.teamB[1]]?.name || '?'];

                return {
                    court: c.courtNum,
                    round: parseInt(round),
                    team_a_ids: c.teamA.filter(Boolean),
                    team_b_ids: c.teamB.filter(Boolean),
                    team_a_names: teamA_names,
                    team_b_names: teamB_names,
                    status: 'scheduled',
                    score_a: 0,
                    score_b: 0,
                    is_manual: true
                };
            });

            const assignedIds = this.getAssignedPlayerIds();
            const restingPlayers = players.filter(p => !assignedIds.has(p.id));

            const saveBtn = document.getElementById('mrm-save-btn');
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Guardando...`;
            }

            try {
                if (window.MatchMakingService && window.MatchMakingService.saveManualRound) {
                    await window.MatchMakingService.saveManualRound(eventId, eventType, round, matchesData, restingPlayers);
                } else {
                    await this.fallbackSave(eventId, eventType, round, matchesData, restingPlayers);
                }

                if (window.NotificationService?.showToast) {
                    window.NotificationService.showToast(`✅ Ronda ${round} definida y publicada correctamente.`, "success");
                } else {
                    alert(`✅ Ronda ${round} guardada con éxito.`);
                }

                this.close();

                // Refrescar la vista actual
                if (window.loadResultsView && (window._currentAdminView === 'matches' || window._currentAdminView === 'entrenos_results')) {
                    window.loadResultsView(eventType);
                } else if (window.loadAdminView && window._currentAdminView) {
                    window.loadAdminView(window._currentAdminView);
                } else {
                    location.reload();
                }

            } catch (err) {
                console.error("Error saving manual round:", err);
                alert("❌ Error al guardar la ronda: " + err.message);
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = `<i class="fas fa-save"></i> Guardar y Publicar Ronda`;
                }
            }
        },

        async fallbackSave(eventId, eventType, roundNum, matchesData, restingPlayers) {
            const colName = (eventType === 'entreno') ? 'entrenos_matches' : 'matches';
            const dbCol = window.db.collection(colName);

            const snap = await dbCol.where('americana_id', '==', eventId).where('round', '==', parseInt(roundNum)).get();
            const batch = window.db.batch();

            snap.docs.forEach(doc => {
                batch.delete(doc.ref);
            });

            matchesData.forEach(m => {
                const docRef = dbCol.doc();
                batch.set(docRef, {
                    ...m,
                    americana_id: eventId,
                    round: parseInt(roundNum),
                    createdAt: new Date().toISOString()
                });
            });

            await batch.commit();

            const eventCol = (eventType === 'entreno') ? window.FirebaseDB?.entrenos : window.FirebaseDB?.americanas;
            if (eventCol) {
                await eventCol.update(eventId, { status: 'live' });
            }
        }
    };

    // Global Alias
    window.openManualRoundModal = function (eventId, eventType, round = 1) {
        window.ManualRoundModal.open(eventId, eventType, round);
    };

    console.log("💎 ManualRoundModal Module v2 Loaded (Strict Anti-Duplicate & Available Pool)");
})();
