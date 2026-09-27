/**
 * TournamentLogicAuditService.js
 * 
 * Centro de Control & Auditoría de Lógica de Torneos y Entrenos
 * Motor de simulación multimodal, auditoría de Reglas de Oro, diagnóstico de eventos reales
 * y batería de self-test algorítmico en memoria.
 * 
 * Compatible con entornos Web (window.TournamentLogicAuditService) y Node.js (module.exports).
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.TournamentLogicAuditService = factory();
    }
}(typeof self !== 'undefined' ? self : (typeof globalThis !== 'undefined' ? globalThis : this), function () {
    'use strict';

    const LOG_PREFIX = '[TournamentLogicAuditService]';

    const PAD_NAMES = [
        // Circuito Profesional WPT / Premier Padel (Alternado chico / chica para realismo multimodal)
        'Alejandro Galán', 'Paula Josemaría',
        'Arturo Coello', 'Ariana Sánchez',
        'Juan Lebrón', 'Gemma Triay',
        'Agustín Tapia', 'Delfina Brea',
        'Federico Chingotto', 'Alejandra Salazar',
        'Franco Stupaczuk', 'Beatriz González',
        'Martín Di Nenno', 'Marta Ortega',
        'Paquito Navarro', 'Claudia Jensen',
        'Fernando Belasteguín', 'Jessica Castelló',
        'Sanyo Gutiérrez', 'Sofía Araújo',
        'Gonzalo Alfonso', 'Virginia Riera',
        'Leo Augsburger', 'Aranza Osoro',
        'Tino Libaak', 'Victoria Iglesias',
        'Álex Chozas', 'Lucía Sainz',
        'Miguel Yanguas', 'Tamara Icardo',
        'Javier Garrido', 'Andrea Ustero',
        'Coki Nieto', 'Alejandra Alonso',
        'Jon Sanz', 'Marta Talaván',
        'Álex Ruiz', 'Patty Llaguno',
        'Momo González', 'Carolina Orsi',
        // Estrellas de reserva y banquillo (40..56)
        'Lucas Bergamini', 'Alix Collombon',
        'Víctor Ruiz', 'Nuria Rodríguez',
        'Pablo Cardona', 'Carmen Goenaga',
        'Jairo Bautista', 'Marina Guinart',
        'Edu Alonso', 'Vero Virseda',
        'Tolito Aguirre', 'Ksenia Sharifova',
        'Juan Tello', 'Lorena Rufo',
        'Ramiro Moyano', 'Marta Caparrós'
    ];

    /**
     * Pool representativo de socios y jugadoras/es reales del club SomosPadel
     * Garantiza un pool de 40+ jugadores reales para simulaciones multimodales de 3 a 10 pistas.
     */
    const SOMOSPADEL_MEMBERS = [
        { id: 'sp_carlos_martinez', name: 'Carlos Martínez', level: 4.25, gender: 'chico' },
        { id: 'sp_laura_gomez', name: 'Laura Gómez', level: 3.75, gender: 'chica' },
        { id: 'sp_marc_vidal', name: 'Marc Vidal', level: 4.5, gender: 'chico' },
        { id: 'sp_mireia_puig', name: 'Mireia Puig', level: 3.5, gender: 'chica' },
        { id: 'sp_jordi_soler', name: 'Jordi Soler', level: 4.0, gender: 'chico' },
        { id: 'sp_sonia_navarro', name: 'Sonia Navarro', level: 3.25, gender: 'chica' },
        { id: 'sp_pau_rovira', name: 'Pau Rovira', level: 3.75, gender: 'chico' },
        { id: 'sp_marta_casals', name: 'Marta Casals', level: 3.5, gender: 'chica' },
        { id: 'sp_sergi_font', name: 'Sergi Font', level: 4.75, gender: 'chico' },
        { id: 'sp_cristina_bosch', name: 'Cristina Bosch', level: 3.75, gender: 'chica' },
        { id: 'sp_david_vila', name: 'David Vila', level: 3.5, gender: 'chico' },
        { id: 'sp_andrea_serra', name: 'Andrea Serra', level: 4.0, gender: 'chica' },
        { id: 'sp_albert_ferrer', name: 'Albert Ferrer', level: 4.25, gender: 'chico' },
        { id: 'sp_nuria_rius', name: 'Núria Rius', level: 3.0, gender: 'chica' },
        { id: 'sp_pol_mas', name: 'Pol Mas', level: 3.75, gender: 'chico' },
        { id: 'sp_gemma_roig', name: 'Gemma Roig', level: 3.5, gender: 'chica' },
        { id: 'sp_xavier_prat', name: 'Xavier Prat', level: 4.5, gender: 'chico' },
        { id: 'sp_carla_domenech', name: 'Carla Domènech', level: 3.25, gender: 'chica' },
        { id: 'sp_oriol_clotet', name: 'Oriol Clotet', level: 3.5, gender: 'chico' },
        { id: 'sp_helena_morales', name: 'Helena Morales', level: 3.75, gender: 'chica' },
        { id: 'sp_roger_canals', name: 'Roger Canals', level: 4.0, gender: 'chico' },
        { id: 'sp_silvia_valls', name: 'Silvia Valls', level: 3.5, gender: 'chica' },
        { id: 'sp_gerard_pons', name: 'Gerard Pons', level: 4.25, gender: 'chico' },
        { id: 'sp_raquel_torres', name: 'Raquel Torres', level: 3.25, gender: 'chica' },
        { id: 'sp_ignasi_costa', name: 'Ignasi Costa', level: 3.75, gender: 'chico' },
        { id: 'sp_berta_duran', name: 'Berta Duran', level: 4.0, gender: 'chica' },
        { id: 'sp_joan_miralles', name: 'Joan Miralles', level: 4.75, gender: 'chico' },
        { id: 'sp_elisabet_sabate', name: 'Elisabet Sabaté', level: 3.5, gender: 'chica' },
        { id: 'sp_guillem_marti', name: 'Guillem Martí', level: 3.5, gender: 'chico' },
        { id: 'sp_laia_pascual', name: 'Laia Pascual', level: 3.75, gender: 'chica' },
        { id: 'sp_daniel_ribas', name: 'Daniel Ribas', level: 4.0, gender: 'chico' },
        { id: 'sp_clara_oliver', name: 'Clara Oliver', level: 3.25, gender: 'chica' },
        { id: 'sp_victor_dalmau', name: 'Víctor Dalmau', level: 4.25, gender: 'chico' },
        { id: 'sp_anna_blanch', name: 'Anna Blanch', level: 3.5, gender: 'chica' },
        { id: 'sp_ferran_camps', name: 'Ferran Camps', level: 3.75, gender: 'chico' },
        { id: 'sp_irene_alarcon', name: 'Irene Alarcón', level: 3.0, gender: 'chica' },
        { id: 'sp_marc_castells', name: 'Marc Castells', level: 4.0, gender: 'chico' },
        { id: 'sp_marina_freixa', name: 'Marina Freixa', level: 3.75, gender: 'chica' },
        { id: 'sp_adria_salgado', name: 'Adrià Salgado', level: 3.5, gender: 'chico' },
        { id: 'sp_sara_melgar', name: 'Sara Melgar', level: 3.25, gender: 'chica' },
        { id: 'sp_bernat_sole', name: 'Bernat Solé', level: 4.25, gender: 'chico' },
        { id: 'sp_paula_cardus', name: 'Paula Cardús', level: 3.5, gender: 'chica' },
        { id: 'sp_ricard_baque', name: 'Ricard Baqué', level: 3.75, gender: 'chico' },
        { id: 'sp_judith_beltran', name: 'Judith Beltrán', level: 3.25, gender: 'chica' },
        { id: 'sp_ernest_verges', name: 'Ernest Vergés', level: 4.0, gender: 'chico' },
        { id: 'sp_claudia_romeu', name: 'Clàudia Romeu', level: 3.75, gender: 'chica' },
        { id: 'sp_manel_guitart', name: 'Manel Guitart', level: 3.5, gender: 'chico' },
        { id: 'sp_alba_marin', name: 'Alba Marín', level: 3.25, gender: 'chica' }
    ];

    /**
     * Resuelve el ámbito global de manera agnóstica y segura entre navegadores, web workers y Node.js.
     * Garantiza que nunca lance excepciones y siempre retorne un objeto accesible.
     */
    function getGlobalScope() {
        try {
            if (typeof window !== 'undefined' && window) return window;
            if (typeof globalThis !== 'undefined' && globalThis) return globalThis;
            if (typeof self !== 'undefined' && self) return self;
            if (typeof global !== 'undefined' && global) return global;
        } catch (_) {
            // Protección defensiva para contextos sandbox / iframes con restricciones cross-origin
        }
        return (typeof this !== 'undefined' && this) ? this : {};
    }

    /**
     * Helper inmutable que retorna el pool completo de socios reales de SomosPadel
     * normalizado con id, nombre, nivel, género y avatar.
     */
    function getSomosPadelFallbackPool(minCount = 48) {
        const target = Math.max(SOMOSPADEL_MEMBERS.length, parseInt(minCount, 10) || 48);
        const pool = SOMOSPADEL_MEMBERS.map(m => ({
            id: m.id,
            name: m.name,
            level: Number(parseFloat(m.level || 3.5).toFixed(2)),
            gender: m.gender || 'chico',
            avatar: m.avatar || null
        }));

        let extraIdx = 1;
        while (pool.length < target) {
            const template = SOMOSPADEL_MEMBERS[pool.length % SOMOSPADEL_MEMBERS.length];
            pool.push({
                id: `sp_socio_ext_${extraIdx}`,
                name: `${template.name} (Reserva ${extraIdx})`,
                level: template.level,
                gender: template.gender,
                avatar: null
            });
            extraIdx++;
        }

        return pool;
    }

    /**
     * Envuelve una promesa o factoría de promesa en un Promise.race contra un temporizador estricto en ms.
     * Si la promesa tarda más de timeoutMs o la conexión queda colgada/falla, resuelve inmediatamente con el fallback.
     * Limpia el temporizador para evitar retención de recursos o timers huérfanos.
     */
    function raceWithTimeout(promiseFactoryOrPromise, timeoutMs, fallbackSupplier, label = 'Operación') {
        let timerId = null;

        const timeoutPromise = new Promise((resolve) => {
            timerId = setTimeout(() => {
                console.warn(`${LOG_PREFIX} [Timeout] ${label} superó el límite de ${timeoutMs}ms. Resolviendo inmediatamente con fallback seguro.`);
                try {
                    const fallbackVal = typeof fallbackSupplier === 'function' ? fallbackSupplier() : fallbackSupplier;
                    resolve(fallbackVal);
                } catch (e) {
                    resolve(null);
                }
            }, timeoutMs);
        });

        const executionPromise = (async () => {
            try {
                const targetPromise = (typeof promiseFactoryOrPromise === 'function')
                    ? promiseFactoryOrPromise()
                    : promiseFactoryOrPromise;
                return await targetPromise;
            } catch (err) {
                console.warn(`${LOG_PREFIX} [Error] ${label} falló:`, (err && err.message) ? err.message : err);
                return typeof fallbackSupplier === 'function' ? fallbackSupplier() : fallbackSupplier;
            }
        })();

        return Promise.race([executionPromise, timeoutPromise]).finally(() => {
            if (timerId !== null) {
                clearTimeout(timerId);
                timerId = null;
            }
        });
    }

    const REALISTIC_SCORES = [
        [6, 4], [4, 6],
        [6, 3], [3, 6],
        [7, 5], [5, 7],
        [6, 2], [2, 6],
        [7, 6], [6, 7],
        [6, 1], [1, 6]
    ];

    /**
     * Helper de medición de tiempo en ms de alta precisión.
     */
    function nowMs() {
        if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
            return performance.now();
        }
        return Date.now();
    }

    /**
     * Generador de jugadores virtuales para simulación (modo 'real' socios club o 'pro' WPT)
     */
    function generateVirtualPlayers(count, numCourts, playersSource = 'real') {
        const players = [];
        const isPro = playersSource === 'pro';
        const namePool = isPro ? PAD_NAMES : SOMOSPADEL_MEMBERS.map(m => m.name);

        for (let i = 0; i < count; i++) {
            const memberObj = !isPro ? SOMOSPADEL_MEMBERS[i % SOMOSPADEL_MEMBERS.length] : null;
            const baseName = memberObj ? memberObj.name : namePool[i % namePool.length];
            const suffix = i >= namePool.length ? ` #${Math.floor(i / namePool.length) + 1}` : '';
            const initialCourt = Math.min(Math.floor(i / 4) + 1, numCourts);
            const level = memberObj ? memberObj.level : Number((2.5 + ((i % 11) * 0.25)).toFixed(2));
            const gender = memberObj ? memberObj.gender : ((i % 2 === 0) ? 'chico' : 'chica');
            const pId = memberObj
                ? (i >= SOMOSPADEL_MEMBERS.length ? `${memberObj.id}_${i + 1}` : memberObj.id)
                : `player_v_${i + 1}`;

            players.push({
                id: pId,
                name: `${baseName}${suffix}`,
                level: level,
                gender: gender,
                avatar: (memberObj && memberObj.avatar) || null,
                initial_court: initialCourt,
                current_court: initialCourt,
                partner_history: [],
                last_partner: null,
                matches_played: 0,
                matches_won: 0,
                matches_lost: 0,
                games_won: 0,
                games_lost: 0,
                games_diff: 0,
                points: 0
            });
        }
        return players;
    }

    /**
     * Genera parejas fijas virtuales a partir de los jugadores
     */
    function generateVirtualFixedPairs(players, numCourts) {
        const pairs = [];
        for (let i = 0; i < players.length; i += 2) {
            if (i + 1 < players.length) {
                const p1 = players[i];
                const p2 = players[i + 1];
                const pairIndex = Math.floor(i / 2);
                const initialCourt = Math.min(Math.floor(pairIndex / 2) + 1, numCourts);

                pairs.push({
                    id: `pair_v_${pairIndex + 1}`,
                    name: `${p1.name} & ${p2.name}`,
                    player1_id: p1.id,
                    player2_id: p2.id,
                    player1_name: p1.name,
                    player2_name: p2.name,
                    initial_court: initialCourt,
                    current_court: initialCourt,
                    level: Number(((p1.level + p2.level) / 2).toFixed(2)),
                    matches_played: 0,
                    matches_won: 0,
                    matches_lost: 0,
                    games_won: 0,
                    games_lost: 0,
                    games_diff: 0,
                    points: 0
                });
            }
        }
        return pairs;
    }

    /**
     * Selecciona una combinación de 2 parejas para 4 jugadores en una pista,
     * minimizando la repetición de compañero en base al historial previo.
     */
    function pickBestTwisterPairing(courtPlayers, roundNum) {
        if (courtPlayers.length < 4) {
            return {
                teamA: courtPlayers.slice(0, 2),
                teamB: courtPlayers.slice(2, 4)
            };
        }

        const [p0, p1, p2, p3] = courtPlayers;
        const options = [
            { teamA: [p0, p3], teamB: [p1, p2] }, // Equilibrado competitivo
            { teamA: [p0, p2], teamB: [p1, p3] },
            { teamA: [p0, p1], teamB: [p2, p3] }
        ];

        if (roundNum === 1) {
            return options[0];
        }

        function getPairPenalty(playerA, playerB) {
            const hA = playerA.partner_history || [];
            const bId = playerB.id;

            // Inmediato anterior: prohibición máxima
            if (playerA.last_partner === bId) {
                return 100000;
            }
            // Repetición en rondas anteriores: penalización masiva para evitarla si hay alternativa
            const occurrences = hA.filter(id => id === bId).length;
            if (occurrences > 0) {
                return 10000 * occurrences;
            }

            // Si nunca han jugado juntos, penalización 0
            return 0;
        }

        let bestOption = options[0];
        let lowestPenalty = Infinity;

        for (const opt of options) {
            const penA = getPairPenalty(opt.teamA[0], opt.teamA[1]);
            const penB = getPairPenalty(opt.teamB[0], opt.teamB[1]);
            const levelDiff = Math.abs(
                (opt.teamA[0].level + opt.teamA[1].level) -
                (opt.teamB[0].level + opt.teamB[1].level)
            );
            // El nivel solo desempata si ambas opciones son igualmente limpias de repetición
            const totalPenalty = penA + penB + (levelDiff * 2);

            if (totalPenalty < lowestPenalty) {
                lowestPenalty = totalPenalty;
                bestOption = opt;
            }
        }

        return bestOption;
    }

    /**
     * Generador de marcador realista según niveles relativos con ligera aleatoriedad
     */
    function generateMatchScore(ratingA, ratingB) {
        const diff = ratingA - ratingB;
        const probAWins = 1 / (1 + Math.pow(10, -diff / 1.5));
        const aWins = Math.random() < probAWins;

        // Marcadores donde gana el primero
        const winningScores = [
            [6, 4], [6, 3], [7, 5], [6, 2], [7, 6], [6, 1]
        ];

        let selected = winningScores[Math.floor(Math.random() * winningScores.length)];
        if (!aWins) {
            // Invierte para que gane B
            selected = [selected[1], selected[0]];
        }
        return { scoreA: selected[0], scoreB: selected[1] };
    }

    class TournamentLogicAuditService {

        /**
         * 1. SIMULADOR DE TORNEO MULTIMODAL
         * Ejecuta la simulación completa de rondas para 'twister', 'fixed' o 'swiss'.
         *
         * @param {Object} options
         * @param {string} options.mode - 'twister' | 'fixed' | 'swiss' (default: 'twister')
         * @param {number} options.numCourts - Número de pistas (default: 4)
         * @param {number} options.rounds - Número de rondas a simular (default: 6)
         * @param {number} options.numPlayers - Jugadores requeridos (default: numCourts * 4)
         * @param {string} options.eventType - 'americana' | 'entreno' (default: 'americana')
         * @param {string} options.playersSource - 'real' | 'pro' (default: 'real' o 'pro')
         * @param {string} options.eventName - Nombre descriptivo del evento simulado
         * @param {Array} options.players - Array opcional de jugadores ya provistos
         * @param {Array} options.customPlayers - Alias de options.players
         * @param {boolean} options.silent - Si es true, silencia la salida por consola
         * @returns {Object} { mode, eventType, eventName, playersSource, numCourts, rounds, players, pairs, allMatches, roundsDetail, standings, executionTimeMs }
         */
        static simulateTournament(options = {}) {
            const tStart = nowMs();
            const mode = (options.mode || 'twister').toLowerCase();
            const eventType = (options.eventType || 'americana').toLowerCase();
            const numCourts = Math.max(1, parseInt(options.numCourts, 10) || 4);
            const totalRounds = Math.max(1, parseInt(options.rounds, 10) || 6);
            const requiredPlayers = numCourts * 4;
            const numPlayers = options.numPlayers ? parseInt(options.numPlayers, 10) : requiredPlayers;

            const providedList = options.players || options.customPlayers;
            let playersSource = options.playersSource;
            if (!playersSource) {
                playersSource = (Array.isArray(providedList) && providedList.length > 0) ? 'real' : 'real';
            }
            playersSource = String(playersSource).toLowerCase();
            if (playersSource !== 'pro' && playersSource !== 'real') {
                playersSource = 'real';
            }

            const defaultEventName = eventType === 'entreno'
                ? `Entreno SomosPadel (${numCourts} pistas - ${mode.toUpperCase()})`
                : `Americana SomosPadel (${numCourts} pistas - ${mode.toUpperCase()})`;
            const eventName = options.eventName || defaultEventName;

            if (!options.silent) {
                console.log(`${LOG_PREFIX} Iniciando simulación: Evento='${eventType}', Origen='${playersSource}', Modo='${mode}', Pistas=${numCourts}, Rondas=${totalRounds}, Jugadores=${requiredPlayers}`);
            }

            let players = [];
            if (Array.isArray(providedList) && providedList.length > 0) {
                const seenIds = new Set();
                const seenNames = new Set();

                providedList.forEach((p, idx) => {
                    if (!p) return;
                    const id = String(p.id || p.uid || `player_p_${idx + 1}`);
                    const name = String(p.name || p.displayName || p.userName || `Jugador ${idx + 1}`).trim();
                    const normName = name.toLowerCase();

                    if (seenIds.has(id)) return;
                    seenIds.add(id);
                    seenNames.add(normName);

                    const initialCourt = (p.initial_court && p.initial_court >= 1 && p.initial_court <= numCourts)
                        ? parseInt(p.initial_court, 10)
                        : Math.min(Math.floor(players.length / 4) + 1, numCourts);

                    let level = parseFloat(p.level || p.playtomic_level || p.self_rate_level || 3.5);
                    if (isNaN(level) || level <= 0) level = 3.5;

                    let gender = (p.gender || p.sex || '').toLowerCase();
                    if (gender === 'f' || gender === 'female' || gender === 'mujer' || gender === 'chica') {
                        gender = 'chica';
                    } else if (gender === 'm' || gender === 'male' || gender === 'hombre' || gender === 'chico') {
                        gender = 'chico';
                    } else {
                        gender = (players.length % 2 === 0) ? 'chico' : 'chica';
                    }

                    players.push({
                        id: id,
                        name: name,
                        level: Number(level.toFixed(2)),
                        gender: gender,
                        avatar: p.avatar || p.photoURL || p.photo_url || null,
                        initial_court: initialCourt,
                        current_court: initialCourt,
                        partner_history: [],
                        last_partner: null,
                        matches_played: 0,
                        matches_won: 0,
                        matches_lost: 0,
                        games_won: 0,
                        games_lost: 0,
                        games_diff: 0,
                        points: 0
                    });
                });

                // Si faltan para cubrir numCourts * 4, complementar automáticamente
                if (players.length < requiredPlayers) {
                    const compVirtual = generateVirtualPlayers(requiredPlayers + 20, numCourts, playersSource);
                    for (const vp of compVirtual) {
                        if (players.length >= requiredPlayers) break;
                        const normName = vp.name.toLowerCase();
                        if (!seenIds.has(vp.id) && !seenNames.has(normName)) {
                            seenIds.add(vp.id);
                            seenNames.add(normName);
                            const court = Math.min(Math.floor(players.length / 4) + 1, numCourts);
                            vp.initial_court = court;
                            vp.current_court = court;
                            players.push(vp);
                        }
                    }
                } else if (players.length > requiredPlayers) {
                    players = players.slice(0, requiredPlayers);
                    players.forEach((p, idx) => {
                        const court = Math.min(Math.floor(idx / 4) + 1, numCourts);
                        p.initial_court = court;
                        p.current_court = court;
                    });
                }
            } else {
                players = generateVirtualPlayers(numPlayers, numCourts, playersSource);
            }

            let pairs = (mode === 'fixed') ? generateVirtualFixedPairs(players, numCourts) : [];

            const allMatches = [];
            const roundsDetail = [];

            // Simulación ronda a ronda
            for (let round = 1; round <= totalRounds; round++) {
                const roundMatches = [];

                if (mode === 'fixed') {
                    // --- MODO PAREJAS FIJAS ---
                    for (let c = 1; c <= numCourts; c++) {
                        const courtPairs = pairs.filter(p => p.current_court === c);
                        if (courtPairs.length < 2) {
                            console.warn(`${LOG_PREFIX} [Fixed] Pista ${c} cuenta con menos de 2 parejas (${courtPairs.length}).`);
                            continue;
                        }

                        const pairA = courtPairs[0];
                        const pairB = courtPairs[1];
                        const { scoreA, scoreB } = generateMatchScore(pairA.level, pairB.level);

                        const isWinA = scoreA > scoreB;
                        const match = {
                            id: `sim_m_r${round}_c${c}`,
                            round: round,
                            court: c,
                            mode: 'fixed',
                            pair_a_id: pairA.id,
                            pair_b_id: pairB.id,
                            team_a_ids: [pairA.player1_id, pairA.player2_id],
                            team_b_ids: [pairB.player1_id, pairB.player2_id],
                            team_a_names: [pairA.player1_name, pairA.player2_name],
                            team_b_names: [pairB.player1_name, pairB.player2_name],
                            score_a: scoreA,
                            score_b: scoreB,
                            status: 'finished',
                            winner_ids: isWinA ? [pairA.player1_id, pairA.player2_id] : [pairB.player1_id, pairB.player2_id],
                            loser_ids: isWinA ? [pairB.player1_id, pairB.player2_id] : [pairA.player1_id, pairA.player2_id],
                            winner_pair_id: isWinA ? pairA.id : pairB.id,
                            loser_pair_id: isWinA ? pairB.id : pairA.id
                        };

                        // Actualizar stats de parejas
                        pairA.matches_played++;
                        pairB.matches_played++;
                        pairA.games_won += scoreA;
                        pairA.games_lost += scoreB;
                        pairB.games_won += scoreB;
                        pairB.games_lost += scoreA;

                        if (isWinA) {
                            pairA.matches_won++;
                            pairA.points += 3;
                            pairB.matches_lost++;
                        } else {
                            pairB.matches_won++;
                            pairB.points += 3;
                            pairA.matches_lost++;
                        }

                        // Actualizar stats de jugadores individuales
                        [players.find(p => p.id === pairA.player1_id), players.find(p => p.id === pairA.player2_id)].forEach(p => {
                            if (p) {
                                p.matches_played++;
                                p.games_won += scoreA;
                                p.games_lost += scoreB;
                                if (isWinA) { p.matches_won++; p.points += 3; } else { p.matches_lost++; }
                            }
                        });
                        [players.find(p => p.id === pairB.player1_id), players.find(p => p.id === pairB.player2_id)].forEach(p => {
                            if (p) {
                                p.matches_played++;
                                p.games_won += scoreB;
                                p.games_lost += scoreA;
                                if (!isWinA) { p.matches_won++; p.points += 3; } else { p.matches_lost++; }
                            }
                        });

                        roundMatches.push(match);
                        allMatches.push(match);
                    }

                    // Dinámica de Pozo para Parejas Fijas entre rondas
                    if (round < totalRounds) {
                        const newCourtAssignments = [];
                        for (let c = 1; c <= numCourts; c++) {
                            const courtMatches = roundMatches.filter(m => m.court === c);
                            if (courtMatches.length > 0) {
                                const m = courtMatches[0];
                                const winPair = pairs.find(p => p.id === m.winner_pair_id);
                                const losePair = pairs.find(p => p.id === m.loser_pair_id);

                                if (winPair) {
                                    const nextCourtWin = Math.max(1, c - 1);
                                    newCourtAssignments.push({ pair: winPair, nextCourt: nextCourtWin });
                                }
                                if (losePair) {
                                    const nextCourtLose = Math.min(numCourts, c + 1);
                                    newCourtAssignments.push({ pair: losePair, nextCourt: nextCourtLose });
                                }
                            }
                        }
                        newCourtAssignments.forEach(({ pair, nextCourt }) => {
                            pair.current_court = nextCourt;
                        });
                    }

                } else if (mode === 'swiss') {
                    // --- MODO SUIZO (Individual) ---
                    for (let c = 1; c <= numCourts; c++) {
                        const courtPlayers = players.filter(p => p.current_court === c);
                        const { teamA, teamB } = pickBestTwisterPairing(courtPlayers, round);

                        const ratingA = (teamA[0].level + teamA[1].level) / 2;
                        const ratingB = (teamB[0].level + teamB[1].level) / 2;
                        const { scoreA, scoreB } = generateMatchScore(ratingA, ratingB);
                        const isWinA = scoreA > scoreB;

                        const match = {
                            id: `sim_m_r${round}_c${c}`,
                            round: round,
                            court: c,
                            mode: 'swiss',
                            team_a_ids: [teamA[0].id, teamA[1].id],
                            team_b_ids: [teamB[0].id, teamB[1].id],
                            team_a_names: [teamA[0].name, teamA[1].name],
                            team_b_names: [teamB[0].name, teamB[1].name],
                            score_a: scoreA,
                            score_b: scoreB,
                            status: 'finished',
                            winner_ids: isWinA ? [teamA[0].id, teamA[1].id] : [teamB[0].id, teamB[1].id],
                            loser_ids: isWinA ? [teamB[0].id, teamB[1].id] : [teamA[0].id, teamA[1].id]
                        };

                        // Historial de compañeros
                        teamA[0].last_partner = teamA[1].id;
                        teamA[0].partner_history.unshift(teamA[1].id);
                        teamA[1].last_partner = teamA[0].id;
                        teamA[1].partner_history.unshift(teamA[0].id);
                        teamB[0].last_partner = teamB[1].id;
                        teamB[0].partner_history.unshift(teamB[1].id);
                        teamB[1].last_partner = teamB[0].id;
                        teamB[1].partner_history.unshift(teamB[0].id);

                        // Stats acumuladas
                        [teamA[0], teamA[1]].forEach(p => {
                            p.matches_played++;
                            p.games_won += scoreA;
                            p.games_lost += scoreB;
                            if (isWinA) { p.matches_won++; p.points += 3; } else { p.matches_lost++; }
                        });
                        [teamB[0], teamB[1]].forEach(p => {
                            p.matches_played++;
                            p.games_won += scoreB;
                            p.games_lost += scoreA;
                            if (!isWinA) { p.matches_won++; p.points += 3; } else { p.matches_lost++; }
                        });

                        roundMatches.push(match);
                        allMatches.push(match);
                    }

                    // Reclasificación Suiza para la siguiente ronda
                    if (round < totalRounds) {
                        const sortedBySwiss = [...players].sort((a, b) => {
                            if (b.matches_won !== a.matches_won) return b.matches_won - a.matches_won;
                            const diffA = a.games_won - a.games_lost;
                            const diffB = b.games_won - b.games_lost;
                            if (diffB !== diffA) return diffB - diffA;
                            if (b.games_won !== a.games_won) return b.games_won - a.games_won;
                            return b.level - a.level;
                        });

                        sortedBySwiss.forEach((p, idx) => {
                            p.current_court = Math.min(Math.floor(idx / 4) + 1, numCourts);
                        });
                    }

                } else {
                    // --- MODO TWISTER INDIVIDUAL (Pozo Rotativo) ---
                    for (let c = 1; c <= numCourts; c++) {
                        const courtPlayers = players.filter(p => p.current_court === c);
                        if (courtPlayers.length < 4) {
                            console.warn(`${LOG_PREFIX} [Twister] Pista ${c} con menos de 4 jugadores (${courtPlayers.length})`);
                        }

                        const { teamA, teamB } = pickBestTwisterPairing(courtPlayers, round);

                        const ratingA = (teamA[0].level + teamA[1].level) / 2;
                        const ratingB = (teamB[0].level + teamB[1].level) / 2;
                        const { scoreA, scoreB } = generateMatchScore(ratingA, ratingB);
                        const isWinA = scoreA > scoreB;

                        const match = {
                            id: `sim_m_r${round}_c${c}`,
                            round: round,
                            court: c,
                            mode: 'twister',
                            team_a_ids: [teamA[0].id, teamA[1].id],
                            team_b_ids: [teamB[0].id, teamB[1].id],
                            team_a_names: [teamA[0].name, teamA[1].name],
                            team_b_names: [teamB[0].name, teamB[1].name],
                            score_a: scoreA,
                            score_b: scoreB,
                            status: 'finished',
                            winner_ids: isWinA ? [teamA[0].id, teamA[1].id] : [teamB[0].id, teamB[1].id],
                            loser_ids: isWinA ? [teamB[0].id, teamB[1].id] : [teamA[0].id, teamA[1].id]
                        };

                        // Historial de parejas
                        teamA[0].last_partner = teamA[1].id;
                        teamA[0].partner_history.unshift(teamA[1].id);
                        teamA[1].last_partner = teamA[0].id;
                        teamA[1].partner_history.unshift(teamA[0].id);
                        teamB[0].last_partner = teamB[1].id;
                        teamB[0].partner_history.unshift(teamB[1].id);
                        teamB[1].last_partner = teamB[0].id;
                        teamB[1].partner_history.unshift(teamB[0].id);

                        // Stats acumuladas
                        [teamA[0], teamA[1]].forEach(p => {
                            p.matches_played++;
                            p.games_won += scoreA;
                            p.games_lost += scoreB;
                            if (isWinA) { p.matches_won++; p.points += 3; } else { p.matches_lost++; }
                        });
                        [teamB[0], teamB[1]].forEach(p => {
                            p.matches_played++;
                            p.games_won += scoreB;
                            p.games_lost += scoreA;
                            if (!isWinA) { p.matches_won++; p.points += 3; } else { p.matches_lost++; }
                        });

                        roundMatches.push(match);
                        allMatches.push(match);
                    }

                    // Dinámica de Pozo Twister entre rondas
                    if (round < totalRounds) {
                        const movements = [];
                        for (let c = 1; c <= numCourts; c++) {
                            const courtMatches = roundMatches.filter(m => m.court === c);
                            if (courtMatches.length > 0) {
                                const m = courtMatches[0];
                                const winIds = m.winner_ids;
                                const loseIds = m.loser_ids;

                                const nextCourtWin = Math.max(1, c - 1);
                                const nextCourtLose = Math.min(numCourts, c + 1);

                                winIds.forEach(id => {
                                    const p = players.find(x => x.id === id);
                                    if (p) movements.push({ player: p, nextCourt: nextCourtWin });
                                });
                                loseIds.forEach(id => {
                                    const p = players.find(x => x.id === id);
                                    if (p) movements.push({ player: p, nextCourt: nextCourtLose });
                                });
                            }
                        }
                        movements.forEach(({ player, nextCourt }) => {
                            player.current_court = nextCourt;
                        });
                    }
                }

                roundsDetail.push({
                    round: round,
                    matches: roundMatches
                });
            }

            // Calcular clasificación (Standings) final
            players.forEach(p => {
                p.games_diff = p.games_won - p.games_lost;
            });
            if (pairs && pairs.length > 0) {
                pairs.forEach(pr => {
                    pr.games_diff = pr.games_won - pr.games_lost;
                });
            }

            const standingsSource = (mode === 'fixed') ? pairs : players;
            const standings = [...standingsSource].sort((a, b) => {
                if (b.games_won !== a.games_won) return b.games_won - a.games_won;
                if (b.games_diff !== a.games_diff) return b.games_diff - a.games_diff;
                if (b.matches_won !== a.matches_won) return b.matches_won - a.matches_won;
                return b.level - a.level;
            }).map((item, index) => ({
                position: index + 1,
                id: item.id,
                name: item.name || item.pair_name,
                matches_played: item.matches_played,
                matches_won: item.matches_won,
                matches_lost: item.matches_lost,
                games_won: item.games_won,
                games_lost: item.games_lost,
                games_diff: item.games_diff,
                points: item.points,
                current_court: item.current_court
            }));

            const executionTimeMs = parseFloat((nowMs() - tStart).toFixed(2));
            if (!options.silent) {
                console.log(`${LOG_PREFIX} Simulación concluida en ${executionTimeMs} ms (${allMatches.length} partidos generados).`);
            }

            return {
                mode: mode,
                eventType: eventType,
                eventName: eventName,
                playersSource: playersSource,
                numCourts: numCourts,
                rounds: totalRounds,
                players: players,
                pairs: pairs,
                allMatches: allMatches,
                roundsDetail: roundsDetail,
                standings: standings,
                executionTimeMs: executionTimeMs
            };
        }

        /**
         * Pool estático de socios reales de SomosPadel
         */
        static get SOMOSPADEL_MEMBERS() {
            return SOMOSPADEL_MEMBERS;
        }

        /**
         * Pool estático de jugadores profesionales
         */
        static get PRO_PLAYERS() {
            return PAD_NAMES;
        }

        /**
         * 1.1 OBTENCIÓN Y NORMALIZACIÓN DE JUGADORES REALES DEL CLUB
         * Intenta consultar jugadores reales de la base de datos Firestore / FirebaseDB.
        /**
         * 1.1 OBTENCIÓN Y NORMALIZACIÓN DE JUGADORES REALES DEL CLUB
         * Intenta consultar jugadores reales de la base de datos Firestore / FirebaseDB
         * blindado con un timeout estricto de máximo 1200ms usando Promise.race contra un temporizador.
         * Si db.collection('players').get() o FirebaseDB.players.getAll() tardan más de 1200ms
         * o la promesa queda colgada en el navegador, resuelve INMEDIATAMENTE con el pool de 48 socios reales
         * de SomosPadel (SOMOSPADEL_MEMBERS).
         *
         * @param {number} minCount - Cantidad mínima de jugadores requeridos (default: 40)
         * @returns {Promise<Array<Object>>} Lista de jugadores normalizados { id, name, level, gender, avatar, ... }
         */
        static async fetchRealPlayers(minCount = 40) {
            const targetCount = Math.max(1, parseInt(minCount, 10) || 40);
            const fallbackPool = getSomosPadelFallbackPool(Math.max(48, targetCount));

            const fetchQueryPromise = async () => {
                const scope = getGlobalScope();
                let rawList = [];

                // a) Intento de consulta en global.db.collection('players').get()
                const dbInstance = scope.db || (typeof db !== 'undefined' ? db : null);
                if (dbInstance && typeof dbInstance.collection === 'function') {
                    try {
                        const snap = await dbInstance.collection('players').get();
                        if (snap && snap.docs && Array.isArray(snap.docs)) {
                            rawList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        } else if (Array.isArray(snap)) {
                            rawList = snap;
                        }
                    } catch (err) {
                        console.warn(`${LOG_PREFIX} [fetchRealPlayers] db.collection('players').get() aviso:`, err.message);
                    }
                }

                // b) Intento de consulta en global.FirebaseDB.players.getAll()
                const firebaseDB = scope.FirebaseDB || (typeof FirebaseDB !== 'undefined' ? FirebaseDB : null);
                if (rawList.length === 0 && firebaseDB && firebaseDB.players && typeof firebaseDB.players.getAll === 'function') {
                    try {
                        const res = await firebaseDB.players.getAll();
                        if (Array.isArray(res) && res.length > 0) {
                            rawList = res;
                        }
                    } catch (err) {
                        console.warn(`${LOG_PREFIX} [fetchRealPlayers] FirebaseDB.players.getAll() aviso:`, err.message);
                    }
                }

                if (!Array.isArray(rawList) || rawList.length === 0) {
                    return fallbackPool;
                }

                // Normalización defensiva de jugadores reales
                const realPlayers = [];
                const seenIds = new Set();
                const seenNames = new Set();

                rawList.forEach((raw, idx) => {
                    if (!raw) return;
                    const id = String(raw.id || raw.uid || `player_real_${idx + 1}`);
                    const name = String(raw.name || raw.displayName || raw.alias || `Socio SomosPadel #${idx + 1}`).trim();
                    const normName = name.toLowerCase();

                    if (seenIds.has(id) || seenNames.has(normName)) {
                        return;
                    }
                    seenIds.add(id);
                    seenNames.add(normName);

                    let level = parseFloat(raw.level || raw.playtomic_level || raw.self_rate_level || 3.5);
                    if (isNaN(level) || level <= 0) level = 3.5;

                    let gender = (raw.gender || raw.sex || '').toLowerCase();
                    if (gender === 'f' || gender === 'female' || gender === 'mujer' || gender === 'chica') {
                        gender = 'chica';
                    } else if (gender === 'm' || gender === 'male' || gender === 'hombre' || gender === 'chico') {
                        gender = 'chico';
                    } else {
                        gender = (idx % 2 === 0) ? 'chico' : 'chica';
                    }

                    const avatar = raw.avatar || raw.photoURL || raw.photo_url || raw.picture || null;

                    realPlayers.push({
                        id: id,
                        name: name,
                        level: Number(level.toFixed(2)),
                        gender: gender,
                        avatar: avatar
                    });
                });

                // Complementar con el pool de socios de SomosPadel si faltan hasta targetCount
                if (realPlayers.length < targetCount) {
                    for (let i = 0; i < SOMOSPADEL_MEMBERS.length && realPlayers.length < targetCount; i++) {
                        const member = SOMOSPADEL_MEMBERS[i];
                        const normName = member.name.toLowerCase();
                        if (!seenIds.has(member.id) && !seenNames.has(normName)) {
                            seenIds.add(member.id);
                            seenNames.add(normName);
                            realPlayers.push({
                                id: member.id,
                                name: member.name,
                                level: member.level,
                                gender: member.gender,
                                avatar: member.avatar || null
                            });
                        }
                    }

                    // Si aún se solicitan más jugadores que el pool base
                    let extraIdx = 1;
                    while (realPlayers.length < targetCount) {
                        const template = SOMOSPADEL_MEMBERS[(realPlayers.length) % SOMOSPADEL_MEMBERS.length];
                        const extraId = `sp_socio_ext_${extraIdx}`;
                        realPlayers.push({
                            id: extraId,
                            name: `${template.name} (Reserva ${extraIdx})`,
                            level: template.level,
                            gender: template.gender,
                            avatar: null
                        });
                        extraIdx++;
                    }
                }

                return realPlayers;
            };

            return raceWithTimeout(fetchQueryPromise, 1200, fallbackPool, 'fetchRealPlayers');
        }

        /**
         * 1.2 SIMULACIÓN BASADA EN UN EVENTO REAL DE LA BASE DE DATOS
         * Carga el evento real (Americana o Entreno), extrae sus participantes inscritos
         * y complementa con jugadores reales si faltan para cubrir las pistas.
         * Blindado con timeout estricto de 1500ms usando Promise.race contra un temporizador
         * con fallback seguro a eventos y participantes demo en memoria.
         *
         * @param {string|Object} eventId - ID del evento real o documento en memoria
         * @param {string} eventType - 'americana' | 'entreno' (default: 'americana')
         * @param {Object} simOptions - Opciones adicionales de simulación
         * @returns {Promise<Object>} Simulación completa con { isClonedFromReal: true, sourceEventName, sourceEventId, ... }
         */
        static async simulateFromRealEvent(eventId, eventType = 'americana', simOptions = {}) {
            const normalizedType = (eventType || 'americana').toLowerCase();
            const isEntreno = normalizedType === 'entreno';
            const isInputObject = (typeof eventId === 'object' && eventId !== null);

            // Generador seguro de fallback 100% en memoria
            const getMemoryFallbackData = () => {
                const targetCourts = Math.max(1, parseInt(simOptions.numCourts || (isInputObject && (eventId.num_courts || eventId.max_courts)) || 4, 10));
                const requiredPlayers = targetCourts * 4;
                const pool = getSomosPadelFallbackPool(Math.max(requiredPlayers, 48));

                let extractedPlayers = [];
                if (isInputObject) {
                    const candidateArrays = [
                        eventId.players,
                        eventId.registeredPlayers,
                        eventId.participants,
                        eventId.inscriptions,
                        eventId.users,
                        eventId.inscribed
                    ];
                    for (const cand of candidateArrays) {
                        if (Array.isArray(cand) && cand.length > 0) {
                            extractedPlayers = cand;
                            break;
                        }
                    }
                }

                const fallbackEventDoc = {
                    id: String(isInputObject ? (eventId.id || 'REAL_EVENT_MOCK') : (eventId || 'REAL_EVENT_MOCK')),
                    name: (isInputObject && eventId.name) ? eventId.name : `${isEntreno ? 'Entreno' : 'Americana'} Club SomosPadel (Demo en Memoria)`,
                    num_courts: targetCourts,
                    pair_mode: simOptions.mode || (isInputObject && (eventId.pair_mode || eventId.mode)) || 'twister',
                    rounds: simOptions.rounds || (isInputObject && (eventId.rounds || eventId.total_rounds)) || 6
                };

                return {
                    eventDoc: fallbackEventDoc,
                    extractedPlayers: extractedPlayers
                };
            };

            const loadAsyncData = async () => {
                const scope = getGlobalScope();
                let eventDoc = null;
                let extractedPlayers = [];

                // A) Si eventId es un objeto directo en memoria
                if (isInputObject) {
                    eventDoc = eventId.event || eventId;
                }

                const firebaseDB = scope.FirebaseDB || (typeof FirebaseDB !== 'undefined' ? FirebaseDB : null);
                const dbInstance = scope.db || (typeof db !== 'undefined' ? db : null);

                // B) Lectura de FirebaseDB
                if (!eventDoc && firebaseDB) {
                    try {
                        const eventCol = isEntreno ? firebaseDB.entrenos : (firebaseDB.americanas || firebaseDB.tournaments);
                        if (eventCol && typeof eventCol.getById === 'function') {
                            eventDoc = await eventCol.getById(eventId);
                        }
                    } catch (e) {
                        console.warn(`${LOG_PREFIX} [simulateFromRealEvent] Error FirebaseDB getById:`, e.message);
                    }
                }

                // C) Lectura de Firestore nativo
                if (!eventDoc && dbInstance && typeof dbInstance.collection === 'function') {
                    try {
                        const colNames = isEntreno ? ['entrenos'] : ['americanas', 'tournaments'];
                        for (const cName of colNames) {
                            const snap = await dbInstance.collection(cName).doc(eventId).get();
                            if (snap && snap.exists) {
                                eventDoc = { id: snap.id, ...snap.data() };
                                break;
                            }
                        }
                    } catch (e) {
                        console.warn(`${LOG_PREFIX} [simulateFromRealEvent] Error Firestore doc get:`, e.message);
                    }
                }

                // Documento de evento de fallback si no se encontró
                if (!eventDoc) {
                    eventDoc = {
                        id: String(typeof eventId === 'string' ? eventId : 'REAL_EVENT_MOCK'),
                        name: `${isEntreno ? 'Entreno' : 'Americana'} Club SomosPadel`,
                        num_courts: simOptions.numCourts || 4,
                        pair_mode: simOptions.mode || 'twister'
                    };
                }

                // Extraer jugadores inscritos de diferentes estructuras posibles
                const candidateArrays = [
                    eventDoc.players,
                    eventDoc.registeredPlayers,
                    eventDoc.participants,
                    eventDoc.inscriptions,
                    eventDoc.users,
                    eventDoc.inscribed
                ];

                for (const cand of candidateArrays) {
                    if (Array.isArray(cand) && cand.length > 0) {
                        extractedPlayers = cand;
                        break;
                    } else if (cand && typeof cand === 'object' && !Array.isArray(cand)) {
                        const vals = Object.values(cand);
                        if (vals.length > 0) {
                            extractedPlayers = vals;
                            break;
                        }
                    }
                }

                // Búsqueda adicional en participantes independientes si aplica
                if (extractedPlayers.length === 0 && firebaseDB && firebaseDB.participants && typeof firebaseDB.participants.getByEvent === 'function') {
                    try {
                        const pList = await firebaseDB.participants.getByEvent(eventDoc.id || eventId);
                        if (Array.isArray(pList) && pList.length > 0) {
                            extractedPlayers = pList;
                        }
                    } catch (e) {
                        // Continuar con fallback
                    }
                }

                return { eventDoc, extractedPlayers };
            };

            // Blindaje con timeout estricto de 1500ms contra bloqueos de red
            const loaded = await raceWithTimeout(
                loadAsyncData,
                1500,
                getMemoryFallbackData,
                'simulateFromRealEvent'
            );

            const eventDoc = (loaded && loaded.eventDoc) ? loaded.eventDoc : getMemoryFallbackData().eventDoc;
            const extractedPlayers = (loaded && Array.isArray(loaded.extractedPlayers)) ? loaded.extractedPlayers : [];

            // Normalizar jugadores base encontrados
            const basePlayers = [];
            const seenIds = new Set();
            const seenNames = new Set();

            extractedPlayers.forEach((raw, idx) => {
                if (!raw) return;
                const id = String(raw.id || raw.uid || `event_p_${idx + 1}`);
                const name = String(raw.name || raw.displayName || raw.userName || `Jugador #${idx + 1}`).trim();
                const norm = name.toLowerCase();

                if (seenIds.has(id) || seenNames.has(norm)) return;
                seenIds.add(id);
                seenNames.add(norm);

                let level = parseFloat(raw.level || raw.playtomic_level || raw.self_rate_level || 3.5);
                if (isNaN(level) || level <= 0) level = 3.5;

                let gender = (raw.gender || raw.sex || '').toLowerCase();
                if (gender === 'f' || gender === 'female' || gender === 'mujer' || gender === 'chica') {
                    gender = 'chica';
                } else if (gender === 'm' || gender === 'male' || gender === 'hombre' || gender === 'chico') {
                    gender = 'chico';
                } else {
                    gender = (basePlayers.length % 2 === 0) ? 'chico' : 'chica';
                }

                const avatar = raw.avatar || raw.photoURL || raw.photo_url || null;

                basePlayers.push({
                    id: id,
                    name: name,
                    level: Number(level.toFixed(2)),
                    gender: gender,
                    avatar: avatar
                });
            });

            // Determinar configuración de pistas y requerimiento de jugadores
            const numCourts = Math.max(1, parseInt(simOptions.numCourts || eventDoc.num_courts || eventDoc.max_courts || (basePlayers.length > 0 ? Math.ceil(basePlayers.length / 4) : 4), 10));
            const requiredPlayers = numCourts * 4;

            // Complementar con jugadores reales si faltan para cubrir numCourts * 4
            let finalPlayers = [...basePlayers];
            if (finalPlayers.length < requiredPlayers) {
                const pool = await this.fetchRealPlayers(requiredPlayers + 10);
                for (const p of pool) {
                    if (finalPlayers.length >= requiredPlayers) break;
                    const norm = p.name.toLowerCase();
                    if (!seenIds.has(p.id) && !seenNames.has(norm)) {
                        seenIds.add(p.id);
                        seenNames.add(norm);
                        finalPlayers.push(p);
                    }
                }
            }

            const simMode = simOptions.mode || eventDoc.pair_mode || eventDoc.mode || 'twister';
            const totalRounds = simOptions.rounds || eventDoc.rounds || eventDoc.total_rounds || 6;
            const eventName = eventDoc.name
                ? (eventDoc.name.startsWith('[Simulación]') ? eventDoc.name : `[Simulación] ${eventDoc.name}`)
                : (isEntreno ? 'Entreno SomosPadel Real (Simulado)' : 'Americana SomosPadel Real (Simulada)');

            // Ejecutar simulación turbo en memoria (100% síncrono, cálculo puro)
            const simResult = this.simulateTournament({
                ...simOptions,
                mode: simMode,
                numCourts: numCourts,
                rounds: totalRounds,
                eventType: normalizedType,
                eventName: eventName,
                playersSource: 'real',
                players: finalPlayers
            });

            return {
                ...simResult,
                isClonedFromReal: true,
                sourceEventId: eventDoc.id || String(eventId),
                sourceEventName: eventDoc.name || (isEntreno ? 'Entreno SomosPadel' : 'Americana SomosPadel')
            };
        }

        /**
         * 2. AUDITOR DE REGLAS DE ORO
         * Evalúa las 5 reglas críticas sobre un conjunto de partidos.
         *
         * @param {Array} matches - Partidos a auditar
         * @param {Object} eventDoc - Metadata del evento (opcional)
         * @returns {Object} { overallScore, isHealthy, rules, totalMatches, totalRounds, issuesFound }
         */
        static auditGoldenRules(matches = [], eventDoc = {}) {
            if (!eventDoc.silent) {
                console.log(`${LOG_PREFIX} Ejecutando auditoría de Reglas de Oro sobre ${matches.length} partidos...`);
            }

            const safeMatches = Array.isArray(matches) ? matches : [];
            const issuesFound = [];

            // Extraer metadata relevante
            const maxCourtInMatches = safeMatches.reduce((max, m) => Math.max(max, parseInt(m.court, 10) || 1), 1);
            const numCourts = eventDoc.num_courts || eventDoc.max_courts || maxCourtInMatches || 4;
            const mode = (eventDoc.pair_mode || eventDoc.mode || (safeMatches[0] && safeMatches[0].mode) || 'twister').toLowerCase();
            const roundsInMatches = [...new Set(safeMatches.map(m => parseInt(m.round, 10)).filter(Boolean))].sort((a, b) => a - b);
            const totalRounds = roundsInMatches.length > 0 ? Math.max(...roundsInMatches) : 0;

            // ==========================================
            // REGLA 1: DINÁMICA DE POZO (ASCENSOS Y DESCENSOS)
            // ==========================================
            const rule1 = {
                id: 'RULE_POZO_MOVEMENT',
                name: 'Dinámica de Pozo: Ascensos y Descensos',
                passed: true,
                score: 100,
                details: '',
                warnings: []
            };

            if (mode === 'swiss') {
                rule1.details = 'Modalidad Suiza: Las transiciones se evalúan en base al ordenamiento por clasificación acumulada.';
                rule1.score = 100;
                rule1.passed = true;
            } else if (totalRounds <= 1) {
                rule1.details = 'Torneo de una única ronda o inicial: sin transiciones consecutivas que evaluar.';
                rule1.score = 100;
                rule1.passed = true;
            } else {
                let totalTransitions = 0;
                let correctTransitions = 0;

                for (let r = 1; r < totalRounds; r++) {
                    const matchesCurrent = safeMatches.filter(m => parseInt(m.round, 10) === r && m.status === 'finished');
                    const matchesNext = safeMatches.filter(m => parseInt(m.round, 10) === r + 1);

                    matchesCurrent.forEach(mCurr => {
                        const courtCurr = parseInt(mCurr.court, 10);
                        const sA = parseInt(mCurr.score_a, 10) || 0;
                        const sB = parseInt(mCurr.score_b, 10) || 0;
                        const isWinA = sA > sB;

                        const winIds = (isWinA ? mCurr.team_a_ids : mCurr.team_b_ids) || [];
                        const loseIds = (isWinA ? mCurr.team_b_ids : mCurr.team_a_ids) || [];

                        const expectedWinCourt = Math.max(1, courtCurr - 1);
                        const expectedLoseCourt = Math.min(numCourts, courtCurr + 1);

                        // Evaluar ganadores
                        winIds.forEach(id => {
                            const nextMatch = matchesNext.find(nm =>
                                (nm.team_a_ids && nm.team_a_ids.includes(id)) ||
                                (nm.team_b_ids && nm.team_b_ids.includes(id))
                            );
                            if (nextMatch) {
                                totalTransitions++;
                                const nextCourt = parseInt(nextMatch.court, 10);
                                if (nextCourt === expectedWinCourt) {
                                    correctTransitions++;
                                } else {
                                    const msg = `R${r}➔R${r + 1}: Jugador/Pareja (${id}) ganó en Pista ${courtCurr} pero jugó en Pista ${nextCourt} (esperado: ${expectedWinCourt}).`;
                                    rule1.warnings.push(msg);
                                    issuesFound.push(`[Regla 1] ${msg}`);
                                }
                            }
                        });

                        // Evaluar perdedores
                        loseIds.forEach(id => {
                            const nextMatch = matchesNext.find(nm =>
                                (nm.team_a_ids && nm.team_a_ids.includes(id)) ||
                                (nm.team_b_ids && nm.team_b_ids.includes(id))
                            );
                            if (nextMatch) {
                                totalTransitions++;
                                const nextCourt = parseInt(nextMatch.court, 10);
                                if (nextCourt === expectedLoseCourt) {
                                    correctTransitions++;
                                } else {
                                    const msg = `R${r}➔R${r + 1}: Jugador/Pareja (${id}) perdió en Pista ${courtCurr} pero jugó en Pista ${nextCourt} (esperado: ${expectedLoseCourt}).`;
                                    rule1.warnings.push(msg);
                                    issuesFound.push(`[Regla 1] ${msg}`);
                                }
                            }
                        });
                    });
                }

                if (totalTransitions > 0) {
                    const ratio = correctTransitions / totalTransitions;
                    rule1.score = Math.round(ratio * 100);
                    rule1.passed = rule1.score >= 85;
                    rule1.details = `${correctTransitions} de ${totalTransitions} transiciones de pista correctas (${rule1.score}%).`;
                } else {
                    rule1.details = 'No se hallaron suficientes partidos enlazados entre rondas consecutivas.';
                    rule1.score = 90;
                }
            }

            // ==========================================
            // REGLA 2: NO REPETICIÓN DE PAREJAS EN TWISTER
            // ==========================================
            const rule2 = {
                id: 'RULE_NO_PARTNER_REPEAT',
                name: 'No Repetición de Parejas en Twister',
                passed: true,
                score: 100,
                details: '',
                warnings: []
            };

            if (mode === 'fixed') {
                rule2.details = 'Modalidad Parejas Fijas: las duplas se mantienen estables por diseño.';
                rule2.score = 100;
                rule2.passed = true;
            } else {
                const partnerCounts = new Map();
                safeMatches.forEach(m => {
                    const teams = [m.team_a_ids || [], m.team_b_ids || []];
                    teams.forEach(t => {
                        if (t.length >= 2) {
                            const key = [String(t[0]), String(t[1])].sort().join('___');
                            const history = partnerCounts.get(key) || { count: 0, rounds: [] };
                            history.count++;
                            history.rounds.push(m.round);
                            partnerCounts.set(key, history);
                        }
                    });
                });

                let totalRepeatedInstances = 0;
                partnerCounts.forEach((info, pairKey) => {
                    if (info.count > 1) {
                        const extraRepeats = info.count - 1;
                        totalRepeatedInstances += extraRepeats;
                        const [id1, id2] = pairKey.split('___');
                        const msg = `Pareja [${id1} & ${id2}] jugó junta ${info.count} veces (Rondas: ${info.rounds.join(', ')}).`;
                        rule2.warnings.push(msg);
                        issuesFound.push(`[Regla 2] ${msg}`);
                    }
                });

                if (totalRepeatedInstances === 0) {
                    rule2.score = 100;
                    rule2.details = 'Rotación perfecta: 0 repeticiones de pareja detectadas.';
                } else {
                    const naturalTolerance = (numCourts <= 2 && totalRounds >= 5)
                        ? 2
                        : (mode === 'swiss' ? Math.max(3, Math.floor(numCourts / 2)) : Math.floor(numCourts / 2));
                    const penalizedRepeats = Math.max(0, totalRepeatedInstances - naturalTolerance);
                    rule2.score = Math.max(0, 100 - (penalizedRepeats * 10));
                    rule2.passed = rule2.score >= 50;
                    rule2.details = `${totalRepeatedInstances} repeticiones de parejas detectadas en el torneo.`;
                }
            }

            // ==========================================
            // REGLA 3: INTEGRIDAD DE PUNTUACIÓN & PODIO
            // ==========================================
            const rule3 = {
                id: 'RULE_SCORE_INTEGRITY',
                name: 'Integridad de Puntuación & Podio',
                passed: true,
                score: 100,
                details: '',
                warnings: []
            };

            let invalidScoreMatches = 0;
            let unresolvedTies = 0;
            let totalMatchGames = 0;
            let totalGamesAwardedWon = 0;
            let totalGamesAwardedLost = 0;

            safeMatches.forEach(m => {
                if (m.status === 'finished') {
                    const rawA = m.score_a;
                    const rawB = m.score_b;
                    const sA = Number(rawA);
                    const sB = Number(rawB);

                    if (isNaN(sA) || isNaN(sB) || sA < 0 || sB < 0 || rawA === null || rawB === null || rawA === undefined || rawB === undefined) {
                        invalidScoreMatches++;
                        const msg = `Partido ${m.id} (R${m.round} P${m.court}) tiene puntuaciones corruptas/inválidas: (${rawA}, ${rawB}).`;
                        rule3.warnings.push(msg);
                        issuesFound.push(`[Regla 3] ${msg}`);
                    } else {
                        const teamA = m.team_a_ids || [];
                        const teamB = m.team_b_ids || [];
                        totalMatchGames += (sA + sB);

                        // En cada partido, los juegos ganados por el equipo A son perdidos por el equipo B y viceversa
                        const countA = teamA.length || 2;
                        const countB = teamB.length || 2;
                        totalGamesAwardedWon += (sA * countA) + (sB * countB);
                        totalGamesAwardedLost += (sB * countA) + (sA * countB);

                        if (sA === sB && mode !== 'swiss') {
                            unresolvedTies++;
                            const msg = `Partido ${m.id} (R${m.round} P${m.court}) finalizó en empate (${sA}-${sB}) no permitido en sistema Pozo.`;
                            rule3.warnings.push(msg);
                            issuesFound.push(`[Regla 3] ${msg}`);
                        }

                        // Verificación de plausibilidad de marcador de pádel
                        if (sA > 15 || sB > 15) {
                            const msg = `Partido ${m.id} marcador atípico/fuera de rango: ${sA}-${sB}.`;
                            rule3.warnings.push(msg);
                        }
                    }
                }
            });

            // Balance simétrico: en todo torneo de suma cero, los juegos ganados equivalen a los perdidos
            const scoreDiffNet = Math.abs(totalGamesAwardedWon - totalGamesAwardedLost);
            let scorePenalty = 0;
            if (invalidScoreMatches > 0) scorePenalty += invalidScoreMatches * 20;
            if (unresolvedTies > 0) scorePenalty += unresolvedTies * 10;
            if (scoreDiffNet !== 0) {
                scorePenalty += 25;
                const msg = `Desbalance neto en actas: total juegos asignados ganados (${totalGamesAwardedWon}) !== perdidos (${totalGamesAwardedLost}).`;
                rule3.warnings.push(msg);
                issuesFound.push(`[Regla 3] ${msg}`);
            }

            rule3.score = Math.max(0, 100 - scorePenalty);
            rule3.passed = rule3.score >= 85;
            rule3.details = (rule3.score === 100)
                ? `Actas 100% íntegras. Total juegos disputados: ${totalMatchGames} con balance diferencial neto 0.`
                : `Se detectaron discrepancias: ${invalidScoreMatches} actas inválidas y ${unresolvedTies} empates no dirimidos.`;

            // ==========================================
            // REGLA 4: EQUIDAD DE PISTAS & DISTRIBUCIÓN
            // ==========================================
            const rule4 = {
                id: 'RULE_COURT_EQUITY',
                name: 'Equidad de Pistas & Distribución',
                passed: true,
                score: 100,
                details: '',
                warnings: []
            };

            let invalidPlayerCounts = 0;
            let duplicatePlayerRounds = 0;
            let courtOutOfRange = 0;

            roundsInMatches.forEach(r => {
                const roundMatches = safeMatches.filter(m => parseInt(m.round, 10) === r);
                const playersInRound = new Map();

                roundMatches.forEach(m => {
                    const c = parseInt(m.court, 10);
                    if (c < 1 || c > numCourts) {
                        courtOutOfRange++;
                        const msg = `Pista ${c} fuera de rango permitido (1..${numCourts}) en partido ${m.id}.`;
                        rule4.warnings.push(msg);
                        issuesFound.push(`[Regla 4] ${msg}`);
                    }

                    const teamA = m.team_a_ids || [];
                    const teamB = m.team_b_ids || [];
                    const allInMatch = [...teamA, ...teamB];

                    // Verificar cantidad adecuada (salvo BYE intencionado)
                    if (!m.is_bye && (teamA.length !== 2 || teamB.length !== 2)) {
                        invalidPlayerCounts++;
                        const msg = `Partido ${m.id} (R${r} P${c}) no cuenta con exactamente 4 jugadores (${teamA.length} vs ${teamB.length}).`;
                        rule4.warnings.push(msg);
                        issuesFound.push(`[Regla 4] ${msg}`);
                    }

                    // Verificar no duplicidad interna en el mismo partido
                    const uniqueInMatch = new Set(allInMatch);
                    if (uniqueInMatch.size !== allInMatch.length) {
                        invalidPlayerCounts++;
                        const msg = `Partido ${m.id} tiene jugadores duplicados en la misma pista.`;
                        rule4.warnings.push(msg);
                        issuesFound.push(`[Regla 4] ${msg}`);
                    }

                    // Verificar que ningún jugador juegue 2 partidos en la misma ronda
                    allInMatch.forEach(pId => {
                        if (playersInRound.has(pId)) {
                            duplicatePlayerRounds++;
                            const prevCourt = playersInRound.get(pId);
                            const msg = `Ronda ${r}: Jugador ${pId} programado simultáneamente en Pista ${prevCourt} y Pista ${c}.`;
                            rule4.warnings.push(msg);
                            issuesFound.push(`[Regla 4] ${msg}`);
                        } else {
                            playersInRound.set(pId, c);
                        }
                    });
                });
            });

            const equityPenalties = (duplicatePlayerRounds * 25) + (invalidPlayerCounts * 15) + (courtOutOfRange * 10);
            rule4.score = Math.max(0, 100 - equityPenalties);
            rule4.passed = rule4.score >= 85;
            rule4.details = (rule4.score === 100)
                ? `Distribución impecable: todos los partidos con 4 jugadores únicos y pistas asignadas del 1 al ${numCourts}.`
                : `Problemas de equidad: ${duplicatePlayerRounds} solapamientos de jugador y ${invalidPlayerCounts} partidos con alineación irregular.`;

            // ==========================================
            // REGLA 5: CONSISTENCIA DE RONDAS
            // ==========================================
            const rule5 = {
                id: 'RULE_ROUND_CONSISTENCY',
                name: 'Consistencia de Rondas',
                passed: true,
                score: 100,
                details: '',
                warnings: []
            };

            let roundPenalty = 0;
            // Validar secuencialidad
            for (let i = 1; i <= totalRounds; i++) {
                if (!roundsInMatches.includes(i)) {
                    roundPenalty += 25;
                    const msg = `Secuencia rota: falta la Ronda ${i} en los partidos del evento.`;
                    rule5.warnings.push(msg);
                    issuesFound.push(`[Regla 5] ${msg}`);
                }
            }

            // Validar que rondas pasadas no tengan partidos sin finalizar
            for (let r = 1; r < totalRounds; r++) {
                const pendingInPrev = safeMatches.filter(m => parseInt(m.round, 10) === r && m.status !== 'finished');
                if (pendingInPrev.length > 0) {
                    roundPenalty += pendingInPrev.length * 15;
                    const msg = `La Ronda ${r} tiene ${pendingInPrev.length} partidos pendientes habiendo avanzado a rondas posteriores.`;
                    rule5.warnings.push(msg);
                    issuesFound.push(`[Regla 5] ${msg}`);
                }
            }

            // Validar cumplimiento de 6 rondas oficiales si el torneo está finalizado
            const isFinishedEvent = eventDoc.status === 'finished' || eventDoc.status === 'completed';
            const expectedRounds = eventDoc.rounds || 6;
            if (isFinishedEvent && totalRounds < expectedRounds) {
                roundPenalty += 15;
                const msg = `El torneo finalizó con ${totalRounds} rondas (el estándar oficial requiere ${expectedRounds} rondas).`;
                rule5.warnings.push(msg);
                issuesFound.push(`[Regla 5] ${msg}`);
            }

            rule5.score = Math.max(0, 100 - roundPenalty);
            rule5.passed = rule5.score >= 80;
            rule5.details = (rule5.score === 100)
                ? `Secuencia cronológica perfecta (${totalRounds} rondas completadas secuencialmente sin partidos huérfanos).`
                : `Inconsistencias en el flujo de rondas: score ${rule5.score}/100.`;

            // ==========================================
            // EVALUACIÓN GLOBAL
            // ==========================================
            const allRules = [rule1, rule2, rule3, rule4, rule5];
            const overallScore = Math.round(allRules.reduce((acc, r) => acc + r.score, 0) / allRules.length);
            const isHealthy = overallScore >= 80 && allRules.every(r => r.score >= 50 || r.passed);

            if (!eventDoc.silent) {
                console.log(`${LOG_PREFIX} Auditoría finalizada: Score Global = ${overallScore}/100 | Saludable = ${isHealthy}`);
            }

            return {
                overallScore: overallScore,
                isHealthy: isHealthy,
                rules: allRules,
                totalMatches: safeMatches.length,
                totalRounds: totalRounds,
                issuesFound: issuesFound
            };
        }

        /**
         * 3. DIAGNÓSTICO DE EVENTO REAL
         * Lee el evento y sus partidos de Firebase / memoria y ejecuta la auditoría completa con recomendaciones.
         *
         * @param {string|Object} eventId - ID del evento o documento del evento en memoria
         * @param {string} eventType - 'americana' | 'entreno' (default: 'americana')
         * @returns {Promise<Object>} { eventId, eventType, eventName, auditResult, recommendations, timestamp }
         */
        static async diagnoseRealEvent(eventId, eventType = 'americana') {
            console.log(`${LOG_PREFIX} Iniciando diagnóstico de evento real ID='${typeof eventId === 'object' ? eventId.id || 'IN_MEMORY' : eventId}' (${eventType})...`);
            const timestamp = new Date().toISOString();

            const isInputObject = (typeof eventId === 'object' && eventId !== null);
            const fallbackDiagnoseData = {
                eventDoc: {
                    id: String(isInputObject ? (eventId.id || 'IN_MEMORY') : (eventId || 'UNKNOWN')),
                    name: (isInputObject && eventId.name) ? eventId.name : 'Evento no localizado / Offline',
                    status: (isInputObject && eventId.status) ? eventId.status : 'unknown',
                    pair_mode: (isInputObject && (eventId.pair_mode || eventId.mode)) || 'twister',
                    num_courts: (isInputObject && eventId.num_courts) || 4
                },
                matches: (isInputObject && Array.isArray(eventId.matches)) ? eventId.matches : []
            };

            const fetchDiagnoseData = async () => {
                // Caso A: Objeto pasado en memoria directamente (ej. para tests o diagnóstico reactivo)
                if (isInputObject) {
                    return {
                        eventDoc: eventId.event || eventId,
                        matches: Array.isArray(eventId.matches) ? eventId.matches : []
                    };
                }

                const scope = getGlobalScope();
                const firebaseDB = scope.FirebaseDB || (typeof FirebaseDB !== 'undefined' ? FirebaseDB : null);
                const dbInstance = scope.db || (typeof db !== 'undefined' ? db : null);
                let eventDoc = null;
                let matches = [];

                // Caso B: Lectura de base de datos FirebaseDB si está disponible
                if (firebaseDB) {
                    const isEntreno = eventType === 'entreno';
                    const eventCol = isEntreno ? firebaseDB.entrenos : firebaseDB.americanas;
                    const matchesCol = isEntreno ? firebaseDB.entrenos_matches : firebaseDB.matches;

                    if (eventCol && typeof eventCol.getById === 'function') {
                        eventDoc = await eventCol.getById(eventId);
                    }
                    if (matchesCol && typeof matchesCol.getByAmericana === 'function') {
                        matches = await matchesCol.getByAmericana(eventId);
                    } else if (matchesCol && typeof matchesCol.getAll === 'function') {
                        const all = await matchesCol.getAll();
                        matches = all.filter(m => m.americana_id === eventId || m.event_id === eventId);
                    }
                }

                // Caso C: Lectura directa de Firestore nativo
                if (!eventDoc && dbInstance && typeof dbInstance.collection === 'function') {
                    const isEntreno = eventType === 'entreno';
                    const colName = isEntreno ? 'entrenos' : 'tournaments';
                    const matchColName = isEntreno ? 'entrenos_matches' : 'matches';

                    const docSnap = await dbInstance.collection(colName).doc(eventId).get();
                    if (docSnap && docSnap.exists) {
                        eventDoc = { id: docSnap.id, ...docSnap.data() };
                    }

                    const matchesSnap = await dbInstance.collection(matchColName)
                        .where('americana_id', '==', eventId)
                        .get();

                    if (!matchesSnap.empty) {
                        matches = matchesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                    } else {
                        // Fallback con event_id
                        const fallbackSnap = await dbInstance.collection(matchColName)
                            .where('event_id', '==', eventId)
                            .get();
                        matches = fallbackSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                    }
                }

                return {
                    eventDoc: eventDoc || fallbackDiagnoseData.eventDoc,
                    matches: matches || []
                };
            };

            const data = await raceWithTimeout(fetchDiagnoseData, 1500, fallbackDiagnoseData, 'diagnoseRealEvent');
            const eventDoc = (data && data.eventDoc) ? data.eventDoc : fallbackDiagnoseData.eventDoc;
            const matches = (data && Array.isArray(data.matches)) ? data.matches : [];

            const auditResult = this.auditGoldenRules(matches, eventDoc);

            // Generación de recomendaciones operativas
            const recommendations = [];
            if (auditResult.isHealthy) {
                recommendations.push('✅ El torneo cumple con todos los estándares de excelencia y salud algorítmica.');
            } else {
                recommendations.push('⚠️ Se detectaron vulnerabilidades en la integridad de la competición.');
            }

            const r1 = auditResult.rules.find(r => r.id === 'RULE_POZO_MOVEMENT');
            if (r1 && !r1.passed) {
                recommendations.push('🔄 Regla 1 (Ascensos/Descensos): Se detectaron saltos de pista anómalos. Verifica si se realizaron modificaciones manuales de pista no consolidadas.');
            }

            const r2 = auditResult.rules.find(r => r.id === 'RULE_NO_PARTNER_REPEAT');
            if (r2 && !r2.passed) {
                recommendations.push('👥 Regla 2 (Duplas Twister): Hay parejas reiteradas en rondas consecutivas. Se recomienda activar el algoritmo `_createSmartPairs` de rotación estricta.');
            }

            const r3 = auditResult.rules.find(r => r.id === 'RULE_SCORE_INTEGRITY');
            if (r3 && !r3.passed) {
                recommendations.push('🔢 Regla 3 (Marcadores): Existen actas con puntuaciones nulas o empates no dirimidos. Completa los tanteos antes de proclamar la clasificación final.');
            }

            const r4 = auditResult.rules.find(r => r.id === 'RULE_COURT_EQUITY');
            if (r4 && !r4.passed) {
                recommendations.push('🏟️ Regla 4 (Equidad de Pistas): Se encontraron jugadores con doble asignación en una misma ronda. Ejecuta el módulo de sustituciones para purgar duplicados.');
            }

            const r5 = auditResult.rules.find(r => r.id === 'RULE_ROUND_CONSISTENCY');
            if (r5 && !r5.passed) {
                recommendations.push('⏱️ Regla 5 (Rondas): Hay partidos pendientes en rondas intermedias. Finaliza las actas previas para que la secuencia de rondas sea coherente.');
            }

            return {
                eventId: eventDoc.id || String(eventId),
                eventType: eventType,
                eventName: eventDoc.name || 'Competición Somospadel',
                auditResult: auditResult,
                recommendations: recommendations,
                timestamp: timestamp
            };
        }

        /**
         * 4. BATERÍA DE SELF-TEST ALGORÍTMICO
         * Ejecuta 6 pruebas en memoria midiendo latencias y exactitud algorítmica.
         *
         * @returns {Object} { totalTests, passedTests, failedTests, healthScore, tests }
         */
        static runAlgorithmicSelfTest() {
            console.log(`${LOG_PREFIX} 🧪 Iniciando Batería de Self-Test Algorítmico (6 Pruebas)...`);
            const results = [];

            // TEST 1: Validación y Stress Test 10 Pistas (40 Jugadores, 6 Rondas = 60 Partidos: Twister, Parejas Fijas y Suizo)
            (() => {
                const t0 = nowMs();
                let passed = false;
                let details = '';
                try {
                    // 1. Simulación Twister 10 pistas (40 jugadores, 6 rondas = 60 partidos)
                    const simTwister = this.simulateTournament({ mode: 'twister', numCourts: 10, rounds: 6, numPlayers: 40, silent: true });
                    const auditTwister = this.auditGoldenRules(simTwister.allMatches, { mode: 'twister', num_courts: 10, rounds: 6, silent: true });

                    // 2. Simulación Parejas Fijas 10 pistas (40 jugadores = 20 parejas, 6 rondas = 60 partidos)
                    const simFixed = this.simulateTournament({ mode: 'fixed', numCourts: 10, rounds: 6, numPlayers: 40, silent: true });
                    const auditFixed = this.auditGoldenRules(simFixed.allMatches, { mode: 'fixed', num_courts: 10, rounds: 6, silent: true });

                    // 3. Simulación Suizo 10 pistas (40 jugadores, 6 rondas = 60 partidos)
                    const simSwiss = this.simulateTournament({ mode: 'swiss', numCourts: 10, rounds: 6, numPlayers: 40, silent: true });
                    const auditSwiss = this.auditGoldenRules(simSwiss.allMatches, { mode: 'swiss', num_courts: 10, rounds: 6, silent: true });

                    const twisterOk = (simTwister.allMatches.length === 60) && (simTwister.players.length === 40) && auditTwister.isHealthy && (auditTwister.overallScore >= 80);
                    const fixedOk = (simFixed.allMatches.length === 60) && (simFixed.pairs.length === 20) && auditFixed.isHealthy && (auditFixed.overallScore >= 80);
                    const swissOk = (simSwiss.allMatches.length === 60) && (simSwiss.players.length === 40) && auditSwiss.isHealthy && (auditSwiss.overallScore >= 80);

                    const elapsed = parseFloat((nowMs() - t0).toFixed(2));
                    passed = twisterOk && fixedOk && swissOk && (elapsed < 25);
                    details = `10 pistas validadas: Twister (${auditTwister.overallScore}/100), Fijas (${auditFixed.overallScore}/100), Suizo (${auditSwiss.overallScore}/100) | 180 partidos en ${elapsed} ms (<25ms).`;
                } catch (err) {
                    details = `Error: ${err.message}`;
                }
                const durationMs = parseFloat((nowMs() - t0).toFixed(2));
                results.push({ name: '1. Validación Stress Test 10 Pistas (40 Jugadores, 6 Rondas: Twister, Fijas, Suizo)', passed, durationMs, details });
            })();

            // TEST 2: Twister 2 Pistas (8 Jugadores, 6 Rondas)
            (() => {
                const t0 = nowMs();
                let passed = false;
                let details = '';
                try {
                    const sim = this.simulateTournament({ mode: 'twister', numCourts: 2, rounds: 6, numPlayers: 8, silent: true });
                    const audit = this.auditGoldenRules(sim.allMatches, { mode: 'twister', num_courts: 2, rounds: 6, silent: true });
                    passed = (sim.allMatches.length === 12) && (sim.roundsDetail.length === 6) && (audit.overallScore >= 75);
                    details = `12 partidos generados. Transiciones de 2 pistas validadas (Score: ${audit.overallScore}/100).`;
                } catch (err) {
                    details = `Error: ${err.message}`;
                }
                const durationMs = parseFloat((nowMs() - t0).toFixed(2));
                results.push({ name: '2. Simulación Twister 2 Pistas (8 Jugadores, 6 Rondas)', passed, durationMs, details });
            })();

            // TEST 3: Parejas Fijas 4 Pistas (8 Parejas, 6 Rondas)
            (() => {
                const t0 = nowMs();
                let passed = false;
                let details = '';
                try {
                    const sim = this.simulateTournament({ mode: 'fixed', numCourts: 4, rounds: 6, silent: true });
                    const audit = this.auditGoldenRules(sim.allMatches, { mode: 'fixed', num_courts: 4, rounds: 6, silent: true });
                    const r2 = audit.rules.find(r => r.id === 'RULE_NO_PARTNER_REPEAT');
                    passed = (sim.allMatches.length === 24) && audit.isHealthy && (r2 && r2.score === 100);
                    details = `24 partidos de parejas fijas. Regla de estabilidad de pareja: ${r2?.score}/100.`;
                } catch (err) {
                    details = `Error: ${err.message}`;
                }
                const durationMs = parseFloat((nowMs() - t0).toFixed(2));
                results.push({ name: '3. Simulación Parejas Fijas 4 Pistas (8 Parejas, 6 Rondas)', passed, durationMs, details });
            })();

            // TEST 4: Suizo 4 Pistas (16 Jugadores, 6 Rondas)
            (() => {
                const t0 = nowMs();
                let passed = false;
                let details = '';
                try {
                    const sim = this.simulateTournament({ mode: 'swiss', numCourts: 4, rounds: 6, numPlayers: 16, silent: true });
                    const audit = this.auditGoldenRules(sim.allMatches, { mode: 'swiss', num_courts: 4, rounds: 6, silent: true });
                    passed = (sim.allMatches.length === 24) && audit.isHealthy && (audit.overallScore >= 80);
                    details = `24 partidos evaluados bajo Sistema Suizo. Score acumulado: ${audit.overallScore}/100.`;
                } catch (err) {
                    details = `Error: ${err.message}`;
                }
                const durationMs = parseFloat((nowMs() - t0).toFixed(2));
                results.push({ name: '4. Simulación Sistema Suizo 4 Pistas (16 Jugadores, 6 Rondas)', passed, durationMs, details });
            })();

            // TEST 5: Validación Dirigida de Pozo (Ascensos y Descensos)
            (() => {
                const t0 = nowMs();
                let passed = false;
                let details = '';
                try {
                    // Partidos con resultado determinístico conocido
                    const testMatches = [
                        // Ronda 1
                        { id: 'm1_r1', round: 1, court: 1, team_a_ids: ['u1', 'u2'], team_b_ids: ['u3', 'u4'], score_a: 6, score_b: 2, status: 'finished' },
                        { id: 'm2_r1', round: 1, court: 2, team_a_ids: ['u5', 'u6'], team_b_ids: ['u7', 'u8'], score_a: 6, score_b: 3, status: 'finished' },
                        // Ronda 2: En Pista 1 juegan ganadores (u1, u2 de P1 y u5, u6 de P2)
                        // En Pista 2 juegan perdedores (u3, u4 de P1 y u7, u8 de P2)
                        { id: 'm1_r2', round: 2, court: 1, team_a_ids: ['u1', 'u5'], team_b_ids: ['u2', 'u6'], score_a: 6, score_b: 4, status: 'finished' },
                        { id: 'm2_r2', round: 2, court: 2, team_a_ids: ['u3', 'u7'], team_b_ids: ['u4', 'u8'], score_a: 6, score_b: 4, status: 'finished' }
                    ];

                    const audit = this.auditGoldenRules(testMatches, { mode: 'twister', num_courts: 2, rounds: 2, silent: true });
                    const r1 = audit.rules.find(r => r.id === 'RULE_POZO_MOVEMENT');
                    passed = r1 && r1.score === 100 && r1.passed === true;
                    details = `Verificación exacta de ascensos/descensos: Regla 1 alcanzó 100% de precisión.`;
                } catch (err) {
                    details = `Error: ${err.message}`;
                }
                const durationMs = parseFloat((nowMs() - t0).toFixed(2));
                results.push({ name: '5. Validación Dirigida de Dinámica Pozo (Regla 1)', passed, durationMs, details });
            })();

            // TEST 6: Validación de Marcadores & Suma Cero (Regla 3)
            (() => {
                const t0 = nowMs();
                let passed = false;
                let details = '';
                try {
                    // Marcadores íntegros
                    const cleanMatches = [
                        { id: 'cm1', round: 1, court: 1, team_a_ids: ['a1', 'a2'], team_b_ids: ['b1', 'b2'], score_a: 6, score_b: 3, status: 'finished' },
                        { id: 'cm2', round: 1, court: 2, team_a_ids: ['c1', 'c2'], team_b_ids: ['d1', 'd2'], score_a: 7, score_b: 5, status: 'finished' }
                    ];
                    const cleanAudit = this.auditGoldenRules(cleanMatches, { mode: 'twister', num_courts: 2, rounds: 1, silent: true });
                    const cleanR3 = cleanAudit.rules.find(r => r.id === 'RULE_SCORE_INTEGRITY');

                    // Marcador corrupto deliberado para verificar capacidad de detección
                    const corruptMatches = [
                        { id: 'bad1', round: 1, court: 1, team_a_ids: ['a1', 'a2'], team_b_ids: ['b1', 'b2'], score_a: NaN, score_b: 4, status: 'finished' }
                    ];
                    const corruptAudit = this.auditGoldenRules(corruptMatches, { mode: 'twister', num_courts: 2, rounds: 1, silent: true });
                    const corruptR3 = corruptAudit.rules.find(r => r.id === 'RULE_SCORE_INTEGRITY');

                    passed = (cleanR3 && cleanR3.score === 100) && (corruptR3 && corruptR3.score < 100);
                    details = `Limpios: ${cleanR3?.score}/100. Detección de corrupción: penalizado a ${corruptR3?.score}/100.`;
                } catch (err) {
                    details = `Error: ${err.message}`;
                }
                const durationMs = parseFloat((nowMs() - t0).toFixed(2));
                results.push({ name: '6. Validación de Marcadores & Suma Cero (Regla 3)', passed, durationMs, details });
            })();

            const passedTests = results.filter(r => r.passed).length;
            const failedTests = results.length - passedTests;
            const healthScore = Math.round((passedTests / results.length) * 100);

            console.log(`${LOG_PREFIX} 🏁 Batería finalizada: ${passedTests}/${results.length} tests aprobados (Health Score: ${healthScore}%)`);

            return {
                totalTests: results.length,
                passedTests: passedTests,
                failedTests: failedTests,
                healthScore: healthScore,
                tests: results
            };
        }
    }

    return TournamentLogicAuditService;
}));
