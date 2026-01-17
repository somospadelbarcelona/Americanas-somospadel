/**
 * TVView.js
 * Specialized view for "Center Court" displays (Smart TVs).
 * Features: High contrast, large fonts, auto-rotation, no admin controls.
 */
(function () {
    class TVView {
        constructor() {
            this.eventId = null;
            this.eventDoc = null;
            this.matches = [];
            this.standings = [];
            this.nextRoundMatches = [];
            this.currentSlide = 'matches'; // 'matches', 'standings', 'next'
            this.slideInterval = null;
            this.unsubscribeMatches = null;
            this.unsubscribeEvent = null;
        }

        async load(eventId, type = 'americana') {
            console.log("📺 [TV Mode] Loading for:", eventId);
            this.eventId = eventId;
            this.type = type;

            this.renderLoader();

            // Load Initial Event Data
            try {
                let doc = await window.db.collection('americanas').doc(eventId).get();
                if (!doc.exists) {
                    doc = await window.db.collection('entrenos').doc(eventId).get();
                    this.type = 'entreno';
                }

                if (doc.exists) {
                    this.eventDoc = { id: doc.id, ...doc.data() };
                } else {
                    document.body.innerHTML = '<h1 style="color:white; text-align:center; padding-top:20%;">EVENTO NO ENCONTRADO</h1>';
                    return;
                }
            } catch (e) {
                console.error(e);
            }

            this.startListeners();
            this.startCycle();

            document.body.style.overflow = 'hidden';
            document.body.style.background = '#000';
        }

        startListeners() {
            const collection = this.type === 'entreno' ? 'entrenos' : 'americanas';
            this.unsubscribeEvent = window.db.collection(collection).doc(this.eventId)
                .onSnapshot(snap => {
                    if (snap.exists) {
                        this.eventDoc = { id: snap.id, ...snap.data() };
                        this.render();
                    }
                });

            const matchesColl = this.type === 'entreno' ? 'entrenos_matches' : 'matches';
            this.unsubscribeMatches = window.db.collection(matchesColl)
                .where('americana_id', '==', this.eventId)
                .onSnapshot(snap => {
                    const raw = snap.docs.map(d => d.data());
                    const seen = new Set();
                    this.matches = [];
                    raw.forEach(m => {
                        const sig = `${m.round}-${m.court}`;
                        if (!seen.has(sig)) {
                            seen.add(sig);
                            this.matches.push(m);
                        }
                    });

                    this.calculateStandings();
                    this.filterNextRound();
                    this.render();
                });
        }

        formatName(nameStr) {
            if (!nameStr) return 'JUGADOR';
            // Clean simple string
            let clean = nameStr.trim();
            // If comma format "Surname, Name", flip it? No, usually "Name Surname"
            // Take up to 2 words? 
            const parts = clean.split(' ');
            if (parts.length > 2) {
                // Return "Name Surname" only (first 2 words)
                // Exception: "De la Rosa" -> checking length of part 1?
                // Simple heuristic: First word + Last word if long, or First + Second
                return `${parts[0]} ${parts[1]}`;
            }
            return clean;
        }

        calculateStandings() {
            const stats = {};

            this.matches.forEach(m => {
                if (m.status !== 'finished') return;

                // --- ROBUST NAME PARSING ---
                // We need to map team_ids to names correctly.
                // Database might store names as Array OR String.

                const processTeam = (ids, namesRaw, scoreSelf, scoreOther) => {
                    if (!ids || !Array.isArray(ids)) return;

                    let namesArray = [];
                    if (Array.isArray(namesRaw)) {
                        namesArray = namesRaw;
                    } else if (typeof namesRaw === 'string') {
                        // "Name 1 / Name 2"
                        namesArray = namesRaw.split(' / ').map(s => s.trim());
                    }

                    const court = parseInt(m.court || 99);
                    const roundNum = parseInt(m.round || 0);

                    ids.forEach((uid, idx) => {
                        // Fallback name if array mismatch
                        let pName = namesArray[idx] || `Jugador ${idx + 1}`;
                        // Sanitize single letter bug: ensure pName is string of length > 1 if possible
                        if (pName.length <= 1 && namesArray.length === 1 && ids.length === 1) pName = namesRaw;

                        if (!stats[uid]) {
                            stats[uid] = {
                                name: this.formatName(pName),
                                played: 0,
                                won: 0,
                                points: 0,
                                diff: 0,
                                court1Count: 0,
                                bestCourt: 99,
                                lastMatchCourt: 99,
                                lastMatchRound: 0
                            };
                        }

                        stats[uid].played++;
                        stats[uid].points += parseInt(scoreSelf || 0);
                        stats[uid].diff += (parseInt(scoreSelf || 0) - parseInt(scoreOther || 0));
                        if (parseInt(scoreSelf) > parseInt(scoreOther)) stats[uid].won++;

                        // POZO METRICS
                        if (court === 1) stats[uid].court1Count++;
                        if (court < stats[uid].bestCourt) stats[uid].bestCourt = court;

                        // Last Match Tracking
                        if (roundNum >= stats[uid].lastMatchRound) {
                            stats[uid].lastMatchRound = roundNum;
                            stats[uid].lastMatchCourt = court;
                        }
                    });
                };

                processTeam(m.team_a_ids, m.team_a_names, m.score_a, m.score_b);
                processTeam(m.team_b_ids, m.team_b_names, m.score_b, m.score_a);
            });

            this.standings = Object.values(stats).sort((a, b) => {
                // --- ADVANCED POZO / CONTROL TOWER LOGIC ---
                // 1. Wins
                if (b.won !== a.won) return b.won - a.won;

                // 2. Court 1 Count (King of the Court)
                if (b.court1Count !== a.court1Count) return b.court1Count - a.court1Count;

                // 3. Last Match Position (Lower court number is better)
                if (a.lastMatchCourt !== b.lastMatchCourt) return a.lastMatchCourt - b.lastMatchCourt;

                // 4. Points Diff
                return b.diff - a.diff;
            });
        }

        filterNextRound() {
            // Check if there are matches generated but NOT started (round > current max live round)
            const maxRound = this.matches.length > 0 ? Math.max(...this.matches.map(m => parseInt(m.round))) : 1;
            // Find matches for maxRound + 1? Or just matches that are 'open'?
            // Usually next round is generated as 'scheduled' or just exists.

            // Logic: Find highest round. If all matches in highest round are finished, look for highest round again (it's same).
            // Actually, we want to see if a NEW round exists that has NO scores yet.
            const nextRoundMatches = this.matches.filter(m => parseInt(m.round) === maxRound && m.status !== 'finished');

            // If current round is fully finished, and no next round exists, we show nothing.
            // If current round has live matches, we show them.
            // If current round matches are all pending start (e.g. just generated), we call that "NEXT ROUND" mode.

            const isAllPending = nextRoundMatches.length > 0 && nextRoundMatches.every(m => !m.score_a && m.status !== 'finished');
            if (isAllPending) {
                // This counts as "Next Round" preview
                this.nextRoundMatches = nextRoundMatches.sort((a, b) => a.court - b.court);
            } else {
                this.nextRoundMatches = [];
            }
        }

        startCycle() {
            if (this.slideInterval) clearInterval(this.slideInterval);
            this.slideInterval = setInterval(() => {
                // LOGIC: Matches -> Standings -> (Next Round?) -> Repeat
                if (this.currentSlide === 'matches') {
                    this.currentSlide = 'standings';
                } else if (this.currentSlide === 'standings') {
                    if (this.nextRoundMatches.length > 0 && this.nextRoundMatches[0].round > 1) {
                        // Only show "Next Round" screen if we actually have a pending next round
                        // and it's not the first round (redundant with Matches view usually)
                        this.currentSlide = 'next';
                    } else {
                        this.currentSlide = 'matches';
                    }
                } else {
                    this.currentSlide = 'matches';
                }

                const container = document.getElementById('tv-content-container');
                if (container) {
                    container.style.opacity = '0';
                    setTimeout(() => {
                        this.renderContent();
                        container.style.opacity = '1';
                    }, 500);
                }
            }, 15000);
        }

        renderLoader() {
            document.body.innerHTML = `
                <style>
                    body { margin: 0; background: black; font-family: 'Outfit', sans-serif; color: white; }
                    .tv-loader { width: 80px; height: 80px; border: 8px solid #333; border-top-color: #CCFF00; border-radius: 50%; animation: spin 1s linear infinite; }
                    @keyframes spin { to { transform: rotate(360deg); } }
                </style>
                <div style="height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                    <div class="tv-loader"></div>
                    <h2 style="margin-top: 30px; font-weight: 300; letter-spacing: 5px;">CARGANDO MODO TV...</h2>
                </div>
            `;
        }

        render() {
            if (!document.getElementById('tv-root')) {
                // (Same Shell as before)
                document.body.innerHTML = `
                    <div id="tv-root" style="height: 100vh; display: flex; flex-direction: column; background: #050505; overflow: hidden; position: relative;">
                        <!-- HEADER -->
                        <div style="height: 12vh; display: flex; align-items: center; justify-content: space-between; padding: 0 40px; border-bottom: 2px solid #222; background: #000;">
                            <div style="display: flex; align-items: center; gap: 30px;">
                                <!-- BACK BUTTON -->
                                <div onclick="window.Router.navigate('dashboard')" style="
                                    background: #111;
                                    color: #CCFF00;
                                    border: 2px solid #CCFF00;
                                    padding: 10px 20px;
                                    border-radius: 12px;
                                    cursor: pointer;
                                    display: flex;
                                    align-items: center;
                                    gap: 10px;
                                    font-weight: 950;
                                    font-size: 1.2rem;
                                    box-shadow: 0 0 15px rgba(204,255,0,0.3);
                                    transition: all 0.2s;
                                " onmouseover="this.style.transform='scale(1.05)'; this.style.background='#CCFF00'; this.style.color='#000';" onmouseout="this.style.transform='scale(1)'; this.style.background='#111'; this.style.color='#CCFF00';">
                                    <i class="fas fa-arrow-left"></i>
                                    VOLVER
                                </div>

                                <img src="img/logo_somospadel.png" style="height: 8vh;">
                                <div>
                                    <h1 style="margin: 0; font-size: 2.5rem; font-weight: 900; line-height: 1; text-transform: uppercase; color: white;">${this.eventDoc?.name || 'EVENTO'}</h1>
                                    <div style="color: #666; font-size: 1.2rem; margin-top: 5px; font-weight: 700; letter-spacing: 2px;">MODO ESPECTADOR • ${this.type === 'entreno' ? 'ENTRENO' : 'TORNEO'}</div>
                                </div>
                            </div>
                            <div style="text-align: right;">
                                <div id="tv-clock" style="font-size: 3rem; font-weight: 900; color: #CCFF00; font-variant-numeric: tabular-nums;">--:--</div>
                            </div>
                        </div>

                        <!-- CONTENT AREA -->
                        <div id="tv-content-container" style="flex: 1; padding: 30px; transition: opacity 0.5s;">
                            <!-- DYNAMIC CONTENT -->
                        </div>

                        <!-- FOOTER TICKER -->
                        <div style="height: 7vh; background: #CCFF00; color: black; display: flex; align-items: center; overflow: hidden; font-weight: 950; font-size: 1.8rem; text-transform: uppercase; border-top: 4px solid black;">
                            <div style="padding: 0 40px; background: black; color: #CCFF00; height: 100%; display: flex; align-items: center; border-right: 4px solid black; position: relative; z-index: 10;">LIVE</div>
                            <marquee scrollamount="10" style="padding-top:5px; flex: 1;">
                                🎾 BIENVENIDOS A LA EXPERIENCIA SOMOSPADEL.EU • EL MEJOR PÁDEL DE BARCELONA EN VIVO • 🏆 SIGUE TU CLASIFICACIÓN EN TIEMPO REAL • 🔥 NIVEL ÉPICO EN CADA PISTA • 💬 CHAT TÁCTICO ACTIVADO: BUSCA PAREJA CON EL BOTÓN SOS • 📺 MODO TV ONLINE • ¡VAMOS SOMOS PADEL! • DISFRUTA DE NUESTRAS INSTALACIONES TOP • FAIR PLAY Y DIVERSIÓN SIEMPRE • 🚀 SOMOSPADEL.EU CONNECT
                            </marquee>
                        </div>
                    </div>
                `;

                setInterval(() => {
                    const now = new Date();
                    const el = document.getElementById('tv-clock');
                    if (el) el.innerText = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                }, 1000);
            }

            this.renderContent();
        }

        renderContent() {
            const container = document.getElementById('tv-content-container');
            if (!container) return;

            if (this.currentSlide === 'matches') {
                container.innerHTML = this.getMatchesHTML();
            } else if (this.currentSlide === 'standings') {
                container.innerHTML = this.getStandingsHTML();
            } else if (this.currentSlide === 'next') {
                container.innerHTML = this.getNextRoundHTML();
            }
        }

        getMatchesHTML() {
            const maxRound = this.matches.length > 0 ? Math.max(...this.matches.map(m => parseInt(m.round))) : 1;
            const currentRoundMatches = this.matches.filter(m => parseInt(m.round) === maxRound).sort((a, b) => a.court - b.court);

            return `
                <div style="height: 100%; display: flex; flex-direction: column;">
                    <h2 style="font-size: 2rem; color: white; margin: 0 0 30px 0; display: flex; align-items: center; gap: 15px;">
                        <span style="background: #CCFF00; color: black; padding: 5px 15px; border-radius: 8px;">RONDA ${maxRound}</span>
                        EN PISTA
                    </h2>
                    
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 30px; height: 100%;">
                        ${currentRoundMatches.map(m => {
                const isFinished = m.status === 'finished';
                const sA = parseInt(m.score_a || 0);
                const sB = parseInt(m.score_b || 0);

                // Names Parsing
                const getCleanNames = (ids, namesRaw) => {
                    if (!ids) return "JUGADOR";
                    let namesArr = Array.isArray(namesRaw) ? namesRaw : (namesRaw || '').split(' / ');
                    return ids.map((_, i) => this.formatName(namesArr[i] || `Jugador ${i + 1}`)).join(' / ');
                };

                const nA = getCleanNames(m.team_a_ids, m.team_a_names);
                const nB = getCleanNames(m.team_b_ids, m.team_b_names);

                return `
                                <div style="background: #111; border: 2px solid ${isFinished ? '#333' : '#CCFF00'}; border-radius: 20px; padding: 0; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.5);">
                                    <div style="background: ${isFinished ? '#333' : '#CCFF00'}; color: ${isFinished ? '#888' : 'black'}; padding: 10px 20px; font-weight: 900; font-size: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
                                        <span>PISTA ${m.court}</span>
                                        ${isFinished ? '<span>✅ FINALIZADO</span>' : '<span style="animation: pulse 1s infinite alternate;">🔴 EN JUEGO</span>'}
                                    </div>
                                    <div style="flex: 1; display: flex; align-items: center; padding: 20px;">
                                        <div style="flex: 1; text-align: center;">
                                            <div style="font-size: 1.5rem; font-weight: 800; color: white; line-height: 1.2;">${nA}</div>
                                        </div>
                                        <div style="width: 140px; text-align: center; font-family: 'Monospace', monospace;">
                                            ${isFinished ? `
                                                <div style="font-size: 3.5rem; font-weight: 900; color: #CCFF00;">${sA}-${sB}</div>
                                            ` : `<div style="font-size: 2rem; color: #666; font-weight: 900;">VS</div>`}
                                        </div>
                                        <div style="flex: 1; text-align: center;">
                                            <div style="font-size: 1.5rem; font-weight: 800; color: white; line-height: 1.2;">${nB}</div>
                                        </div>
                                    </div>
                                </div>
                            `;
            }).join('')}
                    </div>
                </div>
            `;
        }

        getNextRoundHTML() {
            // New "On Deck" View
            const roundNum = this.nextRoundMatches[0].round;
            return `
                 <div style="height: 100%; display: flex; flex-direction: column;">
                    <h2 style="font-size: 2rem; color: white; margin: 0 0 30px 0; display: flex; align-items: center; gap: 15px;">
                        <span style="background: #0ea5e9; color: white; padding: 5px 15px; border-radius: 8px; box-shadow: 0 0 15px #0ea5e9;">PRÓXIMA RONDA ${roundNum}</span>
                        PREPARADOS PARA ENTRAR
                    </h2>
                    
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 30px; height: 100%;">
                        ${this.nextRoundMatches.map(m => {
                const getCleanNames = (ids, namesRaw) => {
                    if (!ids) return "JUGADOR";
                    let namesArr = Array.isArray(namesRaw) ? namesRaw : (namesRaw || '').split(' / ');
                    return ids.map((_, i) => this.formatName(namesArr[i] || `Jugador ${i + 1}`)).join(' / ');
                };
                const nA = getCleanNames(m.team_a_ids, m.team_a_names);
                const nB = getCleanNames(m.team_b_ids, m.team_b_names);

                return `
                                <div style="background: #051626; border: 2px solid #0ea5e9; border-radius: 20px; padding: 0; display: flex; flex-direction: column; overflow: hidden; opacity: 0.9;">
                                    <div style="background: #0ea5e9; color: white; padding: 10px 20px; font-weight: 900; font-size: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
                                        <span>PISTA ${m.court}</span>
                                        <span>⏳ SIGUIENTE</span>
                                    </div>
                                    <div style="flex: 1; display: flex; align-items: center; padding: 20px;">
                                        <div style="flex: 1; text-align: center;">
                                            <div style="font-size: 1.5rem; font-weight: 800; color: white;">${nA}</div>
                                        </div>
                                        <div style="width: 80px; text-align: center; font-size: 1.5rem; color: #444;">VS</div>
                                        <div style="flex: 1; text-align: center;">
                                            <div style="font-size: 1.5rem; font-weight: 800; color: white;">${nB}</div>
                                        </div>
                                    </div>
                                </div>
                            `;
            }).join('')}
                    </div>
                </div>
            `;
        }

        getStandingsHTML() {
            // Updated columns for POZO (Wins & Court 1)
            const top = this.standings.slice(0, 10);
            return `
                <div style="height: 100%; display: flex; flex-direction: column;">
                    <h2 style="font-size: 2rem; color: white; margin: 0 0 30px 0; display: flex; align-items: center; gap: 15px;">
                        <i class="fas fa-trophy" style="color: #CCFF00;"></i> CLASIFICACIÓN ${this.type === 'entreno' ? 'POZO' : ''}
                    </h2>
                    
                    <div style="background: #111; border-radius: 20px; border: 1px solid #333; overflow: hidden; flex: 1;">
                        <table style="width: 100%; border-collapse: collapse; color: white;">
                            <thead>
                                <tr style="background: #222; text-transform: uppercase;">
                                    <th style="padding: 15px 30px; text-align: left; font-size: 1.2rem;">#</th>
                                    <th style="padding: 15px 30px; text-align: left; font-size: 1.2rem;">JUGADOR</th>
                                    <th style="padding: 15px; text-align: center; font-size: 1.2rem; color: #CCFF00;">VICTORIAS</th>
                                    ${this.type === 'entreno' ? '<th style="padding: 15px; text-align: center; font-size: 1.2rem;">PISTA 1</th>' : ''}
                                    <th style="padding: 15px; text-align: center; font-size: 1.2rem;">DIF</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${top.map((p, idx) => `
                                    <tr style="border-bottom: 1px solid #333; font-size: 1.4rem; font-weight: 700; background: ${idx < 4 ? 'rgba(204,255,0,0.03)' : 'transparent'};">
                                        <td style="padding: 15px 30px; color: ${idx === 0 ? '#CCFF00' : '#666'}; font-weight:900; font-size: 1.6rem;">${idx + 1}</td>
                                        <td style="padding: 15px 30px;">
                                            <div style="display:flex; align-items:center; gap:15px;">
                                                ${idx === 0 ? '👑' : ''} ${p.name}
                                            </div>
                                        </td>
                                        <td style="padding: 15px; text-align: center; font-weight: 900; color: #CCFF00; font-size: 1.6rem;">${p.won}</td>
                                        ${this.type === 'entreno' ? `<td style="padding: 15px; text-align: center; color: #ddd;">${p.court1Count}</td>` : ''}
                                        <td style="padding: 15px; text-align: center; color: #888;">${p.diff > 0 ? '+' + p.diff : p.diff}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }
    }

    // Export
    window.TVViewClass = TVView;
    window.TVView = new TVView(); // Singleton
    console.log("📺 TV View Script Loaded");

})();
