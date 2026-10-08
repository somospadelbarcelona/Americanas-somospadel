/**
 * RoundAutoRegenerationService.js
 * Servicio centralizado para la detección y regeneración automática de rondas
 * ante nuevas inscripciones o cambios de participantes en Entrenos y Americanas.
 */

(function () {
    'use strict';

    window.RoundAutoRegenerationService = {
        _isRegenerating: false,

        /**
         * Comprueba si la ronda activa de un evento debe regenerarse tras la entrada o cambio de un jugador
         * @param {string} eventId
         * @param {string} eventType - 'entreno' | 'americana'
         * @param {object} addedPlayer - Objeto jugador recién añadido
         * @param {object} context - { responsible: 'automatic' | 'admin' }
         */
        async checkAndHandlePlayerAdded(eventId, eventType = 'americana', addedPlayer = null, context = { responsible: 'automatic' }) {
            if (!eventId) return { status: 'skipped', reason: 'no_event_id' };
            if (this._isRegenerating) {
                console.warn("⏳ [RoundAutoRegen] Regeneración ya en curso, evitando concurrencia.");
                return { status: 'busy' };
            }

            this._isRegenerating = true;
            try {
                const db = window.db;
                if (!db) throw new Error("Firebase DB no inicializado");

                const isEntreno = eventType === 'entreno' || eventType === 'entrenos';
                const eventCollection = isEntreno ? 'entrenos' : 'americanas';
                const matchCollection = isEntreno ? 'entrenos_matches' : 'matches';

                // 1. Obtener datos actuales del evento
                const eventDoc = await db.collection(eventCollection).doc(eventId).get();
                if (!eventDoc.exists) return { status: 'skipped', reason: 'event_not_found' };
                const eventData = eventDoc.data();

                // 2. Obtener partidos existentes para este evento
                const matchesSnap = await db.collection(matchCollection)
                    .where('americana_id', '==', eventId)
                    .get();

                if (matchesSnap.empty) {
                    console.log("ℹ️ [RoundAutoRegen] No existen partidos generados aún para este evento.");
                    return { status: 'no_matches_yet' };
                }

                const matches = matchesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // 3. Determinar la ronda actual activa (la máxima ronda generada o ronda 1)
                const rounds = matches.map(m => parseInt(m.round) || 1);
                const currentRound = Math.max(...rounds);
                const currentRoundMatches = matches.filter(m => (parseInt(m.round) || 1) === currentRound);

                // 4. Evaluar si algún partido de esta ronda ha comenzado
                const hasStarted = currentRoundMatches.some(m => {
                    const sA = parseInt(m.score_a) || 0;
                    const sB = parseInt(m.score_b) || 0;
                    const st = (m.status || '').toLowerCase();
                    return sA > 0 || sB > 0 || st === 'in_progress' || st === 'finished' || st === 'completed';
                });

                if (hasStarted) {
                    // CASO B: Partidos ya iniciados o con resultados
                    console.warn(`🛑 [RoundAutoRegen] Ronda ${currentRound} ya tiene partidos iniciados o finalizados. No se puede regenerar automáticamente.`);

                    // Guardar registro de auditoría
                    await db.collection('round_regenerations_audit').add({
                        timestamp: new Date().toISOString(),
                        eventId,
                        eventType: isEntreno ? 'entreno' : 'americana',
                        eventName: eventData.name || '',
                        round: currentRound,
                        addedPlayer: addedPlayer ? { id: addedPlayer.id || addedPlayer.uid, name: addedPlayer.name || 'Jugador' } : null,
                        action: 'registration_while_round_active',
                        responsible: context.responsible || 'automatic',
                        reason: 'Partidos en juego o terminados',
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    }).catch(e => console.warn("Error guardando auditoría:", e));

                    // Disparar evento para alertar al administrador
                    window.dispatchEvent(new CustomEvent('roundCannotRegenerateActiveMatches', {
                        detail: {
                            eventId,
                            eventType: isEntreno ? 'entreno' : 'americana',
                            eventName: eventData.name || '',
                            round: currentRound,
                            addedPlayer,
                            message: `Se ha inscrito un nuevo jugador pero la Ronda ${currentRound} ya tiene partidos en curso.`
                        }
                    }));

                    if (window.NotificationService) {
                        window.NotificationService.showToast(`⚠️ Nuevo jugador inscrito con Ronda ${currentRound} en juego. Gestiona como reserva.`, "warning");
                    }

                    return {
                        status: 'round_in_progress',
                        round: currentRound,
                        message: 'Partidos en juego. Jugador reservado para siguiente ronda o reserva.'
                    };
                }

                // CASO A: NINGÚN PARTIDO INICIADO -> INVALIDAR Y REGENERAR
                console.log(`🚀 [RoundAutoRegen] Ningún partido iniciado en Ronda ${currentRound}. Procediendo a regeneración automática...`);

                // Snapshot de los partidos previos para auditoría
                const previousSnapshot = currentRoundMatches.map(m => ({
                    id: m.id,
                    court: m.court,
                    team_a_names: m.team_a_names,
                    team_b_names: m.team_b_names,
                    team_a_ids: m.team_a_ids,
                    team_b_ids: m.team_b_ids
                }));

                // Borrar en lote (Batch) los partidos no iniciados de esta ronda
                const batch = db.batch();
                currentRoundMatches.forEach(m => {
                    batch.delete(db.collection(matchCollection).doc(m.id));
                });
                await batch.commit();
                console.log(`🗑️ [RoundAutoRegen] Borrados ${currentRoundMatches.length} partidos previos de Ronda ${currentRound}.`);

                // Ajustar max_courts según la nueva cantidad de jugadores
                const playersList = Array.isArray(eventData.players) ? eventData.players : [];
                const effectiveCourts = Math.max(1, Math.floor(playersList.length / 4));
                await db.collection(eventCollection).doc(eventId).update({
                    max_courts: effectiveCourts,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                // Invalidar caché
                if (window.CacheService) {
                    window.CacheService.remove(eventCollection, 'all');
                    window.CacheService.remove(eventCollection, eventId);
                }
                if (window.clearDatabaseCache) window.clearDatabaseCache(eventCollection);

                // Regenerar la ronda con MatchMakingService
                if (!window.MatchMakingService) {
                    throw new Error("MatchMakingService no está disponible para regenerar la ronda.");
                }

                const newMatches = await window.MatchMakingService.generateRound(
                    eventId,
                    isEntreno ? 'entreno' : 'americana',
                    currentRound,
                    true,  // force
                    false  // randomize
                );

                console.log(`✅ [RoundAutoRegen] Ronda ${currentRound} regenerada con éxito con ${newMatches?.length || 0} partidos.`);

                // Registrar auditoría completa
                await db.collection('round_regenerations_audit').add({
                    timestamp: new Date().toISOString(),
                    eventId,
                    eventType: isEntreno ? 'entreno' : 'americana',
                    eventName: eventData.name || '',
                    round: currentRound,
                    addedPlayer: addedPlayer ? { id: addedPlayer.id || addedPlayer.uid, name: addedPlayer.name || 'Jugador' } : null,
                    previousMatchesSnapshot: previousSnapshot,
                    newMatchesCount: newMatches ? newMatches.length : 0,
                    action: 'auto_regenerated',
                    responsible: context.responsible || 'automatic',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                }).catch(e => console.warn("Error guardando auditoría:", e));

                // Notificaciones y eventos
                const noticeMessage = "⚠️ La planificación se ha actualizado automáticamente debido a nuevos inscritos.";

                // Evento en tiempo real para todas las vistas abiertas
                window.dispatchEvent(new CustomEvent('roundAutoRegenerated', {
                    detail: {
                        eventId,
                        eventType: isEntreno ? 'entreno' : 'americana',
                        round: currentRound,
                        addedPlayer,
                        message: noticeMessage
                    }
                }));

                // Notificación para administradores y jugadores
                if (window.NotificationService) {
                    window.NotificationService.showToast("Se ha inscrito un nuevo jugador y la ronda ha sido regenerada automáticamente.", "info");
                }

                return {
                    status: 'regenerated',
                    round: currentRound,
                    matchesCount: newMatches ? newMatches.length : 0
                };

            } catch (err) {
                console.error("❌ [RoundAutoRegen] Error durante la comprobación/regeneración:", err);
                return { status: 'error', error: err.message };
            } finally {
                this._isRegenerating = false;
            }
        },

        /**
         * Reconcilia un evento verificando si hay discrepancias entre los jugadores inscritos
         * y los jugadores asignados en los partidos de la ronda activa (si ningún partido ha comenzado).
         */
        async reconcileEventRounds(eventId, eventType = 'americana') {
            if (!eventId) return;
            try {
                const db = window.db;
                if (!db) return;

                const isEntreno = eventType === 'entreno' || eventType === 'entrenos';
                const eventCollection = isEntreno ? 'entrenos' : 'americanas';
                const matchCollection = isEntreno ? 'entrenos_matches' : 'matches';

                const eventDoc = await db.collection(eventCollection).doc(eventId).get();
                if (!eventDoc.exists) return;
                const event = eventDoc.data();
                const players = event.players || [];
                if (players.length === 0) return;

                const matchesSnap = await db.collection(matchCollection)
                    .where('americana_id', '==', eventId)
                    .get();

                if (matchesSnap.empty) return;
                const matches = matchesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

                const rounds = matches.map(m => parseInt(m.round) || 1);
                const currentRound = Math.max(...rounds);
                const roundMatches = matches.filter(m => (parseInt(m.round) || 1) === currentRound);

                // Comprobar si empezaron
                const started = roundMatches.some(m => {
                    const sA = parseInt(m.score_a) || 0;
                    const sB = parseInt(m.score_b) || 0;
                    const st = (m.status || '').toLowerCase();
                    return sA > 0 || sB > 0 || st === 'in_progress' || st === 'finished';
                });
                if (started) return; // Si empezó, no tocar

                // Extraer todos los IDs de jugadores en los partidos
                const matchPlayerIds = new Set();
                roundMatches.forEach(m => {
                    (m.team_a_ids || []).forEach(id => matchPlayerIds.add(String(id)));
                    (m.team_b_ids || []).forEach(id => matchPlayerIds.add(String(id)));
                });

                const eventPlayerIds = new Set(players.map(p => String(p.id || p.uid)));

                // Buscar jugadores que están en el evento pero no en los partidos
                const missingInMatches = players.filter(p => !matchPlayerIds.has(String(p.id || p.uid)));
                // O jugadores que están en los partidos pero ya salieron del evento
                const ghostInMatches = Array.from(matchPlayerIds).filter(id => !eventPlayerIds.has(id));

                if (missingInMatches.length > 0 || ghostInMatches.length > 0) {
                    console.log(`🔄 [RoundAutoRegen] Desincronización detectada en evento ${eventId}. Regenerando...`, {
                        missing: missingInMatches.map(p => p.name),
                        ghostCount: ghostInMatches.length
                    });

                    return await this.checkAndHandlePlayerAdded(eventId, eventType, missingInMatches[0] || null, {
                        responsible: 'auto_reconcile'
                    });
                }
            } catch (err) {
                console.warn("⚠️ [RoundAutoRegen] Error en reconciliación:", err);
            }
        },

        /**
         * Maneja la corrección de un resultado en la Ronda N:
         * Si la Ronda N+1 existe y no ha comenzado (sin partidos terminados ni tanteo),
         * la elimina y regenera automáticamente con los nuevos resultados corregidos.
         * Si la Ronda N+1 ya tiene resultados, alerta al usuario en vez de sobreescribir.
         */
        async handleScoreCorrection(eventId, eventType = 'americana', correctedRoundNum) {
            if (!eventId || !correctedRoundNum) return { status: 'skipped' };
            const rNum = parseInt(correctedRoundNum);
            const nextRoundNum = rNum + 1;

            try {
                const db = window.db;
                if (!db) return { status: 'no_db' };

                const isEntreno = eventType === 'entreno' || eventType === 'entrenos';
                const matchCollection = isEntreno ? 'entrenos_matches' : 'matches';

                // Buscar partidos de la siguiente ronda
                const nextSnap = await db.collection(matchCollection)
                    .where('americana_id', '==', eventId)
                    .where('round', '==', nextRoundNum)
                    .get();

                if (nextSnap.empty) {
                    return { status: 'no_next_round' };
                }

                const nextMatches = nextSnap.docs.map(d => ({ id: d.id, ...d.data() }));

                // Comprobar si algún partido de la siguiente ronda ya ha iniciado o terminado
                const nextStarted = nextMatches.some(m => {
                    const sA = parseInt(m.score_a) || 0;
                    const sB = parseInt(m.score_b) || 0;
                    const st = (m.status || '').toLowerCase();
                    return sA > 0 || sB > 0 || st === 'in_progress' || st === 'finished' || st === 'completed';
                });

                if (nextStarted) {
                    const msg = `⚠️ La Ronda ${nextRoundNum} ya tiene partidos en juego o finalizados. Para propagar la corrección de la Ronda ${rNum}, debes utilizar "Reiniciar Torneo" desde la Ronda ${rNum}.`;
                    console.warn(`🛑 [RoundAutoRegen] ${msg}`);
                    if (window.PremiumModal?.alert) {
                        window.PremiumModal.alert({
                            title: '⚠️ RONDA POSTERIOR EN JUEGO',
                            message: msg,
                            type: 'warning'
                        });
                    } else if (window.NotificationService?.showToast) {
                        window.NotificationService.showToast(msg, 'warning');
                    }
                    return { status: 'cannot_regenerate_next_round_started', round: nextRoundNum };
                }

                // Si la Ronda N+1 NO ha empezado, borrarla y regenerarla con el resultado corregido
                console.log(`🔄 [RoundAutoRegen] Regenerando Ronda ${nextRoundNum} tras corrección en Ronda ${rNum}...`);

                const batch = db.batch();
                nextMatches.forEach(m => {
                    batch.delete(db.collection(matchCollection).doc(m.id));
                });
                await batch.commit();

                if (window.MatchMakingService) {
                    const newMatches = await window.MatchMakingService.generateRound(
                        eventId,
                        isEntreno ? 'entreno' : 'americana',
                        nextRoundNum,
                        true,
                        false
                    );

                    const toastMsg = `🔄 La Ronda ${nextRoundNum} se ha recalculado automáticamente con la corrección de la Ronda ${rNum}.`;
                    if (window.NotificationService?.showToast) {
                        window.NotificationService.showToast(toastMsg, 'info');
                    }

                    window.dispatchEvent(new CustomEvent('roundAutoRegenerated', {
                        detail: {
                            eventId,
                            eventType: isEntreno ? 'entreno' : 'americana',
                            round: nextRoundNum,
                            message: toastMsg
                        }
                    }));

                    return { status: 'regenerated', round: nextRoundNum, count: newMatches?.length || 0 };
                }

                return { status: 'deleted_waiting_generation', round: nextRoundNum };

            } catch (err) {
                console.error("❌ [RoundAutoRegen] Error al procesar corrección de resultado:", err);
                return { status: 'error', error: err.message };
            }
        }
    };

    console.log("🚀 RoundAutoRegenerationService cargado");
})();
