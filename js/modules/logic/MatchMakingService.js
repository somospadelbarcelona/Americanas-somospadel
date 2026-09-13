/**
 * MatchMakingService.js
 * Coordinador de lógica de emparejamientos.
 * Abstrae la complejidad de llamar a FixedPairsLogic o RotatingPozoLogic.
 * v5003 - Robust Rewrite + Mutex Locks
 */

console.log("🎲 LOADING MATCHMAKING SERVICE v5003...");

(function () {
    try {
        const MatchMakingService = {

            _locks: new Set(),

            /**
             * Generar partidos para una ronda específica.
             * Maneja automáticamente la lógica de "Smart Courts" (ampliar pistas si hay más gente).
             */
            async generateRound(eventId, eventType, roundNum) {
                // --- 🛡️ BÚNKER CLOUD DELEGATION (NIVEL NASA) ---
                if (window.firebase && typeof firebase.functions === 'function') {
                    try {
                        const secureGen = firebase.app().functions('us-central1').httpsCallable('secureGenerateRound');
                        console.log("🔒 [Security Búnker] Solicitando cálculo seguro de ronda al servidor...");
                        const response = await secureGen({ eventId, eventType, roundNum });
                        if (response && response.data && response.data.success) {
                            console.log("✅ [Security Búnker] Ronda calculada en servidor:", response.data);
                            return response.data.matches;
                        }
                    } catch (cloudErr) {
                        console.warn("ℹ️ [Security Búnker Fallback] Delegando a cálculo local:", cloudErr.message);
                    }
                }

                // Ensure dependencies exist
                if (typeof window.FirebaseDB === 'undefined') throw new Error("FirebaseDB not loaded");

                // Get AppConstants safely
                const APP_CONSTANTS = window.AppConstants || { EVENT_TYPES: { AMERICANA: 'americana' }, PAIR_MODES: { FIXED: 'fixed' } };

                const collection = eventType === APP_CONSTANTS.EVENT_TYPES.AMERICANA ? FirebaseDB.americanas : FirebaseDB.entrenos;
                const event = await collection.getById(eventId);

                if (!event) throw new Error("Event not found");

                const maxRounds = parseInt(event.rounds_count) || 6;
                if (roundNum > maxRounds) {
                    throw new Error(`Límite de ${maxRounds} rondas alcanzado. No se pueden generar más.`);
                }

                // --- MUTEX LOCK (Prevent Double-Click Race Conditions) ---
                const lockKey = `${eventId}_R${roundNum}`;

                if (this._locks.has(lockKey)) {
                    console.warn(`🔒 [MatchMaking] Race condition prevented. Generation for ${lockKey} already in progress.`);
                    throw new Error("⏳ La ronda se está generando, por favor espera un momento...");
                }

                this._locks.add(lockKey);

                try {
                    // Determine Mode
                    const M = APP_CONSTANTS.PAIR_MODES;
                    const isFixedPairs = event.pair_mode === M.FIXED || event.pair_mode === M.FIXED_ADMIN || event.pair_mode === M.FIXED_AUTO;

                    // --- CRITICAL IDEMPOTENCY CHECK (DB Level) ---
                    const checkColl = (eventType === 'entreno') ? 'entrenos_matches' : 'matches';
                    const existingSnap = await window.db.collection(checkColl)
                        .where('americana_id', '==', eventId)
                        .where('round', '==', roundNum)
                        .get();

                    if (!existingSnap.empty) {
                        const existingRoundMatches = existingSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        console.warn(`🛑 BLOQUEO DE DUPLICADOS: Ya existen ${existingRoundMatches.length} partidos en Ronda ${roundNum}. Se devuelven los existentes.`);
                        return existingRoundMatches;
                    }

                    // --- SMART SCALING LOGIC (DISABLED AUTO-UPGRADE) ---
                    let effectiveCourts = parseInt(event.max_courts || 4);
                    
                    /* 
                       ⚠️ [Audit Fix] Disabled automatic court scaling. 
                       Users reported courts duplicating unexpectedly (e.g. going from 3 to 6).
                       We keep 'effectiveCourts' anchored to what the Admin defined.
                    */
                    const playersCount = (event.players || []).length;
                    const maxPossibleCourts = Math.floor(playersCount / 4);

                    // CAP: Never exceed player capacity, but also don't auto-grow
                    if (effectiveCourts > maxPossibleCourts) {
                        console.log(`⚠️ AI Scaling CAP: Reducing from ${effectiveCourts} to ${maxPossibleCourts} (Player Limit)`);
                        effectiveCourts = maxPossibleCourts;
                        await collection.update(eventId, { max_courts: effectiveCourts });
                        event.max_courts = effectiveCourts;
                    }

                    // --- GENERATION LOGIC ---

                    // Check Previous Round (if not R1)
                    if (roundNum > 1) {
                        const matchesCollection = (eventType === 'entreno') ? FirebaseDB.entrenos_matches : FirebaseDB.matches;
                        const matches = await matchesCollection.getByAmericana(eventId);

                        const prevRoundMatches = matches.filter(m => parseInt(m.round) === (roundNum - 1));

                        // 🛡️ [DIAGNOSTIC & SELF-HEALING]
                        const finishedMatches = prevRoundMatches.filter(m => m.status === 'finished');
                        let unfinished = prevRoundMatches.filter(m => m.status !== 'finished');

                        if (unfinished.length > 0) {
                            // Check for "Ghost Duplicates": If an unfinished match has a finished counterpart on the same court/round, it's a ghost from a previous bug.
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
                                console.log(`🧹 [MatchMaking] Detectados ${ghostIds.length} partidos fantasma duplicados en R${roundNum-1}. Limpiando...`);
                                const collName = (eventType === 'entreno') ? 'entrenos_matches' : 'matches';
                                for (const id of ghostIds) {
                                    try { await window.db.collection(collName).doc(id).delete(); } catch(e) {}
                                }
                                unfinished = realUnfinished;
                            }
                        }

                        if (unfinished.length > 0) {
                            const pendingCourts = [...new Set(unfinished.map(m => m.court))].sort((a,b) => a-b);
                            throw new Error(`⚠️ La Ronda ${roundNum - 1} tiene partidos sin finalizar en: Pista ${pendingCourts.join(', Pista ')}. Por favor, introduce los resultados.`);
                        }

                        if (roundNum === 3) {
                            console.log(`🌀 [MatchMaking] Iniciando generación de Ronda 3 para ${eventType}. Verificando rotación...`);
                        }

                        if (isFixedPairs) {
                            const pairs = event.fixed_pairs || [];
                            if (!window.FixedPairsLogic) throw new Error("FixedPairsLogic not loaded");
                            const updatedPairs = FixedPairsLogic.updatePozoRankings(pairs, prevRoundMatches, effectiveCourts);
                            await collection.update(eventId, { fixed_pairs: updatedPairs });
                            return await this._createMatches(eventId, FixedPairsLogic.generatePozoRound(updatedPairs, roundNum, effectiveCourts), eventType);
                        } else {
                            const players = event.players || [];
                            let movedPlayers;
                            if (!window.RotatingPozoLogic) throw new Error("RotatingPozoLogic not loaded");

                            if (eventType === 'entreno') {
                                movedPlayers = RotatingPozoLogic.updatePlayerCourts(players, prevRoundMatches, effectiveCourts, 'open');
                            } else {
                                movedPlayers = RotatingPozoLogic.updatePlayerCourts(players, prevRoundMatches, effectiveCourts, event.category);
                            }
                            await collection.update(eventId, { players: movedPlayers });
                            const genCategory = eventType === 'entreno' ? 'entreno' : event.category;
                            return await this._createMatches(eventId, RotatingPozoLogic.generateRound(movedPlayers, roundNum, effectiveCourts, genCategory), eventType);
                        }

                    } else {
                        // Round 1 Generation
                        if (isFixedPairs) {
                            if (!window.FixedPairsLogic) throw new Error("FixedPairsLogic not loaded");
                            let pairs = event.fixed_pairs || [];

                            if (pairs.length === 0) {
                                console.log(`🔒 Pair generation for mode: ${event.pair_mode}`);
                                let players = event.players || [];
                                if (eventType === 'entreno') players = this._sortPlayersForEntreno(players);

                                const playersWithCourts = players.map((p, i) => ({
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
                            return await this._createMatches(eventId, FixedPairsLogic.generatePozoRound(pairs, 1, effectiveCourts), eventType);
                        } else {
                            if (!window.RotatingPozoLogic) throw new Error("RotatingPozoLogic not loaded");
                            let players = event.players || [];
                            if (eventType === 'entreno') players = this._sortPlayersForEntreno(players);

                            players.forEach((p, i) => p.current_court = Math.floor(i / 4) + 1);
                            await collection.update(eventId, { players });

                            return await this._createMatches(eventId, RotatingPozoLogic.generateRound(players, 1, effectiveCourts, event.category), eventType);
                        }
                    }
                } finally {
                    this._locks.delete(lockKey);
                }
            },

            /**
             * Helper: Calculate Effective Level based on Reliability (Semáforo)
             * Penalties: Red (Oxidado) -> -0.25 | Yellow (Dudoso) -> -0.1
             */
            _getEffectiveLevel(player) {
                let baseLevel = parseFloat(player.level || player.self_rate_level || 0);

                // Si existe el servicio de fiabilidad, aplicamos penalización
                if (window.LevelReliabilityService) {
                    const rel = window.LevelReliabilityService.getReliability(player);
                    // Check by color or label since thresholds are internal there
                    if (rel.color === '#FF5555') { // Red / Oxidado
                        console.log(`📉 [MatchMaking] Penalizando a ${player.name} (Oxidado) -0.25`);
                        baseLevel -= 0.25;
                    } else if (rel.color === '#FFD700') { // Yellow / Dudoso
                        console.log(`📉 [MatchMaking] Penalizando a ${player.name} (Dudoso) -0.10`);
                        baseLevel -= 0.10;
                    }
                }
                return baseLevel;
            },

            /**
             * Helper: Sort players by Level (Desc) AND Pre-Pair by Team
             * for "Entreno" seeding.
             */
            _sortPlayersForEntreno(players) {
                console.log("📊 Sorting players with Smart Pairing (Effective Level + Team) for Entreno...");

                // 1. Initial Sort by EFFECTIVE Level Descending
                let pool = [...players].sort((a, b) => {
                    const lA = this._getEffectiveLevel(a);
                    const lB = this._getEffectiveLevel(b);
                    return lB - lA;
                });

                const sortedList = [];

                while (pool.length > 0) {
                    const p1 = pool.shift();
                    if (pool.length === 0) {
                        sortedList.push(p1);
                        break;
                    }

                    // Find best partner
                    let bestPartnerIndex = -1;
                    let bestScore = -Infinity;

                    const getTeam = (p) => {
                        const t = p.team_somospadel || p.team || '';
                        return Array.isArray(t) ? t[0] : t;
                    };

                    const p1Team = getTeam(p1);
                    const p1Level = this._getEffectiveLevel(p1);

                    for (let i = 0; i < pool.length; i++) {
                        const p2 = pool[i];
                        const p2Team = getTeam(p2);
                        const p2Level = this._getEffectiveLevel(p2);

                        let score = 0;
                        const diff = Math.abs(p1Level - p2Level);
                        score -= (diff * 10);

                        if (p1Team && p2Team && p1Team === p2Team) {
                            // PRIORIDAD EQUIPO: Ampliamos margen a 1.5 para asegurar que compañeros jueguen juntos
                            if (diff <= 1.5) score += 150; // Bonus masivo
                            else score += 20; // Bonus pequeño si hay mucha diferencia
                        }

                        if (score > bestScore) {
                            bestScore = score;
                            bestPartnerIndex = i;
                        }
                    }

                    if (bestPartnerIndex !== -1) {
                        const p2 = pool.splice(bestPartnerIndex, 1)[0];
                        sortedList.push(p1, p2);
                    } else {
                        sortedList.push(pool.shift());
                    }
                }
                return sortedList;
            },

            /**
             * Helper to batch create matches
             */
            async _createMatches(eventId, matchesData, eventType = 'americana') {
                const created = [];
                // Check if FirebaseDB.entrenos_matches exists
                let collection = (eventType === 'entreno') ? window.FirebaseDB?.entrenos_matches : window.FirebaseDB?.matches;

                if (!collection) {
                    const colName = (eventType === 'entreno') ? 'entrenos_matches' : 'matches';
                    console.log(`⚠️ MatchMakingService: Wrapper for ${colName} missing. Using raw DB.`);
                    collection = {
                        create: async (data) => {
                            const ref = await window.db.collection(colName).add(data);
                            return { id: ref.id, ...data };
                        }
                    };
                }

                // Helper to remove undefined fields
                const cleanPayload = (obj) => {
                    const cleaned = {};
                    for (const [key, value] of Object.entries(obj)) {
                        if (value !== undefined && value !== null) {
                            if (Array.isArray(value)) {
                                cleaned[key] = value.filter(v => v !== undefined && v !== null);
                            } else {
                                cleaned[key] = value;
                            }
                        }
                    }
                    return cleaned;
                };

                for (const m of matchesData) {
                    // Build base payload with explicit fields
                    const basePayload = {
                        americana_id: eventId,
                        round: parseInt(m.round) || 1,
                        court: parseInt(m.court) || 1,
                        status: 'scheduled',
                        score_a: 0,
                        score_b: 0,
                        createdAt: new Date().toISOString(),
                        team_a_ids: m.team_a_ids || [],
                        team_a_names: m.team_a_names || [],
                        teamA: m.teamA || '',
                        team_b_ids: m.team_b_ids || [],
                        team_b_names: m.team_b_names || [],
                        teamB: m.teamB || ''
                    };

                    // Clean undefined values
                    const payload = cleanPayload(basePayload);

                    try {
                        const result = await collection.create(payload);
                        created.push(result);
                    } catch (err) {
                        console.error(`❌ Error creating match:`, err);
                        console.error('Payload:', payload);
                        throw err;
                    }
                }
                return created;
            },

            /**
             * Simulate a round (Random scores)
             */
            async simulateRound(eventId, roundNum, eventType = 'americana') {
                console.warn("⚠️ [MatchMakingService] SIMULATION DISABLED BY ADMIN POLICY. No results generated.");
                return;
            },

            /**
            * Robust Player Substitution
            */
            async substitutePlayerInMatchesRobust(eventId, oldUid, oldName, newUid, newName, eventType = null) {
                if (!eventId || !oldUid) return 0;

                console.log(`🔍 DEBUG SUBSTITUTE: Event=${eventId}, Type=${eventType}, OldID=${oldUid}, OldName="${oldName}"`);

                let matches = [];
                let winningCollection = (eventType === 'entreno') ? 'entrenos_matches' : 'matches';

                try {
                    const coll = window.db.collection(winningCollection);
                    const snap = await coll
                        .where('americana_id', '==', eventId)
                        .where('status', '==', 'scheduled') // 🛡️ CRITICAL OPTIMIZATION: Only fetch pending matches
                        .get();
                    matches = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                } catch (err) {
                    console.error("Error fetching matches for substitution:", err);
                    return 0;
                }

                const pending = matches.filter(m => !m.isFinished && m.status !== 'finished');
                let updatesCount = 0;

                // 🛡️ [OPTIMIZATION] Use WriteBatch to prevent 429 errors
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
                    try {
                        await batch.commit();
                        console.log(`✅ Batch commit success: Updated ${updatesCount} matches.`);
                    } catch (e) {
                        console.error(`❌ Batch commit failed:`, e);
                        return 0;
                    }
                }

                console.log(`✅ Substitution complete. Updated ${updatesCount} matches in ${winningCollection}.`);
                return updatesCount;
            },

            async purgeSubsequentRounds(eventId, roundNum, eventType) {
                console.log(`🧹 Purging rounds after ${roundNum} for ${eventType} ${eventId}`);
                const collectionName = eventType === 'entreno' ? 'entrenos_matches' : 'matches';

                try {
                    // Fetch ALL matches for this event (only uses americana_id index)
                    const snap = await window.db.collection(collectionName)
                        .where('americana_id', '==', eventId)
                        .get();

                    if (snap.empty) {
                        console.log("No matches found for event");
                        return 0;
                    }

                    // Filter in memory for rounds > roundNum
                    const toDelete = [];
                    snap.docs.forEach(doc => {
                        const data = doc.data();
                        const matchRound = parseInt(data.round) || 1;
                        if (matchRound > roundNum) {
                            toDelete.push(doc.ref);
                        }
                    });

                    if (toDelete.length === 0) {
                        console.log(`No rounds found after R${roundNum}`);
                        return 0;
                    }

                    console.log(`Deleting ${toDelete.length} matches from rounds > ${roundNum}`);

                    // Delete in batches (Firestore limit is 500 per batch)
                    const batchSize = 500;
                    for (let i = 0; i < toDelete.length; i += batchSize) {
                        const batch = window.db.batch();
                        const chunk = toDelete.slice(i, i + batchSize);
                        chunk.forEach(ref => batch.delete(ref));
                        await batch.commit();
                    }

                    console.log(`✅ Purged ${toDelete.length} matches successfully`);
                    return toDelete.length;
                } catch (error) {
                    console.error("Error in purgeSubsequentRounds:", error);
                    throw error;
                }
            },
            /**
             * [NEW] Sanitize Round: Removes duplicate or unfinished matches for a specific round 
             * if finished counterparts exist.
             */
            async sanitizeRound(eventId, eventType, roundNum) {
                console.log(`🧹 [MatchMaking] Saneando Ronda ${roundNum} para ${eventId}...`);
                const collName = (eventType === 'entreno') ? 'entrenos_matches' : 'matches';
                const snap = await window.db.collection(collName)
                    .where('americana_id', '==', eventId)
                    .where('round', '==', parseInt(roundNum))
                    .get();

                if (snap.empty) return { deleted: 0 };

                const matches = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                const finished = matches.filter(m => m.status === 'finished');
                const unfinished = matches.filter(m => m.status !== 'finished');
                
                const toDelete = [];

                // 1. Unfinished matches that have a finished counterpart on the same court
                unfinished.forEach(unf => {
                    if (finished.some(f => parseInt(f.court) === parseInt(unf.court))) {
                        toDelete.push(unf.id);
                    }
                });

                // 2. Exact duplicates (same court, same teams - even if both finished)
                // (Keep the first one found)
                const seen = new Set();
                matches.forEach(m => {
                    const teamA = Array.isArray(m.team_a_names) ? m.team_a_names.sort().join('|') : m.team_a_names;
                    const teamB = Array.isArray(m.team_b_names) ? m.team_b_names.sort().join('|') : m.team_b_names;
                    const sig = `${m.court}-${teamA}-${teamB}`;
                    if (seen.has(sig)) {
                        if (!toDelete.includes(m.id)) toDelete.push(m.id);
                    } else {
                        seen.add(sig);
                    }
                });

                for (const id of toDelete) {
                    await window.db.collection(collName).doc(id).delete();
                }

                console.log(`✅ [MatchMaking] Saneamiento completado. Borrados: ${toDelete.length}`);
                return { deleted: toDelete.length };
            },

            /**
             * [NEW] Repair Round: Detects missing courts in a round and re-creates them using 
             * the unassigned players.
             */
            async repairRound(eventId, eventType, roundNum) {
                console.log(`🔧 [MatchMaking] Reparación Robusta Ronda ${roundNum} para ${eventId}...`);
                const collName = (eventType === 'entreno') ? 'entrenos_matches' : 'matches';
                const eventColl = (eventType === 'entreno') ? 'entrenos' : 'americanas';
                
                const eventDoc = await window.db.collection(eventColl).doc(eventId).get();
                if (!eventDoc.exists) throw new Error("Evento no encontrado");
                
                const eventData = eventDoc.data();
                const players = eventData.players || [];
                const maxCourts = parseInt(eventData.max_courts || 4);

                // --- ROBUST FETCH: Get ALL matches and filter in JS to avoid Number/String mismatch ---
                const snap = await window.db.collection(collName)
                    .where('americana_id', '==', eventId)
                    .get();

                const roundMatches = snap.docs
                    .map(d => ({ id: d.id, ...d.data() }))
                    .filter(m => parseInt(m.round) === parseInt(roundNum));

                console.log(`🔍 Encontrados ${roundMatches.length} partidos existentes en Ronda ${roundNum}`);

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
                    return { repaired: 0, message: "✅ No faltan pistas en esta ronda (todas están presentes)." };
                }

                // Identify unassigned players
                const unassignedPlayers = players.filter(p => !assignedPlayerIds.has(String(p.id || p.uid)));

                if (unassignedPlayers.length === 0) {
                     return { repaired: 0, message: "❌ No hay jugadores libres. ¿Quizás están asignados a pistas duplicadas? Usa 'SANEAR' primero." };
                }

                console.log(`⚠️ Faltan pistas: ${missingCourts.join(', ')}. Jugadores sin asignar: ${unassignedPlayers.length}`);

                let repairedCount = 0;
                let pool = [...unassignedPlayers];

                for (const courtNum of missingCourts) {
                    // Try to find players for THIS court first
                    let courtPlayers = pool.filter(p => parseInt(p.current_court) === courtNum);
                    
                    // FALLBACK: If not exactly 4, but we only have one court missing and 4 players left, just take them
                    if (courtPlayers.length !== 4 && missingCourts.length === 1 && pool.length === 4) {
                        console.log("💡 Fallback: Usando todos los jugadores restantes para la única pista que falta.");
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

                        await window.db.collection(collName).add(payload);
                        repairedCount++;
                        
                        // Remove from pool
                        const usedIds = new Set(courtPlayers.map(p => String(p.id || p.uid)));
                        pool = pool.filter(p => !usedIds.has(String(p.id || p.uid)));
                    } else {
                        console.warn(`Could not repair court ${courtNum}: Found ${courtPlayers.length} candidates.`);
                    }
                }

                if (repairedCount === 0) {
                    return { repaired: 0, message: `❌ No se pudo reparar automáticamente. Se encontraron ${unassignedPlayers.length} jugadores libres pero no cuadran con las pistas faltantes.` };
                }

                return { repaired: repairedCount };
            }
        };

        // EXPORT GLOBALLY
        window.MatchMakingService = MatchMakingService;
        window.MatchmakingService = MatchMakingService; // Alias

        console.log("✅ MatchMakingService EXPORTED SUCCESSFULLY!");

    } catch (err) {
        console.error("❌ CRITICAL ERROR LOADING MATCHMAKING SERVICE:", err);
        // Fallback or Alert?
        window.MatchMakingServiceError = err;
    }
})();
