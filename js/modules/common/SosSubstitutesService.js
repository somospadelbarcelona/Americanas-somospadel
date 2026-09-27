/**
 * SosSubstitutesService.js
 * 
 * 🚨 BOLSA DE SUPLENTES SOS & MATCHMAKING INTELIGENTE - SomosPádel BCN
 * 
 * Servicio modular de backend para la prevención y resolución de bajas de última hora
 * en torneos americanos y sesiones de entrenamiento.
 * 
 * Funcionalidades:
 * 1. Gestión de Alertas SOS ("Llamada de Emergencia") con bonificación de XP.
 * 2. Bolsa de Guardia ("Guardia Activa") de suplentes disponibles hoy.
 * 3. Algoritmo de Matchmaking Inteligente & Compatibilidad SOS (Nivel, Lado, Disponibilidad).
 * 4. Integración reactiva con NotificationService, AchievementsService y ParticipantService.
 * 5. Mock / Seed defensivo dinámico para modo offline y visualización en tiempo real.
 * 
 * Expuesto globalmente en `window.SosSubstitutesService`.
 */

(function (global) {
    'use strict';

    // Constantes de configuración
    const CONFIG = {
        COLLECTIONS: {
            ALERTS: 'sos_alerts',
            POOL: 'sos_substitutes_pool',
            USERS: 'users',
            AMERICANAS: 'americanas',
            ENTRENOS: 'entrenos'
        },
        STORAGE_KEYS: {
            ALERTS_CACHE: 'sp_sos_alerts_cache_v1',
            AVAILABILITY_PREFIX: 'sp_sos_guard_avail_',
            RESCUES_PREFIX: 'sp_sos_rescues_'
        },
        STATUS: {
            ACTIVE: 'active',
            FILLED: 'filled',
            EXPIRED: 'expired',
            CANCELLED: 'cancelled'
        },
        EVENT_TYPES: {
            AMERICANA: 'americana',
            ENTRENOS: 'entrenos'
        },
        DEFAULT_BONUS_XP: 150,
        DEFAULT_EXPIRATION_HOURS: 3,
        EVENTS: {
            ALERT_CREATED: 'onSosAlertCreated',
            ALERT_FILLED: 'onSosAlertFilled',
            ALERT_CANCELLED: 'onSosAlertCancelled',
            AVAILABILITY_CHANGED: 'onSosAvailabilityChanged'
        }
    };

    /**
     * Clase SosSubstitutesService
     */
    class SosSubstitutesService {
        constructor() {
            this.db = (typeof window !== 'undefined' && window.db) ? window.db : null;
            this._cachedAlerts = [];
            this._cachedSubstitutes = [];
            this._subscribers = [];
            this._listeners = new Map();
            this._initialized = false;

            console.log('🚨 [SosSubstitutesService] Inicializando Servicio de Suplentes SOS & Matchmaking...');
            this._init();
        }

        /**
         * Inicialización defensiva del servicio
         * @private
         */
        _init() {
            if (this._initialized) return;
            this._initialized = true;

            // Cargar caché local inmediata
            this._loadLocalCache();

            // Vincular observador en tiempo real si Firestore está disponible
            this._bindFirestoreRealtime();

            console.log('✅ [SosSubstitutesService] Motor de Bajas SOS & Bolsa de Guardia listo.');
        }

        // =========================================================================
        // 1. GESTIÓN DE ALERTAS SOS ("LLAMADA DE EMERGENCIA")
        // =========================================================================

        /**
         * Crea y publica una nueva alerta SOS en Firestore y en caché local
         * @param {Object} alertData Datos de la alerta
         * @returns {Promise<Object>} Alerta creada
         */
        async createSosAlert(alertData = {}) {
            try {
                if (!alertData) throw new Error("Parámetros de alerta inválidos");

                const now = new Date();
                const todayStr = this._getTodayDateString();

                // Resolver fecha y hora
                const eventDate = alertData.date || todayStr;
                const eventTime = alertData.time || '19:30';

                // Cálculo automático de expiración
                let expiresAt = alertData.expiresAt;
                if (!expiresAt) {
                    expiresAt = this._calculateExpirationDate(eventDate, eventTime).toISOString();
                } else if (expiresAt instanceof Date) {
                    expiresAt = expiresAt.toISOString();
                }

                // Bonificación de XP
                const bonusXp = parseInt(alertData.bonusXp, 10) || CONFIG.DEFAULT_BONUS_XP;
                const bonusText = alertData.bonusText || `Plaza bonificada +${bonusXp} XP`;

                // Creador
                const currentUser = this._getCurrentUser();
                const createdBy = alertData.createdBy || {
                    uid: currentUser?.uid || currentUser?.id || 'admin',
                    name: currentUser?.name || currentUser?.displayName || 'Organización SomosPádel'
                };

                // Normalización de Alerta SOS
                const alertId = alertData.id || `sos_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
                const normalizedAlert = {
                    id: alertId,
                    eventId: alertData.eventId || null,
                    eventType: (alertData.eventType === 'entrenos' || alertData.eventType === 'entreno') 
                        ? CONFIG.EVENT_TYPES.ENTRENOS 
                        : CONFIG.EVENT_TYPES.AMERICANA,
                    eventName: alertData.eventName || (alertData.eventType === 'entrenos' ? 'Entreno Táctico Express' : 'Torneo Americano Express'),
                    date: eventDate,
                    time: eventTime,
                    court: alertData.court || 'Pista Principal',
                    slotsNeeded: Math.max(1, parseInt(alertData.slotsNeeded, 10) || 1),
                    levelMin: parseFloat(alertData.levelMin !== undefined ? alertData.levelMin : 3.0),
                    levelMax: parseFloat(alertData.levelMax !== undefined ? alertData.levelMax : 4.5),
                    sideNeeded: this._normalizeSide(alertData.sideNeeded || 'any'),
                    bonusXp,
                    bonusText,
                    status: CONFIG.STATUS.ACTIVE,
                    createdAt: alertData.createdAt || now.toISOString(),
                    expiresAt,
                    createdBy,
                    candidates: Array.isArray(alertData.candidates) ? alertData.candidates : [],
                    assignedPlayer: alertData.assignedPlayer || null
                };

                // 1. Guardar en Firestore
                const db = this._getDb();
                if (db) {
                    try {
                        await db.collection(CONFIG.COLLECTIONS.ALERTS).doc(alertId).set(normalizedAlert);
                        console.log(`🚨 [SosSubstitutesService] Alerta SOS guardada en Firestore: ${alertId}`);
                    } catch (dbError) {
                        console.warn(`⚠️ [SosSubstitutesService] Error guardando alerta en Firestore (modo offline/fallback):`, dbError.message);
                    }
                }

                // 2. Guardar en caché local
                this._saveAlertToCache(normalizedAlert);

                // 3. Emitir evento global en window
                this._dispatchCustomEvent(CONFIG.EVENTS.ALERT_CREATED, { alert: normalizedAlert });

                // 4. Notificar a suplentes y jugadores del club
                this._triggerSosAlertNotification(normalizedAlert);

                console.log(`🚨 [SosSubstitutesService] Alerta SOS creada con éxito:`, normalizedAlert);
                return normalizedAlert;
            } catch (error) {
                console.error('❌ [SosSubstitutesService] Error al crear alerta SOS:', error);
                throw error;
            }
        }

        /**
         * Devuelve las alertas SOS activas y no expiradas, ordenadas por urgencia
         * (las más próximas primero).
         * @param {Object} [options] Opciones de consulta: { realOnly: boolean, allowMockSeeds: boolean }
         * @returns {Promise<Array<Object>>} Lista de alertas activas
         */
        async getActiveSosAlerts(options = {}) {
            const allowMockSeeds = (options.realOnly === true || options.allowMockSeeds === false) ? false : true;
            try {
                let alerts = [];
                const db = this._getDb();

                // 1. Intentar leer desde Firestore
                if (db) {
                    try {
                        const snapshot = await db.collection(CONFIG.COLLECTIONS.ALERTS)
                            .where('status', '==', CONFIG.STATUS.ACTIVE)
                            .get();

                        if (!snapshot.empty) {
                            snapshot.forEach(doc => {
                                const data = doc.data();
                                alerts.push({ ...data, id: doc.id });
                            });
                        }
                    } catch (fsError) {
                        console.warn('⚠️ [SosSubstitutesService] Firestore getActiveSosAlerts falló, usando caché local:', fsError.message);
                    }
                }

                // 2. Si no hay en Firestore, usar caché local
                if (alerts.length === 0) {
                    alerts = this._getCachedAlerts().filter(a => a.status === CONFIG.STATUS.ACTIVE);
                }

                // 3. Filtrar expiradas dinámicamente
                const now = new Date();
                alerts = alerts.filter(alert => {
                    const expDate = new Date(alert.expiresAt);
                    const isStillValid = !isNaN(expDate.getTime()) ? (expDate > now) : true;
                    if (!isStillValid && alert.status === CONFIG.STATUS.ACTIVE) {
                        this._markAlertExpiredSilently(alert.id);
                    }
                    return isStillValid;
                });

                // 4. Mock / Seed defensivo: solo si allowMockSeeds es true
                if (alerts.length === 0 && allowMockSeeds) {
                    console.log('ℹ️ [SosSubstitutesService] No hay alertas activas en base de datos. Activando Mock Seed dinámico para hoy...');
                    const seedAlerts = this._getDynamicSeedAlerts();
                    alerts = seedAlerts;
                    // Guardar los seeds en la caché para persistencia visual
                    seedAlerts.forEach(s => this._saveAlertToCache(s));
                }

                // 5. Ordenar por urgencia (las más próximas primero)
                alerts.sort((a, b) => {
                    const timeA = this._getEventSortTimestamp(a);
                    const timeB = this._getEventSortTimestamp(b);
                    return timeA - timeB;
                });

                return alerts;
            } catch (error) {
                console.error('❌ [SosSubstitutesService] Error al obtener alertas activas:', error);
                return allowMockSeeds ? this._getDynamicSeedAlerts() : [];
            }
        }

        /**
         * Permite a un jugador postularse / cubrir la plaza SOS con 1 solo clic.
         * Asigna la plaza, actualiza el evento en Firestore, otorga +150 XP de honor
         * y emite eventos y notificaciones.
         * @param {string} alertId ID de la alerta SOS
         * @param {Object} user Objeto del jugador que rescata la plaza
         * @returns {Promise<Object>} Resultado de la asignación
         */
        async joinSosAlert(alertId, user = null) {
            try {
                if (!alertId) throw new Error("alertId requerido");

                // Normalizar usuario
                const currentUser = user || this._getCurrentUser();
                if (!currentUser || (!currentUser.uid && !currentUser.id)) {
                    throw new Error("Se requiere un usuario autenticado para cubrir la plaza SOS");
                }

                const uid = currentUser.uid || currentUser.id;
                const userName = (currentUser.name || currentUser.displayName || 'Jugador SomosPádel').toUpperCase();
                const userLevel = parseFloat(currentUser.level || currentUser.playtomic_level || 3.5);
                const userSide = this._normalizeSide(currentUser.side || currentUser.preferred_side || 'any');

                // Obtener la alerta
                let alert = await this._findAlertById(alertId);
                if (!alert) {
                    throw new Error(`Alerta SOS ${alertId} no encontrada`);
                }

                if (alert.status !== CONFIG.STATUS.ACTIVE) {
                    return {
                        success: false,
                        reason: `La plaza ya no está disponible (Estado actual: ${alert.status})`,
                        alert
                    };
                }

                // Construir objeto de asignación
                const nowIso = new Date().toISOString();
                const assignedPlayer = {
                    uid,
                    id: uid,
                    name: userName,
                    level: userLevel,
                    side: userSide,
                    timestamp: nowIso
                };

                // Actualizar lista de candidatos y estado
                const candidates = Array.isArray(alert.candidates) ? [...alert.candidates] : [];
                if (!candidates.some(c => (c.uid || c.id) === uid)) {
                    candidates.push(assignedPlayer);
                }

                alert.status = CONFIG.STATUS.FILLED;
                alert.assignedPlayer = assignedPlayer;
                alert.candidates = candidates;
                alert.filledAt = nowIso;

                // 1. Actualizar en Firestore
                const db = this._getDb();
                if (db) {
                    try {
                        await db.collection(CONFIG.COLLECTIONS.ALERTS).doc(alertId).update({
                            status: CONFIG.STATUS.FILLED,
                            assignedPlayer,
                            candidates,
                            filledAt: nowIso
                        });
                        console.log(`🚨 [SosSubstitutesService] Alerta ${alertId} marcada como FILLED en Firestore`);
                    } catch (dbErr) {
                        console.warn(`⚠️ [SosSubstitutesService] Error al actualizar estado FILLED en Firestore:`, dbErr.message);
                    }
                }

                // 2. Actualizar caché local
                this._saveAlertToCache(alert);

                // 3. Añadir el jugador al evento si aplica y ParticipantService está disponible
                await this._addPlayerToEventIfAvailable(alert, currentUser);

                // 4. Otorgar bonificación de XP (+150 XP de Honor por Rescate SOS)
                const bonusXp = alert.bonusXp || CONFIG.DEFAULT_BONUS_XP;
                await this._awardRescueBonusXp(currentUser, bonusXp, alert);

                // 5. Emitir evento global en window
                this._dispatchCustomEvent(CONFIG.EVENTS.ALERT_FILLED, {
                    alert,
                    user: currentUser,
                    bonusXp
                });

                // 6. Notificación in-app visual
                this._triggerRescueSuccessNotification(alert, currentUser, bonusXp);

                console.log(`🎉 [SosSubstitutesService] ¡Plaza SOS cubierta con éxito por ${userName}! (+${bonusXp} XP)`);

                return {
                    success: true,
                    alert,
                    assignedPlayer,
                    bonusXp
                };
            } catch (error) {
                console.error(`❌ [SosSubstitutesService] Error en joinSosAlert(${alertId}):`, error);
                throw error;
            }
        }

        /**
         * Cancela una alerta SOS
         * @param {string} alertId
         * @param {string} reason
         * @returns {Promise<Object>}
         */
        async cancelSosAlert(alertId, reason = 'Cancelada por el organizador') {
            try {
                const alert = await this._findAlertById(alertId);
                if (!alert) return { success: false, reason: 'Alerta no encontrada' };

                alert.status = CONFIG.STATUS.CANCELLED;
                alert.cancelledAt = new Date().toISOString();
                alert.cancellationReason = reason;

                const db = this._getDb();
                if (db) {
                    try {
                        await db.collection(CONFIG.COLLECTIONS.ALERTS).doc(alertId).update({
                            status: CONFIG.STATUS.CANCELLED,
                            cancelledAt: alert.cancelledAt,
                            cancellationReason: reason
                        });
                    } catch (e) {
                        console.warn('⚠️ [SosSubstitutesService] Error cancelando en Firestore:', e.message);
                    }
                }

                this._saveAlertToCache(alert);
                this._dispatchCustomEvent(CONFIG.EVENTS.ALERT_CANCELLED, { alertId, reason });

                return { success: true, alert };
            } catch (error) {
                console.error(`❌ [SosSubstitutesService] Error al cancelar alerta ${alertId}:`, error);
                throw error;
            }
        }

        // =========================================================================
        // 2. BOLSA DE GUARDIA / DISPONIBILIDAD DE SUPLENTES ("GUARDIA ACTIVA")
        // =========================================================================

        /**
         * Guarda la disponibilidad de un jugador para estar de guardia hoy
         * @param {Object} user Jugador
         * @param {Object} availabilityData { isAvailable: boolean, timeSlot: string, date: string }
         * @returns {Promise<Object>} Registro de disponibilidad actualizado
         */
        async setPlayerAvailability(user, availabilityData = {}) {
            try {
                const currentUser = user || this._getCurrentUser();
                if (!currentUser || (!currentUser.uid && !currentUser.id)) {
                    throw new Error("Se requiere un usuario válido para fijar disponibilidad");
                }

                const uid = currentUser.uid || currentUser.id;
                const todayStr = this._getTodayDateString();
                const isAvailable = Boolean(availabilityData.isAvailable);
                const timeSlot = availabilityData.timeSlot || 'tardes'; // 'mananas' | 'tardes' | 'todo_el_dia'
                const date = availabilityData.date || todayStr;

                const record = {
                    uid,
                    id: uid,
                    name: (currentUser.name || currentUser.displayName || 'Jugador').toUpperCase(),
                    level: parseFloat(currentUser.level || currentUser.playtomic_level || 3.5),
                    side: this._normalizeSide(currentUser.side || currentUser.preferred_side || 'any'),
                    phone: currentUser.phone || currentUser.phoneNumber || null,
                    photoURL: currentUser.photoURL || currentUser.photo_url || null,
                    isAvailable,
                    timeSlot,
                    date,
                    updatedAt: new Date().toISOString()
                };

                // 1. Guardar en memoria de suplentes inmediata
                const existingIdx = this._cachedSubstitutes.findIndex(s => (s.uid || s.id) === uid);
                if (existingIdx >= 0) {
                    this._cachedSubstitutes[existingIdx] = record;
                } else {
                    this._cachedSubstitutes.push(record);
                }

                // 2. Guardar en localStorage si está disponible
                if (typeof localStorage !== 'undefined') {
                    try {
                        localStorage.setItem(`${CONFIG.STORAGE_KEYS.AVAILABILITY_PREFIX}${uid}`, JSON.stringify(record));
                    } catch (e) {
                        console.warn('[SosSubstitutesService] Error escribiendo en localStorage disponibilidad:', e);
                    }
                }

                // 3. Guardar en Firestore
                const db = this._getDb();
                if (db) {
                    try {
                        await db.collection(CONFIG.COLLECTIONS.POOL).doc(uid).set(record, { merge: true });
                        console.log(`🛡️ [SosSubstitutesService] Disponibilidad de guardia guardada en Firestore para ${record.name}`);
                    } catch (dbErr) {
                        console.warn(`⚠️ [SosSubstitutesService] Error guardando disponibilidad en Firestore:`, dbErr.message);
                    }
                }

                // 4. Emitir evento
                this._dispatchCustomEvent(CONFIG.EVENTS.AVAILABILITY_CHANGED, { record });

                console.log(`🛡️ [SosSubstitutesService] Guardia de ${record.name}:`, isAvailable ? `Activa (${timeSlot})` : 'Desactivada');
                return record;
            } catch (error) {
                console.error('❌ [SosSubstitutesService] Error en setPlayerAvailability:', error);
                throw error;
            }
        }

        /**
         * Consulta si el jugador está de guardia hoy
         * @param {string} userId
         * @returns {Object} Estado de disponibilidad { isAvailable, timeSlot, date }
         */
        getPlayerAvailability(userId) {
            if (!userId) return { isAvailable: false, timeSlot: 'tardes', date: this._getTodayDateString() };

            const todayStr = this._getTodayDateString();

            // 1. Consultar memoria de suplentes inmediata
            const memRecord = this._cachedSubstitutes.find(s => (s.uid || s.id) === userId);
            if (memRecord && memRecord.date === todayStr && memRecord.isAvailable) {
                return memRecord;
            }

            // 2. Consultar localStorage si está disponible
            if (typeof localStorage !== 'undefined') {
                try {
                    const raw = localStorage.getItem(`${CONFIG.STORAGE_KEYS.AVAILABILITY_PREFIX}${userId}`);
                    if (raw) {
                        const record = JSON.parse(raw);
                        // Comprobar si es de hoy
                        if (record.date === todayStr && record.isAvailable) {
                            return record;
                        }
                    }
                } catch (e) {
                    console.warn('[SosSubstitutesService] Error leyendo disponibilidad de localStorage:', e);
                }
            }

            return {
                isAvailable: false,
                timeSlot: 'tardes',
                date: todayStr
            };
        }

        /**
         * Obtiene la lista de suplentes de guardia hoy ordenados por cercanía de nivel
         * @param {number|null} filterLevel Nivel objetivo de referencia
         * @param {string|null} filterSide Posición preferida ('drive', 'reves', 'any')
         * @param {Object} [options] Opciones: { realOnly: boolean, allowMockSeeds: boolean }
         * @returns {Promise<Array<Object>>} Lista de suplentes disponibles
         */
        async getAvailableSubstitutes(filterLevel = null, filterSide = null, options = {}) {
            const allowMockSeeds = (options.realOnly === true || options.allowMockSeeds === false) ? false : true;
            try {
                const todayStr = this._getTodayDateString();
                let substitutes = [];

                // 1. Intentar consultar Firestore
                const db = this._getDb();
                if (db) {
                    try {
                        const snap = await db.collection(CONFIG.COLLECTIONS.POOL)
                            .where('isAvailable', '==', true)
                            .where('date', '==', todayStr)
                            .get();

                        if (!snap.empty) {
                            snap.forEach(doc => {
                                substitutes.push({ ...doc.data(), uid: doc.id });
                            });
                        }
                    } catch (fsErr) {
                        console.warn('⚠️ [SosSubstitutesService] Firestore getAvailableSubstitutes falló, usando local:', fsErr.message);
                    }
                }

                // 2. Si no hay registros en Firestore, consultar memoria/caché local de suplentes de hoy
                if (substitutes.length === 0 && Array.isArray(this._cachedSubstitutes) && this._cachedSubstitutes.length > 0) {
                    const localAvail = this._cachedSubstitutes.filter(s => s && s.isAvailable && s.date === todayStr);
                    if (localAvail.length > 0) {
                        substitutes = [...localAvail];
                    }
                }

                // 3. Si sigue vacío (nadie anotado), usar semillas dinámicas solo si se permite mock
                if (substitutes.length === 0 && allowMockSeeds) {
                    substitutes = this._getDynamicSeedSubstitutes();
                }

                // Guardar la lista completa no filtrada en caché
                this._cachedSubstitutes = substitutes;

                // Crear copia de trabajo para filtrar y ordenar sin mutar la caché original
                let filteredSubstitutes = [...substitutes];

                // 4. Filtrar o priorizar por lado si se solicita
                if (filterSide && filterSide !== 'any') {
                    const targetSide = this._normalizeSide(filterSide);
                    // Los que juegan en ese lado o son polivalentes primero
                    filteredSubstitutes = filteredSubstitutes.filter(s => {
                        const sSide = this._normalizeSide(s.side);
                        return sSide === targetSide || sSide === 'any';
                    });
                }

                // 5. Ordenar por cercanía de nivel si se pasa un nivel de referencia
                if (filterLevel !== null && !isNaN(parseFloat(filterLevel))) {
                    const targetLevel = parseFloat(filterLevel);
                    filteredSubstitutes.sort((a, b) => {
                        const diffA = Math.abs((parseFloat(a.level) || 3.5) - targetLevel);
                        const diffB = Math.abs((parseFloat(b.level) || 3.5) - targetLevel);
                        return diffA - diffB;
                    });
                }

                return filteredSubstitutes;
            } catch (error) {
                console.error('❌ [SosSubstitutesService] Error al obtener suplentes de guardia:', error);
                return allowMockSeeds ? this._getDynamicSeedSubstitutes() : [];
            }
        }

        /**
         * Obtiene todos los jugadores reales de SomosPadel BCN (BBDD real)
         * Enriquecidos con estado de guardia, género normalizado y teléfono.
         * @param {Object} [options] Filtros opcionales: { gender, side, levelMin, levelMax, search, forceRefresh }
         * @returns {Promise<Array<Object>>} Lista de jugadores reales
         */
        async getClubPlayers(options = {}) {
            try {
                let rawPlayers = [];

                // 1. Memoria instantánea del admin o Store (0ms)
                if (typeof window !== 'undefined') {
                    if (Array.isArray(window.allUsersCache) && window.allUsersCache.length > 0) {
                        rawPlayers = window.allUsersCache;
                    } else if (Array.isArray(window._allPlayersCache) && window._allPlayersCache.length > 0) {
                        rawPlayers = window._allPlayersCache;
                    }
                }
                // 2. Intentar desde FirebaseDB con timeout
                if ((!rawPlayers || rawPlayers.length === 0) && typeof window !== 'undefined' && window.FirebaseDB && window.FirebaseDB.players) {
                    try {
                        rawPlayers = await Promise.race([
                            window.FirebaseDB.players.getAll(options.forceRefresh || false),
                            new Promise(resolve => setTimeout(() => resolve([]), 2000))
                        ]);
                    } catch (e) {
                        console.warn("⚠️ [SosSubstitutesService] Error leyendo FirebaseDB.players:", e.message);
                    }
                }
                // 3. Fallback directo a Firestore con timeout
                if ((!rawPlayers || rawPlayers.length === 0) && this._getDb()) {
                    try {
                        const snap = await Promise.race([
                            this._getDb().collection('players').get(),
                            new Promise(resolve => setTimeout(() => resolve({ docs: [] }), 2000))
                        ]);
                        if (snap && snap.docs) {
                            rawPlayers = snap.docs.map(d => ({ ...d.data(), id: d.id, uid: d.data().uid || d.id }));
                        }
                    } catch (fsErr) {
                        console.warn("⚠️ [SosSubstitutesService] Error leyendo Firestore 'players':", fsErr.message);
                    }
                }

                // Obtener suplentes con guardia activa hoy para cruzar datos
                const todayStr = this._getTodayDateString();
                const guardUids = new Set();
                try {
                    const db = this._getDb();
                    if (db) {
                        const poolSnap = await db.collection(CONFIG.COLLECTIONS.POOL)
                            .where('isAvailable', '==', true)
                            .where('date', '==', todayStr)
                            .get();
                        if (poolSnap && !poolSnap.empty) {
                            poolSnap.forEach(d => guardUids.add(d.id));
                        }
                    }
                } catch (_) {}

                // Normalizar jugadores reales
                let normalized = (rawPlayers || []).map(p => {
                    const uid = p.id || p.uid || `user_${Math.random()}`;
                    const rawGender = String(p.gender || p.sexo || '').toLowerCase().trim();
                    let gender = 'chico';
                    if (rawGender.includes('chica') || rawGender.includes('fem') || rawGender === 'f') {
                        gender = 'chica';
                    } else if (rawGender.includes('chico') || rawGender.includes('masc') || rawGender === 'm') {
                        gender = 'chico';
                    } else {
                        gender = p.gender || 'chico';
                    }

                    const rawSide = String(p.side || p.preferred_side || p.posicion || 'any').toLowerCase().trim();
                    let side = 'any';
                    if (rawSide.includes('dri')) side = 'drive';
                    else if (rawSide.includes('rev')) side = 'reves';

                    const level = parseFloat(p.level || p.playtomic_level || p.self_rate_level || 3.5);
                    const isGuard = guardUids.has(uid) || (typeof localStorage !== 'undefined' && localStorage.getItem(CONFIG.STORAGE_KEYS.AVAILABILITY_PREFIX + uid) === 'true');

                    return {
                        id: uid,
                        uid: uid,
                        name: (p.name || p.displayName || 'Jugador SomosPadel').toUpperCase(),
                        phone: (p.phone || p.telefono || '').toString().trim(),
                        level: isNaN(level) ? 3.5 : level,
                        side: side,
                        gender: gender,
                        role: p.role || 'player',
                        team_somospadel: p.team_somospadel || [],
                        status: p.status || 'active',
                        photoURL: p.photoURL || p.photo_url || null,
                        isAvailableToday: isGuard,
                        raw: p
                    };
                });

                // Filtrar según opciones
                if (options.gender && options.gender !== 'all') {
                    normalized = normalized.filter(p => p.gender === options.gender);
                }
                if (options.side && options.side !== 'all') {
                    normalized = normalized.filter(p => p.side === options.side || p.side === 'any');
                }
                if (options.levelMin !== undefined && !isNaN(parseFloat(options.levelMin))) {
                    normalized = normalized.filter(p => p.level >= parseFloat(options.levelMin));
                }
                if (options.levelMax !== undefined && !isNaN(parseFloat(options.levelMax))) {
                    normalized = normalized.filter(p => p.level <= parseFloat(options.levelMax));
                }
                if (options.onlyGuardToday) {
                    normalized = normalized.filter(p => p.isAvailableToday);
                }
                if (options.search) {
                    const q = options.search.toLowerCase().trim();
                    normalized = normalized.filter(p => p.name.toLowerCase().includes(q) || p.phone.includes(q));
                }

                return normalized;
            } catch (err) {
                console.error("❌ [SosSubstitutesService] Error al obtener jugadores reales del club:", err);
                return [];
            }
        }

        /**
         * Difusión masiva de convocatoria para rellenar entrenos y partidos (Capitanes & SuperAdmin)
         * Envía comunicados en la app, notificaciones push, opcionalmente crea Alerta SOS
         * y genera enlaces directos de WhatsApp para los jugadores seleccionados.
         * @param {Object} data 
         * @returns {Promise<Object>}
         */
        async broadcastConvocatoria(data = {}) {
            try {
                const title = (data.title || '⚡ Plaza disponible en SomosPádel').trim();
                const body = (data.body || 'Se necesita jugador para completar convocatoria.').trim();
                const url = (data.url || 'entrenos').trim();
                const targetAudience = data.targetAudience || 'all'; // 'all', 'male', 'mixed', 'female'
                const levelMin = parseFloat(data.levelMin) || 1.0;
                const levelMax = parseFloat(data.levelMax) || 7.0;
                const eventId = data.eventId || null;
                const eventType = data.eventType || 'entrenos';
                const sendPush = data.sendPush !== false;
                const createSos = data.createSosAlert === true;

                const db = this._getDb();
                const nowIso = new Date().toISOString();
                const currentUser = this._getCurrentUser() || {};
                const authorName = currentUser.name || currentUser.displayName || 'Capitán / Organización';

                // 1. Obtener los destinatarios reales
                let targetPlayers = await this.getClubPlayers({
                    gender: targetAudience === 'male' ? 'chico' : (targetAudience === 'female' ? 'chica' : 'all'),
                    levelMin: levelMin,
                    levelMax: levelMax
                });

                // Si la audiencia es mixta, asegurarse de incluir tanto chicos como chicas
                if (targetAudience === 'mixed') {
                    targetPlayers = await this.getClubPlayers({ levelMin, levelMax });
                }

                // 2. Guardar en la colección 'broadcasts' de Firestore
                let broadcastId = `bc_conv_${Date.now()}`;
                const broadcastPayload = {
                    title,
                    body,
                    url,
                    targetAudience,
                    levelRange: `${levelMin} - ${levelMax}`,
                    eventId,
                    eventType,
                    recipientCount: targetPlayers.length,
                    authorName,
                    authorId: currentUser.uid || currentUser.id || 'admin',
                    createdAt: nowIso,
                    type: 'convocatoria',
                    topic: 'all_players',
                    icon: 'bullhorn',
                    status: 'published'
                };

                if (db) {
                    try {
                        const bRef = await db.collection('broadcasts').add(broadcastPayload);
                        if (bRef && bRef.id) broadcastId = bRef.id;
                        console.log(`📢 [SosSubstitutesService] Convocatoria registrada en 'broadcasts': ${broadcastId}`);
                    } catch (bErr) {
                        console.warn("⚠️ [SosSubstitutesService] Aviso guardando en broadcasts:", bErr.message);
                    }
                }

                // 3. Crear Alerta SOS si se solicitó
                let createdSosAlert = null;
                if (createSos) {
                    try {
                        createdSosAlert = await this.createSosAlert({
                            eventId: eventId,
                            eventType: eventType,
                            eventName: data.eventName || title,
                            date: data.date || this._getTodayDateString(),
                            time: data.time || '19:30',
                            court: data.court || 'Pista Principal',
                            sideNeeded: data.sideNeeded || 'any',
                            levelMin: levelMin,
                            levelMax: levelMax,
                            bonusXp: 150
                        });
                    } catch (sosErr) {
                        console.warn("⚠️ [SosSubstitutesService] Error al crear alerta SOS complementaria:", sosErr.message);
                    }
                }

                // 4. Fan-out de notificaciones a los jugadores destinatarios en Firestore
                let notifiedCount = 0;
                if (sendPush && db && targetPlayers.length > 0) {
                    try {
                        const canBatch = typeof db.batch === 'function' || (window.firebase && window.firebase.firestore && typeof window.firebase.firestore().batch === 'function');
                        if (canBatch) {
                            const getNewBatch = () => (typeof db.batch === 'function') ? db.batch() : window.firebase.firestore().batch();
                            const BATCH_SIZE = 450;
                            for (let i = 0; i < targetPlayers.length; i += BATCH_SIZE) {
                                const chunk = targetPlayers.slice(i, i + BATCH_SIZE);
                                const batch = getNewBatch();
                                chunk.forEach(player => {
                                    const notifRef = db.collection('players').doc(player.id).collection('notifications').doc();
                                    batch.set(notifRef, {
                                        title,
                                        body,
                                        url,
                                        read: false,
                                        timestamp: (window.firebase && window.firebase.firestore && window.firebase.firestore.FieldValue)
                                            ? window.firebase.firestore.FieldValue.serverTimestamp()
                                            : new Date(),
                                        createdAt: nowIso,
                                        data: {
                                            broadcastId,
                                            eventId,
                                            eventType,
                                            type: 'convocatoria_entreno',
                                            sosAlertId: createdSosAlert ? createdSosAlert.id : null
                                        },
                                        icon: 'triangle-exclamation'
                                    });
                                });
                                await batch.commit();
                                notifiedCount += chunk.length;
                            }
                        } else {
                            // Fallback individual si batch no está expuesto directamente
                            const promises = targetPlayers.slice(0, 100).map(player => {
                                return db.collection('players').doc(player.id).collection('notifications').add({
                                    title,
                                    body,
                                    url,
                                    read: false,
                                    timestamp: new Date(),
                                    createdAt: nowIso,
                                    data: {
                                        broadcastId,
                                        eventId,
                                        eventType,
                                        type: 'convocatoria_entreno',
                                        sosAlertId: createdSosAlert ? createdSosAlert.id : null
                                    },
                                    icon: 'triangle-exclamation'
                                }).catch(() => {});
                            });
                            await Promise.all(promises);
                            notifiedCount = targetPlayers.length;
                        }
                    } catch (pushErr) {
                        console.warn("⚠️ [SosSubstitutesService] Error en fan-out de notificaciones:", pushErr.message);
                    }
                }

                // 5. Emitir evento global
                this._dispatchCustomEvent('onConvocatoriaBroadcasted', {
                    broadcastId,
                    targetAudience,
                    recipientCount: targetPlayers.length,
                    notifiedCount
                });

                return {
                    success: true,
                    broadcastId,
                    targetPlayers,
                    recipientCount: targetPlayers.length,
                    notifiedCount,
                    sosAlert: createdSosAlert
                };
            } catch (error) {
                console.error("❌ [SosSubstitutesService] Error en broadcastConvocatoria:", error);
                throw error;
            }
        }

        // =========================================================================
        // 3. ALGORITMO DE MATCHMAKING INTELIGENTE & COMPATIBILIDAD SOS
        // =========================================================================

        /**
         * Calcula la afinidad matemática del 0% al 100% entre un jugador y una alerta SOS.
         * 
         * Criterios:
         * - Nivel (hasta +40%): En rango [levelMin, levelMax] = +40%. Margen +-0.25 = +25%.
         * - Lado de juego (hasta +35%): Coincidencia exacta = +35%. Libre/Cualquiera = +30%. Adaptable = +15%.
         * - Disponibilidad de guardia (hasta +25%): De guardia activa hoy = +25%.
         * 
         * @param {Object} user Jugador a evaluar
         * @param {Object} alert Alerta SOS
         * @returns {Object} { score: number, label: string, reasons: Array<string>, isEligible: boolean }
         */
        calculateCompatibility(user = {}, alert = {}) {
            const reasons = [];
            let score = 0;

            const userLevel = parseFloat(user?.level || user?.playtomic_level || 3.5);
            const levelMin = parseFloat(alert?.levelMin !== undefined ? alert?.levelMin : 3.0);
            const levelMax = parseFloat(alert?.levelMax !== undefined ? alert?.levelMax : 4.5);

            const sideNeeded = this._normalizeSide(alert?.sideNeeded || 'any');
            const userSide = this._normalizeSide(user?.side || user?.preferred_side || 'any');

            // 1. EVALUACIÓN DE NIVEL (+40% max)
            let levelScore = 0;
            if (userLevel >= levelMin && userLevel <= levelMax) {
                levelScore = 40;
                reasons.push(`Nivel óptimo (${userLevel.toFixed(2)} dentro del rango [${levelMin.toFixed(2)} - ${levelMax.toFixed(2)}])`);
            } else if (userLevel >= (levelMin - 0.25) && userLevel <= (levelMax + 0.25)) {
                levelScore = 25;
                reasons.push(`Nivel muy cercano (+-0.25 de tolerancia: ${userLevel.toFixed(2)})`);
            } else if (userLevel >= (levelMin - 0.5) && userLevel <= (levelMax + 0.5)) {
                levelScore = 10;
                reasons.push(`Nivel aceptable (${userLevel.toFixed(2)})`);
            } else {
                levelScore = 0;
                reasons.push(`Desviación de nivel respecto al evento (${userLevel.toFixed(2)} vs rango [${levelMin} - ${levelMax}])`);
            }
            score += levelScore;

            // 2. EVALUACIÓN DE POSICIÓN / LADO (+35% max)
            let sideScore = 0;
            if (sideNeeded === 'reves' && userSide === 'reves') {
                sideScore = 35;
                reasons.push('Especialista en Revés (coincidencia de lado exacta)');
            } else if (sideNeeded === 'drive' && userSide === 'drive') {
                sideScore = 35;
                reasons.push('Especialista en Drive (coincidencia de lado exacta)');
            } else if (sideNeeded === 'any') {
                sideScore = 30;
                reasons.push('Plaza abierta a cualquier posición (Drive o Revés)');
            } else if (userSide === 'any') {
                sideScore = 30;
                reasons.push('Jugador polivalente (se adapta tanto a Drive como a Revés)');
            } else {
                sideScore = 15;
                reasons.push(`Posición adaptable (${userSide.toUpperCase()} cubriendo plaza de ${sideNeeded.toUpperCase()})`);
            }
            score += sideScore;

            // 3. DISPONIBILIDAD / GUARDIA ACTIVA (+25% max)
            let guardScore = 0;
            const uid = user?.uid || user?.id;
            const guardStatus = this.getPlayerAvailability(uid);
            if (guardStatus && guardStatus.isAvailable) {
                guardScore = 25;
                const slotText = guardStatus.timeSlot === 'todo_el_dia' ? 'Todo el día' : (guardStatus.timeSlot === 'mananas' ? 'Mañanas' : 'Tardes');
                reasons.push(`¡De Guardia Activa hoy! (${slotText} - Respuesta inmediata)`);
            } else {
                guardScore = 0;
                reasons.push('Sin guardia activa hoy (disponibilidad sujeta a confirmación)');
            }
            score += guardScore;

            // Ajustar al rango [0, 100]
            const finalScore = Math.min(100, Math.max(0, score));

            // Etiqueta legible
            let label = 'Compatible';
            if (finalScore >= 80) {
                label = 'Compatibilidad Élite';
            } else if (finalScore >= 60) {
                label = 'Muy Compatible';
            } else if (finalScore >= 40) {
                label = 'Compatible';
            } else {
                label = 'Compatibilidad Baja';
            }

            // Elegibilidad mínima para participar
            const isEligible = finalScore >= 40 && (userLevel >= (levelMin - 0.35) && userLevel <= (levelMax + 0.35));

            return {
                score: finalScore,
                label,
                reasons,
                isEligible,
                details: {
                    levelScore,
                    sideScore,
                    guardScore
                }
            };
        }

        // =========================================================================
        // 4. MÉTODOS DE INTEGRACIÓN, EVENTOS Y NOTIFICACIONES
        // =========================================================================

        /**
         * Conecta un observador en tiempo real con Firestore para actualizar alertas
         * @private
         */
        _bindFirestoreRealtime() {
            const db = this._getDb();
            if (!db) return;

            try {
                db.collection(CONFIG.COLLECTIONS.ALERTS)
                    .where('status', '==', CONFIG.STATUS.ACTIVE)
                    .onSnapshot(snapshot => {
                        const activeList = [];
                        snapshot.forEach(doc => {
                            activeList.push({ ...doc.data(), id: doc.id });
                        });
                        this._cachedAlerts = activeList;
                        this._notifyListeners('activeAlerts', activeList);
                    }, err => {
                        console.warn('⚠️ [SosSubstitutesService] Firestore snapshot notice:', err.message);
                    });
            } catch (e) {
                console.warn('⚠️ [SosSubstitutesService] Error al conectar snapshot en tiempo real:', e);
            }
        }

        /**
         * Dispara notificaciones cuando se crea una nueva alerta SOS
         * @private
         */
        async _triggerSosAlertNotification(alert) {
            try {
                // Notificación in-app visual
                if (window.NotificationService) {
                    const notifTitle = `🚨 ¡LLAMADA DE EMERGENCIA SOS!`;
                    const notifBody = `Baja urgente en ${alert.eventName} (${alert.time}, ${alert.court}). ¡${alert.bonusText}!`;
                    
                    if (typeof window.NotificationService.showInAppToast === 'function') {
                        window.NotificationService.showInAppToast(notifTitle, notifBody, 'warning', '#/sos');
                    } else if (typeof window.NotificationService.showToast === 'function') {
                        window.NotificationService.showToast(`🚨 ${alert.eventName}: ${alert.bonusText}`, 'warning');
                    }
                }

                // Notificar a suplentes disponibles que encajen en el perfil
                this.notifyEligibleSubstitutes(alert).catch(err => {
                    console.warn('[SosSubstitutesService] Error notificando a suplentes elegibles:', err);
                });
            } catch (err) {
                console.warn('[SosSubstitutesService] Error en _triggerSosAlertNotification:', err);
            }
        }

        /**
         * Notifica a los suplentes de guardia cuyo perfil sea altamente compatible
         * @param {Object} alert Alerta SOS
         */
        async notifyEligibleSubstitutes(alert) {
            try {
                const subs = await this.getAvailableSubstitutes();
                const matched = subs.filter(sub => {
                    const compat = this.calculateCompatibility(sub, alert);
                    return compat.score >= 60;
                });

                console.log(`🚨 [SosSubstitutesService] Suplentes altamente compatibles con alerta ${alert.id}:`, matched.length);

                if (window.NotificationService && typeof window.NotificationService.sendNotificationToUser === 'function') {
                    for (const sub of matched) {
                        try {
                            await window.NotificationService.sendNotificationToUser(
                                sub.uid || sub.id,
                                '🚨 ¡Alerta SOS para ti!',
                                `Tu perfil encaja al 100% con una baja de última hora en ${alert.eventName}. ${alert.bonusText}.`,
                                { alertId: alert.id, type: 'sos_call' }
                            );
                        } catch (sendErr) {
                            console.warn(`[SosSubstitutesService] Error enviando notif a ${sub.name}:`, sendErr);
                        }
                    }
                }
            } catch (err) {
                console.warn('[SosSubstitutesService] Error en notifyEligibleSubstitutes:', err);
            }
        }

        /**
         * Notificación visual y toast tras un rescate SOS exitoso
         * @private
         */
        _triggerRescueSuccessNotification(alert, user, bonusXp) {
            if (typeof window === 'undefined') return;

            const title = `🦸 ¡HÉROE SOS RESCATISTA!`;
            const message = `¡Has cubierto la plaza de ${alert.eventName}! Se han otorgado +${bonusXp} XP a tu cuenta de jugador.`;

            if (window.NotificationService && typeof window.NotificationService.showInAppToast === 'function') {
                window.NotificationService.showInAppToast(title, message, 'success');
            } else if (window.NotificationService && typeof window.NotificationService.showToast === 'function') {
                window.NotificationService.showToast(`🎉 ¡Plaza cubierta! +${bonusXp} XP otorgados`, 'success');
            }
        }

        /**
         * Otorga XP de rescate SOS comunicándose con AchievementsService y Firestore
         * @private
         */
        async _awardRescueBonusXp(user, bonusXp = 150, alert = null) {
            const uid = user?.uid || user?.id;
            if (!uid) return;

            try {
                // Registrar rescate en historial local
                const rescueKey = `${CONFIG.STORAGE_KEYS.RESCUES_PREFIX}${uid}`;
                let rescues = [];
                try {
                    const raw = localStorage.getItem(rescueKey);
                    rescues = raw ? JSON.parse(raw) : [];
                } catch (e) {
                    rescues = [];
                }

                rescues.push({
                    alertId: alert?.id || 'manual',
                    eventName: alert?.eventName || 'Evento SOS',
                    date: alert?.date || this._getTodayDateString(),
                    xp: bonusXp,
                    timestamp: new Date().toISOString()
                });

                if (typeof localStorage !== 'undefined') {
                    try {
                        localStorage.setItem(rescueKey, JSON.stringify(rescues));
                    } catch (e) {}
                }

                // Integrar con AchievementsService si está disponible
                if (typeof window !== 'undefined' && window.AchievementsService) {
                    if (typeof window.AchievementsService.awardBonusXp === 'function') {
                        await window.AchievementsService.awardBonusXp(
                            user,
                            bonusXp,
                            'Rescate SOS - Héroe de Guardia',
                            { alertId: alert?.id, eventName: alert?.eventName }
                        );
                    } else if (typeof window.AchievementsService.loadCachedGamification === 'function') {
                        // Fallback de integración gamificación
                        const gam = window.AchievementsService.loadCachedGamification(uid);
                        const newTotal = (gam.totalXp || 0) + bonusXp;
                        const newLevel = window.AchievementsService.calculateLevel ? window.AchievementsService.calculateLevel(newTotal) : gam.level;
                        window.AchievementsService.saveCachedGamification(uid, {
                            ...gam,
                            totalXp: newTotal,
                            level: newLevel
                        });
                    }
                }

                // Incrementar XP en Firestore users/{uid}
                const db = this._getDb();
                if (db && typeof window !== 'undefined' && window.firebase?.firestore?.FieldValue?.increment) {
                    try {
                        await db.collection(CONFIG.COLLECTIONS.USERS).doc(uid).set({
                            xp: window.firebase.firestore.FieldValue.increment(bonusXp),
                            sosRescuesCount: window.firebase.firestore.FieldValue.increment(1),
                            lastSosRescue: new Date().toISOString()
                        }, { merge: true });
                    } catch (fsErr) {
                        console.warn('[SosSubstitutesService] Error incrementando XP en users collection:', fsErr.message);
                    }
                }

                console.log(`⭐ [SosSubstitutesService] +${bonusXp} XP asignados al jugador ${uid} por rescate SOS.`);
            } catch (err) {
                console.warn('[SosSubstitutesService] Error otorgando bonificación XP:', err);
            }
        }

        /**
         * Añade el jugador a la lista de participantes del evento en Firestore
         * @private
         */
        async _addPlayerToEventIfAvailable(alert, user) {
            if (!alert.eventId) return;

            try {
                if (typeof window !== 'undefined' && window.ParticipantService && typeof window.ParticipantService.addPlayer === 'function') {
                    console.log(`🎾 [SosSubstitutesService] Añadiendo jugador ${user.uid || user.id} al evento ${alert.eventId} vía ParticipantService...`);
                    await window.ParticipantService.addPlayer(alert.eventId, alert.eventType, user);
                }
            } catch (err) {
                // Si ya estaba inscrito o hay conflicto menor, registrar advertencia defensiva sin bloquear
                console.warn(`⚠️ [SosSubstitutesService] Aviso al añadir participante al evento original:`, err.message);
            }
        }

        // =========================================================================
        // 5. CACHÉ Y HELPERS AUXILIARES
        // =========================================================================

        /**
         * Suscribe un callback a eventos del servicio
         * @param {string} eventName
         * @param {Function} callback
         */
        subscribe(eventName, callback) {
            if (typeof callback !== 'function') return;
            if (!this._listeners.has(eventName)) {
                this._listeners.set(eventName, []);
            }
            this._listeners.get(eventName).push(callback);
        }

        /**
         * Notifica a los listeners registrados
         * @private
         */
        _notifyListeners(eventName, data) {
            const list = this._listeners.get(eventName);
            if (Array.isArray(list)) {
                list.forEach(cb => {
                    try { cb(data); } catch (e) { console.error(e); }
                });
            }
        }

        /**
         * Busca una alerta en Firestore o en caché local
         * @private
         */
        async _findAlertById(alertId) {
            // 1. Memoria
            const inMem = this._cachedAlerts.find(a => a.id === alertId);
            if (inMem) return inMem;

            // 2. LocalStorage
            const cached = this._getCachedAlerts().find(a => a.id === alertId);
            if (cached) return cached;

            // 3. Firestore
            const db = this._getDb();
            if (db) {
                try {
                    const doc = await db.collection(CONFIG.COLLECTIONS.ALERTS).doc(alertId).get();
                    if (doc.exists) {
                        return { ...doc.data(), id: doc.id };
                    }
                } catch (e) {
                    console.warn(`[SosSubstitutesService] Error fetching alert ${alertId}:`, e.message);
                }
            }

            // 4. Seeds
            const seed = this._getDynamicSeedAlerts().find(a => a.id === alertId);
            return seed || null;
        }

        /**
         * Carga alertas desde localStorage
         * @private
         */
        _loadLocalCache() {
            if (typeof localStorage === 'undefined') {
                this._cachedAlerts = [];
                return;
            }
            try {
                const raw = localStorage.getItem(CONFIG.STORAGE_KEYS.ALERTS_CACHE);
                if (raw) {
                    this._cachedAlerts = JSON.parse(raw);
                }
            } catch (e) {
                this._cachedAlerts = [];
            }
        }

        /**
         * Obtiene las alertas almacenadas en caché
         * @private
         */
        _getCachedAlerts() {
            if (this._cachedAlerts && this._cachedAlerts.length > 0) {
                return this._cachedAlerts;
            }
            this._loadLocalCache();
            return this._cachedAlerts || [];
        }

        /**
         * Guarda una alerta en caché local
         * @private
         */
        _saveAlertToCache(alert) {
            try {
                const list = this._getCachedAlerts().filter(a => a.id !== alert.id);
                list.unshift(alert);
                // Mantener las últimas 50
                const trimmed = list.slice(0, 50);
                this._cachedAlerts = trimmed;
                if (typeof localStorage !== 'undefined') {
                    localStorage.setItem(CONFIG.STORAGE_KEYS.ALERTS_CACHE, JSON.stringify(trimmed));
                }
            } catch (e) {
                console.warn('[SosSubstitutesService] Error escribiendo en caché de alertas:', e);
            }
        }

        /**
         * Marca silenciosamente una alerta expirada
         * @private
         */
        _markAlertExpiredSilently(alertId) {
            const db = this._getDb();
            if (db) {
                db.collection(CONFIG.COLLECTIONS.ALERTS).doc(alertId).update({
                    status: CONFIG.STATUS.EXPIRED
                }).catch(() => {});
            }
        }

        /**
         * Emite un evento en window
         * @private
         */
        _dispatchCustomEvent(name, detail = {}) {
            if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
                try {
                    window.dispatchEvent(new CustomEvent(name, { detail }));
                } catch (e) {
                    console.warn(`[SosSubstitutesService] Error despachando ${name}:`, e);
                }
            }
        }

        /**
         * Obtiene el usuario actual
         * @private
         */
        _getCurrentUser() {
            if (typeof window === 'undefined') return null;
            return (window.Store && typeof window.Store.getState === 'function' ? window.Store.getState('currentUser') : null) ||
                   window.auth?.currentUser ||
                   window.AdminAuth?.user ||
                   null;
        }

        /**
         * Obtiene la instancia de Firestore de forma defensiva
         * @private
         */
        _getDb() {
            if (this.db) return this.db;
            if (typeof window !== 'undefined' && window.db) {
                this.db = window.db;
                return this.db;
            }
            if (typeof window !== 'undefined' && window.firebase?.firestore) {
                try {
                    this.db = window.firebase.firestore();
                    return this.db;
                } catch (e) {}
            }
            return null;
        }

        /**
         * Devuelve la fecha local de hoy en formato YYYY-MM-DD
         * @private
         */
        _getTodayDateString() {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }

        /**
         * Normaliza la posición del jugador ('drive' | 'reves' | 'any')
         * @private
         */
        _normalizeSide(side) {
            if (!side) return 'any';
            const s = String(side).trim().toLowerCase();
            if (s.includes('rev') || s.includes('backhand') || s === 'r') return 'reves';
            if (s.includes('dri') || s.includes('forehand') || s === 'd') return 'drive';
            return 'any';
        }

        /**
         * Calcula la fecha de expiración automática para un evento
         * @private
         */
        _calculateExpirationDate(dateStr, timeStr) {
            try {
                const parts = (dateStr || '').split('-');
                const timeParts = (timeStr || '').split(':');
                if (parts.length === 3 && timeParts.length >= 2) {
                    const eventDate = new Date(
                        parseInt(parts[0], 10),
                        parseInt(parts[1], 10) - 1,
                        parseInt(parts[2], 10),
                        parseInt(timeParts[0], 10),
                        parseInt(timeParts[1], 10)
                    );
                    if (!isNaN(eventDate.getTime())) {
                        // Expira a la hora del partido o 15 mins antes si da margen
                        const now = new Date();
                        if (eventDate > now) {
                            return eventDate;
                        }
                    }
                }
            } catch (e) {}

            // Fallback: 3 horas en el futuro
            return new Date(Date.now() + CONFIG.DEFAULT_EXPIRATION_HOURS * 60 * 60 * 1000);
        }

        /**
         * Helper para ordenar alertas por proximidad temporal
         * @private
         */
        _getEventSortTimestamp(alert) {
            try {
                if (alert.date && alert.time) {
                    const d = new Date(`${alert.date}T${alert.time}:00`);
                    if (!isNaN(d.getTime())) return d.getTime();
                }
                if (alert.expiresAt) {
                    const exp = new Date(alert.expiresAt);
                    if (!isNaN(exp.getTime())) return exp.getTime();
                }
            } catch (e) {}
            return Date.now() + 86400000;
        }

        // =========================================================================
        // 6. SEEDS DINÁMICOS DE DEMOSTRACIÓN (DEFENSIVO)
        // =========================================================================

        /**
         * Genera alertas dinámicas para el día en curso garantizando actividad visual
         * @private
         */
        _getDynamicSeedAlerts() {
            const todayStr = this._getTodayDateString();
            const now = new Date();

            // Horarios dinámicos para hoy: tarde / noche
            const currentHour = now.getHours();
            const h1 = Math.min(22, Math.max(currentHour + 1, 19));
            const h2 = Math.min(23, Math.max(h1 + 1, 20));

            const timeStr1 = `${String(h1).padStart(2, '0')}:30`;
            const timeStr2 = `${String(h2).padStart(2, '0')}:45`;

            const exp1 = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();
            const exp2 = new Date(now.getTime() + 3.5 * 60 * 60 * 1000).toISOString();

            return [
                {
                    id: `sos_demo_seed_amer_${todayStr}`,
                    eventId: 'demo_americana_today',
                    eventType: CONFIG.EVENT_TYPES.AMERICANA,
                    eventName: 'Torneo Americano Prime BCN',
                    date: todayStr,
                    time: timeStr1,
                    court: 'Pista 2 (Panorámica)',
                    slotsNeeded: 1,
                    levelMin: 3.25,
                    levelMax: 4.5,
                    sideNeeded: 'reves',
                    bonusXp: 150,
                    bonusText: 'Plaza bonificada +150 XP',
                    status: CONFIG.STATUS.ACTIVE,
                    createdAt: now.toISOString(),
                    expiresAt: exp1,
                    createdBy: {
                        uid: 'org_somospadel',
                        name: 'Coordinación SomosPadel'
                    },
                    candidates: [],
                    assignedPlayer: null
                },
                {
                    id: `sos_demo_seed_entr_${todayStr}`,
                    eventId: 'demo_entreno_today',
                    eventType: CONFIG.EVENT_TYPES.ENTRENOS,
                    eventName: 'Entreno Nivelado de Competición',
                    date: todayStr,
                    time: timeStr2,
                    court: 'Pista Central WPT',
                    slotsNeeded: 1,
                    levelMin: 3.5,
                    levelMax: 5.0,
                    sideNeeded: 'drive',
                    bonusXp: 150,
                    bonusText: 'Plaza bonificada +150 XP',
                    status: CONFIG.STATUS.ACTIVE,
                    createdAt: now.toISOString(),
                    expiresAt: exp2,
                    createdBy: {
                        uid: 'org_somospadel',
                        name: 'Director Técnico SomosPadel'
                    },
                    candidates: [],
                    assignedPlayer: null
                }
            ];
        }

        /**
         * Genera suplentes de guardia dinámicos para hoy garantizando actividad visual
         * @private
         */
        _getDynamicSeedSubstitutes() {
            const todayStr = this._getTodayDateString();
            return [
                {
                    uid: 'sub_seed_1',
                    id: 'sub_seed_1',
                    name: 'CARLOS VILANOVA',
                    level: 4.25,
                    side: 'reves',
                    isAvailable: true,
                    timeSlot: 'tardes',
                    date: todayStr,
                    updatedAt: new Date().toISOString()
                },
                {
                    uid: 'sub_seed_2',
                    id: 'sub_seed_2',
                    name: 'MARC PUIG',
                    level: 3.75,
                    side: 'drive',
                    isAvailable: true,
                    timeSlot: 'tardes',
                    date: todayStr,
                    updatedAt: new Date().toISOString()
                },
                {
                    uid: 'sub_seed_3',
                    id: 'sub_seed_3',
                    name: 'LAURA BALLESTER',
                    level: 3.50,
                    side: 'any',
                    isAvailable: true,
                    timeSlot: 'todo_el_dia',
                    date: todayStr,
                    updatedAt: new Date().toISOString()
                },
                {
                    uid: 'sub_seed_4',
                    id: 'sub_seed_4',
                    name: 'ALEJANDRO MARTÍNEZ',
                    level: 4.50,
                    side: 'reves',
                    isAvailable: true,
                    timeSlot: 'tardes',
                    date: todayStr,
                    updatedAt: new Date().toISOString()
                }
            ];
        }
    }

    // Instanciar y exponer globalmente como Singleton
    const serviceInstance = new SosSubstitutesService();

    if (typeof window !== 'undefined') {
        window.SosSubstitutesService = serviceInstance;
    }

    if (typeof global !== 'undefined') {
        global.SosSubstitutesService = serviceInstance;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = serviceInstance;
    }

})(typeof window !== 'undefined' ? window : this);
