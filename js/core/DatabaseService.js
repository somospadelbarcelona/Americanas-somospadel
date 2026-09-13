/**
 * DatabaseService.js (Global Version)
 * Wrapper para Firestore global.
 */
(function () {
    const db = window.firebase ? firebase.firestore() : null;

    const memoryCache = {}; // 🛡️ GLOBAL MEMORY CACHE (RAM)
    const pendingRequests = {}; // 🕒 IN-FLIGHT REQUEST TRACKER

    class DatabaseService {
        constructor(collectionName) {
            this.collectionName = collectionName;
            this.collection = db ? db.collection(collectionName) : null;
        }

        async getAll() {
            if (!this.collection) return [];

            const cacheKey = `all_${this.collectionName}`;

            // 1. 🥇 FIRST DEFENSE: MEMORY RAM CACHE (Instant)
            if (memoryCache[cacheKey]) {
                console.log(`⚡ [RAM-Cache] Serving ${this.collectionName} from memory`);
                return memoryCache[cacheKey];
            }

            // 2. 🥈 SECOND DEFENSE: IN-FLIGHT REQUEST (Prevents 429 during simultaneous loads)
            if (pendingRequests[cacheKey]) {
                console.log(`🕒 [Pending] Waiting for existing ${this.collectionName} request...`);
                return await pendingRequests[cacheKey];
            }

            // 3. 🥉 THIRD DEFENSE: INDEXEDDB CACHE
            if (window.CacheService) {
                const cached = await window.CacheService.get('database', cacheKey);
                if (cached) {
                    console.log(`🚀 [Cache] Serving ${this.collectionName} from IndexedDB`);
                    memoryCache[cacheKey] = cached; // Lift to RAM
                    return cached;
                }
            }

            // 4. 🌐 NETWORK FALLBACK (Only if needed)
            console.log(`🌐 [Network] Fetching ${this.collectionName} from Firestore...`);
            
            // Track this promise to prevent parallel calls
            pendingRequests[cacheKey] = (async () => {
                try {
                    const snapshot = await this.collection.get();
                    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    
                    memoryCache[cacheKey] = data; // Save to RAM

                    if (window.CacheService && data.length > 0) {
                        await window.CacheService.set('database', cacheKey, data, 1000 * 60 * 15);
                    }
                    return data;
                } finally {
                    delete pendingRequests[cacheKey];
                }
            })();

            return await pendingRequests[cacheKey];
        }

        async getById(id) {
            if (!this.collection) return null;

            const cacheKey = `doc_${this.collectionName}_${id}`;
            if (window.CacheService) {
                const cached = await window.CacheService.get('database', cacheKey);
                if (cached) return cached;
            }

            const doc = await this.collection.doc(id).get();
            if (!doc.exists) return null;
            const data = { id: doc.id, ...doc.data() };

            if (window.CacheService) {
                await window.CacheService.set('database', cacheKey, data, 1000 * 60 * 60); // Cache individual docs for 1h
            }
            return data;
        }

        async create(data) {
            if (!this.collection) return { id: 'offline-' + Date.now(), ...data };
            const docRef = await this.collection.add({
                ...data,
                created_at: firebase.firestore.FieldValue.serverTimestamp()
            });
            // Clear cache for this collection
            delete memoryCache[`all_${this.collectionName}`];
            if (window.CacheService) window.CacheService.remove('database', `all_${this.collectionName}`);

            window.dispatchEvent(new CustomEvent('eventModified', { detail: { collection: this.collectionName, id: docRef.id } }));

            return { id: docRef.id, ...data };
        }

        async update(id, data) {
            if (!this.collection) return { id, ...data };
            await this.collection.doc(id).update(data);
            // Clear cache
            delete memoryCache[`all_${this.collectionName}`];
            delete memoryCache[`doc_${this.collectionName}_${id}`];
            if (window.CacheService) {
                window.CacheService.remove('database', `all_${this.collectionName}`);
                window.CacheService.remove('database', `doc_${this.collectionName}_${id}`);
            }

            window.dispatchEvent(new CustomEvent('eventModified', { detail: { collection: this.collectionName, id } }));

            return { id, ...data };
        }

        async delete(id) {
            if (!this.collection) return;
            await this.collection.doc(id).delete();
            // Clear cache
            delete memoryCache[`all_${this.collectionName}`];
            delete memoryCache[`doc_${this.collectionName}_${id}`];
            if (window.CacheService) {
                window.CacheService.remove('database', `all_${this.collectionName}`);
                window.CacheService.remove('database', `doc_${this.collectionName}_${id}`);
            }

            window.dispatchEvent(new CustomEvent('eventModified', { detail: { collection: this.collectionName, id } }));
        }
    }

    DatabaseService.clearCache = function(collectionName) {
        if (collectionName) {
            delete memoryCache['all_' + collectionName];
            Object.keys(memoryCache).forEach(k => {
                if (k.startsWith('doc_' + collectionName + '_')) delete memoryCache[k];
            });
        } else {
            Object.keys(memoryCache).forEach(k => delete memoryCache[k]);
        }
    };
    window.clearDatabaseCache = DatabaseService.clearCache;

    // Factory method exposed globally
    window.createService = (collectionName) => new DatabaseService(collectionName);
    console.log("💾 DatabaseService Global Loaded");
})();
