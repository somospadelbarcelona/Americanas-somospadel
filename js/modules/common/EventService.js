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
    }
};
console.log("🚀 EventService Loaded");
