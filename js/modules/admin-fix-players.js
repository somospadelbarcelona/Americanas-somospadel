/**
 * admin-fix-players.js
 * Utility to diagnose and fix player ID issues
 */

window.AdminViews = window.AdminViews || {};

window.AdminViews.fix_players = async function () {
    const content = document.getElementById('content-area');
    content.innerHTML = `
        <div class="glass-card-enterprise" style="padding: 2rem; max-width: 800px; margin: 0 auto;">
            <h2 style="color: var(--primary); margin-bottom: 2rem;">🔧 Reparar IDs y Unificar Jugadores</h2>
            
            <div style="background: rgba(255,255,255,0.05); padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem;">
                <h3 style="color:white; margin-top:0;">1. Reparar IDs Faltantes</h3>
                <p style="color: #ddd; margin-bottom: 1rem;">Esta herramienta diagnostica y repara jugadores que no tienen IDs válidos en eventos.</p>
                <button onclick="window.diagnosePlayerIDs()" class="btn-primary-pro" style="margin-right: 1rem;">
                    🔍 DIAGNOSTICAR
                </button>
                <button onclick="window.fixPlayerIDs()" class="btn-secondary" style="background: #CCFF00; color: black;">
                    🔧 REPARAR TODO
                </button>
            </div>

            <div style="background: rgba(255,255,255,0.05); padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem;">
                <h3 style="color:white; margin-top:0;">2. Unificar Duplicados</h3>
                <p style="color: #ddd; margin-bottom: 1rem;">Escanea la base de datos en busca de jugadores con nombres similares (ej: con/sin tildes) y los une en uno solo.</p>
                <button onclick="window.findPotentialDuplicates()" class="btn-primary-pro">
                    👥 BUSCAR DUPLICADOS
                </button>
            </div>
            
            <div id="diagnosis-results" style="margin-top: 2rem;"></div>
        </div>
    `;
};

window.diagnosePlayerIDs = async function () {
    const resultsDiv = document.getElementById('diagnosis-results');
    resultsDiv.innerHTML = '<div class="loader"></div>';

    try {
        const issues = [];

        // Check Entrenos
        const entrenos = await EventService.getAll('entreno');
        for (const event of entrenos) {
            if (!event.players) continue;

            event.players.forEach((player, index) => {
                const playerId = player.id || player.uid || player.player_id;
                if (!playerId) {
                    issues.push({
                        type: 'entreno',
                        eventId: event.id,
                        eventName: event.name,
                        playerIndex: index,
                        playerName: player.name || 'Sin nombre',
                        player: player
                    });
                }
            });
        }

        // Check Americanas
        const americanas = await EventService.getAll('americana');
        for (const event of americanas) {
            if (!event.players) continue;

            event.players.forEach((player, index) => {
                const playerId = player.id || player.uid || player.player_id;
                if (!playerId) {
                    issues.push({
                        type: 'americana',
                        eventId: event.id,
                        eventName: event.name,
                        playerIndex: index,
                        playerName: player.name || 'Sin nombre',
                        player: player
                    });
                }
            });
        }

        if (issues.length === 0) {
            resultsDiv.innerHTML = `
                <div style="background: rgba(0,255,0,0.1); border: 1px solid #00ff00; padding: 1.5rem; border-radius: 12px; text-align: center;">
                    <h3 style="color: #00ff00; margin: 0;">✅ No se encontraron problemas</h3>
                    <p style="color: #ddd; margin-top: 0.5rem;">Todos los jugadores tienen IDs válidos.</p>
                </div>
            `;
        } else {
            const issuesHTML = issues.map(issue => `
                <div style="background: rgba(255,0,0,0.1); border: 1px solid #ff4444; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                    <div style="color: #ff4444; font-weight: 900; margin-bottom: 0.5rem;">
                        ⚠️ ${issue.type.toUpperCase()}: ${issue.eventName}
                    </div>
                    <div style="color: #ddd; font-size: 0.9rem;">
                        Jugador: <strong>${issue.playerName}</strong> (posición ${issue.playerIndex})<br>
                        Datos: ${JSON.stringify(issue.player)}
                    </div>
                </div>
            `).join('');

            resultsDiv.innerHTML = `
                <div style="background: rgba(255,255,0,0.1); border: 1px solid #ffff00; padding: 1.5rem; border-radius: 12px; margin-bottom: 1rem;">
                    <h3 style="color: #ffff00; margin: 0 0 0.5rem 0;">⚠️ Se encontraron ${issues.length} problemas</h3>
                </div>
                ${issuesHTML}
                <button onclick="window.fixPlayerIDs()" class="btn-primary-pro" style="width: 100%; margin-top: 1rem;">
                    🔧 REPARAR TODOS LOS PROBLEMAS
                </button>
            `;
        }

    } catch (error) {
        resultsDiv.innerHTML = `
            <div style="background: rgba(255,0,0,0.2); border: 1px solid #ff0000; padding: 1.5rem; border-radius: 12px;">
                <h3 style="color: #ff0000;">❌ Error</h3>
                <p style="color: #ddd;">${error.message}</p>
            </div>
        `;
    }
};

window.fixPlayerIDs = async function () {
    if (!confirm('¿Estás seguro de que quieres reparar todos los jugadores con IDs faltantes?\n\nEsto intentará buscar el jugador en la base de datos por nombre.')) {
        return;
    }

    const resultsDiv = document.getElementById('diagnosis-results');
    resultsDiv.innerHTML = '<div class="loader"></div><p style="text-align:center; color:#ddd;">Reparando...</p>';

    try {
        let fixed = 0;
        let failed = 0;

        // Get all players from DB
        const allPlayers = await FirebaseDB.players.getAll();

        // Fix Entrenos
        const entrenos = await EventService.getAll('entreno');
        for (const event of entrenos) {
            if (!event.players) continue;

            let needsUpdate = false;
            const updatedPlayers = event.players.map(player => {
                const playerId = player.id || player.uid || player.player_id;
                if (!playerId && player.name) {
                    // Try to find player by name
                    const foundPlayer = allPlayers.find(p =>
                        p.name.toLowerCase().trim() === player.name.toLowerCase().trim()
                    );

                    if (foundPlayer) {
                        needsUpdate = true;
                        fixed++;
                        return {
                            ...player,
                            id: foundPlayer.id,
                            uid: foundPlayer.id
                        };
                    } else {
                        failed++;
                        console.warn('Could not find player in DB:', player.name);
                    }
                }
                return player;
            });

            if (needsUpdate) {
                await EventService.updateEvent('entreno', event.id, { players: updatedPlayers });
            }
        }

        // Fix Americanas
        const americanas = await EventService.getAll('americana');
        for (const event of americanas) {
            if (!event.players) continue;

            let needsUpdate = false;
            const updatedPlayers = event.players.map(player => {
                const playerId = player.id || player.uid || player.player_id;
                if (!playerId && player.name) {
                    const foundPlayer = allPlayers.find(p =>
                        p.name.toLowerCase().trim() === player.name.toLowerCase().trim()
                    );

                    if (foundPlayer) {
                        needsUpdate = true;
                        fixed++;
                        return {
                            ...player,
                            id: foundPlayer.id,
                            uid: foundPlayer.id
                        };
                    } else {
                        failed++;
                        console.warn('Could not find player in DB:', player.name);
                    }
                }
                return player;
            });

            if (needsUpdate) {
                await EventService.updateEvent('americana', event.id, { players: updatedPlayers });
            }
        }

        resultsDiv.innerHTML = `
            <div style="background: rgba(0,255,0,0.1); border: 1px solid #00ff00; padding: 1.5rem; border-radius: 12px; text-align: center;">
                <h3 style="color: #00ff00; margin: 0;">✅ Reparación Completada</h3>
                <p style="color: #ddd; margin-top: 1rem;">
                    Jugadores reparados: <strong>${fixed}</strong><br>
                    ${failed > 0 ? `No se pudieron reparar: <strong>${failed}</strong> (no encontrados en BD)` : ''}
                </p>
                <button onclick="window.diagnosePlayerIDs()" class="btn-outline-pro" style="margin-top: 1rem;">
                    🔍 VERIFICAR DE NUEVO
                </button>
            </div>
        `;

    } catch (error) {
        resultsDiv.innerHTML = `
            <div style="background: rgba(255,0,0,0.2); border: 1px solid #ff0000; padding: 1.5rem; border-radius: 12px;">
                <h3 style="color: #ff0000;">❌ Error</h3>
                <p style="color: #ddd;">${error.message}</p>
            </div>
        `;
    }
};

window.findPotentialDuplicates = async function () {
    const resultsDiv = document.getElementById('diagnosis-results');
    resultsDiv.innerHTML = '<div class="loader"></div><p style="text-align:center; color:#ddd;">Buscando duplicados...</p>';

    try {
        const allPlayers = await FirebaseDB.players.getAll(true); // Force reload
        const normalizedMap = {}; // Group by normalized name
        const phoneMap = {}; // Group by phone
        const duplicates = [];

        const normalize = (name) => {
            if (!name) return "";
            return name.toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-z0-9]/g, "") // Mas agresivo: solo letras y números
                .trim();
        };

        allPlayers.forEach(p => {
            // 1. Map by Normalized Name
            const norm = normalize(p.name || p.displayName);
            if (norm && norm.length > 2) {
                if (!normalizedMap[norm]) normalizedMap[norm] = [];
                normalizedMap[norm].push(p);
            }

            // 2. Map by Phone
            const phone = (p.phone || "").replace(/\s/g, "").replace(/\+34/g, "");
            if (phone && phone.length > 7) {
                if (!phoneMap[phone]) phoneMap[phone] = [];
                phoneMap[phone].push(p);
            }
        });

        // Collect Name Duplicates
        for (const norm in normalizedMap) {
            if (normalizedMap[norm].length > 1) {
                duplicates.push({
                    type: 'NAME',
                    key: norm,
                    players: normalizedMap[norm]
                });
            }
        }

        // Collect Phone Duplicates (avoiding those already caught by name)
        for (const phone in phoneMap) {
            if (phoneMap[phone].length > 1) {
                // Check if this pair is already in duplicates
                const ids = phoneMap[phone].map(p => p.id).sort().join(',');
                const exists = duplicates.some(d => d.players.map(p => p.id).sort().join(',') === ids);
                
                if (!exists) {
                    duplicates.push({
                        type: 'PHONE',
                        key: phone,
                        players: phoneMap[phone]
                    });
                }
            }
        }

        if (duplicates.length === 0) {
            resultsDiv.innerHTML = `
                <div style="background: rgba(0,255,0,0.1); border: 1px solid #00ff00; padding: 1.5rem; border-radius: 12px; text-align: center;">
                    <h3 style="color: #00ff00; margin: 0;">✅ ¡Limpieza Perfecta!</h3>
                    <p style="color: #ddd; margin-top: 0.5rem;">No se han detectado jugadores con nombres duplicados o similares.</p>
                </div>
            `;
            return;
        }

        let html = `<h3 style="color:white; margin-bottom: 1.5rem;">🚨 Se han encontrado ${duplicates.length} grupos de duplicados:</h3>`;
        
        duplicates.forEach(group => {
            const groupTitle = group.type === 'PHONE' ? `Mismo Teléfono: ${group.key}` : `Nombre Silimar: ${group.players[0].name.toUpperCase()}`;
            html += `
                <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem;">
                    <h4 style="color:var(--primary); margin:0 0 1rem 0;">${groupTitle}</h4>
                    <div style="display:flex; flex-direction:column; gap:8px;">
                        ${group.players.map((p, i) => `
                            <div style="display:flex; justify-content:space-between; align-items:center; background: rgba(0,0,0,0.3); padding: 0.8rem 1.2rem; border-radius: 8px;">
                                <div>
                                    <strong style="color:white;">${p.name || p.displayName}</strong><br>
                                    <span style="font-size:0.75rem; color:#888;">ID: ${p.id} | Tel: ${p.phone || 'S/N'} | Partidos: ${p.matches_played || 0}</span>
                                </div>
                                <div style="display:flex; gap: 8px;">
                                    <button class="btn-micro" onclick="window.confirmMerge('${group.players[0].id}', '${p.id}', '${(group.players[0].name || group.players[0].displayName).replace(/'/g, "\\'")}', '${(p.name || p.displayName).replace(/'/g, "\\'")}')" style="background: var(--primary); color:black; font-weight:900; ${i === 0 ? 'display:none' : ''}">
                                        UNIR AL PRIMERO
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });

        resultsDiv.innerHTML = html;

    } catch (error) {
        resultsDiv.innerHTML = `<div class="error-box">${error.message}</div>`;
    }
};

window.confirmMerge = async function (masterId, secondaryId, masterName, secondaryName) {
    if (masterId === secondaryId) return;

    const confirmed = await window.PremiumModal.confirm({
        title: "🛡️ UNIFICAR JUGADORES",
        message: `¿Seguro que quieres unificar a <strong>${secondaryName}</strong> dentro de <strong>${masterName}</strong>?<br><br>
        1. Se transferirán sus partidos e historial.<br>
        2. Se sumará su contador de partidos.<br>
        3. Se borrará el perfil de ${secondaryName}.<br><br>
        <strong>¡ESTA ACCIÓN NO SE PUEDE DESHACER!</strong>`,
        confirmText: "SÍ, UNIFICAR AHORA",
        confirmColor: "#CCFF00"
    });

    if (confirmed) {
        window.performMerge(masterId, secondaryId);
    }
};

window.performMerge = async function (masterId, secondaryId) {
    const resultsDiv = document.getElementById('diagnosis-results');
    const originalContent = resultsDiv.innerHTML;
    resultsDiv.innerHTML = '<div class="loader"></div><p style="text-align:center; color:#ddd;">Unificando datos (esto puede tardar)...</p>';

    try {
        const master = await FirebaseDB.players.getById(masterId);
        const secondary = await FirebaseDB.players.getById(secondaryId);

        if (!master || !secondary) throw new Error("No se han encontrado los jugadores en la base de datos.");

        // 1. Calcular nuevas estadísticas
        const newMatchesCount = (parseInt(master.matches_played) || 0) + (parseInt(secondary.matches_played) || 0);
        const newLevel = Math.max(parseFloat(master.level || master.self_rate_level || 3.5), parseFloat(secondary.level || secondary.self_rate_level || 3.5));

        console.log(`📡 [Merge] Unificando ${secondaryId} -> ${masterId}`);

        // 2. Transferir partidos (Deep Scan & Replace)
        const allMatches = await FirebaseDB.matches.getByPlayer(secondaryId);
        
        // Find entrenos_matches also
        const allEntrenosMatches = await FirebaseDB.entrenos_matches.getByPlayer(secondaryId);

        console.log(`📊 [Merge] Encontrados ${allMatches.length} partidos y ${allEntrenosMatches.length} entrenos para transferir.`);

        // Batch updates for efficiency to avoid 429 errors
        const batch = window.db.batch();
        let batchCount = 0;

        // Update Matches
        allMatches.forEach(m => {
            const upd = {};
            let changed = false;

            if (m.team_a_ids && m.team_a_ids.includes(secondaryId)) {
                upd.team_a_ids = m.team_a_ids.map(id => id === secondaryId ? masterId : id);
                changed = true;
            }
            if (m.team_b_ids && m.team_b_ids.includes(secondaryId)) {
                upd.team_b_ids = m.team_b_ids.map(id => id === secondaryId ? masterId : id);
                changed = true;
            }
            if (m.players && m.players.some(p => (p.uid === secondaryId || p.id === secondaryId || p === secondaryId))) {
               upd.players = m.players.map(p => {
                    const pid = p.uid || p.id || p;
                    if (pid === secondaryId) {
                        if (typeof p === 'string') return masterId;
                        return { ...p, uid: masterId, id: masterId, name: master.name };
                    }
                    return p;
                });
                changed = true;
            }
            if (m.player1 === secondaryId) { upd.player1 = masterId; changed = true; }
            if (m.player2 === secondaryId) { upd.player2 = masterId; changed = true; }
            
            if (changed) {
                const docRef = window.db.collection('matches').doc(m.id);
                batch.update(docRef, upd);
                batchCount++;
            }
        });

        // Update Entrenos Matches
        allEntrenosMatches.forEach(m => {
            const upd = {};
            let changed = false;
            if (m.team_a_ids && m.team_a_ids.includes(secondaryId)) {
                upd.team_a_ids = m.team_a_ids.map(id => id === secondaryId ? masterId : id);
                changed = true;
            }
            if (m.team_b_ids && m.team_b_ids.includes(secondaryId)) {
                upd.team_b_ids = m.team_b_ids.map(id => id === secondaryId ? masterId : id);
                changed = true;
            }
            if (changed) {
                const docRef = window.db.collection('entrenos_matches').doc(m.id);
                batch.update(docRef, upd);
                batchCount++;
            }
        });

        // 3. Update Americanas and Entrenos (Participation lists)
        const americanas = await FirebaseDB.americanas.getAll();
        americanas.forEach(a => {
            if (a.players && a.players.some(p => (p.uid === secondaryId || p.id === secondaryId || p === secondaryId))) {
                const newPlayers = a.players.map(p => {
                    const pid = p.uid || p.id || p;
                    if (pid === secondaryId) {
                        if (typeof p === 'string') return masterId;
                        return { ...p, uid: masterId, id: masterId, name: master.name };
                    }
                    return p;
                });
                const docRef = window.db.collection('americanas').doc(a.id);
                batch.update(docRef, { players: newPlayers });
                batchCount++;
            }
        });

        if (batchCount > 0) {
            await batch.commit();
        }

        // 4. Update Master Profile
        await FirebaseDB.players.update(masterId, {
            matches_played: newMatchesCount,
            level: newLevel,
            self_rate_level: newLevel
        });

        // 5. Delete Secondary Profile
        await FirebaseDB.players.delete(secondaryId);

        window.PremiumModal.alert({
            title: "🏆 ¡ÉXITO!",
            message: `Jugadores unificados correctamente.<br><br><strong>${master.name}</strong> ahora tiene el historial completo y <strong>${newMatchesCount}</strong> partidos registrados.`,
            type: 'success'
        });

        // Refresh view
        window.findPotentialDuplicates();

    } catch (err) {
        console.error(err);
        window.PremiumModal.alert({
            title: "❌ ERROR",
            message: "No se pudo completar la unificación: " + err.message,
            type: 'error'
        });
        resultsDiv.innerHTML = originalContent;
    }
};
