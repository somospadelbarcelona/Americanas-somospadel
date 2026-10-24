with open("js/modules/americanas/EventsController_V6.js", "r", encoding="utf-8") as f:
    code = f.read()

# 1. Definir window.openPlaytomicInfoModal globalmente cerca de la linea 55
playtomic_modal_fn = '''
    window.openPlaytomicInfoModal = (playerId) => {
        let modal = document.getElementById('playtomic-player-info-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'playtomic-player-info-modal';
            modal.style.cssText = 'position:fixed; inset:0; background:rgba(15,23,42,0.8); backdrop-filter:blur(8px); z-index:99999; display:flex; align-items:center; justify-content:center; padding:16px;';
            document.body.appendChild(modal);
        }

        const isP2 = String(playerId).endsWith('2') || String(playerId).includes('_2');
        const pos = isP2 ? '⚡ Revés' : '🛡️ Drive';
        const num = isP2 ? '2' : '1';

        modal.innerHTML = `
            <div style="background:#ffffff; border-radius:24px; max-width:420px; width:100%; overflow:hidden; box-shadow:0 25px 50px -12px rgba(0,0,0,0.35); border:1px solid #e2e8f0; font-family:'Outfit', sans-serif; animation:modalPopIn 0.25s cubic-bezier(0.16,1,0.3,1);">
                <!-- Header con degradado Playtomic Oficial -->
                <div style="background:linear-gradient(135deg, #00C6FF 0%, #0072FF 100%); padding:24px 20px; text-align:center; position:relative; color:#ffffff;">
                    <button onclick="document.getElementById('playtomic-player-info-modal').style.display='none'" 
                            style="position:absolute; top:14px; right:14px; background:rgba(0,0,0,0.2); border:none; color:#ffffff; width:30px; height:30px; border-radius:50%; font-size:1rem; cursor:pointer; display:flex; align-items:center; justify-content:center;">
                        ✕
                    </button>
                    <div style="width:68px; height:68px; border-radius:20px; background:#ffffff; margin:0 auto 12px; display:flex; align-items:center; justify-content:center; box-shadow:0 8px 16px rgba(0,0,0,0.15); border:3px solid rgba(255,255,255,0.8);">
                        <i class="fas fa-table-tennis" style="font-size:2rem; color:#0072FF;"></i>
                    </div>
                    <span style="background:rgba(255,255,255,0.25); color:#ffffff; font-size:0.65rem; font-weight:900; letter-spacing:1px; padding:3px 10px; border-radius:20px; text-transform:uppercase; border:1px solid rgba(255,255,255,0.4);">
                        🎾 PLAYTOMIC OFICIAL
                    </span>
                    <h2 style="margin:10px 0 2px; font-size:1.35rem; font-weight:950; color:#ffffff;">
                        Plaza Playtomic #${num}
                    </h2>
                    <p style="margin:0; font-size:0.8rem; opacity:0.95; font-weight:600;">
                        Inscripción verificada desde Playtomic App
                    </p>
                </div>

                <!-- Detalles de la reserva -->
                <div style="padding:20px 22px;">
                    <div style="display:flex; flex-direction:column; gap:12px;">
                        <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 14px; background:#f8fafc; border-radius:12px; border:1px solid #e2e8f0;">
                            <span style="font-size:0.8rem; color:#64748b; font-weight:700;"><i class="fas fa-map-marker-alt" style="color:#0072FF; margin-right:6px;"></i> Club</span>
                            <strong style="font-size:0.82rem; color:#0f172a;">NEW Play Padel Pro Hospitalet</strong>
                        </div>
                        <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 14px; background:#f8fafc; border-radius:12px; border:1px solid #e2e8f0;">
                            <span style="font-size:0.8rem; color:#64748b; font-weight:700;"><i class="fas fa-user-shield" style="color:#0072FF; margin-right:6px;"></i> Organizador</span>
                            <strong style="font-size:0.75rem; color:#0f172a;">somospadeleugestion@gmail.com</strong>
                        </div>
                        <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 14px; background:#f8fafc; border-radius:12px; border:1px solid #e2e8f0;">
                            <span style="font-size:0.8rem; color:#64748b; font-weight:700;"><i class="fas fa-euro-sign" style="color:#10b981; margin-right:6px;"></i> Tarifa Oficial</span>
                            <span style="background:#ecfdf5; color:#059669; font-weight:900; font-size:0.85rem; padding:3px 10px; border-radius:8px; border:1px solid #a7f3d0;">
                                12.48 € PAGADO
                            </span>
                        </div>
                        <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 14px; background:#f8fafc; border-radius:12px; border:1px solid #e2e8f0;">
                            <span style="font-size:0.8rem; color:#64748b; font-weight:700;"><i class="fas fa-sync" style="color:#0072FF; margin-right:6px;"></i> Modalidad</span>
                            <strong style="font-size:0.82rem; color:#0f172a;">Twister Individual (5 Pistas)</strong>
                        </div>
                        <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 14px; background:#f8fafc; border-radius:12px; border:1px solid #e2e8f0;">
                            <span style="font-size:0.8rem; color:#64748b; font-weight:700;"><i class="fas fa-crosshairs" style="color:#0072FF; margin-right:6px;"></i> Posición Asignada</span>
                            <span style="font-weight:800; font-size:0.8rem; color:#0f172a;">${pos} • Nivel 3.50</span>
                        </div>
                    </div>

                    <!-- Botón de acción -->
                    <div style="margin-top:20px; display:flex; flex-direction:column; gap:8px;">
                        <button onclick="document.getElementById('playtomic-player-info-modal').style.display='none'" 
                                style="width:100%; background:#0f172a; color:#ffffff; font-weight:900; font-size:0.85rem; padding:12px; border-radius:12px; border:none; cursor:pointer; transition:all 0.2s;">
                            ENTENDIDO • PLAZA CONFIRMADA
                        </button>
                    </div>
                </div>
            </div>
        `;
        modal.style.display = 'flex';
    };
'''

# 2. En cotillearJugador (linea 55 y 9736): detectar si es playtomic
code_norm = code.replace('\r\n', '\n')

old_cotillear_1 = '''    window.cotillearJugador = (playerId, e) => {
        if (e && typeof e.stopPropagation === 'function') {
            e.stopPropagation();
        }
        try {
            if (!playerId) return;'''

new_cotillear_1 = '''    window.cotillearJugador = (playerId, e) => {
        if (e && typeof e.stopPropagation === 'function') {
            e.stopPropagation();
        }
        try {
            if (!playerId) return;
            if (String(playerId).includes('playtomic') || String(playerId).startsWith('pt_')) {
                if (typeof window.openPlaytomicInfoModal === 'function') {
                    window.openPlaytomicInfoModal(playerId);
                    return;
                }
            }'''

if old_cotillear_1 in code_norm:
    code_norm = code_norm.replace(old_cotillear_1, playtomic_modal_fn + '\n' + new_cotillear_1)
    print("Replaced cotillearJugador 1 successfully.")
else:
    print("WARNING: old_cotillear_1 not found.")

# 3. En cotillearJugador 2 (linea 9736)
old_cotillear_2 = '''            let player = targetId;
            if (typeof targetId === 'string') {
                player = (window._currentInscritosPlayersMap && window._currentInscritosPlayersMap[targetId]) || 
                         (window.EventsController?.state?.users?.find?.(u => (u.id === targetId || u.uid === targetId))) ||
                         { id: targetId, uid: targetId, name: 'Jugador' };
            }'''

new_cotillear_2 = '''            let player = targetId;
            if (typeof targetId === 'string') {
                if (String(targetId).includes('playtomic') || String(targetId).startsWith('pt_')) {
                    if (typeof window.openPlaytomicInfoModal === 'function') {
                        window.openPlaytomicInfoModal(targetId);
                        return;
                    }
                }
                player = (window._currentInscritosPlayersMap && window._currentInscritosPlayersMap[targetId]) || 
                         (window.EventsController?.state?.users?.find?.(u => (u.id === targetId || u.uid === targetId))) ||
                         { id: targetId, uid: targetId, name: 'Jugador' };
            }
            if (player && (player.is_playtomic || player.source === 'playtomic' || String(player.name).toLowerCase().includes('playtomic'))) {
                if (typeof window.openPlaytomicInfoModal === 'function') {
                    window.openPlaytomicInfoModal(player.id || targetId);
                    return;
                }
            }'''

if old_cotillear_2 in code_norm:
    code_norm = code_norm.replace(old_cotillear_2, new_cotillear_2)
    print("Replaced cotillearJugador 2 successfully.")
else:
    print("WARNING: old_cotillear_2 not found.")

# 4. En renderNeonPlayer (linea 7440): renderizar tarjetas Playtomic con formato VIP
old_render_neon = '''            const renderNeonPlayer = (player, badgeText, badgeColor = '#0284c7') => {
                if (!player) return '';
                const pid = player.id || player.uid;
                const photo = player.photo_url || player.photoURL || 'img/logo_somospadel.png';
                const level = parseFloat(player.level || 3.5).toFixed(2);
                const teams = Array.isArray(player.team_somospadel) ? player.team_somospadel : (player.team_somospadel ? [player.team_somospadel] : []);
                const position = player.position || (level > 3.6 ? 'Revés' : 'Drive');
                const isRev = position.toLowerCase().includes('rev');
                const posIcon = isRev ? '⚡ Revés' : '🛡️ Drive';
                const streak = player.streak || (parseFloat(level) > 3.5 ? 3 : 1);
                const rawName = (player.name || 'Jugador').trim();
                const displayName = rawName.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                const safeNameAttr = rawName.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
                const isMe = currentUid && (pid === currentUid);'''

new_render_neon = '''            const renderNeonPlayer = (player, badgeText, badgeColor = '#0284c7') => {
                if (!player) return '';
                const pid = player.id || player.uid;
                const isPlaytomic = player.is_playtomic || player.source === 'playtomic' || (player.name && player.name.toLowerCase().includes('playtomic')) || (pid && String(pid).includes('playtomic'));
                const photo = isPlaytomic ? 'img/logo_somospadel.png' : (player.photo_url || player.photoURL || 'img/logo_somospadel.png');
                const level = parseFloat(player.level || 3.5).toFixed(2);
                const teams = Array.isArray(player.team_somospadel) ? player.team_somospadel : (player.team_somospadel ? [player.team_somospadel] : []);
                const position = player.position || (level > 3.6 ? 'Revés' : 'Drive');
                const isRev = position.toLowerCase().includes('rev');
                const posIcon = isRev ? '⚡ Revés' : '🛡️ Drive';
                const streak = player.streak || (parseFloat(level) > 3.5 ? 3 : 1);
                
                let rawName = (player.display_name || player.name || 'Jugador').trim();
                if (/^jugador\\s+playtomic\\s+\\d+$/i.test(rawName)) {
                    const numM = rawName.match(/\\d+/);
                    rawName = `Plaza Playtomic #${numM ? numM[0] : '1'}`;
                }
                const displayName = rawName.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                const safeNameAttr = rawName.replace(/\\\\/g, '\\\\\\\\').replace(/'/g, "\\\\'").replace(/"/g, '&quot;');
                const isMe = currentUid && (pid === currentUid);
                const actualBadgeColor = isPlaytomic ? '#0072FF' : badgeColor;
                const actualBadgeText = isPlaytomic ? '🎾 PLAYTOMIC' : badgeText;'''

if old_render_neon in code_norm:
    code_norm = code_norm.replace(old_render_neon, new_render_neon)
    print("Replaced renderNeonPlayer header successfully.")
else:
    print("WARNING: old_render_neon not found.")

# Y en los botones de renderNeonPlayer:
old_buttons = '''                                ${!isMe ? `
                                <button onclick="event.stopPropagation(); window.openDirectChatWithPlayer('${pid}')" 
                                        style="background: #0284c7; border: 1px solid #0284c7; color: #ffffff; font-size: 0.55rem; font-weight: 950; padding: 2px 6px; border-radius: 5px; cursor: pointer; display: flex; align-items: center; gap: 3px; transition: all 0.2s; box-shadow: 0 1px 3px rgba(2,132,199,0.2);"
                                        onmouseover="this.style.background='#0369a1';"
                                        onmouseout="this.style.background='#0284c7';"
                                        title="Abrir chat privado con ${displayName}">
                                    <i class="fas fa-comment-dots" style="font-size: 0.54rem;"></i> CHAT
                                </button>
                                ` : ''}'''

new_buttons = '''                                ${!isMe ? (isPlaytomic ? `
                                <button onclick="event.stopPropagation(); window.openPlaytomicInfoModal('${pid}')" 
                                        style="background: linear-gradient(135deg, #00C6FF, #0072FF); border: 1px solid #00C6FF; color: #ffffff; font-size: 0.55rem; font-weight: 950; padding: 2px 7px; border-radius: 5px; cursor: pointer; display: flex; align-items: center; gap: 3px; transition: all 0.2s; box-shadow: 0 1px 4px rgba(0,198,255,0.3);"
                                        title="Plaza Oficial Playtomic • 12.48 € Pagada">
                                    <i class="fas fa-check-circle" style="font-size: 0.54rem;"></i> PLAYTOMIC
                                </button>
                                ` : `
                                <button onclick="event.stopPropagation(); window.openDirectChatWithPlayer('${pid}')" 
                                        style="background: #0284c7; border: 1px solid #0284c7; color: #ffffff; font-size: 0.55rem; font-weight: 950; padding: 2px 6px; border-radius: 5px; cursor: pointer; display: flex; align-items: center; gap: 3px; transition: all 0.2s; box-shadow: 0 1px 3px rgba(2,132,199,0.2);"
                                        onmouseover="this.style.background='#0369a1';"
                                        onmouseout="this.style.background='#0284c7';"
                                        title="Abrir chat privado con ${displayName}">
                                    <i class="fas fa-comment-dots" style="font-size: 0.54rem;"></i> CHAT
                                </button>
                                `) : ''}'''

if old_buttons in code_norm:
    code_norm = code_norm.replace(old_buttons, new_buttons)
    print("Replaced renderNeonPlayer buttons successfully.")
else:
    print("WARNING: old_buttons not found.")

with open("js/modules/americanas/EventsController_V6.js", "w", encoding="utf-8") as f:
    f.write(code_norm)

print("EventsController_V6.js updated.")
