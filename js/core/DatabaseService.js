/**
 * DatabaseService.js (Global Version)
 * Wrapper robusto y de alto rendimiento para Firestore global con caché multicapa (RAM + IndexedDB),
 * deduplicación de peticiones en vuelo, y control estricto de concurrencia.
 */
(function () {
    const memoryCache = {}; // 🛡️ GLOBAL MEMORY CACHE (RAM)
    const pendingRequests = {}; // 🕒 IN-FLIGHT REQUEST TRACKER (Request deduplication)
    const collectionVersions = {}; // 🔄 VERSION TRACKER (Prevents in-flight stale overwrites)

    class DatabaseService {
        constructor(collectionName) {
            this.collectionName = collectionName;
        }

        /**
         * Dynamic getter to resolve Firestore collection reference at runtime.
         * Solves the issue where DatabaseService was instantiated before window.db or firebase was initialized.
         */
        get collection() {
            const firestore = window.db || (window.firebase && typeof window.firebase.firestore === 'function' ? window.firebase.firestore() : null);
            return firestore ? firestore.collection(this.collectionName) : null;
        }

        /**
         * Helper: Bumps collection version to invalidate in-flight promises from saving obsolete data.
         */
        _bumpVersion() {
            collectionVersions[this.collectionName] = (collectionVersions[this.collectionName] || 0) + 1;
            return collectionVersions[this.collectionName];
        }

        /**
         * Helper: Exponential backoff retry execution for transient network or firestore failures.
         */
        async _retry(fn, retries = 2, delayMs = 300) {
            let lastError;
            for (let attempt = 0; attempt <= retries; attempt++) {
                try {
                    return await fn();
                } catch (err) {
                    lastError = err;
                    const isPermission = err?.code === 'permission-denied' || (err?.message && err.message.toLowerCase().includes('permission'));
                    if (isPermission || attempt === retries) {
                        throw err;
                    }
                    const waitTime = delayMs * Math.pow(2, attempt);
                    console.warn(`⚠️ [DatabaseService] Error in ${this.collectionName} (attempt ${attempt + 1}/${retries + 1}). Retrying in ${waitTime}ms...`, err?.message || err);
                    await new Promise(res => setTimeout(res, waitTime));
                }
            }
            throw lastError;
        }

        /**
         * Retrieve all documents from the collection with multi-tier cache defense & in-flight deduplication.
         * @param {Object|boolean} [options] - Options object { forceRefresh, retries } or boolean for forceRefresh
         */
        async getAll(options = {}) {
            const forceRefresh = options === true || !!options?.forceRefresh;
            const retries = typeof options?.retries === 'number' ? options.retries : 2;
            const cacheKey = `all_${this.collectionName}`;

            // 1. 🥇 FIRST DEFENSE: MEMORY RAM CACHE (Instant)
            if (!forceRefresh && memoryCache[cacheKey]) {
                console.log(`⚡ [RAM-Cache] Serving ${this.collectionName} from memory`);
                return memoryCache[cacheKey];
            }

            // 2. 🥈 SECOND DEFENSE: IN-FLIGHT REQUEST DEDUPLICATION (Prevents 429 & duplicate simultaneous queries)
            if (!forceRefresh && pendingRequests[cacheKey]) {
                console.log(`🕒 [Pending] Waiting for existing ${this.collectionName} request...`);
                return await pendingRequests[cacheKey];
            }

            // 3. 🥉 THIRD DEFENSE: INDEXEDDB CACHE
            if (!forceRefresh && window.CacheService) {
                try {
                    const cached = await window.CacheService.get('database', cacheKey);
                    if (cached && Array.isArray(cached) && cached.length > 0) {
                        console.log(`🚀 [Cache] Serving ${this.collectionName} from IndexedDB`);
                        memoryCache[cacheKey] = cached; // Lift to RAM
                        return cached;
                    }
                } catch (err) {
                    console.warn(`⚠️ [DatabaseService] Cache read error for ${this.collectionName}:`, err);
                }
            }

            // 4. 🌐 NETWORK FETCH WITH RETRIES AND VERSION-CONTROLLED CACHING
            console.log(`🌐 [Network] Fetching ${this.collectionName} from Firestore...`);
            const fetchVersion = collectionVersions[this.collectionName] || 0;

            pendingRequests[cacheKey] = (async () => {
                try {
                    const col = this.collection;
                    if (!col) {
                        console.warn(`⚠️ [DatabaseService] Firestore collection "${this.collectionName}" is not ready. Attempting cache fallback.`);
                        if (window.CacheService) {
                            const cached = await window.CacheService.get('database', cacheKey);
                            if (cached) return cached;
                        }
                        return memoryCache[cacheKey] || [];
                    }

                    const snapshot = await this._retry(() => col.get(), retries);
                    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                    // Only update cache if no concurrent mutation invalidated this version during fetch
                    if ((collectionVersions[this.collectionName] || 0) === fetchVersion) {
                        memoryCache[cacheKey] = data; // Save to RAM
                        if (window.CacheService && data.length > 0) {
                            window.CacheService.set('database', cacheKey, data, 1000 * 60 * 15).catch(() => {});
                        }
                    } else {
                        console.log(`ℹ️ [DatabaseService] In-flight fetch for "${this.collectionName}" superseded by newer write mutation.`);
                    }

                    return data;
                } catch (err) {
                    console.error(`❌ [DatabaseService] Error fetching collection "${this.collectionName}":`, err);

                    // Offline / error resilience fallback: Try IndexedDB even if stale
                    if (window.CacheService) {
                        try {
                            const fallback = await window.CacheService.get('database', cacheKey);
                            if (fallback && Array.isArray(fallback)) {
                                console.warn(`🛡️ [DatabaseService] Fallback served ${fallback.length} items from IndexedDB for "${this.collectionName}".`);
                                return fallback;
                            }
                        } catch (_) {}
                    }
                    return memoryCache[cacheKey] || [];
                } finally {
                    delete pendingRequests[cacheKey];
                }
            })();

            return await pendingRequests[cacheKey];
        }

        /**
         * Retrieve a single document by ID with multi-tier cache defense.
         * @param {string} id - Document ID
         * @param {Object|boolean} [options] - Options or boolean for forceRefresh
         */
        async getById(id, options = {}) {
            if (!id) return null;
            const forceRefresh = options === true || !!options?.forceRefresh;
            const retries = typeof options?.retries === 'number' ? options.retries : 2;
            const cacheKey = `doc_${this.collectionName}_${id}`;

            // 1. RAM Cache check
            if (!forceRefresh && memoryCache[cacheKey]) {
                return memoryCache[cacheKey];
            }

            // 2. Check if already present in collection's 'all' RAM cache
            const allKey = `all_${this.collectionName}`;
            if (!forceRefresh && Array.isArray(memoryCache[allKey])) {
                const found = memoryCache[allKey].find(doc => doc && (doc.id === id || doc._id === id));
                if (found) {
                    memoryCache[cacheKey] = found;
                    return found;
                }
            }

            // 3. In-flight request deduplication
            if (!forceRefresh && pendingRequests[cacheKey]) {
                return await pendingRequests[cacheKey];
            }

            // 4. IndexedDB check
            if (!forceRefresh && window.CacheService) {
                try {
                    const cached = await window.CacheService.get('database', cacheKey);
                    if (cached) {
                        memoryCache[cacheKey] = cached;
                        return cached;
                    }
                } catch (_) {}
            }

            // 5. Network fetch with retry
            pendingRequests[cacheKey] = (async () => {
                try {
                    const col = this.collection;
                    if (!col) return null;

                    const doc = await this._retry(() => col.doc(id).get(), retries);
                    if (!doc || !doc.exists) return null;

                    const data = { id: doc.id, ...doc.data() };
                    memoryCache[cacheKey] = data;

                    if (window.CacheService) {
                        window.CacheService.set('database', cacheKey, data, 1000 * 60 * 60).catch(() => {});
                    }
                    return data;
                } catch (err) {
                    console.error(`❌ [DatabaseService] getById("${id}") error in "${this.collectionName}":`, err);
                    return memoryCache[cacheKey] || null;
                } finally {
                    delete pendingRequests[cacheKey];
                }
            })();

            return await pendingRequests[cacheKey];
        }

        /**
         * Create a new document in Firestore with cache invalidation and event dispatch.
         * @param {Object} data - Document data to insert
         */
        async create(data) {
            if (!data || typeof data !== 'object') {
                throw new Error(`[DatabaseService] Invalid data provided to create in "${this.collectionName}".`);
            }

            this._bumpVersion();
            this.invalidateCache();

            const serverTs = (window.firebase && window.firebase.firestore && window.firebase.firestore.FieldValue)
                ? window.firebase.firestore.FieldValue.serverTimestamp()
                : new Date().toISOString();

            const payload = {
                ...data,
                created_at: data.created_at || serverTs,
                updated_at: serverTs
            };

            const col = this.collection;
            if (!col) {
                console.warn(`⚠️ [DatabaseService] Offline/No Firestore: Generated local record for "${this.collectionName}".`);
                const offlineId = 'offline-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
                const offlineObj = { id: offlineId, ...payload, _isOffline: true };
                memoryCache[`doc_${this.collectionName}_${offlineId}`] = offlineObj;
                window.dispatchEvent(new CustomEvent('eventModified', {
                    detail: { collection: this.collectionName, id: offlineId, action: 'create' }
                }));
                return offlineObj;
            }

            try {
                let docId = data.id;
                if (docId) {
                    await this._retry(() => col.doc(docId).set(payload, { merge: true }));
                } else {
                    const docRef = await this._retry(() => col.add(payload));
                    docId = docRef.id;
                }

                const result = { id: docId, ...payload };
                memoryCache[`doc_${this.collectionName}_${docId}`] = result;

                window.dispatchEvent(new CustomEvent('eventModified', {
                    detail: { collection: this.collectionName, id: docId, action: 'create' }
                }));

                return result;
            } catch (err) {
                console.error(`❌ [DatabaseService] Failed to create in "${this.collectionName}":`, err);
                throw err;
            }

        }

        /**
         * Update an existing document by ID with automatic timestamping and cache invalidation.
         * @param {string} id - Document ID
         * @param {Object} data - Document fields to update
         */
        async update(id, data) {
            if (!id || !data) {
                throw new Error(`[DatabaseService] ID and data required to update in "${this.collectionName}".`);
            }

            this._bumpVersion();
            this.invalidateCache(id);

            const serverTs = (window.firebase && window.firebase.firestore && window.firebase.firestore.FieldValue)
                ? window.firebase.firestore.FieldValue.serverTimestamp()
                : new Date().toISOString();

            const updatePayload = {
                ...data,
                updated_at: serverTs
            };

            const col = this.collection;
            if (!col) {
                console.warn(`⚠️ [DatabaseService] Offline update simulated for "${this.collectionName}/${id}".`);
                const result = { id, ...updatePayload };
                memoryCache[`doc_${this.collectionName}_${id}`] = result;
                window.dispatchEvent(new CustomEvent('eventModified', {
                    detail: { collection: this.collectionName, id, action: 'update' }
                }));
                return result;
            }

            try {
                await this._retry(() => col.doc(id).update(updatePayload));
                const result = { id, ...updatePayload };
                memoryCache[`doc_${this.collectionName}_${id}`] = result;

                window.dispatchEvent(new CustomEvent('eventModified', {
                    detail: { collection: this.collectionName, id, action: 'update' }
                }));

                return result;
            } catch (err) {
                console.error(`❌ [DatabaseService] Failed to update document "${id}" in "${this.collectionName}":`, err);
                throw err;
            }
        }

        /**
         * Delete a document by ID with cache invalidation.
         * @param {string} id - Document ID to delete
         */
        async delete(id) {
            if (!id) return false;

            this._bumpVersion();
            this.invalidateCache(id);

            const col = this.collection;
            if (!col) {
                console.warn(`⚠️ [DatabaseService] Offline delete simulated for "${this.collectionName}/${id}".`);
                window.dispatchEvent(new CustomEvent('eventModified', {
                    detail: { collection: this.collectionName, id, action: 'delete' }
                }));
                return true;
            }

            try {
                await this._retry(() => col.doc(id).delete());
                window.dispatchEvent(new CustomEvent('eventModified', {
                    detail: { collection: this.collectionName, id, action: 'delete' }
                }));
                return true;
            } catch (err) {
                console.error(`❌ [DatabaseService] Failed to delete document "${id}" in "${this.collectionName}":`, err);
                throw err;
            }
        }

        /**
         * Invalidate RAM and IndexedDB caches for this collection or a specific document.
         * @param {string|null} [id=null] - Document ID if specific, null for whole collection
         */
        invalidateCache(id = null) {
            const allKey = `all_${this.collectionName}`;
            delete memoryCache[allKey];
            delete pendingRequests[allKey];

            if (window.CacheService) {
                window.CacheService.remove('database', allKey).catch(() => {});
            }

            if (id) {
                const docKey = `doc_${this.collectionName}_${id}`;
                delete memoryCache[docKey];
                delete pendingRequests[docKey];
                if (window.CacheService) {
                    window.CacheService.remove('database', docKey).catch(() => {});
                }
            } else {
                const prefix = `doc_${this.collectionName}_`;
                Object.keys(memoryCache).forEach(k => {
                    if (k.startsWith(prefix)) {
                        delete memoryCache[k];
                        delete pendingRequests[k];
                        if (window.CacheService) {
                            window.CacheService.remove('database', k).catch(() => {});
                        }
                    }
                });
            }

            window.dispatchEvent(new CustomEvent('eventModified', { detail: { collection: this.collectionName, id } }));
        }
    }

    /**
     * Static cache clearer: Invalidates memory cache and IndexedDB storage.
     * @param {string|null} [collectionName] - Specific collection or all collections
     */
    DatabaseService.clearCache = function (collectionName) {
        if (collectionName) {
            const prefixAll = 'all_' + collectionName;
            const prefixDoc = 'doc_' + collectionName + '_';

            delete memoryCache[prefixAll];
            delete pendingRequests[prefixAll];

            if (window.CacheService) {
                window.CacheService.remove('database', prefixAll).catch(() => {});
            }

            Object.keys(memoryCache).forEach(k => {
                if (k.startsWith(prefixDoc)) {
                    delete memoryCache[k];
                    delete pendingRequests[k];
                    if (window.CacheService) {
                        window.CacheService.remove('database', k).catch(() => {});
                    }
                }
            });
        } else {
            Object.keys(memoryCache).forEach(k => delete memoryCache[k]);
            Object.keys(pendingRequests).forEach(k => delete pendingRequests[k]);
            if (window.CacheService && typeof window.CacheService.clearStore === 'function') {
                window.CacheService.clearStore('database').catch(() => {});
            }
        }
    };

    window.clearDatabaseCache = DatabaseService.clearCache;
    window.DatabaseService = DatabaseService;

    // Factory method exposed globally
    window.createService = (collectionName) => new DatabaseService(collectionName);
    console.log("💾 DatabaseService Global Loaded (Dynamic & Resilient)");
})();
