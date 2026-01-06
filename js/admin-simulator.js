/**
 * 🎲 ADMIN SIMULATOR
 * Herramientas para simular Americanas con jugadores reales
 */

const AdminSimulator = {


    /**
     * Ejecutar simulación vacía (sin resultados) - Preparar Americana
     */
    async runEmptyCycle() {
        const status = document.getElementById('sim-status-empty');
        const courtSelect = document.getElementById('sim-courts-empty');
        const pairModeSelect = document.getElementById('sim-pair-mode-empty');

        const numCourts = parseInt(courtSelect?.value || 3);
        const pairMode = pairModeSelect?.value || 'rotating';
        const numPlayers = numCourts * 4;

        if (status) {
            status.style.display = 'block';
            status.innerHTML = `📝 <b>PREPARANDO AMERICANA (${pairMode === 'fixed' ? 'PAREJAS FIJAS' : 'PAREJAS ROTATIVAS'})</b><br>`;
            status.innerHTML += `> Seleccionando ${numCourts} pistas / ${numPlayers} jugadores aleatorios...<br>`;
        }

        try {
            // 1. Fetch Real Players
            const allPlayers = await FirebaseDB.players.getAll();
            if (allPlayers.length < numPlayers) {
                if (status) status.innerHTML += `<br>❌ Error: Necesitas ${numPlayers} jugadores, tienes ${allPlayers.length}`;
                return;
            }

            // Shuffle and Pick
            const shuffled = allPlayers.sort(() => 0.5 - Math.random());
            const selectedPlayers = shuffled.slice(0, numPlayers);

            // 2. Create Americana
            const americanaData = {
                name: `AMERICANA (${pairMode === 'fixed' ? 'FIJAS' : 'ROTATIVAS'}) - ${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, '0')}`,
                date: new Date().toISOString().split('T')[0],
                time: String(new Date().getHours()).padStart(2, '0') + ':' + String(new Date().getMinutes()).padStart(2, '0'),
                status: 'live',
                players: selectedPlayers.map((p, i) => ({ id: p.id, uid: p.id, name: p.name, level: p.level || '3.5', current_court: Math.floor(i / 4) + 1 })),
                registeredPlayers: selectedPlayers.map((p, i) => ({ id: p.id, uid: p.id, name: p.name, level: p.level || '3.5', current_court: Math.floor(i / 4) + 1 })),
                max_courts: numCourts,
                category: 'mixed',
                image_url: 'img/americana-pro.png',
                pair_mode: pairMode
            };

            const newAmericana = await FirebaseDB.americanas.create(americanaData);
            const americanaId = newAmericana.id;

            if (status) status.innerHTML += `> Evento creado (${americanaId})<br>`;

            // 3. Generate 6 Rounds based on pair mode
            if (pairMode === 'fixed') {
                // PAREJAS FIJAS
                if (status) status.innerHTML += `> Creando parejas fijas...<br>`;
                const pairs = FixedPairsLogic.createFixedPairs(selectedPlayers);
                await FirebaseDB.americanas.update(americanaId, { fixed_pairs: pairs });

                if (status) status.innerHTML += `> Generando 6 Rondas con sistema Pozo (Marcadores a 0)...<br>`;

                // For Pozo mode with 0 scores, all 6 rounds are initially generated with the same pairings 
                // because no one moves up/down yet.
                for (let round = 1; round <= 6; round++) {
                    if (status) status.innerHTML += `> Ronda ${round}... `;
                    const matches = FixedPairsLogic.generatePozoRound(pairs, round, numCourts);

                    for (const m of matches) {
                        await FirebaseDB.matches.create({
                            ...m,
                            americana_id: americanaId,
                            status: 'scheduled',
                            score_a: 0,
                            score_b: 0
                        });
                    }
                    if (status) status.innerHTML += `✅<br>`;
                }

            } else {
                const currentPlayerData = newAmericana.players || [];
                let allMatches = [];
                for (let round = 1; round <= 6; round++) {
                    if (status) status.innerHTML += `> Ronda ${round}... `;

                    let roundMatches;
                    if (round === 1) {
                        // First round: basic grouping
                        roundMatches = RotatingPozoLogic.generateRound(newAmericana.players, round, numCourts);
                    } else {
                        // Subsequent rounds: Up/Down logic
                        const prevRoundMatches = allMatches.filter(m => m.round === round - 1);
                        const americanaInState = await FirebaseDB.americanas.getById(americanaId);
                        const movedPlayers = RotatingPozoLogic.updatePlayerCourts(americanaInState.players, prevRoundMatches, numCourts);
                        await FirebaseDB.americanas.update(americanaId, { players: movedPlayers });
                        roundMatches = RotatingPozoLogic.generateRound(movedPlayers, round, numCourts);
                    }

                    for (const m of roundMatches) {
                        const matchData = {
                            ...m,
                            americana_id: americanaId,
                            status: 'scheduled',
                            score_a: 0,
                            score_b: 0
                        };
                        await FirebaseDB.matches.create(matchData);
                        allMatches.push(matchData);
                    }
                    if (status) status.innerHTML += `✅<br>`;
                }
            }

            if (status) {
                status.innerHTML += '<br>🏁 <b>PREPARACIÓN DE 6 RONDAS COMPLETADA</b><br>';
                status.innerHTML += '> Redirigiendo a pantalla de resultados...<br>';
            }

            setTimeout(() => loadAdminView('matches'), 2000);

        } catch (e) {
            console.error(e);
            if (status) status.innerHTML += `<br>❌ Error: ${e.message}`;
        }
    },

    /**
     * Ejecutar simulación completa con resultados aleatorios
     */
    async runRandomCycle() {
        const status = document.getElementById('sim-status-random');
        const courtSelect = document.getElementById('sim-courts-random');
        const pairModeSelect = document.getElementById('sim-pair-mode-random');

        const numCourts = parseInt(courtSelect?.value || 3);
        const pairMode = pairModeSelect?.value || 'rotating';
        const numPlayers = numCourts * 4;

        if (status) {
            status.style.display = 'block';
            status.innerHTML = `🎲 <b>SIMULACIÓN COMPLETA (${pairMode === 'fixed' ? 'PAREJAS FIJAS' : 'PAREJAS ROTATIVAS'})</b><br>`;
            status.innerHTML += `> Configurando ${numCourts} pistas / ${numPlayers} jugadores...<br>`;
        }

        try {
            // 1. Fetch Real Players
            const allPlayers = await FirebaseDB.players.getAll();
            if (allPlayers.length < numPlayers) {
                if (status) status.innerHTML += `<br>❌ Error: Necesitas ${numPlayers} jugadores, tienes ${allPlayers.length}`;
                return;
            }

            const shuffled = allPlayers.sort(() => 0.5 - Math.random());
            const selectedPlayers = shuffled.slice(0, numPlayers);

            // 2. Create Americana
            const americanaData = {
                name: `SIM ${pairMode === 'fixed' ? 'FIJAS' : 'ROT'} ${numCourts}P - ${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, '0')}`,
                date: new Date().toISOString().split('T')[0],
                status: 'finished',
                players: selectedPlayers.map((p, i) => ({ id: p.id, uid: p.id, name: p.name, level: p.level || '3.5', current_court: Math.floor(i / 4) + 1 })),
                max_courts: numCourts,
                category: 'mixed',
                image_url: 'img/americana-pro.png',
                pair_mode: pairMode
            };

            const newAmericana = await FirebaseDB.americanas.create(americanaData);
            const americanaId = newAmericana.id;

            if (status) status.innerHTML += `> Americana creada: ${americanaId}<br>`;

            // 3. Simulate 6 rounds
            if (pairMode === 'fixed') {
                // PAREJAS FIJAS
                const pairs = FixedPairsLogic.createFixedPairs(selectedPlayers);
                await FirebaseDB.americanas.update(americanaId, { fixed_pairs: pairs });

                for (let round = 1; round <= 6; round++) {
                    if (status) status.innerHTML += `> Simulando ronda ${round}... `;

                    const matches = FixedPairsLogic.generatePozoRound(pairs, round, numCourts);

                    for (const m of matches) {
                        // Simulate scores
                        const scoreA = Math.floor(Math.random() * 7) + 1;
                        const scoreB = scoreA === 7 ? Math.floor(Math.random() * 6) : (Math.random() > 0.5 ? scoreA + 1 : scoreA - 1);

                        await FirebaseDB.matches.create({
                            ...m,
                            americana_id: americanaId,
                            status: 'finished',
                            score_a: Math.max(scoreA, scoreB),
                            score_b: Math.min(scoreA, scoreB)
                        });
                    }

                    // Update pair rankings for next round
                    const roundMatches = await FirebaseDB.matches.getByAmericana(americanaId);
                    const lastRoundMatches = roundMatches.filter(m => m.round === round);
                    FixedPairsLogic.updatePozoRankings(pairs, lastRoundMatches, numCourts);

                    if (status) status.innerHTML += `✅<br>`;
                }

            } else {
                // PAREJAS ROTATIVAS (RANDOM SIM)
                let allMatches = [];
                let currentPlayers = selectedPlayers.map((p, i) => ({ id: p.id, uid: p.id, name: p.name, level: p.level || '3.5', current_court: Math.floor(i / 4) + 1 }));

                for (let round = 1; round <= 6; round++) {
                    if (status) status.innerHTML += `> Simulando ronda ${round}... `;

                    let roundMatches;
                    if (round === 1) {
                        roundMatches = RotatingPozoLogic.generateRound(currentPlayers, round, numCourts);
                    } else {
                        const prevRoundMatches = allMatches.filter(m => m.round === round - 1);
                        currentPlayers = RotatingPozoLogic.updatePlayerCourts(currentPlayers, prevRoundMatches, numCourts);
                        await FirebaseDB.americanas.update(americanaId, { players: currentPlayers });
                        roundMatches = RotatingPozoLogic.generateRound(currentPlayers, round, numCourts);
                    }

                    for (const m of roundMatches) {
                        const scoreA = Math.floor(Math.random() * 7) + 1;
                        const scoreB = scoreA === 7 ? Math.floor(Math.random() * 6) : (Math.random() > 0.5 ? scoreA + 1 : scoreA - 1);

                        const match = {
                            ...m,
                            americana_id: americanaId,
                            status: 'finished',
                            score_a: Math.max(scoreA, scoreB),
                            score_b: Math.min(scoreA, scoreB)
                        };

                        await FirebaseDB.matches.create(match);
                        allMatches.push(match);
                    }
                    if (status) status.innerHTML += `✅<br>`;
                }
            }

            if (status) {
                status.innerHTML += '<br>🎉 <b>SIMULACIÓN COMPLETADA</b><br>';
                status.innerHTML += '> Redirigiendo a resultados...<br>';
            }

            setTimeout(() => loadAdminView('matches'), 2000);

        } catch (e) {
            console.error(e);
            if (status) status.innerHTML += `<br>❌ Error: ${e.message}`;
        }
    }
};

// Exportar globalmente
window.AdminSimulator = AdminSimulator;
console.log("🎲 AdminSimulator cargado");
