/**
 * TeamConvocatoriaProUI.js
 * Módulo TOP de Convocatorias Interactivas (Solo SÍ / NO) para EQUIPOS — SomosPádel BCN
 *
 * Funcionalidades:
 * 1. Tarjeta de votación en 1 toque (✅ SÍ, VOY / ❌ NO PUEDO) incrustada en cada equipo del jugador.
 * 2. Actualización en tiempo real vía Firestore (`TeamConvocatoriaService.listenConvocatoria`).
 * 3. Desplegable "Ver quién va" con listas claras de Confirmados, No pueden y Pendientes.
 * 4. Panel de Control exclusivo para Capitanes / Subcapitanes / Admin:
 *    - Lanzar nueva convocatoria (Jornada, Rival, Fecha, Hora, Sede, Necesarios, Nota) con notificación in-app.
 *    - Marcar/editar voto manualmente de cualquier jugador (ej. avisos por WhatsApp).
 *    - Recordar a pendientes (notificación in-app).
 *    - Compartir resumen oficial en WhatsApp.
 *    - Cerrar / Reabrir convocatoria.
 *
 * Expuesto globalmente en `window.TeamConvocatoriaProUI`.
 */
(function (global) {
    'use strict';

    function norm(str) {
        return String(str || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function esc(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    class TeamConvocatoriaProUI {
        constructor() {
            this.unsubscribes = {};
            this.liveDataByTeam = {};
            this.teamsById = {};
            this.expandedTeams = {};
            this.activeCaptainModalTeamId = null;
            this.showCreateFormInModal = false;
            this.captainFilter = 'all'; // 'all' | 'available' | 'unavailable' | 'pending'
            this.captainSearch = '';
            this.PILOT_PHONE = '649219350';
            this._weeklyCheckDone = false;
            this._scheduleAutoWeeklyPopup();
        }

        _normPhone(val) {
            let d = String(val || '').replace(/\D+/g, '');
            if (d.length > 9 && d.startsWith('34')) d = d.slice(2);
            return d;
        }

        isPilotUser() {
            const u = this._getAuthUser();
            if (!u) return false;
            const ph = this._normPhone(u.phone || u.telefono || u.whatsapp || u.id || '');
            if (ph === this.PILOT_PHONE) return true;
            const n = norm(u.name || u.displayName || '');
            return n.includes('coscolin');
        }

        _scheduleAutoWeeklyPopup() {
            if (typeof window === 'undefined') return;
            const tryRun = () => {
                if (this._weeklyCheckDone) return;
                if (!this._getAuthUser() || !window.TeamSeasonService || !window.TeamConvocatoriaService) return;
                this._weeklyCheckDone = true;
                this.checkAndShowWeeklyConvoPopup({ force: false });
            };
            // Reintentar suavemente durante los primeros segundos tras carga/login
            setTimeout(tryRun, 2200);
            setTimeout(tryRun, 5000);
            window.addEventListener('somospadel:user_logged_in', () => {
                this._weeklyCheckDone = false;
                setTimeout(tryRun, 1500);
            });
        }

        _showToast(message, tone = 'success') {
            let toast = document.getElementById('tp-cp-toast');
            if (!toast) {
                toast = document.createElement('div');
                toast.id = 'tp-cp-toast';
                toast.className = 'tp-cp-toast';
                document.body.appendChild(toast);
            }
            toast.className = `tp-cp-toast show ${tone}`;
            toast.innerHTML = `<span>${esc(message)}</span>`;
            clearTimeout(this._toastTimer);
            this._toastTimer = setTimeout(() => {
                toast.classList.remove('show');
            }, 3200);
        }

        _getAuthUser() {
            try {
                if (window.Store && typeof window.Store.getState === 'function') {
                    const u = window.Store.getState('currentUser');
                    if (u) return u;
                }
                if (window.currentUser) return window.currentUser;
                const raw = localStorage.getItem('currentUser');
                if (raw) return JSON.parse(raw);
            } catch (e) {}
            return null;
        }

        _getUserName() {
            const u = this._getAuthUser();
            return String(u?.name || u?.displayName || '').trim();
        }

        isStaff() {
            const u = this._getAuthUser();
            const role = norm(u?.role || '');
            return ['admin', 'admin_player', 'super_admin', 'superadmin', 'organizador', 'organizer', 'organizador_bcn', 'organizer_bcn'].includes(role);
        }

        _getTeamCodeKey(team) {
            const raw = norm((team?.id || '') + ' ' + (team?.name || ''));
            const m = raw.match(/\b([234](?:ma|mb|fa|fb|xa|xb|m|f|x))\b/);
            return m ? m[1] : '';
        }

        _namesMatch(userNorm, targetNorm) {
            if (!userNorm || !targetNorm || userNorm.length < 3 || targetNorm.length < 3) return false;
            if (userNorm === targetNorm || userNorm.includes(targetNorm) || targetNorm.includes(userNorm)) return true;

            // Variantes frecuentes de nombres propios
            const canonical = (s) => s
                .replace(/\balejandro\b/g, 'alex')
                .replace(/\bmiquel\b/g, 'miguel')
                .replace(/\bcristina\b/g, 'cris')
                .replace(/\bantonio\b/g, 'toni')
                .replace(/\bguasch\b/g, 'guash');

            const u = canonical(userNorm);
            const t = canonical(targetNorm);
            if (u === t || u.includes(t) || t.includes(u)) return true;

            const uParts = u.split(/\s+/).filter(Boolean);
            const tParts = t.split(/\s+/).filter(Boolean);
            return tParts.length >= 2 && uParts.length >= 2 && uParts[0] === tParts[0] && uParts.includes(tParts[1]);
        }

        /**
         * Acceso ESTRICTO a Control Capitán: SOLO Capitán o Subcapitán asignado a ESE equipo.
         */
        isCaptainOf(team) {
            if (!team) return false;
            const userNorm = norm(this._getUserName());
            if (userNorm.length < 3) return false;

            // 1. Comprobar campos directos del equipo (captain / subcaptain)
            if (this._namesMatch(userNorm, norm(team.captain || ''))) return true;
            if (this._namesMatch(userNorm, norm(team.subcaptain || ''))) return true;

            // 2. Comprobar directorio oficial de Capitanes/Subcapitanes 2027
            const dir = window.TeamSeasonService && window.TeamSeasonService.officialCaptains2027;
            if (dir) {
                const code = this._getTeamCodeKey(team);
                const entry = code ? dir[code] : null;
                if (entry) {
                    if (this._namesMatch(userNorm, norm(entry.captain))) return true;
                    if (this._namesMatch(userNorm, norm(entry.subcaptain))) return true;
                    if (Array.isArray(entry.aliases) && entry.aliases.some(a => this._namesMatch(userNorm, norm(a)))) return true;
                }
            }

            return false;
        }

        _getTargetJornada(team) {
            if (!team) return '1';
            const sched = Array.isArray(team.schedule) ? team.schedule : [];
            const pending = sched.find(s => s.status !== 'completed' && !s.result);
            if (pending && pending.j) return String(pending.j);
            if (sched.length > 0) return String(sched[sched.length - 1].j || 1);
            return '1';
        }

        _getNextMatch(team) {
            const sched = Array.isArray(team?.schedule) ? team.schedule : [];
            return sched.find(s => s.status !== 'completed' && !s.result) || sched[sched.length - 1] || null;
        }

        cleanup() {
            Object.values(this.unsubscribes).forEach(fn => {
                try { if (typeof fn === 'function') fn(); } catch (e) {}
            });
            this.unsubscribes = {};
        }

        /**
         * Monta las tarjetas interactivas en tiempo real para todos los equipos detectados del jugador.
         */
        mountForTeams(heroTeams) {
            this.cleanup();
            if (!Array.isArray(heroTeams) || heroTeams.length === 0) return;
            const svc = window.TeamConvocatoriaService;
            if (!svc) return;

            heroTeams.forEach(entry => {
                const team = entry.team || entry;
                if (!team || !team.id) return;
                this.teamsById[team.id] = team;
                const j = this._getTargetJornada(team);

                // Render inicial inmediato mientras llega snapshot
                this.renderSlot(team.id);

                this.unsubscribes[team.id] = svc.listenConvocatoria(team.id, j, (convoData) => {
                    this.liveDataByTeam[team.id] = convoData || null;
                    this.renderSlot(team.id);
                    if (this.activeCaptainModalTeamId === team.id) {
                        this.renderCaptainModal(team.id);
                    }
                });
            });
        }

        _computeLists(team, convo) {
            const rosterNames = (team?.roster || []).map(p => typeof p === 'string' ? p : (p.name || '')).filter(Boolean);
            const responses = (convo && convo.responses && typeof convo.responses === 'object') ? convo.responses : {};

            const available = [];
            const unavailable = [];
            const respondedNorms = new Set();

            Object.entries(responses).forEach(([key, val]) => {
                const name = (typeof val === 'object' && val?.name) ? val.name : key;
                const st = (typeof val === 'object' && val?.status) ? val.status : val;
                const n = norm(name);
                if (!n) return;
                respondedNorms.add(n);
                if (st === 'available') available.push(name);
                else if (st === 'unavailable') unavailable.push(name);
            });

            const pending = rosterNames.filter(rName => {
                const rn = norm(rName);
                if (respondedNorms.has(rn)) return false;
                const parts = rn.split(/\s+/).filter(Boolean);
                for (const resp of respondedNorms) {
                    if (parts.length >= 2 && resp.includes(parts[0]) && resp.includes(parts[1])) return false;
                }
                return true;
            });

            // Estado del usuario actual
            const myName = this._getUserName();
            const myNorm = norm(myName);
            const myParts = myNorm.split(/\s+/).filter(Boolean);
            let myStatus = null;
            if (myNorm) {
                for (const [key, val] of Object.entries(responses)) {
                    const rName = norm((typeof val === 'object' && val?.name) ? val.name : key);
                    if (rName === myNorm || (myParts.length >= 2 && rName.includes(myParts[0]) && rName.includes(myParts[1]))) {
                        const st = (typeof val === 'object' && val?.status) ? val.status : val;
                        if (st === 'available' || st === 'unavailable') {
                            myStatus = st;
                            break;
                        }
                    }
                }
            }

            return { available, unavailable, pending, myStatus };
        }

        renderSlot(teamId) {
            const slot = document.getElementById(`tp-convo-pro-${teamId}`);
            const team = this.teamsById[teamId] || (window.ClubTeamsData || []).find(t => t.id === teamId);
            if (!slot || !team) return;

            const convo = this.liveDataByTeam[teamId];
            const isCap = this.isCaptainOf(team);
            const match = this._getNextMatch(team);
            const jNum = (convo && convo.jornada) || this._getTargetJornada(team);
            const needed = Number(convo?.neededPlayers || convo?.targetCount || 6);
            const isOpen = !convo || convo.status !== 'closed';
            const hasActiveConvo = Boolean(convo && (convo.opponent || convo.date || Object.keys(convo.responses || {}).length > 0 || convo.launchedByCaptain));

            const { available, unavailable, pending, myStatus } = this._computeLists(team, convo);
            const pct = Math.min(100, Math.round((available.length / needed) * 100));
            const expanded = Boolean(this.expandedTeams[teamId]);

            const isPlaceholder = (v) => !v || norm(v) === 'por definir' || norm(v) === 'tbd';
            const opponent = (!isPlaceholder(convo?.opponent) ? convo.opponent : null) || match?.opponent || 'Rival por confirmar';
            const dateTxt = (!isPlaceholder(convo?.date) ? convo.date : null) || match?.date || 'Fecha por confirmar';
            const timeTxt = (!isPlaceholder(convo?.time) ? convo.time : null) || match?.time || '';
            const venueTxt = (!isPlaceholder(convo?.venue) ? convo.venue : null) || match?.location || match?.venue || 'Sede oficial';
            const noteTxt = convo?.note || '';

            const statusBadge = !isOpen
                ? `<span class="tp-cp-badge closed"><i class="fas fa-lock"></i> Cerrada</span>`
                : (myStatus === 'available'
                    ? `<span class="tp-cp-badge yes"><i class="fas fa-check"></i> Vas a jugar</span>`
                    : (myStatus === 'unavailable'
                        ? `<span class="tp-cp-badge no"><i class="fas fa-times"></i> No puedes</span>`
                        : `<span class="tp-cp-badge wait"><i class="fas fa-clock"></i> Sin votar</span>`));

            const avatarColors = ['#0284c7', '#059669', '#7c3aed', '#d97706', '#db2777', '#2563eb'];
            const visibleAvatars = available.slice(0, 6);
            const extraAvatars = Math.max(0, available.length - visibleAvatars.length);
            const cupoFull = available.length >= needed;

            slot.innerHTML = `
                <div class="tp-cp-box ${cupoFull ? 'cupo-full' : ''}">
                    <!-- CABECERA MATCHDAY PRO -->
                    <div class="tp-cp-hero">
                        <div class="tp-cp-head">
                            <div class="tp-cp-title-wrap">
                                <span class="tp-cp-jtag">📢 JORNADA ${esc(jNum)}</span>
                                <span class="tp-cp-date-light">${esc(dateTxt)}${timeTxt ? ' • ' + esc(timeTxt) : ''}</span>
                            </div>
                            ${statusBadge}
                        </div>
                        <div class="tp-cp-opp-light">🆚 ${esc(opponent)}</div>
                        <div class="tp-cp-venue-light"><i class="fas fa-map-marker-alt"></i> ${esc(venueTxt)}</div>
                        ${noteTxt ? `<div class="tp-cp-note-light">💬 "${esc(noteTxt)}"</div>` : ''}
                    </div>

                    <div class="tp-cp-body">
                        <!-- BLOQUE JUGADOR: SIEMPRE VISIBLE EN 1 TOQUE (SOLO SÍ / NO) -->
                        <div class="tp-cp-vote-label">
                            <span><i class="fas fa-hand-pointer"></i> Confirma en 1 toque</span>
                            ${cupoFull ? `<span class="tp-cp-full-pill">🔥 CUPO COMPLETO</span>` : `<span>Faltan ${Math.max(0, needed - available.length)}</span>`}
                        </div>
                        <div class="tp-cp-vote-row">
                            <button type="button"
                                    class="tp-cp-vote-btn yes ${myStatus === 'available' ? 'selected' : ''}"
                                    ${!isOpen ? 'disabled' : ''}
                                    onclick="window.TeamConvocatoriaProUI.vote('${esc(teamId)}', 'available')">
                                <i class="fas fa-check-circle"></i> SÍ, VOY
                            </button>
                            <button type="button"
                                    class="tp-cp-vote-btn no ${myStatus === 'unavailable' ? 'selected' : ''}"
                                    ${!isOpen ? 'disabled' : ''}
                                    onclick="window.TeamConvocatoriaProUI.vote('${esc(teamId)}', 'unavailable')">
                                <i class="fas fa-times-circle"></i> NO PUEDO
                            </button>
                        </div>

                        <!-- AVATARES EN VIVO + PROGRESO -->
                        <div class="tp-cp-live-strip">
                            <div class="tp-cp-avatars">
                                ${visibleAvatars.length > 0 ? visibleAvatars.map((name, i) => `
                                    <span class="tp-cp-ava" title="${esc(name)}" style="background:${avatarColors[(name.length + i) % avatarColors.length]};">${esc(name.charAt(0).toUpperCase())}</span>
                                `).join('') : `<span class="tp-cp-ava empty">?</span>`}
                                ${extraAvatars > 0 ? `<span class="tp-cp-ava extra">+${extraAvatars}</span>` : ''}
                            </div>
                            <div class="tp-cp-live-meta">
                                <span><strong style="color:#059669;">${available.length}/${needed}</strong> van · <strong style="color:#dc2626;">${unavailable.length}</strong> no · <strong>${pending.length}</strong> pend.</span>
                                <button type="button" class="tp-cp-toggle-list" onclick="window.TeamConvocatoriaProUI.toggleExpanded('${esc(teamId)}')">
                                    ${expanded ? 'Ocultar ▲' : 'Ver lista ▼'}
                                </button>
                            </div>
                        </div>
                        <div class="tp-cp-bar"><div class="tp-cp-bar-fill ${cupoFull ? 'full' : ''}" style="width:${pct}%;"></div></div>

                        ${expanded ? `
                            <div class="tp-cp-lists">
                                <div><strong style="color:#059669;">✅ Van (${available.length}):</strong> ${available.length ? esc(available.join(', ')) : 'Nadie aún'}</div>
                                <div><strong style="color:#dc2626;">❌ No pueden (${unavailable.length}):</strong> ${unavailable.length ? esc(unavailable.join(', ')) : '—'}</div>
                                <div style="color:#64748b;"><strong>⏳ Pendientes (${pending.length}):</strong> ${pending.length ? esc(pending.join(', ')) : '¡Todos votaron!'}</div>
                            </div>
                        ` : ''}

                        ${isCap ? `
                            <!-- BLOQUE CAPITÁN PRO: EDITAR + CONTROL + WHATSAPP DIRECTO AL GRUPO -->
                            <div class="tp-cp-cap-bar tri">
                                <button type="button" class="tp-cp-cap-btn launch" onclick="window.TeamConvocatoriaProUI.openCaptainModal('${esc(teamId)}', true)">
                                    <i class="fas fa-bullhorn"></i> ${hasActiveConvo ? 'Editar' : 'Lanzar'}
                                </button>
                                <button type="button" class="tp-cp-cap-btn" onclick="window.TeamConvocatoriaProUI.openCaptainModal('${esc(teamId)}', false)">
                                    <i class="fas fa-crown"></i> Control
                                </button>
                                <button type="button" class="tp-cp-cap-btn wa-quick" onclick="window.TeamConvocatoriaProUI.shareWhatsApp('${esc(teamId)}')">
                                    <i class="fab fa-whatsapp"></i> Grupo WA
                                </button>
                            </div>
                        ` : `
                            <!-- BLOQUE CAPITÁN: RESTRINGIDO (ABRE POP-UP INFORMATIVO) -->
                            <div class="tp-cp-cap-bar" style="grid-template-columns:1fr;">
                                <button type="button" class="tp-cp-cap-btn" style="background:#f1f5f9;color:#64748b;border:1px solid #cbd5e1;" onclick="window.TeamConvocatoriaProUI.openCaptainModal('${esc(teamId)}', false)">
                                    <i class="fas fa-lock" style="color:#94a3b8;"></i> Control Capitán (Solo Capitán / Subcapitán)
                                </button>
                            </div>
                        `}
                    </div>
                </div>
            `;
        }

        toggleExpanded(teamId) {
            this.expandedTeams[teamId] = !this.expandedTeams[teamId];
            this.renderSlot(teamId);
        }

        async vote(teamId, status) {
            const svc = window.TeamConvocatoriaService;
            const team = this.teamsById[teamId] || (window.ClubTeamsData || []).find(t => t.id === teamId);
            if (!svc || !team) return;

            const playerName = this._getUserName();
            if (!playerName) {
                alert('Inicia sesión con tu cuenta de jugador para poder confirmar tu asistencia.');
                return;
            }

            if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(18);
            const j = (this.liveDataByTeam[teamId]?.jornada) || this._getTargetJornada(team);

            try {
                await svc.submitPlayerResponse(teamId, j, playerName, status, '');
                this._showToast(
                    status === 'available'
                        ? `✅ ¡Apuntado en ${team.name}! El capitán ya te ve en la lista.`
                        : `❌ Baja registrada en ${team.name}.`,
                    status === 'available' ? 'success' : 'warn'
                );
            } catch (err) {
                console.error('❌ [TeamConvocatoriaProUI] Error guardando voto:', err);
                this._showToast('No se pudo guardar tu respuesta. Inténtalo de nuevo.', 'warn');
            }
        }

        // ============================================================
        // 👑 PANEL DE CONTROL DEL CAPITÁN (MODAL / BOTTOM SHEET)
        // ============================================================

        openCaptainModal(teamId, openCreateForm = false) {
            const team = this.teamsById[teamId] || (window.ClubTeamsData || []).find(t => t.id === teamId);
            if (!team) return;
            if (!this.isCaptainOf(team)) {
                this.showCaptainRestrictedPopup(team);
                return;
            }
            this.teamsById[teamId] = team;
            this.activeCaptainModalTeamId = teamId;
            this.showCreateFormInModal = Boolean(openCreateForm);

            let modal = document.getElementById('tp-captain-convo-modal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'tp-captain-convo-modal';
                modal.className = 'tp-cp-modal-overlay';
                modal.onclick = (e) => { if (e.target === modal) this.closeCaptainModal(); };
                document.body.appendChild(modal);
            }
            modal.style.display = 'flex';
            this.renderCaptainModal(teamId);
        }

        closeCaptainModal() {
            this.activeCaptainModalTeamId = null;
            const modal = document.getElementById('tp-captain-convo-modal');
            if (modal) modal.style.display = 'none';
        }

        showCaptainRestrictedPopup(team) {
            let popup = document.getElementById('tp-captain-restricted-popup');
            if (!popup) {
                popup = document.createElement('div');
                popup.id = 'tp-captain-restricted-popup';
                popup.className = 'tp-cp-modal-overlay';
                popup.style.alignItems = 'center';
                popup.onclick = (e) => { if (e.target === popup) popup.style.display = 'none'; };
                document.body.appendChild(popup);
            }

            const cap = team?.captain && !String(team.captain).toLowerCase().includes('pendiente') ? team.captain : 'Por asignar';
            const sub = team?.subcaptain && !String(team.subcaptain).toLowerCase().includes('pendiente') ? team.subcaptain : '';

            popup.innerHTML = `
                <div class="tp-cp-modal-card" style="max-width:390px;text-align:center;" onclick="event.stopPropagation()">
                    <div style="background:linear-gradient(135deg,#0f172a,#1e293b);padding:20px 18px 16px;">
                        <div style="width:52px;height:52px;border-radius:16px;background:rgba(245,158,11,0.16);border:1.5px solid rgba(245,158,11,0.45);color:#fbbf24;display:inline-flex;align-items:center;justify-content:center;font-size:1.4rem;margin-bottom:10px;">
                            <i class="fas fa-lock"></i>
                        </div>
                        <div style="font-size:1.05rem;font-weight:950;color:#ffffff;">Acceso solo para Capitanes</div>
                        <div style="font-size:0.74rem;color:#94a3b8;margin-top:3px;">${esc(team?.name || 'Equipo')}</div>
                    </div>
                    <div style="padding:18px;color:#334155;">
                        <p style="margin:0 0 12px;font-size:0.86rem;font-weight:700;line-height:1.45;">
                            No puedes entrar en este panel porque <strong>no eres el Capitán ni el Subcapitán</strong> de este equipo.
                        </p>
                        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:10px 12px;font-size:0.78rem;text-align:left;margin-bottom:14px;">
                            <div><i class="fas fa-crown" style="color:#f59e0b;width:18px;"></i> <strong>Capitán/a:</strong> ${esc(cap)}</div>
                            ${sub ? `<div style="margin-top:4px;"><i class="fas fa-user-shield" style="color:#0284c7;width:18px;"></i> <strong>Subcapitán/a:</strong> ${esc(sub)}</div>` : ''}
                        </div>
                        <button type="button" onclick="document.getElementById('tp-captain-restricted-popup').style.display='none'"
                                style="width:100%;background:#0f172a;color:#ccff00;border:none;border-radius:12px;padding:11px;font-weight:950;font-size:0.82rem;cursor:pointer;">
                            Entendido
                        </button>
                    </div>
                </div>
            `;
            popup.style.display = 'flex';
        }

        renderCaptainModal(teamId) {
            const modal = document.getElementById('tp-captain-convo-modal');
            const team = this.teamsById[teamId];
            if (!modal || !team) return;

            const convo = this.liveDataByTeam[teamId] || {};
            const match = this._getNextMatch(team);
            const jNum = convo.jornada || this._getTargetJornada(team);
            const needed = Number(convo.neededPlayers || convo.targetCount || 6);
            const isOpen = convo.status !== 'closed';
            const { available, unavailable, pending } = this._computeLists(team, convo);
            const pct = Math.min(100, Math.round((available.length / needed) * 100));

            const roster = (team.roster || []).map(p => typeof p === 'string' ? p : (p.name || '')).filter(Boolean);
            const statusOf = (name) => {
                const n = norm(name);
                if (available.some(a => norm(a) === n)) return 'available';
                if (unavailable.some(u => norm(u) === n)) return 'unavailable';
                return null;
            };

            modal.innerHTML = `
                <div class="tp-cp-modal-card" onclick="event.stopPropagation()">
                    <div class="tp-cp-modal-head">
                        <div>
                            <div style="font-size:0.65rem;font-weight:900;color:#ccff00;text-transform:uppercase;letter-spacing:0.8px;">👑 CONTROL DEL CAPITÁN</div>
                            <div style="font-size:1.05rem;font-weight:950;color:#ffffff;">${esc(team.name)} • J${esc(jNum)}</div>
                        </div>
                        <button type="button" onclick="window.TeamConvocatoriaProUI.closeCaptainModal()"
                                style="background:rgba(255,255,255,0.1);border:none;color:#fff;width:32px;height:32px;border-radius:10px;cursor:pointer;font-size:1rem;">✕</button>
                    </div>

                    <div class="tp-cp-modal-body">
                        <!-- Acciones rápidas Capitán -->
                        <div class="tp-cp-cap-actions">
                            <button type="button" class="tp-cp-act primary" onclick="window.TeamConvocatoriaProUI.toggleCreateForm()">
                                <i class="fas fa-bullhorn"></i> ${this.showCreateFormInModal ? 'Cerrar Form' : 'Nueva / Editar'}
                            </button>
                            <button type="button" class="tp-cp-act wa" onclick="window.TeamConvocatoriaProUI.shareWhatsApp('${esc(teamId)}')">
                                <i class="fab fa-whatsapp"></i> Enviar a WhatsApp
                            </button>
                            <button type="button" class="tp-cp-act" onclick="window.TeamConvocatoriaProUI.copyWhatsAppText('${esc(teamId)}')">
                                <i class="fas fa-copy"></i> Copiar Texto WA
                            </button>
                            <button type="button" class="tp-cp-act" onclick="window.TeamConvocatoriaProUI.notifyPendingPlayers('${esc(teamId)}')">
                                <i class="fas fa-bell"></i> Recordar (${pending.length})
                            </button>
                            <button type="button" class="tp-cp-act" style="grid-column:1/-1;" onclick="window.TeamConvocatoriaProUI.toggleStatus('${esc(teamId)}')">
                                <i class="fas ${isOpen ? 'fa-lock' : 'fa-lock-open'}"></i> ${isOpen ? 'Cerrar Convocatoria y Publicar Alineación' : 'Reabrir Convocatoria para Votos'}
                            </button>
                        </div>

                        ${this.isPilotUser() ? `
                            <div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid rgba(204,255,0,0.4);border-radius:12px;padding:10px 12px;margin-bottom:12px;">
                                <div style="font-size:0.65rem;font-weight:950;color:#ccff00;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:7px;">
                                    🧪 LABORATORIO PILOTO (SOLO TU CUENTA 649219350)
                                </div>
                                <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;">
                                    <button type="button" onclick="window.TeamConvocatoriaProUI.closeCaptainModal(); window.TeamConvocatoriaProUI.checkAndShowWeeklyConvoPopup({ force: true });"
                                            style="background:rgba(204,255,0,0.16);color:#ccff00;border:1px solid rgba(204,255,0,0.45);border-radius:9px;padding:8px;font-size:0.72rem;font-weight:900;cursor:pointer;">
                                        🪟 Probar Pop-up Semanal
                                    </button>
                                    <button type="button" onclick="window.TeamConvocatoriaProUI.sendPilotPushToMe('${esc(teamId)}')"
                                            style="background:rgba(56,189,248,0.18);color:#38bdf8;border:1px solid rgba(56,189,248,0.45);border-radius:9px;padding:8px;font-size:0.72rem;font-weight:900;cursor:pointer;">
                                        📱 Enviar Push a mi Móvil
                                    </button>
                                </div>
                            </div>
                        ` : ''}

                        ${this.showCreateFormInModal ? `
                            <form class="tp-cp-form" onsubmit="window.TeamConvocatoriaProUI.submitLaunchConvo(event, '${esc(teamId)}')">
                                <div style="font-size:0.78rem;font-weight:900;color:#0f172a;margin-bottom:8px;">📢 Configurar y Lanzar Convocatoria</div>
                                <div class="tp-cp-form-grid">
                                    <label>Jornada<input id="tp-cpf-j" type="number" value="${esc(jNum)}" required></label>
                                    <label>Necesarios<input id="tp-cpf-needed" type="number" value="${esc(needed)}" min="2" max="20" required></label>
                                    <label class="full">Rival<input id="tp-cpf-opp" type="text" value="${esc(convo.opponent || match?.opponent || '')}" placeholder="Ej: CRAZYXPADEL 4M" required></label>
                                    <label>Fecha<input id="tp-cpf-date" type="text" value="${esc(convo.date || match?.date || '')}" placeholder="Sáb 16 Ene" required></label>
                                    <label>Hora<input id="tp-cpf-time" type="text" value="${esc(convo.time || match?.time || '')}" placeholder="11:00h" required></label>
                                    <label class="full">Sede / Club<input id="tp-cpf-venue" type="text" value="${esc(convo.venue || match?.location || match?.venue || 'Padel BCN - El Prat')}" required></label>
                                    <label class="full">Nota del capitán (opcional)<input id="tp-cpf-note" type="text" value="${esc(convo.note || '')}" placeholder="Ej: Llegar 20 min antes..."></label>
                                </div>
                                <button type="submit" class="tp-cp-submit-btn">
                                    🚀 Lanzar Convocatoria y Avisar a la Plantilla
                                </button>
                            </form>
                        ` : ''}

                        <!-- 3 KPIs rápidos -->
                        <div class="tp-cp-kpis">
                            <div class="tp-cp-kpi yes"><strong>${available.length}/${needed}</strong><span>✅ Van</span></div>
                            <div class="tp-cp-kpi no"><strong>${unavailable.length}</strong><span>❌ No pueden</span></div>
                            <div class="tp-cp-kpi wait"><strong>${pending.length}</strong><span>⏳ Pendientes</span></div>
                        </div>
                        <div class="tp-cp-bar" style="margin:8px 0 12px;"><div class="tp-cp-bar-fill" style="width:${pct}%;"></div></div>

                        <!-- Buscador y filtros rápidos para plantillas grandes (28+ jugadores) -->
                        <div class="tp-cp-filter-bar">
                            <input type="text" value="${esc(this.captainSearch)}" placeholder="Buscar jugador..."
                                   oninput="window.TeamConvocatoriaProUI.setCaptainSearch(this.value)"
                                   class="tp-cp-search-mini">
                            <div class="tp-cp-chips">
                                <button type="button" class="tp-cp-chip ${this.captainFilter === 'all' ? 'active' : ''}" onclick="window.TeamConvocatoriaProUI.setCaptainFilter('all')">Todos (${roster.length})</button>
                                <button type="button" class="tp-cp-chip ${this.captainFilter === 'available' ? 'active' : ''}" onclick="window.TeamConvocatoriaProUI.setCaptainFilter('available')">✅ Van (${available.length})</button>
                                <button type="button" class="tp-cp-chip ${this.captainFilter === 'unavailable' ? 'active' : ''}" onclick="window.TeamConvocatoriaProUI.setCaptainFilter('unavailable')">❌ No (${unavailable.length})</button>
                                <button type="button" class="tp-cp-chip ${this.captainFilter === 'pending' ? 'active' : ''}" onclick="window.TeamConvocatoriaProUI.setCaptainFilter('pending')">⏳ Pend (${pending.length})</button>
                            </div>
                        </div>

                        <!-- Control manual jugador por jugador -->
                        <div class="tp-cp-roster-control">
                            ${roster.filter(pName => {
                                const st = statusOf(pName);
                                if (this.captainFilter === 'available' && st !== 'available') return false;
                                if (this.captainFilter === 'unavailable' && st !== 'unavailable') return false;
                                if (this.captainFilter === 'pending' && st !== null) return false;
                                if (this.captainSearch && !norm(pName).includes(norm(this.captainSearch))) return false;
                                return true;
                            }).map(pName => {
                                const st = statusOf(pName);
                                return `
                                    <div class="tp-cp-player-row">
                                        <span class="tp-cp-player-name">${esc(pName)}</span>
                                        <div class="tp-cp-mini-votes">
                                            <button type="button" class="tp-cp-mini yes ${st === 'available' ? 'active' : ''}"
                                                    onclick="window.TeamConvocatoriaProUI.captainSetVote('${esc(teamId)}', '${esc(pName)}', 'available')">✅</button>
                                            <button type="button" class="tp-cp-mini no ${st === 'unavailable' ? 'active' : ''}"
                                                    onclick="window.TeamConvocatoriaProUI.captainSetVote('${esc(teamId)}', '${esc(pName)}', 'unavailable')">❌</button>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
            `;
        }

        toggleCreateForm() {
            this.showCreateFormInModal = !this.showCreateFormInModal;
            if (this.activeCaptainModalTeamId) this.renderCaptainModal(this.activeCaptainModalTeamId);
        }

        async submitLaunchConvo(event, teamId) {
            event.preventDefault();
            const svc = window.TeamConvocatoriaService;
            const team = this.teamsById[teamId];
            if (!svc || !team) return;

            const j = document.getElementById('tp-cpf-j').value.trim() || '1';
            const needed = parseInt(document.getElementById('tp-cpf-needed').value, 10) || 6;
            const opponent = document.getElementById('tp-cpf-opp').value.trim();
            const date = document.getElementById('tp-cpf-date').value.trim();
            const time = document.getElementById('tp-cpf-time').value.trim();
            const venue = document.getElementById('tp-cpf-venue').value.trim();
            const note = document.getElementById('tp-cpf-note').value.trim();

            const existing = this.liveDataByTeam[teamId] || {};
            const keepResponses = String(existing.jornada || '') === String(j) ? (existing.responses || {}) : {};

            try {
                await svc.saveConvocatoria({
                    id: svc.normalizeId(teamId, j),
                    teamId,
                    teamName: team.name,
                    jornada: j,
                    opponent,
                    date,
                    time,
                    venue,
                    neededPlayers: needed,
                    note,
                    status: 'open',
                    launchedByCaptain: this._getUserName() || 'Capitán',
                    responses: keepResponses
                });

                this.showCreateFormInModal = false;
                await this._sendInAppNotificationToRoster(
                    team,
                    `📢 Convocatoria abierta: ${team.name} (J${j})`,
                    `🆚 ${opponent} • ${date} ${time} (${venue}). Entra en EQUIPOS y confirma SÍ o NO en 1 toque.`
                );
                alert(`✅ Convocatoria J${j} lanzada para ${team.name}. Toda la plantilla ya puede votar SÍ o NO.`);
                this.renderCaptainModal(teamId);
            } catch (err) {
                alert('❌ Error lanzando convocatoria: ' + err.message);
            }
        }

        async captainSetVote(teamId, playerName, status) {
            const svc = window.TeamConvocatoriaService;
            const team = this.teamsById[teamId];
            if (!svc || !team) return;
            const j = (this.liveDataByTeam[teamId]?.jornada) || this._getTargetJornada(team);
            try {
                await svc.submitPlayerResponse(teamId, j, playerName, status, 'Marcado por capitán');
            } catch (err) {
                alert('Error actualizando estado: ' + err.message);
            }
        }

        async toggleStatus(teamId) {
            const svc = window.TeamConvocatoriaService;
            const team = this.teamsById[teamId];
            if (!svc || !team) return;
            const convo = this.liveDataByTeam[teamId] || {};
            const j = convo.jornada || this._getTargetJornada(team);
            const nextStatus = convo.status === 'closed' ? 'open' : 'closed';
            try {
                await svc.setConvocatoriaStatus(teamId, j, nextStatus);
            } catch (err) {
                alert('Error cambiando estado: ' + err.message);
            }
        }

        async notifyPendingPlayers(teamId) {
            const team = this.teamsById[teamId];
            const convo = this.liveDataByTeam[teamId] || {};
            const { pending } = this._computeLists(team, convo);
            if (pending.length === 0) {
                alert('🎉 ¡Todos los jugadores del equipo ya han votado!');
                return;
            }
            const sent = await this._sendInAppNotificationToRoster(
                team,
                `⏳ Recordatorio convocatoria ${team.name} (J${convo.jornada || '1'})`,
                `Faltas por confirmar si vienes contra ${convo.opponent || 'el rival'}. Toca SÍ o NO en la sección EQUIPOS.`,
                pending
            );
            alert(`🔔 Recordatorio enviado a ${sent || pending.length} jugadores pendientes.`);
        }

        async _sendInAppNotificationToRoster(team, title, body, onlyNames = null, options = {}) {
            const db = window.db || (window.firebase && window.firebase.firestore && window.firebase.firestore());
            if (!db || !team) return 0;

            const seasonSvc = window.TeamSeasonService;
            const currentSeason = seasonSvc ? seasonSvc.getSeasonByIdSync(team.seasonId || seasonSvc.getSelectedSeasonId()) : null;
            const isDraftPilotMode = Boolean(options.pilotOnly || (currentSeason && currentSeason.status === 'draft'));

            const targetSet = new Set(
                (Array.isArray(onlyNames) ? onlyNames : (team.roster || []).map(p => typeof p === 'string' ? p : p.name))
                    .map(n => norm(n))
                    .filter(Boolean)
            );
            if (!isDraftPilotMode && targetSet.size === 0) return 0;

            const j = (this.liveDataByTeam[team.id]?.jornada) || this._getTargetJornada(team);
            const targetUrl = window.TeamConvocatoriaService
                ? window.TeamConvocatoriaService.generateShareUrl(team.id, j)
                : 'index.html#teams';

            try {
                const snap = await db.collection('players').get();
                let sent = 0;
                const nowIso = new Date().toISOString();

                for (const doc of snap.docs) {
                    const d = doc.data() || {};
                    const ph = this._normPhone(d.phone || d.telefono || d.whatsapp || doc.id);
                    const pn = norm(d.name || d.displayName);

                    let match = false;
                    if (isDraftPilotMode) {
                        // En modo borrador/piloto, SOLO enviar push real a 649219350 para no molestar a nadie
                        match = (ph === this.PILOT_PHONE) || pn.includes('coscolin');
                    } else if (pn) {
                        const parts = pn.split(/\s+/).filter(Boolean);
                        match = targetSet.has(pn);
                        if (!match && parts.length >= 2) {
                            for (const t of targetSet) {
                                if (t.includes(parts[0]) && t.includes(parts[1])) { match = true; break; }
                            }
                        }
                    }

                    if (match) {
                        // Esquema oficial idéntico a AdminNotifications.js para activar Cloud Function FCM Push + Campanita
                        await doc.ref.collection('notifications').add({
                            title,
                            body,
                            read: false,
                            timestamp: nowIso,
                            createdAt: nowIso,
                            icon: 'bullhorn',
                            type: 'team_convocatoria',
                            data: {
                                url: targetUrl,
                                teamId: team.id,
                                jornada: String(j)
                            }
                        });
                        sent++;
                    }
                }

                // Aviso inmediato del navegador / PWA si el propio dispositivo tiene permiso Notification concedido
                if (sent > 0 && isDraftPilotMode && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                    try {
                        if (navigator.serviceWorker && navigator.serviceWorker.ready) {
                            const reg = await navigator.serviceWorker.ready;
                            if (reg && typeof reg.showNotification === 'function') {
                                reg.showNotification(title, {
                                    body,
                                    icon: 'img/logo_somospadel.png',
                                    badge: 'img/badge_somospadel.png',
                                    data: { url: targetUrl }
                                });
                            }
                        }
                    } catch (swErr) {}
                }

                return sent;
            } catch (err) {
                console.warn('⚠️ [TeamConvocatoriaProUI] Aviso enviando notificaciones push:', err.message);
                return 0;
            }
        }

        async sendPilotPushToMe(teamId) {
            const team = this.teamsById[teamId] || (window.ClubTeamsData || []).find(t => t.id === teamId);
            if (!team) return;
            const convo = this.liveDataByTeam[teamId] || {};
            const match = this._getNextMatch(team);
            const j = convo.jornada || this._getTargetJornada(team);
            const isPlaceholder = (v) => !v || norm(v) === 'por definir' || norm(v) === 'tbd';
            const opp = (!isPlaceholder(convo.opponent) ? convo.opponent : null) || match?.opponent || 'Rival de jornada';
            const date = (!isPlaceholder(convo.date) ? convo.date : null) || match?.date || 'Este fin de semana';

            const sent = await this._sendInAppNotificationToRoster(
                team,
                `🎾 Convocatoria ${team.name} (J${j})`,
                `Tienes partido vs ${opp} (${date}). ¡Confirma SÍ o NO en 1 toque! Es súper importante para que tu capitán cierre las parejas y todo fluya 💪`,
                null,
                { pilotOnly: true }
            );
            this._showToast(
                sent > 0
                    ? `📱 Push + campanita enviados a tu cuenta (649219350).`
                    : `⚠️ No se encontró tu documento en players (649219350) o faltan permisos Firestore.`,
                sent > 0 ? 'success' : 'warn'
            );
        }

        // ============================================================
        // 🪟 POP-UP SEMANAL INTELIGENTE (SOLO 1 VEZ POR CONVOCATORIA)
        // ============================================================

        async checkAndShowWeeklyConvoPopup({ force = false } = {}) {
            const seasonSvc = window.TeamSeasonService;
            const convoSvc = window.TeamConvocatoriaService;
            const user = this._getAuthUser();
            if (!seasonSvc || !convoSvc || !user) return;

            const seasons = await seasonSvc.getSeasons();
            // Priorizar temporada activa; si aún está en borrador 2027, permitirla SOLO para la cuenta piloto 649219350
            let targetSeason = seasons.find(s => s.status === 'active');
            if (!targetSeason) {
                const draft2027 = seasons.find(s => String(s.id) === '2027' && s.status === 'draft');
                if (draft2027 && this.isPilotUser()) {
                    targetSeason = draft2027;
                }
            }
            if (!targetSeason) return;

            const seasonTeams = await seasonSvc.getSeasonTeams(targetSeason.id);
            if (!Array.isArray(seasonTeams) || seasonTeams.length === 0) return;

            // Detectar todos los equipos del usuario en esa temporada
            const myMatches = window.TeamView && typeof window.TeamView.detectUserHeroTeams === 'function'
                ? window.TeamView.detectUserHeroTeams(seasonTeams)
                : [];
            if (!myMatches || myMatches.length === 0) return;

            const pendingCards = [];
            for (const entry of myMatches) {
                const team = entry.team || entry;
                if (!team || !team.id) continue;
                this.teamsById[team.id] = team;
                const j = this._getTargetJornada(team);
                const convoId = convoSvc.normalizeId(team.id, j, targetSeason.id);
                const seenKey = `sp_convo_popup_seen_${convoId}`;

                if (!force && localStorage.getItem(seenKey)) continue;

                let convoData = this.liveDataByTeam[team.id];
                if (!convoData) {
                    try {
                        convoData = await convoSvc.getConvocatoria(team.id, j);
                    } catch (e) {
                        convoData = null;
                    }
                }
                if (convoData && convoData.status === 'closed') continue;

                const { myStatus, available, needed } = {
                    ...this._computeLists(team, convoData),
                    needed: Number(convoData?.neededPlayers || convoData?.targetCount || 6)
                };

                // Si ya votó y no estamos forzando prueba, no molestar
                if (!force && myStatus) {
                    localStorage.setItem(seenKey, 'voted');
                    continue;
                }

                const match = this._getNextMatch(team);
                const isPlaceholder = (v) => !v || norm(v) === 'por definir' || norm(v) === 'tbd';
                pendingCards.push({
                    team,
                    j,
                    convoId,
                    seenKey,
                    myStatus,
                    confirmedCount: available.length,
                    needed,
                    opponent: (!isPlaceholder(convoData?.opponent) ? convoData.opponent : null) || match?.opponent || 'Rival de la jornada',
                    date: (!isPlaceholder(convoData?.date) ? convoData.date : null) || match?.date || 'Este fin de semana',
                    time: (!isPlaceholder(convoData?.time) ? convoData.time : null) || match?.time || '',
                    venue: (!isPlaceholder(convoData?.venue) ? convoData.venue : null) || match?.location || match?.venue || 'Sede oficial'
                });
            }

            if (pendingCards.length === 0) return;
            this._weeklyPopupCards = pendingCards;
            this.renderWeeklyConvoPopup();
        }

        renderWeeklyConvoPopup() {
            const cards = this._weeklyPopupCards || [];
            if (cards.length === 0) return;

            let overlay = document.getElementById('tp-weekly-convo-popup');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'tp-weekly-convo-popup';
                overlay.className = 'tp-cp-modal-overlay';
                overlay.style.alignItems = 'center';
                overlay.onclick = (e) => { if (e.target === overlay) this.dismissWeeklyPopup(); };
                document.body.appendChild(overlay);
            }

            overlay.innerHTML = `
                <div class="tp-cp-modal-card tp-wk-card" onclick="event.stopPropagation()">
                    <div class="tp-wk-head">
                        <div class="tp-wk-pill"><i class="fas fa-bolt"></i> CONVOCATORIA DE ESTA SEMANA</div>
                        <h3 class="tp-wk-title">¡Confirma tu asistencia en 1 toque! 🎾</h3>
                        <p class="tp-wk-sub">
                            Decir <strong>SÍ</strong> o <strong>NO</strong> a tiempo es clave para que tu capitán cierre las parejas y todo fluya perfecto 💪
                        </p>
                    </div>

                    <div class="tp-wk-body">
                        ${cards.map(c => `
                            <div class="tp-wk-team-box ${c.myStatus ? 'voted' : ''}">
                                <div class="tp-wk-team-top">
                                    <div>
                                        <div class="tp-wk-team-name">${esc(c.team.name)}</div>
                                        <div class="tp-wk-match-line">J${esc(c.j)} • 🆚 ${esc(c.opponent)}</div>
                                        <div class="tp-wk-meta-line"><i class="far fa-calendar"></i> ${esc(c.date)}${c.time ? ' • ' + esc(c.time) : ''} · 📍 ${esc(c.venue)}</div>
                                    </div>
                                    <span class="tp-wk-count">${c.confirmedCount}/${c.needed}</span>
                                </div>

                                <div class="tp-cp-vote-row" style="margin-top:9px;">
                                    <button type="button"
                                            class="tp-cp-vote-btn yes ${c.myStatus === 'available' ? 'selected' : ''}"
                                            onclick="window.TeamConvocatoriaProUI.voteFromWeeklyPopup('${esc(c.team.id)}', '${esc(c.j)}', 'available')">
                                        <i class="fas fa-check-circle"></i> SÍ, VOY
                                    </button>
                                    <button type="button"
                                            class="tp-cp-vote-btn no ${c.myStatus === 'unavailable' ? 'selected' : ''}"
                                            onclick="window.TeamConvocatoriaProUI.voteFromWeeklyPopup('${esc(c.team.id)}', '${esc(c.j)}', 'unavailable')">
                                        <i class="fas fa-times-circle"></i> NO PUEDO
                                    </button>
                                </div>
                            </div>
                        `).join('')}

                        <button type="button" class="tp-wk-later" onclick="window.TeamConvocatoriaProUI.dismissWeeklyPopup()">
                            Recordármelo luego (cerrar)
                        </button>
                    </div>
                </div>
            `;
            overlay.style.display = 'flex';
        }

        async voteFromWeeklyPopup(teamId, jornada, status) {
            await this.vote(teamId, status);
            const cards = this._weeklyPopupCards || [];
            const card = cards.find(c => c.team.id === teamId);
            if (card) {
                const prev = card.myStatus;
                card.myStatus = status;
                if (status === 'available' && prev !== 'available') card.confirmedCount++;
                else if (status !== 'available' && prev === 'available') card.confirmedCount = Math.max(0, card.confirmedCount - 1);
                try { localStorage.setItem(card.seenKey, 'voted'); } catch (e) {}
            }
            this.renderWeeklyConvoPopup();

            // Si ya votó en todos los equipos mostrados, cerrar automáticamente tras 900ms
            if (cards.length > 0 && cards.every(c => Boolean(c.myStatus))) {
                setTimeout(() => this.dismissWeeklyPopup(), 900);
            }
        }

        dismissWeeklyPopup() {
            const cards = this._weeklyPopupCards || [];
            cards.forEach(c => {
                try { localStorage.setItem(c.seenKey, c.myStatus ? 'voted' : 'dismissed'); } catch (e) {}
            });
            const overlay = document.getElementById('tp-weekly-convo-popup');
            if (overlay) overlay.style.display = 'none';
        }

        setCaptainFilter(filter) {
            this.captainFilter = filter || 'all';
            if (this.activeCaptainModalTeamId) this.renderCaptainModal(this.activeCaptainModalTeamId);
        }

        setCaptainSearch(val) {
            this.captainSearch = val || '';
            if (this.activeCaptainModalTeamId) this.renderCaptainModal(this.activeCaptainModalTeamId);
        }

        _buildWhatsAppMessage(teamId) {
            const svc = window.TeamConvocatoriaService;
            const team = this.teamsById[teamId];
            if (!svc || !team) return '';
            const convo = this.liveDataByTeam[teamId] || {};
            const match = this._getNextMatch(team);
            const isPlaceholder = (v) => !v || norm(v) === 'por definir' || norm(v) === 'tbd';
            const j = convo.jornada || this._getTargetJornada(team);
            const opponent = (!isPlaceholder(convo.opponent) ? convo.opponent : null) || match?.opponent || 'Próximo rival';
            const date = (!isPlaceholder(convo.date) ? convo.date : null) || match?.date || 'Por confirmar';
            const time = (!isPlaceholder(convo.time) ? convo.time : null) || match?.time || '';
            const venue = (!isPlaceholder(convo.venue) ? convo.venue : null) || match?.location || match?.venue || 'Sede oficial';
            const needed = Number(convo.neededPlayers || convo.targetCount || 6);
            const { available, unavailable, pending } = this._computeLists(team, convo);
            const url = svc.generateShareUrl(teamId, j);

            return (
                `🎾 *CONVOCATORIA OFICIAL — ${team.name}*\n` +
                `🏆 *JORNADA ${j}* ${convo.status === 'closed' ? '(CERRADA)' : '(ABIERTA)'}\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `🆚 *Rival:* ${opponent}\n` +
                `📅 *Fecha:* ${date}${time ? ' • ⏰ ' + time : ''}\n` +
                `📍 *Club:* ${venue}\n` +
                (convo.note ? `💬 *Nota:* ${convo.note}\n` : '') +
                `━━━━━━━━━━━━━━━━━━\n` +
                `✅ *VAN (${available.length}/${needed}):*\n` +
                (available.length ? available.map((n, i) => `${i + 1}. ${n}`).join('\n') : '• Nadie confirmado aún') +
                `\n\n❌ *NO PUEDEN (${unavailable.length}):* ${unavailable.length ? unavailable.join(', ') : '—'}\n` +
                `⏳ *FALTAN POR VOTAR (${pending.length}):* ${pending.length ? pending.join(', ') : '¡Todos han votado!'}\n\n` +
                `📲 *Vota SÍ o NO en 1 toque desde la App:*\n${url}`
            );
        }

        shareWhatsApp(teamId) {
            const text = this._buildWhatsAppMessage(teamId);
            if (!text) return;
            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
            this._showToast('📲 Abriendo WhatsApp... elige el grupo de tu equipo y pulsa enviar.', 'success');
        }

        copyWhatsAppText(teamId) {
            const text = this._buildWhatsAppMessage(teamId);
            if (!text) return;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text)
                    .then(() => this._showToast('✅ Mensaje copiado. Pégalo directo en el grupo de WhatsApp del equipo.', 'success'))
                    .catch(() => prompt('Copia el mensaje para WhatsApp:', text));
            } else {
                prompt('Copia el mensaje para WhatsApp:', text);
            }
        }
    }

    global.TeamConvocatoriaProUI = new TeamConvocatoriaProUI();
    console.log('📢 [TeamConvocatoriaProUI] Módulo Convocatorias Pro inicializado.');
})(typeof window !== 'undefined' ? window : globalThis);
