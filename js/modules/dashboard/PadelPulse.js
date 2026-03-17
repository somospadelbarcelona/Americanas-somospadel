/**
 * 🏓 PadelPulse.js v6 — IMPACT Edition
 * Director: Mendez AI | Equipo: Frontend + Marketer
 * SomosPadel BCN — 2026
 * "La primera pantalla que deja sin palabras"
 */
(function () {

    const PadelPulse = {

        async render(rootId) {
            const root = document.getElementById(rootId);
            if (!root) return;
            const user = window.Store?.getState('currentUser');
            if (!user) return;
            root.innerHTML = this._skeleton();
            try {
                const data = await this._buildData(user);
                root.innerHTML = this._template(data, user);
                this._initAnimations(data);
            } catch (err) {
                console.error('[PadelPulse] Error:', err);
                root.innerHTML = '';
            }
        },

        async _buildData(user) {
            const uid = String(user.uid || user.id);
            const hour = new Date().getHours();
            const greeting = hour < 13 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches';

            const [eventsSnap, matchesSnap] = await Promise.all([
                window.db.collection('entrenos').limit(20).get().catch(() => null),
                window.db.collection('entrenos_matches').get().catch(() => null)
            ]);

            let nextEvent = null;
            if (eventsSnap && !eventsSnap.empty) {
                const upcoming = eventsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
                    .filter(e => { const s = e.status || e.estado; return s !== 'finished' && s !== 'finalizado' && s !== 'completado'; })
                    .sort((a, b) => String(a.fecha || '').localeCompare(String(b.fecha || '')));
                if (upcoming.length > 0) {
                    const ev = upcoming[0];
                    const playerCount = (ev.players || []).length;
                    const maxPlayers = (ev.max_courts || ev.pistas || 3) * 4;
                    const spotsLeft = Math.max(0, maxPlayers - playerCount);
                    const isRegistered = (ev.players || []).some(p => String(p.id || p.uid) === uid);
                    const rawName = ev.nombre || ev.title || ev.name || '';
                    const isEntreno = rawName.toLowerCase().includes('entreno') || rawName.includes('[ENT]') || ev.type === 'entreno';
                    let dateLabel = '';
                    if (ev.fecha) {
                        const parts = String(ev.fecha).split('/');
                        const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
                        if (parts.length === 3) dateLabel = `${parts[0]} ${months[parseInt(parts[1])-1]||''}`;
                        else dateLabel = ev.fecha;
                    }
                    nextEvent = { id: ev.id,
                        name: rawName.replace('[ENT]','').replace('[AMS]','').trim() || 'Próximo Evento',
                        date: dateLabel, time: ev.hora || ev.time || '', spotsLeft, isRegistered, playerCount,
                        route: isEntreno ? 'entrenos' : 'americanas' };
                }
            }

            let wins = 0, losses = 0, myRank = null, rivalName = null;
            let streak = 0, streakType = null;
            const recentForm = [];

            if (matchesSnap && !matchesSnap.empty) {
                const allMatches = matchesSnap.docs.map(d => d.data()).filter(m => m.status === 'finished');
                const allPlayers = {};
                allMatches.forEach(m => {
                    const aIds = (m.team_a_ids||[]).map(String), bIds = (m.team_b_ids||[]).map(String);
                    const aWon = (parseInt(m.score_a)||0) > (parseInt(m.score_b)||0);
                    [...aIds,...bIds].forEach(pid => { if (!allPlayers[pid]) allPlayers[pid] = {wins:0,losses:0,name:''}; });
                    aIds.forEach(pid => { if(aWon) allPlayers[pid].wins++; else allPlayers[pid].losses++; });
                    bIds.forEach(pid => { if(!aWon) allPlayers[pid].wins++; else allPlayers[pid].losses++; });
                    if (m.team_a_names) aIds.forEach((pid,i) => { if(!allPlayers[pid].name) allPlayers[pid].name=(m.team_a_names[i]||'').split(' ')[0]; });
                    if (m.team_b_names) bIds.forEach((pid,i) => { if(!allPlayers[pid].name) allPlayers[pid].name=(m.team_b_names[i]||'').split(' ')[0]; });
                });
                const ranked = Object.entries(allPlayers).map(([pid,d])=>({pid,...d})).sort((a,b)=>b.wins-a.wins||a.losses-b.losses);
                const myIdx = ranked.findIndex(r => r.pid === uid);
                if (myIdx >= 0) {
                    myRank = myIdx + 1; wins = ranked[myIdx].wins; losses = ranked[myIdx].losses;
                    if (myIdx > 0) rivalName = ranked[myIdx-1].name || `#${myIdx}`;
                }
                const myMatches = allMatches.filter(m => {
                    const a=(m.team_a_ids||[]).map(String),b=(m.team_b_ids||[]).map(String);
                    return a.includes(uid)||b.includes(uid);
                }).sort((a,b)=>parseInt(b.round||0)-parseInt(a.round||0));
                myMatches.forEach((m,i) => {
                    const isA=(m.team_a_ids||[]).map(String).includes(uid);
                    const won=(parseInt(isA?m.score_a:m.score_b)||0)>(parseInt(isA?m.score_b:m.score_a)||0);
                    if(i<5) recentForm.push(won?'W':'L');
                    if(streakType===null){streakType=won?'W':'L';streak=1;}
                    else if((won?'W':'L')===streakType) streak++;
                });
                if(wins===0&&losses===0) myMatches.forEach(m=>{const isA=(m.team_a_ids||[]).map(String).includes(uid);if((parseInt(isA?m.score_a:m.score_b)||0)>(parseInt(isA?m.score_b:m.score_a)||0))wins++;else losses++;});
            }
            const st=(window.Store?.getState('playerStats')||{}).stats||{};
            if(wins===0) wins=st.won||0; if(losses===0) losses=st.lost||0;
            const winRate=wins+losses>0?Math.round(wins/(wins+losses)*100):0;
            const totalMatches = wins + losses;

            return { greeting, nextEvent, wins, losses, winRate, myRank, rivalName, streak, streakType, recentForm, totalMatches };
        },

        _template(data, user) {
            const { greeting, nextEvent, wins, losses, winRate, myRank, rivalName, streak, streakType, recentForm, totalMatches } = data;
            const firstName = (user.name || 'Jugador').split(' ')[0];
            const level = parseFloat(user.level || 3.5).toFixed(2);
            const initials = (user.name || '?').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

            // Color accent based on win rate
            const accent = winRate >= 70 ? '#CCFF00' : winRate >= 50 ? '#00e5ff' : winRate >= 30 ? '#ff9900' : '#ff4466';
            const accentRgb = winRate >= 70 ? '204,255,0' : winRate >= 50 ? '0,229,255' : winRate >= 30 ? '255,153,0' : '255,68,102';

            // Rank medal
            const rankLabel = myRank === 1 ? '#1' : myRank === 2 ? '#2' : myRank === 3 ? '#3' : myRank ? `#${myRank}` : '—';
            const rankEmoji = myRank === 1 ? '🏆' : myRank === 2 ? '🥈' : myRank === 3 ? '🥉' : '🎯';

            return `
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800;900&display=swap');

@keyframes pp6-in     { from{opacity:0;transform:translateY(20px) scale(0.96)} to{opacity:1;transform:translateY(0) scale(1)} }
@keyframes pp6-blob1  { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(20px,-15px) scale(1.1)} }
@keyframes pp6-blob2  { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-15px,20px) scale(0.9)} }
@keyframes pp6-glow   { 0%,100%{box-shadow:0 0 20px rgba(${accentRgb},0.3)} 50%{box-shadow:0 0 40px rgba(${accentRgb},0.6)} }
@keyframes pp6-pulse  { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
@keyframes pp6-dot    { from{opacity:0;transform:scale(0)} to{opacity:1;transform:scale(1)} }
@keyframes pp6-streak { 0%{background-position:0% 50%} 100%{background-position:200% 50%} }
@keyframes pp6-shine  { 0%{left:-100%} 100%{left:150%} }
@keyframes pp6-count  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
@keyframes pp6-tile-in{ from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }

.pp6-card {
    font-family: 'Inter', sans-serif;
    margin: 8px 14px 12px;
    border-radius: 24px;
    background: linear-gradient(145deg, #0d1f0d 0%, #101820 50%, #0d1a10 100%);
    border: 1px solid rgba(${accentRgb},0.2);
    overflow: hidden;
    position: relative;
    animation: pp6-in 0.55s cubic-bezier(0.22,1,0.36,1) both;
    box-shadow: 0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(${accentRgb},0.1), inset 0 1px 0 rgba(255,255,255,0.05);
}

/* Aurora blobs */
.pp6-blob {
    position: absolute; border-radius: 50%;
    pointer-events: none; filter: blur(50px); opacity: 0.15;
}

/* Top shimmer line */
.pp6-card::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, transparent 0%, ${accent} 40%, #00e5ff 60%, transparent 100%);
    opacity: 0.8;
}

/* Hover cards */
.pp6-tile {
    border-radius: 16px;
    padding: 14px 8px 11px;
    text-align: center;
    cursor: pointer;
    transition: transform 0.18s cubic-bezier(0.22,1,0.36,1), background 0.2s;
    position: relative; overflow: hidden;
}
.pp6-tile::after {
    content: '';
    position: absolute; top: 50%; left: 50%;
    width: 0; height: 0;
    background: rgba(255,255,255,0.08);
    border-radius: 50%;
    transform: translate(-50%,-50%);
    transition: width 0.4s, height 0.4s;
}
.pp6-tile:active::after { width: 200px; height: 200px; }
.pp6-tile:active { transform: scale(0.93); }
.pp6-tile:hover  { transform: translateY(-2px); }

.pp6-event-card {
    transition: transform 0.2s, background 0.2s;
}
.pp6-event-card:hover { transform: translateY(-2px); }
.pp6-event-card:active { transform: scale(0.98); }
</style>

<div class="pp6-card" id="pp6-main">

    <!-- Aurora blobs -->
    <div class="pp6-blob" style="width:180px;height:180px;background:${accent};top:-60px;right:-40px;animation:pp6-blob1 8s ease-in-out infinite;"></div>
    <div class="pp6-blob" style="width:140px;height:140px;background:#00e5ff;bottom:-30px;left:-30px;animation:pp6-blob2 10s ease-in-out infinite;"></div>

    <!-- ═══════════════ HEADER ═══════════════ -->
    <div style="padding: 18px 16px 14px; display:flex; justify-content:space-between; align-items:flex-start; position:relative; z-index:2;">

        <!-- Avatar + name -->
        <div style="display:flex; align-items:center; gap:13px;">
            <!-- Avatar with animated ring -->
            <div style="position:relative; flex-shrink:0;">
                <div style="
                    width: 50px; height: 50px; border-radius: 16px;
                    background: linear-gradient(135deg, rgba(${accentRgb},0.15), rgba(${accentRgb},0.05));
                    border: 2px solid rgba(${accentRgb},0.5);
                    display: flex; align-items: center; justify-content: center;
                    color: ${accent}; font-size: 1.1rem; font-weight: 900; letter-spacing: -1px;
                    animation: pp6-glow 3s ease-in-out infinite;
                    box-shadow: inset 0 0 20px rgba(${accentRgb},0.1);
                ">${initials}</div>
                <!-- Live dot -->
                <div style="
                    position:absolute; bottom:-2px; right:-2px;
                    width:12px; height:12px; border-radius:50%;
                    background: #00e36d;
                    border: 2px solid #0d1f0d;
                    box-shadow: 0 0 8px #00e36d;
                    animation: pp6-pulse 2s ease-in-out infinite;
                "></div>
            </div>

            <div>
                <div style="color:rgba(255,255,255,0.35); font-size:0.55rem; font-weight:700; letter-spacing:1px; text-transform:uppercase; margin-bottom:3px;">${greeting}</div>
                <div style="color:white; font-size:1.5rem; font-weight:900; letter-spacing:-1px; line-height:1; text-shadow: 0 0 30px rgba(${accentRgb},0.3);">${firstName}</div>
                <div style="display:flex; gap:6px; margin-top:6px; flex-wrap:wrap; align-items:center;">
                    <span style="
                        background: rgba(${accentRgb},0.1);
                        border: 1px solid rgba(${accentRgb},0.25);
                        color: ${accent}; padding: 2px 8px; border-radius: 7px;
                        font-size: 0.6rem; font-weight: 800; letter-spacing:0.5px;">
                        LVL ${level}
                    </span>
                    ${streak >= 3 ? `
                    <span style="
                        background: linear-gradient(90deg, rgba(255,120,0,0.2), rgba(255,200,0,0.2));
                        border: 1px solid rgba(255,150,0,0.4);
                        color: #ffbb33; padding: 2px 8px; border-radius: 7px;
                        font-size: 0.6rem; font-weight: 900;
                        background-size: 200% auto;
                        animation: pp6-streak 2s linear infinite;">
                        🔥 ${streak} en racha
                    </span>` : ''}
                </div>
            </div>
        </div>

        <!-- Rank badge -->
        <div onclick="window.Router?.navigate('ranking')"
             style="cursor:pointer; flex-shrink:0;">
            <div style="
                background: linear-gradient(135deg, rgba(${accentRgb},0.12) 0%, rgba(${accentRgb},0.04) 100%);
                border: 1.5px solid rgba(${accentRgb},0.35);
                border-radius: 16px; padding: 10px 14px; text-align: center; min-width: 56px;
                backdrop-filter: blur(10px);
                transition: transform 0.2s;
                position: relative; overflow: hidden;
            "
            onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                <!-- Shine sweep -->
                <div style="position:absolute;top:0;width:40%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent);animation:pp6-shine 3s ease-in-out infinite;pointer-events:none;"></div>
                <div style="font-size:1.3rem; line-height:1;">${rankEmoji}</div>
                <div style="color:${accent}; font-size:1.1rem; font-weight:900; line-height:1.2; margin-top:2px;">${rankLabel}</div>
                <div style="color:rgba(255,255,255,0.25); font-size:0.42rem; font-weight:800; text-transform:uppercase; letter-spacing:1px; margin-top:3px;">RANKING</div>
                ${rivalName ? `<div style="color:rgba(255,255,255,0.2);font-size:0.38rem;margin-top:2px; white-space:nowrap;">vs ${rivalName}</div>` : ''}
            </div>
        </div>
    </div>

    <!-- ═══════════════ FORM DOTS ═══════════════ -->
    ${recentForm.length > 0 ? `
    <div style="padding: 0 16px 12px; display:flex; align-items:center; gap:8px; position:relative; z-index:2;">
        <span style="color:rgba(255,255,255,0.25); font-size:0.45rem; font-weight:800; text-transform:uppercase; letter-spacing:1.5px; white-space:nowrap; min-width:36px;">Forma</span>
        <div style="display:flex; gap:5px; flex:1;">
            ${recentForm.map((r, i) => `
            <div style="
                width: 28px; height: 28px; border-radius: 50%;
                background: ${r === 'W'
                    ? 'linear-gradient(135deg, #00e36d, #00c95a)'
                    : 'linear-gradient(135deg, #ff4466, #cc2244)'};
                display: flex; align-items: center; justify-content: center;
                font-size: 0.5rem; font-weight: 900; color: white;
                box-shadow: 0 4px 12px rgba(${r==='W'?'0,227,109':'255,68,102'},0.4);
                animation: pp6-dot 0.4s ${i * 0.08}s cubic-bezier(0.22,1,0.36,1) both;
                border: 1.5px solid rgba(255,255,255,0.15);">
                ${r}
            </div>`).join('')}
        </div>
        <span style="color:rgba(255,255,255,0.15); font-size:0.42rem; font-weight:700; white-space:nowrap;">${totalMatches} partidos</span>
    </div>` : '<div style="height:8px; position:relative; z-index:2;"></div>'}

    <!-- ═══════════════ DIVIDER ═══════════════ -->
    <div style="height:1px; background:linear-gradient(90deg,transparent,rgba(${accentRgb},0.2),transparent); margin: 0 16px 12px; position:relative;z-index:2;"></div>

    <!-- ═══════════════ NEXT EVENT ═══════════════ -->
    ${nextEvent ? `
    <div style="padding: 0 16px 14px; position:relative; z-index:2;">
        <div class="pp6-event-card" onclick="window.Router?.navigate('${nextEvent.route}')" style="
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.09);
            border-radius: 18px; padding: 13px 14px;
            display: flex; align-items: center; justify-content: space-between;
            cursor: pointer;
            backdrop-filter: blur(10px);">
            <div style="display:flex; align-items:center; gap:12px;">
                <div style="
                    width: 42px; height: 42px; border-radius: 13px; flex-shrink:0;
                    background: linear-gradient(135deg, rgba(${accentRgb},0.15), rgba(${accentRgb},0.05));
                    border: 1px solid rgba(${accentRgb},0.25);
                    display:flex; align-items:center; justify-content:center; font-size:1.2rem;">
                    ${nextEvent.route === 'entrenos' ? '🏓' : '🏆'}
                </div>
                <div>
                    <div style="color:rgba(255,255,255,0.3); font-size:0.42rem; font-weight:800; text-transform:uppercase; letter-spacing:2px; margin-bottom:3px;">Próximo evento</div>
                    <div style="color:white; font-size:0.9rem; font-weight:900; line-height:1.2; letter-spacing:-0.3px;">${nextEvent.name.substring(0,24)}</div>
                    <div style="display:flex; gap:8px; margin-top:5px; align-items:center; flex-wrap:wrap;">
                        ${nextEvent.date ? `<span style="color:rgba(255,255,255,0.35);font-size:0.42rem;font-weight:700;">📅 ${nextEvent.date}</span>` : ''}
                        <span style="
                            font-size: 0.42rem; font-weight: 900; padding: 2px 7px; border-radius: 6px;
                            ${nextEvent.spotsLeft > 2
                                ? 'background:rgba(0,227,109,0.12);color:#00e36d;border:1px solid rgba(0,227,109,0.3);'
                                : nextEvent.spotsLeft > 0
                                ? 'background:rgba(255,180,0,0.12);color:#ffb400;border:1px solid rgba(255,180,0,0.3);'
                                : 'background:rgba(255,68,102,0.12);color:#ff4466;border:1px solid rgba(255,68,102,0.3);'}
                        ">
                            ${nextEvent.spotsLeft > 0 ? `${nextEvent.spotsLeft} plazas` : 'Completo'}
                        </span>
                    </div>
                </div>
            </div>
            ${nextEvent.isRegistered
                ? `<div style="
                    background:rgba(0,227,109,0.1);border:1px solid rgba(0,227,109,0.3);
                    color:#00e36d;padding:7px 10px;border-radius:11px;
                    font-size:0.45rem;font-weight:900;text-align:center;line-height:1.5;">
                    ✅<br>Inscrito
                  </div>`
                : `<div onclick="event.stopPropagation();window.Router?.navigate('${nextEvent.route}')" style="
                    background: ${accent}; color:#000; padding:10px 14px; border-radius:13px;
                    font-size:0.6rem; font-weight:900; cursor:pointer; white-space:nowrap;
                    box-shadow: 0 6px 20px rgba(${accentRgb},0.4);
                    transition: transform 0.15s, box-shadow 0.15s;"
                    onmouseover="this.style.transform='scale(1.06)';this.style.boxShadow='0 8px 28px rgba(${accentRgb},0.6)'"
                    onmouseout="this.style.transform='scale(1)';this.style.boxShadow='0 6px 20px rgba(${accentRgb},0.4)'">
                    IR →
                  </div>`}
        </div>
    </div>` : `
    <div style="padding:0 16px 14px; position:relative; z-index:2;">
        <div onclick="window.Router?.navigate('entrenos')" style="
            background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.07);border-radius:18px;
            padding:14px;text-align:center;cursor:pointer;">
            <div style="color:rgba(255,255,255,0.2);font-size:0.6rem;font-weight:700;">Sin eventos próximos</div>
            <div style="color:${accent};font-size:0.5rem;font-weight:900;margin-top:5px;">Ver entrenos →</div>
        </div>
    </div>`}

    <!-- ═══════════════ STATS GRID ═══════════════ -->
    <div style="padding: 0 16px 18px; display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:7px; position:relative; z-index:2;">

        <!-- VICTORIAS -->
        <div class="pp6-tile" onclick="window.Router?.navigate('profile')"
             style="background:linear-gradient(145deg,rgba(0,200,100,0.1),rgba(0,200,100,0.04));border:1px solid rgba(0,200,100,0.2);animation:pp6-tile-in 0.4s 0.1s both;">
            <div id="pp6-wins" style="color:#00e36d;font-size:1.5rem;font-weight:900;line-height:1;text-shadow:0 0 15px rgba(0,227,109,0.5);">0</div>
            <div style="color:rgba(255,255,255,0.3);font-size:0.38rem;font-weight:800;margin-top:4px;text-transform:uppercase;letter-spacing:0.5px;">Victorias</div>
        </div>

        <!-- DERROTAS -->
        <div class="pp6-tile" onclick="window.Router?.navigate('profile')"
             style="background:linear-gradient(145deg,rgba(255,60,80,0.1),rgba(255,60,80,0.04));border:1px solid rgba(255,60,80,0.2);animation:pp6-tile-in 0.4s 0.18s both;">
            <div id="pp6-losses" style="color:#ff4466;font-size:1.5rem;font-weight:900;line-height:1;text-shadow:0 0 15px rgba(255,68,102,0.5);">0</div>
            <div style="color:rgba(255,255,255,0.3);font-size:0.38rem;font-weight:800;margin-top:4px;text-transform:uppercase;letter-spacing:0.5px;">Derrotas</div>
        </div>

        <!-- WIN RATE -->
        <div class="pp6-tile" onclick="window.Router?.navigate('profile')"
             style="background:linear-gradient(145deg,rgba(${accentRgb},0.1),rgba(${accentRgb},0.03));border:1px solid rgba(${accentRgb},0.2);animation:pp6-tile-in 0.4s 0.26s both;">
            <div id="pp6-wr" style="color:${accent};font-size:1.25rem;font-weight:900;line-height:1;text-shadow:0 0 15px rgba(${accentRgb},0.5);">0%</div>
            <div style="color:rgba(255,255,255,0.3);font-size:0.38rem;font-weight:800;margin-top:4px;text-transform:uppercase;letter-spacing:0.5px;">Win Rate</div>
        </div>

        <!-- TARJETA -->
        <div class="pp6-tile" onclick="window.PlayerView?.shareProfileCard?.()"
             style="background:linear-gradient(145deg,rgba(100,80,255,0.1),rgba(100,80,255,0.04));border:1px solid rgba(100,80,255,0.2);animation:pp6-tile-in 0.4s 0.34s both;">
            <div style="font-size:1.2rem;line-height:1;">🎴</div>
            <div style="color:rgba(255,255,255,0.3);font-size:0.38rem;font-weight:800;margin-top:4px;text-transform:uppercase;letter-spacing:0.5px;">Tarjeta</div>
        </div>
    </div>

</div>`;
        },

        _initAnimations(data) {
            const animCount = (id, target, suffix = '', delay = 0) => {
                setTimeout(() => {
                    const el = document.getElementById(id);
                    if (!el) return;
                    if (target === 0) { el.textContent = '0' + suffix; return; }
                    let cur = 0;
                    const step = target / 40;
                    const t = setInterval(() => {
                        cur = Math.min(cur + step, target);
                        el.textContent = Math.floor(cur) + suffix;
                        if (cur >= target) clearInterval(t);
                    }, 16);
                }, delay);
            };
            animCount('pp6-wins',   data.wins,    '',  280);
            animCount('pp6-losses', data.losses,  '',  380);
            animCount('pp6-wr',     data.winRate, '%', 480);
        },

        _skeleton() {
            return `
            <div style="
                background:linear-gradient(145deg,#0d1f0d,#101820,#0d1a10);
                border:1px solid rgba(204,255,0,0.1);border-radius:24px;
                margin:8px 14px 12px;padding:28px 16px;min-height:220px;
                display:flex;align-items:center;justify-content:center;
                box-shadow:0 20px 60px rgba(0,0,0,0.7);">
                <div style="display:flex;flex-direction:column;align-items:center;gap:10px;">
                    <i class="fas fa-circle-notch fa-spin" style="color:rgba(204,255,0,0.5);font-size:1.4rem;"></i>
                    <span style="color:rgba(255,255,255,0.15);font-size:0.5rem;font-weight:800;text-transform:uppercase;letter-spacing:3px;">Cargando...</span>
                </div>
            </div>`;
        }
    };

    window.PadelPulse = PadelPulse;
    console.log('🏓 PadelPulse v6 IMPACT Loaded');
})();
