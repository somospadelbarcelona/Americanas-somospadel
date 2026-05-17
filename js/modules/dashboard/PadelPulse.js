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

            const [eventsSnap, entrenoMatchesSnap, officialMatchesSnap] = await Promise.all([
                window.db.collection('entrenos').limit(20).get().catch(() => null),
                window.db.collection('entrenos_matches').get().catch(() => null),
                window.db.collection('matches').get().catch(() => null)
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

            if ((entrenoMatchesSnap && !entrenoMatchesSnap.empty) || (officialMatchesSnap && !officialMatchesSnap.empty)) {
                const allMatches = [
                    ...(entrenoMatchesSnap?.docs || []).map(d => ({ ...d.data(), id: d.id })),
                    ...(officialMatchesSnap?.docs || []).map(d => ({ ...d.data(), id: d.id }))
                ].filter(m => m.status === 'finished' || m.estado === 'finalizado' || m.status === 'completado');

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
                const parseMatchDate = (m) => {
                    // 1. Try Firestore Timestamp
                    if (m.createdAt && m.createdAt.toDate) return m.createdAt.toDate().getTime();
                    if (m.timestamp && m.timestamp.toDate) return m.timestamp.toDate().getTime();
                    
                    // 2. Try manual date/time strings
                    if (m.date) {
                        try {
                            // Support DD/MM/YYYY, D/M/YYYY, DD-MM-YYYY, etc.
                            const cleanDate = m.date.replace(/-/g, '/');
                            const parts = cleanDate.split('/');
                            if (parts.length === 3) {
                                let d = parseInt(parts[0]);
                                let mo = parseInt(parts[1]);
                                let y = parseInt(parts[2]);
                                if (y < 100) y += 2000; // Handle 26 -> 2026
                                
                                const [h, mi] = (m.time || '00:00').split(':');
                                return new Date(y, mo - 1, d, parseInt(h) || 0, parseInt(mi) || 0).getTime();
                            }
                        } catch(e) { console.warn("Date parse error", e); }
                    }
                    
                    // 3. Fallback to a very old date if unknown
                    return 0;
                };

                const myMatches = allMatches.filter(m => {
                    const a = (m.team_a_ids || []).map(String), b = (m.team_b_ids || []).map(String);
                    return a.includes(uid) || b.includes(uid);
                }).sort((a, b) => {
                    const timeA = parseMatchDate(a);
                    const timeB = parseMatchDate(b);
                    if (timeA !== timeB) return timeB - timeA;
                    
                    // Desempate por número de partido (prioridad absoluta a lo que el usuario ve)
                    const numA = parseInt(a.numero_partido || a.matchNumber || a.match_index || a.round || 0);
                    const numB = parseInt(b.numero_partido || b.matchNumber || b.match_index || b.round || 0);
                    return numB - numA;
                });

                let calculatedStreak = 0;
                let currentStreakBroken = false;
                
                console.log(`🎾 Auditoría de Racha para ${uid}:`);

                for (let i = 0; i < myMatches.length; i++) {
                    const m = myMatches[i];
                    const teamA = (m.team_a_ids || []).map(id => String(id));
                    const teamB = (m.team_b_ids || []).map(id => String(id));
                    const isA = teamA.includes(String(uid));
                    const isB = teamB.includes(String(uid));
                    
                    if (!isA && !isB) continue;

                    const sA = parseInt(m.score_a) || 0;
                    const sB = parseInt(m.score_b) || 0;
                    
                    let won = false;
                    if (isA) won = sA > sB;
                    if (isB) won = sB > sA;
                    
                    const result = won ? 'W' : 'L';
                    if (i < 5) recentForm.push(result);
                    
                    if (!currentStreakBroken) {
                        if (calculatedStreak === 0 && result === 'W') {
                            calculatedStreak = 1;
                        } else if (result === 'W') {
                            calculatedStreak++;
                        } else if (result === 'L') {
                            currentStreakBroken = true;
                        }
                    }
                }
                
                // USAR EL VALOR OFICIAL DEL USUARIO (El que sale en el header y es correcto)
                const stProfile = (window.Store?.getState('playerStats') || {}).stats || {};
                if (stProfile.streak !== undefined) {
                    streak = stProfile.streak;
                } else {
                    streak = calculatedStreak;
                }
                
                console.log(`📊 Auditoría: Calculado=${calculatedStreak} | Oficial=${stProfile.streak} -> Usando ${streak}`);
                
                // Forzar tipo racha
                streakType = (streak > 0) ? 'W' : 'L';

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
    margin: 8px 14px 15px;
    border-radius: 28px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    overflow: hidden;
    position: relative;
    animation: pp6-in 0.55s cubic-bezier(0.22,1,0.36,1) both;
    box-shadow: 0 10px 40px rgba(0,0,0,0.04);
}

/* Aurora blobs */
.pp6-blob {
    position: absolute; border-radius: 50%;
    pointer-events: none; filter: blur(60px); opacity: 0.12;
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
                    width: 55px; height: 55px; border-radius: 18px;
                    background: #f8fafc;
                    border: 2px solid #e2e8f0;
                    display: flex; align-items: center; justify-content: center;
                    color: #0a192f; font-size: 1.25rem; font-weight: 950; letter-spacing: -1px;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.03);
                ">${initials}</div>
                <!-- Live dot -->
                <div style="
                    position:absolute; bottom:-2px; right:-2px;
                    width:14px; height:14px; border-radius:50%;
                    background: #25D366;
                    border: 3px solid #ffffff;
                    box-shadow: 0 0 10px rgba(37, 211, 102, 0.4);
                    animation: pp6-pulse 2.5s ease-in-out infinite;
                "></div>
            </div>

            <div style="margin-left: 5px;">
                <div style="color: #64748b; font-size:0.6rem; font-weight:950; letter-spacing:1px; text-transform:uppercase; margin-bottom:3px;">${greeting}</div>
                <div style="color: #0a192f; font-size:1.7rem; font-weight:950; letter-spacing:-1px; line-height:1;">${firstName}</div>
                <div style="display:flex; gap:6px; margin-top:6px; flex-wrap:wrap; align-items:center;">
                    <span style="
                        background: rgba(${accentRgb},0.1);
                        border: 1px solid rgba(${accentRgb},0.25);
                        color: ${accent}; padding: 2px 8px; border-radius: 7px;
                        font-size: 0.6rem; font-weight: 800; letter-spacing:0.5px;">
                        LVL ${level}
                    </span>
                    ${streak >= 1 ? `
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
                background: #f8fafc;
                border: 1.5px solid #e2e8f0;
                border-radius: 20px; padding: 12px 16px; text-align: center; min-width: 60px;
                transition: transform 0.2s;
                position: relative; overflow: hidden;
                box-shadow: 0 4px 12px rgba(0,0,0,0.02);
            "
            onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                <div style="font-size:1.3rem; line-height:1;">${rankEmoji}</div>
                <div style="color: #0a192f; font-size:1.2rem; font-weight:950; line-height:1.2; margin-top:2px;">${rankLabel}</div>
                <div style="color: #64748b; font-size:0.42rem; font-weight:950; text-transform:uppercase; letter-spacing:1px; margin-top:3px;">RANKING</div>
            </div>
        </div>
    </div>

    <!-- ═══════════════ FORM DOTS ═══════════════ -->
    ${recentForm.length > 0 ? `
    <div style="padding: 0 16px 15px; display:flex; align-items:center; gap:10px; position:relative; z-index:2;">
        <span style="color: #64748b; font-size:0.5rem; font-weight:950; text-transform:uppercase; letter-spacing:1px; white-space:nowrap; min-width:40px;">Forma</span>
        <div style="display:flex; gap:6px; flex:1;">
            ${recentForm.map((r, i) => `
            <div style="
                width: 30px; height: 30px; border-radius: 50%;
                background: ${r === 'W' ? '#22c55e' : '#ef4444'};
                display: flex; align-items: center; justify-content: center;
                font-size: 0.6rem; font-weight: 950; color: white;
                box-shadow: 0 4px 10px rgba(${r==='W'?'34,197,94':'239,68,68'},0.2);
                animation: pp6-dot 0.4s ${i * 0.08}s cubic-bezier(0.22,1,0.36,1) both;
                border: 2px solid #ffffff;">
                ${r}
            </div>`).join('')}
        </div>
        <span style="color: #94a3b8; font-size:0.5rem; font-weight:900; white-space:nowrap;">${totalMatches} PARTIDOS</span>
    </div>` : '<div style="height:10px; position:relative; z-index:2;"></div>'}

    <!-- ═══════════════ DIVIDER ═══════════════ -->
    <div style="height:1px; background: #f1f5f9; margin: 0 16px 15px; position:relative; z-index:2;"></div>

    <!-- ═══════════════ NEXT EVENT ═══════════════ -->
    ${nextEvent ? `
    <div style="padding: 0 16px 16px; position:relative; z-index:2;">
        <div class="pp6-event-card" onclick="window.Router?.navigate('${nextEvent.route}')" style="
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 20px; padding: 15px;
            display: flex; align-items: center; justify-content: space-between;
            cursor: pointer;">
            <div style="display:flex; align-items:center; gap:12px;">
                <div style="
                    width: 46px; height: 46px; border-radius: 14px; flex-shrink:0;
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    display:flex; align-items:center; justify-content:center; font-size:1.3rem;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.02);">
                    ${nextEvent.route === 'entrenos' ? '🏓' : '🏆'}
                </div>
                <div>
                    <div style="color: #64748b; font-size:0.45rem; font-weight:950; text-transform:uppercase; letter-spacing:1.5px; margin-bottom:4px;">Próximo evento</div>
                    <div style="color: #0a192f; font-size:1rem; font-weight:950; line-height:1.2; letter-spacing:-0.4px;">${nextEvent.name.substring(0,24)}</div>
                    <div style="display:flex; gap:10px; margin-top:6px; align-items:center; flex-wrap:wrap;">
                        ${nextEvent.date ? `<span style="color: #94a3b8; font-size:0.5rem; font-weight:800;">📅 ${nextEvent.date}</span>` : ''}
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
                    background: #f1f5f9; border: 1px solid #e2e8f0;
                    color: #72a800; padding:8px 12px; border-radius:12px;
                    font-size:0.55rem; font-weight:950; text-align:center; line-height:1.4;">
                    ✅<br>INSCRITO
                  </div>`
                : `<div onclick="event.stopPropagation();window.Router?.navigate('${nextEvent.route}')" style="
                    background: #72a800; color: #fff; padding:12px 18px; border-radius:15px;
                    font-size:0.65rem; font-weight:950; cursor:pointer; white-space:nowrap;
                    box-shadow: 0 8px 20px rgba(114, 168, 0, 0.2);
                    transition: transform 0.15s, box-shadow 0.15s;"
                    onmouseover="this.style.transform='scale(1.06)'"
                    onmouseout="this.style.transform='scale(1)'">
                    ENTRAR →
                  </div>`}
        </div>
    </div>` : `
    <div style="padding:0 16px 14px; position:relative; z-index:2;">
        <div onclick="window.Router?.navigate('entrenos')" style="
            background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 18px;
            padding: 18px; text-align: center; cursor: pointer; transition: all 0.2s;"
            onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='#f8fafc'">
            <div style="font-size: 2rem; margin-bottom: 8px;">🏓</div>
            <div style="color: #0a192f; font-size: 0.8rem; font-weight: 800;">Sin eventos próximos</div>
            <div style="color: #72a800; font-size: 0.65rem; font-weight: 950; margin-top: 6px; text-decoration:underline;">Ver entrenos disponibles →</div>
        </div>
    </div>`}

    <!-- ═══════════════ STATS GRID ═══════════════ -->
    <div style="padding: 0 16px 20px; display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:10px; position:relative; z-index:2;">

        <!-- VICTORIAS -->
        <div class="pp6-tile" onclick="window.Router?.navigate('profile')"
             style="background: #f8fafc; border: 1px solid #e2e8f0; animation: pp6-tile-in 0.4s 0.1s both;">
            <div id="pp6-wins" style="color: #22c55e; font-size:1.6rem; font-weight:950; line-height:1;">0</div>
            <div style="color: #64748b; font-size:0.4rem; font-weight:950; margin-top:5px; text-transform:uppercase; letter-spacing:0.5px;">Victoria</div>
        </div>

        <!-- DERROTAS -->
        <div class="pp6-tile" onclick="window.Router?.navigate('profile')"
             style="background: #f8fafc; border: 1px solid #e2e8f0; animation: pp6-tile-in 0.4s 0.18s both;">
            <div id="pp6-losses" style="color: #ef4444; font-size:1.6rem; font-weight:950; line-height:1;">0</div>
            <div style="color: #64748b; font-size:0.4rem; font-weight:950; margin-top:5px; text-transform:uppercase; letter-spacing:0.5px;">Derrota</div>
        </div>

        <!-- WIN RATE -->
        <div class="pp6-tile" onclick="window.Router?.navigate('profile')"
             style="background: #f1f5f9; border: 1px solid #e2e8f0; animation: pp6-tile-in 0.4s 0.26s both; border-color: #72a800;">
            <div id="pp6-wr" style="color: #72a800; font-size:1.35rem; font-weight:950; line-height:1;">0%</div>
            <div style="color: #64748b; font-size:0.4rem; font-weight:950; margin-top:5px; text-transform:uppercase; letter-spacing:0.5px;">W. Rate</div>
        </div>

        <!-- TARJETA -->
        <div class="pp6-tile" onclick="window.PlayerView?.shareProfileCard?.()"
             style="background: #ffffff; border: 1px solid #e2e8f0; animation: pp6-tile-in 0.4s 0.34s both; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
            <div style="font-size:1.4rem; line-height:1;">🎴</div>
            <div style="color: #64748b; font-size:0.4rem; font-weight:950; margin-top:5px; text-transform:uppercase; letter-spacing:0.5px;">Tarjeta</div>
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
                background: #f8fafc;
                border: 1px solid #e2e8f0; border-radius: 24px;
                margin: 8px 14px 12px; padding: 28px 16px; min-height: 160px;
                display: flex; align-items: center; justify-content: center;
                box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
                <div style="display:flex;flex-direction:column;align-items:center;gap:10px;">
                    <i class="fas fa-circle-notch fa-spin" style="color:#72a800; font-size:1.4rem;"></i>
                    <span style="color:#94a3b8; font-size:0.55rem; font-weight:800; text-transform:uppercase; letter-spacing:3px;">Cargando...</span>
                </div>
            </div>`;
        }
    };

    window.PadelPulse = PadelPulse;
    console.log('🏓 PadelPulse v6 IMPACT Loaded');
})();
