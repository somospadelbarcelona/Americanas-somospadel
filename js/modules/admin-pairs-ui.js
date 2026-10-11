/**
 * admin-pairs-ui.js
 * Shared UI Controller for managing Fixed Pairs.
 * Handles: Listing pairs, Adding new pairs, Auto-Pairing.
 * Refactored to align with FixedPairsLogic schema.
 */

window.PairsUI = {

    /**
     * Load the Pairs Management Interface into a container
     */
    async load(containerId, eventId, eventType) {
        const container = document.getElementById(containerId);
        if (!container) return;

        let event = null;
        try {
            event = await EventService.getById(eventType, eventId);
        } catch (e) {
            console.warn("[PairsUI] Error loading event:", e);
            return;
        }
        if (!event) return;

        // Check active mode from live modal select or event data
        const selectId = eventType === 'entreno' ? 'edit-entreno-pair-mode' : 'edit-americana-pair-mode';
        const selectEl = document.getElementById(selectId);
        const currentMode = (selectEl && selectEl.value) ? selectEl.value : (event.pair_mode || 'twister');

        const isFixed = currentMode === 'fixed' ||
            currentMode === 'fixed_admin' ||
            currentMode === 'fixed_auto' ||
            String(currentMode).toLowerCase().includes('fij') ||
            (event.fixed_pairs && event.fixed_pairs.length > 0) ||
            (event.players && event.players.some(p => p.partner_id || p.partner_name)) ||
            (window.PreFlightRoundVerifier && window.PreFlightRoundVerifier.normalizePairMode(currentMode, event) === 'fixed') ||
            (event.name && (event.name.toUpperCase().includes('FIJA') || event.name.toUpperCase().includes('FIJO')));

        if (!isFixed) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';
        container.innerHTML = `
            <div style="background: rgba(255,255,255,0.04); padding: 15px; border-radius: 12px; margin-top: 15px; border: 1px dashed rgba(204,255,0,0.35);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                    <h4 style="margin:0; color: #CCFF00; font-size:0.85rem; font-weight:900; letter-spacing:0.5px;">
                        <i class="fas fa-user-friends"></i> PAREJAS FIJAS CONFIRMADAS
                    </h4>
                    <span id="pairs-count-${eventId}" style="font-size:0.75rem; color:#94a3b8; font-weight:700;"></span>
                </div>
                
                <div id="pairs-list-${eventId}" style="margin-bottom: 15px;"></div>
                
                <div style="background:rgba(0,0,0,0.3); padding:10px; border-radius:8px; border:1px solid rgba(255,255,255,0.08); margin-bottom:10px;">
                    <div style="font-size:0.7rem; color:#cbd5e1; font-weight:700; margin-bottom:6px; text-transform:uppercase;">
                        👥 Formar Pareja desde Jugadores Inscritos:
                    </div>
                    <div style="display:flex; gap:8px;">
                         <select id="p1-${eventId}" class="pro-input" style="flex:1; font-size:0.75rem; padding:6px; color:#000 !important; background:#fff !important;"></select>
                         <select id="p2-${eventId}" class="pro-input" style="flex:1; font-size:0.75rem; padding:6px; color:#000 !important; background:#fff !important;"></select>
                         <button id="btn-add-pair-${eventId}" class="btn-primary-pro" title="Vincular Pareja" style="padding: 0 14px; font-weight:900; font-size:0.85rem; background:#CCFF00; color:#000; border:none; border-radius:6px; cursor:pointer;">➕</button>
                    </div>
                </div>
                
                <button id="btn-auto-pair-${eventId}" class="btn-outline-pro" style="width:100%; margin-top:5px; font-size:0.75rem; font-weight:800; padding:8px 12px; border:1px solid rgba(204,255,0,0.4); color:#CCFF00; background:rgba(204,255,0,0.05); border-radius:6px; cursor:pointer;">
                    ⚡ AUTO-EMPAREJAR RESTANTES
                </button>
                
                <!-- REGEN BUTTON -->
                <button id="btn-regen-${eventId}" class="btn-primary-pro" style="width:100%; margin-top:10px; background: #e67e22; border:none; color:#fff; font-size:0.75rem; font-weight:800; padding:8px 12px; border-radius:6px; cursor:pointer;">
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
        const countSpan = document.getElementById(`pairs-count-${eventId}`);

        if (!listDiv) return;

        const event = await EventService.getById(eventType, eventId);
        const players = event.players || [];
        const existingPairs = event.fixed_pairs || [];

        // Build deduplicated set of pairs from both fixed_pairs and player partner linkages
        const pairsMap = new Map();

        existingPairs.forEach(p => {
            const p1Id = String(p.player1_id || (p.player1 && (p.player1.id || p.player1.uid)) || '');
            const p2Id = String(p.player2_id || (p.player2 && (p.player2.id || p.player2.uid)) || '');
            if (p1Id && p2Id) {
                const key = [p1Id, p2Id].sort().join('___');
                pairsMap.set(key, {
                    id: p.id || `pair_${p1Id}_${p2Id}`,
                    player1_id: p1Id,
                    player2_id: p2Id,
                    player1_name: p.player1_name || (p.player1 ? p.player1.name : 'Jugador 1'),
                    player2_name: p.player2_name || (p.player2 ? p.player2.name : 'Jugador 2'),
                    current_court: p.current_court || null
                });
            }
        });

        // Also discover any pairs defined directly in event.players
        players.forEach(p => {
            const pid = String(p.id || p.uid || '');
            if (!pid) return;
            const partnerId = String(p.partner_id || '');
            const partner = players.find(x => {
                const xid = String(x.id || x.uid || '');
                return (partnerId && xid === partnerId) ||
                    (p.partner_name && x.name && x.name.trim().toLowerCase() === p.partner_name.trim().toLowerCase());
            });

            if (partner) {
                const partnerPid = String(partner.id || partner.uid || '');
                if (partnerPid && partnerPid !== pid) {
                    const key = [pid, partnerPid].sort().join('___');
                    if (!pairsMap.has(key)) {
                        pairsMap.set(key, {
                            id: `pair_${pid}_${partnerPid}`,
                            player1_id: pid,
                            player2_id: partnerPid,
                            player1_name: p.name || 'Jugador 1',
                            player2_name: partner.name || 'Jugador 2',
                            current_court: null
                        });
                    }
                }
            }
        });

        const allPairs = Array.from(pairsMap.values());
        if (countSpan) countSpan.textContent = `${allPairs.length} pareja${allPairs.length === 1 ? '' : 's'}`;

        // 1. Render Pairs
        if (allPairs.length === 0) {
            listDiv.innerHTML = '<div style="color:#94a3b8; font-size:0.75rem; font-style:italic; padding:6px 0;">Sin parejas definidas aún</div>';
        } else {
            listDiv.innerHTML = allPairs.map((p, i) => {
                const courtInfo = p.current_court ? `<span style="font-size:0.68rem; color:#38bdf8; background:rgba(56,189,248,0.15); padding:2px 6px; border-radius:4px; font-weight:800; margin-left:6px;">Pista ${p.current_court}</span>` : '';
                return `
                <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.06); padding:8px 10px; margin-bottom:5px; border-radius:6px; border:1px solid rgba(255,255,255,0.08);">
                    <span style="color:#ffffff; font-weight:700; font-size:0.78rem;">
                        <i class="fas fa-link" style="color:#38bdf8; margin-right:6px;"></i> ${p.player1_name} 🤝 ${p.player2_name} ${courtInfo}
                    </span>
                    <button onclick="window.PairsUI.removePair('${eventId}', '${eventType}', '${p.player1_id}', '${p.player2_id}')" title="Desvincular pareja" style="color:#ef4444; background:none; border:none; cursor:pointer; font-size:0.9rem; padding:2px 6px;">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            `}).join('');
        }

        // 2. Populate Selects (Available players only)
        const pairedIds = new Set();
        allPairs.forEach(p => {
            if (p.player1_id) pairedIds.add(String(p.player1_id));
            if (p.player2_id) pairedIds.add(String(p.player2_id));
        });

        const seenIds = new Set();
        const available = players.filter(p => {
            const pid = String(p.id || p.uid || '');
            if (!pid || pairedIds.has(pid) || seenIds.has(pid)) return false;
            seenIds.add(pid);
            return true;
        });

        available.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));

        const opts = `<option value="">Seleccionar jugador...</option>` + available.map(p => {
            const partnerInfo = p.partner_name ? ` (busca a ${p.partner_name})` : '';
            return `<option value="${p.id || p.uid}">${p.name}${partnerInfo}</option>`;
        }).join('');

        if (s1) {
            s1.innerHTML = opts;
            s1.onchange = () => {
                const p = available.find(x => String(x.id || x.uid) === s1.value);
                if (p && p.partner_id && s2) {
                    const exists = [...s2.options].some(opt => opt.value === String(p.partner_id));
                    if (exists) s2.value = String(p.partner_id);
                }
            };
        }
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
        if (!s1 || !s2) return;

        const id1 = s1.value;
        const id2 = s2.value;

        if (!id1 || !id2 || id1 === id2) return alert("Selecciona dos jugadores distintos");

        const event = await EventService.getById(eventType, eventId);
        const players = event.players || [];
        const p1Index = players.findIndex(p => String(p.id || p.uid) === id1);
        const p2Index = players.findIndex(p => String(p.id || p.uid) === id2);

        if (p1Index === -1 || p2Index === -1) return alert("Error al encontrar jugadores en el torneo");

        const p1 = players[p1Index];
        const p2 = players[p2Index];

        // Link in players array
        players[p1Index].partner_id = id2;
        players[p1Index].partner_name = p2.name;
        players[p2Index].partner_id = id1;
        players[p2Index].partner_name = p1.name;

        // Link in fixed_pairs
        const currentPairs = event.fixed_pairs || [];
        const nextIndex = currentPairs.length * 2;
        const initialCourt = Math.floor(nextIndex / 4) + 1;

        const newPair = {
            id: `pair_${Date.now()}_manual`,
            player1_id: id1,
            player2_id: id2,
            player1_name: p1.name,
            player2_name: p2.name,
            pair_name: `${p1.name} / ${p2.name}`,
            wins: 0,
            losses: 0,
            games_won: 0,
            games_lost: 0,
            current_court: initialCourt,
            initial_court: initialCourt
        };

        await EventService.updateEvent(eventType, eventId, {
            players: players,
            fixed_pairs: [...currentPairs, newPair],
            pair_mode: 'fixed'
        });

        if (window.NotificationService) {
            window.NotificationService.showToast(`Pareja creada: ${p1.name} 🤝 ${p2.name}`, 'success');
        }

        await this.renderList(eventId, eventType);
        if (eventType === 'entreno' && window.loadEntrenoParticipantsUI) {
            window.loadEntrenoParticipantsUI(eventId);
        } else if (eventType === 'americana' && window.loadAmericanaParticipantsUI) {
            window.loadAmericanaParticipantsUI(eventId);
        }
    },

    async removePair(eventId, eventType, p1Id, p2Id) {
        if (!confirm("¿Desvincular esta pareja?")) return;
        const event = await EventService.getById(eventType, eventId);
        const players = event.players || [];
        const pairs = event.fixed_pairs || [];

        // Unlink in players array
        players.forEach(p => {
            const pid = String(p.id || p.uid);
            if (pid === String(p1Id) || pid === String(p2Id)) {
                delete p.partner_id;
                delete p.partner_name;
            }
        });

        // Remove from fixed_pairs
        const updatedPairs = pairs.filter(p => {
            const pairP1 = String(p.player1_id || (p.player1 && (p.player1.id || p.player1.uid)) || '');
            const pairP2 = String(p.player2_id || (p.player2 && (p.player2.id || p.player2.uid)) || '');
            const matches = (pairP1 === String(p1Id) && pairP2 === String(p2Id)) ||
                            (pairP1 === String(p2Id) && pairP2 === String(p1Id));
            return !matches;
        });

        await EventService.updateEvent(eventType, eventId, {
            players: players,
            fixed_pairs: updatedPairs
        });

        if (window.NotificationService) {
            window.NotificationService.showToast("Pareja desvinculada", "info");
        }

        await this.renderList(eventId, eventType);
        if (eventType === 'entreno' && window.loadEntrenoParticipantsUI) {
            window.loadEntrenoParticipantsUI(eventId);
        } else if (eventType === 'americana' && window.loadAmericanaParticipantsUI) {
            window.loadAmericanaParticipantsUI(eventId);
        }
    },

    async autoPair(eventId, eventType) {
        if (!confirm("Auto-emparejar restantes usando lógica del sistema?")) return;

        const event = await EventService.getById(eventType, eventId);
        const pairs = event.fixed_pairs || [];

        // Find already paired IDs
        const pairedIds = new Set();
        pairs.forEach(p => {
            if (p.player1_id) { pairedIds.add(String(p.player1_id)); pairedIds.add(String(p.player2_id)); }
            else if (p.player1) { pairedIds.add(String(p.player1.id)); pairedIds.add(String(p.player2.id)); }
        });

        // Filter available players (Unique)
        const seenIds = new Set();
        let available = (event.players || []).filter(p => {
            const pid = String(p.id || p.uid || '');
            if (!pid || pairedIds.has(pid) || seenIds.has(pid)) return false;
            seenIds.add(pid);
            return true;
        });

        if (available.length < 2) return alert("No hay suficientes jugadores libres para emparejar.");

        if (typeof FixedPairsLogic === 'undefined') {
            return alert("Error: FixedPairsLogic no está cargado");
        }

        // Generate new pairs using SMART logic
        const newPairs = FixedPairsLogic.createSmartFixedPairs(available, event.category);

        if (pairs.length > 0) {
            const offset = pairs.length * 2;
            newPairs.forEach((p, idx) => {
                const globIndex = offset + (idx * 2);
                const newCourt = Math.floor(globIndex / 4) + 1;
                p.current_court = newCourt;
                p.initial_court = newCourt;
            });
        }

        // Also link in players array!
        newPairs.forEach(pair => {
            const pid1 = String(pair.player1_id);
            const pid2 = String(pair.player2_id);
            const p1 = (event.players || []).find(x => String(x.id || x.uid) === pid1);
            const p2 = (event.players || []).find(x => String(x.id || x.uid) === pid2);
            if (p1 && p2) {
                p1.partner_id = pid2;
                p1.partner_name = p2.name;
                p2.partner_id = pid1;
                p2.partner_name = p1.name;
            }
        });

        await EventService.updateEvent(eventType, eventId, {
            players: event.players,
            fixed_pairs: [...pairs, ...newPairs],
            pair_mode: 'fixed'
        });

        await this.renderList(eventId, eventType);
        if (eventType === 'entreno' && window.loadEntrenoParticipantsUI) {
            window.loadEntrenoParticipantsUI(eventId);
        } else if (eventType === 'americana' && window.loadAmericanaParticipantsUI) {
            window.loadAmericanaParticipantsUI(eventId);
        }
    },

    async regenerate(eventId, eventType) {
        if (!confirm("Generar nuevos cruces con estas parejas? (Borrará R1 y reiniciará partidos)")) return;
        try {
            // Purge existing matches for this event
            if (eventType === 'entreno') {
                // Custom purge for entrenos if needed, or if MatchMakingService handles it
                // MatchMakingService usually handles 'matches' or 'entrenos_matches' based on type?
                // Let's check MatchMakingService signature. 
                // Assuming it is robust enough or we use direct DB call if unsure.
                // Ideally: MatchMakingService.purgeMatches(eventId, collectionName)
                // But let's assume standard usage:
                const collection = eventType === 'entreno' ? 'entrenos_matches' : 'matches';

                // Get all matches
                const matches = await window.FirebaseDB[collection].getAll();
                const eventMatches = matches.filter(m => m.americana_id === eventId);

                // Delete all
                const batchSize = 10;
                for (let i = 0; i < eventMatches.length; i += batchSize) {
                    await Promise.all(eventMatches.slice(i, i + batchSize).map(m => window.FirebaseDB[collection].delete(m.id)));
                }

                // Generate R1
                const event = await EventService.getById(eventType, eventId);
                const pairs = event.fixed_pairs || [];
                const maxCourts = event.max_courts || 4;

                const pMatches = FixedPairsLogic.generatePozoRound(pairs, 1, maxCourts);

                for (const m of pMatches) {
                    await window.FirebaseDB[collection].create({
                        ...m,
                        americana_id: eventId,
                        status: 'scheduled',
                        score_a: 0,
                        score_b: 0
                    });
                }

            } else {
                // Americana
                // Reuse logic similar to above or service if valid
                const matches = await window.FirebaseDB.matches.getAll();
                const eventMatches = matches.filter(m => m.americana_id === eventId);
                for (let i = 0; i < eventMatches.length; i += 10) {
                    await Promise.all(eventMatches.slice(i, i + 10).map(m => window.FirebaseDB.matches.delete(m.id)));
                }

                const event = await EventService.getById(eventType, eventId);
                const pairs = event.fixed_pairs || [];
                const maxCourts = event.max_courts || 4;

                const pMatches = FixedPairsLogic.generatePozoRound(pairs, 1, maxCourts);
                for (const m of pMatches) {
                    await window.FirebaseDB.matches.create({
                        ...m,
                        americana_id: eventId,
                        status: 'scheduled',
                        score_a: 0,
                        score_b: 0
                    });
                }
            }

            alert("✅ Cruces regenerados (Ronda 1)");
        } catch (e) { alert(e.message); console.error(e); }
    }
};
