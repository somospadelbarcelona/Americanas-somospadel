/**
 * 🎲 ADMIN SIMULATOR
 * Herramientas para simular Americanas con jugadores reales
 */

const AdminSimulator = {

    /**
     * Helper para seleccionar jugadores según categoría (Género)
     */
    async getPlayersByCategory(category, count) {
        const allPlayers = await FirebaseDB.players.getAll();

        // Asignar género si no existe para la simulación
        allPlayers.forEach(p => {
            if (!p.gender) p.gender = (Math.random() > 0.5 ? 'chico' : 'chica');
        });

        let selected = [];

        if (category === 'male') {
            const males = allPlayers.filter(p => p.gender === 'chico');
            if (males.length < count) throw new Error(`Faltan jugadores masculinos (${males.length}/${count})`);
            selected = males.sort(() => 0.5 - Math.random()).slice(0, count);
        }
        else if (category === 'female') {
            const females = allPlayers.filter(p => p.gender === 'chica');
            if (females.length < count) throw new Error(`Faltan jugadores femeninos (${females.length}/${count})`);
            selected = females.sort(() => 0.5 - Math.random()).slice(0, count);
        }
        else if (category === 'mixed') {
            const males = allPlayers.filter(p => p.gender === 'chico').sort(() => 0.5 - Math.random());
            const females = allPlayers.filter(p => p.gender === 'chica').sort(() => 0.5 - Math.random());

            const half = count / 2;
            if (males.length < half || females.length < half) {
                throw new Error(`Faltan jugadores para MIXTO (Necesitas ${half} de cada, tienes M:${males.length} F:${females.length})`);
            }

            // Mezclar para que en "Fijas" se emparejen M+F de forma natural si los pasamos alternos
            for (let i = 0; i < half; i++) {
                selected.push(males[i]);
                selected.push(females[i]);
            }
        }
        else {
            // OPEN
            const validPlayers = allPlayers.filter(p => p.gender === 'chico' || p.gender === 'chica');
            if (validPlayers.length < count) throw new Error(`Faltan jugadores para OPEN (${validPlayers.length}/${count})`);
            selected = validPlayers.sort(() => 0.5 - Math.random()).slice(0, count);
        }

        return selected;
    },

    /**
     * Ejecutar simulación vacía (sin resultados) - Preparar Americana
     */
    async runEmptyCycle(config = {}) {
        const status = document.getElementById('sim-status-empty');
        const courtSelect = document.getElementById('sim-courts-empty');
        const pairModeSelect = document.getElementById('sim-pair-mode-empty');
        const categorySelect = document.getElementById('sim-category-empty');

        const numCourts = parseInt(courtSelect?.value || 3);
        const pairMode = pairModeSelect?.value || 'rotating';
        const category = categorySelect?.value || 'open';
        const numPlayers = numCourts * 4;

        if (status) {
            status.style.display = 'block';
            let catName = category === 'open' ? 'LIBRE' : (category === 'male' ? 'MASCULINA' : (category === 'female' ? 'FEMENINA' : 'MIXTA'));
            status.innerHTML = `📝 <b>PREPARANDO AMERICANA (${catName} - ${pairMode === 'fixed' ? 'FIJA' : 'TWISTER'})</b><br>`;
            status.innerHTML += `> Seleccionando ${numCourts} pistas / ${numPlayers} jugadores cualificados...<br>`;
        }

        try {
            // 1. Fetch Players by Category
            const selectedPlayers = await this.getPlayersByCategory(category, numPlayers);

            // 2. Create Americana
            const catName = category === 'open' ? 'LIBRE' : (category === 'male' ? 'MASCULINA' : (category === 'female' ? 'FEMENINA' : 'MIXTA'));
            const modeName = pairMode === 'fixed' ? 'FIJA' : 'TWISTER';

            const americanaData = {
                name: `AMERICANA ${catName} (${modeName}) - ${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, '0')}`,
                date: new Date().toISOString().split('T')[0],
                time: String(new Date().getHours()).padStart(2, '0') + ':' + String(new Date().getMinutes()).padStart(2, '0'),
                status: 'in_progress',
                players: selectedPlayers.map((p, i) => ({
                    id: p.id,
                    uid: p.id,
                    name: p.name,
                    level: p.level || '3.5',
                    gender: p.gender,
                    current_court: Math.floor(i / 4) + 1
                })),
                registeredPlayers: selectedPlayers.map((p, i) => ({
                    id: p.id,
                    uid: p.id,
                    name: p.name,
                    level: p.level || '3.5',
                    gender: p.gender,
                    current_court: Math.floor(i / 4) + 1
                })),
                max_courts: numCourts,
                category: category,
                category: category,
                image_url: category === 'male' ? 'img/ball-masculina.png' : (category === 'female' ? 'img/ball-femenina.png' : 'img/ball-mixta.png'),
                pair_mode: pairMode,
                price_members: config.price_members || 12,
                price_external: config.price_external || 14
            };

            const newAmericana = await FirebaseDB.americanas.create(americanaData);
            const americanaId = newAmericana.id;

            if (status) status.innerHTML += `> Evento creado (${americanaId})<br>`;

            // 3. Generate Rounds
            // IMPORTANTE: En sistemas Pozo (Fija y Twister), NO pre-generamos las 6 rondas con 0-0
            // porque la Ronda 2 depende de los resultados de la Ronda 1.
            // Solo generamos la RONDA 1.
            const roundsToGenerate = 1;

            if (pairMode === 'fixed') {
                if (status) status.innerHTML += `> Creando parejas fijas...<br>`;
                const pairs = FixedPairsLogic.createFixedPairs(selectedPlayers, category);
                await FirebaseDB.americanas.update(americanaId, { fixed_pairs: pairs });

                if (status) status.innerHTML += `> Generando Ronda 1 sistema Pozo...<br>`;
                for (let round = 1; round <= roundsToGenerate; round++) {
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
                    if (status) status.innerHTML += `> Ronda ${round} ✅ (El resto se generarán tras meter resultados)<br>`;
                }

            } else {
                let currentPlayers = americanaData.players;
                if (status) status.innerHTML += `> Generando Ronda 1 sistema Twister...<br>`;
                for (let round = 1; round <= roundsToGenerate; round++) {
                    let roundMatches = RotatingPozoLogic.generateRound(currentPlayers, round, numCourts, category);

                    for (const m of roundMatches) {
                        const matchData = { ...m, americana_id: americanaId, status: 'scheduled', score_a: 0, score_b: 0 };
                        await FirebaseDB.matches.create(matchData);
                    }
                    if (status) status.innerHTML += `> Ronda ${round} ✅ (El resto se generarán tras meter resultados)<br>`;
                }
            }

            if (status) status.innerHTML += '<br>🏁 <b>PREPARACIÓN COMPLETADA</b><br>';
            setTimeout(() => loadAdminView('matches'), 1500);

        } catch (e) {
            console.error(e);
            if (status) status.innerHTML += `<br>❌ Error: ${e.message}`;
        }
    },


};

window.AdminSimulator = AdminSimulator;
console.log("🎲 AdminSimulator PRO (Categorías) cargado");
