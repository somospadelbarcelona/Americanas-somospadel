/**
 * SeasonCampaignService.js
 * Servicio de Backend / Lógica de Negocio para la Campaña de Temporada (Octubre - Noviembre).
 * 
 * Gestiona:
 * 1. Inscripción en Equipos del Club (2ª, 3ª y 4ª Femenina, 3ª y 4ª Mixta, 3ª y 4ª Masculina) y actividades complementarias (Entrenos / Americanas).
 * 2. Persistencia en Firestore ('season_inscriptions' / 'team_applications') con soporte Offline y Reintento ('sp_pending_inscriptions').
 * 3. Generador de mensajes con formato oficial y enlace de 1-clic directo a WhatsApp del Administrador (+34 649 21 93 50).
 * 4. Catálogo oficial de categorías de temporada y estadísticas de campaña en tiempo real.
 * 
 * Expuesto globalmente en `window.SeasonCampaignService`.
 */

(function (global) {
    'use strict';

    // Constantes de configuración
    const CONFIG = {
        PRIMARY_COLLECTION: 'season_inscriptions',
        FALLBACK_COLLECTION: 'team_applications',
        STORAGE_KEY_PENDING: 'sp_pending_inscriptions',
        STORAGE_KEY_CACHE: 'sp_cached_inscriptions',
        STORAGE_KEY_ACTIVE: 'sp_season_campaign_active',
        CONFIG_COLLECTION: 'config',
        CONFIG_DOC_ID: 'season_campaign',
        DEFAULT_ADMIN_PHONE: '34649219350', // Alex / SomosPadel Admin (+34 649 21 93 50)
        CAMPAIGN_SEASON: 'Temporada 2027 (Equipos Octubre - Noviembre)',
        STATUS: {
            PENDING: 'pending',
            REVIEWED: 'reviewed',
            CONFIRMED: 'confirmed',
            CANCELLED: 'cancelled'
        }
    };

    /**
     * Catálogo oficial exclusivo de categorías y equipos de SomosPadel Barcelona (Temporada 2027).
     * Equipos: 2ª, 3ª, 4ª Femenina | 3ª y 4ª Mixta | 3ª y 4ª Masculina.
     */
    const OFFICIAL_CATEGORIES = [
        {
            id: 'femenina-2',
            name: 'Femenina 2ª División',
            category: 'Femenina',
            division: '2ª División',
            type: 'team',
            icon: '🚺',
            badge: 'Competición Alta',
            description: 'Equipo femenino consolidado. Nivel intermedio-alto para jugadoras con experiencia en ligas de pádel.',
            levelRange: '3.5 - 4.5',
            minLevel: 3.5,
            maxLevel: 4.5
        },
        {
            id: 'femenina-3',
            name: 'Femenina 3ª División',
            category: 'Femenina',
            division: '3ª División',
            type: 'team',
            icon: '🎾',
            badge: 'Competición Regular',
            description: 'Equipo femenino intermedio. Buen ritmo de juego y excelente ambiente de club en competición.',
            levelRange: '2.75 - 3.5',
            minLevel: 2.75,
            maxLevel: 3.5
        },
        {
            id: 'femenina-4',
            name: 'Femenina 4ª División',
            category: 'Femenina',
            division: '4ª División',
            type: 'team',
            icon: '✨',
            badge: 'Iniciación / Promoción',
            description: 'Equipo femenino de desarrollo e iniciación a la competición por equipos.',
            levelRange: '2.0 - 2.75',
            minLevel: 2.0,
            maxLevel: 2.75
        },
        {
            id: 'mixta-3',
            name: 'Mixta 3ª División',
            category: 'Mixta',
            division: '3ª División',
            type: 'team',
            icon: '🚻',
            badge: 'Competición Intermedia',
            description: 'Equipo mixto de competición regular. Formato dinámico y competitivo en jornadas de club.',
            levelRange: '2.75 - 3.75',
            minLevel: 2.75,
            maxLevel: 3.75
        },
        {
            id: 'mixta-4',
            name: 'Mixta 4ª División',
            category: 'Mixta',
            division: '4ª División',
            type: 'team',
            icon: '⚡',
            badge: 'Iniciación / Social',
            description: 'Equipo mixto de iniciación y nivel medio para disfrutar de la competición en pareja.',
            levelRange: '2.0 - 2.75',
            minLevel: 2.0,
            maxLevel: 2.75
        },
        {
            id: 'masculina-3',
            name: 'Masculina 3ª División',
            category: 'Masculina',
            division: '3ª División',
            type: 'team',
            icon: '🏆',
            badge: 'Competición Consolidada',
            description: 'Equipo masculino de 3ª División. Nuestro equipo referente en ligas intercomarcales.',
            levelRange: '3.0 - 3.75',
            minLevel: 3.0,
            maxLevel: 3.75
        },
        {
            id: 'masculina-4',
            name: 'Masculina 4ª División',
            category: 'Masculina',
            division: '4ª División',
            type: 'team',
            icon: '🛡️',
            badge: 'Promoción y Ritmo',
            description: 'Equipo masculino de 4ª División. Ideal para sumar partidos oficiales y progresar de nivel.',
            levelRange: '2.0 - 3.0',
            minLevel: 2.0,
            maxLevel: 3.0
        },
        {
            id: 'entrenos-tecnificacion',
            name: 'Entrenos de Tecnificación',
            category: 'Entrenos',
            division: 'Clases y Físico',
            type: 'training',
            icon: '🎯',
            badge: 'Preparación Temporada',
            description: 'Entrenamientos tácticos y técnicos para ponerte al 100% de cara a la competición.',
            levelRange: 'Todos los niveles',
            minLevel: 1.0,
            maxLevel: 7.0
        },
        {
            id: 'americanas-express',
            name: 'Americanas Express',
            category: 'Americanas',
            division: 'Dinámica en Vivo',
            type: 'americana',
            icon: '⚡',
            badge: 'Partidas con Ranking',
            description: 'Puntuación en tiempo real y ranking para ganar horas de pista antes de la liga.',
            levelRange: 'Todos los niveles',
            minLevel: 1.0,
            maxLevel: 7.0
        }
    ];

    class SeasonCampaignService {
        constructor() {
            this.config = CONFIG;
            this.categories = OFFICIAL_CATEGORIES;
            this._initAutoSync();
        }

        /**
         * Inicializa la escucha de eventos de red para sincronizar inscripciones guardadas offline.
         */
        _initAutoSync() {
            if (typeof window !== 'undefined' && window.addEventListener) {
                window.addEventListener('online', () => {
                    console.log('📶 [SeasonCampaignService] Conexión restablecida. Comprobando sincronizaciones pendientes...');
                    this.syncPendingInscriptions().catch(err => {
                        console.warn('⚠️ [SeasonCampaignService] Error en sync automático:', err);
                    });
                });
            }
        }

        /**
         * Obtiene la referencia activa de Firestore (soporta window.db o firebase.firestore()).
         */
        _getDb() {
            if (typeof window !== 'undefined') {
                if (window.db) return window.db;
                if (window.firebase && typeof window.firebase.firestore === 'function') {
                    return window.firebase.firestore();
                }
            }
            return null;
        }

        /**
         * Normaliza y valida un número de teléfono.
         * Acepta formatos estándar españoles e internacionales.
         */
        _cleanPhone(phone) {
            if (!phone) return '';
            let cleaned = String(phone).trim();
            // Eliminar espacios, guiones y puntos
            cleaned = cleaned.replace(/[\s\-\.\(\)]/g, '');
            return cleaned;
        }

        /**
         * Valida estrictamente un número de teléfono.
         */
        _isValidPhone(phone) {
            const cleaned = this._cleanPhone(phone);
            if (!cleaned) return false;
            // Acepta con o sin prefijo (+34 o 0034), mínimo 9 dígitos numéricos
            const digitsOnly = cleaned.replace(/^\+/, '');
            if (!/^\d{9,15}$/.test(digitsOnly)) {
                return false;
            }
            return true;
        }

        /**
         * Formatea el teléfono para presentación en UI o mensajes.
         */
        formatPhoneDisplay(phone) {
            const cleaned = this._cleanPhone(phone);
            if (cleaned.length === 9) {
                return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
            }
            if (cleaned.startsWith('+34') && cleaned.length === 12) {
                return `+34 ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
            }
            return cleaned;
        }

        /**
         * Obtiene las categorías oficiales disponibles para la temporada Octubre-Noviembre.
         * @returns {Array<Object>} Lista de categorías con metadatos.
         */
        getAvailableCategories() {
            return JSON.parse(JSON.stringify(this.categories));
        }

        /**
         * Validación estricta de los datos de la solicitud de inscripción.
         * @param {Object} data 
         * @returns {{isValid: boolean, errors: string[], sanitized: Object}}
         */
        validateInscription(data) {
            const errors = [];
            if (!data || typeof data !== 'object') {
                return { isValid: false, errors: ['Los datos de inscripción son requeridos.'], sanitized: null };
            }

            // 1. Validación de Nombre
            const rawName = typeof data.name === 'string' ? data.name.trim() : '';
            if (!rawName) {
                errors.push('El nombre completo es obligatorio.');
            } else if (rawName.length < 2) {
                errors.push('El nombre debe tener al menos 2 caracteres.');
            } else if (rawName.length > 80) {
                errors.push('El nombre no puede exceder los 80 caracteres.');
            }

            // 2. Validación de Teléfono
            const rawPhone = data.phone;
            if (!rawPhone || String(rawPhone).trim() === '') {
                errors.push('El número de teléfono es obligatorio.');
            } else if (!this._isValidPhone(rawPhone)) {
                errors.push('El número de teléfono no es válido (debe tener al menos 9 dígitos).');
            }

            // 3. Validación de Nivel (debe estar estrictamente entre 1.0 y 7.0)
            let parsedLevel = parseFloat(data.level);
            if (isNaN(parsedLevel)) {
                errors.push('El nivel de juego es obligatorio.');
            } else if (parsedLevel < 1.0 || parsedLevel > 7.0) {
                errors.push('El nivel debe estar comprendido entre 1.0 y 7.0.');
            } else {
                // Redondear a 1 o 2 decimales para consistencia
                parsedLevel = Math.round(parsedLevel * 100) / 100;
            }

            // 4. Categoría
            const rawCategory = typeof data.category === 'string' ? data.category.trim() : '';
            if (!rawCategory) {
                errors.push('Debes seleccionar una categoría o actividad.');
            }

            // 5. División preferida o interés
            const rawDivision = typeof data.preferredDivision === 'string' 
                ? data.preferredDivision.trim() 
                : (typeof data.teamInterest === 'string' ? data.teamInterest.trim() : '');

            // 6. Comentarios / Observaciones
            const rawComments = typeof data.comments === 'string' ? data.comments.trim() : '';

            // 7. Identificador de usuario (opcional o auto-detectado)
            let userId = data.userId || null;
            if (!userId && typeof window !== 'undefined') {
                if (window.currentUser && window.currentUser.uid) {
                    userId = window.currentUser.uid;
                } else if (window.Store && typeof window.Store.getState === 'function') {
                    const storeUser = window.Store.getState('currentUser');
                    if (storeUser && (storeUser.id || storeUser.uid)) {
                        userId = storeUser.id || storeUser.uid;
                    }
                }
            }

            const sanitized = {
                name: rawName,
                phone: this._cleanPhone(rawPhone),
                level: parsedLevel,
                category: rawCategory,
                preferredDivision: rawDivision || rawCategory,
                comments: rawComments,
                userId: userId || null,
                status: CONFIG.STATUS.PENDING,
                season: CONFIG.CAMPAIGN_SEASON,
                source: 'season_campaign_oct_nov'
            };

            return {
                isValid: errors.length === 0,
                errors,
                sanitized
            };
        }

        /**
         * Envía y guarda la solicitud de inscripción.
         * Intenta almacenar en Firestore. Si falla o está offline, guarda en localStorage ('sp_pending_inscriptions').
         * 
         * @param {Object} inscriptionData - Datos enviados desde el formulario.
         * @returns {Promise<{success: boolean, id: string, isOffline: boolean, message: string, data: Object}>}
         */
        async submitTeamInscription(inscriptionData) {
            // Validación estricta
            const validation = this.validateInscription(inscriptionData);
            if (!validation.isValid) {
                const errorMsg = validation.errors.join(' | ');
                const error = new Error(`Error de validación: ${errorMsg}`);
                error.validationErrors = validation.errors;
                throw error;
            }

            const payload = { ...validation.sanitized };
            const clientTimestamp = new Date().toISOString();
            payload.clientTimestamp = clientTimestamp;

            // Identificador temporal para seguimiento
            const tempId = 'temp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);

            const db = this._getDb();
            const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

            if (db && isOnline) {
                try {
                    // Agregar server timestamp si Firestore está disponible
                    let firestoreTimestamp = null;
                    if (typeof window !== 'undefined' && window.firebase && window.firebase.firestore) {
                        firestoreTimestamp = window.firebase.firestore.FieldValue.serverTimestamp();
                    }
                    
                    const recordToSave = {
                        ...payload,
                        createdAt: firestoreTimestamp || clientTimestamp,
                        updatedAt: firestoreTimestamp || clientTimestamp
                    };

                    // Intento de guardado en la colección principal
                    const docRef = await db.collection(CONFIG.PRIMARY_COLLECTION).add(recordToSave);
                    console.log(`✅ [SeasonCampaignService] Inscripción guardada en Firestore (${CONFIG.PRIMARY_COLLECTION}):`, docRef.id);

                    // Guardar en caché local para acceso rápido
                    this._appendCachedInscription({ ...payload, id: docRef.id, createdAt: clientTimestamp });

                    // Reintentar en segundo plano cualquier otra inscripción pendiente
                    this.syncPendingInscriptions().catch(() => {});

                    return {
                        success: true,
                        id: docRef.id,
                        isOffline: false,
                        message: '¡Inscripción registrada con éxito en el club!',
                        data: { ...payload, id: docRef.id }
                    };
                } catch (fsError) {
                    console.warn(`⚠️ [SeasonCampaignService] Error al escribir en Firestore, activando fallback offline:`, fsError.message);
                    // Caer en almacenamiento local
                }
            } else {
                console.warn('⚠️ [SeasonCampaignService] Modo offline o Firestore no disponible. Guardando localmente...');
            }

            // Fallback Offline: Guardar en localStorage
            payload.id = tempId;
            payload.createdAt = clientTimestamp;
            payload.syncStatus = 'pending';
            payload.offlineError = !isOnline ? 'offline' : 'firestore_unavailable';

            this._savePendingToLocalStorage(payload);

            return {
                success: true,
                id: tempId,
                isOffline: true,
                message: 'Inscripción guardada localmente en tu dispositivo. Se sincronizará automáticamente con el club.',
                data: payload
            };
        }

        /**
         * Guarda una inscripción pendiente en localStorage.
         */
        _savePendingToLocalStorage(item) {
            try {
                if (typeof localStorage === 'undefined') return;
                const raw = localStorage.getItem(CONFIG.STORAGE_KEY_PENDING);
                const list = raw ? JSON.parse(raw) : [];
                list.push(item);
                localStorage.setItem(CONFIG.STORAGE_KEY_PENDING, JSON.stringify(list));
                console.log(`💾 [SeasonCampaignService] Guardada solicitud offline en ${CONFIG.STORAGE_KEY_PENDING} (Total pendientes: ${list.length})`);
            } catch (err) {
                console.error('❌ [SeasonCampaignService] Error guardando en localStorage:', err);
            }
        }

        /**
         * Agrega una inscripción al historial en caché local.
         */
        _appendCachedInscription(item) {
            try {
                if (typeof localStorage === 'undefined') return;
                const raw = localStorage.getItem(CONFIG.STORAGE_KEY_CACHE);
                const list = raw ? JSON.parse(raw) : [];
                list.unshift(item);
                // Mantener últimos 50
                localStorage.setItem(CONFIG.STORAGE_KEY_CACHE, JSON.stringify(list.slice(0, 50)));
            } catch (err) {
                // Ignore silent cache errors
            }
        }

        /**
         * Recupera la lista de inscripciones pendientes de sincronizar desde localStorage.
         * @returns {Array<Object>}
         */
        getPendingInscriptions() {
            try {
                if (typeof localStorage === 'undefined') return [];
                const raw = localStorage.getItem(CONFIG.STORAGE_KEY_PENDING);
                return raw ? JSON.parse(raw) : [];
            } catch (err) {
                console.error('❌ [SeasonCampaignService] Error leyendo pendientes:', err);
                return [];
            }
        }

        /**
         * Sincroniza las solicitudes pendientes guardadas en localStorage hacia Firestore.
         * @returns {Promise<{syncedCount: number, remainingCount: number}>}
         */
        async syncPendingInscriptions() {
            const db = this._getDb();
            if (!db) return { syncedCount: 0, remainingCount: 0 };
            if (typeof navigator !== 'undefined' && !navigator.onLine) {
                return { syncedCount: 0, remainingCount: this.getPendingInscriptions().length };
            }

            const pending = this.getPendingInscriptions();
            if (pending.length === 0) {
                return { syncedCount: 0, remainingCount: 0 };
            }

            console.log(`🔄 [SeasonCampaignService] Sincronizando ${pending.length} inscripciones pendientes...`);
            const remaining = [];
            let syncedCount = 0;

            for (const item of pending) {
                try {
                    const itemToSave = { ...item };
                    delete itemToSave.syncStatus;
                    delete itemToSave.offlineError;
                    const tempId = itemToSave.id;
                    delete itemToSave.id;

                    if (typeof window !== 'undefined' && window.firebase && window.firebase.firestore) {
                        itemToSave.syncedAt = window.firebase.firestore.FieldValue.serverTimestamp();
                    } else {
                        itemToSave.syncedAt = new Date().toISOString();
                    }

                    const docRef = await db.collection(CONFIG.PRIMARY_COLLECTION).add(itemToSave);
                    console.log(`✅ [SeasonCampaignService] Solicitud sincronizada (${tempId} -> ${docRef.id})`);
                    syncedCount++;
                } catch (err) {
                    console.warn('⚠️ [SeasonCampaignService] Fallo al sincronizar item, se conservará para el próximo intento:', err.message);
                    remaining.push(item);
                }
            }

            try {
                if (typeof localStorage !== 'undefined') {
                    if (remaining.length > 0) {
                        localStorage.setItem(CONFIG.STORAGE_KEY_PENDING, JSON.stringify(remaining));
                    } else {
                        localStorage.removeItem(CONFIG.STORAGE_KEY_PENDING);
                    }
                }
            } catch (saveErr) {
                console.error('Error actualizando cola local:', saveErr);
            }

            return { syncedCount, remainingCount: remaining.length };
        }

        /**
         * Construye el enlace codificado directo de WhatsApp con destino al Administrador del Club.
         * Incluye mensaje enriquecido con emojis, formato oficial y confirmación en 1-clic.
         * 
         * @param {Object} inscriptionData - Datos de la inscripción.
         * @param {string|null} [adminPhone=null] - Número de teléfono del administrador (opcional, fallback por defecto).
         * @returns {string} Enlace URL completo para wa.me
         */
        buildWhatsAppMessage(inscriptionData, adminPhone = null) {
            const data = inscriptionData || {};
            const targetPhone = this._cleanPhone(adminPhone || CONFIG.DEFAULT_ADMIN_PHONE);

            const name = (data.name || 'Nuevo Jugador').trim();
            const phone = this.formatPhoneDisplay(data.phone || '');
            const level = data.level ? parseFloat(data.level).toFixed(1) : 'Pendiente';
            const category = data.category || 'Equipo SomosPadel';
            const division = data.preferredDivision || data.teamInterest || 'General';
            const comments = data.comments && data.comments.trim() ? data.comments.trim() : null;

            // Determinar emoji de categoría
            let categoryIcon = '🎾';
            if (category.toLowerCase().includes('masculin')) categoryIcon = '🏆';
            else if (category.toLowerCase().includes('femenin')) categoryIcon = '🚺';
            else if (category.toLowerCase().includes('mixt')) categoryIcon = '🚻';
            else if (category.toLowerCase().includes('veteran')) categoryIcon = '⭐';
            else if (category.toLowerCase().includes('entreno')) categoryIcon = '🎯';
            else if (category.toLowerCase().includes('american')) categoryIcon = '⚡';

            // Construir texto formateado para WhatsApp
            const lines = [
                `🎾 *INSCRIPCIÓN EQUIPOS - TEMPORADA 2027* 🎾`,
                `*SomosPadel Barcelona*`,
                ``,
                `👤 *Nombre:* ${name}`,
                `📱 *Teléfono:* ${phone}`,
                `📊 *Nivel de Juego:* ${level}`,
                `${categoryIcon} *Categoría:* ${category}`,
                `🏷️ *División / Preferencia:* ${division}`
            ];

            if (comments) {
                lines.push(`💬 *Comentarios:* ${comments}`);
            }

            lines.push(``);
            lines.push(`👉 *Confirmación:* Hola Alex / Equipo SomosPadel, deseo confirmar mi plaza e interés para la temporada. ¡Quedo a la espera de los detalles!`);
            lines.push(``);
            lines.push(`⚡ _Enviado desde la App Oficial SomosPadel BCN_`);

            const fullText = lines.join('\n');
            const encodedText = encodeURIComponent(fullText);

            return `https://wa.me/${targetPhone}?text=${encodedText}`;
        }

        /**
         * Abre directamente WhatsApp en una nueva pestaña/ventana o app nativa.
         * @param {Object} inscriptionData 
         * @param {string|null} [adminPhone=null]
         */
        openWhatsApp(inscriptionData, adminPhone = null) {
            const url = this.buildWhatsAppMessage(inscriptionData, adminPhone);
            if (typeof window !== 'undefined' && window.open) {
                window.open(url, '_blank', 'noopener,noreferrer');
            }
            return url;
        }

        /**
         * Obtiene estadísticas de la campaña actual (conteo total, desglose por categoría y estado).
         * Combina Firestore con datos locales en caso de desconexión.
         * 
         * @returns {Promise<{
         *   total: number,
         *   byCategory: Object<string, number>,
         *   byStatus: Object<string, number>,
         *   averageLevel: number,
         *   pendingSyncCount: number,
         *   isOffline: boolean
         * }>}
         */
        async getCampaignStats() {
            const pendingList = this.getPendingInscriptions();
            const stats = {
                total: 0,
                byCategory: {},
                byStatus: {},
                averageLevel: 0,
                pendingSyncCount: pendingList.length,
                isOffline: false
            };

            let levelSum = 0;
            let levelCount = 0;

            const db = this._getDb();
            let records = [];

            if (db) {
                try {
                    const snapshot = await db.collection(CONFIG.PRIMARY_COLLECTION).get();
                    snapshot.forEach(doc => {
                        records.push({ id: doc.id, ...doc.data() });
                    });
                } catch (err) {
                    console.warn('⚠️ [SeasonCampaignService] No se pudo leer Firestore para estadísticas, usando datos locales:', err.message);
                    stats.isOffline = true;
                }
            } else {
                stats.isOffline = true;
            }

            // Si Firestore falló o está vacío, añadir historial en caché
            if (records.length === 0 && typeof localStorage !== 'undefined') {
                try {
                    const cached = localStorage.getItem(CONFIG.STORAGE_KEY_CACHE);
                    if (cached) {
                        records = JSON.parse(cached);
                    }
                } catch (e) {
                    // Ignore
                }
            }

            // Combinar con solicitudes locales pendientes no sincronizadas
            const allItemsMap = new Map();
            records.forEach(item => allItemsMap.set(item.id || item.phone, item));
            pendingList.forEach(item => allItemsMap.set(item.id || item.phone, item));

            const combined = Array.from(allItemsMap.values());
            stats.total = combined.length;

            combined.forEach(item => {
                // Categoría
                const cat = item.category || 'Sin categoría';
                stats.byCategory[cat] = (stats.byCategory[cat] || 0) + 1;

                // Estado
                const st = item.status || 'pending';
                stats.byStatus[st] = (stats.byStatus[st] || 0) + 1;

                // Nivel
                const lvl = parseFloat(item.level);
                if (!isNaN(lvl) && lvl >= 1.0 && lvl <= 7.0) {
                    levelSum += lvl;
                    levelCount++;
                }
            });

            stats.averageLevel = levelCount > 0 ? Math.round((levelSum / levelCount) * 10) / 10 : 0;
            return stats;
        }

        /**
         * Recupera todas las inscripciones registradas (para paneles de administración / delegados).
         * @param {Object} [filter={}] - Filtro opcional por category o status.
         * @returns {Promise<Array<Object>>}
         */
        async getAllInscriptions(filter = {}) {
            const db = this._getDb();
            const results = [];

            if (db) {
                try {
                    let query = db.collection(CONFIG.PRIMARY_COLLECTION);
                    if (filter.category) {
                        query = query.where('category', '==', filter.category);
                    }
                    if (filter.status) {
                        query = query.where('status', '==', filter.status);
                    }
                    const snapshot = await query.get();
                    snapshot.forEach(doc => {
                        results.push({ id: doc.id, ...doc.data() });
                    });
                    return results;
                } catch (err) {
                    console.warn('⚠️ [SeasonCampaignService] Error obteniendo inscripciones de Firestore:', err);
                }
            }

            // Fallback a localStorage
            const pending = this.getPendingInscriptions();
            let cached = [];
            try {
                const raw = localStorage.getItem(CONFIG.STORAGE_KEY_CACHE);
                if (raw) cached = JSON.parse(raw);
            } catch (e) {}

            const merged = [...pending, ...cached];
            return merged.filter(item => {
                if (filter.category && item.category !== filter.category) return false;
                if (filter.status && item.status !== filter.status) return false;
                return true;
            });
        }

        /**
         * Devuelve el teléfono oficial configurado para el administrador de SomosPadel.
         */
        getAdminPhone() {
            return CONFIG.DEFAULT_ADMIN_PHONE;
        }

        /**
         * Actualiza el estado de una inscripción (ej: 'pending', 'contacted', 'confirmed', 'rejected').
         * @param {string} id - ID del documento en Firestore o identificador temporal.
         * @param {string} newStatus - Nuevo estado.
         * @param {Object} [extraData={}] - Datos adicionales (ej: notas del admin, equipo asignado).
         * @returns {Promise<boolean>}
         */
        async updateInscriptionStatus(id, newStatus, extraData = {}) {
            const db = this._getDb();
            const updatedAt = new Date().toISOString();
            const updatePayload = {
                status: newStatus,
                updatedAt,
                ...extraData
            };

            if (db && !id.startsWith('temp_')) {
                try {
                    await db.collection(CONFIG.PRIMARY_COLLECTION).doc(id).update(updatePayload);
                    console.log(`✅ [SeasonCampaignService] Estado actualizado en Firestore (${id} -> ${newStatus})`);
                    return true;
                } catch (err) {
                    console.warn(`⚠️ Error actualizando en Firestore:`, err.message);
                }
            }

            // Actualizar en localStorage si está en caché o pendiente
            try {
                if (typeof localStorage !== 'undefined') {
                    ['sp_pending_inscriptions', 'sp_cached_inscriptions'].forEach(key => {
                        const raw = localStorage.getItem(key);
                        if (raw) {
                            const list = JSON.parse(raw);
                            const idx = list.findIndex(item => item.id === id);
                            if (idx !== -1) {
                                list[idx] = { ...list[idx], ...updatePayload };
                                localStorage.setItem(key, JSON.stringify(list));
                            }
                        }
                    });
                }
            } catch (e) {}

            return true;
        }

        /**
         * Elimina una inscripción por su ID.
         * @param {string} id
         * @returns {Promise<boolean>}
         */
        async deleteInscription(id) {
            const db = this._getDb();
            if (db && !id.startsWith('temp_')) {
                try {
                    await db.collection(CONFIG.PRIMARY_COLLECTION).doc(id).delete();
                    console.log(`🗑️ [SeasonCampaignService] Solicitud eliminada de Firestore: ${id}`);
                } catch (err) {
                    console.warn(`⚠️ Error eliminando en Firestore:`, err.message);
                }
            }

            // Eliminar de localStorage
            try {
                if (typeof localStorage !== 'undefined') {
                    ['sp_pending_inscriptions', 'sp_cached_inscriptions'].forEach(key => {
                        const raw = localStorage.getItem(key);
                        if (raw) {
                            const list = JSON.parse(raw);
                            const filtered = list.filter(item => item.id !== id);
                            localStorage.setItem(key, JSON.stringify(filtered));
                        }
                    });
                }
            } catch (e) {}

            return true;
        }

        /**
         * Construye un mensaje de WhatsApp para que el ADMIN contacte al jugador.
         * @param {Object} playerData - { name, phone, category, level }
         * @param {string} [templateType='welcome'] - 'welcome' | 'trial' | 'confirmed'
         * @returns {string} Enlace URL para wa.me
         */
        buildPlayerContactWhatsApp(playerData, templateType = 'welcome') {
            const cleanPhone = this._cleanPhone(playerData.phone || '');
            const name = (playerData.name || 'Jugador').trim().split(' ')[0];
            const cat = playerData.category || 'Equipo';

            let msg = '';
            if (templateType === 'trial') {
                msg = `¡Hola ${name}! 👋 Te escribo de SomosPadel BCN en relación a tu solicitud para la categoría *${cat}* (Temporada Oct-Nov). 🎾\n\nNos gustaría invitarte a un partido / entreno de prueba de nivel para ver cómo encajas en el equipo. ¿Qué disponibilidad de tardes tienes esta semana?`;
            } else if (templateType === 'confirmed') {
                msg = `¡Enhorabuena ${name}! 🎉 Te confirmamos tu plaza oficial en el equipo *${cat}* para la Temporada 2027 de SomosPadel BCN (Octubre - Noviembre). 🏆\n\nEn breve te añadiremos al grupo de WhatsApp del equipo con el capitán. ¡Bienvenido a la competición! 💪`;
            } else {
                msg = `¡Hola ${name}! 👋 Te contactamos de la dirección de SomosPadel BCN. Hemos recibido tu solicitud para los Equipos de la Temporada 2027 (*${cat}*, Nivel ${playerData.level || '3.5'}). 🎾\n\n¿Tienes alguna duda sobre los entrenos o la competición? Estamos cuadrando las plantillas de los equipos.`;
            }

            return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
        }

        /**
         * Comprueba de forma síncrona si la campaña está activa (lectura rápida de localStorage).
         * Por defecto devuelve FALSE (inactiva) hasta que el admin la active.
         * @returns {boolean}
         */
        isCampaignActiveSync() {
            try {
                if (typeof localStorage === 'undefined') return false;
                return localStorage.getItem(CONFIG.STORAGE_KEY_ACTIVE) === 'true';
            } catch (e) {
                return false;
            }
        }

        /**
         * Comprueba en Firestore (con fallback a localStorage) si la campaña está habilitada en INICIO.
         * @returns {Promise<boolean>}
         */
        async isCampaignActive() {
            const db = this._getDb();
            if (db) {
                try {
                    const doc = await db.collection(CONFIG.CONFIG_COLLECTION).doc(CONFIG.CONFIG_DOC_ID).get();
                    if (doc.exists && typeof doc.data().is_active === 'boolean') {
                        const active = doc.data().is_active;
                        try {
                            localStorage.setItem(CONFIG.STORAGE_KEY_ACTIVE, String(active));
                        } catch (e) {}
                        return active;
                    }
                } catch (err) {
                    console.warn('⚠️ [SeasonCampaignService] Error consultando estado en Firestore:', err.message);
                }
            }
            return this.isCampaignActiveSync();
        }

        /**
         * Habilita o deshabilita la campaña de la temporada en INICIO (función para el Administrador).
         * Guarda en Firestore y en localStorage.
         * @param {boolean} active 
         * @returns {Promise<boolean>}
         */
        async setCampaignActive(active) {
            const isActive = Boolean(active);
            try {
                if (typeof localStorage !== 'undefined') {
                    localStorage.setItem(CONFIG.STORAGE_KEY_ACTIVE, String(isActive));
                }
            } catch (e) {}

            const db = this._getDb();
            if (db) {
                try {
                    await db.collection(CONFIG.CONFIG_COLLECTION).doc(CONFIG.CONFIG_DOC_ID).set({
                        is_active: isActive,
                        updatedAt: new Date().toISOString(),
                        updatedBy: 'admin'
                    }, { merge: true });
                    console.log(`✅ [SeasonCampaignService] Estado de campaña en INICIO actualizado a: ${isActive ? 'ACTIVADA' : 'DESACTIVADA'}`);
                } catch (err) {
                    console.warn('⚠️ [SeasonCampaignService] Error guardando estado en Firestore:', err.message);
                }
            }

            return isActive;
        }
    }

    // Instanciación del Singleton y exposición global
    const serviceInstance = new SeasonCampaignService();
    global.SeasonCampaignService = serviceInstance;

    // Log de inicialización
    console.log('🎾 [SeasonCampaignService] Servicio de Campaña de Temporada cargado v1.0');

})(typeof window !== 'undefined' ? window : this);
