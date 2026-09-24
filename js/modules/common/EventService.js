/**
 * EventService.js
 * Unified business logic for managing Events (Americanas & Entrenos).
 * Handles creation, updates, deletion, and validation.
 */

window.EventService = {

    /**
     * Create a new event (Americana or Entreno)
     * @param {string} type - 'americana' or 'entreno'
     * @param {object} data - Form data or object
     * @returns {Promise<object>} Created event
     */
    async createEvent(type, data) {
        this._validateEventType(type);

        // normalizing inputs
        const courts = parseInt(data.max_courts || data.courts) || AppConstants.DEFAULTS.MAX_COURTS;
        const payload = {
            ...data,
            name: (data.name || '').toUpperCase(),
            price_members: parseFloat(data.price_members) || AppConstants.DEFAULTS.PRICE_MEMBERS,
            price_external: parseFloat(data.price_external) || AppConstants.DEFAULTS.PRICE_EXTERNAL,
            max_courts: courts,
            courts: courts,
            max_players: courts * 4,
            status: AppConstants.STATUS.OPEN,
            createdAt: new Date().toISOString(),

            // Initialize collections
            players: [],
            registeredPlayers: [],
            fixed_pairs: [],
            waitlist: []
        };

        // Determine Collection
        const collection = type === AppConstants.EVENT_TYPES.AMERICANA ? FirebaseDB.americanas : FirebaseDB.entrenos;

        try {
            const result = await collection.create(payload);
            console.log(`✅ [EventService] ${type} created:`, result);
            if (window.clearDatabaseCache) window.clearDatabaseCache(type === 'entreno' ? 'entrenos' : 'americanas');
            // NOTE: eventModified is dispatched by FirebaseDB — do NOT dispatch here (would cause double-dispatch)
            return result;
        } catch (error) {
            console.error(`❌ [EventService] Create Error:`, error);
            throw error;
        }
    },

    /**
     * Update an existing event
     * @param {string} type 
     * @param {string} id 
     * @param {object} updates 
     */
    async updateEvent(type, id, updates) {
        this._validateEventType(type);
        const collection = type === AppConstants.EVENT_TYPES.AMERICANA ? FirebaseDB.americanas : FirebaseDB.entrenos;

        try {
            // Basic Validation & Court Capacity Synchronization
            const cleanUpdates = { ...updates };
            if (cleanUpdates.max_courts !== undefined || cleanUpdates.courts !== undefined) {
                const c = parseInt(cleanUpdates.max_courts || cleanUpdates.courts);
                if (c && c >= 1) {
                    cleanUpdates.max_courts = c;
                    cleanUpdates.courts = c;
                    cleanUpdates.max_players = c * 4;
                } else if (cleanUpdates.max_courts < 1) {
                    throw new Error("Max courts must be at least 1");
                }
            }

            await collection.update(id, cleanUpdates);
            console.log(`✅ [EventService] ${type} updated: ${id}`);
            if (window.clearDatabaseCache) window.clearDatabaseCache(type === 'entreno' ? 'entrenos' : 'americanas');
            // NOTE: eventModified is dispatched by FirebaseDB — do NOT dispatch here (would cause double-dispatch)
        } catch (error) {
            console.error(`❌ [EventService] Update Error:`, error);
            throw error;
        }
    },

    /**
     * Delete an event
     * @param {string} type 
     * @param {string} id 
     */
    async deleteEvent(type, id) {
        this._validateEventType(type);
        const collection = type === AppConstants.EVENT_TYPES.AMERICANA ? FirebaseDB.americanas : FirebaseDB.entrenos;

        try {
            await collection.delete(id);
            // TODO: Optional - delete associated matches?
            console.log(`✅ [EventService] ${type} deleted: ${id}`);
            if (window.clearDatabaseCache) window.clearDatabaseCache(type === 'entreno' ? 'entrenos' : 'americanas');
            // NOTE: eventModified is dispatched by FirebaseDB — do NOT dispatch here (would cause double-dispatch)
        } catch (error) {
            console.error(`❌ [EventService] Delete Error:`, error);
            throw error;
        }
    },

    /**
     * Get all events of a type
     */
    async getAll(type) {
        this._validateEventType(type);
        const collection = type === AppConstants.EVENT_TYPES.AMERICANA ? FirebaseDB.americanas : FirebaseDB.entrenos;
        return await collection.getAll();
    },

    /**
     * Get single event by ID
     */
    async getById(type, id) {
        this._validateEventType(type);
        const collection = type === AppConstants.EVENT_TYPES.AMERICANA ? FirebaseDB.americanas : FirebaseDB.entrenos;
        return await collection.getById(id);
    },

    /**
     * Helper to get the correct Image URL based on config
     */
    getAutoImage(location, category, type = 'entreno') {
        const cat = category || 'open';

        if (location === 'Barcelona Pádel el Prat') {
            // Use Americana images if type is Americana, else Entreno (PRAT default)
            if (type === AppConstants.EVENT_TYPES.AMERICANA) {
                return AppConstants.IMAGES.AMERICANA[cat] || AppConstants.IMAGES.AMERICANA.open;
            }
            return AppConstants.IMAGES.PRAT[cat] || AppConstants.IMAGES.PRAT.open;
        }

        if (location === 'Delfos Cornellá') {
            // Simplified logic for Delfos based on existing code, can be expanded
            if (type === AppConstants.EVENT_TYPES.AMERICANA) return 'img/delfos.png';
            return AppConstants.IMAGES.DELFOS[cat] || AppConstants.IMAGES.DELFOS.open;
        }

        // Fallback for other locations
        return AppConstants.IMAGES.BALLS[cat] || AppConstants.IMAGES.BALLS.mixed;
    },

    _validateEventType(type) {
        if (type !== 'americana' && type !== 'entreno') {
            throw new Error(`Invalid Event Type: ${type}`);
        }
    },

    /**
     * Normaliza cualquier formato de fecha a 'YYYY-MM-DD'
     * Soporta: '2026-09-24', '24/09/2026', '24/09/26', '24/09'
     */
    normalizeDate(d) {
        if (!d) return '';
        if (typeof d !== 'string') {
            try {
                if (d.toDate && typeof d.toDate === 'function') {
                    d = d.toDate().toISOString().split('T')[0];
                } else if (d instanceof Date) {
                    d = d.toISOString().split('T')[0];
                } else {
                    d = String(d);
                }
            } catch (err) {
                return '';
            }
        }
        d = d.trim();
        if (d.includes('/')) {
            const parts = d.split('/').map(p => p.trim());
            if (parts.length >= 2) {
                const day = parts[0].padStart(2, '0');
                const month = parts[1].padStart(2, '0');
                let year = parts[2];
                if (!year) {
                    year = String(new Date().getFullYear());
                } else if (year.length === 2) {
                    year = '20' + year;
                }
                return `${year}-${month}-${day}`;
            }
        }
        return d;
    },

    /**
     * Calcula fechas Date de inicio y fin para un evento
     */
    getEventTimes(dateStr, timeStr = '', timeEndStr = '') {
        const normDate = this.normalizeDate(dateStr);
        if (!normDate || !/^\d{4}-\d{2}-\d{2}$/.test(normDate)) return null;

        let startH = 10, startM = 0;
        let endH = null, endM = null;

        const rawTime = (timeStr || '').trim();
        const rawTimeEnd = (timeEndStr || '').trim();

        if (rawTime.includes('-')) {
            const parts = rawTime.split('-');
            const sClean = parts[0].replace(/[^\d:]/g, '').trim();
            const eClean = parts[1].replace(/[^\d:]/g, '').trim();
            if (sClean) {
                const [h, m = 0] = sClean.split(':').map(Number);
                if (!isNaN(h)) { startH = h; startM = isNaN(m) ? 0 : m; }
            }
            if (eClean) {
                const [h, m = 0] = eClean.split(':').map(Number);
                if (!isNaN(h)) { endH = h; endM = isNaN(m) ? 0 : m; }
            }
        } else if (rawTime.toLowerCase().includes(' a ')) {
            const parts = rawTime.toLowerCase().split(' a ');
            const sClean = parts[0].replace(/[^\d:]/g, '').trim();
            const eClean = parts[1].replace(/[^\d:]/g, '').trim();
            if (sClean) {
                const [h, m = 0] = sClean.split(':').map(Number);
                if (!isNaN(h)) { startH = h; startM = isNaN(m) ? 0 : m; }
            }
            if (eClean) {
                const [h, m = 0] = eClean.split(':').map(Number);
                if (!isNaN(h)) { endH = h; endM = isNaN(m) ? 0 : m; }
            }
        } else if (rawTime) {
            const sClean = rawTime.replace(/[^\d:]/g, '').trim();
            if (sClean) {
                const [h, m = 0] = sClean.split(':').map(Number);
                if (!isNaN(h)) { startH = h; startM = isNaN(m) ? 0 : m; }
            }
        }

        if (rawTimeEnd && endH === null) {
            const eClean = rawTimeEnd.replace(/[^\d:]/g, '').trim();
            if (eClean) {
                const [h, m = 0] = eClean.split(':').map(Number);
                if (!isNaN(h)) { endH = h; endM = isNaN(m) ? 0 : m; }
            }
        }

        const [y, mo, da] = normDate.split('-').map(Number);
        const start = new Date(y, mo - 1, da, startH, startM, 0);

        let end;
        if (endH !== null) {
            end = new Date(y, mo - 1, da, endH, endM !== null ? endM : 0, 0);
            if (end < start) {
                end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
            }
        } else {
            // Duración estándar para americana o entreno: 105 minutos (1h 45m)
            end = new Date(start.getTime() + 105 * 60 * 1000);
        }

        return { start, end, normDate };
    },

    /**
     * Determina con exactitud si un evento (americana o entreno) ya ha acabado
     * @param {object} evt 
     * @returns {boolean}
     */
    isEventFinished(evt) {
        if (!evt) return false;
        const status = (evt.status || '').toLowerCase().trim();
        if (status === 'finished' || status === 'finalizado' || status === 'completed' || status === 'cancelled') {
            return true;
        }

        const times = this.getEventTimes(evt.date, evt.time, evt.time_end);
        if (!times) return false;

        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        // 1. Si la fecha ya es anterior a hoy -> acabado sin duda
        if (times.normDate < todayStr) {
            return true;
        }

        // 2. Si es de hoy pero la hora de fin ya transcurrió -> acabado
        if (now >= times.end) {
            return true;
        }

        return false;
    },

    /**
     * Auto-detecta eventos vencidos y los actualiza silenciosamente en Firestore
     * para mantener la base de datos limpia y sincronizada para todos los usuarios.
     */
    autoCheckAndFinishEvents(events) {
        if (!Array.isArray(events) || events.length === 0) return;
        const now = new Date();

        events.forEach(evt => {
            if (!evt || !evt.id) return;
            const currentStatus = (evt.status || '').toLowerCase().trim();
            if (currentStatus === 'finished' || currentStatus === 'finalizado' || currentStatus === 'cancelled') return;

            if (this.isEventFinished(evt)) {
                console.log(`🏁 [EventService] Auto-detectado evento acabado: ${evt.name || evt.id} (${evt.date} ${evt.time})`);
                evt.status = 'finished'; // Mutar en memoria local inmediata
                const eventType = evt.type === 'entreno' ? 'entreno' : 'americana';
                
                // Actualizar en base de datos en segundo plano
                this.updateEvent(eventType, evt.id, { status: 'finished' }).catch(err => {
                    console.warn(`[EventService] No se pudo persistir status finished para ${evt.id}:`, err);
                });
            }
        });
    }
};
console.log("🚀 EventService Loaded");
