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
            window.EventModals.closeRoundFinishedModal();
        }

        showTrainingFinishedModal(finalRound) {
            window.EventModals.showTrainingFinishedModal(
                finalRound,
                this.allMatches,
                this.currentAmericanaDoc,
                (rankingItems, isFixedPairs) => {
                    const eventDate = this.currentAmericanaDoc?.date || '';
                    const medals = ['🏆', '🥈', '🥉'];
                    const shareText = rankingItems.slice(0, 3)
                        .map((p, i) => `${medals[i]} ${p.name} — ${isFixedPairs ? p.won + ' V' : p.points + ' pts'}`)
                        .join('\n');
                    const fullText = `🎾 FIN DEL ENTRENO\n📅 ${eventDate}\n\n${shareText}\n\n¡Hasta la próxima! 🏆`;
                    if (window.WhatsAppService) window.WhatsAppService.shareText(fullText);
                },
                (tab) => { this.switchTab(tab); document.getElementById('training-finished-modal')?.remove(); },
                () => { document.getElementById('training-finished-modal')?.remove(); window.Router.navigate('dashboard'); }
            );
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
            this.activeTab = tab;
            this.recalc();
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
                    
                    <!-- PREMIUM DARK LED SUBMENU -->
                    <style>
                        @keyframes ledPulse {
                            0% { box-shadow: 0 0 5px rgba(255,149,0,0.1), inset 0 0 5px rgba(255,149,0,0.05); }
                            50% { box-shadow: 0 0 15px rgba(255,149,0,0.4), inset 0 0 8px rgba(255,149,0,0.2); }
                            100% { box-shadow: 0 0 5px rgba(255,149,0,0.1), inset 0 0 5px rgba(255,149,0,0.05); }
                        }
                        .led-tab-active {
                            animation: ledPulse 2.5s infinite ease-in-out;
                            border: 1px solid #ff9500 !important;
                            color: #ff9500 !important;
                            background: rgba(255,149,0,0.05) !important;
                            text-shadow: 0 0 8px rgba(255,149,0,0.3);
                        }
                    </style>

                    <div style="background: #ffffff; backdrop-filter: blur(20px); padding: 14px; display: flex; justify-content: center; gap: 12px; border-bottom: 2px solid #e2e8f0; position: sticky; top: 0; z-index: 1002; box-shadow: 0 10px 40px rgba(0,0,0,0.05);">
                        <button onclick="window.ControlTowerView.switchSection('playing')" class="${this.mainSection === 'playing' ? 'led-tab-active' : ''}" style="flex:1; border: 1px solid #e2e8f0; background: #f8fafc; color: #0a192f; padding: 14px 6px; border-radius: 14px; font-weight: 950; font-size: 0.7rem; transition: 0.4s; text-transform: uppercase; letter-spacing: 1.5px; cursor: pointer;">EN JUEGO</button>
                        <button onclick="window.ControlTowerView.switchSection('history')" class="${this.mainSection === 'history' ? 'led-tab-active' : ''}" style="flex:1; border: 1px solid #e2e8f0; background: #f8fafc; color: #0a192f; padding: 14px 6px; border-radius: 14px; font-weight: 950; font-size: 0.7rem; transition: 0.4s; text-transform: uppercase; letter-spacing: 1.5px; cursor: pointer;">MI PASADO</button>
                        <button onclick="window.ControlTowerView.switchSection('help')" class="${this.mainSection === 'help' ? 'led-tab-active' : ''}" style="flex:1; border: 1px solid #e2e8f0; background: #f8fafc; color: #0a192f; padding: 14px 6px; border-radius: 14px; font-weight: 950; font-size: 0.7rem; transition: 0.4s; text-transform: uppercase; letter-spacing: 1.5px; cursor: pointer;">INFO</button>
                    </div>

                    ${this.renderMainArea(data, isPlayingHere)}
                </div>
            `;

            // --- RPG RADAR CHART INIT ---
            if (this.mainSection === 'history') {
                setTimeout(() => this.initRadarChart(user), 100);
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
                case 'standings': return this.renderStandingsView();
                case 'brackets': return this.renderBracketsView();
                case 'summary': return this.renderSummaryView();
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
                        cardStyle = 'border: 1px solid #e2e8f0; opacity: 0.6; filter: grayscale(100%); z-index: 1;';
                        cardBg = '#f8fafc';
                    } else if (isMyMatch && isLive) {
                        cardStyle = 'border: 3px solid #72a800; box-shadow: 0 15px 45px rgba(114, 168, 0, 0.2); transform: scale(1.03); z-index: 10;';
                    }
                    el.style.cssText += cardStyle;
                    el.style.background = cardBg;

                    const newStatusHTML = isFinished ?
                        '<span style="background: #25D366; color: white; padding: 4px 10px; border-radius: 12px; font-weight: 950; font-size: 0.6rem; letter-spacing: 0.5px; text-transform:uppercase;">FINALIZADO</span>' :
                        (isLive ? '<span class="status-badge-live" style="animation: pulse 1s infinite alternate;">⚡ EN JUEGO</span>' : '<span style="background: rgba(255,255,255,0.1); color: #888; padding: 4px 10px; border-radius: 12px; font-weight: 900; font-size: 0.6rem; letter-spacing: 0.5px;">PROGRAMADO</span>');

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

            let emptyMessage = isLiveEvent ?
                '<div style="display:flex; justify-content:center; padding:40px;"><div class="loader"></div></div>' :
                'Selecciona una ronda válida...';

            return `
                <div class="tour-filter-bar" style="position: sticky; top: 122px; z-index: 1000; background: rgba(255,255,255,0.9); backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px); padding: 14px 20px; display: flex; align-items: center; justify-content: space-between; gap: 10px; border-bottom: 1px solid rgba(0,0,0,0.05); box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
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
                               50% { transform: scale(1.5); opacity: 0.5; }
                               100% { transform: scale(1); opacity: 1; }
                           }
                           .live-pulse-dot { width: 8px; height: 8px; background: #00E36D; border-radius: 50%; display: inline-block; margin-right: 8px; animation: pulseLive 2s infinite; }
                       </style>
                       ${tabs}
                   </div>
                   <div style="display:flex; align-items:center; gap:10px;">
                       <span style="font-size: 0.65rem; color: #666; font-weight: 700; background: #eee; padding: 4px 8px; border-radius: 10px; display: flex; align-items: center;">
                           <span class="live-pulse-dot"></span> VIVO
                       </span>
                   </div>
                </div>
                <div class="tour-grid-container" style="padding: 16px; display: grid; gap: 16px; padding-bottom: 100px;">
                    ${roundData.matches.length ? '' : `<div style="color:#999; width:100%; text-align:center; padding:80px; font-weight:700; line-height:1.5;">${emptyMessage}</div>`}
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

            const maxRound = this.allMatches.length > 0 ? Math.max(...this.allMatches.map(m => parseInt(m.round || 1))) : 1;
            const isViewingMaxRound = roundNum === maxRound;
            const isPastRound = roundNum < maxRound;

            const totalRoundsPlanned = parseInt(this.currentAmericanaDoc?.total_rounds || this.currentAmericanaDoc?.max_rounds || 6);
            const isLastPlannedRound = roundNum >= totalRoundsPlanned;
            const isLive = this.currentAmericanaDoc?.status === 'live' || this.currentAmericanaDoc?.status === 'in_progress';

            return `
                <div id="round-control-toolbar" class="animate-pop-in" style="margin-top: 24px; background: #ffffff; padding: 22px 20px; border-radius: 22px; border: 1px solid #e2e8f0; box-shadow: 0 10px 30px rgba(0,0,0,0.04);">
                    ${isPastRound ? `
                        <!-- MODO RONDA ANTERIOR / CORRECCIÓN -->
                        <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 18px; border-bottom: 1px solid #fee2e2; padding-bottom: 14px;">
                            <div style="flex: 1;">
                                <div style="font-weight: 950; color: #e11d48; font-size: 0.95rem; display: flex; align-items: center; gap: 8px;">
                                    <span>⚠️</span> MODO CORRECCIÓN (RONDA ${roundNum})
                                </div>
                                <div style="font-size: 0.78rem; color: #64748b; margin-top: 4px; line-height: 1.4;">
                                    Estás en una ronda previa. La ronda más avanzada en juego es la <b>Ronda ${maxRound}</b>.<br>
                                    Si hubo un error al introducir los resultados de la Ronda ${roundNum}, pulsa el botón para <b>reiniciar desde aquí</b>: se eliminarán las rondas posteriores y podrás corregir marcadores y regenerar el orden correcto in situ.
                                </div>
                            </div>
                            <span style="background: #fff1f2; color: #e11d48; border: 1px solid #fecdd3; padding: 4px 10px; border-radius: 10px; font-weight: 950; font-size: 0.65rem; white-space: nowrap;">
                                R${roundNum} / R${maxRound}
                            </span>
                        </div>

                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            <button onclick="window.ControlTowerView.rollbackTournament(${roundNum})"
                                    class="btn-primary-pro"
                                    style="padding: 16px 20px; font-size: 0.95rem; background: #e11d48; color: white; border: none; border-radius: 14px; font-weight: 950; display: flex; align-items: center; justify-content: center; gap: 10px; box-shadow: 0 8px 25px rgba(225, 29, 72, 0.25); cursor: pointer; transition: all 0.2s;">
                                🔄 REINICIAR Y CORREGIR DESDE RONDA ${roundNum}
                            </button>
                            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                                <button onclick="window.ControlTowerView.unlockRoundMatches(${roundNum})"
                                        style="flex: 1; min-width: 170px; padding: 12px 16px; font-size: 0.8rem; background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; border-radius: 12px; font-weight: 900; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
                                    🔓 Desbloquear Marcadores R${roundNum}
                                </button>
                                <button onclick="window.ControlTowerView.goToRound(${maxRound})"
                                        style="flex: 1; min-width: 170px; padding: 12px 16px; font-size: 0.8rem; background: #f8fafc; color: #334155; border: 1px solid #cbd5e1; border-radius: 12px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
                                    ➡️ Volver a Ronda ${maxRound} (Actual)
                                </button>
                            </div>
                        </div>
                    ` : `
                        <!-- MODO RONDA ACTIVA / MÁS RECIENTE -->
                        <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 14px;">
                            <div>
                                <div style="font-weight: 950; color: #0a192f; font-size: 0.95rem; display: flex; align-items: center; gap: 8px;">
                                    ${isRoundComplete ? '🏁' : '🎾'} RONDA ${roundNum} ${isRoundComplete ? 'COMPLETADA' : 'EN JUEGO'}
                                </div>
                                <div style="font-size: 0.78rem; color: #64748b; margin-top: 4px;">
                                    ${isRoundComplete 
                                        ? '¡Todos los partidos han sido confirmados!' 
                                        : `Progreso: <b>${finishedCount} de ${totalMatches}</b> pistas cerradas.`}
                                </div>
                            </div>
                            <span style="background: ${isRoundComplete ? '#dcfce7' : '#f1f5f9'}; color: ${isRoundComplete ? '#15803d' : '#64748b'}; border: 1px solid ${isRoundComplete ? '#86efac' : '#e2e8f0'}; padding: 4px 10px; border-radius: 10px; font-weight: 950; font-size: 0.65rem;">
                                ${isRoundComplete ? 'LISTA PARA AVANZAR' : `${finishedCount}/${totalMatches} CONFIRMADAS`}
                            </span>
                        </div>

                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            ${isRoundComplete ? `
                                <!-- AVANCE DE RONDA / FINALIZACIÓN -->
                                ${isLastPlannedRound ? `
                                    <button onclick="window.ControlTowerView.finishTournament()"
                                            class="btn-primary-pro"
                                            style="padding: 16px 24px; font-size: 1rem; background: linear-gradient(135deg, #72a800 0%, #00e36d 100%); color: white; border: none; border-radius: 16px; font-weight: 950; display: flex; align-items: center; justify-content: center; gap: 10px; box-shadow: 0 10px 30px rgba(114, 168, 0, 0.35); cursor: pointer;">
                                        🏆 FINALIZAR TORNEO Y VER CLASIFICACIÓN
                                    </button>
                                    <button onclick="window.ControlTowerView.triggerNextRound(${roundNum})"
                                            style="padding: 12px 18px; font-size: 0.85rem; background: #f8fafc; color: #334155; border: 1px solid #cbd5e1; border-radius: 12px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
                                        ➕ Añadir Ronda Extra (Ronda ${roundNum + 1})
                                    </button>
                                ` : `
                                    <button onclick="window.ControlTowerView.triggerNextRound(${roundNum})"
                                            class="btn-primary-pro"
                                            style="padding: 16px 24px; font-size: 1.05rem; background: linear-gradient(135deg, #72a800 0%, #00e36d 100%); color: white; border: none; border-radius: 16px; font-weight: 950; display: flex; align-items: center; justify-content: center; gap: 10px; box-shadow: 0 10px 30px rgba(114, 168, 0, 0.35); cursor: pointer;">
                                        🚀 GENERAR SIGUIENTE RONDA (RONDA ${roundNum + 1})
                                    </button>
                                `}

                                <!-- OPCIONES DE EDICIÓN IN SITU -->
                                <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 4px;">
                                    <button onclick="window.ControlTowerView.unlockRoundMatches(${roundNum})"
                                            style="flex: 1; min-width: 170px; padding: 11px 16px; font-size: 0.8rem; background: #f8fafc; color: #0284c7; border: 1px solid #bae6fd; border-radius: 12px; font-weight: 900; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
                                        ✏️ Corregir Marcadores R${roundNum}
                                    </button>
                                    <button onclick="window.ControlTowerView.regenerateCurrentRound(${roundNum})"
                                            style="flex: 1; min-width: 170px; padding: 11px 16px; font-size: 0.8rem; background: #fffbeb; color: #d97706; border: 1px solid #fde68a; border-radius: 12px; font-weight: 900; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
                                        🎲 Regenerar Cruces R${roundNum}
                                    </button>
                                </div>
                            ` : `
                                <!-- RONDA EN CURSO (INCOMPLETA) -->
                                ${finishedCount < totalMatches ? `
                                    <button onclick="window.ControlTowerView.finalizeAllRoundMatches(${roundNum})"
                                            style="padding: 14px 20px; font-size: 0.9rem; background: #f0fdf4; color: #166534; border: 1px solid #86efac; border-radius: 14px; font-weight: 950; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 15px rgba(22, 101, 52, 0.08);">
                                        ✓ CONFIRMAR TODOS LOS RESULTADOS (${finishedCount}/${totalMatches})
                                    </button>
                                ` : ''}

                                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                                    <button onclick="window.ControlTowerView.unlockRoundMatches(${roundNum})"
                                            style="flex: 1; min-width: 170px; padding: 12px 16px; font-size: 0.8rem; background: #f8fafc; color: #0284c7; border: 1px solid #bae6fd; border-radius: 12px; font-weight: 900; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
                                        🔓 Desbloquear Marcadores
                                    </button>
                                    <button onclick="window.ControlTowerView.regenerateCurrentRound(${roundNum})"
                                            style="flex: 1; min-width: 170px; padding: 12px 16px; font-size: 0.8rem; background: #fffbeb; color: #d97706; border: 1px solid #fde68a; border-radius: 12px; font-weight: 900; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
                                        🎲 Regenerar Cruces de esta Ronda
                                    </button>
                                </div>

                                ${isAdmin ? `
                                    <button onclick="window.ControlTowerView.triggerNextRound(${roundNum}, true)"
                                            style="padding: 10px 16px; font-size: 0.75rem; background: transparent; color: #64748b; border: 1px dashed #cbd5e1; border-radius: 12px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
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
            return window.ControlTowerStandings.render(this.allMatches, this.currentAmericanaDoc);
        }

        renderBracketsView() {
            if (!window.ControlTowerBrackets) return '<div style="padding:40px; text-align:center; color:white;">Cargando cuadros...</div>';
            return window.ControlTowerBrackets.render(this.allMatches, this.currentAmericanaDoc);
        }

        renderSummaryView() {
            if (!window.ControlTowerStats) return '<div style="padding:40px; text-align:center;">Cargando...</div>';
            return window.ControlTowerStats.render(this.allMatches, this.currentAmericanaDoc);
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
                matchCardEl.style.transition = 'all 0.3s ease-out';
                matchCardEl.style.opacity = '0.5';
                matchCardEl.style.filter = 'grayscale(100%)';
                matchCardEl.style.transform = 'scale(0.98)';
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
            const confirmed = await window.PremiumModal.confirm({
                title: "🏆 FINALIZAR TORNEO",
                message: "¿Estás seguro de dar por finalizado el evento? Se guardará el estado final y podrás consultar la clasificación definitiva.",
                confirmText: "SÍ, FINALIZAR",
                cancelText: "CANCELAR",
                type: 'success'
            });
            if (!confirmed) return;

            const isEntreno = this.currentAmericanaDoc?.isEntreno;
            const col = isEntreno ? 'entrenos' : 'americanas';
            try {
                await window.db.collection(col).doc(this.currentAmericanaDoc.id).update({
                    status: 'finished'
                });
                if (this.currentAmericanaDoc) {
                    this.currentAmericanaDoc.status = 'finished';
                }
                if (window.confetti) {
                    window.confetti({ particleCount: 200, spread: 90, origin: { y: 0.5 }, colors: ['#CCFF00', '#00E36D', '#ffffff'] });
                }
                window.PremiumModal.alert({
                    title: "🎉 ¡EVENTO FINALIZADO!",
                    message: "El evento ha concluido. Consulta ahora el podio y la clasificación general.",
                    type: 'success'
                });
                this.setTab('standings');
            } catch (e) {
                console.error("Finish tournament failed:", e);
                window.PremiumModal.alert({ title: "❌ ERROR", message: e.message, type: 'error' });
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
                <div class="fade-in" style="padding: 25px; min-height: 80vh; background: #000; padding-bottom: 120px; font-family: 'Inter', sans-serif; color: white;">
                    <div style="margin-bottom: 30px; border-bottom: 3px solid #CCFF00; padding-bottom: 15px; display: inline-block;">
                        <h2 style="font-family:'Outfit'; font-weight: 950; color: #fff; font-size: 1.8rem; margin: 0; letter-spacing: -0.5px;">GUÍA <span style="color: #CCFF00;">SMART</span> JUGADOR</h2>
                    </div>

                    <div style="display: grid; gap: 25px;">
                        
                        <!-- 1. NIVEL Y RANKING ANUAL -->
                        <div style="background: linear-gradient(135deg, rgba(204,255,0,0.1) 0%, rgba(0,0,0,0) 100%); padding: 25px; border-radius: 30px; border: 1px solid rgba(204,255,0,0.3); box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
                            <div style="font-weight: 950; margin-bottom: 20px; color: #CCFF00; font-size: 1.2rem; display: flex; align-items: center; gap: 12px; text-transform: uppercase;">
                                <div style="width: 40px; height: 40px; background: #CCFF00; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #000;">
                                    <i class="fas fa-chart-line"></i>
                                </div>
                                Nivel y Ranking Anual
                            </div>
                            
                            <p style="font-size: 0.9rem; color: #aaa; line-height: 1.6; margin-bottom: 20px;">
                                Tu nivel SomosPadel (0.0 - 7.0) es tu <b>huella competitiva</b>. El <b>Ranking Oficial</b> es el resultado de la <u>suma de todos tus partidos registrados anualmente</u>. A más actividad y victorias, mejor posición.
                            </p>

                            <div style="display: grid; gap: 15px;">
                                <div style="background: rgba(255,255,255,0.03); padding: 15px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05);">
                                    <div style="color: #22c55e; font-weight: 900; font-size: 0.75rem; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                                        <i class="fas fa-plus-circle"></i> ¿CÓMO SUMAR?
                                    </div>
                                    <p style="margin: 0; font-size: 0.8rem; color: #888;">Gana partidos, participa en eventos y vence a parejas de nivel superior para subir décimas y escalar en el ranking.</p>
                                </div>
                                <div style="background: rgba(255,255,255,0.03); padding: 15px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05);">
                                    <div style="color: #64748b; font-weight: 900; font-size: 0.75rem; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                                        <i class="fas fa-calendar-check"></i> CICLO ANUAL
                                    </div>
                                    <p style="margin: 0; font-size: 0.8rem; color: #888;">El ranking se reinicia cada temporada, premiando la regularidad y el esfuerzo de todo el año.</p>
                                </div>
                            </div>
                        </div>

                        <!-- 2. CHAT TÁCTICO (OPS ROOM) -->
                        <div style="background: rgba(255,255,255,0.02); padding: 25px; border-radius: 30px; border: 1px solid rgba(255,255,255,0.05);">
                            <div style="font-weight: 950; margin-bottom: 15px; color: #fff; font-size: 1.1rem; display: flex; align-items: center; gap: 12px;">
                                <div style="width: 36px; height: 36px; background: rgba(59,130,246,0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #3b82f6;">
                                    <i class="fas fa-comments"></i>
                                </div>
                                CHAT EVENTO
                            </div>
                            <div style="font-size: 0.9rem; color: #888; line-height: 1.7;">
                                Canal de comunicación en tiempo real exclusivo de cada evento.
                                <br><br>
                                • <b>SOS:</b> grafía gigante y alto contraste para leer tu pista desde cualquier lugar , es un aviso para los demas compañeros/as por si quieren apuntarse y cubrir la posicion.
                            </div>
                        </div>

                        <!-- 3. MODO TV (CENTER COURT) -->
                        <div style="background: rgba(255,255,255,0.02); padding: 25px; border-radius: 30px; border: 1px solid rgba(255,255,255,0.05);">
                            <div style="font-weight: 950; margin-bottom: 15px; color: #fff; font-size: 1.1rem; display: flex; align-items: center; gap: 12px;">
                                <div style="width: 36px; height: 36px; background: rgba(239,68,68,0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #ef4444;">
                                    <i class="fas fa-tv"></i>
                                </div>
                                Modo TV
                            </div>
                            <div style="font-size: 0.9rem; color: #888; line-height: 1.7;">
                                Diseñado para monitores , tablets  y Smart TVs. Accede desde cualquier evento activo. 
                                <br><br>
                                • <b>ROTACIÓN AUTO:</b> Pasa solo entre marcadores en vivo, clasificación y próximos cruces.
                                <br>• <b>ALTA VISIBILIDAD:</b> Tipografía gigante y alto contraste para leer tu pista desde cualquier lugar 
                            </div>
                        </div>

                        <!-- 4. FORMATOS -->
                        <div style="background: rgba(255,255,255,0.02); padding: 25px; border-radius: 30px; border: 1px solid rgba(255,255,255,0.05);">
                            <div style="font-weight: 950; margin-bottom: 15px; color: #fff; font-size: 1.1rem; display: flex; align-items: center; gap: 12px;">
                                <div style="width: 36px; height: 36px; background: rgba(124,58,237,0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #8b5cf6;">
                                    <i class="fas fa-sitemap"></i>
                                </div>
                                Formatos de Competición
                            </div>
                            <div style="font-size: 0.9rem; color: #888; line-height: 1.7;">
                                • <b style="color: #0ea5e9;">🌪️ TWISTER:</b> Cambias de pareja en cada ronda. Sumas juegos individuales.
                                <br><br>
                                • <b style="color: #8b5cf6;">🔒 PAREJA FIJA (Pozo):</b> Juegas siempre con el mismo compañero. Ganas = Subes pista / Pierdes = Bajas pista.
                            </div>
                        </div>

                        <!-- 5. ANALYTICS (MÉTRICAS AVANZADAS) -->
                        <div style="background: rgba(255,255,255,0.02); padding: 25px; border-radius: 30px; border: 1px solid rgba(255,255,255,0.05);">
                            <div style="font-weight: 950; margin-bottom: 15px; color: #fff; font-size: 1.1rem; display: flex; align-items: center; gap: 12px;">
                                <div style="width: 36px; height: 36px; background: rgba(16,185,129,0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #10b981;">
                                    <i class="fas fa-robot"></i>
                                </div>
                                Análisis de Rendimiento
                            </div>
                            <div style="font-size: 0.9rem; color: #888; line-height: 1.7;">
                                Tras cada evento, nuestro sistema analiza tu juego basándose en:
                                <br><br>
                                • <b style="color: white;">EFECTIVIDAD:</b> Mide tu peso real en el marcador. ¿Cuántos de los puntos ganados han pasado por tu pala?
                                <br>• <b style="color: white;">CONSISTENCIA:</b> Evalúa si mantienes el mismo nivel técnico en todas las rondas o si tienes picos y valles.
                                <br>• <b style="color: white;">RESISTENCIA:</b> Analiza si tu rendimiento baja en los últimos partidos por cansancio o si mantienes el ritmo.
                            </div>
                        </div>

                    </div>
                </div>
            `;
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
    } // End of ControlTowerView class

    // Export class to global scope for fallback instantiation
    window.ControlTowerViewClass = ControlTowerView;
    window.ControlTowerView = new ControlTowerView();
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
