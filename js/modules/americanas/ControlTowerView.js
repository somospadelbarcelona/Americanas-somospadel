/**
 * ControlTowerView.js
 * The dedicated view for managing the live Americana.
 */
(function () {
    // --- GLOBAL DISPATCHER FOR SHARE BUTTONS ---
    window._matchRegistry = window._matchRegistry || {};
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
            this._recalcTimeout = null;
        }

        /**
         * System Cleanup: Essential for avoiding memory leaks (Audit Fix)
         */
        destroy() {
            console.log("🧹 [ControlTowerView] Cleaning up system resources...");
            if (this.unsubscribeMatches) this.unsubscribeMatches();
            if (this.unsubscribeEvent) this.unsubscribeEvent();
            if (this.autoStartInterval) clearInterval(this.autoStartInterval);
            if (this._recalcTimeout) clearTimeout(this._recalcTimeout);

            this.unsubscribeMatches = null;
            this.unsubscribeEvent = null;
            this.autoStartInterval = null;
            this._recalcTimeout = null;
        }

        debouncedRecalc() {
            if (this._recalcTimeout) clearTimeout(this._recalcTimeout);
            this._recalcTimeout = setTimeout(() => {
                this.recalc();
            }, 40); // 40ms batching window
        }

        goToRound(round, evt) {
            if (evt) evt.stopPropagation();
            this.selectedRound = round;

            // Auto-scroll to top to prevent visual gaps
            window.scrollTo({ top: 0, behavior: 'smooth' });

            this.recalc();
        }

        sendReaction(emoji) {
            if (window.navigator?.vibrate) window.navigator.vibrate(25);
            const el = document.createElement('div');
            el.innerText = emoji;
            const leftPos = Math.floor(Math.random() * 50) + 25;
            el.style.cssText = `
                position: fixed;
                bottom: 120px;
                left: ${leftPos}%;
                font-size: 2.5rem;
                z-index: 99999;
                pointer-events: none;
                animation: floatUpEmoji 1.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
            `;
            document.body.appendChild(el);
            setTimeout(() => el.remove(), 1300);

            const key = `sp_reactions_${this.currentAmericanaId || 'live'}_${emoji}`;
            const count = (parseInt(localStorage.getItem(key)) || 0) + 1;
            localStorage.setItem(key, count);
            const countEl = document.getElementById(`reaction-count-${encodeURIComponent(emoji)}`);
            if (countEl) countEl.innerText = count;
        }

        prepareLoad(id, type = null, action = null) {
            console.log("🚀 [ControlTowerView] Preparing to load:", id, "Type:", type, "Action:", action);
            this.pendingId = id;
            this.pendingType = type;
            this.pendingAction = action;
            // Force load immediately to ensure navigation works even if route "flash" happens
            if (id) this.load(id, type);
        }

        async handleLiveRoute() {
            if (this.pendingId) {
                await this.load(this.pendingId, this.pendingType);

                if (this.pendingAction === 'confirm_waitlist') {
                    if (window.EventsController) {
                        await window.EventsController.confirmWaitlist(this.pendingId, this.pendingType);
                    }
                }

                this.pendingId = null;
                this.pendingType = null;
                this.pendingAction = null;
            } else {
                this.loadLatest();
            }
        }

        async load(eventId, forceType = null) {
            this.currentAmericanaId = eventId;
            this.selectedRound = 1;
            this.mainSection = 'playing'; // Ensure we show the game area
            this._trainingFinishedShown = false; // Reset end-of-training modal flag

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

                    // 🔒 Verificación de Acceso a Americana Privada con Contraseña
                    if (this.currentAmericanaDoc.is_private === true || this.currentAmericanaDoc.is_private === 'true') {
                        let isUnlocked = false;
                        if (window.EventsController?.isAmericanaUnlocked) {
                            isUnlocked = window.EventsController.isAmericanaUnlocked(this.currentAmericanaDoc);
                        } else {
                            const user = (window.Store ? window.Store.getState('currentUser') : null) || JSON.parse(localStorage.getItem('currentUser') || localStorage.getItem('adminUser') || 'null');
                            const isAdmin = user && (['admin', 'super_admin', 'admin_player'].includes(user.role));
                            const isSavedUnlocked = (localStorage.getItem('unlocked_americana_' + eventId) === 'true');
                            const noPin = !this.currentAmericanaDoc.access_pin || !String(this.currentAmericanaDoc.access_pin).trim();
                            isUnlocked = isAdmin || isSavedUnlocked || noPin;
                        }

                        if (!isUnlocked) {
                            console.warn("🔒 [ControlTowerView] Acceso restringido a Americana Privada:", eventId);
                            this.renderPrivateLockScreen(this.currentAmericanaDoc);
                            return;
                        }
                    }

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
                        this.debouncedRecalc();
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
                            this.debouncedRecalc();
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

                    // --- DETECT NEW DRAW FOR ANIMATION (Improved for Sync) ---
                    if (this.allMatches.length > 0 && window.ShuffleAnimator && !this.isGeneratingRound) {
                        const maxRound = Math.max(...this.allMatches.map(m => parseInt(m.round)));
                        const isNewRoundDetected = !this._lastAnimatedRound || maxRound > this._lastAnimatedRound;

                        const isMainArea = this.mainSection === 'playing' && this.activeTab === 'results';
                        const currentMatches = this.allMatches.filter(m => parseInt(m.round) === maxRound);

                        // Check if it's really a new round with at least one match
                        if (isNewRoundDetected && currentMatches.length > 0 && isMainArea) {
                            // Debounce: Wait a bit for all matches of the round to arrive before animating
                            if (this._animTimeout) clearTimeout(this._animTimeout);
                            this._animTimeout = setTimeout(async () => {
                                // RE-FETCH to get latest matches after delay
                                const finalMatches = this.allMatches.filter(m => parseInt(m.round) === maxRound);
                                const isStillPending = finalMatches.every(m => !m.score_a && m.status !== 'finished');

                                if (isStillPending) {
                                    console.log(`🎬 [Tower] Auto-starting animation for Round ${maxRound}`);

                                    // CRITICAL: Fetch ALL player data for robust animation lookup
                                    let freshPlayers = [];
                                    try {
                                        console.log("📡 [Tower] Fetching comprehensive player pool for animation...");
                                        freshPlayers = await window.FirebaseDB.players.getAll();
                                        console.log(`✅ [Tower] Pool ready with ${freshPlayers.length} players.`);
                                    } catch (e) {
                                        console.warn("⚠️ [Tower] Could not fetch fresh players pool", e);
                                        freshPlayers = this.currentAmericanaDoc?.players || [];
                                    }

                                    this._lastAnimatedRound = maxRound;
                                    window.ShuffleAnimator.animate({
                                        round: maxRound,
                                        players: freshPlayers,
                                        courts: this.currentAmericanaDoc?.max_courts || 4,
                                        matches: finalMatches
                                    }, () => {
                                        // Auto-switch to the new round tab
                                        this.goToRound(maxRound);
                                    });
                                }
                            }, 1500);
                        }
                    }

                    this.debouncedRecalc();

                    // CHECK ROUND COMPLETION (Manual Advancement Prompt)
                    this.checkRoundCompletion(this.allMatches);

                }, err => {
                    console.error("Error watching matches:", err);
                });
        }

        checkRoundCompletion(matches) {
            if (!this.currentAmericanaDoc || matches.length === 0) return;

            // 1. Determine the Highest Round with matches
            const maxRound = Math.max(...matches.map(m => parseInt(m.round || 1)));

            // 2. Filter matches for this SPECIFIC max round
            const maxRoundMatches = matches.filter(m => parseInt(m.round) === maxRound);

            // 3. Check if ALL are finished in the highest round
            const allFinished = maxRoundMatches.length > 0 && maxRoundMatches.every(m => m.status === 'finished');

            // 4. Also check if the NEXT round already exists (if so, we don't need the prompt)
            const nextRound = maxRound + 1;
            const nextRoundExists = matches.some(m => parseInt(m.round) === nextRound);

            if (allFinished && !nextRoundExists) {
                // Check if already prompted/dismissed for this specific max round
                if (this.roundPromptDismissedFor === maxRound) return;

                // Check if Max Rounds reached
                const totalRounds = parseInt(this.currentAmericanaDoc.rounds_count || this.currentAmericanaDoc.rounds) || 6;
                if (maxRound >= totalRounds) {
                    // LAST ROUND COMPLETE → Show Final Training Results Modal
                    if (!this._trainingFinishedShown) {
                        this._trainingFinishedShown = true;
                        this.roundPromptDismissedFor = maxRound;
                        this.showTrainingFinishedModal(maxRound);
                    }
                    return;
                }

                // SHOW PROMPT for the current completed round
                this.showRoundFinishedModal(maxRound);
            } else {
                // Reset dismissal if round is no longer finished or if we have moved on
                if (!allFinished || nextRoundExists) {
                    this.roundPromptDismissedFor = null;
                    this.closeRoundFinishedModal();
                }
            }
        }

        showRoundFinishedModal(round) {
            window.EventModals.showRoundFinishedModal(
                round,
                this.currentAmericanaDoc,
                async () => {
                    const isEntreno = this.currentAmericanaDoc?.isEntreno;
                    if (window.AmericanaService) {
                        try {
                            await window.AmericanaService.generateNextRound(this.currentAmericanaDoc.id, round, isEntreno ? 'entreno' : 'americana');
                            window.EventModals.closeRoundFinishedModal();
                            this.roundPromptDismissedFor = null;
                        } catch (e) {
                            window.PremiumModal.alert({ title: "❌ ERROR", message: e.message, type: 'error' });
                        }
                    }
                },
                () => { this.roundPromptDismissedFor = round; }
            );
        }

        closeRoundFinishedModal() {
            if (window.EventModals?.closeRoundFinishedModal) {
                window.EventModals.closeRoundFinishedModal();
            }
        }

        showTrainingFinishedModal(finalRound) {
            if (!window.EventModals?.showTrainingFinishedModal) {
                console.warn("⚠️ EventModals.showTrainingFinishedModal no está disponible.");
                return;
            }

            window.EventModals.showTrainingFinishedModal(
                finalRound,
                this.allMatches,
                this.currentAmericanaDoc,
                null, // Permitir que el modal gestione sus botones de WhatsApp e Instagram con imagen HD
                (tab) => {
                    this.mainSection = 'playing';
                    this.switchTab(tab);
                    document.getElementById('training-finished-modal')?.remove();
                },
                () => {
                    document.getElementById('training-finished-modal')?.remove();
                    window.Router?.navigate ? window.Router.navigate('dashboard') : (window.location.hash = '#dashboard');
                }
            );
        }

        openEventSummaryFlyer() {
            const maxRound = (this.allMatches && this.allMatches.length > 0)
                ? Math.max(...this.allMatches.map(m => parseInt(m.round || 1)))
                : (this.currentRound || 1);
            this.showTrainingFinishedModal(maxRound);
        }

        async loadHistory() {
            const user = window.Store ? window.Store.getState('currentUser') : null;
            if (!user) return;

            try {
                const currentYear = new Date().getFullYear();
                console.log(`📊 [Tower] Loading History for year: ${currentYear}`);

                // 1. SMART ID RESOLUTION
                // Use all identities linked to this user (Admin + Player)
                const idsToSearch = (user.mergedIds && user.mergedIds.length > 0) ? user.mergedIds : [user.uid];
                console.log(`🔗 [Tower] Searching history for IDs: ${idsToSearch.join(', ')}`);

                // 2. FETCH MATCHES (using the Robust 'getByPlayer' we built)
                // We fetch matches for ALL IDs and deduplicate them.
                const matchPromises = idsToSearch.map(id => window.FirebaseDB.matches.getByPlayer(id));
                const resultsNested = await Promise.all(matchPromises);
                // Deduplicate matches by ID
                const uniqueMatches = new Map();
                resultsNested.flat().forEach(m => uniqueMatches.set(m.id, m));

                const parseSafeDate = (dateStr) => {
                    if (!dateStr) return null;
                    if (dateStr instanceof Date) return dateStr;
                    if (typeof dateStr !== 'string') return new Date(dateStr);
                    if (dateStr.includes('/')) {
                        const parts = dateStr.split('/');
                        if (parts.length === 3) return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                    }
                    return new Date(dateStr);
                };

                this.userMatches = Array.from(uniqueMatches.values()).filter(m => {
                    const d = parseSafeDate(m.date);
                    // Filter for matches from Late 2025 (Nov/Dec) or 2026
                    if (!d) return false;
                    const year = d.getFullYear();
                    const month = d.getMonth(); // 0-indexed
                    return (year === 2026) || (year === 2025 && month >= 10);
                });

                // 3. CALCULATE STATS
                let g = 0;
                let w = 0;
                let l = 0;
                const uniqueEvents = new Set();

                const myName = (user.name || '').toLowerCase();

                this.userMatches.forEach(m => {
                    if (m.status === 'cancelled' || m.cancelled === true) return;

                    const sA = parseInt(m.score_a || 0);
                    const sB = parseInt(m.score_b || 0);

                    if (sA + sB > 0) {
                        let isTeamA = false;
                        let isTeamB = false;

                        // Check by ID
                        if (m.team_a_ids && idsToSearch.some(id => m.team_a_ids.includes(id))) isTeamA = true;
                        if (m.team_b_ids && idsToSearch.some(id => m.team_b_ids.includes(id))) isTeamB = true;

                        // Check by Name Fallback (If ID fails)
                        if (!isTeamA && !isTeamB && myName) {
                            const checkName = (names) => names && String(names).toLowerCase().includes(myName);
                            if (checkName(m.team_a_names) || checkName(m.player1_name) || checkName(m.p1_name)) isTeamA = true;
                            else if (checkName(m.team_b_names) || checkName(m.player3_name) || checkName(m.p3_name)) isTeamB = true;
                        }

                        if (isTeamA || isTeamB) {
                            if (m.americana_id) uniqueEvents.add(m.americana_id);
                            else if (m.id.includes('_m_')) uniqueEvents.add(m.id.split('_m_')[0]);

                            if (isTeamA) {
                                g += sA;
                                if (sA > sB) w++;
                                else if (sA < sB) l++;
                            } else {
                                g += sB;
                                if (sB > sA) w++;
                                else if (sB < sA) l++;
                            }
                        }
                    }
                });

                // STRICT COUNTING: Only count events derived from real matches found
                const eventCount = uniqueEvents.size;

                this.userStats = {
                    games: g,
                    wins: w,
                    losses: l,
                    events: eventCount
                };

                // Populate userHistory array for the list view
                // We map from uniqueEvents to dummy objects if we don't have full event data, 
                // or we rely on the matches having 'americana_name' / 'eventName'
                this.userHistory = this.userMatches.reduce((acc, m) => {
                    const evtId = m.americana_id || (m.id.includes('_m_') ? m.id.split('_m_')[0] : 'unknown');
                    if (!acc.find(e => e.id === evtId)) {
                        acc.push({
                            id: evtId,
                            name: m.eventName || m.americana_name || "Evento",
                            date: m.date,
                            category: "PRO"
                        });
                    }
                    return acc;
                }, []);

                console.log(`✅ [Tower] History Loaded: ${this.userStats.games} games, ${this.userStats.events} events.`);
                this.debouncedRecalc();

            } catch (e) {
                console.error("History fail:", e);
                this.userStats = { games: 0, wins: 0, losses: 0, events: 0 };
                this.debouncedRecalc();
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
                        isFinished: m.status === 'finished' || m.status === 'finalizado',
                        isLive: (m.status === 'live' || m.status === 'en juego'),
                        level_avg: m.level_avg || '3.5',
                        ...m
                    };
                }).sort((a, b) => a.court - b.court)
            };

            const maxMatchRound = this.allMatches.length > 0
                ? Math.max(...this.allMatches.map(m => parseInt(m.round || 1)))
                : 1;
            const configRounds = parseInt(this.currentAmericanaDoc?.rounds_count || this.currentAmericanaDoc?.rounds) || 6;
            const roundsLimit = Math.max(maxMatchRound, configRounds);

            const roundsSchedule = Array.from({ length: roundsLimit }, (_, i) => ({ number: i + 1 }));

            this.render({
                currentRound: roundData,
                roundsSchedule: roundsSchedule,
                isLive: this.currentAmericanaDoc?.status === 'live'
            });
        }

        switchTab(tab) {
            if (tab === 'summary' || tab === 'stats') {
                this.activeTab = 'resumen';
                this.recalc();
                return;
            }
            if (tab === 'brackets') {
                this.activeTab = 'standings';
                this.recalc();
                setTimeout(() => {
                    const bracketsEl = document.getElementById('sp-standings-brackets');
                    if (bracketsEl) {
                        bracketsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }, 120);
                return;
            }
            this.activeTab = tab;
            this.recalc();
        }

        setTab(tab) {
            this.switchTab(tab);
        }

        async switchSection(section) {
            this.mainSection = section;
            if (section === 'history') await this.loadHistory();
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
                <div class="tournament-layout fade-in" style="background: #ffffff; color: #0a192f;">
                    
                    <div style="background: rgba(255, 255, 255, 0.98); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); padding: 7px 12px; display: flex; justify-content: center; gap: 8px; border-bottom: 1px solid #e2e8f0; position: sticky; top: 0; z-index: 1002; box-shadow: 0 4px 20px rgba(0,0,0,0.03); height: 48px; box-sizing: border-box;">
                        <button type="button" onclick="window.ControlTowerView.switchSection('playing')" 
                                style="flex: 1; border: 1px solid ${this.mainSection === 'playing' ? '#0f172a' : '#e2e8f0'}; background: ${this.mainSection === 'playing' ? '#0f172a' : '#f8fafc'}; color: ${this.mainSection === 'playing' ? '#ffffff' : '#64748b'}; padding: 0 6px; border-radius: 12px; font-weight: 950; font-size: 0.68rem; transition: all 0.25s; text-transform: uppercase; letter-spacing: 0.8px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
                            <i class="fas fa-play-circle" style="${this.mainSection === 'playing' ? 'color: #ccff00;' : ''}"></i>
                            <span>EN JUEGO</span>
                        </button>
                        <button type="button" onclick="window.ControlTowerView.switchSection('history')" 
                                style="flex: 1; border: 1px solid ${this.mainSection === 'history' ? '#0f172a' : '#e2e8f0'}; background: ${this.mainSection === 'history' ? '#0f172a' : '#f8fafc'}; color: ${this.mainSection === 'history' ? '#ffffff' : '#64748b'}; padding: 0 6px; border-radius: 12px; font-weight: 950; font-size: 0.68rem; transition: all 0.25s; text-transform: uppercase; letter-spacing: 0.8px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
                            <i class="fas fa-history" style="${this.mainSection === 'history' ? 'color: #38bdf8;' : ''}"></i>
                            <span>MI PASADO</span>
                        </button>
                        <button type="button" onclick="window.ControlTowerView.switchSection('help')" 
                                style="flex: 1; border: 1px solid ${this.mainSection === 'help' ? '#0f172a' : '#e2e8f0'}; background: ${this.mainSection === 'help' ? '#0f172a' : '#f8fafc'}; color: ${this.mainSection === 'help' ? '#ffffff' : '#64748b'}; padding: 0 6px; border-radius: 12px; font-weight: 950; font-size: 0.68rem; transition: all 0.25s; text-transform: uppercase; letter-spacing: 0.8px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
                            <i class="fas fa-info-circle" style="${this.mainSection === 'help' ? 'color: #fbbf24;' : ''}"></i>
                            <span>INFO</span>
                        </button>
                    </div>

                    ${this.renderMainArea(data, isPlayingHere)}
                </div>
            `;

            // --- RPG RADAR CHART INIT ---
            if (this.mainSection === 'history') {
                setTimeout(() => this.initRadarChart(user), 100);
            }
            if (this.mainSection === 'help') {
                setTimeout(() => this.initHelpGuide(), 50);
            }


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

            const roundData = data?.currentRound || { matches: [] };
            const isLive = this.currentAmericanaDoc?.status === 'live';

            return `
                ${window.EventHeader.render(this.currentAmericanaDoc, {
                activeTab: this.activeTab,
                isPlayingHere,
                theme: {
                    grad: 'linear-gradient(135deg, #CCFF00 0%, #00E36D 100%)',
                    accent: '#CCFF00',
                    text: '#000'
                }
            })}
                ${this.renderActiveContent(data, roundData)}
            `;
        }

        renderActiveContent(data, roundData) {
            if (data?.status === 'LOADING') {
                return `
                    <div style="padding: 15px;">
                        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 24px; padding: 28px; text-align: center; color: white; margin-bottom: 15px; border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
                            <i class="fas fa-trophy fa-spin" style="font-size: 2.2rem; color: #CCFF00; margin-bottom: 12px;"></i>
                            <h4 style="margin: 0 0 6px 0; font-size: 1.1rem; font-weight: 900; color: #ffffff;">Sincronizando Torre de Control...</h4>
                            <p style="margin: 0; font-size: 0.82rem; color: #94a3b8;">Cargando clasificación y resultados en tiempo real</p>
                        </div>
                    </div>`;
            }

            switch (this.activeTab) {
                case 'live_feed': return this.renderLiveFeedView();
                case 'standings':
                case 'brackets': return this.renderStandingsView();
                case 'resumen':
                case 'summary':
                case 'stats':
                    return this.renderEventSummaryView();
                case 'report': return this.renderReportView();
                default:
                case 'results': return this.renderResultsView(roundData, data?.roundsSchedule || [], data?.isLive);
            }
        }

        smartUpdateResults(roundData, allRounds) {
            const grid = document.querySelector('.tour-grid-container');
            if (!grid) return false;

            // 1. Update Round Tabs
            const filterBar = document.querySelector('.tour-filter-bar');
            if (filterBar) {
                // Detect Round Change -> If round changed, force full render to prevent stale prompts
                const activeTab = filterBar.querySelector('.round-tab.active');
                // Extract the round number from the button's text, e.g., "1º" -> 1
                const lastRoundInUI = activeTab ? parseInt(activeTab.innerText.replace('º', '')) : -1;
                if (lastRoundInUI !== roundData.number) {
                    console.log("[SmartUpdate] Round change detected. Forcing full render.");
                    return false;
                }

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
                const cardId = `card-${match.id}`;
                let el = document.getElementById(cardId);

                if (el) {
                    const isFinished = match.status === 'finished' || match.status === 'finalizado';
                    const hasEditControls = !!el.querySelector(`button[onclick*="adjustScore"]`);
                    const hasUnlockBtn = !!el.querySelector(`button[onclick*="unlockMatch"]`);

                    // Si el estado del partido cambió entre finalizado y editable, re-renderizamos la tarjeta completa
                    if ((isFinished && !hasUnlockBtn) || (!isFinished && !hasEditControls)) {
                        el.outerHTML = this.renderTournamentCard(match);
                        return;
                    }

                    // --- UPDATE EXISTING CARD ---
                    // 1. Status Badge & Card Container Styles
                    const statusArea = el.querySelector('.status-area');
                    const evtStatus = this.currentAmericanaDoc?.status;
                    const isLive = evtStatus === 'live' && !isFinished;

                    // SYNC CARD CONTAINER STYLES (Zero-Latency)
                    let cardStyle = 'border: 1px solid #e2e8f0; opacity: 1; filter: none; transform: none;';
                    let cardBg = '#ffffff';
                    const user = window.Store ? window.Store.getState('currentUser') : null;
                    const uid = user ? user.uid : '-';
                    const isMyMatch = (match.team_a_ids || []).includes(uid) || (match.team_b_ids || []).includes(uid);

                    if (isFinished) {
                        cardStyle = 'border: 1px solid #e2e8f0; z-index: 1;';
                        cardBg = '#fafcff';
                    } else if (isMyMatch && isLive) {
                        cardStyle = 'border: 2px solid #72a800; box-shadow: 0 8px 30px rgba(114, 168, 0, 0.15); z-index: 10;';
                        cardBg = 'linear-gradient(180deg, #fafef5 0%, #ffffff 40px)';
                    }
                    el.style.cssText += cardStyle;
                    el.style.background = cardBg;

                    const newStatusHTML = isFinished ?
                        '<div style="display:inline-flex; align-items:center; gap:5px; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 3px 9px; border-radius: 20px;"><span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#10b981;"></span><span style="color: #065f46; font-weight: 950; font-size: 0.6rem; letter-spacing: 0.5px; text-transform:uppercase;">CONFIRMADO</span></div>' :
                        (isLive ? '<div style="display:inline-flex; align-items:center; gap:5px; background: rgba(34, 197, 94, 0.12); border: 1px solid rgba(34, 197, 94, 0.35); padding: 3px 9px; border-radius: 20px;"><span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#22c55e; animation: livePulseDot 1.5s infinite;"></span><span style="color: #15803d; font-weight: 950; font-size: 0.6rem; letter-spacing: 0.5px; text-transform:uppercase;">EN JUEGO</span></div>' : '<div style="display:inline-flex; align-items:center; gap:4px; background: #f1f5f9; border: 1px solid #e2e8f0; padding: 3px 9px; border-radius: 20px;"><span style="color: #64748b; font-weight: 900; font-size: 0.6rem; letter-spacing: 0.5px;">PROGRAMADO</span></div>');

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
                        const winStyle = "color: #111 !important; font-weight: 950 !important; border-bottom: 4px solid #CCFF00; padding-bottom: 2px; text-decoration: none; display: flex; align-items: center; gap: 10px; text-shadow: 0 0 10px rgba(204,255,0,0.2);";
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

                        // ACTION AREA SYNC: If it just finished, we might need a full re-render of this card's internals
                        // to show the "Share" button instead of the "+/-" controls.
                        // For simplicity, if isFinished and doesn't have the share button, we return false to trigger full render of this view.
                        if (!el.querySelector('.fa-instagram')) return false;
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
            const allCards = Array.from(grid.querySelectorAll('.match-card'));
            allCards.forEach(card => {
                // Extract ID from e.g. "card-abc1234"
                const id = card.id.replace('card-', '');
                if (!validIds.has(id)) {
                    console.log("[SmartUpdate] Removing stale card:", id);
                    card.remove();
                }
            });

            // 4. SYNC ROUND CONTROL TOOLBAR
            const existingToolbar = document.getElementById('round-control-toolbar');
            if (existingToolbar) {
                existingToolbar.outerHTML = this.renderRoundControlToolbar(roundData, this.roundsData || []);
            } else {
                return false;
            }

            return true;
        }

        renderResultsView(roundData, allRounds, isLiveEvent = false) {
            const tabs = this.renderRoundTabs(allRounds, roundData.number);
            const user = window.Store ? window.Store.getState('currentUser') : null;
            const isAdmin = ['super_admin', 'superadmin', 'admin', 'admin_player', 'captain', 'capitan', 'capitanes', 'organizador', 'organizadores'].includes((user?.role || '').toLowerCase());
            const hasMatches = roundData?.matches && roundData.matches.length > 0;

            const emptyStateMarkup = `
                <div class="animate-pop-in" style="background: #ffffff; border: 1.5px dashed #cbd5e1; border-radius: 22px; padding: 42px 20px; text-align: center; margin: 8px 0 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.02);">
                    <div style="width: 68px; height: 68px; border-radius: 50%; background: #f8fafc; border: 1.5px solid #e2e8f0; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 14px; box-shadow: 0 8px 24px rgba(0,0,0,0.05);">
                        <i class="fas fa-tennis-ball" style="font-size: 1.8rem; color: #72a800;"></i>
                    </div>
                    <h3 style="font-family: 'Outfit', sans-serif; font-weight: 1000; font-size: 1.25rem; color: #0f172a; margin: 0 0 6px 0; letter-spacing: -0.3px;">
                        Ronda ${roundData.number || 1} en Espera
                    </h3>
                    <p style="font-size: 0.8rem; color: #64748b; margin: 0 auto 18px; max-width: 320px; line-height: 1.5; font-weight: 600;">
                        ${isLiveEvent ? 'Generando emparejamientos y asignando pistas en tiempo real...' : 'Los cruces de esta ronda se generarán automáticamente al cerrar la ronda anterior o cuando el organizador active el sorteo.'}
                    </p>
                    ${isAdmin ? `
                        <button type="button" onclick="window.ControlTowerView.regenerateCurrentRound(${roundData.number || 1})"
                                style="background: linear-gradient(135deg, #72a800 0%, #00e36d 100%); color: #000000; border: none; padding: 12px 22px; border-radius: 14px; font-weight: 1000; font-size: 0.8rem; cursor: pointer; box-shadow: 0 6px 20px rgba(114, 168, 0, 0.28); display: inline-flex; align-items: center; gap: 8px; transition: transform 0.15s;">
                            <i class="fas fa-random"></i>
                            <span>GENERAR CRUCES RONDA ${roundData.number || 1}</span>
                        </button>
                    ` : ''}
                </div>
            `;

            return `
                <div class="tour-filter-bar" style="position: sticky; top: 96px; z-index: 1000; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px); padding: 8px 14px; display: flex; align-items: center; justify-content: space-between; gap: 10px; border-bottom: 1px solid rgba(0,0,0,0.06); box-shadow: 0 2px 12px rgba(0,0,0,0.02);">
                   <div style="flex: 1; overflow-x: auto; display: flex; align-items: center; scrollbar-width: none; -ms-overflow-style: none;">
                       <style>
                           .tour-filter-bar div::-webkit-scrollbar { display: none; }
                           @keyframes scorePing {
                               0% { transform: scale(1); box-shadow: 0 0 0 rgba(204,255,0,0.5); }
                               50% { transform: scale(1.1); box-shadow: 0 0 25px rgba(204,255,0,0.8); }
                               100% { transform: scale(1); box-shadow: 0 0 0 rgba(204,255,0,0); }
                           }
                           .score-updated-ping { animation: scorePing 0.5s ease-out; }
                           
                           @keyframes pulseLive {
                               0% { transform: scale(1); opacity: 1; }
                               50% { transform: scale(1.4); opacity: 0.5; }
                               100% { transform: scale(1); opacity: 1; }
                           }
                           .live-pulse-dot { width: 7px; height: 7px; background: #00E36D; border-radius: 50%; display: inline-block; margin-right: 6px; animation: pulseLive 2s infinite; }
                       </style>
                       ${tabs}
                   </div>
                   <div style="display:flex; align-items:center; gap:6px; flex-shrink: 0;">
                       <button type="button" onclick="window.ControlTowerView ? window.ControlTowerView.openEventSummaryFlyer() : null"
                               title="Ver flyer de clasificación para compartir en WhatsApp o Instagram"
                               style="background: #0f172a; color: #CCFF00; border: 1px solid rgba(204, 255, 0, 0.45); padding: 4px 10px; border-radius: 20px; font-size: 0.64rem; font-weight: 900; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; transition: all 0.2s; box-shadow: 0 2px 8px rgba(0,0,0,0.18);">
                           <i class="fas fa-trophy" style="color: #CCFF00; font-size: 0.68rem;"></i>
                           <span>FLYER</span>
                       </button>
                       <span style="font-size: 0.62rem; color: #15803d; font-weight: 900; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 4px 9px; border-radius: 20px; display: flex; align-items: center;">
                           <span class="live-pulse-dot"></span> EN VIVO
                       </span>
                   </div>
                </div>
                <div class="tour-grid-container" style="padding: 14px 14px; display: grid; gap: 12px; padding-bottom: calc(140px + env(safe-area-inset-bottom, 24px));">
                    ${hasMatches ? '' : emptyStateMarkup}
                    ${roundData.matches.map(match => this.renderTournamentCard(match)).join('')}
                    ${this.renderRoundControlToolbar(roundData, allRounds)}
                </div>
            `;
        }

        renderRoundControlToolbar(roundData, allRounds) {
            const user = window.Store ? window.Store.getState('currentUser') : null;
            const isAdmin = ['super_admin', 'superadmin', 'admin', 'admin_player', 'captain', 'capitan', 'capitanes', 'organizador', 'organizadores'].includes((user?.role || '').toLowerCase());

            const roundNum = parseInt(roundData?.number || 1);
            const matches = roundData?.matches || [];
            const totalMatches = matches.length;

            const isFinishedMatch = m => m.status === 'finished' || m.status === 'finalizado' || m.isFinished === true;
            const finishedMatches = matches.filter(isFinishedMatch);
            const finishedCount = finishedMatches.length;
            const isRoundComplete = totalMatches > 0 && finishedCount === totalMatches;
            const progressPct = totalMatches > 0 ? Math.round((finishedCount / totalMatches) * 100) : 0;

            const maxRound = this.allMatches.length > 0 ? Math.max(...this.allMatches.map(m => parseInt(m.round || 1))) : 1;
            const isPastRound = roundNum < maxRound;

            const totalRoundsPlanned = parseInt(this.currentAmericanaDoc?.total_rounds || this.currentAmericanaDoc?.max_rounds || 6);
            const isLastPlannedRound = roundNum >= totalRoundsPlanned;

            return `
                <div id="round-control-toolbar" class="animate-pop-in" 
                     style="margin-top: 18px; margin-bottom: 24px; background: #ffffff; padding: 18px 18px; border-radius: 20px; border: 1px solid #e2e8f0; box-shadow: 0 8px 25px rgba(0,0,0,0.04);">
                    ${isPastRound ? `
                        <!-- MODO RONDA ANTERIOR / CORRECCIÓN -->
                        <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 16px; border-bottom: 1px solid #fee2e2; padding-bottom: 12px;">
                            <div style="flex: 1;">
                                <div style="font-weight: 950; color: #e11d48; font-size: 0.9rem; display: flex; align-items: center; gap: 8px;">
                                    <span>⚠️</span> MODO CORRECCIÓN (RONDA ${roundNum})
                                </div>
                                <div style="font-size: 0.75rem; color: #64748b; margin-top: 4px; line-height: 1.4;">
                                    Estás en una ronda previa. La ronda más avanzada en juego es la <b>Ronda ${maxRound}</b>.<br>
                                    Si necesitas corregir marcadores de la Ronda ${roundNum}, puedes reiniciar desde aquí.
                                </div>
                            </div>
                            <span style="background: #fff1f2; color: #e11d48; border: 1px solid #fecdd3; padding: 4px 9px; border-radius: 10px; font-weight: 950; font-size: 0.62rem; white-space: nowrap;">
                                R${roundNum} / R${maxRound}
                            </span>
                        </div>

                        <div style="display: flex; flex-direction: column; gap: 10px;">
                            <button type="button" onclick="window.ControlTowerView.rollbackTournament(${roundNum})"
                                    class="btn-primary-pro"
                                    style="padding: 14px 18px; font-size: 0.88rem; background: #e11d48; color: white; border: none; border-radius: 14px; font-weight: 950; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 6px 20px rgba(225, 29, 72, 0.22); cursor: pointer;">
                                🔄 REINICIAR Y CORREGIR DESDE RONDA ${roundNum}
                            </button>
                            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                                <button type="button" onclick="window.ControlTowerView.unlockRoundMatches(${roundNum})"
                                        style="flex: 1; min-width: 150px; padding: 10px 14px; font-size: 0.76rem; background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; border-radius: 12px; font-weight: 900; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
                                    🔓 Desbloquear Marcadores
                                </button>
                                <button type="button" onclick="window.ControlTowerView.goToRound(${maxRound})"
                                        style="flex: 1; min-width: 150px; padding: 10px 14px; font-size: 0.76rem; background: #f8fafc; color: #334155; border: 1px solid #cbd5e1; border-radius: 12px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
                                    ➡️ Volver a Ronda ${maxRound}
                                </button>
                            </div>
                        </div>
                    ` : `
                        <!-- MODO RONDA ACTIVA / MÁS RECIENTE -->
                        <div style="margin-bottom: 14px; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px;">
                            <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px;">
                                <div>
                                    <div style="font-weight: 1000; color: #0a192f; font-size: 0.9rem; display: flex; align-items: center; gap: 6px;">
                                        <span>${isRoundComplete ? '🏁' : '🎾'}</span>
                                        <span>RONDA ${roundNum} ${isRoundComplete ? 'COMPLETADA' : (totalMatches === 0 ? 'EN ESPERA' : 'EN JUEGO')}</span>
                                    </div>
                                    <div style="font-size: 0.74rem; color: #64748b; margin-top: 3px;">
                                        ${totalMatches === 0 
                                            ? 'Cruces pendientes de sorteo o asignación de pista.'
                                            : (isRoundComplete 
                                                ? '¡Todos los partidos confirmados!' 
                                                : `Progreso: <b>${finishedCount} de ${totalMatches}</b> pistas cerradas (${progressPct}%).`)}
                                    </div>
                                </div>
                                <span style="background: ${isRoundComplete ? '#ecfdf5' : (totalMatches === 0 ? '#f1f5f9' : '#f0fdf4')}; color: ${isRoundComplete ? '#059669' : (totalMatches === 0 ? '#64748b' : '#166534')}; border: 1px solid ${isRoundComplete ? '#a7f3d0' : '#e2e8f0'}; padding: 4px 10px; border-radius: 12px; font-weight: 950; font-size: 0.64rem;">
                                    ${isRoundComplete ? 'LISTA PARA AVANZAR' : (totalMatches === 0 ? 'PENDIENTE' : `${finishedCount}/${totalMatches} CONFIRMADAS`)}
                                </span>
                            </div>

                            ${totalMatches > 0 ? `
                                <!-- Visual Progress Bar -->
                                <div style="width: 100%; height: 6px; background: #f1f5f9; border-radius: 10px; overflow: hidden; margin-top: 10px;">
                                    <div style="width: ${progressPct}%; height: 100%; background: linear-gradient(90deg, #72a800, #00e36d); border-radius: 10px; transition: width 0.4s ease;"></div>
                                </div>
                            ` : ''}
                        </div>

                        <div style="display: flex; flex-direction: column; gap: 10px;">
                            ${totalMatches === 0 ? `
                                <!-- CASO 0 PARTIDOS: BOTÓN DIRECTO DE SORTEO -->
                                ${isAdmin ? `
                                    <button type="button" onclick="window.ControlTowerView.regenerateCurrentRound(${roundNum})"
                                            class="btn-primary-pro"
                                            style="padding: 14px 20px; font-size: 0.88rem; background: linear-gradient(135deg, #72a800 0%, #00e36d 100%); color: #000000; border: none; border-radius: 14px; font-weight: 1000; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 6px 20px rgba(114, 168, 0, 0.28); cursor: pointer;">
                                        <i class="fas fa-random"></i>
                                        <span>SORTEAR Y GENERAR PISTAS DE RONDA ${roundNum}</span>
                                    </button>
                                ` : `
                                    <div style="text-align:center; padding: 6px; font-size: 0.72rem; color: #94a3b8; font-weight: 700;">
                                        Esperando activación de la ronda por el organizador...
                                    </div>
                                `}
                            ` : isRoundComplete ? `
                                <!-- AVANCE DE RONDA / FINALIZACIÓN -->
                                ${isLastPlannedRound ? `
                                    <button type="button" id="btn-finish-and-standings" 
                                            onclick="event.stopPropagation(); window.ControlTowerView.finishTournament();"
                                            class="btn-primary-pro"
                                            style="padding: 16px 22px; font-size: 0.96rem; background: linear-gradient(135deg, #CCFF00 0%, #00e36d 100%); color: #000000; border: none; border-radius: 16px; font-weight: 1000; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 8px 25px rgba(204, 255, 0, 0.35); cursor: pointer; transition: transform 0.15s ease;">
                                        🏆 FINALIZAR EVENTO Y VER CLASIFICACIÓN
                                    </button>
                                    <button type="button" onclick="window.ControlTowerView.triggerNextRound(${roundNum})"
                                            style="padding: 11px 16px; font-size: 0.8rem; background: #f8fafc; color: #334155; border: 1px solid #cbd5e1; border-radius: 12px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
                                        ➕ Añadir Ronda Extra (Ronda ${roundNum + 1})
                                    </button>
                                ` : `
                                    <button type="button" onclick="window.ControlTowerView.triggerNextRound(${roundNum})"
                                            class="btn-primary-pro"
                                            style="padding: 15px 22px; font-size: 0.95rem; background: linear-gradient(135deg, #72a800 0%, #00e36d 100%); color: #000000; border: none; border-radius: 16px; font-weight: 1000; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 8px 25px rgba(114, 168, 0, 0.32); cursor: pointer;">
                                        🚀 GENERAR SIGUIENTE RONDA (RONDA ${roundNum + 1})
                                    </button>
                                `}

                                <!-- OPCIONES DE EDICIÓN IN SITU -->
                                <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 2px;">
                                    <button type="button" onclick="window.ControlTowerView.unlockRoundMatches(${roundNum})"
                                            style="flex: 1; min-width: 150px; padding: 10px 14px; font-size: 0.76rem; background: #f8fafc; color: #0284c7; border: 1px solid #bae6fd; border-radius: 12px; font-weight: 900; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
                                        ✏️ Corregir Marcadores R${roundNum}
                                    </button>
                                    <button type="button" onclick="window.ControlTowerView.regenerateCurrentRound(${roundNum})"
                                            style="flex: 1; min-width: 150px; padding: 10px 14px; font-size: 0.76rem; background: #fffbeb; color: #d97706; border: 1px solid #fde68a; border-radius: 12px; font-weight: 900; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
                                        🎲 Regenerar Cruces R${roundNum}
                                    </button>
                                </div>
                            ` : `
                                <!-- RONDA EN CURSO (INCOMPLETA) -->
                                ${finishedCount < totalMatches ? `
                                    <button type="button" onclick="window.ControlTowerView.finalizeAllRoundMatches(${roundNum})"
                                            style="padding: 13px 18px; font-size: 0.85rem; background: #f0fdf4; color: #166534; border: 1px solid #86efac; border-radius: 14px; font-weight: 1000; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 14px rgba(22, 101, 52, 0.08);">
                                        ✓ CONFIRMAR TODOS LOS RESULTADOS (${finishedCount}/${totalMatches})
                                    </button>
                                ` : ''}

                                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                                    <button type="button" onclick="window.ControlTowerView.unlockRoundMatches(${roundNum})"
                                            style="flex: 1; min-width: 150px; padding: 10px 14px; font-size: 0.76rem; background: #f8fafc; color: #0284c7; border: 1px solid #bae6fd; border-radius: 12px; font-weight: 900; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
                                        🔓 Desbloquear Marcadores
                                    </button>
                                    <button type="button" onclick="window.ControlTowerView.regenerateCurrentRound(${roundNum})"
                                            style="flex: 1; min-width: 150px; padding: 10px 14px; font-size: 0.76rem; background: #fffbeb; color: #d97706; border: 1px solid #fde68a; border-radius: 12px; font-weight: 900; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
                                        🎲 Regenerar Cruces
                                    </button>
                                </div>

                                ${isAdmin ? `
                                    <button type="button" onclick="window.ControlTowerView.triggerNextRound(${roundNum}, true)"
                                            style="padding: 9px 14px; font-size: 0.72rem; background: transparent; color: #64748b; border: 1px dashed #cbd5e1; border-radius: 12px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
                                        ⏩ Forzar Siguiente Ronda (${roundNum + 1}) sin completar
                                    </button>
                                ` : ''}
                            `}
                        </div>
                    `}
                </div>
            `;
        }

        renderRoundTabs(rounds, currentNum) {
            return window.EventHeader.renderRoundTabs(rounds, currentNum, this.currentAmericanaDoc, this.allMatches);
        }

        renderStandingsView() {
            if (!window.ControlTowerStandings) return '<div style="padding:40px; text-align:center;">Cargando...</div>';
            return `<div style="padding-bottom: calc(140px + env(safe-area-inset-bottom, 24px));">${window.ControlTowerStandings.render(this.allMatches, this.currentAmericanaDoc)}</div>`;
        }

        renderBracketsView() {
            if (!window.ControlTowerBrackets) return '<div style="padding:40px; text-align:center; color:white;">Cargando cuadros...</div>';
            return `<div style="padding-bottom: calc(140px + env(safe-area-inset-bottom, 24px));">${window.ControlTowerBrackets.render(this.allMatches, this.currentAmericanaDoc)}</div>`;
        }

        renderEventSummaryView() {
            if (!window.ControlTowerSummary) return '<div style="padding:40px; text-align:center;">Cargando resumen...</div>';
            return `<div style="padding-bottom: calc(140px + env(safe-area-inset-bottom, 24px));">${window.ControlTowerSummary.render(this.allMatches, this.currentAmericanaDoc)}</div>`;
        }

        renderSummaryView() {
            return this.renderEventSummaryView();
        }

        renderLiveFeedView() {
            const matches = this.allMatches || [];
            const isEntreno = !!this.currentAmericanaDoc?.isEntreno;
            const maxRound = matches.length > 0 ? Math.max(...matches.map(m => parseInt(m.round || 1))) : 1;
            const currentRoundMatches = matches.filter(m => parseInt(m.round) === maxRound).sort((a, b) => a.court - b.court);

            // Calcular estadísticas flash en vivo
            const finishedMatches = matches.filter(m => m.status === 'finished' || m.status === 'finalizado');
            const totalGamesPlayed = finishedMatches.reduce((acc, m) => acc + (parseInt(m.score_a || 0) + parseInt(m.score_b || 0)), 0);
            const liveMatches = currentRoundMatches.filter(m => m.status !== 'finished' && m.status !== 'finalizado');

            // Reacciones
            const reactions = [
                { emoji: '🔥', label: '¡Fuego!' },
                { emoji: '👏', label: '¡Bravo!' },
                { emoji: '🏆', label: '¡Vamos!' },
                { emoji: '⚡', label: '¡Puntazo!' }
            ];

            return `
                <div class="live-feed-container fade-in" style="padding: 14px 16px; padding-bottom: calc(145px + env(safe-area-inset-bottom, 24px)); display: flex; flex-direction: column; gap: 16px;">
                    <style>
                        @keyframes floatUpEmoji {
                            0% { transform: translateY(0) scale(0.8); opacity: 1; }
                            50% { transform: translateY(-70px) scale(1.3); opacity: 0.95; }
                            100% { transform: translateY(-150px) scale(1.6); opacity: 0; }
                        }
                    </style>
                    
                    <!-- 1. BROADCAST HERO BANNER -->
                    <div style="background: linear-gradient(135deg, #090d16 0%, #111827 100%); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 20px; padding: 18px; color: white; position: relative; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.3);">
                        <div style="position: absolute; top: -30px; right: -30px; width: 140px; height: 140px; background: radial-gradient(circle, rgba(239, 68, 68, 0.25) 0%, rgba(239, 68, 68, 0) 70%); pointer-events: none;"></div>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="display: inline-flex; align-items: center; gap: 6px; background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.4); padding: 4px 10px; border-radius: 20px; font-size: 0.65rem; font-weight: 950; color: #f87171; text-transform: uppercase; letter-spacing: 0.8px;">
                                    <span style="width: 7px; height: 7px; border-radius: 50%; background: #ef4444; animation: livePulseDot 1.4s infinite;"></span>
                                    CENTRO EN VIVO
                                </span>
                                <span style="font-size: 0.72rem; color: #94a3b8; font-weight: 800;">RONDA ${maxRound}</span>
                            </div>

                            <button type="button" onclick="window.openTVMode('${this.currentAmericanaId}', '${isEntreno ? 'entreno' : 'americana'}')"
                                    title="Abrir vista completa para TV del club"
                                    style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(8px); border: 1px solid rgba(255, 255, 255, 0.2); color: #ffffff; padding: 6px 12px; border-radius: 12px; font-weight: 950; font-size: 0.68rem; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: transform 0.2s;"
                                    onmouseover="this.style.transform='scale(1.05)'"
                                    onmouseout="this.style.transform='scale(1)'">
                                <i class="fas fa-tv" style="color: #4ade80;"></i>
                                <span>MODO TV PANTALLA COMPLETA</span>
                            </button>
                        </div>

                        <!-- Mini stats bar -->
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 14px; background: rgba(255, 255, 255, 0.04); border-radius: 14px; padding: 10px; border: 1px solid rgba(255, 255, 255, 0.06);">
                            <div style="text-align: center;">
                                <div style="font-size: 0.6rem; color: #94a3b8; font-weight: 800; text-transform: uppercase;">Pistas en Vivo</div>
                                <div style="font-size: 1.15rem; font-weight: 1000; color: #22c55e;">${liveMatches.length}</div>
                            </div>
                            <div style="text-align: center; border-left: 1px solid rgba(255,255,255,0.08); border-right: 1px solid rgba(255,255,255,0.08);">
                                <div style="font-size: 0.6rem; color: #94a3b8; font-weight: 800; text-transform: uppercase;">Finalizados</div>
                                <div style="font-size: 1.15rem; font-weight: 1000; color: #ffffff;">${finishedMatches.length}</div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 0.6rem; color: #94a3b8; font-weight: 800; text-transform: uppercase;">Juegos Hoy</div>
                                <div style="font-size: 1.15rem; font-weight: 1000; color: #CCFF00;">${totalGamesPlayed}</div>
                            </div>
                        </div>
                    </div>

                    <!-- 2. LIVE FAN CHEERING (REACCIONES CON EFECTO FLOTANTE) -->
                    <div style="background: #ffffff; border-radius: 18px; padding: 14px 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <span style="font-size: 0.68rem; font-weight: 950; color: #0a192f; text-transform: uppercase; letter-spacing: 0.8px;">
                                <i class="fas fa-heart" style="color: #ef4444; margin-right: 4px;"></i> ÁNIMOS Y REACCIONES EN PISTA
                            </span>
                            <span style="font-size: 0.6rem; color: #64748b; font-weight: 800;">¡PULSA PARA ANIMAR!</span>
                        </div>
                        <div style="display: flex; gap: 8px; justify-content: space-between;">
                            ${reactions.map(r => {
                                const key = `sp_reactions_${this.currentAmericanaId || 'live'}_${r.emoji}`;
                                const count = parseInt(localStorage.getItem(key) || 0);
                                return `
                                    <button type="button" 
                                            onclick="window.ControlTowerView.sendReaction('${r.emoji}')"
                                            style="flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 10px 4px; display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: pointer; transition: all 0.2s;"
                                            onmouseover="this.style.transform='scale(1.06)'; this.style.borderColor='#CCFF00';"
                                            onmouseout="this.style.transform='scale(1)'; this.style.borderColor='#e2e8f0';"
                                            onmousedown="this.style.transform='scale(0.92)'">
                                        <span style="font-size: 1.4rem; line-height: 1;">${r.emoji}</span>
                                        <span id="reaction-count-${encodeURIComponent(r.emoji)}" style="font-size: 0.65rem; font-weight: 950; color: #0f172a;">${count}</span>
                                    </button>
                                `;
                            }).join('')}
                        </div>
                    </div>

                    <!-- 3. RADAR DE PISTAS DE LA RONDA ACTUAL -->
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0 4px;">
                            <span style="font-size: 0.72rem; font-weight: 950; color: #0f172a; text-transform: uppercase; letter-spacing: 0.8px;">
                                <i class="fas fa-table-tennis-paddle-ball" style="color: #72a800; margin-right: 4px;"></i> PISTAS DE LA RONDA ${maxRound}
                            </span>
                            <span style="font-size: 0.65rem; color: #64748b; font-weight: 800;">${currentRoundMatches.length} pistas en total</span>
                        </div>

                        ${currentRoundMatches.length === 0 ? `
                            <div style="background: #f8fafc; border-radius: 16px; padding: 30px; text-align: center; border: 1px dashed #cbd5e1; color: #64748b;">
                                <i class="fas fa-hourglass-half" style="font-size: 1.8rem; color: #94a3b8; margin-bottom: 8px;"></i>
                                <div style="font-weight: 900; font-size: 0.85rem; color: #0f172a;">Ronda pendiente de inicio</div>
                                <div style="font-size: 0.72rem; margin-top: 4px;">Los cruces aparecerán aquí tan pronto como comience el juego.</div>
                            </div>
                        ` : `
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 10px;">
                                ${currentRoundMatches.map(m => {
                                    const teamA = Array.isArray(m.team_a_names) ? m.team_a_names.join(' / ') : (m.teamA || 'Equipo A');
                                    const teamB = Array.isArray(m.team_b_names) ? m.team_b_names.join(' / ') : (m.teamB || 'Equipo B');
                                    const sA = parseInt(m.score_a || 0);
                                    const sB = parseInt(m.score_b || 0);
                                    const isDone = m.status === 'finished' || m.status === 'finalizado';

                                    return `
                                        <div style="background: #ffffff; border-radius: 16px; border: ${isDone ? '1px solid #e2e8f0' : '2px solid #22c55e'}; padding: 12px 14px; box-shadow: 0 4px 14px rgba(0,0,0,0.03); position: relative;">
                                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                                <span style="font-size: 0.65rem; font-weight: 950; background: #0f172a; color: #ffffff; padding: 3px 8px; border-radius: 8px; text-transform: uppercase;">
                                                    PISTA ${m.court}
                                                </span>
                                                <span style="font-size: 0.6rem; font-weight: 900; color: ${isDone ? '#059669' : '#15803d'}; background: ${isDone ? '#ecfdf5' : 'rgba(34, 197, 94, 0.12)'}; padding: 3px 8px; border-radius: 12px;">
                                                    ${isDone ? '✓ FINALIZADO' : '⚡ EN JUEGO'}
                                                </span>
                                            </div>

                                            <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                                                <div style="flex: 1; display: flex; flex-direction: column; gap: 4px; min-width: 0;">
                                                    <div style="font-size: 0.78rem; font-weight: ${sA > sB && isDone ? '1000' : '800'}; color: ${sA > sB && isDone ? '#0f172a' : '#334155'}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                                        ${sA > sB && isDone ? '🏆 ' : ''}${teamA}
                                                    </div>
                                                    <div style="font-size: 0.78rem; font-weight: ${sB > sA && isDone ? '1000' : '800'}; color: ${sB > sA && isDone ? '#0f172a' : '#334155'}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                                        ${sB > sA && isDone ? '🏆 ' : ''}${teamB}
                                                    </div>
                                                </div>

                                                <div style="display: flex; align-items: center; gap: 6px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 6px 12px;">
                                                    <span style="font-size: 1.15rem; font-weight: 1000; color: ${sA > sB ? '#059669' : '#0f172a'};">${sA}</span>
                                                    <span style="font-size: 0.75rem; color: #94a3b8; font-weight: 800;">-</span>
                                                    <span style="font-size: 1.15rem; font-weight: 1000; color: ${sB > sA ? '#059669' : '#0f172a'};">${sB}</span>
                                                </div>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        `}
                    </div>

                    <!-- 4. TIMELINE MINUTO A MINUTO (CRÓNICA EN DIRECTO) -->
                    <div style="background: #ffffff; border-radius: 18px; padding: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px;">
                            <span style="font-size: 0.72rem; font-weight: 950; color: #0f172a; text-transform: uppercase; letter-spacing: 0.8px;">
                                <i class="fas fa-clock" style="color: #0284c7; margin-right: 4px;"></i> MINUTO A MINUTO
                            </span>
                            <span style="font-size: 0.62rem; color: #059669; font-weight: 900; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 2px 8px; border-radius: 10px;">
                                ACTUALIZACIÓN EN VIVO
                            </span>
                        </div>

                        <div style="display: flex; flex-direction: column; gap: 14px; position: relative; padding-left: 18px; border-left: 2px solid #e2e8f0;">
                            ${finishedMatches.length > 0 ? finishedMatches.slice(-5).reverse().map(m => {
                                const teamA = Array.isArray(m.team_a_names) ? m.team_a_names.join(' / ') : (m.teamA || 'Equipo A');
                                const teamB = Array.isArray(m.team_b_names) ? m.team_b_names.join(' / ') : (m.teamB || 'Equipo B');
                                const sA = parseInt(m.score_a || 0);
                                const sB = parseInt(m.score_b || 0);
                                const winnerName = sA > sB ? teamA : (sB > sA ? teamB : null);

                                return `
                                    <div style="position: relative;">
                                        <div style="position: absolute; left: -24px; top: 2px; width: 10px; height: 10px; border-radius: 50%; background: #059669; border: 2px solid #ffffff; box-shadow: 0 0 6px #059669;"></div>
                                        <div style="font-size: 0.65rem; color: #64748b; font-weight: 800;">RONDA ${m.round} • PISTA ${m.court}</div>
                                        <div style="font-size: 0.78rem; font-weight: 900; color: #0f172a; margin-top: 2px;">
                                            ${winnerName ? `Victoria de <b>${winnerName}</b> (${sA} - ${sB})` : `Empate ${sA} - ${sB}`}
                                        </div>
                                    </div>
                                `;
                            }).join('') : ''}

                            <div style="position: relative;">
                                <div style="position: absolute; left: -24px; top: 2px; width: 10px; height: 10px; border-radius: 50%; background: #3b82f6; border: 2px solid #ffffff;"></div>
                                <div style="font-size: 0.65rem; color: #64748b; font-weight: 800;">ARRANQUE OFICIAL</div>
                                <div style="font-size: 0.78rem; font-weight: 800; color: #0f172a; margin-top: 2px;">
                                    Silbato de inicio: Torneo y pistas activas en SomosPadel Barcelona.
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            `;
        }

        renderTournamentCard(match, options = {}) {
            const user = window.Store ? window.Store.getState('currentUser') : null;
            return window.MatchCard.render(match, {
                ...options,
                currentUser: user,
                isEntreno: this.currentAmericanaDoc?.isEntreno,
                eventStatus: this.currentAmericanaDoc?.status,
                isControlTower: true,
                canEdit: true,
                canUnlock: true,
                theme: {
                    grad: 'linear-gradient(135deg, #CCFF00 0%, #00E36D 100%)',
                    accent: '#CCFF00',
                    text: '#000'
                }
            });
        }

        async adjustScore(matchId, field, delta) {
            // Find the match in local state
            const match = this.allMatches.find(m => m.id === matchId);
            if (!match) return;

            // 1. UPDATE LOCAL STATE (Optimistic)
            const currentVal = parseInt(match[field] || 0);
            const newVal = Math.max(0, currentVal + delta);
            match[field] = newVal;

            // 2a. LIVE TIE-WARNING UPDATE (Entreno only — instant DOM feedback)
            if (this.currentAmericanaDoc?.isEntreno) {
                const updatedSA = parseInt(match.score_a || 0);
                const updatedSB = parseInt(match.score_b || 0);
                const isTie = updatedSA === updatedSB;
                const tieDiv = document.getElementById(`tie-warning-${matchId}`);
                const finishBtn = document.getElementById(`finish-btn-${matchId}`);
                if (tieDiv) tieDiv.style.display = isTie && (updatedSA > 0 || updatedSB > 0) ? 'flex' : 'none';
                if (finishBtn) {
                    finishBtn.style.background = isTie ? 'rgba(255,160,0,0.2)' : 'var(--brand-neon)';
                    finishBtn.style.color = isTie ? '#FFA000' : 'black';
                    finishBtn.style.border = isTie ? '2px solid rgba(255,160,0,0.5)' : 'none';
                    finishBtn.style.boxShadow = isTie ? 'none' : '0 10px 25px rgba(204,255,0,0.3)';
                    finishBtn.innerHTML = `<i class="fas ${isTie ? 'fa-exclamation-triangle' : 'fa-check-circle'}" style="font-size:1.2rem;margin-right:10px;"></i>${isTie ? 'EMPATE — CORRIGE EL MARCADOR' : 'FINALIZAR PARTIDO'}`;
                }
            }

            // 2b. DOM DIRECT UPDATE (Massive Performance Boost with Odometer)
            const sA = parseInt(match.score_a || 0);
            const sB = parseInt(match.score_b || 0);

            if (window.MatchCard && window.MatchCard.updateOdometer) {
                window.MatchCard.updateOdometer(matchId, 'a', sA, sA > sB);
                window.MatchCard.updateOdometer(matchId, 'b', sB, sB > sA);
            }

            // Sync the tiny labels in the edit area if they exist
            const lblSmallA = document.getElementById(`score-a-val-${matchId}`);
            if (lblSmallA) lblSmallA.innerText = sA;
            const lblSmallB = document.getElementById(`score-b-val-${matchId}`);
            if (lblSmallB) lblSmallB.innerText = sB;


            // 3. HAPTIC FEEDBACK
            if (window.navigator?.vibrate) window.navigator.vibrate(20);

            // 4. DEBOUNCED PERSIST TO FIREBASE (Stops HTTP 429 & UI Blocking)
            const isEntreno = this.currentAmericanaDoc?.isEntreno;
            const collection = isEntreno ? 'entrenos_matches' : 'matches';

            if (!window._scoreDebounceMap) window._scoreDebounceMap = {};
            const debounceKey = `${matchId}_${field}`;

            if (window._scoreDebounceMap[debounceKey]) {
                clearTimeout(window._scoreDebounceMap[debounceKey]);
            }

            window._scoreDebounceMap[debounceKey] = setTimeout(async () => {
                try {
                    await window.db.collection(collection).doc(matchId).update({
                        [field]: newVal
                    });
                    console.log(`✅ Score synced (debounced): ${field} = ${newVal}`);
                } catch (e) {
                    console.error("❌ Firebase debounced update failed:", e);
                    window.PremiumModal.alert({
                        title: "❌ ERROR AL GUARDAR",
                        message: e.message.includes('permission') ? "No tienes permisos para editar." : e.message,
                        type: 'error'
                    });
                }
            }, 800);
        }

        async manualScoreEdit(matchId, field) {
            const match = this.allMatches.find(m => m.id === matchId);
            if (!match) return;

            const user = window.Store ? window.Store.getState('currentUser') : null;
            const isAdmin = ['super_admin', 'superadmin', 'admin', 'admin_player', 'captain'].includes((user?.role || '').toLowerCase());

            // Check if restricted (Optional: add extra safety if needed)

            const currentVal = parseInt(match[field] || 0);
            const teamLabel = field === 'score_a' ? 'EQUIPO ARRIBA' : 'EQUIPO ABAJO';

            const options = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(v => ({
                id: v,
                name: String(v),
                sub: v === currentVal ? 'ACTUAL' : ''
            }));

            const selected = await window.PremiumModal.selector({
                title: `MARCADOR - ${teamLabel}`,
                message: `Puntuación actual: ${currentVal}`,
                items: options,
                type: 'primary'
            });

            if (selected !== null && selected !== undefined) {
                const val = (typeof selected === 'object') ? selected.id : selected;

                // If match is finished, check for confirmation
                if (match.status === 'finished' || match.status === 'finalizado') {
                    const confirmed = await window.PremiumModal.confirm({
                        title: "⚠️ PARTIDO FINALIZADO",
                        message: "¿Deseas corregir el marcador de este partido ya terminado? Esto sincronizará el resultado y avisará al sistema.",
                        confirmText: "CORREGIR",
                        cancelText: "CANCELAR"
                    });
                    if (!confirmed) return;
                }

                // Call adjustScore with a direct set logic (we can modify adjustScore or do direct update)
                // For directness:
                const diff = val - currentVal;
                if (diff !== 0) {
                    await this.adjustScore(matchId, field, diff);
                }
            }
        }

        async finishMatch(matchId) {
            const confirmed = await window.PremiumModal.confirm({
                title: "🏁 FINALIZAR PARTIDO",
                message: "¿Deseas cerrar este partido con el resultado actual? Esta acción actualizará los niveles de los jugadores.",
                confirmText: "SÍ, FINALIZAR",
                cancelText: "CANCELAR"
            });

            if (!confirmed) return;

            const isEntreno = this.currentAmericanaDoc?.isEntreno;
            const collection = isEntreno ? 'entrenos_matches' : 'matches';

            // ⛔ ANTI-EMPATE: En entrenos no se permiten empates (bloquean la lógica de avance)
            if (isEntreno) {
                const match = this.allMatches.find(m => m.id === matchId);
                if (match) {
                    const sA = parseInt(match.score_a || 0);
                    const sB = parseInt(match.score_b || 0);
                    if (sA === sB) {
                        if (window.navigator?.vibrate) window.navigator.vibrate([100, 50, 100]);
                        window.PremiumModal.alert({
                            title: '⚠️ EMPATE NO PERMITIDO',
                            message: `El resultado está igualado (${sA}-${sB}). En los entrenos debe haber un ganador claro. Ajusta el marcador antes de finalizar.`,
                            type: 'warning'
                        });
                        return; // Block finalization
                    }
                }
            }

            // Haptic feedback
            if (window.navigator?.vibrate) window.navigator.vibrate([30, 50, 30]);

            // OPTIMISTIC UI: Instant visual feedback to the user before Firebase responds
            const matchCardEl = document.getElementById(`card-${matchId}`);
            if (matchCardEl) {
                matchCardEl.style.transition = 'all 0.25s ease-out';
                matchCardEl.style.opacity = '0.85';
                matchCardEl.style.pointerEvents = 'none'; // Lock interaction momentarily
            }

            try {
                const match = this.allMatches.find(m => m.id === matchId);
                const sA = parseInt(match?.score_a || 0);
                const sB = parseInt(match?.score_b || 0);

                await window.db.collection(collection).doc(matchId).update({
                    status: 'finished',
                    score_a: sA,
                    score_b: sB
                });
                if (match) {
                    match.status = 'finished';
                    match.score_a = sA;
                    match.score_b = sB;
                }
                if (matchCardEl) {
                    matchCardEl.style.pointerEvents = '';
                }
                console.log("Match finished:", matchId);

                // 🎊 CONFETTI FEEDBACK (Punto 6)
                if (window.confetti) {
                    window.confetti({
                        particleCount: 150,
                        spread: 70,
                        origin: { y: 0.6 },
                        colors: ['#CCFF00', '#00E36D', '#ffffff']
                    });
                }

                if (window.LevelService) {
                    if (match) {
                        const updatedMatch = { ...match, status: 'finished', score_a: sA, score_b: sB };
                        window.LevelService.processMatchResult(updatedMatch, isEntreno ? 'entreno' : 'americana');
                    }
                }
                // Reemplazo instantáneo de la tarjeta en el DOM con la vista finalizada
                if (matchCardEl && match) {
                    matchCardEl.outerHTML = this.renderTournamentCard(match);
                }
                this.recalc();
            } catch (e) {
                console.error("Finish match failed:", e);
                if (matchCardEl) {
                    matchCardEl.style.pointerEvents = '';
                }
            }
        }


        async rollbackTournament(fromRound) {
            const confirmed = await window.PremiumModal.confirm({
                title: "⚠️ REINICIAR TORNEO",
                message: `¿Estás SEGURO de querer reiniciar desde la RONDA ${fromRound}?<br><br>Se BORRARÁN todos los partidos de la Ronda ${fromRound + 1} en adelante y se desbloqueará la Ronda ${fromRound} para corregir sus resultados. Esta acción no se puede deshacer.`,
                confirmText: "SÍ, REINICIAR",
                cancelText: "CANCELAR",
                type: 'danger'
            });

            if (!confirmed) return;

            const isEntreno = this.currentAmericanaDoc?.isEntreno;
            const type = isEntreno ? 'entreno' : 'americana';
            const eventId = this.currentAmericanaDoc?.id;

            try {
                // 1. Purge all subsequent rounds
                const nextRound = fromRound + 1;
                const maxR = Math.max(...this.allMatches.map(m => parseInt(m.round) || 1));

                for (let r = nextRound; r <= maxR; r++) {
                    console.log(`🗑️ Purging round ${r}...`);
                    await window.AmericanaService.deleteRound(eventId, r, type);
                }

                // 2. Unlock current round matches
                const currentMatches = this.allMatches.filter(m => parseInt(m.round) === fromRound);
                const collection = isEntreno ? 'entrenos_matches' : 'matches';

                const batch = window.db.batch();
                currentMatches.forEach(m => {
                    batch.update(window.db.collection(collection).doc(m.id), { status: 'live' });
                    m.status = 'live';
                    m.isFinished = false;
                });
                await batch.commit();

                // 3. Update main tournament document to live and current_round = fromRound
                const eventCol = isEntreno ? 'entrenos' : 'americanas';
                await window.db.collection(eventCol).doc(eventId).update({
                    current_round: fromRound,
                    status: 'live'
                });
                if (this.currentAmericanaDoc) {
                    this.currentAmericanaDoc.current_round = fromRound;
                    this.currentAmericanaDoc.status = 'live';
                }

                window.PremiumModal.alert({
                    title: "✅ TORNEO REINICIADO",
                    message: `Se han eliminado las rondas posteriores. Ahora puedes corregir los resultados de la Ronda ${fromRound} y generar la siguiente cuando estés listo.`,
                    type: 'success'
                });

                this.goToRound(fromRound);
            } catch (e) {
                console.error("Rollback failed:", e);
                window.PremiumModal.alert({
                    title: "❌ ERROR AL REINICIAR",
                    message: e.message,
                    type: 'error'
                });
            }
        }

        async unlockRoundMatches(roundNum) {
            const confirmed = await window.PremiumModal.confirm({
                title: `🔓 DESBLOQUEAR RONDA ${roundNum}`,
                message: `¿Deseas desbloquear todos los partidos de la <b>Ronda ${roundNum}</b>?<br><br>Podrás ajustar los tanteos directamente en cada tarjeta.`,
                confirmText: "SÍ, DESBLOQUEAR",
                cancelText: "CANCELAR"
            });
            if (!confirmed) return;

            const isEntreno = this.currentAmericanaDoc?.isEntreno;
            const collection = isEntreno ? 'entrenos_matches' : 'matches';
            const roundMatches = this.allMatches.filter(m => parseInt(m.round) === roundNum);

            try {
                const batch = window.db.batch();
                roundMatches.forEach(m => {
                    batch.update(window.db.collection(collection).doc(m.id), { status: 'live' });
                    m.status = 'live';
                    m.isFinished = false;
                });
                await batch.commit();

                // Asegurar que el evento esté en live
                const eventCol = isEntreno ? 'entrenos' : 'americanas';
                await window.db.collection(eventCol).doc(this.currentAmericanaDoc.id).update({
                    status: 'live'
                });
                if (this.currentAmericanaDoc) {
                    this.currentAmericanaDoc.status = 'live';
                }

                // Reemplazar inmediatamente cada tarjeta en el DOM con sus controles de tanteo
                roundMatches.forEach(m => {
                    const cardEl = document.getElementById(`card-${m.id}`);
                    if (cardEl) {
                        cardEl.outerHTML = this.renderTournamentCard(m);
                    }
                });

                window.PremiumModal.alert({
                    title: "✅ MARCADORES DESBLOQUEADOS",
                    message: `Ya puedes modificar los resultados de la Ronda ${roundNum}. Cuando termines, confirma cada partido o pulsa 'Confirmar todos los resultados'.`,
                    type: 'success'
                });
                this.recalc();
            } catch (e) {
                console.error("Unlock round matches failed:", e);
                window.PremiumModal.alert({ title: "❌ ERROR AL DESBLOQUEAR", message: e.message, type: 'error' });
            }
        }

        async finalizeAllRoundMatches(roundNum) {
            const roundMatches = this.allMatches.filter(m => parseInt(m.round) === roundNum);
            const isEntreno = this.currentAmericanaDoc?.isEntreno;
            const collection = isEntreno ? 'entrenos_matches' : 'matches';

            // Comprobar empates en modo entreno
            if (isEntreno) {
                const tied = roundMatches.find(m => {
                    const sA = parseInt(m.score_a || 0);
                    const sB = parseInt(m.score_b || 0);
                    return sA === sB;
                });
                if (tied) {
                    window.PremiumModal.alert({
                        title: "⚠️ EMPATE DETECTADO",
                        message: `La Pista ${tied.court} tiene un empate (${tied.score_a || 0} - ${tied.score_b || 0}). En los entrenos no se permiten empates. Ajusta el resultado antes de confirmar.`,
                        type: 'warning'
                    });
                    return;
                }
            }

            const confirmed = await window.PremiumModal.confirm({
                title: `🏁 CONFIRMAR RONDA ${roundNum}`,
                message: `¿Deseas dar por confirmados los resultados de todos los partidos de la Ronda ${roundNum}?`,
                confirmText: "SÍ, CONFIRMAR TODOS",
                cancelText: "CANCELAR"
            });
            if (!confirmed) return;

            try {
                const batch = window.db.batch();
                roundMatches.forEach(m => {
                    const sA = parseInt(m.score_a || 0);
                    const sB = parseInt(m.score_b || 0);
                    batch.update(window.db.collection(collection).doc(m.id), {
                        status: 'finished',
                        score_a: sA,
                        score_b: sB
                    });
                    m.status = 'finished';
                    m.score_a = sA;
                    m.score_b = sB;
                    m.isFinished = true;
                });
                await batch.commit();

                roundMatches.forEach(m => {
                    const cardEl = document.getElementById(`card-${m.id}`);
                    if (cardEl) {
                        cardEl.outerHTML = this.renderTournamentCard(m);
                    }
                });

                if (window.confetti) {
                    window.confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#CCFF00', '#00E36D', '#ffffff'] });
                }

                this.recalc();
            } catch (e) {
                console.error("Finalize all matches failed:", e);
                window.PremiumModal.alert({ title: "❌ ERROR", message: e.message, type: 'error' });
            }
        }

        async regenerateCurrentRound(roundNum) {
            const isEntreno = this.currentAmericanaDoc?.isEntreno;
            const eventType = isEntreno ? 'entreno' : 'americana';
            const eventId = this.currentAmericanaDoc?.id;

            let msg = `¿Deseas <b>VOLVER A GENERAR</b> los cruces y pistas de la <b>Ronda ${roundNum}</b>?<br><br>Se borrarán los partidos actuales de la Ronda ${roundNum} y se volverán a calcular`;
            if (roundNum > 1) {
                msg += ` a partir de los resultados de la <b>Ronda ${roundNum - 1}</b>.`;
            } else {
                msg += ` desde el sorteo inicial.`;
            }

            const confirmed = await window.PremiumModal.confirm({
                title: `🎲 REGENERAR RONDA ${roundNum}`,
                message: msg,
                confirmText: "SÍ, REGENERAR",
                cancelText: "CANCELAR",
                type: 'warning'
            });
            if (!confirmed) return;

            try {
                const maxR = Math.max(...this.allMatches.map(m => parseInt(m.round) || 1));
                // 1. Borrar rondas posteriores si las hubiera
                for (let r = roundNum + 1; r <= maxR; r++) {
                    console.log(`🗑️ Pruning round ${r}...`);
                    await window.AmericanaService.deleteRound(eventId, r, eventType);
                }

                // 2. Borrar ronda actual
                console.log(`🗑️ Deleting current round ${roundNum}...`);
                await window.AmericanaService.deleteRound(eventId, roundNum, eventType);

                // 3. Generar la ronda de nuevo
                if (roundNum === 1) {
                    await window.AmericanaService.generateFirstRoundMatches(eventId, eventType);
                } else {
                    if (window.MatchMakingService) {
                        await window.MatchMakingService.generateRound(eventId, eventType, roundNum, true);
                    } else if (window.AmericanaService?.generateNextRound) {
                        await window.AmericanaService.generateNextRound(eventId, roundNum - 1, eventType);
                    }
                }

                // 4. Actualizar documento principal
                const col = isEntreno ? 'entrenos' : 'americanas';
                await window.db.collection(col).doc(eventId).update({
                    current_round: roundNum,
                    status: 'live'
                });
                if (this.currentAmericanaDoc) {
                    this.currentAmericanaDoc.current_round = roundNum;
                    this.currentAmericanaDoc.status = 'live';
                }

                window.PremiumModal.alert({
                    title: "✅ RONDA REGENERADA",
                    message: `La Ronda ${roundNum} se ha vuelto a calcular y generar correctamente.`,
                    type: 'success'
                });

                this.goToRound(roundNum);
            } catch (e) {
                console.error("Error regenerating round:", e);
                window.PremiumModal.alert({ title: "❌ ERROR AL REGENERAR", message: e.message, type: 'error' });
                this.recalc();
            }
        }

        async finishTournament() {
            try {
                // 1. Confirmación segura con fallback
                let confirmed = true;
                if (window.PremiumModal && typeof window.PremiumModal.confirm === 'function') {
                    confirmed = await window.PremiumModal.confirm({
                        title: "🏆 FINALIZAR EVENTO",
                        message: "¿Estás seguro de dar por finalizado el evento? Se guardará el estado final y podrás consultar la clasificación definitiva.",
                        confirmText: "SÍ, FINALIZAR Y VER",
                        cancelText: "CANCELAR",
                        type: 'success'
                    });
                } else {
                    confirmed = window.confirm("¿Estás seguro de dar por finalizado el evento y ver la clasificación?");
                }
                if (!confirmed) return;

                const eventId = this.currentAmericanaDoc?.id || this.currentAmericanaId || this.eventId;
                const isEntreno = !!(this.currentAmericanaDoc?.isEntreno || this.isEntreno);
                const col = isEntreno ? 'entrenos' : 'americanas';

                // 2. Actualización segura en Firestore sin bloquear si hay restricción de red/permisos
                if (eventId && window.db) {
                    try {
                        await window.db.collection(col).doc(eventId).update({
                            status: 'finished'
                        });
                    } catch (dbErr) {
                        console.warn("Could not update status in primary db (non-fatal):", dbErr);
                        if (window.FirebaseDB?.americanas?.update) {
                            try {
                                await window.FirebaseDB.americanas.update(eventId, { status: 'finished' });
                            } catch (_) {}
                        }
                    }
                }

                // 3. Actualizar estado local
                if (this.currentAmericanaDoc) {
                    this.currentAmericanaDoc.status = 'finished';
                }

                // 4. Efecto de celebración con confeti
                if (window.confetti) {
                    try {
                        window.confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 }, colors: ['#CCFF00', '#00E36D', '#ffffff'] });
                    } catch (_) {}
                }

                // 5. Desplegar el modal de gala / flyer tanto para entreno como para americana
                const maxRound = (this.allMatches && this.allMatches.length > 0)
                    ? Math.max(...this.allMatches.map(m => parseInt(m.round || 1)))
                    : 1;

                if (typeof this.showTrainingFinishedModal === 'function') {
                    this.showTrainingFinishedModal(maxRound);
                }

                // 6. Cambiar vista a la pestaña de Posiciones / Clasificación técnica
                this.switchTab('standings');

            } catch (err) {
                console.error("Error in finishTournament:", err);
                // Si ocurre cualquier imprevisto, asegurar que el usuario ve las posiciones
                this.switchTab('standings');
            }
        }

        async unlockMatch(matchId) {
            const match = this.allMatches.find(m => m.id === matchId);
            const matchRound = parseInt(match?.round || 1);
            const maxRound = this.allMatches.length > 0 ? Math.max(...this.allMatches.map(m => parseInt(m.round || 1))) : 1;

            if (matchRound < maxRound) {
                const confirmed = await window.PremiumModal.confirm({
                    title: "⚠️ MODO CORRECCIÓN",
                    message: `Este partido pertenece a la <b>Ronda ${matchRound}</b> y ya se ha generado la Ronda ${matchRound + 1}.<br><br>Cualquier cambio en este resultado requiere <b>reiniciar desde la Ronda ${matchRound}</b> (se borrarán las rondas posteriores).<br><br>¿Deseas reiniciar y editar ahora?`,
                    confirmText: "SÍ, REINICIAR Y EDITAR",
                    cancelText: "CANCELAR",
                    type: 'danger'
                });
                if (!confirmed) return;
                await this.rollbackTournament(matchRound);
                return;
            }

            const confirmed = await window.PremiumModal.confirm({
                title: "✏️ CORREGIR MARCADOR",
                message: "¿Deseas desbloquear este partido para modificar el resultado antes de generar la siguiente ronda?",
                confirmText: "SÍ, MODIFICAR",
                cancelText: "CANCELAR"
            });
            if (!confirmed) return;

            const isEntreno = this.currentAmericanaDoc?.isEntreno;
            const collection = isEntreno ? 'entrenos_matches' : 'matches';
            try {
                await window.db.collection(collection).doc(matchId).update({
                    status: 'live'
                });
                if (match) {
                    match.status = 'live';
                    match.isFinished = false;
                }

                // Si el evento estaba finalizado, reactivarlo a 'live'
                const eventCol = isEntreno ? 'entrenos' : 'americanas';
                await window.db.collection(eventCol).doc(this.currentAmericanaDoc.id).update({
                    status: 'live'
                });
                if (this.currentAmericanaDoc) {
                    this.currentAmericanaDoc.status = 'live';
                }

                console.log("Match unlocked:", matchId);

                // Reemplazo instantáneo de la tarjeta en el DOM por su versión editable
                const cardEl = document.getElementById(`card-${matchId}`);
                if (cardEl && match) {
                    cardEl.outerHTML = this.renderTournamentCard(match);
                }

                this.recalc();
            } catch (e) {
                console.error("Unlock failed:", e);
                window.PremiumModal.alert({
                    title: "❌ ERROR AL DESBLOQUEAR",
                    message: e.message,
                    type: 'error'
                });
            }
        }

        // KEEP LEGACY METHOD FOR ENTRENOS
        async setMatchWinner(matchId, winnerTeam, round) {
            const confirmMsg = "Confirmar resultado:\n\n" + (winnerTeam === 'A' ? "Gana Pareja 1" : "Gana Pareja 2");
            if (!confirm(confirmMsg)) return;

            const isEntreno = this.currentAmericanaDoc?.isEntreno;
            const collection = isEntreno ? 'entrenos_matches' : 'matches';

            try {
                const updateData = {
                    score_a: winnerTeam === 'A' ? 1 : 0,
                    score_b: winnerTeam === 'B' ? 1 : 0,
                    status: 'finished'
                };

                await window.db.collection(collection).doc(matchId).update(updateData);
                console.log(`✅ Match Result Saved.`);

                // 📈 UPDATE PLAYER LEVELS
                if (window.LevelService) {
                    const match = this.allMatches.find(m => m.id === matchId);
                    if (match) {
                        const updatedMatch = { ...match, ...updateData };
                        window.LevelService.processMatchResult(updatedMatch, isEntreno ? 'entreno' : 'americana');
                    }
                }
            } catch (e) {
                console.error("Error setting match winner:", e);
                alert("Error al guardar resultado.");
            }
        }

        async triggerNextRound(round, force = false) {
            const isEntreno = this.currentAmericanaDoc?.isEntreno;
            const eventType = isEntreno ? 'entreno' : 'americana';
            const nextRound = round + 1;

            const nextRoundExists = this.allMatches.some(m => parseInt(m.round) === nextRound);

            let title = "🚀 SIGUIENTE RONDA";
            let msg = `¿CONFIRMAR GENERACIÓN DE LA RONDA ${nextRound}?\n\nAsegúrate de que todos los resultados de la Ronda ${round} sean correctos.`;
            let color = "#CCFF00";

            if (nextRoundExists) {
                title = "⚠️ REGENERAR RONDA";
                msg = `LA RONDA ${nextRound} YA EXISTE\n\nAl confirmar, SE BORRARÁ la Ronda ${nextRound} actual y se volverá a sortear.\n\n¿Estás seguro?`;
                color = "#FF3B30";
            } else if (force) {
                title = "⏩ FORZAR SIGUIENTE RONDA";
                msg = `Hay partidos pendientes en la Ronda ${round}.\n\n¿Deseas FORZAR la generación de la Ronda ${nextRound} de todos modos?`;
            }

            const confirmed = await window.PremiumModal.confirm({
                title: title,
                message: msg,
                confirmText: "CONFIRMAR",
                cancelText: "CANCELAR"
            });

            if (!confirmed) return;

            const btnContainer = document.getElementById('round-control-toolbar') || document.getElementById('next-round-btn-container');
            if (btnContainer) {
                btnContainer.innerHTML = `<div style="display:flex; justify-content:center; align-items:center; gap:15px; padding:25px;"><div class="loader"></div><span style="font-weight:900; color:#15803d; font-size:1rem;">GENERANDO RONDA ${nextRound}...</span></div>`;
            }

            try {
                if (nextRoundExists) {
                    console.log(`♻️ Regenerating Round ${nextRound}... deleting old matches.`);
                    await window.AmericanaService.deleteRound(this.currentAmericanaDoc.id, nextRound, eventType);
                }

                if (window.MatchMakingService && force) {
                    await window.MatchMakingService.generateRound(this.currentAmericanaDoc.id, eventType, nextRound, true);
                } else if (window.AmericanaService && window.AmericanaService.generateNextRound) {
                    await window.AmericanaService.generateNextRound(this.currentAmericanaDoc.id, round, eventType);
                } else if (window.AmericanaService && window.AmericanaService.generateEntrenoNextRound && isEntreno) {
                    await window.AmericanaService.generateEntrenoNextRound(this.currentAmericanaDoc.id, round);
                }

                // Sincronizar documento principal del evento
                const eventCol = isEntreno ? 'entrenos' : 'americanas';
                await window.db.collection(eventCol).doc(this.currentAmericanaDoc.id).update({
                    current_round: nextRound,
                    status: 'live'
                });
                if (this.currentAmericanaDoc) {
                    this.currentAmericanaDoc.current_round = nextRound;
                    this.currentAmericanaDoc.status = 'live';
                }

                // --- AUTO-TRANSITION LOGIC ---
                console.log("⏳ Waiting for matches to sync...");

                // Helper to wait for matches
                const waitForMatches = async () => {
                    let attempts = 0;
                    while (attempts < 20) { // Try for ~10 seconds
                        const matchesForNextRound = this.allMatches.filter(m => parseInt(m.round) === nextRound);
                        if (matchesForNextRound.length > 0) return matchesForNextRound;

                        await new Promise(r => setTimeout(r, 500));
                        attempts++;
                    }
                    return [];
                };

                const newMatches = await waitForMatches();

                if (newMatches.length > 0 && window.ShuffleAnimator) {
                    // Play Animation
                    window.ShuffleAnimator.animate({
                        round: nextRound,
                        players: this.currentAmericanaDoc?.players || [],
                        courts: this.currentAmericanaDoc?.max_courts || 4,
                        matches: newMatches
                    }, () => {
                        // ON COMPLETE: Switch Tab
                        this.goToRound(nextRound);
                    });
                } else {
                    // Fallback if no animation or timeout
                    this.goToRound(nextRound);
                    window.PremiumModal.alert({
                        title: "✅ RONDA GENERADA",
                        message: `Ronda ${nextRound} generada correctamente.`
                    });
                }

            } catch (e) {
                console.error(e);
                window.PremiumModal.alert({
                    title: "❌ ERROR",
                    message: "Error al generar ronda: " + e.message,
                    type: 'error'
                });
                this.recalc();
            }
        }

        renderReportView() {
            if (!window.ControlTowerReport) return '<div style="padding:40px; text-align:center;">Cargando...</div>';
            return window.ControlTowerReport.render(this.allMatches, this.currentAmericanaDoc);
        }

        renderHistoryContent() {
            const user = window.Store ? window.Store.getState('currentUser') : null;
            const stats = this.userStats || { games: 0, wins: 0, events: 0 };
            const winRate = stats.events > 0 ? Math.round((stats.wins / (stats.wins + (stats.losses || 0) || 1)) * 100) : 0;

            return `
                <div class="fade-in" style="padding: 10px 5px 120px; font-family: 'Outfit', sans-serif;">
                    
                <!-- SOMOSPADEL LIVE DASHBOARD (Real Community Data) -->
                <div style="background: #ffffff; padding: 30px; border-radius: 32px; border: 1px solid #e2e8f0; margin-bottom: 30px; box-shadow: 0 10px 40px rgba(0,0,0,0.03); position: relative; overflow: hidden;">
                    <div style="position: absolute; top: -20px; right: -20px; font-size: 8rem; opacity: 0.03; color: #CCFF00; transform: rotate(-15deg);"><i class="fas fa-users"></i></div>
                    
                    <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 25px;">
                        <div style="width: 45px; height: 45px; background: #CCFF00; border-radius: 14px; display: flex; align-items: center; justify-content: center; color: #000; font-size: 1.3rem; box-shadow: 0 0 20px rgba(204,255,0,0.4);">
                            <i class="fas fa-broadcast-tower"></i>
                        </div>
                        <div>
                            <h2 style="color: #0a192f; font-size: 1.15rem; font-weight: 950; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">Panel de Comunidad</h2>
                            <p style="color: #64748b; font-size: 0.75rem; font-weight: 800; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Estatus Real • SomosPadel BCN</p>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                        <!-- Real Data: Total Players -->
                        <div style="background: #f8fafc; padding: 20px; border-radius: 24px; border: 1px solid #e2e8f0;">
                            <div style="font-size: 0.65rem; color: #888; font-weight: 900; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 1px;">Jugadores en Club</div>
                            <div style="font-size: 1.8rem; font-weight: 950; color: #0a192f; display: flex; align-items: baseline; gap: 5px;">
                                ${window.Store.getState('players')?.length || '120'}<span style="font-size: 0.8rem; color: #72a800;">+</span>
                            </div>
                        </div>
                        
                        <!-- Real Data: Next Event -->
                        <div style="background: #f8fafc; padding: 20px; border-radius: 24px; border: 1px solid #e2e8f0;">
                            <div style="font-size: 0.65rem; color: #888; font-weight: 900; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 1px;">Próxima Cita</div>
                            <div style="font-size: 1rem; font-weight: 950; color: #3b82f6; margin-top: 5px; line-height: 1.2;">
                                📅 ${(window.Store.getState('americanas')?.[0]?.date) || 'Próximamente'}
                            </div>
                        </div>
                    </div>

                    <!-- Community Power Metric -->
                    <div style="background: rgba(204,255,0,0.05); padding: 15px; border-radius: 20px; border: 1px dashed rgba(204,255,0,0.2);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="font-size: 0.7rem; color: #fff; font-weight: 900; text-transform: uppercase;">Actividad Global de la Semana</span>
                            <span style="font-size: 0.7rem; color: #CCFF00; font-weight: 950;">ALTA 🔥</span>
                        </div>
                        <div style="height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden;">
                            <div style="width: 85%; height: 100%; background: #CCFF00; box-shadow: 0 0 10px #CCFF00;"></div>
                        </div>
                    </div>
                </div>

                    <!-- RECENT TIMELINE -->
                    <h3 style="font-family:'Outfit'; font-weight: 950; color: #fff; margin: 0 0 20px 5px; font-size: 1.1rem; display: flex; align-items: center; gap: 10px; letter-spacing: 1px;">
                        <i class="fas fa-history" style="color: #CCFF00;"></i> CRONOLOGÍA HISTÓRICA
                    </h3>

                    <div style="display: grid; gap: 15px;">
                        ${this.userHistory.length === 0 ? `
                            <!-- EMPTY STATE: PRO DASHBOARD MODE (Copied to ControlTower) -->
                            <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 24px; padding: 25px; text-align: center; position: relative; overflow: hidden;">
                                
                                <!-- 🕸️ TARJETA RPG: RADAR CHART (Chart.js) -->
                                <div style="margin-bottom: 25px; background: rgba(0,0,0,0.4); border-radius: 20px; padding: 20px; border: 1px solid rgba(255,255,255,0.05);">
                                    <div style="font-size: 0.75rem; color: #CCFF00; margin-bottom: 20px; font-weight: 950; text-transform:uppercase; letter-spacing:2px; text-align: center;">
                                        ANÁLISIS DE ATRIBUTOS (Nivel ${user && user.level ? parseFloat(user.level).toFixed(2) : '3.50'})
                                    </div>
                                    <div style="width: 100%; max-width: 280px; margin: 0 auto; position: relative;">
                                        <canvas id="playerRadarChart"></canvas>
                                    </div>
                                </div>


                                <p style="font-size: 0.85rem; color: #ddd; margin: 0 0 20px; font-weight: 500; line-height: 1.5;">
                                    Aún no hay partidos registrados este año, pero tu perfil está <b>listo para competir</b>.
                                </p>

                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                    <button onclick="window.Router.navigate('americanas')" style="background: #CCFF00; color: black; border: none; padding: 12px; border-radius: 14px; font-weight: 900; font-size: 0.75rem; text-transform: uppercase; cursor: pointer;">
                                        <i class="fas fa-trophy" style="margin-right: 5px;"></i> Competir
                                    </button>
                                    <button onclick="window.Router.navigate('ranking')" style="background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); padding: 12px; border-radius: 14px; font-weight: 900; font-size: 0.75rem; text-transform: uppercase; cursor: pointer;">
                                        <i class="fas fa-chart-bar" style="margin-right: 5px;"></i> Ranking
                                    </button>
                                </div>
                            </div>
                        ` :
                    this.userHistory.map((h, i) => {
                        const amDate = h.date ? new Date(h.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Fecha desconocida';
                        const isWin = i === 0; // Simple highlight for latest
                        return `
                            <div class="history-item-card" 
                                 onclick="window.ControlTowerView.load('${h.id}'); window.ControlTowerView.switchSection('playing');"
                                 style="
                                    background: rgba(255,255,255,0.03); 
                                    padding: 20px; 
                                    border: 1px solid rgba(255,255,255,0.05); 
                                    border-radius: 26px; 
                                    display: flex;
                                    justify-content: space-between;
                                    align-items: center;
                                    cursor: pointer;
                                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                                    position: relative;
                                    overflow: hidden;
                                 "
                                 onmouseover="this.style.background='rgba(255,255,255,0.06)'; this.style.borderColor='rgba(204,255,0,0.3)'; this.style.transform='scale(1.02)';"
                                 onmouseout="this.style.background='rgba(255,255,255,0.03)'; this.style.borderColor='rgba(255,255,255,0.05)'; this.style.transform='none';"
                            >
                                <div style="display: flex; align-items: center; gap: 15px;">
                                    <div style="width: 50px; height: 50px; background: rgba(255,255,255,0.03); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; color: #CCFF00; border: 1px solid rgba(255,255,255,0.05);">
                                        <i class="fas fa-trophy"></i>
                                    </div>
                                    <div>
                                        <div style="font-weight: 950; font-size: 1rem; color: #fff; margin-bottom: 4px; text-transform: uppercase; letter-spacing: -0.5px;">${h.name}</div>
                                        <div style="display: flex; align-items: center; gap: 8px; font-size: 0.7rem; color: #64748b; font-weight: 800;">
                                            <span style="background: rgba(255,255,255,0.05); padding: 2px 8px; border-radius: 5px;"><i class="far fa-calendar-alt" style="margin-right: 4px;"></i> ${amDate}</span>
                                            <span style="color: #CCFF00; border: 1px solid rgba(204,255,0,0.2); background: rgba(204,255,0,0.05); padding: 1px 10px; border-radius: 20px; font-size: 0.6rem;">${(h.category || 'PRO').toUpperCase()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div style="display: flex; align-items: center; gap: 15px;">
                                    <div style="text-align: right;">
                                        <div style="font-size: 0.55rem; color: #444; font-weight: 950; text-transform: uppercase;">Full Report</div>
                                        <div style="color: #CCFF00; font-size: 0.9rem;"><i class="fas fa-chevron-right"></i></div>
                                    </div>
                                </div>
                            </div>
                        `}).join('')}
                    </div>
                </div>
            `;
        }

        renderHelpContent() {
            return `
                <div class="sp-help-container fade-in">
                    <style>
                        .sp-help-container {
                            padding: 24px 16px 120px 16px;
                            min-height: 85vh;
                            background: radial-gradient(circle at 50% 0%, #121929 0%, #06080e 70%);
                            color: #f1f5f9;
                            font-family: 'Outfit', 'Inter', -apple-system, sans-serif;
                            max-width: 1100px;
                            margin: 0 auto;
                        }
                        .sp-help-badge {
                            display: inline-flex;
                            align-items: center;
                            gap: 8px;
                            padding: 6px 14px;
                            background: rgba(204, 255, 0, 0.1);
                            border: 1px solid rgba(204, 255, 0, 0.3);
                            border-radius: 999px;
                            font-size: 0.72rem;
                            font-weight: 900;
                            color: #CCFF00;
                            letter-spacing: 1.5px;
                            text-transform: uppercase;
                            margin-bottom: 12px;
                            box-shadow: 0 0 20px rgba(204, 255, 0, 0.15);
                        }
                        .sp-help-title {
                            font-size: 2.2rem;
                            font-weight: 950;
                            letter-spacing: -0.8px;
                            margin: 0 0 10px 0;
                            line-height: 1.1;
                            color: #ffffff;
                        }
                        .sp-help-subtitle {
                            font-size: 0.95rem;
                            color: #94a3b8;
                            line-height: 1.6;
                            margin: 0 0 24px 0;
                            max-width: 780px;
                            font-family: 'Inter', sans-serif;
                        }
                        .sp-quick-chips {
                            display: flex;
                            flex-wrap: wrap;
                            gap: 10px;
                            margin-bottom: 28px;
                        }
                        .sp-chip {
                            background: rgba(255, 255, 255, 0.04);
                            border: 1px solid rgba(255, 255, 255, 0.08);
                            padding: 6px 12px;
                            border-radius: 12px;
                            font-size: 0.75rem;
                            font-weight: 750;
                            color: #cbd5e1;
                            display: flex;
                            align-items: center;
                            gap: 6px;
                        }
                        .sp-help-nav {
                            display: flex;
                            gap: 8px;
                            overflow-x: auto;
                            padding-bottom: 12px;
                            margin-bottom: 28px;
                            scrollbar-width: none;
                            -webkit-overflow-scrolling: touch;
                        }
                        .sp-help-nav::-webkit-scrollbar {
                            display: none;
                        }
                        .sp-help-nav-btn {
                            flex: 0 0 auto;
                            background: rgba(255, 255, 255, 0.03);
                            border: 1px solid rgba(255, 255, 255, 0.08);
                            color: #94a3b8;
                            padding: 10px 18px;
                            border-radius: 16px;
                            font-size: 0.82rem;
                            font-weight: 850;
                            cursor: pointer;
                            transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            font-family: 'Outfit', sans-serif;
                            white-space: nowrap;
                        }
                        .sp-help-nav-btn:hover {
                            background: rgba(255, 255, 255, 0.08);
                            color: #fff;
                            border-color: rgba(255, 255, 255, 0.2);
                        }
                        .sp-help-nav-btn.sp-tab-active {
                            background: #CCFF00;
                            color: #06080e;
                            border-color: #CCFF00;
                            font-weight: 950;
                            box-shadow: 0 0 25px rgba(204, 255, 0, 0.35);
                            transform: translateY(-1px);
                        }
                        .sp-help-panel {
                            display: none;
                            animation: spFadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                        }
                        @keyframes spFadeIn {
                            from { opacity: 0; transform: translateY(8px); }
                            to { opacity: 1; transform: translateY(0); }
                        }
                        .sp-card {
                            background: rgba(255, 255, 255, 0.025);
                            border: 1px solid rgba(255, 255, 255, 0.07);
                            border-radius: 24px;
                            padding: 24px;
                            margin-bottom: 22px;
                            backdrop-filter: blur(12px);
                            -webkit-backdrop-filter: blur(12px);
                            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.35);
                            transition: border-color 0.25s;
                        }
                        .sp-card:hover {
                            border-color: rgba(255, 255, 255, 0.14);
                        }
                        .sp-card-highlight {
                            border-color: rgba(204, 255, 0, 0.35);
                            background: linear-gradient(135deg, rgba(204, 255, 0, 0.06) 0%, rgba(6, 8, 14, 0.6) 100%);
                        }
                        .sp-card-header {
                            display: flex;
                            align-items: center;
                            gap: 14px;
                            margin-bottom: 18px;
                        }
                        .sp-card-icon {
                            width: 44px;
                            height: 44px;
                            border-radius: 14px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 1.25rem;
                            flex-shrink: 0;
                        }
                        .sp-card-title {
                            font-size: 1.22rem;
                            font-weight: 900;
                            color: #ffffff;
                            letter-spacing: -0.3px;
                            margin: 0;
                        }
                        .sp-card-subtitle {
                            font-size: 0.8rem;
                            color: #94a3b8;
                            margin-top: 2px;
                            font-family: 'Inter', sans-serif;
                        }
                        .sp-scale-track {
                            height: 12px;
                            border-radius: 999px;
                            background: linear-gradient(to right, #f97316 0%, #cbd5e1 25%, #f59e0b 50%, #38bdf8 75%, #00E36D 100%);
                            position: relative;
                            margin: 32px 10px 48px 10px;
                            box-shadow: 0 0 20px rgba(0, 227, 109, 0.2);
                        }
                        .sp-scale-marker {
                            position: absolute;
                            top: -26px;
                            transform: translateX(-50%);
                            font-size: 0.7rem;
                            font-weight: 900;
                            color: #fff;
                            white-space: nowrap;
                        }
                        .sp-scale-pin {
                            position: absolute;
                            top: 18px;
                            transform: translateX(-50%);
                            font-size: 0.68rem;
                            font-weight: 800;
                            color: #64748b;
                            text-align: center;
                            white-space: nowrap;
                        }
                        .sp-cat-grid {
                            display: grid;
                            grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
                            gap: 12px;
                            margin-bottom: 20px;
                        }
                        .sp-cat-btn {
                            background: rgba(255, 255, 255, 0.03);
                            border: 1.5px solid rgba(255, 255, 255, 0.08);
                            border-radius: 18px;
                            padding: 14px 12px;
                            text-align: center;
                            cursor: pointer;
                            transition: all 0.2s ease;
                        }
                        .sp-cat-btn:hover {
                            transform: translateY(-2px);
                            background: rgba(255, 255, 255, 0.06);
                        }
                        .sp-cat-btn.sp-cat-active {
                            border-width: 2px;
                            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
                            transform: translateY(-2px);
                        }
                        .sp-stat-pill {
                            display: inline-flex;
                            align-items: center;
                            gap: 6px;
                            padding: 4px 10px;
                            border-radius: 8px;
                            font-size: 0.72rem;
                            font-weight: 850;
                        }
                        .sp-faq-item {
                            background: rgba(255, 255, 255, 0.025);
                            border: 1px solid rgba(255, 255, 255, 0.07);
                            border-radius: 18px;
                            margin-bottom: 12px;
                            overflow: hidden;
                            transition: border-color 0.2s;
                        }
                        .sp-faq-item:hover {
                            border-color: rgba(255, 255, 255, 0.16);
                        }
                        .sp-faq-question {
                            padding: 18px 20px;
                            font-weight: 850;
                            font-size: 0.95rem;
                            color: #f1f5f9;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: space-between;
                            gap: 12px;
                            user-select: none;
                        }
                        .sp-faq-answer {
                            padding: 0 20px 18px 20px;
                            font-size: 0.88rem;
                            color: #94a3b8;
                            line-height: 1.65;
                            font-family: 'Inter', sans-serif;
                            display: none;
                        }
                        .sp-faq-icon {
                            transition: transform 0.25s ease;
                            color: #CCFF00;
                            font-size: 0.85rem;
                        }
                        .sp-sim-input-group {
                            margin-bottom: 18px;
                        }
                        .sp-sim-label {
                            display: flex;
                            justify-content: space-between;
                            font-size: 0.82rem;
                            font-weight: 800;
                            color: #e2e8f0;
                            margin-bottom: 8px;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                        }
                        .sp-sim-select, .sp-sim-slider {
                            width: 100%;
                            background: #0f1420;
                            border: 1px solid rgba(255, 255, 255, 0.12);
                            color: #fff;
                            padding: 12px 14px;
                            border-radius: 14px;
                            font-family: 'Outfit', sans-serif;
                            font-weight: 700;
                            font-size: 0.88rem;
                            outline: none;
                            transition: border-color 0.2s;
                        }
                        .sp-sim-select:focus {
                            border-color: #CCFF00;
                        }
                        .sp-sim-slider {
                            -webkit-appearance: none;
                            height: 8px;
                            padding: 0;
                            background: #1e293b;
                            border: none;
                            border-radius: 4px;
                            cursor: pointer;
                        }
                        .sp-sim-slider::-webkit-slider-thumb {
                            -webkit-appearance: none;
                            width: 22px;
                            height: 22px;
                            border-radius: 50%;
                            background: #CCFF00;
                            cursor: pointer;
                            box-shadow: 0 0 10px rgba(204, 255, 0, 0.6);
                        }
                        .sp-timeline-step {
                            position: relative;
                            padding-left: 36px;
                            margin-bottom: 22px;
                        }
                        .sp-timeline-step::before {
                            content: '';
                            position: absolute;
                            left: 11px;
                            top: 26px;
                            bottom: -16px;
                            width: 2px;
                            background: rgba(255, 255, 255, 0.1);
                        }
                        .sp-timeline-step:last-child::before {
                            display: none;
                        }
                        .sp-timeline-badge {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 24px;
                            height: 24px;
                            border-radius: 50%;
                            background: #CCFF00;
                            color: #000;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 0.75rem;
                            font-weight: 950;
                        }
                        @media (max-width: 640px) {
                            .sp-help-title { font-size: 1.7rem; }
                            .sp-card { padding: 18px 16px; }
                            .sp-cat-grid { grid-template-columns: repeat(2, 1fr); }
                        }
                    </style>

                    <!-- HERO BANNER -->
                    <div style="margin-bottom: 24px;">
                        <div class="sp-help-badge">
                            <i class="fas fa-bolt"></i> SOMOSPADEL BCN • MANUAL DE COMPETICIÓN & OPERATIVA
                        </div>
                        <h1 class="sp-help-title">
                            GUÍA <span style="color: #CCFF00; text-shadow: 0 0 25px rgba(204,255,0,0.45);">SMART</span> JUGADOR
                        </h1>
                        <p class="sp-help-subtitle">
                            Todo lo que necesitas dominar: la escala de niveles ELO (0.0 a 7.5), el cálculo inteligente de décimas, los formatos de torneo, la Torre de Control en directo y las alertas comunitarias.
                        </p>
                        
                        <!-- QUICK STAT CHIPS -->
                        <div class="sp-quick-chips">
                            <div class="sp-chip"><i class="fas fa-layer-group" style="color: #CCFF00;"></i> Escala 0.00 — 7.50</div>
                            <div class="sp-chip"><i class="fas fa-calculator" style="color: #38bdf8;"></i> Algoritmo ELO 60/40</div>
                            <div class="sp-chip"><i class="fas fa-trophy" style="color: #f59e0b;"></i> 3 Pts por Victoria</div>
                            <div class="sp-chip"><i class="fas fa-tv" style="color: #ef4444;"></i> Modo TV Center Court</div>
                            <div class="sp-chip"><i class="fas fa-bell" style="color: #ec4899;"></i> Alerta SOS Express</div>
                        </div>
                    </div>

                    <!-- INTERACTIVE HORIZONTAL TABS -->
                    <div class="sp-help-nav" role="tablist">
                        <button class="sp-help-nav-btn sp-tab-active" data-tab="levels" onclick="window.ControlTowerView.switchHelpTab('levels')">
                            <i class="fas fa-tachometer-alt"></i> 1. Niveles & ELO
                        </button>
                        <button class="sp-help-nav-btn" data-tab="ranking" onclick="window.ControlTowerView.switchHelpTab('ranking')">
                            <i class="fas fa-medal"></i> 2. Ranking Oficial
                        </button>
                        <button class="sp-help-nav-btn" data-tab="formats" onclick="window.ControlTowerView.switchHelpTab('formats')">
                            <i class="fas fa-sitemap"></i> 3. Formatos Reales
                        </button>
                        <button class="sp-help-nav-btn" data-tab="ops" onclick="window.ControlTowerView.switchHelpTab('ops')">
                            <i class="fas fa-mobile-alt"></i> 4. En Pista & TV
                        </button>
                        <button class="sp-help-nav-btn" data-tab="community" onclick="window.ControlTowerView.switchHelpTab('community')">
                            <i class="fas fa-users"></i> 5. Comunidad & SOS
                        </button>
                        <button class="sp-help-nav-btn" data-tab="radar" onclick="window.ControlTowerView.switchHelpTab('radar')">
                            <i class="fas fa-chart-pie"></i> 6. Radar RPG
                        </button>
                        <button class="sp-help-nav-btn" data-tab="faq" onclick="window.ControlTowerView.switchHelpTab('faq')">
                            <i class="fas fa-question-circle"></i> 7. Dudas Frecuentes
                        </button>
                    </div>

                    <!-- ========================================== -->
                    <!-- TAB 1: NIVELES & ALGORITMO ELO SMART       -->
                    <!-- ========================================== -->
                    <div id="sp-help-panel-levels" class="sp-help-panel" style="display: block;">
                        
                        <!-- 1.1 Visual Scale -->
                        <div class="sp-card sp-card-highlight">
                            <div class="sp-card-header">
                                <div class="sp-card-icon" style="background: rgba(204,255,0,0.15); color: #CCFF00;">
                                    <i class="fas fa-award"></i>
                                </div>
                                <div>
                                    <h3 class="sp-card-title">Escala Oficial SomosPadel (0.00 — 7.50)</h3>
                                    <div class="sp-card-subtitle">Tu huella competitiva calibrada partido a partido mediante precisión decimal</div>
                                </div>
                            </div>
                            
                            <p style="font-size: 0.88rem; color: #cbd5e1; line-height: 1.6; margin-bottom: 24px;">
                                A diferencia de los sistemas tradicionales estáticos, tu nivel en SomosPadel es un <b>valor numérico vivo</b> que oscila con exactitud matemática según tu rendimiento real en la pista y la dificultad de cada emparejamiento.
                            </p>

                            <!-- Gradient Level Bar -->
                            <div class="sp-scale-track">
                                <div class="sp-scale-marker" style="left: 0%; color: #f97316;">0.00</div>
                                <div class="sp-scale-pin" style="left: 18%;">BRONZE<br><span style="font-size: 0.6rem;">&lt; 3.00</span></div>
                                <div class="sp-scale-pin" style="left: 42%;">SILVER<br><span style="font-size: 0.6rem;">3.00 - 3.49</span></div>
                                <div class="sp-scale-pin" style="left: 64%; color: #CCFF00;">GOLD ★<br><span style="font-size: 0.6rem;">3.50 - 3.99</span></div>
                                <div class="sp-scale-pin" style="left: 82%;">PLATINUM<br><span style="font-size: 0.6rem;">4.00 - 4.49</span></div>
                                <div class="sp-scale-marker" style="left: 100%; color: #00E36D;">7.50</div>
                                <div class="sp-scale-pin" style="left: 96%;">ELITE<br><span style="font-size: 0.6rem;">4.50+</span></div>
                            </div>
                        </div>

                        <!-- 1.2 Five Official Categories Selector -->
                        <div class="sp-card">
                            <div class="sp-card-header">
                                <div class="sp-card-icon" style="background: rgba(56,189,248,0.15); color: #38bdf8;">
                                    <i class="fas fa-layer-group"></i>
                                </div>
                                <div>
                                    <h3 class="sp-card-title">Las 5 Categorías Oficiales</h3>
                                    <div class="sp-card-subtitle">Haz clic en una categoría para inspeccionar su perfil técnico, estrellas y requisitos</div>
                                </div>
                            </div>

                            <div class="sp-cat-grid">
                                <div id="sp-cat-btn-bronze" class="sp-cat-btn" onclick="window.ControlTowerView.selectHelpCategory('bronze')" style="border-color: rgba(249,115,22,0.4);">
                                    <div style="font-size: 0.75rem; color: #f97316; font-weight: 900; margin-bottom: 4px;">★☆☆☆☆</div>
                                    <div style="font-weight: 950; font-size: 0.95rem; color: #fff;">BRONZE</div>
                                    <div style="font-size: 0.72rem; color: #94a3b8; margin-top: 2px;">&lt; 3.00</div>
                                </div>
                                <div id="sp-cat-btn-silver" class="sp-cat-btn" onclick="window.ControlTowerView.selectHelpCategory('silver')" style="border-color: rgba(203,213,225,0.4);">
                                    <div style="font-size: 0.75rem; color: #cbd5e1; font-weight: 900; margin-bottom: 4px;">★★☆☆☆</div>
                                    <div style="font-weight: 950; font-size: 0.95rem; color: #fff;">SILVER</div>
                                    <div style="font-size: 0.72rem; color: #94a3b8; margin-top: 2px;">3.00 — 3.49</div>
                                </div>
                                <div id="sp-cat-btn-gold" class="sp-cat-btn sp-cat-active" onclick="window.ControlTowerView.selectHelpCategory('gold')" style="border-color: #f59e0b; background: rgba(245,158,11,0.12);">
                                    <div style="font-size: 0.75rem; color: #f59e0b; font-weight: 900; margin-bottom: 4px;">★★★☆☆</div>
                                    <div style="font-weight: 950; font-size: 0.95rem; color: #fff;">GOLD</div>
                                    <div style="font-size: 0.72rem; color: #94a3b8; margin-top: 2px;">3.50 — 3.99</div>
                                </div>
                                <div id="sp-cat-btn-platinum" class="sp-cat-btn" onclick="window.ControlTowerView.selectHelpCategory('platinum')" style="border-color: rgba(56,189,248,0.4);">
                                    <div style="font-size: 0.75rem; color: #38bdf8; font-weight: 900; margin-bottom: 4px;">★★★★☆</div>
                                    <div style="font-weight: 950; font-size: 0.95rem; color: #fff;">PLATINUM</div>
                                    <div style="font-size: 0.72rem; color: #94a3b8; margin-top: 2px;">4.00 — 4.49</div>
                                </div>
                                <div id="sp-cat-btn-elite" class="sp-cat-btn" onclick="window.ControlTowerView.selectHelpCategory('elite')" style="border-color: rgba(0,227,109,0.4);">
                                    <div style="font-size: 0.75rem; color: #00E36D; font-weight: 900; margin-bottom: 4px;">★★★★★</div>
                                    <div style="font-weight: 950; font-size: 0.95rem; color: #fff;">ELITE</div>
                                    <div style="font-size: 0.72rem; color: #94a3b8; margin-top: 2px;">4.50+</div>
                                </div>
                            </div>

                            <!-- Dynamic Category Detail Card -->
                            <div id="sp-cat-detail-card" style="background: rgba(15,20,32,0.85); border: 1.5px solid #f59e0b; border-radius: 20px; padding: 22px; transition: all 0.3s ease;">
                                <!-- Will be hydrated dynamically -->
                            </div>
                        </div>

                        <!-- 1.3 Algoritmo ELO PRO Smart: 60/40 -->
                        <div class="sp-card">
                            <div class="sp-card-header">
                                <div class="sp-card-icon" style="background: rgba(139,92,246,0.15); color: #a78bfa;">
                                    <i class="fas fa-brain"></i>
                                </div>
                                <div>
                                    <h3 class="sp-card-title">Algoritmo ELO PRO Smart (60/40)</h3>
                                    <div class="sp-card-subtitle">Fórmula de calibración basada en rendimiento numérico y dificultad competitiva</div>
                                </div>
                            </div>

                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 20px;">
                                <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 18px;">
                                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                                        <span style="font-size: 0.75rem; font-weight: 950; color: #CCFF00; letter-spacing: 1px;">COMPONENTE 1</span>
                                        <span style="font-size: 1.2rem; font-weight: 950; color: #CCFF00;">60%</span>
                                    </div>
                                    <div style="font-size: 1rem; font-weight: 900; color: #fff; margin-bottom: 6px;">Rendimiento Real (Juegos)</div>
                                    <p style="font-size: 0.82rem; color: #94a3b8; line-height: 1.5; margin: 0;">
                                        Mide la <b>diferencia neta de juegos</b> en el marcador. Ganar 6-1 suma mucho más que un 6-5. Una derrota ajustada (5-6) minimiza el impacto negativo porque demuestra que competiste al límite.
                                    </p>
                                </div>

                                <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 18px;">
                                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                                        <span style="font-size: 0.75rem; font-weight: 950; color: #38bdf8; letter-spacing: 1px;">COMPONENTE 2</span>
                                        <span style="font-size: 1.2rem; font-weight: 950; color: #38bdf8;">40%</span>
                                    </div>
                                    <div style="font-size: 1rem; font-weight: 900; color: #fff; margin-bottom: 6px;">Dificultad del Cruce</div>
                                    <p style="font-size: 0.82rem; color: #94a3b8; line-height: 1.5; margin: 0;">
                                        Compara el <b>nivel medio de tu pareja vs el nivel medio de tus rivales</b>. Vencer a una pareja de ranking superior multiplica tus décimas ganadas; perder contra rivales muy superiores no penaliza casi nada.
                                    </p>
                                </div>
                            </div>

                            <div style="display: flex; flex-wrap: wrap; gap: 12px; background: rgba(0,0,0,0.3); padding: 16px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05);">
                                <div style="flex: 1 1 180px;">
                                    <div style="font-size: 0.7rem; color: #64748b; font-weight: 900; text-transform: uppercase;">Ajuste por Partido</div>
                                    <div style="font-size: 1.1rem; font-weight: 950; color: #fff;">±0.010 a ±0.030</div>
                                </div>
                                <div style="flex: 1 1 180px;">
                                    <div style="font-size: 0.7rem; color: #64748b; font-weight: 900; text-transform: uppercase;">Por Americana (4-5 rondas)</div>
                                    <div style="font-size: 1.1rem; font-weight: 950; color: #CCFF00;">~0.12 a 0.18 décimas</div>
                                </div>
                                <div style="flex: 1 1 220px;">
                                    <div style="font-size: 0.7rem; color: #64748b; font-weight: 900; text-transform: uppercase;">Filtro Anti-Racha</div>
                                    <div style="font-size: 0.82rem; color: #cbd5e1; line-height: 1.4;">Protege contra días malos accidentales y premia la regularidad sostenida en el tiempo.</div>
                                </div>
                            </div>
                        </div>

                        <!-- 1.4 Mini Simulador Interactivo de Décimas -->
                        <div class="sp-card" style="border-color: rgba(204,255,0,0.3); background: linear-gradient(135deg, rgba(204,255,0,0.04) 0%, rgba(15,20,32,0.9) 100%);">
                            <div class="sp-card-header">
                                <div class="sp-card-icon" style="background: #CCFF00; color: #000;">
                                    <i class="fas fa-calculator"></i>
                                </div>
                                <div>
                                    <h3 class="sp-card-title">Simulador Interactivo de Décimas</h3>
                                    <div class="sp-card-subtitle">Experimenta en directo cómo reaccionará tu nivel tras tu próximo partido</div>
                                </div>
                            </div>

                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; align-items: center;">
                                <div>
                                    <!-- User Level Slider -->
                                    <div class="sp-sim-input-group">
                                        <div class="sp-sim-label">
                                            <span>Tu Nivel Actual</span>
                                            <span id="sp-sim-val-user" style="color: #CCFF00; font-size: 1rem;">3.50</span>
                                        </div>
                                        <input id="sp-sim-user-level" class="sp-sim-slider" type="range" min="1.50" max="6.50" step="0.05" value="3.50" oninput="window.ControlTowerView.calculateEloSimulation()">
                                    </div>

                                    <!-- Rival Difficulty Dropdown -->
                                    <div class="sp-sim-input-group">
                                        <div class="sp-sim-label">Nivel de la Pareja Rival</div>
                                        <select id="sp-sim-rival-diff" class="sp-sim-select" onchange="window.ControlTowerView.calculateEloSimulation()">
                                            <option value="0.40">Pareja Rival Muy Superior (+0.40 nivel)</option>
                                            <option value="0.20">Pareja Rival Superior (+0.20 nivel)</option>
                                            <option value="0.00" selected>Parejas de Nivel Idéntico (0.00)</option>
                                            <option value="-0.20">Pareja Rival Inferior (-0.20 nivel)</option>
                                            <option value="-0.40">Pareja Rival Muy Inferior (-0.40 nivel)</option>
                                        </select>
                                    </div>

                                    <!-- Match Result Dropdown -->
                                    <div class="sp-sim-input-group" style="margin-bottom: 0;">
                                        <div class="sp-sim-label">Resultado del Partido</div>
                                        <select id="sp-sim-result" class="sp-sim-select" onchange="window.ControlTowerView.calculateEloSimulation()">
                                            <option value="win_huge" selected>Victoria Contundente (6-0 / 6-1 / 6-2)</option>
                                            <option value="win_close">Victoria Ajustada (6-4 / 6-5)</option>
                                            <option value="loss_close">Derrota Ajustada (4-6 / 5-6)</option>
                                            <option value="loss_huge">Derrota Contundente (0-6 / 1-6 / 2-6)</option>
                                        </select>
                                    </div>
                                </div>

                                <!-- Live Simulation Output Card -->
                                <div id="sp-sim-output" style="background: rgba(0,0,0,0.45); border: 1.5px solid rgba(204,255,0,0.3); border-radius: 20px; padding: 22px; text-align: center;">
                                    <div style="font-size: 0.72rem; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">VARIACIÓN ESTIMADA</div>
                                    <div id="sp-sim-delta-badge" style="font-size: 2.2rem; font-weight: 950; color: #CCFF00; line-height: 1; margin-bottom: 6px;">+0.024</div>
                                    <div style="font-size: 0.85rem; color: #fff; margin-bottom: 16px;">
                                        Nivel proyectado: <b id="sp-sim-projected" style="color: #CCFF00; font-size: 1.1rem;">3.524</b>
                                    </div>
                                    
                                    <div style="display: flex; justify-content: center; gap: 8px; margin-bottom: 14px;">
                                        <span id="sp-sim-perf-chip" class="sp-stat-pill" style="background: rgba(204,255,0,0.15); color: #CCFF00;">60% Rend: +0.018</span>
                                        <span id="sp-sim-diff-chip" class="sp-stat-pill" style="background: rgba(56,189,248,0.15); color: #38bdf8;">40% Dif: +0.006</span>
                                    </div>

                                    <p id="sp-sim-verdict" style="font-size: 0.8rem; color: #cbd5e1; line-height: 1.5; margin: 0; font-family: 'Inter', sans-serif;">
                                        ¡Gran partido! Has dominado el cruce con holgura frente a rivales de tu categoría, sumando fuerte en rendimiento.
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>

                    <!-- ========================================== -->
                    <!-- TAB 2: RANKING OFICIAL SOMOSPADEL          -->
                    <!-- ========================================== -->
                    <div id="sp-help-panel-ranking" class="sp-help-panel">
                        
                        <div class="sp-card sp-card-highlight">
                            <div class="sp-card-header">
                                <div class="sp-card-icon" style="background: rgba(245,158,11,0.2); color: #f59e0b;">
                                    <i class="fas fa-trophy"></i>
                                </div>
                                <div>
                                    <h3 class="sp-card-title">Sistema de Puntuación Oficial</h3>
                                    <div class="sp-card-subtitle">3 Puntos por cada victoria para coronar a los Reyes del año</div>
                                </div>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; margin-bottom: 20px;">
                                <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 20px; text-align: center;">
                                    <div style="font-size: 2.5rem; font-weight: 950; color: #CCFF00; line-height: 1; margin-bottom: 4px;">+3 PTS</div>
                                    <div style="font-size: 0.95rem; font-weight: 850; color: #fff; margin-bottom: 6px;">Por Victoria Oficial</div>
                                    <div style="font-size: 0.8rem; color: #94a3b8;">Otorgados en cada partido ganado en Americanas, Entrenos y Partidas Abiertas.</div>
                                </div>
                                <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 20px; text-align: center;">
                                    <div style="font-size: 2.5rem; font-weight: 950; color: #38bdf8; line-height: 1; margin-bottom: 4px;">+1 PT</div>
                                    <div style="font-size: 0.95rem; font-weight: 850; color: #fff; margin-bottom: 6px;">Empate / Participación</div>
                                    <div style="font-size: 0.8rem; color: #94a3b8;">Premio a la regularidad y deportividad por completar los torneos convocados.</div>
                                </div>
                                <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 20px; text-align: center;">
                                    <div style="font-size: 2.5rem; font-weight: 950; color: #f59e0b; line-height: 1; margin-bottom: 4px;">ANUAL</div>
                                    <div style="font-size: 0.95rem; font-weight: 850; color: #fff; margin-bottom: 6px;">Ciclo de Temporada</div>
                                    <div style="font-size: 0.8rem; color: #94a3b8;">De Enero a Diciembre. A final de temporada se entregan los Trofeos SomosPadel.</div>
                                </div>
                            </div>
                        </div>

                        <!-- Clasificaciones y Filtros -->
                        <div class="sp-card">
                            <div class="sp-card-header">
                                <div class="sp-card-icon" style="background: rgba(16,185,129,0.15); color: #10b981;">
                                    <i class="fas fa-filter"></i>
                                </div>
                                <div>
                                    <h3 class="sp-card-title">Cuadros & Filtros de Clasificación</h3>
                                    <div class="sp-card-subtitle">Dos rankings independientes con segmentación por categoría</div>
                                </div>
                            </div>

                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; margin-bottom: 24px;">
                                <div style="background: rgba(255,255,255,0.02); border-left: 4px solid #CCFF00; padding: 16px; border-radius: 12px;">
                                    <div style="font-weight: 900; color: #fff; font-size: 0.95rem; margin-bottom: 4px;">🏆 Ranking de Americanas</div>
                                    <div style="font-size: 0.82rem; color: #94a3b8; line-height: 1.5;">Registra tus puntos, victorias y visitas a Pista 1 en torneos dinámicos de fin de semana y entre semana.</div>
                                </div>
                                <div style="background: rgba(255,255,255,0.02); border-left: 4px solid #38bdf8; padding: 16px; border-radius: 12px;">
                                    <div style="font-weight: 900; color: #fff; font-size: 0.95rem; margin-bottom: 4px;">🎯 Ranking de Entrenos</div>
                                    <div style="font-size: 0.82rem; color: #94a3b8; line-height: 1.5;">Puntuación específica acumulada en sesiones de tecnificación y partidos guiados por nivel.</div>
                                </div>
                            </div>

                            <div style="font-size: 0.75rem; font-weight: 900; color: #64748b; text-transform: uppercase; margin-bottom: 10px;">Filtros de Cuadro Disponibles:</div>
                            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                                <span class="sp-chip" style="background: rgba(59,130,246,0.1); border-color: rgba(59,130,246,0.3); color: #60a5fa;"><i class="fas fa-mars"></i> Masculino</span>
                                <span class="sp-chip" style="background: rgba(236,72,153,0.1); border-color: rgba(236,72,153,0.3); color: #f472b6;"><i class="fas fa-venus"></i> Femenino</span>
                                <span class="sp-chip" style="background: rgba(168,85,247,0.1); border-color: rgba(168,85,247,0.3); color: #c084fc;"><i class="fas fa-venus-mars"></i> Mixto</span>
                                <span class="sp-chip" style="background: rgba(204,255,0,0.1); border-color: rgba(204,255,0,0.3); color: #CCFF00;"><i class="fas fa-globe"></i> General Absoluto</span>
                            </div>
                        </div>

                        <!-- Métricas Oficiales -->
                        <div class="sp-card">
                            <div class="sp-card-header">
                                <div class="sp-card-icon" style="background: rgba(59,130,246,0.15); color: #3b82f6;">
                                    <i class="fas fa-chart-bar"></i>
                                </div>
                                <div>
                                    <h3 class="sp-card-title">Métricas Oficiales de tu Ficha</h3>
                                    <div class="sp-card-subtitle">Indicadores avanzados que miden tu consistencia y nivel competitivo</div>
                                </div>
                            </div>

                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px;">
                                <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 14px;">
                                    <div style="font-size: 0.72rem; color: #94a3b8; font-weight: 850;">PJ (Partidos Jugados)</div>
                                    <div style="font-size: 1.2rem; font-weight: 950; color: #fff; margin-top: 4px;">Volumen Total</div>
                                    <div style="font-size: 0.75rem; color: #64748b; margin-top: 4px;">Experiencia acumulada en pista.</div>
                                </div>
                                <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 14px;">
                                    <div style="font-size: 0.72rem; color: #94a3b8; font-weight: 850;">PG / PP</div>
                                    <div style="font-size: 1.2rem; font-weight: 950; color: #22c55e; margin-top: 4px;">Victorias / Derrotas</div>
                                    <div style="font-size: 0.75rem; color: #64748b; margin-top: 4px;">Tu balance directo de éxito.</div>
                                </div>
                                <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 14px;">
                                    <div style="font-size: 0.72rem; color: #94a3b8; font-weight: 850;">Dif. Juegos (+/-)</div>
                                    <div style="font-size: 1.2rem; font-weight: 950; color: #38bdf8; margin-top: 4px;">Balance de Juegos</div>
                                    <div style="font-size: 0.75rem; color: #64748b; margin-top: 4px;">Criterio oficial de desempate.</div>
                                </div>
                                <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 14px;">
                                    <div style="font-size: 0.72rem; color: #94a3b8; font-weight: 850;">👑 Pista 1 (Rey de Pista)</div>
                                    <div style="font-size: 1.2rem; font-weight: 950; color: #f59e0b; margin-top: 4px;">Visitas al Trono</div>
                                    <div style="font-size: 0.75rem; color: #64748b; margin-top: 4px;">Rondas defendidas en Pista 1.</div>
                                </div>
                                <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 14px;">
                                    <div style="font-size: 0.72rem; color: #94a3b8; font-weight: 850;">Win Rate %</div>
                                    <div style="font-size: 1.2rem; font-weight: 950; color: #CCFF00; margin-top: 4px;">% Efectividad</div>
                                    <div style="font-size: 0.75rem; color: #64748b; margin-top: 4px;">Porcentaje de victorias totales.</div>
                                </div>
                            </div>
                        </div>

                    </div>

                    <!-- ========================================== -->
                    <!-- TAB 3: FORMATOS DE JUEGO REALES            -->
                    <!-- ========================================== -->
                    <div id="sp-help-panel-formats" class="sp-help-panel">
                        
                        <!-- 1. Twister -->
                        <div class="sp-card" style="border-left: 4px solid #0ea5e9;">
                            <div class="sp-card-header">
                                <div class="sp-card-icon" style="background: rgba(14,165,233,0.15); color: #0ea5e9;">
                                    <i class="fas fa-wind"></i>
                                </div>
                                <div>
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <h3 class="sp-card-title">Americanas Twister</h3>
                                        <span class="sp-stat-pill" style="background: rgba(14,165,233,0.2); color: #38bdf8;">Rotación Individual</span>
                                    </div>
                                    <div class="sp-card-subtitle">Conoce a toda la comunidad jugando con un compañero diferente cada ronda</div>
                                </div>
                            </div>

                            <p style="font-size: 0.88rem; color: #cbd5e1; line-height: 1.6; margin-bottom: 16px;">
                                En el formato Twister te inscribes de forma <b>individual</b>. El algoritmo genera emparejamientos dinámicos de 15-20 minutos. Cada juego anotado en tu pista suma a tu casillero personal.
                            </p>

                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px;">
                                <div style="background: rgba(255,255,255,0.02); padding: 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06);">
                                    <b style="color: #38bdf8;">🔄 Rotación Continua:</b> Nunca repites compañero en el mismo torneo.
                                </div>
                                <div style="background: rgba(255,255,255,0.02); padding: 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06);">
                                    <b style="color: #38bdf8;">🎯 Puntuación Personal:</b> Todos tus juegos ganados se suman en tu perfil.
                                </div>
                                <div style="background: rgba(255,255,255,0.02); padding: 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06);">
                                    <b style="color: #38bdf8;">👑 Podio Individual:</b> El jugador con más juegos acumulados es el Campeón.
                                </div>
                            </div>
                        </div>

                        <!-- 2. Pozo / Pareja Fija -->
                        <div class="sp-card" style="border-left: 4px solid #8b5cf6;">
                            <div class="sp-card-header">
                                <div class="sp-card-icon" style="background: rgba(139,92,246,0.15); color: #8b5cf6;">
                                    <i class="fas fa-chess-king"></i>
                                </div>
                                <div>
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <h3 class="sp-card-title">Americanas Pozo (Pareja Fija)</h3>
                                        <span class="sp-stat-pill" style="background: rgba(139,92,246,0.2); color: #a78bfa;">Escalera al Rey de la Pista</span>
                                    </div>
                                    <div class="sp-card-subtitle">Compite con tu compañero habitual en una batalla sin tregua por coronar la Pista 1</div>
                                </div>
                            </div>

                            <p style="font-size: 0.88rem; color: #cbd5e1; line-height: 1.6; margin-bottom: 16px;">
                                Juegas todas las rondas con la misma pareja. La pista en la que juegas depende de tus resultados en la ronda anterior:
                            </p>

                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-bottom: 14px;">
                                <div style="background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.2); padding: 14px; border-radius: 14px;">
                                    <div style="color: #22c55e; font-weight: 900; font-size: 0.85rem; margin-bottom: 4px;">
                                        <i class="fas fa-arrow-up"></i> GANAS EL PARTIDO
                                    </div>
                                    <div style="font-size: 0.8rem; color: #cbd5e1;"><b>Subes de pista</b> hacia la Pista 1 (Rey de la Pista). Si ya estás en Pista 1, retienes el trono.</div>
                                </div>
                                <div style="background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); padding: 14px; border-radius: 14px;">
                                    <div style="color: #ef4444; font-weight: 900; font-size: 0.85rem; margin-bottom: 4px;">
                                        <i class="fas fa-arrow-down"></i> PIERDES EL PARTIDO
                                    </div>
                                    <div style="font-size: 0.8rem; color: #cbd5e1;"><b>Bajas de pista</b> hacia la pista inferior. Si estás en la última pista, defiendes tu puesto.</div>
                                </div>
                            </div>
                            <div style="background: rgba(204,255,0,0.08); border: 1px solid rgba(204,255,0,0.25); padding: 14px; border-radius: 14px; text-align: center;">
                                <b style="color: #CCFF00;">👑 CONDICIÓN DE VICTORIA:</b> La pareja que juegue y gane el partido de la última ronda en la <b>Pista 1</b> se corona Campeona del Pozo.
                            </div>
                        </div>

                        <!-- 3. Entrenos por Nivel -->
                        <div class="sp-card" style="border-left: 4px solid #10b981;">
                            <div class="sp-card-header">
                                <div class="sp-card-icon" style="background: rgba(16,185,129,0.15); color: #10b981;">
                                    <i class="fas fa-bullseye"></i>
                                </div>
                                <div>
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <h3 class="sp-card-title">Entrenos por Nivel</h3>
                                        <span class="sp-stat-pill" style="background: rgba(16,185,129,0.2); color: #34d399;">90 Minutos • Nivel Homogéneo</span>
                                    </div>
                                    <div class="sp-card-subtitle">Sesiones de tecnificación táctica y partidos guiados para acelerar tu progresión</div>
                                </div>
                            </div>

                            <p style="font-size: 0.88rem; color: #cbd5e1; line-height: 1.6; margin: 0;">
                                Grupos reducidos de 4 a 8 jugadores con nivel idéntico. Se trabajan automatismos de pared, colocación táctica de globo, transiciones defensa-ataque y situaciones de alta presión (Punto de Oro) con supervisión técnica.
                            </p>
                        </div>

                        <!-- 4. Partidas Abiertas -->
                        <div class="sp-card" style="border-left: 4px solid #f59e0b;">
                            <div class="sp-card-header">
                                <div class="sp-card-icon" style="background: rgba(245,158,11,0.15); color: #f59e0b;">
                                    <i class="fas fa-handshake"></i>
                                </div>
                                <div>
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <h3 class="sp-card-title">Partidas Abiertas Autogestionadas</h3>
                                        <span class="sp-stat-pill" style="background: rgba(245,158,11,0.2); color: #fbbf24;">4/4 Plazas • Matchmaking Libre</span>
                                    </div>
                                    <div class="sp-card-subtitle">Abre un partido o súmate a uno existente en tu club favorito</div>
                                </div>
                            </div>

                            <p style="font-size: 0.88rem; color: #cbd5e1; line-height: 1.6; margin: 0;">
                                Encuentra partidos disponibles filtrando por tu club preferido, horario y franja de nivel (ej. 3.40 a 3.80). En cuanto se completan las 4 plazas (4/4), la pista queda confirmada automáticamente en la app.
                            </p>
                        </div>

                    </div>

                    <!-- ========================================== -->
                    <!-- TAB 4: EN PISTA & MODO TV                  -->
                    <!-- ========================================== -->
                    <div id="sp-help-panel-ops" class="sp-help-panel">
                        
                        <!-- Flujo de una Ronda Timeline -->
                        <div class="sp-card">
                            <div class="sp-card-header">
                                <div class="sp-card-icon" style="background: rgba(204,255,0,0.15); color: #CCFF00;">
                                    <i class="fas fa-stopwatch"></i>
                                </div>
                                <div>
                                    <h3 class="sp-card-title">Flujo de una Ronda en Vivo</h3>
                                    <div class="sp-card-subtitle">Cómo funciona la dinámica de juego desde que suena la bocina</div>
                                </div>
                            </div>

                            <div style="margin-top: 18px;">
                                <div class="sp-timeline-step">
                                    <div class="sp-timeline-badge">1</div>
                                    <div style="font-weight: 900; color: #fff; font-size: 0.95rem; margin-bottom: 4px;">Aviso de Ronda & Pista</div>
                                    <div style="font-size: 0.82rem; color: #94a3b8; line-height: 1.5;">Tu móvil te notifica tu número de pista, tu compañero asignado y tus rivales. Tienes 2-3 minutos para ocupar la pista.</div>
                                </div>

                                <div class="sp-timeline-step">
                                    <div class="sp-timeline-badge">2</div>
                                    <div style="font-weight: 900; color: #fff; font-size: 0.95rem; margin-bottom: 4px;">Sonido de Inicio & Juego (15-20 min)</div>
                                    <div style="font-size: 0.82rem; color: #94a3b8; line-height: 1.5;">Juego continuo sin descanso. A 40-40 se disputa siempre <b>Punto de Oro</b> (la pareja restadora decide quién resta).</div>
                                </div>

                                <div class="sp-timeline-step">
                                    <div class="sp-timeline-badge">3</div>
                                    <div style="font-weight: 900; color: #fff; font-size: 0.95rem; margin-bottom: 4px;">Anotación Móvil Inmediata</div>
                                    <div style="font-size: 0.82rem; color: #94a3b8; line-height: 1.5;">Al sonar la bocina de fin de tiempo, cualquier jugador abre la Torre de Control en su teléfono e introduce el resultado final (ej. 5-3).</div>
                                </div>

                                <div class="sp-timeline-step">
                                    <div class="sp-timeline-badge">4</div>
                                    <div style="font-weight: 900; color: #fff; font-size: 0.95rem; margin-bottom: 4px;">Smart Matchmaking Instantáneo</div>
                                    <div style="font-size: 0.82rem; color: #94a3b8; line-height: 1.5;">El sistema cruza los resultados de todas las pistas, actualiza la clasificación y genera la siguiente ronda en milisegundos.</div>
                                </div>
                            </div>
                        </div>

                        <!-- Modo TV Center Court -->
                        <div class="sp-card" style="border-color: rgba(239,68,68,0.3); background: linear-gradient(135deg, rgba(239,68,68,0.06) 0%, rgba(6,8,14,0.7) 100%);">
                            <div class="sp-card-header">
                                <div class="sp-card-icon" style="background: rgba(239,68,68,0.2); color: #ef4444;">
                                    <i class="fas fa-tv"></i>
                                </div>
                                <div>
                                    <h3 class="sp-card-title">Modo TV (Center Court Screen)</h3>
                                    <div class="sp-card-subtitle">Vista panorámica de alto impacto para Smart TVs, tablets y monitores de club</div>
                                </div>
                            </div>

                            <p style="font-size: 0.88rem; color: #cbd5e1; line-height: 1.6; margin-bottom: 18px;">
                                Diseñado para proyectarse en la terraza, bar o pista central del club. Permite a todos los jugadores seguir el torneo sin tocar el móvil.
                            </p>

                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px;">
                                <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 14px;">
                                    <b style="color: #ef4444;"><i class="fas fa-sync-alt"></i> Rotación Automática:</b> Alterna de forma suave entre marcadores en vivo, clasificación provisional y próximos cruces.
                                </div>
                                <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 14px;">
                                    <b style="color: #ef4444;"><i class="fas fa-clock"></i> Cronómetro Sincronizado:</b> Cuenta atrás gigante con alerta acústica sincronizada con la Torre de Control.
                                </div>
                                <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 14px;">
                                    <b style="color: #ef4444;"><i class="fas fa-eye"></i> Tipografía Gigante:</b> Contraste optimizado para ser legible a más de 15 metros de distancia.
                                </div>
                            </div>
                        </div>

                    </div>

                    <!-- ========================================== -->
                    <!-- TAB 5: COMUNIDAD & ALERTA SOS              -->
                    <!-- ========================================== -->
                    <div id="sp-help-panel-community" class="sp-help-panel">
                        
                        <!-- Alerta SOS Express -->
                        <div class="sp-card" style="border-color: rgba(236,72,153,0.4); background: linear-gradient(135deg, rgba(236,72,153,0.08) 0%, rgba(6,8,14,0.7) 100%);">
                            <div class="sp-card-header">
                                <div class="sp-card-icon" style="background: rgba(236,72,153,0.2); color: #ec4899;">
                                    <i class="fas fa-ambulance"></i>
                                </div>
                                <div>
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <h3 class="sp-card-title">Alerta SOS / Vacante Express</h3>
                                        <span class="sp-stat-pill" style="background: rgba(236,72,153,0.25); color: #f472b6;">¡Nadie se queda sin jugar!</span>
                                    </div>
                                    <div class="sp-card-subtitle">Sistema inteligente para cubrir bajas imprevistas de última hora en 1 clic</div>
                                </div>
                            </div>

                            <p style="font-size: 0.88rem; color: #cbd5e1; line-height: 1.6; margin-bottom: 16px;">
                                Si un jugador sufre una lesión o causa baja a escasos minutos del inicio, el sistema dispara automáticamente una <b>Alerta SOS de alta visibilidad</b> a los miembros de la comunidad con nivel afín.
                            </p>

                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px;">
                                <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 14px;">
                                    <b style="color: #ec4899;">⚡ Notificación Push Prioritaria:</b> Se notifica a jugadores activos de la zona con el nivel exacto requerido.
                                </div>
                                <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 14px;">
                                    <b style="color: #ec4899;">👆 Reserva en 1-Clic:</b> El primer jugador que confirma cubre la plaza sin esperas burocráticas.
                                </div>
                            </div>
                        </div>

                    </div>

                    <!-- ========================================== -->
                    <!-- TAB 6: RADAR RPG & ANÁLISIS DE ATRIBUTOS   -->
                    <!-- ========================================== -->
                    <div id="sp-help-panel-radar" class="sp-help-panel">
                        
                        <div class="sp-card">
                            <div class="sp-card-header">
                                <div class="sp-card-icon" style="background: rgba(16,185,129,0.15); color: #10b981;">
                                    <i class="fas fa-chart-pie"></i>
                                </div>
                                <div>
                                    <h3 class="sp-card-title">Los 5 Atributos RPG de tu Pala</h3>
                                    <div class="sp-card-subtitle">Evaluación multidimensional de tus fortalezas técnicas y tácticas</div>
                                </div>
                            </div>

                            <p style="font-size: 0.88rem; color: #cbd5e1; line-height: 1.6; margin-bottom: 22px;">
                                Al registrar partidos, nuestro motor analiza tus golpes y resultados para perfilar tu <b>Tarjeta de Jugador SomosPadel</b> con 5 estadísticas de estilo de juego:
                            </p>

                            <!-- Level Selector for Radar -->
                            <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 22px;">
                                <span style="font-size: 0.75rem; font-weight: 850; color: #94a3b8; align-self: center; margin-right: 6px;">PREVISUALIZAR PERFIL SEGÚN NIVEL:</span>
                                <button class="sp-chip" onclick="window.ControlTowerView.updateHelpRadar(2.5)" style="cursor: pointer;">Bronze (2.5)</button>
                                <button class="sp-chip" onclick="window.ControlTowerView.updateHelpRadar(3.2)" style="cursor: pointer;">Silver (3.2)</button>
                                <button class="sp-chip" onclick="window.ControlTowerView.updateHelpRadar(3.8)" style="cursor: pointer; border-color: #f59e0b; color: #f59e0b;">Gold (3.8)</button>
                                <button class="sp-chip" onclick="window.ControlTowerView.updateHelpRadar(4.2)" style="cursor: pointer;">Platinum (4.2)</button>
                                <button class="sp-chip" onclick="window.ControlTowerView.updateHelpRadar(4.8)" style="cursor: pointer; border-color: #00E36D; color: #00E36D;">Elite (4.8+)</button>
                            </div>

                            <!-- Visual Attribute Bars -->
                            <div style="display: grid; gap: 14px;">
                                <div>
                                    <div style="display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 900; margin-bottom: 6px;">
                                        <span><i class="fas fa-bolt" style="color: #ef4444; width: 20px;"></i> ATAQUE (Volea, Bajada de Pared & Presión)</span>
                                        <span id="sp-radar-val-atk" style="color: #ef4444;">76%</span>
                                    </div>
                                    <div style="height: 8px; background: rgba(255,255,255,0.06); border-radius: 999px; overflow: hidden;">
                                        <div id="sp-radar-bar-atk" style="height: 100%; width: 76%; background: #ef4444; border-radius: 999px; transition: width 0.4s ease;"></div>
                                    </div>
                                </div>

                                <div>
                                    <div style="display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 900; margin-bottom: 6px;">
                                        <span><i class="fas fa-shield-alt" style="color: #3b82f6; width: 20px;"></i> DEFENSA (Pared de Fondo, Doble Pared & Globos)</span>
                                        <span id="sp-radar-val-def" style="color: #3b82f6;">78%</span>
                                    </div>
                                    <div style="height: 8px; background: rgba(255,255,255,0.06); border-radius: 999px; overflow: hidden;">
                                        <div id="sp-radar-bar-def" style="height: 100%; width: 78%; background: #3b82f6; border-radius: 999px; transition: width 0.4s ease;"></div>
                                    </div>
                                </div>

                                <div>
                                    <div style="display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 900; margin-bottom: 6px;">
                                        <span><i class="fas fa-magic" style="color: #a855f7; width: 20px;"></i> TÉCNICA (Efectos, Precisión & Control de Errores)</span>
                                        <span id="sp-radar-val-tec" style="color: #a855f7;">74%</span>
                                    </div>
                                    <div style="height: 8px; background: rgba(255,255,255,0.06); border-radius: 999px; overflow: hidden;">
                                        <div id="sp-radar-bar-tec" style="height: 100%; width: 74%; background: #a855f7; border-radius: 999px; transition: width 0.4s ease;"></div>
                                    </div>
                                </div>

                                <div>
                                    <div style="display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 900; margin-bottom: 6px;">
                                        <span><i class="fas fa-heartbeat" style="color: #10b981; width: 20px;"></i> FÍSICO (Desplazamiento, Reacción & Resistencia)</span>
                                        <span id="sp-radar-val-fis" style="color: #10b981;">80%</span>
                                    </div>
                                    <div style="height: 8px; background: rgba(255,255,255,0.06); border-radius: 999px; overflow: hidden;">
                                        <div id="sp-radar-bar-fis" style="height: 100%; width: 80%; background: #10b981; border-radius: 999px; transition: width 0.4s ease;"></div>
                                    </div>
                                </div>

                                <div>
                                    <div style="display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 900; margin-bottom: 6px;">
                                        <span><i class="fas fa-meteor" style="color: #f59e0b; width: 20px;"></i> REMATE (Definición Aérea, Smash x3 & Traérsela)</span>
                                        <span id="sp-radar-val-rem" style="color: #f59e0b;">72%</span>
                                    </div>
                                    <div style="height: 8px; background: rgba(255,255,255,0.06); border-radius: 999px; overflow: hidden;">
                                        <div id="sp-radar-bar-rem" style="height: 100%; width: 72%; background: #f59e0b; border-radius: 999px; transition: width 0.4s ease;"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    <!-- ========================================== -->
                    <!-- TAB 7: PREGUNTAS FRECUENTES (FAQ)          -->
                    <!-- ========================================== -->
                    <div id="sp-help-panel-faq" class="sp-help-panel">
                        
                        <div class="sp-card sp-card-highlight">
                            <div class="sp-card-header">
                                <div class="sp-card-icon" style="background: rgba(204,255,0,0.15); color: #CCFF00;">
                                    <i class="fas fa-question-circle"></i>
                                </div>
                                <div>
                                    <h3 class="sp-card-title">Preguntas Frecuentes de la Comunidad</h3>
                                    <div class="sp-card-subtitle">Respuestas claras y directas a las consultas más habituales</div>
                                </div>
                            </div>

                            <div style="margin-top: 18px;">
                                
                                <div class="sp-faq-item">
                                    <div class="sp-faq-question" onclick="window.ControlTowerView.toggleHelpFaq(1)">
                                        <span>¿Cómo y cuándo se actualiza mi nivel SomosPadel?</span>
                                        <i id="sp-faq-icon-1" class="fas fa-chevron-down sp-faq-icon"></i>
                                    </div>
                                    <div id="sp-faq-ans-1" class="sp-faq-answer">
                                        Tu nivel se recalcula de forma automática al finalizar cada evento oficial. El algoritmo ELO Smart analiza cada partido ponderando el 60% por diferencia de juegos y el 40% por la dificultad de tus rivales, aplicando ajustes entre ±0.010 y ±0.030 décimas por encuentro.
                                    </div>
                                </div>

                                <div class="sp-faq-item">
                                    <div class="sp-faq-question" onclick="window.ControlTowerView.toggleHelpFaq(2)">
                                        <span>¿Puedo apuntarme a una Americana Twister sin tener pareja?</span>
                                        <i id="sp-faq-icon-2" class="fas fa-chevron-down sp-faq-icon"></i>
                                    </div>
                                    <div id="sp-faq-ans-2" class="sp-faq-answer">
                                        ¡Totalmente! Las Americanas Twister son de inscripción individual. En cada ronda el algoritmo te asigna una pareja distinta y rivales de tu misma categoría. Es el formato estrella para conocer nuevos jugadores.
                                    </div>
                                </div>

                                <div class="sp-faq-item">
                                    <div class="sp-faq-question" onclick="window.ControlTowerView.toggleHelpFaq(3)">
                                        <span>¿Qué diferencia hay entre una Americana Twister y un Pozo?</span>
                                        <i id="sp-faq-icon-3" class="fas fa-chevron-down sp-faq-icon"></i>
                                    </div>
                                    <div id="sp-faq-ans-3" class="sp-faq-answer">
                                        En el <b>Twister</b> cambias de pareja cada ronda y sumas juegos individuales. En el <b>Pozo</b> juegas todo el torneo con la misma pareja en una escalera dinámica: ganar te hace subir hacia la Pista 1 y perder te hace bajar de pista. Quien gana la última ronda en Pista 1 se proclama campeón.
                                    </div>
                                </div>

                                <div class="sp-faq-item">
                                    <div class="sp-faq-question" onclick="window.ControlTowerView.toggleHelpFaq(4)">
                                        <span>Si pierdo un partido muy ajustado (ej. 5-6), ¿pierdo muchas décimas?</span>
                                        <i id="sp-faq-icon-4" class="fas fa-chevron-down sp-faq-icon"></i>
                                    </div>
                                    <div id="sp-faq-ans-4" class="sp-faq-answer">
                                        No. Gracias al 60% de peso por rendimiento en juegos, un 5-6 apenas supone una variación negativa mínima (~ -0.005). Si además tus rivales eran de mayor nivel que tú, el 40% de dificultad puede hacer que tu ajuste sea prácticamente 0.000.
                                    </div>
                                </div>

                                <div class="sp-faq-item">
                                    <div class="sp-faq-question" onclick="window.ControlTowerView.toggleHelpFaq(5)">
                                        <span>¿Qué ocurre si hay una baja de última hora en un evento?</span>
                                        <i id="sp-faq-icon-5" class="fas fa-chevron-down sp-faq-icon"></i>
                                    </div>
                                    <div id="sp-faq-ans-5" class="sp-faq-answer">
                                        Se activa de inmediato el protocolo <b>Alerta SOS / Vacante Express</b>. La app notifica a todos los jugadores del mismo nivel disponibles en la zona para que cualquiera pueda cubrir la posición en 1 clic y la pista comience puntual.
                                    </div>
                                </div>

                                <div class="sp-faq-item">
                                    <div class="sp-faq-question" onclick="window.ControlTowerView.toggleHelpFaq(6)">
                                        <span>¿Cómo se consiguen puntos para el Ranking Oficial Anual?</span>
                                        <i id="sp-faq-icon-6" class="fas fa-chevron-down sp-faq-icon"></i>
                                    </div>
                                    <div id="sp-faq-ans-6" class="sp-faq-answer">
                                        Cada victoria en partido oficial de Americana o Partida Abierta otorga 3 puntos netos. Los empates o completar torneos otorgan 1 punto de deportividad. Los puntos se acumulan durante la temporada natural (Enero a Diciembre).
                                    </div>
                                </div>

                                <div class="sp-faq-item">
                                    <div class="sp-faq-question" onclick="window.ControlTowerView.toggleHelpFaq(7)">
                                        <span>¿Cómo funciona el Punto de Oro en caso de 40-40?</span>
                                        <i id="sp-faq-icon-7" class="fas fa-chevron-down sp-faq-icon"></i>
                                    </div>
                                    <div id="sp-faq-ans-7" class="sp-faq-answer">
                                        No hay ventajas. Al llegar a 40-40 se juega un punto definitivo ("Punto de Oro"). La pareja que resta tiene el derecho reglamentario a elegir si el saque va al lado derecho o izquierdo. Quien gane esa bola se anota el juego.
                                    </div>
                                </div>

                                <div class="sp-faq-item">
                                    <div class="sp-faq-question" onclick="window.ControlTowerView.toggleHelpFaq(8)">
                                        <span>¿Cómo abro el Modo TV en una pantalla gigante o tablet?</span>
                                        <i id="sp-faq-icon-8" class="fas fa-chevron-down sp-faq-icon"></i>
                                    </div>
                                    <div id="sp-faq-ans-8" class="sp-faq-answer">
                                        Abre el navegador web de la Smart TV o tablet, entra en SomosPadel con la cuenta del evento y pulsa en el botón "Modo TV". La pantalla entrará en modo panorámico con pantalla completa, rotación continua y cronómetro sincronizado.
                                    </div>
                                </div>

                            </div>
                        </div>

                    </div>

                    <!-- AUTO-INITIALIZATION TRIGGER -->
                    <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" style="display:none;" onload="(function(){ if(window.ControlTowerView && window.ControlTowerView.initHelpGuide) window.ControlTowerView.initHelpGuide(); })()">

                </div>
            `;
        }

        /**
         * Initializes dynamic states for categories, simulator and radar
         */
        initHelpGuide() {
            try {
                this.selectHelpCategory('gold');
                this.calculateEloSimulation();
                this.updateHelpRadar(3.8);
            } catch (e) {
                console.warn("[ControlTowerView] initHelpGuide notice:", e);
            }
        }

        /**
         * Switches the active tab inside the Help Guide
         */
        switchHelpTab(tabKey) {
            try {
                const container = document.querySelector('.sp-help-container');
                if (!container) return;

                // Update tab buttons
                container.querySelectorAll('.sp-help-nav-btn').forEach(btn => {
                    const match = btn.getAttribute('data-tab') === tabKey;
                    if (match) {
                        btn.classList.add('sp-tab-active');
                    } else {
                        btn.classList.remove('sp-tab-active');
                    }
                });

                // Update panels
                container.querySelectorAll('.sp-help-panel').forEach(panel => {
                    if (panel.id === `sp-help-panel-${tabKey}`) {
                        panel.style.display = 'block';
                    } else {
                        panel.style.display = 'none';
                    }
                });
            } catch (e) {
                console.error("[ControlTowerView] switchHelpTab error:", e);
            }
        }

        /**
         * Dynamic category inspector in Level Tab
         */
        selectHelpCategory(catKey) {
            try {
                const categories = {
                    elite: {
                        name: 'ELITE',
                        range: '4.50 a 7.50',
                        stars: '★★★★★',
                        color: '#00E36D',
                        bg: 'rgba(0, 227, 109, 0.12)',
                        border: 'rgba(0, 227, 109, 0.45)',
                        icon: 'fa-crown',
                        summary: 'Competición Federada & Primera Categoría',
                        desc: 'Jugadores con técnica depurada, ritmo de bola vertiginoso y toma de decisiones tácticas óptima bajo máxima presión. Dominan transiciones rápidas y juego aéreo.',
                        shots: ['Remate x3 y x4 desde tres cuartos de pista', 'Bajadas de pared agresivas a la verja y esquinas', 'Bloqueo reflejo en red y chiquitas con ángulo', 'Defensa de dobles paredes y contraparedes precisas'],
                        tips: 'Para consolidarte en Elite necesitas alta regularidad ante jugadores de 4.50+, dominar los Puntos de Oro y conquistar la Pista 1 en torneos Pozo.'
                    },
                    platinum: {
                        name: 'PLATINUM',
                        range: '4.00 a 4.49',
                        stars: '★★★★☆',
                        color: '#38bdf8',
                        bg: 'rgba(56, 189, 248, 0.12)',
                        border: 'rgba(56, 189, 248, 0.45)',
                        icon: 'fa-gem',
                        summary: 'Nivel Avanzado Consolidado',
                        desc: 'Jugadores con amplia experiencia de competición, velocidad de reacción notable y recursos consolidados en todas las fases del juego.',
                        shots: ['Víbora profunda con aceleración y efecto cortado', 'Voleas con peso dirigidas a los pies del rival', 'Lectura de juego para anticipar y castigar el remate', 'Globos tácticos con altura y profundidad milimétrica'],
                        tips: 'Para dar el salto a Elite, minimiza los errores no forzados en situaciones de contraataque y gana agresividad en la definición aérea.'
                    },
                    gold: {
                        name: 'GOLD',
                        range: '3.50 a 3.99',
                        stars: '★★★☆☆',
                        color: '#f59e0b',
                        bg: 'rgba(245, 158, 11, 0.12)',
                        border: 'rgba(245, 158, 11, 0.45)',
                        icon: 'fa-medal',
                        summary: 'Nivel Intermedio-Alto Competitivo',
                        desc: 'La categoría más vibrante y disputada de la comunidad SomosPadel. Duelos intensos con gran ritmo, colocación y sincronización de pareja.',
                        shots: ['Salidas de pared de fondo consistentes', 'Bandejas profundas para retener la red', 'Voleas ofensivas al espacio libre o al cuerpo', 'Saque con intención y subida coordinada a la red'],
                        tips: 'Para ascender a Platinum, trabaja la paciencia en peloteos largos de fondo, la defensa de paredes difíciles y la aceleración en bolas francas.'
                    },
                    silver: {
                        name: 'SILVER',
                        range: '3.00 a 3.49',
                        stars: '★★☆☆☆',
                        color: '#cbd5e1',
                        bg: 'rgba(203, 213, 225, 0.12)',
                        border: 'rgba(203, 213, 225, 0.35)',
                        icon: 'fa-shield-alt',
                        summary: 'Nivel Intermedio Rodado',
                        desc: 'Jugadores con buena regularidad en peloteo continuo, saques fiables y capacidad para sostener puntos en fondo y disputar la red.',
                        shots: ['Peloteo seguro de fondo con control de altura', 'Volea de colocación al centro de la pista', 'Uso inteligente del globo para ganar posición', 'Posicionamiento básico coordinado con el compañero'],
                        tips: 'Para alcanzar Gold, atrévete a apoyarte más en las paredes de cristal, gana confianza en la volea de ataque y participa en Entrenos por Nivel.'
                    },
                    bronze: {
                        name: 'BRONZE',
                        range: '< 3.00 (0.00 — 2.99)',
                        stars: '★☆☆☆☆',
                        color: '#f97316',
                        bg: 'rgba(249, 115, 22, 0.12)',
                        border: 'rgba(249, 115, 22, 0.35)',
                        icon: 'fa-seedling',
                        summary: 'Iniciación & Rodaje Competitivo',
                        desc: 'La puerta de entrada al universo competitivo SomosPadel. Ideal para conocer jugadores afines, asimilar normas de torneo y progresar con rapidez.',
                        shots: ['Saque reglamentario consistente al recuadro', 'Golpes básicos de derecha y revés de fondo', 'Iniciación al juego con rebote en cristal', 'Comprensión de tanteo, cambios de pista y normas'],
                        tips: 'Juega Americanas Twister para sumar volumen de partidos y asiste a Entrenos guiados para automatizar la salida de pared.'
                    }
                };

                const cat = categories[catKey] || categories.gold;

                // Update Category Buttons styling
                ['bronze', 'silver', 'gold', 'platinum', 'elite'].forEach(k => {
                    const btn = document.getElementById(`sp-cat-btn-${k}`);
                    if (!btn) return;
                    if (k === catKey) {
                        btn.classList.add('sp-cat-active');
                        btn.style.background = categories[k].bg;
                        btn.style.borderColor = categories[k].color;
                    } else {
                        btn.classList.remove('sp-cat-active');
                        btn.style.background = 'rgba(255, 255, 255, 0.03)';
                        btn.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    }
                });

                // Update detail card
                const detailCard = document.getElementById('sp-cat-detail-card');
                if (!detailCard) return;

                detailCard.style.borderColor = cat.border;
                detailCard.innerHTML = `
                    <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="width: 42px; height: 42px; border-radius: 12px; background: ${cat.bg}; color: ${cat.color}; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
                                <i class="fas ${cat.icon}"></i>
                            </div>
                            <div>
                                <div style="font-size: 1.25rem; font-weight: 950; color: #fff;">CATEGORÍA ${cat.name}</div>
                                <div style="font-size: 0.78rem; color: ${cat.color}; font-weight: 850;">${cat.stars} • Rango Oficial: ${cat.range}</div>
                            </div>
                        </div>
                        <span class="sp-stat-pill" style="background: ${cat.bg}; color: ${cat.color}; border: 1px solid ${cat.border}; font-size: 0.78rem;">
                            ${cat.summary}
                        </span>
                    </div>

                    <p style="font-size: 0.85rem; color: #cbd5e1; line-height: 1.6; margin-bottom: 16px; font-family: 'Inter', sans-serif;">
                        ${cat.desc}
                    </p>

                    <div style="margin-bottom: 14px;">
                        <div style="font-size: 0.72rem; font-weight: 900; color: #94a3b8; text-transform: uppercase; margin-bottom: 8px;">Golpes & Habilidades Clave:</div>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 8px;">
                            ${cat.shots.map(s => `
                                <div style="font-size: 0.78rem; color: #e2e8f0; display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.03); padding: 8px 12px; border-radius: 10px;">
                                    <i class="fas fa-check-circle" style="color: ${cat.color}; font-size: 0.75rem;"></i> ${s}
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div style="background: rgba(0,0,0,0.35); border-left: 3px solid ${cat.color}; padding: 12px 14px; border-radius: 8px; font-size: 0.8rem; color: #94a3b8; line-height: 1.5;">
                        <b style="color: #fff;"><i class="fas fa-arrow-circle-up" style="color: ${cat.color};"></i> Clave para ascender:</b> ${cat.tips}
                    </div>
                `;
            } catch (e) {
                console.error("[ControlTowerView] selectHelpCategory error:", e);
            }
        }

        /**
         * Interactive ELO simulator calculation
         */
        calculateEloSimulation() {
            try {
                const userLevelInput = document.getElementById('sp-sim-user-level');
                const rivalDiffSelect = document.getElementById('sp-sim-rival-diff');
                const resultSelect = document.getElementById('sp-sim-result');
                const valUserSpan = document.getElementById('sp-sim-val-user');

                if (!userLevelInput || !rivalDiffSelect || !resultSelect) return;

                const userLevel = parseFloat(userLevelInput.value) || 3.50;
                const rivalDiff = parseFloat(rivalDiffSelect.value) || 0.00;
                const resultKey = resultSelect.value;

                if (valUserSpan) valUserSpan.textContent = userLevel.toFixed(2);

                // 60% Rendimiento component (games diff)
                let perfComponent = 0.018; // default win_huge
                let perfLabel = "+0.018";
                if (resultKey === 'win_huge') {
                    perfComponent = 0.018;
                    perfLabel = "+0.018";
                } else if (resultKey === 'win_close') {
                    perfComponent = 0.008;
                    perfLabel = "+0.008";
                } else if (resultKey === 'loss_close') {
                    perfComponent = -0.006;
                    perfLabel = "-0.006";
                } else if (resultKey === 'loss_huge') {
                    perfComponent = -0.018;
                    perfLabel = "-0.018";
                }

                // 40% Dificultad component
                let diffComponent = 0.000;
                if (rivalDiff > 0) {
                    // Playing against harder rivals
                    if (resultKey.startsWith('win')) {
                        diffComponent = rivalDiff * 0.025; // boost for winning against harder
                    } else {
                        diffComponent = rivalDiff * 0.015; // cushion for losing against harder
                    }
                } else if (rivalDiff < 0) {
                    // Playing against easier rivals
                    if (resultKey.startsWith('win')) {
                        diffComponent = rivalDiff * 0.012; // lower reward for beating easier
                    } else {
                        diffComponent = rivalDiff * 0.025; // penalty for losing to easier
                    }
                }
                const diffLabel = (diffComponent >= 0 ? "+" : "") + diffComponent.toFixed(3);

                // Combined delta
                let delta = perfComponent + diffComponent;
                // Clamp between -0.030 and +0.030
                delta = Math.max(-0.030, Math.min(0.030, delta));

                const projected = Math.max(0.00, Math.min(7.50, userLevel + delta));

                // Update UI elements
                const deltaBadge = document.getElementById('sp-sim-delta-badge');
                const projectedEl = document.getElementById('sp-sim-projected');
                const perfChip = document.getElementById('sp-sim-perf-chip');
                const diffChip = document.getElementById('sp-sim-diff-chip');
                const verdictEl = document.getElementById('sp-sim-verdict');

                const isPositive = delta >= 0;
                const deltaFormatted = (isPositive ? "+" : "") + delta.toFixed(3);

                if (deltaBadge) {
                    deltaBadge.textContent = deltaFormatted;
                    deltaBadge.style.color = isPositive ? '#CCFF00' : '#ef4444';
                }

                if (projectedEl) {
                    projectedEl.textContent = projected.toFixed(3);
                    projectedEl.style.color = isPositive ? '#CCFF00' : '#ef4444';
                }

                if (perfChip) {
                    perfChip.textContent = `60% Rend: ${perfLabel}`;
                    perfChip.style.color = perfComponent >= 0 ? '#CCFF00' : '#ef4444';
                }

                if (diffChip) {
                    diffChip.textContent = `40% Dif: ${diffLabel}`;
                    diffChip.style.color = diffComponent >= 0 ? '#38bdf8' : '#f59e0b';
                }

                if (verdictEl) {
                    if (resultKey === 'win_huge' && rivalDiff >= 0.20) {
                        verdictEl.textContent = "¡Victoria memorable! Batir con solvencia a una pareja de mayor rango multiplica tu calibración tanto por rendimiento como por dificultad.";
                    } else if (resultKey === 'win_huge') {
                        verdictEl.textContent = "¡Dominio total de pista! Has ganado con holgura acumulando el máximo beneficio de rendimiento numérico (+0.018).";
                    } else if (resultKey === 'win_close' && rivalDiff >= 0.20) {
                        verdictEl.textContent = "¡Triunfo de mérito! Un partido de máxima paridad resuelto a tu favor contra rivales superiores añade décimas valiosas a tu casillero.";
                    } else if (resultKey === 'win_close') {
                        verdictEl.textContent = "Victoria ajustada en un duelo muy parejo. Tu nivel sube con prudencia (+0.008 a +0.012) manteniendo la estabilidad.";
                    } else if (resultKey === 'loss_close' && rivalDiff >= 0.20) {
                        verdictEl.textContent = "Derrota por la mínima ante una pareja superior. Gracias a la dificultad del cruce, tu nivel apenas sufre impacto negativo (-0.003 aprox.).";
                    } else if (resultKey === 'loss_close') {
                        verdictEl.textContent = "Partido muy disputado resuelto por detalles. La diferencia en juegos es escasa, por lo que el ajuste a la baja es muy moderado.";
                    } else if (resultKey === 'loss_huge' && rivalDiff <= -0.20) {
                        verdictEl.textContent = "Derrota amplia ante rivales con menor ranking. El algoritmo ajusta tu ELO a la baja para recalibrar tu índice competitivo.";
                    } else {
                        verdictEl.textContent = "Resultado adverso. Recuerda que el filtro anti-racha protege tu historial acumulado para que un tropiezo puntual no arruine tu nivel global.";
                    }
                }
            } catch (e) {
                console.error("[ControlTowerView] calculateEloSimulation error:", e);
            }
        }

        /**
         * Updates radar attribute bars preview according to level
         */
        updateHelpRadar(levelVal) {
            try {
                const l = parseFloat(levelVal) || 3.5;
                const stats = {
                    atk: Math.min(99, Math.round(l * 13 + 24)),
                    def: Math.min(99, Math.round(l * 12 + 32)),
                    tec: Math.min(99, Math.round(l * 14 + 18)),
                    fis: Math.min(99, Math.round(l * 10 + 42)),
                    rem: Math.min(99, Math.round(l * 15 + 15))
                };

                const updateAttr = (key, val) => {
                    const bar = document.getElementById(`sp-radar-bar-${key}`);
                    const valEl = document.getElementById(`sp-radar-val-${key}`);
                    if (bar) bar.style.width = `${val}%`;
                    if (valEl) valEl.textContent = `${val}%`;
                };

                updateAttr('atk', stats.atk);
                updateAttr('def', stats.def);
                updateAttr('tec', stats.tec);
                updateAttr('fis', stats.fis);
                updateAttr('rem', stats.rem);
            } catch (e) {
                console.error("[ControlTowerView] updateHelpRadar error:", e);
            }
        }

        /**
         * FAQ accordion toggle
         */
        toggleHelpFaq(faqId) {
            try {
                const ans = document.getElementById(`sp-faq-ans-${faqId}`);
                const icon = document.getElementById(`sp-faq-icon-${faqId}`);
                if (!ans) return;

                const isOpen = ans.style.display === 'block';
                if (isOpen) {
                    ans.style.display = 'none';
                    if (icon) icon.style.transform = 'rotate(0deg)';
                } else {
                    ans.style.display = 'block';
                    if (icon) icon.style.transform = 'rotate(180deg)';
                }
            } catch (e) {
                console.error("[ControlTowerView] toggleHelpFaq error:", e);
            }
        }


        initRadarChart(user) {
            const ctx = document.getElementById('playerRadarChart');
            if (!ctx || !window.Chart) return;

            const l = user ? parseFloat(user.level || 3.5) : 3.5;
            const data = {
                labels: ['ATAQUE', 'DEFENSA', 'TÉCNICA', 'FÍSICO', 'REMATE'],
                datasets: [{
                    label: 'Mi Perfil SomosPadel',
                    data: [
                        Math.min(100, l * 12 + 20),
                        Math.min(100, l * 10 + 30),
                        Math.min(100, l * 14 + 10),
                        Math.min(100, l * 10 + 40),
                        Math.min(100, l * 13 + 15)
                    ],
                    fill: true,
                    backgroundColor: 'rgba(204, 255, 0, 0.2)',
                    borderColor: '#CCFF00',
                    borderWidth: 3,
                    pointBackgroundColor: '#CCFF00',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#CCFF00'
                }]
            };

            new Chart(ctx, {
                type: 'radar',
                data: data,
                options: {
                    scales: {
                        r: {
                            angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            pointLabels: { 
                                color: '#aaa', 
                                font: { size: 10, weight: '950', family: 'Outfit' } 
                            },
                            ticks: { display: false, stepSize: 20 },
                            suggestedMin: 0,
                            suggestedMax: 100
                        }
                    },
                    plugins: {
                        legend: { display: false }
                    }
                }
            });
        }

        async replayShuffleAnimation() {
            if (!window.ShuffleAnimator) return;

            const currentRound = this.selectedRound || 1;
            const currentMatches = this.allMatches.filter(m => parseInt(m.round) === currentRound);

            if (currentMatches.length === 0) {
                alert("No hay emparejamientos en esta ronda para sortear.");
                return;
            }

            window.ShuffleAnimator.animate({
                round: currentRound,
                players: this.currentAmericanaDoc?.players || [],
                courts: this.currentAmericanaDoc?.max_courts || 4,
                matches: currentMatches
            }, () => {
                this.goToRound(currentRound);
            });
        }

        // ==========================================
        // 🔒 PANTALLA DE ACCESO RESTRINGIDO A LA TORRE DE CONTROL
        // ==========================================
        renderPrivateLockScreen(doc) {
            const container = document.getElementById('live-feed-content') || document.getElementById('content-area') || document.getElementById('app-root') || document.body;
            if (!container) return;

            container.innerHTML = `
                <div style="
                    min-height: 80vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 24px 16px;
                    font-family: 'Outfit', sans-serif;
                ">
                    <div style="
                        width: 100%;
                        max-width: 420px;
                        background: #090e18;
                        border: 1.5px solid rgba(239, 68, 68, 0.45);
                        border-radius: 26px;
                        padding: 32px 24px;
                        box-shadow: 0 25px 60px rgba(0,0,0,0.9), 0 0 35px rgba(239, 68, 68, 0.25);
                        text-align: center;
                        box-sizing: border-box;
                    ">
                        <div style="width: 76px; height: 76px; margin: 0 auto 16px; border-radius: 22px; background: rgba(239, 68, 68, 0.12); border: 2px solid rgba(239, 68, 68, 0.4); display: flex; align-items: center; justify-content: center; box-shadow: 0 0 25px rgba(239, 68, 68, 0.3);">
                            <i class="fas fa-lock" style="font-size: 2.3rem; color: #f87171;"></i>
                        </div>

                        <div style="display: inline-block; background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.35); padding: 4px 12px; border-radius: 8px; font-size: 0.68rem; font-weight: 950; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 10px;">
                            🔒 TORRE DE CONTROL Y MARCADOR PRIVADO
                        </div>

                        <h2 style="color: #ffffff; font-size: 1.35rem; font-weight: 950; margin: 0 0 8px 0; text-transform: uppercase;">
                            ${doc.name || 'Americana Privada'}
                        </h2>

                        <p style="color: #94a3b8; font-size: 0.82rem; line-height: 1.45; margin: 0 0 22px 0;">
                            Esta americana es de acceso privado. Introduce la clave proporcionada por el organizador para ver los marcadores de pista, cruces y resultados en vivo.
                        </p>

                        <form id="ct-private-pin-form" onsubmit="event.preventDefault(); window.ControlTowerView.submitPrivateUnlock('${doc.id}');" style="display: flex; flex-direction: column; gap: 14px;">
                            <input type="password" id="ct-private-pin-input" 
                                   placeholder="Introduce la contraseña..." 
                                   autocomplete="off"
                                   style="
                                       width: 100%;
                                       padding: 14px 16px;
                                       background: rgba(15, 23, 42, 0.85);
                                       border: 1.5px solid rgba(255, 255, 255, 0.15);
                                       border-radius: 14px;
                                       color: #ffffff;
                                       font-size: 1.05rem;
                                       font-weight: 900;
                                       letter-spacing: 2px;
                                       text-align: center;
                                       box-sizing: border-box;
                                       outline: none;
                                   ">

                            <div id="ct-private-error" style="display: none; color: #f87171; font-size: 0.75rem; font-weight: 800;">
                                <i class="fas fa-exclamation-circle"></i> Contraseña incorrecta. Pide la clave al organizador.
                            </div>

                            <button type="submit" style="
                                width: 100%;
                                padding: 14px;
                                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                                color: #ffffff;
                                border: none;
                                border-radius: 14px;
                                font-size: 0.92rem;
                                font-weight: 950;
                                cursor: pointer;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                gap: 8px;
                                box-shadow: 0 4px 18px rgba(239, 68, 68, 0.45);
                            ">
                                <i class="fas fa-unlock"></i>
                                <span>DESBLOQUEAR Y VER PARTIDOS</span>
                            </button>

                            <button type="button" onclick="window.Router ? window.Router.navigate('americanas') : window.history.back()" style="
                                background: none;
                                border: none;
                                color: #64748b;
                                font-size: 0.78rem;
                                font-weight: 800;
                                cursor: pointer;
                                margin-top: 4px;
                            ">
                                ← Volver al listado de Americanas
                            </button>
                        </form>
                    </div>
                </div>
            `;
            const pinInp = document.getElementById('ct-private-pin-input');
            if (pinInp) pinInp.focus();
        }

        submitPrivateUnlock(docId) {
            const input = document.getElementById('ct-private-pin-input');
            const errEl = document.getElementById('ct-private-error');
            const entered = (input?.value || '').trim();
            const expected = String(this.currentAmericanaDoc?.access_pin || this.currentAmericanaDoc?.access_password || '').trim();

            if (entered && entered.toLowerCase() === expected.toLowerCase()) {
                localStorage.setItem(`unlocked_americana_${docId}`, 'true');
                if (window.NotificationService) {
                    window.NotificationService.show("🔓 ¡Acceso concedido! Cargando partidos...", "success");
                }
                this.load(docId, this.currentAmericanaDoc?.isEntreno ? 'entreno' : 'americana');
            } else {
                if (errEl) errEl.style.display = 'block';
                if (input) {
                    input.style.borderColor = '#ef4444';
                    input.select();
                }
            }
        }
    } // End of ControlTowerView class

    // Export class to global scope for fallback instantiation
    window.ControlTowerViewClass = ControlTowerView;
    window.ControlTowerView = new ControlTowerView();

    // Global session flyer opener for EventHeader and external triggers
    window.openSessionFlyer = async (eventId) => {
        if (window.ControlTowerView && window.ControlTowerView.currentAmericanaDoc && (!eventId || window.ControlTowerView.currentAmericanaDoc.id === eventId)) {
            window.ControlTowerView.openEventSummaryFlyer();
            return;
        }
        try {
            let doc = null;
            let matches = [];
            if (window.AmericanaService) {
                if (window.AmericanaService.getAmericana) doc = await window.AmericanaService.getAmericana(eventId);
                if (window.AmericanaService.getMatches) matches = (await window.AmericanaService.getMatches(eventId)) || [];
            }
            if (!doc && window.db && eventId) {
                const snap = await window.db.collection('americanas').doc(eventId).get();
                if (snap.exists) doc = { id: snap.id, ...snap.data() };
                const mSnap = await window.db.collection('americanas').doc(eventId).collection('matches').get();
                matches = mSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            }
            if (doc && window.EventModals?.showTrainingFinishedModal) {
                const maxRound = (matches && matches.length > 0)
                    ? Math.max(...matches.map(m => parseInt(m.round || 1)))
                    : (parseInt(doc.rounds_count || doc.rounds) || 1);
                window.EventModals.showTrainingFinishedModal(maxRound, matches, doc);
            }
        } catch (e) {
            console.warn("⚠️ Error abriendo Session Flyer:", e);
        }
    };

    // --- GLOBAL ACTIONS ---
    window.shareVictory = async (matchId, userDelta) => {
        // 1. Get match data
        const match = window._matchRegistry ? window._matchRegistry[matchId] : null;
        if (!match) return alert("Error: Datos del partido no encontrados.");

        // 2. Format Data for Social View
        const getTeamName = (namesArr, teamStr) => {
            if (teamStr && typeof teamStr === 'string' && teamStr.length > 0) return teamStr;
            if (Array.isArray(namesArr)) return namesArr.join(' / ');
            return String(namesArr || '');
        };

        const teamA = getTeamName(match.team_a_names, match.teamA);
        const teamB = getTeamName(match.team_b_names, match.teamB);

        const sA = parseInt(match.score_a || 0);
        const sB = parseInt(match.score_b || 0);

        // Split names (Simple heuristic for demo)
        const splitNames = (str) => {
            const p = str.split(' / ');
            return { p1: p[0] || '', p2: p[1] || '' };
        };

        const tA = splitNames(teamA);
        const tB = splitNames(teamB);

        const socialData = {
            score: `${sA}-${sB}`,
            player1: tA.p1,
            partner1: tA.p2,
            player2: tB.p1,
            partner2: tB.p2,
            location: 'SomosPadel BCN',
            date: new Date().toLocaleDateString()
        };

        // 3. Open Creator Mode
        window.SocialShareView.open(socialData);
    };

    console.log("🗼 ControlTowerView (Pro) v4005 Initialized");
})();
