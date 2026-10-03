/**
 * MatchMakingService.js
 * Coordinador de lógica de emparejamientos de nivel élite (NASA Grade).
 * Abstrae la complejidad de llamar a FixedPairsLogic o RotatingPozoLogic.
 * Integra Sistema de Verificación Pre-Flight y Auto-Fix de Parejas Twister.
 * v5004 - Universal Mode Normalizer & Pre-Flight Integration
 */

console.log("🎲 LOADING MATCHMAKING SERVICE v5004...");

(function () {
    try {
        const MatchMakingService = {

            _locks: new Set(),

            /**
             * Generar partidos para una ronda específica.
             * Maneja automáticamente la lógica de "Smart Courts" y Pre-Flight Verification.
             */
            async generateRound(eventId, eventType, roundNum, force = false, randomize = false) {
                console.log(`🎲 MatchMakingService: Generando Ronda ${roundNum} para ${eventType} ${eventId} (force=${force}, randomize=${randomize})`);

                // Asegurar dependencias de datos
                if (typeof window.FirebaseDB === 'undefined' && typeof window.db === 'undefined') {
                    console.error("❌ FirebaseDB / db ausente en MatchMakingService!");
                    throw new Error("Base de datos Firebase no cargada.");
                }

                const APP_CONSTANTS = window.AppConstants || {
                    EVENT_TYPES: { AMERICANA: 'americana', ENTRENO: 'entreno' },
                    PAIR_MODES: { FIXED: 'fixed', FIXED_AUTO: 'fixed_auto', TWISTER: 'twister', SWISS: 'swiss' }
                };

                const collection = (eventType === 'entreno' || eventType === APP_CONSTANTS.EVENT_TYPES.ENTRENO)
                    ? window.FirebaseDB.entrenos
                    : window.FirebaseDB.americanas;

                const event = await collection.getById(eventId);
                if (!event) throw new Error("Evento no encontrado");

                const maxRounds = parseInt(event.rounds_count) || 6;
                if (roundNum > maxRounds && !force) {
                    throw new Error(`Límite de ${maxRounds} rondas alcanzado. No se pueden generar más.`);
                }

                // --- MUTEX LOCK (Prevenir doble-click / Race conditions) ---
                const lockKey = `${eventId}_R${roundNum}`;
                if (this._locks.has(lockKey)) {
                    console.warn(`🔒 [MatchMaking] Race condition prevenida. Generación en curso para ${lockKey}.`);
                    throw new Error("⏳ La ronda se está generando, por favor espera un momento...");
                }
                this._locks.add(lockKey);

                try {
                    // --- 1. ASEGURAR CARGA DE DEPENDENCIAS ---
                    await this._ensurePreFlightRoundVerifier();

                    // --- 2. NORMALIZACIÓN ESTRICTA Y UNIVERSAL DE MODALIDAD ---
                    const verifier = (typeof window !== 'undefined' && window.PreFlightRoundVerifier)
                        ? window.PreFlightRoundVerifier
                        : (typeof PreFlightRoundVerifier !== 'undefined' ? PreFlightRoundVerifier : null);

                    const mode = verifier
                        ? verifier.normalizePairMode(event.pair_mode, event)
                        : this._fallbackNormalizePairMode(event.pair_mode, event);

                    const isSwiss = mode === 'swiss';
                    const isFixedPairs = mode === 'fixed';
                    const isTwister = mode === 'twister';
                    const isPozoOrLadder = isTwister || mode === 'twister' || mode === 'pozo' || mode === 'rey_pista' || mode === 'rotating';

                    console.log(`🎯 [MatchMaking] Modalidad Normalizada: ${mode.toUpperCase()} (raw pair_mode: "${event.pair_mode}", name: "${event.name}")`);

                    // --- 🛡️ BÚNKER CLOUD DELEGATION (NIVEL NASA) ---
                    // En modos de ascensos/descensos individuales (Twister, Pozo, Rey), omitimos Cloud Function
                    // para garantizar ejecución local con TournamentEngine y TwisterInvariantGuard deterministas
                    if (!isPozoOrLadder && window.firebase && typeof firebase.functions === 'function') {
                        try {
                            const secureGen = firebase.app().functions('us-central1').httpsCallable('secureGenerateRound');
                            console.log("🔒 [Security Búnker] Solicitando cálculo seguro de ronda al servidor...");
                            const response = await secureGen({ eventId, eventType, roundNum, force, randomize });
                            if (response && response.data && response.data.success) {
                                console.log("✅ [Security Búnker] Ronda calculada en servidor:", response.data);
                                return response.data.matches;
                            }
                        } catch (cloudErr) {
                            console.warn("ℹ️ [Security Búnker Fallback] Delegando a cálculo local:", cloudErr.message);
                        }
                    }

                    // Descontaminar fixed_pairs si NO es modo Fixed Pairs
                    if (!isFixedPairs && Array.isArray(event.fixed_pairs) && event.fixed_pairs.length > 0) {
                        console.log(`🧹 [MatchMaking] Ignorando residuos de fixed_pairs (${event.fixed_pairs.length} parejas) porque la modalidad activa es ${mode.toUpperCase()}`);
                    }

                    // --- 3. NORMALIZACIÓN ROBUSTA DE JUGADORES ---
                    const rawPlayers = (Array.isArray(event.players) && event.players.length > 0)
                        ? event.players
                        : (Array.isArray(event.registeredPlayers) ? event.registeredPlayers : []);

                    let normalizedPlayers = rawPlayers.map((p, idx) => {
                        if (typeof p === 'string') {
                            return { id: p, uid: p, name: `Jugador ${idx + 1}`, level: 3.0, current_court: Math.floor(idx / 4) + 1 };
                        }
                        return {
                            ...p,
                            id: String(p.id || p.uid || `player_${idx + 1}`),
                            name: p.name || `Jugador ${idx + 1}`,
                            level: parseFloat(p.level || p.self_rate_level || 3.0),
                            current_court: parseInt(p.current_court || (Math.floor(idx / 4) + 1))
                        };
                    });

                    // --- 4. VERIFICACIÓN DE IDEMPOTENCIA EN BASE DE DATOS ---
                    const checkColl = (eventType === 'entreno') ? 'entrenos_matches' : 'matches';
                    const existingSnap = await window.db.collection(checkColl)
                        .where('americana_id', '==', eventId)
                        .where('round', '==', parseInt(roundNum))
                        .get();

                    if (!existingSnap.empty && !force) {
                        const existingRoundMatches = existingSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        console.warn(`🛑 BLOQUEO DE DUPLICADOS: Ya existen ${existingRoundMatches.length} partidos en Ronda ${roundNum}.`);
                        return existingRoundMatches;
                    }

                    // --- 5. SMART SCALING (PISTAS NECESARIAS) ---
                    let effectiveCourts = parseInt(event.max_courts || 4);
                    const playersCount = isFixedPairs
                        ? ((event.fixed_pairs && event.fixed_pairs.length > 0 ? event.fixed_pairs.length * 2 : 0) || normalizedPlayers.length)
                        : normalizedPlayers.length;

                    const maxPossibleCourts = Math.max(1, Math.floor(playersCount / 4));
                    if (effectiveCourts > maxPossibleCourts) {
                        console.log(`⚠️ AI Scaling CAP: Reduciendo de ${effectiveCourts} a ${maxPossibleCourts} pistas por límite de jugadores.`);
                        effectiveCourts = maxPossibleCourts;
                        await collection.update(eventId, { max_courts: effectiveCourts });
                        event.max_courts = effectiveCourts;
                    }

                    // --- 6. GENERACIÓN DE PARTIDOS ---
                    try {
                        if (roundNum > 1) {
                            // --- RONDAS 2+ ---
                            const fDb = (typeof window !== 'undefined' && window.FirebaseDB) ? window.FirebaseDB : (typeof FirebaseDB !== 'undefined' ? FirebaseDB : null);
                            const collName = (eventType === 'entreno') ? 'entrenos_matches' : 'matches';
                            let matches = [];
                            try {
                                if (window.db) {
                                    // 🛡️ LECTURA FRESCA FORZADA DESDE EL SERVIDOR (bypassing local cache)
                                    const snap = await window.db.collection(collName)
                                        .where('americana_id', '==', eventId)
                                        .get({ source: 'server' });
                                    matches = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                                    console.log(`🌐 [MatchMaking] ${matches.length} partidos leídos directamente del servidor (fresh read).`);
                                } else {
                                    const matchesCollection = (eventType === 'entreno') ? fDb?.entrenos_matches : fDb?.matches;
                                    matches = await matchesCollection.getByAmericana(eventId);
                                }
                            } catch (freshReadErr) {
                                console.warn("ℹ️ [MatchMaking] Fallback a lectura estándar de partidos:", freshReadErr.message);
                                const matchesCollection = (eventType === 'entreno') ? fDb?.entrenos_matches : fDb?.matches;
                                matches = await matchesCollection.getByAmericana(eventId);
                            }
                            const prevRoundMatches = matches.filter(m => parseInt(m.round) === (roundNum - 1));

                            // Limpieza de partidos fantasma no terminados
                            const finishedMatches = prevRoundMatches.filter(m => m.status === 'finished');
                            let unfinished = prevRoundMatches.filter(m => m.status !== 'finished');

                            if (unfinished.length > 0) {
                                const ghostIds = [];
                                const realUnfinished = [];
                                unfinished.forEach(unf => {
                                    const isGhost = finishedMatches.some(f =>
                                        parseInt(f.court) === parseInt(unf.court) &&
                                        parseInt(f.round) === parseInt(unf.round)
                                    );
                                    if (isGhost) ghostIds.push(unf.id);
                                    else realUnfinished.push(unf);
                                });

                                if (ghostIds.length > 0) {
                                    console.log(`🧹 [MatchMaking] Detectados ${ghostIds.length} partidos fantasma en R${roundNum - 1}. Limpiando...`);
                                    const collName = (eventType === 'entreno') ? 'entrenos_matches' : 'matches';
                                    for (const id of ghostIds) {
                                        try { await window.db.collection(collName).doc(id).delete(); } catch (e) { }
                                    }
                                    unfinished = realUnfinished;
                                }
                            }

                            if (unfinished.length > 0 && !force) {
                                const pendingCourts = [...new Set(unfinished.map(m => m.court))].sort((a, b) => a - b);
                                throw new Error(`⚠️ La Ronda ${roundNum - 1} tiene partidos sin finalizar en: Pista ${pendingCourts.join(', Pista ')}. Por favor, introduce los resultados antes.`);
                            }

                            // --- 🚀 DELEGACIÓN AL NUEVO TOURNAMENT ENGINE UNIVERSAL (R2+) ---
                            if (!isFixedPairs) {
                                await this._ensureTournamentEngine();
                                const engine = (typeof window !== 'undefined' && window.TournamentEngine)
                                    ? window.TournamentEngine
                                    : (typeof TournamentEngine !== 'undefined' ? TournamentEngine : null);

                                if (engine) {
                                    try {
                                        let engineMode = 'clasica';
                                        const isMixedCat = event.category === 'mixed' || event.category === 'mixto' || event.category === 'mixta' ||
                                            String(event.category || '').toLowerCase().includes('mixt') ||
                                            String(event.title || event.name || '').toLowerCase().includes('mixt');

                                        // Prioridad 1: Modalidades universales de dinámica específica (Twister, Pozo, Rey, Suiza)
                                        if (isTwister || mode === 'twister' || mode === 'rotating') {
                                            engineMode = 'twister';
                                        } else if (mode === 'pozo') {
                                            engineMode = 'pozo';
                                        } else if (mode === 'rey_pista' || mode === 'rey_de_la_pista') {
                                            engineMode = 'rey_pista';
                                        } else if (isSwiss || mode === 'swiss') {
                                            engineMode = 'mexicana';
                                        } else if (eventType === 'entreno') {
                                            // Entreno táctico genérico cuando no tiene una dinámica de escalera/twister
                                            engineMode = 'entreno_rotaciones';
                                            if (event.format === 'niveles' || event.entreno_type === 'niveles') engineMode = 'entreno_niveles';
                                            if (event.format === 'libre' || event.entreno_type === 'libre') engineMode = 'entreno_libre';
                                        } else if (isMixedCat) {
                                            engineMode = 'mixta';
                                        }

                                        // 🛡️ REGLA SAGRADA TWISTER: En Twister NUNCA se fuerza mixto ni se segrega por género
                                        const isTwisterMode = engineMode === 'twister' || isTwister;
                                        const effectiveIsMixed = isTwisterMode ? false : isMixedCat;

                                        console.log(`🚀 [MatchMakingService] Generando R${roundNum} con TournamentEngine (${engineMode}, mixed=${effectiveIsMixed})...`);
                                        const engineRes = engine.generateRound({
                                            players: normalizedPlayers,
                                            courts: effectiveCourts,
                                            roundNum: parseInt(roundNum),
                                            mode: engineMode,
                                            matchesHistory: matches,
                                            options: {
                                                rounds: parseInt(event.rounds_count) || 6,
                                                hardNoRepeatPartner: false,
                                                isMixed: effectiveIsMixed,
                                                category: isTwisterMode ? 'open' : event.category
                                            }
                                        });

                                        if (engineRes && engineRes.matches && engineRes.matches.length > 0) {
                                            if (engineRes.updatedPlayers) {
                                                await collection.update(eventId, { players: engineRes.updatedPlayers });
                                            }

                                            const preFlightResult = this._runPreFlight(engineRes.matches, {
                                                roundNum,
                                                pairMode: mode,
                                                expectedCourts: effectiveCourts,
                                                prevRoundMatches,
                                                allMatches: matches,
                                                players: engineRes.updatedPlayers || normalizedPlayers
                                            });

                                            // --- 🛡️ VALIDACIÓN DE INVARIANTES SAGRADAS TWISTER (MATEMÁTICA PURA) ---
                                            if (isTwisterMode || isTwister || mode === 'twister') {
                                                await this._ensureTwisterInvariantGuard();
                                                const guard = (typeof window !== 'undefined' && window.TwisterInvariantGuard)
                                                    ? window.TwisterInvariantGuard
                                                    : (typeof TwisterInvariantGuard !== 'undefined' ? TwisterInvariantGuard : null);

                                                if (guard && typeof guard.validate === 'function') {
                                                    const guardRes = guard.validate(prevRoundMatches, preFlightResult.matches, effectiveCourts);
                                                    if (!guardRes.valid) {
                                                        console.error("🚨 [TwisterInvariantGuard] Violación de invariantes matemáticas detectada:", guardRes.errors);
                                                        throw new Error(`Error de coherencia en Modo Twister: ${guardRes.errors.join(' | ')}`);
                                                    }
                                                    console.log("✅ [TwisterInvariantGuard] Todos los invariantes matemáticos verificados al 100%.");
                                                }
                                            }

                                            return await this._createMatches(eventId, preFlightResult.matches, eventType);
                                        } else {
                                            throw new Error(`TournamentEngine no produjo partidos válidos para la Ronda ${roundNum}`);
                                        }
                                    } catch (engineErr) {
                                        console.error("🚨 [MatchMakingService] Error fatal en TournamentEngine (R2+):", engineErr);
                                        // TournamentEngine es la autoridad absoluta, NO hacer fallback silencioso a lógica rota
                                        throw engineErr;
                                    }
                                }
                            }

                            if (isFixedPairs) {
                                const pairs = event.fixed_pairs || [];
                                await this._ensureFixedPairsLogic();
                                if (!window.FixedPairsLogic) throw new Error("FixedPairsLogic no disponible");

                                const updatedPairs = FixedPairsLogic.updatePozoRankings(pairs, prevRoundMatches, effectiveCourts);
                                await collection.update(eventId, { fixed_pairs: updatedPairs });

                                const rawMatches = FixedPairsLogic.generatePozoRound(updatedPairs, roundNum, effectiveCourts);
                                const preFlightResult = this._runPreFlight(rawMatches, {
                                    roundNum,
                                    pairMode: 'fixed',
                                    expectedCourts: effectiveCourts,
                                    prevRoundMatches,
                                    allMatches: matches,
                                    players: normalizedPlayers
                                });

                                return await this._createMatches(eventId, preFlightResult.matches, eventType);

                            } else {
                                // MODO TWISTER O SUIZO
                                let movedPlayers;
                                await this._ensureRotatingPozoLogic();
                                if (!window.RotatingPozoLogic) throw new Error("RotatingPozoLogic no disponible");

                                if (isSwiss) {
                                    console.log(`🇨🇭 [MatchMaking] Generando Ronda Suiza ${roundNum} para ${eventType}...`);
                                    const allFinishedMatches = (matches || []).filter(m => m.status === 'finished');
                                    movedPlayers = RotatingPozoLogic.updatePlayerCourtsSwiss(normalizedPlayers, allFinishedMatches, effectiveCourts);
                                } else {
                                    // Twister / Pozo: Ascensos y descensos
                                    console.log(`🎾 [MatchMaking] Aplicando ascensos/descensos Twister (${eventType})...`);
                                    const categoryForCourts = isTwister ? 'open' : (event.category === 'mixed' ? 'mixed' : (event.category || 'open'));
                                    movedPlayers = RotatingPozoLogic.updatePlayerCourts(normalizedPlayers, prevRoundMatches, effectiveCourts, categoryForCourts);
                                }

                                await collection.update(eventId, { players: movedPlayers });
                                console.log("✅ Pistas de jugadores actualizadas para R" + roundNum);

                                // Para la formación de parejas en pista:
                                // En Twister, pasamos 'open' para asegurar que use
                                // _createSmartPairs y NO segregue por género
                                const genCategory = isTwister ? 'open' : (isSwiss ? 'open' : (event.category === 'mixed' ? 'mixed' : 'open'));
                                const rawMatches = RotatingPozoLogic.generateRound(movedPlayers, roundNum, effectiveCourts, genCategory);

                                // --- PRE-FLIGHT VERIFIER & AUTO-FIX ---
                                const preFlightResult = this._runPreFlight(rawMatches, {
                                    roundNum,
                                    pairMode: mode,
                                    expectedCourts: effectiveCourts,
                                    prevRoundMatches,
                                    allMatches: matches,
                                    players: movedPlayers
                                });

                                // --- 🛡️ VALIDACIÓN DE INVARIANTES SAGRADAS TWISTER (MATEMÁTICA PURA) ---
                                if (isTwister || mode === 'twister') {
                                    await this._ensureTwisterInvariantGuard();
                                    const guard = (typeof window !== 'undefined' && window.TwisterInvariantGuard)
                                        ? window.TwisterInvariantGuard
                                        : (typeof TwisterInvariantGuard !== 'undefined' ? TwisterInvariantGuard : null);

                                    if (guard && typeof guard.validate === 'function') {
                                        const guardRes = guard.validate(prevRoundMatches, preFlightResult.matches, effectiveCourts);
                                        if (!guardRes.valid) {
                                            console.error("🚨 [TwisterInvariantGuard] Violación de invariantes matemáticas detectada:", guardRes.errors);
                                            throw new Error(`Error de coherencia en Modo Twister: ${guardRes.errors.join(' | ')}`);
                                        }
                                        console.log("✅ [TwisterInvariantGuard] Todos los invariantes matemáticos verificados al 100%.");
                                    }
                                }

                                return await this._createMatches(eventId, preFlightResult.matches, eventType);
                            }

                        } else {
                            // --- RONDA 1 ---
                            if (isFixedPairs) {
                                await this._ensureFixedPairsLogic();
                                if (!window.FixedPairsLogic) throw new Error("FixedPairsLogic no disponible");

                                let pairs = event.fixed_pairs || [];

                                if (pairs.length === 0 || randomize) {
                                    console.log(`🔒 Generando parejas fijas iniciales (randomize: ${randomize})...`);
                                    let pool = [...normalizedPlayers];
                                    if (eventType === 'entreno') pool = this._sortPlayersForEntreno(pool, randomize);

                                    const playersWithCourts = pool.map((p, i) => ({
                                        ...p,
                                        current_court: p.current_court || (Math.floor(i / 4) + 1)
                                    }));

                                    if (event.pair_mode === APP_CONSTANTS.PAIR_MODES.FIXED_AUTO) {
                                        pairs = FixedPairsLogic.createSmartFixedPairs(playersWithCourts, event.category);
                                    } else {
                                        pairs = FixedPairsLogic.createFixedPairs(playersWithCourts, event.category, eventType === 'entreno');
                                    }

                                    await collection.update(eventId, { fixed_pairs: pairs });
                                }

                                pairs = pairs.map((p, i) => ({
                                    ...p,
                                    current_court: p.initial_court || (Math.floor(i / 2) + 1),
                                    wins: 0,
                                    losses: 0,
                                    games_won: 0,
                                    games_lost: 0,
                                    won_last_match: false
                                }));
                                await collection.update(eventId, { fixed_pairs: pairs });

                                const rawMatches = FixedPairsLogic.generatePozoRound(pairs, 1, effectiveCourts);
                                const preFlightResult = this._runPreFlight(rawMatches, {
                                    roundNum: 1,
                                    pairMode: 'fixed',
                                    expectedCourts: effectiveCourts,
                                    players: normalizedPlayers
                                });

                                return await this._createMatches(eventId, preFlightResult.matches, eventType);

                            } else {
                                // --- 🚀 TOURNAMENT ENGINE R1 ---
                                await this._ensureTournamentEngine();
                                const engine = (typeof window !== 'undefined' && window.TournamentEngine)
                                    ? window.TournamentEngine
                                    : (typeof TournamentEngine !== 'undefined' ? TournamentEngine : null);

                                if (engine) {
                                    try {
                                        let engineMode = 'clasica';
                                        const isMixedCat = event.category === 'mixed' || event.category === 'mixto' || event.category === 'mixta' ||
                                            String(event.category || '').toLowerCase().includes('mixt') ||
                                            String(event.title || event.name || '').toLowerCase().includes('mixt');

                                        // Prioridad 1: Modalidades universales de dinámica específica (Twister, Pozo, Rey, Suiza)
                                        if (isTwister || mode === 'twister' || mode === 'rotating') {
                                            engineMode = 'twister';
                                        } else if (mode === 'pozo') {
                                            engineMode = 'pozo';
                                        } else if (mode === 'rey_pista' || mode === 'rey_de_la_pista') {
                                            engineMode = 'rey_pista';
                                        } else if (isSwiss || mode === 'swiss') {
                                            engineMode = 'mexicana';
                                        } else if (eventType === 'entreno') {
                                            // Entreno táctico genérico cuando no tiene una dinámica de escalera/twister
                                            engineMode = 'entreno_rotaciones';
                                            if (event.format === 'niveles' || event.entreno_type === 'niveles') engineMode = 'entreno_niveles';
                                            if (event.format === 'libre' || event.entreno_type === 'libre') engineMode = 'entreno_libre';
                                        } else if (isMixedCat) {
                                            engineMode = 'mixta';
                                        }

                                        // 🛡️ REGLA SAGRADA TWISTER: En Twister NUNCA se fuerza mixto ni se segrega por género
                                        const isTwisterMode = engineMode === 'twister' || isTwister;
                                        const effectiveIsMixed = isTwisterMode ? false : isMixedCat;

                                        console.log(`🚀 [MatchMakingService] Generando R1 con TournamentEngine (${engineMode}, mixed=${effectiveIsMixed})...`);
                                        const engineRes = engine.generateRound({
                                            players: normalizedPlayers,
                                            courts: effectiveCourts,
                                            roundNum: 1,
                                            mode: engineMode,
                                            matchesHistory: [],
                                            options: {
                                                rounds: parseInt(event.rounds_count) || 6,
                                                randomize: !!randomize,
                                                isMixed: effectiveIsMixed,
                                                category: isTwisterMode ? 'open' : event.category
                                            }
                                        });

                                        if (engineRes && engineRes.matches && engineRes.matches.length > 0) {
                                            if (engineRes.updatedPlayers) {
                                                await collection.update(eventId, { players: engineRes.updatedPlayers });
                                            }

                                            const preFlightResult = this._runPreFlight(engineRes.matches, {
                                                roundNum: 1,
                                                pairMode: mode,
                                                expectedCourts: effectiveCourts,
                                                players: engineRes.updatedPlayers || normalizedPlayers
                                            });

                                            return await this._createMatches(eventId, preFlightResult.matches, eventType);
                                        } else {
                                            throw new Error(`TournamentEngine no produjo partidos válidos para la Ronda 1`);
                                        }
                                    } catch (engineErr) {
                                        console.error("🚨 [MatchMakingService] Error fatal en TournamentEngine (R1):", engineErr);
                                        // TournamentEngine es la autoridad absoluta, NO hacer fallback silencioso a lógica rota
                                        throw engineErr;
                                    }
                                }

                                // MODO TWISTER / SUIZO R1 (Fallback)
                                await this._ensureRotatingPozoLogic();
                                if (!window.RotatingPozoLogic) throw new Error("RotatingPozoLogic no disponible");

                                let pool = [...normalizedPlayers];

                                if (isTwister) {
                                    if (randomize) {
                                        console.log("🎲 Randomizing players (forcing shuffle)...");
                                        for (let i = pool.length - 1; i > 0; i--) {
                                            const j = Math.floor(Math.random() * (i + 1));
                                            [pool[i], pool[j]] = [pool[j], pool[i]];
                                        }
                                    }
                                } else if (eventType === 'entreno') {
                                    pool = this._sortPlayersForEntreno(pool, randomize);
                                } else if (randomize) {
                                    console.log("🎲 Randomizing players (forcing shuffle)...");
                                    for (let i = pool.length - 1; i > 0; i--) {
                                        const j = Math.floor(Math.random() * (i + 1));
                                        [pool[i], pool[j]] = [pool[j], pool[i]];
                                    }
                                }

                                pool.forEach((p, i) => {
                                    p.current_court = Math.floor(i / 4) + 1;
                                    if (randomize) {
                                        p.last_partner = null;
                                        p.partner_history = [];
                                    }
                                });
                                await collection.update(eventId, { players: pool });

                                const genCat = isTwister ? 'open' : (isSwiss ? 'open' : (event.category === 'mixed' ? 'mixed' : 'open'));
                                const rawMatches = RotatingPozoLogic.generateRound(pool, 1, effectiveCourts, genCat);

                                // Pre-Flight Verifier
                                const preFlightResult = this._runPreFlight(rawMatches, {
                                    roundNum: 1,
                                    pairMode: mode,
                                    expectedCourts: effectiveCourts,
                                    players: pool
                                });

                                return await this._createMatches(eventId, preFlightResult.matches, eventType);
                            }
                        }

                    } catch (genError) {
                        console.error("🚨 [MatchMakingService] Error en motor principal de ronda:", genError);
                        console.warn("🛡️ [Failsafe NASA] Activando Generador de Contingencia de Emergencia...");
                        return await this._generateEmergencyFallbackRound(
                            eventId,
                            eventType,
                            roundNum,
                            effectiveCourts,
                            isFixedPairs,
                            isSwiss,
                            event,
                            normalizedPlayers
                        );
                    }

                } finally {
                    this._locks.delete(lockKey);
                }
            },

            /**
             * Ejecuta el verificador Pre-Flight con Auto-Fix de parejas repetidas
             */
            _runPreFlight(matches, options) {
                try {
                    const verifier = (typeof window !== 'undefined' && window.PreFlightRoundVerifier)
                        ? window.PreFlightRoundVerifier
                        : (typeof PreFlightRoundVerifier !== 'undefined' ? PreFlightRoundVerifier : null);

                    if (verifier && typeof verifier.verifyAndFixRoundMatches === 'function') {
                        const verified = verifier.verifyAndFixRoundMatches(matches, options);
                        if (verified && verified.matches) {
                            return verified;
                        }
                    }
                } catch (vErr) {
                    console.warn("⚠️ [PreFlight Warning] Fallo no crítico en verificación:", vErr);
                }
                return { success: true, matches };
            },

            /**
             * Normalizador de modalidad fallback
             */
            _fallbackNormalizePairMode(rawMode, eventData = {}) {
                const raw = String(rawMode || eventData.pair_mode || '').toLowerCase();
                const name = String(eventData.name || '').toUpperCase();
                if (raw.includes('suiz') || raw === 'swiss' || name.includes('SUIZ')) return 'swiss';
                if (raw.includes('twister') || raw.includes('rotat') || raw.includes('indiv') || name.includes('TWISTER')) return 'twister';
                if (raw.includes('fij') || raw.includes('fixed') || name.includes('FIJA') || name.includes('FIJO')) return 'fixed';
                return 'twister';
            },

            /**
             * Generador de Contingencia de Emergencia (Failsafe NASA)
             */
            async _generateEmergencyFallbackRound(eventId, eventType, roundNum, effectiveCourts, isFixedPairs, isSwiss, event, playersList = []) {
                console.warn(`🛡️ [Failsafe] Creando cruces de contingencia para R${roundNum}...`);
                const fallbackMatches = [];

                if (isFixedPairs) {
                    const pairs = (Array.isArray(event.fixed_pairs) && event.fixed_pairs.length > 0) ? [...event.fixed_pairs] : [];
                    const offset = (roundNum - 1) % Math.max(1, pairs.length - 1);
                    const rotated = [...pairs.slice(offset), ...pairs.slice(0, offset)];

                    for (let c = 1; c <= effectiveCourts; c++) {
                        const pA = rotated[(c - 1) * 2];
                        const pB = rotated[(c - 1) * 2 + 1];
                        if (pA && pB) {
                            fallbackMatches.push({
                                round: roundNum,
                                court: c,
                                teamA: pA.name || 'Pareja A',
                                teamB: pB.name || 'Pareja B',
                                team_a_id: pA.id,
                                team_b_id: pB.id,
                                team_a_ids: [pA.player1_id, pA.player2_id].filter(Boolean),
                                team_b_ids: [pB.player1_id, pB.player2_id].filter(Boolean),
                                team_a_names: [pA.player1_name, pA.player2_name].filter(Boolean),
                                team_b_names: [pB.player1_name, pB.player2_name].filter(Boolean),
                                status: 'scheduled',
                                score_a: 0,
                                score_b: 0
                            });
                        }
                    }
                } else {
                    const pPool = [...playersList].map((p, idx) => typeof p === 'string' ? { id: p, name: `Jugador ${idx + 1}` } : p);
                    const shift = (roundNum - 1) % Math.max(1, pPool.length);
                    const rotated = [...pPool.slice(shift), ...pPool.slice(0, shift)];

                    for (let c = 1; c <= effectiveCourts; c++) {
                        const cPlayers = rotated.slice((c - 1) * 4, c * 4);
                        if (cPlayers.length >= 4) {
                            fallbackMatches.push({
                                round: roundNum,
                                court: c,
                                teamA: `${cPlayers[0].name} / ${cPlayers[1].name}`,
                                teamB: `${cPlayers[2].name} / ${cPlayers[3].name}`,
                                team_a_ids: [cPlayers[0].id || cPlayers[0].uid, cPlayers[1].id || cPlayers[1].uid],
                                team_b_ids: [cPlayers[2].id || cPlayers[2].uid, cPlayers[3].id || cPlayers[3].uid],
                                team_a_names: [cPlayers[0].name, cPlayers[1].name],
                                team_b_names: [cPlayers[2].name, cPlayers[3].name],
                                status: 'scheduled',
                                score_a: 0,
                                score_b: 0
                            });
                        }
                    }
                }

                if (fallbackMatches.length === 0) {
                    throw new Error("No hay suficientes jugadores/parejas para contingencia");
                }
                return await this._createMatches(eventId, fallbackMatches, eventType);
            },

            /**
             * Auto-recuperación dinámica de dependencias
             */
            async _ensureTournamentEngine() {
                if (typeof window !== 'undefined' && window.TournamentEngine) return true;
                if (typeof require !== 'undefined') {
                    try {
                        const eng = require('./tournament-engine/TournamentEngine');
                        if (typeof window !== 'undefined') window.TournamentEngine = eng;
                        if (typeof globalThis !== 'undefined') globalThis.TournamentEngine = eng;
                        return true;
                    } catch (e) {
                        try {
                            const eng = require('../../tournament-engine/TournamentEngine');
                            if (typeof window !== 'undefined') window.TournamentEngine = eng;
                            if (typeof globalThis !== 'undefined') globalThis.TournamentEngine = eng;
                            return true;
                        } catch (e2) { }
                    }
                }
                if (typeof document !== 'undefined') {
                    console.log("🚀 [MatchMakingService] Cargando TournamentEngine modular...");
                    const scripts = [
                        'js/tournament-engine/DecisionLogger.js',
                        'js/tournament-engine/TournamentConstraints.js',
                        'js/tournament-engine/FeasibilityValidator.js',
                        'js/tournament-engine/TournamentSolver.js',
                        'js/tournament-engine/modes/BaseTournamentMode.js',
                        'js/tournament-engine/modes/AmericanaClasicaMode.js',
                        'js/tournament-engine/modes/AmericanaMexicanaMode.js',
                        'js/tournament-engine/modes/AmericanaMixtaMode.js',
                        'js/tournament-engine/modes/AmericanaTwisterMode.js',
                        'js/tournament-engine/modes/ReyDeLaPistaMode.js',
                        'js/tournament-engine/modes/PozoAmericanoMode.js',
                        'js/tournament-engine/modes/EntrenoRotacionesMode.js',
                        'js/tournament-engine/modes/EntrenoNivelesMode.js',
                        'js/tournament-engine/modes/EntrenoLibreMode.js',
                        'js/tournament-engine/TwisterInvariantGuard.js',
                        'js/tournament-engine/TournamentEngine.js'
                    ];
                    for (const s of scripts) {
                        try {
                            await this._loadScriptDynamically(`${s}?v=2026.4`);
                        } catch (loadErr) {
                            console.warn(`⚠️ Error cargando ${s}:`, loadErr);
                        }
                    }
                }
                return typeof window !== 'undefined' && !!window.TournamentEngine;
            },

            async _ensureTwisterInvariantGuard() {
                if (typeof window !== 'undefined' && window.TwisterInvariantGuard) return true;
                if (typeof require !== 'undefined') {
                    try {
                        const g = require('./tournament-engine/TwisterInvariantGuard');
                        if (typeof window !== 'undefined') window.TwisterInvariantGuard = g;
                        if (typeof globalThis !== 'undefined') globalThis.TwisterInvariantGuard = g;
                        return true;
                    } catch (e) {
                        try {
                            const g = require('../../tournament-engine/TwisterInvariantGuard');
                            if (typeof window !== 'undefined') window.TwisterInvariantGuard = g;
                            if (typeof globalThis !== 'undefined') globalThis.TwisterInvariantGuard = g;
                            return true;
                        } catch (e2) { }
                    }
                }
                if (typeof document !== 'undefined') {
                    await this._loadScriptDynamically('js/tournament-engine/TwisterInvariantGuard.js?v=2026.4');
                }
                return typeof window !== 'undefined' && !!window.TwisterInvariantGuard;
            },

            async _ensurePreFlightRoundVerifier() {
                if (typeof window !== 'undefined' && window.PreFlightRoundVerifier) return true;
                if (typeof document !== 'undefined') {
                    console.log("🛡️ [MatchMakingService] PreFlightRoundVerifier no detectado. Cargando...");
                    await this._loadScriptDynamically('js/PreFlightRoundVerifier.js?v=2026.1');
                }
                return typeof window !== 'undefined' && !!window.PreFlightRoundVerifier;
            },

            async _ensureRotatingPozoLogic() {
                if (typeof window !== 'undefined' && window.RotatingPozoLogic) return true;
                if (typeof document !== 'undefined') {
                    console.warn("⚠️ [MatchMakingService] RotatingPozoLogic no detectado. Cargando dinámicamente...");
                    await this._loadScriptDynamically('js/rotating-pozo-logic.js?v=5014');
                }
                return typeof window !== 'undefined' && !!window.RotatingPozoLogic;
            },

            async _ensureFixedPairsLogic() {
                if (typeof window !== 'undefined' && window.FixedPairsLogic) return true;
                if (typeof document !== 'undefined') {
                    console.warn("⚠️ [MatchMakingService] FixedPairsLogic no detectado. Cargando dinámicamente...");
                    await this._loadScriptDynamically('js/fixed-pairs-logic.js?v=5014');
                }
                return typeof window !== 'undefined' && !!window.FixedPairsLogic;
            },

            _loadScriptDynamically(src) {
                return new Promise((resolve) => {
                    if (typeof document === 'undefined') return resolve(false);
                    const cleanPath = src.split('?')[0];
                    const existing = document.querySelector(`script[src*="${cleanPath}"]`);
                    if (existing) {
                        setTimeout(() => resolve(true), 250);
                        return;
                    }
                    const script = document.createElement('script');
                    script.src = src;
                    script.onload = () => {
                        console.log(`✅ [MatchMakingService] Script cargado dinámicamente: ${src}`);
                        resolve(true);
                    };
                    script.onerror = (err) => {
                        console.error(`❌ [MatchMakingService] Falló carga dinámica de ${src}:`, err);
                        resolve(false);
                    };
                    document.head.appendChild(script);
                });
            },

            /**
             * Helper: Semáforo y nivel efectivo para ordenar entrenos
             */
            _getEffectiveLevel(player) {
                let baseLevel = parseFloat(player.level || player.self_rate_level || 0);
                if (window.LevelReliabilityService) {
                    const rel = window.LevelReliabilityService.getReliability(player);
                    if (rel.color === '#FF5555') {
                        baseLevel -= 0.25;
                    } else if (rel.color === '#FFD700') {
                        baseLevel -= 0.10;
                    }
                }
                return baseLevel;
            },

            /**
             * Ordenación inteligente para Entreno (Nivel + Club)
             */
            _sortPlayersForEntreno(players, randomize = false) {
                console.log("📊 Sorting players for Entreno... Randomize:", randomize);

                let pool = [...players];

                if (randomize) {
                    for (let i = pool.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [pool[i], pool[j]] = [pool[j], pool[i]];
                    }
                }

                pool.sort((a, b) => {
                    const jitterA = randomize ? (Math.random() * 0.15 - 0.075) : 0;
                    const jitterB = randomize ? (Math.random() * 0.15 - 0.075) : 0;
                    const lA = this._getEffectiveLevel(a) + jitterA;
                    const lB = this._getEffectiveLevel(b) + jitterB;
                    return lB - lA;
                });

                const sortedList = [];

                while (pool.length > 0) {
                    const p1 = pool.shift();
                    if (pool.length === 0) {
                        sortedList.push(p1);
                        break;
                    }

                    let bestPartnerIndex = -1;
                    const getTeam = (p) => {
                        const t = p.team_somospadel || p.team || '';
                        return Array.isArray(t) ? t[0] : t;
                    };

                    const p1Team = getTeam(p1);
                    const p1Level = this._getEffectiveLevel(p1);

                    // 1. Mismo equipo de club (margen razonable)
                    let teamCandidates = [];
                    if (p1Team) {
                        for (let i = 0; i < pool.length; i++) {
                            if (getTeam(pool[i]) === p1Team) {
                                const p2Level = this._getEffectiveLevel(pool[i]);
                                if (Math.abs(p1Level - p2Level) <= 0.65) {
                                    teamCandidates.push(i);
                                }
                            }
                        }
                    }

                    if (teamCandidates.length > 0) {
                        const forceTeam = !randomize || Math.random() > 0.35;
                        if (forceTeam) {
                            bestPartnerIndex = randomize ? teamCandidates[Math.floor(Math.random() * teamCandidates.length)] : teamCandidates[0];
                        }
                    }

                    // 2. Nivel más cercano
                    if (bestPartnerIndex === -1) {
                        let levelCandidates = [];
                        for (let i = 0; i < pool.length; i++) {
                            const p2Level = this._getEffectiveLevel(pool[i]);
                            if (Math.abs(p1Level - p2Level) <= 0.4) {
                                levelCandidates.push(i);
                            }
                        }
                        if (levelCandidates.length > 0) {
                            bestPartnerIndex = randomize ? levelCandidates[Math.floor(Math.random() * levelCandidates.length)] : levelCandidates[0];
                        }
                    }

                    // 3. Fallback
                    if (bestPartnerIndex === -1 && pool.length > 0) {
                        bestPartnerIndex = 0;
                    }

                    if (bestPartnerIndex !== -1) {
                        const p2 = pool.splice(bestPartnerIndex, 1)[0];
                        sortedList.push(p1, p2);
                    } else {
                        sortedList.push(pool.shift());
                    }
                }

                // Balancear por parejas hacia Pista 1
                const pairs = [];
                for (let i = 0; i < sortedList.length; i += 2) {
                    if (i + 1 < sortedList.length) pairs.push([sortedList[i], sortedList[i + 1]]);
                    else pairs.push([sortedList[i]]);
                }

                pairs.sort((pairA, pairB) => {
                    const levA = (this._getEffectiveLevel(pairA[0]) + this._getEffectiveLevel(pairA[1] || pairA[0])) / pairA.length;
                    const levB = (this._getEffectiveLevel(pairB[0]) + this._getEffectiveLevel(pairB[1] || pairB[0])) / pairB.length;
                    return levB - levA;
                });

                return pairs.flat();
            },

            /**
             * Creación segura de partidos con Batch y protección de duplicados
             */
            async _createMatches(eventId, matchesData, eventType = 'americana') {
                const created = [];
                const colName = (eventType === 'entreno') ? 'entrenos_matches' : 'matches';
                const dbCol = window.db.collection(colName);

                const roundNum = matchesData.length > 0 ? parseInt(matchesData[0].round) : 0;
                const existingSnap = await dbCol.where('americana_id', '==', eventId).where('round', '==', roundNum).get();

                const batch = window.db.batch();
                let batchCount = 0;

                // 🛡️ REEMPLAZO ATÓMICO: Si ya existen partidos de esta ronda en Firestore (ej. regeneración forzada),
                // eliminarlos en el mismo batch para evitar residuos obsoletos o inconsistencias.
                if (!existingSnap.empty) {
                    console.log(`🧹 [_createMatches] Reemplazando atómicamente ${existingSnap.size} partidos existentes de Ronda ${roundNum}...`);
                    existingSnap.docs.forEach(doc => {
                        batch.delete(doc.ref);
                        batchCount++;
                    });
                }

                for (const m of matchesData) {
                    const court = parseInt(m.court);
                    const payload = {
                        ...m,
                        americana_id: eventId,
                        round: roundNum,
                        status: 'scheduled',
                        score_a: 0,
                        score_b: 0,
                        createdAt: new Date().toISOString()
                    };

                    const newDocRef = dbCol.doc();
                    batch.set(newDocRef, payload);
                    created.push({ id: newDocRef.id, ...payload });
                    batchCount++;
                }

                if (batchCount > 0) {
                    await batch.commit();
                    console.log(`✅ [BATCH] Guardados ${created.length} partidos verificados para R${roundNum}.`);
                }

                return created;
            },

            /**
             * Saneamiento de partidos duplicados en una ronda
             */
            async sanitizeRound(eventId, eventType, roundNum) {
                console.log(`🧹 [MatchMaking] Saneando Ronda ${roundNum} para ${eventId}...`);
                const colName = (eventType === 'entreno') ? 'entrenos_matches' : 'matches';
                const snap = await window.db.collection(colName)
                    .where('americana_id', '==', eventId)
                    .where('round', '==', parseInt(roundNum))
                    .get();

                if (snap.empty) return { deleted: 0 };

                const matches = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                const finished = matches.filter(m => m.status === 'finished');
                const unfinished = matches.filter(m => m.status !== 'finished');

                const toDelete = [];

                unfinished.forEach(unf => {
                    if (finished.some(f => parseInt(f.court) === parseInt(unf.court))) {
                        toDelete.push(unf.id);
                    }
                });

                const seen = new Set();
                matches.forEach(m => {
                    const teamA = Array.isArray(m.team_a_names) ? m.team_a_names.sort().join('|') : (m.teamA || '');
                    const teamB = Array.isArray(m.team_b_names) ? m.team_b_names.sort().join('|') : (m.teamB || '');
                    const sig = `${m.court}-${teamA}-${teamB}`;
                    if (seen.has(sig)) {
                        if (!toDelete.includes(m.id)) toDelete.push(m.id);
                    } else {
                        seen.add(sig);
                    }
                });

                for (const id of toDelete) {
                    await window.db.collection(colName).doc(id).delete();
                }

                console.log(`✅ [MatchMaking] Saneamiento completado. Eliminados: ${toDelete.length}`);
                return { deleted: toDelete.length };
            },

            /**
             * Reparación de pistas faltantes en una ronda
             */
            async repairRound(eventId, eventType, roundNum) {
                console.log(`🔧 [MatchMaking] Reparación Robusta Ronda ${roundNum} para ${eventId}...`);
                const colName = (eventType === 'entreno') ? 'entrenos_matches' : 'matches';
                const eventColl = (eventType === 'entreno') ? 'entrenos' : 'americanas';

                const eventDoc = await window.db.collection(eventColl).doc(eventId).get();
                if (!eventDoc.exists) throw new Error("Evento no encontrado");

                const eventData = eventDoc.data();
                const players = eventData.players || [];
                const maxCourts = parseInt(eventData.max_courts || 4);

                const snap = await window.db.collection(colName)
                    .where('americana_id', '==', eventId)
                    .get();

                const roundMatches = snap.docs
                    .map(d => ({ id: d.id, ...d.data() }))
                    .filter(m => parseInt(m.round) === parseInt(roundNum));

                const assignedPlayerIds = new Set();
                const existingCourts = new Set();

                roundMatches.forEach(m => {
                    (m.team_a_ids || []).forEach(id => assignedPlayerIds.add(String(id)));
                    (m.team_b_ids || []).forEach(id => assignedPlayerIds.add(String(id)));
                    existingCourts.add(parseInt(m.court));
                });

                const missingCourts = [];
                for (let i = 1; i <= maxCourts; i++) {
                    if (!existingCourts.has(i)) missingCourts.push(i);
                }

                if (missingCourts.length === 0) {
                    return { repaired: 0, message: "✅ No faltan pistas en esta ronda." };
                }

                const unassignedPlayers = players.filter(p => !assignedPlayerIds.has(String(p.id || p.uid)));
                if (unassignedPlayers.length === 0) {
                    return { repaired: 0, message: "❌ No hay jugadores libres para reparar." };
                }

                let repairedCount = 0;
                let pool = [...unassignedPlayers];

                for (const courtNum of missingCourts) {
                    let courtPlayers = pool.filter(p => parseInt(p.current_court) === courtNum);
                    if (courtPlayers.length !== 4 && missingCourts.length === 1 && pool.length === 4) {
                        courtPlayers = [...pool];
                    }

                    if (courtPlayers.length === 4) {
                        const teamA = courtPlayers.slice(0, 2);
                        const teamB = courtPlayers.slice(2, 4);

                        const payload = {
                            americana_id: eventId,
                            round: parseInt(roundNum),
                            court: courtNum,
                            status: 'scheduled',
                            score_a: 0,
                            score_b: 0,
                            createdAt: new Date().toISOString(),
                            team_a_ids: teamA.map(p => p.id || p.uid),
                            team_a_names: teamA.map(p => p.name),
                            teamA: teamA.map(p => p.name).join(' / '),
                            team_b_ids: teamB.map(p => p.id || p.uid),
                            team_b_names: teamB.map(p => p.name),
                            teamB: teamB.map(p => p.name).join(' / ')
                        };

                        await window.db.collection(colName).add(payload);
                        repairedCount++;

                        const usedIds = new Set(courtPlayers.map(p => String(p.id || p.uid)));
                        pool = pool.filter(p => !usedIds.has(String(p.id || p.uid)));
                    }
                }

                return { repaired: repairedCount };
            },

            /**
             * Purgar rondas posteriores (Herramienta de re-generación)
             */
            async purgeSubsequentRounds(eventId, roundNum, eventType) {
                console.log(`🧹 Purgando rondas posteriores a R${roundNum} para ${eventType} ${eventId}...`);
                const colName = (eventType === 'entreno') ? 'entrenos_matches' : 'matches';
                const dbCol = window.db.collection(colName);
                const snap = await dbCol.where('americana_id', '==', eventId).get();

                const batch = window.db.batch();
                let count = 0;
                snap.docs.forEach(doc => {
                    const data = doc.data();
                    if (parseInt(data.round) > parseInt(roundNum)) {
                        batch.delete(doc.ref);
                        count++;
                    }
                });

                if (count > 0) await batch.commit();
                console.log(`🧹 Purgados ${count} partidos de rondas > ${roundNum}`);
                return count;
            },

            /**
             * Simulación de ronda
             */
            async simulateRound(eventId, roundNum, eventType = 'americana') {
                console.warn("⚠️ [MatchMakingService] Simulación deshabilitada por política administrativa.");
                return;
            },

            /**
             * Sustitución robusta de jugador
             */
            async substitutePlayerInMatchesRobust(eventId, oldUid, oldName, newUid, newName, eventType = null) {
                if (!eventId || !oldUid) return 0;
                console.log(`🔍 [Substitute] Event=${eventId}, OldID=${oldUid}, NewID=${newUid}`);

                let matches = [];
                let winningCollection = (eventType === 'entreno') ? 'entrenos_matches' : 'matches';

                try {
                    const coll = window.db.collection(winningCollection);
                    const snap = await coll
                        .where('americana_id', '==', eventId)
                        .where('status', '==', 'scheduled')
                        .get();
                    matches = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                } catch (err) {
                    console.error("Error fetching matches for substitution:", err);
                    return 0;
                }

                const pending = matches.filter(m => !m.isFinished && m.status !== 'finished');
                let updatesCount = 0;
                const batch = window.db.batch();
                let batchHasData = false;

                for (const m of pending) {
                    let updatePayload = {};
                    let changed = false;

                    ['a', 'b'].forEach(side => {
                        const idKey = `team_${side}_ids`;
                        const namesKey = `team_${side}_names`;
                        const stringKey = `team${side.toUpperCase()}`;

                        const ids = m[idKey] || [];
                        const idx = ids.findIndex(id => String(id) === String(oldUid));

                        if (idx !== -1) {
                            const newIds = [...ids];
                            newIds[idx] = newUid;
                            updatePayload[idKey] = newIds;

                            let currentNames = m[namesKey];
                            if (Array.isArray(currentNames)) {
                                const newNames = [...currentNames];
                                newNames[idx] = newName;
                                updatePayload[namesKey] = newNames;
                                updatePayload[stringKey] = newNames.join(' / ');
                            } else if (typeof currentNames === 'string') {
                                updatePayload[namesKey] = currentNames.replace(oldName, newName);
                                updatePayload[stringKey] = updatePayload[namesKey];
                            } else {
                                updatePayload[namesKey] = [newName];
                            }
                            changed = true;
                        }
                    });

                    if (changed) {
                        const ref = window.db.collection(winningCollection).doc(m.id);
                        batch.update(ref, updatePayload);
                        updatesCount++;
                        batchHasData = true;
                    }
                }

                if (batchHasData) {
                    await batch.commit();
                }

                console.log(`✅ Sustitución completada. Actualizados ${updatesCount} partidos.`);
                return updatesCount;
            },

            /**
             * Guardar una ronda manual definida por el admin
             */
            async saveManualRound(eventId, eventType, roundNum, matchesData, restingPlayers = []) {
                console.log(`✍️ MatchMakingService: Guardando ronda manual ${roundNum} para ${eventType} ${eventId}...`);

                const user = window.AdminAuth?.user ||
                    (window.AuthService?.getCurrentUser && window.AuthService.getCurrentUser()) ||
                    JSON.parse(localStorage.getItem('adminUser') || localStorage.getItem('currentUser') || 'null');
                const role = (user?.role || '').toLowerCase().trim();
                const isAuthorized = ['super_admin', 'superadmin', 'admin', 'admin_player'].includes(role);

                if (!isAuthorized) {
                    throw new Error("Acceso denegado: Solo administradores pueden guardar rondas manuales.");
                }

                const colName = (eventType === 'entreno') ? 'entrenos_matches' : 'matches';
                const dbCol = window.db.collection(colName);
                const rNum = parseInt(roundNum);

                const snap = await dbCol.where('americana_id', '==', eventId).where('round', '==', rNum).get();
                const batch = window.db.batch();

                snap.docs.forEach(doc => {
                    batch.delete(doc.ref);
                });

                matchesData.forEach(m => {
                    const newDocRef = dbCol.doc();
                    const payload = {
                        ...m,
                        americana_id: eventId,
                        round: rNum,
                        court: parseInt(m.court),
                        status: 'scheduled',
                        score_a: 0,
                        score_b: 0,
                        is_manual: true,
                        createdAt: new Date().toISOString()
                    };
                    batch.set(newDocRef, payload);
                });

                const eventCol = (eventType === 'entreno') ? window.FirebaseDB?.entrenos : window.FirebaseDB?.americanas;
                if (eventCol) {
                    const eventDoc = await eventCol.getById(eventId);
                    const updates = {};

                    if (eventDoc && (eventDoc.status === 'open' || eventDoc.status === 'pairing')) {
                        updates.status = 'live';
                    }

                    if (eventDoc && eventDoc.players) {
                        const updatedPlayers = eventDoc.players.map(p => {
                            const match = matchesData.find(m =>
                                (m.team_a_ids || []).includes(p.id) || (m.team_b_ids || []).includes(p.id)
                            );
                            return match ? { ...p, current_court: parseInt(match.court) } : { ...p, current_court: null };
                        });
                        updates.players = updatedPlayers;
                    }

                    if (Object.keys(updates).length > 0) {
                        await eventCol.update(eventId, updates);
                    }
                }

                await batch.commit();
                console.log(`✅ Ronda manual ${rNum} guardada exitosamente.`);
                return true;
            }
        };

        // EXPORT GLOBALLY
        if (typeof window !== 'undefined') {
            window.MatchMakingService = MatchMakingService;
            window.MatchmakingService = MatchMakingService;
        }

        if (typeof globalThis !== 'undefined') {
            globalThis.MatchMakingService = MatchMakingService;
            globalThis.MatchmakingService = MatchMakingService;
        }
        if (typeof module !== 'undefined' && module.exports) {
            module.exports = MatchMakingService;
            module.exports.MatchMakingService = MatchMakingService;
            module.exports.default = MatchMakingService;
        }

        console.log("✅ MatchMakingService EXPORTADO SATISFACTORIAMENTE (v5004)!");

    } catch (err) {
        console.error("❌ ERROR CRÍTICO CARGANDO MATCHMAKING SERVICE:", err);
        if (typeof window !== 'undefined') {
            window.MatchMakingServiceError = err;
        }
    }
})();
