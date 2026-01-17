/**
 * ControlTowerView.js
 * The dedicated view for managing the live Americana.
 * Replicates the "Official Tournament" screen with Playtomic premium aesthetics.
 */
(function () {
    class ControlTowerView {
        constructor() {
            this.mainSection = 'playing'; // 'playing', 'history', 'help'
            this.activeTab = 'results'; // 'results', 'standings', 'summary'
            this.selectedRound = 1;
            this.allMatches = [];
            this.currentAmericanaId = null;
            this.currentAmericanaDoc = null;
            this.userHistory = [];
            this.unsubscribeMatches = null;
            this.unsubscribeEvent = null;
            this.pendingId = null;
            this.userMatches = [];
            this.userStats = {
                games: 0,
                wins: 0,
                mvps: 0 // Placeholder for future logic
            };
            this.autoStartInterval = null;
        }

        /**
         * System Cleanup: Essential for avoiding memory leaks (Audit Fix)
         */
        destroy() {
            console.log("🧹 [ControlTowerView] Cleaning up system resources...");
            if (this.unsubscribeMatches) this.unsubscribeMatches();
            if (this.unsubscribeEvent) this.unsubscribeEvent();
            if (this.autoStartInterval) clearInterval(this.autoStartInterval);

            this.unsubscribeMatches = null;
            this.unsubscribeEvent = null;
            this.autoStartInterval = null;
        }

        goToRound(n, event) {
            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }
            const num = parseInt(n);
            console.log("🚀 [TowerExpert] Navegando a ronda:", num);
            this.selectedRound = num;
            this.recalc();
        }

        prepareLoad(id, type = null) {
            console.log("🚀 [ControlTowerView] Preparing to load:", id, "Type:", type);
            this.pendingId = id;
            this.pendingType = type;
            // Force load immediately to ensure navigation works even if route "flash" happens
            if (id) this.load(id, type);
        }

        handleLiveRoute() {
            if (this.pendingId) {
                this.load(this.pendingId, this.pendingType);
                this.pendingId = null;
                this.pendingType = null;
            } else {
                this.loadLatest();
            }
        }

        async load(eventId, forceType = null) {
            this.currentAmericanaId = eventId;
            this.selectedRound = 1;
            this.mainSection = 'playing'; // Ensure we show the game area

            // Show loading
            this.render({ status: 'LOADING' });

            try {
                let doc = null;
                let isEntreno = forceType === 'entreno';

                if (forceType) {
                    const collection = isEntreno ? 'entrenos' : 'americanas';
                    doc = await window.db.collection(collection).doc(eventId).get();
                }

                if (!doc || !doc.exists) {
                    // Auto-detection fallback
                    doc = await window.db.collection('americanas').doc(eventId).get();
                    isEntreno = false;

                    if (!doc.exists) {
                        doc = await window.db.collection('entrenos').doc(eventId).get();
                        isEntreno = true;
                    }
                }

                if (doc.exists) {
                    this.currentAmericanaDoc = { id: doc.id, ...doc.data(), isEntreno };

                    // UX Improvement: Check status explicitly
                    if (this.currentAmericanaDoc.status === 'finished') {
                        this.activeTab = 'results'; // Show matches grid first, even if finished
                    } else {
                        this.activeTab = 'results';
                    }
                } else {
                    console.error("Event not found in either americanas or entrenos:", eventId);
                    this.renderEmptyState();
                    return;
                }
            } catch (e) {
                console.error("Error loading event doc:", e);
            }

            // Unsubscribe previous listeners
            if (this.unsubscribeMatches) this.unsubscribeMatches();
            if (this.unsubscribeEvent) this.unsubscribeEvent();

            const isEntreno = this.currentAmericanaDoc?.isEntreno;

            // Real-time listener for EVENT STATUS CHANGES
            const eventCollection = isEntreno ? 'entrenos' : 'americanas';
            this.unsubscribeEvent = window.db.collection(eventCollection)
                .doc(eventId)
                .onSnapshot(eventDoc => {
                    if (!eventDoc.exists) return;

                    const updatedEvent = { id: eventDoc.id, ...eventDoc.data(), isEntreno };
                    const previousStatus = this.currentAmericanaDoc?.status;
                    this.currentAmericanaDoc = updatedEvent;

                    // AUTO-TRIGGER: If status just changed to 'live', generate matches
                    // FIX: Ignore if previous status was 'adjusting' (Manual Admin Intervention) to prevent duplicates
                    if (updatedEvent.status === 'live' && previousStatus !== 'live' && previousStatus !== 'adjusting') {
                        console.log("🚀 [ControlTowerView] Event status changed to LIVE. Auto-generating matches...");
                        if (window.AmericanaService) {
                            window.AmericanaService.generateFirstRoundMatches(eventId, isEntreno ? 'entreno' : 'americana');
                        }
                    }

                    if (previousStatus !== updatedEvent.status) {
                        this.recalc();
                    }
                }, err => {
                    console.error("Error watching event status:", err);
                });

            // AUTO-START CHECKER (Every 30s)
            if (this.autoStartInterval) clearInterval(this.autoStartInterval);
            this.autoStartInterval = setInterval(async () => {
                const evt = this.currentAmericanaDoc;
                if (!evt || evt.status !== 'open' || !evt.date || !evt.time) return;

                // Check Time
                const now = new Date();
                const [h, m] = evt.time.split(':').map(Number);

                // NORMALIZE DATES (Handle YYYY-MM-DD and DD/MM/YYYY)
                // We convert both to YYYY-MM-DD for comparison
                const today = new Date();
                const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

                let evtDateNorm = evt.date;
                if (evt.date.includes('/')) {
                    // Assume DD/MM/YYYY
                    const [d, mo, y] = evt.date.split('/');
                    evtDateNorm = `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
                }

                // Debug Log (User can see this in console)
                console.log(`⏰ Auto-Start Check: Today=${todayStr}, Event=${evtDateNorm}, Time=${now.getHours()}:${now.getMinutes()} vs ${h}:${m}`);

                if (evtDateNorm === todayStr) {
                    const nowTime = now.getHours() * 60 + now.getMinutes();
                    const schedTime = h * 60 + m;

                    // FULL CHECK: Ensure event is full before auto-start
                    const players = evt.players || evt.registeredPlayers || [];
                    const maxCourts = evt.max_courts || 4;
                    const isFull = players.length >= (maxCourts * 4);

                    // Allow start if time matches OR passed (within last 2 hours to avoid auto-starting old events?)
                    // Actually, if it's 'open' and time passed, it SHOULD go live.
                    if (nowTime >= schedTime) {
                        if (isFull) {
                            console.log("🚀 AUTO-START TRIGGERED: Changing status to LIVE and Generating Matches");
                            // 1. Update Status (Trigger listeners)
                            await window.EventService.updateEvent(isEntreno ? 'entreno' : 'americana', eventId, { status: 'live' });

                            // 2. Force Generation (Redundancy in case listener misses)
                            if (window.AmericanaService) {
                                await window.AmericanaService.generateFirstRoundMatches(eventId, isEntreno ? 'entreno' : 'americana');
                            }

                            // 3. Update Local State immediately
                            this.currentAmericanaDoc.status = 'live';
                            this.recalc();
                        } else {
                            console.warn(`⏳ [AutoStart] Live View trigger: Time reached but NOT FULL (${players.length}/${maxCourts * 4}). Waiting.`);
                        }
                    }
                }
            }, 30000); // Check every 30s

            // FIXED: Dynamic collection selection based on Event Type
            // Entrenos use 'entrenos_matches', Americanas use 'matches'
            const matchesCollection = isEntreno ? 'entrenos_matches' : 'matches';
            // NOTE: Both Entrenos and Americanas use 'americana_id' field for consistency in ID reference
            const fieldName = 'americana_id';

            console.log(`🔍 [ControlTowerView] Loading matches from ${matchesCollection} for event ${eventId} (IsEntreno: ${!!isEntreno})`);

            this.unsubscribeMatches = window.db.collection(matchesCollection)
                .where(fieldName, '==', eventId)
                .onSnapshot(snapshot => {
                    const rawMatches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                    // CRITICAL FIX: Deduplicate matches by unique signature (court + round + teams)
                    // This prevents UI duplicates even if Firebase has duplicate documents
                    const seen = new Map();
                    const deduplicated = [];

                    rawMatches.forEach(match => {
                        // Create unique signature based on match characteristics
                        const teamA = Array.isArray(match.team_a_names) ? match.team_a_names.sort().join('|') : match.team_a_names;
                        const teamB = Array.isArray(match.team_b_names) ? match.team_b_names.sort().join('|') : match.team_b_names;
                        const signature = `${match.court}-${match.round}-${teamA}-${teamB}`;

                        if (!seen.has(signature)) {
                            seen.set(signature, true);
                            deduplicated.push(match);
                        } else {
                            console.warn(`⚠️ [ControlTowerView] Duplicate match detected and filtered: Court ${match.court}, Round ${match.round}`);
                        }
                    });

                    this.allMatches = deduplicated;
                    console.log(`✅ [ControlTowerView] Loaded ${rawMatches.length} matches (${deduplicated.length} unique after deduplication)`);

                    // Safety net & Fullness Trigger: If event is live OR FULL, and NO matches exist, attempt auto-generation
                    const maxCourts = this.currentAmericanaDoc?.max_courts || 4;
                    const isFull = (this.currentAmericanaDoc?.players?.length || 0) >= (maxCourts * 4);
                    const shouldGenerate = (this.currentAmericanaDoc?.status === 'live') || (isFull && this.currentAmericanaDoc?.status === 'open');

                    if (shouldGenerate && this.allMatches.length === 0) {
                        console.warn("⚠️ Event Trigger (Live or Full) - No matches found. Attempting auto-generation...");
                        if (window.AmericanaService) {
                            window.AmericanaService.generateFirstRoundMatches(eventId, isEntreno ? 'entreno' : 'americana');
                        }
                    }

                    this.recalc();

                    // CHECK ROUND COMPLETION (Manual Advancement Prompt)
                    this.checkRoundCompletion(this.allMatches);

                }, err => {
                    console.error("Error watching matches:", err);
                });
        }

        checkRoundCompletion(matches) {
            if (!this.currentAmericanaDoc) return;

            // 1. Determine Current Round (Max Round existing or specific logic?)
            // Usually we look at the highest round number present in matches.
            // But if we are viewing history, we might confuse it.
            // Let's assume 'Current Round' is the highest round created.
            if (matches.length === 0) return;

            const maxRound = Math.max(...matches.map(m => parseInt(m.round || 1)));

            // 2. Filter matches for this round
            const currentRoundMatches = matches.filter(m => parseInt(m.round) === maxRound);

            // 3. Check if ALL are finished
            const allFinished = currentRoundMatches.every(m => m.status === 'finished');

            if (allFinished && currentRoundMatches.length > 0) {
                // Check if already prompted/dismissed
                if (this.roundPromptDismissedFor === maxRound) return;

                // Check if Max Rounds reached (e.g. 6)
                const totalRounds = this.currentAmericanaDoc.rounds || 6;
                if (maxRound >= totalRounds) return; // End of Event

                // SHOW PROMPT
                this.showRoundFinishedModal(maxRound);
            } else {
                // Reset dismissal if we somehow went back (unlikely but safe)
                if (!allFinished) this.roundPromptDismissedFor = null;
                this.closeRoundFinishedModal();
            }
        }

        showRoundFinishedModal(round) {
            if (document.getElementById('round-finished-modal')) return;

            const modal = document.createElement('div');
            modal.id = 'round-finished-modal';
            modal.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.85); z-index: 13000;
                display: flex; align-items: center; justify-content: center;
                backdrop-filter: blur(5px); animation: fadeIn 0.3s ease;
            `;

            modal.innerHTML = `
                <div style="background: linear-gradient(135deg, #111 0%, #0a0a0a 100%); width: 90%; max-width: 400px; padding: 30px; border-radius: 24px; border: 2px solid #CCFF00; text-align: center; box-shadow: 0 0 50px rgba(204,255,0,0.2); position: relative;">
                    <div style="width: 60px; height: 60px; background: #CCFF00; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; box-shadow: 0 0 20px rgba(204,255,0,0.6);">
                        <i class="fas fa-flag-checkered" style="font-size: 1.8rem; color: black;"></i>
                    </div>
                    <h2 style="color: white; font-weight: 950; font-size: 1.5rem; margin: 0 0 10px 0;">RONDA ${round} FINALIZADA</h2>
                    <p style="color: #bbb; font-size: 0.9rem; margin-bottom: 25px;">Todos los partidos han terminado. ¿Qué quieres hacer?</p>
                    
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <button id="btn-next-round" style="background: #CCFF00; color: black; border: none; padding: 16px; border-radius: 14px; font-weight: 900; font-size: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; box-shadow: 0 5px 15px rgba(204,255,0,0.3);">
                            ✅ SÍ, SIGUIENTE RONDA
                        </button>
                        <button id="btn-edit-round" style="background: transparent; color: white; border: 2px solid #333; padding: 14px; border-radius: 14px; font-weight: 800; font-size: 0.9rem; cursor: pointer;">
                            ❌ NO, QUIERO EDITAR
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Bind Actions
            document.getElementById('btn-next-round').onclick = async () => {
                const btn = document.getElementById('btn-next-round');
                btn.innerHTML = '<div class="loader-spinner"></div> GENERANDO...';
                try {
                    const isEntreno = this.currentAmericanaDoc?.isEntreno;
                    // Trigger Generation
                    if (window.AmericanaService) {
                        await window.AmericanaService.generateNextRound(this.currentAmericanaDoc.id, round, isEntreno ? 'entreno' : 'americana');
                        // Dismiss modal 
                        this.roundPromptDismissedFor = null; // Reset for next
                        this.closeRoundFinishedModal();
                    }
                } catch (e) {
                    alert("Error: " + e.message);
                    btn.innerHTML = '✅ SÍ, SIGUIENTE RONDA';
                }
            };

            document.getElementById('btn-edit-round').onclick = () => {
                this.roundPromptDismissedFor = round;
                this.closeRoundFinishedModal();
            };
        }

        closeRoundFinishedModal() {
            const el = document.getElementById('round-finished-modal');
            if (el) el.remove();
        }

        async loadHistory() {
            const user = window.Store ? window.Store.getState('currentUser') : null;
            if (!user) return;

            try {
                // 1. Fetch Americanas
                const snap = await window.db.collection('americanas')
                    .where('players', 'array-contains', user.uid)
                    .orderBy('date', 'desc')
                    .get();
                this.userHistory = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // 2. Fetch Matches to calculate real stats
                const matchSnap = await window.db.collection('matches')
                    .where('team_a_ids', 'array-contains', user.uid)
                    .get();
                const matchSnapB = await window.db.collection('matches')
                    .where('team_b_ids', 'array-contains', user.uid)
                    .get();

                this.userMatches = [
                    ...matchSnap.docs.map(d => d.data()),
                    ...matchSnapB.docs.map(d => d.data())
                ];

                // Calculate real games
                let g = 0;
                let w = 0;
                this.userMatches.forEach(m => {
                    const isTeamA = m.team_a_ids?.includes(user.uid);
                    const sA = parseInt(m.score_a || 0);
                    const sB = parseInt(m.score_b || 0);

                    if (isTeamA) {
                        g += sA;
                        if (sA > sB) w++;
                    } else {
                        g += sB;
                        if (sB > sA) w++;
                    }
                });

                this.userStats = {
                    games: g,
                    wins: w,
                    events: this.userHistory.length
                };

                this.recalc();
            } catch (e) {
                console.error("History fail:", e);
                // Fallback attempt with registeredPlayers
                try {
                    const snap2 = await window.db.collection('americanas')
                        .where('registeredPlayers', 'array-contains', user.uid)
                        .get();
                    this.userHistory = snap2.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    this.recalc();
                } catch (e2) { }
            }
        }

        async loadLatest() {
            this.render({ status: 'LOADING' });
            try {
                const user = window.Store ? window.Store.getState('currentUser') : null;

                // Fetch both Americanas and Entrenos
                const [amsSnap, entsSnap] = await Promise.all([
                    window.db.collection('americanas').orderBy('date', 'desc').limit(5).get(),
                    window.db.collection('entrenos').orderBy('date', 'desc').limit(5).get()
                ]);

                const events = [
                    ...amsSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'americana' })),
                    ...entsSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'entreno' }))
                ];

                // Sort by prioritized relevance: Status (Live > Finished), then Date
                events.sort((a, b) => {
                    if (a.status === 'live' && b.status !== 'live') return -1;
                    if (b.status === 'live' && a.status !== 'live') return 1;
                    return new Date(b.date) - new Date(a.date);
                });

                // Priority for selection: 
                // 1. Live event where user plays
                // 2. Any live event
                // 3. User's most recent finished event
                // 4. Latest overall event

                const myLiveEvent = user ? events.find(e =>
                    e.status === 'live' && (
                        (e.players && e.players.some(p => (p.uid || p.id) === user.uid)) ||
                        (e.registeredPlayers && e.registeredPlayers.includes(user.uid))
                    )
                ) : null;

                const anyLiveEvent = events.find(e => e.status === 'live');

                const myFinishedEvent = user ? events.find(e =>
                    e.status === 'finished' && (
                        (e.players && e.players.some(p => (p.uid || p.id) === user.uid)) ||
                        (e.registeredPlayers && e.registeredPlayers.includes(user.uid))
                    )
                ) : null;

                const target = myLiveEvent || anyLiveEvent || myFinishedEvent || events[0];

                if (target) {
                    this.load(target.id, target.type);
                } else {
                    this.renderEmptyState();
                }
            } catch (e) {
                console.error("Error loading latest:", e);
                this.renderEmptyState();
            }
        }

        renderEmptyState() {
            const container = document.getElementById('content-area');
            if (container) {
                container.innerHTML = `
                    <div style="padding: 80px 40px; text-align: center; color: #888; background: #F8F9FA; min-height: 80vh; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                        <div style="width: 100px; height: 100px; background: white; border-radius: 30px; display: flex; align-items: center; justify-content: center; margin: 0 auto 30px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #eee;">
                            <i class="fas fa-trophy" style="font-size: 3rem; color: #ddd;"></i>
                        </div>
                        <h3 style="color: #111; font-weight: 900; font-family: 'Outfit'; font-size: 1.5rem; letter-spacing: -0.5px;">CERO ACTIVIDAD</h3>
                        <p style="font-size: 1rem; line-height: 1.6; margin-top: 15px; color: #666; max-width: 300px;">
                            No hemos encontrado eventos activos o recientes para mostrar resultados.
                        </p>
                        <button onclick="window.Router.navigate('americanas')" style="margin-top: 30px; background: #000; color: white; border: none; padding: 14px 28px; border-radius: 12px; font-weight: 800; font-size: 0.9rem; cursor: pointer;">
                            BUSCAR PARTIDOS 🎾
                        </button>
                    </div>
                `;
            }
        }

        recalc() {
            // Filtrado de élite: parseInt garantiza que "1", 1 y "1º" coincidan con parseInt(selectedRound)
            const sNum = parseInt(this.selectedRound) || 1;
            const currentRoundMatches = this.allMatches.filter(m => {
                const mNum = parseInt(m.round);
                return mNum === sNum;
            });

            console.log(`[Tower] Recalc. Ronda: ${sNum}. Partidos encontrados: ${currentRoundMatches.length} de ${this.allMatches.length}`);

            const roundData = {
                number: sNum,
                matches: currentRoundMatches.map(m => {
                    const namesA = Array.isArray(m.team_a_names) ? m.team_a_names.join(' / ') : (m.team_a_names || 'Equipo A');
                    const namesB = Array.isArray(m.team_b_names) ? m.team_b_names.join(' / ') : (m.team_b_names || 'Equipo B');

                    return {
                        court: m.court,
                        teamA: namesA,
                        teamB: namesB,
                        scoreA: m.score_a,
                        scoreB: m.score_b,
                        isFinished: m.status === 'finished',
                        isLive: m.status === 'live',
                        level_avg: m.level_avg || '3.5',
                        ...m
                    };
                }).sort((a, b) => a.court - b.court)
            };

            const maxMatchRound = this.allMatches.length > 0
                ? Math.max(...this.allMatches.map(m => parseInt(m.round || 1)))
                : 1;
            const configRounds = this.currentAmericanaDoc?.rounds || 6;
            const roundsLimit = Math.max(maxMatchRound, configRounds);

            const roundsSchedule = Array.from({ length: roundsLimit }, (_, i) => ({ number: i + 1 }));

            this.render({
                currentRound: roundData,
                roundsSchedule: roundsSchedule,
                isLive: this.currentAmericanaDoc?.status === 'live'
            });
        }

        switchTab(tab) {
            this.activeTab = tab;
            this.recalc();
        }

        switchSection(section) {
            this.mainSection = section;
            if (section === 'history') this.loadHistory();
            this.recalc();
        }

        render(data) {
            const container = document.getElementById('content-area');
            if (!container) return;

            const user = window.Store ? window.Store.getState('currentUser') : null;
            const isPlayingHere = this.currentAmericanaDoc && user && (
                (this.currentAmericanaDoc.players || []).includes(user.uid) ||
                (this.currentAmericanaDoc.registeredPlayers || []).includes(user.uid)
            );

            // SMART PATCHING (Prevent Flash)
            if (this.mainSection === 'playing' && this.activeTab === 'results' && document.querySelector('.tour-grid-container')) {
                const rd = data?.currentRound || { matches: [] };
                const ar = data?.roundsSchedule || [];
                // Only smart update if we have matches, otherwise full render might be safer
                if (this.smartUpdateResults(rd, ar)) {
                    return;
                }
            }

            // --- STATE PRESERVATION ---
            const scrollPos = window.scrollY;
            const openEditIds = Array.from(document.querySelectorAll('[id^="edit-actions-"]'))
                .filter(el => el.style.display !== 'none')
                .map(el => el.id);
            // --------------------------

            container.innerHTML = `
                <div class="tournament-layout fade-in" style="background: #F8F9FA;">
                    
                    <!-- NEW SUBMENU STRUCTURE (PREMIUM GLASS) -->
                    <div style="background: rgba(255,255,255,0.9); backdrop-filter: blur(15px); padding: 12px; display: flex; justify-content: center; gap: 8px; border-bottom: 1px solid rgba(0,0,0,0.05); position: sticky; top: 0; z-index: 1002; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                        <button onclick="window.ControlTowerView.switchSection('playing')" style="flex:1; border:none; background: ${this.mainSection === 'playing' ? 'var(--playtomic-neon)' : 'rgba(0,0,0,0.05)'}; color: ${this.mainSection === 'playing' ? 'black' : '#666'}; padding: 12px 6px; border-radius: 8px; font-weight: 900; font-size: 0.6rem; transition: 0.3s; text-transform: uppercase; letter-spacing: 0.5px;">EN JUEGO</button>
                        <button onclick="window.ControlTowerView.switchSection('history')" style="flex:1; border:none; background: ${this.mainSection === 'history' ? 'var(--playtomic-neon)' : 'rgba(0,0,0,0.05)'}; color: ${this.mainSection === 'history' ? 'black' : '#666'}; padding: 12px 6px; border-radius: 8px; font-weight: 900; font-size: 0.6rem; transition: 0.3s; text-transform: uppercase; letter-spacing: 0.5px;">MI PASADO</button>
                        <button onclick="window.ControlTowerView.switchSection('help')" style="flex:1; border:none; background: ${this.mainSection === 'help' ? 'var(--playtomic-neon)' : 'rgba(0,0,0,0.05)'}; color: ${this.mainSection === 'help' ? 'black' : '#666'}; padding: 12px 6px; border-radius: 8px; font-weight: 900; font-size: 0.6rem; transition: 0.3s; text-transform: uppercase; letter-spacing: 0.5px;">INFO</button>
                    </div>

                    ${this.renderMainArea(data, isPlayingHere)}
                </div>
            `;

            // --- STATE RESTORATION ---
            if (openEditIds.length > 0) {
                openEditIds.forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.style.display = 'flex';
                });
            }
            // Restore scroll only if we haven't navigated far (optional, but requested)
            // But if content height changes, scroll might be wrong. Usually safe for minor updates.
            if (scrollPos > 0) {
                window.scrollTo(0, scrollPos);
            }
            // --------------------------
        }

        renderMainArea(data, isPlayingHere) {
            if (this.mainSection === 'help') return this.renderHelpContent();
            if (this.mainSection === 'history') return this.renderHistoryContent();

            // DEFAULT: PLAYING AREA
            const roundData = data?.currentRound || { matches: [] };
            const amName = this.currentAmericanaDoc ? this.currentAmericanaDoc.name : "Americana Activa";

            return `
                <div class="tour-header-context" style="background: linear-gradient(135deg, #CCFF00 0%, #00E36D 100%); padding: 35px 20px; text-align: center; border-bottom: 2px solid rgba(0,0,0,0.05); position: relative;">
                    <!-- ACTION BUTTONS -->
                    <div style="position:absolute; top:15px; right:15px; display:flex; gap:10px; z-index:10;">
                         <div onclick="window.ChatView.init('${this.currentAmericanaDoc?.id}', '${amName}')" 
                              style="background:black; color:white; padding:6px 12px; border-radius:8px; font-weight:900; font-size:0.7rem; cursor:pointer; box-shadow:0 4px 10px rgba(0,0,0,0.2);">
                             <i class="fas fa-comment-dots"></i> CHAT
                         </div>
                         <div onclick="window.openTVMode('${this.currentAmericanaDoc?.id}', '${this.currentAmericanaDoc?.isEntreno ? 'entreno' : 'americana'}')" 
                              style="background:black; color:#CCFF00; padding:6px 12px; border-radius:8px; font-weight:900; font-size:0.7rem; cursor:pointer; box-shadow:0 4px 10px rgba(0,0,0,0.2);">
                             <i class="fas fa-tv"></i> TV
                         </div>
                    </div>
                    ${isPlayingHere ? `
                        <div style="background: rgba(0,0,0,0.1); border: 1px solid rgba(0,0,0,0.2); color: #000; display: inline-block; padding: 4px 14px; border-radius: 20px; font-size: 0.6rem; font-weight: 900; margin-bottom: 15px; letter-spacing: 1px; text-transform: uppercase;">
                           ESTÁS PARTICIPANDO ✅
                        </div>
                    ` : ''}
                    
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 15px;">
                        <div style="position: relative;">
                            <img src="${this.currentAmericanaDoc?.image_url || 'img/logo_somospadel.png'}" 
                                 style="width: 75px; height: 75px; border-radius: 50%; border: 3px solid white; box-shadow: 0 8px 25px rgba(0,0,0,0.2);"
                                 onerror="this.src='img/logo_somospadel.png'">
                        </div>
                        <h1 style="color: #000; margin: 0; font-family: 'Outfit'; font-weight: 900; font-size: 1.5rem; letter-spacing: -0.5px; text-shadow: 0 1px 0 rgba(255,255,255,0.4);">${amName.toUpperCase()}</h1>
                    </div>
                    
                    <div style="color: rgba(0,0,0,0.5); font-size: 0.8rem; margin-top: 8px; font-weight: 800; letter-spacing: 0.5px; display: flex; flex-direction: column; align-items: center; gap: 5px;">
                        <div>${this.currentAmericanaDoc?.date || ''} • ${(this.currentAmericanaDoc?.category === 'male' ? 'MASCULINA' :
                    this.currentAmericanaDoc?.category === 'female' ? 'FEMENINA' :
                        this.currentAmericanaDoc?.category === 'mixed' ? 'MIXTA' :
                            this.currentAmericanaDoc?.category === 'open' ? 'TODOS' : 'PRO')}</div>
                        
                        ${(() => {
                    const mode = (this.currentAmericanaDoc?.pair_mode || this.currentAmericanaDoc?.format || '').toLowerCase();
                    const nameUpper = (this.currentAmericanaDoc?.name || '').toUpperCase();
                    let label = 'PAREJA FIJA';
                    let color = '#a855f7';

                    if (nameUpper.includes('TWISTER') || mode.includes('twister') || nameUpper.includes('ROTATIVO') || mode.includes('rotating') || mode.includes('rotativo')) {
                        label = 'TWISTER';
                        color = '#38bdf8';
                    }

                    return `<div style="background: ${color}22; color: ${color}; border: 1px solid ${color}; padding: 2px 10px; border-radius: 6px; font-size: 0.65rem; font-weight: 950; letter-spacing: 1px; text-transform: uppercase;">MODO: ${label}</div>`;
                })()}
                    </div>
                </div>

                <div class="tour-sub-nav" style="background: rgba(255,255,255,0.8); backdrop-filter: blur(15px); padding: 12px 10px; display: flex; gap: 8px; border-bottom: 2px solid #CCFF00; position: sticky; top: 62px; z-index: 1001; box-shadow: 0 4px 10px rgba(0,0,0,0.03);">
                    <button class="tour-menu-item ${this.activeTab === 'results' ? 'active' : ''}" style="flex:1; border-radius: 12px; font-size: 0.55rem; font-weight: 900; background: ${this.activeTab === 'results' ? 'linear-gradient(135deg, #CCFF00 0%, #B8E600 100%)' : '#f0f0f0'}; color: #000; border: none; box-shadow: ${this.activeTab === 'results' ? '0 4px 10px rgba(204,255,0,0.3)' : 'none'}; transition: 0.3s;" onclick="window.ControlTowerView.switchTab('results')">PARTIDOS</button>
                    <button class="tour-menu-item ${this.activeTab === 'standings' ? 'active' : ''}" style="flex:1; border-radius: 12px; font-size: 0.55rem; font-weight: 900; background: ${this.activeTab === 'standings' ? 'linear-gradient(135deg, #CCFF00 0%, #B8E600 100%)' : '#f0f0f0'}; color: #000; border: none; box-shadow: ${this.activeTab === 'standings' ? '0 4px 10px rgba(204,255,0,0.3)' : 'none'}; transition: 0.3s;" onclick="window.ControlTowerView.switchTab('standings')">POSICIONES</button>
                    <button class="tour-menu-item ${this.activeTab === 'summary' ? 'active' : ''}" style="flex:1; border-radius: 12px; font-size: 0.55rem; font-weight: 900; background: ${this.activeTab === 'summary' ? 'linear-gradient(135deg, #CCFF00 0%, #B8E600 100%)' : '#f0f0f0'}; color: #000; border: none; box-shadow: ${this.activeTab === 'summary' ? '0 4px 10px rgba(204,255,0,0.3)' : 'none'}; transition: 0.3s;" onclick="window.ControlTowerView.switchTab('summary')">STATS</button>
                    <button class="tour-menu-item ${this.activeTab === 'report' ? 'active' : ''}" style="flex:1; border-radius: 12px; font-size: 0.55rem; font-weight: 900; background: ${this.activeTab === 'report' ? 'linear-gradient(135deg, #CCFF00 0%, #B8E600 100%)' : '#f0f0f0'}; color: #000; border: none; box-shadow: ${this.activeTab === 'report' ? '0 4px 10px rgba(204,255,0,0.3)' : 'none'}; transition: 0.3s;" onclick="window.ControlTowerView.switchTab('report')">INFORME</button>
                </div>

                ${this.renderActiveContent(data, roundData)}
            `;
        }

        renderActiveContent(data, roundData) {
            if (data?.status === 'LOADING') return '<div class="loader" style="margin:80px auto;"></div>';

            switch (this.activeTab) {
                case 'standings': return this.renderStandingsView();
                case 'summary': return this.renderSummaryView();
                case 'report': return this.renderReportView();
                default:
                case 'results': return this.renderResultsView(roundData, data?.roundsSchedule || [], data?.isLive);
            }
        }

        smartUpdateResults(roundData, allRounds) {
            const grid = document.querySelector('.tour-grid-container');
            if (!grid) return false;

            // 1. Update Round Tabs (Naive is fine, low interaction)
            const filterBar = document.querySelector('.tour-filter-bar');
            if (filterBar) {
                // Only update if changed to prevent flicker, or just replace innerHTML is fast enough usually
                const newTabs = this.renderRoundTabs(allRounds, roundData.number);
                if (filterBar.innerHTML !== newTabs) filterBar.innerHTML = newTabs;
            }

            const matches = roundData.matches;

            // IF EMPTY State needed
            if (matches.length === 0) {
                const existingCards = grid.querySelectorAll('.tour-match-card');
                if (existingCards.length > 0) {
                    console.log("🚀 [SmartUpdate] Detected empty match list. Forcing full re-render to clear UI.");
                    return false; // Force full render to show "Generando..." or empty state
                }
                // If already empty, standard logic handles it (or we allow re-render to update message)
                // Returning false is always safe for "Empty" state updates to ensure message is correct.
                return false;
            }

            const validIds = new Set(matches.map(m => m.id));

            // 2. Insert / Update Logic
            matches.forEach((match, index) => {
                const cardId = `tour-match-${match.id}`;
                let el = document.getElementById(cardId);

                if (el) {
                    // --- UPDATE EXISTING CARD ---
                    // 1. Status Badge
                    const statusArea = el.querySelector('.status-area');
                    const isFinished = match.isFinished;
                    const isLive = this.currentAmericanaDoc?.status === 'live' && !isFinished;
                    const newStatusHTML = isFinished ?
                        '<span style="background: #25D366; color: white; padding: 4px 10px; border-radius: 12px; font-weight: 900; font-size: 0.6rem; letter-spacing: 0.5px;">FINALIZADO</span>' :
                        (isLive ? '<span class="status-badge-live">⚡ EN JUEGO</span>' : '<span style="color:#BBB;">ESPERANDO</span>');

                    if (statusArea && statusArea.innerHTML !== newStatusHTML) statusArea.innerHTML = newStatusHTML;

                    // 2. Names (Hot Swap for Vacancies)
                    const getTeamNameStr = (m, side) => {
                        const namesArr = m[`team_${side.toLowerCase()}_names`];
                        const teamStr = m[`team${side.toUpperCase()}`];
                        if (teamStr && typeof teamStr === 'string' && teamStr.length > 0) return teamStr;
                        if (Array.isArray(namesArr)) return namesArr.join(' / ');
                        return String(namesArr || '');
                    };

                    const nameAStr = getTeamNameStr(match, 'a') || 'JUGADOR A';
                    const nameBStr = getTeamNameStr(match, 'b') || 'JUGADOR B';

                    const nameAEl = document.getElementById(`match-name-a-${match.id}`);
                    const nameBEl = document.getElementById(`match-name-b-${match.id}`);

                    if (nameAEl && nameAEl.innerText.trim() !== nameAStr) nameAEl.innerHTML = (match.isFinished && parseInt(match.score_a) > parseInt(match.score_b) ? '<i class="fas fa-trophy" style="color: #CCFF00; font-size: 0.9rem;"></i> ' : '') + nameAStr;
                    if (nameBEl && nameBEl.innerText.trim() !== nameBStr) nameBEl.innerHTML = (match.isFinished && parseInt(match.score_b) > parseInt(match.score_a) ? '<i class="fas fa-trophy" style="color: #CCFF00; font-size: 0.9rem;"></i> ' : '') + nameBStr;

                    // 3. Scores & Styling
                    const sA = parseInt(match.score_a || 0);
                    const sB = parseInt(match.score_b || 0);

                    const scoreAEl = document.getElementById(`match-score-a-${match.id}`);
                    const scoreBEl = document.getElementById(`match-score-b-${match.id}`);
                    const valAEl = document.getElementById(`score-a-val-${match.id}`);
                    const valBEl = document.getElementById(`score-b-val-${match.id}`);

                    if (scoreAEl && scoreAEl.innerText != sA) scoreAEl.innerText = sA;
                    if (scoreBEl && scoreBEl.innerText != sB) scoreBEl.innerText = sB;
                    if (valAEl && valAEl.innerText != sA) valAEl.innerText = sA;
                    if (valBEl && valBEl.innerText != sB) valBEl.innerText = sB;

                    // Update Styles for Winner
                    if (match.isFinished) {
                        const winStyle = "color: #111 !important; font-weight: 950 !important; border-bottom: 3px solid #CCFF00; padding-bottom: 2px; text-decoration: none; display: flex; align-items: center; gap: 10px;";
                        const normStyle = "color: #111; font-weight: 800; padding: 6px 0; display: flex; align-items: center; gap: 10px;";

                        if (nameAEl) {
                            nameAEl.style.cssText = (sA > sB) ? winStyle : normStyle;
                            if (scoreAEl) {
                                scoreAEl.style.background = (sA > sB) ? 'var(--brand-neon)' : 'var(--bg-app)';
                                scoreAEl.style.color = (sA > sB) ? 'black' : 'var(--text-primary)';
                                scoreAEl.style.boxShadow = (sA > sB) ? 'var(--shadow-neon)' : 'inset 0 2px 4px rgba(0,0,0,0.05)';
                            }
                        }
                        if (nameBEl) {
                            nameBEl.style.cssText = (sB > sA) ? winStyle : normStyle;
                            if (scoreBEl) {
                                scoreBEl.style.background = (sB > sA) ? 'var(--brand-neon)' : 'var(--bg-app)';
                                scoreBEl.style.color = (sB > sA) ? 'black' : 'var(--text-primary)';
                                scoreBEl.style.boxShadow = (sB > sA) ? 'var(--shadow-neon)' : 'inset 0 2px 4px rgba(0,0,0,0.05)';
                            }
                        }
                    }

                } else {
                    // --- INSERT NEW CARD ---
                    // Find correct position?
                    // Naive append is safer for now, unless we want strict ordering.
                    // Given we filter by round, usually strict order isn't critical if sorting is done in 'recalc'.
                    // But if we insert in middle, we should use index.
                    // Let's just append for simplicity as 'smart update' implies structure is mostly same.
                    grid.insertAdjacentHTML('beforeend', this.renderTournamentCard(match));
                }
            });

            // 3. REMOVE STALE CARDS (The fix for the user)
            const allCards = Array.from(grid.querySelectorAll('.tour-match-card'));
            allCards.forEach(card => {
                // Extract ID from e.g. "tour-match-abc1234"
                const id = card.id.replace('tour-match-', '');
                if (!validIds.has(id)) {
                    console.log("[SmartUpdate] Removing stale card:", id);
                    card.remove();
                }
            });

            // Remove lingering Next Round UI if present to re-append/check logic later? 
            // Better to let renderResultsView handle that? No, smartUpdate handles Grid. 
            // We should arguably just return false if structure changes drastically,
            // but for filtering cards this logic is sound.

            return true;
        }

        renderResultsView(roundData, allRounds, isLiveEvent = false) {
            const tabs = this.renderRoundTabs(allRounds, roundData.number);

            // CHECK FOR ROUND COMPLETION
            const isRoundComplete = roundData.matches.length > 0 && roundData.matches.every(m => m.isFinished);
            let nextRoundUI = '';

            if (isRoundComplete && this.currentAmericanaDoc?.status === 'live') {
                nextRoundUI = `
                    <div id="next-round-btn-container" class="animate-pop-in" style="margin-top: 30px; background: white; padding: 25px; border-radius: 20px; border: 2px solid #CCFF00; box-shadow: 0 10px 30px rgba(204,255,0,0.2); text-align: center;">
                        <h3 style="margin: 0 0 15px 0; font-weight: 900; font-size: 1.1rem;">🏁 RONDA ${roundData.number} FINALIZADA</h3>
                        <p style="font-size: 0.9rem; color: #666; margin-bottom: 20px;">
                            Todos los resultados han sido introducidos. ¿Deseas generar la siguiente ronda?
                        </p>
                        <div style="display: flex; gap: 15px; justify-content: center;">
                             <button onclick="window.ControlTowerView.triggerNextRound(${roundData.number})" 
                                    class="btn-primary-pro"
                                    style="padding: 15px 30px; font-size: 1rem; background: var(--playtomic-neon); color: black; border: none; box-shadow: 0 5px 15px rgba(204,255,0,0.4);">
                                SI, SIGUIENTE RONDA 🚀
                            </button>
                             <button onclick="document.getElementById('next-round-btn-container').innerHTML='<p>Puedes editar los resultados usando el botón ✏️ en cada tarjeta.</p>'; setTimeout(() => window.ControlTowerView.recalc(), 3000);" 
                                    style="padding: 15px 20px; font-size: 0.9rem; background: #eee; border: none; border-radius: 12px; font-weight: 800; color: #666; cursor: pointer;">
                                NO, QUIERO EDITAR
                            </button>
                        </div>
                    </div>
                `;
            }

            let emptyMessage = isLiveEvent ?
                'Generando emparejamientos...<br><span style="font-size:0.7rem; font-weight:400; opacity:0.6;">Aparecerán aquí en unos segundos.</span>' :
                'Selecciona una ronda válida...';

            return `
                <div class="tour-filter-bar" style="background:#F8F9FA; padding: 12px; overflow-x: auto;">
                   ${tabs}
                </div>
                <div class="tour-grid-container" style="padding: 16px; display: grid; gap: 16px; padding-bottom: 100px;">
                    ${roundData.matches.length ? '' : `<div style="color:#999; width:100%; text-align:center; padding:80px; font-weight:700; line-height:1.5;">${emptyMessage}</div>`}
                    ${roundData.matches.map(match => this.renderTournamentCard(match)).join('')}
                    ${nextRoundUI}
                </div>
            `;
        }

        renderRoundTabs(rounds, currentNum) {
            return `
                <div class="round-tabs-container" style="display:flex; gap:8px; align-items: center;">
                    ${rounds.map(r => {
                const isSel = parseInt(r.number) === parseInt(currentNum);
                return `
                        <button type="button" 
                                class="round-tab ${isSel ? 'active' : ''}" 
                                onclick="window.ControlTowerView.goToRound(${r.number}, event)"
                                style="background: ${isSel ? 'var(--playtomic-neon)' : '#222'}; 
                                       color: ${isSel ? 'black' : '#fff'}; 
                                       border: 1px solid ${isSel ? 'var(--playtomic-neon)' : '#444'};
                                       padding: 10px 18px; border-radius: 12px; font-weight: 900; cursor: pointer; transition: 0.3s; min-width: 60px;
                                       box-shadow: ${isSel ? '0 0 15px rgba(204,255,0,0.3)' : 'none'};">
                            ${r.number}º
                        </button>
                    `}).join('')}
                </div>
            `;
        }

        renderStandingsView() {
            if (!window.ControlTowerStandings) return '<div style="padding:40px; text-align:center;">Cargando...</div>';
            return window.ControlTowerStandings.render(this.allMatches, this.currentAmericanaDoc);
        }

        renderSummaryView() {
            if (!window.ControlTowerStats) return '<div style="padding:40px; text-align:center;">Cargando...</div>';
            return window.ControlTowerStats.render(this.allMatches, this.currentAmericanaDoc);
        }

        renderTournamentCard(match) {
            try {
                const isEntreno = this.currentAmericanaDoc?.isEntreno;
                const colorClass = `border-${(match.court % 4) + 1}`;

                // --- WOW STATUS VISUALS ---
                const evtStatus = this.currentAmericanaDoc?.status;
                const isLive = evtStatus === 'live' && !match.isFinished;
                const isPairing = evtStatus === 'pairing';

                let statusText = '<span style="color:#BBB;">ESPERANDO</span>';
                if (match.isFinished) {
                    statusText = '<span style="background: #25D366; color: white; padding: 4px 10px; border-radius: 12px; font-weight: 900; font-size: 0.6rem; letter-spacing: 0.5px;">FINALIZADO</span>';
                } else if (isLive) {
                    statusText = '<span class="status-badge-live">⚡ EN JUEGO</span>';
                } else if (isPairing) {
                    statusText = '<span style="background: #0ea5e9; color: white; padding: 4px 10px; border-radius: 12px; font-weight: 900; font-size: 0.6rem; letter-spacing: 0.5px;">PRÓXIMO</span>';
                }

                const sA = parseInt(match.score_a || 0);
                const sB = parseInt(match.score_b || 0);

                // --- 1. Calculate Time ---
                const timeLabel = (window.calculateMatchTime && typeof window.calculateMatchTime === 'function')
                    ? window.calculateMatchTime(this.currentAmericanaDoc?.time || "10:00", parseInt(match.round) || 1)
                    : "Seguido";

                // --- 2. Styles ---
                const winnerStyle = "color: #111 !important; font-weight: 950 !important; border-bottom: 3px solid #CCFF00; padding-bottom: 2px; text-decoration: none;";
                const normalStyle = "color: #111; font-weight: 800; padding: 6px 0;";
                const styleA = (match.isFinished && sA > sB) ? winnerStyle : normalStyle;
                const styleB = (match.isFinished && sB > sA) ? winnerStyle : normalStyle;

                // --- 3. Interaction Logic ---
                const user = window.Store ? window.Store.getState('currentUser') : null;
                const isRegisteredInEvent = this.currentAmericanaDoc && user && (
                    (this.currentAmericanaDoc.players || []).some(p => (p.id || p.uid) === user.uid) ||
                    (this.currentAmericanaDoc.registeredPlayers || []).includes(user.uid)
                );

                const getTeamName = (namesArr, teamStr) => {
                    if (teamStr && typeof teamStr === 'string' && teamStr.length > 0) return teamStr;
                    if (Array.isArray(namesArr)) return namesArr.join(' / ');
                    return String(namesArr || '');
                };

                const safeTeamA = getTeamName(match.team_a_names, match.teamA) || 'JUGADOR A';
                const safeTeamB = getTeamName(match.team_b_names, match.teamB) || 'JUGADOR B';

                const isPartA = user && (match.team_a_ids?.includes(user.uid) || safeTeamA.includes(user.name));
                const isPartB = user && (match.team_b_ids?.includes(user.uid) || safeTeamB.includes(user.name));
                const isAdmin = ['super_admin', 'superadmin', 'admin', 'admin_player', 'captain'].includes((user?.role || '').toLowerCase());

                // EDIT ALLOWED CHECK
                // EDIT ALLOWED CHECK (Relaxed for Usability)
                const canEdit = (this.currentAmericanaDoc?.status === 'live') && (user);

                let actionArea = '';

                if (canEdit) {
                    // UNIFIED SCORING INTERFACE (Numeric Steppers for ALL events)
                    // Previously Entrenos had binary buttons, now using Steppers as requested.
                    const stepperUI = `
                        <div style="display:flex; flex-direction:column; gap:10px; width:100%;">
                            <div style="display:flex; justify-content:space-between; align-items:center; background:#f9f9f9; padding:10px; border-radius:12px;">
                                <div style="display:flex; align-items:center; gap:8px;">
                                    <button onclick="window.ControlTowerView.adjustScore('${match.id}', 'score_a', -1)" style="width:30px; height:30px; border-radius:50%; border:1px solid #ddd; background:white; font-weight:900;">-</button>
                                    <span id="score-a-val-${match.id}" style="font-size:1.2rem; font-weight:900; width:30px; text-align:center;">${sA}</span>
                                    <button onclick="window.ControlTowerView.adjustScore('${match.id}', 'score_a', 1)" style="width:30px; height:30px; border-radius:50%; border:1px solid #ddd; background:#fff; color:#25D366; font-weight:900;">+</button>
                                </div>
                                <div style="font-weight:900; color:#ddd; font-size:1.2rem;">-</div>
                                <div style="display:flex; align-items:center; gap:8px;">
                                    <button onclick="window.ControlTowerView.adjustScore('${match.id}', 'score_b', -1)" style="width:30px; height:30px; border-radius:50%; border:1px solid #ddd; background:white; font-weight:900;">-</button>
                                    <span id="score-b-val-${match.id}" style="font-size:1.2rem; font-weight:900; width:30px; text-align:center;">${sB}</span>
                                    <button onclick="window.ControlTowerView.adjustScore('${match.id}', 'score_b', 1)" style="width:30px; height:30px; border-radius:50%; border:1px solid #ddd; background:#fff; color:#25D366; font-weight:900;">+</button>
                                </div>
                            </div>
                            <button onclick="window.ControlTowerView.finishMatch('${match.id}')" style="width:100%; padding:12px; background: #CCFF00; color:black; font-weight:900; border:none; border-radius:10px; box-shadow: 0 4px 10px rgba(204,255,0,0.3);">
                                ✅ CONFIRMAR RESULTADO
                            </button>
                        </div>
                    `;

                    if (match.isFinished) {
                        actionArea = `
                            <div style="margin-top: 10px; text-align: center;">
                                <div style="font-size:0.8rem; color:#888; margin-bottom:5px;">Resultado confirmado</div>
                                <button onclick="document.getElementById('edit-actions-${match.id}').style.display='flex'; this.style.display='none'" 
                                        style="background: transparent; border: 1px solid #ddd; color: #666; padding: 6px 12px; border-radius: 8px; font-size: 0.7rem; cursor: pointer;">
                                    ✏️ CORREGIR / EDITAR
                                </button>
                                <div id="edit-actions-${match.id}" style="display: none; margin-top: 10px;">
                                    ${stepperUI}
                                </div>
                            </div>
                        `;
                    } else {
                        actionArea = `<div style="margin-top:15px; padding-top:15px; border-top:1px dashed #eee;">${stepperUI}</div>`;
                    }
                }

                return `
                    <div id="tour-match-${match.id}" class="tour-match-card ${colorClass}" style="
                        background: var(--bg-card); 
                        border-radius: 28px; 
                        border: 1px solid var(--border-subtle); 
                        overflow: hidden; 
                        box-shadow: var(--shadow-md);
                        transition: all 0.3s ease;
                    ">
                        <div style="padding: 14px 20px; background: var(--brand-navy); display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 0.65rem; font-weight: 900; color: rgba(255,255,255,0.6); letter-spacing: 1.5px; text-transform: uppercase;">
                                <i class="fas fa-th-large" style="color: var(--brand-neon); margin-right: 6px;"></i> PISTA ${match.court} • P${match.round} • ${timeLabel}
                            </span>
                            <div class="status-area">${statusText}</div>
                        </div>
                        
                        <div style="padding: 24px;">
                            <div style="display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 15px; margin-bottom: 15px;">
                                <div id="match-name-a-${match.id}" style="font-size: 1rem; color: var(--text-primary); transition: all 0.3s; ${styleA}; display: flex; align-items: center; gap: 10px;">
                                    ${match.isFinished && sA > sB ? '<i class="fas fa-trophy" style="color: #CCFF00; font-size: 0.9rem;"></i>' : ''}
                                    ${safeTeamA}
                                </div>
                                <div id="match-score-a-${match.id}" style="
                                    background: ${match.isFinished && sA > sB ? 'var(--brand-neon)' : 'var(--bg-app)'}; 
                                    color: ${match.isFinished && sA > sB ? 'black' : 'var(--text-primary)'}; 
                                    width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; 
                                    font-weight: 950; font-size: 1.3rem; 
                                    box-shadow: ${match.isFinished && sA > sB ? 'var(--shadow-neon)' : 'inset 0 2px 4px rgba(0,0,0,0.05)'};
                                ">${sA}</div>
                            </div>
                            
                            <div style="height: 1px; background: var(--border-subtle); margin-bottom: 15px; position: relative;">
                                <div style="position: absolute; left: 0; top: -1px; width: 40px; height: 3px; background: var(--brand-neon); border-radius: 10px;"></div>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 15px;">
                                <div id="match-name-b-${match.id}" style="font-size: 1rem; color: var(--text-primary); transition: all 0.3s; ${styleB}; display: flex; align-items: center; gap: 10px;">
                                    ${match.isFinished && sB > sA ? '<i class="fas fa-trophy" style="color: #CCFF00; font-size: 0.9rem;"></i>' : ''}
                                    ${safeTeamB}
                                </div>
                                <div id="match-score-b-${match.id}" style="
                                    background: ${match.isFinished && sB > sA ? 'var(--brand-neon)' : 'var(--bg-app)'}; 
                                    color: ${match.isFinished && sB > sA ? 'black' : 'var(--text-primary)'}; 
                                    width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; 
                                    font-weight: 950; font-size: 1.3rem; 
                                    box-shadow: ${match.isFinished && sB > sA ? 'var(--shadow-neon)' : 'inset 0 2px 4px rgba(0,0,0,0.05)'};
                                ">${sB}</div>
                            </div>
                            
                            ${actionArea}
                        </div>
                    </div>
                `;
            } catch (err) {
                console.error("Match Render Error:", err, match);
                return `<div style="padding:20px; color:red; font-size:0.7rem;">Error al cargar tarjeta de partido: ${err.message}</div>`;
            }
        }

        async adjustScore(matchId, field, delta) {
            const isEntreno = this.currentAmericanaDoc?.isEntreno;
            const collection = isEntreno ? 'entrenos_matches' : 'matches';
            // Optimistic update supported by auto-re-render from onSnapshot listener
            const match = this.allMatches.find(m => m.id === matchId);
            if (!match) return;

            let currentVal = parseInt(match[field] || 0);
            let newVal = currentVal + delta;
            if (newVal < 0) newVal = 0;

            try {
                // Update specific field
                await window.db.collection(collection).doc(matchId).update({
                    [field]: newVal,
                    // Note: We don't finish match here, just track score
                });
            } catch (e) {
                console.error("Score update failed:", e);
            }
        }

        async finishMatch(matchId) {
            const isEntreno = this.currentAmericanaDoc?.isEntreno;
            const collection = isEntreno ? 'entrenos_matches' : 'matches';
            try {
                await window.db.collection(collection).doc(matchId).update({
                    status: 'finished'
                });
                console.log("Match finished:", matchId);
            } catch (e) {
                console.error("Finish match failed:", e);
            }
        }

        // KEEP LEGACY METHOD FOR ENTRENOS
        async setMatchWinner(matchId, winnerTeam, round) {
            const confirmMsg = "Confirmar resultado:\n\n" + (winnerTeam === 'A' ? "Gana Pareja 1" : "Gana Pareja 2");
            if (!confirm(confirmMsg)) return;

            const isEntreno = this.currentAmericanaDoc?.isEntreno;
            const collection = isEntreno ? 'entrenos_matches' : 'matches';

            try {
                await window.db.collection(collection).doc(matchId).update({
                    score_a: winnerTeam === 'A' ? 1 : 0,
                    score_b: winnerTeam === 'B' ? 1 : 0,
                    status: 'finished'
                });
                console.log(`✅ Match Result Saved.`);
            } catch (e) {
                console.error("Error setting match winner:", e);
                alert("Error al guardar resultado.");
            }
        }

        async triggerNextRound(round) {
            const isEntreno = this.currentAmericanaDoc?.isEntreno;
            const eventType = isEntreno ? 'entreno' : 'americana';
            const nextRound = round + 1;

            const nextRoundExists = this.allMatches.some(m => parseInt(m.round) === nextRound);

            let msg = "¿CONFIRMAR CAMBIO DE RONDA?\\n\\nAsegúrate de que todos los resultados sean correctos.";
            if (nextRoundExists) {
                msg = `⚠️ ATENCIÓN: LA RONDA ${nextRound} YA EXISTE\\n\\nAl confirmar, SE BORRARÁ la Ronda ${nextRound} actual y se regenerará con los nuevos resultados.\\n\\n¿Estás seguro de que deseas regenerar cruces?`;
            }

            if (!confirm(msg)) return;

            const btnContainer = document.getElementById('next-round-btn-container');
            if (btnContainer) btnContainer.innerHTML = '<div class="loader"></div>';

            try {
                if (nextRoundExists) {
                    console.log(`♻️ Regenerating Round ${nextRound}... deleting old matches.`);
                    await window.AmericanaService.deleteRound(this.currentAmericanaDoc.id, nextRound, eventType);
                }

                if (window.AmericanaService && window.AmericanaService.generateNextRound) {
                    await window.AmericanaService.generateNextRound(this.currentAmericanaDoc.id, round, eventType);
                } else if (window.AmericanaService && window.AmericanaService.generateEntrenoNextRound && isEntreno) {
                    await window.AmericanaService.generateEntrenoNextRound(this.currentAmericanaDoc.id, round);
                }

                // SUCCESS NOTIFICATION
                const toast = document.createElement('div');
                toast.innerHTML = `
                    <div style="background: #25D366; color: white; padding: 20px 40px; border-radius: 15px; box-shadow: 0 10px 40px rgba(0,0,0,0.5); display: flex; align-items: center; gap: 15px; border: 2px solid white;">
                        <span style="font-size: 2rem;">✅</span>
                        <div>
                            <h3 style="margin:0; font-weight: 900; font-size: 1.2rem;">RONDA ${nextRound} GENERADA</h3>
                            <p style="margin:5px 0 0 0; opacity: 0.9;">Los partidos están listos (0-0).</p>
                        </div>
                    </div>
                `;
                toast.style.cssText = "position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 9999; animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);";
                document.body.appendChild(toast);

                setTimeout(() => {
                    toast.style.opacity = '0';
                    toast.style.transform = 'translate(-50%, -60%)';
                    toast.style.transition = 'all 0.5s ease';
                    setTimeout(() => toast.remove(), 500);
                }, 2500);

            } catch (e) {
                console.error(e);
                alert("Error al generar ronda: " + e.message);
                this.recalc();
            }
        }

        renderReportView() {
            if (!window.ControlTowerReport) return '<div style="padding:40px; text-align:center;">Cargando...</div>';
            return window.ControlTowerReport.render(this.allMatches, this.currentAmericanaDoc);
        }

        renderHistoryContent() {
            return `
                    <h3 style="font-family:'Outfit'; font-weight: 950; color: #0f172a; margin: 0 0 20px 5px; font-size: 1.3rem; display: flex; align-items: center; gap: 10px;">
        <i class="fas fa-list-ul" style="color: #CCFF00; font-size: 1rem;"></i> CRONOLOGÍA HISTÓRICA
    </h3>

        <div style="display: grid; gap: 15px;">
            ${this.userHistory.length === 0 ? `
                            <div style="background: white; border-radius: 24px; padding: 60px 40px; text-align: center; border: 1px dashed #cbd5e1; color: #94a3b8;">
                                <i class="fas fa-ghost" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.3;"></i>
                                <p style="font-weight: 800; font-size: 1rem;">No tienes historial registrado</p>
                                <p style="font-size: 0.8rem; opacity: 0.7;">Tus Americanas aparecerán aquí al finalizar.</p>
                            </div>
                        ` :
                    this.userHistory.map(h => {
                        const amDate = h.date ? new Date(h.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Fecha desconocida';
                        return `
                            <div class="history-item-card" 
                                 onclick="window.ControlTowerView.load('${h.id}'); window.ControlTowerView.switchSection('playing');"
                                 style="
                                    background: white; 
                                    padding: 20px; 
                                    border: 1px solid #e2e8f0; 
                                    border-radius: 24px; 
                                    box-shadow: 0 4px 15px rgba(0,0,0,0.02);
                                    display: flex;
                                    justify-content: space-between;
                                    align-items: center;
                                    cursor: pointer;
                                    transition: all 0.2s;
                                 "
                                 onmouseover="this.style.transform='translateX(5px)'; this.style.borderColor='#CCFF00';"
                                 onmouseout="this.style.transform='none'; this.style.borderColor='#e2e8f0';"
                            >
                                <div>
                                    <div style="font-weight: 950; font-size: 1rem; color: #0f172a; margin-bottom: 3px;">${h.name.toUpperCase()}</div>
                                    <div style="display: flex; align-items: center; gap: 10px; font-size: 0.7rem; color: #64748b; font-weight: 700;">
                                        <span><i class="far fa-calendar-alt"></i> ${amDate}</span>
                                        <span style="opacity: 0.3;">|</span>
                                        <span style="color: #CCFF00; background: #000; padding: 1px 6px; border-radius: 4px; font-size: 0.6rem;">${(h.category || 'PRO').toUpperCase()}</span>
                                    </div>
                                </div>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <div style="text-align: right; margin-right: 10px;">
                                        <div style="font-size: 0.5rem; color: #94a3b8; font-weight: 900; text-transform: uppercase;">Ver stats</div>
                                        <i class="fas fa-chevron-right" style="color: #CCFF00; font-size: 0.8rem;"></i>
                                    </div>
                                </div>
                            </div>
                        `}).join('')}
        </div>
                </div >
        `;
        }

        renderHelpContent() {
            return `
        <div class="fade-in" style="padding: 25px; min-height: 80vh; background: #fff; padding-bottom: 120px; font-family: 'Inter', sans-serif;">
                    <div style="margin-bottom: 24px; border-bottom: 2px solid #CCFF00; padding-bottom: 15px; display: inline-block;">
                        <h2 style="font-family:'Outfit'; font-weight: 950; color: #111; font-size: 1.8rem; margin: 0; letter-spacing: -0.5px;">GUÍA DEL <span style="color: #0055ff;">JUGADOR</span></h2>
                    </div>

                    <p style="color: #666; font-size: 0.95rem; font-weight: 500; margin-bottom: 30px; line-height: 1.6;">Bienvenido a la plataforma oficial de <b>SomosPadel Barcelona</b>. Aquí tienes todo lo necesario para dominar nuestra tecnología y competición.</p>

                    <div style="display: grid; gap: 20px;">
                        
                        <!-- 1. FORMATOS -->
                        <div style="background: #f8fafc; padding: 25px; border-radius: 24px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                            <div style="font-weight: 900; margin-bottom: 15px; color: #7c3aed; font-size: 1.1rem; display: flex; align-items: center; gap: 12px;">
                                <div style="width: 36px; height: 36px; background: rgba(124,58,237,0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                                    <i class="fas fa-sitemap" style="font-size: 1rem;"></i>
                                </div>
                                Formatos de Competición
                            </div>
                            <div style="font-size: 0.9rem; color: #475569; line-height: 1.7; font-weight: 500;">
                                • <b style="color: #0ea5e9;">🌪️ TWISTER:</b> Formato rotativo. Cambias de pareja en cada una de las 6 rondas. Sumas tus juegos individuales para el ranking.
                                <br><br>
                                • <b style="color: #8b5cf6;">🔒 PAREJA FIJA:</b> Formato pozo. Juegas todo el evento con el mismo compañero. Subes de pista si ganas y bajas si pierdes.
                            </div>
                        </div>

                        <!-- 2. RANKING -->
                        <div style="background: #f8fafc; padding: 25px; border-radius: 24px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                            <div style="font-weight: 900; margin-bottom: 15px; color: #0055ff; font-size: 1.1rem; display: flex; align-items: center; gap: 12px;">
                                <div style="width: 36px; height: 36px; background: rgba(0,85,255,0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                                    <i class="fas fa-trophy" style="font-size: 1rem;"></i>
                                </div>
                                Sistema de Ranking (Puntos x Juego)
                            </div>
                            <div style="font-size: 0.9rem; color: #475569; line-height: 1.7; font-weight: 500;">
                                En SomosPadel cada bola cuenta. Sumas <b style="color: #0f172a;">1 punto por cada juego ganado</b>. 
                                <br><br>
                                Al final de las 6 rondas, el jugador con más juegos acumulados es nombrado <b>MVP</b>. Este sistema premia la regularidad y el esfuerzo en cada set.
                            </div>
                        </div>

                        <!-- 3. SEDES Y CLIMA -->
                        <div style="background: #f8fafc; padding: 25px; border-radius: 24px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                            <div style="font-weight: 900; margin-bottom: 15px; color: #10b981; font-size: 1.1rem; display: flex; align-items: center; gap: 12px;">
                                <div style="width: 36px; height: 36px; background: rgba(16,185,129,0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                                    <i class="fas fa-map-marker-alt" style="font-size: 1rem;"></i>
                                </div>
                                Sedes y Clima en Tiempo Real
                            </div>
                            <div style="font-size: 0.9rem; color: #475569; line-height: 1.7; font-weight: 500;">
                                Mantente informado sobre las condiciones exactas en nuestras dos sedes de Barcelona. El sistema monitoriza:
                                <br><br>
                                • <b>Estado de Pista:</b> Humedad y temperatura real en cada club para preveer el rebote.
                                <br>• <b>Velocidad de Bola:</b> Basada en la presión atmosférica local de la zona.
                                <br>• <b>Alertas Meteo:</b> Información actualizada para que tu experiencia de juego sea perfecta en cualquier sede.
                            </div>
                        </div>

                        <!-- 4. NIVELES -->
                        <div style="background: #f8fafc; padding: 25px; border-radius: 24px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                            <div style="font-weight: 900; margin-bottom: 15px; color: #f59e0b; font-size: 1.1rem; display: flex; align-items: center; gap: 12px;">
                                <div style="width: 36px; height: 36px; background: rgba(245,158,11,0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                                    <i class="fas fa-chart-line" style="font-size: 1rem;"></i>
                                </div>
                                Niveles Dinámicos
                            </div>
                            <div style="font-size: 0.9rem; color: #475569; line-height: 1.7; font-weight: 500;">
                                Tu nivel (0.0 a 7.0) evoluciona tras cada partido. El algoritmo recalcula tu progreso según:
                                <br><br>
                                • <b>Resultado:</b> Ganar sube tu nivel automáticamente.
                                <br>• <b>Nivel Rival:</b> Ganar a jugadores superiores te otorga más décimas.
                                <br>• <b>Regularidad:</b> Un historial sólido desbloquea eventos Élite.
                            </div>
                        </div>

                        <!-- 5. CONTROL TOWER -->
                        <div style="background: #f8fafc; padding: 25px; border-radius: 24px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                            <div style="font-weight: 900; margin-bottom: 15px; color: #ef4444; font-size: 1.1rem; display: flex; align-items: center; gap: 12px;">
                                <div style="width: 36px; height: 36px; background: rgba(239,68,68,0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                                    <i class="fas fa-broadcast-tower" style="font-size: 1rem;"></i>
                                </div>
                                Torre de Control (En Vivo)
                            </div>
                            <div style="font-size: 0.9rem; color: #475569; line-height: 1.7; font-weight: 500;">
                                Durante el evento, consulta tu pista, compañeros y clasificación en tiempo real. 
                                <br><br>
                                Al finalizar, accede al <b>Informe Detallado</b> para analizar tus métricas avanzadas y ver el resumen de la jornada.
                            </div>
                        </div>

                    </div>
                </div>
            `;
        }
    } // End of ControlTowerView class

    // Export class to global scope for fallback instantiation
    window.ControlTowerViewClass = ControlTowerView;
    window.ControlTowerView = new ControlTowerView();
    console.log("🗼 ControlTowerView (Pro) v4005 Initialized");
})();
